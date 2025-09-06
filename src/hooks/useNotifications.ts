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
    const subscription = SupabaseService.subscribeToNotifications((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      
      if (settings.pushNotifications) {
        showNotification(newNotification);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [settings.pushNotifications]);

  const showNotification = useCallback((notification: Notification) => {
    if (!settings.pushNotifications) return;

    // Play sound if enabled
    if (settings.soundEnabled) {
      // In a real app, you'd play an actual sound file
      console.log('🔊 Notification sound played');
    }

    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => {
          // In a real app, you'd navigate to the URL
          console.log('Navigate to:', notification.actionUrl);
        }
      } : undefined,
      duration: 5000
    });

    // Request browser permission for native notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico', // Your app icon
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        timestamp: notification.timestamp.getTime()
      });
    }
  }, [settings.pushNotifications, settings.soundEnabled]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await SupabaseService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => SupabaseService.markNotificationAsRead(n.id)));
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications]);

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
      await SupabaseService.clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
      return true;
    } else {
      toast.error('Notification permission denied');
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