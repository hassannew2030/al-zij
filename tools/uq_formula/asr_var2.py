from fast import *
import pickle
R_ = np.pi / 180; lat = LAT[:, None]; lon = LON[:, None]
NOON = pickle.load(open('T_best.pkl', 'rb'))['dhuhr']
def asr_mixed(alt_hour=None, iters=3):
    """altitude from dec at noon (or alt_hour), hour angle with dec at the event (iterated)."""
    if alt_hour is None: dA = sp('vsop', NOON)[0]
    else: dA = at_hour(alt_hour)[0]
    alt = np.arctan(1 / (1 + np.tan(np.abs(lat * R_ - dA)))) / R_
    t = NOON + 200
    for _ in range(iters):
        d, e = sp('vsop', t); t = 900 - 4 * lon - e + hour_angle(alt, lat, d)
    return t
if __name__ == '__main__':
    for h in (None, 24.0):
        print('alt dec @', h, best_shift(asr_mixed(h), 'asr', np.arange(-4, 6.1, 0.5)), flush=True)
