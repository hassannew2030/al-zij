"""Per day, fit a continuous time offset (fraction of a day) for the sun ephemeris that maximises matches
of sunrise/dhuhr/asr/maghrib over all 173 cities."""
from core import *
import numpy as np, json
from tabular import hijri_list
from shift_all import ev_shift
H = hijri_list()
if __name__ == '__main__':
    ks = np.round(np.arange(-1.5, 0.76, 0.05), 3); sc = []
    for k in ks:
        r = ev_shift(k); sc.append(sum((r[j] == OBS[:, :, p]).sum(0) for j, p in enumerate([1, 2, 3, 4])))
    sc = np.array(sc); np.save('frac_scores.npy', sc)
    # best k per day: take centroid of maxima
    best = np.array([ks[sc[:, i] == sc[:, i].max()].mean() for i in range(ND)])
    np.save('frac_best.npy', best)
    for i in range(ND):
        if i < 400: print(dates[i], H[i], round(best[i], 2), sc[:, i].max(), sc[ks == 0, i][0])
