/* CareBridge PWA service worker for mobile-first offline caching */
const CACHE_NAME = 'carebridge-cache-v6';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/applogo.png',
  '/auth/signin',
  '/auth/admin',
  '/emergency',
  '/book/nurse',
  '/book/doctor',
  '/dashboard/patient',
  '/dashboard/nurse',
  '/dashboard/doctor',
  '/dashboard/admin',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-72x72.png',
  '/icons/icon-144x144.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Skip chrome-extension, moz-extension, and other non-http(s) requests
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) return;

  // Network-only for navigation requests (NEVER cache HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/'))
    );
    return;
  }

  // Do NOT cache API calls (especially /api/auth/session)
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) {
    return; // let the request pass through normally (network)
  }

  // Only cache static asset requests (css, js, images, fonts, icons)
  const isStaticAsset = /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf)$/i.test(url.pathname)
    || url.pathname.startsWith('/icons/')
    || url.pathname === '/manifest.json';

  if (!isStaticAsset) {
    return; // don't cache other stuff
  }

  // Cache-first with network fallback for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, copy).catch((err) => {
              console.warn('Cache put failed for static asset:', err);
            });
          });
        }
        return res;
      }).catch((err) => {
        console.warn('Fetch failed:', err);
        return caches.match(req);
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from CareBridge',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CareBridge', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          // If not open, open new window
          if (clients.openWindow) {
            const targetUrl = event.notification.data?.url || '/';
            return clients.openWindow(targetUrl);
          }
        })
    );
  }
});

// Handle PWA installation events
self.addEventListener('message', (event) => {
  console.log('💬 Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

