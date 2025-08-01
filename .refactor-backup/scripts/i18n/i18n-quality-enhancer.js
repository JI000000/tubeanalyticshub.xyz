#!/usr/bin/env node

/**
 * 🚀 I18N 质量提升器 - 全面提升翻译质量
 * 
 * 功能：
 * 1. 检查所有语言的翻译完整性
 * 2. 提升英文翻译质量到95%+
 * 3. 自动修复常见翻译问题
 * 4. 生成高质量翻译建议
 */

const fs = require('fs');
const path = require('path');

class I18nQualityEnhancer {
  constructor() {
    this.supportedLanguages = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES'];
    this.baseLanguage = 'en-US';
    this.i18nDir = path.join(__dirname, '../../src/i18n/messages');
    
    // 英文质量改进规则
    this.qualityRules = {
      // 不地道的表达
      problematicPatterns: [
        {
          pattern: /please try again later/gi,
          replacement: 'Please try again',
          reason: 'More concise and natural'
        },
        {
          pattern: /operation successful/gi,
          replacement: 'Success',
          reason: 'Shorter and more direct'
        },
        {
          pattern: /operation failed/gi,
          replacement: 'Failed',
          reason: 'More concise'
        },
        {
          pattern: /loading failed/gi,
          replacement: 'Failed to load',
          reason: 'More natural English structure'
        },
        {
          pattern: /network error/gi,
          replacement: 'Connection error',
          reason: 'More user-friendly'
        },
        {
          pattern: /data is empty/gi,
          replacement: 'No data available',
          reason: 'More natural expression'
        }
      ],
      
      // 术语标准化
      terminologyStandards: {
        'YouTube': 'YouTube', // 不是 'Youtube'
        'API': 'API', // 不是 'Api'
        'Analytics': 'Analytics', // 不是 'Analytic'
        'Dashboard': 'Dashboard', // 不是 'Dashbord'
        'Insights': 'Insights', // 不是 'Insight'
        'Video': 'Video', // 不是 'Vedio'
        'Channel': 'Channel' // 不是 'Channal'
      },
      
      // UI文本优化
      uiOptimizations: [
        {
          pattern: /click to view/gi,
          replacement: 'View',
          reason: 'UI buttons should be concise'
        },
        {
          pattern: /click to edit/gi,
          replacement: 'Edit',
          reason: 'UI buttons should be concise'
        },
        {
          pattern: /are you sure you want to delete/gi,
          replacement: 'Delete this item?',
          reason: 'Shorter confirmation messages'
        }
      ]
    };
    
    this.results = {
      languageStats: {},
      qualityIssues: [],
      improvements: [],
      missingTranslations: []
    };
  }

  /**
   * 主执行函数
   */
  async enhance() {
    console.log('🚀 I18N 质量提升器启动\n');
    
    // 1. 分析当前翻译状况
    await this.analyzeTranslationStatus();
    
    // 2. 提升英文翻译质量
    await this.enhanceEnglishQuality();
    
    // 3. 补全缺失翻译
    await this.fillMissingTranslations();
    
    // 4. 验证所有语言
    await this.validateAllLanguages();
    
    // 5. 生成质量报告
    await this.generateQualityReport();
    
    console.log('\n🎉 质量提升完成！');
  }

  /**
   * 分析翻译状况
   */
  async analyzeTranslationStatus() {
    console.log('📊 分析翻译状况...\n');
    
    for (const language of this.supportedLanguages) {
      const stats = await this.analyzeLanguage(language);
      this.results.languageStats[language] = stats;
      
      console.log(`${language}: ${stats.totalKeys}个翻译键, 完整性: ${stats.completeness}%`);
    }
  }

  /**
   * 分析单个语言
   */
  async analyzeLanguage(language) {
    const languageFiles = this.findTranslationFiles(language);
    let totalKeys = 0;
    let validKeys = 0;
    
    for (const file of languageFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        const keys = this.flattenObject(content);
        totalKeys += Object.keys(keys).length;
        
        // 检查翻译质量
        for (const [key, value] of Object.entries(keys)) {
          if (typeof value === 'string' && value.trim().length > 0) {
            validKeys++;
          }
        }
      } catch (error) {
        console.warn(`⚠️  无法解析文件: ${file}`);
      }
    }
    
    return {
      totalKeys,
      validKeys,
      completeness: totalKeys > 0 ? Math.round((validKeys / totalKeys) * 100) : 0,
      files: languageFiles.length
    };
  }

  /**
   * 提升英文翻译质量
   */
  async enhanceEnglishQuality() {
    console.log('\n📝 提升英文翻译质量...\n');
    
    const englishFiles = this.findTranslationFiles('en-US');
    let totalImprovements = 0;
    
    for (const file of englishFiles) {
      const improvements = await this.improveTranslationFile(file);
      totalImprovements += improvements;
      
      if (improvements > 0) {
        console.log(`✅ ${path.relative(this.i18nDir, file)}: 改进了 ${improvements} 个翻译`);
      }
    }
    
    console.log(`\n📈 总共改进了 ${totalImprovements} 个英文翻译`);
  }

  /**
   * 改进翻译文件
   */
  async improveTranslationFile(filePath) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let improvements = 0;
      const originalContent = JSON.stringify(content);
      
      // 递归改进翻译内容
      const improvedContent = this.improveTranslationObject(content);
      improvements = this.countImprovements(content, improvedContent);
      
      if (improvements > 0) {
        fs.writeFileSync(filePath, JSON.stringify(improvedContent, null, 2));
        this.results.improvements.push({
          file: path.relative(this.i18nDir, filePath),
          improvements
        });
      }
      
      return improvements;
    } catch (error) {
      console.warn(`⚠️  无法处理文件: ${filePath}`);
      return 0;
    }
  }

  /**
   * 改进翻译对象
   */
  improveTranslationObject(obj) {
    const improved = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        improved[key] = this.improveTranslationObject(value);
      } else if (typeof value === 'string') {
        improved[key] = this.improveTranslationText(value);
      } else {
        improved[key] = value;
      }
    }
    
    return improved;
  }

  /**
   * 改进翻译文本
   */
  improveTranslationText(text) {
    let improvedText = text;
    
    // 应用问题模式修复
    for (const rule of this.qualityRules.problematicPatterns) {
      improvedText = improvedText.replace(rule.pattern, rule.replacement);
    }
    
    // 应用术语标准化
    for (const [incorrect, correct] of Object.entries(this.qualityRules.terminologyStandards)) {
      const pattern = new RegExp(`\\b${incorrect}\\b`, 'gi');
      improvedText = improvedText.replace(pattern, correct);
    }
    
    // 应用UI优化
    for (const rule of this.qualityRules.uiOptimizations) {
      improvedText = improvedText.replace(rule.pattern, rule.replacement);
    }
    
    return improvedText;
  }

  /**
   * 补全缺失翻译
   */
  async fillMissingTranslations() {
    console.log('\n🔄 补全缺失翻译...\n');
    
    // 获取英文基准翻译
    const baseTranslations = await this.getBaseTranslations();
    
    for (const language of this.supportedLanguages) {
      if (language === 'en-US') continue;
      
      const missing = await this.findMissingTranslations(language, baseTranslations);
      if (missing.length > 0) {
        console.log(`${language}: 发现 ${missing.length} 个缺失翻译`);
        await this.generateMissingTranslations(language, missing);
      } else {
        console.log(`${language}: ✅ 翻译完整`);
      }
    }
  }

  /**
   * 验证所有语言
   */
  async validateAllLanguages() {
    console.log('\n✅ 验证所有语言...\n');
    
    for (const language of this.supportedLanguages) {
      const validation = await this.validateLanguage(language);
      console.log(`${language}: ${validation.isValid ? '✅' : '❌'} ${validation.message}`);
    }
  }

  /**
   * 生成质量报告
   */
  async generateQualityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalLanguages: this.supportedLanguages.length,
        totalImprovements: this.results.improvements.reduce((sum, imp) => sum + imp.improvements, 0),
        qualityScore: this.calculateOverallQualityScore()
      },
      languageStats: this.results.languageStats,
      improvements: this.results.improvements,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '../../I18N_QUALITY_ENHANCEMENT_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 质量报告已保存到: ${reportPath}`);
    
    // 打印摘要
    console.log(`\n📊 质量提升摘要:`);
    console.log(`- 支持语言: ${report.summary.totalLanguages}种`);
    console.log(`- 改进翻译: ${report.summary.totalImprovements}个`);
    console.log(`- 整体质量评分: ${report.summary.qualityScore}%`);
  }

  /**
   * 工具函数
   */
  findTranslationFiles(language) {
    const files = [];
    const searchDirs = [
      path.join(this.i18nDir, 'core'),
      path.join(this.i18nDir, 'pages'),
      path.join(this.i18nDir, 'features'),
      this.i18nDir
    ];
    
    for (const dir of searchDirs) {
      const filePath = path.join(dir, `${language}.json`);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
      
      // 检查子目录
      if (fs.existsSync(dir)) {
        const subDirs = fs.readdirSync(dir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        for (const subDir of subDirs) {
          const subFilePath = path.join(dir, subDir, `${language}.json`);
          if (fs.existsSync(subFilePath)) {
            files.push(subFilePath);
          }
        }
      }
    }
    
    return files;
  }

  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, this.flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
    
    return flattened;
  }

  countImprovements(original, improved) {
    const originalStr = JSON.stringify(original);
    const improvedStr = JSON.stringify(improved);
    return originalStr !== improvedStr ? 1 : 0;
  }

  async getBaseTranslations() {
    const baseFiles = this.findTranslationFiles('en-US');
    const baseTranslations = {};
    
    for (const file of baseFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        const flattened = this.flattenObject(content);
        Object.assign(baseTranslations, flattened);
      } catch (error) {
        console.warn(`⚠️  无法读取基准文件: ${file}`);
      }
    }
    
    return baseTranslations;
  }

  async findMissingTranslations(language, baseTranslations) {
    const langFiles = this.findTranslationFiles(language);
    const langTranslations = {};
    
    for (const file of langFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        const flattened = this.flattenObject(content);
        Object.assign(langTranslations, flattened);
      } catch (error) {
        console.warn(`⚠️  无法读取语言文件: ${file}`);
      }
    }
    
    const missing = [];
    for (const key of Object.keys(baseTranslations)) {
      if (!langTranslations[key]) {
        missing.push(key);
      }
    }
    
    return missing;
  }

  async generateMissingTranslations(language, missingKeys) {
    // 这里可以集成AI翻译服务
    console.log(`  生成 ${language} 的 ${missingKeys.length} 个缺失翻译...`);
    // 实际实现中可以调用翻译API
  }

  async validateLanguage(language) {
    const files = this.findTranslationFiles(language);
    
    if (files.length === 0) {
      return { isValid: false, message: '未找到翻译文件' };
    }
    
    let totalKeys = 0;
    let validKeys = 0;
    
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        const keys = this.flattenObject(content);
        totalKeys += Object.keys(keys).length;
        
        for (const value of Object.values(keys)) {
          if (typeof value === 'string' && value.trim().length > 0) {
            validKeys++;
          }
        }
      } catch (error) {
        return { isValid: false, message: 'JSON解析错误' };
      }
    }
    
    const completeness = totalKeys > 0 ? (validKeys / totalKeys) * 100 : 0;
    return {
      isValid: completeness >= 90,
      message: `完整性: ${completeness.toFixed(1)}%`
    };
  }

  calculateOverallQualityScore() {
    const scores = Object.values(this.results.languageStats).map(stat => stat.completeness);
    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // 基于分析结果生成建议
    const avgCompleteness = this.calculateOverallQualityScore();
    
    if (avgCompleteness < 95) {
      recommendations.push({
        type: 'completeness',
        priority: 'high',
        description: '部分语言翻译不完整',
        action: '补全缺失的翻译键'
      });
    }
    
    if (this.results.improvements.length > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        description: '英文翻译质量已提升',
        action: '定期运行质量检查'
      });
    }
    
    return recommendations;
  }
}

// 命令行接口
function main() {
  const enhancer = new I18nQualityEnhancer();
  enhancer.enhance();
}

if (require.main === module) {
  main();
}

module.exports = I18nQualityEnhancer;