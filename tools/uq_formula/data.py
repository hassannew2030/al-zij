"""Load the official Umm al-Qura tables (data/uq/YYYY.json) into numpy arrays.
OBS[c, d, p] = official minute of day (Saudi time, UTC+3) for city c, day d (0 = 2026-01-01), prayer p
(0 fajr, 1 sunrise, 2 dhuhr, 3 asr, 4 maghrib, 5 isha). Cached to obs.npz."""
import json, os, datetime, numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(__file__)
YEARS = range(2026, 2031)
D0 = datetime.date(2026, 1, 1)
PR = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
def load():
    cache = os.path.join(HERE, 'obs.npz')
    if os.path.exists(cache):
        z = np.load(cache, allow_pickle=True); return z['ids'], z['lat'], z['lon'], z['names'], z['obs'], z['ram']
    idx = json.load(open(os.path.join(ROOT, 'data/uq/index.json')))
    cities = idx['cities']
    ids = np.array([c[0] for c in cities]); lat = np.array([c[1] for c in cities], float); lon = np.array([c[2] for c in cities], float)
    names = np.array([c[4] for c in cities])
    rows = []; ram = []
    for y in YEARS:
        d = json.load(open(os.path.join(ROOT, f'data/uq/{y}.json')))
        n = len(d['hijri']); ram += [h.split('-')[1] == '09' for h in d['hijri']]
        a = np.zeros((len(ids), n, 6), int)
        for i, cid in enumerate(ids):
            for k, s in enumerate(d['cities'][str(cid)]):
                a[i, k] = [int(t[:2]) * 60 + int(t[3:]) for t in s.split()]
        rows.append(a)
    obs = np.concatenate(rows, axis=1); ram = np.array(ram)
    np.savez_compressed(cache, ids=ids, lat=lat, lon=lon, names=names, obs=obs, ram=ram)
    return ids, lat, lon, names, obs, ram
if __name__ == '__main__':
    ids, lat, lon, names, obs, ram = load()
    print(obs.shape, ram.sum(), names[:5])
    isha = obs[:, :, 5] - obs[:, :, 4]
    print('isha-maghrib values:', np.unique(isha[:, ~ram]), np.unique(isha[:, ram]))
