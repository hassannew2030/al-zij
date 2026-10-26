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
  css.textContent = [
    '#zVarBar{position:fixed;top:calc(30px + env(safe-area-inset-top,0px));left:8px;z-index:9998;display:flex;gap:4px;background:rgba(17,20,29,.92);border:1px solid #c9a35d;border-radius:16px;padding:3px;font-family:Amiri,serif}',
    '#zVarBar button{border:0;background:none;color:#cfc4a4;font:700 14px Amiri,serif;padding:3px 9px;border-radius:12px;cursor:pointer}',
    '#zVarBar button.on{background:#c9a35d;color:#1a140a}',
    'body[data-scr]:not([data-scr="clock"]) #zToday,body[data-scr]:not([data-scr="clock"]) #zTiles{display:none!important}',
    /* shared: reorder home blocks with flex order (fixed elements are unaffected) */
    'body.zv-a,body.zv-b,body.zv-c{display:flex;flex-direction:column}',
    'body.zv-a>*,body.zv-b>*,body.zv-c>*{order:5}',
    'body.zv-a #hTop,body.zv-b #hTop,body.zv-c #hTop{order:1}',
    'body.zv-a #hNote,body.zv-b #hNote,body.zv-c #hNote{order:2}',
    'body.zv-a #zHeroWrap,body.zv-c #zHeroWrap{order:3}',
    'body.zv-a #hBottom,body.zv-c #hBottom{order:4}',
    'body.zv-a #zToday,body.zv-a #zTiles{order:5}',
    'body.zv-b #zToday{order:3}', 'body.zv-b #hBottom{order:4}', 'body.zv-b #zTiles{order:5}', 'body.zv-b #zHeroWrap{display:none!important}',
    'body.zv-c #zDial{order:6}',
    'body.zv-a:not(.zv-clock) #zDial,body.zv-b:not(.zv-clock) #zDial{display:none!important}',
    'body.zv-a.zv-clock #zDial,body.zv-b.zv-clock #zDial{order:9}',
    'body.zv-a #hTop #hClock,body.zv-b #hTop #hClock{font-size:.62em}',
    'body.zv-b #hTop #hDate{display:none}',
    'body.zv-a .glance,body.zv-b .glance{display:none!important}',
    'body:not(.zv-a):not(.zv-b) #zTiles,body:not(.zv-a):not(.zv-b) #zToday{display:none!important}',
    /* today card */
    '#zToday{max-width:560px;margin:10px auto 0;padding:0 12px;box-sizing:border-box;width:100%;font-family:Amiri,serif;direction:rtl}',
    '#zToday .c{background:var(--h-panel,#11141d);border:1px solid var(--h-line,rgba(201,163,93,.28));border-radius:18px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px}',
    '#zToday .wd{font-size:34px;line-height:1.1;color:var(--h-brass-l,#eddba0);font-weight:700}',
    '#zToday .hj{font-size:18px;color:var(--h-ink,#e8e0c8)}',
    '#zToday .gr{font-size:15px;color:var(--h-dim,#b9b09a)}',
    '#zToday .rm{font-size:15px;color:#e6c983;margin-top:4px}',
    '#zToday .mn{text-align:center;font-size:13px;color:var(--h-dim,#b9b09a);min-width:64px}',
    '#zToday .mn svg{width:48px;height:48px;display:block;margin:0 auto 2px}',
    /* tiles */
    '#zTiles{max-width:560px;margin:10px auto 0;padding:0 12px;box-sizing:border-box;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-family:Amiri,serif;direction:rtl}',
    '#zTiles button{display:flex;align-items:center;gap:10px;background:var(--h-panel,#11141d);border:1px solid var(--h-line,rgba(201,163,93,.28));border-radius:16px;padding:12px;color:var(--h-ink,#e8e0c8);font:700 17px Amiri,serif;text-align:start;cursor:pointer}',
    '#zTiles button small{display:block;font-weight:400;font-size:13px;color:var(--h-dim,#b9b09a)}',
    '#zTiles button svg{width:30px;height:30px;flex:none}',
    '#zTiles button.zij{border-color:#c9a35d;background:linear-gradient(180deg,#2a2416,#1a160d)}',
    /* b: vertical prayer list */
    'body.zv-b .prow{display:flex!important;flex-direction:column;gap:8px}',
    'body.zv-b .pc{display:grid!important;grid-template-columns:auto 1fr auto;align-items:center;text-align:start!important;padding:12px 16px!important;border-radius:16px!important;gap:12px}',
    'body.zv-b .pc .pri{margin:0!important;width:26px!important;height:26px!important}',
    'body.zv-b .pc .pn{font-size:20px!important}',
    'body.zv-b .pc .pt{font-size:24px!important}',
    'body.zv-b #hHero{display:none}',
    'body.zv-b .pc.cur::after{content:var(--zcd,"");grid-column:1/-1;font:700 17px Amiri,serif;color:#b8eee2}',
    'body.zv-a #hBottom,body.zv-b #hBottom,body.zv-c #hBottom,body.zv-a #zHeroWrap,body.zv-c #zHeroWrap{width:100%;max-width:560px;box-sizing:border-box;margin-left:auto;margin-right:auto;align-self:center}'
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

  function build() {
    if (document.getElementById('zToday')) return;
    var t = document.createElement('section'); t.id = 'zToday'; t.innerHTML = '<div class="c"><div><div class="wd" id="zWd">—</div><div class="hj" id="zHj">—</div><div class="gr" id="zGr">—</div><div class="rm" id="zRm"></div></div><div class="mn" id="zMn"></div></div>';
    var g = document.createElement('section'); g.id = 'zTiles';
    var dial = '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#0f1424" stroke="#c9a35d" stroke-width="2.5"/><circle cx="30" cy="30" r="20" fill="none" stroke="#7c5f30" stroke-dasharray="1.5 3"/><path id="zMiniH" d="M30 30V18" stroke="#eddba0" stroke-width="3" stroke-linecap="round"/><path id="zMiniM" d="M30 30V11" stroke="#eddba0" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="30" r="2.5" fill="#c9a35d"/></svg>';
    var I = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="#e6c983" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
    g.innerHTML =
      '<button type="button" data-z="qibla">' + I('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5-4.8 2 2.2-5z"/>') + '<span>القبلة<small id="zQb">اتجاهك الآن</small></span></button>' +
      '<button type="button" data-z="cal">' + I('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>') + '<span>التقويم<small>ومواقيت الشهر</small></span></button>' +
      '<button type="button" data-z="alerts">' + I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>') + '<span>التنبيهات<small>قبل الأذان والإقامة</small></span></button>' +
      '<button type="button" data-z="zij" class="zij">' + dial + '<span>الزيج<small>الساعة الفلكية</small></span></button>';
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
    var v = get(); if (v !== 'a' && v !== 'b') return;
    var $ = function (i) { return document.getElementById(i); };
    var wd = $('hWd'), hj = $('hHijri'), gr = $('hGreg');
    if ($('zWd') && wd) $('zWd').textContent = wd.textContent || '—';
    if ($('zHj') && hj) $('zHj').textContent = hj.textContent || '—';
    if ($('zGr') && gr) $('zGr').textContent = gr.textContent || '—';
    var n = daysToRamadan();
    if ($('zRm')) $('zRm').textContent = n > 0 ? 'رمضان بعد ' + AR(n) + ' يومًا' : (n === 0 ? 'رمضان كريم' : '');
    try {
      if ($('zMn') && typeof Ephemeris !== 'undefined' && Ephemeris.moonPhase) {
        var ph = Ephemeris.moonPhase(new Date());
        var f = ph.illum != null ? ph.illum : 0.5;
        if (f > 1) f = f / 100;
        var waxing = ph.waxing != null ? ph.waxing : (ph.age != null ? ph.age < 14.77 : true);
        $('zMn').innerHTML = moonSvg(f, waxing) + 'القمر ' + AR(Math.round(f * 100)) + '٪';
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
