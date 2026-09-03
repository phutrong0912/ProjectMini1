/**
 * VKU Facility Audit Service Worker
 * Implements Cache-First App Shell caching strategy for sub-second offline boot
 * and Background Sync listener for offline queue processing.
 */

const CACHE_NAME = 'vku-facility-audit-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png'
];

// Install Event: Precache core app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching App Shell assets');
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches and take immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First Strategy for App Shell with offline fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle HTML navigation (SPA fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedIndex) => {
        return (
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put('/index.html', responseToCache);
              });
            }
            return networkResponse;
          }).catch(() => {
            console.log('[Service Worker] Offline fallback for navigation');
            return cachedIndex || caches.match('/');
          })
        );
      })
    );
    return;
  }

  // Cache-First strategy for static assets (JS, CSS, images, fonts, icons)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset immediately for sub-second offline boot
        return cachedResponse;
      }

      // If not in cache, fetch from network and dynamically cache
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.warn('[Service Worker] Fetch failed while offline:', request.url);
          // If requesting an image that failed, could return placeholder
          return new Response('Network unavailable and item not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});

// Background Sync API listener
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync event triggered:', event.tag);
  if (event.tag === 'sync-vku-audits' || event.tag === 'sync-facility-audits') {
    event.waitUntil(notifyClientsToSync());
  }
});

// Notify open clients to dispatch their queued surveys
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of clients) {
    client.postMessage({
      type: 'TRIGGER_BACKGROUND_SYNC',
      timestamp: Date.now()
    });
  }
}

// Client message listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
