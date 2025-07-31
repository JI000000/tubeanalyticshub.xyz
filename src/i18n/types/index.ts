/**
 * 国际化类型定义系统
 * 提供完整的TypeScript类型支持和自动补全
 */

import type { locales } from '../config';

// 基础类型别名
export type Locale = typeof locales[number];

// 翻译参数类型
export interface TranslationParams {
  [key: string]: string | number | boolean | Date;
}

// 翻译选项类型
export interface TranslationOptions {
  fallback?: string;
  defaultValue?: string;
  count?: number;
  namespace?: string;
}

// 翻译函数类型
export type TranslationFunction = (
  key: string,
  paramsOrOptions?: TranslationParams | TranslationOptions,
  options?: TranslationOptions
) => string;

// 翻译统计类型
export interface TranslationStats {
  totalKeys: number;
  loadedKeys: number;
  cachedKeys: number;
  missingKeys: string[];
  errorRate: number;
  lastUpdated: Date;
}

// 翻译上下文类型
export interface TranslationContext {
  locale: Locale;
  namespace: string;
  fallbackLocale: Locale;
  direction: 'ltr' | 'rtl';
  currency: string;
  dateFormat: string;
  numberFormat: string;
  timezone: string;
}

// useTranslation Hook 返回类型
export interface UseTranslationReturn {
  t: TranslationFunction;
  locale: string;
  isLoading: boolean;
  error: Error | null;
  formatNumber: (num: number) => string;
  formatDate: (date: Date) => string;
  formatRelativeTime: (date: Date) => string;
  formatCurrency: (amount: number) => string;
  changeLocale: (newLocale: string) => void;
}