'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUserSync } from '@/hooks/useUserSync';
import { UserWelcomeFlow } from '@/components/auth/UserWelcomeFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Database, 
  Activity, 
  RefreshCw,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

export default function TestUserSyncPage() {
  const { data: session, status } = useSession();
  const {
    userData,
    loading,
    error,
    isInitialized,
    migrationStatus,
    initializeUser,
    syncUserData,
    migrateTrialData,
    updatePreferences,
    refreshUserData,
    syncProfile,
    isNewUser
  } = useUserSync();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleInitializeUser = async () => {
    addResult('Starting user initialization...');
    const result = await initializeUser();
    addResult(`Initialize user: ${result.success ? 'Success' : `Failed - ${result.error}`}`);
  };

  const handleSyncUserData = async () => {
    addResult('Starting user data sync...');
    const result = await syncUserData();
    addResult(`Sync user data: ${result.success ? 'Success' : `Failed - ${result.error}`}`);
  };

  const handleMigrateTrialData = async () => {
    addResult('Starting trial data migration...');
    const result = await migrateTrialData();
    addResult(`Migrate trial data: ${result.success ? `Success - ${result.migratedCount} items` : `Failed - ${result.error}`}`);
  };

  const handleUpdatePreferences = async () => {
    addResult('Updating user preferences...');
    const testPreferences = {
      theme: 'dark' as const,
      language: 'zh',
      notifications: {
        emailNotifications: false,
        reportReady: true,
        weeklyDigest: true,
        securityAlerts: true,
      }
    };
    
    const result = await updatePreferences(testPreferences);
    addResult(`Update preferences: ${result.success ? 'Success' : `Failed - ${result.error}`}`);
  };

  const handleRefreshData = async () => {
    addResult('Refreshing user data...');
    await refreshUserData();
    addResult('User data refreshed');
  };

  const handleSyncProfile = async () => {
    addResult('Syncing user profile...');
    const result = await syncProfile();
    addResult(`Sync profile: ${result.success ? 'Success' : `Failed - ${result.error}`}`);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-500 mb-4">
              Please sign in to test user data synchronization features.
            </p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Data Sync Test Page
          </h1>
          <p className="text-gray-600">
            Test user data synchronization, initialization, and migration features
          </p>
        </div>

        {/* User Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Auth Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {session?.user ? 'Authenticated' : 'Anonymous'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sync Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isInitialized ? 'Synced' : 'Not Synced'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">User Type</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isNewUser() ? 'New' : 'Existing'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Migration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {migrationStatus?.completed ? 'Done' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Session Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session?.user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{session.user.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Provider:</span>
                      <Badge className="ml-2">{session.user.provider}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">ID:</span>
                      <span className="ml-2 font-mono text-xs">{session.user.id?.slice(-8)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No session data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                User Database Data
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              
              {userData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Plan:</span>
                      <Badge className="ml-2">{userData.plan.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Quota:</span>
                      <span className="ml-2">{userData.quota_used}/{userData.quota_limit}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Preferences:</span>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <pre>{JSON.stringify(userData.preferences, null, 2)}</pre>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>Created: {new Date(userData.created_at).toLocaleString()}</p>
                    <p>Updated: {new Date(userData.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No user data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Migration Status */}
        {migrationStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Migration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {migrationStatus.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span>
                  {migrationStatus.completed 
                    ? `Migration completed - ${migrationStatus.migratedCount} items migrated`
                    : 'Migration pending'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button onClick={handleInitializeUser} disabled={loading}>
                Initialize User
              </Button>
              <Button onClick={handleSyncUserData} disabled={loading}>
                Sync User Data
              </Button>
              <Button onClick={handleMigrateTrialData} disabled={loading}>
                Migrate Trial Data
              </Button>
              <Button onClick={handleUpdatePreferences} disabled={loading}>
                Update Preferences
              </Button>
              <Button onClick={handleRefreshData} disabled={loading}>
                Refresh Data
              </Button>
              <Button onClick={handleSyncProfile} disabled={loading}>
                Sync Profile
              </Button>
              <Button onClick={() => setShowWelcome(true)}>
                Show Welcome Flow
              </Button>
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

        {/* Welcome Flow */}
        {showWelcome && (
          <UserWelcomeFlow
            onComplete={() => {
              setShowWelcome(false);
              addResult('Welcome flow completed');
            }}
            onSkip={() => {
              setShowWelcome(false);
              addResult('Welcome flow skipped');
            }}
          />
        )}
      </div>
    </div>
  );
}