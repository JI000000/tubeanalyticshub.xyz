'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmartLoginModal, LoginTrigger, LoginContext } from '@/components/auth/SmartLoginModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Tablet, Monitor, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function TestModalModesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<LoginTrigger | undefined>();
  const [currentContext, setCurrentContext] = useState<LoginContext | undefined>();

  // Test scenarios with different urgency levels
  const testScenarios = [
    {
      id: 'high-urgency',
      name: 'High Urgency - Trial Exhausted',
      description: 'Critical action needed, trial completely used up',
      icon: AlertTriangle,
      urgency: 'high' as const,
      trigger: {
        type: 'trial_exhausted' as const,
        message: 'You\'ve used all 5 free analyses. Sign in to continue with unlimited access.',
        urgency: 'high' as const,
        allowSkip: false
      },
      context: {
        previousAction: 'analyze_video',
        returnUrl: '/analysis',
        metadata: { videoId: 'test123', analysisType: 'full' }
      }
    },
    {
      id: 'medium-urgency',
      name: 'Medium Urgency - Save Required',
      description: 'Important action that benefits from login',
      icon: AlertCircle,
      urgency: 'medium' as const,
      trigger: {
        type: 'save_action' as const,
        message: 'Sign in to save this analysis report and access it later.',
        urgency: 'medium' as const,
        allowSkip: true
      },
      context: {
        previousAction: 'save_report',
        returnUrl: '/reports',
        metadata: { reportId: 'report456', reportType: 'channel_analysis' }
      }
    },
    {
      id: 'low-urgency',
      name: 'Low Urgency - Feature Access',
      description: 'Optional enhancement, gentle encouragement',
      icon: Info,
      urgency: 'low' as const,
      trigger: {
        type: 'feature_required' as const,
        message: 'Sign in to unlock advanced analytics and collaboration features.',
        urgency: 'low' as const,
        allowSkip: true
      },
      context: {
        previousAction: 'view_advanced_analytics',
        returnUrl: '/analytics',
        metadata: { feature: 'advanced_analytics' }
      }
    },
    {
      id: 'premium-feature',
      name: 'Premium Feature Access',
      description: 'Premium functionality requiring authentication',
      icon: AlertCircle,
      urgency: 'medium' as const,
      trigger: {
        type: 'premium_feature' as const,
        message: 'This premium feature requires a signed-in account to access.',
        urgency: 'medium' as const,
        allowSkip: true
      },
      context: {
        previousAction: 'access_premium_feature',
        returnUrl: '/premium',
        metadata: { feature: 'team_collaboration' }
      }
    },
    {
      id: 'data-export',
      name: 'Data Export',
      description: 'Data export requiring user authentication',
      icon: Info,
      urgency: 'low' as const,
      trigger: {
        type: 'data_export' as const,
        message: 'Sign in to export your analysis data and maintain data ownership.',
        urgency: 'low' as const,
        allowSkip: true
      },
      context: {
        previousAction: 'export_data',
        returnUrl: '/export',
        metadata: { exportType: 'csv', dataRange: 'last_30_days' }
      }
    }
  ];

  const openModal = (scenario: typeof testScenarios[0]) => {
    setCurrentTrigger(scenario.trigger);
    setCurrentContext(scenario.context);
    setModalOpen(true);
  };

  const handleModalSuccess = (result: unknown) => {
    console.log('Login successful:', result);
    setModalOpen(false);
  };

  const handleModalCancel = () => {
    console.log('Login cancelled');
    setModalOpen(false);
  };

  const handleModalSkip = () => {
    console.log('Login skipped');
    setModalOpen(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Smart Login Modal - Display Modes Test
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Test the login modal across different devices and urgency levels. 
          The modal automatically adapts its layout and styling based on device type and urgency.
        </p>
        
        {/* Device Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Mobile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Bottom drawer layout with pull indicator and optimized touch targets
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Tablet className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Tablet</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Larger centered modal with enhanced spacing and typography
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Desktop</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Compact centered modal with hover effects and keyboard navigation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Test Scenarios by Urgency Level
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testScenarios.map((scenario) => {
            const IconComponent = scenario.icon;
            return (
              <Card key={scenario.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${
                        scenario.urgency === 'high' ? 'text-red-600' :
                        scenario.urgency === 'medium' ? 'text-orange-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 ${getUrgencyBadgeColor(scenario.urgency)}`}
                        >
                          {scenario.urgency.toUpperCase()} URGENCY
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {scenario.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-700 mb-1">Trigger Message:</p>
                      <p className="text-gray-600 italic">&quot;{scenario.trigger.message}&quot;</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium text-gray-700 mb-1">Properties:</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Type: {scenario.trigger.type}</li>
                        <li>• Skip allowed: {scenario.trigger.allowSkip ? 'Yes' : 'No'}</li>
                        <li>• Previous action: {scenario.context.previousAction}</li>
                      </ul>
                    </div>
                    
                    <Button
                      onClick={() => openModal(scenario)}
                      variant={getUrgencyColor(scenario.urgency) as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
                      className="w-full mt-4"
                    >
                      Test {scenario.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Test Controls */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Tests
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => {
              setCurrentTrigger(undefined);
              setCurrentContext({
                previousAction: 'general_login',
                returnUrl: '/',
                metadata: {}
              });
              setModalOpen(true);
            }}
            variant="outline"
            className="h-12"
          >
            Test Default Modal (No Trigger)
          </Button>
          
          <Button
            onClick={() => {
              // Test with minimal context
              setCurrentTrigger({
                type: 'feature_required',
                message: 'Quick test message',
                urgency: 'low',
                allowSkip: true
              });
              setCurrentContext({
                previousAction: 'test',
                returnUrl: '/test'
              });
              setModalOpen(true);
            }}
            variant="outline"
            className="h-12"
          >
            Test Minimal Configuration
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Testing Instructions
        </h3>
        <ul className="text-blue-800 space-y-2">
          <li>• <strong>Desktop:</strong> Resize your browser window to see responsive behavior</li>
          <li>• <strong>Mobile:</strong> Use browser dev tools to simulate mobile devices</li>
          <li>• <strong>Urgency:</strong> Notice how colors, animations, and styling change</li>
          <li>• <strong>Interactions:</strong> Test keyboard navigation, clicking outside, and ESC key</li>
          <li>• <strong>Accessibility:</strong> Try with screen readers and high contrast mode</li>
        </ul>
      </div>

      {/* Smart Login Modal */}
      <SmartLoginModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        trigger={currentTrigger}
        context={currentContext}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
        onSkip={handleModalSkip}
      />
    </div>
  );
}