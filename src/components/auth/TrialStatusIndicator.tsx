'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Zap, 
  Lock, 
  Star, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Gift
} from 'lucide-react';
import { useAnonymousTrial } from '@/hooks/useAnonymousTrial';
import type { TrialStatus } from '@/types/trial';

export interface TrialStatusIndicatorProps {
  /** 显示模式 */
  variant?: 'compact' | 'detailed' | 'banner' | 'tooltip';
  /** 是否显示登录按钮 */
  showLoginButton?: boolean;
  /** 登录按钮点击回调 */
  onLoginClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示权益说明 */
  showBenefits?: boolean;
  /** 是否自动隐藏（当试用次数充足时） */
  autoHide?: boolean;
  /** 隐藏阈值（剩余次数低于此值时显示） */
  hideThreshold?: number;
}

/**
 * 试用状态指示器组件
 * 显示剩余试用次数、渐进式登录提示和权益说明
 */
export function TrialStatusIndicator({
  variant = 'compact',
  showLoginButton = true,
  onLoginClick,
  className,
  showBenefits = false,
  autoHide = false,
  hideThreshold = 3,
}: TrialStatusIndicatorProps) {
  const {
    trialStatus,
    isLoading,
    getRemainingTrials,
    getTotalTrials,
    isTrialExhausted,
    isBlocked,
    getStatusMessage,
  } = useAnonymousTrial();

  // 计算显示状态
  const displayState = useMemo(() => {
    if (isLoading || !trialStatus) {
      return {
        type: 'loading' as const,
        urgency: 'low' as const,
        message: '正在加载...',
        showIndicator: false,
      };
    }

    const remaining = getRemainingTrials();
    const total = getTotalTrials();

    // 如果设备被阻止
    if (isBlocked()) {
      return {
        type: 'blocked' as const,
        urgency: 'high' as const,
        message: '设备已被暂时阻止',
        showIndicator: true,
      };
    }

    // 如果试用已耗尽
    if (isTrialExhausted()) {
      return {
        type: 'exhausted' as const,
        urgency: 'high' as const,
        message: '免费试用已用完',
        subtitle: '登录即可继续使用所有功能',
        showIndicator: true,
      };
    }

    // 如果是最后一次机会
    if (remaining === 1) {
      return {
        type: 'last_chance' as const,
        urgency: 'high' as const,
        message: '最后一次免费机会',
        subtitle: '登录后可无限制使用',
        showIndicator: true,
      };
    }

    // 如果试用次数较少（渐进式提醒）
    if (remaining <= 2) {
      return {
        type: 'low_remaining' as const,
        urgency: 'medium' as const,
        message: `还剩 ${remaining} 次机会`,
        subtitle: '登录获得更多使用机会',
        showIndicator: true,
      };
    }

    // 如果启用自动隐藏且试用次数充足
    if (autoHide && remaining > hideThreshold) {
      return {
        type: 'sufficient' as const,
        urgency: 'low' as const,
        message: `还剩 ${remaining} 次试用`,
        showIndicator: false,
      };
    }

    // 正常状态
    return {
      type: 'normal' as const,
      urgency: 'low' as const,
      message: `还剩 ${remaining} 次试用`,
      subtitle: '登录后享受更多功能',
      showIndicator: true,
    };
  }, [trialStatus, isLoading, getRemainingTrials, getTotalTrials, isTrialExhausted, isBlocked, autoHide, hideThreshold]);

  // 如果不需要显示指示器，返回null
  if (!displayState.showIndicator) {
    return null;
  }

  // 获取状态对应的图标
  const getStatusIcon = () => {
    switch (displayState.type) {
      case 'blocked':
        return <Lock className="h-4 w-4" />;
      case 'exhausted':
        return <AlertCircle className="h-4 w-4" />;
      case 'last_chance':
        return <Zap className="h-4 w-4" />;
      case 'low_remaining':
        return <Clock className="h-4 w-4" />;
      case 'loading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  // 获取紧急程度对应的样式
  const getUrgencyStyles = () => {
    switch (displayState.urgency) {
      case 'high':
        return {
          container: 'bg-red-50 border-red-200 text-red-900',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          accent: 'text-red-600',
        };
      case 'medium':
        return {
          container: 'bg-orange-50 border-orange-200 text-orange-900',
          icon: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
          accent: 'text-orange-600',
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          accent: 'text-blue-600',
        };
    }
  };

  const styles = getUrgencyStyles();

  // 渲染权益说明
  const renderBenefits = () => {
    if (!showBenefits) return null;

    const benefits = [
      { icon: <Zap className="h-3 w-3" />, text: '无限制分析请求' },
      { icon: <Star className="h-3 w-3" />, text: '保存和整理报告' },
      { icon: <CheckCircle className="h-3 w-3" />, text: '访问历史记录' },
      { icon: <Gift className="h-3 w-3" />, text: '高级分析功能' },
    ];

    return (
      <div className="mt-3 pt-3 border-t border-current/20">
        <p className="text-xs font-medium mb-2">登录后享受：</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <span className={cn('flex-shrink-0', styles.accent)}>
                {benefit.icon}
              </span>
              <span className="truncate">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 紧凑模式
  if (variant === 'compact') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
        styles.container,
        className
      )}>
        <span className={styles.icon}>
          {getStatusIcon()}
        </span>
        <span className="font-medium">{displayState.message}</span>
        {showLoginButton && onLoginClick && (
          <Button
            size="sm"
            onClick={onLoginClick}
            className={cn('h-6 px-2 text-xs', styles.button)}
          >
            登录
          </Button>
        )}
      </div>
    );
  }

  // 横幅模式
  if (variant === 'banner') {
    return (
      <div className={cn(
        'flex items-center justify-between p-4 rounded-lg border',
        styles.container,
        className
      )}>
        <div className="flex items-center gap-3">
          <span className={styles.icon}>
            {getStatusIcon()}
          </span>
          <div>
            <p className="font-medium">{displayState.message}</p>
            {displayState.subtitle && (
              <p className="text-sm opacity-80 mt-0.5">{displayState.subtitle}</p>
            )}
          </div>
        </div>
        {showLoginButton && onLoginClick && (
          <Button
            onClick={onLoginClick}
            className={cn('flex items-center gap-1', styles.button)}
          >
            立即登录
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // 工具提示模式
  if (variant === 'tooltip') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded text-xs',
        styles.container,
        className
      )}>
        <span className={styles.icon}>
          {getStatusIcon()}
        </span>
        <span>{displayState.message}</span>
      </div>
    );
  }

  // 详细模式（默认）
  return (
    <div className={cn(
      'p-4 rounded-lg border',
      styles.container,
      className
    )}>
      <div className="flex items-start gap-3">
        <span className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          {getStatusIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{displayState.message}</p>
          {displayState.subtitle && (
            <p className="text-sm opacity-80 mt-1">{displayState.subtitle}</p>
          )}
          
          {renderBenefits()}
          
          {showLoginButton && onLoginClick && (
            <Button
              onClick={onLoginClick}
              className={cn('mt-3 w-full flex items-center justify-center gap-2', styles.button)}
            >
              立即登录解锁全部功能
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrialStatusIndicator;