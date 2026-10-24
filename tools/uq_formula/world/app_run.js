// Runs the app's own prayer engine (index.html, read-only) for each city, every day of the year, with the city's real time zone (DST).
// Output: app.json {id: [{fajr,sunrise,dhuhr,asr,maghrib,isha (minutes, unrounded), est, polar, tz, method}]}
const fs=require('fs');const path=require('path');const {chromium}=require('playwright');
(async()=>{const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'cities.json')));
const b=await chromium.launch();const p=await b.newPage();
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+path.resolve(__dirname,'../../../index.html'));
await p.evaluate(()=>{localStorage.setItem('zijWelcomed','1');});await p.reload();await p.waitForTimeout(3000);
const out=await p.evaluate(cfg=>{const o={};
 const meth={CA:ZIJ_COUNTRY_METHOD.CA||'MWL',NO:ZIJ_COUNTRY_METHOD.NO||'MWL'};
 for(const c of cfg.cities){observer.set(c.lat,c.lon,0,c.n);observer.zone=c.zone;observer.calcMethod=meth[c.cc];observer._memoMap=new Map();const rows=[];
  for(let i=0;i<365;i++){const D=new Date(Date.UTC(cfg.year,0,1+i,12)-zijZoneOffset(c.zone,new Date(Date.UTC(cfg.year,0,1+i,12)))*3600000);
   const h=hijriCal.fromGregorian(D);const t=observer.realPrayerTimes(D,h);
   rows.push({fajr:t.fajr,sunrise:t.sunrise,dhuhr:t.dhuhr,asr:t.asr,maghrib:t.maghrib,isha:t.isha,est:t.est,polar:t.polar,tz:observer.tzAt(D),method:t.method,ram:h.month===9});}
  o[c.id]=rows;}
 return {o,meth,ca:ZIJ_METHODS[meth.CA],no:ZIJ_METHODS[meth.NO],rule:zijHighLatRule()};},cfg);
fs.writeFileSync(path.join(__dirname,'app.json'),JSON.stringify(out));await b.close();
console.log('methods',JSON.stringify(out.meth),JSON.stringify(out.ca),JSON.stringify(out.no),'highlat',out.rule);})();
