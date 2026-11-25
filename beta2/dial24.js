/* «ساعة ٢٤» — Hassan 22 Nov 20:52: «اعتمدها واجهة شغالة مية في المية، واجهة في بيتا مع باقي الواجهات، ولا تحذفها أو تعطلها».
   The 24-hour simple clock exactly as it was on main until 22 Nov (commit 7b757e7, build 1795300359), kept as its own file so
   later work on the 12-hour clock can never break it. Ids are zq… (not zd…) and the box is #zDial24, so both clocks live on
   one page; it shows only with layout «ساعة ٢٤» (body.zv-h). */
/* #53 — الساعة الجديدة في الرئيسية. قانون حسن: كل حلقة = فَلَك له بداية ونهاية، والكتابة داخل الحلقة.
   من الداخل للخارج: ① فلك أرقام الساعة ② فلك الليل والنهار والشمس تسير عليه بحسابها ③ فلك القمر: ليالي الشهر والقمر بطوره على ليلته
   ④ فلك الصلاة: الصلوات قطع بطول وقتها. وفي الوسط العقارب الثلاثة فقط. ثابتة بلا زوم.
   ملاحظة: الكتابة العربية لا تُكتب على مسار (textPath) لأن سفاري يفكّك الحروف — كل كلمة نص عادي مُدار. الساعة القديمة كلها في «الزيج الكبرى». */
(function(){
  const EN=()=>window.ZIJ_LANG==='en';
  const AR='٠١٢٣٤٥٦٧٨٩';
  const dg=s=>{let en=EN();try{if(!en&&localStorage.getItem('zijDigits')==='en')en=true;}catch(e){}return en?String(s):String(s).replace(/\d/g,d=>AR[d]);};
  const C=300,FONT="Amiri,'EB Garamond',serif";
  const P=(a,r)=>[C+r*Math.sin(a*Math.PI/180),C-r*Math.cos(a*Math.PI/180)];
  const f12=m=>{m=((Math.round(m)%1440)+1440)%1440;let h=Math.floor(m/60);h=h%12||12;return dg(h+':'+String(m%60).padStart(2,'0'));};
  const tz=()=>{try{return observer.tzAt?observer.tzAt(new Date()):observer.tz;}catch(e){return 3;}};
  const ang=m=>180+m/1440*360;   // the day: noon on top, midnight at the bottom
  const norm=a=>((a%360)+360)%360;
  /* Hassan, 13 Nov 15:44: «اعتمد نظام ٢٤ ساعة فقط» — the dial is 24-hour only; the 12-hour code stays (not deleted) but is never used */
  const D24=()=>true;
  function band(a1,a2,r1,r2){const [a,b]=P(a1,r2),[c,d]=P(a2,r2),[e,f]=P(a2,r1),[g,h]=P(a1,r1),L=(a2-a1)>180?1:0;
    return `M${a} ${b}A${r2} ${r2} 0 ${L} 1 ${c} ${d}L${e} ${f}A${r1} ${r1} 0 ${L} 0 ${g} ${h}Z`;}
  // a word inside a ring: ordinary text turned along the ring (upright on the lower half)
  function word(a,r,str,size,fill,weight){const [x,y]=P(a,r),n=norm(a),rot=(n>90&&n<270)?n-180:(n>=270?n-360:n);
    return `<text x="${x}" y="${y}" dy=".35em" transform="rotate(${rot} ${x} ${y})" font-family="${FONT}" font-size="${size}" font-weight="${weight||700}" fill="${fill}" text-anchor="middle">${str}</text>`;}
  const lower=a=>{const n=norm(a);return n>90&&n<270;};
  /* fully curved words without breaking Arabic letters: the word is written straight (Safari shapes it correctly),
     then cut into thin strips and every strip is turned onto the ring. Top half: along the outer curve; bottom half: along the
     inner curve, so every word stays upright (the rule on every watch dial). */
  const SL=3,SK=40;let clipDefs='';
  {const cl=[];for(const side of ['t','b'])for(let k=-SK;k<=SK;k++){const x0=C+k*SL-SL/2-.35,yc=side==='t'?C-269.5:C+269.5;
     cl.push(`<clipPath id="zqS${side}${k}" clipPathUnits="userSpaceOnUse"><rect x="${x0}" y="${yc-24}" width="${SL+.7}" height="48"/></clipPath>`);}clipDefs=cl.join('');}
  /* the Moon's near side from NASA's Lunar Reconnaissance Orbiter colour map (LROC WAC, NASA SVS CGI Moon Kit, public domain) */
  const MOON_IMG='data:image/jpeg;base64,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';
  const mctx=document.createElement('canvas').getContext('2d');
  const tw=(str,size,wt)=>{mctx.font=`${wt} ${size}px Amiri, serif`;return mctx.measureText(str).width;};
  function curved(mid,r,inner,plain,size){const top=true,   /* Hassan: one direction for all six — tops facing out, read clockwise */side=top?'t':'b',y=top?C-r:C+r,W=tw(plain,size,700)+4,K=Math.min(SK,Math.ceil(W/2/SL)+1);
    const txt=`<text x="${C}" y="${y}" dy=".35em" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#2a2416" text-anchor="middle">${inner}</text>`;
    let o='';for(let k=-K;k<=K;k++){const xm=k*SL,phi=(top?1:-1)*xm/r*180/Math.PI,A=(top?mid:mid-180)+phi;
      o+=`<g transform="rotate(${A.toFixed(3)} ${C} ${C}) translate(${-xm} 0)"><g clip-path="url(#zqS${side}${k})">${txt}</g></g>`;}
    return o;}
  // rings (radii): face | numerals | day & night | moon | prayers | bezel
  const RF=118,RN=[120,150],RM=[158,188],RB=[198,226];   // face · numerals · moon · the day ring (10 Nov: the 12-hour prayer ring and the day/night ring became one 24-hour day ring, labels outside)
  const st=document.createElement('style');
  st.textContent=`#zDial24{display:block;position:relative;width:min(96vw,48vh,430px);margin:6px auto 2px;-webkit-user-select:none;user-select:none;touch-action:manipulation}
/* the «١٢ ساعة / ٢٤ ساعة» switch sits in the dial's empty top corner (Hassan, 10 Nov: under the dial it pushed the prayer cards down
   behind the tab bar and cut «العصر»): it takes no room of its own, and no label ever reaches that corner */
#zq24Sw{display:none!important}
#zq24Sw{position:absolute;top:0;left:0;z-index:2;display:flex;gap:0;direction:rtl;border:1px solid #7c5f30;border-radius:13px;overflow:hidden;background:rgba(8,11,19,.9);font:700 13px/1.25 Amiri,serif}
#zq24Sw button{border:0;margin:0;padding:3px 9px;cursor:pointer;font:inherit;background:transparent;color:#d8c79a;-webkit-tap-highlight-color:transparent}
#zq24Sw button.on{background:#c9a35d;color:#1a140a}
/* the beta design picker (home-designs.js) scrolls away with the page instead of floating over the adhan headline (#77) */
#zhdBar{position:absolute!important}
/* on the classic homes it sits in the location chip's row, inside the 70 px the chip always leaves free on each side
   (max-width:100vw − 140px), so it no longer covers the end of the Hijri date at 360–390 px; closed, it is at most 58 px wide */
body:not(.zhd) #zhdBar{top:calc(10px + env(safe-area-inset-top,0px))!important;gap:0}
body:not(.zhd) #zhdBar:not(.open) button{padding:3px;min-width:0;font-size:14px}
#zDial24 svg{display:block;width:100%;height:auto}
/* item 4 (Hassan, 12 Nov — the lesson of Al-Harameen's «يومك» dial): the length of the day and of the night, one quiet line under the dial */
#zqLen{margin:-2px 0 2px;text-align:center;font:400 15px/1.35 Amiri,'EB Garamond',serif;color:#d8ccaa;letter-spacing:.2px}
#zqLen b{font-weight:700;color:#f5e6b4}
body:not(.simple-view) #zDial24{display:none!important}
body:not(.zv-h) #zDial24{display:none!important}
body.zv-h #zDial{display:none!important}`;
  document.head.appendChild(st);
  const box=document.createElement('div');box.id='zDial24';box.setAttribute('data-notr','');box.setAttribute('data-nodigit','');
  box.innerHTML=`<svg viewBox="-72 -46 744 692" role="img" aria-label="الساعة"><defs>
<radialGradient id="zqFace" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#1e2740"/><stop offset="1" stop-color="#080b13"/></radialGradient>
<linearGradient id="zqGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e3ae"/><stop offset=".5" stop-color="#c9a35d"/><stop offset="1" stop-color="#6f5229"/></linearGradient>
<radialGradient id="zqSun"><stop offset="0" stop-color="#fff6c8"/><stop offset=".55" stop-color="#ffd25a"/><stop offset="1" stop-color="#e8962e"/></radialGradient>
<radialGradient id="zqGlow"><stop offset="0" stop-color="#ffd25a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient>
${clipDefs}<clipPath id="zqMoonClip"><circle r="13"/></clipPath></defs><g id="zqStatic"></g><g id="zqHands"></g></svg><div id="zqLen" aria-live="off"></div>`;
  const hn=document.getElementById('hNote')||document.getElementById('hTop');
  {const d=document.getElementById('zDial');if(d)d.after(box);else if(hn)hn.after(box);else document.body.prepend(box);}
  const S=box.querySelector('#zqStatic'),HG=box.querySelector('#zqHands');
  let lastKey='';
  const localMin=now=>{const t=new Date(now.getTime()+tz()*36e5);return t.getUTCHours()*60+t.getUTCMinutes()+t.getUTCSeconds()/60+t.getUTCMilliseconds()/6e4;};
  const sep=r=>`<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="#c9a35d" stroke-width="1.6"/>`;
  function drawStatic(now){
    const en=EN();let h,p;
    try{h=hijriCal.fromGregorian(now);p=observer.realPrayerTimes(now,h);}catch(e){return;}
    const nm=localMin(now);
    let s='';
    /* ④ the day ring — Hassan, 10 Nov («وجدت حل الصلوات»): the whole day on one coloured ring (noon on top, midnight at the bottom),
       every period in its own colour, the Sun on it where it is now, and every prayer written OUTSIDE the ring — name over time,
       joined by a short line to a dot on its moment. Labels never sit inside a piece any more, so no name is ever hidden or squeezed
       (the 7 Nov «مغرب» sliver problem is gone). Close names (Maghrib/Isha, Fajr/Sunrise) are pushed apart along the outside.
       Midnight and the last third of the night are small diamonds. No digital text in the middle — the clock hands stay there. */
    let pt=p;try{const t2=new Date(now.getTime()+864e5);pt=observer.realPrayerTimes(t2,hijriCal.fromGregorian(t2));}catch(e){}
    let py=p;try{const t0=new Date(now.getTime()-864e5);py=observer.realPrayerTimes(t0,hijriCal.fromGregorian(t0));}catch(e){}
    const NM=[en?'Fajr':'الفجر',en?'Sunrise':'الشروق',en?'Dhuhr':'الظهر',en?'Asr':'العصر',en?'Maghrib':'المغرب',en?'Isha':'العشاء'],KEYS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
    /* Hassan, 13 Nov («الساعة المبسطة تعرض الظهر واليوم جمعة»): on a Friday Dhuhr is named Jumu'ah on the ring, as on the cards */
    const wd0=new Date(now.getTime()+observer.tz*36e5).getUTCDay(),nmOf=(i,dd)=>(i===2&&((wd0+dd)%7+7)%7===5)?(en?"Jumu'ah":'الجمعة'):NM[i];
    const d24=D24();
    /* minute of the day → angle on the ring.
       24 h: the day ring — noon on top, midnight at the bottom (the 24-hour hour hand points here).
       12 h (Hassan, 10 Nov 17:47: «الكود في التصميم لا يطابق الوقت» — the 24-hour ring disagreed with the 12-hour hands):
       the hour hand's own angle, so the ring shows the coming 12 hours and every prayer sits on its time on the numerals —
       the geometry of the prayer ring before 10 Nov, with everything new kept (labels outside, colours, the two suns, night marks). */
    const ga=d24?(m=>ang(((m%1440)+1440)%1440)):(m=>((m%720)+720)%720/2);
    /* Hassan, 13 Nov: the day runs from midnight to midnight — the prayers on the dial are TODAY's until 12 at night, past ones dimmed;
       the night in progress (Maghrib → Fajr: midnight, the last third) stays with it until Fajr.
       12 h: the dial shows the half of the day we are in — midnight → noon (with Dhuhr at the top), noon → midnight. */
    const RBm=(RB[0]+RB[1])/2,H0=nm<720?0:720,W1=H0?1440:Math.max(720,p.dhuhr+1),CW=H0+720;
    // every prayer of yesterday, today and tomorrow, in order (minutes from today's midnight)
    const EV=[];[[py,-1440],[p,0],[pt,1440]].forEach(([q,o])=>KEYS.forEach((k,i)=>EV.push({i,k,t:q[k]+o})));EV.sort((x,y)=>x.t-y.t);
    const aftM=false;   // 24 h: no switch to tomorrow's Fajr after Maghrib any more — today's stays (dimmed) until midnight
    const T=KEYS.map(k=>p[k]);
    drawnSig=T.join(',');   // what this drawing shows — tick() redraws whenever the live times differ (19 Nov: «العصر ٣:١٨» on the ring, ٣:١٩ on the card)
    // the night in progress (or tonight): Maghrib → Fajr — the same as the prayer tab (#51)
    let mN=p.maghrib,fN=pt.fajr+1440;if(nm<p.fajr){mN=py.maghrib-1440;fN=p.fajr;}
    const midN=(mN+fN)/2,third=mN+(fN-mN)*2/3;
    /* item 4: day = sunrise → Maghrib (today), night = Maghrib → Fajr — the very night used for midnight and the last third */
    {const zl=box.querySelector('#zqLen');if(zl){const hm=v=>{v=Math.max(0,Math.round(v));const h=Math.floor(v/60),m=v%60;
        return en?`${h} h ${m} min`:`${dg(h)} س ${dg(m)} د`;};
      const dayL=p.maghrib-p.fajr,nightL=fN-mN;   // Hassan, 13 Nov: the shar'i day, Fajr → Maghrib, so day + night = 24 h
      zl.innerHTML=en?`Day <b>${hm(dayL)}</b> · Night <b>${hm(nightL)}</b>`:`النهار <b>${hm(dayL)}</b> · الليل <b>${hm(nightL)}</b>`;
      zl.setAttribute('aria-label',zl.textContent);}}
    // the band: outer gold rim, then the coloured periods
    s+=`<circle cx="${C}" cy="${C}" r="${RB[1]+5}" fill="url(#zqGold)"/><circle cx="${C}" cy="${C}" r="${RB[1]+1.5}" fill="#080b13"/>`;
    const COL=['#5d4f9a','#e9dcae','#d9b45e','#d98a4c','#a9566a','#1f2a55'];   // from each prayer to the next: dawn violet · morning cream · noon gold · Asr amber · Maghrib rose · night navy
    const tt=T.map(t=>((t%1440)+1440)%1440);
    if(d24){for(let i=0;i<6;i++){let a1=ang(tt[i]),a2=ang(tt[(i+1)%6]);while(a2<=a1)a2+=360;
      s+=`<path d="${band(a1,a2,RB[0],RB[1])}" fill="${COL[i]}"/>`;}}
    else for(let j=0;j<EV.length-1;j++){   // 12 h: each period of the coming 12 hours in its colour, cut at the hand
      const s1=Math.max(EV[j].t,H0),s2=Math.min(EV[j+1].t,CW);if(s2<=s1)continue;
      const a1=ga(s1);s+=`<path d="${band(a1,a1+(s2-s1)/2,RB[0],RB[1])}" fill="${COL[EV[j].i]}"/>`;}
    s+=sep(RB[1])+sep(RB[0]);
    // the hour marks, quietly on the inner edge (every 3 hours a longer one): 24 h — the day's 24 hours; 12 h — the dial's 12
    for(let k=0;k<(d24?24:12);k++){const a=d24?ang(k*60):k*30,[x1,y1]=P(a,RB[0]+1),[x2,y2]=P(a,RB[0]+(k%3?5:9));s+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#080b13" stroke-opacity=".55" stroke-width="${k%3?1.2:2}"/>`;}
    // 12 h: where the 12 hours end and begin again — at the hand (the «now» Sun sits on it)
    if(!d24){const [x1,y1]=P(0,RB[0]-1),[x2,y2]=P(0,RB[1]+1);s+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#080b13" stroke-width="3"/>`;}
    /* the labels: name over time, placed just outside the ring, then nudged apart so no two touch */
    const L=[];
    /* the same language as «كيرف الشمس» (home-designs.js, هـ): name and time the same size, next prayer gold and bold with a ring
       round its dot, past ones dimmed, everything else ink; a dark halo behind every word; the same calm palette after Isha */
    const night=nm>=p.isha||nm<p.fajr;
    const K={brass:night?'#a8813f':'#c9a35d',ink:night?'#f0cf94':'#fbf4e2',gold:night?'#e6c287':'#f5e6b4',past:night?'#b09872':'#b9b09a',bg:night?'#030406':'#0a0c12'};
    const MIDN=en?'Midnight':'منتصف الليل',THIRD=en?'Last third':'الثلث الأخير';
    if(d24){
      // next prayer (sunrise counts as an event, like the hero card)
      let nx=-1;T.forEach((t,i)=>{if(nx<0&&t>nm)nx=i;});   // after Isha nothing of today is ahead — the hero card counts to Fajr
      T.forEach((t,i)=>{const tmr=aftM&&i<2,tl=(tmr?(en?'tmrw ':'غداً '):'')+f12(t);
        L.push({a:ga(t),t,key:KEYS[i],name:nmOf(i,0),time:tl,fs:33,ft:33,next:i===nx,past:t<nm,kind:'p'});});
      L.push({a:ga(midN),t:midN,key:'mid',name:MIDN,time:f12(midN),fs:25,ft:25,kind:'n',past:midN<nm});
      L.push({a:ga(third),t:third,key:'third',name:THIRD,time:f12(third),fs:25,ft:25,kind:'n',past:third<nm});
    }else{
      /* 12 h: only what lies in the coming 12 hours. A prayer that began before now has no place on this ring — its moment is
         behind the hand, where the ring already shows the hours 12 hours ahead (the cards above still show it). */
      const EVh=EV.filter(e=>e.t>=H0&&e.t<W1),nx12=EVh.findIndex(e=>e.t>nm);
      EVh.forEach((e,j)=>{const tmr=e.t>=1440,tl=(tmr?(en?'tmrw ':'غداً '):'')+f12(e.t);
        L.push({a:ga(e.t),t:e.t,key:e.k,name:nmOf(e.i,Math.floor(e.t/1440)),time:tl,fs:33,ft:33,next:j===nx12,past:e.t<nm,kind:'p'});});
      // midnight and the last third of last night and of tonight, when they fall in the 12 hours
      [[py.maghrib-1440,p.fajr],[p.maghrib,pt.fajr+1440]].forEach(([m0,f0])=>[[(m0+f0)/2,'mid',MIDN],[m0+(f0-m0)*2/3,'third',THIRD]].forEach(([t,key,name])=>{
        if(t>=H0&&t<W1)L.push({a:ga(t),t,key,name,time:f12(t),fs:25,ft:25,kind:'n',past:t<nm});}));
    }
    const R0=RB[1]+14,PAD=4,VB=[-72,-46,672,646];   // VB: the svg's viewBox edges
    const size=l=>{l.w=Math.max(tw(l.name,l.fs,700),tw(l.time,l.ft,700))+8;l.h=l.fs*1.08+l.ft*1.16;};
    L.forEach(l=>{size(l);l.b=l.a;});
    /* a label sits just clear of the ring; one that would leave the picture (a long «tmrw 5:14» on the left or right side)
       gets slightly smaller words until it fits — never cut at the edge (#77) */
    const place=l=>{for(let k=0;;k++){let r=R0;for(;r<R0+200;r+=1){const [x,y]=P(l.b,r),x0=x-l.w/2,x1=x+l.w/2,y0=y-l.h/2,y1=y+l.h/2;
        const nx2=Math.min(Math.max(C,x0),x1),ny=Math.min(Math.max(C,y0),y1);if(Math.hypot(nx2-C,ny-C)>=R0)break;}
      [l.x,l.y]=P(l.b,r);
      if(k>=8||(l.x-l.w/2>=VB[0]+3&&l.x+l.w/2<=VB[2]-3&&l.y-l.h/2>=VB[1]+3&&l.y+l.h/2<=VB[3]-3))return;
      l.fs*=.95;l.ft*=.95;size(l);}};
    const hit=(u,v)=>Math.abs(u.x-v.x)<(u.w+v.w)/2+PAD&&Math.abs(u.y-v.y)<(u.h+v.h)/2+PAD;
    /* the «١٢ / ٢٤» switch in the top-left corner is an obstacle too: a label that would run under it slides along the ring,
       away from the corner (on a narrow phone the switch is bigger beside the smaller dial) */
    let SWB=null;
    try{const br=box.getBoundingClientRect(),q=box.querySelector('#zq24Sw');
      if(q&&br.width>0){const sr=q.getBoundingClientRect(),k=744/br.width;
        SWB={x:VB[0]+(sr.left-br.left+sr.width/2)*k,y:VB[1]+(sr.top-br.top+sr.height/2)*k,w:sr.width*k+12,h:sr.height*k+24};
        SWB.a=norm(Math.atan2(SWB.x-C,C-SWB.y)*180/Math.PI);}}catch(e){}
    L.forEach(place);
    for(let it=0;it<400;it++){let moved=false;
      for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const u=L[i],v=L[j];if(!hit(u,v))continue;
        let d=norm(v.b-u.b);if(d>180)d-=360;const s1=d>=0?1:-1,st=u.kind===v.kind?.6:(u.kind==='n'?1:0);   // night marks give way to prayers
        u.b-=s1*.6*(u.kind==='n'||st!==1?1:0)+(u.kind==='p'&&v.kind==='n'?0:0);v.b+=s1*.6*(v.kind==='n'||u.kind===v.kind?1:0);
        if(u.kind==='n'&&v.kind==='p')u.b-=s1*.6;place(u);place(v);moved=true;}
      if(SWB)for(const u of L)if(hit(u,SWB)){let d=norm(u.b-SWB.a);if(d>180)d-=360;u.b+=d>=0?.6:-.6;place(u);moved=true;}
      if(!moved)break;}
    // still crowded: the oldest past names give way (their dots stay on the ring) — as on the sun curve
    {const past=L.filter(l=>l.past).sort((u,v)=>u.t-v.t);
      for(const l of past){if(L.some(v=>v!==l&&!v.hide&&hit(l,v)))l.hide=true;}}
    let lab='';
    L.forEach(l=>{const [dx,dy]=P(l.a,RBm),[ex,ey]=P(l.a,RB[1]+4),[fx,fy]=P(l.a,RB[1]+11);
      // the line goes from the ring to the nearest edge of the label
      const tx=Math.min(Math.max(fx,l.x-l.w/2),l.x+l.w/2),ty=Math.min(Math.max(fy,l.y-l.h/2),l.y+l.h/2);
      const foc=l.next,col=foc?K.gold:(l.past?K.past:K.ink),fw=foc?' font-weight="700"':'',halo=` stroke="${K.bg}" stroke-width="9" paint-order="stroke" stroke-linejoin="round"`;
      if(!l.hide)lab+=`<polyline points="${ex.toFixed(1)},${ey.toFixed(1)} ${fx.toFixed(1)},${fy.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}" fill="none" stroke="${col}" stroke-opacity=".45" stroke-width="1.8"/>`;
      // a mark under the «now» Sun gets a dark outline so it reads on the Sun's disc (#77 ④)
      let dA=Math.abs(norm(l.a-ga(nm)));if(dA>180)dA=360-dA;const onSun=dA<6;
      /* Hassan 22 Nov: no dot on the ring for a prayer — the colour change of the ring and the line to the name mark it.
         Only the night marks (midnight, last third) keep their diamonds. */
      if(l.kind!=='p'){const q=l.a,[cx,cy]=P(q,RBm),z=6;lab+=`<path data-k="${l.key}" data-m="${(+l.t).toFixed(2)}" d="M${cx} ${cy-z}L${cx+z*.75} ${cy}L${cx} ${cy+z}L${cx-z*.75} ${cy}Z" transform="rotate(${q.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${col}" fill-opacity=".85" stroke="${K.bg}" stroke-width="1.6"/>`;}
      if(l.hide)return;
      const y1=l.y-l.h/2+l.fs*.86;
      // one <text> per line (Safari splits a word when one <text> holds two positioned lines)
      lab+=`<text x="${l.x.toFixed(1)}" y="${y1.toFixed(1)}" font-family="${FONT}" font-size="${l.fs}" text-anchor="middle" fill="${col}"${fw}${halo}>${l.name}</text>`+
        `<text x="${l.x.toFixed(1)}" y="${(y1+l.ft*1.14).toFixed(1)}" font-family="${FONT}" font-size="${l.ft}" text-anchor="middle" fill="${col}"${fw}${halo}>${l.time}</text>`;});
    /* the Sun on the day ring, where it is now (the navy medallion with a gold rim from 7 Nov): bright by day, muted at night */
    let sunTag='';
    {const up=nm>=p.sunrise&&nm<p.maghrib,[x,y]=P(ga(nm),RBm),R=14.5;
      const ray=Array.from({length:12},(_,k)=>{const q=k*30*Math.PI/180,r1=8.2,r2=k%2?10.6:12;return `<line x1="${(r1*Math.sin(q)).toFixed(2)}" y1="${(-r1*Math.cos(q)).toFixed(2)}" x2="${(r2*Math.sin(q)).toFixed(2)}" y2="${(-r2*Math.cos(q)).toFixed(2)}"/>`;}).join('');
      sunTag=`<g id="zqSunDisc" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">`+
        (up?`<circle r="${R+8}" fill="url(#zqGlow)"/>`:'')+
        `<circle r="${R}" fill="#0b1020" stroke="#c9a35d" stroke-width="1.6"/>`+
        `<g stroke="${up?'#ffd25a':'#b8975a'}" stroke-width="1.6" stroke-linecap="round">${ray}</g>`+
        `<circle r="6.6" fill="${up?'url(#zqSun)':'#9c8150'}" stroke="${up?'#f3c45a':'#6f5229'}" stroke-width=".8"/></g>`;}
    /* #77 ④: the «now» Sun is drawn first and the prayer dots and night diamonds over it, so at a prayer's very moment
       (Maghrib) or at midnight the mark stays visible on the Sun instead of hiding under it */
    s+=sunTag+lab;
    /* Hassan, 10 Nov 13:17 — two suns, each with its own meaning (#65: nothing said twice):
       ① on the day ring: the «now» Sun above, plus a thin gold arc from the last prayer's dot to it (how far into this prayer's time we are) */
    /*    (24 h only: on the 12-hour ring the time behind the hand already shows the hours 12 hours ahead, so an «elapsed» arc there would sit on them) */
    if(d24){let pv=0,bd=1e9;tt.forEach((t,i)=>{let d=nm-t;while(d<0)d+=1440;if(d<bd){bd=d;pv=i;}});
      let a1=ang(tt[pv]),a2=ga(nm);while(a2<a1)a2+=360;
      if(a2-a1>.5){const r=RB[0]-5.5,[x1,y1]=P(a1,r),[x2,y2]=P(a2,r);
        s+=`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${a2-a1>180?1:0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#f3d98a" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`;}}
    /* ③ the Moon's ring — the nights of the Hijri month from 1 at the top, NASA's Moon on tonight with its real phase */
    s+=`<circle cx="${C}" cy="${C}" r="${RM[1]+3}" fill="#080b13"/>`;
    s+=`<circle cx="${C}" cy="${C}" r="${(RM[0]+RM[1])/2}" fill="none" stroke="#111a30" stroke-width="${RM[1]-RM[0]}"/>`+sep(RM[1])+sep(RM[0]);
    for(let k=0;k<30;k++){const [x1,y1]=P(k*12,RM[1]-3),[x2,y2]=P(k*12,RM[1]-(k%5?6:10));s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c9a35d" stroke-opacity=".55" stroke-width="1.2"/>`;}
    let ph=null;try{ph=Ephemeris.moonPhase(now);}catch(e){}
    {const a=(h.day-1)*12,[mx,my]=P(a,(RM[0]+RM[1])/2),r=13;
      s+=`<g id="zqMoon" style="cursor:pointer"><g transform="translate(${mx} ${my})">`+
        (MOON_IMG?`<image href="${MOON_IMG}" x="${-r}" y="${-r}" width="${2*r}" height="${2*r}" clip-path="url(#zqMoonClip)"/>`:`<circle r="${r}" fill="#ece5d0"/>`);
      if(ph&&ph.illum<.99){const pd=Ephemeris.moonDarkPath(r,ph.illum,ph.waxing);s+=`<path d="${pd.d}" fill="#0a0d16" fill-opacity=".9" ${pd.flip?'transform="scale(-1 1)"':''}/>`;}
      s+=`<circle r="${r}" fill="none" stroke="#c9a35d" stroke-opacity=".5" stroke-width=".8"/></g></g>`;}
    /* ① the numerals' ring */
    s+=`<circle cx="${C}" cy="${C}" r="${(RN[0]+RN[1])/2}" fill="none" stroke="#231c10" stroke-width="${RN[1]-RN[0]}"/>`+sep(RN[1]);
    if(!D24())for(let k=1;k<=12;k++){const [x,y]=P(k*30,(RN[0]+RN[1])/2);s+=`<text x="${x}" y="${y}" dy=".35em" font-family="${FONT}" font-weight="700" font-size="24" fill="#f5e6b4" text-anchor="middle">${dg(k)}</text>`;}
    /* 24-hour dial (Hassan, 10 Nov, option 2 — test): the hours as on the day ring, midnight at the bottom, ٦ left, ١٢ on top, ١٨ right,
       every 2 hours (the same 30° steps as the 12-hour numerals, so the bold 5-minute marks still line up) */
    else for(let k=0;k<24;k+=2){const [x,y]=P(ang(k*60),(RN[0]+RN[1])/2),big=k%6===0;s+=`<text x="${x}" y="${y}" dy=".35em" font-family="${FONT}" font-weight="700" font-size="${big?24:21}" fill="${big?'#f5e6b4':'#d8c79a'}" text-anchor="middle">${dg(k||24)}</text>`;}
    /* the face with the minute marks */
    s+=`<circle cx="${C}" cy="${C}" r="${RN[0]}" fill="url(#zqFace)" stroke="#c9a35d" stroke-width="1.6"/>`;
    for(let k=0;k<60;k++){const [x1,y1]=P(k*6,RF-2),[x2,y2]=P(k*6,RF-(k%5?8:15));s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c9a35d" stroke-width="${k%5?1.1:2.8}"/>`;}
    /* Hassan 21–22 Nov («الشمس داخل الميناء لن يفهمها أحد مع الخط… ساعة بسيطة»): the face holds only the hours and the hands.
       The «sky» Sun, its horizon line and lit dome (10 Nov) are gone; the ring's Sun alone says where the day is and whether it is up. */
    S.innerHTML=s;
    const mg=S.querySelector('#zqMoon');if(mg)mg.addEventListener('click',e=>{e.stopPropagation();try{window.zijMonthSheet&&zijMonthSheet();}catch(_){}});
  }
  function drawHands(now){
    const m=localMin(now),d24=D24(),hA=d24?ang(m):(m/60%12)*30,mA=(m%60)*6,sA=Math.floor((m*60)%60)*6;   // 24h: the hour hand turns once a day and points at «now» on the day ring (at its Sun)
    // a tapered sword hand: wide near the centre, narrow at the tip, short tail
    const sword=(a,len,w,tail,col)=>{const pts=[[a,len],[a+90,w*.28],[a+180,tail],[a-90,w*.28]].map(([q,r])=>{const t=q*Math.PI/180;return [C+r*Math.sin(t),C-r*Math.cos(t)];});
      const [bl,br]=[P(a-90,w/2),P(a+90,w/2)],[tip]=[P(a,len)],[tl]=[P(a+180,tail)];
      return `<path d="M${tip[0]} ${tip[1]} L${br[0]} ${br[1]} L${tl[0]} ${tl[1]} L${bl[0]} ${bl[1]}Z" fill="${col}" stroke="#4a3a1e" stroke-width="1.2" stroke-linejoin="round"/>`;};
    const [sx,sy]=P(sA,112),[cx2,cy2]=P(sA+180,26),[cw,ch]=P(sA+180,20);
    HG.innerHTML=`<g opacity=".35" transform="translate(3 4)">${sword(hA,74,14,14,'#000')}${sword(mA,112,11,18,'#000')}</g>`+
      sword(hA,74,14,14,'#e9cf8a')+sword(mA,112,d24?8:11,18,d24?'#e8e2d0':'#f3e3ae')+
      /* Hassan 21 Nov: no small sun on the hour hand's tip — the hand already points at the ring's Sun */
      `<line x1="${cx2}" y1="${cy2}" x2="${sx}" y2="${sy}" stroke="#d6453a" stroke-width="2.4" stroke-linecap="round"/><circle cx="${cw}" cy="${ch}" r="6" fill="#d6453a"/>`+
      `<circle cx="${C}" cy="${C}" r="10" fill="url(#zqGold)" stroke="#6f5229"/><circle cx="${C}" cy="${C}" r="3.5" fill="#d6453a"/>`;
  }
  let sigT=0,sig='',drawnSig='';
  function tick(){const now=new Date();
    /* the times can change without the minute changing — the official Umm al-Qura table is loaded after the first draw, and the
       dial then kept the first (calculated) minutes: «المغرب ٥:٤٢» on the ring against «٥:٤٣» on the card. Every second the six
       times are read again; a change redraws the dial. */
    if(now-sigT>1000){sigT=+now;try{const q=observer.realPrayerTimes(now,hijriCal.fromGregorian(now));sig=['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(k=>q[k]).join(',');}catch(e){}}
    const key=Math.floor(now.getTime()/60000)+'|'+(window.ZIJ_LANG||'')+'|'+(typeof observer!=='undefined'&&observer.lat)+'|'+D24()+'|'+sig;
    if(key!==lastKey||(sig&&sig!==drawnSig)){lastKey=key;drawStatic(now);}drawHands(now);}
  /* beta test switch «١٢ ساعة / ٢٤ ساعة» under the dial — the 12-hour dial stays one tap away (#29); the choice is kept on this phone */
  {const sw=document.createElement('div');sw.id='zq24Sw';sw.setAttribute('data-notr','');sw.setAttribute('data-nodigit','');
    sw.setAttribute('role','group');sw.setAttribute('aria-label',EN()?'Dial: 12 or 24 hours':'الساعة: ١٢ أو ٢٤ ساعة');
    const paint=()=>{const on=D24();sw.innerHTML=[['12',EN()?'12 h':'١٢ ساعة'],['24',EN()?'24 h':'٢٤ ساعة']].map(([k,t])=>{const a=(k==='24')===on;
      return `<button type="button" data-k="${k}" class="${a?'on':''}" aria-pressed="${a}">${t}</button>`;}).join('');};
    sw.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;try{localStorage.setItem('zijDial24',b.dataset.k==='24'?'1':'0');}catch(_){}
      paint();lastKey='';tick();});
    box.appendChild(sw);paint();}
  box.addEventListener('click',e=>{if(e.target.closest('#zqMoon')||e.target.closest('#zq24Sw'))return;const b=document.querySelector('.htab [data-go="prayer"]');if(b)b.click();});
  /* #77 (360×740 and short phones, item ⑥): when the dial and the prayer cards together would reach under the tab bar,
     the dial alone gets smaller — just enough, never below 250 px — so the whole home fits one screen without scrolling.
     Nothing is hidden or moved; on a tall enough screen the size is exactly as before. */
  function fitDial(){
    try{box.style.width='';if(!document.body.classList.contains('simple-view'))return;
      const r=box.getBoundingClientRect(),tab=document.querySelector('nav.htab');if(!r.width||!tab)return;
      const tb=tab.getBoundingClientRect();if(!tb.height)return;
      const y=window.scrollY||0;let low=r.bottom+y;
      const pr=document.querySelector('.prow');if(pr){const q=pr.getBoundingClientRect();if(q.height)low=Math.max(low,q.bottom+y);}
      const over=low-(tb.top-6);
      // only when it then really fits: a home that needs scrolling anyway (the «ج» layout, dial below the cards) keeps the full dial
      if(over>0){const w=r.width-over*744/692;if(w>=250&&w<r.width-1){box.style.width=w.toFixed(0)+'px';lastKey='';}}
    }catch(e){}}
  let fitQ=0;const fitSoon=()=>{cancelAnimationFrame(fitQ);fitQ=requestAnimationFrame(()=>{fitDial();tick();});};
  tick();setInterval(tick,1000);
  window.addEventListener('resize',()=>{lastKey='';fitSoon();});   // a new width: the labels are placed again round the corner switch
  window.addEventListener('load',fitSoon);setTimeout(fitSoon,600);
  new MutationObserver(fitSoon).observe(document.body,{attributes:true,attributeFilter:['class']});
  try{document.fonts&&document.fonts.ready.then(fitSoon);}catch(e){}
  try{document.fonts&&document.fonts.ready.then(()=>{lastKey='';tick();});}catch(e){}   // words are measured with the real font
  window.zijDial24={redraw:()=>{lastKey='';tick();}};
})();
