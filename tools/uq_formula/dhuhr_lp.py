"""Model-free check of Dhuhr: ceil(900 - 4*lon_c + x_c + y_d) = obs  with a free per-city constant x_c (longitude
correction) and a free per-day value y_d (the official -EoT). Difference constraints -> LP with max margin.
If feasible, Dhuhr is fully explained by 'one number per day + one per city'."""
from model import *
import numpy as np, scipy.sparse as sp_
from scipy.optimize import linprog
def solve(p=2, base=None, rnd='ceil', drop=None):
    o = OBS[:, :, p].astype(float); base = np.broadcast_to(900 - 4 * LON[:, None], (NC, ND)) if base is None else base
    keep = np.ones(ND, bool) if drop is None else ~drop
    days = np.where(keep)[0]; nd = len(days)
    c_i, d_i = np.meshgrid(np.arange(NC), np.arange(nd), indexing='ij'); c_i = c_i.ravel(); d_i = d_i.ravel()
    v = (o[:, days] - base[:, days]).ravel()
    if rnd == 'ceil': lo, hi = v - 1, v          # lo < x+y <= hi
    else: lo, hi = v, v + 1                      # lo <= x+y < hi
    n = len(v); nv = NC + nd + 1                 # x, y, margin m
    rows = np.r_[np.arange(n), np.arange(n), np.arange(n), n + np.arange(n), n + np.arange(n), n + np.arange(n)]
    cols = np.r_[c_i, NC + d_i, np.full(n, nv - 1), c_i, NC + d_i, np.full(n, nv - 1)]
    vals = np.r_[np.ones(n), np.ones(n), np.ones(n), -np.ones(n), -np.ones(n), np.ones(n)]
    A = sp_.csr_matrix((vals, (rows, cols)), shape=(2 * n, nv))
    b = np.r_[hi, -lo]                            # x+y+m <= hi ; -(x+y)+m <= -lo
    bounds = [(None, None)] * (NC + nd) + [(None, 0.5)]
    bounds[0] = (0, 0)                            # gauge: city 0 (Riyadh) x=0
    r = linprog(np.r_[np.zeros(nv - 1), -1], A_ub=A, b_ub=b, bounds=bounds, method='highs')
    return r, days
if __name__ == '__main__':
    r, days = solve()
    x = r.x[:NC]; m = r.x[-1]
    print('status', r.status, 'margin (min)', m * 60, 's')
    print('per-city x (seconds) stats:', np.percentile(x * 60, [0, 5, 50, 95, 100]).round(2))
    order = np.argsort(np.abs(x))[::-1][:15]
    for c in order: print(NAMES[c], LAT[c], LON[c], 'x=%.1fs  dlon=%.4f deg' % (x[c] * 60, -x[c] / 4))
def residual_vs_models(r):
    y = r.x[NC:NC + ND] * 60  # seconds; official (-EoT) up to a constant
    out = {}
    for m in ['noaa', 'simple', 'meeus_hp']:
        for h in np.arange(9, 15.01, 0.5):
            _, e = sp(m, np.full((1, ND), h * 60.0)); d = y + e[0] * 60; d -= np.median(d)
            out[(m, h)] = (d.std(), np.abs(d).max())
    return y, out
