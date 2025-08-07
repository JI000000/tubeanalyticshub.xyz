/**
 * 用户数据同步Hook
 * 处理登录后的用户数据同步、初始化和状态管理
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useFingerprint } from '@/hooks/useFingerprint';
import type { UserData, UserPreferences } from '@/lib/user-sync';

interface UserSyncState {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  migrationStatus: {
    completed: boolean;
    migratedCount: number;
  } | null;
}

interface UserSyncHook extends UserSyncState {
  // 数据同步方法
  initializeUser: () => Promise<{ success: boolean; error?: string }>;
  syncUserData: () => Promise<{ success: boolean; error?: string }>;
  migrateTrialData: () => Promise<{ success: boolean; error?: string; migratedCount?: number }>;
  
  // 偏好设置管理
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  
  // 用户活动跟踪
  updateActivity: () => Promise<void>;
  
  // 工具方法
  refreshUserData: () => Promise<void>;
  syncProfile: () => Promise<{ success: boolean; error?: string }>;
  isNewUser: () => boolean;
}

/**
 * 用户数据同步Hook
 */
export function useUserSync(): UserSyncHook {
  const { data: session, status } = useSession();
  const { fingerprint } = useFingerprint();
  
  const [state, setState] = useState<UserSyncState>({
    userData: null,
    loading: false,
    error: null,
    isInitialized: false,
    migrationStatus: null,
  });

  /**
   * 初始化用户数据
   */
  const initializeUser = useCallback(async () => {
    if (!session?.user?.id) {
      return { success: false, error: 'No authenticated session' };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'full_sync',
          fingerprint,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          userData: result.userData,
          isInitialized: true,
          migrationStatus: result.migration || null,
          loading: false,
        }));
        
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          error: result.error,
          loading: false,
        }));
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Failed to initialize user data';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [session?.user?.id, fingerprint]);

  /**
   * 同步用户数据
   */
  const syncUserData = useCallback(async () => {
    if (!session?.user?.id) {
      return { success: false, error: 'No authenticated session' };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/user/sync');
      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          userData: result.userData,
          isInitialized: true,
          loading: false,
        }));
        
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          error: result.error,
          loading: false,
        }));
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Failed to sync user data';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [session?.user?.id]);

  /**
   * 迁移匿名试用数据
   */
  const migrateTrialData = useCallback(async () => {
    if (!session?.user?.id || !fingerprint) {
      return { success: false, error: 'Missing session or fingerprint' };
    }

    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'migrate_trial_data',
          fingerprint,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          migrationStatus: {
            completed: true,
            migratedCount: result.migratedCount || 0,
          },
        }));
        
        return { 
          success: true, 
          migratedCount: result.migratedCount 
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to migrate trial data' };
    }
  }, [session?.user?.id, fingerprint]);

  /**
   * 更新用户偏好设置
   */
  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!session?.user?.id) {
      return { success: false, error: 'No authenticated session' };
    }

    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_preferences',
          preferences,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 刷新用户数据以获取更新后的偏好设置
        await syncUserData();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update preferences' };
    }
  }, [session?.user?.id, syncUserData]);

  /**
   * 更新用户活动时间
   */
  const updateActivity = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_activity',
        }),
      });
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  }, [session?.user?.id]);

  /**
   * 刷新用户数据
   */
  const refreshUserData = useCallback(async () => {
    await syncUserData();
  }, [syncUserData]);

  /**
   * 同步用户资料
   */
  const syncProfile = useCallback(async () => {
    if (!session?.user?.id) {
      return { success: false, error: 'No authenticated session' };
    }

    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_profile',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 刷新用户数据以获取更新后的信息
        await syncUserData();
      }
      
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to sync profile' };
    }
  }, [session?.user?.id, syncUserData]);

  /**
   * 检查是否为新用户
   */
  const isNewUser = useCallback(() => {
    if (!state.userData?.created_at) return false;
    
    const createdAt = new Date(state.userData.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= 24;
  }, [state.userData?.created_at]);

  // 当用户登录状态改变时自动同步数据
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !state.isInitialized) {
      syncUserData();
    }
  }, [status, session?.user?.id, state.isInitialized, syncUserData]);

  // 定期更新用户活动时间（每5分钟）
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000); // 5分钟

    return () => clearInterval(interval);
  }, [session?.user?.id, updateActivity]);

  return {
    ...state,
    initializeUser,
    syncUserData,
    migrateTrialData,
    updatePreferences,
    updateActivity,
    refreshUserData,
    syncProfile,
    isNewUser,
  };
}