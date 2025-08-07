/**
 * 匿名试用数据库操作服务
 */

import { createClient } from '@supabase/supabase-js';
import type { TrialAction, TrialStatus } from '@/types/trial';
import { TRIAL_CONFIG } from '@/lib/trial-config';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 内存缓存作为数据库不可用时的降级方案
const memoryCache = new Map<string, {
  remaining: number;
  total: number;
  actions: TrialAction[];
  lastReset: number;
  isBlocked: boolean;
  blockUntil?: number;
}>();

// 检查数据库表是否存在
let databaseAvailable = true;

async function checkDatabaseAvailability(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('yt_anonymous_trials')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // 表不存在
      console.warn('Anonymous trials table does not exist, using memory cache');
      databaseAvailable = false;
      return false;
    }
    
    databaseAvailable = true;
    return true;
  } catch (error) {
    console.warn('Database check failed, using memory cache:', error);
    databaseAvailable = false;
    return false;
  }
}

// 数据库中的匿名试用记录接口
interface AnonymousTrialRecord {
  id: string;
  fingerprint: string;
  ip_address: string | null;
  user_agent_hash: string | null;
  trial_count: number;
  max_trials: number;
  actions: TrialAction[];
  first_visit_at: string;
  last_action_at: string;
  last_reset_at: string;
  is_blocked: boolean;
  blocked_until: string | null;
  converted_user_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

// 登录分析记录接口
interface LoginAnalyticsRecord {
  session_id?: string;
  user_id?: string;
  fingerprint?: string;
  event_type: string;
  trigger_type?: string;
  provider?: string;
  context?: any;
  device_info?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * 匿名试用数据库服务
 */
export class AnonymousTrialsService {
  /**
   * 获取或创建匿名试用记录
   */
  static async getOrCreateTrialRecord(
    fingerprint: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AnonymousTrialRecord> {
    // 检查数据库可用性
    const dbAvailable = await checkDatabaseAvailability();
    
    if (!dbAvailable) {
      // 使用内存缓存
      return this.getOrCreateMemoryRecord(fingerprint, ipAddress, userAgent);
    }

    try {
      // 首先尝试获取现有记录
      const { data: existing, error: fetchError } = await supabase
        .from('yt_anonymous_trials')
        .select('*')
        .eq('fingerprint', fingerprint)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Database fetch failed, falling back to memory cache');
        return this.getOrCreateMemoryRecord(fingerprint, ipAddress, userAgent);
      }

      if (existing) {
        // 检查是否需要重置试用次数
        const lastReset = new Date(existing.last_reset_at);
        const resetInterval = TRIAL_CONFIG.TRIAL_RESET_HOURS * 60 * 60 * 1000;
        const shouldReset = Date.now() - lastReset.getTime() > resetInterval;

        if (shouldReset) {
          const { data: updated, error: updateError } = await supabase
            .from('yt_anonymous_trials')
            .update({
              trial_count: 0,
              max_trials: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
              last_reset_at: new Date().toISOString(),
              is_blocked: false,
              blocked_until: null,
              actions: [],
            })
            .eq('fingerprint', fingerprint)
            .select()
            .single();

          if (updateError) {
            console.warn('Database update failed, falling back to memory cache');
            return this.getOrCreateMemoryRecord(fingerprint, ipAddress, userAgent);
          }

          return updated;
        }

        return existing;
      }

      // 创建新记录
      const userAgentHash = userAgent ? 
        Buffer.from(userAgent).toString('base64').slice(0, 255) : null;

      const { data: newRecord, error: createError } = await supabase
        .from('yt_anonymous_trials')
        .insert({
          fingerprint,
          ip_address: ipAddress,
          user_agent_hash: userAgentHash,
          trial_count: 0,
          max_trials: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
          actions: [],
        })
        .select()
        .single();

      if (createError) {
        console.warn('Database insert failed, falling back to memory cache');
        return this.getOrCreateMemoryRecord(fingerprint, ipAddress, userAgent);
      }

      return newRecord;
    } catch (error) {
      console.warn('Database operation failed, falling back to memory cache:', error);
      return this.getOrCreateMemoryRecord(fingerprint, ipAddress, userAgent);
    }
  }

  /**
   * 内存缓存版本的获取或创建记录
   */
  private static getOrCreateMemoryRecord(
    fingerprint: string,
    ipAddress?: string,
    userAgent?: string
  ): AnonymousTrialRecord {
    let memoryData = memoryCache.get(fingerprint);
    
    if (!memoryData) {
      memoryData = {
        remaining: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
        total: TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
        actions: [],
        lastReset: Date.now(),
        isBlocked: false,
      };
      memoryCache.set(fingerprint, memoryData);
    }

    // 检查是否需要重置
    const resetInterval = TRIAL_CONFIG.TRIAL_RESET_HOURS * 60 * 60 * 1000;
    if (Date.now() - memoryData.lastReset > resetInterval) {
      memoryData.remaining = TRIAL_CONFIG.DEFAULT_TRIAL_COUNT;
      memoryData.total = TRIAL_CONFIG.DEFAULT_TRIAL_COUNT;
      memoryData.actions = [];
      memoryData.lastReset = Date.now();
      memoryData.isBlocked = false;
      delete memoryData.blockUntil;
      memoryCache.set(fingerprint, memoryData);
    }

    // 转换为数据库记录格式
    const now = new Date().toISOString();
    return {
      id: `memory-${fingerprint}`,
      fingerprint,
      ip_address: ipAddress || null,
      user_agent_hash: userAgent ? Buffer.from(userAgent).toString('base64').slice(0, 255) : null,
      trial_count: memoryData.total - memoryData.remaining,
      max_trials: memoryData.total,
      actions: memoryData.actions,
      first_visit_at: now,
      last_action_at: memoryData.actions.length > 0 
        ? memoryData.actions[memoryData.actions.length - 1].timestamp.toISOString()
        : now,
      last_reset_at: new Date(memoryData.lastReset).toISOString(),
      is_blocked: memoryData.isBlocked,
      blocked_until: memoryData.blockUntil ? new Date(memoryData.blockUntil).toISOString() : null,
      converted_user_id: null,
      converted_at: null,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * 消耗试用次数
   */
  static async consumeTrial(
    fingerprint: string,
    action: TrialAction,
    weight: number = 1
  ): Promise<{
    success: boolean;
    remaining: number;
    blocked: boolean;
    message: string;
    nextResetAt?: Date;
  }> {
    const record = await this.getOrCreateTrialRecord(
      fingerprint,
      action.ipAddress,
      action.metadata?.userAgent
    );

    // 检查是否被阻止
    if (record.is_blocked && record.blocked_until) {
      const blockedUntil = new Date(record.blocked_until);
      if (Date.now() < blockedUntil.getTime()) {
        return {
          success: false,
          remaining: record.max_trials - record.trial_count,
          blocked: true,
          message: '设备已被暂时阻止',
          nextResetAt: blockedUntil,
        };
      }
    }

    // 检查试用次数是否足够
    const remaining = record.max_trials - record.trial_count;
    if (remaining < weight) {
      // 阻止设备
      const blockedUntil = new Date(
        Date.now() + TRIAL_CONFIG.BLOCKED_DURATION_HOURS * 60 * 60 * 1000
      );

      if (databaseAvailable) {
        try {
          await supabase
            .from('yt_anonymous_trials')
            .update({
              is_blocked: true,
              blocked_until: blockedUntil.toISOString(),
              last_action_at: new Date().toISOString(),
            })
            .eq('fingerprint', fingerprint);
        } catch (error) {
          console.warn('Failed to update database, using memory cache');
          this.updateMemoryCache(fingerprint, { isBlocked: true, blockUntil: blockedUntil.getTime() });
        }
      } else {
        this.updateMemoryCache(fingerprint, { isBlocked: true, blockUntil: blockedUntil.getTime() });
      }

      const resetAt = new Date(
        new Date(record.last_reset_at).getTime() + 
        TRIAL_CONFIG.TRIAL_RESET_HOURS * 60 * 60 * 1000
      );

      return {
        success: false,
        remaining: 0,
        blocked: true,
        message: '试用次数已用完',
        nextResetAt: resetAt,
      };
    }

    // 更新试用记录
    const newActions = [...record.actions, action];
    // 保持操作记录在合理范围内
    if (newActions.length > 100) {
      newActions.splice(0, newActions.length - 100);
    }

    if (databaseAvailable) {
      try {
        const { error: updateError } = await supabase
          .from('yt_anonymous_trials')
          .update({
            trial_count: record.trial_count + weight,
            actions: newActions,
            last_action_at: new Date().toISOString(),
            // 如果之前被阻止但现在可以使用，解除阻止
            is_blocked: false,
            blocked_until: null,
          })
          .eq('fingerprint', fingerprint);

        if (updateError) {
          console.warn('Failed to update database, using memory cache');
          this.updateMemoryCache(fingerprint, { 
            remaining: remaining - weight, 
            actions: newActions,
            isBlocked: false 
          });
        }
      } catch (error) {
        console.warn('Database update failed, using memory cache:', error);
        this.updateMemoryCache(fingerprint, { 
          remaining: remaining - weight, 
          actions: newActions,
          isBlocked: false 
        });
      }
    } else {
      this.updateMemoryCache(fingerprint, { 
        remaining: remaining - weight, 
        actions: newActions,
        isBlocked: false 
      });
    }

    const newRemaining = remaining - weight;
    return {
      success: true,
      remaining: newRemaining,
      blocked: false,
      message: newRemaining > 0 
        ? `还剩 ${newRemaining} 次试用机会` 
        : '试用次数已用完，请登录继续使用',
    };
  }

  /**
   * 更新内存缓存
   */
  private static updateMemoryCache(fingerprint: string, updates: Partial<{
    remaining: number;
    actions: TrialAction[];
    isBlocked: boolean;
    blockUntil?: number;
  }>): void {
    const existing = memoryCache.get(fingerprint);
    if (existing) {
      Object.assign(existing, updates);
      memoryCache.set(fingerprint, existing);
    }
  }

  /**
   * 获取试用状态
   */
  static async getTrialStatus(fingerprint: string): Promise<TrialStatus | null> {
    const record = await this.getOrCreateTrialRecord(fingerprint);
    
    return {
      remaining: record.max_trials - record.trial_count,
      total: record.max_trials,
      fingerprint: record.fingerprint,
      lastUsed: new Date(record.last_action_at),
      actions: record.actions,
      isBlocked: record.is_blocked,
      resetAt: record.blocked_until ? new Date(record.blocked_until) : undefined,
    };
  }

  /**
   * 检查速率限制
   */
  static async checkRateLimit(
    fingerprint: string,
    ipAddress?: string
  ): Promise<{ allowed: boolean; remaining: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (databaseAvailable) {
      try {
        // 查询最近一小时的操作次数
        const { data: record } = await supabase
          .from('yt_anonymous_trials')
          .select('actions')
          .eq('fingerprint', fingerprint)
          .single();

        if (!record) {
          return { allowed: true, remaining: TRIAL_CONFIG.MAX_ACTIONS_PER_HOUR };
        }

        // 计算最近一小时的操作次数
        const recentActions = record.actions.filter((action: TrialAction) => 
          new Date(action.timestamp) > oneHourAgo
        );

        const count = recentActions.length;
        const allowed = count < TRIAL_CONFIG.MAX_ACTIONS_PER_HOUR;
        const remaining = Math.max(0, TRIAL_CONFIG.MAX_ACTIONS_PER_HOUR - count);

        return { allowed, remaining };
      } catch (error) {
        console.warn('Database rate limit check failed, using memory cache');
      }
    }

    // 使用内存缓存检查速率限制
    const memoryData = memoryCache.get(fingerprint);
    if (!memoryData) {
      return { allowed: true, remaining: TRIAL_CONFIG.MAX_ACTIONS_PER_HOUR };
    }

    const recentActions = memoryData.actions.filter(action => 
      action.timestamp.getTime() > oneHourAgo.getTime()
    );

    const count = recentActions.length;
    const allowed = count < TRIAL_CONFIG.MAX_ACTIONS_PER_HOUR;
    const remaining = Math.max(0, TRIAL_CONFIG.MAX_ACTIONS_PER_HOUR - count);

    return { allowed, remaining };
  }

  /**
   * 记录登录分析事件
   */
  static async recordLoginAnalytics(
    data: LoginAnalyticsRecord
  ): Promise<void> {
    if (!databaseAvailable) {
      console.log('Login analytics (memory only):', data);
      return;
    }

    try {
      const { error } = await supabase
        .from('yt_login_analytics')
        .insert(data);

      if (error) {
        console.error('Failed to record login analytics:', error);
        // 不抛出错误，避免影响主要功能
      }
    } catch (error) {
      console.error('Failed to record login analytics:', error);
    }
  }

  /**
   * 标记用户已转化
   */
  static async markUserConverted(
    fingerprint: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('yt_anonymous_trials')
      .update({
        converted_user_id: userId,
        converted_at: new Date().toISOString(),
      })
      .eq('fingerprint', fingerprint);

    if (error) {
      console.error('Failed to mark user as converted:', error);
    }
  }

  /**
   * 获取试用统计信息
   */
  static async getTrialStats(fingerprint: string): Promise<{
    totalActions: number;
    actionsToday: number;
    actionsThisHour: number;
    lastActionAt: Date | null;
  }> {
    let actions: TrialAction[] = [];
    let lastActionAt: Date | null = null;

    if (databaseAvailable) {
      try {
        const { data: record } = await supabase
          .from('yt_anonymous_trials')
          .select('actions, last_action_at')
          .eq('fingerprint', fingerprint)
          .single();

        if (record) {
          actions = record.actions as TrialAction[];
          lastActionAt = record.last_action_at ? new Date(record.last_action_at) : null;
        }
      } catch (error) {
        console.warn('Database stats query failed, using memory cache');
      }
    }

    // 如果数据库不可用或查询失败，使用内存缓存
    if (actions.length === 0) {
      const memoryData = memoryCache.get(fingerprint);
      if (memoryData) {
        actions = memoryData.actions;
        lastActionAt = actions.length > 0 
          ? actions[actions.length - 1].timestamp 
          : null;
      }
    }

    if (actions.length === 0) {
      return {
        totalActions: 0,
        actionsToday: 0,
        actionsThisHour: 0,
        lastActionAt: null,
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    const actionsToday = actions.filter(
      action => new Date(action.timestamp) >= todayStart
    ).length;

    const actionsThisHour = actions.filter(
      action => new Date(action.timestamp) >= hourStart
    ).length;

    return {
      totalActions: actions.length,
      actionsToday,
      actionsThisHour,
      lastActionAt,
    };
  }

  /**
   * 清理过期数据
   */
  static async cleanupExpiredData(): Promise<void> {
    const { error } = await supabase.rpc('cleanup_expired_anonymous_trials');
    
    if (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }
}