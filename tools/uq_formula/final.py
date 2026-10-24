"""Best formula found (see docs/uq-formula-report.md). Scores it against all official tables and writes results/."""
from fast import *
import json, os, pickle
FAJR_ANGLE = 18.5; H0 = -0.8333
OFFS = dict(fajr=1.0, sunrise=2.0, dhuhr=1.0, asr=1.0, maghrib=1.0)   # seconds added before rounding
def formula_times(lat=None, lon=None, offs=OFFS, fajr_angle=FAJR_ANGLE, h0=H0):
    T = dict(fajr=ev(-fajr_angle, -1, hd=24.0, he=12.0, lat=lat, lon=lon),
             sunrise=ev(h0, -1, lat=lat, lon=lon), dhuhr=ev(0, 0, lat=lat, lon=lon),
             asr=ev(asr_alt(1), 1, hd=24.0, he=12.0, lat=lat, lon=lon), maghrib=ev(h0, 1, lat=lat, lon=lon))
    return T
def minutes(T, offs=OFFS):
    out = {k: rnd(T[k] + offs[k] / 60, k) for k in T}
    out['isha'] = out['maghrib'] + np.where(RAM, 120, 90)[None, :]
    return out
if __name__ == '__main__':
    cache = 'T_final.pkl'
    T = pickle.load(open(cache, 'rb')) if os.path.exists(cache) else formula_times()
    pickle.dump(T, open(cache, 'wb'))
    for k in T:   # fine constant scan (diagnostic)
        o = OBS[:, :, PI[k]]; s = sorted((((rnd(T[k] + d / 60, k) == o).mean(), round(d, 2)) for d in np.arange(-1, 3.01, 0.05)), reverse=True)[:3]
        print('scan', k, [(round(a * 100, 3), b) for a, b in s])

def report():
    import csv
    T = pickle.load(open('T_final.pkl', 'rb'))
    M = minutes(T); keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
    pidx = dict(PI, isha=5)
    ok = {k: M[k] == OBS[:, :, pidx[k]] for k in keys}
    os.makedirs('results', exist_ok=True)
    summ = {k: dict(match=int(ok[k].sum()), total=int(ok[k].size), pct=round(100 * ok[k].mean(), 3),
                    early=int((M[k] < OBS[:, :, pidx[k]]).sum()), late=int((M[k] > OBS[:, :, pidx[k]]).sum()),
                    maxdiff=int(np.abs(M[k] - OBS[:, :, pidx[k]]).max())) for k in keys}
    allok = np.all([ok[k] for k in keys], axis=0)
    summ['all_six_same_day'] = dict(pct=round(100 * allok.mean(), 3), days=int(allok.sum()), total=int(allok.size))
    tot = sum(ok[k].sum() for k in keys); summ['all_times'] = dict(match=int(tot), total=int(6 * NC * ND), pct=round(100 * tot / (6 * NC * ND), 3))
    # baseline: same formula without the lag-day rule
    json.dump(summ, open('results/summary.json', 'w'), indent=1, ensure_ascii=False)
    with open('results/per_city.csv', 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['id', 'name', 'lat', 'lon'] + [k + '_pct' for k in keys] + ['all_pct', 'misses'])
        for c in range(NC):
            pc = [round(100 * ok[k][c].mean(), 2) for k in keys]
            w.writerow([ids[c], NAMES[c], LAT[c], LON[c]] + pc + [round(np.mean(pc), 3), int(sum((~ok[k][c]).sum() for k in keys))])
    with open('results/mismatches.csv', 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['date', 'city_id', 'city', 'prayer', 'official', 'formula', 'diff_min', 'exact_time_s_from_edge'])
        hm = lambda m: '%02d:%02d' % divmod(int(m), 60)
        for k in keys:
            kk = 'maghrib' if k == 'isha' else k
            t = (T[kk] + OFFS[kk] / 60) * 60
            for c, d in zip(*np.where(~ok[k])):
                fr = t[c, d] % 60; w.writerow([dates[d], ids[c], NAMES[c], k, hm(OBS[c, d, pidx[k]]), hm(M[k][c, d]), int(M[k][c, d] - OBS[c, d, pidx[k]]), round(min(fr, 60 - fr), 2)])
    return summ
if __name__ == '__main__':
    print(json.dumps(report(), indent=1))
