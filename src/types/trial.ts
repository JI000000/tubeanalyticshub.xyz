/**
 * 匿名试用系统相关的TypeScript类型定义
 */

// 试用状态接口
export interface TrialStatus {
  remaining: number;
  total: number;
  fingerprint: string;
  lastUsed: Date;
  actions: TrialAction[];
  isBlocked: boolean;
  resetAt?: Date;
}

// 试用操作记录接口
export interface TrialAction {
  type: string;
  timestamp: Date;
  metadata?: any;
  fingerprint: string;
  ipAddress?: string;
}

// 试用配置接口
export interface TrialConfig {
  readonly DEFAULT_TRIAL_COUNT: number;
  readonly MAX_TRIAL_COUNT: number;
  readonly TRIAL_RESET_HOURS: number;
  readonly COOKIE_NAME: string;
  readonly COOKIE_EXPIRES_DAYS: number;
  readonly LOCAL_STORAGE_KEY: string;
  readonly BLOCKED_DURATION_HOURS: number;
  readonly MAX_ACTIONS_PER_HOUR: number;
}

// 试用验证结果接口
export interface TrialValidation {
  isValid: boolean;
  canConsume: boolean;
  remaining: number;
  reasons: string[];
  nextResetAt?: Date;
  isRateLimited: boolean;
}

// 试用消耗请求接口
export interface TrialConsumeRequest {
  action: string;
  fingerprint: string;
  metadata?: any;
  userAgent?: string;
  ipAddress?: string;
}

// 试用消耗响应接口
export interface TrialConsumeResponse {
  success: boolean;
  remaining: number;
  blocked?: boolean;
  message?: string;
  nextResetAt?: Date;
  rateLimited?: boolean;
}

// 试用统计信息接口
export interface TrialStats {
  totalTrials: number;
  consumedTrials: number;
  remainingTrials: number;
  successRate: number;
  averageActionsPerSession: number;
  lastActivity: Date;
  deviceCount: number;
  conversionRate: number;
}

// 试用错误类型
export type TrialError = 
  | 'TRIAL_EXHAUSTED'
  | 'RATE_LIMITED'
  | 'INVALID_FINGERPRINT'
  | 'BLOCKED_DEVICE'
  | 'SERVER_ERROR'
  | 'VALIDATION_FAILED'
  | 'STORAGE_ERROR';

// 试用错误详情接口
export interface TrialErrorDetails {
  type: TrialError;
  message: string;
  code?: string;
  retryable: boolean;
  retryAfter?: number;
}

// 试用管理器状态接口
export interface TrialManagerState {
  isInitialized: boolean;
  isLoading: boolean;
  lastSyncAt: number | null;
  errorCount: number;
  lastError: TrialErrorDetails | null;
  syncInProgress: boolean;
}

// 试用事件类型
export type TrialEvent = 
  | 'initialized'
  | 'consumed'
  | 'exhausted'
  | 'reset'
  | 'blocked'
  | 'synced'
  | 'error';

// 试用事件监听器接口
export interface TrialEventListener {
  (event: TrialEvent, data?: any): void;
}

// 试用存储数据接口
export interface TrialStorageData {
  status: TrialStatus;
  lastSyncAt: number;
  version: string;
}

// 试用同步选项接口
export interface TrialSyncOptions {
  force?: boolean;
  skipValidation?: boolean;
  timeout?: number;
}

// 试用初始化选项接口
export interface TrialInitOptions {
  fingerprint?: string;
  autoSync?: boolean;
  syncInterval?: number;
  maxRetries?: number;
}

// 试用重置选项接口
export interface TrialResetOptions {
  reason?: string;
  preserveActions?: boolean;
  newFingerprint?: string;
}

// Types are exported via individual export statements above