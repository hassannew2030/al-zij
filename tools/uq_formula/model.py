"""Candidate Umm al-Qura formula with the 'lag day' quirk and configurable parameters."""
import numpy as np
from core import *
from lagrule import lag_days
LAG = lag_days(ND)
SUNDAY = np.arange(ND) - LAG.astype(int)          # which calendar day's sun is used
JDS = JD0[SUNDAY]
def sp(model, t, dt=0.0, jd=None):
    J = JDS if jd is None else jd
    return S.MODELS[model](J[None, :] + (t / 60 - TZ) / 24, dt) if model not in ('meeus_hp', 'vsop') else S.MODELS[model](J[None, :] + (t / 60 - TZ) / 24, dt or 69.0)
def times(model='meeus_hp', lat=LAT, lon=LON, fajr=18.5, h0=-0.833, asr_k=1, sample=None, iters=4, dt=0.0):
    """sample: dict prayer->(dec_hour, eot_hour) fixed sampling; None = at event (iterated)."""
    sample = sample or {}
    lat = np.asarray(lat, float).reshape(-1, 1); lon = np.asarray(lon, float).reshape(-1, 1)
    n = lat.shape[0]
    def ev(altf, sign, key):
        t = np.full((n, ND), 720.0 + sign * 360); s = sample.get(key)
        for _ in range(iters):
            d, e = sp(model, t, dt)
            if s:
                if s[0] is not None: d = sp(model, np.full_like(t, s[0] * 60.0), dt)[0]
                if s[1] is not None: e = sp(model, np.full_like(t, s[1] * 60.0), dt)[1]
            t = 720 + 60 * TZ - 4 * lon - e + sign * (hour_angle(altf(d, lat), lat, d) if sign else 0)
        return t
    noon = ev(None, 0, 'dhuhr')
    return dict(fajr=ev(lambda d, l: -fajr, -1, 'fajr'), sunrise=ev(lambda d, l: h0, -1, 'sunrise'), dhuhr=noon,
                asr=ev(asr_alt(asr_k), 1, 'asr'), maghrib=ev(lambda d, l: h0, 1, 'maghrib'))
RND = dict(fajr='ceil', sunrise='floor', dhuhr='ceil', asr='ceil', maghrib='ceil')
PI = dict(fajr=0, sunrise=1, dhuhr=2, asr=3, maghrib=4)
def rnd(t, k): return ceil(t) if RND[k] == 'ceil' else floor(t)
def evaluate(T, off=None):
    off = off or {}; res = {}
    for k, t in T.items():
        res[k] = rnd(t + off.get(k, 0) / 60, k) == OBS[:, :, PI[k]]
    mg = rnd(T['maghrib'] + off.get('maghrib', 0) / 60, 'maghrib')
    res['isha'] = (mg + np.where(RAM, 120, 90)[None, :]) == OBS[:, :, 5]
    return res
def summary(res):
    return {k: round(float(v.mean()) * 100, 3) for k, v in res.items()} | {'all': round(float(np.mean([v.mean() for v in res.values()])) * 100, 3)}
