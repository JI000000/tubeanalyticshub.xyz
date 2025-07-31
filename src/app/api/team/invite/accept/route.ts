import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/team/invite/accept - 获取邀请详情
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // 获取邀请详情
    const { data: invitation, error: inviteError } = await supabase
      .from('yt_team_invitations')
      .select(`
        id,
        team_id,
        invitee_email,
        role,
        status,
        expires_at,
        created_at,
        yt_teams (
          id,
          name,
          description,
          owner_id
        )
      `)
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // 检查邀请是否过期
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // 检查邀请状态
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `This invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invitation
    });

  } catch (error) {
    console.error('Error fetching invitation details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}

// POST /api/team/invite/accept - 接受邀请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userId } = body;

    if (!token || !userId) {
      return NextResponse.json(
        { success: false, error: 'Token and user ID are required' },
        { status: 400 }
      );
    }

    // 获取邀请详情
    const { data: invitation, error: inviteError } = await supabase
      .from('yt_team_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // 检查邀请是否过期
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // 检查邀请状态
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `This invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    // 验证用户存在
    const { data: user, error: userError } = await supabase
      .from('yt_users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 验证邮箱匹配
    if (user.email.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email address does not match the invitation' },
        { status: 400 }
      );
    }

    // 检查用户是否已经是团队成员
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('yt_team_members')
      .select('status')
      .eq('team_id', invitation.team_id)
      .eq('user_id', userId)
      .single();

    if (!memberCheckError && existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json(
          { success: false, error: 'You are already a member of this team' },
          { status: 400 }
        );
      }
      
      // 如果用户之前被移除，重新激活成员身份
      const { error: reactivateError } = await supabase
        .from('yt_team_members')
        .update({
          status: 'active',
          role: invitation.role,
          joined_at: new Date().toISOString()
        })
        .eq('team_id', invitation.team_id)
        .eq('user_id', userId);

      if (reactivateError) {
        throw reactivateError;
      }
    } else {
      // 添加用户到团队
      const { error: memberError } = await supabase
        .from('yt_team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: userId,
          role: invitation.role,
          status: 'active',
          permissions: getDefaultPermissions(invitation.role)
        });

      if (memberError) {
        throw memberError;
      }
    }

    // 更新邀请状态
    const { error: updateError } = await supabase
      .from('yt_team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the team',
      data: {
        team_id: invitation.team_id,
        role: invitation.role
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}

// 获取角色默认权限
function getDefaultPermissions(role: string) {
  switch (role) {
    case 'owner':
      return {
        can_invite: true,
        can_manage_members: true,
        can_edit_team: true,
        can_delete_team: true,
        can_view_analytics: true,
        can_create_reports: true,
        can_manage_settings: true
      };
    case 'admin':
      return {
        can_invite: true,
        can_manage_members: true,
        can_edit_team: true,
        can_delete_team: false,
        can_view_analytics: true,
        can_create_reports: true,
        can_manage_settings: false
      };
    case 'member':
      return {
        can_invite: false,
        can_manage_members: false,
        can_edit_team: false,
        can_delete_team: false,
        can_view_analytics: true,
        can_create_reports: true,
        can_manage_settings: false
      };
    case 'viewer':
      return {
        can_invite: false,
        can_manage_members: false,
        can_edit_team: false,
        can_delete_team: false,
        can_view_analytics: true,
        can_create_reports: false,
        can_manage_settings: false
      };
    default:
      return {
        can_invite: false,
        can_manage_members: false,
        can_edit_team: false,
        can_delete_team: false,
        can_view_analytics: true,
        can_create_reports: false,
        can_manage_settings: false
      };
  }
}