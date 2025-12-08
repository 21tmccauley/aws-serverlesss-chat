# Lambda Function Testing Guide

This directory contains test files and scripts for testing Lambda functions in a Test-Driven Development (TDD) workflow.

## Structure

```
tests/
├── events/              # Test event files (inputs)
│   ├── onConnect-event.json
│   ├── onConnect-event-no-username.json
│   ├── onConnect-event-invalid-username.json
│   ├── onConnect-event-with-authorizer.json
│   ├── onDisconnect-event.json
│   ├── sendMessage-event.json
│   ├── sendMessage-event-anonymous.json
│   ├── sendMessage-event-empty.json
│   ├── sendMessage-event-too-long.json
│   ├── sendMessage-event-get-history.json
│   ├── sendMessage-event-invalid-json.json
│   ├── authorizer-event-valid.json
│   ├── authorizer-event-anonymous.json
│   ├── authorizer-event-invalid-empty.json
│   ├── authorizer-event-invalid-too-short.json
│   ├── authorizer-event-invalid-too-long.json
│   ├── authorizer-event-invalid-special-chars.json
│   └── authorizer-event-invalid-xss.json
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

# Test authorizer function
./tests/test-lambdas.sh authorizer
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
  - **Expected**: `statusCode: 200`, creates entry in Connections table
  
- **onConnect-event-no-username.json**: Tests connection without username (should default to "Anonymous")
  - **Expected**: `statusCode: 200`, creates entry with "Anonymous" username
  
- **onConnect-event-invalid-username.json**: Tests connection with invalid username format
  - **Expected**: `statusCode: 400`, returns error message
  
- **onConnect-event-with-authorizer.json**: Tests connection with authorizer context
  - **Expected**: `statusCode: 200`, uses username from authorizer context

**Expected Behavior:**
- Creates entry in Connections table
- Validates username format server-side
- Returns appropriate status code and message

### onDisconnect Tests

- **onDisconnect-event.json**: Tests disconnection
  - **Expected**: `statusCode: 200`, removes entry from Connections table

**Expected Behavior:**
- Removes entry from Connections table
- Returns `{ statusCode: 200, body: 'Disconnected' }`
- Handles missing connections gracefully

### sendMessage Tests

- **sendMessage-event.json**: Tests sending message with username
  - **Expected**: `statusCode: 200`, saves message and broadcasts to all connections
  
- **sendMessage-event-anonymous.json**: Tests sending message without username
  - **Expected**: `statusCode: 200`, uses "Anonymous" as username
  
- **sendMessage-event-empty.json**: Tests sending empty message (should fail)
  - **Expected**: `statusCode: 400`, returns error for empty message
  
- **sendMessage-event-too-long.json**: Tests sending message exceeding 1000 characters (should fail)
  - **Expected**: `statusCode: 400`, returns error for message too long
  
- **sendMessage-event-get-history.json**: Tests getHistory action
  - **Expected**: `statusCode: 200`, sends recent messages to requesting connection
  
- **sendMessage-event-invalid-json.json**: Tests sending invalid JSON body (should fail)
  - **Expected**: `statusCode: 400`, returns error for invalid JSON

**Expected Behavior:**
- Validates message content (non-empty, max 1000 characters)
- Saves message to Messages table
- Broadcasts to all active connections
- Handles getHistory action to fetch recent messages
- Returns appropriate status code and message

### Authorizer Tests

- **authorizer-event-valid.json**: Tests valid username format
  - **Expected**: `Effect: "Allow"`, returns policy with username in context
  
- **authorizer-event-anonymous.json**: Tests no username provided (should allow as Anonymous)
  - **Expected**: `Effect: "Allow"`, returns policy with "Anonymous" in context
  
- **authorizer-event-invalid-empty.json**: Tests empty username (should deny)
  - **Expected**: `Effect: "Deny"`, returns error message
  
- **authorizer-event-invalid-too-short.json**: Tests username less than 2 characters (should deny)
  - **Expected**: `Effect: "Deny"`, returns error message
  
- **authorizer-event-invalid-too-long.json**: Tests username exceeding 20 characters (should deny)
  - **Expected**: `Effect: "Deny"`, returns error message
  
- **authorizer-event-invalid-special-chars.json**: Tests username with invalid special characters (should deny)
  - **Expected**: `Effect: "Deny"`, returns error message
  
- **authorizer-event-invalid-xss.json**: Tests XSS attempt in username (should deny)
  - **Expected**: `Effect: "Deny"`, returns error message

**Expected Behavior:**
- Validates username format (2-20 characters, alphanumeric, spaces, hyphens, underscores)
- Blocks suspicious patterns (XSS, script injection)
- Returns IAM policy with Allow/Deny effect
- Passes validated username in context for use by onConnect Lambda

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

## Test Script Features

### Response Validation

The test scripts now include automatic response validation:
- **Status Code Validation**: Verifies expected HTTP status codes
- **Response Body Validation**: Checks for expected keys and values in responses
- **Authorizer Policy Validation**: Validates Allow/Deny effects for authorizer tests

### Test Coverage

The test suite now covers:
- ✅ Happy path scenarios (valid inputs)
- ✅ Edge cases (empty inputs, boundary conditions)
- ✅ Error scenarios (invalid inputs, malformed data)
- ✅ Security scenarios (XSS attempts, injection patterns)
- ✅ Integration scenarios (authorizer context, getHistory action)

### Running Specific Tests

You can run tests for specific functions:

```bash
# Test only onConnect
./tests/test-lambdas.sh onConnect

# Test only sendMessage
./tests/test-lambdas.sh sendMessage

# Test only authorizer
./tests/test-lambdas.sh authorizer
```

## Next Steps

1. ✅ Set up test structure (done)
2. ✅ Add comprehensive test cases for edge cases (done)
3. ✅ Add authorizer tests (done)
4. ✅ Improve response validation (done)
5. ⏭️ Add integration tests with real WebSocket connections
6. ⏭️ Set up automated testing in CI/CD
7. ⏭️ Add performance/load testing

