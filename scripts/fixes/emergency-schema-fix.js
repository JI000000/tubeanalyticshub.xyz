#!/usr/bin/env node

/**
 * 紧急数据库Schema修复脚本
 * 
 * 目标：安全修复数据库Schema中的重复表定义问题
 * 
 * 设计原则：
 * 1. 只修复明确识别的重复定义问题
 * 2. 创建备份，支持回滚
 * 3. 详细记录修复过程
 * 4. 验证修复结果
 * 
 * 创建时间：2025-07-31T03:20:00Z
 */

const fs = require('fs');
const path = require('path');

class EmergencySchemaFixer {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.schemaFile = path.join(this.projectRoot, 'supabase/schema.sql');
    this.backupFile = path.join(this.projectRoot, 'supabase/schema.sql.backup-' + Date.now());
    this.timestamp = new Date().toISOString();
    
    this.fixLog = {
      timestamp: this.timestamp,
      operation: 'emergency_schema_fix',
      status: 'started',
      issues_found: [],
      fixes_applied: [],
      backup_created: false,
      verification_passed: false
    };
  }

  /**
   * 主修复函数
   */
  async fix() {
    console.log('🚨 紧急数据库Schema修复');
    console.log('=' .repeat(50));
    console.log(`⏰ 开始时间: ${this.timestamp}`);
    console.log('🎯 目标: 修复重复表定义问题\n');

    try {
      // 1. 检查文件存在
      await this.checkFileExists();
      
      // 2. 创建备份
      await this.createBackup();
      
      // 3. 分析问题
      await this.analyzeIssues();
      
      // 4. 应用修复
      await this.applyFixes();
      
      // 5. 验证修复
      await this.verifyFixes();
      
      // 6. 保存修复日志
      await this.saveFixLog();
      
      console.log('\n✅ 紧急修复完成');
      console.log(`📋 修复了 ${this.fixLog.fixes_applied.length} 个问题`);
      console.log(`💾 备份文件: ${this.backupFile}`);
      
    } catch (error) {
      console.error('\n❌ 修复过程中发生错误:', error.message);
      await this.rollback();
      throw error;
    }
  }

  /**
   * 检查文件存在
   */
  async checkFileExists() {
    console.log('📁 检查Schema文件...');
    
    if (!fs.existsSync(this.schemaFile)) {
      throw new Error(`Schema文件不存在: ${this.schemaFile}`);
    }
    
    console.log('  ✅ Schema文件存在');
  }

  /**
   * 创建备份
   */
  async createBackup() {
    console.log('💾 创建备份文件...');
    
    try {
      const content = fs.readFileSync(this.schemaFile, 'utf8');
      fs.writeFileSync(this.backupFile, content);
      
      this.fixLog.backup_created = true;
      console.log(`  ✅ 备份已创建: ${path.basename(this.backupFile)}`);
      
    } catch (error) {
      throw new Error(`创建备份失败: ${error.message}`);
    }
  }

  /**
   * 分析问题
   */
  async analyzeIssues() {
    console.log('🔍 分析Schema问题...');
    
    const content = fs.readFileSync(this.schemaFile, 'utf8');
    const lines = content.split('\n');
    
    // 查找重复的表定义
    const tableDefinitions = {};
    const duplicates = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/CREATE TABLE.*?(yt_\w+)/);
      
      if (match) {
        const tableName = match[1];
        
        if (tableDefinitions[tableName]) {
          duplicates.push({
            table: tableName,
            firstLine: tableDefinitions[tableName],
            duplicateLine: i + 1,
            type: 'duplicate_table_definition'
          });
        } else {
          tableDefinitions[tableName] = i + 1;
        }
      }
    }
    
    this.fixLog.issues_found = duplicates;
    
    console.log(`  📊 发现 ${duplicates.length} 个重复表定义:`);
    for (const dup of duplicates) {
      console.log(`    - ${dup.table} (行 ${dup.firstLine} 和 ${dup.duplicateLine})`);
    }
  }

  /**
   * 应用修复
   */
  async applyFixes() {
    console.log('🔧 应用修复...');
    
    if (this.fixLog.issues_found.length === 0) {
      console.log('  ℹ️  没有发现需要修复的问题');
      return;
    }
    
    let content = fs.readFileSync(this.schemaFile, 'utf8');
    const lines = content.split('\n');
    
    // 定义修复策略
    const fixStrategies = {
      'yt_reports': 'keep_second', // 保留第二个定义（扩展版）
      'yt_teams': 'keep_first',    // 保留第一个定义
      'yt_team_members': 'keep_first' // 保留第一个定义
    };
    
    const linesToRemove = new Set();
    
    for (const issue of this.fixLog.issues_found) {
      const strategy = fixStrategies[issue.table];
      
      if (strategy === 'keep_second') {
        // 删除第一个定义
        const startLine = this.findTableDefinitionStart(lines, issue.firstLine - 1);
        const endLine = this.findTableDefinitionEnd(lines, startLine);
        
        for (let i = startLine; i <= endLine; i++) {
          linesToRemove.add(i);
        }
        
        this.fixLog.fixes_applied.push({
          table: issue.table,
          action: 'removed_first_definition',
          lines_removed: `${startLine + 1}-${endLine + 1}`
        });
        
      } else if (strategy === 'keep_first') {
        // 删除第二个定义
        const startLine = this.findTableDefinitionStart(lines, issue.duplicateLine - 1);
        const endLine = this.findTableDefinitionEnd(lines, startLine);
        
        for (let i = startLine; i <= endLine; i++) {
          linesToRemove.add(i);
        }
        
        this.fixLog.fixes_applied.push({
          table: issue.table,
          action: 'removed_second_definition',
          lines_removed: `${startLine + 1}-${endLine + 1}`
        });
      }
    }
    
    // 应用删除
    const fixedLines = lines.filter((line, index) => !linesToRemove.has(index));
    const fixedContent = fixedLines.join('\n');
    
    // 写入修复后的内容
    fs.writeFileSync(this.schemaFile, fixedContent);
    
    console.log(`  ✅ 应用了 ${this.fixLog.fixes_applied.length} 个修复`);
    for (const fix of this.fixLog.fixes_applied) {
      console.log(`    - ${fix.table}: ${fix.action} (行 ${fix.lines_removed})`);
    }
  }

  /**
   * 验证修复
   */
  async verifyFixes() {
    console.log('🧪 验证修复结果...');
    
    const content = fs.readFileSync(this.schemaFile, 'utf8');
    const lines = content.split('\n');
    
    // 重新检查重复定义
    const tableDefinitions = {};
    const remainingDuplicates = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/CREATE TABLE.*?(yt_\w+)/);
      
      if (match) {
        const tableName = match[1];
        
        if (tableDefinitions[tableName]) {
          remainingDuplicates.push(tableName);
        } else {
          tableDefinitions[tableName] = i + 1;
        }
      }
    }
    
    if (remainingDuplicates.length === 0) {
      this.fixLog.verification_passed = true;
      console.log('  ✅ 验证通过：没有发现重复表定义');
    } else {
      throw new Error(`验证失败：仍有重复表定义 ${remainingDuplicates.join(', ')}`);
    }
    
    // 检查语法基础正确性
    const syntaxIssues = this.checkBasicSyntax(content);
    if (syntaxIssues.length > 0) {
      console.log('  ⚠️  发现语法警告:');
      for (const issue of syntaxIssues) {
        console.log(`    - ${issue}`);
      }
    } else {
      console.log('  ✅ 基础语法检查通过');
    }
  }

  /**
   * 保存修复日志
   */
  async saveFixLog() {
    this.fixLog.status = 'completed';
    this.fixLog.completed_at = new Date().toISOString();
    
    const logDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `schema-fix-${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(this.fixLog, null, 2));
    
    console.log(`📋 修复日志已保存: ${path.basename(logFile)}`);
  }

  /**
   * 回滚修复
   */
  async rollback() {
    console.log('🔄 回滚修复...');
    
    if (this.fixLog.backup_created && fs.existsSync(this.backupFile)) {
      const backupContent = fs.readFileSync(this.backupFile, 'utf8');
      fs.writeFileSync(this.schemaFile, backupContent);
      
      console.log('  ✅ 已回滚到备份版本');
    } else {
      console.log('  ⚠️  无法回滚：备份文件不存在');
    }
    
    this.fixLog.status = 'rolled_back';
    await this.saveFixLog();
  }

  /**
   * 工具函数：查找表定义开始行
   */
  findTableDefinitionStart(lines, startIndex) {
    // 向上查找，找到CREATE TABLE语句的开始
    for (let i = startIndex; i >= 0; i--) {
      if (lines[i].trim().startsWith('CREATE TABLE')) {
        return i;
      }
    }
    return startIndex;
  }

  /**
   * 工具函数：查找表定义结束行
   */
  findTableDefinitionEnd(lines, startIndex) {
    // 向下查找，找到表定义的结束（分号）
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.endsWith(');') || line === ');') {
        return i;
      }
    }
    return startIndex;
  }

  /**
   * 基础语法检查
   */
  checkBasicSyntax(content) {
    const issues = [];
    
    // 检查括号匹配
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      issues.push(`括号不匹配: ${openParens} 个 '(' vs ${closeParens} 个 ')'`);
    }
    
    // 检查基本SQL关键字
    if (!content.includes('CREATE TABLE')) {
      issues.push('缺少CREATE TABLE语句');
    }
    
    return issues;
  }
}

// 主函数
async function main() {
  const fixer = new EmergencySchemaFixer();
  
  try {
    await fixer.fix();
    console.log('\n🎉 紧急修复成功完成！');
    console.log('📝 建议接下来：');
    console.log('  1. 运行 npm run dev 验证项目启动');
    console.log('  2. 检查数据库连接是否正常');
    console.log('  3. 运行深度检视器验证修复效果');
    
  } catch (error) {
    console.error('\n💥 紧急修复失败');
    console.error('🔍 错误详情:', error.message);
    console.error('📞 建议：');
    console.error('  1. 检查备份文件是否存在');
    console.error('  2. 手动恢复备份文件');
    console.error('  3. 寻求技术支持');
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EmergencySchemaFixer;