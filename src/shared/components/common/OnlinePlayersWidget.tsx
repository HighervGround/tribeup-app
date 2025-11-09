import React from 'react';
import { Users, Wifi } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { RealtimeAvatarStack } from '@/shared/components/common/realtime-avatar-stack';

export function OnlinePlayersWidget() {
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
      </div>
      
      <div className="flex items-center gap-3">
        <RealtimeAvatarStack roomName="global-online" />
        <span className="text-xs text-muted-foreground">
          Active players across all games
        </span>
      </div>
    </div>
  );
}
