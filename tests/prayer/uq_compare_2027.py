# Compare the Al-Zij engine with the official Umm al-Qura 2027 data.
# python3 uq_compare_2027.py umm-al-qura-official-2027.json zij-2027.json [zij-before.json]
import json,sys,collections
P=('الفجر','الشروق','الظهر','العصر','المغرب','العشاء')
off=json.load(open(sys.argv[1]))['cities']
runs=[('بعد (الفرع)',json.load(open(sys.argv[2])))]+([('قبل (main)',json.load(open(sys.argv[3])))] if len(sys.argv)>3 else [])
hm=lambda s:int(s[:2])*60+int(s[3:])
for label,z in runs:
    print('==',label,'==')
    tot=ok=0
    for city,c in off.items():
        n=len(c['days']); good=[0]*6; hij=0; diffs=collections.Counter(); bad=collections.defaultdict(list)
        for d,v in c['days'].items():
            a=v['times'].split(); b=z[city][d]['times'].split()
            hij+= v['hijri']==z[city][d]['hijri']
            for i in range(6):
                k=hm(b[i])-hm(a[i])
                if k==0: good[i]+=1
                else: diffs[(P[i],k)]+=1; bad[P[i]].append(d)
        tot+=6*n; ok+=sum(good)
        print(f'{city} ({n} يوم): '+' · '.join(f'{P[i]} {good[i]}/{n}' for i in range(6))+f' · الهجري {hij}/{n}')
        for (p,k),cnt in sorted(diffs.items()): print(f'   {p} {k:+d} د: {cnt} يوم', '←', ' '.join(x[5:] for x in bad[p] if hm(z[city][x]["times"].split()[P.index(p)])-hm(off[city]["days"][x]["times"].split()[P.index(p)])==k)[:200])
    print(f'الإجمالي {ok}/{tot}')
