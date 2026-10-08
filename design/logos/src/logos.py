import math
DEFS='''<defs>
<radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#1d2436"/><stop offset="1" stop-color="#07090e"/></radialGradient>
<linearGradient id="br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e3ae"/><stop offset=".45" stop-color="#c9a35d"/><stop offset="1" stop-color="#6e5228"/></linearGradient>
<linearGradient id="br2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e3ae"/><stop offset=".5" stop-color="#c9a35d"/><stop offset="1" stop-color="#7c5f30"/></linearGradient>
<radialGradient id="face" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#1a2131"/><stop offset="1" stop-color="#0a0d14"/></radialGradient>
</defs>'''
def cres(id,cx,cy,r,dx,dy,r2,fill):
    return f'<mask id="{id}"><circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/><circle cx="{cx+dx}" cy="{cy+dy}" r="{r2}" fill="#000"/></mask><circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" mask="url(#{id})"/>'
KAABA=lambda x,y,s:f'<g transform="translate({x} {y}) scale({s})"><path d="M-40 -26 L0 -44 L40 -26 L40 30 L0 48 L-40 30Z" fill="#100d08" stroke="#eddba0" stroke-width="5" stroke-linejoin="round"/><path d="M-40 -26 L0 -8 L40 -26 M0 -8 V48" fill="none" stroke="#7c5f30" stroke-width="4"/><path d="M-40 -12 L0 6 L40 -12" fill="none" stroke="#eddba0" stroke-width="9"/></g>'
def wrap(body):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">{DEFS}<rect width="1024" height="1024" fill="url(#bg)"/>{body}</svg>'
C=512
def pt(a,r):a=math.radians(a);return C+math.sin(a)*r,C-math.cos(a)*r
# A — astrolabe
ticks=''.join(f'<line x1="{pt(a,392)[0]:.1f}" y1="{pt(a,392)[1]:.1f}" x2="{pt(a,(352 if a%30==0 else 372))[0]:.1f}" y2="{pt(a,(352 if a%30==0 else 372))[1]:.1f}" stroke="#eddba0" stroke-width="{10 if a%30==0 else 5}" stroke-linecap="round"/>' for a in range(0,360,10))
A=wrap(f'''<circle cx="{C}" cy="{C}" r="430" fill="url(#br)"/><circle cx="{C}" cy="{C}" r="404" fill="url(#face)"/>{ticks}
<circle cx="{C}" cy="{C}" r="250" fill="none" stroke="#7c5f30" stroke-width="6"/>
<path d="M{C} {C-330} L{C+34} {C} L{C} {C+330} L{C-34} {C}Z" fill="url(#br2)" transform="rotate(-38 {C} {C})"/>
{cres('mA',C+150,C-150,88,-42,-26,80,'#eae3cf')}
{KAABA(round(pt(101,300)[0]),round(pt(101,300)[1]),1)}
<circle cx="{C}" cy="{C}" r="40" fill="#a4453a" stroke="#eddba0" stroke-width="8"/>''')
# B — name
B=wrap(f'''<circle cx="{C}" cy="{C}" r="420" fill="none" stroke="url(#br)" stroke-width="18"/>
<circle cx="{C}" cy="{C}" r="392" fill="none" stroke="#7c5f30" stroke-width="4" stroke-dasharray="2 22" stroke-linecap="round"/>
{cres('mB',C+150,250,58,-28,-18,52,'#eae3cf')}
<text x="{C-10}" y="700" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="340" fill="url(#br)">الزيج</text>''')
# C — crescent + 8-point star with qibla needle
star=lambda r,rot:f'<rect x="{C-r}" y="{C-r}" width="{2*r}" height="{2*r}" transform="rotate({rot} {C} {C})" fill="none" stroke="url(#br)" stroke-width="16" stroke-linejoin="round"/>'
Cc=wrap(f'''{cres('mC',C,C,400,120,-70,350,'url(#br)')}
<g transform="translate(118 -62) scale(.92)" style="transform-origin:512px 512px">{star(130,0)}{star(130,45)}
<circle cx="{C}" cy="{C}" r="62" fill="#0d1119" stroke="#eddba0" stroke-width="8"/>
<path d="M{C} {C-230} L{C+24} {C-36} L{C-24} {C-36}Z" fill="#c0574a"/><circle cx="{C}" cy="{C}" r="16" fill="#eddba0"/></g>''')
for n,s in [('A',A),('B',B),('C',Cc)]:open(f'logo{n}.svg','w').write(s)
html='<html><body style="margin:0;background:#2a2d33;font-family:Amiri">'
html+='<div style="display:flex;gap:40px;padding:40px">'+''.join(f'<div style="text-align:center;color:#eee;font-size:34px"><img src="logo{n}.svg" style="width:340px;height:340px;border-radius:76px;box-shadow:0 10px 30px #0008"><div>{t}</div><div style="display:flex;gap:18px;justify-content:center;margin-top:16px;align-items:end"><img src="logo{n}.svg" style="width:120px;border-radius:27px"><img src="logo{n}.svg" style="width:60px;border-radius:13px"><img src="logo{n}.svg" style="width:30px;border-radius:7px"></div></div>' for n,t in [('A','١ — الأسطرلاب'),('B','٢ — الاسم'),('C','٣ — الهلال ونجمة القبلة')])+'</div></body></html>'
open('sheet.html','w').write(html)
