/**
 * Authentication Error Handler Test Suite
 * 
 * Comprehensive tests for the authentication error handling system
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { AuthErrorHandler } from '../auth-error-handler';
import { 
  AuthError, 
  AuthErrorType, 
  DEFAULT_ERROR_CONFIG,
  DEFAULT_RETRY_CONFIG 
} from '../../types/auth-errors';

// Mock fetch for analytics tracking
global.fetch = jest.fn();

describe('AuthErrorHandler', () => {
  let errorHandler: AuthErrorHandler;

  beforeEach(() => {
    errorHandler = new AuthErrorHandler();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Normalization', () => {
    it('should normalize string errors correctly', async () => {
      const error = await errorHandler.handleError('oauth error occurred');
      
      expect(error.type).toBe(AuthErrorType.OAUTH_ERROR);
      expect(error.message).toBe('oauth error occurred');
      expect(error.userMessage).toBe('Login failed. Please try again or use a different method.');
      expect(error.retryable).toBe(true);
    });

    it('should normalize network errors correctly', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      const error = await errorHandler.handleError(networkError);
      
      expect(error.type).toBe(AuthErrorType.NETWORK_ERROR);
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('Network connection issue');
    });

    it('should normalize OAuth errors correctly', async () => {
      const oauthError = {
        error: 'access_denied',
        error_description: 'User denied access'
      };
      
      const error = await errorHandler.handleError(oauthError);
      
      expect(error.type).toBe(AuthErrorType.OAUTH_ACCESS_DENIED);
      expect(error.message).toContain('OAuth access denied');
      expect(error.userMessage).toContain('Access was denied');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      const error = await errorHandler.handleError(timeoutError);
      
      expect(error.type).toBe(AuthErrorType.TIMEOUT_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('should handle session expired errors', async () => {
      const error = await errorHandler.handleError('Session has expired');
      
      expect(error.type).toBe(AuthErrorType.SESSION_EXPIRED);
      expect(error.retryable).toBe(false);
    });
  });

  describe('OAuth Error Handling', () => {
    const oauthErrorCases = [
      {
        error: 'access_denied',
        expectedType: AuthErrorType.OAUTH_ACCESS_DENIED,
        expectedRetryable: true
      },
      {
        error: 'invalid_client',
        expectedType: AuthErrorType.OAUTH_INVALID_CLIENT,
        expectedRetryable: false
      },
      {
        error: 'invalid_grant',
        expectedType: AuthErrorType.OAUTH_INVALID_GRANT,
        expectedRetryable: true
      },
      {
        error: 'unauthorized_client',
        expectedType: AuthErrorType.OAUTH_UNAUTHORIZED_CLIENT,
        expectedRetryable: false
      },
      {
        error: 'unsupported_grant_type',
        expectedType: AuthErrorType.OAUTH_UNSUPPORTED_GRANT_TYPE,
        expectedRetryable: false
      },
      {
        error: 'invalid_scope',
        expectedType: AuthErrorType.OAUTH_INVALID_SCOPE,
        expectedRetryable: true
      }
    ];

    oauthErrorCases.forEach(({ error, expectedType, expectedRetryable }) => {
      it(`should handle OAuth ${error} error correctly`, async () => {
        const oauthError = {
          error,
          error_description: `Test ${error} error`
        };
        
        const authError = await errorHandler.handleError(oauthError);
        
        expect(authError.type).toBe(expectedType);
        expect(authError.retryable).toBe(expectedRetryable);
        expect(authError.message).toContain(error);
      });
    });
  });

  describe('Retry Mechanism', () => {
    it('should determine retryable errors correctly', () => {
      const retryableError: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const nonRetryableError: AuthError = {
        type: AuthErrorType.OAUTH_INVALID_CLIENT,
        message: 'Invalid client',
        userMessage: 'Invalid client',
        retryable: false,
        timestamp: new Date()
      };

      expect(errorHandler.shouldRetry(retryableError, 'test-key')).toBe(true);
      expect(errorHandler.shouldRetry(nonRetryableError, 'test-key')).toBe(false);
    });

    it('should respect max retry attempts', () => {
      const error: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const key = 'test-retry-key';
      
      // First few attempts should be allowed
      expect(errorHandler.shouldRetry(error, key)).toBe(true);
      expect(errorHandler.shouldRetry(error, key)).toBe(true);
      expect(errorHandler.shouldRetry(error, key)).toBe(true);
      
      // After max attempts, should not retry
      expect(errorHandler.shouldRetry(error, key)).toBe(false);
    });

    it('should reset retry attempts', () => {
      const error: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const key = 'test-reset-key';
      
      // Exhaust retry attempts
      errorHandler.shouldRetry(error, key);
      errorHandler.shouldRetry(error, key);
      errorHandler.shouldRetry(error, key);
      expect(errorHandler.shouldRetry(error, key)).toBe(false);
      
      // Reset and try again
      errorHandler.resetRetryAttempts(key);
      expect(errorHandler.shouldRetry(error, key)).toBe(true);
    });

    it('should execute retry with exponential backoff', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const error: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const startTime = Date.now();
      const result = await errorHandler.executeRetry('test-backoff', mockOperation, error);
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalled();
      // Should have some delay (at least base delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(DEFAULT_RETRY_CONFIG.baseDelay - 100);
    });
  });

  describe('Recovery Strategies', () => {
    it('should attempt network error recovery', async () => {
      // Mock successful network check
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const error: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const recovered = await errorHandler.attemptRecovery(error);
      expect(recovered).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/health', { method: 'HEAD' });
    });

    it('should handle network recovery failure', async () => {
      // Mock failed network check
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      const error: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const recovered = await errorHandler.attemptRecovery(error);
      expect(recovered).toBe(false);
    });

    it('should provide appropriate fallback actions', () => {
      const networkError: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const fallback = errorHandler.getFallbackAction(networkError);
      expect(fallback.type).toBe('retry');
      expect(fallback.message).toContain('retry');
    });

    it('should handle OAuth error recovery', async () => {
      // Mock localStorage for OAuth state cleanup
      const mockLocalStorage = {
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      const error: AuthError = {
        type: AuthErrorType.OAUTH_ERROR,
        message: 'OAuth error',
        userMessage: 'OAuth error',
        retryable: true,
        timestamp: new Date(),
        context: { provider: 'github' }
      };

      const recovered = await errorHandler.attemptRecovery(error);
      expect(recovered).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('oauth_state');
    });
  });

  describe('Error Presentation', () => {
    it('should return correct presentation config for different error types', () => {
      const networkError: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        retryable: true,
        timestamp: new Date()
      };

      const presentation = errorHandler.getErrorPresentation(networkError);
      expect(presentation.severity).toBe('medium');
      expect(presentation.showToast).toBe(true);
      expect(presentation.autoHide).toBe(true);
    });

    it('should handle critical errors with appropriate presentation', () => {
      const criticalError: AuthError = {
        type: AuthErrorType.CONFIGURATION_ERROR,
        message: 'Config error',
        userMessage: 'Config error',
        retryable: false,
        timestamp: new Date()
      };

      const presentation = errorHandler.getErrorPresentation(criticalError);
      expect(presentation.severity).toBe('critical');
      expect(presentation.showModal).toBe(true);
      expect(presentation.autoHide).toBe(false);
    });
  });

  describe('Analytics Tracking', () => {
    it('should track errors when analytics is enabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const errorHandlerWithAnalytics = new AuthErrorHandler({
        enableAnalytics: true,
        debugMode: false
      });

      await errorHandlerWithAnalytics.handleError('test error', {
        provider: 'github',
        action: 'signin'
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/analytics/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('test error')
      });
    });

    it('should not track errors when analytics is disabled', async () => {
      const errorHandlerWithoutAnalytics = new AuthErrorHandler({
        enableAnalytics: false
      });

      await errorHandlerWithoutAnalytics.handleError('test error');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle analytics tracking failures gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Analytics failed'));

      const errorHandlerWithAnalytics = new AuthErrorHandler({
        enableAnalytics: true,
        debugMode: false
      });

      // Should not throw even if analytics fails
      await expect(errorHandlerWithAnalytics.handleError('test error')).resolves.toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const handler = new AuthErrorHandler();
      expect(handler['config']).toEqual(DEFAULT_ERROR_CONFIG);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        enableRetry: false,
        retryConfig: {
          maxAttempts: 5
        }
      };

      const handler = new AuthErrorHandler(customConfig);
      expect(handler['config'].enableRetry).toBe(false);
      expect(handler['config'].retryConfig.maxAttempts).toBe(5);
      expect(handler['config'].enableFallback).toBe(DEFAULT_ERROR_CONFIG.enableFallback);
    });
  });

  describe('Context Handling', () => {
    it('should preserve context information in errors', async () => {
      const context = {
        provider: 'github',
        action: 'signin',
        url: 'https://example.com',
        userAgent: 'test-agent'
      };

      const error = await errorHandler.handleError('test error', context);
      
      expect(error.context).toEqual(context);
    });

    it('should handle missing context gracefully', async () => {
      const error = await errorHandler.handleError('test error');
      
      expect(error.context).toBeUndefined();
      expect(error.type).toBeDefined();
      expect(error.message).toBeDefined();
    });
  });
});