// Runs the Al-Zij engine (Umm al-Qura method) for the days in the official 2027 file, same coordinates the official site sends.
// node uq_2027.js ../../index.html umm-al-qura-official-2027.json > zij-2027.json
const fs = require('fs'), path = require('path'), { chromium, devices } = require('playwright');
const [file, offFile] = [path.resolve(process.argv[2]), process.argv[3]];
const off = JSON.parse(fs.readFileSync(offFile)).cities;
const jobs = Object.entries(off).map(([n, c]) => [n, c.lat, c.lon, Object.keys(c.days)]);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'ar-SA', timezoneId: 'Asia/Riyadh' });
  await ctx.addInitScript(() => { localStorage.setItem('zijWelcomed', '1'); localStorage.setItem('zijLang', 'ar'); localStorage.setItem('zijLocAuto', '0'); localStorage.setItem('zijLocSrc', 'gps'); });
  const p = await ctx.newPage(); await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await p.goto('file://' + file); await p.waitForTimeout(1500);
  const out = await p.evaluate(jobs => { const res = {}, f = m => { m = Math.round(m); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    for (const [n, lat, lon, days] of jobs) { observer.set(lat, lon, 3, n); observer.calcMethod = 'UMM_AL_QURA'; res[n] = {};
      for (const ds of days) { const [y, mo, d] = ds.split('-').map(Number); const dt = new Date(Date.UTC(y, mo - 1, d, 9)); const h = hijriCal.fromGregorian(dt); const t = observer.realPrayerTimes(dt, h);
        res[n][ds] = { times: [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map(f).join(' '), hijri: h.year + '-' + String(h.month).padStart(2, '0') + '-' + String(h.day).padStart(2, '0')}; } }
    return res; }, jobs);
  console.log(JSON.stringify(out)); await b.close();
})();
