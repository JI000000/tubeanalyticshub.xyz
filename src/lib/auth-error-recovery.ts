/**
 * Advanced Authentication Error Recovery Utilities
 * 
 * Additional recovery strategies and utilities for handling complex error scenarios
 */

import { 
  AuthError, 
  AuthErrorType, 
  FallbackAction,
  ErrorRecoveryStrategy 
} from '@/types/auth-errors';

export interface RecoveryContext {
  provider?: string;
  action?: string;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  userId?: string;
  retryCount?: number;
  lastSuccessfulAuth?: Date;
  [key: string]: any;
}

export interface RecoveryResult {
  success: boolean;
  action?: FallbackAction;
  message?: string;
  data?: any;
}

/**
 * Advanced recovery strategies for complex error scenarios
 */
export class AdvancedErrorRecovery {
  private static instance: AdvancedErrorRecovery;
  
  public static getInstance(): AdvancedErrorRecovery {
    if (!AdvancedErrorRecovery.instance) {
      AdvancedErrorRecovery.instance = new AdvancedErrorRecovery();
    }
    return AdvancedErrorRecovery.instance;
  }

  /**
   * Attempt intelligent error recovery based on error patterns and context
   */
  async attemptIntelligentRecovery(
    error: AuthError, 
    context: RecoveryContext = {}
  ): Promise<RecoveryResult> {
    switch (error.type) {
      case AuthErrorType.NETWORK_ERROR:
        return this.recoverNetworkError(error, context);
      
      case AuthErrorType.OAUTH_ACCESS_DENIED:
        return this.recoverOAuthDenied(error, context);
      
      case AuthErrorType.SESSION_EXPIRED:
        return this.recoverSessionExpired(error, context);
      
      case AuthErrorType.RATE_LIMITED:
        return this.recoverRateLimit(error, context);
      
      case AuthErrorType.PROVIDER_UNAVAILABLE:
        return this.recoverProviderUnavailable(error, context);
      
      case AuthErrorType.OAUTH_INVALID_CLIENT:
        return this.recoverInvalidClient(error, context);
      
      case AuthErrorType.CONFIGURATION_ERROR:
        return this.recoverConfigurationError(error, context);
      
      default:
        return this.recoverGenericError(error, context);
    }
  }

  /**
   * Network error recovery with connection testing
   */
  private async recoverNetworkError(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    try {
      // Test basic connectivity
      const isOnline = await this.testConnectivity();
      
      if (!isOnline) {
        return {
          success: false,
          action: {
            type: 'wait',
            message: 'No internet connection. Please check your network and try again.',
            delay: 5000,
          },
          message: 'Network connectivity issue detected'
        };
      }

      // Test API endpoint availability
      const apiAvailable = await this.testApiEndpoint();
      
      if (!apiAvailable) {
        return {
          success: false,
          action: {
            type: 'contact_support',
            message: 'Our servers are experiencing issues. Please try again later or contact support.',
          },
          message: 'API endpoint unavailable'
        };
      }

      // Network seems fine, suggest retry
      return {
        success: true,
        action: {
          type: 'retry',
          message: 'Connection restored. Try again.',
          delay: 1000,
        },
        message: 'Network connectivity restored'
      };

    } catch (recoveryError) {
      return {
        success: false,
        action: {
          type: 'refresh_page',
          message: 'Unable to diagnose network issue. Refresh the page to try again.',
        },
        message: 'Network recovery failed'
      };
    }
  }

  /**
   * OAuth access denied recovery with user guidance
   */
  private async recoverOAuthDenied(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const provider = context.provider || 'the provider';
    
    // Check if this is a repeated denial
    const denialCount = await this.getDenialCount(context.provider);
    
    if (denialCount > 2) {
      return {
        success: false,
        action: {
          type: 'alternative_method',
          message: `Having trouble with ${provider}? Try a different sign-in method.`,
          data: { excludeProvider: context.provider }
        },
        message: 'Multiple OAuth denials detected'
      };
    }

    // Provide guidance for first-time denials
    return {
      success: false,
      action: {
        type: 'retry',
        message: `To continue, please grant permission when signing in with ${provider}.`,
        delay: 2000,
      },
      message: 'OAuth permission guidance provided'
    };
  }

  /**
   * Session expired recovery with smart refresh
   */
  private async recoverSessionExpired(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    try {
      // Attempt silent token refresh
      const refreshed = await this.attemptSilentRefresh();
      
      if (refreshed) {
        return {
          success: true,
          action: {
            type: 'retry',
            message: 'Session refreshed. Continuing...',
            delay: 500,
          },
          message: 'Session silently refreshed'
        };
      }

      // Clear stale session data
      await this.clearStaleSession();
      
      return {
        success: false,
        action: {
          type: 'refresh_page',
          message: 'Your session has expired. Please sign in again.',
          action: () => {
            // Clear any cached auth state
            if (typeof window !== 'undefined') {
              localStorage.removeItem('next-auth.session-token');
              sessionStorage.clear();
              window.location.reload();
            }
          }
        },
        message: 'Session cleanup completed'
      };

    } catch (refreshError) {
      return {
        success: false,
        action: {
          type: 'refresh_page',
          message: 'Session expired. Please refresh and sign in again.',
        },
        message: 'Session refresh failed'
      };
    }
  }

  /**
   * Rate limit recovery with intelligent waiting
   */
  private async recoverRateLimit(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const retryAfter = error.retryAfter || 60;
    const retryCount = context.retryCount || 0;
    
    // If we've been rate limited multiple times, suggest alternative
    if (retryCount > 1) {
      return {
        success: false,
        action: {
          type: 'alternative_method',
          message: 'Too many attempts. Try a different sign-in method or contact support.',
          data: { excludeProvider: context.provider }
        },
        message: 'Multiple rate limits detected'
      };
    }

    // Calculate smart wait time based on context
    const smartWaitTime = this.calculateSmartWaitTime(retryAfter, retryCount);
    
    return {
      success: false,
      action: {
        type: 'wait',
        message: `Too many attempts. Please wait ${smartWaitTime} seconds before trying again.`,
        delay: smartWaitTime * 1000,
      },
      message: `Smart wait time calculated: ${smartWaitTime}s`
    };
  }

  /**
   * Provider unavailable recovery with status checking
   */
  private async recoverProviderUnavailable(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const provider = context.provider || 'provider';
    
    try {
      // Check provider status
      const providerStatus = await this.checkProviderStatus(context.provider);
      
      if (providerStatus.maintenance) {
        return {
          success: false,
          action: {
            type: 'alternative_method',
            message: `${provider} is under maintenance. Try a different sign-in method.`,
            data: { 
              excludeProvider: context.provider,
              maintenanceEnd: providerStatus.maintenanceEnd 
            }
          },
          message: 'Provider maintenance detected'
        };
      }

      if (providerStatus.degraded) {
        return {
          success: false,
          action: {
            type: 'wait',
            message: `${provider} is experiencing issues. Retrying in a moment...`,
            delay: 30000, // 30 seconds
          },
          message: 'Provider degraded performance detected'
        };
      }

      // Provider seems fine, might be temporary
      return {
        success: false,
        action: {
          type: 'retry',
          message: `${provider} connection restored. Try again.`,
          delay: 5000,
        },
        message: 'Provider status appears normal'
      };

    } catch (statusError) {
      return {
        success: false,
        action: {
          type: 'alternative_method',
          message: `Unable to connect to ${provider}. Try a different sign-in method.`,
          data: { excludeProvider: context.provider }
        },
        message: 'Provider status check failed'
      };
    }
  }

  /**
   * Invalid client recovery with configuration guidance
   */
  private async recoverInvalidClient(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // This is typically a configuration issue
    return {
      success: false,
      action: {
        type: 'contact_support',
        message: 'There\'s a configuration issue with the authentication system. Please contact support.',
        action: () => {
          if (typeof window !== 'undefined') {
            window.open('mailto:support@example.com?subject=Authentication Configuration Issue', '_blank');
          }
        }
      },
      message: 'OAuth client configuration error detected'
    };
  }

  /**
   * Configuration error recovery
   */
  private async recoverConfigurationError(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // Log configuration error for debugging
    console.error('Configuration error:', error, context);
    
    return {
      success: false,
      action: {
        type: 'contact_support',
        message: 'System configuration error. Our team has been notified. Please contact support if this persists.',
        action: () => {
          // Report configuration error
          this.reportConfigurationError(error, context);
        }
      },
      message: 'Configuration error reported'
    };
  }

  /**
   * Generic error recovery
   */
  private async recoverGenericError(
    error: AuthError, 
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const retryCount = context.retryCount || 0;
    
    if (retryCount < 2) {
      return {
        success: false,
        action: {
          type: 'retry',
          message: 'Something went wrong. Let\'s try that again.',
          delay: 2000,
        },
        message: 'Generic retry suggested'
      };
    }

    return {
      success: false,
      action: {
        type: 'refresh_page',
        message: 'Persistent error detected. Refresh the page to start fresh.',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
      },
      message: 'Page refresh suggested for persistent error'
    };
  }

  /**
   * Test basic internet connectivity
   */
  private async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test API endpoint availability
   */
  private async testApiEndpoint(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get OAuth denial count for a provider
   */
  private async getDenialCount(provider?: string): Promise<number> {
    if (!provider || typeof window === 'undefined') return 0;
    
    const key = `oauth_denial_count_${provider}`;
    const stored = localStorage.getItem(key);
    const count = stored ? parseInt(stored, 10) : 0;
    
    // Increment and store
    localStorage.setItem(key, (count + 1).toString());
    
    // Clear after 24 hours
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 24 * 60 * 60 * 1000);
    
    return count;
  }

  /**
   * Attempt silent token refresh
   */
  private async attemptSilentRefresh(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear stale session data
   */
  private async clearStaleSession(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Clear NextAuth session data
    localStorage.removeItem('next-auth.session-token');
    localStorage.removeItem('next-auth.csrf-token');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear any custom auth cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      if (name.trim().includes('auth') || name.trim().includes('session')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  }

  /**
   * Calculate smart wait time based on retry patterns
   */
  private calculateSmartWaitTime(baseWait: number, retryCount: number): number {
    // Exponential backoff with jitter
    const exponential = Math.min(baseWait * Math.pow(2, retryCount), 300); // Max 5 minutes
    const jitter = Math.random() * 0.1 * exponential; // 10% jitter
    return Math.floor(exponential + jitter);
  }

  /**
   * Check provider status (mock implementation)
   */
  private async checkProviderStatus(provider?: string): Promise<{
    maintenance: boolean;
    degraded: boolean;
    maintenanceEnd?: Date;
  }> {
    // In a real implementation, this would check actual provider status APIs
    // For now, return a mock response
    return {
      maintenance: false,
      degraded: false,
    };
  }

  /**
   * Report configuration error to monitoring system
   */
  private async reportConfigurationError(error: AuthError, context: RecoveryContext): Promise<void> {
    try {
      await fetch('/api/auth/analytics/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error_type: 'CONFIGURATION_ERROR',
          message: error.message,
          context: {
            ...context,
            severity: 'critical',
            requires_immediate_attention: true,
          },
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportError) {
      console.error('Failed to report configuration error:', reportError);
    }
  }
}

/**
 * Utility functions for error recovery
 */
export const advancedErrorRecovery = AdvancedErrorRecovery.getInstance();

export const attemptIntelligentRecovery = (error: AuthError, context?: RecoveryContext) => {
  return advancedErrorRecovery.attemptIntelligentRecovery(error, context);
};

/**
 * Error pattern detection utilities
 */
export class ErrorPatternDetector {
  private static errorHistory: Map<string, AuthError[]> = new Map();
  
  /**
   * Record an error for pattern analysis
   */
  static recordError(error: AuthError, context?: RecoveryContext): void {
    const key = context?.provider || 'global';
    const history = this.errorHistory.get(key) || [];
    
    history.push(error);
    
    // Keep only last 10 errors
    if (history.length > 10) {
      history.shift();
    }
    
    this.errorHistory.set(key, history);
  }

  /**
   * Detect if there's a pattern of repeated errors
   */
  static detectPattern(provider?: string): {
    hasPattern: boolean;
    patternType: 'repeated_failures' | 'escalating_errors' | 'provider_issues' | null;
    recommendation: FallbackAction | null;
  } {
    const key = provider || 'global';
    const history = this.errorHistory.get(key) || [];
    
    if (history.length < 3) {
      return { hasPattern: false, patternType: null, recommendation: null };
    }

    // Check for repeated failures of the same type
    const recentErrors = history.slice(-3);
    const sameTypeErrors = recentErrors.filter(e => e.type === recentErrors[0].type);
    
    if (sameTypeErrors.length === 3) {
      return {
        hasPattern: true,
        patternType: 'repeated_failures',
        recommendation: {
          type: 'alternative_method',
          message: `Repeated ${recentErrors[0].type} errors detected. Try a different approach.`,
          data: { excludeProvider: provider }
        }
      };
    }

    // Check for escalating error severity
    const severityLevels = recentErrors.map(e => this.getErrorSeverity(e.type));
    const isEscalating = severityLevels.every((level, index) => 
      index === 0 || level >= severityLevels[index - 1]
    );

    if (isEscalating) {
      return {
        hasPattern: true,
        patternType: 'escalating_errors',
        recommendation: {
          type: 'contact_support',
          message: 'Error pattern suggests a system issue. Please contact support.',
        }
      };
    }

    return { hasPattern: false, patternType: null, recommendation: null };
  }

  /**
   * Get numeric severity level for error type
   */
  private static getErrorSeverity(errorType: AuthErrorType): number {
    const severityMap: Record<AuthErrorType, number> = {
      [AuthErrorType.NETWORK_ERROR]: 1,
      [AuthErrorType.TIMEOUT_ERROR]: 1,
      [AuthErrorType.CONNECTION_ERROR]: 1,
      [AuthErrorType.OAUTH_CANCELLED]: 1,
      [AuthErrorType.OAUTH_ACCESS_DENIED]: 2,
      [AuthErrorType.SESSION_EXPIRED]: 2,
      [AuthErrorType.RATE_LIMITED]: 2,
      [AuthErrorType.PROVIDER_UNAVAILABLE]: 2,
      [AuthErrorType.OAUTH_ERROR]: 3,
      [AuthErrorType.OAUTH_INVALID_REQUEST]: 3,
      [AuthErrorType.INVALID_CREDENTIALS]: 3,
      [AuthErrorType.PROVIDER_ERROR]: 3,
      [AuthErrorType.OAUTH_INVALID_CLIENT]: 4,
      [AuthErrorType.OAUTH_UNAUTHORIZED_CLIENT]: 4,
      [AuthErrorType.CONFIGURATION_ERROR]: 4,
      [AuthErrorType.OAUTH_INVALID_GRANT]: 3,
      [AuthErrorType.OAUTH_UNSUPPORTED_GRANT_TYPE]: 4,
      [AuthErrorType.OAUTH_INVALID_SCOPE]: 3,
      [AuthErrorType.SESSION_INVALID]: 2,
      [AuthErrorType.TOKEN_REFRESH_FAILED]: 2,
      [AuthErrorType.TOO_MANY_REQUESTS]: 2,
      [AuthErrorType.ACCOUNT_LOCKED]: 4,
      [AuthErrorType.PROVIDER_MAINTENANCE]: 2,
      [AuthErrorType.TRIAL_EXHAUSTED]: 1,
      [AuthErrorType.ACCESS_DENIED]: 3,
      [AuthErrorType.FEATURE_UNAVAILABLE]: 1,
      [AuthErrorType.MISSING_CREDENTIALS]: 4,
      [AuthErrorType.INVALID_CALLBACK_URL]: 4,
      [AuthErrorType.UNKNOWN_ERROR]: 2,
      [AuthErrorType.INTERNAL_ERROR]: 3,
    };

    return severityMap[errorType] || 2;
  }

  /**
   * Clear error history for a provider
   */
  static clearHistory(provider?: string): void {
    const key = provider || 'global';
    this.errorHistory.delete(key);
  }
}