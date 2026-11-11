/* Al-Zij engine — copied verbatim from beta/index.html (build 1794392194) by claude/tools/build_engine.py.
   Do not edit by hand: change beta, then run the script again. */

/* ===== AstroMath … StarField · sha256 084e443300de ===== */
class AstroMath {
  static DEGR = Math.PI/180;
  static RADD = 180/Math.PI;
  static SYNODIC = 29.530588853;

  static toRad(d){ return d*Math.PI/180; }
  static toDeg(r){ return r*180/Math.PI; }
  static normDeg(x){ x%=360; return x<0?x+360:x; }
  static sind(x){ return Math.sin(x*AstroMath.DEGR); }
  static cosd(x){ return Math.cos(x*AstroMath.DEGR); }
  static atan2d(y,x){ return Math.atan2(y,x)*AstroMath.RADD; }
  static jdOf(d){ return d.getTime()/86400000 + 2440587.5; }

  static pad(n){ return n.toString().padStart(2,'0'); }
  static minToHHMM(mins){
    const m = ((Math.round(mins) % 1440) + 1440) % 1440;
    const hh24 = Math.floor(m/60);
    const hh12 = hh24%12 || 12;
    const ampm = hh24 < 12 ? 'AM' : 'PM';
    return AstroMath.pad(hh12)+':'+AstroMath.pad(m%60)+' '+ampm;
  }
  static dayOfYear(date){
    const start = new Date(date.getFullYear(),0,0);
    return Math.floor((date - start)/86400000);
  }
  // البرج الشمسي الحالي (الاستوائي) — من خط الطول الفلكي الفعلي للشمس، مش من حدود تواريخ ثابتة
  static zodiacSignOf(date){
    const names = ['الحمل','الثور','الجوزاء','السرطان','الأسد','العذراء','الميزان','العقرب','القوس','الجدي','الدلو','الحوت'];
    return names[Math.floor(Ephemeris.sun(date).lon/30)%12];
  }
  // تقدير الانحراف المغناطيسي (الفرق بين الشمال المغناطيسي والحقيقي) — مضبوط بانحدار خطي محلي من 3 قيم حقيقية موثّقة
  // (جدة +3.58° • مكة +3.5° • الرياض +2.7° — من magnetic-declination.com وWMM) صالح داخل شبه الجزيرة العربية تقريبًا فقط؛
  // برّه النطاق ده بيرجع 0 (بدون تصحيح) بدل رقم غلط، لأن الانحراف الحقيقي مش خط مستقيم على مستوى العالم كله
  static magneticDeclination(lat, lon){
    if (lat < 12 || lat > 33 || lon < 33 || lon > 56) return 0;
    return 8.1325 + 0.008465*lat - 0.120871*lon;
  }
  static equationOfTimeMinutes(date){ return Ephemeris.sun(date).eqMin; }
  // عمر القمر مبني على الاستطالة الفعلية عن الشمس (اتساق كامل مع الهندسة الحقيقية)
  static moonAgeDays(date){ return Ephemeris.moonPhase(date).age; }
  static dayArcAngle(dayIndex){
    return -80 + dayIndex*(160/6); // retrograde: Sunday=-80°, Saturday=+80°, snaps back
  }
  static realAngle(now, periodDays, reverse){
    const dayMs = 86400000;
    const cycles = now.getTime() / (periodDays*dayMs);
    const ang = (cycles % 1) * 360;
    return reverse ? -ang : ang;
  }
  // day/night must be anchored to the viewer's actual local clock, not the raw UTC epoch —
  // otherwise "day" on the ring has no real connection to whether it's actually day right now.
  // At local noon (12:00) the sun icon (ring-local top) must align with the fixed 12 o'clock mark.
  static localDayAngle(now){
    const fraction = (now.getHours() + now.getMinutes()/60 + now.getSeconds()/3600) / 24;
    return fraction*360 - 180;
  }
  static polar(cx, cy, r, angleDeg){
    const t = angleDeg*AstroMath.DEGR;
    return [cx + r*Math.sin(t), cy - r*Math.cos(t)];
  }
  static timeToAngle(minutes){
    return ((minutes % 1440) + 1440) % 1440 / 1440 * 360 - 180;
  }
}

// ============================================================
// Ephemeris — المصدر الفلكي الموحّد (الشمس والقمر والأرض)
// معادلات Schlyter المستمرة في الزمن (بدون خطوات يومية). اتفحصت على أحداث معروفة:
// الشمس: ميل عند الاعتدالين/الانقلابين ≤ 0.005° — القمر: خط الطول ≤ 0.05° عند المحاق/البدر
// ============================================================
class Ephemeris {
  static D(d){ return AstroMath.jdOf(d) - 2451543.5; }                 // أيام منذ 1999-12-31 00:00 UT
  static obliquity(d){ return 23.4393 - 3.563E-7*Ephemeris.D(d); }    // ميل محور الأرض (درجة)
  static gmst(d){
    const jd = AstroMath.jdOf(d), T = (jd-2451545)/36525;
    return AstroMath.normDeg(280.46061837 + 360.98564736629*(jd-2451545) + 0.000387933*T*T - T*T*T/38710000);
  }
  static kepler(Mdeg, e){
    const Mr = Mdeg*AstroMath.DEGR;
    let E = Mr + e*Math.sin(Mr)*(1+e*Math.cos(Mr));
    for (let i=0;i<8;i++){ const dE = (E - e*Math.sin(E) - Mr)/(1 - e*Math.cos(E)); E -= dE; if (Math.abs(dE)<1e-10) break; }
    return E;
  }
  // الشمس: خط الطول الفلكي، الصعود المستقيم والميل (درجة)، المسافة (وحدة فلكية)، معادلة الزمن (دقيقة)
  static sun(d){
    const D = Ephemeris.D(d), k = AstroMath.DEGR, n = AstroMath.normDeg;
    const w = 282.9404 + 4.70935E-5*D, e = 0.016709 - 1.151E-9*D, M = n(356.0470 + 0.9856002585*D);
    const E = Ephemeris.kepler(M, e);
    const xv = Math.cos(E) - e, yv = Math.sqrt(1-e*e)*Math.sin(E);
    const lon = n(Math.atan2(yv,xv)*AstroMath.RADD + w), dist = Math.hypot(xv,yv);
    const eps = Ephemeris.obliquity(d)*k;
    const ra = n(Math.atan2(Math.cos(eps)*Math.sin(lon*k), Math.cos(lon*k))*AstroMath.RADD);
    const dec = Math.asin(Math.sin(eps)*Math.sin(lon*k))*AstroMath.RADD;
    let eq = n(w + M - 0.0057183 - ra); if (eq > 180) eq -= 360;      // (خط الطول المتوسط − الصعود المستقيم)
    return { lon, ra, dec, dist, eqMin: eq*4 };
  }
  // القمر: خط الطول/العرض الفلكي، الصعود المستقيم والميل (درجة)، المسافة (نصف قطر أرضي) — مع التصحيحات الدورية الصحيحة
  static moon(d){
    const D = Ephemeris.D(d), k = AstroMath.DEGR, n = AstroMath.normDeg;
    const N = n(125.1228 - 0.0529538083*D), inc = 5.1454, w = n(318.0634 + 0.1643573223*D);
    const a = 60.2666, e = 0.0549, M = n(115.3654 + 13.0649929509*D);
    const E = Ephemeris.kepler(M, e);
    const xv = a*(Math.cos(E)-e), yv = a*Math.sqrt(1-e*e)*Math.sin(E);
    const v = Math.atan2(yv,xv), r0 = Math.hypot(xv,yv), vw = v + w*k;
    const xh = r0*(Math.cos(N*k)*Math.cos(vw) - Math.sin(N*k)*Math.sin(vw)*Math.cos(inc*k));
    const yh = r0*(Math.sin(N*k)*Math.cos(vw) + Math.cos(N*k)*Math.sin(vw)*Math.cos(inc*k));
    const zh = r0*Math.sin(vw)*Math.sin(inc*k);
    let lon = n(Math.atan2(yh,xh)/k), lat = Math.atan2(zh, Math.hypot(xh,yh))/k, dist = r0;
    const Ms = n(356.0470 + 0.9856002585*D), ws = 282.9404 + 4.70935E-5*D;
    const Ls = n(Ms + ws), Lm = n(M + w + N), Dm = Lm - Ls, F = Lm - N;
    const s = x => Math.sin(x*k), c = x => Math.cos(x*k);
    lon = n(lon - 1.274*s(M-2*Dm) + 0.658*s(2*Dm) - 0.186*s(Ms) - 0.059*s(2*M-2*Dm) - 0.057*s(M-2*Dm+Ms)
              + 0.053*s(M+2*Dm) + 0.046*s(2*Dm-Ms) + 0.041*s(M-Ms) - 0.035*s(Dm) - 0.031*s(M+Ms)
              - 0.015*s(2*F-2*Dm) + 0.011*s(M-4*Dm));
    lat += -0.173*s(F-2*Dm) - 0.055*s(M-F-2*Dm) - 0.046*s(M+F-2*Dm) + 0.033*s(F+2*Dm) + 0.017*s(2*M+F);
    dist += -0.58*c(M-2*Dm) - 0.46*c(2*Dm);
    const eps = Ephemeris.obliquity(d)*k;
    const x = Math.cos(lon*k)*Math.cos(lat*k), y = Math.sin(lon*k)*Math.cos(lat*k), z = Math.sin(lat*k);
    const ye = y*Math.cos(eps) - z*Math.sin(eps), ze = y*Math.sin(eps) + z*Math.cos(eps);
    return { lon, lat, dist, ra: n(Math.atan2(ye,x)/k), dec: Math.atan2(ze, Math.hypot(x,ye))/k };
  }
  // ارتفاع وسمت (هندسي، من مركز الأرض) لجرم معروف الصعود المستقيم والميل — السمت من الشمال باتجاه الشرق
  static altAz(raDeg, decDeg, d, latDeg, lonDeg){
    const k = AstroMath.DEGR;
    const H = (Ephemeris.gmst(d) + lonDeg - raDeg)*k, ph = latDeg*k, de = decDeg*k;
    const alt = Math.asin(Math.sin(ph)*Math.sin(de) + Math.cos(ph)*Math.cos(de)*Math.cos(H))*AstroMath.RADD;
    const az = AstroMath.normDeg(Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(ph) - Math.tan(de)*Math.cos(ph))*AstroMath.RADD + 180);
    return { alt, az };
  }
  static normLon(x){ x = AstroMath.normDeg(x + 180) - 180; return x; }
  // الأيانامسا (لاهيري تقريبًا): الفرق بين الفلك النجمي (اللي بتتحدد عليه المنازل بالنجوم) والفلك الاستوائي، بيزيد ~50″ في السنة
  static ayanamsa(d){ const y = 2000 + (AstroMath.jdOf(d) - 2451545)/365.25; return 23.853 + 0.0139697*(y - 2000); }
  // النقطة اللي الجرم فوق الرأس بالظبط عندها على الأرض (خط العرض = الميل، خط الطول = الصعود المستقيم − الزمن النجمي)
  static subSolar(d){ const s = Ephemeris.sun(d); return { lat: s.dec, lon: Ephemeris.normLon(s.ra - Ephemeris.gmst(d)) }; }
  static subLunar(d){ const m = Ephemeris.moon(d); return { lat: m.dec, lon: Ephemeris.normLon(m.ra - Ephemeris.gmst(d)) }; }
  static PHASE_NAMES = ['محاق','هلال متزايد','تربيع أول','أحدب متزايد','بدر','أحدب متناقص','تربيع أخير','هلال متناقص'];
  // طور القمر من الهندسة الفعلية (الاستطالة عن الشمس)، مش من عمر متوسط
  static moonPhase(d){
    const s = Ephemeris.sun(d), m = Ephemeris.moon(d), k = AstroMath.DEGR;
    const elong = AstroMath.normDeg(m.lon - s.lon);
    const psi = Math.acos(Math.max(-1, Math.min(1, Math.cos(m.lat*k)*Math.cos(elong*k))));   // الزاوية الفعلية بين الشمس والقمر في السماء
    const R = s.dist*23454.78;                                                                // بعد الشمس بنصف القطر الأرضي
    const inc = Math.atan2(R*Math.sin(psi), m.dist - R*Math.cos(psi));                        // زاوية الطور (شمس-قمر-أرض)
    const illum = (1 + Math.cos(inc))/2;
    const idx = Math.round(elong/45)%8;
    return { illum, elong, psi: psi*AstroMath.RADD, waxing: elong < 180, age: elong/360*AstroMath.SYNODIC, idx, name: Ephemeris.PHASE_NAMES[idx] };
  }
  // مسار الجزء المظلم من قرص القمر (المركز 0,0 ونصف القطر R): نصف دايرة الحافة + نصف قطع ناقص حقيقي لخط الفصل
  static moonDarkPath(R, illum, waxing){
    const xt = R*(1 - 2*illum), rx = Math.abs(xt);
    return { d: 'M 0 '+(-R)+' A '+R+' '+R+' 0 0 0 0 '+R+' A '+rx.toFixed(3)+' '+R+' 0 0 '+(xt>0?0:1)+' 0 '+(-R)+' Z', flip: !waxing };
  }
  // أقرب لحظة جاية فيها (خط طول القمر − خط طول الشمس) = target (0 اقتران/محاق، 180 استقبال/بدر)
  static nextElongation(d, target){
    const f = t => { let x = AstroMath.normDeg(Ephemeris.moon(t).lon - Ephemeris.sun(t).lon - target); return x > 180 ? x - 360 : x; };
    let t0 = d.getTime(), f0 = f(new Date(t0)); const step = 3*3600000;
    for (let i=0;i<270;i++){
      const t1 = t0 + step, f1 = f(new Date(t1));
      if (f0 < 0 && f1 >= 0){ let a=t0, b=t1; for (let j=0;j<32;j++){ const m=(a+b)/2; if (f(new Date(m))<0) a=m; else b=m; } return new Date((a+b)/2); }
      t0 = t1; f0 = f1;
    }
    return null;
  }
  // الاعتدال/الانقلاب الجاي (عبور خط طول الشمس مضاعفات 90°)
  static nextSeasonEvent(d){
    const names = ['اعتدال الربيع (مارس)','انقلاب الصيف (يونيو)','اعتدال الخريف (سبتمبر)','انقلاب الشتاء (ديسمبر)'];
    const idx = (Math.floor(Ephemeris.sun(d).lon/90)+1)%4, target = idx*90;
    const f = t => { let x = AstroMath.normDeg(Ephemeris.sun(t).lon - target); return x > 180 ? x - 360 : x; };
    let t0 = d.getTime(), f0 = f(new Date(t0)); const step = 6*3600000;
    for (let i=0;i<400;i++){
      const t1 = t0 + step, f1 = f(new Date(t1));
      if (f0 < 0 && f1 >= 0){ let a=t0, b=t1; for (let j=0;j<32;j++){ const m=(a+b)/2; if (f(new Date(m))<0) a=m; else b=m; } return { name: names[idx], date: new Date((a+b)/2) }; }
      t0 = t1; f0 = f1;
    }
    return null;
  }
}

// تطبيق شكل الطور الحقيقي على أي أيقونة قمر (مسار المنطقة المظلمة، مش دايرة مزاحة)
function applyMoonShadow(id, R, ph, cx, cy){
  const el = document.getElementById(id); if (!el) return;
  const p = Ephemeris.moonDarkPath(R, ph.illum, ph.waxing);
  el.setAttribute('d', p.d);
  el.setAttribute('transform', 'translate('+(cx||0)+' '+(cy||0)+')'+(p.flip?' scale(-1 1)':''));
}

// ============================================================
// HijriCalendar — التقويم الهجري وتحويله من الميلادي
// ============================================================
class HijriCalendar {
  constructor(){
    this.arDays = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
    this.hijriMonths = ["محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
    this.offset = 0;
    this._fmt = null; this._useIntl = null; this._cache = new Map();
  }
  adjust(val){ this.offset += val; this._cache.clear(); }
  // بيدور على أقرب تاريخ هجري جاي (شهر/يوم معينين) بداية من النهاردة، وبيرجع عدد الأيام المتبقية
  daysUntilHijri(targetMonth, targetDay){
    const today = new Date();
    for (let i=0; i<380; i++){
      const d = new Date(today.getTime() + i*86400000);
      const h = this.fromGregorian(d);
      if (h.month === targetMonth && h.day === targetDay) return i;
    }
    return null;
  }
  formatDaysAsMonthsDays(totalDays){
    if (totalDays === null) return '—';
    const months = Math.floor(totalDays/29.5);
    const days = Math.round(totalDays - months*29.5);
    if (months <= 0) return totalDays+' يوم';
    return months+' شهر و'+days+' يوم ('+totalDays+' يوم إجمالاً)';
  }
  // التاريخ الهجري بتقويم أم القرى الرسمي (من Intl في المتصفح) — لو المتصفح ما دعمش، نرجع للخوارزمية الحسابية القديمة
  _initIntl(){
    if (this._useIntl !== null) return;
    try{
      this._fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day:'numeric', month:'numeric', year:'numeric' });
      const t = this._intlParts(new Date(Date.UTC(2023,2,23,10)));   // 1 رمضان 1444 = 23 مارس 2023 (رسمي) — نتأكد إن المتصفح فعلًا بيطبّق أم القرى
      this._useIntl = !!(t && t.year===1444 && t.month===9 && t.day===1);
    }catch(e){ this._useIntl = false; }
  }
  _intlParts(date){
    const p = this._fmt.formatToParts(date), g = t => +p.find(x=>x.type===t).value;
    return { day: g('day'), month: g('month'), year: g('year') };
  }
  fromGregorian(inputDate){
    const date = new Date(inputDate);
    date.setDate(date.getDate() + this.offset);
    this._initIntl();
    const key = date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate();
    const hit = this._cache.get(key);
    if (hit) return { day: hit.day, month: hit.month, year: hit.year };
    const r = this._useIntl ? this._intlParts(date) : this._arith(date);
    if (this._cache.size > 900) this._cache.clear();
    this._cache.set(key, r);
    return { day: r.day, month: r.month, year: r.year };
  }
  _arith(date){
    const day = date.getDate(), month = date.getMonth()+1, year = date.getFullYear();
    let jd = Math.floor((1461*(year + 4800 + Math.floor((month-14)/12)))/4) +
             Math.floor((367*(month-2-12*Math.floor((month-14)/12)))/12) -
             Math.floor((3*Math.floor((year+4900+Math.floor((month-14)/12))/100))/4) +
             day - 32075;
    let l = jd - 1948440 + 10632;
    const n = Math.floor((l-1)/10631);
    l = l - 10631*n + 354;
    const j = (Math.floor((10985-l)/5316))*(Math.floor((50*l)/17719)) + (Math.floor(l/5670))*(Math.floor((43*l)/15238));
    l = l - (Math.floor((30-j)/15))*(Math.floor((17719*j)/50)) - (Math.floor(j/16))*(Math.floor((15238*j)/43)) + 29;
    const hMonth = Math.floor((24*l)/709);
    const hDay = l - Math.floor((709*hMonth)/24);
    const hYear = 30*n + j - 30;
    return {day: hDay, month: hMonth, year: hYear};
  }
}

// ============================================================
// Observer — موقع المراقب، والحسابات الشمسية/مواقيت الصلاة/القبلة المبنية عليه
// ============================================================
// ===== طرق الحساب، وكل بلد بيستعمل أنهي واحدة (نفس قيم Aladhan) =====
// ===== Official Umm al-Qura tables (data/uq, from the official KACST service behind ummulqura.org.sa) =====
// Inside Saudi Arabia the prayer times come straight from the official table of the nearest official city (within 40 km), the same minutes the
// Umm al-Qura calendar prints; elsewhere, or for a year not in the tables, the astronomical calculation is used. Files are small (one per city) and kept for offline use.
window.zijUQ = (function(){
  const KEY='zijUQcity', MAXKM=40; let idx=null, cur=null, busy=false, lastKey='', want=null;
  try{ const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s&&s.y&&s.id) cur=s; }catch(e){}
  const rad=Math.PI/180, km=(a,b,c,d)=>{ const x=Math.sin((c-a)*rad/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin((d-b)*rad/2)**2; return 12742*Math.asin(Math.sqrt(x)); };
  async function ensure(lat,lon){
    const k=lat.toFixed(2)+','+lon.toFixed(2); if(busy||k===lastKey) return; busy=true; lastKey=k;
    try{
      if(!idx) idx=await (await fetch('data/uq/index.json')).json();
      let best=null,bd=1e9; for(const c of idx.cities){ const d=km(lat,lon,c[1],c[2]); if(d<bd){bd=d;best=c;} }
      want = (best && bd<=MAXKM) ? best[0] : 0;
      if(want && !(cur&&cur.id===want)){
        const j=await (await fetch('data/uq/c/'+best[0]+'.json')).json();
        if(j&&j.y){ cur=j; try{ localStorage.setItem(KEY,JSON.stringify(j)); }catch(e){} }
      }
    }catch(e){ lastKey=''; }
    busy=false;
  }
  // official minutes [fajr, sunrise, dhuhr, asr, maghrib, isha] for the local date of d, or null
  function lookup(lat,lon,d,tz){
    ensure(lat,lon);
    if(!cur || km(lat,lon,cur.lat,cur.lon)>MAXKM || (want!==null && want!==cur.id)) return null;   // only the nearest official city's table
    const ld=new Date(d.getTime()+tz*3600000), y=ld.getUTCFullYear(), s=cur.y[y]; if(!s) return null;
    const o=Math.round((Date.UTC(y,ld.getUTCMonth(),ld.getUTCDate())-Date.UTC(y,0,1))/864e5)*18; if(o<0||o+18>s.length) return null;
    const a=[]; for(let i=0;i<6;i++) a.push(parseInt(s.substr(o+i*3,3),16)); return a;
  }
  return { ensure, lookup, city:()=>cur, ready:()=>!busy && want!==null && (!want || (cur&&cur.id===want)) };
})();
const ZIJ_METHODS = {
  UMM_AL_QURA:{fajr:18.5, ishaMin:90, ramadanIsha:120, aladhan:4, uq:true}, // uq: show minutes the way the official Umm al-Qura calendar prints them (see realPrayerTimes)
  EGYPT:{fajr:19.5, isha:17.5, aladhan:5}, MWL:{fajr:18, isha:17, aladhan:3}, ISNA:{fajr:15, isha:15, aladhan:2},
  KARACHI:{fajr:18, isha:18, asr:2, aladhan:1}, DUBAI:{fajr:18.2, isha:18.2, aladhan:16}, KUWAIT:{fajr:18, isha:17.5, aladhan:9},
  QATAR:{fajr:18, ishaMin:90, aladhan:10}, RUSSIA:{fajr:16, isha:15, aladhan:14}, SINGAPORE:{fajr:20, isha:18, aladhan:11},
  MOROCCO:{fajr:19, isha:17, aladhan:21}, TUNISIA:{fajr:18, isha:18, aladhan:18},
  // Diyanet (Turkey): 18°/17° plus its fixed safety minutes (temkin) on sunrise, Dhuhr, Asr and Maghrib
  TURKEY:{fajr:18, isha:17, adj:{sunrise:-7, dhuhr:5, asr:4, maghrib:7}, aladhan:13},
  // Jordan, Ministry of Awqaf: 18°/18°, Maghrib five minutes after sunset, sunrise shown five minutes early (official table, Oct 2026)
  JORDAN:{fajr:18, isha:18, adj:{sunrise:-5, maghrib:5}, aladhan:23},
  // France, UOIF: 12°/12°
  FRANCE:{fajr:12, isha:12, aladhan:12}
};
const ZIJ_COUNTRY_METHOD = { SA:'UMM_AL_QURA', EG:'EGYPT', SD:'EGYPT', LY:'EGYPT', SY:'EGYPT', IQ:'EGYPT', LB:'EGYPT', PS:'EGYPT', JO:'JORDAN', TR:'TURKEY', FR:'FRANCE',
  AE:'DUBAI', KW:'KUWAIT', QA:'QATAR', PK:'KARACHI', IN:'KARACHI', BD:'KARACHI', AF:'KARACHI', US:'ISNA', CA:'ISNA', RU:'RUSSIA',
  SG:'SINGAPORE', MY:'SINGAPORE', ID:'SINGAPORE', BN:'SINGAPORE', MA:'MOROCCO', TN:'TUNISIA' };
// with no network the phone's time zone tells the country
const ZIJ_TZ_COUNTRY = { 'Asia/Riyadh':'SA','Africa/Cairo':'EG','Africa/Khartoum':'SD','Africa/Tripoli':'LY','Asia/Damascus':'SY','Asia/Baghdad':'IQ','Asia/Beirut':'LB',
  'Asia/Gaza':'PS','Asia/Hebron':'PS','Asia/Amman':'JO','Europe/Istanbul':'TR','Asia/Istanbul':'TR','Europe/Paris':'FR','Asia/Dubai':'AE','Asia/Kuwait':'KW','Asia/Qatar':'QA','Asia/Karachi':'PK','Asia/Kolkata':'IN','Asia/Calcutta':'IN',
  'Asia/Dhaka':'BD','Asia/Kabul':'AF','Asia/Singapore':'SG','Asia/Kuala_Lumpur':'MY','Asia/Jakarta':'ID','Asia/Makassar':'ID','Asia/Brunei':'BN','Africa/Casablanca':'MA','Africa/Tunis':'TN',
  'Europe/Moscow':'RU','Europe/Kazan':'RU','Europe/Samara':'RU','Asia/Yekaterinburg':'RU','Asia/Omsk':'RU','Asia/Novosibirsk':'RU','Asia/Krasnoyarsk':'RU','Asia/Irkutsk':'RU','Asia/Yakutsk':'RU','Asia/Vladivostok':'RU','Asia/Magadan':'RU','Europe/Volgograd':'RU' };
function zijCountry(){
  try{ const c=localStorage.getItem('zijCountry'); if (c) return c.toUpperCase(); }catch(e){}
  try{ const z=Intl.DateTimeFormat().resolvedOptions().timeZone||''; if (ZIJ_TZ_COUNTRY[z]) return ZIJ_TZ_COUNTRY[z]; if (/^America\/(?!Argentina|Santiago|Sao_Paulo|Bogota|Lima|Caracas|Mexico|Punta)/.test(z)) return 'US'; }catch(e){}
  return '';
}
// clock offset (hours) of any IANA zone on a given date — follows that country's summer time
function zijZoneOffset(zone, d){
  try{ const f=(zijZoneOffset._f=zijZoneOffset._f||{})[zone]||(zijZoneOffset._f[zone]=new Intl.DateTimeFormat('en-US',{timeZone:zone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}));
    const P={};f.formatToParts(d).forEach(x=>P[x.type]=x.value);
    return Math.round((Date.UTC(+P.year,+P.month-1,+P.day,+P.hour%24,+P.minute,+P.second)-Math.floor(d.getTime()/1000)*1000)/36e5*4)/4; }catch(e){ return 0; }
}
function zijHighLatRule(){ try{ const r=localStorage.getItem('zijHighLat'); if (r==='seventh'||r==='middle') return r; }catch(e){} return 'angle'; }
function zijAutoMethod(){ return ZIJ_COUNTRY_METHOD[zijCountry()] || 'MWL'; }

class Observer {
  constructor(){
    this.lat = 21.5433; this.lon = 39.1728; this.tz = 3;
    this.name = "جدة (موقع مثبّت)"; // جدة افتراضيًا ومثبّتة: الـGPS في المنطقة معرّض لتشويش/تضليل موثّق، فمنعتمدش عليه تلقائيًا
    this.calcMethod = 'AUTO';   // تلقائي حسب البلد (السعودية ← أم القرى)؛ لو المستخدم اختار بنفسه بيتخزن محليًا
    try{ const m = localStorage.getItem('zijCalcMethod'); if (m && ZIJ_METHODS[m] || m==='AUTO') this.calcMethod = m; }catch(e){}
    this.KAABA_LAT = 21.4225; this.KAABA_LON = 39.8262;
    this.lastGeocodedKey = null;
    this.lastWeatherKey = null;
  }
  // time zone: when the place uses the phone's own clock, the offset follows summer time for EACH date (Toronto, Oslo, London, Santiago…)
  set(lat, lon, tz, name){ this.lat=lat; this.lon=lon; this.tz=tz; this.zone = (tz === -(new Date().getTimezoneOffset()/60)) ? 'device' : null; this.name=name; }
  get tz(){ return this.tzAt(new Date()); }
  set tz(v){ this._tz=v; this.zone=null; }
  tzAt(d){ return this.zone==='device' ? -(new Date(d.getTime()).getTimezoneOffset()/60) : this.zone ? zijZoneOffset(this.zone, d) : this._tz; }
  // another city's own clock (world-times window) — never the user's location
  setZone(lat, lon, zone, name){ this.lat=lat; this.lon=lon; this._tz=zijZoneOffset(zone,new Date()); this.zone=zone; this.name=name; }

  computeQiblaBearing(lat, lon){
    const phi1 = AstroMath.toRad(lat), phi2 = AstroMath.toRad(this.KAABA_LAT);
    const dLon = AstroMath.toRad(this.KAABA_LON - lon);
    const y = Math.sin(dLon)*Math.cos(phi2);
    const x = Math.cos(phi1)*Math.sin(phi2) - Math.sin(phi1)*Math.cos(phi2)*Math.cos(dLon);
    return (AstroMath.toDeg(Math.atan2(y,x)) + 360) % 360;
  }
  kaabaDistanceKm(lat, lon){
    const R = 6371;
    const dLat = AstroMath.toRad(this.KAABA_LAT - lat), dLon = AstroMath.toRad(this.KAABA_LON - lon);
    const a = Math.sin(dLat/2)**2 + Math.cos(AstroMath.toRad(lat))*Math.cos(AstroMath.toRad(this.KAABA_LAT))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  updateCityName(lat, lon){
    const el = document.getElementById('dataCityName');
    if (!el) return;
    const key = lat.toFixed(2)+','+lon.toFixed(2);
    if (key === this.lastGeocodedKey) return;
    this.lastGeocodedKey = key;
    const prevLabel = el.textContent;
    el.textContent = 'جارٍ التحديد...';
    fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=ar')
      .then(r => r.json())
      .then(d => {
        const name = d.city || d.locality || d.principalSubdivision || 'غير معروف';
        el.textContent = name;
      })
      .catch(() => { el.textContent = (prevLabel && prevLabel !== '—' && prevLabel !== 'جارٍ التحديد...') ? prevLabel : lat.toFixed(2)+'°, '+lon.toFixed(2)+'°'; });
  }
  updateKaabaDistanceBox(){
    const txt = Math.round(this.kaabaDistanceKm(this.lat, this.lon)).toLocaleString('ar-EG')+' كم';
    const distEl = document.getElementById('dataKaabaDist');
    if (distEl) distEl.textContent = txt;
    const distEl2 = document.getElementById('dataKaabaDist2');
    if (distEl2) distEl2.textContent = txt;
  }
  // الطقس والارتفاع — من Open-Meteo (مجانية، بدون مفتاح API)، بتتحدث بس لما الموقع يتغير فعليًا
  updateWeatherAndElevation(lat, lon){
    const key = lat.toFixed(2)+','+lon.toFixed(2);
    if (key === this.lastWeatherKey) return;
    this.lastWeatherKey = key;
    const tempEl = document.getElementById('dataTemp');
    const feelsEl = document.getElementById('dataFeelsLike');
    const humEl = document.getElementById('dataHumidity');
    const elevEl = document.getElementById('dataElevation');
    const windEl = document.getElementById('dataWind');
    const uvEl = document.getElementById('dataUV');
    const cloudEl = document.getElementById('dataCloud');
    const pressEl = document.getElementById('dataPressure');
    const condEl = document.getElementById('dataWeatherCondition');
    const visEl = document.getElementById('dataVisibility');
    const aqiEl = document.getElementById('dataAQI');
    [tempEl,feelsEl,humEl,elevEl,windEl,uvEl,cloudEl,pressEl,condEl,visEl,aqiEl].forEach(el=>{ if(el) el.textContent = 'جارٍ الجلب...'; });
    fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,cloud_cover,surface_pressure,weather_code&hourly=uv_index,visibility&timezone=auto')
      .then(r => r.json())
      .then(d => {
        const c = d.current.temperature_2m, f = (c*9/5+32);
        if (tempEl) tempEl.innerHTML = c.toFixed(1)+'°C&nbsp; <span style="color:var(--brass-dark);">|</span> &nbsp;'+f.toFixed(1)+'°F';
        if (feelsEl) feelsEl.textContent = d.current.apparent_temperature.toFixed(1)+'° C';
        if (humEl) humEl.textContent = Math.round(d.current.relative_humidity_2m)+'٪';
        if (cloudEl) cloudEl.textContent = Math.round(d.current.cloud_cover)+'٪';
        if (pressEl) pressEl.textContent = Math.round(d.current.surface_pressure)+' hPa';
        if (condEl) condEl.textContent = this.weatherCodeToText(d.current.weather_code);
        const dirNames = ['شمال','شمال شرق','شرق','جنوب شرق','جنوب','جنوب غرب','غرب','شمال غرب'];
        const dirIdx = Math.round(d.current.wind_direction_10m/45)%8;
        if (windEl) windEl.textContent = Math.round(d.current.wind_speed_10m)+' كم/س • '+dirNames[dirIdx];
        if (d.hourly){
          const times = d.hourly.time.map(t=>new Date(t).getTime());
          const nowMs = Date.now();
          let idx=0, best=Infinity;
          times.forEach((t,i)=>{ const diff=Math.abs(t-nowMs); if(diff<best){best=diff; idx=i;} });
          if (uvEl && d.hourly.uv_index) uvEl.textContent = d.hourly.uv_index[idx].toFixed(1);
          if (visEl && d.hourly.visibility) visEl.textContent = (d.hourly.visibility[idx]/1000).toFixed(1)+' كم';
        }
      })
      .catch(() => { [tempEl,feelsEl,humEl,windEl,uvEl,cloudEl,pressEl,condEl,visEl].forEach(el=>{ if(el) el.textContent = 'تعذر الجلب'; }); });
    fetch('https://api.open-meteo.com/v1/elevation?latitude='+lat+'&longitude='+lon)
      .then(r => r.json())
      .then(d => { if (elevEl) elevEl.textContent = Math.round(d.elevation[0]).toLocaleString('ar-EG')+' م'; })
      .catch(() => { if (elevEl) elevEl.textContent = 'تعذر الجلب'; });
    fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude='+lat+'&longitude='+lon+'&current=us_aqi')
      .then(r => r.json())
      .then(d => {
        const aqi = d.current.us_aqi;
        let label = 'جيدة';
        if (aqi>150) label='خطرة'; else if (aqi>100) label='غير صحية لفئات حساسة'; else if (aqi>50) label='متوسطة';
        if (aqiEl) aqiEl.textContent = aqi+' ('+label+')';
      })
      .catch(() => { if (aqiEl) aqiEl.textContent = 'تعذر الجلب'; });
  }
  // ترجمة رمز الطقس القياسي WMO لنص عربي واضح + رمز — نفس المعيار العالمي المستخدم في كل تطبيقات الطقس
  weatherCodeToText(code){
    const map = {
      0: '☀️ صافي', 1: '🌤️ صافي غالبًا', 2: '⛅ غائم جزئيًا', 3: '☁️ غائم كليًا',
      45: '🌫️ ضباب', 48: '🌫️ ضباب متجمد',
      51: '🌦️ رذاذ خفيف', 53: '🌦️ رذاذ', 55: '🌦️ رذاذ كثيف',
      61: '🌧️ مطر خفيف', 63: '🌧️ مطر', 65: '🌧️ مطر غزير',
      71: '❄️ ثلج خفيف', 73: '❄️ ثلج', 75: '❄️ ثلج كثيف',
      80: '🌦️ زخات مطر خفيفة', 81: '🌧️ زخات مطر', 82: '🌧️ زخات مطر غزيرة',
      95: '⛈️ عاصفة رعدية', 96: '⛈️ عاصفة رعدية مع برد', 99: '⛈️ عاصفة رعدية شديدة'
    };
    return map[code] || '—';
  }
  // طول اليوم = الفرق بين الشروق والغروب — محسوب محليًا من نفس مصدر الحقيقة الموحّد، بدون إنترنت
  dayLengthText(d){
    const t = this.sunTimes(d);
    let mins = t.sunset - t.sunrise;
    if (mins < 0) mins += 1440;
    const h = Math.floor(mins/60), m = Math.round(mins%60);
    return h+' س '+m+' د';
  }

  gmst(d){ return Ephemeris.gmst(d); }
  localSidereal(d){ return AstroMath.normDeg(this.gmst(d) + this.lon); }
  raDecToAltAz(raH, dec, d){
    let H = AstroMath.normDeg(this.localSidereal(d) - raH*15); if (H>180) H -= 360;
    const sinAlt = AstroMath.sind(dec)*AstroMath.sind(this.lat) + AstroMath.cosd(dec)*AstroMath.cosd(this.lat)*AstroMath.cosd(H);
    const alt = Math.asin(Math.max(-1,Math.min(1,sinAlt)))*AstroMath.RADD;
    const az = AstroMath.normDeg(AstroMath.atan2d(AstroMath.sind(H), AstroMath.cosd(H)*AstroMath.sind(this.lat) - Math.tan(dec*AstroMath.DEGR)*AstroMath.cosd(this.lat)) + 180);
    return { alt, az };
  }
  // الشمس لحظيًا (مستمرة): ميل (راديان) ومعادلة الزمن (دقيقة) — من Ephemeris الموحّد
  solarDeclinationEq(d){ const s = Ephemeris.sun(d); return { eq: s.eqMin, dec: s.dec*AstroMath.DEGR }; }
  // الشمس عند دقيقة معينة من اليوم المحلي لتاريخ d — كل حدث بيتحسب بميل الشمس ومعادلة الزمن وقت حدوثه هو (زي المكتبات المرجعية)
  _sunAtLocalMinute(d, minute){
    const ld = new Date(d.getTime() + this.tzAt(d)*3600000);
    const utcMs = Date.UTC(ld.getUTCFullYear(), ld.getUTCMonth(), ld.getUTCDate()) + (minute - 60*this.tzAt(d))*60000;
    return this.solarDeclinationEq(new Date(utcMs));
  }
  _dayKey(d, tag){
    const ld = new Date(d.getTime() + this.tzAt(d)*3600000);
    return ld.getUTCFullYear()+'-'+ld.getUTCMonth()+'-'+ld.getUTCDate()+'|'+this.lat.toFixed(4)+'|'+this.lon.toFixed(4)+'|'+this.tzAt(d)+'|'+tag;
  }
  _memo(key, fn){
    if (!this._memoMap) this._memoMap = new Map();
    if (this._memoMap.has(key)) return this._memoMap.get(key);
    const v = fn(); if (this._memoMap.size > 300) this._memoMap.clear(); this._memoMap.set(key, v); return v;
  }
  _noonMin(d){
    return this._memo(this._dayKey(d,'noon'), ()=>{
      let noon = 720 - 4*this.lon + 60*this.tzAt(d) - this._sunAtLocalMinute(d, 720).eq;
      return 720 - 4*this.lon + 60*this.tzAt(d) - this._sunAtLocalMinute(d, noon).eq;
    });
  }
  // وقت الحدث (دقيقة محلية) عند ارتفاع للشمس = altFn(ميل الشمس) — sign=-1 قبل الظهر، +1 بعده — بتكرار على وقت الحدث نفسه
  _eventMin(d, tag, altFn, sign){
    return this._memo(this._dayKey(d, tag+'|'+sign), ()=>{
      const noon = this._noonMin(d);
      let t = noon + sign*360;
      for (let i=0;i<5;i++){
        const s = this._sunAtLocalMinute(d, t);
        const alt = altFn(s.dec);
        let cosH = (AstroMath.sind(alt) - AstroMath.sind(this.lat)*Math.sin(s.dec)) / (AstroMath.cosd(this.lat)*Math.cos(s.dec));
        cosH = Math.max(-1, Math.min(1, cosH));
        t = (720 - 4*this.lon + 60*this.tzAt(d) - s.eq) + sign*4*Math.acos(cosH)*AstroMath.RADD;
      }
      return t;
    });
  }
  sunTimes(d){
    const ALT = -0.833; // الشروق/الغروب القياسي: انكسار الغلاف الجوي + نصف قطر القرص
    return { sunrise: this._eventMin(d,'sr',()=>ALT,-1), sunset: this._eventMin(d,'ss',()=>ALT,+1), noon: this._noonMin(d) };
  }
  // ارتفاع وسمت الشمس اللحظيين من الإحداثيات الحقيقية (مش من توقيت اليوم) — مصدر واحد للصلاة والظل والحلقات
  sunAltAzNow(d){ const s = Ephemeris.sun(d); return Ephemeris.altAz(s.ra, s.dec, d, this.lat, this.lon); }
  sunAltitudeNow(d){ return this.sunAltAzNow(d).alt; }
  sunAzimuthNow(d){ return this.sunAltAzNow(d).az; }
  // اتجاه الظل المتوقع = عكس اتجاه الشمس تمامًا (180°) — تحقق فيزيائي حقيقي بدون إنترنت
  shadowDirectionNow(d){ return AstroMath.normDeg(this.sunAzimuthNow(d) + 180); }
  // أوقات الشفق المدني (-6°) والفلكي (-18°)
  twilightTimes(d){
    return {
      civilDawn: this._eventMin(d,'cv',()=>-6,-1),  civilDusk: this._eventMin(d,'cv',()=>-6,+1),
      astroDawn: this._eventMin(d,'as',()=>-18,-1), astroDusk: this._eventMin(d,'as',()=>-18,+1)
    };
  }
  // event time when the sun reaches a given altitude, or NaN when it never does that day (white nights / polar day & night)
  _eventMinX(d, tag, altFn, sign){
    return this._memo(this._dayKey(d, 'x'+tag+'|'+sign), ()=>{
      const noon = this._noonMin(d);
      let t = noon + sign*360, cosH = 0;
      for (let i=0;i<6;i++){
        const s = this._sunAtLocalMinute(d, t);
        cosH = (AstroMath.sind(altFn(s.dec)) - AstroMath.sind(this.lat)*Math.sin(s.dec)) / (AstroMath.cosd(this.lat)*Math.cos(s.dec));
        if (cosH > 1 || cosH < -1) return NaN;
        t = (720 - 4*this.lon + 60*this.tzAt(d) - s.eq) + sign*4*Math.acos(cosH)*AstroMath.RADD;
      }
      return t;
    });
  }
  // which calculation applies here: the user's own choice, or the one the country uses
  activeMethod(){ return (this.calcMethod && this.calcMethod!=='AUTO') ? this.calcMethod : zijAutoMethod(); }
  realPrayerTimes(d, hDate){
    const _off = (()=>{ try{ return JSON.parse(localStorage.getItem('zijAdhanOffsets')||'{}'); }catch(e){ return {}; } })();
    const M = ZIJ_METHODS[this.activeMethod()] || ZIJ_METHODS.MWL;
    const ishaMin = M.ishaMin ? ((hDate && hDate.month===9 && M.ramadanIsha) ? M.ramadanIsha : M.ishaMin) : 0;
    let lat0 = this.lat, polar = false;
    // the sun neither rises nor sets today → reckon by the nearest latitude where day and night are distinct (65°)
    const _asrPick = (()=>{ try{ return localStorage.getItem('zijAsr')||''; }catch(e){ return ''; } })();
    const k = _asrPick==='hanafi' ? 2 : _asrPick==='shafi' ? 1 : (M.asr||1);  // 1 = shadow equals the object (majority), 2 = twice (Hanafi)
    const asrAt = ()=>this._eventMinX(d,'asr'+k,dec=>Math.atan(1/(k+Math.abs(Math.tan(this.lat*AstroMath.DEGR - dec))))*AstroMath.RADD,+1);
    let sr = this._eventMinX(d,'sr',()=>-0.833,-1), ss = this._eventMinX(d,'ss',()=>-0.833,+1), asr = asrAt();
    // the sun doesn't rise, doesn't set, or never gets high enough for Asr → the whole day is reckoned at the nearest latitude with a real day and night
    const noAsr = a => isNaN(a) || a - this._noonMin(d) < 5;   // a shadow that only reaches Asr at noon itself is no Asr
    if (isNaN(sr) || isNaN(ss) || noAsr(asr)){ polar = true; this.lat = Math.sign(lat0||1)*65; sr = this._eventMinX(d,'sr',()=>-0.833,-1); ss = this._eventMinX(d,'ss',()=>-0.833,+1); asr = asrAt(); }
    try{
      const noon = this._noonMin(d);
      let fajr = this._eventMinX(d,'fj'+M.fajr,()=>-M.fajr,-1);
      let isha = ishaMin ? ss + ishaMin : this._eventMinX(d,'is'+M.isha,()=>-M.isha,+1);
      // twilight that never ends (or ends unreasonably late): angle-based share of the night — same rule Aladhan / PrayTimes use
      const night = (sr + 1440) - ss, est = {};
      const rule = zijHighLatRule();   // angle (default, like Aladhan) · seventh · middle
      const share = ang => rule==='seventh' ? night/7 : rule==='middle' ? night/2 : ang/60*night;
      const fp = share(M.fajr);
      if (isNaN(fajr) || (sr - fajr) > fp){ fajr = sr - fp; est.fajr = true; }
      if (!ishaMin){ const ip = share(M.isha); if (isNaN(isha) || (isha - ss) > ip){ isha = ss + ip; est.isha = true; } }
      else if (isha > (sr + 1440) - fp){ isha = ss + night/2; est.isha = true; } // fixed-minutes Isha that would run into the next Fajr: middle of the night
      if (polar){ est.fajr = est.isha = est.all = true; }
      const A = M.adj || {};   // the method's own fixed minutes (e.g. Diyanet temkin), then the user's mosque offsets
      const withOff = (m,key)=> m + (A[key]||0) + (_off[key]||0)/60;   // times are in minutes; method minutes as is, mosque offsets are stored in seconds
      // Official Umm al-Qura calendar (checked against its printed table for 13 Saudi cities, 11 Oct 2026):
      // every prayer is rounded UP to the next minute, sunrise DOWN (so Fajr never looks longer than it is). Isha = Maghrib + 90/120 exactly.
      if (M.uq){
        const up = x => Math.ceil(x - 1e-6), dn = x => Math.floor(x + 1e-6), mg = up(withOff(ss,'maghrib'));
        // the official table itself when we have it (Saudi time, standard Asr); mosque offsets still apply on top
        const T = (window.zijUQ && k===1 && !polar && Math.abs(this.tzAt(d)-3)<1e-9) ? zijUQ.lookup(this.lat, this.lon, d, 3) : null;
        if (T){ const o = key => (_off[key]||0)/60;
          return { fajr: up(T[0]+o('fajr')), sunrise: T[1], dhuhr: up(T[2]+o('dhuhr')), asr: up(T[3]+o('asr')), maghrib: up(T[4]+o('maghrib')), isha: up(T[5]+o('isha')),
                   noon, est, polar, method:this.activeMethod(), official: zijUQ.city() }; }
        // Fajr the way the official table computes it (fitted to 61 official times: 47 days in Jeddah Oct 2026 - Mar 2027 and 14 cities on 11 Oct 2026, all exact):
        // the sun's declination taken at 23:00 local of the same date and the equation of time at 10:00, sun 18.5° below the horizon, rounded up, no extra precaution.
        // Falls back to the plain event when the formula has no answer. (A +4 s Maghrib tried on 61 official times was dropped: the full official 2027 year made Maghrib worse, 351 → 321 of 365 in Jeddah.)
        const uqFajr = (()=>{ if (polar || est.fajr) return fajr;
          const sD = this._sunAtLocalMinute(d, 23*60), sE = this._sunAtLocalMinute(d, 10*60);
          const cosH = (AstroMath.sind(-M.fajr) - AstroMath.sind(this.lat)*Math.sin(sD.dec)) / (AstroMath.cosd(this.lat)*Math.cos(sD.dec));
          return (cosH < -1 || cosH > 1) ? fajr : (720 - 4*this.lon + 60*this.tzAt(d) - sE.eq) - 4*Math.acos(cosH)*AstroMath.RADD; })();
        return { fajr: up(withOff(uqFajr,'fajr')), sunrise: dn(sr + (A.sunrise||0)), dhuhr: up(withOff(noon,'dhuhr')), asr: up(withOff(asr,'asr')),
                 maghrib: mg, isha: ishaMin ? up(mg + ishaMin + (_off.isha||0)/60) : up(withOff(isha,'isha')), noon, est, polar, method:this.activeMethod() };
      }
      return { fajr: withOff(fajr,'fajr'), sunrise: sr + (A.sunrise||0), dhuhr: withOff(noon,'dhuhr'), asr: withOff(asr,'asr'), maghrib: withOff(ss,'maghrib'), isha: withOff(isha,'isha'), noon, est, polar, method:this.activeMethod() };
    } finally { this.lat = lat0; }
  }
}

// ============================================================
// StarField — النجوم الحقيقية (RA/Dec) وإسقاطها Alt/Az حسب موقع المراقب
// ============================================================
class StarField {
  constructor(observer){
    this.observer = observer;
    this.starsData = [
      ["الشعرى", 6+45/60+8.9/3600, -16.7161],
      ["الدبران", 4+35/60+55.2/3600, 16.5093],
      ["رجل الجبار", 5+14/60+32.3/3600, -8.205],
      ["يد الجوزاء", 5+55/60+10.3/3600, 7.407],
      ["السماك الرامح", 14+15/60+39.7/3600, 19.1825],
      ["النسر الواقع", 18+36/60+56.3/3600, 38.7837],
      ["القطبية", 2+31/60+49.1/3600, 89.2641]
    ];
  }
  init(){
    const g = document.getElementById('starsReal');
    if (!g) return;
    g.innerHTML = '';
    this.starsData.forEach((s, i)=>{
      const el = document.createElementNS("http://www.w3.org/2000/svg","g");
      el.setAttribute('id', `star-elem-${i}`);
      el.innerHTML = `<circle r="2.3"/><text x="4" y="2">${s[0]}</text>`;
      g.appendChild(el);
    });
  }
  update(now){
    this.starsData.forEach((s, i)=>{
      const el = document.getElementById(`star-elem-${i}`);
      if (!el) return;
      const aa = this.observer.raDecToAltAz(s[1], s[2], now);
      const p = [300 + 222*Math.sin(aa.az*AstroMath.DEGR), 300 - 222*Math.cos(aa.az*AstroMath.DEGR)];
      el.setAttribute('transform', `translate(${p[0]} ${p[1]})`);
      el.setAttribute('opacity', aa.alt > -5 ? 1 : 0.15); // dim stars currently below the horizon rather than hiding them
    });
  }
}

/* ===== TrueSkyEngine · sha256 e42045e3a2ed ===== */
class TrueSkyEngine {
  constructor(observer){ this.observer = observer; }
  daysSince2000(d){ return AstroMath.jdOf(d) - 2451543.5; }
  // القمر من Ephemeris الموحّد (اتصلحت معادلة المركز المكررة اللي كانت بتغلّط الموضع لحد ~7°)
  moonEclipticLongitude(d){ return Ephemeris.moon(d).lon; }
  // المنازل الـ28 بتتقسم على الفلك النجمي (الثريا #3، الدبران #4، الجبهة #10، القلب #18...) — لازم نطرح الأيانامسا من خط الطول الاستوائي
  moonMansionIndex(d){ return Math.floor(AstroMath.normDeg(this.moonEclipticLongitude(d) - Ephemeris.ayanamsa(d)) / (360/28)); }
  moonEquatorial(d){ const m = Ephemeris.moon(d); return { ra: m.ra/15, dec: m.dec }; }
  // ارتفاع القمر من منظور المراقب (بعد تصحيح اختلاف المنظر ~1°) وسمته
  moonAltTopo(d){
    const m = Ephemeris.moon(d), g = Ephemeris.altAz(m.ra, m.dec, d, this.observer.lat, this.observer.lon);
    const par = Math.asin(1/m.dist)*AstroMath.RADD;
    return { alt: g.alt - par*Math.cos(g.alt*AstroMath.DEGR), az: g.az, par, dist: m.dist };
  }
  planetXYZ(name, d, elements){
    const D = this.daysSince2000(d), q = elements[name];
    const val = k => q[k][0] + q[k][1]*D;
    const N = val('N')*AstroMath.DEGR, i = val('i')*AstroMath.DEGR, w = val('w')*AstroMath.DEGR;
    const a = val('a'), e = val('e'), M = AstroMath.normDeg(val('M'))*AstroMath.DEGR;
    let E = M + e*Math.sin(M)*(1+e*Math.cos(M));
    for (let z=0;z<5;z++) E -= (E - e*Math.sin(E) - M)/(1 - e*Math.cos(E));
    const xv = a*(Math.cos(E)-e), yv = a*Math.sqrt(1-e*e)*Math.sin(E);
    const v = Math.atan2(yv,xv), r = Math.hypot(xv,yv), vw = v+w;
    return {
      x: r*(Math.cos(N)*Math.cos(vw) - Math.sin(N)*Math.sin(vw)*Math.cos(i)),
      y: r*(Math.sin(N)*Math.cos(vw) + Math.cos(N)*Math.sin(vw)*Math.cos(i)),
      z: r*Math.sin(vw)*Math.sin(i)
    };
  }
  earthXYZ(d){
    const D = this.daysSince2000(d), M = AstroMath.normDeg(356.0470 + 0.9856002585*D)*AstroMath.DEGR;
    const w = (282.9404 + 4.70935E-5*D)*AstroMath.DEGR, e = 0.016709 - 1.151E-9*D;
    let E = M + e*Math.sin(M)*(1+e*Math.cos(M));
    for (let z=0;z<5;z++) E -= (E - e*Math.sin(E) - M)/(1 - e*Math.cos(E));
    const xv = Math.cos(E)-e, yv = Math.sqrt(1-e*e)*Math.sin(E);
    const v = Math.atan2(yv,xv), r = Math.hypot(xv,yv), lon = v+w+Math.PI;   // موضع الأرض من الشمس = عكس موضع الشمس من الأرض (كان ناقص 180° وده كان بيقلب اتجاه كل الكواكب)
    return { x: r*Math.cos(lon), y: r*Math.sin(lon), z: 0 };
  }
  planetEquatorial(name, d){
    const P = {
      Mercury:{N:[48.3313,3.24587E-5],i:[7.0047,5.00E-8],w:[29.1241,1.01444E-5],a:[0.387098,0],e:[0.205635,5.59E-10],M:[168.6562,4.0923344368]},
      Venus:{N:[76.6799,2.46590E-5],i:[3.3946,2.75E-8],w:[54.8910,1.38374E-5],a:[0.72333,0],e:[0.006773,-1.302E-9],M:[48.0052,1.6021302244]},
      Mars:{N:[49.5574,2.11081E-5],i:[1.8497,-1.78E-8],w:[286.5016,2.92961E-5],a:[1.523688,0],e:[0.093405,2.516E-9],M:[18.6021,0.5240207766]},
      Jupiter:{N:[100.4542,2.76854E-5],i:[1.3030,-1.557E-7],w:[273.8777,1.64505E-5],a:[5.20256,-1.3E-7],e:[0.048498,4.469E-9],M:[19.8950,0.0830853001]},
      Saturn:{N:[113.6634,2.38980E-5],i:[2.4886,-1.081E-7],w:[339.3939,2.97661E-5],a:[9.55475,-2.138E-9],e:[0.055546,-9.499E-9],M:[316.9670,0.0334442282]}
    };
    const p = this.planetXYZ(name, d, P), e0 = this.earthXYZ(d);
    const x = p.x-e0.x, y = p.y-e0.y, z = p.z-e0.z;
    const ob = (23.4393 - 3.563E-7*this.daysSince2000(d)) * AstroMath.DEGR;
    const ye = y*Math.cos(ob) - z*Math.sin(ob), ze = y*Math.sin(ob) + z*Math.cos(ob);
    return { ra: AstroMath.normDeg(Math.atan2(ye,x)*AstroMath.RADD)/15, dec: Math.atan2(ze, Math.hypot(x,ye))*AstroMath.RADD };
  }
  altitudeOf(ra, dec, d){
    const lst = (this.observer.gmst(d) + this.observer.lon)/15;
    let H = AstroMath.normDeg((lst-ra)*15); if (H>180) H -= 360;
    const ph = this.observer.lat*AstroMath.DEGR, de = dec*AstroMath.DEGR, hh = H*AstroMath.DEGR;
    return Math.asin(Math.sin(ph)*Math.sin(de) + Math.cos(ph)*Math.cos(de)*Math.cos(hh)) * AstroMath.RADD;
  }
  // شروق وغروب القمر (دقايق من منتصف اليوم المحلي): ارتفاع من منظور المراقب مقابل حد الشروق الظاهري (انكسار 0.567° + نصف القطر)، بتنصيف خطي بين عينات كل 10 دقايق
  moonRiseSet(d){
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const STEP = 10;
    let prev = null, rise = null, set = null;
    for (let mins = 0; mins <= 1440; mins += STEP){
      const m = this.moonAltTopo(new Date(dayStart.getTime() + mins*60000));
      const v = m.alt - (-0.5667 - 0.2725*m.par);
      if (prev !== null){
        if (prev < 0 && v >= 0 && rise === null) rise = (mins-STEP) + STEP*(-prev)/(v-prev);
        if (prev >= 0 && v < 0 && set === null) set = (mins-STEP) + STEP*prev/(prev-v);
      }
      prev = v;
    }
    return { riseMin: rise, setMin: set };
  }
  // بيرجع خريطة {sun, moon, Mercury..Saturn} = true لو تحت الأفق دلوقتي فعليًا
  belowHorizonMap(d){
    const map = {};
    // الشمس: بتستخدم observer.sunAltitudeNow — نفس المعادلة بالظبط اللي بتحسب عليها مواقيت الصلاة وقوس النهار/الليل، عشان مفيش تضارب أرقام
    map.sun = this.observer.sunAltitudeNow(d) < 0;
    { const mt = this.moonAltTopo(d); map.moon = mt.alt < (-0.5667 - 0.2725*mt.par); }
    ['Mercury','Venus','Mars','Jupiter','Saturn'].forEach(name=>{
      const eq = this.planetEquatorial(name, d);
      map[name] = this.altitudeOf(eq.ra, eq.dec, d) < 0;
    });
    return map;
  }
}

/* ===== MANSION_NAMES · sha256 386aa551bc3f ===== */
const MANSION_NAMES = ["الشرطين","البطين","الثريا","الدبران","الهقعة","الهنعة","الذراع","النثرة","الطرف","الجبهة","الزبرة","الصرفة","العواء","السماك","الغفر","الزبانا","الإكليل","القلب","الشولة","النعائم","البلدة","سعد الذابح","سعد بلع","سعد السعود","سعد الأخبية","الفرغ المقدم","الفرغ المؤخر","الرشاء"];

/* ===== CALC_NAMES / CALC_NOTES · sha256 fe4a4c617c27 ===== */
const CALC_NAMES = { AUTO:'تلقائي حسب البلد', UMM_AL_QURA:'أم القرى', EGYPT:'الهيئة المصرية', MWL:'رابطة العالم الإسلامي', ISNA:'أمريكا الشمالية', KARACHI:'كراتشي', DUBAI:'دبي', KUWAIT:'الكويت', QATAR:'قطر', RUSSIA:'روسيا', SINGAPORE:'سنغافورة وماليزيا وإندونيسيا', MOROCCO:'المغرب', TUNISIA:'تونس', TURKEY:'تركيا (ديانت)', JORDAN:'الأردن (وزارة الأوقاف)', FRANCE:'فرنسا (اتحاد المنظمات الإسلامية)' };
const CALC_NOTES_X = {
  KARACHI:'كراتشي: الفجر 18° والعشاء 18°، والعصر بالمذهب الحنفي (ظل = ضعف الجسم).', DUBAI:'دبي: الفجر 18.2° والعشاء 18.2°.', KUWAIT:'الكويت: الفجر 18° والعشاء 17.5°.',
  QATAR:'قطر: الفجر 18°، والعشاء بعد المغرب بـ90 دقيقة.', RUSSIA:'الإدارة الدينية لمسلمي روسيا: الفجر 16° والعشاء 15°.', SINGAPORE:'سنغافورة وماليزيا وإندونيسيا: الفجر 20° والعشاء 18°.',
  MOROCCO:'المغرب: الفجر 19° والعشاء 17°.', TUNISIA:'تونس: الفجر 18° والعشاء 18°.',
  TURKEY:'ديانت (تركيا): الفجر 18° والعشاء 17°، مع دقائق التمكين الرسمية: الشروق −7، الظهر +5، العصر +4، المغرب +7.',
  JORDAN:'وزارة الأوقاف الأردنية: الفجر 18° والعشاء 18°، والمغرب بعد الغروب بـ5 دقائق.',
  FRANCE:'اتحاد المنظمات الإسلامية في فرنسا (UOIF): الفجر 12° والعشاء 12°. بعض المساجد تعتمد زاوية أخرى؛ عدّل من إزاحة المسجد إن لزم.' };
const CALC_NOTES = {
  UMM_AL_QURA:'أم القرى: الفجر 18.5°، والعشاء بعد المغرب بـ90 دقيقة (120 في رمضان). العصر بمذهب الجمهور (ظل = طول الجسم).',
  EGYPT:'الهيئة المصرية: الفجر 19.5° والعشاء 17.5°. (ليست الرسمية في السعودية)',
  MWL:'رابطة العالم الإسلامي: الفجر 18° والعشاء 17°.',
  ISNA:'أمريكا الشمالية: الفجر 15° والعشاء 15°.'
};

/* ===== ZIJ_CITIES · sha256 bcd98bc26320 ===== */
const ZIJ_CITIES=[
 ['مكة المكرمة',21.4225,39.8262,'Asia/Riyadh','SA'],['المدينة المنورة',24.4672,39.6111,'Asia/Riyadh','SA'],['الرياض',24.7136,46.6753,'Asia/Riyadh','SA'],['جدة',21.5433,39.1728,'Asia/Riyadh','SA'],
 ['القدس الشريف',31.7780,35.2354,'Asia/Jerusalem','PS'],['غزة',31.5017,34.4668,'Asia/Gaza','PS'],['القاهرة',30.0444,31.2357,'Africa/Cairo','EG'],['عمّان',31.9539,35.9106,'Asia/Amman','JO'],
 ['دمشق',33.5138,36.2765,'Asia/Damascus','SY'],['بغداد',33.3152,44.3661,'Asia/Baghdad','IQ'],['الكويت',29.3759,47.9774,'Asia/Kuwait','KW'],['الدوحة',25.2854,51.5310,'Asia/Qatar','QA'],
 ['دبي',25.2048,55.2708,'Asia/Dubai','AE'],['مسقط',23.5880,58.3829,'Asia/Muscat','OM'],['إسطنبول',41.0082,28.9784,'Europe/Istanbul','TR'],['كراتشي',24.8607,67.0011,'Asia/Karachi','PK'],
 ['دكا',23.8103,90.4125,'Asia/Dhaka','BD'],['جاكرتا',-6.2088,106.8456,'Asia/Jakarta','ID'],['كوالالمبور',3.1390,101.6869,'Asia/Kuala_Lumpur','MY'],['بانكوك',13.7563,100.5018,'Asia/Bangkok','TH'],
 ['بكين',39.9042,116.4074,'Asia/Shanghai','CN'],['طوكيو',35.6762,139.6503,'Asia/Tokyo','JP'],['سيدني',-33.8688,151.2093,'Australia/Sydney','AU'],['نوميا',-22.2758,166.4580,'Pacific/Noumea','NC'],
 ['أوكلاند',-36.8485,174.7633,'Pacific/Auckland','NZ'],['ميدواي',28.2072,-177.3735,'Pacific/Midway','UM'],['هاواي',21.3069,-157.8583,'Pacific/Honolulu','US'],['أنكوريج',61.2181,-149.9003,'America/Anchorage','US'],
 ['لوس أنجلوس',34.0522,-118.2437,'America/Los_Angeles','US'],['دنفر',39.7392,-104.9903,'America/Denver','US'],['المكسيك',19.4326,-99.1332,'America/Mexico_City','MX'],['تورونتو',43.6532,-79.3832,'America/Toronto','CA'],
 ['نيويورك',40.7128,-74.0060,'America/New_York','US'],['لاباز',-16.4897,-68.1193,'America/La_Paz','BO'],['بوينس آيرس',-34.6037,-58.3816,'America/Argentina/Buenos_Aires','AR'],['ج. الجنوبية',-54.2806,-36.5080,'Atlantic/South_Georgia','GS'],
 ['آزوريس',37.7412,-25.6756,'Atlantic/Azores','PT'],['لندن',51.5074,-0.1278,'Europe/London','GB'],['باريس',48.8566,2.3522,'Europe/Paris','FR'],['برلين',52.5200,13.4050,'Europe/Berlin','DE'],
 ['أوسلو',59.9139,10.7522,'Europe/Oslo','NO'],['موسكو',55.7558,37.6173,'Europe/Moscow','RU'],['الدار البيضاء',33.5731,-7.5898,'Africa/Casablanca','MA'],['لاغوس',6.5244,3.3792,'Africa/Lagos','NG'],['نيروبي',-1.2921,36.8219,'Africa/Nairobi','KE']];

/* ===== kaabaToday (home screen) · sha256 8813f58d67a1 ===== */
const _kaaba={day:'',v:null};
function kaabaToday(now){
  const key=now.toISOString().slice(0,10);if(_kaaba.day===key)return _kaaba.v;_kaaba.day=key;_kaaba.v=null;
  const K={lat:21.4225,lon:39.8262},n360=x=>((x%360)+360)%360;
  const at=(day,anti)=>{const H=tt=>{const sn=Ephemeris.sun(new Date(tt));let h=n360(Ephemeris.gmst(new Date(tt))+K.lon-sn.ra-(anti?180:0));return h>180?h-360:h;};
    let lo=day+(anti?18:6)*36e5,hi=day+(anti?24:12)*36e5;if(!(H(lo)<0&&H(hi)>0))return null;
    for(let j=0;j<36;j++){const m=(lo+hi)/2;if(H(m)<0)lo=m;else hi=m;}const t=(lo+hi)/2;return {t,off:Math.abs(Ephemeris.sun(new Date(t)).dec-(anti?-K.lat:K.lat))};};
  const d0=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  for(const anti of [false,true]){const c=at(d0,anti);if(!c||c.off>0.2)continue;
    const a=at(d0-864e5,anti),b=at(d0+864e5,anti);if((a&&a.off<c.off)||(b&&b.off<c.off))continue;
    const lday=new Date(c.t+observer.tz*36e5).toISOString().slice(0,10),today=new Date(now.getTime()+observer.tz*36e5).toISOString().slice(0,10);
    if(lday===today){_kaaba.v={t:c.t,anti};break;}}
  return _kaaba.v;
}

/* ===== ZIJ_COAST · sha256 d21b190c3652 ===== */
window.ZIJ_COAST=["M12.0,24.4 L13.8,21.7 L23.2,18.7 L39.0,20.3 L47.0,20.6 L52.0,20.0 L64.5,22.0 L72.0,22.0 L82.0,22.0 L85.0,19.0 L90.0,21.0 L94.0,23.0 L92.0,25.8 L86.5,29.0 L85.8,31.2 L87.5,32.8 L92.0,33.7 L95.0,34.7 L97.7,34.9 L98.0,37.1 L100.4,38.5 L101.2,37.2 L101.0,35.5 L102.5,34.0 L102.2,31.5 L101.9,27.7 L105.0,27.7 L108.0,28.8 L110.5,30.0 L112.5,31.4 L115.6,29.6 L118.0,33.0 L120.0,34.5 L123.0,37.0 L124.0,38.5 L120.0,39.8 L114.0,39.8 L111.0,41.8 L115.8,41.2 L115.3,42.2 L114.0,43.0 L115.2,44.0 L118.8,44.3 L120.0,43.7 L116.5,45.4 L114.0,46.4 L113.0,45.2 L110.0,46.3 L109.2,47.4 L110.0,48.3 L108.5,48.6 L106.0,49.4 L106.0,50.6 L104.5,52.0 L104.0,53.0 L104.5,54.8 L102.1,56.1 L100.5,57.0 L99.0,58.2 L98.6,59.7 L99.7,63.0 L99.9,64.3 L99.0,64.8 L97.3,62.1 L97.0,61.0 L96.0,60.0 L94.6,60.3 L92.5,59.7 L90.6,60.0 L91.0,61.0 L89.5,60.8 L88.0,60.4 L86.2,60.3 L85.0,60.8 L82.8,62.4 L82.6,64.1 L82.2,67.5 L82.8,70.0 L83.9,70.8 L85.5,71.8 L88.0,71.4 L89.4,70.1 L89.6,69.0 L92.0,68.5 L93.0,68.5 L92.6,70.5 L91.8,72.5 L91.1,74.2 L92.5,74.1 L96.7,75.0 L96.3,78.0 L96.3,79.1 L97.4,80.5 L100.5,80.4 L102.5,81.4 L101.6,81.8 L100.5,81.1 L99.6,82.7 L97.2,81.8 L96.3,81.6 L94.3,80.0 L94.3,79.0 L92.5,77.1 L90.5,76.6 L87.8,75.5 L85.7,73.8 L83.5,74.2 L80.2,73.2 L78.0,72.1 L74.4,69.4 L74.7,68.5 L73.5,66.8 L70.5,64.5 L69.0,62.1 L67.2,59.0 L65.3,58.1 L65.2,60.0 L67.5,63.0 L69.7,65.8 L70.1,67.1 L68.0,65.2 L65.5,62.3 L64.2,59.7 L62.9,57.5 L61.5,56.0 L59.4,55.4 L58.1,53.4 L57.5,52.3 L56.2,50.6 L55.6,49.6 L55.9,47.2 L56.0,43.8 L55.3,41.6 L57.0,40.8 L53.0,39.0 L50.0,35.5 L47.0,33.5 L44.0,31.5 L40.0,30.2 L36.0,30.0 L32.0,29.5 L29.0,30.8 L26.5,31.0 L24.0,32.5 L20.0,34.5 L17.0,35.2 L21.5,33.5 L23.0,31.3 L19.0,31.3 L18.0,30.0 L15.0,28.5 L14.5,26.0 L19.0,25.6 L13.5,25.4Z M102.7,81.6 L104.5,79.6 L105.2,79.0 L108.0,77.6 L109.0,79.0 L110.0,77.8 L112.0,79.4 L116.0,79.5 L118.1,79.3 L120.0,81.5 L122.0,83.2 L126.0,84.2 L128.0,85.5 L130.0,88.5 L130.0,89.5 L131.5,91.0 L135.5,92.5 L139.0,92.8 L141.5,93.7 L144.8,95.2 L145.2,97.2 L144.5,99.5 L143.0,101.0 L141.5,103.0 L141.0,107.0 L139.7,110.3 L139.0,112.0 L136.8,113.0 L135.0,113.8 L131.5,116.0 L131.4,118.0 L129.5,120.0 L127.5,123.0 L126.5,124.0 L123.8,124.9 L121.6,124.6 L122.5,126.0 L122.5,128.0 L118.0,129.0 L117.8,128.8 L115.0,131.0 L116.3,132.5 L114.5,135.0 L112.5,136.0 L114.5,137.8 L112.0,140.0 L111.0,142.0 L111.5,142.4 L115.0,144.7 L112.0,145.9 L108.0,143.5 L105.5,142.0 L104.5,138.0 L104.5,136.5 L106.2,133.5 L106.6,129.8 L106.8,127.0 L108.4,123.0 L108.5,120.0 L109.6,113.6 L109.8,108.5 L108.5,107.0 L104.0,104.0 L102.9,102.0 L100.5,98.0 L98.7,94.6 L100.0,92.3 L99.5,90.4 L100.1,89.0 L101.3,88.2 L102.5,86.0 L102.7,83.5Z M212.6,60.0 L212.3,58.7 L209.9,58.8 L205.2,58.4 L203.0,57.4 L202.0,57.0 L200.1,58.0 L199.0,59.7 L196.6,58.8 L195.1,57.6 L192.5,57.1 L191.2,56.8 L190.3,56.0 L190.6,54.2 L191.1,53.0 L190.2,52.7 L188.5,53.1 L185.0,53.2 L183.0,53.2 L180.0,54.2 L178.0,54.9 L174.6,54.1 L174.1,54.2 L173.2,56.0 L172.4,56.4 L170.4,59.6 L169.5,61.5 L167.0,62.3 L165.5,63.8 L164.0,66.0 L163.0,69.2 L163.5,71.0 L162.5,75.3 L163.3,76.5 L164.0,78.5 L166.3,80.5 L167.5,82.5 L169.2,83.7 L172.5,85.6 L176.0,84.8 L178.0,85.2 L179.8,84.5 L181.2,83.9 L183.4,83.6 L185.5,85.0 L186.5,85.6 L188.5,85.5 L189.7,86.0 L189.5,87.5 L189.3,89.6 L188.8,90.7 L190.2,93.0 L191.8,94.8 L192.2,96.0 L193.2,98.8 L193.5,102.5 L192.0,106.0 L191.8,107.3 L194.5,112.9 L195.2,116.5 L196.5,118.6 L197.8,122.5 L198.5,124.4 L200.0,124.8 L202.0,124.0 L205.6,124.0 L207.0,123.5 L210.0,121.0 L212.5,118.5 L212.6,116.0 L215.5,114.0 L214.9,109.8 L217.0,108.0 L220.7,104.5 L220.5,101.0 L219.3,96.8 L219.0,95.0 L221.0,92.0 L222.0,90.8 L224.0,88.5 L225.3,88.0 L228.0,85.0 L229.0,82.0 L231.0,79.5 L231.3,78.2 L229.0,78.7 L227.0,78.8 L223.1,78.4 L223.3,77.4 L222.5,76.0 L221.0,75.1 L219.5,74.4 L218.5,72.0 L217.2,70.4 L216.0,68.0 L215.5,66.5 L214.0,64.0 L213.8,62.7 L212.7,60.1Z M174.4,54.0 L171.0,53.0 L171.1,51.3 L171.2,48.9 L170.7,47.0 L172.0,46.3 L178.2,46.6 L178.8,44.0 L175.2,41.6 L178.4,41.3 L178.4,40.3 L180.2,40.5 L181.6,39.1 L183.5,38.6 L184.5,37.6 L186.8,36.6 L188.6,36.1 L188.6,35.0 L188.2,33.2 L190.6,32.3 L190.4,33.6 L190.0,35.0 L190.9,36.0 L193.5,35.6 L194.3,36.1 L198.5,35.2 L201.0,34.7 L201.0,33.0 L204.3,32.7 L204.4,31.5 L203.5,30.8 L208.0,30.5 L209.8,30.0 L204.9,29.8 L202.9,30.2 L201.5,29.1 L201.4,27.0 L205.4,25.0 L205.4,24.5 L202.4,24.3 L201.0,26.0 L197.5,27.5 L197.2,29.3 L198.5,30.4 L196.5,33.0 L195.5,33.9 L192.9,34.5 L192.6,33.5 L191.9,32.3 L190.7,30.5 L190.0,31.0 L188.0,31.9 L185.5,31.1 L185.0,29.0 L186.0,27.5 L190.0,26.4 L192.5,24.0 L194.5,22.2 L196.0,21.4 L199.0,20.0 L204.0,19.0 L208.0,18.9 L211.0,19.6 L213.0,21.0 L221.0,22.5 L224.0,23.5 L223.3,21.4 L233.0,21.5 L240.0,21.0 L248.0,21.5 L250.5,17.0 L253.5,21.5 L260.0,17.5 L267.0,15.5 L280.0,14.0 L284.3,12.3 L293.0,16.3 L308.0,18.0 L320.0,17.5 L330.0,19.0 L340.0,20.5 L350.0,20.0 L360.0,21.1 L360.0,25.0 L357.0,25.5 L359.0,27.5 L353.0,28.5 L350.0,30.0 L343.5,30.0 L342.5,33.5 L340.0,37.0 L336.7,39.0 L336.0,37.0 L336.0,33.0 L340.0,29.5 L335.0,30.7 L323.0,30.8 L321.0,32.0 L317.0,35.5 L320.5,36.5 L321.3,37.0 L320.0,41.5 L315.0,46.5 L311.9,46.9 L309.7,49.0 L307.5,50.5 L309.4,53.0 L309.4,54.8 L306.5,55.5 L306.5,52.4 L305.0,52.0 L304.5,50.2 L301.6,51.1 L302.0,49.2 L299.0,50.8 L297.7,51.1 L298.9,52.5 L299.0,52.7 L302.6,52.6 L300.5,54.0 L299.3,55.0 L301.0,57.5 L302.0,59.2 L301.5,62.0 L299.6,64.5 L297.3,66.5 L294.2,67.7 L290.4,68.8 L288.5,68.4 L286.7,69.3 L285.8,71.0 L288.0,75.0 L289.4,78.0 L287.1,79.7 L284.8,81.4 L284.8,79.7 L283.5,79.4 L281.2,77.3 L280.5,76.7 L279.9,78.0 L279.2,79.5 L280.3,81.6 L281.3,83.1 L283.4,85.5 L283.9,88.7 L283.5,88.6 L281.3,87.3 L280.3,84.6 L280.3,83.5 L278.3,82.0 L278.5,79.5 L278.7,77.0 L277.6,73.5 L276.1,73.2 L274.5,74.0 L274.2,71.5 L272.0,69.0 L271.0,67.5 L269.0,68.3 L267.0,68.8 L266.5,70.0 L265.0,70.7 L263.0,72.5 L260.3,74.5 L260.2,76.9 L259.9,79.0 L259.2,80.7 L257.5,81.9 L256.5,81.0 L255.0,78.0 L254.0,75.0 L253.0,72.5 L252.8,70.9 L252.6,68.5 L252.0,69.2 L251.0,69.3 L249.0,67.7 L250.0,67.0 L248.5,66.5 L247.0,65.2 L246.5,64.6 L243.0,64.8 L241.5,64.9 L238.0,64.4 L237.3,64.2 L236.4,62.9 L234.0,63.4 L232.0,62.4 L230.8,61.1 L228.9,59.6 L228.0,60.1 L228.5,62.0 L229.5,63.0 L230.2,63.8 L230.0,64.7 L230.8,65.0 L231.2,63.9 L231.6,65.5 L232.5,65.8 L234.3,65.6 L235.3,64.7 L236.0,64.0 L236.3,63.6 L236.4,65.5 L238.5,66.4 L239.8,67.5 L238.9,69.5 L237.7,71.0 L235.0,72.8 L232.0,74.0 L229.5,75.3 L228.0,76.0 L225.0,77.2 L223.5,77.3 L223.2,76.2 L222.7,74.5 L222.5,73.1 L221.2,71.0 L219.7,69.0 L219.1,68.5 L218.5,67.0 L218.0,65.9 L216.0,63.5 L215.0,62.0 L214.9,60.5 L214.6,62.1 L214.2,62.3 L213.6,61.8 L213.0,61.0 L212.6,60.1 L212.3,58.7 L214.2,58.7 L214.8,57.9 L215.1,57.0 L215.5,56.0 L215.9,54.5 L216.2,53.4 L214.6,53.3 L212.5,53.9 L210.7,53.1 L209.0,53.4 L207.3,53.0 L207.1,51.6 L206.2,50.0 L206.5,49.4 L205.5,49.1 L203.8,50.0 L202.9,49.4 L202.6,50.5 L203.7,52.1 L202.5,53.6 L201.7,53.0 L201.3,51.7 L200.7,50.5 L199.5,48.7 L199.5,47.8 L198.5,47.5 L196.4,46.5 L194.5,44.8 L193.7,44.5 L192.3,44.6 L192.5,46.0 L193.6,46.5 L196.1,48.1 L198.5,49.9 L197.0,49.5 L197.1,51.0 L195.7,52.1 L195.7,50.5 L194.3,49.2 L192.5,48.4 L190.5,47.0 L188.9,45.6 L187.5,46.2 L185.4,46.8 L183.2,46.8 L183.1,48.0 L180.9,49.3 L179.7,50.6 L180.2,51.3 L179.4,51.9 L177.8,53.3 L175.6,53.3Z M0.0,21.1 L5.0,22.5 L10.3,23.9 L8.0,25.5 L0.0,25.0Z M294.0,111.8 L296.5,110.7 L299.0,110.0 L301.5,109.0 L302.2,108.0 L303.5,106.5 L306.0,104.0 L308.1,105.5 L309.5,104.9 L310.8,102.4 L312.5,101.5 L315.0,102.0 L316.8,102.2 L315.8,105.0 L317.5,106.0 L319.5,107.5 L321.5,107.0 L321.6,103.0 L322.5,100.7 L323.5,104.0 L325.0,105.0 L325.8,106.9 L328.5,110.0 L330.5,112.5 L333.0,115.5 L333.6,118.0 L333.0,121.0 L331.2,123.9 L330.0,127.0 L326.4,129.1 L324.0,128.5 L321.0,128.2 L319.5,126.0 L318.5,124.9 L317.5,124.0 L315.8,124.9 L314.0,122.8 L311.0,121.5 L309.0,121.6 L305.0,122.3 L301.9,123.9 L298.0,125.0 L295.1,124.4 L295.7,122.0 L294.9,119.5 L293.5,116.0 L294.1,114.0 L293.5,112.0Z M324.7,130.7 L328.3,130.9 L328.0,133.2 L326.0,133.6 L324.7,130.7Z M107.0,11.5 L118.0,8.0 L140.0,6.5 L160.0,8.0 L162.0,14.0 L158.0,19.5 L153.0,21.5 L140.0,25.0 L137.0,30.0 L130.0,28.0 L126.5,23.5 L125.0,20.0 L120.0,15.0Z M156.0,24.5 L158.0,23.6 L165.0,23.5 L166.5,25.0 L162.0,26.6 L158.0,26.2Z M174.3,40.0 L177.0,39.4 L181.3,38.9 L181.7,37.3 L180.0,36.5 L178.5,35.0 L178.0,34.0 L178.0,32.3 L176.5,31.4 L175.0,31.4 L174.0,32.5 L174.2,33.5 L175.0,35.0 L177.0,35.2 L177.0,36.6 L175.5,36.7 L175.8,37.5 L174.7,38.1 L177.0,38.5 L175.0,39.5Z M174.0,37.8 L173.8,36.0 L174.5,35.5 L173.5,34.8 L171.7,34.8 L170.0,35.8 L169.7,37.9 L170.5,38.5 L172.0,38.3Z M310.9,56.0 L312.5,54.5 L315.5,54.3 L316.8,52.7 L319.0,52.0 L320.0,49.5 L321.5,48.6 L322.0,50.5 L321.0,52.0 L320.9,54.0 L320.0,55.0 L319.5,54.7 L318.5,55.3 L317.0,55.4 L316.8,55.7 L315.8,56.5 L315.0,55.5 L313.0,55.7 L311.5,56.0Z M320.0,48.5 L321.0,44.7 L321.8,44.6 L325.5,46.7 L323.5,48.0 L321.0,47.6Z M309.7,56.7 L311.0,56.2 L312.0,57.0 L311.5,58.5 L310.5,59.0 L309.7,57.5Z M312.5,56.7 L314.5,55.8 L314.2,56.5 L313.0,57.2Z M322.0,44.0 L323.5,40.5 L323.0,36.5 L322.0,35.7 L321.7,40.0Z M300.2,67.0 L301.0,64.8 L301.9,66.0 L300.9,68.0Z M288.7,70.7 L290.5,70.0 L291.0,71.3 L289.5,71.8Z M259.8,80.5 L261.8,82.5 L261.2,84.0 L259.8,83.5Z M229.3,102.0 L230.4,105.5 L229.4,108.0 L227.5,114.8 L225.2,115.6 L224.0,114.0 L223.3,112.0 L224.5,109.5 L224.3,106.5 L226.3,105.7 L228.0,103.5Z M275.3,84.4 L277.5,84.8 L280.3,87.5 L283.5,90.5 L286.0,93.0 L285.8,95.8 L284.5,95.9 L282.3,94.0 L280.5,91.5 L278.5,88.2 L276.5,86.3Z M285.3,96.8 L288.0,96.3 L290.5,96.9 L294.4,97.7 L294.5,98.7 L290.0,98.2 L286.5,97.5Z M289.0,88.5 L291.0,88.2 L293.0,87.0 L294.5,85.5 L297.0,83.0 L299.0,85.0 L298.0,89.0 L297.5,91.0 L296.0,94.0 L294.5,93.7 L292.0,93.4 L290.2,92.8 L289.3,91.0Z M299.4,95.5 L298.9,92.8 L299.8,89.4 L304.9,88.4 L301.2,90.9 L303.0,94.8 L301.6,94.5 L300.3,92.5Z M311.0,91.0 L314.5,90.8 L318.0,91.7 L321.0,92.6 L325.0,94.5 L327.3,96.0 L330.5,100.4 L326.0,98.2 L323.0,99.2 L321.0,99.1 L318.5,98.2 L318.0,96.0 L315.0,94.5 L313.0,94.0Z M300.4,71.5 L302.2,71.6 L301.6,74.2 L304.0,77.0 L302.5,76.5 L300.7,76.0 L300.0,74.0Z M302.0,83.0 L306.5,80.5 L306.5,83.5 L305.3,84.3 L303.0,82.5Z M352.7,124.4 L354.5,126.5 L356.0,127.5 L358.5,127.7 L357.0,129.5 L355.0,131.5 L354.8,129.5 L353.8,129.2 L354.6,128.0Z M352.7,130.5 L354.3,131.7 L353.0,133.5 L351.2,134.5 L350.5,136.0 L349.0,136.6 L346.5,136.0 L348.0,134.0 L351.5,131.5Z M95.0,68.1 L97.5,66.9 L100.5,67.1 L103.0,68.2 L105.9,69.8 L102.5,70.1 L100.0,68.4 L96.5,68.0Z M105.6,71.6 L107.2,70.1 L110.0,70.2 L111.6,71.4 L110.0,71.8 L108.3,72.3Z M120.7,42.4 L124.0,38.4 L124.5,40.5 L127.3,42.4 L126.5,43.4Z M100.0,27.0 L106.5,25.5 L112.0,27.5 L118.0,23.5 L116.5,22.5 L108.0,18.5 L102.0,17.5 L90.0,16.5 L100.0,20.0 L95.0,23.5Z M89.5,13.5 L103.0,13.0 L118.5,7.5 L108.0,7.0 L90.0,9.0Z M62.0,20.0 L75.0,20.5 L79.0,19.0 L73.0,17.0 L62.0,18.0Z M192.4,52.2 L195.6,51.7 L195.1,53.3Z M188.2,49.0 L189.7,48.8 L189.5,50.8 L188.4,51.0Z M188.6,47.5 L189.4,47.0 L189.5,48.5 L188.8,48.6Z M203.5,54.4 L206.3,54.7 L204.0,55.0Z M212.3,55.0 L214.6,54.4 L213.9,55.4Z M231.5,18.5 L236.0,16.0 L240.0,14.0 L248.5,13.0 L245.0,15.0 L238.0,18.0Z M0.0,180.0 L0.0,169.0 L20.0,168.0 L40.0,165.0 L60.0,164.0 L80.0,163.0 L95.0,163.0 L105.0,162.0 L117.0,155.0 L120.0,154.0 L123.0,153.5 L118.0,156.0 L115.0,159.0 L120.0,163.0 L130.0,168.0 L145.0,167.0 L160.0,162.0 L180.0,160.0 L200.0,160.0 L220.0,158.0 L240.0,157.0 L250.0,158.0 L260.0,157.0 L280.0,156.0 L300.0,156.5 L320.0,156.5 L340.0,160.0 L350.0,162.0 L345.0,168.0 L360.0,168.0 L360.0,180.0Z", "M209.1,48.8 L208.0,46.8 L208.6,46.0 L209.7,44.8 L210.7,43.5 L213.5,44.0 L215.0,44.7 L217.8,45.3 L219.8,46.6 L221.6,48.4 L219.7,49.0 L216.3,48.7 L215.2,48.0 L211.5,48.9Z M226.8,45.0 L229.0,43.4 L231.5,43.0 L233.0,43.5 L233.0,45.0 L233.0,48.5 L233.5,50.0 L233.0,53.0 L230.5,53.0 L229.0,52.5 L229.0,51.5 L229.5,49.7 L230.0,49.6 L228.5,48.5 L227.5,47.0Z"];

/* ===== Adhan log references · sha256 5b4fbfe7a5b7 ===== */
const AL_KEY = 'zijAdhanLog', AL_CTRL_KEY = 'zijAdhanCtrl';
const AL_PRAYERS = [['fajr','الفجر'],['dhuhr','الظهر'],['asr','العصر'],['maghrib','المغرب'],['isha','العشاء']];
const AL_SOURCES = { haram_dish:['الحرم المكي (دش)','makkah'], haram_net:['الحرم المكي (إنترنت)','makkah'], clock:['ساعة الحرمين (مكة)','makkah'], mosque:['مسجد الحي','me'], other:['مصدر آخر','me'] };
let _alPendingStart = null;   // لحظة بداية الأذان المسجّلة، مستنية ضغطة "نهاية الأذان" لحساب المدة
let _alMakkahObs = null;
function alObserverFor(src){
  if ((AL_SOURCES[src]||[])[1] === 'makkah'){
    if (!_alMakkahObs) _alMakkahObs = new Observer();
    _alMakkahObs.set(21.4225, 39.8262, observer.tz, 'مكة المكرمة');
    return _alMakkahObs;
  }
  return observer;
}
function alLoad(){ try{ const a = JSON.parse(localStorage.getItem(AL_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function alSave(a){ try{ localStorage.setItem(AL_KEY, JSON.stringify(a.slice(-300))); }catch(e){} }
// مراجع اليوم (بالميلي ثانية) لكل صلاة + بدائل الفجر والعشاء، لمراقب معيّن
function alRefTimes(ts, obs){
  const ld = new Date(ts + obs.tz*3600000);
  const dayStart = Date.UTC(ld.getUTCFullYear(), ld.getUTCMonth(), ld.getUTCDate()) - obs.tz*3600000;
  const d = new Date(ts), M = m => dayStart + m*60000, K = AstroMath.DEGR;
  const noon = obs._noonMin(d), sunset = obs._eventMin(d,'ss',()=>-0.833,+1);
  const h = hijriCal.fromGregorian(d);
  const asrAlt = dec => Math.atan(1/(1+Math.abs(Math.tan(obs.lat*K - dec))))*AstroMath.RADD;
  const ref = {
    fajr: M(obs._eventMin(d,'fj-18.5',()=>-18.5,-1)), dhuhr: M(noon), asr: M(obs._eventMin(d,'asr',asrAlt,+1)),
    maghrib: M(sunset), isha: M(sunset + (h.month===9 ? 120 : 90))
  };
  const alts = {
    'فجر 19°': M(obs._eventMin(d,'fj-19',()=>-19,-1)), 'فجر 19.5°': M(obs._eventMin(d,'fj-19.5',()=>-19.5,-1)), 'فجر 18°': M(obs._eventMin(d,'fj-18',()=>-18,-1)),
    'عشاء 17°': M(obs._eventMin(d,'is-17',()=>-17,+1)), 'عشاء 17.5°': M(obs._eventMin(d,'is-17.5',()=>-17.5,+1))
  };
  return { ref, alts };
}
function alCtrl(){ try{ return JSON.parse(localStorage.getItem(AL_CTRL_KEY)||'{}'); }catch(e){ return {}; } }

/* ===== alMedian · sha256 020ec69ca658 ===== */
function alMedian(a){ const s = a.slice().sort((x,y)=>x-y), n = s.length; return n%2 ? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2; }

/* ===== Adhan offsets storage · sha256 1f8ae1202080 ===== */
const AL_OFFSET_KEY = 'zijAdhanOffsets';
function alLoadOffsets(){ try{ return JSON.parse(localStorage.getItem(AL_OFFSET_KEY)||'{}'); }catch(e){ return {}; } }
function alSaveOffsets(o){ try{ localStorage.setItem(AL_OFFSET_KEY, JSON.stringify(o)); }catch(e){} }
