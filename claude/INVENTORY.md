# Al-Zij features, and where each one lives in Claude's desktop design (claude/)

Built from beta's code (beta/index.html, build 1794392194, plus voice.js, variants.js, home-designs.js and the Qibla/Sky modules).

Every number on screen comes from beta's own engine. It is copied verbatim into claude/engine.js by claude/tools/build_engine.py and read with beta's own settings keys.

**Legend**
- **new** means redesigned from zero in claude/.
- **reused** means beta's own module, shown inside the new design behind a button.
- **changed** means the same feature, shown with a more exact value. The change is explained.

## Navigation and shell
| Beta | Claude design |
|---|---|
| Five tabs at the bottom (الساعة، الصلاة، القبلة، السماء، المزيد) | **new.** A rail on the side for desktop and a bottom bar on phones. Keys 1–5 switch screens. |
| Next prayer countdown visible from other screens | **new.** A countdown pill in the header on every screen. |
| City chip, which opens location | **new.** A place chip in the header, which opens المزيد ← الموقع. |
| Language Arabic/English (zijLang) | **new.** A rail button, and also المزيد ← العرض. |
| Digits ١٢٣/123 (zijDigits) | **new.** A rail button, and also المزيد ← العرض. |
| Welcome cards on the first visit (zijWelcomed) | Not repeated. The clock screen explains itself. |
| Install guide | **new.** المزيد ← ثبّت الزيج, covering Windows, Mac, iPhone and Android. |
| Service worker / offline | The same root sw.js as beta. No other network requests (see the end of this file). |

## The simple clock (dialJs, «الساعة البسيطة») — new
| Beta element | Where |
|---|---|
| 24-hour day ring, noon at the top, six coloured periods | The coloured day ring, with a tooltip for each period showing its start, end and duration. |
| 12-hour mode: the ring shows the coming 12 hours | The «١٢ / ٢٤» toggle (zijDial24). |
| Sun on the ring now; elapsed arc since the last prayer | The Sun medallion and the gold arc. **new:** the Sun can be dragged to preview any other time. |
| Labels outside (name over time); next prayer in gold; past ones dimmed; tomorrow's Fajr/Sunrise after Maghrib | Same, with collision avoidance, leader lines and a pulsing next marker. |
| Midnight and last-third diamonds | Same. |
| Moon ring: nights 1–30 with tonight's Moon in its real phase | Silver ring. Tapping the Moon opens السماء. |
| Numerals ring (12 or 24 h) | Same. |
| Face, minute marks, sky window with the Sun at its true altitude and azimuth | Same. **new:** the Moon is in the window too. |
| Three hands; small sun on the hour hand in 24 h | Same, with smooth ticks. Motion is off under reduced motion. |
| Tapping the dial opens the prayer tab | The dial is used for time travel instead. Prayer is one key (2) away. |

## The Grand Zij (ClockRenderer, «الزيج الكبرى — كل الحلقات») — new
| Beta ring / part | Where (the «الحلقات» panel shows and hides each ring and explains it) |
|---|---|
| World-time ring: 24 cities, rotating 24 h ring | World ring with each city's **true** local time (summer time included) and a dot that is lit where the Sun is up. **changed:** beta's ring was schematic, one hour per 15°. |
| Hijri months ring and hand; Gregorian months ring and hand | Two calendar rings with pointers and the current month lit. |
| Zodiac ring; solstices and equinoxes | Zodiac ring with the Sun at its true ecliptic longitude and four markers. |
| 28 lunar mansions with the Moon's pointer (ayanamsa) | Mansion ring, turned by the ayanamsa, with the current mansion lit. |
| Day/night band from real sunrise/sunset; prayer markers; Sun; Moon at night; stars on the night side | Day ring with civil and astronomical twilight, six prayer marks, the Sun now and night stars. **changed:** the Moon sits at its real hour angle from the Sun (beta put it at Sun + 12 h). |
| Moonrise/moonset ticks (schematic) | **changed:** true moonrise and moonset ticks (TrueSkyEngine.moonRiseSet). |
| 12 numerals and minute ticks; hour, minute and second hands | Same. |
| Planets (mean-motion angles); moon orbit with phase | **changed:** the Moon and the five planets at their true longitudes (TrueSkyEngine.planetEquatorial). |
| Eclipse nodes (schematic) | **changed:** the true ascending and descending nodes. |
| Earth at the centre, spinning, night side | A live orthographic Earth centred on your place, with today's night side, the Kaaba and the great-circle way to it. |
| Star ring: 7 named stars at their azimuth, dim below the horizon | Same. |
| North, qibla, shadow, Sun and Moon pointers | The directions ring. |
| Corner complications: equation of time, lunar reserve, retrograde weekday, tourbillon | Four sub-dials. **changed:** the lunar reserve now shows moonlight (illumination). Tapping the tourbillon opens the enlarged tourbillon window. |
| «حقيقة السماء» (dim bodies below the horizon) | A checkbox in «الحلقات». |
| Zoom + − ⟲ and pinch | Zoom buttons, Ctrl + wheel and keys + − 0, with drag to pan. |
| «عرض شاشة ويندوز» (full-screen clock) | «عرض كامل», which works for both clocks. Esc exits. |
| Glance card (time, place, next prayer bar, qibla, weather, moon, sunrise/sunset) | The now column on the clock screen: dates, digital time, next prayer with a progress bar, today's list, the day's note, and Moon/Sun/Qibla tiles. Weather is in المزيد ← كل الأرقام. |
| Legend text for all rings; «philosophy» paragraph | The «الحلقات» panel and المزيد ← دليل الساعتين. |
| Share the clock / qibla | المزيد ← شارك الزيج, and «انسخ اتجاه القبلة». |
| Nav tool (NavTool) | Already retired in beta's shell, so not carried. |

## Home screen extras (homeJs)
| Beta | Where |
|---|---|
| Next prayer hero with all its cases (just now, Friday, Iftar/Imsak in Ramadan, sunrise = end of Fajr) | Hero card, with the same rules. |
| Prayer row | Today's list, which also shows Duha and the last third. |
| Day notes (Ramadan, Arafah, Eid, White Days, Friday al-Kahf, full moon, new crescent, Sun over the Kaaba) | The note line, with the same order. |
| Glance: moon, sun (next sunrise/sunset), qibla | Three tiles. |
| Beta-only experiments (home-designs.js, variants.js) | Not carried. They are alternative layouts of beta's home, and this design replaces them. |

## Prayer screen
| Beta | Where |
|---|---|
| Today's times with countdown, «now», Isha elapsed, Duha, last third | الصلاة ← مواقيت اليوم. **new:** a midnight row (the end of the chosen Isha time). |
| Method line, official Umm al-Qura city, polar/estimated notes | Under today's list. |
| Tomorrow (Fajr, Dhuhr, Maghrib) | All six of tomorrow's times. |
| Occasions (Ramadan, Eid al-Fitr, Hajj, Eid al-Adha, White Days) | Same, **plus** Arafah, the Hijri new year and Ashura. |
| Alerts: master switch; 3 alerts per prayer (pre 5–60, adhan, iqamah 5–45, sounds); «apply to all»; Friday's iqamah (off by default) | Alerts card. Same storage (zijAlerts) and the same firing rules and texts. **Sound fix:** audio wakes on the first tap anywhere, handles «interrupted», the banner offers a replay, and there is a silent-switch hint. |
| Browser notifications when the tab is hidden | Same. |
| Talking clock (12:00, 15:00, 21:00, new day) | Talking clock card, using the device voice (TTS). Beta's recorded «Karim» clips are not used here. |
| Adhan log: start/end, prayer auto, source, reaction time, table, summary, apply/remove offsets, copy, clear | Adhan log card. It uses beta's references and storage (zijAdhanLog, zijAdhanOffsets), so records are shared with beta. |
| Share Saudi cities' times (image) | «مدن المملكة اليوم» from the official tables, with copy-to-share as text. |
| — | **new:** a month table (Gregorian or Hijri months) with print and copy. |

## Qibla
| Beta | Where |
|---|---|
| Qibla bearing, distance, compass with phone sensors, turn instructions, magnetic correction | **new** qibla dial, with a facts card and «استخدم بوصلة الجهاز». |
| Confirm by the Sun without a compass | Today's moments when the Sun is in the qibla direction or behind it, plus the Sun's angle now. |
| Sun over the Kaaba days | Note and events. |
| Copy the direction; pin location | «انسخ اتجاه القبلة»; المزيد ← الموقع. |
| Full phone tool (drag preview, Moon confirmation, calibration) | **reused:** «الأداة التفصيلية للجوال». |

## Sky
| Beta | Where |
|---|---|
| Moon: phase, illumination, age, mansion, rise/set, distance, month of nights | **new** Moon tab, with a large Moon, the nights grid and next full/new moon. |
| Sun: day, twilight, altitude/azimuth, shadow, equation of time, sign, seasons | **new** Sun tab, with a day-path chart showing the prayers on the curve. |
| Earth/Sun/Moon now (three-body panel: map, terminator, sub-points, Kaaba, you) | **new** «الأرض والشمس والقمر» tab. |
| Coming events (moon phases, seasons, occasions, Kaaba) | **new** Events tab. |
| Eclipses, crescent watch, tides, UV, orbits from above, real NASA Moon photos, «as in your sky» views, add to calendar (ICS), weather | **reused:** «المرصد الكامل» tab, which is beta's Sky module. |

## More
| Beta | Where |
|---|---|
| Location: GPS, lock, check GPS, manual search, coordinates | الموقع. The search is offline: 173 Saudi cities plus 45 world cities. |
| Method, Asr, high latitudes, country | طريقة الحساب. |
| Hijri ±1 (session) | التاريخ الهجري. |
| Display, fonts, size, colour | العرض والخط: language, digits, 12/24 for all times, simple-clock 12/24, text size, typeface, motion. |
| Dial guide | دليل الساعتين, which also covers keyboard keys. |
| Verify against Aladhan; diagnostics; «عندي مشكلة» | التحقق من الأرقام; عندي مشكلة (report, copy, email). |
| All numbers (data panel), weather, elevation | كل الأرقام. Weather and elevation are fetched only when asked. |
| About, credits, privacy, support | عن الزيج. |

## Network
The page makes no request outside the site on its own. Three buttons reach the internet, and only when pressed:
- التحقق (Aladhan);
- الطقس (Open-Meteo);
- the reused Sky module's own weather.

## Not yet redesigned (honest gaps)
- The Qibla phone tool and the detailed observatory are beta's modules, reused, not redrawn.
- The talking clock uses the device voice, not the recorded clips.
- Place names are offline. A district name appears only if beta or the main site saved one.
