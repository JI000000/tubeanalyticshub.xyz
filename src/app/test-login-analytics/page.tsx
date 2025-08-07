'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoginAnalyticsService, type LoginConversionStats, type LoginFunnelData } from '@/lib/login-analytics';
import { SmartLoginModal, type LoginTrigger, type LoginContext } from '@/components/auth/SmartLoginModal';
import { useFingerprint } from '@/hooks/useFingerprint';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function TestLoginAnalyticsPage() {
  const [showModal, setShowModal] = useState(false);
  const [trigger, setTrigger] = useState<LoginTrigger | undefined>();
  const [context, setContext] = useState<LoginContext | undefined>();
  const [stats, setStats] = useState<LoginConversionStats | null>(null);
  const [funnelData, setFunnelData] = useState<LoginFunnelData[]>([]);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { fingerprint } = useFingerprint();

  // 加载分析数据
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // 获取统计数据
      const statsResponse = await fetch('/api/auth/analytics/stats');
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        setStats(statsResult.data);
      }

      // 获取漏斗数据
      const funnelResponse = await fetch('/api/auth/analytics/funnel');
      if (funnelResponse.ok) {
        const funnelResult = await funnelResponse.json();
        setFunnelData(funnelResult.data.funnel_steps);
      }

      // 获取趋势数据
      const trendsResponse = await fetch('/api/auth/analytics/trends?event_type=prompt_shown&interval=day');
      if (trendsResponse.ok) {
        const trendsResult = await trendsResponse.json();
        setTrendsData(trendsResult.data.time_series);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // 测试不同的登录触发场景
  const testScenarios = [
    {
      id: 'trial_exhausted',
      name: '试用耗尽',
      trigger: {
        type: 'trial_exhausted' as const,
        message: '您的免费试用次数已用完，登录后可继续使用所有功能',
        urgency: 'medium' as const,
        allowSkip: false,
      },
      context: {
        previousAction: 'video_analysis',
        returnUrl: '/test-login-analytics',
        metadata: { trial_remaining: 0 },
      },
    },
    {
      id: 'feature_required',
      name: '功能需要登录',
      trigger: {
        type: 'feature_required' as const,
        message: '保存功能需要登录，这样您就不会丢失宝贵的分析结果',
        urgency: 'low' as const,
        allowSkip: true,
      },
      context: {
        previousAction: 'save_report',
        returnUrl: '/test-login-analytics',
        metadata: { feature: 'save_report' },
      },
    },
    {
      id: 'premium_feature',
      name: '高级功能',
      trigger: {
        type: 'premium_feature' as const,
        message: '这是高级功能，需要登录后才能使用',
        urgency: 'high' as const,
        allowSkip: true,
      },
      context: {
        previousAction: 'advanced_analytics',
        returnUrl: '/test-login-analytics',
        metadata: { feature: 'advanced_analytics' },
      },
    },
  ];

  const handleTestScenario = (scenario: typeof testScenarios[0]) => {
    setTrigger(scenario.trigger);
    setContext(scenario.context);
    setShowModal(true);
  };

  const handleModalSuccess = (result: any) => {
    console.log('Login success:', result);
    setShowModal(false);
    // 重新加载数据以显示最新统计
    setTimeout(loadAnalyticsData, 1000);
  };

  const handleModalCancel = () => {
    console.log('Login cancelled');
    setShowModal(false);
    // 重新加载数据以显示最新统计
    setTimeout(loadAnalyticsData, 1000);
  };

  const handleModalSkip = () => {
    console.log('Login skipped');
    setShowModal(false);
    // 重新加载数据以显示最新统计
    setTimeout(loadAnalyticsData, 1000);
  };

  // 手动记录分析事件
  const recordTestEvent = async (eventType: string) => {
    try {
      switch (eventType) {
        case 'prompt_shown':
          await LoginAnalyticsService.recordPromptShown(
            {
              type: 'feature_required',
              message: '测试登录提示显示',
              urgency: 'medium',
              allowSkip: true,
            },
            {
              previousAction: 'test_action',
              returnUrl: '/test-login-analytics',
            },
            fingerprint?.visitorId
          );
          break;
        case 'login_attempt':
          await LoginAnalyticsService.recordLoginAttempt(
            'github',
            { returnUrl: '/test-login-analytics' },
            fingerprint?.visitorId
          );
          break;
        case 'login_success':
          await LoginAnalyticsService.recordLoginSuccess(
            'github',
            'test-user-id',
            { returnUrl: '/test-login-analytics' },
            fingerprint?.visitorId,
            false
          );
          break;
        case 'login_failed':
          await LoginAnalyticsService.recordLoginFailed(
            'github',
            'TEST_ERROR',
            'Test login failure',
            { returnUrl: '/test-login-analytics' },
            fingerprint?.visitorId
          );
          break;
      }
      
      // 重新加载数据
      setTimeout(loadAnalyticsData, 500);
    } catch (error) {
      console.error('Failed to record test event:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">登录分析测试</h1>
          <p className="text-gray-600 mt-2">测试登录数据分析和跟踪功能</p>
        </div>
        <Button onClick={loadAnalyticsData} disabled={loading}>
          {loading ? '加载中...' : '刷新数据'}
        </Button>
      </div>

      {/* 测试场景 */}
      <Card>
        <CardHeader>
          <CardTitle>测试登录场景</CardTitle>
          <CardDescription>
            点击下面的按钮测试不同的登录触发场景，每次操作都会记录分析数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testScenarios.map((scenario) => (
              <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{scenario.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{scenario.trigger.message}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      scenario.trigger.urgency === 'high' ? 'destructive' :
                      scenario.trigger.urgency === 'medium' ? 'default' : 'secondary'
                    }>
                      {scenario.trigger.urgency}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => handleTestScenario(scenario)}
                    >
                      测试
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 手动事件记录 */}
      <Card>
        <CardHeader>
          <CardTitle>手动记录事件</CardTitle>
          <CardDescription>
            直接记录特定的分析事件用于测试
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => recordTestEvent('prompt_shown')}
            >
              记录提示显示
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => recordTestEvent('login_attempt')}
            >
              记录登录尝试
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => recordTestEvent('login_success')}
            >
              记录登录成功
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => recordTestEvent('login_failed')}
            >
              记录登录失败
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 转化率统计 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>转化率统计</CardTitle>
            <CardDescription>
              登录流程的整体转化率和各维度分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_prompts}</div>
                <div className="text-sm text-gray-600">总提示次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.total_attempts}</div>
                <div className="text-sm text-gray-600">总尝试次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total_successes}</div>
                <div className="text-sm text-gray-600">总成功次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.overall_conversion_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">整体转化率</div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 按提供商统计 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">按登录方式统计</h3>
                <div className="space-y-3">
                  {Object.entries(stats.by_provider).map(([provider, data]) => (
                    <div key={provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{provider}</Badge>
                        <span className="text-sm">
                          {data.successes}/{data.attempts} 次成功
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{data.success_rate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">成功率</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 按触发类型统计 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">按触发场景统计</h3>
                <div className="space-y-3">
                  {Object.entries(stats.by_trigger).map(([trigger, data]) => (
                    <div key={trigger} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{trigger}</Badge>
                        <span className="text-sm">
                          {data.successes}/{data.prompts} 次转化
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{data.conversion_rate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">转化率</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 漏斗分析 */}
      {funnelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>登录漏斗分析</CardTitle>
            <CardDescription>
              用户从看到登录提示到成功登录的流程分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 趋势分析 */}
      {trendsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>登录提示趋势</CardTitle>
            <CardDescription>
              登录提示显示次数的时间趋势
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 设备信息 */}
      <Card>
        <CardHeader>
          <CardTitle>当前设备信息</CardTitle>
          <CardDescription>
            用于分析跟踪的设备指纹和环境信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>设备指纹:</strong> {fingerprint?.visitorId || '加载中...'}
            </div>
            <div>
              <strong>用户代理:</strong> {navigator.userAgent.slice(0, 50)}...
            </div>
            <div>
              <strong>屏幕分辨率:</strong> {window.screen.width} x {window.screen.height}
            </div>
            <div>
              <strong>时区:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 登录模态框 */}
      <SmartLoginModal
        open={showModal}
        onOpenChange={setShowModal}
        trigger={trigger}
        context={context}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
        onSkip={handleModalSkip}
      />
    </div>
  );
}