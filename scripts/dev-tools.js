#!/usr/bin/env node

/**
 * 开发工具脚本
 * 包含项目检查、数据库操作、部署准备等功能
 */

const { spawn } = require('child_process');
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

// 运行命令
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 检查项目健康状态
async function checkProjectHealth() {
  logHeader('项目健康检查');
  
  const checks = [
    { name: 'package.json', path: './package.json' },
    { name: 'next.config.ts', path: './next.config.ts' },
    { name: 'tsconfig.json', path: './tsconfig.json' },
    { name: '.env.local', path: './.env.local' },
    { name: 'src/app/layout.tsx', path: './src/app/layout.tsx' },
    { name: 'src/app/[locale]/page.tsx', path: './src/app/[locale]/page.tsx' }
  ];
  
  let passed = 0;
  
  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      log(`✅ ${check.name}`, 'green');
      passed++;
    } else {
      log(`❌ ${check.name}`, 'red');
    }
  }
  
  log(`\n📊 检查结果: ${passed}/${checks.length} 通过`, passed === checks.length ? 'green' : 'yellow');
  
  return passed === checks.length;
}

// 检查环境变量
async function checkEnvironmentVariables() {
  logHeader('环境变量检查');
  
  try {
    require('dotenv').config({ path: '.env.local' });
    
    const requiredVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ];
    
    let missing = 0;
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        log(`✅ ${varName}`, 'green');
      } else {
        log(`❌ ${varName}`, 'red');
        missing++;
      }
    }
    
    if (missing > 0) {
      log(`\n⚠️  缺少 ${missing} 个环境变量`, 'yellow');
      return false;
    } else {
      log('\n✅ 所有必需的环境变量都已配置', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ 环境变量检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 检查数据库连接
async function checkDatabaseConnection() {
  logHeader('数据库连接检查');
  
  try {
    require('dotenv').config({ path: '.env.local' });
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      log('❌ 缺少数据库环境变量', 'red');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // 测试连接 - 使用简单的查询而不是version函数
    const { data, error } = await supabase
      .from('yt_users')
      .select('count')
      .limit(1);
    
    if (error) {
      // 如果表不存在，尝试查询其他表
      const { data: altData, error: altError } = await supabase
        .from('accounts')
        .select('count')
        .limit(1);
      
      if (altError) {
        log(`❌ 数据库连接失败: ${error.message}`, 'red');
        return false;
      }
    }
    
    log('✅ 数据库连接正常', 'green');
    
    // 检查RLS状态
    await checkRLSStatus(supabase);
    
    // 检查表结构
    await checkTableStructure(supabase);
    
    return true;
  } catch (error) {
    log(`❌ 数据库连接异常: ${error.message}`, 'red');
    return false;
  }
}

// 检查RLS状态
async function checkRLSStatus(supabase) {
  logHeader('RLS安全策略检查');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'yt_%'
        ORDER BY tablename;
      `
    });
    
    if (error) {
      // 如果exec_sql不可用，使用直接查询
      const { data: directData, error: directError } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename, rowsecurity')
        .eq('schemaname', 'public')
        .like('tablename', 'yt_%')
        .order('tablename');
      
      if (directError) {
        log('⚠️  无法检查RLS状态（需要管理员权限）', 'yellow');
        return;
      }
      
      displayRLSStatus(directData);
    } else {
      displayRLSStatus(data);
    }
  } catch (error) {
    log('⚠️  RLS状态检查失败', 'yellow');
  }
}

// 显示RLS状态
function displayRLSStatus(data) {
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
}

// 检查表结构
async function checkTableStructure(supabase) {
  logHeader('数据库表结构检查');
  
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
    // NextAuth相关表
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
      } else {
        existingCount++;
        log(`✅ ${tableName}`, 'green');
      }
    } catch (error) {
      missingTables.push(tableName);
    }
  }
  
  log(`\n📊 表结构检查结果: ${existingCount}/${requiredTables.length} 个表存在`, 
      existingCount === requiredTables.length ? 'green' : 'yellow');
  
  if (missingTables.length > 0) {
    log('\n❌ 缺失的表:', 'red');
    missingTables.forEach(table => log(`   - ${table}`, 'red'));
    log('\n💡 建议: 运行 npm run db:sync 同步数据库结构', 'yellow');
  }
}

// 运行类型检查
async function runTypeCheck() {
  logHeader('TypeScript 类型检查');
  
  try {
    await runCommand('npm', ['run', 'type-check']);
    log('✅ 类型检查通过', 'green');
    return true;
  } catch (error) {
    log('❌ 类型检查失败', 'red');
    return false;
  }
}

// 运行代码检查
async function runLint() {
  logHeader('代码检查');
  
  try {
    await runCommand('npm', ['run', 'lint']);
    log('✅ 代码检查通过', 'green');
    return true;
  } catch (error) {
    log('❌ 代码检查失败', 'red');
    return false;
  }
}

// 构建项目
async function buildProject() {
  logHeader('项目构建');
  
  try {
    await runCommand('npm', ['run', 'build']);
    log('✅ 构建成功', 'green');
    return true;
  } catch (error) {
    log('❌ 构建失败', 'red');
    return false;
  }
}

// 初始化数据库
async function initDatabase() {
  logHeader('数据库初始化');
  
  try {
    require('dotenv').config({ path: '.env.local' });
    const { createClient } = require('@supabase/supabase-js');
    const fs = require('fs');
    const path = require('path');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      log('❌ 缺少数据库环境变量', 'red');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 读取schema文件
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      log('⚠️  schema.sql 文件不存在，跳过初始化', 'yellow');
      return true;
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    log(`📝 找到 ${statements.length} 个SQL语句`, 'blue');
    
    // 执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error && !error.message.includes('already exists')) {
            log(`⚠️  SQL执行警告: ${error.message.substring(0, 50)}...`, 'yellow');
          }
        } catch (err) {
          log(`⚠️  跳过语句 ${i + 1}: ${err.message.substring(0, 50)}...`, 'yellow');
        }
      }
    }
    
    log('✅ 数据库初始化完成', 'green');
    return true;
  } catch (error) {
    log(`❌ 数据库初始化失败: ${error.message}`, 'red');
    return false;
  }
}

// 准备部署
async function prepareDeployment() {
  logHeader('部署准备');
  
  try {
    const deployScript = path.join(__dirname, 'deployment/deploy-prep.js');
    
    if (fs.existsSync(deployScript)) {
      await runCommand('node', [deployScript]);
      log('✅ 部署准备完成', 'green');
      return true;
    } else {
      log('⚠️  部署准备脚本不存在', 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ 部署准备失败: ${error.message}`, 'red');
    return false;
  }
}

// 清理项目
async function cleanupProject() {
  logHeader('项目清理');
  
  const dirsToClean = [
    '.next',
    'node_modules/.cache',
    'coverage',
    'test-results',
    'playwright-report'
  ];
  
  let cleaned = 0;
  
  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log(`🗑️  清理: ${dir}`, 'yellow');
      cleaned++;
    }
  }
  
  log(`✅ 清理完成，共清理 ${cleaned} 个目录`, 'green');
  return true;
}

// 显示项目状态
function showProjectStatus() {
  logHeader('项目状态');
  
  const status = {
    'Node.js 版本': process.version,
    'NPM 版本': require('child_process').execSync('npm --version').toString().trim(),
    '项目目录': process.cwd(),
    'Git 分支': require('child_process').execSync('git branch --show-current').toString().trim(),
    '最后提交': require('child_process').execSync('git log -1 --oneline').toString().trim()
  };
  
  Object.entries(status).forEach(([key, value]) => {
    log(`${key}: ${value}`, 'blue');
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'health';
  
  logHeader('YouTube Analytics Platform - 开发工具');
  
  try {
    switch (command) {
      case 'health':
        await checkProjectHealth();
        break;
        
      case 'env':
        await checkEnvironmentVariables();
        break;
        
      case 'db':
        await checkDatabaseConnection();
        break;
        
      case 'types':
        await runTypeCheck();
        break;
        
      case 'lint':
        await runLint();
        break;
        
      case 'build':
        await buildProject();
        break;
        
      case 'init-db':
        await initDatabase();
        break;
        
      case 'deploy-prep':
        await prepareDeployment();
        break;
        
      case 'cleanup':
        await cleanupProject();
        break;
        
      case 'status':
        showProjectStatus();
        break;
        
      case 'full-check':
        logHeader('完整项目检查');
        const results = {
          health: await checkProjectHealth(),
          env: await checkEnvironmentVariables(),
          db: await checkDatabaseConnection(),
          types: await runTypeCheck(),
          lint: await runLint(),
          build: await buildProject()
        };
        
        const passed = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;
        
        log(`\n📊 检查结果: ${passed}/${total} 通过`, passed === total ? 'green' : 'yellow');
        
        if (passed === total) {
          log('🎉 项目状态良好，可以部署！', 'green');
        } else {
          log('⚠️  请修复上述问题后再部署', 'yellow');
        }
        break;
        
      default:
        showHelp();
        break;
    }
    
  } catch (error) {
    log(`\n💥 开发工具错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 显示帮助信息
function showHelp() {
  logHeader('开发工具帮助');
  
  log('用法: node scripts/dev-tools.js [command]', 'bright');
  log('\n可用命令:', 'bright');
  log('  health      - 项目健康检查 (默认)', 'blue');
  log('  env         - 环境变量检查', 'blue');
  log('  db          - 数据库连接检查', 'blue');
  log('  types       - TypeScript 类型检查', 'blue');
  log('  lint        - 代码检查', 'blue');
  log('  build       - 项目构建', 'blue');
  log('  init-db     - 初始化数据库', 'blue');
  log('  deploy-prep - 部署准备', 'blue');
  log('  cleanup     - 清理项目', 'blue');
  log('  status      - 显示项目状态', 'blue');
  log('  full-check  - 完整项目检查', 'blue');
  log('  help        - 显示此帮助信息', 'blue');
  
  log('\n示例:', 'bright');
  log('  node scripts/dev-tools.js', 'cyan');
  log('  node scripts/dev-tools.js full-check', 'cyan');
  log('  node scripts/dev-tools.js build', 'cyan');
}

// 处理命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h') || process.argv.includes('help')) {
  showHelp();
  process.exit(0);
}

// 运行主函数
main().catch(error => {
  log(`\n💥 未处理的错误: ${error.message}`, 'red');
  process.exit(1);
}); 