import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/analytics/reports/[id] - 获取特定报告
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const shareToken = searchParams.get('token');

    // 如果有分享令牌，验证公开访问
    if (shareToken) {
      const { data: report, error } = await supabase
        .from('yt_reports')
        .select('*')
        .eq('id', id)
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();

      if (error || !report) {
        return NextResponse.json(
          { success: false, error: 'Report not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: report,
        shared: true
      });
    }

    // 正常用户访问
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: report, error } = await supabase
      .from('yt_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Report not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/reports/[id] - 更新报告
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, title, content, metadata, is_public } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证用户权限
    const { data: existingReport, error: checkError } = await supabase
      .from('yt_reports')
      .select('id, user_id, version')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingReport) {
      return NextResponse.json(
        { success: false, error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    // 准备更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
      version: existingReport.version + 1
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (is_public !== undefined) {
      updateData.is_public = is_public;
      if (is_public && !existingReport.share_token) {
        updateData.share_token = generateShareToken();
      }
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

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: 'Report updated successfully'
    });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE /api/analytics/reports/[id] - 删除报告
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
    const { data: deletedReport, error: deleteError } = await supabase
      .from('yt_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Report not found or access denied' },
          { status: 404 }
        );
      }
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      data: deletedReport,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}

// 生成分享令牌的辅助函数
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}