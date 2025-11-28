import { useState } from 'react';
import { useTribeMembers } from '../hooks/useTribeMembers';
import { useRemoveMember, useUpdateMemberRole } from '../hooks/useTribeMembers';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { MoreVertical, Crown, Shield, User, UserPlus, Search, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { useUserSearch } from '@/domains/users/hooks/useFriends';
import { toast } from 'sonner';
import { supabase } from '@/core/database/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/shared/components/common/EmptyState';

// Simple relative time formatter
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface TribeMembersProps {
  tribeId: string;
  canManage: boolean;
}

export function TribeMembers({ tribeId, canManage }: TribeMembersProps) {
  const { data: members, isLoading } = useTribeMembers(tribeId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const { data: searchResults, isLoading: isSearching } = useUserSearch(
    searchQuery,
    searchQuery.length > 2
  );

  const memberIds = new Set(members?.map(m => m.user_id) || []);
  const filteredResults = searchResults?.filter(user => !memberIds.has(user.id)) || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3" />;
      case 'moderator':
        return <Shield className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            variant="no-friends"
            title="No members yet"
            description="Invite members to grow your tribe community!"
            size="md"
          />
        </CardContent>
      </Card>
    );
  }

  const handleInviteUser = async (userId: string) => {
    if (isInviting) return;
    
    try {
      setIsInviting(true);
      
      // Check if user is already a member
      if (memberIds.has(userId)) {
        toast.error('User is already a member of this tribe');
        return;
      }

      // Add user to tribe (for now, directly add as member since there's no invitation system)
      const { error } = await supabase
        .from('tribe_members')
        .insert({
          tribe_id: tribeId,
          user_id: userId,
          role: 'member',
          status: 'active',
        });

      if (error) throw error;

      toast.success('User added to tribe!');
      
      // Refresh members list
      queryClient.invalidateQueries({ queryKey: ['tribes', tribeId, 'members', 'list'] });
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Members
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Invite Members to Tribe
                </DialogTitle>
                <DialogDescription>
                  Search for users by name or username to invite to this tribe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchQuery.length > 2 && filteredResults.length === 0 ? (
                  <EmptyState
                    variant="no-results"
                    title="No users found"
                    description="Try a different search term to find users."
                    size="sm"
                  />
                ) : searchQuery.length > 2 && filteredResults.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {(() => {
                                // Prioritize username over display_name if display_name looks like an email
                                const displayName = user.display_name || '';
                                const isEmail = displayName.includes('@');
                                if (user.username) {
                                  return user.username;
                                }
                                if (displayName && !isEmail) {
                                  return displayName;
                                }
                                return 'User';
                              })()}
                            </h4>
                            {user.display_name && user.display_name !== user.username && !user.display_name.includes('@') && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {user.display_name}
                              </p>
                            )}
                            {user.username && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                @{user.username}
                              </p>
                            )}
                            {!user.username && !user.display_name && user.bio && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleInviteUser(user.id)}
                          disabled={isInviting}
                          className="flex-shrink-0 ml-2"
                        >
                          {isInviting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Invite
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Start typing to search for users
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowInviteDialog(false);
                  setSearchQuery('');
                }}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback>
                    {member.display_name?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.display_name || member.username || 'Anonymous'}</span>
                    <Badge variant="outline" className={`${getRoleColor(member.role)} border`}>
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Joined {member.joined_at ? formatRelativeTime(member.joined_at) : ''}
                  </p>
                </div>
              </div>

              {canManage && member.role !== 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === 'member' && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateRole.mutate({
                            tribeId,
                            memberId: member.user_id,
                            role: 'moderator',
                          })
                        }
                      >
                        Make Moderator
                      </DropdownMenuItem>
                    )}
                    {member.role === 'moderator' && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateRole.mutate({
                            tribeId,
                            memberId: member.user_id,
                            role: 'member',
                          })
                        }
                      >
                        Remove Moderator
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        removeMember.mutate({
                          tribeId,
                          memberId: member.user_id,
                        })
                      }
                    >
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  );
}

export default TribeMembers;

