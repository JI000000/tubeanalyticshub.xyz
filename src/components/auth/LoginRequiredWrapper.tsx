/**
 * 登录要求包装组件
 * 用于包装需要登录的功能，提供视觉指示和登录提示
 */

'use client';

import React from 'react';
import { Lock, Crown, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { getFeatureConfig, type AccessLevel } from '@/lib/feature-access-control';

interface LoginRequiredWrapperProps {
  // 功能ID
  featureId: string;
  
  // 子组件
  children: React.ReactNode;
  
  // 是否显示为禁用状态（而不是隐藏）
  showDisabled?: boolean;
  
  // 自定义样式类名
  className?: string;
  
  // 包装器类型
  wrapperType?: 'overlay' | 'replace' | 'inline';
  
  // 自定义登录消息
  customMessage?: string;
  
  // 点击时的回调
  onLoginRequired?: () => void;
}

// 访问级别图标映射
const ACCESS_LEVEL_ICONS = {
  public: null,
  trial: <Zap className="h-4 w-4 text-yellow-600" />,
  authenticated: <Lock className="h-4 w-4 text-blue-600" />,
  premium: <Crown className="h-4 w-4 text-purple-600" />
};

// 访问级别颜色映射
const ACCESS_LEVEL_COLORS = {
  public: '',
  trial: 'border-yellow-200 bg-yellow-50',
  authenticated: 'border-blue-200 bg-blue-50',
  premium: 'border-purple-200 bg-purple-50'
};

// 访问级别标签映射
const ACCESS_LEVEL_LABELS = {
  public: '',
  trial: '试用功能',
  authenticated: '需要登录',
  premium: '高级功能'
};

export function LoginRequiredWrapper({
  featureId,
  children,
  showDisabled = true,
  className = '',
  wrapperType = 'overlay',
  customMessage,
  onLoginRequired
}: LoginRequiredWrapperProps) {
  const { checkFeatureAccess, requireAuth } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  // 如果没有配置，直接渲染子组件
  if (!featureConfig) {
    return <>{children}</>;
  }
  
  // 检查功能访问权限
  const access = checkFeatureAccess(featureId);
  
  // 如果允许访问，直接渲染子组件
  if (access.allowed) {
    return <>{children}</>;
  }
  
  // 处理登录要求
  const handleLoginRequired = async () => {
    if (onLoginRequired) {
      onLoginRequired();
      return;
    }
    
    await requireAuth(featureId, {
      message: customMessage || featureConfig.loginMessage,
      urgency: featureConfig.urgency,
      allowSkip: featureConfig.allowSkip,
    });
  };
  
  // 获取访问级别相关的UI元素
  const accessLevel = featureConfig.accessLevel as AccessLevel;
  const icon = ACCESS_LEVEL_ICONS[accessLevel];
  const colorClass = ACCESS_LEVEL_COLORS[accessLevel];
  const label = ACCESS_LEVEL_LABELS[accessLevel];
  
  // 替换模式：完全替换子组件
  if (wrapperType === 'replace') {
    return (
      <div className={`${colorClass} border rounded-lg p-6 text-center ${className}`}>
        <div className="flex flex-col items-center space-y-3">
          {icon && (
            <div className="p-2 rounded-full bg-white shadow-sm">
              {icon}
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">
              {label}
            </h3>
            <p className="text-sm text-gray-600">
              {customMessage || featureConfig.loginMessage || access.message}
            </p>
          </div>
          
          {featureConfig.loginBenefits && featureConfig.loginBenefits.length > 0 && (
            <div className="text-left">
              <p className="text-xs font-medium text-gray-700 mb-2">登录后可享受：</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {featureConfig.loginBenefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Button 
            onClick={handleLoginRequired}
            className="w-full"
            size="sm"
          >
            {accessLevel === 'premium' ? '升级账户' : '立即登录'}
          </Button>
        </div>
      </div>
    );
  }
  
  // 内联模式：在子组件旁边显示标识
  if (wrapperType === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {children}
        {icon && (
          <Badge 
            variant="outline" 
            className="text-xs cursor-pointer hover:bg-gray-50"
            onClick={handleLoginRequired}
          >
            {icon}
            <span className="ml-1">{label}</span>
          </Badge>
        )}
      </div>
    );
  }
  
  // 覆盖模式：在子组件上方显示遮罩
  return (
    <div className={`relative ${className}`}>
      {/* 原始内容（可能被禁用） */}
      <div className={showDisabled ? 'opacity-50 pointer-events-none' : 'hidden'}>
        {children}
      </div>
      
      {/* 登录要求遮罩 */}
      <div className={`
        absolute inset-0 ${colorClass} border rounded-lg 
        flex items-center justify-center backdrop-blur-sm
        ${showDisabled ? 'bg-opacity-90' : 'bg-opacity-100'}
      `}>
        <div className="text-center p-4 max-w-sm">
          <div className="flex flex-col items-center space-y-3">
            {icon && (
              <div className="p-2 rounded-full bg-white shadow-sm">
                {icon}
              </div>
            )}
            
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {label}
              </Badge>
              <p className="text-sm text-gray-700 font-medium">
                {customMessage || featureConfig.loginMessage || access.message}
              </p>
            </div>
            
            <Button 
              onClick={handleLoginRequired}
              size="sm"
              className="text-xs px-4 py-2"
            >
              {accessLevel === 'premium' ? '升级解锁' : '登录使用'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 简化的登录要求按钮组件
interface LoginRequiredButtonProps {
  featureId: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function LoginRequiredButton({
  featureId,
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  onClick
}: LoginRequiredButtonProps) {
  const { checkFeatureAccess, requireAuth } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  const access = checkFeatureAccess(featureId);
  const canAccess = access.allowed;
  
  const handleClick = async () => {
    if (canAccess) {
      onClick?.();
    } else {
      await requireAuth(featureId, {
        message: featureConfig?.loginMessage,
        urgency: featureConfig?.urgency,
        allowSkip: featureConfig?.allowSkip,
      });
    }
  };
  
  const accessLevel = featureConfig?.accessLevel as AccessLevel;
  const icon = ACCESS_LEVEL_ICONS[accessLevel];
  
  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${!canAccess ? 'relative' : ''}`}
      disabled={disabled}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {!canAccess && icon && (
          <span className="opacity-70">
            {icon}
          </span>
        )}
        {children}
      </div>
    </Button>
  );
}

// 功能访问指示器组件
interface FeatureAccessIndicatorProps {
  featureId: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function FeatureAccessIndicator({
  featureId,
  showLabel = true,
  size = 'default',
  className = ''
}: FeatureAccessIndicatorProps) {
  const { checkFeatureAccess } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  if (!featureConfig) return null;
  
  const access = checkFeatureAccess(featureId);
  
  // 如果可以访问，不显示指示器
  if (access.allowed) return null;
  
  const accessLevel = featureConfig.accessLevel as AccessLevel;
  const icon = ACCESS_LEVEL_ICONS[accessLevel];
  const label = ACCESS_LEVEL_LABELS[accessLevel];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  return (
    <Badge 
      variant="outline" 
      className={`${sizeClasses[size]} ${className} flex items-center gap-1`}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}