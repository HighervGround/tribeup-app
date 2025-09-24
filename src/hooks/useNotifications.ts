import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';

interface Notification {
  id: string;
  type: 'game_update' | 'new_message' | 'game_reminder' | 'join_request' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  gameId?: string;
  userId?: string;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  gameReminders: boolean;
  messageNotifications: boolean;
  soundEnabled: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: false,
    gameReminders: true,
    messageNotifications: true,
    soundEnabled: true
  });

  // Load notifications from Supabase
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notificationsData = await SupabaseService.getNotifications();
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    let subscription: any = null;

    const setupSubscription = async () => {
      subscription = await SupabaseService.subscribeToNotifications((newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        
        if (settings.pushNotifications) {
          showNotification(newNotification);
        }
      });
    };

    setupSubscription();

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [settings.pushNotifications]);

  const showNotification = useCallback((notification: Notification) => {
    if (!settings.pushNotifications) return;

    // Play sound if enabled
    if (settings.soundEnabled) {
      // In a real app, you'd play an actual sound file
      console.log('🔊 Notification sound played');
    }

    // Show ONE notification - prefer browser notification if permission granted, otherwise toast
    const importantTypes = ['new_message', 'game_reminder', 'join_request'];
    if (importantTypes.includes(notification.type)) {
      
      // Try browser notification first for critical notifications
      if ('Notification' in window && Notification.permission === 'granted' && 
          ['new_message', 'game_reminder'].includes(notification.type)) {
        // Show browser notification only
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          timestamp: notification.timestamp.getTime(),
          silent: false
        } as NotificationOptions & { vibrate?: number[] });
      } else {
        // Show toast notification only (fallback when browser notifications not available)
        toast(notification.title, {
          description: notification.message,
          action: notification.actionUrl ? {
            label: 'View',
            onClick: () => {
              // In a real app, you'd navigate to the URL
              console.log('Navigate to:', notification.actionUrl);
            }
          } : undefined,
          duration: 4000
        });
      }
    } else {
      // For non-important notifications, always use toast
      toast(notification.title, {
        description: notification.message,
        duration: 3000
      });
    }
  }, [settings.pushNotifications, settings.soundEnabled]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Update state immediately for better UX
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update database in background
      await SupabaseService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert state on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: false }
            : notification
        )
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Get current unread notifications from state
      setNotifications(prev => {
        const unreadNotifications = prev.filter(n => !n.read);
        
        // Mark all unread notifications as read in the database
        Promise.all(unreadNotifications.map(n => SupabaseService.markNotificationAsRead(n.id)))
          .catch(error => console.error('Error marking all notifications as read:', error));
        
        // Update state immediately for better UX
        return prev.map(notification => ({ ...notification, read: true }));
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await SupabaseService.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      console.log('🗑️ Clearing all notifications...');
      await SupabaseService.clearAllNotifications();
      setNotifications([]);
      console.log('✅ All notifications cleared successfully');
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing all notifications:', error);
      toast.error('Failed to clear notifications');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notifications are blocked by user');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Only show success toast when permission is explicitly granted
      toast.success('Notifications enabled!');
      return true;
    } else {
      console.log('Notification permission denied by user');
      return false;
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // If push notifications are being enabled, request permission
    if (newSettings.pushNotifications && !settings.pushNotifications) {
      requestPermission();
    }
  }, [settings.pushNotifications, requestPermission]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 10); // Show last 10

  return {
    notifications: recentNotifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
    requestPermission
  };
}