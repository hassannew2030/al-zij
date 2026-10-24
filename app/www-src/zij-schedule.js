/* Al-Zij native app — the alert planner (pure logic, no device APIs).
   Given the prayer times of the coming days and the user's own alert settings (the same object the web app keeps in
   localStorage 'zijAlerts'), it returns the exact list of local notifications to hand to iOS:
     - one entry per enabled alert: before-adhan, adhan, iqamah — for each of the five prayers, each day;
     - nearest first, never more than `limit` in total (iOS keeps at most 64 pending local notifications per app);
     - plus one gentle reminder near the end of the window asking the user to open Al-Zij so the alerts keep coming.
   The wording is the web app's own alert wording (index.html, #alertsJs → fire()).
   Works in the browser (window.ZijSchedule) and in Node (module.exports) so it can be unit-tested. */
(function (root) {
  'use strict';
  var PRAYERS = [['fajr', 'الفجر', 'Fajr'], ['dhuhr', 'الظهر', 'Dhuhr'], ['asr', 'العصر', 'Asr'], ['maghrib', 'المغرب', 'Maghrib'], ['isha', 'العشاء', 'Isha']];
  var KIND_ORDER = { pre: 0, adhan: 1, iqama: 2 };
  // the in-app sounds, rendered once into short files (app/scripts/make-sounds.py). 'silent' = message only.
  var SOUND_FILES = { brass: 'zij-brass.wav', bell: 'zij-bell.wav', soft: 'zij-soft.wav' };
  var IOS_LIMIT = 64, REMINDER_ID = 999, MIN_LEAD_MS = 15000, MIN = 60000, HOUR = 3600000, DAY = 86400000;
  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

  function words(lang, digits) {
    var EN = lang === 'en';
    var latin = EN || digits === 'en';
    var D = function (n) { return latin ? String(n) : String(n).replace(/\d/g, function (d) { return AR_DIGITS[d]; }); };
    var T = function (a, e) { return EN ? e : a; };
    var mins = function (n) { return EN ? (n === 60 ? '1 hour' : n + ' min') : (n === 60 ? 'ساعة' : D(n) + ' ' + (n <= 10 ? 'دقائق' : 'دقيقة')); };
    var pname = function (k, friday) {
      if (k === 'dhuhr' && friday) return T('الجمعة', 'Jumu\'ah');
      for (var i = 0; i < PRAYERS.length; i++) if (PRAYERS[i][0] === k) return EN ? PRAYERS[i][2] : PRAYERS[i][1];
      return k;
    };
    return {
      title: T('الزّيج', 'Al-Zij'),
      body: function (kind, k, cfg, friday) {
        var n = pname(k, friday);
        if (kind === 'pre') return EN ? n + ' adhan in ' + mins(cfg.min) : 'بعد ' + mins(cfg.min) + ' أذان ' + n;
        if (kind === 'adhan') return EN ? '🕌 It is now time for the ' + n + ' adhan' : '🕌 حان الآن موعد أذان ' + n;
        return EN ? '🕌 It is now time for the ' + n + ' iqamah' : '🕌 حان الآن وقت إقامة صلاة ' + n;
      },
      reminder: EN
        ? 'Open Al-Zij so the adhan alerts keep coming — the alerts saved on your phone run out soon.'
        : 'افتح الزّيج ليستمر تنبيه الأذان — التنبيهات المحفوظة على جوالك تنتهي قريبًا.',
      reminderTitle: T('الزّيج — تنبيه الأذان', 'Al-Zij — adhan alerts')
    };
  }

  // epoch ms of minute `m` (minutes after local midnight, may be <0 or ≥1440) on local date y-mo-d whose clock is `offMin` minutes east of UTC
  function localToEpoch(y, mo, d, m, offMin) { return Date.UTC(y, mo - 1, d) + (m - offMin) * MIN; }

  /**
   * @param {object} o
   * @param {Array}  o.days      [{y, m, d, off, times:{fajr,dhuhr,asr,maghrib,isha}}] — off = that day's clock offset in minutes east of UTC;
   *                             times = minutes after local midnight exactly as the screen computes them (fractions allowed).
   * @param {object} o.settings  the web app's zijAlerts object {on, p:{fajr:{pre:{on,min,snd},adhan:{on,snd},iqama:{on,min,snd}},…}}
   * @param {number} o.now       epoch ms
   * @param {string} [o.lang]    'ar' | 'en'
   * @param {string} [o.digits]  'ar' | 'en' (Arabic-mode digit style)
   * @param {number} [o.limit]   total pending notifications allowed (default 64 — the iOS ceiling)
   * @param {boolean}[o.reminder] add the "open Al-Zij" reminder (default true)
   * @returns {{notifications:Array, alerts:number, firstAt:number|null, lastAt:number|null, dropped:number}}
   */
  function plan(o) {
    var limit = Math.max(1, Math.min(o.limit || IOS_LIMIT, IOS_LIMIT));
    var S = o.settings, now = o.now, W = words(o.lang, o.digits);
    var all = [];
    if (S && S.on !== false && S.p) {
      (o.days || []).forEach(function (day) {
        var friday = new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay() === 5;
        PRAYERS.forEach(function (P) {
          var k = P[0], t = day.times && day.times[k], c = S.p[k];
          if (!c || t == null || !isFinite(t)) return;
          var shown = Math.round(t);                                     // the minute the screen shows (AstroMath.minToHHMM rounds)
          var base = localToEpoch(day.y, day.m, day.d, shown, day.off);
          [['pre', c.pre, -1], ['adhan', c.adhan, 0], ['iqama', c.iqama, 1]].forEach(function (A) {
            var kind = A[0], cfg = A[1];
            if (!cfg || !cfg.on) return;
            var at = base + A[2] * (+cfg.min || 0) * MIN;
            if (at <= now + MIN_LEAD_MS) return;                         // iOS refuses times in the past
            all.push({ at: at, kind: kind, prayer: k, snd: cfg.snd, body: W.body(kind, k, cfg, friday),
                       date: day.y + '-' + pad(day.m) + '-' + pad(day.d) });
          });
        });
      });
    }
    all.sort(function (a, b) { return a.at - b.at || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]; });
    // two alerts at the very same minute (e.g. iqamah of one prayer = pre-alert of the next): keep both, iOS shows both
    var wantReminder = o.reminder !== false && all.length > 0;
    var room = wantReminder && limit > 1 ? limit - 1 : limit;
    var chosen = all.slice(0, room);
    var out = chosen.map(function (a, i) {
      var n = { id: i + 1, title: W.title, body: a.body, at: a.at, kind: a.kind, prayer: a.prayer, date: a.date };
      if (SOUND_FILES[a.snd]) n.sound = SOUND_FILES[a.snd];
      return n;
    });
    var lastAt = chosen.length ? chosen[chosen.length - 1].at : null;
    if (wantReminder && chosen.length && limit > 1) {
      var r = reminderTime(now, lastAt, (o.days && o.days.length ? o.days[0].off : 0));
      if (r) out.push({ id: REMINDER_ID, title: W.reminderTitle, body: W.reminder, at: r, kind: 'reminder', sound: SOUND_FILES.soft });
    }
    out.sort(function (a, b) { return a.at - b.at; });
    return { notifications: out, alerts: chosen.length, firstAt: chosen.length ? chosen[0].at : null, lastAt: lastAt, dropped: all.length - chosen.length };
  }

  // about a day before the last saved alert, moved out of the night (21:00–09:00 local → 20:00 the evening before)
  function reminderTime(now, lastAt, offMin) {
    if (lastAt == null || lastAt - now < 2 * HOUR) return null;     // window too short to matter: the next open reschedules anyway
    var r = lastAt - DAY;
    if (r < now + HOUR) r = now + (lastAt - now) / 2;
    var local = new Date(r + offMin * MIN), h = local.getUTCHours();
    if (h >= 21 || h < 9) {
      var eve = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (h < 9 ? 1 : 0), 20) - offMin * MIN;
      if (eve > now + HOUR && eve < lastAt) r = eve;
    }
    return Math.round(r / MIN) * MIN;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var api = { plan: plan, words: words, localToEpoch: localToEpoch, reminderTime: reminderTime, SOUND_FILES: SOUND_FILES, IOS_LIMIT: IOS_LIMIT, REMINDER_ID: REMINDER_ID };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZijSchedule = api;
})(typeof window !== 'undefined' ? window : this);
