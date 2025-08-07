const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 测试函数
async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 400;
        console.log(`${success ? '✅' : '❌'} ${description}: ${res.statusCode}`);
        resolve(success);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: 连接失败 - ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${description}: 超时`);
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🚀 开始本地功能测试...\n');
  
  const tests = [
    { path: '/', description: '主页访问' },
    { path: '/en-US', description: '英文主页' },
    { path: '/zh-CN', description: '中文主页' },
    { path: '/en-US/dashboard', description: '仪表板页面' },
    { path: '/en-US/videos', description: '视频页面' },
    { path: '/en-US/channels', description: '频道页面' },
    { path: '/api/dashboard', description: '仪表板API' },
    { path: '/api/videos', description: '视频API' },
    { path: '/api/trial/consume?fingerprint=test-123', description: '试用API' }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(test.path, test.description);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms
  }
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！应用程序运行正常。');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能。');
  }
}

// 运行测试
runTests().catch(console.error); 