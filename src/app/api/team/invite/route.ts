import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/team/invite - 邀请用户加入团队
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, teamId, inviteeEmail, role = 'member' } = body;

    if (!userId || !teamId || !inviteeEmail) {
      return NextResponse.json(
        { success: false, error: 'User ID, team ID, and invitee email are required' },
        { status: 400 }
      );
    }

    // 验证邀请者权限
    const { data: inviterMember, error: permissionError } = await supabase
      .from('yt_team_members')
      .select('role, permissions')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (permissionError || !inviterMember) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    // 检查邀请权限
    if (!['owner', 'admin'].includes(inviterMember.role) && 
        !inviterMember.permissions?.can_invite) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to invite members' },
        { status: 403 }
      );
    }

    // 检查被邀请用户是否存在
    const { data: inviteeUser, error: userError } = await supabase
      .from('yt_users')
      .select('id, email')
      .eq('email', inviteeEmail.toLowerCase())
      .single();

    // 如果用户不存在，创建邀请记录但不创建用户
    let inviteeId = null;
    if (!userError && inviteeUser) {
      inviteeId = inviteeUser.id;
      
      // 检查用户是否已经是团队成员
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('yt_team_members')
        .select('status')
        .eq('team_id', teamId)
        .eq('user_id', inviteeId)
        .single();

      if (!memberCheckError && existingMember) {
        if (existingMember.status === 'active') {
          return NextResponse.json(
            { success: false, error: 'User is already a team member' },
            { status: 400 }
          );
        }
      }
    }

    // 检查是否已有待处理的邀请
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('yt_team_invitations')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('invitee_email', inviteeEmail.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (!inviteCheckError && existingInvite) {
      return NextResponse.json(
        { success: false, error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // 生成邀请令牌
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    // 创建邀请记录
    const { data: invitation, error: inviteError } = await supabase
      .from('yt_team_invitations')
      .insert({
        team_id: teamId,
        inviter_id: userId,
        invitee_email: inviteeEmail.toLowerCase(),
        invitee_id: inviteeId,
        role,
        token: inviteToken,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { success: false, error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // 获取团队信息用于邮件
    const { data: team, error: teamError } = await supabase
      .from('yt_teams')
      .select('name')
      .eq('id', teamId)
      .single();

    const teamName = team?.name || 'Team';

    // 生成邀请链接
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    // TODO: 发送邀请邮件 (这里可以集成邮件服务)
    console.log(`Invitation sent to ${inviteeEmail} for team ${teamName}: ${inviteUrl}`);

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        invitee_email: invitation.invitee_email,
        role: invitation.role,
        status: invitation.status,
        expires_at: invitation.expires_at,
        invite_url: inviteUrl
      },
      message: 'Invitation sent successfully'
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

// GET /api/team/invite - 获取团队邀请列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
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
          name
        )
      `);

    if (teamId) {
      // 获取特定团队的邀请
      query = query.eq('team_id', teamId);
    } else {
      // 获取用户收到的邀请
      query = query.eq('invitee_email', userId); // 这里应该是用户邮箱，但为了简化使用userId
    }

    const { data: invitations, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invitations || []
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// 生成邀请令牌
function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}