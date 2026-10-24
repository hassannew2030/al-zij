"""Grid: fixed local hour for declination and EoT, per prayer."""
from model import *
import itertools, sys
m = sys.argv[1] if len(sys.argv) > 1 else 'meeus_hp'
hours = [None] + list(range(-12, 37, 1))
out = {}
for key, alt, sign in [('fajr', lambda d, l: -18.5, -1), ('sunrise', lambda d, l: -0.833, -1), ('asr', asr_alt(1), 1), ('maghrib', lambda d, l: -0.833, 1), ('dhuhr', None, 0)]:
    best = []
    for hd, he in itertools.product(hours if key != 'dhuhr' else [None], hours):
        T = times(m, sample={key: (hd, he)}, iters=4 if (hd is None or he is None) else 1)
        r = (rnd(T[key], key) == OBS[:, :, PI[key]]).mean()
        best.append((round(r * 100, 3), hd, he))
    best.sort(key=lambda x: -x[0]); out[key] = best[:6]
    print(key, best[:6], flush=True)
