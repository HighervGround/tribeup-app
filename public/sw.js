// Service Worker for caching and offline support
const CACHE_VERSION = 'v2.1'; // Updated version for production fixes
const CACHE_NAME = `tribeup-v${CACHE_VERSION}`;
const STATIC_CACHE = `tribeup-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tribeup-dynamic-v${CACHE_VERSION}`;

// Files to cache on install - essential files only to prevent loading delays
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Critical resources to preload for faster startup
const CRITICAL_RESOURCES = [
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete ALL old caches that don't match current version
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated, clearing all old caches');
        // Force immediate control of all clients
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests with optimized strategies
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    // API requests - network first with timeout to prevent hanging
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/)) {
    // Static assets - cache first for performance, network fallback
    event.respondWith(handleStaticRequest(request));
  } else if (url.pathname === '/' || url.pathname.startsWith('/src/')) {
    // Critical app files - network first with fast timeout
    event.respondWith(handleCriticalRequest(request));
  } else {
    // HTML pages - network first with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle critical app files (network first with fast timeout)
async function handleCriticalRequest(request) {
  try {
    // Fast network request with 2-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const networkResponse = await fetch(request, { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for critical request, trying cache:', request.url);
    
    // Fallback to cache immediately
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache and it's the root, try to serve index.html
    if (request.url.endsWith('/')) {
      return new Response('<!DOCTYPE html><html><head><title>Loading...</title></head><body><div>Loading TribeUp...</div></body></html>', {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Resource not available', { status: 404 });
  }
}

// Handle API requests (network first with timeout)
async function handleApiRequest(request) {
  try {
    // Network request with 5-second timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const networkResponse = await fetch(request, { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline response
    return new Response(
      JSON.stringify({ error: 'Offline - no cached data available' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets (cache first for performance)
async function handleStaticRequest(request) {
  // Check cache first for static assets
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static asset:', request.url);
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle HTML pages (network first)
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for page request, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to index.html for SPA routing
    if (request.mode === 'navigate') {
      const indexResponse = await caches.match('/');
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    return new Response('Page not available offline', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Performing background sync...');
  
  // Get pending actions from IndexedDB
  const pendingActions = await getPendingActions();
  
  for (const action of pendingActions) {
    try {
      await performAction(action);
      await removePendingAction(action.id);
    } catch (error) {
      console.log('Background sync failed for action:', action.id);
    }
  }
}

// Helper functions for background sync
async function getPendingActions() {
  // This would integrate with IndexedDB to get pending actions
  return [];
}

async function performAction(action) {
  // This would perform the actual action (join game, etc.)
  console.log('Performing action:', action);
}

async function removePendingAction(actionId) {
  // This would remove the action from IndexedDB
  console.log('Removing action:', actionId);
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      // If not JSON, treat as text
      data = {
        title: 'TribeUp',
        body: event.data.text()
      };
    }
    
    // Get notification options based on type
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'tribeup-notification',
      requireInteraction: data.requireInteraction || false,
      data: {
        dateOfArrival: Date.now(),
        url: data.data?.url || '/',
        type: data.data?.type || 'general',
        gameId: data.data?.gameId,
        ...data.data
      },
      actions: data.actions || getDefaultActions(data.data?.type)
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'TribeUp', options)
    );
  }
});

// Helper function to get default actions based on notification type
function getDefaultActions(type) {
  switch (type) {
    case 'game_reminder':
      return [
        { action: 'view', title: 'View Game', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'new_message':
      return [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View' }
      ];
    case 'join_request':
      return [
        { action: 'approve', title: 'Approve' },
        { action: 'view', title: 'View' }
      ];
    case 'game_update':
    case 'player_joined':
    case 'player_left':
    case 'weather_alert':
      return [
        { action: 'view', title: 'View Game' }
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ];
  }
}

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = data.url || '/';
  
  // Handle specific actions
  if (event.action === 'view' || event.action === 'explore') {
    // Navigate to the relevant page
    if (data.gameId) {
      url = `/app/game/${data.gameId}`;
    }
  } else if (event.action === 'reply' && data.gameId) {
    url = `/app/game/${data.gameId}/chat`;
  } else if (event.action === 'dismiss' || event.action === 'close') {
    // Just close, don't open anything
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            // Navigate to the target URL
            client.navigate(url);
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {};
  console.log('Notification closed:', data.type);
});