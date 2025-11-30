import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { useUserFriends } from '@/domains/users/hooks/useFriends';
import { useDeepLinks } from '@/shared/hooks/useDeepLinks';

export default function FollowingPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { navigateToUser } = useDeepLinks();
  const { data: userFriends = [], isLoading } = useUserFriends(user?.id);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
        <h1 className="text-xl font-semibold">Following</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>People you follow ({userFriends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Loading...</div>
          ) : userFriends.length > 0 ? (
            <div className="space-y-2">
              {userFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigateToUser(friend.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>
                        {(friend.display_name || friend.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.display_name || friend.username || 'User'}</p>
                      {friend.bio && (
                        <p className="text-sm text-muted-foreground truncate max-w-[240px]">{friend.bio}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Following</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">You are not following anyone yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
