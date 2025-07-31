import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/stats - 获取管理员统计数据
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

    // 验证用户是否有管理员权限
    const { data: user, error: userError } = await supabase
      .from('yt_users')
      .select('id, email, plan')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查管理员权限（这里简化为企业版用户或特定邮箱）
    if (user.plan !== 'enterprise' && user.email !== 'admin@example.com') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    // 获取统计数据
    const stats = await gatherSystemStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}

async function gatherSystemStats() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 并行获取所有统计数据
  const [
    totalUsersResult,
    activeUsersResult,
    totalTeamsResult,
    totalAnalysesResult,
    totalReportsResult,
    apiCallsTodayResult,
    errorCountTodayResult
  ] = await Promise.allSettled([
    // 总用户数
    supabase
      .from('yt_users')
      .select('id', { count: 'exact', head: true }),

    // 活跃用户数（最近30天有活动）
    supabase
      .from('yt_users')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', last30Days.toISOString()),

    // 总团队数
    supabase
      .from('yt_teams')
      .select('id', { count: 'exact', head: true }),

    // 总分析数
    supabase
      .from('yt_scraping_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),

    // 总报告数
    supabase
      .from('yt_reports')
      .select('id', { count: 'exact', head: true }),

    // 今日API调用数（模拟数据，实际应该从日志系统获取）
    Promise.resolve({ count: Math.floor(Math.random() * 10000) + 5000 }),

    // 今日错误数（模拟数据，实际应该从错误日志获取）
    Promise.resolve({ count: Math.floor(Math.random() * 20) + 2 })
  ]);

  // 计算存储使用量（模拟数据，实际应该从存储系统获取）
  const storageUsed = Math.floor(Math.random() * 5 * 1024 * 1024 * 1024) + 1024 * 1024 * 1024; // 1-6GB

  return {
    total_users: getResultCount(totalUsersResult),
    active_users: getResultCount(activeUsersResult),
    total_teams: getResultCount(totalTeamsResult),
    total_analyses: getResultCount(totalAnalysesResult),
    total_reports: getResultCount(totalReportsResult),
    storage_used: storageUsed,
    api_calls_today: getResultCount(apiCallsTodayResult),
    error_count_today: getResultCount(errorCountTodayResult)
  };
}

function getResultCount(result: PromiseSettledResult<any>): number {
  if (result.status === 'fulfilled') {
    return result.value?.count || 0;
  }
  return 0;
}

// POST /api/admin/stats - 手动刷新统计数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证管理员权限
    const { data: user, error: userError } = await supabase
      .from('yt_users')
      .select('id, email, plan')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.plan !== 'enterprise' && user.email !== 'admin@example.com') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    // 刷新统计数据
    const stats = await gatherSystemStats();

    // 记录刷新操作（可选）
    try {
      await supabase.from('yt_admin_actions').insert({
        admin_id: userId,
        action: 'refresh_stats',
        details: { stats },
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Statistics refreshed successfully'
    });

  } catch (error) {
    console.error('Error refreshing admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh statistics' },
      { status: 500 }
    );
  }
}