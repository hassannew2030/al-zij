# Independent reference: PrayTimes.org algorithm (the base of Aladhan), with the same high-latitude (angle-based) and polar (65°) rules.
import math,json,sys,datetime
dsin=lambda d:math.sin(math.radians(d));dcos=lambda d:math.cos(math.radians(d));dtan=lambda d:math.tan(math.radians(d))
darcsin=lambda x:math.degrees(math.asin(x));darccos=lambda x:math.degrees(math.acos(x));darctan2=lambda y,x:math.degrees(math.atan2(y,x))
fix=lambda a,b:(a-b*math.floor(a/b))
def sunpos(jd):
    D=jd-2451545.0;g=fix(357.529+0.98560028*D,360);q=fix(280.459+0.98564736*D,360)
    L=fix(q+1.915*dsin(g)+0.020*dsin(2*g),360);e=23.439-0.00000036*D
    RA=darctan2(dcos(e)*dsin(L),dcos(L))/15.0;eqt=q/15.0-fix(RA,24);decl=darcsin(dsin(e)*dsin(L));return decl,eqt
def julian(y,m,d):
    if m<=2:y-=1;m+=12
    A=math.floor(y/100);B=2-A+math.floor(A/4)
    return math.floor(365.25*(y+4716))+math.floor(30.6001*(m+1))+d+B-1524.5
def times(y,m,d,lat,lng,tz,M,ramadan=False):
    jd=julian(y,m,d)-lng/(15*24.0)
    def mid(t):return fix(12-sunpos(jd+t)[1],24)
    def ang(a,t,ccw):
        decl=sunpos(jd+t)[0];c=(-dsin(a)-dsin(decl)*dsin(lat))/(dcos(decl)*dcos(lat))
        if c>1 or c<-1:return float('nan')
        T=darccos(c)/15.0;return mid(t)+(-T if ccw else T)
    def asr(f,t):
        decl=sunpos(jd+t)[0]
        if abs(lat-decl)>=90:return float('nan')   # sun below the horizon even at noon: no Asr shadow exists
        a=-math.degrees(math.atan(1/(f+dtan(abs(lat-decl)))));return ang(a,t,False)
    def run(lat_):
        nonlocal lat;lat=lat_
        T=[5,6,12,13,18,18];T=[x/24 for x in T]
        for _ in range(3):
            fj=ang(M['fajr'],T[0],True);sr=ang(0.833,T[1],True);dh=mid(T[2]);ar=asr(M.get('asr',1),T[3]);ss=ang(0.833,T[4],False)
            ish=float('nan') if M.get('ishaMin') else ang(M['isha'],T[5],False)
            T=[ (x if x==x else T[i]*24)/24 for i,x in enumerate([fj,sr,dh,ar,ss,ish])]
        return fj,sr,dh,ar,ss,ish
    lat0=lat;polar=False
    fj,sr,dh,ar,ss,ish=run(lat0)
    if sr!=sr or ss!=ss or ar!=ar or ar-dh<5/60.0:
        polar=True;fj,sr,dh,ar,ss,ish=run(math.copysign(65,lat0 or 1))
    adj=lambda x:x+tz-lng/15.0
    fj,sr,dh,ar,ss,ish=[adj(x) for x in (fj,sr,dh,ar,ss,ish)]
    night=(sr+24)-ss
    fp=M['fajr']/60.0*night
    if fj!=fj or (sr-fj)>fp:fj=sr-fp
    if M.get('ishaMin'):
        ish=ss+((M.get('ramadanIsha') or M['ishaMin']) if ramadan else M['ishaMin'])/60.0
        if ish>(sr+24)-fp:ish=ss+night/2
    else:
        ip=M['isha']/60.0*night
        if ish!=ish or (ish-ss)>ip:ish=ss+ip
    return dict(fajr=fj*60,sunrise=sr*60,dhuhr=dh*60,asr=ar*60,maghrib=ss*60,isha=ish*60,polar=polar)
if __name__=='__main__':
    cfg=json.load(open(sys.argv[1]));out={}
    for c in cfg['cities']:
        rows=[];d0=datetime.date(cfg['year'],1,1)
        for i in range(365):
            d=d0+datetime.timedelta(i);rows.append(times(d.year,d.month,d.day,c['lat'],c['lon'],c['tz'],cfg['methods'][c['m']]))
        out[c['n']]=rows
    json.dump(out,open(sys.argv[2],'w'))
