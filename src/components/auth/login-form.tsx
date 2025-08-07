'use client';

import { useState } from 'react';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { SocialLoginButtons } from './SocialLoginButtons';
import { TrialStatusIndicator } from './TrialStatusIndicator';

interface LoginFormProps {
  onSuccess?: () => void;
  showTrialStatus?: boolean;
  context?: string;
}

export function LoginForm({ onSuccess, showTrialStatus = true, context = 'general' }: LoginFormProps) {
  const { user, isAuthenticated, loading, trialRemaining, shouldShowTrialIndicator } = useSmartAuth();
  const { t } = useTranslation();
  const [error, setError] = useState('');

  const handleLoginSuccess = (result: any) => {
    setError('');
    onSuccess?.();
  };

  const handleLoginError = (error: any) => {
    setError(error.message || 'Login failed. Please try again.');
  };

  // If user is already authenticated, show success message
  if (isAuthenticated && user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('auth.welcomeBack') || 'Welcome back!'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('auth.loggedInAs') || 'Logged in as'} {user.email}
              </p>
            </div>
            <Button onClick={() => onSuccess?.()} className="w-full">
              {t('auth.continue') || 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t('auth.welcomeTitle') || 'Welcome to YouTube Analytics'}
        </CardTitle>
        <p className="text-center text-gray-600 text-sm">
          {t('auth.welcomeDescription') || 'Sign in to access your analytics dashboard'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trial Status Indicator */}
        {showTrialStatus && shouldShowTrialIndicator() && (
          <TrialStatusIndicator 
            variant="banner"
            showLoginButton={true}
            onLoginClick={() => {/* Login will be handled by SocialLoginButtons */}}
            className="mb-4"
            showBenefits={true}
          />
        )}

        {/* Social Login Buttons */}
        <SocialLoginButtons
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          disabled={loading}
          className="space-y-3"
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-gray-600">
          <p>{t('auth.newUserNote') || 'New users will be automatically registered'}</p>
        </div>
      </CardContent>
    </Card>
  );
}