/**
 * Enhanced Authentication Hook with Error Handling
 * 
 * Provides authentication functionality with comprehensive error handling,
 * retry mechanisms, and fallback strategies.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { 
  AuthError, 
  AuthErrorType,
  FallbackAction 
} from '@/types/auth-errors';
import { 
  authErrorHandler,
  handleAuthError,
  shouldRetryAuthError,
  executeAuthRetry,
  getAuthErrorFallback
} from '@/lib/auth-error-handler';

export interface AuthWithErrorHandlingOptions {
  enableRetry?: boolean;
  enableFallback?: boolean;
  maxRetryAttempts?: number;
  onError?: (error: AuthError) => void;
  onSuccess?: (result: any) => void;
  onRetryExhausted?: (error: AuthError) => void;
}

export interface AuthState {
  isLoading: boolean;
  error: AuthError | null;
  isRetrying: boolean;
  retryCount: number;
  fallbackAction: FallbackAction | null;
}

export interface AuthActions {
  signInWithProvider: (provider: string, options?: any) => Promise<boolean>;
  signOutWithErrorHandling: () => Promise<boolean>;
  retryLastAction: () => Promise<boolean>;
  clearError: () => void;
  resetRetryCount: () => void;
}

export function useAuthWithErrorHandling(
  options: AuthWithErrorHandlingOptions = {}
) {
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
    fallbackAction: null,
  });

  const lastActionRef = useRef<{
    type: 'signIn' | 'signOut';
    provider?: string;
    options?: any;
  } | null>(null);

  const {
    enableRetry = true,
    enableFallback = true,
    maxRetryAttempts = 3,
    onError,
    onSuccess,
    onRetryExhausted,
  } = options;

  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback(async (error: any, context?: any) => {
    const authError = await handleAuthError(error, context);
    const fallbackAction = enableFallback ? getAuthErrorFallback(authError) : null;
    
    updateAuthState({
      error: authError,
      isLoading: false,
      isRetrying: false,
      fallbackAction,
    });

    onError?.(authError);
    return authError;
  }, [enableFallback, onError, updateAuthState]);

  const signInWithProvider = useCallback(async (
    provider: string, 
    signInOptions: any = {}
  ): Promise<boolean> => {
    const attemptKey = `signin-${provider}`;
    
    // Store action for retry
    lastActionRef.current = {
      type: 'signIn',
      provider,
      options: signInOptions,
    };

    updateAuthState({
      isLoading: true,
      error: null,
      isRetrying: authState.retryCount > 0,
    });

    try {
      const result = await signIn(provider, {
        redirect: false,
        ...signInOptions,
      });

      if (result?.error) {
        const authError = await handleError(result.error, {
          provider,
          action: 'signIn',
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

        // Check if we should retry
        if (enableRetry && shouldRetryAuthError(authError, attemptKey)) {
          updateAuthState({
            retryCount: authState.retryCount + 1,
          });

          // Execute retry with backoff
          try {
            return await executeAuthRetry(
              attemptKey,
              () => signInWithProvider(provider, signInOptions),
              authError
            );
          } catch (retryError) {
            await handleError(retryError, { provider, action: 'signIn', retry: true });
            onRetryExhausted?.(authError);
            return false;
          }
        }

        return false;
      }

      // Success
      updateAuthState({
        isLoading: false,
        error: null,
        retryCount: 0,
        fallbackAction: null,
      });

      authErrorHandler.resetRetryAttempts(attemptKey);
      onSuccess?.(result);
      return true;

    } catch (error) {
      await handleError(error, {
        provider,
        action: 'signIn',
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
      return false;
    }
  }, [
    authState.retryCount,
    enableRetry,
    enableFallback,
    handleError,
    onSuccess,
    onRetryExhausted,
    updateAuthState,
  ]);

  const signOutWithErrorHandling = useCallback(async (): Promise<boolean> => {
    const attemptKey = 'signout';
    
    // Store action for retry
    lastActionRef.current = {
      type: 'signOut',
    };

    updateAuthState({
      isLoading: true,
      error: null,
      isRetrying: authState.retryCount > 0,
    });

    try {
      await signOut({ redirect: false });

      // Success
      updateAuthState({
        isLoading: false,
        error: null,
        retryCount: 0,
        fallbackAction: null,
      });

      authErrorHandler.resetRetryAttempts(attemptKey);
      return true;

    } catch (error) {
      const authError = await handleError(error, {
        action: 'signOut',
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      // Check if we should retry
      if (enableRetry && shouldRetryAuthError(authError, attemptKey)) {
        updateAuthState({
          retryCount: authState.retryCount + 1,
        });

        try {
          return await executeAuthRetry(
            attemptKey,
            () => signOutWithErrorHandling(),
            authError
          );
        } catch (retryError) {
          await handleError(retryError, { action: 'signOut', retry: true });
          onRetryExhausted?.(authError);
          return false;
        }
      }

      return false;
    }
  }, [
    authState.retryCount,
    enableRetry,
    handleError,
    onRetryExhausted,
    updateAuthState,
  ]);

  const retryLastAction = useCallback(async (): Promise<boolean> => {
    const lastAction = lastActionRef.current;
    if (!lastAction) return false;

    switch (lastAction.type) {
      case 'signIn':
        if (lastAction.provider) {
          return signInWithProvider(lastAction.provider, lastAction.options);
        }
        break;
      case 'signOut':
        return signOutWithErrorHandling();
    }

    return false;
  }, [signInWithProvider, signOutWithErrorHandling]);

  const clearError = useCallback(() => {
    updateAuthState({
      error: null,
      fallbackAction: null,
    });
  }, [updateAuthState]);

  const resetRetryCount = useCallback(() => {
    updateAuthState({
      retryCount: 0,
      isRetrying: false,
    });
  }, [updateAuthState]);

  // Enhanced session information
  const enhancedSession = {
    ...session,
    isLoading: status === 'loading' || authState.isLoading,
    isAuthenticated: !!session?.user,
    hasError: !!authState.error,
  };

  const actions: AuthActions = {
    signInWithProvider,
    signOutWithErrorHandling,
    retryLastAction,
    clearError,
    resetRetryCount,
  };

  return {
    session: enhancedSession,
    authState,
    actions,
    // Convenience properties
    isLoading: authState.isLoading || status === 'loading',
    error: authState.error,
    isRetrying: authState.isRetrying,
    canRetry: !!lastActionRef.current && authState.retryCount < maxRetryAttempts,
    fallbackAction: authState.fallbackAction,
  };
}

export default useAuthWithErrorHandling;