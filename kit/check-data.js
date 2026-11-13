// Validates a sheet before a build: node check-data.js <kit/src> <sheet dir>
// Prints one JSON line: { errs, warns, title, files, groups, sections, cards, subs, attached, standalone, tasks }.
const fs = require('fs'), path = require('path');
const [kitSrc, sheetDir] = process.argv.slice(2);
const errs = [], warns = [];
global.window = { console: { error() {}, log() {} } };
const load = (f) => { try { (0, eval)(fs.readFileSync(f, 'utf8')); } catch (e) { errs.push(path.basename(f) + ' does not load: ' + e.message); } };
load(path.join(kitSrc, '10-render.js'));
load(path.join(kitSrc, '15-setup.js'));
const files = fs.readdirSync(sheetDir).filter(f => /^\d\d-[\w.-]+\.js$/.test(f)).sort();
files.forEach(f => load(path.join(sheetDir, f)));

const S = window.NCS || [], G = window.NCS_GROUPS || [], T = window.NCS_TASKS || [], M = window.NCS_META || {}, W = window.NCS_WIDGETS || {};
const LANGS = Object.assign({}, window.NCS_LANGDEFS, window.NCS_LANGS);
const KINDS = { snip: ['t', 'code'], gb: ['t', 'bad', 'good'], table: ['t', 'cols', 'rows'], dg: ['t'], widget: ['t', 'w'], call: ['kind', 'text'], sub: ['t'] };
const CALLS = ['trap', 'tip', 'key'], DGS = ['seq', 'flow', 'tl', 'chart'];
const str = (v) => typeof v === 'string' && v.trim().length > 0;

// ---- the sheet's meta
if (!window.NCS_META) errs.push('window.NCS_META is missing (title, lede, lang, ...)');
if (!str(M.title)) errs.push('NCS_META.title is missing');
if (!str(M.lede)) errs.push('NCS_META.lede is missing: one or two sentences under the title');
if (!str(M.lang) || !LANGS[M.lang]) errs.push('NCS_META.lang must name the main language of the snippets (one of: ' + Object.keys(LANGS).join(', ') + ')');
if (M.now && (!Array.isArray(M.now.items) || M.now.items.length > 3 || M.now.items.some(x => !str(x.t) || !str(x.d) || (x.tone && !'gab'.includes(x.tone)))))
  errs.push('NCS_META.now.items: at most three tiles, each { tone: g|a|b, t, d }');
(M.badges || []).forEach((b, i) => {
  if (b.match) { try { new RegExp(b.match); } catch (e) { errs.push('NCS_META.badges[' + i + '].match is not a valid regular expression'); } }
  if (b.match && !['new', 'next'].includes(b.tone)) errs.push('NCS_META.badges[' + i + ']: tone must be new or next');
  if (b.eg && !str(b.d)) errs.push('NCS_META.badges[' + i + ']: a legend example (eg) needs a description (d)');
});
if (M.foot && (!Array.isArray(M.foot) || M.foot.some(p => !str(p)))) errs.push('NCS_META.foot must be a list of paragraphs');
if (M.foot && !M.foot.join(' ').includes('{count}')) warns.push('NCS_META.foot has no {count} token, so the footer will not say how many cards the sheet has');

// ---- sections and their blocks
const ids = new Set(), secIds = new Set(), codes = new Set(), cardSec = {};
for (const s of S) {
  if (secIds.has(s.id)) errs.push('dup section ' + s.id);
  secIds.add(s.id);
  for (const k of ['id', 'code', 'name', 'blurb', 'short', 'blocks']) if (!s[k]) errs.push((s.id || '?') + ' missing ' + k);
  if (!/^[a-z][a-z0-9]*$/.test(s.id || '')) errs.push(`section id "${s.id}" must be lowercase letters and digits`);
  if (!/^[A-Z0-9#+.]{2,6}$/.test(s.code || '')) errs.push(`${s.id}: code "${s.code}" must be 2 to 6 capitals or digits`);
  if (codes.has(s.code)) errs.push('two sections share the code ' + s.code);
  codes.add(s.code);
  if (!Array.isArray(s.short) || s.short.length !== 3 || s.short.some(t => !str(t))) errs.push(s.id + ': "short" must be exactly three takeaways');
  if (!Array.isArray(s.blocks)) continue;

  let halves = 0, sub = null, subCards = 0, cards = 0, subs = 0;
  const closeRun = (where) => { if (halves % 2) errs.push(`${s.id}: a half-width card has no partner before ${where}`); halves = 0; };
  const closeSub = () => { if (sub && subCards === 0) errs.push(`${s.id}: sub-heading "${sub.t}" has no cards`); };
  for (const b of s.blocks) {
    if (!KINDS[b.k]) { errs.push(s.id + ': bad kind ' + b.k); continue; }
    for (const f of KINDS[b.k]) if (b[f] == null) errs.push(s.id + '/' + (b.id || '?') + ' missing ' + f);
    if (b.k === 'sub') { closeRun('sub-heading "' + b.t + '"'); closeSub(); sub = b; subCards = 0; subs++; continue; }
    if (b.k === 'call') {
      closeRun('a callout');
      if (!CALLS.includes(b.kind)) errs.push(s.id + ': callout kind ' + b.kind);
      continue;
    }
    // a card
    subCards++; cards++;
    if (!b.id) errs.push(s.id + ': card without id');
    else if (!/^[a-z][a-z0-9-]*$/.test(b.id)) errs.push(`card id "${b.id}" must be lowercase letters, digits and hyphens`);
    else if (ids.has(b.id)) errs.push('dup id ' + b.id);
    else { ids.add(b.id); cardSec[b.id] = s.id; }
    if (b.half) halves++; else closeRun('card ' + b.id);
    if (b.call && (!CALLS.includes(b.call.kind) || !str(b.call.text))) errs.push(b.id + ': attached callout needs a kind (trap, tip, key) and text');
    if (b.k === 'table') {
      if (!Array.isArray(b.cols) || !Array.isArray(b.rows)) errs.push(b.id + ': table needs cols and rows');
      else b.rows.forEach((r, i) => { if (r.length !== b.cols.length) errs.push(b.id + ' row ' + i + ' has ' + r.length + ' cells, expected ' + b.cols.length); });
    }
    if (b.k === 'dg') {
      const specs = b.seg ? [b.b, b.f] : [b.d];
      if (b.seg && !(Array.isArray(b.seg) && b.seg.length === 2 && str(b.capB) && str(b.capF))) errs.push(b.id + ': a two-state diagram needs seg: [labelA, labelB], capB, capF, b and f');
      if (!b.seg && !str(b.cap)) errs.push(b.id + ': diagram needs a caption (cap) that says what to notice');
      specs.forEach((d) => {
        if (!d || !DGS.includes(d.type)) { errs.push(b.id + ': diagram spec missing or of unknown type (use ' + DGS.join(', ') + ')'); return; }
        const out = window.DG ? window.DG.render(d) : '';
        if (/dg-err/.test(out)) errs.push(b.id + ': diagram does not render: ' + out.replace(/<[^>]+>/g, ''));
      });
    }
    if (b.k === 'widget') {
      if (b.w === 'picker') {
        if (!Array.isArray(b.items) || b.items.length < 2 || b.items.some(c => !str(c.need) || !str(c.use))) errs.push(b.id + ': picker needs items: [{ need, use, hint?, code?, why? }, ...]');
      } else if (b.w === 'steps') {
        const ok = (l) => Array.isArray(l) && l.length > 0 && l.every(x => Array.isArray(x) && str(x[0]) && str(x[1]) && (!x[2] || ['bad', 'term'].includes(x[2])));
        if (!ok(b.good) || (b.bad && !ok(b.bad))) errs.push(b.id + ': steps needs good: [[label, text, "bad"|"term"?], ...] and optionally bad');
        if (b.rails && b.rails.length !== 2) errs.push(b.id + ': rails must be two labels');
      } else if (typeof W[b.w] !== 'function') errs.push(`${b.id}: widget "${b.w}" is not built in (picker, steps) and window.NCS_WIDGETS.${b.w} is not a function`);
    }
    if (b.lang && !LANGS[b.lang]) errs.push(b.id + ': unknown lang ' + b.lang);
    for (const f of ['code', 'bad', 'good']) {
      const c = b[f]; if (typeof c !== 'string') continue;
      if (/\t/.test(c)) errs.push(b.id + ': tab character in ' + f);
      if (/\[object Object\]/.test(c)) errs.push(b.id + ': suspicious text in ' + f);
    }
    for (const f of ['note', 'badNote', 'goodNote', 'cap', 'capB', 'capF']) if (b[f] != null && !str(b[f])) errs.push(b.id + ': empty ' + f);
  }
  closeRun('the end of the section'); closeSub();
  if (cards >= 9 && subs === 0) warns.push(`${s.id}: ${cards} cards and no sub-headings; split it with { k: 'sub', t: '...' }`);
  if (cards < 2) warns.push(`${s.id}: only ${cards} card; merge it into a neighbour or add to it`);
}

// ---- groups: every section belongs to exactly one, and every group is complete
const grouped = {};
if (!G.length) errs.push('window.NCS_GROUPS is missing: at least one group { id, name, q, secs }');
for (const g of G) {
  for (const k of ['id', 'name', 'q', 'secs']) if (!g[k]) errs.push('group ' + (g.id || '?') + ' missing ' + k);
  if (!/\?$/.test(String(g.q || '').trim())) warns.push(`group ${g.id}: "q" should be the one question the group answers`);
  for (const id of g.secs || []) {
    if (!secIds.has(id)) errs.push(`group ${g.id} lists unknown section ${id}`);
    if (grouped[id]) errs.push(`section ${id} is in two groups: ${grouped[id]} and ${g.id}`);
    grouped[id] = g.id;
  }
}
for (const id of secIds) if (!grouped[id]) errs.push(`section ${id} is in no group, so it would never render`);

// ---- tasks and the annotated file
const tasksPerGroup = {};
for (const row of T) {
  if (!Array.isArray(row) || !str(row[0]) || !Array.isArray(row[2]) || !row[2].length) { errs.push('task rows are [task, hint, [card ids]]: ' + JSON.stringify(row).slice(0, 80)); continue; }
  for (const id of row[2]) if (!ids.has(id)) errs.push(`task "${row[0]}" -> missing card ${id}`);
  const g = grouped[cardSec[row[2][0]]]; tasksPerGroup[g] = (tasksPerGroup[g] || 0) + 1;
}
for (const g of G) if (!tasksPerGroup[g.id]) errs.push(`group ${g.id} has no tasks: add a row to NCS_TASKS whose first card is in that group`);
if (M.prog) {
  const p = M.prog;
  if (!G.some(g => g.id === p.group)) errs.push('NCS_META.prog.group must be the id of a group');
  if (!str(p.nav) || !str(p.title)) errs.push('NCS_META.prog needs nav and title');
  if (!Array.isArray(p.lines) || !p.lines.length) errs.push('NCS_META.prog.lines must be [[section id or "", code], ...]');
  else for (const l of p.lines) if (l[0] && !secIds.has(l[0])) errs.push('annotated file -> missing section ' + l[0]);
  if (p.lang && !LANGS[p.lang]) errs.push('NCS_META.prog.lang: unknown lang ' + p.lang);
}

const kinds = (k) => S.reduce((n, s) => n + (s.blocks || []).filter(b => b.k === k).length, 0);
const cards = S.reduce((n, s) => n + (s.blocks || []).filter(b => b.k !== 'call' && b.k !== 'sub').length, 0);
console.log(JSON.stringify({ errs: [...new Set(errs)], warns: [...new Set(warns)], title: M.title || '', files, groups: G.length, sections: S.length, cards,
  subs: kinds('sub'), attached: S.reduce((n, s) => n + (s.blocks || []).filter(b => b.call).length, 0), standalone: kinds('call'), tasks: T.length }));
