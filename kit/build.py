#!/usr/bin/env python3
"""Build one cheatsheet page:  python3 kit/build.py <sheet_dir> -o <out.html>

Joins the kit's engine (kit/src) and one sheet (its NN-*.js files and optional sheet.css) into a single
self-contained HTML file, and runs the structural checks first. Nothing is written if a check fails."""
import argparse, glob, html, json, os, re, subprocess, sys
from html.parser import HTMLParser

KIT_VERSION = '1.0'
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')

ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
ap.add_argument('sheet', help='folder with the sheet: NN-*.js files and an optional sheet.css')
ap.add_argument('-o', '--out', required=True, help='the HTML file to write')
args = ap.parse_args()
SHEET = os.path.abspath(args.sheet)

def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def tagged(name, text):
    """every embedded file starts with a marker line, so split.py can take a page apart again"""
    return '/*@@FILE ' + name + '@@*/\n' + text.rstrip('\n') + '\n'

errors, warnings = [], []
sheet_js = sorted(glob.glob(os.path.join(SHEET, '[0-9][0-9]-*.js')))
if not sheet_js:
    sys.exit(f'no NN-*.js files in {SHEET}')
sheet_css = os.path.join(SHEET, 'sheet.css')

# 1. data validation (also renders every diagram once) and JS syntax
res = subprocess.run(['node', os.path.join(ROOT, 'check-data.js'), SRC, SHEET], capture_output=True, text=True)
if res.returncode != 0 or not res.stdout.strip():
    sys.exit('the data check could not run:\n' + (res.stderr.strip() or res.stdout.strip())[:3000])
info = json.loads(res.stdout.strip().splitlines()[-1])
errors += info['errs']; warnings += info['warns']
for path in [os.path.join(SRC, n) for n in ('10-render.js', '15-setup.js', '30-app.js')] + sheet_js:
    r = subprocess.run(['node', '--check', path], capture_output=True, text=True)
    if r.returncode != 0:
        errors.append(f'{os.path.basename(path)}: syntax: ' + r.stderr.strip()[:800])

# 2. things that break a page silently
for path in sheet_js:
    name, text = os.path.basename(path), read(path)
    if '</script' in text.lower():
        errors.append(f'{name}: contains </script (write it as "<" + "/script")')
    if '/*@@FILE' in text:
        errors.append(f'{name}: the text /*@@FILE is reserved for the build')
    if 'widgets' in name:      # widget code is ordinary JavaScript; the two checks below are for data files, where code samples sit in strings
        continue
    for i, line in enumerate(text.split('\n'), 1):
        for m in re.finditer(r'(?<!\\)\\([^\\\'`$])', line):
            errors.append(f'{name}:{i}: lone backslash \\{m.group(1)}: JavaScript drops it inside a string, write \\\\{m.group(1)}')
        if '${' in line:
            errors.append(f'{name}:{i}: ${{ inside a template string would be evaluated; build the text another way')
if os.path.exists(sheet_css) and '</style' in read(sheet_css).lower():
    errors.append('sheet.css: contains </style')

# 3. assemble
style = tagged('kit/style.css', read(os.path.join(SRC, 'style.css')))
if os.path.exists(sheet_css):
    style += tagged('sheet/sheet.css', read(sheet_css))
parts = {
    '/*@@STYLE@@*/': style.rstrip('\n'),
    '/*@@RENDER@@*/': (tagged('kit/10-render.js', read(os.path.join(SRC, '10-render.js'))) + tagged('kit/15-setup.js', read(os.path.join(SRC, '15-setup.js')))).rstrip('\n'),
    '/*@@DATA@@*/': ''.join(tagged('sheet/' + os.path.basename(p), read(p)) for p in sheet_js).rstrip('\n'),
    '/*@@APP@@*/': tagged('kit/30-app.js', read(os.path.join(SRC, '30-app.js'))).rstrip('\n'),
    '@@TITLE@@': html.escape(info['title'] or 'Cheatsheet', quote=False),
    '@@KIT@@': KIT_VERSION,
}
page = read(os.path.join(SRC, 'shell.html'))
for k, v in parts.items():
    if page.count(k) != 1:
        sys.exit(f'kit/src/shell.html: placeholder {k} missing or duplicated')
    page = page.replace(k, v)

if chr(0xFFFD) in page:
    errors.append('a U+FFFD replacement character: some text was saved with the wrong encoding')
if re.search(r'/\*@@[A-Z]+@@\*/|@@(TITLE|KIT)@@', page):
    errors.append('unreplaced placeholder')

# 4. tag balance of the static HTML (scripts and styles stripped) and its jump targets
static = re.sub(r'<script[\s\S]*?</script>', '', page)
static = re.sub(r'<style[\s\S]*?</style>', '', static)
VOID = {'meta', 'link', 'br', 'img', 'input', 'hr', 'path', 'circle', 'source', 'wbr'}
class Bal(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack = []; self.errs = []
    def handle_starttag(self, tag, attrs):
        if tag not in VOID: self.stack.append((tag, self.getpos()))
    def handle_startendtag(self, tag, attrs): pass
    def handle_endtag(self, tag):
        if tag in VOID: return
        if not self.stack or self.stack[-1][0] != tag:
            self.errs.append(f'unexpected </{tag}> at {self.getpos()} (open: {self.stack[-1] if self.stack else None})')
            for j in range(len(self.stack) - 1, -1, -1):
                if self.stack[j][0] == tag: del self.stack[j:]; break
        else:
            self.stack.pop()
b = Bal(); b.feed(static)
errors += b.errs + [f'unclosed <{t}> at {pos}' for t, pos in b.stack]
static_ids = set(re.findall(r'\bid="([^"]+)"', static))
for t in re.findall(r'data-to="([^"]+)"', static):
    if t not in static_ids:
        errors.append(f'static data-to target missing: {t}')

print(f"{info['title']}: {info['groups']} groups, {info['sections']} sections, {info['cards']} cards, {info['subs']} sub-headings, "
      f"{info['attached']} callouts on cards + {info['standalone']} standalone, {info['tasks']} tasks")
for w in warnings:
    print('  note:', w)
if errors:
    print('ERRORS (nothing written):')
    for e in errors:
        print('  -', e)
    sys.exit(1)
os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
with open(args.out, 'w', encoding='utf-8') as f:
    f.write(page)
print(f'wrote {args.out} ({len(page.encode()) / 1024:.1f} kB), kit {KIT_VERSION}')
print('build checks: OK')
