import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { LoadingSpinner } from './ui/loading-spinner';
import { NoNotifications } from './ui/empty-state';
import { 
  Bell, 
  BellOff, 
  ArrowLeft, 
  MessageSquare, 
  Calendar, 
  Users, 
  Trash2,
  Check,
  CheckCheck,
  Settings,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useDeepLinks } from '../hooks/useDeepLinks';
import { toast } from 'sonner';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_message':
      return <MessageSquare className="w-5 h-5 text-blue-500" />;
    case 'game_reminder':
      return <Calendar className="w-5 h-5 text-orange-500" />;
    case 'game_update':
      return <Users className="w-5 h-5 text-green-500" />;
    case 'join_request':
      return <Users className="w-5 h-5 text-purple-500" />;
    case 'system':
      return <Bell className="w-5 h-5 text-gray-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getNotificationBackground = (type: string) => {
  switch (type) {
    case 'new_message':
      return 'bg-blue-500/10 border-blue-500/20';
    case 'game_reminder':
      return 'bg-orange-500/10 border-orange-500/20';
    case 'game_update':
      return 'bg-green-500/10 border-green-500/20';
    case 'join_request':
      return 'bg-purple-500/10 border-purple-500/20';
    case 'system':
      return 'bg-gray-500/10 border-gray-500/20';
    default:
      return 'bg-muted/50 border-border';
  }
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const { navigateToGame, navigateToChat, navigateToUser } = useDeepLinks();
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'games'>('all');
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotifications();

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'messages':
        return notification.type === 'new_message';
      case 'games':
        return ['game_reminder', 'game_update', 'join_request'].includes(notification.type);
      default:
        return true;
    }
  });

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to appropriate screen
    if (notification.actionUrl) {
      const url = notification.actionUrl;
      
      if (url.startsWith('/game/')) {
        const gameId = url.split('/')[2];
        navigateToGame(gameId);
      } else if (url.startsWith('/chat/')) {
        const parts = url.split('/');
        const type = parts[2] as 'game' | 'direct';
        const id = parts[3];
        navigateToChat(type, id);
      } else if (url.startsWith('/user/')) {
        const userId = url.split('/')[2];
        navigateToUser(userId);
      } else {
        navigate(url);
      }
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast.success('Notifications refreshed');
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success(`All notifications marked as read`);
  };

  const handleClearAll = () => {
    clearAll();
    toast.success('All notifications cleared');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh notifications"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings/notifications')}
              aria-label="Notification settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'new_message').length },
              { key: 'games', label: 'Games', count: notifications.filter(n => ['game_reminder', 'game_update', 'join_request'].includes(n.type)).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge 
                    variant={filter === tab.key ? "secondary" : "outline"} 
                    className="text-xs min-w-[20px] h-5"
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {notifications.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark All Read
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="px-4 py-6" id="main-content">
        {isLoading ? (
          <div
            key="loading"
            className="space-y-4"
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div
            key="empty"
          >
            <NoNotifications filter={filter} />
          </div>
        ) : (
          <div
            key="notifications"
            className="space-y-3"
          >
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
              >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? 'border-l-4 border-l-primary' : ''
                    } ${getNotificationBackground(notification.type)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                    toast.success('Marked as read');
                                  }}
                                  aria-label="Mark as read"
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                  toast.success('Notification deleted');
                                }}
                                aria-label="Delete notification"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default NotificationCenter;