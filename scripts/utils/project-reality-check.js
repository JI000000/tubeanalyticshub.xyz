#!/usr/bin/env node

/**
 * 🔍 项目现状真实性检查工具
 * 
 * 功能：
 * 1. 检查实际文件存在性
 * 2. 验证API路由是否实现
 * 3. 检查组件是否真实存在
 * 4. 评估多语言完成度
 * 5. 数据库表结构验证
 */

const fs = require('fs');
const path = require('path');

class ProjectRealityChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..', '..');
    this.results = {
      files: { exists: 0, missing: 0, details: [] },
      apis: { exists: 0, missing: 0, details: [] },
      components: { exists: 0, missing: 0, details: [] },
      i18n: { coverage: 0, issues: [], details: [] },
      database: { tables: 0, missing: 0, details: [] }
    };
  }

  checkCoreFiles() {
    console.log('🔍 检查核心文件存在性...');
    
    const coreFiles = [
      // API路由
      'src/app/api/analytics/dashboard/route.ts',
      'src/app/api/analytics/reports/route.ts', 
      'src/app/api/analytics/insights/route.ts',
      'src/app/api/analytics/competitor/route.ts',
      'src/app/api/analytics/trends/route.ts',
      
      // 核心页面
      'src/app/[locale]/dashboard/page.tsx',
      'src/app/[locale]/reports/page.tsx',
      'src/app/[locale]/insights/page.tsx',
      
      // 业务组件
      'src/components/business/analytics-dashboard.tsx',
      'src/components/business/report-generator.tsx',
      'src/components/business/ai-insights-panel.tsx',
      'src/components/business/competitor-analysis.tsx',
      'src/components/business/trend-prediction.tsx',
      
      // 核心库文件
      'src/lib/youtube-api.ts',
      'src/lib/database.ts',
      'src/lib/ai-analysis.ts',
      'src/lib/smart-scraper.ts',
      
      // 数据库文件
      'supabase/schema.sql',
      'supabase/migrations/20250722141818_create_youtube_scraper_tables.sql'
    ];

    coreFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      const exists = fs.existsSync(filePath);
      
      if (exists) {
        this.results.files.exists++;
        this.results.files.details.push({ file, status: '✅ 存在' });
      } else {
        this.results.files.missing++;
        this.results.files.details.push({ file, status: '❌ 缺失' });
      }
    });
  }

  checkAPIImplementation() {
    console.log('🔍 检查API实现完整性...');
    
    const apiRoutes = [
      'src/app/api/analytics/dashboard/route.ts',
      'src/app/api/analytics/reports/route.ts',
      'src/app/api/analytics/insights/route.ts',
      'src/app/api/analytics/competitor/route.ts'
    ];

    apiRoutes.forEach(route => {
      const routePath = path.join(this.projectRoot, route);
      
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf8');
        
        // 检查是否有实际实现
        const hasGET = content.includes('export async function GET');
        const hasPOST = content.includes('export async function POST');
        const hasPUT = content.includes('export async function PUT');
        const hasDELETE = content.includes('export async function DELETE');
        
        const methods = [];
        if (hasGET) methods.push('GET');
        if (hasPOST) methods.push('POST');
        if (hasPUT) methods.push('PUT');
        if (hasDELETE) methods.push('DELETE');
        
        if (methods.length > 0) {
          this.results.apis.exists++;
          this.results.apis.details.push({
            route: route.replace('src/app/api/', '').replace('/route.ts', ''),
            status: '✅ 已实现',
            methods: methods.join(', ')
          });
        } else {
          this.results.apis.missing++;
          this.results.apis.details.push({
            route: route.replace('src/app/api/', '').replace('/route.ts', ''),
            status: '❌ 空实现',
            methods: '无'
          });
        }
      } else {
        this.results.apis.missing++;
        this.results.apis.details.push({
          route: route.replace('src/app/api/', '').replace('/route.ts', ''),
          status: '❌ 文件不存在',
          methods: '无'
        });
      }
    });
  }

  checkComponents() {
    console.log('🔍 检查业务组件实现...');
    
    const components = [
      'src/components/business/analytics-dashboard.tsx',
      'src/components/business/report-generator.tsx',
      'src/components/business/ai-insights-panel.tsx',
      'src/components/business/competitor-analysis.tsx',
      'src/components/business/trend-prediction.tsx',
      'src/components/business/data-visualization.tsx',
      'src/components/business/url-input.tsx'
    ];

    components.forEach(component => {
      const componentPath = path.join(this.projectRoot, component);
      
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // 检查是否是真实组件实现
        const hasExport = content.includes('export default') || content.includes('export const') || content.includes('export function');
        const hasJSX = content.includes('return (') || content.includes('return <');
        const hasProps = content.includes('interface') || content.includes('type') || content.includes('Props');
        
        if (hasExport && hasJSX) {
          this.results.components.exists++;
          this.results.components.details.push({
            component: path.basename(component, '.tsx'),
            status: '✅ 已实现',
            hasProps: hasProps ? '有Props' : '无Props'
          });
        } else {
          this.results.components.missing++;
          this.results.components.details.push({
            component: path.basename(component, '.tsx'),
            status: '❌ 空实现',
            hasProps: '无'
          });
        }
      } else {
        this.results.components.missing++;
        this.results.components.details.push({
          component: path.basename(component, '.tsx'),
          status: '❌ 文件不存在',
          hasProps: '无'
        });
      }
    });
  }

  checkI18nStatus() {
    console.log('🔍 检查多语言实现状态...');
    
    const i18nPath = path.join(this.projectRoot, 'src/i18n/messages');
    const languages = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES'];
    
    let totalKeys = 0;
    let translatedKeys = 0;
    
    languages.forEach(lang => {
      const langPath = path.join(i18nPath, `${lang}.json`);
      
      if (fs.existsSync(langPath)) {
        try {
          const content = JSON.parse(fs.readFileSync(langPath, 'utf8'));
          const keyCount = this.countKeys(content);
          
          if (lang === 'zh-CN') {
            totalKeys = keyCount; // 以中文为基准
          }
          
          translatedKeys += keyCount;
          
          this.results.i18n.details.push({
            language: lang,
            status: '✅ 存在',
            keys: keyCount
          });
        } catch (error) {
          this.results.i18n.details.push({
            language: lang,
            status: '❌ JSON格式错误',
            keys: 0
          });
        }
      } else {
        this.results.i18n.details.push({
          language: lang,
          status: '❌ 文件不存在',
          keys: 0
        });
      }
    });
    
    this.results.i18n.coverage = totalKeys > 0 ? Math.round((translatedKeys / (totalKeys * languages.length)) * 100) : 0;
  }

  countKeys(obj, prefix = '') {
    let count = 0;
    
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += this.countKeys(obj[key], prefix + key + '.');
      } else {
        count++;
      }
    }
    
    return count;
  }

  checkDatabaseSchema() {
    console.log('🔍 检查数据库Schema...');
    
    const schemaPath = path.join(this.projectRoot, 'supabase/schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      
      const expectedTables = [
        'yt_users',
        'yt_channels', 
        'yt_videos',
        'yt_comments',
        'yt_analytics',
        'yt_reports',
        'yt_insights',
        'yt_teams',
        'yt_team_members'
      ];
      
      expectedTables.forEach(table => {
        if (content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
          this.results.database.tables++;
          this.results.database.details.push({
            table,
            status: '✅ 已定义'
          });
        } else {
          this.results.database.missing++;
          this.results.database.details.push({
            table,
            status: '❌ 缺失'
          });
        }
      });
    } else {
      this.results.database.details.push({
        table: 'schema.sql',
        status: '❌ Schema文件不存在'
      });
    }
  }

  generateReport() {
    console.log('\\n📋 项目现状真实性检查报告');
    console.log('============================');
    
    // 文件存在性报告
    console.log(`\\n📁 核心文件检查: ${this.results.files.exists}/${this.results.files.exists + this.results.files.missing} 存在`);
    const fileCompleteness = Math.round((this.results.files.exists / (this.results.files.exists + this.results.files.missing)) * 100);
    console.log(`   完整度: ${fileCompleteness}%`);
    
    if (this.results.files.missing > 0) {
      console.log('   ❌ 缺失文件:');
      this.results.files.details
        .filter(f => f.status.includes('❌'))
        .forEach(f => console.log(`      - ${f.file}`));
    }
    
    // API实现报告
    console.log(`\\n🔌 API实现检查: ${this.results.apis.exists}/${this.results.apis.exists + this.results.apis.missing} 已实现`);
    const apiCompleteness = this.results.apis.exists + this.results.apis.missing > 0 ? 
      Math.round((this.results.apis.exists / (this.results.apis.exists + this.results.apis.missing)) * 100) : 0;
    console.log(`   完整度: ${apiCompleteness}%`);
    
    this.results.apis.details.forEach(api => {
      console.log(`   ${api.status} ${api.route} (${api.methods})`);
    });
    
    // 组件实现报告
    console.log(`\\n🧩 组件实现检查: ${this.results.components.exists}/${this.results.components.exists + this.results.components.missing} 已实现`);
    const componentCompleteness = this.results.components.exists + this.results.components.missing > 0 ?
      Math.round((this.results.components.exists / (this.results.components.exists + this.results.components.missing)) * 100) : 0;
    console.log(`   完整度: ${componentCompleteness}%`);
    
    // 显示组件详情
    this.results.components.details.forEach(detail => {
      console.log(`   ${detail.status} ${detail.component} (${detail.hasProps})`);
    });
    
    // 多语言报告
    console.log(`\\n🌍 多语言支持: ${this.results.i18n.coverage}% 覆盖率`);
    this.results.i18n.details.forEach(lang => {
      console.log(`   ${lang.status} ${lang.language} (${lang.keys} keys)`);
    });
    
    // 数据库报告
    console.log(`\\n🗄️ 数据库Schema: ${this.results.database.tables}/${this.results.database.tables + this.results.database.missing} 表已定义`);
    const dbCompleteness = this.results.database.tables + this.results.database.missing > 0 ?
      Math.round((this.results.database.tables / (this.results.database.tables + this.results.database.missing)) * 100) : 0;
    console.log(`   完整度: ${dbCompleteness}%`);
    
    // 总体评估
    const overallScore = Math.round((fileCompleteness + apiCompleteness + componentCompleteness + this.results.i18n.coverage + dbCompleteness) / 5);
    
    console.log(`\\n🎯 总体完成度: ${overallScore}%`);
    
    if (overallScore >= 80) {
      console.log('✅ 项目状态: 良好，可以进入测试阶段');
    } else if (overallScore >= 60) {
      console.log('⚠️ 项目状态: 基本可用，需要完善关键功能');
    } else {
      console.log('❌ 项目状态: 需要大量开发工作');
    }
    
    // 建议
    console.log('\\n💡 改进建议:');
    if (this.results.files.missing > 0) {
      console.log('1. 创建缺失的核心文件');
    }
    if (apiCompleteness < 80) {
      console.log('2. 完善API路由实现');
    }
    if (componentCompleteness < 80) {
      console.log('3. 实现缺失的业务组件');
    }
    if (this.results.i18n.coverage < 80) {
      console.log('4. 完善多语言翻译');
    }
    if (dbCompleteness < 100) {
      console.log('5. 完善数据库表结构');
    }
    
    return overallScore;
  }

  run() {
    console.log('🚀 开始项目现状真实性检查...\\n');
    
    this.checkCoreFiles();
    this.checkAPIImplementation();
    this.checkComponents();
    this.checkI18nStatus();
    this.checkDatabaseSchema();
    
    const score = this.generateReport();
    
    console.log('\\n📖 详细报告已生成，请根据建议进行改进。');
    
    return score;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new ProjectRealityChecker();
  const score = checker.run();
  
  if (score < 60) {
    process.exit(1);
  }
}

module.exports = ProjectRealityChecker;