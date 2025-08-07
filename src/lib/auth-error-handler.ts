/**
 * Authentication Error Handler
 * 
 * Comprehensive error handling system for authentication flows
 * with retry mechanisms, fallback strategies, and user-friendly messaging.
 */

import { 
  AuthError, 
  AuthErrorType, 
  ErrorRecoveryStrategy, 
  FallbackAction, 
  RetryConfig,
  ErrorHandlerConfig,
  DEFAULT_ERROR_CONFIG,
  ERROR_PRESENTATION_MAP,
  ErrorSeverity
} from '@/types/auth-errors';

export class AuthErrorHandler {
  private config: ErrorHandlerConfig;
  private retryAttempts: Map<string, number> = new Map();
  private recoveryStrategies: Map<AuthErrorType, ErrorRecoveryStrategy> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    this.initializeRecoveryStrategies();
  }

  /**
   * Main error handling method
   */
  async handleError(
    error: any, 
    context?: { 
      provider?: string; 
      action?: string; 
      url?: string;
      userAgent?: string;
      [key: string]: any;
    }
  ): Promise<AuthError> {
    const authError = this.normalizeError(error, context);
    
    // Log error for debugging
    if (this.config.debugMode) {
      console.error('Auth Error:', authError);
    }

    // Track error analytics
    if (this.config.enableAnalytics) {
      await this.trackError(authError);
    }

    return authError;
  }

  /**
   * Normalize various error types into AuthError format
   */
  private normalizeError(error: any, context?: any): AuthError {
    const timestamp = new Date();
    
    // Handle NextAuth.js errors
    if (typeof error === 'string') {
      return this.createErrorFromString(error, context, timestamp);
    }

    // Handle Error objects
    if (error instanceof Error) {
      return this.createErrorFromErrorObject(error, context, timestamp);
    }

    // Handle OAuth errors
    if (error?.error) {
      return this.createOAuthError(error, context, timestamp);
    }

    // Handle network errors
    if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
      return this.createNetworkError(error, context, timestamp);
    }

    // Default unknown error
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: error?.message || 'An unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
      timestamp,
      context,
      details: error,
    };
  }

  private createErrorFromString(error: string, context: any, timestamp: Date): AuthError {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('oauth')) {
      return {
        type: AuthErrorType.OAUTH_ERROR,
        message: error,
        userMessage: 'Login failed. Please try again or use a different method.',
        retryable: true,
        timestamp,
        context,
      };
    }

    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message: error,
        userMessage: 'Network connection issue. Please check your internet and try again.',
        retryable: true,
        timestamp,
        context,
      };
    }

    if (lowerError.includes('session') || lowerError.includes('expired')) {
      return {
        type: AuthErrorType.SESSION_EXPIRED,
        message: error,
        userMessage: 'Your session has expired. Please sign in again.',
        retryable: false,
        timestamp,
        context,
      };
    }

    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: error,
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
      timestamp,
      context,
    };
  }

  private createErrorFromErrorObject(error: Error, context: any, timestamp: Date): AuthError {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) {
      return {
        type: AuthErrorType.TIMEOUT_ERROR,
        message: error.message,
        userMessage: 'The request timed out. Please try again.',
        retryable: true,
        timestamp,
        context,
        details: error,
      };
    }

    if (message.includes('network') || message.includes('fetch failed')) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message: error.message,
        userMessage: 'Network connection issue. Please check your internet and try again.',
        retryable: true,
        timestamp,
        context,
        details: error,
      };
    }

    return {
      type: AuthErrorType.INTERNAL_ERROR,
      message: error.message,
      userMessage: 'An internal error occurred. Please try again.',
      retryable: true,
      timestamp,
      context,
      details: error,
    };
  }

  private createOAuthError(error: any, context: any, timestamp: Date): AuthError {
    const oauthError = error.error;
    const errorDescription = error.error_description || '';
    
    switch (oauthError) {
      case 'access_denied':
        return {
          type: AuthErrorType.OAUTH_ACCESS_DENIED,
          message: `OAuth access denied: ${errorDescription}`,
          userMessage: 'Access was denied. Please try again and grant the necessary permissions.',
          retryable: true,
          timestamp,
          context,
          details: error,
        };
      
      case 'invalid_request':
        return {
          type: AuthErrorType.OAUTH_INVALID_REQUEST,
          message: `OAuth invalid request: ${errorDescription}`,
          userMessage: 'There was an issue with the login request. Please try again.',
          retryable: true,
          timestamp,
          context,
          details: error,
        };
      
      case 'invalid_client':
        return {
          type: AuthErrorType.OAUTH_INVALID_CLIENT,
          message: `OAuth invalid client: ${errorDescription}`,
          userMessage: 'There is a configuration issue. Please contact support.',
          retryable: false,
          timestamp,
          context,
          details: error,
        };
      
      case 'invalid_grant':
        return {
          type: AuthErrorType.OAUTH_INVALID_GRANT,
          message: `OAuth invalid grant: ${errorDescription}`,
          userMessage: 'The authorization grant is invalid. Please try signing in again.',
          retryable: true,
          timestamp,
          context,
          details: error,
        };
      
      case 'unauthorized_client':
        return {
          type: AuthErrorType.OAUTH_UNAUTHORIZED_CLIENT,
          message: `OAuth unauthorized client: ${errorDescription}`,
          userMessage: 'This application is not authorized. Please contact support.',
          retryable: false,
          timestamp,
          context,
          details: error,
        };
      
      case 'unsupported_grant_type':
        return {
          type: AuthErrorType.OAUTH_UNSUPPORTED_GRANT_TYPE,
          message: `OAuth unsupported grant type: ${errorDescription}`,
          userMessage: 'This login method is not supported. Please try a different method.',
          retryable: false,
          timestamp,
          context,
          details: error,
        };
      
      case 'invalid_scope':
        return {
          type: AuthErrorType.OAUTH_INVALID_SCOPE,
          message: `OAuth invalid scope: ${errorDescription}`,
          userMessage: 'There was an issue with the requested permissions. Please try again.',
          retryable: true,
          timestamp,
          context,
          details: error,
        };
      
      default:
        return {
          type: AuthErrorType.OAUTH_ERROR,
          message: `OAuth error: ${oauthError} - ${errorDescription}`,
          userMessage: 'Login failed. Please try again or use a different method.',
          retryable: true,
          timestamp,
          context,
          details: error,
        };
    }
  }

  private createNetworkError(error: any, context: any, timestamp: Date): AuthError {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: error.message || 'Network error occurred',
      userMessage: 'Network connection issue. Please check your internet and try again.',
      retryable: true,
      timestamp,
      context,
      details: error,
    };
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error: AuthError, context?: any): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.type);
    
    if (!strategy || !this.config.enableFallback) {
      return false;
    }

    if (!strategy.canRecover(error)) {
      return false;
    }

    try {
      return await strategy.recover(error, context);
    } catch (recoveryError) {
      if (this.config.debugMode) {
        console.error('Recovery failed:', recoveryError);
      }
      return false;
    }
  }

  /**
   * Get fallback action for an error
   */
  getFallbackAction(error: AuthError): FallbackAction {
    const strategy = this.recoveryStrategies.get(error.type);
    
    if (strategy) {
      return strategy.getFallbackAction(error);
    }

    // Default fallback action
    return {
      type: 'retry',
      message: 'Try again',
      action: () => window.location.reload(),
    };
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error: AuthError, attemptKey: string): boolean {
    if (!this.config.enableRetry || !error.retryable) {
      return false;
    }

    const attempts = this.retryAttempts.get(attemptKey) || 0;
    const maxAttempts = this.config.retryConfig.maxAttempts;
    
    return attempts < maxAttempts && 
           this.config.retryConfig.retryableErrors.includes(error.type);
  }

  /**
   * Execute retry with exponential backoff
   */
  async executeRetry<T>(
    attemptKey: string,
    operation: () => Promise<T>,
    error: AuthError
  ): Promise<T> {
    const attempts = this.retryAttempts.get(attemptKey) || 0;
    this.retryAttempts.set(attemptKey, attempts + 1);

    const delay = Math.min(
      this.config.retryConfig.baseDelay * Math.pow(this.config.retryConfig.backoffMultiplier, attempts),
      this.config.retryConfig.maxDelay
    );

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return operation();
  }

  /**
   * Reset retry attempts for a key
   */
  resetRetryAttempts(attemptKey: string): void {
    this.retryAttempts.delete(attemptKey);
  }

  /**
   * Get error presentation configuration
   */
  getErrorPresentation(error: AuthError) {
    return ERROR_PRESENTATION_MAP[error.type] || ERROR_PRESENTATION_MAP[AuthErrorType.UNKNOWN_ERROR];
  }

  /**
   * Track error for analytics
   */
  private async trackError(error: AuthError): Promise<void> {
    try {
      // Track to login analytics table
      const response = await fetch('/api/auth/analytics/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error_type: error.type,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp.toISOString(),
        }),
      });

      if (!response.ok && this.config.debugMode) {
        console.warn('Failed to track error analytics');
      }
    } catch (trackingError) {
      if (this.config.debugMode) {
        console.warn('Error tracking failed:', trackingError);
      }
    }
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Network error recovery
    this.recoveryStrategies.set(AuthErrorType.NETWORK_ERROR, {
      canRecover: () => true,
      recover: async () => {
        // Check network connectivity
        try {
          await fetch('/api/health', { method: 'HEAD' });
          return true;
        } catch {
          return false;
        }
      },
      getFallbackAction: () => ({
        type: 'retry',
        message: 'Check connection and retry',
        delay: 2000,
      }),
    });

    // OAuth error recovery
    this.recoveryStrategies.set(AuthErrorType.OAUTH_ERROR, {
      canRecover: (error) => !error.message.includes('invalid_client'),
      recover: async () => {
        // Clear any cached OAuth state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_state');
        }
        return true;
      },
      getFallbackAction: (error) => ({
        type: 'alternative_method',
        message: 'Try a different login method',
        data: { excludeProvider: error.context?.provider },
      }),
    });

    // Session expired recovery
    this.recoveryStrategies.set(AuthErrorType.SESSION_EXPIRED, {
      canRecover: () => true,
      recover: async () => {
        // Clear session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('next-auth.session-token');
          sessionStorage.clear();
        }
        return true;
      },
      getFallbackAction: () => ({
        type: 'refresh_page',
        message: 'Refresh and sign in again',
        action: () => window.location.reload(),
      }),
    });

    // Rate limiting recovery
    this.recoveryStrategies.set(AuthErrorType.RATE_LIMITED, {
      canRecover: () => true,
      recover: async (error) => {
        const waitTime = error.retryAfter || 60;
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return true;
      },
      getFallbackAction: (error) => ({
        type: 'wait',
        message: `Please wait ${error.retryAfter || 60} seconds before trying again`,
        delay: (error.retryAfter || 60) * 1000,
      }),
    });

    // Provider unavailable recovery
    this.recoveryStrategies.set(AuthErrorType.PROVIDER_UNAVAILABLE, {
      canRecover: () => true,
      recover: async () => false, // Can't recover from provider issues
      getFallbackAction: (error) => ({
        type: 'alternative_method',
        message: `${error.context?.provider || 'This provider'} is currently unavailable. Try another method.`,
        data: { excludeProvider: error.context?.provider },
      }),
    });
  }
}

// Singleton instance
export const authErrorHandler = new AuthErrorHandler();

// Utility functions for common error handling patterns
export const handleAuthError = (error: any, context?: any) => {
  return authErrorHandler.handleError(error, context);
};

export const shouldRetryAuthError = (error: AuthError, key: string) => {
  return authErrorHandler.shouldRetry(error, key);
};

export const executeAuthRetry = <T>(key: string, operation: () => Promise<T>, error: AuthError) => {
  return authErrorHandler.executeRetry(key, operation, error);
};

export const getAuthErrorPresentation = (error: AuthError) => {
  return authErrorHandler.getErrorPresentation(error);
};

export const getAuthErrorFallback = (error: AuthError) => {
  return authErrorHandler.getFallbackAction(error);
};