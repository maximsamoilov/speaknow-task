const validateTaskPayload = (data) => {
  if (!data) {
    throw new Error('Request body is required');
  }

  if (!data.taskId) {
    throw new Error('taskId is required');
  }

  if (typeof data.taskId !== 'string') {
    throw new Error('taskId must be a string');
  }

  if (!data.payload) {
    throw new Error('payload is required');
  }

  if (typeof data.payload !== 'object') {
    throw new Error('payload must be an object');
  }

  return true;
};

const sanitizeTaskData = (data) => {
  return {
    taskId: String(data.taskId).trim(),
    payload: data.payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };
};

module.exports = {
  validateTaskPayload,
  sanitizeTaskData,
};
