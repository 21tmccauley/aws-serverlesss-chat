import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { validateUsername, DEFAULT_USERNAME } from '../utils/username'

interface UsernameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (username: string) => void
  initialUsername?: string
}

export default function UsernameDialog({
  isOpen,
  onClose,
  onConfirm,
  initialUsername = '',
}: UsernameDialogProps) {
  const [username, setUsername] = useState(initialUsername)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setUsername(initialUsername)
      setError(null)
    }
  }, [isOpen, initialUsername])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateUsername(username)
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid username')
      return
    }

    onConfirm(username.trim())
    setError(null)
  }

  const handleUseDefault = () => {
    onConfirm(DEFAULT_USERNAME)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Enter Your Username</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(null)
              }}
              placeholder="Enter your username"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-accent transition-theme text-foreground placeholder-muted-foreground"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore="true"
              autoFocus
              maxLength={20}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              2-20 characters. Letters, numbers, spaces, hyphens, and underscores only.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handleUseDefault}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Use Anonymous
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


