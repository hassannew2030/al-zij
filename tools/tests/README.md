# اختبارات الزيج (Playwright) — نواة #85 ①

حُفظت من محادثة ١٣–٢١ نوفمبر حتى لا تضيع. تعمل على نسخة محلية:

```
cd al-zij && python3 -m http.server 8765 &
node tools/tests/layouts.js            # كل الواجهات صباحًا وليلًا، عربي وإنجليزي، أخطاء الصفحة، القائمة، منحنى القمر
node tools/tests/friday-midnight.js    # الخميس ١١:٥٩ ← الجمعة ١٢:٠٠ ← الجمعة ١٠:٠٠: «الجمعة» مكان «الظهر»
node tools/tests/moon-night-card.js 8765 after   # بطاقة الليلة في السماء: شروق القمر وغروبه لكل ليالي الشهر
node tools/tests/before-after-shot.js <اسم> <واجهة> <ar|en> <وقت ISO> [سكربت-بعد.js]   # صورة قبل/بعد لتغيير
```

- `U=http://localhost:8765/beta1/` يختبر نسخة أخرى (layouts.js وfriday-midnight.js).
- الصور تُكتب خارج المستودع (`S=` أو مجلد النظام المؤقت).
- كل اختبار يثبّت الوقت (`clock.install`) والموقع (جدة 21.5433, 39.1728) ويحجب كل ما ليس localhost، ويبذر: `zijWelcomed`، `zijInstallHide`، `zijCountry=SA`، `zijLang`، `zijHomeDesign`، `zijBetaVariant`.
- انتبه: الانتظار يمرّر الوقت؛ اختبار قبل منتصف الليل يبدأ من ١١:٥٩:٣٠ لا ١١:٥٩:٥٨.
