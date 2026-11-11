# تحويل info@alzijapp.com إلى alzijapp@gmail.com — خطوات حسن (#32)

مجاني في Porkbun (حتى ٢٠ عنوانًا لكل نطاق). يُعمل مع بند Porkbun (التحقق بخطوتين وقفل النطاق).

## الخطوات
١. ادخل porkbun.com ← **ACCOUNT** أعلى اليمين ← **Domain Management**.
٢. عند alzijapp.com اضغط **رمز الظرف ✉️** تحت عمود **EMAIL**.
٣. في صفحة «Email Hosting and Forwarding» انظر إلى قسم **Porkbun Email Forwarding** على اليمين.
٤. تحت «Create a New Forwarding Address»: في الخانة الأولى اكتب `info`، وفي خانة الوجهة `alzijapp@gmail.com` ← **Create Email Forward**.
٥. إن ظهرت رسالة تطلب تأكيد تغيير سجلات DNS فاقرأها: يجب ألا تمس سجلات GitHub Pages (A وCNAME). التحويل يغيّر سجلات **MX** فقط (وسجل SPF).
٦. تُحدَّث الصفحة ويظهر العنوان تحت **Current Forwards**.

## سجلات DNS التي يضعها Porkbun (للتحقق فقط)
| النوع | الاسم | القيمة | الأولوية |
|---|---|---|---|
| MX | (فارغ / @) | fwd1.porkbun.com | 10 |
| MX | (فارغ / @) | fwd2.porkbun.com | 20 |
| TXT | (فارغ / @) | `v=spf1 include:_spf.porkbun.com ~all` | — |

افتح **DNS** للنطاق بعدها وتأكد أن هذه موجودة، وأن سجلات GitHub Pages لم تتغير.
(لم أستطع قراءة سجلات alzijapp.com الحالية من هنا؛ إن كان عندك سجل MX قديم فإن Porkbun يحذفه.)

## التجربة
- أرسل رسالة إلى info@alzijapp.com من **بريد آخر** (بريدك الشخصي أو Hotmail)، لا من alzijapp@gmail.com نفسه — Porkbun ينبّه إلى هذا لتجنب الحلقة.
- انتظر دقائق، وافحص صندوق alzijapp@gmail.com **ومجلد الرسائل غير المرغوبة**.

## الرد «من» info@alzijapp.com
- التحويل يستقبل فقط. ردّك يخرج من **alzijapp@gmail.com** — وهذا عنوان التواصل المعتمد في الوصف الثابت أصلًا.
- الإرسال باسم info@ من جيميل («Send mail as» عبر smtp.gmail.com بكلمة مرور تطبيق) ممكن اليوم، لكن **جوجل أعلنت إيقاف «Send as» للعناوين الخارجية في يناير ٢٠٢٧**، وقد تصل رسائله إلى البريد المزعج لنقص التوثيق. **لا أنصح به.** البديل الدائم بريد مستضاف مدفوع، وغير لازم الآن.

## المصادر
- [Porkbun — How to Set Up Email Forwarding Service](https://kb.porkbun.com/article/10-how-to-set-up-email-forwarding-service)
- [Porkbun — Email forwarding when DNS is hosted elsewhere (MX/SPF values)](https://kb.porkbun.com/article/47-how-to-use-porkbun-email-when-your-dns-is-hosted-elsewhere)
- [Porkbun — Set up email forwarding (guide)](https://porkbun.com/llms/guides/set-up-email-forwarding)
- [Android Authority — Gmail ending third-party "Send as" (January 2027)](https://androidauthority.com/gmail-killing-third-party-send-as-feature-3694659)
