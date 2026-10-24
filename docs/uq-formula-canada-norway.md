# محرك واحد لكل الأرض؟ اختبار كندا والنرويج (٢٠٢٧)

تاريخ التقرير ٢٤ أكتوبر ٢٠٢٦. فرع بحث فقط (`uq-formula`). لم يتغيّر شيء في التطبيق.

## أولًا: ما الذي لم أستطع فتحه

لا توجد في المستودع أي جداول رسمية لكندا أو النرويج. الموجود فقط جداول أم القرى، وملف إعدادات لاختبار السنة الكاملة على ١٥ مدينة، وهو يقارن الزيج بحساب مرجعي، لا بجداول رسمية. ولا يوجد أيضًا ملف تورونتو من hamariweb المذكور في الطلب.

الشبكة من بيئة العمل تمنع كل المصادر التي جرّبتها:

- hamariweb
- مجلس المسلمين في النرويج (islamskradet.no)
- irn.no وbonnetid.no
- ISNA وmoonsighting.com
- Aladhan
- معهد الأرصاد النرويجي (api.met.no)
- المجلس القومي للبحوث في كندا (NRC)
- المرصد البحري الأمريكي (USNO)

لم أحاول تجاوز الحجب. **لذلك كل ما في هذا التقرير مقارنة بحسابات مرجعية دقيقة مستقلة، لا بجداول رسمية.** الجداول المطلوبة لإكمال الاختبار مذكورة في القسم الخامس.

## الفكرة التي اختبرناها

فكرة حسن: محرك رياضي واحد (الشمس ودوران الأرض والموقع) يعطي كل إنسان مواقيته بلا إنترنت، وكل بلد يغيّر «الاصطلاح» فقط.

للاختبار قسمتُ الأوقات ثلاثة أقسام:

١. **فيزياء خالصة، لا اصطلاح فيها:** الشروق والظهر (الزوال) والمغرب (الغروب عند −٠٫٨٣٣°). هنا السؤال الوحيد: هل الحساب دقيق؟
٢. **فيزياء + اصطلاح:** الفجر والعشاء (أي زاوية تحت الأفق؟) والعصر (ظل مثل أو مثلين؟). الحساب نفسه دقيق، والنتيجة تتغير بتغيّر الاصطلاح.
٣. **قاعدة لا فلك:** أيام لا تنزل فيها الشمس إلى زاوية الفجر أصلًا، أو لا تشرق ولا تغرب. هنا لا يوجد حدث فلكي، وأي وقت يُكتب هو قاعدة يختارها أهل البلد.

المدن ١٤:

- **كندا:** تورونتو، مونتريال، فانكوفر، كالغاري، إدمونتون، وينيبيغ، هاليفاكس، يلونايف، إيكالويت.
- **النرويج:** أوسلو، بيرغن، تروندهايم، بودو، ترومسو.

الاختبار على كل يوم من ٢٠٢٧، بالتوقيت المحلي الحقيقي مع تغيير الساعة الصيفي.

## النتائج باختصار

### ١. الفيزياء الخالصة (الشروق، الظهر، المغرب): دقيقة بالثواني

قارنتُ ثلاث طرق بالحساب الأدق، وهو حساب الشمس الكامل VSOP87 مع حلّ ارتفاع الشمس الحقيقي ثانية بثانية.

| الطريقة | الوسيط | أكبر فرق في السنة |
|---|---|---|
| محرك معادلة أم القرى | ٠٫٢ ث | ٠٫٢ ث |
| مرجع NOAA المستقل (في `tests/prayer`) | ٠٫٨ ث | ٣ ث (٦ ث في ترومسو قرب الليل القطبي) |
| محرك الزيج الحالي | ١٫٧ ث | ٥٫٥ ث في كندا، ١٧ ث في ترومسو |

قيم محرك الزيج تستثني أيام «خط العرض ٦٥°»، وهي مشروحة في البند ٣.

**الخلاصة:** في كندا والنرويج كلها، الشروق والظهر والمغرب صحيحة فلكيًا بفرق ثوانٍ قليلة، أي أقل من الدقيقة بكثير. هذا الجزء من فكرة حسن **صحيح تمامًا**: الرياضيات وحدها تكفي، ولا تحتاج جدولًا.

### ٢. الفجر والعشاء والعصر: الحساب دقيق، والاصطلاح هو الذي يقرر

الاصطلاح الذي استعملته هو اصطلاح الزيج الحالي:

- **كندا:** طريقة ISNA (الفجر والعشاء ١٥°).
- **النرويج:** رابطة العالم الإسلامي (الفجر ١٨°، العشاء ١٧°)، مع قاعدة «نسبة الزاوية» حين لا يغيب الشفق، وخط عرض ٦٥° حين لا تشرق الشمس.

مقارنة الزيج بحساب PrayTimes/Aladhan بنفس الاصطلاح:

| | الفجر | الشروق | الظهر | العصر | المغرب | العشاء |
|---|---|---|---|---|---|---|
| كندا: نفس الدقيقة | ٩٧٫٨٪ | ٩٧٫٥٪ | ٩٨٫١٪ | ٩٨٫١٪ | ٩٧٫٩٪ | ٩٧٫٨٪ |
| كندا: أكبر فرق | ٤ ث | ٣ ث | ٢ ث | ٢ ث | ٣ ث | ٢ ث |
| النرويج: نفس الدقيقة | ٩٦٫٨٪ | ٩٦٫٨٪ | ٩٧٫٩٪ | ٩٨٫٠٪ | ٩٨٫٠٪ | ٩٧٫٨٪ |
| النرويج: أكبر فرق | ٥ ث | ٩ ث | ٢ ث | ٢ ث | ١٤ ث | ٩ ث |

- كل الفروق ثوانٍ فقط. الدقيقة المختلفة (٢–٣٪) سببها أن الوقت يقع على حدّ الدقيقة بثانية أو ثانيتين.
- **في الأيام التي يوجد فيها حدث فلكي حقيقي**، الفجر والعشاء في الزيج يبعدان عن الحساب الدقيق ٤ ثوانٍ على الأكثر.
- **العصر** يختلف عن الحساب الدقيق ١٠–٣٠ ثانية. سببه اختيار اصطلاحي صغير: هل يُؤخذ ميل الشمس لطول الظل عند الظهر أم عند العصر؟ الزيج يأخذه عند العصر، كما يفعل Aladhan. ويكبر الفرق كلما اتجهنا شمالًا.

**الخلاصة:** هنا لا يقرر الصحة الحسابُ بل الاصطلاح. لو استعمل مسجد في تورونتو زاوية ١٨° بدل ١٥°، يتقدم الفجر نحو نصف ساعة، وكلاهما «صحيح فلكيًا».

### ٣. حيث لا يوجد حدث فلكي: الوقت قاعدة لا فلك

| المدينة | لا تبلغ الشمس زاوية الفجر | لا تبلغ زاوية العشاء | لا شروق ولا غروب | أيام قدّرها الزيج بقاعدة (فجر/عشاء) |
|---|---|---|---|---|
| تورونتو، مونتريال، هاليفاكس | ٠ | ٠ | ٠ | ٠ |
| فانكوفر | ٠ | ٠ | ٠ | ٦١ / ٦٢ |
| وينيبيغ | ٠ | ٠ | ٠ | ٦٧ / ٦٨ |
| كالغاري | ٠ | ٠ | ٠ | ٧٧ / ٧٨ |
| إدمونتون | ٤٨ | ٤٨ | ٠ | ٩٧ / ٩٦ |
| يلونايف | ١١٨ | ١١٨ | ٠ | ١٥٠ / ١٥١ |
| إيكالويت | ١٢٦ | ١٢٦ | ٠ | ١٥٨ / ١٥٧ |
| أوسلو | ١٢١ | ١١٥ | ٠ | ١٤٤ / ١٤١ |
| بيرغن | ١٢٤ | ١١٨ | ٠ | ١٤٦ / ١٤٤ |
| تروندهايم | ١٤١ | ١٣٦ | ٠ | ١٦٣ / ١٦١ |
| بودو | ١٦٣ | ١٥٧ | ٤٤ | ٢١٩ / ٢١٧ |
| ترومسو | ١٧٥ | ١٦٩ | ١١٨ | ٢٥٩ / ٢٥٦ |

في هذه الأيام لا يوجد «وقت صحيح فلكيًا» للفجر أو العشاء. أي وقت يظهر هو قاعدة اجتهادية. أيام «لا شروق ولا غروب» في بودو وترومسو هي الليل القطبي في الشتاء وشمس منتصف الليل في الصيف.

**ملاحظات مهمة وجدتها (للمراجعة، لم أعدّل شيئًا):**

١. **قاعدة «نسبة الزاوية» تحلّ أحيانًا محلّ حدث حقيقي موجود.** في فانكوفر وكالغاري ووينيبيغ تنزل الشمس فعلًا إلى ١٥° كل ليلة. ومع ذلك، في ٦١–٧٧ يومًا صيفيًا يضع الزيج الفجر بالقاعدة. تكون القاعدة أبكر من الفجر الحقيقي بـ٢٣–٤٣ دقيقة في المتوسط، وحتى ٧٢ دقيقة.
   - هذا ما يفعله Aladhan أيضًا، فهو ليس خطأ حسابيًا. لكنه **اختيار اصطلاحي** يستحق أن يعرفه حسن.
   - وفي أوسلو وبيرغن وتروندهايم يحدث مثله في ٢٢–٢٦ يومًا (الفرق حتى ٩٨ دقيقة).

٢. **بودو وترومسو: «خط عرض ٦٥°» يُستعمل حتى حين تشرق الشمس فعلًا.** في ٣٦ يومًا ببودو و١٤ يومًا بترومسو تشرق الشمس وتغرب حقيقةً. لكنها لا ترتفع بما يكفي ليكون للعصر ظل (ارتفاع الظهر بين −٠٫٨° و+٠٫٥°). لذلك يحسب الزيج اليوم كله كأنه على خط عرض ٦٥°.
   - النتيجة: شروق ومغرب يختلفان عن الحقيقي **٦٧ دقيقة في المتوسط في بودو، وحتى ١٣٢ دقيقة في ترومسو**.
   - هذه أوضح حالة يخالف فيها الزيجُ الفلكَ الحقيقي. والأدق أن يبقى الشروق والمغرب حقيقيين، وتُطبّق القاعدة على العصر وحده.

٣. **ملاحظة جانبية عن التوقيت الصيفي:** بيانات المناطق الزمنية على جهاز الاختبار (إصدار 2026e) تعامل فانكوفر وإدمونتون وكالغاري ووينيبيغ ويلونايف كأنها ثبّتت التوقيت الصيفي طوال السنة من نوفمبر ٢٠٢٦. أما المتصفح (Chromium) فما زال يغيّر الساعة.
   - النتيجة: فرق ساعة كاملة في ١٢٧ يومًا بين المصدرين.
   - هذا ليس خطأ في الحساب الفلكي، بل في جدول الساعة المدنية. حين قارنتُ الفيزياء وحّدتُ الساعة.
   - لكن يجب التأكد من القانون الفعلي في كل مقاطعة لسنة ٢٠٢٧، وأن جهاز المستخدم يعرفه. هذه نقطة خارج الفلك تمامًا، وتؤثر على كل الأوقات بساعة.

## الخلاصة لحسن

- **الفكرة صحيحة في جوهرها:** الشروق والظهر والمغرب تُحسب بلا إنترنت لأي مكان في كندا والنرويج، بدقة ثوانٍ. محرك معادلة أم القرى أدق من الزيج الحالي: ٠٫٢ ثانية مقابل حتى ٥ ثوانٍ.
- **الفجر والعشاء والعصر:** الحساب دقيق، لكن «الوقت الصحيح» يقرره الاصطلاح (الزاوية، والمذهب، وقاعدة الشمال). المحرك الواحد يكفي، وكل بلد يضع إعداداته.
- **في الشمال البعيد** (النرويج وشمال كندا) نحو ثلث السنة إلى ثلثيها بلا فجر فلكي، وفي أقصى الشمال أسابيع بلا شروق. هنا لا يوجد فلك يُحسب، والوقت قاعدة بشرية. المحرك الواحد يستطيع تطبيق أي قاعدة، لكنه لا يستطيع أن «يكتشف» القاعدة الصحيحة. هذه يحددها أهل البلد.
- **لم أستطع قياس مطابقة الجداول الرسمية بالدقيقة** في كندا والنرويج، لأن الجداول غير متاحة من هنا.

## الجداول المطلوبة لإكمال الاختبار

- **النرويج:**
  - تقويم «Bønnetider» السنوي من **Islamsk Råd Norge** (المجلس الإسلامي في النرويج) لأوسلو وبيرغن وتروندهايم وبودو وترومسو لسنة ٢٠٢٧، أو الجدول الذي يعتمده أكبر مسجد في كل مدينة.
  - المجلس معروف باستعمال قاعدة خاصة للصيف، وهي الأهم للاختبار.
- **كندا:**
  - جدول ISNA Canada أو المجلس الإسلامي المحلي لكل مدينة.
  - ملف تورونتو من hamariweb المذكور في الطلب (غير موجود في المستودع).
  - جدول مسجد أو مركز إسلامي في يلونايف وإيكالويت، وهذا الأهم لأن هناك أيامًا كثيرة بلا فجر فلكي.
- **للشروق والغروب الرسميين:**
  - NRC Canada Sunrise/Sunset calculator لكل مدينة كندية.
  - api.met.no (Sunrise 3.0) لمدن النرويج.
  - هذه تثبت الجزء الفيزيائي أمام مصدر حكومي.

---

## Technical appendix (English)

### Blockers / data provenance
- No official Canadian or Norwegian prayer timetables exist in the repo. `tests/prayer/cfg.json` is the 15-city year-test config; it is compared against `oracle.py`, a PrayTimes/Aladhan re-implementation, not against official tables. No hamariweb Toronto file is present in any branch.
- These hosts were all refused by the egress proxy (curl `000` / CONNECT 403), and none was retried or circumvented:
  - hamariweb.com
  - islamskradet.no, irn.no, bonnetid.no
  - isna.net, moonsighting.com
  - api.aladhan.com
  - api.met.no
  - nrc.canada.ca
  - aa.usno.navy.mil

### Harness (`tools/uq_formula/world/`)
- `cities.json` lists the 14 cities with their IANA zones.
- `app_run.js` drives the app's own engine (`index.html`, read only, network routes aborted) through Playwright. For each local day of 2027 it calls `observer.realPrayerTimes` with the city's IANA zone. Method is auto by country: CA → ISNA (15/15), NO → MWL (18/17), high-latitude rule `angle`, polar rule 65°.
- `world.py` runs the engines below, all in seconds of local civil time, with the UTC offset from host IANA tzdata 2026e.
  - **V (precise reference):** the VSOP87 sun from `../vsop.py`, with apparent RA and dec and GAST, gives the true altitude. Vectorised bisection on that altitude solves every event: transit (H = 0), ±0.8333°, −15/−17/−18/−18.5°, and Asr with shadow 1 and 2 (noon declination).
  - **N:** `tests/prayer/ref_precise.py` (NOAA/Meeus ch.25), solved with its own bisection. Dhuhr is the transit (H = 0); see the note below.
  - **U:** the uq-formula engine style — VSOP sun, closed-form hour angle iterated 5× at the event time.
  - **A:** the app engine output (`app.json`).
- `analyse.py` writes `results_world.json`, `analyse.txt`, and `headline.py` → `headline.json`.
- `world.json` and `app.json` are regenerable and git-ignored.

### Physics (convention-free) — |Δ| vs V, seconds, 2027

| | Canada median / max | Norway median / max |
|---|---|---|
| Sunrise: U | 0.20 / 0.20 | 0.20 / 0.20 |
| Sunrise: N (NOAA) | 0.73 / 3.07 | 0.74 / 5.69 |
| Sunrise: A (app) | 1.76 / 5.52 | 1.80 / 17.36 |
| Dhuhr: U | 0.20 / 0.20 | 0.20 / 0.20 |
| Dhuhr: N | 0.78 / 3.02 | 0.78 / 3.02 |
| Dhuhr: A | 1.65 / 2.33 | 1.65 / 2.33 |
| Maghrib: U | 0.20 / 0.20 | 0.20 / 0.21 |
| Maghrib: N | 0.76 / 3.01 | 0.77 / 5.88 |
| Maghrib: A | 1.40 / 4.23 | 1.39 / 10.75 |

- **Polar-substituted days.** App rows on its polar-substituted days are excluded from these figures; see the next section.
- **Constant 0.2 s.** The steady 0.2 s gap between U and V comes from U's Meeus EoT formula versus V's GAST-based hour angle (aberration and nutation in RA). It is constant and below any rounding concern.
- **Noon on a different clock.** `ref_precise.day()` defines noon as the moment of maximum altitude, not the transit. At high latitude that differs from the transit by 10–42 s (median 19 s in Oslo, 30 s in Tromsø) because the declination changes during the day. Prayer conventions use the transit, so N's Dhuhr above is the NOAA transit. Anyone reusing `ref_precise.py` for Dhuhr at high latitude should note this.
- **Clock zone.** Host tzdata 2026e gives permanent UTC−7, UTC−6 and UTC−5 from 1 Nov 2026 for America/Vancouver, Edmonton (and Calgary), Winnipeg and Yellowknife. Chromium's ICU, as the app sees it, still switches.
  - This makes a one-hour clock difference on 127 days of 2027 in those five cities.
  - Physics was compared on one clock: the app was shifted onto the host offset.
  - The civil-time law for 2027 must be confirmed per province. Whichever tzdata the user's phone has determines every displayed time.
  - This is not astronomy, but it is the largest error source found.

### Convention-dependent (app vs PrayTimes/Aladhan oracle, same convention)

| | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|
| CA rounded-minute match % | 97.81 | 97.47 | 98.08 | 98.11 | 97.90 | 97.75 |
| CA max \|Δ\| s | 4.2 | 3.4 | 1.7 | 1.9 | 2.7 | 2.4 |
| NO rounded-minute match % | 96.77 | 96.82 | 97.86 | 98.03 | 98.03 | 97.76 |
| NO max \|Δ\| s | 5.3 | 8.6 | 1.7 | 2.1 | 14.5 | 8.9 |

- The minute mismatches are all boundary cases; the differences are seconds-level.
- On days where the twilight event physically exists and the app does not estimate it, app Fajr and Isha are within 4.1 s (CA) and 3.9 s (NO) of V.
- App Asr versus V differs by a median of 6–25 s, up to 31.6 s in Tromsø.
  - The app (like PrayTimes) takes the shadow-length declination at the Asr moment; V takes it at noon.
  - Both are valid readings of "shadow = object + noon shadow". This is a sub-minute convention choice that grows with latitude.

### Rule-only days (no physical event) and rule-over-event days

| City | Fajr angle never reached | Isha angle never reached | No sunrise/sunset | App-estimated Fajr/Isha | Of which the real event exists | Rule − real event (min), median / max | App 65° substitution / of which the sun really rises |
|---|---|---|---|---|---|---|---|
| Toronto, Montreal, Halifax | 0 | 0 | 0 | 0 / 0 | – | – | 0 |
| Vancouver | 0 | 0 | 0 | 61 / 62 | 61 / 62 | 23.6 / 34.0 | 0 |
| Winnipeg | 0 | 0 | 0 | 67 / 68 | 67 / 68 | 29.3 / 44.0 | 0 |
| Calgary | 0 | 0 | 0 | 77 / 78 | 77 / 78 | 42.6 / 71.9 | 0 |
| Edmonton | 48 | 48 | 0 | 97 / 96 | 49 / 48 | 34.3 / 105.7 | 0 |
| Yellowknife | 118 | 118 | 0 | 150 / 151 | 32 / 33 | 35.3 / 111.5 | 0 |
| Iqaluit | 126 | 126 | 0 | 158 / 157 | 32 / 31 | 34.2 / 110.8 | 0 |
| Oslo | 121 | 115 | 0 | 144 / 141 | 23 / 26 | 30.0 / 94.1 | 0 |
| Bergen | 124 | 118 | 0 | 146 / 144 | 22 / 26 | 30.9 / 98.5 | 0 |
| Trondheim | 141 | 136 | 0 | 163 / 161 | 22 / 25 | 31.8 / 98.6 | 0 |
| Bodø | 163 | 157 | 44 | 219 / 217 | 56 / 60 | 7.0 / 83.9 | 80 / 36 |
| Tromsø | 175 | 169 | 118 | 259 / 256 | 84 / 87 | 14.1 / 91.9 | 132 / 14 |

The last three columns are Fajr figures; the Isha figures are similar and are in `results_world.json`.

- **Angle-based rule.** Fajr is capped at sunrise − (angle/60)·night, and Isha correspondingly. This is the Aladhan/PrayTimes "angle-based" method.
  - The cap triggers whenever the real twilight is longer than that share of the night, not only when it never ends.
  - So in summer at 49–54°N, and on shoulder days farther north, a real 15° or 18° event exists but is replaced: Fajr comes out earlier and Isha later by 7–112 minutes.
  - That is a convention, not an error. It should be stated as such in the UI, or offered as "only when the twilight never ends".
- **65° substitution.** The app's polar test treats days with no Asr shadow (Asr − noon < 5 min) as polar and reckons the whole day at 65°. In Bodø (36 days, around the winter solstice) and Tromsø (14 shoulder days: 15–21 Jan and 21–27 Nov) the sun really does rise and set, with noon altitude between −0.8° and +0.5°.
  - The displayed sunrise and sunset there are off by a median of 67 minutes (Bodø) and 99 minutes (Tromsø), up to 132 minutes.
  - Suggested fix (not applied): keep the real sunrise, sunset and Dhuhr whenever they exist, and apply the substitution only to the missing events (Asr, Fajr, Isha).
- **Purely rule-based times.** In Bodø on 44 days and Tromsø on 118 days, sunrise and sunset themselves are rule-based (polar night or midnight sun). Every time shown on those days is a rule.

### Where things stand
- **Exact math (seconds):** sunrise, Dhuhr and Maghrib everywhere the sun rises and sets; Fajr and Isha wherever the angle is reached and the convention does not override it.
- **Convention-dependent:** the Fajr/Isha angle choice (ISNA 15° vs MWL 18°/17° vs local practice), the Asr school and the declination epoch (under 30 s), and the high-latitude rule (angle-based vs 1/7 vs middle of night, and when it is allowed to trigger).
- **No physical event:**
  - Fajr and Isha: Edmonton 48 days, Yellowknife 118, Iqaluit 126, Oslo 115–121, Bergen 118–124, Trondheim 136–141, Bodø 157–163, Tromsø 169–175.
  - Sunrise and sunset: Bodø 44 days, Tromsø 118.
- **Not measurable here:** minute-match against official Canadian or Norwegian timetables, for lack of data (see section 5 above).

### Reproduce
```
cd tools/uq_formula/world
node app_run.js        # app engine → app.json (Playwright; network routes aborted)
python3 world.py       # ≈25 min, engines V/N/U → world.json
python3 analyse.py > analyse.txt && python3 headline.py
```
