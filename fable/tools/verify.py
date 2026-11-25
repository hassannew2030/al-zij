#!/usr/bin/env python3
"""Prove that every block marked "verbatim" in fable/index.html equals beta/index.html @ 5d74e8f, byte for byte.
Run from the repository root:   python3 fable/tools/verify.py"""
import re, subprocess, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
beta = subprocess.run(['git', 'show', '5d74e8f:beta/index.html'], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8').split('\n')
page = (ROOT / 'fable' / 'index.html').read_text(encoding='utf-8')
pat = re.compile(r'(?:<!--|/\*) BEGIN beta/index\.html@5d74e8f L(\d+)-(\d+) \(([^)]*)\) verbatim (?:-->|\*/)\n(.*?)\n(?:<!--|/\*) END L\1-\2 (?:-->|\*/)', re.S)
bad = 0; total = 0
for m in pat.finditer(page):
    a, b = int(m.group(1)), int(m.group(2))
    src = '\n'.join(beta[a - 1:b])
    ok = src == m.group(4)
    total += len(src.encode('utf-8'))
    print(('OK  ' if ok else 'DIFF'), f'L{a}-{b}', len(src.encode('utf-8')), 'bytes', m.group(3)[:60])
    bad += not ok
print('blocks differing:', bad, '· verbatim bytes:', total, 'of', len(page.encode('utf-8')))
sys.exit(1 if bad else 0)
