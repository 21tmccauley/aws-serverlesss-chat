/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom'
import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

// clean up after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia (used by many UI libraries)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  
  // Use real localStorage from jsdom (it's provided by the jsdom environment)
  // Just ensure it's cleared before each test
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })