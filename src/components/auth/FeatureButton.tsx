/**
 * 功能按钮组件
 * 集成了功能访问权限检查和视觉指示器的按钮组件
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { getFeatureConfig } from '@/lib/feature-access-control';
import { LockIcon, FeaturePermissionTooltip } from './FeatureAccessIndicators';
import { cn } from '@/lib/utils';

interface FeatureButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  // 功能ID
  featureId: string;
  
  // 按钮点击回调（仅在有权限时调用）
  onClick?: () => void;
  
  // 是否显示锁定图标
  showLockIcon?: boolean;
  
  // 是否显示工具提示
  showTooltip?: boolean;
  
  // 自定义登录消息
  customLoginMessage?: string;
  
  // 锁定图标位置
  lockIconPosition?: 'left' | 'right';
  
  // 子组件
  children: React.ReactNode;
}

export function FeatureButton({
  featureId,
  onClick,
  showLockIcon = true,
  showTooltip = true,
  customLoginMessage,
  lockIconPosition = 'left',
  className,
  disabled,
  children,
  ...props
}: FeatureButtonProps) {
  const { checkFeatureAccess, requireAuth } = useSmartAuth();
  const featureConfig = getFeatureConfig(featureId);
  
  // 如果没有配置，按普通按钮处理
  if (!featureConfig) {
    return (
      <Button
        className={className}
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
  
  const access = checkFeatureAccess(featureId);
  const canAccess = access.allowed;
  
  // 处理点击事件
  const handleClick = async () => {
    if (canAccess) {
      onClick?.();
    } else {
      await requireAuth(featureId, {
        message: customLoginMessage || featureConfig.loginMessage,
        urgency: featureConfig.urgency,
        allowSkip: featureConfig.allowSkip,
      });
    }
  };
  
  // 渲染按钮内容
  const renderButtonContent = () => {
    const lockIcon = !canAccess && showLockIcon ? (
      <LockIcon 
        featureId={featureId} 
        size="sm" 
        showTooltip={false}
        className="flex-shrink-0"
      />
    ) : null;
    
    if (lockIconPosition === 'left') {
      return (
        <>
          {lockIcon}
          <span className="flex-1">{children}</span>
        </>
      );
    } else {
      return (
        <>
          <span className="flex-1">{children}</span>
          {lockIcon}
        </>
      );
    }
  };
  
  const button = (
    <Button
      className={cn(
        'flex items-center gap-2',
        !canAccess && 'relative',
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {renderButtonContent()}
    </Button>
  );
  
  // 如果需要工具提示且没有权限，包装工具提示
  if (showTooltip && !canAccess) {
    return (
      <FeaturePermissionTooltip featureId={featureId}>
        {button}
      </FeaturePermissionTooltip>
    );
  }
  
  return button;
}

// 预设的功能按钮组件
interface PresetFeatureButtonProps extends Omit<FeatureButtonProps, 'featureId' | 'children'> {
  children?: React.ReactNode;
}

// 保存报告按钮
export function SaveReportButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="save_report"
      {...props}
    >
      {props.children || '保存报告'}
    </FeatureButton>
  );
}

// 导出数据按钮
export function ExportDataButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="export_data"
      {...props}
    >
      {props.children || '导出数据'}
    </FeatureButton>
  );
}

// 高级分析按钮
export function AdvancedAnalyticsButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="advanced_analytics"
      {...props}
    >
      {props.children || '高级分析'}
    </FeatureButton>
  );
}

// 团队协作按钮
export function TeamCollaborationButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="team_collaboration"
      {...props}
    >
      {props.children || '团队协作'}
    </FeatureButton>
  );
}

// 视频分析按钮（试用功能）
export function VideoAnalysisButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="video_analysis"
      {...props}
    >
      {props.children || '视频分析'}
    </FeatureButton>
  );
}

// 竞争对手分析按钮
export function CompetitorAnalysisButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="competitor_analysis"
      {...props}
    >
      {props.children || '竞争对手分析'}
    </FeatureButton>
  );
}

// API访问按钮
export function ApiAccessButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="api_access"
      {...props}
    >
      {props.children || 'API访问'}
    </FeatureButton>
  );
}

// 管理面板按钮
export function AdminPanelButton(props: PresetFeatureButtonProps) {
  return (
    <FeatureButton
      featureId="admin_panel"
      {...props}
    >
      {props.children || '管理面板'}
    </FeatureButton>
  );
}