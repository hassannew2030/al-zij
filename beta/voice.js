/* الساعة الناطقة (نسخة التجربة) — صوت رجل عربي يعلن الوقت والتاريخ:
   ١٢:٠٠ ظهرًا · ٣:٠٠ عصرًا · ٩:٠٠ مساءً · ١٢:٠٠:٠٢ ليلًا (رسالة يوم جديد)
   مغلقة افتراضيًا؛ تُفعَّل من تبويب الصلاة. تعمل على الجوال نفسه دون إنترنت ما دام الزيج مفتوحًا
   (والجوال مقفول تأتي مع تطبيق المتجر). */
(function () {
  var KEY = 'zijVoiceClock', DONE = 'zijVoiceDone';
  var SLOTS = [
    { h: 12, m: 0, s: 0, id: 'noon', say: 'الساعة الآن الثانية عشرة ظهرًا' },
    { h: 15, m: 0, s: 0, id: 'asr3', say: 'الساعة الآن الثالثة عصرًا' },
    { h: 21, m: 0, s: 0, id: 'eve9', say: 'الساعة الآن التاسعة مساءً' },
    { h: 0, m: 0, s: 2, id: 'newday', say: null }
  ];
  function on() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setOn(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }
  function done(k) { try { return localStorage.getItem(DONE) === k; } catch (e) { return false; } }
  function mark(k) { try { localStorage.setItem(DONE, k); } catch (e) {} }

  function dates(d) {
    var wd = '', hj = '', gr = '';
    try { wd = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(d); } catch (e) {}
    try { hj = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s*هـ$/, '') + ' للهجرة'; } catch (e) {}
    try { gr = new Intl.DateTimeFormat('ar-EG-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) + ' ميلادي'; } catch (e) {}
    return { wd: wd, hj: hj, gr: gr };
  }
  function text(slot, d) {
    var x = dates(d);
    if (slot.id === 'newday') return 'بسم الله. بدأ يوم جديد: ' + x.wd + '، ' + x.hj + '، الموافق ' + x.gr + '. الساعة الآن الثانية عشرة ليلًا.';
    return slot.say + '. اليوم ' + x.wd + '، ' + x.hj + '، الموافق ' + x.gr + '.';
  }
  var voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    var vs = speechSynthesis.getVoices().filter(function (v) { return /^ar/i.test(v.lang); });
    var male = vs.filter(function (v) { return /maged|majed|tarik|hamed|naayf|shakir|male|رجل/i.test(v.name); });
    voice = male[0] || vs.filter(function (v) { return /SA/i.test(v.lang); })[0] || vs[0] || null;
    return voice;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(t) {
    if (!('speechSynthesis' in window)) return false;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.lang = 'ar-SA'; if (voice || pickVoice()) u.voice = voice;
      u.rate = 0.92; u.pitch = 0.85;
      speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  }
  window.zijVoiceClock = { speak: speak, text: text, slots: SLOTS };

  function check() {
    if (!on()) return;
    var d = new Date(), H = d.getHours(), M = d.getMinutes(), S = d.getSeconds();
    SLOTS.forEach(function (sl) {
      if (H === sl.h && M === sl.m && S >= sl.s && S < sl.s + 30) {
        var k = d.toDateString() + '|' + sl.id;
        if (!done(k)) { mark(k); speak(text(sl, d)); }
      }
    });
  }
  setInterval(check, 1000);

  function card() {
    var host = document.getElementById('pAlert');
    if (!host || document.getElementById('zVoiceCard')) return;
    var c = document.createElement('div');
    c.className = 'z-card'; c.id = 'zVoiceCard';
    var hasVoice = 'speechSynthesis' in window;
    c.innerHTML = '<h3>🗣️ الساعة الناطقة</h3>' +
      '<div style="color:var(--h-dim);font-size:15px;line-height:1.8">صوت رجل يعلن الوقت مع اليوم والتاريخين الهجري والميلادي: ' +
      '<b style="color:var(--h-brass-l)">١٢ ظهرًا · ٣ عصرًا · ٩ مساءً</b>، وعند منتصف الليل رسالة «يوم جديد».</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<button type="button" class="z-btn" id="zVoiceTgl"></button>' +
      '<button type="button" class="z-btn" id="zVoiceTry">▶︎ جرّب الآن</button></div>' +
      '<div id="zVoiceNote" style="color:var(--h-dim);font-size:13px;margin-top:8px">' +
      (hasVoice ? 'يعمل على جوالك دون إنترنت ما دام الزيج مفتوحًا. والإعلان والجوال مقفول يأتي مع تطبيق الزيج في المتجر قريبًا.' : 'هذا المتصفح لا يدعم الصوت.') + '</div>';
    var box = host.closest('.z-card');
    (box && box.parentNode ? box.parentNode : host.parentNode).insertBefore(c, box ? box.nextSibling : host.nextSibling);
    var tgl = c.querySelector('#zVoiceTgl');
    function paint() { tgl.textContent = on() ? '✅ مفعّلة — اضغط للإيقاف' : '⭕ متوقفة — اضغط للتفعيل'; tgl.style.borderColor = on() ? 'var(--h-brass)' : ''; }
    tgl.onclick = function () { setOn(!on()); paint(); if (on()) speak('تم تفعيل الساعة الناطقة'); };
    c.querySelector('#zVoiceTry').onclick = function () { speak(text(SLOTS[0], new Date())); };
    paint();
  }
  var tries = 0, t = setInterval(function () { card(); if (document.getElementById('zVoiceCard') || ++tries > 40) clearInterval(t); }, 500);
})();
