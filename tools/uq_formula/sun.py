"""Vectorised sun models. Each returns (declination [rad], equation of time [min]) for Julian Day(s) jd (UT).
- noaa: Meeus ch.25 low-precision (what tests/prayer/ref_precise.py and the app use), ~0.01 deg
- simple: the USNO/PrayTimes 'approximate' almanac formula (common in prayer apps)
- meeus_hp: Meeus with aberration+nutation in longitude and obliquity (true equinox), EoT from RA (exact definition)"""
import numpy as np
R = np.pi / 180
def jd_from(y, m, d, hour_utc=0.0):
    y = np.asarray(y); m = np.asarray(m); d = np.asarray(d)
    a = (14 - m) // 12; yy = y + 4800 - a; mm = m + 12 * a - 3
    jdn = d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - yy // 100 + yy // 400 - 32045
    return jdn - 0.5 + np.asarray(hour_utc) / 24.0
def noaa(jd, dt=0.0):
    T = (jd + dt / 86400 - 2451545.0) / 36525
    L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360
    M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
    e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
    C = np.sin(M * R) * (1.914602 - T * (0.004817 + 0.000014 * T)) + np.sin(2 * M * R) * (0.019993 - 0.000101 * T) + np.sin(3 * M * R) * 0.000289
    om = 125.04 - 1934.136 * T; lam = L0 + C - 0.00569 - 0.00478 * np.sin(om * R)
    eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * np.cos(om * R)
    dec = np.arcsin(np.sin(eps * R) * np.sin(lam * R))
    y = np.tan(eps * R / 2) ** 2
    eot = 4 / R * (y * np.sin(2 * L0 * R) - 2 * e * np.sin(M * R) + 4 * e * y * np.sin(M * R) * np.cos(2 * L0 * R) - 0.5 * y * y * np.sin(4 * L0 * R) - 1.25 * e * e * np.sin(2 * M * R))
    return dec, eot
def simple(jd, dt=0.0):
    D = jd - 2451545.0
    g = (357.529 + 0.98560028 * D) % 360; q = (280.459 + 0.98564736 * D) % 360
    L = (q + 1.915 * np.sin(g * R) + 0.020 * np.sin(2 * g * R)) % 360
    e = 23.439 - 0.00000036 * D
    RA = np.arctan2(np.cos(e * R) * np.sin(L * R), np.cos(L * R)) / R / 15
    dec = np.arcsin(np.sin(e * R) * np.sin(L * R))
    eqt = q / 15 - (RA % 24); eqt = (eqt + 12) % 24 - 12
    return dec, eqt * 60
def meeus_hp(jd, dt=69.0):
    T = (jd + dt / 86400 - 2451545.0) / 36525
    L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T))
    M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
    C = np.sin(M * R) * (1.914602 - T * (0.004817 + 0.000014 * T)) + np.sin(2 * M * R) * (0.019993 - 0.000101 * T) + np.sin(3 * M * R) * 0.000289
    om = 125.04452 - 1934.136261 * T; Ls = 280.4665 + 36000.7698 * T; Lm = 218.3165 + 481267.8813 * T
    dpsi = (-17.20 * np.sin(om * R) - 1.32 * np.sin(2 * Ls * R) - 0.23 * np.sin(2 * Lm * R) + 0.21 * np.sin(2 * om * R)) / 3600
    deps = (9.20 * np.cos(om * R) + 0.57 * np.cos(2 * Ls * R) + 0.10 * np.cos(2 * Lm * R) - 0.09 * np.cos(2 * om * R)) / 3600
    lam = L0 + C - 0.005691611 / (1 - 0.016708634 * np.cos((M + C) * R)) + dpsi  # true lon, aberration (approx)
    eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + deps
    dec = np.arcsin(np.sin(eps * R) * np.sin(lam * R))
    ra = np.arctan2(np.cos(eps * R) * np.sin(lam * R), np.cos(lam * R)) / R
    E = (L0 - 0.0057183 - ra + dpsi * np.cos(eps * R))
    E = (E + 180) % 360 - 180
    return dec, 4 * E
MODELS = {'noaa': noaa, 'simple': simple, 'meeus_hp': meeus_hp}

from vsop import sun_vsop
def vsop(jd, dt=69.0): return sun_vsop(jd, dt or 69.0)
def vsop_nodt(jd, dt=0.0): return sun_vsop(jd, 0.0)
MODELS.update(vsop=vsop, vsop_nodt=vsop_nodt)
