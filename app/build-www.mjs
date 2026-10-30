// Builds app/www — the Zij exactly as on alzijapp.com, plus the native alerts layer (native/native.js).
// Run from app/: node build-www.mjs   (no packages needed)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const APP = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(APP), WWW = path.join(APP, 'www');
fs.rmSync(WWW, { recursive: true, force: true }); fs.mkdirSync(WWW);
for (const p of ['index.html', 'version.json', 'manifest.json', 'data', 'fonts', 'icons', 'i18n'])
  fs.cpSync(path.join(ROOT, p), path.join(WWW, p), { recursive: true });
fs.cpSync(path.join(APP, 'native'), path.join(WWW, 'native'), { recursive: true });
let html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
const must = (from, to, why) => { if (!html.includes(from)) { console.error('build-www: pattern not found — ' + why); process.exit(1); } html = html.replace(from, to); };
// 1) tell the page it lives inside the app, before any script runs
must('<head>', '<head>\n<script>window.ZIJ_NATIVE=true;</script>', 'head');
// 2) inside the app iPhone rings the alerts; the page's own chime would ring a second time while open
must("function tick(){\n    if(!S.on||typeof observer==='undefined')return;", "function tick(){\n    if(!S.on||typeof observer==='undefined'||window.ZIJ_NATIVE)return;", 'web alert tick');
// 3) the native layer, last
must('</body>', '<script src="native/native.js"></script>\n</body>', 'body end');
fs.writeFileSync(path.join(WWW, 'index.html'), html);
const size = d => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log('www ready:', (size(WWW) / 1e6).toFixed(1), 'MB');
