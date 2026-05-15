const CACHE_NAME = 'muslim-beginner-v1';
const BASE_PATH = '/muslimbeginner/';

// Fail-fail asas yang wajib ada untuk app berfungsi
const PRE_CACHE_RESOURCES = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'favicon-32x32.png',
  BASE_PATH + 'logo192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_RESOURCES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Jangan cache request ke API Tadabbur (sebab AI perlukan internet)
  if (e.request.url.includes('/api/tadabbur')) {
    return; 
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        // Simpan fail baru ke cache secara dinamik (termasuk JS/CSS assets)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback jika offline dan fail tiada dalam cache
        if (e.request.mode === 'navigate') {
          return caches.match(BASE_PATH + 'index.html');
        }
      });
    })
  );
});
