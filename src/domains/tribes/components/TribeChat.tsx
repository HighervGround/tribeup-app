import { useState, useRef, useEffect } from 'react';
import { useTribeChat } from '../hooks/useTribeChat';
import { useTribeChannels, useCreateChannel, useUpdateChannel, useDeleteChannel } from '../hooks/useTribeChannels';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Send, Plus, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { NoMessagesEmptyState } from '@/shared/components/common/EmptyState';
import { useDeepLinks } from '@/shared/hooks/useDeepLinks';

// Simple relative time formatter
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface TribeChatProps {
  channelId: string;
  tribeId: string;
  canManage?: boolean;
}

export function TribeChat({ channelId, tribeId, canManage = false }: TribeChatProps) {
  const { user } = useAppStore();
  const { navigateToUser } = useDeepLinks();
  const { data: channels } = useTribeChannels(tribeId);
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(channelId);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const oldestMessageRef = useRef<string | null>(null);
  
  const { messages, sendMessage, isSending } = useTribeChat(selectedChannel);
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setSelectedChannel(channelId);
    setHasMoreMessages(true);
    oldestMessageRef.current = null;
  }, [channelId]);

  // Update oldest message ref when messages change
  useEffect(() => {
    if (messages.length > 0) {
      oldestMessageRef.current = messages[0].created_at;
      // Check if we have more messages (if we got exactly 10, there might be more)
      setHasMoreMessages(messages.length === 10);
    }
  }, [messages]);

  // Load older messages when scrolling to top
  const loadOlderMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || !oldestMessageRef.current || !selectedChannel) return;

    try {
      setIsLoadingMore(true);
      
      const { TribeChannelService } = await import('../services/tribeChannelService');
      const olderMessages = await TribeChannelService.getChannelMessages(
        selectedChannel,
        10,
        oldestMessageRef.current
      );

      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      setHasMoreMessages(olderMessages.length === 10);
      
      if (olderMessages.length > 0) {
        oldestMessageRef.current = olderMessages[0].created_at;
      }

      // Note: Since messages come from a hook, we can't directly update them here
      // The hook will need to be updated to support loading more messages
      // For now, this function is set up but won't actually update the messages
      // TODO: Update useTribeChat hook to support loading more messages
      console.log('Loaded older messages:', olderMessages.length);
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle scroll to load more messages
  useEffect(() => {
    if (!selectedChannel) return;

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
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreMessages, isLoadingMore, selectedChannel, loadOlderMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    await sendMessage(message);
    setMessage('');
  };

  const currentChannel = channels?.find((c) => c.id === selectedChannel);
  const hasChannels = channels && channels.length > 0;

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !user?.id) return;
    try {
      const newChannel = await createChannel.mutateAsync({
        tribe_id: tribeId,
        name: newChannelName.trim(),
        type: 'custom',
        created_by: user.id,
      });
      setNewChannelName('');
      setShowCreateChannel(false);
      // Auto-select the newly created channel
      if (newChannel) {
        setSelectedChannel(newChannel.id);
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateChannel = async (channelId: string) => {
    if (!editChannelName.trim()) return;
    try {
      await updateChannel.mutateAsync({
        channelId,
        updates: { name: editChannelName.trim() },
      });
      setEditingChannel(null);
      setEditChannelName('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (window.confirm('Are you sure you want to delete this channel? This cannot be undone.')) {
      try {
        await deleteChannel.mutateAsync(channelId);
        if (selectedChannel === channelId && channels && channels.length > 1) {
          setSelectedChannel(channels.find((c) => c.id !== channelId)?.id || channelId);
        }
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  return (
    <div className="flex flex-col" style={{ height: '600px', minHeight: '600px' }}>
      {/* Channel Selector */}
      <div className="flex gap-2 mb-4 items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1 items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {channels && channels.length > 0 && (
            <>
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-center gap-1 flex-shrink-0">
                  {editingChannel === channel.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editChannelName}
                        onChange={(e) => setEditChannelName(e.target.value)}
                        onBlur={() => {
                          if (editChannelName.trim()) {
                            handleUpdateChannel(channel.id);
                          } else {
                            setEditingChannel(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editChannelName.trim()) {
                            handleUpdateChannel(channel.id);
                          } else if (e.key === 'Escape') {
                            setEditingChannel(null);
                            setEditChannelName('');
                          }
                        }}
                        className="h-8 w-32"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        variant={selectedChannel === channel.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedChannel(channel.id)}
                        className="whitespace-nowrap"
                      >
                        {channel.name}
                      </Button>
                      {canManage && channel.type === 'custom' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingChannel(channel.id);
                              setEditChannelName(channel.name);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteChannel(channel.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
        {canManage && (
          <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="gap-2 flex-shrink-0 whitespace-nowrap">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Channel</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Channel</DialogTitle>
                <DialogDescription>
                  Create a new channel for your tribe members to chat in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="channel-name">Channel Name</Label>
                  <Input
                    id="channel-name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g., Game Planning"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newChannelName.trim()) {
                        handleCreateChannel();
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {!hasChannels ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground mb-4">No channels yet</p>
              {canManage && (
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first channel to start chatting with tribe members
                </p>
              )}
            </div>
          ) : !selectedChannel ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">Select a channel to view messages</p>
            </div>
          ) : (
            <>
              <div 
                ref={messagesContainerRef} 
                className="flex-1 overflow-y-auto p-4 min-h-0"
              >
                {messages.length === 0 ? (
                  <NoMessagesEmptyState isChannel={true} />
                ) : (
                  <div className="space-y-1">
                    {isLoadingMore && (
                      <div className="flex items-center justify-center py-2">
                        <div className="text-xs text-muted-foreground">Loading older messages...</div>
                      </div>
                    )}
                    {messages.map((msg: any, index: number) => {
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const timeDiff = prevMsg && msg.created_at && prevMsg.created_at
                        ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
                        : Infinity;
                      const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id || timeDiff > 300000; // 5 minutes
                      const isOwnMessage = user && msg.user_id === user.id;
                      
                      // Get display name for the user
                      const getUserDisplayName = () => {
                        if (msg.display_name && !msg.display_name.includes('@')) {
                          return msg.display_name;
                        }
                        if (msg.username) {
                          return msg.username;
                        }
                        if (user && msg.user_id === user.id) {
                          return user.name || user.email?.split('@')[0] || 'You';
                        }
                        return 'User';
                      };
                      
                      const displayName = getUserDisplayName();
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={cn(
                            "flex gap-3",
                            isOwnMessage ? "flex-row-reverse" : ""
                          )}
                        >
                          {showHeader ? (
                            <Avatar 
                              className={cn(
                                "w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                              )}
                              onClick={() => {
                                if (msg.user_id) {
                                  navigateToUser(msg.user_id);
                                }
                              }}
                            >
                              <AvatarImage src={msg.avatar_url || undefined} />
                              <AvatarFallback>
                                {displayName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8" />
                          )}
                          <div className={cn("flex-1 max-w-[70%]", isOwnMessage ? "text-right" : "")}>
                            {showHeader && (
                              <div 
                                className={cn(
                                  "flex items-center gap-2 text-xs mb-1",
                                  isOwnMessage ? "justify-end flex-row-reverse" : ""
                                )}
                              >
                                <span className="font-medium">{displayName}</span>
                                <span className="text-muted-foreground">
                                  {msg.created_at ? formatRelativeTime(msg.created_at) : ''}
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
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSend} className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message ${currentChannel?.name || 'channel'}...`}
                    disabled={isSending || !selectedChannel}
                  />
                  <Button type="submit" disabled={!message.trim() || isSending || !selectedChannel} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TribeChat;

