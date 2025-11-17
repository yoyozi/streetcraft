/**
 * Sign In Page Component Tests
 * 
 * TDD Approach: Test sign-in page layout, authentication state, and routing
 * Focus on page-level functionality and user flow
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import SignInPage from '../../../app/(auth)/sign-in/page'

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock authentication
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock constants
jest.mock('@/lib/constants', () => ({
  APP_NAME: 'StreetCraft',
}))

describe('SignInPage Component', () => {
  const mockAuth = require('@/auth').auth
  const mockRedirect = require('next/navigation').redirect

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Page Rendering', () => {
    // Test: Verify page renders correctly when user is not authenticated
    it('should render sign-in page when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      // Assert
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sing in to your account')).toBeInTheDocument()
      expect(screen.getByAltText('StreetCraft logo')).toBeInTheDocument()
    })

    // Test: Verify page structure and layout
    it('should render page with correct structure and layout', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      // Assert
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /streetcraft logo/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    })

    // Test: Verify logo link points to home
    it('should have logo link pointing to home page', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      const logoLink = screen.getByRole('link', { name: /streetcraft logo/i })

      // Assert
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('Authentication State Handling', () => {
    // Test: Verify redirect when user is already authenticated
    it('should redirect authenticated user to callback URL', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        }
      }
      mockAuth.mockResolvedValue(mockSession)
      const callbackUrl = '/dashboard'

      // Act
      await SignInPage({ 
        searchParams: Promise.resolve({ callbackUrl }) 
      })

      // Assert
      expect(mockAuth).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith(callbackUrl)
    })

    // Test: Verify redirect to home when no callback URL provided
    it('should redirect to home when user is authenticated but no callback URL', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        }
      }
      mockAuth.mockResolvedValue(mockSession)

      // Act
      await SignInPage({ 
        searchParams: Promise.resolve({}) 
      })

      // Assert
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    // Test: Verify page renders when user is not authenticated
    it('should render form when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled()
      expect(screen.getByRole('form')).toBeInTheDocument()
    })
  })

  describe('Callback URL Handling', () => {
    // Test: Verify callback URL is passed to sign-in form
    it('should pass callback URL to sign-in form', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)
      const callbackUrl = '/admin/dashboard'

      // Act
      const Page = await SignInPage({ 
        searchParams: Promise.resolve({ callbackUrl }) 
      })
      render(Page)

      // Assert
      // The callback URL should be passed as a hidden input to the form
      const hiddenInput = screen.getByDisplayValue(callbackUrl)
      expect(hiddenInput).toBeInTheDocument()
    })

    // Test: Verify default callback URL when none provided
    it('should use default callback URL when none provided', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      // Assert
      const hiddenInput = screen.getByDisplayValue('/')
      expect(hiddenInput).toBeInTheDocument()
    })

    // Test: Verify complex callback URL handling
    it('should handle complex callback URLs with query parameters', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)
      const complexCallbackUrl = '/admin/products?category=electronics&page=2'

      // Act
      const Page = await SignInPage({ 
        searchParams: Promise.resolve({ callbackUrl: complexCallbackUrl }) 
      })
      render(Page)

      // Assert
      const hiddenInput = screen.getByDisplayValue(complexCallbackUrl)
      expect(hiddenInput).toBeInTheDocument()
    })
  })

  describe('Page Content and Messaging', () => {
    // Test: Verify page title and description
    it('should display correct page title and description', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      // Assert
      expect(screen.getByRole('heading', { name: 'Sign In', level: 2 })).toBeInTheDocument()
      expect(screen.getByText('Sing in to your account')).toBeInTheDocument()
    })

    // Test: Verify brand consistency
    it('should display correct brand information', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      // Assert
      const logo = screen.getByAltText('StreetCraft logo')
      expect(logo).toHaveAttribute('src', '/images/logo.png')
      expect(logo).toHaveAttribute('width', '100')
      expect(logo).toHaveAttribute('height', '100')
    })

    // Test: Verify responsive design classes
    it('should have responsive design classes', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      const container = screen.getByRole('main').firstElementChild

      // Assert
      expect(container).toHaveClass('w-full', 'max-w-md', 'mx-auto')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    // Test: Verify handling of malformed search params
    it('should handle malformed search parameters gracefully', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ 
        searchParams: Promise.resolve({ callbackUrl: null }) 
      })
      render(Page)

      // Assert
      expect(screen.getByRole('form')).toBeInTheDocument()
      const hiddenInput = screen.getByDisplayValue('/')
      expect(hiddenInput).toBeInTheDocument()
    })

    // Test: Verify handling of authentication errors
    it('should handle authentication errors gracefully', async () => {
      // Arrange
      mockAuth.mockRejectedValue(new Error('Authentication error'))

      // Act & Assert - Should not throw error but handle gracefully
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      expect(Page).toBeDefined()
    })

    // Test: Verify handling of empty callback URL
    it('should handle empty callback URL string', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ 
        searchParams: Promise.resolve({ callbackUrl: '' }) 
      })
      render(Page)

      // Assert
      const hiddenInput = screen.getByDisplayValue('/')
      expect(hiddenInput).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    // Test: Verify sign-in form component integration
    it('should integrate sign-in form component correctly', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({ callbackUrl: '/test' }) })
      render(Page)

      // Assert
      // Verify the form is rendered with the callback URL
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByDisplayValue('/test')).toBeInTheDocument()
    })

    // Test: Verify card component integration
    it('should render within card component correctly', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const Page = await SignInPage({ searchParams: Promise.resolve({}) })
      render(Page)

      // Assert
      const card = screen.getByRole('main').firstElementChild
      expect(card).toBeInTheDocument()
    })
  })
})
