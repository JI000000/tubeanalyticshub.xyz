#!/usr/bin/env node

/**
 * 深度代码检视器 - 彻底排查项目真实状态
 * 
 * 设计原则：
 * 1. 彻底检查每个文件的实际内容
 * 2. 验证功能的真实实现程度
 * 3. 识别隐藏的问题和风险
 * 4. 生成详细的修复建议
 * 
 * 创建时间：2025-07-31T03:15:00Z
 */

const fs = require('fs');
const path = require('path');

class DeepCodeInspector {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    this.inspection = {
      metadata: {
        timestamp: new Date().toISOString(),
        inspector_version: '1.0.0',
        project_name: 'YouTube Analytics Platform'
      },
      summary: {
        files_inspected: 0,
        issues_found: 0,
        critical_issues: 0,
        warnings: 0
      },
      detailed_findings: {
        api_routes: {},
        components: {},
        pages: {},
        database: {},
        i18n: {},
        configuration: {}
      },
      recommendations: []
    };
  }

  /**
   * 主检视函数
   */
  async inspect() {
    console.log('🔍 深度代码检视器启动');
    console.log('=' .repeat(60));
    console.log(`⏰ 检视时间: ${this.inspection.metadata.timestamp}`);
    console.log('🎯 目标: 彻底排查项目真实状态\n');

    try {
      await this.inspectAPIRoutes();
      await this.inspectComponents();
      await this.inspectPages();
      await this.inspectDatabase();
      await this.inspectI18n();
      await this.inspectConfiguration();
      
      this.generateRecommendations();
      await this.saveReport();
      
      console.log('\n✅ 深度检视完成');
      console.log(`📊 检视了 ${this.inspection.summary.files_inspected} 个文件`);
      console.log(`🚨 发现 ${this.inspection.summary.issues_found} 个问题`);
      console.log(`🔴 其中 ${this.inspection.summary.critical_issues} 个关键问题`);
      
    } catch (error) {
      console.error('❌ 检视过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 检视API路由
   */
  async inspectAPIRoutes() {
    console.log('🔌 深度检视API路由...');
    
    const apiDir = path.join(this.projectRoot, 'src/app/api');
    const routes = this.findAllRoutes(apiDir);
    
    for (const route of routes) {
      const routePath = path.relative(this.projectRoot, route);
      const content = fs.readFileSync(route, 'utf8');
      
      const analysis = this.analyzeAPIRoute(content, routePath);
      this.inspection.detailed_findings.api_routes[routePath] = analysis;
      
      if (analysis.is_mock) {
        this.inspection.summary.issues_found++;
        if (analysis.is_critical) {
          this.inspection.summary.critical_issues++;
        }
      }
      
      this.inspection.summary.files_inspected++;
    }
    
    console.log(`  📁 检视了 ${routes.length} 个API路由`);
  }

  /**
   * 检视React组件
   */
  async inspectComponents() {
    console.log('🧩 深度检视React组件...');
    
    const componentsDir = path.join(this.projectRoot, 'src/components');
    const components = this.findAllComponents(componentsDir);
    
    for (const component of components) {
      const componentPath = path.relative(this.projectRoot, component);
      const content = fs.readFileSync(component, 'utf8');
      
      const analysis = this.analyzeComponent(content, componentPath);
      this.inspection.detailed_findings.components[componentPath] = analysis;
      
      if (analysis.has_issues) {
        this.inspection.summary.issues_found++;
        if (analysis.is_critical) {
          this.inspection.summary.critical_issues++;
        }
      }
      
      this.inspection.summary.files_inspected++;
    }
    
    console.log(`  🧩 检视了 ${components.length} 个组件`);
  }

  /**
   * 检视页面
   */
  async inspectPages() {
    console.log('📄 深度检视页面...');
    
    const pagesDir = path.join(this.projectRoot, 'src/app/[locale]');
    const pages = this.findAllPages(pagesDir);
    
    for (const page of pages) {
      const pagePath = path.relative(this.projectRoot, page);
      const content = fs.readFileSync(page, 'utf8');
      
      const analysis = this.analyzePage(content, pagePath);
      this.inspection.detailed_findings.pages[pagePath] = analysis;
      
      if (analysis.has_issues) {
        this.inspection.summary.issues_found++;
        if (analysis.is_critical) {
          this.inspection.summary.critical_issues++;
        }
      }
      
      this.inspection.summary.files_inspected++;
    }
    
    console.log(`  📄 检视了 ${pages.length} 个页面`);
  }

  /**
   * 检视数据库
   */
  async inspectDatabase() {
    console.log('🗄️  深度检视数据库...');
    
    const schemaFile = path.join(this.projectRoot, 'supabase/schema.sql');
    const databaseFile = path.join(this.projectRoot, 'src/lib/database.ts');
    
    const analysis = {
      schema_issues: [],
      database_lib_issues: [],
      consistency_issues: []
    };
    
    if (fs.existsSync(schemaFile)) {
      const schemaContent = fs.readFileSync(schemaFile, 'utf8');
      analysis.schema_issues = this.analyzeSchema(schemaContent);
      this.inspection.summary.files_inspected++;
    }
    
    if (fs.existsSync(databaseFile)) {
      const dbContent = fs.readFileSync(databaseFile, 'utf8');
      analysis.database_lib_issues = this.analyzeDatabaseLib(dbContent);
      this.inspection.summary.files_inspected++;
    }
    
    // 检查一致性
    analysis.consistency_issues = this.checkDatabaseConsistency();
    
    this.inspection.detailed_findings.database = analysis;
    
    const totalIssues = analysis.schema_issues.length + 
                       analysis.database_lib_issues.length + 
                       analysis.consistency_issues.length;
    
    this.inspection.summary.issues_found += totalIssues;
    this.inspection.summary.critical_issues += analysis.consistency_issues.length;
    
    console.log(`  🗄️  发现 ${totalIssues} 个数据库问题`);
  }

  /**
   * 检视国际化
   */
  async inspectI18n() {
    console.log('🌍 深度检视国际化系统...');
    
    const i18nDir = path.join(this.projectRoot, 'src/i18n');
    const messagesDir = path.join(i18nDir, 'messages');
    
    const analysis = {
      config_issues: [],
      translation_issues: [],
      usage_issues: []
    };
    
    // 检查配置
    const configFile = path.join(i18nDir, 'config.ts');
    if (fs.existsSync(configFile)) {
      const configContent = fs.readFileSync(configFile, 'utf8');
      analysis.config_issues = this.analyzeI18nConfig(configContent);
      this.inspection.summary.files_inspected++;
    }
    
    // 检查翻译文件
    if (fs.existsSync(messagesDir)) {
      const translationFiles = fs.readdirSync(messagesDir)
        .filter(file => file.endsWith('.json'));
      
      for (const file of translationFiles) {
        const filePath = path.join(messagesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        try {
          const translations = JSON.parse(content);
          const issues = this.analyzeTranslations(translations, file);
          analysis.translation_issues.push(...issues);
          this.inspection.summary.files_inspected++;
        } catch (error) {
          analysis.translation_issues.push({
            file,
            issue: 'JSON格式错误',
            severity: 'critical'
          });
        }
      }
    }
    
    // 检查使用情况
    analysis.usage_issues = this.analyzeI18nUsage();
    
    this.inspection.detailed_findings.i18n = analysis;
    
    const totalIssues = analysis.config_issues.length + 
                       analysis.translation_issues.length + 
                       analysis.usage_issues.length;
    
    this.inspection.summary.issues_found += totalIssues;
    this.inspection.summary.critical_issues += analysis.translation_issues
      .filter(issue => issue.severity === 'critical').length;
    
    console.log(`  🌍 发现 ${totalIssues} 个国际化问题`);
  }

  /**
   * 检视配置
   */
  async inspectConfiguration() {
    console.log('⚙️  深度检视项目配置...');
    
    const configFiles = [
      'package.json',
      'next.config.ts',
      'tailwind.config.ts',
      'tsconfig.json',
      '.env.example',
      'middleware.ts'
    ];
    
    const analysis = {
      config_issues: [],
      dependency_issues: [],
      security_issues: []
    };
    
    for (const configFile of configFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = this.analyzeConfigFile(content, configFile);
        analysis.config_issues.push(...issues);
        this.inspection.summary.files_inspected++;
      } else {
        analysis.config_issues.push({
          file: configFile,
          issue: '配置文件缺失',
          severity: 'warning'
        });
      }
    }
    
    this.inspection.detailed_findings.configuration = analysis;
    
    const totalIssues = analysis.config_issues.length + 
                       analysis.dependency_issues.length + 
                       analysis.security_issues.length;
    
    this.inspection.summary.issues_found += totalIssues;
    
    console.log(`  ⚙️  发现 ${totalIssues} 个配置问题`);
  }

  /**
   * 分析API路由
   */
  analyzeAPIRoute(content, routePath) {
    const analysis = {
      has_get: content.includes('export async function GET'),
      has_post: content.includes('export async function POST'),
      has_put: content.includes('export async function PUT'),
      has_delete: content.includes('export async function DELETE'),
      is_mock: false,
      is_critical: false,
      issues: []
    };
    
    // 检查是否为Mock实现
    const mockIndicators = [
      'mockReports',
      'mockInsights', 
      'mockAnalysis',
      'const mock',
      '// Mock data',
      'Mock implementation'
    ];
    
    analysis.is_mock = mockIndicators.some(indicator => 
      content.includes(indicator)
    );
    
    // 判断是否为关键路由
    const criticalRoutes = [
      'analytics/dashboard',
      'analytics/reports',
      'analytics/insights',
      'analytics/competitor'
    ];
    
    analysis.is_critical = criticalRoutes.some(route => 
      routePath.includes(route)
    );
    
    // 检查具体问题
    if (analysis.is_mock && analysis.is_critical) {
      analysis.issues.push('关键API路由使用Mock数据');
    }
    
    if (!analysis.has_get && !analysis.has_post) {
      analysis.issues.push('API路由缺少HTTP方法实现');
    }
    
    if (content.includes('TODO') || content.includes('FIXME')) {
      analysis.issues.push('代码中包含待办事项');
    }
    
    return analysis;
  }

  /**
   * 分析React组件
   */
  analyzeComponent(content, componentPath) {
    const analysis = {
      has_typescript: componentPath.endsWith('.tsx'),
      uses_hooks: content.includes('useState') || content.includes('useEffect'),
      uses_i18n: content.includes('useTranslation') || content.includes('useIntl'),
      has_hardcoded_text: false,
      has_issues: false,
      is_critical: false,
      issues: []
    };
    
    // 检查硬编码中文
    const chineseRegex = /[\u4e00-\u9fff]/g;
    const chineseMatches = content.match(chineseRegex);
    
    if (chineseMatches && chineseMatches.length > 0) {
      analysis.has_hardcoded_text = true;
      analysis.has_issues = true;
      analysis.issues.push(`发现 ${chineseMatches.length} 个硬编码中文字符`);
    }
    
    // 检查是否为关键组件
    const criticalComponents = [
      'AIInsightsPanel',
      'TrendPrediction',
      'ReportBuilder',
      'CompetitorAnalysis'
    ];
    
    analysis.is_critical = criticalComponents.some(comp => 
      componentPath.includes(comp)
    );
    
    // 检查组件完整性
    if (!content.includes('export default') && !content.includes('export {')) {
      analysis.has_issues = true;
      analysis.issues.push('组件缺少导出声明');
    }
    
    if (content.includes('TODO') || content.includes('FIXME')) {
      analysis.has_issues = true;
      analysis.issues.push('组件包含待办事项');
    }
    
    return analysis;
  }

  /**
   * 分析页面
   */
  analyzePage(content, pagePath) {
    const analysis = {
      is_client_component: content.includes("'use client'"),
      uses_app_shell: content.includes('AppShell'),
      has_loading_state: content.includes('loading') || content.includes('Loading'),
      has_error_handling: content.includes('try') || content.includes('catch'),
      has_issues: false,
      is_critical: false,
      issues: []
    };
    
    // 检查是否为关键页面
    const criticalPages = [
      'videos/page.tsx',
      'insights/page.tsx', 
      'reports/page.tsx',
      'competitor/page.tsx'
    ];
    
    analysis.is_critical = criticalPages.some(page => 
      pagePath.includes(page)
    );
    
    // 检查页面完整性
    if (!content.includes('export default')) {
      analysis.has_issues = true;
      analysis.issues.push('页面缺少默认导出');
    }
    
    if (!analysis.uses_app_shell && !pagePath.includes('layout.tsx')) {
      analysis.has_issues = true;
      analysis.issues.push('页面未使用AppShell布局');
    }
    
    // 检查硬编码文本
    const chineseRegex = /[\u4e00-\u9fff]/g;
    const chineseMatches = content.match(chineseRegex);
    
    if (chineseMatches && chineseMatches.length > 5) {
      analysis.has_issues = true;
      analysis.issues.push(`页面包含大量硬编码中文 (${chineseMatches.length}个字符)`);
    }
    
    return analysis;
  }

  /**
   * 分析数据库Schema
   */
  analyzeSchema(content) {
    const issues = [];
    
    // 检查重复表定义
    const tableMatches = content.match(/CREATE TABLE.*?yt_\w+/g);
    const tableNames = {};
    
    if (tableMatches) {
      for (const match of tableMatches) {
        const tableName = match.match(/yt_\w+/)[0];
        if (tableNames[tableName]) {
          issues.push(`表 ${tableName} 定义重复`);
        } else {
          tableNames[tableName] = true;
        }
      }
    }
    
    // 检查外键约束
    if (!content.includes('REFERENCES')) {
      issues.push('Schema缺少外键约束');
    }
    
    // 检查索引
    if (!content.includes('CREATE INDEX')) {
      issues.push('Schema缺少性能索引');
    }
    
    return issues;
  }

  /**
   * 分析数据库库文件
   */
  analyzeDatabaseLib(content) {
    const issues = [];
    
    // 检查错误处理
    if (!content.includes('try') || !content.includes('catch')) {
      issues.push('数据库操作缺少错误处理');
    }
    
    // 检查类型定义
    if (!content.includes('interface') && !content.includes('type')) {
      issues.push('缺少TypeScript类型定义');
    }
    
    // 检查连接管理
    if (!content.includes('createClient')) {
      issues.push('缺少数据库连接管理');
    }
    
    return issues;
  }

  /**
   * 检查数据库一致性
   */
  checkDatabaseConsistency() {
    const issues = [];
    
    // 这里可以添加更复杂的一致性检查逻辑
    // 比如检查Schema定义与代码使用的一致性
    
    return issues;
  }

  /**
   * 分析国际化配置
   */
  analyzeI18nConfig(content) {
    const issues = [];
    
    if (!content.includes('locales')) {
      issues.push('国际化配置缺少语言列表');
    }
    
    if (!content.includes('defaultLocale')) {
      issues.push('国际化配置缺少默认语言');
    }
    
    return issues;
  }

  /**
   * 分析翻译文件
   */
  analyzeTranslations(translations, filename) {
    const issues = [];
    
    const keyCount = this.countKeys(translations);
    
    if (keyCount < 10) {
      issues.push({
        file: filename,
        issue: `翻译内容过少 (${keyCount}个键)`,
        severity: 'warning'
      });
    }
    
    if (keyCount === 0) {
      issues.push({
        file: filename,
        issue: '翻译文件为空',
        severity: 'critical'
      });
    }
    
    return issues;
  }

  /**
   * 分析国际化使用情况
   */
  analyzeI18nUsage() {
    const issues = [];
    
    // 检查组件中的硬编码文本
    const componentsDir = path.join(this.projectRoot, 'src/components');
    const components = this.findAllComponents(componentsDir);
    
    let hardcodedCount = 0;
    
    for (const component of components) {
      const content = fs.readFileSync(component, 'utf8');
      const chineseMatches = content.match(/[\u4e00-\u9fff]/g);
      
      if (chineseMatches) {
        hardcodedCount += chineseMatches.length;
      }
    }
    
    if (hardcodedCount > 50) {
      issues.push({
        issue: `发现大量硬编码中文字符 (${hardcodedCount}个)`,
        severity: 'critical'
      });
    }
    
    return issues;
  }

  /**
   * 分析配置文件
   */
  analyzeConfigFile(content, filename) {
    const issues = [];
    
    if (filename === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        
        if (!pkg.scripts || !pkg.scripts.dev) {
          issues.push({
            file: filename,
            issue: '缺少开发脚本',
            severity: 'warning'
          });
        }
        
        if (!pkg.dependencies || !pkg.dependencies.next) {
          issues.push({
            file: filename,
            issue: '缺少Next.js依赖',
            severity: 'critical'
          });
        }
      } catch (error) {
        issues.push({
          file: filename,
          issue: 'JSON格式错误',
          severity: 'critical'
        });
      }
    }
    
    return issues;
  }

  /**
   * 生成修复建议
   */
  generateRecommendations() {
    console.log('💡 生成修复建议...');
    
    const recommendations = [];
    
    // 基于API路由问题生成建议
    const mockAPIs = Object.entries(this.inspection.detailed_findings.api_routes)
      .filter(([path, analysis]) => analysis.is_mock && analysis.is_critical);
    
    if (mockAPIs.length > 0) {
      recommendations.push({
        priority: 'P0',
        category: 'API实现',
        title: '替换关键API的Mock实现',
        description: `发现 ${mockAPIs.length} 个关键API使用Mock数据`,
        estimated_time: '2-3天',
        risk: 'high',
        files_affected: mockAPIs.map(([path]) => path)
      });
    }
    
    // 基于组件问题生成建议
    const hardcodedComponents = Object.entries(this.inspection.detailed_findings.components)
      .filter(([path, analysis]) => analysis.has_hardcoded_text);
    
    if (hardcodedComponents.length > 0) {
      recommendations.push({
        priority: 'P1',
        category: '国际化',
        title: '修复组件中的硬编码文本',
        description: `发现 ${hardcodedComponents.length} 个组件包含硬编码中文`,
        estimated_time: '1-2天',
        risk: 'medium',
        files_affected: hardcodedComponents.map(([path]) => path)
      });
    }
    
    // 基于数据库问题生成建议
    const dbIssues = this.inspection.detailed_findings.database;
    if (dbIssues.schema_issues.length > 0) {
      recommendations.push({
        priority: 'P0',
        category: '数据库',
        title: '修复数据库Schema问题',
        description: `发现 ${dbIssues.schema_issues.length} 个Schema问题`,
        estimated_time: '1-2小时',
        risk: 'medium',
        issues: dbIssues.schema_issues
      });
    }
    
    this.inspection.recommendations = recommendations;
    
    console.log(`  💡 生成了 ${recommendations.length} 条修复建议`);
  }

  /**
   * 保存检视报告
   */
  async saveReport() {
    const reportDir = path.join(__dirname, '../reports');
    
    // 确保报告目录存在
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // 保存JSON报告
    const jsonPath = path.join(reportDir, `deep-inspection-${this.timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.inspection, null, 2));
    
    // 生成Markdown报告
    const markdownPath = path.join(reportDir, `deep-inspection-${this.timestamp}.md`);
    const markdown = this.generateMarkdownReport();
    fs.writeFileSync(markdownPath, markdown);
    
    console.log(`\n📄 检视报告已保存:`);
    console.log(`  - JSON: ${jsonPath}`);
    console.log(`  - Markdown: ${markdownPath}`);
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport() {
    return `# 深度代码检视报告

**检视时间**: ${this.inspection.metadata.timestamp}  
**检视器版本**: ${this.inspection.metadata.inspector_version}  
**项目**: ${this.inspection.metadata.project_name}

## 📊 检视概览

- 📁 检视文件数: ${this.inspection.summary.files_inspected}
- 🚨 发现问题数: ${this.inspection.summary.issues_found}
- 🔴 关键问题数: ${this.inspection.summary.critical_issues}
- ⚠️ 警告数: ${this.inspection.summary.warnings}

## 🔌 API路由分析

${this.generateAPIAnalysisMarkdown()}

## 🧩 组件分析

${this.generateComponentAnalysisMarkdown()}

## 📄 页面分析

${this.generatePageAnalysisMarkdown()}

## 🗄️ 数据库分析

${this.generateDatabaseAnalysisMarkdown()}

## 🌍 国际化分析

${this.generateI18nAnalysisMarkdown()}

## 💡 修复建议

${this.generateRecommendationsMarkdown()}

---

**报告生成时间**: ${new Date().toISOString()}  
**下次检视建议**: 修复完成后重新运行检视
`;
  }

  /**
   * 工具函数
   */
  findAllRoutes(dir) {
    const routes = [];
    
    if (!fs.existsSync(dir)) return routes;
    
    const traverse = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item === 'route.ts') {
          routes.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return routes;
  }

  findAllComponents(dir) {
    const components = [];
    
    if (!fs.existsSync(dir)) return components;
    
    const traverse = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
          components.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return components;
  }

  findAllPages(dir) {
    const pages = [];
    
    if (!fs.existsSync(dir)) return pages;
    
    const traverse = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item === 'page.tsx') {
          pages.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return pages;
  }

  countKeys(obj, count = 0) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count = this.countKeys(obj[key], count);
      } else {
        count++;
      }
    }
    return count;
  }

  generateAPIAnalysisMarkdown() {
    const apis = this.inspection.detailed_findings.api_routes;
    let markdown = '';
    
    for (const [path, analysis] of Object.entries(apis)) {
      markdown += `### ${path}\n\n`;
      markdown += `- GET方法: ${analysis.has_get ? '✅' : '❌'}\n`;
      markdown += `- POST方法: ${analysis.has_post ? '✅' : '❌'}\n`;
      markdown += `- Mock实现: ${analysis.is_mock ? '⚠️ 是' : '✅ 否'}\n`;
      markdown += `- 关键路由: ${analysis.is_critical ? '🔴 是' : '🟢 否'}\n`;
      
      if (analysis.issues.length > 0) {
        markdown += `- 问题: ${analysis.issues.join(', ')}\n`;
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }

  generateComponentAnalysisMarkdown() {
    const components = this.inspection.detailed_findings.components;
    let markdown = '';
    
    for (const [path, analysis] of Object.entries(components)) {
      if (analysis.has_issues) {
        markdown += `### ${path}\n\n`;
        markdown += `- TypeScript: ${analysis.has_typescript ? '✅' : '❌'}\n`;
        markdown += `- 使用Hooks: ${analysis.uses_hooks ? '✅' : '❌'}\n`;
        markdown += `- 国际化: ${analysis.uses_i18n ? '✅' : '❌'}\n`;
        markdown += `- 硬编码文本: ${analysis.has_hardcoded_text ? '⚠️ 有' : '✅ 无'}\n`;
        
        if (analysis.issues.length > 0) {
          markdown += `- 问题: ${analysis.issues.join(', ')}\n`;
        }
        
        markdown += '\n';
      }
    }
    
    return markdown;
  }

  generatePageAnalysisMarkdown() {
    const pages = this.inspection.detailed_findings.pages;
    let markdown = '';
    
    for (const [path, analysis] of Object.entries(pages)) {
      if (analysis.has_issues) {
        markdown += `### ${path}\n\n`;
        markdown += `- 客户端组件: ${analysis.is_client_component ? '✅' : '❌'}\n`;
        markdown += `- 使用AppShell: ${analysis.uses_app_shell ? '✅' : '❌'}\n`;
        markdown += `- 加载状态: ${analysis.has_loading_state ? '✅' : '❌'}\n`;
        markdown += `- 错误处理: ${analysis.has_error_handling ? '✅' : '❌'}\n`;
        
        if (analysis.issues.length > 0) {
          markdown += `- 问题: ${analysis.issues.join(', ')}\n`;
        }
        
        markdown += '\n';
      }
    }
    
    return markdown;
  }

  generateDatabaseAnalysisMarkdown() {
    const db = this.inspection.detailed_findings.database;
    let markdown = '';
    
    if (db.schema_issues.length > 0) {
      markdown += '### Schema问题\n\n';
      for (const issue of db.schema_issues) {
        markdown += `- ${issue}\n`;
      }
      markdown += '\n';
    }
    
    if (db.database_lib_issues.length > 0) {
      markdown += '### 数据库库问题\n\n';
      for (const issue of db.database_lib_issues) {
        markdown += `- ${issue}\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  generateI18nAnalysisMarkdown() {
    const i18n = this.inspection.detailed_findings.i18n;
    let markdown = '';
    
    if (i18n.config_issues.length > 0) {
      markdown += '### 配置问题\n\n';
      for (const issue of i18n.config_issues) {
        markdown += `- ${issue}\n`;
      }
      markdown += '\n';
    }
    
    if (i18n.translation_issues.length > 0) {
      markdown += '### 翻译问题\n\n';
      for (const issue of i18n.translation_issues) {
        markdown += `- ${issue.file}: ${issue.issue} (${issue.severity})\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  generateRecommendationsMarkdown() {
    let markdown = '';
    
    for (const rec of this.inspection.recommendations) {
      markdown += `### ${rec.priority} - ${rec.title}\n\n`;
      markdown += `- **分类**: ${rec.category}\n`;
      markdown += `- **描述**: ${rec.description}\n`;
      markdown += `- **预计时间**: ${rec.estimated_time}\n`;
      markdown += `- **风险等级**: ${rec.risk}\n`;
      
      if (rec.files_affected) {
        markdown += `- **影响文件**: ${rec.files_affected.length}个\n`;
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }
}

// 主函数
async function main() {
  const inspector = new DeepCodeInspector();
  await inspector.inspect();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeepCodeInspector;