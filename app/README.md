# Al-Zij iPhone and Android apps (Capacitor)

The App Store app is a native shell around the same offline web app that runs at alzijapp.com. The web files at the repo root are **only read**; everything native lives in `app/`. Its main native feature is **adhan alerts that fire when the phone is locked or Al-Zij is closed**, using iOS local notifications. There is no server, no push service and no data collection.

| | |
|---|---|
| Capacitor | 8.5.3 (latest stable, Oct 2026) · plugins: local-notifications 8.3.1, filesystem 8.1.5, app 8.1.2 |
| App ID | `com.alzijapp.app`. **This is a proposal. Hassan confirms it before the App Store Connect record is created, and it cannot change after that.** |
| Name | الزيج (display name; Arabic first, English inside the app) |
| iOS | iPhone only, portrait, dark |
| Privacy | `PrivacyInfo.xcprivacy`: no tracking, no collected data. App Store label: **Data Not Collected** |

## Layout

```
app/
  package.json, capacitor.config.json
  www-src/                 native parts (the only code that is not the website)
    zij-schedule.js        alert planner: pure logic, unit-tested
    zij-native.js          bridge, active only inside Capacitor
    zij-live-update.js     silent web updates
    zij-inject.js          inserts the bridge into a COPY of index.html
    sounds/zij-*.wav       the app's three alert tones rendered to files (2–5 s)
  scripts/
    bundle-web.mjs         repo root → app/www (the copy the app ships)
    make-sounds.py         regenerates sounds/ from the web app's tone recipe
  ios-config/
    configure-ios.sh       Info.plist keys, icon, splash, sounds, privacy manifest, iPhone-only
    configure-xcode.rb     adds those files to the Xcode target
    PrivacyInfo.xcprivacy
  resources/               icon-1024.png (no alpha) and splash-2732.png, made from icons/icon.svg
  test/
    schedule.test.mjs      planner unit tests (node --test, no install)
    inject.test.mjs        injection tests
    bridge.e2e.mjs         real bundled page + mock Capacitor in headless Chromium
.github/workflows/ios-build.yml   macOS runner: test → bundle → cap add/sync → simulator build; TestFlight job (TODO)
```

`app/www` and `app/ios` are generated and are not committed. CI recreates `ios/` with `npx cap add ios` and then runs `configure-ios.sh`. When the project needs hand edits in Xcode (widgets, #28), commit `app/ios` and remove it from `.gitignore`.

## Commands

```bash
cd app
npm install
npm test               # 31 planner and injection tests (5 for Android)
npm run bundle         # → app/www, 9 MB
npm run test:e2e       # 36 checks in the real page, iPhone and Android mocks (needs Playwright + Chromium)
# macOS only:
npx cap add ios && bash ios-config/configure-ios.sh && npx cap sync ios && npx cap open ios
```

## How the adhan alerts work

1. **Source of the times.** The bridge calls the page's own engine for each coming day: `observer.realPrayerTimes(date, hijriCal.fromGregorian(date))`. This is the same call the screen and the in-page alerts make. Inside Saudi Arabia it returns the official Umm al-Qura minute from `data/uq/c/<id>.json`. Elsewhere it uses the astronomical engine, with each day's own UTC offset (`observer.tzAt`), so daylight-saving changes inside the window are handled. The bridge waits up to 6 s for `zijUQ.ready()` so the first plan already uses the official table. Fractional minutes are rounded the way `AstroMath.minToHHMM` rounds them on screen.
2. **Settings.** The bridge reads the user's own `zijAlerts` object (`zijAlerts.get()`): master switch, plus for each prayer `pre {on,min,snd}`, `adhan {on,snd}` and `iqama {on,min,snd}`. Nothing is duplicated, and the native app has no settings screen of its own.
3. **Planner** (`ZijSchedule.plan`) — **the adhan first** (table #71, Hassan's design of 31 Oct). It expands every enabled alert over the coming days and drops any alert less than 15 s away. Then it fills the 63 alert slots in two steps:
   1. **Every main alert of the next 8 days** (`GUARANTEE_DAYS`). A prayer's main alert is its adhan; if the user turned that adhan off, it is the before-adhan alert, else the iqamah.
   2. **The nearest of everything else** fills the slots left: the before-adhan and iqamah alerts of the coming days, then the adhans beyond day 8.

   The 64th slot is a reminder, placed about a day before the end of the adhan window and moved out of 21:00–09:00, that says «افتح الزّيج ليستمر تنبيه الأذان». iOS keeps at most 64 pending local notifications per app and silently drops the rest. Coverage with no app open:

   | Settings | Adhan | Before-adhan / iqamah |
   |---|---|---|
   | Adhan only (the default) | 63 ÷ 5 ≈ 12½ days | — |
   | All three alerts | **8 days** (40) | the nearest 23 ≈ 2 days |

   Before this change the planner kept the 63 nearest alerts of any kind, so with all three alerts on the adhan lasted only about 4 days. The plan also reports `mainUntil` and `extraUntil`, so the status line says how far each kind reaches. The bridge fetches enough days for both steps.
4. **Wording.** Titles and bodies are the web app's own text from `#alertsJs → fire()`, in Arabic or English, with Arabic or Latin digits. On Friday Dhuhr becomes الجمعة / Jumu'ah.
   - **Friday iqamah (Hassan, 10 Nov).** On a Friday, Dhuhr's iqamah comes from `p.dhuhr.friIqama {on, min, snd}`, and it is **off unless the user turns it on**: at Jumu'ah the imam calls the iqamah, and the phone must not ring in the mosque. It is meant for someone praying away from the mosque, so its own minutes are separate from the weekday iqamah and its wording is neutral («🕌 حان الآن وقت إقامة الصلاة»).
5. **When it reschedules.**
   - Every launch.
   - Every return to the foreground (`visibilitychange` and the `App` `resume` event).
   - Whenever a fingerprint changes. The fingerprint covers the alert settings, place, method, Asr school, mosque offsets, high-latitude rule, language, digits, country, date and Hijri offset, and is polled every 4 s.

   - Whenever the phone's time-zone offset changes (travel), which is part of the fingerprint.

   It **schedules first**: the same ids replace the old requests in place. It then cancels the ids that are no longer in the plan and checks the count iOS holds, retrying once on a mismatch. If scheduling fails, the phone keeps its old alerts and is never left with none. It never schedules before the permission is granted, because the plugin's `schedule()` would prompt by itself. The days start from **yesterday**, so yesterday's Isha or iqamah after midnight is not lost. If nothing changed, it does no work.
5b. **Interruption level and entitlement.** Every prayer alert is `timeSensitive`, so it passes Focus and the scheduled Notification Summary. The reminder is `active`. @capacitor/local-notifications 8.3.1 supports `interruptionLevel` (since 8.1.0) and schedules an `at` date as a `UNTimeIntervalNotificationTrigger`; both were checked in its source. The entitlement `com.apple.developer.usernotifications.time-sensitive` is in `ios-config/App.entitlements`; `configure-ios.sh` copies it and `configure-xcode.rb` sets `CODE_SIGN_ENTITLEMENTS`. The TestFlight job checks the signed app for it. Time Sensitive does **not** pass the ring/silent switch; only an AlarmKit alarm will (#66).
6. **Permission.** It is **never asked on first launch**, following the owner's zero-interaction rule. It is asked in either of two cases:
   - The user taps «🔔 اسمح بتنبيه الأذان» on the alerts card.
   - The user flips any alert switch there.

   If the user denies it, the card shows a button that opens iPhone Settings. The web-only line «التنبيه والجوال مقفول يأتي مع تطبيق الزّيج في المتجر» and the browser-notification button are replaced inside the app with a status line, for example «✅ … محفوظة على جوالك لـ١٣ يومًا قادمة».
7. **Foreground.** Notifications are scheduled with `silent: true`. While Al-Zij is on screen, iOS does not show them, because the page itself already rings and shows its banner, so the alert is not doubled. With the phone locked or the app in the background, they show normally with sound.
8. **Sounds.** The three tones (`brass`, `bell`, `soft`) are rendered from the same recipe the web app plays with Web Audio, so they need no licence. They are 2–5 s long; iOS allows at most 30 s. They ship in the app bundle and are also copied to `Library/Sounds`. If the user picks «بدون صوت», the notification is a message only.
9. **Reminder.** The reminder is placed about a day before the end of the adhan window, and moved 30 min away from any alert, because "a day before the last adhan" falls on the same prayer the day before.
   - **A real muezzin recording (table #30)** needs written permission and must be at most 30 s, for example the takbir only.
   - To add one, replace `www-src/sounds/zij-brass.wav`, or add a new key to `SOUND_FILES` together with a choice in the web app's sound list.

## Other bridge duties

- **Hides the «add to home screen» banner and button (#48)** using CSS and `zijInstallHide=1`. `index.html` is not edited.
- **Links to `/privacy/`, `/support/`, `/about/` and `/mawaqit/`** open on alzijapp.com. Those pages are not bundled.
- **Outside Capacitor the bridge does nothing at all.** `bridge.e2e.mjs` checks this, and it only matters if the bundle is ever opened in a browser. The live site never loads these files.

## Silent web updates (`zij-live-update.js`)

The owner's decision is that the app is installed once and its web content updates silently. Only native changes need a store release.

1. **Every launch starts from the bundled copy**, so the app works offline, on first launch too.
2. **Background check, at most every 6 h.** The updater reads `https://alzijapp.com/version.json`. If that build is newer than the bundled one and newer than any saved snapshot, it does the following:
   - Downloads `index.html`.
   - Validates it: build stamp matches, size is above 200 KB, `#alertsJs`, `realPrayerTimes` and `zijUQ` are present, and it ends with `</html>`.
   - Injects the bridge into it.
   - Writes a complete snapshot to `Library/NoCloud/zij-web/<build>/`: the new page plus the app's own fonts, icons, data, sounds and native scripts, from `native/files.json`.
3. **Next launch.** The bundled page sees the ready snapshot and calls `WebView.setServerBasePath(snapshot)`. This is the same mechanism Ionic's live-update services use.
   - It is **not persisted**, so a store update with a newer bundled build always wins.
   - A missing folder cannot stop the app from opening: Capacitor checks that the folder exists, and the bundle stays the default.
   - **Rollback.** If the snapshot page does not reach a working state (engine and alerts card present) within 20 s, the updater marks that build as bad and switches back to the bundled `public` folder. That build is never tried again.
4. **Only `index.html` comes from the site.** Fonts and the `data/uq` tables reach the app with store releases. If that is ever too slow, publish a file list on the site and let the updater fetch changed files.
5. **The tests cover the download, validation, snapshot and switch.** One step only runs on a real device: the actual reload from `Library/NoCloud`. Check it once on TestFlight by bumping the site build and reopening the app twice.

## Building without a Mac

`.github/workflows/ios-build.yml` has three jobs:

- **test** (Ubuntu): unit tests, bundle, and the end-to-end check in Chromium.
- **ios-simulator** (`macos-26`):
  - Runs `npm install`, bundle, `npx cap add ios`, `configure-ios.sh` and `cap sync`.
  - Runs `xcodebuild` for the iOS simulator with `CODE_SIGNING_ALLOWED=NO`.
  - Checks the `.app` and uploads it as an artifact.
  - This proves the project compiles. It is not installable on a phone.
- **testflight** (TODO): starts when a tag `ios-v<version>-<n>` is pushed, for example `git tag ios-v1.0.0-1 && git push origin ios-v1.0.0-1`. It also starts from *Run workflow* with "testflight" ticked, but that button only appears once this workflow file is on the default branch. It needs these repository secrets:
  - `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID` and `APPSTORE_KEY_P8`, from App Store Connect → Users and Access → Integrations → App Store Connect API → Team key with the App Manager role.
  - `APPLE_TEAM_ID`.

  It archives with automatic signing through the API key and uploads to App Store Connect, where the build shows up in TestFlight. This job has never run, because the account and the secrets do not exist yet. Expect to fix small things on its first run.

## App Store review notes (guideline 4.2, Minimum Functionality)

Apple rejects apps that are "just a website". This app is not that:

- **Native local notifications** for adhan, iqamah and pre-adhan alerts work with the phone locked or the app closed. The website cannot do this on iPhone, and it is the #1 complaint about the competitor.
- **It works fully offline**, from bundled data: the official Umm al-Qura tables for 173 cities, 2026–2030, and the astronomical engine.
- **It uses device features:** native notification sounds, location and the compass for the Qibla.
- **No login, no ads, no tracking.**

In the App Review notes, explain how to test the alerts:

1. Prayer → التنبيهات (Alerts) → tap «🔔 اسمح بتنبيه الأذان» (Allow adhan alerts).
2. Lock the phone and wait for the next prayer, or turn on the 5-minute pre-alert.

Planned next native features that strengthen 4.2: a widget and a Lock Screen widget (#28), and the pre-sunrise alert (#27).

## Android (table #73)

The Android app is the same shell: the same bundled web app, the same planner (`zij-schedule.js`) and the same bridge (`zij-native.js`, which checks `Capacitor.getPlatform()`). Built on branch `android` (off `ios-app`) by `.github/workflows/android-build.yml` on GitHub's Linux machines: tests → bundle → `npx cap add android` → `android-config/configure-android.sh` → `cap sync` → `./gradlew assembleDebug bundleRelease`. Artifacts: a debug APK (install it on a test phone) and an **unsigned** release AAB. `app/android` is generated and not committed, like `app/ios`.

| | iPhone | Android |
|---|---|---|
| App id | `com.alzijapp.app` | `com.alzijapp.app` (same) |
| Home-screen name | الزيج | الزيج (store name «الزيج — Al-Zij», #73) |
| Pending alerts | 64 (63 + reminder) | 150 (149 + reminder) ≈ 30 days of adhans |
| Sound | per notification (Library/Sounds) | per **channel**: `zij_brass`, `zij_bell`, `zij_soft`, `zij_silent` (no sound), `zij_reminder`; files in `res/raw/zij_*.wav` |
| On the exact minute | always | only with «Alarms & reminders» (see below) |
| Status-bar icon | — | `ic_stat_zij` (white crescent), gold accent |

**Platform facts** (verified = read in the source or the official docs; assumption = not yet seen on a phone):
- **Exact alarms — verified** in @capacitor/local-notifications 8.3.1 (`LocalNotificationManager.setExactIfPossible`): with `isExactNotification: true` and the permission granted, an `at` alert uses `setExactAndAllowWhileIdle(RTC_WAKEUP)`, so it fires in Doze. Without the permission the plugin falls back to `setAndAllowWhileIdle`, which Android may deliver **up to an hour late** on Android 12+ (developer.android.com, «Schedule alarms»).
- **The permission — verified:** the plugin's manifest declares `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED`. On Android 14+, `SCHEDULE_EXACT_ALARM` is **denied by default** for new installs that are not alarm-clock or calendar apps (developer.android.com, «Schedule exact alarms are denied by default»). `USE_EXACT_ALARM` is not used: Play allows it only for apps whose core function is an alarm clock or calendar.
- **No surprise settings screen — verified in the plugin source:** `schedule()` opens the «Alarms & reminders» screen by itself whenever any notification asks for exact delivery and the permission is missing. So the bridge checks `checkExactNotificationSetting()` first and asks for exact delivery only when it is granted; otherwise the alerts card says plainly that alerts may be late and offers «⏰ اسمح بالمنبّهات والتذكيرات» (`changeExactNotificationSetting()`). Never on first launch.
- **Notification permission — verified:** Android 13+ asks with the system dialog from `requestPermissions()`; older versions are allowed by default. Asked only from the alerts card, as on iPhone.
- **Reboot — verified:** the plugin's `LocalNotificationRestoreReceiver` re-arms the saved alerts on `BOOT_COMPLETED` / `LOCKED_BOOT_COMPLETED`; Android cancels all alarms at shutdown (developer.android.com). Works only after the app was opened once.
- **Ceiling — partly verified:** Android refuses more than 500 alarms per app («Too many alarms (500) registered» — the system's own exception text); some phones count other alarms of the app too. 150 leaves a wide margin.
- **Channels — verified:** on Android 8+ a notification's sound comes from its channel, and a channel's sound cannot change after it exists; the plugin creates channels with `createChannel()` and plays `res/raw/<name>`.
- **Assumptions to check on a real phone:** maker battery savers (Samsung, Xiaomi, Huawei…) that kill or delay alarms; the WebView's location prompt (the manifest declares coarse and fine location); `WebView.setServerBasePath` for silent web updates (snapshot in the app's files folder); and that while Al-Zij is on screen the system notification and the page's own sound may both ring (Android shows notifications in the foreground; iPhone does not).

**What Hassan provides later (never commit it):** an **upload keystore** (`.jks`) and its passwords, kept in the Passwords app and a backup copy offline. With Play App Signing, Google keeps the real signing key; losing the upload key is recoverable through Play support, but it is still a key of the project (#70). When it exists, add it as repository secrets and a signing step to the workflow.

**Tests:** `npm test` adds 5 Android planner tests (31 in all); `npm run test:e2e` adds 7 Android checks in the real page with an Android mock (36 in all).
