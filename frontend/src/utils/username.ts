const USERNAME_STORAGE_KEY = 'chat_username'

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USERNAME_STORAGE_KEY)
}

export function setUsername(username: string): void {
  if (typeof window === 'undefined') return
  const trimmed = username.trim()
  if (trimmed) {
    localStorage.setItem(USERNAME_STORAGE_KEY, trimmed)
  }
}

export function clearUsername(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USERNAME_STORAGE_KEY)
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim()
  
  if (!trimmed) {
    return { valid: false, error: 'Username cannot be empty' }
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters' }
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' }
  }
  
  // Allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, spaces, hyphens, and underscores' }
  }
  
  return { valid: true }
}

export const DEFAULT_USERNAME = 'Anonymous'


