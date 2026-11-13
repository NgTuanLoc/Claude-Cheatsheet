---
name: "cheatsheet-template"
description: "Build or update an interactive HTML cheatsheet in the CheatSheet project's template. Use for any request for a cheatsheet, quick reference or study sheet on a topic, and for any change to an existing one, even when the template is not mentioned."
---

# Cheatsheet template

Loc keeps a library of cheatsheets that all look and work the same: one self-contained HTML page per topic, with
groups, sections and cards, a task map, search, diagrams, widgets, and light and dark themes. Each page is built
from a shared **kit** (the engine and tools) plus a **sheet** (the content you write), and published as an artifact.

Your job is the content. Do not rebuild the engine, restyle the page or write the HTML by hand: the kit already
does that, and using it is what keeps every sheet consistent.

## 1. Get the kit and check the registry

The kit is a file attached to the Cheatsheet Starter artifact. Fetch it to disk and unpack it:

1. Artifact tool, action `read`, url `https://claude.ai/artifact/JfJLbL3CJ22XvyYSjFEdXL`, path `cheatsheet-kit.txt`.
   It is saved to a local file (about 160 kB). Do not print it or Read it whole.
2. In your working folder, run this with the saved path:

```bash
python3 - <path-to>/cheatsheet-kit.txt <<'EOF'
import hashlib, os, re, sys
t = open(sys.argv[1], encoding='utf-8').read().replace('\r\n', '\n')
parts = re.split(r'^=====8<===== (?:FILE (\S+) sha256=(\w+)|END)$', t, flags=re.M)
n = bad = 0
for i in range(1, len(parts) - 3, 3):
    path, sha, body = parts[i], parts[i + 1], parts[i + 2].strip('\n') + '\n'
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'w', encoding='utf-8').write(body)
    n += 1; bad += hashlib.sha256(body.encode()).hexdigest() != sha
print(f'unpacked {n} files:', 'all verified' if not bad else f'{bad} CORRUPT')
EOF
```

You now have `kit/` (tools, `src/` engine, `starter/` sample sheet, `KIT.md`). **Read `kit/KIT.md` before writing
data**: it is the reference for every card kind, diagram type, widget and language.

Then read the project doc `claude/cheatsheet-library.md` (Projects tool). It lists every published sheet with its
artifact URL, and the rules Loc has set. If the topic already has a sheet, you are updating it (step 2b), never
publishing a second one.

If the kit cannot be fetched, say so and stop; a page improvised without it will not match the library.

## 2a. New sheet

```bash
cp -r kit/starter sheet      # then replace its content
```

Plan before writing. Decide the groups first, then sections, then cards:

- **Groups** (2 to 6), in the order a person would learn or build the thing. Each answers one question, written in
  the reader's words ("How do I serve HTTP requests?").
- **Sections** (2 to 6 per group), one topic each, with a 2 to 6 letter code.
- **Cards** (roughly 4 to 12 per section). One idea per card.

For a large topic, show Loc the outline of groups and sections and ask which areas matter most before writing
hundreds of cards. For a small one, just build it.

Research anything that changes over time (current versions, release and end-of-support dates, deprecated APIs) on
the web before you state it, and put the date you checked in the footer.

## 2b. Existing sheet

Read the sheet's artifact (action `read`, its URL) to get the saved HTML file, then recover its sources:

```bash
python3 kit/split.py <saved-page>.html sheet
```

Edit the files in `sheet/`, rebuild, check, and publish to the **same URL**. If `split.py` reports that the page's
engine differs from the kit, that is fine: the rebuild uses the current kit, and the checks in step 4 cover it.

## 3. Write the content

What makes these sheets useful, and why:

- **Common, everyday material only.** Loc removed specialised sections from the first sheet and asked for "just
  common things". If a card would only help one reader in fifty, leave it out or ask.
- **Plain words, short sentences.** He asked for content that is "clear and easy to understand". Explain a term the
  first time it appears. A section's `blurb` says what the topic is, as you would to a colleague new to it.
- **Code first.** Prefer a runnable snippet with a one-line note to a paragraph. Keep lines short enough to fit
  the card; the checks fail on code that scrolls sideways at desktop width.
- **Every section opens the same way:** `blurb`, then `short` with exactly three takeaways, then the cards. From
  about eight cards, split the section with sub-headings.
- **Warnings live on the card they are about.** Use `call: { kind: 'trap' | 'tip' | 'key', text }` on the card, not
  a loose callout, so the reader meets it at the right moment.
- **Use the right card kind.** Wrong versus right is a `gb` card. A choice between options is a `table` or a
  `picker` widget. An order of steps is a `steps` widget. A mechanism (who calls whom, what waits on what, what
  changes over time) is a diagram, ideally a two-state one that shows the problem and the fix.
- **Give the reader something to operate.** Loc likes interactive diagrams and widgets. Aim for at least one
  two-state diagram or widget per group where the topic has a real choice or state in it. Do not force one.
- **Tasks.** `NCS_TASKS` is the "I want to…" list on the map. Write tasks the way a person would search for them,
  and give every group at least one.
- **Title:** two to four words, the name of the thing ("React Cheatsheet"), no subtitle.

## 4. Build, check, look

```bash
python3 kit/build.py sheet -o <name>-cheatsheet.html     # stops with a list if the data is wrong
python3 kit/shot.py <name>-cheatsheet.html --shots shots # must end with "no problems found"
```

Fix every reported problem in the sheet, not in the kit. Then Read four or five of the screenshots it lists (at
least one light, one dark, one phone) and look at them properly: is a diagram cramped, a label cut, a card mostly
empty, a widget confusing? The checks cannot judge that. Notes printed by the build are suggestions worth following.

When you update an existing sheet, also confirm that cards you did not touch are unchanged (compare the old and new
`sheet/` files).

## 5. Publish and record

- Publish the HTML file with the Artifact tool. Follow that tool's own instructions for loading its design
  guidance first; the kit's page already meets the page contract, so do not restructure it.
- New sheet: no `url`, a one-word `icon`, a one-sentence `description`. Existing sheet: pass its `url`.
- Add or update the sheet's row in `claude/cheatsheet-library.md` (read it, change it, write the whole doc back).
- Tell Loc in two or three sentences what the sheet covers and anything he should decide next. He prefers short,
  direct answers with concrete evidence over long explanations.

## Things that go wrong

- **A lone backslash or `${` in a data file.** The build rejects them because JavaScript would silently alter the
  code sample. Write `\\n` and split `${`.
- **Something light in dark mode.** Never make a surface by swapping the text and page colours; `shot.py` fails on
  it. This was a real bug Loc reported.
- **Losing sources.** Nothing needs saving outside the artifact: the published page carries the sheet's files, and
  `split.py` gets them back. The working folder does not survive the session.
- **Wanting a feature the kit lacks.** A custom widget goes in the sheet (`80-widgets.js`, `sheet.css`; see
  KIT.md). Change the kit itself only when every sheet should get the change, and follow "Changing the kit" in
  KIT.md, because it affects all published sheets.