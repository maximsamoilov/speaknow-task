const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { createAWSConfig } = require('../utils/awsConfig');

class DynamoDBService {
  constructor() {
    const isLocal = process.env.STAGE === 'local';

    const client = new DynamoDBClient(createAWSConfig(isLocal));

    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.TASKS_TABLE;

    if (!this.tableName) {
      throw new Error('TASKS_TABLE environment variable is not set');
    }
  }

  async putTask(task) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...task,
        updatedAt: new Date().toISOString(),
      },
    });

    try {
      const result = await this.docClient.send(command);
      return result;
    } catch (error) {
      throw new Error(`Failed to put task in DynamoDB: ${error.message}`);
    }
  }

  async getTask(taskId) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { taskId },
    });

    try {
      const result = await this.docClient.send(command);
      return result.Item;
    } catch (error) {
      throw new Error(`Failed to get task from DynamoDB: ${error.message}`);
    }
  }

  async updateTaskStatus(taskId, status, additionalData = {}) {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { taskId },
      UpdateExpression:
        'SET #status = :status, updatedAt = :updatedAt' +
        Object.keys(additionalData)
          .map((_, index) => `, #attr${index} = :val${index}`)
          .join(''),
      ExpressionAttributeNames: {
        '#status': 'status',
        ...Object.keys(additionalData).reduce((acc, key, index) => {
          acc[`#attr${index}`] = key;
          return acc;
        }, {}),
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
        ...Object.keys(additionalData).reduce((acc, key, index) => {
          acc[`:val${index}`] = additionalData[key];
          return acc;
        }, {}),
      },
      ReturnValues: 'ALL_NEW',
    });

    try {
      const result = await this.docClient.send(command);
      return result.Attributes;
    } catch (error) {
      throw new Error(`Failed to update task status in DynamoDB: ${error.message}`);
    }
  }

  async incrementRetryCount(taskId) {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { taskId },
      UpdateExpression: 'ADD retryCount :inc SET updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    try {
      const result = await this.docClient.send(command);
      return result.Attributes;
    } catch (error) {
      throw new Error(`Failed to increment retry count in DynamoDB: ${error.message}`);
    }
  }
}

module.exports = DynamoDBService;
