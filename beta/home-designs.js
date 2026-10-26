/* نسخة التجربة فقط — ثلاث رئيسيات أصلية مبنية على المسطرة والحساب (docs/home-design-study.md)
   د «الساعة أولًا»: الوقت الآن هو البطل (٧٦px) عند خط القطع الذهبي، ثم الصلاة القادمة بالكلمات، ثم اليوم.
   هـ «الأفق»: اليوم كله مسار الشمس تحت مؤشر أحمر ثابت عند «الآن»؛ الصلوات الست على المسار نفسه.
   و «الجملة»: المعلومة كما يقولها إنسان: «الساعة الآن ٣:٤٢ عصرًا · المغرب بعد ساعتين و٨ دقائق».
   والثلاثة تهدأ تلقائيًا بعد العشاء حتى الفجر (لوحة ليلية خافتة).
   لا تحسب شيئًا: تقرأ كل ثانية النص الحي من عناصر الزيج (#hTime #hAp #hWd #hHijri #hGreg #hLbl #hCd #hSub #hRow #hNote)،
   فالمواقيت هي أرقام الزيج نفسها بالحرف. الساعة (#zDial) لا تُرسم من جديد: تُخفى، وتظهر فوق الصفحة بزر «الزيج».
   مقياس الخط ثلاثة أحجام فقط من النسبة الذهبية: ١٨ × φ⁰ ، ١٨ × φ ≈ ٢٩ ، ١٨ × φ³ ≈ ٧٦. */
(function () {
  if (!/\/beta\//.test(location.pathname)) return;
  var KEY = 'zijHomeDesign', SEEN = 'zijHomeDesignSeen';
  var MINE = ['d', 'e', 'f'];
  var OPTS = [['d', 'د'], ['e', 'هـ'], ['f', 'و'], ['a', 'أ'], ['b', 'ب'], ['c', 'ج'], ['orig', 'الأصل']];
  var TITLES = { d: ['الساعة أولًا', 'Time first'], e: ['كيرف الشمس', 'Sun curve'], f: ['الجملة', 'The sentence'] };
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  };
  var $ = function (id) { return document.getElementById(id); };
  var EN = function () { return window.ZIJ_LANG === 'en'; };
  var T = function (a, e) { return EN() ? e : a; };
  var AR = '٠١٢٣٤٥٦٧٨٩';
  var digitsEn = function () { return EN() || LS.get('zijDigits') === 'en'; };
  var dg = function (s) { s = String(s); return digitsEn() ? s : s.replace(/\d/g, function (d) { return AR[d]; }); };
  var norm = function (s) { return String(s || '').replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; }); };
  var two = function (n) { return (n < 10 ? '0' : '') + n; };
  var txt = function (id) { var e = $(id); return e ? (e.textContent || '').trim() : ''; };

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.id = 'zhdCss';
  css.textContent = [
    /* one switcher: the old A/B/C bar is driven from here (hidden), so its choices keep working */
    '#zVarBar{display:none!important}',
    '#zhdBar{position:fixed;top:calc(24px + env(safe-area-inset-top,0px));left:8px;z-index:45;display:flex;align-items:center;gap:2px;background:rgba(17,20,29,.94);border:1px solid #c9a35d;border-radius:16px;padding:2px;font-family:Amiri,serif;direction:rtl}',
    '#zhdBar button{border:0;background:none;color:#e6dcbd;font:700 15px/1.2 Amiri,serif;padding:3px 8px;border-radius:12px;cursor:pointer;min-width:28px}',
    '#zhdBar button.on{background:#c9a35d;color:#1a140a}',
    'html[data-lang=en] #zhdBar{left:auto;right:8px}',
    '#zhdBar:not(.open) button:not(.on):not(.tg){display:none}',
    '#zhdBar .tg{color:#c9a35d;padding:3px 6px}',
    'body[data-scr]:not([data-scr="clock"]) #zhdBar,body[data-scr]:not([data-scr="clock"]) #zhd,body[data-scr]:not([data-scr="clock"]) #zhdScrim{display:none!important}',
    /* when a new design is on: the old home blocks stay alive (they keep ticking) but are not shown */
    'body.zhd #hTop,body.zhd #hNote,body.zhd #zHeroWrap,body.zhd #hBottom,body.zhd #zToday,body.zhd #zTiles,body.zhd #zDial{display:none!important}',
    'body:not(.zhd) #zhd{display:none!important}',
    /* «الزيج» button: the clock appears over the page, unchanged; tap outside to return */
    '#zhdScrim{display:none}',
    'body.zhd.zhd-dial #zhdScrim{display:block;position:fixed;inset:0;z-index:68;background:rgba(3,4,8,.86);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}',
    'body.zhd.zhd-dial #zDial{display:block!important;position:fixed;z-index:69;left:50%;top:46%;transform:translate(-50%,-50%);margin:0}',
    '#zhdScrim .x{position:absolute;left:0;right:0;bottom:calc(104px + env(safe-area-inset-bottom,0px));text-align:center;font:400 18px Amiri,serif;color:#e6dcbd}',

    /* palette: day (default) and the calm night (after Isha until Fajr). All text ≥ 7:1 on its background. */
    '#zhd{--k-bg:#0a0c12;--k-ink:#fbf4e2;--k-gold:#f5e6b4;--k-dim:#d8ccaa;--k-past:#b9b09a;--k-brass:#c9a35d;--k-line:rgba(201,163,93,.30);--k-red:#e0796d;--k-sky:rgba(245,210,120,.20);--k-sun:#ffd25a}',
    'body.zhd-night,html:has(body.zhd-night){background:#030406!important}',
    'body.zhd-night #zhd{--k-bg:#030406;--k-ink:#f0cf94;--k-gold:#e6c287;--k-dim:#cdb185;--k-past:#b09872;--k-brass:#a8813f;--k-line:rgba(168,129,63,.28);--k-red:#b8594f;--k-sky:rgba(240,207,148,.07);--k-sun:#c89a4a}',
    'body.zhd-night .htab{opacity:.72}',
    '#zhd{box-sizing:border-box;width:100%;max-width:560px;margin:0 auto;padding:calc(26px + env(safe-area-inset-top,0px)) 16px 8px;font-family:Amiri,"Geeza Pro",serif;color:var(--k-ink);direction:rtl;display:flex;flex-direction:column;min-height:calc(100vh - 92px - env(safe-area-inset-bottom,0px));min-height:calc(100svh - 92px - env(safe-area-inset-bottom,0px));overflow:hidden}',
    'html[data-lang=en] #zhd{font-family:"EB Garamond",Georgia,Amiri,serif}',
    '#zhd *{box-sizing:border-box}',
    '#zhd button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}',
    /* the three sizes: s1 = 18px, s2 = 29px, s3 = 76px (18 × φ⁰, φ¹, φ³) */
    '#zhd .s1{font-size:18px;line-height:1.45}',
    '#zhd .s2{font-size:29px;line-height:1.25}',
    '#zhd .s3{font-size:76px;line-height:1;letter-spacing:-.5px}',
    '#zhd .n{font-variant-numeric:tabular-nums;unicode-bidi:isolate}',
    'html[data-digits=en] #zhd .n{font-family:"EB Garamond",Amiri,serif;font-variant-numeric:lining-nums tabular-nums}',
    '#zhd .b{font-weight:700}',
    /* top row: the place (tap = choose city). The beta switcher sits at the far left. */
    '#zhd .top{display:flex;align-items:center;justify-content:flex-start;min-height:34px}',
    '#zhd .city{display:inline-flex;align-items:center;gap:6px;color:var(--k-dim);max-width:62%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#zhd .city svg{width:18px;height:18px;flex:none}',
    /* actions: in the thumb arc, just above the tab bar */
    '#zhd .acts{display:flex;gap:8px;margin-top:auto;padding-top:14px}',
    '#zhd .acts button{flex:1;min-height:52px;border:1px solid var(--k-line);border-radius:16px;color:var(--k-gold);display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700}',
    '#zhd .acts button svg{width:24px;height:24px;flex:none}',
    '#zhd .acts .zij{border-color:var(--k-brass);background:linear-gradient(180deg,rgba(201,163,93,.16),rgba(201,163,93,.04))}',
    '#zhd .acts .dgt{flex:0 0 auto;padding:0 12px;font-family:Amiri,"EB Garamond",serif}',
    '#zhd .acts .dgt span{display:inline-flex;gap:6px;align-items:baseline;direction:rtl}',
    '#zhd .acts .dgt b{font-weight:400;color:var(--k-past)}',
    '#zhd .acts .dgt b.on{font-weight:700;color:var(--k-gold);border-bottom:2px solid var(--k-brass)}',
    '#zhd .acts .dgt i{font-style:normal;color:var(--k-line)}',
    'html[data-lang=en] #zhd .acts .dgt{display:none}',
    '#zhd .note{color:var(--k-dim);text-align:center;margin-top:10px;min-height:0}',
    '#zhd .note:empty{display:none}',
    '#zhd .sub:empty{display:none}',
    '#zhd .nowmsg{color:var(--k-gold)}',

    /* ===== د — الساعة أولًا ===== */
    '#zhd.d .day{margin-top:10px}',
    '#zhd.d .wd{color:var(--k-gold)}',
    '#zhd.d .hj{color:var(--k-ink)}',
    '#zhd.d .gr{color:var(--k-dim)}',
    '#zhd.d .g1{flex:1 1 0;min-height:8px;max-height:40px}',
    '#zhd.d .g2{flex:1.618 1 0;min-height:10px;max-height:64px}',
    '#zhd.d .clock{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}',
    '#zhd.d .clock .tm{color:var(--k-ink);font-weight:700}',
    '#zhd.d .clock .per{color:var(--k-gold)}',
    '#zhd.d .secs{height:3px;background:var(--k-line);border-radius:2px;margin-top:10px;overflow:hidden;width:100%}',
    '#zhd.d .secs i{display:block;height:100%;background:var(--k-brass);border-radius:2px;transition:width .9s linear;margin-inline-start:0}',
    '#zhd.d .next{margin-top:16px}',
    '#zhd.d .next .l{color:var(--k-gold)}',
    '#zhd.d .next .sub{color:var(--k-dim)}',
    '#zhd.d .tbl{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,auto);grid-auto-flow:column;column-gap:22px;row-gap:2px;margin-top:4px}',
    '#zhd.d .tbl .r{display:flex;align-items:baseline;gap:6px;padding:6px 8px 6px 0;border-inline-start:3px solid transparent;color:var(--k-ink)}',
    '#zhd.d .tbl .r .ld{flex:1;border-bottom:2px dotted var(--k-line);transform:translateY(-6px);min-width:8px}',
    '#zhd.d .tbl .r.past{color:var(--k-past)}',
    '#zhd.d .tbl .r.foc{border-inline-start-color:var(--k-brass);color:var(--k-gold);font-weight:700;padding-inline-start:8px;background:linear-gradient(90deg,transparent,rgba(201,163,93,.10))}',
    'html[data-lang=en] #zhd.d .tbl .r.foc{background:linear-gradient(270deg,transparent,rgba(201,163,93,.10))}',

    /* ===== هـ — الأفق ===== */
    '#zhd.e .day{text-align:center;margin-top:6px}',
    '#zhd.e .day .wd{color:var(--k-gold)}',
    '#zhd.e .day .gr{color:var(--k-dim)}',
    '#zhd.e .g1{flex:1 1 0;min-height:4px;max-height:28px}',
    '#zhd.e .clock{text-align:center;display:flex;justify-content:center;align-items:baseline;gap:10px}',
    '#zhd.e .clock .tm{font-weight:700}',
    '#zhd.e .clock .per{color:var(--k-gold)}',
    '#zhd.e .next{text-align:center;margin-top:6px}',
    '#zhd.e .next .l{color:var(--k-gold)}',
    '#zhd.e .next .sub{color:var(--k-dim)}',
    '#zhd.e .hz{margin-top:8px;position:relative}',
    '#zhd.e .hz svg{display:block;width:100%;overflow:visible}',
    '#zhd.e .hz text{font-family:Amiri,"EB Garamond",serif;font-size:18px}',
    'html[data-digits=en] #zhd.e .hz text.t{font-family:"EB Garamond",Amiri,serif}',

    /* ===== و — الجملة ===== */
    '#zhd.f{text-align:center}','#zhd.f .top{justify-content:center}','#zhd.f .day{margin-top:8px}','#zhd.f .wdl{color:var(--k-dim)}',
    '#zhd.f .day .wd{color:var(--k-gold)}',
    '#zhd.f .day .gr{color:var(--k-dim)}',
    '#zhd.f .g1{flex:1 1 0;min-height:6px;max-height:44px}',
    '#zhd.f .say{color:var(--k-dim)}',
    '#zhd.f .clock{display:flex;align-items:baseline;justify-content:center;gap:12px;flex-wrap:wrap}',
    '#zhd.f .clock .tm{font-weight:700}',
    '#zhd.f .clock .per{color:var(--k-gold)}',
    '#zhd.f .next{margin-top:14px}',
    '#zhd.f .next .l{color:var(--k-gold)}',
    '#zhd.f .next .sub{color:var(--k-dim)}',
    '#zhd.f .six{display:grid;grid-template-columns:repeat(6,1fr);margin-top:6px;text-align:center;border-top:1px solid var(--k-line);padding-top:10px}',
    '#zhd.f .six .c{padding:4px 0 6px;color:var(--k-ink);border-bottom:3px solid transparent}',
    '#zhd.f .six .c .nm{display:block;white-space:nowrap}',
    '#zhd.f .six .c.past{color:var(--k-past)}',
    '#zhd.f .six .c.foc{color:var(--k-gold);font-weight:700;border-bottom-color:var(--k-brass)}',
    '@media (max-width:380px){#zhd.f .six .c{font-size:17px}#zhd .s3{font-size:68px}}',
    '@media (prefers-reduced-motion:reduce){#zhd .secs i{transition:none}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- small icons ---------- */
  var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>';
  var DIAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="6.5" stroke-dasharray="1 2"/><path d="M12 12V7M12 12l3.5 2"/></svg>';
  var CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>';

  function actsHtml() {
    return '<div class="acts">' +
      '<button type="button" class="zij s1" data-a="zij">' + DIAL + '<span>' + T('الزيج', 'Al-Zij') + '</span></button>' +
      '<button type="button" class="s1" data-a="cal">' + CAL + '<span>' + T('التقويم', 'Calendar') + '</span></button>' +
      '<button type="button" class="dgt s1" data-a="dgt" data-nodigit aria-label="' + T('شكل الأرقام', 'Digits') + '"><span data-k="dgt"></span></button>' +
      '</div>';
  }
  function topHtml() { return '<div class="top"><button type="button" class="city s1" data-a="city">' + PIN + '<span data-k="city"></span></button></div>'; }
  function nextHtml() { return '<div class="next"><div class="l s2 b" data-k="lbl"></div><div class="sub s1" data-k="sub"></div></div>'; }

  var TPL = {
    d: function () {
      return topHtml() +
        '<div class="day"><div class="wd s2 b" data-k="wd"></div><div class="hj s1 b" data-k="hj"></div><div class="gr s1" data-k="gr"></div></div>' +
        '<div class="g1"></div>' +
        '<div class="clock" aria-live="off"><span class="tm s3 n" data-k="tm"></span><span class="per s2" data-k="per"></span></div>' +
        '<div class="secs" aria-hidden="true"><i data-k="secs"></i></div>' +
        nextHtml() +
        '<div class="g2"></div>' +
        '<div class="tbl s1" data-k="list"></div>' +
        '<div class="note s1" data-k="note"></div>' + actsHtml();
    },
    e: function () {
      return topHtml() +
        '<div class="day"><div class="s1"><span class="wd b" data-k="wd"></span> · <span data-k="hj"></span></div><div class="gr s1" data-k="gr"></div></div>' +
        '<div class="g1"></div>' +
        '<div class="clock"><span class="tm s3 n" data-k="tm"></span><span class="per s2" data-k="per"></span></div>' +
        nextHtml() +
        '<div class="hz" data-k="hz"></div>' +
        '<div class="note s1" data-k="note"></div>' + actsHtml();
    },
    f: function () {
      return topHtml() +
        '<div class="day"><div class="s2 b wdl">' + T('اليوم ', '') + '<span class="wd" data-k="wd"></span></div><div class="s1"><span data-k="hj"></span>' + T('، الموافق', ',') + '</div><div class="gr s1" data-k="gr"></div></div>' +
        '<div class="g1"></div>' +
        '<div class="say s1">' + T('الساعة الآن', 'The time now') + '</div>' +
        '<div class="clock"><span class="tm s3 n" data-k="tm"></span><span class="per s2" data-k="per"></span></div>' +
        nextHtml() +
        '<div class="g1"></div>' +
        '<div class="six s1" data-k="list"></div>' +
        '<div class="note s1" data-k="note"></div>' + actsHtml();
    }
  };

  /* ---------- reading the live page ---------- */
  function hm(s) { var m = norm(s).match(/(\d{1,2})\s*[:.]\s*(\d{2})/); return m ? [+m[1], +m[2]] : null; }
  function read() {
    var D = {};
    var t = norm(txt('hTime')).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    var ap = txt('hAp'), pm = /م|PM|pm/.test(ap);
    if (t) { D.h12 = +t[1]; D.mi = +t[2]; D.se = t[3] ? +t[3] : 0; D.H = (D.h12 % 12) + (pm ? 12 : 0); D.now = D.H * 60 + D.mi + D.se / 60; }
    D.ap = ap;
    var cells = Array.prototype.slice.call(document.querySelectorAll('#hRow .pc'));
    var prev = -1;
    D.pr = cells.map(function (c, i) {
      var pn = c.querySelector('.pn'), pt = c.querySelector('.pt'), x = hm(pt ? pt.textContent : ''), v = null;
      if (x) { v = (x[0] % 12) * 60 + x[1]; if (i > 0) { var k = 0; while (v < prev && k++ < 3) v += 720; } prev = v; }
      return { name: pn ? pn.textContent.trim() : '', time: pt ? norm(pt.textContent.trim()) : '', min: v,
        foc: c.classList.contains('cur'), minor: c.classList.contains('minor') };
    });
    D.wd = txt('hWd'); D.hj = txt('hHijri'); D.gr = txt('hGreg'); D.city = txt('hCityName');
    D.lbl = txt('hLbl'); D.cd = txt('hCd'); D.sub = txt('hSub');
    var hero = $('hHero'); D.nowState = !!(hero && hero.classList.contains('now'));
    var cm = norm(D.cd).match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    D.left = cm ? (+(cm[1] || 0)) * 3600 + (+cm[2]) * 60 + (+cm[3]) : null;
    var nt = $('hNote'); D.note = nt && !nt.hidden ? (nt.textContent || '').trim() : '';
    D.moon = txt('glMoonTxt');
    return D;
  }
  /* the part of the day, from the prayer times themselves (instead of ص/م, which clashes with «م» = ميلادي on the same screen) */
  function period(D) {
    if (EN()) return D.ap || '';
    var p = D.pr, n = D.now;
    if (!p || p.length < 6 || n == null || p.some(function (x) { return x.min == null; })) return D.ap === 'ص' ? 'صباحًا' : 'مساءً';
    if (n < p[0].min || n >= p[5].min) return 'ليلًا';
    if (n < p[1].min) return 'فجرًا';
    if (n < p[2].min) return 'صباحًا';
    if (n < p[3].min) return 'ظهرًا';
    if (n < p[4].min) return 'عصرًا';
    return 'مساءً';
  }
  function isNight(D) {
    var p = D.pr; if (!p || p.length < 6 || D.now == null || p[0].min == null || p[5].min == null) return false;
    return D.now >= p[5].min || D.now < p[0].min;
  }
  function arCount(n, one, two_, few, many) {
    if (n === 1) return one; if (n === 2) return two_;
    return dg(n) + ' ' + (n >= 3 && n <= 10 ? few : many);
  }
  /* «ساعتين و٨ دقائق» — a duration in words cannot be mistaken for a clock time (٢:٠٨ looks like a time of day) */
  function words(left) {
    if (left == null) return '';
    if (left < 600) { var m = Math.floor(left / 60), s = Math.floor(left % 60); return dg(m + ':' + two(s)); }
    var H = Math.floor(left / 3600), M = Math.floor(left % 3600 / 60);
    if (EN()) return (H ? H + ' h' : '') + (H && M ? ' ' : '') + (M ? M + ' min' : '');
    var a = H ? arCount(H, 'ساعة', 'ساعتين', 'ساعات', 'ساعة') : '', b = M ? arCount(M, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة') : '';
    return a && b ? a + ' و' + b : (a || b);
  }

  /* ---------- the horizon (design هـ) ---------- */
  var hzKey = '';
  function drawHorizon(box, D) {
    var p = D.pr; if (!box || !p || p.length < 6 || D.now == null || p.some(function (x) { return x.min == null; })) return;
    var W = Math.max(280, Math.round(box.clientWidth || 358)), night = document.body.classList.contains('zhd-night');
    var key = [W, Math.floor(D.now), p.map(function (x) { return x.min + x.name + x.foc; }).join(), digitsEn(), night].join('|');
    if (key === hzKey) return; hzKey = key;
    var rtl = !EN(), cx = W / 2, now = D.now;
    var noon = p[2].min, rise = p[1].min, set = p[4].min;
    var c0 = (Math.cos(2 * Math.PI * (rise - noon) / 1440) + Math.cos(2 * Math.PI * (set - noon) / 1440)) / 2;
    var rowH = 46, top = rowH + 26, yH = 176, kD = (yH - top) / (1 - c0), kN = 50 / (1 + c0), Hh = yH + 50 + 18 + rowH;
    var s = function (t) { return Math.cos(2 * Math.PI * (t - noon) / 1440); };
    var Y = function (t) { var v = s(t); return v >= c0 ? yH - kD * (v - c0) : yH + kN * (c0 - v); };
    var X = function (t) { var dx = (t - now) / 1440 * W; return rtl ? cx - dx : cx + dx; };
    var pts = [], i;
    for (i = 0; i <= 96; i++) { var tt = now - 720 + i * 15; pts.push(X(tt).toFixed(1) + ',' + Y(tt).toFixed(1)); }
    var curve = 'M' + pts.join('L');
    var C = { brass: night ? '#a8813f' : '#c9a35d', ink: night ? '#f0cf94' : '#fbf4e2', gold: night ? '#e6c287' : '#f5e6b4', past: night ? '#b09872' : '#b9b09a',
      red: night ? '#b8594f' : '#e0796d', sun: night ? '#c89a4a' : '#ffd25a', bg: night ? '#030406' : '#0a0c12' };
    var o = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" height="' + Hh + '" role="img" aria-label="' + T('مسار الشمس اليوم ومواقيت الصلاة', 'The Sun\'s path today and the prayer times') + '">' +
      '<defs><linearGradient id="zhdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.sun + '" stop-opacity="' + (night ? '.10' : '.26') + '"/><stop offset="1" stop-color="' + C.sun + '" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="zhdUp"><rect x="0" y="0" width="' + W + '" height="' + yH + '"/></clipPath>' +
      '<linearGradient id="zhdPast" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.bg + '" stop-opacity="' + (rtl ? '0' : '.55') + '"/><stop offset="1" stop-color="' + C.bg + '" stop-opacity="' + (rtl ? '.55' : '0') + '"/></linearGradient></defs>';
    // sky under the day arc, the horizon, the whole path (dim) and the day part (brass)
    o += '<path d="M' + pts[0].split(',')[0] + ',' + yH + 'L' + pts.join('L') + 'L' + pts[pts.length - 1].split(',')[0] + ',' + yH + 'Z" fill="url(#zhdSky)" clip-path="url(#zhdUp)"/>';
    o += '<line x1="0" x2="' + W + '" y1="' + yH + '" y2="' + yH + '" stroke="' + C.brass + '" stroke-opacity=".55" stroke-width="1"/>';
    o += '<path d="' + curve + '" fill="none" stroke="' + C.brass + '" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="3 4"/>';
    o += '<path d="' + curve + '" fill="none" stroke="' + C.brass + '" stroke-width="2.5" clip-path="url(#zhdUp)"/>';
    // the past half is shaded: the future is where the eye should go (left in Arabic, right in English)
    o += '<rect x="' + (rtl ? cx : 0) + '" y="0" width="' + cx + '" height="' + Hh + '" fill="url(#zhdPast)"/>';
    // the fixed red index at «now» (Hassan's rule for the prayer ring: the day moves, the pointer stays)
    o += '<line x1="' + cx + '" x2="' + cx + '" y1="0" y2="' + Hh + '" stroke="' + C.red + '" stroke-width="1.6"/>';
    o += '<path d="M' + (cx - 7) + ',' + (rowH + 2) + 'L' + (cx + 7) + ',' + (rowH + 2) + 'L' + cx + ',' + (rowH + 11) + 'Z" fill="' + C.red + '"/>';
    // the six prayers: a dot on the path at the instance within ±12 h of now, and a label in one of two rows
    // (day prayers above the arc, night-side prayers below), pushed apart so they never overlap, with a thin leader to the dot
    var lab = p.map(function (x, j) {
      var t = x.min; while (t < now - 720) t += 1440; while (t >= now + 720) t -= 1440;
      return { j: j, x: X(t), y: Y(t), t: t, name: x.name, time: dg(x.time), foc: x.foc, past: t < now && !x.foc, top: j >= 1 && j <= 3,
        w: Math.max(x.name.length, x.time.length) * 9.5 + 12 };
    });
    [true, false].forEach(function (top) {
      var row = lab.filter(function (L) { return L.top === top; }).sort(function (u, v) { return u.x - v.x; }), k;
      row.forEach(function (L) { L.c = Math.min(W - L.w / 2, Math.max(L.w / 2, L.x)); });
      for (k = 1; k < row.length; k++) { var need = (row[k].w + row[k - 1].w) / 2 + 6; if (row[k].c - row[k - 1].c < need) row[k].c = row[k - 1].c + need; }
      if (row.length && row[row.length - 1].c > W - row[row.length - 1].w / 2) {
        row[row.length - 1].c = W - row[row.length - 1].w / 2;
        for (k = row.length - 2; k >= 0; k--) { var nd = (row[k].w + row[k + 1].w) / 2 + 6; if (row[k + 1].c - row[k].c < nd) row[k].c = row[k + 1].c - nd; }
      }
    });
    // keep every name off the red «now» line: labels move to the side their dot is on, then spread outwards
    [true, false].forEach(function (top) {
      var row = lab.filter(function (L) { return L.top === top; }), gap = 13;
      row.forEach(function (L) { var half = L.w / 2 + gap, side = (L.x < cx || (L.x === cx && rtl)) ? -1 : 1;
        if (Math.abs(L.c - cx) < half) L.c = cx + side * half; });
      // a side too crowded to fit: the oldest past names give way (their dots stay on the curve)
      var fit = function (arr, room) { var need = function () { return arr.filter(function (L) { return !L.hide; }).reduce(function (a, L) { return a + L.w + 6; }, gap); };
        var past = arr.filter(function (L) { return L.past; }).sort(function (u, v) { return u.t - v.t; });
        while (need() > room && past.length) past.shift().hide = true; };
      fit(row.filter(function (L) { return L.c < cx; }), cx); fit(row.filter(function (L) { return L.c >= cx; }), W - cx);
      var left = row.filter(function (L) { return L.c < cx && !L.hide; }).sort(function (u, v) { return v.c - u.c; });
      var right = row.filter(function (L) { return L.c >= cx && !L.hide; }).sort(function (u, v) { return u.c - v.c; }), k;
      for (k = 1; k < left.length; k++) { var nl = (left[k].w + left[k - 1].w) / 2 + 6; if (left[k - 1].c - left[k].c < nl) left[k].c = left[k - 1].c - nl; }
      for (k = 1; k < right.length; k++) { var nr = (right[k].w + right[k - 1].w) / 2 + 6; if (right[k].c - right[k - 1].c < nr) right[k].c = right[k - 1].c + nr; }
      // if a side runs past the screen edge, pack it back from the edge inwards (labels never overlap each other)
      if (left.length && left[left.length - 1].c < left[left.length - 1].w / 2) {
        left[left.length - 1].c = left[left.length - 1].w / 2;
        for (k = left.length - 2; k >= 0; k--) { var bl = (left[k].w + left[k + 1].w) / 2 + 6; if (left[k].c - left[k + 1].c < bl) left[k].c = left[k + 1].c + bl; }
      }
      if (right.length && right[right.length - 1].c > W - right[right.length - 1].w / 2) {
        right[right.length - 1].c = W - right[right.length - 1].w / 2;
        for (k = right.length - 2; k >= 0; k--) { var br = (right[k].w + right[k + 1].w) / 2 + 6; if (right[k + 1].c - right[k].c < br) right[k].c = right[k + 1].c - br; }
      }
    });
    lab.forEach(function (L) {
      var col = L.foc ? C.gold : (L.past ? C.past : C.ink), fw = L.foc ? ' font-weight="700"' : '';
      var ly = L.top ? rowH : Hh - rowH, halo = ' stroke="' + C.bg + '" stroke-width="5" paint-order="stroke" stroke-linejoin="round"';
      if (!L.hide) o += '<line x1="' + L.x.toFixed(1) + '" y1="' + L.y.toFixed(1) + '" x2="' + L.c.toFixed(1) + '" y2="' + ly + '" stroke="' + col + '" stroke-opacity=".45" stroke-width="1"/>';
      o += '<circle cx="' + L.x.toFixed(1) + '" cy="' + L.y.toFixed(1) + '" r="' + (L.foc ? 6.5 : 4) + '" fill="' + col + '"' + (L.foc ? ' stroke="' + C.bg + '" stroke-width="2"' : '') + '/>';
      if (L.foc) o += '<circle cx="' + L.x.toFixed(1) + '" cy="' + L.y.toFixed(1) + '" r="11" fill="none" stroke="' + C.gold + '" stroke-width="1.2"/>';
      var y1 = L.top ? 0 : Hh - rowH;
      if (L.hide) return;
      o += '<text x="' + L.c.toFixed(1) + '" y="' + (y1 + 18) + '" text-anchor="middle" fill="' + col + '"' + fw + halo + '>' + esc(L.name) + '</text>';
      o += '<text class="t" x="' + L.c.toFixed(1) + '" y="' + (y1 + 39) + '" text-anchor="middle" fill="' + col + '"' + fw + halo + '>' + esc(L.time) + '</text>';
    });
    // the Moon with its real phase, in the empty sky on the side away from the upper labels (tap → Sky ▸ Moon)
    try {
      if (typeof Ephemeris !== 'undefined' && Ephemeris.moonPhase) {
        var ph = Ephemeris.moonPhase(new Date()), R = 24, my = top + 34;
        var tops = lab.filter(function (L) { return L.top; }).map(function (L) { return L.c; });
        // choose the spot: far from the upper labels and clear of the Sun's path and the red «now» line
        var tAt = function (x) { return now + (rtl ? (cx - x) : (x - cx)) / W * 1440; };
        var cand = [], f;
        for (f = 0.12; f <= 0.885; f += 0.0375) {
          var x = W * f, dl = tops.length ? Math.min.apply(null, tops.map(function (c) { return Math.abs(c - x); })) : 999;
          var clear = 999, k2; for (k2 = -R - 10; k2 <= R + 10; k2 += 4) { clear = Math.min(clear, Math.abs(Y(tAt(x + k2)) - my)); }
          var hitNow = Math.abs(x - cx) < R + 14;
          cand.push({ x: x, sc: (clear > R + 8 ? 1000 : clear * 10) + Math.min(dl, 200) - (hitNow ? 5000 : 0) });
        }
        cand.sort(function (a, b) { return b.sc - a.sc; });
        var mx = Math.max(R + 6, Math.min(W - R - 6, cand[0].x));
        var dk = Ephemeris.moonDarkPath(R, ph.illum, ph.waxing);
        var pct = Math.round(ph.illum * 100), nm = (Ephemeris.PHASE_NAMES && Ephemeris.PHASE_NAMES[ph.idx]) || '';
        o += '<g class="zmoon" style="cursor:pointer" transform="translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ')">' +
          '<circle r="' + (R + 9) + '" fill="#e9e2cf" opacity="' + (night ? '.05' : '.07') + '"/>' +
          '<circle r="' + R + '" fill="#e9e2cf"/>' +
          (pct >= 99 ? '' : '<path d="' + dk.d + '" fill="' + C.bg + '" fill-opacity=".92"' + (dk.flip ? ' transform="scale(-1,1)"' : '') + '/>') +
          '<circle r="' + R + '" fill="none" stroke="' + C.brass + '" stroke-opacity=".5" stroke-width="1"/>' +
          '<text y="' + (R + 22) + '" text-anchor="middle" fill="' + C.ink + '" stroke="' + C.bg + '" stroke-width="5" paint-order="stroke">' + esc(T('القمر', 'Moon') + (nm && !EN() ? ' · ' + nm : '')) + '</text>' +
          '<text class="t" y="' + (R + 42) + '" text-anchor="middle" fill="' + C.past + '" stroke="' + C.bg + '" stroke-width="5" paint-order="stroke">' + esc(dg(pct) + '٪') + '</text>' +
          '</g>';
      }
    } catch (e) {}
    // the Sun on the index (a hollow ring when it is below the horizon)
    var ys = Y(now), up = ys <= yH;
    if (up) o += '<circle cx="' + cx + '" cy="' + ys.toFixed(1) + '" r="16" fill="' + C.sun + '" opacity=".22"/><circle cx="' + cx + '" cy="' + ys.toFixed(1) + '" r="8.5" fill="' + C.sun + '"/>';
    else o += '<circle cx="' + cx + '" cy="' + ys.toFixed(1) + '" r="7.5" fill="' + C.bg + '" stroke="' + C.sun + '" stroke-width="2"/>';
    o += '</svg>';
    box.innerHTML = o;
    var mg = box.querySelector('.zmoon'); if (mg) mg.addEventListener('click', function () { var t = document.querySelector('[data-go="sky"]'); if (t) t.click(); });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- render ---------- */
  var root = null, cur = null, listKey = '';
  function setK(k, v) { if (!root) return; var e = root.querySelector('[data-k="' + k + '"]'); if (e && e.textContent !== v) e.textContent = v; }
  function build(v) {
    if (!root) {
      root = document.createElement('section'); root.id = 'zhd'; root.setAttribute('data-notr', '');
      root.setAttribute('aria-label', T('الرئيسية', 'Home'));
      var anchor = $('hTop');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(root, anchor); else document.body.prepend(root);
      root.addEventListener('click', onAct);
    }
    root.className = v; root.innerHTML = TPL[v](); listKey = ''; hzKey = '';
    update();
  }
  function update() {
    if (!root || MINE.indexOf(cur) < 0) return;
    var D = read();
    var night = isNight(D);
    document.body.classList.toggle('zhd-night', night);
    setK('city', D.city);
    setK('wd', D.wd); setK('hj', D.hj); setK('gr', D.gr);
    if (D.H != null) setK('tm', dg((D.h12 || 12) + ':' + two(D.mi)));
    setK('per', period(D));
    var si = root.querySelector('[data-k="secs"]'); if (si && D.se != null) si.style.width = (D.se / 59 * 100).toFixed(1) + '%';
    if (D.nowState || D.left == null) { setK('lbl', D.cd); }
    else { setK('lbl', (cur === 'f' && !EN() && D.lbl ? 'و' : '') + (D.lbl ? D.lbl + ' ' : '') + words(D.left)); }
    // «كيرف الشمس»: the adhan time and the Moon are already drawn on the curve, so they are not repeated in text
    setK('sub', cur === 'e' ? '' : (EN() ? D.sub : D.sub.replace(/\s+[صم]$/, ''))); // the prayer name already says which half of the day
    var note = cur === 'e' ? D.note : [D.note, D.moon && !/—/.test(D.moon) && D.note.indexOf(D.moon) < 0 ? T('القمر: ', 'Moon: ') + D.moon : ''].filter(Boolean).join(' · ');
    setK('note', note);
    var dt = root.querySelector('[data-k="dgt"]'); if (dt) { var en = digitsEn(); if (dt.dataset.m !== String(en)) { dt.dataset.m = String(en); dt.innerHTML = '<b class="' + (en ? '' : 'on') + '">١٢٣</b><i>|</i><b class="' + (en ? 'on' : '') + '">123</b>'; } }
    var lb = root.querySelector('.next .l'); if (lb) lb.classList.toggle('nowmsg', D.nowState);
    // the prayer list (d, f) — rebuilt only when something changes
    var L = root.querySelector('[data-k="list"]');
    if (L && D.pr.length) {
      var k = [cur, Math.floor(D.now || 0), digitsEn(), D.pr.map(function (x) { return x.name + x.time + x.foc; }).join()].join('|');
      if (k !== listKey) {
        listKey = k;
        L.innerHTML = D.pr.map(function (x) {
          var past = D.now != null && x.min != null && x.min <= D.now && !x.foc; // after Isha only tomorrow's Fajr is ahead
          var cls = (x.foc ? ' foc' : '') + (past ? ' past' : '');
          if (cur === 'd') return '<div class="r' + cls + '"><span>' + esc(x.name) + '</span><span class="ld"></span><span class="n">' + esc(dg(x.time)) + '</span></div>';
          return '<div class="c' + cls + '"><span class="nm">' + esc(x.name) + '</span><span class="n">' + esc(dg(x.time)) + '</span></div>';
        }).join('');
      }
    }
    if (cur === 'e') drawHorizon(root.querySelector('[data-k="hz"]'), D);
  }

  /* ---------- actions ---------- */
  function setDigits(m) {
    LS.set('zijDigits', m);
    var ws = [window]; ['mod-qibla', 'mod-sky'].forEach(function (id) { var f = $(id); if (f && f.contentWindow) ws.push(f.contentWindow); });
    ws.forEach(function (w) { try { w.zijDigitsApply && w.zijDigitsApply(); } catch (e) {} });
    document.querySelectorAll('[data-dg]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.dg === m); }); // keep المزيد ← العرض in step
    listKey = ''; hzKey = ''; update();
  }
  function onAct(e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'zij') { document.body.classList.add('zhd-dial'); }
    else if (a === 'cal') { try { window.zijCalendar && window.zijCalendar.open && window.zijCalendar.open(); } catch (x) {} }
    else if (a === 'dgt') { setDigits(digitsEn() ? 'ar' : 'en'); }
    else if (a === 'city') { var c = $('hCity'); if (c) c.click(); }
  }

  /* ---------- the one switcher ---------- */
  var bar = null;
  function paintBar() {
    if (!bar) return;
    var on = MINE.indexOf(cur) >= 0 ? cur : (LS.get('zijBetaVariant') || 'a');
    bar.querySelectorAll('button[data-v]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === on); });
  }
  function choose(v) {
    var old = $('zVarBar');
    if (MINE.indexOf(v) >= 0) {
      LS.set(KEY, v);
      var ob = old && old.querySelector('button[data-v="orig"]'); if (ob) ob.click(); else LS.set('zijBetaVariant', 'orig');
      cur = v; document.body.classList.add('zhd'); document.body.classList.remove('zhd-dial'); build(v);
    } else {
      LS.set(KEY, 'off');
      cur = null; document.body.classList.remove('zhd', 'zhd-night', 'zhd-dial');
      var vb = old && old.querySelector('button[data-v="' + v + '"]'); if (vb) vb.click(); else LS.set('zijBetaVariant', v);
    }
    paintBar(); window.scrollTo(0, 0);
  }
  function init() {
    if (!$('zVarBar') && init.n++ < 10) { setTimeout(init, 200); return; } // let variants.js build its bar first
    bar = document.createElement('div'); bar.id = 'zhdBar'; bar.setAttribute('data-notr', ''); bar.setAttribute('data-nodigit', '');
    bar.innerHTML = OPTS.map(function (o) { return '<button type="button" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '<button type="button" class="tg" aria-label="تصاميم الرئيسية">▾</button>';
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('tg') || (b.classList.contains('on') && !bar.classList.contains('open'))) { bar.classList.toggle('open'); return; }
      bar.classList.remove('open'); choose(b.dataset.v);
    });
    document.body.appendChild(bar);
    var scrim = document.createElement('div'); scrim.id = 'zhdScrim'; scrim.innerHTML = '<div class="x">' + T('المس أي مكان للرجوع', 'Tap anywhere to go back') + '</div>';
    scrim.addEventListener('click', function () { document.body.classList.remove('zhd-dial'); });
    document.body.appendChild(scrim);
    // leaving home closes the clock view
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.htab')) document.body.classList.remove('zhd-dial'); }, true);
    var saved = LS.get(KEY);
    if (!saved && !LS.get(SEEN)) { saved = 'd'; LS.set(SEEN, '1'); } // first visit after this build: show the new design once
    if (MINE.indexOf(saved) >= 0) choose(saved); else paintBar();
    setInterval(update, 500);
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { hzKey = ''; update(); }, 150); });
  }
  init.n = 0;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 360); });
  else setTimeout(init, 360);
})();
