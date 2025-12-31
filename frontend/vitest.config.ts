import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Enable global test functions (describe, it, expect) without imports
    globals: true,
    
    // Use jsdom to simulate browser environment (needed for React components)
    environment: 'jsdom',
    
    // Path to setup file that runs before each test file
    setupFiles: './src/test/setup.ts',
    
    // Process CSS imports (important for Tailwind/styled components)
    css: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // Fast coverage provider
      reporter: ['text', 'json', 'html'], // Output formats
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
    
    // File patterns to include as tests
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    
    // File patterns to exclude
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
})

