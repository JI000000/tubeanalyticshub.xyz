'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTouchDevice } from '@/hooks/useMediaQuery';
import { 
  isMobileBrowser, 
  isIOSSafari, 
  isAndroidChrome,
  getMobileOAuthParams,
  setupMobileOAuthListener,
  handleMobileOAuthCallback
} from '@/lib/mobile-oauth';
import { AuthError, AuthErrorType } from '@/types/auth-errors';
import { handleAuthError } from '@/lib/auth-error-handler';
import { LoginAnalyticsService } from '@/lib/login-analytics';
import { useFingerprint } from '@/hooks/useFingerprint';

export interface OAuthProvider {
  id: 'github' | 'google';
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}

export interface AuthResult {
  user?: any;
  session?: any;
  isNewUser?: boolean;
  error?: string;
  ok?: boolean;
  url?: string | null;
}

// AuthError is now imported from types/auth-errors.ts

export interface SocialLoginButtonsProps {
  providers?: OAuthProvider[];
  onSuccess?: (result: AuthResult) => void;
  onError?: (error: AuthError) => void;
  loading?: boolean;
  disabled?: boolean;
  callbackUrl?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline';
}

// GitHub Icon Component
const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

// Google Icon Component
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Default providers configuration
const defaultProviders: OAuthProvider[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: GitHubIcon,
    primary: true,
  },
  {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
  },
];

export function SocialLoginButtons({
  providers = defaultProviders,
  onSuccess,
  onError,
  loading: externalLoading = false,
  disabled = false,
  callbackUrl = '/',
  className,
  buttonClassName,
  size = 'default',
  variant = 'default',
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const isMobileDevice = isMobileBrowser();
  const isIOS = isIOSSafari();
  const isAndroid = isAndroidChrome();
  const { fingerprint } = useFingerprint();

  // Set up mobile OAuth callback listener
  useEffect(() => {
    if (!isMobileDevice) return;

    const cleanup = setupMobileOAuthListener(
      (provider, url) => {
        // Handle successful mobile OAuth callback
        const authResult: AuthResult = {
          ok: true,
          url,
          isNewUser: url.includes('new-user'),
        };
        onSuccess?.(authResult);
        setLoadingProvider(null);
      },
      (error) => {
        // Handle mobile OAuth error
        handleAuthError(error, {
          provider: 'unknown',
          action: 'mobile_oauth',
          userAgent: navigator.userAgent,
        }).then(authError => {
          onError?.(authError);
        });
        setLoadingProvider(null);
      }
    );

    // Check for OAuth callback on component mount
    handleMobileOAuthCallback();

    return cleanup;
  }, [isMobileDevice, onSuccess, onError]);

  const handleSocialLogin = async (providerId: string) => {
    if (disabled || externalLoading || loadingProvider) {
      return;
    }

    setLoadingProvider(providerId);
    
    // 记录登录尝试事件
    const currentRetryCount = retryCount[providerId] || 0;
    await LoginAnalyticsService.recordLoginAttempt(
      providerId as any,
      { returnUrl: callbackUrl },
      fingerprint?.visitorId,
      currentRetryCount
    ).catch(error => {
      console.warn('Failed to record login attempt analytics:', error);
    });

    try {
      // Mobile-specific OAuth handling
      if (isMobileDevice) {
        // Add mobile-specific parameters
        const mobileParams = getMobileOAuthParams();
        const searchParams = new URLSearchParams(mobileParams);
        
        // For mobile, we prefer redirect over popup for better UX
        const result = await signIn(providerId, {
          callbackUrl: `${callbackUrl}?${searchParams.toString()}`,
          redirect: true, // Use redirect on mobile
        });

        // This won't execute on mobile due to redirect, but kept for consistency
        if (result?.error) {
          // 记录登录失败事件
          await LoginAnalyticsService.recordLoginFailed(
            providerId as any,
            result.error,
            'Mobile OAuth error',
            { returnUrl: callbackUrl },
            fingerprint?.visitorId,
            currentRetryCount
          ).catch(error => {
            console.warn('Failed to record login failed analytics:', error);
          });
          
          // 更新重试计数
          setRetryCount(prev => ({
            ...prev,
            [providerId]: currentRetryCount + 1
          }));
          
          const authError = await handleAuthError(result.error, {
            provider: providerId,
            action: 'mobile_signin',
            userAgent: navigator.userAgent,
          });
          onError?.(authError);
        }
      } else {
        // Desktop OAuth handling (popup/redirect)
        const result = await signIn(providerId, {
          callbackUrl,
          redirect: false,
        });

        if (result?.error) {
          // 记录登录失败事件
          await LoginAnalyticsService.recordLoginFailed(
            providerId as any,
            result.error,
            'Desktop OAuth error',
            { returnUrl: callbackUrl },
            fingerprint?.visitorId,
            currentRetryCount
          ).catch(error => {
            console.warn('Failed to record login failed analytics:', error);
          });
          
          // 更新重试计数
          setRetryCount(prev => ({
            ...prev,
            [providerId]: currentRetryCount + 1
          }));
          
          const authError = await handleAuthError(result.error, {
            provider: providerId,
            action: 'desktop_signin',
            userAgent: navigator.userAgent,
          });
          onError?.(authError);
        } else if (result?.ok) {
          // 记录登录成功事件
          await LoginAnalyticsService.recordLoginSuccess(
            providerId as any,
            'unknown', // 用户ID在这里还不可用
            { returnUrl: callbackUrl },
            fingerprint?.visitorId,
            result.url?.includes('new-user') || false
          ).catch(error => {
            console.warn('Failed to record login success analytics:', error);
          });
          
          // 重置重试计数
          setRetryCount(prev => ({
            ...prev,
            [providerId]: 0
          }));
          
          const authResult: AuthResult = {
            ...result,
            error: result.error || undefined,
            isNewUser: result.url?.includes('new-user') || false,
          };
          onSuccess?.(authResult);
        }
      }
    } catch (err) {
      // 记录登录异常事件
      await LoginAnalyticsService.recordLoginFailed(
        providerId as any,
        'SIGNIN_EXCEPTION',
        err instanceof Error ? err.message : 'Unknown error',
        { returnUrl: callbackUrl },
        fingerprint?.visitorId,
        currentRetryCount
      ).catch(error => {
        console.warn('Failed to record login exception analytics:', error);
      });
      
      // 更新重试计数
      setRetryCount(prev => ({
        ...prev,
        [providerId]: currentRetryCount + 1
      }));
      
      const authError = await handleAuthError(err, {
        provider: providerId,
        action: 'signin_exception',
        userAgent: navigator.userAgent,
      });
      onError?.(authError);
      console.error('Social login error:', err);
    } finally {
      // Only reset loading state on desktop (mobile will redirect)
      if (!isMobileDevice) {
        setLoadingProvider(null);
      }
    }
  };

  const isLoading = externalLoading || loadingProvider !== null;
  const isProviderLoading = (providerId: string) => loadingProvider === providerId;

  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();

  const getButtonStyles = (provider: OAuthProvider) => {
    const baseStyles = cn(
      'w-full flex items-center justify-center gap-3 transition-all duration-200',
      // Mobile-optimized touch areas
      isMobile && 'min-h-[48px] px-4 mobile-auth-button',
      isTouchDevice && 'active:scale-[0.98]',
      // Size variants with mobile considerations
      size === 'sm' && (isMobile ? 'h-12' : 'h-9'),
      size === 'default' && (isMobile ? 'h-14' : 'h-11'),
      size === 'lg' && (isMobile ? 'h-16' : 'h-12'),
      buttonClassName
    );

    // Mobile-specific styling adjustments
    const mobileStyles = isMobile ? [
      'text-base font-medium',
      'shadow-sm',
      // iOS Safari specific styles
      isIOS && 'webkit-appearance-none',
      // Android Chrome specific styles  
      isAndroid && 'tap-highlight-color-transparent',
    ].filter(Boolean) : [];

    if (variant === 'outline') {
      return cn(
        baseStyles,
        'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
        'focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        ...mobileStyles
      );
    }

    // Provider-specific styling for default variant
    switch (provider.id) {
      case 'github':
        return cn(
          baseStyles,
          'bg-gray-900 hover:bg-gray-800 text-white',
          'focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          ...mobileStyles
        );
      case 'google':
        return cn(
          baseStyles,
          'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
          'focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          ...mobileStyles
        );
      default:
        return cn(
          baseStyles,
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'focus:ring-2 focus:ring-offset-2 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          ...mobileStyles
        );
    }
  };

  const getButtonText = (provider: OAuthProvider) => {
    return `Continue with ${provider.name}`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {providers.map((provider) => {
        const IconComponent = provider.icon;
        const isCurrentlyLoading = isProviderLoading(provider.id);

        return (
          <Button
            key={provider.id}
            onClick={() => handleSocialLogin(provider.id)}
            disabled={disabled || isLoading}
            className={getButtonStyles(provider)}
            type="button"
            aria-label={`Sign in with ${provider.name}`}
          >
            {isCurrentlyLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <IconComponent className={cn(
              'w-5 h-5',
              isMobile && 'w-6 h-6'
            )} />
            )}
            <span className={cn(
              'font-medium',
              isMobile && 'text-base'
            )}>
              {getButtonText(provider)}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export default SocialLoginButtons;