'use client';

import { useState } from 'react';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/login-form';
import { UserProfile } from '@/components/auth/UserProfile';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { SmartLoginModal } from '@/components/auth/SmartLoginModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TestUpdatedAuthPage() {
  const smartAuth = useSmartAuth();
  const legacyAuth = useAuth();
  const [showModal, setShowModal] = useState(false);

  const testFeatureAccess = async (featureId: string) => {
    const canProceed = await smartAuth.requireAuth(featureId, {
      message: `Testing access to ${featureId}`,
      urgency: 'medium',
      allowSkip: true,
    });
    
    if (canProceed) {
      alert(`Access granted to ${featureId}!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Updated Authentication System Test
          </h1>
          <p className="text-gray-600">
            Testing the integration of new smart authentication with existing components
          </p>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Smart Auth Hook</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Authenticated:</span>
                    <Badge variant={smartAuth.isAuthenticated ? 'default' : 'secondary'}>
                      {smartAuth.isAuthenticated ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <Badge variant={smartAuth.loading ? 'destructive' : 'secondary'}>
                      {smartAuth.loading ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Trial Remaining:</span>
                    <Badge variant="outline">{smartAuth.trialRemaining}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Can Use Trial:</span>
                    <Badge variant={smartAuth.canUseTrial ? 'default' : 'secondary'}>
                      {smartAuth.canUseTrial ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Legacy Auth Hook</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Authenticated:</span>
                    <Badge variant={legacyAuth.isAuthenticated ? 'default' : 'secondary'}>
                      {legacyAuth.isAuthenticated ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <Badge variant={legacyAuth.loading ? 'destructive' : 'secondary'}>
                      {legacyAuth.loading ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>User ID:</span>
                    <Badge variant="outline">
                      {legacyAuth.user?.id ? legacyAuth.user.id.slice(0, 8) + '...' : 'None'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <Badge variant="outline">
                      {legacyAuth.user?.provider || 'None'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile Components */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {smartAuth.isAuthenticated ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Compact Profile</h3>
                  <UserProfile variant="compact" />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-3">Dropdown Profile</h3>
                  <UserProfile variant="dropdown" />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-3">Full Profile</h3>
                  <UserProfile variant="full" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Sign in to see user profile components</p>
                <Button onClick={() => setShowModal(true)}>
                  Show Login Modal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login Form Component */}
        {!smartAuth.isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Updated Login Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <LoginForm 
                  onSuccess={() => {
                    console.log('Login success');
                    alert('Login successful!');
                  }}
                  showTrialStatus={true}
                  context="test-page"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Access Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Access Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'video_analysis',
                'save_report',
                'view_history',
                'advanced_analytics',
                'export_data',
                'api_access',
                'team_collaboration',
                'user_settings',
                'admin_panel'
              ].map((featureId) => {
                const access = smartAuth.checkFeatureAccess(featureId);
                return (
                  <div key={featureId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{featureId}</h4>
                      <Badge 
                        variant={access.allowed ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {access.reason}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {access.message || 'No message'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => testFeatureAccess(featureId)}
                    >
                      Test Access
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Route Guard Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Route Guard Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RouteGuard 
                requireAuth={false}
                fallback={<div className="p-4 bg-red-50 text-red-700 rounded">Public content fallback</div>}
              >
                <div className="p-4 bg-green-50 text-green-700 rounded">
                  ✅ Public content - accessible to everyone
                </div>
              </RouteGuard>
              
              <RouteGuard 
                requireAuth={true}
                allowTrial={true}
                trialAction="video_analysis"
                fallback={<div className="p-4 bg-yellow-50 text-yellow-700 rounded">Protected content fallback</div>}
              >
                <div className="p-4 bg-blue-50 text-blue-700 rounded">
                  🔒 Protected content - requires auth or trial
                </div>
              </RouteGuard>
              
              <RouteGuard 
                requireAuth={true}
                allowTrial={false}
                fallback={<div className="p-4 bg-red-50 text-red-700 rounded">Auth-only content fallback</div>}
              >
                <div className="p-4 bg-purple-50 text-purple-700 rounded">
                  🔐 Auth-only content - requires authentication
                </div>
              </RouteGuard>
            </div>
          </CardContent>
        </Card>

        {/* Manual Modal Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Modal Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => setShowModal(true)}>
                Show Login Modal
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => smartAuth.triggerLogin({
                  type: 'trial_exhausted',
                  message: 'Your trial has expired. Please sign in to continue.',
                  urgency: 'high',
                  allowSkip: false,
                })}
              >
                Trigger Trial Exhausted Modal
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => smartAuth.triggerLogin({
                  type: 'feature_required',
                  message: 'This feature requires authentication.',
                  urgency: 'medium',
                  allowSkip: true,
                })}
              >
                Trigger Feature Required Modal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Smart Auth State</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify({
                    isAuthenticated: smartAuth.isAuthenticated,
                    loading: smartAuth.loading,
                    trialRemaining: smartAuth.trialRemaining,
                    canUseTrial: smartAuth.canUseTrial,
                    showLoginModal: smartAuth.showLoginModal,
                    user: smartAuth.user ? {
                      id: smartAuth.user.id,
                      email: smartAuth.user.email,
                      name: smartAuth.user.name,
                      provider: smartAuth.user.provider,
                    } : null,
                  }, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Legacy Auth State</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify({
                    isAuthenticated: legacyAuth.isAuthenticated,
                    loading: legacyAuth.loading,
                    user: legacyAuth.user ? {
                      id: legacyAuth.user.id,
                      email: legacyAuth.user.email,
                      name: legacyAuth.user.name,
                      provider: legacyAuth.user.provider,
                    } : null,
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Login Modal */}
      {showModal && (
        <SmartLoginModal
          open={showModal}
          onOpenChange={setShowModal}
          trigger={{
            type: 'feature_required',
            message: 'Manual login modal test',
            urgency: 'medium',
            allowSkip: true,
          }}
          onSuccess={(result) => {
            console.log('Manual modal login success:', result);
            setShowModal(false);
            alert('Login successful!');
          }}
          onCancel={() => {
            console.log('Manual modal login cancelled');
            setShowModal(false);
          }}
          onSkip={() => {
            console.log('Manual modal login skipped');
            setShowModal(false);
          }}
        />
      )}

      {/* Smart Auth Modal */}
      {smartAuth.showLoginModal && smartAuth.loginTrigger && (
        <SmartLoginModal
          open={smartAuth.showLoginModal}
          onOpenChange={(open) => !open && smartAuth.closeLoginModal()}
          trigger={smartAuth.loginTrigger}
          context={smartAuth.loginContext}
          onSuccess={smartAuth.handleLoginSuccess}
          onCancel={smartAuth.handleLoginCancel}
          onSkip={smartAuth.handleLoginSkip}
        />
      )}
    </div>
  );
}