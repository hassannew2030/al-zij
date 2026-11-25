/* Al-Zij — the iPhone app's privacy guard (Hassan's decision, 25 Nov 2026, table #98: «اكيد 💯»).
   Loaded right after Capacitor and before any of the page's own scripts, in the app only — the website is not touched,
   and a newer index.html downloaded by the silent updater gets this same guard (it is one of the native scripts).

   - Weather and air quality are not in the app for the launch (they return later from Apple's WeatherKit): their requests to
     Open-Meteo never leave the phone, and their panels are hidden — on the main page and in the Sky screen.
   - Place names come from Apple's own map service on the iPhone (the app's ZijGeocoder plugin → CLGeocoder), not from
     OpenStreetMap or BigDataCloud. Those two requests are answered here, on the phone, in their own JSON shape, so the page
     works unchanged. Apple: «You are not responsible for disclosing data collected by Apple.»
   - Hassan, 25 Nov 2026 9:27 pm, option (أ), on the hadith's rule «دع ما يريبك إلى ما لا يريبك»: nothing else leaves the app on its
     own. Only the app's own files and alzijapp.com (the page's updates, the phone-clock check) pass; every other address is refused
     here — Aladhan, Open-Meteo (elevation, city search), the IP-location services, sunrise-sunset.org, and anything added later.
     A city is searched with Apple's map service (forward), and «allow location» opens the app's page in Settings (openSettings).
   - Links to the site's own pages (/privacy/, /support/ …) open on alzijapp.com in Safari instead of a blank page in the app. */
(function (root) {
  'use strict';
  var SITE_RE = /^https:\/\/alzijapp\.com(\/|$)/;                  // the page's updates and the phone-clock check: no user data
  var blocked = [];                                                  // what was refused this launch (host only), for «عندي مشكلة»
  var NOMINATIM = /^https:\/\/nominatim\.openstreetmap\.org\/reverse\?/;
  var BDC = /^https:\/\/api\.bigdatacloud\.net\/data\/reverse-geocode-client\?/;
  var SITE = ((root.ZIJ_NATIVE_CFG || {}).site || 'https://alzijapp.com').replace(/\/+$/, '');

  // Malaysia: the JAKIM zones are chosen by state (ISO 3166-2:MY), which OpenStreetMap gave as 'ISO3166-2-lvl4'
  var MY = [['MY-01', /johor/], ['MY-02', /kedah/], ['MY-03', /kelantan/], ['MY-04', /melaka|malacca/], ['MY-05', /negeri sembilan/],
            ['MY-06', /pahang/], ['MY-07', /pinang|penang/], ['MY-08', /perak/], ['MY-09', /perlis/], ['MY-10', /selangor/],
            ['MY-11', /terengganu/], ['MY-12', /sabah/], ['MY-13', /sarawak/], ['MY-14', /kuala lumpur/], ['MY-15', /labuan/],
            ['MY-16', /putrajaya/]];
  function myRegion(p) {
    if (String(p.countryCode || '').toUpperCase() !== 'MY') return '';
    var a = String(p.admin || '').toLowerCase();
    for (var i = 0; i < MY.length; i++) if (MY[i][1].test(a)) return MY[i][0];
    return '';
  }
  // the app's own files: a relative address, or the app's own origin (capacitor://localhost), data: and blob:
  function own(url, win) {
    if (/^(data|blob):/i.test(url)) return true;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url) && url.slice(0, 2) !== '//') return true;
    try { var o = (win && win.location && win.location.origin) || ''; return !!o && o !== 'null' && url.indexOf(o + '/') === 0; } catch (e) { return false; }
  }
  function allowed(url, win) { return own(url, win) || SITE_RE.test(url) || url.indexOf(SITE + '/') === 0; }
  function param(url, k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(url); return m ? decodeURIComponent(m[1]) : ''; }

  // ---- Apple's map service, through the app's own plugin (one answer per spot and language, kept for this launch) ----
  var memo = {};
  function plugin() {
    var Cap = root.Capacitor || (typeof globalThis !== 'undefined' && globalThis.Capacitor);
    if (!Cap) return null;
    try {
      if (Cap.Plugins && Cap.Plugins.ZijGeocoder) return Cap.Plugins.ZijGeocoder;
      if (!Cap.registerPlugin) return null;
      if (plugin.cap !== Cap) { plugin.cap = Cap; plugin.p = Cap.registerPlugin('ZijGeocoder'); }   // registered once
      return plugin.p;
    } catch (e) { return null; }
  }
  function geocode(lat, lon, lang) {
    var key = (+lat).toFixed(4) + ',' + (+lon).toFixed(4) + '|' + lang;
    if (memo[key]) return memo[key];
    var P = plugin();
    // a failure says why (it reaches the «عندي مشكلة» report as «OSM: Apple: …»), but always as a network-style TypeError
    if (!P) return Promise.reject(new TypeError('Apple: no ZijGeocoder plugin'));
    if (!isFinite(+lat) || !isFinite(+lon)) return Promise.reject(new TypeError('Apple: no coordinates'));
    var call = new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new TypeError('Apple: no answer in 12 s')); }, 12000);
      P.reverse({ lat: +lat, lon: +lon, lang: lang }).then(function (r) { clearTimeout(t); res(r || {}); },
        function (e) { clearTimeout(t); rej(new TypeError('Apple: ' + ((e && (e.code || e.message)) || 'failed'))); });
    });
    memo[key] = call;
    call.catch(function () { delete memo[key]; });   // a failed answer is asked again next time
    return call;
  }
  function asNominatim(p) {
    var region = myRegion(p);
    var a = { city: p.city || '', neighbourhood: p.hood || '', suburb: p.hood || '', district: p.subAdmin || '', county: p.subAdmin || '',
              state: p.admin || '', country: p.country || '', country_code: String(p.countryCode || '').toLowerCase() };
    if (region) a['ISO3166-2-lvl4'] = region;
    return { zijSource: 'apple', address: a };
  }
  function asBigDataCloud(p) {
    return { zijSource: 'apple', city: p.city || '', locality: p.hood || p.city || '', countryCode: String(p.countryCode || '').toUpperCase(),
             countryName: p.country || '', principalSubdivision: p.admin || '', principalSubdivisionCode: myRegion(p),
             localityInfo: { administrative: [], informative: [] } };
  }

  function guard(win) {
    if (!win || win.__zijGuard || typeof win.fetch !== 'function') return;
    win.__zijGuard = true;
    var orig = win.fetch;
    var answer = function (obj) {
      var R = win.Response || root.Response;
      return new R(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    win.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || String(input);
      if (NOMINATIM.test(url)) return geocode(param(url, 'lat'), param(url, 'lon'), param(url, 'accept-language') || 'ar').then(function (p) { return answer(asNominatim(p)); });
      if (BDC.test(url)) return geocode(param(url, 'latitude'), param(url, 'longitude'), param(url, 'localityLanguage') || 'ar').then(function (p) { return answer(asBigDataCloud(p)); });
      if (allowed(url, win)) return orig.apply(this, arguments);
      var host = (/^[a-z]+:\/\/([^\/?#]+)/i.exec(url) || [])[1] || url.slice(0, 40);
      if (blocked.indexOf(host) === -1 && blocked.length < 20) blocked.push(host);
      return Promise.reject(new TypeError('Failed to fetch'));
    };
  }

  // ---- a city by name, from Apple's map service (the same service that names the district) ----
  function forward(q, lang) {
    var P = plugin();
    if (!P || !P.forward) return Promise.reject(new TypeError('Apple: no ZijGeocoder plugin'));
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new TypeError('Apple: no answer in 12 s')); }, 12000);
      P.forward({ q: String(q || ''), lang: lang || 'ar' }).then(function (r) { clearTimeout(t); res((r && r.results) || []); },
        function (e) { clearTimeout(t); rej(new TypeError('Apple: ' + ((e && (e.code || e.message)) || 'failed'))); });
    });
  }
  // «allow location»: the app's own page in the iPhone's Settings
  function openSettings() {
    var P = plugin();
    if (!P || !P.openSettings) return Promise.reject(new TypeError('no plugin'));
    return P.openSettings();
  }

  // ---- what is hidden in the app: the weather and air-quality panels ----
  var MAIN_WX = ['dataWeatherCondition', 'dataTemp', 'dataFeelsLike', 'dataHumidity', 'dataWind', 'dataUV', 'dataCloud', 'dataPressure', 'dataVisibility', 'dataAQI', 'dataElevation'];
  function hideMain(doc) {
    var shown = 0;
    MAIN_WX.forEach(function (id) { var el = doc.getElementById(id); if (el && el.parentElement) { el.parentElement.style.display = 'none'; shown++; } });
    if (!shown) return;
    // nothing is left under the «🌤️ الطقس» heading (elevation went too, 25 Nov): hide the heading and its empty grid
    [].forEach.call(doc.querySelectorAll('h4'), function (h) {
      if (/الطقس|Weather|الارتفاع|Elevation/.test(h.textContent) && h.textContent.length < 30) {
        h.style.display = 'none';
        var g = h.nextElementSibling; if (g && g.querySelector('#dataElevation')) g.style.display = 'none';
      }
    });
  }
  var SKY_CSS = 'section.card:has(#wx),#cloudTonight,.eve-cloud{display:none!important}';
  function hideSky(doc) {
    // the line that says weather comes from Open-Meteo
    [].forEach.call(doc.querySelectorAll('li'), function (li) { if (/Open-Meteo/.test(li.textContent)) li.style.display = 'none'; });
  }
  // the Sky and Qibla screens are iframes written from the page (iframe.srcdoc): give each one the same guard before its own scripts
  function wrapSrcdoc(win) {
    var IF = win.HTMLIFrameElement && win.HTMLIFrameElement.prototype;
    var d = IF && Object.getOwnPropertyDescriptor(IF, 'srcdoc');
    if (!d || !d.set || IF.__zijSrcdoc) return;
    IF.__zijSrcdoc = true;
    var head = '<script>try{parent.ZijPrivacy&&parent.ZijPrivacy.child(window)}catch(e){}<\/script><style>' + SKY_CSS + '</style>';
    Object.defineProperty(IF, 'srcdoc', {
      configurable: true, enumerable: d.enumerable, get: d.get,
      set: function (h) {
        if (typeof h === 'string' && h.indexOf('ZijPrivacy') === -1) {
          var m = /<meta charset=["']?utf-8["']?\s*\/?>/i.exec(h);
          h = m ? h.slice(0, m.index + m[0].length) + head + h.slice(m.index + m[0].length) : head + h;
        }
        return d.set.call(this, h);
      }
    });
  }
  function child(win) {
    guard(win);
    var doc = win.document;
    var go = function () { try { hideSky(doc); } catch (e) {} };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', go); else go();
  }
  // the site's own pages: open them on alzijapp.com (Safari), not inside the app where they do not exist
  function links(doc) {
    doc.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="/"]') : null;
      if (!a || /^\/\//.test(a.getAttribute('href'))) return;
      e.preventDefault();
      root.location.href = SITE + a.getAttribute('href');
    }, true);
  }

  var api = { guard: guard, child: child, allowed: allowed, forward: forward, openSettings: openSettings, blocked: blocked, version: 2,
              asNominatim: asNominatim, asBigDataCloud: asBigDataCloud, myRegion: myRegion };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.ZijPrivacy = api;
  if (!root.ZIJ_NATIVE_CFG) return;          // only inside the app
  guard(root);
  wrapSrcdoc(root);
  links(root.document);
  var ready = function () { try { hideMain(root.document); } catch (e) {} };
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', ready); else ready();
  root.addEventListener('load', ready);
})(typeof window !== 'undefined' ? window : this);
