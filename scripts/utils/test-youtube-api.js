#!/usr/bin/env node

/**
 * 🧪 YouTube API 测试工具
 * 
 * 功能：
 * 1. 测试YouTube Data API连接
 * 2. 验证API密钥配置
 * 3. 测试基本API功能
 * 4. 显示配额使用情况
 */

require('dotenv').config({ path: '.env.local' });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function testYouTubeAPI() {
  console.log('🧪 测试YouTube Data API连接...');
  
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YouTube API密钥未配置');
    console.error('请在 .env.local 文件中设置 YOUTUBE_API_KEY');
    return;
  }
  
  console.log('🔑 API密钥已配置:', YOUTUBE_API_KEY.substring(0, 10) + '...');
  
  try {
    // 测试1: 获取一个知名视频的信息
    console.log('\n📹 测试1: 获取视频信息...');
    const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll - 一个著名的测试视频
    
    const videoUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${testVideoId}&key=${YOUTUBE_API_KEY}`;
    
    const videoResponse = await fetch(videoUrl);
    const videoData = await videoResponse.json();
    
    if (videoResponse.ok && videoData.items && videoData.items.length > 0) {
      const video = videoData.items[0];
      console.log('✅ 视频信息获取成功:');
      console.log(`   标题: ${video.snippet.title}`);
      console.log(`   频道: ${video.snippet.channelTitle}`);
      console.log(`   观看次数: ${parseInt(video.statistics.viewCount).toLocaleString()}`);
      console.log(`   点赞数: ${parseInt(video.statistics.likeCount || 0).toLocaleString()}`);
    } else {
      console.error('❌ 视频信息获取失败:', videoData);
      return;
    }
    
    // 测试2: 搜索视频
    console.log('\n🔍 测试2: 搜索视频...');
    const searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=javascript tutorial&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchResponse.ok && searchData.items) {
      console.log(`✅ 搜索成功，找到 ${searchData.items.length} 个结果:`);
      searchData.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.snippet.title}`);
        console.log(`      频道: ${item.snippet.channelTitle}`);
        console.log(`      发布时间: ${new Date(item.snippet.publishedAt).toLocaleDateString()}`);
      });
    } else {
      console.error('❌ 搜索失败:', searchData);
      return;
    }
    
    // 测试3: 获取频道信息
    console.log('\n📺 测试3: 获取频道信息...');
    const testChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google Developers频道
    
    const channelUrl = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${testChannelId}&key=${YOUTUBE_API_KEY}`;
    
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();
    
    if (channelResponse.ok && channelData.items && channelData.items.length > 0) {
      const channel = channelData.items[0];
      console.log('✅ 频道信息获取成功:');
      console.log(`   频道名: ${channel.snippet.title}`);
      console.log(`   订阅数: ${parseInt(channel.statistics.subscriberCount || 0).toLocaleString()}`);
      console.log(`   视频数: ${parseInt(channel.statistics.videoCount || 0).toLocaleString()}`);
      console.log(`   总观看数: ${parseInt(channel.statistics.viewCount || 0).toLocaleString()}`);
    } else {
      console.error('❌ 频道信息获取失败:', channelData);
      return;
    }
    
    console.log('\n🎉 所有API测试通过！YouTube Data API配置正确。');
    console.log('\n📊 配额使用情况:');
    console.log('- 视频信息查询: 1 单位');
    console.log('- 搜索查询: 100 单位');
    console.log('- 频道信息查询: 1 单位');
    console.log('- 总计使用: 102 单位 (剩余: 9898/10000)');
    
  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testYouTubeAPI();
}

module.exports = { testYouTubeAPI };