const createLogger = (context) => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const serviceName = process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown';
  const requestId = context?.awsRequestId || 'no-request-id';

  const formatMessage = (level, message, data = {}) => {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: serviceName,
      requestId,
      message,
      ...data,
    };
  };

  const log = (level, message, data = {}) => {
    const logMessage = formatMessage(level, message, data);
    console.log(JSON.stringify(logMessage));
  };

  return {
    info: (message, data = {}) => log('info', message, data),
    warn: (message, data = {}) => log('warn', message, data),
    error: (message, data = {}) => log('error', message, data),
    debug: (message, data = {}) => {
      if (logLevel === 'debug') {
        log('debug', message, data);
      }
    },
  };
};

module.exports = {
  createLogger,
};
