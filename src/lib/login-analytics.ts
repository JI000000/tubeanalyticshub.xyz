/**
 * 登录数据分析和跟踪服务
 * 实现登录提示显示、尝试、成功率等数据收集和分析
 */

import { createSupabaseServiceClient } from '@/lib/supabase';
import type { LoginTrigger, LoginContext } from '@/components/auth/SmartLoginModal';

// 创建Supabase客户端
const supabase = createSupabaseServiceClient();

// 登录分析事件类型
export type LoginAnalyticsEventType = 
  | 'prompt_shown'           // 登录提示显示
  | 'login_attempt'          // 登录尝试
  | 'login_success'          // 登录成功
  | 'login_failed'           // 登录失败
  | 'login_cancelled'        // 登录取消
  | 'login_skipped'          // 登录跳过
  | 'trial_consumed'         // 试用消耗
  | 'rate_limited'           // 速率限制
  | 'error'                  // 错误事件
  | 'session_activity'       // 会话活动
  | 'signout'                // 登出
  | 'logout_intent';         // 登出意图

// 登录触发类型
export type LoginTriggerType = 
  | 'trial_exhausted'        // 试用耗尽
  | 'feature_required'       // 功能需要登录
  | 'save_action'            // 保存操作
  | 'premium_feature'        // 高级功能
  | 'manual'                 // 手动触发
  | 'auto';                  // 自动触发

// 登录提供商类型
export type LoginProviderType = 
  | 'github'
  | 'google'
  | 'email'
  | 'anonymous';

// 登录分析记录接口
export interface LoginAnalyticsRecord {
  session_id?: string;
  user_id?: string;
  fingerprint?: string;
  event_type: LoginAnalyticsEventType;
  trigger_type?: LoginTriggerType;
  provider?: LoginProviderType;
  context?: {
    previous_action?: string;
    return_url?: string;
    urgency?: 'low' | 'medium' | 'high';
    allow_skip?: boolean;
    trial_remaining?: number;
    error_code?: string;
    error_message?: string;
    retry_count?: number;
    [key: string]: any;
  };
  device_info?: {
    user_agent?: string;
    screen_width?: number;
    screen_height?: number;
    is_mobile?: boolean;
    browser?: string;
    os?: string;
    [key: string]: any;
  };
  ip_address?: string;
  user_agent?: string;
}

// 登录漏斗分析数据
export interface LoginFunnelData {
  step: 'prompt_shown' | 'login_attempt' | 'login_success';
  count: number;
  conversion_rate: number;
  drop_off_rate: number;
}

// 登录转化率统计
export interface LoginConversionStats {
  total_prompts: number;
  total_attempts: number;
  total_successes: number;
  total_cancellations: number;
  total_skips: number;
  
  prompt_to_attempt_rate: number;
  attempt_to_success_rate: number;
  overall_conversion_rate: number;
  
  by_provider: Record<LoginProviderType, {
    attempts: number;
    successes: number;
    success_rate: number;
  }>;
  
  by_trigger: Record<LoginTriggerType, {
    prompts: number;
    attempts: number;
    successes: number;
    conversion_rate: number;
  }>;
  
  by_urgency: Record<'low' | 'medium' | 'high', {
    prompts: number;
    attempts: number;
    successes: number;
    conversion_rate: number;
  }>;
}

// 设备信息收集
function getDeviceInfo(): LoginAnalyticsRecord['device_info'] {
  if (typeof window === 'undefined') return {};
  
  return {
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    is_mobile: window.innerWidth < 768,
    browser: getBrowserName(),
    os: getOSName(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

// 获取浏览器名称
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// 获取操作系统名称
function getOSName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

// 获取客户端IP地址（通过第三方服务）
async function getClientIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Failed to get client IP:', error);
    return undefined;
  }
}

/**
 * 登录分析服务
 */
export class LoginAnalyticsService {
  /**
   * 记录登录分析事件
   */
  static async recordEvent(
    eventType: LoginAnalyticsEventType,
    data: Partial<LoginAnalyticsRecord> = {}
  ): Promise<void> {
    try {
      const record: LoginAnalyticsRecord = {
        event_type: eventType,
        device_info: getDeviceInfo(),
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        ...data,
      };

      const { error } = await supabase
        .from('yt_login_analytics')
        .insert(record);

      if (error) {
        console.error('Failed to record login analytics:', error);
      }
    } catch (error) {
      console.error('Failed to record login analytics:', error);
    }
  }

  /**
   * 记录登录提示显示事件
   */
  static async recordPromptShown(
    trigger: LoginTrigger,
    context: LoginContext,
    fingerprint?: string,
    trialRemaining?: number
  ): Promise<void> {
    await this.recordEvent('prompt_shown', {
      fingerprint,
      trigger_type: trigger.type as LoginTriggerType,
      context: {
        previous_action: context.previousAction,
        return_url: context.returnUrl,
        urgency: trigger.urgency,
        allow_skip: trigger.allowSkip,
        trial_remaining: trialRemaining,
        message: trigger.message,
        ...context.metadata,
      },
    });
  }

  /**
   * 记录登录尝试事件
   */
  static async recordLoginAttempt(
    provider: LoginProviderType,
    context?: Partial<LoginContext>,
    fingerprint?: string,
    retryCount: number = 0
  ): Promise<void> {
    await this.recordEvent('login_attempt', {
      fingerprint,
      provider,
      context: {
        retry_count: retryCount,
        ...context,
      },
    });
  }

  /**
   * 记录登录成功事件
   */
  static async recordLoginSuccess(
    provider: LoginProviderType,
    userId: string,
    context?: Partial<LoginContext>,
    fingerprint?: string,
    isNewUser: boolean = false
  ): Promise<void> {
    await this.recordEvent('login_success', {
      user_id: userId,
      fingerprint,
      provider,
      context: {
        is_new_user: isNewUser,
        ...context,
      },
    });
  }

  /**
   * 记录登录失败事件
   */
  static async recordLoginFailed(
    provider: LoginProviderType,
    errorCode: string,
    errorMessage: string,
    context?: Partial<LoginContext>,
    fingerprint?: string,
    retryCount: number = 0
  ): Promise<void> {
    await this.recordEvent('login_failed', {
      fingerprint,
      provider,
      context: {
        error_code: errorCode,
        error_message: errorMessage,
        retry_count: retryCount,
        ...context,
      },
    });
  }

  /**
   * 记录登录取消事件
   */
  static async recordLoginCancelled(
    trigger?: LoginTrigger,
    context?: Partial<LoginContext>,
    fingerprint?: string
  ): Promise<void> {
    await this.recordEvent('login_cancelled', {
      fingerprint,
      trigger_type: trigger?.type as LoginTriggerType,
      context: {
        urgency: trigger?.urgency,
        ...context,
      },
    });
  }

  /**
   * 记录登录跳过事件
   */
  static async recordLoginSkipped(
    trigger: LoginTrigger,
    context: LoginContext,
    fingerprint?: string
  ): Promise<void> {
    await this.recordEvent('login_skipped', {
      fingerprint,
      trigger_type: trigger.type as LoginTriggerType,
      context: {
        previous_action: context.previousAction,
        return_url: context.returnUrl,
        urgency: trigger.urgency,
        ...context.metadata,
      },
    });
  }

  /**
   * 获取登录转化率统计
   */
  static async getConversionStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<LoginConversionStats> {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 默认7天前
    const end = endDate || new Date();

    try {
      const { data, error } = await supabase
        .from('yt_login_analytics')
        .select('event_type, trigger_type, provider, context')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .in('event_type', [
          'prompt_shown',
          'login_attempt', 
          'login_success',
          'login_cancelled',
          'login_skipped'
        ]);

      if (error) {
        console.error('Failed to get conversion stats:', error);
        return this.getEmptyConversionStats();
      }

      return this.calculateConversionStats(data || []);
    } catch (error) {
      console.error('Failed to get conversion stats:', error);
      return this.getEmptyConversionStats();
    }
  }

  /**
   * 计算转化率统计
   */
  private static calculateConversionStats(data: any[]): LoginConversionStats {
    const stats: LoginConversionStats = {
      total_prompts: 0,
      total_attempts: 0,
      total_successes: 0,
      total_cancellations: 0,
      total_skips: 0,
      prompt_to_attempt_rate: 0,
      attempt_to_success_rate: 0,
      overall_conversion_rate: 0,
      by_provider: {
        github: { attempts: 0, successes: 0, success_rate: 0 },
        google: { attempts: 0, successes: 0, success_rate: 0 },
        email: { attempts: 0, successes: 0, success_rate: 0 },
        anonymous: { attempts: 0, successes: 0, success_rate: 0 },
      },
      by_trigger: {
        trial_exhausted: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        feature_required: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        save_action: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        premium_feature: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        manual: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        auto: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
      },
      by_urgency: {
        low: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        medium: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        high: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
      },
    };

    // 统计各种事件
    data.forEach(record => {
      const { event_type, trigger_type, provider, context } = record;
      
      switch (event_type) {
        case 'prompt_shown':
          stats.total_prompts++;
          if (trigger_type && stats.by_trigger[trigger_type as LoginTriggerType]) {
            stats.by_trigger[trigger_type as LoginTriggerType].prompts++;
          }
          if (context?.urgency && stats.by_urgency[context.urgency as 'low' | 'medium' | 'high']) {
            stats.by_urgency[context.urgency as 'low' | 'medium' | 'high'].prompts++;
          }
          break;
          
        case 'login_attempt':
          stats.total_attempts++;
          if (provider && stats.by_provider[provider as LoginProviderType]) {
            stats.by_provider[provider as LoginProviderType].attempts++;
          }
          if (trigger_type && stats.by_trigger[trigger_type as LoginTriggerType]) {
            stats.by_trigger[trigger_type as LoginTriggerType].attempts++;
          }
          if (context?.urgency && stats.by_urgency[context.urgency as 'low' | 'medium' | 'high']) {
            stats.by_urgency[context.urgency as 'low' | 'medium' | 'high'].attempts++;
          }
          break;
          
        case 'login_success':
          stats.total_successes++;
          if (provider && stats.by_provider[provider as LoginProviderType]) {
            stats.by_provider[provider as LoginProviderType].successes++;
          }
          if (trigger_type && stats.by_trigger[trigger_type as LoginTriggerType]) {
            stats.by_trigger[trigger_type as LoginTriggerType].successes++;
          }
          if (context?.urgency && stats.by_urgency[context.urgency as 'low' | 'medium' | 'high']) {
            stats.by_urgency[context.urgency as 'low' | 'medium' | 'high'].successes++;
          }
          break;
          
        case 'login_cancelled':
          stats.total_cancellations++;
          break;
          
        case 'login_skipped':
          stats.total_skips++;
          break;
      }
    });

    // 计算转化率
    stats.prompt_to_attempt_rate = stats.total_prompts > 0 
      ? (stats.total_attempts / stats.total_prompts) * 100 
      : 0;
      
    stats.attempt_to_success_rate = stats.total_attempts > 0 
      ? (stats.total_successes / stats.total_attempts) * 100 
      : 0;
      
    stats.overall_conversion_rate = stats.total_prompts > 0 
      ? (stats.total_successes / stats.total_prompts) * 100 
      : 0;

    // 计算各提供商成功率
    Object.keys(stats.by_provider).forEach(provider => {
      const providerStats = stats.by_provider[provider as LoginProviderType];
      providerStats.success_rate = providerStats.attempts > 0 
        ? (providerStats.successes / providerStats.attempts) * 100 
        : 0;
    });

    // 计算各触发类型转化率
    Object.keys(stats.by_trigger).forEach(trigger => {
      const triggerStats = stats.by_trigger[trigger as LoginTriggerType];
      triggerStats.conversion_rate = triggerStats.prompts > 0 
        ? (triggerStats.successes / triggerStats.prompts) * 100 
        : 0;
    });

    // 计算各紧急程度转化率
    Object.keys(stats.by_urgency).forEach(urgency => {
      const urgencyStats = stats.by_urgency[urgency as 'low' | 'medium' | 'high'];
      urgencyStats.conversion_rate = urgencyStats.prompts > 0 
        ? (urgencyStats.successes / urgencyStats.prompts) * 100 
        : 0;
    });

    return stats;
  }

  /**
   * 获取空的转化率统计（用于错误情况）
   */
  private static getEmptyConversionStats(): LoginConversionStats {
    return {
      total_prompts: 0,
      total_attempts: 0,
      total_successes: 0,
      total_cancellations: 0,
      total_skips: 0,
      prompt_to_attempt_rate: 0,
      attempt_to_success_rate: 0,
      overall_conversion_rate: 0,
      by_provider: {
        github: { attempts: 0, successes: 0, success_rate: 0 },
        google: { attempts: 0, successes: 0, success_rate: 0 },
        email: { attempts: 0, successes: 0, success_rate: 0 },
        anonymous: { attempts: 0, successes: 0, success_rate: 0 },
      },
      by_trigger: {
        trial_exhausted: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        feature_required: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        save_action: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        premium_feature: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        manual: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        auto: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
      },
      by_urgency: {
        low: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        medium: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
        high: { prompts: 0, attempts: 0, successes: 0, conversion_rate: 0 },
      },
    };
  }

  /**
   * 获取登录漏斗分析数据
   */
  static async getFunnelData(
    startDate?: Date,
    endDate?: Date
  ): Promise<LoginFunnelData[]> {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    try {
      const { data, error } = await supabase
        .from('yt_login_analytics')
        .select('event_type')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .in('event_type', ['prompt_shown', 'login_attempt', 'login_success']);

      if (error) {
        console.error('Failed to get funnel data:', error);
        return [];
      }

      const counts = {
        prompt_shown: 0,
        login_attempt: 0,
        login_success: 0,
      };

      data?.forEach(record => {
        if (record.event_type in counts) {
          counts[record.event_type as keyof typeof counts]++;
        }
      });

      const funnel: LoginFunnelData[] = [
        {
          step: 'prompt_shown',
          count: counts.prompt_shown,
          conversion_rate: 100, // 第一步转化率为100%
          drop_off_rate: 0,
        },
        {
          step: 'login_attempt',
          count: counts.login_attempt,
          conversion_rate: counts.prompt_shown > 0 
            ? (counts.login_attempt / counts.prompt_shown) * 100 
            : 0,
          drop_off_rate: counts.prompt_shown > 0 
            ? ((counts.prompt_shown - counts.login_attempt) / counts.prompt_shown) * 100 
            : 0,
        },
        {
          step: 'login_success',
          count: counts.login_success,
          conversion_rate: counts.login_attempt > 0 
            ? (counts.login_success / counts.login_attempt) * 100 
            : 0,
          drop_off_rate: counts.login_attempt > 0 
            ? ((counts.login_attempt - counts.login_success) / counts.login_attempt) * 100 
            : 0,
        },
      ];

      return funnel;
    } catch (error) {
      console.error('Failed to get funnel data:', error);
      return [];
    }
  }

  /**
   * 获取时间序列数据（用于趋势分析）
   */
  static async getTimeSeriesData(
    eventType: LoginAnalyticsEventType,
    startDate?: Date,
    endDate?: Date,
    interval: 'hour' | 'day' | 'week' = 'day'
  ): Promise<Array<{ date: string; count: number }>> {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    try {
      const { data, error } = await supabase
        .from('yt_login_analytics')
        .select('created_at')
        .eq('event_type', eventType)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at');

      if (error) {
        console.error('Failed to get time series data:', error);
        return [];
      }

      // 按时间间隔分组数据
      const groupedData = new Map<string, number>();
      
      data?.forEach(record => {
        const date = new Date(record.created_at);
        let key: string;
        
        switch (interval) {
          case 'hour':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
            break;
          default: // day
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        
        groupedData.set(key, (groupedData.get(key) || 0) + 1);
      });

      return Array.from(groupedData.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Failed to get time series data:', error);
      return [];
    }
  }
}