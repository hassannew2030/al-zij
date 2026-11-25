import math, datetime
# Meeus ch.25 (low-accuracy) solar coordinates + equation of time; DeltaT ~69s ignored for UT approx (adds ~0)
LAT=21.4225; LON=39.8262
def jd(y,m,d,h=0.0):
    if m<=2: y-=1; m+=12
    A=y//100; B=2-A+A//4
    return int(365.25*(y+4716))+int(30.6001*(m+1))+d+B-1524.5+h/24
def sun(JD):
    T=(JD-2451545.0)/36525
    L0=(280.46646+36000.76983*T+0.0003032*T*T)%360
    M=357.52911+35999.05029*T-0.0001537*T*T
    e=0.016708634-0.000042037*T-0.0000001267*T*T
    Mr=math.radians(M)
    C=(1.914602-0.004817*T-0.000014*T*T)*math.sin(Mr)+(0.019993-0.000101*T)*math.sin(2*Mr)+0.000289*math.sin(3*Mr)
    true=L0+C
    om=125.04-1934.136*T
    lam=true-0.00569-0.00478*math.sin(math.radians(om))
    eps0=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60
    eps=eps0+0.00256*math.cos(math.radians(om))
    dec=math.degrees(math.asin(math.sin(math.radians(eps))*math.sin(math.radians(lam))))
    y=math.tan(math.radians(eps/2))**2
    L0r=math.radians(L0)
    E=y*math.sin(2*L0r)-2*e*math.sin(Mr)+4*e*y*math.sin(Mr)*math.cos(2*L0r)-0.5*y*y*math.sin(4*L0r)-1.25*e*e*math.sin(2*Mr)
    return dec, math.degrees(E)*4  # EoT minutes
for year in (2026,2027):
    for (m,ds) in ((5,range(25,31)),(7,range(13,19))):
        for d in ds:
            # iterate transit
            t=12-LON/15
            for _ in range(3):
                dec,eot=sun(jd(year,m,d,t))
                t=12-LON/15-eot/60
            dec,eot=sun(jd(year,m,d,t))
            hh=int(t); mm=(t-hh)*60; ss=(mm-int(mm))*60
            ast=t+3; ah=int(ast); am=(ast-ah)*60
            print(f"{year}-{m:02d}-{d:02d} transit UTC {hh:02d}:{int(mm):02d}:{int(ss):02d}  AST {ah:02d}:{am:05.2f}  dec {dec:.4f}  zenith dist {abs(LAT-dec):.4f}  EoT {eot:+.2f} min")
