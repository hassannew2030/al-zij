'use strict';
/* ===== Screens 3–5: the qibla, the sky and «more» (settings, help, checks, about) ===== */

/* a legacy instrument (beta's Qibla or Sky module, verbatim) inside a frame, loaded only when asked for */
function legacyFrame(host,id,file){
  if($(id)) return;
  const f=document.createElement('iframe'); f.id=id; f.className='frame'; f.title=T('الأداة التفصيلية','Detailed instrument');
  f.setAttribute('allow','geolocation; accelerometer; gyroscope; magnetometer; screen-wake-lock');
  host.appendChild(f);
  f.addEventListener('load',()=>{ f._ready=true; },{once:true});
  fetch('claude/legacy/'+file).then(r=>r.text()).then(h=>{ f.srcdoc=h; }).catch(()=>{ host.textContent=T('تعذّر فتح الأداة.','The instrument could not be opened.'); });
}

/* ==================== the qibla ==================== */
Z.screens.qibla = (()=>{
  const el=$('scr-qibla'); let built=false, heading=null, lastKey='', listening=false;
  function build(){
    el.innerHTML=`<div class="qgrid">
  <div class="card" style="padding:14px"><svg class="qdial svgd" id="qDial" viewBox="0 0 800 800" role="img"></svg>
    <div class="row" style="justify-content:center;margin-top:8px"><button type="button" class="btn" id="qCompass">${T('استخدم بوصلة الجهاز','Use the device compass')}</button><button type="button" class="btn ghost" id="qCopy">${T('انسخ اتجاه القبلة','Copy the qibla direction')}</button></div>
    <p class="dialhint" id="qHint"></p></div>
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="card"><div class="eyebrow">${T('اتجاه القبلة من الشمال الحقيقي','Qibla from true north')}</div><div class="big-deg num" id="qDeg"></div>
      <dl class="kv" style="margin-top:12px" id="qKv"></dl></div>
    <div class="card"><h3>${T('تأكد بالشمس — دون بوصلة','Check with the Sun — no compass')}</h3><div class="occ" id="qSun"></div></div>
    <div class="card mapcard"><h3>${T('الطريق إلى الكعبة','The way to the Kaaba')}</h3><svg class="svgd" id="qGlobe" viewBox="0 0 400 400" role="img"></svg></div>
    <div class="card"><h3>${T('الأداة التفصيلية للجوال','The detailed phone tool')}</h3><p class="muted" style="font-size:13.5px;margin:0 0 10px">${T('بوصلة الجوال الكاملة بالمعايرة، ومعاينة بالسحب، وتأكيد بالشمس والقمر.','The full phone compass with calibration, drag preview, and Sun and Moon confirmation.')}</p><button type="button" class="btn" id="qLegacy">${T('افتح الأداة','Open the tool')}</button><div id="qLegacyHost" style="margin-top:12px"></div></div>
  </div></div>`;
    $('qCompass').onclick=startCompass; $('qCopy').onclick=()=>{ const qb=observer.computeQiblaBearing(observer.lat,observer.lon); copyText(T('اتجاه القبلة من ','Qibla from ')+placeName()+': '+dg(qb.toFixed(1))+'° '+T('من الشمال الحقيقي','from true north')+' — alzijapp.com'); };
    $('qLegacy').onclick=()=>{ legacyFrame($('qLegacyHost'),'legacy-qibla','qibla.html'); $('qLegacy').hidden=true; };
    built=true;
  }
  async function startCompass(){
    try{ if(typeof DeviceOrientationEvent!=='undefined'&&DeviceOrientationEvent.requestPermission){ const r=await DeviceOrientationEvent.requestPermission(); if(r!=='granted'){ toast(T('لم يُسمح بالبوصلة','Compass not allowed')); return; } } }catch(e){}
    if(listening) return; listening=true;
    const on=e=>{ let h=null; if(e.webkitCompassHeading!=null) h=e.webkitCompassHeading; else if(e.absolute&&e.alpha!=null) h=(360-e.alpha)%360; if(h!=null){ heading=h; draw(true); } };
    addEventListener('deviceorientationabsolute',on); addEventListener('deviceorientation',on);
    setTimeout(()=>{ if(heading==null) toast(T('لا توجد بوصلة في هذا الجهاز — الاتجاه محسوب من الشمال','No compass on this device — the direction is drawn from north')); },2500);
  }
  function sunMatches(now,qb){   // moments today when the Sun stands in the qibla direction, or right behind it
    const D=dayOf(now), out=[]; const base=epochOfLocal(D.lp,0,now);
    let prev=null; for(let m=Math.floor(D.p.sunrise);m<=Math.ceil(D.p.maghrib);m++){ const t=new Date(base+m*6e4), a=observer.sunAltAzNow(t); if(a.alt<2){ prev=null; continue; }
      [[qb,'face'],[(qb+180)%360,'back']].forEach(([target,kind])=>{ let d=((a.az-target+540)%360)-180; if(prev&&prev[kind]!=null&&Math.sign(prev[kind])!==Math.sign(d)&&Math.abs(d)<20) out.push({m,kind}); (prev=prev||{})[kind]=d; });
      prev=prev||{}; }
    return out;
  }
  function draw(fast){
    const now=new Date(), qb=observer.computeQiblaBearing(observer.lat,observer.lon), C=400;
    const key=Math.floor(now.getTime()/6e4)+'|'+Z.ver+'|'+(heading==null?'':Math.round(heading));
    if(key===lastKey) return; lastKey=key;
    const rot=heading==null?0:-heading, sa=observer.sunAltAzNow(now), mt=trueSky.moonAltTopo(now);
    let s=`<defs>${SVG_DEFS}<radialGradient id="qFace" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#18213f"/><stop offset="1" stop-color="#070a16"/></radialGradient></defs>`;
    s+=`<circle cx="${C}" cy="${C}" r="380" fill="url(#qFace)" stroke="url(#gGold)" stroke-width="2.5"/><g transform="rotate(${f1(rot)} ${C} ${C})">`;
    for(let k=0;k<360;k+=2){ const big=k%30===0,[x1,y1]=pol(C,k,370),[x2,y2]=pol(C,k,big?340:k%10===0?352:360); s+=`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${big?'#ffe0a0':'#c5cde0'}" stroke-opacity="${big?.9:.35}" stroke-width="${big?2.4:1}"/>`;
      if(big&&k%90) s+=word(C,k,322,dg(k),18,'#8e98b3','num'); }
    [[0,T('ش','N'),'#72e4d0'],[90,T('ق','E'),'#eef1f8'],[180,T('ج','S'),'#eef1f8'],[270,T('غ','W'),'#eef1f8']].forEach(([a,t,c])=>{ const [x,y]=pol(C,a,316); s+=`<text x="${f1(x)}" y="${f1(y)}" dy=".36em" font-size="34" font-weight="700" fill="${c}" text-anchor="middle" transform="rotate(${-rot} ${f1(x)} ${f1(y)})">${t}</text>`; });
    s+=ring(C,250,'rgba(255,255,255,.08)',1)+ring(C,150,'rgba(255,255,255,.06)',1);
    { const [x,y]=pol(C,sa.az,280); s+=`<g opacity="${sa.alt>0?1:.35}" transform="translate(${f1(x)} ${f1(y)})" data-tip="${tAttr('<b>'+T('الشمس','The Sun')+'</b> '+dg(Math.round(sa.az))+'°')}">${sunG(11,sa.alt>0)}</g>`; }
    { const [x,y]=pol(C,mt.az,280); s+=`<g opacity="${mt.alt>0?1:.35}" transform="translate(${f1(x)} ${f1(y)})" data-tip="${tAttr('<b>'+T('القمر','The Moon')+'</b> '+dg(Math.round(mt.az))+'°')}">${moonG(11,Ephemeris.moonPhase(now))}</g>`; }
    if(sa.alt>0){ const sd=observer.shadowDirectionNow(now),[x,y]=pol(C,sd,230); s+=`<line x1="${C}" y1="${C}" x2="${f1(x)}" y2="${f1(y)}" stroke="#b39dff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9" data-tip="${tAttr('<b>'+T('اتجاه ظلك','Your shadow')+'</b>')}"/>`; }
    { const [x,y]=pol(C,qb,300),[kx,ky]=pol(C,qb,330);
      s+=`<line x1="${C}" y1="${C}" x2="${f1(x)}" y2="${f1(y)}" stroke="#ff7a6e" stroke-width="9" stroke-linecap="round"/><path d="M${f1(x)} ${f1(y)}l-18 34h36z" transform="rotate(${f1(qb)} ${f1(x)} ${f1(y)})" fill="#ff7a6e"/>`;
      s+=`<g transform="translate(${f1(kx)} ${f1(ky)}) rotate(${-rot})"><rect x="-17" y="-17" width="34" height="34" rx="3" fill="#111" stroke="#ffe0a0" stroke-width="2.4"/><path d="M-17 -6H17" stroke="#ffe0a0" stroke-width="3"/></g>`; }
    s+=`</g><circle cx="${C}" cy="${C}" r="14" fill="url(#gGold)"/>`;
    if(heading!=null){ s+=`<path d="M${C} 4l-14 26h28z" fill="#72e4d0"/>`; }
    $('qDial').innerHTML=s; $('qDial').setAttribute('aria-label',T('القبلة ','Qibla ')+dg(qb.toFixed(1))+'°');
    if(!$('qDial')._tips){ wireTips($('qDial')); $('qDial')._tips=1; }
    $('qDeg').textContent=dg(qb.toFixed(1))+'°';
    const decl=AstroMath.magneticDeclination(observer.lat,observer.lon), km=observer.kaabaDistanceKm(observer.lat,observer.lon);
    let turn=''; if(heading!=null){ let d=((qb-heading+540)%360)-180; turn=Math.abs(d)<3?T('أنت متجه إلى القبلة ✓','You are facing the qibla ✓'):(d>0?T('استدر يمينًا ','Turn right '):T('استدر يسارًا ','Turn left '))+dg(Math.abs(Math.round(d)))+'°'; }
    $('qKv').innerHTML=`<dt>${T('الموقع','Place')}</dt><dd>${esc(placeName())}</dd><dt>${T('المسافة إلى الكعبة','Distance to the Kaaba')}</dt><dd class="num">${dg(Math.round(km).toLocaleString('en'))} ${T('كم','km')}</dd>`+
      (decl?`<dt>${T('من الشمال المغناطيسي','From magnetic north')}</dt><dd class="num">${dg(((qb-decl+360)%360).toFixed(1))}° <small class="muted">(${T('الانحراف ','declination ')}${dg((decl>=0?'+':'')+decl.toFixed(1))}°)</small></dd>`:'')+
      (heading!=null?`<dt>${T('اتجاه الجهاز','Device heading')}</dt><dd class="num">${dg(Math.round(heading))}°</dd><dt>${T('التوجيه','Turn')}</dt><dd style="color:var(--teal);font-weight:700">${turn}</dd>`:'');
    if(!fast){ const ms=sunMatches(now,qb), D=dayOf(now); let k=null; try{ k=kaabaToday(now); }catch(e){}
      $('qSun').innerHTML=(ms.length?ms.map(x=>`<div><span>${x.kind==='face'?T('الشمس في جهة القبلة: استقبلها','The Sun is in the qibla direction: face it'):T('الشمس خلف القبلة: ظلك يشير إليها','The Sun is behind the qibla: your shadow points to it')}</span><b class="num">${fmt(x.m)}</b></div>`).join(''):`<div><span>${T('لا تمر الشمس اليوم بجهة القبلة ولا بعكسها وهي مرتفعة.','Today the Sun does not pass the qibla direction (or its opposite) while up.')}</span></div>`)+
        (k?`<div><span>${notesOf(D)[0]||''}</span></div>`:'')+`<div><span>${T('أو: الآن الشمس على ','Or: the Sun is now at ')}${dg(Math.round(sa.az))}°${sa.alt>0?T(' — القبلة على ',' — the qibla is ')+dg(Math.round(((qb-sa.az+540)%360)-180))+T('° منها','° from it'):T(' (تحت الأفق)',' (below the horizon)')}</span></div>`;
      $('qGlobe').innerHTML=`<defs>${SVG_DEFS}<radialGradient id="gOcean" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#1d4d7a"/><stop offset="1" stop-color="#0a1c33"/></radialGradient><radialGradient id="gLimb" cx="50%" cy="50%" r="50%"><stop offset=".8" stop-color="#8ab6ff" stop-opacity="0"/><stop offset="1" stop-color="#8ab6ff" stop-opacity=".35"/></radialGradient></defs>`+
        globeSVG(200,200,180,(observer.lat+21.4225)/2,observer.lon+(((39.8262-observer.lon+540)%360)-180)/2,now);
    }
    $('qHint').textContent=heading==null?T('السهم الأحمر على القبلة والشمال إلى الأعلى. على الجوال اضغط «استخدم بوصلة الجهاز» ليدور القرص معك.','The red arrow is the qibla, north is up. On a phone press «Use the device compass» so the dial turns with you.'):T('ضع الجهاز مسطحًا وبعيدًا عن المعادن.','Hold the device flat, away from metal.');
  }
  Z.on('tick',()=>{ if(document.body.dataset.scr==='qibla'&&built) draw(false); });
  Z.on('place',()=>{ lastKey=''; }); Z.on('settings',()=>{ lastKey=''; });
  return {show(){ if(!built) build(); lastKey=''; }};
})();

/* ==================== the sky ==================== */
Z.screens.sky = (()=>{
  const el=$('scr-sky'); let built=false, tab=LS.get('zijClaudeSkyTab')||'moon', lastKey='', selNight=null;
  const TABS=[['moon',T('القمر','Moon')],['sun',T('الشمس','Sun')],['earth',T('الأرض والشمس والقمر','Earth, Sun & Moon')],['events',T('الأحداث','Events')],['full',T('المرصد الكامل','Full observatory')]];
  function build(){
    el.innerHTML=`<div class="row" style="margin-bottom:16px"><div class="seg" role="tablist">${TABS.map(([k,n])=>`<button type="button" role="tab" data-tab="${k}">${n}</button>`).join('')}</div></div><div id="skyBody"></div><div id="skyFull" hidden></div>`;
    el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
    built=true;
  }
  function setTab(t){ tab=t; LS.set('zijClaudeSkyTab',t); lastKey=''; el.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
    $('skyFull').hidden=t!=='full'; $('skyBody').hidden=t==='full';
    if(t==='full'){ const h=$('skyFull'); if(!h.firstChild) h.innerHTML=`<p class="muted" style="margin:0 0 10px">${T('المرصد التفصيلي كما هو في الزيج: الكسوف والخسوف، وترقّب الهلال، والمد والجزر، والأشعة فوق البنفسجية، والمدارات، وصور القمر الحقيقية، وإضافة الأحداث للتقويم.','The detailed observatory as it is in Al-Zij: eclipses, crescent watch, tides, UV, orbits, real Moon photos, and adding events to your calendar.')}</p>`; legacyFrame(h,'legacy-sky','sky.html'); }
    draw(); }
  const fmtDate=d=>{ const lp=localParts(d); return L2(WD[lp.wd])+' '+gregText(lp)+' · '+fmt(localMin(d)); };
  function moonTab(now){
    const D=dayOf(now), ph=Ephemeris.moonPhase(now), mo=Ephemeris.moon(now), mt=trueSky.moonAltTopo(now), mi=trueSky.moonMansionIndex(now), mrs=trueSky.moonRiseSet(now);
    const full=Ephemeris.nextElongation(now,180), nw=Ephemeris.nextElongation(now,0);
    // the nights of this Hijri month: the Moon at 8 pm of each
    let t=Date.UTC(D.lp.y,D.lp.m,D.lp.d,12)-(D.h.day-1)*864e5, nights=[];
    for(let i=0;i<31;i++){ const g=new Date(t+i*864e5), h=hijriCal.fromGregorian(g); if(h.month!==D.h.month) { if(i>0) break; else continue; }
      const lp=localParts(g), at=new Date(epochOfLocal(lp,20*60,g)); nights.push({h,lp,at,ph:Ephemeris.moonPhase(at)}); }
    if(selNight==null||!nights[selNight]) selNight=D.h.day-1;
    const sn=nights[selNight]||nights[0];
    return `<div class="skygrid"><div class="card" style="display:flex;flex-direction:column;align-items:center;gap:14px">
  <svg viewBox="-170 -170 340 340" style="width:min(100%,420px)" role="img" aria-label="${esc(phaseName(ph))}"><defs>${SVG_DEFS}<radialGradient id="mHalo"><stop offset=".7" stop-color="#dfe6f5" stop-opacity=".18"/><stop offset="1" stop-color="#dfe6f5" stop-opacity="0"/></radialGradient></defs><circle r="168" fill="url(#mHalo)"/>${moonG(140,ph,'#04060c')}</svg>
  <div style="text-align:center"><div style="font:700 30px/1.2 var(--f-display);color:var(--moon)">${esc(phaseName(ph))}</div><div class="muted">${T('ليلة ','Night ')}${dg(D.h.day)} ${L2(HM[D.h.month-1])} · ${dg(Math.round(ph.illum*100))}% ${T('مضاء','lit')}</div></div>
  <div style="width:100%"><h3>${T('ليالي الشهر','The nights of the month')} <small>${T('القمر عند الثامنة مساءً','the Moon at 8 pm')}</small></h3><div class="nights">${nights.map((n,i)=>`<button type="button" data-n="${i}" aria-pressed="${i===selNight}" class="${n.h.day===D.h.day?'tonight':''}" title="${esc(gregText(n.lp))}">${moonIconSVG(n.ph,9)}${dg(n.h.day)}</button>`).join('')}</div>
  <p class="muted" style="margin:10px 0 0;font-size:14px">${T('الليلة ','Night ')}${dg(sn.h.day)}: ${esc(L2(WD[sn.lp.wd])+' '+gregText(sn.lp))} · ${esc(phaseName(sn.ph))} ${dg(Math.round(sn.ph.illum*100))}%</p></div></div>
<div style="display:flex;flex-direction:column;gap:16px"><div class="card"><h3>${T('القمر الآن','The Moon now')}</h3><dl class="kv">
  <dt>${T('الإضاءة','Illumination')}</dt><dd class="num">${dg((ph.illum*100).toFixed(1))}%</dd>
  <dt>${T('العمر','Age')}</dt><dd class="num">${dg(ph.age.toFixed(1))} ${T('يوم','days')}</dd>
  <dt>${T('المنزلة','Mansion')}</dt><dd>${dg(mi+1)} · ${esc(EN()?MAN_EN[mi]:MANSION_NAMES[mi])}</dd>
  <dt>${T('البرج','Sign')}</dt><dd>${L2(ZODIAC[Math.floor(mo.lon/30)%12])}</dd>
  <dt>${T('الارتفاع والاتجاه','Altitude, azimuth')}</dt><dd class="num">${dg(mt.alt.toFixed(1))}° · ${dg(Math.round(mt.az))}°</dd>
  <dt>${T('البعد','Distance')}</dt><dd class="num">${dg(Math.round(mo.dist*6378.137).toLocaleString('en'))} ${T('كم','km')}</dd>
  <dt>${T('الشروق اليوم','Rises today')}</dt><dd class="num">${mrs.riseMin!=null?fmt(mrs.riseMin):T('لا يشرق اليوم','does not rise')}</dd>
  <dt>${T('الغروب اليوم','Sets today')}</dt><dd class="num">${mrs.setMin!=null?fmt(mrs.setMin):T('لا يغرب اليوم','does not set')}</dd></dl></div>
<div class="card"><h3>${T('القادم','Next')}</h3><div class="occ"><div><span>${T('البدر','Full moon')}</span><b>${full?fmtDate(full):'—'}</b></div><div><span>${T('المحاق (الاقتران)','New moon (conjunction)')}</span><b>${nw?fmtDate(nw):'—'}</b></div></div></div></div></div>`;
  }
  function sunTab(now){
    const D=dayOf(now), st=observer.sunTimes(now), tl=observer.twilightTimes(now), sa=observer.sunAltAzNow(now), eot=AstroMath.equationOfTimeMinutes(now), se=Ephemeris.nextSeasonEvent(now);
    // the Sun's height through the day, with the prayers on the curve
    const W=900,H=360,y0=190,ky=150/90, xs=m=>m/1440*W, base=epochOfLocal(D.lp,0,now); let pts='';
    for(let m=0;m<=1440;m+=10){ const a=observer.sunAltAzNow(new Date(base+m*6e4)).alt; pts+=(m?'L':'M')+f1(xs(m))+' '+f1(y0-a*ky); }
    const nowA=sa.alt, band=(alt,col,op)=>`<rect x="0" y="${f1(y0-alt*ky)}" width="${W}" height="${f1(Math.abs(alt)*ky)}" fill="${col}" opacity="${op}"/>`;
    let ch=`<svg viewBox="-10 0 ${W+20} ${H}" style="width:100%;height:auto" role="img" aria-label="${T('ارتفاع الشمس خلال اليوم','The Sun’s height through the day')}"><defs><linearGradient id="dayg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd76a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></linearGradient>${SVG_DEFS}</defs>`+
      band(-6,'#6a4a88',.25)+band(-12,'#3a2f6a',.18)+band(-18,'#1d1d4a',.18)+`<line x1="0" y1="${y0}" x2="${W}" y2="${y0}" stroke="#ffe0a0" stroke-opacity=".5" stroke-dasharray="6 6"/>`+
      `<path d="${pts}" fill="none" stroke="#ffd76a" stroke-width="3"/>`;
    for(let h=0;h<=24;h+=3) ch+=`<text x="${f1(xs(h*60))}" y="${H-6}" font-size="15" fill="#8e98b3" text-anchor="middle" class="num">${dg(h)}</text>`;
    KEYS.forEach(k=>{ const m=D.p[k], a=observer.sunAltAzNow(new Date(base+m*6e4)).alt, x=xs(m), y=y0-a*ky; ch+=`<g transform="translate(${f1(x)} ${f1(y)})" color="#eef1f8"><circle r="13" fill="#070a16" stroke="#ffe0a0" stroke-width="1.5"/>${prIcon(k,15)}</g><text x="${f1(x)}" y="${f1(y-22)}" font-size="15" fill="#eef1f8" text-anchor="middle">${pname(k,D.friday)}</text>`; });
    ch+=`<g transform="translate(${f1(xs(D.nm))} ${f1(y0-nowA*ky)})">${sunG(10,nowA>0)}</g></svg>`;
    return `<div class="skygrid"><div class="card"><h3>${T('مسار الشمس اليوم','The Sun’s path today')} <small>${T('الخط المنقّط الأفق، والأشرطة: الشفق المدني والبحري والفلكي','dotted line: horizon; bands: civil, nautical, astronomical twilight')}</small></h3>${ch}</div>
<div class="card"><h3>${T('الشمس','The Sun')}</h3><dl class="kv">
 <dt>${T('الشروق','Sunrise')}</dt><dd class="num">${fmt(D.p.sunrise)}</dd><dt>${T('الزوال','Solar noon')}</dt><dd class="num">${fmt(st.noon)}</dd><dt>${T('المغرب','Maghrib')}</dt><dd class="num">${fmt(D.p.maghrib)}</dd>
 <dt>${T('طول النهار','Day length')}</dt><dd class="num">${durText(st.sunset-st.sunrise)}</dd>
 <dt>${T('الشفق المدني','Civil twilight')}</dt><dd class="num">${fmt(tl.civilDawn)} – ${fmt(tl.civilDusk)}</dd><dt>${T('الشفق الفلكي','Astronomical twilight')}</dt><dd class="num">${fmt(tl.astroDawn)} – ${fmt(tl.astroDusk)}</dd>
 <dt>${T('الارتفاع والاتجاه الآن','Altitude, azimuth now')}</dt><dd class="num">${dg(sa.alt.toFixed(1))}° · ${dg(Math.round(sa.az))}°</dd>
 <dt>${T('اتجاه الظل','Shadow direction')}</dt><dd class="num">${sa.alt>0?dg(Math.round(observer.shadowDirectionNow(now)))+'°':T('الشمس تحت الأفق','Sun below horizon')}</dd>
 <dt>${T('معادلة الزمن','Equation of time')}</dt><dd class="num">${(eot>=0?'+':'')}${dg(eot.toFixed(1))} ${T('دقيقة','min')}</dd>
 <dt>${T('البرج','Sign')}</dt><dd>${L2(ZODIAC[Math.floor(Ephemeris.sun(now).lon/30)%12])}</dd>
 <dt>${T('الفصل القادم','Next season')}</dt><dd>${se?(EN()?['March equinox','June solstice','September equinox','December solstice'][Math.round(((Ephemeris.sun(se.date).lon)%360)/90)%4]:se.name)+' · '+fmtDate(se.date):'—'}</dd></dl></div></div>`;
  }
  function earthTab(now){
    const W=900,H=450, X=lo=>(lo+180)/360*W, Y=la=>(90-la)/180*H, ss=Ephemeris.subSolar(now), sl=Ephemeris.subLunar(now);
    let coast=''; coastRuns().forEach(run=>{ coast+=run.map(([lo,la],i)=>(i?'L':'M')+f1(X(lo))+' '+f1(Y(la))).join(''); });
    // night: for every longitude the latitude of the terminator
    const td=Math.tan(ss.lat*D2R); let night=''; const south=ss.lat>0;
    for(let lo=-180;lo<=180;lo+=2){ const la=Math.atan(-Math.cos((lo-ss.lon)*D2R)/(Math.abs(td)<1e-6?1e-6:td))/D2R; night+=(lo===-180?'M':'L')+f1(X(lo))+' '+f1(Y(la)); }
    night+=south?`L${W} ${H}L0 ${H}Z`:`L${W} 0L0 0Z`;
    const mk=(la,lo,inner,tipT)=>`<g transform="translate(${f1(X(lo))} ${f1(Y(la))})" data-tip="${tAttr(tipT)}">${inner}</g>`;
    const ang=(a,b,c,d)=>kmBetween(a,b,c,d)/111.195;
    return `<div class="skygrid"><div class="card"><h3>${T('الأرض الآن','The Earth now')} <small>${T('الليل والنهار، والنقطة التي تحت الشمس وتحت القمر','night and day; the points right under the Sun and the Moon')}</small></h3>
<svg id="eMap" class="svgd" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;border-radius:14px" role="img"><defs>${SVG_DEFS}</defs><rect width="${W}" height="${H}" fill="#0b2340"/><path d="${coast}" fill="none" stroke="#9fd6c8" stroke-opacity=".8" stroke-width="1.1"/><path d="${night}" fill="#02040c" fill-opacity=".55"/>
${mk(ss.lat,ss.lon,sunG(9),'<b>'+T('الشمس فوق هذه النقطة','The Sun is overhead here')+'</b>')}${mk(sl.lat,sl.lon,moonG(9,Ephemeris.moonPhase(now)),'<b>'+T('القمر فوق هذه النقطة','The Moon is overhead here')+'</b>')}
${mk(21.4225,39.8262,'<rect x="-6" y="-6" width="12" height="12" fill="#111" stroke="#ffe0a0" stroke-width="2"/>','<b>'+T('الكعبة','The Kaaba')+'</b>')}${mk(observer.lat,observer.lon,'<circle r="6" fill="#72e4d0" stroke="#02040c" stroke-width="2"/>','<b>'+esc(placeName())+'</b>')}</svg></div>
<div class="card"><h3>${T('الأجسام الثلاثة','The three bodies')}</h3><dl class="kv">
<dt>${T('الشمس فوق','Sun overhead at')}</dt><dd class="num">${coordText(ss.lat,ss.lon)}</dd><dt>${T('القمر فوق','Moon overhead at')}</dt><dd class="num">${coordText(sl.lat,sl.lon)}</dd>
<dt>${T('بُعدك عن نقطة الشمس','You to the Sun’s point')}</dt><dd class="num">${dg(ang(observer.lat,observer.lon,ss.lat,ss.lon).toFixed(1))}°</dd>
<dt>${T('بُعدك عن نقطة القمر','You to the Moon’s point')}</dt><dd class="num">${dg(ang(observer.lat,observer.lon,sl.lat,sl.lon).toFixed(1))}°</dd>
<dt>${T('الزاوية بين الشمس والقمر','Sun–Moon angle')}</dt><dd class="num">${dg(Ephemeris.moonPhase(now).psi.toFixed(1))}°</dd>
<dt>${T('بعد القمر','Moon distance')}</dt><dd class="num">${dg(Math.round(Ephemeris.moon(now).dist*6378.137).toLocaleString('en'))} ${T('كم','km')}</dd>
<dt>${T('بعد الشمس','Sun distance')}</dt><dd class="num">${dg((Ephemeris.sun(now).dist*149.598).toFixed(2))} ${T('مليون كم','million km')}</dd></dl></div></div>`;
  }
  function eventsTab(now){
    const ev=[], add=(d,icon,n,sub)=>{ if(d) ev.push({d,icon,n,sub}); };
    let t=now; for(let i=0;i<2;i++){ const f=Ephemeris.nextElongation(t,180); add(f,'🌕',T('البدر','Full moon')); t=new Date(f.getTime()+864e5); }
    t=now; for(let i=0;i<2;i++){ const f=Ephemeris.nextElongation(t,0); add(f,'🌑',T('المحاق — بداية شهر قمري','New moon')); t=new Date(f.getTime()+864e5); }
    t=now; for(let i=0;i<2;i++){ const s=Ephemeris.nextSeasonEvent(t); if(!s) break; add(s.date,'☀️',EN()?['March equinox','June solstice','September equinox','December solstice'][Math.round(Ephemeris.sun(s.date).lon/90)%4]:s.name); t=new Date(s.date.getTime()+864e5); }
    [[9,1,T('رمضان','Ramadan')],[10,1,T('عيد الفطر','Eid al-Fitr')],[12,9,T('يوم عرفة','Day of Arafah')],[12,10,T('عيد الأضحى','Eid al-Adha')],[1,1,T('رأس السنة الهجرية','Islamic New Year')],[1,10,T('عاشوراء','Ashura')]].forEach(([m,d,n])=>{ const k=hijriCal.daysUntilHijri(m,d); if(k!=null){ const g=new Date(Date.now()+k*864e5); const lp=localParts(g); add(new Date(epochOfLocal(lp,0,g)),'🕌',n,'date'); } });
    // the Sun over the Kaaba (or its opposite point): scan the coming year
    { const lp=localParts(now); let found=0; for(let i=0;i<370&&found<2;i++){ const g=new Date(Date.UTC(lp.y,lp.m,lp.d+i,9)); let k=null; try{ k=kaabaToday(g); }catch(e){} if(k&&!k.anti){ add(new Date(k.t),'🕋',T('الشمس فوق الكعبة — الظلال عكس القبلة','The Sun over the Kaaba — shadows point away from the qibla')); found++; } } }
    ev.sort((a,b)=>a.d-b.d);
    const inTxt=d=>{ const k=Math.round((d-now)/864e5); return k<=0?T('اليوم','today'):EN()?(k===1?'tomorrow':'in '+k+' days'):(k===1?'غدًا':'بعد '+dg(k)+' '+(k<=10?'أيام':'يومًا')); };
    return `<div class="card" style="max-width:860px"><h3>${T('الأحداث القادمة','Coming events')}</h3><div class="events">${ev.map(e=>{ const lp=localParts(e.d); return `<div><span style="font-size:22px;text-align:center">${e.icon}</span><span><b>${e.n}</b><small>${L2(WD[lp.wd])} ${gregText(lp)}${e.sub==='date'?' · '+hijriText(hijriCal.fromGregorian(e.d)):' · '+fmt(localMin(e.d))}</small></span><span class="in">${inTxt(e.d)}</span></div>`; }).join('')}</div>
<p class="muted" style="font-size:13px;margin:12px 0 0">${T('الكسوف والخسوف، وترقّب الهلال، والمد والجزر في «المرصد الكامل».','Eclipses, the crescent watch and tides are in «Full observatory».')}</p></div>`;
  }
  function draw(){
    if(!built||tab==='full') return; const now=new Date(), key=tab+'|'+Math.floor(now.getTime()/6e4)+'|'+Z.ver+'|'+selNight; if(key===lastKey) return; lastKey=key;
    const b=$('skyBody'); b.innerHTML=tab==='moon'?moonTab(now):tab==='sun'?sunTab(now):tab==='earth'?earthTab(now):eventsTab(now);
    b.querySelectorAll('[data-n]').forEach(x=>x.addEventListener('click',()=>{ selNight=+x.dataset.n; lastKey=''; draw(); }));
    b.querySelectorAll('svg.svgd').forEach(s=>wireTips(s));
  }
  Z.on('tick',()=>{ if(document.body.dataset.scr==='sky') draw(); });
  Z.on('place',()=>{ lastKey=''; }); Z.on('settings',()=>{ lastKey=''; });
  return {show(o){ if(!built) build(); setTab(o&&o.tab?o.tab:tab); }};
})();

/* ==================== more: settings, help, checks, about ==================== */
Z.screens.more = (()=>{
  const el=$('scr-more'); let built=false, sec='place';
  const SECS=[['g',T('إعداداتي','My settings')],['place',T('الموقع','Location')],['calc',T('طريقة الحساب','Calculation')],['hijri',T('التاريخ الهجري','Hijri date')],['view',T('العرض والخط','Display & type')],
    ['g',T('مساعدة','Help')],['guide',T('دليل الساعتين','Guide to the clocks')],['install',T('ثبّت الزيج','Install Al-Zij')],['share',T('شارك الزيج','Share Al-Zij')],['help',T('عندي مشكلة','I have a problem')],
    ['g',T('للمتخصصين','For specialists')],['check',T('التحقق من الأرقام','Check the numbers')],['data',T('كل الأرقام','All the numbers')],['g',T('عن الزيج','About')],['about',T('عن الزيج','About Al-Zij')]];
  function build(){ el.innerHTML=`<div class="mgrid"><nav class="card mnav" aria-label="${T('أقسام المزيد','Sections')}">${SECS.map(([k,n])=>k==='g'?`<div class="grp">${n}</div>`:`<button type="button" data-sec="${k}">${n}</button>`).join('')}</nav><div class="mbody" id="mBody"></div></div>`;
    el.querySelectorAll('[data-sec]').forEach(b=>b.addEventListener('click',()=>{ sec=b.dataset.sec; render(); $('mBody').focus&&$('mBody').scrollIntoView({block:'nearest'}); })); built=true; }
  const card=(title,inner)=>`<div class="card"><h2>${title}</h2>${inner}</div>`;
  const field=(label,inner,hint)=>`<div class="field"><span>${label}${hint?`<small>${hint}</small>`:''}</span><div class="row">${inner}</div></div>`;
  const opt=(v,cur,t)=>`<option value="${v}"${String(v)===String(cur)?' selected':''}>${esc(t)}</option>`;
  function render(){
    el.querySelectorAll('[data-sec]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.sec===sec)));
    const B=$('mBody'), now=new Date(), D=dayOf(now);
    if(sec==='place'){
      const locked=LS.get('zijLocationLocked')==='true'&&LS.get('zijLockByUser')==='1', last=LS.json('zijLocLast',null);
      const src=isDefaultPoint()?T('نقطة البداية (جدة) حتى يصل موقع جهازك','the starting point (Jeddah) until your device gives its place'):locked?T('موقع ثبّته أنت','pinned by you'):LS.get('zijLocSrc')==='net'?T('تقريبي من الشبكة','approximate, from the network'):T('من جهازك','from your device');
      B.innerHTML=card(T('الموقع','Location'),field(T('المكان','Place'),`<b>${esc(placeName())}</b> <span class="muted num">${coordText(observer.lat,observer.lon)}</span>`,src)+
        field(T('موقع الجهاز','Device location'),`<button class="btn gold" id="lGps">${T('حدّث من جهازي','Update from my device')}</button>`,last&&last.acc?T('آخر قراءة بدقة ±','last fix ±')+dg(last.acc)+T(' م',' m'):last&&last.err?T('رُفض الإذن آخر مرة','permission was refused last time'):'')+
        field(T('التثبيت','Pin'),`<button class="btn" id="lLock">${locked?T('ألغِ التثبيت','Unpin'):T('ثبّت هذا الموقع','Pin this place')}</button>`,T('المثبّت لا يتغير بقراءات الجهاز','a pinned place ignores device readings'))+
        field(T('ابحث عن مدينة','Find a city'),`<input type="search" id="lQ" placeholder="${T('مثال: الرياض، القاهرة، London','e.g. Riyadh, Cairo, London')}" style="flex:1;min-width:200px"><div class="results" id="lRes" style="width:100%"></div>`,T('من قائمة داخل الزيج، دون إنترنت','from a list inside Al-Zij, no internet'))+
        field(T('إحداثيات','Coordinates'),`<input type="number" id="lLat" step="0.0001" placeholder="${T('خط العرض','latitude')}" style="width:150px"><input type="number" id="lLon" step="0.0001" placeholder="${T('خط الطول','longitude')}" style="width:150px"><button class="btn" id="lSet">${T('اعتمد','Use')}</button>`));
      $('lGps').onclick=async()=>{ $('lGps').disabled=true; const ok=await refreshLocation(true); $('lGps').disabled=false; toast(ok?T('حُدّث الموقع','Location updated'):T('لم يصل موقع جديد','No new location')); render(); };
      $('lLock').onclick=()=>{ if(locked){ LS.set('zijLocationLocked','false'); LS.del('zijLockByUser'); } else { LS.set('zijLocationLocked','true'); LS.set('zijLockByUser','1'); LS.set('zijLastLocation',JSON.stringify({lat:observer.lat,lon:observer.lon})); LS.del('zijLocAuto'); } placeChanged(); render(); };
      const all=[...(UQI?UQI.cities.map(c=>({ar:c[3],en:c[4],lat:c[1],lon:c[2]})):[]),...(window.ZIJ_CITIES||[]).map(c=>({ar:c[0],en:CITY_EN[c[0]]||'',lat:c[1],lon:c[2]}))];
      $('lQ').oninput=()=>{ const q=$('lQ').value.trim().toLowerCase(); if(q.length<2){ $('lRes').innerHTML=''; return; }
        const hits=all.filter(c=>c.ar.includes(q)||(c.en||'').toLowerCase().includes(q)).slice(0,8);
        $('lRes').innerHTML=hits.length?hits.map((c,i)=>`<button class="btn" data-i="${i}">📍 ${esc(EN()&&c.en?c.en:c.ar)} <span class="muted num">${coordText(c.lat,c.lon)}</span></button>`).join(''):`<span class="muted">${T('لا نتائج — اكتب الإحداثيات بدلًا من ذلك.','No results — enter the coordinates instead.')}</span>`;
        $('lRes').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ const c=hits[+b.dataset.i]; setManualPlace(c.lat,c.lon); toast(T('اعتُمد ','Now using ')+(EN()&&c.en?c.en:c.ar)); render(); }); };
      $('lSet').onclick=()=>{ const la=parseFloat($('lLat').value), lo=parseFloat($('lLon').value); if(!(Math.abs(la)<=90&&Math.abs(lo)<=180)){ toast(T('إحداثيات غير صحيحة','Invalid coordinates')); return; } setManualPlace(la,lo); render(); };
    }
    else if(sec==='calc'){
      const m=observer.calcMethod||'AUTO', asr=LS.get('zijAsr')||'', hl=zijHighLatRule(), M=observer.activeMethod();
      const note=(typeof CALC_NOTES!=='undefined'&&CALC_NOTES[M])||(typeof CALC_NOTES_X!=='undefined'&&CALC_NOTES_X[M])||'';
      B.innerHTML=card(T('طريقة الحساب','Calculation'),field(T('الطريقة','Method'),`<select id="cM">${opt('AUTO',m,(EN()?'Automatic by country':CALC_NAMES.AUTO)+(m==='AUTO'?' → '+(EN()?M.replace(/_/g,' '):CALC_NAMES[M]):''))}${Object.keys(ZIJ_METHODS).map(k=>opt(k,m,EN()?k.replace(/_/g,' '):(CALC_NAMES[k]||k))).join('')}</select>`,EN()?'':note)+
        field(T('العصر','Asr'),`<select id="cA">${opt('',asr,T('حسب الطريقة','by the method'))}${opt('shafi',asr,T('الجمهور (ظل = طول الجسم)','Majority (shadow = length)'))}${opt('hanafi',asr,T('الحنفي (ظل = ضعفه)','Hanafi (shadow = twice)'))}</select>`)+
        field(T('خطوط العرض العالية','High latitudes'),`<select id="cH">${opt('angle',hl,T('نسبة من الليل بالزاوية (الأصل)','share of the night by angle (default)'))}${opt('seventh',hl,T('سُبع الليل','one seventh of the night'))}${opt('middle',hl,T('منتصف الليل','middle of the night'))}</select>`,T('حين لا يغيب الشفق صيفًا','when twilight never ends in summer'))+
        field(T('البلد','Country'),`<span class="num">${esc(zijCountry()||'—')}</span>`,T('يحدد الطريقة التلقائية','sets the automatic method'))+
        field(T('إزاحة المسجد','Mosque offsets'),(()=>{ const o=alLoadOffsets(),k=Object.keys(o); return (k.length?k.map(x=>pname(x)+' '+dg((o[x]>=0?'+':'')+o[x])+T('ث','s')).join(' · '):T('لا يوجد','none'))+` <button class="btn ghost" id="cOff">${T('من سجل الأذان','from the adhan log')}</button>`; })()));
      $('cM').onchange=e=>{ observer.calcMethod=e.target.value; LS.set('zijCalcMethod',e.target.value); settingsChanged(); render(); };
      $('cA').onchange=e=>{ if(e.target.value) LS.set('zijAsr',e.target.value); else LS.del('zijAsr'); settingsChanged(); render(); };
      $('cH').onchange=e=>{ LS.set('zijHighLat',e.target.value); settingsChanged(); render(); };
      $('cOff').onclick=()=>go('prayer');
    }
    else if(sec==='hijri'){
      B.innerHTML=card(T('التاريخ الهجري','Hijri date'),`<p style="font:700 28px/1.3 var(--f-display);color:var(--gold-2);margin:0 0 10px">${hijriText(D.h)}</p><p class="muted">${T('بتقويم أم القرى الرسمي. إن اختلف تقويم بلدك بيوم فعدّله هنا (لهذه الجلسة، كما في الزيج).','Official Umm al-Qura calendar. If your country differs by a day, adjust it here (for this session, as in Al-Zij).')}</p>
<div class="row"><button class="btn" id="hM">− ${T('يوم','day')}</button><span class="num">${dg((hijriCal.offset>0?'+':'')+hijriCal.offset)}</span><button class="btn" id="hP">+ ${T('يوم','day')}</button></div>`);
      $('hM').onclick=()=>{ hijriCal.adjust(-1); settingsChanged(); render(); }; $('hP').onclick=()=>{ hijriCal.adjust(1); settingsChanged(); render(); };
    }
    else if(sec==='view'){
      const fs=+LS.get('zijClaudeFs')||1, font=LS.get('zijClaudeFont')||'';
      const FONTS=[['',T('بليكس (الأصل)','Plex (default)')],["'ZMarkazi','ZInter',serif",T('مركزي','Markazi')],["'ZNaskh','ZInter',serif",T('نوتو نسخ','Noto Naskh')],["'ZAmiri','ZInter',serif",T('الأميري','Amiri')]];
      B.innerHTML=card(T('العرض والخط','Display & type'),
        field(T('اللغة','Language'),`<div class="seg"><button data-lang="ar" aria-pressed="${!EN()}">العربية</button><button data-lang="en" aria-pressed="${EN()}">English</button></div>`)+
        (EN()?'':field(T('الأرقام','Digits'),`<div class="seg"><button data-dig="ar" aria-pressed="${!latin()}">١٢٣</button><button data-dig="en" aria-pressed="${latin()}">123</button></div>`))+
        field(T('الأوقات','Times'),`<div class="seg"><button data-h24="0" aria-pressed="${!all24()}">${T('١٢ ساعة (ص/م)','12-hour')}</button><button data-h24="1" aria-pressed="${all24()}">${T('٢٤ ساعة','24-hour')}</button></div>`)+
        field(T('الساعة البسيطة','Simple clock'),`<div class="seg"><button data-d24="0" aria-pressed="${LS.get('zijDial24')==='0'}">${T('١٢ ساعة','12 h')}</button><button data-d24="1" aria-pressed="${LS.get('zijDial24')!=='0'}">${T('٢٤ ساعة','24 h')}</button></div>`)+
        field(T('حجم الخط','Text size'),`<div class="seg">${[0.9,1,1.12,1.25].map(v=>`<button data-fs="${v}" aria-pressed="${v===fs}">${dg(Math.round(v*100))}%</button>`).join('')}</div>`)+
        field(T('الخط','Typeface'),`<select id="vFont">${FONTS.map(([v,n])=>opt(v,font,n)).join('')}</select>`)+
        field(T('الحركة','Motion'),`<span class="switch"><input type="checkbox" id="vCalm" ${LS.get('zijCalm')==='1'?'checked':''}><i></i></span>`,T('أوقف الحركات (يحترم إعداد جهازك تلقائيًا)','stop animations (your device setting is respected anyway)')));
      B.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{ LS.set('zijLang',b.dataset.lang); location.reload(); });
      B.querySelectorAll('[data-dig]').forEach(b=>b.onclick=()=>{ LS.set('zijDigits',b.dataset.dig); settingsChanged(); render(); });
      B.querySelectorAll('[data-h24]').forEach(b=>b.onclick=()=>{ LS.set('zijClk24',b.dataset.h24); settingsChanged(); render(); });
      B.querySelectorAll('[data-d24]').forEach(b=>b.onclick=()=>{ LS.set('zijDial24',b.dataset.d24); settingsChanged(); render(); });
      B.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{ LS.set('zijClaudeFs',b.dataset.fs); document.documentElement.style.setProperty('--fs',b.dataset.fs); Z.emit('resize'); render(); });
      $('vFont').onchange=e=>{ if(e.target.value){ LS.set('zijClaudeFont',e.target.value); document.documentElement.style.setProperty('--f-ui',e.target.value); } else { LS.del('zijClaudeFont'); document.documentElement.style.removeProperty('--f-ui'); } };
      $('vCalm').onchange=e=>{ LS.set('zijCalm',e.target.checked?'1':'0'); document.body.classList.toggle('calm',e.target.checked); };
    }
    else if(sec==='guide'){
      B.innerHTML=card(T('الساعة البسيطة','The simple clock'),`<ul style="line-height:1.9;margin:0;padding-inline-start:20px">
<li>${T('الحلقة الملونة هي اليوم كله: الظهر في الأعلى ومنتصف الليل في الأسفل (أو الاثنتا عشرة ساعة القادمة في وضع ١٢ ساعة).','The coloured ring is the whole day: noon on top, midnight at the bottom (or the coming twelve hours in 12-hour mode).')}</li>
<li>${T('كل لون وقتُ صلاة إلى التي بعدها، والذهبي الصاعد على الحلقة هو ما مضى من الوقت الحالي.','Each colour is one prayer’s time until the next; the gold arc is how much of the current time has passed.')}</li>
<li>${T('الشمس على الحلقة حيث هي الآن؛ اسحبها لترى أي وقت آخر.','The Sun sits where it is now; drag it to see any other time.')}</li>
<li>${T('الحلقة الفضية ليالي الشهر الهجري، والقمر بطوره الحقيقي على ليلته.','The silver ring holds the nights of the Hijri month, with the Moon in its true phase on tonight.')}</li>
<li>${T('في وسط القرص نافذة السماء: الشمس والقمر بارتفاعهما الحقيقي فوق الأفق، والشرق يسارًا.','In the face is the sky window: the Sun and Moon at their true height, east on the left.')}</li></ul>`)+
        card(T('الزيج الكبرى','The Grand Zij'),`<dl class="kv" style="grid-template-columns:200px 1fr">${GrandZij.LAYERS.map(([k,c,n,d])=>`<dt style="color:${c}">${L2(n)}</dt><dd style="text-align:start;color:var(--ink-2)">${L2(d)}</dd>`).join('')}</dl>`)+
        card(T('لوحة المفاتيح','Keyboard'),`<dl class="kv" style="grid-template-columns:160px 1fr"><dt class="num">1–5</dt><dd style="text-align:start">${T('الشاشات','screens')}</dd><dt>← →</dt><dd style="text-align:start">${T('عشر دقائق (مع Shift ساعة) على الساعة','ten minutes (Shift: an hour) on a clock')}</dd><dt>PageUp / PageDown</dt><dd style="text-align:start">${T('يوم','a day')}</dd><dt>Home / Esc</dt><dd style="text-align:start">${T('الرجوع للآن','back to now')}</dd><dt>+ − 0</dt><dd style="text-align:start">${T('تكبير الزيج الكبرى','zoom the Grand Zij')}</dd></dl>`);
    }
    else if(sec==='install'){
      B.innerHTML=card(T('ثبّت الزيج','Install Al-Zij'),`<dl class="kv" style="grid-template-columns:200px 1fr">
<dt>Windows · Chrome / Edge</dt><dd style="text-align:start">${T('أيقونة «تثبيت» في شريط العنوان، أو القائمة ⋮ ← «تثبيت الزيج».','The «Install» icon in the address bar, or menu ⋮ → «Install Al-Zij».')}</dd>
<dt>Mac · Safari</dt><dd style="text-align:start">${T('ملف ← «أضف إلى Dock».','File → «Add to Dock».')}</dd><dt>Mac · Chrome</dt><dd style="text-align:start">${T('القائمة ⋮ ← «حفظ ومشاركة» ← «تثبيت الصفحة كتطبيق».','Menu ⋮ → «Save and share» → «Install page as app».')}</dd>
<dt>iPhone</dt><dd style="text-align:start">${T('زر المشاركة ← «إضافة إلى الشاشة الرئيسية».','Share → «Add to Home Screen».')}</dd><dt>Android</dt><dd style="text-align:start">${T('القائمة ⋮ ← «تثبيت التطبيق».','Menu ⋮ → «Install app».')}</dd></dl><p class="muted">${T('بعد أول فتح يعمل الزيج دون إنترنت.','After the first visit Al-Zij works without internet.')}</p>`);
    }
    else if(sec==='share'){
      B.innerHTML=card(T('شارك الزيج','Share Al-Zij'),`<p>${T('مواقيت صلاة دقيقة، وقبلة، وسماء — مجانًا، دون إعلانات ودون جمع بيانات.','Accurate prayer times, qibla and sky — free, no ads, no data collected.')}</p><div class="row"><button class="btn gold" id="shB">${T('شارك الرابط','Share the link')}</button><button class="btn" id="shC">${T('انسخ الرابط','Copy the link')}</button></div>`);
      const txt=T('الزيج — مواقيت الصلاة والقبلة والسماء','Al-Zij — prayer times, qibla and sky'), url='https://alzijapp.com';
      $('shB').onclick=async()=>{ try{ await navigator.share({title:T('الزيج','Al-Zij'),text:txt,url}); }catch(e){ copyText(txt+' '+url); } }; $('shC').onclick=()=>copyText(url);
    }
    else if(sec==='help'){
      const rep=report();
      B.innerHTML=card(T('عندي مشكلة','I have a problem'),`<p>${T('انسخ هذا التقرير وأرسله مع وصف المشكلة. لا يحوي إلا ما على الشاشة وإعدادات الزيج.','Copy this report and send it with a description. It holds only what is on screen and Al-Zij’s settings.')}</p><pre class="report" id="hRep">${esc(rep)}</pre>
<div class="row"><button class="btn gold" id="hCopy">${T('انسخ التقرير','Copy the report')}</button><a class="btn" href="mailto:alzijapp@gmail.com?subject=${encodeURIComponent(T('مشكلة في الزيج','Al-Zij problem'))}&body=${encodeURIComponent(rep)}">${T('أرسله بالبريد','Send by email')}</a></div>`);
      $('hCopy').onclick=()=>copyText(rep);
    }
    else if(sec==='check'){
      B.innerHTML=card(T('التحقق من الأرقام','Check the numbers'),`<p>${T('يقارن مواقيت اليوم بخدمة Aladhan بنفس طريقة الحساب. هذا القسم وحده يتصل بالإنترنت، وعند الضغط فقط.','Compares today’s times with the Aladhan service using the same method. Only this section uses the internet, and only when you press.')}</p><button class="btn gold" id="vGo">${T('قارن الآن','Compare now')}</button><div id="vOut" style="margin-top:12px"></div>`);
      $('vGo').onclick=async()=>{ const M=ZIJ_METHODS[observer.activeMethod()]||ZIJ_METHODS.MWL, d=new Date(), lp=localParts(d), ds=two(lp.d)+'-'+two(lp.m+1)+'-'+lp.y;
        const url='https://api.aladhan.com/v1/timings/'+ds+'?latitude='+observer.lat.toFixed(4)+'&longitude='+observer.lon.toFixed(4)+'&method='+(M.adj?'99&methodSettings='+M.fajr+',null,'+M.isha:M.aladhan)+'&school='+((LS.get('zijAsr')==='hanafi'||(!LS.get('zijAsr')&&M.asr===2))?1:0);
        $('vOut').textContent=T('جارٍ الاتصال…','Connecting…');
        try{ const j=await (await fetch(url)).json(), t=j.data.timings, mm=s=>{ const [a,b]=s.split(' ')[0].split(':').map(Number); return a*60+b; };
          const map={fajr:'Fajr',sunrise:'Sunrise',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'};
          $('vOut').innerHTML=`<table class="datatable">${KEYS.map(k=>{ const a=Math.round(D.p[k]), b=mm(t[map[k]]), df=a-b; return `<tr><th>${pname(k)}</th><td class="num">${fmt(a)} · Aladhan ${fmt(b)} · <b style="color:${Math.abs(df)<=2?'var(--teal)':'var(--amber)'}">${df===0?T('مطابق','same'):(df>0?'+':'')+dg(df)+T(' د',' min')}</b></td></tr>`; }).join('')}</table><p class="muted" style="font-size:13px">${T('فرق دقيقة أو دقيقتين طبيعي (التقريب، وجداول أم القرى الرسمية).','A minute or two is normal (rounding, and the official Umm al-Qura tables).')}</p>`; }
        catch(e){ $('vOut').textContent=T('تعذّر الاتصال بالخدمة.','The service could not be reached.'); } };
    }
    else if(sec==='data'){
      const ph=Ephemeris.moonPhase(now), mrs=trueSky.moonRiseSet(now), st=observer.sunTimes(now), tw=observer.twilightTimes(now), qb=observer.computeQiblaBearing(observer.lat,observer.lon), mi=trueSky.moonMansionIndex(now), eot=AstroMath.equationOfTimeMinutes(now);
      const occ=(m,d)=>{ const k=hijriCal.daysUntilHijri(m,d); return k==null?'—':EN()?k+' days':hijriCal.formatDaysAsMonthsDays(k).replace(/\d+/g,x=>dg(x)); };
      const rows=[['h',T('الوقت والتاريخ','Time and date')],[T('الوقت','Time'),fmt(D.nm)],[T('اليوم','Day'),L2(WD[D.lp.wd])],[T('الميلادي','Gregorian'),gregText(D.lp)],[T('الهجري','Hijri'),hijriText(D.h)],
        ['h',T('المكان والقبلة','Place and qibla')],[T('الموقع','Location'),placeName()+' · '+coordText(observer.lat,observer.lon)],[T('القبلة','Qibla'),dg(qb.toFixed(1))+'° '+T('من الشمال','from north')],[T('المسافة إلى الكعبة','Distance to the Kaaba'),dg(Math.round(observer.kaabaDistanceKm(observer.lat,observer.lon)))+T(' كم',' km')],
        ['h',T('الصلاة','Prayer')],...KEYS.map(k=>[pname(k,D.friday),fmt(D.p[k])]),[T('الصلاة القادمة','Next prayer'),pname(KEYS[D.next],D.friday)+' · '+cdText((D.nextMin-D.nm)*60)],[T('الطريقة','Method'),EN()?observer.activeMethod():(CALC_NAMES[observer.activeMethod()]||'')],[T('الأيام البيض','White Days'),D.h.day>=13&&D.h.day<=15?T('✅ اليوم منها','✅ today'):T('لا','no')],
        [T('رمضان','Ramadan'),occ(9,1)],[T('عيد الفطر','Eid al-Fitr'),occ(10,1)],[T('الحج','Hajj'),occ(12,8)],[T('عيد الأضحى','Eid al-Adha'),occ(12,10)],
        ['h',T('الشمس والقمر','Sun and Moon')],[T('القمر','Moon'),dg(Math.round(ph.illum*100))+'% · '+phaseName(ph)+' · '+dg(ph.age.toFixed(1))+T(' يوم',' d')],[T('المنزلة','Mansion'),dg(mi+1)+' · '+(EN()?MAN_EN[mi]:MANSION_NAMES[mi])],
        [T('شروق/غروب القمر','Moonrise/set'),(mrs.riseMin!=null?fmt(mrs.riseMin):'—')+' / '+(mrs.setMin!=null?fmt(mrs.setMin):'—')],[T('معادلة الزمن','Equation of time'),(eot>=0?'+':'')+dg(eot.toFixed(1))+T(' دقيقة',' min')],
        [T('البرج','Sign'),L2(ZODIAC[Math.floor(Ephemeris.sun(now).lon/30)%12])],[T('طول النهار','Day length'),durText(st.sunset-st.sunrise)],[T('الشفق','Twilight'),T('مدني ','civil ')+fmt(tw.civilDawn)+'–'+fmt(tw.civilDusk)+' · '+T('فلكي ','astro ')+fmt(tw.astroDawn)+'–'+fmt(tw.astroDusk)],
        [T('التوربيون','Tourbillon'),dg(Math.round((now.getSeconds()*1000+now.getMilliseconds())/60000*360))+'° · '+T('دورة كل ٦٠ ثانية','one turn per 60 s')]];
      B.innerHTML=card(T('كل الأرقام','All the numbers'),`<table class="datatable">${rows.map(r=>r[0]==='h'?`<tr class="h"><th colspan="2">${r[1]}</th></tr>`:`<tr><th>${r[0]}</th><td class="num">${esc(r[1])}</td></tr>`).join('')}</table>`)+
        card(T('الطقس والارتفاع','Weather and elevation'),`<p class="muted">${T('من Open-Meteo عند الضغط فقط (يتصل بالإنترنت).','From Open-Meteo, only when you press (uses the internet).')}</p><button class="btn" id="wGo">${T('اجلب الطقس الآن','Get the weather now')}</button><div id="wOut" style="margin-top:10px"></div>`);
      $('wGo').onclick=async()=>{ $('wOut').textContent=T('جارٍ…','Loading…'); try{ const la=observer.lat,lo=observer.lon;
        const j=await (await fetch('https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,cloud_cover,surface_pressure,weather_code&timezone=auto')).json(), c=j.current;
        const e=await (await fetch('https://api.open-meteo.com/v1/elevation?latitude='+la+'&longitude='+lo)).json();
        $('wOut').innerHTML=`<table class="datatable"><tr><th>${T('الحال','Condition')}</th><td>${esc(observer.weatherCodeToText(c.weather_code))}</td></tr><tr><th>${T('الحرارة','Temperature')}</th><td class="num">${dg(c.temperature_2m.toFixed(1))}° (${T('تُحس ','feels ')}${dg(c.apparent_temperature.toFixed(1))}°)</td></tr><tr><th>${T('الرطوبة','Humidity')}</th><td class="num">${dg(Math.round(c.relative_humidity_2m))}%</td></tr><tr><th>${T('الرياح','Wind')}</th><td class="num">${dg(Math.round(c.wind_speed_10m))} ${T('كم/س','km/h')}</td></tr><tr><th>${T('الغيوم','Cloud')}</th><td class="num">${dg(Math.round(c.cloud_cover))}%</td></tr><tr><th>${T('الضغط','Pressure')}</th><td class="num">${dg(Math.round(c.surface_pressure))} hPa</td></tr><tr><th>${T('الارتفاع','Elevation')}</th><td class="num">${dg(Math.round(e.elevation[0]))} ${T('م','m')}</td></tr></table>`; }
        catch(err){ $('wOut').textContent=T('تعذّر الجلب.','Could not fetch.'); } };
    }
    else if(sec==='about'){
      B.innerHTML=card(T('عن الزيج','About Al-Zij'),`<dl class="kv"><dt>${T('فكرة وتطوير','Idea and development')}</dt><dd>${T('حسن محمد بشير طميش','Hassan M. B. Tmaish')}</dd><dt>${T('انطلاقًا من','From')}</dt><dd>${T('مدينة جدة','Jeddah')}</dd><dt>${T('البريد','Email')}</dt><dd><a href="mailto:alzijapp@gmail.com" dir="ltr">alzijapp@gmail.com</a></dd></dl>
<p class="muted" style="font-size:14px;line-height:1.8">${T('مجاني، دون إعلانات، ودون جمع بيانات. المواقيت في السعودية من جداول تقويم أم القرى الرسمية، وخارجها من حساب الزيج الفلكي. معادلات القمر من Meeus (Astronomical Algorithms). الخطوط: IBM Plex Sans Arabic وInter وMarkazi Text (رخصة OFL، ملفاتها في مجلد fonts).','Free, no ads, no data collected. In Saudi Arabia the times come from the official Umm al-Qura tables; elsewhere from Al-Zij’s own astronomy. Moon equations after Meeus (Astronomical Algorithms). Fonts: IBM Plex Sans Arabic, Inter and Markazi Text (OFL; licences in the fonts folder).')}</p>
<div class="row"><a class="btn" href="privacy/">${T('الخصوصية','Privacy')}</a><a class="btn" href="support/">${T('الدعم','Support')}</a><a class="btn" href="/">${T('الزيج الحالي','Current Al-Zij')}</a></div>
<p class="muted num" style="font-size:12.5px;margin-top:14px">CLAUDE · ${T('تصميم الحاسوب','desktop design')} · ${T('المحرك من beta','engine from beta')} ${esc((document.querySelector('script[src*="engine.js"]')||{}).src||'')}</p>`);
    }
  }
  function report(){
    const D=dayOf(new Date());
    return ['Al-Zij · Claude desktop design', 'page: '+location.href, 'time: '+new Date().toString(), 'lang: '+Z.lang+' · digits: '+(latin()?'123':'١٢٣'),
      'place: '+placeName()+' · '+observer.lat.toFixed(4)+','+observer.lon.toFixed(4)+' · tz '+tzh(new Date())+' · locked '+(LS.get('zijLocationLocked')||'-')+' · auto '+(LS.get('zijLocAuto')||'-'),
      'method: '+observer.calcMethod+' → '+observer.activeMethod()+' · asr '+(LS.get('zijAsr')||'-')+' · highlat '+zijHighLatRule()+' · country '+(zijCountry()||'-'),
      'official table: '+(D.p.official?D.p.official.en:'no'),'times: '+KEYS.map(k=>k+' '+fmt(D.p[k])).join(' · '),'offsets: '+JSON.stringify(alLoadOffsets()),
      'alerts: '+(Alerts.get().on?'on':'off')+' · notifications '+(('Notification' in window)?Notification.permission:'n/a'),'screen: '+innerWidth+'×'+innerHeight+' @'+(devicePixelRatio||1),'ua: '+navigator.userAgent].join('\n');
  }
  Z.on('tick',()=>{ if(document.body.dataset.scr==='more'&&built&&sec==='data'&&!document.activeElement.closest('#mBody')) render(); });
  Z.on('place',()=>{ if(built&&document.body.dataset.scr==='more') render(); });
  return {show(o){ if(!built) build(); if(o&&o.sec) sec=o.sec; render(); }};
})();

const CITY_EN = {'مكة المكرمة':'Makkah','المدينة المنورة':'Madinah','الرياض':'Riyadh','جدة':'Jeddah','القدس الشريف':'Jerusalem','غزة':'Gaza','القاهرة':'Cairo','عمّان':'Amman','دمشق':'Damascus','بغداد':'Baghdad','الكويت':'Kuwait','الدوحة':'Doha','دبي':'Dubai','مسقط':'Muscat','إسطنبول':'Istanbul','كراتشي':'Karachi','دكا':'Dhaka','جاكرتا':'Jakarta','كوالالمبور':'Kuala Lumpur','بانكوك':'Bangkok','بكين':'Beijing','طوكيو':'Tokyo','سيدني':'Sydney','نوميا':'Nouméa','أوكلاند':'Auckland','ميدواي':'Midway','هاواي':'Honolulu','أنكوريج':'Anchorage','لوس أنجلوس':'Los Angeles','دنفر':'Denver','المكسيك':'Mexico City','تورونتو':'Toronto','نيويورك':'New York','لاباز':'La Paz','بوينس آيرس':'Buenos Aires','ج. الجنوبية':'South Georgia','آزوريس':'Azores','لندن':'London','باريس':'Paris','برلين':'Berlin','أوسلو':'Oslo','موسكو':'Moscow','الدار البيضاء':'Casablanca','لاغوس':'Lagos','نيروبي':'Nairobi'};
