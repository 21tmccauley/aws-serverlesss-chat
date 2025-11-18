import { useState, useEffect, useRef, useCallback } from 'react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  username: string
  message: string
  timestamp: string
}

interface UseWebSocketOptions {
  url: string
  username: string
  onMessage?: (message: WebSocketMessage) => void
  onStatusChange?: (status: ConnectionStatus) => void
  reconnectAttempts?: number
  reconnectInterval?: number
  enableLogging?: boolean
}

interface UseWebSocketReturn {
  status: ConnectionStatus
  sendMessage: (message: string) => void
  lastMessage: WebSocketMessage | null
  error: string | null
  reconnect: () => void
  disconnect: () => void
}

// Test utility: Log WebSocket events to console and window object for debugging
const createLogger = (enabled: boolean) => {
  const logs: Array<{ time: string; type: string; data: any }> = []
  
  return {
    log: (type: string, data?: any) => {
      if (enabled) {
        const logEntry = { time: new Date().toISOString(), type, data }
        logs.push(logEntry)
        console.log(`[WebSocket ${type}]`, data || '')
        
        // Store in window for easy access in browser console
        if (typeof window !== 'undefined') {
          ;(window as any).__wsLogs = logs
          ;(window as any).__lastWsLog = logEntry
        }
      }
    },
    getLogs: () => logs,
    clearLogs: () => {
      logs.length = 0
      if (typeof window !== 'undefined') {
        ;(window as any).__wsLogs = []
      }
    }
  }
}

export function useWebSocket({
  url,
  username,
  onMessage,
  onStatusChange,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  enableLogging = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectCountRef = useRef(0)
  const shouldReconnectRef = useRef(true)
  const logger = useRef(createLogger(enableLogging)).current

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    logger.log('STATUS_CHANGE', { from: status, to: newStatus })
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [status, onStatusChange, logger])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logger.log('ALREADY_CONNECTED')
      return
    }

    if (!url) {
      logger.log('ERROR', 'No WebSocket URL provided')
      setError('WebSocket URL is not configured')
      updateStatus('error')
      return
    }

    if (!username) {
      logger.log('ERROR', 'No username provided')
      setError('Username is required')
      updateStatus('error')
      return
    }

    try {
      // Add username as query parameter
      const wsUrl = `${url}?username=${encodeURIComponent(username)}`
      logger.log('CONNECTING', { url: wsUrl, username })
      updateStatus('connecting')
      setError(null)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        logger.log('CONNECTED', { url: wsUrl, username })
        reconnectCountRef.current = 0
        updateStatus('connected')
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          logger.log('MESSAGE_RECEIVED', data)
          setLastMessage(data)
          onMessage?.(data)
        } catch (err) {
          logger.log('PARSE_ERROR', { error: err, rawData: event.data })
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        logger.log('ERROR', { event, readyState: ws.readyState })
        const errorMsg = 'WebSocket connection error'
        setError(errorMsg)
        updateStatus('error')
      }

      ws.onclose = (event) => {
        logger.log('CLOSED', { 
          code: event.code, 
          reason: event.reason, 
          wasClean: event.wasClean,
          readyState: ws.readyState 
        })
        
        updateStatus('disconnected')
        
        // Attempt reconnection if we should and haven't exceeded attempts
        if (shouldReconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          const delay = reconnectInterval * Math.pow(2, reconnectCountRef.current - 1) // Exponential backoff
          logger.log('RECONNECT_SCHEDULED', { 
            attempt: reconnectCountRef.current, 
            maxAttempts: reconnectAttempts,
            delayMs: delay 
          })
          
          reconnectTimeoutRef.current = setTimeout(() => {
            logger.log('RECONNECTING', { attempt: reconnectCountRef.current })
            connect()
          }, delay)
        } else if (reconnectCountRef.current >= reconnectAttempts) {
          logger.log('RECONNECT_FAILED', { maxAttempts: reconnectAttempts })
          setError(`Failed to reconnect after ${reconnectAttempts} attempts`)
          updateStatus('error')
        }
      }
    } catch (err) {
      logger.log('CONNECTION_ERROR', { error: err })
      const errorMsg = err instanceof Error ? err.message : 'Failed to create WebSocket connection'
      setError(errorMsg)
      updateStatus('error')
    }
  }, [url, username, reconnectAttempts, reconnectInterval, updateStatus, onMessage, logger])

  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) {
      logger.log('SEND_ERROR', 'Empty message')
      return
    }

    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      logger.log('SEND_ERROR', { 
        readyState: ws?.readyState, 
        status: ws ? 'not open' : 'no connection' 
      })
      setError('WebSocket is not connected')
      return
    }

    try {
      const payload = {
        action: 'sendMessage',
        message: message.trim(),
        username: username,
      }
      logger.log('MESSAGE_SENT', payload)
      ws.send(JSON.stringify(payload))
      setError(null)
    } catch (err) {
      logger.log('SEND_ERROR', { error: err })
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMsg)
    }
  }, [username, logger])

  const disconnect = useCallback(() => {
    logger.log('MANUAL_DISCONNECT')
    shouldReconnectRef.current = false
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    updateStatus('disconnected')
  }, [logger, updateStatus])

  const reconnect = useCallback(() => {
    logger.log('MANUAL_RECONNECT')
    shouldReconnectRef.current = true
    reconnectCountRef.current = 0
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    disconnect()
    setTimeout(() => connect(), 100)
  }, [connect, disconnect, logger])

  // Connect on mount and when URL/username changes
  useEffect(() => {
    if (url && username) {
      shouldReconnectRef.current = true
      connect()
    }

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [url, username, connect])

  return {
    status,
    sendMessage,
    lastMessage,
    error,
    reconnect,
    disconnect,
  }
}


