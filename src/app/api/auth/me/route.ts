import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/auth/me - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // 解析令牌获取用户ID（演示用）
    const userId = parseSessionToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const { data: user, error } = await supabase
      .from('yt_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 获取用户统计信息
    const [channelsResult, videosResult, reportsResult, insightsResult] = await Promise.all([
      supabase.from('yt_channels').select('id').eq('user_id', userId),
      supabase.from('yt_videos').select('id').eq('user_id', userId),
      supabase.from('yt_reports').select('id').eq('user_id', userId),
      supabase.from('yt_ai_insights').select('id').eq('user_id', userId)
    ]);

    const stats = {
      channels: channelsResult.data?.length || 0,
      videos: videosResult.data?.length || 0,
      reports: reportsResult.data?.length || 0,
      insights: insightsResult.data?.length || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          quota_used: user.quota_used,
          quota_limit: user.quota_limit,
          preferences: user.preferences,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        stats
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/me - 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const userId = parseSessionToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences, plan } = body;

    // 准备更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (preferences) {
      updateData.preferences = preferences;
    }

    if (plan && ['free', 'pro', 'enterprise'].includes(plan)) {
      updateData.plan = plan;
      // 根据计划调整配额
      switch (plan) {
        case 'free':
          updateData.quota_limit = 50;
          break;
        case 'pro':
          updateData.quota_limit = 500;
          break;
        case 'enterprise':
          updateData.quota_limit = 5000;
          break;
      }
    }

    // 更新用户信息
    const { data: updatedUser, error } = await supabase
      .from('yt_users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          plan: updatedUser.plan,
          quota_used: updatedUser.quota_used,
          quota_limit: updatedUser.quota_limit,
          preferences: updatedUser.preferences,
          updated_at: updatedUser.updated_at
        }
      },
      message: 'User information updated successfully'
    });

  } catch (error) {
    console.error('Update user info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user information' },
      { status: 500 }
    );
  }
}

// 解析会话令牌的辅助函数（演示用）
function parseSessionToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // 检查令牌是否过期（7天）
    const tokenAge = Date.now() - payload.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    
    if (tokenAge > maxAge) {
      return null;
    }
    
    return payload.userId;
  } catch (error) {
    return null;
  }
}