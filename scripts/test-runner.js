#!/usr/bin/env node

/**
 * 整合测试运行脚本
 * 包含单元测试、E2E测试、覆盖率报告等功能
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  testTypes: {
    unit: 'jest',
    e2e: 'playwright',
    coverage: 'jest --coverage'
  },
  outputDir: './test-results',
  coverageDir: './coverage'
};

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

// 检查依赖
async function checkDependencies() {
  logHeader('检查依赖');
  
  const requiredDeps = ['jest', '@playwright/test'];
  const missingDeps = [];

  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
    } catch (e) {
      missingDeps.push(dep);
    }
  }

  if (missingDeps.length > 0) {
    log(`缺少依赖: ${missingDeps.join(', ')}`, 'red');
    log('请运行: npm install', 'yellow');
    process.exit(1);
  }

  log('✅ 依赖检查通过', 'green');
}

// 运行单元测试
async function runUnitTests() {
  logHeader('运行单元测试');
  
  try {
    await runCommand('npm', ['test']);
    log('✅ 单元测试通过', 'green');
    return true;
  } catch (error) {
    log('❌ 单元测试失败', 'red');
    return false;
  }
}

// 运行E2E测试
async function runE2ETests() {
  logHeader('运行E2E测试');
  
  try {
    await runCommand('npm', ['run', 'test:e2e']);
    log('✅ E2E测试通过', 'green');
    return true;
  } catch (error) {
    log('❌ E2E测试失败', 'red');
    return false;
  }
}

// 生成覆盖率报告
async function generateCoverageReport() {
  logHeader('生成覆盖率报告');
  
  try {
    await runCommand('npm', ['run', 'test:coverage']);
    
    // 检查覆盖率文件
    if (fs.existsSync(CONFIG.coverageDir)) {
      log('✅ 覆盖率报告生成成功', 'green');
      log(`📊 报告位置: ${CONFIG.coverageDir}`, 'blue');
    }
    
    return true;
  } catch (error) {
    log('❌ 覆盖率报告生成失败', 'red');
    return false;
  }
}

// 运行本地功能测试
async function runLocalTests() {
  logHeader('运行本地功能测试');
  
  const localTestFile = path.join(__dirname, '../local-test.js');
  
  if (!fs.existsSync(localTestFile)) {
    log('⚠️  本地测试文件不存在', 'yellow');
    return true;
  }
  
  try {
    await runCommand('node', [localTestFile]);
    log('✅ 本地功能测试通过', 'green');
    return true;
  } catch (error) {
    log('❌ 本地功能测试失败', 'red');
    return false;
  }
}

// 清理测试结果
function cleanupTestResults() {
  logHeader('清理测试结果');
  
  const dirsToClean = [CONFIG.outputDir, CONFIG.coverageDir];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log(`🗑️  清理目录: ${dir}`, 'yellow');
    }
  });
}

// 生成测试报告
function generateTestReport(results) {
  logHeader('测试报告');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  log(`📊 总测试数: ${totalTests}`, 'blue');
  log(`✅ 通过: ${passedTests}`, 'green');
  log(`❌ 失败: ${failedTests}`, 'red');
  
  if (failedTests > 0) {
    log('\n失败的测试:', 'red');
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        log(`  - ${test}`, 'red');
      }
    });
  }
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`\n🎯 成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  return failedTests === 0;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  logHeader('YouTube Analytics Platform - 测试运行器');
  
  try {
    // 检查依赖
    await checkDependencies();
    
    const results = {};
    
    switch (command) {
      case 'unit':
        results.unit = await runUnitTests();
        break;
        
      case 'e2e':
        results.e2e = await runE2ETests();
        break;
        
      case 'coverage':
        results.coverage = await generateCoverageReport();
        break;
        
      case 'local':
        results.local = await runLocalTests();
        break;
        
      case 'clean':
        cleanupTestResults();
        log('✅ 清理完成', 'green');
        return;
        
      case 'all':
      default:
        // 清理旧的测试结果
        cleanupTestResults();
        
        // 运行所有测试
        results.unit = await runUnitTests();
        results.e2e = await runE2ETests();
        results.coverage = await generateCoverageReport();
        results.local = await runLocalTests();
        break;
    }
    
    // 生成报告
    const allPassed = generateTestReport(results);
    
    if (allPassed) {
      log('\n🎉 所有测试通过！', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  部分测试失败，请检查详情', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 测试运行器错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 显示帮助信息
function showHelp() {
  logHeader('测试运行器帮助');
  
  log('用法: node scripts/test-runner.js [command]', 'bright');
  log('\n可用命令:', 'bright');
  log('  all       - 运行所有测试 (默认)', 'blue');
  log('  unit      - 仅运行单元测试', 'blue');
  log('  e2e       - 仅运行E2E测试', 'blue');
  log('  coverage  - 生成覆盖率报告', 'blue');
  log('  local     - 运行本地功能测试', 'blue');
  log('  clean     - 清理测试结果', 'blue');
  log('  help      - 显示此帮助信息', 'blue');
  
  log('\n示例:', 'bright');
  log('  node scripts/test-runner.js', 'cyan');
  log('  node scripts/test-runner.js unit', 'cyan');
  log('  node scripts/test-runner.js e2e', 'cyan');
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