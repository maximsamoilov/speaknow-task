const createResponse = (statusCode, body, headers = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

const createSuccessResponse = (data) => {
  return createResponse(200, {
    success: true,
    data,
  });
};

const createErrorResponse = (statusCode, message, error = null) => {
  const body = {
    success: false,
    message,
  };

  if (error && process.env.STAGE !== 'prod') {
    body.error = error.message || error;
  }

  return createResponse(statusCode, body);
};

module.exports = {
  createResponse,
  createSuccessResponse,
  createErrorResponse,
};
