# دراسة الرئيسية — بالمسطرة والحساب (٢٦ أكتوبر ٢٠٢٦)

على **beta فقط**. الملف: `beta/home-designs.js`. التصاميم الثلاثة الجديدة **د · هـ · و** في نفس زر التبديل مع أ ب ج والأصل (أعلى يسار الشاشة، تضغط ▾ فتظهر كل الاختيارات).

## ١. ماذا قسنا في الرئيسية الحالية (iPhone ‏٣٩٠×٨٤٤، بالقياس الآلي)

| العنصر | الحجم | اللون والتباين | المكان |
|---|---|---|---|
| **الساعة الآن** ٣:٤٢:١٣ م | **١٨px عادي** | ‎#d8ccaa ‏١٢:١ (أخفت لون في سطرها) | **آخر السطر الثاني من اليسار** — آخر مكان تصل إليه العين العربية |
| العدّ «٢:٠٨:٤٦» | ٤٦px | ١٥:١ | وسط أعلى الشاشة — هو مركز النظر الحقيقي |
| اسم اليوم | ١٧px | ١٦:١ | أول السطر الأول |
| أسماء الصلوات | ١٥px | ١١:١ | أسفل الشاشة |

**الضعف بالأرقام:**
1. العدّ أكبر من الساعة **٢٫٦ مرة** في الارتفاع (ومساحته ≈ ١٠ أضعاف)، فالعين تذهب إليه أولًا، والساعة تضيع.
2. الساعة في آخر سطر التاريخ الميلادي، بخط عادي ولون أخفت من جيرانها، ومعها ثوانٍ تتحرك (الحركة تشد العين بلا فائدة).
3. «م» تأتي مرتين في سطر واحد: «٢٠٢٦ م» (ميلادي) و«٣:٤٢ م» (مساءً) — نفس الحرف بمعنيين.
4. العدّ «٢:٠٨:٤٦» شكله شكل ساعة؛ المستخدم البسيط قد يقرؤه وقتًا لا مدة.
5. في الشاشة **٧ أحجام خط** (١٥، ١٦، ١٧، ١٨، ١٩، ٢١، ٤٦)، وبعضها أقل من ١٨px (صعب على كبار السن).
6. زر التبديل القديم أ ب ج كان يغطي التاريخ الهجري.
7. **التباين ليس المشكلة** (كله فوق ٧:١)؛ المشكلة الحجم والوزن والمكان وترتيب الألوان.

## ٢. القواعد التي بنينا عليها

- **أين تقع العين:** الشاشة العربية تُقرأ من **أعلى اليمين**، ثم تنزل. أول نظرة تقع على **أكبر وأفتح شيء** في الثلث العلوي. لذلك: شيء واحد كبير = **الساعة الآن**.
- **ترتيب الأهمية:** الساعة الآن ← الصلاة القادمة وكم باقي ← اسم اليوم والتاريخان ← المواقيت الست ← الباقي.
- **ثلاثة أحجام فقط** من النسبة الذهبية φ = ١٫٦١٨: ‏**١٨** (أصغر خط في الصفحة كلها) · **٢٩** = ١٨×φ · **٧٦** = ١٨×φ³. الفرق يأتي من الوزن واللون، لا من أحجام كثيرة.
- **التباين:** الأرقام المهمة ≥ ٧:١. النهار: الساعة ١٧٫٨:١، الذهبي ١٥٫٧:١، الثانوي ١٢٫٢:١، الماضي ٩٫١:١. الليل: ١٣٫٧ · ١٢٫١ · ١٠ · ٧٫٤.
- **الإبهام:** الأزرار (الزيج، التقويم، ١٢٣/123) في أسفل الشاشة فوق شريط التنقل مباشرة، ارتفاعها ٥٢px — في مكان الإبهام. القراءة فوق، والضغط تحت.
- **صفر تفاعل (#57):** كل شيء ظاهر بلا ضغطة؛ الأزرار لمن يريد فقط.
- **المدة بالكلمات:** «المغرب بعد ساعتين و٨ دقائق» بدل «٢:٠٨:٤٦» — لا تختلط بالساعة. في آخر ١٠ دقائق فقط تظهر الثواني «٩:٤٢» لأنها حينها مهمة.
- **وقت النهار من الصلاة نفسها:** بدل ص/م نكتب: فجرًا · صباحًا · ظهرًا · عصرًا · مساءً · ليلًا — محسوبة من مواقيت الزيج نفسها (العصر إلى المغرب = «عصرًا»).
- **الليل الهادئ:** بعد العشاء حتى الفجر تتحول الألوان تلقائيًا إلى كهرماني خافت على أسود (إضاءة أقل للعين في الظلام)، مع بقاء التباين فوق ٧:١.
- **الأرقام:** زر ١٢٣ | 123 في الرئيسية نفسها، يغيّر الزيج كله (نفس إعداد «المزيد ← العرض»). في الإنجليزي الأرقام دائمًا 123 فيختفي الزر.
- **لا حساب جديد:** التصاميم تقرأ كل نصف ثانية نفس الأرقام الظاهرة في الزيج؛ المواقيت هي مواقيت الزيج بالحرف. الساعة (الزيج) لم يتغير فيها شيء: تظهر فوق الصفحة بزر «الزيج»، ولمسة واحدة ترجعك.

## ٣. التصاميم

**د «الساعة أولًا»** — صفحة مطبوعة بلا كروت ولا صناديق، كلها على حافة يمنى واحدة (العين تنزل في خط مستقيم). الساعة ٧٦px عريضة في الثلث العلوي، تحتها خيط نحاسي رفيع يمتلئ مع الثواني بدل أرقام تتحرك، ثم «المغرب بعد ساعتين و٨ دقائق»، ثم جدول المواقيت عمودين (الصباح يمينًا، المساء يسارًا) بنقاط تقود العين من الاسم إلى الوقت.

**هـ «الأفق»** — اليوم كله **مسار الشمس** فوق خط الأفق وتحته. **المؤشر الأحمر ثابت عند «الآن»** واليوم يتحرك تحته (قانون حسن في حلقة الصلاة #53). الشمس على المؤشر في مكانها الحقيقي من اليوم، والصلوات الست نقاط على المسار نفسه: صلوات النهار فوق، وصلوات الليل تحت، بخيوط رفيعة إلى النقطة. القادم يسار المؤشر (اتجاه القراءة)، والماضي يمينه أخفت.

**و «الجملة»** — المعلومة كما يقولها إنسان: «اليوم الاثنين · ١٥ جمادى الأولى ١٤٤٨ هـ، الموافق ٢٦ أكتوبر ٢٠٢٦ م · الساعة الآن ٣:٤٢ عصرًا · والمغرب بعد ساعتين و٨ دقائق». في الوسط، ثم المواقيت الست في سطر واحد والقادمة تحتها خط ذهبي.

## ٤. ما يُجرَّب على الجوال
- هل الساعة الآن أول ما تراه العين؟ (المطلوب: نعم في الثلاثة)
- هل «عصرًا/مساءً» أوضح من «ص/م»؟
- هل «ساعتين و٨ دقائق» أسهل من «٢:٠٨:٤٦»؟
- الليل بعد العشاء: هل الإضاءة مريحة في الغرفة المظلمة؟

---

## English appendix

**Measured (current beta home, 390×844, Playwright):** time-of-day `#hTime` is 18px regular, colour #d8ccaa (12.2:1 — contrast is fine), placed at the end of the Gregorian date line (x≈96–153, y≈84), i.e. the last fixation of an RTL scan, with ticking seconds. The countdown is 46px (2.6× taller, ≈10× the area), so it — not the time — is the focal point. The same letter «م» appears twice on that line (CE and PM). The countdown h:mm:ss is shaped like a clock time. Seven type sizes on screen, prayer names at 15px. The old A/B/C switcher overlapped the Hijri date.

**System used:** single focal point; type scale 18 / 29 / 76 px (18·φ⁰, 18·φ¹, 18·φ³), max three sizes, nothing under 18px; contrast day 17.8 / 15.7 / 12.2 / 9.1:1, night (after Isha until Fajr, amber on near-black) 13.7 / 12.1 / 10.0 / 7.4:1; read-only content top, actions in the thumb arc (52px buttons just above the tab bar); countdown in words (`2 h 8 min`), seconds only in the last 10 minutes; Arabic period-of-day words derived from the app's own prayer times instead of ص/م; one-tap ١٢٣ | 123 toggle using the app's `zijDigits` setting and `zijDigitsApply()` (hidden in English, which is always 123).

**Implementation:** `beta/home-designs.js` only. It reads the live DOM text (`#hTime #hAp #hWd #hHijri #hGreg #hCityName #hLbl #hCd #hSub #hHero.now #hRow .pc/.pn/.pt/.cur #hNote #glMoonTxt`) every 500 ms; prayer minutes are parsed from the app's own `.pt` strings. The original home blocks stay in the DOM (hidden) and keep ticking. `#zDial` is never redrawn: hidden, or shown fixed over a scrim by the «الزيج» button. One switcher (`#zhdBar`, collapsed pill) drives both the new designs (`localStorage.zijHomeDesign`) and the old A/B/C/original choices by clicking the hidden `#zVarBar` buttons, so `beta/variants.js` is untouched. Home-only (`body[data-scr="clock"]`), RTL/LTR safe, no horizontal scroll at 375–430px.

- **D "Time first":** borderless almanac page, flush to one edge; 76px time + period word, a brass seconds hairline, next prayer in words, a two-column timetable with dotted leaders.
- **E "Horizon":** a 24-hour window centred on a fixed red "now" index; the Sun's altitude curve (cosine of the hour angle, fitted so the horizon crossings fall on the app's sunrise and maghrib minutes and the peak on dhuhr); the six prayers as dots on the curve, labels in two collision-free rows with leader lines; future toward the reading direction, past shaded.
- **F "The sentence":** centred natural-language lines (Arabic: «اليوم الاثنين … الساعة الآن ٣:٤٢ عصرًا · والمغرب بعد ساعتين و٨ دقائق»; English: "The time now 3:42 PM · Maghrib in 2 h 8 min"), then the six times in one row.
