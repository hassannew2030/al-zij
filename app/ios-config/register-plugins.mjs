// Al-Zij — register the app's own native plugin the same way Capacitor registers the npm plugins (run after `npx cap sync ios`).
// Why (25 Nov 2026): on Hassan's iPhone every Apple place-name call came back «UNIMPLEMENTED» — the page could not see the
// ZijGeocoder plugin that ZijViewController registers in capacitorDidLoad(). The npm plugins (notifications …), which work,
// are listed in the app's capacitor.config.json «packageClassList» and registered by the bridge itself at start-up; ZijGeocoder
// goes in that list too. ZijViewController keeps its own registration as a second way in (a repeat only logs a line).
import fs from 'node:fs';
const f = 'ios/App/App/capacitor.config.json';
const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
const list = new Set(cfg.packageClassList || []);
for (const c of ['ZijGeocoderPlugin']) list.add(c);   // the @objc runtime name of the Swift class
cfg.packageClassList = [...list];
fs.writeFileSync(f, JSON.stringify(cfg, null, '\t') + '\n');
const back = JSON.parse(fs.readFileSync(f, 'utf8')).packageClassList || [];
if (!back.includes('ZijGeocoderPlugin')) { console.error('::error::ZijGeocoderPlugin is not in packageClassList'); process.exit(1); }
console.log('packageClassList:', back.join(', '));
