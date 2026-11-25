#!/usr/bin/env python3
"""IndexNow: tell Bing (and Yandex, Seznam, Naver…) at once which alzijapp.com pages are new or changed.
ChatGPT / Copilot search read Bing's index, so this is how new pages reach them without waiting for a crawl.

Usage: python3 tools/indexnow.py            → submits every URL in sitemap.xml
       python3 tools/indexnow.py URL [URL…] → submits only those
The key is the file <key>.txt at the site root (its content = its name). It is public by design.
Runs automatically from .github/workflows/indexnow.yml after every push that changes the site.
"""
import glob, json, os, re, sys, urllib.request
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
HOST = 'alzijapp.com'
keys = [os.path.basename(p)[:-4] for p in glob.glob(R + '*.txt') if re.fullmatch(r'[0-9a-f]{32}', os.path.basename(p)[:-4])]
if len(keys) != 1: sys.exit('expected exactly one IndexNow key file at the repo root, found %d' % len(keys))
key = keys[0]
assert open(R + key + '.txt').read().strip() == key, 'key file content must equal its name'
urls = sys.argv[1:] or re.findall(r'<loc>([^<]+)</loc>', open(R + 'sitemap.xml', encoding='utf-8').read())
urls = [u for u in urls if u.startswith('https://' + HOST + '/')]
if not urls: sys.exit('no URLs to submit')
body = json.dumps({'host': HOST, 'key': key, 'keyLocation': 'https://%s/%s.txt' % (HOST, key), 'urlList': urls[:10000]}).encode()
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
try:
    with urllib.request.urlopen(req, timeout=30) as r: code = r.status
except urllib.error.HTTPError as e: code = e.code
except Exception as e: sys.exit('IndexNow not reachable: %s' % e)
print('IndexNow', code, 'for', len(urls), 'URLs')
# 200 = accepted, 202 = accepted (key check pending). Anything else is a real failure.
sys.exit(0 if code in (200, 202) else 1)
