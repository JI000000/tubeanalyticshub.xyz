import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表 - 英文优先（全球化网站）
export const locales = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'] as const;
export type Locale = typeof locales[number];

// 默认语言
export const defaultLocale: Locale = 'en-US';

// 语言验证函数
export function validateLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
}

// 语言配置 - 英文优先
export const localeConfig = {
  'en-US': { name: 'English', flag: '🇺🇸', dir: 'ltr' },
  'zh-CN': { name: 'Simplified Chinese', flag: '🇨🇳', dir: 'ltr' },
  'ja-JP': { name: 'Japanese', flag: '🇯🇵', dir: 'ltr' },
  'ko-KR': { name: '한국어', flag: '🇰🇷', dir: 'ltr' }
};

export default getRequestConfig(async ({ locale }) => {
  // 如果语言不支持，使用默认语言
  const validLocale = locales.includes(locale as Locale) ? locale : defaultLocale;
  
  return {
    locale: validLocale as string,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});