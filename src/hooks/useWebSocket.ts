import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface WebSocketMessage {
  id: string;
  type: 'message' | 'typing' | 'user_joined' | 'user_left' | 'game_update' | 'location_update';
  chatId: string;
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

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastPing: Date | null;
}

interface UseWebSocketOptions {
  url?: string;
  chatId: string;
  userId: string;
  userName: string;
  autoConnect?: boolean;
  retryInterval?: number;
  maxRetries?: number;
}

export function useWebSocket({
  url = '', // Will be set by Supabase Realtime
  chatId,
  userId,
  userName,
  autoConnect = true,
  retryInterval = 3000,
  maxRetries = 5
}: UseWebSocketOptions) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastPing: null
  });

  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        setMessages(prev => [...prev, message]);
        break;
        
      case 'typing':
        if (message.userId && message.userId !== userId) {
          setTypingUsers(prev => new Set(prev).add(message.userId!));
          // Clear typing after 3 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(message.userId!);
              return newSet;
            });
          }, 3000);
        }
        break;
        
      case 'user_joined':
        toast.success(`${message.userName} joined the chat`);
        break;
        
      case 'user_left':
        break;
        
      case 'game_update':
        toast.info('Game details updated');
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Use Supabase Realtime instead of WebSocket
      // This will be implemented with Supabase subscriptions
      console.log('WebSocket connection replaced with Supabase Realtime');

      // Simulate connection success
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false,
          lastPing: new Date()
        }));
        
        retryCountRef.current = 0;
        
        // Connection established
        
        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          setState(prev => ({ ...prev, lastPing: new Date() }));
        }, 30000);
        
      }, 1000);

    } catch (error) {
      handleConnectionError(error);
    }
  }, [chatId, userId, userName]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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
    
    setTypingUsers(new Set());
  }, []);

  const handleConnectionError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: error.message || 'Connection failed'
    }));

    // Retry connection
    if (retryCountRef.current < maxRetries) {
      retryTimeoutRef.current = setTimeout(() => {
        retryCountRef.current++;
        connect();
      }, retryInterval);
    } else {
      toast.error('Failed to connect to chat. Please check your connection.');
    }
  }, [connect, maxRetries, retryInterval]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || !state.isConnected) {
      toast.error('Not connected to chat');
      return;
    }

    const message: Omit<WebSocketMessage, 'id' | 'timestamp'> = {
      type: 'message',
      chatId,
      userId,
      userName,
      content
    };

    try {
      wsRef.current.send(JSON.stringify({
        ...message,
        id: Date.now().toString(),
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  }, [state.isConnected, chatId, userId, userName]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!wsRef.current || !state.isConnected) return;

    const message = {
      type: 'typing',
      chatId,
      userId,
      userName,
      metadata: { isTyping }
    };

    try {
      wsRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [state.isConnected, chatId, userId, userName]);

  const startTyping = useCallback(() => {
    sendTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 3000);
  }, [sendTyping]);

  const stopTyping = useCallback(() => {
    sendTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [sendTyping]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    ...state,
    
    // Data
    messages,
    typingUsers: Array.from(typingUsers).filter(id => id !== userId),
    onlineUsers: Array.from(onlineUsers).filter(id => id !== userId),
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    startTyping,
    stopTyping,
    
    // Utilities
    isUserTyping: (userId: string) => typingUsers.has(userId),
    isUserOnline: (userId: string) => onlineUsers.has(userId)
  };
}