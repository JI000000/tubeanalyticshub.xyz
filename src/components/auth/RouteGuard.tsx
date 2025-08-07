'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { SmartLoginModal } from './SmartLoginModal';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowTrial?: boolean;
  trialAction?: string;
  redirectTo?: string;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

export function RouteGuard({
  children,
  requireAuth = false,
  allowTrial = true,
  trialAction,
  redirectTo,
  fallback,
  onUnauthorized,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const smartAuth = useSmartAuth();
  const {
    isAuthenticated,
    loading,
    checkFeatureAccess,
    showLoginModal,
    loginTrigger,
    loginContext,
    handleLoginSuccess,
    handleLoginCancel,
    handleLoginSkip,
    closeLoginModal,
    triggerLogin,
  } = smartAuth;

  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setIsChecking(true);

      // If authentication is not required, allow access
      if (!requireAuth) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // If user is authenticated, allow access
      if (isAuthenticated) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // Check feature access for unauthenticated users
      const access = checkFeatureAccess(pathname, {
        requireAuth,
        trialAction: trialAction as any,
      });

      if (access.allowed) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // Access denied
      setHasAccess(false);
      setIsChecking(false);

      // Handle unauthorized access
      if (onUnauthorized) {
        onUnauthorized();
        return;
      }

      // Redirect if specified
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      // Trigger login modal for better UX
      triggerLogin({
        type: access.reason === 'exhausted' ? 'trial_exhausted' : 'feature_required',
        message: access.message || t('auth.loginRequired') || 'Login required to access this page',
        urgency: 'high',
        allowSkip: false,
      }, {
        previousAction: 'page_access',
        returnUrl: pathname,
        metadata: { page: pathname },
      });
    };

    if (!loading) {
      checkAccess();
    }
  }, [
    requireAuth,
    allowTrial,
    trialAction,
    isAuthenticated,
    loading,
    pathname,
    checkFeatureAccess,
    triggerLogin,
    redirectTo,
    onUnauthorized,
    router,
    t,
  ]);

  // Show loading state
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {t('app.loading') || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show fallback if access denied and fallback provided
  if (!hasAccess && fallback) {
    return (
      <>
        {fallback}
        {showLoginModal && loginTrigger && (
          <SmartLoginModal
            open={showLoginModal}
            onOpenChange={(open) => !open && closeLoginModal()}
            trigger={loginTrigger}
            context={loginContext}
            onSuccess={handleLoginSuccess}
            onCancel={handleLoginCancel}
            onSkip={handleLoginSkip}
          />
        )}
      </>
    );
  }

  // Show access denied message if no fallback
  if (!hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('auth.accessDenied') || 'Access Denied'}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('auth.loginRequiredMessage') || 'You need to sign in to access this page.'}
              </p>
              <button
                onClick={() => triggerLogin({
                  type: 'feature_required',
                  message: t('auth.signInToAccess') || 'Sign in to access this page',
                  urgency: 'high',
                  allowSkip: false,
                })}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('auth.signIn') || 'Sign In'}
              </button>
            </div>
          </div>
        </div>
        {showLoginModal && loginTrigger && (
          <SmartLoginModal
            open={showLoginModal}
            onOpenChange={(open) => !open && closeLoginModal()}
            trigger={loginTrigger}
            context={loginContext}
            onSuccess={handleLoginSuccess}
            onCancel={handleLoginCancel}
            onSkip={handleLoginSkip}
          />
        )}
      </>
    );
  }

  // Render children if access is granted
  return (
    <>
      {children}
      {showLoginModal && loginTrigger && (
        <SmartLoginModal
          open={showLoginModal}
          onOpenChange={(open) => !open && closeLoginModal()}
          trigger={loginTrigger}
          context={loginContext}
          onSuccess={handleLoginSuccess}
          onCancel={handleLoginCancel}
          onSkip={handleLoginSkip}
        />
      )}
    </>
  );
}

// Higher-order component for easier usage
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<RouteGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardOptions}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}

// Hook for checking route access
export function useRouteGuard(options: Omit<RouteGuardProps, 'children'>) {
  const smartAuth = useSmartAuth();
  const pathname = usePathname();
  
  const checkAccess = () => {
    if (!options.requireAuth) return { allowed: true, reason: 'public' };
    if (smartAuth.isAuthenticated) return { allowed: true, reason: 'authenticated' };
    
    return smartAuth.checkFeatureAccess(pathname, {
      requireAuth: options.requireAuth,
      trialAction: options.trialAction as any,
    });
  };

  return {
    ...smartAuth,
    checkAccess,
    hasAccess: checkAccess().allowed,
  };
}