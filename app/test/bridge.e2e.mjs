// End-to-end check of the native bridge inside the REAL bundled page (app/www), with a mock Capacitor in headless Chromium.
// Proves: no permission prompt at launch · the permission is asked from the alerts card · ≤ 64 notifications · their times are
// the screen's own times (official Umm al-Qura table in Jeddah; astronomical engine + summer time in Toronto) · the
// «add to home screen» banner/button are hidden · settings changes reschedule.
// Run: cd app && npm run bundle && npm run test:e2e        (needs Playwright + Chromium; set PLAYWRIGHT_PATH if not global)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(APP, 'www');
let chromium;
for (const p of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/npm-tools/node_modules/playwright', '/opt/node22/lib/node_modules/playwright']) {
  if (!p) continue; try { ({ chromium } = require(p)); break; } catch (e) {}
}
if (!chromium) { console.log('SKIP: Playwright not found'); process.exit(0); }
if (!fs.existsSync(path.join(WWW, 'index.html'))) { console.error('run npm run bundle first'); process.exit(1); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.wav': 'audio/wav' };
const server = http.createServer((q, s) => {
  const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(WWW, u === '/' ? 'index.html' : u);
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/';

// a stand-in for Capacitor on iOS: records what the bridge hands to the native side
const MOCK = () => {
  const rec = window.__nat = { asked: 0, scheduled: [], cancelled: 0, files: [], perm: 'prompt' };
  const LocalNotifications = {
    checkPermissions: async () => ({ display: rec.perm }),
    requestPermissions: async () => { rec.asked++; rec.perm = 'granted'; return { display: 'granted' }; },
    getPending: async () => ({ notifications: rec.scheduled.map(n => ({ id: n.id })) }),
    cancel: async o => { rec.cancelled += o.notifications.length; const ids = new Set(o.notifications.map(n => n.id)); rec.scheduled = rec.scheduled.filter(n => !ids.has(n.id)); },
    schedule: async o => { if (rec.scheduled.length + o.notifications.length > 64) throw new Error('more than 64 pending'); rec.scheduled.push(...o.notifications); return { notifications: o.notifications.map(n => ({ id: String(n.id) })) }; },
  };
  rec.writes = {}; rec.base = [];
  const Filesystem = { writeFile: async o => { rec.files.push(o.path); rec.writes[o.path] = typeof o.data === 'string' ? o.data.length : 0; if (o.path.endsWith('/index.html')) rec.page = o.data; return { uri: 'file:///lib/' + o.path }; },
    getUri: async o => ({ uri: 'file:///Library/NoCloud/' + o.path }), rmdir: async () => {} };
  const WebView = { setServerBasePath: async o => { rec.base.push(o.path); }, setServerAssetPath: async o => { rec.base.push('asset:' + o.path); } };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: { LocalNotifications, Filesystem, WebView, App: { addListener: () => {} } } };
};

const b = await chromium.launch();
let fails = 0;
const check = (ok, msg) => { console.log((ok ? '✅ ' : '❌ ') + msg); if (!ok) fails++; };

async function open({ zone, loc, method, lang }) {
  const ctx = await b.newContext({ timezoneId: zone, locale: lang === 'en' ? 'en-US' : 'ar-SA', viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(MOCK);
  await ctx.addInitScript(([loc, method, lang]) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('zijWelcomed', '1'); localStorage.setItem('zijLang', lang); localStorage.setItem('zijLocAuto', '0');
    localStorage.setItem('zijLastLocation', JSON.stringify(loc)); localStorage.setItem('zijLocationLocked', 'true'); localStorage.setItem('zijLockByUser', '1');
    if (method) localStorage.setItem('zijCalcMethod', method);
  }, [loc, method, lang]);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  // the real Capacitor scripts would look for the iOS bridge; the mock stands in for them
  await p.route(/\/native\/(capacitor|app|local-notifications|filesystem)\.js$/, r => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(3500);
  return { ctx, p, errs };
}

/* ---- 1 · Jeddah: official table ---- */
{
  const { ctx, p, errs } = await open({ zone: 'Asia/Riyadh', loc: { lat: 21.5433, lon: 39.1728 }, lang: 'ar' });
  let r = await p.evaluate(() => ({ asked: __nat.asked, n: __nat.scheduled.length, perm: zijNative.perm(), bar: !!document.querySelector('#zInsBar'),
    mInstall: (() => { const m = document.getElementById('mInstall'); return m ? getComputedStyle(m).display : 'none'; })(), hide: localStorage.getItem('zijInstallHide') }));
  check(r.asked === 0 && r.n === 0, 'no permission prompt and nothing scheduled at launch (zero-interaction rule)');
  check(!r.bar && r.mInstall === 'none' && r.hide === '1', '«add to home screen» banner and button hidden in the app (#48)');
  // the alerts card shows the native permission button; tapping it asks once and schedules
  await p.evaluate(() => { document.querySelector('[data-scr="prayer"], #tabPrayer')?.click?.(); });
  const hasBtn = await p.evaluate(() => !!document.querySelector('#zNat [data-nat="ask"]'));
  check(hasBtn, 'alerts card offers «اسمح بتنبيه الأذان»');
  await p.evaluate(() => document.querySelector('#zNat [data-nat="ask"]').click());
  await p.waitForTimeout(2500);
  r = await p.evaluate(() => {
    const L = __nat.scheduled, pad = n => String(n).padStart(2, '0');
    const clock = ms => { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
    // compare every adhan notification with what the screen computes for that date
    let same = 0, diff = [], official = 0;
    for (const n of L.filter(n => n.extra.kind === 'adhan')) {
      const D = new Date(n.schedule.at); const day = new Date(D.getFullYear(), D.getMonth(), D.getDate(), 12);
      const t = observer.realPrayerTimes(day, hijriCal.fromGregorian(day)); if (t.official) official++;
      const want = AstroMath.minToHHMM(t[n.extra.prayer]).slice(0, 5), h = D.getHours() % 12 || 12;
      const got = pad(h) + ':' + pad(D.getMinutes());
      if (want === got) same++; else diff.push(n.extra.date + ' ' + n.extra.prayer + ' ' + want + '≠' + got);
    }
    return { n: L.length, asked: __nat.asked, adhans: L.filter(n => n.extra.kind === 'adhan').length, same, diff: diff.slice(0, 5), official,
      first: L[0] && { body: L[0].body, title: L[0].title, at: clock(L[0].schedule.at), sound: L[0].sound, silent: L[0].silent },
      reminder: L.find(n => n.extra.kind === 'reminder')?.body, status: document.getElementById('zNat')?.textContent, files: __nat.files };
  });
  check(r.asked === 1, 'permission asked exactly once, from the alerts card');
  check(r.n > 0 && r.n <= 64, `scheduled ${r.n} notifications (≤ 64)`);
  check(r.same === r.adhans && r.adhans > 0, `${r.same}/${r.adhans} adhan times identical to the screen` + (r.diff.length ? ' — ' + r.diff.join(', ') : ''));
  check(r.official === r.adhans, `all ${r.official} from the official Umm al-Qura table`);
  check(/^🕌 حان الآن موعد أذان /.test(r.first.body) && r.first.title === 'الزّيج' && r.first.sound === 'zij-brass.wav' && r.first.silent === true, 'first alert: ' + r.first.body + ' at ' + r.first.at);
  check(/افتح الزّيج/.test(r.reminder || ''), 'reminder to open Al-Zij is scheduled');
  check(/✅/.test(r.status || ''), 'status line: ' + (r.status || '').trim());
  check(r.files.filter(f => /^Sounds\/zij-\w+\.wav$/.test(f)).length === 3, 'alert sounds copied to Library/Sounds');
  // change a setting the way the user does (the card's own switch) → reschedules with the iqamah alerts
  await p.evaluate(() => { const c = document.querySelector('#zAl input[data-k="maghrib.iqama.on"]'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(6000);
  r = await p.evaluate(() => ({ n: __nat.scheduled.length, iq: __nat.scheduled.filter(n => n.extra.kind === 'iqama' && n.extra.prayer === 'maghrib').length, bodies: __nat.scheduled.filter(n => n.extra.kind === 'iqama').slice(0, 1).map(n => n.body) }));
  check(r.iq > 0 && r.n <= 64, `after turning on Maghrib iqamah: ${r.iq} iqamah alerts, ${r.n} total — «${r.bodies[0]}»`);
  check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}

/* ---- 2 · Toronto across the end of summer time (1 Nov 2026), English ---- */
{
  const { ctx, p, errs } = await open({ zone: 'America/Toronto', loc: { lat: 43.6532, lon: -79.3832 }, method: 'ISNA', lang: 'en' });
  await p.evaluate(() => { __nat.perm = 'granted'; return zijNative.resync('test'); });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const L = __nat.scheduled.filter(n => n.extra.kind === 'adhan'), pad = n => String(n).padStart(2, '0');
    let same = 0, diff = [], offs = new Set();
    for (const n of L) {
      const D = new Date(n.schedule.at); const day = new Date(D.getFullYear(), D.getMonth(), D.getDate(), 12);
      offs.add(day.getTimezoneOffset());
      const t = observer.realPrayerTimes(day, hijriCal.fromGregorian(day));
      const want = AstroMath.minToHHMM(t[n.extra.prayer]).slice(0, 5), got = pad(D.getHours() % 12 || 12) + ':' + pad(D.getMinutes());
      if (want === got) same++; else diff.push(n.extra.date + ' ' + n.extra.prayer + ' ' + want + '≠' + got);
    }
    const dates = [...new Set(L.map(n => n.extra.date))];
    return { n: __nat.scheduled.length, adhans: L.length, same, diff: diff.slice(0, 5), offs: [...offs], dates: [dates[0], dates[dates.length - 1]], body: L[0] && L[0].body, method: observer.activeMethod() };
  });
  check(r.method === 'ISNA', 'Toronto uses ISNA');
  check(r.offs.length === 2, `window crosses the clock change (UTC offsets seen: ${r.offs.map(o => -o / 60).join(', ')}) ${r.dates.join(' → ')}`);
  check(r.same === r.adhans && r.adhans > 0, `${r.same}/${r.adhans} adhan times identical to the screen across the change` + (r.diff.length ? ' — ' + r.diff.join(', ') : ''));
  check(r.n <= 64, `${r.n} notifications (≤ 64)`);
  check(/^🕌 It is now time for the \w+/.test(r.body || ''), 'English wording: ' + r.body);
  check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}

/* ---- 3 · silent web update: a newer build on the site → snapshot saved → next launch switches to it ---- */
{
  const ROOT = path.resolve(APP, '..');
  const site = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const cur = /window\.ZIJ_BUILD="(\d+)"/.exec(site)[1], next = String(+cur + 1);
  const newer = site.replace('window.ZIJ_BUILD="' + cur + '"', 'window.ZIJ_BUILD="' + next + '"');
  const { ctx, p, errs } = await open({ zone: 'Asia/Riyadh', loc: { lat: 21.5433, lon: 39.1728 }, lang: 'ar' });
  const cors = { 'access-control-allow-origin': '*' };
  await p.route('https://alzijapp.com/version.json*', r => r.fulfill({ body: JSON.stringify({ build: next }), contentType: 'application/json', headers: cors }));
  await p.route('https://alzijapp.com/index.html*', r => r.fulfill({ body: newer, contentType: 'text/html', headers: cors }));
  await p.waitForTimeout(15000);
  let r = await p.evaluate(() => ({ snap: JSON.parse(localStorage.getItem('zijLiveSnap') || 'null'), files: __nat.files.filter(f => f.startsWith('zij-web/')), page: __nat.page || '' }));
  check(r.snap && r.snap.build === next && /zij-web\/\d+$/.test(r.snap.path), 'newer build downloaded and saved as a snapshot: ' + (r.snap && r.snap.path));
  check(r.files.includes('zij-web/' + next + '/index.html') && r.files.includes('zij-web/' + next + '/data/uq/c/74.json') && r.files.includes('zij-web/' + next + '/native/zij-native.js'), `snapshot is complete (${r.files.length} files: page + fonts, data, sounds, native scripts)`);
  check(r.page.includes('<!-- zij-native -->') && r.page.includes('"snapshot":"' + next + '"'), 'downloaded page got the native bridge');
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.route(/\/native\/(capacitor|app|local-notifications|filesystem)\.js$/, x => x.fulfill({ body: '', contentType: 'text/javascript' }));
  await p2.route(/^https?:\/\/(?!127\.0\.0\.1)/, x => x.abort());
  await p2.goto(BASE + 'index.html'); await p2.waitForTimeout(1500);
  r = await p2.evaluate(() => __nat.base);
  check(r.length === 1 && /zij-web\/\d+$/.test(r[0]), 'next launch switches the web view to the snapshot: ' + r[0]);
  check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}

/* ---- 4 · outside the app (plain browser): the bridge does nothing ---- */
{
  const ctx = await b.newContext({ timezoneId: 'Asia/Riyadh' }); const p = await ctx.newPage();
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p.route(/\/native\/(capacitor|app|local-notifications|filesystem)\.js$/, r => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await p.addInitScript(() => localStorage.setItem('zijWelcomed', '1'));
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(2000);
  const r = await p.evaluate(() => ({ nat: window.ZIJ_NATIVE, api: typeof window.zijNative, css: !!document.getElementById('zijNativeCss') }));
  check(r.nat === false && r.api === 'undefined' && !r.css, 'in a normal browser the bridge stays off');
  await ctx.close();
}

await b.close(); server.close();
console.log(fails ? `FAIL ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
