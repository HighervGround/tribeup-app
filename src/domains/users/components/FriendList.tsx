import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Users, Search, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFriends, useUserSearch } from '../hooks/useFriends';
import { FriendSuggestion } from '../services/friendService';
import { toast } from 'sonner';

interface FriendListProps {
  onClose?: () => void;
  showSearch?: boolean;
  maxSuggestions?: number;
}

export function FriendList({
  onClose,
  showSearch = true,
  maxSuggestions = 10
}: FriendListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(!showSearch);

  const {
    suggestions,
    isLoadingSuggestions,
    followUser,
    isFollowingLoading
  } = useFriends();

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError
  } = useUserSearch(searchQuery, showSearch && searchQuery.length > 2);

  const displayedUsers = showSearch && searchQuery.length > 2
    ? searchResults || []
    : suggestions.slice(0, maxSuggestions);

  const handleFollow = async (userId: string, userName: string) => {
    try {
      await followUser(userId);
      toast.success(`Followed ${userName}!`);
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  const UserCard = ({ user, showFollowButton = true }: {
    user: FriendSuggestion | any;
    showFollowButton?: boolean;
  }) => {
    const isSuggestion = 'common_games_count' in user;
    // display_name is now a generated column, always present (from full_name, username, or email)
    const displayName = user.display_name || 'User';
    const isFollowing = user.is_following || false;

    return (
      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={user.avatar_url || undefined} alt={displayName} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{displayName}</h4>
              {isSuggestion && (
                <Badge variant="secondary" className="text-xs">
                  {user.common_games_count} {user.common_games_count !== 1 ? 'activities' : 'activity'} together
                </Badge>
              )}
            </div>
            {user.bio && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {showFollowButton && (
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            onClick={() => handleFollow(user.id, displayName)}
            disabled={isFollowingLoading}
            className="flex-shrink-0 ml-2"
          >
            {isFollowingLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFollowing ? (
              <>
                <UserMinus className="w-3 h-3 mr-1" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {showSearch && searchQuery.length > 2 ? 'Search Results' : 'Suggestions'}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>

        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoadingSuggestions && displayedUsers.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading suggestions...</p>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-sm mb-1">
              {showSearch && searchQuery.length > 2 ? 'No users found' : 'No suggestions yet'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {showSearch && searchQuery.length > 2
                ? 'Try a different search term'
                : 'Join some activities to get personalized suggestions!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}

            {!showSearch && suggestions.length > maxSuggestions && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? 'Show Less' : `Show ${suggestions.length - maxSuggestions} More`}
                </Button>
              </div>
            )}
          </div>
        )}

        {searchError && (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">
              Failed to search users. Please try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
