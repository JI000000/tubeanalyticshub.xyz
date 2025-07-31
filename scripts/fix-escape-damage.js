#!/usr/bin/env node

/**
 * 🔧 修复转义字符损坏脚本
 * 
 * 目标：修复批量替换造成的损坏
 * 1. 恢复import语句中的单引号
 * 2. 恢复字符串中的单引号
 * 3. 只在JSX文本中保留转义字符
 */

const fs = require('fs');
const path = require('path');

class EscapeDamageFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalFixes = 0;
  }

  /**
   * 主执行函数
   */
  async run() {
    console.log('🔧 修复转义字符损坏...\n');
    
    const srcDir = path.join(__dirname, '../src');
    await this.fixDirectory(srcDir);
    
    console.log(`\n✅ 修复完成！`);
    console.log(`📁 修复文件数: ${this.fixedFiles}`);
    console.log(`🔧 总修复数: ${this.totalFixes}`);
  }

  /**
   * 递归修复目录
   */
  async fixDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await this.fixDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        await this.fixFile(fullPath);
      }
    }
  }

  /**
   * 修复单个文件
   */
  async fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 1. 修复import语句中的&apos;
    content = content.replace(/import\s*{[^}]*}\s*from\s*&apos;([^&]*)&apos;/g, "import { $1 } from '$2'");
    content = content.replace(/import\s+(\w+)\s+from\s*&apos;([^&]*)&apos;/g, "import $1 from '$2'");
    content = content.replace(/from\s*&apos;([^&]*)&apos;/g, "from '$1'");
    
    // 2. 修复字符串字面量中的&apos;
    content = content.replace(/&apos;([^&<>]*)&apos;/g, "'$1'");
    
    // 3. 修复模板字符串
    content = content.replace(/`([^`]*?)&apos;([^`]*?)`/g, "`$1'$2`");
    
    // 4. 修复对象属性
    content = content.replace(/(\w+):\s*&apos;([^&]*)&apos;/g, "$1: '$2'");
    
    // 5. 修复函数调用参数
    content = content.replace(/\(\s*&apos;([^&]*)&apos;\s*\)/g, "('$1')");
    
    // 6. 修复赋值语句
    content = content.replace(/=\s*&apos;([^&]*)&apos;/g, "= '$1'");
    
    // 7. 修复数组元素
    content = content.replace(/\[\s*&apos;([^&]*)&apos;\s*\]/g, "['$1']");
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      this.fixedFiles++;
      
      const fixes = (originalContent.match(/&apos;/g) || []).length - (content.match(/&apos;/g) || []).length;
      this.totalFixes += fixes;
      
      console.log(`✅ ${path.relative(process.cwd(), filePath)} - 修复了 ${fixes} 个问题`);
    }
  }
}

// 命令行接口
function main() {
  const fixer = new EscapeDamageFixer();
  fixer.run();
}

if (require.main === module) {
  main();
}

module.exports = EscapeDamageFixer;