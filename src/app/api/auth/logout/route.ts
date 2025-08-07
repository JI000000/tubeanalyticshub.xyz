import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { LoginAnalyticsService } from '@/lib/login-analytics';
import { createSupabaseServiceClient } from '@/lib/supabase';

/**
 * POST /api/auth/logout
 * 处理服务端登出逻辑，记录分析数据和清理服务端状态
 */
export async function POST(request: NextRequest) {
  try {
    // 获取当前会话
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated', code: 'NOT_AUTHENTICATED' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json().catch(() => ({}));
    const {
      reason = 'user_initiated',
      metadata = {},
      fingerprint,
    } = body;

    const userId = session.user.id;
    const supabase = createSupabaseServiceClient();

    // 1. 记录登出分析数据
    try {
      await LoginAnalyticsService.recordEvent('signout', {
        user_id: userId,
        fingerprint,
        context: {
          reason,
          logout_time: new Date().toISOString(),
          user_agent: request.headers.get('user-agent') || undefined,
          ip_address: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined,
          ...metadata,
        },
      });
    } catch (analyticsError) {
      console.error('Failed to record logout analytics:', analyticsError);
      // 不阻止登出流程
    }

    // 2. 清理服务端会话数据
    try {
      // 清理自定义用户会话（如果存在）
      await supabase
        .from('yt_user_sessions')
        .delete()
        .eq('user_id', userId);

      // 记录会话结束时间
      await supabase
        .from('yt_login_analytics')
        .insert({
          user_id: userId,
          event_type: 'session_end',
          context: {
            reason,
            end_time: new Date().toISOString(),
          },
        });
    } catch (cleanupError) {
      console.error('Failed to cleanup server session data:', cleanupError);
      // 不阻止登出流程
    }

    // 3. 更新用户最后活动时间
    try {
      await supabase
        .from('yt_users')
        .update({
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('nextauth_user_id', userId);
    } catch (updateError) {
      console.error('Failed to update user last activity:', updateError);
      // 不阻止登出流程
    }

    return NextResponse.json({
      success: true,
      message: 'Logout processed successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Logout API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'LOGOUT_ERROR',
        message: '登出处理失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout/stats
 * 获取登出统计数据（管理员功能）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated', code: 'NOT_AUTHENTICATED' },
        { status: 401 }
      );
    }

    // 检查管理员权限（这里简化处理，实际应该检查用户角色）
    const isAdmin = session.user.email?.endsWith('@admin.com'); // 示例权限检查
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 获取登出统计数据
    const { data: logoutEvents, error } = await supabase
      .from('yt_login_analytics')
      .select('event_type, context, created_at, user_id')
      .eq('event_type', 'signout')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 统计数据
    const stats = {
      total_logouts: logoutEvents?.length || 0,
      by_reason: {} as Record<string, number>,
      by_day: {} as Record<string, number>,
      unique_users: new Set(logoutEvents?.map(e => e.user_id)).size,
      recent_logouts: logoutEvents?.slice(0, 10).map(event => ({
        user_id: event.user_id,
        reason: event.context?.reason || 'unknown',
        timestamp: event.created_at,
      })) || [],
    };

    // 按原因分组
    logoutEvents?.forEach(event => {
      const reason = event.context?.reason || 'unknown';
      stats.by_reason[reason] = (stats.by_reason[reason] || 0) + 1;
    });

    // 按日期分组
    logoutEvents?.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      stats.by_day[date] = (stats.by_day[date] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: stats,
      period: `${days} days`,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Logout stats API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get logout stats',
        code: 'STATS_ERROR',
      },
      { status: 500 }
    );
  }
}