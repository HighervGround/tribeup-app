// Service Worker for caching and offline support
const CACHE_VERSION = Date.now(); // Use timestamp for cache busting
const CACHE_NAME = `tribeup-v${CACHE_VERSION}`;
const STATIC_CACHE = `tribeup-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tribeup-dynamic-v${CACHE_VERSION}`;

// Files to cache on install (minimal for development)
const STATIC_FILES = [
  '/',
  '/manifest.json'
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
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    // API requests - always network first, no caching in development
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    // Static assets - network first in development for hot reloading
    event.respondWith(handleStaticRequest(request));
  } else {
    // HTML pages - always network first
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests (network first)
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
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

// Handle static assets (network first in development)
async function handleStaticRequest(request) {
  try {
    // Always try network first in development for hot reloading
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Only cache successful responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for static asset, trying cache:', request.url);
    
    // Fallback to cache only if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
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
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View Game',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});