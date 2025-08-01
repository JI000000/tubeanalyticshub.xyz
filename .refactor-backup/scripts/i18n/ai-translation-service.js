#!/usr/bin/env node

/**
 * 🤖 AI翻译服务 - 集成多种翻译API
 * 
 * 支持的翻译服务:
 * 1. Google Translate API (免费额度: 50万字符/月)
 * 2. OpenAI GPT API (付费，质量最高)
 * 3. Microsoft Translator (免费额度: 200万字符/月)
 * 4. LibreTranslate (完全免费，自托管)
 * 5. 百度翻译API (免费额度: 5万字符/月)
 */

const fs = require('fs');
const path = require('path');

class AITranslationService {
  constructor() {
    this.services = {
      google: {
        name: 'Google Translate',
        freeLimit: 500000, // 50万字符/月
        cost: '$20/百万字符',
        quality: 'high',
        languages: 100
      },
      openai: {
        name: 'OpenAI GPT',
        freeLimit: 0,
        cost: '$0.002/1K tokens',
        quality: 'highest',
        languages: 50
      },
      microsoft: {
        name: 'Microsoft Translator',
        freeLimit: 2000000, // 200万字符/月
        cost: '$10/百万字符',
        quality: 'high',
        languages: 90
      },
      libre: {
        name: 'LibreTranslate',
        freeLimit: -1, // 无限制
        cost: '免费 (自托管)',
        quality: 'medium',
        languages: 30
      },
      baidu: {
        name: '百度翻译',
        freeLimit: 50000, // 5万字符/月
        cost: '¥49/百万字符',
        quality: 'high',
        languages: 28
      }
    };
    
    this.currentService = 'libre'; // 默认使用免费服务
    this.usage = this.loadUsageStats();
  }

  /**
   * 翻译文本
   */
  async translateText(text, targetLanguage, sourceLanguage = 'en') {
    try {
      // 检查使用量限制
      if (!this.checkUsageLimit(text.length)) {
        console.warn('⚠️  当前服务已达使用限制，切换到备用服务');
        this.switchToBackupService();
      }

      let result;
      switch (this.currentService) {
        case 'google':
          result = await this.translateWithGoogle(text, targetLanguage, sourceLanguage);
          break;
        case 'openai':
          result = await this.translateWithOpenAI(text, targetLanguage, sourceLanguage);
          break;
        case 'microsoft':
          result = await this.translateWithMicrosoft(text, targetLanguage, sourceLanguage);
          break;
        case 'libre':
          result = await this.translateWithLibre(text, targetLanguage, sourceLanguage);
          break;
        case 'baidu':
          result = await this.translateWithBaidu(text, targetLanguage, sourceLanguage);
          break;
        default:
          result = await this.fallbackTranslation(text, targetLanguage);
      }

      // 记录使用量
      this.recordUsage(text.length);
      return result;

    } catch (error) {
      console.error(`翻译失败 (${this.currentService}):`, error.message);
      return this.fallbackTranslation(text, targetLanguage);
    }
  }

  /**
   * Google Translate API
   */
  async translateWithGoogle(text, targetLang, sourceLang) {
    // 需要安装: npm install @google-cloud/translate
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      throw new Error('Google Translate API密钥未配置');
    }

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: this.mapLanguageCode(sourceLang, 'google'),
        target: this.mapLanguageCode(targetLang, 'google'),
        format: 'text'
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.data.translations[0].translatedText;
  }

  /**
   * OpenAI GPT翻译 (最高质量)
   */
  async translateWithOpenAI(text, targetLang, sourceLang) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API密钥未配置');
    }

    const languageNames = {
      'zh-CN': '简体中文',
      'ja-JP': '日语',
      'ko-KR': '韩语',
      'de-DE': '德语',
      'fr-FR': '法语',
      'es-ES': '西班牙语'
    };

    const prompt = `请将以下英文文本翻译成${languageNames[targetLang] || targetLang}，保持原意和语气，使翻译自然流畅：

"${text}"

只返回翻译结果，不要添加任何解释。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的翻译专家，擅长将英文翻译成各种语言，翻译准确、自然、符合目标语言的表达习惯。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.choices[0].message.content.trim();
  }

  /**
   * Microsoft Translator (免费额度最大)
   */
  async translateWithMicrosoft(text, targetLang, sourceLang) {
    if (!process.env.MICROSOFT_TRANSLATOR_KEY) {
      throw new Error('Microsoft Translator密钥未配置');
    }

    const response = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${sourceLang}&to=${this.mapLanguageCode(targetLang, 'microsoft')}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_TRANSLATOR_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text }])
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data[0].translations[0].text;
  }

  /**
   * LibreTranslate (完全免费)
   */
  async translateWithLibre(text, targetLang, sourceLang) {
    // 可以使用公共实例或自托管
    const apiUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de/translate';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: this.mapLanguageCode(sourceLang, 'libre'),
        target: this.mapLanguageCode(targetLang, 'libre'),
        format: 'text'
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.translatedText;
  }

  /**
   * 百度翻译API
   */
  async translateWithBaidu(text, targetLang, sourceLang) {
    if (!process.env.BAIDU_TRANSLATE_APPID || !process.env.BAIDU_TRANSLATE_KEY) {
      throw new Error('百度翻译API配置未完整');
    }

    const crypto = require('crypto');
    const appid = process.env.BAIDU_TRANSLATE_APPID;
    const key = process.env.BAIDU_TRANSLATE_KEY;
    const salt = Date.now();
    const sign = crypto.createHash('md5').update(appid + text + salt + key).digest('hex');

    const params = new URLSearchParams({
      q: text,
      from: this.mapLanguageCode(sourceLang, 'baidu'),
      to: this.mapLanguageCode(targetLang, 'baidu'),
      appid,
      salt,
      sign
    });

    const response = await fetch(`https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`);
    const data = await response.json();

    if (data.error_code) {
      throw new Error(`百度翻译错误: ${data.error_msg}`);
    }

    return data.trans_result[0].dst;
  }

  /**
   * 语言代码映射
   */
  mapLanguageCode(langCode, service) {
    const mappings = {
      google: {
        'en-US': 'en',
        'zh-CN': 'zh-cn',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'de-DE': 'de',
        'fr-FR': 'fr',
        'es-ES': 'es'
      },
      microsoft: {
        'en-US': 'en',
        'zh-CN': 'zh-Hans',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'de-DE': 'de',
        'fr-FR': 'fr',
        'es-ES': 'es'
      },
      libre: {
        'en-US': 'en',
        'zh-CN': 'zh',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'de-DE': 'de',
        'fr-FR': 'fr',
        'es-ES': 'es'
      },
      baidu: {
        'en-US': 'en',
        'zh-CN': 'zh',
        'ja-JP': 'jp',
        'ko-KR': 'kor',
        'de-DE': 'de',
        'fr-FR': 'fra',
        'es-ES': 'spa'
      }
    };

    return mappings[service]?.[langCode] || langCode.split('-')[0];
  }

  /**
   * 检查使用量限制
   */
  checkUsageLimit(textLength) {
    const service = this.services[this.currentService];
    if (service.freeLimit === -1) return true; // 无限制

    const currentMonth = new Date().getMonth();
    const monthlyUsage = this.usage[currentMonth] || 0;
    
    return (monthlyUsage + textLength) <= service.freeLimit;
  }

  /**
   * 切换到备用服务
   */
  switchToBackupService() {
    const freeServices = ['libre', 'microsoft', 'google'];
    const currentIndex = freeServices.indexOf(this.currentService);
    const nextIndex = (currentIndex + 1) % freeServices.length;
    
    this.currentService = freeServices[nextIndex];
    console.log(`🔄 切换到: ${this.services[this.currentService].name}`);
  }

  /**
   * 记录使用量
   */
  recordUsage(textLength) {
    const currentMonth = new Date().getMonth();
    this.usage[currentMonth] = (this.usage[currentMonth] || 0) + textLength;
    this.saveUsageStats();
  }

  /**
   * 加载使用统计
   */
  loadUsageStats() {
    const statsPath = path.join(__dirname, '../../.translation-usage.json');
    try {
      return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    } catch {
      return {};
    }
  }

  /**
   * 保存使用统计
   */
  saveUsageStats() {
    const statsPath = path.join(__dirname, '../../.translation-usage.json');
    fs.writeFileSync(statsPath, JSON.stringify(this.usage, null, 2));
  }

  /**
   * 回退翻译 (基于规则)
   */
  fallbackTranslation(text, targetLang) {
    console.log('🔄 使用回退翻译');
    
    // 使用之前的基于规则的翻译
    const templates = {
      'zh-CN': {
        'loading': '加载中',
        'error': '错误',
        'success': '成功',
        'cancel': '取消',
        'confirm': '确认'
      },
      'ja-JP': {
        'loading': '読み込み中',
        'error': 'エラー',
        'success': '成功',
        'cancel': 'キャンセル',
        'confirm': '確認'
      }
    };

    const template = templates[targetLang];
    if (template && template[text.toLowerCase()]) {
      return template[text.toLowerCase()];
    }

    return `[${targetLang}] ${text}`;
  }

  /**
   * 获取服务状态
   */
  getServiceStatus() {
    const currentMonth = new Date().getMonth();
    const monthlyUsage = this.usage[currentMonth] || 0;
    const service = this.services[this.currentService];
    
    return {
      currentService: this.currentService,
      serviceName: service.name,
      monthlyUsage,
      freeLimit: service.freeLimit,
      usagePercentage: service.freeLimit > 0 ? (monthlyUsage / service.freeLimit * 100).toFixed(1) : 0,
      cost: service.cost,
      quality: service.quality
    };
  }

  /**
   * 显示使用统计
   */
  showUsageStats() {
    console.log('📊 AI翻译服务使用统计\n');
    
    const status = this.getServiceStatus();
    console.log(`当前服务: ${status.serviceName}`);
    console.log(`本月使用: ${status.monthlyUsage.toLocaleString()} 字符`);
    
    if (status.freeLimit > 0) {
      console.log(`免费额度: ${status.freeLimit.toLocaleString()} 字符`);
      console.log(`使用率: ${status.usagePercentage}%`);
    } else {
      console.log(`免费额度: 无限制`);
    }
    
    console.log(`成本: ${status.cost}`);
    console.log(`质量: ${status.quality}`);
    
    console.log('\n🔧 可用服务:');
    Object.entries(this.services).forEach(([key, service]) => {
      const indicator = key === this.currentService ? '🟢' : '⚪';
      console.log(`  ${indicator} ${service.name} - ${service.cost} (${service.quality}质量)`);
    });
  }
}

module.exports = AITranslationService;

// 命令行接口
if (require.main === module) {
  const service = new AITranslationService();
  const command = process.argv[2];
  
  if (command === 'status') {
    service.showUsageStats();
  } else if (command === 'test') {
    // 测试翻译
    service.translateText('Hello World', 'zh-CN').then(result => {
      console.log('翻译结果:', result);
    });
  } else {
    console.log(`
🤖 AI翻译服务

用法:
  node ai-translation-service.js status  # 查看使用统计
  node ai-translation-service.js test    # 测试翻译

环境变量配置:
  GOOGLE_TRANSLATE_API_KEY=your_key
  OPENAI_API_KEY=your_key  
  MICROSOFT_TRANSLATOR_KEY=your_key
  BAIDU_TRANSLATE_APPID=your_appid
  BAIDU_TRANSLATE_KEY=your_key
  LIBRETRANSLATE_URL=https://your-instance.com/translate
    `);
  }
}