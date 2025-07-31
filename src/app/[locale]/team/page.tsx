'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Mail, Crown, Shield, Edit, Trash2, Settings, UserPlus, Calendar, MoreVertical, Check, X } from 'lucide-react';

interface TeamMember {
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'removed';
  joined_at: string;
  permissions: string[];
  yt_users: {
    id: string;
    email: string;
    plan: string;
  };
}

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  members: TeamMember[];
  userRole: string;
}

export default function TeamPage() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' as const });

  const userId = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockTeams: Team[] = [
        {
          id: 'team-1',
          name: 'Content Team',
          description: 'Main content creation and analysis team',
          owner_id: userId,
          created_at: '2024-01-01T00:00:00Z',
          userRole: 'owner',
          members: [
            {
              user_id: userId,
              role: 'owner',
              status: 'active',
              joined_at: '2024-01-01T00:00:00Z',
              permissions: ['all'],
              yt_users: {
                id: userId,
                email: 'owner@example.com',
                plan: 'pro'
              }
            },
            {
              user_id: 'user-2',
              role: 'editor',
              status: 'active',
              joined_at: '2024-01-05T00:00:00Z',
              permissions: ['edit', 'view'],
              yt_users: {
                id: 'user-2',
                email: 'editor@example.com',
                plan: 'basic'
              }
            }
          ]
        }
      ];
      
      setTeams(mockTeams);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeam.name.trim()) return;
    
    try {
      // Mock team creation
      const newTeamData: Team = {
        id: `team-${Date.now()}`,
        name: newTeam.name,
        description: newTeam.description,
        owner_id: userId,
        created_at: new Date().toISOString(),
        userRole: 'owner',
        members: [{
          user_id: userId,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
          permissions: ['all'],
          yt_users: {
            id: userId,
            email: 'owner@example.com',
            plan: 'pro'
          }
        }]
      };
      
      setTeams(prev => [newTeamData, ...prev]);
      setShowCreateForm(false);
      setNewTeam({ name: '', description: '' });
      alert('Team created successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Error occurred while creating team');
    }
  };

  const inviteMember = async (teamId: string) => {
    if (!inviteData.email.trim()) return;
    
    try {
      console.log('Inviting member:', inviteData.email, 'to team:', teamId);
      setShowInviteForm(null);
      setInviteData({ email: '', role: 'member' });
      alert('Invitation sent');
    } catch (error) {
      console.error('Error:', error);
      alert('Error occurred while inviting member');
    }
  };

  const removeMember = async (teamId: string, memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? { ...team, members: team.members.filter(m => m.user_id !== memberId) }
          : team
      ));
      alert('Member removed');
    } catch (error) {
      console.error('Error:', error);
      alert('Error occurred while removing member');
    }
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      owner: <Crown className="h-4 w-4 text-yellow-600" />,
      admin: <Shield className="h-4 w-4 text-blue-600" />,
      editor: <Edit className="h-4 w-4 text-green-600" />,
      member: <Users className="h-4 w-4 text-gray-600" />,
      viewer: <Users className="h-4 w-4 text-gray-400" />
    };
    return icons[role as keyof typeof icons] || icons.member;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      owner: "Owner",
      admin: "Admin", 
      editor: "Editor",
      member: "Member",
      viewer: "Viewer"
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-blue-100 text-blue-800',
      editor: 'bg-green-100 text-green-800',
      member: 'bg-gray-100 text-gray-800',
      viewer: 'bg-gray-50 text-gray-600'
    };
    return colors[role as keyof typeof colors] || colors.member;
  };

  const canInviteMembers = (userRole: string) => {
    return ['owner', 'admin'].includes(userRole);
  };

  const canRemoveMembers = (userRole: string) => {
    return ['owner', 'admin'].includes(userRole);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-500">Manage your team members and collaboration permissions</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                <Input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Enter Team Name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Description (Optional)</label>
                <Textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Describe the purpose and responsibilities of the team..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTeam} disabled={!newTeam.name}>
                  Create Team
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams List */}
        {teams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first team to start collaborating with colleagues on YouTube data analysis
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create first team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {team.name}
                      </CardTitle>
                      {team.description && (
                        <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(team.userRole)}>
                        {getRoleIcon(team.userRole)}
                        <span className="ml-1">{getRoleLabel(team.userRole)}</span>
                      </Badge>
                      {canInviteMembers(team.userRole) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowInviteForm(team.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Invite Member
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Invite Form */}
                  {showInviteForm === team.id && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Invite New Member</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          placeholder="Enter email address..."
                          value={inviteData.email}
                          onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                        />
                        <select
                          value={inviteData.role}
                          onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as any })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => inviteMember(team.id)}
                            disabled={!inviteData.email}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Send Invitation
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowInviteForm(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Team Members ({team.members.length})</h4>
                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {member.yt_users.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{member.yt_users.email}</div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                Joined on {new Date(member.joined_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleColor(member.role)}>
                              {getRoleIcon(member.role)}
                              <span className="ml-1">{getRoleLabel(member.role)}</span>
                            </Badge>
                            {canRemoveMembers(team.userRole) && 
                             member.role !== 'owner' && 
                             member.user_id !== userId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMember(team.id, member.user_id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{team.members.length}</div>
                        <div className="text-sm text-gray-500">Total Members</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {team.members.filter(m => m.status === 'active').length}
                        </div>
                        <div className="text-sm text-gray-500">Active Members</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">
                          {new Date(team.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">Created Date</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}