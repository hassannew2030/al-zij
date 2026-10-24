/* Al-Zij — puts the native bridge into a COPY of the web app's index.html.
   Used twice: by app/scripts/bundle-web.mjs (the copy bundled inside the app) and by zij-live-update.js (a newer index.html
   downloaded from alzijapp.com). The live site's own index.html is never touched. */
(function (root) {
  'use strict';
  var MARK = '<!-- zij-native -->';
  // load order matters: Capacitor core (registerPlugin), the three plugins, the planner, the bridge, this injector (for the updater), the updater
  var SCRIPTS = ['native/capacitor.js', 'native/app.js', 'native/local-notifications.js', 'native/filesystem.js',
                 'native/zij-schedule.js', 'native/zij-native.js', 'native/zij-inject.js', 'native/zij-live-update.js'];

  function inject(html, cfg) {
    if (typeof html !== 'string' || html.indexOf(MARK) !== -1) return html;
    var m = /<meta charset=["']?utf-8["']?\s*\/?>/i.exec(html);
    if (!m) throw new Error('index.html: <meta charset> not found');
    var tags = MARK + '\n<script>window.ZIJ_NATIVE_CFG=' + JSON.stringify(cfg || {}).replace(/</g, '\\u003c') + ';</script>\n' +
      SCRIPTS.map(function (s) { return '<script src="' + s + '"></script>'; }).join('\n') + '\n';
    var at = m.index + m[0].length;
    return html.slice(0, at) + '\n' + tags + html.slice(at);
  }
  // the build stamp the page carries (window.ZIJ_BUILD="…"), or ''
  function buildOf(html) { var m = /window\.ZIJ_BUILD\s*=\s*["'](\d+)["']/.exec(html || ''); return m ? m[1] : ''; }

  var api = { inject: inject, buildOf: buildOf, MARK: MARK, SCRIPTS: SCRIPTS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZijInject = api;
})(typeof window !== 'undefined' ? window : this);
