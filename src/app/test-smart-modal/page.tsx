'use client';

import React, { useState } from 'react';
import { SmartLoginModal, LoginTrigger } from '@/components/auth/SmartLoginModal';
import { Button } from '@/components/ui/button';

export default function TestSmartModalPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<LoginTrigger | undefined>();

  const testTriggers: LoginTrigger[] = [
    {
      type: 'trial_exhausted',
      message: 'You\'ve used all 5 free analysis requests. Sign in to continue with unlimited access.',
      urgency: 'high',
      allowSkip: false
    },
    {
      type: 'feature_required',
      message: 'This feature requires an account to save your progress and access advanced analytics.',
      urgency: 'medium',
      allowSkip: true
    },
    {
      type: 'save_action',
      message: 'Sign in to save this analysis report and access it later from your dashboard.',
      urgency: 'low',
      allowSkip: true
    },
    {
      type: 'premium_feature',
      message: 'Advanced team collaboration features are available for registered users.',
      urgency: 'medium',
      allowSkip: true
    }
  ];

  const openModal = (trigger?: LoginTrigger) => {
    setCurrentTrigger(trigger);
    setIsOpen(true);
  };

  const handleSuccess = (result: any) => {
    console.log('Login successful:', result);
    alert('Login successful! Check console for details.');
  };

  const handleCancel = () => {
    console.log('Login cancelled');
  };

  const handleSkip = () => {
    console.log('Login skipped');
    alert('Login skipped');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Smart Login Modal Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Different Trigger Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testTriggers.map((trigger, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2 capitalize">
                  {trigger.type.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{trigger.message}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                    Urgency: {trigger.urgency}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                    Skip: {trigger.allowSkip ? 'Yes' : 'No'}
                  </span>
                </div>
                <Button
                  onClick={() => openModal(trigger)}
                  className="w-full"
                  variant={trigger.urgency === 'high' ? 'destructive' : 'default'}
                >
                  Test {trigger.type.replace('_', ' ')}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Modal Test</h2>
          <Button onClick={() => openModal()} variant="outline">
            Open Basic Modal (No Trigger)
          </Button>
        </div>

        <SmartLoginModal
          open={isOpen}
          onOpenChange={setIsOpen}
          trigger={currentTrigger}
          context={{
            previousAction: 'test_action',
            returnUrl: '/test-smart-modal'
          }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onSkip={handleSkip}
        />
      </div>
    </div>
  );
}