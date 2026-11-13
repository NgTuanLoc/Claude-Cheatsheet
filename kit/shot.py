#!/usr/bin/env python3
"""Headless checks and screenshots for a built cheatsheet:  python3 kit/shot.py <page.html> [--shots DIR]

Opens the page in light and dark at desktop, tablet and phone width and reports anything broken: script errors,
failed diagrams, dead links, sideways scroll, overlapping diagram text, light surfaces in dark mode, widgets,
search, jumps and the phone menu. Then saves screenshots to look at. Ends with "no problems found" or a list."""
import argparse, json, os, re, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
ap.add_argument('page', help='the built HTML file')
ap.add_argument('--shots', default='shots', help='folder for the screenshots (default: ./shots)')
args = ap.parse_args()
URL = args.page if re.match(r'^(file|https?)://', args.page) else 'file://' + os.path.abspath(args.page)
SHOTS = os.path.abspath(args.shots)
os.makedirs(SHOTS, exist_ok=True)

OVERLAP_JS = r'''
() => {
  const out = [];
  document.querySelectorAll('svg.dg').forEach((svg) => {
    if (!svg.getClientRects().length) return;             // hidden state
    const card = svg.closest('[data-id]'), id = card ? card.getAttribute('data-id') : '?';
    const vb = svg.viewBox.baseVal;
    const T = [...svg.querySelectorAll('text')].map(t => { const b = t.getBBox(); return { t: t.textContent, x: b.x, y: b.y, w: b.width, h: b.height }; });
    T.forEach(a => {
      if (a.x < vb.x - 2 || a.y < vb.y - 2 || a.x + a.w > vb.x + vb.width + 2 || a.y + a.h > vb.y + vb.height + 2)
        out.push({ card: id, problem: 'diagram text outside the drawing', text: a.t });
    });
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const a = T[i], b = T[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 2 && oy > 3.5) out.push({ card: id, problem: 'diagram labels overlap', a: a.t, b: b.t });
    }
  });
  return out;
}
'''

# dark mode: no surface may be light. A rule that swaps the text and page colours turns into a white slab there,
# so every opaque background (elements and their ::before/::after) must stay dark; small accent marks are exempt.
LIGHT_IN_DARK_JS = r'''
() => {
  const lum = m => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
  const out = {};
  const add = (label, bg, w, h) => {
    const m = (bg.match(/[\d.]+/g) || []).map(Number);
    if (m.length < 3 || (m.length > 3 && m[3] < .5) || w * h < 400 || lum(m) < .35) return;
    const k = label + ' ' + bg; out[k] = (out[k] || 0) + 1;
  };
  document.querySelectorAll('body *').forEach(e => {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    const name = e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '');
    add(name, getComputedStyle(e).backgroundColor, r.width, r.height);
    for (const ps of ['::before', '::after']) {
      const cs = getComputedStyle(e, ps); if (cs.content === 'none' || cs.display === 'none') continue;
      add(name + ps, cs.backgroundColor, parseFloat(cs.width) || 0, parseFloat(cs.height) || 0);
    }
  });
  return Object.entries(out).map(([k, n]) => k + ' x' + n);
}
'''
FLIP_JS = "s => document.querySelectorAll('.blk[data-state]').forEach(c => c.setAttribute('data-state', s))"

def listen(pg, errs):
    # Google Fonts can be unreachable from a sandbox; every other resource is inline
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.on('pageerror', lambda e: errs.append('script error: ' + str(e)))

def run():
    problems, made = [], []
    with sync_playwright() as p:
        br = p.chromium.launch()
        # ---- every theme and width
        for scheme in ['light', 'dark']:
            for vw, vh, tag in [(1440, 900, 'desk'), (1024, 800, 'tab'), (390, 844, 'mob')]:
                ctx = br.new_context(viewport={'width': vw, 'height': vh}, color_scheme=scheme, reduced_motion='reduce')
                pg = ctx.new_page(); errs = []; listen(pg, errs)
                pg.goto(URL); pg.wait_for_timeout(300)
                where = f'{scheme} {vw}px'
                if errs: problems.append((where, 'console', errs[:5]))
                n_err = pg.eval_on_selector_all('.dg-err', 'els => els.length')
                if n_err: problems.append((where, 'diagrams or widgets that failed to render', n_err))
                missing = pg.evaluate("() => [...document.querySelectorAll('[data-to]')].map(e => e.getAttribute('data-to')).filter(t => !document.getElementById(t))")
                if missing: problems.append((where, 'links to something that does not exist', sorted(set(missing))[:10]))
                ov = pg.evaluate('() => [document.documentElement.scrollWidth, window.innerWidth]')
                if ov[0] > ov[1] + 1: problems.append((where, 'the page scrolls sideways', ov))
                if scheme == 'dark':
                    lit = pg.evaluate(LIGHT_IN_DARK_JS); pg.evaluate(FLIP_JS, 'f')
                    lit = sorted(set(lit + pg.evaluate(LIGHT_IN_DARK_JS))); pg.evaluate(FLIP_JS, 'b')
                    if lit: problems.append((where, 'light surface in dark mode', lit[:8]))
                if scheme == 'light' and tag == 'desk':
                    seen = pg.evaluate(OVERLAP_JS); pg.evaluate(FLIP_JS, 'f')        # every diagram, both states
                    seen += pg.evaluate(OVERLAP_JS); pg.evaluate(FLIP_JS, 'b')
                    for o in seen: problems.append((where, o))
                    wide = pg.evaluate('''() => [...document.querySelectorAll('.blk, .call, .gcard')].filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 2 && !e.querySelector('.src, .tbl-wrap, .dg-scroll, .pmap, .wdg-code')).map(e => e.id || e.className).slice(0, 10)''')
                    if wide: problems.append((where, 'content wider than its card', wide))
                    long_code = pg.evaluate('''() => document.body.classList.contains('wrap') ? [] : [...document.querySelectorAll('.blks .src')].filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 2).map(e => e.closest('[data-id]').dataset.id)''')
                    if long_code: problems.append((where, 'code lines too long for their card (shorten or break them)', sorted(set(long_code))[:20]))
                # screenshots for the visual pass: the top, the first group band with its first section, one card in the middle
                if tag in ('desk', 'mob'):
                    def snap(name):
                        path = f'{SHOTS}/{scheme}-{tag}-{name}.png'; pg.screenshot(path=path); made.append(path)
                    snap('top')
                    pg.evaluate("() => { const b = document.querySelector('.gband'); if (b) { b.scrollIntoView(); scrollBy(0, -70); } }"); pg.wait_for_timeout(120); snap('band')
                    pg.evaluate("() => { const c = document.querySelectorAll('.blks > .blk'); if (c.length) { c[Math.floor(c.length / 2)].scrollIntoView(); scrollBy(0, -80); } }"); pg.wait_for_timeout(120); snap('card')
                    if pg.evaluate("() => { const w = document.querySelector('.wdg'); if (!w) return false; w.closest('.blk').scrollIntoView(); scrollBy(0, -80); return true; }"):
                        pg.wait_for_timeout(120); snap('widget')
                ctx.close()

        # ---- interactions (light, desktop)
        ctx = br.new_context(viewport={'width': 1440, 'height': 900}, color_scheme='light', reduced_motion='reduce')
        pg = ctx.new_page(); errs = []; listen(pg, errs)
        pg.goto(URL); pg.wait_for_timeout(200)
        report = {}
        def top(sel): return pg.evaluate("s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top) : null; }", sel)
        def landed(name, target):
            pg.wait_for_timeout(250); t = top('#' + target); report['jump ' + name] = t
            if t is None or not (30 <= t <= 130): problems.append(('jumps', f'{name}: #{target} should land just below the toolbar, got top = {t}'))

        st = pg.evaluate('''() => ({
          groups: document.querySelectorAll('.gband').length, sections: document.querySelectorAll('.sec').length, cards: document.querySelectorAll('.blks > .blk').length,
          takeaways: document.querySelectorAll('.sec .short li').length, subs: document.querySelectorAll('.blks > .sub').length, strips: document.querySelectorAll('.blk > .call').length,
          tasks: document.querySelectorAll('.gcard .trow').length, mapCards: document.querySelectorAll('.gcard').length, navRows: document.querySelectorAll('#nav .nav-i').length,
          twoState: document.querySelectorAll('.blk[data-state]').length, widgets: document.querySelectorAll('.wdg').length, title: document.title, h1: document.querySelector('h1') && document.querySelector('h1').textContent })''')
        if st['takeaways'] != st['sections'] * 3: problems.append(('structure', 'every section needs exactly three takeaways', st))
        if st['mapCards'] != st['groups'] or not st['tasks']: problems.append(('structure', 'the map needs one card per group, with tasks', st))
        if not st['title'] or st['title'] != st['h1']: problems.append(('structure', 'the page title and the heading differ', [st['title'], st['h1']]))

        # two-state diagrams flip
        if st['twoState']:
            card = pg.evaluate("() => document.querySelector('.blk[data-state]').id")
            pg.click(f'#{card} .blk-h .seg button[data-s="f"]')
            if pg.get_attribute('#' + card, 'data-state') != 'f': problems.append(('diagram', f'{card} does not switch to its second state'))
            pg.click(f'#{card} .blk-h .seg button[data-s="b"]')
        # every widget survives its controls
        for i in range(st['widgets']):
            w = pg.locator('.wdg').nth(i); card = w.evaluate("e => e.closest('[data-id]').dataset.id")
            before = w.inner_text()
            for sel, limit in (('.seg button:not(:disabled)', 8), ('.coll-needs button', 4), ('input[type=checkbox]:not(:disabled)', 4)):
                for j in range(min(w.locator(sel).count(), limit)):
                    try: w.locator(sel).nth(j).click(timeout=2000)
                    except Exception as e: problems.append(('widget', f'{card}: could not use {sel} #{j}: {str(e)[:120]}'))
            after = w.inner_text()
            if not after.strip() or w.locator('.dg-err').count(): problems.append(('widget', f'{card} is empty or failed'))
            if before == after and (w.locator('.seg button').count() > 1 or w.locator('.coll-needs button').count() > 1):
                problems.append(('widget', f'{card}: nothing changed when its controls were used'))
        report['widgets exercised'] = st['widgets']

        # search: a word from a real card finds it, nonsense shows the empty state, clearing restores the page
        word = pg.evaluate('''() => { const t = [...document.querySelectorAll('.blks > .blk .bt')].map(e => e.textContent); const ws = (t[Math.min(2, t.length - 1)] || '').match(/[A-Za-z]{5,}/g) || (t.join(' ').match(/[A-Za-z]{5,}/g) || []); return ws[0] || ''; }''')
        if word:
            pg.fill('#ncs-q', word); pg.wait_for_timeout(250)
            s1 = pg.evaluate('''() => ({ hits: document.getElementById('hits').textContent, shown: [...document.querySelectorAll('.blks > .blk')].filter(e => !e.hidden).length,
              furniture: [document.querySelector('.hero'), document.getElementById('map'), document.getElementById('legend'), ...document.querySelectorAll('.gband')].filter(e => e && !e.hidden).length })''')
            report['search "' + word + '"'] = s1['hits']
            if not s1['shown'] or s1['shown'] >= st['cards'] and st['cards'] > 3: problems.append(('search', f'"{word}" should narrow the cards', s1))
            if s1['furniture']: problems.append(('search', 'the hero, map, legend and bands should hide while searching', s1))
        pg.fill('#ncs-q', 'zzzqqqxx'); pg.wait_for_timeout(250)
        if not pg.is_visible('#empty'): problems.append(('search', 'no empty state for a search without results'))
        pg.fill('#ncs-q', ''); pg.wait_for_timeout(250)
        if not pg.evaluate("() => [...document.querySelectorAll('.blks > .blk, .blks > .sub, .gband, .short, .hero, #map')].every(e => !e.hidden)"):
            problems.append(('search', 'clearing the search does not bring everything back'))

        # jumps
        pg.evaluate("() => scrollTo(0, 0)")
        first_task = pg.evaluate("() => { const b = document.querySelector('.trow .grow'); return b && b.getAttribute('data-to'); }")
        if first_task: pg.click('.trow .grow'); landed('task', first_task)
        also = pg.evaluate("() => { const b = document.querySelector('.also'); return b && b.getAttribute('data-to'); }")
        if also: pg.evaluate("() => scrollTo(0, 0)"); pg.click('.also'); landed('extra section chip', also)
        band = pg.evaluate("() => document.querySelector('.gband').id")
        pg.evaluate("() => scrollTo(0, 0)"); pg.click('.gcard h3 button'); landed('group title', band)
        chip = pg.evaluate("() => document.querySelector('.gband .gchip').getAttribute('data-to')")
        pg.click('.gband .gchip'); landed('band chip', chip)
        sub = pg.evaluate("() => { const b = document.querySelector('.jchip'); return b && b.getAttribute('data-to'); }")
        if sub: pg.click('.jchip'); landed('sub-heading chip', sub)
        if pg.evaluate("() => !!document.getElementById('prog')"):
            pg.evaluate("() => scrollTo(0, 0)"); pg.click('#nav .nav-i[data-to="prog"]'); landed('annotated file', 'prog')
            line = pg.evaluate("() => { const l = document.querySelector('#pmap .pl.to'); return l && l.getAttribute('data-to'); }")
            if line: pg.click('#pmap .pl.to code'); landed('annotated line', line)

        # collapse everything, open it again
        pg.click('#collapse-all'); shut = pg.eval_on_selector_all('.sec.shut', 'els => els.length')
        visible = pg.evaluate("() => [...document.querySelectorAll('.sec .short, .sec .jump, .sec .blks')].filter(e => e.getClientRects().length).length")
        if shut != st['sections'] or visible: problems.append(('collapse', f'{shut} of {st["sections"]} sections closed, {visible} parts still visible'))
        pg.click('#collapse-all')
        if errs: problems.append(('interactions', 'console', errs[:5]))
        ctx.close()

        # ---- phone: the menu, and the task lists start folded
        ctx = br.new_context(viewport={'width': 390, 'height': 844}, color_scheme='light', reduced_motion='reduce')
        pg = ctx.new_page(); errs = []; listen(pg, errs); pg.goto(URL); pg.wait_for_timeout(200)
        if pg.eval_on_selector_all('.gtasks[open]', 'els => els.length'): problems.append(('phone', 'task lists should start folded'))
        pg.click('#menu-btn'); pg.wait_for_timeout(200)
        target = pg.evaluate("() => document.querySelector('#nav .nav-i[data-to^=\"s-\"]').getAttribute('data-to')")
        pg.click(f'#nav .nav-i[data-to="{target}"]'); pg.wait_for_timeout(300)
        t = pg.evaluate("id => Math.round(document.getElementById(id).getBoundingClientRect().top)", target)
        if not (30 <= t <= 130): problems.append(('phone', f'menu jump to #{target} landed at top = {t}'))
        ov = pg.evaluate('() => [document.documentElement.scrollWidth, window.innerWidth]')
        if ov[0] > ov[1] + 1 or pg.evaluate("() => document.body.classList.contains('nav-open')"): problems.append(('phone', 'the menu left the page scrolled sideways or open', ov))
        report['first section starts at (phone)'] = str(pg.evaluate("() => Math.round((document.querySelector('.sec').getBoundingClientRect().top + scrollY) / innerHeight * 10) / 10")) + ' screens'
        if errs: problems.append(('phone', 'console', errs[:5]))
        ctx.close()
        br.close()

    print('structure  ', json.dumps(st, ensure_ascii=False))
    print('interaction', json.dumps(report, ensure_ascii=False))
    print('screenshots to look at (' + str(len(made)) + '):')
    for m in made: print('  ', m)
    print('PROBLEMS:' if problems else 'no problems found')
    for pr in problems: print('  ', json.dumps(pr, ensure_ascii=False)[:600])
    sys.exit(1 if problems else 0)

run()
