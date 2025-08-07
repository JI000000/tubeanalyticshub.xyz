#!/usr/bin/env node

/**
 * 简单的功能验证脚本
 * 测试核心 API 端点和功能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// 测试配置
const tests = [
  {
    name: '健康检查',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200
  },
  {
    name: '试用消费 API',
    method: 'POST',
    path: '/api/trial/consume',
    data: {
      fingerprint: 'test-fingerprint-123',
      action: 'video_analysis'
    },
    expectedStatus: 200
  },
  {
    name: '主页访问',
    method: 'GET',
    path: '/en-US',
    expectedStatus: 200
  },
  {
    name: '仪表板访问',
    method: 'GET',
    path: '/en-US/dashboard',
    expectedStatus: 200
  }
];

// 执行单个测试
function runTest(test) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: test.path,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === test.expectedStatus;
        resolve({
          name: test.name,
          success,
          status: res.statusCode,
          expected: test.expectedStatus,
          data: data.substring(0, 200) // 只显示前200个字符
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name: test.name,
        success: false,
        error: err.message
      });
    });

    if (test.data) {
      req.write(JSON.stringify(test.data));
    }
    
    req.end();
  });
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始功能验证测试...\n');
  
  const results = [];
  
  for (const test of tests) {
    console.log(`⏳ 测试: ${test.name}`);
    const result = await runTest(test);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.name} - 状态码: ${result.status}`);
    } else {
      console.log(`❌ ${result.name} - ${result.error || `状态码: ${result.status} (期望: ${result.expected})`}`);
    }
    
    // 短暂延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 总结
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有核心功能正常工作！');
    process.exit(0);
  } else {
    console.log('⚠️  部分功能存在问题，请检查服务器状态');
    process.exit(1);
  }
}

// 检查服务器是否运行
function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      resolve(false);
    });
    
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🔍 检查服务器状态...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ 服务器未运行，请先启动开发服务器:');
    console.log('   npm run dev');
    process.exit(1);
  }
  
  console.log('✅ 服务器正在运行\n');
  await runAllTests();
}

main().catch(console.error);