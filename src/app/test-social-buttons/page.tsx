'use client';

import React, { useState } from 'react';
import { SocialLoginButtons, type AuthResult } from '@/components/auth/SocialLoginButtons';
import { AuthError } from '@/types/auth-errors';
import { Button } from '@/components/ui/button';

export default function TestSocialButtonsPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSuccess = (result: AuthResult) => {
    setResult(`Success: ${JSON.stringify(result, null, 2)}`);
  };

  const handleError = (error: AuthError) => {
    setResult(`Error: ${JSON.stringify(error, null, 2)}`);
  };

  const toggleLoading = () => {
    setLoading(!loading);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Social Login Buttons Test
        </h1>

        <div className="space-y-6">
          {/* Default variant */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Default Variant</h2>
            <SocialLoginButtons
              onSuccess={handleSuccess}
              onError={handleError}
              loading={loading}
            />
          </div>

          {/* Outline variant */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Outline Variant</h2>
            <SocialLoginButtons
              onSuccess={handleSuccess}
              onError={handleError}
              variant="outline"
              loading={loading}
            />
          </div>

          {/* Small size */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Small Size</h2>
            <SocialLoginButtons
              onSuccess={handleSuccess}
              onError={handleError}
              size="sm"
              loading={loading}
            />
          </div>

          {/* Large size */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Large Size</h2>
            <SocialLoginButtons
              onSuccess={handleSuccess}
              onError={handleError}
              size="lg"
              loading={loading}
            />
          </div>

          {/* Controls */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-3">Controls</h2>
            <Button onClick={toggleLoading} variant="outline">
              {loading ? 'Disable Loading' : 'Enable Loading'}
            </Button>
          </div>

          {/* Result display */}
          {result && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-3">Result</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {result}
              </pre>
              <Button 
                onClick={() => setResult('')} 
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}