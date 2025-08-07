'use client';

import { useState, useEffect } from 'react';
import { useFingerprint } from '@/hooks/useFingerprint';
import { TRIAL_ACTION_TYPES } from '@/lib/trial-config';

interface TrialStatus {
  success: boolean;
  remaining: number;
  total: number;
  isBlocked: boolean;
  nextResetAt: string;
  actions: any[];
  stats: {
    totalActions: number;
    actionsToday: number;
    actionsThisHour: number;
    lastActionAt: string | null;
  };
}

interface ConsumeResponse {
  success: boolean;
  remaining: number;
  blocked?: boolean;
  message: string;
  nextResetAt?: string;
  rateLimited?: boolean;
}

export default function TestTrialApiPage() {
  const { fingerprint, isLoading: fingerprintLoading } = useFingerprint();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ConsumeResponse | null>(null);

  // 获取试用状态
  const fetchTrialStatus = async () => {
    if (!fingerprint) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trial/consume?fingerprint=${fingerprint}`);
      const data = await response.json();

      if (data.success) {
        setTrialStatus(data);
      } else {
        setError(data.message || '获取状态失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 消耗试用次数
  const consumeTrial = async (action: string) => {
    if (!fingerprint) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/trial/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          fingerprint,
          metadata: {
            testAction: true,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data: ConsumeResponse = await response.json();
      setLastResponse(data);

      // 刷新状态
      await fetchTrialStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 重置试用状态（仅开发环境）
  const resetTrial = async () => {
    if (!fingerprint) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trial/consume?fingerprint=${fingerprint}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchTrialStatus();
      } else {
        setError(data.message || '重置失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (fingerprint) {
      fetchTrialStatus();
    }
  }, [fingerprint]);

  if (fingerprintLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在生成设备指纹...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">试用消耗API测试</h1>
          
          {/* 设备信息 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">设备信息</h2>
            <p className="text-sm text-gray-600 break-all">
              指纹: {typeof fingerprint === 'string' ? fingerprint : (fingerprint ? JSON.stringify(fingerprint) : '未生成')}
            </p>
          </div>

          {/* 错误显示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 最后响应 */}
          {lastResponse && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">最后操作结果:</h3>
              <div className="text-sm">
                <p>成功: {lastResponse.success ? '是' : '否'}</p>
                <p>剩余次数: {lastResponse.remaining}</p>
                <p>消息: {lastResponse.message}</p>
                {lastResponse.blocked && <p className="text-red-600">设备已被阻止</p>}
                {lastResponse.rateLimited && <p className="text-yellow-600">速率限制</p>}
                {lastResponse.nextResetAt && (
                  <p>下次重置: {new Date(lastResponse.nextResetAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          {/* 试用状态 */}
          {trialStatus && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-2">当前试用状态:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>剩余次数: {trialStatus.remaining}</p>
                  <p>总次数: {trialStatus.total}</p>
                  <p>是否被阻止: {trialStatus.isBlocked ? '是' : '否'}</p>
                  <p>下次重置: {new Date(trialStatus.nextResetAt).toLocaleString()}</p>
                </div>
                <div>
                  <p>总操作数: {trialStatus.stats.totalActions}</p>
                  <p>今日操作: {trialStatus.stats.actionsToday}</p>
                  <p>本小时操作: {trialStatus.stats.actionsThisHour}</p>
                  <p>最后操作: {
                    trialStatus.stats.lastActionAt 
                      ? new Date(trialStatus.stats.lastActionAt).toLocaleString()
                      : '无'
                  }</p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">测试操作:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(TRIAL_ACTION_TYPES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => consumeTrial(value)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {key.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchTrialStatus}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '加载中...' : '刷新状态'}
              </button>

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={resetTrial}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重置试用
                </button>
              )}
            </div>
          </div>

          {/* 操作历史 */}
          {trialStatus?.actions && trialStatus.actions.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">最近操作历史:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {trialStatus.actions.map((action, index) => (
                  <div key={index} className="text-sm p-2 bg-white rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{action.type}</p>
                        <p className="text-gray-600">
                          {new Date(action.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {action.metadata?.weight && (
                          <p>权重: {action.metadata.weight}</p>
                        )}
                        {action.ipAddress && (
                          <p>IP: {action.ipAddress}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}