# Frontend Code Review - AWS Integration Readiness

## ✅ What's Already Great

### Structure & Components
- **Well-organized React + TypeScript + Vite setup** - Modern stack, ready for production
- **Component architecture** - Clean separation of concerns:
  - `LandingPage.tsx` - Entry point with username collection
  - `ChatInterface` (in `App.tsx`) - Main chat UI
  - `ChatMessage.tsx` - Message display component
  - `ChatInput.tsx` - Input component
  - `TypingIndicator.tsx` - Typing indicator (ready for future feature)
- **UI Components** - Comprehensive shadcn/ui component library included
- **Styling** - Tailwind CSS with dark mode support
- **Animations** - Framer Motion for smooth UX

### Current State
- Landing page transitions to chat interface ✅
- Message display with timestamps ✅
- Typing indicator component (UI ready) ✅
- Theme toggle functionality ✅
- Responsive design ✅

## ❌ What Needs to be Added/Changed for AWS Integration

### 1. **WebSocket Connection Logic** (CRITICAL)
**Current:** No WebSocket connection exists
**Needed:**
- Create a WebSocket hook (`useWebSocket.ts` or similar)
- Connect to AWS API Gateway WebSocket endpoint
- Handle connection lifecycle (connect, disconnect, reconnect)
- Manage connection state (connected, connecting, disconnected, error)

**Location:** Create `src/hooks/useWebSocket.ts`

### 2. **Environment Configuration** (CRITICAL)
**Current:** No environment variables configured
**Needed:**
- Create `.env` file with WebSocket URL
- Get URL from Terraform: `terraform output stage_url`
- Add to `.env`: `VITE_WEBSOCKET_URL=wss://...`

**Location:** Create `frontend/.env` and `frontend/.env.example`

### 3. **Username Collection** (CRITICAL)
**Current:** Landing page doesn't collect username before entering chat
**Needed:**
- Add username input field to `LandingPage.tsx`
- Pass username to chat interface
- Store username in state/context
- Include username in WebSocket connection query params (`?username=...`)

**Location:** Modify `LandingPage.tsx` and `App.tsx`

### 4. **Message Sending** (CRITICAL)
**Current:** `handleSendMessage` in `App.tsx` only updates local state
**Needed:**
- Send message via WebSocket using `sendMessage` route
- Format: `{"action": "sendMessage", "message": "...", "username": "..."}`
- Handle send errors
- Optimistic UI updates

**Location:** Modify `App.tsx` and `ChatInput.tsx`

### 5. **Message Receiving** (CRITICAL)
**Current:** Messages are hardcoded/mocked
**Needed:**
- Listen for incoming WebSocket messages
- Parse message format from backend: `{username, message, timestamp}`
- Update message state when messages arrive
- Handle different message types (if needed)

**Location:** Modify `App.tsx` message state management

### 6. **Connection State Management** (IMPORTANT)
**Current:** No connection state tracking
**Needed:**
- Track connection status (connected/disconnected/connecting)
- Show connection indicator in UI
- Handle reconnection logic
- Display connection errors to user

**Location:** Add to `App.tsx` or create context

### 7. **Viewer Count** (IMPORTANT)
**Current:** Hardcoded viewer count (142)
**Needed:**
- Track active connections from backend
- Update viewer count based on actual connections
- Could query Connections table or receive updates via WebSocket

**Location:** Modify viewer count logic in `App.tsx`

### 8. **Error Handling** (IMPORTANT)
**Current:** No error handling for network/WebSocket issues
**Needed:**
- Handle WebSocket connection errors
- Handle message send failures
- Display user-friendly error messages
- Retry logic for failed operations

**Location:** Add error handling throughout WebSocket logic

### 9. **Message Format Alignment** (IMPORTANT)
**Current:** Message interface uses `sender: 'broadcaster' | 'viewer'`
**Needed:**
- Backend doesn't distinguish broadcaster vs viewer
- All users are equal in current implementation
- May need to adjust UI to show all messages uniformly OR
- Add broadcaster role logic if needed

**Location:** Review `ChatMessage.tsx` and message interface

### 10. **Typing Indicator** (FUTURE)
**Current:** UI component exists but not connected
**Needed:** (Future feature - already in FEATURES.md)
- Backend support for typing events
- Send typing start/stop events
- Receive typing indicators from other users

**Location:** Keep for future implementation

## 📋 Implementation Checklist

### Phase 1: Core WebSocket Integration
- [ ] Create `.env` file with WebSocket URL
- [ ] Create `useWebSocket` hook
- [ ] Add username input to landing page
- [ ] Connect WebSocket on chat entry
- [ ] Implement message sending via WebSocket
- [ ] Implement message receiving from WebSocket
- [ ] Update message state management

### Phase 2: Connection Management
- [ ] Add connection state tracking
- [ ] Add connection status indicator
- [ ] Implement reconnection logic
- [ ] Add error handling

### Phase 3: Polish
- [ ] Update viewer count logic
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Test edge cases (disconnect, reconnect, etc.)

## 🔧 Technical Details

### WebSocket Connection Format
```
wss://{api-id}.execute-api.{region}.amazonaws.com/{stage}?username={username}
```

### Message Format to Send
```json
{
  "action": "sendMessage",
  "message": "Hello world",
  "username": "John"
}
```

### Message Format Received
```json
{
  "username": "John",
  "message": "Hello world",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Backend Routes
- `$connect` - Auto-triggered on WebSocket connection
- `$disconnect` - Auto-triggered on WebSocket disconnection
- `sendMessage` - Triggered when `action: "sendMessage"` is sent

## 🎯 Next Steps

1. **Get WebSocket URL from Terraform:**
   ```bash
   cd terraform
   terraform output stage_url
   ```

2. **Create environment file:**
   ```bash
   cd frontend
   echo "VITE_WEBSOCKET_URL=wss://..." > .env
   ```

3. **Create WebSocket hook** - Implement connection logic

4. **Update LandingPage** - Add username input

5. **Update App.tsx** - Replace mock data with real WebSocket integration

6. **Test connection** - Verify messages flow through AWS infrastructure

## 📝 Notes

- The UI is production-ready and looks great!
- The component structure is well-designed for integration
- Most work is in connecting the existing UI to the backend
- Typing indicator component is ready for future implementation
- Consider adding a loading state while connecting
- Consider adding a "reconnecting..." state for better UX

