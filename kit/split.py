#!/usr/bin/env python3
"""Take a published cheatsheet apart again:  python3 kit/split.py <page.html> <sheet_dir> [--kit DIR]

A built page carries its own sources: every embedded file starts with a /*@@FILE name@@*/ line. This writes the
sheet's files (NN-*.js, sheet.css) into <sheet_dir>, ready to edit and rebuild. It accepts the file as built and the
copy an artifact read returns (which has one extra wrapper line). With --kit it also writes the engine the page was
built with, for comparison or recovery."""
import argparse, os, re, sys

ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
ap.add_argument('page'); ap.add_argument('sheet_dir')
ap.add_argument('--kit', help='also write the embedded engine files (src/) here')
args = ap.parse_args()

text = open(args.page, encoding='utf-8').read()
files, name, buf = {}, None, []
for line in text.split('\n'):
    m = re.fullmatch(r'/\*@@FILE ([\w./-]+)@@\*/', line)
    if m or line in ('</style>', '</script>'):
        if name: files[name] = '\n'.join(buf) + '\n'
        name, buf = (m.group(1) if m else None), []
    elif name is not None:
        buf.append(line)
if not files:
    sys.exit('No /*@@FILE …@@*/ markers found: this page was not built with the kit (or the HTML is incomplete).')

ver = re.search(r'<meta name="generator" content="cheatsheet-kit ([\d.]+)"', text)
title = re.search(r'<title>(.*?)</title>', text)
print(f"{title.group(1) if title else '?'}: built with kit {ver.group(1) if ver else '?'}")

here = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
def write(folder, rel, body):
    path = os.path.join(folder, rel); os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: f.write(body)

n = 0
for name, body in files.items():
    kind, rel = name.split('/', 1)
    if kind == 'sheet':
        write(args.sheet_dir, rel, body); n += 1
        print(f'  sheet  {rel:28} {len(body.encode()):>8} bytes')
    elif kind == 'kit':
        if args.kit: write(os.path.join(args.kit, 'src'), rel, body)
        mine = os.path.join(here, rel)
        same = os.path.exists(mine) and open(mine, encoding='utf-8').read().rstrip('\n') == body.rstrip('\n')
        print(f'  engine {rel:28} {"same as this kit" if same else "DIFFERS from this kit (the page was built with another version; rebuild and re-check it)"}')
print(f'{n} sheet files written to {args.sheet_dir}')
