'use client';

import React, { useState } from 'react';
import { UserWelcomeFlow } from '@/components/auth/UserWelcomeFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Gift, 
  ArrowRight,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

export default function TestWelcomeFlowPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [completedAction, setCompletedAction] = useState<string | null>(null);
  const [previousAction, setPreviousAction] = useState<string>('');
  const [returnUrl, setReturnUrl] = useState('/dashboard');

  const handleShowWelcome = (action?: string) => {
    if (action) {
      setPreviousAction(action);
    }
    setShowWelcome(true);
    setCompletedAction(null);
  };

  const handleWelcomeComplete = (returnToAction?: string) => {
    setShowWelcome(false);
    setCompletedAction(returnToAction || 'welcome flow');
    console.log('Welcome flow completed, returning to:', returnToAction);
  };

  const handleWelcomeSkip = () => {
    setShowWelcome(false);
    setCompletedAction('skipped');
    console.log('Welcome flow skipped');
  };

  const testScenarios = [
    {
      id: 'new-user',
      title: 'New User Welcome',
      description: 'First-time user login experience',
      action: 'general_welcome',
      returnUrl: '/dashboard'
    },
    {
      id: 'save-report',
      title: 'Save Report Action',
      description: 'User tried to save a report',
      action: 'save_report',
      returnUrl: '/reports/new'
    },
    {
      id: 'export-data',
      title: 'Export Data Action',
      description: 'User tried to export analysis data',
      action: 'export_data',
      returnUrl: '/analysis/export'
    },
    {
      id: 'team-collaboration',
      title: 'Team Feature Access',
      description: 'User tried to access team features',
      action: 'team_collaboration',
      returnUrl: '/teams'
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics',
      description: 'User tried to access premium features',
      action: 'advanced_analytics',
      returnUrl: '/analytics/advanced'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Welcome Flow Test
          </h1>
          <p className="text-gray-600">
            Test the enhanced user welcome flow with different scenarios and contexts.
          </p>
        </div>

        {/* Test Results */}
        {completedAction && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">
                  Welcome flow completed: {completedAction}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testScenarios.map((scenario) => (
            <Card key={scenario.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  <Badge variant="outline">{scenario.action}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {scenario.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium">Previous Action:</span> {scenario.action}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Return URL:</span> {scenario.returnUrl}
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setReturnUrl(scenario.returnUrl);
                    handleShowWelcome(scenario.action);
                  }}
                  className="w-full"
                >
                  Test Scenario
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manual Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manual Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Previous Action
                </label>
                <input
                  type="text"
                  value={previousAction}
                  onChange={(e) => setPreviousAction(e.target.value)}
                  placeholder="e.g., save_report, export_data"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Return URL
                </label>
                <input
                  type="text"
                  value={returnUrl}
                  onChange={(e) => setReturnUrl(e.target.value)}
                  placeholder="e.g., /dashboard, /reports"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleShowWelcome(previousAction)}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Show Welcome Flow
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setCompletedAction(null);
                  setPreviousAction('');
                  setReturnUrl('/dashboard');
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Welcome Flow Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Implemented Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• First-time user welcome interface</li>
                  <li>• Quick user preference setup flow</li>
                  <li>• Login benefits explanation display</li>
                  <li>• Seamless return to previous operation</li>
                  <li>• New user feature introduction guide</li>
                  <li>• Progressive step navigation</li>
                  <li>• Optional step skipping</li>
                  <li>• Context-aware completion</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🎯 Key Benefits</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Improved user onboarding experience</li>
                  <li>• Reduced time to first value</li>
                  <li>• Better feature discovery</li>
                  <li>• Personalized user preferences</li>
                  <li>• Seamless workflow continuation</li>
                  <li>• Higher user engagement</li>
                  <li>• Better retention rates</li>
                  <li>• Clear value proposition</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Flow Modal */}
      {showWelcome && (
        <UserWelcomeFlow
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeSkip}
          previousAction={previousAction}
          returnUrl={returnUrl}
          context={{
            source: 'test_page',
            timestamp: new Date().toISOString()
          }}
        />
      )}
    </div>
  );
}