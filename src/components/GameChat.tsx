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

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        // For now, use localStorage to simulate chat messages
        // In a real app, this would be a Supabase query
        const storedMessages = localStorage.getItem(`chat-${gameId}`);
        if (storedMessages) {
          const parsed = JSON.parse(storedMessages);
          setMessages(parsed);
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

    // Create channel for game chat
    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('💬 New chat message:', payload);
        
        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          game_id: gameId,
          user_id: payload.payload.user_id,
          message: payload.payload.message,
          created_at: new Date().toISOString(),
          user: {
            name: payload.payload.user_name,
            avatar: payload.payload.user_avatar
          }
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        // Update localStorage
        const updated = [...messages, newMsg];
        localStorage.setItem(`chat-${gameId}`, JSON.stringify(updated));
        
        setTimeout(scrollToBottom, 100);
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
  }, [gameId, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    
    try {
      const messageData = {
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      // Broadcast message to other users
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: messageData
        });
      }

      // Add to local state immediately
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        game_id: gameId,
        user_id: user.id,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        user: {
          name: user.name,
          avatar: user.avatar
        }
      };

      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      
      // Save to localStorage
      localStorage.setItem(`chat-${gameId}`, JSON.stringify(updatedMessages));
      
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
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
