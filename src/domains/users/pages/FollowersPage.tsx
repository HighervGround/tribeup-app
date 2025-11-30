import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useAppStore } from '@/store/appStore';
import { useUserFollowers, useFollowUser } from '@/domains/users/hooks/useFriends';
import { useDeepLinks } from '@/shared/hooks/useDeepLinks';

export default function FollowersPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { navigateToUser } = useDeepLinks();
  const { data: userFollowers = [], isLoading } = useUserFollowers(user?.id);
  const followMutation = useFollowUser();

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
        <h1 className="text-xl font-semibold">Followers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>People who follow you ({userFollowers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Loading...</div>
          ) : userFollowers.length > 0 ? (
            <div className="space-y-2">
              {userFollowers.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigateToUser(follower.id)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={follower.avatar_url || undefined} />
                      <AvatarFallback>
                        {(follower.display_name || follower.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{follower.display_name || follower.username || 'User'}</p>
                      {follower.bio && (
                        <p className="text-sm text-muted-foreground truncate max-w-[240px]">{follower.bio}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => followMutation.mutate(follower.id)}
                    disabled={followMutation.isPending}
                  >
                    Follow back
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">You don’t have any followers yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
