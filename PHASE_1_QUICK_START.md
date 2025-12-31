# Phase 1 Quick Start: Testing Setup
## Get Started with Testing in 1 Hour

This guide helps you set up testing infrastructure for Phase 1 of your roadmap.

---

## 🎯 Frontend Testing Setup (30 minutes)

### Step 1: Install Testing Dependencies

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

### Step 2: Configure Vitest

Create `frontend/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Step 3: Create Test Setup File

Create `frontend/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

### Step 4: Add Test Scripts to package.json

Update `frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Step 5: Write Your First Test

Create `frontend/src/utils/__tests__/username.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getUsername, setUsername, clearUsername } from '../username'

describe('username utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should get username from localStorage', () => {
    localStorage.setItem('chat_username', 'testuser')
    expect(getUsername()).toBe('testuser')
  })

  it('should return null when username not set', () => {
    expect(getUsername()).toBeNull()
  })

  it('should set username in localStorage', () => {
    setUsername('newuser')
    expect(localStorage.getItem('chat_username')).toBe('newuser')
  })

  it('should trim whitespace when setting username', () => {
    setUsername('  spaced  ')
    expect(getUsername()).toBe('spaced')
  })

  it('should clear username from localStorage', () => {
    setUsername('testuser')
    clearUsername()
    expect(getUsername()).toBeNull()
  })
})
```

### Step 6: Test useWebSocket Hook

Create `frontend/src/hooks/__tests__/useWebSocket.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWebSocket } from '../useWebSocket'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 10)
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }

  addEventListener(event: string, handler: Function) {
    // Mock addEventListener
  }
}

global.WebSocket = MockWebSocket as any

describe('useWebSocket', () => {
  const mockOnMessage = vi.fn()
  const mockOnStatusChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://test',
        username: 'testuser',
        onMessage: mockOnMessage,
        onStatusChange: mockOnStatusChange,
      })
    )

    expect(result.current.status).toBe('disconnected')
  })

  it('should connect when URL and username are provided', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://test',
        username: 'testuser',
        onMessage: mockOnMessage,
        onStatusChange: mockOnStatusChange,
      })
    )

    await waitFor(
      () => {
        expect(result.current.status).toBe('connected')
      },
      { timeout: 1000 }
    )
  })
})
```

---

## 🎯 Backend Testing Setup (30 minutes)

### Step 1: Install Testing Dependencies

```bash
cd lambda
npm install -D jest @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-apigatewaymanagementapi aws-sdk-client-mock
```

### Step 2: Configure Jest

Create `lambda/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
  ],
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### Step 3: Add Test Scripts

Update `lambda/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 4: Write Your First Lambda Test

Create `lambda/__tests__/authorizer.test.js`:

```javascript
const { handler } = require('../authorizer')
const { mockClient } = require('aws-sdk-client-mock')

describe('authorizer handler', () => {
  beforeEach(() => {
    // Reset environment
    jest.clearAllMocks()
  })

  it('should authorize valid username', async () => {
    const event = {
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abc123/test/GET/request',
      queryStringParameters: {
        username: 'validuser123'
      }
    }

    const result = await handler(event)

    expect(result.principalId).toBe('validuser123')
    expect(result.policyDocument.Statement[0].Effect).toBe('Allow')
  })

  it('should reject username that is too short', async () => {
    const event = {
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abc123/test/GET/request',
      queryStringParameters: {
        username: 'a'
      }
    }

    const result = await handler(event)

    expect(result.principalId).toBe('unauthorized')
    expect(result.policyDocument.Statement[0].Effect).toBe('Deny')
  })

  it('should reject username with special characters', async () => {
    const event = {
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abc123/test/GET/request',
      queryStringParameters: {
        username: 'user<script>alert("xss")</script>'
      }
    }

    const result = await handler(event)

    expect(result.principalId).toBe('unauthorized')
    expect(result.policyDocument.Statement[0].Effect).toBe('Deny')
  })

  it('should handle missing username', async () => {
    const event = {
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abc123/test/GET/request',
      queryStringParameters: {}
    }

    const result = await handler(event)

    expect(result.principalId).toBe('unauthorized')
    expect(result.policyDocument.Statement[0].Effect).toBe('Deny')
  })
})
```

### Step 5: Test sendMessage Lambda

Create `lambda/__tests__/sendMessage.test.js`:

```javascript
const { handler } = require('../sendMessage')
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb')
const { ApiGatewayManagementApiClient } = require('@aws-sdk/client-apigatewaymanagementapi')
const { mockClient } = require('aws-sdk-client-mock')

const ddbMock = mockClient(DynamoDBDocumentClient)
const apiGwMock = mockClient(ApiGatewayManagementApiClient)

describe('sendMessage handler', () => {
  beforeEach(() => {
    ddbMock.reset()
    apiGwMock.reset()
    process.env.CONNECTIONS_TABLE = 'test-connections'
    process.env.MESSAGES_TABLE = 'test-messages'
  })

  it('should send a message and broadcast to all connections', async () => {
    // Mock connection lookup
    ddbMock.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({
      Item: {
        connectionId: 'conn-123',
        username: 'testuser'
      }
    })

    // Mock active connections scan
    ddbMock.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
      Items: [
        { connectionId: 'conn-123', username: 'testuser' },
        { connectionId: 'conn-456', username: 'otheruser' }
      ]
    })

    // Mock message save
    ddbMock.on(require('@aws-sdk/lib-dynamodb').PutCommand).resolves({})

    // Mock API Gateway broadcast
    apiGwMock.on(require('@aws-sdk/client-apigatewaymanagementapi').PostToConnectionCommand).resolves({})

    const event = {
      requestContext: {
        connectionId: 'conn-123',
        domainName: 'test.execute-api.us-east-1.amazonaws.com',
        stage: 'dev'
      },
      body: JSON.stringify({
        action: 'sendMessage',
        message: 'Hello, world!'
      })
    }

    const result = await handler(event)

    expect(result.statusCode).toBe(200)
    expect(ddbMock.commandCalls(require('@aws-sdk/lib-dynamodb').PutCommand)).toHaveLength(1)
    expect(apiGwMock.commandCalls(require('@aws-sdk/client-apigatewaymanagementapi').PostToConnectionCommand)).toHaveLength(2)
  })

  it('should reject empty messages', async () => {
    const event = {
      requestContext: {
        connectionId: 'conn-123',
        domainName: 'test.execute-api.us-east-1.amazonaws.com',
        stage: 'dev'
      },
      body: JSON.stringify({
        action: 'sendMessage',
        message: ''
      })
    }

    const result = await handler(event)

    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.error).toContain('empty')
  })

  it('should reject messages that are too long', async () => {
    const longMessage = 'a'.repeat(1001)

    const event = {
      requestContext: {
        connectionId: 'conn-123',
        domainName: 'test.execute-api.us-east-1.amazonaws.com',
        stage: 'dev'
      },
      body: JSON.stringify({
        action: 'sendMessage',
        message: longMessage
      })
    }

    const result = await handler(event)

    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.error).toContain('too long')
  })

  it('should handle getHistory action', async () => {
    // Mock message query
    ddbMock.on(require('@aws-sdk/lib-dynamodb').QueryCommand).resolves({
      Items: [
        {
          messageId: 'msg-1',
          message: 'First message',
          username: 'user1',
          timestamp: '2024-01-01T00:00:00Z'
        },
        {
          messageId: 'msg-2',
          message: 'Second message',
          username: 'user2',
          timestamp: '2024-01-01T01:00:00Z'
        }
      ]
    })

    apiGwMock.on(require('@aws-sdk/client-apigatewaymanagementapi').PostToConnectionCommand).resolves({})

    const event = {
      requestContext: {
        connectionId: 'conn-123',
        domainName: 'test.execute-api.us-east-1.amazonaws.com',
        stage: 'dev'
      },
      body: JSON.stringify({
        action: 'getHistory'
      })
    }

    const result = await handler(event)

    expect(result.statusCode).toBe(200)
    expect(apiGwMock.commandCalls(require('@aws-sdk/client-apigatewaymanagementapi').PostToConnectionCommand)).toHaveLength(2)
  })
})
```

---

## ✅ Next Steps

1. **Run frontend tests**: `cd frontend && npm test`
2. **Run backend tests**: `cd lambda && npm test`
3. **Check coverage**: `npm run test:coverage` in both directories
4. **Aim for 80% coverage** on critical paths
5. **Write tests before fixing bugs** (TDD practice)

---

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [AWS SDK Mock](https://github.com/m-radzikowski/aws-sdk-client-mock)

---

## 🎯 Phase 1 Checklist

- [ ] Frontend testing framework set up
- [ ] Backend testing framework set up
- [ ] At least 5 unit tests written for utilities
- [ ] At least 3 unit tests written for Lambda functions
- [ ] Test coverage > 50% on critical paths
- [ ] Tests run in CI/CD (set up in Phase 10)

---

Good luck! 🚀

