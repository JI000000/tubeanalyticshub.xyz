#!/usr/bin/env node

/**
 * 数据库结构检查工具
 * 检查所有必要的表是否存在
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少数据库环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 需要检查的核心表
const requiredTables = [
  'yt_users',
  'yt_channels', 
  'yt_videos',
  'yt_comments',
  'yt_scraping_tasks',
  'yt_ai_analysis',
  'yt_analytics',
  'yt_insights',
  'yt_reports',
  'yt_teams',
  'yt_team_members',
  'yt_anonymous_trials',
  'yt_login_analytics'
];

// NextAuth相关表
const nextAuthTables = [
  'accounts',
  'sessions', 
  'users',
  'verification_tokens'
];

async function checkTableStructure() {
  console.log('🔍 检查数据库表结构...\n');
  
  const allTables = [...requiredTables, ...nextAuthTables];
  const results = {};
  
  for (const tableName of allTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        results[tableName] = { exists: false, error: error.message };
      } else {
        console.log(`✅ ${tableName}: 存在`);
        results[tableName] = { exists: true, error: null };
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      results[tableName] = { exists: false, error: error.message };
    }
  }
  
  // 统计结果
  const existingTables = Object.values(results).filter(r => r.exists).length;
  const missingTables = Object.values(results).filter(r => !r.exists).length;
  
  console.log(`\n📊 检查结果:`);
  console.log(`✅ 存在的表: ${existingTables}/${allTables.length}`);
  console.log(`❌ 缺失的表: ${missingTables}/${allTables.length}`);
  
  if (missingTables > 0) {
    console.log('\n⚠️  缺失的表:');
    Object.entries(results)
      .filter(([_, result]) => !result.exists)
      .forEach(([table, result]) => {
        console.log(`   - ${table}: ${result.error}`);
      });
  }
  
  return results;
}

async function checkRLSStatus() {
  console.log('\n🔒 检查Row Level Security状态...\n');
  
  // 这里我们只能检查表是否存在，RLS状态需要通过Supabase控制台查看
  console.log('ℹ️  RLS状态需要在Supabase控制台中手动检查');
  console.log('   建议为以下表启用RLS:');
  console.log('   - yt_users');
  console.log('   - yt_channels');
  console.log('   - yt_videos');
  console.log('   - yt_analytics');
  console.log('   - yt_reports');
  console.log('   - yt_teams');
}

async function main() {
  try {
    await checkTableStructure();
    await checkRLSStatus();
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
    process.exit(1);
  }
}

main(); 