import { LoginTrigger, LoginContext } from '@/components/auth/SmartLoginModal';

/**
 * 登录场景触发器生成器
 * 提供预定义的登录场景配置，确保一致性和易用性
 */

export interface ScenarioOptions {
  actionName?: string;
  featureName?: string;
  format?: string;
  remainingTrials?: number;
  returnUrl?: string;
  metadata?: any;
}

/**
 * 生成试用次数用完的登录触发器
 */
export function createTrialExhaustedTrigger(options: ScenarioOptions = {}): {
  trigger: LoginTrigger;
  context: LoginContext;
} {
  const { remainingTrials = 0, returnUrl = '/', metadata = {} } = options;
  
  return {
    trigger: {
      type: 'trial_exhausted',
      message: remainingTrials === 0 
        ? '您已经使用完所有免费分析次数，登录后即可获得更多权益'
        : `您还剩 ${remainingTrials} 次免费分析机会，登录后可获得无限制使用`,
      urgency: remainingTrials === 0 ? 'high' : 'medium',
      allowSkip: remainingTrials > 0
    },
    context: {
      previousAction: 'trial_usage',
      returnUrl,
      metadata: {
        remainingTrials,
        ...metadata
      }
    }
  };
}

/**
 * 生成保存功能需要登录的触发器
 */
export function createSaveActionTrigger(options: ScenarioOptions = {}): {
  trigger: LoginTrigger;
  context: LoginContext;
} {
  const { actionName = '分析报告', returnUrl = '/', metadata = {} } = options;
  
  return {
    trigger: {
      type: 'save_action',
      message: `保存「${actionName}」需要登录，确保您的数据安全`,
      urgency: 'medium',
      allowSkip: true
    },
    context: {
      previousAction: 'save_action',
      returnUrl,
      metadata: {
        actionName,
        ...metadata
      }
    }
  };
}

/**
 * 生成高级功能需要登录的触发器
 */
export function createPremiumFeatureTrigger(options: ScenarioOptions = {}): {
  trigger: LoginTrigger;
  context: LoginContext;
} {
  const { featureName = '高级功能', returnUrl = '/', metadata = {} } = options;
  
  return {
    trigger: {
      type: 'premium_feature',
      message: `「${featureName}」是专为注册用户提供的高级功能`,
      urgency: 'medium',
      allowSkip: true
    },
    context: {
      previousAction: 'premium_feature_access',
      returnUrl,
      metadata: {
        featureName,
        ...metadata
      }
    }
  };
}

/**
 * 生成数据导出需要登录的触发器
 */
export function createDataExportTrigger(options: ScenarioOptions = {}): {
  trigger: LoginTrigger;
  context: LoginContext;
} {
  const { format = 'Excel', returnUrl = '/', metadata = {} } = options;
  
  return {
    trigger: {
      type: 'data_export',
      message: `为保护数据安全，导出${format}格式需要登录验证`,
      urgency: 'low',
      allowSkip: false
    },
    context: {
      previousAction: 'data_export',
      returnUrl,
      metadata: {
        format,
        ...metadata
      }
    }
  };
}

/**
 * 生成通用功能需要登录的触发器
 */
export function createFeatureRequiredTrigger(options: ScenarioOptions = {}): {
  trigger: LoginTrigger;
  context: LoginContext;
} {
  const { featureName = '此功能', returnUrl = '/', metadata = {} } = options;
  
  return {
    trigger: {
      type: 'feature_required',
      message: `${featureName}需要登录后才能使用`,
      urgency: 'low',
      allowSkip: true
    },
    context: {
      previousAction: 'feature_access',
      returnUrl,
      metadata: {
        featureName,
        ...metadata
      }
    }
  };
}

/**
 * 根据场景类型和选项快速创建触发器
 */
export function createLoginTrigger(
  scenarioType: 'trial_exhausted' | 'save_action' | 'premium_feature' | 'data_export' | 'feature_required',
  options: ScenarioOptions = {}
): { trigger: LoginTrigger; context: LoginContext } {
  switch (scenarioType) {
    case 'trial_exhausted':
      return createTrialExhaustedTrigger(options);
    case 'save_action':
      return createSaveActionTrigger(options);
    case 'premium_feature':
      return createPremiumFeatureTrigger(options);
    case 'data_export':
      return createDataExportTrigger(options);
    case 'feature_required':
    default:
      return createFeatureRequiredTrigger(options);
  }
}

/**
 * 预定义的常用场景配置
 */
export const COMMON_SCENARIOS = {
  // 视频分析相关
  VIDEO_ANALYSIS_TRIAL_EXHAUSTED: () => createTrialExhaustedTrigger({
    returnUrl: '/analysis',
    metadata: { feature: 'video_analysis' }
  }),
  
  SAVE_VIDEO_REPORT: (videoId?: string) => createSaveActionTrigger({
    actionName: '视频分析报告',
    returnUrl: '/reports',
    metadata: { videoId, reportType: 'video_analysis' }
  }),
  
  // 高级功能相关
  COMPETITOR_ANALYSIS: () => createPremiumFeatureTrigger({
    featureName: '竞品分析',
    returnUrl: '/premium/competitor',
    metadata: { feature: 'competitor_analysis' }
  }),
  
  TREND_PREDICTION: () => createPremiumFeatureTrigger({
    featureName: '趋势预测',
    returnUrl: '/premium/trends',
    metadata: { feature: 'trend_prediction' }
  }),
  
  BATCH_ANALYSIS: () => createPremiumFeatureTrigger({
    featureName: '批量分析',
    returnUrl: '/premium/batch',
    metadata: { feature: 'batch_analysis' }
  }),
  
  API_ACCESS: () => createPremiumFeatureTrigger({
    featureName: 'API访问',
    returnUrl: '/premium/api',
    metadata: { feature: 'api_access' }
  }),
  
  // 数据导出相关
  EXPORT_EXCEL: () => createDataExportTrigger({
    format: 'Excel',
    returnUrl: '/export',
    metadata: { format: 'xlsx' }
  }),
  
  EXPORT_PDF: () => createDataExportTrigger({
    format: 'PDF',
    returnUrl: '/export',
    metadata: { format: 'pdf' }
  }),
  
  EXPORT_CSV: () => createDataExportTrigger({
    format: 'CSV',
    returnUrl: '/export',
    metadata: { format: 'csv' }
  }),
  
  // 通用功能相关
  ACCESS_HISTORY: () => createFeatureRequiredTrigger({
    featureName: '历史记录',
    returnUrl: '/history',
    metadata: { feature: 'history' }
  }),
  
  ACCESS_FAVORITES: () => createFeatureRequiredTrigger({
    featureName: '收藏夹',
    returnUrl: '/favorites',
    metadata: { feature: 'favorites' }
  }),
  
  ACCESS_SETTINGS: () => createFeatureRequiredTrigger({
    featureName: '个人设置',
    returnUrl: '/settings',
    metadata: { feature: 'settings' }
  }),
  
  TEAM_COLLABORATION: () => createFeatureRequiredTrigger({
    featureName: '团队协作',
    returnUrl: '/team',
    metadata: { feature: 'team_collaboration' }
  })
} as const;

/**
 * 使用示例：
 * 
 * // 基础使用
 * const { trigger, context } = createTrialExhaustedTrigger();
 * 
 * // 带选项使用
 * const { trigger, context } = createSaveActionTrigger({
 *   actionName: '视频分析报告',
 *   returnUrl: '/reports'
 * });
 * 
 * // 使用预定义场景
 * const { trigger, context } = COMMON_SCENARIOS.VIDEO_ANALYSIS_TRIAL_EXHAUSTED();
 * 
 * // 在组件中使用
 * const handleSaveReport = () => {
 *   const { trigger, context } = COMMON_SCENARIOS.SAVE_VIDEO_REPORT(videoId);
 *   setLoginTrigger(trigger);
 *   setLoginContext(context);
 *   setShowLoginModal(true);
 * };
 */