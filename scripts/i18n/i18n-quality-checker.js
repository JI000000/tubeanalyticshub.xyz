#!/usr/bin/env node

/**
 * 🔍 英文翻译质量检查工具
 * 专门检查英文JSON文件中的翻译是否使用了地道的语言表达
 */

const fs = require('fs');
const path = require('path');

class EnglishQualityChecker {
  constructor() {
    this.qualityRules = {
      // 不地道的表达模式
      problematicPatterns: [
        {
          pattern: /please try again later/gi,
          suggestion: 'Please try again',
          reason: 'More concise and natural',
          severity: 'medium'
        },
        {
          pattern: /operation successful/gi,
          suggestion: 'Success',
          reason: 'Shorter and more direct',
          severity: 'low'
        },
        {
          pattern: /operation failed/gi,
          suggestion: 'Failed',
          reason: 'More concise',
          severity: 'low'
        },
        {
          pattern: /loading failed/gi,
          suggestion: 'Failed to load',
          reason: 'More natural English structure',
          severity: 'medium'
        },
        {
          pattern: /network error/gi,
          suggestion: 'Connection error',
          reason: 'More user-friendly',
          severity: 'low'
        },
        {
          pattern: /data is empty/gi,
          suggestion: 'No data available',
          reason: 'More natural expression',
          severity: 'medium'
        },
        {
          pattern: /click to view/gi,
          suggestion: 'View',
          reason: 'UI text should be concise',
          severity: 'low'
        },
        {
          pattern: /click to edit/gi,
          suggestion: 'Edit',
          reason: 'UI text should be concise',
          severity: 'low'
        },
        {
          pattern: /system is analyzing/gi,
          suggestion: 'Analyzing',
          reason: 'More direct and active voice',
          severity: 'medium'
        },
        {
          pattern: /please check back later/gi,
          suggestion: 'Check back later',
          reason: 'Less verbose',
          severity: 'low'
        }
      ],

      // 术语一致性检查
      terminologyConsistency: {
        'video': {
          correct: ['video', 'Video'],
          incorrect: ['vedio', 'vidoe'],
          context: 'YouTube content'
        },
        'channel': {
          correct: ['channel', 'Channel'],
          incorrect: ['channal', 'chanel'],
          context: 'YouTube channel'
        },
        'dashboard': {
          correct: ['dashboard', 'Dashboard'],
          incorrect: ['dashbord', 'dash-board'],
          context: 'Analytics interface'
        },
        'analytics': {
          correct: ['analytics', 'Analytics'],
          incorrect: ['analytic', 'analitics'],
          context: 'Data analysis'
        },
        'insight': {
          correct: ['insight', 'Insight', 'insights', 'Insights'],
          incorrect: ['insigt', 'insihgt'],
          context: 'Data insights'
        }
      },

      // 语法检查规则
      grammarRules: [
        {
          pattern: /\ba\s+[aeiouAEIOU]/g,
          suggestion: 'Use "an" before vowel sounds',
          type: 'article',
          severity: 'high'
        },
        {
          pattern: /\ban\s+[^aeiouAEIOU\s]/g,
          suggestion: 'Use "a" before consonant sounds',
          type: 'article',
          severity: 'high'
        },
        {
          pattern: /\s{2,}/g,
          suggestion: 'Remove extra spaces',
          type: 'spacing',
          severity: 'low'
        },
        {
          pattern: /[.]{2,}/g,
          suggestion: 'Use single period or ellipsis (...)',
          type: 'punctuation',
          severity: 'medium'
        }
      ],

      // 用户体验优化建议
      uxOptimizations: [
        {
          pattern: /are you sure you want to delete/gi,
          suggestion: 'Delete this item?',
          reason: 'Shorter confirmation messages are less intimidating',
          severity: 'medium'
        },
        {
          pattern: /successfully/gi,
          suggestion: 'Remove "successfully" - success is implied',
          reason: 'Reduce unnecessary words',
          severity: 'low'
        },
        {
          pattern: /please wait/gi,
          suggestion: 'Loading...',
          reason: 'More modern loading message',
          severity: 'low'
        },
        {
          pattern: /an error occurred/gi,
          suggestion: 'Something went wrong',
          reason: 'More user-friendly error message',
          severity: 'medium'
        }
      ],

      // 技术术语标准化
      technicalTerms: {
        'API': 'API', // 不是 'Api' 或 'api'
        'URL': 'URL', // 不是 'Url' 或 'url'
        'JSON': 'JSON', // 不是 'Json' 或 'json'
        'HTTP': 'HTTP', // 不是 'Http' 或 'http'
        'AI': 'AI', // 不是 'Ai' 或 'ai'
        'YouTube': 'YouTube', // 不是 'Youtube' 或 'youtube'
        'JavaScript': 'JavaScript', // 不是 'Javascript' 或 'javascript'
        'TypeScript': 'TypeScript' // 不是 'Typescript' 或 'typescript'
      }
    };

    this.results = {
      issues: [],
      suggestions: [],
      statistics: {
        totalKeys: 0,
        issuesFound: 0,
        filesChecked: 0
      }
    };
  }

  /**
   * 检查所有英文翻译文件
   */
  async checkAllEnglishFiles() {
    console.log('🔍 开始检查英文翻译质量...\n');

    const englishFiles = this.findEnglishTranslationFiles();
    
    for (const file of englishFiles) {
      await this.checkFile(file);
    }

    this.generateReport();
    return this.results;
  }

  /**
   * 查找所有英文翻译文件
   */
  findEnglishTranslationFiles() {
    const files = [];
    const i18nDir = path.join(__dirname, '../src/i18n/messages');
    
    const traverse = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item === 'en-US.json' || item.endsWith('/en-US.json')) {
          files.push(fullPath);
        }
      }
    };

    traverse(i18nDir);
    
    // 也检查根目录的英文文件
    const rootEnglishFile = path.join(i18nDir, 'en-US.json');
    if (fs.existsSync(rootEnglishFile)) {
      files.push(rootEnglishFile);
    }

    return files;
  }

  /**
   * 检查单个文件
   */
  async checkFile(filePath) {
    console.log(`📄 检查文件: ${path.relative(process.cwd(), filePath)}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const translations = JSON.parse(content);
      
      const flatTranslations = this.flattenObject(translations);
      this.results.statistics.totalKeys += Object.keys(flatTranslations).length;
      this.results.statistics.filesChecked++;
      
      for (const [key, value] of Object.entries(flatTranslations)) {
        if (typeof value === 'string') {
          this.checkTranslationQuality(key, value, filePath);
        }
      }
      
    } catch (error) {
      console.error(`❌ 无法解析文件 ${filePath}:`, error.message);
    }
  }

  /**
   * 检查单个翻译的质量
   */
  checkTranslationQuality(key, value, filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // 检查问题模式
    for (const rule of this.qualityRules.problematicPatterns) {
      if (rule.pattern.test(value)) {
        this.addIssue({
          type: 'problematic_pattern',
          file: relativePath,
          key,
          value,
          issue: rule.reason,
          suggestion: rule.suggestion,
          severity: rule.severity
        });
      }
    }

    // 检查术语一致性
    for (const [term, config] of Object.entries(this.qualityRules.terminologyConsistency)) {
      for (const incorrect of config.incorrect) {
        if (value.toLowerCase().includes(incorrect.toLowerCase())) {
          this.addIssue({
            type: 'terminology',
            file: relativePath,
            key,
            value,
            issue: `Incorrect spelling of "${term}"`,
            suggestion: `Use "${config.correct[0]}" instead of "${incorrect}"`,
            severity: 'high'
          });
        }
      }
    }

    // 检查语法规则
    for (const rule of this.qualityRules.grammarRules) {
      if (rule.pattern.test(value)) {
        this.addIssue({
          type: 'grammar',
          file: relativePath,
          key,
          value,
          issue: rule.suggestion,
          suggestion: 'Fix grammar issue',
          severity: rule.severity
        });
      }
    }

    // 检查UX优化建议
    for (const rule of this.qualityRules.uxOptimizations) {
      if (rule.pattern.test(value)) {
        this.addIssue({
          type: 'ux_optimization',
          file: relativePath,
          key,
          value,
          issue: rule.reason,
          suggestion: rule.suggestion,
          severity: rule.severity
        });
      }
    }

    // 检查技术术语标准化
    for (const [correct, standard] of Object.entries(this.qualityRules.technicalTerms)) {
      const incorrectPatterns = [
        correct.toLowerCase(),
        correct.charAt(0).toUpperCase() + correct.slice(1).toLowerCase(),
        correct.toUpperCase()
      ].filter(variant => variant !== standard);

      for (const incorrect of incorrectPatterns) {
        if (value.includes(incorrect) && !value.includes(standard)) {
          this.addIssue({
            type: 'technical_term',
            file: relativePath,
            key,
            value,
            issue: `Incorrect capitalization of technical term`,
            suggestion: `Use "${standard}" instead of "${incorrect}"`,
            severity: 'medium'
          });
        }
      }
    }
  }

  /**
   * 添加问题到结果中
   */
  addIssue(issue) {
    this.results.issues.push(issue);
    this.results.statistics.issuesFound++;
  }

  /**
   * 扁平化对象
   */
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

  /**
   * 生成质量报告
   */
  generateReport() {
    console.log('\n📊 英文翻译质量检查报告\n');
    
    // 统计信息
    console.log('📈 统计信息:');
    console.log(`- 检查文件数: ${this.results.statistics.filesChecked}`);
    console.log(`- 检查翻译键数: ${this.results.statistics.totalKeys}`);
    console.log(`- 发现问题数: ${this.results.statistics.issuesFound}`);
    
    if (this.results.statistics.totalKeys > 0) {
      const qualityScore = ((this.results.statistics.totalKeys - this.results.statistics.issuesFound) / this.results.statistics.totalKeys * 100).toFixed(1);
      console.log(`- 质量评分: ${qualityScore}%`);
    }

    // 按严重程度分组问题
    const issuesBySeverity = this.groupIssuesBySeverity();
    
    console.log('\n🚨 问题分布:');
    for (const [severity, issues] of Object.entries(issuesBySeverity)) {
      console.log(`- ${severity}: ${issues.length}个`);
    }

    // 显示高优先级问题
    if (issuesBySeverity.high && issuesBySeverity.high.length > 0) {
      console.log('\n🔴 高优先级问题:');
      issuesBySeverity.high.slice(0, 5).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.file}`);
        console.log(`   键: ${issue.key}`);
        console.log(`   值: "${issue.value}"`);
        console.log(`   问题: ${issue.issue}`);
        console.log(`   建议: ${issue.suggestion}\n`);
      });
    }

    // 显示中等优先级问题
    if (issuesBySeverity.medium && issuesBySeverity.medium.length > 0) {
      console.log('\n🟡 中等优先级问题 (前3个):');
      issuesBySeverity.medium.slice(0, 3).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.key}: "${issue.value}"`);
        console.log(`   建议: ${issue.suggestion}\n`);
      });
    }

    // 生成改进建议
    this.generateImprovementSuggestions();

    // 保存详细报告
    this.saveDetailedReport();
  }

  /**
   * 按严重程度分组问题
   */
  groupIssuesBySeverity() {
    const grouped = {
      high: [],
      medium: [],
      low: []
    };

    for (const issue of this.results.issues) {
      grouped[issue.severity].push(issue);
    }

    return grouped;
  }

  /**
   * 生成改进建议
   */
  generateImprovementSuggestions() {
    console.log('\n💡 改进建议:');
    
    const typeCount = {};
    for (const issue of this.results.issues) {
      typeCount[issue.type] = (typeCount[issue.type] || 0) + 1;
    }

    if (typeCount.problematic_pattern > 0) {
      console.log('1. 优化表达方式: 使用更自然、简洁的英文表达');
    }
    
    if (typeCount.terminology > 0) {
      console.log('2. 统一术语使用: 建立术语词典，确保一致性');
    }
    
    if (typeCount.grammar > 0) {
      console.log('3. 修复语法问题: 注意冠词使用和标点符号');
    }
    
    if (typeCount.ux_optimization > 0) {
      console.log('4. 优化用户体验: 使用更友好、简洁的界面文本');
    }
    
    if (typeCount.technical_term > 0) {
      console.log('5. 标准化技术术语: 确保技术术语的正确大小写');
    }

    console.log('\n🔧 建议的修复流程:');
    console.log('1. 优先修复高优先级问题');
    console.log('2. 建立英文翻译审查流程');
    console.log('3. 使用专业的英文校对工具');
    console.log('4. 定期进行质量检查');
  }

  /**
   * 保存详细报告
   */
  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.results.statistics,
      issues: this.results.issues,
      summary: {
        qualityScore: this.results.statistics.totalKeys > 0 
          ? ((this.results.statistics.totalKeys - this.results.statistics.issuesFound) / this.results.statistics.totalKeys * 100).toFixed(1)
          : 0,
        issuesBySeverity: this.groupIssuesBySeverity(),
        topIssueTypes: this.getTopIssueTypes()
      }
    };

    const reportPath = path.join(__dirname, '../ENGLISH_QUALITY_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 详细报告已保存到: ${reportPath}`);
  }

  /**
   * 获取主要问题类型
   */
  getTopIssueTypes() {
    const typeCount = {};
    for (const issue of this.results.issues) {
      typeCount[issue.type] = (typeCount[issue.type] || 0) + 1;
    }

    return Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }
}

// 命令行接口
function main() {
  const checker = new EnglishQualityChecker();
  checker.checkAllEnglishFiles();
}

if (require.main === module) {
  main();
}

module.exports = EnglishQualityChecker;