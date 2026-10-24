from fast import *
R_ = np.pi / 180
lat = LAT[:, None]; lon = LON[:, None]
def asr_t(h_alt_dec, h_ha_dec, h_eot=None, k=1):
    dA = at_hour(h_alt_dec)[0]; dH = at_hour(h_ha_dec)[0]
    alt = np.arctan(1 / (k + np.tan(np.abs(lat * R_ - dA)))) / R_
    if h_eot is None:
        e = ev(0, 0)  # transit iterated
        return e + hour_angle(alt, lat, dH)
    return 900 - 4 * lon - at_hour(h_eot)[1] + hour_angle(alt, lat, dH)
if __name__ == '__main__':
    import sys
    res = []
    for ha in np.arange(12, 30.1, 2):
        for hh in np.arange(16, 30.1, 1):
            t = asr_t(float(ha), float(hh)); res.append((best_shift(t, 'asr', np.arange(-10, 10.1, 0.5)), ha, hh))
    res.sort(key=lambda x: -x[0][0])
    for r in res[:10]: print(r)
