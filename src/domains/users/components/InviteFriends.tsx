import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { FriendList } from './FriendList';
import { UserPlus, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface InviteFriendsProps {
  gameId?: string;
  gameTitle?: string;
  trigger?: React.ReactNode;
  onInviteSent?: (userIds: string[]) => void;
}

export function InviteFriends({
  gameId,
  gameTitle,
  trigger,
  onInviteSent
}: InviteFriendsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  const handleInvite = async (userId: string, userName: string) => {
    // For now, just add to invited list and show success
    // TODO: Implement actual invitation system when notifications are ready
    if (!invitedUsers.includes(userId)) {
      setInvitedUsers(prev => [...prev, userId]);
      toast.success(`Invited ${userName} to ${gameTitle || 'your game'}!`);
    }
  };

  const handleSendInvites = () => {
    if (invitedUsers.length > 0) {
      onInviteSent?.(invitedUsers);
      toast.success(`Sent ${invitedUsers.length} invitation${invitedUsers.length > 1 ? 's' : ''}!`);
      setInvitedUsers([]);
      setIsOpen(false);
    }
  };

  const handleShareGame = async () => {
    if (!gameId) return;

    const gameUrl = `${window.location.origin}/game/${gameId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: gameTitle || 'Join my game!',
          text: `Join me for ${gameTitle || 'a game'} on TribeUp!`,
          url: gameUrl,
        });
      } else {
        await navigator.clipboard.writeText(gameUrl);
        toast.success('Game link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing game:', error);
      toast.error('Failed to share game link');
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <UserPlus className="w-4 h-4" />
      Invite Players
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Players to {gameTitle || 'Your Game'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Game Link */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShareGame}
              className="flex-1 gap-2"
              disabled={!gameId}
            >
              <Share2 className="w-4 h-4" />
              Share Game Link
            </Button>
          </div>

          {/* Friend Suggestions */}
          <div>
            <h4 className="font-medium text-sm mb-3">Suggested Players</h4>
            <FriendList
              showSearch={false}
              maxSuggestions={5}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={invitedUsers.length === 0}
              className="flex-1"
            >
              Send {invitedUsers.length > 0 ? `${invitedUsers.length} ` : ''}Invite{invitedUsers.length !== 1 ? 's' : ''}
            </Button>
          </div>

          {invitedUsers.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {invitedUsers.length} player{invitedUsers.length > 1 ? 's' : ''} will be invited when you create the game
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
