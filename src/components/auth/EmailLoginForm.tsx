'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthError, AuthErrorType } from '@/types/auth-errors';

interface EmailLoginFormProps {
  onSuccess?: (result: any) => void;
  onError?: (error: AuthError) => void;
  onBack?: () => void;
  callbackUrl?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

interface EmailFormState {
  email: string;
  isLoading: boolean;
  isEmailSent: boolean;
  error: string | null;
  validationError: string | null;
}

export function EmailLoginForm({
  onSuccess,
  onError,
  onBack,
  callbackUrl = '/',
  className,
  size = 'default'
}: EmailLoginFormProps) {
  const [state, setState] = useState<EmailFormState>({
    email: '',
    isLoading: false,
    isEmailSent: false,
    error: null,
    validationError: null
  });

  // Email validation
  const validateEmail = (email: string): string | null => {
    if (!email) {
      return 'Email is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setState(prev => ({
      ...prev,
      email,
      validationError: email ? validateEmail(email) : null,
      error: null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateEmail(state.email);
    if (validationError) {
      setState(prev => ({ ...prev, validationError }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, validationError: null }));

    try {
      const result = await signIn('email', {
        email: state.email,
        callbackUrl,
        redirect: false
      });

      if (result?.error) {
        const authError: AuthError = {
          type: AuthErrorType.PROVIDER_ERROR,
          message: 'Failed to send login email',
          code: result.error,
          details: { provider: 'email', email: state.email },
          retryable: true,
          userMessage: 'We couldn&apos;t send the login email. Please check your email address and try again.',
          timestamp: new Date()
        };
        
        onError?.(authError);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: authError.userMessage 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isEmailSent: true,
          error: null 
        }));
        
        // Call onSuccess after email is sent
        onSuccess?.({ 
          type: 'email_sent', 
          email: state.email,
          message: 'Check your email for a login link'
        });
      }
    } catch (error) {
      console.error('Email login error:', error);
      
      const authError: AuthError = {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error during email login',
        details: { provider: 'email', email: state.email },
        retryable: true,
        userMessage: 'Network error. Please check your connection and try again.',
        timestamp: new Date()
      };
      
      onError?.(authError);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: authError.userMessage 
      }));
    }
  };

  const handleTryAgain = () => {
    setState(prev => ({ 
      ...prev, 
      isEmailSent: false, 
      error: null 
    }));
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'space-y-3',
          input: 'h-8 text-sm',
          button: 'h-8 text-sm px-3',
          text: 'text-xs',
          title: 'text-sm',
          icon: 'h-3 w-3'
        };
      case 'lg':
        return {
          container: 'space-y-6',
          input: 'h-12 text-base',
          button: 'h-12 text-base px-6',
          text: 'text-base',
          title: 'text-lg',
          icon: 'h-5 w-5'
        };
      default:
        return {
          container: 'space-y-4',
          input: 'h-10 text-sm',
          button: 'h-10 text-sm px-4',
          text: 'text-sm',
          title: 'text-base',
          icon: 'h-4 w-4'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Email sent success state
  if (state.isEmailSent) {
    return (
      <div className={cn('text-center', sizeClasses.container, className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className={cn('font-semibold text-gray-900', sizeClasses.title)}>
              Check your email
            </h3>
            <p className={cn('text-gray-600', sizeClasses.text)}>
              We&apos;ve sent a login link to <strong>{state.email}</strong>
            </p>
            <p className={cn('text-gray-500', sizeClasses.text)}>
              Click the link in the email to sign in to your account.
            </p>
          </div>

          <div className="flex flex-col space-y-2 w-full">
            <Button
              variant="outline"
              onClick={handleTryAgain}
              className={cn('w-full', sizeClasses.button)}
            >
              Try different email
            </Button>
            
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className={cn('w-full', sizeClasses.button)}
              >
                <ArrowLeft className={cn('mr-2', sizeClasses.icon)} />
                Back to login options
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Email form
  return (
    <div className={cn(sizeClasses.container, className)}>
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className={cn('w-full justify-start p-0 h-auto', sizeClasses.text)}
        >
          <ArrowLeft className={cn('mr-2', sizeClasses.icon)} />
          Back to login options
        </Button>
      )}

      <div className="text-center space-y-2">
        <h3 className={cn('font-semibold text-gray-900', sizeClasses.title)}>
          Sign in with email
        </h3>
        <p className={cn('text-gray-600', sizeClasses.text)}>
          Enter your email address and we&apos;ll send you a login link
        </p>
      </div>

      <form onSubmit={handleSubmit} className={sizeClasses.container}>
        <div className="space-y-2">
          <div className="relative">
            <Mail className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
              sizeClasses.icon
            )} />
            <Input
              type="email"
              placeholder="Enter your email address"
              value={state.email}
              onChange={handleEmailChange}
              disabled={state.isLoading}
              className={cn(
                'pl-10',
                sizeClasses.input,
                state.validationError && 'border-red-300 focus-visible:border-red-500',
                state.error && 'border-red-300 focus-visible:border-red-500'
              )}
              aria-invalid={!!(state.validationError || state.error)}
              aria-describedby={
                state.validationError ? 'email-validation-error' : 
                state.error ? 'email-error' : undefined
              }
            />
          </div>
          
          {state.validationError && (
            <div 
              id="email-validation-error"
              className={cn('flex items-center text-red-600', sizeClasses.text)}
            >
              <AlertCircle className={cn('mr-1', sizeClasses.icon)} />
              {state.validationError}
            </div>
          )}
          
          {state.error && (
            <div 
              id="email-error"
              className={cn('flex items-center text-red-600', sizeClasses.text)}
            >
              <AlertCircle className={cn('mr-1', sizeClasses.icon)} />
              {state.error}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={state.isLoading || !!state.validationError || !state.email}
          className={cn('w-full', sizeClasses.button)}
        >
          {state.isLoading ? (
            <>
              <Loader2 className={cn('mr-2 animate-spin', sizeClasses.icon)} />
              Sending login link...
            </>
          ) : (
            <>
              <Mail className={cn('mr-2', sizeClasses.icon)} />
              Send login link
            </>
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className={cn('text-gray-500', sizeClasses.text)}>
          Don&apos;t have an account? You&apos;ll be automatically registered when you click the login link.
        </p>
        
        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            className={cn(
              'text-blue-600 hover:text-blue-700 hover:underline transition-colors',
              sizeClasses.text
            )}
            onClick={() => {
              // This would typically open a forgot password modal or redirect
              // For now, we'll just show the same email form since NextAuth handles this
              console.log('Forgot password clicked - same as email login with NextAuth');
            }}
          >
            Forgot password?
          </button>
          
          <Separator orientation="vertical" className="h-4" />
          
          <button
            type="button"
            className={cn(
              'text-blue-600 hover:text-blue-700 hover:underline transition-colors',
              sizeClasses.text
            )}
            onClick={() => {
              // This would typically open a registration modal
              // For now, we'll just show info since NextAuth auto-registers
              console.log('Register clicked - auto-registration with NextAuth');
            }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailLoginForm;