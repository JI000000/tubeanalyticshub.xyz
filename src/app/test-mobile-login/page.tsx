'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmartLoginModal } from '@/components/auth/SmartLoginModal';
import { useIsMobile, useBreakpoint, useIsTouchDevice } from '@/hooks/useMediaQuery';
import { isMobileBrowser, isIOSSafari, isAndroidChrome } from '@/lib/mobile-oauth';

export default function TestMobileLoginPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [trigger, setTrigger] = useState<any>(null);
  
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const isTouchDevice = useIsTouchDevice();
  const isMobileBrowserDetected = isMobileBrowser();
  const isIOS = isIOSSafari();
  const isAndroid = isAndroidChrome();

  const testScenarios = [
    {
      id: 'trial_exhausted',
      title: 'Trial Exhausted',
      trigger: {
        type: 'trial_exhausted' as const,
        message: 'You\'ve used all 5 free analyses. Sign in to continue with unlimited access.',
        urgency: 'high' as const,
        allowSkip: false,
      }
    },
    {
      id: 'feature_required',
      title: 'Feature Required',
      trigger: {
        type: 'feature_required' as const,
        message: 'Sign in to save your analysis reports and access them later.',
        urgency: 'medium' as const,
        allowSkip: true,
      }
    },
    {
      id: 'save_action',
      title: 'Save Action',
      trigger: {
        type: 'save_action' as const,
        message: 'Create an account to save this analysis to your dashboard.',
        urgency: 'low' as const,
        allowSkip: true,
      }
    },
    {
      id: 'premium_feature',
      title: 'Premium Feature',
      trigger: {
        type: 'premium_feature' as const,
        message: 'This advanced feature requires a signed-in account.',
        urgency: 'medium' as const,
        allowSkip: false,
      }
    }
  ];

  const openModal = (scenario: any) => {
    setTrigger(scenario.trigger);
    setModalOpen(true);
  };

  const handleSuccess = (result: any) => {
    console.log('Login success:', result);
    alert('Login successful! Check console for details.');
  };

  const handleCancel = () => {
    console.log('Login cancelled');
  };

  const handleSkip = () => {
    console.log('Login skipped');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Mobile Login Experience Test
          </h1>
          
          {/* Device Detection Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Device Detection</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>React Hook Mobile: {isMobile ? '✅' : '❌'}</li>
                <li>Browser Mobile: {isMobileBrowserDetected ? '✅' : '❌'}</li>
                <li>Touch Device: {isTouchDevice ? '✅' : '❌'}</li>
                <li>Breakpoint: {breakpoint}</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Platform Detection</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>iOS Safari: {isIOS ? '✅' : '❌'}</li>
                <li>Android Chrome: {isAndroid ? '✅' : '❌'}</li>
                <li>User Agent: {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</li>
              </ul>
            </div>
          </div>

          {/* Test Scenarios */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Test Login Scenarios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testScenarios.map((scenario) => (
                <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {scenario.trigger.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      scenario.trigger.urgency === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : scenario.trigger.urgency === 'medium'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {scenario.trigger.urgency} urgency
                    </span>
                    <Button
                      onClick={() => openModal(scenario)}
                      size="sm"
                      className="ml-2"
                    >
                      Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile-Specific Features */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Mobile Optimizations Active
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>✅ Bottom drawer layout on mobile</li>
              <li>✅ Larger touch areas (48px minimum)</li>
              <li>✅ Mobile-optimized OAuth flow</li>
              <li>✅ Pull-to-dismiss gesture</li>
              <li>✅ Viewport optimization</li>
              <li>✅ iOS Safari compatibility</li>
              <li>✅ Android Chrome compatibility</li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Testing Instructions</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Test on different devices: iPhone, Android, iPad, Desktop</li>
              <li>Try different browsers: Safari, Chrome, Firefox</li>
              <li>Test in portrait and landscape orientations</li>
              <li>Verify touch areas are large enough (44px+ on iOS)</li>
              <li>Check OAuth redirect flow works smoothly</li>
              <li>Ensure modal can be dismissed with swipe gesture</li>
              <li>Verify keyboard doesn&apos;t interfere with modal</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <SmartLoginModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        trigger={trigger}
        context={{
          previousAction: 'test_mobile_login',
          returnUrl: '/test-mobile-login',
          metadata: { test: true }
        }}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        onSkip={handleSkip}
      />
    </div>
  );
}