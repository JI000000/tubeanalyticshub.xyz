/**
 * 功能识别和标记工具
 * 用于识别页面中需要登录的功能点并提供标记方案
 */

import { getFeatureConfig, getLoginRequiredFeatures, getTrialAllowedFeatures } from './feature-access-control';

// Re-export functions from feature-access-control
export { getFeatureConfig, getLoginRequiredFeatures, getTrialAllowedFeatures };

// 页面功能映射
export interface PageFeatureMapping {
  pagePath: string;
  pageTitle: string;
  features: {
    featureId: string;
    elementSelector?: string;
    description: string;
    location: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

// 应用功能映射配置
export const PAGE_FEATURE_MAPPINGS: PageFeatureMapping[] = [
  // 仪表板页面
  {
    pagePath: '/[locale]/dashboard',
    pageTitle: '仪表板',
    features: [
      {
        featureId: 'save_report',
        elementSelector: '[data-feature="save-dashboard-data"]',
        description: '保存仪表板数据和配置',
        location: '仪表板页面 - 保存按钮',
        priority: 'high'
      },
      {
        featureId: 'export_data',
        elementSelector: '[data-feature="export-dashboard"]',
        description: '导出仪表板数据',
        location: '仪表板页面 - 导出功能',
        priority: 'medium'
      },
      {
        featureId: 'advanced_analytics',
        elementSelector: '[data-feature="advanced-insights"]',
        description: '查看高级分析洞察',
        location: '仪表板页面 - 高级洞察卡片',
        priority: 'medium'
      }
    ]
  },
  
  // 视频分析页面
  {
    pagePath: '/[locale]/videos',
    pageTitle: '视频分析',
    features: [
      {
        featureId: 'video_analysis',
        elementSelector: '[data-feature="analyze-video"]',
        description: '分析YouTube视频数据',
        location: '视频页面 - 分析按钮',
        priority: 'high'
      },
      {
        featureId: 'save_report',
        elementSelector: '[data-feature="save-video-analysis"]',
        description: '保存视频分析报告',
        location: '视频页面 - 保存分析按钮',
        priority: 'high'
      },
      {
        featureId: 'bookmark_content',
        elementSelector: '[data-feature="bookmark-video"]',
        description: '收藏视频到个人收藏夹',
        location: '视频卡片 - 收藏按钮',
        priority: 'medium'
      },
      {
        featureId: 'advanced_analytics',
        elementSelector: '[data-feature="advanced-video-analysis"]',
        description: '使用高级AI分析视频',
        location: '视频页面 - 高级分析功能',
        priority: 'medium'
      },
      {
        featureId: 'export_data',
        elementSelector: '[data-feature="export-video-data"]',
        description: '导出视频分析数据',
        location: '视频页面 - 导出按钮',
        priority: 'medium'
      }
    ]
  },
  
  // 频道分析页面
  {
    pagePath: '/[locale]/channels',
    pageTitle: '频道分析',
    features: [
      {
        featureId: 'channel_analysis',
        elementSelector: '[data-feature="analyze-channel"]',
        description: '分析YouTube频道数据',
        location: '频道页面 - 分析按钮',
        priority: 'high'
      },
      {
        featureId: 'save_report',
        elementSelector: '[data-feature="save-channel-analysis"]',
        description: '保存频道分析报告',
        location: '频道页面 - 保存按钮',
        priority: 'high'
      },
      {
        featureId: 'bookmark_content',
        elementSelector: '[data-feature="bookmark-channel"]',
        description: '收藏频道',
        location: '频道卡片 - 收藏按钮',
        priority: 'medium'
      },
      {
        featureId: 'competitor_analysis',
        elementSelector: '[data-feature="competitor-analysis"]',
        description: '竞争对手分析',
        location: '频道页面 - 竞争分析按钮',
        priority: 'medium'
      }
    ]
  },
  
  // 报告页面
  {
    pagePath: '/[locale]/reports',
    pageTitle: '分析报告',
    features: [
      {
        featureId: 'generate_report',
        elementSelector: '[data-feature="create-report"]',
        description: '创建新的分析报告',
        location: '报告页面 - 创建报告按钮',
        priority: 'high'
      },
      {
        featureId: 'save_report',
        elementSelector: '[data-feature="save-report"]',
        description: '保存报告到账户',
        location: '报告页面 - 保存按钮',
        priority: 'high'
      },
      {
        featureId: 'view_history',
        elementSelector: '[data-feature="view-report-history"]',
        description: '查看历史报告',
        location: '报告页面 - 历史记录',
        priority: 'medium'
      },
      {
        featureId: 'share_content',
        elementSelector: '[data-feature="share-report"]',
        description: '分享报告',
        location: '报告卡片 - 分享按钮',
        priority: 'medium'
      },
      {
        featureId: 'export_data',
        elementSelector: '[data-feature="download-report"]',
        description: '下载报告',
        location: '报告卡片 - 下载按钮',
        priority: 'medium'
      }
    ]
  },
  
  // 数据导出页面
  {
    pagePath: '/[locale]/export',
    pageTitle: '数据导出',
    features: [
      {
        featureId: 'export_data',
        elementSelector: '[data-feature="export-csv"]',
        description: '导出CSV格式数据',
        location: '导出页面 - CSV导出按钮',
        priority: 'high'
      },
      {
        featureId: 'export_data',
        elementSelector: '[data-feature="export-json"]',
        description: '导出JSON格式数据',
        location: '导出页面 - JSON导出按钮',
        priority: 'high'
      },
      {
        featureId: 'export_data',
        elementSelector: '[data-feature="export-excel"]',
        description: '导出Excel格式数据',
        location: '导出页面 - Excel导出按钮',
        priority: 'high'
      },
      {
        featureId: 'export_data',
        elementSelector: '[data-feature="export-pdf"]',
        description: '导出PDF报告',
        location: '导出页面 - PDF导出按钮',
        priority: 'high'
      },
      {
        featureId: 'view_history',
        elementSelector: '[data-feature="export-history"]',
        description: '查看导出历史',
        location: '导出页面 - 历史记录',
        priority: 'medium'
      }
    ]
  },
  
  // AI洞察页面
  {
    pagePath: '/[locale]/insights',
    pageTitle: 'AI洞察',
    features: [
      {
        featureId: 'advanced_analytics',
        elementSelector: '[data-feature="generate-insights"]',
        description: '生成AI洞察',
        location: '洞察页面 - 生成洞察按钮',
        priority: 'high'
      },
      {
        featureId: 'save_report',
        elementSelector: '[data-feature="save-insights"]',
        description: '保存洞察报告',
        location: '洞察页面 - 保存按钮',
        priority: 'high'
      },
      {
        featureId: 'trend_analysis',
        elementSelector: '[data-feature="trend-analysis"]',
        description: '趋势分析',
        location: '洞察页面 - 趋势分析功能',
        priority: 'medium'
      }
    ]
  },
  
  // 评论分析页面
  {
    pagePath: '/[locale]/comments',
    pageTitle: '评论分析',
    features: [
      {
        featureId: 'comment_analysis',
        elementSelector: '[data-feature="analyze-comments"]',
        description: '分析视频评论',
        location: '评论页面 - 分析按钮',
        priority: 'high'
      },
      {
        featureId: 'save_report',
        elementSelector: '[data-feature="save-comment-analysis"]',
        description: '保存评论分析',
        location: '评论页面 - 保存按钮',
        priority: 'high'
      },
      {
        featureId: 'advanced_analytics',
        elementSelector: '[data-feature="sentiment-analysis"]',
        description: '情感分析',
        location: '评论页面 - 情感分析功能',
        priority: 'medium'
      }
    ]
  },
  
  // 竞争对手分析页面
  {
    pagePath: '/[locale]/competitor',
    pageTitle: '竞争对手分析',
    features: [
      {
        featureId: 'competitor_analysis',
        elementSelector: '[data-feature="competitor-analysis"]',
        description: '竞争对手分析',
        location: '竞争分析页面 - 分析功能',
        priority: 'high'
      },
      {
        featureId: 'save_report',
        elementSelector: '[data-feature="save-competitor-report"]',
        description: '保存竞争分析报告',
        location: '竞争分析页面 - 保存按钮',
        priority: 'high'
      },
      {
        featureId: 'advanced_analytics',
        elementSelector: '[data-feature="market-analysis"]',
        description: '市场分析',
        location: '竞争分析页面 - 市场分析功能',
        priority: 'medium'
      }
    ]
  },
  
  // 团队协作页面
  {
    pagePath: '/[locale]/team',
    pageTitle: '团队协作',
    features: [
      {
        featureId: 'team_collaboration',
        elementSelector: '[data-feature="team-invite"]',
        description: '邀请团队成员',
        location: '团队页面 - 邀请按钮',
        priority: 'high'
      },
      {
        featureId: 'share_content',
        elementSelector: '[data-feature="share-project"]',
        description: '分享项目',
        location: '团队页面 - 分享功能',
        priority: 'medium'
      },
      {
        featureId: 'create_project',
        elementSelector: '[data-feature="create-team-project"]',
        description: '创建团队项目',
        location: '团队页面 - 创建项目按钮',
        priority: 'high'
      }
    ]
  }
];

// 获取页面的功能映射
export function getPageFeatures(pagePath: string): PageFeatureMapping | null {
  return PAGE_FEATURE_MAPPINGS.find(mapping => mapping.pagePath === pagePath) || null;
}

// 获取所有需要标记的功能点
export function getAllFeaturesToMark(): Array<{
  featureId: string;
  pages: string[];
  priority: 'high' | 'medium' | 'low';
  requiresLogin: boolean;
  allowsTrial: boolean;
}> {
  const featureMap = new Map<string, {
    featureId: string;
    pages: string[];
    priority: 'high' | 'medium' | 'low';
    requiresLogin: boolean;
    allowsTrial: boolean;
  }>();
  
  // 遍历所有页面映射
  PAGE_FEATURE_MAPPINGS.forEach(pageMapping => {
    pageMapping.features.forEach(feature => {
      const existing = featureMap.get(feature.featureId);
      const config = getFeatureConfig(feature.featureId);
      
      if (existing) {
        existing.pages.push(pageMapping.pagePath);
        // 使用最高优先级
        if (feature.priority === 'high' || (feature.priority === 'medium' && existing.priority === 'low')) {
          existing.priority = feature.priority;
        }
      } else {
        featureMap.set(feature.featureId, {
          featureId: feature.featureId,
          pages: [pageMapping.pagePath],
          priority: feature.priority,
          requiresLogin: config ? ['authenticated', 'premium'].includes(config.accessLevel) : false,
          allowsTrial: config ? config.accessLevel === 'trial' : false
        });
      }
    });
  });
  
  return Array.from(featureMap.values());
}

// 生成功能标记报告
export function generateFeatureMarkingReport(): {
  summary: {
    totalFeatures: number;
    loginRequired: number;
    trialAllowed: number;
    publicFeatures: number;
  };
  byPage: Array<{
    pagePath: string;
    pageTitle: string;
    totalFeatures: number;
    loginRequiredFeatures: number;
    trialFeatures: number;
    features: Array<{
      featureId: string;
      description: string;
      accessLevel: string;
      priority: string;
    }>;
  }>;
  byFeature: Array<{
    featureId: string;
    accessLevel: string;
    usedInPages: number;
    pages: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
} {
  const allFeatures = getAllFeaturesToMark();
  
  // 汇总统计
  const summary = {
    totalFeatures: allFeatures.length,
    loginRequired: allFeatures.filter(f => f.requiresLogin).length,
    trialAllowed: allFeatures.filter(f => f.allowsTrial).length,
    publicFeatures: allFeatures.filter(f => !f.requiresLogin && !f.allowsTrial).length
  };
  
  // 按页面分组
  const byPage = PAGE_FEATURE_MAPPINGS.map(pageMapping => {
    const pageFeatures = pageMapping.features.map(feature => {
      const config = getFeatureConfig(feature.featureId);
      return {
        featureId: feature.featureId,
        description: feature.description,
        accessLevel: config?.accessLevel || 'unknown',
        priority: feature.priority
      };
    });
    
    return {
      pagePath: pageMapping.pagePath,
      pageTitle: pageMapping.pageTitle,
      totalFeatures: pageFeatures.length,
      loginRequiredFeatures: pageFeatures.filter(f => ['authenticated', 'premium'].includes(f.accessLevel)).length,
      trialFeatures: pageFeatures.filter(f => f.accessLevel === 'trial').length,
      features: pageFeatures
    };
  });
  
  // 按功能分组
  const byFeature = allFeatures.map(feature => {
    const config = getFeatureConfig(feature.featureId);
    return {
      featureId: feature.featureId,
      accessLevel: config?.accessLevel || 'unknown',
      usedInPages: feature.pages.length,
      pages: feature.pages,
      priority: feature.priority
    };
  });
  
  return {
    summary,
    byPage,
    byFeature
  };
}

// 获取高优先级需要标记的功能
export function getHighPriorityFeatures(): string[] {
  return getAllFeaturesToMark()
    .filter(feature => feature.priority === 'high')
    .map(feature => feature.featureId);
}

// 获取需要立即标记的功能（高优先级 + 需要登录）
export function getCriticalFeaturesToMark(): string[] {
  return getAllFeaturesToMark()
    .filter(feature => feature.priority === 'high' && feature.requiresLogin)
    .map(feature => feature.featureId);
}