#!/usr/bin/env bash
# Al-Zij — applies the app's native settings to the iOS project that `npx cap add ios` generates (macOS only).
# Idempotent: safe to run after every `cap add` / `cap sync`. Run from app/:  bash ios-config/configure-ios.sh
set -euo pipefail
cd "$(dirname "$0")/.."
APPDIR=ios/App/App
PLIST=$APPDIR/Info.plist
PB=/usr/libexec/PlistBuddy
[ -f "$PLIST" ] || { echo "no $PLIST — run: npx cap add ios"; exit 1; }

set_key() { # key type value
  $PB -c "Delete :$1" "$PLIST" >/dev/null 2>&1 || true
  $PB -c "Add :$1 $2 $3" "$PLIST"
}
set_key CFBundleDisplayName string "الزيج"
set_key CFBundleDevelopmentRegion string ar
$PB -c "Delete :CFBundleLocalizations" "$PLIST" >/dev/null 2>&1 || true
$PB -c "Add :CFBundleLocalizations array" "$PLIST"
$PB -c "Add :CFBundleLocalizations:0 string ar" "$PLIST"
$PB -c "Add :CFBundleLocalizations:1 string en" "$PLIST"
set_key ITSAppUsesNonExemptEncryption bool false
# the web app asks for these itself, only when the user opens the matching screen
set_key NSLocationWhenInUseUsageDescription string "الزّيج يستعمل موقعك لحساب مواقيت الصلاة واتجاه القبلة على جوالك فقط، ولا يُرسل إلى أحد. — Al-Zij uses your location only on your phone, to compute prayer times and the Qibla direction. It is never sent anywhere."
set_key NSMotionUsageDescription string "بوصلة القبلة تستعمل حساسات الحركة في جوالك. — The Qibla compass uses your phone's motion sensors."
# portrait only, like the web app's manifest
$PB -c "Delete :UISupportedInterfaceOrientations" "$PLIST" >/dev/null 2>&1 || true
$PB -c "Add :UISupportedInterfaceOrientations array" "$PLIST"
$PB -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait" "$PLIST"
$PB -c "Delete :UISupportedInterfaceOrientations~ipad" "$PLIST" >/dev/null 2>&1 || true
set_key UIUserInterfaceStyle string Dark
set_key UIStatusBarStyle string UIStatusBarStyleLightContent

# app icon (1024, no transparency) and launch screen
ICONSET=$APPDIR/Assets.xcassets/AppIcon.appiconset
if [ -d "$ICONSET" ]; then
  for f in "$ICONSET"/*.png; do cp resources/icon-1024.png "$f"; done
fi
SPLASH=$APPDIR/Assets.xcassets/Splash.imageset
if [ -d "$SPLASH" ]; then
  for f in "$SPLASH"/*.png; do cp resources/splash-2732.png "$f"; done
fi

# notification sounds also in the app bundle itself (iOS looks there and in Library/Sounds)
cp www-src/sounds/*.wav "$APPDIR/"
cp ios-config/PrivacyInfo.xcprivacy "$APPDIR/"

# add the new files to the Xcode target, iPhone only, version numbers
gem list -i xcodeproj >/dev/null 2>&1 || gem install --user-install xcodeproj >/dev/null
ruby ios-config/configure-xcode.rb
echo "iOS project configured."
