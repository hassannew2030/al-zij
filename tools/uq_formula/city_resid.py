"""Per city: constant-second window that makes each prayer exact on all 1826 days (VSOP sun, lag rule).
If lo<hi the city is explainable with one constant; otherwise count residual days."""
from fast import *
import pickle
def city_windows(t, k):
    o = OBS[:, :, PI[k]]; v = (o - t) * 60
    lo, hi = ((v - 60).max(1), v.min(1)) if RND[k] == 'ceil' else (v.max(1), (v + 60).min(1))
    return lo, hi
if __name__ == '__main__':
    T = {'sunrise': ev(-0.8333, -1), 'dhuhr': ev(0, 0), 'maghrib': ev(-0.8333, 1), 'fajr': ev(-18.5, -1, hd=24.0, he=12.0)}
    pickle.dump(T, open('T_best.pkl', 'wb'))
    for k, t in T.items():
        lo, hi = city_windows(t, k)
        print(k, 'cities with a feasible constant:', (hi > lo).sum(), ' median lo/hi %.2f %.2f' % (np.median(lo), np.median(hi)),
              ' global window %.2f..%.2f' % (lo.max(), hi.min()))
