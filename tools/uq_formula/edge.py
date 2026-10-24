from core import *
from shift_all import ev_shift
import numpy as np
r0 = ev_shift(0); r1 = ev_shift(-1)
P = [1, 2, 3, 4]
b = np.load('frac_best.npy'); sh = np.where(b < -0.5)[0]
# per day per prayer: share of cities where k=-1 matches and k=0 does not, vs reverse
for i in list(range(18, 26)) + list(range(48, 56)) + list(range(1790, 1800)):
    row = []
    for j, p in enumerate(P):
        o = OBS[:, i, p]; a = (r1[j][:, i] == o) & (r0[j][:, i] != o); c = (r0[j][:, i] == o) & (r1[j][:, i] != o)
        row.append(f'{a.sum():3d}/{c.sum():3d}')
    print(dates[i], '  sr dh asr mg  (prev-day wins / same-day wins):', ' '.join(row))
