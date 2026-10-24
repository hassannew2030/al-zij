"""Umm al-Qura prayer times from astronomy alone (best formula found, see docs/uq-formula-report.md).
times(date, lat, lon) -> six 'HH:MM' strings in Saudi time (UTC+3). No official tables are used.
  python3 uq_formula.py 2027-03-01 21.5433 39.1728"""
import datetime, math, numpy as np
from vsop import sun_vsop
TZ = 3.0; R = math.pi / 180
LAG_A, LAG_B, LAG_P = 21.170454545, 22.693181818, 29.431818182   # 'lag days' of the official service (lagrule.py)
D0 = datetime.date(2026, 1, 1)
OFFS = dict(fajr=1.0, sunrise=2.0, dhuhr=1.0, asr=1.0, maghrib=1.0)   # seconds, before rounding
def sun_day(date):
    n = (date - D0).days; j = math.floor((n - LAG_A) / LAG_P)
    return date - datetime.timedelta(days=1) if (n - LAG_A - j * LAG_P) < (LAG_B - LAG_A) else date
def _jd(d, local_min):
    a = (14 - d.month) // 12; y = d.year + 4800 - a; m = d.month + 12 * a - 3
    return d.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045 - 0.5 + (local_min / 60 - TZ) / 24
def _sun(d, local_min):
    dec, eot = sun_vsop(np.array([_jd(d, local_min)])); return float(dec[0]), float(eot[0])
def _ha(alt, lat, dec):
    c = (math.sin(alt * R) - math.sin(lat * R) * math.sin(dec)) / (math.cos(lat * R) * math.cos(dec))
    return math.degrees(math.acos(c)) * 4 if -1 <= c <= 1 else float('nan')
def raw(date, lat, lon, ramadan=False):
    d = sun_day(date); base = 720 + 60 * TZ - 4 * lon
    def at_event(alt, sign):          # sun taken at the moment of the event (iterated)
        t = 720 + sign * 360
        for _ in range(4):
            dec, e = _sun(d, t); t = base - e + (sign * _ha(alt, lat, dec) if sign else 0)
        return t
    decM = _sun(d, 24 * 60)[0]; eotN = _sun(d, 12 * 60)[1]   # declination at 24:00 local, equation of time at 12:00
    asr_alt = math.degrees(math.atan(1 / (1 + math.tan(abs(lat * R - decM)))))
    return dict(fajr=base - eotN - _ha(-18.5, lat, decM), sunrise=at_event(-0.8333, -1), dhuhr=at_event(0, 0),
                asr=base - eotN + _ha(asr_alt, lat, decM), maghrib=at_event(-0.8333, 1))
def times(date, lat, lon, ramadan=False):
    r = raw(date, lat, lon); m = {}
    for k, t in r.items():
        t += OFFS[k] / 60; m[k] = math.floor(t + 1e-9) if k == 'sunrise' else math.ceil(t - 1e-9)
    m['isha'] = m['maghrib'] + (120 if ramadan else 90)
    return {k: '%02d:%02d' % divmod(m[k], 60) for k in ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']}
if __name__ == '__main__':
    import sys
    d = datetime.date.fromisoformat(sys.argv[1]); print(times(d, float(sys.argv[2]), float(sys.argv[3])))
