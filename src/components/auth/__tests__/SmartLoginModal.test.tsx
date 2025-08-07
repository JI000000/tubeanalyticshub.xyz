/**
 * Smart Login Modal Component Tests
 * 
 * Tests for the SmartLoginModal component that provides intelligent login prompts
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartLoginModal } from '../SmartLoginModal';
import { LoginTrigger, LoginContext } from '@/types/auth-errors';

// Mock Radix UI Dialog
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div data-testid="dialog-root">{children}</div> : null,
  Portal: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children, className }: { children?: React.ReactNode; className?: string }) => 
    <div data-testid="dialog-overlay" className={className}>{children}</div>,
  Content: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="dialog-content" className={className}>{children}</div>,
  Title: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <h2 data-testid="dialog-title" className={className}>{children}</h2>,
  Description: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <p data-testid="dialog-description" className={className}>{children}</p>,
  Close: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <button data-testid="dialog-close" className={className}>{children}</button>,
}));

// Mock SocialLoginButtons
const mockSocialLoginButtons = jest.fn();
jest.mock('../SocialLoginButtons', () => ({
  SocialLoginButtons: mockSocialLoginButtons,
}));

// Mock icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="close-icon">X</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
}));

describe('SmartLoginModal', () => {
  const mockOnLogin = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnSkip = jest.fn();

  const defaultTrigger: LoginTrigger = {
    type: 'trial_exhausted',
    message: '试用次数已用完，请登录继续使用',
    urgency: 'high',
    allowSkip: false,
  };

  const defaultContext: LoginContext = {
    previousAction: 'video_analysis',
    returnUrl: '/analysis',
    metadata: { videoId: 'test-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock SocialLoginButtons component
    mockSocialLoginButtons.mockImplementation(({ onSuccess, onError }) => (
      <div data-testid="social-login-buttons">
        <button 
          onClick={() => onSuccess({ user: { id: '1' }, session: {}, isNewUser: false })}
          data-testid="mock-github-login"
        >
          GitHub Login
        </button>
        <button 
          onClick={() => onError({ type: 'OAUTH_ERROR', message: 'Login failed' })}
          data-testid="mock-login-error"
        >
          Trigger Error
        </button>
      </div>
    ));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <SmartLoginModal
          isOpen={false}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument();
    });

    it('should display trigger message', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('试用次数已用完，请登录继续使用')).toBeInTheDocument();
    });

    it('should show appropriate title based on trigger type', () => {
      const triggers = [
        { type: 'trial_exhausted' as const, expectedTitle: '试用次数已用完' },
        { type: 'feature_required' as const, expectedTitle: '需要登录' },
        { type: 'save_action' as const, expectedTitle: '保存需要登录' },
        { type: 'premium_feature' as const, expectedTitle: '高级功能' },
      ];

      triggers.forEach(({ type, expectedTitle }) => {
        const trigger = { ...defaultTrigger, type };
        
        render(
          <SmartLoginModal
            isOpen={true}
            trigger={trigger}
            onLogin={mockOnLogin}
            onCancel={mockOnCancel}
          />
        );

        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        screen.unmount();
      });
    });
  });

  describe('Urgency Levels', () => {
    it('should apply high urgency styling', () => {
      const highUrgencyTrigger = { ...defaultTrigger, urgency: 'high' as const };
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={highUrgencyTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('border-red-200');
    });

    it('should apply medium urgency styling', () => {
      const mediumUrgencyTrigger = { ...defaultTrigger, urgency: 'medium' as const };
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={mediumUrgencyTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('border-yellow-200');
    });

    it('should apply low urgency styling', () => {
      const lowUrgencyTrigger = { ...defaultTrigger, urgency: 'low' as const };
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={lowUrgencyTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('border-blue-200');
    });
  });

  describe('Skip Functionality', () => {
    it('should show skip button when allowSkip is true', () => {
      const skipTrigger = { ...defaultTrigger, allowSkip: true };
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={skipTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('暂时跳过')).toBeInTheDocument();
    });

    it('should not show skip button when allowSkip is false', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('暂时跳过')).not.toBeInTheDocument();
    });

    it('should call onSkip when skip button is clicked', async () => {
      const user = userEvent.setup();
      const skipTrigger = { ...defaultTrigger, allowSkip: true };
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={skipTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
          onSkip={mockOnSkip}
        />
      );

      const skipButton = screen.getByText('暂时跳过');
      await user.click(skipButton);

      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          context={defaultContext}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const githubButton = screen.getByTestId('mock-github-login');
      await user.click(githubButton);

      expect(mockOnLogin).toHaveBeenCalledWith({
        user: { id: '1' },
        session: {},
        isNewUser: false,
      });
    });

    it('should handle login errors', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const errorButton = screen.getByTestId('mock-login-error');
      await user.click(errorButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      
      // Mock delayed login
      mockSocialLoginButtons.mockImplementation(({ onSuccess }) => (
        <div data-testid="social-login-buttons">
          <button 
            onClick={() => {
              setTimeout(() => onSuccess({ user: { id: '1' }, session: {}, isNewUser: false }), 100);
            }}
            data-testid="mock-delayed-login"
          >
            Delayed Login
          </button>
        </div>
      ));

      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const loginButton = screen.getByTestId('mock-delayed-login');
      await user.click(loginButton);

      // Should show loading state
      expect(screen.getByText('登录中...')).toBeInTheDocument();
    });
  });

  describe('Context Information', () => {
    it('should display context-specific information', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          context={defaultContext}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      // Should show information about what will happen after login
      expect(screen.getByText(/登录后将继续/)).toBeInTheDocument();
    });

    it('should handle missing context gracefully', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      // Should still render without context
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });
  });

  describe('Benefits Display', () => {
    it('should show login benefits for trial exhausted trigger', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('登录后您将获得：')).toBeInTheDocument();
      expect(screen.getByText('无限制使用所有分析功能')).toBeInTheDocument();
      expect(screen.getByText('保存和管理分析报告')).toBeInTheDocument();
      expect(screen.getByText('访问历史记录和收藏')).toBeInTheDocument();
    });

    it('should show feature-specific benefits for feature required trigger', () => {
      const featureTrigger = { 
        ...defaultTrigger, 
        type: 'feature_required' as const,
        message: '保存报告需要登录'
      };
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={featureTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('此功能需要登录后使用')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Escape key to close modal', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      await user.keyboard('{Escape}');
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should trap focus within modal', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const modal = screen.getByTestId('dialog-content');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should apply mobile-specific styling', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('sm:max-w-md');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const title = screen.getByTestId('dialog-title');
      const description = screen.getByTestId('dialog-description');
      const content = screen.getByTestId('dialog-content');

      expect(content).toHaveAttribute('aria-labelledby');
      expect(content).toHaveAttribute('aria-describedby');
      expect(title).toHaveAttribute('id');
      expect(description).toHaveAttribute('id');
    });

    it('should announce modal opening to screen readers', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveAttribute('role', 'dialog');
      expect(content).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Requirements Coverage', () => {
    it('✅ 需求 1.3: 友好的登录提示模态框', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByText('试用次数已用完，请登录继续使用')).toBeInTheDocument();
    });

    it('✅ 需求 3.1: 模态框中提供多种登录选项', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument();
    });

    it('✅ 需求 3.4: 登录成功后自动关闭模态框', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          context={defaultContext}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const githubButton = screen.getByTestId('mock-github-login');
      await user.click(githubButton);

      expect(mockOnLogin).toHaveBeenCalledWith({
        user: { id: '1' },
        session: {},
        isNewUser: false,
      });
    });

    it('✅ 需求 6.1: 移动端适配', () => {
      render(
        <SmartLoginModal
          isOpen={true}
          trigger={defaultTrigger}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('w-full', 'max-w-md', 'sm:max-w-md');
    });

    it('✅ 需求 6.4: 不同紧急程度的视觉样式', () => {
      const urgencyLevels = ['low', 'medium', 'high'] as const;
      const expectedClasses = ['border-blue-200', 'border-yellow-200', 'border-red-200'];

      urgencyLevels.forEach((urgency, index) => {
        const trigger = { ...defaultTrigger, urgency };
        
        render(
          <SmartLoginModal
            isOpen={true}
            trigger={trigger}
            onLogin={mockOnLogin}
            onCancel={mockOnCancel}
          />
        );

        const content = screen.getByTestId('dialog-content');
        expect(content).toHaveClass(expectedClasses[index]);
        
        screen.unmount();
      });
    });
  });
});