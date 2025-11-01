import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Enhanced scroll to bottom with smooth animation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  // Load existing messages from database using chat_messages_with_author view
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        // Use chat_messages_with_author view to get messages with author info in one query
        // This avoids N+1 queries by joining with user_public_profile
        const { data: messagesData, error } = await supabase
          .from('chat_messages_with_author')
          .select('id, game_id, user_id, message, created_at, display_name, username, avatar_url, full_name')
          .eq('game_id', gameId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error loading messages:', error);
          const storedMessages = localStorage.getItem(`chat-${gameId}`);
          if (storedMessages) {
            const parsed = JSON.parse(storedMessages);
            setMessages(parsed);
          }
          return;
        }

        if (!messagesData || messagesData.length === 0) {
          setMessages([]);
          return;
        }

        // Transform messages - use display_name first, then username, then fallback
        const transformedMessages: ChatMessage[] = messagesData.map((msg: any) => {
          const authorName = msg.display_name || msg.username || msg.full_name || 'Player';
          return {
            id: msg.id,
            game_id: msg.game_id,
            user_id: msg.user_id,
            message: msg.message,
            created_at: msg.created_at,
            user: {
              name: authorName,
              avatar: msg.avatar_url || ''
            }
          };
        });
          
        setMessages(transformedMessages);
        console.log('✅ [EnhancedGameChat] Loaded messages from database:', transformedMessages.length);
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
        
        // Fetch message with author info using chat_messages_with_author view
        const { data: fullMessage, error: fetchError } = await supabase
          .from('chat_messages_with_author')
          .select('id, game_id, user_id, message, created_at, display_name, username, avatar_url, full_name')
          .eq('id', payload.new.id)
          .single();

        if (fetchError || !fullMessage) {
          console.error('❌ Error fetching full message with author:', fetchError);
          return;
        }

        if (fullMessage.user_id) {
          // Use display_name first, then username, then full_name, then fallback
          const authorName = fullMessage.display_name || fullMessage.username || fullMessage.full_name || 'Player';
          const newMsg: ChatMessage = {
            id: fullMessage.id,
            game_id: fullMessage.game_id,
            user_id: fullMessage.user_id,
            message: fullMessage.message,
            created_at: fullMessage.created_at,
            user: {
              name: authorName,
              avatar: fullMessage.avatar_url || ''
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
      .subscribe(async (status: string) => {
        console.log('📡 Enhanced chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
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
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    try {
      // Prepare insert payload
      const insertPayload = {
        game_id: gameId,
        message: newMessage.trim()
      };

      // Log exact POST payload for debugging
      console.log('📤 [Chat] POST /rest/v1/chat_messages');
      console.log('📦 [Chat] Payload:', JSON.stringify(insertPayload, null, 2));
      console.log('🔗 [Chat] gameId:', gameId);
      console.log('💬 [Chat] message:', newMessage.trim());

      // Save message to database
      // Note: user_id is automatically set by database trigger from auth.uid()
      // Required fields: game_id, message
      // Do NOT request nested author fields in insert select - use view for that
      const { data: savedMessage, error: saveError } = await supabase
        .from('chat_messages')
        .insert(insertPayload)
        .select('id, game_id, user_id, message, created_at')
        .single();

      if (saveError) {
        console.error('❌ [Chat] Error saving message to database:', saveError);
        console.error('❌ [Chat] Error details:', {
          code: saveError.code,
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint,
          status: (saveError as any).status,
          statusText: (saveError as any).statusText
        });
        console.error('❌ [Chat] Failed payload was:', JSON.stringify(insertPayload, null, 2));
        throw saveError;
      }

      console.log('✅ Message saved to database:', savedMessage);

      // Fetch author info from user_public_profile view for the saved message
      // Since we have user_id, query user_public_profile directly
      let authorName = user?.name || 'You';
      let authorAvatar = user?.avatar || '';
      
      if (savedMessage.user_id) {
        const { data: authorProfile, error: authorError } = await supabase
          .from('user_public_profile')
          .select('display_name, username, avatar_url, full_name')
          .eq('id', savedMessage.user_id)
          .single();
        
        if (!authorError && authorProfile) {
          authorName = authorProfile.display_name || authorProfile.username || authorProfile.full_name || user?.name || 'You';
          authorAvatar = authorProfile.avatar_url || user?.avatar || '';
        }
      }

      // Transform and add to local state immediately for sender
      const newMsg: ChatMessage = {
        id: savedMessage.id,
        game_id: savedMessage.game_id,
        user_id: savedMessage.user_id,
        message: savedMessage.message,
        created_at: savedMessage.created_at,
        user: {
          name: authorName,
          avatar: authorAvatar
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
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
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
