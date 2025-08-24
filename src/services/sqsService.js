const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { createAWSConfig } = require('../utils/awsConfig');

class SQSService {
  constructor() {
    const isLocal = process.env.STAGE === 'local';

    this.client = new SQSClient(createAWSConfig(isLocal));

    this.taskQueueUrl = process.env.TASK_QUEUE_URL;
    this.dlqUrl = process.env.DLQ_URL;

    if (!this.taskQueueUrl) {
      throw new Error('TASK_QUEUE_URL environment variable is not set');
    }

    if (!this.dlqUrl) {
      throw new Error('DLQ_URL environment variable is not set');
    }
  }

  async sendMessage(queueUrl, messageBody, delaySeconds = 0) {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
      DelaySeconds: delaySeconds,
    });

    try {
      const result = await this.client.send(command);
      return result;
    } catch (error) {
      throw new Error(`Failed to send message to SQS: ${error.message}`);
    }
  }

  async sendTaskToQueue(task) {
    return this.sendMessage(this.taskQueueUrl, task);
  }

  async sendTaskWithDelay(task, delaySeconds) {
    return this.sendMessage(this.taskQueueUrl, task, delaySeconds);
  }

  async sendToDLQ(task) {
    return this.sendMessage(this.dlqUrl, task);
  }
}

module.exports = SQSService;
