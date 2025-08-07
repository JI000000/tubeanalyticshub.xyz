'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Settings, 
  Mail,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  RefreshCw,
  UserPlus
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  userRole: string;
  members: any[];
  memberCount: number;
  created_at: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { getUserId, user, isAuthenticated, loading: authLoading } = useAuth();
  const { requireAuth } = useSmartAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [error, setError] = useState('');

  // 处理团队协作访问
  const handleTeamCollaboration = async () => {
    const canProceed = await requireAuth('team_collaboration', {
      message: '团队协作功能需要登录，管理您的团队',
      urgency: 'medium',
      metadata: { type: 'team_collaboration' }
    });
    
    if (canProceed) {
      await fetchTeams();
    }
  };

  // 处理创建团队
  const handleCreateTeam = async () => {
    const canProceed = await requireAuth('team_collaboration', {
      message: '创建团队需要登录，开始团队协作',
      urgency: 'high',
      metadata: { type: 'create_team' }
    });
    
    if (canProceed) {
      await createTeam();
    }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      const response = await fetch(`/api/team?userId=${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setTeams(result.data || []);
      } else {
        console.error('Failed to fetch teams:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const userId = getUserId();
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: newTeamName.trim(),
          description: newTeamDescription.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setNewTeamName('');
        setNewTeamDescription('');
        setShowCreateForm(false);
        fetchTeams(); // Refresh the list
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setError('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchTeams();
      } else {
        handleTeamCollaboration();
      }
    }
  }, [authLoading, isAuthenticated]);

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

  // 检查用户计划是否支持团队功能
  const canCreateTeam = user?.plan !== 'free';

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600">Manage your teams and collaboration</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Teams
              <FeatureAccessIndicator featureId="team_collaboration" size="sm" />
            </h1>
            <p className="text-gray-600">Manage your teams and collaboration</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchTeams} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreateTeam && (
              <LoginRequiredButton
                featureId="team_collaboration"
                onClick={() => setShowCreateForm(true)}
                data-feature="create-team"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </LoginRequiredButton>
            )}
          </div>
        </div>

        {/* Plan Upgrade Notice */}
        {!canCreateTeam && (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Team features are available with Pro and Enterprise plans. 
              <Button variant="link" className="p-0 ml-1 h-auto">
                Upgrade now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create Team Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <Input
                  placeholder="Enter team name..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  placeholder="Enter team description..."
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  disabled={creating}
                />
              </div>
              <div className="flex gap-2">
                <LoginRequiredButton
                  featureId="team_collaboration"
                  onClick={handleCreateTeam}
                  disabled={creating || !newTeamName.trim()}
                  data-feature="create-team"
                >
                  {creating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {creating ? 'Creating...' : 'Create Team'}
                </LoginRequiredButton>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
                    setError('');
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams List */}
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {team.name}
                      </CardTitle>
                      {team.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <Badge className={getRoleBadgeColor(team.userRole)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(team.userRole)}
                        <span className="capitalize">{team.userRole}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Team Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{team.memberCount} members</span>
                    </div>
                    <span className="text-gray-500">
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Members Preview */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Members</p>
                    <div className="space-y-1">
                      {team.members.slice(0, 3).map((member: any) => (
                        <div key={member.user_id} className="flex items-center gap-2 text-sm">
                          {getRoleIcon(member.role)}
                          <span className="flex-1 truncate">
                            {member.yt_users?.email || 'Unknown User'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                      {team.memberCount > 3 && (
                        <p className="text-xs text-gray-500">
                          +{team.memberCount - 3} more members
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => router.push(`/teams/${team.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    {['owner', 'admin'].includes(team.userRole) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/teams/${team.id}`)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No teams yet
              </h3>
              <p className="text-gray-500 mb-4">
                {canCreateTeam 
                  ? 'Create your first team to start collaborating'
                  : 'Upgrade to Pro to create and manage teams'
                }
              </p>
              {canCreateTeam && (
                <LoginRequiredButton
                  featureId="team_collaboration"
                  onClick={() => setShowCreateForm(true)}
                  data-feature="create-first-team"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </LoginRequiredButton>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}