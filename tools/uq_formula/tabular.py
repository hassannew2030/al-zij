"""Hypothesis: the official service converts the Umm al-Qura Hijri date back to a day number with an
arithmetic (tabular) Islamic calendar, so on some days the sun is computed for the neighbouring day."""
import json, numpy as np, datetime
from data import D0
LEAPS = {  # leap-year sets in 30-year cycle
 'I(15)': {2,5,7,10,13,15,18,21,24,26,29}, 'II(16)': {2,5,7,10,13,16,18,21,24,26,29},
 'III(Fatimid)': {2,5,8,10,13,16,19,21,24,27,29}, 'IV(Habash)': {2,5,8,11,13,16,19,21,24,27,30}}
EPOCHS = {'civil': 1948439.5, 'astronomical': 1948438.5}
def tab_jd(y, m, d, leaps, epoch):
    cyc, yy = divmod(y - 1, 30)
    days = cyc * 10631 + yy * 354 + sum(1 for k in range(1, yy + 1) if k in leaps)
    days += (m - 1) * 29 + m // 2 + d - 1
    return epoch + days
def hijri_list():
    H = []
    for y in range(2026, 2031): H += json.load(open('../../data/uq/%d.json' % y))['hijri']
    return H
def shifts(leaps, epoch):
    H = hijri_list(); out = []
    jd0 = 2461041.5  # 2026-01-01 00:00 UT
    for i, h in enumerate(H):
        y, m, d = map(int, h.split('-')); out.append(int(round(tab_jd(y, m, d, leaps, epoch) - (jd0 + i))))
    return np.array(out)
if __name__ == '__main__':
    from collections import Counter
    for ln, L in LEAPS.items():
        for en, E in EPOCHS.items():
            s = shifts(L, E); print(ln, en, Counter(s.tolist()))
