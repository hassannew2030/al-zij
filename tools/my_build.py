#!/usr/bin/env python3
"""Malaysia: build Al-Zij's JAKIM tables from the official files the workflow downloads (data/my/raw, .github/workflows/jakim-tables.yml).
Output (like data/uq for Umm al-Qura):
  data/my/index.json        {"years":[...], "zones":[[id, lat, lon, state, name], ...]}
  data/my/z/<ZONE>.json     {"id","name","lat","lon","y":{"2026":"<18 hex chars a day: fajr sunrise dhuhr asr maghrib isha, minutes>"}}
lat/lon = each zone's reference point, fitted from its own official table (Dhuhr → longitude, day-length shape → latitude), with the
common JAKIM margin calibrated on six known cities. It is used only to pick the nearest zone inside the user's state; the user can always
pick the zone by hand. The times themselves are the official file's minutes, untouched."""
import json, glob, math, os, re
import numpy as np
RAW = 'data/my/raw/'
MON = {'Jan':1,'Feb':2,'Mac':3,'Apr':4,'Mei':5,'Jun':6,'Jul':7,'Ogo':8,'Sep':9,'Okt':10,'Nov':11,'Dis':12}
def mins(t): h, m, _ = t.split(':'); return int(h) * 60 + int(m)
def sun(doy):
    g = 2 * math.pi / 365 * (doy - 1)
    eot = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    dec = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
           - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    return eot, dec
def daylen(lat, dec):
    c = (math.cos(math.radians(90.833)) - math.sin(math.radians(lat)) * math.sin(dec)) / (math.cos(math.radians(lat)) * math.cos(dec))
    return 8 * math.degrees(math.acos(c))
page = open(RAW + 'zones-page.html', encoding='utf-8', errors='ignore').read()
NAMES = {z: n.strip() for z, n in re.findall(r"class='hs'>([A-Z]{3}\d{2}) - ([^<]+)", page)}
STATE = {'JHR':'MY-01','KDH':'MY-02','KTN':'MY-03','MLK':'MY-04','NGS':'MY-05','PHG':'MY-06','PNG':'MY-07','PRK':'MY-08','PLS':'MY-09',
         'SGR':'MY-10','TRG':'MY-11','SBH':'MY-12','SWK':'MY-13'}
def state(z): return {'WLY01':'MY-14 MY-16','WLY02':'MY-15'}.get(z, STATE.get(z[:3], ''))
files = sorted(glob.glob(RAW + '*-*.json'))
years = sorted({int(f[-9:-5]) for f in files})
fit = {}
for z in sorted(NAMES):
    f = RAW + z + '-2026.json'
    if not os.path.exists(f): continue
    D = json.load(open(f))['prayerTime']
    k = np.mean([mins(r['dhuhr']) - (720 - sun(i + 1)[0]) for i, r in enumerate(D)])
    best = min(((np.var([(mins(r['maghrib']) - mins(r['syuruk'])) - daylen(lat, sun(i + 1)[1]) for i, r in enumerate(D)]), lat)
                for lat in np.arange(-1, 8.001, 0.02)))
    fit[z] = (k, best[1])
KNOWN = {'WLY01':101.69,'SWK08':110.34,'SBH07':116.07,'PNG01':100.33,'JHR02':103.76,'PLS01':100.20}
M = float(np.median([fit[z][0] + 4 * (KNOWN[z] - 120) for z in KNOWN]))
os.makedirs('data/my/z', exist_ok=True)
idx = []
for z, (k, lat) in fit.items():
    lon = round(120 - (k - M) / 4, 2); lat = round(float(lat), 2)
    out = {'id': z, 'name': NAMES[z], 'lat': lat, 'lon': lon, 'y': {}}
    for y in years:
        f = RAW + '%s-%d.json' % (z, y)
        if not os.path.exists(f): continue
        D = json.load(open(f))['prayerTime']
        s = ''
        for r in D:
            d, mo, yy = r['date'].split('-'); assert int(yy) == y
            s += ''.join('%03x' % mins(r[x]) for x in ('fajr', 'syuruk', 'dhuhr', 'asr', 'maghrib', 'isha'))
        assert len(D) in (365, 366), (z, y, len(D))
        out['y'][str(y)] = s
    json.dump(out, open('data/my/z/%s.json' % z, 'w'), separators=(',', ':'))
    idx.append([z, lat, lon, state(z), NAMES[z]])
json.dump({'years': years, 'margin': round(M, 2), 'zones': idx}, open('data/my/index.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'zones', years, 'margin', round(M, 2))
