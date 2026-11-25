import math, anal as A
J=A.J; ks=sorted(J)
N={k:A.noon(k) for k in ks}
SR={k:A.find(k,-0.833,N[k]-500,N[k]) for k in ks}; SS={k:A.find(k,-0.833,N[k],N[k]+500) for k in ks}; AS={k:A.asr(k) for k in ks}
adjs=[x/4 for x in range(-16,17)]
def fit(name,idx,T):
    best=max(((sum(round(T[k]+a)==J[k][idx] for k in ks),a) for a in adjs)); print(name,'أفضل إزاحة %+.2f د'%best[1],'مطابقة %d/365 = %.1f%%'%(best[0],100*best[0]/365))
fit('الشروق',1,SR); fit('الظهر',2,N); fit('العصر',3,AS); fit('المغرب',4,SS)
for name,idx,side in (('الفجر',0,-1),('العشاء',5,1)):
    res=[]
    for ang in [x/10 for x in range(165,205,5)]:
        T={k:(A.find(k,-ang,N[k]-720,N[k]) if side<0 else A.find(k,-ang,N[k],N[k]+720)) for k in ks}
        b=max(((sum(round(T[k]+a)==J[k][idx] for k in ks),a) for a in adjs)); res.append((b[0],ang,b[1]))
    res.sort(reverse=True); print(name,'أفضل: زاوية %.1f° وإزاحة %+.2f د → %d/365 = %.1f%%'%(res[0][1],res[0][2],res[0][0],100*res[0][0]/365),' | التالي',res[1:3])
