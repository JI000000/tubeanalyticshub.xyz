'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet, useBreakpoint } from '@/hooks/useMediaQuery';
import { useViewportHeight, useKeyboardVisible } from '@/hooks/useViewportHeight';
import { SocialLoginButtons, type AuthResult } from './SocialLoginButtons';
import { EmailLoginForm } from './EmailLoginForm';
import { AuthError } from '@/types/auth-errors';
import { AuthErrorDisplay } from './AuthErrorDisplay';
import { useAuthWithErrorHandling } from '@/hooks/useAuthWithErrorHandling';
import { 
  advancedErrorRecovery, 
  ErrorPatternDetector 
} from '@/lib/auth-error-recovery';
import { LoginAnalyticsService } from '@/lib/login-analytics';
import { useFingerprint } from '@/hooks/useFingerprint';
import { LoginScenarioContent } from './LoginScenarioContent';

export interface LoginTrigger {
  type: 'trial_exhausted' | 'feature_required' | 'save_action' | 'premium_feature' | 'data_export';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  allowSkip: boolean;
}

export interface LoginContext {
  previousAction: string;
  returnUrl: string;
  metadata?: any;
}

export interface SmartLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: LoginTrigger;
  context?: LoginContext;
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  onSkip?: () => void;
}

// Simple translation function with fallbacks
const useSimpleTranslation = () => {
  const t = (key: string, fallback?: string) => {
    // For now, just return the fallback or a default message
    return fallback || key;
  };
  return { t };
};

// Enhanced modal content component with device-specific optimizations
function ModalContent({
  trigger,
  context,
  onSuccess,
  onSkip,
  error,
  setError,
  actions,
  isRetrying,
  t,
  displayMode,
  urgencyStyles
}: {
  trigger?: LoginTrigger;
  context?: LoginContext;
  onSuccess?: (result: any) => void;
  onSkip?: () => void;
  error: AuthError | null;
  setError: (error: AuthError | null) => void;
  actions: any;
  isRetrying: boolean;
  t: (key: string, fallback?: string) => string;
  displayMode: 'mobile' | 'tablet' | 'desktop';
  urgencyStyles: any;
}) {
  const [loginMode, setLoginMode] = useState<'social' | 'email'>('social');
  const handleLoginSuccess = (result: AuthResult) => {
    onSuccess?.(result);
  };

  const handleLoginError = (error: AuthError) => {
    setError(error);
  };

  const handleRetry = () => {
    setError(null);
    actions.retryLastAction();
  };

  const handleAlternativeMethod = () => {
    setError(null);
  };

  // Get title based on trigger type
  const getTitle = () => {
    if (!trigger) return t('auth.modal.default.title') || 'Welcome Back';
    
    const titles = {
      trial_exhausted: t('auth.modal.trialExhausted.title') || 'Trial Limit Reached',
      feature_required: t('auth.modal.featureRequired.title') || 'Login Required',
      save_action: t('auth.modal.saveAction.title') || 'Save Your Work',
      premium_feature: t('auth.modal.premiumFeature.title') || 'Premium Feature',
      data_export: t('auth.modal.dataExport.title') || 'Export Data'
    };
    
    return titles[trigger.type] || titles.feature_required;
  };

  // Mobile layout
  if (displayMode === 'mobile') {
    return (
      <div className="flex flex-col h-full mobile-auth-modal">
        {/* Mobile header with pull indicator */}
        <div className="flex flex-col items-center pb-4 mobile-auth-header">
          <div className={cn(
            "w-12 h-1 rounded-full mb-4 transition-colors duration-200",
            urgencyStyles.pullIndicator
          )} />
          <div className="text-center">
            <h2 className={cn(
              "text-xl font-semibold mb-2 transition-colors duration-200",
              urgencyStyles.title
            )}>
              {getTitle()}
            </h2>
            {trigger?.message && (
              <p className="text-sm text-gray-600 px-4">
                {trigger.message}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 mobile-auth-scroll">
          {/* Scenario-specific content */}
          {trigger ? (
            <div className="mb-6">
              <LoginScenarioContent 
                trigger={trigger} 
                context={context} 
                isMobile={true}
              />
            </div>
          ) : (
            <div className={cn(
              "mb-6 p-4 rounded-xl border transition-colors duration-200",
              urgencyStyles.benefitsCard
            )}>
              <h3 className={cn(
                "text-base font-medium mb-3 transition-colors duration-200",
                urgencyStyles.benefitsTitle
              )}>
                {t('auth.modal.benefits.title') || 'Why sign in?'}
              </h3>
              <ul className={cn(
                "text-sm space-y-2 transition-colors duration-200",
                urgencyStyles.benefitsText
              )}>
                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors duration-200",
                    urgencyStyles.bulletPoint
                  )} />
                  <span>{t('auth.modal.benefits.unlimited') || 'Unlimited analysis requests'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors duration-200",
                    urgencyStyles.bulletPoint
                  )} />
                  <span>{t('auth.modal.benefits.save') || 'Save and organize your reports'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors duration-200",
                    urgencyStyles.bulletPoint
                  )} />
                  <span>{t('auth.modal.benefits.history') || 'Access your analysis history'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors duration-200",
                    urgencyStyles.bulletPoint
                  )} />
                  <span>{t('auth.modal.benefits.advanced') || 'Advanced analytics features'}</span>
                </li>
              </ul>
            </div>
          )}

          {/* Login Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setLoginMode('social')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                loginMode === 'social'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Social Login
            </button>
            <button
              onClick={() => setLoginMode('email')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                loginMode === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Email
            </button>
          </div>

          {/* Login Forms */}
          {loginMode === 'social' ? (
            <SocialLoginButtons
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              callbackUrl={context?.returnUrl || '/'}
              size="default"
            />
          ) : (
            <EmailLoginForm
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              onBack={() => setLoginMode('social')}
              callbackUrl={context?.returnUrl || '/'}
              size="default"
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4">
              <AuthErrorDisplay
                error={error}
                onRetry={handleRetry}
                onAlternativeMethod={handleAlternativeMethod}
                onSkip={onSkip}
                onDismiss={() => setError(null)}
                compact
              />
            </div>
          )}

          {/* Retry indicator */}
          {isRetrying && (
            <div className={cn(
              "mt-4 p-3 border rounded-lg transition-colors duration-200",
              urgencyStyles.retryIndicator
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 border-2 border-t-transparent rounded-full animate-spin transition-colors duration-200",
                  urgencyStyles.spinner
                )} />
                <p className={cn(
                  "text-sm transition-colors duration-200",
                  urgencyStyles.retryText
                )}>
                  {t('auth.modal.retrying') || 'Retrying...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom section */}
        <div className="px-6 pt-4 pb-6 border-t border-gray-100 bg-white mobile-auth-content">
          <div className="text-center mb-4">
            <p className="text-xs text-gray-600">
              {t('auth.modal.newUserNote') || 'New users will be automatically registered'}
            </p>
          </div>
          
          {trigger?.allowSkip && onSkip && (
            <Button
              variant="ghost"
              size="lg"
              onClick={onSkip}
              className="w-full text-gray-500 hover:text-gray-700 h-12"
            >
              {t('auth.modal.skipForNow') || 'Skip for now'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Desktop/Tablet layout
  return (
    <div className="modal-content">
      {/* Scenario-specific content */}
      {trigger ? (
        <div className="mb-6">
          <LoginScenarioContent 
            trigger={trigger} 
            context={context} 
            isMobile={false}
          />
        </div>
      ) : (
        <div className={cn(
          "mb-6 p-4 rounded-lg border transition-colors duration-200",
          urgencyStyles.benefitsCard
        )}>
          <h3 className={cn(
            "text-sm font-medium mb-2 transition-colors duration-200",
            urgencyStyles.benefitsTitle
          )}>
            {t('auth.modal.benefits.title') || 'Why sign in?'}
          </h3>
          <ul className={cn(
            "text-sm space-y-1 transition-colors duration-200",
            urgencyStyles.benefitsText
          )}>
            <li className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                urgencyStyles.bulletPoint
              )} />
              {t('auth.modal.benefits.unlimited') || 'Unlimited analysis requests'}
            </li>
            <li className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                urgencyStyles.bulletPoint
              )} />
              {t('auth.modal.benefits.save') || 'Save and organize your reports'}
            </li>
            <li className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                urgencyStyles.bulletPoint
              )} />
              {t('auth.modal.benefits.history') || 'Access your analysis history'}
            </li>
            <li className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                urgencyStyles.bulletPoint
              )} />
              {t('auth.modal.benefits.advanced') || 'Advanced analytics features'}
            </li>
          </ul>
        </div>
      )}

      {/* Login Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setLoginMode('social')}
          className={cn(
            'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
            loginMode === 'social'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Social Login
        </button>
        <button
          onClick={() => setLoginMode('email')}
          className={cn(
            'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
            loginMode === 'email'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Email
        </button>
      </div>

      {/* Login Forms */}
      {loginMode === 'social' ? (
        <SocialLoginButtons
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          callbackUrl={context?.returnUrl || '/'}
          size="default"
        />
      ) : (
        <EmailLoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          onBack={() => setLoginMode('social')}
          callbackUrl={context?.returnUrl || '/'}
          size="default"
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4">
          <AuthErrorDisplay
            error={error}
            onRetry={handleRetry}
            onAlternativeMethod={handleAlternativeMethod}
            onSkip={onSkip}
            onDismiss={() => {
              setError(null);
              actions.clearError();
            }}
            showDetails={false}
          />
        </div>
      )}

      {/* Retry indicator */}
      {isRetrying && (
        <div className={cn(
          "mt-4 p-3 border rounded-lg transition-colors duration-200",
          urgencyStyles.retryIndicator
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-4 h-4 border-2 border-t-transparent rounded-full animate-spin transition-colors duration-200",
              urgencyStyles.spinner
            )} />
            <p className={cn(
              "text-sm transition-colors duration-200",
              urgencyStyles.retryText
            )}>
              {t('auth.modal.retrying') || 'Retrying...'}
            </p>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <p className="text-gray-600">
          {t('auth.modal.newUserNote') || 'New users will be automatically registered'}
        </p>
        
        {trigger?.allowSkip && onSkip && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700"
          >
            {t('auth.modal.skipForNow') || 'Skip for now'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SmartLoginModal({
  open,
  onOpenChange,
  trigger,
  context,
  onSuccess,
  onCancel,
  onSkip
}: SmartLoginModalProps) {
  const { t } = useSimpleTranslation();
  const [error, setError] = useState<AuthError | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const breakpoint = useBreakpoint();
  const viewportHeight = useViewportHeight();
  const isKeyboardVisible = useKeyboardVisible();
  const { fingerprint } = useFingerprint();

  // Enhanced error handling with recovery
  const {
    actions,
    error: authError,
    isRetrying,
  } = useAuthWithErrorHandling({
    onError: async (error) => {
      // Record error for pattern detection
      ErrorPatternDetector.recordError(error, {
        provider: context?.metadata?.provider,
        action: 'modal_login',
        url: window.location.href,
      });

      // Attempt intelligent recovery
      if (!recoveryAttempted) {
        setRecoveryAttempted(true);
        const recoveryResult = await advancedErrorRecovery.attemptIntelligentRecovery(error, {
          provider: context?.metadata?.provider,
          action: 'modal_login',
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

        if (recoveryResult.success) {
          // Recovery successful, clear error
          setError(null);
          return;
        }
      }

      setError(error);
    },
    onSuccess: (result) => {
      // Clear error patterns on success
      ErrorPatternDetector.clearHistory(context?.metadata?.provider);
      setError(null);
      setRecoveryAttempted(false);
      onSuccess?.(result);
      onOpenChange(false);
    },
    onRetryExhausted: (error) => {
      // Detect patterns and suggest alternatives
      const pattern = ErrorPatternDetector.detectPattern(context?.metadata?.provider);
      if (pattern.hasPattern && pattern.recommendation) {
        setError({
          ...error,
          userMessage: pattern.recommendation.message,
        });
      }
    },
  });

  // Reset state when modal opens/closes and track analytics
  useEffect(() => {
    if (open && trigger && context) {
      // 记录登录提示显示事件
      LoginAnalyticsService.recordPromptShown(
        trigger,
        context,
        fingerprint?.visitorId
      ).catch(error => {
        console.warn('Failed to record prompt shown analytics:', error);
      });
    } else if (!open) {
      setError(null);
      setRecoveryAttempted(false);
      actions.clearError();
    }
  }, [open, trigger, context, fingerprint, actions]);

  // Use the comprehensive error (authError takes precedence)
  const displayError = authError || error;

  const handleLoginSuccess = (result: AuthResult) => {
    onSuccess?.(result);
    onOpenChange(false);
  };

  const handleLoginError = (error: AuthError) => {
    // Let the useAuthWithErrorHandling hook handle the error
    setError(error);
  };

  const handleClose = () => {
    // 记录登录取消事件
    if (trigger) {
      LoginAnalyticsService.recordLoginCancelled(
        trigger,
        context,
        fingerprint?.visitorId
      ).catch(error => {
        console.warn('Failed to record login cancelled analytics:', error);
      });
    }
    
    onCancel?.();
    onOpenChange(false);
  };

  const handleSkip = () => {
    // 记录登录跳过事件
    if (trigger && context) {
      LoginAnalyticsService.recordLoginSkipped(
        trigger,
        context,
        fingerprint?.visitorId
      ).catch(error => {
        console.warn('Failed to record login skipped analytics:', error);
      });
    }
    
    onSkip?.();
    onOpenChange(false);
  };

  // Enhanced urgency-based styling with comprehensive theming
  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return {
          // Overlay and borders
          overlay: 'bg-red-900/30 backdrop-blur-sm',
          border: 'border-red-200 shadow-red-100/50',
          
          // Text colors
          title: 'text-red-900',
          accent: 'text-red-600',
          
          // Component styling
          pullIndicator: 'bg-red-300',
          benefitsCard: 'bg-red-50 border-red-100',
          benefitsTitle: 'text-red-900',
          benefitsText: 'text-red-800',
          bulletPoint: 'bg-red-600',
          retryIndicator: 'bg-red-50 border-red-200',
          retryText: 'text-red-800',
          spinner: 'border-red-600',
          
          // Animation classes
          enterAnimation: 'animate-in slide-in-from-bottom-4 fade-in-0 duration-300',
          exitAnimation: 'animate-out slide-out-to-bottom-4 fade-out-0 duration-200'
        };
      case 'medium':
        return {
          // Overlay and borders
          overlay: 'bg-orange-900/25 backdrop-blur-sm',
          border: 'border-orange-200 shadow-orange-100/50',
          
          // Text colors
          title: 'text-orange-900',
          accent: 'text-orange-600',
          
          // Component styling
          pullIndicator: 'bg-orange-300',
          benefitsCard: 'bg-orange-50 border-orange-100',
          benefitsTitle: 'text-orange-900',
          benefitsText: 'text-orange-800',
          bulletPoint: 'bg-orange-600',
          retryIndicator: 'bg-orange-50 border-orange-200',
          retryText: 'text-orange-800',
          spinner: 'border-orange-600',
          
          // Animation classes
          enterAnimation: 'animate-in slide-in-from-bottom-2 fade-in-0 duration-250',
          exitAnimation: 'animate-out slide-out-to-bottom-2 fade-out-0 duration-200'
        };
      default: // low urgency
        return {
          // Overlay and borders
          overlay: 'bg-black/50 backdrop-blur-sm',
          border: 'border-gray-200 shadow-gray-100/50',
          
          // Text colors
          title: 'text-gray-900',
          accent: 'text-blue-600',
          
          // Component styling
          pullIndicator: 'bg-gray-300',
          benefitsCard: 'bg-blue-50 border-blue-100',
          benefitsTitle: 'text-blue-900',
          benefitsText: 'text-blue-800',
          bulletPoint: 'bg-blue-600',
          retryIndicator: 'bg-blue-50 border-blue-200',
          retryText: 'text-blue-800',
          spinner: 'border-blue-600',
          
          // Animation classes
          enterAnimation: 'animate-in slide-in-from-bottom-1 fade-in-0 duration-200',
          exitAnimation: 'animate-out slide-out-to-bottom-1 fade-out-0 duration-150'
        };
    }
  };

  const urgencyStyles = getUrgencyStyles(trigger?.urgency || 'low');
  
  // Determine display mode based on device
  const getDisplayMode = (): 'mobile' | 'tablet' | 'desktop' => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  };
  
  const displayMode = getDisplayMode();

  // Mobile layout using Sheet (bottom drawer)
  if (displayMode === 'mobile') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className={cn(
            "h-[85vh] max-h-[600px] rounded-t-2xl border-0 p-0",
            "focus:outline-none focus-visible:ring-0",
            "mobile-auth-sheet transition-all duration-300 ease-out",
            isKeyboardVisible && "keyboard-visible",
            urgencyStyles.border,
            urgencyStyles.enterAnimation
          )}
          style={{
            height: isKeyboardVisible 
              ? `${Math.min(viewportHeight * 0.5, 400)}px`
              : `${Math.min(viewportHeight * 0.85, 600)}px`
          }}
          onEscapeKeyDown={handleClose}
          onPointerDownOutside={handleClose}
        >
          <ModalContent
            trigger={trigger}
            context={context}
            onSuccess={onSuccess}
            onSkip={onSkip}
            error={displayError}
            setError={setError}
            actions={actions}
            isRetrying={isRetrying}
            t={t}
            displayMode={displayMode}
            urgencyStyles={urgencyStyles}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet layout using Dialog with enhanced animations and responsive sizing
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className={cn(
            "fixed inset-0 z-50 transition-all duration-300 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            urgencyStyles.overlay
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
            "bg-white rounded-xl border shadow-2xl",
            "transition-all duration-300 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            urgencyStyles.border,
            
            // Responsive sizing based on display mode
            displayMode === 'desktop' && [
              "max-w-md",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
              "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
            ],
            
            displayMode === 'tablet' && [
              "max-w-lg mx-4",
              "data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90",
              "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[45%]",
              "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[45%]"
            ]
          )}
          onEscapeKeyDown={handleClose}
          onPointerDownOutside={handleClose}
        >
          {/* Enhanced Header with urgency styling */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex-1">
              <Dialog.Title className={cn(
                "font-semibold transition-colors duration-200",
                displayMode === 'tablet' ? "text-xl" : "text-lg",
                urgencyStyles.title
              )}>
                {trigger?.type === 'trial_exhausted' && (t('auth.modal.trialExhausted.title') || 'Trial Limit Reached')}
                {trigger?.type === 'feature_required' && (t('auth.modal.featureRequired.title') || 'Login Required')}
                {trigger?.type === 'save_action' && (t('auth.modal.saveAction.title') || 'Save Your Work')}
                {trigger?.type === 'premium_feature' && (t('auth.modal.premiumFeature.title') || 'Premium Feature')}
                {trigger?.type === 'data_export' && (t('auth.modal.dataExport.title') || 'Export Data')}
                {!trigger && (t('auth.modal.default.title') || 'Welcome Back')}
              </Dialog.Title>
              {trigger?.message && (
                <Dialog.Description className="mt-2 text-sm text-gray-600">
                  {trigger.message}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full hover:bg-gray-100 transition-colors duration-200",
                  displayMode === 'tablet' && "h-10 w-10"
                )}
                onClick={handleClose}
                aria-label="Close modal"
              >
                <X className={cn(
                  "h-4 w-4",
                  displayMode === 'tablet' && "h-5 w-5"
                )} />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content with responsive padding */}
          <div className={cn(
            "px-6 pb-6",
            displayMode === 'tablet' && "px-8 pb-8"
          )}>
            <ModalContent
              trigger={trigger}
              context={context}
              onSuccess={onSuccess}
              onSkip={onSkip}
              error={displayError}
              setError={setError}
              actions={actions}
              isRetrying={isRetrying}
              t={t}
              displayMode={displayMode}
              urgencyStyles={urgencyStyles}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default SmartLoginModal;