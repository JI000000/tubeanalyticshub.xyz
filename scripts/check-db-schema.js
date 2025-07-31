#!/usr/bin/env node

/**
 * 检查数据库表结构
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 检查数据库表结构...');
  
  try {
    // 检查 yt_users 表结构
    const { data: users, error: usersError } = await supabase
      .from('yt_users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ yt_users 表错误:', usersError.message);
    } else {
      console.log('✅ yt_users 表存在');
    }
    
    // 检查 yt_channels 表结构
    const { data: channels, error: channelsError } = await supabase
      .from('yt_channels')
      .select('*')
      .limit(1);
    
    if (channelsError) {
      console.log('❌ yt_channels 表错误:', channelsError.message);
    } else {
      console.log('✅ yt_channels 表存在');
    }
    
    // 检查 yt_videos 表结构
    const { data: videos, error: videosError } = await supabase
      .from('yt_videos')
      .select('*')
      .limit(1);
    
    if (videosError) {
      console.log('❌ yt_videos 表错误:', videosError.message);
    } else {
      console.log('✅ yt_videos 表存在');
    }
    
    // 检查 yt_comments 表结构
    const { data: comments, error: commentsError } = await supabase
      .from('yt_comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.log('❌ yt_comments 表错误:', commentsError.message);
    } else {
      console.log('✅ yt_comments 表存在');
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
}

checkSchema();