/**
 * 功能访问权限的视觉指示器组件
 * 提供锁定图标、登录标签、工具提示等视觉元素
 */

'use client';

import React from 'react';
import { Lock, Crown, Zap, Info, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { getFeatureConfig, type AccessLevel } from '@/lib/feature-access-control';
import { cn } from '@/lib/utils';

// 访问级别图标映射
const ACCESS_LEVEL_ICONS = {
  public: null,
  trial: Zap,
  authenticated: Lock,
  premium: Crown
} as const;

// 访问级别颜色映射
const ACCESS_LEVEL_COLORS = {
  public: '',
  trial: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  authenticated: 'text-blue-600 bg-blue-50 border-blue-200',
  premium: 'text-purple-600 bg-purple-50 border-purple-200'
} as const;

// 访问级别标签映射
const ACCESS_LEVEL_LABELS = {
  public: '',
  trial: '试用功能',
  authenticated: '需要登录',
  premium: '高级功能'
} as const;

// 锁定图标组件
interface LockIconProps {
  featureId: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export function LockIcon({ 
  featureId, 
  size = 'default', 
  className = '',
  showTooltip = true 
}: LockIconProps) {
  const { checkFeatureAccess } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  if (!featureConfig) return null;
  
  const access = checkFeatureAccess(featureId);
  
  // 如果可以访问，不显示锁定图标
  if (access.allowed) return null;
  
  const accessLevel = featureConfig.accessLevel as AccessLevel;
  const IconComponent = ACCESS_LEVEL_ICONS[accessLevel];
  
  if (!IconComponent) return null;
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const colorClass = ACCESS_LEVEL_COLORS[accessLevel];
  
  const icon = (
    <IconComponent 
      className={cn(
        sizeClasses[size],
        colorClass.split(' ')[0], // 只取文字颜色
        className
      )}
    />
  );
  
  if (!showTooltip) return icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help">
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium">{ACCESS_LEVEL_LABELS[accessLevel]}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {featureConfig.loginMessage || access.message}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// "登录后可用"标签组件
interface LoginRequiredBadgeProps {
  featureId: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export function LoginRequiredBadge({
  featureId,
  variant = 'outline',
  size = 'default',
  showIcon = true,
  className = '',
  onClick
}: LoginRequiredBadgeProps) {
  const { checkFeatureAccess, requireAuth } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  if (!featureConfig) return null;
  
  const access = checkFeatureAccess(featureId);
  
  // 如果可以访问，不显示标签
  if (access.allowed) return null;
  
  const accessLevel = featureConfig.accessLevel as AccessLevel;
  const IconComponent = ACCESS_LEVEL_ICONS[accessLevel];
  const label = ACCESS_LEVEL_LABELS[accessLevel];
  
  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }
    
    await requireAuth(featureId, {
      message: featureConfig.loginMessage,
      urgency: featureConfig.urgency,
      allowSkip: featureConfig.allowSkip,
    });
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    default: 'text-sm px-3 py-1 gap-1.5'
  };
  
  return (
    <Badge
      variant={variant}
      className={cn(
        'cursor-pointer hover:opacity-80 transition-opacity',
        'inline-flex items-center',
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
    >
      {showIcon && IconComponent && (
        <IconComponent className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      <span>{label}</span>
    </Badge>
  );
}

// 功能权限说明工具提示组件
interface FeaturePermissionTooltipProps {
  featureId: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showBenefits?: boolean;
  maxBenefits?: number;
}

export function FeaturePermissionTooltip({
  featureId,
  children,
  side = 'top',
  showBenefits = true,
  maxBenefits = 3
}: FeaturePermissionTooltipProps) {
  const { checkFeatureAccess } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  if (!featureConfig) {
    return <>{children}</>;
  }
  
  const access = checkFeatureAccess(featureId);
  
  // 如果可以访问，只显示子组件
  if (access.allowed) {
    return <>{children}</>;
  }
  
  const accessLevel = featureConfig.accessLevel as AccessLevel;
  const IconComponent = ACCESS_LEVEL_ICONS[accessLevel];
  const label = ACCESS_LEVEL_LABELS[accessLevel];
  const benefits = featureConfig.loginBenefits || [];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          <div className="space-y-2">
            {/* 标题 */}
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{label}</span>
            </div>
            
            {/* 描述 */}
            <p className="text-sm text-muted-foreground">
              {featureConfig.loginMessage || access.message}
            </p>
            
            {/* 登录权益 */}
            {showBenefits && benefits.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  登录后可享受：
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {benefits.slice(0, maxBenefits).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                  {benefits.length > maxBenefits && (
                    <li className="text-xs text-muted-foreground/70 italic">
                      还有 {benefits.length - maxBenefits} 项权益...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 功能禁用状态的视觉样式组件
interface DisabledFeatureOverlayProps {
  featureId: string;
  children: React.ReactNode;
  overlayType?: 'blur' | 'dim' | 'replace';
  showLoginButton?: boolean;
  className?: string;
}

export function DisabledFeatureOverlay({
  featureId,
  children,
  overlayType = 'dim',
  showLoginButton = true,
  className = ''
}: DisabledFeatureOverlayProps) {
  const { checkFeatureAccess, requireAuth } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  if (!featureConfig) {
    return <>{children}</>;
  }
  
  const access = checkFeatureAccess(featureId);
  
  // 如果可以访问，直接显示子组件
  if (access.allowed) {
    return <>{children}</>;
  }
  
  const accessLevel = featureConfig.accessLevel as AccessLevel;
  const IconComponent = ACCESS_LEVEL_ICONS[accessLevel];
  const label = ACCESS_LEVEL_LABELS[accessLevel];
  const colorClass = ACCESS_LEVEL_COLORS[accessLevel];
  
  const handleLogin = async () => {
    await requireAuth(featureId, {
      message: featureConfig.loginMessage,
      urgency: featureConfig.urgency,
      allowSkip: featureConfig.allowSkip,
    });
  };
  
  const overlayClasses = {
    blur: 'backdrop-blur-sm bg-white/80',
    dim: 'bg-white/90',
    replace: 'bg-white'
  };
  
  return (
    <div className={cn('relative', className)}>
      {/* 原始内容 */}
      <div className={overlayType !== 'replace' ? 'opacity-30 pointer-events-none' : 'hidden'}>
        {children}
      </div>
      
      {/* 禁用遮罩 */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center',
        'border rounded-lg',
        overlayClasses[overlayType],
        colorClass
      )}>
        <div className="text-center p-4 max-w-xs">
          <div className="flex flex-col items-center space-y-3">
            {/* 图标 */}
            {IconComponent && (
              <div className="p-3 rounded-full bg-white shadow-sm">
                <IconComponent className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            {/* 标签和描述 */}
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {label}
              </Badge>
              <p className="text-sm text-muted-foreground font-medium">
                {featureConfig.loginMessage || access.message}
              </p>
            </div>
            
            {/* 登录按钮 */}
            {showLoginButton && (
              <Button 
                onClick={handleLogin}
                size="sm"
                className="text-xs px-4 py-2"
              >
                {accessLevel === 'premium' ? '升级解锁' : '立即登录'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 功能访问状态指示器（综合组件）
interface FeatureAccessIndicatorProps {
  featureId: string;
  type?: 'icon' | 'badge' | 'tooltip' | 'overlay';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  showBenefits?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function FeatureAccessIndicator({
  featureId,
  type = 'icon',
  size = 'default',
  showLabel = true,
  showTooltip = true,
  showBenefits = true,
  className = '',
  children,
  onClick
}: FeatureAccessIndicatorProps) {
  const { checkFeatureAccess } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  if (!featureConfig) {
    return children ? <>{children}</> : null;
  }
  
  const access = checkFeatureAccess(featureId);
  
  // 如果可以访问，只显示子组件（如果有）
  if (access.allowed) {
    return children ? <>{children}</> : null;
  }
  
  // 根据类型渲染不同的指示器
  switch (type) {
    case 'icon':
      return (
        <LockIcon 
          featureId={featureId} 
          size={size} 
          className={className}
          showTooltip={showTooltip}
        />
      );
      
    case 'badge':
      return (
        <LoginRequiredBadge
          featureId={featureId}
          size={size === 'lg' ? 'default' : size}
          showIcon={true}
          className={className}
          onClick={onClick}
        />
      );
      
    case 'tooltip':
      return children ? (
        <FeaturePermissionTooltip
          featureId={featureId}
          showBenefits={showBenefits}
        >
          {children}
        </FeaturePermissionTooltip>
      ) : null;
      
    case 'overlay':
      return children ? (
        <DisabledFeatureOverlay
          featureId={featureId}
          className={className}
        >
          {children}
        </DisabledFeatureOverlay>
      ) : null;
      
    default:
      return null;
  }
}