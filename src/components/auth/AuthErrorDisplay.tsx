/**
 * Authentication Error Display Component
 * 
 * Provides user-friendly error messages with recovery options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Wifi, Clock, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AuthError, 
  AuthErrorType, 
  FallbackAction,
  ErrorSeverity 
} from '@/types/auth-errors';
import { 
  authErrorHandler, 
  getAuthErrorPresentation, 
  getAuthErrorFallback 
} from '@/lib/auth-error-handler';

export interface AuthErrorDisplayProps {
  error: AuthError | null;
  onRetry?: () => void;
  onAlternativeMethod?: (excludeProvider?: string) => void;
  onSkip?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const ErrorIcon: React.FC<{ type: AuthErrorType; className?: string }> = ({ type, className }) => {
  switch (type) {
    case AuthErrorType.NETWORK_ERROR:
    case AuthErrorType.CONNECTION_ERROR:
      return <Wifi className={cn('h-5 w-5', className)} />;
    case AuthErrorType.TIMEOUT_ERROR:
      return <Clock className={cn('h-5 w-5', className)} />;
    case AuthErrorType.RATE_LIMITED:
    case AuthErrorType.TOO_MANY_REQUESTS:
      return <Clock className={cn('h-5 w-5', className)} />;
    default:
      return <AlertTriangle className={cn('h-5 w-5', className)} />;
  }
};

const getSeverityStyles = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.LOW:
      return {
        container: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        message: 'text-blue-800',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    case ErrorSeverity.MEDIUM:
      return {
        container: 'bg-yellow-50 border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        message: 'text-yellow-800',
        button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      };
    case ErrorSeverity.HIGH:
      return {
        container: 'bg-orange-50 border-orange-200',
        icon: 'text-orange-600',
        title: 'text-orange-900',
        message: 'text-orange-800',
        button: 'bg-orange-600 hover:bg-orange-700 text-white',
      };
    case ErrorSeverity.CRITICAL:
      return {
        container: 'bg-red-50 border-red-200',
        icon: 'text-red-600',
        title: 'text-red-900',
        message: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700 text-white',
      };
    default:
      return {
        container: 'bg-gray-50 border-gray-200',
        icon: 'text-gray-600',
        title: 'text-gray-900',
        message: 'text-gray-800',
        button: 'bg-gray-600 hover:bg-gray-700 text-white',
      };
  }
};

export function AuthErrorDisplay({
  error,
  onRetry,
  onAlternativeMethod,
  onSkip,
  onDismiss,
  className,
  showDetails = false,
  compact = false,
}: AuthErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fallbackAction, setFallbackAction] = useState<FallbackAction | null>(null);

  useEffect(() => {
    if (error) {
      const action = getAuthErrorFallback(error);
      setFallbackAction(action);
    }
  }, [error]);

  useEffect(() => {
    if (fallbackAction?.type === 'wait' && fallbackAction.delay) {
      const totalSeconds = Math.ceil(fallbackAction.delay / 1000);
      setCountdown(totalSeconds);
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [fallbackAction]);

  if (!error) return null;

  const presentation = getAuthErrorPresentation(error);
  const severityStyles = getSeverityStyles(presentation.severity);

  const handleRetry = async () => {
    if (isRetrying || countdown !== null) return;
    
    setIsRetrying(true);
    
    try {
      if (fallbackAction?.action) {
        await fallbackAction.action();
      }
      onRetry?.();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAlternativeMethod = () => {
    const excludeProvider = fallbackAction?.data?.excludeProvider;
    onAlternativeMethod?.(excludeProvider);
  };

  const getErrorTitle = (type: AuthErrorType): string => {
    switch (type) {
      case AuthErrorType.NETWORK_ERROR:
      case AuthErrorType.CONNECTION_ERROR:
        return 'Connection Issue';
      case AuthErrorType.TIMEOUT_ERROR:
        return 'Request Timed Out';
      case AuthErrorType.OAUTH_ACCESS_DENIED:
        return 'Access Denied';
      case AuthErrorType.OAUTH_CANCELLED:
        return 'Login Cancelled';
      case AuthErrorType.SESSION_EXPIRED:
        return 'Session Expired';
      case AuthErrorType.RATE_LIMITED:
      case AuthErrorType.TOO_MANY_REQUESTS:
        return 'Too Many Attempts';
      case AuthErrorType.PROVIDER_UNAVAILABLE:
        return 'Service Unavailable';
      case AuthErrorType.CONFIGURATION_ERROR:
        return 'Configuration Error';
      default:
        return 'Login Error';
    }
  };

  const renderActions = () => {
    const actions = [];

    // Primary action based on fallback type
    switch (fallbackAction?.type) {
      case 'retry':
        actions.push(
          <Button
            key="retry"
            onClick={handleRetry}
            disabled={isRetrying || countdown !== null}
            className={cn(severityStyles.button, compact ? 'h-8 px-3 text-sm' : 'h-10 px-4')}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : countdown !== null ? (
              `Retry in ${countdown}s`
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {fallbackAction.message || 'Try Again'}
              </>
            )}
          </Button>
        );
        break;

      case 'alternative_method':
        actions.push(
          <Button
            key="alternative"
            onClick={handleAlternativeMethod}
            className={cn(severityStyles.button, compact ? 'h-8 px-3 text-sm' : 'h-10 px-4')}
          >
            {fallbackAction.message || 'Try Different Method'}
          </Button>
        );
        break;

      case 'refresh_page':
        actions.push(
          <Button
            key="refresh"
            onClick={() => fallbackAction.action?.()}
            className={cn(severityStyles.button, compact ? 'h-8 px-3 text-sm' : 'h-10 px-4')}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {fallbackAction.message || 'Refresh Page'}
          </Button>
        );
        break;

      case 'contact_support':
        actions.push(
          <Button
            key="support"
            onClick={() => window.open('mailto:support@example.com', '_blank')}
            variant="outline"
            className={cn(compact ? 'h-8 px-3 text-sm' : 'h-10 px-4')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {fallbackAction.message || 'Contact Support'}
          </Button>
        );
        break;

      case 'wait':
        actions.push(
          <Button
            key="wait"
            disabled
            className={cn(severityStyles.button, compact ? 'h-8 px-3 text-sm' : 'h-10 px-4')}
          >
            <Clock className="w-4 h-4 mr-2" />
            {countdown !== null ? `Wait ${countdown}s` : fallbackAction.message}
          </Button>
        );
        break;

      default:
        if (onRetry) {
          actions.push(
            <Button
              key="retry"
              onClick={handleRetry}
              disabled={isRetrying}
              className={cn(severityStyles.button, compact ? 'h-8 px-3 text-sm' : 'h-10 px-4')}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          );
        }
    }

    // Skip option
    if (onSkip && error.type !== AuthErrorType.CONFIGURATION_ERROR) {
      actions.push(
        <Button
          key="skip"
          onClick={onSkip}
          variant="ghost"
          className={cn(compact ? 'h-8 px-3 text-sm' : 'h-10 px-4')}
        >
          Skip for now
        </Button>
      );
    }

    return actions;
  };

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        severityStyles.container,
        className
      )}>
        <ErrorIcon type={error.type} className={severityStyles.icon} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', severityStyles.title)}>
            {getErrorTitle(error.type)}
          </p>
          <p className={cn('text-xs', severityStyles.message)}>
            {error.userMessage}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {renderActions()}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      severityStyles.container,
      className
    )}>
      <div className="flex items-start gap-3">
        <ErrorIcon type={error.type} className={cn(severityStyles.icon, 'mt-0.5')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', severityStyles.title)}>
              {getErrorTitle(error.type)}
            </h3>
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <p className={cn('text-sm mt-1', severityStyles.message)}>
            {error.userMessage}
          </p>

          {showDetails && error.message !== error.userMessage && (
            <details className="mt-2">
              <summary className={cn('text-xs cursor-pointer', severityStyles.message)}>
                Technical details
              </summary>
              <p className={cn('text-xs mt-1 font-mono', severityStyles.message)}>
                {error.message}
              </p>
              {error.code && (
                <p className={cn('text-xs mt-1', severityStyles.message)}>
                  Error code: {error.code}
                </p>
              )}
            </details>
          )}

          <div className="flex items-center gap-2 mt-3">
            {renderActions()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthErrorDisplay;