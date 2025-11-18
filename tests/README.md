# Lambda Function Testing Guide

This directory contains test files and scripts for testing Lambda functions in a Test-Driven Development (TDD) workflow.

## Structure

```
tests/
├── events/              # Test event files (inputs)
│   ├── onConnect-event.json
│   ├── onConnect-event-no-username.json
│   ├── onDisconnect-event.json
│   ├── sendMessage-event.json
│   └── sendMessage-event-anonymous.json
├── responses/           # Test response files (outputs) - auto-generated
├── test-lambdas.ps1     # PowerShell test script (Windows)
├── test-lambdas.sh      # Bash test script (Linux/Mac/Git Bash)
└── README.md           # This file
```

## Quick Start

### Windows (PowerShell)

```powershell
# Test all functions
.\tests\test-lambdas.ps1

# Test a specific function
.\tests\test-lambdas.ps1 -FunctionName onConnect
```

### Linux/Mac/Git Bash

```bash
# Make script executable (first time only)
chmod +x tests/test-lambdas.sh

# Test all functions
./tests/test-lambdas.sh

# Test a specific function
./tests/test-lambdas.sh onConnect
```

## Test-Driven Development Workflow

### 1. **Write Tests First (Red)**

Before implementing a feature, create a test event file:

```json
// tests/events/new-feature-event.json
{
  "requestContext": {
    "connectionId": "test-123",
    "domainName": "b32w7k8h1j.execute-api.us-east-1.amazonaws.com",
    "stage": "dev",
    "apiId": "b32w7k8h1j"
  },
  "body": "{\"action\": \"newFeature\"}"
}
```

### 2. **Run Tests (Red)**

Run the test to see it fail:

```bash
aws lambda invoke \
  --function-name yourFunction \
  --payload file://tests/events/new-feature-event.json \
  response.json
```

### 3. **Implement Feature (Green)**

Write the minimum code to make the test pass in your Lambda function.

### 4. **Refactor**

Improve code quality while keeping tests green.

### 5. **Repeat**

Continue the cycle for each new feature.

## Test Event Structure

### WebSocket API Gateway Events

All Lambda functions receive WebSocket API Gateway events with this structure:

```json
{
  "requestContext": {
    "connectionId": "unique-connection-id",
    "domainName": "api-id.execute-api.region.amazonaws.com",
    "stage": "dev",
    "apiId": "api-id",
    "requestId": "request-id"
  },
  "body": "stringified JSON or null",
  "queryStringParameters": {
    "key": "value"
  },
  "headers": {
    "Host": "...",
    "X-Forwarded-For": "..."
  }
}
```

## Available Test Events

### onConnect Tests

- **onConnect-event.json**: Tests connection with username parameter
- **onConnect-event-no-username.json**: Tests connection without username (should default to "Anonymous")

**Expected Behavior:**
- Creates entry in Connections table
- Returns `{ statusCode: 200, body: 'Connected' }`

### onDisconnect Tests

- **onDisconnect-event.json**: Tests disconnection

**Expected Behavior:**
- Removes entry from Connections table
- Returns `{ statusCode: 200, body: 'Disconnected' }`

### sendMessage Tests

- **sendMessage-event.json**: Tests sending message with username
- **sendMessage-event-anonymous.json**: Tests sending message without username

**Expected Behavior:**
- Saves message to Messages table
- Broadcasts to all active connections
- Returns `{ statusCode: 200, body: 'Message sent' }`

## Manual Testing

### Using AWS Console

1. Go to AWS Console → Lambda → Select function
2. Click "Test" tab
3. Create new test event
4. Copy content from `tests/events/*.json`
5. Click "Test"

### Using AWS CLI

```bash
# Test onConnect
aws lambda invoke \
  --function-name onConnect \
  --payload file://tests/events/onConnect-event.json \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json
```

## Viewing Logs

### Tail logs in real-time:

```bash
# PowerShell
aws logs tail /aws/lambda/onConnect --follow

# Bash
aws logs tail /aws/lambda/onConnect --follow
```

### View recent logs:

```bash
aws logs tail /aws/lambda/onConnect --since 1h
```

## Updating Test Events

When your API Gateway changes (e.g., after `terraform apply`), update the test events:

1. Get new API Gateway endpoint:
   ```bash
   cd terraform
   terraform output websocket_api_url
   ```

2. Extract domain name and API ID from the output

3. Update test event files with new `domainName` and `apiId`

## Best Practices

### 1. **Test Isolation**

Each test should be independent. Clean up test data if needed:

```bash
# Clean up test connections
aws dynamodb delete-item \
  --table-name Connections \
  --key '{"connectionId": {"S": "test-connection-123"}}'
```

### 2. **Test Data Management**

Use consistent test connection IDs:
- `test-connection-123` for general tests
- `test-connection-456` for edge cases
- Use timestamps for unique IDs when needed

### 3. **Assertions**

Add assertions to verify:
- Status code is 200
- Response body contains expected content
- DynamoDB items are created/deleted correctly
- No errors in CloudWatch Logs

### 4. **Integration Tests**

For full integration testing:
1. Create a real WebSocket connection
2. Send messages through the WebSocket
3. Verify messages are received by other connections

## Troubleshooting

### Test fails with "Function not found"

Ensure Terraform has deployed the functions:
```bash
cd terraform
terraform apply
```

### Test fails with "AccessDenied"

Check IAM permissions for your AWS user/role.

### Test fails with "Table not found"

Ensure DynamoDB tables exist:
```bash
aws dynamodb list-tables
```

### Response shows errors

Check CloudWatch Logs for detailed error messages:
```bash
aws logs tail /aws/lambda/<function-name> --since 10m
```

## Extending Tests

### Add New Test Case

1. Create new event file in `tests/events/`
2. Add test case to test script
3. Run test and verify behavior

### Add Assertions

Modify test scripts to include assertions:

```powershell
# PowerShell example
$response = Get-Content $ResponsePath -Raw | ConvertFrom-Json
if ($response.statusCode -ne 200) {
    Write-Host "Test failed: Expected statusCode 200, got $($response.statusCode)"
    return $false
}
```

## Continuous Integration

For CI/CD pipelines, use the test scripts:

```yaml
# Example GitHub Actions
- name: Test Lambda Functions
  run: ./tests/test-lambdas.sh
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Next Steps

1. ✅ Set up test structure (done)
2. ⏭️ Add more test cases for edge cases
3. ⏭️ Add integration tests with real WebSocket connections
4. ⏭️ Set up automated testing in CI/CD
5. ⏭️ Add performance/load testing

