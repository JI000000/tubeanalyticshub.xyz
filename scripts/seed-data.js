#!/usr/bin/env node

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
        id: `test_video_${i}`,
        title: `测试视频 ${i}: 如何制作优质内容`,
        description: `这是第${i}个测试视频的描述，包含了关于内容创作的有用信息。`,
        channel_id: i <= 10 ? 'UC_test_channel_1' : 'UC_test_channel_2',
        channel_title: i <= 10 ? '科技评测频道' : '生活方式博主',
        published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 1800) + 300,
        view_count: Math.floor(Math.random() * 100000) + 1000,
        like_count: Math.floor(Math.random() * 5000) + 100,
        comment_count: Math.floor(Math.random() * 500) + 10,
        tags: ['教程', 'YouTube', '内容创作', '技巧'],
        ai_summary: `这个视频主要讲解了${i % 2 === 0 ? '内容创作' : '观众互动'}的关键策略。`,
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
    
    console.log('\n🎉 种子数据创建完成！');
    console.log('现在你可以启动项目并看到真实的数据展示。');
    
  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
  }
}

// 运行脚本
createSeedData();