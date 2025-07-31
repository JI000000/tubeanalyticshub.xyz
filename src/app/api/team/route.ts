import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/team - 获取用户的团队列表
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

    // 构建查询条件
    let query = supabase
      .from('yt_team_members')
      .select(`
        team_id,
        role,
        status,
        joined_at,
        permissions,
        yt_teams (
          id,
          name,
          description,
          owner_id,
          settings,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    // 如果指定了teamId，只获取该团队
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data: teamMembers, error: membersError } = await query;

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }

    // 格式化团队数据
    const teams = await Promise.all((teamMembers || []).map(async (member: any) => {
      const team = member.yt_teams;
      
      // 获取团队成员列表
      const { data: allMembers, error: allMembersError } = await supabase
        .from('yt_team_members')
        .select(`
          user_id,
          role,
          status,
          joined_at,
          permissions,
          yt_users (
            id,
            email,
            plan
          )
        `)
        .eq('team_id', team.id)
        .eq('status', 'active');

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        owner_id: team.owner_id,
        settings: team.settings,
        created_at: team.created_at,
        updated_at: team.updated_at,
        userRole: member.role,
        members: allMembers || [],
        memberCount: (allMembers || []).length
      };
    }));

    return NextResponse.json({
      success: true,
      data: teams
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/team - 创建新团队
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'User ID and team name are required' },
        { status: 400 }
      );
    }

    // 验证用户存在
    const { data: user, error: userError } = await supabase
      .from('yt_users')
      .select('id, plan')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查用户计划是否支持团队功能
    if (user.plan === 'free') {
      return NextResponse.json(
        { success: false, error: 'Team features require Pro or Enterprise plan' },
        { status: 403 }
      );
    }

    // 创建团队
    const { data: newTeam, error: teamError } = await supabase
      .from('yt_teams')
      .insert({
        name: name.trim(),
        description: description?.trim() || '',
        owner_id: userId,
        settings: {
          allow_member_invite: true,
          require_approval: false,
          default_role: 'member'
        }
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json(
        { success: false, error: 'Failed to create team' },
        { status: 500 }
      );
    }

    // 将创建者添加为团队所有者
    const { error: memberError } = await supabase
      .from('yt_team_members')
      .insert({
        team_id: newTeam.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
        permissions: {
          can_invite: true,
          can_manage_members: true,
          can_edit_team: true,
          can_delete_team: true,
          can_view_analytics: true,
          can_create_reports: true
        }
      });

    if (memberError) {
      console.error('Error adding team owner:', memberError);
      // 如果添加成员失败，删除已创建的团队
      await supabase.from('yt_teams').delete().eq('id', newTeam.id);
      return NextResponse.json(
        { success: false, error: 'Failed to create team' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newTeam.id,
        name: newTeam.name,
        description: newTeam.description,
        owner_id: newTeam.owner_id,
        created_at: newTeam.created_at,
        userRole: 'owner',
        memberCount: 1
      },
      message: 'Team created successfully'
    });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

// DELETE /api/team - 删除团队或移除成员
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');
    const memberId = searchParams.get('memberId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (memberId && teamId) {
      // 移除团队成员
      // 验证用户权限
      const { data: userMember, error: permissionError } = await supabase
        .from('yt_team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (permissionError || !userMember || !['owner', 'admin'].includes(userMember.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // 不能移除团队所有者
      const { data: targetMember, error: targetError } = await supabase
        .from('yt_team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', memberId)
        .single();

      if (targetError || !targetMember) {
        return NextResponse.json(
          { success: false, error: 'Member not found' },
          { status: 404 }
        );
      }

      if (targetMember.role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Cannot remove team owner' },
          { status: 400 }
        );
      }

      // 移除成员
      const { error: removeError } = await supabase
        .from('yt_team_members')
        .update({ status: 'removed' })
        .eq('team_id', teamId)
        .eq('user_id', memberId);

      if (removeError) {
        throw removeError;
      }

      return NextResponse.json({
        success: true,
        message: 'Member removed successfully'
      });

    } else if (teamId) {
      // 删除整个团队
      // 验证用户是团队所有者
      const { data: team, error: teamError } = await supabase
        .from('yt_teams')
        .select('owner_id')
        .eq('id', teamId)
        .single();

      if (teamError || !team || team.owner_id !== userId) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can delete the team' },
          { status: 403 }
        );
      }

      // 删除团队（级联删除会自动处理成员和邀请）
      const { error: deleteError } = await supabase
        .from('yt_teams')
        .delete()
        .eq('id', teamId);

      if (deleteError) {
        throw deleteError;
      }

      return NextResponse.json({
        success: true,
        message: 'Team deleted successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in team deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}