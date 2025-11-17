/**
 * Sign In Form Component Tests
 * 
 * TDD Approach: Test login form UI components, validation, and user interactions
 * Focus on component behavior, accessibility, and user experience
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFormStatus } from 'react-dom'
import CredentialsSignInForm from '../../../app/(auth)/sign-in/credentials-signin-form'

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the user actions
jest.mock('../../../lib/actions/user.actions', () => ({
  signInWithCredentials: jest.fn(),
}))

// Mock useFormStatus hook
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(),
}))

// Mock the constants
jest.mock('../../../lib/constants', () => ({
  signInDefaultValues: {
    email: '',
    password: ''
  }
}))

describe('CredentialsSignInForm Component', () => {
  const mockCallbackUrl = '/dashboard'
  const mockSignInWithCredentials = require('../../../lib/actions/user.actions').signInWithCredentials

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock useFormStatus to return pending: false by default
    ;(useFormStatus as jest.Mock).mockReturnValue({ pending: false })
  })

  describe('Form Rendering', () => {
    // Test: Verify form renders with all required elements
    it('should render sign-in form with all required fields', () => {
      // Arrange & Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    })

    // Test: Verify hidden callbackUrl input is present
    it('should include hidden callbackUrl input', () => {
      // Arrange & Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      // Assert
      const hiddenInput = screen.getByDisplayValue(mockCallbackUrl)
      expect(hiddenInput).toBeInTheDocument()
      expect(hiddenInput).toHaveAttribute('type', 'hidden')
      expect(hiddenInput).toHaveAttribute('name', 'callbackUrl')
    })

    // Test: Verify email input has correct attributes
    it('should have email input with correct attributes', () => {
      // Arrange & Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      const emailInput = screen.getByLabelText(/email/i)

      // Assert
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('name', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('autoCapitalize', 'email')
    })

    // Test: Verify password input has correct attributes
    it('should have password input with correct attributes', () => {
      // Arrange & Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      const passwordInput = screen.getByLabelText(/password/i)

      // Assert
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('name', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('autoCapitalize', 'password')
    })
  })

  describe('Form Interaction', () => {
    // Test: Verify user can type in email field
    it('should allow user to type in email field', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const testEmail = 'test@example.com'

      // Act
      await user.type(emailInput, testEmail)

      // Assert
      expect(emailInput).toHaveValue(testEmail)
    })

    // Test: Verify user can type in password field
    it('should allow user to type in password field', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      const testPassword = 'password123'

      // Act
      await user.type(passwordInput, testPassword)

      // Assert
      expect(passwordInput).toHaveValue(testPassword)
    })

    // Test: Verify form submission with valid credentials
    it('should submit form with valid credentials', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('password', 'password123')
      mockFormData.append('callbackUrl', mockCallbackUrl)

      mockSignInWithCredentials.mockResolvedValue({
        success: true,
        message: 'Sign in successful'
      })

      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Act
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Assert
      expect(mockSignInWithCredentials).toHaveBeenCalledWith(
        expect.any(Object), // prevState
        expect.any(FormData)
      )
    })

    // Test: Verify form submission handles empty fields
    it('should handle form submission with empty fields', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSignInWithCredentials.mockResolvedValue({
        success: false,
        message: 'Invalid email or password'
      })

      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Act
      await user.click(submitButton)

      // Assert
      expect(mockSignInWithCredentials).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    // Test: Verify button shows loading state during submission
    it('should show loading state when form is submitting', () => {
      // Arrange
      ;(useFormStatus as jest.Mock).mockReturnValue({ pending: true })

      // Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      // Assert
      const submitButton = screen.getByRole('button', { name: /signing in/i })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('Signing In...')
    })

    // Test: Verify button is enabled when not submitting
    it('should enable button when form is not submitting', () => {
      // Arrange
      ;(useFormStatus as jest.Mock).mockReturnValue({ pending: false })

      // Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      // Assert
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).not.toBeDisabled()
      expect(submitButton).toHaveTextContent('Sign In')
    })
  })

  describe('Error Handling', () => {
    // Test: Verify error message displays on failed sign in
    it('should display error message when sign in fails', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSignInWithCredentials.mockResolvedValue({
        success: false,
        message: 'Invalid email or password'
      })

      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Act
      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      // Wait for the error message to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      // Assert
      expect(screen.getByText('Invalid email or password')).toHaveClass('text-destructive')
    })

    // Test: Verify no error message on successful sign in
    it('should not display error message when sign in succeeds', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSignInWithCredentials.mockResolvedValue({
        success: true,
        message: 'Sign in successful'
      })

      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Act
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Assert
      expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    // Test: Verify sign up link has correct href
    it('should render sign up link with correct href', () => {
      // Arrange & Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      const signUpLink = screen.getByRole('link', { name: /sign up/i })

      // Assert
      expect(signUpLink).toHaveAttribute('href', `/sign-up?callbackUrl=${encodeURIComponent(mockCallbackUrl)}`)
    })

    // Test: Verify sign up link works without callbackUrl
    it('should render sign up link without callbackUrl when not provided', () => {
      // Arrange & Act
      render(<CredentialsSignInForm callbackUrl="" />)

      const signUpLink = screen.getByRole('link', { name: /sign up/i })

      // Assert
      expect(signUpLink).toHaveAttribute('href', '/sign-up')
    })
  })

  describe('Accessibility', () => {
    // Test: Verify form is accessible via keyboard
    it('should be accessible via keyboard navigation', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      // Act & Assert - Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/password/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus()
    })

    // Test: Verify form submission works with Enter key
    it('should submit form when Enter key is pressed in password field', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSignInWithCredentials.mockResolvedValue({
        success: true,
        message: 'Sign in successful'
      })

      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const passwordInput = screen.getByLabelText(/password/i)

      // Act
      await user.type(passwordInput, 'password123')
      await user.keyboard('{Enter}')

      // Assert
      expect(mockSignInWithCredentials).toHaveBeenCalled()
    })

    // Test: Verify all form controls have proper labels
    it('should have proper labels for all form controls', () => {
      // Arrange & Act
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation Integration', () => {
    // Test: Verify email input accepts valid email format
    it('should accept valid email format', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const emailInput = screen.getByLabelText(/email/i)

      // Act
      await user.type(emailInput, 'valid@example.com')

      // Assert
      expect(emailInput).toHaveValue('valid@example.com')
      expect(emailInput).toBeValid()
    })

    // Test: Verify password input accepts minimum length
    it('should accept password with minimum length', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<CredentialsSignInForm callbackUrl={mockCallbackUrl} />)
      
      const passwordInput = screen.getByLabelText(/password/i)

      // Act
      await user.type(passwordInput, '123456')

      // Assert
      expect(passwordInput).toHaveValue('123456')
      expect(passwordInput).toBeValid()
    })
  })
})
