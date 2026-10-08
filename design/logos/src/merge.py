import math
exec(open('logos.py').read().split("# A — astrolabe")[0])
def ring(r_out=430,r_face=404,ticks=True,skip=None):
    s=f'<circle cx="{C}" cy="{C}" r="{r_out}" fill="url(#br)"/><circle cx="{C}" cy="{C}" r="{r_face}" fill="url(#face)"/>'
    if ticks:
        for a in range(0,360,10):
            if skip and skip(a):continue
            big=a%30==0;x1,y1=pt(a,392);x2,y2=pt(a,352 if big else 372)
            s+=f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#eddba0" stroke-width="{10 if big else 5}" stroke-linecap="round"/>'
    return s
def star(cx,cy,r,a,sw=16):
    sq=lambda rot:f'<rect x="{cx-r}" y="{cy-r}" width="{2*r}" height="{2*r}" transform="rotate({rot} {cx} {cy})" fill="none" stroke="url(#br)" stroke-width="{sw}" stroke-linejoin="round"/>'
    L=r*1.75
    tx,ty=cx+math.sin(math.radians(a))*L,cy-math.cos(math.radians(a))*L
    lx,ly=cx+math.sin(math.radians(a-90))*24,cy-math.cos(math.radians(a-90))*24
    rx,ry=cx+math.sin(math.radians(a+90))*24,cy-math.cos(math.radians(a+90))*24
    return (sq(0)+sq(45)+f'<circle cx="{cx}" cy="{cy}" r="{r*.47}" fill="#0d1119" stroke="#eddba0" stroke-width="8"/>'
      f'<path d="M{tx:.1f} {ty:.1f} L{lx:.1f} {ly:.1f} L{rx:.1f} {ry:.1f}Z" fill="#c0574a"/><circle cx="{cx}" cy="{cy}" r="{r*.13}" fill="#eddba0"/>')
def crescent(id,cx,cy,r,dx,dy,r2,fill='url(#br)'):
    return f'<mask id="{id}"><rect width="1024" height="1024" fill="#000"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/><circle cx="{cx+dx}" cy="{cy+dy}" r="{r2}" fill="#000"/></mask><rect width="1024" height="1024" fill="{fill}" mask="url(#{id})"/>'
# M1 — dial ring + big crescent + star needle pointing to the Kaaba on the ring
qa=45
kx,ky=pt(qa,300)
M1=wrap(ring()+crescent('c1',C-20,C+10,330,120,-70,288)+star(C+80,C-35,105,qa)+KAABA(round(kx),round(ky),1.15))
# M2 — compass of design 1 with the star as its hub; red needle to the Kaaba at 12, white crescent top-right
gx1,gy1=pt(-38,330);gx2,gy2=pt(142,330)
needle=f'<path d="M{gx1:.1f} {gy1:.1f} L{pt(52,32)[0]:.1f} {pt(52,32)[1]:.1f} L{gx2:.1f} {gy2:.1f} L{pt(232,32)[0]:.1f} {pt(232,32)[1]:.1f}Z" fill="url(#br2)"/>'
k2x,k2y=pt(0,300)
M2=wrap(ring()+f'<circle cx="{C}" cy="{C}" r="250" fill="none" stroke="#7c5f30" stroke-width="6"/>'+needle+crescent('c2',C+165,C-150,88,-42,-26,80,'#eae3cf')+star(C,C,92,0)+KAABA(round(k2x),round(k2y),1.15))
# M3 — the crescent is the dial: ticks only on the open side, star + needle in the opening toward the Kaaba
def skip3(a):return not (a>=0 and a<=150)
M3=wrap(f'<circle cx="{C}" cy="{C}" r="430" fill="none" stroke="#7c5f30" stroke-width="5" opacity=".7"/>'
        +crescent('c3',C,C,430,150,-85,375)
        +''.join((lambda big,x1,y1,x2,y2:f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#eddba0" stroke-width="{9 if big else 4.5}" stroke-linecap="round"/>')(a%30==0,*pt(a,412),*pt(a,(376 if a%30==0 else 394))) for a in range(0,160,10))
        +star(C+95,C-55,110,40)+KAABA(round(pt(40,330)[0]+40),round(pt(40,330)[1]-30),1.1))
for n,s in [('M1',M1),('M2',M2),('M3',M3)]:open(f'logo{n}.svg','w').write(s)
html='<html><body style="margin:0;background:#2a2d33;font-family:Amiri">'
html+='<div style="display:flex;gap:40px;padding:40px">'+''.join(f'<div style="text-align:center;color:#eee;font-size:34px"><img src="logo{n}.svg" style="width:340px;height:340px;border-radius:76px;box-shadow:0 10px 30px #0008"><div>{t}</div><div style="display:flex;gap:18px;justify-content:center;margin-top:16px;align-items:end"><img src="logo{n}.svg" style="width:120px;border-radius:27px"><img src="logo{n}.svg" style="width:60px;border-radius:13px"><img src="logo{n}.svg" style="width:30px;border-radius:7px"></div></div>' for n,t in [('M1','دمج ١ — الهلال جوه البوصلة'),('M2','دمج ٢ — النجمة قلب البوصلة'),('M3','دمج ٣ — الهلال هو البوصلة')])+'</div></body></html>'
open('sheet5.html','w').write(html)
