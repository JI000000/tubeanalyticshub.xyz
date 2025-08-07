/**
 * 指纹识别相关的TypeScript类型定义
 */

// 基础指纹数据接口
export interface FingerprintData {
  visitorId: string;
  confidence: number;
  timestamp: number;
  components: Record<string, any>;
  browserInfo: BrowserInfo;
}

// 浏览器信息接口
export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
}

// 指纹验证结果接口
export interface FingerprintValidation {
  isValid: boolean;
  confidence: number;
  reasons: string[];
}

// 指纹摘要信息接口
export interface FingerprintSummary {
  id: string;
  confidence: number;
  age: number;
  source: 'cache' | 'fresh' | 'cookie';
  browserInfo: BrowserInfo;
}

// 缓存的指纹数据接口
export interface CachedFingerprintData {
  data: FingerprintData;
  expiresAt: number;
}

// 指纹配置接口
export interface FingerprintConfig {
  readonly COOKIE_NAME: string;
  readonly COOKIE_EXPIRES: number;
  readonly CACHE_KEY: string;
  readonly CACHE_EXPIRES: number;
  readonly FINGERPRINT_OPTIONS: {
    debug: boolean;
    delayFallback: number;
    monitoring: boolean;
  };
  readonly MIN_FINGERPRINT_LENGTH: number;
  readonly MAX_RETRY_ATTEMPTS: number;
}

// 指纹生成选项接口
export interface FingerprintGenerationOptions {
  forceRefresh?: boolean;
  skipCache?: boolean;
  timeout?: number;
}

// 指纹错误类型
export type FingerprintError = 
  | 'GENERATION_FAILED'
  | 'VALIDATION_FAILED'
  | 'CACHE_ERROR'
  | 'COOKIE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'BROWSER_NOT_SUPPORTED';

// 指纹错误详情接口
export interface FingerprintErrorDetails {
  type: FingerprintError;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

// 指纹管理器状态接口
export interface FingerprintManagerState {
  isInitialized: boolean;
  isGenerating: boolean;
  lastGenerated: number | null;
  errorCount: number;
  lastError: FingerprintErrorDetails | null;
}

// 指纹统计信息接口
export interface FingerprintStats {
  totalGenerations: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  averageConfidence: number;
  lastUpdated: number;
}

// 指纹事件类型
export type FingerprintEvent = 
  | 'generated'
  | 'cached'
  | 'validated'
  | 'cleared'
  | 'error';

// 指纹事件监听器接口
export interface FingerprintEventListener {
  (event: FingerprintEvent, data?: any): void;
}

// 指纹组件数据接口（来自FingerprintJS）
export interface FingerprintComponents {
  userAgent?: { value: string };
  language?: { value: string };
  colorDepth?: { value: number };
  deviceMemory?: { value: number };
  pixelRatio?: { value: number };
  hardwareConcurrency?: { value: number };
  screenResolution?: { value: [number, number] };
  availableScreenResolution?: { value: [number, number] };
  timezoneOffset?: { value: number };
  timezone?: { value: string };
  sessionStorage?: { value: boolean };
  localStorage?: { value: boolean };
  indexedDB?: { value: boolean };
  addBehavior?: { value: boolean };
  openDatabase?: { value: boolean };
  cpuClass?: { value: string };
  platform?: { value: string };
  plugins?: { value: Array<{ name: string; filename: string; description: string }> };
  canvas?: { value: string };
  webgl?: { value: string };
  webglVendorAndRenderer?: { value: string };
  adBlock?: { value: boolean };
  hasLiedLanguages?: { value: boolean };
  hasLiedResolution?: { value: boolean };
  hasLiedOs?: { value: boolean };
  hasLiedBrowser?: { value: boolean };
  touchSupport?: { value: [number, boolean, boolean] };
  fonts?: { value: string[] };
  audio?: { value: string };
  enumerateDevices?: { value: Array<{ deviceId: string; groupId: string; kind: string; label: string }> };
}

// 指纹质量评估接口
export interface FingerprintQuality {
  score: number; // 0-1之间的质量分数
  factors: {
    uniqueness: number; // 唯一性评分
    stability: number; // 稳定性评分
    entropy: number; // 熵值评分
  };
  recommendations: string[]; // 改进建议
}

// 指纹比较结果接口
export interface FingerprintComparison {
  similarity: number; // 0-1之间的相似度
  differences: string[]; // 差异列表
  isLikelySameDevice: boolean; // 是否可能是同一设备
}

// 指纹完整性验证结果接口
export interface FingerprintIntegrityCheck {
  isValid: boolean;
  tamperedFields: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Types are exported via individual export statements above