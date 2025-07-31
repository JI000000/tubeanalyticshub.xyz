/**
 * 核心翻译加载器
 * 负责加载和缓存翻译文件
 */

import type { Locale } from '../types';

class CoreLoader {
  private cache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  async loadCoreTranslations(locale: Locale): Promise<Record<string, any>> {
    const cacheKey = `core-${locale}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // 开始加载
    const loadingPromise = this.loadTranslationFile(locale);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const translations = await loadingPromise;
      this.cache.set(cacheKey, translations);
      this.loadingPromises.delete(cacheKey);
      return translations;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  private async loadTranslationFile(locale: Locale): Promise<Record<string, any>> {
    try {
      // 动态导入翻译文件
      const translations = await import(`../messages/${locale}.json`);
      return translations.default || translations;
    } catch (error) {
      console.warn(`Failed to load translations for locale: ${locale}`, error);
      
      // 如果不是默认语言，尝试加载默认语言
      if (locale !== 'en-US') {
        try {
          const fallbackTranslations = await import('../messages/en-US.json');
          return fallbackTranslations.default || fallbackTranslations;
        } catch (fallbackError) {
          console.error('Failed to load fallback translations', fallbackError);
        }
      }
      
      // 返回空对象作为最后的fallback
      return {};
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  getCacheStats() {
    return {
      entries: this.cache.size,
      loading: this.loadingPromises.size
    };
  }
}

export const coreLoader = new CoreLoader();