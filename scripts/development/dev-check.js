#!/usr/bin/env node

/**
 * 开发环境检查脚本
 * 确保所有必要的配置都正确设置
 */

const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

function checkEnvironment() {
  console.log('🔍 检查开发环境配置...');
  
  let issues = [];
  
  // 检查环境变量
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('缺失 NEXT_PUBLIC_SUPABASE_URL');
  } else {
    console.log('✅ Supabase URL 已配置');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('缺失 SUPABASE_SERVICE_ROLE_KEY');
  } else {
    console.log('✅ Supabase Service Key 已配置');
  }
  
  // 检查关键文件
  const criticalFiles = [
    'package.json',
    'next.config.ts',
    'src/app/layout.tsx',
    'src/app/[locale]/page.tsx'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} 存在`);
    } else {
      issues.push(`缺失关键文件: ${file}`);
    }
  });
  
  if (issues.length === 0) {
    console.log('\n🎉 开发环境配置完整！');
    console.log('你可以运行 npm run dev 启动项目');
    return true;
  } else {
    console.log('\n⚠️  发现以下问题:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }
}

module.exports = { checkEnvironment };

if (require.main === module) {
  checkEnvironment();
}