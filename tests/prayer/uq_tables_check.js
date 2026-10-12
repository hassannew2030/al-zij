const { chromium, devices } = require('playwright'); const fs = require('fs');
const Y = JSON.parse(fs.readFileSync('./data/uq/2027.json', 'utf8'));
const cities = JSON.parse(fs.readFileSync('./data/uq/cities.json', 'utf8'));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'ar-SA', timezoneId: 'Asia/Riyadh' });
  await ctx.addInitScript(() => { localStorage.setItem('zijWelcomed', '1'); localStorage.setItem('zijLocAuto', '0'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2000);
  const res = await p.evaluate(async ([cities, Y]) => {
    const hm = s => +s.slice(0, 2) * 60 + +s.slice(3); let ok = 0, tot = 0, miss = [], noTable = 0;
    for (const c of cities) { observer.set(c.latitude, c.longitude, 3, 'x');
      // load the city's table (the app does this on its own in the background)
      zijUQ.ensure(c.latitude, c.longitude); for (let t = 0; t < 100 && !zijUQ.ready(); t++) await new Promise(r => setTimeout(r, 30));
      const rows = Y.cities[String(c.id)];
      for (let i = 0; i < 365; i += 1) { const dt = new Date(Date.UTC(2027, 0, 1 + i, 9)); const t = observer.realPrayerTimes(dt, hijriCal.fromGregorian(dt));
        if (!t.official) noTable++; const u = rows[i].split(' ').map(hm); const z = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha];
        z.forEach((v, k) => { tot++; if (v === u[k]) ok++; else if (miss.length < 10) miss.push(c.name_ar + ' ' + i + ' ' + k + ' ' + u[k] + ' ' + v); }); } }
    return { ok, tot, noTable, miss };
  }, [cities, Y]);
  console.log(JSON.stringify(res), errs); await b.close();
})();
