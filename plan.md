# Real-Time Chat Application Architecture

**AWS Serverless WebSocket Implementation**

---

## Frontend (Client)

**Technology:** HTML/CSS/JavaScript or React

- WebSocket connection to API Gateway
- Send/receive messages in real-time
- Display chat history and online users

**↓ WebSocket Connection ↓**

---

## API Gateway (WebSocket API)

Manages persistent connections

### Routes

- **$connect** - New user connects
- **$disconnect** - User leaves
- **sendMessage** - User sends chat

**↓ Triggers ↓**

---

## Lambda Functions

**Technology:** Serverless business logic (Node.js/Python)

### onConnect
- Store connection ID in DynamoDB
- Return success status

### onDisconnect
- Remove connection ID
- Cleanup user data

### sendMessage
- Save message to DynamoDB
- Get all active connections
- Broadcast to all users

### getHistory (optional)
- Query recent messages
- Return to requesting user

**↓ Reads/Writes ↓**

---

## DynamoDB Tables

### Connections Table
Tracks active WebSocket connections

```
connectionId (PK)
username
connectedAt
```

### Messages Table
Stores chat message history

```
messageId (PK)
timestamp (SK)
username
message
```

---

## IAM Roles & Permissions

Lambda execution role with DynamoDB read/write + API Gateway management

---

## Message Flow Example

1. **User connects** → API Gateway receives WebSocket connection → Triggers onConnect Lambda

2. **onConnect Lambda** stores connectionId in Connections table

3. **User sends message** → API Gateway routes to sendMessage Lambda

4. **sendMessage Lambda** saves to Messages table and queries all connectionIds from Connections table

5. **Lambda uses API Gateway Management API** to post message to each active connection

6. **All connected users receive the message in real-time!**

---

## 💰 Free Tier Coverage

| Service | Free Tier |
|---------|-----------|
| **API Gateway** | 1M messages/month free |
| **Lambda** | 1M requests + 400K GB-seconds/month free |
| **DynamoDB** | 25GB storage + 25 read/write units free |
| **Estimated Cost** | **$0 for demo/testing** |

