'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Settings, 
  Mail,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  RefreshCw,
  UserPlus,
  ArrowLeft,
  MoreVertical,
  Edit,
  Copy,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface TeamMember {
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  permissions: any;
  yt_users: {
    id: string;
    email: string;
    plan: string;
  };
}

interface TeamInvitation {
  id: string;
  invitee_email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  settings: any;
  created_at: string;
  updated_at: string;
  userRole: string;
  members: TeamMember[];
  memberCount: number;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { getUserId, user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const teamId = params.id as string;

  const fetchTeamDetails = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      const response = await fetch(`/api/team?userId=${userId}&teamId=${teamId}`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setTeam(result.data[0]);
      } else {
        setError('Team not found or access denied');
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const userId = getUserId();
      const response = await fetch(`/api/team/invite?userId=${userId}&teamId=${teamId}`);
      const result = await response.json();
      
      if (result.success) {
        setInvitations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const userId = getUserId();
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          teamId,
          inviteeEmail: inviteEmail.trim(),
          role: inviteRole
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Invitation sent successfully');
        setInviteEmail('');
        setShowInviteForm(false);
        fetchInvitations(); // Refresh invitations
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const userId = getUserId();
      const response = await fetch(`/api/team?userId=${userId}&teamId=${teamId}&memberId=${memberId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Member removed successfully');
        fetchTeamDetails(); // Refresh team data
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const copyInviteLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setSuccess('Invite link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy invite link:', error);
      setError('Failed to copy invite link');
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchTeamDetails();
      fetchInvitations();
    }
  }, [authLoading, isAuthenticated, teamId]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'member':
        return <User className="h-4 w-4 text-green-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageMembers = team && ['owner', 'admin'].includes(team.userRole);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!team) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Team not found or you do not have access to this team.'}
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">{team.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              fetchTeamDetails();
              fetchInvitations();
            }} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canManageMembers && (
              <Button onClick={() => setShowInviteForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite New Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={inviting}
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  {team.userRole === 'owner' && <option value="admin">Admin</option>}
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={inviteMember} 
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail('');
                    setError('');
                  }}
                  disabled={inviting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({team.memberCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="font-medium">{member.yt_users?.email || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                        {canManageMembers && member.role !== 'owner' && member.user_id !== getUserId() && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => removeMember(member.user_id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Invitations */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
                    <div key={invitation.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm truncate">{invitation.invitee_email}</p>
                        <Badge variant="outline" className="text-xs">
                          {invitation.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                      {canManageMembers && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => copyInviteLink(invitation.id)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                  ))}
                  {invitations.filter(inv => inv.status === 'pending').length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No pending invitations
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Team Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Created</p>
                  <p className="text-gray-600">{new Date(team.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Your Role</p>
                  <Badge className={getRoleBadgeColor(team.userRole)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(team.userRole)}
                      <span className="capitalize">{team.userRole}</span>
                    </div>
                  </Badge>
                </div>
                {team.userRole === 'owner' && (
                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}