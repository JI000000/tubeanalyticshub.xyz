#!/usr/bin/env node

/**
 * 测试Analytics Platform API端点
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testAPI() {
  console.log('🧪 开始测试Analytics Platform API...');
  
  try {
    // 1. 测试创建仪表板
    console.log('\n📊 测试创建仪表板...');
    const createDashboardResponse = await fetch(`${BASE_URL}/api/analytics/dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        title: 'Test Analytics Dashboard',
        description: 'This is a test dashboard for Analytics Platform',
        config: {
          theme: 'default',
          refreshInterval: 300000
        },
        dataSources: [
          {
            type: 'analytics',
            userId: TEST_USER_ID,
            limit: 100
          }
        ],
        layout: {
          grid: { columns: 12, rows: 8 },
          widgets: []
        },
        isPublic: false
      }),
    });

    const dashboardResult = await createDashboardResponse.json();
    
    if (dashboardResult.success) {
      console.log('✅ 仪表板创建成功:', dashboardResult.data.dashboard.title);
      
      // 2. 测试获取仪表板
      console.log('\n📋 测试获取仪表板...');
      const getDashboardResponse = await fetch(
        `${BASE_URL}/api/analytics/dashboard/${dashboardResult.data.dashboard.id}?userId=${TEST_USER_ID}`
      );
      
      const getDashboardResult = await getDashboardResponse.json();
      
      if (getDashboardResult.success) {
        console.log('✅ 仪表板获取成功');
      } else {
        console.log('❌ 仪表板获取失败:', getDashboardResult.error);
      }
      
    } else {
      console.log('❌ 仪表板创建失败:', dashboardResult.error);
    }

    // 3. 测试AI洞察API
    console.log('\n🤖 测试AI洞察API...');
    const insightsResponse = await fetch(`${BASE_URL}/api/analytics/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        videoId: 'test-video-id',
        analysisType: 'content'
      }),
    });

    const insightsResult = await insightsResponse.json();
    
    if (insightsResult.success) {
      console.log('✅ AI洞察生成成功');
    } else {
      console.log('❌ AI洞察生成失败:', insightsResult.error);
    }

    // 4. 测试竞品分析API
    console.log('\n🔍 测试竞品分析API...');
    const competitorResponse = await fetch(`${BASE_URL}/api/analytics/competitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        primaryChannelId: 'test-primary-channel',
        competitorChannelIds: ['competitor1', 'competitor2'],
        analysisConfig: {
          metrics: ['subscribers', 'views', 'engagement']
        }
      }),
    });

    const competitorResult = await competitorResponse.json();
    
    if (competitorResult.success) {
      console.log('✅ 竞品分析成功');
    } else {
      console.log('❌ 竞品分析失败:', competitorResult.error);
    }

    console.log('\n🎉 API测试完成！');

  } catch (error) {
    console.error('❌ API测试过程中发生错误:', error.message);
  }
}

// 等待服务器启动后执行测试
setTimeout(() => {
  testAPI();
}, 3000);

console.log('⏳ 等待开发服务器启动...');