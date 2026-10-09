import json,datetime,sys
ref=json.load(open('hl/ref.json'));js=json.load(open('hl/js.json'));K=['fajr','sunrise','dhuhr','asr','maghrib','isha']
tol=float(sys.argv[1]) if len(sys.argv)>1 else 2
d0=datetime.date(2026,1,1);allok=True
print(f"{'المدينة':<12} {'أكبر فرق (د)':>12} {'أيام برّه':>9} {'ترتيب غلط':>9} {'قفزات':>6} {'أيام مقدّرة':>10} {'قطبي':>5}")
for c in js:
    worst=0;bad=0;order=0;jump=0;est=0;pol=0;ex=[]
    J=js[c];R=ref[c]
    for i,(j,r) in enumerate(zip(J,R)):
        if j['polar']:pol+=1
        if j['est'] and (j['est'].get('fajr') or j['est'].get('isha')):est+=1
        dd=0
        for k in K:
            if k=='isha' and j.get('ram'):continue
            x=abs(((j[k]-r[k])+720)%1440-720);dd=max(dd,x)
            if x>worst:worst=x;wk=(i,k,j[k],r[k])
        if dd>tol:bad+=1;ex.append((str(d0+datetime.timedelta(i)),round(dd,1)))
        seq=[j[k] for k in K]
        # isha may pass midnight; normalise relative to fajr
        s=[v-seq[0] for v in seq];s=[v+1440 if v<0 else v for v in s]
        if any(s[n]>=s[n+1] for n in range(5)):order+=1
        if i>0:
            for k in ['fajr','dhuhr','asr','isha']:
                dv=abs(((j[k]-J[i-1][k])+720)%1440-720)
                if dv>20 and not (j['polar']!=J[i-1]['polar']):jump+=1;break
    ok=bad==0 and order==0
    allok&=ok
    print(f"{c:<12} {worst:>12.1f} {bad:>9} {order:>9} {jump:>6} {est:>10} {pol:>5}  {'✅' if ok else '❌ '+str(ex[:3])}")
print('ALL OK' if allok else 'FAIL')
