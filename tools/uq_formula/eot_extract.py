"""Dhuhr = ceil(12:00 + 3h - 4*lon - EoT + c). Per day, intersect over 173 cities -> interval for (c - EoT_official) [s].
Compare with each sun model's EoT at various sampling hours."""
from model import *
import numpy as np
o = OBS[:, :, 2]; base = 900 - 4 * LON[:, None]
lo = (o - 1 - base).max(0) * 60; hi = (o - base).min(0) * 60     # -EoT(off) in seconds lies in (lo, hi]
mid = (lo + hi) / 2; w = hi - lo
np.save('eot_official_mid.npy', np.c_[lo, hi])
print('interval width s: median %.1f max %.1f, feasible all days: %s' % (np.median(w), w.max(), (w > 0).all()))
for m in ['noaa', 'simple', 'meeus_hp']:
    for h in [0, 3, 6, 9, 12, 15]:
        _, e = sp(m, np.full((1, ND), h * 60.0)); e = -e[0] * 60
        inside = ((e > lo) & (e <= hi)).mean(); d = e - mid
        print(m, 'EoT@%02dh' % h, 'inside %.3f' % inside, 'mean diff %.2f s, std %.2f, maxabs %.1f' % (d.mean(), d.std(), np.abs(d).max()))
