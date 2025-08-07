'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrialStatusIndicator } from './TrialStatusIndicator';
import { LoginBenefitsCard } from './LoginBenefitsCard';
import { SmartLoginModal } from './SmartLoginModal';
import { useAnonymousTrial } from '@/hooks/useAnonymousTrial';
import { TRIAL_ACTION_TYPES } from '@/lib/trial-config';

/**
 * 试用状态组件集成示例
 * 展示如何在实际应用中使用试用状态指示器和登录权益卡片
 */
export function TrialStatusExample() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTrigger, setLoginTrigger] = useState<any>(null);
  
  const {
    consumeTrial,
    getRemainingTrials,
    isTrialExhausted,
    canConsumeTrial,
  } = useAnonymousTrial();

  // 处理需要登录的操作
  const handleRequireAuth = (actionType: string, actionName: string) => {
    // 检查是否可以使用试用
    if (canConsumeTrial(actionType as any)) {
      // 可以使用试用，直接执行操作
      handleAction(actionType, actionName);
    } else {
      // 需要登录，显示登录模态框
      const trigger = isTrialExhausted() 
        ? {
            type: 'trial_exhausted',
            message: '免费试用已用完，登录即可继续使用所有功能',
            urgency: 'high',
            allowSkip: false,
          }
        : {
            type: 'feature_required',
            message: `使用${actionName}功能需要登录`,
            urgency: 'medium',
            allowSkip: true,
          };
      
      setLoginTrigger(trigger);
      setShowLoginModal(true);
    }
  };

  // 执行实际操作
  const handleAction = async (actionType: string, actionName: string) => {
    try {
      const success = await consumeTrial(actionType as any, {
        actionName,
        timestamp: new Date().toISOString(),
      });
      
      if (success) {
        alert(`${actionName}操作成功！剩余试用次数：${getRemainingTrials()}`);
      } else {
        alert('操作失败，请稍后重试');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('操作失败，请稍后重试');
    }
  };

  const handleLoginSuccess = (result: any) => {
    console.log('Login successful:', result);
    setShowLoginModal(false);
    alert('登录成功！现在可以无限制使用所有功能');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          YouTube 视频分析工具
        </h1>
        <p className="text-gray-600">
          分析任何 YouTube 视频的数据和表现
        </p>
      </div>

      {/* 页面顶部试用状态横幅 */}
      <TrialStatusIndicator
        variant="banner"
        onLoginClick={() => handleRequireAuth('general', '登录')}
      />

      {/* 主要功能区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：主要功能 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 视频分析功能 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">视频分析</h2>
            <p className="text-gray-600 mb-4">
              输入 YouTube 视频链接，获取详细的数据分析报告
            </p>
            
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="请输入 YouTube 视频链接..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => handleRequireAuth(TRIAL_ACTION_TYPES.VIDEO_ANALYSIS, '视频分析')}
                className="px-6"
              >
                分析视频
              </Button>
            </div>

            {/* 功能旁的试用状态提示 */}
            <TrialStatusIndicator
              variant="compact"
              onLoginClick={() => handleRequireAuth('general', '登录')}
            />
          </div>

          {/* 频道分析功能 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">频道分析</h2>
            <p className="text-gray-600 mb-4">
              分析整个 YouTube 频道的表现和趋势（消耗 2 次试用）
            </p>
            
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="请输入频道链接或名称..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => handleRequireAuth(TRIAL_ACTION_TYPES.CHANNEL_ANALYSIS, '频道分析')}
                variant="outline"
                className="px-6"
              >
                分析频道
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                高级功能，消耗 2 次试用机会
              </span>
              <TrialStatusIndicator
                variant="tooltip"
                onLoginClick={() => handleRequireAuth('general', '登录')}
              />
            </div>
          </div>

          {/* 批量分析功能 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">批量分析</h2>
            <p className="text-gray-600 mb-4">
              同时分析多个视频，生成对比报告（消耗 3 次试用）
            </p>
            
            <Button
              onClick={() => handleRequireAuth(TRIAL_ACTION_TYPES.BATCH_ANALYSIS, '批量分析')}
              variant="outline"
              className="w-full"
              disabled={getRemainingTrials() < 3}
            >
              {getRemainingTrials() < 3 ? '试用次数不足' : '开始批量分析'}
            </Button>

            {getRemainingTrials() < 3 && (
              <div className="mt-3">
                <TrialStatusIndicator
                  variant="detailed"
                  showBenefits={true}
                  onLoginClick={() => handleRequireAuth('general', '登录')}
                />
              </div>
            )}
          </div>
        </div>

        {/* 右侧：登录权益说明 */}
        <div className="space-y-6">
          {/* 基础权益说明 */}
          <LoginBenefitsCard
            variant="list"
            title="登录享受更多"
            description="解锁全部功能，提升分析体验"
            onLoginClick={() => handleRequireAuth('general', '登录')}
          />

          {/* 高级功能说明 */}
          <LoginBenefitsCard
            variant="grid"
            title="专业版功能"
            description="适合专业用户和团队"
            showPremiumFeatures={true}
            onLoginClick={() => handleRequireAuth('general', '登录')}
          />

          {/* 最小化提示 */}
          <div className="text-center">
            <LoginBenefitsCard
              variant="minimal"
              onLoginClick={() => handleRequireAuth('general', '登录')}
            />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            当前状态：{isTrialExhausted() ? '试用已耗尽' : `还剩 ${getRemainingTrials()} 次试用`}
          </div>
          <TrialStatusIndicator
            variant="compact"
            showLoginButton={false}
            autoHide={true}
            hideThreshold={2}
          />
        </div>
      </div>

      {/* 登录模态框 */}
      <SmartLoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        trigger={loginTrigger}
        onSuccess={handleLoginSuccess}
        onCancel={() => setShowLoginModal(false)}
        onSkip={() => {
          setShowLoginModal(false);
          alert('已跳过登录，您可以继续使用剩余的试用次数');
        }}
      />
    </div>
  );
}

export default TrialStatusExample;