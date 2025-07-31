import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/analytics/dashboard - 获取用户的所有仪表板
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 获取用户的仪表板列表
    const { data: dashboards, error } = await supabase
      .from('yt_dashboards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 如果没有仪表板，创建一个默认的
    if (!dashboards || dashboards.length === 0) {
      const defaultDashboard = await createDefaultDashboard(userId);
      return NextResponse.json({
        success: true,
        data: [defaultDashboard]
      });
    }

    return NextResponse.json({
      success: true,
      data: dashboards
    });

  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/dashboard - 创建新仪表板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      title, 
      description, 
      config = {}, 
      layout = {}, 
      data_sources = [],
      is_public = false 
    } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: 'User ID and title are required' },
        { status: 400 }
      );
    }

    // 验证用户存在
    const { data: user, error: userError } = await supabase
      .from('yt_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 创建仪表板
    const dashboardData = {
      user_id: userId,
      title: title.trim(),
      description: description?.trim() || '',
      config: {
        theme: 'default',
        refresh_interval: 300, // 5分钟
        widgets: [],
        ...config
      },
      layout: {
        columns: 12,
        rows: 'auto',
        gap: 16,
        ...layout
      },
      data_sources: Array.isArray(data_sources) ? data_sources : [],
      is_public,
      share_token: is_public ? generateShareToken() : null,
      permissions: {
        can_edit: true,
        can_share: true,
        can_delete: true
      }
    };

    const { data: newDashboard, error: createError } = await supabase
      .from('yt_dashboards')
      .insert(dashboardData)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({
      success: true,
      data: newDashboard,
      message: 'Dashboard created successfully'
    });

  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}

// 创建默认仪表板的辅助函数
async function createDefaultDashboard(userId: string) {
  const defaultConfig = {
    theme: 'default',
    refresh_interval: 300,
    widgets: [
      {
        id: 'overview-stats',
        type: 'stats',
        title: 'Overview Statistics',
        position: { x: 0, y: 0, w: 12, h: 2 },
        config: {
          metrics: ['channels', 'videos', 'views', 'comments']
        }
      },
      {
        id: 'recent-videos',
        type: 'table',
        title: 'Recent Videos',
        position: { x: 0, y: 2, w: 8, h: 4 },
        config: {
          source: 'videos',
          limit: 10,
          columns: ['title', 'views', 'likes', 'published_at']
        }
      },
      {
        id: 'channel-performance',
        type: 'chart',
        title: 'Channel Performance',
        position: { x: 8, y: 2, w: 4, h: 4 },
        config: {
          chart_type: 'bar',
          source: 'channels',
          x_axis: 'title',
          y_axis: 'subscriber_count'
        }
      }
    ]
  };

  const defaultLayout = {
    columns: 12,
    rows: 'auto',
    gap: 16
  };

  const dashboardData = {
    user_id: userId,
    title: 'My Analytics Dashboard',
    description: 'Default analytics dashboard with key metrics and insights',
    config: defaultConfig,
    layout: defaultLayout,
    data_sources: ['channels', 'videos', 'comments'],
    is_public: false,
    permissions: {
      can_edit: true,
      can_share: true,
      can_delete: true
    }
  };

  const { data: dashboard, error } = await supabase
    .from('yt_dashboards')
    .insert(dashboardData)
    .select()
    .single();

  if (error) {
    console.error('Error creating default dashboard:', error);
    throw error;
  }

  return dashboard;
}

// 生成分享令牌的辅助函数
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}