# Independent high-precision reference (NOAA solar position, Meeus-based), solving each event to the second.
# Umm al-Qura rules: Fajr -18.5°, sunrise/sunset -0.833°, Asr shadow 1 (standard), Isha = Maghrib + 90 min (120 in Ramadan).
import math, sys, json, datetime
r = math.radians; d = math.degrees
def jd_of(dt):  # UTC datetime -> Julian Day
    a = (14 - dt.month) // 12; y = dt.year + 4800 - a; m = dt.month + 12 * a - 3
    jdn = dt.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
    return jdn - 0.5 + (dt.hour + dt.minute / 60 + dt.second / 3600 + dt.microsecond / 3.6e9) / 24
def sun(jd):
    T = (jd - 2451545.0) / 36525
    L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360
    M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
    e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
    C = math.sin(r(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) + math.sin(r(2 * M)) * (0.019993 - 0.000101 * T) + math.sin(r(3 * M)) * 0.000289
    lon = L0 + C; om = 125.04 - 1934.136 * T; lam = lon - 0.00569 - 0.00478 * math.sin(r(om))
    eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60
    eps = eps0 + 0.00256 * math.cos(r(om))
    dec = d(math.asin(math.sin(r(eps)) * math.sin(r(lam))))
    y = math.tan(r(eps / 2)) ** 2
    eot = 4 * d(y * math.sin(2 * r(L0)) - 2 * e * math.sin(r(M)) + 4 * e * y * math.sin(r(M)) * math.cos(2 * r(L0)) - 0.5 * y * y * math.sin(4 * r(L0)) - 1.25 * e * e * math.sin(2 * r(M)))
    return dec, eot  # degrees, minutes
def alt(utc, lat, lon):
    dec, eot = sun(jd_of(utc))
    tst = (utc.hour * 60 + utc.minute + utc.second / 60 + utc.microsecond / 6e7) + eot + 4 * lon
    ha = tst / 4 - 180
    return d(math.asin(math.sin(r(lat)) * math.sin(r(dec)) + math.cos(r(lat)) * math.cos(r(dec)) * math.cos(r(ha)))), dec
def solve(f, a, b):  # f(a)<0<f(b) or reverse; bisection on seconds
    fa = f(a)
    for _ in range(60):
        m = a + (b - a) / 2; fm = f(m)
        if (fm < 0) == (fa < 0): a, fa = m, fm
        else: b = m
    return a + (b - a) / 2
def day(y, mo, dd, lat, lon, tz, ramadan=False):
    base = datetime.datetime(y, mo, dd) - datetime.timedelta(hours=tz)  # local midnight in UTC
    T = lambda s: base + datetime.timedelta(seconds=s)
    A = lambda s: alt(T(s), lat, lon)[0]
    # transit: max altitude
    lo, hi = 6 * 3600, 18 * 3600
    for _ in range(80):
        m1 = lo + (hi - lo) / 3; m2 = hi - (hi - lo) / 3
        if A(m1) < A(m2): lo = m1
        else: hi = m2
    noon = (lo + hi) / 2
    dec_noon = alt(T(noon), lat, lon)[1]
    fajr = solve(lambda s: A(s) + 18.5, 0, noon)
    rise = solve(lambda s: A(s) + 0.833, 0, noon)
    sset = solve(lambda s: A(s) + 0.833, noon, 24 * 3600)
    asr_alt = d(math.atan(1 / (1 + math.tan(r(abs(lat - dec_noon))))))
    asr = solve(lambda s: A(s) - asr_alt, noon, sset)
    isha = sset + (120 if ramadan else 90) * 60
    return [x / 60 for x in (fajr, rise, noon, asr, sset, isha)]
if __name__ == '__main__':
    y, mo, lat, lon, tz = int(sys.argv[1]), int(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
    days = (datetime.date(y + (mo == 12), mo % 12 + 1, 1) - datetime.date(y, mo, 1)).days
    print(json.dumps([[dd] + day(y, mo, dd, lat, lon, tz) for dd in range(1, days + 1)]))
