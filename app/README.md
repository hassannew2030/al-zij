# Al-Zij iPhone app (Capacitor)

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
npm test               # 15 planner and injection tests
npm run bundle         # → app/www, 9 MB
npm run test:e2e       # 25 checks in the real page (needs Playwright + Chromium)
# macOS only:
npx cap add ios && bash ios-config/configure-ios.sh && npx cap sync ios && npx cap open ios
```

## How the adhan alerts work

1. **Source of the times.** The bridge calls the page's own engine for each coming day: `observer.realPrayerTimes(date, hijriCal.fromGregorian(date))`. This is the same call the screen and the in-page alerts make. Inside Saudi Arabia it returns the official Umm al-Qura minute from `data/uq/c/<id>.json`. Elsewhere it uses the astronomical engine, with each day's own UTC offset (`observer.tzAt`), so daylight-saving changes inside the window are handled. The bridge waits up to 6 s for `zijUQ.ready()` so the first plan already uses the official table. Fractional minutes are rounded the way `AstroMath.minToHHMM` rounds them on screen.
2. **Settings.** The bridge reads the user's own `zijAlerts` object (`zijAlerts.get()`): master switch, plus for each prayer `pre {on,min,snd}`, `adhan {on,snd}` and `iqama {on,min,snd}`. Nothing is duplicated, and the native app has no settings screen of its own.
3. **Planner** (`ZijSchedule.plan`). It expands every enabled alert over the coming days, drops any alert less than 15 s away, sorts by time and keeps the **63 nearest**. The 64th slot is a reminder, placed about a day before the last alert and moved out of 21:00–09:00, that says «افتح الزّيج ليستمر تنبيه الأذان». iOS keeps at most 64 pending local notifications per app and silently drops the rest. How far ahead that covers depends on the settings: adhan only (the default) gives 63 ÷ 5 ≈ 12½ days, and all 15 alerts a day give about 4 days. The planner fetches only as many days as it needs.
4. **Wording.** Titles and bodies are the web app's own text from `#alertsJs → fire()`, in Arabic or English, with Arabic or Latin digits. On Friday Dhuhr becomes الجمعة / Jumu'ah.
5. **When it reschedules.**
   - Every launch.
   - Every return to the foreground (`visibilitychange` and the `App` `resume` event).
   - Whenever a fingerprint changes. The fingerprint covers the alert settings, place, method, Asr school, mosque offsets, high-latitude rule, language, digits, country, date and Hijri offset, and is polled every 4 s.

   It cancels the old pending set and schedules the new one. If nothing changed, it does no work.
6. **Permission.** It is **never asked on first launch**, following the owner's zero-interaction rule. It is asked in either of two cases:
   - The user taps «🔔 اسمح بتنبيه الأذان» on the alerts card.
   - The user flips any alert switch there.

   If the user denies it, the card shows a button that opens iPhone Settings. The web-only line «التنبيه والجوال مقفول يأتي مع تطبيق الزّيج في المتجر» and the browser-notification button are replaced inside the app with a status line, for example «✅ … محفوظة على جوالك لـ١٣ يومًا قادمة».
7. **Foreground.** Notifications are scheduled with `silent: true`. While Al-Zij is on screen, iOS does not show them, because the page itself already rings and shows its banner, so the alert is not doubled. With the phone locked or the app in the background, they show normally with sound.
8. **Sounds.** The three tones (`brass`, `bell`, `soft`) are rendered from the same recipe the web app plays with Web Audio, so they need no licence. They are 2–5 s long; iOS allows at most 30 s. They ship in the app bundle and are also copied to `Library/Sounds`. If the user picks «بدون صوت», the notification is a message only.
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
