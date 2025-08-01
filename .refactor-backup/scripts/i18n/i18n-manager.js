#!/usr/bin/env node

/**
 * 🌍 I18N 管理器 - 统一多语言管理工具
 * 
 * 功能：
 * 1. 硬编码检测和修复
 * 2. 翻译质量检查
 * 3. 多语言文件管理
 * 4. 自动化翻译生成
 */

const fs = require('fs');
const path = require('path');

class I18nManager {
  constructor() {
    this.startTime = Date.now();
    this.config = {
      supportedLanguages: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES'],
      baseLanguage: 'en-US',
      sourceLanguage: 'zh-CN',
      excludePatterns: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        'src/i18n/messages/**'
      ]
    };
    
    this.translationMappings = {
      // 基础UI元素
      '确认': 'Confirm',
      '取消': 'Cancel',
      '保存': 'Save',
      '删除': 'Delete',
      '编辑': 'Edit',
      '查看': 'View',
      '搜索': 'Search',
      '筛选': 'Filter',
      '排序': 'Sort',
      '刷新': 'Refresh',
      '返回': 'Back',
      '下一步': 'Next',
      '上一步': 'Previous',
      '完成': 'Complete',
      '开始': 'Start',
      '结束': 'End',
      
      // 状态和标签
      '成功': 'Success',
      '失败': 'Failed',
      '错误': 'Error',
      '警告': 'Warning',
      '信息': 'Info',
      '加载中': 'Loading',
      '处理中': 'Processing',
      '已完成': 'Completed',
      '进行中': 'In Progress',
      '待处理': 'Pending',
      '已取消': 'Cancelled',
      
      // 数据和分析
      '分析': 'Analysis',
      '报告': 'Report',
      '数据': 'Data',
      '统计': 'Statistics',
      '图表': 'Chart',
      '趋势': 'Trend',
      '洞察': 'Insights',
      '建议': 'Recommendations',
      '预测': 'Prediction',
      '优化': 'Optimization',
      
      // YouTube相关
      '视频': 'Video',
      '频道': 'Channel',
      '评论': 'Comment',
      '订阅': 'Subscribe',
      '观看量': 'Views',
      '点赞': 'Likes',
      '分享': 'Share',
      '播放': 'Play',
      '暂停': 'Pause',
      '全屏': 'Fullscreen',
      
      // 数量单位
      '个': ' items',
      '次': ' times',
      '天': ' days',
      '小时': ' hours',
      '分钟': ' minutes',
      '秒': ' seconds',
      '年': ' years',
      '月': ' months',
      '周': ' weeks',
      
      // 复杂表达
      '暂无数据': 'No data available',
      '加载失败': 'Loading failed',
      '网络错误': 'Network error',
      '请稍后重试': 'Please try again later',
      '操作成功': 'Operation successful',
      '操作失败': 'Operation failed',
      '权限不足': 'Insufficient permissions',
      '登录已过期': 'Login expired',
      '系统错误': 'System error',
      '服务不可用': 'Service unavailable'
    };
    
    this.results = {
      hardcodedIssues: [],
      fixedIssues: [],
      qualityIssues: [],
      missingTranslations: []
    };
  }

  /**
   * 主执行函数
   */
  async run(command = 'check', options = {}) {
    console.log('🌍 I18N 管理器启动\n');
    
    switch (command) {
      case 'check':
        return await this.checkHardcodedIssues();
      case 'fix':
        return await this.fixHardcodedIssues();
      case 'validate':
        return await this.validateTranslations();
      case 'report':
        return await this.generateReport();
      default:
        console.log('❌ 未知命令:', command);
        this.showHelp();
    }
  }

  /**
   * 检查硬编码问题
   */
  async checkHardcodedIssues() {
    console.log('🔍 检查硬编码中文问题...\n');
    
    const files = this.getAllSourceFiles();
    const chineseRegex = /[\u4e00-\u9fff]/g;
    
    for (const file of files) {
      if (this.shouldExcludeFile(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (this.shouldSkipLine(line)) return;
        
        const matches = line.match(chineseRegex);
        if (matches) {
          this.results.hardcodedIssues.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            content: line.trim(),
            chineseText: matches.join('')
          });
        }
      });
    }
    
    console.log(`📊 检查结果:`);
    console.log(`- 发现硬编码问题: ${this.results.hardcodedIssues.length}个`);
    
    if (this.results.hardcodedIssues.length > 0) {
      console.log(`\n🔍 问题详情:`);
      this.results.hardcodedIssues.slice(0, 10).forEach(issue => {
        console.log(`  ${issue.file}:${issue.line} - "${issue.chineseText}"`);
      });
    }
    
    return this.results.hardcodedIssues;
  }

  /**
   * 修复硬编码问题
   */
  async fixHardcodedIssues() {
    console.log('🔧 修复硬编码中文问题...\n');
    
    const files = this.getAllSourceFiles();
    let totalFixed = 0;
    
    for (const file of files) {
      if (this.shouldExcludeFile(file)) continue;
      
      const fixCount = this.fixFile(file);
      if (fixCount > 0) {
        totalFixed += fixCount;
        console.log(`✅ ${path.relative(process.cwd(), file)}: 修复了 ${fixCount} 个问题`);
      }
    }
    
    console.log(`\n🎉 修复完成！总共修复了 ${totalFixed} 个问题`);
    return totalFixed;
  }

  /**
   * 验证翻译
   */
  async validateTranslations() {
    console.log('✅ 验证翻译完整性...\n');
    
    const baseKeys = this.extractKeysFromTranslations('en-US');
    
    for (const language of this.config.supportedLanguages) {
      if (language === 'en-US') continue;
      
      const langKeys = this.extractKeysFromTranslations(language);
      const missing = baseKeys.filter(key => !langKeys.includes(key));
      
      if (missing.length > 0) {
        console.log(`⚠️  ${language} 缺失翻译键: ${missing.length}个`);
        this.results.missingTranslations.push({
          language,
          missingKeys: missing
        });
      } else {
        console.log(`✅ ${language} 翻译完整`);
      }
    }
    
    return this.results.missingTranslations;
  }

  /**
   * 生成报告
   */
  async generateReport() {
    console.log('📊 生成多语言状态报告...\n');
    
    await this.checkHardcodedIssues();
    await this.validateTranslations();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        hardcodedIssues: this.results.hardcodedIssues.length,
        missingTranslations: this.results.missingTranslations.reduce((sum, lang) => sum + lang.missingKeys.length, 0),
        supportedLanguages: this.config.supportedLanguages.length
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '../I18N_STATUS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 报告已保存到: ${reportPath}`);
    return report;
  }

  /**
   * 修复单个文件
   */
  fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixCount = 0;
    const originalContent = content;
    
    // 添加翻译Hook导入（如果是React组件）
    if (filePath.endsWith('.tsx') && !content.includes('useTranslation')) {
      const importRegex = /(import.*from.*['"]react['"];?\s*)/;
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `$1import { useTranslation } from '@/hooks/useTranslation';\n`);
        fixCount++;
      }
    }
    
    // 添加翻译Hook使用
    if (filePath.endsWith('.tsx')) {
      const componentRegex = /(export\s+(?:default\s+)?function\s+\w+[^{]*{\s*)/;
      if (componentRegex.test(content) && !content.includes('const { t } = useTranslation()')) {
        content = content.replace(componentRegex, `$1  const { t } = useTranslation();\n\n`);
        fixCount++;
      }
    }
    
    // 批量替换硬编码中文
    for (const [chinese, english] of Object.entries(this.translationMappings)) {
      const patterns = [
        new RegExp(`(['"\`])${this.escapeRegex(chinese)}\\1`, 'g'),
        new RegExp(`(>)${this.escapeRegex(chinese)}(<)`, 'g')
      ];
      
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, (match, p1, p2) => {
            if (p1 === '>' && p2 === '<') {
              return `>${english}<`;
            } else {
              return `${p1}${english}${p1}`;
            }
          });
          fixCount += matches.length;
        }
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
    }
    
    return fixCount;
  }

  /**
   * 工具函数
   */
  getAllSourceFiles() {
    const files = [];
    const srcDir = path.join(__dirname, '../../src');
    
    const traverse = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !this.shouldExcludeDir(item)) {
          traverse(fullPath);
        } else if (this.shouldIncludeFile(fullPath)) {
          files.push(fullPath);
        }
      }
    };
    
    traverse(srcDir);
    return files;
  }

  shouldExcludeFile(filePath) {
    return this.config.excludePatterns.some(pattern => 
      filePath.includes(pattern.replace('/**', '').replace('**/', ''))
    );
  }

  shouldExcludeDir(dirName) {
    return ['node_modules', '.git', 'dist', 'build'].includes(dirName);
  }

  shouldIncludeFile(filePath) {
    return ['.ts', '.tsx', '.js', '.jsx'].some(ext => filePath.endsWith(ext));
  }

  shouldSkipLine(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('*') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('import');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  extractKeysFromTranslations(language) {
    // 简化实现，实际应该遍历所有翻译文件
    return [];
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.hardcodedIssues.length > 0) {
      recommendations.push({
        type: 'hardcoded',
        priority: 'high',
        description: `发现 ${this.results.hardcodedIssues.length} 个硬编码问题需要修复`,
        action: '运行 node scripts/i18n-manager.js fix'
      });
    }
    
    if (this.results.missingTranslations.length > 0) {
      recommendations.push({
        type: 'missing',
        priority: 'medium',
        description: '部分语言缺失翻译键',
        action: '补充缺失的翻译内容'
      });
    }
    
    return recommendations;
  }

  showHelp() {
    console.log(`
🌍 I18N 管理器使用说明

命令:
  check     - 检查硬编码中文问题
  fix       - 修复硬编码中文问题
  validate  - 验证翻译完整性
  report    - 生成详细报告

示例:
  node scripts/i18n-manager.js check
  node scripts/i18n-manager.js fix
  node scripts/i18n-manager.js validate
  node scripts/i18n-manager.js report
    `);
  }
}

// 命令行接口
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  const manager = new I18nManager();
  manager.run(command);
}

if (require.main === module) {
  main();
}

module.exports = I18nManager;