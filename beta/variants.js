/* نسخة التجربة فقط — أشكال الرئيسية بدون الساعة في الأعلى (الساعة لا تُمس: تُنقل أو تُخفى وتُفتح بزر «الزيج»).
   أ «اليوم»: الصلاة القادمة ← شريط الصلوات ← كرت اليوم ← أزرار سريعة
   ب «القائمة»: كرت اليوم ← الصلوات عمودية كبيرة ← أزرار سريعة
   ج «الساعة تحت»: الصلاة القادمة والصلوات أولًا، والساعة كما هي تحتها
   الأصل: الشكل الحالي */
(function () {
  if (!/\/beta\//.test(location.pathname)) return;
  var KEY = 'zijBetaVariant';
  var V = ['a', 'b', 'c', 'orig'];
  var NAMES = { a: 'أ', b: 'ب', c: 'ج', orig: 'الأصل' };
  function get() { try { return localStorage.getItem(KEY) || 'a'; } catch (e) { return 'a'; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var css = document.createElement('style');
  css.id = 'zVarCss';
  /* المراجعة (٢٦ أكتوبر): نفس قواعد القياس في د/هـ/و — ٣ أحجام خط فقط (١٨ · ٢٩ · ٧٦)، الساعة الآن هي البطل،
     بلا تكرار (اليوم والتاريخان مرة واحدة)، والعدّاد أصغر من الساعة، وبلا صناديق زائدة. */
  css.textContent = [
    '#zVarBar{position:fixed;top:calc(30px + env(safe-area-inset-top,0px));left:8px;z-index:40;display:flex;gap:4px;background:rgba(17,20,29,.92);border:1px solid #c9a35d;border-radius:16px;padding:3px;font-family:Amiri,serif}',
    '#zVarBar button{border:0;background:none;color:#cfc4a4;font:700 14px Amiri,serif;padding:3px 9px;border-radius:12px;cursor:pointer}',
    '#zVarBar button.on{background:#c9a35d;color:#1a140a}',
    'body[data-scr]:not([data-scr="clock"]) #zVarBar,body[data-scr]:not([data-scr="clock"]) #zToday,body[data-scr]:not([data-scr="clock"]) #zTiles{display:none!important}',
    'body.zv-a,body.zv-b,body.zv-c{display:flex;flex-direction:column}',
    'body.zv-a>*,body.zv-b>*,body.zv-c>*{order:5}',
    'body.zv-a #hTop,body.zv-b #hTop,body.zv-c #hTop{order:1}',
    /* no duplicates: the top keeps only the city; the time and dates live once, in the today block */
    'body.zv-a #hTop #hClock,body.zv-b #hTop #hClock,body.zv-c #hTop #hClock,body.zv-a #hTop #hDate,body.zv-b #hTop #hDate,body.zv-c #hTop #hDate{display:none!important}',
    'body.zv-a #zToday,body.zv-b #zToday,body.zv-c #zToday{order:2}',
    'body.zv-a #zHeroWrap,body.zv-c #zHeroWrap{order:3}',
    'body.zv-a #hBottom,body.zv-c #hBottom{order:4}',
    'body.zv-a #zTiles{order:5}',
    'body.zv-b #hBottom{order:3}', 'body.zv-b #zTiles{order:4}', 'body.zv-b #zHeroWrap .hero{display:none!important}',
    'body.zv-c #zDial{order:6}',
    'body.zv-a:not(.zv-clock) #zDial,body.zv-b:not(.zv-clock) #zDial{display:none!important}',
    'body.zv-a.zv-clock #zDial,body.zv-b.zv-clock #zDial{order:9}',
    'body.zv-a .glance,body.zv-b .glance,body.zv-c .glance{display:none!important}',
    'body:not(.zv-a):not(.zv-b):not(.zv-c) #zToday,body:not(.zv-a):not(.zv-b) #zTiles{display:none!important}',
    'body.zv-c #zToday .mn{display:none}',
    /* the next prayer: one size down from the time (29), countdown no longer the focal point */
    'body.zv-a #zHeroWrap .hero,body.zv-c #zHeroWrap .hero{background:none!important;border:0!important;box-shadow:none!important;padding:0!important}',
    'body.zv-a #zHeroWrap .hero .lbl,body.zv-c #zHeroWrap .hero .lbl{font-size:18px!important;color:#d8ccaa!important}',
    'body.zv-a #zHeroWrap .hero .cd,body.zv-c #zHeroWrap .hero .cd{font-size:29px!important;color:#f5e6b4!important}',
    'body.zv-a #zHeroWrap .hero .sub,body.zv-c #zHeroWrap .hero .sub{font-size:18px!important}',
    /* «الأيام البيض» and similar: a plain line, not a big box */
    'body.zv-a #hNote,body.zv-b #hNote,body.zv-c #hNote{background:none!important;border:0!important;box-shadow:none!important;padding:2px 0!important;font-size:18px!important;color:#d8ccaa!important;min-height:0!important}',
    /* the today block: day name (29) · the time now (76) · period · dates (18) · Ramadan · moon */
    '#zToday{max-width:560px;margin:6px auto 0;padding:0 16px;box-sizing:border-box;width:100%;font-family:Amiri,serif;direction:rtl}',
    '#zToday .c{display:flex;justify-content:space-between;align-items:center;gap:10px}',
    '#zToday .wd{font-size:29px;line-height:1.2;color:#f5e6b4;font-weight:700}',
    '#zToday .tm{font-family:"EB Garamond",serif;font-size:76px;line-height:1;color:#fbf4e2;font-weight:700;direction:ltr;unicode-bidi:isolate;display:inline-block;letter-spacing:-.5px}',
    '#zToday .pd{font-size:29px;color:#f5e6b4;margin-inline-start:10px}',
    '#zToday .dt{font-size:18px;color:#d8ccaa;line-height:1.5}',
    '#zToday .rm{font-size:18px;color:#e6c983}',
    '#zToday .mn{text-align:center;font-size:18px;color:#d8ccaa;min-width:70px}',
    '#zToday .mn svg{width:56px;height:56px;display:block;margin:0 auto 2px}',
    /* tiles: one compact row in the thumb zone */
    '#zTiles{max-width:560px;margin:14px auto 0;padding:0 12px;box-sizing:border-box;width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;font-family:Amiri,serif;direction:rtl}',
    '#zTiles button{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:1px solid rgba(201,163,93,.30);border-radius:16px;padding:10px 4px;color:#fbf4e2;font:400 18px Amiri,serif;cursor:pointer}',
    '#zTiles button small{display:none}',
    '#zTiles button svg{width:28px;height:28px;flex:none}',
    '#zTiles button.zij{border-color:#c9a35d;background:linear-gradient(180deg,#2a2416,#1a160d)}',
    /* b: vertical prayer list */
    'body.zv-b .prow{display:flex!important;flex-direction:column;gap:6px}',
    'body.zv-b .pc{display:grid!important;grid-template-columns:auto 1fr auto;align-items:center;text-align:start!important;padding:10px 16px!important;border-radius:14px!important;gap:12px}',
    'body.zv-b .pc .pri{margin:0!important;width:26px!important;height:26px!important}',
    'body.zv-b .pc .pn{font-size:18px!important}',
    'body.zv-b .pc .pt{font-size:29px!important}',
    'body.zv-b .pc.cur::after{content:var(--zcd,"");grid-column:1/-1;font:700 18px Amiri,serif;color:#b8eee2}',
    'body.zv-a #hBottom,body.zv-b #hBottom,body.zv-c #hBottom,body.zv-a #zHeroWrap,body.zv-b #zHeroWrap,body.zv-c #zHeroWrap{width:100%;max-width:560px;box-sizing:border-box;margin-left:auto;margin-right:auto;align-self:center}'
  ].join('\n');
  document.head.appendChild(css);

  function L(a) { return a; }
  function moonSvg(f, waxing) {
    // f = illuminated fraction 0..1
    if (f > 0.97) return '<svg viewBox="-24 -24 48 48"><circle r="20" fill="#e9e2cf"/></svg>';
    if (f < 0.03) return '<svg viewBox="-24 -24 48 48"><circle r="20" fill="#1d2030" stroke="#3a3f55"/></svg>';
    var r = 20, k = (1 - 2 * f) * r, sweep = waxing ? 1 : 0;
    return '<svg viewBox="-24 -24 48 48"><circle r="20" fill="#1d2030"/><path d="M0 -20 A20 20 0 0 ' + sweep + ' 0 20 A' + Math.abs(k) + ' 20 0 0 ' + (k > 0 ? sweep : 1 - sweep) + ' 0 -20z" fill="#e9e2cf"/></svg>';
  }
  function daysToRamadan() {
    try {
      var fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' });
      var d = new Date();
      for (var i = 0; i < 400; i++) {
        var p = fmt.formatToParts(d), m = 0, dd = 0;
        p.forEach(function (x) { if (x.type === 'month') m = +x.value; if (x.type === 'day') dd = +x.value; });
        if (m === 9) return i === 0 ? 0 : (dd === 1 ? i : -1);
        d = new Date(d.getTime() + 864e5);
      }
    } catch (e) {}
    return -1;
  }
  var AR = function (n) { return String(n).replace(/\d/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'[c]; }); };

  var dgt = function (n) { try { return localStorage.getItem('zijDigits') === 'en' ? String(n) : AR(n); } catch (e) { return AR(n); } };
  function moonSvg2(ph) {
    var R = 22, pct = Math.round(ph.illum * 100), dk = (typeof Ephemeris !== 'undefined' && Ephemeris.moonDarkPath) ? Ephemeris.moonDarkPath(R, ph.illum, ph.waxing) : null;
    return '<svg viewBox="-28 -28 56 56"><circle r="27" fill="#e9e2cf" opacity=".07"/><circle r="' + R + '" fill="#e9e2cf"/>' +
      (dk && pct < 99 ? '<path d="' + dk.d + '" fill="#0a0c12" fill-opacity=".92"' + (dk.flip ? ' transform="scale(-1,1)"' : '') + '/>' : '') +
      '<circle r="' + R + '" fill="none" stroke="#c9a35d" stroke-opacity=".5"/></svg>';
  }
  // the period word instead of ص/م (فجرًا · صباحًا · ظهرًا · عصرًا · مساءً · ليلًا), from the app's own six times
  function period() {
    var cells = document.querySelectorAll('#hRow .pc .pt'), d = new Date(), now = d.getHours() * 60 + d.getMinutes();
    var M = [].map.call(cells, function (c, i) { var t = String(c.textContent).replace(/[٠-٩]/g, function (x) { return x.charCodeAt(0) - 1632; }).match(/(\d{1,2}):(\d{2})/);
      if (!t) return null; var h = +t[1], m = +t[2]; if (i >= 2 && h < 12) h += 12; if (i < 2 && h === 12) h = 0; return h * 60 + m; });
    if (M.length < 6 || M.some(function (x) { return x == null; })) return '';
    if (now < M[0]) return 'ليلًا'; if (now < M[1]) return 'فجرًا'; if (now < M[2]) return 'صباحًا'; if (now < M[3]) return 'ظهرًا';
    if (now < M[4]) return 'عصرًا'; if (now < M[5]) return 'مساءً'; return 'ليلًا';
  }
  function build() {
    if (document.getElementById('zToday')) return;
    var t = document.createElement('section'); t.id = 'zToday'; t.innerHTML = '<div class="c"><div><div class="wd" id="zWd">—</div><div><span class="tm" id="zTm">—</span><span class="pd" id="zPd"></span></div><div class="dt"><div id="zHj">—</div><div id="zGr">—</div></div><div class="rm" id="zRm"></div></div><div class="mn" id="zMn"></div></div>';
    var g = document.createElement('section'); g.id = 'zTiles';
    var dial = '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#0f1424" stroke="#c9a35d" stroke-width="2.5"/><circle cx="30" cy="30" r="20" fill="none" stroke="#7c5f30" stroke-dasharray="1.5 3"/><path id="zMiniH" d="M30 30V18" stroke="#eddba0" stroke-width="3" stroke-linecap="round"/><path id="zMiniM" d="M30 30V11" stroke="#eddba0" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="30" r="2.5" fill="#c9a35d"/></svg>';
    var I = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="#e6c983" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
    g.innerHTML =
      '<button type="button" data-z="qibla">' + I('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5-4.8 2 2.2-5z"/>') + '<span>القبلة</span></button>' +
      '<button type="button" data-z="cal">' + I('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>') + '<span>التقويم</span></button>' +
      '<button type="button" data-z="alerts">' + I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>') + '<span>التنبيهات</span></button>' +
      '<button type="button" data-z="zij" class="zij">' + dial + '<span>الزيج</span></button>';
    var hb = document.getElementById('hBottom');
    (hb && hb.parentNode ? hb.parentNode : document.body).insertBefore(t, hb ? hb.nextSibling : null);
    t.parentNode.insertBefore(g, t.nextSibling);
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var z = b.dataset.z, tab = function (s) { var x = document.querySelector('[data-go="' + s + '"]'); if (x) x.click(); };
      if (z === 'qibla') tab('qibla');
      else if (z === 'cal') { if (window.zijCalendar && window.zijCalendar.open) window.zijCalendar.open(); }
      else if (z === 'alerts') { tab('prayer'); setTimeout(function () { var a = document.getElementById('pAlert'); if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 250); }
      else if (z === 'zij') { document.body.classList.toggle('zv-clock'); var w = document.getElementById('zDial'); if (w && document.body.classList.contains('zv-clock')) setTimeout(function () { w.scrollIntoView({ behavior: 'smooth' }); }, 60); }
    });
  }

  function tick() {
    var v = get(); if (v !== 'a' && v !== 'b' && v !== 'c') return;
    var $ = function (i) { return document.getElementById(i); };
    var wd = $('hWd'), hj = $('hHijri'), gr = $('hGreg');
    if ($('zWd') && wd) $('zWd').textContent = wd.textContent || '—';
    if ($('zHj') && hj) $('zHj').textContent = hj.textContent || '—';
    if ($('zGr') && gr) $('zGr').textContent = gr.textContent || '—';
    try { var ht = $('hTime'); if ($('zTm') && ht) { var raw = String(ht.textContent || '').replace(/[٠-٩]/g, function (x) { return x.charCodeAt(0) - 1632; }).match(/(\d{1,2}):(\d{2})/);
        if (raw) $('zTm').textContent = dgt(+raw[1]) + ':' + dgt(raw[2]); }
      if ($('zPd')) $('zPd').textContent = period(); } catch (e) {}
    var n = daysToRamadan();
    if ($('zRm')) $('zRm').textContent = n > 0 ? 'رمضان بعد ' + AR(n) + ' يومًا' : (n === 0 ? 'رمضان كريم' : '');
    try {
      if ($('zMn') && typeof Ephemeris !== 'undefined' && Ephemeris.moonPhase) {
        var ph = Ephemeris.moonPhase(new Date());
        var f = ph.illum != null ? ph.illum : 0.5;
        if (f > 1) f = f / 100;
        var waxing = ph.waxing != null ? ph.waxing : (ph.age != null ? ph.age < 14.77 : true);
        $('zMn').innerHTML = moonSvg2(ph) + 'القمر<br>' + dgt(Math.round(f * 100)) + '٪';
      } else if ($('zMn')) { var mt = $('glMoonTxt'); $('zMn').textContent = mt ? mt.textContent : ''; }
    } catch (e) {}
    try { var d = new Date(), h = d.getHours() % 12 + d.getMinutes() / 60, m = d.getMinutes();
      $('zMiniH') && $('zMiniH').setAttribute('transform', 'rotate(' + (h * 30) + ' 30 30)');
      $('zMiniM') && $('zMiniM').setAttribute('transform', 'rotate(' + (m * 6) + ' 30 30)'); } catch (e) {}
    if (v === 'b') { var cur = document.querySelector('#hRow .pc.cur'), hw = $('zHeroWrap'), txt = '';
      if (hw) { var ln = (hw.textContent || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean); txt = ln.slice(0, 2).join(' '); }
      if (!txt) { var cd = $('hCd'), lb = $('hLbl'); txt = (lb ? lb.textContent : '') + ' ' + (cd ? cd.textContent : ''); }
      var row = $('hRow'); if (row) row.style.setProperty('--zcd', JSON.stringify(txt)); }
  }

  function apply(v) {
    V.forEach(function (x) { document.body.classList.remove('zv-' + x); });
    document.body.classList.remove('zv-clock');
    if (v !== 'orig') document.body.classList.add('zv-' + v);
    var bar = document.getElementById('zVarBar');
    if (bar) bar.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
    window.scrollTo(0, 0); tick();
  }

  function init() {
    build();
    var bar = document.createElement('div'); bar.id = 'zVarBar'; bar.setAttribute('data-notr', '');
    bar.innerHTML = V.map(function (v) { return '<button type="button" data-v="' + v + '">' + NAMES[v] + '</button>'; }).join('');
    bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; set(b.dataset.v); apply(b.dataset.v); });
    document.body.appendChild(bar);
    apply(get());
    setInterval(tick, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 300); });
  else setTimeout(init, 300);
})();
