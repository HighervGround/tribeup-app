import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { usePresenceStore, type PresenceUser } from '../stores/presenceStore';

export function useUserPresence() {
  const { user } = useAppStore();
  const { 
    onlineUsers, 
    channelStatus, 
    usePolling, 
    isLoading, 
    error,
    setOnlineUsers,
    setChannelStatus,
    setUsePolling,
    setLoading,
    setError
  } = usePresenceStore();
  
  const pollTimer = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  // Polling fallback function
  const startPolling = async () => {
    if (pollTimer.current) return;
    
    console.log('🔄 Starting presence polling fallback');
    setUsePolling(true);
    
    const pollPresence = async () => {
      try {
        if (!user?.id) return;
        
        // Update our presence (now with name/avatar columns)
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            name: user.name,
            avatar: user.avatar,
            last_seen: new Date().toISOString(),
            is_online: true,
          });

        // Get active users (last 5 minutes)
        const { data: presenceData } = await supabase
          .from('user_presence')
          .select('*')
          .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

        if (presenceData) {
          const usersMap: Record<string, PresenceUser> = {};
          presenceData.forEach((p) => {
            usersMap[p.user_id] = {
              user_id: p.user_id,
              name: p.name || 'Anonymous',
              avatar: p.avatar || '',
              last_seen: p.last_seen,
              status: 'online'
            };
          });
          
          setOnlineUsers(usersMap);
          setError(null);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Polling failed');
      }
    };

    // Poll immediately, then every 30 seconds
    await pollPresence();
    pollTimer.current = window.setInterval(pollPresence, 30000);
  };

  const stopPolling = () => {
    if (pollTimer.current) {
      console.log('⏹️ Stopping presence polling');
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    setUsePolling(false);
  };

  // Realtime presence function
  const startRealtime = () => {
    if (!user?.id) return;
    
    console.log('🔗 Starting realtime presence');
    
    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('�� Presence sync');
        const state = channel.presenceState();
        const usersMap = Object.keys(state).reduce<Record<string, PresenceUser>>((acc, userId) => {
          const presence = state[userId][0];
          acc[userId] = {
            user_id: userId,
            name: presence.name || 'Anonymous',
            avatar: presence.avatar || '',
            last_seen: new Date().toISOString(),
            status: 'online'
          };
          return acc;
        }, {});
        
        setOnlineUsers(usersMap);
        setLoading(false);
        setError(null);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key);
      })
      .subscribe(async (status) => {
        console.log('📡 Channel status:', status);
        
        if (status === 'SUBSCRIBED') {
          setChannelStatus('joined');
          stopPolling(); // Stop polling when realtime works
          
          // Track our presence
          await channel.track({
            name: user.name,
            avatar: user.avatar,
            online_at: new Date().toISOString(),
          });
          
          // Also update database for persistence
          await supabase
            .from('user_presence')
            .upsert({
              user_id: user.id,
              name: user.name,
              avatar: user.avatar,
              last_seen: new Date().toISOString(),
              is_online: true,
            });
          
        } else if (status === 'CHANNEL_ERROR') {
          setChannelStatus('error');
          setError('Realtime connection failed');
          startPolling(); // Fallback to polling
          
        } else if (status === 'CLOSED') {
          setChannelStatus('closed');
          startPolling(); // Fallback to polling
          
        } else {
          setChannelStatus('joining');
        }
      });
  };

  useEffect(() => {
    console.log('🔄 PRESENCE SYSTEM v2.0 - useUserPresence hook called');
    console.log('🔄 User state:', user ? `ID: ${user.id}, Name: ${user.name}` : 'NO USER');
    
    if (!user?.id) {
      console.log('👤 No authenticated user - presence disabled');
      setLoading(false);
      setOnlineUsers({});
      return;
    }

    console.log('👤 Authenticated user found:', user.id, 'Starting presence system');
    setLoading(true);
    
    // Try realtime first
    try {
      startRealtime();
    } catch (error) {
      console.error('Failed to start realtime, falling back to polling:', error);
      startPolling();
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      stopPolling();
      setChannelStatus('closed');
    };
  }, [user?.id]);

  return {
    onlineUsers: Object.values(onlineUsers),
    onlineCount: Object.keys(onlineUsers).length,
    isLoading,
    error,
    isRealtime: channelStatus === 'joined',
    isPolling: usePolling,
    connectionStatus: channelStatus,
  };
}
