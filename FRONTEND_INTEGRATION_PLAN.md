# Frontend Integration Plan

## Overview
This document outlines the plan to integrate the v0 AI-generated Next.js frontend with the AWS Serverless WebSocket backend.

## Package Manager
**Note**: This project uses **pnpm** (not npm or yarn). All package installation commands should use `pnpm`:
- Install dependencies: `pnpm install`
- Add package: `pnpm add <package-name>`
- Run scripts: `pnpm dev`, `pnpm build`, etc.

## Current State Analysis

### ✅ What's Working
- **Frontend Structure**: Next.js 16 with React 19, Tailwind CSS, shadcn/ui components
- **UI Components**: Beautiful landing page (`/`) and chat interface (`/chat`)
- **Backend Infrastructure**: Fully functional AWS WebSocket API with Lambda functions
- **Message Broadcasting**: Backend correctly broadcasts messages to all connected clients

### ❌ What's Missing
1. **WebSocket Client Integration**: No WebSocket connection logic
2. **Real-time Message Handling**: Chat page uses static mock data
3. **Username Management**: No way to set/retrieve username
4. **Connection State Management**: No connection status indicators
5. **Error Handling**: No handling for connection failures or reconnection
6. **Environment Configuration**: No WebSocket URL configuration

## Integration Plan

### Phase 1: Core WebSocket Integration ⚡ (Priority: HIGH)

#### 1.1 Create WebSocket Client Hook
**File**: `frontend/hooks/useWebSocket.ts`

**Features**:
- Establish WebSocket connection on mount
- Handle connection lifecycle (connect, disconnect, reconnect)
- Send messages via WebSocket
- Receive and parse incoming messages
- Connection state tracking (connecting, connected, disconnected, error)
- Automatic reconnection logic with exponential backoff

**Message Format**:
- **Send**: `{ action: "sendMessage", message: string, username: string }`
- **Receive**: `{ username: string, message: string, timestamp: string }`

#### 1.2 Environment Configuration
**File**: `frontend/.env.local` (create)

**Variables**:
```env
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-api-id.execute-api.region.amazonaws.com/stage
```

**Note**: Get the WebSocket URL from Terraform outputs:
```bash
cd terraform
terraform output stage_url
```

#### 1.3 Update Chat Page
**File**: `frontend/app/chat/page.tsx`

**Changes**:
- Replace mock messages with WebSocket hook
- Connect on component mount
- Disconnect on component unmount
- Display real-time messages from WebSocket
- Send messages via WebSocket instead of local state
- Show connection status in header
- Handle connection errors gracefully

### Phase 2: Username Management 👤 (Priority: HIGH)

#### 2.1 Username Input Component
**File**: `frontend/components/UsernameDialog.tsx`

**Features**:
- Modal/dialog for username input on first visit
- Store username in localStorage
- Validate username (non-empty, reasonable length)
- Allow username change from chat page
- Default to "Anonymous" if not provided

#### 2.2 Update Connection Logic
**Changes**:
- Pass username as query parameter: `wss://url/stage?username=JohnDoe`
- Update `onConnect` Lambda to use query parameter (already supported)

### Phase 3: Enhanced UX Features 🎨 (Priority: MEDIUM)

#### 3.1 Connection Status Indicator
**Features**:
- Visual indicator (green/yellow/red dot) in header
- Connection status text ("Connected", "Connecting", "Disconnected")
- Auto-reconnect notification

#### 3.2 Message Timestamps
**Enhancement**:
- Parse ISO timestamp from backend
- Format relative time ("2 minutes ago", "Just now")
- Use `date-fns` (already in dependencies) for formatting

#### 3.3 Loading States
**Features**:
- Skeleton loader while connecting
- Disable send button when disconnected
- Show "Reconnecting..." message

#### 3.4 Error Handling
**Features**:
- Toast notifications for connection errors
- Retry button for failed connections
- Graceful degradation (show cached messages if available)

### Phase 4: Advanced Features 🚀 (Priority: LOW)

#### 4.1 Chat History on Connect
**Requirement**: Implement `getHistory` Lambda function first
- Fetch recent messages when connecting
- Display in chronological order
- Merge with real-time messages

#### 4.2 Online User Count
**Enhancement**:
- Query Connections table on connect
- Display count in header (currently hardcoded to "4 participants")
- Update dynamically as users connect/disconnect

#### 4.3 Message Persistence
**Feature**:
- Store messages in localStorage as backup
- Restore on page reload
- Merge with server messages

## Implementation Steps

### Step 1: Setup Environment
1. Get WebSocket URL from Terraform outputs
2. Create `.env.local` file with WebSocket URL
3. Add `.env.local` to `.gitignore` (if not already)

### Step 2: Create WebSocket Hook
1. Create `useWebSocket.ts` hook
2. Implement connection logic
3. Implement message sending/receiving
4. Add connection state management
5. Add reconnection logic

### Step 3: Create Username Management
1. Create `UsernameDialog.tsx` component
2. Add localStorage utilities
3. Integrate with chat page

### Step 4: Update Chat Page
1. Replace mock data with WebSocket hook
2. Integrate username dialog
3. Update message sending logic
4. Add connection status display
5. Handle connection lifecycle

### Step 5: Testing
1. Test connection/disconnection
2. Test message sending/receiving
3. Test multiple clients
4. Test reconnection after disconnect
5. Test username handling

### Step 6: Polish
1. Add loading states
2. Improve error messages
3. Add connection status indicators
4. Format timestamps properly

## Technical Details

### WebSocket Connection Flow
```
1. User navigates to /chat
2. Check localStorage for username (or show dialog)
3. Connect to WebSocket: wss://url/stage?username=JohnDoe
4. Backend triggers $connect route → onConnect Lambda
5. Lambda stores connectionId in DynamoDB
6. Frontend receives connection confirmation
7. User sends message → WebSocket sends { action: "sendMessage", ... }
8. Backend triggers sendMessage route → sendMessage Lambda
9. Lambda broadcasts to all connections
10. Frontend receives message and displays it
11. User disconnects → Backend triggers $disconnect route
```

### Message Format
**Outgoing (Client → Server)**:
```json
{
  "action": "sendMessage",
  "message": "Hello, world!",
  "username": "JohnDoe"
}
```

**Incoming (Server → Client)**:
```json
{
  "username": "JohnDoe",
  "message": "Hello, world!",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### API Gateway Route Selection
The API Gateway uses `$request.body.action` for route selection. The `sendMessage` route expects `action: "sendMessage"` in the message body.

## Dependencies Check
✅ All required dependencies are already installed:
- `next` - Framework
- `react` - UI library
- `lucide-react` - Icons
- `date-fns` - Date formatting (already in package.json)
- `sonner` - Toast notifications (already in package.json)

## Potential Issues & Solutions

### Issue 1: CORS
**Solution**: WebSocket connections don't have CORS restrictions, but ensure API Gateway allows connections from your domain.

### Issue 2: Connection Timeout
**Solution**: Implement ping/pong heartbeat to keep connection alive. API Gateway has a 2-hour idle timeout.

### Issue 3: Message Ordering
**Solution**: Messages include timestamps. Sort by timestamp on display to ensure correct order.

### Issue 4: Multiple Tabs
**Solution**: Each tab creates a separate connection. Consider using BroadcastChannel API to sync messages across tabs.

## Next Steps
1. Review this plan
2. Start with Phase 1 (Core WebSocket Integration)
3. Test incrementally after each phase
4. Iterate based on testing results

## Estimated Time
- **Phase 1**: 2-3 hours
- **Phase 2**: 1 hour
- **Phase 3**: 2 hours
- **Phase 4**: 3-4 hours (if implementing)

**Total**: ~6-10 hours for complete integration

