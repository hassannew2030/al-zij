"""Ablations: what each ingredient is worth."""
import json, numpy as np, model, fast
from final import formula_times, minutes, OFFS
from model import OBS, PI, RAM, rnd, NC, ND, JD0
def score(T, offs):
    M = minutes(T, offs); p = dict(PI, isha=5)
    r = {k: round(100 * (M[k] == OBS[:, :, p[k]]).mean(), 3) for k in M}; r['all'] = round(np.mean(list(r.values())), 3); return r
out = {}
# 1) without the lag-day rule
saved = model.JDS.copy(); model.JDS[:] = JD0; fast.at_hour.cache_clear()
out['vsop, no lag rule'] = score(formula_times(), OFFS)
model.JDS[:] = saved; fast.at_hour.cache_clear()
# 2) current app style (Meeus ch.25 sun, Fajr dec@23 eot@10, no +1 s, lag on)
def ev_model(m, *a, **k):
    return fast.ev(*a, model=m, **k)
T = dict(fajr=ev_model('noaa', -18.5, -1, hd=23.0, he=10.0), sunrise=ev_model('noaa', -0.833, -1), dhuhr=ev_model('noaa', 0, 0),
         asr=ev_model('noaa', model.asr_alt(1), 1), maghrib=ev_model('noaa', -0.833, 1))
out['app engine (Meeus ch.25, fajr dec@23/eot@10), lag rule ON'] = score(T, dict(fajr=0, sunrise=0, dhuhr=0, asr=0, maghrib=0))
saved = model.JDS.copy(); model.JDS[:] = JD0; fast.at_hour.cache_clear()
T = dict(fajr=ev_model('noaa', -18.5, -1, hd=23.0, he=10.0), sunrise=ev_model('noaa', -0.833, -1), dhuhr=ev_model('noaa', 0, 0),
         asr=ev_model('noaa', model.asr_alt(1), 1), maghrib=ev_model('noaa', -0.833, 1))
out['app engine as shipped (no lag rule)'] = score(T, dict(fajr=0, sunrise=0, dhuhr=0, asr=0, maghrib=0))
model.JDS[:] = saved
json.dump(out, open('results/ablation.json', 'w'), indent=1); print(json.dumps(out, indent=1))
