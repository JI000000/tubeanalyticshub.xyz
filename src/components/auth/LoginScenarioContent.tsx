'use client';

import React from 'react';
import { AlertTriangle, Save, Crown, Download, Lock, Zap, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoginTrigger {
  type: 'trial_exhausted' | 'feature_required' | 'save_action' | 'premium_feature' | 'data_export';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  allowSkip: boolean;
}

export interface LoginContext {
  previousAction: string;
  returnUrl: string;
  metadata?: any;
}

interface LoginScenarioContentProps {
  trigger: LoginTrigger;
  context?: LoginContext;
  isMobile?: boolean;
  className?: string;
}

// 试用次数用完场景内容
function TrialExhaustedContent({ isMobile }: { isMobile?: boolean }) {
  return (
    <div className={cn("space-y-4", isMobile && "px-2")}>
      {/* 图标和标题 */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          免费试用已用完
        </h3>
        <p className="text-sm text-gray-600">
          您已经使用完所有免费分析次数，登录后即可获得更多权益
        </p>
      </div>

      {/* 登录后的权益说明 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-base font-medium text-blue-900 mb-3 flex items-center gap-2">
          <Crown className="w-4 h-4" />
          登录后立即获得
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>无限制分析</strong> - 不再受次数限制，随时分析任何视频</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>保存报告</strong> - 永久保存分析结果，随时查看历史数据</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>高级功能</strong> - 解锁竞品分析、趋势预测等专业工具</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>数据导出</strong> - 支持Excel、PDF等格式导出分析报告</span>
          </li>
        </ul>
      </div>

      {/* 紧迫感提示 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-sm text-orange-800 text-center">
          <Zap className="w-4 h-4 inline mr-1" />
          现在登录，立即恢复分析功能
        </p>
      </div>
    </div>
  );
}

// 保存功能需要登录场景内容
function SaveActionContent({ context, isMobile }: { context?: LoginContext; isMobile?: boolean }) {
  const actionName = context?.metadata?.actionName || '保存分析报告';
  
  return (
    <div className={cn("space-y-4", isMobile && "px-2")}>
      {/* 图标和标题 */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Save className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          保存您的工作成果
        </h3>
        <p className="text-sm text-gray-600">
          登录后即可保存「{actionName}」，避免数据丢失
        </p>
      </div>

      {/* 保存功能的价值说明 */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
        <h4 className="text-base font-medium text-green-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          为什么需要登录保存？
        </h4>
        <ul className="space-y-2 text-sm text-green-800">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>数据安全</strong> - 确保您的分析结果安全存储，不会丢失</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>随时访问</strong> - 在任何设备上都能查看您保存的报告</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>历史记录</strong> - 建立完整的分析历史，便于对比和追踪</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>团队协作</strong> - 与团队成员分享和协作分析结果</span>
          </li>
        </ul>
      </div>

      {/* 操作提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 text-center">
          登录后将自动保存当前分析结果，无需重新操作
        </p>
      </div>
    </div>
  );
}

// 高级功能需要登录场景内容
function PremiumFeatureContent({ context, isMobile }: { context?: LoginContext; isMobile?: boolean }) {
  const featureName = context?.metadata?.featureName || '高级分析功能';
  
  return (
    <div className={cn("space-y-4", isMobile && "px-2")}>
      {/* 图标和标题 */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          解锁高级功能
        </h3>
        <p className="text-sm text-gray-600">
          「{featureName}」是专为注册用户提供的高级功能
        </p>
      </div>

      {/* 高级功能权益说明 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
        <h4 className="text-base font-medium text-purple-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          高级功能包含
        </h4>
        <ul className="space-y-2 text-sm text-purple-800">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>竞品分析</strong> - 深度对比同类视频的表现数据</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>趋势预测</strong> - AI驱动的视频表现趋势预测</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>批量分析</strong> - 一次性分析多个视频或频道</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>API访问</strong> - 通过API集成到您的工作流程</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>团队协作</strong> - 邀请团队成员共同分析和讨论</span>
          </li>
        </ul>
      </div>

      {/* 价值主张 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 text-center font-medium">
          <Users className="w-4 h-4 inline mr-1" />
          加入 10,000+ 专业创作者，提升您的YouTube策略
        </p>
      </div>
    </div>
  );
}

// 数据导出需要登录场景内容
function DataExportContent({ context, isMobile }: { context?: LoginContext; isMobile?: boolean }) {
  const exportFormat = context?.metadata?.format || 'Excel';
  
  return (
    <div className={cn("space-y-4", isMobile && "px-2")}>
      {/* 图标和标题 */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Download className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          安全导出数据
        </h3>
        <p className="text-sm text-gray-600">
          为保护数据安全，导出{exportFormat}格式需要登录验证
        </p>
      </div>

      {/* 安全说明 */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-base font-medium text-blue-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          为什么需要登录导出？
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>数据安全</strong> - 确保只有授权用户才能导出敏感数据</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>使用追踪</strong> - 记录导出历史，便于数据管理和审计</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>格式优化</strong> - 为注册用户提供更多导出格式选择</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span><strong>云端存储</strong> - 导出文件自动保存到您的账户中</span>
          </li>
        </ul>
      </div>

      {/* 导出功能说明 */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
        <h4 className="text-base font-medium text-green-900 mb-3 flex items-center gap-2">
          <Download className="w-4 h-4" />
          支持的导出格式
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <span>Excel (.xlsx)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <span>PDF 报告</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <span>CSV 数据</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <span>JSON 格式</span>
          </div>
        </div>
      </div>

      {/* 操作提示 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-sm text-gray-700 text-center">
          登录后将立即开始下载，文件也会保存到您的账户中
        </p>
      </div>
    </div>
  );
}

// 通用功能需要登录场景内容
function FeatureRequiredContent({ context, isMobile }: { context?: LoginContext; isMobile?: boolean }) {
  const featureName = context?.metadata?.featureName || '此功能';
  
  return (
    <div className={cn("space-y-4", isMobile && "px-2")}>
      {/* 图标和标题 */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          登录后使用
        </h3>
        <p className="text-sm text-gray-600">
          {featureName}需要登录后才能使用
        </p>
      </div>

      {/* 基础权益说明 */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-base font-medium text-blue-900 mb-3">
          登录后即可使用
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span>完整的功能访问权限</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span>个人数据和设置同步</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
            <span>使用历史和偏好记录</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function LoginScenarioContent({ trigger, context, isMobile, className }: LoginScenarioContentProps) {
  const renderContent = () => {
    switch (trigger.type) {
      case 'trial_exhausted':
        return <TrialExhaustedContent isMobile={isMobile} />;
      case 'save_action':
        return <SaveActionContent context={context} isMobile={isMobile} />;
      case 'premium_feature':
        return <PremiumFeatureContent context={context} isMobile={isMobile} />;
      case 'data_export':
        return <DataExportContent context={context} isMobile={isMobile} />;
      case 'feature_required':
      default:
        return <FeatureRequiredContent context={context} isMobile={isMobile} />;
    }
  };

  return (
    <div className={cn("login-scenario-content", className)}>
      {renderContent()}
    </div>
  );
}

export default LoginScenarioContent;