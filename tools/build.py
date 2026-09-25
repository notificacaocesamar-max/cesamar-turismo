"""Uso (na pasta tools): python build.py
Build do protótipo: gera data.js/seed, components.js (com a logo vetorial) e injeta o hero no index.html."""
import json, re, os, subprocess, sys
W = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(W, '..')
FE = os.path.join(SITE, 'frontend')
subprocess.run([sys.executable, 'catalog.py', SITE], cwd=W, check=True)
subprocess.run([sys.executable, 'hero.py'], cwd=W, check=True)
p = json.load(open(os.path.join(W, 'logo-paths.json')))
s = open(os.path.join(W, 'components.src.js'), encoding='utf-8').read()
s = s.replace('viewBox="72 280 330 50"', 'viewBox="76 254 323 70"')
s = s.replace('__RING__', p['ring']).replace('__BIRD__', p['bird']).replace('__WORD__', p['word'])
open(os.path.join(FE, 'assets/js/components.js'), 'w', encoding='utf-8').write(s)
idx = os.path.join(FE, 'index.html')
if os.path.exists(idx):
    h = open(idx, encoding='utf-8').read()
    hero = open(os.path.join(W, 'hero.svg'), encoding='utf-8').read()
    h = re.sub(r'<!--HERO-->.*?<!--/HERO-->', lambda m: '<!--HERO-->' + hero + '<!--/HERO-->', h, flags=re.S)
    open(idx, 'w', encoding='utf-8').write(h)
print('build ok')
