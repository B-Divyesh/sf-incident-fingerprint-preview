const CACHE = 'fingerprint-preview-v6';
const SHELL = ['/', '/demo/', '/privacy/', '/terms/', '/404.html', '/instrument-bench.webp', '/cli-demo.cast'];

async function cacheShell() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const landing = await cache.match('/');
  const html = await landing.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((match) => match[1]);
  await cache.addAll([...new Set(assets)]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (/^\/(assets\/|instrument-bench\.webp$|social-preview\.webp$|apple-touch-icon\.png$|favicon\.svg$|cli-demo\.cast$)/.test(url.pathname)) {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(url.pathname)).then((cached) => cached || fetch(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request)
      || (event.request.mode === 'navigate' ? await caches.match('/') : null);
    if (cached && event.request.mode === 'navigate') {
      const headers = new Headers(cached.headers);
      const html = (await cached.text()).replace('<body', '<body data-offline-fallback="true"');
      return new Response(html, { status: cached.status, statusText: cached.statusText, headers });
    }
    return cached || Response.error();
  }));
});
