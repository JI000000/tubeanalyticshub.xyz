'use client';

import { useState } from 'react';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Users, 
  FileText, 
  Download, 
  Settings, 
  Shield,
  Zap,
  Save,
  Share,
  Eye,
  BarChart3
} from 'lucide-react';

export default function TestLoginIntegrationPage() {
  const { requireAuth, isAuthenticated, user, trialRemaining } = useSmartAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test different login scenarios
  const testScenarios = [
    {
      id: 'video_analysis',
      name: 'Video Analysis (Trial)',
      icon: Video,
      color: 'bg-blue-100 text-blue-800',
      handler: async () => {
        const canProceed = await requireAuth('video_analysis', {
          allowTrial: true,
          trialAction: 'video_analysis',
          message: '分析视频需要登录或使用试用次数',
          urgency: 'medium'
        });
        addResult(`Video Analysis: ${canProceed ? 'Allowed' : 'Blocked'}`);
      }
    },
    {
      id: 'save_report',
      name: 'Save Report (Login Required)',
      icon: Save,
      color: 'bg-green-100 text-green-800',
      handler: async () => {
        const canProceed = await requireAuth('save_report', {
          message: '保存报告需要登录',
          urgency: 'high'
        });
        addResult(`Save Report: ${canProceed ? 'Allowed' : 'Blocked'}`);
      }
    },
    {
      id: 'export_data',
      name: 'Export Data (Login Required)',
      icon: Download,
      color: 'bg-purple-100 text-purple-800',
      handler: async () => {
        const canProceed = await requireAuth('export_data', {
          message: '数据导出需要登录',
          urgency: 'high'
        });
        addResult(`Export Data: ${canProceed ? 'Allowed' : 'Blocked'}`);
      }
    },
    {
      id: 'team_collaboration',
      name: 'Team Collaboration (Login Required)',
      icon: Users,
      color: 'bg-orange-100 text-orange-800',
      handler: async () => {
        const canProceed = await requireAuth('team_collaboration', {
          message: '团队协作需要登录',
          urgency: 'medium'
        });
        addResult(`Team Collaboration: ${canProceed ? 'Allowed' : 'Blocked'}`);
      }
    },
    {
      id: 'user_settings',
      name: 'User Settings (Login Required)',
      icon: Settings,
      color: 'bg-gray-100 text-gray-800',
      handler: async () => {
        const canProceed = await requireAuth('user_settings', {
          message: '个人设置需要登录',
          urgency: 'medium'
        });
        addResult(`User Settings: ${canProceed ? 'Allowed' : 'Blocked'}`);
      }
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics (Login Required)',
      icon: BarChart3,
      color: 'bg-red-100 text-red-800',
      handler: async () => {
        const canProceed = await requireAuth('advanced_analytics', {
          message: '高级分析需要登录',
          urgency: 'high'
        });
        addResult(`Advanced Analytics: ${canProceed ? 'Allowed' : 'Blocked'}`);
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login Integration Test Page
          </h1>
          <p className="text-gray-600">
            Test smart login functionality across different features
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Auth Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isAuthenticated ? 'Logged In' : 'Anonymous'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trial Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trialRemaining}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">User Plan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.plan || 'Free'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Test Login Integration Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testScenarios.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <div key={scenario.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                        <FeatureAccessIndicator featureId={scenario.id} size="sm" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <LoginRequiredButton
                        featureId={scenario.id}
                        onClick={scenario.handler}
                        className="w-full"
                        size="sm"
                        data-feature={`test-${scenario.id}`}
                      >
                        Test {scenario.name}
                      </LoginRequiredButton>
                      
                      <Button
                        onClick={scenario.handler}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Direct Test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Test Results
              <Button 
                onClick={() => setTestResults([])} 
                variant="outline" 
                size="sm"
              >
                Clear Results
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No test results yet. Click on test buttons above to see results.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Access Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Access Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Trial Features</h4>
                <div className="space-y-1">
                  <Badge variant="outline" className="mr-2">video_analysis</Badge>
                  <Badge variant="outline" className="mr-2">channel_analysis</Badge>
                  <Badge variant="outline" className="mr-2">comment_analysis</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Login Required Features</h4>
                <div className="space-y-1">
                  <Badge variant="outline" className="mr-2">save_report</Badge>
                  <Badge variant="outline" className="mr-2">export_data</Badge>
                  <Badge variant="outline" className="mr-2">team_collaboration</Badge>
                  <Badge variant="outline" className="mr-2">user_settings</Badge>
                  <Badge variant="outline" className="mr-2">advanced_analytics</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}