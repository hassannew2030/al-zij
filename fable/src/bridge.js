/* fable · the engine's ClockRenderer is kept for its numbers (updateDataPanel feeds «كل الأرقام», الميزان and the diagnostics).
   Its tick() drew beta's old dial; here tick() hands over to the new renderers (FB.frame, defined in fableJs).
   The class itself is untouched: this replaces the method on the one instance only. */
renderer.tick = function(){ try{ if (window.FB && FB.frame) FB.frame(true); }catch(e){ console.error('fable frame', e); } };
