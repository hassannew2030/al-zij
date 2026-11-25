/* نسخة التجربة فقط — أشكال الرئيسية بدون الساعة في الأعلى (الساعة لا تُمس: تُنقل أو تُخفى وتُفتح بزر «الزيج»).
   أ «اليوم»: الصلاة القادمة ← شريط الصلوات ← كرت اليوم ← أزرار سريعة
   ب «القائمة»: كرت اليوم ← الصلوات عمودية كبيرة ← أزرار سريعة
   ج «الساعة تحت»: الصلاة القادمة والصلوات أولًا، والساعة كما هي تحتها
   الأصل: الشكل الحالي */
(function () {
  /* 13 Nov (Hassan: «كل العمل على الرئيسي فقط»): runs on the main site too; the choice is made in المزيد ← شكل الصفحة الرئيسية */
  var KEY = 'zijBetaVariant2';
  var V = ['a', 'b', 'c', 'k', 'l', 'h', 'orig'];   // h «ساعة ٢٤» (Hassan 22 Nov): the original page with the 24-hour clock (dial24.js)
  var NAMES = { a: 'أ', b: 'ب', c: 'ج', k: 'س', l: 'س٢', h: '٢٤', orig: 'الأصل' };
  /* «الساعة والقمر» (k), Hassan 22 Nov: the entry screen with only the time, the date, the Moon and the dial — no lists, no cards.
     «l» is the same screen without the one line for the next prayer. Both are body.zv-k; l adds body.zv-l. */
  var KV = function (v) { return v === 'k' || v === 'l'; };
  function get() { try { return localStorage.getItem(KEY) || 'orig'; } catch (e) { return 'orig'; } } // nobody's home changes unless they choose
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
    'body:not(.zv-a):not(.zv-b):not(.zv-c):not(.zv-k) #zToday,body:not(.zv-a):not(.zv-b) #zTiles{display:none!important}',
    'body.zv-c #zToday .mn{display:none}',   /* Hassan 19 Nov: the Moon is off the home screen (it is in السماء) */
    'body.zv-b #zTiles{grid-template-columns:1fr}','body.zv-b #zTiles button:not(.zij){display:none}','body.zv-b #zTiles button{flex-direction:row;justify-content:center;gap:10px;padding:10px;font-size:20px}','body.zv-b #zTiles button svg{width:30px;height:30px}',
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
    '#zToday .tw{direction:ltr;unicode-bidi:isolate;display:inline-block;white-space:nowrap}',
    '#zToday .sc{font-family:"EB Garamond",serif;font-size:30px;color:#d8ccaa;direction:ltr;unicode-bidi:isolate;display:inline-block;margin-left:2px;font-variant-numeric:tabular-nums}',
    '#zToday .pd{font-size:29px;color:#f5e6b4;margin-inline-start:10px}',
    '#zToday .dt{font-size:18px;color:#d8ccaa;line-height:1.5}',
    '#zToday .rm{font-size:18px;color:#e6c983;display:inline-block;margin-top:7px}   /* room for the tanween of «يومًا» under the date line (Hassan 23 Nov) */',
    '#zToday .mn{text-align:center;font-size:18px;color:#d8ccaa;min-width:70px}',
    '#zToday .mn svg{width:56px;height:56px;display:block;margin:0 auto 2px}',
    '#zToday .mn{cursor:pointer;line-height:1.35;max-width:120px}','#zToday .mn img{width:76px;height:76px;display:block;margin:0 auto 4px;border-radius:50%}',
    '#zToday .mn .nm{color:#f5e6b4;font-size:17px}','#zToday .mn .ev{font-size:16px;color:#d8ccaa}',
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
    'body.zv-b .pc.cur::after{content:var(--zcd,"");grid-column:1/-1;font:700 18px Amiri,serif;color:#e6c983}',
    'body.zv-a #hBottom,body.zv-b #hBottom,body.zv-c #hBottom,body.zv-a #zHeroWrap,body.zv-b #zHeroWrap,body.zv-c #zHeroWrap{width:100%;max-width:560px;box-sizing:border-box;margin-left:auto;margin-right:auto;align-self:center}'
  ].join('\n');
  /* «الساعة والقمر» (k/l) — the whole entry screen on one page: the time, the date, the Moon and the dial, nothing else.
     The page is a grid whose rows are the pieces of #zToday (display:contents), the next-prayer line and the dial; the dial's row
     takes whatever height is left, so the dial grows on a tall phone and shrinks on an SE without anything scrolling or being cut. */
  var KS = 'body.zv-k:not([data-scr]),body.zv-k[data-scr="clock"]';
  var ks = function (sfx) { return KS.split(',').map(function (x) { return x + sfx; }).join(','); };
  css.textContent += '\n' + [
    '#zNx{display:none}', '#zToday .hj2,#zToday .gr2,#zToday .wp,#zToday .ap{display:none}',
    'body.zv-k #zHeroWrap,body.zv-k #hBottom,body.zv-k #zTiles,body.zv-k #zdLen,body.zv-k>noscript,body.zv-k #zd24Sw{display:none!important}',
    'body.zv-k{--k-ink:#fbf4e2;--k-gold:#f5e6b4;--k-dim:#d8ccaa;--k-brass:#c9a35d;--k-teal:#e6c983;--k-line:rgba(201,163,93,.28)}',
    'body.zv-k.zk-night{--k-ink:#f0cf94;--k-gold:#e6c287;--k-dim:#cdb185;--k-brass:#a8813f;--k-teal:#cdb185;--k-line:rgba(168,129,63,.26);background:#030406!important}',
    'html:has(body.zv-k.zk-night){background:#030406!important}',
    'body.zv-k.zk-night .htab{background:rgba(3,4,6,.95)}',
    KS + '{display:grid!important;grid-template-columns:minmax(0,1fr) auto;align-content:stretch;height:100vh;height:100svh;box-sizing:border-box;overflow:hidden;' +
      'padding:calc(14px + env(safe-area-inset-top,0px)) max(16px,calc(50vw - 270px)) calc(96px + env(safe-area-inset-bottom,0px))!important;margin:0}',
    ks(' #zToday') + ',' + ks(' #zToday .c') + ',' + ks(' #zToday .l') + '{display:contents}',
    ks(' #zToday>*') + '{font-family:Amiri,serif}',
    'body.zv-k #zToday .wd{grid-area:wd;font-size:22px;line-height:1.3;color:var(--k-gold);font-weight:700}',
    'body.zv-k #zToday .tr{grid-area:tr;display:flex;align-items:baseline;gap:0 10px;flex-wrap:wrap;line-height:1}',
    'body.zv-k #zToday .tm{color:var(--k-ink);font-size:84px;letter-spacing:0;font-family:"EB Garamond",Amiri,serif;font-weight:400}',
    'body.zv-k #zToday .sc{font-size:28px;color:var(--k-dim);margin-inline-start:4px}',
    /* the seconds hang outside the hours and minutes, so «١٠:٠٠» itself stands on the centre line */
    'body.zv-k[data-kc=C] #zToday .tw{position:relative}', 'body.zv-k[data-kc=C] #zToday .sc{position:absolute;left:100%;bottom:.18em;margin-left:6px}',
    /* English: AM/PM hangs under the seconds, like a watch's small window; the period word of Arabic is in «الأحد صباحًا» */
    'body.zv-k[data-kc=C] #zToday .pd{display:none}',
    'html[data-lang=en] body.zv-k[data-kc=C] #zToday .ap{display:block;position:absolute;left:100%;top:.2em;margin-left:6px;font-size:24px;color:var(--k-gold);font-family:"EB Garamond",serif;line-height:1}',
    'html[data-lang=en] body.zv-k[data-kc=C] #zToday .sc{bottom:.12em}',
    'body.zv-k #zToday .pd{font-size:26px;color:var(--k-gold);margin:0}',
    'body.zv-k #zToday .dt{grid-area:dt;font-size:18px;line-height:1.45;color:var(--k-dim)}',
    'body.zv-k #zToday .dt #zHj{color:var(--k-ink)}',
    'body.zv-k #zToday .rm{grid-area:rm;font-size:17px;line-height:1.4;color:var(--k-brass)}',
    'body.zv-k #zToday .rm:empty{display:none}',
    'body.zv-k #zToday .mn{grid-area:mn;max-width:none;min-width:0;font-size:16px;line-height:1.35;color:var(--k-dim);align-self:start}',
    'body.zv-k #zToday .mn img,body.zv-k #zToday .mn svg{width:72px;height:72px;margin:0 auto 6px;border-radius:50%;box-shadow:0 0 0 1px rgba(201,163,93,.18),0 0 28px rgba(233,226,207,.10)}',
    'body.zv-k #zToday .mn .nm{color:var(--k-gold);font-size:17px}', 'body.zv-k #zToday .mn .pp{display:none}', 'body.zv-k #zToday .mn .ev{font-size:16px;color:var(--k-dim)}',
    'body.zv-k #zNx{grid-area:nx;font:400 19px/1.4 Amiri,serif;color:var(--k-teal);cursor:pointer;min-height:1.4em}',
    'html[data-lang=en] body.zv-k #zNx,html[data-lang=en] body.zv-k #zToday>*{font-family:"EB Garamond",Amiri,serif}',
    ks(' #zNx') + '{display:block}', 'body.zv-k[data-scr]:not([data-scr="clock"]) #zDial{display:none!important}',   /* the dial belongs to this page only, as in «القائمة» */ 'body.zv-k.zv-l #zNx{display:none!important}',
    'body.zv-k #zDial{grid-area:dial;width:min(calc(100vw - 8px),600px)!important;justify-self:center;max-width:none;height:100%;min-height:0;margin:0!important;align-self:stretch;cursor:pointer}',
    'body.zv-k #zDial svg{width:100%;height:100%}',
    /* ---- A «الزيج أولًا»: a slim header (day and dates, the Moon), the dial as the hero, the time under it like a watch's window */
    'body.zv-k[data-kc=A]{grid-template-areas:"wd mn" "dt mn" "rm mn" ". ." "dial dial" "tr tr" "nx nx" ". .";grid-template-rows:auto auto auto minmax(0,1fr) minmax(0,calc(min(100vw - 8px,600px) * .93)) auto auto minmax(0,1fr)}',
    'body.zv-k[data-kc=A] #zToday .dt div{white-space:nowrap}', 'body.zv-k[data-kc=A] #zToday .mn{flex-direction:column;gap:2px!important;text-align:center!important}', 'body.zv-k[data-kc=A] #zToday .mn img,body.zv-k[data-kc=A] #zToday .mn svg{order:0!important}',
    'body.zv-k[data-kc=A] #zToday .mn{display:flex;align-items:center;gap:10px;text-align:start}',
    'body.zv-k[data-kc=A] #zToday .mn img,body.zv-k[data-kc=A] #zToday .mn svg{width:58px;height:58px;margin:0;order:2}',
    'body.zv-k[data-kc=A] #zToday .tr{justify-content:center;margin-top:4px}', 'body.zv-k[data-kc=A] #zToday .tm{font-size:64px}',
    'body.zv-k[data-kc=A] #zNx{text-align:center}',
    /* ---- B «الوقت أولًا»: the time as the hero with the day over it, the Moon in the corner, then the dial */
    'body.zv-k[data-kc=B]{grid-template-areas:"wd mn" "tr mn" "dt mn" "rm rm" "nx nx" ". ." "dial dial";grid-template-rows:auto auto auto auto auto minmax(0,1fr) minmax(0,calc(min(100vw - 8px,600px) * .93))}',
    '@media (max-height:740px){body.zv-k[data-kc=B] #zToday .tm{font-size:60px}body.zv-k[data-kc=B] #zToday .mn img,body.zv-k[data-kc=B] #zToday .mn svg{width:60px;height:60px}body.zv-k[data-kc=B] #zToday .mn .ev{display:none}body.zv-k[data-kc=B] #zToday .dt{font-size:16px}}',
    'body.zv-k[data-kc=B] #zToday .mn{text-align:center;padding-top:6px}', 'body.zv-k[data-kc=B] #zToday .mn img,body.zv-k[data-kc=B] #zToday .mn svg{width:88px;height:88px}',
    'body.zv-k[data-kc=B] #zToday .tm{font-size:80px}', 'body.zv-k[data-kc=B] #zToday .mn{width:104px}', 'body.zv-k[data-kc=B] #zNx{margin-top:6px}',
    /* ---- C «القمر بين التاريخين»: one axis — the time and «الأحد صباحًا» on top; the Hijri date | the Moon | the Gregorian date;
       the dial; the next prayer as the dial's caption */
    /* Hassan 23 Nov: from «الأصل» — the place (one small line on top) and the day's occasion («اليوم من الأيام البيض») */
    'body.zv-k #hTop{grid-area:loc;margin:0 auto!important;padding:0!important;display:flex;justify-content:center;background:none!important;border:0!important}',
    'body.zv-k #hTop>*:not(#hCity){display:none!important}',
    'body.zv-k #hCity{font-size:14px!important;padding:2px 12px!important;opacity:.85}',
    '#zNote{display:none}',
    'body.zv-k #zNote:not(:empty){display:block;grid-area:note;justify-self:center;margin:8px auto 0;padding:3px 14px;font:400 16px/1.4 Amiri,serif;color:var(--k-gold);border:1px solid var(--k-line);border-radius:14px;max-width:calc(100vw - 32px)}',
    'body.zv-k[data-kc=C]{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);grid-template-areas:"loc loc loc" "tr tr tr" "wp wp wp" ". . ." "hj mn gr" "rm rm rm" "note note note" ". . ." "dial dial dial" "nx nx nx";' +
      /* the dial's row is never taller than the dial itself (744 × 692); what is left over is shared by the two quiet gaps */
      'grid-template-rows:auto auto auto minmax(0,1fr) auto auto auto minmax(0,1fr) minmax(0,calc(min(100vw - 8px,600px) * .93)) auto;text-align:center}',
    'body.zv-k[data-kc=C] #zToday .wd{display:none}',
    'body.zv-k[data-kc=C] #zToday .wp{display:block;grid-area:wp;font-size:24px;line-height:1.3;color:var(--k-gold);font-weight:700;margin-top:2px}',
    'html:not([data-lang=en]) body.zv-k[data-kc=C] #zToday .pd{display:none}',
    'body.zv-k[data-kc=C] #zToday .dt{display:contents}', 'body.zv-k[data-kc=C] #zHj,body.zv-k[data-kc=C] #zGr{display:none}',
    'body.zv-k[data-kc=C] #zToday .hj2,body.zv-k[data-kc=C] #zToday .gr2{display:flex;flex-direction:column;justify-content:center;font-size:17px;line-height:1.35;color:var(--k-dim);padding-bottom:26px}',
    'body.zv-k[data-kc=C] #zToday .hj2{grid-area:hj;text-align:start}', 'body.zv-k[data-kc=C] #zToday .gr2{grid-area:gr;text-align:end}',
    'body.zv-k[data-kc=C] #zHjA,body.zv-k[data-kc=C] #zGrA{font-size:20px;color:var(--k-ink)}',
    'body.zv-k[data-kc=C] #zToday .mn{margin:var(--k-mt) 12px 0;text-align:center}',
    'body.zv-k[data-kc=C] #zToday .mn img,body.zv-k[data-kc=C] #zToday .mn svg{width:var(--k-mi);height:var(--k-mi)}',
    'body.zv-k[data-kc=C] #zToday .tr{justify-content:center}', 'body.zv-k[data-kc=C] #zToday .tm{font-size:88px}',
    'body.zv-k[data-kc=C] #zToday .rm{text-align:center;margin-top:6px}',
    /* the horizon: one hairline through the centre of the Moon, from the Hijri date to the Gregorian — each date's day and month
       stand on it, its year hangs under it, and the Moon sits on it between the two calendars */
    'body.zv-k[data-kc=C]{--k-mt:18px;--k-mi:80px}',
    'body.zv-k[data-kc=C] #zToday::before{content:"";grid-row:5;grid-column:1/-1;align-self:start;height:1px;margin-top:calc(var(--k-mt) + var(--k-mi) / 2);' +
      'background:linear-gradient(90deg,transparent,var(--k-line) 14%,var(--k-brass) 50%,var(--k-line) 86%,transparent);opacity:.75;pointer-events:none}',
    'body.zv-k[data-kc=C] #zToday .mn{position:relative;z-index:1}',
    /* two rows: the first ends exactly on the line (a long English month may take two lines — it grows upwards), the year under it */
    'body.zv-k[data-kc=C] #zToday .hj2,body.zv-k[data-kc=C] #zToday .gr2{display:grid!important;grid-template-columns:minmax(0,1fr);justify-content:stretch;grid-template-rows:calc(var(--k-mt) + var(--k-mi) / 2) auto;align-self:start;padding:0}',
    'body.zv-k[data-kc=C] #zHjA,body.zv-k[data-kc=C] #zGrA,body.zv-k[data-kc=C] #zHjB,body.zv-k[data-kc=C] #zGrB{justify-self:stretch}',
    'body.zv-k[data-kc=C] #zHjA,body.zv-k[data-kc=C] #zGrA{align-self:end;line-height:1.25;padding-bottom:6px}', 'body.zv-k[data-kc=C] #zHjB,body.zv-k[data-kc=C] #zGrB{align-self:start;padding-top:3px;line-height:1.35}',
    'body.zv-k[data-kc=C] #zNx{text-align:center;margin-bottom:4px}',
    /* a short phone (iPhone SE, 667 px): the same page, tighter — the dial keeps at least ~320 px so its words stay ≥ 15 px */
    '@media (max-height:740px){' +
      'body.zv-k[data-kc=C] #zToday .tm{font-size:62px}body.zv-k #zToday .sc{font-size:22px}' +
      'body.zv-k[data-kc=C] #zToday .wp{font-size:20px;margin-top:0}' +
      'body.zv-k[data-kc=C]{--k-mt:8px;--k-mi:56px}body.zv-k[data-kc=C] #zToday .mn img,body.zv-k[data-kc=C] #zToday .mn svg{margin-bottom:2px}' +
      'body.zv-k[data-kc=C] #zToday .mn .ev{display:none}body.zv-k[data-kc=C] #zToday .mn .nm{font-size:16px}' +
      'body.zv-k[data-kc=C] #zHjA,body.zv-k[data-kc=C] #zGrA{font-size:18px}body.zv-k[data-kc=C] #zToday .hj2,body.zv-k[data-kc=C] #zToday .gr2{font-size:16px}' +
      'body.zv-k[data-kc=C] #zToday .rm{font-size:16px;margin-top:2px}body.zv-k #zNx{font-size:17px}' +
      KS.split(',').join(',') + '{padding-top:calc(8px + env(safe-area-inset-top,0px))!important}}',
    /* one rule for the big digits: Arabic-Indic digits sit a little tighter so «١٠:٠٠» reads as one number */
    'html:not([data-lang=en]) body.zv-k #zToday .tm{letter-spacing:-1px}'
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
  // today's six times in minutes, read from the app's own prayer cells (nothing is calculated twice)
  function sixMin() {
    var cells = document.querySelectorAll('#hRow .pc .pt');
    var M = [].map.call(cells, function (c, i) { var t = String(c.textContent).replace(/[٠-٩]/g, function (x) { return x.charCodeAt(0) - 1632; }).match(/(\d{1,2}):(\d{2})/);
      if (!t) return null; var h = +t[1], m = +t[2]; if (i >= 2 && h < 12) h += 12; if (i < 2 && h === 12) h = 0; return h * 60 + m; });
    return M.length < 6 || M.some(function (x) { return x == null; }) ? null : M;
  }
  // the calm night palette: after Isha until Fajr — the same hours as the dial's own night colours
  function isNight() { var M = sixMin(), d = new Date(), now = d.getHours() * 60 + d.getMinutes(); return !!M && (now >= M[5] || now < M[0]); }
  function period() {
    if (window.ZIJ_LANG === 'en') return new Date().getHours() < 12 ? 'AM' : 'PM';   // the Arabic period words have no English twin
    var d = new Date(), now = d.getHours() * 60 + d.getMinutes(), M = sixMin();
    if (!M) return '';
    // Hassan 23 Nov: from 12:00:01 it is «صباحًا», not «ليلًا»
    if (now < M[0]) return 'صباحًا'; if (now < M[1]) return 'فجرًا'; if (now < M[2]) return 'صباحًا'; if (now < M[3]) return 'ظهرًا';
    if (now < M[4]) return 'عصرًا'; if (now < M[5]) return 'مساءً'; return 'ليلًا';
  }
  function build() {
    if (document.getElementById('zToday')) return;
    var t = document.createElement('section'); t.id = 'zToday'; t.innerHTML = '<div class="c"><div class="l"><div class="wd" id="zWd">—</div><div class="wp" id="zWp"></div><div class="tr"><span class="tw"><span class="tm" id="zTm">—</span><span class="sc" id="zSc"></span><span class="ap" id="zAp"></span></span><span class="pd" id="zPd"></span></div><div class="dt"><div id="zHj">—</div><div id="zGr">—</div><div class="hj2" id="zHj2"><span id="zHjA"></span><span id="zHjB"></span></div><div class="gr2" id="zGr2"><span id="zGrA"></span><span id="zGrB"></span></div></div><div class="rm" id="zRm"></div></div><div class="mn" id="zMn"></div></div>';
    var g = document.createElement('section'); g.id = 'zTiles';
    var dial = '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#0f1424" stroke="#c9a35d" stroke-width="2.5"/><circle cx="30" cy="30" r="20" fill="none" stroke="#7c5f30" stroke-dasharray="1.5 3"/><path id="zMiniH" d="M30 30V18" stroke="#eddba0" stroke-width="3" stroke-linecap="round"/><path id="zMiniM" d="M30 30V11" stroke="#eddba0" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="30" r="2.5" fill="#c9a35d"/></svg>';
    var I = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="#e6c983" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
    /* the four tiles of «اليوم»; «القائمة» (Hassan 19 Nov: every function has one place) shows only «الزيج» — see the CSS */
    g.innerHTML =
      '<button type="button" data-z="qibla">' + I('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5-4.8 2 2.2-5z"/>') + '<span>القبلة</span></button>' +
      '<button type="button" data-z="cal">' + I('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>') + '<span>التقويم</span></button>' +
      '<button type="button" data-z="alerts">' + I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>') + '<span>التنبيهات</span></button>' +
      '<button type="button" data-z="zij" class="zij">' + dial + '<span>الزيج</span></button>';
    var hb = document.getElementById('hBottom');
    (hb && hb.parentNode ? hb.parentNode : document.body).insertBefore(t, hb ? hb.nextSibling : null);
    t.parentNode.insertBefore(g, t.nextSibling);
    var nx = document.createElement('div'); nx.id = 'zNx'; nx.setAttribute('aria-live', 'off'); t.parentNode.insertBefore(nx, g.nextSibling);
    nx.addEventListener('click', function () { var x = document.querySelector('[data-go="prayer"]'); if (x) x.click(); });
    var mn = t.querySelector('.mn'); if (mn) { mn.setAttribute('role', 'button'); mn.addEventListener('click', function () { var x = document.querySelector('[data-go="sky"]'); if (x) x.click(); }); }
    var dt = t.querySelector('.dt'); if (dt) { dt.setAttribute('role', 'button'); dt.tabIndex = 0; dt.style.cursor = 'pointer';
      dt.addEventListener('click', function () { if (window.zijCalendar && window.zijCalendar.open) window.zijCalendar.open(); }); }
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var z = b.dataset.z, tab = function (s) { var x = document.querySelector('[data-go="' + s + '"]'); if (x) x.click(); };
      if (z === 'qibla') tab('qibla');
      else if (z === 'cal') { if (window.zijCalendar && window.zijCalendar.open) window.zijCalendar.open(); }
      else if (z === 'alerts') { tab('prayer'); setTimeout(function () { var a = document.getElementById('pAlert'); if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 250); }
      else if (z === 'zij') { document.body.classList.toggle('zv-clock'); var w = document.getElementById('zDial'); if (w && document.body.classList.contains('zv-clock')) setTimeout(function () { w.scrollIntoView({ behavior: 'smooth' }); }, 60); }
    });
  }

  /* Hassan 19 Nov 18:10 («خلّي القمر فيها + القمر من صورة ناسا، اسمه، وقته أو طوره، ورتّبها»): the moon picture is drawn by the Sky page
     (NASA map lit by the real Sun) — asked for once, kept for three hours; until then the simple drawn moon stands in. */
  var MK = 'zijMoonHome', moonAsked = false;
  /* stale: the picture of the last three hours may stand in while the new one is drawn (the Moon hardly changes in that time),
     so the page never falls back to the plain drawing at midnight or on the hour the cache turns over */
  function moonCache(stale) { try { var c = JSON.parse(localStorage.getItem(MK) || 'null'), o = window.observer || {}, b = Math.floor(Date.now() / 108e5);
      if (c && (c.b === b || (stale && b - c.b === 1)) && Math.abs(c.lat - o.lat) < .05 && Math.abs(c.lon - o.lon) < .05) return c; } catch (e) {} return null; }
  function askMoon() {
    if (moonAsked || !window.zijLoadMod) return; moonAsked = true;
    window.zijLoadMod('sky', function (w) { var n = 0; (function go() {
      var c = null; try { c = w.zijMoonCard && w.zijMoonCard(152); } catch (e) {}
      if (!c) { if (++n < 40) setTimeout(go, 500); else moonAsked = false; return; }
      c.b = Math.floor(Date.now() / 108e5); try { localStorage.setItem(MK, JSON.stringify(c)); } catch (e) {} moonAsked = false; lastMoon = ''; tick(); })(); });   // asked again when the three hours are up
  }
  var lastMoon = '';
  function moonHtml(ph, f) {
    var EN = window.ZIJ_LANG === 'en', c = moonCache(), pct = dgt(Math.round(f * 100)) + (EN ? '%' : '٪'), ev = '';
    if (!c) { setTimeout(askMoon, 1500); c = moonCache(true); }
    if (c && c.ev && c.ev.t > Date.now()) { var d = new Date(c.ev.t + ((window.observer && observer.tz) || 0) * 36e5), h = d.getUTCHours(), m = d.getUTCMinutes();
      ev = (c.ev.k === 'rise' ? (EN ? 'Rises ' : 'يشرق ') : (EN ? 'Sets ' : 'يغرب ')) + dgt(h % 12 || 12) + ':' + dgt(String(m).padStart(2, '0')) + ' ' + (EN ? (h < 12 ? 'AM' : 'PM') : (h < 12 ? 'ص' : 'م')); }
    var key = (c ? c.url.length + '|' + c.b : 'svg') + '|' + pct + '|' + ev + '|' + (EN ? 1 : 0);
    if (key === lastMoon) return null; lastMoon = key;
    return (c ? '<img alt="" src="' + c.url + '">' : moonSvg2(ph)) + '<div class="nm">' + (c ? c.name : (EN ? 'Moon' : 'القمر')) + '</div><div class="pp">' + pct + '</div>' + (ev ? '<div class="ev">' + ev + '</div>' : '');
  }
  // «ساعة و٢٠ دقيقة» — Arabic counting: 1 · 2 (dual) · 3–10 (plural) · 11+ (singular)
  function inWords(h, m) {
    if (window.ZIJ_LANG === 'en') return !h && !m ? 'less than a minute' : [h ? h + ' h' : '', m ? m + ' min' : ''].filter(Boolean).join(' ');
    var w = function (n, one, two, few) { return n === 1 ? one : n === 2 ? two : dgt(n) + ' ' + (n <= 10 ? few : one); };
    if (!h && !m) return 'أقل من دقيقة';
    var hs = h ? w(h, 'ساعة', 'ساعتين', 'ساعات') : '', ms = m ? w(m, 'دقيقة', 'دقيقتين', 'دقائق') : '';
    return hs && ms ? hs + ' و' + ms : hs || ms;
  }
  function tick() {
    var v = get();
    if (v === 'h' && !document.body.classList.contains('simple-view') && !document.fullscreenElement) document.body.classList.add('simple-view');   // «ساعة ٢٤» is a simple clock too
    if (v !== 'a' && v !== 'b' && v !== 'c' && !KV(v)) return;
    var $ = function (i) { return document.getElementById(i); };
    // Hassan 22 Nov (beta2 on his phone showed the grand Zij): this screen is built around the simple clock — always
    // show it here, whatever «الزيج الكبرى» was left on (not saved, so the other layouts keep the user's choice)
    // the day's occasion (from #hNote, which lives in the hidden hero) as one quiet line on this screen
    if (KV(v)) { var zt = $('zToday'), zn = $('zNote'); if (zt && !zn) { zn = document.createElement('div'); zn.id = 'zNote'; zt.appendChild(zn); }
      var hn = $('hNote'); if (zn) { var tx = hn && !hn.hidden ? (hn.textContent || '') : ''; if (zn.textContent !== tx) zn.textContent = tx; } }
    if (KV(v) && !document.body.classList.contains('simple-view') && !document.fullscreenElement) document.body.classList.add('simple-view');
    var wd = $('hWd'), hj = $('hHijri'), gr = $('hGreg');
    if ($('zWd') && wd) $('zWd').textContent = wd.textContent || '—';
    if ($('zHj') && hj) $('zHj').textContent = hj.textContent || '—';
    if ($('zGr') && gr) $('zGr').textContent = gr.textContent || '—';
    try { var ht = $('hTime'); if ($('zTm') && ht) { var raw = String(ht.textContent || '').replace(/[٠-٩]/g, function (x) { return x.charCodeAt(0) - 1632; }).match(/(\d{1,2}):(\d{2})/);
        if (raw) $('zTm').textContent = dgt(+raw[1]) + ':' + dgt(raw[2]); }
      if ($('zSc')) $('zSc').textContent = ':' + dgt(String(new Date().getSeconds()).padStart(2, '0'));   // Hassan 19 Nov: «ضيف الثواني للساعة»
      if ($('zPd')) $('zPd').textContent = period(); } catch (e) {}
    var n = daysToRamadan();
    if ($('zRm')) $('zRm').textContent = window.ZIJ_LANG === 'en' ? (n > 0 ? 'Ramadan in ' + n + (n === 1 ? ' day' : ' days') : (n === 0 ? 'Ramadan Kareem' : '')) : (n === 1 ? 'رمضان غدًا' : n > 0 ? 'رمضان بعد ' + (window.zijCount ? zijCount(n, ZIJ_CN.day, 'gen') : AR(n) + ' يومًا') : (n === 0 ? 'رمضان كريم' : ''));
    try {
      if ($('zMn') && typeof Ephemeris !== 'undefined' && Ephemeris.moonPhase) {
        var ph = Ephemeris.moonPhase(new Date());
        var f = ph.illum != null ? ph.illum : 0.5;
        if (f > 1) f = f / 100;
        var waxing = ph.waxing != null ? ph.waxing : (ph.age != null ? ph.age < 14.77 : true);
        var mh = moonHtml(ph, f); if (mh !== null) $('zMn').innerHTML = mh;
      } else if ($('zMn')) { var mt = $('glMoonTxt'); $('zMn').textContent = mt ? mt.textContent : ''; }
    } catch (e) {}
    try { var d = new Date(), h = d.getHours() % 12 + d.getMinutes() / 60, m = d.getMinutes();
      $('zMiniH') && $('zMiniH').setAttribute('transform', 'rotate(' + (h * 30) + ' 30 30)');
      $('zMiniM') && $('zMiniM').setAttribute('transform', 'rotate(' + (m * 6) + ' 30 30)'); } catch (e) {}
    if (v === 'b') { var row = $('hRow'); if (row) row.style.setProperty('--zcd', JSON.stringify(nextText())); }
    if (KV(v)) {
      document.body.classList.toggle('zk-night', isNight());
      var nx = $('zNx'), nt = nextText(true); if (nx && nx.textContent !== nt) nx.textContent = nt;
      // «الأحد صباحًا»: the day and the part of the day in one line (English keeps AM/PM beside the time)
      setTxt('zAp', window.ZIJ_LANG === 'en' ? period() : '');
      setTxt('zWp', window.ZIJ_LANG === 'en' ? ($('zWd') ? $('zWd').textContent : '') : (($('zWd') ? $('zWd').textContent : '') + ' ' + period()).trim());
      if ($('zHj')) { var hy = splitYear($('zHj').textContent); setTxt('zHjA', hy[0]); setTxt('zHjB', hy[1]); }
      if ($('zGr')) { var gy = splitYear($('zGr').textContent); setTxt('zGrA', gy[0]); setTxt('zGrB', gy[1]); }
    }
  }
  function setTxt(id, x) { var e = document.getElementById(id); if (e && e.textContent !== x) e.textContent = x; }
  // «١٢ جمادى الآخرة ١٤٤٨ هـ» → [«١٢ جمادى الآخرة», «١٤٤٨ هـ»] (the day and month on one line, the year under it)
  function splitYear(x) { x = String(x || '').replace(/-/g, '-\u2060');   // «al-Akhirah» never breaks after its hyphen
    var m = x.trim().match(/^(.*?)\s+([0-9٠-٩]{3,4}\s*(?:هـ|م|AH|CE|AD)?)$/); return m ? [m[1], m[2]] : [String(x || ''), '']; }
  // the next prayer in words, read from the hero card: «العصر بعد ساعتين و١٠ دقائق», or «حان الآن أذان العصر» in its first minutes
  function nextText(short) {
    var $ = function (i) { return document.getElementById(i); }, hw = $('zHeroWrap'), txt = '';
    // in the minutes after the adhan, one short line: «حان الآن أذان العصر» (its time is on the dial)
    if (short) { var hh = $('hHero'), cd0 = $('hCd'); if (hh && hh.classList.contains('now') && cd0 && cd0.textContent.trim()) return cd0.textContent.trim(); }
    if (hw) { var ln = (hw.textContent || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean); txt = ln.slice(0, 2).join(' '); }
    if (!txt) { var cd = $('hCd'), lb = $('hLbl'); txt = (lb ? lb.textContent : '') + ' ' + (cd ? cd.textContent : ''); }
    // Hassan 19 Nov 18:31 («اكتبه بعد»): «العشاء بعد ٥٧ دقيقة», not «٥٧:٠١» that reads like a clock time
    try { var lb2 = $('hLbl'), cd2 = $('hCd'), raw2 = String(cd2 ? cd2.textContent : '').replace(/[٠-٩]/g, function (x) { return x.charCodeAt(0) - 1632; });
      if (lb2 && lb2.textContent && /^\d+(:\d{2}){1,2}$/.test(raw2.trim())) { var pp = raw2.trim().split(':').map(Number), HH = pp.length === 3 ? pp[0] : 0, MM = pp.length === 3 ? pp[1] : pp[0];
        txt = lb2.textContent.trim() + ' ' + inWords(HH, MM); } } catch (e) {}
    return txt.trim();
  }

  function apply(v) {
    V.forEach(function (x) { document.body.classList.remove('zv-' + x); });
    document.body.classList.remove('zv-clock', 'zk-night');
    if (v === 'l') document.body.classList.add('zv-k');
    if (v !== 'orig') document.body.classList.add('zv-' + v);
    try { document.body.dataset.kc = localStorage.getItem('zijKComp') || 'C'; } catch (e) {}   // the composition being tried (design branch only)
    var bar = document.getElementById('zVarBar');
    if (bar) bar.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
    window.scrollTo(0, 0); tick();
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}   // the dial places its words again for the new size
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
