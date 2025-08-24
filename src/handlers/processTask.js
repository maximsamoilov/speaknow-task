const { createLogger } = require('../utils/logger');
const SQSService = require('../services/sqsService');
const DynamoDBService = require('../services/dynamoService');
const TaskProcessingService = require('../services/taskProcessingService');

/**
 * Calculates delay for exponential backoff
 * @param {number} retryCount - retry attempt number (starting from 0)
 * @returns {number} delay in seconds
 */
function calculateExponentialBackoff(retryCount) {
  const baseDelay = 2;
  const maxDelay = 300; // 5 minutes maximum
  const jitter = Math.random() * 0.1;

  const delay = Math.min(Math.pow(baseDelay, retryCount), maxDelay);
  return Math.floor(delay * (1 + jitter));
}

exports.handler = async (event, context) => {
  const logger = createLogger(context);

  const sqsService = new SQSService();
  const dynamoService = new DynamoDBService();
  const taskProcessor = new TaskProcessingService();

  try {
    logger.info('Processing SQS messages', {
      recordCount: event.Records.length,
    });

    for (const record of event.Records) {
      try {
        const task = JSON.parse(record.body);
        const { taskId } = task;

        logger.info('Processing task', { taskId });

        await dynamoService.updateTaskStatus(taskId, 'processing', {
          processingStartedAt: new Date().toISOString(),
        });

        try {
          const result = await taskProcessor.processTask(task);

          await dynamoService.updateTaskStatus(taskId, 'completed', {
            completedAt: new Date().toISOString(),
            result: result.result,
          });

          logger.info('Task processed successfully', {
            taskId,
            completedAt: result.processedAt,
          });
        } catch (processingError) {
          logger.error('Task processing failed', {
            taskId,
            error: processingError.message,
          });

          const updatedTask = await dynamoService.incrementRetryCount(taskId);
          const retryCount = updatedTask.retryCount || 0;

          const maxRetries = 3;

          if (retryCount >= maxRetries) {
            logger.error('Max retries exceeded, sending to DLQ', {
              taskId,
              retryCount,
              maxRetries,
            });

            await dynamoService.updateTaskStatus(taskId, 'failed', {
              failedAt: new Date().toISOString(),
              lastError: processingError.message,
              retryCount,
              reason: 'Max retries exceeded',
            });

            await sqsService.sendToDLQ({
              ...task,
              retryCount,
              finalError: processingError.message,
              failedAt: new Date().toISOString(),
            });

            logger.info('Task sent to DLQ and removed from main queue', { taskId });
          } else {
            const delaySeconds = calculateExponentialBackoff(retryCount);

            logger.info('Scheduling retry with exponential backoff', {
              taskId,
              retryCount,
              delaySeconds,
            });

            await dynamoService.updateTaskStatus(taskId, 'retry_scheduled', {
              retryScheduledAt: new Date().toISOString(),
              lastError: processingError.message,
              retryCount,
              nextRetryAt: new Date(Date.now() + delaySeconds * 1000).toISOString(),
            });

            await sqsService.sendTaskWithDelay(
              {
                ...task,
                retryCount,
                originalTaskId: taskId,
              },
              delaySeconds,
            );

            logger.info('Task rescheduled for retry', {
              taskId,
              retryCount,
              delaySeconds,
            });
          }
        }
      } catch (messageError) {
        logger.error('Error processing SQS message', {
          messageId: record.messageId,
          error: messageError.message,
        });

        throw messageError;
      }
    }

    logger.info('All SQS messages processed successfully');
  } catch (error) {
    logger.error('Unexpected error in processTask handler', {
      error: error.message,
    });

    throw error;
  }
};
