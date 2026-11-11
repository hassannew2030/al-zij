'use strict';
/* ===== The two clocks, drawn from zero =====
   «الساعة البسيطة» — a day dial: the whole day on one ring (noon on top, midnight at the bottom), every prayer a coloured period,
     the Sun riding the ring where it is now, the Moon on tonight's night of the Hijri month, the sky window and three hands.
   «الزيج الكبرى» — the full astronomical clock: world time in 24 cities, the Hijri and Gregorian years, the zodiac and the 28 lunar
     mansions, the day and night with the prayers, the Moon and the five planets at their true places, the stars and the qibla round a
     live Earth, and four complications (equation of time, moonlight, the weekday, a tourbillon).
   All numbers come from the engine (engine.js, beta's code). The drawing is redone once a minute; the hands move every second. */

const D2R = Math.PI/180;
const pol = (c,a,r)=>[c+r*Math.sin(a*D2R), c-r*Math.cos(a*D2R)];
const f1 = x=>(+x).toFixed(1);
const nrm = a=>((a%360)+360)%360;
const m1440 = m=>((m%1440)+1440)%1440;
function sector(c,a1,a2,r1,r2){
  let d=a2-a1; while(d<0) d+=360; if(d>359.95) d=359.95;
  const L=d>180?1:0, [x1,y1]=pol(c,a1,r2),[x2,y2]=pol(c,a1+d,r2),[x3,y3]=pol(c,a1+d,r1),[x4,y4]=pol(c,a1,r1);
  return `M${f1(x1)} ${f1(y1)}A${r2} ${r2} 0 ${L} 1 ${f1(x2)} ${f1(y2)}L${f1(x3)} ${f1(y3)}A${r1} ${r1} 0 ${L} 0 ${f1(x4)} ${f1(y4)}Z`;
}
function arcD(c,a1,a2,r){ let d=a2-a1; while(d<0) d+=360; if(d>359.95) d=359.95; const [x1,y1]=pol(c,a1,r),[x2,y2]=pol(c,a1+d,r); return `M${f1(x1)} ${f1(y1)}A${r} ${r} 0 ${d>180?1:0} 1 ${f1(x2)} ${f1(y2)}`; }
const ring = (c,r,stroke,w,extra='')=>`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
function word(c,a,r,str,size,fill,cls='',extra=''){   // a word laid along the ring and kept upright (never textPath: Safari breaks Arabic on paths)
  const [x,y]=pol(c,a,r), n=nrm(a), rot=(n>90&&n<270)?n-180:n;
  return `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" dy=".35em" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${esc(str)}</text>`;
}
const tAttr = s=>esc(s).replace(/\n/g,'&#10;');

/* shared paint: a Moon with soft maria and its true phase; a Sun with rays */
const MARIA=[[-.28,-.22,.26,.2],[.18,-.32,.2,.15],[.05,.1,.3,.22],[-.3,.28,.16,.12],[.32,.22,.14,.11],[-.05,-.05,.1,.08]];
function moonG(r,ph,dark='#05070f'){
  let s=`<circle r="${r}" fill="url(#gMoon)"/>`;
  s+=MARIA.map(([x,y,a,b])=>`<ellipse cx="${f1(x*r)}" cy="${f1(y*r)}" rx="${f1(a*r)}" ry="${f1(b*r)}" fill="#8f99ad" fill-opacity=".28"/>`).join('');
  if(ph&&ph.illum<0.995){ const pd=Ephemeris.moonDarkPath(r,ph.illum,ph.waxing); s+=`<path d="${pd.d}" fill="${dark}" fill-opacity=".88" ${pd.flip?'transform="scale(-1 1)"':''}/>`; }
  return s+`<circle r="${r}" fill="none" stroke="rgba(226,232,246,.45)" stroke-width="${Math.max(.6,r/24).toFixed(2)}"/>`;
}
function sunG(r,lit=true){
  const rays=Array.from({length:12},(_,k)=>{ const q=k*30*D2R,a=r*1.28,b=r*(k%2?1.55:1.75); return `<line x1="${f1(a*Math.sin(q))}" y1="${f1(-a*Math.cos(q))}" x2="${f1(b*Math.sin(q))}" y2="${f1(-b*Math.cos(q))}"/>`; }).join('');
  return (lit?`<circle r="${r*3}" fill="url(#gGlow)"/>`:'')+`<g stroke="${lit?'#ffd36b':'#9c8150'}" stroke-width="${f1(r/5)}" stroke-linecap="round">${rays}</g><circle r="${r}" fill="${lit?'url(#gSun)':'#7d6840'}"/>`;
}
const SVG_DEFS = `<radialGradient id="gMoon" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3e8f3"/><stop offset="1" stop-color="#a9b2c6"/></radialGradient>
<radialGradient id="gSun"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffd76a"/><stop offset="1" stop-color="#f09a3a"/></radialGradient>
<radialGradient id="gGlow"><stop offset="0" stop-color="#ffd36b" stop-opacity=".55"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7b0"/><stop offset=".5" stop-color="#e2b45e"/><stop offset="1" stop-color="#8a6526"/></linearGradient>
<linearGradient id="gSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#c9d2e6"/><stop offset="1" stop-color="#7d889f"/></linearGradient>
<filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>`;

/* the colours of the day: from each prayer to the next */
const PCOL = {fajr:'#7262da', sunrise:'#dccfa0', dhuhr:'#f2c46d', asr:'#f09a4b', maghrib:'#e0607e', isha:'#27346c'};
const PERIOD = {fajr:['وقت الفجر','Fajr time'], sunrise:['الضحى (بعد الشروق)','Duha (after sunrise)'], dhuhr:['وقت الظهر','Dhuhr time'], asr:['وقت العصر','Asr time'], maghrib:['وقت المغرب','Maghrib time'], isha:['الليل · العشاء','Night · Isha']};
function prIcon(k,s=18){   // small prayer marks, the same everywhere
  const S=s/18;
  const m={
    fajr:`<path d="M-7 4.5H7M-4.5 1.5 0-8 4.5 1.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,
    sunrise:`<path d="M-7 3H7M-5 3A5 5 0 0 1 5 3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M0-8V-5.5M-6-5.5l1.5 1.5M6-5.5 4.5-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
    dhuhr:`<circle r="4.6" fill="currentColor"/><path d="M0-8.5v2M0 6.5v2M-8.5 0h2M6.5 0h2M-6-6l1.4 1.4M4.6 4.6 6 6M-6 6l1.4-1.4M4.6-4.6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    asr:`<circle cx="-2" cy="-2" r="4.2" fill="currentColor"/><path d="M0 0 8 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
    maghrib:`<path d="M-6.5 1A6.5 6.5 0 0 1 6.5 1Z" fill="currentColor"/><path d="M-8.5 1.5H8.5M-5 5H5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
    isha:`<path d="M2.5-7A7 7 0 1 0 7 2.5 5.5 5.5 0 0 1 2.5-7Z" fill="currentColor"/><path d="M-5-5l.8 1.6 1.6.8-1.6.8L-5-.2l-.8-1.6-1.6-.8 1.6-.8Z" fill="currentColor"/>`,
    duha:`<circle r="3.8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M0-8v2M0 6v2M-8 0h2M6 0h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    third:`<path d="M2.5-7A7 7 0 1 0 7 2.5 5.5 5.5 0 0 1 2.5-7Z" fill="none" stroke="currentColor" stroke-width="1.7"/>`
  };
  return `<g transform="scale(${S})">${m[k]||m.dhuhr}</g>`;
}
const prIconSVG = (k,cls='ic')=>`<svg class="${cls}" viewBox="-10 -10 20 20" aria-hidden="true">${prIcon(k)}</svg>`;

/* pointer → angle on a dial (degrees clockwise from up) */
function svgAngle(svg,c,e){
  const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const q=pt.matrixTransform(svg.getScreenCTM().inverse());
  return {a:nrm(Math.atan2(q.x-c,c-q.y)/D2R), r:Math.hypot(q.x-c,q.y-c), x:q.x, y:q.y};
}
/* hover tips for anything carrying data-tip */
function wireTips(svg){
  svg.addEventListener('pointermove',e=>{ const t=e.target.closest('[data-tip]'); if(t&&e.pointerType!=='touch') tip.show(t.getAttribute('data-tip'),e.clientX,e.clientY); else tip.hide(); });
  svg.addEventListener('pointerleave',()=>tip.hide());
}
/* time travel by keyboard on a focused dial */
function travelKeys(e){
  const now=clock.now(), step=e.shiftKey?60:10; let d=null;
  if(e.key==='ArrowRight'||e.key==='ArrowUp') d=step*6e4; else if(e.key==='ArrowLeft'||e.key==='ArrowDown') d=-step*6e4;
  else if(e.key==='PageUp') d=864e5; else if(e.key==='PageDown') d=-864e5;
  else if(e.key==='Home'){ clock.set(null); e.preventDefault(); return; }
  if(d!=null){ clock.set(now.getTime()+d); e.preventDefault(); }
}

/* ====================================================================== */
/* «الساعة البسيطة» */
const SimpleDial = (()=>{
  const C=500, RB=[322,374], RL=[309,316], RM=[248,296], RN=[198,240], RF=190;
  let svg=null, gS, gH, lastKey='', drag=null;
  const d24=()=>LS.get('zijDial24')!=='0';     // beta's own key (24 h by default)
  const ang=m=>180+m1440(m)/1440*360;          // the day: noon on top, midnight at the bottom
  function mount(host){
    host.innerHTML=`<svg class="svgd" viewBox="-40 -40 1080 1080" role="img" tabindex="0"><defs>${SVG_DEFS}
<radialGradient id="sFace" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1b2446"/><stop offset=".7" stop-color="#0b1022"/><stop offset="1" stop-color="#070a16"/></radialGradient>
<radialGradient id="sSheen" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="#fff" stop-opacity="0"/><stop offset=".94" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="sFaceClip"><circle cx="${C}" cy="${C}" r="${RF-6}"/></clipPath></defs>
<circle cx="${C}" cy="${C}" r="${RB[1]+30}" fill="rgba(6,9,20,.55)"/>
<g id="sStatic"></g><g id="sHands"></g></svg>`;
    svg=host.querySelector('svg'); gS=svg.querySelector('#sStatic'); gH=svg.querySelector('#sHands');
    gH.innerHTML=`<g class="hand" id="sHour"><path d="M${C-7} ${C+26}L${C-3.2} ${C-128}L${C} ${C-140}L${C+3.2} ${C-128}L${C+7} ${C+26}Z" fill="url(#gGold)"/><g id="sHourSun" transform="translate(${C} ${C-150})">${sunG(7)}</g></g>
<g class="hand" id="sMin"><path d="M${C-4.5} ${C+30}L${C-1.8} ${C-168}L${C} ${C-176}L${C+1.8} ${C-168}L${C+4.5} ${C+30}Z" fill="url(#gSilver)"/></g>
<g class="hand" id="sSec"><line x1="${C}" y1="${C+44}" x2="${C}" y2="${C-180}" stroke="#ff7a6e" stroke-width="2.2" stroke-linecap="round"/><circle cx="${C}" cy="${C+44}" r="6" fill="#ff7a6e"/></g>
<circle cx="${C}" cy="${C}" r="11" fill="url(#gGold)" stroke="#5c4418" stroke-width="1.2"/><circle cx="${C}" cy="${C}" r="3.6" fill="#ff7a6e"/>`;
    ['sHour','sMin','sSec'].forEach(id=>{ const g=svg.querySelector('#'+id); g.style.transformOrigin=`${C}px ${C}px`; });
    wireTips(svg);
    svg.addEventListener('keydown',travelKeys);
    svg.addEventListener('pointerdown',e=>{
      if(e.target.closest('#sMoon')) return;
      const q=svgAngle(svg,C,e); if(q.r<RF-4||q.r>RB[1]+8) return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}; svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id) return;
      if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5) return;
      drag.moved=true; tip.hide(); setFromAngle(svgAngle(svg,C,e).a);
    });
    const end=e=>{ if(!drag||e.pointerId!==drag.id) return; const moved=drag.moved; drag=null; if(!moved){ const t=e.target.closest('[data-tip]'); if(t) tip.show(t.getAttribute('data-tip'),e.clientX,e.clientY); } };
    svg.addEventListener('pointerup',end); svg.addEventListener('pointercancel',()=>{ drag=null; });
    svg.addEventListener('click',e=>{ if(e.target.closest('#sMoon')) go('sky',{tab:'moon'}); });
    lastKey='';
  }
  function setFromAngle(a){
    const now=clock.now(), lp=localParts(now), nm=localMin(now);
    let m;
    if(d24()) m=nrm(a-180)/360*1440;
    else { const m12=a/360*720; m=nm+((m12-nm%720)%720+720)%720; }          // the ring shows the coming 12 hours
    m=Math.round(m);
    clock.set(epochOfLocal(lp,m,now));
  }
  function draw(now){
    if(!svg) return;
    const key=Math.floor(now.getTime()/6e4)+'|'+Z.ver+'|'+d24()+'|'+Z.lang+'|'+latin();
    if(key===lastKey) return; lastKey=key;
    const D=dayOf(now), {p,pt,py,h,nm}=D, en=EN(), tw=d24();
    const ga=tw?(m=>ang(m)):(m=>m1440(m)%720/2);
    let s='';
    // the bezel and the day ring
    s+=`<circle cx="${C}" cy="${C}" r="${RB[1]+10}" fill="none" stroke="url(#gGold)" stroke-width="2.4" opacity=".75"/>`;
    s+=`<circle cx="${C}" cy="${C}" r="${RB[1]+3}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`;
    const aftM=nm>=p.maghrib;
    const T6=KEYS.map((k,i)=>(aftM&&i<2)?pt[k]+1440:p[k]);
    const EV=[];[[py,-1440],[p,0],[pt,1440]].forEach(([q,o])=>KEYS.forEach((k,i)=>EV.push({i,k,t:q[k]+o})));EV.sort((x,y)=>x.t-y.t);
    // which period are we in
    let curK=null; for(let j=0;j<EV.length-1;j++) if(EV[j].t<=nm&&nm<EV[j+1].t){ curK=EV[j].k; break; }
    const periods=[];
    if(tw){ for(let i=0;i<6;i++){ const t1=m1440(p[KEYS[i]]),t2=m1440(i<5?p[KEYS[i+1]]:pt.fajr); periods.push({k:KEYS[i],t1,t2,a1:ang(t1),a2:ang(t2),start:i<5?p[KEYS[i]]:p.isha,end:i<5?p[KEYS[i+1]]:pt.fajr+1440}); } }
    else { const W1=nm+720; for(let j=0;j<EV.length-1;j++){ const s1=Math.max(EV[j].t,nm),s2=Math.min(EV[j+1].t,W1); if(s2<=s1) continue; const a1=ga(s1); periods.push({k:EV[j].k,a1,a2:a1+(s2-s1)/2,start:EV[j].t,end:EV[j+1].t}); } }
    periods.forEach(q=>{
      const on=q.k===curK, dur=q.end-q.start;
      const tipTxt=`<b>${esc(L2(PERIOD[q.k]))}</b><br>${fmt(q.start)} – ${fmt(q.end)} · ${durText(dur)}`;
      if(on) s+=`<path d="${sector(C,q.a1,q.a2,RB[0]-6,RB[1]+6)}" fill="${PCOL[q.k]}" opacity=".45" filter="url(#fGlow)"/>`;
      s+=`<path class="seg-hit" data-tip="${tAttr(tipTxt)}" d="${sector(C,q.a1,q.a2,RB[0],RB[1])}" fill="${PCOL[q.k]}" fill-opacity="${on?1:.72}" stroke="#070a16" stroke-width="2.2"/>`;
    });
    s+=`<circle cx="${C}" cy="${C}" r="${(RB[0]+RB[1])/2}" fill="none" stroke="url(#sSheen)" stroke-width="${RB[1]-RB[0]}" pointer-events="none"/>`;
    // the light ring: the Sun above the horizon (sunrise → sunset), twilight at both ends
    { const st=observer.sunTimes(now), tl=observer.twilightTimes(now);
      if(tw){
        s+=`<path d="${sector(C,ang(tl.astroDawn),ang(st.sunrise),RL[0],RL[1])}" fill="#3d3a7a" opacity=".85"/>`;
        s+=`<path d="${sector(C,ang(st.sunset),ang(tl.astroDusk),RL[0],RL[1])}" fill="#5a3567" opacity=".85"/>`;
        s+=`<path d="${sector(C,ang(st.sunrise),ang(st.sunset),RL[0],RL[1])}" fill="#ffd36b"/>`;
        s+=`<path d="${sector(C,ang(tl.astroDusk),ang(tl.astroDawn+1440),RL[0],RL[1])}" fill="#141a36"/>`;
      } else s+=ring(C,(RL[0]+RL[1])/2,'rgba(255,255,255,.08)',RL[1]-RL[0]);
    }
    // hour marks on the inner edge of the day ring
    for(let k=0;k<(tw?24:12);k++){ const a=tw?ang(k*60):k*30,[x1,y1]=pol(C,a,RB[0]+1),[x2,y2]=pol(C,a,RB[0]+(k%3?7:13)); s+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#070a16" stroke-opacity=".7" stroke-width="${k%3?1.4:2.4}"/>`; }
    // elapsed arc: from the last event to now (24 h only)
    if(tw){ let pv=0,bd=1e9; T6.map(m1440).forEach((t,i)=>{ let d=nm-t; while(d<0)d+=1440; if(d<bd){bd=d;pv=i;} });
      let a1=ang(m1440(T6[pv])),a2=ang(nm); while(a2<a1)a2+=360;
      if(a2-a1>.6) s+=`<path d="${arcD(C,a1,a2,RB[0]-11)}" fill="none" stroke="#ffe0a0" stroke-width="4" stroke-linecap="round" opacity=".9"/>`; }
    // labels outside: name over time, pushed apart; the next one in gold with a ring
    const L=[], MIDN=pname('mid'), THIRD=pname('third');
    if(tw){
      let nx=-1,best=1e9; T6.forEach((t,i)=>{ let d=t-nm; if(d<=0) d+=1440; if(d<best){best=d;nx=i;} });
      T6.forEach((t,i)=>{ const tm=aftM&&i<2; L.push({a:ga(t),t,k:KEYS[i],name:pname(KEYS[i],D.friday&&!tm),time:(tm?T('غدًا ','tmrw '):'')+fmt(t),next:i===nx,past:t<nm&&i!==nx,kind:'p'}); });
      L.push({a:ga(D.midN),t:D.midN,k:'mid',name:MIDN,time:fmt(D.midN),kind:'n',past:D.midN<nm});
      L.push({a:ga(D.third),t:D.third,k:'third',name:THIRD,time:fmt(D.third),kind:'n',past:D.third<nm});
    } else {
      const W1=nm+720;
      EV.filter(e=>e.t>nm&&e.t<=W1).forEach((e,j)=>L.push({a:ga(e.t),t:e.t,k:e.k,name:pname(e.k,D.friday&&e.t<1440),time:(e.t>=1440?T('غدًا ','tmrw '):'')+fmt(e.t),next:j===0,past:false,kind:'p'}));
      [[py.maghrib-1440,p.fajr],[p.maghrib,pt.fajr+1440]].forEach(([m0,f0])=>[[(m0+f0)/2,'mid',MIDN],[m0+(f0-m0)*2/3,'third',THIRD]].forEach(([t,k,name])=>{ if(t>nm&&t<=W1) L.push({a:ga(t),t,k,name,time:fmt(t),kind:'n',past:false}); }));
    }
    const R0=RB[1]+24, fsP=34, fsN=25, W=(str,fs)=>str.length*fs*.52+10;
    L.forEach(l=>{ const fs=l.kind==='p'?fsP:fsN; l.fs=fs; l.w=Math.max(W(l.name,fs),W(l.time,fs*.86)); l.h=fs*2.05; l.b=l.a; });
    const place=l=>{ let r=R0; for(;r<R0+220;r+=2){ const [x,y]=pol(C,l.b,r),nx2=Math.min(Math.max(C,x-l.w/2),x+l.w/2),ny=Math.min(Math.max(C,y-l.h/2),y+l.h/2); if(Math.hypot(nx2-C,ny-C)>=R0) break; } [l.x,l.y]=pol(C,l.b,r); };
    const hit=(u,v)=>Math.abs(u.x-v.x)<(u.w+v.w)/2+6&&Math.abs(u.y-v.y)<(u.h+v.h)/2+4;
    L.forEach(place);
    for(let it=0;it<500;it++){ let moved=false;
      for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const u=L[i],v=L[j]; if(!hit(u,v)) continue;
        let d=nrm(v.b-u.b); if(d>180) d-=360; const sg=d>=0?1:-1;
        if(u.kind==='n'&&v.kind==='p') u.b-=sg*.8; else if(v.kind==='n'&&u.kind==='p') v.b+=sg*.8; else { u.b-=sg*.5; v.b+=sg*.5; }
        place(u); place(v); moved=true; }
      if(!moved) break; }
    { const past=L.filter(l=>l.past).sort((u,v)=>u.t-v.t); for(const l of past) if(L.some(v=>v!==l&&!v.hide&&hit(l,v))) l.hide=true; }
    const night=nm>=p.isha||nm<p.fajr;
    let lab='';
    L.forEach(l=>{
      const [dx,dy]=pol(C,l.a,(RB[0]+RB[1])/2),[ex,ey]=pol(C,l.a,RB[1]+4),[fx,fy]=pol(C,l.a,RB[1]+14);
      const tx=Math.min(Math.max(fx,l.x-l.w/2),l.x+l.w/2), ty=Math.min(Math.max(fy,l.y-l.h/2),l.y+l.h/2);
      const col=l.next?'#ffe0a0':(l.past?'#7c86a3':(night?'#e7dcc4':'#eef1f8'));
      const tipTxt=`<b>${esc(l.name)}</b> ${l.time}${l.t>nm?'<br>'+T('بعد ','in ')+durText(l.t-nm):''}`;
      if(!l.hide) lab+=`<polyline points="${f1(ex)},${f1(ey)} ${f1(fx)},${f1(fy)} ${f1(tx)},${f1(ty)}" fill="none" stroke="${col}" stroke-opacity=".4" stroke-width="2"/>`;
      if(l.kind==='p'){ lab+=`<circle data-tip="${tAttr(tipTxt)}" cx="${f1(dx)}" cy="${f1(dy)}" r="${l.next?9:6}" fill="${col}" stroke="#070a16" stroke-width="2.6"/>`;
        if(l.next) lab+=`<circle class="pulse" cx="${f1(dx)}" cy="${f1(dy)}" r="16" fill="none" stroke="#ffe0a0" stroke-width="2.4"/>`; }
      else { const z=8; lab+=`<path data-tip="${tAttr(tipTxt)}" d="M${f1(dx)} ${f1(dy-z)}l${f1(z*.72)} ${z}l${f1(-z*.72)} ${z}l${f1(-z*.72)} ${-z}Z" transform="rotate(${f1(l.a)} ${f1(dx)} ${f1(dy)})" fill="${col}" stroke="#070a16" stroke-width="2"/>`; }
      if(l.hide) return;
      const y1=l.y-l.h/2+l.fs*.9;
      lab+=`<g data-tip="${tAttr(tipTxt)}"><text class="disp" x="${f1(l.x)}" y="${f1(y1)}" font-size="${l.fs}" font-weight="700" text-anchor="middle" fill="${col}" stroke="#070a16" stroke-width="8" paint-order="stroke" stroke-linejoin="round">${esc(l.name)}</text>`+
        `<text class="num" x="${f1(l.x)}" y="${f1(y1+l.fs*1.02)}" font-size="${f1(l.fs*.84)}" font-weight="600" text-anchor="middle" fill="${col}" stroke="#070a16" stroke-width="8" paint-order="stroke" stroke-linejoin="round">${esc(l.time)}</text></g>`;
    });
    s+=lab;
    // the Sun on the day ring, where it is now
    { const up=nm>=p.sunrise&&nm<p.maghrib, [x,y]=pol(C,ga(nm),(RB[0]+RB[1])/2);
      s+=`<g data-tip="${tAttr('<b>'+T('الشمس الآن','The Sun now')+'</b><br>'+fmt(nm)+' · '+T('اسحب لترى وقتًا آخر','drag to see another time'))}" transform="translate(${f1(x)} ${f1(y)})" style="cursor:grab"><circle r="22" fill="#070a16" stroke="url(#gGold)" stroke-width="2.6"/>${sunG(9.5,up)}</g>`; }
    // the Moon's ring: the nights of the Hijri month from 1 at the top, tonight's Moon in its true phase
    s+=`<circle cx="${C}" cy="${C}" r="${RM[1]+4}" fill="#060914"/>`+ring(C,(RM[0]+RM[1])/2,'#0f1630',RM[1]-RM[0])+ring(C,RM[1],'rgba(226,232,246,.22)',1.4)+ring(C,RM[0],'rgba(226,232,246,.16)',1.2);
    for(let k=0;k<30;k++){ const a=k*12, big=(k+1)%5===0||k===0, [x,y]=pol(C,a,(RM[0]+RM[1])/2);
      if(k===h.day-1) continue;
      s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${big?3.6:2.4}" fill="#c7cfe3" fill-opacity="${k<h.day-1?.28:.6}"/>`;
      if(big) s+=word(C,a,RM[0]-14,dg(k+1),17,'#8e98b3','num'); }
    { const ph=Ephemeris.moonPhase(now), [mx,my]=pol(C,(h.day-1)*12,(RM[0]+RM[1])/2);
      const tipTxt=`<b>${T('القمر · ليلة ','The Moon · night ')}${dg(h.day)} ${esc(L2(HM[h.month-1]))}</b><br>${esc(EN()?['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent'][ph.idx]:ph.name)} · ${dg(Math.round(ph.illum*100))}%`;
      s+=`<g id="sMoon" data-tip="${tAttr(tipTxt)}" style="cursor:pointer" transform="translate(${f1(mx)} ${f1(my)})"><circle r="26" fill="#060914" stroke="rgba(226,232,246,.5)" stroke-width="1.6"/>${moonG(20,ph)}</g>`; }
    // the numerals
    s+=ring(C,(RN[0]+RN[1])/2,'#0a0f22',RN[1]-RN[0])+ring(C,RN[1],'url(#gGold)',1.6,'opacity=".6"');
    if(tw) for(let k=0;k<24;k+=2){ const big=k%6===0,[x,y]=pol(C,ang(k*60),(RN[0]+RN[1])/2); s+=`<text class="num" x="${f1(x)}" y="${f1(y)}" dy=".36em" font-size="${big?30:23}" font-weight="${big?700:500}" fill="${big?'#ffe0a0':'#c5cde0'}" text-anchor="middle">${dg(k||24)}</text>`; }
    else for(let k=1;k<=12;k++){ const [x,y]=pol(C,k*30,(RN[0]+RN[1])/2); s+=`<text class="num" x="${f1(x)}" y="${f1(y)}" dy=".36em" font-size="${k%3?25:31}" font-weight="700" fill="${k%3?'#c5cde0':'#ffe0a0'}" text-anchor="middle">${dg(k)}</text>`; }
    // the face, its minute marks and the sky window: the Sun (and the Moon) where you would see them if you looked up now
    s+=`<circle cx="${C}" cy="${C}" r="${RF}" fill="url(#sFace)" stroke="url(#gGold)" stroke-width="2"/>`;
    for(let k=0;k<60;k++){ const [x1,y1]=pol(C,k*6,RF-5),[x2,y2]=pol(C,k*6,RF-(k%5?12:22)); s+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${k%5?'rgba(226,232,246,.35)':'#ffe0a0'}" stroke-width="${k%5?1.3:3}"/>`; }
    try{
      const sa=observer.sunAltAzNow(now), HY=C+26, K=96/90, up=sa.alt>-0.833;
      const sx=C+110*Math.sin((sa.az-180)*D2R), sy=Math.min(C+120,HY-sa.alt*K);
      s+=`<g clip-path="url(#sFaceClip)"><path d="M${C-150} ${HY}A150 150 0 0 1 ${C+150} ${HY}Z" fill="${up?'#3e6fc0':'#25306b'}" opacity="${up?.22:.14}"/>`+
        `<line x1="${C-160}" y1="${HY}" x2="${C+160}" y2="${HY}" stroke="#ffe0a0" stroke-opacity=".38" stroke-width="1.4" stroke-dasharray="5 6"/>`;
      const mo=trueSky.moonAltTopo(now), mup=mo.alt>-0.8, mxx=C+110*Math.sin((mo.az-180)*D2R), myy=Math.min(C+120,HY-mo.alt*K);
      s+=`<g transform="translate(${f1(mxx)} ${f1(myy)})" opacity="${mup?.95:.35}">${moonG(8.5,Ephemeris.moonPhase(now))}</g>`;
      s+=`<g transform="translate(${f1(sx)} ${f1(sy)})" opacity="${up?1:.45}">${sunG(6,up)}</g></g>`;
      s+=`<text x="${C-150}" y="${HY+22}" font-size="15" fill="#5c6785" text-anchor="middle">${T('شرق','E')}</text><text x="${C+150}" y="${HY+22}" font-size="15" fill="#5c6785" text-anchor="middle">${T('غرب','W')}</text>`;
    }catch(e){}
    gS.innerHTML=s;
    svg.setAttribute('aria-label',T('الساعة: ','Clock: ')+fmt(nm)+' · '+pname(KEYS[D.next],D.friday)+' '+fmt(D.nextMin));
  }
  function hands(now,smooth){
    if(!svg) return;
    const nm=localMin(now), tw=d24();
    const hA=tw?ang(nm):(nm%720)/720*360, mA=(nm%60)/60*360, sA=(Math.floor(now.getTime()/1000)%60)*6;
    const set=(id,a)=>{ const g=svg.querySelector('#'+id); g.classList.toggle('nosnap',!smooth); g.style.transform=`rotate(${a.toFixed(3)}deg)`; };
    set('sHour',hA); set('sMin',mA);
    const sg=svg.querySelector('#sSec'), prev=+sg.dataset.a||0; let target=sA; while(target<prev-180) target+=360;   // never spin backwards at :00
    if(target-prev>200) target-=360; sg.dataset.a=target; sg.classList.toggle('nosnap',!smooth||reducedMotion()); sg.style.transform=`rotate(${target}deg)`;
    svg.querySelector('#sHourSun').style.display=tw?'':'none';
  }
  return {mount,draw,hands,reset(){lastKey='';}};
})();

/* ====================================================================== */
/* «الزيج الكبرى» */
const WORLD = [['مكة المكرمة','Makkah'],['دبي','Dubai'],['كراتشي','Karachi'],['دكا','Dhaka'],['بانكوك','Bangkok'],['بكين','Beijing'],['طوكيو','Tokyo'],['سيدني','Sydney'],
  ['نوميا','Nouméa'],['أوكلاند','Auckland'],['ميدواي','Midway'],['هاواي','Honolulu'],['أنكوريج','Anchorage'],['لوس أنجلوس','Los Angeles'],['دنفر','Denver'],['المكسيك','Mexico City'],
  ['نيويورك','New York'],['لاباز','La Paz'],['بوينس آيرس','Buenos Aires'],['ج. الجنوبية','S. Georgia'],['آزوريس','Azores'],['لندن','London'],['باريس','Paris'],['القاهرة','Cairo']];
const ZODIAC = [['الحمل','Aries'],['الثور','Taurus'],['الجوزاء','Gemini'],['السرطان','Cancer'],['الأسد','Leo'],['العذراء','Virgo'],['الميزان','Libra'],['العقرب','Scorpio'],['القوس','Sagittarius'],['الجدي','Capricorn'],['الدلو','Aquarius'],['الحوت','Pisces']];
const PLANETS = [['Mercury','عطارد','#b9c2d6',236],['Venus','الزهرة','#ffe6a8',254],['Mars','المريخ','#ff8b6b',272],['Jupiter','المشتري','#f3c48e',290],['Saturn','زحل','#e8d3a0',308]];
const STAR_EN = {'الشعرى':'Sirius','الدبران':'Aldebaran','رجل الجبار':'Rigel','يد الجوزاء':'Betelgeuse','السماك الرامح':'Arcturus','النسر الواقع':'Vega','القطبية':'Polaris'};
const MAN_EN = ['Sharatain','Butain','Thurayya','Dabaran','Haq‘a','Han‘a','Dhira‘','Nathra','Tarf','Jabha','Zubra','Sarfa','‘Awwa','Simak','Ghafr','Zubana','Iklil','Qalb','Shawla','Na‘a’im','Balda','S. Dhabih','S. Bula‘','S. Su‘ud','S. Akhbiya','Fargh I','Fargh II','Risha'];
let _coast=null;
function coastRuns(){
  if(_coast) return _coast; _coast=[];
  (window.ZIJ_COAST||[]).forEach(d=>d.split('M').filter(x=>x.trim()).forEach(sub=>{
    const pts=sub.replace(/[LZz]/g,' ').trim().split(/\s+/).map(q=>{ const [x,y]=q.split(',').map(Number); return [x-180,90-y]; }).filter(q=>isFinite(q[0])&&isFinite(q[1]));
    let run=[]; pts.forEach((q,i)=>{ if(i&&Math.abs(q[0]-pts[i-1][0])>40){ if(run.length>1)_coast.push(run); run=[]; } run.push(q); }); if(run.length>1)_coast.push(run);
  }));
  return _coast;
}
/* an orthographic Earth centred on (lat0, lon0): coastlines, night side, the Kaaba and the way to it */
function globeSVG(cx,cy,R,lat0,lon0,now,opt={}){
  const k=D2R, sφ0=Math.sin(lat0*k), cφ0=Math.cos(lat0*k);
  const proj=(lat,lon)=>{ const φ=lat*k, dλ=(lon-lon0)*k, cφ=Math.cos(φ);
    return [cx+R*cφ*Math.sin(dλ), cy-R*(cφ0*Math.sin(φ)-sφ0*cφ*Math.cos(dλ)), sφ0*Math.sin(φ)+cφ0*cφ*Math.cos(dλ)]; };
  let s=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#gOcean)"/>`;
  let d=''; coastRuns().forEach(run=>{ let pen=false; run.forEach(([lo,la])=>{ const [x,y,z]=proj(la,lo); if(z<0.02){ pen=false; return; } d+=(pen?'L':'M')+f1(x)+' '+f1(y); pen=true; }); });
  s+=`<path d="${d}" fill="none" stroke="#9fd6c8" stroke-opacity=".75" stroke-width="${f1(Math.max(.8,R/110))}" stroke-linejoin="round"/>`;
  // graticule
  let g=''; for(let la=-60;la<=60;la+=30){ let pen=false; for(let lo=-180;lo<=180;lo+=6){ const [x,y,z]=proj(la,lo); if(z<0){pen=false;continue;} g+=(pen?'L':'M')+f1(x)+' '+f1(y); pen=true; } }
  for(let lo=-180;lo<180;lo+=30){ let pen=false; for(let la=-90;la<=90;la+=6){ const [x,y,z]=proj(la,lo); if(z<0){pen=false;continue;} g+=(pen?'L':'M')+f1(x)+' '+f1(y); pen=true; } }
  s+=`<path d="${g}" fill="none" stroke="#8ab6ff" stroke-opacity=".12" stroke-width="${f1(Math.max(.5,R/200))}"/>`;
  // night: the hemisphere away from the sub-solar point (same construction as a Moon phase)
  try{ const ss=Ephemeris.subSolar(now), [sx,sy,sz]=proj(ss.lat,ss.lon), vx=(sx-cx)/R, vy=(cy-sy)/R, th=Math.atan2(vx,vy)/k;
    const pd=Ephemeris.moonDarkPath(R,(1+sz)/2,true);
    s+=`<path d="${pd.d}" transform="translate(${cx} ${cy}) rotate(${f1(th-90)})" fill="#02040c" fill-opacity=".62"/>`; }catch(e){}
  // the way to the Kaaba (a great circle) and the two places
  const KA=[21.4225,39.8262];
  if(opt.qibla!==false){ const A=[lat0*k,lon0*k],B=[KA[0]*k,KA[1]*k];
    const toV=([φ,λ])=>[Math.cos(φ)*Math.cos(λ),Math.cos(φ)*Math.sin(λ),Math.sin(φ)], v1=toV(A), v2=toV(B), om=Math.acos(Math.min(1,v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2]));
    if(om>1e-4){ let q=''; for(let i=0;i<=48;i++){ const t=i/48, a=Math.sin((1-t)*om)/Math.sin(om), b=Math.sin(t*om)/Math.sin(om), v=[a*v1[0]+b*v2[0],a*v1[1]+b*v2[1],a*v1[2]+b*v2[2]];
        const la=Math.atan2(v[2],Math.hypot(v[0],v[1]))/k, lo=Math.atan2(v[1],v[0])/k, [x,y,z]=proj(la,lo); if(z<0) break; q+=(i?'L':'M')+f1(x)+' '+f1(y); }
      s+=`<path d="${q}" fill="none" stroke="#ff7a6e" stroke-width="${f1(Math.max(1.4,R/48))}" stroke-dasharray="${f1(R/16)} ${f1(R/26)}" stroke-linecap="round"/>`; } }
  { const [x,y,z]=proj(KA[0],KA[1]); if(z>0) s+=`<g transform="translate(${f1(x)} ${f1(y)})"><rect x="-${f1(R/22)}" y="-${f1(R/22)}" width="${f1(R/11)}" height="${f1(R/11)}" fill="#111" stroke="#ffe0a0" stroke-width="${f1(R/90)}"/></g>`; }
  s+=`<circle cx="${cx}" cy="${cy}" r="${f1(Math.max(2.4,R/30))}" fill="#72e4d0" stroke="#02040c" stroke-width="${f1(R/120)}"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#gLimb)" stroke="rgba(160,200,255,.35)" stroke-width="${f1(Math.max(1,R/90))}"/>`;
  return s;
}

const GrandZij = (()=>{
  const C=600;
  const R={world:[552,594],hijri:[514,546],greg:[480,510],zod:[444,476],man:[406,440],band:[352,400],num:[316,348],orr:[200,314],star:[164,194],hor:[134,160],earth:128};
  const LAYERS=[
    ['world','#8ab6ff',['التوقيت العالمي','World time'],['٢٤ مدينة بوقتها الحقيقي الآن، ونقطة مضيئة لمن الشمس فوقه.','24 cities at their true time now; a lit dot where the Sun is up.']],
    ['hijri','#ffe0a0',['السنة الهجرية','Hijri year'],['شهور السنة الهجرية، والمؤشر على الشهر واليوم (أم القرى).','The Hijri months; the pointer sits on today (Umm al-Qura).']],
    ['greg','#c5cde0',['السنة الميلادية','Gregorian year'],['الشهور الميلادية ومؤشر اليوم.','The Gregorian months and today’s pointer.']],
    ['zodiac','#f09a4b',['البروج والشمس','Zodiac and the Sun'],['الشمس في برجها الحقيقي، ونقاط الاعتدالين والانقلابين.','The Sun in its true sign; the equinoxes and solstices.']],
    ['mansions','#b39dff',['منازل القمر','Lunar mansions'],['المنازل الثماني والعشرون على النجوم، والقمر في منزلته الآن.','The 28 mansions on the stars; the Moon in its mansion now.']],
    ['band','#f2c46d',['النهار والليل والصلاة','Day, night and prayers'],['اليوم كله: النهار والشفق والليل، والصلوات في أوقاتها، والشمس والقمر الآن، وشروق القمر وغروبه.','The whole day: daylight, twilight and night, the prayers at their times, the Sun and Moon now, moonrise and moonset.']],
    ['numerals','#eef1f8',['أرقام الساعة','Clock numerals'],['أرقام العقارب الاثني عشر ودقائقها.','The 12 numerals and minutes for the hands.']],
    ['orrery','#ffe6a8',['القمر والكواكب','Moon and planets'],['القمر بطوره والكواكب الخمسة في أطوالها الحقيقية على فلك البروج، وعقدتا الكسوف.','The Moon in its phase and the five planets at their true longitudes; the eclipse nodes.']],
    ['stars','#dfe6f5',['النجوم المشهورة','Bright stars'],['سبعة نجوم في اتجاهها الحقيقي من موقعك؛ الباهت تحت الأفق.','Seven stars in their true direction from you; faint ones are below the horizon.']],
    ['horizon','#ff7a6e',['الاتجاهات والقبلة','Directions and qibla'],['الشمال، والقبلة، واتجاه الظل، وجهة الشمس والقمر الآن.','North, the qibla, your shadow, and where the Sun and Moon are now.']],
    ['earth','#72e4d0',['الأرض الآن','The Earth now'],['الأرض من فوق موقعك: الليل والنهار الآن، والكعبة وطريق القبلة.','The Earth above your place: day and night now, the Kaaba and the way to it.']],
    ['corners','#9ab0d8',['المؤشرات الأربعة','Four complications'],['معادلة الزمن، ونور القمر، ويوم الأسبوع، والتوربيون (المسه ليكبر).','Equation of time, moonlight, weekday, the tourbillon (tap to enlarge).']],
  ];
  let svg=null, host=null, lastKey='', vis={}, zoom={s:1,x:0,y:0}, drag=null;
  try{ vis=JSON.parse(LS.get('zijClaudeLayers')||'{}'); }catch(e){ vis={}; }
  const on=k=>vis[k]!==false;
  const hide=()=>LS.get('zijClaudeTrueSky')==='1';    // «حقيقة السماء»: what is under the horizon is shown faint
  function mount(h){
    host=h;
    host.innerHTML=`<svg class="svgd" viewBox="0 0 1200 1200" role="img" tabindex="0"><defs>${SVG_DEFS}
<radialGradient id="gPlate" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#141c38"/><stop offset=".65" stop-color="#0a0f22"/><stop offset="1" stop-color="#05070f"/></radialGradient>
<radialGradient id="gOcean" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#1d4d7a"/><stop offset="1" stop-color="#0a1c33"/></radialGradient>
<radialGradient id="gLimb" cx="50%" cy="50%" r="50%"><stop offset=".8" stop-color="#8ab6ff" stop-opacity="0"/><stop offset="1" stop-color="#8ab6ff" stop-opacity=".35"/></radialGradient>
<radialGradient id="gDisc" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#111a36"/><stop offset="1" stop-color="#070b18"/></radialGradient></defs>
<rect x="6" y="6" width="1188" height="1188" rx="64" fill="url(#gPlate)" stroke="url(#gGold)" stroke-width="2" stroke-opacity=".55"/>
<g id="gzS"></g><g id="gzH"></g></svg>`;
    svg=host.querySelector('svg');
    const H=svg.querySelector('#gzH');
    H.innerHTML=`<g class="hand" id="gzHour"><path d="M${C-9} ${C+40}L${C-4} ${C-210}L${C} ${C-232}L${C+4} ${C-210}L${C+9} ${C+40}Z" fill="url(#gGold)" stroke="#3b2c10" stroke-width="1"/></g>
<g class="hand" id="gzMin"><path d="M${C-6} ${C+48}L${C-2.4} ${C-312}L${C} ${C-330}L${C+2.4} ${C-312}L${C+6} ${C+48}Z" fill="url(#gSilver)" stroke="#2a3245" stroke-width="1"/></g>
<g class="hand" id="gzSec"><line x1="${C}" y1="${C+70}" x2="${C}" y2="${C-340}" stroke="#ff7a6e" stroke-width="2.4" stroke-linecap="round"/><circle cx="${C}" cy="${C+70}" r="8" fill="#ff7a6e"/></g>
<circle cx="${C}" cy="${C}" r="13" fill="url(#gGold)" stroke="#3b2c10" stroke-width="1.4"/><circle cx="${C}" cy="${C}" r="4.5" fill="#ff7a6e"/>`;
    ['gzHour','gzMin','gzSec'].forEach(id=>{ svg.querySelector('#'+id).style.transformOrigin=`${C}px ${C}px`; });
    wireTips(svg);
    svg.addEventListener('keydown',e=>{ if(e.key==='+'||e.key==='='){ zoomBy(1.25); e.preventDefault(); } else if(e.key==='-'){ zoomBy(1/1.25); e.preventDefault(); } else if(e.key==='0'){ zoomReset(); e.preventDefault(); } else travelKeys(e); });
    svg.addEventListener('wheel',e=>{ if(!e.ctrlKey&&!e.altKey&&zoom.s===1&&!e.shiftKey) return; e.preventDefault(); zoomBy(e.deltaY<0?1.15:1/1.15,e); },{passive:false});
    svg.addEventListener('pointerdown',e=>{ if(e.target.closest('#gzTourb')) return; const q=svgAngle(svg,C,e);
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,band:q.r>=R.band[0]-6&&q.r<=R.band[1]+6&&zoom.s===1,vx:zoom.x,vy:zoom.y}; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5) return; drag.moved=true; tip.hide();
      if(drag.band){ const a=svgAngle(svg,C,e).a, now=clock.now(); clock.set(epochOfLocal(localParts(now),Math.round(nrm(a-180)/360*1440),now)); }
      else if(zoom.s>1){ const k=1200/zoom.s/svg.getBoundingClientRect().width; zoom.x=drag.vx-(e.clientX-drag.x)*k*(EN()?1:1); zoom.y=drag.vy-(e.clientY-drag.y)*k; applyZoom(); } });
    svg.addEventListener('pointerup',e=>{ if(drag&&!drag.moved){ const t=e.target.closest('[data-tip]'); if(t) tip.show(t.getAttribute('data-tip'),e.clientX,e.clientY); } drag=null; });
    svg.addEventListener('pointercancel',()=>{ drag=null; });
    svg.addEventListener('click',e=>{ if(e.target.closest('#gzTourb')) openTourbillon(); });
    lastKey='';
  }
  function applyZoom(){ if(!svg) return; const w=1200/zoom.s; zoom.x=Math.max(0,Math.min(1200-w,zoom.x)); zoom.y=Math.max(0,Math.min(1200-w,zoom.y)); svg.setAttribute('viewBox',`${f1(zoom.x)} ${f1(zoom.y)} ${f1(w)} ${f1(w)}`); host.classList.toggle('zoomed',zoom.s>1); }
  function zoomBy(f,e){ const old=zoom.s; zoom.s=Math.max(1,Math.min(5,zoom.s*f)); let cx=600,cy=600;
    if(e&&svg){ const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const q=pt.matrixTransform(svg.getScreenCTM().inverse()); cx=q.x; cy=q.y; }
    else { cx=zoom.x+600/old; cy=zoom.y+600/old; }
    const w=1200/zoom.s; zoom.x=cx-(cx-zoom.x)*old/zoom.s; zoom.y=cy-(cy-zoom.y)*old/zoom.s; if(zoom.s===1){ zoom.x=0; zoom.y=0; } applyZoom(); }
  function zoomReset(){ zoom={s:1,x:0,y:0}; applyZoom(); }
  function setLayer(k,v){ vis[k]=v; LS.set('zijClaudeLayers',JSON.stringify(vis)); lastKey=''; }
  function highlight(k){ if(!svg) return; svg.classList.toggle('ring-dim',!!k); svg.querySelectorAll('.layer').forEach(g=>g.classList.toggle('hot',g.dataset.l===k)); }

  function draw(now){
    if(!svg) return;
    const key=Math.floor(now.getTime()/6e4)+'|'+Z.ver+'|'+Z.lang+'|'+latin()+'|'+JSON.stringify(vis)+'|'+hide();
    if(key===lastKey){ return; } lastKey=key;
    const D=dayOf(now), en=EN(), nm=D.nm, lp=D.lp, h=D.h, lay=(k,inner)=>on(k)?`<g class="layer" data-l="${k}">${inner}</g>`:'';
    let s='';
    const ang=m=>180+m1440(m)/1440*360;
    /* — world time — */
    { let w=`<circle cx="${C}" cy="${C}" r="${R.world[1]}" fill="#060a18" stroke="rgba(138,182,255,.25)" stroke-width="1.4"/>`+ring(C,R.world[0],'rgba(138,182,255,.2)',1.2);
      WORLD.forEach((nm2,i)=>{ const a=i*15, c=(ZIJ_CITIES.find(x=>x[0]===nm2[0])||ZIJ_CITIES[0]); const off=zijZoneOffset(c[3],now), ld=new Date(now.getTime()+off*36e5);
        const hh=ld.getUTCHours(), mm=ld.getUTCMinutes(); let up=false; try{ const s2=Ephemeris.sun(now); up=Ephemeris.altAz(s2.ra,s2.dec,now,c[1],c[2]).alt>-0.833; }catch(e){}
        const tm=all24()||en?dg(two(hh)+':'+two(mm)):fmt(hh*60+mm,false);
        const [dx,dy]=pol(C,a,R.world[0]+6);
        w+=`<g data-tip="${tAttr('<b>'+(en?nm2[1]:nm2[0])+'</b> '+fmt(hh*60+mm)+'<br>UTC'+(off>=0?'+':'')+off)}">`+
          word(C,a,R.world[1]-14,en?nm2[1]:nm2[0],17,'#c5d6ff','disp','font-weight="700"')+word(C,a,R.world[0]+12,tm,14,up?'#ffe0a0':'#7f8bb0','num')+
          `<circle cx="${f1(dx)}" cy="${f1(dy)}" r="3.4" fill="${up?'#ffd36b':'#26325e'}"/></g>`;
        const [x1,y1]=pol(C,a+7.5,R.world[0]),[x2,y2]=pol(C,a+7.5,R.world[1]); w+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="rgba(138,182,255,.16)" stroke-width="1"/>`; });
      s+=lay('world',w); }
    /* — Hijri months — */
    { let w=`<circle cx="${C}" cy="${C}" r="${R.hijri[1]}" fill="#0a0e1d"/>`;
      for(let i=0;i<12;i++){ const a1=i*30,cur=i===h.month-1; w+=`<path d="${sector(C,a1,a1+30,R.hijri[0],R.hijri[1])}" fill="${cur?'rgba(242,196,109,.22)':i%2?'rgba(255,255,255,.025)':'rgba(255,255,255,.05)'}" stroke="#05070f" stroke-width="1.5"/>`+
        word(C,a1+15,(R.hijri[0]+R.hijri[1])/2,L2(HM[i]),16.5,cur?'#ffe0a0':'#c5cde0','disp',cur?'font-weight="700"':''); }
      const a=(h.month-1)*30+(h.day/30)*30, [x,y]=pol(C,a,R.hijri[0]-2);
      w+=`<path d="M${f1(x)} ${f1(y)}l-9 -16h18z" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})" fill="#ffe0a0" data-tip="${tAttr('<b>'+hijriText(h)+'</b>')}"/>`;
      s+=lay('hijri',w); }
    /* — Gregorian months — */
    { let w=`<circle cx="${C}" cy="${C}" r="${R.greg[1]}" fill="#090d1b"/>`;
      for(let i=0;i<12;i++){ const a1=i*30,cur=i===lp.m; w+=`<path d="${sector(C,a1,a1+30,R.greg[0],R.greg[1])}" fill="${cur?'rgba(197,205,224,.16)':'rgba(255,255,255,.02)'}" stroke="#05070f" stroke-width="1.5"/>`+
        word(C,a1+15,(R.greg[0]+R.greg[1])/2,L2(GM[i]),15,cur?'#ffffff':'#8e98b3','',cur?'font-weight="700"':''); }
      const a=lp.m*30+(lp.d/31)*30,[x,y]=pol(C,a,R.greg[0]-2);
      w+=`<path d="M${f1(x)} ${f1(y)}l-8 -14h16z" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})" fill="#eef1f8" data-tip="${tAttr('<b>'+gregText(lp)+'</b>')}"/>`;
      s+=lay('greg',w); }
    /* — zodiac and the Sun on the ecliptic (Aries at the top) — */
    const sunLon=Ephemeris.sun(now).lon;
    { let w=`<circle cx="${C}" cy="${C}" r="${R.zod[1]}" fill="#0b0f20"/>`;
      for(let i=0;i<12;i++){ const a1=i*30, cur=Math.floor(sunLon/30)%12===i;
        w+=`<path d="${sector(C,a1,a1+30,R.zod[0],R.zod[1])}" fill="${cur?'rgba(240,154,75,.2)':'rgba(255,255,255,.02)'}" stroke="#05070f" stroke-width="1.5"/>`+word(C,a1+15,(R.zod[0]+R.zod[1])/2,L2(ZODIAC[i]),15.5,cur?'#ffc58a':'#b7a58a','disp'); }
      [[0,T('الاعتدال الربيعي','March equinox')],[90,T('الانقلاب الصيفي','June solstice')],[180,T('الاعتدال الخريفي','September equinox')],[270,T('الانقلاب الشتوي','December solstice')]].forEach(([a,n])=>{
        const [x,y]=pol(C,a,R.zod[0]); w+=`<path data-tip="${tAttr('<b>'+n+'</b>')}" d="M${f1(x)} ${f1(y-8)}l7 8-7 8-7-8z" transform="rotate(${a} ${f1(x)} ${f1(y)})" fill="#f09a4b"/>`; });
      const [sx,sy]=pol(C,sunLon,(R.zod[0]+R.zod[1])/2);
      w+=`<g data-tip="${tAttr('<b>'+T('الشمس في برج ','The Sun in ')+L2(ZODIAC[Math.floor(sunLon/30)%12])+'</b><br>'+T('خط الطول ','longitude ')+dg(sunLon.toFixed(1))+'°')}" transform="translate(${f1(sx)} ${f1(sy)})"><circle r="15" fill="#0b0f20"/>${sunG(7.5)}</g>`;
      s+=lay('zodiac',w); }
    /* — the 28 mansions (sidereal: turned by the ayanamsa) and the Moon in hers — */
    const moonE=Ephemeris.moon(now), ay=Ephemeris.ayanamsa(now), mi=trueSky.moonMansionIndex(now);
    { let w=`<circle cx="${C}" cy="${C}" r="${R.man[1]}" fill="#0a0d1e"/>`;
      for(let i=0;i<28;i++){ const a1=ay+i*360/28, cur=i===mi; w+=`<path d="${sector(C,a1,a1+360/28,R.man[0],R.man[1])}" fill="${cur?'rgba(179,157,255,.24)':i%2?'rgba(255,255,255,.02)':'rgba(255,255,255,.04)'}" stroke="#05070f" stroke-width="1.2"/>`+
        word(C,a1+180/28,(R.man[0]+R.man[1])/2,en?MAN_EN[i]:MANSION_NAMES[i],12.5,cur?'#e3d9ff':'#8f86b8','',cur?'font-weight="700"':''); }
      const [x,y]=pol(C,moonE.lon,R.man[0]-3);
      w+=`<path data-tip="${tAttr('<b>'+T('القمر في منزلة ','The Moon in ')+(en?MAN_EN[mi]:MANSION_NAMES[mi])+'</b><br>'+T('المنزلة ','mansion ')+dg(mi+1)+'/'+dg(28))}" d="M${f1(x)} ${f1(y)}l-8 -14h16z" transform="rotate(${f1(moonE.lon)} ${f1(x)} ${f1(y)})" fill="#e3d9ff"/>`;
      s+=lay('mansions',w); }
    /* — day and night with the prayers (noon on top) — */
    { const st=observer.sunTimes(now), tl=observer.twilightTimes(now), {p}=D, Rm=(R.band[0]+R.band[1])/2;
      let w=`<circle cx="${C}" cy="${C}" r="${R.band[1]}" fill="#0b1124"/>`;
      w+=`<path d="${sector(C,ang(tl.astroDusk),ang(tl.astroDawn+1440),R.band[0],R.band[1])}" fill="#121a3e"/>`;
      w+=`<path d="${sector(C,ang(tl.astroDawn),ang(tl.civilDawn),R.band[0],R.band[1])}" fill="#2c2f6e"/><path d="${sector(C,ang(tl.civilDawn),ang(st.sunrise),R.band[0],R.band[1])}" fill="#6a4a88"/>`;
      w+=`<path d="${sector(C,ang(st.sunset),ang(tl.civilDusk),R.band[0],R.band[1])}" fill="#8a4a6a"/><path d="${sector(C,ang(tl.civilDusk),ang(tl.astroDusk),R.band[0],R.band[1])}" fill="#3a2f6a"/>`;
      w+=`<path data-tip="${tAttr('<b>'+T('النهار','Daylight')+'</b><br>'+fmt(st.sunrise)+' – '+fmt(st.sunset)+' · '+durText(st.sunset-st.sunrise))}" d="${sector(C,ang(st.sunrise),ang(st.sunset),R.band[0],R.band[1])}" fill="url(#gDay)"/>`;
      // a few fixed stars on the night side
      for(let i=0;i<14;i++){ const a=ang(tl.astroDusk+(i+.5)/14*(m1440(tl.astroDawn-tl.astroDusk))), [x,y]=pol(C,a,Rm+((i*37)%17-8)); w+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${1+(i%3)*.5}" fill="#dfe6f5" fill-opacity=".7"/>`; }
      for(let k=0;k<24;k++){ const a=ang(k*60),[x1,y1]=pol(C,a,R.band[0]),[x2,y2]=pol(C,a,R.band[0]+(k%3?6:11)); w+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#eef1f8" stroke-opacity=".45" stroke-width="${k%3?1:2}"/>`;
        if(k%3===0) w+=word(C,a,R.band[0]+20,dg(k),12,'#eef1f8','num','fill-opacity=".6"'); }
      ['fajr','sunrise','dhuhr','asr','maghrib','isha'].forEach(k=>{ const t=p[k], [x,y]=pol(C,ang(t),R.band[1]-15), nxt=KEYS[D.next]===k;
        w+=`<g data-tip="${tAttr('<b>'+pname(k,D.friday)+'</b> '+fmt(t))}" transform="translate(${f1(x)} ${f1(y)})" color="${nxt?'#ffe0a0':'#ffffff'}"><circle r="13" fill="#070a16" fill-opacity=".72" stroke="${nxt?'#ffe0a0':'none'}" stroke-width="2"/>${prIcon(k,17)}</g>`; });
      // moonrise and moonset today (true times)
      try{ const mrs=trueSky.moonRiseSet(now); [[mrs.riseMin,T('شروق القمر','Moonrise')],[mrs.setMin,T('غروب القمر','Moonset')]].forEach(([t,n])=>{ if(t==null) return; const [x1,y1]=pol(C,ang(t),R.band[0]-2),[x2,y2]=pol(C,ang(t),R.band[0]+16);
        w+=`<line data-tip="${tAttr('<b>'+n+'</b> '+fmt(t))}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#dfe6f5" stroke-width="5" stroke-linecap="round"/>`; }); }catch(e){}
      // the Sun now, and the Moon at its true hour angle from the Sun
      { const up=nm>=p.sunrise&&nm<p.maghrib, [x,y]=pol(C,ang(nm),Rm);
        w+=`<g data-tip="${tAttr('<b>'+T('الشمس الآن','The Sun now')+'</b> '+fmt(nm)+'<br>'+T('اسحب على هذه الحلقة لترى وقتًا آخر','drag along this ring to see another time'))}" transform="translate(${f1(x)} ${f1(y)})" style="cursor:grab"><circle r="19" fill="#070a16" stroke="url(#gGold)" stroke-width="2.4"/>${sunG(8.5,up)}</g>`;
        const ph=Ephemeris.moonPhase(now), ma=ang(nm)+ (Ephemeris.moon(now).ra-Ephemeris.sun(now).ra), [mx,my]=pol(C,ma,Rm);
        w+=`<g data-tip="${tAttr('<b>'+T('القمر','The Moon')+'</b> · '+dg(Math.round(ph.illum*100))+'%')}" transform="translate(${f1(mx)} ${f1(my)})"><circle r="15" fill="#070a16" stroke="rgba(226,232,246,.6)" stroke-width="1.6"/>${moonG(11,ph)}</g>`; }
      s+=lay('band',w); }
    /* — numerals for the hands — */
    { let w=`<circle cx="${C}" cy="${C}" r="${R.num[1]}" fill="url(#gDisc)" stroke="url(#gGold)" stroke-width="2" stroke-opacity=".7"/>`;
      for(let k=0;k<60;k++){ const [x1,y1]=pol(C,k*6,R.num[1]-3),[x2,y2]=pol(C,k*6,R.num[1]-(k%5?10:18)); w+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${k%5?'rgba(226,232,246,.35)':'#ffe0a0'}" stroke-width="${k%5?1.2:2.6}"/>`; }
      for(let k=1;k<=12;k++){ const [x,y]=pol(C,k*30,R.num[0]+2); w+=`<text class="num" x="${f1(x)}" y="${f1(y)}" dy=".36em" font-size="${k%3?22:27}" font-weight="700" fill="${k%3?'#c5cde0':'#ffe0a0'}" text-anchor="middle">${dg(k)}</text>`; }
      s+=lay('numerals',w); }
    /* — the orrery: Moon and planets at their true ecliptic longitudes; the eclipse nodes — */
    { let w=''; const eps=Ephemeris.obliquity(now)*D2R;
      PLANETS.forEach(([key,ar,col,r])=>{ w+=ring(C,r,col,1,'stroke-opacity=".18" stroke-dasharray="2 6"'); });
      // the Moon's orbit and the nodes (the ascending node, same elements as Ephemeris.moon)
      const rM=214; w+=ring(C,rM,'#dfe6f5',1.2,'stroke-opacity=".3" stroke-dasharray="1 5"');
      { const Nn=nrm(125.1228-0.0529538083*Ephemeris.D(now)); [[Nn,T('العقدة الصاعدة','Ascending node')],[Nn+180,T('العقدة النازلة','Descending node')]].forEach(([a,n],i)=>{ const [x,y]=pol(C,a,rM);
        w+=`<g data-tip="${tAttr('<b>'+n+'</b><br>'+T('حيث يقطع القمر فلك البروج — هنا تقع الكسوفات','where the Moon crosses the ecliptic — eclipses happen here'))}" transform="translate(${f1(x)} ${f1(y)})"><circle r="6.5" fill="none" stroke="#b39dff" stroke-width="2"/><path d="M${i?-4:4} 0h${i?-8:8}" stroke="#b39dff" stroke-width="2"/></g>`; }); }
      PLANETS.forEach(([key,ar,col,r])=>{ try{ const q=trueSky.planetEquatorial(key,now), al=q.ra*15*D2R, de=q.dec*D2R;
          const lam=nrm(Math.atan2(Math.sin(al)*Math.cos(eps)+Math.tan(de)*Math.sin(eps),Math.cos(al))/D2R), up=trueSky.altitudeOf(q.ra,q.dec,now)>0, [x,y]=pol(C,lam,r);
          const op=hide()&&!up?.22:1;
          w+=`<g opacity="${op}" data-tip="${tAttr('<b>'+(en?key:ar)+'</b> · '+L2(ZODIAC[Math.floor(lam/30)%12])+' '+dg(Math.floor(lam%30))+'°<br>'+(up?T('فوق الأفق الآن','above the horizon now'):T('تحت الأفق الآن','below the horizon now')))}"><circle cx="${f1(x)}" cy="${f1(y)}" r="7.5" fill="${col}" stroke="#05070f" stroke-width="1.6"/>`+
            `<text x="${f1(x)}" y="${f1(y-14)}" font-size="12.5" fill="${col}" text-anchor="middle" stroke="#05070f" stroke-width="4" paint-order="stroke">${en?key:ar}</text></g>`; }catch(e){} });
      { const ph=Ephemeris.moonPhase(now), [x,y]=pol(C,moonE.lon,rM), mt=trueSky.moonAltTopo(now), up=mt.alt>(-0.5667-0.2725*mt.par);
        w+=`<g opacity="${hide()&&!up?.25:1}" data-tip="${tAttr('<b>'+T('القمر','The Moon')+'</b> · '+(en?['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent'][ph.idx]:ph.name)+' '+dg(Math.round(ph.illum*100))+'%<br>'+T('عمره ','age ')+dg(ph.age.toFixed(1))+T(' يوم',' days'))}" transform="translate(${f1(x)} ${f1(y)})"><circle r="19" fill="#05070f" stroke="rgba(226,232,246,.6)" stroke-width="1.4"/>${moonG(15,ph)}</g>`; }
      s+=lay('orrery',w); }
    /* — the stars, by their true direction (north up, east right) — */
    { let w=ring(C,(R.star[0]+R.star[1])/2,'rgba(223,230,245,.07)',R.star[1]-R.star[0]);
      starField.starsData.forEach(st=>{ try{ const aa=observer.raDecToAltAz(st[1],st[2],now), up=aa.alt>-5, [x,y]=pol(C,aa.az,(R.star[0]+R.star[1])/2);
        w+=`<g opacity="${up?1:.25}" data-tip="${tAttr('<b>'+(en?STAR_EN[st[0]]:st[0])+'</b><br>'+T('الارتفاع ','altitude ')+dg(Math.round(aa.alt))+'° · '+T('الاتجاه ','azimuth ')+dg(Math.round(aa.az))+'°')}"><path d="M${f1(x)} ${f1(y-6)}l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#eef1f8"/>`+
          `<text x="${f1(x)}" y="${f1(y+17)}" font-size="11.5" fill="#c5cde0" text-anchor="middle">${en?STAR_EN[st[0]]:st[0]}</text></g>`; }catch(e){} });
      s+=lay('stars',w); }
    /* — directions: north, the qibla, the shadow, and where the Sun and Moon are — */
    { let w=`<circle cx="${C}" cy="${C}" r="${R.hor[1]}" fill="#070b18" stroke="rgba(255,122,110,.25)" stroke-width="1.2"/>`;
      for(let k=0;k<72;k++){ const [x1,y1]=pol(C,k*5,R.hor[1]-2),[x2,y2]=pol(C,k*5,R.hor[1]-(k%18===0?12:k%2?4:7)); w+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#eef1f8" stroke-opacity="${k%18===0?.8:.3}" stroke-width="1"/>`; }
      [[0,T('ش','N')],[90,T('ق','E')],[180,T('ج','S')],[270,T('غ','W')]].forEach(([a,t])=>{ const [x,y]=pol(C,a,R.hor[0]+6); w+=`<text x="${f1(x)}" y="${f1(y)}" dy=".36em" font-size="15" font-weight="700" fill="${a===0?'#72e4d0':'#c5cde0'}" text-anchor="middle">${t}</text>`; });
      const qb=observer.computeQiblaBearing(observer.lat,observer.lon), sa=observer.sunAltAzNow(now), mt=trueSky.moonAltTopo(now);
      const arrow=(a,r,col,w2,tipT)=>{ const [x,y]=pol(C,a,r); return `<g data-tip="${tAttr(tipT)}"><line x1="${C}" y1="${C}" x2="${f1(x)}" y2="${f1(y)}" stroke="${col}" stroke-width="${w2}" stroke-linecap="round"/><path d="M${f1(x)} ${f1(y)}l-7 14h14z" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})" fill="${col}"/></g>`; };
      w+=arrow(0,R.hor[1]-4,'#72e4d0',2.4,'<b>'+T('الشمال','North')+'</b>');
      if(sa.alt>0) w+=arrow(observer.shadowDirectionNow(now),R.hor[1]-6,'#b39dff',2.2,'<b>'+T('اتجاه ظلك الآن','Your shadow now')+'</b> '+dg(Math.round(observer.shadowDirectionNow(now)))+'°');
      w+=arrow(qb,R.hor[1]+2,'#ff7a6e',3.4,'<b>'+T('القبلة','Qibla')+'</b> '+dg(qb.toFixed(1))+'° '+T('من الشمال','from north'));
      { const [x,y]=pol(C,sa.az,R.hor[1]-12); w+=`<g data-tip="${tAttr('<b>'+T('جهة الشمس','The Sun')+'</b> '+dg(Math.round(sa.az))+'° · '+T('ارتفاع ','alt ')+dg(Math.round(sa.alt))+'°')}" opacity="${sa.alt>0?1:.35}" transform="translate(${f1(x)} ${f1(y)})">${sunG(5,sa.alt>0)}</g>`; }
      { const [x,y]=pol(C,mt.az,R.hor[1]-12); w+=`<g data-tip="${tAttr('<b>'+T('جهة القمر','The Moon')+'</b> '+dg(Math.round(mt.az))+'° · '+T('ارتفاع ','alt ')+dg(Math.round(mt.alt))+'°')}" opacity="${mt.alt>0?1:.35}" transform="translate(${f1(x)} ${f1(y)})">${moonG(5.5,Ephemeris.moonPhase(now))}</g>`; }
      s+=lay('horizon',w); }
    /* — the Earth now — */
    s+=lay('earth',`<g data-tip="${tAttr('<b>'+T('الأرض الآن','The Earth now')+'</b><br>'+T('من فوق موقعك: الليل والنهار الآن، والكعبة وطريق القبلة','above your place: night and day now, the Kaaba and the way to it'))}">${globeSVG(C,C,R.earth,observer.lat,observer.lon,now)}</g>`);
    /* — the four corners — */
    { let w='';
      const gauge=(cx,cy,title,lo,hi,val,col,tipT)=>{ // val in [-1,1] → needle −60°..+60°
        let g=`<circle cx="${cx}" cy="${cy}" r="82" fill="#070b18" stroke="url(#gGold)" stroke-width="1.6" stroke-opacity=".6"/><path d="${arcD(cx,-60,60,62)}" transform="translate(${cx-cx} 0)" fill="none"/>`;
        const A=(a,r)=>[cx+r*Math.sin(a*D2R),cy-r*Math.cos(a*D2R)];
        for(let k=-6;k<=6;k++){ const a=k*10,[x1,y1]=A(a,64),[x2,y2]=A(a,k%3?58:52); g+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#c5cde0" stroke-opacity=".5" stroke-width="${k%3?1:2}"/>`; }
        const [lx,ly]=A(-60,40),[hx,hy]=A(60,40); g+=`<text x="${f1(lx)}" y="${f1(ly)}" font-size="12" fill="#8e98b3" text-anchor="middle">${lo}</text><text x="${f1(hx)}" y="${f1(hy)}" font-size="12" fill="#8e98b3" text-anchor="middle">${hi}</text>`;
        const a=Math.max(-60,Math.min(60,val*60)),[nx2,ny2]=A(a,60);
        g+=`<line x1="${cx}" y1="${cy}" x2="${f1(nx2)}" y2="${f1(ny2)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="${col}"/>`;
        g+=`<text x="${cx}" y="${cy+38}" font-size="13.5" font-weight="700" fill="#c5cde0" text-anchor="middle">${title}</text>`;
        return `<g data-tip="${tAttr(tipT)}">${g}</g>`; };
      const eot=AstroMath.equationOfTimeMinutes(now);
      w+=gauge(104,104,T('معادلة الزمن','Equation of time'),'−16','+16',eot/16,'#72e4d0','<b>'+T('معادلة الزمن','Equation of time')+'</b> '+(eot>=0?'+':'')+dg(eot.toFixed(1))+T(' دقيقة',' min'));
      const ph=Ephemeris.moonPhase(now);
      w+=gauge(1096,104,T('نور القمر','Moonlight'),T('محاق','new'),T('بدر','full'),ph.illum*2-1,'#dfe6f5','<b>'+T('نور القمر','Moonlight')+'</b> '+dg(Math.round(ph.illum*100))+'%');
      { const cx=104,cy=1096; let g=`<circle cx="${cx}" cy="${cy}" r="82" fill="#070b18" stroke="url(#gGold)" stroke-width="1.6" stroke-opacity=".6"/>`;
        WD.forEach((d2,i)=>{ const a=AstroMath.dayArcAngle(i), x=cx+56*Math.sin(a*D2R), y=cy-56*Math.cos(a*D2R); g+=`<text x="${f1(x)}" y="${f1(y)}" dy=".35em" font-size="11.5" fill="${i===lp.wd?'#ffe0a0':'#8e98b3'}" font-weight="${i===lp.wd?700:400}" text-anchor="middle">${en?d2[1].slice(0,3):d2[0].replace('ال','')}</text>`; });
        const a=AstroMath.dayArcAngle(lp.wd),x=cx+40*Math.sin(a*D2R),y=cy-40*Math.cos(a*D2R);
        g+=`<line x1="${cx}" y1="${cy}" x2="${f1(x)}" y2="${f1(y)}" stroke="#ffe0a0" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="#ffe0a0"/><text x="${cx}" y="${cy+38}" font-size="13.5" font-weight="700" fill="#c5cde0" text-anchor="middle">${T('يوم الأسبوع','Weekday')}</text>`;
        w+=`<g data-tip="${tAttr('<b>'+L2(WD[lp.wd])+'</b><br>'+T('عقرب يرجع إلى البداية كل أسبوع','a retrograde hand: it jumps back each week'))}">${g}</g>`; }
      { const cx=1096,cy=1096; let g=`<g id="gzTourb" style="cursor:zoom-in" data-tip="${tAttr('<b>'+T('التوربيون','Tourbillon')+'</b><br>'+T('دورة كل ستين ثانية، مع الساعة الحقيقية. المسه ليكبر.','one turn every 60 s, in step with the real clock. Tap to enlarge.'))}"><circle cx="${cx}" cy="${cy}" r="82" fill="#070b18" stroke="url(#gGold)" stroke-width="1.6" stroke-opacity=".6"/>`;
        g+=`<g class="spin60" style="animation-delay:-${(now.getTime()%60000)/1000}s">${tourbCage(cx,cy,58)}</g><text x="${cx}" y="${cy+76}" font-size="12.5" font-weight="700" fill="#c5cde0" text-anchor="middle">${T('توربيون','Tourbillon')}</text></g>`;
        w+=g; }
      s+=lay('corners',w); }
    svg.querySelector('#gzS').innerHTML=`<defs><linearGradient id="gDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a8"/><stop offset="1" stop-color="#7fb2ff"/></linearGradient></defs>`+s;
    svg.setAttribute('aria-label',T('الزيج الكبرى — ','The Grand Zij — ')+fmt(nm));
  }
  function hands(now,smooth){
    if(!svg) return;
    const nm=localMin(now), hA=(nm%720)/720*360, mA=(nm%60)/60*360, sA=(Math.floor(now.getTime()/1000)%60)*6;
    const set=(id,a,snap)=>{ const g=svg.querySelector('#'+id); g.classList.toggle('nosnap',!snap); g.style.transform=`rotate(${a.toFixed(3)}deg)`; };
    set('gzHour',hA,smooth); set('gzMin',mA,smooth);
    const sg=svg.querySelector('#gzSec'), prev=+sg.dataset.a||0; let t=sA; while(t<prev-180) t+=360; if(t-prev>200) t-=360; sg.dataset.a=t; set('gzSec',t,smooth&&!reducedMotion());
  }
  return {mount,draw,hands,setLayer,highlight,zoomBy,zoomReset,LAYERS,isOn:on,reset(){lastKey='';}};
})();

/* a tourbillon cage: three arms, a balance wheel, jewels — drawn, not imaged */
function tourbCage(cx,cy,r){
  let s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#gSilver)" stroke-width="${r/14}"/>`;
  for(let i=0;i<3;i++){ const a=i*120*D2R, x=cx+r*Math.sin(a), y=cy-r*Math.cos(a); s+=`<line x1="${cx}" y1="${cy}" x2="${f1(x)}" y2="${f1(y)}" stroke="url(#gSilver)" stroke-width="${f1(r/9)}" stroke-linecap="round"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r/9)}" fill="#ff5d7a" stroke="#fff" stroke-opacity=".5"/>`; }
  s+=`<circle cx="${cx}" cy="${cy}" r="${f1(r*.62)}" fill="none" stroke="url(#gGold)" stroke-width="${f1(r/16)}"/>`;
  for(let i=0;i<4;i++){ const a=i*90*D2R+.4, x=cx+r*.62*Math.sin(a), y=cy-r*.62*Math.cos(a); s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r/14)}" fill="url(#gGold)"/>`; }
  s+=`<path d="M${cx} ${cy}m-${f1(r*.4)} 0a${f1(r*.4)} ${f1(r*.4)} 0 1 0 ${f1(r*.8)} 0a${f1(r*.4)} ${f1(r*.4)} 0 1 0 -${f1(r*.8)} 0" fill="none" stroke="#8ab6ff" stroke-width="${f1(r/30)}" stroke-dasharray="${f1(r/14)} ${f1(r/20)}"/>`;
  return s+`<circle cx="${cx}" cy="${cy}" r="${f1(r/7)}" fill="url(#gGold)" stroke="#3b2c10"/><circle cx="${cx}" cy="${cy}" r="${f1(r/16)}" fill="#ff5d7a"/>`;
}
function openTourbillon(){
  let d=$('tourbDlg');
  if(!d){ d=document.createElement('dialog'); d.id='tourbDlg'; d.setAttribute('aria-label',T('التوربيون','Tourbillon')); document.body.appendChild(d); d.addEventListener('click',e=>{ if(e.target===d) d.close(); }); }
  const now=new Date();
  d.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><h3 style="margin:0">${T('التوربيون','The tourbillon')}</h3>
<svg viewBox="0 0 400 400" width="min(70vmin,460px)" height="min(70vmin,460px)"><defs>${SVG_DEFS}</defs><circle cx="200" cy="200" r="190" fill="#070b18" stroke="url(#gGold)" stroke-width="3"/>
${Array.from({length:60},(_,k)=>{ const [x1,y1]=pol(200,k*6,186),[x2,y2]=pol(200,k*6,k%5?176:166); return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#c5cde0" stroke-opacity="${k%5?.35:.8}" stroke-width="${k%5?1:2.4}"/>`; }).join('')}
<g class="spin60" style="animation-delay:-${(now.getTime()%60000)/1000}s">${tourbCage(200,200,150)}</g></svg>
<p class="muted" style="margin:0;max-width:420px;text-align:center">${T('القفص يدور دورة كاملة كل ستين ثانية مع الساعة الحقيقية، كما في الساعات الميكانيكية الفاخرة.','The cage turns once every sixty seconds, in step with the real clock, as in fine mechanical watches.')}</p>
<button class="btn" onclick="this.closest('dialog').close()">${T('إغلاق','Close')}</button></div>`;
  d.showModal();
}
