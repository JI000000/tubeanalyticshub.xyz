#!/usr/bin/env node

/**
 * 🧹 智能脚本分析和清理工具
 * 分析脚本内容，识别无用、冗余脚本，整合有用功能
 */

const fs = require('fs');
const path = require('path');

class IntelligentScriptManager {
  constructor() {
    // 脚本分类规则
    this.scriptCategories = {
      i18n: {
        pattern: /i18n|international|translation|locale/i,
        core: ['i18n-unified-manager.js', 'i18n-quality-checker.js', 'i18n-validator.js'],
        specialized: ['i18n-fix-api.js', 'i18n-fix-components.js'],
        backup: ['i18n-master-toolkit.js']
      },
      database: {
        pattern: /db|database|schema|supabase|init/i,
        core: ['init-database.js'],
        redundant: ['simple-db-init.js', 'setup-database.js', 'init-schema.js']
      },
      testing: {
        pattern: /test|check|connection/i,
        core: ['test-connection.js'],
        redundant: ['simple-test.js']
      },
      analytics: {
        pattern: /analytics|api/i,
        core: ['test-analytics-api.js', 'create-analytics-tables.js']
      }
    };

    // 功能重复检测规则
    this.duplicatePatterns = [
      {
        name: 'supabase_connection',
        pattern: /createClient.*supabase/i,
        description: 'Supabase连接初始化'
      },
      {
        name: 'env_config',
        pattern: /require.*dotenv.*config/i,
        description: '环境变量配置'
      },
      {
        name: 'table_creation',
        pattern: /CREATE TABLE.*IF NOT EXISTS/i,
        description: '数据表创建'
      },
      {
        name: 'i18n_fix',
        pattern: /硬编码|中文|翻译|translation/i,
        description: '国际化修复'
      }
    ];

    this.scriptsDir = path.join(__dirname);
    this.backupDir = path.join(__dirname, '../.script-backup');
    
    this.results = {
      analyzed: [],
      redundant: [],
      consolidated: [],
      kept: [],
      errors: [],
      recommendations: []
    };
  }

  /**
   * 执行智能分析和清理
   */
  async analyze(options = {}) {
    console.log('🔍 开始智能脚本分析...\n');
    
    const { backup = true, dryRun = false } = options;
    
    if (backup && !dryRun) {
      this.createBackupDirectory();
    }
    
    // 扫描和分析脚本
    const allScripts = this.scanScriptsDirectory();
    console.log(`📁 发现 ${allScripts.length} 个脚本文件\n`);
    
    // 分析每个脚本
    for (const script of allScripts) {
      await this.analyzeScript(script);
    }
    
    // 检测功能重复
    this.detectDuplicateFunctionality();
    
    // 生成整合建议
    this.generateConsolidationRecommendations();
    
    // 执行清理（如果不是dry run）
    if (!dryRun) {
      await this.executeCleanup(backup);
    }
    
    this.printAnalysisResults(dryRun);
    this.generateAnalysisReport();
    
    return this.results;
  }

  /**
   * 扫描脚本目录
   */
  scanScriptsDirectory() {
    const scripts = [];
    
    try {
      const files = fs.readdirSync(this.scriptsDir);
      
      for (const file of files) {
        if (file.endsWith('.js') && file !== 'i18n-cleanup.js') {
          const fullPath = path.join(this.scriptsDir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isFile()) {
            const content = fs.readFileSync(fullPath, 'utf8');
            scripts.push({
              name: file,
              path: fullPath,
              size: stat.size,
              modified: stat.mtime,
              content: content,
              lines: content.split('\n').length
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ 扫描脚本目录失败:', error.message);
    }
    
    return scripts;
  }

  /**
   * 分析单个脚本
   */
  async analyzeScript(script) {
    console.log(`🔍 分析脚本: ${script.name}`);
    
    const analysis = {
      name: script.name,
      category: this.categorizeScript(script),
      functionality: this.extractFunctionality(script),
      dependencies: this.extractDependencies(script),
      complexity: this.assessComplexity(script),
      lastModified: script.modified,
      size: script.size,
      recommendation: 'keep' // 默认保留
    };
    
    this.results.analyzed.push(analysis);
    return analysis;
  }

  /**
   * 脚本分类
   */
  categorizeScript(script) {
    for (const [category, config] of Object.entries(this.scriptCategories)) {
      if (config.pattern.test(script.name) || config.pattern.test(script.content)) {
        if (config.core && config.core.includes(script.name)) {
          return { category, type: 'core' };
        } else if (config.specialized && config.specialized.includes(script.name)) {
          return { category, type: 'specialized' };
        } else if (config.backup && config.backup.includes(script.name)) {
          return { category, type: 'backup' };
        } else if (config.redundant && config.redundant.includes(script.name)) {
          return { category, type: 'redundant' };
        }
        return { category, type: 'unknown' };
      }
    }
    return { category: 'other', type: 'unknown' };
  }

  /**
   * 提取脚本功能
   */
  extractFunctionality(script) {
    const functionality = [];
    
    for (const pattern of this.duplicatePatterns) {
      if (pattern.pattern.test(script.content)) {
        functionality.push({
          name: pattern.name,
          description: pattern.description,
          matches: script.content.match(pattern.pattern)?.length || 1
        });
      }
    }
    
    // 检测主要功能
    const mainFunctions = script.content.match(/(?:async\s+)?function\s+(\w+)/g) || [];
    const exports = script.content.match(/module\.exports\s*=\s*(\w+)/g) || [];
    
    return {
      patterns: functionality,
      functions: mainFunctions.map(f => f.replace(/(?:async\s+)?function\s+/, '')),
      exports: exports.map(e => e.replace(/module\.exports\s*=\s*/, '')),
      hasMain: script.content.includes('if (require.main === module)'),
      isExecutable: script.content.startsWith('#!/usr/bin/env node')
    };
  }

  /**
   * 提取依赖关系
   */
  extractDependencies(script) {
    const requires = script.content.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
    const imports = script.content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
    
    return {
      requires: requires.map(r => r.match(/['"`]([^'"`]+)['"`]/)[1]),
      imports: imports.map(i => i.match(/['"`]([^'"`]+)['"`]/)[1]),
      external: requires.filter(r => !r.includes('./') && !r.includes('../')).length + imports.length
    };
  }

  /**
   * 评估复杂度
   */
  assessComplexity(script) {
    const lines = script.lines;
    const functions = (script.content.match(/function/g) || []).length;
    const classes = (script.content.match(/class\s+\w+/g) || []).length;
    const conditionals = (script.content.match(/if\s*\(|switch\s*\(|for\s*\(|while\s*\(/g) || []).length;
    
    let score = 0;
    if (lines > 500) score += 3;
    else if (lines > 200) score += 2;
    else if (lines > 100) score += 1;
    
    if (functions > 10) score += 2;
    else if (functions > 5) score += 1;
    
    if (classes > 0) score += 1;
    if (conditionals > 20) score += 2;
    else if (conditionals > 10) score += 1;
    
    return {
      score,
      level: score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low',
      lines,
      functions,
      classes,
      conditionals
    };
  }

  /**
   * 检测功能重复
   */
  detectDuplicateFunctionality() {
    console.log('\n🔍 检测功能重复...');
    
    const functionalityGroups = {};
    
    // 按功能模式分组
    for (const analysis of this.results.analyzed) {
      for (const pattern of analysis.functionality.patterns) {
        if (!functionalityGroups[pattern.name]) {
          functionalityGroups[pattern.name] = [];
        }
        functionalityGroups[pattern.name].push({
          script: analysis.name,
          matches: pattern.matches,
          category: analysis.category
        });
      }
    }
    
    // 识别重复功能
    for (const [functionality, scripts] of Object.entries(functionalityGroups)) {
      if (scripts.length > 1) {
        console.log(`⚠️  发现重复功能 "${functionality}":`, scripts.map(s => s.script).join(', '));
        
        this.results.redundant.push({
          functionality,
          scripts: scripts,
          recommendation: this.getConsolidationRecommendation(functionality, scripts)
        });
      }
    }
  }

  /**
   * 生成整合建议
   */
  generateConsolidationRecommendations() {
    console.log('\n💡 生成整合建议...');
    
    // 按类别分组分析
    const categoryGroups = {};
    for (const analysis of this.results.analyzed) {
      const category = analysis.category.category;
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(analysis);
    }
    
    // 为每个类别生成建议
    for (const [category, scripts] of Object.entries(categoryGroups)) {
      const recommendation = this.generateCategoryRecommendation(category, scripts);
      if (recommendation) {
        this.results.recommendations.push(recommendation);
      }
    }
  }

  /**
   * 获取整合建议
   */
  getConsolidationRecommendation(functionality, scripts) {
    // 按脚本类型和复杂度排序
    const sorted = scripts.sort((a, b) => {
      const aAnalysis = this.results.analyzed.find(an => an.name === a.script);
      const bAnalysis = this.results.analyzed.find(an => an.name === b.script);
      
      // 优先保留核心脚本
      if (aAnalysis.category.type === 'core' && bAnalysis.category.type !== 'core') return -1;
      if (bAnalysis.category.type === 'core' && aAnalysis.category.type !== 'core') return 1;
      
      // 其次按复杂度排序
      return bAnalysis.complexity.score - aAnalysis.complexity.score;
    });
    
    const keepScript = sorted[0].script;
    const removeScripts = sorted.slice(1).map(s => s.script);
    
    return {
      action: 'consolidate',
      keep: keepScript,
      remove: removeScripts,
      reason: `保留最复杂/核心的脚本，移除重复功能`
    };
  }

  /**
   * 生成类别建议
   */
  generateCategoryRecommendation(category, scripts) {
    if (scripts.length <= 1) return null;
    
    const coreScripts = scripts.filter(s => s.category.type === 'core');
    const redundantScripts = scripts.filter(s => s.category.type === 'redundant');
    const backupScripts = scripts.filter(s => s.category.type === 'backup');
    
    const recommendation = {
      category,
      totalScripts: scripts.length,
      actions: []
    };
    
    // 删除明确标记为冗余的脚本
    if (redundantScripts.length > 0) {
      recommendation.actions.push({
        action: 'remove',
        scripts: redundantScripts.map(s => s.name),
        reason: '功能已被核心脚本覆盖'
      });
    }
    
    // 备份脚本建议
    if (backupScripts.length > 0 && coreScripts.length > 0) {
      recommendation.actions.push({
        action: 'archive',
        scripts: backupScripts.map(s => s.name),
        reason: '作为备用工具，可考虑归档'
      });
    }
    
    return recommendation.actions.length > 0 ? recommendation : null;
  }

  /**
   * 执行清理
   */
  async executeCleanup(backup) {
    console.log('\n🧹 执行清理操作...');
    
    for (const redundant of this.results.redundant) {
      const rec = redundant.recommendation;
      if (rec.action === 'consolidate') {
        for (const scriptName of rec.remove) {
          await this.removeScript(scriptName, backup);
        }
      }
    }
    
    for (const recommendation of this.results.recommendations) {
      for (const action of recommendation.actions) {
        if (action.action === 'remove') {
          for (const scriptName of action.scripts) {
            await this.removeScript(scriptName, backup);
          }
        }
      }
    }
  }

  /**
   * 移除脚本
   */
  async removeScript(scriptName, backup) {
    const scriptPath = path.join(this.scriptsDir, scriptName);
    
    try {
      if (backup) {
        await this.backupScript({ name: scriptName, path: scriptPath });
      }
      
      fs.unlinkSync(scriptPath);
      console.log(`✅ 已删除: ${scriptName}`);
      
    } catch (error) {
      console.log(`❌ 删除失败 ${scriptName}: ${error.message}`);
      this.results.errors.push({
        script: scriptName,
        error: error.message
      });
    }
  }

  /**
   * 判断是否应该删除
   */
  shouldDelete(scriptName) {
    return this.duplicateScripts.includes(scriptName);
  }

  /**
   * 判断是否为核心脚本
   */
  isCoreScript(scriptName) {
    return this.coreScripts.includes(scriptName);
  }

  /**
   * 创建备份目录
   */
  createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 创建备份目录: ${this.backupDir}\n`);
    }
  }

  /**
   * 备份脚本
   */
  async backupScript(script) {
    const backupPath = path.join(this.backupDir, script.name);
    
    try {
      fs.copyFileSync(script.path, backupPath);
      this.results.backed_up.push(script.name);
      console.log(`   💾 已备份到: ${backupPath}`);
    } catch (error) {
      console.log(`   ⚠️  备份失败: ${error.message}`);
    }
  }

  /**
   * 打印分析结果
   */
  printAnalysisResults(dryRun) {
    console.log(`\n📊 智能分析${dryRun ? '模拟' : ''}结果:`);
    console.log(`- 分析脚本: ${this.results.analyzed.length}个`);
    console.log(`- 发现重复功能: ${this.results.redundant.length}组`);
    console.log(`- 生成建议: ${this.results.recommendations.length}个`);
    console.log(`- 错误数量: ${this.results.errors.length}个`);
    
    // 按类别统计
    const categoryStats = {};
    for (const analysis of this.results.analyzed) {
      const category = analysis.category.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, core: 0, redundant: 0, backup: 0 };
      }
      categoryStats[category].total++;
      categoryStats[category][analysis.category.type]++;
    }
    
    console.log(`\n📋 脚本分类统计:`);
    for (const [category, stats] of Object.entries(categoryStats)) {
      console.log(`   ${category}: ${stats.total}个 (核心:${stats.core}, 冗余:${stats.redundant}, 备用:${stats.backup})`);
    }
    
    if (this.results.redundant.length > 0) {
      console.log(`\n⚠️  重复功能详情:`);
      this.results.redundant.forEach(redundant => {
        console.log(`   ${redundant.functionality}:`);
        console.log(`     涉及脚本: ${redundant.scripts.map(s => s.script).join(', ')}`);
        console.log(`     建议: 保留 ${redundant.recommendation.keep}, 移除 ${redundant.recommendation.remove.join(', ')}`);
      });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 整合建议:`);
      this.results.recommendations.forEach(rec => {
        console.log(`   ${rec.category} 类别 (${rec.totalScripts}个脚本):`);
        rec.actions.forEach(action => {
          console.log(`     ${action.action}: ${action.scripts.join(', ')} - ${action.reason}`);
        });
      });
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ 错误详情:`);
      this.results.errors.forEach(error => {
        console.log(`   - ${error.script}: ${error.error}`);
      });
    }
  }

  /**
   * 生成分析报告
   */
  generateAnalysisReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalScripts: this.results.analyzed.length,
        redundantFunctionality: this.results.redundant.length,
        recommendations: this.results.recommendations.length,
        errors: this.results.errors.length
      },
      analysis: {
        scripts: this.results.analyzed,
        redundancy: this.results.redundant,
        recommendations: this.results.recommendations
      },
      categoryStats: this.generateCategoryStats(),
      complexityStats: this.generateComplexityStats(),
      actionPlan: this.generateActionPlan()
    };
    
    const reportPath = path.join(__dirname, '../SCRIPT_ANALYSIS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 分析报告已保存到: ${reportPath}`);
  }

  /**
   * 生成类别统计
   */
  generateCategoryStats() {
    const stats = {};
    for (const analysis of this.results.analyzed) {
      const category = analysis.category.category;
      if (!stats[category]) {
        stats[category] = { total: 0, types: {} };
      }
      stats[category].total++;
      const type = analysis.category.type;
      stats[category].types[type] = (stats[category].types[type] || 0) + 1;
    }
    return stats;
  }

  /**
   * 生成复杂度统计
   */
  generateComplexityStats() {
    const stats = { low: 0, medium: 0, high: 0 };
    for (const analysis of this.results.analyzed) {
      stats[analysis.complexity.level]++;
    }
    return stats;
  }

  /**
   * 生成行动计划
   */
  generateActionPlan() {
    const plan = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };
    
    // 立即执行：删除明确冗余的脚本
    for (const redundant of this.results.redundant) {
      if (redundant.recommendation.remove.length > 0) {
        plan.immediate.push({
          action: 'remove',
          scripts: redundant.recommendation.remove,
          reason: `重复功能: ${redundant.functionality}`
        });
      }
    }
    
    // 短期：整合相似功能
    for (const rec of this.results.recommendations) {
      const removeActions = rec.actions.filter(a => a.action === 'remove');
      if (removeActions.length > 0) {
        plan.shortTerm.push({
          category: rec.category,
          actions: removeActions
        });
      }
    }
    
    // 长期：优化和标准化
    plan.longTerm.push({
      action: 'standardize',
      description: '建立脚本命名和结构标准',
      priority: 'medium'
    });
    
    return plan;
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.deleted.length > 0) {
      recommendations.push({
        type: 'cleanup_success',
        description: `成功清理了 ${this.results.deleted.length} 个重复脚本`,
        action: '项目结构更加整洁，维护成本降低'
      });
    }
    
    if (this.results.backed_up.length > 0) {
      recommendations.push({
        type: 'backup_available',
        description: `${this.results.backed_up.length} 个脚本已备份`,
        action: `如需恢复，请查看 ${this.backupDir} 目录`
      });
    }
    
    recommendations.push({
      type: 'usage_guide',
      description: '使用统一的脚本管理工具',
      action: '参考 docs/I18N_SCRIPT_USAGE_GUIDE.md 了解推荐的使用方式'
    });
    
    return recommendations;
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🔍 智能脚本分析和清理工具

功能:
  - 分析脚本内容和功能
  - 检测重复和冗余功能
  - 生成智能整合建议
  - 安全清理无用脚本

用法:
  node scripts/i18n-cleanup.js [选项]

选项:
  --dry-run     模拟运行，不实际删除文件
  --no-backup   不创建备份文件
  --help        显示帮助信息

示例:
  # 智能分析（推荐先运行）
  node scripts/i18n-cleanup.js --dry-run
  
  # 执行清理（带备份）
  node scripts/i18n-cleanup.js
  
  # 执行清理（不备份）
  node scripts/i18n-cleanup.js --no-backup

分析维度:
  - 脚本分类 (i18n, database, testing, analytics)
  - 功能重复检测
  - 复杂度评估
  - 依赖关系分析
  - 整合建议生成
    `);
  }
}

// 命令行接口
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    const manager = new IntelligentScriptManager();
    manager.showHelp();
    return;
  }
  
  const options = {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup')
  };
  
  const manager = new IntelligentScriptManager();
  manager.analyze(options);
}

if (require.main === module) {
  main();
}

module.exports = IntelligentScriptManager;