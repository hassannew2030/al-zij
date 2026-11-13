#!/usr/bin/env python3
"""beta = the live backup of Al-Zij, ONE STEP BEHIND the main site (rule of 13 Nov 2026, Hassan).

Before every publish of the main site:
    python3 tools/make_beta.py          # copies the CURRENT main (the last good one) into /beta/
    ... then edit and publish the main site.
So alzijapp.com/beta/ is always the version before the last publish: if a publish breaks something, the previous Al-Zij is
open at once on the phone, and the main site can be put back from it.

What the copy changes, nothing else:
- reads the main page and its scripts from git HEAD (what is published now), never from unsaved edits
- <base href="/"> so fonts, icons, data and voice clips are the main site's own files (nothing copied twice)
- its own scripts in beta/ (variants.js, voice.js, home-designs.js), so the backup does not change when main's scripts do
- its own beta/version.json, so the update check never jumps between the two copies
- hidden from search engines: noindex,nofollow, and every search/share tag (canonical, hreflang, og:, twitter:, ld+json)
  removed, so the backup is never seen as a second Al-Zij; robots.txt also disallows /beta/ and nothing links to it
- a thin gold ribbon «نسخة احتياطية · BACKUP» so it is never mistaken for the real one
Settings and reminders are shared with the main site in the same browser (same domain): don't turn the adhan on in both.
"""
import sys, re, json, time, os, subprocess

def head_file(path):
    return subprocess.run(['git', 'show', 'HEAD:' + path], capture_output=True, check=True).stdout.decode('utf-8')

s = head_file('index.html')
build = str(int(time.time()))
s = re.sub(r'window\.ZIJ_BUILD="\d+"', 'window.ZIJ_BUILD="%s"' % build, s, count=1)
n = s.count("fetch('version.json?")
s = s.replace("fetch('version.json?", "fetch('beta/version.json?")
# search engines: drop every tag that says «this is Al-Zij, index me / share me»
s = re.sub(r'<link rel="(canonical|alternate)"[^>]*>\n?', '', s)
s = re.sub(r'<meta (property|name)="(og:|twitter:)[^"]*"[^>]*>\n?', '', s)
s = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', '', s, flags=re.S)
# the page's own scripts → the backup's copies
os.makedirs('beta', exist_ok=True)
for js in ('variants.js', 'voice.js', 'home-designs.js'):
    open('beta/' + js, 'w', encoding='utf-8').write(head_file(js))
    s = re.sub(r'<script src="%s(\?v=\d+)?"' % re.escape(js), '<script src="beta/%s?v=%s"' % (js, build), s)
head = ('<base href="/">\n<meta name="robots" content="noindex,nofollow">\n'
        '<style id="betaRibbon">body::before{content:"نسخة احتياطية · BACKUP";position:fixed;top:0;left:50%;transform:translateX(-50%);'
        'z-index:99999;background:#c9a35d;color:#1a140a;font:700 12px/1 Georgia,serif;padding:3px 12px 4px;border-radius:0 0 10px 10px;pointer-events:none}</style>\n')
s = s.replace('<head>', '<head>\n' + head, 1)
# checks: never write a broken backup
assert n == 2, 'expected 2 version.json fetches, found %d' % n
assert 'rel="canonical"' not in s and 'og:' not in s and 'ld+json' not in s, 'search tags left in the backup'
for js in ('variants.js', 'voice.js', 'home-designs.js'):
    assert 'src="beta/%s' % js in s, js + ' not pointed at beta/'
open('beta/index.html', 'w', encoding='utf-8').write(s)
json.dump({'build': build}, open('beta/version.json', 'w'))
print('backup built from main HEAD', subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip(),
      '→ beta build', build, len(s), 'bytes')
