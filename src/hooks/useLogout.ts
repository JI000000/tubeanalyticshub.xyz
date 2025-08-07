'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useFingerprint } from './useFingerprint';
import { LogoutService, type LogoutOptions, type LogoutResult } from '@/lib/logout-service';
import { LoginAnalyticsService } from '@/lib/login-analytics';

// 登出Hook选项
export interface UseLogoutOptions {
  /** 默认重定向URL */
  defaultRedirectUrl?: string;
  /** 是否自动显示确认对话框 */
  autoConfirm?: boolean;
  /** 是否在登出前检查未保存数据 */
  checkUnsavedData?: boolean;
  /** 登出成功回调 */
  onLogoutSuccess?: (result: LogoutResult) => void;
  /** 登出失败回调 */
  onLogoutError?: (error: string) => void;
  /** 登出前回调 */
  onBeforeLogout?: () => Promise<boolean> | boolean;
}

// 登出Hook返回值
export interface UseLogoutReturn {
  /** 是否正在登出 */
  isLoggingOut: boolean;
  /** 登出函数 */
  logout: (options?: Partial<LogoutOptions>) => Promise<LogoutResult>;
  /** 静默登出函数 */
  silentLogout: (reason?: LogoutOptions['reason'], redirectUrl?: string) => Promise<LogoutResult>;
  /** 带确认的登出函数 */
  logoutWithConfirmation: (options?: Partial<LogoutOptions>) => Promise<LogoutResult>;
  /** 预登出检查 */
  preLogoutCheck: () => Promise<{
    canLogout: boolean;
    warnings: string[];
    hasUnsavedData: boolean;
    isInProgress: boolean;
  }>;
  /** 获取登出确认消息 */
  getConfirmationMessage: (hasUnsavedData?: boolean, isInProgress?: boolean) => string;
  /** 记录登出意图（用于分析） */
  recordLogoutIntent: (reason?: string) => Promise<void>;
}

/**
 * 登出管理Hook
 */
export function useLogout(options: UseLogoutOptions = {}): UseLogoutReturn {
  const {
    defaultRedirectUrl = '/',
    autoConfirm = true,
    checkUnsavedData = true,
    onLogoutSuccess,
    onLogoutError,
    onBeforeLogout,
  } = options;

  const { user, session } = useAuth();
  const { fingerprint } = useFingerprint();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * 预登出检查
   */
  const preLogoutCheck = useCallback(async () => {
    if (checkUnsavedData) {
      return await LogoutService.preLogoutCheck();
    }
    return {
      canLogout: true,
      warnings: [],
      hasUnsavedData: false,
      isInProgress: false,
    };
  }, [checkUnsavedData]);

  /**
   * 获取确认消息
   */
  const getConfirmationMessage = useCallback((
    hasUnsavedData: boolean = false,
    isInProgress: boolean = false
  ): string => {
    return LogoutService.getLogoutConfirmationMessage(hasUnsavedData, isInProgress);
  }, []);

  /**
   * 记录登出意图
   */
  const recordLogoutIntent = useCallback(async (reason: string = 'user_initiated') => {
    try {
      await LoginAnalyticsService.recordEvent('logout_intent', {
        user_id: user?.id,
        fingerprint: fingerprint?.visitorId || undefined,
        context: {
          reason,
          page_url: typeof window !== 'undefined' ? window.location.href : undefined,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to record logout intent:', error);
    }
  }, [user?.id, fingerprint]);

  /**
   * 执行登出
   */
  const logout = useCallback(async (
    logoutOptions: Partial<LogoutOptions> = {}
  ): Promise<LogoutResult> => {
    if (isLoggingOut) {
      return {
        success: false,
        error: 'Logout already in progress',
        redirected: false,
        analyticsRecorded: false,
      };
    }

    setIsLoggingOut(true);

    try {
      // 执行登出前回调
      if (onBeforeLogout) {
        const canProceed = await onBeforeLogout();
        if (!canProceed) {
          return {
            success: false,
            error: 'Logout cancelled by beforeLogout callback',
            redirected: false,
            analyticsRecorded: false,
          };
        }
      }

      // 记录登出意图
      await recordLogoutIntent(logoutOptions.reason);

      // 执行登出
      const result = await LogoutService.logout(user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      } : null, {
        callbackUrl: defaultRedirectUrl,
        showConfirmation: false, // 由Hook管理确认逻辑
        clearLocalStorage: true,
        clearSessionStorage: true,
        ...logoutOptions,
      });

      // 处理结果
      if (result.success) {
        onLogoutSuccess?.(result);
      } else {
        onLogoutError?.(result.error || 'Unknown error');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onLogoutError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        redirected: false,
        analyticsRecorded: false,
      };
    } finally {
      setIsLoggingOut(false);
    }
  }, [
    isLoggingOut,
    user,
    defaultRedirectUrl,
    onBeforeLogout,
    onLogoutSuccess,
    onLogoutError,
    recordLogoutIntent,
  ]);

  /**
   * 静默登出
   */
  const silentLogout = useCallback(async (
    reason: LogoutOptions['reason'] = 'session_expired',
    redirectUrl: string = defaultRedirectUrl
  ): Promise<LogoutResult> => {
    if (isLoggingOut) {
      return {
        success: false,
        error: 'Logout already in progress',
        redirected: false,
        analyticsRecorded: false,
      };
    }

    setIsLoggingOut(true);

    try {
      await recordLogoutIntent(reason);
      
      const result = await LogoutService.silentLogout(user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      } : null, reason, redirectUrl);
      
      if (result.success) {
        onLogoutSuccess?.(result);
      } else {
        onLogoutError?.(result.error || 'Unknown error');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onLogoutError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        redirected: false,
        analyticsRecorded: false,
      };
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, user, defaultRedirectUrl, onLogoutSuccess, onLogoutError, recordLogoutIntent]);

  /**
   * 带确认的登出
   */
  const logoutWithConfirmation = useCallback(async (
    logoutOptions: Partial<LogoutOptions> = {}
  ): Promise<LogoutResult> => {
    try {
      // 执行预检查
      const checkResult = await preLogoutCheck();
      
      // 确定是否需要确认
      const needsConfirmation = autoConfirm && LogoutService.shouldConfirmLogout(
        checkResult.hasUnsavedData,
        checkResult.isInProgress
      );

      if (needsConfirmation) {
        const confirmationMessage = LogoutService.getLogoutConfirmationMessage(
          checkResult.hasUnsavedData,
          checkResult.isInProgress
        );

        // 显示确认对话框
        const confirmed = window.confirm(confirmationMessage);
        if (!confirmed) {
          return {
            success: false,
            error: 'User cancelled logout',
            redirected: false,
            analyticsRecorded: false,
          };
        }
      }

      // 执行登出
      return await logout({
        showConfirmation: false,
        metadata: {
          warnings: checkResult.warnings,
          hasUnsavedData: checkResult.hasUnsavedData,
          isInProgress: checkResult.isInProgress,
        },
        ...logoutOptions,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onLogoutError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        redirected: false,
        analyticsRecorded: false,
      };
    }
  }, [preLogoutCheck, autoConfirm, logout, onLogoutError]);

  return {
    isLoggingOut,
    logout,
    silentLogout,
    logoutWithConfirmation,
    preLogoutCheck,
    getConfirmationMessage,
    recordLogoutIntent,
  };
}

// 便捷函数导出
export const createLogoutHandler = (
  logoutFn: (options?: Partial<LogoutOptions>) => Promise<LogoutResult>,
  options: Partial<LogoutOptions> = {}
) => {
  return async () => {
    try {
      const result = await logoutFn(options);
      if (!result.success) {
        console.error('Logout failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Logout handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        redirected: false,
        analyticsRecorded: false,
      };
    }
  };
};