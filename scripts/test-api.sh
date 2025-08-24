#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <api-gateway-url>"
    echo "Example: $0 https://abc123.execute-api.eu-central-1.amazonaws.com/dev"
    exit 1
fi

API_URL="$1"
ENDPOINT="${API_URL}/tasks"

echo "Testing Fault-Tolerant System API"
echo "Endpoint: $ENDPOINT"
echo ""

echo "Test 1: Submitting valid task..."
TASK_ID="test-$(date +%s)-1"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"$TASK_ID\",
    \"payload\": {
      \"type\": \"test\",
      \"data\": \"sample data\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }")

echo "Response: $RESPONSE"
echo ""

echo "Test 2: Submitting complex task..."
TASK_ID="test-$(date +%s)-2"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"$TASK_ID\",
    \"payload\": {
      \"type\": \"complex\",
      \"data\": {
        \"nested\": {
          \"value\": 42,
          \"array\": [1, 2, 3, 4, 5]
        },
        \"processing_options\": {
          \"timeout\": 30,
          \"retries\": 3
        }
      },
      \"metadata\": {
        \"source\": \"test-script\",
        \"version\": \"1.0\"
      }
    }
  }")

echo "Response: $RESPONSE"
echo ""

echo "Test 3: Submitting invalid task (missing payload)..."
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"invalid-task\"
  }")

echo "Response: $RESPONSE"
echo ""

echo "Test 4: Submitting multiple tasks to test failure simulation..."
for i in {1..15}; do
    TASK_ID="batch-test-$(date +%s)-$i"
    RESPONSE=$(curl -s -X POST "$ENDPOINT" \
      -H "Content-Type: application/json" \
      -d "{
        \"taskId\": \"$TASK_ID\",
        \"payload\": {
          \"type\": \"batch\",
          \"batch_number\": $i,
          \"data\": \"This is batch task number $i\"
        }
      }")
    
    echo "Task $i Response: $RESPONSE"
    sleep 1
done

echo ""
echo "Tests completed!"
echo "Check CloudWatch logs to see task processing results and any failures."
echo "Some tasks should succeed, some should fail and be retried, and some should end up in DLQ."
