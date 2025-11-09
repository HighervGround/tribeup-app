import { supabase } from '@/core/database/supabase';
import { envConfig } from '@/core/config/envConfig';

export interface NotificationPreferences {
  gameReminders: boolean;
  gameUpdates: boolean;
  newParticipants: boolean;
  weatherAlerts: boolean;
}

export class NotificationService {
  private static vapidPublicKey = envConfig.get('vapidPublicKey');

  // Request notification permission and register service worker
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.registerServiceWorker();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Register service worker for push notifications
  private static async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications if permission is granted and VAPID key is configured
      if (Notification.permission === 'granted' && this.vapidPublicKey) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
        
        await this.storeSubscription(subscription);
      } else if (!this.vapidPublicKey) {
        console.warn('VAPID public key not configured, push notifications disabled');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Store push subscription in database
  private static async storeSubscription(subscription: PushSubscription): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing subscription:', error);
    }
  }

  // Schedule game reminder notification
  static async scheduleGameReminder(gameId: string, gameDate: string, gameTitle: string): Promise<void> {
    const reminderTime = new Date(gameDate);
    reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before

    try {
      await supabase
        .from('scheduled_notifications')
        .insert({
          game_id: gameId,
          notification_type: 'game_reminder',
          scheduled_for: reminderTime.toISOString(),
          title: 'Activity Reminder',
          body: `Don't forget about "${gameTitle}" tomorrow!`,
          data: { gameId, type: 'reminder' }
        });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Send immediate notification
  static async sendNotification(title: string, body: string, data?: any): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data,
        tag: 'tribeup-notification'
      });
    }
  }

  // Update notification preferences
  static async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notifications: preferences,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  // Get notification preferences
  static async getPreferences(): Promise<NotificationPreferences> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return this.getDefaultPreferences();

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notifications')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return this.getDefaultPreferences();
      return data.notifications;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  private static getDefaultPreferences(): NotificationPreferences {
    return {
      gameReminders: true,
      gameUpdates: true,
      newParticipants: false,
      weatherAlerts: true
    };
  }

  // Utility function to convert VAPID key
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
