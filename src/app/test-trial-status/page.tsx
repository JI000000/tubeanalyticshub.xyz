'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrialStatusIndicator } from '@/components/auth/TrialStatusIndicator';
import { LoginBenefitsCard } from '@/components/auth/LoginBenefitsCard';
import { SmartLoginModal } from '@/components/auth/SmartLoginModal';
import { useAnonymousTrial } from '@/hooks/useAnonymousTrial';
import { TRIAL_ACTION_TYPES } from '@/lib/trial-config';

export default function TestTrialStatusPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalTrigger, setModalTrigger] = useState<any>(null);
  
  const {
    trialStatus,
    consumeTrial,
    resetTrial,
    getRemainingTrials,
    isTrialExhausted,
    getStatusMessage,
  } = useAnonymousTrial();

  const handleLoginClick = () => {
    setModalTrigger({
      type: 'trial_exhausted',
      message: '免费试用已用完，登录即可继续使用所有功能',
      urgency: 'high',
      allowSkip: false,
    });
    setShowModal(true);
  };

  const handleConsumeVideo = async () => {
    await consumeTrial(TRIAL_ACTION_TYPES.VIDEO_ANALYSIS, {
      videoId: 'test-video-123',
      source: 'test-page',
    });
  };

  const handleConsumeChannel = async () => {
    await consumeTrial(TRIAL_ACTION_TYPES.CHANNEL_ANALYSIS, {
      channelId: 'test-channel-456',
      source: 'test-page',
    });
  };

  const handleReset = async () => {
    await resetTrial({ reason: 'test_reset' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            试用状态指示器测试页面
          </h1>
          <p className="text-gray-600">
            测试不同的试用状态显示组件和登录权益说明
          </p>
        </div>

        {/* 当前状态信息 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">当前试用状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">剩余次数:</span>
              <span className="ml-2">{getRemainingTrials()}</span>
            </div>
            <div>
              <span className="font-medium">是否耗尽:</span>
              <span className="ml-2">{isTrialExhausted() ? '是' : '否'}</span>
            </div>
            <div>
              <span className="font-medium">状态消息:</span>
              <span className="ml-2">{getStatusMessage()}</span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleConsumeVideo} size="sm">
              消耗1次 (视频分析)
            </Button>
            <Button onClick={handleConsumeChannel} size="sm" variant="outline">
              消耗2次 (频道分析)
            </Button>
            <Button onClick={handleReset} size="sm" variant="outline">
              重置试用
            </Button>
          </div>
        </div>

        {/* 试用状态指示器 - 不同变体 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">试用状态指示器变体</h2>
          
          {/* 紧凑模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">紧凑模式 (Compact)</h3>
            <div className="space-y-3">
              <TrialStatusIndicator
                variant="compact"
                onLoginClick={handleLoginClick}
              />
              <TrialStatusIndicator
                variant="compact"
                onLoginClick={handleLoginClick}
                showLoginButton={false}
              />
            </div>
          </div>

          {/* 横幅模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">横幅模式 (Banner)</h3>
            <TrialStatusIndicator
              variant="banner"
              onLoginClick={handleLoginClick}
            />
          </div>

          {/* 工具提示模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">工具提示模式 (Tooltip)</h3>
            <div className="flex items-center gap-4">
              <span>分析按钮</span>
              <TrialStatusIndicator
                variant="tooltip"
                onLoginClick={handleLoginClick}
              />
            </div>
          </div>

          {/* 详细模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">详细模式 (Detailed)</h3>
            <div className="max-w-md">
              <TrialStatusIndicator
                variant="detailed"
                onLoginClick={handleLoginClick}
                showBenefits={true}
              />
            </div>
          </div>

          {/* 自动隐藏模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">自动隐藏模式</h3>
            <p className="text-sm text-gray-600 mb-3">
              当剩余次数大于阈值时自动隐藏（阈值设为2）
            </p>
            <TrialStatusIndicator
              variant="compact"
              onLoginClick={handleLoginClick}
              autoHide={true}
              hideThreshold={2}
            />
          </div>
        </div>

        {/* 登录权益卡片 - 不同变体 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">登录权益说明变体</h2>
          
          {/* 最小化模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">最小化模式 (Minimal)</h3>
            <LoginBenefitsCard
              variant="minimal"
              onLoginClick={handleLoginClick}
            />
          </div>

          {/* 列表模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">列表模式 (List)</h3>
            <div className="max-w-md">
              <LoginBenefitsCard
                variant="list"
                onLoginClick={handleLoginClick}
              />
            </div>
          </div>

          {/* 网格模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">网格模式 (Grid)</h3>
            <div className="max-w-lg">
              <LoginBenefitsCard
                variant="grid"
                onLoginClick={handleLoginClick}
              />
            </div>
          </div>

          {/* 卡片模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">卡片模式 (Card)</h3>
            <div className="max-w-md">
              <LoginBenefitsCard
                variant="card"
                onLoginClick={handleLoginClick}
              />
            </div>
          </div>

          {/* 高级功能模式 */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">包含高级功能</h3>
            <div className="max-w-md">
              <LoginBenefitsCard
                variant="card"
                onLoginClick={handleLoginClick}
                showPremiumFeatures={true}
                title="升级到专业版"
                description="解锁所有高级功能，提升您的分析能力"
              />
            </div>
          </div>
        </div>

        {/* 组合使用示例 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">组合使用示例</h2>
          <p className="text-gray-600 mb-4">
            在实际应用中，可以将试用状态指示器和权益说明组合使用
          </p>
          
          <div className="space-y-4">
            {/* 页面顶部横幅 */}
            <div>
              <h4 className="font-medium mb-2">页面顶部横幅</h4>
              <TrialStatusIndicator
                variant="banner"
                onLoginClick={handleLoginClick}
              />
            </div>

            {/* 功能按钮旁的提示 */}
            <div>
              <h4 className="font-medium mb-2">功能按钮旁的提示</h4>
              <div className="flex items-center gap-3">
                <Button>分析视频</Button>
                <TrialStatusIndicator
                  variant="compact"
                  onLoginClick={handleLoginClick}
                />
              </div>
            </div>

            {/* 侧边栏权益说明 */}
            <div>
              <h4 className="font-medium mb-2">侧边栏权益说明</h4>
              <div className="max-w-xs">
                <LoginBenefitsCard
                  variant="list"
                  onLoginClick={handleLoginClick}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 登录模态框 */}
        <SmartLoginModal
          open={showModal}
          onOpenChange={setShowModal}
          trigger={modalTrigger}
          onSuccess={(result) => {
            console.log('Login success:', result);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      </div>
    </div>
  );
}