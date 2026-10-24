from model import *
from eot_resid import interval
import vsop
def transit_with(fn):
    lon = LON[:, None]; t = np.full((NC, ND), 720.0)
    for _ in range(3):
        _, e = fn(JDS[None, :] + (t / 60 - TZ) / 24); t = 900 - 4 * lon - e
    return t
def score(t):
    lo, hi = interval(t, OBS[:, :, 2]); mid = (lo + hi) / 2
    feas = (hi > lo).all()
    best = max(((lo < d) & (d <= hi)).mean() for d in np.arange(-3, 3, 0.02))
    return feas, round(mid.std(), 3), round(best, 4), round(mid.mean(), 2)
if __name__ == '__main__':
    for name, fn in [
        ('dt0', lambda j: vsop.sun_vsop(j, 0.0)), ('dt32', lambda j: vsop.sun_vsop(j, 32.184)), ('dt69', lambda j: vsop.sun_vsop(j, 69.0)),
        ('dt120', lambda j: vsop.sun_vsop(j, 120.0)), ('dt69 nutLow', lambda j: vsop.sun_vsop(j, 69.0, nut_full=False)),
        ('dt69 noFK5', lambda j: vsop.sun_vsop(j, 69.0, fk5=False)), ('dt69 noAberr', lambda j: vsop.sun_vsop(j, 69.0, aberr=None))]:
        print(name, score(transit_with(fn)), flush=True)
