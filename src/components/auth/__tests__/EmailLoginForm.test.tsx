import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailLoginForm } from '../EmailLoginForm';
import { signIn } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe('EmailLoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email login form correctly', () => {
    render(<EmailLoginForm />);
    
    expect(screen.getByText('Sign in with email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send login link/i })).toBeInTheDocument();
  });

  it('validates email input', async () => {
    render(<EmailLoginForm />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const submitButton = screen.getByRole('button', { name: /send login link/i });
    
    // Test invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Test valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
    expect(submitButton).not.toBeDisabled();
  });

  it('handles successful email submission', async () => {
    const mockOnSuccess = jest.fn();
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);
    
    render(<EmailLoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const submitButton = screen.getByRole('button', { name: /send login link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        callbackUrl: '/',
        redirect: false
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText(/We've sent a login link to/)).toBeInTheDocument();
    });
    
    expect(mockOnSuccess).toHaveBeenCalledWith({
      type: 'email_sent',
      email: 'test@example.com',
      message: 'Check your email for a login link'
    });
  });

  it('handles email submission error', async () => {
    const mockOnError = jest.fn();
    mockSignIn.mockResolvedValue({ ok: false, error: 'EmailSignin' } as any);
    
    render(<EmailLoginForm onError={mockOnError} />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const submitButton = screen.getByRole('button', { name: /send login link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(screen.getByText('We couldn&apos;t send the login email. Please check your email address and try again.')).toBeInTheDocument();
    });
  });

  it('shows back button when onBack prop is provided', () => {
    const mockOnBack = jest.fn();
    render(<EmailLoginForm onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /back to login options/i });
    expect(backButton).toBeInTheDocument();
    
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows forgot password and create account links', () => {
    render(<EmailLoginForm />);
    
    expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('allows trying different email after success', async () => {
    const mockOnSuccess = jest.fn();
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);
    
    render(<EmailLoginForm onSuccess={mockOnSuccess} />);
    
    // Submit email
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send login link/i }));
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
    
    // Click try different email
    const tryAgainButton = screen.getByRole('button', { name: /try different email/i });
    fireEvent.click(tryAgainButton);
    
    // Should return to form
    await waitFor(() => {
      expect(screen.getByText('Sign in with email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    });
  });
});