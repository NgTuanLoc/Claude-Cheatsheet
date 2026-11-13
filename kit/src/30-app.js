/* ===== Page builder: groups, sections, cards, widgets, nav, search, theme. All content comes from the sheet (window.NCS_*). ===== */
(function () {
  'use strict';
  var SECS = window.NCS || [], esc = DG.esc, META = window.NCS_META || {};
  /* groups decide the reading order: group -> its sections -> their cards */
  var GROUPS = window.NCS_GROUPS || [], SEC = {};
  SECS.forEach(function (s) { SEC[s.id] = s; });
  GROUPS.forEach(function (g) {
    g.sections = g.secs.map(function (id) { if (!SEC[id]) console.error('Group lists an unknown section', id); return SEC[id]; }).filter(Boolean);
    g.sections.forEach(function (s) { s.g = g; });
  });
  SECS.forEach(function (s) { if (!s.g) console.error('Section is in no group', s.id); });
  /* languages: the kit's table, plus whatever the sheet adds or changes in NCS_LANGS */
  var LANGS = {}, DEF = META.lang || 'text';
  [window.NCS_LANGDEFS || {}, window.NCS_LANGS || {}].forEach(function (src) {
    Object.keys(src).forEach(function (k) { LANGS[k] = Object.assign({}, LANGS[k], src[k]); });
  });
  function many(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var COPY = {};

  /* inline markup: `code`, **bold**, *italic* — never inside code spans */
  function inl(s) {
    return String(s == null ? '' : s).split('`').map(function (part, i) {
      if (i % 2) return '<code>' + esc(part) + '</code>';
      return esc(part).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>');
    }).join('');
  }
  function plain(s) { return String(s || '').replace(/`/g, '').replace(/\*\*/g, ''); }

  /* ---- tiny syntax highlighter: one pass per line, driven by the language table ---- */
  var COM = { c: '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/', block: '\\/\\*[\\s\\S]*?\\*\\/', sql: '--[^\\n]*', hash: '#[^\\n]*', xml: '<!--[\\s\\S]*?-->', none: '(?!)' };
  var DQ = '"(?:[^"\\\\\\n]|\\\\.)*"', SQ = '\'(?:[^\'\\\\\\n]|\\\\.)*\'', BT = '`(?:[^`\\\\]|\\\\.)*`';
  var STR = { c: '@?\\$*' + DQ + '|' + SQ, sh: DQ, q: DQ + '|' + SQ, all: DQ + '|' + SQ + '|' + BT };
  var NUM = { c: '\\b\\d[\\d_]*(?:\\.\\d+)?(?:[mMdDfFL])?\\b', sh: '\\b\\d[\\d_.]*\\b' };
  var ATTR = { cs: '\\[[A-Z][A-Za-z]*(?=[\\(\\],])', at: '@[A-Za-z_][\\w.]*', none: '\\[(?!)' };
  var HL = {};
  function words(str) { var o = {}; String(str || '').split(/\s+/).forEach(function (w) { if (w) o[w] = 1; }); return o; }
  function langOf(lang) {
    if (HL[lang]) return HL[lang];
    var d = LANGS[lang] || {};
    return (HL[lang] = { d: d, kws: words(d.kw), cmds: words(d.cmd),
      src: '(' + (COM[d.com] || COM.c) + ')|(' + (STR[d.str] || STR.c) + ')|(' + (NUM[d.num] || NUM.c) + ')|(' + (ATTR[d.attr] || ATTR.none) + ')|([A-Za-z_][\\w]*)' });
  }
  function hlLine(src, lang) {
    if (lang === 'text' || !LANGS[lang]) return esc(src);
    var L = langOf(lang), d = L.d, re = new RegExp(L.src, 'g'), out = '', last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index)); last = re.lastIndex;
      var t = m[0];
      if (m[1]) out += '<span class="tk-com">' + esc(t) + '</span>';
      else if (m[2]) out += '<span class="tk-str">' + esc(t) + '</span>';
      else if (m[3]) out += '<span class="tk-num">' + esc(t) + '</span>';
      else if (m[4]) out += t.charAt(0) === '[' ? '[<span class="tk-at">' + esc(t.slice(1)) + '</span>' : '<span class="tk-at">' + esc(t) + '</span>';
      else {
        var key = d.ci ? t.toLowerCase() : t, next = src.charAt(last), before = src.slice(0, m.index);
        if (L.kws[key]) out += '<span class="tk-kw">' + esc(t) + '</span>';
        else if (d.fn === 'call' && next === '(' && !/\bnew\s*$/.test(before)) out += '<span class="tk-fn">' + esc(t) + '</span>';
        else if (d.types && /^[A-Z]/.test(t)) out += '<span class="tk-type">' + esc(t) + '</span>';
        else if (d.tag && /<\/?$/.test(before)) out += '<span class="tk-type">' + esc(t) + '</span>';
        else if (d.fn === 'key' && next === ':') out += '<span class="tk-fn">' + esc(t) + '</span>';
        else if (d.fn === 'cmd' && /^\s*$/.test(before) && (d.cmd ? L.cmds[t] : next !== '=')) out += '<span class="tk-fn">' + esc(t) + '</span>';
        else out += esc(t);
      }
    }
    return out + esc(src.slice(last));
  }
  function trimCode(code) { return String(code || '').replace(/^\n+|\s+$/g, ''); }
  function hl(code, lang) {
    return trimCode(code).split('\n').map(function (line) {
      var cls = line.indexOf('✗') > -1 ? ' ln-b' : line.indexOf('✓') > -1 ? ' ln-g' : '';
      return '<span class="ln' + cls + '">' + (hlLine(line, lang) || ' ') + '</span>';
    }).join('');
  }
  function codeBox(code, lang) { return '<pre class="src"><code>' + hl(code, lang) + '</code></pre>'; }
  function cpBtn(key, text, label) { COPY[key] = trimCode(text); return '<button class="cp" type="button" data-copy="' + esc(key) + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>Copy</button>'; }
  /* version badges: the sheet says which versions count as new (teal) or next (violet) */
  var BADGES = (META.badges || []).filter(function (b) { return b.match; }).map(function (b) { return { re: new RegExp(b.match), tone: b.tone }; });
  function verCls(v) { for (var i = 0; i < BADGES.length; i++) if (BADGES[i].re.test(v)) return ' v-' + BADGES[i].tone; return ''; }
  function note(s) { return s ? '<p class="note">' + inl(s) + '</p>' : ''; }
  function head(b, tools) {
    var tag = b.sec.subs.length ? 'h4' : 'h3';          /* card titles sit one level below a sub-heading */
    return '<header class="blk-h"><' + tag + ' class="bt">' + inl(b.t) + '</' + tag + '><span class="tools">' +
      (b.v ? '<span class="ver' + verCls(b.v) + '" title="Version that introduced it">' + esc(b.v) + '</span>' : '') + (tools || '') + '</span></header>';
  }

  /* ---- blocks: cards, sub-headings and the few callouts that belong to a whole section ---- */
  var IDX = {}, CARDS = 0;
  SECS.forEach(function (s) {
    var nc = 0, cur = null;
    s.cards = 0; s.subs = [];
    s.blocks.forEach(function (b) {
      b.sec = s;
      if (b.k === 'sub') { b.id = 'sub-' + s.id + '-' + (s.subs.length + 1); b.n = 0; cur = b; s.subs.push(b); return; }
      if (b.k === 'call') b.id = 'call-' + s.id + '-' + (++nc);
      else { CARDS++; s.cards++; if (cur) cur.n++; }
      if (IDX[b.id]) console.error('Duplicate block id', b.id);
      IDX[b.id] = b;
    });
  });
  var KL = { trap: 'Trap', tip: 'Tip', key: 'Key point' };
  function callHTML(c, attrs) { return '<p class="call call-' + c.kind + '"' + (attrs || '') + '><b class="kl">' + KL[c.kind] + '</b>' + inl(c.text) + '</p>'; }
  function cardsLabel(n) { return n + (n === 1 ? ' card' : ' cards'); }
  function blockHTML(b) {
    var h = '', cls = 'blk' + (b.half ? ' half' : ''), attrs = '';
    switch (b.k) {
      case 'sub':
        return '<h3 class="sub" id="' + b.id + '"><span>' + inl(b.t) + '</span><span class="n">' + cardsLabel(b.n) + '</span></h3>';
      case 'snip': {
        var lg = b.lang && b.lang !== DEF ? '<span class="lang">' + esc((LANGS[b.lang] || {}).n || b.lang) + '</span>' : '';
        h = head(b, lg + cpBtn(b.id + ':code', b.code, 'Copy code: ' + plain(b.t))) + codeBox(b.code, b.lang || DEF) + note(b.note);
        break;
      }
      case 'gb': {
        var lang = b.lang || DEF;
        h = head(b) + '<div class="gb">' +
          '<div class="gb-c gb-b"><div class="gb-h"><span class="verdict">✗ Avoid</span>' + cpBtn(b.id + ':bad', b.bad, 'Copy the version to avoid') + '</div>' + codeBox(b.bad, lang) + note(b.badNote) + '</div>' +
          '<div class="gb-c gb-g"><div class="gb-h"><span class="verdict">✓ Prefer</span>' + cpBtn(b.id + ':good', b.good, 'Copy the preferred version') + '</div>' + codeBox(b.good, lang) + note(b.goodNote) + '</div></div>';
        break;
      }
      case 'table':
        h = head(b) + '<div class="tbl-wrap"><table class="tbl' + (b.first === 'mono' ? ' mono1' : '') + '"><thead><tr>' +
          b.cols.map(function (c) { return '<th scope="col">' + inl(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          b.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td data-l="' + esc(plain(b.cols[i])) + '">' + inl(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>' + note(b.note);
        break;
      case 'dg':
        if (b.seg) {
          attrs = ' data-state="b"';
          h = head(b, '<span class="seg" role="group" aria-label="Diagram state"><button type="button" data-s="b" aria-pressed="true">' + esc(b.seg[0]) + '</button><button type="button" data-s="f" aria-pressed="false">' + esc(b.seg[1]) + '</button></span>') +
            '<figure class="dgf"><div class="dgf-top"><figcaption><span class="st-b">' + inl(b.capB) + '</span><span class="st-f">' + inl(b.capF) + '</span></figcaption></div>' +
            '<div class="dg-scroll"><div class="st-b">' + DG.render(Object.assign({ alt: plain(b.seg[0] + ': ' + b.capB) }, b.b)) + '</div><div class="st-f">' + DG.render(Object.assign({ alt: plain(b.seg[1] + ': ' + b.capF) }, b.f)) + '</div></div></figure>';
        } else {
          h = head(b) + '<figure class="dgf"><div class="dgf-top"><figcaption>' + inl(b.cap) + '</figcaption></div><div class="dg-scroll">' + DG.render(Object.assign({ alt: plain(b.cap) }, b.d)) + '</div></figure>';
        }
        break;
      case 'widget':
        h = head(b) + '<div class="wdg" data-w="' + b.w + '"></div>';
        break;
      case 'call':
        return callHTML(b, ' id="c-' + b.id + '" data-id="' + b.id + '"');
    }
    /* a trap, tip or key point that belongs to this card is drawn as its last strip */
    return '<article class="' + cls + '" id="c-' + b.id + '" data-id="' + b.id + '"' + attrs + '>' + h + (b.call ? callHTML(b.call) : '') + '</article>';
  }

  /* ---- groups, sections, nav ---- */
  var chev = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* every section opens the same way: what it is, three takeaways, where to jump, then the cards */
  function sectionHTML(s) {
    return '<section class="sec" id="s-' + s.id + '" data-s="' + s.id + '" data-g="' + s.g.id + '" aria-labelledby="h-' + s.id + '"><div class="sec-h"><span class="code">' + s.code + '</span><h2 id="h-' + s.id + '">' + esc(s.name) + '</h2>' +
      '<span class="ct">' + cardsLabel(s.cards) + '</span><button class="sec-tg" type="button" aria-expanded="true" aria-controls="b-' + s.id + '" aria-label="Collapse ' + esc(s.name) + '">' + chev + '</button></div>' +
      '<p class="sec-blurb">' + inl(s.blurb) + '</p>' +
      (s.short ? '<div class="short"><p class="short-k">In short</p><ul>' + s.short.map(function (t) { return '<li>' + inl(t) + '</li>'; }).join('') + '</ul></div>' : '') +
      (s.subs.length ? '<div class="jump"><span class="jump-k">In this section</span>' + s.subs.map(function (b) {
        return '<button class="jchip" type="button" data-to="' + b.id + '">' + inl(b.t) + '<span class="n">' + b.n + '</span></button>';
      }).join('') + '</div>' : '') +
      '<div class="blks" id="b-' + s.id + '">' + s.blocks.map(blockHTML).join('') + '</div></section>';
  }
  /* optional: one annotated file that opens a group and links each line to the section that explains it */
  var PROG = META.prog && META.prog.lines && META.prog.lines.length ? META.prog : null;
  var progCode = PROG ? esc(PROG.code || 'MAIN') : '', progNav = PROG ? esc(PROG.nav || 'Annotated file') : '';
  var progRow = '<button class="nav-i" type="button" data-to="prog"><span class="c">' + progCode + '</span><span class="n">' + progNav + '</span></button>';
  var sh = '', nav = '';
  GROUPS.forEach(function (g) {
    g.cards = g.sections.reduce(function (n, s) { return n + s.cards; }, 0);
    sh += '<div class="gband" id="g-' + g.id + '" data-g="' + g.id + '"><p class="gk">' + many(g.sections.length, 'section') + ' · ' + many(g.cards, 'card') + '</p>' +
      '<h2>' + esc(g.name) + '</h2><p class="gq">' + esc(g.q) + '</p><div class="gchips">' + g.sections.map(function (s) {
        return '<button class="gchip" type="button" data-to="s-' + s.id + '"><span class="c">' + s.code + '</span>' + esc(s.name) + '</button>';
      }).join('') + '</div></div>';
    if (PROG && g.id === PROG.group) sh += '<article class="blk prog" id="prog" aria-labelledby="prog-h"><header class="blk-h"><h3 class="bt" id="prog-h">' + inl(PROG.title || PROG.nav) + '</h3>' +
      '<span class="tools"><span id="pmap-copy"></span></span></header>' +
      '<p class="prog-cap">' + inl(PROG.cap || 'Each tagged line jumps to the section that explains it.') + '</p>' +
      '<div class="prog-body"><div class="pmap" id="pmap"></div><ul class="prog-secs" id="prog-secs" aria-label="Sections this file touches"></ul></div></article>';
    nav += '<div class="nav-g" data-g="' + g.id + '"><button class="nav-gh" type="button" aria-expanded="true" title="' + esc(g.q) + '"><span>' + esc(g.name) + '</span><span class="chev">' + chev + '</span></button><ul class="nav-list">';
    if (PROG && g.id === PROG.group) nav += '<li>' + progRow + '</li>';
    g.sections.forEach(function (s) {
      sh += sectionHTML(s);
      nav += '<li><button class="nav-i" type="button" data-to="s-' + s.id + '"><span class="c">' + s.code + '</span><span class="n">' + esc(s.name) + '</span><span class="ct">' + s.cards + '</span></button></li>';
    });
    nav += '</ul></div>';
  });
  $('#secs').innerHTML = sh;
  $('#nav').innerHTML = nav;
  $('#side-meta').textContent = many(CARDS, 'card') + ' · ' + many(SECS.length, 'section') + ' · ' + many(GROUPS.length, 'group');

  /* ---- page furniture that the sheet words: hero, map blurb, legend, search hints, footer ---- */
  var TITLE = META.title || 'Cheatsheet', SEARCH = META.search || {};
  /* meta text takes the same inline markup as cards, plus [label](https://…) links and the {count} token */
  function rich(str) {
    return inl(str).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace('{count}', '<span id="foot-count">' + many(CARDS, 'card') + ' across ' + many(SECS.length, 'section') + '</span>');
  }
  $('#side-brand').textContent = TITLE;
  var now = (META.now && META.now.items) || [];
  $('#hero').innerHTML = '<p class="eyebrow" id="eyebrow">' + many(GROUPS.length, 'group') + ' · ' + many(SECS.length, 'section') + ' · ' + many(CARDS, 'card') + '</p>' +
    '<h1>' + esc(TITLE) + '</h1><p class="lede">' + rich(META.lede || '') + '</p>' +
    (now.length ? '<div class="now"' + (now.length < 3 ? ' data-n="' + now.length + '"' : '') + ' role="list" aria-label="' + esc(META.now.label || 'Status') + '">' + now.map(function (x) {
      return '<div class="now-i now-' + (x.tone || 'g') + '" role="listitem"><b>' + esc(x.t) + '</b>' + inl(x.d) + '</div>';
    }).join('') + '</div>' : '');
  $('#map-blurb').innerHTML = rich(META.map || 'The groups are in reading order.') + ' Each card lists the group\'s sections and the tasks people most often come for.';
  var legend = (META.badges || []).filter(function (b) { return b.eg; });
  var interactive = SECS.some(function (s) { return s.blocks.some(function (b) { return b.k === 'widget' || b.seg; }); });
  var tryIt = META.tryIt || (interactive ? 'Some diagrams flip between two states, and the widgets react to your choices.' : '');
  $('#howto').innerHTML =
    '<li><span class="k">Sections</span><span>Each one opens the same way: what it is, three things to remember, then the cards. Long sections are split by sub-headings you can jump to.</span></li>' +
    '<li><span class="k">Strips</span><span>A coloured strip at the bottom of a card is about that card: <span class="lk lk-trap">Trap</span> <span class="lk lk-tip">Tip</span> <span class="lk lk-key">Key point</span></span></li>' +
    (legend.length ? '<li><span class="k">Badges</span><span class="vkey">' + legend.map(function (b) {
      return '<span class="vk"><span class="ver' + (b.tone ? ' v-' + b.tone : '') + '">' + esc(b.eg) + '</span>' + inl(b.d) + '</span>';
    }).join('') + '</span></li>' : '') +
    '<li><span class="k">Code</span><span><span style="color:var(--rose)">✗</span> and <span style="color:var(--teal)">✓</span> lines mark the culprit and the cure. Every block has Copy; <b>Wrap</b> folds long lines on small screens.</span></li>' +
    (tryIt ? '<li><span class="k">Try it</span><span>' + inl(tryIt) + '</span></li>' : '') +
    '<li><span class="k">Search</span><span>Press <kbd>/</kbd> and type ' + inl(SEARCH.hint || 'a name, a concept or an error message.') + '</span></li>';
  $('#empty').innerHTML = 'No card matches that search. ' + inl(SEARCH.empty || 'Try fewer or different words.');
  $('#foot').innerHTML = (META.foot || ['{count}.']).map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('');

  /* ---- the annotated file ---- */
  if (PROG) {
    $('#pmap').innerHTML = PROG.lines.map(function (p) {
      var s = SEC[p[0]], code = '<code>' + (p[1] ? hlLine(p[1], PROG.lang || DEF) : ' ') + '</code>';
      if (!s) return '<div class="pl"><span class="pg"></span>' + code + '</div>';
      return '<div class="pl to" data-to="s-' + s.id + '" data-s="' + s.id + '" title="' + esc(s.name) + '"><button class="pg" type="button" data-to="s-' + s.id + '" aria-label="' + esc(s.name) + '">' + s.code + '</button>' + code + '</div>';
    }).join('');
    $('#pmap-copy').outerHTML = cpBtn('prog', PROG.lines.map(function (p) { return p[1]; }).join('\n'), PROG.copy || 'Copy the file');
    var progSeen = {}, progSecs = [];
    PROG.lines.forEach(function (p) { var x = SEC[p[0]]; if (x) { if (!progSeen[x.id]) { progSeen[x.id] = { s: x, n: 0 }; progSecs.push(progSeen[x.id]); } progSeen[x.id].n++; } });
    $('#prog-secs').innerHTML = '<li class="glabel">Sections this file touches</li>' + progSecs.map(function (x) {
      return '<li><button class="grow" type="button" data-to="s-' + x.s.id + '" data-s="' + x.s.id + '"><span class="c">' + x.s.code + '</span><span class="n">' + esc(x.s.name) + '</span>' +
        '<span class="ct">' + x.n + (x.n === 1 ? ' line' : ' lines') + '</span></button></li>';
    }).join('');
    var progHot = function (id) {
      $$('#prog .hot').forEach(function (x) { if (x.getAttribute('data-s') !== id) x.classList.remove('hot'); });
      if (id) $$('#prog [data-s="' + id + '"]').forEach(function (x) { x.classList.add('hot'); });
    };
    ['mouseover', 'focusin'].forEach(function (evt) {
      $('#prog').addEventListener(evt, function (e) { var l = e.target.closest('[data-s]'); progHot(l ? l.getAttribute('data-s') : null); });
    });
    $('#prog').addEventListener('mouseleave', function () { progHot(null); });
  }

  /* ---- the map: one card per group, listing its sections and the tasks people come for ---- */
  var TASKS = (window.NCS_TASKS || []).map(function (row, i) {
    var ids = row[2].filter(function (id) { if (!IDX[id]) console.error('Task points at a missing card', id); return IDX[id]; });
    return { t: row[0], hint: row[1], ids: ids, sec: IDX[ids[0]].sec, i: i };
  });
  $('#map-grid').innerHTML = GROUPS.map(function (g) {
    var tasks = TASKS.filter(function (t) { return t.sec.g === g; })
      .sort(function (a, b) { return g.sections.indexOf(a.sec) - g.sections.indexOf(b.sec) || a.i - b.i; });
    return '<article class="gcard" data-g="' + g.id + '"><header><h3><button type="button" data-to="g-' + g.id + '">' + esc(g.name) + '</button></h3>' +
      '<p class="gq">' + esc(g.q) + '</p></header>' +
      '<p class="glabel">Sections<span class="ct">' + cardsLabel(g.cards) + '</span></p><ul class="glist">' +
      (PROG && g.id === PROG.group ? '<li><button class="grow" type="button" data-to="prog"><span class="c">' + progCode + '</span><span class="n">' + progNav + '</span></button></li>' : '') +
      g.sections.map(function (s) {
        return '<li><button class="grow" type="button" data-to="s-' + s.id + '"><span class="c">' + s.code + '</span><span class="n">' + esc(s.name) + '</span><span class="ct">' + s.cards + '</span></button></li>';
      }).join('') + '</ul>' +
      '<details class="gtasks" open><summary>I want to…<span class="ct">' + many(tasks.length, 'task') + '</span></summary><ul class="glist">' + tasks.map(function (t) {
        /* the task opens its first card; a small chip follows for each other section it touches */
        var seen = {}; seen[t.sec.id] = 1;
        var also = t.ids.slice(1).filter(function (id) { var s = IDX[id].sec; if (seen[s.id]) return false; seen[s.id] = 1; return true; });
        return '<li class="trow"><button class="grow" type="button" data-to="c-' + t.ids[0] + '" title="' + esc(plain(t.hint)) + '"><span class="c">' + t.sec.code + '</span><span class="n">' + inl(t.t) + '</span></button>' +
          also.map(function (id) {
            var b = IDX[id], label = b.sec.name + ': ' + plain(b.t);
            return '<button class="also" type="button" data-to="c-' + id + '" title="' + esc(label) + '" aria-label="Also in ' + esc(label) + '">' + b.sec.code + '</button>';
          }).join('') + '</li>';
      }).join('') + '</ul></details></article>';
  }).join('');
  $('#map-ct').textContent = many(SECS.length, 'section') + ' · ' + many(TASKS.length, 'task');
  /* on a phone the task lists start folded, so the six groups fit in a couple of screens */
  if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) $$('.gtasks').forEach(function (d) { d.removeAttribute('open'); });

  /* ======================= widgets ======================= */
  function segHTML(key, opts, cur, label) {
    return '<span class="seg" role="group" aria-label="' + esc(label) + '" data-k="' + key + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + esc(o) + '" aria-pressed="' + (o === cur) + '">' + esc(o) + '</button>';
    }).join('') + '</span>';
  }
  function bindSeg(root, onPick) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.seg[data-k] button'); if (!b || !root.contains(b)) return;
      var seg = b.parentNode;
      $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      onPick(seg.getAttribute('data-k'), b.getAttribute('data-v'));
    });
  }

  /* built-in "picker": choose what you need on the left, get the answer and its code on the right */
  function pickerWidget(el, b) {
    var C = b.items, cur = 0, label = b.label || 'What you need';
    el.innerHTML = '<div class="coll"><div class="coll-needs" role="group" aria-label="' + esc(label) + '">' + C.map(function (c, i) {
      return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(c.need) + '</button>';
    }).join('') + '</div><label class="coll-sel"><span>' + esc(b.prompt || 'I need to') + '</span><select aria-label="' + esc(label) + '">' + C.map(function (c, i) {
      return '<option value="' + i + '">' + esc(c.need) + '</option>';
    }).join('') + '</select></label><div class="coll-out" aria-live="polite"></div></div>';
    function render() {
      var c = C[cur];
      $('.coll-out', el).innerHTML = '<div class="ty"><span>' + esc(c.use) + '</span>' + (c.hint ? '<small>' + esc(c.hint) + '</small>' : '') +
        (c.code ? '<span style="margin-left:auto">' + cpBtn(b.id + ':' + cur, c.code, 'Copy example') + '</span>' : '') + '</div>' +
        (c.code ? codeBox(c.code, c.lang || b.lang || DEF) : '') + (c.why ? '<p><b>' + esc(b.watch || 'Watch out:') + '</b> ' + inl(c.why) + '</p>' : '');
    }
    el.addEventListener('click', function (e) {
      var btn = e.target.closest('.coll-needs button'); if (!btn) return;
      pick(+btn.getAttribute('data-i'));
    });
    $('select', el).addEventListener('change', function () { pick(+this.value); });
    function pick(i) {
      cur = i; $('select', el).value = String(i);
      $$('.coll-needs button', el).forEach(function (x) { x.setAttribute('aria-pressed', String(+x.getAttribute('data-i') === i)); });
      render();
    }
    render();
  }

  /* built-in "steps": an ordered list, with an optional second version that shows the classic mistakes */
  function stepsWidget(el, b) {
    var modes = b.modes || ['Right order', 'Broken order'], mode = modes[0], rails = b.rails;
    el.innerHTML = (b.bad ? '<div class="wdg-row">' + segHTML('m', modes, mode, b.label || 'Version') + '</div>' : '') +
      '<div class="mw' + (rails ? '' : ' mw-plain') + '">' + (rails ? '<div class="rail down" aria-hidden="true">' + esc(rails[0]) + '</div>' : '') +
      '<ol class="mw-list" aria-live="polite"></ol>' + (rails ? '<div class="rail up" aria-hidden="true">' + esc(rails[1]) + '</div>' : '') + '</div>' +
      (b.note ? '<p class="note" style="border:0;padding:0">' + inl(b.note) + '</p>' : '');
    function render() {
      var list = mode === modes[0] ? b.good : b.bad;
      $('.mw-list', el).innerHTML = list.map(function (x, i) {
        return '<li class="mw-i' + (x[2] ? ' ' + x[2] : '') + '"><span class="ix">' + (i + 1) + '</span><code>' + esc(x[0]) + '</code><span class="d">' + inl(x[1]) + '</span></li>';
      }).join('');
    }
    bindSeg(el, function (k, v) { mode = v; render(); });
    render();
  }

  /* a sheet adds its own widgets in NCS_WIDGETS: id -> function (el, block, kit) */
  var KIT = { $: $, $$: $$, esc: esc, inl: inl, plain: plain, seg: segHTML, bindSeg: bindSeg, code: codeBox, copy: cpBtn, hl: hlLine, lang: DEF };
  var WIDGETS = Object.assign({ picker: pickerWidget, steps: stepsWidget }, window.NCS_WIDGETS || {});
  $$('.wdg[data-w]').forEach(function (el) {
    try { WIDGETS[el.getAttribute('data-w')](el, IDX[el.closest('[data-id]').getAttribute('data-id')], KIT); }
    catch (err) { console.error('Widget failed', err); el.innerHTML = '<div class="dg-err">This widget failed to load: ' + esc(err.message) + '</div>'; }
  });

  /* ======================= interactions ======================= */
  var side = $('#side'), scrim = $('#scrim'), mb = $('#menu-btn');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function openNav() { document.body.classList.add('nav-open'); scrim.hidden = false; mb.setAttribute('aria-expanded', 'true'); }
  function closeNav() { document.body.classList.remove('nav-open'); scrim.hidden = true; mb.setAttribute('aria-expanded', 'false'); }
  function setShut(sec, on) {
    sec.classList.toggle('shut', on);
    var t = $('.sec-tg', sec); t.setAttribute('aria-expanded', String(!on));
    t.setAttribute('aria-label', (on ? 'Expand ' : 'Collapse ') + $('h2', sec).textContent);
  }
  function go(id) {
    var el = document.getElementById(id); if (!el) return;
    if (el.hidden && q.value) { q.value = ''; filter(); }
    var sec = el.closest('.sec'); if (sec && sec.classList.contains('shut')) setShut(sec, false);
    closeNav();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (el.classList.contains('blk') || el.classList.contains('call') || el.classList.contains('sub')) { el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1400); }
  }
  function copyText(btn, txt) {
    var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1300); };
    var fallback = function () {
      try { var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
      catch (e) { btn.textContent = 'Select & copy'; }
    };
    try { navigator.clipboard.writeText(txt).then(done, fallback); } catch (e) { fallback(); }
  }
  document.addEventListener('click', function (ev) {
    var cp = ev.target.closest('[data-copy]');
    if (cp) { copyText(cp, COPY[cp.getAttribute('data-copy')] || ''); return; }
    var t = ev.target.closest('[data-to]');
    if (t) { ev.preventDefault(); go(t.getAttribute('data-to')); return; }
    var sb = ev.target.closest('.blk[data-state] .blk-h .seg button');
    if (sb) {
      var card = sb.closest('.blk'), s = sb.getAttribute('data-s');
      card.setAttribute('data-state', s);
      $$('.seg button', card).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === s)); });
      return;
    }
    var tg = ev.target.closest('.sec-tg');
    if (tg) { var sec = tg.closest('.sec'); setShut(sec, !sec.classList.contains('shut')); return; }
    var ngh = ev.target.closest('.nav-gh');
    if (ngh) { var ng = ngh.parentNode, shut = !ng.classList.contains('shut'); ng.classList.toggle('shut', shut); ngh.setAttribute('aria-expanded', String(!shut)); }
  });
  var allShut = false;
  $('#collapse-all').addEventListener('click', function () {
    allShut = !allShut;
    $$('.sec').forEach(function (s) { setShut(s, allShut); });
    this.setAttribute('aria-pressed', String(allShut));
    $('#collapse-lbl').textContent = allShut ? 'Expand all' : 'Collapse all';
  });

  /* theme */
  $('#theme-btn').addEventListener('click', function () {
    var root = document.documentElement, cur = root.getAttribute('data-theme');
    if (!cur) cur = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ncs-theme', next); } catch (e) { }
  });

  /* wrap long lines */
  var wrapBtn = $('#wrap-btn'), wrap = null;
  try { wrap = localStorage.getItem('ncs-wrap'); } catch (e) { }
  wrap = wrap === null ? !!(window.matchMedia && window.matchMedia('(max-width: 760px)').matches) : wrap === '1';
  function setWrap(on) { wrap = on; document.body.classList.toggle('wrap', on); wrapBtn.setAttribute('aria-pressed', String(on)); }
  setWrap(wrap);
  wrapBtn.addEventListener('click', function () { setWrap(!wrap); try { localStorage.setItem('ncs-wrap', wrap ? '1' : '0'); } catch (e) { } });

  /* mobile nav */
  mb.addEventListener('click', function () { document.body.classList.contains('nav-open') ? closeNav() : openNav(); });
  scrim.addEventListener('click', closeNav);

  /* ---- search ---- */
  var q = $('#ncs-q'), hits = $('#hits'), timer;
  q.placeholder = SEARCH.placeholder && !(window.matchMedia && window.matchMedia('(max-width: 760px)').matches) ? SEARCH.placeholder : 'Search the cheatsheet';
  var blocks = $$('.blks > [data-id]'), TEXT = {};
  function btext(b) {
    var parts = [b.sec.code, b.sec.name, b.t, b.v, b.code, b.bad, b.good, b.note, b.badNote, b.goodNote, b.cap, b.capB, b.capF, b.text, b.kw, b.call && b.call.text];
    if (b.rows) parts.push(b.cols.join(' '), b.rows.map(function (r) { return r.join(' '); }).join(' '));
    if (b.k === 'widget') {                                   /* what a widget shows is searchable too */
      if (b.items) parts.push(b.items.map(function (c) { return [c.need, c.use, c.hint, c.code, c.why].join(' '); }).join(' '));
      if (Array.isArray(b.good)) parts.push(b.good.concat(b.bad || []).map(function (x) { return x.join(' '); }).join(' '));
      var w = WIDGETS[b.w];                                   /* a custom widget can add its own search text */
      if (w && w.text) parts.push(typeof w.text === 'function' ? w.text(b) : w.text);
    }
    return parts.filter(Boolean).join(' ').toLowerCase();
  }
  blocks.forEach(function (el) { var id = el.getAttribute('data-id'); TEXT[id] = btext(IDX[id]); });
  function filter() {
    var terms = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean), n = 0, active = terms.length > 0;
    blocks.forEach(function (el) {
      var ok = !active || terms.every(function (t) { return TEXT[el.getAttribute('data-id')].indexOf(t) > -1; });
      el.hidden = !ok; if (ok && active && !el.classList.contains('call')) n++;
    });
    $$('.sec').forEach(function (s) {
      var vis = $$('.blks > [data-id]', s).some(function (b) { return !b.hidden; });
      s.hidden = !vis;
      var ni = $('.nav-i[data-to="' + s.id + '"]'); if (ni) ni.parentNode.hidden = !vis;
    });
    if (PROG) $('.nav-i[data-to="prog"]').parentNode.hidden = active;     /* the annotated file is not a search result */
    $$('.nav-g').forEach(function (g) { g.hidden = !$$('.nav-list li', g).some(function (li) { return !li.hidden; }); });
    /* a sub-heading stays only while one of the cards under it matches */
    $$('.blks').forEach(function (list) {
      var sub = null, any = false;
      Array.prototype.forEach.call(list.children, function (el) {
        if (el.classList.contains('sub')) { if (sub) sub.hidden = active && !any; sub = el; any = false; }
        else if (!el.hidden) any = true;
      });
      if (sub) sub.hidden = active && !any;
    });
    document.body.classList.toggle('searching', active);
    $('.hero').hidden = active; $('#map').hidden = active; $('#legend').hidden = active; if (PROG) $('#prog').hidden = active; $('#nav-top').hidden = active;
    $$('.gband').forEach(function (b) { b.hidden = active; });
    hits.hidden = !active; hits.textContent = n + ' / ' + CARDS;
    $('#empty').hidden = !(active && n === 0 && !$$('.blks > .call').some(function (c) { return !c.hidden; }));
  }
  q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(filter, 90); });
  q.addEventListener('keydown', function (e) { if (e.key === 'Escape') { q.value = ''; filter(); q.blur(); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
    if (e.key === 'Escape') closeNav();
  });

  /* ---- scroll spy ---- */
  var navItems = {}; $$('.nav-i[data-to]').forEach(function (b) { navItems[b.getAttribute('data-to')] = b; });
  $$('.nav-g').forEach(function (g) { navItems['g-' + g.getAttribute('data-g')] = $('.nav-gh', g); });   /* a group band lights its heading */
  var current = null;
  function mark(id) {
    if (current === id) return; current = id;
    $$('.nav-i.on, .nav-gh.on').forEach(function (b) { b.classList.remove('on'); });
    $$('.nav-g.cur').forEach(function (g) { g.classList.remove('cur'); });
    var b = navItems[id]; if (!b) return;
    b.classList.add('on');
    var grp = b.closest('.nav-g'); if (grp) grp.classList.add('cur');                                    /* the group you are in */
    var sr = side.getBoundingClientRect(), br = b.getBoundingClientRect();
    if (br.top < sr.top + 40 || br.bottom > sr.bottom - 40) side.scrollTop += br.top - sr.top - sr.height / 3;
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) mark(en.target.id); });
    }, { rootMargin: '-15% 0px -75% 0px' });
    $$('.sec, .gband').forEach(function (s) { io.observe(s); });
    io.observe($('#map')); io.observe($('#legend')); if (PROG) io.observe($('#prog'));
  }
})();
