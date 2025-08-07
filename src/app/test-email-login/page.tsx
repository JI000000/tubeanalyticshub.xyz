'use client';

import React, { useState } from 'react';
import { SmartLoginModal } from '@/components/auth/SmartLoginModal';
import { EmailLoginForm } from '@/components/auth/EmailLoginForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestEmailLoginPage() {
  const [showModal, setShowModal] = useState(false);
  const [showStandaloneForm, setShowStandaloneForm] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLoginSuccess = (result: any) => {
    console.log('Login success:', result);
    setResult(result);
    setShowModal(false);
    setShowStandaloneForm(false);
  };

  const handleLoginError = (error: any) => {
    console.error('Login error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Email Login Implementation Test
          </h1>
          <p className="text-gray-600">
            Testing the email login fallback option in the smart login modal
          </p>
        </div>

        {/* Test Results */}
        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Login Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-green-700 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Smart Login Modal Test */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Login Modal with Email Option</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Test the email login option integrated into the smart login modal.
                The modal now includes a toggle between social and email login.
              </p>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setShowModal(true)}
                  className="w-full"
                >
                  Open Smart Login Modal
                </Button>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Toggle between &quot;Social Login&quot; and &quot;Email&quot; tabs</p>
                  <p>• Email form includes validation and error handling</p>
                  <p>• &quot;Back to login options&quot; returns to social login</p>
                  <p>• Includes &quot;Forgot password&quot; and &quot;Create account&quot; links</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Standalone Email Form Test */}
          <Card>
            <CardHeader>
              <CardTitle>Standalone Email Login Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Test the email login form as a standalone component.
              </p>
              
              <Button 
                onClick={() => setShowStandaloneForm(!showStandaloneForm)}
                variant="outline"
                className="w-full"
              >
                {showStandaloneForm ? 'Hide' : 'Show'} Email Form
              </Button>
              
              {showStandaloneForm && (
                <div className="border rounded-lg p-4 bg-white">
                  <EmailLoginForm
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    size="default"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Email Login Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Implementation Details</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• NextAuth.js EmailProvider integration</li>
                  <li>• Email validation with real-time feedback</li>
                  <li>• Loading states and error handling</li>
                  <li>• Responsive design (mobile/tablet/desktop)</li>
                  <li>• Accessibility features (ARIA labels, keyboard navigation)</li>
                  <li>• Success state with email confirmation</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">User Experience</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Toggle between social and email login</li>
                  <li>• Clear visual feedback for form states</li>
                  <li>• &quot;Back to login options&quot; navigation</li>
                  <li>• Forgot password and registration links</li>
                  <li>• Auto-registration for new users</li>
                  <li>• Consistent styling with existing components</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Notes */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Configuration Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 mb-3">
              To use email login in production, add these environment variables:
            </p>
            <div className="bg-yellow-100 rounded p-3 font-mono text-xs text-yellow-800">
              <div>EMAIL_SERVER_HOST=smtp.gmail.com</div>
              <div>EMAIL_SERVER_PORT=587</div>
              <div>EMAIL_SERVER_USER=your-email@gmail.com</div>
              <div>EMAIL_SERVER_PASSWORD=your-app-password</div>
              <div>EMAIL_FROM=noreply@yourdomain.com</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Login Modal */}
      <SmartLoginModal
        open={showModal}
        onOpenChange={setShowModal}
        trigger={{
          type: 'feature_required',
          message: 'Sign in to access this feature',
          urgency: 'medium',
          allowSkip: true
        }}
        context={{
          previousAction: 'test_email_login',
          returnUrl: '/test-email-login'
        }}
        onSuccess={handleLoginSuccess}
        onCancel={() => setShowModal(false)}
        onSkip={() => setShowModal(false)}
      />
    </div>
  );
}