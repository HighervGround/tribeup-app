import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';

export interface RealtimeMessage {
  id: string;
  type: 'message' | 'game_update' | 'user_joined' | 'user_left';
  gameId: string;
  userId: string;
  userName: string;
  content?: string;
  timestamp: Date;
  metadata?: {
    gameId?: string;
    location?: { lat: number; lng: number };
    isTyping?: boolean;
  };
}

export interface RealtimeState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastPing: Date | null;
}

interface UseSupabaseRealtimeOptions {
  gameId: string;
  autoConnect?: boolean;
}

export function useSupabaseRealtime({
  gameId,
  autoConnect = true
}: UseSupabaseRealtimeOptions) {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastPing: null
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { user } = useAppStore();

  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const handleGameUpdate = useCallback((payload: any) => {
    console.log('Game update received:', payload);
    
    if (payload.eventType === 'INSERT' && payload.table === 'game_participants') {
      toast.success('Someone joined the game!');
    } else if (payload.eventType === 'DELETE' && payload.table === 'game_participants') {
      toast.info('Someone left the game');
    } else if (payload.eventType === 'UPDATE' && payload.table === 'games') {
      toast.info('Game details updated');
    }
  }, []);

  const handleChatMessage = useCallback((payload: any) => {
    console.log('Chat message received:', payload);
    
    if (payload.eventType === 'INSERT' && payload.table === 'chat_messages') {
      const newMessage = payload.new;
      setMessages(prev => [...prev, {
        id: newMessage.id,
        message: newMessage.message,
        createdAt: newMessage.created_at,
        user: {
          id: newMessage.user_id,
          name: user?.name || 'Unknown User',
          avatar: user?.avatar || ''
        }
      }]);
    }
  }, [user]);

  const connect = useCallback(async () => {
    if (channelRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Subscribe to game updates
      const gameChannel = SupabaseService.subscribeToGameUpdates(gameId, handleGameUpdate);
      
      // Subscribe to chat messages
      const chatChannel = SupabaseService.subscribeToChatMessages(gameId, handleChatMessage);

      channelRef.current = { gameChannel, chatChannel };

      // Load existing messages
      const existingMessages = await SupabaseService.getChatMessages(gameId);
      setMessages(existingMessages);

      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        isConnecting: false,
        lastPing: new Date()
      }));
      
      // Start heartbeat
      heartbeatRef.current = setInterval(() => {
        setState(prev => ({ ...prev, lastPing: new Date() }));
      }, 30000);

    } catch (error) {
      handleConnectionError(error);
    }
  }, [gameId, handleGameUpdate, handleChatMessage]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      if (channelRef.current.gameChannel) {
        channelRef.current.gameChannel.unsubscribe();
      }
      if (channelRef.current.chatChannel) {
        channelRef.current.chatChannel.unsubscribe();
      }
      channelRef.current = null;
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastPing: null
    });
    
    setOnlineUsers(new Set());
  }, []);

  const handleConnectionError = useCallback((error: any) => {
    console.error('Supabase realtime error:', error);
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: error.message || 'Connection failed'
    }));

    // Retry connection after 3 seconds
    retryTimeoutRef.current = setTimeout(() => {
      connect();
    }, 3000);
  }, [connect]);

  const sendMessage = useCallback(async (content: string) => {
    if (!state.isConnected) {
      toast.error('Not connected to chat');
      return;
    }

    try {
      await SupabaseService.sendMessage(gameId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  }, [state.isConnected, gameId]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && gameId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, gameId, connect, disconnect]);

  return {
    // Connection state
    ...state,
    
    // Data
    messages,
    onlineUsers: Array.from(onlineUsers),
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    
    // Utilities
    isUserOnline: (userId: string) => onlineUsers.has(userId)
  };
}

