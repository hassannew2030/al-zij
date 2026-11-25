const {chromium}=require('playwright');const S=process.env.S||require('os').tmpdir();require('fs').mkdirSync(S+'/l19',{recursive:true});(async()=>{const b=await chromium.launch();const port=process.argv[2],tag=process.argv[3];
const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,timezoneId:'Asia/Riyadh',geolocation:{latitude:21.5433,longitude:39.1728},permissions:['geolocation']});
await c.addInitScript(()=>{localStorage.setItem('zijWelcomed','1');localStorage.setItem('zijEntryK','1');localStorage.setItem('zijInstallHide','1');localStorage.setItem('zijCountry','SA');localStorage.setItem('zijLang','ar');});
await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();await p.clock.install({time:new Date('2026-11-19T18:41:00+03:00')});
await p.goto('http://localhost:'+port+'/index.html');await p.waitForTimeout(2500);await p.clock.runFor(2000);await p.click('.htab [data-go="sky"]');await p.waitForTimeout(3000);await p.clock.runFor(3000);
const r=await p.evaluate(()=>{const d=document.getElementById('mod-sky').contentDocument;d.getElementById('nightCard').scrollIntoView({block:'center'});return ['nTitle','fRise','fSet'].map(i=>d.getElementById(i).textContent).join(' | ');});
console.log(tag,r);await p.waitForTimeout(400);await p.screenshot({path:S+'/l19/night_'+tag+'.png'});
// several nights: click other days in the month view and read rise/set
const out=await p.evaluate(async()=>{const d=document.getElementById('mod-sky').contentDocument,w=d.defaultView,res=[];const cells=[...d.querySelectorAll('[data-i]')];
 for(const c of cells.slice(0,31)){c.click();await new Promise(r=>setTimeout(r,30));res.push(d.getElementById('nTitle').textContent.replace('الليلة','').trim()+' → '+d.getElementById('fRise').textContent+' / '+d.getElementById('fSet').textContent);}return res;});
console.log(out.join('\n'));await b.close();})();
