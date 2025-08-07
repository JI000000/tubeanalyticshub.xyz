/**
 * 智能认证状态管理Hook
 * 结合用户认证状态和匿名试用管理，提供智能登录触发逻辑
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAnonymousTrial } from './useAnonymousTrial';
import type { 
  LoginTrigger, 
  LoginContext,
  SmartLoginModalProps 
} from '@/components/auth/SmartLoginModal';
import type { TrialActionType } from '@/lib/trial-config';
import { LoginAnalyticsService } from '@/lib/login-analytics';
import { useFingerprint } from './useFingerprint';

// 功能访问权限结果
export interface FeatureAccess {
  allowed: boolean;
  reason: 'authenticated' | 'trial' | 'blocked' | 'exhausted' | 'premium_required';
  message?: string;
  upgradeRequired?: boolean;
  loginRequired?: boolean;
}

// 登录要求选项
export interface RequireAuthOptions {
  allowTrial?: boolean;
  trialAction?: TrialActionType;
  message?: string;
  urgency?: 'low' | 'medium' | 'high';
  allowSkip?: boolean;
  returnUrl?: string;
  metadata?: any;
  onSkip?: () => void;
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
}

// 登录触发结果
export interface LoginTriggerResult {
  shouldLogin: boolean;
  trigger?: LoginTrigger;
  context?: LoginContext;
  canProceed: boolean;
}

// 智能认证Hook返回值
export interface SmartAuthHook {
  // 认证状态
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  
  // 试用状态
  trialStatus: any;
  canUseTrial: boolean;
  trialRemaining: number;
  
  // 登录模态框状态
  showLoginModal: boolean;
  loginTrigger?: LoginTrigger;
  loginContext?: LoginContext;
  
  // 核心方法
  requireAuth: (action: string, options?: RequireAuthOptions) => Promise<boolean>;
  checkFeatureAccess: (feature: string, options?: { requireAuth?: boolean; trialAction?: TrialActionType }) => FeatureAccess;
  
  // 登录流程控制
  triggerLogin: (trigger: LoginTrigger, context?: LoginContext) => void;
  closeLoginModal: () => void;
  handleLoginSuccess: (result: any) => void;
  handleLoginCancel: () => void;
  handleLoginSkip: () => void;
  
  // 试用管理
  consumeTrial: (action: TrialActionType, metadata?: any) => Promise<boolean>;
  canConsumeTrial: (action: TrialActionType) => boolean;
  
  // 工具方法
  getLoginMessage: (scenario: string, remaining?: number) => string;
  shouldShowTrialIndicator: () => boolean;
  getTrialStatusMessage: () => string;
}

// 预定义的登录场景消息
const LOGIN_MESSAGES = {
  trial_exhausted: (remaining: number) => 
    remaining === 0 
      ? '您的免费试用次数已用完，登录后可继续使用所有功能'
      : `还剩 ${remaining} 次免费机会，登录后可获得无限使用权限`,
  
  save_action: '保存功能需要登录，这样您就不会丢失宝贵的分析结果',
  
  premium_feature: '这是高级功能，需要登录后才能使用',
  
  history_access: '查看历史记录需要登录，登录后可管理所有分析历史',
  
  export_data: '数据导出功能需要登录，确保数据安全和归属权',
  
  team_collaboration: '团队协作功能需要登录，与团队成员共享分析结果',
  
  api_access: 'API访问需要认证，登录后可获得API密钥',
  
  advanced_analytics: '高级分析功能需要登录，解锁更多深度洞察',
  
  default: '继续使用需要登录，登录后可享受完整功能'
};

// 功能权限配置类型
interface FeaturePermission {
  requireAuth: boolean;
  allowTrial: boolean;
  trialAction?: TrialActionType;
  requirePremium?: boolean;
}

// 功能权限配置
const FEATURE_PERMISSIONS: Record<string, FeaturePermission> = {
  // 基础功能 - 允许试用
  'video_analysis': { requireAuth: false, allowTrial: true, trialAction: 'video_analysis' as TrialActionType },
  'basic_report': { requireAuth: false, allowTrial: true, trialAction: 'generate_report' as TrialActionType },
  
  // 保存功能 - 需要登录
  'save_report': { requireAuth: true, allowTrial: false },
  'create_project': { requireAuth: true, allowTrial: false },
  'bookmark_video': { requireAuth: true, allowTrial: false },
  
  // 历史和个人数据 - 需要登录
  'view_history': { requireAuth: true, allowTrial: false },
  'manage_favorites': { requireAuth: true, allowTrial: false },
  'user_settings': { requireAuth: true, allowTrial: false },
  
  // 高级功能 - 需要登录
  'advanced_analytics': { requireAuth: true, allowTrial: false },
  'export_data': { requireAuth: true, allowTrial: false },
  'api_access': { requireAuth: true, allowTrial: false },
  'team_collaboration': { requireAuth: true, allowTrial: false },
  
  // 管理功能 - 需要登录和权限
  'admin_panel': { requireAuth: true, allowTrial: false, requirePremium: true },
};

/**
 * 智能认证状态管理Hook
 */
export function useSmartAuth(): SmartAuthHook {
  const auth = useAuth();
  const { fingerprint } = useFingerprint();
  const trial = useAnonymousTrial({
    onTrialExhausted: () => {
      // 试用耗尽时自动触发登录提示
      if (!auth.isAuthenticated && !showLoginModal) {
        triggerLogin({
          type: 'trial_exhausted',
          message: LOGIN_MESSAGES.trial_exhausted(0),
          urgency: 'medium',
          allowSkip: false,
        });
      }
    },
  });

  // 登录模态框状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTrigger, setLoginTrigger] = useState<LoginTrigger | undefined>();
  const [loginContext, setLoginContext] = useState<LoginContext | undefined>();
  
  // 回调函数引用
  const pendingCallbacks = useRef<{
    onSuccess?: (result: any) => void;
    onCancel?: () => void;
    onSkip?: () => void;
  }>({});

  /**
   * 触发登录模态框
   */
  const triggerLogin = useCallback((trigger: LoginTrigger, context?: LoginContext) => {
    setLoginTrigger(trigger);
    setLoginContext(context);
    setShowLoginModal(true);
  }, []);

  /**
   * 关闭登录模态框
   */
  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setLoginTrigger(undefined);
    setLoginContext(undefined);
    pendingCallbacks.current = {};
  }, []);

  /**
   * 处理登录成功
   */
  const handleLoginSuccess = useCallback((result: any) => {
    const callback = pendingCallbacks.current.onSuccess;
    closeLoginModal();
    callback?.(result);
  }, [closeLoginModal]);

  /**
   * 处理登录取消
   */
  const handleLoginCancel = useCallback(() => {
    const callback = pendingCallbacks.current.onCancel;
    closeLoginModal();
    callback?.();
  }, [closeLoginModal]);

  /**
   * 处理登录跳过
   */
  const handleLoginSkip = useCallback(() => {
    const callback = pendingCallbacks.current.onSkip;
    closeLoginModal();
    callback?.();
  }, [closeLoginModal]);

  /**
   * 检查功能访问权限
   */
  const checkFeatureAccess = useCallback((
    feature: string, 
    options?: { requireAuth?: boolean; trialAction?: TrialActionType }
  ): FeatureAccess => {
    const permission = FEATURE_PERMISSIONS[feature];
    const { requireAuth = permission?.requireAuth, trialAction = permission?.trialAction } = options || {};

    // 如果用户已认证，大部分功能都允许
    if (auth.isAuthenticated) {
      // 检查是否需要高级权限
      if (permission?.requirePremium && auth.user?.plan === 'free') {
        return {
          allowed: false,
          reason: 'premium_required',
          message: '此功能需要升级到高级版本',
          upgradeRequired: true,
        };
      }
      
      return {
        allowed: true,
        reason: 'authenticated',
      };
    }

    // 用户未认证的情况
    if (requireAuth) {
      return {
        allowed: false,
        reason: 'blocked',
        message: '此功能需要登录',
        loginRequired: true,
      };
    }

    // 检查试用权限
    if (trialAction && permission?.allowTrial) {
      if (trial.isBlocked()) {
        return {
          allowed: false,
          reason: 'blocked',
          message: '设备已被暂时阻止',
          loginRequired: true,
        };
      }

      if (trial.canConsumeTrial(trialAction)) {
        return {
          allowed: true,
          reason: 'trial',
          message: `还可以试用 ${trial.getRemainingTrials()} 次`,
        };
      } else {
        return {
          allowed: false,
          reason: 'exhausted',
          message: '试用次数已用完',
          loginRequired: true,
        };
      }
    }

    // 默认阻止
    return {
      allowed: false,
      reason: 'blocked',
      message: '需要登录才能使用此功能',
      loginRequired: true,
    };
  }, [auth.isAuthenticated, auth.user, trial]);

  /**
   * 智能登录要求检查
   */
  const requireAuth = useCallback(async (
    action: string, 
    options: RequireAuthOptions = {}
  ): Promise<boolean> => {
    const {
      allowTrial = true,
      trialAction,
      message,
      urgency = 'medium',
      allowSkip = false,
      returnUrl = window.location.pathname,
      metadata,
      onSuccess,
      onCancel,
      onSkip,
    } = options;

    // 如果已经认证，直接允许
    if (auth.isAuthenticated) {
      return true;
    }

    // 检查功能访问权限
    const access = checkFeatureAccess(action, { 
      requireAuth: !allowTrial, 
      trialAction 
    });

    // 如果允许访问（通过试用或其他方式），直接返回
    if (access.allowed) {
      // 如果是试用访问，消耗试用次数
      if (access.reason === 'trial' && trialAction) {
        const consumed = await trial.consumeTrial(trialAction, {
          action,
          ...metadata,
        });
        return consumed;
      }
      return true;
    }

    // 需要登录，构建登录触发器
    const trigger: LoginTrigger = {
      type: access.reason === 'exhausted' ? 'trial_exhausted' : 'feature_required',
      message: message || access.message || LOGIN_MESSAGES.default,
      urgency,
      allowSkip,
    };

    const context: LoginContext = {
      previousAction: action,
      returnUrl,
      metadata,
    };

    // 保存回调函数
    pendingCallbacks.current = {
      onSuccess,
      onCancel,
      onSkip,
    };

    // 触发登录模态框
    triggerLogin(trigger, context);

    // 返回 false 表示当前无法执行操作
    return false;
  }, [auth.isAuthenticated, checkFeatureAccess, trial, triggerLogin]);

  /**
   * 消耗试用次数（带智能检查）
   */
  const consumeTrial = useCallback(async (
    action: TrialActionType, 
    metadata?: any
  ): Promise<boolean> => {
    // 如果已认证，不需要消耗试用
    if (auth.isAuthenticated) {
      return true;
    }

    // 检查是否可以消耗试用
    if (!trial.canConsumeTrial(action)) {
      // 试用次数不足，触发登录
      await requireAuth('trial_consumption', {
        trialAction: action,
        message: LOGIN_MESSAGES.trial_exhausted(trial.getRemainingTrials()),
        urgency: 'medium',
        allowSkip: false,
        metadata,
      });
      return false;
    }

    // 消耗试用次数
    return await trial.consumeTrial(action, metadata);
  }, [auth.isAuthenticated, trial, requireAuth]);

  /**
   * 检查是否可以消耗试用
   */
  const canConsumeTrial = useCallback((action: TrialActionType): boolean => {
    if (auth.isAuthenticated) return true;
    return trial.canConsumeTrial(action);
  }, [auth.isAuthenticated, trial]);

  /**
   * 获取登录消息
   */
  const getLoginMessage = useCallback((scenario: string, remaining?: number): string => {
    const messageFunc = LOGIN_MESSAGES[scenario as keyof typeof LOGIN_MESSAGES];
    if (typeof messageFunc === 'function') {
      return messageFunc(remaining || 0);
    }
    return typeof messageFunc === 'string' ? messageFunc : LOGIN_MESSAGES.default;
  }, []);

  /**
   * 是否应该显示试用指示器
   */
  const shouldShowTrialIndicator = useCallback((): boolean => {
    if (auth.isAuthenticated) return false;
    if (trial.isLoading) return false;
    
    const remaining = trial.getRemainingTrials();
    return remaining > 0 && remaining <= 3; // 剩余3次或更少时显示
  }, [auth.isAuthenticated, trial]);

  /**
   * 获取试用状态消息
   */
  const getTrialStatusMessage = useCallback((): string => {
    if (auth.isAuthenticated) return '';
    return trial.getStatusMessage();
  }, [auth.isAuthenticated, trial]);

  // 监听认证状态变化，关闭登录模态框
  useEffect(() => {
    if (auth.isAuthenticated && showLoginModal) {
      handleLoginSuccess(auth.user);
    }
  }, [auth.isAuthenticated, auth.user, showLoginModal, handleLoginSuccess]);

  // 监听登出事件，清理状态
  useEffect(() => {
    const handleUserLogout = () => {
      // 清理登录模态框状态
      if (showLoginModal) {
        closeLoginModal();
      }
      
      // 清理试用状态（如果需要）
      // trial.reset(); // 取消注释如果需要在登出时重置试用状态
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('user-logout', handleUserLogout);
      return () => {
        window.removeEventListener('user-logout', handleUserLogout);
      };
    }
  }, [showLoginModal, closeLoginModal]);

  return {
    // 认证状态
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading || trial.isLoading,
    
    // 试用状态
    trialStatus: trial.trialStatus,
    canUseTrial: trial.getRemainingTrials() > 0 && !trial.isBlocked(),
    trialRemaining: trial.getRemainingTrials(),
    
    // 登录模态框状态
    showLoginModal,
    loginTrigger,
    loginContext,
    
    // 核心方法
    requireAuth,
    checkFeatureAccess,
    
    // 登录流程控制
    triggerLogin,
    closeLoginModal,
    handleLoginSuccess,
    handleLoginCancel,
    handleLoginSkip,
    
    // 试用管理
    consumeTrial,
    canConsumeTrial,
    
    // 工具方法
    getLoginMessage,
    shouldShowTrialIndicator,
    getTrialStatusMessage,
  };
}

// 导出常量
export { FEATURE_PERMISSIONS, LOGIN_MESSAGES };