import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Send, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useWebSocket, type WebSocketMessage } from '../hooks/useWebSocket'
import { getUsername, setUsername, DEFAULT_USERNAME } from '../utils/username'
import UsernameDialog from '../components/UsernameDialog'

interface Message {
  id: string
  author: string
  content: string
  timestamp: Date
  isOwn: boolean
}

export default function ChatPage() {
  const [isDark, setIsDark] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [username, setUsernameState] = useState<string>(DEFAULT_USERNAME)
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get WebSocket URL from environment
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || ''

  // Initialize username from localStorage or show dialog
  useEffect(() => {
    const storedUsername = getUsername()
    if (storedUsername) {
      setUsernameState(storedUsername)
    } else {
      setShowUsernameDialog(true)
    }
  }, [])
  
  // WebSocket hook
  const {
    status,
    sendMessage: wsSendMessage,
    lastMessage,
    error: wsError,
    reconnect,
  } = useWebSocket({
    url: wsUrl,
    username: username,
    onMessage: (message: WebSocketMessage) => {
      const newMessage: Message = {
        id: `${message.timestamp}-${message.username}-${Math.random()}`,
        author: message.username,
        content: message.message,
        timestamp: new Date(message.timestamp),
        isOwn: message.username === username,
      }
      setMessages((prev) => [...prev, newMessage])
    },
    onStatusChange: (newStatus) => {
      console.log('WebSocket status changed:', newStatus)
    },
    enableLogging: true,
  })

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleTheme = () => {
    const html = document.documentElement
    html.classList.toggle('dark')
    setIsDark(!isDark)
  }

  const handleUsernameConfirm = (newUsername: string) => {
    setUsername(newUsername)
    setUsernameState(newUsername)
    setShowUsernameDialog(false)
  }

  const handleSendMessage = () => {
    if (inputValue.trim() && status === 'connected') {
      wsSendMessage(inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Error'
      default:
        return 'Disconnected'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <WifiOff className="w-4 h-4" />
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col transition-theme">
      {/* Username Dialog */}
      <UsernameDialog
        isOpen={showUsernameDialog}
        onClose={() => setShowUsernameDialog(false)}
        onConfirm={handleUsernameConfirm}
        initialUsername={username}
      />

      {/* Header */}
      <header className="border-b border-border p-4 flex items-center justify-between bg-card transition-theme">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold">
              ◈
            </div>
            <div>
              <h2 className="font-semibold">General Chat</h2>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
                {wsError && (
                  <span className="text-xs text-red-500" title={wsError}>
                    ({wsError})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUsernameDialog(true)}
            className="px-3 py-1.5 text-xs font-medium hover:bg-secondary rounded-lg transition-theme"
            title="Change username"
          >
            {username}
          </button>
          {status === 'error' && (
            <button
              onClick={reconnect}
              className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-theme"
            >
              Reconnect
            </button>
          )}
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-theme"
          >
            Home
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-secondary rounded-lg transition-theme"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && status === 'connected' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.length === 0 && status !== 'connected' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>
              {status === 'connecting' && 'Connecting...'}
              {status === 'error' && `Connection error: ${wsError || 'Unknown error'}`}
              {status === 'disconnected' && 'Disconnected. Waiting to reconnect...'}
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                message.isOwn
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              {!message.isOwn && (
                <p className="text-xs font-semibold mb-1 opacity-75">
                  {message.author}
                </p>
              )}
              <p className="break-words">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.isOwn ? 'opacity-70' : 'text-muted-foreground'
              }`}>
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card transition-theme">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={status === 'connected' ? 'Type a message...' : 'Connecting...'}
            disabled={status !== 'connected'}
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-theme text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={status !== 'connected' || !inputValue.trim()}
            className="px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-theme flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  )
}
