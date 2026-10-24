"""Fast single-event evaluator on the VSOP sun with optional fixed-hour sampling of dec / EoT."""
from model import *
import functools
@functools.lru_cache(maxsize=None)
def at_hour(h, model='vsop'):
    d, e = sp(model, np.full((1, ND), h * 60.0)); return d, e
def ev(alt, sign, hd=None, he=None, model='vsop', iters=4, lat=None, lon=None, lagfree=False):
    lat = LAT[:, None] if lat is None else np.asarray(lat, float).reshape(-1, 1)
    lon = LON[:, None] if lon is None else np.asarray(lon, float).reshape(-1, 1)
    t = np.full((lat.shape[0], ND), 720.0 + sign * 360)
    nit = 1 if (hd is not None and he is not None) else iters
    for _ in range(nit):
        if hd is None or he is None: d0, e0 = sp(model, t)
        d = at_hour(hd, model)[0] if hd is not None else d0
        e = at_hour(he, model)[1] if he is not None else e0
        a = alt(d, lat) if callable(alt) else alt
        t = 900 - 4 * lon - e + (sign * hour_angle(a, lat, d) if sign else 0)
    return t
def best_shift(t, k, rng=np.arange(-60, 60.01, 0.5)):
    o = OBS[:, :, PI[k]]; s = [((rnd(t + d / 60, k) == o).mean(), d) for d in rng]; return max(s)
