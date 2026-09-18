const CACHE_NAME = 'acordesapp-v5';
const NETWORK_FIRST = ['/index.html', '/app.js', '/data.js'];
const FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/data.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const isNetFirst = e.request.mode === 'navigate' ||
    NETWORK_FIRST.some(s => e.request.url.includes(s));

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached && !isNetFirst) return cached;

      return fetch(e.request)
        .then(net => {
          const clone = net.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return net;
        })
        .catch(() => cached || caches.match('/index.html'));
    })
  );
});