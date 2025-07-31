#!/usr/bin/env node

/**
 * 安全修复计划器 - 基于代码检视结果的渐进式修复方案
 * 
 * 设计原则：
 * 1. 只检查和规划，不自动修改代码
 * 2. 提供详细的手动修复指导
 * 3. 分阶段、可回滚的修复方案
 * 4. 每步都有验证机制
 */

const fs = require('fs');
const path = require('path');

class SafeFixPlanner {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.issues = {
      critical: [],
      important: [],
      minor: []
    };
    this.fixPlan = {
      phase1: [],
      phase2: [],
      phase3: []
    };
  }

  /**
   * 主执行函数 - 只分析，不修改
   */
  async analyze() {
    console.log('🔍 安全修复计划器 - 分析模式');
    console.log('=' .repeat(60));
    console.log('⚠️  注意：此工具只分析问题，不会自动修改任何文件');
    console.log('');

    await this.analyzeProjectStructure();
    await this.analyzeAPIRoutes();
    await this.analyzeComponents();
    await this.analyzeDatabase();
    
    this.generateFixPlan();
    this.generateManualInstructions();
    
    console.log('\n✅ 分析完成，修复计划已生成');
    console.log('📋 请查看生成的修复指导文档');
  }

  /**
   * 分析项目结构
   */
  async analyzeProjectStructure() {
    console.log('📁 分析项目结构...');
    
    const criticalFiles = [
      'src/app/api/analytics/dashboard/route.ts',
      'src/app/api/analytics/dashboard/[id]/route.ts',
      'src/app/api/analytics/reports/[id]/route.ts',
      'src/app/api/analytics/insights/[id]/route.ts'
    ];

    const missingFiles = [];
    
    for (const file of criticalFiles) {
      const fullPath = path.join(this.projectRoot, file);
      if (!fs.existsSync(fullPath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      this.issues.critical.push({
        type: 'missing_files',
        description: '关键API路由文件缺失',
        files: missingFiles,
        impact: 'high',
        effort: 'medium'
      });
    }

    console.log(`  - 检查了 ${criticalFiles.length} 个关键文件`);
    console.log(`  - 发现 ${missingFiles.length} 个缺失文件`);
  }

  /**
   * 分析API路由
   */
  async analyzeAPIRoutes() {
    console.log('🔌 分析API路由...');
    
    const apiDir = path.join(this.projectRoot, 'src/app/api');
    const mockAPIs = [];
    
    if (fs.existsSync(apiDir)) {
      const routeFiles = this.findRouteFiles(apiDir);
      
      for (const file of routeFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (this.isMockImplementation(content)) {
          mockAPIs.push(path.relative(this.projectRoot, file));
        }
      }
    }

    if (mockAPIs.length > 0) {
      this.issues.important.push({
        type: 'mock_apis',
        description: 'API路由使用Mock数据',
        files: mockAPIs,
        impact: 'high',
        effort: 'high'
      });
    }

    console.log(`  - 检查了API路由实现`);
    console.log(`  - 发现 ${mockAPIs.length} 个Mock API`);
  }

  /**
   * 分析组件
   */
  async analyzeComponents() {
    console.log('🧩 分析React组件...');
    
    const missingComponents = [
      'src/components/analytics/AIInsightsPanel.tsx',
      'src/components/analytics/TrendPrediction.tsx',
      'src/components/reports/ReportBuilder.tsx',
      'src/components/competitor/CompetitorAnalysis.tsx'
    ];

    const missing = [];
    
    for (const component of missingComponents) {
      const fullPath = path.join(this.projectRoot, component);
      if (!fs.existsSync(fullPath)) {
        missing.push(component);
      }
    }

    if (missing.length > 0) {
      this.issues.critical.push({
        type: 'missing_components',
        description: '核心组件缺失',
        files: missing,
        impact: 'high',
        effort: 'high'
      });
    }

    console.log(`  - 检查了 ${missingComponents.length} 个核心组件`);
    console.log(`  - 发现 ${missing.length} 个缺失组件`);
  }

  /**
   * 分析数据库
   */
  async analyzeDatabase() {
    console.log('🗄️  分析数据库Schema...');
    
    const schemaFile = path.join(this.projectRoot, 'supabase/schema.sql');
    
    if (fs.existsSync(schemaFile)) {
      const content = fs.readFileSync(schemaFile, 'utf8');
      const issues = this.analyzeSchemaContent(content);
      
      if (issues.length > 0) {
        this.issues.important.push({
          type: 'schema_issues',
          description: '数据库Schema问题',
          details: issues,
          impact: 'medium',
          effort: 'medium'
        });
      }
    }

    console.log('  - 分析了数据库Schema');
  }

  /**
   * 生成修复计划
   */
  generateFixPlan() {
    console.log('\n📋 生成修复计划...');
    
    // Phase 1: 关键文件和结构
    this.fixPlan.phase1 = [
      {
        title: '创建缺失的API路由文件',
        priority: 'P0',
        estimated_time: '2-3小时',
        risk: 'low',
        dependencies: [],
        validation: '运行 npm run dev 确保无编译错误'
      },
      {
        title: '修复数据库Schema重复定义',
        priority: 'P0', 
        estimated_time: '1小时',
        risk: 'medium',
        dependencies: [],
        validation: '运行数据库迁移测试'
      }
    ];

    // Phase 2: 核心功能实现
    this.fixPlan.phase2 = [
      {
        title: '实现核心Analytics组件',
        priority: 'P1',
        estimated_time: '1-2天',
        risk: 'medium',
        dependencies: ['Phase 1完成'],
        validation: '组件渲染测试'
      },
      {
        title: '替换Mock API为真实实现',
        priority: 'P1',
        estimated_time: '2-3天', 
        risk: 'high',
        dependencies: ['数据库Schema修复'],
        validation: 'API集成测试'
      }
    ];

    // Phase 3: 优化和完善
    this.fixPlan.phase3 = [
      {
        title: '完善多语言翻译',
        priority: 'P2',
        estimated_time: '1天',
        risk: 'low',
        dependencies: ['核心功能完成'],
        validation: '多语言切换测试'
      }
    ];

    console.log('  ✅ 修复计划已生成');
  }

  /**
   * 生成手动修复指导
   */
  generateManualInstructions() {
    const instructions = {
      metadata: {
        generated_at: new Date().toISOString(),
        project: 'YouTube Analytics Platform',
        version: '1.0.0'
      },
      summary: {
        critical_issues: this.issues.critical.length,
        important_issues: this.issues.important.length,
        minor_issues: this.issues.minor.length,
        total_estimated_time: '1-2周'
      },
      issues: this.issues,
      fix_plan: this.fixPlan,
      manual_steps: this.generateDetailedSteps()
    };

    const outputPath = path.join(__dirname, '../reports/safe-fix-instructions.json');
    fs.writeFileSync(outputPath, JSON.stringify(instructions, null, 2));

    // 生成人类可读的Markdown版本
    this.generateMarkdownInstructions(instructions);

    console.log(`\n📄 详细修复指导已保存到:`);
    console.log(`  - JSON: ${outputPath}`);
    console.log(`  - Markdown: ${outputPath.replace('.json', '.md')}`);
  }

  /**
   * 生成详细步骤
   */
  generateDetailedSteps() {
    return {
      phase1_steps: [
        {
          step: 1,
          title: '创建API路由目录结构',
          commands: [
            'mkdir -p src/app/api/analytics/dashboard/[id]',
            'mkdir -p src/app/api/analytics/reports/[id]', 
            'mkdir -p src/app/api/analytics/insights/[id]'
          ],
          validation: '确认目录创建成功',
          rollback: '删除创建的目录'
        },
        {
          step: 2,
          title: '创建基础API路由文件',
          description: '手动创建每个route.ts文件，使用现有的模板',
          template_location: 'src/app/api/analytics/reports/route.ts',
          validation: '检查文件语法正确性',
          rollback: '删除创建的文件'
        }
      ],
      phase2_steps: [
        {
          step: 1,
          title: '实现AIInsightsPanel组件',
          description: '创建AI洞察展示组件',
          location: 'src/components/analytics/AIInsightsPanel.tsx',
          dependencies: ['UI组件库', 'TypeScript类型'],
          validation: '组件能正常渲染',
          rollback: '删除组件文件'
        }
      ]
    };
  }

  /**
   * 生成Markdown指导文档
   */
  generateMarkdownInstructions(instructions) {
    const markdown = `# 安全修复指导文档

**生成时间**: ${instructions.metadata.generated_at}  
**项目**: ${instructions.metadata.project}

## 📊 问题概览

- 🔴 关键问题: ${instructions.summary.critical_issues}个
- 🟡 重要问题: ${instructions.summary.important_issues}个  
- 🟢 一般问题: ${instructions.summary.minor_issues}个
- ⏱️ 预计修复时间: ${instructions.summary.total_estimated_time}

## ⚠️ 重要提醒

1. **不要使用自动化脚本批量修改**
2. **每次只修复一个问题**
3. **修复后立即测试验证**
4. **保持Git提交的原子性**
5. **遇到问题立即停止并寻求帮助**

## 🔴 Phase 1: 关键问题修复

${this.generatePhaseMarkdown(instructions.fix_plan.phase1)}

## 🟡 Phase 2: 重要功能实现

${this.generatePhaseMarkdown(instructions.fix_plan.phase2)}

## 🟢 Phase 3: 优化完善

${this.generatePhaseMarkdown(instructions.fix_plan.phase3)}

## 🧪 验证检查清单

- [ ] 项目能正常启动 (\`npm run dev\`)
- [ ] 无TypeScript编译错误
- [ ] 基础页面能正常访问
- [ ] API路由返回正确响应
- [ ] 数据库连接正常
- [ ] 多语言切换功能正常

## 🆘 遇到问题时

1. **立即停止修改**
2. **检查Git状态**: \`git status\`
3. **回滚到上一个工作状态**: \`git checkout -- .\`
4. **寻求帮助或重新规划**

---

**记住**: 稳定性比速度更重要！
`;

    const markdownPath = path.join(__dirname, '../reports/safe-fix-instructions.md');
    fs.writeFileSync(markdownPath, markdown);
  }

  /**
   * 生成阶段Markdown
   */
  generatePhaseMarkdown(phase) {
    return phase.map((task, index) => `
### ${index + 1}. ${task.title}

- **优先级**: ${task.priority}
- **预计时间**: ${task.estimated_time}
- **风险等级**: ${task.risk}
- **依赖**: ${task.dependencies.join(', ') || '无'}
- **验证方法**: ${task.validation}

`).join('');
  }

  /**
   * 工具函数
   */
  findRouteFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findRouteFiles(fullPath));
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  isMockImplementation(content) {
    return content.includes('mockReports') || 
           content.includes('mockInsights') || 
           content.includes('mockAnalysis') ||
           content.includes('// Mock data') ||
           content.includes('const mock');
  }

  analyzeSchemaContent(content) {
    const issues = [];
    
    // 检查重复表定义
    const tableMatches = content.match(/CREATE TABLE.*?yt_reports/g);
    if (tableMatches && tableMatches.length > 1) {
      issues.push('yt_reports表定义重复');
    }
    
    return issues;
  }
}

// 主函数
async function main() {
  const planner = new SafeFixPlanner();
  await planner.analyze();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SafeFixPlanner;