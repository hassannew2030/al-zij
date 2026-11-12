import math, datetime as D, collections, statistics as st
LAT,LON,TZ=3.1390,101.6869,8
def sunpos(jd):
    T=(jd-2451545)/36525
    L0=(280.46646+T*(36000.76983+T*0.0003032))%360
    M=357.52911+T*(35999.05029-0.0001537*T); Mr=math.radians(M)
    e=0.016708634-T*(0.000042037+0.0000001267*T)
    C=math.sin(Mr)*(1.914602-T*(0.004817+0.000014*T))+math.sin(2*Mr)*(0.019993-0.000101*T)+math.sin(3*Mr)*0.000289
    tl=L0+C; om=125.04-1934.136*T; lam=tl-0.00569-0.00478*math.sin(math.radians(om))
    eps0=23+(26+((21.448-T*(46.815+T*(0.00059-T*0.001813))))/60)/60; eps=eps0+0.00256*math.cos(math.radians(om))
    dec=math.degrees(math.asin(math.sin(math.radians(eps))*math.sin(math.radians(lam))))
    y=math.tan(math.radians(eps/2))**2
    L0r=math.radians(L0)
    eot=4*math.degrees(y*math.sin(2*L0r)-2*e*math.sin(Mr)+4*e*y*math.sin(Mr)*math.cos(2*L0r)-0.5*y*y*math.sin(4*L0r)-1.25*e*e*math.sin(2*Mr))
    return dec,eot
def jd_of(day,minutes_local):
    dt=D.datetime(day.year,day.month,day.day)+D.timedelta(minutes=minutes_local-TZ*60)
    return 2440587.5+(dt-D.datetime(1970,1,1)).total_seconds()/86400
def alt_at(day,mloc):
    jd=jd_of(day,mloc); dec,eot=sunpos(jd)
    ha=(mloc-TZ*60+eot+4*LON)/4-180  # solar hour angle deg
    a=math.asin(math.sin(math.radians(LAT))*math.sin(math.radians(dec))+math.cos(math.radians(LAT))*math.cos(math.radians(dec))*math.cos(math.radians(ha)))
    return math.degrees(a)
def find(day,target,lo,hi):
    # bisection for altitude crossing target between lo,hi minutes
    f=lambda m:alt_at(day,m)-target
    a,b=lo,hi
    for _ in range(60):
        c=(a+b)/2
        if (f(a)<0)==(f(c)<0): a=c
        else: b=c
    return (a+b)/2
def noon(day):
    m=720
    for _ in range(3):
        dec,eot=sunpos(jd_of(day,m)); m=720-4*LON-eot+TZ*60
    return m
def asr(day):
    n=noon(day); dec,_=sunpos(jd_of(day,n+200))
    z=abs(LAT-dec); h=math.degrees(math.atan(1/(1+math.tan(math.radians(z)))))
    return find(day,h,n,n+480)
hm=lambda s:int(s[:2])*60+int(s[3:5])
J={}
for l in open('jakim_wly01_2026.txt'):
    if l.startswith('#') or not l.strip(): continue
    p=l.split(); J[D.date(2026,int(p[0][:2]),int(p[0][3:]))]=[hm(x) for x in p[1:]]
Z={}
for l in open('zij_kl.txt'):
    p=l.split(); Z[D.date.fromisoformat(p[0])]=[round(float(x)) for x in p[1:]]
names=['الفجر','الشروق','الظهر','العصر','المغرب','العشاء']
print('days',len(J),len(Z))
print('\n== JAKIM − الزيج (دقائق) ==')
for i,n in enumerate(names):
    d=[J[k][i]-Z[k][i] for k in J]
    c=collections.Counter(d)
    print(n,'متطابق %.1f%%'%(100*c[0]/len(d)),'توزيع',dict(sorted(c.items())))
print('\n== JAKIM مقابل السماء الحقيقية (مركز كوالالمبور) ==')
rows=collections.defaultdict(list)
for k,v in sorted(J.items()):
    n=noon(k); sr=find(k,-0.833,n-500,n); ss=find(k,-0.833,n,n+500)
    rows['fajr_alt'].append(alt_at(k,v[0])); rows['isha_alt'].append(alt_at(k,v[5]))
    rows['fajr_alt+0.5'].append(alt_at(k,v[0]+0.5)); rows['isha_alt-0.5'].append(alt_at(k,v[5]-0.5))
    rows['sunrise'].append(v[1]-sr); rows['dhuhr'].append(v[2]-n); rows['asr'].append(v[3]-asr(k)); rows['maghrib'].append(v[4]-ss)
for k in ['fajr_alt','isha_alt','sunrise','dhuhr','asr','maghrib']:
    a=rows[k]; print(k,'متوسط %.2f'%st.mean(a),'أدنى %.2f'%min(a),'أعلى %.2f'%max(a))
# infer: fajr angle if JAKIM = true_time(angle)+adj rounded
for ang in (18,19,20,20.5):
  for adj in (0,1,2,3):
    ok=0;tot=0
    for k,v in J.items():
        n=noon(k); t=find(k,-ang,n-720,n)
        for rnd in (lambda x:math.ceil(x),):
            ok+= (rnd(t+adj)==v[0]); tot+=1
    if ok/tot>0.5: print('fajr',ang,'+',adj,'ceil',ok,'/',tot)
for ang in (17,18,18.5):
  for adj in (0,1,2,3):
    ok=0;tot=0
    for k,v in J.items():
        n=noon(k); t=find(k,-ang,n,n+720); ok+=(math.ceil(t+adj)==v[5]); tot+=1
    if ok/tot>0.5: print('isha',ang,'+',adj,'ceil',ok,'/',tot)
for nm,idx,fn in [('maghrib',4,lambda k:find(k,-0.833,noon(k),noon(k)+500)),('dhuhr',2,noon),('sunrise',1,lambda k:find(k,-0.833,noon(k)-500,noon(k))),('asr',3,asr)]:
  for adj in range(-3,4):
    for rn,rf in (('ceil',math.ceil),('floor',math.floor),('round',round)):
      ok=sum(rf(fn(k)+adj)==v[idx] for k,v in J.items())
      if ok/len(J)>0.6: print(nm,'adj',adj,rn,ok,'/',len(J))
