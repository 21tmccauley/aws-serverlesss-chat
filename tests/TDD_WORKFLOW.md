# Test-Driven Development (TDD) Workflow Guide

This guide explains how to use TDD principles when developing Lambda functions for this chat application.

## TDD Cycle: Red → Green → Refactor

### 1. 🔴 RED: Write a Failing Test

Before writing any code, write a test that describes the behavior you want.

**Example:** You want to add a feature that validates usernames.

**Step 1:** Create a test event file:

```json
// tests/events/onConnect-event-invalid-username.json
{
  "requestContext": {
    "connectionId": "test-connection-789",
    "domainName": "b32w7k8h1j.execute-api.us-east-1.amazonaws.com",
    "stage": "dev",
    "apiId": "b32w7k8h1j"
  },
  "queryStringParameters": {
    "username": "Invalid User Name!"  // Contains invalid characters
  }
}
```

**Step 2:** Add test to test script (or run manually):

```powershell
# Add to test-lambdas.ps1
Test-LambdaFunction -FunctionName "onConnect" -EventFile "onConnect-event-invalid-username.json" -Description "invalid username validation"
```

**Step 3:** Run the test - it should fail (or behave incorrectly):

```powershell
.\tests\test-lambdas.ps1 -FunctionName onConnect
```

### 2. 🟢 GREEN: Write Minimum Code to Pass

Write the smallest amount of code that makes the test pass.

**Example:** Add username validation to `lambda/onConnect.js`:

```javascript
exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  let username = event.queryStringParameters?.username || 'Anonymous';
  
  // Validate username (only alphanumeric and underscores)
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Invalid username format' }) 
    };
  }
  
  const tableName = process.env.CONNECTIONS_TABLE;
  
  await dynamodb.send(new PutCommand({
    TableName: tableName,
    Item: {
      connectionId: connectionId,
      username: username,
      connectedAt: new Date().toISOString()
    }
  }));
  
  return { statusCode: 200, body: 'Connected' };
};
```

**Step 4:** Run test again - it should pass:

```powershell
.\tests\test-lambdas.ps1 -FunctionName onConnect
```

### 3. 🔵 REFACTOR: Improve Code Quality

Now that tests pass, improve the code without changing behavior.

**Example:** Extract validation to a separate function:

```javascript
function validateUsername(username) {
  if (!username) return { valid: true, username: 'Anonymous' };
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { 
      valid: false, 
      error: 'Username must contain only letters, numbers, and underscores' 
    };
  }
  return { valid: true, username };
}

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const usernameParam = event.queryStringParameters?.username;
  
  const validation = validateUsername(usernameParam);
  if (!validation.valid) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: validation.error }) 
    };
  }
  
  const tableName = process.env.CONNECTIONS_TABLE;
  
  await dynamodb.send(new PutCommand({
    TableName: tableName,
    Item: {
      connectionId: connectionId,
      username: validation.username,
      connectedAt: new Date().toISOString()
    }
  }));
  
  return { statusCode: 200, body: 'Connected' };
};
```

**Step 5:** Run tests again to ensure refactoring didn't break anything:

```powershell
.\tests\test-lambdas.ps1
```

## Complete TDD Workflow Example

### Scenario: Add Message Validation

**1. RED - Write Test**

Create `tests/events/sendMessage-event-empty.json`:

```json
{
  "requestContext": {
    "connectionId": "test-connection-123",
    "domainName": "b32w7k8h1j.execute-api.us-east-1.amazonaws.com",
    "stage": "dev",
    "apiId": "b32w7k8h1j"
  },
  "body": "{\"message\": \"\", \"username\": \"TestUser\"}"
}
```

Expected: Should return 400 error for empty message.

**2. GREEN - Implement**

Modify `lambda/sendMessage.js`:

```javascript
exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  const message = body.message;
  const username = body.username || 'Anonymous';
  
  // Validate message
  if (!message || message.trim().length === 0) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Message cannot be empty' }) 
    };
  }
  
  // ... rest of the code
};
```

**3. REFACTOR - Improve**

Extract validation:

```javascript
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message must be a non-empty string' };
  }
  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (message.length > 1000) {
    return { valid: false, error: 'Message too long (max 1000 characters)' };
  }
  return { valid: true };
}
```

## TDD Best Practices

### ✅ DO:

1. **Write tests first** - Before implementing any feature
2. **One test at a time** - Focus on one failing test
3. **Run tests frequently** - After every small change
4. **Keep tests simple** - One assertion per test when possible
5. **Test edge cases** - Empty inputs, null values, boundary conditions
6. **Test error cases** - Invalid inputs, missing data, etc.

### ❌ DON'T:

1. **Don't skip the red phase** - Always see the test fail first
2. **Don't write tests after code** - That's not TDD
3. **Don't test implementation details** - Test behavior, not internals
4. **Don't ignore failing tests** - Fix or remove them
5. **Don't write tests for trivial code** - Focus on business logic

## Test Categories

### Unit Tests (Current Setup)

Test individual Lambda functions in isolation:
- ✅ Fast execution
- ✅ Easy to debug
- ✅ Don't require full infrastructure
- ❌ Don't test integration between services

### Integration Tests (Future)

Test the full system working together:
- Test WebSocket connections end-to-end
- Test DynamoDB interactions
- Test message broadcasting

## Example: Adding a New Feature with TDD

### Feature: Rate Limiting

**RED Phase:**

1. Create test event: `tests/events/sendMessage-event-rate-limit.json`
2. Create test that sends 100 messages rapidly
3. Expect rate limit error after threshold

**GREEN Phase:**

1. Add rate limiting logic to `sendMessage.js`
2. Use DynamoDB to track message counts per connection
3. Return 429 status code when limit exceeded

**REFACTOR Phase:**

1. Extract rate limit logic to separate module
2. Make rate limit configurable via environment variable
3. Add clear error messages

## Running Tests in TDD Cycle

```powershell
# 1. Write test, then run to see it fail
.\tests\test-lambdas.ps1 -FunctionName sendMessage

# 2. Implement feature, then run again
terraform apply  # Deploy changes
.\tests\test-lambdas.ps1 -FunctionName sendMessage

# 3. Refactor, then run again to ensure nothing broke
terraform apply
.\tests\test-lambdas.ps1  # Test all functions
```

## Quick Reference

| Phase | Action | Command |
|-------|--------|---------|
| 🔴 RED | Write failing test | Create event file, run test |
| 🟢 GREEN | Make test pass | Implement feature, `terraform apply`, run test |
| 🔵 REFACTOR | Improve code | Refactor, `terraform apply`, run all tests |

## Next Steps

1. ✅ Set up test infrastructure (done)
2. ⏭️ Add more test cases for existing features
3. ⏭️ Use TDD for new features
4. ⏭️ Add integration tests
5. ⏭️ Set up CI/CD with automated tests

## Resources

- [TDD by Example (Kent Beck)](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [AWS Lambda Testing Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/testing-lambda.html)
- [Test-Driven Development Wikipedia](https://en.wikipedia.org/wiki/Test-driven_development)

