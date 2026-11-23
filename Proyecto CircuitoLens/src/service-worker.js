/* ========================================================
   CircuitLens Service Worker (PWA Offline Engine)
   Garantiza funcionamiento 100% offline para laboratorios
   ======================================================== */

const CACHE_NAME = 'circuitlens-v6-cache';

const STATIC_ASSETS = [
  './circuitlens.html',
  './style.css',
  './script.js',
  './manifest.json',
  '../index.html',
  '../data/circuitos.json',
  '../data/cohorte.json',
  '../data/diagnosticos.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[CircuitLens SW] Pre-caching parcial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o externas de APIs remotas
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // No interceptar llamadas a APIs remotas de LLM
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
      if (cachedResponse) {
        // Retornar caché y actualizar en segundo plano (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Si falla y es una navegación HTML, devolver la vista principal
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./circuitlens.html');
          }
        });
    })
  );
});

