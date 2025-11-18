# WebSocket Integration Testing Guide

This guide explains how to test the WebSocket integration as you build and debug.

## Quick Start

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open the chat page:**
   - Navigate to `http://localhost:5173/chat`
   - You'll be prompted to enter a username (or use "Anonymous")

3. **Check the browser console:**
   - All WebSocket events are logged automatically
   - Look for `[WebSocket ...]` messages

## Testing Utilities

The app includes built-in testing utilities accessible from the browser console.

### Available Commands

Open your browser's developer console (F12) and use these commands:

#### `__testWs()`
Run all WebSocket tests (connection + message sending)
```javascript
__testWs()
```

#### `__testWsConnection()`
Test just the WebSocket connection
```javascript
__testWsConnection()
```

#### `__testWsSend(message)`
Test sending a message through WebSocket
```javascript
__testWsSend("Hello from test!")
```

#### `__getWsLogs()`
View all WebSocket logs in a table format
```javascript
__getWsLogs()
```

#### `__clearWsLogs()`
Clear the WebSocket logs
```javascript
__clearWsLogs()
```

### Accessing Logs Programmatically

The logs are also stored in the `window` object:

```javascript
// View all logs
window.__wsLogs

// View the last log entry
window.__lastWsLog
```

## Testing Scenarios

### 1. Basic Connection Test

1. Open the chat page
2. Check the connection status indicator in the header (should show "Connected" with green icon)
3. Check browser console for `[WebSocket CONNECTED]` message

### 2. Send and Receive Messages

1. Open the chat page in **two different browser windows** (or tabs)
2. Use different usernames for each window
3. Send a message from one window
4. Verify it appears in both windows
5. Check console logs in both windows

### 3. Reconnection Test

1. Connect to the chat
2. Disconnect your internet (or stop the backend)
3. Watch the connection status change to "Error" or "Disconnected"
4. Reconnect your internet
5. Verify automatic reconnection (check console logs)

### 4. Username Management

1. Open chat page - should prompt for username
2. Enter a username and submit
3. Refresh the page - should remember your username
4. Click on your username in the header to change it
5. Verify the WebSocket reconnects with the new username

### 5. Multiple Users Test

1. Open 3-4 browser windows/tabs
2. Use different usernames for each
3. Send messages from different windows
4. Verify all messages appear in all windows
5. Check that usernames are displayed correctly

## Debugging Tips

### Check WebSocket URL

The WebSocket URL should be configured in `.env.local`:
```env
VITE_WEBSOCKET_URL=wss://your-api-id.execute-api.region.amazonaws.com/stage
```

To verify it's loaded:
```javascript
console.log(import.meta.env.VITE_WEBSOCKET_URL)
```

### Common Issues

#### Connection Fails Immediately
- Check that the WebSocket URL is correct
- Verify the backend is deployed and running
- Check browser console for CORS or connection errors
- Verify the URL uses `wss://` (secure WebSocket)

#### Messages Not Appearing
- Check browser console for `[WebSocket MESSAGE_RECEIVED]` logs
- Verify the message format matches what the backend expects
- Check that the `sendMessage` action is included in the payload

#### Username Not Working
- Check localStorage: `localStorage.getItem('chat_username')`
- Verify username is passed as query parameter in WebSocket URL
- Check backend logs to see if username is received

### Browser Console Logs

The WebSocket hook logs all important events:

- `CONNECTING` - Attempting to connect
- `CONNECTED` - Successfully connected
- `MESSAGE_SENT` - Message sent to server
- `MESSAGE_RECEIVED` - Message received from server
- `CLOSED` - Connection closed
- `ERROR` - Connection or message error
- `RECONNECT_SCHEDULED` - Automatic reconnection scheduled
- `RECONNECTING` - Attempting to reconnect

## Manual Testing Checklist

- [ ] Connection establishes on page load
- [ ] Username dialog appears if no username stored
- [ ] Username is saved to localStorage
- [ ] Connection status indicator shows correct state
- [ ] Messages can be sent when connected
- [ ] Messages are received from other users
- [ ] Messages display with correct username
- [ ] Timestamps are formatted correctly
- [ ] Input is disabled when disconnected
- [ ] Reconnect button appears on error
- [ ] Automatic reconnection works
- [ ] Multiple browser windows can connect simultaneously
- [ ] Messages broadcast to all connected clients

## Network Tab Inspection

In Chrome DevTools Network tab:

1. Filter by "WS" (WebSocket)
2. Click on the WebSocket connection
3. Check the "Messages" tab to see:
   - Outgoing messages (what you send)
   - Incoming messages (what you receive)
   - Connection frames

## Backend Verification

To verify the backend is working:

1. Check AWS CloudWatch logs for Lambda functions
2. Check DynamoDB tables:
   - `Connections` table should have active connections
   - `Messages` table should have message history
3. Use the test script: `tests/test-lambdas.ps1`

## Performance Testing

For load testing:

1. Open multiple browser windows (10+)
2. Send messages rapidly from different windows
3. Monitor:
   - Message delivery time
   - Connection stability
   - Browser console for errors
   - Backend logs for performance

## Next Steps

Once basic functionality works:

1. Test error handling (network interruptions)
2. Test edge cases (very long messages, special characters)
3. Test on different browsers
4. Test on mobile devices
5. Test with slow network connections

