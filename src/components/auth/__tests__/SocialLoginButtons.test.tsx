/**
 * Social Login Buttons Component Tests
 * 
 * Tests for the SocialLoginButtons component that handles OAuth authentication
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialLoginButtons } from '../SocialLoginButtons';
import { OAuthProvider } from '@/types/auth-errors';

// Mock NextAuth
const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: mockSignIn,
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Github: ({ className }: { className?: string }) => (
    <div data-testid="github-icon" className={className}>GitHub</div>
  ),
  Chrome: ({ className }: { className?: string }) => (
    <div data-testid="google-icon" className={className}>Google</div>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loading-icon" className={className}>Loading</div>
  ),
}));

describe('SocialLoginButtons', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const defaultProviders: OAuthProvider[] = [
    {
      id: 'github',
      name: 'GitHub',
      icon: () => <div>GitHub</div>,
      primary: true,
    },
    {
      id: 'google',
      name: 'Google',
      icon: () => <div>Google</div>,
      primary: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render all provided OAuth providers', () => {
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('使用 GitHub 登录')).toBeInTheDocument();
      expect(screen.getByText('使用 Google 登录')).toBeInTheDocument();
    });

    it('should render primary provider with different styling', () => {
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录').closest('button');
      const googleButton = screen.getByText('使用 Google 登录').closest('button');

      expect(githubButton).toHaveClass('bg-primary');
      expect(googleButton).toHaveClass('bg-secondary');
    });

    it('should render provider icons correctly', () => {
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByTestId('github-icon')).toBeInTheDocument();
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
    });

    it('should handle empty providers array', () => {
      render(
        <SocialLoginButtons
          providers={[]}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('暂无可用的登录方式')).toBeInTheDocument();
    });
  });

  describe('Login Functionality', () => {
    it('should handle successful GitHub login', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockResolvedValue({
        ok: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        session: { accessToken: 'token123' },
      });

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录');
      await user.click(githubButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('github', { redirect: false });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith({
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          session: { accessToken: 'token123' },
          isNewUser: false,
        });
      });
    });

    it('should handle successful Google login', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockResolvedValue({
        ok: true,
        user: { id: '2', email: 'google@example.com', name: 'Google User' },
        session: { accessToken: 'google-token' },
      });

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const googleButton = screen.getByText('使用 Google 登录');
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', { redirect: false });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle login failure', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'AccessDenied',
      });

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录');
      await user.click(githubButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith({
          type: 'OAUTH_ACCESS_DENIED',
          message: '用户拒绝了授权请求',
          provider: 'github',
          retryable: true,
        });
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockRejectedValue(new Error('Network error'));

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录');
      await user.click(githubButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith({
          type: 'NETWORK_ERROR',
          message: 'Network error',
          provider: 'github',
          retryable: true,
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录');
      await user.click(githubButton);

      // Should show loading state
      expect(screen.getByTestId('loading-icon')).toBeInTheDocument();
      expect(screen.getByText('登录中...')).toBeInTheDocument();

      // Button should be disabled
      expect(githubButton.closest('button')).toBeDisabled();
    });

    it('should disable all buttons when one is loading', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录');
      const googleButton = screen.getByText('使用 Google 登录');
      
      await user.click(githubButton);

      expect(githubButton.closest('button')).toBeDisabled();
      expect(googleButton.closest('button')).toBeDisabled();
    });

    it('should handle external loading prop', () => {
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          loading={true}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录').closest('button');
      const googleButton = screen.getByText('使用 Google 登录').closest('button');

      expect(githubButton).toBeDisabled();
      expect(googleButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle different OAuth error types', async () => {
      const user = userEvent.setup();
      
      const errorCases = [
        { error: 'AccessDenied', expectedType: 'OAUTH_ACCESS_DENIED' },
        { error: 'InvalidClient', expectedType: 'OAUTH_INVALID_CLIENT' },
        { error: 'InvalidGrant', expectedType: 'OAUTH_INVALID_GRANT' },
        { error: 'UnauthorizedClient', expectedType: 'OAUTH_UNAUTHORIZED_CLIENT' },
      ];

      for (const errorCase of errorCases) {
        mockSignIn.mockResolvedValue({
          ok: false,
          error: errorCase.error,
        });

        render(
          <SocialLoginButtons
            providers={[defaultProviders[0]]}
            onSuccess={mockOnSuccess}
            onError={mockOnError}
          />
        );

        const button = screen.getByText('使用 GitHub 登录');
        await user.click(button);

        await waitFor(() => {
          expect(mockOnError).toHaveBeenCalledWith(
            expect.objectContaining({
              type: errorCase.expectedType,
            })
          );
        });

        // Clean up for next iteration
        mockOnError.mockClear();
        screen.unmount();
      }
    });

    it('should provide user-friendly error messages', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'AccessDenied',
      });

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录');
      await user.click(githubButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '用户拒绝了授权请求',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录').closest('button');
      const googleButton = screen.getByText('使用 Google 登录').closest('button');

      expect(githubButton).toHaveAttribute('aria-label', '使用 GitHub 账户登录');
      expect(googleButton).toHaveAttribute('aria-label', '使用 Google 账户登录');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录').closest('button');
      
      // Focus the button
      githubButton?.focus();
      expect(githubButton).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');

      expect(mockSignIn).toHaveBeenCalledWith('github', { redirect: false });
    });

    it('should have proper focus management during loading', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const githubButton = screen.getByText('使用 GitHub 登录').closest('button');
      
      await user.click(githubButton!);

      // Button should maintain focus but be disabled
      expect(githubButton).toHaveFocus();
      expect(githubButton).toBeDisabled();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          className="custom-login-buttons"
        />
      );

      const container = screen.getByText('使用 GitHub 登录').closest('div')?.parentElement;
      expect(container).toHaveClass('custom-login-buttons');
    });

    it('should support different button variants', () => {
      const customProviders: OAuthProvider[] = [
        {
          id: 'github',
          name: 'GitHub',
          icon: () => <div>GitHub</div>,
          primary: true,
          variant: 'outline',
        },
      ];

      render(
        <SocialLoginButtons
          providers={customProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const button = screen.getByText('使用 GitHub 登录').closest('button');
      expect(button).toHaveClass('variant-outline');
    });
  });

  describe('Requirements Coverage', () => {
    it('✅ 需求 3.1: 提供多种登录选项', () => {
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('使用 GitHub 登录')).toBeInTheDocument();
      expect(screen.getByText('使用 Google 登录')).toBeInTheDocument();
    });

    it('✅ 需求 3.2: GitHub和Google OAuth支持', async () => {
      const user = userEvent.setup();
      
      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Test GitHub
      await user.click(screen.getByText('使用 GitHub 登录'));
      expect(mockSignIn).toHaveBeenCalledWith('github', { redirect: false });

      // Test Google
      await user.click(screen.getByText('使用 Google 登录'));
      expect(mockSignIn).toHaveBeenCalledWith('google', { redirect: false });
    });

    it('✅ 需求 3.5: 登录失败错误处理', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'AccessDenied',
      });

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.click(screen.getByText('使用 GitHub 登录'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'OAUTH_ACCESS_DENIED',
            message: '用户拒绝了授权请求',
          })
        );
      });
    });

    it('✅ 需求 3.6: 加载状态和禁用状态', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <SocialLoginButtons
          providers={defaultProviders}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const button = screen.getByText('使用 GitHub 登录').closest('button');
      await user.click(button!);

      expect(screen.getByTestId('loading-icon')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });
});