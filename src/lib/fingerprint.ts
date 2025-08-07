/**
 * 浏览器指纹识别工具
 * 用于生成唯一设备标识，支持匿名试用跟踪
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Cookies from 'js-cookie';

// 指纹相关的常量配置
export const FINGERPRINT_CONFIG = {
  // Cookie存储配置
  COOKIE_NAME: 'yt_device_fp',
  COOKIE_EXPIRES: 365, // 天数
  
  // 缓存配置
  CACHE_KEY: 'yt_fingerprint_cache',
  CACHE_EXPIRES: 24 * 60 * 60 * 1000, // 24小时（毫秒）
  
  // 指纹生成配置
  FINGERPRINT_OPTIONS: {
    debug: false,
    delayFallback: 50,
    monitoring: false,
  },
  
  // 验证配置
  MIN_FINGERPRINT_LENGTH: 10,
  MAX_RETRY_ATTEMPTS: 3,
} as const;

// 指纹数据接口
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

// 缓存的指纹数据接口
interface CachedFingerprintData {
  data: FingerprintData;
  expiresAt: number;
}

// 指纹验证结果接口
export interface FingerprintValidation {
  isValid: boolean;
  confidence: number;
  reasons: string[];
}

/**
 * 指纹识别工具类
 */
class FingerprintManager {
  private fpInstance: any = null;
  private initPromise: Promise<any> | null = null;

  /**
   * 初始化FingerprintJS实例
   */
  private async initializeFingerprint(): Promise<any> {
    if (this.fpInstance) {
      return this.fpInstance;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = FingerprintJS.load(FINGERPRINT_CONFIG.FINGERPRINT_OPTIONS);
    this.fpInstance = await this.initPromise;
    return this.fpInstance;
  }

  /**
   * 获取浏览器基础信息
   */
  private getBrowserInfo(): BrowserInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
    };
  }

  /**
   * 从缓存获取指纹数据
   */
  private getCachedFingerprint(): FingerprintData | null {
    try {
      const cached = localStorage.getItem(FINGERPRINT_CONFIG.CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedFingerprintData = JSON.parse(cached);
      
      // 检查是否过期
      if (Date.now() > parsedCache.expiresAt) {
        localStorage.removeItem(FINGERPRINT_CONFIG.CACHE_KEY);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.warn('Failed to get cached fingerprint:', error);
      return null;
    }
  }

  /**
   * 缓存指纹数据
   */
  private setCachedFingerprint(data: FingerprintData): void {
    try {
      const cacheData: CachedFingerprintData = {
        data,
        expiresAt: Date.now() + FINGERPRINT_CONFIG.CACHE_EXPIRES,
      };
      
      localStorage.setItem(
        FINGERPRINT_CONFIG.CACHE_KEY,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.warn('Failed to cache fingerprint:', error);
    }
  }

  /**
   * 生成设备指纹
   */
  async generateFingerprint(): Promise<FingerprintData> {
    // 首先尝试从缓存获取
    const cached = this.getCachedFingerprint();
    if (cached) {
      return cached;
    }

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < FINGERPRINT_CONFIG.MAX_RETRY_ATTEMPTS) {
      try {
        const fp = await this.initializeFingerprint();
        const result = await fp.get();

        const fingerprintData: FingerprintData = {
          visitorId: result.visitorId,
          confidence: result.confidence?.score || 0.5,
          timestamp: Date.now(),
          components: result.components,
          browserInfo: this.getBrowserInfo(),
        };

        // 验证指纹有效性
        const validation = this.validateFingerprint(fingerprintData);
        if (!validation.isValid) {
          throw new Error(`Invalid fingerprint: ${validation.reasons.join(', ')}`);
        }

        // 缓存指纹数据
        this.setCachedFingerprint(fingerprintData);

        // 同时保存到Cookie作为备份
        this.saveFingerprintToCookie(fingerprintData.visitorId);

        return fingerprintData;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        console.warn(`Fingerprint generation attempt ${attempts} failed:`, error);
        
        // 等待一段时间后重试
        if (attempts < FINGERPRINT_CONFIG.MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        }
      }
    }

    // 所有尝试都失败，生成降级指纹
    console.error('All fingerprint generation attempts failed:', lastError);
    return this.generateFallbackFingerprint();
  }

  /**
   * 生成降级指纹（当FingerprintJS失败时）
   */
  private generateFallbackFingerprint(): FingerprintData {
    const browserInfo = this.getBrowserInfo();
    
    // 使用浏览器基础信息生成简单指纹
    const fallbackId = this.hashString(
      browserInfo.userAgent +
      browserInfo.language +
      browserInfo.platform +
      browserInfo.screenResolution +
      browserInfo.timezone
    );

    const fingerprintData: FingerprintData = {
      visitorId: `fallback_${fallbackId}`,
      confidence: 0.3, // 降级指纹置信度较低
      timestamp: Date.now(),
      components: { fallback: true },
      browserInfo,
    };

    this.setCachedFingerprint(fingerprintData);
    this.saveFingerprintToCookie(fingerprintData.visitorId);

    return fingerprintData;
  }

  /**
   * 简单字符串哈希函数
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 验证指纹数据的有效性
   */
  validateFingerprint(data: FingerprintData): FingerprintValidation {
    const reasons: string[] = [];
    let isValid = true;

    // 检查指纹ID长度
    if (!data.visitorId || data.visitorId.length < FINGERPRINT_CONFIG.MIN_FINGERPRINT_LENGTH) {
      isValid = false;
      reasons.push('Fingerprint ID too short');
    }

    // 检查置信度
    if (data.confidence < 0.1) {
      isValid = false;
      reasons.push('Confidence score too low');
    }

    // 检查时间戳
    if (!data.timestamp || data.timestamp > Date.now()) {
      isValid = false;
      reasons.push('Invalid timestamp');
    }

    // 检查浏览器信息
    if (!data.browserInfo || !data.browserInfo.userAgent) {
      isValid = false;
      reasons.push('Missing browser information');
    }

    return {
      isValid,
      confidence: data.confidence,
      reasons,
    };
  }

  /**
   * 保存指纹到Cookie
   */
  private saveFingerprintToCookie(visitorId: string): void {
    try {
      Cookies.set(FINGERPRINT_CONFIG.COOKIE_NAME, visitorId, {
        expires: FINGERPRINT_CONFIG.COOKIE_EXPIRES,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    } catch (error) {
      console.warn('Failed to save fingerprint to cookie:', error);
    }
  }

  /**
   * 从Cookie获取指纹
   */
  getFingerprintFromCookie(): string | null {
    try {
      return Cookies.get(FINGERPRINT_CONFIG.COOKIE_NAME) || null;
    } catch (error) {
      console.warn('Failed to get fingerprint from cookie:', error);
      return null;
    }
  }

  /**
   * 清除指纹缓存和Cookie
   */
  clearFingerprint(): void {
    try {
      // 清除localStorage缓存
      localStorage.removeItem(FINGERPRINT_CONFIG.CACHE_KEY);
      
      // 清除Cookie
      Cookies.remove(FINGERPRINT_CONFIG.COOKIE_NAME);
      
      // 重置实例
      this.fpInstance = null;
      this.initPromise = null;
    } catch (error) {
      console.warn('Failed to clear fingerprint:', error);
    }
  }

  /**
   * 检查指纹是否过期
   */
  isFingerprintExpired(): boolean {
    const cached = this.getCachedFingerprint();
    if (!cached) return true;

    const age = Date.now() - cached.timestamp;
    return age > FINGERPRINT_CONFIG.CACHE_EXPIRES;
  }

  /**
   * 指纹防篡改验证
   */
  verifyFingerprintIntegrity(data: FingerprintData): {
    isValid: boolean;
    tamperedFields: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const tamperedFields: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // 检查时间戳合理性
    const now = Date.now();
    const age = now - data.timestamp;
    if (age < 0 || age > 7 * 24 * 60 * 60 * 1000) { // 超过7天
      tamperedFields.push('timestamp');
    }

    // 检查置信度范围
    if (data.confidence < 0 || data.confidence > 1) {
      tamperedFields.push('confidence');
    }

    // 检查浏览器信息一致性
    const currentBrowserInfo = this.getBrowserInfo();
    if (data.browserInfo.userAgent !== currentBrowserInfo.userAgent) {
      tamperedFields.push('userAgent');
      riskLevel = 'high';
    }

    if (data.browserInfo.platform !== currentBrowserInfo.platform) {
      tamperedFields.push('platform');
      riskLevel = 'medium';
    }

    // 检查指纹ID格式
    if (!/^[a-zA-Z0-9_-]+$/.test(data.visitorId)) {
      tamperedFields.push('visitorId');
      riskLevel = 'high';
    }

    // 评估风险等级
    if (tamperedFields.length === 0) {
      riskLevel = 'low';
    } else if (tamperedFields.length <= 2 && !tamperedFields.includes('visitorId')) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    return {
      isValid: tamperedFields.length === 0,
      tamperedFields,
      riskLevel,
    };
  }

  /**
   * 获取指纹摘要信息（用于调试）
   */
  async getFingerprintSummary(): Promise<{
    id: string;
    confidence: number;
    age: number;
    source: 'cache' | 'fresh' | 'cookie';
    browserInfo: BrowserInfo;
  }> {
    const cached = this.getCachedFingerprint();
    let data: FingerprintData;
    let source: 'cache' | 'fresh' | 'cookie';

    if (cached) {
      data = cached;
      source = 'cache';
    } else {
      data = await this.generateFingerprint();
      source = 'fresh';
    }

    return {
      id: data.visitorId,
      confidence: data.confidence,
      age: Date.now() - data.timestamp,
      source,
      browserInfo: data.browserInfo,
    };
  }
}

// 创建单例实例
const fingerprintManager = new FingerprintManager();

// 导出便捷函数
export const generateFingerprint = () => fingerprintManager.generateFingerprint();
export const getFingerprint = () => fingerprintManager.generateFingerprint();
export const getFingerprintFromCookie = () => fingerprintManager.getFingerprintFromCookie();
export const clearFingerprint = () => fingerprintManager.clearFingerprint();
export const isFingerprintExpired = () => fingerprintManager.isFingerprintExpired();
export const getFingerprintSummary = () => fingerprintManager.getFingerprintSummary();
export const validateFingerprint = (data: FingerprintData) => fingerprintManager.validateFingerprint(data);
export const verifyFingerprintIntegrity = (data: FingerprintData) => fingerprintManager.verifyFingerprintIntegrity(data);

// 导出管理器实例（用于高级用法）
export { fingerprintManager };

// 默认导出
export default fingerprintManager;