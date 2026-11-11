/* ===== fable · the new shell: clocks on the stage, one scheduler, zoom, commands, keyboard, updates =====
   Beta's own shell (copied verbatim above) still owns the router, the location, the prayer list and the settings logic. */
(function(){
  const $=id=>document.getElementById(id), body=document.body, q=(s,r)=>(r||document).querySelector(s), qa=(s,r)=>[...(r||document).querySelectorAll(s)];
  const on=(el,ev,fn,o)=>{ if (el) el.addEventListener(ev,fn,o); };

  /* ---------- 1. the two clocks ---------- */
  FB.simple.mount($('fbSimple')); FB.grand.mount($('fbGrandPan'));
  const mode=()=>body.classList.contains('simple-view')?'simple':'full';
  function paintMode(){
    const m=mode();
    qa('#fbClockSeg [data-clock]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.clock===m));
    const d24=FB.simple.is24(); qa('#zd24Sw [data-h]').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.h==='24')===d24));
    const vb=$('viewModeBtn'); if (vb){ const t=m==='simple'?'🔭 الزيج الكبرى (كل الحلقات)':'🕰️ رجوع للساعة البسيطة'; if (vb.dataset.fbT!==t){ vb.dataset.fbT=t; vb.textContent=t; } }   // beta's two labels (dialJs 7220–7224)
  }
  function setMode(m){ body.classList.toggle('simple-view',m==='simple'); FB.set('zijViewMode',m); }
  body.classList.toggle('simple-view',FB.ls('zijViewMode','simple')!=='full');      // the simple clock first, unless the user chose the Grand Zij
  qa('#fbClockSeg [data-clock]').forEach(b=>on(b,'click',()=>setMode(b.dataset.clock)));
  qa('#zd24Sw [data-h]').forEach(b=>on(b,'click',()=>{ FB.set('zijDial24',b.dataset.h==='24'?'1':'0'); FB.simple.dirty(); paintMode(); FB.frame(true); }));

  /* ---------- 2. one frame, always from the clock ---------- */
  let lastPanel=0;
  FB.frame=function(force){
    const now=new Date(), scr=body.dataset.scr, kiosk=body.classList.contains('window-screen-mode');
    if (force||scr==='more'||now.getTime()-lastPanel>=5000){ lastPanel=now.getTime(); try{ renderer.updateDataPanel(now,hijriCal.fromGregorian(now)); }catch(e){ console.error('fable panel',e); } }
    try{ if (body.classList.contains('three-body-mode')) updateThreeBody(now); }catch(e){}
    try{ const alp=$('adhanLogPanel'); if (alp&&alp.style.display==='block') alTick(now); }catch(e){}
    if (document.hidden) return;
    if (scr==='clock'||kiosk) (mode()==='simple'?FB.simple:FB.grand).draw(now);
  };
  let timer=null;
  function loop(){ timer=null; if (document.hidden) return; FB.frame(false); timer=setTimeout(loop,1000-(Date.now()%1000)+12); }   // re-aimed at the next whole second every time: no drift, exact after sleep
  const start=()=>{ if (!timer&&!document.hidden) loop(); };
  document.addEventListener('visibilitychange',()=>{ if (document.hidden){ clearTimeout(timer); timer=null; } else start(); });
  addEventListener('pageshow',()=>{ clearTimeout(timer); timer=null; start(); });
  addEventListener('focus',()=>{ if (!document.hidden) FB.frame(false); });
  addEventListener('storage',()=>{ FB.simple.dirty(); FB.grand.dirty(); });
  FB.running=()=>!!timer;
  new MutationObserver(()=>{ paintMode(); FB.frame(false); syncHash(); }).observe(body,{attributes:true,attributeFilter:['class','data-scr']});
  function syncHash(){ const s=body.dataset.scr; try{ if (s&&location.hash.slice(1)!==s) history.replaceState(null,'','#'+s); }catch(e){} }

  /* ---------- 3. zoom and pan on the Grand Zij (wheel, pinch, drag, buttons, keys) ---------- */
  const pan=$('fbGrandPan'), gbox=$('fbGrand'); let z=1, px=0, py=0;
  function applyZoom(){ const lim=(z-1)*gbox.clientWidth/2; px=Math.max(-lim,Math.min(lim,px)); py=Math.max(-lim,Math.min(lim,py));
    pan.style.transform=z===1?'':`translate(${px.toFixed(1)}px,${py.toFixed(1)}px) scale(${z.toFixed(3)})`; gbox.classList.toggle('zoomed',z>1); }
  function zoomBy(k,cx,cy){ const nz=Math.max(1,Math.min(6,z*k)), r=gbox.getBoundingClientRect(), ox=(cx==null?r.width/2:cx-r.left)-r.width/2, oy=(cy==null?r.height/2:cy-r.top)-r.height/2;
    px=ox-(ox-px)*nz/z; py=oy-(oy-py)*nz/z; z=nz; if (z===1){ px=py=0; } applyZoom(); }
  FB.zoom={in:()=>zoomBy(1.35), out:()=>zoomBy(1/1.35), reset:()=>{ z=1; px=py=0; applyZoom(); }, level:()=>z};
  window.zoomIn=FB.zoom.in; window.zoomOut=FB.zoom.out; window.resetZoom=FB.zoom.reset;      // beta's three names keep working
  on($('fbZoomIn'),'click',FB.zoom.in); on($('fbZoomOut'),'click',FB.zoom.out); on($('fbZoomReset'),'click',FB.zoom.reset);
  on(gbox,'wheel',e=>{ e.preventDefault(); zoomBy(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY); },{passive:false});
  on(gbox,'dblclick',e=>{ if (z>1) FB.zoom.reset(); else zoomBy(2.2,e.clientX,e.clientY); });
  { const pts=new Map(); let d0=0, z0=1;
    on(gbox,'pointerdown',e=>{ if (e.target.closest('.fb-hit')) return; pts.set(e.pointerId,[e.clientX,e.clientY]); if (pts.size===2){ const [a,b]=[...pts.values()]; d0=Math.hypot(a[0]-b[0],a[1]-b[1]); z0=z; } });
    on(gbox,'pointermove',e=>{ const p=pts.get(e.pointerId); if (!p) return;
      if (pts.size===1&&z>1){ px+=e.clientX-p[0]; py+=e.clientY-p[1]; applyZoom(); }
      pts.set(e.pointerId,[e.clientX,e.clientY]);
      if (pts.size===2&&d0){ const [a,b]=[...pts.values()], d=Math.hypot(a[0]-b[0],a[1]-b[1]); zoomBy(z0*d/d0/z,(a[0]+b[0])/2,(a[1]+b[1])/2); } });
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>on(gbox,ev,e=>{ pts.delete(e.pointerId); d0=0; })); }
  addEventListener('resize',applyZoom);

  /* ---------- 4. the old-body controls that beta's shell leaves in place get a home here ---------- */
  const move=(el,to,first)=>{ if (el&&to){ first?to.prepend(el):to.appendChild(el); } return el; };
  move($('trueSkyBtn'),$('fbGrandTools')); move($('trueSkyStatus'),$('fbGrandFoot')); move($('skyLockStatus'),$('fbGrandFoot'));
  { const b=$('trueSkyBtn'); if (b){ b.type='button'; b.setAttribute('aria-pressed','false'); on(b,'click',()=>setTimeout(()=>{ b.setAttribute('aria-pressed',String(!!renderer.trueSkyMode));
      const st=$('trueSkyStatus'); if (st){ st.dataset.hold='1'; setTimeout(()=>{ delete st.dataset.hold; FB.grand.dirty(); },renderer.trueSkyMode?9000:0); } FB.grand.dirty(); FB.frame(false); },0)); } }
  move($('threeBodyBtn'),$('mBodies')); move($('threeBodyPanel'),$('mBodies'));
  move(q('#fbLegacy .philosophy'),$('mGuide'));
  { const g=$('glanceBtn'); if (g) g.hidden=true; }           // «نظرة أولى» is the day column itself now: always open beside the clock
  qa('#scr-more button:not([type]), #scr-prayer button:not([type]), #fbLegacy button:not([type])').forEach(b=>b.type='button');
  { const hb=q('#scr-more > button'), hd=q('#scr-more .fb-head'); if (hb&&hd) hd.appendChild(hb); }     // «عندي مشكلة» sits in the screen's header
  on($('hHijri'),'keydown',e=>{ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); e.currentTarget.click(); } });

  /* ---------- 5. المزيد: an index beside the sections ---------- */
  function buildMoreNav(){
    const nav=$('fbMoreNav'); if (!nav) return; nav.textContent='';
    qa('.fb-moreBody > .mGrp, .fb-moreBody > details > summary, #mInstallHost summary, #mInstallHost > button').forEach(el=>{
      if (el.classList.contains('mGrp')){ const h=document.createElement('div'); h.className='fb-navgrp'; h.textContent=el.textContent; nav.appendChild(h); return; }
      const b=document.createElement('button'); b.type='button'; b.textContent=el.textContent.trim();
      b.addEventListener('click',()=>{ const d=el.closest('details'); if (d) d.open=true; (d||el).scrollIntoView({behavior:FB.reduced()?'auto':'smooth',block:'start'}); (el.tagName==='SUMMARY'?el:el).focus({preventScroll:true}); if (el.tagName==='BUTTON') el.click(); });
      nav.appendChild(b); });
  }
  buildMoreNav(); setTimeout(buildMoreNav,2500);
  FB.openMore=function(id){ const t=q('.htab [data-go="more"]'); if (t) t.click(); const el=$(id), d=el&&el.closest('details'); if (d){ d.open=true; setTimeout(()=>{ d.scrollIntoView({block:'start'}); const s=q('summary',d); if (s) s.focus({preventScroll:true}); },30); } };

  /* ---------- 6. commands (Ctrl/⌘ K) ---------- */
  const go=s=>{ const t=q('.htab [data-go="'+s+'"]'); if (t) t.click(); };
  const sky=m=>{ if (window.zijGo) zijGo('sky',{mode:m}); else go('sky'); };
  const CMD=[
    ['افتح الساعة','clock home 1',()=>go('clock')],['افتح الصلاة','prayer times salah 2',()=>go('prayer')],['افتح القبلة','qibla compass 3',()=>go('qibla')],['افتح السماء','sky moon sun 4',()=>go('sky')],['افتح المزيد','more settings 5',()=>go('more')],
    ['اعرض الساعة البسيطة','simple clock dial',()=>{ go('clock'); setMode('simple'); }],['اعرض الزيج الكبرى (كل الحلقات)','grand zij astronomical full rings',()=>{ go('clock'); setMode('full'); }],
    ['قرص ١٢ ساعة','12 hour',()=>{ const b=q('#zd24Sw [data-h="12"]'); go('clock'); setMode('simple'); b.click(); }],['قرص ٢٤ ساعة','24 hour',()=>{ const b=q('#zd24Sw [data-h="24"]'); go('clock'); setMode('simple'); b.click(); }],
    ['شاشة العرض (ملء الشاشة)','fullscreen display window screen kiosk',()=>toggleWindowScreen()],
    ['التقويم الهجري والميلادي','calendar hijri gregorian reminders tasks',()=>{ go('prayer'); window.zijCalendar&&zijCalendar.open(); }],
    ['جدول مواقيت الشهر','timetable month table',()=>{ go('prayer'); window.zijCalendar&&zijCalendar.timetable('h'); }],
    ['معلومات الشهر الهجري','hijri month info',()=>{ go('clock'); window.zijMonthSheet&&zijMonthSheet(); }],
    ['القمر الآن','moon phase crescent',()=>sky('moon')],['الشمس اليوم','sun sunrise sunset',()=>sky('sun')],
    ['مواقيت مدن العالم','world cities times',()=>{ if (window.zijWorldOpen) zijWorldOpen(); else go('sky'); }],
    ['غيّر الموقع أو ابحث عن مدينة','location city gps place',()=>{ FB.openMore('mLoc'); const p=$('manualLocPanel'); if (p&&p.style.display==='none') toggleManualLocation(); setTimeout(()=>{ const i=$('manualLocSearchInput'); if (i) i.focus(); },120); }],
    ['غيّر طريقة الحساب','method calculation asr high latitude',()=>FB.openMore('mCalc')],
    ['تنبيهات الأذان','alerts adhan notification sound',()=>{ go('prayer'); const a=$('pAlert'); if (a) a.scrollIntoView({block:'center'}); }],
    ['سجل الأذان','adhan log record',()=>{ go('prayer'); const b=q('[data-pm="log"]'); if (b) b.click(); }],
    ['الخط والحجم واللون','font size colour tone type',()=>FB.openMore('mType')],
    ['اللغة: العربية','language arabic',()=>window.zijSetLang&&zijSetLang('ar')],['اللغة: English','language english',()=>window.zijSetLang&&zijSetLang('en')],
    ['الأرقام: ١٢٣','digits arabic indic',()=>{ const b=q('[data-dg="ar"]'); if (b) b.click(); }],['الأرقام: 123','digits latin',()=>{ const b=q('[data-dg="en"]'); if (b) b.click(); }],
    ['مكبّر التوربيون','tourbillon',()=>openTourbillonBox()],
    ['حقيقة السماء (على الزيج الكبرى)','true sky horizon crescent',()=>{ go('clock'); setMode('full'); const b=$('trueSkyBtn'); if (b) b.click(); }],
    ['الأجسام الثلاثة','three bodies earth sun moon map',()=>{ FB.openMore('mBodies'); if (!body.classList.contains('three-body-mode')) toggleThreeBody(); }],
    ['الميزان: تحقق من الأرقام','verify mizan check internet',()=>{ FB.openMore('mCheck'); verifyAgainstInternet(); }],
    ['كل الأرقام بالتفصيل','all numbers data panel weather',()=>FB.openMore('mData')],['دليل الساعة','guide legend',()=>FB.openMore('mGuide')],
    ['شارك الزيج','share',()=>shareClock()],['مساعدة','help',()=>{ if (window.zijHelp) zijHelp(); else FB.openMore('mGuide'); }],
    ['اختصارات لوحة المفاتيح','keyboard shortcuts',()=>openKeys()]
  ];
  const dlg=$('fbCmd'), inp=$('fbCmdIn'), list=$('fbCmdList'); let sel=0, shown=[];
  const fold=s=>String(s).toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
  CMD.forEach((c,i)=>{ const li=document.createElement('li'); li.setAttribute('role','option'); li.id='fbCmdO'+i; li.dataset.i=i; li.textContent=c[0]; list.appendChild(li);
    li.addEventListener('click',()=>run(i)); li.addEventListener('mousemove',()=>{ const k=shown.indexOf(i); if (k>=0&&k!==sel){ sel=k; paintCmd(); } }); });
  function filter(){ const v=fold(inp.value.trim()); shown=[];
    qa('li[data-i]',list).forEach(li=>{ const i=+li.dataset.i, hit=!v||fold(li.textContent+' '+CMD[i][0]+' '+CMD[i][1]).includes(v); li.hidden=!hit; if (hit) shown.push(i); });
    let none=$('fbCmdNone'); if (!none){ none=document.createElement('li'); none.id='fbCmdNone'; none.textContent='لا يوجد أمر بهذا الاسم'; list.appendChild(none); } none.hidden=shown.length>0;
    sel=0; paintCmd(); }
  function paintCmd(){ qa('li[data-i]',list).forEach(li=>{ const s=shown[sel]===+li.dataset.i; li.setAttribute('aria-selected',s); if (s){ inp.setAttribute('aria-activedescendant',li.id); li.scrollIntoView({block:'nearest'}); } }); }
  function run(i){ dlg.close(); setTimeout(()=>{ try{ CMD[i][2](); }catch(e){ console.error('fable command',e); } },0); }
  function openCmd(){ if (dlg.open) return; inp.value=''; dlg.showModal(); filter(); inp.focus(); }
  function openKeys(){ const d=$('fbKeys'); if (!d.open) d.showModal(); }
  on(inp,'input',filter);
  on(inp,'keydown',e=>{ if (e.key==='ArrowDown'){ e.preventDefault(); if (shown.length){ sel=(sel+1)%shown.length; paintCmd(); } }
    else if (e.key==='ArrowUp'){ e.preventDefault(); if (shown.length){ sel=(sel-1+shown.length)%shown.length; paintCmd(); } }
    else if (e.key==='Enter'){ e.preventDefault(); if (shown.length) run(shown[sel]); } });
  on($('fbCmdForm'),'submit',e=>e.preventDefault());
  [dlg,$('fbKeys')].forEach(d=>on(d,'click',e=>{ if (e.target===d) d.close(); }));          // a click on the backdrop closes
  on($('fbCmdBtn'),'click',openCmd); on($('fbHelpBtn'),'click',openKeys);
  inp.placeholder=FB.en()?'Type a command or a screen name…':'اكتب أمرًا أو اسم شاشة…';

  /* ---------- 7. keyboard ---------- */
  const SCR=['clock','prayer','qibla','sky','more'];
  function closeTop(){            // Esc closes whatever is open on top (beta's sheets and boxes have no key of their own)
    const tb=$('tourbillonBox'); if (tb&&tb.classList.contains('open')){ closeTourbillonBox(); return true; }
    const dl=$('diagLockBackdrop'); if (dl&&dl.classList.contains('open')){ try{ if (!diagLockState.locked) closeDiagLock(); }catch(e){ closeDiagLock(); } return true; }
    const tops=qa('body > *').filter(el=>!el.closest('#fbApp')&&el.id!=='fbLegacy'&&el.tagName!=='DIALOG'&&el.tagName!=='SCRIPT'&&el.tagName!=='STYLE'&&el.id!=='hToast'&&el.id!=='adhanBanner'&&el.id!=='zPermHint'&&el.id!=='zWelcome')
      .filter(el=>{ const cs=getComputedStyle(el); return cs.position==='fixed'&&cs.display!=='none'&&cs.visibility!=='hidden'&&el.offsetWidth>0; });
    const top=tops[tops.length-1]; if (!top) return false;
    const btn=qa('button,[role=button],a',top).find(b=>/^(✕|×|✖|✖️|x|إغلاق|أغلق|تم|رجوع|close|done|back)$/i.test((b.getAttribute('aria-label')||b.textContent||'').trim()));
    if (btn){ btn.click(); return true; }
    top.dispatchEvent(new MouseEvent('click',{bubbles:true})); return true;       // the sheets close on a click on their backdrop
  }
  FB.closeTop=closeTop;
  addEventListener('keydown',e=>{
    if (e.key==='Escape'){ if (q('dialog[open]')) return; if (body.classList.contains('window-screen-mode')&&!document.fullscreenElement){ toggleWindowScreen(); e.preventDefault(); return; } if (closeTop()) e.preventDefault(); return; }
    if ((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='k'){ e.preventDefault(); openCmd(); return; }
    if (e.ctrlKey||e.metaKey||e.altKey||q('dialog[open]')) return;
    const t=e.target, typing=t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); if (typing) return;
    const key=e.key.length===1?e.key.toLowerCase():e.key, clockOn=body.dataset.scr==='clock';
    if (key>='1'&&key<='5'){ go(SCR[+key-1]); e.preventDefault(); }
    else if (key==='/'){ e.preventDefault(); openCmd(); }
    else if (key==='?'||key==='؟'){ e.preventDefault(); openKeys(); }
    else if (key==='g'||key==='ل'){ go('clock'); setMode(mode()==='simple'?'full':'simple'); }
    else if (key==='h'||key==='ا'){ if (clockOn&&mode()==='simple'){ const b=q('#zd24Sw [aria-pressed="false"]'); if (b) b.click(); } }
    else if (key==='f'||key==='ب'){ toggleWindowScreen(); }
    else if (clockOn&&mode()==='full'&&(key==='+'||key==='=')){ FB.zoom.in(); }
    else if (clockOn&&mode()==='full'&&(key==='-'||key==='−')){ FB.zoom.out(); }
    else if (clockOn&&mode()==='full'&&key==='0'){ FB.zoom.reset(); }
  });

  /* ---------- 8. the two module frames: fit a wide screen ---------- */
  FB.frameCss=`@media (min-width:900px){
  body{padding-inline:32px!important}
  .col{max-width:1280px!important;width:100%!important}
  body:has(#dial) .col{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,1fr);column-gap:48px;align-items:start;padding-top:8px}
  body:has(#dial) .col>*{grid-column:2;min-width:0}
  body:has(#dial) .col>#dial{grid-column:1;grid-row:1/span 40;position:sticky;top:20px;width:100%;max-width:min(100%,calc(100vh - 60px));margin:0 auto;justify-self:center}
  body:has(#dial) .col>.notes{grid-column:1/-1}
  .pane{column-count:2;column-gap:22px}
  .pane>*{break-inside:avoid}
  .mode,.cityRow{max-width:620px;margin-inline:auto}
}
@media (min-width:1700px){ .pane{column-count:3} }
:focus-visible{outline:3px solid #9fe3d4!important;outline-offset:2px}`;
  ['mod-qibla','mod-sky'].forEach(id=>on($(id),'load',e=>{ try{ const d=e.target.contentDocument; if (!d||d.getElementById('fableFrameCss')) return;
    const st=d.createElement('style'); st.id='fableFrameCss'; st.textContent=FB.frameCss||''; d.head.appendChild(st);
    d.addEventListener('keydown',ev=>{ if ((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ ev.preventDefault(); openCmd(); } }); }catch(_){ } }));

  /* ---------- 9. updates and offline: this page's own version file, and one warm-up read so the first visit is enough ---------- */
  (function(){
    if (location.protocol!=='https:') return;
    let last=0;
    async function check(){ if (Date.now()-last<60e3||!navigator.onLine) return; last=Date.now();
      try{ const r=await fetch('fable/version.json?t='+Date.now(),{cache:'no-store'}); if (!r.ok) return; const v=await r.json(); if (!v.build||v.build===window.FABLE_BUILD) return;
        let tried={}; try{ tried=JSON.parse(sessionStorage.getItem('fableReloadTry')||'{}'); }catch(e){}
        if (tried.b===v.build&&Date.now()-tried.at<10*60e3) return;
        if (q('dialog[open]')||(body.dataset.scr==='qibla'&&document.visibilityState==='visible')) { last=0; return; }
        try{ sessionStorage.setItem('fableReloadTry',JSON.stringify({b:v.build,at:Date.now()})); }catch(e){}
        const t=$('hToast'); if (t) t.textContent='نسخة جديدة من الزيج جاهزة — تُحمَّل الآن';
        setTimeout(()=>location.reload(),900); }catch(e){} }
    document.addEventListener('visibilitychange',()=>{ if (document.visibilityState==='visible') check(); });
    setInterval(()=>{ if (document.visibilityState==='visible') check(); },5*60e3); setTimeout(check,8000);
    if ('serviceWorker' in navigator&&window.caches){
      const warm=async()=>{ try{ if (!navigator.serviceWorker.controller) return; for (const u of ['fable/index.html','beta/voice.js','data/uq/index.json']){ if (!(await caches.match(new URL(u,document.baseURI).href))) await fetch(u).catch(()=>{}); } }catch(e){} };
      navigator.serviceWorker.ready.then(()=>setTimeout(warm,3000)).catch(()=>{}); navigator.serviceWorker.addEventListener('controllerchange',()=>setTimeout(warm,1500));
    }
  })();

  paintMode(); FB.frame(true); start();
})();
