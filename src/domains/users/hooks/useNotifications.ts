import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SupabaseService } from '@/core/database/supabaseService';

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

  // Load notifications from Supabase with error resilience
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notificationsData = await SupabaseService.getNotifications();
        setNotifications(notificationsData || []); // Ensure array fallback
      } catch (error) {
        console.warn('useNotifications: Failed to load notifications, using empty array:', error);
        setNotifications([]); // Set empty array on error to prevent crashes
      }
    };

    // Add small delay to prevent race conditions on refresh
    const timeoutId = setTimeout(loadNotifications, 100);
    return () => clearTimeout(timeoutId);
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
      // Update state immediately for better UX
      setNotifications(prev => {
        const updated = prev.filter(notification => notification.id !== notificationId);
        console.log('🗑️ Notification deleted, new count:', updated.filter(n => !n.read).length);
        return updated;
      });
      
      // Delete from database in background
      await SupabaseService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Reload notifications on error to sync state
      const notificationsData = await SupabaseService.getNotifications();
      setNotifications(notificationsData);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      console.log('🗑️ Clearing all notifications...');
      
      // Update state immediately for better UX
      setNotifications([]);
      console.log('✅ Notifications cleared from state, unread count now: 0');
      
      // Clear from database in background
      await SupabaseService.clearAllNotifications();
      console.log('✅ All notifications cleared from database');
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing all notifications:', error);
      toast.error('Failed to clear notifications');
      // Reload notifications on error to sync state
      try {
        const notificationsData = await SupabaseService.getNotifications();
        setNotifications(notificationsData);
      } catch (reloadError) {
        console.error('Failed to reload notifications after error:', reloadError);
      }
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
  
  // Debug logging for unread count changes
  useEffect(() => {
    console.log('📊 Notifications updated:', {
      total: notifications.length,
      unread: unreadCount,
      notifications: notifications.map(n => ({ id: n.id, read: n.read, title: n.title }))
    });
  }, [notifications, unreadCount]);

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