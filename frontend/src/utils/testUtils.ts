/**
 * Testing utilities for WebSocket integration
 * 
 * Usage in browser console:
 * - window.__testWs() - Run all tests
 * - window.__testWsConnection() - Test connection
 * - window.__testWsSend() - Test sending messages
 * - window.__getWsLogs() - View WebSocket logs
 * - window.__clearWsLogs() - Clear logs
 */

export function setupTestUtils() {
  if (typeof window === 'undefined') return

  // Test WebSocket connection
  ;(window as any).__testWsConnection = async (url?: string) => {
    const wsUrl = url || import.meta.env.VITE_WEBSOCKET_URL
    if (!wsUrl) {
      console.error('❌ No WebSocket URL found. Set VITE_WEBSOCKET_URL in .env.local')
      return
    }

    console.log('🧪 Testing WebSocket connection to:', wsUrl)
    
    return new Promise((resolve, reject) => {
      const testWs = new WebSocket(wsUrl + '?username=TestUser')
      const timeout = setTimeout(() => {
        testWs.close()
        reject(new Error('Connection timeout after 10 seconds'))
      }, 10000)

      testWs.onopen = () => {
        clearTimeout(timeout)
        console.log('✅ WebSocket connection successful!')
        testWs.close()
        resolve(true)
      }

      testWs.onerror = (error) => {
        clearTimeout(timeout)
        console.error('❌ WebSocket connection failed:', error)
        reject(error)
      }

      testWs.onclose = (event) => {
        clearTimeout(timeout)
        if (event.wasClean) {
          console.log('✅ WebSocket closed cleanly')
        } else {
          console.warn('⚠️ WebSocket closed unexpectedly:', event.code, event.reason)
        }
      }
    })
  }

  // Test sending a message
  ;(window as any).__testWsSend = async (message: string = 'Test message', url?: string) => {
    const wsUrl = url || import.meta.env.VITE_WEBSOCKET_URL
    if (!wsUrl) {
      console.error('❌ No WebSocket URL found')
      return
    }

    console.log('🧪 Testing message send:', message)
    
    return new Promise((resolve, reject) => {
      const testWs = new WebSocket(wsUrl + '?username=TestUser')
      let messageReceived = false

      const timeout = setTimeout(() => {
        testWs.close()
        if (!messageReceived) {
          reject(new Error('Did not receive echo message within 5 seconds'))
        }
      }, 5000)

      testWs.onopen = () => {
        console.log('✅ Connected, sending message...')
        testWs.send(JSON.stringify({
          action: 'sendMessage',
          message: message,
          username: 'TestUser'
        }))
      }

      testWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('✅ Received message:', data)
          messageReceived = true
          clearTimeout(timeout)
          testWs.close()
          resolve(data)
        } catch (err) {
          console.error('❌ Failed to parse message:', err)
        }
      }

      testWs.onerror = (error) => {
        clearTimeout(timeout)
        console.error('❌ WebSocket error:', error)
        reject(error)
      }
    })
  }

  // Get WebSocket logs
  ;(window as any).__getWsLogs = () => {
    const logs = (window as any).__wsLogs || []
    console.table(logs)
    return logs
  }

  // Clear WebSocket logs
  ;(window as any).__clearWsLogs = () => {
    if ((window as any).__wsLogs) {
      ;(window as any).__wsLogs.length = 0
      console.log('✅ WebSocket logs cleared')
    }
  }

  // Run all tests
  ;(window as any).__testWs = async () => {
    console.log('🧪 Running WebSocket tests...\n')
    
    try {
      await (window as any).__testWsConnection()
      console.log('\n✅ Connection test passed\n')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await (window as any).__testWsSend('Hello from test!')
      console.log('\n✅ Send test passed\n')
      
      console.log('✅ All tests passed!')
    } catch (error) {
      console.error('\n❌ Test failed:', error)
    }
  }

  // Display test utilities info
  console.log(`
🧪 WebSocket Test Utilities Loaded!

Available commands:
  __testWs()              - Run all tests
  __testWsConnection()    - Test WebSocket connection
  __testWsSend(msg)       - Test sending a message
  __getWsLogs()           - View WebSocket logs
  __clearWsLogs()         - Clear logs

WebSocket URL: ${import.meta.env.VITE_WEBSOCKET_URL || 'Not configured'}
  `)
}

