/**
 * Theme utility functions for managing dark/light mode
 */

/**
 * Checks if dark mode is currently active
 * @returns true if dark mode is active, false otherwise
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/**
 * Toggles between dark and light mode
 */
export function toggleTheme(): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark')
}

/**
 * Sets the theme explicitly
 * @param isDark - true for dark mode, false for light mode
 */
export function setTheme(isDark: boolean): void {
  if (typeof document === 'undefined') return
  
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

