/**
 * Error Handling Test Page
 * 
 * Test page to demonstrate and verify the authentication error handling system
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AuthErrorDisplay } from '@/components/auth/AuthErrorDisplay';
import { useAuthWithErrorHandling } from '@/hooks/useAuthWithErrorHandling';
import { 
  AuthError, 
  AuthErrorType
} from '@/types/auth-errors';
import { handleAuthError } from '@/lib/auth-error-handler';

export default function TestErrorHandlingPage() {
  const [simulatedError, setSimulatedError] = useState<AuthError | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const {
    session,
    authState,
    actions,
    isLoading,
    error,
    isRetrying,
    canRetry,
    fallbackAction,
  } = useAuthWithErrorHandling({
    onError: (error) => {
      addTestResult(`Error handled: ${error.type} - ${error.userMessage}`);
    },
    onSuccess: (result) => {
      addTestResult(`Success: ${JSON.stringify(result)}`);
    },
    onRetryExhausted: (error) => {
      addTestResult(`Retry exhausted for: ${error.type}`);
    },
  });

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const simulateError = async (errorType: AuthErrorType) => {
    let mockError: any;
    
    switch (errorType) {
      case AuthErrorType.NETWORK_ERROR:
        mockError = new Error('Network request failed');
        mockError.name = 'NetworkError';
        break;
      
      case AuthErrorType.OAUTH_ACCESS_DENIED:
        mockError = {
          error: 'access_denied',
          error_description: 'User denied access to the application',
        };
        break;
      
      case AuthErrorType.OAUTH_INVALID_CLIENT:
        mockError = {
          error: 'invalid_client',
          error_description: 'Client authentication failed',
        };
        break;
      
      case AuthErrorType.SESSION_EXPIRED:
        mockError = 'Session has expired';
        break;
      
      case AuthErrorType.RATE_LIMITED:
        mockError = {
          type: 'RATE_LIMITED',
          message: 'Too many requests',
          retryAfter: 30,
        };
        break;
      
      case AuthErrorType.PROVIDER_UNAVAILABLE:
        mockError = new Error('GitHub is currently unavailable');
        break;
      
      case AuthErrorType.TIMEOUT_ERROR:
        mockError = new Error('Request timeout');
        mockError.name = 'TimeoutError';
        break;
      
      default:
        mockError = new Error('Unknown error occurred');
    }

    const authError = await handleAuthError(mockError, {
      provider: 'github',
      action: 'test_simulation',
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    setSimulatedError(authError);
    addTestResult(`Simulated error: ${authError.type}`);
  };

  const testRetryMechanism = async () => {
    addTestResult('Testing retry mechanism...');
    
    // Simulate a retryable error
    await simulateError(AuthErrorType.NETWORK_ERROR);
    
    // Test retry logic
    setTimeout(() => {
      if (canRetry) {
        addTestResult('Attempting retry...');
        actions.retryLastAction();
      }
    }, 2000);
  };

  const testFallbackStrategies = async () => {
    addTestResult('Testing fallback strategies...');
    
    // Test different error types and their fallbacks
    const errorTypes = [
      AuthErrorType.OAUTH_ACCESS_DENIED,
      AuthErrorType.PROVIDER_UNAVAILABLE,
      AuthErrorType.RATE_LIMITED,
      AuthErrorType.SESSION_EXPIRED,
    ];

    for (const errorType of errorTypes) {
      await simulateError(errorType);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const clearTests = () => {
    setTestResults([]);
    setSimulatedError(null);
    actions.clearError();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Authentication Error Handling Test</h1>
        <p className="text-muted-foreground">
          Test and demonstrate the comprehensive error handling system for authentication flows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication State</CardTitle>
            <CardDescription>
              Real-time authentication status and error information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Session Status</label>
                <Badge variant={session.isAuthenticated ? 'default' : 'secondary'}>
                  {session.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Loading State</label>
                <Badge variant={isLoading ? 'destructive' : 'outline'}>
                  {isLoading ? 'Loading' : 'Idle'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Retry State</label>
                <Badge variant={isRetrying ? 'destructive' : 'outline'}>
                  {isRetrying ? 'Retrying' : 'Not Retrying'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Can Retry</label>
                <Badge variant={canRetry ? 'default' : 'outline'}>
                  {canRetry ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {authState.retryCount > 0 && (
              <div>
                <label className="text-sm font-medium">Retry Count</label>
                <p className="text-sm text-muted-foreground">{authState.retryCount}</p>
              </div>
            )}

            {fallbackAction && (
              <div>
                <label className="text-sm font-medium">Fallback Action</label>
                <Badge variant="outline">{fallbackAction.type}</Badge>
                <p className="text-sm text-muted-foreground mt-1">{fallbackAction.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Simulation */}
        <Card>
          <CardHeader>
            <CardTitle>Error Simulation</CardTitle>
            <CardDescription>
              Simulate different types of authentication errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => simulateError(AuthErrorType.NETWORK_ERROR)}
                variant="outline"
                size="sm"
              >
                Network Error
              </Button>
              <Button
                onClick={() => simulateError(AuthErrorType.OAUTH_ACCESS_DENIED)}
                variant="outline"
                size="sm"
              >
                OAuth Denied
              </Button>
              <Button
                onClick={() => simulateError(AuthErrorType.OAUTH_INVALID_CLIENT)}
                variant="outline"
                size="sm"
              >
                Invalid Client
              </Button>
              <Button
                onClick={() => simulateError(AuthErrorType.SESSION_EXPIRED)}
                variant="outline"
                size="sm"
              >
                Session Expired
              </Button>
              <Button
                onClick={() => simulateError(AuthErrorType.RATE_LIMITED)}
                variant="outline"
                size="sm"
              >
                Rate Limited
              </Button>
              <Button
                onClick={() => simulateError(AuthErrorType.PROVIDER_UNAVAILABLE)}
                variant="outline"
                size="sm"
              >
                Provider Down
              </Button>
              <Button
                onClick={() => simulateError(AuthErrorType.TIMEOUT_ERROR)}
                variant="outline"
                size="sm"
              >
                Timeout
              </Button>
              <Button
                onClick={() => simulateError(AuthErrorType.UNKNOWN_ERROR)}
                variant="outline"
                size="sm"
              >
                Unknown Error
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button
                onClick={testRetryMechanism}
                className="w-full"
                variant="secondary"
              >
                Test Retry Mechanism
              </Button>
              <Button
                onClick={testFallbackStrategies}
                className="w-full"
                variant="secondary"
              >
                Test Fallback Strategies
              </Button>
              <Button
                onClick={clearTests}
                className="w-full"
                variant="outline"
              >
                Clear Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Error Display</CardTitle>
            <CardDescription>
              Live demonstration of error display components
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(error || simulatedError) && (
              <div className="space-y-4">
                <h4 className="font-medium">Current Error (Full Display)</h4>
                <AuthErrorDisplay
                  error={error || simulatedError}
                  onRetry={() => {
                    addTestResult('Retry button clicked');
                    actions.retryLastAction();
                  }}
                  onAlternativeMethod={(excludeProvider) => {
                    addTestResult(`Alternative method requested, exclude: ${excludeProvider}`);
                  }}
                  onSkip={() => {
                    addTestResult('Skip button clicked');
                    actions.clearError();
                    setSimulatedError(null);
                  }}
                  onDismiss={() => {
                    addTestResult('Error dismissed');
                    actions.clearError();
                    setSimulatedError(null);
                  }}
                  showDetails={true}
                />

                <h4 className="font-medium">Compact Display</h4>
                <AuthErrorDisplay
                  error={error || simulatedError}
                  onRetry={() => {
                    addTestResult('Compact retry clicked');
                  }}
                  onDismiss={() => {
                    addTestResult('Compact error dismissed');
                    setSimulatedError(null);
                  }}
                  compact={true}
                />
              </div>
            )}

            {!error && !simulatedError && (
              <p className="text-muted-foreground text-center py-8">
                No errors to display. Simulate an error above to see the error display components.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Test Results Log</CardTitle>
            <CardDescription>
              Real-time log of error handling events and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
              {testResults.length > 0 ? (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No test results yet. Run some error simulations to see the log.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real Authentication Test */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Real Authentication Test</CardTitle>
            <CardDescription>
              Test real authentication flows with error handling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  addTestResult('Attempting GitHub sign in...');
                  actions.signInWithProvider('github');
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
              </Button>
              <Button
                onClick={() => {
                  addTestResult('Attempting Google sign in...');
                  actions.signInWithProvider('google');
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>
              {session.isAuthenticated && (
                <Button
                  onClick={() => {
                    addTestResult('Attempting sign out...');
                    actions.signOutWithErrorHandling();
                  }}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}