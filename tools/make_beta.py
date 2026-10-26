#!/usr/bin/env python3
"""Build the test copy at alzijapp.com/beta/ from a working index.html.

Usage:  python3 tools/make_beta.py [source_index.html]
- Same files as the real Al-Zij (fonts, icons, data) through <base href="/">, so nothing is copied twice.
- Its own beta/version.json, so the auto-update check never jumps between the real copy and the test copy.
- A thin gold ribbon «نسخة تجربة» so it is never mistaken for the real one; hidden from search engines.
Note: settings and reminders are shared with the real copy (same site), so test reminders appear there too.
"""
import sys, re, json, time, os
src = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
s = open(src, encoding='utf-8').read()
build = str(int(time.time()))
s = re.sub(r'window\.ZIJ_BUILD="\d+"', 'window.ZIJ_BUILD="%s"' % build, s, count=1)
s = s.replace("fetch('version.json?", "fetch('beta/version.json?")
head = ('<base href="/">\n<meta name="robots" content="noindex,nofollow">\n'
        '<style id="betaRibbon">body::before{content:"نسخة تجربة · BETA";position:fixed;top:0;left:50%;transform:translateX(-50%);'
        'z-index:99999;background:#c9a35d;color:#1a140a;font:700 12px/1 Georgia,serif;padding:3px 12px 4px;border-radius:0 0 10px 10px;pointer-events:none}</style>\n')
s = s.replace('<head>', '<head>\n' + head, 1)
if os.path.exists('beta/variants.js'):
    s = s.replace('</body>', '<script src="beta/variants.js" defer></script>\n</body>', 1)  # home-layout variants (beta only)
if os.path.exists('beta/voice.js'):
    s = s.replace('</body>', '<script src="beta/voice.js" defer></script>\n</body>', 1)  # talking clock (beta only)
if os.path.exists('beta/home-designs.js'):
    s = s.replace('</body>', '<script src="beta/home-designs.js" defer></script>\n</body>', 1)  # home designs د هـ و (beta only)
os.makedirs('beta', exist_ok=True)
# guard: the beta clock (#zDial, added to beta only) must never be lost by building from a source without it
if os.path.exists('beta/index.html') and 'zDial' in open('beta/index.html', encoding='utf-8').read() and 'zDial' not in s:
    sys.exit('STOP: the source has no beta clock (#zDial). Build from the current beta/index.html instead.')
open('beta/index.html', 'w', encoding='utf-8').write(s)
json.dump({'build': build}, open('beta/version.json', 'w'))
print('beta built', build, len(s))
