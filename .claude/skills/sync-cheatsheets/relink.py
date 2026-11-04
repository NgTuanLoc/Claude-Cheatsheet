"""Helper for the sync-cheatsheets skill.

  relink.py SRC DEST FILENAME   rewrite claude.ai artifact links in SRC to repo
                                files, write DEST, and report links it could not
                                resolve (excluded or unknown sheets)
  relink.py --check             check that every local .html link in the repo
                                root points at an existing file
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LINK = re.compile(
    r'<a href="https://claude\.ai/(?:code/)?artifact/([A-Za-z0-9-]+)"[^>]*>(.*?)</a>', re.S)


def load():
    m = json.load(open(os.path.join(HERE, 'manifest.json'), encoding='utf-8'))
    known = {i: s['file'] for s in m['sheets'] for i in s['ids']}
    excluded = {i: (e['title'], e['reason']) for e in m['excluded'] for i in e['ids']}
    return known, excluded


def relink(src, dest, own_file):
    known, excluded = load()
    unresolved = []

    def sub(m):
        art_id, text = m.group(1), m.group(2)
        target = known.get(art_id)
        if target and target != own_file:
            return '<a href="%s">%s</a>' % (target, text)
        why = 'links to itself' if target else (
            'excluded: ' + excluded[art_id][1] if art_id in excluded else 'unknown artifact')
        unresolved.append((re.sub(r'<[^>]+>', '', text), art_id, why))
        return m.group(0)

    s = LINK.sub(sub, open(src, encoding='utf-8').read())
    open(dest, 'w', encoding='utf-8', newline='').write(s)
    print('wrote', dest)
    for text, art_id, why in unresolved:
        print('UNRESOLVED link "%s" (%s): %s - edit that sentence by hand' % (text, art_id, why))


def check():
    from html.parser import HTMLParser
    bad = 0
    files = sorted(glob.glob('*.html'))
    for f in files:
        s = open(f, encoding='utf-8').read()
        HTMLParser().feed(s)
        for h in re.findall(r'href="([^"#:]+\.html)"', s):
            if not os.path.exists(h):
                print('BROKEN', f, '->', h)
                bad += 1
        if 'claude.ai/' in s:
            print('claude.ai link left in', f)
            bad += 1
    print(len(files), 'files; problems:', bad)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    if sys.argv[1:] == ['--check']:
        check()
    elif len(sys.argv) == 4:
        relink(*sys.argv[1:])
    else:
        sys.exit(__doc__)
