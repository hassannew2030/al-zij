import math
exec(open('logos3.py').read().split("# G —")[0])   # DEFS, wrap, kaaba, pt, ar, bezel helpers
PHI=21.4225; EPS=23.44
def build(cx=512,cy=600,Ro=392,name=False,bold=False,scale=1.0):
    k=lambda d:math.radians(d)
    Rp=Ro-58                     # plate radius = Capricorn
    Re=Rp/math.tan(k((90+EPS)/2))
    rd=lambda dec:Re*math.tan(k((90-dec)/2))
    P=lambda a,r:(cx+math.sin(k(a))*r,cy-math.cos(k(a))*r)
    o=[]
    # ---- kursi (throne) + shackle + ring
    top=cy-Ro
    w1,w2,h=170,70,150
    o.append(f'<path d="M{cx-w1} {top+30} C{cx-w1-10} {top-40},{cx-w2-60} {top-60},{cx-w2} {top-h+10} Q{cx} {top-h-30} {cx+w2} {top-h+10} C{cx+w2+60} {top-60},{cx+w1+10} {top-40},{cx+w1} {top+30}Z" fill="url(#br)" filter="url(#sh)"/>')
    if not bold and not name:
        # arabesque cut-outs in the throne
        for s in (-1,1):
            o.append(f'<path d="M{cx+s*40} {top-30} c{s*30} -10,{s*70} -5,{s*95} 25 c{-s*35} 5,{-s*70} 0,{-s*95} -25Z" fill="#0c1222"/>')
            o.append(f'<circle cx="{cx+s*112}" cy="{top-6}" r="13" fill="#0c1222"/>')
        o.append(f'<path d="M{cx} {top-118} c18 22,18 44,0 64 c-18 -20,-18 -42,0 -64Z" fill="#0c1222"/>')
    if name:
            o.append(f'<text x="{cx}" y="{top-8}" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="84" fill="#2a1f0e">الزيج</text>')
    o.append(f'<rect x="{cx-16}" y="{top-h-56}" width="32" height="46" rx="8" fill="url(#brV)"/>')
    o.append(f'<circle cx="{cx}" cy="{top-h-84}" r="36" fill="none" stroke="url(#br)" stroke-width="{18 if bold else 14}"/>')
    # ---- mater rim with degree scale and abjad
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{Ro}" fill="url(#br)" filter="url(#sh)"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{Ro-6}" fill="none" stroke="#6e5228" stroke-width="3"/>')
    if not bold:
        for a in range(0,360,2):
            big=a%10==0;r1=Ro-14;r2=Ro-(34 if big else 24)
            x1,y1=P(a,r1);x2,y2=P(a,r2)
            o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#3a2a12" stroke-width="{2.6 if big else 1.2}"/>')
        ab='ا ب ج د ه و ز ح ط ي يا يب'.split()
        for i,t in enumerate(ab):
            a=i*30+15;x,y=P(a,Ro-46)
            o.append(f'<text x="{x:.1f}" y="{y+9:.1f}" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="34" fill="#3a2a12" transform="rotate({a} {x:.1f} {y:.1f})">{t}</text>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{Rp}" fill="url(#brD)"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{Rp-5}" fill="url(#face)"/>')
    # ---- plate for Jeddah: tropics, equator, horizon & almucantars (real stereographic projection)
    o.append(f'<clipPath id="plate{int(cx)}{int(Ro)}"><circle cx="{cx}" cy="{cy}" r="{Rp-5}"/></clipPath><g clip-path="url(#plate{int(cx)}{int(Ro)})" fill="none" stroke="#c9a35d">')
    for dec in (EPS,0):
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{rd(dec):.1f}" stroke-width="2" opacity=".55"/>')
    hs=[0,10,20,30,40,50,60,70,80] if bold else list(range(0,90,6))
    for hh in hs:
        u1=180-PHI-hh;u2=hh-PHI
        y1=Re*math.tan(k(u1/2));y2=Re*math.tan(k(u2/2))
        c=(y1+y2)/2;r=abs(y1-y2)/2
        o.append(f'<circle cx="{cx}" cy="{cy-c:.1f}" r="{r:.1f}" stroke-width="{3 if hh==0 else 1.4}" opacity="{.9 if hh==0 else .45}"/>')
    o.append(f'<line x1="{cx}" y1="{cy-Rp}" x2="{cx}" y2="{cy+Rp}" stroke-width="1.6" opacity=".5"/><line x1="{cx-Rp}" y1="{cy}" x2="{cx+Rp}" y2="{cy}" stroke-width="1.6" opacity=".5"/>')
    o.append('</g>')
    # ---- rete: ecliptic ring + crescent + star pointers
    rc,rC=rd(EPS),rd(-EPS)
    rot=-25
    off=(rC-rc)/2; er=(rC+rc)/2
    ex,ey=P(rot+180,off)  # ecliptic centre shifted away from Cancer side
    rw=18 if bold else 13
    o.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="{er:.1f}" fill="none" stroke="url(#br)" stroke-width="{rw}" filter="url(#shs)"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{Rp-12}" fill="none" stroke="url(#br)" stroke-width="{rw-3}" filter="url(#shs)"/>')
    # bars from hub to rim (rete frame)
    for a in (0,90,180,270):
        x1,y1=P(a+rot,70);x2,y2=P(a+rot,Rp-14)
        o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="url(#br)" stroke-width="{rw-4}" filter="url(#shs)"/>')
    # star pointers: flame daggers with a scroll
    if not bold:
        for a,l in [(48,232),(122,214),(205,250),(250,196),(318,240),(160,280)]:
            tx,ty=P(a,l);bx,by=P(a+8,l-68);lx,ly=P(a-14,l-52)
            o.append(f'<path d="M{tx:.1f} {ty:.1f} Q{lx:.1f} {ly:.1f} {bx:.1f} {by:.1f} Q{(tx+bx)/2+8:.1f} {(ty+by)/2:.1f} {tx:.1f} {ty:.1f}Z" fill="url(#br)" filter="url(#shs)"/>')
            o.append(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="7" fill="none" stroke="url(#br)" stroke-width="5"/>')
    # crescent at the top of the rete (the Zij's moon)
    mx,my=P(0,Rp*0.47 if not bold else Rp*0.45)
    rr=86 if not bold else 104
    o.append(f'<mask id="cr{int(cx)}{int(Ro)}"><rect width="1024" height="1024" fill="#000"/><circle cx="{mx:.1f}" cy="{my:.1f}" r="{rr}" fill="#fff"/><circle cx="{mx+rr*.42:.1f}" cy="{my-rr*.30:.1f}" r="{rr*.86}" fill="#000"/></mask>')
    o.append(f'<rect width="1024" height="1024" fill="url(#br)" mask="url(#cr{int(cx)}{int(Ro)})" filter="url(#shs)"/>')
    # alidade (rule) across
    o.append(f'<g transform="rotate(-38 {cx} {cy})" filter="url(#sh)"><path d="M{cx-12} {cy-Rp+6} L{cx+12} {cy-Rp+6} L{cx+22} {cy} L{cx+12} {cy+Rp-6} L{cx-12} {cy+Rp-6} L{cx-22} {cy}Z" fill="url(#br)" opacity=".96"/>'
             f'<line x1="{cx}" y1="{cy-Rp+10}" x2="{cx}" y2="{cy+Rp-10}" stroke="#6e5228" stroke-width="2"/></g>')
    # hub: Kaaba on the pin (the centre of the plate = the pole; the Kaaba is our centre)
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{52 if not bold else 60}" fill="url(#br)" filter="url(#shs)"/><circle cx="{cx}" cy="{cy}" r="{42 if not bold else 50}" fill="#0c1222"/>')
    o.append(kaaba(cx,cy+2,0.62 if not bold else .74))
    return '<g transform="translate(%f %f) scale(%f) translate(%f %f)">'%(512,512,scale,-512,-512)+''.join(o)+'</g>'
J=wrap(build(cy=620,Ro=380,scale=.87))
K=wrap(build(cy=620,Ro=380,bold=True,scale=.87))
L=wrap(build(cy=620,Ro=380,name=True,scale=.87))
for n,s in [('J',J),('K',K),('L',L)]:open(f'logo{n}.svg','w').write(s)
html='<html><body style="margin:0;background:#2a2d33;font-family:Amiri">'
html+='<div style="display:flex;gap:40px;padding:40px">'+''.join(f'<div style="text-align:center;color:#eee;font-size:34px"><img src="logo{n}.svg" style="width:340px;height:340px;border-radius:76px;box-shadow:0 10px 30px #0008"><div>{t}</div><div style="display:flex;gap:18px;justify-content:center;margin-top:16px;align-items:end"><img src="logo{n}.svg" style="width:120px;border-radius:27px"><img src="logo{n}.svg" style="width:60px;border-radius:13px"><img src="logo{n}.svg" style="width:30px;border-radius:7px"></div></div>' for n,t in [('J','أ — الأسطرلاب الكامل'),('K','ب — المبسّط للأيقونة'),('L','ج — باسم الزيج على الكرسي')])+'</div></body></html>'
open('sheet4.html','w').write(html)
