'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConversionDashboard } from '@/components/auth/ConversionDashboard';
import { SmartLoginModal } from '@/components/auth/SmartLoginModal';
import { 
  ABTestManager, 
  AB_TEST_TEMPLATES,
  type ABTestExperiment 
} from '@/lib/ab-testing';
import { 
  DynamicOptimizationManager,
  generateUserContext 
} from '@/lib/dynamic-optimization';
import { 
  SmartTimingEngine,
  trackUserBehavior 
} from '@/lib/smart-timing';
import { 
  PersonalizationManager,
  USER_PERSONAS 
} from '@/lib/personalization';
import { useFingerprint } from '@/hooks/useFingerprint';
import { 
  TestTube, 
  Target, 
  Clock, 
  User, 
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Settings
} from 'lucide-react';

export default function ConversionOptimizationTestPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [timingPrediction, setTimingPrediction] = useState<any>(null);
  const [personalizationData, setPersonalizationData] = useState<any>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const { fingerprint } = useFingerprint();

  // 初始化系统
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        // 初始化各个系统
        await ABTestManager.initialize();
        await DynamicOptimizationManager.initialize();
        await PersonalizationManager.initialize();

        console.log('所有优化系统已初始化');
      } catch (error) {
        console.error('系统初始化失败:', error);
      }
    };

    initializeSystems();
  }, []);

  // 跟踪用户行为
  const handleUserAction = (action: string, data?: any) => {
    if (fingerprint?.visitorId) {
      trackUserBehavior(
        action as any,
        fingerprint.visitorId,
        sessionId,
        data
      );
    }
  };

  // 创建A/B测试实验
  const createABTest = async (templateKey: keyof typeof AB_TEST_TEMPLATES) => {
    try {
      const template = AB_TEST_TEMPLATES[templateKey];
      const experiment: any = {
        ...template,
        status: 'running',
        startDate: new Date(),
        trafficAllocation: 100,
        segmentRules: {
          userType: 'all',
          deviceType: 'all',
        },
      };

      const experimentId = await ABTestManager.createExperiment(experiment);
      if (experimentId) {
        setCurrentTest(experimentId);
        console.log(`A/B测试实验已创建: ${experimentId}`);
      }
    } catch (error) {
      console.error('创建A/B测试失败:', error);
    }
  };

  // 获取A/B测试分配
  const getABTestAssignment = async () => {
    if (!currentTest || !fingerprint?.visitorId) return;

    try {
      const assignment = await ABTestManager.getAssignment(
        currentTest,
        fingerprint.visitorId,
        undefined,
        {
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
          userType: 'new',
          triggerType: 'manual',
        }
      );

      if (assignment) {
        console.log('获得A/B测试分配:', assignment);
        // 记录展示事件
        await ABTestManager.recordEvent(
          currentTest,
          assignment.id,
          'impression',
          fingerprint.visitorId
        );
      }
    } catch (error) {
      console.error('获取A/B测试分配失败:', error);
    }
  };

  // 获取动态优化配置
  const getDynamicOptimization = async () => {
    if (!fingerprint?.visitorId) return;

    try {
      const context = generateUserContext(fingerprint.visitorId, {
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
        sessionDuration: Date.now() - parseInt(sessionId.split('_')[1]),
        trialRemaining: 3,
        previousInteractions: 5,
      });

      const optimalConfig = await DynamicOptimizationManager.getOptimalConfig(context);
      setOptimizationData(optimalConfig);
      console.log('动态优化配置:', optimalConfig);
    } catch (error) {
      console.error('获取动态优化配置失败:', error);
    }
  };

  // 获取智能时机预测
  const getTimingPrediction = async () => {
    if (!fingerprint?.visitorId) return;

    try {
      const prediction = await SmartTimingEngine.predictOptimalTiming(
        fingerprint.visitorId,
        {
          currentPage: '/test-conversion-optimization',
          sessionDuration: Date.now() - parseInt(sessionId.split('_')[1]),
          trialRemaining: 3,
          lastAction: 'page_view',
          recentEvents: ['page_view', 'feature_click'],
        }
      );

      setTimingPrediction(prediction);
      console.log('智能时机预测:', prediction);
    } catch (error) {
      console.error('获取时机预测失败:', error);
    }
  };

  // 获取个性化引导
  const getPersonalizedGuidance = async () => {
    if (!fingerprint?.visitorId) return;

    try {
      const guidance = await PersonalizationManager.getPersonalizedGuidance(
        fingerprint.visitorId,
        {
          sessionDuration: Date.now() - parseInt(sessionId.split('_')[1]),
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
          timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
          featuresUsed: ['test_page', 'conversion_optimization'],
          trialRemaining: 3,
        }
      );

      setPersonalizationData(guidance);
      console.log('个性化引导:', guidance);
    } catch (error) {
      console.error('获取个性化引导失败:', error);
    }
  };

  // 触发登录模态框
  const triggerLoginModal = () => {
    handleUserAction('feature_click', { feature: 'login_trigger' });
    setShowLoginModal(true);
  };

  // 模拟用户行为
  const simulateUserBehavior = () => {
    const behaviors = [
      'page_view',
      'scroll',
      'feature_click',
      'hover',
      'search',
    ];

    behaviors.forEach((behavior, index) => {
      setTimeout(() => {
        handleUserAction(behavior, { 
          feature: `test_feature_${index}`,
          timestamp: Date.now() 
        });
      }, index * 1000);
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">登录转化率优化测试</h1>
        <p className="text-muted-foreground">
          测试A/B实验、动态优化、智能时机和个性化引导功能
        </p>
      </div>

      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            控制面板
          </CardTitle>
          <CardDescription>
            控制和测试各种转化率优化功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => createABTest('LOGIN_COPY_TEST')}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              创建文案A/B测试
            </Button>
            
            <Button
              onClick={() => createABTest('BUTTON_STYLE_TEST')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              创建按钮样式测试
            </Button>
            
            <Button
              onClick={getDynamicOptimization}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              获取动态优化
            </Button>
            
            <Button
              onClick={getTimingPrediction}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              预测最佳时机
            </Button>
            
            <Button
              onClick={getPersonalizedGuidance}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              获取个性化引导
            </Button>
            
            <Button
              onClick={simulateUserBehavior}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              模拟用户行为
            </Button>
            
            <Button
              onClick={triggerLoginModal}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              触发登录模态框
            </Button>
            
            <Button
              onClick={getABTestAssignment}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              获取A/B测试分配
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 测试结果展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 动态优化结果 */}
        {optimizationData && (
          <Card>
            <CardHeader>
              <CardTitle>动态优化配置</CardTitle>
              <CardDescription>基于用户行为的最优配置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">候选项ID:</span>
                  <span className="ml-2">{optimizationData.id}</span>
                </div>
                <div>
                  <span className="font-medium">名称:</span>
                  <span className="ml-2">{optimizationData.name}</span>
                </div>
                <div>
                  <span className="font-medium">性能评分:</span>
                  <span className="ml-2">{optimizationData.performance?.score || 0}</span>
                </div>
                {optimizationData.config?.buttonStyle && (
                  <div>
                    <span className="font-medium">按钮样式:</span>
                    <div className="mt-2 p-3 border rounded" style={{
                      backgroundColor: optimizationData.config.buttonStyle.backgroundColor,
                      color: optimizationData.config.buttonStyle.color,
                      borderRadius: `${optimizationData.config.buttonStyle.borderRadius}px`,
                    }}>
                      示例按钮
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 智能时机预测 */}
        {timingPrediction && (
          <Card>
            <CardHeader>
              <CardTitle>智能时机预测</CardTitle>
              <CardDescription>基于用户行为的最佳登录时机</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">是否应该触发:</span>
                  <span className={`ml-2 ${timingPrediction.shouldTrigger ? 'text-green-600' : 'text-red-600'}`}>
                    {timingPrediction.shouldTrigger ? '是' : '否'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">置信度:</span>
                  <span className="ml-2">{(timingPrediction.confidence * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="font-medium">建议延迟:</span>
                  <span className="ml-2">{timingPrediction.recommendedDelay}ms</span>
                </div>
                <div>
                  <span className="font-medium">原因:</span>
                  <span className="ml-2">{timingPrediction.reason}</span>
                </div>
                <div>
                  <span className="font-medium">触发类型:</span>
                  <span className="ml-2">{timingPrediction.suggestedTrigger?.type}</span>
                </div>
                <div>
                  <span className="font-medium">紧急程度:</span>
                  <span className="ml-2">{timingPrediction.suggestedTrigger?.urgency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 个性化引导 */}
        {personalizationData && (
          <Card>
            <CardHeader>
              <CardTitle>个性化引导</CardTitle>
              <CardDescription>基于用户画像的个性化内容</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">用户画像:</span>
                  <span className="ml-2">{personalizationData.persona?.name}</span>
                </div>
                <div>
                  <span className="font-medium">画像描述:</span>
                  <span className="ml-2">{personalizationData.persona?.description}</span>
                </div>
                <div>
                  <span className="font-medium">内容标题:</span>
                  <span className="ml-2">{personalizationData.content?.title}</span>
                </div>
                <div>
                  <span className="font-medium">内容消息:</span>
                  <span className="ml-2">{personalizationData.content?.message}</span>
                </div>
                <div>
                  <span className="font-medium">按钮文本:</span>
                  <span className="ml-2">{personalizationData.content?.buttonText}</span>
                </div>
                {personalizationData.content?.benefits && (
                  <div>
                    <span className="font-medium">权益列表:</span>
                    <ul className="ml-2 mt-1 list-disc list-inside">
                      {personalizationData.content.benefits.map((benefit: string, index: number) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 当前测试状态 */}
        {currentTest && (
          <Card>
            <CardHeader>
              <CardTitle>当前A/B测试</CardTitle>
              <CardDescription>正在运行的实验状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">实验ID:</span>
                  <span className="ml-2 font-mono text-sm">{currentTest}</span>
                </div>
                <div>
                  <span className="font-medium">状态:</span>
                  <span className="ml-2 text-green-600">运行中</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => ABTestManager.updateExperimentStatus(currentTest, 'paused')}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    暂停
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ABTestManager.updateExperimentStatus(currentTest, 'completed')}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    完成
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* 转化率仪表板 */}
      <div>
        <h2 className="text-2xl font-bold mb-4">实时转化率仪表板</h2>
        <ConversionDashboard />
      </div>

      {/* 登录模态框 */}
      <SmartLoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        trigger={{
          type: 'feature_required',
          message: '测试登录转化率优化功能',
          urgency: 'medium',
          allowSkip: true,
        }}
        context={{
          previousAction: 'test_conversion_optimization',
          returnUrl: '/test-conversion-optimization',
          metadata: {
            testType: 'conversion_optimization',
            currentTest,
          },
        }}
        onSuccess={(result) => {
          console.log('登录成功:', result);
          handleUserAction('login_success', { provider: result.provider });
        }}
        onCancel={() => {
          console.log('登录取消');
          handleUserAction('login_cancelled');
        }}
        onSkip={() => {
          console.log('登录跳过');
          handleUserAction('login_skipped');
        }}
      />
    </div>
  );
}