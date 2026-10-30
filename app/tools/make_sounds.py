#!/usr/bin/env python3
"""Notification sounds for the iPhone app — the same three tones the web Zij plays (brass / bell / soft), rendered to WAV.
iPhone plays a notification sound of at most 30 s; these are 2–4 s. Also writes silent.wav for «بدون صوت».
Run: python3 app/tools/make_sounds.py  → app/native/sounds/*.wav"""
import numpy as np, wave, os
SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'native', 'sounds')
def strike(buf, f, t, dur, vol):
    # same partials as the web: 1×, 2.76× (0.35), 5.4× (0.12); 20 ms rise, exponential fall
    n0 = int(t * SR); n = int((dur + .05) * SR); tt = np.arange(n) / SR
    env = np.where(tt < .02, (tt / .02), np.exp(-np.log(1e4) * (tt - .02) / max(dur - .02, .01)))
    s = sum(g * np.sin(2 * np.pi * f * m * tt) for m, g in [(1, 1), (2.76, .35), (5.4, .12)])
    end = min(len(buf), n0 + n); buf[n0:end] += (vol * env * s)[:end - n0]
def render(name, total, parts):
    buf = np.zeros(int(total * SR))
    for p in parts: strike(buf, *p)
    peak = np.max(np.abs(buf)) or 1; buf = buf / peak * .89
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf * 32767).astype('<i2').tobytes())
os.makedirs(OUT, exist_ok=True)
render('brass.wav', 4.4, [(f, o + d, du, .3) for o in (0, 1.6) for f, d, du in ((523.25, 0, 1.4), (659.25, .45, 1.4), (783.99, .9, 1.8))])
render('bell.wav', 2.0, [(880 if i == 2 else 660, o, .9, .28) for i, o in enumerate((0, .35, .7))])
render('soft.wav', 2.2, [(523.25, 0, 1.2, .16), (659.25, .5, 1.4, .16)])
with wave.open(os.path.join(OUT, 'silent.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b'\0\0' * (SR // 10))
print('ok', sorted(os.listdir(OUT)))
