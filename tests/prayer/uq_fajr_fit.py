import math,json
from uq_model import sunat,ha,ymd,jed,hm,C
off=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__),'umm-al-qura-official-2026-10-11.json')))
cases=[(21.5433,39.1728,o[0],hm(o[1])) for o in jed]+[(v[0],v[1],'2026-10-11',hm(v[2].split()[0])) for v in off.values()]+[(21.5433,39.1728,'2026-10-11',302)]
def fj(lat,lon,ds,Hd,He,ang=18.5):
    y,mo,d=ymd(ds); dec=sunat(y,mo,d,Hd)[0]; eot=sunat(y,mo,d,He)[1]; return 900-4*lon-eot-ha(-ang,lat,dec)
res=[]
for He in (5,12):
  for Hd in range(-24,73,2):
    vals=[(fj(la,lo,ds,Hd,He),u) for la,lo,ds,u in cases]
    for p in [x/20 for x in range(-20,31)]:
        n=sum(C(v+p)==u for v,u in vals); nj=sum(C(v+p)==u for v,u in vals[:47]); res.append((n,nj,Hd,He,p))
res.sort(reverse=True)
for x in res[:10]:print('total %d/61 jeddah %d/47 dec@%dh eot@%dh p=%.2f'%x)
