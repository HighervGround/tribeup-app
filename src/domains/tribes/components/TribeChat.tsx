import { useState, useRef, useEffect } from 'react';
import { useTribeChat } from '../hooks/useTribeChat';
import { useTribeChannels, useCreateChannel, useUpdateChannel, useDeleteChannel } from '../hooks/useTribeChannels';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Send, Plus, Edit2, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
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
  const { data: channels } = useTribeChannels(tribeId);
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(channelId);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isSending } = useTribeChat(selectedChannel);
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setSelectedChannel(channelId);
  }, [channelId]);

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
    <div className="flex flex-col h-[600px]">
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
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
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
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg: any) => (
                      <div key={msg.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={msg.avatar_url || undefined} />
                          <AvatarFallback>
                            {(() => {
                              const displayName = msg.display_name && !msg.display_name.includes('@') 
                                ? msg.display_name 
                                : msg.username || user?.email?.split('@')[0] || 'U';
                              return displayName.substring(0, 2).toUpperCase();
                            })()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {(() => {
                                // Prioritize display_name, then username, then current user's info, then fallback
                                if (msg.display_name && !msg.display_name.includes('@')) {
                                  return msg.display_name;
                                }
                                if (msg.username) {
                                  return msg.username;
                                }
                                // If message is from current user, use their profile info
                                if (user && msg.user_id === user.id) {
                                  return user.email?.split('@')[0] || 'You';
                                }
                                // Last resort fallback
                                return msg.user_id ? 'User' : 'Anonymous';
                              })()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {msg.created_at ? formatRelativeTime(msg.created_at) : ''}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

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

