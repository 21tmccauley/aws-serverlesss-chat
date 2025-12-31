import { describe, it, expect, beforeEach } from 'vitest'
import { getUsername, setUsername, clearUsername, validateUsername, DEFAULT_USERNAME } from '../username'

describe('username utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('getUsername', () => {
    it('should get username from localStorage', () => {
      localStorage.setItem('chat_username', 'testuser')
      expect(getUsername()).toBe('testuser')
    })

    it('should return null when username not set', () => {
      expect(getUsername()).toBeNull()
    })
  })

  describe('setUsername', () => {
    it('should set username in localStorage', () => {
      setUsername('newuser')
      expect(localStorage.getItem('chat_username')).toBe('newuser')
    })

    it('should trim whitespace when setting username', () => {
      setUsername('  spaced  ')
      expect(getUsername()).toBe('spaced')
    })

    it('should not set empty string', () => {
      setUsername('   ')
      expect(getUsername()).toBeNull()
    })
  })

  describe('clearUsername', () => {
    it('should remove username from localStorage', () => {
      setUsername('testuser')
      expect(getUsername()).toBe('testuser')
      
      clearUsername()
      expect(getUsername()).toBeNull()
    })
  })

  describe('validateUsername', () => {
    it('should validate a good username', () => {
      const result = validateUsername('validuser123')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty username', () => {
      const result = validateUsername('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Username cannot be empty')
    })

    it('should reject username that is too short', () => {
      const result = validateUsername('a')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Username must be at least 2 characters')
    })

    it('should reject username that is too long', () => {
      const longUsername = 'a'.repeat(21)
      const result = validateUsername(longUsername)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Username must be 20 characters or less')
    })

    it('should reject username with special characters', () => {
      const result = validateUsername('user@name')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Username can only contain letters, numbers, spaces, hyphens, and underscores')
    })

    it('should accept username with spaces, hyphens, and underscores', () => {
      const result = validateUsername('user-name_123')
      expect(result.valid).toBe(true)
    })

    it('should trim username before validating', () => {
      const result = validateUsername('  valid  ')
      expect(result.valid).toBe(true)
    })
  })

  describe('DEFAULT_USERNAME', () => {
    it('should export DEFAULT_USERNAME constant', () => {
      expect(DEFAULT_USERNAME).toBe('Anonymous')
    })
  })
})

