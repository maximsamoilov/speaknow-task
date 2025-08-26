# Fault-Tolerant System

A serverless fault-tolerant backend system built with AWS Lambda, SQS, and DynamoDB for reliable task processing with automatic retries and dead letter queue handling.

## Architecture

- **API Gateway + Lambda**: Task submission endpoint
- **SQS**: Main task queue and Dead Letter Queue (DLQ)
- **DynamoDB**: Task state management
- **Lambda Functions**: Task processing with retry logic
- **CloudWatch**: Logging and monitoring

## Features

- Automatic task retry with exponential backoff
- Dead Letter Queue for failed tasks
- Task state tracking in DynamoDB
- Comprehensive logging and monitoring
- Local development with LocalStack

## Quick Start

1. **Setup environment**:
   ```bash
   ./scripts/setup.sh
   ```

2. **Start local development**:
   ```bash
   ./scripts/start-local.sh
   ```

3. **Test the API**:
   ```bash
   ./scripts/test-api.sh <api_gateway_endpoint>
   ```

## Project Structure

```
src/
├── handlers/           # Lambda function handlers
├── services/           # Business logic services
└── utils/             # Utilities and helpers
scripts/               # Development and testing scripts
```

## Deployment

- **Local**: `npm run deploy:local`
- **Development**: `npm run deploy`
