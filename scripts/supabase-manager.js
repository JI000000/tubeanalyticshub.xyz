#!/usr/bin/env node

/**
 * Supabase数据库管理脚本
 * 整合所有数据库操作：结构检查、同步、RLS管理、表重命名等
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(50)}`, 'cyan');
}

// 初始化Supabase客户端
function initSupabase() {
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少数据库环境变量');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// 检查数据库结构
async function checkDatabaseStructure() {
  logHeader('数据库结构检查');
  
  const supabase = initSupabase();
  
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
    'yt_dashboards',
    'yt_ai_insights',
    'yt_competitor_analysis',
    'yt_team_invitations',
    'yt_collaboration_comments',
    'yt_anonymous_trials',
    'yt_login_analytics',
    'yt_accounts',
    'yt_sessions', 
    'yt_users_auth',
    'yt_verification_tokens'
  ];
  
  let existingCount = 0;
  let missingTables = [];
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error) {
        missingTables.push(tableName);
        log(`❌ ${tableName}`, 'red');
      } else {
        existingCount++;
        log(`✅ ${tableName}`, 'green');
      }
    } catch (error) {
      missingTables.push(tableName);
      log(`❌ ${tableName}`, 'red');
    }
  }
  
  log(`\n📊 检查结果: ${existingCount}/${requiredTables.length} 个表存在`, 
      existingCount === requiredTables.length ? 'green' : 'yellow');
  
  if (missingTables.length > 0) {
    log('\n❌ 缺失的表:', 'red');
    missingTables.forEach(table => log(`   - ${table}`, 'red'));
    log('\n💡 建议: 运行 npm run db:sync 同步数据库结构', 'yellow');
  }
  
  return { existingCount, missingTables };
}

// 检查RLS状态
async function checkRLSStatus() {
  logHeader('RLS安全策略检查');
  
  const supabase = initSupabase();
  
  try {
    // 使用直接查询检查RLS状态
    const { data, error } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename, rowsecurity')
      .eq('schemaname', 'public')
      .like('tablename', 'yt_%')
      .order('tablename');
    
    if (error) {
      log('⚠️  无法检查RLS状态（需要管理员权限）', 'yellow');
      return;
    }
    
    if (!data || data.length === 0) {
      log('⚠️  未找到yt_前缀的表', 'yellow');
      return;
    }
    
    let enabledCount = 0;
    let disabledCount = 0;
    
    log('\n📊 RLS状态概览:', 'cyan');
    log('表名'.padEnd(30) + 'RLS状态', 'bright');
    log('-'.repeat(40), 'cyan');
    
    data.forEach(row => {
      const status = row.rowsecurity ? '✅ 启用' : '❌ 禁用';
      const color = row.rowsecurity ? 'green' : 'red';
      log(`${row.tablename.padEnd(30)} ${status}`, color);
      
      if (row.rowsecurity) {
        enabledCount++;
      } else {
        disabledCount++;
      }
    });
    
    log('-'.repeat(40), 'cyan');
    log(`总计: ${data.length} 个表`, 'bright');
    log(`✅ RLS启用: ${enabledCount} 个`, 'green');
    log(`❌ RLS禁用: ${disabledCount} 个`, 'red');
    
    if (disabledCount > 0) {
      log('\n💡 建议: 运行 npm run db:rls 启用所有表的RLS', 'yellow');
    }
    
    return { enabledCount, disabledCount, total: data.length };
  } catch (error) {
    log('⚠️  RLS状态检查失败', 'yellow');
    return null;
  }
}

// 同步数据库结构
async function syncDatabaseStructure() {
  logHeader('同步数据库结构');
  
  log('📝 请手动执行以下步骤:', 'yellow');
  log('1. 打开 Supabase Dashboard', 'cyan');
  log('2. 进入 SQL Editor', 'cyan');
  log('3. 执行 supabase/schema-incremental-fixed.sql', 'cyan');
  log('4. 验证所有表创建成功', 'cyan');
  
  log('\n📁 相关文件:', 'bright');
  log('   - supabase/schema-incremental-fixed.sql (推荐)', 'green');
  log('   - supabase/schema-incremental.sql (备选)', 'yellow');
  log('   - supabase/schema-fixed.sql (完整重建)', 'red');
  
  log('\n⚠️  注意: 自动化同步不可用，请手动执行SQL脚本', 'yellow');
}

// 管理RLS策略
async function manageRLS() {
  logHeader('RLS策略管理');
  
  log('📝 请手动执行以下步骤:', 'yellow');
  log('1. 打开 Supabase Dashboard', 'cyan');
  log('2. 进入 SQL Editor', 'cyan');
  log('3. 执行 supabase/rls-management.sql', 'cyan');
  log('4. 验证RLS策略创建成功', 'cyan');
  
  log('\n🔧 RLS管理功能:', 'bright');
  log('   - 启用/禁用RLS', 'cyan');
  log('   - 创建安全策略', 'cyan');
  log('   - 查看策略状态', 'cyan');
  log('   - 删除策略', 'cyan');
  
  log('\n⚠️  注意: 需要管理员权限执行RLS操作', 'yellow');
}

// 重命名NextAuth表
async function renameNextAuthTables() {
  logHeader('NextAuth表重命名');
  
  log('📝 请手动执行以下步骤:', 'yellow');
  log('1. 打开 Supabase Dashboard', 'cyan');
  log('2. 进入 SQL Editor', 'cyan');
  log('3. 执行 supabase/rename-tables.sql', 'cyan');
  log('4. 验证表重命名成功', 'cyan');
  
  log('\n🔄 重命名操作:', 'bright');
  log('   - accounts → yt_accounts', 'cyan');
  log('   - sessions → yt_sessions', 'cyan');
  log('   - users → yt_users_auth', 'cyan');
  log('   - verification_tokens → yt_verification_tokens', 'cyan');
  
  log('\n⚠️  注意: 重命名后需要更新应用配置', 'yellow');
}

// 显示帮助信息
function showHelp() {
  logHeader('Supabase数据库管理工具');
  
  log('可用命令:', 'bright');
  log('  npm run db:check     - 检查数据库结构和RLS状态', 'cyan');
  log('  npm run db:sync      - 同步数据库结构', 'cyan');
  log('  npm run db:rls       - 管理RLS策略', 'cyan');
  log('  npm run db:rename    - 重命名NextAuth表', 'cyan');
  log('  npm run db:help      - 显示此帮助信息', 'cyan');
  
  log('\n📁 相关文件:', 'bright');
  log('  supabase/schema-incremental-fixed.sql  - 推荐的结构文件', 'green');
  log('  supabase/rls-management.sql           - RLS管理脚本', 'green');
  log('  supabase/rename-tables.sql            - 表重命名脚本', 'green');
  
  log('\n💡 提示:', 'yellow');
  log('  - 所有SQL操作需要在Supabase Dashboard中手动执行', 'yellow');
  log('  - 建议按顺序执行: 重命名 → 同步结构 → 管理RLS', 'yellow');
}

// 主函数
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'check':
        await checkDatabaseStructure();
        await checkRLSStatus();
        break;
      case 'sync':
        await syncDatabaseStructure();
        break;
      case 'rls':
        await manageRLS();
        break;
      case 'rename':
        await renameNextAuthTables();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    log(`❌ 操作失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkDatabaseStructure,
  checkRLSStatus,
  syncDatabaseStructure,
  manageRLS,
  renameNextAuthTables
}; 