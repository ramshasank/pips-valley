/* Shape Sorter — a wooden toy box seen from above, and chunky paper shapes to post into it.
   Pick a shape up and it says its name; carry it to a hole that fits and it drops in with a clunk.
   The snap is forgiving, and at level 1 a tap is enough: the shape flies to its hole by itself.

   Level 1: circle, square, triangle, star; three holes, then four, then spare shapes.
   Level 2: nine shapes; holes with a painted rim (match colour AND shape), or big and small holes.
   Level 3: sorting by a rule into labelled crates ("shapes with four sides"), halves and quarters that
            make a whole, and little pictures to build from shapes on an outline.
   A wrong try is never bad: a soft sound, a wobble, the shape hops home and a short hint teaches.
   After two misses with a shape, the right place glows. */
(function () {
  'use strict';
  const A = K.art;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const COL = { red: '#DE4E46', yellow: '#F2C23D', green: '#5E9E57', blue: '#5B8FC7', purple: '#8A62B0', orange: '#F0923B' };
  const COLS = Object.keys(COL);
  const WOOD = '#DDAE74', WOOD_D = '#BC8553', HOLE = '#553628';
  const BASIC = ['circle', 'square', 'triangle', 'star'];
  const NINE = BASIC.concat(['heart', 'diamond', 'oval', 'rectangle', 'hexagon']);
  const FACT = { circle: 'no corners', oval: 'no corners', triangle: 'three sides', square: 'four sides', rectangle: 'four sides', diamond: 'four sides', pentagon: 'five corners', hexagon: 'six corners', octagon: 'eight corners', star: 'ten corners' };
  const AN = (n) => (/^[aeiou]/.test(n) ? 'an ' : 'a ') + n;
  const RULES = {
    four: { say: 'Shapes with four sides.', label: '4 sides', shapes: ['square', 'rectangle', 'diamond'], col: '#2F8F8A' },
    none: { say: 'Shapes with no corners.', label: 'no corners', shapes: ['circle', 'oval'], col: '#E8664A' },
    many: { say: 'Shapes with more than four corners.', label: 'more than 4 corners', shapes: ['star', 'hexagon', 'pentagon', 'octagon'], col: '#6E4E7E' },
    three: { say: 'Shapes with three sides.', label: '3 sides', shapes: ['triangle'], col: '#5B8FC7' },
  };
  /* Pictures to build, drawn in a 100 x 100 box around (0,0). `in` marks a part that sits on top of another. */
  const PICS = [
    { name: 'house', parts: [['square', 0, 20, 58, 54, 'yellow'], ['triangle', 0, -30, 84, 46, 'red'], ['rectangle', 0, 29, 18, 36, 'blue', 1]] },
    { name: 'tree', parts: [['rectangle', 0, 36, 16, 28, 'orange'], ['triangle', 0, 4, 76, 40, 'green'], ['triangle', 0, -28, 54, 36, 'green']] },
    { name: 'fish', parts: [['oval', -8, 2, 66, 44, 'orange'], ['ltail', 38, 2, 30, 40, 'red'], ['triangle', -8, -30, 30, 20, 'red']] },
    { name: 'ice cream', say: 'an ice cream', parts: [['dtri', 0, 24, 44, 52, 'yellow'], ['circle', 0, -12, 48, 48, 'red'], ['circle', 0, -40, 34, 34, 'purple']] },
    { name: 'boat', parts: [['trap', 0, 32, 90, 26, 'red'], ['rectangle', -2, -8, 7, 54, 'orange'], ['rtri', 21, -8, 36, 46, 'yellow'], ['ltri', -20, -4, 26, 36, 'blue']] },
    { name: 'rocket', parts: [['rectangle', 0, 6, 36, 58, 'blue'], ['triangle', 0, -38, 36, 30, 'red'], ['ltri', -28, 22, 20, 28, 'orange'], ['rtri', 28, 22, 20, 28, 'orange'], ['circle', 0, -4, 20, 20, 'yellow', 1]] },
    { name: 'train', parts: [['rectangle', -8, 2, 66, 32, 'red'], ['square', 34, -10, 30, 56, 'blue'], ['circle', -26, 30, 24, 24, 'purple'], ['circle', 26, 30, 24, 24, 'purple'], ['rectangle', -28, -26, 12, 24, 'yellow']] },
  ];
  const T = {
    box: 'Put the shapes in the box!',
    cs: 'Match the colour and the shape!',
    size: 'Big shapes in big holes. Small shapes in small holes.',
    rule: 'Sort the shapes into the boxes. Tap a box to hear its rule.',
    halves: 'Two halves make a whole.', quarters: 'Four quarters make a whole.', wholes: 'Make the shapes whole.', together: 'Put the pieces together!',
    pic: 'Build the picture with the shapes!',
    name: (s) => cap(s) + '!',
    find: (s) => `Find the ${s} hole.`,
    colour: 'Same shape, but look at the colour.',
    tooBig: 'That one is too big for this hole.', tooSmall: 'That one is too small for this hole.',
    fact: (s) => `${cap(AN(s))} has ${FACT[s]}.`,
    spot: 'Not there. Try another spot.',
    half: ['One half!', 'Two halves make a whole.'],
    quarter: ['One quarter!', 'Two quarters make a half!', 'Three quarters!', 'Four quarters make a whole.'],
    made: (p) => `You made ${p.say || AN(p.name)}!`,
  };
  const SHORT = { match: 'Shapes in the box!', cs: 'Colour and shape!', size: 'Big and small!', rule: 'Sort the shapes!', frac: 'Make a whole!', pic: 'Build the picture!' };
  function lines() {
    const out = [T.box, T.cs, T.size, T.rule, T.halves, T.quarters, T.wholes, T.together, T.pic, T.colour, T.tooBig, T.tooSmall, T.spot, ...T.half, ...T.quarter];
    for (const s of Object.keys(FACT).concat('heart')) out.push(T.name(s));
    for (const s of NINE) out.push(T.find(s));
    for (const s of Object.keys(FACT)) out.push(T.fact(s));
    for (const k in RULES) out.push(RULES[k].say);
    for (const p of PICS) out.push(T.made(p));
    const seen = {}, res = [];
    for (const t of out) for (const s of String(t).match(/[^.!?…]+[.!?…]*/g) || []) { const k = K.voiceKey(s); if (k && !seen[k]) { seen[k] = 1; res.push(s.trim()); } }
    return res;
  }

  /* ---------------- shapes as paths ---------------- */
  const ngon = (n, rot, r2) => { const out = []; for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2, r = r2 && i % 2 ? r2 : 0.5; out.push([Math.cos(a) * r, Math.sin(a) * r]); } return out; };
  const POLY = {
    square: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], triangle: [[0, -0.5], [0.5, 0.5], [-0.5, 0.5]], diamond: [[0, -0.5], [0.5, 0], [0, 0.5], [-0.5, 0]],
    rtri: [[-0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], ltri: [[0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], dtri: [[-0.5, -0.5], [0.5, -0.5], [0, 0.5]], ltail: [[-0.5, 0], [0.5, -0.5], [0.5, 0.5]],
    trap: [[-0.5, -0.5], [0.5, -0.5], [0.32, 0.5], [-0.32, 0.5]],
    pentagon: ngon(5, -Math.PI / 2), hexagon: ngon(6, 0), octagon: ngon(8, Math.PI / 8), star: ngon(10, -Math.PI / 2, 0.23),
  };
  POLY.rectangle = POLY.square;
  const dims = (shape, s) => (shape === 'oval' ? [s, s * 0.68] : shape === 'rectangle' ? [s, s * 0.62] : shape === 'triangle' ? [s, s * 0.9] : shape === 'diamond' ? [s * 0.8, s] : [s, s]);
  /** A shape w by h around (0,0): {shape, w, h, key, path(g)} */
  function mk(shape, w, h, rad) {
    const r = rad == null ? Math.min(12, Math.min(w, h) * 0.09) : rad;
    return { shape, w, h, key: shape + Math.round(w) + 'x' + Math.round(h), path(g) {
      if (shape === 'circle' || shape === 'oval') { g.moveTo(w / 2, 0); g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); g.closePath(); }
      else if (shape === 'heart') { g.moveTo(0, -0.24 * h); g.bezierCurveTo(-0.1 * w, -0.52 * h, -0.5 * w, -0.52 * h, -0.5 * w, -0.17 * h); g.bezierCurveTo(-0.5 * w, 0.12 * h, -0.2 * w, 0.3 * h, 0, 0.5 * h); g.bezierCurveTo(0.2 * w, 0.3 * h, 0.5 * w, 0.12 * h, 0.5 * w, -0.17 * h); g.bezierCurveTo(0.5 * w, -0.52 * h, 0.1 * w, -0.52 * h, 0, -0.24 * h); g.closePath(); }
      else A.cut(g, POLY[shape].map(([x, y]) => [x * w, y * h]), r, 0, 1);
    } };
  }
  /** A fraction of a whole of size S. part = {arc:[a0,a1]} (of a circle) or {pts} (unit polygon). ox, oy: where its middle sits in the whole. */
  function fracD(S, part) {
    let pts = part.pts;
    if (part.arc) { pts = [[0, 0]]; for (let i = 0; i <= 12; i++) { const a = part.arc[0] + (part.arc[1] - part.arc[0]) * (i / 12); pts.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5]); } }
    const xs = pts.map((p) => p[0] * S), ys = pts.map((p) => p[1] * S);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), ox = (x0 + x1) / 2, oy = (y0 + y1) / 2;
    const loc = (part.pts || []).map(([x, y]) => [x * S - ox, y * S - oy]);
    return { shape: 'part', w: x1 - x0, h: y1 - y0, ox, oy, key: part.arc ? 'arc' + part.arc.map((a) => a.toFixed(2)).join('_') + Math.round(S) : 'p' + loc.map((p) => Math.round(p[0]) + ',' + Math.round(p[1])).join(';'),
      path(g) { if (part.arc) { g.moveTo(-ox, -oy); g.arc(-ox, -oy, S / 2, part.arc[0], part.arc[1]); g.closePath(); } else A.cut(g, loc, 3, 0, 1); } };
  }
  const PI = Math.PI, Q = [[-0.5, -0.5], [0, -0.5], [0.5, -0.5], [-0.5, 0], [0, 0], [0.5, 0], [-0.5, 0.5], [0, 0.5], [0.5, 0.5]]; // a 3 x 3 lattice on the unit square
  const poly = (...i) => ({ pts: i.map((k) => Q[k]) });
  const CUTS = {
    circle: { half: [[{ arc: [PI / 2, PI * 1.5] }, { arc: [-PI / 2, PI / 2] }], [{ arc: [PI, PI * 2] }, { arc: [0, PI] }]], quarter: [[0, 1, 2, 3].map((i) => ({ arc: [i * PI / 2, (i + 1) * PI / 2] }))] },
    square: { half: [[poly(0, 1, 7, 6), poly(1, 2, 8, 7)], [poly(0, 2, 5, 3), poly(3, 5, 8, 6)], [poly(0, 2, 6), poly(2, 8, 6)]], quarter: [[poly(0, 1, 4, 3), poly(1, 2, 5, 4), poly(3, 4, 7, 6), poly(4, 5, 8, 7)], [poly(0, 2, 4), poly(2, 8, 4), poly(8, 6, 4), poly(6, 0, 4)]] },
  };

  /* ---------------- drawing ---------------- */
  function bake(res, box, paint) {
    const [bx, by, bw, bh] = box, pad = 18, c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil((bw + pad * 2) * res)); c.height = Math.max(1, Math.ceil((bh + pad * 2) * res));
    const g = c.getContext('2d'); g.setTransform(res, 0, 0, res, (pad - bx) * res, (pad - by) * res); paint(g, res);
    return { canvas: c, ox: pad - bx, oy: pad - by, w: bw + pad * 2, h: bh + pad * 2 };
  }
  /** A chunky paper piece: a darker edge below, the face on top, a soft highlight along the upper rim. */
  function paintPiece(g, s, D, col, thick) {
    const box = { x: -D.w / 2, y: -D.h / 2, w: D.w, h: D.h };
    g.save(); g.translate(0, thick); g.beginPath(); D.path(g); A.paper(g, s, A.shade(col, -0.14), { shadow: 0.95, grain: 0.1, light: 0 }); g.restore();
    g.beginPath(); D.path(g); A.paper(g, s, col, { shadow: 0, light: 0.08, box });
    g.save(); g.beginPath(); D.path(g); g.clip(); g.translate(2.5, 3.5); g.beginPath(); D.path(g); g.strokeStyle = 'rgba(255,255,255,.34)'; g.lineWidth = 4; g.stroke(); g.restore();
  }
  function paintWood(g, s, x, y, w, h, rad, col, seed) {
    g.beginPath(); A.rect(g, x, y, w, h, rad, seed, 1); A.paper(g, s, col, { shadow: 1, depth: 1.6, light: 0.06, grain: 0.3, box: { x, y, w, h } });
    g.save(); g.beginPath(); A.rect(g, x, y, w, h, rad, seed, 1); g.clip();
    const r = A.rng(seed + 11);
    g.strokeStyle = A.alpha('#8A5A3C', 0.16); g.lineWidth = 2.5; g.lineCap = 'round';
    for (let yy = y + 18; yy < y + h; yy += 26 + r() * 22) { g.beginPath(); g.moveTo(x - 10, yy); for (let xx = x; xx <= x + w + 60; xx += 60) g.quadraticCurveTo(xx - 30, yy + (r() - 0.5) * 9, xx, yy + (r() - 0.5) * 4); g.stroke(); }
    g.restore();
  }
  function paintHole(g, D, ring) {
    if (ring) { g.save(); g.beginPath(); D.path(g); g.lineJoin = 'round'; g.strokeStyle = 'rgba(46,40,70,.18)'; g.lineWidth = 34; g.stroke(); g.strokeStyle = ring; g.lineWidth = 28; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 3; g.stroke(); g.restore(); }
    else { g.save(); g.beginPath(); D.path(g); g.lineJoin = 'round'; g.strokeStyle = A.alpha('#FFF4DC', 0.5); g.lineWidth = 9; g.stroke(); g.restore(); }
    g.beginPath(); D.path(g); g.fillStyle = HOLE; g.fill();
    g.save(); g.beginPath(); D.path(g); g.clip(); g.translate(6, 11); g.beginPath(); D.path(g); g.fillStyle = A.shade(HOLE, 0.07); g.fill(); g.restore();   // the far wall of the hole catches a little light
  }
  function room(g, s, W, H, rug) {
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#E9CFA4', { shadow: 0, grain: 0.3, light: 0.04, box: { x: 0, y: 0, w: W, h: H } });
    const r = A.rng(5);
    g.strokeStyle = A.alpha('#A9764A', 0.22); g.lineWidth = 3;
    for (let y = 0, row = 0; y < H; y += 118, row++) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (row % 2) * 170 + r() * 80; x < W; x += 340) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 118); g.stroke(); } }
    g.beginPath(); A.rect(g, rug.x, rug.y, rug.w, rug.h, 46, 3, 2); A.paper(g, s, '#8FC2BA', { shadow: 0.8, grain: 0.34, light: 0.05, box: rug });
    g.save(); g.setLineDash([16, 14]); g.lineCap = 'round'; g.strokeStyle = A.alpha('#FBF6EC', 0.75); g.lineWidth = 5; g.beginPath(); A.rect(g, rug.x + 22, rug.y + 22, rug.w - 44, rug.h - 44, 30, 4, 1); g.stroke(); g.restore();
    const cols = ['#F7E3A6', '#FBF6EC', '#FBF6EC'];
    for (let i = 0; i < 26; i++) { const x = rug.x + 50 + r() * (rug.w - 100), y = rug.y + 50 + r() * (rug.h - 100); g.beginPath(); g.arc(x, y, 5 + r() * 5, 0, 7); g.fillStyle = A.alpha(cols[i % 3], 0.3); g.fill(); }
  }
  function label(g, s, text, x, y, w, col) {
    g.font = `700 30px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    let rows = [text];
    if (g.measureText(text).width > w - 30) { const ws = text.split(' '), k = Math.ceil(ws.length / 2); rows = [ws.slice(0, k).join(' '), ws.slice(k).join(' ')]; }
    let fs = 30; while (fs > 18 && Math.max(...rows.map((t) => g.measureText(t).width)) > w - 26) { fs -= 2; g.font = `700 ${fs}px ${A.FONT_BODY}`; }
    const h = rows.length * (fs + 6) + 22;
    g.beginPath(); A.rect(g, x - w / 2, y - h / 2, w, h, 12, 5, 0.8); A.paper(g, s, '#FBF6EC', { shadow: 0.8, light: 0.03, box: { x: x - w / 2, y: y - h / 2, w, h } });
    g.fillStyle = col; g.fillRect(x - w / 2 + 8, y - h / 2 + 6, w - 16, 6);
    g.fillStyle = A.C.ink; rows.forEach((t, i) => g.fillText(t, x, y + 5 + (i - (rows.length - 1) / 2) * (fs + 6)));
    return h;
  }
  function grid(n, r, aspect) {
    let best = null;
    for (let c = 1; c <= n; c++) { const rows = Math.ceil(n / c), cw = r.w / c, ch = r.h / rows, s = Math.min(cw / (aspect || 1), ch); if (!best || s > best.s + 0.5) best = { cols: c, rows, cw, ch, s }; }
    best.at = (i) => { const row = Math.floor(i / best.cols), inRow = Math.min(best.cols, n - row * best.cols); return { x: r.x + (r.w - inRow * best.cw) / 2 + ((i % best.cols) + 0.5) * best.cw, y: r.y + (row + 0.5) * best.ch }; };
    return best;
  }
  const FACE_Y = { triangle: 0.14, star: 0.03, heart: -0.06, diamond: 0, hexagon: 0 };

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, res = st.res;
    const SET = L === 1 ? 4 : 3;
    const bw = land ? Math.min(W - 280, 1080) : W - 36;
    const boxR = { x: (W - bw) / 2, y: land ? 150 : 154, w: bw, h: land ? 420 : Math.min(520, Math.round(H * 0.4)) };
    const trayR = { x: land ? 60 : 14, y: boxR.y + boxR.h + (land ? 58 : 50), w: W - (land ? 120 : 28) };
    trayR.h = H - trayR.y - (land ? 44 : 64);
    const rug = { x: land ? 26 : -30, y: trayR.y - 30, w: land ? W - 52 : W + 60, h: H - trayR.y + 8 };
    st.add({ z: 0, sprite: bake(res, [0, 0, W, H], (g, s) => room(g, s, W, H, rug)) });

    let R = null, won = 0, skill = 0, streak = 0, roundNo = Math.floor(Math.random() * 3), lastKey = '', lastAct = 0, lastName = -9, hand = null;
    const top = (n, z) => { n.z = z; st.root._sorted = false; };
    const sfx = {
      clunk() { K.sfx.tone(190, 0.13, { to: 80, vol: 0.32 }); K.sfx.noise(0.05, { freq: 500, vol: 0.2 }); K.sfx.tone(640, 0.1, { type: 'triangle', vol: 0.1, delay: 0.1 }); },
      click() { K.sfx.noise(0.03, { freq: 3200, vol: 0.22 }); K.sfx.tone(980, 0.06, { type: 'triangle', vol: 0.16 }); },
      lift() { K.sfx.tone(440, 0.07, { to: 620, type: 'triangle', vol: 0.14 }); },
    };

    /* ---------- the glow that shows where a shape belongs ---------- */
    st.add({ z: 22, draw(g) {
      if (!R) return;
      for (const t of R.targets) {
        if (!t.glow || t.filled) continue;
        const k = 0.5 + 0.5 * Math.sin(st.t * 6);
        g.save(); g.translate(t.x, t.y); g.shadowColor = '#FFF2A8'; g.shadowBlur = (18 + 16 * k) * res; g.strokeStyle = A.alpha('#FFF6C8', 0.7 + 0.3 * k); g.lineWidth = 7 + 3 * k; g.lineJoin = 'round';
        g.beginPath(); if (t.D) t.D.path(g); else A.rect(g, -t.w / 2, -t.h / 2, t.w, t.h, 24, 3, 0); g.stroke(); g.restore();
      }
    } });

    /* ---------- pieces ---------- */
    function addPiece(D, colName, o) {
      const col = o.tone ? A.shade(COL[colName], o.tone) : COL[colName];
      const P = Object.assign({ D, color: colName, misses: 0, done: false, grab: null, ts: 1, home: { x: 0, y: 0 }, blink: 2 + Math.random() * 4 }, o);
      const n = P.node = st.add({ z: 30, sprite: bake(res, [-D.w / 2, -D.h / 2, D.w, D.h + (o.thick || 8)], (g, s) => paintPiece(g, s, D, col, o.thick || 8)), sx: 0, sy: 0, pad: 6, pressable: false, label: o.label || o.shape });
      if (P.face) {
        const fy = (FACE_Y[P.shape] || 0) * D.h, u = Math.min(D.w, D.h);
        n.draw = (g) => {
          const shut = P.blink < 0.12, e = u * 0.05;
          g.fillStyle = A.C.ink;
          for (const k of [-1, 1]) { g.beginPath(); if (shut) g.ellipse(k * u * 0.15, fy - u * 0.04, e, e * 0.25, 0, 0, 7); else g.arc(k * u * 0.15, fy - u * 0.04, e, 0, 7); g.fill(); }
          if (!shut) { g.fillStyle = '#fff'; for (const k of [-1, 1]) { g.beginPath(); g.arc(k * u * 0.15 + e * 0.3, fy - u * 0.04 - e * 0.35, e * 0.32, 0, 7); g.fill(); } }
          if (P.grab) { g.beginPath(); g.ellipse(0, fy + u * 0.1, u * 0.045, u * 0.055, 0, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
          else A.line(g, A.C.ink, Math.max(2.5, u * 0.022), (h) => h.arc(0, fy + u * 0.04, u * 0.085, 0.25, Math.PI - 0.25));
          g.fillStyle = 'rgba(232,102,74,.35)'; for (const k of [-1, 1]) { g.beginPath(); g.arc(k * u * 0.24, fy + u * 0.06, u * 0.04, 0, 7); g.fill(); }
        };
        n.update = (dt) => { P.blink -= dt; if (P.blink < 0) P.blink = 2 + Math.random() * 4; };
      }
      n.onDown = (p) => {
        if (P.done || !R || R.busy) return;
        P.grab = { dx: n.x - p.x, dy: n.y - p.y }; top(n, 60); lastAct = st.t; killHand();
        n.to({ sx: 1.06, sy: 1.06 }, { dur: 0.12, ease: 'out' }); sfx.lift();
        if (P.say && st.t - lastName > 0.4) { lastName = st.t; ctx.say(P.say); }
      };
      n.onMove = (p) => { if (!P.grab) return; n.x = K.clamp(p.x + P.grab.dx, 30, W - 30); n.y = K.clamp(p.y + P.grab.dy, 40, H - 30); };
      n.onUp = (p, e, s) => {
        if (!P.grab) return; P.grab = null; lastAct = st.t;
        if (s.moved < 24) { if (L === 1 && R.mode === 'holes') auto(P, true); else settle(P); return; }
        drop(P);
      };
      n.onTap = (p) => { if (!p && !P.done && R && !R.busy) auto(P); };   // keyboard and screen readers
      R.pieces.push(P); R.nodes.push(n);
      return P;
    }
    function layTray(r) {
      const list = K.shuffle(r.pieces), gr = grid(list.length, trayR, 1.05);
      const big = Math.max(...list.map((P) => Math.max(P.D.w, P.D.h)));
      const ts = Math.min(1, (gr.s * 0.84) / big);
      list.forEach((P, i) => {
        const at = gr.at(i); P.ts = ts; P.home = { x: at.x + (Math.random() - 0.5) * gr.cw * 0.08, y: at.y + (Math.random() - 0.5) * gr.ch * 0.08 };
        const n = P.node, hw = Math.max(P.D.w / 2, 54 / ts), hh = Math.max(P.D.h / 2, 54 / ts);
        n.hit = { x: -hw, y: -hh, w: hw * 2, h: hh * 2 }; n.x = P.home.x; n.y = P.home.y; n.rot = (Math.random() - 0.5) * 0.3;
        ctx.after(120 + i * 90, () => { K.sfx.tone(500 + i * 60, 0.06, { type: 'triangle', vol: 0.1 }); n.to({ sx: ts, sy: ts, rot: 0 }, { dur: 0.4, ease: 'back' }); });
      });
    }
    const settle = (P) => { top(P.node, 30); P.node.to({ sx: P.ts, sy: P.ts }, { dur: 0.25, ease: 'back' }); };
    function goHome(P) { top(P.node, 31); P.node.to({ x: P.home.x, y: P.home.y, sx: P.ts, sy: P.ts }, { dur: 0.4, ease: 'back' }).then(() => { if (!P.done && !P.grab) top(P.node, 30); }); }
    const wobble = (n) => n.to({ rot: 0.2 }, { dur: 0.07 }).then(() => n.to({ rot: -0.16 }, { dur: 0.09 })).then(() => n.to({ rot: 0.08 }, { dur: 0.08 })).then(() => n.to({ rot: 0 }, { dur: 0.08 }));
    const rightFor = (P) => R.targets.find((t) => !t.filled && R.accept(P, t));
    function auto(P, quiet) { const t = rightFor(P); if (!t) return settle(P); if (P.say && !quiet) ctx.say(P.say); top(P.node, 60); K.sfx.whoosh(); place(P, t, 0.34); }
    function drop(P) {
      const hit = R.hit(P);
      if (!hit) { const inBox = P.node.y < boxR.y + boxR.h + 10; if (inBox) goHome(P); else { P.home = { x: P.node.x, y: P.node.y }; settle(P); } return; }
      if (hit.ok) return place(P, hit.t, 0.13);
      P.misses++; R.misses++; K.sfx.whoops(); wobble(P.node); goHome(P);
      ctx.say(R.why(P, hit.t));
      if (P.misses >= 2) { const t = rightFor(P); if (t) t.glow = true; }
    }
    function place(P, t, dur) {
      P.done = true; R.left--; lastAct = st.t; t.glow = false;
      const n = P.node, r = R;
      if (r.mode === 'holes') {
        n.to({ x: t.x, y: t.y, sx: 1, sy: 1, rot: 0 }, { dur, ease: 'out' }).then(() => {
          sfx.clunk(); ctx.fx.burst(t.x, t.y, { n: 9, color: COL[P.color] }); r.box.press();
          return n.to({ sx: 0.8, sy: 0.8, alpha: 0, y: t.y + 8 }, { dur: 0.22, ease: 'inOut' });
        }).then(() => n.remove());
      } else if (r.mode === 'bins') {
        const at = t.spot(t.count++), k = t.small / Math.max(P.D.w, P.D.h);
        top(n, 12 + t.count);
        n.to({ x: at.x, y: at.y, sx: k, sy: k, rot: (Math.random() - 0.5) * 0.5 }, { dur: dur + 0.12, ease: 'out' }).then(() => { sfx.clunk(); ctx.fx.burst(at.x, at.y, { n: 8, color: COL[P.color] }); t.node.press(); });
      } else {
        t.filled = true; top(n, 10 + t.i);
        n.to({ x: t.x, y: t.y, sx: 1, sy: 1, rot: 0 }, { dur, ease: 'out' }).then(() => { sfx.click(); K.sfx.step(r.pieces.length - r.left - 1); ctx.fx.burst(t.x, t.y, { n: 7, color: COL[P.color] }); });
        if (t.whole) { const w = t.whole; w.got++; ctx.say((w.n === 2 ? T.half : T.quarter)[w.got - 1]); }
      }
      if (!r.left) finish();
    }
    async function finish() {
      const r = R; r.busy = true; killHand();
      await ctx.wait(650);
      K.sfx.sparkle(); const c = r.centre; ctx.fx.burst(c.x, c.y, { n: 18 });
      for (const P of r.pieces) if (r.mode !== 'holes') P.node.to({ sy: P.node.sy * 1.08, sx: P.node.sx * 1.08 }, { dur: 0.16 }).then(() => P.node.to({ sx: P.node.sx / 1.08, sy: P.node.sy / 1.08 }, { dur: 0.4, ease: 'elastic' }));
      if (r.doneSay) await Promise.all([ctx.say(r.doneSay), ctx.wait(1900)]); else await ctx.wait(r.mode === 'slots' ? 1700 : 900);
      won++;
      if (r.misses <= 1) { if (++streak >= 2) { skill = Math.min(2, skill + 1); streak = 0; } } else if (r.misses >= 3) { skill = Math.max(0, skill - 1); streak = 0; } else streak = 0;
      if (R !== r) return;
      if (won % SET === 0) await ctx.celebrate({ ms: 3200 });
      if (R !== r) return;
      await clear(r);
      if (R === r) newRound();
    }
    function clear(r) { for (const n of r.nodes) n.to({ alpha: 0, sx: n.sx * 0.9, sy: n.sy * 0.9 }, { dur: 0.3, ease: 'inOut' }).then(() => n.remove()); return ctx.wait(380); }

    /* ---------- the pointing hand ---------- */
    function killHand() { if (hand) { hand.remove(); hand = null; } }
    function showHand(P, t) {
      killHand();
      const h = hand = st.add({ z: 80, x: P.node.x, y: P.node.y, alpha: 0, press: 0 });
      h.draw = (g, s) => A.hand(g, s.res, h.press);
      h.to({ alpha: 1 }, { dur: 0.25 }).then(() => h.to({ press: 1 }, { dur: 0.25 })).then(() => h.to({ x: t.x, y: t.y }, { dur: 1.1, ease: 'inOut' }))
        .then(() => h.to({ press: 0 }, { dur: 0.2 })).then(() => h.to({ alpha: 0 }, { dur: 0.4, delay: 0.3 })).then(() => { if (hand === h) killHand(); });
    }
    ctx.every(1000, () => {
      if (!R || R.busy || hand || st.t - lastAct < (L === 1 ? 7 : 11)) return;
      const P = R.pieces.find((q) => !q.done && !q.grab), t = P && rightFor(P);
      if (t && (L === 1 || R.misses >= 2 || st.t - lastAct > 20)) { lastAct = st.t - 2; showHand(P, t); }
    });

    /* ---------- rounds ---------- */
    const base = (mode, o) => Object.assign({ mode, pieces: [], targets: [], nodes: [], misses: 0, busy: false, left: 0, centre: { x: boxR.x + boxR.w / 2, y: boxR.y + boxR.h / 2 } }, o);
    const pop = (n, d) => { n.sx = n.sy = 0.7; n.alpha = 0; n.to({ sx: 1, sy: 1, alpha: 1 }, { dur: 0.45, ease: 'back', delay: d || 0 }); return n; };

    /** A lid with holes. holes: [{shape, size, color}], pcs: [{shape, size, color}] */
    function holesRound(holes, pcs, o) {
      const r = R = base('holes', o), cx = r.centre.x, cy = r.centre.y;
      const gr = grid(holes.length, { x: boxR.x + 24, y: boxR.y + 22, w: boxR.w - 48, h: boxR.h - 44 }, 1), S = Math.min(gr.s * (o.rings ? 0.72 : 0.8), 236);
      holes.forEach((h, i) => { const at = gr.at(i), d = dims(h.shape, S * h.size); Object.assign(h, at, { D: mk(h.shape, d[0], d[1]), r: Math.max(d[0], d[1]) / 2 }); });
      r.targets = holes;
      r.box = pop(st.add({ z: 5, x: cx, y: cy, sprite: bake(res, [-boxR.w / 2, -boxR.h / 2, boxR.w, boxR.h + 22], (g, s) => {
        paintWood(g, s, -boxR.w / 2, -boxR.h / 2 + 22, boxR.w, boxR.h, 34, WOOD_D, 3);
        paintWood(g, s, -boxR.w / 2, -boxR.h / 2, boxR.w, boxR.h, 34, WOOD, 8);
        g.save(); g.beginPath(); A.rect(g, -boxR.w / 2 + 12, -boxR.h / 2 + 12, boxR.w - 24, boxR.h - 24, 24, 9, 0.6); g.strokeStyle = A.alpha('#FFF4DC', 0.4); g.lineWidth = 3; g.stroke(); g.restore();
        for (const h of holes) { g.save(); g.translate(h.x - cx, h.y - cy); paintHole(g, h.D, h.color && o.rings ? COL[h.color] : null); g.restore(); }
      }) }));
      r.nodes.push(r.box);
      r.accept = (P, t) => P.shape === t.shape && P.size === t.size && (!o.rings || P.color === t.color);
      r.why = (P, t) => (P.shape !== t.shape ? T.find(P.shape) : P.size !== t.size ? (P.size > t.size ? T.tooBig : T.tooSmall) : T.colour);
      r.hit = (P) => { let best = null; for (const t of holes) { const d = Math.hypot(P.node.x - t.x, P.node.y - t.y); if (d < t.r * 0.95 + 46 && (!best || d < best.d)) best = { t, d }; } return best && { t: best.t, ok: r.accept(P, best.t) }; };
      for (const p of pcs) { const d = dims(p.shape, S * p.size * 0.95); addPiece(mk(p.shape, d[0], d[1]), p.color, { shape: p.shape, size: p.size, face: true, say: T.name(p.shape), label: (o.rings ? p.color + ' ' : p.size < 1 ? 'small ' : '') + p.shape }); }
      r.left = pcs.length; layTray(r);
    }
    /** Roll a round's content until it differs from the round before. */
    const fresh = (gen) => { let v, n = 0; do { v = gen(); } while (v.key === lastKey && n++ < 8); return v; };
    function matchRound() {
      const { shapes, cols, key } = fresh(() => { const sh = K.shuffle(BASIC).slice(0, skill === 0 ? 3 : 4), c = K.shuffle(COLS); return { shapes: sh, cols: c, key: 'm' + sh.join() + c[0] }; });
      const pcs = shapes.map((s, i) => ({ shape: s, size: 1, color: cols[i] }));
      if (skill >= 2) for (const s of K.shuffle(shapes).slice(0, 2)) pcs.push({ shape: s, size: 1, color: cols[pcs.length % cols.length] });
      holesRound(shapes.map((s) => ({ shape: s, size: 1 })), pcs, { key, prompt: T.box });
    }
    function csRound() {
      const { shapes, cols, key } = fresh(() => { const sh = K.shuffle(NINE).slice(0, skill >= 2 ? 3 : 2), c = K.shuffle(COLS).slice(0, 2); return { shapes: sh, cols: c, key: 'c' + sh.slice().sort().join() }; }), holes = [];
      for (const c of cols) for (const s of shapes) holes.push({ shape: s, size: 1, color: c });
      const pcs = holes.map((h) => ({ shape: h.shape, size: 1, color: h.color }));
      if (skill === 1) for (const h of K.shuffle(holes).slice(0, 2)) pcs.push({ shape: h.shape, size: 1, color: h.color });
      holesRound(K.shuffle(holes), pcs, { key, prompt: T.cs, rings: true });
    }
    function sizeRound() {
      const { shapes, key } = fresh(() => { const sh = K.shuffle(NINE).slice(0, skill >= 2 ? 3 : 2); return { shapes: sh, key: 'z' + sh.slice().sort().join() }; }), cols = K.shuffle(COLS), holes = [];
      for (const s of shapes) for (const z of [1, 0.62]) holes.push({ shape: s, size: z });
      const pcs = holes.map((h, i) => ({ shape: h.shape, size: h.size, color: cols[i % cols.length] }));
      if (skill === 1) for (const h of K.shuffle(holes).slice(0, 2)) pcs.push({ shape: h.shape, size: h.size, color: cols[pcs.length % cols.length] });
      holesRound(K.shuffle(holes), pcs, { key, prompt: T.size });
    }
    /** Crates with a rule each. */
    function ruleRound() {
      const { ids, key } = fresh(() => { const v = K.shuffle(skill === 0 ? ['four', 'none', 'many'] : ['four', 'none', 'many', 'three']).slice(0, skill === 0 ? 2 : 3); return { ids: v, key: 'r' + v.slice().sort().join() }; });
      const r = R = base('bins', { key, prompt: T.rule });
      const gr = grid(ids.length, boxR, 0.9), cw = Math.min(gr.cw - 26, 440), ch = Math.min(gr.ch - 18, 400);
      r.targets = ids.map((id, i) => {
        const at = gr.at(i), rule = RULES[id], t = { rule, x: at.x, y: at.y, w: cw, h: ch, count: 0 };
        let lh = 70;
        const sp = bake(res, [-cw / 2, -ch / 2, cw, ch + 14], (g, s) => {
          paintWood(g, s, -cw / 2, -ch / 2 + 14, cw, ch, 26, WOOD_D, 4 + i);
          paintWood(g, s, -cw / 2, -ch / 2, cw, ch, 26, WOOD, 12 + i);
          lh = label(g, s, rule.label, 0, -ch / 2 + 50, cw - 44, rule.col) ;
          const iy = -ch / 2 + 50 + lh / 2 + 14, ih = ch / 2 - 18 - iy;
          g.beginPath(); A.rect(g, -cw / 2 + 18, iy, cw - 36, ih, 16, 6, 0.6); g.fillStyle = '#7B5238'; g.fill();
          g.save(); g.beginPath(); A.rect(g, -cw / 2 + 18, iy, cw - 36, ih, 16, 6, 0.6); g.clip(); g.beginPath(); A.rect(g, -cw / 2 + 24, iy + 10, cw - 36, ih, 16, 6, 0.6); g.fillStyle = '#8D6243'; g.fill(); g.restore();
          t.inner = { x: at.x - cw / 2 + 26, y: at.y + iy + 8, w: cw - 52, h: ih - 16 };
        });
        t.node = pop(st.add({ z: 5, x: at.x, y: at.y, sprite: sp, hit: { x: -cw / 2, y: -ch / 2, w: cw, h: ch }, pad: 0, label: rule.label }), i * 0.08);
        t.node.onTap = () => { K.sfx.tap(); ctx.say(rule.say); lastAct = st.t; };
        r.nodes.push(t.node);
        return t;
      });
      const n = [5, 6, 8][skill], cols = K.shuffle(COLS), picks = ids.slice();
      while (picks.length < n) picks.push(K.pick(ids));
      const per = Math.max(...ids.map((id) => picks.filter((x) => x === id).length));
      for (const t of r.targets) { const g2 = grid(Math.max(per, 4), t.inner, 1); t.small = g2.s * 0.84; t.spot = (k) => g2.at(k % Math.max(per, 4)); }
      const S = land ? 150 : 128, used = {}, order = {};
      for (const id of ids) order[id] = K.shuffle(RULES[id].shapes);
      picks.forEach((id, i) => {
        used[id] = (used[id] || 0) + 1;
        const shape = order[id][(used[id] - 1) % order[id].length];
        let d = dims(shape, S * (0.82 + Math.random() * 0.18)), sh = shape;
        if ((shape === 'rectangle' || shape === 'oval') && Math.random() < 0.4) d = [d[1], d[0]];
        if (shape === 'triangle' && used[id] % 2 === 0) sh = K.pick(['rtri', 'ltri', 'dtri']);
        const D = mk(sh, d[0], d[1]); D.shape = shape;
        addPiece(D, cols[i % cols.length], { shape, rule: RULES[id], say: T.name(shape) });
      });
      r.accept = (P, t) => t.rule.shapes.includes(P.shape);
      r.why = (P) => T.fact(P.shape);
      r.hit = (P) => { const t = r.targets.find((b) => Math.abs(P.node.x - b.x) < b.w / 2 + 14 && Math.abs(P.node.y - b.y) < b.h / 2 + 14); return t ? { t, ok: r.accept(P, t) } : null; };
      r.left = r.pieces.length; layTray(r);
    }
    /** A card with pale outlines; each piece has a place. parts: [{D, x, y, color, tone, in, whole}] */
    function slotsRound(parts, o) {
      const r = R = base('slots', o), cx = r.centre.x, cy = r.centre.y;
      const cw = Math.min(boxR.w, o.cardW || 760), ch = boxR.h;
      r.targets = parts.map((p, i) => Object.assign({ i, filled: false }, p));
      r.card = pop(st.add({ z: 5, x: cx, y: cy, sprite: bake(res, [-cw / 2, -ch / 2, cw, ch + 12], (g, s) => {
        paintWood(g, s, -cw / 2, -ch / 2 + 12, cw, ch, 30, WOOD_D, 3);
        g.beginPath(); A.rect(g, -cw / 2, -ch / 2, cw, ch, 30, 5, 1); A.paper(g, s, '#FBF4E4', { shadow: 0.6, light: 0.04, grain: 0.3, box: { x: -cw / 2, y: -ch / 2, w: cw, h: ch } });
        g.save(); g.setLineDash([3, 13]); g.lineCap = 'round'; g.strokeStyle = A.alpha(A.C.teal, 0.45); g.lineWidth = 4; g.beginPath(); A.rect(g, -cw / 2 + 16, -ch / 2 + 16, cw - 32, ch - 32, 18, 6, 0.6); g.stroke(); g.restore();
        const each = (fn) => { for (const t of r.targets) { g.save(); g.translate(t.x - cx, t.y - cy); g.beginPath(); t.D.path(g); fn(t); g.restore(); } };
        g.lineJoin = 'round';
        each(() => { g.strokeStyle = A.alpha(A.C.ink, 0.5); g.lineWidth = 7; g.stroke(); });
        each(() => { g.fillStyle = '#DCD0BA'; g.fill(); });
        each((t) => { if (!o.lines && !t.in) return; g.setLineDash([9, 9]); g.strokeStyle = A.alpha(A.C.ink, t.in ? 0.55 : 0.4); g.lineWidth = 3; g.stroke(); });
      }) }));
      r.nodes.push(r.card);
      for (const t of r.targets) addPiece(t.D, t.color, { shape: 'piece', key: t.D.key, tone: t.tone, thick: 5, label: 'piece' });
      r.accept = (P, t) => !t.filled && t.D.key === P.key;
      r.why = () => T.spot;
      r.hit = (P) => {
        let best = null;
        for (const t of r.targets) { if (!r.accept(P, t)) continue; const d = Math.hypot(P.node.x - t.x, P.node.y - t.y); if (d < Math.max(74, Math.max(P.D.w, P.D.h) * 0.5) && (!best || d < best.d)) best = { t, d }; }
        if (best) return { t: best.t, ok: true };
        return Math.abs(P.node.x - cx) < cw / 2 && Math.abs(P.node.y - cy) < ch / 2 ? { t: null, ok: false } : null;
      };
      r.left = r.pieces.length; layTray(r);
    }
    function fracRound() {
      const { kinds, bases, cuts } = fresh(() => {
        const two = skill > 0 || Math.random() < 0.5, kd = !two ? ['quarter'] : skill === 0 ? ['half', 'half'] : skill === 1 ? K.shuffle(['half', 'quarter']) : ['quarter', 'quarter'];
        const bs = K.shuffle(['circle', 'square']), ct = kd.map((kind, i) => K.pick(CUTS[bs[i % 2]][kind]));
        return { kinds: kd, bases: bs, cuts: ct, key: 'f' + kd.map((kind, i) => bs[i % 2] + kind + CUTS[bs[i % 2]][kind].indexOf(ct[i])).join() };
      });
      const cols = K.shuffle(COLS), parts = [];
      const gr = grid(kinds.length, { x: boxR.x + 20, y: boxR.y + 20, w: Math.min(boxR.w, 760) - 40, h: boxR.h - 40 }, 1), S = Math.min(gr.s * 0.84, 330), off = (boxR.w - Math.min(boxR.w, 760)) / 2;
      let key = 'f';
      kinds.forEach((kind, i) => {
        const b = bases[i % 2], cut = cuts[i], at = gr.at(i), whole = { n: cut.length, got: 0 }; key += b + kind + CUTS[b][kind].indexOf(cut);
        cut.forEach((part, k) => { const D = fracD(S, part); parts.push({ D, x: at.x + off + D.ox, y: at.y + D.oy, color: cols[i], tone: (k % 2 ? -0.035 : 0.02) * (k > 1 ? -1 : 1), whole }); });
      });
      const prompt = (kinds.length === 1 || kinds[0] === kinds[1] ? (kinds[0] === 'half' ? T.halves : T.quarters) : T.wholes) + ' ' + T.together;
      slotsRound(parts, { key, prompt, lines: true });
    }
    function picRound() {
      const pool = PICS.filter((p) => (skill === 0 ? p.parts.length === 3 : skill === 1 ? true : p.parts.length > 3)).filter((p) => 'i' + p.name !== lastKey), pic = K.pick(pool);
      const k = Math.min(boxR.w / 122, boxR.h / 128), cx = boxR.x + boxR.w / 2, cy = boxR.y + boxR.h / 2;
      slotsRound(pic.parts.map(([sh, x, y, w, h, color, inn]) => ({ D: mk(sh, w * k, h * k, 4), x: cx + x * k, y: cy + y * k, color, in: !!inn })), { key: 'i' + pic.name, prompt: T.pic, lines: skill < 2, doneSay: T.made(pic), cardW: Math.min(boxR.w, 620) });
    }
    const MAKE = { match: matchRound, cs: csRound, size: sizeRound, rule: ruleRound, frac: fracRound, pic: picRound };
    function newRound(force) {
      const kinds = L === 1 ? ['match'] : L === 2 ? ['cs', 'size'] : ['rule', 'frac', 'pic'], kind = force || kinds[roundNo++ % kinds.length];
      MAKE[kind]();
      R.kind = kind; lastKey = R.key; lastAct = st.t; K.sfx.whoosh();
      ctx.prompt(R.prompt, land ? null : { show: SHORT[kind] });   // the caption has little room on a phone
    }

    K._shapes = { unit: st.unit, get R() { return R; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; }, rightFor: (P) => rightFor(P), boxR, trayR,
      wrongFor: (P) => R.targets.find((t) => !R.accept(P, t)),
      go(kind, sk) { if (sk != null) skill = sk; if (R) for (const n of R.nodes) n.remove(); killHand(); newRound(kind); } }; // for browser tests
    ctx.onExit(() => { K._shapes = null; });
    ctx.after(300, () => newRound());
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#8FC2BA'; g.fillRect(0, 0, w, w);
    g.save(); g.scale(u, u);
    const rr = (x, y, ww, h, r, col) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + h, r); g.arcTo(x + ww, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); g.fillStyle = col; g.fill(); };
    rr(34, 62, 232, 170, 26, 'rgba(46,40,70,.18)'); rr(30, 50, 232, 170, 26, WOOD_D); rr(30, 36, 232, 170, 26, WOOD);
    g.fillStyle = HOLE;
    g.beginPath(); g.arc(92, 96, 34, 0, 7); g.fill();
    rr(150, 64, 64, 64, 8, HOLE);
    g.beginPath(); g.moveTo(92, 142); g.lineTo(128, 196); g.lineTo(56, 196); g.closePath(); g.fill();
    const star = (x, y, r, col, rot) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.46 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fillStyle = col; g.fill(); };
    star(186, 172, 30, HOLE, 0);
    g.beginPath(); g.arc(70, 252, 36, 0, 7); g.fillStyle = 'rgba(46,40,70,.2)'; g.fill();
    g.beginPath(); g.arc(66, 244, 36, 0, 7); g.fillStyle = COL.red; g.fill();
    star(232, 240, 46, 'rgba(46,40,70,.2)', 0.2); star(228, 232, 46, COL.yellow, 0.2);
    g.fillStyle = '#2E2A3B'; for (const [x, y] of [[54, 240], [78, 240], [216, 230], [240, 230]]) { g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); }
    g.restore();
  }

  K.game({ id: 'shapes', title: 'Shape Sorter', voice: 'shapes', group: 'arcade', age: 3, order: 13, icon, start, lines, resize: () => K.go('shapes') });
})();
