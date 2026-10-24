#!/usr/bin/env python3
"""Static prayer-time pages for every official Umm al-Qura city, readable by search engines and AI assistants.

Usage:  python3 tools/make_city_pages.py [YYYY-MM]   (default: current month) — builds 3 months from that month.
Writes mawaqit/index.html and mawaqit/<slug>/index.html from data/uq (official tables). Re-run monthly or yearly.
"""
import json, re, sys, os, datetime, html
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
start = sys.argv[1] if len(sys.argv) > 1 else datetime.date.today().strftime('%Y-%m')
y0, m0 = map(int, start.split('-'))
AR = str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩')
HM = ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة']
GM = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
GE = ['January','February','March','April','May','June','July','August','September','October','November','December']
DW = ['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد']
PR = ['الفجر','الشروق','الظهر','العصر','المغرب','العشاء']
PE = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha']
cities = json.load(open(R + 'data/uq/cities.json', encoding='utf-8'))
years = {}
def year(y):
    if y not in years:
        p = R + 'data/uq/%d.json' % y
        years[y] = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None
    return years[y]
def slug(s):
    s = s.lower().replace("'", '').replace('’', '')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
def t12(t):
    h, m = map(int, t.split(':')); sfx = 'ص' if h < 12 else 'م'; h = h % 12 or 12
    return ('%d:%02d %s' % (h, m, sfx)).translate(AR)
def hij(s):
    y, m, d = map(int, s.split('-')); return ('%d %s %d' % (d, HM[m-1], y)).translate(AR)
# 12 months of days
days = []
d = datetime.date(y0, m0, 1)
end = datetime.date(y0 + (m0 + 2) // 12, (m0 + 2) % 12 + 1, 1)
while d < end:
    Y = year(d.year)
    if not Y: break
    days.append(d); d += datetime.timedelta(days=1)
if not days: sys.exit('no official data for ' + start)
used = {}
for c in cities:
    s = slug(c['name_en']); 
    if s in used: s += '-%d' % c['id']
    used[s] = 1; c['slug'] = s
caps = {c['region_id']: c for c in cities if c.get('is_region_capital')}
p = open(R + 'privacy/index.html', encoding='utf-8').read()
style = p[p.index('<style>'):p.index('</style>') + 8]
style = style.replace('</style>', 'table{width:100%;border-collapse:collapse;font-size:15px;margin:6px 0 18px}th,td{padding:5px 3px;text-align:center;border-bottom:1px solid var(--line)}th{color:var(--brass);font-weight:400;font-size:13px}td.d{text-align:right;white-space:nowrap}td.d small{display:block;color:var(--dim);font-size:12px}tr.today td{background:#2a2416;color:var(--brass-l)}h3{color:var(--brass-l);font-size:19px;margin:22px 0 2px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}.grid a{text-decoration:none}#today{display:none}</style>')
def page(title, desc, canon, body, ld=None):
    return ('<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<title>%s</title>\n<meta name="description" content="%s">\n<link rel="canonical" href="%s">\n<meta name="theme-color" content="#0a0c12">\n'
            '<link rel="icon" href="/icons/favicon-32.png">\n<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">\n%s\n%s\n</head>\n<body>\n<div class="wrap">\n'
            '<header><a href="/"><img src="/icons/icon-192.png" alt="الزيج"></a><div class="name">الزيج</div><div class="sub">مواقيت الصلاة والقبلة والتقويم الهجري — 🆓 مجاني</div>'
            '<nav><a href="/">افتح الزيج</a><a href="/mawaqit/">مواقيت المدن</a><a href="/support/">الدعم</a><a href="/privacy/">الخصوصية</a></nav></header>\n%s'
            '<footer>الزيج — 🆓 مجاني · <a href="https://alzijapp.com">alzijapp.com</a></footer>\n</div>\n</body>\n</html>\n') % (
            html.escape(title), html.escape(desc), canon, style,
            ('<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False)) if ld else '', body)
first, last = days[0], days[-1]
span_ar = '%s %d – %s %d' % (GM[first.month-1], first.year, GM[last.month-1], last.year)
span_ar = span_ar.translate(AR)
TODAY_JS = ("<script>(function(){var n=new Date(),k=n.getFullYear()+'-'+('0'+(n.getMonth()+1)).slice(-2)+'-'+('0'+n.getDate()).slice(-2);"
            "var r=document.getElementById('d'+k);if(!r)return;r.className='today';var c=r.children,b=document.getElementById('today');"
            "var h='<b>اليوم '+c[0].firstChild.textContent+'</b> · '+c[0].querySelector('small').textContent+'<div class=\"grid\" style=\"margin-top:6px\">';var L=['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];"
            "for(var i=1;i<7;i++)h+='<div>'+L[i-1]+'</div><div>'+c[i].textContent+'</div>';b.innerHTML=h+'</div>';b.style.display='block';})();</script>")
for c in cities:
    rows, cur = [], None
    for d in days:
        Y = year(d.year); i = (d - datetime.date(d.year, 1, 1)).days
        t = Y['cities'][str(c['id'])][i].split()
        if (d.year, d.month) != cur:
            if cur: rows.append('</tbody></table>')
            cur = (d.year, d.month)
            rows.append('<h3>%s %s <small style="color:var(--dim);font-size:14px">%s %d</small></h3><table><thead><tr><th>اليوم</th>%s</tr></thead><tbody>' % (
                GM[d.month-1], str(d.year).translate(AR), GE[d.month-1], d.year, ''.join('<th>%s</th>' % x for x in PR)))
        rows.append('<tr id="d%s"><td class="d">%s %s<small>%s</small></td>%s</tr>' % (
            d.isoformat(), DW[d.weekday()], str(d.day).translate(AR), hij(Y['hijri'][i]), ''.join('<td>%s</td>' % t12(x) for x in t)))
    rows.append('</tbody></table>')
    ar, en = c['name_ar'], c['name_en']
    reg = caps.get(c['region_id'])
    title = 'مواقيت الصلاة في %s — تقويم أم القرى الرسمي' % ar
    desc = 'مواقيت الصلاة في %s (%s) اليوم وكل يوم من %s: الفجر والشروق والظهر والعصر والمغرب والعشاء، من جدول تقويم أم القرى الرسمي، مع التاريخ الهجري. Prayer times in %s, Saudi Arabia — official Umm al-Qura calendar.' % (ar, en, span_ar, en)
    body = ('<h1>مواقيت الصلاة في %s</h1>\n<div class="date">%s · %s%s · من جدول تقويم أم القرى الرسمي (توقيت السعودية)</div>\n'
            '<div class="box key" id="today"></div>\n'
            '<div class="box">هذه مواقيت الصلاة الرسمية في %s كما ينشرها تقويم أم القرى، والتاريخ الهجري بتقويم أم القرى. العشاء بعد المغرب بـ٩٠ دقيقة، و١٢٠ دقيقة في رمضان. '
            'للتنبيه بالأذان واتجاه القبلة من مكانك بالضبط: <a href="/">افتح الزيج</a> — مجاني، بلا إعلانات، ويعمل دون إنترنت.</div>\n%s\n'
            '<section class="en" lang="en"><h2>Prayer times in %s, Saudi Arabia</h2><p>Daily Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha for %s (%.4f, %.4f), %s, from the official Umm al-Qura calendar (Saudi time, UTC+3), with the Umm al-Qura Hijri date. Isha is Maghrib + 90 minutes (120 in Ramadan). '
            'For adhan alerts and the Qibla from your exact location, <a href="/">open Al-Zij</a> — free, no ads, works offline.</p></section>\n%s\n') % (
            ar, en, ('منطقة ' + reg['name_ar'] + ' · ') if reg and reg is not c else ('عاصمة منطقة · ' if c.get('is_region_capital') else ''), span_ar,
            ar, '\n'.join(rows), en, en, c['latitude'], c['longitude'], first.strftime('%B %Y') + ' – ' + last.strftime('%B %Y'), TODAY_JS)
    ld = {"@context": "https://schema.org", "@type": "WebPage", "name": title, "inLanguage": "ar", "about": {"@type": "Place", "name": ar, "alternateName": en,
          "geo": {"@type": "GeoCoordinates", "latitude": c['latitude'], "longitude": c['longitude']}, "containedInPlace": {"@type": "Country", "name": "Saudi Arabia"}},
          "isPartOf": {"@type": "WebSite", "name": "الزيج — Al-Zij", "url": "https://alzijapp.com/"}}
    os.makedirs(R + 'mawaqit/' + c['slug'], exist_ok=True)
    open(R + 'mawaqit/%s/index.html' % c['slug'], 'w', encoding='utf-8').write(page(title, desc, 'https://alzijapp.com/mawaqit/%s/' % c['slug'], body, ld))
# index
groups = {}
for c in cities: groups.setdefault(c['region_id'], []).append(c)
parts = []
for rid in sorted(groups, key=lambda r: (caps[r]['name_ar'] if r in caps else '')):
    cap = caps.get(rid); lst = sorted(groups[rid], key=lambda c: (not c.get('is_region_capital'), c['name_ar']))
    parts.append('<h3>منطقة %s</h3><div class="grid">%s</div>' % (cap['name_ar'] if cap else '', ''.join('<a href="/mawaqit/%s/">%s</a>' % (c['slug'], c['name_ar']) for c in lst)))
body = ('<h1>مواقيت الصلاة في مدن المملكة</h1>\n<div class="date">%d مدينة ومحافظة · من جدول تقويم أم القرى الرسمي · %s</div>\n'
        '<div class="box">اختر مدينتك لترى مواقيت الصلاة لكل يوم مع التاريخ الهجري. أو <a href="/">افتح الزيج</a> ليحسب مواقيت مكانك بالضبط مع تنبيه الأذان واتجاه القبلة.</div>\n%s\n'
        '<section class="en" lang="en"><h2>Prayer times in Saudi Arabia</h2><p>Official Umm al-Qura prayer times for %d Saudi cities and governorates, every day, with the Hijri date.</p></section>\n') % (
        len(cities), span_ar, '\n'.join(parts), len(cities))
os.makedirs(R + 'mawaqit', exist_ok=True)
open(R + 'mawaqit/index.html', 'w', encoding='utf-8').write(page('مواقيت الصلاة في مدن السعودية — تقويم أم القرى الرسمي',
    'مواقيت الصلاة الرسمية لـ%d مدينة ومحافظة في السعودية من تقويم أم القرى، لكل يوم مع التاريخ الهجري.' % len(cities), 'https://alzijapp.com/mawaqit/', body))
# sitemap
urls = ['/', '/about/', '/mawaqit/', '/support/', '/privacy/', '/llms.txt'] + ['/mawaqit/%s/' % c['slug'] for c in cities]
open(R + 'sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ''.join('  <url><loc>https://alzijapp.com%s</loc></url>\n' % u for u in urls) + '</urlset>\n')
print('pages', len(cities), 'days', len(days), first, last)
