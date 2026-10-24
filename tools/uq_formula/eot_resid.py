"""Per day: interval of delta (seconds) such that ceil(transit_model + delta) == official for all 173 cities.
delta = (model EoT - official EoT). Then try to explain delta with ephemeris differences."""
from model import *
import numpy as np
def interval(t, o, mode='ceil'):
    v = (o - t) * 60
    if mode == 'ceil': return (v - 60).max(0), v.min(0)
    return v.max(0), (v + 60).min(0)
if __name__ == '__main__':
    m = 'meeus_hp'; T = times(m)
    lo, hi = interval(T['dhuhr'], OBS[:, :, 2])
    print('feasible', (hi > lo).all(), 'width med %.2f max %.2f' % (np.median(hi - lo), (hi - lo).max()))
    mid = (lo + hi) / 2; np.save('delta_dhuhr.npy', np.c_[lo, hi])
    print('delta mean %.2f std %.2f min %.2f max %.2f' % (mid.mean(), mid.std(), mid.min(), mid.max()))
    # harmonic fit vs day-of-year
    n = np.arange(ND); w = 2 * np.pi / 365.2422
    X = np.c_[np.ones(ND), n / 365, np.cos(w * n), np.sin(w * n), np.cos(2 * w * n), np.sin(2 * w * n), np.cos(3 * w * n), np.sin(3 * w * n)]
    c, *_ = np.linalg.lstsq(X, mid, rcond=None); r = mid - X @ c
    print('harmonic coeffs', c.round(2), 'resid std %.2f max %.2f' % (r.std(), np.abs(r).max()))
    for i in range(0, ND, 30): print(dates[i], round(lo[i], 2), round(hi[i], 2))
