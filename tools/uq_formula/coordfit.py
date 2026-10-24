"""Per city: find (dlat, dlon) [deg] maximising exact matches of sunrise+dhuhr+maghrib (+fajr), linearised in lat."""
from fast import *
import pickle
T = pickle.load(open('T_best.pkl', 'rb'))
OFF = {'fajr': 1.0, 'sunrise': 2.0, 'dhuhr': 1.0, 'maghrib': 1.0}
eps = 0.01
dT = {'sunrise': (ev(-0.8333, -1, lat=LAT + eps) - T['sunrise']) / eps, 'maghrib': (ev(-0.8333, 1, lat=LAT + eps) - T['maghrib']) / eps,
      'fajr': (ev(-18.5, -1, hd=24.0, he=12.0, lat=LAT + eps) - T['fajr']) / eps, 'dhuhr': np.zeros((NC, ND))}
pickle.dump(dT, open('dT_lat.pkl', 'wb'))
def matches(c, dl, dn, keys):
    s = 0
    for k in keys:
        t = T[k][c] + OFF[k] / 60 + dT[k][c] * dl - 4 * dn
        s += (rnd(t, k) == OBS[c, :, PI[k]]).sum()
    return s
if __name__ == '__main__':
    keys = ['sunrise', 'dhuhr', 'maghrib']
    out = []
    G = np.arange(-0.03, 0.0301, 0.0025)
    for c in range(NC):
        base = matches(c, 0, 0, keys)
        best = max((matches(c, dl, dn, keys), dl, dn) for dl in G for dn in G)
        out.append((c, base, *best))
    out = np.array(out); np.save('coordfit.npy', out)
    print('total base %d  fitted %d  of %d' % (out[:, 1].sum(), out[:, 2].sum(), NC * ND * 3))
    print('dlat pct', np.percentile(out[:, 3], [5, 25, 50, 75, 95]), 'dlon pct', np.percentile(out[:, 4], [5, 25, 50, 75, 95]))
    print('cities perfect after fit', (out[:, 2] == ND * 3).sum())
