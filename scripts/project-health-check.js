#!/usr/bin/env node

/**
 * YouTube Analytics Platform - 项目健康检查脚本
 * 检查项目当前状态，识别问题并提供修复建议
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 YouTube Analytics Platform - 项目健康检查');
console.log('=' .repeat(60));

// 检查项目基础文件
function checkProjectStructure() {
  console.log('\n📁 项目结构检查:');
  
  const criticalFiles = [
    'package.json',
    'next.config.ts',
    'tailwind.config.ts',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    '.env.local'
  ];
  
  const criticalDirs = [
    'src/app/api',
    'src/components',
    'src/lib',
    'src/app/(dashboard)'
  ];
  
  let issues = [];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - 缺失`);
      issues.push(`缺失关键文件: ${file}`);
    }
  });
  
  criticalDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`  ✅ ${dir}/`);
    } else {
      console.log(`  ❌ ${dir}/ - 缺失`);
      issues.push(`缺失关键目录: ${dir}`);
    }
  });
  
  return issues;
}

// 检查API路由
function checkAPIRoutes() {
  console.log('\n🔌 API路由检查:');
  
  const apiRoutes = [
    'src/app/api/videos/route.ts',
    'src/app/api/channels/route.ts', 
    'src/app/api/dashboard/route.ts',
    'src/app/api/comments/route.ts'
  ];
  
  let issues = [];
  
  apiRoutes.forEach(route => {
    if (fs.existsSync(route)) {
      console.log(`  ✅ ${route}`);
      
      // 检查API文件内容
      const content = fs.readFileSync(route, 'utf8');
      if (content.includes('export async function GET')) {
        console.log(`    ✅ GET方法已实现`);
      } else {
        console.log(`    ⚠️  GET方法未实现`);
        issues.push(`${route} 缺少GET方法`);
      }
      
      if (content.includes('export async function POST')) {
        console.log(`    ✅ POST方法已实现`);
      } else {
        console.log(`    ⚠️  POST方法未实现`);
      }
    } else {
      console.log(`  ❌ ${route} - 缺失`);
      issues.push(`缺失API路由: ${route}`);
    }
  });
  
  return issues;
}

// 检查多语言配置
function checkInternationalization() {
  console.log('\n🌍 多语言配置检查:');
  
  let issues = [];
  
  // 检查配置文件
  if (fs.existsSync('src/i18n/request.ts')) {
    console.log('  ✅ i18n配置文件存在');
  } else {
    console.log('  ❌ i18n配置文件缺失');
    issues.push('缺失i18n配置文件');
  }
  
  // 检查翻译文件
  const locales = ['en', 'zh-CN', 'ja', 'ko'];
  locales.forEach(locale => {
    const translationFile = `src/messages/${locale}.json`;
    if (fs.existsSync(translationFile)) {
      console.log(`  ✅ ${locale} 翻译文件存在`);
      
      // 检查翻译文件内容
      try {
        const translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));
        const keyCount = Object.keys(translations).length;
        console.log(`    📊 包含 ${keyCount} 个翻译键`);
        
        if (keyCount < 10) {
          issues.push(`${locale} 翻译内容过少 (${keyCount} 个键)`);
        }
      } catch (e) {
        console.log(`    ❌ ${locale} 翻译文件格式错误`);
        issues.push(`${locale} 翻译文件格式错误`);
      }
    } else {
      console.log(`  ❌ ${locale} 翻译文件缺失`);
      issues.push(`缺失 ${locale} 翻译文件`);
    }
  });
  
  return issues;
}

// 检查数据库配置
function checkDatabaseConfig() {
  console.log('\n🗄️  数据库配置检查:');
  
  let issues = [];
  
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      console.log('  ✅ Supabase URL 已配置');
    } else {
      console.log('  ❌ Supabase URL 未配置');
      issues.push('缺失 NEXT_PUBLIC_SUPABASE_URL');
    }
    
    if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('  ✅ Supabase Service Key 已配置');
    } else {
      console.log('  ❌ Supabase Service Key 未配置');
      issues.push('缺失 SUPABASE_SERVICE_ROLE_KEY');
    }
  } else {
    console.log('  ❌ .env.local 文件不存在');
    issues.push('缺失环境配置文件');
  }
  
  return issues;
}

// 检查依赖包
function checkDependencies() {
  console.log('\n📦 依赖包检查:');
  
  let issues = [];
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const criticalDeps = [
      'next',
      'react',
      'typescript',
      '@supabase/supabase-js',
      'next-intl',
      'tailwindcss'
    ];
    
    criticalDeps.forEach(dep => {
      if (deps[dep]) {
        console.log(`  ✅ ${dep}: ${deps[dep]}`);
      } else {
        console.log(`  ❌ ${dep} - 未安装`);
        issues.push(`缺失关键依赖: ${dep}`);
      }
    });
  }
  
  return issues;
}

// 生成修复建议
function generateFixSuggestions(allIssues) {
  console.log('\n🛠️  修复建议:');
  console.log('=' .repeat(60));
  
  if (allIssues.length === 0) {
    console.log('🎉 恭喜！项目状态良好，没有发现严重问题。');
    return;
  }
  
  console.log(`发现 ${allIssues.length} 个问题需要修复:\n`);
  
  // 按优先级分类问题
  const p0Issues = allIssues.filter(issue => 
    issue.includes('API路由') || 
    issue.includes('环境配置') ||
    issue.includes('关键文件')
  );
  
  const p1Issues = allIssues.filter(issue => 
    issue.includes('翻译') || 
    issue.includes('GET方法') ||
    issue.includes('POST方法')
  );
  
  const p2Issues = allIssues.filter(issue => 
    !p0Issues.includes(issue) && !p1Issues.includes(issue)
  );
  
  if (p0Issues.length > 0) {
    console.log('🔴 P0 - 阻塞问题 (立即修复):');
    p0Issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log('');
  }
  
  if (p1Issues.length > 0) {
    console.log('🟡 P1 - 重要问题 (本周修复):');
    p1Issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log('');
  }
  
  if (p2Issues.length > 0) {
    console.log('🟢 P2 - 一般问题 (下周修复):');
    p2Issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log('');
  }
  
  // 生成具体修复命令
  console.log('💡 快速修复命令:');
  console.log('');
  
  if (allIssues.some(issue => issue.includes('依赖'))) {
    console.log('# 安装缺失依赖');
    console.log('npm install');
    console.log('');
  }
  
  if (allIssues.some(issue => issue.includes('环境配置'))) {
    console.log('# 配置环境变量');
    console.log('cp .env.example .env.local');
    console.log('# 然后编辑 .env.local 添加 Supabase 配置');
    console.log('');
  }
  
  if (allIssues.some(issue => issue.includes('API路由'))) {
    console.log('# 创建缺失的API路由');
    console.log('mkdir -p src/app/api/{videos,channels,dashboard,comments}');
    console.log('# 然后创建对应的 route.ts 文件');
    console.log('');
  }
  
  console.log('📞 需要帮助？');
  console.log('运行: npm run dev 启动开发服务器');
  console.log('或者联系开发团队获取支持');
}

// 主函数
function main() {
  const allIssues = [
    ...checkProjectStructure(),
    ...checkAPIRoutes(),
    ...checkInternationalization(),
    ...checkDatabaseConfig(),
    ...checkDependencies()
  ];
  
  generateFixSuggestions(allIssues);
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 项目健康检查完成');
  
  if (allIssues.length === 0) {
    process.exit(0);
  } else {
    console.log(`⚠️  发现 ${allIssues.length} 个问题需要修复`);
    process.exit(1);
  }
}

// 运行检查
main();