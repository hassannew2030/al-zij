"""Event-time engine: vectorised over (city, day). Times are minutes of local day (UTC+3)."""
import numpy as np, datetime
import sun as S
from data import load, D0
R = np.pi / 180
ids, LAT, LON, NAMES, OBS, RAM = load()
NC, ND = OBS.shape[:2]
dates = [D0 + datetime.timedelta(days=i) for i in range(ND)]
Y = np.array([d.year for d in dates]); MO = np.array([d.month for d in dates]); DD = np.array([d.day for d in dates])
JD0 = S.jd_from(Y, MO, DD, 0.0)   # 00:00 UT of the date
TZ = 3.0
def sunpos(model, local_min, dt=0.0):
    """sun at local minute(s) of each date; local_min broadcastable to (NC,ND)."""
    jd = JD0[None, :] + (np.asarray(local_min) / 60.0 - TZ) / 24.0
    return S.MODELS[model](jd, dt) if model != 'meeus_hp' else S.meeus_hp(jd, dt if dt else 69.0)
def transit(model, lon, at=None, iters=3, dt=0.0):
    lon = np.asarray(lon, float).reshape(-1, 1)
    t = np.full((lon.shape[0], ND), 720.0)
    if at is not None:
        _, e = sunpos(model, np.full_like(t, at), dt); return 720 + 60 * TZ - 4 * lon - e
    for _ in range(iters):
        _, e = sunpos(model, t, dt); t = 720 + 60 * TZ - 4 * lon - e
    return t
def hour_angle(h0, lat, dec):
    """h0 [deg] altitude (array ok), lat [deg], dec [rad] -> half-arc in minutes (NaN if none)"""
    c = (np.sin(np.asarray(h0) * R) - np.sin(lat * R) * np.sin(dec)) / (np.cos(lat * R) * np.cos(dec))
    with np.errstate(invalid='ignore'):
        return np.arccos(c) / R * 4
def event(model, lat, lon, alt_fn, sign, iters=4, dec_at=None, eot_at=None, dt=0.0):
    """alt_fn(dec, lat) -> target altitude deg. sign -1 morning, +1 evening.
    dec_at / eot_at: fixed local hour to sample declination / EoT (None = at the event itself, iterated)."""
    lat = np.asarray(lat, float).reshape(-1, 1); lon = np.asarray(lon, float).reshape(-1, 1)
    t = np.full((lat.shape[0], ND), 720.0 + sign * 360)
    for _ in range(iters if (dec_at is None or eot_at is None) else 1):
        d1, e1 = sunpos(model, t, dt)
        dec = d1 if dec_at is None else sunpos(model, np.full_like(t, dec_at * 60.0), dt)[0]
        eot = e1 if eot_at is None else sunpos(model, np.full_like(t, eot_at * 60.0), dt)[1]
        t = 720 + 60 * TZ - 4 * lon - eot + sign * hour_angle(alt_fn(dec, lat), lat, dec)
    return t
def asr_alt(k=1):
    return lambda dec, lat: np.arctan(1 / (k + np.abs(np.tan(lat * R - dec)))) / R
ceil = lambda x: np.ceil(x - 1e-9); floor = lambda x: np.floor(x + 1e-9)
def window(t, obs, mode='ceil'):
    """per-city interval of constant offset c (minutes) s.t. round(t+c)==obs on all days: returns (lo, hi, feasible)"""
    if mode == 'ceil': lo = np.nanmax(obs - 1 - t, axis=1); hi = np.nanmin(obs - t, axis=1)
    else: lo = np.nanmax(obs - t, axis=1); hi = np.nanmin(obs + 1 - t, axis=1)
    return lo, hi, hi > lo
