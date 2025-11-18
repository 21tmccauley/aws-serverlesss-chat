# Feature List

## ✅ Implemented Features

- [x] WebSocket connection handling (onConnect)
- [x] WebSocket disconnection handling (onDisconnect)
- [x] Real-time message broadcasting (sendMessage)
- [x] Username support (with Anonymous fallback)
- [x] Message persistence in DynamoDB
- [x] Connection tracking in DynamoDB
- [x] Lambda function testing infrastructure
- [x] Terraform infrastructure as code

## 🚧 In Progress

- [ ] Frontend landing page
- [ ] Frontend chat interface (Vite + React)
- [ ] WebSocket client integration

## 💡 Future Features

- [ ] Architecture/Design explanation page
  - Dedicated page explaining cloud architecture decisions
  - Rationale for choosing serverless approach
  - Service selection trade-offs (API Gateway, Lambda, DynamoDB)
  - Scalability and cost analysis
  - Security considerations
  - Visual diagrams and architecture overview
- [ ] Typing indicators
  - Show "User is typing..." when other users are typing
  - Debounced typing events
  - Auto-clear after timeout
- [ ] Chat history on connect
  - Load recent messages when user joins
  - Implement getHistory Lambda function
- [ ] Online user list
  - Display active participants count
  - Show list of connected users
- [ ] Message timestamps
  - Display formatted timestamps in chat
  - Relative time (e.g., "2 minutes ago")
- [ ] User avatars/icons
  - Assign icons or colors to users
  - Visual distinction between users
- [ ] Message reactions
  - Emoji reactions to messages
- [ ] Private/direct messages
  - One-to-one messaging capability
- [ ] Message editing/deletion
  - Edit sent messages
  - Delete messages
- [ ] File/image sharing
  - Upload and share images/files
- [ ] Notifications
  - Browser notifications for new messages
- [ ] Message search
  - Search through message history
- [ ] User authentication
  - Login/logout functionality
  - User profiles

## 📝 Notes

- Typing indicators will require a new `typingIndicator` Lambda function and route
- Chat history feature mentioned in plan.md but not yet implemented
- Consider rate limiting for message sending

