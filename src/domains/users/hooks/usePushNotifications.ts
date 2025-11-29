import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { NotificationService, PushSubscriptionData } from '@/core/notifications/notificationService';
import { envConfig } from '@/core/config/envConfig';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscriptionData | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePushNotificationsOptions {
  autoSubscribe?: boolean;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { autoSubscribe = false } = options;

  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscription: null,
    isLoading: false,
    error: null
  });

  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = NotificationService.isSupported();
    setState(prev => ({ ...prev, isSupported }));
    return isSupported;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      setServiceWorkerRegistration(registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setState(prev => ({ ...prev, error: 'Failed to register service worker' }));
      return null;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      setState(prev => ({ ...prev, error: 'Notifications not supported' }));
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      switch (permission) {
        case 'granted':
          // Only show toast for successful permission grant
          toast.success('Notifications enabled!');
          break;
        case 'denied':
          // Show error only when explicitly denied
          console.log('Notifications blocked by user');
          break;
        case 'default':
          // Don't show toast for pending state
          console.log('Notification permission pending');
          break;
      }

      return permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      setState(prev => ({ ...prev, error: 'Failed to request permission' }));
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscriptionData | null> => {
    // Check for VAPID key
    const vapidPublicKey = envConfig.get('vapidPublicKey');
    if (!vapidPublicKey) {
      console.warn('VAPID public key not configured');
      setState(prev => ({ ...prev, error: 'Push notifications not configured' }));
      return null;
    }

    if (state.permission !== 'granted') {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use NotificationService to subscribe
      const subscriptionData = await NotificationService.subscribeToPush();

      if (subscriptionData) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription: subscriptionData,
          isLoading: false
        }));
        return subscriptionData;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to create push subscription'
        }));
        return null;
      }

    } catch (error) {
      console.error('Push subscription failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to subscribe to push notifications'
      }));
      // Only show error toast for actual failures
      toast.error('Failed to enable push notifications');
      return null;
    }
  }, [state.permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await NotificationService.unsubscribeFromPush();

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        isLoading: false
      }));

      return success;

    } catch (error) {
      console.error('Unsubscribe failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to unsubscribe from push notifications'
      }));
      return false;
    }
  }, []);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    try {
      const subscriptionData = await NotificationService.getCurrentSubscription();
      
      if (subscriptionData) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription: subscriptionData
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null
        }));
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed) {
      toast.error('Not subscribed to notifications');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Send a local notification for testing
      await NotificationService.sendLocalNotification(
        'Test Notification',
        'This is a test notification from TribeUp! 🎉',
        { type: 'test', url: '/' }
      );

      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isSubscribed]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (!checkSupport()) {
        return;
      }

      // Get current permission
      if ('Notification' in window) {
        setState(prev => ({ ...prev, permission: Notification.permission }));
      }

      // Register service worker
      const registration = await registerServiceWorker();
      
      if (registration) {
        // Check existing subscription
        await checkSubscription();
        
        // Auto-subscribe if requested and permission granted
        if (autoSubscribe && Notification.permission === 'granted') {
          const isSubscribed = await NotificationService.isSubscribed();
          if (!isSubscribed) {
            await subscribe();
          }
        }
      }
    };

    init();
  }, [checkSupport, registerServiceWorker, checkSubscription, subscribe, autoSubscribe]);

  return {
    // State
    ...state,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    
    // Service Worker
    serviceWorkerRegistration,
    
    // Utilities
    canSubscribe: state.isSupported && state.permission === 'granted' && !state.isSubscribed,
    shouldRequestPermission: state.isSupported && state.permission === 'default'
  };
}

// Re-export the PushSubscriptionData type for convenience
export type { PushSubscriptionData };