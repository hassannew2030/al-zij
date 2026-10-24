"""For each day, find which day's sun (shift -2..+2 days) best explains the official Dhuhr across all 173 cities."""
from core import *
import json, numpy as np
H = []
for y in range(2026, 2031): H += json.load(open('../../data/uq/%d.json' % y))['hijri']
def tr_shift(model, k):
    jd = JD0[None, :] + k + (720 / 60 - TZ) / 24
    t = np.full((NC, ND), 720.0)
    for _ in range(3):
        _, e = S.MODELS[model](JD0[None, :] + k + (t / 60 - TZ) / 24); t = 720 + 60 * TZ - 4 * LON[:, None] - e
    return t
if __name__ == '__main__':
    o = OBS[:, :, 2]; sc = []
    for k in (-1, 0, 1):
        t = tr_shift('meeus_hp', k); sc.append((ceil(t) == o).sum(0))
    sc = np.array(sc); best = np.array([-1, 0, 1])[sc.argmax(0)]
    sh = np.where(best != 0)[0]
    print('days whose Dhuhr fits another day better:', len(sh))
    for i in sh: print(dates[i], H[i], 'shift', best[i], 'scores', sc[:, i])
    np.save('dayshift.npy', best)
