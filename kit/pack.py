#!/usr/bin/env python3
"""Pack the kit into one text file for the project doc:  python3 kit/pack.py cheatsheet-kit.txt
Each file follows a marker line with its path and SHA-256; the skill's unpack snippet restores and verifies them."""
import hashlib, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); MARK = '=====8<' + '===== FILE '
out = ['CHEATSHEET-KIT bundle. Engine, tools, reference and starter sheet for the cheatsheet library.',
       'Do not edit by hand: unpack it with the snippet in the cheatsheet-template skill, change the files, repack with kit/pack.py.', '']
n = 0
for d, dirs, files in sorted(os.walk(ROOT)):
    dirs[:] = sorted(x for x in dirs if not x.startswith(('.', '__')))
    for f in sorted(files):
        if f.endswith(('.pyc', '.png')): continue
        rel = 'kit/' + os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, '/')
        body = open(os.path.join(d, f), encoding='utf-8').read().rstrip('\n') + '\n'
        assert not any(l.startswith(MARK[:14]) for l in body.split('\n')), rel
        out.append(MARK + rel + ' sha256=' + hashlib.sha256(body.encode()).hexdigest()); out.append(body.rstrip('\n')); n += 1
out.append(MARK.replace('FILE ', 'END'))
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(f'packed {n} files into {sys.argv[1]} ({os.path.getsize(sys.argv[1]) / 1024:.0f} kB)')
