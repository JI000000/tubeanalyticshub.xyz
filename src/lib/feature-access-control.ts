/**
 * 功能访问控制配置
 * 定义哪些功能需要登录，哪些可以匿名试用
 */

import type { TrialActionType } from '@/lib/trial-config';

// 功能访问级别
export type AccessLevel = 'public' | 'trial' | 'authenticated' | 'premium';

// 功能访问配置
export interface FeatureConfig {
  // 访问级别
  accessLevel: AccessLevel;
  
  // 试用配置（仅当 accessLevel 为 'trial' 时有效）
  trialAction?: TrialActionType;
  
  // 功能描述
  description: string;
  
  // 登录提示消息
  loginMessage?: string;
  
  // 登录后的权益说明
  loginBenefits?: string[];
  
  // 是否允许跳过登录
  allowSkip?: boolean;
  
  // 紧急程度
  urgency?: 'low' | 'medium' | 'high';
}

// 功能访问控制配置
export const FEATURE_ACCESS_CONFIG: Record<string, FeatureConfig> = {
  // ===== YouTube分析功能 =====
  
  // 基础视频分析 - 允许试用
  'video_analysis': {
    accessLevel: 'trial',
    trialAction: 'video_analysis',
    description: 'YouTube视频数据分析',
    loginMessage: '继续分析更多视频需要登录',
    loginBenefits: [
      '无限制分析任意YouTube视频',
      '保存分析历史记录',
      '导出分析报告',
      '获得更详细的AI洞察'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // 频道分析 - 允许试用
  'channel_analysis': {
    accessLevel: 'trial',
    trialAction: 'channel_analysis',
    description: 'YouTube频道数据分析',
    loginMessage: '深度分析频道数据需要登录',
    loginBenefits: [
      '分析任意YouTube频道',
      '跟踪频道增长趋势',
      '对比竞争对手数据',
      '获得专业分析报告'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // 评论分析 - 允许试用
  'comment_analysis': {
    accessLevel: 'trial',
    trialAction: 'comment_analysis',
    description: 'YouTube评论情感分析',
    loginMessage: '分析更多评论数据需要登录',
    loginBenefits: [
      '批量分析视频评论',
      '情感趋势分析',
      '关键词提取',
      '用户画像分析'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // ===== 保存功能 - 需要登录 =====
  
  // 保存分析报告
  'save_report': {
    accessLevel: 'authenticated',
    description: '保存分析报告到个人账户',
    loginMessage: '保存分析报告需要登录，避免丢失宝贵的分析结果',
    loginBenefits: [
      '永久保存所有分析报告',
      '随时查看历史分析',
      '多设备同步访问',
      '分享报告给团队成员'
    ],
    allowSkip: false,
    urgency: 'high'
  },
  
  // 创建项目/收藏
  'create_project': {
    accessLevel: 'authenticated',
    description: '创建项目或收藏夹',
    loginMessage: '创建项目需要登录，更好地组织您的分析内容',
    loginBenefits: [
      '创建无限项目和收藏夹',
      '按项目组织分析内容',
      '团队协作和分享',
      '项目进度跟踪'
    ],
    allowSkip: false,
    urgency: 'high'
  },
  
  // 收藏视频/频道
  'bookmark_content': {
    accessLevel: 'authenticated',
    description: '收藏视频或频道',
    loginMessage: '收藏功能需要登录，建立您的专属内容库',
    loginBenefits: [
      '收藏感兴趣的视频和频道',
      '快速访问收藏内容',
      '收藏内容分类管理',
      '收藏数据云端同步'
    ],
    allowSkip: true,
    urgency: 'medium'
  },
  
  // ===== 历史记录功能 - 需要登录 =====
  
  // 查看分析历史
  'view_history': {
    accessLevel: 'authenticated',
    description: '查看分析历史记录',
    loginMessage: '查看历史记录需要登录，管理您的所有分析数据',
    loginBenefits: [
      '查看完整分析历史',
      '按时间和类型筛选',
      '重新访问历史分析',
      '历史数据统计分析'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // 管理收藏夹
  'manage_favorites': {
    accessLevel: 'authenticated',
    description: '管理收藏夹和书签',
    loginMessage: '管理收藏内容需要登录',
    loginBenefits: [
      '统一管理所有收藏',
      '创建收藏分类',
      '批量操作收藏内容',
      '收藏内容搜索'
    ],
    allowSkip: false,
    urgency: 'low'
  },
  
  // ===== 高级分析功能 - 需要登录 =====
  
  // 高级AI分析
  'advanced_analytics': {
    accessLevel: 'authenticated',
    description: '高级AI分析功能',
    loginMessage: '高级分析功能需要登录，解锁更深度的数据洞察',
    loginBenefits: [
      '使用最新AI模型分析',
      '获得更详细的洞察报告',
      '趋势预测和建议',
      '竞争对手深度分析'
    ],
    allowSkip: false,
    urgency: 'high'
  },
  
  // 竞争对手分析
  'competitor_analysis': {
    accessLevel: 'authenticated',
    description: '竞争对手分析',
    loginMessage: '竞争对手分析需要登录，获得专业的市场洞察',
    loginBenefits: [
      '对比多个竞争对手',
      '市场份额分析',
      '内容策略对比',
      '增长趋势预测'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // 趋势分析
  'trend_analysis': {
    accessLevel: 'authenticated',
    description: '内容趋势分析',
    loginMessage: '趋势分析需要登录，把握内容创作方向',
    loginBenefits: [
      '识别热门内容趋势',
      '预测未来趋势方向',
      '个性化趋势推荐',
      '行业趋势报告'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // ===== 数据导出功能 - 需要登录 =====
  
  // 导出数据
  'export_data': {
    accessLevel: 'authenticated',
    description: '导出分析数据',
    loginMessage: '数据导出需要登录，确保数据安全和归属权',
    loginBenefits: [
      '导出多种格式数据',
      '批量导出历史数据',
      '自定义导出字段',
      '定期自动导出'
    ],
    allowSkip: false,
    urgency: 'high'
  },
  
  // 生成报告
  'generate_report': {
    accessLevel: 'trial',
    trialAction: 'generate_report',
    description: '生成分析报告',
    loginMessage: '生成更多报告需要登录',
    loginBenefits: [
      '生成无限数量报告',
      '自定义报告模板',
      '定期自动生成报告',
      '报告分享和协作'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // ===== 团队协作功能 - 需要登录 =====
  
  // 团队协作
  'team_collaboration': {
    accessLevel: 'authenticated',
    description: '团队协作功能',
    loginMessage: '团队协作需要登录，与团队成员共享分析结果',
    loginBenefits: [
      '邀请团队成员',
      '共享分析项目',
      '协作编辑报告',
      '团队权限管理'
    ],
    allowSkip: false,
    urgency: 'medium'
  },
  
  // 分享内容
  'share_content': {
    accessLevel: 'authenticated',
    description: '分享分析内容',
    loginMessage: '分享功能需要登录，安全地分享您的分析成果',
    loginBenefits: [
      '生成分享链接',
      '控制分享权限',
      '分享数据统计',
      '分享内容管理'
    ],
    allowSkip: true,
    urgency: 'low'
  },
  
  // ===== API访问 - 需要登录 =====
  
  // API访问
  'api_access': {
    accessLevel: 'authenticated',
    description: 'API接口访问',
    loginMessage: 'API访问需要认证，获得开发者API密钥',
    loginBenefits: [
      '获得API访问密钥',
      '程序化访问数据',
      'API使用统计',
      '技术支持服务'
    ],
    allowSkip: false,
    urgency: 'low'
  },
  
  // ===== 个人设置 - 需要登录 =====
  
  // 用户设置
  'user_settings': {
    accessLevel: 'authenticated',
    description: '个人设置和偏好',
    loginMessage: '个人设置需要登录',
    loginBenefits: [
      '自定义界面偏好',
      '通知设置管理',
      '数据隐私控制',
      '账户安全设置'
    ],
    allowSkip: false,
    urgency: 'low'
  },
  
  // 账户管理
  'account_management': {
    accessLevel: 'authenticated',
    description: '账户管理',
    loginMessage: '账户管理需要登录',
    loginBenefits: [
      '查看账户信息',
      '管理订阅计划',
      '查看使用统计',
      '账户安全管理'
    ],
    allowSkip: false,
    urgency: 'low'
  },
  
  // ===== 高级功能 - 需要付费 =====
  
  // 管理面板
  'admin_panel': {
    accessLevel: 'premium',
    description: '管理员面板',
    loginMessage: '管理功能需要高级账户',
    loginBenefits: [
      '用户管理',
      '系统监控',
      '数据统计',
      '高级配置'
    ],
    allowSkip: false,
    urgency: 'low'
  }
};

// 获取功能配置
export function getFeatureConfig(featureId: string): FeatureConfig | null {
  return FEATURE_ACCESS_CONFIG[featureId] || null;
}

// 检查功能是否需要登录
export function requiresLogin(featureId: string): boolean {
  const config = getFeatureConfig(featureId);
  return config ? ['authenticated', 'premium'].includes(config.accessLevel) : false;
}

// 检查功能是否允许试用
export function allowsTrial(featureId: string): boolean {
  const config = getFeatureConfig(featureId);
  return config ? config.accessLevel === 'trial' : false;
}

// 获取功能的登录消息
export function getLoginMessage(featureId: string): string {
  const config = getFeatureConfig(featureId);
  return config?.loginMessage || '此功能需要登录才能使用';
}

// 获取功能的登录权益
export function getLoginBenefits(featureId: string): string[] {
  const config = getFeatureConfig(featureId);
  return config?.loginBenefits || [];
}

// 按访问级别分组功能
export function getFeaturesByAccessLevel(accessLevel: AccessLevel): string[] {
  return Object.entries(FEATURE_ACCESS_CONFIG)
    .filter(([_, config]) => config.accessLevel === accessLevel)
    .map(([featureId]) => featureId);
}

// 获取所有需要登录的功能
export function getLoginRequiredFeatures(): string[] {
  return getFeaturesByAccessLevel('authenticated').concat(getFeaturesByAccessLevel('premium'));
}

// 获取所有允许试用的功能
export function getTrialAllowedFeatures(): string[] {
  return getFeaturesByAccessLevel('trial');
}