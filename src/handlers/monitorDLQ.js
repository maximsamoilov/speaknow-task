const { createLogger } = require('../utils/logger');
const DynamoDBService = require('../services/dynamoService');

exports.handler = async (event, context) => {
  const logger = createLogger(context);

  const dynamoService = new DynamoDBService();

  try {
    logger.info('Monitoring DLQ messages', {
      recordCount: event.Records.length,
    });

    for (const record of event.Records) {
      try {
        const failedTask = JSON.parse(record.body);
        const { taskId } = failedTask;

        logger.info('Processing DLQ message', { taskId });

        const currentTask = await dynamoService.getTask(taskId);

        if (!currentTask) {
          logger.warn('Task not found in DynamoDB', { taskId });
          continue;
        }

        await dynamoService.updateTaskStatus(taskId, 'dead_letter', {
          movedToDLQAt: new Date().toISOString(),
          finalRetryCount: currentTask.retryCount || 0,
          dlqReason: 'Maximum retry attempts exceeded',
        });

        logger.error('Task moved to Dead Letter Queue', {
          taskId,
          originalPayload: failedTask.payload,
          retryCount: currentTask.retryCount || 0,
          lastError: currentTask.lastError || 'Unknown error',
          createdAt: failedTask.createdAt,
          movedToDLQAt: new Date().toISOString(),
          processingHistory: {
            status: currentTask.status,
            processingStartedAt: currentTask.processingStartedAt,
            failedAt: currentTask.failedAt,
            updatedAt: currentTask.updatedAt,
          },
        });

        logger.info('DLQ metrics', {
          metric: 'task_failed_permanently',
          taskId,
          retryCount: currentTask.retryCount || 0,
          timeToFailure: currentTask.failedAt
            ? new Date(currentTask.failedAt).getTime() - new Date(failedTask.createdAt).getTime()
            : null,
        });
      } catch (messageError) {
        logger.error('Error processing DLQ message', {
          messageId: record.messageId,
          error: messageError.message,
          messageBody: record.body,
        });

        continue;
      }
    }

    logger.info('All DLQ messages processed');
  } catch (error) {
    logger.error('Unexpected error in monitorDLQ handler', {
      error: error.message,
    });
  }
};
