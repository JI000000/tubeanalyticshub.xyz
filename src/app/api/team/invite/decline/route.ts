import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/team/invite/decline - 拒绝邀请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // 获取邀请详情
    const { data: invitation, error: inviteError } = await supabase
      .from('yt_team_invitations')
      .select('id, status, expires_at')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // 检查邀请状态
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `This invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    // 更新邀请状态为拒绝
    const { error: updateError } = await supabase
      .from('yt_team_invitations')
      .update({
        status: 'declined'
      })
      .eq('id', invitation.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation declined successfully'
    });

  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to decline invitation' },
      { status: 500 }
    );
  }
}