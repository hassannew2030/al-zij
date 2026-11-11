#!/usr/bin/env python3
"""Build fable/index.html.

Run from the repository root:   python3 fable/tools/build.py

The page is assembled from
  * fable/src/*            — the new design (markup, CSS, both clocks, shell logic), written from zero;
  * beta/index.html @ 5d74e8f — the engine and the feature logic, copied as byte-for-byte line blocks.
Every copied block is wrapped in a BEGIN/END marker that names its source line range.
fable/tools/verify.py re-reads the built page and proves each block equals the source lines.
"""
import re, subprocess, sys, json, time, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / 'fable' / 'src'
COMMIT = '5d74e8f'
beta = subprocess.run(['git', 'show', COMMIT + ':beta/index.html'], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8')
L = beta.split('\n')

def lines(a, b):
    return '\n'.join(L[a - 1:b])

def V(a, b, name):
    """a verbatim block made of whole lines that already carry their own <script>/<style> tags"""
    return f'<!-- BEGIN beta/index.html@{COMMIT} L{a}-{b} ({name}) verbatim -->\n{lines(a, b)}\n<!-- END L{a}-{b} -->\n'

def VJS(a, b, name):
    """a verbatim run of JavaScript lines taken from inside beta's engine <script>"""
    return f'<script>\n/* BEGIN beta/index.html@{COMMIT} L{a}-{b} ({name}) verbatim */\n{lines(a, b)}\n/* END L{a}-{b} */\n</script>\n'

def read(n):
    return (SRC / n).read_text(encoding='utf-8')

def strip_styles(s):
    """old-body panels: same ids, same handlers, same words — the inline look is dropped (only display:none is kept,
    because the engine toggles panels through style.display)"""
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    def rep(m):
        return ' style="display:none"' if re.search(r'display\s*:\s*none', m.group(1)) else ''
    return re.sub(r'\sstyle="([^"]*)"', rep, s)

def tag(name):
    return f'<script>window.__zijBlock={json.dumps(name)};</script>\n'

build = str(int(time.time()))
legacy = strip_styles(lines(2717, 3147))
about = strip_styles(lines(5625, 5626))

shell = read('shell.html').replace('<!--@LEGACY-->', f'<!-- from beta L2717-3147, inline styles removed -->\n{legacy}\n') \
                          .replace('<!--@ABOUT-->', f'<!-- from beta L5625-5626, inline styles removed -->\n{about}\n')

out = []
out.append(f'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<base href="/">
<meta name="robots" content="noindex,nofollow">
<meta charset="UTF-8">
''')
out.append(V(9, 9, 'http to https'))
out.append('''<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="الزيج">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="icon" type="image/svg+xml" href="icons/icon.svg">
<meta name="theme-color" content="#070a12">
<title>الزيج</title>
''')
out.append(V(20, 22, 'font faces + tone placeholder'))
out.append(V(23, 113, 'typeHeadJs: fonts, size, tone'))
out.append(V(114, 130, 'prIconsJs: prayer icons'))
out.append(f'<style id="fableCss">\n{read("style.css")}\n</style>\n</head>\n<body data-scr="clock">\n')
out.append(f'<script>window.FABLE_BUILD="{build}";\n{read("pre.js")}\n</script>\n')
out.append(V(139, 1845, 'ZIJ_EN dictionary'))
out.append(f'<script>\n{read("en.js")}\n</script>\n')
out.append(V(1846, 1928, 'English swapper'))
out.append(shell)
out.append(VJS(3151, 4608, 'engine: AstroMath, Ephemeris, HijriCalendar, zijUQ, Observer, StarField, ClockRenderer, TrueSkyEngine, CompassController, ZoomPanController, ViewModeController, NavTool, instances, saved location'))
out.append(f'<script>\n{read("bridge.js")}\n</script>\n')
out.append(VJS(4631, 5512, 'engine: global functions'))
out.append(tag('homeJs') + V(5640, 5735, 'homeJs'))
out.append(tag('') + V(5737, 5739, 'data: ZIJ_COAST, Qibla module, Sky module'))
out.append(tag('shellJs') + V(5740, 6607, 'shellJs'))
out.append(tag('') + V(6608, 6676, 'typeUiJs') + V(6677, 6801, 'monthInfoJs') + V(6802, 6965, 'installGuideJs'))
out.append(V(7268, 7586, 'calendarJs') + V(7587, 7660, 'shareCitiesJs') + V(7661, 7847, 'alertsJs') + V(7848, 7872, 'digit style'))
out.append('<script src="beta/voice.js" defer></script>\n')
out.append(f'<script id="fableJs">\n{read("util.js")}\n{read("clock-simple.js")}\n{read("clock-grand.js")}\n{read("app.js")}\n</script>\n</body>\n</html>\n')

html = ''.join(out)
(ROOT / 'fable' / 'index.html').write_text(html, encoding='utf-8')
(ROOT / 'fable' / 'version.json').write_text(json.dumps({'build': build}) + '\n', encoding='utf-8')
print('fable/index.html', len(html.encode('utf-8')), 'bytes, build', build)
