import math, statistics as st, datetime as D, sys
sys.argv=['x']
import anal as A
hm=lambda s:int(s[:2])*60+int(s[3:5])
Z={};cur=None
for l in open('zones.txt'):
    p=l.split()
    if p[0]=='Z': cur=p[1]; Z[cur]={'lat':float(p[2]),'lon':float(p[3]),'d':{}}
    else: Z[cur]['d'][D.date(2026,int(p[0][:2]),int(p[0][3:]))]=[hm(x) for x in p[1:]]
A.TZ=8
def events(lat,lon,k):
    A.LAT,A.LON=lat,lon
    n=A.noon(k); return n, A.find(k,-0.833,n-500,n), A.find(k,-0.833,n,n+500)
res={}
for z,v in Z.items():
    best=None
    for i in range(-50,51):
        lat=v['lat']+i*0.02
        r=[]
        for k,j in v['d'].items():
            n,sr,ss=events(lat,v['lon'],k); r.append((j[4]-j[1])-(ss-sr))
        s=st.pstdev(r)
        if best is None or s<best[0]: best=(s,lat,st.mean(r))
    lat=best[1]; A.LAT,A.LON=lat,v['lon']
    R={'sunrise':[],'dhuhr':[],'asr':[],'maghrib':[],'fajr_alt':[],'isha_alt':[]}
    for k,j in v['d'].items():
        n,sr,ss=events(lat,v['lon'],k); a=A.asr(k)
        R['sunrise'].append(j[1]-sr);R['dhuhr'].append(j[2]-n);R['asr'].append(j[3]-a);R['maghrib'].append(j[4]-ss)
        R['fajr_alt'].append(A.alt_at(k,j[0]));R['isha_alt'].append(A.alt_at(k,j[5]))
    res[z]=(lat,R)
    print(f"{z}: خط العرض المستنتج {lat:.2f} (الاسمي {v['lat']}) · تشتت طول النهار {best[0]:.2f} د")
    for key,a in R.items(): print(f"   {key:9} متوسط {st.mean(a):+.2f} · مدى {min(a):+.2f}..{max(a):+.2f}")
