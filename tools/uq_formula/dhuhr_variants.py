"""Which Dhuhr definition gives a city-pattern consistent with the table (free common value per day absorbs the EoT model)?"""
from model import *
from dhuhr_city import best_per_day
o = OBS[:, :, 2].astype(float)
m = 'meeus_hp'
T = times(m)
fixed = 900 - 4 * LON[:, None] - sp(m, np.full((1, ND), 720.0))[1]
cands = {'fixed EoT@12h': fixed, 'transit iterated (per city)': T['dhuhr'],
         'mid sunrise/sunset -0.833': (T['sunrise'] + T['maghrib']) / 2}
for h0 in (0.0, -0.5, -1.0):
    t = times(m, h0=h0); cands['mid rise/set h0=%g' % h0] = (t['sunrise'] + t['maghrib']) / 2
for k, base in cands.items():
    ys, viol = best_per_day(np.broadcast_to(base, (NC, ND)), o)
    c = viol.sum(1); print('%-32s violations %5d  cities %3d' % (k, viol.sum(), (c > 0).sum()), [(NAMES[i], int(c[i])) for i in np.argsort(c)[::-1][:4]])
