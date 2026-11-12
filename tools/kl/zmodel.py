import math, datetime as D, sys
sys.argv=['x']
import anal as A, zfit as F
A.TZ=8
out=[]
for z,(lat,R) in F.res.items():
    v=F.Z[z]; A.LAT,A.LON=lat,v['lon']
    pre={}
    for k in v['d']:
        n=A.noon(k); pre[k]=(A.find(k,-18,n-720,n),A.find(k,-0.833,n-500,n),n,A.asr(k),A.find(k,-0.833,n,n+500),A.find(k,-18,n,n+720))
    best=None
    for X in [0,1,2,3]:
      for rn,rf in (('ceil',math.ceil),('round',round)):
        for s100 in range(-300,301,5):
          s=s100/100
          off=[X,X-1,X+1,X,X,X]
          ok=[sum(rf(pre[k][i]+s+off[i])==v['d'][k][i] for k in v['d']) for i in range(6)]
          tot=sum(ok)
          if best is None or tot>best[0]: best=(tot,X,rn,s,ok)
    tot,X,rn,s,ok=best
    print(f"{z}: X={X} تقريب={rn} إزاحة المنطقة {s:+.2f} د (≈{s/4:+.3f}° طول) · مطابقة {tot}/{6*len(v['d'])} = {100*tot/(6*len(v['d'])):.1f}% · لكل صلاة {ok}")
