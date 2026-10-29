// الزيج — يشتغل من غير نت. النت هو الأصل: كل مرة بنجيب أحدث نسخة، ولو مفيش نت بنفتح آخر نسخة محفوظة.
// 29 Oct 2026 (table #69): ① weak signal — wait for the network at most 3 s, then open the saved copy at once and keep fetching
// the fresh one in the background (a hospital signal kept the screen blank for 20 s or more) ② one saved copy per file: the query
// (?t=…) is no longer part of the key, so update checks stop piling up copies of version.json ③ /beta/ and /beta/index.html
// (and / and /index.html) are the same saved page, so the test copy never silently opens as the main one.
// Inside the App Store app this file is not used at all (the app opens its own bundled copy).
const CACHE_NAME = 'al-zij-v8';
const NET_WAIT = 3000;
const FONTS = ['./fonts/Amiri-Regular.woff', './fonts/Amiri-Bold.woff', './fonts/EBGaramond.woff'];
const FILES_TO_CACHE = ['./index.html', './manifest.json', './version.json', './icons/apple-touch-icon.png', './icons/icon-192.png', ...FONTS];

// one key per file: no query, and a folder means its index.html
const keyOf = (u) => { const x = new URL(u, self.location.href); let p = x.pathname; if (p.endsWith('/')) p += 'index.html'; return x.origin + p; };
const isBeta = (u) => new URL(u, self.location.href).pathname.startsWith('/beta/');

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.all(FILES_TO_CACHE.map((f) =>
    fetch(f, { cache: 'no-cache' }).then((r) => (r && r.ok ? cache.put(keyOf(f), r) : null)).catch(() => {})))).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      // clear the pile-up left by the old keys (version.json?t=…, folder paths)
      .then(() => caches.open(CACHE_NAME)).then((c) => c.keys().then((ks) => Promise.all(ks
        .filter((r) => { const u = new URL(r.url); return u.search || u.pathname.endsWith('/'); })
        .map((r) => c.delete(r)))))
      .catch(() => {})
  );
  self.clients.claim();
});

const saved = (key) => caches.open(CACHE_NAME).then((c) => c.match(key));
// no network and nothing saved for this address: a page opens the right saved page; anything else simply fails (the page handles it)
const fallback = (req, key) => saved(key).then((hit) => {
  if (hit || req.mode !== 'navigate') return hit || Response.error();
  if (isBeta(req.url)) return saved(keyOf('./beta/index.html')).then((b) => b || new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#0a0c12;color:#e8d5a8;font:18px/1.8 serif;padding:24px;text-align:center" dir="rtl">' +
    'نسخة التجربة غير محفوظة على هذا الجوال بعد.<br>افتحها مرة واحدة والإنترنت متصل.<br><br><a style="color:#c9a35d" href="/">افتح الزيج</a></body>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
  return saved(keyOf('./index.html')).then((m) => m || Response.error());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // weather, fonts, maps: handled by the page itself
  if (url.searchParams.has('zclock')) return; // the inspector's phone-clock check: network only, never the saved copy (its old Date header looks like a wrong phone clock)
  const key = keyOf(req.url);
  // fonts never change: take the saved copy first (fast, works offline)
  if (url.pathname.includes('/fonts/')) {
    event.respondWith(saved(key).then((hit) => hit || fetch(req).then((res) => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then((x) => x.put(key, c)); } return res; })));
    return;
  }
  // network first → save a fresh copy → offline: the saved copy → weak signal: the saved copy after 3 s, and the fresh one is still saved for next time
  const net = fetch(req, { cache: 'no-cache' }).then((res) => {   // always ask GitHub if there is something newer
    if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(key, copy)); }
    return res;
  });
  event.waitUntil(net.then(() => {}, () => {}));
  event.respondWith(new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done) { done = true; resolve(r); } };
    const timer = setTimeout(() => saved(key).then((hit) => { if (hit) finish(hit); }), NET_WAIT);
    net.then((res) => { clearTimeout(timer); finish(res); },
             () => { clearTimeout(timer); fallback(req, key).then(finish); });
  }));
});
