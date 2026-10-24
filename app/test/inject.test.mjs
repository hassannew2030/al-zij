// The bridge goes into a COPY of index.html only, once, before the page's own scripts. Run: cd app && npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { inject, buildOf, MARK, SCRIPTS } = require('../www-src/zij-inject.js');

test('injects right after <meta charset>, before any page script, exactly once', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const out = inject(html, { build: buildOf(html), site: 'https://alzijapp.com' });
  assert.equal(out.split(MARK).length, 2);
  const firstPageScript = out.indexOf('<script>/* alzijapp.com opened over plain http');
  for (const s of SCRIPTS) { const i = out.indexOf('<script src="' + s + '">'); assert.ok(i > 0 && i < firstPageScript, s); }
  assert.equal(inject(out, {}), out, 'idempotent');
  assert.equal(out.replace(/\n<!-- zij-native -->[\s\S]*?<script src="native\/zij-live-update\.js"><\/script>\n/, ''), html, 'nothing else changes');
});

test('reads the page build stamp', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
  assert.equal(buildOf(html), v.build);
});

test('config cannot break out of the script tag', () => {
  const out = inject('<html><head><meta charset="utf-8"></head></html>', { site: '</script><script>alert(1)</script>' });
  assert.ok(!out.includes('</script><script>alert(1)'));
});
