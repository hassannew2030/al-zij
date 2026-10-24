from model import *
import pickle, os
cache = 'T_vsop.pkl'
if os.path.exists(cache): T = pickle.load(open(cache, 'rb'))
else: T = times('vsop'); pickle.dump(T, open(cache, 'wb'))
if __name__ == '__main__':
    for k in ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib']:
        o = OBS[:, :, PI[k]]; best = []
        for d in np.arange(-60, 60.01, 0.25):
            best.append(((rnd(T[k] + d / 60, k) == o).mean(), d))
        best.sort(reverse=True); print(k, [(round(a * 100, 3), b) for a, b in best[:4]])
