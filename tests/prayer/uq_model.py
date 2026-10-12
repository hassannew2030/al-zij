# Search for the official Umm al-Qura formula: which sun model + rounding reproduces the official minutes.
import sys,math,json,datetime,itertools
sys.path.insert(0,__import__('os').path.dirname(__file__))
import ref_precise as R
r,dg=math.radians,math.degrees
C=lambda x:math.ceil(x-1e-9)
hm=lambda s:int(s[:2])*60+int(s[3:])
jed=[l.split() for l in open(__import__('os').path.join(__import__('os').path.dirname(__file__),'uq_jeddah_obs.txt'))]
off=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__),'umm-al-qura-official-2026-10-11.json')))
def ymd(s):return tuple(map(int,s.split('-')))
def sunat(y,mo,d,hour_local,tz=3):
    return R.sun(R.jd_of(datetime.datetime(y,mo,d)+datetime.timedelta(hours=hour_local-tz)))
def ha(alt,lat,dec):
    c=(math.sin(r(alt))-math.sin(r(lat))*math.sin(r(dec)))/(math.cos(r(lat))*math.cos(r(dec)))
    return dg(math.acos(c))*4  # minutes
def model(y,mo,d,lat,lon,mode):
    # mode: where sun position is evaluated
    if mode=='noon':
        dec,eot=sunat(y,mo,d,12); dF=dS=dec; eF=eS=eot
    elif mode=='event':  # evaluate at approximate event time (two-pass)
        dec,eot=sunat(y,mo,d,12)
        noon=720+180-4*lon-eot
        tf=noon-ha(-18.5,lat,dec); ts=noon+ha(-0.833,lat,dec)
        dF,eF=sunat(y,mo,d,tf/60); dS,eS=sunat(y,mo,d,ts/60)
    elif mode=='0h':
        dec,eot=sunat(y,mo,d,0); dF=dS=dec; eF=eS=eot
    nF=720+180-4*lon-eF; nS=720+180-4*lon-eS
    dec,eot=sunat(y,mo,d,12); noon=720+180-4*lon-eot
    asr_alt=dg(math.atan(1/(1+math.tan(r(abs(lat-dec))))))
    return nF-ha(-18.5,lat,dF), noon, noon+ha(asr_alt,lat,dec), nS+ha(-0.833,lat,dS)
if __name__=="__main__":
  best=[]
  for mode in ('noon','event','0h'):
    for lat in [21.40+0.01*i for i in range(31)]:
      for lon in [39.10+0.005*i for i in range(41)]:
        T=[model(*ymd(o[0]),lat,lon,mode) for o in jed]
        sc={}
        for p in (0,0.25,0.5,0.75,1.0):
          sc['f%.2f'%p]=sum(C(t[0]+p)==hm(o[1]) for o,t in zip(jed,T))
        dh=sum(C(t[1])==hm(o[2]) for o,t in zip(jed,T)); asr=sum(C(t[2])==hm(o[3]) for o,t in zip(jed,T)); mg=sum(C(t[3])==hm(o[4]) for o,t in zip(jed,T))
        fb=max(sc.items(),key=lambda kv:kv[1])
        best.append((fb[1]+dh+asr+mg,mode,round(lat,2),round(lon,3),fb,dh,asr,mg))
  best.sort(reverse=True)
  for b in best[:12]:print(b)
