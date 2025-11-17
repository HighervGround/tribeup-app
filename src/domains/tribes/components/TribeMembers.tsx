import { useTribeMembers } from '../hooks/useTribeMembers';
import { useRemoveMember, useUpdateMemberRole } from '../hooks/useTribeMembers';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { MoreVertical, Crown, Shield, User } from 'lucide-react';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

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
        return 'bg-yellow-100 text-yellow-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No members yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                    <Badge variant="outline" className={getRoleColor(member.role)}>
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
  );
}

export default TribeMembers;

