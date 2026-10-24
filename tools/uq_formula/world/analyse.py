"""Analysis of world.json -> results_world.json + printed tables.
Physics (sunrise/dhuhr/maghrib): seconds differences V(VSOP87 precise) vs N(NOAA), U(uq-formula engine), A(app engine).
Convention (fajr/isha/asr): app vs the PrayTimes/Aladhan oracle (tests/prayer/oracle.py, the reference the app is designed to follow),
plus physical existence of the twilight event (sun reaches -15/-18 deg?)."""
import os, sys, json, math, datetime, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '../../../tests/prayer'))
import oracle, ref_precise as RP
W = json.load(open(os.path.join(HERE, 'world.json'))); CFG = json.load(open(os.path.join(HERE, 'cities.json')))
APP = json.load(open(os.path.join(HERE, 'app.json')))
M = {'CA': APP['ca'], 'NO': APP['no']}; MN = APP['meth']
DAYS = [datetime.date(2027, 1, 1) + datetime.timedelta(i) for i in range(365)]
def stats(x):
    x = np.abs(np.asarray(x, float)); x = x[~np.isnan(x)]
    return dict(n=int(x.size), median=round(float(np.median(x)), 2) if x.size else None, p99=round(float(np.percentile(x, 99)), 2) if x.size else None, max=round(float(x.max()), 2) if x.size else None)
def wrap(d): return (np.asarray(d) + 43200) % 86400 - 43200
out = {}
for c in CFG['cities']:
    w = W[c['id']]; V, N, U, A = (w[k] for k in 'VNUA'); r = {}
    # civil-clock correction: the app (Chromium ICU tzdata) and the host tzdata (2026e) disagree for zones that
    # moved to permanent DST; put the app on the host clock so physics is compared on one clock. Reported separately.
    shift = (np.array(w['tz']) - np.array(w['app_tz'])) * 3600
    A = {k: (np.array(v, float) + shift).tolist() for k, v in A.items()}
    tzs = np.array(w['tz']); r['dst_mismatch_days'] = int(np.sum(np.abs(tzs - np.array(w['app_tz'])) > 1e-9))
    # NOAA transit (hour angle 0), not ref_precise's max-altitude moment
    Nt = []
    for d, tz in zip(DAYS, tzs):
        t = 720 - 4 * c['lon'] + 60 * tz
        for _ in range(3):
            utc = datetime.datetime(d.year, d.month, d.day) + datetime.timedelta(minutes=t - 60 * tz)
            t = 720 - 4 * c['lon'] + 60 * tz - RP.sun(RP.jd_of(utc))[1]
        Nt.append(t * 60)
    r['noaa_maxalt_minus_transit_s'] = stats(np.array(N['dhuhr']) - np.array(Nt))
    N = dict(N); N['dhuhr'] = Nt
    for k in ('sunrise', 'dhuhr', 'maghrib'):
        v = np.array(V[k], float)
        r['phys_' + k] = dict(NOAA_vs_VSOP=stats(wrap(np.array(N[k], float) - v)), uq_vs_VSOP=stats(wrap(np.array(U[k], float) - v)),
                              app_vs_VSOP=stats(wrap(np.array(A[k], float) - v)[~np.array(w['polar'])]),
                              app_polar_days_excluded=int(np.sum(w['polar'])),
                              no_event_days=int(np.isnan(v).sum()),
                              app_minute_match_vs_VSOP=round(float(np.nanmean(np.floor(np.array(A[k]) / 60 + 1e-9) == np.floor(v / 60 + 1e-9))) * 100, 2) if k else None)
    r['phys_asr1'] = dict(NOAA_vs_VSOP=stats(wrap(np.array(N['asr1'], float) - np.array(V['asr1'], float))))
    # physical existence of twilight events
    fa = M[c['cc']]['fajr']; ia = M[c['cc']].get('isha')
    r['days_no_sunrise_or_sunset'] = int(np.sum(np.isnan(V['sunrise']) | np.isnan(V['maghrib'])))
    r['days_fajr_angle_never_reached'] = int(np.sum(np.isnan(V['dawn%g' % fa])))
    r['days_isha_angle_never_reached'] = int(np.sum(np.isnan(V['dusk%g' % ia]))) if ia else None
    r['days_no_asr_shadow'] = int(np.sum(np.isnan(V['asr1'])))
    r['app_est_fajr_days'] = sum(1 for e in w['est'] if e.get('fajr')); r['app_est_isha_days'] = sum(1 for e in w['est'] if e.get('isha'))
    r['app_polar_days'] = sum(1 for p in w['polar'] if p)
    # convention: app vs oracle (PrayTimes) and vs true event where it exists
    orc = [oracle.times(d.year, d.month, d.day, c['lat'], c['lon'], tz, M[c['cc']]) for d, tz in zip(DAYS, tzs)]
    r['dst_mismatch_dates'] = [str(DAYS[i]) for i in np.where(shift != 0)[0][[0, -1]]] if (shift != 0).any() else []
    conv = {}
    for k in ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'):
        a = np.array(A[k], float) / 60; o = np.array([x[k] for x in orc], float)
        d = (a - o + 720) % 1440 - 720
        conv[k] = dict(app_vs_aladhan_s=stats(d * 60), minute_match_pct=round(float(np.mean(np.round(a) == np.round(o))) * 100, 2))
    # where the twilight event really exists: app (unestimated) vs VSOP true event
    a = np.array(A['fajr'], float); v = np.array(V['dawn%g' % fa], float); real = ~np.isnan(v) & np.array([not e.get('fajr') for e in w['est']])
    conv['fajr']['app_vs_VSOP_real_days_s'] = stats(wrap(a[real] - v[real]))
    if ia:
        a = np.array(A['isha'], float); v = np.array(V['dusk%g' % ia], float); real = ~np.isnan(v) & np.array([not e.get('isha') for e in w['est']])
        conv['isha']['app_vs_VSOP_real_days_s'] = stats(wrap(a[real] - v[real]))
    a = np.array(A['asr'], float); v = np.array(V['asr1'], float); real = ~np.isnan(v) & ~np.array(w['polar'])
    conv['asr']['app_vs_VSOP_real_days_s'] = stats(wrap(a[real] - v[real]))
    # polar substitution: days the app reckons at 65 deg although the real sun rises and sets here
    realrs = ~(np.isnan(V['sunrise']) | np.isnan(V['maghrib'])); pol = np.array(w['polar'])
    r['app_polar_but_real_sunrise_days'] = int(np.sum(pol & realrs))
    if (pol & realrs).any():
        ii = pol & realrs
        r['app_polar_but_real_sunrise_err_min'] = dict(sunrise=stats(wrap(np.array(A['sunrise'])[ii] - np.array(V['sunrise'])[ii]) / 60), maghrib=stats(wrap(np.array(A['maghrib'])[ii] - np.array(V['maghrib'])[ii]) / 60),
                                                       dates=[str(DAYS[i]) for i in np.where(ii)[0][[0, -1]]])
    # rule replaced a real event: estimated although the angle is actually reached
    fa_real = ~np.isnan(V['dawn%g' % fa]); est_f = np.array([bool(e.get('fajr')) for e in w['est']])
    r['fajr_rule_replaced_real_event_days'] = int(np.sum(fa_real & est_f))
    if ia:
        ia_real = ~np.isnan(V['dusk%g' % ia]); est_i = np.array([bool(e.get('isha')) for e in w['est']])
        r['isha_rule_replaced_real_event_days'] = int(np.sum(ia_real & est_i))
        dd = (np.array(A['isha'], float) - np.array(V['dusk%g' % ia], float))[ia_real & est_i] / 60
        r['isha_rule_vs_real_event_min'] = stats(dd) if dd.size else None
    dd = (np.array(A['fajr'], float) - np.array(V['dawn%g' % fa], float))[fa_real & est_f] / 60
    r['fajr_rule_vs_real_event_min'] = stats(dd) if dd.size else None
    r['convention'] = conv; r['method'] = MN[c['cc']]
    out[c['id']] = r
json.dump(out, open(os.path.join(HERE, 'results_world.json'), 'w'), indent=1, ensure_ascii=False)
for cid, r in out.items():
    print(cid, r['method'], 'polarButReal', r['app_polar_but_real_sunrise_days'], r.get('app_polar_but_real_sunrise_err_min'), 'maxalt-transit', r['noaa_maxalt_minus_transit_s'], 'DSTmismatch', r['dst_mismatch_days'], 'noRise/Set', r['days_no_sunrise_or_sunset'], 'noFajrAngle', r['days_fajr_angle_never_reached'], 'noIshaAngle', r['days_isha_angle_never_reached'], 'estF', r['app_est_fajr_days'], 'estI', r['app_est_isha_days'], 'polar', r['app_polar_days'])
    for k in ('sunrise', 'dhuhr', 'maghrib'):
        p = r['phys_' + k]; print('   %-8s NOAA %s | uq %s | app %s' % (k, p['NOAA_vs_VSOP'], p['uq_vs_VSOP'], p['app_vs_VSOP']))
    for k, v in r['convention'].items(): print('   conv %-8s %s' % (k, v))
