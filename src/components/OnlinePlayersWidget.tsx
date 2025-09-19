import React from 'react';
import { Users, Wifi } from 'lucide-react';
import { useUserPresence } from '../hooks/useUserPresence';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

export function OnlinePlayersWidget() {
  const { onlineUsers, onlineCount, isLoading, error } = useUserPresence();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wifi className="w-4 h-4 text-muted-foreground animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Connecting...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Players Online</span>
        </div>
        <p className="text-xs text-muted-foreground">Unable to load online players</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-4 h-4 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm font-medium">Players Online</span>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          {onlineCount}
        </Badge>
      </div>
      
      {onlineCount > 0 && (
        <div className="space-y-2">
          <div className="flex -space-x-2 overflow-hidden">
            {onlineUsers.slice(0, 5).map((user) => (
              <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {onlineCount > 5 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">+{onlineCount - 5}</span>
              </div>
            )}
          </div>
          
          {onlineCount > 1 && (
            <p className="text-xs text-muted-foreground">
              {onlineUsers.slice(0, 2).map(u => u.name).join(', ')}
              {onlineCount > 2 && ` and ${onlineCount - 2} others`} are online
            </p>
          )}
        </div>
      )}
      
      {onlineCount === 0 && (
        <p className="text-xs text-muted-foreground">No players currently online</p>
      )}
    </div>
  );
}
