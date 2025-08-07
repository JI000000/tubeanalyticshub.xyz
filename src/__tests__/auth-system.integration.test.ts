/**
 * Authentication System Integration Test Suite
 * 
 * Comprehensive integration tests that verify the entire authentication system works together
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';

// Import all the components and hooks we're testing
import { useAnonymousTrial } from '../hooks/useAnonymousTrial';
import { useSmartAuth } from '../hooks/useSmartAuth';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';
import { SmartLoginModal } from '../components/auth/SmartLoginModal';

// Mock all external dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../hooks/useFingerprint', () => ({
  useFingerprint: jest.fn(() => ({
    fingerprint: 'integration-test-fingerprint',
    loading: false,
    error: null,
  })),
}));

jest.mock('@fingerprintjs/fingerprintjs', () => ({
  default: {
    load: jest.fn(() => Promise.resolve({
      get: jest.fn(() => Promise.resolve({
        visitorId: 'integration-test-fingerprint',
        components: {},
      })),
    })),
  },
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Authentication System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Default API responses
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/trial/consume')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              remaining: 4,
              total: 5,
              message: '还剩 4 次试用机会',
            }),
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              remaining: 5,
              total: 5,
              actions: [],
              stats: { totalActions: 0 },
            }),
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete User Journey: Anonymous to Authenticated', () => {
    it('should handle complete user journey from anonymous trial to login', async () => {
      const user = userEvent.setup();
      
      // Step 1: User starts with anonymous trial
      const { result: trialResult } = renderHook(() => useAnonymousTrial());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(trialResult.current.remaining).toBe(5);
      expect(trialResult.current.canUseTrial).toBe(true);

      // Step 2: User consumes some trials
      await act(async () => {
        const success = await trialResult.current.consumeTrial('video_analysis');
        expect(success).toBe(true);
      });

      expect(trialResult.current.remaining).toBe(4);

      // Step 3: User exhausts trials
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          blocked: true,
          remaining: 0,
          message: '试用次数已用完，请登录继续使用',
        }),
      }));

      await act(async () => {
        const success = await trialResult.current.consumeTrial('video_analysis');
        expect(success).toBe(false);
      });

      expect(trialResult.current.canUseTrial).toBe(false);

      // Step 4: Smart auth should trigger login modal
      const { result: authResult } = renderHook(() => useSmartAuth());

      const mockShowModal = jest.fn();
      jest.doMock('../components/auth/SmartLoginModal', () => ({
        useSmartLoginModal: jest.fn(() => ({
          showModal: mockShowModal,
          hideModal: jest.fn(),
          isVisible: false,
        })),
      }));

      await act(async () => {
        const allowed = await authResult.current.requireAuth('video_analysis', {
          allowTrial: true,
        });
        expect(allowed).toBe(false);
      });

      // Step 5: User sees login modal and logs in
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.signIn.mockResolvedValue({
        ok: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        session: { accessToken: 'token123' },
      });

      const mockOnLogin = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <SmartLoginModal
          isOpen={true}
          trigger={{
            type: 'trial_exhausted',
            message: '试用次数已用完，请登录继续使用',
            urgency: 'high',
            allowSkip: false,
          }}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      // Mock the social login buttons to simulate successful login
      const socialButtons = screen.getByTestId('social-login-buttons');
      const githubButton = screen.getByTestId('mock-github-login');
      
      await user.click(githubButton);

      expect(mockOnLogin).toHaveBeenCalledWith({
        user: { id: '1' },
        session: {},
        isNewUser: false,
      });

      // Step 6: After login, user should have unlimited access
      const nextAuthModule2 = require('next-auth/react');
      nextAuthModule2.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      });

      const { result: authenticatedAuthResult } = renderHook(() => useSmartAuth());

      await act(async () => {
        const allowed = await authenticatedAuthResult.current.requireAuth('video_analysis');
        expect(allowed).toBe(true);
      });

      expect(authenticatedAuthResult.current.isAuthenticated).toBe(true);
    });
  });

  describe('Cross-Component Communication', () => {
    it('should maintain state consistency across components', async () => {
      // Test that trial state is consistent between useAnonymousTrial and useSmartAuth
      const { result: trialResult } = renderHook(() => useAnonymousTrial());
      const { result: authResult } = renderHook(() => useSmartAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Both should report the same trial state
      expect(trialResult.current.remaining).toBe(5);
      
      const featureAccess = authResult.current.checkFeatureAccess('video_analysis');
      expect(featureAccess.allowed).toBe(true);
      expect(featureAccess.reason).toBe('trial');
    });

    it('should handle state updates across components', async () => {
      const { result: trialResult } = renderHook(() => useAnonymousTrial());
      const { result: authResult } = renderHook(() => useSmartAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Consume trial through smart auth
      await act(async () => {
        await authResult.current.requireAuth('video_analysis', { allowTrial: true });
      });

      // Trial hook should reflect the change
      expect(trialResult.current.remaining).toBe(4);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cascading errors gracefully', async () => {
      // Simulate network failure
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result: trialResult } = renderHook(() => useAnonymousTrial());
      const { result: authResult } = renderHook(() => useSmartAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Trial consumption should fail
      await act(async () => {
        const success = await trialResult.current.consumeTrial('video_analysis');
        expect(success).toBe(false);
      });

      expect(trialResult.current.error).toBeTruthy();

      // Smart auth should handle the error and show login modal
      await act(async () => {
        const allowed = await authResult.current.requireAuth('video_analysis', {
          allowTrial: true,
        });
        expect(allowed).toBe(false);
      });

      expect(authResult.current.error).toBeTruthy();
    });

    it('should recover from temporary failures', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            remaining: 4,
            total: 5,
          }),
        });
      });

      const { result: trialResult } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // First attempt should fail
      await act(async () => {
        const success = await trialResult.current.consumeTrial('video_analysis');
        expect(success).toBe(false);
      });

      // Retry should succeed
      await act(async () => {
        const success = await trialResult.current.consumeTrial('video_analysis');
        expect(success).toBe(true);
      });

      expect(trialResult.current.remaining).toBe(4);
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid user interactions efficiently', async () => {
      const user = userEvent.setup();
      const { result: authResult } = renderHook(() => useSmartAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Simulate rapid clicks
      const startTime = Date.now();
      
      const promises = Array.from({ length: 10 }, async (_, i) => {
        return act(async () => {
          return authResult.current.requireAuth('video_analysis', {
            allowTrial: true,
            metadata: { requestId: i },
          });
        });
      });

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
    });

    it('should not cause memory leaks during extended usage', async () => {
      const { result: trialResult } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Simulate extended usage
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          await trialResult.current.syncWithServer();
        });
      }

      // Should still be responsive
      expect(trialResult.current.loading).toBe(false);
      expect(trialResult.current.remaining).toBeDefined();
    });
  });

  describe('Security Integration', () => {
    it('should validate fingerprints across all components', async () => {
      const { result: trialResult } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await trialResult.current.consumeTrial('video_analysis');
      });

      // Verify that API calls include proper fingerprint
      expect(mockFetch).toHaveBeenCalledWith('/api/trial/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'video_analysis',
          fingerprint: 'integration-test-fingerprint',
          metadata: undefined,
        }),
      });
    });

    it('should handle malicious input sanitization', async () => {
      const { result: trialResult } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Try to inject malicious metadata
      await act(async () => {
        await trialResult.current.consumeTrial('video_analysis', {
          '<script>alert("xss")</script>': 'malicious',
          __proto__: { polluted: true },
        });
      });

      // Should sanitize or reject malicious input
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      
      expect(JSON.stringify(body)).not.toContain('<script>');
      expect(body.metadata).not.toHaveProperty('__proto__');
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across modal interactions', async () => {
      const user = userEvent.setup();
      
      const mockOnLogin = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <SmartLoginModal
          isOpen={true}
          trigger={{
            type: 'trial_exhausted',
            message: '试用次数已用完，请登录继续使用',
            urgency: 'high',
            allowSkip: false,
          }}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      // Should be accessible via keyboard
      const modal = screen.getByTestId('dialog-content');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');

      // Should handle Escape key
      await user.keyboard('{Escape}');
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should provide proper screen reader announcements', () => {
      const mockOnLogin = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <SmartLoginModal
          isOpen={true}
          trigger={{
            type: 'feature_required',
            message: '保存功能需要登录',
            urgency: 'medium',
            allowSkip: true,
          }}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const title = screen.getByTestId('dialog-title');
      const description = screen.getByTestId('dialog-description');

      expect(title).toHaveAttribute('id');
      expect(description).toHaveAttribute('id');
      
      const modal = screen.getByTestId('dialog-content');
      expect(modal).toHaveAttribute('aria-labelledby', title.id);
      expect(modal).toHaveAttribute('aria-describedby', description.id);
    });
  });

  describe('Requirements Coverage Integration', () => {
    it('✅ End-to-end requirement validation', async () => {
      // This integration test validates that all requirements work together:
      
      // 需求 1.4: 匿名试用功能
      const { result: trialResult } = renderHook(() => useAnonymousTrial());
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      expect(trialResult.current.remaining).toBe(5);

      // 需求 2.1-2.5: 智能登录触发
      const { result: authResult } = renderHook(() => useSmartAuth());
      await act(async () => {
        const allowed = await authResult.current.requireAuth('save_report');
        expect(allowed).toBe(false); // Should require login
      });

      // 需求 3.1-3.6: 社交登录
      const mockOnSuccess = jest.fn();
      const mockOnError = jest.fn();
      
      render(
        <SocialLoginButtons
          providers={[
            { id: 'github', name: 'GitHub', icon: () => <div>GitHub</div>, primary: true },
            { id: 'google', name: 'Google', icon: () => <div>Google</div>, primary: false },
          ]}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('使用 GitHub 登录')).toBeInTheDocument();
      expect(screen.getByText('使用 Google 登录')).toBeInTheDocument();

      // 需求 6.1: 移动端适配
      const mockOnLogin = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <SmartLoginModal
          isOpen={true}
          trigger={{
            type: 'trial_exhausted',
            message: '试用次数已用完',
            urgency: 'high',
            allowSkip: false,
          }}
          onLogin={mockOnLogin}
          onCancel={mockOnCancel}
        />
      );

      const modal = screen.getByTestId('dialog-content');
      expect(modal).toHaveClass('w-full', 'max-w-md');

      // 需求 7.1-7.4: 试用机制
      expect(trialResult.current.canUseTrial).toBe(true);
      expect(trialResult.current.getProgressPercentage).toBeDefined();
    });
  });
});