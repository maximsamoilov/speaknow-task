const { createLogger } = require('../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../utils/response');
const { validateTaskPayload, sanitizeTaskData } = require('../utils/validation');
const SQSService = require('../services/sqsService');
const DynamoDBService = require('../services/dynamoService');

exports.handler = async (event, context) => {
  const logger = createLogger(context);
  const sqsService = new SQSService();
  const dynamoService = new DynamoDBService();

  try {
    logger.info('Task submission request received', {
      method: event.httpMethod,
      path: event.path,
    });

    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      logger.error('Invalid JSON in request body', { error: parseError.message });
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    try {
      validateTaskPayload(requestBody);
    } catch (validationError) {
      logger.error('Validation failed', { error: validationError.message });
      return createErrorResponse(400, validationError.message);
    }

    const taskData = sanitizeTaskData(requestBody);

    logger.info('Processing task submission', { taskId: taskData.taskId });

    try {
      await dynamoService.putTask(taskData);
      logger.info('Task saved to DynamoDB', { taskId: taskData.taskId });

      const sqsResult = await sqsService.sendTaskToQueue(taskData);
      logger.info('Task sent to SQS queue', {
        taskId: taskData.taskId,
        messageId: sqsResult.MessageId,
      });

      return createSuccessResponse({
        taskId: taskData.taskId,
        status: 'submitted',
        messageId: sqsResult.MessageId,
        submittedAt: taskData.createdAt,
      });
    } catch (serviceError) {
      logger.error('Service error during task submission', {
        taskId: taskData.taskId,
        error: serviceError.message,
      });

      return createErrorResponse(500, 'Failed to submit task', serviceError);
    }
  } catch (error) {
    logger.error('Unexpected error in submitTask handler', { error: error.message });
    return createErrorResponse(500, 'Internal server error', error);
  }
};
