#!/usr/bin/env node

/**
 * YouTube Analytics Platform - 快速修复脚本
 * 自动修复项目中的关键问题
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 YouTube Analytics Platform - 快速修复开始');
console.log('=' .repeat(60));

// 修复 dashboard API 中的 TypeScript 错误
function fixDashboardAPI() {
  console.log('\n🔧 修复 Dashboard API...');
  
  const apiPath = 'src/app/api/dashboard/route.ts';
  if (fs.existsSync(apiPath)) {
    let content = fs.readFileSync(apiPath, 'utf8');
    
    // 检查是否已经修复
    if (content.includes('.then(({ data: videoIds }) => {')) {
      console.log('  ✅ Dashboard API 已经修复');
      return;
    }
    
    // 修复 TypeScript 错误
    const oldCode = `      // 查询评论统计
      supabase
        .from('yt_comments')
        .select('id, like_count')
        .in('video_id', 
          supabase
            .from('yt_videos')
            .select('id')
            .eq('user_id', userId)
        )`;
    
    const newCode = `      // 查询评论统计 - 修复 TypeScript 错误
      (async () => {
        const { data: videoIds } = await supabase
          .from('yt_videos')
          .select('id')
          .eq('user_id', userId);
        
        if (videoIds && videoIds.length > 0) {
          return supabase
            .from('yt_comments')
            .select('id, like_count')
            .in('video_id', videoIds.map(v => v.id));
        }
        return { data: [], error: null };
      })()`;
    
    if (content.includes(oldCode)) {
      content = content.replace(oldCode, newCode);
      fs.writeFileSync(apiPath, content);
      console.log('  ✅ Dashboard API TypeScript 错误已修复');
    } else {
      console.log('  ℹ️  Dashboard API 无需修复');
    }
  } else {
    console.log('  ❌ Dashboard API 文件不存在');
  }
}

// 创建种子数据脚本
function createSeedDataScript() {
  console.log('\n🌱 创建种子数据脚本...');
  
  const seedScript = `#!/usr/bin/env node

/**
 * 数据库种子数据脚本
 * 为开发和测试创建示例数据
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSeedData() {
  console.log('🌱 开始创建种子数据...');
  
  try {
    // 创建测试用户
    const testUser = {
      id: 'test-user-1',
      email: 'test@example.com',
      plan: 'free',
      quota_used: 5,
      quota_limit: 50,
      preferences: {
        language: 'zh-CN',
        theme: 'light'
      }
    };
    
    const { error: userError } = await supabase
      .from('yt_users')
      .upsert([testUser]);
    
    if (userError) {
      console.log('⚠️  用户数据插入失败:', userError.message);
    } else {
      console.log('✅ 测试用户创建成功');
    }
    
    // 创建测试频道数据
    const testChannels = [
      {
        id: 'UC_test_channel_1',
        title: '科技评测频道',
        description: '专业的科技产品评测和分析',
        subscriber_count: 125000,
        video_count: 89,
        view_count: 5600000,
        user_id: 'test-user-1',
        scraped_at: new Date().toISOString()
      },
      {
        id: 'UC_test_channel_2', 
        title: '生活方式博主',
        description: '分享生活中的美好时刻',
        subscriber_count: 67000,
        video_count: 156,
        view_count: 2300000,
        user_id: 'test-user-1',
        scraped_at: new Date().toISOString()
      }
    ];
    
    const { error: channelError } = await supabase
      .from('yt_channels')
      .upsert(testChannels);
    
    if (channelError) {
      console.log('⚠️  频道数据插入失败:', channelError.message);
    } else {
      console.log('✅ 测试频道创建成功');
    }
    
    // 创建测试视频数据
    const testVideos = [];
    for (let i = 1; i <= 20; i++) {
      testVideos.push({
        id: \`test_video_\${i}\`,
        title: \`测试视频 \${i}: 如何制作优质内容\`,
        description: \`这是第\${i}个测试视频的描述，包含了关于内容创作的有用信息。\`,
        channel_id: i <= 10 ? 'UC_test_channel_1' : 'UC_test_channel_2',
        channel_title: i <= 10 ? '科技评测频道' : '生活方式博主',
        published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 1800) + 300,
        view_count: Math.floor(Math.random() * 100000) + 1000,
        like_count: Math.floor(Math.random() * 5000) + 100,
        comment_count: Math.floor(Math.random() * 500) + 10,
        tags: ['教程', 'YouTube', '内容创作', '技巧'],
        ai_summary: \`这个视频主要讲解了\${i % 2 === 0 ? '内容创作' : '观众互动'}的关键策略。\`,
        sentiment_score: (Math.random() * 2 - 1).toFixed(2),
        keywords: ['YouTube', '教程', '技巧', '策略'],
        user_id: 'test-user-1',
        scraped_at: new Date().toISOString()
      });
    }
    
    const { error: videoError } = await supabase
      .from('yt_videos')
      .upsert(testVideos);
    
    if (videoError) {
      console.log('⚠️  视频数据插入失败:', videoError.message);
    } else {
      console.log('✅ 测试视频创建成功');
    }
    
    console.log('\\n🎉 种子数据创建完成！');
    console.log('现在你可以启动项目并看到真实的数据展示。');
    
  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
  }
}

// 运行脚本
createSeedData();`;
  
  const seedPath = 'scripts/seed-data.js';
  fs.writeFileSync(seedPath, seedScript);
  console.log('  ✅ 种子数据脚本创建完成');
}

// 创建开发环境检查脚本
function createDevCheckScript() {
  console.log('\n🔍 创建开发环境检查脚本...');
  
  const checkScript = `#!/usr/bin/env node

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
      console.log(\`✅ \${file} 存在\`);
    } else {
      issues.push(\`缺失关键文件: \${file}\`);
    }
  });
  
  if (issues.length === 0) {
    console.log('\\n🎉 开发环境配置完整！');
    console.log('你可以运行 npm run dev 启动项目');
    return true;
  } else {
    console.log('\\n⚠️  发现以下问题:');
    issues.forEach(issue => console.log(\`  - \${issue}\`));
    return false;
  }
}

module.exports = { checkEnvironment };

if (require.main === module) {
  checkEnvironment();
}`;
  
  const checkPath = 'scripts/dev-check.js';
  fs.writeFileSync(checkPath, checkScript);
  console.log('  ✅ 开发环境检查脚本创建完成');
}

// 更新 package.json 脚本
function updatePackageScripts() {
  console.log('\n📦 更新 package.json 脚本...');
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 添加新的脚本命令
    packageJson.scripts = {
      ...packageJson.scripts,
      'dev:check': 'node scripts/dev-check.js',
      'dev:seed': 'node scripts/seed-data.js',
      'dev:fix': 'node scripts/quick-fix.js',
      'health': 'node scripts/project-health-check.js'
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('  ✅ package.json 脚本已更新');
  }
}

// 主函数
async function main() {
  try {
    fixDashboardAPI();
    createSeedDataScript();
    createDevCheckScript();
    updatePackageScripts();
    
    console.log('\\n' + '=' .repeat(60));
    console.log('🎉 快速修复完成！');
    console.log('\\n📋 下一步操作:');
    console.log('1. 运行: npm run dev:check  # 检查环境配置');
    console.log('2. 运行: npm run dev:seed   # 创建测试数据');
    console.log('3. 运行: npm run dev       # 启动开发服务器');
    console.log('4. 访问: http://localhost:3000');
    console.log('\\n🚀 你的项目已经准备就绪！');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    process.exit(1);
  }
}

// 运行修复
main();