# معادلة أم القرى بلا جداول: تقرير البحث

تاريخ التقرير ٢٤ أكتوبر ٢٠٢٦. هذا فرع بحث فقط (`uq-formula`). لم يتغيّر شيء في التطبيق.

## الخلاصة

جرّبتُ المعادلة على كل الجداول الرسمية: ١٧٣ مدينة، وكل يوم من ٢٠٢٦ إلى ٢٠٣٠، وستة أوقات في اليوم، أي قرابة ١٫٩ مليون وقت.

| الوقت | المطابقة بالدقيقة | الزيج اليوم بلا جداول |
|---|---|---|
| الفجر | **٩٩٫٦٣٪** | ٩٤٫٢٪ |
| الشروق | **٩٩٫٧٢٪** | ٩٥٫١٪ |
| الظهر | **٩٩٫٨٩٪** | ٩٧٫٢٪ |
| العصر | **٩٩٫٦٩٪** | ٩٠٫٩٪ |
| المغرب | **٩٩٫٦٩٪** | ٩٥٫٧٪ |
| العشاء | **٩٩٫٦٩٪** | ٩٥٫٧٪ |
| **الكل** | **٩٩٫٧٢٪** | ٩٤٫٨٪ |

- الأيام التي تطابقت فيها الأوقات الستة كلها: **٩٨٫٦٪** من أيام كل مدينة. في الحساب الحالي كانت النسبة نحو ٩٢٪.
- كل فرق باقٍ دقيقة واحدة فقط، ولا يوجد فرق دقيقتين أبدًا.
- في كل الحالات المختلفة تقريبًا يقع الوقت الحقيقي على بُعد أقل من ثانية واحدة من حدّ الدقيقة. متوسط هذا البعد عُشر ثانية فقط.
- **١٠٠٪ لم تتحقق.** الباقي نحو ٣ أوقات من كل ألف، وسببه فرق أجزاء من الثانية بين حسابنا لموقع الشمس وحسابهم. التفاصيل في قسم «ما الذي بقي».

## المعادلة بكلام بسيط

١. **موقع الشمس من نظرية دقيقة (VSOP87).** هذه النظرية أدق بكثير من المعادلة المختصرة التي في التطبيق الآن، ووحدها رفعت مطابقة الظهر والمغرب والشروق إلى قرابة ٩٩٫٧٪.

٢. **الإحداثيات هي إحداثيات قائمة الموقع الرسمي نفسها** (`cities.json`) بلا أي تعديل. حاولتُ أن أعدّل موقع كل مدينة قليلًا فلم تتحسن النتيجة. معنى هذا أن المعادلة تعمل لأي نقطة، ولا تحتاج «مدينة رسمية».

٣. **الشروق والمغرب:** الشمس تحت الأفق بـ٠٫٨٣٣ درجة، أي نصف قرص الشمس مع الانكسار. تُحسب الشمس في لحظة الشروق أو الغروب نفسها.
   **الظهر:** لحظة عبور الشمس خط الزوال.

٤. **الفجر والعصر لهما طريقة خاصة:** ميل الشمس يؤخذ عند **منتصف الليل في آخر اليوم** (الساعة ٢٤:٠٠ بتوقيت السعودية)، ومعادلة الزمن تؤخذ عند **الظهر** (١٢:٠٠). بعد ذلك:
   - الفجر: الشمس ١٨٫٥° تحت الأفق.
   - العصر: ظلّ الشيء مثله (مذهب الجمهور).

   هذه الطريقة رفعت العصر من ٩١٪ إلى ٩٩٫٧٪، والفجر إلى ٩٩٫٦٪.

٥. **التقريب:** يُضاف للوقت ثانية واحدة (ثانيتان للشروق)، ثم تُرفع كل صلاة للدقيقة التالية، ويُنزل الشروق للدقيقة السابقة. العشاء = المغرب + ٩٠ دقيقة، و+١٢٠ في رمضان.

٦. **اكتشاف جديد: «أيام التأخير».** في ٩٤ يومًا من الخمس سنوات (نحو مرة في الشهر، يوم أو يومان)، الجدول الرسمي يحسب بشمس **اليوم السابق**. لذلك يظهر في بعض الأيام نفس جدول الأمس بالضبط في كل المدن (٦٢ يومًا). هذه الأيام تتكرر بانتظام كل ٢٩٫٤٣ يومًا تقريبًا، وتقع دائمًا حول بداية الشهر الهجري. الأرجح أنها خطأ صغير في برنامج التقويم الرسمي نفسه عند تحويل التاريخ، لا قاعدة شرعية. قاعدة واحدة من ثلاثة أرقام تتنبأ بهذه الأيام كلها بلا استثناء. وبدونها تنزل النتيجة من ٩٩٫٧٪ إلى ٩٧٫٥٪.

## ما الذي بقي

- نحو ٥٤٠٠ وقت من ١٫٩ مليون، أي ٠٫٢٨٪. كلها بفرق دقيقة واحدة، وكلها حالات يقع فيها الوقت على حدّ الدقيقة بأقل من ثانية.
- السبب: برنامجهم يحسب موقع الشمس بطريقة تختلف عن طريقتنا بأقل من نصف ثانية، وهذا الفرق يتغير من يوم لآخر بلا نمط واضح. لا يمكن تقليده بمعادلة نظيفة من غير أن نعرف برنامجهم بالضبط.
- لا توجد مدينة سيئة: أضعف مدينة ٩٩٫٤٦٪ (طريف)، وأفضل مدينة ٩٩٫٨٨٪.

## تطبيقها على الجزيرة العربية

- تقويم أم القرى رسمي في **السعودية فقط**. اليمن وعُمان والإمارات وقطر والبحرين والكويت لكل منها تقويم رسمي مختلف: زوايا أخرى للفجر، وعشاء بالزاوية بدل ٩٠ دقيقة، واحتياطات بالدقائق. لذلك لا تعطي هذه المعادلة «المواقيت الرسمية» لتلك الدول، وإنما تعطي «مواقيت أم القرى» لأي نقطة فيها.
- لأن المعادلة تعمل بأي إحداثيات، فهي صالحة **لكل نقطة داخل السعودية**، حتى التي ليست في القائمة.
- خدمة أم القرى الرسمية تقبل أي إحداثيات (مذكور في `data/uq/README.md`)، لكنها **محجوبة من بيئة العمل هنا** (رفض 403)، فلم أستطع اختبار نقاط خارج القائمة. ولم أحاول تجاوز الحجب.
- للتحقق في كل دولة نحتاج جدول سنة كاملة من الجهة الرسمية لعاصمتها ومدينة أو مدينتين أخريين: وزارة الأوقاف أو الهيئة الرسمية في كل دولة. وإن أردنا مواقيت أم القرى لنقاط خارج السعودية، نحتاج تنزيل الخدمة نفسها لنقاط هناك من جهاز يصل إليها.

## الخطوة التالية (اقتراح)

١. داخل السعودية تبقى الجداول الرسمية كما هي (١٠٠٪). وتصير هذه المعادلة **البديل الاحتياطي**: للمواقع البعيدة عن المدن الرسمية بأكثر من ٤٠ كم، ولما بعد ٢٠٣٠، ولمن لا يريد تنزيل الجداول. ستنقل الاحتياطي من نحو ٩٢–٩٥٪ إلى ٩٩٫٧٪.
٢. نقلها للتطبيق يحتاج إضافة حساب الشمس الدقيق (VSOP87 مختصر، نحو ١٥٠ سطرًا) وقاعدة «أيام التأخير». هذا عمل منفصل يحتاج موافقتك.
٣. قاعدة «أيام التأخير» مستنتجة من ٢٠٢٦–٢٠٣٠ فقط. إن نُزّلت سنة ٢٠٣١ لاحقًا نختبرها عليها، فإن صحّت فهي مؤكدة.

---

## Technical appendix (English)

### Data and harness
- Ground truth: `data/uq/2026.json` … `2030.json` (KACST `GetPrayerByYear`, 173 cities, zone 3). That is 173 × 1826 days × 6 = 1,895,388 times.
- Harness: `tools/uq_formula/`. Every script runs from that directory, and `obs.npz` / `*.pkl` are local caches (git-ignored).
  - `data.py` loads the tables into `OBS[city, day, prayer]` (minutes) plus a Ramadan mask.
  - `sun.py` holds the low-precision models: `noaa` (Meeus ch.25, as in the app and `ref_precise.py`), `simple` (USNO/PrayTimes) and `meeus_hp`.
  - `vsop.py` is the abridged VSOP87 Earth series (Meeus App. III) with FK5, IAU-1980 nutation and aberration. It is validated against Meeus ex. 25.b (L, B, R exact; apparent λ within 0.16″) and the EoT example (822.56 s vs 822.6 s).
  - `core.py`, `model.py` and `fast.py` hold the vectorised event solver (all cities × all days).
  - `lagrule.py` detects and fits the lag-day rule. `final.py` scores the final formula and writes `results/`. `ablation.py` holds the ablations. `uq_formula.py` is the standalone single-point implementation, the reference to port.
  - Exploration scripts are kept for reproducibility: `dayshift.py`, `shift_all.py`, `fracshift.py`, `tabular.py`, `dhuhr_lp.py`, `dhuhr_city.py`, `dhuhr_variants.py`, `eot_extract.py`, `eot_resid.py`, `delta.py`, `dt_scan.py`, `secround.py`, `sampling.py`, `asr_search.py`, `asr_var2.py`, `asr2d.py`, `fajr_fine.py`, `coordfit.py` and `city_resid.py`.
- Results:
  - `results/summary.json`
  - `results/per_city.csv` (match % per prayer per city)
  - `results/mismatches.csv` (every remaining miss, with its distance in seconds from the minute edge)
  - `results/ablation.json`

### Final formula
All times are local Saudi time (UTC+3). `lat`/`lon` are the API coordinates from `cities.json`, unmodified.

1. **Sun date (lag rule).** Let `n` = days since 2026-01-01. If `(n − 21.170455) mod 29.431818 < 1.522727`, use the sun of date `n−1`; otherwise use the sun of date `n`.
   - The rule is a max-margin LP fit (margin 0.011 d) to the 62 runs (94 days) in 2026–2030, and it reproduces them exactly.
   - On the first day of each run the official row equals the previous day's row for all 173 cities (62 days). Dhuhr, sunrise, Asr and Maghrib all confirm it.
   - The period of 29.4318 d is not the synodic month (29.5306 d), and every run falls on Hijri days 27–5. The likely cause is a date-conversion artefact in the official software, but this is unconfirmed.
   - Sanity check: a tabular-Islamic-calendar explanation (`tabular.py`) does not fit.
2. **Sun model.** Abridged VSOP87 with FK5, nutation, aberration −20.4898″/R and ΔT = 69 s. EoT uses Meeus eq. 28.3: `E = L0 − 0.0057183° − α + Δψ·cos ε`.
   - On Dhuhr this makes the per-day residual nearly constant: +1.06 s, std 0.37 s, no annual term.
   - The same test gives std 0.75 s for Meeus-hp, 0.85 s for USNO and 1.31 s for the app's ch.25 model.
   - The ΔT value is almost irrelevant (0–120 s changes nothing material).
3. **Sunrise and Maghrib.** Altitude h0 = −0.8333°. The sun is evaluated at the event time, iterated (2 iterations suffice).
4. **Dhuhr.** Upper transit, iterated at the transit time.
5. **Fajr.** Declination is sampled at local 24:00 of the (sun) date, i.e. 21:00 UT, and EoT at local 12:00. The sun sits 18.5° below the horizon.
   - Grid around that point: dec@24:00 + EoT@12:00 gives 99.63%; dec@24:30 gives 99.0%; dec@23:00 + EoT@10:00 (the app's current fit) gives 96.6% under VSOP+lag.
6. **Asr.** Same sampling as Fajr (dec@24:00, EoT@12:00), shadow factor 1: `alt = atan(1/(1+tan|φ−δ|))`.
   - Event-time sampling caps Asr at 91.7%, and so does dec@noon.
   - The jump to 99.69% comes only with dec@24:00 + EoT@12:00.
7. **Rounding.**
   - Add +1.0 s to Fajr, Dhuhr, Asr and Maghrib, then ceil.
   - Add +2.0 s to sunrise, then floor.
   - Isha = rounded Maghrib + 90 min (120 in Ramadan). This holds with zero exceptions in the data.
   - Fine scan: the best offsets are 1.05–1.15 s (2.1 s for sunrise), gaining under 0.03 pp.
   - Quantising to whole seconds before the minute rounding was tested and is equivalent; it adds nothing.

### Scores (all 173 cities × 1826 days)

| | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | All |
|---|---|---|---|---|---|---|---|
| **Final formula** | 99.626 | 99.724 | 99.885 | 99.686 | 99.690 | 99.690 | **99.717** |
| Final formula without lag rule | 96.95 | 97.24 | 98.73 | 98.04 | 97.05 | 97.05 | 97.51 |
| App engine (ch.25 sun, Fajr dec@23/EoT@10) + lag rule | 96.57 | 97.41 | 98.31 | 92.05 | 98.24 | 98.24 | 96.80 |
| App engine as shipped | 94.17 | 95.08 | 97.24 | 90.90 | 95.67 | 95.67 | 94.79 |

- All six times match on the same city-day in 98.62% of cases.
- Per city: min 99.46% (Turaif), median 99.72%, max 99.88% (Rojal). There is a weak latitude correlation (r = −0.43): northern cities are slightly worse because events there move faster per day.
- Coordinates: a per-city (Δlat, Δlon) grid fit of ±0.03° gained 130 of 947k matches, with median shift 0. The API coordinates are what the official tables use.

### Residual pattern (why not 100%)
- 5,366 misses in total. Every one is ±1 minute.
- 97.8% of misses lie within 0.5 s of a minute edge (median 0.10 s, max 1.13 s for Fajr). Dhuhr misses are all within 0.22 s.
- A model-free test settles where the error lives. Dhuhr is posed as `ceil(900 − 4·lon_c + y_day)` with a free per-day value and no per-city term. Each day's interval is then about 1.2 s wide, and the VSOP prediction falls inside it on 86–91% of days (91.2% for the GAST/no-aberration variant).
- The remaining per-day scatter is about 0.37 s and spectrally flat (periodogram: no line above 0.05 s). So the residual is day-to-day noise in the official sun ephemeris, or internal float/second quantisation, relative to ours. It is not a geometric or per-city effect.
- Closing the gap would need the exact official implementation (ephemeris series truncation, ΔT, time steps). A clean formula tops out at about 99.7%; reaching 100% means storing the tables.

### Arabian Peninsula
- The formula takes arbitrary coordinates, so it gives "Umm al-Qura times" anywhere.
- Official calendars of the other states use different parameters, so the formula does not reproduce their official times.
  - Several use a Fajr angle near 18–19.5° with Isha by angle or fixed minutes, plus local precaution minutes.
  - Verifying each one needs a full official year for two or three cities from that country's awqaf authority.
- `umqserv.kacst.gov.sa` returned 403 (`CONNECT tunnel failed`) from this environment, as did JPL/NAIF and PyPI astronomy packages. That is why VSOP87 was implemented from Meeus.
- With access to the API, the obvious next validation is about 30 off-list points: interior Saudi points plus Gulf/Yemen/Oman capitals at zone 3 or 4. That would confirm the formula for arbitrary coordinates and the lag rule beyond 2030.

### Reproduce
```
cd tools/uq_formula
python3 data.py            # builds obs.npz
python3 final.py           # scores + writes results/ (≈2 min)
python3 ablation.py
python3 uq_formula.py 2026-10-12 21.5433 39.1728   # → 05:03 06:18 12:10 15:32 18:02 19:32 (matches the official app screenshot)
```
