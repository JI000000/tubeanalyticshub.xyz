import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/analytics/dashboard/[id] - 获取特定仪表板
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 获取仪表板基本信息
    const { data: dashboard, error: dashboardError } = await supabase
      .from('yt_dashboards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (dashboardError) {
      if (dashboardError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Dashboard not found' },
          { status: 404 }
        );
      }
      throw dashboardError;
    }

    // 获取仪表板相关的数据
    const dashboardData = await generateDashboardData(userId, dashboard.config);

    return NextResponse.json({
      success: true,
      data: {
        ...dashboard,
        data: dashboardData,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/dashboard/[id] - 更新仪表板
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, title, description, config, layout, data_sources } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证用户权限
    const { data: existingDashboard, error: checkError } = await supabase
      .from('yt_dashboards')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingDashboard) {
      return NextResponse.json(
        { success: false, error: 'Dashboard not found or access denied' },
        { status: 404 }
      );
    }

    // 更新仪表板
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (config !== undefined) updateData.config = config;
    if (layout !== undefined) updateData.layout = layout;
    if (data_sources !== undefined) updateData.data_sources = data_sources;

    const { data: updatedDashboard, error: updateError } = await supabase
      .from('yt_dashboards')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: updatedDashboard,
      message: 'Dashboard updated successfully'
    });

  } catch (error) {
    console.error('Error updating dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}

// DELETE /api/analytics/dashboard/[id] - 删除仪表板
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证用户权限并删除
    const { data: deletedDashboard, error: deleteError } = await supabase
      .from('yt_dashboards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Dashboard not found or access denied' },
          { status: 404 }
        );
      }
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      data: deletedDashboard,
      message: 'Dashboard deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete dashboard' },
      { status: 500 }
    );
  }
}

// 生成仪表板数据的辅助函数
async function generateDashboardData(userId: string, config: any) {
  try {
    // 获取基础统计数据
    const [channelsResult, videosResult, commentsResult] = await Promise.all([
      supabase
        .from('yt_channels')
        .select('id, title, subscriber_count, video_count, view_count')
        .eq('user_id', userId),
      supabase
        .from('yt_videos')
        .select('id, title, view_count, like_count, comment_count, published_at')
        .eq('user_id', userId)
        .order('published_at', { ascending: false }),
      supabase
        .from('yt_comments')
        .select('id, sentiment')
        .in('video_id', 
          supabase
            .from('yt_videos')
            .select('id')
            .eq('user_id', userId)
        )
    ]);

    const channels = channelsResult.data || [];
    const videos = videosResult.data || [];
    const comments = commentsResult.data || [];

    // 计算统计指标
    const totalChannels = channels.length;
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.like_count || 0), 0);
    const totalComments = comments.length;

    // 计算参与度
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100) : 0;

    // 最近30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVideos = videos.filter(v => 
      new Date(v.published_at) > thirtyDaysAgo
    );

    // 情感分析统计
    const sentimentStats = {
      positive: comments.filter(c => c.sentiment === 'positive').length,
      negative: comments.filter(c => c.sentiment === 'negative').length,
      neutral: comments.filter(c => c.sentiment === 'neutral').length
    };

    // 热门视频 (按观看量排序)
    const topVideos = videos
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5)
      .map(v => ({
        id: v.id,
        title: v.title,
        views: v.view_count || 0,
        likes: v.like_count || 0,
        comments: v.comment_count || 0
      }));

    // 频道表现
    const channelPerformance = channels.map(c => ({
      id: c.id,
      title: c.title,
      subscribers: c.subscriber_count || 0,
      videos: c.video_count || 0,
      views: c.view_count || 0
    }));

    return {
      overview: {
        totalChannels,
        totalVideos,
        totalViews,
        totalLikes,
        totalComments,
        engagementRate: parseFloat(engagementRate.toFixed(2))
      },
      recent: {
        videosLast30Days: recentVideos.length,
        avgViewsRecent: recentVideos.length > 0 
          ? Math.round(recentVideos.reduce((sum, v) => sum + (v.view_count || 0), 0) / recentVideos.length)
          : 0
      },
      sentiment: sentimentStats,
      topVideos,
      channelPerformance,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    return {
      overview: { totalChannels: 0, totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0, engagementRate: 0 },
      recent: { videosLast30Days: 0, avgViewsRecent: 0 },
      sentiment: { positive: 0, negative: 0, neutral: 0 },
      topVideos: [],
      channelPerformance: [],
      lastUpdated: new Date().toISOString()
    };
  }
}