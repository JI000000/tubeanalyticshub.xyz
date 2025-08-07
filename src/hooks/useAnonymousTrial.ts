/**
 * 匿名试用状态管理Hook
 * 提供试用次数管理、本地存储同步和服务端验证功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFingerprintId } from './useFingerprint';
import { trialStorage } from '@/lib/trial-storage';
import type { 
  TrialStatus, 
  TrialAction, 
  TrialValidation,
  TrialConsumeRequest,
  TrialConsumeResponse,
  TrialManagerState,
  TrialEvent,
  TrialEventListener,
  TrialSyncOptions,
  TrialInitOptions,
  TrialResetOptions,
} from '@/types/trial';
import { 
  TRIAL_CONFIG, 
  TRIAL_ACTION_TYPES,
  TRIAL_ACTION_WEIGHTS,
  TRIAL_ERROR_MESSAGES,
  TRIAL_STATUS_MESSAGES,
  type TrialActionType 
} from '@/lib/trial-config';

// Hook选项接口
export interface UseAnonymousTrialOptions extends TrialInitOptions {
  onTrialExhausted?: () => void;
  onTrialConsumed?: (remaining: number) => void;
  onError?: (error: Error) => void;
  onStatusChanged?: (status: TrialStatus) => void;
}

// Hook返回值接口
export interface UseAnonymousTrialReturn {
  // 试用状态
  trialStatus: TrialStatus | null;
  isLoading: boolean;
  error: Error | null;
  managerState: TrialManagerState;
  
  // 试用操作
  consumeTrial: (action: TrialActionType, metadata?: any) => Promise<boolean>;
  canConsumeTrial: (action: TrialActionType) => boolean;
  validateTrial: () => TrialValidation;
  
  // 状态管理
  initializeTrial: (options?: TrialInitOptions) => Promise<void>;
  resetTrial: (options?: TrialResetOptions) => Promise<void>;
  syncWithServer: (options?: TrialSyncOptions) => Promise<boolean>;
  
  // 查询方法
  getRemainingTrials: () => number;
  getTotalTrials: () => number;
  getTrialActions: () => TrialAction[];
  isTrialExhausted: () => boolean;
  isBlocked: () => boolean;
  getNextResetTime: () => Date | null;
  
  // 事件监听
  addEventListener: (event: TrialEvent, listener: TrialEventListener) => void;
  removeEventListener: (event: TrialEvent, listener: TrialEventListener) => void;
  
  // 工具方法
  getStatusMessage: () => string;
  getActionWeight: (action: TrialActionType) => number;
  canPerformAction: (action: TrialActionType) => { allowed: boolean; reason?: string };
}

/**
 * 匿名试用状态管理Hook
 */
export function useAnonymousTrial(options: UseAnonymousTrialOptions = {}): UseAnonymousTrialReturn {
  const {
    fingerprint: providedFingerprint,
    autoSync = true,
    syncInterval = 30000, // 30秒
    maxRetries = 3,
    onTrialExhausted,
    onTrialConsumed,
    onError,
    onStatusChanged,
  } = options;

  // 获取设备指纹
  const { fingerprintId, isLoading: fingerprintLoading } = useFingerprintId({
    autoGenerate: true,
  });

  // 状态管理
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [managerState, setManagerState] = useState<TrialManagerState>({
    isInitialized: false,
    isLoading: true,
    lastSyncAt: null,
    errorCount: 0,
    lastError: null,
    syncInProgress: false,
  });

  // 事件监听器
  const eventListeners = useRef<Map<TrialEvent, Set<TrialEventListener>>>(new Map());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // 使用提供的指纹或生成的指纹
  const currentFingerprint = providedFingerprint || fingerprintId;

  /**
   * 触发事件
   */
  const emitEvent = useCallback((event: TrialEvent, data?: any) => {
    const listeners = eventListeners.current.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, data);
        } catch (error) {
          console.error(`Error in trial event listener for ${event}:`, error);
        }
      });
    }
  }, []);

  /**
   * 更新管理器状态
   */
  const updateManagerState = useCallback((updates: Partial<TrialManagerState>) => {
    setManagerState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 处理错误
   */
  const handleError = useCallback((error: Error | string, retryable = false) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
    
    updateManagerState({
      errorCount: managerState.errorCount + 1,
      lastError: {
        type: 'VALIDATION_FAILED',
        message: errorObj.message,
        retryable,
      },
    });

    onError?.(errorObj);
    emitEvent('error', errorObj);
  }, [managerState.errorCount, updateManagerState, onError, emitEvent]);

  /**
   * 初始化试用状态
   */
  const initializeTrial = useCallback(async (initOptions?: TrialInitOptions) => {
    if (!currentFingerprint) return;

    setIsLoading(true);
    updateManagerState({ isLoading: true });

    try {
      // 从本地存储加载现有状态
      let existingStatus = await trialStorage.loadTrialStatus();
      
      // 如果没有现有状态或指纹不匹配，创建新状态
      if (!existingStatus || existingStatus.fingerprint !== currentFingerprint) {
        existingStatus = {
          remaining: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
          total: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
          fingerprint: currentFingerprint,
          lastUsed: new Date(),
          actions: [],
          isBlocked: false,
        };
      }

      setTrialStatus(existingStatus);
      await trialStorage.saveTrialStatus(existingStatus);

      updateManagerState({
        isInitialized: true,
        isLoading: false,
        lastSyncAt: Date.now(),
      });

      onStatusChanged?.(existingStatus);
      emitEvent('initialized', existingStatus);

      // 如果启用自动同步，开始同步
      if (autoSync) {
        await syncWithServer({ skipValidation: true });
        startAutoSync();
      }

    } catch (error) {
      handleError(error as Error, true);
    } finally {
      setIsLoading(false);
    }
  }, [currentFingerprint, autoSync, updateManagerState, onStatusChanged, emitEvent, handleError]);

  /**
   * 与服务器同步试用状态
   */
  const syncWithServer = useCallback(async (syncOptions?: TrialSyncOptions): Promise<boolean> => {
    if (!currentFingerprint || managerState.syncInProgress) return false;

    const { force = false, skipValidation = false, timeout = 10000 } = syncOptions || {};

    updateManagerState({ syncInProgress: true });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`/api/trial/consume?fingerprint=${currentFingerprint}`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server sync failed: ${response.status}`);
      }

      const serverData = await response.json();
      
      if (serverData.success && serverData.remaining !== undefined) {
        // 更新本地状态以匹配服务器状态
        const updatedStatus: TrialStatus = {
          remaining: serverData.remaining,
          total: serverData.total || TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
          fingerprint: currentFingerprint,
          lastUsed: new Date(),
          actions: trialStatus?.actions || [],
          isBlocked: serverData.isBlocked || false,
          resetAt: serverData.nextResetAt ? new Date(serverData.nextResetAt) : undefined,
        };

        setTrialStatus(updatedStatus);
        await trialStorage.saveTrialStatus(updatedStatus);

        updateManagerState({
          lastSyncAt: Date.now(),
          syncInProgress: false,
        });

        onStatusChanged?.(updatedStatus);
        emitEvent('synced', updatedStatus);
        
        retryCountRef.current = 0; // 重置重试计数
        return true;
      }

      return false;

    } catch (error) {
      console.error('Server sync failed:', error);
      
      // 如果不是强制同步且有本地数据，继续使用本地数据
      if (!force && trialStatus) {
        updateManagerState({ syncInProgress: false });
        return false;
      }

      // 重试逻辑
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        setTimeout(() => syncWithServer(syncOptions), 1000 * retryCountRef.current);
      } else {
        handleError(error as Error, true);
      }

      updateManagerState({ syncInProgress: false });
      return false;
    }
  }, [currentFingerprint, managerState.syncInProgress, trialStatus, maxRetries, updateManagerState, onStatusChanged, emitEvent, handleError]);

  /**
   * 检查是否可以消耗试用次数
   */
  const canConsumeTrial = useCallback((action: TrialActionType): boolean => {
    if (!trialStatus) return false;
    if (trialStatus.isBlocked) return false;
    
    const actionWeight = TRIAL_ACTION_WEIGHTS[action] || 1;
    return trialStatus.remaining >= actionWeight;
  }, [trialStatus]);

  /**
   * 消耗试用次数
   */
  const consumeTrial = useCallback(async (action: TrialActionType, metadata?: any): Promise<boolean> => {
    if (!currentFingerprint || !trialStatus) {
      handleError('Trial not initialized');
      return false;
    }

    // 检查是否可以消耗
    const canConsume = canConsumeTrial(action);
    if (!canConsume) {
      handleError('Cannot consume trial: insufficient remaining trials');
      return false;
    }

    try {
      // 构建请求数据
      const requestData: TrialConsumeRequest = {
        action,
        fingerprint: currentFingerprint,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      };

      // 发送到服务器
      const response = await fetch('/api/trial/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result: TrialConsumeResponse = await response.json();

      if (result.success) {
        // 更新本地状态
        const actionWeight = TRIAL_ACTION_WEIGHTS[action] || 1;
        const newRemaining = Math.max(0, trialStatus.remaining - actionWeight);
        
        const trialAction: TrialAction = {
          type: action,
          timestamp: new Date(),
          metadata,
          fingerprint: currentFingerprint,
        };

        const updatedStatus: TrialStatus = {
          ...trialStatus,
          remaining: newRemaining,
          lastUsed: new Date(),
          actions: [...trialStatus.actions, trialAction],
        };

        setTrialStatus(updatedStatus);
        await trialStorage.saveTrialStatus(updatedStatus);
        await trialStorage.addTrialAction(trialAction);

        // 触发回调和事件
        onTrialConsumed?.(newRemaining);
        onStatusChanged?.(updatedStatus);
        emitEvent('consumed', { action, remaining: newRemaining });

        // 如果试用次数用完，触发相应事件
        if (newRemaining === 0) {
          onTrialExhausted?.();
          emitEvent('exhausted', updatedStatus);
        }

        return true;
      } else {
        // 处理服务器返回的错误
        if (result.blocked) {
          const updatedStatus = { ...trialStatus, isBlocked: true };
          setTrialStatus(updatedStatus);
          await trialStorage.saveTrialStatus(updatedStatus);
          emitEvent('blocked', updatedStatus);
        }

        handleError(result.message || 'Trial consumption failed');
        return false;
      }

    } catch (error) {
      handleError(error as Error, true);
      return false;
    }
  }, [currentFingerprint, trialStatus, canConsumeTrial, onTrialConsumed, onStatusChanged, onTrialExhausted, emitEvent, handleError]);

  /**
   * 验证试用状态
   */
  const validateTrial = useCallback((): TrialValidation => {
    if (!trialStatus) {
      return {
        isValid: false,
        canConsume: false,
        remaining: 0,
        reasons: ['Trial not initialized'],
        isRateLimited: false,
      };
    }

    const reasons: string[] = [];
    let canConsume = true;

    if (trialStatus.isBlocked) {
      reasons.push('Device is blocked');
      canConsume = false;
    }

    if (trialStatus.remaining <= 0) {
      reasons.push('No remaining trials');
      canConsume = false;
    }

    // 检查重置时间
    let nextResetAt: Date | undefined;
    if (trialStatus.resetAt) {
      nextResetAt = trialStatus.resetAt;
      if (Date.now() > trialStatus.resetAt.getTime()) {
        reasons.push('Trial period expired, reset available');
      }
    }

    return {
      isValid: reasons.length === 0,
      canConsume,
      remaining: trialStatus.remaining,
      reasons,
      nextResetAt,
      isRateLimited: false, // 这里可以添加更复杂的速率限制逻辑
    };
  }, [trialStatus]);

  /**
   * 重置试用状态
   */
  const resetTrial = useCallback(async (resetOptions?: TrialResetOptions) => {
    const { reason = 'manual_reset', preserveActions = false, newFingerprint } = resetOptions || {};

    try {
      const fingerprint = newFingerprint || currentFingerprint;
      if (!fingerprint) {
        throw new Error('No fingerprint available for reset');
      }

      const newStatus: TrialStatus = {
        remaining: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
        total: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
        fingerprint,
        lastUsed: new Date(),
        actions: preserveActions ? (trialStatus?.actions || []) : [],
        isBlocked: false,
      };

      setTrialStatus(newStatus);
      await trialStorage.saveTrialStatus(newStatus);

      onStatusChanged?.(newStatus);
      emitEvent('reset', { reason, status: newStatus });

    } catch (error) {
      handleError(error as Error, true);
    }
  }, [currentFingerprint, trialStatus, onStatusChanged, emitEvent, handleError]);

  /**
   * 开始自动同步
   */
  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(() => {
      syncWithServer({ skipValidation: true });
    }, syncInterval);
  }, [syncWithServer, syncInterval]);

  /**
   * 停止自动同步
   */
  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // 查询方法
  const getRemainingTrials = useCallback(() => trialStatus?.remaining || 0, [trialStatus]);
  const getTotalTrials = useCallback(() => trialStatus?.total || TRIAL_CONFIG.DEFAULT_TRIAL_COUNT, [trialStatus]);
  const getTrialActions = useCallback(() => trialStatus?.actions || [], [trialStatus]);
  const isTrialExhausted = useCallback(() => (trialStatus?.remaining || 0) <= 0, [trialStatus]);
  const isBlocked = useCallback(() => trialStatus?.isBlocked || false, [trialStatus]);
  const getNextResetTime = useCallback(() => trialStatus?.resetAt || null, [trialStatus]);

  /**
   * 获取状态消息
   */
  const getStatusMessage = useCallback((): string => {
    if (!trialStatus) return '正在初始化...';
    
    if (trialStatus.isBlocked) {
      return '设备已被暂时阻止';
    }
    
    if (trialStatus.remaining <= 0) {
      return TRIAL_STATUS_MESSAGES.EXHAUSTED;
    }
    
    if (trialStatus.remaining === 1) {
      return TRIAL_STATUS_MESSAGES.LAST_CHANCE;
    }
    
    return TRIAL_STATUS_MESSAGES.REMAINING(trialStatus.remaining);
  }, [trialStatus]);

  /**
   * 获取操作权重
   */
  const getActionWeight = useCallback((action: TrialActionType): number => {
    return TRIAL_ACTION_WEIGHTS[action] || 1;
  }, []);

  /**
   * 检查是否可以执行操作
   */
  const canPerformAction = useCallback((action: TrialActionType): { allowed: boolean; reason?: string } => {
    if (!trialStatus) {
      return { allowed: false, reason: '试用状态未初始化' };
    }

    if (trialStatus.isBlocked) {
      return { allowed: false, reason: '设备已被阻止' };
    }

    const actionWeight = getActionWeight(action);
    if (trialStatus.remaining < actionWeight) {
      return { allowed: false, reason: '试用次数不足' };
    }

    return { allowed: true };
  }, [trialStatus, getActionWeight]);

  /**
   * 添加事件监听器
   */
  const addEventListener = useCallback((event: TrialEvent, listener: TrialEventListener) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)!.add(listener);
  }, []);

  /**
   * 移除事件监听器
   */
  const removeEventListener = useCallback((event: TrialEvent, listener: TrialEventListener) => {
    const listeners = eventListeners.current.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        eventListeners.current.delete(event);
      }
    }
  }, []);

  // 初始化效果
  useEffect(() => {
    if (currentFingerprint && !managerState.isInitialized) {
      initializeTrial();
    }
  }, [currentFingerprint, managerState.isInitialized, initializeTrial]);

  // 清理效果
  useEffect(() => {
    return () => {
      stopAutoSync();
    };
  }, [stopAutoSync]);

  return {
    // 试用状态
    trialStatus,
    isLoading: isLoading || fingerprintLoading,
    error,
    managerState,
    
    // 试用操作
    consumeTrial,
    canConsumeTrial,
    validateTrial,
    
    // 状态管理
    initializeTrial,
    resetTrial,
    syncWithServer,
    
    // 查询方法
    getRemainingTrials,
    getTotalTrials,
    getTrialActions,
    isTrialExhausted,
    isBlocked,
    getNextResetTime,
    
    // 事件监听
    addEventListener,
    removeEventListener,
    
    // 工具方法
    getStatusMessage,
    getActionWeight,
    canPerformAction,
  };
}

// 导出类型和常量
export {
  TRIAL_ACTION_TYPES,
  TRIAL_ACTION_WEIGHTS,
  TRIAL_ERROR_MESSAGES,
  TRIAL_STATUS_MESSAGES,
};