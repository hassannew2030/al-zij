import math
def star(cx,cy,r,sw=1.3,needle=True):
    sq=lambda rot:f'<rect x="{cx-r}" y="{cy-r}" width="{2*r}" height="{2*r}" transform="rotate({rot} {cx} {cy})" fill="none" stroke="url(#brassGrad)" stroke-width="{sw}" stroke-linejoin="round"/>'
    s=sq(0)+sq(45)+f'<circle cx="{cx}" cy="{cy}" r="{r*.45}" fill="#0d1119" stroke="#eddba0" stroke-width="{sw*.7}"/>'
    if needle:s+=f'<path d="M{cx} {cy-r*1.75} L{cx+r*.22} {cy} L{cx-r*.22} {cy}Z" fill="#c0574a"/>'
    return s+f'<circle cx="{cx}" cy="{cy}" r="{r*.14}" fill="#eddba0"/>'
W=lambda t,y,fs=13:f'<text x="300" y="{y}" text-anchor="middle" font-family="Amiri, serif" font-weight="700" font-size="{fs}" fill="#d9bd7a" letter-spacing=".5">{t}</text>'
V={
 'a':star(300,210,9)+W("الزيج",241,15),
 'b':star(300,216,5.5,1)+W('الزيج',241,16),
 'c':star(300,222,12,1.5),
}
src=open('merge/al-zij-v2.html',encoding='utf8').read()
anchor='<!-- عقرب الثانية'
assert src.count(anchor)==1
for k,g in V.items():
    open(f'mk-{k}.html','w',encoding='utf8').write(src.replace(anchor,f'<g id="zijMark" pointer-events="none">{g}</g>\n        '+anchor))
