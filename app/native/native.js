/* ===== الزيج — تنبيهات الأذان في تطبيق الآيفون (#71) =====
   The iPhone itself fires these (local notifications): they ring with Al-Zij closed, asleep or swiped away, and with no internet.
   iPhone keeps at most 64 scheduled at once, so:
     ① the adhan comes first: adhan alerts for 8 days are always kept;
        «before the adhan» and «iqamah» fill what is left, nearest first; any room left adds more adhan days (up to 12)
     ② every chance to refresh: each time Al-Zij opens or comes back, when settings / city / time zone change, and every minute while open
     ③ safety net: one day before the alerts run out, a reminder «اضغط عشان تكمل تنبيهات الأذان»
   Settings are the web Zij's own (Prayer → التنبيهات, localStorage 'zijAlerts'); nothing here is a second copy of them.
   Runs only inside the app (or with window.ZIJ_NATIVE_MOCK in tests). The website is untouched. */
(function () {
  'use strict';
  const Cap = window.Capacitor;
  const MOCK = window.ZIJ_NATIVE_MOCK || null;
  const NATIVE = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  if (!NATIVE && !MOCK) return;
  const plug = n => MOCK ? MOCK[n] : (Cap.Plugins && Cap.Plugins[n]) || (Cap.registerPlugin && Cap.registerPlugin(n));
  const LN = plug('LocalNotifications'), APP = plug('App'), FS = plug('Filesystem'), LAUNCH = plug('AppLauncher');
  document.documentElement.classList.add('zij-native');

  const BUDGET = 64, RESERVE = 1, ADHAN_DAYS = 8, MAX_DAYS = 12;
  const EN = () => window.ZIJ_LANG === 'en', T = (a, e) => EN() ? e : a;
  const AR = '٠١٢٣٤٥٦٧٨٩', D = n => EN() ? String(n) : String(n).replace(/\d/g, d => AR[d]);
  const P = [['fajr', 'الفجر', 'Fajr'], ['dhuhr', 'الظهر', 'Dhuhr'], ['asr', 'العصر', 'Asr'], ['maghrib', 'المغرب', 'Maghrib'], ['isha', 'العشاء', 'Isha']];
  const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], WDE = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const GM = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const GME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const log = (a, b) => { try { window.zijLog && zijLog(a, b); } catch (e) { } };
  const mins = n => EN() ? (n === 60 ? '1 hour' : n + ' min') : (n === 60 ? 'ساعة' : D(n) + ' ' + (n <= 10 ? 'دقائق' : 'دقيقة'));
  const ready = () => typeof window.observer !== 'undefined' && window.hijriCal && window.zijAlerts && window.observer.realPrayerTimes;

  /* ---- prayer times of local day k (0 = today) as real moments ---- */
  function day(k) {
    const tz = observer.tz, now = Date.now(), ld = new Date(now + tz * 36e5);
    const base = Date.UTC(ld.getUTCFullYear(), ld.getUTCMonth(), ld.getUTCDate() + k) - tz * 36e5; // local midnight of that day
    const noon = new Date(base + 12 * 36e5), p = observer.realPrayerTimes(noon, hijriCal.fromGregorian(noon));
    const wd = new Date(base + tz * 36e5).getUTCDay();
    return { k, base, wd, p, at: m => base + m * 60e3 };
  }
  const pname = (key, wd) => key === 'dhuhr' && wd === 5 ? T('الجمعة', 'Jumu\'ah') : (EN() ? P.find(x => x[0] === key)[2] : P.find(x => x[0] === key)[1]);
  function text(kind, key, wd, cfg) {
    const n = pname(key, wd);
    if (kind === 'pre') return EN() ? n + ' adhan in ' + mins(cfg.min) : 'بعد ' + mins(cfg.min) + ' أذان ' + n;
    if (kind === 'adhan') return EN() ? '🕌 It is now time for the ' + n + ' adhan' : '🕌 حان الآن موعد أذان ' + n;
    return EN() ? '🕌 It is now time for the ' + n + ' iqamah' : '🕌 حان الآن وقت إقامة صلاة ' + n;
  }

  /* ---- the plan: what goes into iPhone's 64 places ---- */
  function plan() {
    const S = zijAlerts.get(), now = Date.now() + 5e3;
    if (!S.on) return { on: false, items: [], until: null };
    const adhans = [], extras = [], days = [];
    for (let k = 0; k < MAX_DAYS; k++) {
      const d = day(k); days.push(d);
      P.forEach(([key]) => {
        const t = d.p[key]; if (t == null || isNaN(t)) return; const c = S.p[key];
        [['pre', t - c.pre.min, c.pre], ['adhan', t, c.adhan], ['iqama', t + c.iqama.min, c.iqama]].forEach(([kind, m, cfg]) => {
          if (!cfg || !cfg.on) return; const at = d.at(m); if (at <= now) return;
          (kind === 'adhan' ? adhans : extras).push({ at, kind, key, k, snd: cfg.snd, body: text(kind, key, d.wd, cfg) });
        });
      });
    }
    const cap = BUDGET - RESERVE;
    let items = adhans.filter(x => x.k < ADHAN_DAYS).slice(0, cap);                       // ① adhan first, 8 days
    for (const x of extras.filter(x => x.k < ADHAN_DAYS).sort((a, b) => a.at - b.at)) {   // then the nearest extras
      if (items.length >= cap) break; items.push(x);
    }
    for (let k = ADHAN_DAYS; k < MAX_DAYS; k++) {                                       // room left: more adhan days
      const dayA = adhans.filter(x => x.k === k); if (!dayA.length || items.length + dayA.length > cap) break; items.push(...dayA);
    }
    if (!items.length && extras.length) items = extras.sort((a, b) => a.at - b.at).slice(0, cap); // only extras switched on
    items.sort((a, b) => a.at - b.at);
    const until = items.length ? items[items.length - 1].at : null;
    let safety = null;
    if (until) {                                                                           // ③ one day before they run out
      let at = until - 24 * 36e5; if (at <= now + 36e5) at = null;
      if (at) safety = { at, kind: 'safety', key: '', k: -1, snd: 'bell',
        body: T('تنبيهات الأذان في الزيج تخلص بكرة — اضغط هنا عشان تكمل 🕌', 'Al-Zij adhan alerts end tomorrow — tap here to keep them going 🕌') };
    }
    return { on: true, items, safety, until };
  }
  const sig = pl => JSON.stringify([pl.on, pl.items.map(x => [x.at, x.kind, x.key, x.snd, x.body]), pl.safety && pl.safety.at, window.ZIJ_LANG]);

  /* ---- sounds: iPhone looks for custom sounds in Library/Sounds ---- */
  async function sounds() {
    if (MOCK || LS.get('zijNativeSounds') === '2' || !FS) return;
    for (const f of ['brass', 'bell', 'soft', 'silent']) {
      const b = new Uint8Array(await (await fetch('native/sounds/' + f + '.wav')).arrayBuffer());
      let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      await FS.writeFile({ path: 'Sounds/' + f + '.wav', data: btoa(s), directory: 'LIBRARY', recursive: true });
    }
    LS.set('zijNativeSounds', '2'); log('تطبيق', 'الأصوات جاهزة');
  }

  /* ---- permission ---- */
  let perm = 'unknown';
  async function permission(ask) {
    try {
      perm = (await LN.checkPermissions()).display;
      if (perm !== 'granted' && perm !== 'denied' && ask) perm = (await LN.requestPermissions()).display;
    } catch (e) { perm = 'unknown'; }
    return perm;
  }

  /* ---- schedule (only when the plan changed) ---- */
  let lastSig = LS.get('zijNativeSig') || '', busy = false, again = false, status = null;
  async function schedule(force) {
    if (!ready()) return;
    if (busy) { again = true; return; } busy = true;
    try {
      const welcomed = LS.get('zijWelcomed') === '1';
      const pl = plan();
      await permission(pl.on && welcomed);
      const sg = sig(pl);
      if (force || sg !== lastSig) {
        await sounds().catch(e => log('تطبيق', 'الأصوات: ' + e));
        const pend = await LN.getPending();
        if (pend && pend.notifications && pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
        const list = pl.items.concat(pl.safety ? [pl.safety] : []).map((x, i) => ({
          id: i + 1, title: T('الزّيج', 'Al-Zij'), body: x.body, sound: (x.snd || 'brass') + '.wav',
          schedule: { at: new Date(x.at), allowWhileIdle: true }, extra: { kind: x.kind, prayer: x.key }
        }));
        if (list.length) await LN.schedule({ notifications: list });
        lastSig = sg; LS.set('zijNativeSig', sg);
        log('تطبيق', 'جُدول ' + list.length + ' تنبيه حتى ' + (pl.until ? new Date(pl.until).toISOString() : '—'));
      }
      status = { on: pl.on, until: pl.until, count: pl.items.length + (pl.safety ? 1 : 0), perm };
      paint();
    } catch (e) { console.error('zij native', e); log('تطبيق', 'خطأ في الجدولة: ' + (e && e.message || e)); }
    busy = false; if (again) { again = false; schedule(); }
  }

  /* ---- always-visible state in Prayer → التنبيهات ---- */
  function fmtDay(ms) {
    const tz = observer.tz, d = new Date(ms + tz * 36e5);
    return EN() ? WDE[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + GME[d.getUTCMonth()] : WD[d.getUTCDay()] + ' ' + D(d.getUTCDate()) + ' ' + GM[d.getUTCMonth()];
  }
  function paint() {
    const zal = document.getElementById('zAl'); if (!zal || !status) return;
    const note = zal.querySelector('.note');
    if (note && !note.dataset.native) { note.dataset.native = '1';
      note.textContent = T('لكل صلاة ثلاثة تنبيهات تعدّلها كما تحب: قبل الأذان، والأذان، والإقامة. الآيفون نفسه هو اللي بيضربها: والزيج مقفول، والجوال مقفول، ومن غير نت.',
        'Each prayer has three alerts you can set: before the adhan, the adhan and the iqamah. iPhone itself rings them: with Al-Zij closed, the phone locked, and no internet.'); }
    const nb = zal.querySelector('#zAlNotif'); if (nb) nb.remove();      // browser-permission button means nothing in the app
    let box = document.getElementById('zNatSt');
    if (!box) { box = document.createElement('div'); box.id = 'zNatSt'; zal.insertBefore(box, zal.firstChild); }
    let html;
    if (status.perm === 'denied') {
      html = `<div style="background:#3a1512;border:1px solid #a4453a;border-radius:12px;padding:10px 12px;margin-bottom:8px;color:#f3c2bb;font-size:15.5px;line-height:1.6">⚠️ ${T('التنبيهات مقفولة من إعدادات الآيفون — الأذان مش هيوصلك.', 'Notifications are off in iPhone Settings — the adhan will not reach you.')}<button type="button" id="zNatSet" style="display:block;margin-top:8px;width:100%;background:#a4453a;color:#fff;border:0;border-radius:18px;padding:9px;font-family:inherit;font-size:16px;font-weight:700">${T('افتح الإعدادات وشغّلها', 'Open Settings to turn them on')}</button></div>`;
    } else if (!status.on) {
      html = `<div style="color:var(--h-dim);font-size:14.5px;margin-bottom:8px">🔕 ${T('التنبيهات متوقفة.', 'Alerts are off.')}</div>`;
    } else if (status.until) {
      html = `<div style="background:rgba(77,125,114,.14);border:1px solid var(--h-teal);border-radius:12px;padding:9px 12px;margin-bottom:8px;color:#b8eee2;font-size:15.5px;line-height:1.6">🔔 ${T('تنبيهات الأذان مضبوطة حتى', 'Adhan alerts are set until')} <b>${fmtDay(status.until)}</b><small style="display:block;color:var(--h-dim);font-size:13px">${T('وبتتجدد لوحدها كل ما تفتح الزيج', 'They renew by themselves each time you open Al-Zij')}</small></div>`;
    } else html = '';
    if (box.innerHTML !== html) box.innerHTML = html;
    const sb = document.getElementById('zNatSet');
    if (sb) sb.onclick = () => { try { LAUNCH && LAUNCH.openUrl({ url: 'app-settings:' }); } catch (e) { } };
  }

  /* ---- hooks: every chance to refresh ---- */
  function hook() {
    if (!ready()) return setTimeout(hook, 300);
    const A = window.zijAlerts;
    ['render', 'toggle', 'enableFromWelcome'].forEach(f => {
      const o = A[f]; if (typeof o !== 'function' || o._nat) return;
      A[f] = function () { const r = o.apply(this, arguments); setTimeout(() => { paint(); schedule(); }, 50); return r; }; A[f]._nat = 1;
    });
    // the settings screen redraws itself on every change (inside its own closure): watch it, repaint the state, re-plan
    const pa = document.getElementById('pAlert');
    if (pa && window.MutationObserver) {
      let t = 0; new MutationObserver(() => { if (!document.getElementById('zNatSt')) paint(); clearTimeout(t); t = setTimeout(schedule, 400); })
        .observe(pa, { childList: true, subtree: true, attributes: true, attributeFilter: ['checked', 'value'] });
    }
    if (APP && APP.addListener) {
      APP.addListener('appStateChange', s => { if (s && s.isActive) schedule(); });
      APP.addListener('resume', () => schedule());
    }
    if (LN.addListener) LN.addListener('localNotificationActionPerformed', () => schedule());
    setInterval(schedule, 60e3);            // city / official table / time zone / midnight: the plan's signature catches every change
    setTimeout(schedule, 1500); setTimeout(schedule, 8000); // after the location and the official city table arrive
    window.zijNative = { plan, schedule, status: () => status, _sig: sig };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
