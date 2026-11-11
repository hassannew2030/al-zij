#!/usr/bin/env python3
"""Rebuild claude/engine.js and claude/legacy/*.html from beta/index.html.

Everything copied here is beta's own code and data, byte for byte (the math is never rewritten):
  engine.js     AstroMath · Ephemeris · HijriCalendar · zijUQ (official Umm al-Qura tables) · methods · Observer · StarField
                TrueSkyEngine · MANSION_NAMES · CALC_NAMES/NOTES · ZIJ_CITIES · ZIJ_COAST · kaabaToday
  legacy/*.html the Qibla and Sky instruments, used only behind «الأداة التفصيلية» buttons
Run from the repository root:  python3 claude/tools/build_engine.py
"""
import hashlib, json, re, sys, os

SRC = 'beta/index.html'
s = open(SRC, encoding='utf-8').read()

def between(a, b):
    i = s.index(a)
    j = s.index(b, i)
    return s[i:j].rstrip() + '\n'

def one(pattern, flags=re.S):
    m = re.search(pattern, s, flags)
    if not m:
        sys.exit('not found: ' + pattern[:60])
    return m.group(1) if m.groups() else m.group(0)

SEP = '// ============================================================\n// '
parts = [
    ('AstroMath … StarField', between('class AstroMath {', SEP + 'ClockRenderer')),
    ('TrueSkyEngine', between('class TrueSkyEngine {', SEP + 'CompassController')),
    ('MANSION_NAMES', one(r'^(const MANSION_NAMES = \[.*?\];)$', re.M) + '\n'),
    ('CALC_NAMES / CALC_NOTES', between('const CALC_NAMES = {', 'function initCalcMethodUI(){')),
    ('ZIJ_CITIES', one(r'(const ZIJ_CITIES=\[.*?\]\];)') + '\n'),
    ('kaabaToday (home screen)', between("const _kaaba={day:'',v:null};", '// tourbillon: tap the complication itself')),
    ('ZIJ_COAST', one(r'<script>(window\.ZIJ_COAST=\[.*?\];)</script>') + '\n'),
]
build = one(r'window\.ZIJ_BUILD="(\d+)"')
out = ['/* Al-Zij engine — copied verbatim from beta/index.html (build %s) by claude/tools/build_engine.py.\n'
       '   Do not edit by hand: change beta, then run the script again. */\n' % build]
for name, code in parts:
    out.append('\n/* ===== %s · sha256 %s ===== */\n' % (name, hashlib.sha256(code.encode()).hexdigest()[:12]))
    out.append(code)
open('claude/engine.js', 'w', encoding='utf-8').write(''.join(out))

for mid, fn in (('modQiblaSrc', 'qibla.html'), ('modSkySrc', 'sky.html')):
    raw = one(r'<script type="application/json" id="%s">(.*?)</script>' % mid)
    open(os.path.join('claude/legacy', fn), 'w', encoding='utf-8').write(json.loads(raw))
print('engine.js from beta build', build, '·', sum(len(c) for _, c in parts), 'chars')
