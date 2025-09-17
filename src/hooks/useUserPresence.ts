import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserPresence {
  userId: string;
  lastSeen: Date;
  isOnline: boolean;
}

export function useUserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let presenceChannel: any;

    // Set up real-time presence tracking
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Create presence channel
      presenceChannel = supabase.channel('user-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Track presence changes
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const users = Object.values(state).flat().map((presence: any) => ({
            userId: presence.user_id || presence.key,
            lastSeen: new Date(),
            isOnline: true
          }));
          setOnlineUsers(users);
          setIsLoading(false);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
          // Update online users when someone joins
          setOnlineUsers(prev => {
            const existingUserIds = prev.map(u => u.userId);
            const newUsers = newPresences
              .filter((p: any) => !existingUserIds.includes(p.user_id || key))
              .map((p: any) => ({
                userId: p.user_id || key,
                lastSeen: new Date(),
                isOnline: true
              }));
            return [...prev, ...newUsers];
          });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
          // Remove users who left
          setOnlineUsers(prev => 
            prev.filter(user => 
              !leftPresences.some((p: any) => (p.user_id || key) === user.userId)
            )
          );
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    // Cleanup
    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, []);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isLoading
  };
}
