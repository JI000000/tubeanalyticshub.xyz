'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Mail,
  Crown,
  Shield,
  User,
  Eye,
  Check,
  X,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface InvitationDetails {
  id: string;
  team_id: string;
  invitee_email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  yt_teams: {
    id: string;
    name: string;
    description: string;
    owner_id: string;
  };
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { getUserId, user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = params.token as string;

  const fetchInvitationDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/invite/accept?token=${token}`);
      const result = await response.json();
      
      if (result.success) {
        setInvitation(result.data);
      } else {
        setError(result.error || 'Invalid or expired invitation');
      }
    } catch (error) {
      console.error('Error fetching invitation details:', error);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!isAuthenticated) {
      setError('Please log in to accept this invitation');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const userId = getUserId();
      const response = await fetch('/api/team/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Successfully joined the team!');
        setTimeout(() => {
          router.push(`/teams/${invitation?.team_id}`);
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const declineInvitation = async () => {
    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/team/invite/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Invitation declined');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      setError('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    }
  }, [token]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-5 w-5 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'member':
        return <User className="h-5 w-5 text-green-600" />;
      case 'viewer':
        return <Eye className="h-5 w-5 text-gray-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
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

  const isExpired = invitation && new Date(invitation.expires_at) < new Date();
  const isAlreadyProcessed = invitation && invitation.status !== 'pending';

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (error && !invitation) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid Invitation
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <Button onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!invitation) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invitation Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                This invitation link is invalid or has been removed.
              </p>
              <Button onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Team Invitation</CardTitle>
            <p className="text-gray-600">
              You've been invited to join a team
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alerts */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Invitation Details */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {invitation.yt_teams.name}
                </h3>
                {invitation.yt_teams.description && (
                  <p className="text-gray-600 mt-1">
                    {invitation.yt_teams.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Your Role</p>
                  <Badge className={getRoleBadgeColor(invitation.role)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(invitation.role)}
                      <span className="capitalize">{invitation.role}</span>
                    </div>
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Invited Email</p>
                  <p className="text-sm text-gray-600">{invitation.invitee_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {isExpired 
                    ? `Expired on ${new Date(invitation.expires_at).toLocaleDateString()}`
                    : `Expires on ${new Date(invitation.expires_at).toLocaleDateString()}`
                  }
                </span>
              </div>
            </div>

            {/* Status Messages */}
            {isExpired && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This invitation has expired. Please contact the team owner for a new invitation.
                </AlertDescription>
              </Alert>
            )}

            {isAlreadyProcessed && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  This invitation has already been {invitation.status}.
                </AlertDescription>
              </Alert>
            )}

            {/* Authentication Check */}
            {!isAuthenticated && !isExpired && !isAlreadyProcessed && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Please log in with the email address {invitation.invitee_email} to accept this invitation.
                </AlertDescription>
              </Alert>
            )}

            {/* Email Mismatch Warning */}
            {isAuthenticated && user?.email !== invitation.invitee_email && !isExpired && !isAlreadyProcessed && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This invitation was sent to {invitation.invitee_email}, but you're logged in as {user?.email}. 
                  Please log in with the correct email address.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {!isExpired && !isAlreadyProcessed && (
              <div className="flex gap-3">
                {isAuthenticated && user?.email === invitation.invitee_email ? (
                  <>
                    <Button 
                      onClick={acceptInvitation} 
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Accept Invitation
                        </div>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={declineInvitation} 
                      disabled={processing}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => router.push('/auth/login')}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Log In to Accept
                  </Button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>
                Invited on {new Date(invitation.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}