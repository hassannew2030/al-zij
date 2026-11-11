# Al-Zij · Claude's desktop design (alzijapp.com/claude/)

A from-zero redesign of the whole Al-Zij site for desktop browsers (Windows, Mac; Chrome, Edge, Safari, Firefox), 1280×720 to 2560×1440. It still works on phones. It is a test page: noindex, and the main site and beta are untouched.

**Files**
- `index.html`: the page.
- `zij.css`: all styles.
- `app.js`: words, numbers, place, clock, prayer day, router.
- `dials.js`: the simple clock and the Grand Zij.
- `screens.js`: clock, prayer, alerts, adhan log, talking clock.
- `screens2.js`: qibla, sky, more.
- `engine.js`: beta's engine, verbatim. Rebuild it with `python3 claude/tools/build_engine.py` from the repository root.
- `legacy/qibla.html`, `legacy/sky.html`: beta's two detailed instruments, verbatim, opened only behind buttons.
- `INVENTORY.md`: every feature of the current site and where it lives here.

**Rules kept**
- Same settings keys as beta, so the times are the same minutes.
- No network request unless a button says so.
- Fonts come from /fonts (OFL licences there).
- Respects reduced motion.
- The tick sleeps while the tab is hidden.
