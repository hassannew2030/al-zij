#!/usr/bin/env python3
"""Render Al-Zij's three in-app alert tones (index.html, #alertsJs -> strike()/play()) into short WAV files for iOS notifications.

Self-generated (no recording, no licence needed). iOS plays a custom notification sound only if it is <= 30 s;
these are 2-5 s. A real muezzin recording (table row #30) replaces zij-brass.wav later, with written permission,
trimmed to <= 30 s (e.g. the takbir only).

Usage: python3 app/scripts/make-sounds.py app/www-src/sounds
"""
import math, struct, sys, wave, os

RATE = 44100

def strike(buf, f, t, dur, vol):
    # same partials and envelope as the web app: [1, 2.76, 5.4] x [1, .35, .12], 20 ms attack, exponential decay to 1e-4
    for m, g in ((1, 1), (2.76, .35), (5.4, .12)):
        peak = vol * g
        start = int(t * RATE)
        n = int((dur + .05) * RATE)
        for i in range(n):
            s = i / RATE
            if s < .02:
                env = 1e-4 * (peak / 1e-4) ** (s / .02)
            elif s <= dur:
                env = peak * (1e-4 / peak) ** ((s - .02) / (dur - .02))
            else:
                env = 0
            j = start + i
            if j < len(buf):
                buf[j] += env * math.sin(2 * math.pi * f * m * s)

def render(kind):
    length = {'brass': 5.0, 'bell': 2.0, 'soft': 2.2}[kind]
    buf = [0.0] * int(length * RATE)
    t = .05
    if kind == 'brass':
        for o in (0, 1.6):
            strike(buf, 523.25, t + o, 1.4, .32); strike(buf, 659.25, t + o + .45, 1.4, .3); strike(buf, 783.99, t + o + .9, 1.8, .3)
    elif kind == 'bell':
        for i, o in enumerate((0, .35, .7)):
            strike(buf, 880 if i == 2 else 660, t + o, .9, .28)
    else:
        strike(buf, 523.25, t, 1.2, .16); strike(buf, 659.25, t + .5, 1.4, .16)
    peak = max(abs(x) for x in buf) or 1
    gain = .89 / peak  # normalise: a notification has to be heard from a pocket
    return [max(-1, min(1, x * gain)) for x in buf]

def main(out):
    os.makedirs(out, exist_ok=True)
    for kind in ('brass', 'bell', 'soft'):
        data = render(kind)
        path = os.path.join(out, 'zij-%s.wav' % kind)
        with wave.open(path, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes(b''.join(struct.pack('<h', int(x * 32767)) for x in data))
        print('%s  %.1f s' % (path, len(data) / RATE))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'www-src', 'sounds'))
