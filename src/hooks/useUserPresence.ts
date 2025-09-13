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
    let intervalId: NodeJS.Timeout;
    let presenceChannel: any;

    const updatePresence = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Update user's last seen timestamp
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            last_seen: new Date().toISOString(),
            is_online: true
          });

        // Get all users who were active in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data: presenceData, error } = await supabase
          .from('user_presence')
          .select('user_id, last_seen, is_online')
          .gte('last_seen', fiveMinutesAgo)
          .eq('is_online', true);

        if (error) {
          console.error('Error fetching user presence:', error);
          return;
        }

        // Transform data and update state
        const users = (presenceData || []).map(p => ({
          userId: p.user_id,
          lastSeen: new Date(p.last_seen),
          isOnline: p.is_online
        }));

        setOnlineUsers(users);
        setIsLoading(false);
      } catch (error) {
        console.error('Error updating presence:', error);
        setIsLoading(false);
      }
    };

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
            userId: presence.user_id,
            lastSeen: new Date(),
            isOnline: true
          }));
          setOnlineUsers(users);
          setIsLoading(false);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });

      // Update presence every 30 seconds
      intervalId = setInterval(updatePresence, 30000);
      
      // Initial update
      updatePresence();
    };

    setupPresence();

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
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
