/* ===== Diagram renderer: data spec -> inline SVG (seq | flow | tl | chart) ===== */
window.DG = (function () {
  'use strict';
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var r = function (n) { return Math.round(n * 10) / 10; };
  var CWF = { sans: 0.555, bold: 0.6, mono: 0.62 };
  function tw(s, fs, f) { return String(s).length * fs * (CWF[f || 'sans']); }
  function wrap(text, maxW, fs, f) {
    var out = [];
    String(text == null ? '' : text).split('\n').forEach(function (par) {
      var words = par.split(/\s+/).filter(Boolean), line = '';
      if (!words.length) { out.push(''); return; }
      words.forEach(function (w) {
        var c = line ? line + ' ' + w : w;
        if (!line || tw(c, fs, f) <= maxW) line = c; else { out.push(line); line = w; }
      });
      out.push(line);
    });
    return out;
  }
  function kc(k) { return 'k-' + (k || 'n'); }
  function maxw(lines, fs, f) { var m = 0; lines.forEach(function (l) { m = Math.max(m, tw(l, fs, f)); }); return m; }
  /* multi-line text, vertically centred on cy */
  function T(lines, x, cy, fs, cls, anchor, lh) {
    lh = lh || 1.28; anchor = anchor || 'middle';
    var h = lines.length * fs * lh, s = '';
    lines.forEach(function (ln, i) {
      var y = cy - h / 2 + fs * lh * (i + 0.5) + fs * 0.35;
      s += '<text x="' + r(x) + '" y="' + r(y) + '" text-anchor="' + anchor + '" class="' + (cls || '') + '" style="font-size:' + fs + 'px">' + esc(ln) + '</text>';
    });
    return s;
  }
  function AH(x, y, ang, k, size) {
    size = size || 7.5; var a = Math.PI / 7.2;
    return '<path class="ah ' + kc(k) + '" d="M' + r(x) + ' ' + r(y) + 'L' + r(x - size * Math.cos(ang - a)) + ' ' + r(y - size * Math.sin(ang - a)) +
      'L' + r(x - size * Math.cos(ang + a)) + ' ' + r(y - size * Math.sin(ang + a)) + 'Z"/>';
  }
  function XM(x, y, k) {
    var d = 3.4;
    return '<circle class="xm-c ' + kc(k || 'b') + '" cx="' + r(x) + '" cy="' + r(y) + '" r="7.5"/>' +
      '<path class="xm-l ' + kc(k || 'b') + '" d="M' + r(x - d) + ' ' + r(y - d) + 'L' + r(x + d) + ' ' + r(y + d) + 'M' + r(x + d) + ' ' + r(y - d) + 'L' + r(x - d) + ' ' + r(y + d) + '"/>';
  }
  /* label with a background plate so lines/lifelines don't cut through it */
  function LBL(text, x, y, fs, k, maxW, f) {
    var lines = wrap(text, maxW || 140, fs, f), w = maxw(lines, fs, f) + 10, h = lines.length * fs * 1.25 + 6;
    var cls = 't-l' + (k && k !== 'n' ? ' tk ' + kc(k) : '') + (f === 'mono' ? ' t-m' : '');
    return '<rect class="lbg" x="' + r(x - w / 2) + '" y="' + r(y - h / 2) + '" width="' + r(w) + '" height="' + r(h) + '" rx="4"/>' + T(lines, x, y, fs, cls, 'middle', 1.25);
  }
  function SHAPE(sh, cx, cy, w, h, k) {
    var x = cx - w / 2, y = cy - h / 2, c = 'nd ' + kc(k), s = '', i;
    switch (sh) {
      case 'db': {
        var ry = Math.min(7, h / 5);
        return '<path class="' + c + '" d="M' + r(x) + ' ' + r(y + ry) + 'A' + r(w / 2) + ' ' + ry + ' 0 0 1 ' + r(x + w) + ' ' + r(y + ry) + 'V' + r(y + h - ry) +
          'A' + r(w / 2) + ' ' + ry + ' 0 0 1 ' + r(x) + ' ' + r(y + h - ry) + 'Z"/><path class="nd-l ' + kc(k) + '" d="M' + r(x) + ' ' + r(y + ry) + 'A' + r(w / 2) + ' ' + ry + ' 0 0 0 ' + r(x + w) + ' ' + r(y + ry) + '"/>';
      }
      case 'queue':
        s = '<rect class="' + c + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '" rx="6"/>';
        for (i = 0; i < 3; i++) { var lx = x + w - 9 - i * 6; s += '<line class="nd-l ' + kc(k) + '" x1="' + r(lx) + '" y1="' + r(y + 7) + '" x2="' + r(lx) + '" y2="' + r(y + h - 7) + '"/>'; }
        return s;
      case 'pill': case 'actor': case 'chip':
        return '<rect class="' + c + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '" rx="' + r(h / 2) + '"/>';
      case 'ext':
        return '<rect class="' + c + ' dash" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '" rx="8"/>';
      case 'browser':
        s = '<rect class="' + c + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '" rx="7"/>' +
          '<line class="nd-l ' + kc(k) + '" x1="' + r(x) + '" y1="' + r(y + 12) + '" x2="' + r(x + w) + '" y2="' + r(y + 12) + '"/>';
        for (i = 0; i < 3; i++) s += '<circle class="nd ' + kc(k) + '" cx="' + r(x + 8 + i * 6) + '" cy="' + r(y + 6) + '" r="1.7"/>';
        return s;
      case 'doc':
        return '<path class="' + c + '" d="M' + r(x) + ' ' + r(y) + 'H' + r(x + w - 11) + 'L' + r(x + w) + ' ' + r(y + 11) + 'V' + r(y + h) + 'H' + r(x) + 'Z"/>' +
          '<path class="nd-l ' + kc(k) + '" d="M' + r(x + w - 11) + ' ' + r(y) + 'V' + r(y + 11) + 'H' + r(x + w) + '"/>';
      case 'stack':
        return '<rect class="' + c + '" x="' + r(x + 8) + '" y="' + r(y - 8) + '" width="' + r(w) + '" height="' + r(h) + '" rx="8"/>' +
          '<rect class="' + c + '" x="' + r(x + 4) + '" y="' + r(y - 4) + '" width="' + r(w) + '" height="' + r(h) + '" rx="8"/>' +
          '<rect class="' + c + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '" rx="8"/>';
      case 'note': return '';
      default:
        return '<rect class="' + c + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '" rx="8"/>';
    }
  }
  function svg(W, H, body, spec) {
    var minw = Math.min(W, spec.minw || 540);
    return '<svg class="dg" viewBox="0 0 ' + r(W) + ' ' + r(H) + '" width="' + r(W) + '" height="' + r(H) + '" style="min-width:' + minw + 'px;max-width:' + r(W * 1.18) + 'px" role="img"' +
      (spec.alt ? ' aria-label="' + esc(spec.alt) + '"' : '') + '>' + body + '</svg>';
  }

  /* ---------- sequence diagram ---------- */
  function seq(s) {
    var W = s.w || 680, pad = 8, A = s.actors.map(function (a) { return typeof a === 'string' ? { l: a } : a; }), n = A.length;
    var colW = (W - 2 * pad) / n, X = function (i) { return pad + colW * (i + 0.5); };
    var afs = 12, lfs = 11, abW = Math.min(colW - 14, 152);
    var aL = A.map(function (a) { return wrap(a.l, abW - (a.s === 'queue' ? 34 : 16), afs, 'bold'); });
    var maxL = Math.max.apply(null, aL.map(function (l) { return l.length; }));
    var hasDb = A.some(function (a) { return a.s === 'db'; });
    var hasBr = A.some(function (a) { return a.s === 'browser'; });
    var aH = Math.max(34, 14 + maxL * afs * 1.28) + (hasDb || hasBr ? 8 : 0), top = 6, y = top + aH + 16, body = '';
    s.steps.forEach(function (st) {
      if (st.gap) { y += st.gap; return; }
      if (st.div != null) {
        y += 8;
        var dw = tw(st.div, lfs) + 18;
        body += '<line class="dv ' + kc(st.k) + '" x1="' + pad + '" y1="' + r(y) + '" x2="' + r(W - pad) + '" y2="' + r(y) + '"/>' +
          '<rect class="pillbg ' + kc(st.k) + '" x="' + r(W / 2 - dw / 2) + '" y="' + r(y - 10) + '" width="' + r(dw) + '" height="20" rx="10"/>' +
          T([st.div], W / 2, y, lfs, 't-l' + (st.k ? ' tk ' + kc(st.k) : ''));
        y += 22; return;
      }
      if (st.note != null) {
        var at = Array.isArray(st.at) ? st.at : [st.at, st.at];
        var x1 = Math.max(3, X(Math.min.apply(null, at)) - colW * 0.46), x2 = Math.min(W - 3, X(Math.max.apply(null, at)) + colW * 0.46);
        var nl = wrap(st.note, x2 - x1 - 14, lfs), nh = nl.length * lfs * 1.3 + 10;
        body += '<rect class="nt ' + kc(st.k) + '" x="' + r(x1) + '" y="' + r(y) + '" width="' + r(x2 - x1) + '" height="' + r(nh) + '" rx="6"/>' +
          T(nl, (x1 + x2) / 2, y + nh / 2, lfs, '', 'middle', 1.3);
        y += nh + 10; return;
      }
      if (st.self != null) {
        var sx = X(st.self), right = st.self < n - 1, dx = right ? 20 : -20;
        var sl = wrap(st.l, colW * 0.62, lfs, st.mono ? 'mono' : 'sans'), sh = Math.max(20, sl.length * lfs * 1.25 + 4);
        body += '<path class="eg ' + kc(st.k) + '" d="M' + r(sx) + ' ' + r(y) + 'h' + dx + 'v' + r(sh) + 'h' + (-dx + (right ? 3 : -3)) + '"/>' + AH(sx + (right ? 1 : -1), y + sh, right ? Math.PI : 0, st.k, 6.5);
        var tx = right ? sx + dx + 6 : sx + dx - 6;
        body += T(sl, tx, y + sh / 2, lfs, 't-l' + (st.k && st.k !== 'n' ? ' tk ' + kc(st.k) : '') + (st.mono ? ' t-m' : ''), right ? 'start' : 'end', 1.25);
        y += sh + 12; return;
      }
      var fx = X(st.f), txx = X(st.t), dir = txx >= fx ? 1 : -1, span = Math.abs(txx - fx);
      var f = st.mono ? 'mono' : 'sans';
      var ml = st.l ? wrap(st.l, Math.max(span - 16, 96), lfs, f) : [];
      var lh = lfs * 1.25, lbH = ml.length * lh, cyL = y + lbH / 2;
      y += lbH + 5;
      var xe = st.lost ? fx + (txx - fx) * 0.56 : txx - dir * 2;
      body += '<line class="eg ' + kc(st.k) + (st.d ? ' dash' : '') + '" x1="' + r(fx) + '" y1="' + r(y) + '" x2="' + r(xe) + '" y2="' + r(y) + '"/>';
      body += st.lost ? XM(xe, y, st.k) : AH(txx - dir, y, dir > 0 ? 0 : Math.PI, st.k);
      if (ml.length) {
        var mid = st.lost ? (fx + xe) / 2 : (fx + txx) / 2, mw = maxw(ml, lfs, f) + 8;
        body += '<rect class="lbg" x="' + r(mid - mw / 2) + '" y="' + r(cyL - lbH / 2 - 1) + '" width="' + r(mw) + '" height="' + r(lbH + 2) + '" rx="3"/>';
        body += T(ml, mid, cyL, lfs, 't-l' + (st.k && st.k !== 'n' ? ' tk ' + kc(st.k) : '') + (st.mono ? ' t-m' : ''), 'middle', 1.25);
      }
      y += 15;
    });
    var H = y + 6, head = '', ll = '';
    A.forEach(function (a, i) {
      ll += '<line class="ll" x1="' + r(X(i)) + '" y1="' + r(top + aH) + '" x2="' + r(X(i)) + '" y2="' + r(H - 3) + '"/>';
      head += SHAPE(a.s || 'box', X(i), top + aH / 2, abW, aH, a.k) + T(aL[i], X(i) - (a.s === 'queue' ? 9 : 0), top + aH / 2 + (a.s === 'db' ? 4 : a.s === 'browser' ? 5 : 0), afs, 't-b' + (a.k === 'm' ? ' tn-m' : ''));
    });
    return svg(W, H, ll + head + body, s);
  }

  /* ---------- box & arrow flow ---------- */
  function border(nd, tx, ty) {
    var dx = tx - nd.cx, dy = ty - nd.cy, hw = nd.w / 2 + 4, hh = nd.h / 2 + 4;
    if (!dx && !dy) return [nd.cx, nd.cy];
    var t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return [nd.cx + dx * t, nd.cy + dy * t];
  }
  function flow(s) {
    var W = s.w || 680, nodes = s.nodes, edges = s.edges || [], groups = s.groups || [];
    var cols = s.cols || Math.max.apply(null, nodes.map(function (n) { return n.x; })) + 1;
    var rows = s.rows || Math.max.apply(null, nodes.map(function (n) { return n.y; })) + 1;
    var padX = 10, padT = groups.length ? 26 : 12, padB = groups.length ? 18 : 12, cw = (W - 2 * padX) / cols, ch = s.ch || 86, N = {};
    nodes.forEach(function (n) {
      var sh = n.s || 'box', fs = n.fs || (sh === 'chip' ? 11 : 12);
      var w = n.w || Math.min(cw - 22, sh === 'chip' ? 124 : 170);
      var tW = w - (sh === 'queue' ? 34 : 16);
      var lines = wrap(n.l, tW, fs, sh === 'note' ? 'sans' : 'bold');
      var sub = n.sub ? wrap(n.sub, tW, 10.5, 'sans') : [];
      var extra = sh === 'db' ? 9 : sh === 'browser' ? 11 : 0;
      var h = n.h || (sh === 'chip' ? Math.max(24, lines.length * fs * 1.25 + 8) : Math.max(38, 14 + lines.length * fs * 1.28 + (sub.length ? 3 + sub.length * 10.5 * 1.25 : 0) + extra));
      if (n.badge && !n.h) h += 8;
      N[n.id] = { n: n, sh: sh, fs: fs, w: w, h: h, lines: lines, sub: sub, cx: padX + cw * (n.x + 0.5) + (n.dx || 0), cy: padT + ch * (n.y + 0.5) + (n.dy || 0) };
    });
    var g = '', e = '', nd = '', lb = '';
    groups.forEach(function (gr) {
      var ns = gr.n.map(function (id) { if (!N[id]) throw new Error('group node ' + id); return N[id]; });
      var x1 = Math.min.apply(null, ns.map(function (q) { return q.cx - q.w / 2; })) - 12, x2 = Math.max.apply(null, ns.map(function (q) { return q.cx + q.w / 2; })) + 12;
      var y1 = Math.min.apply(null, ns.map(function (q) { return q.cy - q.h / 2 - (q.sh === 'stack' ? 8 : 0); })) - 21, y2 = Math.max.apply(null, ns.map(function (q) { return q.cy + q.h / 2; })) + 11;
      g += '<rect class="grpfill ' + kc(gr.k) + '" x="' + r(x1) + '" y="' + r(y1) + '" width="' + r(x2 - x1) + '" height="' + r(y2 - y1) + '" rx="11"/>' +
        '<rect class="grpbox ' + kc(gr.k) + '" x="' + r(x1) + '" y="' + r(y1) + '" width="' + r(x2 - x1) + '" height="' + r(y2 - y1) + '" rx="11"/>' +
        '<text class="tk ' + kc(gr.k) + '" x="' + r(x1 + 9) + '" y="' + r(y1 + 13) + '" style="font-size:9.5px;font-weight:700;letter-spacing:.08em">' + esc(String(gr.l).toUpperCase()) + '</text>';
    });
    edges.forEach(function (ed) {
      var a = N[ed.f], b = N[ed.t];
      if (!a || !b) throw new Error('edge ' + ed.f + '->' + ed.t);
      var dx = b.cx - a.cx, dy = b.cy - a.cy, len = Math.hypot(dx, dy) || 1, cv = ed.c || 0;
      var mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2, qx = mx - dy / len * cv, qy = my + dx / len * cv;
      var p1 = border(a, cv ? qx : b.cx, cv ? qy : b.cy), p2 = border(b, cv ? qx : a.cx, cv ? qy : a.cy), d, lx, ly, ang, angS;
      if (cv) {
        d = 'M' + r(p1[0]) + ' ' + r(p1[1]) + 'Q' + r(qx) + ' ' + r(qy) + ' ' + r(p2[0]) + ' ' + r(p2[1]);
        lx = 0.25 * p1[0] + 0.5 * qx + 0.25 * p2[0]; ly = 0.25 * p1[1] + 0.5 * qy + 0.25 * p2[1];
        ang = Math.atan2(p2[1] - qy, p2[0] - qx); angS = Math.atan2(p1[1] - qy, p1[0] - qx);
      } else {
        d = 'M' + r(p1[0]) + ' ' + r(p1[1]) + 'L' + r(p2[0]) + ' ' + r(p2[1]);
        lx = (p1[0] + p2[0]) / 2; ly = (p1[1] + p2[1]) / 2; ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]); angS = ang + Math.PI;
      }
      if (ed.lt != null) { lx = p1[0] + (p2[0] - p1[0]) * ed.lt; ly = p1[1] + (p2[1] - p1[1]) * ed.lt; }
      e += '<path class="eg ' + kc(ed.k) + (ed.d ? ' dash' : '') + '" d="' + d + '"/>';
      if (!ed.na) e += AH(p2[0], p2[1], ang, ed.k);
      if (ed.both) e += AH(p1[0], p1[1], angS, ed.k);
      if (ed.l) lb += LBL((ed.x ? '✕ ' : '') + ed.l, lx + (ed.lx || 0), ly + (ed.ly || 0), 10.5, ed.x && !ed.k ? 'b' : ed.k, ed.lw || Math.max(84, Math.min(150, len * 0.72)), ed.mono ? 'mono' : 'sans');
    });
    nodes.forEach(function (n) {
      var q = N[n.id], k = n.k, off = (q.sh === 'db' ? 4 : q.sh === 'browser' ? 6 : 0) + (n.badge ? 4 : 0), cxT = q.cx - (q.sh === 'queue' ? 9 : 0);
      nd += SHAPE(q.sh, q.cx, q.cy, q.w, q.h, k);
      var mh = q.lines.length * q.fs * 1.28, shh = q.sub.length ? 3 + q.sub.length * 10.5 * 1.25 : 0, top = q.cy + off - (mh + shh) / 2;
      var cls = q.sh === 'note' ? 't-l' + (k && k !== 'n' ? ' tk ' + kc(k) : '') : 't-b' + (k === 'm' ? ' tn-m' : '');
      nd += T(q.lines, cxT, top + mh / 2, q.fs, cls + (n.mono ? ' t-m' : ''));
      if (q.sub.length) nd += T(q.sub, cxT, top + mh + 3 + (shh - 3) / 2, 10.5, 't-s' + (n.submono ? ' t-m' : ''), 'middle', 1.25);
      if (n.badge) {
        var bw = tw(n.badge, 10, 'bold') + 12, bx = q.cx + q.w / 2 - bw / 2 - 4, by = q.cy - q.h / 2;
        nd += '<rect class="bdg ' + kc(n.bk || k || 'b') + '" x="' + r(bx - bw / 2) + '" y="' + r(by - 9) + '" width="' + r(bw) + '" height="18" rx="9"/>' + T([n.badge], bx, by, 10, 'bdgt');
      }
    });
    var H = padT + rows * ch + padB + (s.hb || 0);
    return svg(W, H, g + e + nd + lb, s);
  }

  /* ---------- timeline / gantt ---------- */
  function niceTicks(span) {
    var steps = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000], st = steps[steps.length - 1], out = [], i;
    for (i = 0; i < steps.length; i++) if (span / steps[i] <= 8) { st = steps[i]; break; }
    for (i = 0; i <= span + 1e-9; i += st) out.push(Math.round(i * 100) / 100);
    return out;
  }
  function tl(s) {
    var W = s.w || 680, LW = s.lw || 108, R = 14, span = s.span, rowH = s.rh || 32, bh = Math.min(20, rowH - 9);
    var marks = s.marks || [], mrows = marks.length ? Math.max.apply(null, marks.map(function (m) { return m.row || 0; })) + 1 : 0;
    var top = 8 + mrows * 15 + 18, lanes = s.lanes, px = function (t) { return LW + (W - LW - R) * t / span; }, Y = function (i) { return top + rowH * i; };
    var bottom = top + rowH * lanes.length, H = bottom + 10, o = '', lb = '';
    var ticks = s.ticks || niceTicks(span);
    ticks.forEach(function (t) {
      o += '<line class="grid" x1="' + r(px(t)) + '" y1="' + r(top - 3) + '" x2="' + r(px(t)) + '" y2="' + r(bottom) + '"/>';
      var lbl = t + (s.unit || ''), lw2 = tw(lbl, 10) / 2, tx = px(t), anc = 'middle';
      if (tx + lw2 > W - 2) { anc = 'end'; tx = W - 2; }
      o += '<text class="t-s" x="' + r(tx) + '" y="' + r(top - 7) + '" text-anchor="' + anc + '" style="font-size:10px">' + esc(lbl) + '</text>';
    });
    lanes.forEach(function (ln, i) {
      o += T(wrap(ln, LW - 14, 11, 'sans'), LW - 8, Y(i) + rowH / 2, 11, 't-l', 'end', 1.2);
      o += '<line class="axis" x1="' + LW + '" y1="' + r(Y(i) + rowH) + '" x2="' + r(W - R) + '" y2="' + r(Y(i) + rowH) + '"/>';
    });
    (s.bars || []).forEach(function (b) {
      var x1 = px(b.s), x2 = px(b.e), w = Math.max(2, x2 - x1), yb = Y(b.lane) + (rowH - bh) / 2, fs = 10.5;
      o += '<rect class="bar ' + kc(b.k) + (b.wait ? ' wait' : '') + '" x="' + r(x1) + '" y="' + r(yb) + '" width="' + r(w) + '" height="' + bh + '" rx="4"/>';
      if (b.l) {
        var t = tw(b.l, fs), cy = yb + bh / 2;
        if (t <= w - 8) lb += T([b.l], x1 + w / 2, cy, fs, 't-l');
        else if (x2 + 6 + t <= W - R + 2) lb += T([b.l], x2 + 5, cy, fs, 't-l', 'start');
        else if (x1 - 6 - t >= LW) lb += T([b.l], x1 - 5, cy, fs, 't-l', 'end');
        else { var cut = Math.max(3, Math.floor((w - 8) / (fs * CWF.sans)) - 1); lb += T([b.l.slice(0, cut) + '…'], x1 + w / 2, cy, fs, 't-l'); }
      }
    });
    (s.arrows || []).forEach(function (a) {
      var x1 = px(a.a[1]), y1 = Y(a.a[0]) + rowH / 2, x2 = px(a.b[1]), y2 = Y(a.b[0]) + rowH / 2, ang = Math.atan2(y2 - y1, x2 - x1);
      o += '<path class="eg ' + kc(a.k) + (a.d ? ' dash' : '') + '" d="M' + r(x1) + ' ' + r(y1) + 'L' + r(x2) + ' ' + r(y2) + '"/>' + AH(x2, y2, ang, a.k, 6.5);
    });
    (s.pts || []).forEach(function (p) {
      var x = px(p.t), y = Y(p.lane) + rowH / 2;
      lb += '<circle class="pt ' + kc(p.k) + '" cx="' + r(x) + '" cy="' + r(y) + '" r="5"/>';
      if (p.l) {
        var t = tw(p.l, 10), anchor = 'start', lx = x + 8;
        if (lx + t > W - R) { anchor = 'end'; lx = x - 8; }
        lb += T([p.l], lx, y + (p.up ? -9 : 0), 10, 't-l' + (p.k && p.k !== 'n' ? ' tk ' + kc(p.k) : ''), anchor);
      }
    });
    marks.forEach(function (m) {
      var x = px(m.t), ly = 8 + (m.row || 0) * 15 + 7, t = tw(m.l, 10), lx = Math.max(LW + t / 2 - 40, Math.min(W - R - t / 2, x));
      o += '<line class="mk ' + kc(m.k) + '" x1="' + r(x) + '" y1="' + r(ly + 6) + '" x2="' + r(x) + '" y2="' + r(bottom) + '"/>';
      lb += T([m.l], lx, ly, 10, 't-l tk ' + kc(m.k || 'n'));
    });
    return svg(W, H, o + lb, s);
  }

  /* ---------- line chart ---------- */
  function chart(s) {
    var W = s.w || 680, H = s.h || 200, L = s.ml || 50, R = 16, series = s.series, Tp = 26, B = 24;
    var n = s.x.length, px = function (i) { return L + (W - L - R) * i / (n - 1); };
    var ymin = s.ymin || 0, ymax = s.ymax, py = function (v) { return Tp + (H - Tp - B) * (1 - (v - ymin) / (ymax - ymin)); };
    var yt = s.yt || [0, 1, 2, 3, 4].map(function (i) { return ymin + (ymax - ymin) * i / 4; }), o = '', lb = '';
    yt.forEach(function (v) {
      o += '<line class="grid" x1="' + L + '" y1="' + r(py(v)) + '" x2="' + r(W - R) + '" y2="' + r(py(v)) + '"/>';
      o += '<text class="t-s" x="' + (L - 7) + '" y="' + r(py(v) + 3.5) + '" text-anchor="end" style="font-size:10px">' + esc(v + (s.yu || '')) + '</text>';
    });
    var every = n > 12 ? Math.ceil(n / 8) : 1;
    s.x.forEach(function (x, i) { if (i % every === 0 || i === n - 1) o += '<text class="t-s" x="' + r(px(i)) + '" y="' + (H - 7) + '" text-anchor="middle" style="font-size:10px">' + esc(x) + '</text>'; });
    o += '<line class="axis" x1="' + L + '" y1="' + r(py(ymin)) + '" x2="' + r(W - R) + '" y2="' + r(py(ymin)) + '"/>';
    (s.bands || []).forEach(function (b) {
      o += '<line class="mk ' + kc(b.k) + '" x1="' + L + '" y1="' + r(py(b.y)) + '" x2="' + r(W - R) + '" y2="' + r(py(b.y)) + '"/>';
      lb += b.left ? T([b.l], L + 6, py(b.y) - 8, 10, 't-l tk ' + kc(b.k), 'start') : T([b.l], W - R - 2, py(b.y) - 8, 10, 't-l tk ' + kc(b.k), 'end');
    });
    (s.vmarks || []).forEach(function (m) {
      var x = px(m.x), right = x > W * 0.62;
      o += '<line class="mk ' + kc(m.k) + '" x1="' + r(x) + '" y1="' + Tp + '" x2="' + r(x) + '" y2="' + r(py(ymin)) + '"/>';
      lb += T(wrap(m.l, 150, 10), right ? x - 6 : x + 6, Tp + 12 + (m.dy || 0), 10, 't-l tk ' + kc(m.k), right ? 'end' : 'start', 1.2);
    });
    series.forEach(function (se) {
      var pts = se.v.map(function (v, i) { return [px(i), py(v)]; });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + r(p[0]) + ' ' + r(p[1]); }).join('');
      if (se.area) o += '<path class="ar ' + kc(se.k) + '" d="' + d + 'L' + r(pts[pts.length - 1][0]) + ' ' + r(py(ymin)) + 'L' + r(pts[0][0]) + ' ' + r(py(ymin)) + 'Z"/>';
      o += '<path class="ln-s ' + kc(se.k) + (se.d ? ' dash' : '') + '" d="' + d + '"/>';
      var last = pts[pts.length - 1];
      lb += '<circle class="pt ' + kc(se.k) + '" cx="' + r(last[0]) + '" cy="' + r(last[1]) + '" r="4.5"/>';
    });
    var lx = L;
    series.forEach(function (se) {
      lb += '<rect class="bar ' + kc(se.k) + '" x="' + r(lx) + '" y="7" width="14" height="8" rx="2"/>' + T([se.l], lx + 19, 11, 10.5, 't-l', 'start');
      lx += 30 + tw(se.l, 10.5);
    });
    return svg(W, H, o + lb, s);
  }

  var R_ = { seq: seq, flow: flow, tl: tl, chart: chart };
  function render(spec) {
    try {
      if (!spec || !R_[spec.type]) throw new Error('unknown diagram type ' + (spec && spec.type));
      return R_[spec.type](spec);
    } catch (err) {
      if (window.console) console.error('Diagram failed', err, spec);
      return '<div class="dg-err">Diagram failed to render: ' + esc(err.message) + '</div>';
    }
  }
  return { render: render, esc: esc, wrap: wrap };
})();
