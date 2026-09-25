"""Ilustrações dos destinos internacionais monitorados (estilo cartaz de viagem) e
recortes de galeria. Uso (na pasta tools):
    python art_destinos.py ../frontend/assets/img
Gera img/destinos/<arte>.svg (novas cenas) e img/galeria/<arte>-a.svg / -b.svg (recortes)."""
import math, os, re, sys
from art import (S, W, H, sky, sun, sun_stripes, ridge, hills, water, reflection, cloud, stars, birds, palm, pine,
                 skyline, sailboat, smooth, poly, f, grain_rect, pyramid, SCENES as BASE_SCENES)

def ground(s, y, c, amp=10):
    s.add(f'<path d="{smooth([(-40,y),(400,y-amp),(800,y+amp/2),(1200,y-amp),(1640,y)], H+5)}" fill="{c}"/>')

def sc_italia():
    s = S('italia', 51); s.cur_bg = '#fff'
    sky(s, [(0, '#f7c59f'), (.55, '#f9dcc0'), (1, '#fbe9d6')])
    sun(s, 1180, 300, 90, '#fff3dd', '#ffe0b8')
    ridge(s, 640, 30, '#e3b89a', .5)
    # Coliseu: elipse em arcos (3 andares + ático, lado direito "quebrado")
    x0, x1, base = 360, 1240, 760
    s.add(f'<path d="M{x0} {base} L{x0} 470 Q800 430 1080 470 L1240 560 L{x1} {base}Z" fill="#d99a6c"/>')
    s.add(f'<path d="M{x0} 470 Q800 430 1080 470 L1080 440 Q800 400 {x0} 440Z" fill="#c9875b"/>')
    for row, (y, h) in enumerate([(680, 70), (590, 70), (505, 64)]):
        n = 11
        for i in range(n):
            x = x0 + 24 + i * 70
            if x > 1060 and row == 2: continue
            if x > 1170: continue
            s.add(f'<path d="M{x} {y+h} L{x} {y+24} A22 22 0 0 1 {x+44} {y+24} L{x+44} {y+h}Z" fill="#8a4f35"/>')
        s.add(f'<rect x="{x0}" y="{y+h}" width="{x1-x0 if row==0 else 820}" height="10" fill="#e8b287"/>')
    for i in range(12):
        s.add(f'<rect x="{x0+30+i*60}" y="452" width="16" height="22" fill="#8a4f35" opacity=".7"/>')
    ground(s, 770, '#b9a06a', 6)
    for x in [120, 220, 1380, 1500]:
        s.add(f'<rect x="{x-3}" y="600" width="6" height="170" fill="#3d3a28"/><ellipse cx="{x}" cy="570" rx="70" ry="44" fill="#4f5a33"/>')  # pinheiros-mansos
    s.add(f'<rect x="0" y="820" width="1600" height="180" fill="#e7cfa0"/>')
    for i in range(0, 1600, 60):
        s.add(f'<rect x="{i}" y="{830 + (i//60)%3*40}" width="40" height="6" rx="3" fill="#d6b884" opacity=".7"/>')
    birds(s, 5, 900, 1300, 180, 280, '#8a4f35')
    return s

def sc_espanha():
    s = S('espanha', 52); s.cur_bg = '#fff'
    sky(s, [(0, '#5fb3e0'), (1, '#fde6c4')])
    sun(s, 280, 190, 70, '#fff6d6', '#ffffff')
    skyline(s, 760, '#e9c9a0', None, 0, W, 90, 200)
    # Arco monumental (portão clássico de 3 vãos)
    x, base, w, h = 520, 780, 560, 380
    s.add(f'<rect x="{x}" y="{base-h}" width="{w}" height="{h}" fill="#f1dcc0"/>')
    s.add(f'<rect x="{x-20}" y="{base-h-30}" width="{w+40}" height="40" fill="#e3c49e"/>')
    s.add(f'<path d="M{x+180} {base-h-30} L{x+280} {base-h-110} L{x+380} {base-h-30}Z" fill="#e3c49e"/>')
    for cx, rw in [(x + 280, 70), (x + 110, 50), (x + 450, 50)]:
        s.add(f'<path d="M{cx-rw} {base} L{cx-rw} {base-160} A{rw} {rw} 0 0 1 {cx+rw} {base-160} L{cx+rw} {base}Z" fill="#5a3b2e"/>')
    for i in range(6):
        s.add(f'<rect x="{x+20+i*104}" y="{base-h+40}" width="14" height="{h-60}" fill="#e3c49e"/>')
    s.add(f'<rect x="0" y="{base}" width="1600" height="220" fill="#d9a066"/>')
    for i in range(-2, 12):
        s.add(f'<path d="M{800} {base} L{i*160} 1000 L{i*160+40} 1000Z" fill="#c98b52" opacity=".5"/>')
    for x2 in [150, 1450]:
        palm(s, x2, 830, 300, '#2f4a2c', .1 if x2 < 800 else -.1)
    s.add('<circle cx="800" cy="890" r="60" fill="#8fb8d6"/><circle cx="800" cy="890" r="40" fill="#bfe0f2"/>')
    return s

def sc_londres():
    s = S('londres', 53); s.cur_bg = '#fff'
    sky(s, [(0, '#8aa5c7'), (1, '#f1d7c4')])
    cloud(s, 400, 200, 1.4, '#ffffff', .7); cloud(s, 1200, 150, 1.1, '#ffffff', .6)
    skyline(s, 700, '#7b86a6', None, 0, W, 80, 180)
    # torre do relógio
    x, base = 1050, 700
    s.add(f'<rect x="{x}" y="{base-420}" width="90" height="420" fill="#c7a26b"/>')
    s.add(f'<rect x="{x-8}" y="{base-470}" width="106" height="60" fill="#b8925c"/>')
    s.add(f'<circle cx="{x+45}" cy="{base-440}" r="24" fill="#fff6dd" stroke="#6b5230" stroke-width="4"/>')
    s.add(f'<path d="M{x+45} {base-440} l0 -14 M{x+45} {base-440} l10 6" stroke="#3b2e1c" stroke-width="3"/>')
    s.add(f'<path d="M{x-8} {base-470} L{x+45} {base-560} L{x+98} {base-470}Z" fill="#4c4a5e"/>')
    s.add(f'<rect x="{x+43}" y="{base-600}" width="4" height="44" fill="#4c4a5e"/>')
    s.add(f'<rect x="{x-420}" y="{base-180}" width="420" height="180" fill="#b8925c"/>')
    for i in range(14):
        s.add(f'<rect x="{x-410+i*30}" y="{base-200}" width="12" height="24" fill="#b8925c"/><rect x="{x-405+i*30}" y="{base-150}" width="10" height="40" fill="#8b6c43"/>')
    water(s, 700, [(0, '#6d86a8'), (1, '#3b4f73')], 40, '#fff', .3)
    # roda-gigante
    cx, cy, r = 360, 520, 170
    s.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#e8eef8" stroke-width="6"/>')
    for i in range(16):
        a = i * math.pi / 8
        s.add(f'<line x1="{cx}" y1="{cy}" x2="{f(cx+r*math.cos(a))}" y2="{f(cy+r*math.sin(a))}" stroke="#e8eef8" stroke-width="2"/><ellipse cx="{f(cx+r*math.cos(a))}" cy="{f(cy+r*math.sin(a))}" rx="10" ry="7" fill="#e8eef8"/>')
    s.add(f'<path d="M{cx-60} 705 L{cx} {cy} L{cx+60} 705" stroke="#e8eef8" stroke-width="6" fill="none"/>')
    # ônibus vermelho
    s.add('<rect x="620" y="840" width="300" height="130" rx="14" fill="#d23b35"/><rect x="620" y="900" width="300" height="10" fill="#f3d27a"/>')
    for k in range(5):
        s.add(f'<rect x="{636+k*56}" y="852" width="42" height="36" rx="4" fill="#2d3a55"/><rect x="{636+k*56}" y="918" width="42" height="30" rx="4" fill="#2d3a55"/>')
    s.add('<circle cx="680" cy="975" r="22" fill="#222"/><circle cx="860" cy="975" r="22" fill="#222"/>')
    s.add('<rect x="0" y="800" width="1600" height="30" fill="#8a8f9e"/>')
    return s

def sc_holanda():
    s = S('holanda', 54); s.cur_bg = '#fff'
    sky(s, [(0, '#9fd0ef'), (1, '#fdf1dc')])
    cloud(s, 1200, 170, 1.2, '#fff', .9)
    # moinho
    x, base = 1320, 520
    s.add(f'<path d="M{x-50} {base} L{x-30} {base-200} L{x+30} {base-200} L{x+50} {base}Z" fill="#6b4a3a"/>')
    s.add(f'<path d="M{x-40} {base-200} L{x} {base-250} L{x+40} {base-200}Z" fill="#3e2a22"/>')
    for a in [20, 110, 200, 290]:
        r = math.radians(a)
        s.add(f'<path d="M{x} {base-205} L{f(x+170*math.cos(r)-18*math.sin(r))} {f(base-205+170*math.sin(r)+18*math.cos(r))} L{f(x+170*math.cos(r))} {f(base-205+170*math.sin(r))}Z" fill="#f4ead8" opacity=".95"/>')
    # campos de tulipas
    cores = ['#e0463e', '#f2b134', '#e86aa0', '#f6f0e4', '#e0463e']
    for i, c in enumerate(cores):
        y = 520 + i * 26
        s.add(f'<path d="M-40 {y} L1640 {y-20} L1640 {y+10} L-40 {y+30}Z" fill="{c}"/>')
        s.add(f'<path d="M-40 {y+26} L1640 {y+6} L1640 {y+12} L-40 {y+32}Z" fill="#4c8a3f"/>')
    # casas do canal
    x = -20
    cols = ['#b5563b', '#2f4b6e', '#7a3b2e', '#d9b36b', '#3f5f4a', '#9b4a3c', '#2c3e5c', '#c07a4a']
    k = 0
    while x < 1640:
        w = 110; h = 300 + (k % 3) * 40; c = cols[k % len(cols)]; y0 = 900 - h
        s.add(f'<rect x="{x}" y="{y0}" width="{w}" height="{h}" fill="{c}"/>')
        st = k % 3
        if st == 0: s.add(f'<path d="{poly([(x, y0), (x+w/2, y0-60), (x+w, y0)])}" fill="{c}"/>')
        elif st == 1:
            s.add(f'<path d="{poly([(x+10, y0), (x+10, y0-30), (x+30, y0-30), (x+30, y0-55), (x+80, y0-55), (x+80, y0-30), (x+100, y0-30), (x+100, y0)])}" fill="{c}"/>')
        else: s.add(f'<path d="M{x+15} {y0} Q{x+55} {y0-80} {x+95} {y0}Z" fill="{c}"/>')
        for r_ in range(int(h // 70)):
            for cc in range(2):
                s.add(f'<rect x="{x+22+cc*44}" y="{y0+24+r_*70}" width="24" height="40" fill="#fdf1dc" opacity=".9"/>')
        x += w + 4; k += 1
    water(s, 900, [(0, '#4a6f8a'), (1, '#2b4760')], 30, '#fff', .3)
    s.add('<path d="M500 930 L760 930 L740 960 L520 960Z" fill="#2b2b2b"/><rect x="560" y="905" width="140" height="26" rx="6" fill="#f4ead8"/>')
    return s

def sc_alemanha():
    s = S('alemanha', 55); s.cur_bg = '#fff'
    sky(s, [(0, '#1f2a4f'), (.6, '#4b4d86'), (1, '#e6a57a')])
    stars(s, 60, 380)
    sun(s, 300, 200, 40, '#fff2d6', '#ffffff', .9)
    skyline(s, 620, '#3a3f6e', '#ffd88a', 820, W, 200, 420)
    ridge(s, 640, 40, '#2f3560', .5)
    # casas enxaimel
    x = 60
    for i in range(7):
        w = 130; h = 180 + (i % 2) * 40; y0 = 760 - h
        s.add(f'<rect x="{x}" y="{y0}" width="{w}" height="{h}" fill="#f3e3c3"/>')
        s.add(f'<path d="{poly([(x-10, y0), (x+w/2, y0-90), (x+w+10, y0)])}" fill="#8e3b2e"/>')
        for k in range(3):
            s.add(f'<path d="M{x} {y0+k*60} L{x+w} {y0+k*60} M{x+w/2} {y0} L{x+w/2} {y0+h} M{x} {y0+k*60} L{x+w/2} {y0+k*60+60} M{x+w} {y0+k*60} L{x+w/2} {y0+k*60+60}" stroke="#5b3a26" stroke-width="6"/>')
        for k in range(2):
            s.add(f'<rect x="{x+18}" y="{y0+20+k*60}" width="26" height="26" fill="#ffd88a"/><rect x="{x+w-44}" y="{y0+20+k*60}" width="26" height="26" fill="#ffd88a"/>')
        x += w + 12
    water(s, 760, [(0, '#3d4478'), (1, '#161a3a')], 50, '#ffd88a', .3)
    # ponte em arcos
    s.add('<rect x="0" y="800" width="1600" height="26" fill="#2a2e55"/>')
    for i in range(8):
        s.add(f'<path d="M{i*210} 826 Q{i*210+105} 740 {i*210+210} 826" fill="none" stroke="#2a2e55" stroke-width="16"/>')
    for x in range(30, 1600, 120):
        s.add(f'<circle cx="{x}" cy="790" r="5" fill="#ffd88a"/>')
    return s

def sc_suica():
    s = S('suica', 56); s.cur_bg = '#fff'
    sky(s, [(0, '#6fb6e6'), (1, '#e9f5ff')])
    ridge(s, 460, 70, '#b9cde2', .5, peaks=[(520, 170, 260), (1120, 210, 300)])
    s.add('<path d="M520 172 L470 260 L500 250 L520 275 L545 248 L575 262Z" fill="#fff"/><path d="M1120 212 L1060 300 L1095 290 L1120 318 L1150 288 L1185 300Z" fill="#fff"/>')
    ridge(s, 560, 50, '#4f7a58', .55)
    water(s, 640, [(0, '#3f9fd0'), (1, '#1f5f8f')], 40, '#fff', .35)
    hills(s, 760, 20, '#5f9a52', n=5)
    for x in [80, 180, 1400, 1500, 1330]:
        pine(s, x, 800, 220, '#244a2f')
    # chalé
    s.add('<rect x="640" y="690" width="260" height="130" fill="#8a5a3a"/><path d="M620 700 L770 600 L920 700Z" fill="#5b3a26"/>')
    for k in range(3):
        s.add(f'<rect x="{664+k*80}" y="720" width="48" height="40" fill="#fff4dc"/><rect x="{664+k*80}" y="752" width="48" height="10" fill="#e0463e"/>')
    # trem vermelho
    s.add('<rect x="0" y="880" width="1600" height="8" fill="#3c3c3c"/>')
    for k in range(4):
        s.add(f'<rect x="{960+k*150}" y="822" width="140" height="58" rx="10" fill="#d8332e"/><rect x="{975+k*150}" y="834" width="110" height="20" rx="4" fill="#fdf6e8"/>')
    s.add('<rect x="0" y="888" width="1600" height="120" fill="#6ea85c"/>')
    return s

def sc_turquia():
    s = S('turquia', 57); s.cur_bg = '#fff'
    sky(s, [(0, '#f29e6b'), (.55, '#f7c48e'), (1, '#fbe0b6')])
    sun(s, 800, 470, 130, '#fff1cf', '#ffe0b0')
    # mesquita: cúpula central, meia-cúpulas, minaretes
    base, cx = 640, 800
    s.add(f'<rect x="{cx-330}" y="{base-110}" width="660" height="110" fill="#6b3d52"/>')
    for dx, r in [(-200, 70), (200, 70), (-110, 95), (110, 95)]:
        s.add(f'<path d="M{cx+dx-r} {base-110} A{r} {r} 0 0 1 {cx+dx+r} {base-110}Z" fill="#6b3d52"/>')
    s.add(f'<rect x="{cx-120}" y="{base-190}" width="240" height="90" fill="#6b3d52"/><path d="M{cx-150} {base-190} A150 150 0 0 1 {cx+150} {base-190}Z" fill="#6b3d52"/>')
    s.add(f'<rect x="{cx-3}" y="{base-380}" width="6" height="50" fill="#6b3d52"/>')
    for mx in [cx - 400, cx - 300, cx + 300, cx + 400]:
        s.add(f'<rect x="{mx-9}" y="{base-420}" width="18" height="420" fill="#6b3d52"/><path d="M{mx-11} {base-420} L{mx} {base-500} L{mx+11} {base-420}Z" fill="#6b3d52"/>')
        s.add(f'<rect x="{mx-15}" y="{base-300}" width="30" height="8" fill="#6b3d52"/>')
    water(s, 640, [(0, '#c46b78'), (1, '#4a2e55')], 60, '#ffe0b0', .3)
    reflection(s, 800, 640, 260, '#fff1cf', 10, .45)
    sailboat(s, 1150, 800, .9, '#fff3e0', '#2b1a33')
    birds(s, 8, 400, 1200, 150, 330, '#6b3d52')
    return s

def sc_orlando():
    s = S('orlando', 58); s.cur_bg = '#fff'
    sky(s, [(0, '#1b1f5c'), (.6, '#5b3c8f'), (1, '#e46b8f')])
    stars(s, 80, 420)
    # fogos de artifício
    for cx, cy, c, n in [(400, 220, '#ffd36b', 22), (820, 150, '#7fe0ff', 26), (1200, 240, '#ff8fb8', 22), (620, 330, '#b6ff9a', 16)]:
        for i in range(n):
            a = 2 * math.pi * i / n; r1, r2 = 20, 110 + (i % 3) * 14
            s.add(f'<line x1="{f(cx+r1*math.cos(a))}" y1="{f(cy+r1*math.sin(a))}" x2="{f(cx+r2*math.cos(a))}" y2="{f(cy+r2*math.sin(a))}" stroke="{c}" stroke-width="4" stroke-linecap="round" opacity=".9"/>')
            s.add(f'<circle cx="{f(cx+(r2+10)*math.cos(a))}" cy="{f(cy+(r2+10)*math.sin(a))}" r="4" fill="{c}"/>')
    # roda-gigante iluminada + montanha-russa
    cx, cy, r = 1250, 560, 190
    s.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#ffd36b" stroke-width="6"/>')
    for i in range(20):
        a = i * math.pi / 10
        s.add(f'<line x1="{cx}" y1="{cy}" x2="{f(cx+r*math.cos(a))}" y2="{f(cy+r*math.sin(a))}" stroke="#ffd36b" stroke-width="2" opacity=".8"/><circle cx="{f(cx+r*math.cos(a))}" cy="{f(cy+r*math.sin(a))}" r="9" fill="#ff8fb8"/>')
    s.add(f'<path d="M{cx-80} 800 L{cx} {cy} L{cx+80} 800" stroke="#ffd36b" stroke-width="8" fill="none"/>')
    s.add('<path d="M-20 700 C120 520 220 520 320 640 C400 740 480 740 560 600 C620 500 700 500 760 620 L760 800 L-20 800Z" fill="none"/>')
    s.add('<path d="M-20 700 C120 520 220 520 320 640 C400 740 480 740 560 600 C620 500 700 500 760 620" stroke="#7fe0ff" stroke-width="8" fill="none"/>')
    for x in range(0, 760, 50):
        s.add(f'<line x1="{x}" y1="800" x2="{x}" y2="{640 + 60*math.sin(x/90)}" stroke="#7fe0ff" stroke-width="3" opacity=".5"/>')
    water(s, 800, [(0, '#4a2f78'), (1, '#140f36')], 50, '#ffd36b', .35)
    palm(s, 90, 830, 260, '#0e0b26', .2); palm(s, 950, 850, 230, '#0e0b26', -.2)
    return s

def sc_canada():
    s = S('canada', 59); s.cur_bg = '#fff'
    sky(s, [(0, '#8fc3ea'), (1, '#fde9d0')])
    sun(s, 1300, 200, 60, '#fff8e0', '#ffffff')
    skyline(s, 640, '#6b7fa6', None, 300, 1400, 120, 300)
    # torre-agulha
    x, base = 820, 640
    s.add(f'<path d="{poly([(x-26, base), (x-8, base-460), (x+8, base-460), (x+26, base)])}" fill="#56688f"/>')
    s.add(f'<ellipse cx="{x}" cy="{base-420}" rx="46" ry="22" fill="#56688f"/><rect x="{x-3}" y="{base-640}" width="6" height="190" fill="#56688f"/>')
    water(s, 640, [(0, '#5a9cc4'), (1, '#2d5f86')], 40, '#fff', .3)
    # floresta de outono
    for i in range(34):
        xx = -30 + i * 50 + (i % 3) * 8
        c = ['#d9482f', '#f08a2b', '#f2b134', '#b43a2c'][i % 4]
        s.add(f'<ellipse cx="{xx}" cy="{800 + (i%2)*20}" rx="46" ry="70" fill="{c}"/>')
    s.add(f'<path d="{smooth([(-40,850),(400,835),(800,860),(1200,840),(1640,855)], H+5)}" fill="#6e4a2f"/>')
    # folha de bordo estilizada
    s.add('<path d="M800 930 l12 -30 l16 10 l-4 -34 l20 6 l-44 -40 l-44 40 l20 -6 l-4 34 l16 -10z" fill="#e0463e"/>')
    return s

def sc_argentina():
    s = S('argentina', 60); s.cur_bg = '#fff'
    sky(s, [(0, '#7ab8e8'), (1, '#f6e7d2')])
    cloud(s, 350, 200, 1.2, '#fff', .9)
    skyline(s, 700, '#cdb7a0', None, 0, W, 120, 260)
    # obelisco
    x, base = 800, 740
    s.add(f'<path d="{poly([(x-44, base), (x-26, base-470), (x, base-520), (x+26, base-470), (x+44, base)])}" fill="#f4efe6"/>')
    s.add(f'<path d="{poly([(x, base-520), (x+26, base-470), (x+44, base), (x+8, base)])}" fill="#dcd3c3"/>')
    s.add(f'<rect x="{x-9}" y="{base-470}" width="18" height="10" fill="#8a8078"/>')
    # jacarandás
    for tx in [200, 380, 1220, 1420]:
        s.add(f'<rect x="{tx-6}" y="640" width="12" height="120" fill="#4a3a33"/>')
        for k in range(16):
            s.add(f'<circle cx="{tx + (k%5-2)*28}" cy="{600 + (k//5)*26 - (k%2)*10}" r="34" fill="#8e6bc9" opacity=".85"/>')
    s.add('<rect x="0" y="760" width="1600" height="240" fill="#6d6f7a"/>')
    for i in range(10):
        s.add(f'<rect x="{i*170}" y="870" width="100" height="10" fill="#f2f0ea"/>')
    return s

def sc_chile():
    s = S('chile', 61); s.cur_bg = '#fff'
    sky(s, [(0, '#f2a27a'), (.5, '#f7c9a3'), (1, '#fbe6cf')])
    ridge(s, 470, 80, '#a07aa0', .5, peaks=[(400, 190, 300), (1150, 160, 360)])
    s.add('<path d="M400 192 L330 300 L370 290 L400 320 L430 285 L470 298Z" fill="#fff" opacity=".95"/><path d="M1150 162 L1060 280 L1110 268 L1150 300 L1190 266 L1245 280Z" fill="#fff" opacity=".95"/>')
    ridge(s, 560, 50, '#7a5b86', .55)
    skyline(s, 720, '#4a3a5e', '#ffd88a', 200, 1400, 80, 220)
    x, base = 980, 720  # torre alta envidraçada
    s.add(f'<path d="{poly([(x-50, base), (x-40, base-420), (x-10, base-470), (x+36, base-430), (x+50, base)])}" fill="#3a2d4f"/>')
    for yy in range(base - 400, base - 10, 22):
        s.add(f'<rect x="{x-34}" y="{yy}" width="70" height="4" fill="#ffd88a" opacity=".5"/>')
    ground(s, 740, '#3b6e4a', 10)
    for i in range(12):  # vinhedos
        s.add(f'<path d="M-40 {800+i*18} L1640 {780+i*18}" stroke="#2c5a3a" stroke-width="7"/>')
    return s

def sc_peru():
    s = S('peru', 62); s.cur_bg = '#fff'
    sky(s, [(0, '#a9d3ef'), (1, '#eef7fb')])
    cloud(s, 300, 330, 1.6, '#ffffff', .85); cloud(s, 1300, 280, 1.3, '#ffffff', .8)
    # montanha em pico íngreme + montanhas ao fundo
    ridge(s, 470, 60, '#8fb3a1', .5)
    s.add('<path d="M860 760 C900 600 950 330 1040 250 C1090 210 1140 260 1160 360 C1190 500 1230 640 1300 760Z" fill="#2f6b4a"/>')
    s.add('<path d="M1040 250 C1090 210 1140 260 1160 360 C1120 330 1080 300 1040 250Z" fill="#245a3d"/>')
    # terraços e ruínas de pedra
    s.add('<path d="M200 760 C300 640 520 610 700 640 C780 655 840 700 880 760Z" fill="#4f8a5a"/>')
    for i in range(8):
        y = 650 + i * 14; w = 520 - i * 20
        s.add(f'<path d="M{330-i*10} {y} L{330-i*10+w} {y}" stroke="#3d6f47" stroke-width="5"/>')
    for i in range(14):
        xx = 360 + (i % 7) * 60; yy = 600 + (i // 7) * 36
        s.add(f'<rect x="{xx}" y="{yy}" width="46" height="30" fill="#b9ad98"/><path d="{poly([(xx-4, yy), (xx+23, yy-20), (xx+50, yy)])}" fill="#9a8d78" opacity="{.4 if i%3 else .9}"/>')
    hills(s, 780, 16, '#3f7a4c', n=5)
    # lhama
    s.add('<path d="M240 900 l0 -60 q0 -20 20 -20 l60 0 q10 -40 10 -70 l20 0 l0 110 l0 40 l-10 0 l0 -30 l-60 0 l0 30 l-10 0 l0 -30 l-10 0 l0 30z" fill="#f4ead8"/>')
    s.add('<path d="M330 750 l-6 -18 l8 4 l6 -12 l4 16z" fill="#f4ead8"/>')
    return s

def sc_dubai():
    s = S('dubai', 63); s.cur_bg = '#fff'
    sky(s, [(0, '#f5a15e'), (.5, '#f7c27f'), (1, '#fbe0ae')])
    sun(s, 1200, 520, 110, '#fff1cf', '#ffe0b0')
    skyline(s, 700, '#b77a58', None, 0, W, 160, 340)
    x, base = 700, 700   # supertorre escalonada
    steps = [(70, 0), (58, .25), (46, .45), (34, .62), (22, .76), (12, .88), (4, .97)]
    H0 = 640
    for w, t in steps:
        s.add(f'<rect x="{x-w}" y="{base-H0*(t+0.12) if t<.97 else base-H0}" width="{2*w}" height="{H0*(t+0.12) if t<.97 else H0}" fill="#8e5a45"/>')
    s.add(f'<rect x="{x-2}" y="{base-H0-80}" width="4" height="90" fill="#8e5a45"/>')
    # dunas
    s.add(f'<path d="{smooth([(-40,720),(300,690),(700,730),(1100,700),(1640,730)], H+5)}" fill="#e7a868"/>')
    s.add(f'<path d="{smooth([(-40,820),(500,780),(900,830),(1300,790),(1640,820)], H+5)}" fill="#d98f52"/>')
    s.add(f'<path d="{smooth([(-40,920),(400,900),(1000,930),(1640,905)], H+5)}" fill="#c77b40"/>')
    # camelos
    for cx in [1150, 1260]:
        s.add(f'<path d="M{cx} 800 q10 -40 40 -40 q20 -30 40 0 q20 -10 30 10 l20 -30 l10 4 l-14 40 q-6 14 -20 16 l0 40 l-8 0 l0 -36 l-50 0 l0 36 l-8 0 l0 -40 q-20 0 -20 -10z" fill="#5a3526"/>')
    return s

def sc_africa():
    s = S('africa', 64); s.cur_bg = '#fff'
    sky(s, [(0, '#6fb6e0'), (1, '#f5e8d6')])
    cloud(s, 800, 270, 2.2, '#ffffff', .9)  # "toalha" de nuvem sobre a montanha
    # montanha de topo plano
    s.add('<path d="M180 640 L420 330 L1180 320 L1320 420 L1460 640Z" fill="#6f7a86"/>')
    s.add('<path d="M420 330 L1180 320 L1150 350 L450 360Z" fill="#8a95a0"/>')
    for i in range(10):
        s.add(f'<path d="M{480+i*70} 360 L{460+i*70} 600" stroke="#5f6874" stroke-width="3" opacity=".6"/>')
    s.add('<path d="M1320 420 L1420 330 L1500 420 L1560 640 L1300 640Z" fill="#5f6874"/>')
    skyline(s, 680, '#e8dccb', None, 150, 1450, 40, 110)
    water(s, 680, [(0, '#2a8fb8'), (1, '#0e4d74')], 50, '#fff', .35)
    s.add(f'<path d="{smooth([(-40,880),(400,850),(900,880),(1640,860)], H+5)}" fill="#f1dcb3"/>')
    # pinguins
    for px in [260, 310, 360]:
        s.add(f'<ellipse cx="{px}" cy="880" rx="20" ry="34" fill="#1d1d24"/><ellipse cx="{px+4}" cy="886" rx="12" ry="24" fill="#fff"/><circle cx="{px}" cy="846" r="13" fill="#1d1d24"/><path d="M{px+10} 846 l12 4 l-12 3z" fill="#f2a33c"/>')
    sailboat(s, 1200, 760, .9, '#fff', '#0e2c44')
    return s

NEW = {'italia': sc_italia, 'espanha': sc_espanha, 'londres': sc_londres, 'holanda': sc_holanda, 'alemanha': sc_alemanha,
       'suica': sc_suica, 'turquia': sc_turquia, 'orlando': sc_orlando, 'canada': sc_canada, 'argentina': sc_argentina,
       'chile': sc_chile, 'peru': sc_peru, 'dubai': sc_dubai, 'africa-do-sul': sc_africa}

# Recortes de galeria: mesmo desenho com enquadramentos diferentes (viewBox)
RECORTES = {'a': '120 180 900 620', 'b': '640 260 900 640'}

if __name__ == '__main__':
    out = sys.argv[1]
    dest, gal = os.path.join(out, 'destinos'), os.path.join(out, 'galeria')
    os.makedirs(dest, exist_ok=True); os.makedirs(gal, exist_ok=True)
    only = sys.argv[2:]
    for k, fn in NEW.items():
        if only and k not in only: continue
        s = fn(); grain_rect(s, .07)
        open(os.path.join(dest, k + '.svg'), 'w', encoding='utf-8').write(s.svg())
    todos = ['italia', 'lisboa', 'paris', 'espanha', 'londres', 'holanda', 'alemanha', 'suica', 'santorini', 'turquia', 'orlando',
             'canada', 'cancun', 'argentina', 'chile', 'peru', 'japao', 'dubai', 'egito', 'africa-do-sul']
    for k in todos:
        svg = open(os.path.join(dest, k + '.svg'), encoding='utf-8').read()
        for suf, vb in RECORTES.items():
            v = re.sub(r'viewBox="[^"]+"', f'viewBox="{vb}"', svg, count=1)
            open(os.path.join(gal, f'{k}-{suf}.svg'), 'w', encoding='utf-8').write(v)
    print('ok', len(NEW), 'cenas novas;', len(todos) * 2, 'recortes de galeria')
