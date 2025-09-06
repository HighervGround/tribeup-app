import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { ArrowLeft, Send, MoreVertical, Phone, Video, Keyboard } from 'lucide-react';
import { useGames } from '../store/appStore';
import { ChatMessageSkeleton } from './ui/loading-skeleton';
import { NoMessages } from './ui/empty-state';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeepLinks } from '../hooks/useDeepLinks';
import { useCustomShortcuts } from '../hooks/useKeyboardShortcuts';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: Date;
  isCurrentUser: boolean;
}



export function ChatMessaging() {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const games = useGames();
  const { navigateToUser, copyCurrentUrl } = useDeepLinks();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get context based on URL params
  const context = React.useMemo(() => {
    if (!type || !id) return null;
    
    if (type === 'game') {
      const game = games.find(g => g.id === id);
      return {
        type: 'game' as const,
        id,
        title: game?.title || 'Game Chat',
        gameData: game
      };
    } else if (type === 'direct') {
      // In a real app, you'd fetch user data by ID
      return {
        type: 'direct' as const,
        id,
        title: 'Unknown User' // Will be loaded from user store
      };
    }
    
    return null;
  }, [type, id, games]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from Supabase
  useEffect(() => {
    const loadMessages = async () => {
      if (!context) return;
      
      setIsLoading(true);
      try {
        let messagesData: ChatMessage[] = [];
        
        if (context.type === 'game') {
          messagesData = await SupabaseService.getChatMessages('game', context.id);
        } else if (context.type === 'direct') {
          messagesData = await SupabaseService.getChatMessages('direct', context.id);
        }
        
        setMessages(messagesData);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [context]);

  // Set up custom keyboard shortcuts for chat
  useCustomShortcuts([
    {
      key: 'i',
      description: 'View user info',
      action: () => {
        if (context?.type === 'direct') {
          navigateToUser(context.id);
        } else if (context?.type === 'game' && context.gameData) {
          navigate(`/game/${context.id}`);
        }
      },
      disabled: !context
    },
    {
      key: 'u',
      description: 'Copy chat URL',
      action: async () => {
        const success = await copyCurrentUrl();
        if (success) {
          toast.success('Chat link copied!', {
            description: 'Share this chat with others'
          });
        }
      }
    },
    {
      key: '/',
      description: 'Focus message input',
      action: () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  ]);

  // WebSocket integration
  const {
    isConnected,
    isConnecting,
    messages: wsMessages,
    typingUsers,
    onlineUsers,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
    error: wsError
  } = useWebSocket({
    chatId: `${context?.type}-${context?.id}` || 'general',
    userId: 'current-user',
    userName: 'You',
    autoConnect: true
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle pre-filled message from deep link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prefilledMessage = urlParams.get('message');
    
    if (prefilledMessage && inputRef.current) {
      setNewMessage(decodeURIComponent(prefilledMessage));
      inputRef.current.focus();
      
      // Clear the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
      
      toast.info('Message pre-filled from shared link');
    }
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Send via WebSocket if connected, otherwise add locally
    if (isConnected) {
      wsSendMessage(newMessage);
    } else {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'current',
        senderName: 'You',
        senderAvatar: 'YO',
        message: newMessage,
        timestamp: new Date(),
        isCurrentUser: true
      };
      setMessages(prev => [...prev, message]);
    }

    setNewMessage('');
    stopTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
      // Allow line breaks with Shift+Enter or Ctrl+Enter
      // This would be handled by a textarea component in a real implementation
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCall = () => {
    toast.info('Voice calling feature coming soon!');
  };

  const handleVideoCall = () => {
    toast.info('Video calling feature coming soon!');
  };

  if (!context) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Chat not found</p>
          <p className="text-sm text-muted-foreground mb-4">
            The chat you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              {context.type === 'direct' ? (
                <button
                  onClick={() => navigateToUser(context.id)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  data-action="view-profile"
                >
                  <Avatar>
                    <AvatarFallback>
                      {context.title.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-lg">{context.title}</h1>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/game/${context.id}`)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar>
                    <AvatarFallback>🏀</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-lg">{context.title}</h1>
                    <p className="text-sm text-muted-foreground">
                      {messages.length} messages • {onlineUsers.length} online
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {context.type === 'direct' && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCall}
                  aria-label="Voice call"
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleVideoCall}
                  aria-label="Video call"
                >
                  <Video className="w-5 h-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {context.type === 'game' && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                Game Chat • {context.gameData?.sport || 'Pickup Game'}
              </Badge>
              
              {/* Keyboard shortcuts hint for desktop */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="w-3 h-3" />
                <span>I = Game info</span>
                <span>U = Copy link</span>
                <span>/ = Focus input</span>
              </div>
            </div>
          </div>
        )}

        {context.type === 'direct' && (
          <div className="hidden lg:block px-4 pb-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Keyboard className="w-3 h-3" />
                Shortcuts:
              </span>
              <span>I = User profile</span>
              <span>U = Copy link</span>
              <span>/ = Focus input</span>
            </div>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {wsError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <div className="w-2 h-2 bg-destructive rounded-full" />
            <span>Chat offline - messages will be sent when connection is restored</span>
          </div>
        </div>
      )}

      {isConnecting && (
        <div className="bg-warning/10 border-b border-warning/20 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-warning-foreground">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span>Connecting to chat...</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" id="main-content">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <ChatMessageSkeleton 
                key={index} 
                isOwn={index % 3 === 0} 
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <NoMessages />
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
            const showAvatar = !message.isCurrentUser && (
              index === messages.length - 1 || 
              messages[index + 1].senderId !== message.senderId ||
              messages[index + 1].isCurrentUser
            );

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-6">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(message.timestamp)}
                    </Badge>
                  </div>
                )}
                
                <div className={`flex gap-3 ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  {!message.isCurrentUser && (
                    <button
                      onClick={() => navigateToUser(message.senderId)}
                      className={`${showAvatar ? 'opacity-100' : 'opacity-0'} hover:opacity-80 transition-opacity`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{message.senderAvatar}</AvatarFallback>
                      </Avatar>
                    </button>
                  )}
                  
                  <div className={`max-w-xs lg:max-w-md ${message.isCurrentUser ? 'order-first' : ''}`}>
                    {!message.isCurrentUser && showAvatar && (
                      <button 
                        onClick={() => navigateToUser(message.senderId)}
                        className="text-xs text-muted-foreground mb-1 px-3 hover:text-primary transition-colors"
                      >
                        {message.senderName}
                      </button>
                    )}
                    
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.isCurrentUser 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    </div>
                    
                    <div className={`text-xs text-muted-foreground mt-1 px-3 ${
                      message.isCurrentUser ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                startTyping();
              }}
              onKeyDown={handleKeyPress}
              onBlur={stopTyping}
              placeholder={`Message ${context.type === 'game' ? 'the group' : context.title}...`}
              className="min-h-[44px] resize-none rounded-full px-4"
              data-action="send-message"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="h-11 w-11 rounded-full"
            title="Send message (Enter)"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Input hints */}
        <div className="mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send • / to focus input • ? for all shortcuts</span>
        </div>
      </div>
    </div>
  );
}

export default ChatMessaging;