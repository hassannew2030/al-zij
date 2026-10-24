from fast import *
if __name__ == '__main__':
    res = []
    for hd in np.arange(22, 27.01, 0.5):
        for he in np.arange(10, 14.01, 1.0):
            t = ev(-18.5, -1, hd=float(hd), he=float(he)); res.append((best_shift(t, 'fajr', np.arange(-10, 10.1, 0.5)), hd, he))
    res.sort(key=lambda x: -x[0][0])
    for r in res[:8]: print(r, flush=True)
