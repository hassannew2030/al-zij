import math,base64
C=512
def b64(f):return 'data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode()
FULL,CRES=b64('moonfull.png'),b64('mooncres.png')
def pt(a,r,c=(C,C)):a=math.radians(a);return c[0]+math.sin(a)*r,c[1]-math.cos(a)*r
AR='٠١٢٣٤٥٦٧٨٩';ar=lambda n:''.join(AR[int(d)] for d in str(n))
DEFS='''<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#1c2540"/><stop offset=".6" stop-color="#0c1222"/><stop offset="1" stop-color="#05070d"/></radialGradient>
<linearGradient id="br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf0c6"/><stop offset=".22" stop-color="#e6c983"/><stop offset=".5" stop-color="#b8904a"/><stop offset=".78" stop-color="#e2c27c"/><stop offset="1" stop-color="#6e5228"/></linearGradient>
<linearGradient id="brD" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f3e3ae"/><stop offset=".5" stop-color="#9c7638"/><stop offset="1" stop-color="#4e3a1b"/></linearGradient>
<linearGradient id="brV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf0c6"/><stop offset=".5" stop-color="#c9a35d"/><stop offset="1" stop-color="#6e5228"/></linearGradient>
<radialGradient id="face" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#22304f"/><stop offset=".7" stop-color="#101a30"/><stop offset="1" stop-color="#080d18"/></radialGradient>
<radialGradient id="win" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#1d2b4d"/><stop offset="1" stop-color="#070b16"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity=".6"/></filter>
<filter id="shs" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".7"/></filter>
</defs>'''
def wrap(b):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">{DEFS}<rect width="1024" height="1024" fill="url(#bg)"/>{b}</svg>'
def bezel(r,w=34):
    return (f'<circle cx="{C}" cy="{C}" r="{r}" fill="url(#br)" filter="url(#sh)"/>'
            f'<circle cx="{C}" cy="{C}" r="{r-w*.35}" fill="none" stroke="url(#brD)" stroke-width="{w*.3}"/>'
            f'<circle cx="{C}" cy="{C}" r="{r-w}" fill="url(#brD)"/><circle cx="{C}" cy="{C}" r="{r-w-6}" fill="url(#face)"/>')
def guilloche(r,n=120,op=.07):
    return '<g opacity="%s">'%op+''.join(f'<line x1="{C}" y1="{C}" x2="{pt(a*360/n,r)[0]:.1f}" y2="{pt(a*360/n,r)[1]:.1f}" stroke="#9fb4e6" stroke-width="3"/>' for a in range(n))+'</g>'
def kaaba(x,y,s):
    return (f'<g transform="translate({x} {y}) scale({s})" filter="url(#shs)">'
      '<path d="M-50 -30 L0 -52 L50 -30 L50 36 L0 58 L-50 36Z" fill="#0b0906"/>'
      '<path d="M-50 -30 L0 -8 L0 58 L-50 36Z" fill="#15110b"/>'
      '<path d="M-50 -30 L0 -52 L50 -30 L0 -8Z" fill="#221b11"/>'
      '<path d="M-50 -16 L0 6 L50 -16 L50 -6 L0 16 L-50 -6Z" fill="url(#brV)"/>'
      '<path d="M14 26 L30 19 L30 46 L14 53Z" fill="url(#brV)" opacity=".9"/>'
      '<path d="M-50 -30 L0 -52 L50 -30 L50 36 L0 58 L-50 36Z" fill="none" stroke="#c9a35d" stroke-width="2.5" stroke-linejoin="round"/></g>')
def dauphine(a,l,w,fill='url(#br)'):
    x,y=pt(a,l);xl,yl=pt(a-90,w);xr,yr=pt(a+90,w);bx,by=pt(a+180,l*.18)
    return f'<path d="M{x:.1f} {y:.1f} L{xl:.1f} {yl:.1f} L{bx:.1f} {by:.1f} L{xr:.1f} {yr:.1f}Z" fill="{fill}" filter="url(#shs)"/><path d="M{x:.1f} {y:.1f} L{C} {C} L{bx:.1f} {by:.1f} L{xr:.1f} {yr:.1f}Z" fill="#6e5228" opacity=".45"/>'

# G — watch dial with moon-phase window and Kaaba at 12
R=470
ticks=''.join((lambda big:f'<line x1="{pt(m*6,R-48)[0]:.1f}" y1="{pt(m*6,R-48)[1]:.1f}" x2="{pt(m*6,R-(70 if big else 60))[0]:.1f}" y2="{pt(m*6,R-(70 if big else 60))[1]:.1f}" stroke="#e6c983" stroke-width="{6 if big else 2.5}"/>')(m%5==0) for m in range(60))
nums=''.join(f'<text x="{pt(h*30,R-118)[0]:.1f}" y="{pt(h*30,R-118)[1]+24:.1f}" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="66" fill="url(#br)" filter="url(#shs)">{ar(h)}</text>' for h in range(1,12) if h not in (6,))
mx,my,mr=C,C+190,120
moonwin=(f'<clipPath id="mw"><path d="M{mx-mr} {my} A{mr} {mr} 0 0 1 {mx+mr} {my}Z"/></clipPath>'
  f'<path d="M{mx-mr-14} {my+6} A{mr+14} {mr+14} 0 0 1 {mx+mr+14} {my+6}Z" fill="url(#brD)"/>'
  f'<g clip-path="url(#mw)"><rect x="{mx-mr}" y="{my-mr}" width="{2*mr}" height="{mr}" fill="url(#win)"/>'
  +''.join(f'<circle cx="{mx+dx}" cy="{my+dy}" r="{r}" fill="#f3e3ae" opacity=".8"/>' for dx,dy,r in [(-80,-30,3),(-40,-90,2.5),(70,-60,3),(95,-25,2),(10,-100,2)])+
  f'<image href="{FULL}" x="{mx-30-62}" y="{my-62-30}" width="124" height="124"/>'
  f'<circle cx="{mx-mr}" cy="{my}" r="{mr*.55}" fill="url(#brD)"/><circle cx="{mx+mr}" cy="{my}" r="{mr*.55}" fill="url(#brD)"/></g>'
  f'<line x1="{mx-mr-14}" y1="{my+6}" x2="{mx+mr+14}" y2="{my+6}" stroke="url(#br)" stroke-width="8"/>')
G=wrap(bezel(R)+guilloche(R-40)+ticks+nums+moonwin+kaaba(C,C-345,1.05)+dauphine(-60,230,22)+dauphine(48,330,18)+
  f'<circle cx="{C}" cy="{C}" r="24" fill="url(#br)" filter="url(#shs)"/><circle cx="{C}" cy="{C}" r="8" fill="#6e5228"/>')

# H — medallion: Kaaba in front of a large crescent, hour ring
H=wrap(bezel(470,30)+
  ''.join(f'<circle cx="{pt(h*30,405)[0]:.1f}" cy="{pt(h*30,405)[1]:.1f}" r="{13 if h%3==0 else 8}" fill="url(#br)"/>' for h in range(12))+
  ''.join(f'<line x1="{pt(m*6,420)[0]:.1f}" y1="{pt(m*6,420)[1]:.1f}" x2="{pt(m*6,432)[0]:.1f}" y2="{pt(m*6,432)[1]:.1f}" stroke="#c9a35d" stroke-width="2"/>' for m in range(60) if m%5)+
  f'<mask id="cm"><rect width="1024" height="1024" fill="#000"/><circle cx="{C}" cy="{C-10}" r="320" fill="#fff"/><circle cx="{C+105}" cy="{C-80}" r="285" fill="#000"/></mask>'
  f'<rect width="1024" height="1024" fill="url(#br)" mask="url(#cm)" filter="url(#sh)"/>'
  +kaaba(C+70,C+70,2.35)+
  f'<image href="{FULL}" x="{C+150}" y="{C-300}" width="0" height="0"/>')

# I — astrolabe with kursi (throne) on top, rete with star pointers, crescent + Kaaba at centre
cx,cy,Rr=C,600,340
def ptc(a,r):return pt(a,r,(cx,cy))
kursi=(f'<path d="M{cx-150} {cy-Rr+40} C{cx-150} {cy-Rr-60},{cx-70} {cy-Rr-90},{cx-40} {cy-Rr-150} L{cx+40} {cy-Rr-150} C{cx+70} {cy-Rr-90},{cx+150} {cy-Rr-60},{cx+150} {cy-Rr+40}Z" fill="url(#br)" filter="url(#sh)"/>'
  f'<path d="M{cx-95} {cy-Rr+10} C{cx-95} {cy-Rr-45},{cx-45} {cy-Rr-70},{cx-25} {cy-Rr-110} L{cx+25} {cy-Rr-110} C{cx+45} {cy-Rr-70},{cx+95} {cy-Rr-45},{cx+95} {cy-Rr+10}Z" fill="url(#brD)" opacity=".8"/>'
  f'<circle cx="{cx}" cy="{cy-Rr-178}" r="34" fill="none" stroke="url(#br)" stroke-width="16"/>')
deg=''.join((lambda big:f'<line x1="{ptc(a,Rr-30)[0]:.1f}" y1="{ptc(a,Rr-30)[1]:.1f}" x2="{ptc(a,Rr-(56 if big else 44))[0]:.1f}" y2="{ptc(a,Rr-(56 if big else 44))[1]:.1f}" stroke="#2a1f0e" stroke-width="{4 if big else 2}"/>')(a%30==0) for a in range(0,360,5))
abj=''.join(f'<text x="{ptc(a,Rr-15)[0]:.1f}" y="{ptc(a,Rr-15)[1]+8:.1f}" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="26" fill="#2a1f0e" transform="rotate({a} {ptc(a,Rr-15)[0]:.1f} {ptc(a,Rr-15)[1]:.1f})">{t}</text>' for a,t in zip(range(15,360,30),'ل ك ي ط ح ز و ه د ج ب ا'.split()))
rete=(f'<circle cx="{cx}" cy="{cy}" r="{Rr-70}" fill="url(#face)"/>'
  +''.join(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#3b5079" stroke-width="2"/>' for r in (110,190,260))
  +f'<circle cx="{cx}" cy="{cy-60}" r="225" fill="none" stroke="url(#br)" stroke-width="12" filter="url(#shs)"/>'
  +''.join((lambda a,l:f'<path d="M{ptc(a,l)[0]:.1f} {ptc(a,l)[1]:.1f} Q{ptc(a-8,l-70)[0]:.1f} {ptc(a-8,l-70)[1]:.1f} {ptc(a-20,l-110)[0]:.1f} {ptc(a-20,l-110)[1]:.1f}" fill="none" stroke="url(#br)" stroke-width="9" stroke-linecap="round"/><path d="M{ptc(a,l)[0]:.1f} {ptc(a,l)[1]:.1f} l{math.sin(math.radians(a+150))*26:.1f} {-math.cos(math.radians(a+150))*26:.1f} l{math.sin(math.radians(a-90))*20:.1f} {-math.cos(math.radians(a-90))*20:.1f}Z" fill="url(#br)"/>')(a,l) for a,l in [(40,270),(130,250),(215,265),(300,255)])
  +f'<mask id="cm2"><rect width="1024" height="1024" fill="#000"/><circle cx="{cx}" cy="{cy}" r="150" fill="#fff"/><circle cx="{cx+60}" cy="{cy-40}" r="135" fill="#000"/></mask><rect width="1024" height="1024" fill="url(#br)" mask="url(#cm2)" filter="url(#shs)"/>'
  +kaaba(cx-20,cy+20,1.05)
  +dauphine(0,0,0,'none'))
rule=f'<g transform="rotate(-35 {cx} {cy})" filter="url(#shs)"><rect x="{cx-14}" y="{cy-Rr+20}" width="28" height="{2*Rr-40}" rx="10" fill="url(#br)" opacity=".95"/><circle cx="{cx}" cy="{cy}" r="22" fill="url(#br)"/><circle cx="{cx}" cy="{cy}" r="8" fill="#4e3a1b"/></g>'
I=wrap(f'<g transform="translate({C} {C+40}) scale(.9) translate({-C} {-C})">'+kursi+f'<circle cx="{cx}" cy="{cy}" r="{Rr}" fill="url(#br)" filter="url(#sh)"/><circle cx="{cx}" cy="{cy}" r="{Rr-62}" fill="url(#brD)"/>'+deg+abj+rete+rule+'</g>')
for n,s in [('G',G),('H',H),('I',I)]:open(f'logo{n}.svg','w').write(s)
html='<html><body style="margin:0;background:#2a2d33;font-family:Amiri">'
html+='<div style="display:flex;gap:40px;padding:40px">'+''.join(f'<div style="text-align:center;color:#eee;font-size:34px"><img src="logo{n}.svg" style="width:340px;height:340px;border-radius:76px;box-shadow:0 10px 30px #0008"><div>{t}</div><div style="display:flex;gap:18px;justify-content:center;margin-top:16px;align-items:end"><img src="logo{n}.svg" style="width:120px;border-radius:27px"><img src="logo{n}.svg" style="width:60px;border-radius:13px"><img src="logo{n}.svg" style="width:30px;border-radius:7px"></div></div>' for n,t in [('G','٧ — ساعة بنافذة القمر'),('H','٨ — الميدالية'),('I','٩ — الأسطرلاب بالكرسي')])+'</div></body></html>'
open('sheet3.html','w').write(html)
