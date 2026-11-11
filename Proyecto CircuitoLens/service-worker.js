/* ========================================================
   CircuitLens Root Service Worker (PWA Offline Engine)
   ======================================================== */

const CACHE_NAME = 'circuitlens-root-v3-cache';

const STATIC_ASSETS = [
  './index.html',
  './src/circuitlens.html',
  './src/style.css',
  './src/script.js',
  './src/manifest.json',
  './data/circuitos.json',
  './data/cohorte.json',
  './data/diagnosticos.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[CircuitLens SW Root] Pre-caching parcial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('api.anthropic.com') ||
    url.hostname.includes('api.openai.com') ||
    url.port === '11434'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const toCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./src/circuitlens.html');
        }
      });
    })
  );
});

