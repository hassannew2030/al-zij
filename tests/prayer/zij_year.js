const { chromium, devices } = require('playwright');
const [file, cities] = [process.argv[2], JSON.parse(process.argv[3])];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'ar-SA', timezoneId: 'Asia/Riyadh' });
  await ctx.addInitScript(() => { localStorage.setItem('zijWelcomed', '1'); localStorage.setItem('zijLang', 'ar'); localStorage.setItem('zijLocAuto', '0'); localStorage.setItem('zijLocSrc', 'gps'); });
  const p = await ctx.newPage(); await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await p.goto('file://' + file); await p.waitForTimeout(1500);
  const out = await p.evaluate(cities => { const res = {};
    for (const [n, lat, lon, tz] of cities) { observer.set(lat, lon, tz, n); const rows = [];
      for (let i = 0; i < 365; i++) { const dt = new Date(Date.UTC(2026, 0, 1 + i, 12 - tz)); const h = hijriCal.fromGregorian(dt); const t = observer.realPrayerTimes(dt, h);
        rows.push([dt.toISOString().slice(0, 10), t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha, h.month]); }
      res[n] = { rows, method: observer.calcMethod || (observer.method && observer.method.name) || '' }; }
    return res; }, cities);
  console.log(JSON.stringify(out)); await b.close();
})();
