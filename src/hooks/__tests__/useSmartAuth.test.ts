/**
 * Smart Authentication Hook Tests
 * 
 * Tests for the useSmartAuth hook that manages intelligent login triggering
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useSmartAuth } from '../useSmartAuth';
import { AuthTriggerType, LoginContext } from '@/types/auth-errors';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the anonymous trial hook
const mockTrialHook = {
  remaining: 5,
  total: 5,
  canUseTrial: true,
  canPerformAction: jest.fn(() => true),
  consumeTrial: jest.fn(() => Promise.resolve(true)),
  loading: false,
  error: null,
};

jest.mock('../useAnonymousTrial', () => ({
  useAnonymousTrial: jest.fn(() => mockTrialHook),
}));

// Mock the login modal
const mockShowModal = jest.fn();
jest.mock('@/components/auth/SmartLoginModal', () => ({
  useSmartLoginModal: jest.fn(() => ({
    showModal: mockShowModal,
    hideModal: jest.fn(),
    isVisible: false,
  })),
}));

describe('useSmartAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrialHook.remaining = 5;
    mockTrialHook.canUseTrial = true;
    mockTrialHook.canPerformAction.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication State', () => {
    it('should return correct authentication state for unauthenticated user', () => {
      const { result } = renderHook(() => useSmartAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should return correct authentication state for authenticated user', () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSmartAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('should handle loading state', () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.useSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const { result } = renderHook(() => useSmartAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Smart Authentication Logic', () => {
    it('should allow action for authenticated users', async () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.useSession.mockReturnValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const allowed = await result.current.requireAuth('save_report');
        expect(allowed).toBe(true);
      });

      expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('should allow action for unauthenticated users with trial available', async () => {
      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const allowed = await result.current.requireAuth('video_analysis', {
          allowTrial: true,
        });
        expect(allowed).toBe(true);
      });

      expect(mockTrialHook.consumeTrial).toHaveBeenCalledWith('video_analysis', undefined);
      expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('should show login modal when trial exhausted', async () => {
      mockTrialHook.remaining = 0;
      mockTrialHook.canUseTrial = false;
      mockTrialHook.canPerformAction.mockReturnValue(false);

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const allowed = await result.current.requireAuth('video_analysis', {
          allowTrial: true,
        });
        expect(allowed).toBe(false);
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        trigger: {
          type: 'trial_exhausted',
          message: expect.stringContaining('试用次数已用完'),
          urgency: 'high',
          allowSkip: false,
        },
        context: expect.objectContaining({
          previousAction: 'video_analysis',
        }),
      });
    });

    it('should show login modal for actions requiring authentication', async () => {
      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const allowed = await result.current.requireAuth('save_report');
        expect(allowed).toBe(false);
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        trigger: {
          type: 'feature_required',
          message: expect.stringContaining('需要登录'),
          urgency: 'medium',
          allowSkip: false,
        },
        context: expect.objectContaining({
          previousAction: 'save_report',
        }),
      });
    });

    it('should handle different urgency levels', async () => {
      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        await result.current.requireAuth('premium_feature', {
          urgency: 'low',
        });
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        trigger: expect.objectContaining({
          urgency: 'low',
        }),
        context: expect.any(Object),
      });
    });

    it('should allow skipping when configured', async () => {
      const { result } = renderHook(() => useSmartAuth());

      const onSkip = jest.fn();

      await act(async () => {
        await result.current.requireAuth('optional_feature', {
          allowSkip: true,
          onSkip,
        });
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        trigger: expect.objectContaining({
          allowSkip: true,
        }),
        context: expect.any(Object),
      });
    });
  });

  describe('Feature Access Control', () => {
    it('should check feature access correctly', () => {
      const { result } = renderHook(() => useSmartAuth());

      const access = result.current.checkFeatureAccess('video_analysis');

      expect(access.allowed).toBe(true);
      expect(access.reason).toBe('trial');
    });

    it('should deny access when trial exhausted and not authenticated', () => {
      mockTrialHook.remaining = 0;
      mockTrialHook.canUseTrial = false;
      mockTrialHook.canPerformAction.mockReturnValue(false);

      const { result } = renderHook(() => useSmartAuth());

      const access = result.current.checkFeatureAccess('video_analysis');

      expect(access.allowed).toBe(false);
      expect(access.reason).toBe('blocked');
      expect(access.message).toContain('试用次数已用完');
    });

    it('should allow access for authenticated users', () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.useSession.mockReturnValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSmartAuth());

      const access = result.current.checkFeatureAccess('premium_feature');

      expect(access.allowed).toBe(true);
      expect(access.reason).toBe('authenticated');
    });

    it('should handle premium features requiring upgrade', () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.useSession.mockReturnValue({
        data: { 
          user: { 
            id: '1', 
            email: 'test@example.com',
            plan: 'free' 
          } 
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSmartAuth());

      const access = result.current.checkFeatureAccess('enterprise_feature');

      expect(access.allowed).toBe(false);
      expect(access.upgradeRequired).toBe(true);
    });
  });

  describe('Login Methods', () => {
    it('should handle social login', async () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.signIn.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const success = await result.current.login('github');
        expect(success).toBe(true);
      });

      expect(signIn).toHaveBeenCalledWith('github', { redirect: false });
    });

    it('should handle login failure', async () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.signIn.mockResolvedValue({ ok: false, error: 'AccessDenied' });

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const success = await result.current.login('github');
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('登录失败');
    });

    it('should handle logout', async () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.signOut.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(signOut).toHaveBeenCalledWith({ redirect: false });
    });
  });

  describe('Context and Metadata', () => {
    it('should preserve context information', async () => {
      const { result } = renderHook(() => useSmartAuth());

      const context: LoginContext = {
        previousAction: 'save_report',
        returnUrl: '/reports',
        metadata: { reportId: '123' },
      };

      await act(async () => {
        await result.current.requireAuth('save_report', { context });
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        trigger: expect.any(Object),
        context: expect.objectContaining({
          previousAction: 'save_report',
          returnUrl: '/reports',
          metadata: { reportId: '123' },
        }),
      });
    });

    it('should generate appropriate messages for different triggers', async () => {
      const { result } = renderHook(() => useSmartAuth());

      const testCases = [
        { action: 'save_report', expectedMessage: '保存报告需要登录' },
        { action: 'export_data', expectedMessage: '导出数据需要登录' },
        { action: 'team_collaboration', expectedMessage: '团队协作功能需要登录' },
      ];

      for (const testCase of testCases) {
        await act(async () => {
          await result.current.requireAuth(testCase.action);
        });

        expect(mockShowModal).toHaveBeenCalledWith({
          trigger: expect.objectContaining({
            message: expect.stringContaining(testCase.expectedMessage),
          }),
          context: expect.any(Object),
        });
      }
    });
  });

  describe('Trial Integration', () => {
    it('should consume trial when action is allowed', async () => {
      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        await result.current.requireAuth('video_analysis', {
          allowTrial: true,
          metadata: { videoId: 'test-123' },
        });
      });

      expect(mockTrialHook.consumeTrial).toHaveBeenCalledWith(
        'video_analysis',
        { videoId: 'test-123' }
      );
    });

    it('should not consume trial when action is not allowed', async () => {
      mockTrialHook.canPerformAction.mockReturnValue(false);

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        await result.current.requireAuth('video_analysis', {
          allowTrial: true,
        });
      });

      expect(mockTrialHook.consumeTrial).not.toHaveBeenCalled();
    });

    it('should handle trial consumption failure', async () => {
      mockTrialHook.consumeTrial.mockResolvedValue(false);

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const allowed = await result.current.requireAuth('video_analysis', {
          allowTrial: true,
        });
        expect(allowed).toBe(false);
      });

      expect(mockShowModal).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const nextAuthModule = require('next-auth/react');
      nextAuthModule.signIn.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        const success = await result.current.login('github');
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
    });

    it('should clear errors on successful operations', async () => {
      const nextAuthModule = require('next-auth/react');
      
      // First, cause an error
      nextAuthModule.signIn.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useSmartAuth());

      await act(async () => {
        await result.current.login('github');
      });

      expect(result.current.error).toBeTruthy();

      // Then, succeed
      signIn.mockResolvedValue({ ok: true });

      await act(async () => {
        await result.current.login('github');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Requirements Coverage', () => {
    it('✅ 需求 2.1: 智能判断登录时机', async () => {
      const { result } = renderHook(() => useSmartAuth());

      // Test different scenarios
      await act(async () => {
        // Should allow with trial
        let allowed = await result.current.requireAuth('video_analysis', { allowTrial: true });
        expect(allowed).toBe(true);

        // Should require login for save actions
        allowed = await result.current.requireAuth('save_report');
        expect(allowed).toBe(false);
      });
    });

    it('✅ 需求 2.2-2.5: 不同功能的登录检查', async () => {
      const { result } = renderHook(() => useSmartAuth());

      const requiredAuthActions = [
        'save_report',
        'create_project', 
        'access_history',
        'premium_feature',
        'export_data'
      ];

      for (const action of requiredAuthActions) {
        await act(async () => {
          const allowed = await result.current.requireAuth(action);
          expect(allowed).toBe(false);
        });
        
        expect(mockShowModal).toHaveBeenCalled();
      }
    });

    it('✅ 需求 3.4: 登录成功后继续之前操作', async () => {
      const { result } = renderHook(() => useSmartAuth());

      const context = {
        previousAction: 'save_report',
        returnUrl: '/reports/123',
        metadata: { reportId: '123' },
      };

      await act(async () => {
        await result.current.requireAuth('save_report', { context });
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        trigger: expect.any(Object),
        context: expect.objectContaining(context),
      });
    });
  });
});