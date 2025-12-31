import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsernameDialog from '../UsernameDialog'

describe('UsernameDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnConfirm = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <UsernameDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        initialUsername=""
      />
    )
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <UsernameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        initialUsername=""
      />
    )
    
    // Check that the dialog content is rendered by looking for the heading
    expect(screen.getByRole('heading', { name: /enter your username/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should display initial username in input', () => {
    render(
      <UsernameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        initialUsername="testuser"
      />
    )
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('testuser')
  })

  it('should call onConfirm with username when form is submitted', async () => {
    const user = userEvent.setup()
    
    render(
      <UsernameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        initialUsername=""
      />
    )
    
    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(input, 'newuser')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('newuser')
    })
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <UsernameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        initialUsername=""
      />
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onConfirm with DEFAULT_USERNAME when "Use Anonymous" is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <UsernameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        initialUsername=""
      />
    )
    
    const anonymousButton = screen.getByRole('button', { name: /use anonymous/i })
    await user.click(anonymousButton)
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('Anonymous')
    })
  })

  it('should display validation error for invalid username', async () => {
    const user = userEvent.setup()
    
    render(
      <UsernameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        initialUsername=""
      />
    )
    
    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(input, 'a') // Too short
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument()
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })
})

