/* fable · runs before any of beta's scripts.
   R8: the scripts that only draw (the home header and the prayer list) keep their own one-second timers, copied verbatim.
   This wrapper pauses those timers while the tab is hidden and runs them once the moment it is visible again,
   so nothing draws in a hidden tab and the first frame after sleep comes straight from the clock.
   Alerts, the adhan log and every other timer are left exactly as they are. */
(function(){
  var real=window.setInterval, realClear=window.clearInterval, DRAW={homeJs:1,shellJs:1}, list=[], seq=1e9;
  window.__zijBlock='';
  window.setInterval=function(fn,ms){
    if(typeof fn!=='function'||!DRAW[window.__zijBlock]||ms>1000) return real.apply(window,arguments);
    var r={fn:fn,ms:ms,id:null,key:++seq,dead:false};
    if(!document.hidden) r.id=real(fn,ms);
    list.push(r); return r.key;
  };
  window.clearInterval=function(id){
    for(var i=0;i<list.length;i++) if(list[i].key===id){ list[i].dead=true; if(list[i].id!=null) realClear(list[i].id); list.splice(i,1); return; }
    return realClear.call(window,id);
  };
  document.addEventListener('visibilitychange',function(){
    list.slice().forEach(function(r){
      if(r.dead) return;
      if(document.hidden){ if(r.id!=null){ realClear(r.id); r.id=null; } }
      else if(r.id==null){ try{ r.fn(); }catch(e){} if(!r.dead) r.id=real(r.fn,r.ms); }
    });
  });
  window.__fbTimers=function(){ return {paused:list.filter(function(r){return r.id==null;}).length, drawTimers:list.length}; };
})();
