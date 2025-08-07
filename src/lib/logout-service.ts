/**
 * 登出服务
 * 处理用户登出时的状态清理、分析数据上报和重定向逻辑
 */

import { signOut } from 'next-auth/react';
import { LoginAnalyticsService } from './login-analytics';
import type { Session } from 'next-auth';

// 登出选项接口
export interface LogoutOptions {
  /** 登出后重定向URL */
  callbackUrl?: string;
  /** 是否显示确认对话框 */
  showConfirmation?: boolean;
  /** 确认对话框消息 */
  confirmationMessage?: string;
  /** 登出原因 */
  reason?: 'user_initiated' | 'session_expired' | 'security' | 'admin_action';
  /** 是否清理本地存储 */
  clearLocalStorage?: boolean;
  /** 是否清理会话存储 */
  clearSessionStorage?: boolean;
  /** 额外的元数据 */
  metadata?: any;
}

// 登出结果接口
export interface LogoutResult {
  success: boolean;
  error?: string;
  redirected: boolean;
  analyticsRecorded: boolean;
}

// 本地存储清理配置
const LOCAL_STORAGE_KEYS_TO_CLEAR = [
  'trial_status',
  'fingerprint_cache',
  'user_preferences',
  'temp_data',
  'draft_reports',
  'unsaved_analysis',
];

// 会话存储清理配置
const SESSION_STORAGE_KEYS_TO_CLEAR = [
  'current_analysis',
  'temp_session_data',
  'modal_state',
  'form_data',
];

/**
 * 登出服务类
 */
export class LogoutService {
  /**
   * 执行用户登出
   */
  static async logout(
    user: Session['user'] | null,
    options: LogoutOptions = {}
  ): Promise<LogoutResult> {
    const {
      callbackUrl = '/',
      showConfirmation = true,
      confirmationMessage = '确定要退出登录吗？',
      reason = 'user_initiated',
      clearLocalStorage = true,
      clearSessionStorage = true,
      metadata = {},
    } = options;

    try {
      // 1. 显示确认对话框（如果需要）
      if (showConfirmation && !this.showLogoutConfirmation(confirmationMessage)) {
        return {
          success: false,
          error: 'User cancelled logout',
          redirected: false,
          analyticsRecorded: false,
        };
      }

      // 2. 调用服务端登出API记录分析数据
      let analyticsRecorded = false;
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason,
            metadata,
            fingerprint: await this.getFingerprint(),
          }),
        });

        if (response.ok) {
          analyticsRecorded = true;
        } else {
          console.warn('Server logout API failed:', await response.text());
        }
      } catch (error) {
        console.warn('Failed to call logout API:', error);
        // 降级到客户端分析记录
        try {
          await this.recordLogoutAnalytics(user, reason, metadata);
          analyticsRecorded = true;
        } catch (fallbackError) {
          console.warn('Failed to record logout analytics:', fallbackError);
        }
      }

      // 3. 清理本地状态
      if (clearLocalStorage) {
        this.clearLocalStorage();
      }

      if (clearSessionStorage) {
        this.clearSessionStorage();
      }

      // 4. 清理其他应用状态
      this.clearApplicationState();

      // 5. 执行NextAuth登出
      await signOut({
        callbackUrl,
        redirect: true,
      });

      return {
        success: true,
        redirected: true,
        analyticsRecorded,
      };
    } catch (error) {
      console.error('Logout failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        redirected: false,
        analyticsRecorded: false,
      };
    }
  }

  /**
   * 静默登出（不显示确认对话框）
   */
  static async silentLogout(
    user: Session['user'] | null,
    reason: LogoutOptions['reason'] = 'session_expired',
    callbackUrl: string = '/'
  ): Promise<LogoutResult> {
    return this.logout(user, {
      callbackUrl,
      showConfirmation: false,
      reason,
      clearLocalStorage: true,
      clearSessionStorage: true,
    });
  }

  /**
   * 显示登出确认对话框
   */
  private static showLogoutConfirmation(message: string): boolean {
    if (typeof window === 'undefined') return true;
    return window.confirm(message);
  }

  /**
   * 记录登出分析数据
   */
  private static async recordLogoutAnalytics(
    user: Session['user'] | null,
    reason: string,
    metadata: any
  ): Promise<void> {
    try {
      await LoginAnalyticsService.recordEvent('signout', {
        user_id: user?.id,
        context: {
          reason,
          logout_time: new Date().toISOString(),
          session_duration: this.calculateSessionDuration(),
          page_url: typeof window !== 'undefined' ? window.location.href : undefined,
          ...metadata,
        },
      });
    } catch (error) {
      console.error('Failed to record logout analytics:', error);
      throw error;
    }
  }

  /**
   * 计算会话持续时间
   */
  private static calculateSessionDuration(): number {
    try {
      const loginTime = localStorage.getItem('login_timestamp');
      if (loginTime) {
        const loginTimestamp = parseInt(loginTime, 10);
        const currentTime = Date.now();
        return Math.floor((currentTime - loginTimestamp) / 1000); // 返回秒数
      }
    } catch (error) {
      console.warn('Failed to calculate session duration:', error);
    }
    return 0;
  }

  /**
   * 清理本地存储
   */
  private static clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // 清理指定的键
      LOCAL_STORAGE_KEYS_TO_CLEAR.forEach(key => {
        localStorage.removeItem(key);
      });

      // 清理以特定前缀开头的键
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('auth_') ||
          key.startsWith('user_') ||
          key.startsWith('session_') ||
          key.startsWith('temp_')
        )) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('Local storage cleared successfully');
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }

  /**
   * 清理会话存储
   */
  private static clearSessionStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // 清理指定的键
      SESSION_STORAGE_KEYS_TO_CLEAR.forEach(key => {
        sessionStorage.removeItem(key);
      });

      // 清理以特定前缀开头的键
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.startsWith('auth_') ||
          key.startsWith('user_') ||
          key.startsWith('session_') ||
          key.startsWith('temp_')
        )) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });

      console.log('Session storage cleared successfully');
    } catch (error) {
      console.error('Failed to clear session storage:', error);
    }
  }

  /**
   * 清理应用程序状态
   */
  private static clearApplicationState(): void {
    try {
      // 清理可能存在的全局状态
      if (typeof window !== 'undefined') {
        // 清理可能的全局变量
        (window as any).userState = null;
        (window as any).authState = null;
        (window as any).sessionState = null;

        // 触发自定义事件通知其他组件清理状态
        window.dispatchEvent(new CustomEvent('user-logout', {
          detail: { timestamp: Date.now() }
        }));
      }

      console.log('Application state cleared successfully');
    } catch (error) {
      console.error('Failed to clear application state:', error);
    }
  }

  /**
   * 获取登出后的重定向URL
   */
  static getLogoutRedirectUrl(
    currentPath: string,
    reason: LogoutOptions['reason'] = 'user_initiated'
  ): string {
    // 根据登出原因和当前路径决定重定向URL
    switch (reason) {
      case 'session_expired':
        return `/?message=session_expired&return_to=${encodeURIComponent(currentPath)}`;
      case 'security':
        return '/?message=security_logout';
      case 'admin_action':
        return '/?message=admin_logout';
      default:
        return '/';
    }
  }

  /**
   * 检查是否需要确认登出
   */
  static shouldConfirmLogout(
    hasUnsavedData: boolean = false,
    isInProgress: boolean = false
  ): boolean {
    // 如果有未保存的数据或正在进行操作，需要确认
    return hasUnsavedData || isInProgress;
  }

  /**
   * 获取浏览器指纹
   */
  private static async getFingerprint(): Promise<string | undefined> {
    try {
      if (typeof window !== 'undefined') {
        const { generateFingerprint } = await import('./fingerprint');
        const fingerprintData = await generateFingerprint();
        return fingerprintData?.visitorId;
      }
    } catch (error) {
      console.warn('Failed to get fingerprint:', error);
    }
    return undefined;
  }

  /**
   * 获取登出确认消息
   */
  static getLogoutConfirmationMessage(
    hasUnsavedData: boolean = false,
    isInProgress: boolean = false
  ): string {
    if (hasUnsavedData && isInProgress) {
      return '您有未保存的数据且正在进行操作，确定要退出登录吗？';
    } else if (hasUnsavedData) {
      return '您有未保存的数据，确定要退出登录吗？';
    } else if (isInProgress) {
      return '正在进行操作，确定要退出登录吗？';
    } else {
      return '确定要退出登录吗？';
    }
  }

  /**
   * 预登出检查
   */
  static async preLogoutCheck(): Promise<{
    canLogout: boolean;
    warnings: string[];
    hasUnsavedData: boolean;
    isInProgress: boolean;
  }> {
    const warnings: string[] = [];
    let hasUnsavedData = false;
    let isInProgress = false;

    try {
      // 检查未保存的数据
      if (typeof window !== 'undefined') {
        // 检查本地存储中的草稿数据
        const draftReports = localStorage.getItem('draft_reports');
        const unsavedAnalysis = localStorage.getItem('unsaved_analysis');
        
        if (draftReports || unsavedAnalysis) {
          hasUnsavedData = true;
          warnings.push('您有未保存的报告或分析数据');
        }

        // 检查是否有正在进行的操作
        const currentAnalysis = sessionStorage.getItem('current_analysis');
        if (currentAnalysis) {
          isInProgress = true;
          warnings.push('有分析任务正在进行中');
        }

        // 检查表单数据
        const formData = sessionStorage.getItem('form_data');
        if (formData) {
          hasUnsavedData = true;
          warnings.push('有未提交的表单数据');
        }
      }
    } catch (error) {
      console.error('Pre-logout check failed:', error);
      warnings.push('无法检查当前状态');
    }

    return {
      canLogout: true, // 总是允许登出，但会显示警告
      warnings,
      hasUnsavedData,
      isInProgress,
    };
  }
}

// 导出便捷函数
export const logout = LogoutService.logout.bind(LogoutService);
export const silentLogout = LogoutService.silentLogout.bind(LogoutService);