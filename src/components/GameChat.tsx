import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Send, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

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

interface GameChatProps {
  gameId: string;
  className?: string;
}

export function GameChat({ gameId, className = '' }: GameChatProps) {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load existing messages from database
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        // Load messages from Supabase
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
          // Fallback to localStorage if database fails
          const storedMessages = localStorage.getItem(`chat-${gameId}`);
          if (storedMessages) {
            const parsed = JSON.parse(storedMessages);
            setMessages(parsed);
          }
        } else {
          // Transform database messages to component format
          const transformedMessages: ChatMessage[] = messagesData.map(msg => ({
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

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!gameId) return;

    console.log('🔗 Setting up chat realtime for game:', gameId);

    // Create channel for game chat - listen to database changes
    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `game_id=eq.${gameId}`
      }, async (payload) => {
        console.log('💬 New chat message from database:', payload);
        console.log('👤 Current user ID:', user?.id);
        console.log('📝 Message user ID:', payload.new.user_id);
        
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
          
          // Add message if it's not already in the local state (avoid duplicates)
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (!exists) {
              console.log('✅ Adding new message to chat:', newMsg.message, 'from:', newMsg.user?.name);
              return [...prev, newMsg];
            } else {
              console.log('⚠️ Message already exists, skipping:', newMsg.id);
            }
            return prev;
          });
          setTimeout(scrollToBottom, 100);
        }
      })
      .subscribe((status) => {
        console.log('📡 Chat subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Unsubscribing from chat:', gameId);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [gameId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    
    try {
      // Save message to database first
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

      // Transform and add to local state
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

      // Add to local state immediately for the sender
      setMessages(prev => [...prev, newMsg]);
      
      // Note: Real-time updates for other users will come through the postgres_changes subscription
      // No need for manual broadcasting as the database trigger handles it
      
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Show user-friendly error
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
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Game Chat
          {messages.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({messages.length} messages)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-64 overflow-y-auto p-4 space-y-3">
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
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.user_id === user.id ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {message.user?.avatar && (
                    <AvatarImage src={message.user.avatar} />
                  )}
                  <AvatarFallback className="text-xs">
                    {message.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex-1 max-w-[70%] ${
                    message.user_id === user.id ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.user_id === user.id
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    {message.user_id !== user.id && (
                      <div className="font-medium text-xs mb-1 opacity-70">
                        {message.user?.name || 'Unknown'}
                      </div>
                    )}
                    <div>{message.message}</div>
                  </div>
                  <div
                    className={`text-xs text-muted-foreground mt-1 ${
                      message.user_id === user.id ? 'text-right' : ''
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
