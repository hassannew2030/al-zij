// اختبار التوقيت الصيفي: الجوال في مدينة بتغيّر الساعة؛ بنحسب مواقيت أيام قبل وبعد التغيير وبنقارن بالفرق الصح لكل يوم
const {chromium}=require('playwright');
const CASES=[
 {zone:'America/Toronto',lat:43.6532,lon:-79.3832,m:'ISNA',days:['2026-10-31','2026-11-01','2026-11-02','2027-03-13','2027-03-14','2027-03-15']},
 {zone:'Europe/Oslo',lat:59.9139,lon:10.7522,m:'MWL',days:['2026-10-24','2026-10-25','2026-10-26','2027-03-27','2027-03-28','2027-03-29']},
 {zone:'Europe/London',lat:51.5074,lon:-0.1278,m:'MWL',days:['2026-10-24','2026-10-25','2026-10-26']},
 {zone:'America/Santiago',lat:-33.4489,lon:-70.6693,m:'MWL',days:['2027-04-03','2027-04-04','2027-04-05']},
 {zone:'Asia/Riyadh',lat:21.5433,lon:39.1728,m:'UMM_AL_QURA',days:['2026-10-31','2026-11-01']}];
(async()=>{const b=await chromium.launch();let fails=0;
for(const C of CASES){const c=await b.newContext({timezoneId:C.zone});const p=await c.newPage();
 await p.route(/open-meteo|fonts\.g|bigdatacloud|nominatim|geojs|ipwho|ipapi|aladhan/,r=>r.abort());
 await p.goto('file://'+process.cwd()+'/merge/al-zij-v2.html');await p.evaluate(()=>localStorage.setItem('zijWelcomed','1'));await p.reload();await p.waitForTimeout(2000);
 const r=await p.evaluate(C=>{observer.calcMethod=C.m;observer.set(C.lat,C.lon,-(new Date().getTimezoneOffset()/60),'t');
  return C.days.map(ds=>{const [y,mo,d]=ds.split('-').map(Number);const D=new Date(y,mo-1,d,12);   // local noon that day, in the phone's zone
   const t=observer.realPrayerTimes(D,hijriCal.fromGregorian(D));
   const off=-D.getTimezoneOffset()/60;                                        // the real offset that day
   // solar noon in true local clock: 720 - 4*lon + 60*off - eq(≈ small); compare dhuhr to that within 20 min
   const expect=720-4*C.lon+60*off;return {ds,off,dhuhr:t.dhuhr,err:Math.abs(t.dhuhr-expect)};});},C);
 for(const x of r){const ok=x.err<20;if(!ok)fails++;const f=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(Math.round(m%60)).padStart(2,'0');
  console.log((ok?'✅':'❌'),C.zone.padEnd(17),x.ds,'offset',String(x.off).padStart(3),'dhuhr',f(x.dhuhr),ok?'':'(off by '+Math.round(x.err)+' min)');}
 await c.close();}
console.log(fails?'FAIL '+fails:'ALL OK');await b.close();})();
