import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/analytics/insights/[id] - 获取特定洞察详情
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

    // 获取洞察详情
    const { data: insight, error } = await supabase
      .from('yt_ai_insights')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Insight not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // 获取相关的目标数据（视频或频道）
    let targetData = null;
    if (insight.target_type === 'video') {
      const { data: video } = await supabase
        .from('yt_videos')
        .select('id, title, view_count, like_count, comment_count, published_at, channel_title')
        .eq('id', insight.target_id)
        .single();
      targetData = video;
    } else if (insight.target_type === 'channel') {
      const { data: channel } = await supabase
        .from('yt_channels')
        .select('id, title, subscriber_count, video_count, view_count')
        .eq('id', insight.target_id)
        .single();
      targetData = channel;
    }

    // 格式化洞察数据
    const formattedInsight = {
      id: insight.id,
      type: insight.analysis_type,
      category: insight.insight_category,
      title: insight.insights.title || 'AI Insight',
      description: insight.insights.description || '',
      confidence_score: insight.confidence_score,
      importance: insight.insight_category,
      target: {
        id: insight.target_id,
        type: insight.target_type,
        data: targetData
      },
      recommendations: insight.actionable_recommendations || [],
      metadata: insight.insights.metadata || {},
      created_at: insight.created_at,
      expires_at: insight.expires_at
    };

    return NextResponse.json({
      success: true,
      data: formattedInsight
    });

  } catch (error) {
    console.error('Error fetching insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insight' },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/insights/[id] - 更新洞察（如标记为已读、有用等）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, action, feedback } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证洞察存在
    const { data: insight, error: checkError } = await supabase
      .from('yt_ai_insights')
      .select('id, insights')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !insight) {
      return NextResponse.json(
        { success: false, error: 'Insight not found or access denied' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'mark_read':
        updateData = {
          insights: {
            ...insight.insights,
            read_at: new Date().toISOString()
          }
        };
        break;

      case 'mark_useful':
        updateData = {
          insights: {
            ...insight.insights,
            user_feedback: {
              ...insight.insights.user_feedback,
              useful: true,
              feedback_at: new Date().toISOString()
            }
          }
        };
        break;

      case 'mark_not_useful':
        updateData = {
          insights: {
            ...insight.insights,
            user_feedback: {
              ...insight.insights.user_feedback,
              useful: false,
              feedback: feedback || '',
              feedback_at: new Date().toISOString()
            }
          }
        };
        break;

      case 'archive':
        updateData = {
          insights: {
            ...insight.insights,
            archived: true,
            archived_at: new Date().toISOString()
          }
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // 更新洞察
    const { data: updatedInsight, error: updateError } = await supabase
      .from('yt_ai_insights')
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
      data: updatedInsight,
      message: `Insight ${action.replace('_', ' ')} successfully`
    });

  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}

// DELETE /api/analytics/insights/[id] - 删除洞察
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

    // 删除洞察
    const { data: deletedInsight, error: deleteError } = await supabase
      .from('yt_ai_insights')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Insight not found or access denied' },
          { status: 404 }
        );
      }
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      data: deletedInsight,
      message: 'Insight deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete insight' },
      { status: 500 }
    );
  }
}