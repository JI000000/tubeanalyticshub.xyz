/**
 * 用户欢迎流程组件
 * 处理新用户登录后的欢迎引导和数据初始化
 * 
 * 功能包括：
 * - 首次登录用户的欢迎引导界面
 * - 用户偏好设置的快速配置流程
 * - 登录成功后的权益说明展示
 * - 返回之前操作的无缝衔接
 * - 新用户的功能介绍引导
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useUserSync } from '@/hooks/useUserSync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  User, 
  Settings, 
  Zap, 
  Gift, 
  ArrowRight,
  Sparkles,
  Database,
  Shield,
  Globe,
  Moon,
  Sun,
  Monitor,
  Bell,
  Eye,
  Calendar,
  BarChart3,
  Download,
  Users,
  BookOpen,
  Star,
  Clock,
  Palette,
  Languages
} from 'lucide-react';
import type { UserPreferences } from '@/lib/user-sync';

interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  optional?: boolean;
}

interface UserWelcomeFlowProps {
  onComplete?: (returnToAction?: string) => void;
  onSkip?: () => void;
  previousAction?: string;
  returnUrl?: string;
  context?: any;
}

export function UserWelcomeFlow({ 
  onComplete, 
  onSkip, 
  previousAction,
  returnUrl,
  context 
}: UserWelcomeFlowProps) {
  const { data: session } = useSession();
  const { 
    userData, 
    loading, 
    isNewUser, 
    migrationStatus,
    initializeUser,
    migrateTrialData,
    updatePreferences
  } = useUserSync();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userPreferences, setUserPreferences] = useState<Partial<UserPreferences>>({});
  const [skipPreferences, setSkipPreferences] = useState(false);

  // 检查是否应该显示欢迎流程
  useEffect(() => {
    if (session?.user && userData && isNewUser()) {
      setShowWelcome(true);
      // 初始化用户偏好设置为当前值
      if (userData.preferences) {
        setUserPreferences(userData.preferences);
      }
    }
  }, [session, userData, isNewUser]);

  // 欢迎步骤定义
  const welcomeSteps: WelcomeStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to YouTube Analytics!',
      description: 'Get ready to unlock powerful insights from YouTube data',
      icon: Sparkles,
      completed: true,
    },
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Your profile has been created with your social account',
      icon: User,
      completed: !!userData,
    },
    {
      id: 'migration',
      title: 'Data Migration',
      description: 'Migrating your trial data to your account',
      icon: Database,
      completed: migrationStatus?.completed || false,
    },
    {
      id: 'preferences',
      title: 'Quick Setup',
      description: 'Customize your experience with quick preferences',
      icon: Settings,
      completed: false,
      optional: true,
    },
    {
      id: 'benefits',
      title: 'Your Benefits',
      description: 'Discover what you can do with your account',
      icon: Gift,
      completed: false,
    },
    {
      id: 'features',
      title: 'Feature Tour',
      description: 'Learn about key features to get started',
      icon: BookOpen,
      completed: false,
      optional: true,
    },
  ];

  const handleInitialization = async () => {
    setIsInitializing(true);
    
    try {
      // 执行完整的用户数据同步（包括初始化和迁移）
      const result = await initializeUser();
      
      if (result.success) {
        setCurrentStep(prev => Math.min(prev + 1, welcomeSteps.length - 1));
      } else {
        console.error('Initialization failed:', result.error);
        // 即使失败也继续流程，但显示错误状态
        setCurrentStep(prev => Math.min(prev + 1, welcomeSteps.length - 1));
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      // 继续流程但记录错误
      setCurrentStep(prev => Math.min(prev + 1, welcomeSteps.length - 1));
    } finally {
      setIsInitializing(false);
    }
  };

  const handleComplete = useCallback(async () => {
    // 保存用户偏好设置（如果有更改）
    if (Object.keys(userPreferences).length > 0 && !skipPreferences) {
      try {
        await updatePreferences(userPreferences);
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
    
    setShowWelcome(false);
    onComplete?.(previousAction);
  }, [userPreferences, skipPreferences, updatePreferences, onComplete, previousAction]);

  const handleNext = useCallback(() => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, welcomeSteps.length, handleComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkipStep = useCallback(() => {
    if (currentStep === 3) { // preferences step
      setSkipPreferences(true);
    }
    handleNext();
  }, [currentStep, handleNext]);

  const updatePreference = useCallback((key: string, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSkip = useCallback(() => {
    setShowWelcome(false);
    onSkip?.();
  }, [onSkip]);

  if (!showWelcome || !session?.user) {
    return null;
  }

  const currentWelcomeStep = welcomeSteps[currentStep];
  const progress = ((currentStep + 1) / welcomeSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <currentWelcomeStep.icon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">{currentWelcomeStep.title}</CardTitle>
          <p className="text-gray-600 mt-2">{currentWelcomeStep.description}</p>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep + 1} of {welcomeSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step Content */}
          {currentStep === 0 && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">Welcome</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {session.user.name || session.user.email}
                </Badge>
              </div>
              <p className="text-gray-600">
                You&apos;ve successfully signed in with {session.user.provider}. 
                Let&apos;s set up your account and get you started with powerful YouTube analytics.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="p-2 bg-green-100 rounded-lg inline-block mb-2">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">Unlimited Analysis</p>
                </div>
                <div className="text-center">
                  <div className="p-2 bg-purple-100 rounded-lg inline-block mb-2">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium">Secure Data</p>
                </div>
                <div className="text-center">
                  <div className="p-2 bg-orange-100 rounded-lg inline-block mb-2">
                    <Settings className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">Custom Reports</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-medium">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{session.user.name || 'User'}</h3>
                <p className="text-sm text-gray-500">{session.user.email}</p>
                <Badge className="mt-2">
                  {userData?.plan?.toUpperCase() || 'FREE'} Plan
                </Badge>
              </div>
              <p className="text-gray-600">
                Your profile has been set up with your {session.user.provider} account. 
                You can update your preferences anytime in settings.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
              </div>
              {migrationStatus?.completed ? (
                <div>
                  <h3 className="font-medium text-green-900">Migration Complete!</h3>
                  <p className="text-sm text-green-700">
                    Successfully migrated {migrationStatus.migratedCount} trial activities to your account.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900">Checking for Trial Data</h3>
                  <p className="text-sm text-gray-600">
                    Looking for any previous trial activities to migrate to your account...
                  </p>
                </div>
              )}
              {isInitializing && (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Quick Setup</h3>
                <p className="text-sm text-gray-600">
                  Customize your experience with these quick preferences
                </p>
              </div>
              
              <div className="space-y-4">
                {/* Language Preference */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Languages className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Language</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { code: 'en', name: 'English' },
                      { code: 'zh', name: '中文' },
                      { code: 'es', name: 'Español' },
                      { code: 'fr', name: 'Français' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => updatePreference('language', lang.code)}
                        className={`p-2 text-sm rounded border transition-colors ${
                          (userPreferences.language || 'en') === lang.code
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Preference */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Theme</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', name: 'Light', icon: Sun },
                      { value: 'dark', name: 'Dark', icon: Moon },
                      { value: 'system', name: 'System', icon: Monitor }
                    ].map((theme) => {
                      const IconComponent = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => updatePreference('theme', theme.value)}
                          className={`p-3 text-sm rounded border transition-colors flex flex-col items-center gap-1 ${
                            (userPreferences.theme || 'system') === theme.value
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                          {theme.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Notifications</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'emailNotifications', label: 'Email notifications' },
                      { key: 'reportReady', label: 'Report completion alerts' },
                      { key: 'weeklyDigest', label: 'Weekly digest' }
                    ].map((notif) => (
                      <label key={notif.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userPreferences.notifications?.[notif.key as keyof typeof userPreferences.notifications] ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...userPreferences.notifications,
                            [notif.key]: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{notif.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="p-3 bg-yellow-100 rounded-full inline-block mb-4">
                  <Gift className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Your Account Benefits</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Here&apos;s what you can now do with your account
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Unlimited Analysis</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Analyze unlimited YouTube videos and channels without restrictions
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Save & Export</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Save reports and export data in multiple formats (PDF, CSV, JSON)
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">History & Bookmarks</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Access your complete analysis history and bookmarked content
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Team Collaboration</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Share insights and collaborate with team members
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Advanced Analytics</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Access advanced metrics and deep insights
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">API Access</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Integrate with your tools using our API
                  </p>
                </div>
              </div>

              {previousAction && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Ready to Continue</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    You can now continue with your previous action: {previousAction}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full inline-block mb-4">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Feature Tour</h3>
                <p className="text-sm text-gray-600">
                  Quick overview of key features to get you started
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Video Analysis</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Paste any YouTube video URL to get detailed analytics including views, engagement, and performance metrics.
                      </p>
                      <Badge className="bg-red-100 text-red-800">Core Feature</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Download className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Export Reports</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Save your analysis results and export them in various formats for presentations or further analysis.
                      </p>
                      <Badge className="bg-green-100 text-green-800">Premium</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">History & Tracking</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Keep track of all your analyses and revisit previous reports anytime.
                      </p>
                      <Badge className="bg-blue-100 text-blue-800">Account Feature</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Team Collaboration</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Share reports with team members and collaborate on YouTube strategy.
                      </p>
                      <Badge className="bg-orange-100 text-orange-800">Team Feature</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-gray-900">Pro Tip</span>
                </div>
                <p className="text-sm text-gray-700">
                  Start by analyzing a video you&apos;re curious about. You can always bookmark interesting results and export detailed reports later!
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handlePrevious}>
                  Back
                </Button>
              )}
              
              {currentStep === 0 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip Setup
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {/* Skip current step for optional steps */}
              {welcomeSteps[currentStep]?.optional && (
                <Button variant="ghost" onClick={handleSkipStep}>
                  Skip
                </Button>
              )}

              {/* Initialize account button */}
              {currentStep === 1 && !userData && (
                <Button 
                  onClick={handleInitialization} 
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Initializing...
                    </>
                  ) : (
                    'Initialize Account'
                  )}
                </Button>
              )}
              
              {/* Next/Complete button */}
              {(currentStep !== 1 || userData) && (
                <Button onClick={handleNext}>
                  {currentStep === welcomeSteps.length - 1 ? (
                    previousAction ? (
                      <>
                        Continue with {previousAction}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      'Get Started'
                    )
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}