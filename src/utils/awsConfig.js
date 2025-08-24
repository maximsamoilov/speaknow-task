/**
 * Determines the correct hostname for LocalStack
 * @returns {string} hostname for LocalStack
 */
function getLocalStackHost() {
  if (process.env.LOCALSTACK_HOSTNAME) {
    return process.env.LOCALSTACK_HOSTNAME;
  } else if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return 'host.docker.internal';
  } else {
    return 'localhost';
  }
}

/**
 * Creates base configuration for AWS clients
 * @param {boolean} isLocal - local environment flag
 * @returns {object} configuration for AWS client
 */
function createAWSConfig(isLocal = false) {
  const config = {
    region: process.env.AWS_REGION || 'eu-central-1',
  };

  if (isLocal) {
    const localstackHost = getLocalStackHost();
    config.endpoint = `http://${localstackHost}:4566`;
    config.credentials = {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    };
    config.forcePathStyle = true;
  }

  return config;
}

module.exports = {
  getLocalStackHost,
  createAWSConfig,
};
