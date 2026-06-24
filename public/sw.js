// AquaMap service worker — conservative offline shell.
// Cache-first for Next static assets; network-first for navigations with an
// offline fallback to the cached home shell. Cross-origin (Supabase, weather,
// World Bank, Semantic Scholar) is never intercepted.
const CACHE = 'aquamap-v1';
const SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // leave APIs alone

  // Cache-first for hashed static assets.
  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/favicon') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
      )
    );
    return;
  }

  // Network-first for navigations, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
  }
});
