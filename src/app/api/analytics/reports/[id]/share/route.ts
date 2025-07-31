import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/analytics/reports/[id]/share - 创建或更新报告分享
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, is_public, expires_at, password } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证用户权限
    const { data: report, error: checkError } = await supabase
      .from('yt_reports')
      .select('id, user_id, share_token, is_public')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !report) {
      return NextResponse.json(
        { success: false, error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    // 生成或更新分享令牌
    let shareToken = report.share_token;
    if (!shareToken || !report.is_public) {
      shareToken = generateShareToken();
    }

    // 更新报告分享设置
    const updateData: any = {
      is_public: is_public ?? true,
      share_token: shareToken,
      updated_at: new Date().toISOString()
    };

    // 如果设置了过期时间，添加到metadata中
    if (expires_at) {
      updateData.metadata = {
        ...report.metadata,
        share_expires_at: expires_at,
        share_password: password ? hashPassword(password) : null
      };
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from('yt_reports')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 生成分享链接
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/shared/report/${id}?token=${shareToken}`;

    return NextResponse.json({
      success: true,
      data: {
        report_id: id,
        share_token: shareToken,
        share_url: shareUrl,
        is_public: updateData.is_public,
        expires_at: expires_at || null,
        has_password: !!password,
        created_at: new Date().toISOString()
      },
      message: 'Report sharing configured successfully'
    });

  } catch (error) {
    console.error('Error configuring report sharing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure report sharing' },
      { status: 500 }
    );
  }
}

// GET /api/analytics/reports/[id]/share - 获取分享信息
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

    // 获取报告分享信息
    const { data: report, error } = await supabase
      .from('yt_reports')
      .select('id, title, is_public, share_token, metadata, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { success: false, error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = report.share_token 
      ? `${baseUrl}/shared/report/${id}?token=${report.share_token}`
      : null;

    return NextResponse.json({
      success: true,
      data: {
        report_id: id,
        title: report.title,
        is_public: report.is_public,
        share_token: report.share_token,
        share_url: shareUrl,
        expires_at: report.metadata?.share_expires_at || null,
        has_password: !!report.metadata?.share_password,
        created_at: report.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching share info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch share information' },
      { status: 500 }
    );
  }
}

// DELETE /api/analytics/reports/[id]/share - 取消分享
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

    // 取消分享设置
    const { data: updatedReport, error: updateError } = await supabase
      .from('yt_reports')
      .update({
        is_public: false,
        share_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Report not found or access denied' },
          { status: 404 }
        );
      }
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: 'Report sharing disabled successfully'
    });

  } catch (error) {
    console.error('Error disabling report sharing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disable report sharing' },
      { status: 500 }
    );
  }
}

// 辅助函数
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function hashPassword(password: string): string {
  // 简单的密码哈希，生产环境应使用更安全的方法
  return Buffer.from(password).toString('base64');
}