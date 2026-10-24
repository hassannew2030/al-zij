"""Dhuhr per-day delta interval (s) for a model: delta s.t. ceil(transit + delta) == official for all cities."""
from model import *
from eot_resid import interval
import sys
def stats(m, **kw):
    T = times(m, **kw) if 'dhuhr' not in kw else kw['dhuhr']
    lo, hi = interval(T['dhuhr'], OBS[:, :, 2]); mid = (lo + hi) / 2
    n = np.arange(ND); w = 2 * np.pi / 365.2422
    X = np.c_[np.ones(ND), np.cos(w * n), np.sin(w * n), np.cos(2 * w * n), np.sin(2 * w * n)]
    c, *_ = np.linalg.lstsq(X, mid, rcond=None)
    return lo, hi, mid, c
if __name__ == '__main__':
    for m in sys.argv[1:]:
        lo, hi, mid, c = stats(m)
        print(m, 'feasible', (hi > lo).all(), 'mean %.2f std %.2f' % (mid.mean(), mid.std()), 'annual coeffs', c.round(2), 'const-delta best-case match: ',
              max(((lo < d) & (d <= hi)).mean() for d in np.arange(-5, 5, 0.05)).round(4))
