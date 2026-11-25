#!/usr/bin/env bash
# Al-Zij — applies the app's native settings to the iOS project that `npx cap add ios` generates (macOS only).
# Idempotent: safe to run after every `cap add` / `cap sync`. Run from app/:  bash ios-config/configure-ios.sh
set -euo pipefail
cd "$(dirname "$0")/.."
APPDIR=ios/App/App
PLIST=$APPDIR/Info.plist
PB=/usr/libexec/PlistBuddy
[ -f "$PLIST" ] || { echo "no $PLIST — run: npx cap add ios"; exit 1; }

set_key() { # key type value — string values are quoted for PlistBuddy («phone's» broke it: «Parse Error: Unclosed Quotes»)
  $PB -c "Delete :$1" "$PLIST" >/dev/null 2>&1 || true
  if [ "$2" = string ]; then $PB -c "Add :$1 string \"${3//\"/\\\"}\"" "$PLIST"; else $PB -c "Add :$1 $2 $3" "$PLIST"; fi
  [ "$($PB -c "Print :$1" "$PLIST")" = "$3" ] || { echo "::error::Info.plist $1 was not set as given"; exit 1; }
}
set_key CFBundleDisplayName string "الزيج"
set_key CFBundleDevelopmentRegion string ar
$PB -c "Delete :CFBundleLocalizations" "$PLIST" >/dev/null 2>&1 || true
$PB -c "Add :CFBundleLocalizations array" "$PLIST"
$PB -c "Add :CFBundleLocalizations:0 string ar" "$PLIST"
$PB -c "Add :CFBundleLocalizations:1 string en" "$PLIST"
set_key ITSAppUsesNonExemptEncryption bool false
# the web app asks for these itself, only when the user opens the matching screen
# (25 Nov: «ولا يُرسل إلى أحد» removed — the district name now comes from Apple Maps, and the Aladhan check still waits for Hassan's decision)
set_key NSLocationWhenInUseUsageDescription string "يستعمل الزّيج موقعك على جوالك لحساب مواقيت الصلاة واتجاه القبلة، ولمعرفة اسم مدينتك وحيّك من خرائط آبل. — Al-Zij uses your location on your phone to compute prayer times and the Qibla direction, and to name your city and district with Apple Maps."
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
# Time Sensitive notifications (#71) — the entitlement file; configure-xcode.rb points CODE_SIGN_ENTITLEMENTS at it
cp ios-config/App.entitlements "$APPDIR/"
plutil -lint "$APPDIR/App.entitlements"

# the app's own native code (table #98): Apple place names, and the view controller that registers that plugin
cp ios-config/native/*.swift "$APPDIR/"
SB=$APPDIR/Base.lproj/Main.storyboard
if ! grep -q 'customClass="ZijViewController"' "$SB"; then
  sed -i '' -E 's/customClass="CAPBridgeViewController"( customModule="Capacitor")?/customClass="ZijViewController" customModule="App" customModuleProvider="target"/' "$SB"
fi
grep -q 'customClass="ZijViewController" customModule="App"' "$SB" || { echo "::error::Main.storyboard: CAPBridgeViewController not found — the app would start without its own plugins"; exit 1; }

# add the new files to the Xcode target, iPhone only, version numbers
gem list -i xcodeproj >/dev/null 2>&1 || gem install --user-install xcodeproj >/dev/null
ruby ios-config/configure-xcode.rb
echo "iOS project configured."
