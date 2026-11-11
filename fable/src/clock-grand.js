/* ===== fable · the Grand Zij «الزيج الكبرى — الساعة الفلكية الكاملة» — drawn from zero =====
   Rings, from the rim to the centre:
     1 world time: 24 cities (one per hour from Makkah) over a turning 24-hour ring
     2 the Hijri months, 3 the Gregorian months — each with its own pointer (light blue / yellow, as the guide says)
     4 the zodiac with the equinoxes and solstices; the Sun, the Moon and the five planets ride inside it on their ecliptic longitude
     5 the 28 lunar mansions (turned by the ayanamsa), read under the Moon
     6 the day belt: day and night arcs, the Sun on «now», the five prayers on their minutes, moonrise and moonset
     7 the horizon: N-E-S-W, the seven named stars, and the azimuth of the Sun and the Moon
     8 the hours, the three hands, the Qibla (red), north (turquoise) and the shadow (violet); the Earth in the centre
   Four corner dials: equation of time · lunar reserve · day of the week (retrograde) · tourbillon.
   Everything is read from the engine every time it is drawn: Ephemeris, Observer, HijriCalendar, TrueSkyEngine, StarField, AstroMath. */
(function(){
  const C=600, P=(r,a)=>FB.P(C,r,a), f=FB.f, k=Math.PI/180;
  const R={city:[566,594], hrs:[538,564], hij:[496,536], greg:[458,494], zod:[418,456], man:[378,416], sky:[304,374], belt:[256,298], hor:[214,252], chap:[176,210]};
  const mid=a=>(a[0]+a[1])/2;
  const CITIES_AR=['مكة','دبي','كراتشي','دكا','بانكوك','بكين','طوكيو','سيدني','نوميا','أوكلاند','ميدواي','هاواي','أنكوريج','لوس أنجلوس','دنفر','المكسيك','نيويورك','لاباز','بوينس آيرس','ج. الجنوبية','آزوريس','لندن','باريس','القاهرة'];
  const CITIES_EN=['Makkah','Dubai','Karachi','Dhaka','Bangkok','Beijing','Tokyo','Sydney','Nouméa','Auckland','Midway','Hawaii','Anchorage','Los Angeles','Denver','Mexico','New York','La Paz','B. Aires','S. Georgia','Azores','London','Paris','Cairo'];
  const HIJ_AR=['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
  const HIJ_EN=['Muharram','Safar','Rabi I','Rabi II','Jumada I','Jumada II','Rajab','Shaban','Ramadan','Shawwal','Dhul-Qidah','Dhul-Hijjah'];
  const GRE_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const GRE_EN=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const ZOD_AR=['الحمل','الثور','الجوزاء','السرطان','الأسد','العذراء','الميزان','العقرب','القوس','الجدي','الدلو','الحوت'];
  const ZOD_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagitt.','Capric.','Aquarius','Pisces'];
  const ZOD_G=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
  const MAN_AR=['الشرطين','البطين','الثريا','الدبران','الهقعة','الهنعة','الذراع','النثرة','الطرف','الجبهة','الزبرة','الصرفة','العواء','السماك','الغفر','الزبانا','الإكليل','القلب','الشولة','النعائم','البلدة','سعد الذابح','سعد بلع','سعد السعود','سعد الأخبية','الفرغ المقدم','الفرغ المؤخر','الرشاء'];
  const WD_AR=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'], WD_EN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], WD_A1=['ح','ن','ث','ر','خ','ج','س'], WD_E1=['S','M','T','W','T','F','S'];
  const PLAN=[['Mercury','عطارد','☿','#b9c4cf',314],['Venus','الزهرة','♀','#f1e2b0',324],['Mars','المريخ','♂','#e0796d',334],['Jupiter','المشتري','♃','#e2c08a',344],['Saturn','زحل','♄','#c9b27a',354]];
  const STAR_EN=['Sirius','Aldebaran','Rigel','Betelgeuse','Arcturus','Vega','Polaris'];
  let host=null, ST=null, DY=null, hH=null, hM=null, hS=null, cage=null, statKey='', dynKey='';
  const tr=s=>(FB.en()&&window.zijTr)?zijTr(s):s;

  function mount(el){
    host=el;
    el.innerHTML=`<svg id="fbGrandSvg" viewBox="0 0 1200 1200" role="img" aria-label="الزيج الكبرى" data-notr data-nodigit font-family="Amiri,'EB Garamond',serif"><defs>
<radialGradient id="fbgBg" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#141c34"/><stop offset=".7" stop-color="#0a0f20"/><stop offset="1" stop-color="#05070e"/></radialGradient>
<linearGradient id="fbgBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e8b8"/><stop offset=".3" stop-color="#c9a35d"/><stop offset=".55" stop-color="#7c5f30"/><stop offset=".8" stop-color="#e2c27e"/><stop offset="1" stop-color="#6a4f25"/></linearGradient>
<radialGradient id="fbgEarth" cx="36%" cy="32%" r="80%"><stop offset="0" stop-color="#6fb0d8"/><stop offset=".55" stop-color="#24598c"/><stop offset="1" stop-color="#0a1c3a"/></radialGradient>
<radialGradient id="fbgSun"><stop offset="0" stop-color="#fff8d6"/><stop offset=".55" stop-color="#ffd25a"/><stop offset="1" stop-color="#e8962e"/></radialGradient>
<radialGradient id="fbgGlow"><stop offset="0" stop-color="#ffd25a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient>
<radialGradient id="fbgMoon" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="#fbf6e6"/><stop offset="1" stop-color="#cfc7ad"/></radialGradient>
<linearGradient id="fbgDay" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9d79a"/><stop offset=".5" stop-color="#f3d77c"/><stop offset="1" stop-color="#d9a05a"/></linearGradient>
<linearGradient id="fbgSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2f5f9"/><stop offset=".5" stop-color="#8f9bab"/><stop offset="1" stop-color="#4b5766"/></linearGradient>
<filter id="fbgSh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".6"/></filter>
<clipPath id="fbgEarthClip"><circle cx="${C}" cy="${C}" r="66"/></clipPath>
</defs>
<g id="fbgStatic"></g><g id="fbgDyn"></g>
<g id="fbgHands" filter="url(#fbgSh)">
  <g id="fbgH"><path d="M600 ${C-128}L611 ${C-78}L606 ${C+26}H594L589 ${C-78}Z" fill="#e9eef3" stroke="#44525f" stroke-width="1.3" stroke-linejoin="round"/><path d="M600 ${C-112}V${C-10}" stroke="#1a3a4a" stroke-width="2"/></g>
  <g id="fbgM"><path d="M600 ${C-176}L608 ${C-96}L605 ${C+32}H595L592 ${C-96}Z" fill="#f4ecd6" stroke="#3d2e14" stroke-width="1.2" stroke-linejoin="round"/><path d="M600 ${C-158}V${C-10}" stroke="#a88d55" stroke-width="1.6"/></g>
  <g id="fbgS"><path d="M600 ${C+46}V${C-206}" stroke="#f0c85d" stroke-width="2.2" stroke-linecap="round"/><circle cx="600" cy="${C+36}" r="7" fill="#f0c85d"/></g>
  <circle cx="600" cy="600" r="11" fill="url(#fbgBrass)" stroke="#3d2e14" stroke-width="1.3"/><circle cx="600" cy="600" r="3.8" fill="#0b1020"/>
</g></svg>`;
    ST=el.querySelector('#fbgStatic'); DY=el.querySelector('#fbgDyn'); hH=el.querySelector('#fbgH'); hM=el.querySelector('#fbgM'); hS=el.querySelector('#fbgS');
    statKey=dynKey='';
  }

  const ring=(r,w,col,op)=>`<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${col||'#c9a35d'}" stroke-width="${w||1.2}"${op?` stroke-opacity="${op}"`:''}/>`;
  const fill=(a,col)=>`<circle cx="${C}" cy="${C}" r="${mid(a)}" fill="none" stroke="${col}" stroke-width="${a[1]-a[0]}"/>`;
  const tick=(r1,r2,a,col,w)=>{ const [x1,y1]=P(r1,a),[x2,y2]=P(r2,a); return `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${col}" stroke-width="${w}"/>`; };

  function corner(cx,cy,title){
    return `<g transform="translate(${cx} ${cy})"><circle r="84" fill="url(#fbgBrass)"/><circle r="80" fill="#080c18"/><circle r="74" fill="none" stroke="#c9a35d" stroke-opacity=".45" stroke-width="1"/>`+
      `<text y="60" font-size="14.5" fill="#cdbb8c" text-anchor="middle">${title}</text>`;
  }
  function gaugeArc(a1,a2,n){ let s=`<path d="${FB.arc(0,52,a1,a2)}" fill="none" stroke="#c9a35d" stroke-width="1.6"/>`;
    for (let i=0;i<=n;i++){ const a=a1+(a2-a1)*i/n, [x1,y1]=FB.P(0,52,a), [x2,y2]=FB.P(0,i%(n/2)?58:62,a); s+=`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#eddba0" stroke-width="1.4"/>`; } return s; }

  function drawStatic(){
    const en=FB.en(); let s='';
    s+=`<rect width="1200" height="1200" fill="none"/><circle cx="${C}" cy="${C}" r="${R.city[1]+6}" fill="url(#fbgBrass)"/><circle cx="${C}" cy="${C}" r="${R.city[1]+1}" fill="url(#fbgBg)"/>`;
    // 1 · world time
    s+=fill(R.city,'#0b1122')+ring(R.city[0]);
    (en?CITIES_EN:CITIES_AR).forEach((n,i)=>{ s+=tick(R.city[0],R.city[1],i*15+7.5,'#c9a35d',.6)+FB.word(C,mid(R.city),i*15,n,i?17:19,i?'#d6ccb0':'#f5e6b4',i?'':'font-weight="700"'); });
    let hr=`<g id="fbgHours">`+fill(R.hrs,'#141d38'); for (let n=0;n<24;n++){ hr+=FB.word(C,mid(R.hrs),n*15,FB.dg(n),17.5,(n>=6&&n<18)?'#f3e3ae':'#8fa0c8','font-weight="700"')+tick(R.hrs[0],R.hrs[0]+5,n*15+7.5,'#c9a35d',.8); }
    s+=hr+`</g>`+ring(R.hrs[0],1.6);
    // 2 · 3 · the two calendars
    s+=fill(R.hij,'#0d1528'); (en?HIJ_EN:HIJ_AR).forEach((n,i)=>{ s+=tick(R.hij[0],R.hij[1],i*30,'#c9a35d',1)+FB.word(C,mid(R.hij),i*30+15,n,25,i===8?'#f8e7b0':'#e6dcbd','font-weight="700"'); });
    for (let d=0;d<360;d+=1) if (d%30) s+=tick(R.hij[0],R.hij[0]+(d%5?3:6),d,'#8fc5e8',.7);
    s+=ring(R.hij[0],1.4)+fill(R.greg,'#101a30'); (en?GRE_EN:GRE_AR).forEach((n,i)=>{ s+=tick(R.greg[0],R.greg[1],i*30,'#c9a35d',1)+FB.word(C,mid(R.greg),i*30+15,n,en?19:21.5,'#d8c896'); });
    s+=ring(R.greg[0],1.4);
    // 4 · the zodiac, with the four turning points of the year
    s+=fill(R.zod,'#0a1020');
    (en?ZOD_EN:ZOD_AR).forEach((n,i)=>{ s+=tick(R.zod[0],R.zod[1],i*30,'#c9a35d',1)+FB.word(C,R.zod[1]-11,i*30+15,ZOD_G[i],18,'#c9a35d')+FB.word(C,R.zod[0]+11,i*30+15,n,17,'#cfc4a4'); });
    [[0,en?'Spring equinox':'الاعتدال الربيعي'],[90,en?'Summer solstice':'الانقلاب الصيفي'],[180,en?'Autumn equinox':'الاعتدال الخريفي'],[270,en?'Winter solstice':'الانقلاب الشتوي']].forEach(([a,t])=>{
      const [x,y]=P(R.zod[1],a); s+=`<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><path d="M0 -7L6 0L0 7L-6 0Z" fill="#f5e6b4" stroke="#05070d" stroke-width="1"/><title>${t}</title></g>`; });
    s+=ring(R.zod[0],1.4);
    // 5 · the mansions (the ring itself is turned by the ayanamsa when drawn)
    let mn=`<g id="fbgMans">`+fill(R.man,'#0e1830'); const stp=360/28;
    MAN_AR.forEach((n,i)=>{ mn+=tick(R.man[0],R.man[1],i*stp,'#7c5f30',.9)+FB.word(C,mid(R.man),i*stp+stp/2,tr(n),en?12.5:15,'#b9c9e6'); });
    s+=mn+`</g>`+ring(R.man[0],1.2,'#c9a35d',.8);
    // the sky band: five planet orbits and the Moon's track
    PLAN.forEach(p=>{ s+=ring(p[4],.7,p[3],.28); }); s+=ring(366,.9,'#e9e2cf',.4).replace('/>',' stroke-dasharray="2 5"/>');
    // 6 · the day belt (arcs are drawn with the day)
    s+=ring(R.belt[1],1.4)+ring(R.belt[0],1.4);
    // 7 · the horizon
    s+=fill(R.hor,'#0a0f1e'); for (let d=0;d<360;d+=5) s+=tick(R.hor[1]-(d%30?5:10),R.hor[1],d,'#7fb3a8',d%30?.7:1.3);
    [[0,en?'N':'ش'],[90,en?'E':'ق'],[180,en?'S':'ج'],[270,en?'W':'غ']].forEach(([a,t])=>{ const [x,y]=P(mid(R.hor)-2,a); s+=`<text x="${f(x)}" y="${f(y)}" dy=".36em" font-size="19" font-weight="700" fill="#7fb3a8" text-anchor="middle">${t}</text>`; });
    s+=ring(R.hor[0],1.2,'#c9a35d',.7);
    // 8 · the hours
    s+=`<circle cx="${C}" cy="${C}" r="${R.chap[1]}" fill="#070b16"/>`;
    for (let i=0;i<60;i++) s+=tick(R.chap[1]-(i%5?6:12),R.chap[1]-1,i*6,i%5?'#8f7a4c':'#eddba0',i%5?1:2.4);
    for (let i=1;i<=12;i++){ const [x,y]=P(R.chap[0]+5,i*30); s+=`<text x="${f(x)}" y="${f(y)}" dy=".36em" font-size="${i%3?19:23}" font-weight="700" fill="${i%3?'#cdbb8c':'#f5e6b4'}" text-anchor="middle">${FB.dg(i)}</text>`; }
    // corner dials
    s+=corner(90,90,en?'Equation of time':'معادلة الزمن')+gaugeArc(-45,45,8)+`<text x="-48" y="-30" font-size="17" fill="#eddba0" text-anchor="middle">−</text><text x="48" y="-30" font-size="17" fill="#eddba0" text-anchor="middle">+</text><text id="fbgEotTxt" y="32" font-size="15" fill="#f5e6b4" text-anchor="middle" direction="ltr"></text><g id="fbgEot"><path d="M0 12L-3.5 0L0 -56L3.5 0Z" fill="#f0c85d" stroke="#3d2e14" stroke-width=".8"/></g><circle r="5" fill="url(#fbgBrass)"/></g>`;
    s+=corner(1110,90,en?'Lunar reserve':'احتياطي قمري')+gaugeArc(-45,45,8)+`<text x="-44" y="-24" font-size="12.5" fill="#cdbb8c" text-anchor="middle">${en?'empty':'فارغ'}</text><text x="44" y="-24" font-size="12.5" fill="#cdbb8c" text-anchor="middle">${en?'full':'ممتلئ'}</text><text id="fbgResTxt" y="32" font-size="15" fill="#f5e6b4" text-anchor="middle"></text><g id="fbgRes"><path d="M0 12L-3.5 0L0 -56L3.5 0Z" fill="#e9e2cf" stroke="#3d2e14" stroke-width=".8"/></g><circle r="5" fill="url(#fbgBrass)"/></g>`;
    { let d=corner(90,1110,en?'Day of the week':'يوم الأسبوع')+`<path d="${FB.arc(0,62,-86,86)}" fill="none" stroke="#c9a35d" stroke-width="1.2"/>`;
      (en?WD_E1:WD_A1).forEach((n,i)=>{ const a=AstroMath.dayArcAngle(i), [x,y]=FB.P(0,49,a); d+=`<text class="fbg-wd" data-i="${i}" x="${f(x)}" y="${f(y)}" dy=".36em" font-size="15" fill="#cdbb8c" text-anchor="middle" transform="rotate(${f(a)} ${f(x)} ${f(y)})">${n}</text>`; });
      s+=d+`<text id="fbgWdTxt" y="30" font-size="15" font-weight="700" fill="#f5e6b4" text-anchor="middle"></text><g id="fbgWd"><path d="M0 10L-3 0L0 -38L3 0Z" fill="#7fb3a8" stroke="#0d2a25" stroke-width=".8"/></g><circle r="5" fill="url(#fbgBrass)"/></g>`; }
    s+=corner(1110,1110,en?'Tourbillon':'توربيون')+`<g id="tourbillonCage" class="fb-hit" tabindex="0" role="button" aria-label="${en?'Tourbillon magnifier':'مكبّر التوربيون'}"><circle r="54" fill="#0b1020"/><g id="fbgCage"><circle r="46" fill="none" stroke="url(#fbgSteel)" stroke-width="4"/><path d="M-46 0H46M0 -46V46" stroke="url(#fbgSteel)" stroke-width="3.2"/><circle r="30" fill="none" stroke="#3a7cb0" stroke-width="3"/><circle cx="0" cy="-46" r="4.5" fill="#e0493a"/><circle cx="46" cy="0" r="3.4" fill="#e0493a"/><circle cx="-46" cy="0" r="3.4" fill="#e0493a"/><circle cx="0" cy="46" r="3.4" fill="#e0493a"/></g><circle r="7" fill="url(#fbgBrass)"/></g></g>`;
    ST.innerHTML=s; cage=ST.querySelector('#fbgCage');
    const tc=ST.querySelector('#tourbillonCage'), open=e=>{ e.stopPropagation(); if (typeof openTourbillonBox==='function') openTourbillonBox(); };
    tc.addEventListener('click',open); tc.addEventListener('keydown',e=>{ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); open(e); } });
  }

  // ecliptic longitude of a body from the engine's right ascension (hours) and declination (degrees)
  const eclLon=(raH,dec,d)=>{ const e=Ephemeris.obliquity(d)*k, a=raH*15*k; return FB.norm(Math.atan2(Math.sin(a)*Math.cos(e)+Math.tan(dec*k)*Math.sin(e),Math.cos(a))/k); };

  function drawDyn(now, nm, Q){
    const en=FB.en(), {h,p}=Q, lp=FB.localParts(now), ts=renderer.trueSky; let s='';
    const below=renderer.trueSkyMode?ts.belowHorizonMap(now):{}, dim=key=>below[key]?' opacity=".16"':'';
    // 2 · 3 · pointers (the same angles as beta: month + share of the month)
    const hA=(h.month-1)*30+(h.day/30)*30, gA=lp.m*30+(lp.d/31)*30;
    { const [x,y]=P(R.hij[0],hA); s+=`<g id="fbgHijPtr" data-a="${f(hA)}" transform="translate(${f(x)} ${f(y)}) rotate(${f(hA)})"><path d="M0 -40V2" stroke="#8fc5e8" stroke-width="2.4"/><path d="M0 -6L8 9H-8Z" fill="#8fc5e8" stroke="#05070d" stroke-width="1"/><title>${en?'Hijri date':'التاريخ الهجري'}</title></g>`; }
    { const [x,y]=P(R.greg[0],gA); s+=`<g id="fbgGregPtr" data-a="${f(gA)}" transform="translate(${f(x)} ${f(y)}) rotate(${f(gA)})"><path d="M0 -36V2" stroke="#ffe066" stroke-width="2.4"/><circle cy="6" r="6.5" fill="#ffe066" stroke="#05070d" stroke-width="1"/><title>${en?'Gregorian date':'التاريخ الميلادي'}</title></g>`; }
    // 4 · 5 · Sun, Moon and planets on their ecliptic longitude
    const sun=Ephemeris.sun(now), mLon=ts.moonEclipticLongitude(now), ph=Ephemeris.moonPhase(now), ay=Ephemeris.ayanamsa(now);
    { const [x,y]=P(R.zod[0]-14,sun.lon), [x2,y2]=P(R.zod[0],sun.lon); s+=`<g data-body="sun" data-lon="${f(sun.lon)}"${dim('sun')}><path d="M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}" stroke="#ffd25a" stroke-width="1.6"/><g transform="translate(${f(x)} ${f(y)})"><circle r="17" fill="url(#fbgGlow)"/><circle r="8.5" fill="url(#fbgSun)" stroke="#8a5a14" stroke-width=".8"/></g><title>${en?'Sun':'الشمس'}</title></g>`; }
    PLAN.forEach(pl=>{ const q=ts.planetEquatorial(pl[0],now), lon=eclLon(q.ra,q.dec,now), [x,y]=P(pl[4],lon);
      s+=`<g data-body="${pl[0]}" data-lon="${f(lon)}"${dim(pl[0])}><circle cx="${f(x)}" cy="${f(y)}" r="8.5" fill="#070b16" stroke="${pl[3]}" stroke-width="1.4"/><text x="${f(x)}" y="${f(y)}" dy=".36em" font-size="12" fill="${pl[3]}" text-anchor="middle" font-family="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols2',serif">${pl[2]}</text><title>${en?pl[0]:pl[1]}</title></g>`; });
    { const [x,y]=P(366,mLon), [x2,y2]=P(R.man[0]+7,mLon); s+=`<g id="fbgMoonBody" data-body="moon" data-lon="${f(mLon)}"${dim('moon')}><path d="M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}" stroke="#e9e2cf" stroke-width="1.6"/><path d="M0 -6L5 4H-5Z" transform="translate(${f(x2)} ${f(y2)}) rotate(${f(mLon)})" fill="#e9e2cf"/><g transform="translate(${f(x)} ${f(y)})">${FB.moon(12,ph,'fbgMoon')}</g><title>${en?'Moon':'القمر'}</title></g>`; }
    // 6 · the day belt
    const st=observer.sunTimes(now), a=m=>AstroMath.timeToAngle(m);
    let srA=a(st.sunrise), ssA=a(st.sunset); if (ssA<srA) ssA+=360;
    s+=`<path d="${FB.band(C,ssA,srA+360,R.belt[0],R.belt[1])}" fill="#0c1230"/><path d="${FB.band(C,srA,ssA,R.belt[0],R.belt[1])}" fill="url(#fbgDay)"/>`;
    for (let i=0;i<9;i++){ const [x,y]=P(mid(R.belt)+((i*37)%19-9),ssA+(i+.5)/9*(srA+360-ssA)); s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${1+(i%3)*.5}" fill="#e9e2cf" opacity=".8"/>`; }
    for (let hh=0;hh<24;hh++) s+=tick(R.belt[0],R.belt[0]+(hh%6?4:8),a(hh*60),'#05070d',hh%6?1:1.8);
    try{ const mrs=ts.moonRiseSet(now); [[mrs.riseMin,en?'Moonrise':'شروق القمر',1],[mrs.setMin,en?'Moonset':'غروب القمر',-1]].forEach(([m,t,up])=>{ if (m===null) return; const [x,y]=P(R.belt[1]+1,a(m));
      s+=`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a(m))})"><path d="M-7 0A7 7 0 0 1 7 0Z" fill="#e9e2cf" stroke="#05070d" stroke-width=".8"/><path d="M0 ${up>0?-15:-9}V${up>0?-9:-15}M-3 ${up>0?-12:-12}L0 ${up>0?-15.5:-8.5}L3 -12" fill="none" stroke="#e9e2cf" stroke-width="1.4"/><title>${t} ${FB.hm(m)}</title></g>`; }); }catch(e){}
    const NM=FB.NAMES();
    [['fajr',0],['dhuhr',2],['asr',3],['maghrib',4],['isha',5]].forEach(([key,i])=>{ const [x,y]=P(mid(R.belt),a(p[key]));
      s+=`<g class="fbg-mark" data-k="${key}" data-m="${(+p[key]).toFixed(2)}" transform="translate(${f(x)} ${f(y)})"><circle r="14" fill="#070a14" stroke="#c9a35d" stroke-width="1.2"/>${FB.glyph(key,8.5)}<title>${NM[i]} ${FB.hm(p[key])}</title></g>`; });
    { const [x,y]=P(mid(R.belt),a(nm+720)); s+=`<g transform="translate(${f(x)} ${f(y)})" opacity=".9">${FB.moon(9,ph,'fbgMoon')}</g>`; }
    { const [x,y]=P(mid(R.belt),a(nm)); s+=`<g id="fbgSunNow" data-nm="${nm.toFixed(2)}" transform="translate(${f(x)} ${f(y)})"><circle r="24" fill="url(#fbgGlow)"/><circle r="12.5" fill="url(#fbgSun)" stroke="#8a5a14" stroke-width="1"/></g>`; }
    // 7 · the horizon: the stars, and where the Sun and the Moon stand
    starField.starsData.forEach((sd,i)=>{ const aa=observer.raDecToAltAz(sd[1],sd[2],now), [x,y]=P(mid(R.hor)+6,aa.az), up=aa.alt>-5;
      s+=`<g opacity="${up?1:.22}"><path d="M0 -5L1.4 -1.4L5 0L1.4 1.4L0 5L-1.4 1.4L-5 0L-1.4 -1.4Z" transform="translate(${f(x)} ${f(y)})" fill="#f6efdb"/>${FB.word(C,mid(R.hor)-8,aa.az,en?STAR_EN[i]:sd[0],13.5,'#cfd8ec')}</g>`; });
    const sAA=observer.sunAltAzNow(now), mAA=ts.moonAltTopo(now);
    { const [x,y]=P(R.hor[1]+1,sAA.az); s+=`<g id="sunSkyPointer" transform="translate(${f(x)} ${f(y)}) rotate(${f(sAA.az)})" opacity="${sAA.alt>0?1:.3}"><path d="M0 -3L7 9H-7Z" fill="#ffd25a" stroke="#05070d" stroke-width=".8"/><title>${en?'Sun azimuth':'سمت الشمس'} ${Math.round(sAA.az)}°</title></g>`; }
    { const [x,y]=P(R.hor[1]+1,mAA.az); s+=`<g id="moonSkyPointer" transform="translate(${f(x)} ${f(y)}) rotate(${f(mAA.az)})" opacity="${mAA.alt>0?1:.3}"><path d="M0 -3L7 9H-7Z" fill="#e9e2cf" stroke="#05070d" stroke-width=".8"/><title>${en?'Moon azimuth':'سمت القمر'} ${Math.round(mAA.az)}°</title></g>`; }
    // 8 · north, the Qibla and the shadow — the colours the guide names
    const qb=observer.computeQiblaBearing(observer.lat,observer.lon), sh=observer.shadowDirectionNow(now);
    s+=`<g id="shadowHand" data-a="${f(sh)}" transform="rotate(${f(sh)} ${C} ${C})" opacity="${sAA.alt>0?1:.14}"><path d="M${C} ${C-84}V${C-170}" stroke="#b48ae0" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/><path d="M${C} ${C-186}L${C+7} ${C-170}H${C-7}Z" fill="#b48ae0"/><title>${en?'Shadow direction':'اتجاه الظل'}</title></g>`;
    s+=`<g id="northPointerHand" transform="rotate(0 ${C} ${C})"><path d="M${C} ${C-84}V${C-196}" stroke="#58c9b4" stroke-width="2.2"/><path d="M${C} ${C-212}L${C+8} ${C-194}H${C-8}Z" fill="#58c9b4" stroke="#05070d" stroke-width=".8"/><title>${en?'North':'الشمال'}</title></g>`;
    s+=`<g id="qiblaArrow" data-a="${f(qb)}" transform="rotate(${f(qb)} ${C} ${C})"><path d="M${C} ${C-84}V${C-190}" stroke="#e0584a" stroke-width="3"/><g transform="translate(${C} ${C-204})"><rect x="-10" y="-10" width="20" height="20" rx="2" fill="#14110c" stroke="#e0584a" stroke-width="1.6"/><path d="M-10 -3.5H10" stroke="#eddba0" stroke-width="2.4"/></g><title>${en?'Qibla':'القبلة'} ${Math.round(qb)}°</title></g>`;
    // the Earth: tilted 23.5°, turned by the local day
    { const rot=AstroMath.localDayAngle(now); let e=`<g transform="rotate(-23.5 ${C} ${C})"><path d="M${C} ${C-82}V${C+82}" stroke="#c9a35d" stroke-width="1.6"/><circle cx="${C}" cy="${C}" r="66" fill="url(#fbgEarth)" stroke="#c9a35d" stroke-width="1.4"/><g clip-path="url(#fbgEarthClip)" fill="none" stroke="#bfe0f5" stroke-opacity=".45" stroke-width="1">`;
      for (let i=0;i<6;i++){ const rx=Math.abs(66*Math.sin((rot+i*30)*k)); e+=`<ellipse cx="${C}" cy="${C}" rx="${f(rx)}" ry="66"/>`; }
      e+=`<path d="M${C-66} ${C}H${C+66}M${C-58} ${C-32}H${C+58}M${C-58} ${C+32}H${C+58}"/></g></g>`; s+=e; }
    DY.innerHTML=s;
    // rings that turn
    const hrs=ST.querySelector('#fbgHours'), ut=(now.getTime()%864e5)/864e5*360;
    if (hrs) hrs.setAttribute('transform',`rotate(${f(-ut-45)} ${C} ${C})`);          // hour n sits under the city whose clock reads n (Makkah = UTC+3 on top)
    const mans=ST.querySelector('#fbgMans'); if (mans) mans.setAttribute('transform',`rotate(${ay.toFixed(3)} ${C} ${C})`);
    // corner dials
    const eot=AstroMath.equationOfTimeMinutes(now), age=AstroMath.moonAgeDays(now), half=AstroMath.SYNODIC/2, full=age<=half?1-(age/half):(age-half)/half;
    const q=id=>ST.querySelector('#'+id);
    q('fbgEot').setAttribute('transform',`rotate(${f(Math.max(-45,Math.min(45,(eot/16)*45)))})`); q('fbgEotTxt').textContent=(eot>=0?'+':'−')+FB.dg(Math.abs(eot).toFixed(1))+(en?' min':' د');
    q('fbgRes').setAttribute('transform',`rotate(${f(-45+full*90)})`); q('fbgResTxt').textContent=FB.dg(Math.round(ph.illum*100))+(FB.latin()?'%':'٪');
    q('fbgWd').setAttribute('transform',`rotate(${f(AstroMath.dayArcAngle(lp.wd))})`); q('fbgWdTxt').textContent=(en?WD_EN:WD_AR)[lp.wd];
    ST.querySelectorAll('.fbg-wd').forEach(t=>{ const on=+t.dataset.i===lp.wd; t.setAttribute('fill',on?'#f8e7b0':'#8f8566'); t.setAttribute('font-weight',on?'700':'400'); });
    // the line under the dial (the same sentence beta writes in «حقيقة السماء»)
    const stEl=document.getElementById('trueSkyStatus');
    if (stEl&&renderer.trueSkyMode&&!stEl.dataset.hold){ const AL={sun:'الشمس',moon:'القمر',Mercury:'عطارد',Venus:'الزهرة',Mars:'المريخ',Jupiter:'المشتري',Saturn:'زحل'}, hid=Object.keys(AL).filter(x=>below[x]).map(x=>AL[x]);
      stEl.textContent=hid.length?('🌌 تحت الأفق الآن: '+hid.join('، ')):'🌌 كل الأجرام فوق الأفق الآن'; }
    const t=FB.dg((lp.H%12||12)+':'+String(lp.M).padStart(2,'0'))+' '+(en?(lp.H<12?'AM':'PM'):(lp.H<12?'ص':'م'));
    host.firstElementChild.setAttribute('aria-label',(en?'The Grand Zij. Time ':'الزيج الكبرى. الساعة ')+t+' · '+FB.dg(h.day)+' '+(en?HIJ_EN:HIJ_AR)[h.month-1]+' · '+(en?'Moon: ':'القمر: ')+tr(ph.name)+' · '+(en?'Qibla ':'القبلة ')+FB.dg(Math.round(qb))+'°');
  }

  function draw(now){
    if (!host) return;
    const sk=[FB.en(),FB.latin()].join(); if (sk!==statKey){ statKey=sk; dynKey=''; drawStatic(); }
    const nm=FB.localMin(now), Q=FB.prayers(now);
    const dk=[Math.floor(now.getTime()/6e4),observer.lat,observer.lon,renderer.trueSkyMode,Q.h.day,Q.h.month,FB.KEYS.map(x=>Q.p[x].toFixed(3)).join()].join('|');
    if (dk!==dynKey){ dynKey=dk; drawDyn(now,nm,Q); }
    const hA=(nm/60%12)*30, mA=(nm%60)*6, sec=Math.floor((nm*60)%60), sA=sec*6;
    hH.setAttribute('transform',`rotate(${f(hA)} ${C} ${C})`); hM.setAttribute('transform',`rotate(${f(mA)} ${C} ${C})`); hS.setAttribute('transform',`rotate(${sA} ${C} ${C})`);
    if (cage) cage.setAttribute('transform',`rotate(${sA})`);        // the tourbillon: one turn a minute, in step with the seconds hand
    host.dataset.h=f(hA); host.dataset.m=f(mA); host.dataset.s=sA; host.dataset.nm=nm.toFixed(3);
  }
  FB.grand={mount, draw, dirty(){ statKey=dynKey=''; }};
})();
