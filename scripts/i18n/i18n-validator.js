#!/usr/bin/env node

/**
 * 🔍 I18N 验证器 - 检查硬编码问题和翻译完整性
 */

const fs = require('fs');
const path = require('path');

// 需要检查的文件模式
const checkPatterns = [
  'src/components/**/*.{tsx,ts}',
  'src/app/**/*.{tsx,ts}',
  'src/hooks/**/*.{tsx,ts}'
];

// 排除的文件
const excludePatterns = [
  'src/i18n/**',
  'src/lib/ai-analysis.ts',
  'src/lib/ai-translation.ts'
];

// 中文字符正则
const chineseRegex = /[\u4e00-\u9fff]/g;

function findFilesRecursively(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function shouldExcludeFile(filePath) {
  return excludePatterns.some(pattern => {
    if (pattern.includes('**')) {
      const regex = new RegExp(pattern.replace('**', '.*').replace('/', '\\/'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function checkFileForChineseText(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    // 跳过注释行
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
      return;
    }
    
    // 跳过import语句
    if (line.trim().startsWith('import')) {
      return;
    }
    
    const matches = line.match(chineseRegex);
    if (matches) {
      issues.push({
        line: index + 1,
        content: line.trim(),
        chineseText: matches.join('')
      });
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 检查国际化修复情况...\n');
  
  const srcDir = path.join(__dirname, '../../src');
  const files = findFilesRecursively(srcDir, ['.tsx', '.ts']);
  
  let totalIssues = 0;
  let checkedFiles = 0;
  
  for (const file of files) {
    if (shouldExcludeFile(file)) {
      continue;
    }
    
    checkedFiles++;
    const issues = checkFileForChineseText(file);
    
    if (issues.length > 0) {
      console.log(`❌ ${path.relative(srcDir, file)}`);
      issues.forEach(issue => {
        console.log(`   第${issue.line}行: ${issue.content}`);
        console.log(`   中文内容: "${issue.chineseText}"`);
      });
      console.log();
      totalIssues += issues.length;
    }
  }
  
  console.log(`\n📊 检查结果:`);
  console.log(`- 检查文件数: ${checkedFiles}`);
  console.log(`- 发现问题数: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('✅ 恭喜！没有发现硬编码中文问题');
  } else {
    console.log('⚠️  仍有硬编码中文需要修复');
  }
  
  // 检查翻译文件完整性
  console.log('\n🌍 检查翻译文件完整性...');
  
  const i18nDir = path.join(__dirname, '../../src/i18n/messages/core');
  const languages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
  
  for (const lang of languages) {
    const filePath = path.join(i18nDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const keyCount = Object.keys(flattenObject(content)).length;
        console.log(`✅ ${lang}: ${keyCount} 个翻译键`);
      } catch (error) {
        console.log(`❌ ${lang}: JSON解析错误`);
      }
    } else {
      console.log(`❌ ${lang}: 文件不存在`);
    }
  }
}

function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flattened, flattenObject(obj[key], newKey));
    } else {
      flattened[newKey] = obj[key];
    }
  }
  
  return flattened;
}

if (require.main === module) {
  main();
}

module.exports = { checkFileForChineseText, shouldExcludeFile };