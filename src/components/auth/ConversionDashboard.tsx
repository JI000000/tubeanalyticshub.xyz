'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MousePointer, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import { LoginAnalyticsService, type LoginConversionStats } from '@/lib/login-analytics';
import { ABTestManager, type ABTestResults } from '@/lib/ab-testing';
import { DynamicOptimizationManager } from '@/lib/dynamic-optimization';
import { PersonalizationManager } from '@/lib/personalization';

// 仪表板数据类型
interface DashboardData {
  conversionStats: LoginConversionStats;
  abTestResults: ABTestResults[];
  optimizationReport: any;
  personalizationStats: any;
  realTimeMetrics: {
    activeUsers: number;
    currentConversionRate: number;
    todaySignups: number;
    hourlyTrend: Array<{ hour: number; conversions: number }>;
  };
}

// 指标卡片组件
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, icon, description, trend }: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />;
      case 'down': return <TrendingDown className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">vs last period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// 转化漏斗组件
interface ConversionFunnelProps {
  data: {
    step: string;
    count: number;
    conversion_rate: number;
    drop_off_rate: number;
  }[];
}

function ConversionFunnel({ data }: ConversionFunnelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          转化漏斗
        </CardTitle>
        <CardDescription>
          用户从看到登录提示到成功登录的转化过程
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((step, index) => (
            <div key={step.step} className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium capitalize">
                      {step.step.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {step.count.toLocaleString()} users
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {step.conversion_rate.toFixed(1)}%
                  </div>
                  {step.drop_off_rate > 0 && (
                    <div className="text-sm text-red-600">
                      -{step.drop_off_rate.toFixed(1)}% drop-off
                    </div>
                  )}
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${step.conversion_rate}%` }}
                />
              </div>
              
              {/* 连接线 */}
              {index < data.length - 1 && (
                <div className="absolute left-4 top-12 w-0.5 h-4 bg-gray-300" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// A/B测试结果组件
interface ABTestResultsProps {
  results: ABTestResults[];
}

function ABTestResults({ results }: ABTestResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          A/B测试结果
        </CardTitle>
        <CardDescription>
          当前运行的A/B测试实验结果
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {results.map((result) => (
            <div key={result.experimentId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">实验 {result.experimentId}</h4>
                <div className="text-sm text-muted-foreground">
                  总转化率: {result.overallStats.averageConversionRate.toFixed(1)}%
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.variants.map((variant) => (
                  <div 
                    key={variant.variantId}
                    className={`p-3 rounded border ${
                      variant.isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{variant.name}</span>
                      {variant.isWinner && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          获胜者
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>展示次数:</span>
                        <span>{variant.impressions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>点击次数:</span>
                        <span>{variant.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>转化次数:</span>
                        <span>{variant.conversions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>转化率:</span>
                        <span>{variant.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>置信度:</span>
                        <span>{variant.confidenceLevel}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 实时活动组件
interface RealTimeActivityProps {
  metrics: DashboardData['realTimeMetrics'];
}

function RealTimeActivity({ metrics }: RealTimeActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          实时活动
        </CardTitle>
        <CardDescription>
          当前用户活动和转化情况
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.activeUsers}
              </div>
              <div className="text-sm text-muted-foreground">活跃用户</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.todaySignups}
              </div>
              <div className="text-sm text-muted-foreground">今日注册</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">24小时转化趋势</span>
              <span className="text-sm text-muted-foreground">
                当前: {metrics.currentConversionRate.toFixed(1)}%
              </span>
            </div>
            
            {/* 简单的趋势图 */}
            <div className="flex items-end gap-1 h-20">
              {metrics.hourlyTrend.map((point, index) => (
                <div
                  key={point.hour}
                  className="flex-1 bg-blue-200 rounded-t"
                  style={{
                    height: `${Math.max((point.conversions / Math.max(...metrics.hourlyTrend.map(p => p.conversions))) * 100, 5)}%`
                  }}
                  title={`${point.hour}:00 - ${point.conversions} conversions`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 个性化效果组件
interface PersonalizationEffectsProps {
  stats: any;
}

function PersonalizationEffects({ stats }: PersonalizationEffectsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          个性化效果
        </CardTitle>
        <CardDescription>
          不同用户画像的转化表现
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.personaPerformance?.map((persona: any) => (
            <div key={persona.personaId} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium capitalize">
                  {persona.personaId.replace('_', ' ')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {persona.impressions} 展示 • {persona.clicks} 点击
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {persona.conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {persona.conversions} 转化
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 主仪表板组件
export function ConversionDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 加载仪表板数据
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 并行加载所有数据
      const [
        conversionStats,
        optimizationReport,
        personalizationStats
      ] = await Promise.all([
        LoginAnalyticsService.getConversionStats(),
        DynamicOptimizationManager.getOptimizationReport(),
        PersonalizationManager.getPersonalizationStats()
      ]);

      // 模拟实时指标（实际应用中应该从实时数据源获取）
      const realTimeMetrics = {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        currentConversionRate: conversionStats.overall_conversion_rate,
        todaySignups: Math.floor(Math.random() * 50) + 20,
        hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          conversions: Math.floor(Math.random() * 10) + 1
        }))
      };

      setData({
        conversionStats,
        abTestResults: [], // 实际应用中从ABTestManager获取
        optimizationReport,
        personalizationStats,
        realTimeMetrics
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和自动刷新
  useEffect(() => {
    loadDashboardData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, 30000); // 30秒刷新一次
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>加载仪表板数据...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">无法加载仪表板数据</p>
        <Button onClick={loadDashboardData} className="mt-4">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">登录转化率仪表板</h1>
          <p className="text-muted-foreground">
            最后更新: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            自动刷新
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="总体转化率"
          value={`${data.conversionStats.overall_conversion_rate.toFixed(1)}%`}
          change={2.5}
          trend="up"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          description="登录提示到成功登录的转化率"
        />
        
        <MetricCard
          title="点击转化率"
          value={`${data.conversionStats.prompt_to_attempt_rate.toFixed(1)}%`}
          change={-1.2}
          trend="down"
          icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
          description="看到提示后点击登录的比例"
        />
        
        <MetricCard
          title="登录成功率"
          value={`${data.conversionStats.attempt_to_success_rate.toFixed(1)}%`}
          change={0.8}
          trend="up"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="尝试登录后成功的比例"
        />
        
        <MetricCard
          title="活跃用户"
          value={data.realTimeMetrics.activeUsers}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description="当前在线用户数"
        />
      </div>

      {/* 主要图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel 
          data={[
            { step: 'prompt_shown', count: data.conversionStats.total_prompts, conversion_rate: 100, drop_off_rate: 0 },
            { step: 'login_attempt', count: data.conversionStats.total_attempts, conversion_rate: data.conversionStats.prompt_to_attempt_rate, drop_off_rate: 100 - data.conversionStats.prompt_to_attempt_rate },
            { step: 'login_success', count: data.conversionStats.total_successes, conversion_rate: data.conversionStats.attempt_to_success_rate, drop_off_rate: 100 - data.conversionStats.attempt_to_success_rate }
          ]}
        />
        
        <RealTimeActivity metrics={data.realTimeMetrics} />
      </div>

      {/* 详细分析区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalizationEffects stats={data.personalizationStats} />
        
        {/* 提供商表现 */}
        <Card>
          <CardHeader>
            <CardTitle>登录提供商表现</CardTitle>
            <CardDescription>不同登录方式的转化效果对比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.conversionStats.by_provider).map(([provider, stats]) => (
                <div key={provider} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                      {provider.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{provider}</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.attempts} 尝试
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {stats.success_rate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.successes} 成功
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* A/B测试结果 */}
      {data.abTestResults.length > 0 && (
        <ABTestResults results={data.abTestResults} />
      )}
    </div>
  );
}

export default ConversionDashboard;