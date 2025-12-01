import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/core/database/supabase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/shared/utils/utils';
import { NoMessagesEmptyState } from '@/shared/components/common/EmptyState';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const oldestMessageRef = useRef<string | null>(null);

  // Enhanced scroll to bottom - scrolls only the chat container, not the page
  const scrollToBottom = useCallback(() => {
    // Use scrollTop on the container instead of scrollIntoView to prevent page scrolling
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setHasMoreMessages(true);
        oldestMessageRef.current = null;
        
        // Load the most recent 10 messages
        const { data: messagesData, error } = await supabase
          .from('chat_messages_with_author')
          .select('id, game_id, user_id, message, created_at, display_name, username, avatar_url')
          .eq('game_id', gameId)
          .order('created_at', { ascending: false })
          .limit(10);

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
          setHasMoreMessages(false);
          return;
        }

        // Check if there are more messages
        setHasMoreMessages(messagesData.length === 10);
        
        // Store oldest message timestamp for pagination
        if (messagesData.length > 0) {
          oldestMessageRef.current = messagesData[messagesData.length - 1].created_at;
        }

        // Reverse to show oldest first (newest at bottom) for proper chat display
        const reversedMessages = [...messagesData].reverse();

        // Transform messages
        const transformedMessages: ChatMessage[] = reversedMessages.map((msg: any) => {
          const authorName = msg.display_name || 'Player';
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

  // Load more messages when scrolling to top
  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || !oldestMessageRef.current) return;

    try {
      setIsLoadingMore(true);
      
      const { data: messagesData, error } = await supabase
        .from('chat_messages_with_author')
        .select('id, game_id, user_id, message, created_at, display_name, username, avatar_url')
        .eq('game_id', gameId)
        .lt('created_at', oldestMessageRef.current)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error loading older messages:', error);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      // Check if there are more messages
      setHasMoreMessages(messagesData.length === 10);
      
      // Update oldest message timestamp
      if (messagesData.length > 0) {
        oldestMessageRef.current = messagesData[messagesData.length - 1].created_at;
      }

      // Reverse to show oldest first
      const reversedMessages = [...messagesData].reverse();

      // Transform messages
      const transformedMessages: ChatMessage[] = reversedMessages.map((msg: any) => {
        const authorName = msg.display_name || 'Player';
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

      // Preserve scroll position by prepending older messages
      if (messagesContainerRef.current) {
        const previousScrollHeight = messagesContainerRef.current.scrollHeight;
        setMessages(prev => [...transformedMessages, ...prev]);
        
        // Restore scroll position after new messages are rendered
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
          }
        });
      } else {
        setMessages(prev => [...transformedMessages, ...prev]);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [gameId, isLoadingMore, hasMoreMessages]);

  // Handle scroll to load more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Load more when scrolled to top (within 50px)
      if (container.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
        loadOlderMessages();
      }
    };

    // Use passive listener for better mobile performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isLoadingMore, loadOlderMessages]);

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
          .select('id, game_id, user_id, message, created_at, display_name, username, avatar_url')
          .eq('id', payload.new.id)
          .single();

        if (fetchError || !fullMessage) {
          console.error('❌ Error fetching full message with author:', fetchError);
          return;
        }

        if (fullMessage.user_id) {
          // display_name is now a generated column, always present
          const authorName = fullMessage.display_name || 'Player';
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

      // Fetch author info from users table for the saved message
      let authorName = user?.name || 'You';
      let authorAvatar = user?.avatar || '';
      
      if (savedMessage.user_id) {
        const { data: authorProfile, error: authorError } = await supabase
          .from('users')
          .select('full_name, username, avatar_url')
          .eq('id', savedMessage.user_id)
          .single();
        
        if (!authorError && authorProfile) {
          authorName = authorProfile.full_name?.trim() || authorProfile.username?.trim() || user?.name || 'You';
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
            Activity Chat
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
            Activity Chat
            {messages.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({messages.length} messages)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-gray-400")} />
            <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <div ref={messagesContainerRef} className="h-64 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <NoMessagesEmptyState />
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
            ))}
            </>
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
          {/* Connection status removed - already shown in header */}
        </div>
      </CardContent>
    </Card>
  );
}
