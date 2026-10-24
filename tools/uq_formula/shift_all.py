"""Per day: which day's sun (k=-1,0,+1) explains sunrise, dhuhr, asr, maghrib best (all 173 cities)."""
from core import *
import json, numpy as np
from tabular import hijri_list
H = hijri_list()
def ev_shift(k, model='meeus_hp'):
    J = JD0 + k
    def sp(t): return S.MODELS[model](J[None, :] + (t / 60 - TZ) / 24)
    lat = LAT[:, None]; lon = LON[:, None]; out = []
    t = np.full((NC, ND), 720.0)
    for _ in range(3): _, e = sp(t); t = 720 + 180 - 4 * lon - e
    noon = t
    def ev(altf, sign):
        t = noon + sign * 360
        for _ in range(4):
            d, e = sp(t); t = 720 + 180 - 4 * lon - e + sign * hour_angle(altf(d, lat), lat, d)
        return t
    sr = ev(lambda d, l: -0.833, -1); ss = ev(lambda d, l: -0.833, 1); asr = ev(asr_alt(1), 1)
    return floor(sr), ceil(noon), ceil(asr), ceil(ss)
if __name__ == '__main__':
    P = [1, 2, 3, 4]; sc = []
    for k in (-1, 0, 1):
        r = ev_shift(k); sc.append([(r[j] == OBS[:, :, p]).sum(0) for j, p in enumerate(P)])
    sc = np.array(sc)  # k, prayer, day
    tot = sc.sum(1); best = np.array([-1, 0, 1])[tot.argmax(0)]
    np.save('shift_best.npy', best); np.save('shift_scores.npy', sc)
    from collections import Counter
    print('best shift counts', Counter(best.tolist()))
    print('match k=0 per prayer', (sc[1].sum(1) / (NC * ND)).round(4), ' with best shift', (sc[tot.argmax(0), :, np.arange(ND)].sum(0) / (NC * ND)).round(4))
    hd = Counter(); hall = Counter()
    for i in range(ND):
        dd = int(H[i][-2:]); hall[dd] += 1
        if best[i] == -1: hd[dd] += 1
    print('shift -1 by hijri day:', {d: f'{hd[d]}/{hall[d]}' for d in sorted(hall)})
