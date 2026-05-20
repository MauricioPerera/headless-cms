const CACHE_NAME = 'headless-cms-v1';
const STATIC_ASSETS = [
  // __STATIC_ASSETS_PLACEHOLDER__
];

// Instalacion: cachea assets estaticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.warn('[SW] Fallo al precachear assets:', err);
    })
  );
  self.skipWaiting();
});

// Activacion: limpia caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first para HTML/CSS/JS, network-first para API/search
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear POST/PUT/PATCH/DELETE
  if (request.method !== 'GET') {
    return;
  }

  // Cache-first para assets estaticos
  if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.xml') ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      }).catch(() => {
        // Si todo falla y es una pagina, devolver index.html (SPA fallback)
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Network-first para todo lo demas (imagenes, etc.)
  event.respondWith(
    fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    }).catch(() => {
      return caches.match(request);
    })
  );
});
