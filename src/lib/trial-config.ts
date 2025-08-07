/**
 * 匿名试用系统配置
 */

import type { TrialConfig } from '@/types/trial';

// 试用系统配置常量
export const TRIAL_CONFIG: TrialConfig = {
  // 默认试用次数
  DEFAULT_TRIAL_COUNT: 5,
  
  // 最大试用次数（防止滥用）
  MAX_TRIAL_COUNT: 10,
  
  // 试用重置时间（小时）
  TRIAL_RESET_HOURS: 24,
  
  // Cookie名称
  COOKIE_NAME: 'yt_trial_status',
  
  // Cookie过期时间（天）
  COOKIE_EXPIRES_DAYS: 30,
  
  // 本地存储键名
  LOCAL_STORAGE_KEY: 'yt_anonymous_trial',
  
  // 设备被阻止的持续时间（小时）
  BLOCKED_DURATION_HOURS: 24,
  
  // 每小时最大操作次数（防刷机制）
  MAX_ACTIONS_PER_HOUR: 20,
} as const;

// 试用操作类型常量
export const TRIAL_ACTION_TYPES = {
  VIDEO_ANALYSIS: 'video_analysis',
  CHANNEL_ANALYSIS: 'channel_analysis',
  COMMENT_ANALYSIS: 'comment_analysis',
  EXPORT_DATA: 'export_data',
  SAVE_REPORT: 'save_report',
  BATCH_ANALYSIS: 'batch_analysis',
  GENERATE_REPORT: 'generate_report',
} as const;

// 试用操作类型定义在文件末尾

// 试用操作权重配置（不同操作消耗不同的试用次数）
export const TRIAL_ACTION_WEIGHTS: Record<TrialActionType, number> = {
  [TRIAL_ACTION_TYPES.VIDEO_ANALYSIS]: 1,
  [TRIAL_ACTION_TYPES.CHANNEL_ANALYSIS]: 2,
  [TRIAL_ACTION_TYPES.COMMENT_ANALYSIS]: 1,
  [TRIAL_ACTION_TYPES.EXPORT_DATA]: 1,
  [TRIAL_ACTION_TYPES.SAVE_REPORT]: 1,
  [TRIAL_ACTION_TYPES.BATCH_ANALYSIS]: 3,
  [TRIAL_ACTION_TYPES.GENERATE_REPORT]: 1,
};

// 试用错误消息
export const TRIAL_ERROR_MESSAGES = {
  TRIAL_EXHAUSTED: '试用次数已用完，请登录以继续使用',
  RATE_LIMITED: '操作过于频繁，请稍后再试',
  INVALID_FINGERPRINT: '设备识别失败，请刷新页面重试',
  BLOCKED_DEVICE: '设备已被暂时阻止，请稍后再试',
  SERVER_ERROR: '服务器错误，请稍后再试',
  VALIDATION_FAILED: '验证失败，请重新操作',
  STORAGE_ERROR: '存储错误，请检查浏览器设置',
} as const;

// 试用状态消息
export const TRIAL_STATUS_MESSAGES = {
  REMAINING: (count: number) => `还剩 ${count} 次免费试用机会`,
  LAST_CHANCE: '这是您的最后一次免费试用机会',
  EXHAUSTED: '免费试用已用完，登录获得更多使用机会',
  RESET_AVAILABLE: (hours: number) => `${hours} 小时后可重置试用次数`,
  LOGIN_BENEFITS: '登录后可享受无限制使用和更多高级功能',
} as const;

// 试用提示文案
export const TRIAL_PROMPTS = {
  GENTLE_REMINDER: {
    title: '免费试用提醒',
    message: '您还有免费试用机会，登录后可享受更多功能',
    urgency: 'low' as const,
  },
  LAST_CHANCE: {
    title: '最后一次机会',
    message: '这是您的最后一次免费试用，登录后可无限制使用',
    urgency: 'medium' as const,
  },
  TRIAL_EXHAUSTED: {
    title: '试用已结束',
    message: '免费试用已用完，登录即可继续使用所有功能',
    urgency: 'high' as const,
  },
  RATE_LIMITED: {
    title: '请稍后再试',
    message: '操作过于频繁，请稍后再试或登录获得更高使用限额',
    urgency: 'medium' as const,
  },
} as const;

// 导出配置
export default TRIAL_CONFIG;

export type TrialActionType = typeof TRIAL_ACTION_TYPES[keyof typeof TRIAL_ACTION_TYPES];