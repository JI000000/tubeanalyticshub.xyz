#!/usr/bin/env node

/**
 * 🔧 开发环境设置检查工具
 * 
 * 功能：
 * 1. 检查环境变量配置
 * 2. 验证关键文件存在
 * 3. 确保开发环境就绪
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 YouTube Analytics Platform - 开发环境检查');
console.log('================================================');

// 检查环境变量文件
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local文件不存在');
    console.log('📝 请创建.env.local文件并添加以下配置:');
    console.log('');
    console.log('# Supabase配置');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('');
    console.log('# YouTube Data API');
    console.log('YOUTUBE_API_KEY=your_youtube_api_key');
    console.log('');
    console.log('# OpenAI API (可选)');
    console.log('OPENAI_API_KEY=your_openai_api_key');
    return false;
  }
  
  console.log('✅ .env.local文件存在');
  
  // 检查必需的环境变量
  require('dotenv').config({ path: envPath });
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'YOUTUBE_API_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ 缺少必需的环境变量:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    return false;
  }
  
  console.log('✅ 所有必需的环境变量已配置');
  return true;
}

// 检查package.json
function checkPackageJson() {
  const packagePath = path.join(__dirname, '..', '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json文件不存在');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  console.log(`✅ 项目名称: ${packageJson.name}`);
  return true;
}

// 检查关键文件
function checkKeyFiles() {
  const keyFiles = [
    'src/app/layout.tsx',
    'src/components/layout/app-shell.tsx',
    'src/lib/database.ts',
    'src/lib/youtube-api.ts',
    'supabase/schema.sql',
    'scripts/i18n/i18n-toolkit.js'
  ];
  
  const missingFiles = keyFiles.filter(file => {
    const filePath = path.join(__dirname, '..', '..', file);
    return !fs.existsSync(filePath);
  });
  
  if (missingFiles.length > 0) {
    console.log('❌ 缺少关键文件:');
    missingFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    return false;
  }
  
  console.log('✅ 所有关键文件存在');
  return true;
}

// 检查脚本目录结构
function checkScriptStructure() {
  const scriptDirs = [
    'scripts/i18n',
    'scripts/database',
    'scripts/analytics',
    'scripts/utils'
  ];
  
  const missingDirs = scriptDirs.filter(dir => {
    const dirPath = path.join(__dirname, '..', '..', dir);
    return !fs.existsSync(dirPath);
  });
  
  if (missingDirs.length > 0) {
    console.log('❌ 缺少脚本目录:');
    missingDirs.forEach(dir => {
      console.log(`   - ${dir}`);
    });
    return false;
  }
  
  console.log('✅ 脚本目录结构完整');
  return true;
}

// 主检查函数
function runChecks() {
  console.log('🔍 开始环境检查...');
  console.log('');
  
  const checks = [
    { name: '环境变量配置', fn: checkEnvFile },
    { name: 'Package.json配置', fn: checkPackageJson },
    { name: '关键文件检查', fn: checkKeyFiles },
    { name: '脚本目录结构', fn: checkScriptStructure }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    console.log(`📋 检查: ${check.name}`);
    const passed = check.fn();
    if (!passed) {
      allPassed = false;
    }
    console.log('');
  }
  
  if (allPassed) {
    console.log('🎉 所有检查通过！');
    console.log('');
    console.log('🚀 可以开始开发了:');
    console.log('   npm run dev');
    console.log('');
    console.log('📚 如果是首次运行，请先初始化数据库:');
    console.log('   node scripts/database/init-database.js');
    console.log('');
    console.log('🌍 多语言工具包:');
    console.log('   node scripts/i18n-toolkit.js status');
  } else {
    console.log('❌ 部分检查未通过，请修复上述问题后重试');
    process.exit(1);
  }
}

// 执行检查
if (require.main === module) {
  runChecks();
}

module.exports = { runChecks };