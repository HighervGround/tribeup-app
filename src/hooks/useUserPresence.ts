import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  lastSeen: string;
}

export function useUserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let presenceChannel: any;
    let heartbeatInterval: NodeJS.Timeout;

    const initializePresence = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user profile for display info
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, username, avatar_url')
          .eq('id', user.id)
          .single();

        // Create presence channel
        presenceChannel = supabase.channel('online_users', {
          config: {
            presence: {
              key: user.id,
            },
          },
        });

        // Track presence state
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = presenceChannel.presenceState();
            const users = Object.keys(presenceState).map(userId => {
              const presence = presenceState[userId][0];
              return {
                id: userId,
                name: presence.name || 'Anonymous',
                avatar: presence.avatar,
                lastSeen: new Date().toISOString()
              };
            });
            
            setOnlineUsers(users);
            setOnlineCount(users.length);
            setIsLoading(false);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
          });

        // Subscribe and track presence
        await presenceChannel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Send initial presence
            await presenceChannel.track({
              user_id: user.id,
              name: profile?.full_name || profile?.username || 'Anonymous',
              avatar: profile?.avatar_url,
              online_at: new Date().toISOString(),
            });

            // Set up heartbeat to maintain presence
            heartbeatInterval = setInterval(async () => {
              await presenceChannel.track({
                user_id: user.id,
                name: profile?.full_name || profile?.username || 'Anonymous',
                avatar: profile?.avatar_url,
                online_at: new Date().toISOString(),
              });
            }, 30000); // Update every 30 seconds
          }
        });

      } catch (error) {
        console.error('Failed to initialize presence:', error);
        setIsLoading(false);
      }
    };

    initializePresence();

    // Cleanup
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, []);

  return {
    onlineUsers,
    onlineCount,
    isLoading
  };
}
