#!/usr/bin/env bash
# Al-Zij — applies the app's native settings to the Android project that `npx cap add android` generates (Linux or macOS).
# Idempotent: safe after every `cap add` / `cap sync`. Run from app/:  bash android-config/configure-android.sh
# Version: versionName = package.json version; versionCode = $ZIJ_BUILD_NUMBER (CI run number), default 1.
set -euo pipefail
cd "$(dirname "$0")/.."
A=android/app
RES=$A/src/main/res
MAN=$A/src/main/AndroidManifest.xml
[ -f "$MAN" ] || { echo "no $MAN — run: npx cap add android"; exit 1; }

# 1 · name on the home screen: the same short name as the iPhone (the store listing is «الزيج — Al-Zij», table #73)
python3 - "$RES/values/strings.xml" <<'PY'
import re, sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
for key in ('app_name', 'title_activity_main'):
    s = re.sub(r'(<string name="%s">)[^<]*(</string>)' % key, r'\g<1>الزيج\g<2>', s)
open(p, 'w', encoding='utf-8').write(s)
PY

# 2 · alert sounds: Android plays a channel's sound from res/raw; names may only use a–z 0–9 _ (zij-brass.wav → zij_brass.wav)
mkdir -p "$RES/raw"
for f in www-src/sounds/*.wav; do b=$(basename "$f" .wav); cp "$f" "$RES/raw/${b//-/_}.wav"; done

# 3 · status-bar icon (white silhouette) and launcher icons from the same picture as the iPhone icon
mkdir -p "$RES/drawable"
cp android-config/res/drawable/ic_stat_zij.xml "$RES/drawable/"
python3 android-config/make-icons.py

# 4 · manifest: portrait like the web app; location for prayer times and the Qibla (asked by the page only when needed)
python3 - "$MAN" <<'PY'
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if 'android:screenOrientation' not in s:
    s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"', 1)
for perm in ('ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'):
    tag = '<uses-permission android:name="android.permission.%s" />' % perm
    if tag not in s:
        s = s.replace('</manifest>', '    %s\n</manifest>' % tag, 1)
open(p, 'w', encoding='utf-8').write(s)
PY

# 5 · version numbers
VN=$(node -p "require('./package.json').version")
VC=${ZIJ_BUILD_NUMBER:-1}
sed -i.bak -E "s/versionCode [0-9]+/versionCode $VC/; s/versionName \"[^\"]*\"/versionName \"$VN\"/" "$A/build.gradle" && rm -f "$A/build.gradle.bak"
grep -E "applicationId|versionCode|versionName" "$A/build.gradle"
echo "Android project configured."
