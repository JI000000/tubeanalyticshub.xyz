/**
 * 用户数据同步和初始化逻辑
 * 处理登录成功后的用户数据同步、初始化和迁移
 */

import { createSupabaseServiceClient } from '@/lib/supabase';
import type { Session } from 'next-auth';

// 用户数据接口
export interface UserData {
  id: string;
  nextauth_user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  auth_provider: string;
  plan: 'free' | 'pro' | 'enterprise';
  quota_used: number;
  quota_limit: number;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

// 用户偏好设置接口
export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
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
  dashboard: {
    defaultView: string;
    chartsPerPage: number;
    autoRefresh: boolean;
  };
}

// 默认用户偏好设置
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: 'en',
  theme: 'system',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  notifications: {
    emailNotifications: true,
    reportReady: true,
    weeklyDigest: false,
    securityAlerts: true,
  },
  privacy: {
    profileVisibility: 'private',
    shareAnalytics: false,
    dataRetention: 365,
  },
  dashboard: {
    defaultView: 'overview',
    chartsPerPage: 6,
    autoRefresh: true,
  },
};

/**
 * 初始化新用户数据
 */
export async function initializeNewUser(session: Session): Promise<{ success: boolean; error?: string; userData?: UserData }> {
  try {
    const supabase = createSupabaseServiceClient();
    
    if (!session.user?.id || !session.user?.email) {
      return { success: false, error: 'Invalid session data' };
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('yt_users')
      .select('*')
      .eq('nextauth_user_id', session.user.id)
      .single();

    if (existingUser) {
      // 用户已存在，更新信息
      return await updateExistingUser(session, existingUser);
    }

    // 获取用户的地理位置信息（用于时区设置）
    const userTimezone = await getUserTimezone();
    const userLanguage = await getUserLanguage(session);

    // 创建新用户记录
    const newUserData: Partial<UserData> = {
      nextauth_user_id: session.user.id,
      email: session.user.email,
      display_name: session.user.name || session.user.email.split('@')[0],
      avatar_url: session.user.image || undefined,
      auth_provider: session.user.provider || 'unknown',
      plan: 'free',
      quota_used: 0,
      quota_limit: 50, // 免费用户默认限额
      preferences: {
        ...DEFAULT_USER_PREFERENCES,
        language: userLanguage,
        timezone: userTimezone,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: userData, error } = await supabase
      .from('yt_users')
      .insert(newUserData)
      .select()
      .single();

    if (error) {
      console.error('Error creating new user:', error);
      return { success: false, error: error.message };
    }

    // 初始化用户相关数据
    await initializeUserRelatedData(userData.id);

    // 记录用户初始化事件
    await logUserEvent(userData.id, 'user_initialized', {
      provider: session.user.provider,
      isNewUser: true,
      timezone: userTimezone,
      language: userLanguage,
    });

    return { success: true, userData };
  } catch (error) {
    console.error('Error in initializeNewUser:', error);
    return { success: false, error: 'Failed to initialize user' };
  }
}

/**
 * 更新现有用户信息
 */
export async function updateExistingUser(session: Session, existingUser: any): Promise<{ success: boolean; error?: string; userData?: UserData }> {
  try {
    const supabase = createSupabaseServiceClient();

    // 更新用户信息
    const updateData = {
      display_name: session.user?.name || existingUser.display_name,
      avatar_url: session.user?.image || existingUser.avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { data: userData, error } = await supabase
      .from('yt_users')
      .update(updateData)
      .eq('nextauth_user_id', session.user!.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating existing user:', error);
      return { success: false, error: error.message };
    }

    // 记录用户登录事件
    await logUserEvent(userData.id, 'user_login', {
      provider: session.user?.provider,
      isNewUser: false,
    });

    return { success: true, userData };
  } catch (error) {
    console.error('Error in updateExistingUser:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

/**
 * 初始化用户相关数据（项目、收藏夹等）
 */
async function initializeUserRelatedData(userId: string): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();

    // 创建默认项目
    await supabase
      .from('yt_projects')
      .insert({
        user_id: userId,
        name: 'My First Project',
        description: 'Welcome to your first YouTube analysis project!',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // 创建默认收藏夹
    await supabase
      .from('yt_bookmarks')
      .insert({
        user_id: userId,
        name: 'Favorites',
        description: 'Your favorite videos and channels',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // 初始化用户统计数据
    await supabase
      .from('yt_user_stats')
      .insert({
        user_id: userId,
        total_analyses: 0,
        total_reports: 0,
        total_exports: 0,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

  } catch (error) {
    console.error('Error initializing user related data:', error);
  }
}

/**
 * 迁移匿名试用数据到认证用户
 */
export async function migrateAnonymousTrialData(userId: string, fingerprint: string): Promise<{ success: boolean; error?: string; migratedCount?: number }> {
  try {
    const supabase = createSupabaseServiceClient();

    // 查找匿名试用数据
    const { data: trialData, error: fetchError } = await supabase
      .from('yt_anonymous_trials')
      .select('*')
      .eq('fingerprint', fingerprint)
      .eq('migrated', false);

    if (fetchError) {
      console.error('Error fetching trial data:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!trialData || trialData.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    // 迁移试用数据到用户历史记录
    const migrationPromises = trialData.map(async (trial) => {
      // 创建用户活动记录
      await supabase
        .from('yt_user_activities')
        .insert({
          user_id: userId,
          activity_type: trial.action_type,
          activity_data: trial.metadata,
          created_at: trial.created_at,
        });

      // 标记试用数据为已迁移
      await supabase
        .from('yt_anonymous_trials')
        .update({
          migrated: true,
          migrated_to_user_id: userId,
          migrated_at: new Date().toISOString(),
        })
        .eq('id', trial.id);
    });

    await Promise.all(migrationPromises);

    // 记录迁移事件
    await logUserEvent(userId, 'trial_data_migrated', {
      fingerprint,
      migratedCount: trialData.length,
    });

    return { success: true, migratedCount: trialData.length };
  } catch (error) {
    console.error('Error in migrateAnonymousTrialData:', error);
    return { success: false, error: 'Failed to migrate trial data' };
  }
}

/**
 * 更新用户偏好设置
 */
export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseServiceClient();

    // 获取当前偏好设置
    const { data: currentUser } = await supabase
      .from('yt_users')
      .select('preferences')
      .eq('nextauth_user_id', userId)
      .single();

    const currentPreferences = currentUser?.preferences || DEFAULT_USER_PREFERENCES;
    const updatedPreferences = { ...currentPreferences, ...preferences };

    // 更新偏好设置
    const { error } = await supabase
      .from('yt_users')
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('nextauth_user_id', userId);

    if (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.message };
    }

    // 记录偏好设置更新事件
    await logUserEvent(userId, 'preferences_updated', {
      updatedFields: Object.keys(preferences),
    });

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

/**
 * 获取用户完整数据
 */
export async function getUserFullData(userId: string): Promise<{ success: boolean; error?: string; userData?: UserData }> {
  try {
    const supabase = createSupabaseServiceClient();

    const { data: userData, error } = await supabase
      .from('yt_users')
      .select('*')
      .eq('nextauth_user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return { success: false, error: error.message };
    }

    return { success: true, userData };
  } catch (error) {
    console.error('Error in getUserFullData:', error);
    return { success: false, error: 'Failed to fetch user data' };
  }
}

/**
 * 记录用户事件
 */
async function logUserEvent(userId: string, eventType: string, metadata?: any): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();

    await supabase
      .from('yt_user_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error logging user event:', error);
  }
}

/**
 * 检查用户是否为新用户（24小时内注册）
 */
export async function isNewUser(userId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseServiceClient();

    const { data: userData } = await supabase
      .from('yt_users')
      .select('created_at')
      .eq('nextauth_user_id', userId)
      .single();

    if (!userData?.created_at) return false;

    const createdAt = new Date(userData.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    return hoursDiff <= 24;
  } catch (error) {
    console.error('Error checking if user is new:', error);
    return false;
  }
}

/**
 * 获取用户统计数据
 */
export async function getUserStats(userId: string): Promise<{ success: boolean; error?: string; stats?: any }> {
  try {
    const supabase = createSupabaseServiceClient();

    const { data: stats, error } = await supabase
      .from('yt_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true, stats };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { success: false, error: 'Failed to fetch user stats' };
  }
}

/**
 * 更新用户活动时间
 */
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();

    await supabase
      .from('yt_users')
      .update({
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('nextauth_user_id', userId);
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
}

/**
 * 获取用户时区
 */
async function getUserTimezone(): Promise<string> {
  try {
    // 尝试从浏览器获取时区
    if (typeof window !== 'undefined' && Intl?.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return 'UTC';
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'UTC';
  }
}

/**
 * 获取用户语言偏好
 */
async function getUserLanguage(session: Session): Promise<string> {
  try {
    // 从GitHub或Google profile获取语言信息
    if (session.user?.provider === 'github') {
      // GitHub API可能包含用户的语言偏好
      return 'en'; // 默认英语，可以通过GitHub API获取更准确的信息
    } else if (session.user?.provider === 'google') {
      // Google profile可能包含语言信息
      return 'en'; // 默认英语，可以通过Google API获取更准确的信息
    }
    
    // 尝试从浏览器获取语言
    if (typeof window !== 'undefined' && navigator?.language) {
      return navigator.language.split('-')[0]; // 获取主要语言代码
    }
    
    return 'en';
  } catch (error) {
    console.error('Error getting user language:', error);
    return 'en';
  }
}

/**
 * 同步用户头像和显示名称
 */
export async function syncUserProfile(userId: string, profileData: { name?: string; image?: string; email?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseServiceClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (profileData.name) {
      updateData.display_name = profileData.name;
    }

    if (profileData.image) {
      updateData.avatar_url = profileData.image;
    }

    if (profileData.email) {
      updateData.email = profileData.email;
    }

    const { error } = await supabase
      .from('yt_users')
      .update(updateData)
      .eq('nextauth_user_id', userId);

    if (error) {
      console.error('Error syncing user profile:', error);
      return { success: false, error: error.message };
    }

    // 记录用户资料更新事件
    await logUserEvent(userId, 'profile_updated', {
      updatedFields: Object.keys(updateData).filter(key => key !== 'updated_at'),
    });

    return { success: true };
  } catch (error) {
    console.error('Error in syncUserProfile:', error);
    return { success: false, error: 'Failed to sync user profile' };
  }
}

/**
 * 批量同步用户数据（用于登录后的完整同步）
 */
export async function performFullUserSync(session: Session, fingerprint?: string): Promise<{ success: boolean; error?: string; userData?: UserData; migration?: any }> {
  try {
    // 1. 初始化或更新用户数据
    const initResult = await initializeNewUser(session);
    if (!initResult.success) {
      return initResult;
    }

    // 2. 同步用户资料信息
    await syncUserProfile(session.user!.id, {
      name: session.user?.name || undefined,
      image: session.user?.image || undefined,
      email: session.user?.email || undefined,
    });

    // 3. 如果提供了指纹，迁移匿名试用数据
    let migrationResult = null;
    if (fingerprint && initResult.userData) {
      migrationResult = await migrateAnonymousTrialData(
        initResult.userData.id,
        fingerprint
      );
    }

    // 4. 更新用户活动时间
    await updateUserActivity(session.user!.id);

    return {
      success: true,
      userData: initResult.userData,
      migration: migrationResult,
    };
  } catch (error) {
    console.error('Error in performFullUserSync:', error);
    return { success: false, error: 'Failed to perform full user sync' };
  }
}