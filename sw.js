const CACHE_NAME = 'al-zij-v1';
const FILES_TO_CACHE = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // الخط من جوجل فونتس هيفشل بدون نت وهيرجع للخط الافتراضي تلقائياً — ده طبيعي ومقبول
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
