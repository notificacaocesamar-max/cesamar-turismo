"""Hero animado da home: Baía de Guanabara ao entardecer, com camadas para parallax
e o pássaro da marca Cesamar cruzando o céu. Gera hero.svg (inline no index.html)."""
import json, math
from art import S, sky, sun, stars, ridge, water, reflection, sailboat, smooth, f, W, H

p = json.load(open('logo-paths.json'))
s = S('hero', 77); s.cur_bg = '#fff'

def layer(depth, fn, cls=''):
    start = len(s.body); fn(); inner = ''.join(s.body[start:]); del s.body[start:]
    s.add(f'<g class="hero-layer {cls}" data-depth="{depth}">{inner}</g>')

sky(s, [(0, '#0e1233'), (.38, '#2b2a6e'), (.62, '#7a3f7c'), (.8, '#e0645a'), (1, '#f7b26b')])
layer(0.01, lambda: stars(s, 110, 420), 'hero-stars')
layer(0.02, lambda: sun(s, 1060, 640, 150, '#ffd9a0', '#ffb070'), 'hero-sun')

def far():
    ridge(s, 600, 55, '#5a3470', .5, x0=-80, x1=W + 80)
layer(0.03, far)

def mountains():
    # Urca + Pão de Açúcar (esq.) e morros de Niterói (dir.)
    s.add('<path d="M120 690 C170 600 240 560 300 552 C360 548 392 610 418 690Z" fill="#35205a"/>')
    s.add('<path d="M430 690 C452 560 488 400 548 342 C592 304 636 350 656 440 C676 530 700 620 748 690Z" fill="#26164a"/>')
    s.add('<path d="M1180 690 C1240 610 1300 590 1360 600 C1430 560 1500 540 1560 560 C1600 575 1640 600 1680 620 L1680 700 L1180 700Z" fill="#2c1a4f"/>')
    # cabo do bondinho + cabine animada
    s.add('<path id="hero-cable" d="M305 553 L548 344" stroke="#140a2a" stroke-width="2" fill="none"/>')
    s.add('<g class="hero-cablecar"><rect x="-9" y="-2" width="18" height="13" rx="3" fill="#ffd89a"/><rect x="-1" y="-9" width="2" height="8" fill="#140a2a"/>'
          '<animateMotion dur="14s" repeatCount="indefinite" keyPoints="0;1;1;0;0" keyTimes="0;.42;.5;.92;1" calcMode="linear"><mpath href="#hero-cable"/></animateMotion></g>')
    # luzes da orla
    for i in range(70):
        x = s.rng.uniform(0, W); y = s.rng.uniform(684, 694)
        s.add(f'<circle class="tw" cx="{f(x)}" cy="{f(y)}" r="{f(s.rng.uniform(1.2,2.6))}" fill="#ffe3a8" style="animation-delay:{s.rng.uniform(0,4):.2f}s"/>')
layer(0.06, mountains)

def sea():
    water(s, 690, [(0, '#b0567c'), (.45, '#4a2d6e'), (1, '#10143a')], 90, '#ffd89a', .28)
    reflection(s, 1060, 690, 360, '#ffd9a0', 14, .5)
layer(0.0, sea, 'hero-sea')

def boats():
    s.add('<g class="bob" style="animation-delay:-1s">'); sailboat(s, 1250, 800, 1.1, '#fff3e0', '#140a2a'); s.add('</g>')
    s.add('<g class="bob" style="animation-delay:-2.6s">'); sailboat(s, 880, 860, .75, '#fff3e0', '#140a2a'); s.add('</g>')
layer(0.1, boats)

# pássaro da marca (branco) — voa pela cena
s.add(f'<g class="hero-bird"><g transform="translate(-240 -170) scale(1)"><path fill="#fff" fill-rule="evenodd" d="{p["bird"]}"/></g></g>')

open('hero.svg', 'w', encoding='utf-8').write(s.svg().replace('<svg ', '<svg class="hero-art" aria-hidden="true" focusable="false" ', 1))
print('hero.svg', len(s.svg()) // 1024, 'KB')
