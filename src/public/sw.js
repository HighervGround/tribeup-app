// Service Worker for TribeUp
// Handles push notifications, background sync, and offline functionality

const CACHE_NAME = 'tribeup-v1';
const STATIC_CACHE_NAME = 'tribeup-static-v1';
const DYNAMIC_CACHE_NAME = 'tribeup-dynamic-v1';

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
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
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails, serve offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'TribeUp',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'general',
    data: {},
    actions: []
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  // Customize notification based on type
  if (notificationData.data.type) {
    switch (notificationData.data.type) {
      case 'new_message':
        notificationData.title = `New message from ${notificationData.data.senderName}`;
        notificationData.tag = `message-${notificationData.data.chatId}`;
        notificationData.actions = [
          { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
          { action: 'view', title: 'View Chat', icon: '/icons/view.png' }
        ];
        break;

      case 'game_reminder':
        notificationData.title = 'Activity Starting Soon';
        notificationData.tag = `game-${notificationData.data.gameId}`;
        notificationData.actions = [
          { action: 'view_game', title: 'View Activity', icon: '/icons/game.png' },
          { action: 'get_directions', title: 'Get Directions', icon: '/icons/directions.png' }
        ];
        break;

      case 'join_request':
        notificationData.title = 'Someone joined your activity';
        notificationData.tag = `join-${notificationData.data.gameId}`;
        notificationData.actions = [
          { action: 'view_game', title: 'View Activity', icon: '/icons/game.png' }
        ];
        break;

      case 'game_update':
        notificationData.title = 'Activity Updated';
        notificationData.tag = `update-${notificationData.data.gameId}`;
        break;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.data.urgent || false,
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  let urlToOpen = '/';

  // Handle different actions
  switch (action) {
    case 'reply':
      urlToOpen = `/chat/${data.chatType}/${data.chatId}`;
      break;
    case 'view':
    case 'view_game':
      if (data.gameId) {
        urlToOpen = `/game/${data.gameId}`;
      } else if (data.chatId) {
        urlToOpen = `/chat/${data.chatType}/${data.chatId}`;
      }
      break;
    case 'get_directions':
      if (data.location) {
        urlToOpen = `https://maps.google.com/maps?daddr=${data.location.lat},${data.location.lng}`;
      }
      break;
    default:
      // Default click behavior
      if (data.url) {
        urlToOpen = data.url;
      } else if (data.gameId) {
        urlToOpen = `/game/${data.gameId}`;
      } else if (data.chatId) {
        urlToOpen = `/chat/${data.chatType}/${data.chatId}`;
      }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(new URL(urlToOpen, self.location.origin).pathname) && 'focus' in client) {
            return client.focus();
          }
        }

        // If not open, open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);

  if (event.tag === 'send-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

// Background sync functions
async function syncMessages() {
  try {
    // Get pending messages from IndexedDB
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        // Attempt to send message
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          // Remove from pending queue
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncGameData() {
  try {
    // Sync game updates, join requests, etc.
    const response = await fetch('/api/games/sync', {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      // Update local cache with fresh data
      await updateGameCache(data);
    }
  } catch (error) {
    console.error('Failed to sync game data:', error);
  }
}

// IndexedDB helper functions (simplified)
async function getPendingMessages() {
  // Implementation would use IndexedDB to store/retrieve pending messages
  return [];
}

async function removePendingMessage(messageId) {
  // Implementation would remove message from IndexedDB
}

async function updateGameCache(data) {
  // Implementation would update cached game data
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'game-updates') {
    event.waitUntil(syncGameData());
  }
});