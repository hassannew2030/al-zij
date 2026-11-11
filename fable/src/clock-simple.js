/* ===== fable · the simple clock «الساعة البسيطة» — drawn from zero =====
   One instrument, read from the centre outwards:
     the face (minute track, horizon with the Sun at its real height, three hands)
     → the hour numerals (12 or 24, key zijDial24 as in beta)
     → the Moon's ring (nights of the Hijri month, the Moon on tonight with its real phase)
     → the day ring (every period from one prayer to the next, the Sun on «now»)
     → outside: each prayer's name and time on a leader line to a mark on its exact minute.
   Every number comes from the engine: observer.realPrayerTimes, hijriCal.fromGregorian, Ephemeris, observer.sunAltAzNow. */
(function(){
  const C=500, RF=198, RN=[204,244], RM=[252,290], RB=[300,340], P=(r,a)=>FB.P(C,r,a), f=FB.f;
  const D24=()=>FB.ls('zijDial24','1')!=='0';
  const ang=m=>180+m/1440*360;              // the day: noon on top, midnight at the bottom
  const COL=['url(#fbsDawn)','url(#fbsMorn)','url(#fbsNoon)','url(#fbsAsr)','url(#fbsDusk)','url(#fbsNight)'];
  let host=null, S=null, HH=null, HM=null, HS=null, HT=null, lastKey='';

  function mount(el){
    host=el;
    el.innerHTML=`<svg id="fbSimpleSvg" viewBox="0 0 1000 1000" role="img" aria-label="الساعة البسيطة" data-notr data-nodigit font-family="Amiri,'EB Garamond',serif"><defs>
<radialGradient id="fbsFace" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1b2542"/><stop offset=".62" stop-color="#0c1224"/><stop offset="1" stop-color="#060912"/></radialGradient>
<linearGradient id="fbsBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e8b8"/><stop offset=".3" stop-color="#c9a35d"/><stop offset=".55" stop-color="#7c5f30"/><stop offset=".8" stop-color="#e2c27e"/><stop offset="1" stop-color="#6a4f25"/></linearGradient>
<linearGradient id="fbsDawn" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3d3f86"/><stop offset="1" stop-color="#8a6fb0"/></linearGradient>
<linearGradient id="fbsMorn" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f0e2b4"/><stop offset="1" stop-color="#e6d08e"/></linearGradient>
<linearGradient id="fbsNoon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3c06a"/><stop offset="1" stop-color="#d2a548"/></linearGradient>
<linearGradient id="fbsAsr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d79a4e"/><stop offset="1" stop-color="#c4763f"/></linearGradient>
<linearGradient id="fbsDusk" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a55668"/><stop offset="1" stop-color="#5d3a6e"/></linearGradient>
<linearGradient id="fbsNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2757"/><stop offset="1" stop-color="#0d1330"/></linearGradient>
<radialGradient id="fbsSun"><stop offset="0" stop-color="#fff8d6"/><stop offset=".55" stop-color="#ffd25a"/><stop offset="1" stop-color="#e8962e"/></radialGradient>
<radialGradient id="fbsGlow"><stop offset="0" stop-color="#ffd25a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient>
<radialGradient id="fbMoonG" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="#fbf6e6"/><stop offset="1" stop-color="#cfc7ad"/></radialGradient>
<filter id="fbsSh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".55"/></filter>
</defs><g id="fbsStatic"></g>
<g id="fbsHands" filter="url(#fbsSh)">
  <g id="fbsH"><path d="M500 ${C-150}L512 ${C-20}L500 ${C+34}L488 ${C-20}Z" fill="url(#fbsBrass)" stroke="#3d2e14" stroke-width="1.4" stroke-linejoin="round"/><path d="M500 ${C-128}V${C-24}" stroke="#fff6d6" stroke-opacity=".55" stroke-width="2"/><circle id="fbsHTip" cx="500" cy="${C-158}" r="11" fill="url(#fbsSun)" stroke="#6f5229" stroke-width="1.6"/></g>
  <g id="fbsM"><path d="M500 ${C-190}L509 ${C-18}L500 ${C+40}L491 ${C-18}Z" fill="#efe7d2" stroke="#3d2e14" stroke-width="1.3" stroke-linejoin="round"/><path d="M500 ${C-166}V${C-22}" stroke="#b9a16a" stroke-width="1.6"/></g>
  <g id="fbsS"><path d="M500 ${C+50}V${C-192}" stroke="#e0584a" stroke-width="3" stroke-linecap="round"/><circle cx="500" cy="${C+38}" r="9" fill="#e0584a"/></g>
  <circle cx="500" cy="500" r="13" fill="url(#fbsBrass)" stroke="#3d2e14" stroke-width="1.4"/><circle cx="500" cy="500" r="4.5" fill="#0b1020"/>
</g></svg>`;
    S=el.querySelector('#fbsStatic'); HH=el.querySelector('#fbsH'); HM=el.querySelector('#fbsM'); HS=el.querySelector('#fbsS'); HT=el.querySelector('#fbsHTip');
    lastKey='';
  }

  function drawStatic(now, nm, Q){
    const en=FB.en(), d24=D24(), {h,p,pt,py}=Q, KEYS=FB.KEYS, NM=FB.NAMES();
    const ga=d24?(m=>ang(((m%1440)+1440)%1440)):(m=>((m%720)+720)%720/2);
    const RBm=(RB[0]+RB[1])/2, W1=nm+720;
    const EV=[];[[py,-1440],[p,0],[pt,1440]].forEach(([q,o])=>KEYS.forEach((k,i)=>EV.push({i,k,t:q[k]+o})));EV.sort((x,y)=>x.t-y.t);
    const aftM=nm>=p.maghrib;                                  // 24 h: after Maghrib the ring's Fajr and Sunrise are tomorrow's (as in beta)
    const T=KEYS.map((k,i)=>(aftM&&i<2)?pt[k]+1440:p[k]);
    let mN=p.maghrib, fN=pt.fajr+1440; if (nm<p.fajr){ mN=py.maghrib-1440; fN=p.fajr; }
    const midN=(mN+fN)/2, third=mN+(fN-mN)*2/3;
    const night=nm>=p.isha||nm<p.fajr, big=host.clientWidth>0&&host.clientWidth<520, F1=big?43:30, F2=big?31:22;   // a phone-sized dial gets larger words
    let s='';
    // bezel
    s+=`<circle cx="${C}" cy="${C}" r="${RB[1]+13}" fill="url(#fbsBrass)"/><circle cx="${C}" cy="${C}" r="${RB[1]+8}" fill="#05070d"/><circle cx="${C}" cy="${C}" r="${RB[1]+4.5}" fill="none" stroke="#c9a35d" stroke-opacity=".5" stroke-width="1"/>`;
    // the day ring
    const tt=T.map(t=>((t%1440)+1440)%1440);
    if (d24){ for (let i=0;i<6;i++){ let a1=ang(tt[i]), a2=ang(tt[(i+1)%6]); while (a2<=a1) a2+=360; s+=`<path d="${FB.band(C,a1,a2,RB[0],RB[1])}" fill="${COL[i]}"/>`; } }
    else { s+=`<circle cx="${C}" cy="${C}" r="${RBm}" fill="none" stroke="#0b1020" stroke-width="${RB[1]-RB[0]}"/>`;
      for (let j=0;j<EV.length-1;j++){ const s1=Math.max(EV[j].t,nm), s2=Math.min(EV[j+1].t,W1); if (s2<=s1) continue;
        const a1=ga(s1); s+=`<path d="${FB.band(C,a1,a1+(s2-s1)/2,RB[0],RB[1])}" fill="${COL[EV[j].i]}"/>`; } }
    // boundaries between periods + hour ticks on the ring's inner edge
    (d24?tt:EV.filter(e=>e.t>nm&&e.t<=W1).map(e=>e.t)).forEach(t=>{ const a=ga(t), [x1,y1]=P(RB[0],a), [x2,y2]=P(RB[1],a); s+=`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#05070d" stroke-width="2.2"/>`; });
    for (let k=0;k<(d24?24:12);k++){ const a=d24?ang(k*60):k*30, [x1,y1]=P(RB[0]+1,a), [x2,y2]=P(RB[0]+(k%3?6:11),a); s+=`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#05070d" stroke-opacity=".6" stroke-width="${k%3?1.4:2.4}"/>`; }
    s+=`<circle cx="${C}" cy="${C}" r="${RB[1]}" fill="none" stroke="#c9a35d" stroke-width="1.8"/><circle cx="${C}" cy="${C}" r="${RB[0]}" fill="none" stroke="#c9a35d" stroke-width="1.8"/>`;
    if (!d24){ const [x1,y1]=P(RB[0]-2,ga(nm)), [x2,y2]=P(RB[1]+2,ga(nm)); s+=`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#05070d" stroke-width="4"/>`; }
    // 24 h: how far into the current period we are — a fine gold arc from the last mark to «now»
    if (d24){ let pv=0, bd=1e9; tt.forEach((t,i)=>{ let d=nm-t; while (d<0) d+=1440; if (d<bd){ bd=d; pv=i; } });
      let a1=ang(tt[pv]), a2=ga(nm); while (a2<a1) a2+=360;
      if (a2-a1>.5) s+=`<path d="${FB.arc(C,RB[0]-6,a1,a2)}" fill="none" stroke="#f3d98a" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>`; }

    // labels: name over time, outside the ring; pushed apart along the ring until none touch
    const K={ink:night?'#f0d9a8':'#fbf4e2', gold:'#f8e7b0', past:'#b4ab94', bg:'#05070d'};
    const MIDN=en?'Midnight':'منتصف الليل', THIRD=en?'Last third':'الثلث الأخير', TM=en?'tmrw ':'غدًا ';
    const Lb=[];
    if (d24){
      let nx=-1, best=1e9; T.forEach((t,i)=>{ let d=t-nm; if (d<=0) d+=1440; if (d<best){ best=d; nx=i; } });
      T.forEach((t,i)=>Lb.push({a:ga(t), t, key:KEYS[i], name:NM[i], time:((aftM&&i<2)?TM:'')+FB.hm(t,true), fs:F1, next:i===nx, past:t<nm&&i!==nx, kind:'p'}));
      Lb.push({a:ga(midN), t:midN, key:'mid', name:MIDN, time:FB.hm(midN,true), fs:F2, kind:'n', past:midN<nm});
      Lb.push({a:ga(third), t:third, key:'third', name:THIRD, time:FB.hm(third,true), fs:F2, kind:'n', past:third<nm});
    } else {
      EV.filter(e=>e.t>nm&&e.t<=W1).forEach((e,j)=>Lb.push({a:ga(e.t), t:e.t, key:e.k, name:NM[e.i], time:(e.t>=1440?TM:'')+FB.hm(e.t,true), fs:F1, next:j===0, past:false, kind:'p'}));
      [[py.maghrib-1440,p.fajr],[p.maghrib,pt.fajr+1440]].forEach(([m0,f0])=>[[(m0+f0)/2,'mid',MIDN],[m0+(f0-m0)*2/3,'third',THIRD]].forEach(([t,key,name])=>{
        if (t>nm&&t<=W1) Lb.push({a:ga(t), t, key, name, time:FB.hm(t,true), fs:F2, kind:'n', past:false}); }));
    }
    const R0=RB[1]+26, PAD=5;
    const size=l=>{ l.w=Math.max(FB.tw(l.name,l.fs,700),FB.tw(l.time,l.fs,700))+10; l.h=l.fs*2.26; };
    const place=l=>{ const t=l.b*Math.PI/180, d=Math.abs(Math.sin(t))*l.w/2+Math.abs(Math.cos(t))*l.h/2; [l.x,l.y]=P(R0+d,l.b);
      l.x=Math.max(l.w/2+4,Math.min(1000-l.w/2-4,l.x)); l.y=Math.max(l.h/2+4,Math.min(1000-l.h/2-4,l.y)); };
    const hit=(u,v)=>Math.abs(u.x-v.x)<(u.w+v.w)/2+PAD&&Math.abs(u.y-v.y)<(u.h+v.h)/2+PAD;
    Lb.forEach(l=>{ size(l); l.b=l.a; place(l); });
    for (let it=0;it<500;it++){ let moved=false;
      for (let i=0;i<Lb.length;i++) for (let j=i+1;j<Lb.length;j++){ const u=Lb[i], v=Lb[j]; if (!hit(u,v)) continue;
        let d=FB.norm(v.a-u.a); if (d>180) d-=360; const s1=d>=0?1:-1;
        if (u.kind==='n'&&v.kind==='p') u.b-=s1*1; else if (v.kind==='n'&&u.kind==='p') v.b+=s1*1; else { u.b-=s1*.5; v.b+=s1*.5; }
        place(u); place(v); moved=true; }
      if (!moved) break; }
    Lb.filter(l=>l.past).sort((u,v)=>u.t-v.t).forEach(l=>{ if (Lb.some(v=>v!==l&&!v.hide&&hit(l,v))) l.hide=true; });
    let lab='';
    Lb.forEach(l=>{ const [dx,dy]=P(RBm,l.a), [ex,ey]=P(RB[1]+15,l.a), [fx,fy]=P(RB[1]+22,l.a);
      const tx=Math.min(Math.max(fx,l.x-l.w/2),l.x+l.w/2), ty=Math.min(Math.max(fy,l.y-l.h/2),l.y+l.h/2);
      const col=l.next?K.gold:(l.past?K.past:K.ink), halo=` stroke="${K.bg}" stroke-width="8" paint-order="stroke" stroke-linejoin="round"`;
      if (!l.hide) lab+=`<polyline points="${f(ex)},${f(ey)} ${f(fx)},${f(fy)} ${f(tx)},${f(ty)}" fill="none" stroke="${col}" stroke-opacity=".5" stroke-width="1.8"/>`;
      // the mark sits on the exact minute (data-m = minutes after local midnight, as in beta)
      lab+=`<g class="fbs-mark" data-k="${l.key}" data-m="${(+l.t).toFixed(2)}" transform="translate(${f(dx)} ${f(dy)})">`+
        (l.kind==='p'?`<circle r="${l.next?17:14}" fill="#070a14" stroke="${l.next?K.gold:'#c9a35d'}" stroke-width="${l.next?2.6:1.4}"/>${FB.glyph(l.key,l.next?10.5:8.5,col)}`
                     :`<path d="M0 -8L6 0L0 8L-6 0Z" transform="rotate(${f(l.a)})" fill="${col}" stroke="${K.bg}" stroke-width="1.6"/>`)+`</g>`;
      if (l.hide) return;
      const y1=l.y-l.h/2+l.fs*.92;
      lab+=`<text x="${f(l.x)}" y="${f(y1)}" font-size="${l.fs}" font-weight="700" text-anchor="middle" fill="${col}"${halo}>${l.name}</text>`+
           `<text x="${f(l.x)}" y="${f(y1+l.fs*1.12)}" font-size="${l.fs}" font-weight="${l.next?700:400}" text-anchor="middle" fill="${col}"${halo}>${l.time}</text>`+
           (l.next?`<path d="M${f(l.x-l.w/2+6)} ${f(l.y+l.h/2+1)}H${f(l.x+l.w/2-6)}" stroke="${K.gold}" stroke-width="2.4" stroke-linecap="round"/>`:''); });
    s+=lab;
    // the Sun on the day ring, on «now»
    { const up=nm>=p.sunrise&&nm<p.maghrib, [x,y]=P(RBm,ga(nm));
      const ray=Array.from({length:12},(_,k)=>{ const [x1,y1]=FB.P(0,10.5,k*30), [x2,y2]=FB.P(0,k%2?13.5:15.5,k*30); return `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}"/>`; }).join('');
      s+=`<g id="fbsSunNow" transform="translate(${f(x)} ${f(y)})">`+(up?`<circle r="30" fill="url(#fbsGlow)"/>`:'')+`<circle r="18.5" fill="#0b1020" stroke="#f3e3ae" stroke-width="1.8"/>`+
         `<g stroke="${up?'#ffd25a':'#b8975a'}" stroke-width="1.8" stroke-linecap="round">${ray}</g><circle r="8.4" fill="${up?'url(#fbsSun)':'#9c8150'}"/></g>`; }
    // the Moon's ring
    s+=`<circle cx="${C}" cy="${C}" r="${(RM[0]+RM[1])/2}" fill="none" stroke="#0a1022" stroke-width="${RM[1]-RM[0]+8}"/><circle cx="${C}" cy="${C}" r="${RM[1]}" fill="none" stroke="#c9a35d" stroke-opacity=".8" stroke-width="1.4"/><circle cx="${C}" cy="${C}" r="${RM[0]}" fill="none" stroke="#c9a35d" stroke-opacity=".8" stroke-width="1.4"/>`;
    for (let k=0;k<30;k++){ const [x1,y1]=P(RM[1]-3,k*12), [x2,y2]=P(RM[1]-(k%5?8:13),k*12); s+=`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#c9a35d" stroke-opacity=".6" stroke-width="1.3"/>`;
      if ((k+1)%5===0&&k+1!==h.day) s+=FB.word(C,(RM[0]+RM[1])/2-3,k*12,FB.dg(k+1),17,'#9a8d68'); }
    { let ph=null; try{ ph=Ephemeris.moonPhase(now); }catch(e){}
      const [mx,my]=P((RM[0]+RM[1])/2,(h.day-1)*12);
      if (ph) s+=`<g id="fbsMoon" class="fb-hit" tabindex="0" role="button" aria-label="${en?'The Hijri month':'الشهر الهجري'}" transform="translate(${f(mx)} ${f(my)})"><circle r="24" fill="#070a14"/>${FB.moon(17,ph)}</g>`; }
    // numerals
    s+=`<circle cx="${C}" cy="${C}" r="${(RN[0]+RN[1])/2}" fill="none" stroke="#141a2c" stroke-width="${RN[1]-RN[0]+6}"/>`;
    if (!d24) for (let k=1;k<=12;k++){ const [x,y]=P((RN[0]+RN[1])/2,k*30); s+=`<text x="${f(x)}" y="${f(y)}" dy=".36em" font-weight="700" font-size="${k%3?27:32}" fill="${k%3?'#d8c79a':'#f5e6b4'}" text-anchor="middle">${FB.dg(k)}</text>`; }
    else for (let k=0;k<24;k+=2){ const [x,y]=P((RN[0]+RN[1])/2,ang(k*60)), big=k%6===0; s+=`<text x="${f(x)}" y="${f(y)}" dy=".36em" font-weight="700" font-size="${big?31:25}" fill="${big?'#f5e6b4':'#cdbb8c'}" text-anchor="middle">${FB.dg(k||24)}</text>`; }
    // the face
    s+=`<circle cx="${C}" cy="${C}" r="${RF+3}" fill="url(#fbsFace)" stroke="#c9a35d" stroke-width="1.8"/>`;
    for (let r=40;r<=160;r+=24) s+=`<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="#c9a35d" stroke-opacity=".07" stroke-width="1"/>`;
    for (let k=0;k<24;k++){ const [x1,y1]=P(34,k*15), [x2,y2]=P(166,k*15); s+=`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#c9a35d" stroke-opacity=".045" stroke-width="1"/>`; }
    s+=`<text x="${C}" y="${C-92}" font-size="27" font-weight="700" fill="#c9a35d" fill-opacity=".8" text-anchor="middle">${en?'Al-Zij':'الزّيج'}</text>`;
    for (let k=0;k<60;k++){ const [x1,y1]=P(RF-3,k*6), [x2,y2]=P(RF-(k%5?11:21),k*6); s+=`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${k%5?'#8f7a4c':'#eddba0'}" stroke-width="${k%5?1.4:3.2}" stroke-linecap="round"/>`; }
    // inside the face: the horizon, and the Sun where you would see it now (east on the left, height = real altitude)
    try{ const sa=observer.sunAltAzNow(now), HY=C+26, Ks=128/90, up=sa.alt>-0.833;
      const sx=C+142*Math.sin((sa.az-180)*Math.PI/180), sy=Math.min(C+150,HY-sa.alt*Ks), w=Math.sqrt(170*170-26*26);
      s+=`<path d="M${f(C-w)} ${HY}A170 170 0 0 1 ${f(C+w)} ${HY}Z" fill="#4a72b8" opacity="${up?.16:.045}"/><path d="M${f(C-w)} ${HY}H${f(C+w)}" stroke="#c9a35d" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="5 6"/>`+
         `<text x="${f(C-w+12)}" y="${HY-8}" font-size="15" fill="#9a8d68">${en?'E':'شرق'}</text><text x="${f(C+w-12)}" y="${HY-8}" font-size="15" fill="#9a8d68" text-anchor="end">${en?'W':'غرب'}</text>`;
      const ray=Array.from({length:8},(_,k)=>{ const [x1,y1]=FB.P(0,9.5,k*45), [x2,y2]=FB.P(0,13.5,k*45); return `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}"/>`; }).join('');
      s+=`<g id="fbsSkySun" transform="translate(${f(sx)} ${f(sy)})" opacity="${up?1:.5}">`+(up?`<circle r="22" fill="url(#fbsGlow)"/>`:'')+`<g stroke="${up?'#ffd25a':'#9c8150'}" stroke-width="1.8" stroke-linecap="round">${ray}</g><circle r="7.4" fill="${up?'url(#fbsSun)':'#7d6840'}"/></g>`;
    }catch(e){}
    S.innerHTML=s;
    const mg=S.querySelector('#fbsMoon');
    if (mg){ const open=e=>{ e.stopPropagation(); try{ window.zijMonthSheet&&zijMonthSheet(); }catch(_){} };
      mg.addEventListener('click',open); mg.addEventListener('keydown',e=>{ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); open(e); } }); }
    // what a screen reader hears
    { let nx=0, best=1e9; KEYS.forEach((k,i)=>{ if (k==='sunrise') return; let d=T[i]-nm; if (d<=0) d+=1440; if (d<best){ best=d; nx=i; } });
      const lp=FB.localParts(now), t=FB.dg((lp.H%12||12)+':'+String(lp.M).padStart(2,'0'))+' '+(en?(lp.H<12?'AM':'PM'):(lp.H<12?'ص':'م'));
      host.firstElementChild.setAttribute('aria-label',(en?'Clock: ':'الساعة الآن ')+t+(en?' · next: ':' · الصلاة القادمة: ')+NM[nx]+' '+FB.hm(T[nx])); }
  }

  function draw(now){
    if (!host) return;
    const nm=FB.localMin(now), Q=FB.prayers(now), d24=D24();
    const key=[Math.floor(now.getTime()/6e4),host.clientWidth<520,d24,FB.en(),FB.latin(),observer.lat,observer.lon,Q.h.day,Q.h.month,FB.KEYS.map(k=>Q.p[k].toFixed(3)).join()].join('|');
    if (key!==lastKey){ lastKey=key; drawStatic(now,nm,Q); }
    const hA=d24?ang(nm):(nm/60%12)*30, mA=(nm%60)*6, sA=Math.floor((nm*60)%60)*6;
    HH.setAttribute('transform',`rotate(${f(hA)} ${C} ${C})`); HM.setAttribute('transform',`rotate(${f(mA)} ${C} ${C})`); HS.setAttribute('transform',`rotate(${sA} ${C} ${C})`);
    HT.style.display=d24?'':'none';      // 24 h: the hour hand is the Sun's hand (it points at «now» on the day ring)
    host.dataset.h=f(hA); host.dataset.m=f(mA); host.dataset.s=sA; host.dataset.nm=nm.toFixed(3);
  }
  FB.simple={mount, draw, dirty(){ lastKey=''; }, is24:D24};
})();
