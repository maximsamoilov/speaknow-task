#!/bin/bash

echo "Setting up environment variables..."
export STAGE=local
export TASKS_TABLE=fault-tolerant-system-tasks-local
export AWS_REGION=eu-central-1
export LOCALSTACK_HOSTNAME=localhost
export API_BASE_URL=http://localhost:4566

echo "Starting LocalStack..."
npm run localstack:start

echo "Waiting for LocalStack to be ready..."
sleep 10

echo "Deploying to LocalStack..."
npm run deploy:local