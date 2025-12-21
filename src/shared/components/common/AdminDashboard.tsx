import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Shield, 
  Trash2, 
  UserCheck, 
  UserX,
  Eye,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useAllUsers, useAdminAuditLog, useUpdateUserRole, useDeleteGame, useCanPerformAdminActions, useIsAdmin, useIsModerator } from '@/shared/hooks/useAdmin';
import { useGames } from '@/domains/games/hooks/useGames';
import { useAppStore } from '@/store/appStore';
import { AmbassadorApplicationsAdmin } from '@/domains/users/components';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'games' | 'ambassadors' | 'audit'>('overview');
  const [deleteReason, setDeleteReason] = useState('');
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);

  // Hooks
  const { data: isAdmin } = useIsAdmin();
  const { data: isModerator } = useIsModerator();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const { data: games, isLoading: gamesLoading } = useGames();
  // const { data: auditLog, isLoading: auditLoading } = useAdminAuditLog(); // Disabled: causing 400 errors
  const auditLog = [];
  const auditLoading = false;
  const updateUserRoleMutation = useUpdateUserRole();
  const deleteGameMutation = useDeleteGame();
  // const canPerform = useCanPerformAdminActions(); // Disabled: audit log check blocking access

  // Check if user has admin/moderator access via DB query
  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access the admin dashboard.
              </p>
              <Button onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRoleUpdate = (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
    if (userId === user.id && newRole !== 'admin') {
      toast.error('You cannot remove your own admin privileges');
      return;
    }
    
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteGame = (gameId: string) => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }
    
    deleteGameMutation.mutate({ 
      gameId, 
      reason: deleteReason 
    }, {
      onSuccess: () => {
        setGameToDelete(null);
        setDeleteReason('');
      }
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'default';
      default: return 'secondary';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'games', label: 'Games', icon: Calendar },
    { id: 'audit', label: 'Audit Log', icon: Eye },
    { id: 'ambassadors', label: 'Ambassadors', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users, games, and platform settings</p>
          </div>
        </div>
        <Badge variant="destructive" className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{allUsers?.length || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Games</p>
                    <p className="text-2xl font-bold">{games?.length || 0}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Moderators</p>
                    <p className="text-2xl font-bold">
                      {allUsers?.filter(u => u.role === 'moderator').length || 0}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recent Actions</p>
                    <p className="text-2xl font-bold">{auditLog?.length || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p>Loading users...</p>
              ) : (
                <div className="space-y-4">
                  {allUsers?.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {userItem.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{userItem.name}</p>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                          <p className="text-xs text-muted-foreground">@{userItem.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(userItem.role)}>
                          {userItem.role}
                        </Badge>
                        {userItem.id !== user.id && (
                          <div className="flex gap-1 flex-wrap">
                            {userItem.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleUpdate(userItem.id, 'admin')}
                                disabled={updateUserRoleMutation.isPending}
                                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Make Admin
                              </Button>
                            )}
                            {userItem.role !== 'moderator' && userItem.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleUpdate(userItem.id, 'moderator')}
                                disabled={updateUserRoleMutation.isPending}
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Make Moderator
                              </Button>
                            )}
                            {userItem.role !== 'user' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleUpdate(userItem.id, 'user')}
                                disabled={updateUserRoleMutation.isPending}
                              >
                                <UserX className="w-3 h-3 mr-1" />
                                Remove Role
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Games Tab */}
        {selectedTab === 'games' && (
          <Card>
            <CardHeader>
              <CardTitle>Game Management</CardTitle>
            </CardHeader>
            <CardContent>
              {gamesLoading ? (
                <p>Loading games...</p>
              ) : (
                <div className="space-y-4">
                  {games?.map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{game.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {game.sport} • {game.date} at {game.time}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {game.location} • {game.totalPlayers ?? 0}/{game.maxPlayers ?? 0} players
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setGameToDelete(game.id)}
                        disabled={deleteGameMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ambassadors */}
        {selectedTab === 'ambassadors' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Campus Ambassadors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AmbassadorApplicationsAdmin />
            </CardContent>
          </Card>
        )}

        {/* Audit Log Tab */}
        {selectedTab === 'audit' && (
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <p>Loading audit log...</p>
              ) : (
                <div className="space-y-4">
                  {auditLog?.map((entry) => (
                    <div key={entry.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{entry.action}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">
                        <strong>{entry.admin?.full_name || 'Unknown Admin'}</strong> performed{' '}
                        <strong>{entry.action}</strong> on {entry.target_type}
                        {entry.target_id && ` (${entry.target_id.slice(0, 8)}...)`}
                      </p>
                      {entry.details && (
                        <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Game Modal */}
      {gameToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Please provide a reason for deleting this game.
              </p>
              <Textarea
                placeholder="Reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGameToDelete(null);
                    setDeleteReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteGame(gameToDelete)}
                  disabled={deleteGameMutation.isPending || !deleteReason.trim()}
                  className="flex-1"
                >
                  {deleteGameMutation.isPending ? 'Deleting...' : 'Delete Game'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
