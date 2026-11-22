const {chromium}=require('playwright');const S=(process.env.S||require('os').tmpdir())+'/zij-tests';require('fs').mkdirSync(S,{recursive:true});const URL=process.env.U||'http://localhost:8765/index.html';(async()=>{const b=await chromium.launch();let bad=0;
async function open(v,lang,iso){const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,timezoneId:'Asia/Riyadh',geolocation:{latitude:21.5433,longitude:39.1728},permissions:['geolocation']});
 await c.addInitScript(([v,lang])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s',1);const L=localStorage;L.setItem('zijWelcomed','1');L.setItem('zijEntryK','1');L.setItem('zijInstallHide','1');L.setItem('zijCountry','SA');L.setItem('zijLang',lang);
  if(v){if(/^[efg]$/.test(v)){L.setItem('zijHomeDesign',v);L.setItem('zijBetaVariant','orig');}else{L.setItem('zijHomeDesign','off');L.setItem('zijBetaVariant',v);}}},[v,lang]);
 await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();p.e=[];p.on('pageerror',x=>p.e.push(x.message));
 await p.clock.install({time:new Date(iso)});await p.goto(URL);await p.waitForTimeout(2500);await p.clock.runFor(4000);await p.waitForTimeout(500);return [c,p];}
for(const [v,lang,iso] of [['b','ar','2026-11-19T10:05:08+03:00'],['b','ar','2026-11-19T21:40:08+03:00'],['b','en','2026-11-19T10:05:08+03:00'],['orig','ar','2026-11-19T10:05:08+03:00'],['orig','en','2026-11-19T21:40:08+03:00'],['orig','ar','2026-11-19T17:45:00+03:00'],['e','ar','2026-11-19T21:40:08+03:00'],['f','ar','2026-11-19T10:05:08+03:00'],['f','en','2026-11-19T21:40:08+03:00'],['k','ar','2026-11-19T10:05:08+03:00'],['k','ar','2026-11-19T21:40:08+03:00'],['l','en','2026-11-19T10:05:08+03:00'],[null,'ar','2026-11-19T10:05:08+03:00']]){
 const [c,p]=await open(v,lang,iso);const tag=(v||'first')+'_'+lang+'_'+iso.slice(11,16).replace(':','');
 const r=await p.evaluate(()=>{const q=s=>document.querySelector(s);const vis=e=>e&&e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none';
  const z=q('#zTiles button.zij')||q('#zhd [data-a="zij"]');const zr=z&&z.getBoundingClientRect();const nav=q('.htab')||q('nav');
  return {cur:zijHome.current(),h:document.documentElement.scrollHeight,cdw:(q('#hCdW')&&!q('#hCdW').hidden)?q('#hCdW').textContent:'',cd:q('#hCd')&&q('#hCd').textContent,
   acts:[...document.querySelectorAll('#zhd .acts [data-a]')].map(x=>x.dataset.a).join(','),zijBottom:zr?Math.round(zr.bottom):null,glSky:vis(q('#glSky')),glCal:q('#glCal')?q('#glCal').innerHTML.slice(0,4):'',
   dialAsr:([...document.querySelectorAll('#zdStatic text')].map(x=>x.textContent)[7])||'',zcd:q('#hRow')?getComputedStyle(q('#hRow')).getPropertyValue('--zcd'):''};});
 console.log(tag,JSON.stringify(r),p.e.join('|'));if(p.e.length)bad++;await p.screenshot({path:`${S}/${tag}.png`});
 if(v==='e'||v==='f'){await p.click('#zhd .day');await p.waitForTimeout(500);console.log('  date→calendar',await p.evaluate(()=>!!document.querySelector('.zcal,#zCal,[id*=Cal][open],dialog[open]')||document.body.innerText.includes('التقويم')));}
 await c.close();}
// menu
{const [c,p]=await open('b','ar','2026-11-19T10:05:08+03:00');await p.click('.htab [data-go="more"]');await p.waitForTimeout(300);await p.evaluate(()=>{const d=document.getElementById('mHomeD');d.open=true;d.scrollIntoView();});await p.waitForTimeout(300);
 console.log('menu',await p.evaluate(()=>[...document.querySelectorAll('#mHome [data-hv]')].map(x=>x.dataset.hv).join(',')));await p.screenshot({path:`${S}/menu.png`});
 await p.click('.htab [data-go="sky"]');await p.waitForTimeout(2500);await p.clock.runFor(4000);console.log('sky curve',await p.evaluate(()=>{const b=document.getElementById('mod-sky').contentDocument.getElementById('zMoonCurve');return b?b.innerHTML.length:-1}));await c.close();}
// removed layouts still open for a phone that uses them
for(const v of ['a','c','g']){const [c,p]=await open(v,'ar','2026-11-19T10:05:08+03:00');console.log('kept',v,await p.evaluate(()=>zijHome.current()),p.e.join('|'));await c.close();}
console.log('pages with errors:',bad);await b.close();})();
