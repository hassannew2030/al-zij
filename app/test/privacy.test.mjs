// The app's privacy guard (table #98): weather never leaves the phone, place names come from Apple's map service. Run: cd app && npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('../www-src/zij-privacy.js');

function fakeWindow(geocoder) {
  const sent = [];
  const win = {
    Response,
    fetch: (url) => { sent.push(String(url)); return Promise.resolve(new Response('{"ok":1}', { status: 200 })); },
  };
  globalThis.Capacitor = geocoder ? { registerPlugin: () => ({ reverse: geocoder }), Plugins: {} } : undefined;
  P.guard(win);
  return { win, sent };
}

test('weather and air quality never leave the phone', async () => {
  const { win, sent } = fakeWindow();
  for (const u of ['https://api.open-meteo.com/v1/forecast?latitude=21.4&longitude=39.2&current=temperature_2m',
                   'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=21.4&longitude=39.2&current=us_aqi'])
    await assert.rejects(win.fetch(u), TypeError);
  assert.deepEqual(sent, []);
});

test('OpenStreetMap is answered on the phone, from Apple, in its own shape', async () => {
  let asked = null;
  const { win, sent } = fakeWindow(async (o) => { asked = o; return { city: 'جدة', hood: 'الروضة', admin: 'منطقة مكة المكرمة', countryCode: 'SA', country: 'السعودية' }; });
  const r = await win.fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=21.5433&lon=39.1728&zoom=16&addressdetails=1&accept-language=ar');
  const j = await r.json();
  assert.deepEqual(asked, { lat: 21.5433, lon: 39.1728, lang: 'ar' });
  assert.equal(j.address.city, 'جدة');
  assert.equal(j.address.neighbourhood, 'الروضة');
  assert.equal(j.address.country_code, 'sa');
  assert.equal(j.address['ISO3166-2-lvl4'], undefined, 'only Malaysia needs the state code');
  assert.equal(j.zijSource, 'apple');
  assert.deepEqual(sent, [], 'nothing went to OpenStreetMap');
});

test('BigDataCloud is answered on the phone too; Malaysia keeps its state code for the JAKIM zones', async () => {
  const { win, sent } = fakeWindow(async () => ({ city: 'Shah Alam', hood: 'Seksyen 7', admin: 'Selangor', countryCode: 'MY', country: 'Malaysia' }));
  const j = await (await win.fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=3.07&longitude=101.5&localityLanguage=en')).json();
  assert.equal(j.city, 'Shah Alam');
  assert.equal(j.countryCode, 'MY');
  assert.equal(j.principalSubdivisionCode, 'MY-10');
  const n = await (await win.fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=3.07&lon=101.5&zoom=12&addressdetails=1&accept-language=ms')).json();
  assert.equal(n.address['ISO3166-2-lvl4'], 'MY-10');
  assert.deepEqual(sent, []);
});

test('no Apple answer (plugin missing or failing) = offline, never a fallback to the old services', async () => {
  const { win, sent } = fakeWindow(null);
  await assert.rejects(win.fetch('https://nominatim.openstreetmap.org/reverse?lat=1&lon=2'), TypeError);
  const f = fakeWindow(async () => { throw new Error('kCLErrorNetwork'); });
  await assert.rejects(f.win.fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=1&longitude=2'), TypeError);
  assert.deepEqual(sent.concat(f.sent), []);
});

test('only the app itself and alzijapp.com pass; everything else is refused (option أ, 25 Nov)', async () => {
  const { win, sent } = fakeWindow();
  win.location = { origin: 'capacitor://localhost' };
  const pass = ['data/uq/index.json', 'version.json?zclock=1', 'capacitor://localhost/sounds/adhan.m4a', 'https://alzijapp.com/version.json?t=1', 'https://alzijapp.com/'];
  for (const u of pass) await win.fetch(u);
  assert.deepEqual(sent, pass);
  const refused = ['https://api.aladhan.com/v1/timings/25-11-2026?latitude=21.54&longitude=39.17&method=4',
                   'https://api.aladhan.com/v1/qibla/21.54330/39.17280',
                   'https://api.open-meteo.com/v1/elevation?latitude=21.4&longitude=39.2',
                   'https://geocoding-api.open-meteo.com/v1/search?name=Jeddah&count=5&language=ar',
                   'https://ipwho.is/?lang=ar', 'https://ipapi.co/json/', 'https://get.geojs.io/v1/ip/geo.json',
                   'https://api.sunrise-sunset.org/json?lat=21.4&lng=39.2', '//example.com/x.js', 'https://alzijapp.com.evil.net/'];
  for (const u of refused) await assert.rejects(win.fetch(u), TypeError, u);
  assert.deepEqual(sent, pass, 'nothing refused reached the network');
  assert.ok(P.blocked.includes('api.aladhan.com') && P.blocked.includes('ipwho.is'));
});

test('a city by name comes from Apple (forward), never from a third party', async () => {
  globalThis.Capacitor = { registerPlugin: () => ({ forward: async (o) => ({ results: [{ name: 'تبوك', city: 'تبوك', lat: 28.38, lon: 36.57, countryCode: 'SA', tz: 'Asia/Riyadh', q: o.q }] }) }), Plugins: {} };
  const r = await P.forward('تبوك', 'ar');
  assert.equal(r[0].city, 'تبوك'); assert.equal(r[0].q, 'تبوك'); assert.equal(r[0].tz, 'Asia/Riyadh');
  globalThis.Capacitor = undefined;
  await assert.rejects(P.forward('x', 'ar'), TypeError);
});

test('the Malaysian states map to ISO 3166-2:MY', () => {
  const r = (admin) => P.myRegion({ countryCode: 'MY', admin });
  assert.equal(r('Johor'), 'MY-01'); assert.equal(r('Pulau Pinang'), 'MY-07'); assert.equal(r('Penang'), 'MY-07');
  assert.equal(r('Wilayah Persekutuan Kuala Lumpur'), 'MY-14'); assert.equal(r('Sarawak'), 'MY-13'); assert.equal(r('Putrajaya'), 'MY-16');
  assert.equal(P.myRegion({ countryCode: 'SA', admin: 'Selangor' }), '');
});
