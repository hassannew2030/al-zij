'use strict';
/* ===== Al-Zij · Claude's desktop design — core =====
   Words and numbers, the place, the clock (with «time travel»), the prayer day, the router and one shared ticker.
   Every time on screen comes from beta's own engine (engine.js, copied verbatim) read with beta's own settings keys
   (zijLastLocation, zijCalcMethod, zijAsr, zijHighLat, zijAdhanOffsets…), so it is the same minute beta shows. */

const observer = new Observer();
const hijriCal = new HijriCalendar();
const trueSky = new TrueSkyEngine(observer);
const starField = new StarField(observer);
window.observer = observer; window.hijriCal = hijriCal;   // the two legacy instruments read the place from their parent, as in beta

const LS = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} },
  json(k,d){ try{ const v=JSON.parse(localStorage.getItem(k)||'null'); return v==null?d:v; }catch(e){ return d; } }
};

/* ---------- language and digits (beta's keys: zijLang, zijDigits) ---------- */
const Z = { ver:0, subs:new Set(), screens:{} };
Z.lang = (()=>{
  const v=LS.get('zijLang'); if(v==='en'||v==='ar') return v;
  try{ const langs=(navigator.languages||[navigator.language||'']).join(',').toLowerCase(); if(/(^|,)ar/.test(langs)) return 'ar';
    const z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    if(/^(Asia\/(Riyadh|Dubai|Kuwait|Qatar|Bahrain|Muscat|Aden|Amman|Baghdad|Damascus|Beirut|Gaza|Hebron)|Africa\/(Cairo|Khartoum|Tripoli|Tunis|Algiers|Casablanca))$/.test(z)) return 'ar'; }catch(e){}
  return 'en';
})();
window.ZIJ_LANG = Z.lang;
const EN = ()=>Z.lang==='en';
const T = (a,e)=>EN()?e:a;
const latin = ()=>EN()||LS.get('zijDigits')==='en';
const AR_D='٠١٢٣٤٥٦٧٨٩';
const dg = s=>latin()?String(s):String(s).replace(/\d/g,d=>AR_D[d]).replace(/([٠-٩])\.([٠-٩])/g,'$1٫$2');
const two = n=>String(n).padStart(2,'0');
const esc = s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const NAMES = {
  fajr:['الفجر','Fajr'], sunrise:['الشروق','Sunrise'], dhuhr:['الظهر','Dhuhr'], jumuah:['الجمعة',"Jumu'ah"], asr:['العصر','Asr'],
  maghrib:['المغرب','Maghrib'], isha:['العشاء','Isha'], duha:['الضحى','Duha'], third:['الثلث الأخير','Last third'], mid:['منتصف الليل','Midnight']
};
const pname = (k,fri)=>{ const r=NAMES[(k==='dhuhr'&&fri)?'jumuah':k]||[k,k]; return EN()?r[1]:r[0]; };
const HM = [['محرم','Muharram'],['صفر','Safar'],['ربيع الأول',"Rabi' al-Awwal"],['ربيع الآخر',"Rabi' al-Akhir"],['جمادى الأولى','Jumada al-Ula'],['جمادى الآخرة','Jumada al-Akhirah'],
  ['رجب','Rajab'],['شعبان',"Sha'ban"],['رمضان','Ramadan'],['شوال','Shawwal'],['ذو القعدة',"Dhu al-Qa'dah"],['ذو الحجة','Dhu al-Hijjah']];
const GM = [['يناير','January'],['فبراير','February'],['مارس','March'],['أبريل','April'],['مايو','May'],['يونيو','June'],['يوليو','July'],['أغسطس','August'],
  ['سبتمبر','September'],['أكتوبر','October'],['نوفمبر','November'],['ديسمبر','December']];
const WD = [['الأحد','Sunday'],['الاثنين','Monday'],['الثلاثاء','Tuesday'],['الأربعاء','Wednesday'],['الخميس','Thursday'],['الجمعة','Friday'],['السبت','Saturday']];
const L2 = r=>EN()?r[1]:r[0];
const hijriText = h=>EN()? `${h.day} ${HM[h.month-1][1]} ${h.year} AH` : `${dg(h.day)} ${HM[h.month-1][0]} ${dg(h.year)} هـ`;
const gregText = lp=>EN()? `${lp.d} ${GM[lp.m][1]} ${lp.y}` : `${dg(lp.d)} ${GM[lp.m][0]} ${dg(lp.y)} م`;

/* ---------- times ---------- */
const all24 = ()=>LS.get('zijClk24')==='1';         // optional: every time in 24-hour form (off by default, like beta)
function fmt(min, ap=true){
  const m=((Math.round(min)%1440)+1440)%1440; let h=Math.floor(m/60); const mm=m%60;
  if(all24()) return dg(two(h)+':'+two(mm));
  const s=EN()?(h<12?'AM':'PM'):(h<12?'ص':'م'); h=h%12||12; return dg(h+':'+two(mm))+(ap?' '+s:'');
}
const cdText = sec=>{ sec=Math.max(0,Math.floor(sec)); const H=Math.floor(sec/3600),M=Math.floor(sec%3600/60),S=sec%60; return dg((H?H+':':'')+two(M)+':'+two(S)); };
const durText = min=>{ min=Math.max(0,Math.round(min)); const h=Math.floor(min/60),m=min%60; return EN()?((h?h+' h ':'')+m+' min'):dg((h?h+' س ':'')+m+' د'); };
const tzh = d=>observer.tzAt(d);
function localMin(d){ const ld=new Date(d.getTime()+tzh(d)*36e5); return ld.getUTCHours()*60+ld.getUTCMinutes()+ld.getUTCSeconds()/60+ld.getUTCMilliseconds()/6e4; }
function localParts(d){ const ld=new Date(d.getTime()+tzh(d)*36e5); return {y:ld.getUTCFullYear(),m:ld.getUTCMonth(),d:ld.getUTCDate(),wd:ld.getUTCDay()}; }
const epochOfLocal = (lp,min,ref)=>Date.UTC(lp.y,lp.m,lp.d)+(min-tzh(ref)*60)*6e4;   // a minute of a local date → epoch ms
const kmBetween = (a,b,c,d)=>{ const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2; return 12742*Math.asin(Math.sqrt(x)); };

/* ---------- the clock: real time, or a moment the user is previewing («time travel») ---------- */
const clock = {
  travel:null,
  now(){ return this.travel!=null ? new Date(this.travel) : new Date(); },
  set(ms){ this.travel = ms==null ? null : ms; Z.ver++; document.body.classList.toggle('travelling', this.travel!=null); tick(); },
};

/* ---------- the prayer day around a moment (beta's own rules: homeJs + the prayer tab) ---------- */
const KEYS = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const _days = new Map();
function dayOf(at){
  const key=Math.floor(at.getTime()/6e4)+'|'+observer.lat.toFixed(4)+','+observer.lon.toFixed(4)+'|'+Z.ver;
  let b=_days.get(key);
  if(!b){
    const h=hijriCal.fromGregorian(at), p=observer.realPrayerTimes(at,h);
    const tom=new Date(at.getTime()+864e5), ht=hijriCal.fromGregorian(tom), pt=observer.realPrayerTimes(tom,ht);
    const yd=new Date(at.getTime()-864e5), py=observer.realPrayerTimes(yd,hijriCal.fromGregorian(yd));
    const lp=localParts(at);
    b={h,ht,p,pt,py,lp,friday:lp.wd===5,ramadan:h.month===9};
    _days.set(key,b); if(_days.size>40) _days.delete(_days.keys().next().value);
  }
  const nm=localMin(at), {p,pt,py}=b;
  // current and next (homeJs): sunrise counts as an event; before Fajr we are still in Isha time
  let cur=-1; KEYS.forEach((k,i)=>{ if(nm>=p[k]) cur=i; }); const afterMidnight=cur===-1; if(afterMidnight) cur=5;
  let next=KEYS.findIndex(k=>p[k]>nm), nextMin; if(next===-1){ next=0; nextMin=pt.fajr+1440; } else nextMin=p[KEYS[next]];
  const since=!afterMidnight?nm-p[KEYS[cur]]:999, curIsPrayer=KEYS[cur]!=='sunrise', justNow=curIsPrayer&&since<10;
  // the night in progress (or tonight): Maghrib → Fajr; Isha ends at its middle; the last third starts at 2/3 (prayer tab, #51)
  let mN=p.maghrib,fN=pt.fajr+1440,iN=p.isha; if(nm<p.fajr){ mN=py.maghrib-1440; fN=p.fajr; iN=py.isha-1440; }
  const midN=(mN+fN)/2, third=mN+(fN-mN)*2/3;
  let listCur=cur; if(cur===5&&nm>=iN&&nm>=midN) listCur=-2;           // after the middle of the night Isha is simply off
  // the period we are in, for the progress bar: from the last event to the next one
  let prevMin; { let best=-1e9; [[py,-1440],[p,0]].forEach(([q,o])=>KEYS.forEach(k=>{ const t=q[k]+o; if(t<=nm&&t>best) best=t; })); prevMin=best; }
  return Object.assign({}, b, {nm,cur,next,nextMin,since,curIsPrayer,justNow,afterMidnight,mN,fN,iN,midN,third,listCur,prevMin,duha:p.sunrise+15,at});
}
/* the line under the time: what is worth saying today (homeJs notes, same order) */
function notesOf(D){
  const n=[], h=D.h, ph=Ephemeris.moonPhase(D.at);
  if(D.ramadan) n.push(T('رمضان كريم · اليوم '+dg(h.day)+' من رمضان','Ramadan Kareem · day '+h.day+' of Ramadan'));
  if(h.month===12&&h.day===9) n.push(T('اليوم يوم عرفة','Today is the Day of Arafah'));
  if((h.month===10&&h.day===1)||(h.month===12&&h.day>=10&&h.day<=13)) n.push(T('عيد مبارك','Eid Mubarak'));
  if(h.day>=13&&h.day<=15&&!D.ramadan) n.push(T('اليوم من الأيام البيض','One of the White Days (13–15)'));
  if(D.friday) n.push(T('يوم الجمعة · سورة الكهف','Friday · Surat al-Kahf'));
  if(ph.illum>0.985) n.push(T('الليلة بدر','Full moon tonight'));
  else if(ph.age>0.8&&ph.age<2.2&&ph.waxing) n.push(T('الهلال الجديد بعد المغرب في الغرب','The new crescent: in the west after Maghrib'));
  try{ const k=kaabaToday(D.at); if(k){ const lm=((k.t/6e4+observer.tz*60)%1440+1440)%1440;
    if(!k.anti) n.unshift(T('اليوم تتعامد الشمس على الكعبة الساعة '+fmt(lm)+' · ظل أي عمود يشير عكس القبلة','Today the Sun is right above the Kaaba at '+fmt(lm)+' · every shadow points away from the qibla'));
    else if(observer.sunAltitudeNow(new Date(k.t))>5) n.unshift(T('اليوم الشمس فوق الجهة المقابلة للكعبة الساعة '+fmt(lm)+' · ظلك يشير إلى القبلة','Today the Sun is over the point opposite the Kaaba at '+fmt(lm)+' · your shadow points to the qibla')); } }catch(e){}
  return n;
}

/* ---------- the place (beta's keys and rules; no network: names come from what is saved, or the offline city lists) ---------- */
function initPlace(){
  try{ const L=JSON.parse(LS.get('zijLastLocation')||'null');
    if(L&&L.lat===21.5433&&L.lon===39.1728&&LS.get('zijLocationLocked')==='true'&&LS.get('zijLockByUser')!=='1'){ LS.set('zijLocationLocked','false'); LS.set('zijLocAuto','1'); } }catch(_){}
  const saved=LS.json('zijLastLocation',null);
  if(saved&&isFinite(saved.lat)&&isFinite(saved.lon)) observer.set(saved.lat,saved.lon,-(new Date().getTimezoneOffset()/60),'آخر موقع محفوظ');
  else { observer.set(21.5433,39.1728,-(new Date().getTimezoneOffset()/60),'جدة (موقع مثبّت)'); LS.set('zijLastLocation',JSON.stringify({lat:21.5433,lon:39.1728})); LS.set('zijLocAuto','1'); }
}
initPlace();
let UQI=null; fetch('data/uq/index.json').then(r=>r.json()).then(j=>{ UQI=j; Z.ver++; tick(); }).catch(()=>{});
const isDefaultPoint = ()=>LS.get('zijLocAuto')!=='0'&&LS.get('zijLockByUser')!=='1';
function placeName(){
  const la=observer.lat, lo=observer.lon;
  if(isDefaultPoint()) return T('جدة · موقع مبدئي','Jeddah · starting point');
  const p=LS.json('zijPlace2',null), key=la.toFixed(3)+','+lo.toFixed(3);
  if(p&&(p.lang||'ar')===(EN()?'en':'ar')&&(p.key===key||kmBetween(la,lo,p.lat,p.lon)<2)){
    const c=(p.city||'').replace(/^(محافظة|منطقة|مدينة)\s+/,'').trim(), hd=(p.hood||'').trim();
    if(!hd||hd===c) return c; return EN()?(c?c+' · '+hd:hd):(c?c+' · '+(/^حي\s/.test(hd)?hd:'حي '+hd):hd);
  }
  let best=null,bd=1e9;
  if(UQI) UQI.cities.forEach(c=>{ const d=kmBetween(la,lo,c[1],c[2]); if(d<bd){bd=d;best=EN()?c[4]:c[3];} });
  if(best&&bd<=40) return best;
  best=null; bd=1e9; (window.ZIJ_CITIES||[]).forEach(c=>{ const d=kmBetween(la,lo,c[1],c[2]); if(d<bd){bd=d;best=c[0];} });
  if(best&&bd<=45&&!EN()) return best;
  return coordText(la,lo);
}
const coordText = (la,lo)=>dg(Math.abs(la).toFixed(2))+'°'+(la>=0?T('ش','N'):T('ج','S'))+' · '+dg(Math.abs(lo).toFixed(2))+'°'+(lo>=0?T('ق','E'):T('غ','W'));
let locBusy=false;
function applyAutoLocation(lat,lon){
  observer.set(lat,lon,-(new Date().getTimezoneOffset()/60),'موقعك');
  LS.set('zijLastLocation',JSON.stringify({lat,lon})); LS.set('zijLocAuto','0'); LS.set('zijLocAt',String(Date.now()));
  placeChanged();
}
function refreshLocation(force){   // beta's refreshLocation, without the network (IP) fallback
  return new Promise(res=>{
    if(locBusy||!navigator.geolocation) return res(false);
    if(LS.get('zijLocationLocked')==='true'&&LS.get('zijLockByUser')==='1') return res(false);
    if(!force&&Date.now()-(+LS.get('zijLocAt')||0)<10*60e3) return res(false);
    locBusy=true;
    const ok=p=>{ locBusy=false; LS.set('zijLocDenied','0'); const {latitude:la,longitude:lo,accuracy:ac}=p.coords;
      LS.set('zijLocLast',JSON.stringify({lat:la,lon:lo,acc:Math.round(ac||0),at:Date.now()}));
      if(ac&&ac>20000) return res(false);
      LS.set('zijLocAcc',String(Math.round(ac||0)));
      const first=LS.get('zijLocAuto')!=='0'||LS.get('zijLocSrc')==='net'; LS.set('zijLocSrc','gps');
      if(first||kmBetween(observer.lat,observer.lon,la,lo)>0.3) applyAutoLocation(la,lo); else LS.set('zijLocAt',String(Date.now()));
      res(true); };
    const opts=hi=>({enableHighAccuracy:hi,timeout:hi?15000:30000,maximumAge:hi?60e3:10*60e3});
    navigator.geolocation.getCurrentPosition(ok,e=>{
      if(e&&e.code===1){ locBusy=false; LS.set('zijLocDenied','1'); LS.set('zijLocLast',JSON.stringify({err:'denied',at:Date.now()})); return res(false); }
      navigator.geolocation.getCurrentPosition(ok,()=>{ locBusy=false; res(false); },opts(false));
    },opts(true));
  });
}
function setManualPlace(lat,lon){   // beta's applyManualLocation: the user chose it, so it is pinned
  observer.set(lat,lon,-(new Date().getTimezoneOffset()/60),'موقع يدوي');
  LS.set('zijLocationLocked','true'); LS.set('zijLastLocation',JSON.stringify({lat,lon})); LS.set('zijLockByUser','1'); LS.del('zijLocAuto');
  placeChanged();
}
function placeChanged(){ try{ observer._memoMap&&observer._memoMap.clear(); }catch(e){} _days.clear(); Z.ver++; Z.emit('place'); tick();
  ['legacy-qibla','legacy-sky'].forEach(id=>{ const f=document.getElementById(id); try{ f&&f._ready&&f.contentWindow.zijSync&&f.contentWindow.zijSync(); }catch(e){} }); }
function settingsChanged(){ try{ observer._memoMap&&observer._memoMap.clear(); }catch(e){} _days.clear(); Z.ver++; Z.emit('settings'); tick(); }

/* ---------- events and one shared ticker (the page sleeps when hidden) ---------- */
const _ev={};
Z.on=(name,fn)=>{ (_ev[name]=_ev[name]||[]).push(fn); };
Z.emit=(name,x)=>{ (_ev[name]||[]).forEach(fn=>{ try{ fn(x); }catch(e){ console.error(name,e); } }); };
function tick(){
  if(document.hidden) return;
  const now=clock.now();
  Z.emit('tick',now);
}
(function startTicker(){ setTimeout(()=>{ tick(); setInterval(tick,1000); }, 1000-(Date.now()%1000)+5); })();
document.addEventListener('visibilitychange',()=>{ document.body.classList.toggle('paused',document.hidden); if(!document.hidden){ Z.ver++; tick(); } });
const reducedMotion = ()=>LS.get('zijCalm')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- small helpers: toast, tooltip, copy ---------- */
const $ = id=>document.getElementById(id);
function toast(t){ const el=$('toast'); el.textContent=t; el.classList.add('on'); clearTimeout(el._h); el._h=setTimeout(()=>el.classList.remove('on'),2600); }
const tip = {
  show(html,x,y){ const el=$('tip'); el.innerHTML=html; el.classList.add('on'); const w=el.offsetWidth,h=el.offsetHeight;
    el.style.left=Math.max(8,Math.min(innerWidth-w-8,x-w/2))+'px'; el.style.top=Math.max(8,y-h-14)+'px'; },
  hide(){ $('tip').classList.remove('on'); }
};
async function copyText(t,msg){ try{ await navigator.clipboard.writeText(t); toast(msg||T('نُسخ','Copied')); }catch(e){ prompt(T('انسخ النص من هنا:','Copy the text from here:'),t); } }

/* ---------- the sky behind the page follows the real Sun ---------- */
function paintSky(){
  let alt=-30; try{ alt=observer.sunAltitudeNow(new Date()); }catch(e){}
  const stops=[ // altitude → [skyA rgba, skyB rgba]
    [-90,[38,56,130,.20],[78,48,118,.08]],[-18,[44,58,150,.22],[70,52,140,.10]],[-8,[86,62,170,.26],[150,70,140,.14]],
    [-2,[214,108,120,.26],[110,74,190,.20]],[3,[255,160,96,.28],[120,92,200,.14]],[10,[70,122,220,.34],[255,186,110,.10]],[90,[64,118,224,.38],[120,170,255,.10]]];
  let i=0; while(i<stops.length-2&&alt>stops[i+1][0]) i++;
  const [a0,A0,B0]=stops[i],[a1,A1,B1]=stops[i+1],f=Math.max(0,Math.min(1,(alt-a0)/(a1-a0)));
  const mix=(u,v)=>'rgba('+u.map((x,k)=>k<3?Math.round(x+(v[k]-x)*f):(x+(v[k]-x)*f).toFixed(3)).join(',')+')';
  document.documentElement.style.setProperty('--skyA',mix(A0,A1)); document.documentElement.style.setProperty('--skyB',mix(B0,B1));
}
function paintStars(){
  const cv=$('stars'); if(!cv) return; const dpr=Math.min(2,devicePixelRatio||1), W=innerWidth, H=innerHeight;
  cv.width=W*dpr; cv.height=H*dpr; const g=cv.getContext('2d'); g.scale(dpr,dpr); g.clearRect(0,0,W,H);
  let s=20261111; const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  const n=Math.round(W*H/2600);
  for(let i=0;i<n;i++){ const x=rnd()*W,y=rnd()*H,r=rnd()<.93?rnd()*.9+.25:rnd()*1.4+.9,a=.25+rnd()*.6;
    g.beginPath(); g.arc(x,y,r,0,7); g.fillStyle=`rgba(${215+rnd()*40|0},${222+rnd()*30|0},255,${a.toFixed(2)})`; g.fill();
    if(r>1.6){ const gr=g.createRadialGradient(x,y,0,x,y,r*5); gr.addColorStop(0,'rgba(200,215,255,.18)'); gr.addColorStop(1,'rgba(200,215,255,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r*5,0,7); g.fill(); } }
}

/* ---------- router ---------- */
const SCREENS=['clock','prayer','qibla','sky','more'];
const TITLES={clock:['الساعة','Clock'],prayer:['الصلاة','Prayer'],qibla:['القبلة','Qibla'],sky:['السماء','Sky'],more:['المزيد','More']};
function go(s,opt){
  if(!SCREENS.includes(s)) s='clock';
  const was=document.body.dataset.scr; document.body.dataset.scr=s; LS.set('zijClaudeScreen',s);
  document.querySelectorAll('.nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.go===s?'page':'false'));
  $('scrTitle').textContent=L2(TITLES[s]);
  document.title=L2(TITLES[s])+' · '+T('الزيج','Al-Zij');
  if(location.hash!=='#'+s) history.replaceState(null,'','#'+s);
  const scr=Z.screens[s]; if(scr&&scr.show) scr.show(opt||{},was!==s);
  if(s!=='clock'&&clock.travel!=null) clock.set(null);
  tick();
}
window.zijGo=go;

/* ---------- boot ---------- */
function boot(){
  document.body.insertAdjacentHTML('afterbegin',`<svg id="gdefs" aria-hidden="true" focusable="false"><defs>${SVG_DEFS}</defs></svg>`);
  document.documentElement.lang=EN()?'en':'ar'; document.documentElement.dir=EN()?'ltr':'rtl';
  document.body.classList.toggle('calm',LS.get('zijCalm')==='1');
  { const fs=+LS.get('zijClaudeFs')||1; document.documentElement.style.setProperty('--fs',fs); }
  { const f=LS.get('zijClaudeFont'); if(f) document.documentElement.style.setProperty('--f-ui',f); }
  // static words of the shell
  document.querySelectorAll('[data-t]').forEach(el=>{ const [a,e]=el.dataset.t.split('|'); el.textContent=EN()?e:a; });
  document.querySelectorAll('[data-tl]').forEach(el=>{ const [a,e]=el.dataset.tl.split('|'); el.setAttribute('aria-label',EN()?e:a); el.title=EN()?e:a; });
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  $('langBtn').textContent=EN()?'العربية':'English';
  $('langBtn').addEventListener('click',()=>{ LS.set('zijLang',EN()?'ar':'en'); location.reload(); });
  $('digBtn').textContent=latin()?'١٢٣':'123';
  $('digBtn').hidden=EN();
  $('digBtn').addEventListener('click',()=>{ LS.set('zijDigits',latin()?'ar':'en'); Z.ver++; _days.clear(); Z.emit('settings'); $('digBtn').textContent=latin()?'١٢٣':'123'; tick(); });
  $('placeBtn').addEventListener('click',()=>go('more',{sec:'place'}));
  $('nextPill').addEventListener('click',()=>go('clock'));
  document.addEventListener('keydown',e=>{
    if(e.target.closest('input,select,textarea,[contenteditable]')||e.altKey||e.ctrlKey||e.metaKey) return;
    const i='12345'.indexOf(e.key); if(i>=0){ go(SCREENS[i]); e.preventDefault(); }
    if(e.key==='Escape'){ if(document.body.classList.contains('display')) Z.emit('exitDisplay'); else if(clock.travel!=null) clock.set(null); }
  });
  paintStars(); paintSky(); setInterval(paintSky,60e3);
  let rz=0; addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(()=>{ paintStars(); Z.emit('resize'); },180); });
  Z.on('tick',now=>{
    const D=dayOf(new Date());
    $('placeTxt').textContent=placeName();
    const nx=$('nextPill'); nx.querySelector('span').textContent=D.justNow?T('حان الآن','Now'):pname(KEYS[D.next],D.friday)+' '+T('بعد','in');
    nx.querySelector('b').textContent=D.justNow?pname(KEYS[D.cur],D.friday):cdText((D.nextMin-D.nm)*60);
  });
  // ask the device for its place silently only when the permission is already granted (beta asks on the first «ابدأ»)
  try{ navigator.permissions&&navigator.permissions.query({name:'geolocation'}).then(st=>{ if(st.state==='granted') refreshLocation(false); }).catch(()=>{}); }catch(e){}
  Z.emit('boot');
  let s0=LS.get('zijClaudeScreen')||'clock'; const hs=(location.hash||'').slice(1); if(SCREENS.includes(hs)) s0=hs;
  go(s0);
  addEventListener('hashchange',()=>{ const h=(location.hash||'').slice(1); if(SCREENS.includes(h)&&h!==document.body.dataset.scr) go(h); });
  // offline: the same service worker as the main site and beta (scope /, network first, saves every file it fetches)
  if('serviceWorker' in navigator&&location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
}
