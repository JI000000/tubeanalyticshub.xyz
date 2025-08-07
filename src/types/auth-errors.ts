/**
 * Authentication Error Types and Definitions
 * 
 * This file defines all possible authentication errors and their handling strategies
 * according to the smart login flow requirements.
 */

export enum AuthErrorType {
  // Network and connectivity errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // OAuth specific errors
  OAUTH_ERROR = 'OAUTH_ERROR',
  OAUTH_CANCELLED = 'OAUTH_CANCELLED',
  OAUTH_ACCESS_DENIED = 'OAUTH_ACCESS_DENIED',
  OAUTH_INVALID_REQUEST = 'OAUTH_INVALID_REQUEST',
  OAUTH_INVALID_CLIENT = 'OAUTH_INVALID_CLIENT',
  OAUTH_INVALID_GRANT = 'OAUTH_INVALID_GRANT',
  OAUTH_UNAUTHORIZED_CLIENT = 'OAUTH_UNAUTHORIZED_CLIENT',
  OAUTH_UNSUPPORTED_GRANT_TYPE = 'OAUTH_UNSUPPORTED_GRANT_TYPE',
  OAUTH_INVALID_SCOPE = 'OAUTH_INVALID_SCOPE',
  
  // Session and authentication state errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Rate limiting and abuse prevention
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Provider specific errors
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  PROVIDER_MAINTENANCE = 'PROVIDER_MAINTENANCE',
  
  // Trial and access errors
  TRIAL_EXHAUSTED = 'TRIAL_EXHAUSTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  FEATURE_UNAVAILABLE = 'FEATURE_UNAVAILABLE',
  
  // Configuration and setup errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  INVALID_CALLBACK_URL = 'INVALID_CALLBACK_URL',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  retryable: boolean;
  retryAfter?: number; // seconds to wait before retry
  timestamp: Date;
  context?: {
    provider?: string;
    action?: string;
    url?: string;
    userAgent?: string;
    [key: string]: any;
  };
}

export interface ErrorRecoveryStrategy {
  canRecover(error: AuthError): boolean;
  recover(error: AuthError, context?: any): Promise<boolean>;
  getFallbackAction(error: AuthError): FallbackAction;
}

export interface FallbackAction {
  type: 'retry' | 'alternative_method' | 'skip' | 'contact_support' | 'refresh_page' | 'wait';
  message: string;
  action?: () => void | Promise<void>;
  delay?: number; // milliseconds to wait before action
  data?: any;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: AuthErrorType[];
}

export interface ErrorHandlerConfig {
  enableRetry: boolean;
  enableFallback: boolean;
  enableAnalytics: boolean;
  retryConfig: RetryConfig;
  userFriendlyMessages: boolean;
  debugMode: boolean;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    AuthErrorType.NETWORK_ERROR,
    AuthErrorType.TIMEOUT_ERROR,
    AuthErrorType.CONNECTION_ERROR,
    AuthErrorType.TOKEN_REFRESH_FAILED,
    AuthErrorType.PROVIDER_UNAVAILABLE,
    AuthErrorType.INTERNAL_ERROR,
  ],
};

// Default error handler configuration
export const DEFAULT_ERROR_CONFIG: ErrorHandlerConfig = {
  enableRetry: true,
  enableFallback: true,
  enableAnalytics: true,
  retryConfig: DEFAULT_RETRY_CONFIG,
  userFriendlyMessages: true,
  debugMode: process.env.NODE_ENV === 'development',
};

// Error severity levels for UI presentation
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorPresentation {
  severity: ErrorSeverity;
  showModal: boolean;
  showToast: boolean;
  showInline: boolean;
  autoHide: boolean;
  hideAfter?: number; // milliseconds
}

// Error presentation mapping
export const ERROR_PRESENTATION_MAP: Record<AuthErrorType, ErrorPresentation> = {
  [AuthErrorType.NETWORK_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 5000,
  },
  [AuthErrorType.OAUTH_CANCELLED]: {
    severity: ErrorSeverity.LOW,
    showModal: false,
    showToast: false,
    showInline: true,
    autoHide: true,
    hideAfter: 3000,
  },
  [AuthErrorType.OAUTH_ACCESS_DENIED]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.SESSION_EXPIRED]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: true,
    showToast: false,
    showInline: false,
    autoHide: false,
  },
  [AuthErrorType.RATE_LIMITED]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.TRIAL_EXHAUSTED]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: true,
    showToast: false,
    showInline: false,
    autoHide: false,
  },
  [AuthErrorType.PROVIDER_UNAVAILABLE]: {
    severity: ErrorSeverity.HIGH,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 8000,
  },
  [AuthErrorType.CONFIGURATION_ERROR]: {
    severity: ErrorSeverity.CRITICAL,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.UNKNOWN_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 5000,
  },
  // Add default presentation for other error types
  [AuthErrorType.TIMEOUT_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 5000,
  },
  [AuthErrorType.CONNECTION_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 5000,
  },
  [AuthErrorType.OAUTH_ERROR]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.OAUTH_INVALID_REQUEST]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.OAUTH_INVALID_CLIENT]: {
    severity: ErrorSeverity.CRITICAL,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.OAUTH_INVALID_GRANT]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.OAUTH_UNAUTHORIZED_CLIENT]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.OAUTH_UNSUPPORTED_GRANT_TYPE]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.OAUTH_INVALID_SCOPE]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.SESSION_INVALID]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: true,
    showToast: false,
    showInline: false,
    autoHide: false,
  },
  [AuthErrorType.TOKEN_REFRESH_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 5000,
  },
  [AuthErrorType.INVALID_CREDENTIALS]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.TOO_MANY_REQUESTS]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.ACCOUNT_LOCKED]: {
    severity: ErrorSeverity.CRITICAL,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.PROVIDER_ERROR]: {
    severity: ErrorSeverity.HIGH,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 8000,
  },
  [AuthErrorType.PROVIDER_MAINTENANCE]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.ACCESS_DENIED]: {
    severity: ErrorSeverity.HIGH,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.FEATURE_UNAVAILABLE]: {
    severity: ErrorSeverity.MEDIUM,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.MISSING_CREDENTIALS]: {
    severity: ErrorSeverity.CRITICAL,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.INVALID_CALLBACK_URL]: {
    severity: ErrorSeverity.CRITICAL,
    showModal: true,
    showToast: false,
    showInline: true,
    autoHide: false,
  },
  [AuthErrorType.INTERNAL_ERROR]: {
    severity: ErrorSeverity.HIGH,
    showModal: false,
    showToast: true,
    showInline: true,
    autoHide: true,
    hideAfter: 5000,
  },
};