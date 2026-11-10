// Unit tests for the alert planner (app/www-src/zij-schedule.js). Run: cd app && npm test   (Node ≥ 18, no install needed)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const Z = require('../www-src/zij-schedule.js');
const MIN = 60000;
const PR = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// the web app's defaults (index.html #alertsJs defaults()), then variations
function settings(fn) {
  const IQ = { fajr: 25, dhuhr: 20, asr: 20, maghrib: 10, isha: 20 };
  const s = { on: true, v: 1, p: {} };
  for (const k of PR) s.p[k] = { pre: { on: false, min: 10, snd: 'soft' }, adhan: { on: true, snd: 'brass' }, iqama: { on: false, min: IQ[k], snd: 'bell' } };
  if (fn) fn(s);
  return s;
}
const allOn = s => { for (const k of PR) { s.p[k].pre.on = true; s.p[k].iqama.on = true; } };

// the official Umm al-Qura table exactly as the app reads it (zijUQ.lookup): data/uq/c/<id>.json
function uqDays(id, y, m, d, n) {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/uq/c', id + '.json'), 'utf8'));
  const out = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const Y = dt.getUTCFullYear(), s = j.y[Y];
    const o = Math.round((Date.UTC(Y, dt.getUTCMonth(), dt.getUTCDate()) - Date.UTC(Y, 0, 1)) / 864e5) * 18;
    const a = []; for (let k = 0; k < 6; k++) a.push(parseInt(s.substr(o + k * 3, 3), 16));
    out.push({ y: Y, m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), off: 180, times: { fajr: a[0], dhuhr: a[2], asr: a[3], maghrib: a[4], isha: a[5] } });
  }
  return out;
}
const hhmm = (ms, offMin) => { const d = new Date(ms + offMin * MIN); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const year2026 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/uq/2026.json'), 'utf8'));

test('Jeddah (official table): adhan alerts land on the official minute, Saudi time', () => {
  const days = uqDays(74, 2026, 10, 25, 14);
  // the table file agrees with the year file for that day (same source the screen uses)
  const doy = Math.round((Date.UTC(2026, 9, 25) - Date.UTC(2026, 0, 1)) / 864e5);
  const row = year2026.cities['74'][doy].split(' ');
  const now = Date.UTC(2026, 9, 24, 21, 0);            // 25 Oct 00:00 in Jeddah
  const r = Z.plan({ days, settings: settings(), now, lang: 'ar' });
  const first5 = r.notifications.filter(n => n.kind === 'adhan').slice(0, 5);
  assert.deepEqual(first5.map(n => n.prayer), PR);
  assert.deepEqual(first5.map(n => hhmm(n.at, 180)), [row[0], row[2], row[3], row[4], row[5]]);
  assert.equal(first5[0].body, '🕌 حان الآن موعد أذان الفجر');
  assert.equal(first5[0].title, 'الزّيج');
  assert.equal(first5[0].sound, 'zij-brass.wav');
});

test('a full Saudi day with all three alerts: before, adhan, iqamah at the right offsets', () => {
  const days = uqDays(74, 2026, 10, 25, 14);
  const s = settings(s => { allOn(s); s.p.fajr.pre.min = 30; s.p.maghrib.iqama.min = 5; s.p.isha.pre.snd = 'silent'; });
  const now = Date.UTC(2026, 9, 24, 21, 0);
  const r = Z.plan({ days, settings: s, now, lang: 'ar' });
  const today = r.notifications.filter(n => n.date === '2026-10-25');
  assert.equal(today.length, 15);
  for (const k of PR) {
    const [pre, adhan, iq] = ['pre', 'adhan', 'iqama'].map(x => today.find(n => n.prayer === k && n.kind === x));
    assert.equal((adhan.at - pre.at) / MIN, s.p[k].pre.min, k + ' pre');
    assert.equal((iq.at - adhan.at) / MIN, s.p[k].iqama.min, k + ' iqama');
  }
  const isha = today.find(n => n.prayer === 'isha' && n.kind === 'pre');
  assert.equal(isha.sound, undefined, 'silent = message only, no sound file');
  assert.equal(today.find(n => n.prayer === 'fajr' && n.kind === 'pre').body, 'بعد ٣٠ دقيقة أذان الفجر');
  assert.equal(today.find(n => n.prayer === 'maghrib' && n.kind === 'iqama').body, '🕌 حان الآن وقت إقامة صلاة المغرب');
});

test('never more than 64 pending: 63 alerts + 1 reminder, sorted, unique ids', () => {
  const days = uqDays(74, 2026, 10, 25, 14);
  const now = Date.UTC(2026, 9, 25, 9, 0);              // 12:00 Jeddah — Fajr and Dhuhr already passed today
  const r = Z.plan({ days, settings: settings(allOn), now, lang: 'ar' });
  assert.equal(r.notifications.length, 64);
  assert.equal(r.alerts, 63);
  assert.ok(r.dropped > 0);
  const ids = new Set(r.notifications.map(n => n.id));
  assert.equal(ids.size, 64);
  for (let i = 1; i < r.notifications.length; i++) assert.ok(r.notifications[i].at >= r.notifications[i - 1].at, 'sorted');
  assert.ok(r.notifications.every(n => n.at > now), 'all in the future');
  // the very next alert is always kept (Dhuhr iqamah 20 min after Dhuhr adhan … or Asr pre)
  const alerts = r.notifications.filter(n => n.kind !== 'reminder');
  assert.equal(alerts[0].date, '2026-10-25');
  const rem = r.notifications.find(n => n.kind === 'reminder');
  assert.equal(rem.id, Z.REMINDER_ID);
  assert.ok(rem.at < r.lastAt && rem.at > now);
  assert.match(rem.body, /افتح الزّيج/);
});

/* ---- the adhan first (table #71, Hassan's design of 31 Oct) ---- */
test('all three alerts on: every adhan of the next 8 days is kept, the other slots go to the nearest before/iqamah alerts', () => {
  const days = uqDays(74, 2026, 10, 25, 16);
  const now = Date.UTC(2026, 9, 24, 21, 0);             // 25 Oct 00:00 Jeddah
  const r = Z.plan({ days, settings: settings(allOn), now, lang: 'ar' });
  assert.equal(r.notifications.length, 64);
  const adhan = r.notifications.filter(n => n.kind === 'adhan');
  const extra = r.notifications.filter(n => n.kind === 'pre' || n.kind === 'iqama');
  // 8 full days × 5 = 40 adhans, none missing, in order
  assert.equal(adhan.length, 40);
  const dates = [...new Set(adhan.map(n => n.date))];
  assert.equal(dates.length, 8);
  assert.equal(dates[0], '2026-10-25'); assert.equal(dates[7], '2026-11-01');
  for (const d of dates) assert.deepEqual(adhan.filter(n => n.date === d).map(n => n.prayer), PR, d);
  // the 23 other alerts are the 23 nearest ones: a continuous run from now, nothing skipped in between
  assert.equal(extra.length, 23);
  // reference: the same before/iqamah alerts alone (adhan off), nearest first, no guarantee, no reminder
  const ref = Z.plan({ days, settings: settings(s => { allOn(s); for (const k of PR) s.p[k].adhan.on = false; }), now, guaranteeDays: 0, reminder: false })
    .notifications;
  assert.deepEqual(extra.map(n => n.kind + n.prayer + n.at), ref.slice(0, 23).map(n => n.kind + n.prayer + n.at));
  // the adhan is guaranteed up to the last adhan of day 8; the others for ≈ 2 days
  assert.equal(r.mainUntil, adhan[adhan.length - 1].at);
  const xDays = (r.extraUntil - now) / 864e5;
  assert.ok(xDays > 2 && xDays < 3, 'extras cover ' + xDays.toFixed(2) + ' days');
  // the reminder sits about a day before the end of the ADHAN window, not before the end of the extras
  const rem = r.notifications.find(n => n.kind === 'reminder');
  assert.ok(r.mainUntil - rem.at >= 12 * 3600e3 && r.mainUntil - rem.at <= 36 * 3600e3);
});

test('adhan only (the default): every slot is an adhan, ≈ 12½ days, and the guarantee changes nothing', () => {
  const days = uqDays(74, 2026, 10, 25, 16);
  const now = Date.UTC(2026, 9, 24, 21, 0);
  const r = Z.plan({ days, settings: settings(), now });
  assert.equal(r.alerts, 63);
  assert.ok(r.notifications.filter(n => n.kind !== 'reminder').every(n => n.kind === 'adhan'));
  assert.equal(r.extraUntil, null);
  assert.equal(r.mainUntil, r.lastAt);
});

test('a prayer with the adhan off: its before-adhan alert becomes its main alert and is guaranteed too', () => {
  const days = uqDays(74, 2026, 10, 25, 16);
  const now = Date.UTC(2026, 9, 24, 21, 0);
  const s = settings(s => { allOn(s); s.p.fajr.adhan.on = false; });   // Fajr: before-adhan + iqamah only
  const r = Z.plan({ days, settings: s, now });
  const fajrPre = r.notifications.filter(n => n.prayer === 'fajr' && n.kind === 'pre');
  assert.ok(fajrPre.length >= 8, 'Fajr before-adhan kept every day for 8 days: ' + fajrPre.length);
  assert.equal(r.notifications.filter(n => n.kind === 'adhan').length, 32);   // the other 4 prayers × 8 days
});

test('few extra alerts: they are all kept and the adhan runs beyond 8 days to fill the slots', () => {
  const days = uqDays(74, 2026, 10, 25, 16);
  const now = Date.UTC(2026, 9, 24, 21, 0);
  const s = settings(s => { s.p.maghrib.iqama.on = true; });            // adhan for all + Maghrib iqamah
  const r = Z.plan({ days, settings: s, now });
  assert.equal(r.alerts, 63);
  const iq = r.notifications.filter(n => n.kind === 'iqama');
  const ad = r.notifications.filter(n => n.kind === 'adhan');
  assert.equal(iq.length + ad.length, 63);
  assert.ok(ad.length > 40, 'adhan beyond the 8 days: ' + ad.length);
  assert.ok((r.mainUntil - now) / 864e5 > 10, 'adhan covers ' + ((r.mainUntil - now) / 864e5).toFixed(1) + ' days');
});

test('adhan only (the default): 63 alerts cover about 12 days', () => {
  const days = uqDays(74, 2026, 10, 25, 14);
  const now = Date.UTC(2026, 9, 24, 21, 0);
  const r = Z.plan({ days, settings: settings(), now });
  assert.equal(r.alerts, 63);
  const span = (r.lastAt - r.firstAt) / 864e5;
  assert.ok(span > 12 && span < 13, 'span ' + span);
  // reminder ≈ a day before the last alert, and not at night (09:00–21:00 Jeddah)
  const rem = r.notifications.find(n => n.kind === 'reminder');
  const h = new Date(rem.at + 180 * MIN).getUTCHours();
  assert.ok(h >= 9 && h < 21, 'reminder hour ' + h);
  assert.ok(r.lastAt - rem.at <= 36 * 3600e3 && r.lastAt - rem.at >= 12 * 3600e3);
});

test('alerts switched off → nothing scheduled, no reminder', () => {
  const days = uqDays(74, 2026, 10, 25, 3);
  const r = Z.plan({ days, settings: settings(s => { s.on = false; }), now: Date.UTC(2026, 9, 24, 21) });
  assert.equal(r.notifications.length, 0);
  const r2 = Z.plan({ days, settings: settings(s => { for (const k of PR) s.p[k].adhan.on = false; }), now: Date.UTC(2026, 9, 24, 21) });
  assert.equal(r2.notifications.length, 0);
});

test('an alert less than 15 s away or already past is not handed to iOS', () => {
  const days = uqDays(74, 2026, 10, 25, 2);
  const fajr = Z.localToEpoch(2026, 10, 25, days[0].times.fajr, 180);
  const r = Z.plan({ days, settings: settings(), now: fajr - 10000 });
  assert.notEqual(r.notifications[0].prayer + r.notifications[0].date, 'fajr2026-10-25');
  const r2 = Z.plan({ days, settings: settings(), now: fajr - 60000 });
  assert.equal(r2.notifications[0].prayer + r2.notifications[0].date, 'fajr2026-10-25');
});

test('English wording and Friday → Jumu\'ah, matching the web app', () => {
  const days = uqDays(74, 2026, 10, 30, 1);            // Friday 30 Oct 2026
  const s = settings(s => { s.p.dhuhr.pre.on = true; s.p.dhuhr.pre.min = 60; s.p.dhuhr.iqama.on = true;
    s.p.dhuhr.friIqama = { on: true, min: 30, snd: 'bell' }; });      // the user chose the Friday iqamah (praying away from the mosque)
  const r = Z.plan({ days, settings: s, now: Date.UTC(2026, 9, 29, 21), lang: 'en' });
  const d = r.notifications.filter(n => n.prayer === 'dhuhr');
  assert.deepEqual(d.map(n => n.body), ['Jumu\'ah adhan in 1 hour', '🕌 It is now time for the Jumu\'ah adhan', '🕌 It is now time for the iqamah']);
  assert.equal(d[0].title, 'Al-Zij');
  const ar = Z.plan({ days, settings: s, now: Date.UTC(2026, 9, 29, 21), lang: 'ar' }).notifications.filter(n => n.prayer === 'dhuhr');
  assert.deepEqual(ar.map(n => n.body), ['بعد ساعة أذان الجمعة', '🕌 حان الآن موعد أذان الجمعة', '🕌 حان الآن وقت إقامة الصلاة']);
});

/* ---- Friday iqamah (Hassan, 10 Nov): off unless chosen, its own minutes ---- */
test('Friday: Dhuhr iqamah is OFF by default even when the weekday Dhuhr iqamah is on', () => {
  const days = uqDays(74, 2026, 10, 29, 3);            // Thu 29, Fri 30, Sat 31 Oct 2026
  const s = settings(s => { s.p.dhuhr.iqama.on = true; s.p.dhuhr.iqama.min = 20; });
  const r = Z.plan({ days, settings: s, now: Date.UTC(2026, 9, 28, 21) });
  const iq = r.notifications.filter(n => n.prayer === 'dhuhr' && n.kind === 'iqama').map(n => n.date);
  assert.deepEqual(iq, ['2026-10-29', '2026-10-31']);
  // the Friday adhan itself is untouched (the official minute, named Jumu'ah)
  assert.ok(r.notifications.some(n => n.date === '2026-10-30' && n.prayer === 'dhuhr' && n.kind === 'adhan'));
});

test('Friday: when the user turns the Friday iqamah on, it uses its own minutes and neutral wording', () => {
  const days = uqDays(74, 2026, 10, 30, 1);
  const s = settings(s => { s.p.dhuhr.iqama.on = true; s.p.dhuhr.iqama.min = 20; s.p.dhuhr.friIqama = { on: true, min: 35, snd: 'bell' }; });
  const r = Z.plan({ days, settings: s, now: Date.UTC(2026, 9, 29, 21) });
  const ad = r.notifications.find(n => n.prayer === 'dhuhr' && n.kind === 'adhan');
  const iq = r.notifications.find(n => n.prayer === 'dhuhr' && n.kind === 'iqama');
  assert.equal((iq.at - ad.at) / MIN, 35);
  assert.equal(iq.body, '🕌 حان الآن وقت إقامة الصلاة');
  assert.equal(iq.sound, 'zij-bell.wav');
});

/* ---- Fable review, 10 Nov ---- */
test('two alerts at the same minute (iqamah of one prayer = before-adhan of the next) are both kept, before-adhan first', () => {
  const days = [{ y: 2026, m: 11, d: 11, off: 180, times: { fajr: 300, dhuhr: 720, asr: 900, maghrib: 960, isha: 1050 } }];
  const s = settings(s => { s.p.asr.iqama.on = true; s.p.asr.iqama.min = 30; s.p.maghrib.pre.on = true; s.p.maghrib.pre.min = 30; });
  const r = Z.plan({ days, settings: s, now: Date.UTC(2026, 10, 11, 0) });   // 03:00 Jeddah
  const same = r.notifications.filter(n => hhmm(n.at, 180) === '15:30');
  assert.deepEqual(same.map(n => n.prayer + ':' + n.kind), ['maghrib:pre', 'asr:iqama']);
  assert.equal(new Set(same.map(n => n.id)).size, 2);
});

test('yesterday\'s Isha iqamah after midnight is still scheduled when the plan is made at 00:05', () => {
  // high-latitude summer: Isha 23:50, iqamah 20 min later = 00:10 the next day
  const days = [{ y: 2026, m: 6, d: 20, off: 120, times: { fajr: 150, dhuhr: 790, asr: 1060, maghrib: 1350, isha: 1430 } },
                { y: 2026, m: 6, d: 21, off: 120, times: { fajr: 150, dhuhr: 790, asr: 1060, maghrib: 1350, isha: 1430 } }];
  const s = settings(s => { s.p.isha.iqama.on = true; s.p.isha.iqama.min = 20; });
  const now = Z.localToEpoch(2026, 6, 21, 5, 120);       // 21 June 00:05 local
  const r = Z.plan({ days, settings: s, now });
  const first = r.notifications[0];
  assert.equal(first.prayer + ':' + first.kind + ':' + first.date, 'isha:iqama:2026-06-20');
  assert.equal(hhmm(first.at, 120), '00:10');
});

test('the reminder never rings within 2 minutes of an alert (a day before the last adhan = the same prayer the day before)', () => {
  const now = Date.UTC(2026, 9, 24, 21, 0);
  for (const [name, fn] of [['adhan only', null], ['all three', allOn], ['adhan + before', s => { for (const k of PR) s.p[k].pre.on = true; }]]) {
    const r = Z.plan({ days: uqDays(74, 2026, 10, 25, 16), settings: settings(fn), now });
    const rem = r.notifications.find(n => n.kind === 'reminder');
    const clash = r.notifications.filter(n => n.kind !== 'reminder' && Math.abs(n.at - rem.at) < 2 * MIN);
    assert.equal(clash.length, 0, name + ': reminder at ' + hhmm(rem.at, 180) + ' clashes with ' + clash.map(n => n.prayer + ' ' + n.kind).join(', '));
    assert.ok(rem.at > now && rem.at < r.mainUntil, name);
  }
});

test('the adhan is guaranteed 8 days in every combination that keeps the adhan on', () => {
  const now = Date.UTC(2026, 9, 24, 21, 0);
  const combos = {
    'adhan only': null,
    'adhan + before': s => { for (const k of PR) s.p[k].pre.on = true; },
    'adhan + iqamah': s => { for (const k of PR) s.p[k].iqama.on = true; },
    'all three': allOn,
  };
  for (const [name, fn] of Object.entries(combos)) {
    const r = Z.plan({ days: uqDays(74, 2026, 10, 25, 16), settings: settings(fn), now });
    const days = (r.mainUntil - now) / 864e5;
    assert.ok(days >= 7.75, name + ': adhan ' + days.toFixed(2) + ' days');
    if (fn) assert.ok(r.extraUntil > now, name + ': others reach ' + ((r.extraUntil - now) / 864e5).toFixed(2) + ' days');
  }
});

test('fewer days than the guarantee (the engine gave only 5): no crash, every adhan of those days kept, slots filled', () => {
  const now = Date.UTC(2026, 9, 24, 21, 0);
  const r = Z.plan({ days: uqDays(74, 2026, 10, 25, 5), settings: settings(allOn), now });
  assert.equal(r.notifications.filter(n => n.kind === 'adhan').length, 25);
  assert.equal(r.alerts, 63);
  assert.equal(r.mainUntil, Math.max(...r.notifications.filter(n => n.kind === 'adhan').map(n => n.at)));
});

test('Arabic with Latin digits (zijDigits = en)', () => {
  const days = uqDays(74, 2026, 10, 25, 1);
  const s = settings(s => { s.p.asr.pre.on = true; s.p.asr.pre.min = 15; });
  const r = Z.plan({ days, settings: s, now: Date.UTC(2026, 9, 24, 21), lang: 'ar', digits: 'en' });
  assert.equal(r.notifications.find(n => n.prayer === 'asr' && n.kind === 'pre').body, 'بعد 15 دقيقة أذان العصر');
});

test('fractional minutes from the astronomical engine round like the screen (minToHHMM)', () => {
  const days = [{ y: 2026, m: 11, d: 2, off: -300, times: { fajr: 345.49, dhuhr: 731.5, asr: 880.2, maghrib: 1003.7, isha: 1090.01 } }];
  const r = Z.plan({ days, settings: settings(), now: Date.UTC(2026, 10, 2, 0) });
  assert.deepEqual(r.notifications.filter(n => n.kind === 'adhan').map(n => hhmm(n.at, -300)), ['05:45', '12:12', '14:40', '16:44', '18:10']);
});

/* ---- summer time: Toronto falls back on Sun 1 Nov 2026 (EDT −4 → EST −5) and springs forward on Sun 14 Mar 2027 ---- */
function torontoDays(y, m, d, n) {
  // each day carries its own offset, the way zij-native.js builds days from observer.tzAt(); times = a fixed local clock schedule
  const off = dt => { const s = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', timeZoneName: 'longOffset' }).formatToParts(dt).find(p => p.type === 'timeZoneName').value; const mm = /GMT([+-])(\d\d):?(\d\d)?/.exec(s); return mm ? (mm[1] === '-' ? -1 : 1) * (+mm[2] * 60 + +(mm[3] || 0)) : 0; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const noonUTC = new Date(Date.UTC(y, m - 1, d + i, 17));
    out.push({ y: noonUTC.getUTCFullYear(), m: noonUTC.getUTCMonth() + 1, d: noonUTC.getUTCDate(), off: off(noonUTC), times: { fajr: 360, dhuhr: 750, asr: 900, maghrib: 1020, isha: 1110 } });
  }
  return out;
}
const torontoClock = ms => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms));

test('DST end (Toronto, 1 Nov 2026): every alert still rings at the local clock time', () => {
  const days = torontoDays(2026, 10, 30, 6);
  assert.deepEqual(days.map(d => d.off), [-240, -240, -300, -300, -300, -300]);
  const r = Z.plan({ days, settings: settings(), now: Date.UTC(2026, 9, 30, 4) });
  const adhan = r.notifications.filter(n => n.kind === 'adhan');
  assert.ok(adhan.length >= 25);
  for (const n of adhan) assert.equal(torontoClock(n.at), { fajr: '06:00', dhuhr: '12:30', asr: '15:00', maghrib: '17:00', isha: '18:30' }[n.prayer], n.date + ' ' + n.prayer);
  // same local time, one more hour of UTC after the change
  const f31 = adhan.find(n => n.date === '2026-10-31' && n.prayer === 'fajr').at, f01 = adhan.find(n => n.date === '2026-11-01' && n.prayer === 'fajr').at;
  assert.equal((f01 - f31) / MIN, 24 * 60 + 60);
});

test('DST start (Toronto, 14 Mar 2027): no alert lost or doubled, local clock respected', () => {
  const days = torontoDays(2027, 3, 12, 5);
  assert.deepEqual(days.map(d => d.off), [-300, -300, -240, -240, -240]);
  const s = settings(allOn);
  const r = Z.plan({ days, settings: s, now: Date.UTC(2027, 2, 12, 5), limit: 64 });
  const a = r.notifications.filter(n => n.kind !== 'reminder');
  assert.equal(a.length, 63);
  for (const n of a.filter(n => n.kind === 'adhan')) assert.equal(torontoClock(n.at), { fajr: '06:00', dhuhr: '12:30', asr: '15:00', maghrib: '17:00', isha: '18:30' }[n.prayer]);
  const f13 = a.find(n => n.date === '2027-03-13' && n.prayer === 'fajr' && n.kind === 'adhan').at, f14 = a.find(n => n.date === '2027-03-14' && n.prayer === 'fajr' && n.kind === 'adhan').at;
  assert.equal((f14 - f13) / MIN, 24 * 60 - 60);
});

test('limit is clamped to the iOS ceiling even if asked for more', () => {
  const days = uqDays(74, 2026, 10, 25, 30);
  const r = Z.plan({ days, settings: settings(allOn), now: Date.UTC(2026, 9, 24, 21), limit: 500 });
  assert.equal(r.notifications.length, 64);
});
