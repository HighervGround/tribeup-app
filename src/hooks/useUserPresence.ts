import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { envConfig } from '../lib/envConfig';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let presenceChannel: any;
    let heartbeatInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const initializePresence = async () => {
      try {
        // Set timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn('Presence initialization timeout');
          setIsLoading(false);
          setError('Failed to connect to presence system');
        }, 10000); // 10 second timeout

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          clearTimeout(timeoutId);
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
            try {
              const presenceState = presenceChannel.presenceState();
              console.log('Presence sync:', presenceState);
              
              const users = Object.keys(presenceState).map(userId => {
                const presence = presenceState[userId][0];
                return {
                  id: userId,
                  name: presence.name || 'Anonymous',
                  avatar: presence.avatar,
                  lastSeen: new Date().toISOString()
                };
              });
              
              console.log('Online users:', users);
              setOnlineUsers(users);
              setOnlineCount(users.length);
              setIsLoading(false);
            } catch (error) {
              console.error('Presence sync error:', error);
              setIsLoading(false);
            }
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
          });

        // Subscribe and track presence
        await presenceChannel.subscribe(async (status: string) => {
          console.log('Presence subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeoutId); // Clear timeout on successful connection
            
            // Send initial presence
            await presenceChannel.track({
              user_id: user.id,
              name: profile?.full_name || profile?.username || 'Anonymous',
              avatar: profile?.avatar_url,
              online_at: new Date().toISOString(),
            });

            // Set up heartbeat to maintain presence (reduced frequency)
            heartbeatInterval = setInterval(async () => {
              try {
                await presenceChannel.track({
                  user_id: user.id,
                  name: profile?.full_name || profile?.username || 'Anonymous',
                  avatar: profile?.avatar_url,
                  online_at: new Date().toISOString(),
                });
              } catch (error) {
                console.error('Presence heartbeat error:', error);
                // Don't spam errors, just log them
              }
            }, 60000); // Increased to 60 seconds to reduce load
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeoutId);
            setError('Presence channel error');
            setIsLoading(false);
          }
        });

      } catch (error) {
        console.error('Failed to initialize presence:', error);
        clearTimeout(timeoutId);
        setError('Failed to initialize presence system');
        setIsLoading(false);
      }
    };

    initializePresence();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
    isLoading,
    error
  };
}
