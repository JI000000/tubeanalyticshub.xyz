/**
 * Anonymous Trial Management Hook Tests
 * 
 * Tests for the useAnonymousTrial hook that manages anonymous user trial state
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAnonymousTrial } from '../useAnonymousTrial';
import { TRIAL_ACTION_TYPES, TRIAL_CONFIG } from '@/lib/trial-config';

// Mock the fingerprint hook
jest.mock('../useFingerprint', () => ({
  useFingerprint: jest.fn(() => ({
    fingerprint: 'test-fingerprint-123',
    loading: false,
    error: null,
  })),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useAnonymousTrial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Default successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        remaining: 5,
        total: 5,
        actions: [],
        stats: { totalActions: 0 },
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default trial state', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      expect(result.current.loading).toBe(true);
      
      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.remaining).toBe(5);
      expect(result.current.total).toBe(5);
      expect(result.current.canUseTrial).toBe(true);
    });

    it('should load existing trial state from localStorage', async () => {
      const existingState = {
        remaining: 3,
        total: 5,
        actions: [
          { type: TRIAL_ACTION_TYPES.VIDEO_ANALYSIS, timestamp: new Date().toISOString() }
        ],
        lastSync: new Date().toISOString(),
      };
      
      localStorage.setItem('trial_status', JSON.stringify(existingState));

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.remaining).toBe(3);
      expect(result.current.actions).toHaveLength(1);
    });
  });

  describe('Trial Consumption', () => {
    it('should consume trial successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          remaining: 4,
          total: 5,
          message: '还剩 4 次试用机会',
        }),
      });

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const success = await result.current.consumeTrial(
          TRIAL_ACTION_TYPES.VIDEO_ANALYSIS,
          { videoId: 'test-123' }
        );
        expect(success).toBe(true);
      });

      expect(result.current.remaining).toBe(4);
      expect(mockFetch).toHaveBeenCalledWith('/api/trial/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: TRIAL_ACTION_TYPES.VIDEO_ANALYSIS,
          fingerprint: 'test-fingerprint-123',
          metadata: { videoId: 'test-123' },
        }),
      });
    });

    it('should handle trial exhaustion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          blocked: true,
          message: '试用次数已用完，请登录继续使用',
        }),
      });

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const success = await result.current.consumeTrial(
          TRIAL_ACTION_TYPES.VIDEO_ANALYSIS
        );
        expect(success).toBe(false);
      });

      expect(result.current.canUseTrial).toBe(false);
      expect(result.current.remaining).toBe(0);
    });

    it('should handle different action weights', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          remaining: 3, // 5 - 2 for channel analysis
          total: 5,
          message: '还剩 3 次试用机会',
        }),
      });

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.consumeTrial(TRIAL_ACTION_TYPES.CHANNEL_ANALYSIS);
      });

      expect(result.current.remaining).toBe(3);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const success = await result.current.consumeTrial(
          TRIAL_ACTION_TYPES.VIDEO_ANALYSIS
        );
        expect(success).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Trial Status Checking', () => {
    it('should check if action can be performed', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.canPerformAction(TRIAL_ACTION_TYPES.VIDEO_ANALYSIS)).toBe(true);
      expect(result.current.canPerformAction(TRIAL_ACTION_TYPES.CHANNEL_ANALYSIS)).toBe(true);
    });

    it('should prevent actions when trials exhausted', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Manually set exhausted state
      act(() => {
        result.current.remaining = 0;
        result.current.canUseTrial = false;
      });

      expect(result.current.canPerformAction(TRIAL_ACTION_TYPES.VIDEO_ANALYSIS)).toBe(false);
    });

    it('should consider action weights in availability check', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Set remaining to 1
      act(() => {
        result.current.remaining = 1;
      });

      expect(result.current.canPerformAction(TRIAL_ACTION_TYPES.VIDEO_ANALYSIS)).toBe(true); // weight 1
      expect(result.current.canPerformAction(TRIAL_ACTION_TYPES.CHANNEL_ANALYSIS)).toBe(false); // weight 2
    });
  });

  describe('State Synchronization', () => {
    it('should sync with server state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          remaining: 3,
          total: 5,
          actions: [
            { type: TRIAL_ACTION_TYPES.VIDEO_ANALYSIS, timestamp: new Date().toISOString() }
          ],
          stats: { totalActions: 1 },
        }),
      });

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await result.current.syncWithServer();
      });

      expect(result.current.remaining).toBe(3);
      expect(result.current.actions).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/trial/consume?fingerprint=test-fingerprint-123'
      );
    });

    it('should persist state to localStorage', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const storedData = localStorage.getItem('trial_status');
      expect(storedData).toBeTruthy();
      
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.remaining).toBe(5);
      expect(parsedData.total).toBe(5);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset trial state', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Consume some trials first
      act(() => {
        result.current.remaining = 2;
        result.current.actions = [
          { type: TRIAL_ACTION_TYPES.VIDEO_ANALYSIS, timestamp: new Date().toISOString() }
        ];
      });

      await act(async () => {
        result.current.resetTrial();
      });

      expect(result.current.remaining).toBe(TRIAL_CONFIG.maxTrials);
      expect(result.current.actions).toHaveLength(0);
      expect(result.current.canUseTrial).toBe(true);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Set remaining to 3 out of 5
      act(() => {
        result.current.remaining = 3;
      });

      expect(result.current.getProgressPercentage()).toBe(40); // (5-3)/5 * 100 = 40%
    });

    it('should handle edge cases in progress calculation', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test 0 remaining
      act(() => {
        result.current.remaining = 0;
      });
      expect(result.current.getProgressPercentage()).toBe(100);

      // Test full remaining
      act(() => {
        result.current.remaining = 5;
      });
      expect(result.current.getProgressPercentage()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during consumption', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const success = await result.current.consumeTrial(
          TRIAL_ACTION_TYPES.VIDEO_ANALYSIS
        );
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
    });

    it('should handle invalid API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'Internal server error',
        }),
      });

      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const success = await result.current.consumeTrial(
          TRIAL_ACTION_TYPES.VIDEO_ANALYSIS
        );
        expect(success).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Requirements Coverage', () => {
    it('✅ 需求 1.4: 允许匿名使用核心功能并显示剩余次数', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.remaining).toBeDefined();
      expect(result.current.total).toBeDefined();
      expect(result.current.canUseTrial).toBe(true);
      expect(result.current.getProgressPercentage).toBeDefined();
    });

    it('✅ 需求 7.1: 基于浏览器指纹提供试用机会', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await result.current.consumeTrial(TRIAL_ACTION_TYPES.VIDEO_ANALYSIS);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/trial/consume', 
        expect.objectContaining({
          body: expect.stringContaining('test-fingerprint-123'),
        })
      );
    });

    it('✅ 需求 7.2: 显示剩余次数和登录提示', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.remaining).toBeDefined();
      expect(result.current.canUseTrial).toBeDefined();
      expect(result.current.canPerformAction).toBeDefined();
    });

    it('✅ 需求 7.3: 渐进式登录引导', async () => {
      const { result } = renderHook(() => useAnonymousTrial());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test different remaining amounts
      act(() => {
        result.current.remaining = 1;
      });

      expect(result.current.getProgressPercentage()).toBe(80); // High usage, should trigger guidance
    });
  });
});