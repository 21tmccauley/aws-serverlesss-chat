import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isDarkMode, toggleTheme, setTheme } from '../theme'

describe('theme utilities', () => {
  beforeEach(() => {
    // Clear dark class before each test
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark')
    }
  })

  describe('isDarkMode', () => {
    it('should return false when dark class is not present', () => {
      expect(isDarkMode()).toBe(false)
    })

    it('should return true when dark class is present', () => {
      document.documentElement.classList.add('dark')
      expect(isDarkMode()).toBe(true)
    })

    it('should return false when document is undefined', () => {
      // Mock document as undefined
      const originalDocument = global.document
      // @ts-expect-error - intentionally setting to undefined for test
      global.document = undefined
      
      expect(isDarkMode()).toBe(false)
      
      // Restore
      global.document = originalDocument
    })
  })

  describe('toggleTheme', () => {
    it('should add dark class when not present', () => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      toggleTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class when present', () => {
      document.documentElement.classList.add('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      toggleTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should toggle multiple times correctly', () => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      toggleTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      toggleTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      toggleTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should not throw when document is undefined', () => {
      const originalDocument = global.document
      // @ts-expect-error - intentionally setting to undefined for test
      global.document = undefined
      
      expect(() => toggleTheme()).not.toThrow()
      
      // Restore
      global.document = originalDocument
    })
  })

  describe('setTheme', () => {
    it('should add dark class when isDark is true', () => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      setTheme(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class when isDark is false', () => {
      document.documentElement.classList.add('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      setTheme(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should set theme to dark when already dark', () => {
      document.documentElement.classList.add('dark')
      setTheme(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should set theme to light when already light', () => {
      document.documentElement.classList.remove('dark')
      setTheme(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should not throw when document is undefined', () => {
      const originalDocument = global.document
      // @ts-expect-error - intentionally setting to undefined for test
      global.document = undefined
      
      expect(() => setTheme(true)).not.toThrow()
      expect(() => setTheme(false)).not.toThrow()
      
      // Restore
      global.document = originalDocument
    })
  })
})

