'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmartLoginModal, LoginTrigger, LoginContext } from '@/components/auth/SmartLoginModal';

export default function TestScenarioModalsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<LoginTrigger | undefined>();
  const [currentContext, setCurrentContext] = useState<LoginContext | undefined>();

  const scenarios = [
    {
      id: 'trial_exhausted',
      name: '试用次数用完',
      trigger: {
        type: 'trial_exhausted' as const,
        message: '您已经使用完所有免费分析次数，登录后即可获得更多权益',
        urgency: 'high' as const,
        allowSkip: false
      },
      context: {
        previousAction: 'video_analysis',
        returnUrl: '/analysis',
        metadata: { remainingTrials: 0 }
      }
    },
    {
      id: 'save_action',
      name: '保存功能需要登录',
      trigger: {
        type: 'save_action' as const,
        message: '保存分析报告需要登录，确保您的数据安全',
        urgency: 'medium' as const,
        allowSkip: true
      },
      context: {
        previousAction: 'save_report',
        returnUrl: '/reports',
        metadata: { actionName: '视频分析报告' }
      }
    },
    {
      id: 'premium_feature',
      name: '高级功能需要登录',
      trigger: {
        type: 'premium_feature' as const,
        message: '竞品分析是专为注册用户提供的高级功能',
        urgency: 'medium' as const,
        allowSkip: true
      },
      context: {
        previousAction: 'competitor_analysis',
        returnUrl: '/premium',
        metadata: { featureName: '竞品分析' }
      }
    },
    {
      id: 'data_export',
      name: '数据导出需要登录',
      trigger: {
        type: 'data_export' as const,
        message: '为保护数据安全，导出功能需要登录验证',
        urgency: 'low' as const,
        allowSkip: false
      },
      context: {
        previousAction: 'export_data',
        returnUrl: '/export',
        metadata: { format: 'Excel' }
      }
    },
    {
      id: 'feature_required',
      name: '通用功能需要登录',
      trigger: {
        type: 'feature_required' as const,
        message: '此功能需要登录后才能使用',
        urgency: 'low' as const,
        allowSkip: true
      },
      context: {
        previousAction: 'access_feature',
        returnUrl: '/features',
        metadata: { featureName: '历史记录' }
      }
    }
  ];

  const openModal = (scenario: typeof scenarios[0]) => {
    setCurrentTrigger(scenario.trigger);
    setCurrentContext(scenario.context);
    setModalOpen(true);
  };

  const handleSuccess = (result: any) => {
    console.log('Login successful:', result);
    setModalOpen(false);
  };

  const handleCancel = () => {
    console.log('Login cancelled');
    setModalOpen(false);
  };

  const handleSkip = () => {
    console.log('Login skipped');
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            登录场景模态框测试
          </h1>
          <p className="text-lg text-gray-600">
            测试不同登录触发场景的个性化模态框内容
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {scenario.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {scenario.trigger.message}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">紧急程度:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    scenario.trigger.urgency === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : scenario.trigger.urgency === 'medium'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {scenario.trigger.urgency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">允许跳过:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    scenario.trigger.allowSkip 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {scenario.trigger.allowSkip ? '是' : '否'}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => openModal(scenario)}
                className="w-full"
                variant={scenario.trigger.urgency === 'high' ? 'default' : 'outline'}
              >
                测试此场景
              </Button>
            </div>
          ))}
        </div>

        {/* 使用说明 */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            场景说明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">试用次数用完</h3>
              <p>当用户的匿名试用次数耗尽时显示，强调登录后的无限制使用权益。</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">保存功能需要登录</h3>
              <p>当用户尝试保存分析报告或创建项目时显示，强调数据安全和持久化。</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">高级功能需要登录</h3>
              <p>当用户尝试使用竞品分析、API访问等高级功能时显示，强调专业价值。</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">数据导出需要登录</h3>
              <p>当用户尝试导出数据时显示，强调安全性和多格式支持。</p>
            </div>
          </div>
        </div>

        {/* 设计原则 */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            设计原则
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span><strong>个性化文案</strong> - 根据不同场景提供针对性的登录引导文案</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span><strong>价值导向</strong> - 强调登录后能获得的具体权益和价值</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span><strong>视觉层次</strong> - 使用图标、颜色和布局突出重点信息</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span><strong>紧迫感控制</strong> - 根据场景紧急程度调整视觉样式和文案语气</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 登录模态框 */}
      <SmartLoginModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        trigger={currentTrigger}
        context={currentContext}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        onSkip={handleSkip}
      />
    </div>
  );
}