/**
 * 匿名试用系统测试页面
 * 用于测试和演示试用功能
 */

'use client';

import { useState } from 'react';
import { useAnonymousTrial } from '@/hooks/useAnonymousTrial';
import { TRIAL_ACTION_TYPES } from '@/lib/trial-config';
import type { TrialActionType } from '@/lib/trial-config';

export default function TestTrialPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<TrialActionType>(TRIAL_ACTION_TYPES.VIDEO_ANALYSIS);

  const {
    trialStatus,
    isLoading,
    error,
    managerState,
    consumeTrial,
    canConsumeTrial,
    validateTrial,
    resetTrial,
    syncWithServer,
    getRemainingTrials,
    getTotalTrials,
    isTrialExhausted,
    isBlocked,
    getStatusMessage,
    getActionWeight,
    canPerformAction,
  } = useAnonymousTrial({
    onTrialExhausted: () => addLog('🚫 试用次数已用完！'),
    onTrialConsumed: (remaining) => addLog(`✅ 试用次数已消耗，剩余: ${remaining}`),
    onError: (error) => addLog(`❌ 错误: ${error.message}`),
    onStatusChanged: (status) => addLog(`📊 状态更新: 剩余 ${status.remaining}/${status.total}`),
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleConsumeTrial = async () => {
    addLog(`🔄 尝试消耗试用次数: ${selectedAction}`);
    const success = await consumeTrial(selectedAction, { 
      testData: 'test-metadata',
      timestamp: new Date().toISOString(),
    });
    
    if (success) {
      addLog(`✅ 成功消耗试用次数`);
    } else {
      addLog(`❌ 消耗试用次数失败`);
    }
  };

  const handleResetTrial = async () => {
    addLog('🔄 重置试用状态...');
    await resetTrial({ reason: 'manual_test_reset' });
    addLog('✅ 试用状态已重置');
  };

  const handleSyncWithServer = async () => {
    addLog('🔄 与服务器同步...');
    const success = await syncWithServer({ force: true });
    if (success) {
      addLog('✅ 同步成功');
    } else {
      addLog('❌ 同步失败');
    }
  };

  const handleValidateTrial = () => {
    const validation = validateTrial();
    addLog(`🔍 验证结果: ${JSON.stringify(validation, null, 2)}`);
  };

  const handleCheckAction = () => {
    const result = canPerformAction(selectedAction);
    addLog(`🔍 操作检查 (${selectedAction}): ${result.allowed ? '允许' : '不允许'} ${result.reason || ''}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化试用系统...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">匿名试用系统测试</h1>
          
          {/* 状态显示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">试用状态</h3>
              <p className="text-sm text-blue-700">
                剩余: {getRemainingTrials()} / {getTotalTrials()}
              </p>
              <p className="text-sm text-blue-700">
                状态: {getStatusMessage()}
              </p>
              <p className="text-sm text-blue-700">
                已用完: {isTrialExhausted() ? '是' : '否'}
              </p>
              <p className="text-sm text-blue-700">
                被阻止: {isBlocked() ? '是' : '否'}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">管理器状态</h3>
              <p className="text-sm text-green-700">
                已初始化: {managerState.isInitialized ? '是' : '否'}
              </p>
              <p className="text-sm text-green-700">
                加载中: {managerState.isLoading ? '是' : '否'}
              </p>
              <p className="text-sm text-green-700">
                错误次数: {managerState.errorCount}
              </p>
              <p className="text-sm text-green-700">
                同步中: {managerState.syncInProgress ? '是' : '否'}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">设备信息</h3>
              <p className="text-sm text-purple-700">
                指纹: {trialStatus?.fingerprint?.slice(0, 12)}...
              </p>
              <p className="text-sm text-purple-700">
                最后使用: {trialStatus?.lastUsed?.toLocaleTimeString()}
              </p>
              <p className="text-sm text-purple-700">
                操作记录: {trialStatus?.actions?.length || 0} 条
              </p>
            </div>
          </div>

          {/* 错误显示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">错误信息</h3>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}

          {/* 操作控制 */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">操作控制</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择操作类型
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value as TrialActionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(TRIAL_ACTION_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key} (权重: {getActionWeight(value)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <p>当前操作权重: {getActionWeight(selectedAction)}</p>
                  <p>可以执行: {canConsumeTrial(selectedAction) ? '是' : '否'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleConsumeTrial}
                disabled={!canConsumeTrial(selectedAction)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                消耗试用次数
              </button>

              <button
                onClick={handleCheckAction}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                检查操作权限
              </button>

              <button
                onClick={handleValidateTrial}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                验证试用状态
              </button>

              <button
                onClick={handleSyncWithServer}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                同步服务器
              </button>

              <button
                onClick={handleResetTrial}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                重置试用状态
              </button>
            </div>
          </div>

          {/* 详细信息 */}
          {trialStatus && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">详细信息</h3>
              <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(trialStatus, null, 2)}
              </pre>
            </div>
          )}

          {/* 操作日志 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">操作日志</h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">暂无日志...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              清空日志
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}