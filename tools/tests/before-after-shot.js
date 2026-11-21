// node shot.js <id> <v> <lang> <iso> [after.js]  → <id>_before.png / <id>_after.png
const {chromium}=require('playwright');const fs=require('fs');const D=(process.env.S||require('os').tmpdir())+'/zij-shots';fs.mkdirSync(D,{recursive:true});
const [id,v,lang,iso,afterFile]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();
async function shot(name,after){const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,timezoneId:'Asia/Riyadh',geolocation:{latitude:21.5433,longitude:39.1728},permissions:['geolocation']});
 await c.addInitScript(([v,lang])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s',1);const L=localStorage;L.setItem('zijWelcomed','1');L.setItem('zijInstallHide','1');L.setItem('zijCountry','SA');L.setItem('zijLang',lang);
  if(/^[efg]$/.test(v)){L.setItem('zijHomeDesign',v);L.setItem('zijBetaVariant','orig');}else{L.setItem('zijHomeDesign','off');L.setItem('zijBetaVariant',v);}},[v,lang]);
 await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();
 await p.clock.install({time:new Date(iso)});await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(2500);await p.clock.runFor(5000);await p.waitForTimeout(600);
 if(after){await p.evaluate(after);await p.waitForTimeout(600);}
 await p.screenshot({path:`${D}/${id}_${name}.png`});const h=await p.evaluate(()=>document.documentElement.scrollHeight);await c.close();return h;}
const h1=await shot('before',null);let h2='';if(afterFile)h2=await shot('after',fs.readFileSync(afterFile,'utf8'));
console.log(id,'heights',h1,h2);await b.close();})();
