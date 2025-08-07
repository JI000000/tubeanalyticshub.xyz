/**
 * 匿名试用数据存储管理
 * 处理本地存储、Cookie和内存缓存的数据同步
 */

import Cookies from 'js-cookie';
import type { 
  TrialStatus, 
  TrialStorageData, 
  TrialAction 
} from '@/types/trial';
import { TRIAL_CONFIG } from './trial-config';

// 存储版本号（用于数据迁移）
const STORAGE_VERSION = '1.0.0';

/**
 * 试用数据存储管理器
 */
export class TrialStorage {
  private static instance: TrialStorage;
  private memoryCache: Map<string, any> = new Map();
  private isClient: boolean;

  private constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TrialStorage {
    if (!TrialStorage.instance) {
      TrialStorage.instance = new TrialStorage();
    }
    return TrialStorage.instance;
  }

  /**
   * 保存试用状态到所有存储位置
   */
  public async saveTrialStatus(status: TrialStatus): Promise<void> {
    if (!this.isClient) return;

    const storageData: TrialStorageData = {
      status,
      lastSyncAt: Date.now(),
      version: STORAGE_VERSION,
    };

    try {
      // 保存到内存缓存
      this.memoryCache.set('trialStatus', storageData);

      // 保存到 localStorage
      this.saveToLocalStorage(storageData);

      // 保存到 Cookie（简化版本）
      this.saveToCookie(status);

    } catch (error) {
      console.error('Failed to save trial status:', error);
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * 从存储中加载试用状态
   */
  public async loadTrialStatus(): Promise<TrialStatus | null> {
    if (!this.isClient) return null;

    try {
      // 优先从内存缓存读取
      const cached = this.memoryCache.get('trialStatus') as TrialStorageData;
      if (cached && this.isDataValid(cached)) {
        return cached.status;
      }

      // 从 localStorage 读取
      const fromStorage = this.loadFromLocalStorage();
      if (fromStorage && this.isDataValid(fromStorage)) {
        // 更新内存缓存
        this.memoryCache.set('trialStatus', fromStorage);
        return fromStorage.status;
      }

      // 从 Cookie 读取（降级方案）
      const fromCookie = this.loadFromCookie();
      if (fromCookie) {
        return fromCookie;
      }

      return null;
    } catch (error) {
      console.error('Failed to load trial status:', error);
      return null;
    }
  }

  /**
   * 清除所有试用数据
   */
  public async clearTrialData(): Promise<void> {
    if (!this.isClient) return;

    try {
      // 清除内存缓存
      this.memoryCache.clear();

      // 清除 localStorage
      localStorage.removeItem(TRIAL_CONFIG.LOCAL_STORAGE_KEY);

      // 清除 Cookie
      Cookies.remove(TRIAL_CONFIG.COOKIE_NAME);

    } catch (error) {
      console.error('Failed to clear trial data:', error);
    }
  }

  /**
   * 添加试用操作记录
   */
  public async addTrialAction(action: TrialAction): Promise<void> {
    const status = await this.loadTrialStatus();
    if (!status) return;

    // 添加新操作到记录中
    status.actions.push(action);
    status.lastUsed = action.timestamp;

    // 保持操作记录在合理范围内（最多保留100条）
    if (status.actions.length > 100) {
      status.actions = status.actions.slice(-100);
    }

    await this.saveTrialStatus(status);
  }

  /**
   * 获取试用统计信息
   */
  public async getTrialStats(): Promise<{
    totalActions: number;
    actionsToday: number;
    actionsThisHour: number;
    lastActionAt: Date | null;
  }> {
    const status = await this.loadTrialStatus();
    if (!status) {
      return {
        totalActions: 0,
        actionsToday: 0,
        actionsThisHour: 0,
        lastActionAt: null,
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    const actionsToday = status.actions.filter(
      action => action.timestamp >= todayStart
    ).length;

    const actionsThisHour = status.actions.filter(
      action => action.timestamp >= hourStart
    ).length;

    const lastActionAt = status.actions.length > 0 
      ? status.actions[status.actions.length - 1].timestamp 
      : null;

    return {
      totalActions: status.actions.length,
      actionsToday,
      actionsThisHour,
      lastActionAt,
    };
  }

  /**
   * 保存到 localStorage
   */
  private saveToLocalStorage(data: TrialStorageData): void {
    try {
      const serialized = JSON.stringify(data, (key, value) => {
        // 处理 Date 对象序列化
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });
      
      localStorage.setItem(TRIAL_CONFIG.LOCAL_STORAGE_KEY, serialized);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromLocalStorage(): TrialStorageData | null {
    try {
      const stored = localStorage.getItem(TRIAL_CONFIG.LOCAL_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored, (key, value) => {
        // 处理 Date 对象反序列化
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });

      return parsed as TrialStorageData;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * 保存到 Cookie（简化版本）
   */
  private saveToCookie(status: TrialStatus): void {
    try {
      const cookieData = {
        remaining: status.remaining,
        total: status.total,
        fingerprint: status.fingerprint,
        lastUsed: status.lastUsed.toISOString(),
        isBlocked: status.isBlocked,
      };

      Cookies.set(
        TRIAL_CONFIG.COOKIE_NAME, 
        JSON.stringify(cookieData), 
        { 
          expires: TRIAL_CONFIG.COOKIE_EXPIRES_DAYS,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        }
      );
    } catch (error) {
      console.warn('Failed to save to cookie:', error);
    }
  }

  /**
   * 从 Cookie 加载（降级方案）
   */
  private loadFromCookie(): TrialStatus | null {
    try {
      const cookieValue = Cookies.get(TRIAL_CONFIG.COOKIE_NAME);
      if (!cookieValue) return null;

      const cookieData = JSON.parse(cookieValue);
      
      return {
        remaining: cookieData.remaining || 0,
        total: cookieData.total || TRIAL_CONFIG.DEFAULT_TRIAL_COUNT,
        fingerprint: cookieData.fingerprint || '',
        lastUsed: new Date(cookieData.lastUsed || Date.now()),
        actions: [], // Cookie 中不存储详细操作记录
        isBlocked: cookieData.isBlocked || false,
      };
    } catch (error) {
      console.warn('Failed to load from cookie:', error);
      return null;
    }
  }

  /**
   * 验证存储数据是否有效
   */
  private isDataValid(data: TrialStorageData): boolean {
    if (!data || !data.status || !data.version) {
      return false;
    }

    // 检查版本兼容性
    if (data.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, data may be outdated');
      return false;
    }

    // 检查数据完整性
    const status = data.status;
    if (
      typeof status.remaining !== 'number' ||
      typeof status.total !== 'number' ||
      typeof status.fingerprint !== 'string' ||
      !Array.isArray(status.actions)
    ) {
      return false;
    }

    // 检查数据是否过期（超过配置的重置时间）
    const resetInterval = TRIAL_CONFIG.TRIAL_RESET_HOURS * 60 * 60 * 1000;
    const isExpired = Date.now() - data.lastSyncAt > resetInterval;
    
    if (isExpired) {
      console.info('Trial data expired, will be reset');
      return false;
    }

    return true;
  }

  /**
   * 检查是否支持存储
   */
  public isStorageSupported(): {
    localStorage: boolean;
    cookies: boolean;
  } {
    if (!this.isClient) {
      return { localStorage: false, cookies: false };
    }

    let localStorageSupported = false;
    let cookiesSupported = false;

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      localStorageSupported = true;
    } catch (error) {
      localStorageSupported = false;
    }

    try {
      Cookies.set('__cookie_test__', 'test');
      cookiesSupported = Cookies.get('__cookie_test__') === 'test';
      Cookies.remove('__cookie_test__');
    } catch (error) {
      cookiesSupported = false;
    }

    return {
      localStorage: localStorageSupported,
      cookies: cookiesSupported,
    };
  }
}

// 导出单例实例
export const trialStorage = TrialStorage.getInstance();