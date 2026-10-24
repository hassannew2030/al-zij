from model import *
import vsop
def eot_day(fn, hour):
    _, e = fn(JDS + (hour - TZ) / 24); return e
def test(fn, hour, mode, label):
    e = eot_day(fn, hour) * 60  # seconds
    es = {'none': e, 'round': np.round(e), 'floor': np.floor(e), 'ceil': np.ceil(e), 'round0.1': np.round(e, 1)}[mode]
    best = (0, 0)
    for c in np.arange(-2, 2.01, 0.05):
        t = 900 - 4 * LON[:, None] - es[None, :] / 60 + c / 60
        s = (ceil(t) == OBS[:, :, 2]).mean(); best = max(best, (s, round(c, 2)))
    print(label, hour, mode, best, flush=True)
if __name__ == '__main__':
    for nm, fn in [('gast-noab-dt0', lambda j: vsop.sun_gast(j, 0, aberr=None)), ('meeusE dt69', lambda j: vsop.sun_vsop(j, 69.0))]:
        for h in (12.0,):
            for mode in ('none', 'round', 'floor', 'ceil'):
                test(fn, h, mode, nm)
