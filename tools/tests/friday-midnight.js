const {chromium}=require('playwright');const U=process.env.U||'http://localhost:8765/index.html';(async()=>{const b=await chromium.launch();
for(const v of ['b','orig','a','c']) for(const t of ['2026-11-19T23:59:30+03:00','2026-11-20T00:00:30+03:00','2026-11-20T10:00:00+03:00']){const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Riyadh',geolocation:{latitude:21.5433,longitude:39.1728},permissions:['geolocation']});
await c.addInitScript(v=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s',1);const L=localStorage;L.setItem('zijWelcomed','1');L.setItem('zijInstallHide','1');L.setItem('zijCountry','SA');L.setItem('zijLang','ar');L.setItem('zijHomeDesign','off');L.setItem('zijBetaVariant',v);},v);
await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();await p.clock.install({time:new Date(t)});await p.goto(U);await p.waitForTimeout(1500);await p.clock.runFor(1000);
const home=await p.evaluate(()=>{const q=s=>document.querySelector(s);const tx=s=>(q(s)||{}).textContent||'';return 'time='+tx('#hTime')+' wd='+(tx('#zWd')||tx('#hWd'))+' lbl='+tx('#hLbl')+' row='+[...document.querySelectorAll('#hRow .pc .pn')].map(x=>x.textContent)[2]+' zcd='+(q('#hRow')?getComputedStyle(q('#hRow')).getPropertyValue('--zcd'):'')});
await p.click('.htab [data-go="prayer"]').catch(()=>{});await p.waitForTimeout(800);
const pr=await p.evaluate(()=>{const s=document.querySelector('[data-scr]')&&document.body.dataset.scr;const box=document.getElementById('scr-prayer')||document.getElementById('pDay')||document.body;const t=(document.getElementById('pDay')||{}).innerText||'';return s+' prayerTab: '+t.replace(/\s+/g,' ').slice(0,160)});
console.log(v,t.slice(5,16),home,'\n   ',pr);await c.close();}
await b.close();})();
