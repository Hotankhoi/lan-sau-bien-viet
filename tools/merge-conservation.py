"""Gộp DU_LIEU_BAO_TON.json vào src/data/species.json (giữ định dạng gọn). python tools/merge-conservation.py [--new]"""
import json, sys
SP = 'src/data/species.json'
d = json.load(open(SP, encoding='utf-8'))
b = json.load(open('DU_LIEU_BAO_TON.json', encoding='utf-8'))
extra = {s['id']: s for s in b['species']}
for s in d:
    e = extra.get(s['id'])
    if not e: continue
    for k in ('ecosystem', 'redBookVN', 'appearance', 'ecoRole'):
        s[k] = e[k]
if '--new' in sys.argv:
    have = {s['id'] for s in d}
    for n in b['newSpecies']:
        if n['id'] not in have: d.append(dict(n))
GROUPS = [['id', 'nameVi', 'nameSci', 'nameEn'], ['region', 'tier', 'rarity', 'danger', 'iucn'], ['sizeCm', 'behavior', 'needsVerification', 'ecosystem', 'redBookVN']]
ORDER = ['visual', 'appearance', 'description', 'funFact', 'ecoRole', 'dangerNote', 'conservation']
j = lambda v: json.dumps(v, ensure_ascii=False)
out = []
for s in d:
    lines = []
    for g in GROUPS:
        parts = [f'{j(k)}: {j(s[k])}' for k in g if k in s]
        if parts: lines.append(', '.join(parts))
    used = {k for g in GROUPS for k in g}
    rest = [k for k in ORDER if k in s] + [k for k in s if k not in used and k not in ORDER]
    lines += [f'{j(k)}: {j(s[k])}' for k in rest]
    out.append('  {\n' + ',\n'.join('    ' + l for l in lines) + '\n  }')
open(SP, 'w', encoding='utf-8', newline='\n').write('[\n' + ',\n'.join(out) + '\n]\n')
eco = b['ecosystems']
open('src/data/ecosystems.json', 'w', encoding='utf-8', newline='\n').write('[\n' + ',\n'.join('  ' + j(e) for e in eco) + '\n]\n')
print('species', len(d), 'ecosystems', len(eco))
