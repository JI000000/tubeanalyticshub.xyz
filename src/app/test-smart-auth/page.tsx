'use client';

import React, { useState } from 'react';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { SmartLoginModal } from '@/components/auth/SmartLoginModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


export default function TestSmartAuthPage() {
  const smartAuth = useSmartAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFeatureAccess = (feature: string) => {
    const access = smartAuth.checkFeatureAccess(feature);
    addResult(`Feature "${feature}": ${access.allowed ? 'ALLOWED' : 'BLOCKED'} (${access.reason}) - ${access.message || 'No message'}`);
  };

  const testRequireAuth = async (action: string, options?: any) => {
    addResult(`Testing requireAuth for "${action}"...`);
    const result = await smartAuth.requireAuth(action, options);
    addResult(`RequireAuth "${action}": ${result ? 'SUCCESS' : 'FAILED'}`);
  };

  const testConsumeTrial = async (action: any) => {
    addResult(`Testing consumeTrial for "${action}"...`);
    const result = await smartAuth.consumeTrial(action, { test: true });
    addResult(`ConsumeTrial "${action}": ${result ? 'SUCCESS' : 'FAILED'}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Smart Authentication Test</h1>
        <p className="text-gray-600">Test the intelligent login trigger logic and feature access control</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={smartAuth.isAuthenticated ? 'default' : 'secondary'}>
                {smartAuth.isAuthenticated ? 'Authenticated' : 'Anonymous'}
              </Badge>
              {smartAuth.loading && <Badge variant="outline">Loading...</Badge>}
            </div>
            {smartAuth.user && (
              <div className="mt-2 text-sm text-gray-600">
                <p>User: {smartAuth.user.email}</p>
                <p>Plan: {smartAuth.user.plan || 'free'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trial Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={smartAuth.canUseTrial ? 'default' : 'destructive'}>
                {smartAuth.trialRemaining} remaining
              </Badge>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {smartAuth.getTrialStatusMessage()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trial Indicator</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={smartAuth.shouldShowTrialIndicator() ? 'destructive' : 'outline'}>
              {smartAuth.shouldShowTrialIndicator() ? 'Show Indicator' : 'Hidden'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Access Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Access Tests</CardTitle>
            <CardDescription>Test different feature access scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => testFeatureAccess('video_analysis')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Test Video Analysis (Trial Allowed)
            </Button>
            <Button 
              onClick={() => testFeatureAccess('save_report')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Test Save Report (Login Required)
            </Button>
            <Button 
              onClick={() => testFeatureAccess('view_history')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Test View History (Login Required)
            </Button>
            <Button 
              onClick={() => testFeatureAccess('advanced_analytics')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Test Advanced Analytics (Premium)
            </Button>
            <Button 
              onClick={() => testFeatureAccess('admin_panel')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Test Admin Panel (Premium Required)
            </Button>
          </CardContent>
        </Card>

        {/* RequireAuth Tests */}
        <Card>
          <CardHeader>
            <CardTitle>RequireAuth Tests</CardTitle>
            <CardDescription>Test smart login triggering</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => testRequireAuth('video_analysis', { 
                allowTrial: true, 
                trialAction: 'video_analysis',
                message: 'Custom message for video analysis'
              })} 
              variant="outline" 
              className="w-full justify-start"
            >
              Require Auth: Video Analysis
            </Button>
            <Button 
              onClick={() => testRequireAuth('save_report', { 
                allowTrial: false,
                message: 'You need to login to save reports',
                urgency: 'high'
              })} 
              variant="outline" 
              className="w-full justify-start"
            >
              Require Auth: Save Report
            </Button>
            <Button 
              onClick={() => testRequireAuth('export_data', { 
                allowTrial: false,
                message: 'Data export requires authentication',
                urgency: 'medium',
                allowSkip: true
              })} 
              variant="outline" 
              className="w-full justify-start"
            >
              Require Auth: Export Data (Skippable)
            </Button>
          </CardContent>
        </Card>

        {/* Trial Consumption Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Consumption Tests</CardTitle>
            <CardDescription>Test trial usage and smart triggering</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => testConsumeTrial('video_analysis')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Consume Trial: Video Analysis
            </Button>
            <Button 
              onClick={() => testConsumeTrial('generate_report')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Consume Trial: Generate Report
            </Button>
            <Button 
              onClick={() => testConsumeTrial('advanced_search')} 
              variant="outline" 
              className="w-full justify-start"
            >
              Consume Trial: Advanced Search
            </Button>
          </CardContent>
        </Card>

        {/* Manual Login Triggers */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Login Triggers</CardTitle>
            <CardDescription>Manually trigger different login scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => smartAuth.triggerLogin({
                type: 'trial_exhausted',
                message: 'Your free trials have been exhausted. Login to continue.',
                urgency: 'high',
                allowSkip: false
              })} 
              variant="outline" 
              className="w-full justify-start"
            >
              Trigger: Trial Exhausted
            </Button>
            <Button 
              onClick={() => smartAuth.triggerLogin({
                type: 'feature_required',
                message: 'This feature requires login to access.',
                urgency: 'medium',
                allowSkip: true
              })} 
              variant="outline" 
              className="w-full justify-start"
            >
              Trigger: Feature Required
            </Button>
            <Button 
              onClick={() => smartAuth.triggerLogin({
                type: 'save_action',
                message: 'Login to save your work and never lose it.',
                urgency: 'low',
                allowSkip: true
              })} 
              variant="outline" 
              className="w-full justify-start"
            >
              Trigger: Save Action
            </Button>
            <Button 
              onClick={() => smartAuth.triggerLogin({
                type: 'premium_feature',
                message: 'Upgrade to premium to access advanced features.',
                urgency: 'medium',
                allowSkip: true
              })} 
              variant="outline" 
              className="w-full justify-start"
            >
              Trigger: Premium Feature
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Real-time test execution results</CardDescription>
            </div>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No test results yet. Run some tests above.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Login Modal */}
      <SmartLoginModal
        open={smartAuth.showLoginModal}
        onOpenChange={smartAuth.closeLoginModal}
        trigger={smartAuth.loginTrigger}
        context={smartAuth.loginContext}
        onSuccess={smartAuth.handleLoginSuccess}
        onCancel={smartAuth.handleLoginCancel}
        onSkip={smartAuth.handleLoginSkip}
      />
    </div>
  );
}