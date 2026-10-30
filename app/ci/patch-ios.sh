#!/bin/bash
# After «npx cap add ios»: name, permissions text (Arabic), and store answers in Info.plist. Safe to run again.
set -e
PL="ios/App/App/Info.plist"
pb(){ /usr/libexec/PlistBuddy -c "$1" "$PL" 2>/dev/null || true; }
set_(){ pb "Delete :$1"; /usr/libexec/PlistBuddy -c "Add :$1 $2 $3" "$PL"; }
set_ CFBundleDisplayName string "الزيج"
set_ CFBundleDevelopmentRegion string "ar"
set_ NSLocationWhenInUseUsageDescription string "الزيج يحتاج موقعك ليحسب مواقيت الصلاة واتجاه القبلة لمكانك. الموقع يبقى على جوالك ولا يُرسل لأحد."
set_ NSMotionUsageDescription string "الزيج يستخدم بوصلة الجوال ليريك اتجاه القبلة."
set_ ITSAppUsesNonExemptEncryption bool false
set_ UIRequiresFullScreen bool true
pb "Delete :UIUserInterfaceStyle"; /usr/libexec/PlistBuddy -c "Add :UIUserInterfaceStyle string Dark" "$PL"
echo "Info.plist patched"
