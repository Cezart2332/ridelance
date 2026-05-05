/*
 * Minimal Service Worker for Push Notifications
 * ZERO aggressive caching, IMMEDIATE updates.
 */

// This is a placeholder for VitePWA to inject the manifest. 
// We are NOT using it because we want ZERO aggressive caching.
// @ts-ignore
const manifest = self.__WB_MANIFEST; 

self.addEventListener('install', () => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Ensure the service worker takes control of all clients immediately.
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clear all caches to ensure ZERO aggressive caching
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    ])
  );
});

// ZERO caching: Always fetch from network
self.addEventListener('fetch', (event) => {
  // No caching logic here. 
  // By not calling event.respondWith(), we let the browser handle it normally (network).
  return;
});

// Push Notification Handling
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Ridelance';
  const options = {
    body: data.body || 'Ai primit o notificare nouă.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: data.url || '/',
    ...data.options
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open with the URL, focus it
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
