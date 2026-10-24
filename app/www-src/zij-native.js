/* Al-Zij — native bridge (iPhone app only).
   Injected by app/scripts/bundle-web.mjs into the app's COPY of index.html, right after <meta charset>, so it runs before the
   page's own scripts. The live site never loads this file. Outside the Capacitor app it does nothing at all.

   What it does inside the app:
   1. Adhan alerts that fire with the phone locked or Al-Zij closed: the next alerts (before-adhan · adhan · iqamah, exactly as
      the user set them in Prayer → Alerts) are handed to iOS as local notifications — at most 64, the iOS ceiling — computed
      with the page's own prayer-time engine (observer.realPrayerTimes + the official Umm al-Qura table), so the minutes are
      the ones on the screen. Recomputed on every open, on every return to the screen, and whenever a setting, the place or
      the method changes. A gentle reminder near the end of the window asks the user to open Al-Zij so alerts keep coming.
   2. Notification permission is asked only from the alerts settings (a tap there), never on first launch.
   3. The web-only «add Al-Zij to your home screen» banner and button are hidden (table row #48).
   4. Links to the site's own pages (/privacy/, /support/ …) open on alzijapp.com.
   5. Silent web updates: see zij-live-update.js. */
(function () {
  'use strict';
  var Cap = window.Capacitor;
  var isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
  window.ZIJ_NATIVE = isNative;
  if (!isNative) return;

  var CFG = window.ZIJ_NATIVE_CFG || {};
  var SITE = CFG.site || 'https://alzijapp.com';
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var log = function () { try { console.log.apply(console, ['[zij-native]'].concat([].slice.call(arguments))); } catch (e) {} };
  function plugin(name) {
    try { if (Cap.Plugins && Cap.Plugins[name]) return Cap.Plugins[name]; } catch (e) {}
    try { if (typeof Cap.registerPlugin === 'function') return Cap.registerPlugin(name); } catch (e) {}
    return null;
  }
  var LN = plugin('LocalNotifications');
  var FS = plugin('Filesystem');

  /* ---------- 3 · no «add to home screen» inside the app (#48), before the page's own script decides ---------- */
  LS.set('zijInstallHide', '1');
  var css = document.createElement('style');
  css.id = 'zijNativeCss';
  css.textContent = '#zInsBar,#mInstall,#zIns{display:none!important}' +
    '#zNat{margin:8px 0 4px;padding:10px 12px;border:1px solid var(--h-line,rgba(201,163,93,.22));border-radius:12px;font-size:14px;line-height:1.6;color:var(--h-dim,#8a8570)}' +
    '#zNat b{color:var(--h-brass-l,#eddba0)}#zNat button{display:block;width:100%;margin-top:8px;background:var(--h-raise,#161c2c);border:1px solid var(--h-brass-d,#7c5f30);border-radius:20px;padding:9px 12px;color:var(--h-brass-l,#eddba0);font-family:inherit;font-size:16px;font-weight:700;cursor:pointer}';
  (document.head || document.documentElement).appendChild(css);

  /* ---------- 4 · the site's own pages open on alzijapp.com ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="/"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!/^\/(privacy|support|about|mawaqit)(\/|$)/.test(href)) return;
    e.preventDefault();
    window.open(SITE + href, '_blank');
  }, true);

  /* ---------- 1 · adhan alerts as iOS local notifications ---------- */
  var LANG = function () { return window.ZIJ_LANG === 'en' ? 'en' : 'ar'; };
  var T = function (a, e) { return LANG() === 'en' ? e : a; };
  // enough days to fill the 63 alert slots with the user's own alerts (adhan only: 5 a day ≈ 12½ days; all three: ≈ 4 days)
  function daysNeeded(S) {
    var perDay = 0;
    if (S && S.on !== false && S.p) Object.keys(S.p).forEach(function (k) { ['pre', 'adhan', 'iqama'].forEach(function (x) { if (S.p[k] && S.p[k][x] && S.p[k][x].on) perDay++; }); });
    return Math.max(3, Math.min(40, Math.ceil(63 / Math.max(perDay, 1)) + 2));
  }
  var perm = 'unknown';          // granted | denied | prompt | unknown
  // kept in memory only: the first sync of every launch always rewrites the pending list, so the plugin knows each
  // notification's `silent` flag in this process (not shown on top of the page's own alert while Al-Zij is on screen)
  var lastSig = '';
  var lastPlan = null, busy = false, again = false;

  function settings() {
    try { if (window.zijAlerts && zijAlerts.get) return zijAlerts.get(); } catch (e) {}
    try { return JSON.parse(LS.get('zijAlerts') || 'null'); } catch (e) { return null; }
  }
  function engineReady() { return typeof window.observer !== 'undefined' && window.observer && typeof observer.realPrayerTimes === 'function' && window.hijriCal; }

  // the coming days' prayer times, from the page's own engine (same call the screen and the in-page alerts use)
  function days(now, count) {
    var out = [];
    var tz0 = observer.tzAt ? observer.tzAt(new Date(now)) : observer.tz;
    var l0 = new Date(now + tz0 * 3600000);
    for (var i = 0; i < (count || 14); i++) {
      var y = l0.getUTCFullYear(), m = l0.getUTCMonth(), d = l0.getUTCDate() + i;
      var guess = Date.UTC(y, m, d, 12) - tz0 * 3600000;                         // local noon that day …
      var tz = observer.tzAt ? observer.tzAt(new Date(guess)) : tz0;             // … with that day's own offset (summer time)
      var D = new Date(Date.UTC(y, m, d, 12) - tz * 3600000);
      var p;
      try { p = observer.realPrayerTimes(D, hijriCal.fromGregorian(D)); } catch (e) { continue; }
      var ld = new Date(D.getTime() + tz * 3600000);
      out.push({ y: ld.getUTCFullYear(), m: ld.getUTCMonth() + 1, d: ld.getUTCDate(), off: Math.round(tz * 60),
                 times: { fajr: p.fajr, dhuhr: p.dhuhr, asr: p.asr, maghrib: p.maghrib, isha: p.isha }, official: !!p.official });
    }
    return out;
  }

  function buildPlan(now) {
    var S = settings();
    return window.ZijSchedule.plan({ days: days(now, daysNeeded(S)), settings: S, now: now, lang: LANG(), digits: LS.get('zijDigits') === 'en' ? 'en' : 'ar' });
  }

  // wait (briefly) for the official Saudi table so the first plan uses it, exactly like the screen
  function uqSettled() {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function poll() {
        try {
          if (!window.zijUQ) return res();
          zijUQ.ensure(observer.lat, observer.lon);
          if (zijUQ.ready()) return res();
        } catch (e) { return res(); }
        if (Date.now() - t0 > 6000) return res();
        setTimeout(poll, 150);
      })();
    });
  }

  function checkPerm() {
    if (!LN) return Promise.resolve('unknown');
    return LN.checkPermissions().then(function (r) { perm = r && r.display === 'granted' ? 'granted' : r && r.display === 'denied' ? 'denied' : 'prompt'; return perm; })
      .catch(function () { return perm; });
  }
  function askPerm() {
    if (!LN) return Promise.resolve('unknown');
    return LN.requestPermissions().then(function (r) { perm = r && r.display === 'granted' ? 'granted' : 'denied'; return perm; })
      .catch(function () { return checkPerm(); })
      .then(function (p) { paint(); resync('permission'); return p; });
  }

  function sigOf(list) { return list.map(function (n) { return n.id + '@' + n.at + (n.sound || '') + n.body; }).join('|'); }

  function toNative(n) {
    var o = { id: n.id, title: n.title, body: n.body, schedule: { at: new Date(n.at), allowWhileIdle: true },
              threadIdentifier: 'zij-alerts', silent: true,  // silent = not shown while Al-Zij is on screen: the page itself rings then
              extra: { kind: n.kind, prayer: n.prayer || '', date: n.date || '' } };
    if (n.sound) o.sound = n.sound;
    return o;
  }

  function resync(why) {
    if (busy) { again = true; return Promise.resolve(); }
    if (!LN || !engineReady() || !window.ZijSchedule) return Promise.resolve();
    busy = true;
    return uqSettled().then(checkPerm).then(function () {
      var plan = buildPlan(Date.now());
      lastPlan = plan;
      var sig = perm + '#' + sigOf(plan.notifications);
      return LN.getPending().then(function (r) {
        var pending = (r && r.notifications) || [];
        if (sig === lastSig && pending.length === plan.notifications.length) return;    // nothing changed
        var cancel = pending.length ? LN.cancel({ notifications: pending.map(function (n) { return { id: +n.id }; }) }) : Promise.resolve();
        return cancel.then(function () {
          if (perm !== 'granted' || !plan.notifications.length) return;
          return LN.schedule({ notifications: plan.notifications.map(toNative) });
        }).then(function () {
          lastSig = sig;
          LS.set('zijNativeLast', JSON.stringify({ at: Date.now(), why: why, n: plan.alerts, first: plan.firstAt, last: plan.lastAt, perm: perm }));
          log('scheduled', perm === 'granted' ? plan.notifications.length : 0, 'why=' + why);
        });
      });
    }).catch(function (e) { log('resync failed', e && e.message); })
      .then(function () { busy = false; paint(); if (again) { again = false; return resync('queued'); } });
  }

  /* ---------- 2 · the alerts card: status line + the permission button (only here) ---------- */
  var AR = '٠١٢٣٤٥٦٧٨٩';
  function num(n) { return (LANG() === 'en' || LS.get('zijDigits') === 'en') ? String(n) : String(n).replace(/\d/g, function (d) { return AR[d]; }); }
  function dayWord(n) { return LANG() === 'en' ? (n === 1 ? '1 day' : n + ' days') : (n === 1 ? 'يوم واحد' : n === 2 ? 'يومين' : num(n) + (n <= 10 ? ' أيام' : ' يومًا')); }
  function statusHTML() {
    var S = settings() || {};
    if (S.on === false) return null;
    if (perm === 'denied') {
      return '<div>' + T('🔕 التنبيه والجوال مقفول ممنوع من إعدادات الآيفون.', '🔕 Alerts with the phone locked are turned off in iPhone Settings.') + '</div>' +
        '<button type="button" data-nat="settings">' + T('افتح الإعدادات ← الإشعارات ← الزّيج', 'Open Settings → Notifications → Al-Zij') + '</button>';
    }
    if (perm !== 'granted') {
      return '<div>' + T('ليصلك الأذان والجوال مقفول أو الزّيج مغلق، اسمح للزّيج بالتنبيه مرة واحدة.', 'To get the adhan with the phone locked or Al-Zij closed, allow Al-Zij to notify you once.') + '</div>' +
        '<button type="button" data-nat="ask">' + T('🔔 اسمح بتنبيه الأذان', '🔔 Allow adhan alerts') + '</button>';
    }
    var p = lastPlan;
    if (!p || !p.alerts) return '<div>' + T('✅ التنبيه والجوال مقفول مسموح.', '✅ Alerts with the phone locked are allowed.') + '</div>';
    var n = Math.max(1, Math.round((p.lastAt - Date.now()) / 86400000));
    return '<div>✅ ' + T('التنبيهات تصلك والجوال مقفول أو الزّيج مغلق، محفوظة على جوالك لـ<b>' + dayWord(n) + '</b> قادمة. افتح الزّيج مرة كل أسبوع تقريبًا ليستمر.',
      'Alerts reach you with the phone locked or Al-Zij closed — saved on your phone for the next <b>' + dayWord(n) + '</b>. Open Al-Zij about once a week to keep them coming.') + '</div>';
  }
  function paint() {
    var box = document.getElementById('zAl');
    if (!box) return;
    // the web text about «phone locked comes with the store app» and the browser-notification button don't apply here
    var note = box.querySelector('.note');
    if (note && !note.dataset.nat) {
      note.dataset.nat = '1';
      note.textContent = T('لكل صلاة ثلاثة تنبيهات تعدّلها كما تحب: قبل الأذان، والأذان، والإقامة.', 'Each prayer has three alerts you can set as you like: before the adhan, the adhan, and the iqamah.');
    }
    var wb = box.querySelector('#zAlNotif'); if (wb) wb.remove();
    var html = statusHTML();
    var el = box.querySelector('#zNat');
    if (!html) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'zNat';
      ['data-notr', 'data-nodigit'].forEach(function (a) { el.setAttribute(a, ''); });
      var m = box.querySelector('.m'); if (m && m.nextSibling) box.insertBefore(el, m.nextSibling); else box.appendChild(el);
    }
    if (el.innerHTML !== html) el.innerHTML = html;
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#zNat [data-nat]');
    if (b) {
      e.preventDefault();
      if (b.dataset.nat === 'ask') askPerm();
      else { try { location.href = 'app-settings:'; } catch (x) {} }   // UIApplication.openSettingsURLString
      return;
    }
    // a tap on the alerts switch or on any alert's on/off inside the alerts settings is the right moment to ask (never on first launch)
    var sw = e.target && e.target.closest && e.target.closest('#zAlMaster, #zAl input[type=checkbox]');
    if (sw && perm === 'prompt') {
      setTimeout(function () { var S = settings(); if (S && S.on !== false) askPerm(); }, 50);
    }
  }, true);

  /* ---------- when to recompute ---------- */
  // a fingerprint of everything that changes the alerts: settings, place, method, Asr school, mosque offsets, language, digits, date
  function fingerprint() {
    if (!engineReady()) return '';
    var keys = ['zijAlerts', 'zijCalcMethod', 'zijAsr', 'zijAdhanOffsets', 'zijHighLat', 'zijLang', 'zijDigits', 'zijCountry'];
    var day = new Date(); day = day.getFullYear() + '-' + day.getMonth() + '-' + day.getDate();
    return keys.map(function (k) { return LS.get(k) || ''; }).join('§') + '§' + (+observer.lat).toFixed(3) + ',' + (+observer.lon).toFixed(3) +
      '§' + (observer.activeMethod ? observer.activeMethod() : '') + '§' + day + '§' + (hijriCal.offset || 0);
  }
  var lastFp = '';
  function watch() {
    if (document.visibilityState !== 'visible') return;
    var fp = fingerprint();
    if (fp && fp !== lastFp) { var first = !lastFp; lastFp = fp; resync(first ? 'open' : 'change'); }
    paint();
  }
  function resumed() { lastFp = ''; checkPerm().then(watch); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') resumed(); });
  try { var APP = plugin('App'); if (APP && APP.addListener) APP.addListener('resume', resumed); } catch (e) {}
  window.addEventListener('load', function () {
    var start = function () { if (!engineReady()) return setTimeout(start, 300); watch(); setInterval(watch, 4000); };
    start();
    var mo = new MutationObserver(function () { paint(); });
    var tryObs = function () { var b = document.getElementById('pAlert'); if (b) mo.observe(b, { childList: true }); else setTimeout(tryObs, 500); };
    tryObs();
  });

  window.zijNative = { resync: resync, plan: function () { return lastPlan; }, perm: function () { return perm; }, ask: askPerm, days: days };

  /* ---------- notification sounds: iOS plays custom sounds only from the app's Library/Sounds folder ---------- */
  function installSounds() {
    if (!FS || !window.ZijSchedule) return;
    var files = Object.keys(ZijSchedule.SOUND_FILES).map(function (k) { return ZijSchedule.SOUND_FILES[k]; });
    var want = (CFG.build || '') + ':' + files.join(',');
    if (LS.get('zijNativeSounds') === want) return;
    Promise.all(files.map(function (f) {
      return fetch('sounds/' + f).then(function (r) { return r.blob(); }).then(function (b) {
        return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1]); }; fr.onerror = rej; fr.readAsDataURL(b); });
      }).then(function (data) { return FS.writeFile({ path: 'Sounds/' + f, data: data, directory: 'LIBRARY', recursive: true }); });
    })).then(function () { LS.set('zijNativeSounds', want); log('sounds installed'); })
      .catch(function (e) { log('sounds failed', e && e.message); });
  }
  installSounds();
})();
