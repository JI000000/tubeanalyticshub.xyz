/**
 * 功能访问状态显示组件
 * 用于显示用户当前的功能访问状态和权限信息
 */

'use client';

import React from 'react';
import { Check, X, Clock, Crown, Lock, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { useAnonymousTrial } from '@/hooks/useAnonymousTrial';
import { 
  FEATURE_ACCESS_CONFIG, 
  getFeaturesByAccessLevel,
  type AccessLevel 
} from '@/lib/feature-access-control';
import { cn } from '@/lib/utils';

// 访问级别图标和颜色映射
const ACCESS_LEVEL_CONFIG = {
  public: {
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: '公开功能'
  },
  trial: {
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: '试用功能'
  },
  authenticated: {
    icon: Lock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: '登录功能'
  },
  premium: {
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: '高级功能'
  }
} as const;

// 功能访问状态概览
interface FeatureAccessOverviewProps {
  className?: string;
}

export function FeatureAccessOverview({ className }: FeatureAccessOverviewProps) {
  const { checkFeatureAccess, user } = useSmartAuth();
  const { trialStatus } = useAnonymousTrial();
  
  // 统计各访问级别的功能数量和可用数量
  const accessStats = React.useMemo(() => {
    const stats: Record<AccessLevel, { total: number; available: number; features: string[] }> = {
      public: { total: 0, available: 0, features: [] },
      trial: { total: 0, available: 0, features: [] },
      authenticated: { total: 0, available: 0, features: [] },
      premium: { total: 0, available: 0, features: [] }
    };
    
    Object.entries(FEATURE_ACCESS_CONFIG).forEach(([featureId, config]) => {
      const level = config.accessLevel as AccessLevel;
      stats[level].total++;
      stats[level].features.push(featureId);
      
      const access = checkFeatureAccess(featureId);
      if (access.allowed) {
        stats[level].available++;
      }
    });
    
    return stats;
  }, [checkFeatureAccess]);
  
  // 计算总体访问率
  const totalFeatures = Object.values(accessStats).reduce((sum, stat) => sum + stat.total, 0);
  const availableFeatures = Object.values(accessStats).reduce((sum, stat) => sum + stat.available, 0);
  const accessRate = totalFeatures > 0 ? (availableFeatures / totalFeatures) * 100 : 0;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          功能访问状态
          <Badge variant={user ? 'default' : 'secondary'}>
            {user ? '已登录' : '未登录'}
          </Badge>
        </CardTitle>
        <CardDescription>
          您当前可以访问 {availableFeatures}/{totalFeatures} 项功能
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 总体进度 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>总体访问率</span>
            <span>{Math.round(accessRate)}%</span>
          </div>
          <Progress value={accessRate} className="h-2" />
        </div>
        
        {/* 各级别统计 */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(ACCESS_LEVEL_CONFIG) as [AccessLevel, typeof ACCESS_LEVEL_CONFIG[AccessLevel]][]).map(([level, config]) => {
            const stat = accessStats[level];
            const IconComponent = config.icon;
            const rate = stat.total > 0 ? (stat.available / stat.total) * 100 : 0;
            
            return (
              <div
                key={level}
                className={cn(
                  'p-3 rounded-lg border',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={cn('h-4 w-4', config.color)} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.available}/{stat.total} 可用
                </div>
                <Progress value={rate} className="h-1 mt-1" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 试用功能状态显示
interface TrialFeaturesStatusProps {
  className?: string;
}

export function TrialFeaturesStatus({ className }: TrialFeaturesStatusProps) {
  const { trialStatus, getTotalTrials, getRemainingTrials } = useAnonymousTrial();
  const trialFeatures = getFeaturesByAccessLevel('trial');
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          试用功能状态
        </CardTitle>
        <CardDescription>
          查看您的试用功能使用情况
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trialFeatures.map(featureId => {
            const config = FEATURE_ACCESS_CONFIG[featureId];
            if (!config || !config.trialAction) return null;
            
            const totalTrials = getTotalTrials();
            const remainingTrials = getRemainingTrials();
            const usedTrials = totalTrials - remainingTrials;
            const usageRate = totalTrials > 0 ? (usedTrials / totalTrials) * 100 : 0;
            
            return (
              <div key={featureId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{config.description}</span>
                  <Badge variant={remainingTrials <= 0 ? 'destructive' : 'secondary'}>
                    {usedTrials}/{totalTrials}
                  </Badge>
                </div>
                <Progress value={usageRate} className="h-2" />
                {remainingTrials <= 0 && (
                  <p className="text-xs text-muted-foreground">
                    试用次数已用完，登录后可无限使用
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 功能列表显示
interface FeatureListProps {
  accessLevel?: AccessLevel;
  showOnlyRestricted?: boolean;
  className?: string;
}

export function FeatureList({ 
  accessLevel, 
  showOnlyRestricted = false,
  className 
}: FeatureListProps) {
  const { checkFeatureAccess, requireAuth } = useSmartAuth();
  
  // 获取要显示的功能列表
  const features = React.useMemo(() => {
    let featureIds: string[];
    
    if (accessLevel) {
      featureIds = getFeaturesByAccessLevel(accessLevel);
    } else {
      featureIds = Object.keys(FEATURE_ACCESS_CONFIG);
    }
    
    if (showOnlyRestricted) {
      featureIds = featureIds.filter(featureId => {
        const access = checkFeatureAccess(featureId);
        return !access.allowed;
      });
    }
    
    return featureIds.map(featureId => ({
      id: featureId,
      config: FEATURE_ACCESS_CONFIG[featureId],
      access: checkFeatureAccess(featureId)
    }));
  }, [accessLevel, showOnlyRestricted, checkFeatureAccess]);
  
  const handleUnlockFeature = async (featureId: string) => {
    const config = FEATURE_ACCESS_CONFIG[featureId];
    await requireAuth(featureId, {
      message: config.loginMessage,
      urgency: config.urgency,
      allowSkip: config.allowSkip,
    });
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {accessLevel ? ACCESS_LEVEL_CONFIG[accessLevel].label : '所有功能'}
          {showOnlyRestricted && ' (受限)'}
        </CardTitle>
        <CardDescription>
          {showOnlyRestricted 
            ? '以下功能需要登录或升级后才能使用'
            : '功能列表和访问状态'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.map(({ id, config, access }) => {
            const levelConfig = ACCESS_LEVEL_CONFIG[config.accessLevel as AccessLevel];
            const IconComponent = levelConfig.icon;
            
            return (
              <div
                key={id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  access.allowed ? 'bg-green-50 border-green-200' : levelConfig.bgColor + ' ' + levelConfig.borderColor
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-1.5 rounded-full',
                    access.allowed ? 'bg-green-100' : 'bg-white'
                  )}>
                    {access.allowed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconComponent className={cn('h-4 w-4', levelConfig.color)} />
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm">{config.description}</div>
                    {!access.allowed && (
                      <div className="text-xs text-muted-foreground">
                        {config.loginMessage || access.message}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={access.allowed ? 'default' : 'secondary'}>
                    {access.allowed ? '可用' : levelConfig.label}
                  </Badge>
                  
                  {!access.allowed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnlockFeature(id)}
                    >
                      {config.accessLevel === 'premium' ? '升级' : '登录'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {features.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无相关功能</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}