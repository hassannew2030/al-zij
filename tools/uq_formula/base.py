"""Baseline after replacing 'duplicate' days with the previous day's computed values."""
from core import *
import numpy as np
DUP = np.r_[False, (OBS[:, 1:, :5] == OBS[:, :-1, :5]).all(2).all(0)]
def dupfix(t):
    t = t.copy()
    for i in np.where(DUP)[0]: t[:, i] = t[:, i - 1]
    return t
def score(t, p, rnd):
    r = ceil(t) if rnd == 'ceil' else floor(t)
    return (r == OBS[:, :, p])
