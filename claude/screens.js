'use strict';
/* ===== Screens 1–2: the clock and the prayer, with the alerts, the adhan log and the talking clock ===== */

const moonIconSVG = (ph,r=9,cls='')=>`<svg class="${cls}" viewBox="${-r-1} ${-r-1} ${2*r+2} ${2*r+2}" aria-hidden="true"><defs><radialGradient id="gMoon" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#e3e8f3"/><stop offset="1" stop-color="#a9b2c6"/></radialGradient></defs>${moonG(r,ph)}</svg>`;
const PHASE_EN = ['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent'];
const phaseName = ph=>EN()?PHASE_EN[ph.idx]:ph.name;

/* the list of the day's times, shared by the clock and the prayer screens (the prayer tab's own rules, #51) */
function timesHTML(D,big){
  const {p,nm}=D, ram=D.ramadan;
  const rows=KEYS.map((k,i)=>{
    const isCur=i===D.listCur, isNext=i===D.next, t=isNext?D.nextMin:p[k];
    const cls=[k==='sunrise'?'minor':'', isCur?'cur':'', isNext?'next':'', (!isCur&&!isNext&&p[k]<nm)?'past':''].join(' ');
    let tag='';
    if(isNext){ const w=ram&&k==='maghrib'?T('الإفطار بعد','Iftar in'):ram&&k==='fajr'?T('الإمساك بعد','Imsak in'):T('بعد','in'); tag=`<span class="cdn">${w} ${cdText((D.nextMin-nm)*60)}</span>`; }
    else if(isCur&&k==='isha'&&nm>=D.iN){ tag=`<span class="cdn" style="color:var(--gold-2)">${T('مضى على الأذان','since the adhan')} ${cdText((nm-D.iN)*60)}</span>`; }
    else if(isCur&&k!=='sunrise') tag=`<small>${T('الآن','now')}</small>`;
    return `<li class="${cls}">${prIconSVG(k)}<span class="n">${pname(k,D.friday)}${tag}</span><span class="t num">${fmt(t)}</span></li>`;
  });
  rows.splice(2,0,`<li class="minor extra">${prIconSVG('duha')}<span class="n">${pname('duha')} <small>${T('يبدأ','begins')}</small></span><span class="t num">${fmt(D.duha)}</span></li>`);
  rows.push(`<li class="minor extra">${prIconSVG('third')}<span class="n">${T('ثلث الليل الأخير','Last third of the night')} <small>${T('قيام الليل','night prayer')}</small></span><span class="t num">${fmt(D.third)}</span></li>`);
  if(big) rows.splice(7,0,`<li class="minor extra">${prIconSVG('third')}<span class="n">${pname('mid')} <small>${T('آخر وقت العشاء المختار','end of the chosen Isha time')}</small></span><span class="t num">${fmt(D.midN)}</span></li>`);
  return rows.join('');
}
function heroTexts(D){
  const {p,nm}=D, k=KEYS[D.next];
  if(D.justNow){ const ck=KEYS[D.cur]; return {now:true,lbl:'',cd:(ck==='dhuhr'&&D.friday)?T('حان الآن وقت صلاة الجمعة',"It is time for Jumu'ah"):T('حان الآن أذان ','It is now time for ')+pname(ck,D.friday),sub:T('الساعة ','at ')+fmt(p[ck])}; }
  let lbl=pname(k,D.friday)+' '+T('بعد','in'), sub=T('الأذان ','Adhan ')+fmt(D.nextMin);
  if(D.ramadan&&k==='maghrib'){ lbl=T('الإفطار بعد','Iftar in'); sub=T('المغرب ','Maghrib ')+fmt(D.nextMin); }
  if(D.ramadan&&k==='fajr'){ lbl=T('الإمساك بعد','Imsak in'); sub=T('الفجر ','Fajr ')+fmt(D.nextMin); }
  if(k==='sunrise') sub=T('الشروق ','Sunrise ')+fmt(D.nextMin)+T('، آخر وقت الفجر',' — end of Fajr time');
  return {now:false,lbl,cd:cdText((D.nextMin-nm)*60),sub};
}

/* ==================== the clock ==================== */
Z.screens.clock = (()=>{
  const el=$('scr-clock'); let built=false, view=LS.get('zijClaudeView')==='grand'?'grand':'simple', dial=null, lastSec=-1;
  function build(){
    el.innerHTML=`<div class="clockgrid">
  <div class="nowcol">
    <div class="card datecard"><div class="wd" id="cWd"></div><div class="hij" id="cHij"></div><div class="greg" id="cGreg"></div>
      <div class="clockline"><span class="digital num" id="cDig"></span><span class="ap" id="cAp"></span></div></div>
    <div class="card hero" id="cHero" aria-live="polite"><span class="preview tag" id="cPrevTag" hidden>${T('معاينة','Preview')}</span><div class="lbl" id="cLbl"></div><div class="cd num" id="cCd"></div><div class="sub" id="cSub"></div><div class="bar" aria-hidden="true"><i id="cBar"></i></div></div>
    <div class="note" id="cNote" hidden></div>
    <div class="card" style="padding:8px"><ul class="times" id="cTimes"></ul></div>
    <div class="glance">
      <button type="button" id="gMoonB"><span id="gMoonI"></span><b id="gMoonT"></b><span id="gMoonS"></span></button>
      <button type="button" id="gSunB"><svg viewBox="-12 -12 24 24" aria-hidden="true"><defs><radialGradient id="gSun2"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffd76a"/><stop offset="1" stop-color="#f09a3a"/></radialGradient></defs><circle r="5" fill="url(#gSun2)"/><g stroke="#ffd36b" stroke-width="1.6" stroke-linecap="round"><path d="M0-10v2.4M0 7.6V10M-10 0h2.4M7.6 0H10M-7 -7l1.7 1.7M5.3 5.3 7 7M-7 7l1.7-1.7M5.3-5.3 7-7"/></g></svg><b id="gSunT"></b><span id="gSunS"></span></button>
      <button type="button" id="gQibB"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="#8e98b3" stroke-opacity=".5"/><g id="gQibN"><path d="M20 5 24 20H16Z" fill="#ff7a6e"/><path d="M20 35 24 20H16Z" fill="#5c6785"/></g></svg><b id="gQibT"></b><span>${T('القبلة','Qibla')}</span></button>
    </div>
  </div>
  <div class="stage">
    <div class="stagebar">
      <div class="seg" role="group" aria-label="${T('نوع الساعة','Clock type')}"><button type="button" data-v="simple">${T('الساعة البسيطة','Simple clock')}</button><button type="button" data-v="grand">${T('الزيج الكبرى','The Grand Zij')}</button></div>
      <div class="seg" id="c24" role="group" aria-label="${T('١٢ أو ٢٤ ساعة','12 or 24 hours')}"><button type="button" data-h="12">${dg(12)}</button><button type="button" data-h="24">${dg(24)}</button></div>
      <span class="grow"></span>
      <div class="seg" role="group" aria-label="${T('التنقل في الأيام','Move between days')}"><button type="button" id="cDayPrev" title="${T('اليوم السابق','Previous day')}">${EN()?'‹':'›'}</button><button type="button" id="cNowB">${T('الآن','Now')}</button><button type="button" id="cDayNext" title="${T('اليوم التالي','Next day')}">${EN()?'›':'‹'}</button></div>
      <button type="button" class="btn" id="cLayersB" aria-expanded="false">${T('الحلقات','Rings')}</button>
      <div class="seg" id="cZoom" role="group" aria-label="${T('تكبير','Zoom')}"><button type="button" data-z="in">+</button><button type="button" data-z="out">−</button><button type="button" data-z="0">⟲</button></div>
      <button type="button" class="btn" id="cFullB" title="${T('الساعة وحدها على الشاشة كلها — لشاشة المسجد أو المكتب','The clock alone on the whole screen — for a mosque or office screen')}">${T('عرض كامل','Full display')}</button>
    </div>
    <div class="travel" id="cTravel" hidden><span>${T('تعرض','Showing')} <b id="cTravelT"></b></span><button type="button" class="btn ghost" id="cTravelBack">${T('رجوع للآن','Back to now')}</button></div>
    <div class="dialwrap" id="cDial"></div>
    <div class="card legend" id="cLegend" hidden></div>
    <div class="dialhint" id="cHint"></div>
  </div>
</div>`;
    el.querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.v)));
    el.querySelectorAll('[data-h]').forEach(b=>b.addEventListener('click',()=>{ LS.set('zijDial24',b.dataset.h==='24'?'1':'0'); SimpleDial.reset(); paintToggles(); tick(); }));
    $('cDayPrev').onclick=()=>clock.set(clock.now().getTime()-864e5);
    $('cDayNext').onclick=()=>clock.set(clock.now().getTime()+864e5);
    $('cNowB').onclick=()=>clock.set(null); $('cTravelBack').onclick=()=>clock.set(null);
    $('cLayersB').onclick=()=>{ const L=$('cLegend'); L.hidden=!L.hidden; $('cLayersB').setAttribute('aria-expanded',String(!L.hidden)); };
    el.querySelectorAll('[data-z]').forEach(b=>b.addEventListener('click',()=>{ const z=b.dataset.z; if(z==='in') GrandZij.zoomBy(1.3); else if(z==='out') GrandZij.zoomBy(1/1.3); else GrandZij.zoomReset(); }));
    $('cFullB').onclick=enterDisplay; $('exitDisplay').onclick=exitDisplay; Z.on('exitDisplay',exitDisplay);
    $('gMoonB').onclick=()=>go('sky',{tab:'moon'}); $('gSunB').onclick=()=>go('sky',{tab:'sun'}); $('gQibB').onclick=()=>go('qibla');
    buildLegend(); setView(view,true); built=true;
  }
  function buildLegend(){
    const L=$('cLegend');
    L.innerHTML=`<h3>${T('حلقات الزيج الكبرى','The Grand Zij rings')}</h3>`+GrandZij.LAYERS.map(([k,col,n,d])=>`<label data-l="${k}" title="${esc(L2(d))}"><input type="checkbox" data-k="${k}" ${GrandZij.isOn(k)?'checked':''}><span>${esc(L2(n))}</span><i style="background:${col}"></i></label>`).join('')+
      `<label><input type="checkbox" id="cTrueSky" ${LS.get('zijClaudeTrueSky')==='1'?'checked':''}><span>${T('حقيقة السماء: ما تحت الأفق باهت','True sky: dim what is below the horizon')}</span><i style="background:#3a4570"></i></label>`+
      `<p>${T('مرّر المؤشر على أي حلقة لتعرف ما فيها. كبّر بـ Ctrl + عجلة الفأرة أو الأزرار، واسحب لتتحرك.','Hover any ring to read it. Zoom with Ctrl + wheel or the buttons, then drag to move.')}</p>`;
    L.querySelectorAll('[data-k]').forEach(c=>c.addEventListener('change',()=>{ GrandZij.setLayer(c.dataset.k,c.checked); tick(); }));
    $('cTrueSky').addEventListener('change',e=>{ LS.set('zijClaudeTrueSky',e.target.checked?'1':'0'); GrandZij.reset(); tick(); });
    L.querySelectorAll('label[data-l]').forEach(l=>{ l.addEventListener('mouseenter',()=>GrandZij.highlight(l.dataset.l)); l.addEventListener('mouseleave',()=>GrandZij.highlight(null));
      l.addEventListener('focusin',()=>GrandZij.highlight(l.dataset.l)); l.addEventListener('focusout',()=>GrandZij.highlight(null)); });
  }
  function setView(v,first){
    view=v; LS.set('zijClaudeView',v); dial=v==='grand'?GrandZij:SimpleDial;
    const host=$('cDial'); host.classList.toggle('grand',v==='grand'); dial.mount(host); dial.reset(); lastSec=-1;
    paintToggles(); if(!first) tick();
  }
  function paintToggles(){
    el.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===view)));
    const tw=LS.get('zijDial24')!=='0'; el.querySelectorAll('[data-h]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.h==='24')===tw)));
    $('c24').hidden=view!=='simple'; $('cLayersB').hidden=view!=='grand'; $('cZoom').hidden=view!=='grand';
    if(view!=='grand'){ $('cLegend').hidden=true; $('cLayersB').setAttribute('aria-expanded','false'); }
    $('cHint').textContent=view==='simple'
      ? T('اسحب الشمس حول الحلقة لترى أي وقت آخر · الأسهم تحرّك عشر دقائق، وPageUp/PageDown يومًا · Home للرجوع','Drag the Sun round the ring to see any other time · arrows move 10 min, PageUp/PageDown a day · Home returns')
      : T('اسحب على حلقة النهار والليل لتغيّر الوقت · مرّر المؤشر على أي حلقة لتقرأها · «الحلقات» تخفي وتُظهر','Drag along the day-and-night ring to change the time · hover any ring to read it · «Rings» shows and hides');
  }
  async function enterDisplay(){ document.body.classList.add('display'); try{ await document.documentElement.requestFullscreen(); }catch(e){} SimpleDial.reset(); GrandZij.reset(); tick(); }
  function exitDisplay(){ document.body.classList.remove('display'); try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} tick(); }
  document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement&&document.body.classList.contains('display')) exitDisplay(); });
  function render(now){
    if(!built) build();
    const D=dayOf(now), real=clock.travel==null;
    $('cWd').textContent=L2(WD[D.lp.wd]); $('cHij').textContent=hijriText(D.h); $('cGreg').textContent=gregText(D.lp);
    { const t=Math.floor(D.nm*60),H=Math.floor(t/3600)%24,M=Math.floor(t%3600/60),S=t%60;
      if(all24()){ $('cDig').innerHTML=dg(two(H)+':'+two(M))+`<span class="sec">:${dg(two(S))}</span>`; $('cAp').textContent=''; }
      else { $('cDig').innerHTML=dg((H%12||12)+':'+two(M))+`<span class="sec">:${dg(two(S))}</span>`; $('cAp').textContent=EN()?(H<12?'AM':'PM'):(H<12?'صباحًا':'مساءً'); } }
    const ht=heroTexts(D), hero=$('cHero'); hero.classList.toggle('now',ht.now);
    $('cLbl').textContent=ht.lbl; $('cCd').textContent=ht.cd; $('cSub').textContent=ht.sub; $('cPrevTag').hidden=real;
    { const tot=D.nextMin-D.prevMin, f=tot>0?Math.max(0,Math.min(1,(D.nm-D.prevMin)/tot)):0; $('cBar').style.width=(f*100).toFixed(2)+'%'; }
    const notes=notesOf(D); $('cNote').hidden=!notes.length; $('cNote').textContent=notes[0]||'';
    $('cTimes').innerHTML=timesHTML(D,false);
    if(Math.floor(now.getTime()/6e4)!==render._m){ render._m=Math.floor(now.getTime()/6e4);
      const ph=Ephemeris.moonPhase(now); $('gMoonI').innerHTML=moonIconSVG(ph,14); $('gMoonT').textContent=dg(Math.round(ph.illum*100))+'%'; $('gMoonS').textContent=phaseName(ph);
      { const p=D.p,nm=D.nm; let n,t; if(nm<p.sunrise){n=T('الشروق','Sunrise');t=p.sunrise;}else if(nm<p.maghrib){n=T('الغروب','Sunset');t=p.maghrib;}else{n=T('الشروق','Sunrise');t=D.pt.sunrise;} $('gSunT').textContent=fmt(t); $('gSunS').textContent=n; }
      const qb=observer.computeQiblaBearing(observer.lat,observer.lon); $('gQibT').textContent=dg(Math.round(qb))+'°'; $('gQibN').setAttribute('transform',`rotate(${qb.toFixed(1)} 20 20)`);
    }
    $('cTravel').hidden=real; if(!real) $('cTravelT').textContent=L2(WD[D.lp.wd])+' '+gregText(D.lp)+' · '+fmt(D.nm);
    dial.draw(now);
    const sec=Math.floor(now.getTime()/1000); dial.hands(now,real&&sec===lastSec+1); lastSec=sec;
  }
  Z.on('tick',now=>{ if(document.body.dataset.scr==='clock') render(now); });
  Z.on('settings',()=>{ SimpleDial.reset(); GrandZij.reset(); built&&buildLegend(); });
  Z.on('place',()=>{ SimpleDial.reset(); GrandZij.reset(); });
  Z.on('resize',()=>{ SimpleDial.reset(); GrandZij.reset(); tick(); });
  return {show(){ if(!built) build(); }};
})();

/* ==================== the alerts (beta's settings, key zijAlerts; the same three alerts + Friday's iqamah) ==================== */
const Alerts = (()=>{
  const KEY='zijAlerts', FIRED='zijAlertsFired';
  const IQ={fajr:25,dhuhr:20,asr:20,maghrib:10,isha:20};
  const SOUNDS={brass:['نغمة النحاس','Brass chime'],bell:['جرس','Bell'],soft:['نغمة هادئة','Soft tone'],silent:['بدون صوت (رسالة فقط)','No sound (message only)']};
  const PRE_MIN=[5,10,15,20,25,30,45,60], IQ_MIN=[5,10,15,20,25,30,35,40,45];
  const P5=['fajr','dhuhr','asr','maghrib','isha'];
  function defaults(){ const s={on:true,v:1,p:{}}; P5.forEach(k=>s.p[k]={pre:{on:false,min:10,snd:'soft'},adhan:{on:true,snd:'brass'},iqama:{on:false,min:IQ[k],snd:'bell'}}); s.p.dhuhr.friIqama={on:false,min:IQ.dhuhr,snd:'bell'}; return s; }
  function load(){ const d=defaults(); const s=LS.json(KEY,null); if(!s||!s.p) return d;
    P5.forEach(k=>{ const a=s.p[k]||{}, f=d.p[k].friIqama; d.p[k]={pre:{...d.p[k].pre,...(a.pre||{})},adhan:{...d.p[k].adhan,...(a.adhan||{})},iqama:{...d.p[k].iqama,...(a.iqama||{})}}; if(f) d.p[k].friIqama={...f,...(a.friIqama||{})}; });
    d.on=s.on!==false; return d; }
  let S=load();
  const save=()=>LS.set(KEY,JSON.stringify(S));
  if(!LS.get(KEY)) save();
  addEventListener('storage',e=>{ if(e.key===KEY){ S=load(); Z.emit('alerts'); } });
  const mins=n=>EN()?(n===60?'1 hour':n+' min'):(n===60?'ساعة':dg(n)+' '+(n<=10?'دقائق':'دقيقة'));
  /* --- sound: made in the browser. iPhone rule: audio may start only from a tap, so the first tap anywhere wakes it,
         and every later tap wakes it again after the phone was locked (Safari then calls it «interrupted») --- */
  let ctx=null;
  function ac(){ try{ if(!ctx||ctx.state==='closed'){ const C=window.AudioContext||window.webkitAudioContext; if(C) ctx=new C(); }
      if(ctx&&ctx.state!=='running'){ const r=ctx.resume(); if(r&&r.catch) r.catch(()=>{}); } }catch(e){} return ctx; }
  function unlock(){ if(!S.on&&!ctx) return; const c=ac(); if(!c) return; try{ const b=c.createBuffer(1,1,22050),s=c.createBufferSource(); s.buffer=b; s.connect(c.destination); s.start(0); }catch(e){} }
  ['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,unlock,{passive:true,capture:true}));
  function strike(c,f,t,dur,vol){ [[1,1],[2.76,.35],[5.4,.12]].forEach(([m,g])=>{ const o=c.createOscillator(),v=c.createGain(); o.type='sine'; o.frequency.value=f*m;
    v.gain.setValueAtTime(.0001,t); v.gain.exponentialRampToValueAtTime(vol*g,t+.02); v.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(v); v.connect(c.destination); o.start(t); o.stop(t+dur+.05); }); }
  function play(snd){ if(snd==='silent') return true; const c=ac(); if(!c) return false; const t=c.currentTime+.05;
    if(snd==='brass'){ [0,1.6].forEach(o=>{ strike(c,523.25,t+o,1.4,.32); strike(c,659.25,t+o+.45,1.4,.3); strike(c,783.99,t+o+.9,1.8,.3); }); }
    else if(snd==='bell'){ [0,.35,.7].forEach((o,i)=>strike(c,i===2?880:660,t+o,.9,.28)); }
    else { strike(c,523.25,t,1.2,.16); strike(c,659.25,t+.5,1.4,.16); }
    try{ navigator.vibrate&&navigator.vibrate(snd==='brass'?[300,150,300,150,600]:[200,100,200]); }catch(e){}
    return c.state==='running'; }
  /* --- firing --- */
  let lastSnd=null;
  function banner(text,secs,heard){
    const b=$('alertBanner'); b.querySelector('.t').textContent=text;
    b.querySelector('.s').textContent=heard?'':T('لم يُسمع الصوت؟ المس هنا لتشغيله، وتأكد أن الجهاز ليس على الصامت.','No sound? Tap here to play it, and check the device is not on silent.');
    b.hidden=false; clearTimeout(b._h); b._h=setTimeout(()=>{ b.hidden=true; },secs*1000); }
  $('alertBanner').addEventListener('click',e=>{ if(e.target.id==='alertClose'){ $('alertBanner').hidden=true; return; } if(lastSnd){ ac(); play(lastSnd); } });
  function notify(text){ try{ if(!('Notification' in window)||Notification.permission!=='granted'||!document.hidden) return;
    const o={body:text,tag:'zij-alert',lang:EN()?'en':'ar',dir:EN()?'ltr':'rtl'};
    if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(r=>r?r.showNotification(T('الزّيج','Al-Zij'),o):new Notification(T('الزّيج','Al-Zij'),o)).catch(()=>{});
    else new Notification(T('الزّيج','Al-Zij'),o); }catch(e){} }
  function textOf(kind,k,cfg,fri){ const n=pname(k,fri);
    if(kind==='pre') return EN()?n+' adhan in '+mins(cfg.min):'بعد '+mins(cfg.min)+' أذان '+n;
    if(kind==='adhan') return EN()?'🕌 It is now time for the '+n+' adhan':'🕌 حان الآن موعد أذان '+n;
    if(k==='dhuhr'&&fri) return EN()?'🕌 It is now time for the iqamah':'🕌 حان الآن وقت إقامة الصلاة';   // Friday: for someone away from the mosque — not ours to name
    return EN()?'🕌 It is now time for the '+n+' iqamah':'🕌 حان الآن وقت إقامة صلاة '+n; }
  function fire(kind,k,cfg,fri){ const text=textOf(kind,k,cfg,fri); lastSnd=cfg.snd; const heard=play(cfg.snd); banner(text,kind==='adhan'?60:20,heard||cfg.snd==='silent'); notify(text); }
  let fired=LS.json(FIRED,{});
  function check(){
    if(!S.on) return; const now=new Date(), D=dayOf(now), key=D.lp.y+'-'+(D.lp.m+1)+'-'+D.lp.d, nm=D.nm, fri=D.friday;
    P5.forEach(k=>{ const t=D.p[k]; if(t==null||isNaN(t)) return; const c=S.p[k], iq=k==='dhuhr'&&fri?c.friIqama:c.iqama;
      [['pre',t-c.pre.min,c.pre],['adhan',t,c.adhan],['iqama',t+(iq?+iq.min||0:0),iq]].forEach(([kind,at,cfg])=>{
        if(!cfg||!cfg.on) return; const id=k+'.'+kind;
        if(nm>=at&&nm<at+1&&fired[id]!==key){ fired=LS.json(FIRED,{}); if(fired[id]===key) return; fired[id]=key; LS.set(FIRED,JSON.stringify(fired)); fire(kind,k,cfg,fri); } }); });
  }
  setInterval(check,1000);   // runs even when the tab is hidden (the browser slows it; the app on the phone schedules real alerts)
  return {get:()=>S, save, set(fn){ fn(S); save(); Z.emit('alerts'); }, play, ac, mins, SOUNDS, PRE_MIN, IQ_MIN, P5, textOf, defaultsOf:defaults};
})();
window.zijAlerts={get:()=>JSON.parse(JSON.stringify(Alerts.get())),_play:Alerts.play};

/* ==================== the talking clock (beta's «الساعة الناطقة»: 12:00 · 15:00 · 21:00 · a new day; key zijVoiceClock) ==================== */
const Voice = (()=>{
  const KEY='zijVoiceClock', DONE='zijVoiceDone';
  const SLOTS=[{h:12,m:0,s:0,id:'noon',ar:'الساعة الآن الثانية عشرة ظهرًا',en:'It is now twelve noon'},{h:15,m:0,s:0,id:'asr3',ar:'الساعة الآن الثالثة عصرًا',en:'It is now three in the afternoon'},
    {h:21,m:0,s:0,id:'eve9',ar:'الساعة الآن التاسعة مساءً',en:'It is now nine in the evening'},{h:0,m:0,s:2,id:'newday'}];
  const on=()=>LS.get(KEY)==='1';
  function sentence(slot,d){ const D=dayOf(d), wd=L2(WD[D.lp.wd]), hj=EN()?D.h.day+' '+HM[D.h.month-1][1]+' '+D.h.year:D.h.day+' '+HM[D.h.month-1][0]+' '+D.h.year+' للهجرة', gr=EN()?D.lp.d+' '+GM[D.lp.m][1]+' '+D.lp.y:D.lp.d+' '+GM[D.lp.m][0]+' '+D.lp.y+' ميلادي';
    if(slot.id==='newday') return EN()?`A new day has begun: ${wd}, ${hj}, ${gr}. It is midnight.`:`بسم الله. بدأ يوم جديد: ${wd}، ${hj}، الموافق ${gr}. الساعة الآن الثانية عشرة ليلًا.`;
    return (EN()?slot.en:slot.ar)+(EN()?`. Today is ${wd}, ${hj}, ${gr}.`:`. اليوم ${wd}، ${hj}، الموافق ${gr}.`); }
  function speak(t){ if(!('speechSynthesis' in window)) return false; try{ speechSynthesis.cancel(); const vs=speechSynthesis.getVoices().filter(v=>EN()?/^en/i.test(v.lang):/^ar/i.test(v.lang));
      t.split(/(?<=[.،:])\s+/).filter(Boolean).forEach(p=>{ const u=new SpeechSynthesisUtterance(p); u.lang=EN()?'en-US':'ar-SA'; if(vs[0]) u.voice=vs[0]; speechSynthesis.speak(u); }); return true; }catch(e){ return false; } }
  setInterval(()=>{ if(!on()) return; const now=new Date(), D=dayOf(now), t=Math.floor(D.nm*60);
    SLOTS.forEach(s=>{ const at=s.h*3600+s.m*60+s.s, k=s.id+'|'+D.lp.y+'-'+D.lp.m+'-'+D.lp.d; if(t>=at&&t<at+30&&LS.get(DONE)!==k){ LS.set(DONE,k); speak(sentence(s,now)); } }); },1000);
  return {on,set:v=>LS.set(KEY,v?'1':'0'),test:()=>speak(sentence(SLOTS[0],new Date())),ok:()=>'speechSynthesis' in window};
})();

/* ==================== the prayer screen ==================== */
Z.screens.prayer = (()=>{
  const el=$('scr-prayer'); let built=false, mBase='greg', mOff=0, openK=null, monthKey='';
  function build(){
    el.innerHTML=`<div class="pgrid">
  <div class="pcol1">
    <div class="card"><h2 id="pDay"></h2><ul class="times" id="pList"></ul><p class="muted" id="pMethod" style="font-size:13.5px;margin:10px 4px 0"></p></div>
    <div class="card"><h3>${T('غدًا','Tomorrow')} <small id="pTomD"></small></h3><div class="occ" id="pTom"></div></div>
    <div class="card"><h3>${T('المناسبات القادمة','Coming occasions')}</h3><div class="occ" id="pOcc"></div></div>
  </div>
  <div class="pcol2"><div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:12px">
      <h2 id="mTitle" style="margin:0"></h2>
      <div class="row no-print">
        <div class="seg"><button type="button" data-mb="greg">${T('ميلادي','Gregorian')}</button><button type="button" data-mb="hijri">${T('هجري','Hijri')}</button></div>
        <div class="seg"><button type="button" id="mPrev">${EN()?'‹':'›'}</button><button type="button" id="mThis">${T('هذا الشهر','This month')}</button><button type="button" id="mNext">${EN()?'›':'‹'}</button></div>
        <button type="button" class="btn" id="mPrint">${T('اطبع الجدول','Print')}</button>
        <button type="button" class="btn" id="mCopy">${T('انسخ','Copy')}</button>
      </div>
    </div>
    <div class="tablewrap"><table class="month" id="mTable"></table></div>
    <p class="muted" id="mNote" style="font-size:12.5px;margin:10px 2px 0"></p>
  </div></div>
  <div class="pcol3">
    <div class="card alerts" id="pAlerts"></div>
    <div class="card" id="pVoice"></div>
    <div class="card" id="pLog"></div>
    <div class="card" id="pCities"></div>
  </div>
</div>`;
    el.querySelectorAll('[data-mb]').forEach(b=>b.addEventListener('click',()=>{ mBase=b.dataset.mb; mOff=0; monthKey=''; renderMonth(); }));
    $('mPrev').onclick=()=>{ mOff--; monthKey=''; renderMonth(); }; $('mNext').onclick=()=>{ mOff++; monthKey=''; renderMonth(); }; $('mThis').onclick=()=>{ mOff=0; monthKey=''; renderMonth(); };
    $('mPrint').onclick=()=>{ document.body.classList.add('print-month'); setTimeout(()=>{ window.print(); document.body.classList.remove('print-month'); },50); };
    $('mCopy').onclick=()=>copyText(monthText(),T('نُسخ جدول الشهر','Month copied'));
    built=true; renderAlerts(); renderVoice(); renderLog(); renderCities();
  }
  /* --- today, tomorrow, occasions --- */
  function renderToday(now){
    const D=dayOf(now);
    $('pDay').innerHTML=`${T('مواقيت اليوم','Today')} <small>${L2(WD[D.lp.wd])} · ${hijriText(D.h)}</small>`;
    $('pList').innerHTML=timesHTML(D,true);
    const M=observer.activeMethod(), off=D.p.official;
    const est=D.p.polar?T('الشمس عندك اليوم لا تغيب أو لا تشرق، فحُسبت المواقيت على أقرب خط عرض فيه ليل ونهار (٦٥°).','The Sun does not set or rise here today, so the times use the nearest latitude with a day and night (65°).')
      :(D.p.est&&(D.p.est.fajr||D.p.est.isha))?T('الفجر أو العشاء مقدّر اليوم: الشفق عندك لا يغيب.','Fajr or Isha is estimated today: twilight does not end here.'):'';
    $('pMethod').innerHTML=`${T('الطريقة: ','Method: ')}${esc(EN()?M.replace(/_/g,' '):(CALC_NAMES[M]||M))}${observer.calcMethod==='AUTO'?T(' (تلقائي حسب البلد)',' (automatic by country)'):''}`+
      (off?` · <b style="color:var(--teal)">${T('من جدول تقويم أم القرى الرسمي — ','from the official Umm al-Qura table — ')}${esc(EN()?off.en:off.ar)}</b>`:'')+
      ` · <a href="#more" id="pToMore">${T('غيّرها','change')}</a>`+(est?`<br><span style="color:var(--amber)">⚠️ ${est}</span>`:'');
    $('pToMore').onclick=e=>{ e.preventDefault(); go('more',{sec:'calc'}); };
    const pt=D.pt, td=new Date(now.getTime()+864e5), tl=localParts(td);
    $('pTomD').textContent=L2(WD[tl.wd])+' · '+hijriText(D.ht);
    $('pTom').innerHTML=KEYS.map(k=>`<div><span>${pname(k,tl.wd===5)}</span><b class="num">${fmt(pt[k])}</b></div>`).join('');
    if(Math.floor(now.getTime()/36e5)!==renderToday._h||Z.ver!==renderToday._v){ renderToday._h=Math.floor(now.getTime()/36e5); renderToday._v=Z.ver;
      const occ=[[T('رمضان','Ramadan'),9,1],[T('عيد الفطر','Eid al-Fitr'),10,1],[T('الحج (يوم التروية)','Hajj (8 Dhu al-Hijjah)'),12,8],[T('يوم عرفة','Day of Arafah'),12,9],[T('عيد الأضحى','Eid al-Adha'),12,10],[T('رأس السنة الهجرية','Islamic New Year'),1,1],[T('عاشوراء','Ashura'),1,10]];
      const rows=occ.map(([n,m,d])=>{ const k=hijriCal.daysUntilHijri(m,d); return [n,k]; }).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
      const say=k=>k===0?T('اليوم','today'):EN()?(k===1?'tomorrow':'in '+k+' days'):(k===1?'غدًا':'بعد '+dg(k)+' '+(k<=10?'أيام':'يومًا'));
      const wh=D.h.day>=13&&D.h.day<=15?T('اليوم من الأيام البيض','today is one of them'):(D.h.day<13?say(13-D.h.day):T('في الشهر القادم','next month'));
      $('pOcc').innerHTML=rows.map(([n,k])=>`<div><span>${n}</span><b>${say(k)}</b></div>`).join('')+`<div><span>${T('الأيام البيض (١٣–١٥)','White Days (13–15)')}</span><b>${wh}</b></div>`;
    }
  }
  /* --- the month table --- */
  function monthDays(now){
    const lp=localParts(now), out=[];
    if(mBase==='greg'){ const y=lp.y+Math.floor((lp.m+mOff)/12), m=((lp.m+mOff)%12+12)%12, n=new Date(Date.UTC(y,m+1,0)).getUTCDate();
      for(let d=1;d<=n;d++) out.push({y,m,d}); return {title:L2(GM[m])+' '+dg(y),days:out}; }
    // Hijri: walk from today to the first day of the wanted month, then to its end
    let t=Date.UTC(lp.y,lp.m,lp.d,12), h=hijriCal.fromGregorian(new Date(t)); let target=h.month+mOff, ty=h.year+Math.floor((target-1)/12); target=((target-1)%12+12)%12+1;
    let guard=0; while(!(h.year===ty&&h.month===target&&h.day===1)&&guard<800){ t+=(h.year*12+h.month<ty*12+target||(h.year===ty&&h.month===target))?(h.year===ty&&h.month===target?-864e5:864e5):-864e5; h=hijriCal.fromGregorian(new Date(t)); guard++; }
    while(h.month===target&&guard<900){ const g=new Date(t); out.push({y:g.getUTCFullYear(),m:g.getUTCMonth(),d:g.getUTCDate()}); t+=864e5; h=hijriCal.fromGregorian(new Date(t)); guard++; }
    return {title:L2(HM[target-1])+' '+dg(ty)+T(' هـ',' AH'),days:out};
  }
  function monthRows(now){
    const {title,days}=monthDays(now), today=localParts(new Date());
    return {title,rows:days.map(x=>{ const ref=new Date(Date.UTC(x.y,x.m,x.d,12)), at=new Date(epochOfLocal({y:x.y,m:x.m,d:x.d},720,ref)), h=hijriCal.fromGregorian(at), p=observer.realPrayerTimes(at,h), wd=new Date(Date.UTC(x.y,x.m,x.d)).getUTCDay();
      return {x,h,p,wd,today:x.y===today.y&&x.m===today.m&&x.d===today.d}; })};
  }
  function renderMonth(){
    if(!built) return; const now=new Date(), key=mBase+mOff+'|'+Z.ver+'|'+localParts(now).d; if(key===monthKey) return; monthKey=key;
    el.querySelectorAll('[data-mb]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mb===mBase)));
    const {title,rows}=monthRows(now); $('mTitle').textContent=title;
    const heads=[T('اليوم','Day'),mBase==='greg'?T('هجري','Hijri'):T('ميلادي','Gregorian'),...KEYS.map(k=>pname(k))];
    $('mTable').innerHTML=`<thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>`+rows.map(r=>{
      const dname=EN()?WD[r.wd][1].slice(0,3):WD[r.wd][0], other=mBase==='greg'?dg(r.h.day)+' '+(EN()?HM[r.h.month-1][1].split(' ')[0]:HM[r.h.month-1][0]):dg(r.x.d)+' '+L2(GM[r.x.m]);
      const first=mBase==='greg'?dg(r.x.d):dg(r.h.day);
      return `<tr class="${r.wd===5?'fri':''}${r.today?' today':''}"><td class="d"><b class="num">${first}</b> <small>${dname}</small></td><td style="font-family:var(--f-ui)">${other}</td>${KEYS.map(k=>`<td>${fmt(r.p[k],false)}</td>`).join('')}</tr>`; }).join('')+'</tbody>';
    $('mNote').textContent=T('الأوقات بحسب موقعك وطريقة الحساب المختارة · يوم الجمعة مظلل · اليوم بالذهبي','Times for your place and chosen method · Fridays shaded · today in gold');
    const tr=$('mTable').querySelector('tr.today'); if(tr&&mOff===0) tr.scrollIntoView({block:'nearest'});
  }
  function monthText(){ const {title,rows}=monthRows(new Date()); return [T('مواقيت الصلاة — ','Prayer times — ')+title+' · '+placeName(),...rows.map(r=>(mBase==='greg'?r.x.d:r.h.day)+' '+L2(WD[r.wd])+' | '+KEYS.map(k=>pname(k)+' '+fmt(r.p[k])).join(' | '))].join('\n'); }
  /* --- alerts settings --- */
  function renderAlerts(){
    const box=$('pAlerts'), S=Alerts.get(), sel=(id,list,val,lab)=>`<select data-k="${id}">${list.map(v=>`<option value="${v}"${String(v)===String(val)?' selected':''}>${lab(v)}</option>`).join('')}</select>`;
    const snd=(id,val,keys)=>sel(id,keys,val,v=>L2(Alerts.SOUNDS[v]));
    const sw=(id,on,lab)=>`<span class="switch"><input type="checkbox" data-k="${id}"${on?' checked':''} aria-label="${esc(lab)}"><i></i></span>`;
    const chip=(on,txt)=>`<span class="tag${on?' teal':''}">${txt}</span>`;
    const canAsk='Notification' in window&&Notification.permission==='default';
    const fri=new Date(clock.now().getTime()+tzh(new Date())*36e5).getUTCDay()===5;
    box.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">${T('التنبيهات','Alerts')}</h2>${sw('master',S.on,T('كل التنبيهات','All alerts'))}</div>
<p class="muted" style="font-size:13.5px;margin:8px 0 4px">${T('لكل صلاة ثلاثة تنبيهات: قبل الأذان، والأذان، والإقامة. تعمل ما دامت هذه الصفحة مفتوحة؛ والتنبيه والجهاز مقفول يأتي مع تطبيق الزيج.','Each prayer has three alerts: before the adhan, the adhan, and the iqamah. They work while this page is open; alerts with the device locked come with the Al-Zij app.')}</p>
<p class="muted" style="font-size:12.5px;margin:0 0 6px">${T('لا تسمع الصوت؟ المس الصفحة مرة، وتأكد أن الجهاز ليس على الصامت وأن صوت الوسائط مرتفع.','No sound? Touch the page once, and check the device is not on silent and the media volume is up.')}</p>
${canAsk?`<button type="button" class="btn" id="aNotif">${T('اسمح بإشعارات المتصفح','Allow browser notifications')}</button>`:''}
<div class="${S.on?'':'dim'}">`+Alerts.P5.map(k=>{ const c=S.p[k], name=pname(k,k==='dhuhr'&&fri);
  const f=c.friIqama;
  return `<details class="pr" data-p="${k}"${openK===k?' open':''}><summary><b>${name}</b><span class="chips">${chip(c.pre.on,T('قبل ','Before ')+(c.pre.on?Alerts.mins(c.pre.min):'—'))}${chip(c.adhan.on,T('الأذان','Adhan')+(c.adhan.on?'':' —'))}${chip(c.iqama.on,T('الإقامة ','Iqamah ')+(c.iqama.on?Alerts.mins(c.iqama.min):'—'))}${f?chip(f.on,T('إقامة الجمعة ','Friday iqamah ')+(f.on?Alerts.mins(f.min):'—')):''}</span></summary>
<div class="blk"><div class="bh"><span>① ${T('قبل الأذان','Before the adhan')}<small>${T('تذكير يسبق الأذان','A reminder ahead of the adhan')}</small></span>${sw(k+'.pre.on',c.pre.on,T('قبل الأذان','Before the adhan'))}</div>
<div class="rw${c.pre.on?'':' dim'}"><label>${T('قبله بـ','Ahead by')}</label>${sel(k+'.pre.min',Alerts.PRE_MIN,c.pre.min,Alerts.mins)}</div>
<div class="rw${c.pre.on?'':' dim'}"><label>${T('الصوت','Sound')}</label>${snd(k+'.pre.snd',c.pre.snd,['soft','bell','brass','silent'])}<button type="button" class="btn ghost" data-try="${c.pre.snd}">🔊 ${T('جرّب','Test')}</button></div></div>
<div class="blk"><div class="bh"><span>② ${T('الأذان','The adhan')}<small>${T('عند دخول الوقت','When the time begins')}</small></span>${sw(k+'.adhan.on',c.adhan.on,T('الأذان','The adhan'))}</div>
<div class="rw${c.adhan.on?'':' dim'}"><label>${T('الصوت','Sound')}</label>${snd(k+'.adhan.snd',c.adhan.snd,['brass','bell','soft','silent'])}<button type="button" class="btn ghost" data-try="${c.adhan.snd}">🔊 ${T('جرّب','Test')}</button></div></div>
<div class="blk"><div class="bh"><span>③ ${T('الإقامة','The iqamah')}<small>${f?T('بعد الأذان بمدة تختارها، في غير الجمعة','A set time after the adhan, except on Friday'):T('بعد الأذان بمدة تختارها','A set time after the adhan')}</small></span>${sw(k+'.iqama.on',c.iqama.on,T('الإقامة','The iqamah'))}</div>
<div class="rw${c.iqama.on?'':' dim'}"><label>${T('بعده بـ','After by')}</label>${sel(k+'.iqama.min',Alerts.IQ_MIN,c.iqama.min,Alerts.mins)}</div>
<div class="rw${c.iqama.on?'':' dim'}"><label>${T('الصوت','Sound')}</label>${snd(k+'.iqama.snd',c.iqama.snd,['bell','soft','brass','silent'])}<button type="button" class="btn ghost" data-try="${c.iqama.snd}">🔊 ${T('جرّب','Test')}</button></div></div>
${f?`<div class="blk"><div class="bh"><span>④ ${T('إقامة يوم الجمعة','The iqamah on Friday')}<small>${T('مطفأة في الأصل: الإمام يقيم الصلاة في المسجد','Off by default: the imam calls the iqamah in the mosque')}</small></span>${sw(k+'.friIqama.on',f.on,T('إقامة يوم الجمعة','The iqamah on Friday'))}</div>
<div class="rw${f.on?'':' dim'}"><label>${T('بعده بـ','After by')}</label>${sel(k+'.friIqama.min',Alerts.IQ_MIN,f.min,Alerts.mins)}</div>
<div class="rw${f.on?'':' dim'}"><label>${T('الصوت','Sound')}</label>${snd(k+'.friIqama.snd',f.snd,['bell','soft','brass','silent'])}<button type="button" class="btn ghost" data-try="${f.snd}">🔊 ${T('جرّب','Test')}</button></div>
<p class="muted" style="font-size:12.5px;margin:6px 0 0">${T('فعّلها إن كنت تصلي خارج المسجد. وقت الأذان لا يتغير.','Turn it on if you pray away from a mosque. The adhan time does not change.')}</p></div>`:''}
<button type="button" class="btn ghost" data-all="${k}">${T('طبّق إعدادات '+name+' على كل الصلوات','Apply '+name+'’s settings to all prayers')}</button></details>`; }).join('')+`</div>`;
    box.querySelector('[data-k="master"]').addEventListener('change',e=>{ Alerts.set(S=>{ S.on=e.target.checked; }); Alerts.ac(); if(e.target.checked) Alerts.play('bell'); renderAlerts(); });
    const nb=$('aNotif'); if(nb) nb.onclick=()=>{ try{ Notification.requestPermission().then(renderAlerts); }catch(e){} };
    box.querySelectorAll('details[data-p]').forEach(d=>d.addEventListener('toggle',()=>{ if(d.open) openK=d.dataset.p; else if(openK===d.dataset.p) openK=null; }));
    box.querySelectorAll('[data-k]:not([data-k="master"])').forEach(x=>x.addEventListener('change',()=>{ const [k,kind,f]=x.dataset.k.split('.');
      Alerts.set(S=>{ S.p[k][kind][f]=x.type==='checkbox'?x.checked:(f==='min'?+x.value:x.value); }); openK=k; if(x.type==='checkbox'&&x.checked) Alerts.ac(); if(f==='snd') Alerts.play(x.value); renderAlerts(); }));
    box.querySelectorAll('[data-try]').forEach(b=>b.onclick=()=>{ Alerts.ac(); Alerts.play(b.dataset.try); });
    box.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>{ Alerts.set(S=>{ const src=S.p[b.dataset.all];
      Alerts.P5.forEach(k=>{ if(k===b.dataset.all) return; const keepIq=S.p[k].iqama.min, keepFri=S.p[k].friIqama; S.p[k]=JSON.parse(JSON.stringify(src)); S.p[k].iqama.min=src.iqama.min||keepIq; delete S.p[k].friIqama; if(keepFri) S.p[k].friIqama=keepFri; }); });
      renderAlerts(); toast(T('طُبّقت على كل الصلوات','Applied to all prayers')); });
  }
  /* --- talking clock --- */
  function renderVoice(){
    const box=$('pVoice');
    box.innerHTML=`<div class="row" style="justify-content:space-between"><h3 style="margin:0">${T('الساعة الناطقة','Talking clock')}</h3><span class="switch"><input type="checkbox" id="vOn" ${Voice.on()?'checked':''} aria-label="${T('الساعة الناطقة','Talking clock')}"><i></i></span></div>
<p class="muted" style="font-size:13.5px;margin:8px 0">${T('صوت يعلن الوقت والتاريخ: ١٢ ظهرًا، و٣ عصرًا، و٩ مساءً، وبداية اليوم الجديد — ما دامت الصفحة مفتوحة.','A voice announces the time and date at 12 noon, 3 pm, 9 pm and the start of a new day — while the page is open.')}</p>
<button type="button" class="btn" id="vTest" ${Voice.ok()?'':'disabled'}>🔊 ${T('اسمع مثالًا','Hear a sample')}</button>`;
    $('vOn').onchange=e=>Voice.set(e.target.checked); $('vTest').onclick=()=>{ if(!Voice.test()) toast(T('المتصفح لا يدعم النطق','This browser cannot speak')); };
  }
  /* --- the adhan-moment log (beta's recorder: same entries, same references, same offsets) --- */
  let pending=null, logOpen=false;
  function renderLog(){
    const box=$('pLog'), ctrl=LS.json('zijAdhanCtrl',{}), log=alLoad(), off=alLoadOffsets();
    const src=ctrl.src||'mosque', pr=ctrl.prayer||'auto', react=ctrl.react!=null?ctrl.react:0;
    const sign=s=>`<bdi dir="ltr" class="num">${s>=0?'+':'−'}${dg(Math.abs(s).toFixed(1))}</bdi>`;
    const tstr=ts=>{ const d=new Date(ts); let h=d.getHours(); const ap=EN()?(h<12?'AM':'PM'):(h<12?'ص':'م'); h=h%12||12; return `<bdi dir="ltr" class="num">${dg(two(h)+':'+two(d.getMinutes())+':'+two(d.getSeconds())+'.'+Math.floor(d.getMilliseconds()/100))}</bdi> ${ap}`; };
    const g={}; log.forEach(e=>{ const k=e.prayer+'|'+e.src; (g[k]=g[k]||[]).push(e.diff); });
    box.innerHTML=`<details ${logOpen?'open':''} id="lgD"><summary style="cursor:pointer;list-style:none"><h3 style="margin:0">${T('سجل الأذان','Adhan log')} <small>${T('لحظة الأذان بالثانية مقارنة بالمرجع','the adhan moment to the second, against the reference')}</small></h3></summary>
<div style="margin-top:10px">
<div class="row"><label class="muted">${T('الصلاة','Prayer')}</label><select id="lgP"><option value="auto">${T('تلقائي (الأقرب)','Automatic (nearest)')}</option>${AL_PRAYERS.map(([k])=>`<option value="${k}"${pr===k?' selected':''}>${pname(k)}</option>`).join('')}</select>
<label class="muted">${T('المصدر','Source')}</label><select id="lgS">${Object.entries(AL_SOURCES).map(([k,v])=>`<option value="${k}"${src===k?' selected':''}>${EN()?{haram_dish:'Haram (satellite)',haram_net:'Haram (internet)',clock:'Haramain clock (Makkah)',mosque:'Local mosque',other:'Other'}[k]:v[0]}</option>`).join('')}</select>
<label class="muted">${T('زمن ردة الفعل (ث)','Reaction (s)')}</label><input type="number" id="lgR" min="0" max="2" step="0.1" value="${react}" style="width:80px"></div>
<div class="row" style="margin-top:10px"><button type="button" class="btn gold" id="lgStart">${T('● بداية الأذان','● Adhan starts')}</button><button type="button" class="btn" id="lgEnd">${T('■ نهاية الأذان','■ Adhan ends')}</button><button type="button" class="btn ghost" id="lgUndo">${T('تراجع','Undo')}</button></div>
<p id="lgMsg" style="font-size:13.5px;margin:8px 0" aria-live="polite"></p>
${log.length?`<div class="tablewrap" style="max-height:220px"><table class="month"><thead><tr><th>${T('التاريخ','Date')}</th><th>${T('الصلاة','Prayer')}</th><th>${T('اللحظة','Moment')}</th><th>${T('الفرق (ث)','Δ (s)')}</th></tr></thead><tbody>${log.slice(-12).reverse().map(e=>`<tr><td>${dg(new Date(e.ts).toISOString().slice(0,10))}</td><td style="font-family:var(--f-ui)">${pname(e.prayer)}</td><td>${tstr(e.ts)}</td><td>${sign(e.diff)}</td></tr>`).join('')}</tbody></table></div>
<h3 style="font-size:15px;margin:14px 0 6px">${T('الملخص','Summary')}</h3><div class="occ">${Object.keys(g).sort().map(k=>{ const [p,s]=k.split('|'),a=g[k],mean=a.reduce((x,y)=>x+y,0)/a.length; return `<div><span>${pname(p)} · ${esc((AL_SOURCES[s]||[s])[0])} (${dg(a.length)})</span><b>${T('متوسط ','mean ')}${sign(mean)} · ${T('وسيط ','median ')}${sign(alMedian(a))}</b></div>`; }).join('')}</div>`:`<p class="muted">${T('لا توجد تسجيلات بعد.','No records yet.')}</p>`}
<p style="font-size:13.5px;margin:12px 0 6px">${Object.keys(off).length?T('التعويض الحالي على المواقيت: ','Offsets now applied: ')+Object.keys(off).map(k=>pname(k)+' '+sign(off[k])+T('ث','s')).join(' · '):T('لا يوجد تعويض مطبّق — المواقيت على الحساب المباشر.','No offset applied — the times are as calculated.')}</p>
<div class="row"><button type="button" class="btn" id="lgApply" ${log.length?'':'disabled'}>${T('طبّق المتوسط على المواقيت','Apply the means to the times')}</button><button type="button" class="btn" id="lgClearOff">${T('أزل التعويض','Remove offsets')}</button><button type="button" class="btn ghost" id="lgCopy" ${log.length?'':'disabled'}>${T('انسخ السجل','Copy the log')}</button><button type="button" class="btn ghost" id="lgClear" ${log.length?'':'disabled'}>${T('امسح السجل','Clear the log')}</button></div>
</div></details>`;
    $('lgD').addEventListener('toggle',e=>{ logOpen=e.target.open; });
    const saveCtrl=()=>LS.set('zijAdhanCtrl',JSON.stringify({prayer:$('lgP').value,src:$('lgS').value,react:$('lgR').value}));
    ['lgP','lgS','lgR'].forEach(id=>$(id).addEventListener('change',saveCtrl));
    $('lgStart').onclick=()=>{ const r=Math.max(0,Math.min(2,parseFloat($('lgR').value)||0)), ts=Date.now()-Math.round(r*1000), s=$('lgS').value, sel=$('lgP').value;
      const obs=alObserverFor(s), {ref,alts}=alRefTimes(ts,obs); let p=sel;
      if(sel==='auto'){ let best=null,bd=Infinity; AL_PRAYERS.forEach(([k])=>{ const d=Math.abs(ts-ref[k]); if(d<bd){bd=d;best=k;} }); p=bd<45*6e4?best:null; }
      if(!p){ $('lgMsg').textContent=T('⚠️ لم أحدد الصلاة: اللحظة بعيدة أكثر من ٤٥ دقيقة عن أي أذان. اختر الصلاة من القائمة.','⚠️ No prayer within 45 minutes of now. Choose the prayer from the list.'); return; }
      const e={ts,prayer:p,src:s,city:obs===observer?'me':'makkah',lat:+obs.lat.toFixed(4),lon:+obs.lon.toFixed(4),react:r,diff:+((ts-ref[p])/1000).toFixed(1),alts:{}};
      (p==='fajr'?['فجر 19°','فجر 19.5°','فجر 18°']:p==='isha'?['عشاء 17°','عشاء 17.5°']:[]).forEach(k=>{ e.alts[k]=+((ts-alts[k])/1000).toFixed(1); });
      const L=alLoad(); L.push(e); alSave(L); pending={ts,prayer:p,index:L.length-1}; renderLog();
      $('lgMsg').innerHTML=T('✅ بداية ','✅ ')+pname(p)+T(' عند ',' started at ')+tstr(ts)+T(' — الفرق عن المرجع ',' — difference ')+sign(e.diff)+T(' ثانية',' s'); };
    $('lgEnd').onclick=()=>{ if(!pending){ $('lgMsg').textContent=T('⚠️ اضغط «بداية الأذان» أولًا.','⚠️ Press «Adhan starts» first.'); return; }
      const dur=+((Date.now()-pending.ts)/1000).toFixed(1), L=alLoad(), e=L[pending.index]; if(e&&e.ts===pending.ts){ e.durationSec=dur; alSave(L); }
      const p=pending.prayer; pending=null; renderLog(); $('lgMsg').innerHTML=T('⏹ انتهى ','⏹ ')+pname(p)+T(' — المدة ',' — duration ')+dg(dur.toFixed(1))+T(' ثانية',' s'); };
    $('lgUndo').onclick=()=>{ const L=alLoad(); if(!L.length) return; L.pop(); alSave(L); pending=null; renderLog(); };
    $('lgApply').onclick=()=>{ const L=alLoad(), g2={}; L.forEach(e=>{ (g2[e.prayer]=g2[e.prayer]||[]).push(e.diff); }); const o={}; Object.keys(g2).forEach(p=>{ const a=g2[p]; o[p]=+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1); });
      alSaveOffsets(o); settingsChanged(); renderLog(); toast(T('طُبّق التعويض','Offsets applied')); };
    $('lgClearOff').onclick=()=>{ alSaveOffsets({}); settingsChanged(); renderLog(); };
    $('lgCopy').onclick=()=>{ const L=alLoad(); copyText(['سجل الأذان — الزيج','الصلاة | المصدر | التاريخ | اللحظة | الفرق(ث) | بدائل | رد الفعل | مدة',...L.map(e=>{ const d=new Date(e.ts); return [pname(e.prayer),(AL_SOURCES[e.src]||[e.src])[0],d.toISOString().slice(0,10),two(d.getHours())+':'+two(d.getMinutes())+':'+two(d.getSeconds()),(e.diff>=0?'+':'')+e.diff,Object.keys(e.alts||{}).map(k=>k+'='+e.alts[k]).join(';')||'-',e.react||0,e.durationSec!=null?e.durationSec+'ث':'-'].join(' | '); })].join('\n')); };
    $('lgClear').onclick=()=>{ if(confirm(T('هل تريد مسح كل تسجيلات الأذان؟','Clear all adhan records?'))){ alSave([]); pending=null; renderLog(); } };
  }
  /* --- Saudi cities today (beta's «شارك مواقيت مدن المملكة»), from the official tables --- */
  let cityData=null;
  async function renderCities(){
    const box=$('pCities');
    box.innerHTML=`<h3>${T('مدن المملكة اليوم','Saudi cities today')} <small>${T('من جداول أم القرى الرسمية','official Umm al-Qura tables')}</small></h3><div id="ctT" class="muted">${T('جارٍ القراءة…','Reading…')}</div>`;
    try{ const y=localParts(new Date()).y; if(!cityData||cityData.y!==y){ const j=await (await fetch('data/uq/'+y+'.json')).json(); cityData={y,j}; }
      const j=cityData.j, lp=localParts(new Date()), doy=Math.round((Date.UTC(lp.y,lp.m,lp.d)-Date.UTC(lp.y,0,1))/864e5);
      const ids=[1002,1003,1001,74,1005,1004,1006,1007,1008,1010,1011,1012,1009,1013,109];
      const cities=j.cities||j, idx=UQI?Object.fromEntries(UQI.cities.map(c=>[c[0],c])):{};
      const pick=ids.map(String).filter(id=>cities[id]);
      const list=pick.map(id=>{ const c=idx[id]; const row=cities[id][doy]; return {n:c?(EN()?c[4]:c[3]):id,t:String(row).split(' ')}; });
      const mm=s=>{ const [a,b]=s.split(':').map(Number); return a*60+b; };
      $('ctT').innerHTML=`<div class="tablewrap" style="max-height:none"><table class="month"><thead><tr><th>${T('المدينة','City')}</th>${['fajr','dhuhr','asr','maghrib','isha'].map(k=>`<th>${pname(k)}</th>`).join('')}</tr></thead><tbody>${list.map(r=>`<tr><td class="d">${esc(r.n)}</td>${[0,2,3,4,5].map(i=>`<td>${r.t[i]?fmt(mm(r.t[i]),false):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<div class="row" style="margin-top:10px"><button type="button" class="btn" id="ctCopy">${T('انسخ للمشاركة','Copy to share')}</button></div>`;
      $('ctCopy').onclick=()=>copyText([T('مواقيت الصلاة اليوم — ','Prayer times today — ')+hijriText(dayOf(new Date()).h),...list.map(r=>r.n+': '+[0,2,3,4,5].map((i,q)=>pname(['fajr','dhuhr','asr','maghrib','isha'][q])+' '+fmt(mm(r.t[i]),true)).join(' · ')),'alzijapp.com'].join('\n'));
    }catch(e){ $('ctT').textContent=T('تعذّرت قراءة الجداول الآن.','The tables could not be read now.'); }
  }
  Z.on('tick',now=>{ if(document.body.dataset.scr!=='prayer'||!built) return; renderToday(new Date()); renderMonth(); });
  Z.on('alerts',()=>{ if(built) renderAlerts(); });
  Z.on('settings',()=>{ monthKey=''; if(built){ renderAlerts(); renderLog(); } });
  Z.on('place',()=>{ monthKey=''; });
  return {show(){ if(!built) build(); monthKey=''; }};
})();
