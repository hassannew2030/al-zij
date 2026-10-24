from fast import *
R_ = np.pi / 180
def refr(h):  # Bennett, arcmin -> deg, for apparent altitude h (deg)
    return 1 / np.tan((h + 7.31 / (h + 4.4)) * R_) / 60
variants = {
 'std': lambda d, l: np.arctan(1 / (1 + np.tan(np.abs(l * R_ - d)))) / R_,
 'apparent(-refr)': lambda d, l: (lambda h: h - refr(h))(np.arctan(1 / (1 + np.tan(np.abs(l * R_ - d)))) / R_),
 'noon alt refracted': lambda d, l: (lambda hn: np.arctan(1 / (1 + 1 / np.tan(hn * R_))) / R_)(90 - np.abs(l - d / R_) + refr(90 - np.abs(l - d / R_))),
 'cot form via zenith+semi': lambda d, l: np.arctan(1 / (1 + np.tan(np.abs(l * R_ - d) + 0.2667 * R_))) / R_,
}
if __name__ == '__main__':
    for n, f in variants.items():
        t = ev(f, 1); print(n, best_shift(t, 'asr'), flush=True)
    for hd in [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]:
        t = ev(variants['std'], 1, hd=float(hd)); print('dec@', hd, best_shift(t, 'asr'), flush=True)
