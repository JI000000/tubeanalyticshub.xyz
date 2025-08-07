/**
 * Example integration of SmartLoginModal with existing auth system
 * This shows how the modal would be used in practice
 */

'use client';

import React, { useState } from 'react';
import { SmartLoginModal, LoginTrigger, LoginContext } from './SmartLoginModal';
import { useAuth } from '@/hooks/useAuth';
import { useAnonymousTrial } from '@/hooks/useAnonymousTrial';

interface SmartAuthTriggerProps {
  children: React.ReactNode;
  requiredAction: string;
  fallbackMessage?: string;
}

/**
 * Higher-order component that wraps any action requiring authentication
 * and shows the smart login modal when needed
 */
export function SmartAuthTrigger({ 
  children, 
  requiredAction, 
  fallbackMessage = 'This action requires you to sign in.' 
}: SmartAuthTriggerProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<LoginTrigger | undefined>();
  const { user, loading } = useAuth();
  const { trialStatus, canPerformAction } = useAnonymousTrial();

  const handleActionClick = () => {
    // If user is authenticated, proceed with action
    if (user) {
      // Execute the protected action
      console.log(`Executing ${requiredAction} for authenticated user`);
      return;
    }

    // If user can still use trial, allow action
    if (canPerformAction('video_analysis')) {
      console.log(`Executing ${requiredAction} using trial`);
      return;
    }

    // Determine the appropriate trigger based on context
    let trigger: LoginTrigger;

    if (trialStatus && trialStatus.remaining === 0) {
      trigger = {
        type: 'trial_exhausted',
        message: `You've used all ${trialStatus?.total || 5} free requests. Sign in to continue with unlimited access.`,
        urgency: 'high',
        allowSkip: false
      };
    } else if (requiredAction.includes('save')) {
      trigger = {
        type: 'save_action',
        message: 'Sign in to save your work and access it later from your dashboard.',
        urgency: 'medium',
        allowSkip: true
      };
    } else if (requiredAction.includes('premium')) {
      trigger = {
        type: 'premium_feature',
        message: 'This advanced feature is available for registered users.',
        urgency: 'medium',
        allowSkip: true
      };
    } else {
      trigger = {
        type: 'feature_required',
        message: fallbackMessage,
        urgency: 'low',
        allowSkip: true
      };
    }

    setCurrentTrigger(trigger);
    setShowModal(true);
  };

  const handleLoginSuccess = (result: any) => {
    console.log('Login successful, proceeding with action:', requiredAction);
    setShowModal(false);
    // Execute the original action now that user is authenticated
    // This would typically trigger a re-render with the new auth state
  };

  const handleSkip = () => {
    console.log('User skipped login for:', requiredAction);
    setShowModal(false);
    // Optionally still allow the action with limitations
  };

  const context: LoginContext = {
    previousAction: requiredAction,
    returnUrl: window.location.pathname,
    metadata: {
      trialStatus,
      timestamp: new Date().toISOString()
    }
  };

  return (
    <>
      <div onClick={handleActionClick}>
        {children}
      </div>

      <SmartLoginModal
        open={showModal}
        onOpenChange={setShowModal}
        trigger={currentTrigger}
        context={context}
        onSuccess={handleLoginSuccess}
        onCancel={() => setShowModal(false)}
        onSkip={handleSkip}
      />
    </>
  );
}

/**
 * Example usage in a component
 */
export function ExampleUsage() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Smart Auth Integration Examples</h2>
      
      {/* Save action example */}
      <SmartAuthTrigger 
        requiredAction="save_analysis_report"
        fallbackMessage="Sign in to save this analysis report to your dashboard."
      >
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Save Analysis Report
        </button>
      </SmartAuthTrigger>

      {/* Premium feature example */}
      <SmartAuthTrigger 
        requiredAction="premium_export_data"
        fallbackMessage="Advanced export features require an account."
      >
        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Export to Excel (Premium)
        </button>
      </SmartAuthTrigger>

      {/* General feature example */}
      <SmartAuthTrigger 
        requiredAction="create_project"
        fallbackMessage="Creating projects requires you to sign in."
      >
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Create New Project
        </button>
      </SmartAuthTrigger>
    </div>
  );
}

export default SmartAuthTrigger;