const CACHE_NAME = 'wirid-doa-v2';

self.addEventListener('install', (e) => {
  // Pre-cache the main files for immediate offline access
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/wiriddandoaselepassolat/',
        '/wiriddandoaselepassolat/index.html',
        '/wiriddandoaselepassolat/manifest.json',
        '/wiriddandoaselepassolat/favicon-32x32.png',
        '/wiriddandoaselepassolat/logo192.png'
      ]);
    })
  );
  // Memaksa service worker baru bertugas serta-merta apabila di-update
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Menghapuskan versi cache yang lama jika ada kemas kini
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Hanya proses GET requests
  if (e.request.method !== 'GET') return;

  // STRATEGI: NETWORK FIRST, FALLBACK TO CACHE
  // Cuba ambil versi terkini dari internet. Jika gagal (offline), guna versi dalam memori (cache).
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Jika internet ada dan berjaya, kita simpan versi terkini ke dalam cache secara diam-diam
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika internet TIADA, ambil apa sahaja yang sudah tersimpan di cache
        return caches.match(e.request);
      })
  );
});
