// الزيج — يشتغل من غير نت. النت هو الأصل: كل مرة بنجيب أحدث نسخة، ولو مفيش نت بنفتح آخر نسخة محفوظة.
const CACHE_NAME = 'al-zij-v3';
const FILES_TO_CACHE = ['./', './index.html', './al-zij-v2.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // weather, fonts, maps: handled by the page itself
  // network first → save a fresh copy → if offline, use the saved copy
  event.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => {   // always ask GitHub if there is something newer
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./al-zij-v2.html')))
  );
});
