global.localStorage={_d:{zijCountry:'MY'},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=v}};global.document={documentElement:{lang:'ar'},getElementById:()=>null,addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]};global.window=global;global.navigator={language:'ar',onLine:false};
const src=require('fs').readFileSync(__dirname+'/engroot.js','utf8');
(0,eval)(src+';global.__O=new Observer();global.__H=new HijriCalendar();global.__A=AstroMath;');
const o=__O; o.set(3.1390,101.6869,8,'Kuala Lumpur'); o.zone='Asia/Kuala_Lumpur';
console.error('method',o.calcMethod, typeof zijAutoMethod==='function'?zijAutoMethod():'');
const out=[];const K=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
for(let d=new Date(Date.UTC(2026,0,1,4));d.getUTCFullYear()===2026;d=new Date(d.getTime()+864e5)){
 const p=o.realPrayerTimes(d,__H.fromGregorian(d));
 out.push(d.toISOString().slice(0,10)+' '+K.map(k=>{const v=p[k];return v==null?'-':v.toFixed(4)}).join(' '));}
require('fs').writeFileSync(__dirname+'/zij_kl.txt',out.join('\n'));console.error(out[0],out[315]);
