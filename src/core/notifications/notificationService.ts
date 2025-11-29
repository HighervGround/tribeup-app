import { supabase } from '@/core/database/supabase';
import { envConfig } from '@/core/config/envConfig';

// Notification types for push notifications
export type NotificationType = 
  | 'game_reminder'
  | 'new_message'
  | 'join_request'
  | 'game_update'
  | 'game_cancelled'
  | 'player_joined'
  | 'player_left'
  | 'weather_alert'
  | 'test';

export interface NotificationPreferences {
  gameReminders: boolean;
  gameUpdates: boolean;
  newParticipants: boolean;
  weatherAlerts: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  private static vapidPublicKey = envConfig.get('vapidPublicKey');

  // Check if push notifications are supported
  static isSupported(): boolean {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Request notification permission and register service worker
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('Push notifications not supported');
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
  private static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Subscribe to push notifications
  static async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.vapidPublicKey) {
      console.warn('VAPID public key not configured, push notifications disabled');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }
      
      // Convert to our data format
      const subscriptionData = this.convertSubscription(subscription);
      
      // Store in database
      await this.storeSubscription(subscription);
      
      return subscriptionData;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  static async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription(subscription.endpoint);
      }
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Check if currently subscribed to push notifications
  static async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      return false;
    }
  }

  // Get current push subscription
  static async getCurrentSubscription(): Promise<PushSubscriptionData | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        return null;
      }
      
      return this.convertSubscription(subscription);
    } catch (error) {
      console.error('Error getting current subscription:', error);
      return null;
    }
  }

  // Convert PushSubscription to our data format
  private static convertSubscription(subscription: PushSubscription): PushSubscriptionData {
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    
    return {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: p256dhKey ? this.arrayBufferToBase64(p256dhKey) : '',
        auth: authKey ? this.arrayBufferToBase64(authKey) : ''
      }
    };
  }

  // Store push subscription in database
  private static async storeSubscription(subscription: PushSubscription): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Cannot store subscription: user not authenticated');
      return;
    }

    const subscriptionData = this.convertSubscription(subscription);

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          endpoint: subscription.endpoint,
          user_agent: navigator.userAgent
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('Error storing subscription:', error);
      } else {
        console.log('Push subscription stored successfully');
      }
    } catch (error) {
      console.error('Error storing subscription:', error);
    }
  }

  // Remove subscription from database
  private static async removeSubscription(endpoint: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('Error removing subscription:', error);
      } else {
        console.log('Push subscription removed successfully');
      }
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  }

  // Send push notification via Edge Function
  static async sendPushNotification(
    userId: string | string[],
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: Array.isArray(userId) ? undefined : userId,
          userIds: Array.isArray(userId) ? userId : undefined,
          title,
          body,
          type,
          data
        }
      });

      if (error) {
        console.error('Error sending push notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
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

  // Send immediate local notification (browser notification)
  static async sendLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
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

  // Utility function to convert ArrayBuffer to base64
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
