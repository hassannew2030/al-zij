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
    var score = function (v) { var n = v.name; return (/enhanced|premium|محسّن|محسن|siri/i.test(n) ? 10 : 0) + (/maged|majed|tarik|hamed|naayf|shakir|male/i.test(n) ? 5 : 0) + (/SA/i.test(v.lang) ? 2 : 0) + (v.localService ? 1 : 0); };
    vs.sort(function (a, b) { return score(b) - score(a); });
    voice = vs[0] || null;
    return voice;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  // short sentences, natural speed and pitch: iPhone voices stutter on long utterances and sound robotic when the pitch is changed
  function speak(t) {
    if (!('speechSynthesis' in window)) return false;
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      var v = voice || pickVoice();
      var parts = String(t).split(/(?<=[.،:])\s+/).map(function (x) { return x.trim(); }).filter(Boolean);
      parts.forEach(function (p) {
        var u = new SpeechSynthesisUtterance(p);
        u.lang = (v && v.lang) || 'ar-SA'; if (v) u.voice = v;
        u.rate = 1; u.pitch = 1; u.volume = 1;
        speechSynthesis.speak(u);
      });
      return true;
    } catch (e) { return false; }
  }
  function voiceName() { var v = voice || pickVoice(); return v ? v.name : ''; }

  /* ---- صوت «كريم» المسجّل مسبقًا: ملفات قصيرة تُركّب منها الجملة (دون إنترنت) ---- */
  var VKEY = 'zijVoiceEngine'; // 'clips' (default) | 'tts'
  function engine() { try { return localStorage.getItem(VKEY) || 'clips'; } catch (e) { return 'clips'; } }
  function setEngine(v) { try { localStorage.setItem(VKEY, v); } catch (e) {} }
  var AC = null, BUF = {};
  function ctx() { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } return AC; }
  function load(id) {
    if (BUF[id]) return BUF[id];
    BUF[id] = fetch('beta/voice/' + id + '.m4a').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(function (a) { return new Promise(function (ok, no) { ctx().decodeAudioData(a, ok, no); }); });
    return BUF[id];
  }
  function parts(d) {
    var hp = {}, gp = { d: d.getDate(), m: d.getMonth() + 1, y: d.getFullYear() };
    try { new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d)
      .forEach(function (x) { if (x.type === 'day') hp.d = +x.value; if (x.type === 'month') hp.m = +x.value; if (x.type === 'year') hp.y = parseInt(x.value, 10); }); } catch (e) {}
    return { w: d.getDay(), h: hp, g: gp };
  }
  function seq(slot, d) {
    var p = parts(d), date = ['today', 'w' + p.w, 'd' + p.h.d, 'min', 'h' + p.h.m, 'hy' + p.h.y, 'muwafiq', 'd' + p.g.d, 'min', 'g' + p.g.m, 'gy' + p.g.y];
    var T = { noon: 't12n', asr3: 't3a', eve9: 't9m' };
    if (slot.id === 'newday') return ['newday'].concat(date, ['now', 't12l']);
    return ['now', T[slot.id]].concat(date);
  }
  function playClips(ids) {
    var c = ctx(); if (!c) return Promise.reject();
    if (c.state === 'suspended') c.resume();
    return Promise.all(ids.map(load)).then(function (bufs) {
      var t = c.currentTime + 0.08, GAP = 0.12;
      bufs.forEach(function (b) { var s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(t); t += b.duration + GAP; });
      return true;
    });
  }
  function announce(slot, d) {
    if (engine() === 'clips') {
      return playClips(seq(slot, d)).catch(function () { speak(text(slot, d)); });
    }
    speak(text(slot, d));
  }
  // unlock audio on the first tap anywhere (iPhone needs a touch before sound)
  document.addEventListener('touchend', function u() { try { var c = ctx(); c && c.resume(); } catch (e) {} document.removeEventListener('touchend', u); }, { once: true });
  window.zijVoiceClock = { speak: speak, text: text, slots: SLOTS, voiceName: voiceName, seq: seq, announce: announce };

  function check() {
    if (!on()) return;
    var d = new Date(), H = d.getHours(), M = d.getMinutes(), S = d.getSeconds();
    SLOTS.forEach(function (sl) {
      if (H === sl.h && M === sl.m && S >= sl.s && S < sl.s + 30) {
        var k = d.toDateString() + '|' + sl.id;
        if (!done(k)) { mark(k); announce(sl, d); }
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
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center"><span style="color:var(--h-dim);font-size:14px">الصوت:</span>' +
      '<button type="button" class="z-btn" data-eng="clips" data-lbl="كريم (مسجّل)"></button>' +
      '<button type="button" class="z-btn" data-eng="tts" data-lbl="صوت الجوال"></button></div>' +
      '<div id="zVoiceNote" style="color:var(--h-dim);font-size:13px;margin-top:8px">' +
      '<div style="color:var(--h-ink);font-size:14px;margin-bottom:6px">🔊 لصوت أوضح: الإعدادات ← تسهيلات الاستخدام ← المحتوى المنطوق ← الأصوات ← العربية ← نزّل <b>«ماجد (محسّن)»</b>. الصوت الحالي: <span id="zVoiceNm">—</span></div>' +
      (hasVoice ? 'يعمل على جوالك دون إنترنت ما دام الزيج مفتوحًا. والإعلان والجوال مقفول يأتي مع تطبيق الزيج في المتجر قريبًا.' : 'هذا المتصفح لا يدعم الصوت.') + '</div>';
    var box = host.closest('.z-card');
    (box && box.parentNode ? box.parentNode : host.parentNode).insertBefore(c, box ? box.nextSibling : host.nextSibling);
    var tgl = c.querySelector('#zVoiceTgl');
    function paint() { tgl.textContent = on() ? '✅ مفعّلة — اضغط للإيقاف' : '⭕ متوقفة — اضغط للتفعيل'; tgl.style.borderColor = on() ? 'var(--h-brass)' : ''; }
    tgl.onclick = function () { setOn(!on()); paint(); if (on()) { try { ctx() && ctx().resume(); } catch (e) {} } };
    c.querySelector('#zVoiceTry').onclick = function () { announce(SLOTS[0], new Date()); };
    c.querySelectorAll('[data-eng]').forEach(function (b) { b.onclick = function () { setEngine(b.dataset.eng); paintEng(); }; });
    function paintEng() { c.querySelectorAll('[data-eng]').forEach(function (b) { var on2 = b.dataset.eng === engine(); b.style.borderColor = on2 ? 'var(--h-brass)' : ''; b.style.color = on2 ? 'var(--h-brass-l)' : ''; b.textContent = (on2 ? '● ' : '○ ') + b.dataset.lbl; }); }
    paintEng();
    paint();
    var nm = c.querySelector('#zVoiceNm'); var upd = function () { nm.textContent = voiceName() || 'غير متوفر'; }; upd(); setTimeout(upd, 1500);
  }
  var tries = 0, t = setInterval(function () { card(); if (document.getElementById('zVoiceCard') || ++tries > 40) clearInterval(t); }, 500);
})();
