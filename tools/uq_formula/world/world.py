"""Canada + Norway 2027: physics vs convention.
Engines (all seconds-level, local civil time with real DST from IANA zones):
  V = VSOP87 sun (../vsop.py) + GAST hour angle, events found by bisection on the true altitude  -> precise reference
  N = NOAA/Meeus ch.25 sun (tests/prayer/ref_precise.py alt()), bisection                         -> independent reference
  U = uq-formula engine style (VSOP sun, closed-form hour angle iterated at the event time)
  A = the app's own engine (index.html, via app_run.js -> app.json), unrounded
Writes world.json with all per-day values."""
import sys, os, json, math, datetime, zoneinfo, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..')); sys.path.insert(0, os.path.join(HERE, '../../../tests/prayer'))
from vsop import sun_vsop_full, nutation
import ref_precise as RP
R = math.pi / 180
CFG = json.load(open(os.path.join(HERE, 'cities.json'))); YEAR = CFG['year']
DAYS = [datetime.date(YEAR, 1, 1) + datetime.timedelta(i) for i in range(365)]
def tz_of(zone, d):  # UTC offset (h) at local noon of date d
    z = zoneinfo.ZoneInfo(zone); return datetime.datetime(d.year, d.month, d.day, 12, tzinfo=z).utcoffset().total_seconds() / 3600
def jd_ut(d, tz, local_s):
    a = (14 - d.month) // 12; y = d.year + 4800 - a; m = d.month + 12 * a - 3
    jdn = d.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
    return jdn - 0.5 + (np.asarray(local_s) / 3600 - tz) / 24
# --- V: VSOP87 true altitude ------------------------------------------------
def vsop_alt(jd, lat, lon):
    dec, _, lam, alpha, *_ = sun_vsop_full(jd, 69.0)
    T = (jd - 2451545.0) / 36525
    gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T ** 3 / 38710000
    dpsi, deps = nutation(T); eps = 23.4392911 - 0.0130042 * T + deps
    H = (gmst + dpsi * np.cos(eps * R) + lon - alpha) * R
    return np.degrees(np.arcsin(np.sin(lat * R) * np.sin(dec) + np.cos(lat * R) * np.cos(dec) * np.cos(H))), dec, H
def bisect(f, a, b, it=40):
    """vectorised bisection; a,b arrays; returns NaN where no sign change."""
    fa = f(a); fb = f(b); ok = np.sign(fa) != np.sign(fb)
    for _ in range(it):
        m = (a + b) / 2; fm = f(m); left = np.sign(fm) == np.sign(fa)
        a = np.where(left, m, a); fa = np.where(left, fm, fa); b = np.where(left, b, m)
    return np.where(ok, (a + b) / 2, np.nan)
def engine_V(c, tzs, asr_k=1, angles=(15, 18, 18.5)):
    lat, lon = c['lat'], c['lon']; out = {}
    J = lambda s: np.array([jd_ut(d, tz, x) for d, tz, x in zip(DAYS, tzs, s)])
    # transit: H = 0  -> solve on wrapped hour angle around solar noon guess
    guess = np.array([(12 - lon / 15 + tz) * 3600 for tz in tzs])
    def Hs(s): return ((vsop_alt(J(s), lat, lon)[2] / R + 180) % 360 - 180)
    noon = bisect(Hs, guess - 3 * 3600, guess + 3 * 3600)
    out['dhuhr'] = noon
    alt = lambda s: vsop_alt(J(s), lat, lon)[0]
    lo_m, hi_e = noon - 12 * 3600, noon + 12 * 3600
    def ev(h0, sign):
        f = lambda s: alt(s) - (h0(s) if callable(h0) else h0)
        return bisect(f, lo_m, noon) if sign < 0 else bisect(f, noon, hi_e)
    out['sunrise'] = ev(-0.8333, -1); out['maghrib'] = ev(-0.8333, 1)
    dn = vsop_alt(J(noon), lat, lon)[1]
    asr_alt = np.degrees(np.arctan(1 / (asr_k + np.tan(np.abs(lat * R - dn)))))
    for k in (1, 2):
        aa = np.degrees(np.arctan(1 / (k + np.tan(np.abs(lat * R - dn)))))
        f = lambda s, aa=aa: alt(s) - aa
        out['asr%d' % k] = np.where(alt(noon) > aa, bisect(f, noon, hi_e), np.nan)
    for a in angles:
        out['dawn%g' % a] = ev(-a, -1); out['dusk%g' % a] = ev(-a, 1)
    for a in (17,): out['dusk%g' % a] = ev(-a, 1)
    out['noon_alt'] = alt(noon); out['midnight_alt'] = alt(hi_e)
    return out
# --- N: NOAA reference (ref_precise.alt) -------------------------------------
def engine_N(c, tzs):
    lat, lon = c['lat'], c['lon']; out = {k: [] for k in ('dhuhr', 'sunrise', 'maghrib', 'asr1')}
    for d, tz in zip(DAYS, tzs):
        base = datetime.datetime(d.year, d.month, d.day) - datetime.timedelta(hours=tz)
        A = lambda s: RP.alt(base + datetime.timedelta(seconds=s), lat, lon)[0]
        lo, hi = 0.0, 86400.0; g = (12 - lon / 15 + tz) * 3600; lo, hi = g - 3 * 3600, g + 3 * 3600
        for _ in range(60):
            m1 = lo + (hi - lo) / 3; m2 = hi - (hi - lo) / 3
            if A(m1) < A(m2): lo = m1
            else: hi = m2
        noon = (lo + hi) / 2; out['dhuhr'].append(noon)
        def solve(f, a, b):
            fa, fb = f(a), f(b)
            if (fa < 0) == (fb < 0): return float('nan')
            return RP.solve(f, a, b)
        out['sunrise'].append(solve(lambda s: A(s) + 0.8333, noon - 43200, noon))
        out['maghrib'].append(solve(lambda s: A(s) + 0.8333, noon, noon + 43200))
        dn = RP.alt(base + datetime.timedelta(seconds=noon), lat, lon)[1]
        aa = math.degrees(math.atan(1 / (1 + math.tan(abs(math.radians(lat - dn))))))
        out['asr1'].append(solve(lambda s: A(s) - aa, noon, noon + 43200) if A(noon) > aa else float('nan'))
    return {k: np.array(v) for k, v in out.items()}
# --- U: uq-formula engine (closed form, iterated at event time) -------------
def engine_U(c, tzs, angle_f=None, angle_i=None):
    lat, lon = c['lat'], c['lon']; tz = np.array(tzs)
    def sun(local_min):
        jd = np.array([jd_ut(d, t, m * 60) for d, t, m in zip(DAYS, tz, local_min)])
        dec, eot, *_ = sun_vsop_full(jd, 69.0); return dec, eot
    base = 720 - 4 * lon + 60 * tz
    def ev(h0, sign):
        t = base + sign * 360.0
        for _ in range(5):
            dec, e = sun(t)
            if sign == 0: t = base - e; continue
            cH = (np.sin(h0 * R) - np.sin(lat * R) * np.sin(dec)) / (np.cos(lat * R) * np.cos(dec))
            with np.errstate(invalid='ignore'): t = base - e + sign * np.degrees(np.arccos(cH)) * 4
        return t * 60
    return {'dhuhr': ev(0, 0), 'sunrise': ev(-0.8333, -1), 'maghrib': ev(-0.8333, 1)}
if __name__ == '__main__':
    app = json.load(open(os.path.join(HERE, 'app.json')))['o']; res = {}
    for c in CFG['cities']:
        tzs = [tz_of(c['zone'], d) for d in DAYS]
        V = engine_V(c, tzs); N = engine_N(c, tzs); U = engine_U(c, tzs)
        A = {k: np.array([np.nan if r[k] is None else r[k] * 60 for r in app[c['id']]], float) for k in ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha')}
        Aest = [r['est'] for r in app[c['id']]]; Apol = [r['polar'] for r in app[c['id']]]; Atz = [r['tz'] for r in app[c['id']]]
        res[c['id']] = dict(tz=tzs, app_tz=Atz, V={k: v.tolist() for k, v in V.items()}, N={k: v.tolist() for k, v in N.items()},
                            U={k: v.tolist() for k, v in U.items()}, A={k: v.tolist() for k, v in A.items()}, est=Aest, polar=Apol)
        print(c['id'], 'done', flush=True)
    json.dump(res, open(os.path.join(HERE, 'world.json'), 'w'))
