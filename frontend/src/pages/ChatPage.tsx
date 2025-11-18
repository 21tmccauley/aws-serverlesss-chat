import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Send } from 'lucide-react'

interface Message {
  id: string
  author: string
  content: string
  timestamp: Date
  isOwn: boolean
}

export default function ChatPage() {
  const [isDark, setIsDark] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      author: 'Alex',
      content: 'Hey everyone! How is the project going?',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: '2',
      author: 'Jordan',
      content: 'Really well! Just finished the design mockups.',
      timestamp: new Date(Date.now() - 4 * 60000),
      isOwn: false,
    },
    {
      id: '3',
      author: 'Casey',
      content: 'Great! I started implementing the backend API.',
      timestamp: new Date(Date.now() - 3 * 60000),
      isOwn: false,
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        author: 'You',
        content: inputValue,
        timestamp: new Date(),
        isOwn: true,
      }
      setMessages([...messages, newMessage])
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col transition-theme">
      {/* Header */}
      <header className="border-b border-border p-4 flex items-center justify-between bg-card transition-theme">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold">
              ◈
            </div>
            <div>
              <h2 className="font-semibold">General Chat</h2>
              <p className="text-xs text-muted-foreground">4 participants</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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
            placeholder="Type a message..."
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-theme text-foreground placeholder-muted-foreground"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-theme flex items-center gap-2"
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
