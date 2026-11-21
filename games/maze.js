/* Maze Run — Pip finds the way through a garden of paper hedges.
   Drag a finger along the path and Pip follows; or tap a cell close by, swipe, or use the arrow keys.
   Hedges only stop Pip (a rustle, no penalty). The footprints button shows the next few steps.
   Where Pip has been is left as a soft dotted trail. Every maze is generated and always solvable.
   Level 1: about 4 x 4, few dead ends and a way round, straight to a star, a picnic or Bunny.
   Level 2: about 6 x 6 with dead ends and three apples to pick up on the way.
   Level 3: 8 x 9 up to 12 x 9 (8 x 12 on a phone): coloured keys open matching gates, or
            "collect all three stars, then go to the door".
   Three mazes, a celebration, then bigger ones while the child manages without many hints. */
(function () {
  'use strict';
  const A = K.art, C = A.C, E = K.engine;
  const DIRS = [{ b: 1, dx: 0, dy: -1 }, { b: 2, dx: 1, dy: 0 }, { b: 4, dx: 0, dy: 1 }, { b: 8, dx: -1, dy: 0 }];
  DIRS.forEach((d, i) => { d.o = DIRS[(i + 2) % 4].b; });
  const KEYCOL = [{ name: 'red', c: '#E8664A' }, { name: 'blue', c: '#5B8FC7' }, { name: 'yellow', c: '#F2B33D' }];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const GOALS = {
    star: { ask: 'Help Pip reach the star!', show: 'Reach the star', win: 'You found the star!' },
    picnic: { ask: 'Help Pip get to the picnic!', show: 'Get to the picnic', win: 'Yum! Picnic time!' },
    bunny: { ask: 'Help Pip find Bunny!', show: 'Find Bunny', win: 'You found Bunny!' },
    door: { ask: 'Collect all three stars! Then go to the door.', show: 'Three stars, then the door', win: 'You made it!' },
  };
  const T = {
    draw: 'Draw the way with your finger.', apples: 'Pick up the apples on the way!',
    key1: 'Find the key to open the gate.', keys: 'Find the keys to open the gates.',
    need: (c) => `You need the ${c} key!`, got: (c) => `The ${c} key!`, open: 'The gate is open!',
    first: 'Find all the stars first!', door: 'The door is open!', hint: 'Follow the footprints!',
    count: (n) => cap(K.numWord(n)) + '!',
  };
  function lines() {
    const out = [T.draw, T.apples, T.key1, T.keys, T.open, T.first, T.door, T.hint], seen = {};
    for (const k in GOALS) out.push(GOALS[k].ask, GOALS[k].win);
    for (const k of KEYCOL) out.push(T.need(k.name), T.got(k.name));
    for (let n = 1; n <= 3; n++) out.push(T.count(n));
    return out.join(' ').match(/[^.!?…]+[.!?…]*/g).map((t) => t.trim()).filter((t) => { const key = K.voiceKey(t); if (!key || seen[key]) return false; seen[key] = 1; return true; });
  }
  const SIZES = {
    1: { land: [[5, 4], [5, 4], [6, 4]], port: [[4, 5], [4, 5], [4, 6]] },
    2: { land: [[7, 5], [8, 5], [8, 6]], port: [[5, 6], [6, 7], [6, 8]] },
    3: { land: [[9, 8], [10, 8], [11, 8], [12, 9]], port: [[8, 9], [8, 10], [8, 11], [8, 12]] },
  };

  /* ---------------- pictures (paper shapes stand in until they arrive) ---------------- */
  const PIC = {}, SRC = { star: 'img/star/star.webp', bunny: 'img/tales/bunny-happy.webp', cake: 'img/toot/cakes.webp', apple: 'img/kitchen/apple.webp', pip: 'img/pip/pip.webp' };
  for (const k in SRC) { const im = new Image(); im.onload = () => { PIC[k] = im; }; im.src = SRC[k]; }
  const starPath = (g, R) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.52 : R; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); };
  /** Draw a picture h tall, centred on (0,0). */
  function pic(g, name, h) {
    const im = PIC[name];
    if (im) { const w = h * im.width / im.height; g.drawImage(im, -w / 2, -h / 2, w, h); return; }
    const r = h / 2;
    if (name === 'star' || name === 'mini') { g.lineJoin = 'round'; starPath(g, r); g.fillStyle = name === 'mini' ? '#F7D27A' : '#F2B33D'; g.strokeStyle = g.fillStyle; g.lineWidth = r * 0.3; g.stroke(); g.fill(); }
    else if (name === 'apple') { g.fillStyle = '#D94B3F'; g.beginPath(); g.ellipse(-r * 0.28, r * 0.08, r * 0.6, r * 0.78, 0, 0, 7); g.ellipse(r * 0.28, r * 0.08, r * 0.6, r * 0.78, 0, 0, 7); g.fill(); g.fillStyle = '#6FA65F'; g.beginPath(); g.ellipse(r * 0.3, -r * 0.8, r * 0.34, r * 0.16, -0.5, 0, 7); g.fill(); }
    else if (name === 'cake') { g.fillStyle = '#F29AA8'; g.beginPath(); g.ellipse(0, -r * 0.2, r * 0.7, r * 0.6, 0, 0, 7); g.fill(); g.fillStyle = '#7FB5D6'; g.beginPath(); g.moveTo(-r * 0.66, r * 0.1); g.lineTo(r * 0.66, r * 0.1); g.lineTo(r * 0.5, r); g.lineTo(-r * 0.5, r); g.closePath(); g.fill(); g.fillStyle = '#D94B3F'; g.beginPath(); g.arc(0, -r * 0.78, r * 0.2, 0, 7); g.fill(); }
    else if (name === 'bunny') { g.fillStyle = '#CFC5BC'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * r * 0.24, -r * 0.62, r * 0.14, r * 0.38, d * 0.25, 0, 7); g.fill(); } g.beginPath(); g.ellipse(0, r * 0.45, r * 0.4, r * 0.55, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -r * 0.12, r * 0.38, 0, 7); g.fill(); g.fillStyle = '#2E2A3B'; for (const d of [-1, 1]) { g.beginPath(); g.arc(d * r * 0.15, -r * 0.16, r * 0.045, 0, 7); g.fill(); } }
    else { g.fillStyle = '#EE9A4E'; g.beginPath(); g.ellipse(0, r * 0.1, r * 0.7, r * 0.85, 0, 0, 7); g.fill(); }
  }
  function keyShape(g, s, r, col, paper) {
    g.save(); g.rotate(-0.5);
    const path = new Path2D(); path.arc(-r * 0.5, 0, r * 0.46, 0, 7); path.rect(-r * 0.2, -r * 0.13, r * 1.15, r * 0.26); path.rect(r * 0.46, r * 0.1, r * 0.17, r * 0.32); path.rect(r * 0.76, r * 0.1, r * 0.17, r * 0.4);
    if (paper) A.paper(g, s, col, { path, shadow: 0.8, grain: 0.15 }); else { g.fillStyle = col; g.fill(path); }
    g.beginPath(); g.arc(-r * 0.5, 0, r * 0.19, 0, 7); g.fillStyle = 'rgba(46,42,59,.55)'; g.fill();
    g.beginPath(); g.arc(-r * 0.62, -r * 0.16, r * 0.1, 0, 7); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
    g.restore();
  }
  function feet(g, r, col) { // two little footprints, walking towards +x
    g.fillStyle = col;
    for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * r * 0.22, d * r * 0.42, r * 0.36, r * 0.22, 0, 0, 7); g.fill(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(d * r * 0.22 + r * 0.52, d * r * 0.42 + i * r * 0.17, r * 0.085, 0, 7); g.fill(); } }
  }

  /* ---------------- making a maze ---------------- */
  function carve(cols, rows) {
    const n = cols * rows, cells = new Uint8Array(n), seen = new Uint8Array(n), stack = [K.randInt(0, n - 1)];
    seen[stack[0]] = 1;
    while (stack.length) {
      const c = stack[stack.length - 1], x = c % cols, y = (c - x) / cols;
      const opts = DIRS.filter((d) => { const nx = x + d.dx, ny = y + d.dy; return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx]; });
      if (!opts.length) { stack.pop(); continue; }
      const d = K.pick(opts), k = c + d.dx + d.dy * cols;
      cells[c] |= d.b; cells[k] |= d.o; seen[k] = 1; stack.push(k);
    }
    return cells;
  }
  const exits = (v) => (v & 1) + ((v >> 1) & 1) + ((v >> 2) & 1) + ((v >> 3) & 1);
  function flood(m, from, blocked) {
    const n = m.cells.length, dist = new Int16Array(n).fill(-1), prev = new Int16Array(n).fill(-1), q = [from]; dist[from] = 0;
    for (let h = 0; h < q.length; h++) { const c = q[h]; for (const d of DIRS) if (m.cells[c] & d.b) { const k = c + d.dx + d.dy * m.cols; if (dist[k] < 0 && !(blocked && blocked(c, k))) { dist[k] = dist[c] + 1; prev[k] = c; q.push(k); } } }
    return { dist, prev };
  }
  const trace = (prev, to) => { const out = []; for (let c = to; c >= 0; c = prev[c]) out.unshift(c); return out; };
  const ends = (m) => { const out = []; m.cells.forEach((v, c) => { if (exits(v) === 1) out.push(c); }); return out; };
  /** Open one wall of a dead end, so there is a second way round. */
  function braid(m, howMany) {
    for (const c of K.shuffle(ends(m)).slice(0, howMany)) {
      const x = c % m.cols, y = (c - x) / m.cols;
      const opts = DIRS.filter((d) => !(m.cells[c] & d.b) && x + d.dx >= 0 && y + d.dy >= 0 && x + d.dx < m.cols && y + d.dy < m.rows);
      if (opts.length) { const d = K.pick(opts); m.cells[c] |= d.b; m.cells[c + d.dx + d.dy * m.cols] |= d.o; }
    }
  }
  /** mode: 'plain' | 'apples' | 'keys' | 'stars'. Returns {cols, rows, cells, start, goal, path, items, gates}. */
  function makeMaze(cols, rows, mode, nGates) {
    let m = null;
    const tries = mode === 'plain' ? 14 : mode === 'keys' ? 6 : 3;
    for (let t = 0; t < tries; t++) {
      const c = { cols, rows, cells: carve(cols, rows) };
      c.start = K.pick([0, cols - 1, cols * (rows - 1), cols * rows - 1]);
      const f = flood(c, c.start); let far = 0; f.dist.forEach((d, i) => { if (d > f.dist[far]) far = i; });
      c.goal = far; c.score = mode === 'plain' ? -ends(c).length * 3 + f.dist[far] : f.dist[far];
      if (!m || c.score > m.score) m = c;
    }
    if (mode === 'plain') braid(m, 2); else if (mode === 'apples' && Math.random() < 0.4) braid(m, 1); else if (mode === 'stars') braid(m, 2);
    let f = flood(m, m.start);
    if (mode !== 'keys') { let far = m.goal; f.dist.forEach((d, i) => { if (d > f.dist[far]) far = i; }); m.goal = far; }
    const path = (m.path = trace(f.prev, m.goal)), onPath = new Set(path), used = new Set([m.start, m.goal]);
    m.items = []; m.gates = [];
    const put = (kind, cell, col) => { used.add(cell); m.items.push({ kind, cell, col, got: false }); };
    const farthest = (list, from) => { const fl = flood(m, from); return list.slice().sort((a, b) => fl.dist[b] - fl.dist[a])[0]; };
    if (mode === 'apples') {
      const side = ends(m).filter((c) => !onPath.has(c) && !used.has(c));
      put('apple', path[Math.max(1, Math.round(path.length * 0.3))]);
      const second = path[Math.min(path.length - 2, Math.round(path.length * 0.66))]; if (!used.has(second)) put('apple', second);
      const free = () => K.pick(Array.from(m.cells.keys()).filter((c) => !used.has(c)));
      while (m.items.length < 3) put('apple', side.length ? side.splice(K.randInt(0, side.length - 1), 1)[0] : free());
    } else if (mode === 'stars') {
      const cand = ends(m).filter((c) => !used.has(c)), all = Array.from(m.cells.keys());
      const spread = (c) => Math.min(...Array.from(used).map((u) => Math.abs((u % cols) - (c % cols)) + Math.abs(Math.floor(u / cols) - Math.floor(c / cols))));
      for (let i = 0; i < 3; i++) { const pool = (cand.filter((c) => !used.has(c)).length ? cand : all).filter((c) => !used.has(c)); put('star', pool.sort((a, b) => spread(b) - spread(a))[0]); }
    } else if (mode === 'keys') {
      const n = path.length < 9 ? 1 : nGates, at = n === 1 ? [0.55] : [0.36, 0.74], cols3 = K.shuffle([0, 1, 2]);
      const idx = at.map((k) => K.clamp(Math.round((path.length - 1) * k), 1, path.length - 2));
      if (n === 2 && idx[1] <= idx[0]) idx[1] = idx[0] + 1;
      const gate = (i) => ({ a: path[i], b: path[i + 1], col: cols3[m.gates.length], open: false });
      const shut = (list) => (a, b) => list.some((q) => (q.a === a && q.b === b) || (q.a === b && q.b === a));
      for (let k = 0; k < n; k++) {
        if (idx[k] >= path.length - 1) break;
        const gt = gate(idx[k]);
        // the key lies somewhere Pip can reach before this gate; best of all down a side path, beyond the gate before it
        const here = flood(m, m.start, shut([gt])), before = k ? flood(m, m.start, shut(m.gates.concat([gt]))) : null;
        const reach = Array.from(m.cells.keys()).filter((c) => here.dist[c] >= 0 && !used.has(c));
        const fresh = before ? reach.filter((c) => before.dist[c] < 0) : reach;
        const pick = (list) => { const off = list.filter((c) => !onPath.has(c)); return (off.length ? off : list).sort((a, b) => here.dist[b] - here.dist[a])[0]; };
        const cell = pick(fresh.length ? fresh : reach);
        if (cell == null) break;
        m.gates.push(gt); put('key', cell, gt.col);
      }
    }
    return m;
  }

  /* ---------------- painting the garden ---------------- */
  function meadow(g, s, W, H) {
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#86B974', { shadow: 0, light: 0.05, grain: 0.3, box: { x: 0, y: 0, w: W, h: H } });
    const rnd = A.rng(77);
    for (let i = 0; i < 26; i++) { g.beginPath(); A.blob(g, rnd() * W, rnd() * H, 70 + rnd() * 130, 40 + rnd() * 70, 0.12, i + 2); g.fillStyle = i % 2 ? 'rgba(111,166,95,.4)' : 'rgba(163,206,128,.3)'; g.fill(); }
    for (let i = 0; i < 90; i++) { const x = rnd() * W, y = rnd() * H; A.line(g, 'rgba(79,135,82,.55)', 3, (h) => { h.moveTo(x - 7, y); h.lineTo(x - 10, y - 12); h.moveTo(x, y); h.lineTo(x, y - 16); h.moveTo(x + 7, y); h.lineTo(x + 11, y - 11); }); }
    for (let i = 0; i < 34; i++) { const x = rnd() * W, y = rnd() * H, c = ['#FBF8F1', '#F6C7D0', '#F7D27A'][i % 3], r = 5 + rnd() * 3; g.fillStyle = c; for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.257) * r, y + Math.sin(p * 1.257) * r, r * 0.72, 0, 7); g.fill(); } g.fillStyle = i % 3 === 2 ? '#E8664A' : '#F2B33D'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill(); }
  }
  const rr = (p, x, y, w, h, r) => { p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); };
  function paintMaze(g, s, m, cs, t, seed) {
    const Wm = m.cols * cs, Hm = m.rows * cs, rnd = A.rng(seed);
    g.beginPath(); A.rect(g, -t * 0.3, -t * 0.3, Wm + t * 0.6, Hm + t * 0.9, t, 3, 1.5); A.paper(g, s, '#EBD8AF', { depth: 1.6, light: 0.04, grain: 0.3, box: { x: 0, y: 0, w: Wm, h: Hm } });
    for (let c = 0; c < m.cells.length; c++) for (let i = 0; i < 3; i++) { const x = (c % m.cols + 0.15 + rnd() * 0.7) * cs, y = (Math.floor(c / m.cols) + 0.2 + rnd() * 0.7) * cs; g.beginPath(); g.ellipse(x, y, cs * (0.03 + rnd() * 0.05), cs * (0.02 + rnd() * 0.03), rnd() * 3, 0, 7); g.fillStyle = i ? 'rgba(190,160,110,.3)' : 'rgba(255,250,235,.5)'; g.fill(); }
    // the start: a little round mat
    { const x = (m.start % m.cols + 0.5) * cs, y = (Math.floor(m.start / m.cols) + 0.5) * cs; g.beginPath(); g.ellipse(x, y + cs * 0.3, cs * 0.34, cs * 0.14, 0, 0, 7); g.fillStyle = 'rgba(232,102,74,.3)'; g.fill(); g.beginPath(); g.ellipse(x, y + cs * 0.3, cs * 0.24, cs * 0.09, 0, 0, 7); g.fillStyle = 'rgba(251,246,236,.55)'; g.fill(); }
    const P = new Path2D(), segs = [];
    for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
      const v = m.cells[y * m.cols + x];
      if (!(v & 1)) segs.push([x, y, 1]); if (!(v & 8)) segs.push([x, y, 0]);
      if (x === m.cols - 1) segs.push([x + 1, y, 0]); if (y === m.rows - 1) segs.push([x, y + 1, 1]);
    }
    for (const [x, y, hz] of segs) rr(P, x * cs - t / 2, y * cs - t / 2, hz ? cs + t : t, hz ? t : cs + t, t / 2);
    g.save(); g.translate(0, t * 0.34); A.paper(g, s, '#3F7347', { path: P, shadow: 0.9, light: 0, grain: 0.2 }); g.restore();
    A.paper(g, s, '#6FA65F', { path: P, shadow: 0, light: 0, grain: 0.3 });
    for (const [x, y, hz] of segs) for (let i = 0; i < 4; i++) {
      const k = (i + 0.2 + rnd() * 0.6) / 4, px = (x + (hz ? k : 0)) * cs + (rnd() - 0.5) * t * 0.4, py = (y + (hz ? 0 : k)) * cs + (rnd() - 0.5) * t * 0.4, r = t * (0.16 + rnd() * 0.14);
      g.beginPath(); g.arc(px, py - t * 0.06, r, 0, 7); g.fillStyle = i % 2 ? 'rgba(147,194,122,.75)' : 'rgba(79,135,82,.5)'; g.fill();
      if (rnd() < 0.07) { const c = rnd() < 0.5 ? '#FBF8F1' : '#F6C7D0', fr = t * 0.13; g.fillStyle = c; for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(px + Math.cos(p * 1.257) * fr, py + Math.sin(p * 1.257) * fr, fr * 0.75, 0, 7); g.fill(); } g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(px, py, fr * 0.6, 0, 7); g.fill(); }
    }
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const area = land ? { x: 152, y: 138, w: W - 304, h: H - 138 - 34 } : { x: 26, y: 142, w: W - 52, h: H - 142 - 160 };
    st.add({ z: 0, sprite: A.sprite('mazeMeadow' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => meadow(g, s, W, H)) });
    const board = document.createElement('canvas');        // one bitmap, repainted for every maze
    let R = null, layer = null, gen = 0, solved = 0, stage = 0, count = 0, lastGoal = '', lastMode = '', queue = [], moving = false, lastBump = -9, lastAct = 0, lastNag = -9, told = 0;
    const sizes = SIZES[L][land ? 'land' : 'port'];
    const slot = (i) => (land ? { x: 78, y: 236 + i * 96 } : { x: 64 + i * 86, y: H - 84 });

    /* ---------- a new maze ---------- */
    function build(o) {
      o = o || {}; gen++; queue = []; moving = false;
      if (layer) layer.remove();
      const [cols, rows] = o.size || sizes[Math.min(stage, sizes.length - 1)];
      const mode = o.mode || (L === 1 ? 'plain' : L === 2 ? 'apples' : lastMode === 'keys' ? 'stars' : lastMode === 'stars' ? 'keys' : K.pick(['keys', 'stars']));
      const m = makeMaze(cols, rows, mode, stage > 0 ? 2 : 1);
      const goal = mode === 'stars' ? 'door' : K.pick(['star', 'picnic', 'bunny'].filter((k) => k !== lastGoal));
      lastGoal = goal; lastMode = mode; count++;
      const cs = Math.min(area.w / cols, area.h / rows, 230), t = K.clamp(cs * 0.25, 15, 40);
      const ox = area.x + (area.w - cols * cs) / 2, oy = area.y + (area.h - rows * cs) / 2;
      const xy = (c) => ({ x: ox + (c % cols + 0.5) * cs, y: oy + (Math.floor(c / cols) + 0.5) * cs });
      const me = (R = { m, mode, goal, cols, rows, cs, t, ox, oy, xy, at: m.start, dest: m.start, trail: [], keys: {}, got: 0, hints: 0, over: false, steps: [], doorOpen: false });
      layer = st.add({ z: 5, alpha: 0 }); layer.to({ alpha: 1 }, { dur: 0.3 });
      // the hedges
      const pad = 44, s = st.res, bw = cols * cs + pad * 2, bh = rows * cs + pad * 2;
      board.width = Math.ceil(bw * s); board.height = Math.ceil(bh * s);
      const bg = board.getContext('2d'); bg.setTransform(s, 0, 0, s, pad * s, pad * s); paintMaze(bg, s, m, cs, t, count * 13 + 5);
      layer.add(new E.Node({ z: 0, x: ox, y: oy, sprite: { canvas: board, ox: pad, oy: pad, w: bw, h: bh } }));
      // the trail and the hint footprints
      layer.add(new E.Node({ z: 2, draw(g) {
        if (me.trail.length) { g.save(); g.setLineDash([0.1, cs * 0.2]); A.line(g, 'rgba(255,253,245,.75)', cs * 0.085, (h) => { for (const [a, b] of me.trail) { const p = xy(a), q = xy(b); h.moveTo(p.x, p.y + cs * 0.1); h.lineTo(q.x, q.y + cs * 0.1); } }); g.restore(); }
        for (const f of me.steps) {
          const age = st.t - f.t0; if (age < 0) continue;
          const k = age < 0.25 ? E.ease.back(age / 0.25) : 1, al = Math.min(1, (f.life - age) * 1.5); if (al <= 0) continue;
          g.save(); g.globalAlpha *= al; g.translate(f.x, f.y + cs * 0.08); g.rotate(f.ang); g.scale(k, k); feet(g, cs * 0.3, 'rgba(110,78,126,.72)'); g.restore();
        }
        me.steps = me.steps.filter((f) => st.t - f.t0 < f.life);
      } }));
      // the things to collect
      for (const it of m.items) {
        const p = xy(it.cell), n = layer.add(new E.Node({ z: 6, x: p.x, y: p.y, sx: 0, sy: 0, k: 1, ph: Math.random() * 6 }));
        it.node = n; n.to({ sx: 1, sy: 1 }, { dur: 0.35, ease: 'back', delay: 0.3 + Math.random() * 0.3 });
        n.draw = (g, s2) => {
          g.translate(0, it.got ? 0 : Math.sin(st.t * 3 + n.ph) * cs * 0.04);
          if (!it.got) { g.beginPath(); g.ellipse(0, cs * 0.3, cs * 0.18, cs * 0.05, 0, 0, 7); g.fillStyle = 'rgba(40,34,60,.14)'; g.fill(); }
          if (it.kind === 'key') { g.rotate(Math.sin(st.t * 2 + n.ph) * 0.12); keyShape(g, s2, cs * 0.3, KEYCOL[it.col].c, true); }
          else { if (it.kind === 'star' && !it.got) { const gl = g.createRadialGradient(0, 0, cs * 0.08, 0, 0, cs * 0.42); gl.addColorStop(0, 'rgba(255,214,90,.75)'); gl.addColorStop(1, 'rgba(255,214,90,0)'); g.fillStyle = gl; g.fillRect(-cs / 2, -cs / 2, cs, cs); } g.rotate(Math.sin(st.t * 2 + n.ph) * 0.1); pic(g, it.kind === 'apple' ? 'apple' : 'star', cs * (it.kind === 'apple' ? 0.5 : 0.54)); }
        };
      }
      // the gates
      for (const gt of m.gates) {
        const a = xy(gt.a), b = xy(gt.b), n = layer.add(new E.Node({ z: 7, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, rot: a.x === b.x ? 0 : Math.PI / 2, wob: 0 }));
        gt.node = n; n.update = (dt) => { n.wob = Math.max(0, n.wob - dt * 2.4); };
        n.draw = (g, s2) => {
          const col = KEYCOL[gt.col].c, w = cs - t * 0.6, h = t * 1.15;
          g.translate(Math.sin(st.t * 42) * 5 * n.wob, 0);
          g.beginPath(); A.rect(g, -w / 2, -h / 2 + t * 0.3, w, h, h * 0.3, 2, 0); g.fillStyle = A.shade(col, -0.2); g.fill();
          g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, h * 0.3, 2, 0); A.paper(g, s2, col, { shadow: 0.6, grain: 0.2 });
          for (let i = -2; i <= 2; i++) if (i) A.line(g, 'rgba(255,255,255,.4)', 3, (q) => { q.moveTo(i * w * 0.19, -h * 0.28); q.lineTo(i * w * 0.19, h * 0.28); });
          g.beginPath(); g.arc(0, 0, h * 0.62, 0, 7); g.fillStyle = '#FBF6EC'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(46,42,59,.4)'; g.stroke();
          g.rotate(-n.rot); g.fillStyle = C.ink; g.beginPath(); g.arc(0, -h * 0.12, h * 0.17, 0, 7); g.fill(); g.beginPath(); g.moveTo(-h * 0.1, 0); g.lineTo(h * 0.1, 0); g.lineTo(h * 0.16, h * 0.34); g.lineTo(-h * 0.16, h * 0.34); g.closePath(); g.fill();
        };
      }
      // the goal
      const gp = xy(m.goal), gn = layer.add(new E.Node({ z: 8, x: gp.x, y: gp.y, k: 1, wob: 0 })); me.goalNode = gn;
      gn.update = (dt) => { gn.wob = Math.max(0, gn.wob - dt * 2.2); };
      gn.draw = (g, s2) => {
        const q = 0.5 + Math.sin(st.t * 2.4) * 0.5, gl = g.createRadialGradient(0, 0, cs * 0.1, 0, 0, cs * (0.62 + q * 0.08));
        gl.addColorStop(0, `rgba(255,236,150,${0.6 + q * 0.2})`); gl.addColorStop(1, 'rgba(255,236,150,0)'); g.fillStyle = gl; g.fillRect(-cs, -cs, cs * 2, cs * 2);
        g.scale(gn.k, gn.k); g.translate(Math.sin(st.t * 40) * 5 * gn.wob, 0);
        if (goal === 'star') { g.translate(0, Math.sin(st.t * 2.4) * cs * 0.05); g.rotate(Math.sin(st.t * 1.7) * 0.1); pic(g, 'star', cs * 0.82); }
        else if (goal === 'bunny') { g.beginPath(); g.ellipse(0, cs * 0.36, cs * 0.24, cs * 0.06, 0, 0, 7); g.fillStyle = 'rgba(40,34,60,.16)'; g.fill(); g.translate(0, -cs * 0.08 - Math.abs(Math.sin(st.t * 3)) * cs * 0.04); pic(g, 'bunny', cs * 0.92); }
        else if (goal === 'picnic') {
          g.save(); g.translate(0, cs * 0.16); g.scale(1, 0.62); g.rotate(0.5); const b = cs * 0.34;
          g.beginPath(); A.rect(g, -b, -b, b * 2, b * 2, 5, 2, 1); A.paper(g, s2, '#FBF6EC', { shadow: 0.7, grain: 0.1 });
          g.fillStyle = 'rgba(232,102,74,.85)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) g.fillRect(-b + i * b / 2 + 1, -b + j * b / 2 + 1, b / 2 - 2, b / 2 - 2);
          g.restore(); g.translate(0, -cs * 0.06 + Math.sin(st.t * 2.4) * cs * 0.02); pic(g, 'cake', cs * 0.6);
        } else { // the garden door
          const w = cs * 0.56, h = cs * 0.82, x0 = -w / 2, y0 = -h * 0.56, door = (q2) => { q2.moveTo(x0, y0 + h); q2.lineTo(x0, y0 + w / 2); q2.arc(0, y0 + w / 2, w / 2, Math.PI, 0); q2.lineTo(x0 + w, y0 + h); q2.closePath(); };
          g.save(); g.scale(1.16, 1.1); g.translate(0, -h * 0.02); g.beginPath(); door(g); A.paper(g, s2, '#FBF6EC', { shadow: 0.8, grain: 0.1 }); g.restore();
          g.beginPath(); door(g); g.fillStyle = me.doorOpen ? '#FBE3A0' : '#B5764A'; g.fill();
          if (me.doorOpen) { g.beginPath(); g.moveTo(x0, y0 + h); g.lineTo(x0, y0 + w * 0.5); g.lineTo(x0 + w * 0.3, y0 + w * 0.3); g.lineTo(x0 + w * 0.3, y0 + h * 0.94); g.closePath(); g.fillStyle = '#8A5A3C'; g.fill(); }
          else { A.line(g, 'rgba(90,50,25,.45)', 2.5, (q2) => { for (const d of [-0.17, 0.17]) { q2.moveTo(d * w, y0 + h * 0.12); q2.lineTo(d * w, y0 + h); } }); g.beginPath(); g.arc(w * 0.3, y0 + h * 0.6, cs * 0.035, 0, 7); g.fillStyle = '#F2B33D'; g.fill(); }
          for (let i = 0; i < 3; i++) { g.save(); g.translate((i - 1) * cs * 0.24, y0 - cs * 0.13 - (i === 1 ? cs * 0.05 : 0)); if (i < me.got) pic(g, 'star', cs * 0.24); else { starPath(g, cs * 0.09); g.fillStyle = 'rgba(46,42,59,.22)'; g.fill(); } g.restore(); }
        }
      };
      // Pip
      const sp = xy(m.start);
      const pip = layer.add(new E.Node({ z: 10, x: sp.x, y: sp.y, face: sp.x > W / 2 ? -1 : 1, hop: 0, walk: 0, state: { mouth: 'smile', blink: 0, squash: 0 }, nextBlink: 2 }));
      me.pip = pip;
      pip.update = (dt) => { pip.walk = moving ? pip.walk + dt : 0; pip.nextBlink -= dt; if (pip.nextBlink < 0) { pip.state.blink = 1; if (pip.nextBlink < -0.14) { pip.state.blink = 0; pip.nextBlink = 2 + Math.random() * 3; } } };
      pip.draw = (g, s2) => {
        const k = cs * 0.84 / 172; pip.state.squash = moving ? Math.sin(pip.walk * 30) * 0.05 : Math.sin(st.t * 2.2) * 0.012;
        g.translate(0, cs * 0.33 - pip.hop); g.scale(k * pip.face, k); A.pip(g, s2 * k, pip.state);
      };
      pip.hop = cs * 0.5; pip.to({ hop: 0 }, { dur: 0.5, ease: 'back', delay: 0.2 });
      K.sfx.whoosh(); lastAct = st.t;
      let ask = GOALS[goal].ask;
      if (mode === 'apples') ask += ' ' + T.apples; else if (mode === 'keys') ask += ' ' + (m.gates.length > 1 ? T.keys : T.key1);
      if (count === 1) ask += ' ' + T.draw;
      ctx.prompt(ask, { show: land && ask.length < 44 ? ask : GOALS[goal].show });
    }

    /* ---------- walking ---------- */
    const gateBetween = (a, b) => R.m.gates.find((q) => !q.open && ((q.a === a && q.b === b) || (q.a === b && q.b === a)));
    const locked = (a, b) => { const q = gateBetween(a, b); return !!q && !R.keys[q.col]; };
    const dirTo = (a, b) => DIRS.find((d) => a + d.dx + d.dy * R.cols === b && (R.m.cells[a] & d.b));
    const base = () => (queue.length ? queue[queue.length - 1] : R.dest);
    function bump(d, c) {
      if (moving || st.t - lastBump < 0.3) return; lastBump = st.t;
      const p = R.xy(c == null ? R.at : c), pip = R.pip, cs = R.cs;
      pip.to({ x: p.x + d.dx * cs * 0.1, y: p.y + d.dy * cs * 0.1 }, { dur: 0.07, ease: 'out' }).then(() => pip.to({ x: p.x, y: p.y }, { dur: 0.16, ease: 'back' }));
      K.sfx.noise(0.07, { freq: 2600, vol: 0.05 }); K.sfx.tone(170, 0.06, { type: 'sine', vol: 0.07 });
      ctx.fx.burst(p.x + d.dx * cs * 0.45, p.y + d.dy * cs * 0.45, { n: 3, star: false, colors: ['#6FA65F', '#93C27A', '#4F8752'] });
    }
    function pump() {
      if (moving || !queue.length || !R || R.over) return;
      const c = R.at, n = queue.shift(), d = dirTo(c, n), me = R, my = gen;
      if (!d) { queue = []; return; }
      const gt = gateBetween(c, n);
      if (gt) {
        if (!R.keys[gt.col]) { queue = []; gt.node.wob = 1; bump(d); K.sfx.whoops(); if (st.t - lastNag > 3.5) { lastNag = st.t; ctx.say(T.need(KEYCOL[gt.col].name)); } return; }
        gt.open = true; K.sfx.ding(); ctx.fx.burst(gt.node.x, gt.node.y, { n: 12, color: KEYCOL[gt.col].c }); gt.node.to({ alpha: 0, sx: 0.2, sy: 1.4 }, { dur: 0.3, ease: 'inOut' }).then(() => gt.node.remove()); ctx.say(T.open);
      }
      moving = true; R.dest = n; lastAct = st.t; if (d.dx) R.pip.face = d.dx;
      const p = R.xy(n); K.sfx.tone(R.trail.length % 2 ? 330 : 294, 0.05, { type: 'triangle', vol: 0.06 });
      R.pip.to({ x: p.x, y: p.y }, { dur: R.cs > 150 ? 0.17 : 0.13, ease: 'linear' }).then(() => { if (my !== gen) return; moving = false; arrive(me, c, n); pump(); });
    }
    function arrive(me, from, n) {
      me.at = n; me.trail.push([from, n]); me.steps = me.steps.filter((f) => f.cell !== n);
      const it = me.m.items.find((q) => q.cell === n && !q.got);
      if (it) {
        it.got = true; me.got++; const p = me.xy(n), to = slot(it.kind === 'key' ? me.m.items.filter((q) => q.kind === 'key').indexOf(it) : me.got - 1);
        K.sfx.pop(); K.sfx.step(me.got + 2); ctx.fx.burst(p.x, p.y, { n: 9, color: it.kind === 'key' ? KEYCOL[it.col].c : it.kind === 'apple' ? '#E8664A' : '#F2B33D' });
        it.node.z = 12; layer._sorted = false; const k = (it.kind === 'key' ? 100 : 116) / me.cs;
        it.node.to({ x: to.x, y: to.y, sx: k, sy: k }, { dur: 0.45, ease: 'inOut' }).then(() => { it.node.visible = false; it.home = st.t; });
        if (it.kind === 'key') { me.keys[it.col] = true; ctx.say(T.got(KEYCOL[it.col].name)); }
        else if (it.kind === 'star' && me.got >= 3) { me.doorOpen = true; me.goalNode.to({ k: 1.3 }, { dur: 0.12 }).then(() => me.goalNode.to({ k: 1 }, { dur: 0.4, ease: 'elastic' })); K.sfx.sparkle(); ctx.say(T.count(3) + ' ' + T.door); }
        else ctx.say(T.count(me.got));
      }
      if (n !== me.m.goal) return;
      if (me.mode === 'stars' && !me.doorOpen) { queue = []; me.goalNode.wob = 1; K.sfx.whoops(); if (st.t - lastNag > 3.5) { lastNag = st.t; ctx.say(T.first); } return; }
      win();
    }
    async function win() {
      const me = R, my = gen, p = me.xy(me.m.goal), pip = me.pip; me.over = true; queue = [];
      pip.state.mouth = 'open'; K.sfx.ding(); K.sfx.sparkle(); ctx.fx.burst(p.x, p.y, { n: 22 });
      me.goalNode.to({ k: 1.25 }, { dur: 0.15 }).then(() => me.goalNode.to({ k: 1 }, { dur: 0.5, ease: 'elastic' }));
      for (let i = 0; i < 3; i++) ctx.after(i * 420, () => { if (my !== gen) return; K.sfx.step(i * 2 + 3); pip.to({ hop: me.cs * 0.28 }, { dur: 0.16, ease: 'out' }).then(() => pip.to({ hop: 0 }, { dur: 0.22, ease: 'inOut' })); });
      await Promise.all([ctx.say(GOALS[me.goal].win), ctx.wait(2100)]); if (my !== gen) return;
      solved++; stage = K.clamp(stage + (me.hints <= 1 ? 1 : me.hints >= 4 ? -1 : 0), 0, sizes.length - 1);
      if (solved % 3 === 0) { await ctx.celebrate({ ms: 3400 }); if (my !== gen) return; }
      await layer.to({ alpha: 0 }, { dur: 0.25 }); if (my !== gen) return;
      build();
    }

    /* ---------- finding the way (for the hint, and for a finger that is a few cells ahead) ---------- */
    const route = (from, to, strict) => { const f = flood(R.m, from, (a, b) => (strict ? locked(a, b) : false)); return f.dist[to] < 0 ? null : trace(f.prev, to).slice(1); };
    function objective() {
      const from = R.dest;
      if (R.mode === 'stars') { const left = R.m.items.filter((q) => !q.got); if (!left.length) return R.m.goal; const f = flood(R.m, from); return left.sort((a, b) => f.dist[a.cell] - f.dist[b.cell])[0].cell; }
      if (R.mode === 'keys') { const way = [from].concat(route(from, R.m.goal, false) || []); for (let i = 0; i + 1 < way.length; i++) { const q = gateBetween(way[i], way[i + 1]); if (q && !R.keys[q.col]) return R.m.items.find((k) => k.kind === 'key' && k.col === q.col).cell; } }
      return R.m.goal;
    }
    function hint() {
      if (!R || R.over) return;
      const way = route(R.dest, objective(), true) || route(R.dest, R.m.goal, false) || [];
      let prev = R.dest; R.steps = []; R.hints++; lastAct = st.t;
      way.slice(0, L === 1 ? 4 : 5).forEach((c, i) => { const a = R.xy(prev), b = R.xy(c); R.steps.push({ cell: c, x: b.x, y: b.y, ang: Math.atan2(b.y - a.y, b.x - a.x), t0: st.t + i * 0.13, life: 6 }); ctx.after(i * 130, () => K.sfx.tone(520 + i * 70, 0.07, { type: 'triangle', vol: 0.1 })); prev = c; });
      if (told < 2) { told++; ctx.say(T.hint); }
    }

    /* ---------- fingers, swipes and keys ---------- */
    const cellAt = (p) => { const x = K.clamp(Math.floor((p.x - R.ox) / R.cs), 0, R.cols - 1), y = K.clamp(Math.floor((p.y - R.oy) / R.cs), 0, R.rows - 1); return y * R.cols + x; };
    const near = (from, to, max) => { const f = flood(R.m, from); return f.dist[to] >= 0 && f.dist[to] <= max ? trace(f.prev, to).slice(1) : null; };
    function follow(p) {
      if (!R || R.over) return;
      const from = R.dest, target = cellAt(p);
      if (target === from) { queue = []; return; }
      const way = near(from, target, 3);
      if (way) { queue = way; pump(); return; }
      const c = R.xy(from), dx = p.x - c.x, dy = p.y - c.y;
      const order = (Math.abs(dx) >= Math.abs(dy) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]]).filter(([x, y]) => Math.abs(x + y) > R.cs * 0.55).map(([x, y]) => DIRS.find((d) => d.dx === Math.sign(x) && d.dy === Math.sign(y)));
      const open = order.find((d) => R.m.cells[from] & d.b);
      if (open) { queue = [from + open.dx + open.dy * R.cols]; pump(); } else if (order.length && !moving) bump(order[0]);
    }
    function step(d) {
      if (!R || R.over) return;
      const c = base();
      if (R.m.cells[c] & d.b) { if (queue.length < 2) queue.push(c + d.dx + d.dy * R.cols); pump(); } else bump(d);
    }
    function slide(d) {
      if (!R || R.over) return;
      let c = R.dest; const out = [];
      while (out.length < 24 && (R.m.cells[c] & d.b)) {
        const n = c + d.dx + d.dy * R.cols; out.push(n);
        if (locked(c, n) || n === R.m.goal || R.m.items.some((q) => q.cell === n && !q.got) || (R.m.cells[n] & ~(d.b | d.o))) break;
        c = n;
      }
      if (out.length) { queue = out; pump(); } else bump(d);
    }
    const ptrs = new Map();
    st.ondown = (p, e, n) => {
      if (!R || (n && n.ui)) return;
      lastAct = st.t;
      const c = R.xy(R.dest), close = Math.hypot(p.x - c.x, p.y - c.y) < R.cs * 1.5 || !!near(R.dest, cellAt(p), 3);
      ptrs.set(e.pointerId, { x: p.x, y: p.y, drag: close });
      if (close) follow(p);
    };
    st.onmove = (p, e) => {
      const q = ptrs.get(e.pointerId); if (!q || !R) return;
      lastAct = st.t;
      if (!q.drag) { const c = R.pip; if (Math.hypot(p.x - c.x, p.y - c.y) < R.cs * 0.9) q.drag = true; }
      if (q.drag) follow(p);
    };
    st.onup = (p, e) => {
      const q = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!q || !R || q.drag) return;
      const dx = p.x - q.x, dy = p.y - q.y;
      if (Math.hypot(dx, dy) > 36) slide(DIRS.find((d) => (Math.abs(dx) >= Math.abs(dy) ? d.dx === Math.sign(dx) && !d.dy : d.dy === Math.sign(dy) && !d.dx))); else follow(p);
    };
    const KEYS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3 };
    const onKey = (e) => { const i = KEYS[e.key]; if (i == null || e.metaKey || e.ctrlKey || e.altKey) return; e.preventDefault(); lastAct = st.t; step(DIRS[i]); };
    window.addEventListener('keydown', onKey); ctx.onExit(() => window.removeEventListener('keydown', onKey));

    /* ---------- the footprints button, and what has been collected ---------- */
    const hb = st.add({ ui: true, z: 100, x: W - 78, y: land ? 214 : H - 84, hitR: 52, label: 'Hint' });
    hb.draw = (g, s) => {
      const idle = R && !R.over && st.t - lastAct > 14, k = idle ? 1 + Math.sin(st.t * 6) * 0.06 : 1; g.scale(k, k);
      if (idle) { g.beginPath(); g.arc(0, 0, 56, 0, 7); g.fillStyle = 'rgba(242,179,61,.6)'; g.fill(); }
      const sp = A.sprite('mazeDisc', [-50, -50, 100, 100], (q, s2) => { q.beginPath(); q.arc(0, 0, 48, 0, 7); A.paper(q, s2, '#FBF6EC', { shadow: 0.9, light: 0.03, box: { x: -48, y: -48, w: 96, h: 96 } }); });
      g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
      g.rotate(-0.9); g.translate(-2, 0); feet(g, 38, '#6E4E7E');
    };
    hb.onTap = () => { K.sfx.tap(); hint(); };
    const hud = st.add({ ui: true, z: 98 });
    hud.draw = (g, s) => {
      if (!R || R.mode === 'plain') return;
      const list = R.mode === 'keys' ? R.m.items : [0, 1, 2], n = list.length, a = slot(0), b = slot(n - 1);
      g.beginPath(); A.rect(g, a.x - 46, a.y - 46, b.x - a.x + 92, b.y - a.y + 92, 40, 4, 0.5); g.fillStyle = 'rgba(251,246,236,.82)'; g.fill();
      const home = R.m.items.filter((x) => x.home != null);
      list.forEach((q, i) => {
        const p = slot(i), it = R.mode === 'keys' ? q : home[i], have = !!it && it.home != null;
        const pop = have ? 1 + Math.max(0, 0.35 - (st.t - it.home)) * 1.2 : 1;
        g.save(); g.translate(p.x, p.y); g.scale(pop, pop); if (!have) g.globalAlpha *= 0.22;
        if (R.mode === 'keys') keyShape(g, s, 30, have ? KEYCOL[q.col].c : '#2E2A3B', false); else if (have) pic(g, R.mode === 'apples' ? 'apple' : 'star', R.mode === 'apples' ? 58 : 62); else { g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fillStyle = '#2E2A3B'; g.fill(); }
        g.restore();
      });
    };

    K._maze = { // for browser tests
      get R() { return R && { mode: R.mode, goal: R.goal, cols: R.cols, rows: R.rows, cs: R.cs, at: R.at, start: R.m.start, end: R.m.goal, over: R.over, got: R.got, hints: R.hints, keys: Object.assign({}, R.keys), doorOpen: R.doorOpen, trail: R.trail.length, steps: R.steps.map((f) => f.cell), items: R.m.items.map((q) => ({ kind: q.kind, cell: q.cell, col: q.col, got: q.got })), gates: R.m.gates.map((q) => ({ a: q.a, b: q.b, col: q.col, open: q.open })), cells: Array.from(R.m.cells), path: R.m.path }; },
      get solved() { return solved; }, get stage() { return stage; }, set stage(v) { stage = v; }, get moving() { return moving || queue.length > 0; },
      build, hint, step: (i) => step(DIRS[i]), slide: (i) => slide(DIRS[i]), xy: (c) => R.xy(c),
      /** The next cell on the way to whatever is needed now. */
      next() { const way = route(R.dest, objective(), true); return way && way.length ? way[0] : -1; },
      go(c) { queue = [c]; pump(); },
      makeMaze, flood,
    };
    ctx.onExit(() => { K._maze = null; });
    ctx.after(250, () => build());
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#86B974'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#EBD8AF'; g.beginPath(); if (g.roundRect) g.roundRect(26 * u, 26 * u, 248 * u, 248 * u, 22 * u); else g.rect(26 * u, 26 * u, 248 * u, 248 * u); g.fill();
    const c = 62 * u, o = 26 * u, walls = [[0, 0, 4, 0], [0, 4, 4, 4], [0, 0, 0, 4], [4, 0, 4, 4], [1, 0, 1, 2], [1, 3, 3, 3], [2, 1, 2, 3], [2, 1, 3, 1], [3, 2, 4, 2], [0, 3, 1, 3]];
    g.lineCap = 'round';
    for (const [col, dy] of [['#3F7347', 6 * u], ['#6FA65F', 0]]) { g.strokeStyle = col; g.lineWidth = 17 * u; g.beginPath(); for (const [x0, y0, x1, y1] of walls) { g.moveTo(o + x0 * c, o + y0 * c + dy); g.lineTo(o + x1 * c, o + y1 * c + dy); } g.stroke(); }
    g.setLineDash([0.1, 13 * u]); g.strokeStyle = 'rgba(255,253,245,.9)'; g.lineWidth = 6 * u; g.beginPath(); g.moveTo(o + c * 0.5, o + c * 3.5); g.lineTo(o + c * 0.5, o + c * 2.5); g.lineTo(o + c * 1.5, o + c * 2.5); g.lineTo(o + c * 1.5, o + c * 0.5); g.lineTo(o + c * 2.6, o + c * 0.5); g.stroke(); g.setLineDash([]);
    g.save(); g.translate(o + c * 0.5, o + c * 3.42); pic(g, 'pip', c * 0.98); g.restore();
    g.save(); g.translate(o + c * 3.5, o + c * 0.5); g.rotate(0.15); pic(g, 'star', c * 0.86); g.restore();
  }

  K.game({ id: 'maze', title: 'Maze Run', voice: 'maze', group: 'arcade', age: 7, order: 31, icon, start, lines, resize: () => K.go('maze') });
})();
