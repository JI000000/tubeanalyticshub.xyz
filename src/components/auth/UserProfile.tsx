'use client';

import { useState } from 'react';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { useLogout } from '@/hooks/useLogout';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, ChevronDown, Crown } from 'lucide-react';
import { LogoutConfirmationDialog, useLogoutConfirmation } from './LogoutConfirmationDialog';

interface UserProfileProps {
  variant?: 'full' | 'compact' | 'dropdown';
  showQuota?: boolean;
  showPlan?: boolean;
  className?: string;
}

export function UserProfile({ 
  variant = 'compact', 
  showQuota = true, 
  showPlan = true,
  className = '' 
}: UserProfileProps) {
  const { user, isAuthenticated, loading } = useSmartAuth();
  const { t } = useTranslation();
  
  // 使用新的登出Hook
  const {
    isLoggingOut,
    logoutWithConfirmation,
    preLogoutCheck,
    getConfirmationMessage,
  } = useLogout({
    defaultRedirectUrl: '/',
    autoConfirm: false, // 我们使用自定义确认对话框
    checkUnsavedData: true,
    onLogoutSuccess: (result) => {
      console.log('Logout successful:', result);
    },
    onLogoutError: (error) => {
      console.error('Logout failed:', error);
    },
  });

  // 登出确认对话框Hook
  const {
    isOpen: isConfirmationOpen,
    dialogProps,
    showLogoutConfirmation,
    hideLogoutConfirmation,
    confirmLogout,
  } = useLogoutConfirmation();

  const handleLogout = async () => {
    try {
      // 执行预检查
      const checkResult = await preLogoutCheck();
      
      // 显示确认对话框
      showLogoutConfirmation({
        user: {
          name: user?.name,
          email: user?.email || '',
          image: user?.image,
        },
        warnings: checkResult.warnings,
        hasUnsavedData: checkResult.hasUnsavedData,
        isInProgress: checkResult.isInProgress,
        customMessage: getConfirmationMessage(
          checkResult.hasUnsavedData,
          checkResult.isInProgress
        ),
        reason: 'user_initiated',
        onConfirm: async () => {
          await confirmLogout(async () => {
            await logoutWithConfirmation({
              reason: 'user_initiated',
              metadata: {
                source: 'user_profile',
                variant,
              },
            });
          });
        },
      });
    } catch (error) {
      console.error('Logout preparation failed:', error);
      // 降级到简单确认
      if (window.confirm(t('auth.confirmSignOut') || 'Are you sure you want to sign out?')) {
        await logoutWithConfirmation();
      }
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="space-y-1">
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
            <div className="w-16 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const userAvatar = (
    <div className="flex-shrink-0">
      {user.image ? (
        <img 
          src={user.image} 
          alt={user.name || user.email} 
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      )}
    </div>
  );

  const userInfo = (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-900 truncate">
        {user.name || user.email}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {showPlan && (
          <Badge 
            variant={user.plan === 'premium' ? 'default' : 'secondary'} 
            className="text-xs capitalize"
          >
            {user.plan === 'premium' && <Crown className="w-3 h-3 mr-1" />}
            {user.plan || 'Free'}
          </Badge>
        )}
        {showQuota && (
          <span className="text-xs text-gray-500">
            {user.quota_used || 0}/{user.quota_limit || 50}
          </span>
        )}
      </div>
    </div>
  );

  if (variant === 'full') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('profile.title') || 'Profile'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || user.email} 
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.name || 'User'}
              </h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={user.plan === 'premium' ? 'default' : 'secondary'} 
                  className="capitalize"
                >
                  {user.plan === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                  {user.plan || 'Free'} Plan
                </Badge>
                {user.provider && (
                  <Badge variant="outline" className="text-xs">
                    via {user.provider}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {showQuota && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('profile.quotaUsage') || 'Quota Usage'}
                </span>
                <span className="font-medium">
                  {user.quota_used || 0} / {user.quota_limit || 50}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((user.quota_used || 0) / (user.quota_limit || 50)) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              {t('profile.settings') || 'Settings'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? t('auth.signingOut') || 'Signing out...' : t('auth.signOut') || 'Sign Out'}
            </Button>
          </div>
        </CardContent>
        
        {/* 登出确认对话框 */}
        <LogoutConfirmationDialog
          open={isConfirmationOpen}
          onClose={hideLogoutConfirmation}
          onConfirm={dialogProps.onConfirm || (() => {})}
          isLoggingOut={isLoggingOut}
          {...dialogProps}
        />
      </Card>
    );
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`flex items-center space-x-2 ${className}`}>
            {userAvatar}
            <span className="hidden md:block text-sm font-medium">
              {user.name || user.email}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{user.name || user.email}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {user.plan || 'Free'}
              </Badge>
              {showQuota && (
                <span className="text-xs text-gray-500">
                  {user.quota_used || 0}/{user.quota_limit || 50}
                </span>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings className="w-4 h-4 mr-2" />
            {t('profile.settings') || 'Settings'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? t('auth.signingOut') || 'Signing out...' : t('auth.signOut') || 'Sign Out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
        
        {/* 登出确认对话框 */}
        <LogoutConfirmationDialog
          open={isConfirmationOpen}
          onClose={hideLogoutConfirmation}
          onConfirm={dialogProps.onConfirm || (() => {})}
          isLoggingOut={isLoggingOut}
          {...dialogProps}
        />
      </DropdownMenu>
    );
  }

  // Compact variant (default)
  return (
    <>
      <div className={`flex items-center space-x-3 ${className}`}>
        {userAvatar}
        {userInfo}
      </div>
      
      {/* 登出确认对话框 */}
      <LogoutConfirmationDialog
        open={isConfirmationOpen}
        onClose={hideLogoutConfirmation}
        onConfirm={dialogProps.onConfirm || (() => {})}
        isLoggingOut={isLoggingOut}
        {...dialogProps}
      />
    </>
  );
}