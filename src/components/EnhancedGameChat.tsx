import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Send, MessageSquare, Users } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  game_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface EnhancedGameChatProps {
  gameId: string;
  className?: string;
}

export function EnhancedGameChat({ gameId, className = '' }: EnhancedGameChatProps) {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Enhanced scroll to bottom with smooth animation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  // Load existing messages from database
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        const { data: messagesData, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            game_id,
            user_id,
            message,
            created_at,
            users:user_id (
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('game_id', gameId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error loading messages:', error);
          const storedMessages = localStorage.getItem(`chat-${gameId}`);
          if (storedMessages) {
            const parsed = JSON.parse(storedMessages);
            setMessages(parsed);
          }
        } else {
          const transformedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
            id: msg.id,
            game_id: msg.game_id,
            user_id: msg.user_id,
            message: msg.message,
            created_at: msg.created_at,
            user: {
              name: msg.users?.full_name || msg.users?.username || `Unknown User (${msg.user_id.slice(0, 8)})`,
              avatar: msg.users?.avatar_url || ''
            }
          }));
          
          setMessages(transformedMessages);
          console.log('✅ Loaded messages from database:', transformedMessages.length);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [gameId]);

  // Enhanced real-time subscription with presence tracking
  useEffect(() => {
    if (!gameId || !user) return;

    console.log('🔗 Setting up enhanced chat realtime for game:', gameId);

    // Create channel for game chat with presence tracking
    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `game_id=eq.${gameId}`
      }, async (payload: any) => {
        console.log('💬 New chat message from database:', payload);
        
        // Fetch the complete message with user data
        const { data: messageData, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            game_id,
            user_id,
            message,
            created_at,
            users:user_id (
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (!error && messageData) {
          const newMsg: ChatMessage = {
            id: messageData.id,
            game_id: messageData.game_id,
            user_id: messageData.user_id,
            message: messageData.message,
            created_at: messageData.created_at,
            user: {
              name: messageData.users?.full_name || messageData.users?.username || `Unknown User (${messageData.user_id.slice(0, 8)})`,
              avatar: messageData.users?.avatar_url || ''
            }
          };
          
          // Add message if it's not already in the local state
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (!exists) {
              console.log('✅ Adding new message to chat:', newMsg.message, 'from:', newMsg.user?.name);
              return [...prev, newMsg];
            }
            return prev;
          });
          setTimeout(scrollToBottom, 100);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Extract unique user_ids from all presence entries
        const uniqueUserIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id) {
              uniqueUserIds.add(presence.user_id);
            }
          });
        });
        setOnlineUsers(uniqueUserIds);
        console.log('👥 Online users updated:', uniqueUserIds.size);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string, newPresences: any[] }) => {
        // Extract user_id from the presence data
        const userIds = newPresences
          .map((presence: any) => presence.user_id)
          .filter(Boolean);
        
        userIds.forEach((userId: string) => {
          console.log('👋 User joined:', userId);
          setOnlineUsers(prev => new Set([...prev, userId]));
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string, leftPresences: any[] }) => {
        // Extract user_id from the presence data
        const userIds = leftPresences
          .map((presence: any) => presence.user_id)
          .filter(Boolean);
          
        userIds.forEach((userId: string) => {
          console.log('👋 User left:', userId);
          // Only remove if no other tabs for this user are still connected
          const state = channel.presenceState();
          const userStillOnline = Object.values(state).some((presences: any) =>
            presences.some((p: any) => p.user_id === userId)
          );
          
          if (!userStillOnline) {
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
          }
        });
      })
      .subscribe(async (status: string) => {
        console.log('📡 Enhanced chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track user presence
          await channel.track({
            user_id: user.id,
            username: user.name,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Unsubscribing from enhanced chat:', gameId);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [gameId, user, scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    
    try {
      // Save message to database
      const { data: savedMessage, error: saveError } = await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          user_id: user.id,
          message: newMessage.trim()
        })
        .select(`
          id,
          game_id,
          user_id,
          message,
          created_at,
          users:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (saveError) {
        console.error('❌ Error saving message to database:', saveError);
        throw saveError;
      }

      console.log('✅ Message saved to database:', savedMessage);

      // Transform and add to local state immediately for sender
      const newMsg: ChatMessage = {
        id: savedMessage.id,
        game_id: savedMessage.game_id,
        user_id: savedMessage.user_id,
        message: savedMessage.message,
        created_at: savedMessage.created_at,
        user: {
          name: savedMessage.users?.full_name || savedMessage.users?.username || user.name,
          avatar: savedMessage.users?.avatar_url || user.avatar || ''
        }
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group consecutive messages from same user
  const groupedMessages = useMemo(() => {
    const grouped: Array<{ messages: ChatMessage[]; user: ChatMessage['user']; user_id: string }> = [];
    
    messages.forEach((message) => {
      const lastGroup = grouped[grouped.length - 1];
      if (lastGroup && lastGroup.user_id === message.user_id) {
        lastGroup.messages.push(message);
      } else {
        grouped.push({
          messages: [message],
          user: message.user,
          user_id: message.user_id
        });
      }
    });
    
    return grouped;
  }, [messages]);

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Game Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Please sign in to join the chat
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Game Chat
            {messages.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({messages.length} messages)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-gray-400")} />
            <Users className="w-4 h-4" />
            <span>{onlineUsers.size}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-64 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Be the first to say something!</p>
              </div>
            </div>
          ) : (
            groupedMessages.map((group, groupIndex) => (
              <div key={`group-${groupIndex}`} className="space-y-1">
                {group.messages.map((message, messageIndex) => {
                  const isOwnMessage = message.user_id === user.id;
                  const showHeader = messageIndex === 0;
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        isOwnMessage ? "flex-row-reverse" : ""
                      )}
                    >
                      {showHeader && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          {message.user?.avatar && (
                            <AvatarImage src={message.user.avatar} />
                          )}
                          <AvatarFallback className="text-xs">
                            {message.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!showHeader && <div className="w-8" />}
                      
                      <div className={cn("flex-1 max-w-[70%]", isOwnMessage ? "text-right" : "")}>
                        {showHeader && !isOwnMessage && (
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <span className="font-medium">{message.user?.name || 'Unknown'}</span>
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-xl px-3 py-2 text-sm w-fit",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted"
                          )}
                        >
                          {message.message}
                        </div>
                        
                        {isOwnMessage && showHeader && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={isSending || !isConnected}
              className={cn(
                "flex-1 rounded-full transition-all duration-300",
                newMessage.trim() ? "pr-12" : ""
              )}
            />
            {newMessage.trim() && (
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending || !isConnected}
                size="sm"
                className="rounded-full aspect-square animate-in fade-in slide-in-from-right-2 duration-300"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Press Enter to send • Shift+Enter for new line
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-500" : "bg-gray-400")} />
              {isConnected ? "Connected" : "Connecting..."}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
