/* Al-Zij — silent web updates inside the iPhone app (no store release for web-only changes).

   How it works
   - The app always starts from the copy of Al-Zij bundled inside it (works with no network, first launch included).
   - In the background (Wi-Fi or data, never blocking anything) it reads https://alzijapp.com/version.json. If the site's build is
     newer, it downloads index.html, checks it is a real Al-Zij page, puts the native bridge into that copy, and saves a
     complete snapshot folder on the phone: the new index.html + the bundled fonts, icons, data, sounds and native scripts.
   - On the next launch, the bundled page sees a ready snapshot newer than itself and switches the web view to it
     (Capacitor WebView.setServerBasePath). Nothing is persisted on the native side, so a store update with a newer
     bundled build always wins, and a missing folder can never stop the app from opening.
   - Health check: if the snapshot page does not reach a working state within 20 s, it is marked bad and the app returns
     to the bundled copy; that build is never tried again.
   - Only index.html comes from the site; fonts and data come from the app itself. If the site ever changes fonts or the
     data/uq tables, those reach the app with the next store release (or extend this with a file list on the site).
   - A snapshot is tied to the native build that made it (ZIJ_NATIVE_CFG.native): after a store update it is rebuilt. */
(function () {
  'use strict';
  if (!window.ZIJ_NATIVE) return;
  var Cap = window.Capacitor, CFG = window.ZIJ_NATIVE_CFG || {};
  var SITE = CFG.site || 'https://alzijapp.com';
  var P = function (n) { try { return (Cap.Plugins && Cap.Plugins[n]) || Cap.registerPlugin(n); } catch (e) { return null; } };
  var FS = P('Filesystem'), WV = P('WebView'), HTTP = P('CapacitorHttp');
  var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
             set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
             del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };
  var KEY = 'zijLiveSnap', BAD = 'zijLiveBad', DIR = 'LIBRARY_NO_CLOUD', ROOT = 'zij-web';
  var log = function () { try { console.log.apply(console, ['[zij-update]'].concat([].slice.call(arguments))); } catch (e) {} };
  var snap = null; try { snap = JSON.parse(LS.get(KEY) || 'null'); } catch (e) {}
  var bad = (LS.get(BAD) || '').split(',');
  var num = function (s) { return +s || 0; };

  /* ---- A · running from a snapshot: health check, roll back if it does not come up ---- */
  if (CFG.snapshot) {
    var t0 = Date.now();
    (function check() {
      var ok = typeof window.observer !== 'undefined' && window.observer && typeof observer.realPrayerTimes === 'function' && document.getElementById('pAlert');
      if (ok) { LS.set('zijLiveOK', CFG.snapshot); return; }
      if (Date.now() - t0 > 20000) {
        log('snapshot', CFG.snapshot, 'did not start — back to the bundled copy');
        bad.push(String(CFG.snapshot)); LS.set(BAD, bad.join(',')); LS.del(KEY);
        if (WV) WV.setServerAssetPath({ path: 'public' });
        return;
      }
      setTimeout(check, 500);
    })();
    window.addEventListener('load', function () { setTimeout(maybeDownload, 8000); });
    return;
  }

  /* ---- B · running from the bundle: switch to a ready, newer snapshot (once per launch) ---- */
  var usable = snap && snap.path && snap.native === CFG.native && num(snap.build) > num(CFG.build) && bad.indexOf(String(snap.build)) === -1;
  if (usable && WV && !sessionStorage.getItem('zijLiveTried')) {
    try { sessionStorage.setItem('zijLiveTried', '1'); } catch (e) {}
    WV.setServerBasePath({ path: snap.path }).catch(function (e) { log('switch failed', e && e.message); });
    return;   // the web view reloads from the snapshot; its own copy of this script carries on
  }
  window.addEventListener('load', function () { setTimeout(maybeDownload, 8000); });

  /* ---- C · look for a newer build on the site and prepare it for the next launch ---- */
  function getText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .catch(function (e) {   // GitHub Pages normally allows this; native HTTP as a fallback
        if (!HTTP) throw e;
        return HTTP.get({ url: url, responseType: 'text' }).then(function (r) { if (r.status !== 200) throw new Error('HTTP ' + r.status); return typeof r.data === 'string' ? r.data : JSON.stringify(r.data); });
      });
  }
  function valid(html, build) {
    return html.length > 200000 && window.ZijInject.buildOf(html) === build &&
      /<meta charset/i.test(html) && html.indexOf('id="alertsJs"') !== -1 && html.indexOf('realPrayerTimes') !== -1 && html.indexOf('window.zijUQ') !== -1 &&
      /<\/html>\s*$/i.test(html);
  }
  function b64(blob) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1] || ''); }; fr.onerror = rej; fr.readAsDataURL(blob); });
  }
  var running = false;
  function maybeDownload() {
    if (running || !FS || !WV || !navigator.onLine) return;
    var last = num(LS.get('zijLiveCheck'));
    if (Date.now() - last < 6 * 3600e3) return;      // at most every 6 hours
    running = true; LS.set('zijLiveCheck', String(Date.now()));
    var target;
    getText(SITE + '/version.json?t=' + Date.now()).then(function (t) {
      target = String((JSON.parse(t) || {}).build || '');
      var have = Math.max(num(CFG.build), snap && snap.native === CFG.native ? num(snap.build) : 0);
      if (!target || num(target) <= have || bad.indexOf(target) !== -1) throw 'up-to-date';
      return getText(SITE + '/index.html?t=' + Date.now());
    }).then(function (html) {
      if (!valid(html, target)) throw new Error('downloaded page failed the checks');
      var cfg = {}; for (var k in CFG) cfg[k] = CFG[k];
      cfg.build = target; cfg.snapshot = target;
      var page = window.ZijInject.inject(html, cfg);
      var dir = ROOT + '/' + target;
      return fetch('native/files.json').then(function (r) { return r.json(); }).then(function (files) {
        // copy the app's own files one by one (fonts, icons, data, sounds, native scripts); index.html comes from the site
        var i = 0;
        function next() {
          if (i >= files.length) return Promise.resolve();
          var f = files[i++];
          if (f === 'index.html') return next();
          return fetch(f).then(function (r) { if (!r.ok) throw new Error('missing ' + f); return r.blob(); }).then(b64)
            .then(function (data) { return FS.writeFile({ path: dir + '/' + f, data: data, directory: DIR, recursive: true }); }).then(next);
        }
        return next();
      }).then(function () {
        return FS.writeFile({ path: dir + '/index.html', data: page, directory: DIR, encoding: 'utf8', recursive: true });
      }).then(function () { return FS.getUri({ path: dir, directory: DIR }); })
        .then(function (u) {
          var path = decodeURIComponent(String(u.uri).replace(/^file:\/\//, ''));
          var old = snap;
          snap = { build: target, path: path, native: CFG.native, at: Date.now() };
          LS.set(KEY, JSON.stringify(snap));
          log('snapshot', target, 'ready for the next launch');
          // remove older snapshots, never the one this page might be running from
          if (old && old.build && old.build !== target && String(old.build) !== String(CFG.snapshot || '')) {
            FS.rmdir({ path: ROOT + '/' + old.build, directory: DIR, recursive: true }).catch(function () {});
          }
        });
    }).catch(function (e) { if (e !== 'up-to-date') log('no update:', e && e.message ? e.message : e); })
      .then(function () { running = false; });
  }
})();
