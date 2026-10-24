"""With the coordinates exactly as sent to the API (cities.json) and one free value per day,
how many (city, day) Dhuhr minutes can be explained? Which cities violate? Try coordinate roundings."""
from model import *
import numpy as np
from collections import Counter
def best_per_day(base, o):
    v = (o - base) * 60  # need y in (v-60, v]
    viol = np.zeros_like(o, bool); ys = np.zeros(ND)
    for d in range(ND):
        lo = v[:, d] - 60; hi = v[:, d]
        cand = np.unique(np.r_[lo + 1e-6, hi])
        cnt = [((c > lo) & (c <= hi)).sum() for c in cand]
        y = cand[int(np.argmax(cnt))]; ys[d] = y; viol[:, d] = ~((y > lo) & (y <= hi))
    return ys, viol
if __name__ == '__main__':
    o = OBS[:, :, 2].astype(float)
    for name, lon in [('raw', LON), ('round2', np.round(LON, 2)), ('round1', np.round(LON, 1)), ('arcmin', np.round(LON * 60) / 60), ('trunc2', np.trunc(LON * 100) / 100)]:
        base = 900 - 4 * lon[:, None]
        ys, viol = best_per_day(np.broadcast_to(base, (NC, ND)), o)
        c = viol.sum(1); print(name, 'violations', viol.sum(), 'cities with any', (c > 0).sum(), 'top', [(NAMES[i], int(c[i]), LON[i]) for i in np.argsort(c)[::-1][:6]])
        if name == 'raw': np.save('dhuhr_y_raw.npy', ys)
