'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Key, 
  Download, 
  Trash2,
  Save,
  Eye,
  EyeOff,
  Crown,
  RefreshCw
} from 'lucide-react';

interface UserSettings {
  profile: {
    displayName: string;
    email: string;
    avatar?: string;
    plan: string;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    timezone: string;
    dateFormat: string;
  };
  notifications: {
    emailNotifications: boolean;
    reportReady: boolean;
    weeklyDigest: boolean;
    securityAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    shareAnalytics: boolean;
    dataRetention: number;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    activeSessions: number;
  };
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { requireAuth } = useSmartAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);

  // 处理查看个人设置
  const handleViewSettings = async () => {
    const canProceed = await requireAuth('user_settings', {
      message: '查看个人设置需要登录',
      urgency: 'medium',
      metadata: { type: 'view_settings' }
    });
    
    if (canProceed) {
      await fetchSettings();
    }
  };

  // 处理保存设置
  const handleSaveSettings = async () => {
    const canProceed = await requireAuth('user_settings', {
      message: '保存设置需要登录',
      urgency: 'high',
      metadata: { type: 'save_settings' }
    });
    
    if (canProceed) {
      await saveSettings();
    }
  };

  // 处理API密钥管理
  const handleApiKeyAccess = async () => {
    const canProceed = await requireAuth('api_access', {
      message: 'API密钥管理需要登录，确保账户安全',
      urgency: 'high',
      metadata: { type: 'api_key_management' }
    });
    
    if (canProceed) {
      console.log('显示API密钥管理');
    }
  };

  // 处理数据导出
  const handleExportData = async () => {
    const canProceed = await requireAuth('export_data', {
      message: '导出个人数据需要登录，确保数据安全',
      urgency: 'high',
      metadata: { type: 'personal_data_export' }
    });
    
    if (canProceed) {
      console.log('导出个人数据');
    }
  };

  // 处理账户删除
  const handleDeleteAccount = async () => {
    const canProceed = await requireAuth('account_management', {
      message: '账户管理需要登录验证',
      urgency: 'high',
      metadata: { type: 'delete_account' }
    });
    
    if (canProceed) {
      if (confirm('确定要删除账户吗？此操作不可撤销。')) {
        console.log('删除账户');
      }
    }
  };

  const fetchSettings = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      // Mock settings data
      const mockSettings: UserSettings = {
        profile: {
          displayName: user?.name || 'User',
          email: user?.email || 'user@example.com',
          avatar: user?.image || undefined,
          plan: user?.plan || 'free'
        },
        preferences: {
          language: 'en',
          theme: 'system',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY'
        },
        notifications: {
          emailNotifications: true,
          reportReady: true,
          weeklyDigest: false,
          securityAlerts: true
        },
        privacy: {
          profileVisibility: 'private',
          shareAnalytics: false,
          dataRetention: 365
        },
        security: {
          twoFactorEnabled: false,
          lastPasswordChange: '2024-01-01',
          activeSessions: 2
        }
      };
      
      setSettings(mockSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // Mock save operation
      console.log('Saving settings:', settings);
      // Here you would make an API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchSettings();
      } else {
        handleViewSettings();
      }
    }
  }, [authLoading, isAuthenticated]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Key },
  ];

  if (loading || !settings) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Settings
                <FeatureAccessIndicator featureId="user_settings" size="sm" />
              </h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Settings
              <FeatureAccessIndicator featureId="user_settings" size="sm" />
            </h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
          <LoginRequiredButton
            featureId="user_settings"
            onClick={handleSaveSettings}
            disabled={saving}
            data-feature="save-settings"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </LoginRequiredButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-medium">
                        {settings.profile.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{settings.profile.displayName}</h3>
                      <p className="text-sm text-gray-500">{settings.profile.email}</p>
                      <Badge className="mt-1">
                        <Crown className="h-3 w-3 mr-1" />
                        {settings.profile.plan.toUpperCase()} Plan
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <Input
                        value={settings.profile.displayName}
                        onChange={(e) => updateSettings('profile', 'displayName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        value={settings.profile.email}
                        onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                        type="email"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) => updateSettings('preferences', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={settings.preferences.theme}
                        onChange={(e) => updateSettings('preferences', 'theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.preferences.timezone}
                        onChange={(e) => updateSettings('preferences', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Asia/Shanghai">China Standard Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        value={settings.preferences.dateFormat}
                        onChange={(e) => updateSettings('preferences', 'dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Report Ready</h4>
                        <p className="text-sm text-gray-500">Notify when analysis reports are ready</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.reportReady}
                        onChange={(e) => updateSettings('notifications', 'reportReady', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Weekly Digest</h4>
                        <p className="text-sm text-gray-500">Weekly summary of your analytics</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.weeklyDigest}
                        onChange={(e) => updateSettings('notifications', 'weeklyDigest', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Security Alerts</h4>
                        <p className="text-sm text-gray-500">Important security notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.securityAlerts}
                        onChange={(e) => updateSettings('notifications', 'securityAlerts', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                        <p className="text-sm text-gray-500">Control who can see your profile</p>
                      </div>
                      <select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => updateSettings('privacy', 'profileVisibility', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Share Analytics</h4>
                        <p className="text-sm text-gray-500">Allow sharing of anonymized analytics data</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.privacy.shareAnalytics}
                        onChange={(e) => updateSettings('privacy', 'shareAnalytics', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Retention (days)
                      </label>
                      <Input
                        type="number"
                        value={settings.privacy.dataRetention}
                        onChange={(e) => updateSettings('privacy', 'dataRetention', parseInt(e.target.value))}
                        min="30"
                        max="3650"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How long to keep your analysis data (30-3650 days)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorEnabled}
                        onChange={(e) => updateSettings('security', 'twoFactorEnabled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">API Access</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        Manage your API keys for programmatic access
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value="sk-1234567890abcdef"
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <LoginRequiredButton
                          featureId="api_access"
                          variant="outline"
                          size="sm"
                          onClick={handleApiKeyAccess}
                          data-feature="manage-api-key"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Manage
                        </LoginRequiredButton>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Account Security</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>Last password change: {settings.security.lastPasswordChange}</p>
                        <p>Active sessions: {settings.security.activeSessions}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-red-900">Export Account Data</h4>
                <p className="text-sm text-red-700">Download all your account data</p>
              </div>
              <LoginRequiredButton
                featureId="export_data"
                variant="outline"
                onClick={handleExportData}
                data-feature="export-account-data"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </LoginRequiredButton>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700">Permanently delete your account and all data</p>
              </div>
              <LoginRequiredButton
                featureId="account_management"
                variant="outline"
                onClick={handleDeleteAccount}
                className="border-red-300 text-red-700 hover:bg-red-50"
                data-feature="delete-account"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </LoginRequiredButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}