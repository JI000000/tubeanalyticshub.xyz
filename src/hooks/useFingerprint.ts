/**
 * 指纹识别React Hook
 * 提供在React组件中使用指纹功能的便捷接口
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  generateFingerprint, 
  clearFingerprint,
  getFingerprintSummary,
  validateFingerprint,
  type FingerprintData,
  type FingerprintValidation 
} from '@/lib/fingerprint';
import type { FingerprintSummary } from '@/types/fingerprint';

// Hook选项接口
export interface UseFingerprintOptions {
  autoGenerate?: boolean; // 是否自动生成指纹
  validateOnGenerate?: boolean; // 生成后是否自动验证
  onGenerated?: (fingerprint: FingerprintData) => void; // 生成成功回调
  onError?: (error: Error) => void; // 错误回调
  onValidated?: (validation: FingerprintValidation) => void; // 验证回调
}

// Hook返回值接口
export interface UseFingerprintReturn {
  // 状态
  fingerprint: FingerprintData | null;
  isLoading: boolean;
  error: Error | null;
  validation: FingerprintValidation | null;
  summary: FingerprintSummary | null;
  
  // 操作函数
  generate: () => Promise<FingerprintData | null>;
  clear: () => void;
  validate: (data?: FingerprintData) => FingerprintValidation | null;
  getSummary: () => Promise<FingerprintSummary | null>;
  retry: () => Promise<FingerprintData | null>;
  
  // 状态查询
  isValid: boolean;
  isExpired: boolean;
  confidence: number;
}

/**
 * 指纹识别Hook
 */
export function useFingerprint(options: UseFingerprintOptions = {}): UseFingerprintReturn {
  const {
    autoGenerate = true,
    validateOnGenerate = true,
    onGenerated,
    onError,
    onValidated,
  } = options;

  // 状态管理
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [validation, setValidation] = useState<FingerprintValidation | null>(null);
  const [summary, setSummary] = useState<FingerprintSummary | null>(null);

  // 用于防止重复请求的ref
  const isGeneratingRef = useRef(false);
  const mountedRef = useRef(true);

  // 生成指纹函数
  const generate = useCallback(async (): Promise<FingerprintData | null> => {
    // 防止重复请求
    if (isGeneratingRef.current) {
      return fingerprint;
    }

    isGeneratingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const newFingerprint = await generateFingerprint();
      
      // 检查组件是否仍然挂载
      if (!mountedRef.current) {
        return null;
      }

      setFingerprint(newFingerprint);

      // 自动验证
      if (validateOnGenerate) {
        const validationResult = validateFingerprint(newFingerprint);
        setValidation(validationResult);
        onValidated?.(validationResult);
      }

      // 调用成功回调
      onGenerated?.(newFingerprint);

      return newFingerprint;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
      
      return null;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      isGeneratingRef.current = false;
    }
  }, [fingerprint, validateOnGenerate, onGenerated, onError, onValidated]);

  // 清除指纹函数
  const clear = useCallback(() => {
    clearFingerprint();
    setFingerprint(null);
    setValidation(null);
    setSummary(null);
    setError(null);
  }, []);

  // 验证指纹函数
  const validate = useCallback((data?: FingerprintData): FingerprintValidation | null => {
    const targetData = data || fingerprint;
    if (!targetData) return null;

    const validationResult = validateFingerprint(targetData);
    setValidation(validationResult);
    onValidated?.(validationResult);
    
    return validationResult;
  }, [fingerprint, onValidated]);

  // 获取摘要信息函数
  const getSummary = useCallback(async (): Promise<FingerprintSummary | null> => {
    try {
      const summaryData = await getFingerprintSummary();
      setSummary(summaryData);
      return summaryData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get summary');
      setError(error);
      onError?.(error);
      return null;
    }
  }, [onError]);

  // 重试函数
  const retry = useCallback(async (): Promise<FingerprintData | null> => {
    clear();
    return generate();
  }, [clear, generate]);

  // 自动生成指纹
  useEffect(() => {
    if (autoGenerate && !fingerprint && !isLoading && !isGeneratingRef.current) {
      generate();
    }
  }, [autoGenerate, fingerprint, isLoading, generate]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 计算派生状态
  const isValid = validation?.isValid ?? false;
  const isExpired = summary ? (Date.now() - summary.age) > (24 * 60 * 60 * 1000) : false;
  const confidence = fingerprint?.confidence ?? 0;

  return {
    // 状态
    fingerprint,
    isLoading,
    error,
    validation,
    summary,
    
    // 操作函数
    generate,
    clear,
    validate,
    getSummary,
    retry,
    
    // 状态查询
    isValid,
    isExpired,
    confidence,
  };
}

/**
 * 简化版指纹Hook - 只返回指纹ID
 */
export function useFingerprintId(options: Omit<UseFingerprintOptions, 'validateOnGenerate'> = {}): {
  fingerprintId: string | null;
  isLoading: boolean;
  error: Error | null;
  regenerate: () => Promise<string | null>;
} {
  const { fingerprint, isLoading, error, generate } = useFingerprint({
    ...options,
    validateOnGenerate: false,
  });

  const regenerate = useCallback(async (): Promise<string | null> => {
    const result = await generate();
    return result?.visitorId ?? null;
  }, [generate]);

  return {
    fingerprintId: fingerprint?.visitorId ?? null,
    isLoading,
    error,
    regenerate,
  };
}

/**
 * 指纹状态Hook - 用于监控指纹状态
 */
export function useFingerprintStatus(): {
  hasFingerprint: boolean;
  isValid: boolean;
  confidence: number;
  age: number;
  source: string;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState({
    hasFingerprint: false,
    isValid: false,
    confidence: 0,
    age: 0,
    source: 'none',
  });

  const refresh = useCallback(async () => {
    try {
      const summary = await getFingerprintSummary();
      const fingerprint = await generateFingerprint();
      const validation = validateFingerprint(fingerprint);

      setStatus({
        hasFingerprint: true,
        isValid: validation.isValid,
        confidence: fingerprint.confidence,
        age: summary.age,
        source: summary.source,
      });
    } catch (error) {
      setStatus({
        hasFingerprint: false,
        isValid: false,
        confidence: 0,
        age: 0,
        source: 'error',
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...status,
    refresh,
  };
}

// Types are exported via individual export statements above