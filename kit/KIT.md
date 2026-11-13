# Cheatsheet kit: reference

One cheatsheet = the kit's engine (`kit/src`, never edited per sheet) + one **sheet** folder you write.
`kit/starter/` is a small complete sheet that uses every feature. Copy it and replace the content.

Contents: [Files](#files) · [Commands](#commands) · [Meta](#meta) · [Sections](#sections) · [Cards](#cards) · [Inline markup](#inline-markup) · [Diagrams](#diagrams) · [Widgets](#widgets) · [Languages](#languages) · [Styling rules](#styling-rules) · [Changing the kit](#changing-the-kit)

## Files

```
kit/build.py  check-data.js  shot.py  split.py  pack.py     tools
kit/src/      shell.html style.css 10-render.js 15-setup.js 30-app.js   the engine
kit/starter/  the sample sheet
sheet/00-meta.js          title, texts, groups, tasks
sheet/10-<group>.js ...   sections, one file per group (files load in name order)
sheet/80-widgets.js       optional: your own widgets (any file with "widgets" in its name is treated as code)
sheet/sheet.css           optional: styles for your own widgets
```

## Commands

```bash
python3 kit/build.py sheet -o <name>.html      # validate + assemble; writes nothing if a check fails
python3 kit/shot.py <name>.html --shots shots  # headless checks in light/dark at 1440, 1024, 390 + screenshots
python3 kit/split.py page.html sheet           # recover a sheet's sources from a published page
```

`build.py` needs `node`; `shot.py` needs Python `playwright` with Chromium.

## Meta

`00-meta.js` sets three globals. Only `title`, `lede`, `lang`, the groups and the tasks are required.

```js
window.NCS_META = {
  title: 'Git Starter',              // 2 to 4 words: page title, heading, artifact name
  lang: 'bash',                      // main snippet language (no chip); other languages show a chip
  lede: 'One or two sentences. **Bold** and `code` work.',
  now: { label: 'aria label', items: [{ tone: 'g', t: 'Title', d: 'One line.' }] },   // 0 to 3 tiles; tone g | a | b
  map: 'One sentence that says how the groups are ordered.',
  badges: [ { match: 'C# 14|\\.NET 10', tone: 'new', eg: 'C# 14', d: 'the current LTS' },   // match = regex on a card's v
            { eg: 'C# 12', d: 'older' } ],                                               // eg + d = a legend row
  tryIt: 'Legend sentence about the interactive parts.',      // default text is used when omitted
  search: { placeholder: '…', hint: 'an API or an error: “x”, “y”.', empty: 'Try an API (“x”).' },
  foot: ['Name: {count}. What it targets, when the facts were checked.', 'See also [Other sheet](https://…).'],
  prog: { group: 'app', code: 'MAIN', nav: 'Program.cs, annotated', title: 'One `Program.cs`, annotated',
          cap: 'What the file shows.', copy: 'Copy Program.cs', lang: 'cs',
          lines: [['', 'var builder = …;'], ['di', 'builder.Services.AddScoped<…>();']] }   // optional annotated file
};
window.NCS_GROUPS = [{ id: 'daily', name: 'Everyday work', q: 'The one question this group answers?', secs: ['save', 'branch'] }];
window.NCS_TASKS  = [['Task in the reader\'s words', 'short hint', ['card-id', 'second-card-id']]];
```

- Every section is in exactly one group. Every group has at least one task (a task belongs to the group of its first card).
- `prog` shows one real file line by line at the top of a group; a line tagged with a section id jumps to that section.

## Sections

```js
window.NCS.push({
  id: 'save',                 // lowercase letters/digits; used in links
  code: 'SAVE',               // 2 to 6 capitals: the label in the nav and map
  name: 'Saving changes',
  blurb: 'What this topic is, in plain words. One or two sentences.',
  short: ['Takeaway one.', 'Takeaway two.', 'Takeaway three.'],     // exactly three
  blocks: [ /* cards, sub-headings, callouts */ ]
});
```

## Cards

Every card has `k` (kind), a unique `id` (`section-topic`, lowercase with hyphens) and a title `t`.
Options on any card: `half: true` (half width; must come in adjacent pairs), `v: 'C# 14'` (version badge),
`call: { kind: 'trap' | 'tip' | 'key', text }` (a strip at the bottom of the card), `kw: 'extra search words'`.

| Kind | Fields | Use it for |
|---|---|---|
| `snip` | `code`, `note?`, `lang?` | One code sample |
| `gb` | `bad`, `good`, `badNote?`, `goodNote?`, `note?`, `lang?` | Wrong vs right, side by side |
| `table` | `cols`, `rows`, `first: 'mono'?`, `note?` | Comparing options; first column is the row label |
| `dg` | `cap`, `d` — or `seg`, `capB`, `capF`, `b`, `f` | A diagram, or one that flips between two states |
| `widget` | `w`, plus the widget's own fields | Something the reader operates |
| `{ k: 'sub', t }` | | Sub-heading; use from about 8 cards up |
| `{ k: 'call', kind, text }` | | A note about the whole section (rare; prefer `call` on a card) |

Code is written in a template string that starts with a newline. A `✗` or `✓` anywhere in a line tints the whole
line as the culprit or the cure; put it in a trailing comment so the copied code still runs.

```js
{ k: 'snip', id: 'save-stage', t: 'Stage and commit', code: `
git add -p
git commit -m "Fix rounding"`, note: 'Read it first with `git diff --staged`.' }
```

In data files the build rejects two things, because JavaScript would silently change your sample:
a lone backslash (write `\\n`, `\\d`) and `${` (split it: `'$' + '{x}'`, or reword).

## Inline markup

Titles, notes, captions, table cells, callouts: `` `code` ``, `**bold**`, `*italic*`. Everything else is escaped.
Meta `lede`, `map` and `foot` also take `[label](https://…)`.

## Diagrams

`d` (or `b`/`f`) is a spec with `type`, `w` (width, use 680) and `minw` (width below which it scrolls, about 520).
Colour key `k` on nodes, edges, steps, bars: `n` neutral · `b` bad (rose) · `g` good (teal) · `w` warning (amber) ·
`a` accent (violet) · `s` sky · `m` muted. The build renders every diagram once and fails on a broken spec;
`shot.py` fails on overlapping or clipped labels, so keep labels short.

**flow**: boxes on a grid.
```js
{ type: 'flow', w: 680, cols: 4, rows: 1, ch: 86, minw: 540,          // ch = row height
  nodes: [{ id: 'wt', x: 0, y: 0, l: 'Working tree', sub: 'files you edit', s: 'doc', k: 'w' }],
  edges: [{ f: 'wt', t: 'ix', l: 'add', d: true, k: 'g' }],            // d = dashed
  groups: [{ n: ['q', 'w1'], l: 'thread pool', k: 'b' }] }             // dashed box around nodes
```
Node shapes `s`: default box · `db` · `queue` · `pill` · `ext` (dashed) · `doc` · `browser` · `stack`.

**seq**: who talks to whom, top to bottom.
```js
{ type: 'seq', w: 680, minw: 520, actors: [{ l: 'You', k: 'a' }, 'origin', { l: 'orders', s: 'db' }],
  steps: [{ f: 0, t: 1, l: 'git push' }, { f: 1, t: 0, l: 'ok', d: true, k: 'g' }, { self: 1, l: 'merge' },
          { f: 0, t: 1, l: 'timeout', lost: true, k: 'b' }, { div: 'later' }, { gap: 10 },
          { note: 'A sentence across some actors.', at: [0, 2], k: 'w' }] }
```

**tl**: lanes over time.
```js
{ type: 'tl', w: 680, span: 100, unit: ' ms', lw: 92, minw: 520, lanes: ['Thread 1', 'Thread 2'],
  bars: [{ lane: 0, s: 0, e: 6, l: 'A' }, { lane: 0, s: 6, e: 80, l: 'blocked', k: 'b', wait: true }],
  marks: [{ t: 16, l: 'pool exhausted', k: 'b' }] }
```

**chart**: lines over categories.
```js
{ type: 'chart', w: 680, h: 200, x: ['0', '1', '2', '3'], ymax: 100, yu: '%',
  series: [{ l: 'Gen 0', v: [10, 40, 20, 60], k: 's', area: true }, { l: 'Limit', v: [80, 80, 80, 80], k: 'b', d: true }],
  bands: [{ y: 80, l: 'budget', k: 'w' }], vmarks: [{ x: 2, l: 'GC runs', k: 'g' }] }
```

Two states: `seg: ['Blocking', 'Async']` with `b` + `capB` (first state) and `f` + `capF` (second).
Every caption starts with a bold phrase naming what to notice.

## Widgets

Built in, data only:

```js
// picker: "I need to …" on the left, the answer on the right. hint, code, why, lang are optional per item.
{ k: 'widget', id: 'undo-pick', w: 'picker', t: 'Pick the right undo', prompt: 'I want to',
  items: [{ need: 'Fix the last commit message', use: 'git commit --amend', hint: 'not pushed', code: `…`, why: 'Do it before pushing.' }] }

// steps: an ordered list; with `bad` the reader can flip to the broken version. Third cell: 'bad' (highlight) or 'term' (dashed).
{ k: 'widget', id: 'mw-pipe', w: 'steps', t: 'Middleware order', modes: ['Right order', 'Broken order'], rails: ['request ↓', 'response ↓'],
  good: [['UseRouting()', 'Matches the endpoint.'], ['MapControllers()', 'Runs it.', 'term']],
  bad:  [['UseAuthorization()', 'Runs before authentication: **always 401**.', 'bad']], note: 'Optional closing sentence.' }
```

Your own widget: add a function to `window.NCS_WIDGETS` in `80-widgets.js`, and use its key as `w`.

```js
window.NCS_WIDGETS = {
  ttl: function (el, block, kit) {          // el = the empty container; block = the card's data
    var state = 'Fresh';
    function render() {
      el.innerHTML = '<div class="wdg-row"><span class="wdg-lbl">Entry is</span>' + kit.seg('s', ['Fresh', 'Stale'], state, 'Entry state') + '</div>' +
        '<div class="verdict-line ' + (state === 'Fresh' ? 'ok' : 'warn') + '"><b>' + state + ':</b> ' + kit.inl('served from `cache`.') + '</div>';
    }
    kit.bindSeg(el, function (key, value) { state = value; render(); });
    render();
  }
};
window.NCS_WIDGETS.ttl.text = 'fresh stale ttl';     // optional: extra words for search
```

`kit` gives you `$`, `$$`, `esc`, `inl`, `seg(key, options, current, ariaLabel)`, `bindSeg(el, onPick)`,
`code(text, lang)`, `copy(key, text, label)`, `hl(line, lang)`. Ready-made classes: `.wdg-row`, `.wdg-lbl`,
`.wdg-code`, `.verdict-line.ok|.warn|.bad`, `.seg`. No code at the top level of the file may touch the page:
the build loads it in Node first.

## Languages

`lang` on a card: `cs js ts py go java sql bash json yaml xml html css docker proto text`. Use `ts` for TSX too.
Add or adjust one in the sheet (fields are documented at the top of `kit/src/15-setup.js`):

```js
window.NCS_LANGS = { kt: { n: 'Kotlin', com: 'c', str: 'q', num: 'c', attr: 'at', fn: 'call', types: true, kw: 'fun val var when is in' } };
```

## Styling rules

- Every colour is a token defined three times in `style.css`: bare `:root` (light), the `prefers-color-scheme: dark`
  block, and `:root[data-theme="dark"]`. A new colour goes in all three. Component rules use tokens only.
- Never build a surface by swapping text and page colours (`background: var(--ink)`): it becomes a white slab in
  dark mode. `shot.py` fails on any light surface in dark mode.
- Jumps use `data-to="<id>"` buttons, never `href="#…"` (hash links misbehave inside an artifact).
- The page is one self-contained file: no external scripts, images or fetches. Fonts come from Google Fonts with fallbacks.

## Changing the kit

A change to `kit/src` or the tools affects every sheet, so prove it on real ones: rebuild `kit/starter` and one large
published sheet, run `shot.py` on both, and compare the large sheet with its live version. Then bump `KIT_VERSION`
in `build.py`, run `python3 kit/pack.py cheatsheet-kit.txt`, and republish the Cheatsheet Starter artifact with that
file attached as `cheatsheet-kit.txt` (the starter page itself is `kit/starter` built with the new kit).
