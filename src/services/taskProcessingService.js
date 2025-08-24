class TaskProcessingService {
  constructor() {
    this.failureRate = 0.6;
  }

  async processTask(task) {
    const { taskId, payload } = task;

    await this.simulateProcessingTime();

    if (this.shouldSimulateFailure()) {
      const errorTypes = [
        () => {
          throw new Error(`Network timeout for task ${taskId}`);
        },
        () => {
          throw new Error(`Database connection failed for task ${taskId}`);
        },
        () => {
          throw new Error(`Invalid payload format for task ${taskId}`);
        },
        () => {
          throw new Error(`Memory limit exceeded for task ${taskId}`);
        },
        () => {
          throw new Error(`Service unavailable for task ${taskId}`);
        },
        () => {
          throw new Error(`Authentication failed for task ${taskId}`);
        },
      ];

      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      randomError();
    }

    const result = {
      taskId,
      processedAt: new Date().toISOString(),
      result: {
        processed: true,
        originalPayload: payload,
      },
    };

    return result;
  }

  async simulateProcessingTime() {
    const delay = Math.floor(Math.random() * 1900) + 100;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  shouldSimulateFailure() {
    return Math.random() < this.failureRate;
  }
}

module.exports = TaskProcessingService;
