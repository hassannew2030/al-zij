# Jeddah, official Umm al-Qura times for extra years (lag-day test, 10 Nov 2026)

Source: KACST `GetPrayerByYear?lang=en&format=24&yg=YYYY&lat=21.5&lon=39.17&zone=3` (the official cities.json coordinates for Jeddah, id 74). Hassan sent each URL. The tables were read through the web-fetch tool as page text, not downloaded as files. One line per day: `date fajr sunrise dhuhr asr maghrib isha hijri`.

Integrity checks:
- every day of each year is present;
- dates run in sequence;
- Isha = Maghrib + 90 (+120 in Ramadan), with no exception.

## What the years show

Method: each day is compared with the formula in `uq_formula.py` twice, using the sun of the date ("normal") and the sun of the previous day ("lag"). It is a *strong lag day* when the lag version matches all 5 times and the normal version matches 3 or fewer.

| Year | Strong lag days | Pattern | Formula without lag rule | Formula with the 29.43-day rule |
|---|---|---|---|---|
| 2000 | 10 | irregular | 97.76% | 96.07% (the rule hurts) |
| 2010 | 12 | irregular, many 22-day gaps | 97.75% | 95.73% (the rule hurts) |
| 2026–2030 | 10–15 per year | regular, 29.4318-day cycle | ≈97–98% | 99.3–99.8% |
| 2031 | 12 | regular. The rule predicted 19/19 lag days and gave no false lag day | 97.75% | **99.56%** |
| 2045 | **0** | no lag days at all | **99.73%** | 96.99% (the rule hurts) |

There are no "lead" days (sun of the NEXT day) in any year.

## Conclusions

- The lag days are real in 2000, 2010 and 2026–2031, but their schedule changes over the decades, and they are absent in 2045.
- The 3-number rule (`(n − 21.1705) mod 29.4318 < 1.5227`) is a **local** description. It is verified for 2026–2031 and is wrong for 2000, 2010 and 2045.
- So a fixed linear "mean-cycle counter" (the Fable 5.2 hypothesis) is falsified. The cause is something that drifts slowly over decades.
- **Practical rule:** do not apply the lag rule outside the years it has been verified for (2026–2031). Each new year needs its own check against the official table.
