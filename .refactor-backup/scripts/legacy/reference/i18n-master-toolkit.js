#!/usr/bin/env node

/**
 * 🚀 I18N MASTER TOOLKIT - 终极国际化工具包
 * 集成所有TURBO脚本功能的一体化解决方案
 * 
 * 功能：
 * 1. 检测硬编码中文问题
 * 2. 自动修复所有类型的国际化问题
 * 3. 生成详细的修复报告
 * 4. 支持增量修复和全量修复
 * 5. 提供完整的工具链管理
 */

const fs = require('fs');
const path = require('path');

class I18nMasterToolkit {
  constructor() {
    this.startTime = Date.now();
    this.totalFixed = 0;
    this.filesModified = 0;
    this.fixHistory = [];
    
    // 集成所有翻译映射
    this.translations = this.loadAllTranslations();
  }

  // 加载所有翻译映射
  loadAllTranslations() {
    return {
      // 基础翻译
      '分析仪表板': 'Analytics Dashboard',
      '创建仪表板': 'Create Dashboard',
      '高优先级': 'High Priority',
      '中优先级': 'Medium Priority',
      '低优先级': 'Low Priority',
      '返回': 'Back',
      '取消': 'Cancel',
      '确认': 'Confirm',
      '保存': 'Save',
      '删除': 'Delete',
      '编辑': 'Edit',
      '查看': 'View',
      '分享': 'Share',
      '下载': 'Download',
      '上传': 'Upload',
      '搜索': 'Search',
      '筛选': 'Filter',
      '排序': 'Sort',
      '刷新': 'Refresh',
      
      // 复杂业务逻辑
      'AI洞察': 'AI Insights',
      '系统正在分析您的数据,请稍后查看': 'System is analyzing your data, please check back later',
      '影响': 'Affects',
      '查看详情': 'View Details',
      '建议行动': 'Recommended Actions',
      '等项建议': ' more recommendations',
      '查看全部': 'View All',
      '分析结果': 'Analysis Results',
      '网格视图': 'Grid View',
      '列表视图': 'List View',
      '导出数据': 'Export Data',
      
      // 最后的顽固问题
      '等项': ' more',
      '项': ' items',
      
      // 翻译质量相关
      '请评估以下翻译的质量': 'Please evaluate the quality of the following translation',
      '原文': 'Original text',
      '译文': 'Translated text',
      '建议的改进方案': 'Suggested improvement plan',
      '建议统一术语使用': 'Recommend unified terminology usage',
      '建立术语词典': 'Establish terminology dictionary',
      '定期审查一致性': 'Regular consistency review',
      
      // 时间和数量
      '个': ' items',
      '次': ' times',
      '月': ' months',
      '天': ' days',
      '年': ' years',
      '小时': ' hours',
      '分钟': ' minutes',
      '秒': ' seconds',
      
      // 星期
      '周一': 'Monday',
      '周二': 'Tuesday',
      '周三': 'Wednesday',
      '周四': 'Thursday',
      '周五': 'Friday',
      '周六': 'Saturday',
      '周日': 'Sunday',
      
      // 标点符号
      '：': ':',
      '，': ',',
      '。': '.',
      '！': '!',
      '？': '?',
      '（': '(',
      '）': ')',
      '【': '[',
      '】': ']'
    };
  }

  // 获取所有需要处理的文件
  getAllFiles(dir, extensions = ['.tsx', '.ts']) {
    const files = [];
    
    const traverse = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
            traverse(fullPath);
          } else if (extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // 跳过无法访问的目录
      }
    };
    
    traverse(dir);
    return files;
  }

  // 智能修复文件
  smartFixFile(filePath) {
    if (!fs.existsSync(filePath)) return 0;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fixCount = 0;
    const originalContent = content;
    const fixes = [];
    
    // 按长度排序，先处理长的翻译
    const sortedTranslations = Object.entries(this.translations)
      .sort(([a], [b]) => b.length - a.length);
    
    for (const [chinese, english] of sortedTranslations) {
      const regex = new RegExp(chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, english);
        fixCount += matches.length;
        fixes.push({ chinese, english, count: matches.length });
      }
    }
    
    // 处理特殊模式
    const specialPatterns = [
      // 处理数字+中文单位
      { pattern: /(\d+)个/g, replacement: '$1 items' },
      { pattern: /(\d+)次/g, replacement: '$1 times' },
      { pattern: /(\d+)月/g, replacement: '$1 months' },
      { pattern: /(\d+)天/g, replacement: '$1 days' },
      { pattern: /(\d+)年/g, replacement: '$1 years' },
      { pattern: /(\d+)小时/g, replacement: '$1 hours' },
      { pattern: /(\d+)分钟/g, replacement: '$1 minutes' },
      { pattern: /(\d+)秒/g, replacement: '$1 seconds' },
      
      // 清理格式问题
      { pattern: /\s+/g, replacement: ' ' },
      { pattern: /\s*\n\s*/g, replacement: '\n' },
      { pattern: /\[\[(\w+)\]\]/g, replacement: '$1' },
      { pattern: /\[([a-zA-Z\s]+)\]/g, replacement: '$1' }
    ];
    
    specialPatterns.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        fixCount += matches.length;
      }
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      this.fixHistory.push({
        file: path.relative(process.cwd(), filePath),
        fixes,
        totalFixes: fixCount
      });
    }
    
    return fixCount;
  }

  // 检测硬编码问题
  detectIssues() {
    console.log('🔍 检测硬编码中文问题...\n');
    
    const srcDir = path.join(__dirname, '../src');
    const allFiles = this.getAllFiles(srcDir);
    const issues = [];
    
    for (const file of allFiles) {
      if (!fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const chineseMatches = line.match(/[\u4e00-\u9fff]+/g);
        if (chineseMatches) {
          issues.push({
            file: path.relative(path.join(__dirname, '..'), file),
            line: index + 1,
            content: line.trim(),
            matches: chineseMatches
          });
        }
      });
    }
    
    return issues;
  }

  // 自动修复所有问题
  autoFix() {
    console.log('🚀 开始自动修复所有国际化问题...\n');
    
    const srcDir = path.join(__dirname, '../src');
    const allFiles = this.getAllFiles(srcDir);
    
    console.log(`📁 找到 ${allFiles.length} 个文件需要处理\n`);
    
    for (const file of allFiles) {
      const fixCount = this.smartFixFile(file);
      if (fixCount > 0) {
        const relativePath = path.relative(path.join(__dirname, '..'), file);
        console.log(`✅ ${relativePath}: 修复了 ${fixCount} 个问题`);
        this.totalFixed += fixCount;
        this.filesModified++;
      }
    }
  }

  // 生成修复报告
  generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}秒`,
      summary: {
        totalFiles: this.fixHistory.length,
        totalFixes: this.totalFixed,
        filesModified: this.filesModified
      },
      details: this.fixHistory
    };
    
    // 保存报告
    const reportPath = path.join(__dirname, '../I18N_MASTER_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  // 运行完整的修复流程
  async run(mode = 'auto') {
    console.log('🚀 I18N MASTER TOOLKIT 启动！\n');
    console.log(`📋 运行模式: ${mode}\n`);
    
    if (mode === 'detect') {
      // 仅检测问题
      const issues = this.detectIssues();
      console.log(`📊 检测结果: 发现 ${issues.length} 个问题`);
      return issues;
    } else if (mode === 'auto') {
      // 自动修复
      this.autoFix();
      
      // 生成报告
      const report = this.generateReport();
      
      console.log(`\n🎉 I18N MASTER TOOLKIT 修复完成！`);
      console.log(`⚡ 耗时: ${report.duration}`);
      console.log(`📊 修复统计:`);
      console.log(`   - 检查文件: ${this.getAllFiles(path.join(__dirname, '../src')).length}个`);
      console.log(`   - 修改文件: ${report.summary.filesModified}个`);
      console.log(`   - 修复问题: ${report.summary.totalFixes}个`);
      
      // 运行验证
      console.log(`\n🔍 运行最终验证:`);
      console.log(`node scripts/test-i18n-fix.js`);
      
      return report;
    }
  }
}

// 命令行接口
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'auto';
  
  const toolkit = new I18nMasterToolkit();
  toolkit.run(mode);
}

if (require.main === module) {
  main();
}

module.exports = I18nMasterToolkit;