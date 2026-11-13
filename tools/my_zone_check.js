// Malaysia (Hassan 13 Nov 2026): does Al-Zij put each place in the right JAKIM zone?
// run 2 (13 Nov): after «a zone that names the place wins, special zones included»
// Independent witness: waktusolat.app (Malaysia Prayer Time project) — GPS → JAKIM zone. Al-Zij's own code (window.zijMY, cut out of
// index.html) runs here exactly as on a phone: real OpenStreetMap names in Malay, the state code, then its zone pick. Runs on GitHub.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const a = html.indexOf('window.zijMY = (function(){'), b = html.indexOf('// ===== Umm al-Qura times for years', a);
const code = html.slice(a, b);
const P = [ // town, lat, lon  (the same point is given to both, so its exact position doesn't matter)
 ['Kuala Lumpur',3.139,101.687],['Putrajaya',2.926,101.696],['Shah Alam',3.073,101.518],['Petaling Jaya',3.107,101.606],['Klang',3.044,101.445],
 ['Kuala Selangor',3.340,101.250],['Sabak Bernam',3.770,100.986],['Hulu Selangor (Kuala Kubu Bharu)',3.566,101.659],['Sepang',2.690,101.750],['Kajang',2.993,101.787],
 ['Seremban',2.726,101.938],['Port Dickson',2.522,101.796],['Kuala Pilah',2.739,102.249],['Tampin',2.470,102.230],['Melaka',2.189,102.250],
 ['Johor Bahru',1.492,103.741],['Kota Tinggi',1.738,103.899],['Mersing',2.431,103.836],['Kluang',2.030,103.318],['Pontian',1.487,103.390],
 ['Batu Pahat',1.854,102.933],['Muar',2.044,102.568],['Segamat',2.515,102.815],['Kuantan',3.808,103.326],['Pekan',3.492,103.390],
 ['Temerloh',3.448,102.418],['Raub',3.793,101.857],['Bentong',3.522,101.909],['Jerantut',3.936,102.362],['Kuala Lipis',4.184,102.042],
 ['Cameron Highlands (Tanah Rata)',4.471,101.377],['Ipoh',4.597,101.090],['Taiping',4.851,100.741],['Teluk Intan',4.026,101.020],['Sitiawan',4.217,100.699],
 ['Gerik',5.428,101.128],['Kuala Kangsar',4.772,100.937],['Tapah',4.198,101.262],['George Town',5.414,100.329],['Butterworth',5.399,100.364],
 ['Alor Setar',6.121,100.367],['Sungai Petani',5.647,100.488],['Kulim',5.365,100.562],['Langkawi (Kuah)',6.326,99.843],['Baling',5.676,100.917],
 ['Kangar',6.441,100.198],['Kota Bharu',6.125,102.238],['Gua Musang',4.884,101.969],['Kuala Krai',5.531,102.201],['Jeli',5.700,101.843],
 ['Kuala Terengganu',5.329,103.137],['Kemaman (Chukai)',4.233,103.420],['Dungun',4.758,103.410],['Besut (Jerteh)',5.737,102.489],
 ['Kuching',1.553,110.344],['Sri Aman',1.237,111.462],['Sibu',2.300,111.817],['Mukah',2.898,112.091],['Bintulu',3.171,113.042],
 ['Miri',4.399,113.991],['Limbang',4.750,115.000],['Lawas',4.857,115.408],['Kapit',2.017,112.933],['Sarikei',2.128,111.523],
 ['Kota Kinabalu',5.980,116.073],['Sandakan',5.840,118.117],['Tawau',4.245,117.891],['Lahad Datu',5.030,118.340],['Semporna',4.482,118.611],
 ['Keningau',5.337,116.160],['Kudat',6.883,116.833],['Beaufort',5.347,115.745],['Ranau',5.953,116.664],['Labuan',5.280,115.240],
];
const store = {};
// waktusolat's GPS → zone endpoint (path/field names tried in turn; the first point prints the raw answers for the record)
async function refZone(lat, lon, dbg) {
  const U = [`https://api.waktusolat.app/zones/${lat}/${lon}`, `https://api.waktusolat.app/zones/gps?lat=${lat}&long=${lon}`,
             `https://api.waktusolat.app/v2/zones/gps?lat=${lat}&long=${lon}`, `https://api.waktusolat.app/zones/gps?lat=${lat}&lng=${lon}`];
  for (const u of U) {
    try { const r = await realFetch(u); const t = await r.text(); if (dbg) console.log('RAW', r.status, u, t.slice(0, 300));
      if (!r.ok) continue; let j; try { j = JSON.parse(t); } catch (e) { continue; }
      const z = (j && (j.zone || j.jakimCode || j.code || (j.data && (j.data.zone || j.data.code)))) || (Array.isArray(j) && j[0] && (j[0].zone || j[0].jakimCode));
      if (z && /^[A-Z]{3}\d{2}$/.test(z)) return z; } catch (e) { if (dbg) console.log('RAW ERR', u, e.message); }
  }
  return '';
}
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.navigator = { onLine: true };
global.window = global;
const realFetch = global.fetch;
let lastNom = 0;
global.fetch = async (u, o) => {
  if (u.startsWith('data/')) { const t = fs.readFileSync(u, 'utf8'); return { ok: true, json: async () => JSON.parse(t) }; }
  if (u.includes('nominatim')) { const w = 1100 - (Date.now() - lastNom); if (w > 0) await new Promise(r => setTimeout(r, w)); lastNom = Date.now(); }
  return realFetch(u, { headers: { 'User-Agent': 'Al-Zij zone check (alzijapp.com)' } });
};
eval(code);
(async () => {
  let ok = 0, rows = [], err = 0;
  for (const [n, lat, lon] of P) {
    for (const k of Object.keys(store)) delete store[k];
    let ref = '';
    ref = await refZone(lat, lon, n === P[0][0]);
    // the region code comes from the phone's first place lookup; zijMY's own Malay lookup sets it too
    let got = '';
    for (let i = 0; i < 40 && !got; i++) { await window.zijMY.ensure(lat, lon); const z = window.zijMY.zone(); if (z) got = z.id; else await new Promise(r => setTimeout(r, 100)); }
    const place = (() => { try { return JSON.parse(store.zijMyPlace).n.join(', '); } catch (e) { return ''; } })();
    const same = got && got === ref; if (same) ok++; if (ref === 'ERR' || !ref) err++;
    rows.push(`${same ? 'OK  ' : 'DIFF'} | ${n} | waktusolat ${ref} | Al-Zij ${got} | ${store.zijRegion || ''} | ${place}`);
    console.log(rows[rows.length - 1]);
    // fresh module state for the next point
    eval(code);
  }
  const head = `JAKIM zone check — ${new Date().toISOString()}\nmatched ${ok}/${P.length} (waktusolat errors: ${err})\n\n`;
  fs.writeFileSync('data/my/zone-check.txt', head + rows.join('\n') + '\n');
  console.log(head);
})();
