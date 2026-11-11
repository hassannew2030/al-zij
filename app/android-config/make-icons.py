#!/usr/bin/env python3
"""Al-Zij — Android launcher icons from app/resources/icon-1024.png (the same picture as the iPhone icon).
Writes, into android/app/src/main/res: mipmap-*/ic_launcher.png (square), ic_launcher_round.png (circle) and
ic_launcher_foreground.png (adaptive icon, Android 8+), plus the adaptive background colour taken from the icon's corner.
Run from app/:  python3 android-config/make-icons.py"""
import os, sys
from PIL import Image, ImageDraw

SRC = 'resources/icon-1024.png'
RES = 'android/app/src/main/res'
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
if not os.path.isdir(RES):
    sys.exit('no %s — run: npx cap add android' % RES)
icon = Image.open(SRC).convert('RGBA')
bg = icon.getpixel((4, 4))[:3]
for name, k in DENS.items():
    d = os.path.join(RES, 'mipmap-' + name)
    os.makedirs(d, exist_ok=True)
    n = round(48 * k)
    sq = icon.resize((n, n), Image.LANCZOS)
    sq.save(os.path.join(d, 'ic_launcher.png'))
    mask = Image.new('L', (n * 4, n * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, n * 4 - 1, n * 4 - 1), fill=255)
    rnd = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    rnd.paste(sq, (0, 0), mask.resize((n, n), Image.LANCZOS))
    rnd.save(os.path.join(d, 'ic_launcher_round.png'))
    # adaptive: a 108 dp layer; the launcher shows about the middle 72 dp, so the picture is drawn at 76 dp on its own colour
    f = round(108 * k); inner = round(76 * k)
    fg = Image.new('RGBA', (f, f), bg + (255,))
    fg.paste(icon.resize((inner, inner), Image.LANCZOS), ((f - inner) // 2, (f - inner) // 2))
    fg.save(os.path.join(d, 'ic_launcher_foreground.png'))
vals = os.path.join(RES, 'values')
os.makedirs(vals, exist_ok=True)
with open(os.path.join(vals, 'ic_launcher_background.xml'), 'w') as fh:
    fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n' % bg)
print('launcher icons written, background #%02X%02X%02X' % bg)
