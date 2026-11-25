#!/usr/bin/env node
/* Al-Zij — copies the web app into app/www for the iPhone app (offline, from bundled files).
   The repo root (the live site) is only READ. Only the COPY of index.html gets the native bridge (zij-inject.js).

   node app/scripts/bundle-web.mjs            → app/www
   ZIJ_SITE=https://alzijapp.com  (default)   — where silent web updates come from */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(APP, '..');
const OUT = path.join(APP, 'www');
const SRC = path.join(APP, 'www-src');
const { inject, buildOf } = require(path.join(SRC, 'zij-inject.js'));
const pkg = JSON.parse(fs.readFileSync(path.join(APP, 'package.json'), 'utf8'));

// what the page needs at run time — read from index.html itself, so a new script on the site can never be left out (review 18 Nov, item 1):
// every <script src> it loads (variants.js, voice.js, home-designs.js, dial24.js …), plus the folders it fetches:
// data/uq (Umm al-Qura tables; the year files are for tools), data/my (JAKIM, Malaysia; raw/ is for tools), voice/ (the talking clock)
const PAGE = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const pageScripts = html => [...new Set([...html.matchAll(/<script\b[^>]*\bsrc=["']([^"'?#:]+)(?:\?[^"']*)?["']/gi)].map(m => m[1]))];
const COPY = ['manifest.json', 'version.json', 'fonts', 'icons', 'data/uq/index.json', 'data/uq/c', 'data/my/index.json', 'data/my/z', 'voice',
  ...pageScripts(PAGE)];
const SKIP = /(^|\/)(OFL-[^/]*\.txt|\.DS_Store)$/;

function copy(rel) {
  const from = path.join(ROOT, rel), to = path.join(OUT, rel);
  const st = fs.statSync(from);
  if (st.isDirectory()) { for (const f of fs.readdirSync(from)) copy(path.join(rel, f)); return; }
  if (SKIP.test(rel) && !/fonts\/OFL-(Amiri|EBGaramond)\.txt$/.test(rel)) return;   // keep the licences of the fonts actually used
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
function nodeModule(spec, file) {
  // Capacitor's browser builds (IIFE), copied so the bundled page needs no build step and no network
  const p = require.resolve(spec + '/package.json', { paths: [APP] });
  return path.join(path.dirname(p), file);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'native'), { recursive: true });
COPY.forEach(copy);

// native scripts
const natives = [
  ['@capacitor/core', 'dist/capacitor.js', 'capacitor.js'],
  ['@capacitor/app', 'dist/plugin.js', 'app.js'],
  ['@capacitor/local-notifications', 'dist/plugin.js', 'local-notifications.js'],
  ['@capacitor/filesystem', 'dist/plugin.js', 'filesystem.js'],
];
let missing = [];
for (const [spec, file, name] of natives) {
  try { fs.copyFileSync(nodeModule(spec, file), path.join(OUT, 'native', name)); }
  catch (e) { missing.push(spec); fs.writeFileSync(path.join(OUT, 'native', name), `/* ${spec} not installed — run npm install in app/ */\n`); }
}
for (const f of ['zij-privacy.js', 'zij-schedule.js', 'zij-native.js', 'zij-live-update.js', 'zij-inject.js']) fs.copyFileSync(path.join(SRC, f), path.join(OUT, 'native', f));
fs.mkdirSync(path.join(OUT, 'sounds'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'sounds'))) if (/\.(wav|caf|aiff)$/.test(f)) fs.copyFileSync(path.join(SRC, 'sounds', f), path.join(OUT, 'sounds', f));

// index.html: the live page, plus the bridge — in the copy only
const html = PAGE;
const build = buildOf(html);
if (!build) throw new Error('index.html has no window.ZIJ_BUILD');
const cfg = { site: process.env.ZIJ_SITE || 'https://alzijapp.com', build, native: pkg.version + '+' + build };
fs.writeFileSync(path.join(OUT, 'index.html'), inject(html, cfg));

// the file list the updater copies into a snapshot (everything except index.html)
const files = [];
(function walk(d) { for (const f of fs.readdirSync(path.join(OUT, d))) { const r = d ? d + '/' + f : f; fs.statSync(path.join(OUT, r)).isDirectory() ? walk(r) : files.push(r); } })('');
fs.writeFileSync(path.join(OUT, 'native', 'files.json'), JSON.stringify(files.filter(f => f !== 'index.html').concat('native/files.json').sort()));

// every local file the page (or its scripts) asks for must be in the app — otherwise stop here, before an incomplete app is built
const asked = new Set(pageScripts(html));
for (const src of [html, ...pageScripts(html).map(f => fs.readFileSync(path.join(OUT, f), 'utf8'))])
  for (const m of src.matchAll(/fetch\(\s*['"`]([^'"`$)]+)/g)) { const f = m[1].replace(/[?#].*$/, ''); if (f && !/^[a-z]+:|^\/\//i.test(f)) asked.add(f); }
const missingFiles = [...asked].filter(f => {
  const p = path.join(OUT, f.replace(/[?#].*$/, ''));
  if (f.endsWith('/')) return !fs.existsSync(p) || !fs.readdirSync(p).length;      // a folder the page reads files from
  return !fs.existsSync(p);
});
if (missingFiles.length) { console.error('❌ the page asks for files that are not in the app: ' + missingFiles.join(', ')); process.exit(1); }

const size = files.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`app/www ready — build ${build}, ${files.length + 1} files, ${(size / 1048576).toFixed(1)} MB` + (missing.length ? `\n⚠️  not installed: ${missing.join(', ')} (placeholders written)` : ''));
if (missing.length && process.env.CI) process.exit(1);
