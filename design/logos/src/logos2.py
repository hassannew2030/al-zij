import math,base64
exec(open('logos.py').read().split("# A — astrolabe")[0])
MOON='data:image/png;base64,'+base64.b64encode(open('moon.png','rb').read()).decode()
SKY='''<radialGradient id="sky" cx="62%" cy="38%" r="80%"><stop offset="0" stop-color="#1b2540"/><stop offset=".55" stop-color="#0c1120"/><stop offset="1" stop-color="#05070c"/></radialGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset=".6" stop-color="#f3e3ae" stop-opacity=".18"/><stop offset="1" stop-color="#f3e3ae" stop-opacity="0"/></radialGradient>'''
def wrap2(body,bg='url(#sky)'):return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024">{DEFS.replace("</defs>",SKY+"</defs>")}<rect width="1024" height="1024" fill="{bg}"/>{body}</svg>'
# D — real moon
stars=''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#f3e3ae" opacity="{o}"/>' for x,y,r,o in [(180,210,4,.8),(260,820,3,.5),(840,860,3.5,.6),(120,560,2.5,.5),(900,170,3,.5),(330,120,2,.4)])
D=wrap2(f'''{stars}<circle cx="512" cy="512" r="420" fill="url(#glow)"/>
<ellipse cx="512" cy="512" rx="440" ry="440" fill="none" stroke="url(#br)" stroke-width="10" stroke-dasharray="1 0"/>
<image href="{MOON}" x="192" y="192" width="640" height="640"/>
<g transform="translate(210 230)"><path d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7Z" fill="#f3e3ae"/></g>''')
MX,MY=455,95
# E — ر + moon dot = ز
E=wrap2(f'''<circle cx="{C}" cy="{C}" r="430" fill="none" stroke="url(#br)" stroke-width="14"/>
<text id="ra" x="530" y="580" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="1000" fill="url(#br)">ر</text>
<image href="{MOON}" x="{MX}" y="{MY}" width="150" height="150"/>''')
# F — 8 phases around a star
def phase(cx,cy,r,k):
    il=(1-math.cos(k*math.pi/4))/2; xt=r*(1-2*il); rx=abs(xt)
    d=f'M {cx} {cy-r} A {r} {r} 0 0 0 {cx} {cy+r} A {rx:.2f} {r} 0 0 {0 if xt>0 else 1} {cx} {cy-r} Z'
    flip=f' transform="translate({2*cx} 0) scale(-1 1)"' if k>4 else ''
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#efe6cc"/><path d="{d}" fill="#0e1320"{flip}/><circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#7c5f30" stroke-width="3"/>'
ring=''.join(phase(round(pt(k*45,340)[0]),round(pt(k*45,340)[1]),62,k) for k in range(8))
sq=lambda r,rot:f'<rect x="{C-r}" y="{C-r}" width="{2*r}" height="{2*r}" transform="rotate({rot} {C} {C})" fill="url(#br)"/>'
F=wrap2(f'''<circle cx="{C}" cy="{C}" r="430" fill="none" stroke="#5d4725" stroke-width="4"/>{ring}
{sq(150,0)}{sq(150,45)}<circle cx="{C}" cy="{C}" r="120" fill="#0d1119" stroke="#f3e3ae" stroke-width="6"/>
<image href="{MOON}" x="{C-100}" y="{C-100}" width="200" height="200"/>''')
for n,s in [('D',D),('E',E),('F',F)]:open(f'logo{n}.svg','w').write(s)
html='<html><body style="margin:0;background:#2a2d33;font-family:Amiri">'
html+='<div style="display:flex;gap:40px;padding:40px">'+''.join(f'<div style="text-align:center;color:#eee;font-size:34px"><img src="logo{n}.svg" style="width:340px;height:340px;border-radius:76px;box-shadow:0 10px 30px #0008"><div>{t}</div><div style="display:flex;gap:18px;justify-content:center;margin-top:16px;align-items:end"><img src="logo{n}.svg" style="width:120px;border-radius:27px"><img src="logo{n}.svg" style="width:60px;border-radius:13px"><img src="logo{n}.svg" style="width:30px;border-radius:7px"></div></div>' for n,t in [('D','٤ — القمر الحقيقي'),('E','٥ — حرف الزاي'),('F','٦ — أطوار القمر')])+'</div></body></html>'
open('sheet2.html','w').write(html)
