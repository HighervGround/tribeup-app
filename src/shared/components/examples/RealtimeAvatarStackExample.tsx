import React from 'react';
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RealtimeAvatarStackExampleProps {
  gameId?: string;
  roomName?: string;
}

/**
 * Example component showing how to use RealtimeAvatarStack in your TribeUp app
 * 
 * Usage examples:
 * 1. Game participants: <RealtimeAvatarStackExample gameId="game-123" />
 * 2. Chat room users: <RealtimeAvatarStackExample roomName="game-chat-123" />
 * 3. Venue presence: <RealtimeAvatarStackExample roomName="venue-central-park" />
 */
export function RealtimeAvatarStackExample({ 
  gameId, 
  roomName 
}: RealtimeAvatarStackExampleProps) {
  // Use gameId to create a room name if not provided
  const finalRoomName = roomName || `game-${gameId}`;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {gameId ? 'Game Participants' : 'Online Users'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <RealtimeAvatarStack roomName={finalRoomName} />
          <span className="text-sm text-muted-foreground">
            Currently online
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Integration examples for your existing components:

/**
 * 1. Add to GameDetails.tsx:
 * 
 * import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
 * 
 * // In your GameDetails component:
 * <div className="flex items-center gap-2 mb-4">
 *   <h3 className="font-semibold">Participants</h3>
 *   <RealtimeAvatarStack roomName={`game-${game.id}`} />
 * </div>
 */

/**
 * 2. Add to GameChat.tsx:
 * 
 * // Show who's actively in the chat
 * <div className="border-b p-3">
 *   <div className="flex items-center justify-between">
 *     <span className="text-sm font-medium">Active in chat</span>
 *     <RealtimeAvatarStack roomName={`chat-${gameId}`} />
 *   </div>
 * </div>
 */

/**
 * 3. Add to UnifiedGameCard.tsx:
 * 
 * // Quick preview of online participants
 * <div className="flex items-center gap-2 text-xs text-muted-foreground">
 *   <RealtimeAvatarStack roomName={`game-${game.id}`} />
 *   <span>online now</span>
 * </div>
 */

/**
 * 4. Add to OnlinePlayersWidget.tsx:
 * 
 * // Replace your current implementation with:
 * <RealtimeAvatarStack roomName="global-online" />
 */
