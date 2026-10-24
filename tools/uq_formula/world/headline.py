"""Country-level headline numbers from results_world.json + world.json."""
import json, os, numpy as np, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, 'results_world.json'))); C = json.load(open(os.path.join(HERE, 'cities.json')))['cities']
W = json.load(open(os.path.join(HERE, 'world.json')))
out = {}
for cc in ('CA', 'NO'):
    ids = [c['id'] for c in C if c['cc'] == cc]; h = {}
    for k in ('sunrise', 'dhuhr', 'maghrib'):
        h['physics_' + k] = {e: dict(median=round(float(np.median([R[i]['phys_' + k][e]['median'] for i in ids])), 2), max=max(R[i]['phys_' + k][e]['max'] for i in ids))
                             for e in ('uq_vs_VSOP', 'app_vs_VSOP', 'NOAA_vs_VSOP')}
    for k in ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'):
        cv = [R[i]['convention'][k] for i in ids]
        h['conv_' + k] = dict(minute_match_vs_aladhan_pct=round(float(np.mean([x['minute_match_pct'] for x in cv])), 2),
                             max_s_vs_aladhan=max(x['app_vs_aladhan_s']['max'] for x in cv),
                             real_event_max_s_vs_VSOP=max((x['app_vs_VSOP_real_days_s']['max'] for x in cv if 'app_vs_VSOP_real_days_s' in x and x['app_vs_VSOP_real_days_s']['n']), default=None))
    h['rule_days'] = {i: dict(no_sunrise_sunset=R[i]['days_no_sunrise_or_sunset'], fajr_angle_not_reached=R[i]['days_fajr_angle_never_reached'],
                              isha_angle_not_reached=R[i]['days_isha_angle_never_reached'], app_estimated_fajr=R[i]['app_est_fajr_days'],
                              app_estimated_isha=R[i]['app_est_isha_days'], app_polar_65=R[i]['app_polar_days'],
                              app_polar_although_sun_rises=R[i]['app_polar_but_real_sunrise_days'], fajr_rule_replaced_real=R[i]['fajr_rule_replaced_real_event_days'], isha_rule_replaced_real=R[i].get('isha_rule_replaced_real_event_days'), fajr_rule_vs_real_min=R[i]['fajr_rule_vs_real_event_min'], isha_rule_vs_real_min=R[i].get('isha_rule_vs_real_event_min'), clock_offset_differs_days=R[i]['dst_mismatch_days']) for i in ids}
    out[cc] = h
# Bodø/Tromsø: why polar substitution although the sun rises -> noon altitude on those days
for i in ('bodo', 'tromso'):
    w = W[i]; V = w['V']; pol = np.array(w['polar']); rs = ~(np.isnan(V['sunrise']) | np.isnan(V['maghrib']))
    ii = np.where(pol & rs)[0]
    out['why_' + i] = dict(noon_alt_deg_range=[round(float(np.min(np.array(V['noon_alt'])[ii])), 2), round(float(np.max(np.array(V['noon_alt'])[ii])), 2)],
                          asr_minus_noon_min=[round(float(np.nanmin((np.array(V['asr1']) - np.array(V['dhuhr']))[ii] / 60)), 1), round(float(np.nanmax((np.array(V['asr1']) - np.array(V['dhuhr']))[ii] / 60)), 1)],
                          days=[str(datetime.date(2027, 1, 1) + datetime.timedelta(int(d))) for d in ii])
json.dump(out, open(os.path.join(HERE, 'headline.json'), 'w'), indent=1)
print(json.dumps(out, indent=1)[:6000])
