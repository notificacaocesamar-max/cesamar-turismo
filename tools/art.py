"""Gerador de ilustrações no estilo 'cartaz de viagem' (SVG, 1600x1000).
Uso: python art.py <pasta_saida>
Cada arquivo pode ser trocado depois por uma foto (.jpg) com o mesmo nome base."""
import math, random, sys, os

W, H = 1600, 1000

class S:
    def __init__(self, name, seed=1):
        self.name = name; self.defs = []; self.body = []; self.rng = random.Random(seed); self.n = 0
    def id(self, p='g'):
        self.n += 1; return f'{self.name[:3]}{p}{self.n}'
    def lg(self, stops, x1=0, y1=0, x2=0, y2=1):
        i = self.id('lg')
        st = ''.join(f'<stop offset="{o}" stop-color="{c}"{" stop-opacity=%s" % a if a is not None else ""}/>' for o, c, *r in stops for a in [r[0] if r else None])
        self.defs.append(f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>')
        return f'url(#{i})'
    def rg(self, stops, cx=.5, cy=.5, r=.5):
        i = self.id('rg')
        st = ''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
        self.defs.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{st}</radialGradient>')
        return f'url(#{i})'
    def add(self, s): self.body.append(s)
    def svg(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'
                f'<defs>{"".join(self.defs)}</defs>{"".join(self.body)}</svg>')

# ---------------------------------------------------------------- primitivas
def f(v): return f'{v:.1f}'
def poly(pts): return 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + 'Z'

def smooth(pts, close_bottom=None):
    """Catmull-Rom -> Bezier. close_bottom=y fecha até a base."""
    d = f'M{f(pts[0][0])} {f(pts[0][1])}'
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i else pts[i]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}'
    if close_bottom is not None:
        d += f' L{f(pts[-1][0])} {close_bottom} L{f(pts[0][0])} {close_bottom}Z'
    return d

def ridge(s, y, amp, color, rough=.55, levels=7, x0=-40, x1=W + 40, bottom=H + 5, peaks=None, op=1):
    pts = [(x0, y + s.rng.uniform(-amp, amp) * .3), (x1, y + s.rng.uniform(-amp, amp) * .3)]
    a = amp
    for _ in range(levels):
        new = []
        for i in range(len(pts) - 1):
            (xa, ya), (xb, yb) = pts[i], pts[i + 1]
            new += [pts[i], ((xa + xb) / 2, (ya + yb) / 2 + s.rng.uniform(-a, a))]
        new.append(pts[-1]); pts = new; a *= rough
    if peaks:
        for px, py, w in peaks:
            pts = [(x, yy - max(0, (1 - abs(x - px) / w)) ** 1.6 * (y - py)) for x, yy in pts]
    s.add(f'<path d="{poly(pts + [(x1, bottom), (x0, bottom)])}" fill="{color}" opacity="{op}"/>')
    return pts

def hills(s, y, amp, color, n=6, phase=0, bottom=H + 5, op=1):
    pts = []
    for i in range(n + 1):
        x = -60 + i * (W + 120) / n
        pts.append((x, y + math.sin(i * 1.7 + phase) * amp + s.rng.uniform(-amp * .3, amp * .3)))
    s.add(f'<path d="{smooth(pts, bottom)}" fill="{color}" opacity="{op}"/>')

def sky(s, stops):
    s.add(f'<rect width="{W}" height="{H}" fill="{s.lg(stops)}"/>')

def sun(s, x, y, r, c, glow=None, op=1):
    if glow:
        s.add(f'<circle cx="{x}" cy="{y}" r="{r*3.2}" fill="{s.rg([(0, glow, .55), (1, glow, 0)])}"/>')
    s.add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{op}"/>')

def sun_stripes(s, x, y, r, c, bg, n=4):
    """Sol retrô com faixas horizontais cortando a parte de baixo."""
    s.add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>')
    for i in range(n):
        yy = y + r * (.25 + i * .19); h = 4 + i * 4
        s.add(f'<rect x="{x-r-2}" y="{f(yy)}" width="{2*r+4}" height="{h}" fill="{bg}"/>')

def water(s, y, stops, lines=40, lc='#ffffff', lop=.25, bottom=H):
    s.add(f'<rect x="0" y="{y}" width="{W}" height="{bottom-y}" fill="{s.lg(stops)}"/>')
    for _ in range(lines):
        yy = s.rng.uniform(y + 8, bottom); w = s.rng.uniform(30, 220) * (0.4 + (yy - y) / (bottom - y))
        x = s.rng.uniform(-50, W)
        s.add(f'<rect x="{f(x)}" y="{f(yy)}" width="{f(w)}" height="{f(1.5+(yy-y)/(bottom-y)*3)}" rx="2" fill="{lc}" opacity="{f(lop*s.rng.uniform(.4,1))}"/>')

def reflection(s, x, y, w, c, n=9, op=.5):
    for i in range(n):
        ww = w * (1 - i / n) * s.rng.uniform(.6, 1)
        s.add(f'<rect x="{f(x-ww/2)}" y="{f(y+6+i*14)}" width="{f(ww)}" height="5" rx="2.5" fill="{c}" opacity="{f(op*(1-i/n))}"/>')

def cloud(s, x, y, sc, c, op=.9):
    g = ''.join(f'<ellipse cx="{f(x+dx*sc)}" cy="{f(y+dy*sc)}" rx="{f(rx*sc)}" ry="{f(ry*sc)}"/>' for dx, dy, rx, ry in
                [(0, 0, 90, 28), (-50, 8, 60, 20), (55, 6, 70, 22), (10, -18, 50, 26)])
    s.add(f'<g fill="{c}" opacity="{op}">{g}</g>')

def stars(s, n, ymax, c='#fff'):
    for _ in range(n):
        s.add(f'<circle cx="{f(s.rng.uniform(0,W))}" cy="{f(s.rng.uniform(0,ymax))}" r="{f(s.rng.uniform(.8,2.4))}" fill="{c}" opacity="{f(s.rng.uniform(.3,.95))}"/>')

def birds(s, n, x0, x1, y0, y1, c, sz=1):
    for _ in range(n):
        x, y, k = s.rng.uniform(x0, x1), s.rng.uniform(y0, y1), s.rng.uniform(.6, 1.3) * sz
        s.add(f'<path d="M{f(x-14*k)} {f(y)} Q{f(x-6*k)} {f(y-9*k)} {f(x)} {f(y)} Q{f(x+6*k)} {f(y-9*k)} {f(x+14*k)} {f(y)}" fill="none" stroke="{c}" stroke-width="{f(2.2*k)}" stroke-linecap="round"/>')

def palm(s, x, y, h, c, lean=0.15, fronds=7):
    tx, ty = x + h * lean, y - h
    s.add(f'<path d="M{x-7} {y} Q{f(x+h*lean*.2)} {f(y-h*.5)} {f(tx-3)} {f(ty)} L{f(tx+3)} {f(ty)} Q{f(x+h*lean*.2+10)} {f(y-h*.5)} {x+7} {y}Z" fill="{c}"/>')
    for i in range(fronds):
        a = math.radians(-170 + i * (160 / (fronds - 1)) + s.rng.uniform(-8, 8))
        L = h * s.rng.uniform(.42, .58)
        ex, ey = tx + math.cos(a) * L, ty + math.sin(a) * L * .55 + L * .35
        mx, my = tx + math.cos(a) * L * .5, ty + math.sin(a) * L * .6 - L * .12
        nx, ny = -math.sin(a) * 9, math.cos(a) * 9
        s.add(f'<path d="M{f(tx)} {f(ty)} Q{f(mx+nx)} {f(my+ny-6)} {f(ex)} {f(ey)} Q{f(mx-nx)} {f(my-ny+10)} {f(tx)} {f(ty)}Z" fill="{c}"/>')

def pine(s, x, y, h, c):
    w = h * .38
    s.add(f'<path d="M{f(x)} {f(y-h)} L{f(x+w*.45)} {f(y-h*.55)} L{f(x+w*.25)} {f(y-h*.55)} L{f(x+w*.7)} {f(y-h*.2)} L{f(x+w*.35)} {f(y-h*.2)} L{f(x+w)} {f(y)} L{f(x-w)} {f(y)} L{f(x-w*.35)} {f(y-h*.2)} L{f(x-w*.7)} {f(y-h*.2)} L{f(x-w*.25)} {f(y-h*.55)} L{f(x-w*.45)} {f(y-h*.55)}Z" fill="{c}"/>')

def araucaria(s, x, y, h, c):
    s.add(f'<rect x="{f(x-4)}" y="{f(y-h)}" width="8" height="{f(h)}" fill="{c}"/>')
    top = y - h
    for i in range(4):
        yy = top + i * h * .12; w = h * (.28 + i * .05)
        s.add(f'<path d="M{f(x-w)} {f(yy+8)} Q{f(x)} {f(yy-22)} {f(x+w)} {f(yy+8)} Q{f(x)} {f(yy-6)} {f(x-w)} {f(yy+8)}Z" fill="{c}"/>')

def grain_rect(s, op=.08):
    i = s.id('fl')
    s.defs.append(f'<filter id="{i}"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0"/></filter>')
    s.add(f'<rect width="{W}" height="{H}" filter="url(#{i})" opacity="{op}"/>')

def vignette(s, c='#000', op=.35):
    s.add(f'<rect width="{W}" height="{H}" fill="{s.rg([(0.55, c, 0), (1, c, op)], r=.75)}"/>')

# ---------------------------------------------------------------- marcos
def eiffel(s, x, base, h, c):
    w = h * .36
    L = []
    # silhueta externa (curva)
    for t in [i / 20 for i in range(21)]:
        yy = base - t * h * .92
        ww = w * (1 - t) ** 2.1 + 3
        L.append((x - ww, yy))
    R = [(2 * x - px, py) for px, py in reversed(L)]
    top = [(x, base - h)]
    s.add(f'<path d="{poly(L + top + R)}" fill="{c}"/>')
    # arco da base
    s.add(f'<path d="M{f(x-w*.62)} {base} Q{f(x)} {f(base-h*.26)} {f(x+w*.62)} {base}Z" fill="{s.cur_bg}"/>')
    # plataformas
    for t, e in [(.28, 1.15), (.56, 1.3)]:
        yy = base - t * h; ww = w * (1 - t) ** 2.1 + 3
        s.add(f'<rect x="{f(x-ww*e)}" y="{f(yy-6)}" width="{f(2*ww*e)}" height="10" fill="{c}"/>')
    # janelas entre plataformas (treliça sugerida)
    for t0, t1 in [(.3, .54), (.58, .8)]:
        for k in range(3):
            a = t0 + (t1 - t0) * (k + .2) / 3; b = t0 + (t1 - t0) * (k + .8) / 3
            wa = (w * (1 - a) ** 2.1) * .45; wb = (w * (1 - b) ** 2.1) * .45
            s.add(f'<path d="{poly([(x-wa, base-a*h), (x, base-(a+b)/2*h), (x-wb, base-b*h)])}" fill="{s.cur_bg}" opacity=".55"/>')
            s.add(f'<path d="{poly([(x+wa, base-a*h), (x, base-(a+b)/2*h), (x+wb, base-b*h)])}" fill="{s.cur_bg}" opacity=".55"/>')
    s.add(f'<rect x="{f(x-1.5)}" y="{f(base-h-30)}" width="3" height="32" fill="{c}"/>')

def pagoda(s, x, base, h, c, tiers=5):
    th = h / (tiers + 1.2)
    s.add(f'<rect x="{f(x-h*.09)}" y="{f(base-h)}" width="{f(h*.18)}" height="{f(h)}" fill="{c}"/>')
    for i in range(tiers):
        yy = base - th * (i + 1); w = h * (.36 - i * .045)
        s.add(f'<path d="M{f(x-w)} {f(yy)} Q{f(x-w*.6)} {f(yy-th*.18)} {f(x-w*.35)} {f(yy-th*.28)} L{f(x+w*.35)} {f(yy-th*.28)} Q{f(x+w*.6)} {f(yy-th*.18)} {f(x+w)} {f(yy)} L{f(x+w*.8)} {f(yy+5)} L{f(x-w*.8)} {f(yy+5)}Z" fill="{c}"/>')
    s.add(f'<rect x="{f(x-2)}" y="{f(base-h-th*1.1)}" width="4" height="{f(th*1.3)}" fill="{c}"/>')

def torii(s, x, base, h, c):
    w = h * .9
    s.add(f'<rect x="{f(x-w*.36)}" y="{f(base-h)}" width="{f(h*.07)}" height="{f(h)}" fill="{c}"/>')
    s.add(f'<rect x="{f(x+w*.36-h*.07)}" y="{f(base-h)}" width="{f(h*.07)}" height="{f(h)}" fill="{c}"/>')
    s.add(f'<rect x="{f(x-w*.46)}" y="{f(base-h*.78)}" width="{f(w*.92)}" height="{f(h*.06)}" fill="{c}"/>')
    s.add(f'<path d="M{f(x-w*.6)} {f(base-h*1.02)} Q{f(x)} {f(base-h*.9)} {f(x+w*.6)} {f(base-h*1.02)} L{f(x+w*.52)} {f(base-h*.9)} Q{f(x)} {f(base-h*.84)} {f(x-w*.52)} {f(base-h*.9)}Z" fill="{c}"/>')

def skyline(s, base, c, win=None, x0=0, x1=W, hmin=120, hmax=420, spire_at=None):
    x = x0
    while x < x1:
        w = s.rng.uniform(40, 110); h = s.rng.uniform(hmin, hmax)
        if spire_at and abs(x + w / 2 - spire_at) < 60: x += w; continue
        s.add(f'<rect x="{f(x)}" y="{f(base-h)}" width="{f(w+1)}" height="{f(h)}" fill="{c}"/>')
        if s.rng.random() < .35:
            s.add(f'<rect x="{f(x+w*.25)}" y="{f(base-h-h*.12)}" width="{f(w*.5)}" height="{f(h*.12+1)}" fill="{c}"/>')
        if win:
            for yy in range(int(base - h + 14), int(base - 10), 18):
                for xx in range(int(x + 8), int(x + w - 8), 14):
                    if s.rng.random() < .28:
                        s.add(f'<rect x="{xx}" y="{yy}" width="5" height="8" fill="{win}" opacity="{f(s.rng.uniform(.5,1))}"/>')
        x += w + s.rng.uniform(0, 6)
    if spire_at:
        x = spire_at; h = hmax * 1.55
        s.add(f'<path d="{poly([(x-46, base), (x-46, base-h*.55), (x-34, base-h*.6), (x-34, base-h*.72), (x-22, base-h*.76), (x-22, base-h*.84), (x-10, base-h*.87), (x-4, base-h*.95), (x-1.5, base-h), (x+1.5, base-h), (x+4, base-h*.95), (x+10, base-h*.87), (x+22, base-h*.84), (x+22, base-h*.76), (x+34, base-h*.72), (x+34, base-h*.6), (x+46, base-h*.55), (x+46, base)])}" fill="{c}"/>')
        if win:
            for yy in range(int(base - h * .52), int(base - 10), 20):
                for xx in range(int(x - 38), int(x + 38), 13):
                    if s.rng.random() < .35:
                        s.add(f'<rect x="{xx}" y="{yy}" width="5" height="9" fill="{win}" opacity=".85"/>')

def white_village(s, cliff_pts, c_wall, c_dome, c_shadow, n=40, xmin=0, xmax=W):
    def top_at(x):
        for (xa, ya), (xb, yb) in zip(cliff_pts, cliff_pts[1:]):
            if xa <= x <= xb: return ya + (yb - ya) * (x - xa) / (xb - xa)
        return cliff_pts[-1][1]
    items = []
    for _ in range(n):
        x = s.rng.uniform(xmin, xmax); t = top_at(x)
        y = t + s.rng.uniform(4, 180); w = s.rng.uniform(40, 90); h = s.rng.uniform(34, 60)
        items.append((y, x, w, h))
    for y, x, w, h in sorted(items):
        s.add(f'<rect x="{f(x)}" y="{f(y-h)}" width="{f(w)}" height="{f(h)}" fill="{c_wall}"/>')
        s.add(f'<rect x="{f(x+w-10)}" y="{f(y-h)}" width="10" height="{f(h)}" fill="{c_shadow}"/>')
        r = s.rng.random()
        if r < .18:
            s.add(f'<path d="M{f(x+w*.15)} {f(y-h)} A{f(w*.35)} {f(w*.35)} 0 0 1 {f(x+w*.85)} {f(y-h)}Z" fill="{c_dome}"/>')
            s.add(f'<rect x="{f(x+w*.5-1.5)}" y="{f(y-h-w*.35-16)}" width="3" height="16" fill="{c_wall}"/>')
        elif r < .5:
            s.add(f'<rect x="{f(x+w*.3)}" y="{f(y-h*.6)}" width="{f(w*.22)}" height="{f(h*.35)}" rx="{f(w*.11)}" fill="{c_dome}"/>')
        else:
            s.add(f'<rect x="{f(x+w*.25)}" y="{f(y-h*.55)}" width="{f(w*.16)}" height="{f(h*.22)}" fill="{c_shadow}"/>')

def pyramid(s, x, base, w, h, c_light, c_dark):
    s.add(f'<path d="{poly([(x-w/2, base), (x, base-h), (x+w*.08, base)])}" fill="{c_light}"/>')
    s.add(f'<path d="{poly([(x+w*.08, base), (x, base-h), (x+w/2, base)])}" fill="{c_dark}"/>')

def step_pyramid(s, x, base, w, h, c, c2, steps=9):
    sh = h / (steps + 1.5)
    for i in range(steps):
        ww = w * (1 - i / steps * .72)
        s.add(f'<rect x="{f(x-ww/2)}" y="{f(base-sh*(i+1))}" width="{f(ww)}" height="{f(sh+1)}" fill="{c if i%2==0 else c2}"/>')
    tw = w * .2
    s.add(f'<rect x="{f(x-tw/2)}" y="{f(base-sh*(steps+1.5))}" width="{f(tw)}" height="{f(sh*1.6)}" fill="{c2}"/>')
    s.add(f'<rect x="{f(x-tw*.18)}" y="{f(base-sh*(steps+1.1))}" width="{f(tw*.36)}" height="{f(sh*1.1)}" fill="{s.cur_bg}" opacity=".7"/>')
    s.add(f'<path d="{poly([(x-w*.07, base), (x-w*.07*.4, base-sh*steps), (x+w*.07*.4, base-sh*steps), (x+w*.07, base)])}" fill="{c2}"/>')

def bungalows(s, y, n, x0, x1, c_roof, c_wall, c_post):
    step = (x1 - x0) / n
    s.add(f'<rect x="{x0}" y="{f(y-4)}" width="{x1-x0}" height="8" fill="{c_post}"/>')
    for i in range(n):
        x = x0 + i * step + step * .2; w = step * .6
        for px in [x + 4, x + w - 8]:
            s.add(f'<rect x="{f(px)}" y="{f(y)}" width="4" height="46" fill="{c_post}"/>')
        s.add(f'<rect x="{f(x)}" y="{f(y-40)}" width="{f(w)}" height="40" fill="{c_wall}"/>')
        s.add(f'<rect x="{f(x+w*.3)}" y="{f(y-28)}" width="{f(w*.4)}" height="28" fill="{c_post}" opacity=".6"/>')
        s.add(f'<path d="{poly([(x-14, y-38), (x+w/2, y-86), (x+w+14, y-38)])}" fill="{c_roof}"/>')
        s.add(f'<rect x="{f(x-4)}" y="{f(y+46)}" width="{f(w+8)}" height="4" fill="#ffffff" opacity=".35"/>')

def ship(s, x, base, L, c_hull, c_deck, c_line, c_funnel, win='#ffe9b0'):
    """Navio de cruzeiro visto de lado, proa à direita."""
    h = L * .11
    hull = [(x, base - h), (x + L * .93, base - h), (x + L, base - h * 1.35), (x + L * .9, base), (x + L * .06, base), (x - L * .01, base - h * .6)]
    decks = []
    for i, (a, b) in enumerate([(.04, .86), (.07, .82), (.11, .76), (.16, .68), (.24, .56)]):
        dh = h * .42
        y = base - h - dh * (i + 1)
        s.add(f'<path d="{poly([(x+L*a, y+dh), (x+L*a+6, y), (x+L*b-4, y), (x+L*b+dh*.8, y+dh)])}" fill="{c_deck}"/>')
        for k in range(int((b - a) * L / 16)):
            xx = x + L * a + 12 + k * 16
            if s.rng.random() < .8:
                s.add(f'<rect x="{f(xx)}" y="{f(y+dh*.35)}" width="7" height="{f(dh*.35)}" rx="1.5" fill="{win}" opacity="{f(s.rng.uniform(.55,1))}"/>')
    ytop = base - h - h * .42 * 5
    s.add(f'<path d="{poly([(x+L*.3, ytop), (x+L*.33, ytop-h*.9), (x+L*.41, ytop-h*.9), (x+L*.43, ytop)])}" fill="{c_funnel}"/>')
    s.add(f'<rect x="{f(x+L*.325)}" y="{f(ytop-h*.72)}" width="{f(L*.1)}" height="{f(h*.18)}" fill="{c_line}"/>')
    s.add(f'<path d="{poly(hull)}" fill="{c_hull}"/>')
    s.add(f'<rect x="{f(x+L*.05)}" y="{f(base-h*.62)}" width="{f(L*.88)}" height="{f(h*.12)}" fill="{c_line}"/>')
    for k in range(int(L * .85 / 22)):
        s.add(f'<circle cx="{f(x+L*.08+k*22)}" cy="{f(base-h*.8)}" r="3" fill="{win}" opacity=".7"/>')

def sailboat(s, x, y, sc, c_sail, c_hull):
    s.add(f'<path d="{poly([(x, y-80*sc), (x, y-6*sc), (x+42*sc, y-6*sc)])}" fill="{c_sail}"/>')
    s.add(f'<path d="{poly([(x-3*sc, y-70*sc), (x-3*sc, y-8*sc), (x-30*sc, y-8*sc)])}" fill="{c_sail}" opacity=".8"/>')
    s.add(f'<path d="{poly([(x-34*sc, y-3*sc), (x+48*sc, y-3*sc), (x+38*sc, y+6*sc), (x-26*sc, y+6*sc)])}" fill="{c_hull}"/>')

def chalet(s, x, base, w, c_wall, c_roof, c_win):
    h = w * .55
    s.add(f'<rect x="{f(x)}" y="{f(base-h)}" width="{f(w)}" height="{f(h)}" fill="{c_wall}"/>')
    s.add(f'<path d="{poly([(x-w*.12, base-h+4), (x+w/2, base-h-w*.62), (x+w*1.12, base-h+4)])}" fill="{c_roof}"/>')
    for i in range(3):
        s.add(f'<rect x="{f(x+w*(.14+i*.26))}" y="{f(base-h*.72)}" width="{f(w*.16)}" height="{f(h*.3)}" fill="{c_win}"/>')
    s.add(f'<rect x="{f(x+w*.42)}" y="{f(base-h-w*.34)}" width="{f(w*.16)}" height="{f(w*.16)}" fill="{c_win}"/>')

def arch_rock(s, x, base, w, h, c):
    s.add(f'<path d="M{f(x)} {base} C{f(x-10)} {f(base-h*.6)} {f(x+w*.2)} {f(base-h)} {f(x+w*.55)} {f(base-h*.98)} C{f(x+w*.9)} {f(base-h*.95)} {f(x+w*1.05)} {f(base-h*.5)} {f(x+w)} {base} L{f(x+w*.78)} {base} C{f(x+w*.8)} {f(base-h*.45)} {f(x+w*.6)} {f(base-h*.62)} {f(x+w*.45)} {f(base-h*.6)} C{f(x+w*.3)} {f(base-h*.58)} {f(x+w*.22)} {f(base-h*.4)} {f(x+w*.24)} {base}Z" fill="{c}"/>')

def suspension_bridge(s, x0, x1, y, tower_h, c):
    tw = [x0 + (x1 - x0) * .25, x0 + (x1 - x0) * .75]
    s.add(f'<rect x="{x0}" y="{y}" width="{x1-x0}" height="10" fill="{c}"/>')
    for t in tw:
        s.add(f'<rect x="{f(t-9)}" y="{f(y-tower_h)}" width="18" height="{f(tower_h+60)}" fill="{c}"/>')
        s.add(f'<rect x="{f(t-14)}" y="{f(y-tower_h*.5)}" width="28" height="6" fill="{c}"/>')
    a, b = tw
    s.add(f'<path d="M{x0} {y} Q{f((x0+a)/2)} {f(y-tower_h*.35)} {f(a)} {f(y-tower_h)} Q{f((a+b)/2)} {f(y+tower_h*.1)} {f(b)} {f(y-tower_h)} Q{f((b+x1)/2)} {f(y-tower_h*.35)} {x1} {y}" fill="none" stroke="{c}" stroke-width="4"/>')

# ---------------------------------------------------------------- cenas
def sc_noronha():
    s = S('noronha', 11); s.cur_bg = '#fff'
    sky(s, [(0, '#f7c98b'), (.45, '#f9a77a'), (1, '#f38a74')])
    sun(s, 1080, 470, 70, '#fff1c9', '#ffd79a')
    cloud(s, 380, 210, 1.3, '#ffe2c4', .6); cloud(s, 1300, 150, .9, '#ffe2c4', .5)
    # Morro do Pico
    s.add('<path d="M520 640 C560 560 600 520 640 420 C660 360 680 300 705 270 C730 300 742 360 760 430 C790 520 850 580 930 640Z" fill="#6b4a6e"/>')
    hills(s, 620, 22, '#8a5a78', n=5)
    # Dois Irmãos
    s.add('<path d="M1060 660 C1080 600 1110 560 1150 555 C1185 560 1200 610 1210 640 C1225 600 1250 575 1285 578 C1320 585 1345 630 1360 660Z" fill="#4f3a63"/>')
    water(s, 640, [(0, '#39b4c6'), (1, '#0f6f8f')], 60, '#e8fbff', .35)
    reflection(s, 1080, 640, 220, '#fff1c9', 10, .55)
    s.add(f'<path d="{smooth([(-50,860),(300,820),(700,850),(1000,835),(1650,870)], H+5)}" fill="#f1d3a7"/>')
    s.add(f'<path d="{smooth([(-50,900),(400,880),(900,905),(1650,890)], H+5)}" fill="#e7c192"/>')
    palm(s, 170, 900, 330, '#2e2a45', .22); palm(s, 1450, 910, 290, '#2e2a45', -.25)
    birds(s, 5, 820, 1250, 260, 380, '#6b3b5e', 1.1)
    return s

def sc_gramado():
    s = S('gramado', 5); s.cur_bg = '#fff'
    sky(s, [(0, '#1d2447'), (.6, '#3b3f78'), (1, '#8a7fb8')])
    stars(s, 90, 450)
    sun(s, 1250, 190, 46, '#fff6de', '#c9c3ff', .95)
    ridge(s, 560, 90, '#4a4f86', .5)
    ridge(s, 650, 60, '#343a6b', .55)
    for i in range(22):
        x = s.rng.uniform(-20, W + 20); araucaria(s, x, s.rng.uniform(700, 760), s.rng.uniform(110, 190), '#232849')
    hills(s, 780, 16, '#eef0ff', n=5)
    chalet(s, 640, 860, 240, '#7a3b35', '#2a2d52', '#ffd27a')
    chalet(s, 930, 880, 170, '#8c4a3f', '#2a2d52', '#ffd27a')
    for x in [120, 260, 420, 1150, 1310, 1480]:
        pine(s, x, 900 + s.rng.uniform(-10, 20), s.rng.uniform(170, 240), '#1a1f3d')
    s.add(f'<path d="{smooth([(-50,900),(500,885),(1100,905),(1650,888)], H+5)}" fill="#f4f5ff"/>')
    for _ in range(140):
        s.add(f'<circle cx="{f(s.rng.uniform(0,W))}" cy="{f(s.rng.uniform(0,H))}" r="{f(s.rng.uniform(1,3))}" fill="#fff" opacity="{f(s.rng.uniform(.3,.8))}"/>')
    return s

def sc_jeri():
    s = S('jeri', 8); s.cur_bg = '#fff'
    sky(s, [(0, '#ffcf70'), (.55, '#ff9a5a'), (1, '#f46a55')])
    sun_stripes(s, 800, 560, 150, '#fff0b5', '#ff9a5a')
    water(s, 600, [(0, '#f08a63'), (1, '#b8515a')], 40, '#ffd9a0', .4)
    reflection(s, 800, 600, 300, '#fff0b5', 11, .6)
    arch_rock(s, 1080, 700, 240, 190, '#5a2f3f')
    s.add(f'<path d="{smooth([(-60,760),(250,690),(520,740),(800,780),(1200,730),(1660,780)], H+5)}" fill="#f7c48a"/>')
    s.add(f'<path d="{smooth([(-60,850),(350,800),(750,860),(1100,830),(1660,860)], H+5)}" fill="#eaa86f"/>')
    s.add(f'<path d="{smooth([(-60,930),(500,910),(1000,940),(1660,915)], H+5)}" fill="#d98f5c"/>')
    palm(s, 250, 830, 300, '#3a1f2e', .3); palm(s, 330, 850, 230, '#3a1f2e', -.1)
    birds(s, 6, 420, 700, 300, 420, '#7a2f3a', 1)
    return s

def sc_bonito():
    s = S('bonito', 4); s.cur_bg = '#fff'
    sky(s, [(0, '#cfeee0'), (1, '#9fd8c4')])
    ridge(s, 330, 50, '#4f9a78', .5)
    ridge(s, 400, 40, '#2f7a5b', .5)
    # cachoeira
    s.add('<path d="M720 400 C730 470 700 560 715 640 L905 640 C890 560 880 470 880 400Z" fill="#e9fbff"/>')
    for i in range(10):
        x = 735 + i * 15
        s.add(f'<rect x="{x}" y="420" width="3" height="{s.rng.randint(120,220)}" fill="#b8e7f0" opacity=".8"/>')
    for x in [80, 200, 330, 460, 590, 1000, 1130, 1260, 1390, 1520]:
        s.add(f'<ellipse cx="{x}" cy="{s.rng.randint(440,520)}" rx="{s.rng.randint(70,110)}" ry="{s.rng.randint(90,140)}" fill="#1f5e45"/>')
    # água transparente com peixes e plantas
    water(s, 620, [(0, '#57d0d6'), (.5, '#1ea7b3'), (1, '#0c6b7c')], 20, '#ffffff', .3)
    for _ in range(18):
        x = s.rng.uniform(0, W); hh = s.rng.uniform(80, 220)
        s.add(f'<path d="M{f(x)} {H} Q{f(x+s.rng.uniform(-40,40))} {f(H-hh/2)} {f(x+s.rng.uniform(-20,20))} {f(H-hh)}" stroke="#0e5a4c" stroke-width="{s.rng.randint(5,10)}" fill="none" stroke-linecap="round"/>')
    for _ in range(12):
        x, y, k = s.rng.uniform(100, 1500), s.rng.uniform(720, 930), s.rng.uniform(.8, 1.6)
        s.add(f'<path d="M{f(x)} {f(y)} q{f(30*k)} {f(-18*k)} {f(60*k)} 0 q{f(-30*k)} {f(18*k)} {f(-60*k)} 0z M{f(x+56*k)} {f(y)} l{f(16*k)} {f(-10*k)} l0 {f(20*k)}z" fill="#f2a33c"/>')
    s.add('<rect x="0" y="620" width="1600" height="6" fill="#ffffff" opacity=".5"/>')
    return s

def sc_lencois():
    s = S('lencois', 2); s.cur_bg = '#fff'
    sky(s, [(0, '#5ec2e8'), (1, '#c9efff')])
    sun(s, 300, 180, 60, '#fffbe6', '#ffffff')
    cloud(s, 1100, 200, 1.4, '#ffffff', .9); cloud(s, 650, 120, .9, '#ffffff', .8)
    layers = [(520, '#f6efe2', 40), (600, '#ece2cf', 50), (700, '#fbf6ec', 60), (820, '#efe6d3', 70)]
    for i, (y, c, a) in enumerate(layers):
        pts = [(-60 + k * 180, y + math.sin(k * 1.3 + i) * a) for k in range(11)]
        s.add(f'<path d="{smooth(pts, H+5)}" fill="{c}"/>')
        if i in (0, 1, 2):
            for _ in range(2 + i):
                x = s.rng.uniform(100, 1500); yy = y + s.rng.uniform(40, 90)
                s.add(f'<ellipse cx="{f(x)}" cy="{f(yy)}" rx="{s.rng.randint(90,220)}" ry="{s.rng.randint(14,26)}" fill="{"#2fc4cf" if s.rng.random()<.5 else "#1a9fc0"}"/>')
                s.add(f'<ellipse cx="{f(x-20)}" cy="{f(yy-4)}" rx="{s.rng.randint(40,90)}" ry="5" fill="#bff5f5" opacity=".7"/>')
    return s

def sc_paris():
    s = S('paris', 3); s.cur_bg = '#f6d7c3'
    sky(s, [(0, '#f6c9b5'), (.6, '#f6d7c3'), (1, '#f3e3d3')])
    sun(s, 520, 330, 110, '#fbe4c8', '#ffffff', .9)
    cloud(s, 1200, 240, 1.2, '#fff5ec', .7)
    skyline(s, 800, '#c9a3a6', None, 0, W, 60, 150)
    s.add('<path d="M1080 800 L1080 700 Q1130 620 1180 700 L1180 800Z" fill="#b88c93"/>')  # cúpula
    eiffel(s, 800, 820, 640, '#3d2b4a')
    s.add(f'<path d="{smooth([(-50,790),(400,800),(800,790),(1200,805),(1650,790)], H+5)}" fill="#8aa37d"/>')
    for x in range(-20, W + 40, 70):
        s.add(f'<ellipse cx="{x}" cy="{800 + s.rng.randint(-4,6)}" rx="46" ry="30" fill="#6f8c6a"/>')
    water(s, 840, [(0, '#8fa9c2'), (1, '#5d7a99')], 30, '#fff', .35)
    s.add('<rect x="0" y="830" width="1600" height="14" fill="#c8b09a"/>')
    for x in [150, 1350]:
        s.add(f'<rect x="{x}" y="740" width="6" height="92" fill="#3d2b4a"/><circle cx="{x+3}" cy="736" r="10" fill="#ffe3a3"/>')
    return s

def sc_santorini():
    s = S('santori', 9); s.cur_bg = '#fff'
    sky(s, [(0, '#8fd0ef'), (1, '#e9f7ff')])
    sun(s, 1300, 170, 64, '#fffdf0', '#ffffff')
    water(s, 560, [(0, '#2a7bc0'), (1, '#0d3f7a')], 50, '#cfe9ff', .35)
    s.add('<path d="M1150 560 C1200 520 1300 505 1400 530 C1460 545 1500 560 1520 560Z" fill="#8b6b73" opacity=".7"/>')
    pts = [(-40, 420), (150, 400), (320, 440), (520, 470), (700, 530), (820, 600), (900, 700), (940, 1010), (-40, 1010)]
    s.add(f'<path d="{smooth(pts)}" fill="#a0685a"/>')
    s.add(f'<path d="{smooth([(-40,470),(200,460),(420,500),(640,560),(760,640),(830,760),(860,1010),(-40,1010)])}" fill="#8a5647"/>')
    white_village(s, [(-40, 430), (200, 410), (420, 460), (640, 520), (800, 620)], '#ffffff', '#1f5fb4', '#dfe8f3', 60, -20, 760)
    sailboat(s, 1150, 780, 1.1, '#ffffff', '#1d3557')
    birds(s, 4, 900, 1200, 250, 350, '#ffffff', 1)
    return s

def sc_japao():
    s = S('japao', 7); s.cur_bg = '#fff'
    sky(s, [(0, '#f8d8d4'), (.6, '#fbe9e1'), (1, '#fff6ee')])
    sun(s, 800, 330, 120, '#e8434a')
    s.add('<path d="M280 700 C480 620 640 420 740 330 C770 305 830 305 860 330 C960 420 1120 620 1320 700Z" fill="#6c7fa8"/>')
    s.add('<path d="M740 330 C770 305 830 305 860 330 C900 368 920 390 940 412 C910 400 895 425 870 405 C850 430 830 405 810 425 C790 400 770 430 750 405 C725 425 700 400 665 412 C690 385 710 360 740 330Z" fill="#ffffff"/>')
    ridge(s, 700, 40, '#4b5b86', .5)
    water(s, 760, [(0, '#8fa7c9'), (1, '#5a6f99')], 30, '#fff', .35)
    pagoda(s, 1260, 790, 380, '#2a2438')
    torii(s, 380, 830, 200, '#c8323a')
    s.add(f'<path d="{smooth([(-40,800),(300,790),(600,815),(1000,800),(1640,790)], H+5)}" fill="#3a3346"/>')
    # galhos de cerejeira
    s.add('<path d="M-20 90 C150 120 260 170 380 150 C470 135 520 180 600 170" fill="none" stroke="#3a2a33" stroke-width="12" stroke-linecap="round"/>')
    s.add('<path d="M200 130 C240 190 300 220 330 260" fill="none" stroke="#3a2a33" stroke-width="7" stroke-linecap="round"/>')
    for _ in range(170):
        x = s.rng.uniform(-20, 640); y = 150 + math.sin(x / 120) * 20 + s.rng.gauss(0, 45)
        s.add(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(s.rng.uniform(5,13))}" fill="{s.rng.choice(["#f7b6c6","#f4a0b5","#fbd3dc","#ffffff"])}" opacity=".95"/>')
    for _ in range(30):
        s.add(f'<ellipse cx="{f(s.rng.uniform(0,W))}" cy="{f(s.rng.uniform(250,950))}" rx="6" ry="3.5" fill="#f4a0b5" opacity=".8" transform="rotate({s.rng.randint(0,180)})" />')
    return s

def sc_ny():
    s = S('ny', 12); s.cur_bg = '#fff'
    sky(s, [(0, '#0f1a3d'), (.55, '#3a3f86'), (1, '#e0808a')])
    stars(s, 60, 380)
    sun(s, 1320, 180, 44, '#fff5d8', '#ffffff', .9)
    skyline(s, 760, '#343a79', None, 0, W, 90, 260)
    skyline(s, 780, '#1b1f4a', '#ffd88a', 0, W, 140, 360, spire_at=620)
    water(s, 780, [(0, '#232a63'), (1, '#0c1030')], 50, '#ffd88a', .3)
    reflection(s, 620, 780, 120, '#ffd88a', 10, .4)
    suspension_bridge(s, 950, 1650, 820, 170, '#0b0e2a')
    return s

def sc_lisboa():
    s = S('lisboa', 21); s.cur_bg = '#fff'
    sky(s, [(0, '#8fc6e8'), (1, '#fde9cf')])
    sun(s, 300, 200, 58, '#fff6d8', '#ffffff')
    water(s, 600, [(0, '#5a9cc4'), (1, '#2d6a93')], 40, '#fff', .35)
    suspension_bridge(s, 700, 1700, 600, 200, '#c8412f')
    for row, (y0, h0) in enumerate([(640, 60), (720, 70), (810, 80)]):
        x = -20
        while x < W:
            w = s.rng.uniform(70, 120); h = h0 + s.rng.uniform(-10, 30); y = y0 + s.rng.uniform(-10, 10) + row * 6
            col = s.rng.choice(['#f7e6c4', '#f2c6a0', '#fbf3e6', '#e9b58a', '#f4d98b', '#bcd6e8'])
            s.add(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h+200)}" fill="{col}"/>')
            s.add(f'<path d="{poly([(x-4, y), (x+w/2, y-26), (x+w+4, y)])}" fill="#c9562f"/>')
            for k in range(int(w // 26)):
                s.add(f'<rect x="{f(x+10+k*26)}" y="{f(y+14)}" width="12" height="18" fill="#2c4a6b" opacity=".75"/>')
            x += w + 2
    # elétrico
    s.add('<rect x="560" y="880" width="360" height="130" rx="18" fill="#f2c230"/><rect x="560" y="960" width="360" height="16" fill="#c9562f"/>')
    for k in range(5):
        s.add(f'<rect x="{584+k*66}" y="898" width="46" height="46" rx="6" fill="#2c4a6b"/>')
    s.add('<line x1="740" y1="880" x2="700" y2="800" stroke="#333" stroke-width="4"/><line x1="0" y1="800" x2="1600" y2="790" stroke="#333" stroke-width="2"/>')
    return s

def sc_patagonia():
    s = S('patag', 14); s.cur_bg = '#fff'
    sky(s, [(0, '#7fb2dc'), (1, '#e6f1fa')])
    cloud(s, 1200, 170, 1.2, '#ffffff', .85)
    ridge(s, 520, 60, '#9fb5cc', .5, peaks=[(760, 170, 230), (640, 260, 120), (900, 250, 140)])
    ridge(s, 560, 50, '#6f88a6', .55, peaks=[(420, 330, 200), (1200, 300, 260)])
    # neve
    s.add('<path d="M760 176 L728 226 L744 220 L756 236 L768 218 L782 228 L794 222Z" fill="#ffffff"/>')
    # geleira
    s.add('<path d="M-40 640 C200 560 420 560 640 600 L640 700 L-40 700Z" fill="#dff3ff"/>')
    s.add('<path d="M-40 650 L640 610 L640 700 L-40 700Z" fill="#a9dcf5"/>')
    for i in range(30):
        x = s.rng.uniform(-40, 640)
        s.add(f'<rect x="{f(x)}" y="{f(620+s.rng.uniform(0,30))}" width="{s.rng.randint(4,12)}" height="{s.rng.randint(30,60)}" fill="#7cc6ea" opacity=".6"/>')
    water(s, 690, [(0, '#5b9fc3'), (1, '#2b5f86')], 40, '#dff3ff', .35)
    for x, y in [(820, 760), (1100, 820), (980, 700)]:
        s.add(f'<path d="{poly([(x-40, y), (x-24, y-30), (x+10, y-38), (x+46, y)])}" fill="#e6f7ff"/><path d="{poly([(x-40, y), (x+46, y), (x+30, y+14), (x-26, y+12)])}" fill="#9bd6f1" opacity=".7"/>')
    s.add(f'<path d="{smooth([(1100,1010),(1250,860),(1450,830),(1650,860)], H+5)}" fill="#3e4e3a"/>')
    return s

def sc_maldivas():
    s = S('maldiv', 6); s.cur_bg = '#fff'
    sky(s, [(0, '#ffb58a'), (.5, '#ffd3a3'), (1, '#ffe9c8')])
    sun(s, 1180, 470, 90, '#fff4d6', '#ffe0b0')
    water(s, 540, [(0, '#8fe0da'), (.5, '#3cc1c7'), (1, '#0d8ea5')], 60, '#ffffff', .35)
    reflection(s, 1180, 540, 260, '#fff4d6', 9, .5)
    bungalows(s, 560, 6, 60, 1000, '#b0703f', '#f5e3c4', '#5c3a26')
    s.add('<path d="M1100 700 C1250 640 1450 650 1650 700 L1650 1010 L1100 1010Z" fill="#fbe7c2"/>')
    palm(s, 1350, 720, 280, '#3d2f2a', -.2); palm(s, 1480, 740, 230, '#3d2f2a', .2)
    for _ in range(12):
        x, y = s.rng.uniform(100, 1000), s.rng.uniform(760, 960)
        s.add(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{s.rng.randint(60,140)}" ry="{s.rng.randint(8,16)}" fill="#bff3ee" opacity=".45"/>')
    return s

def sc_cancun():
    s = S('cancun', 13); s.cur_bg = '#ffe8c2'
    sky(s, [(0, '#40b6d8'), (1, '#bfeaf2')])
    sun(s, 250, 170, 60, '#fff9dc', '#ffffff')
    cloud(s, 1250, 190, 1.1, '#fff', .9)
    water(s, 560, [(0, '#1fb3c2'), (1, '#0b6f94')], 50, '#e9ffff', .35)
    s.add(f'<path d="{smooth([(-40,640),(400,600),(900,630),(1300,600),(1650,640)], H+5)}" fill="#6f9a5c"/>')
    step_pyramid(s, 980, 650, 520, 330, '#c9a37a', '#a9825e')
    s.add(f'<path d="{smooth([(-40,760),(500,740),(1000,780),(1650,750)], H+5)}" fill="#f7e2b8"/>')
    palm(s, 200, 800, 320, '#1e4b3a', .25); palm(s, 1450, 820, 300, '#1e4b3a', -.2)
    return s

def sc_egito():
    s = S('egito', 15); s.cur_bg = '#fff'
    sky(s, [(0, '#f6a34f'), (.6, '#fbc977'), (1, '#fde3a8')])
    sun(s, 1150, 360, 110, '#fff2c8', '#fff0b0')
    pyramid(s, 620, 700, 620, 390, '#e0a55d', '#b8783f')
    pyramid(s, 1020, 700, 440, 270, '#e0a55d', '#b8783f')
    pyramid(s, 1270, 700, 250, 150, '#e0a55d', '#b8783f')
    s.add(f'<path d="{smooth([(-40,700),(300,680),(700,705),(1100,690),(1650,700)], H+5)}" fill="#f2c27f"/>')
    s.add(f'<path d="{smooth([(-40,780),(500,760),(1000,790),(1650,770)], H+5)}" fill="#e7ad68"/>')
    water(s, 860, [(0, '#3d7fa0'), (1, '#1d4d6b')], 30, '#ffe3a3', .4)
    for x in [80, 170, 1430, 1520]:
        palm(s, x, 870, s.rng.randint(230, 300), '#3a2a1f', s.rng.choice([-.2, .2]))
    # feluca
    s.add('<path d="M700 935 L940 935 L910 960 L730 960Z" fill="#3a2a1f"/><path d="M820 935 L820 760 L700 925Z" fill="#fff6e3"/>')
    birds(s, 5, 500, 900, 200, 320, '#7a3f1f', 1)
    return s

def sc_rio():
    s = S('rio', 31); s.cur_bg = '#fff'
    sky(s, [(0, '#1b2156'), (.5, '#6b3f7a'), (.8, '#e0745f'), (1, '#f7b26b')])
    stars(s, 50, 300)
    sun(s, 980, 610, 120, '#ffd89a', '#ffb070')
    ridge(s, 560, 60, '#4b2e63', .5)
    s.add('<path d="M260 640 C300 560 360 520 420 510 C470 505 500 560 520 640Z" fill="#3a2150"/>')  # Urca
    s.add('<path d="M560 640 C580 520 610 380 660 330 C700 300 740 340 760 420 C780 500 800 580 840 640Z" fill="#2c1a45"/>')  # Pão de Açúcar
    s.add('<path d="M430 512 L660 334" stroke="#1a0f2c" stroke-width="2"/><rect x="540" y="418" width="16" height="12" rx="2" fill="#ffd89a"/>')
    water(s, 630, [(0, '#b3587a'), (1, '#1b2156')], 70, '#ffd89a', .35)
    reflection(s, 980, 630, 320, '#ffd89a', 12, .55)
    sailboat(s, 1200, 760, 1.0, '#fff3e0', '#1b1330')
    sailboat(s, 330, 820, .8, '#fff3e0', '#1b1330')
    return s

def cruise_scene(name, seed, skyc, sunpos, bgfn, seac, hull='#ffffff', deck='#f3f5fb', line='#1f3b8f', funnel='#e03c3c', win='#ffe9b0', sx=260, sL=1100):
    s = S(name, seed); s.cur_bg = '#fff'
    sky(s, skyc)
    if sunpos: sun(s, *sunpos)
    bgfn(s)
    water(s, 640, seac, 60, '#ffffff', .3)
    ship(s, sx, 760, sL, hull, deck, line, funnel, win)
    s.add(f'<path d="M{sx} 760 Q{sx+sL*.4} 790 {sx+sL} 762" stroke="#ffffff" stroke-width="6" opacity=".35" fill="none"/>')
    s.add(f'<path d="M{sx+sL-20} 760 q60 10 160 -6 q-60 20 -150 22z" fill="#ffffff" opacity=".6"/>')
    return s

def bg_med(s):
    ridge(s, 520, 60, '#c79a8a', .5)
    white_village(s, [(900, 560), (1650, 540)], '#fff6ec', '#e0773f', '#ecd9c6', 26, 880, 1600)
    s.add('<rect x="0" y="600" width="1600" height="40" fill="#b88b72" opacity=".5"/>')
def bg_car(s):
    s.add(f'<path d="{smooth([(1050,640),(1200,560),(1380,550),(1600,600),(1660,640)], 642)}" fill="#5aa05a"/>')
    s.add('<path d="M1000 640 Q1300 600 1660 640Z" fill="#fbe7b8"/>')
    for x in [1180, 1260, 1420]: palm(s, x, 610, 160, '#1e4b3a', s.rng.choice([-.2, .2]))
    cloud(s, 400, 200, 1.2, '#fff', .9)
def bg_bra(s):
    s.add('<path d="M-40 640 C60 540 160 480 230 470 C300 470 320 560 350 640Z" fill="#3a2150" opacity=".9"/>')
    s.add('<path d="M340 640 C360 520 390 380 440 330 C480 300 520 340 540 420 C560 500 580 580 620 640Z" fill="#2c1a45" opacity=".9"/>')
    stars(s, 40, 250)
def bg_fjord(s):
    s.add('<path d="M-40 640 L-40 200 C80 220 180 330 260 420 C330 500 420 600 520 640Z" fill="#2f5a4f"/>')
    s.add('<path d="M1650 640 L1650 160 C1520 200 1400 320 1300 430 C1220 520 1150 600 1080 640Z" fill="#274c43"/>')
    s.add('<path d="M160 320 C170 400 165 480 180 560" stroke="#dff3ff" stroke-width="7" fill="none" opacity=".85"/>')
    for i in range(3):
        s.add(f'<path d="M{200+i*300} {120+i*30} C{500+i*200} {40+i*20} {800+i*150} {180+i*10} {1400} {90+i*40}" stroke="{["#6ef2b0","#7ad8ff","#b18cff"][i]}" stroke-width="{40-i*10}" fill="none" opacity=".35" stroke-linecap="round"/>')
    stars(s, 70, 300)

SCENES = {
    'fernando-de-noronha': sc_noronha, 'gramado': sc_gramado, 'jericoacoara': sc_jeri, 'bonito': sc_bonito,
    'lencois-maranhenses': sc_lencois, 'paris': sc_paris, 'santorini': sc_santorini, 'japao': sc_japao,
    'nova-york': sc_ny, 'lisboa': sc_lisboa, 'patagonia': sc_patagonia, 'maldivas': sc_maldivas,
    'cancun': sc_cancun, 'egito': sc_egito, 'rio-de-janeiro': sc_rio,
    'cruzeiro-mediterraneo': lambda: cruise_scene('cmed', 41, [(0, '#7cc0e8'), (1, '#f4e6d4')], (1350, 180, 60, '#fff8e0', '#ffffff'), bg_med, [(0, '#2c78b8'), (1, '#0e3d6e')]),
    'cruzeiro-banda': lambda: cruise_scene('cban', 45, [(0, '#7cc0e8'), (1, '#f4e6d4')], (1450, 170, 60, '#fff8e0', '#ffffff'), bg_med, [(0, '#2c78b8'), (1, '#0e3d6e')], sx=820, sL=720),
    'cruzeiro-caribe': lambda: cruise_scene('ccar', 42, [(0, '#2fb0d8'), (1, '#c8f1f7')], (220, 170, 60, '#fffbe0', '#ffffff'), bg_car, [(0, '#1fc0c8'), (1, '#0a7394')]),
    'cruzeiro-brasil': lambda: cruise_scene('cbra', 43, [(0, '#1b2156'), (.6, '#8b4a7a'), (1, '#f39a6b')], (1150, 560, 90, '#ffd89a', '#ffb070'), bg_bra, [(0, '#a4557a'), (1, '#1b2156')]),
    'cruzeiro-fiordes': lambda: cruise_scene('cfio', 44, [(0, '#0b1633'), (1, '#27456b')], None, bg_fjord, [(0, '#1d3b5c'), (1, '#07162c')], hull='#f2f4fa', deck='#dfe5f2'),
}

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    only = sys.argv[2:] or list(SCENES)
    for k in only:
        s = SCENES[k]()
        grain_rect(s, .07)
        open(os.path.join(out, k + '.svg'), 'w', encoding='utf-8').write(s.svg())
        print(k, os.path.getsize(os.path.join(out, k + '.svg')) // 1024, 'KB')
