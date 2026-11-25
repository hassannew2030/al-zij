/* Al-Zij — the iPhone app's privacy guard (Hassan's decision, 25 Nov 2026, table #98: «اكيد 💯»).
   Loaded right after Capacitor and before any of the page's own scripts, in the app only — the website is not touched,
   and a newer index.html downloaded by the silent updater gets this same guard (it is one of the native scripts).

   - Weather and air quality are not in the app for the launch (they return later from Apple's WeatherKit): their requests to
     Open-Meteo never leave the phone, and their panels are hidden — on the main page and in the Sky screen.
   - Place names come from Apple's own map service on the iPhone (the app's ZijGeocoder plugin → CLGeocoder), not from
     OpenStreetMap or BigDataCloud. Those two requests are answered here, on the phone, in their own JSON shape, so the page
     works unchanged. Apple: «You are not responsible for disclosing data collected by Apple.»
   - Every other request passes as before. The ones still waiting for Hassan's decision are listed in PENDING; moving a line
     from PENDING to BLOCK switches that request off in the app.
   - Links to the site's own pages (/privacy/, /support/ …) open on alzijapp.com in Safari instead of a blank page in the app. */
(function (root) {
  'use strict';
  var BLOCK = [
    /^https:\/\/api\.open-meteo\.com\/v1\/forecast/,                // weather (main page and Sky screen)
    /^https:\/\/air-quality-api\.open-meteo\.com\//                  // air quality
  ];
  var PENDING = [                                                    // allowed until Hassan decides (table #98)
    /^https:\/\/api\.aladhan\.com\//,                                // the daily check and the inspector's Qibla check
    /^https:\/\/api\.open-meteo\.com\/v1\/elevation/,               // height above sea level
    /^https:\/\/(ipwho\.is|ipapi\.co|get\.geojs\.io)\//,             // rough place from the IP when location is refused
    /^https:\/\/api\.sunrise-sunset\.org\//                          // «الميزان», only when the user runs it
  ];
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
    if (!P || !isFinite(+lat) || !isFinite(+lon)) return Promise.reject(new TypeError('Failed to fetch'));
    var call = new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new TypeError('Failed to fetch')); }, 12000);
      P.reverse({ lat: +lat, lon: +lon, lang: lang }).then(function (r) { clearTimeout(t); res(r || {}); },
        function (e) { clearTimeout(t); rej(new TypeError('Failed to fetch')); });
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
      var i;
      for (i = 0; i < BLOCK.length; i++) if (BLOCK[i].test(url)) return Promise.reject(new TypeError('Failed to fetch'));
      if (NOMINATIM.test(url)) return geocode(param(url, 'lat'), param(url, 'lon'), param(url, 'accept-language') || 'ar').then(function (p) { return answer(asNominatim(p)); });
      if (BDC.test(url)) return geocode(param(url, 'latitude'), param(url, 'longitude'), param(url, 'localityLanguage') || 'ar').then(function (p) { return answer(asBigDataCloud(p)); });
      return orig.apply(this, arguments);
    };
  }

  // ---- what is hidden in the app: the weather and air-quality panels ----
  var MAIN_WX = ['dataWeatherCondition', 'dataTemp', 'dataFeelsLike', 'dataHumidity', 'dataWind', 'dataUV', 'dataCloud', 'dataPressure', 'dataVisibility', 'dataAQI'];
  function hideMain(doc) {
    var shown = 0;
    MAIN_WX.forEach(function (id) { var el = doc.getElementById(id); if (el && el.parentElement) { el.parentElement.style.display = 'none'; shown++; } });
    if (!shown) return;
    // the «🌤️ الطقس» heading now only heads the elevation cell
    [].forEach.call(doc.querySelectorAll('h4'), function (h) { if (/الطقس/.test(h.textContent) && h.textContent.length < 30) h.textContent = 'الارتفاع'; });
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

  var api = { guard: guard, child: child, BLOCK: BLOCK, PENDING: PENDING, asNominatim: asNominatim, asBigDataCloud: asBigDataCloud, myRegion: myRegion };
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
