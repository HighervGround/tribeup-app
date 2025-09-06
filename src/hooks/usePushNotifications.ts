import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePushNotificationsOptions {
  vapidPublicKey?: string;
  autoSubscribe?: boolean;
  serviceWorkerUrl?: string;
}

const DEFAULT_VAPID_KEY = 'BCmjGZmgUDGgJG3g5y8FPAGgGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGGjGG'; // Mock VAPID key

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const {
    vapidPublicKey = DEFAULT_VAPID_KEY,
    autoSubscribe = false,
    serviceWorkerUrl = '/sw.js'
  } = options;

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
    const isSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

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
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      setServiceWorkerRegistration(registration);
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast.info('App update available', {
                action: {
                  label: 'Refresh',
                  onClick: () => window.location.reload()
                }
              });
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setState(prev => ({ ...prev, error: 'Failed to register service worker' }));
      return null;
    }
  }, [serviceWorkerUrl]);

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
          toast.success('Notifications enabled!');
          break;
        case 'denied':
          toast.error('Notifications blocked. You can enable them in your browser settings.');
          break;
        case 'default':
          toast.info('Notification permission pending');
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
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!serviceWorkerRegistration) {
      toast.error('Service worker not available');
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
      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };

      // Send subscription to server
      await sendSubscriptionToServer(subscriptionData);

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription: subscriptionData,
        isLoading: false
      }));

      toast.success('Push notifications enabled!');
      return subscriptionData;

    } catch (error) {
      console.error('Push subscription failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to subscribe to push notifications'
      }));
      toast.error('Failed to enable push notifications');
      return null;
    }
  }, [serviceWorkerRegistration, state.permission, requestPermission, vapidPublicKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!serviceWorkerRegistration) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        
        // Remove subscription from server
        if (state.subscription) {
          await removeSubscriptionFromServer(state.subscription);
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        isLoading: false
      }));

      toast.success('Push notifications disabled');
      return true;

    } catch (error) {
      console.error('Unsubscribe failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to unsubscribe from push notifications'
      }));
      return false;
    }
  }, [serviceWorkerRegistration, state.subscription]);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!serviceWorkerRegistration) return;

    try {
      const pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      if (pushSubscription) {
        const subscriptionData: PushSubscription = {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
          }
        };

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
  }, [serviceWorkerRegistration]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed || !state.subscription) {
      toast.error('Not subscribed to notifications');
      return;
    }

    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: state.subscription,
          notification: {
            title: 'Test Notification',
            body: 'This is a test notification from TribeUp!',
            data: {
              type: 'test',
              url: '/'
            }
          }
        })
      });

      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  }, [state.isSubscribed, state.subscription]);

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
          const existingSubscription = await registration.pushManager.getSubscription();
          if (!existingSubscription) {
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

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  // Mock implementation - in a real app, send to your backend
  console.log('Sending subscription to server:', subscription);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  // Mock implementation - in a real app, remove from your backend
  console.log('Removing subscription from server:', subscription);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
}