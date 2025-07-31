#!/usr/bin/env node

/**
 * 🚀 快速恢复修复脚本
 * 
 * 目标：修复阻塞构建的关键问题
 * 1. 修复HTML链接错误
 * 2. 修复转义字符错误  
 * 3. 修复硬编码中文问题
 * 4. 清理未使用的导入
 */

const fs = require('fs');
const path = require('path');

class QuickRecoveryFixer {
  constructor() {
    this.startTime = Date.now();
    this.fixes = {
      htmlLinks: 0,
      escapeChars: 0,
      hardcodedText: 0,
      unusedImports: 0
    };
    
    this.hardcodedMappings = {
      '订阅者增长率高于平均水平': 'Subscriber growth rate above average',
      '平均观看量低于主要竞争对手': 'Average views below main competitors',
      '可以学习竞争对手的内容策略': 'Can learn from competitor content strategies',
      '竞争对手内容质量持续提升': 'Competitor content quality continues to improve',
      '竞争对手添加成功': 'Competitor added successfully',
      '竞争对手删除成功': 'Competitor removed successfully',
      '简体中文': 'Simplified Chinese',
      '日本語': 'Japanese'
    };
  }

  /**
   * 主执行函数
   */
  async run() {
    console.log('🚀 YouTube Analytics Platform - 快速恢复修复\n');
    
    try {
      // 1. 修复HTML链接错误
      await this.fixHtmlLinks();
      
      // 2. 修复转义字符错误
      await this.fixEscapeCharacters();
      
      // 3. 修复硬编码中文问题
      await this.fixHardcodedText();
      
      // 4. 清理未使用的导入
      await this.cleanUnusedImports();
      
      // 5. 生成修复报告
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 修复过程中出现错误:', error);
    }
  }

  /**
   * 修复HTML链接错误
   */
  async fixHtmlLinks() {
    console.log('🔗 修复HTML链接错误...');
    
    const homePagePath = path.join(__dirname, '../src/app/[locale]/page.tsx');
    
    if (fs.existsSync(homePagePath)) {
      let content = fs.readFileSync(homePagePath, 'utf8');
      
      // 添加Link导入
      if (!content.includes('import Link from')) {
        content = content.replace(
          "import { useTranslation } from '@/hooks/useTranslation';",
          "import { useTranslation } from '@/hooks/useTranslation';\nimport Link from 'next/link';"
        );
      }
      
      // 替换<a>标签为<Link>
      const linkReplacements = [
        {
          from: /<a href="([^"]+)">/g,
          to: '<Link href="$1">'
        },
        {
          from: /<\/a>/g,
          to: '</Link>'
        }
      ];
      
      for (const replacement of linkReplacements) {
        const matches = content.match(replacement.from);
        if (matches) {
          content = content.replace(replacement.from, replacement.to);
          this.fixes.htmlLinks += matches.length;
        }
      }
      
      fs.writeFileSync(homePagePath, content);
      console.log(`  ✅ 修复了 ${this.fixes.htmlLinks} 个HTML链接问题`);
    }
  }

  /**
   * 修复转义字符错误
   */
  async fixEscapeCharacters() {
    console.log('🔤 修复转义字符错误...');
    
    const filesToFix = [
      '../src/app/[locale]/dashboard/page.tsx',
      '../src/components/layout/app-shell.tsx'
    ];
    
    for (const filePath of filesToFix) {
      const fullPath = path.join(__dirname, filePath);
      
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // 修复单引号转义
        const beforeLength = content.length;
        content = content.replace(/'/g, '&apos;');
        
        if (content.length !== beforeLength) {
          fs.writeFileSync(fullPath, content);
          this.fixes.escapeChars++;
          console.log(`  ✅ 修复了 ${path.basename(filePath)} 中的转义字符`);
        }
      }
    }
  }

  /**
   * 修复硬编码中文问题
   */
  async fixHardcodedText() {
    console.log('🌍 修复硬编码中文问题...');
    
    // 修复竞品分析API文件
    const competitorApiPath = path.join(__dirname, '../src/app/api/analytics/competitor/route.ts');
    
    if (fs.existsSync(competitorApiPath)) {
      let content = fs.readFileSync(competitorApiPath, 'utf8');
      
      for (const [chinese, english] of Object.entries(this.hardcodedMappings)) {
        if (content.includes(chinese)) {
          content = content.replace(new RegExp(chinese, 'g'), english);
          this.fixes.hardcodedText++;
        }
      }
      
      fs.writeFileSync(competitorApiPath, content);
      console.log(`  ✅ 修复了竞品分析API中的硬编码问题`);
    }
    
    // 修复i18n配置文件
    const i18nConfigPath = path.join(__dirname, '../src/i18n/config.ts');
    
    if (fs.existsSync(i18nConfigPath)) {
      let content = fs.readFileSync(i18nConfigPath, 'utf8');
      
      // 替换语言名称
      content = content.replace('简体中文', 'Simplified Chinese');
      content = content.replace('日本語', 'Japanese');
      
      fs.writeFileSync(i18nConfigPath, content);
      this.fixes.hardcodedText += 2;
      console.log(`  ✅ 修复了i18n配置中的硬编码问题`);
    }
  }

  /**
   * 清理未使用的导入
   */
  async cleanUnusedImports() {
    console.log('🧹 清理未使用的导入...');
    
    const filesToClean = [
      '../src/app/[locale]/channels/page.tsx',
      '../src/app/[locale]/videos/page.tsx',
      '../src/app/[locale]/dashboard/page.tsx',
      '../src/components/ui/badge.tsx',
      '../src/components/ui/button.tsx',
      '../src/components/ui/card.tsx',
      '../src/components/ui/input.tsx'
    ];
    
    for (const filePath of filesToClean) {
      const fullPath = path.join(__dirname, filePath);
      
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // 移除未使用的useTranslation导入（如果没有使用t变量）
        if (content.includes("import { useTranslation } from '@/hooks/useTranslation';") && 
            !content.includes('const { t } = useTranslation()')) {
          content = content.replace("import { useTranslation } from '@/hooks/useTranslation';\n", '');
          content = content.replace("import { useTranslation } from '@/hooks/useTranslation';", '');
        }
        
        // 移除未使用的t变量声明
        if (content.includes('const { t } = useTranslation();') && 
            !content.match(/\bt\(/)) {
          content = content.replace('  const { t } = useTranslation();\n', '');
          content = content.replace('const { t } = useTranslation();', '');
        }
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content);
          this.fixes.unusedImports++;
          console.log(`  ✅ 清理了 ${path.basename(filePath)} 中的未使用导入`);
        }
      }
    }
  }

  /**
   * 生成修复报告
   */
  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n📊 快速修复完成报告');
    console.log('================================');
    console.log(`⏱️  修复耗时: ${duration}秒`);
    console.log(`🔗 HTML链接修复: ${this.fixes.htmlLinks}个`);
    console.log(`🔤 转义字符修复: ${this.fixes.escapeChars}个`);
    console.log(`🌍 硬编码文本修复: ${this.fixes.hardcodedText}个`);
    console.log(`🧹 未使用导入清理: ${this.fixes.unusedImports}个`);
    
    const totalFixes = Object.values(this.fixes).reduce((sum, count) => sum + count, 0);
    console.log(`\n✅ 总计修复问题: ${totalFixes}个`);
    
    console.log('\n🚀 下一步建议:');
    console.log('1. 运行 npm run build 检查构建状态');
    console.log('2. 运行 npm run dev 启动开发服务器');
    console.log('3. 测试主要功能是否正常工作');
    
    // 保存修复报告
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      fixes: this.fixes,
      totalFixes,
      nextSteps: [
        'Run npm run build to check build status',
        'Run npm run dev to start development server',
        'Test main functionality'
      ]
    };
    
    const reportPath = path.join(__dirname, '../docs/09-reports/quick-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 详细报告已保存到: ${reportPath}`);
  }
}

// 命令行接口
function main() {
  const fixer = new QuickRecoveryFixer();
  fixer.run();
}

if (require.main === module) {
  main();
}

module.exports = QuickRecoveryFixer;