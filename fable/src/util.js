/* ===== fable · shared helpers for the new renderers. All times and angles come from beta's engine objects. ===== */
const FB = window.FB = {};
(function(){
  const AR='٠١٢٣٤٥٦٧٨٩';
  FB.en = () => window.ZIJ_LANG==='en';
  FB.latin = () => { if (FB.en()) return true; try{ return localStorage.getItem('zijDigits')==='en'; }catch(e){ return false; } };
  FB.dg = s => FB.latin() ? String(s) : String(s).replace(/\d/g, d => AR[d]);
  FB.ls = (k,d) => { try{ const v=localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } };
  FB.set = (k,v) => { try{ localStorage.setItem(k,v); }catch(e){} };
  FB.tzAt = d => { try{ return observer.tzAt(d); }catch(e){ return -(d.getTimezoneOffset()/60); } };
  // minutes after local midnight in the place's zone — the same expression beta's home and dial use
  FB.localMin = now => { const t=new Date(now.getTime()+FB.tzAt(now)*36e5); return t.getUTCHours()*60+t.getUTCMinutes()+t.getUTCSeconds()/60+t.getUTCMilliseconds()/6e4; };
  FB.localParts = now => { const t=new Date(now.getTime()+FB.tzAt(now)*36e5); return {wd:t.getUTCDay(), d:t.getUTCDate(), m:t.getUTCMonth(), y:t.getUTCFullYear(), H:t.getUTCHours(), M:t.getUTCMinutes(), S:t.getUTCSeconds()}; };
  // a prayer time for a label: rounded by the engine's own AstroMath.minToHHMM, then only re-dressed (digits, ص/م)
  FB.hm = (min, noAp) => { const s=AstroMath.minToHHMM(min), h=+s.slice(0,2), m=s.slice(3,5), pm=s.slice(6)==='PM';
    return FB.dg(h+':'+m) + (noAp ? '' : ' '+(FB.en()?(pm?'PM':'AM'):(pm?'م':'ص'))); };
  FB.hmMin = min => { const s=AstroMath.minToHHMM(min); let h=+s.slice(0,2)%12; if (s.slice(6)==='PM') h+=12; return h*60+ +s.slice(3,5); };
  FB.P = (c,r,a) => { const t=a*Math.PI/180; return [c+r*Math.sin(t), c-r*Math.cos(t)]; };
  FB.f = n => (+n).toFixed(2);
  FB.norm = a => ((a%360)+360)%360;
  // an annular sector from angle a1 to a2 (clockwise, degrees from the top)
  FB.band = (c,a1,a2,r1,r2) => { const [a,b]=FB.P(c,r2,a1),[x,y]=FB.P(c,r2,a2),[e,f]=FB.P(c,r1,a2),[g,h]=FB.P(c,r1,a1), L=(a2-a1)>180?1:0;
    return `M${FB.f(a)} ${FB.f(b)}A${r2} ${r2} 0 ${L} 1 ${FB.f(x)} ${FB.f(y)}L${FB.f(e)} ${FB.f(f)}A${r1} ${r1} 0 ${L} 0 ${FB.f(g)} ${FB.f(h)}Z`; };
  FB.arc = (c,r,a1,a2) => { const [a,b]=FB.P(c,r,a1),[x,y]=FB.P(c,r,a2); return `M${FB.f(a)} ${FB.f(b)}A${r} ${r} 0 ${(a2-a1)>180?1:0} 1 ${FB.f(x)} ${FB.f(y)}`; };
  // a word set along a ring: plain text turned to the ring (Arabic is never put on a textPath — Safari would split the letters)
  FB.word = (c,r,a,str,size,fill,extra) => { const [x,y]=FB.P(c,r,a), n=FB.norm(a), rot=(n>90&&n<270)?n-180:n;
    return `<text x="${FB.f(x)}" y="${FB.f(y)}" dy=".35em" transform="rotate(${FB.f(rot)} ${FB.f(x)} ${FB.f(y)})" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra||''}>${str}</text>`; };
  const mc=document.createElement('canvas').getContext('2d');
  FB.tw = (str,size,wt) => { mc.font=`${wt||700} ${size}px Amiri, serif`; return mc.measureText(str).width; };
  FB.reduced = () => { try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
  FB.prayers = now => { const h=hijriCal.fromGregorian(now), p=observer.realPrayerTimes(now,h);
    const t1=new Date(now.getTime()+864e5), t0=new Date(now.getTime()-864e5);
    return {h, p, pt:observer.realPrayerTimes(t1,hijriCal.fromGregorian(t1)), py:observer.realPrayerTimes(t0,hijriCal.fromGregorian(t0))}; };
  FB.KEYS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
  FB.NAMES = () => FB.en()?['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha']:['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];
  // the five prayer glyphs keep beta's meanings (the guide describes them): dawn arrow · full disc · disc with a slanted shadow · sinking half disc · four-point star
  FB.glyph = (k,s,ink) => { const c=ink||'#f3e3ae';
    if (k==='fajr') return `<path d="M${-s} ${s*.55}H${s}" stroke="${c}" stroke-width="${s*.22}" stroke-linecap="round"/><path d="M${-s*.55} ${s*.2}L0 ${-s}L${s*.55} ${s*.2}" fill="none" stroke="${c}" stroke-width="${s*.24}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (k==='sunrise') return `<path d="M${-s} ${s*.5}H${s}" stroke="${c}" stroke-width="${s*.2}" stroke-linecap="round"/><path d="M${-s*.62} ${s*.5}A${s*.62} ${s*.62} 0 0 1 ${s*.62} ${s*.5}" fill="none" stroke="${c}" stroke-width="${s*.22}"/>`;
    if (k==='dhuhr') return `<circle r="${s*.72}" fill="#f7d978" stroke="#3a2c10" stroke-width="${s*.12}"/>`;
    if (k==='asr') return `<circle r="${s*.56}" fill="#e8a94a" stroke="#3a2c10" stroke-width="${s*.12}"/><path d="M${s*.1} ${s*.1}L${s*1.05} ${s*.95}" stroke="${c}" stroke-width="${s*.22}" stroke-linecap="round"/>`;
    if (k==='maghrib') return `<path d="M${-s*.75} 0A${s*.75} ${s*.75} 0 0 1 ${s*.75} 0Z" fill="#d0694a" stroke="#3a1c10" stroke-width="${s*.1}"/><path d="M${-s} 0H${s}" stroke="${c}" stroke-width="${s*.2}" stroke-linecap="round"/>`;
    if (k==='isha') return `<path d="M0 ${-s}L${s*.24} ${-s*.24}L${s} 0L${s*.24} ${s*.24}L0 ${s}L${-s*.24} ${s*.24}L${-s} 0L${-s*.24} ${-s*.24}Z" fill="${c}" stroke="#2a2010" stroke-width="${s*.08}"/>`;
    return `<path d="M0 ${-s*.8}L${s*.6} 0L0 ${s*.8}L${-s*.6} 0Z" fill="${c}"/>`; };
  // the Moon: an ivory disc with soft maria, and the engine's own terminator path for the phase
  FB.moon = (r,ph,id) => { const pd=Ephemeris.moonDarkPath(r,ph.illum,ph.waxing);
    return `<g><circle r="${r}" fill="url(#${id||'fbMoonG'})"/><g fill="#8f8a78" opacity=".34"><circle cx="${-r*.3}" cy="${-r*.25}" r="${r*.26}"/><circle cx="${r*.22}" cy="${-r*.38}" r="${r*.17}"/><circle cx="${r*.1}" cy="${r*.28}" r="${r*.22}"/><circle cx="${-r*.42}" cy="${r*.3}" r="${r*.13}"/></g>`+
      (ph.illum<.99?`<path d="${pd.d}" fill="#05070d" fill-opacity=".9" ${pd.flip?'transform="scale(-1 1)"':''}/>`:'')+`<circle r="${r}" fill="none" stroke="#c9a35d" stroke-opacity=".6" stroke-width="${Math.max(.6,r*.06)}"/></g>`; };
})();
