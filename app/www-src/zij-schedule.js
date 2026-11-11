/* Al-Zij native app — the alert planner (pure logic, no device APIs).
   Given the prayer times of the coming days and the user's own alert settings (the same object the web app keeps in
   localStorage 'zijAlerts'), it returns the exact list of local notifications to hand to iOS:
     - one entry per enabled alert: before-adhan, adhan, iqamah — for each of the five prayers, each day;
     - never more than `limit` in total (iOS keeps at most 64 pending local notifications per app);
     - THE ADHAN FIRST (table row #71, Hassan's design of 31 Oct): each prayer's main alert — the adhan, or, if the user turned
       the adhan off for that prayer, its before-adhan alert, else its iqamah — is kept for the next GUARANTEE_DAYS days
       (8) before anything else; the remaining slots then go to the nearest alerts of any kind. With all three alerts on this
       gives the adhan for 8 days + the nearest ≈ 2 days of before-adhan / iqamah alerts; with the adhan only (the default)
       every slot is an adhan, ≈ 12½ days;
     - plus one gentle reminder near the end of the guaranteed window asking the user to open Al-Zij so the alerts keep coming.
   The wording is the web app's own alert wording (index.html, #alertsJs → fire()).
   Works in the browser (window.ZijSchedule) and in Node (module.exports) so it can be unit-tested. */
(function (root) {
  'use strict';
  var PRAYERS = [['fajr', 'الفجر', 'Fajr'], ['dhuhr', 'الظهر', 'Dhuhr'], ['asr', 'العصر', 'Asr'], ['maghrib', 'المغرب', 'Maghrib'], ['isha', 'العشاء', 'Isha']];
  var KIND_ORDER = { pre: 0, adhan: 1, iqama: 2 };
  // the in-app sounds, rendered once into short files (app/scripts/make-sounds.py). 'silent' = message only.
  var SOUND_FILES = { brass: 'zij-brass.wav', bell: 'zij-bell.wav', soft: 'zij-soft.wav' };
  var IOS_LIMIT = 64, REMINDER_ID = 999,
      // Android has no 64-alert ceiling, but every pending alert is one AlarmManager alarm, and the system refuses more than
      // 500 per app ("Too many alarms (500) registered") — some phones count the app's other alarms too. 150 keeps a wide
      // margin and still covers a month of adhans (adhan only: 5 a day ≈ 30 days; all three alerts: 8 days of adhan + the rest).
      ANDROID_LIMIT = 150, MIN_LEAD_MS = 15000, MIN = 60000, HOUR = 3600000, DAY = 86400000;
  var GUARANTEE_DAYS = 8;          // each prayer's main alert is kept this many days ahead before any other alert (#71)
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
        // Friday's optional iqamah is for someone praying away from the mosque — whether it is Jumu'ah or Dhuhr is not ours to name
        if (k === 'dhuhr' && friday) return EN ? '🕌 It is now time for the iqamah' : '🕌 حان الآن وقت إقامة الصلاة';
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
   *                             Friday (Hassan, 10 Nov): Dhuhr's iqamah on a Friday comes from p.dhuhr.friIqama {on,min,snd} — OFF unless
   *                             the user turns it on (at Jumu'ah the imam calls the iqamah; the phone must not ring in the mosque).
   * @param {number} o.now       epoch ms
   * @param {string} [o.lang]    'ar' | 'en'
   * @param {string} [o.digits]  'ar' | 'en' (Arabic-mode digit style)
   * @param {number} [o.limit]   total pending notifications allowed (default: the platform ceiling — iOS 64, Android 150)
   * @param {string} [o.platform] 'ios' (default) | 'android' — only changes the ceiling
   * @param {boolean}[o.reminder] add the "open Al-Zij" reminder (default true)
   * @param {number} [o.guaranteeDays] days ahead for which each prayer's main alert is kept first (default GUARANTEE_DAYS = 8)
   * @returns {{notifications:Array, alerts:number, firstAt:number|null, lastAt:number|null, dropped:number,
   *            mainUntil:number|null, extraUntil:number|null}}
   *   mainUntil  = the last main alert (adhan) before the first one that could not be kept — the adhan is complete up to here;
   *   extraUntil = the same for the other alerts (before-adhan, iqamah), or null when none is enabled.
   */
  function plan(o) {
    var ceil = o.platform === 'android' ? ANDROID_LIMIT : IOS_LIMIT;
    var limit = Math.max(1, Math.min(o.limit || ceil, ceil));
    var S = o.settings, now = o.now, W = words(o.lang, o.digits);
    var gDays = o.guaranteeDays != null ? Math.max(0, +o.guaranteeDays) : GUARANTEE_DAYS;
    var all = [];
    if (S && S.on !== false && S.p) {
      (o.days || []).forEach(function (day) {
        var friday = new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay() === 5;
        PRAYERS.forEach(function (P) {
          var k = P[0], t = day.times && day.times[k], c = S.p[k];
          if (!c || t == null || !isFinite(t)) return;
          var shown = Math.round(t);                                     // the minute the screen shows (AstroMath.minToHHMM rounds)
          var base = localToEpoch(day.y, day.m, day.d, shown, day.off);
          // Friday: Dhuhr's iqamah has its own setting, off unless the user chose it (praying away from the mosque)
          var iq = k === 'dhuhr' && friday ? (c.friIqama || null) : c.iqama;
          // this prayer's main alert: the adhan, or (adhan off) the before-adhan alert, else the iqamah
          var main = c.adhan && c.adhan.on ? 'adhan' : c.pre && c.pre.on ? 'pre' : iq && iq.on ? 'iqama' : null;
          [['pre', c.pre, -1], ['adhan', c.adhan, 0], ['iqama', iq, 1]].forEach(function (A) {
            var kind = A[0], cfg = A[1];
            if (!cfg || !cfg.on) return;
            var at = base + A[2] * (+cfg.min || 0) * MIN;
            // a time already past would be delivered at once by the plugin (8.3.1 turns it into a nil trigger) — never hand it over
            if (at <= now + MIN_LEAD_MS) return;
            all.push({ at: at, kind: kind, prayer: k, snd: cfg.snd, body: W.body(kind, k, cfg, friday), main: kind === main,
                       date: day.y + '-' + pad(day.m) + '-' + pad(day.d) });
          });
        });
      });
    }
    all.sort(function (a, b) { return a.at - b.at || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]; });
    // two alerts at the very same minute (e.g. iqamah of one prayer = pre-alert of the next): keep both, iOS shows both
    var wantReminder = o.reminder !== false && all.length > 0;
    var room = wantReminder && limit > 1 ? limit - 1 : limit;
    // 1 · the adhan first: every main alert of the next gDays days (at most 5 a day × 8 = 40, always fits in 63)
    var horizon = now + gDays * DAY, taken = [];
    all.forEach(function (a, i) { if (a.main && a.at <= horizon && taken.length < room) { a.keep = true; taken.push(i); } });
    // 2 · the remaining slots: the nearest of everything else — the other alerts of the coming days, then later adhans
    for (var i = 0; i < all.length && taken.length < room; i++) if (!all[i].keep) { all[i].keep = true; taken.push(i); }
    var chosen = all.filter(function (a) { return a.keep; });
    var out = chosen.map(function (a, i) {
      var n = { id: i + 1, title: W.title, body: a.body, at: a.at, kind: a.kind, prayer: a.prayer, date: a.date };
      if (SOUND_FILES[a.snd]) n.sound = SOUND_FILES[a.snd];
      return n;
    });
    var lastAt = chosen.length ? chosen[chosen.length - 1].at : null;
    // how far each kind is complete: up to the last kept alert before the first one of that kind that had to be left out
    var until = function (isMain) {
      var last = null;
      for (var j = 0; j < all.length; j++) { var a = all[j]; if (a.main !== isMain) continue; if (!a.keep) break; last = a.at; }
      return last;
    };
    var mainUntil = until(true), extraUntil = until(false);
    if (wantReminder && chosen.length && limit > 1) {
      // the reminder belongs to the end of the adhan window: that is when the alerts that matter run out
      var r = reminderTime(now, mainUntil != null ? mainUntil : lastAt, (o.days && o.days.length ? o.days[0].off : 0),
                           chosen.map(function (a) { return a.at; }));
      if (r) out.push({ id: REMINDER_ID, title: W.reminderTitle, body: W.reminder, at: r, kind: 'reminder', sound: SOUND_FILES.soft });
    }
    out.sort(function (a, b) { return a.at - b.at; });
    return { notifications: out, alerts: chosen.length, firstAt: chosen.length ? chosen[0].at : null, lastAt: lastAt,
             dropped: all.length - chosen.length, mainUntil: mainUntil, extraUntil: extraUntil };
  }

  // about a day before the last saved alert, moved out of the night (21:00–09:00 local → 20:00 the evening before).
  // `avoid` = the alert times: "a day before the last adhan" lands on the same prayer the day before (± a minute), so the
  // reminder would ring together with an adhan — it is moved 30 min away from any alert (Fable review, 10 Nov).
  function reminderTime(now, lastAt, offMin, avoid) {
    if (lastAt == null || lastAt - now < 2 * HOUR) return null;     // window too short to matter: the next open reschedules anyway
    var r = lastAt - DAY;
    if (r < now + HOUR) r = now + (lastAt - now) / 2;
    var local = new Date(r + offMin * MIN), h = local.getUTCHours();
    if (h >= 21 || h < 9) {
      var eve = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (h < 9 ? 1 : 0), 20) - offMin * MIN;
      if (eve > now + HOUR && eve < lastAt) r = eve;
    }
    r = Math.round(r / MIN) * MIN;
    var near = function (t) { return (avoid || []).some(function (a) { return Math.abs(a - t) < 2 * MIN; }); };
    for (var k = 0; k < 4 && near(r); k++) {
      var later = r + 30 * MIN, earlier = r - 30 * MIN;
      r = (later < lastAt && !near(later)) || earlier <= now + HOUR ? later : earlier;
    }
    return r;
  }

  /* ---------- Android: how a planned alert is handed to @capacitor/local-notifications 8.3.1 ----------
     On Android 8+ the sound belongs to the notification CHANNEL, not to the notification, so each sound has its own channel
     (created once by the bridge from ANDROID_CHANNELS). Raw resource names may only use a–z, 0–9 and _, so the sounds ship as
     res/raw/zij_brass.wav etc. «بدون صوت» goes to a low-importance channel with no sound. `exact` = the user allowed
     «Alarms & reminders»: then the plugin uses setExactAndAllowWhileIdle; otherwise it must NOT ask (it would open the settings
     screen on every reschedule — plugin source, doSchedule), so isExactNotification is false and Android may deliver the alert
     up to an hour late — the alerts card says so and offers the switch. */
  var ANDROID_CHANNELS = [
    { id: 'zij_brass', snd: 'brass', sound: 'zij_brass.wav', importance: 4, ar: 'الأذان والتنبيهات — نغمة النحاس', en: 'Adhan and alerts — brass tone' },
    { id: 'zij_bell', snd: 'bell', sound: 'zij_bell.wav', importance: 4, ar: 'الأذان والتنبيهات — نغمة الجرس', en: 'Adhan and alerts — bell tone' },
    { id: 'zij_soft', snd: 'soft', sound: 'zij_soft.wav', importance: 4, ar: 'الأذان والتنبيهات — نغمة هادئة', en: 'Adhan and alerts — soft tone' },
    { id: 'zij_silent', snd: 'silent', sound: null, importance: 2, ar: 'تنبيهات بلا صوت', en: 'Alerts without sound' },
    { id: 'zij_reminder', snd: null, sound: 'zij_soft.wav', importance: 3, ar: 'تذكير بفتح الزّيج', en: 'Reminder to open Al-Zij' }
  ];
  function androidRaw(file) { return file ? String(file).replace(/\.[^.]+$/, '').replace(/[^a-z0-9_]/gi, '_').toLowerCase() : null; }
  function androidOptions(n, exact) {
    var ch;
    if (n.kind === 'reminder') ch = 'zij_reminder';
    else if (!n.sound) ch = 'zij_silent';
    else ch = androidRaw(n.sound);                                    // zij-brass.wav → zij_brass
    var o = { channelId: ch, smallIcon: 'ic_stat_zij', iconColor: '#C9A35D', isExactNotification: !!exact, autoCancel: true };
    if (n.sound) o.sound = androidRaw(n.sound) + '.wav';             // Android 7 and older: per-notification sound from res/raw
    return o;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var api = { plan: plan, words: words, localToEpoch: localToEpoch, reminderTime: reminderTime, SOUND_FILES: SOUND_FILES, IOS_LIMIT: IOS_LIMIT,
              ANDROID_LIMIT: ANDROID_LIMIT, ANDROID_CHANNELS: ANDROID_CHANNELS, androidOptions: androidOptions, androidRaw: androidRaw,
              REMINDER_ID: REMINDER_ID, GUARANTEE_DAYS: GUARANTEE_DAYS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZijSchedule = api;
})(typeof window !== 'undefined' ? window : this);
