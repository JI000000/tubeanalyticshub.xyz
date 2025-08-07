'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Star, 
  CheckCircle, 
  Gift, 
  Crown, 
  Shield, 
  TrendingUp,
  Users,
  Download,
  History,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export interface LoginBenefitsCardProps {
  /** 显示变体 */
  variant?: 'card' | 'list' | 'grid' | 'minimal';
  /** 是否显示登录按钮 */
  showLoginButton?: boolean;
  /** 登录按钮点击回调 */
  onLoginClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 标题文本 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 是否显示高级功能 */
  showPremiumFeatures?: boolean;
}

// 权益配置
const BASIC_BENEFITS = [
  {
    icon: <Zap className="h-4 w-4" />,
    title: '无限制分析',
    description: '不再受试用次数限制，随时分析任何视频',
    color: 'text-blue-600',
  },
  {
    icon: <Star className="h-4 w-4" />,
    title: '保存报告',
    description: '保存和整理您的分析报告，随时查看',
    color: 'text-yellow-600',
  },
  {
    icon: <History className="h-4 w-4" />,
    title: '历史记录',
    description: '查看所有分析历史，轻松找到之前的结果',
    color: 'text-green-600',
  },
  {
    icon: <Download className="h-4 w-4" />,
    title: '数据导出',
    description: '导出分析数据为Excel、PDF等格式',
    color: 'text-purple-600',
  },
];

const PREMIUM_BENEFITS = [
  {
    icon: <TrendingUp className="h-4 w-4" />,
    title: '高级分析',
    description: '趋势分析、竞品对比、深度洞察',
    color: 'text-orange-600',
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: '团队协作',
    description: '与团队成员共享报告和协作分析',
    color: 'text-indigo-600',
  },
  {
    icon: <Shield className="h-4 w-4" />,
    title: '优先支持',
    description: '享受优先客服支持和专业建议',
    color: 'text-red-600',
  },
  {
    icon: <Crown className="h-4 w-4" />,
    title: 'API访问',
    description: '通过API集成到您的工作流程中',
    color: 'text-amber-600',
  },
];

/**
 * 登录权益说明卡片组件
 * 展示登录后可享受的各种权益和功能
 */
export function LoginBenefitsCard({
  variant = 'card',
  showLoginButton = true,
  onLoginClick,
  className,
  title = '登录后享受更多功能',
  description = '解锁全部功能，提升您的YouTube分析体验',
  showPremiumFeatures = false,
}: LoginBenefitsCardProps) {
  
  const benefits = showPremiumFeatures 
    ? [...BASIC_BENEFITS, ...PREMIUM_BENEFITS]
    : BASIC_BENEFITS;

  // 最小化模式
  if (variant === 'minimal') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200',
        className
      )}>
        <Sparkles className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          登录解锁更多功能
        </span>
        {showLoginButton && onLoginClick && (
          <Button
            size="sm"
            onClick={onLoginClick}
            className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
          >
            登录
          </Button>
        )}
      </div>
    );
  }

  // 列表模式
  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        
        <div className="space-y-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className={cn('flex-shrink-0', benefit.color)}>
                {benefit.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{benefit.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {showLoginButton && onLoginClick && (
          <Button
            onClick={onLoginClick}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            立即登录
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  // 网格模式
  if (variant === 'grid') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className={cn('mb-2', benefit.color)}>
                {benefit.icon}
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">{benefit.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        {showLoginButton && onLoginClick && (
          <Button
            onClick={onLoginClick}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            立即登录解锁
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  // 卡片模式（默认）
  return (
    <div className={cn(
      'p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl border border-blue-200 shadow-sm',
      className
    )}>
      {/* 头部 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-3">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* 权益列表 */}
      <div className="space-y-4 mb-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
              'bg-white border border-gray-200 shadow-sm'
            )}>
              <span className={benefit.color}>
                {benefit.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1">{benefit.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 登录按钮 */}
      {showLoginButton && onLoginClick && (
        <Button
          onClick={onLoginClick}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
          size="lg"
        >
          立即登录，开始享受
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      )}

      {/* 底部说明 */}
      <p className="text-xs text-gray-500 text-center mt-4">
        新用户将自动注册，无需额外步骤
      </p>
    </div>
  );
}

export default LoginBenefitsCard;