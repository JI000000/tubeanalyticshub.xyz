/**
 * 指纹识别测试页面
 * 用于测试和调试指纹识别功能
 */

'use client';

import { useState } from 'react';
import { useFingerprint, useFingerprintId, useFingerprintStatus } from '@/hooks/useFingerprint';
import { verifyFingerprintIntegrity } from '@/lib/fingerprint';
import type { FingerprintData, FingerprintIntegrityCheck } from '@/types/fingerprint';

export default function TestFingerprintPage() {
  const [integrityCheck, setIntegrityCheck] = useState<FingerprintIntegrityCheck | null>(null);
  
  // 使用完整的指纹Hook
  const {
    fingerprint,
    isLoading,
    error,
    validation,
    summary,
    generate,
    clear,
    validate,
    getSummary,
    retry,
    isValid,
    isExpired,
    confidence,
  } = useFingerprint({
    autoGenerate: true,
    validateOnGenerate: true,
    onGenerated: (fp) => console.log('指纹生成成功:', fp),
    onError: (err) => console.error('指纹生成失败:', err),
    onValidated: (val) => console.log('指纹验证结果:', val),
  });

  // 使用简化的指纹ID Hook
  const { fingerprintId } = useFingerprintId();

  // 使用指纹状态Hook
  const fingerprintStatus = useFingerprintStatus();

  // 检查指纹完整性
  const checkIntegrity = () => {
    if (fingerprint) {
      const check = verifyFingerprintIntegrity(fingerprint);
      setIntegrityCheck(check);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">指纹识别测试页面</h1>
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">正在生成指纹...</span>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">错误信息</h3>
          <p className="text-red-700">{error.message}</p>
          <button
            onClick={retry}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重试
          </button>
        </div>
      )}

      {/* 指纹信息 */}
      {fingerprint && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-green-800 font-semibold mb-3">指纹信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>指纹ID:</strong>
              <div className="font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                {fingerprint.visitorId}
              </div>
            </div>
            <div>
              <strong>置信度:</strong>
              <div className="mt-1">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${confidence * 100}%` }}
                    ></div>
                  </div>
                  <span>{(confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div>
              <strong>生成时间:</strong>
              <div className="mt-1">{new Date(fingerprint.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <strong>状态:</strong>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isValid ? '有效' : '无效'}
                </span>
                {isExpired && (
                  <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                    已过期
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 浏览器信息 */}
      {fingerprint?.browserInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-blue-800 font-semibold mb-3">浏览器信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>用户代理:</strong>
              <div className="font-mono bg-gray-100 p-2 rounded mt-1 text-xs break-all">
                {fingerprint.browserInfo.userAgent}
              </div>
            </div>
            <div>
              <strong>语言:</strong>
              <div className="mt-1">{fingerprint.browserInfo.language}</div>
            </div>
            <div>
              <strong>平台:</strong>
              <div className="mt-1">{fingerprint.browserInfo.platform}</div>
            </div>
            <div>
              <strong>屏幕分辨率:</strong>
              <div className="mt-1">{fingerprint.browserInfo.screenResolution}</div>
            </div>
            <div>
              <strong>时区:</strong>
              <div className="mt-1">{fingerprint.browserInfo.timezone}</div>
            </div>
            <div>
              <strong>Cookie支持:</strong>
              <div className="mt-1">{fingerprint.browserInfo.cookieEnabled ? '是' : '否'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 验证信息 */}
      {validation && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="text-purple-800 font-semibold mb-3">验证结果</h3>
          <div className="text-sm">
            <div className="mb-2">
              <strong>验证状态:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {validation.isValid ? '通过' : '失败'}
              </span>
            </div>
            <div className="mb-2">
              <strong>置信度:</strong> {(validation.confidence * 100).toFixed(1)}%
            </div>
            {validation.reasons.length > 0 && (
              <div>
                <strong>失败原因:</strong>
                <ul className="list-disc list-inside mt-1 text-red-700">
                  {validation.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 摘要信息 */}
      {summary && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-gray-800 font-semibold mb-3">摘要信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>数据源:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                summary.source === 'cache' ? 'bg-blue-100 text-blue-800' :
                summary.source === 'fresh' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {summary.source === 'cache' ? '缓存' : 
                 summary.source === 'fresh' ? '新生成' : 'Cookie'}
              </span>
            </div>
            <div>
              <strong>数据年龄:</strong>
              <span className="ml-2">{Math.round(summary.age / 1000)}秒</span>
            </div>
          </div>
        </div>
      )}

      {/* 完整性检查 */}
      {integrityCheck && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="text-orange-800 font-semibold mb-3">完整性检查</h3>
          <div className="text-sm">
            <div className="mb-2">
              <strong>检查结果:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                integrityCheck.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {integrityCheck.isValid ? '完整' : '可能被篡改'}
              </span>
            </div>
            <div className="mb-2">
              <strong>风险等级:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                integrityCheck.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                integrityCheck.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {integrityCheck.riskLevel === 'low' ? '低' :
                 integrityCheck.riskLevel === 'medium' ? '中' : '高'}
              </span>
            </div>
            {integrityCheck.tamperedFields.length > 0 && (
              <div>
                <strong>可能被篡改的字段:</strong>
                <ul className="list-disc list-inside mt-1 text-red-700">
                  {integrityCheck.tamperedFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 状态监控 */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <h3 className="text-indigo-800 font-semibold mb-3">状态监控</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {fingerprintStatus.hasFingerprint ? '✓' : '✗'}
            </div>
            <div>有指纹</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {fingerprintStatus.isValid ? '✓' : '✗'}
            </div>
            <div>有效</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {(fingerprintStatus.confidence * 100).toFixed(0)}%
            </div>
            <div>置信度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Math.round(fingerprintStatus.age / 1000)}s
            </div>
            <div>年龄</div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={generate}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          重新生成指纹
        </button>
        
        <button
          onClick={() => validate()}
          disabled={!fingerprint}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          验证指纹
        </button>
        
        <button
          onClick={getSummary}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          获取摘要
        </button>
        
        <button
          onClick={checkIntegrity}
          disabled={!fingerprint}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          检查完整性
        </button>
        
        <button
          onClick={clear}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          清除指纹
        </button>
        
        <button
          onClick={fingerprintStatus.refresh}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          刷新状态
        </button>
      </div>

      {/* 简化版指纹ID显示 */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">简化版指纹ID:</h4>
        <div className="font-mono text-sm break-all">
          {fingerprintId || '未生成'}
        </div>
      </div>

      {/* 调试信息 */}
      <details className="mt-6">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
          调试信息 (点击展开)
        </summary>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              fingerprint,
              validation,
              summary,
              integrityCheck,
              fingerprintStatus,
            }, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}