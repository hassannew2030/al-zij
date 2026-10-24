"""Fit the 'lag window' rule: day n uses the sun of day n-1 when n is in [ph + jP, ph + jP + W).
Linear feasibility on (ph, P) for starts and (ph+W, P) for ends."""
import numpy as np
from scipy.optimize import linprog
import os
def _runs():
    b = np.load(os.path.join(os.path.dirname(__file__), 'frac_best.npy')); lag = np.where(b < -0.5)[0]   # from fracshift.py
    runs = []; cur = None
    for i in lag:
        if cur and cur[-1] == i - 1: cur.append(i)
        else: cur = [i]; runs.append(cur)
    return np.array([r[0] for r in runs]), np.array([r[-1] + 1 for r in runs])
def feas(V, J):  # V_j - 1 < a + jP <= V_j ; return P range
    out = []
    for sgn in (1, -1):
        A = np.r_[np.c_[np.ones_like(J), J], -np.c_[np.ones_like(J), J]].astype(float)
        bb = np.r_[V, -(V - 1) - 1e-9].astype(float)
        r = linprog([0, sgn], A_ub=A, b_ub=bb, bounds=[(None, None), (None, None)])
        out.append(r.x if r.success else None)
    return out
if __name__ == '__main__':
    S, E = _runs(); J = np.arange(len(S)); print('runs', len(S))
    print('start constraints (a,P) min/max P:', feas(S, J))
    print('end constraints   (a,P) min/max P:', feas(E, J))
def joint():
    S, E = _runs(); J = np.arange(len(S))
    """lag(n) iff a + jP <= n < b + jP for some j. Variables a, b, P. Find max-margin solution."""
    # constraints: S_j-1 < a+jP <= S_j ; E_j-1 < b+jP <= E_j  ; maximise margin m
    rows = []; rhs = []
    for j, (s, e) in enumerate(zip(S, E)):
        rows += [[1, 0, j, 1], [-1, 0, -j, 1], [0, 1, j, 1], [0, -1, -j, 1]]
        rhs += [s, -(s - 1), e, -(e - 1)]
    r = linprog([0, 0, 0, -1], A_ub=np.array(rows, float), b_ub=np.array(rhs, float), bounds=[(None, None)] * 3 + [(0, 1)])
    return r.x
# Fitted once (max-margin LP over the 62 runs found in 2026-2030, margin 0.011 d); day index n = days since 2026-01-01.
# As Julian Days: window j starts at JD 2461062.6705 + j*29.431818 and lasts 1.522727 d; a calendar day (00:00 local) inside it uses the previous day's sun.
LAG_A, LAG_B, LAG_P = 21.170454545, 22.693181818, 29.431818182
def lag_days(nd, a=None, b=None, P=None):
    a = LAG_A if a is None else a; b = LAG_B if b is None else b; P = LAG_P if P is None else P
    n = np.arange(nd); j = np.floor((n - a) / P)
    return (n - a - j * P) < (b - a)
if __name__ == '__main__':
    print('joint a,b,P,margin =', joint())
    b = np.load('frac_best.npy'); L = lag_days(len(b)); print('rule reproduces lag days exactly:', (L == (b < -0.5)).all(), L.sum())
