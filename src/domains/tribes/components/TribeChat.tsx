import { useState, useRef, useEffect } from 'react';
import { useTribeChat } from '../hooks/useTribeChat';
import { useTribeChannels, useCreateChannel, useUpdateChannel, useDeleteChannel } from '../hooks/useTribeChannels';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Send, Plus, Edit2, Trash2, X } from 'lucide-react';
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
  const { data: channels } = useTribeChannels(tribeId);
  const { messages, sendMessage, isSending } = useTribeChat(selectedChannel);
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(channelId);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      await createChannel.mutateAsync({
        tribe_id: tribeId,
        name: newChannelName.trim(),
        type: 'custom',
      });
      setNewChannelName('');
      setShowCreateChannel(false);
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
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 items-center">
        {channels && channels.length > 0 && (
          <>
            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center gap-1">
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
        {canManage && (
          <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New Channel
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
                        {msg.display_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{msg.display_name || msg.username || 'Anonymous'}</span>
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
                disabled={isSending}
              />
              <Button type="submit" disabled={!message.trim() || isSending} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default TribeChat;

