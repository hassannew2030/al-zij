const fs=require('fs');const {chromium}=require('playwright');(async()=>{const cfg=JSON.parse(fs.readFileSync('hl/cfg.json'));const b=await chromium.launch();const p=await b.newPage();
await p.route(/open-meteo|fonts\.g|bigdatacloud|nominatim|geojs|ipwho|ipapi/,r=>r.abort());
await p.goto('file://'+process.cwd()+'/merge/al-zij-v2.html');await p.evaluate(()=>localStorage.setItem('zijWelcomed','1'));await p.reload();await p.waitForTimeout(2500);
const out=await p.evaluate(cfg=>{const o={};const save=[observer.lat,observer.lon,observer.tz,observer.calcMethod];
 for(const c of cfg.cities){observer.calcMethod=c.m;const rows=[];
  for(let i=0;i<365;i++){const D=new Date(Date.UTC(cfg.year,0,1+i,12-c.tz));observer.set(c.lat,c.lon,c.tz,c.n);const h=hijriCal.fromGregorian(D);const t=observer.realPrayerTimes(D,h);
   rows.push({fajr:t.fajr,sunrise:t.sunrise,dhuhr:t.dhuhr,asr:t.asr,maghrib:t.maghrib,isha:t.isha,polar:t.polar,est:t.est,ram:h.month===9});}
  o[c.n]=rows;}
 observer.set(save[0],save[1],save[2],'x');observer.calcMethod=save[3];return o;},cfg);
fs.writeFileSync('hl/js.json',JSON.stringify(out));await b.close();})();
