/* Treasure Map — grid coordinates and directions on a paper island.
   A parchment map of an island (beach, palms, rocks, a hut, a lake) with a lettered and numbered grid.
   As the finger slides over the map the column and the row light up, so the child sees how a coordinate
   is made; lifting the finger digs. Finds (shell, star, key, coin) go into the collection strip, and every
   fourth dig turns up the treasure chest.
   Level 1: 3x3 then 4x4, "Dig at B2".
   Level 2: 5x5 then 6x6; follow arrow clues from Pip ("2 right, 3 up"); read off where the X is.
   Level 3: 8x8 with number pairs (x, y); longer compass routes that bend round rocks and the lake;
            warmer / colder hunts where each dig shows how many squares away the treasure is; written clues.
   Nothing can be lost: a wrong dig is just an empty hole with its own name on it, and a hint. */
(function () {
  'use strict';
  const A = K.art, C = A.C;
  const CREAM = '#FBF6EC', INK = C.ink, SAND = '#F1DDA4', SEA = '#9DD0DE';
  const LET = 'ABCDEFGH';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = (n) => cap(K.numWord(n));
  const SAY = {
    dig: 'Dig here!', letter: 'Find the letter first.', number: 'Then go up to the number.',
    across: 'Go across first.', up: 'Then go up.',
    pip: 'Start at Pip.', arrows: 'Follow the arrows.', thenDig: 'Then dig!', count: 'Count the squares from Pip.',
    where: 'Where is the treasure?', pick: 'Pick its square.', under: 'Find the letter under it.', beside: 'Then find the number beside it.',
    hidden: 'The treasure is hidden.', far: 'Dig to see how far away it is.', warmer: 'Warmer!', colder: 'Colder!', same: 'The same!', glow: 'It can be in the glowing squares.',
    read: 'Read the clues.', one: 'Count the squares one by one.', sea: 'That is the sea!',
    shell: 'You found a shell!', star: 'You found a star!', key: 'You found a key!', coin: 'You found a coin!', chest: 'You found the treasure!',
  };
  function lines() {
    const out = Object.keys(SAY).map((k) => SAY[k]);
    for (let i = 0; i < 8; i++) out.push(LET[i] + '.');
    for (let i = 1; i <= 8; i++) out.push(num(i) + '.');
    return out;
  }
  const PIC = {};
  function pic(path) {
    let e = PIC[path];
    if (!e) { e = PIC[path] = { im: new Image(), ok: false }; e.im.onload = () => { e.ok = true; }; e.im.src = 'img/' + path + '.webp'; }
    return e;
  }
  const DIRS = {
    E: { dx: 1, dy: 0, ang: 0, w2: 'right', w3: 'east' }, W: { dx: -1, dy: 0, ang: Math.PI, w2: 'left', w3: 'west' },
    N: { dx: 0, dy: 1, ang: -Math.PI / 2, w2: 'up', w3: 'north' }, S: { dx: 0, dy: -1, ang: Math.PI / 2, w2: 'down', w3: 'south' },
  };
  const FINDS = ['shell', 'star', 'key', 'coin'];

  /* ---------------- little paper things ---------------- */
  const P = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);
  const box = (r) => ({ x: -r, y: -r, w: r * 2, h: r * 2 });
  const ART = {
    shell(g, s) {
      P(g, s, '#F4B49A', (h) => { h.moveTo(-12, 44); h.lineTo(-50, 2); h.quadraticCurveTo(-52, -22, -34, -30); h.quadraticCurveTo(-26, -46, -10, -40); h.quadraticCurveTo(0, -52, 10, -40); h.quadraticCurveTo(26, -46, 34, -30); h.quadraticCurveTo(52, -22, 50, 2); h.lineTo(12, 44); h.closePath(); }, { box: box(50), light: 0.1 });
      A.line(g, 'rgba(190,110,90,.6)', 3.5, (h) => { for (const [x, y] of [[-40, -8], [-22, -30], [0, -38], [22, -30], [40, -8]]) { h.moveTo(0, 38); h.lineTo(x, y); } });
      P(g, s, '#E89A80', (h) => A.rect(h, -16, 34, 32, 14, 6, 3, 0.4), { shadow: 0.3 });
    },
    star(g, s) {
      P(g, s, '#F2973D', (h) => { const pts = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 - 1.571, r = i % 2 ? 24 : 54; pts.push([Math.cos(a) * r, Math.sin(a) * r + 2]); } A.cut(h, pts, 9, 0.6, 4); }, { box: box(54), light: 0.1 });
      for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283 - 1.571; for (const r of [14, 28, 40]) { g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r + 2, r === 14 ? 3.4 : 2.6, 0, 7); g.fillStyle = 'rgba(255,236,190,.85)'; g.fill(); } }
    },
    key(g, s) {
      g.save(); g.rotate(-0.6);
      g.beginPath(); g.arc(-28, 0, 24, 0, 7); g.moveTo(-18, 0); g.arc(-28, 0, 10, 0, 7, true); A.rect(g, -6, -7, 62, 14, 5, 2, 0.3); A.rect(g, 30, 4, 10, 20, 3, 3, 0.3); A.rect(g, 46, 4, 10, 15, 3, 4, 0.3);
      g.save(); g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 8 * s; g.shadowOffsetY = 4 * s; g.fillStyle = '#E9B93B'; g.fill('evenodd'); g.restore();
      const gr = g.createLinearGradient(-50, -24, 50, 24); gr.addColorStop(0, '#F8DC78'); gr.addColorStop(1, '#D9A22C'); g.fillStyle = gr; g.fill('evenodd');
      A.line(g, 'rgba(255,255,255,.6)', 3, (h) => { h.moveTo(2, -3); h.lineTo(46, -3); });
      g.restore();
    },
    coin(g, s) {
      P(g, s, '#F2C23D', (h) => h.arc(0, 0, 44, 0, 7), { box: box(44), light: 0.12 });
      g.beginPath(); g.arc(0, 0, 34, 0, 7); g.strokeStyle = 'rgba(180,120,20,.6)'; g.lineWidth = 3.5; g.stroke();
      g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 - 1.571, r = i % 2 ? 9 : 21; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#D9982A'; g.fill();
      g.beginPath(); g.ellipse(-18, -20, 6, 12, 0.7, 0, 7); g.fillStyle = 'rgba(255,255,255,.45)'; g.fill();
    },
    chest(g, s, open) {
      if (open) {
        P(g, s, '#7A4A2A', (h) => A.cut(h, [[-44, -22], [44, -22], [50, -58], [-50, -58]], 8, 0.6, 3), { box: box(56) });
        g.fillStyle = '#5A3420'; g.beginPath(); A.rect(g, -42, -26, 84, 26, 4, 5, 0.3); g.fill();
        for (const [x, y] of [[-26, -18], [-6, -24], [16, -20], [30, -14], [-14, -10], [8, -10]]) { g.beginPath(); g.arc(x, y, 11, 0, 7); g.fillStyle = '#F2C23D'; g.fill(); g.strokeStyle = '#D9982A'; g.lineWidth = 2; g.stroke(); }
        g.beginPath(); g.arc(-2, -30, 5, 0, 7); g.fillStyle = '#E8664A'; g.fill(); g.beginPath(); g.arc(22, -28, 4, 0, 7); g.fillStyle = '#5B8FC7'; g.fill();
      } else P(g, s, '#B5783F', (h) => { h.moveTo(-48, -8); h.quadraticCurveTo(-48, -50, 0, -50); h.quadraticCurveTo(48, -50, 48, -8); h.closePath(); }, { box: box(52), light: 0.1 });
      P(g, s, '#A86B3C', (h) => A.rect(h, -48, -10, 96, 56, 8, 4, 0.8), { box: { x: -48, y: -10, w: 96, h: 56 }, light: 0.08 });
      g.fillStyle = '#E9B93B';
      if (!open) { g.save(); g.beginPath(); g.moveTo(-48, -8); g.quadraticCurveTo(-48, -50, 0, -50); g.quadraticCurveTo(48, -50, 48, -8); g.closePath(); g.clip(); g.fillRect(-34, -52, 10, 46); g.fillRect(24, -52, 10, 46); g.restore(); }
      for (const x of [-34, 24]) { g.beginPath(); A.rect(g, x, -10, 10, 56, 2, 6, 0.2); g.fill(); }
      g.beginPath(); A.rect(g, -48, -12, 96, 9, 3, 7, 0.3); g.fill();
      P(g, s, '#F2C23D', (h) => A.rect(h, -11, -6, 22, 24, 6, 8, 0.3), { shadow: 0.4 }); g.beginPath(); g.arc(0, 4, 4, 0, 7); g.fillStyle = '#7A4A2A'; g.fill();
    },
    palm(g, s, c) {
      A.line(g, '#8A5A3C', c * 0.12, (h) => { h.moveTo(-c * 0.06, c * 0.4); h.quadraticCurveTo(-c * 0.08, c * 0.05, c * 0.06, -c * 0.2); });
      A.line(g, 'rgba(60,34,22,.35)', c * 0.02, (h) => { for (let i = 0; i < 4; i++) { const y = c * (0.3 - i * 0.13); h.moveTo(-c * 0.11 + i * c * 0.02, y); h.lineTo(c * 0.0 + i * c * 0.03, y - c * 0.02); } });
      const fr = [[-2.9, 0.42, C.leafDark], [-0.25, 0.42, C.leafDark], [-2.3, 0.44, C.leaf], [-0.85, 0.44, C.leaf], [-1.57, 0.4, C.leafLight]];
      for (const [a, len, col] of fr) { g.save(); g.translate(c * 0.06, -c * 0.2); g.rotate(a); const l = c * len; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, -l * 0.34, l, l * 0.12); g.quadraticCurveTo(l * 0.5, l * 0.1, 0, 0); A.paper(g, s, col, { shadow: 0.5, light: 0.06 }); g.restore(); }
      for (const [x, y] of [[0.02, -0.15], [0.11, -0.16]]) { g.beginPath(); g.arc(c * x, c * y, c * 0.05, 0, 7); g.fillStyle = '#6B4430'; g.fill(); }
    },
    rock(g, s, c) {
      P(g, s, '#9097A0', (h) => A.blob(h, -c * 0.1, c * 0.1, c * 0.28, c * 0.22, 0.1, 7, 8), { box: { x: -c * 0.4, y: -c * 0.14, w: c * 0.6, h: c * 0.5 }, light: 0.1 });
      P(g, s, '#B3B9C0', (h) => A.blob(h, c * 0.16, c * 0.0, c * 0.2, c * 0.18, 0.1, 3, 8), { box: { x: -c * 0.04, y: -c * 0.2, w: c * 0.4, h: c * 0.4 }, light: 0.1 });
      P(g, s, '#A3A9B1', (h) => A.blob(h, c * 0.06, c * 0.22, c * 0.14, c * 0.1, 0.1, 5, 7), { shadow: 0.4 });
      A.line(g, 'rgba(255,255,255,.5)', c * 0.025, (h) => { h.moveTo(-c * 0.26, c * 0.02); h.quadraticCurveTo(-c * 0.2, -c * 0.08, -c * 0.08, -c * 0.08); h.moveTo(c * 0.08, -c * 0.1); h.quadraticCurveTo(c * 0.16, -c * 0.15, c * 0.24, -c * 0.1); });
    },
    hut(g, s, c) {
      P(g, s, '#D9A878', (h) => A.rect(h, -c * 0.25, -c * 0.04, c * 0.5, c * 0.4, c * 0.04, 3, 0.6), { box: { x: -c * 0.25, y: -c * 0.04, w: c * 0.5, h: c * 0.4 } });
      A.line(g, 'rgba(120,80,50,.4)', c * 0.02, (h) => { for (const x of [-0.13, 0.13]) { h.moveTo(c * x, c * 0.0); h.lineTo(c * x, c * 0.34); } });
      g.beginPath(); A.rect(g, -c * 0.08, c * 0.1, c * 0.16, c * 0.26, c * 0.06, 4, 0); g.fillStyle = '#5A4256'; g.fill();
      P(g, s, '#E0A63C', (h) => A.cut(h, [[-c * 0.38, c * 0.02], [0, -c * 0.42], [c * 0.38, c * 0.02]], c * 0.05, 0.6, 5), { box: { x: -c * 0.38, y: -c * 0.42, w: c * 0.76, h: c * 0.44 }, light: 0.1 });
      A.line(g, 'rgba(150,100,30,.5)', c * 0.02, (h) => { for (const x of [-0.2, -0.07, 0.07, 0.2]) { h.moveTo(c * x * 0.3, -c * 0.3); h.lineTo(c * x * 1.3, c * 0.0); } });
    },
    lake(g, s, w, h2) {
      P(g, s, '#F6E9BE', (h) => A.blob(h, 0, 0, w * 0.48, h2 * 0.46, 0.06, 9, 12), { shadow: 0, grain: 0.1 });
      P(g, s, '#74B9D8', (h) => A.blob(h, 0, 0, w * 0.43, h2 * 0.4, 0.07, 4, 12), { shadow: 0, box: { x: -w / 2, y: -h2 / 2, w, h: h2 }, light: 0.08 });
      A.line(g, 'rgba(255,255,255,.65)', Math.min(w, h2) * 0.03, (h) => { h.moveTo(-w * 0.22, -h2 * 0.1); h.quadraticCurveTo(-w * 0.1, -h2 * 0.18, 0, -h2 * 0.1); h.moveTo(w * 0.02, h2 * 0.12); h.quadraticCurveTo(w * 0.12, h2 * 0.05, w * 0.22, h2 * 0.12); });
      const m = Math.min(w, h2);
      g.beginPath(); g.ellipse(-w * 0.18, h2 * 0.14, m * 0.09, m * 0.06, 0, 0.5, 6.0); g.lineTo(-w * 0.18, h2 * 0.14); g.fillStyle = '#6FA65F'; g.fill();
      A.line(g, '#4F8752', m * 0.03, (h) => { for (const dx of [0, 0.06, 0.12]) { h.moveTo(w * (0.28 + dx), h2 * 0.3); h.lineTo(w * (0.3 + dx), h2 * (0.02 + dx)); } });
      for (const dx of [0, 0.06, 0.12]) { g.beginPath(); g.ellipse(w * (0.3 + dx), h2 * (0.0 + dx), m * 0.022, m * 0.06, 0.1, 0, 7); g.fillStyle = '#7A4A2A'; g.fill(); }
    },
  };
  const findSprite = (kind, open) => A.sprite('trsFind|' + kind + (open ? 'o' : ''), [-64, -66, 128, 128], (g, s) => ART[kind](g, s, open));
  const put = (g, sp, k) => { g.save(); g.scale(k, k); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore(); };
  const rr = (g, x, y, w, h, r) => { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  function arrowPath(g, len) { A.cut(g, [[-len * 0.5, -len * 0.14], [len * 0.05, -len * 0.14], [len * 0.05, -len * 0.4], [len * 0.52, 0], [len * 0.05, len * 0.4], [len * 0.05, len * 0.14], [-len * 0.5, len * 0.14]], len * 0.07, 0, 3); }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, SETS = 4;
    const S = land ? Math.min(H - 150, W - 470) : Math.min(W - 20, H - 590), X0 = land ? 30 : (W - S) / 2, Y0 = land ? 132 : 156;
    const ML = S * 0.085, PT = S * 0.03, G = S - ML - PT;
    const PN = land ? { x: X0 + S + 28, y: 150, w: W - (X0 + S + 28) - 28, h: H - 150 - 36 } : { x: 14, y: Y0 + S + 16, w: W - 28, h: H - (Y0 + S + 16) - 26 };
    const store = (K.s.done.treasure = K.s.done.treasure || {});
    let N = 3, cs = G / 3, cells = [], isle = null, R = null, hover = null, alive = true;
    let skill = 0, clean = 0, roundNo = 0, lastKey = '', findNo = K.randInt(0, 3), saidSea = false;
    const strip = [], holes = [], rings = [], junk = [];
    const wait = (ms) => ctx.wait(ms);
    const pairs = L >= 3;
    const name = (c, r) => (pairs ? `(${c + 1}, ${r + 1})` : LET[c] + (r + 1));
    const spoken = (c, r) => (pairs ? `${num(c + 1)}. ${num(r + 1)}.` : `${LET[c]}. ${num(r + 1)}.`);
    const cell = (c, r) => (c >= 0 && r >= 0 && c < N && r < N ? cells[r * N + c] : null);
    const cx = (c) => X0 + ML + (c + 0.5) * cs, cy = (r) => Y0 + PT + (N - 1 - r + 0.5) * cs;
    const free = (q) => q && q.land && !q.block;

    /* ---------- the desk ---------- */
    st.add({ z: 0, sprite: A.sprite('trsDesk' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#C99A66', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.06, grain: 0.35 });
      const rnd = A.rng(8); g.strokeStyle = 'rgba(90,56,30,.16)'; g.lineWidth = 3;
      for (let y = 0; y < H; y += 148) { g.beginPath(); g.moveTo(0, y + rnd() * 8); g.lineTo(W, y + rnd() * 8); g.stroke(); for (let i = 0; i < 3; i++) { const x = rnd() * W; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 148); g.stroke(); } }
      for (let i = 0; i < 30; i++) { const x = rnd() * W, y = rnd() * H; g.beginPath(); g.ellipse(x, y, 30 + rnd() * 60, 3, 0, 0, 7); g.fillStyle = 'rgba(90,56,30,.07)'; g.fill(); }
    }) });

    /* ---------- the island ---------- */
    const mapCv = document.createElement('canvas'), MP = 18;
    const rad = (a) => 0.5 * 0.95 * Math.pow(Math.pow(Math.abs(Math.cos(a)), 5) + Math.pow(Math.abs(Math.sin(a)), 5), -0.2) * (1 + 0.03 * Math.sin(3 * a + isle.p1) + 0.02 * Math.sin(5 * a + isle.p2));
    function newIsland(n) {
      N = n; cs = G / N; isle = { p1: Math.random() * 6, p2: Math.random() * 6, p3: Math.random() * 6, seed: K.randInt(1, 9999) };
      cells = []; holes.length = 0; rings.length = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const dx = (c + 0.5) / N - 0.5, dy = (r + 0.5) / N - 0.5; cells.push({ c, r, land: Math.hypot(dx, dy) <= rad(Math.atan2(dy, dx)), block: false, decor: null }); }
      // the lake, the hut, palms and rocks. On the big grids each fills a square and nothing is buried there.
      const big = N >= 5, lw = N >= 5 ? 2 : 1, lh = N >= 8 ? 2 : 1, decor = [];
      const inner = (q) => q.land && q.c > 0 && q.r > 0 && q.c < N - 1 && q.r < N - 1;
      const spots = K.shuffle(cells.filter((q) => { for (let i = 0; i < lw; i++) for (let j = 0; j < lh; j++) { const o = cell(q.c + i, q.r + j); if (!o || !o.land || (N >= 6 && !inner(o))) return false; } return true; }));
      if (spots.length) { const q = spots[0]; decor.push({ kind: 'lake', c: q.c, r: q.r, w: lw, h: lh }); for (let i = 0; i < lw; i++) for (let j = 0; j < lh; j++) cell(q.c + i, q.r + j).decor = 'lake'; }
      const rest = () => K.shuffle(cells.filter((q) => q.land && !q.decor));
      const count = { 3: [1, 1], 4: [2, 1], 5: [2, 2], 6: [3, 3], 8: [4, 5] }[N] || [2, 2];
      const hut = rest().find((q) => !big || inner(q)) || rest()[0]; hut.decor = 'hut'; decor.push({ kind: 'hut', c: hut.c, r: hut.r });
      for (const q of rest().slice(0, count[0])) { q.decor = 'palm'; decor.push({ kind: 'palm', c: q.c, r: q.r }); }
      for (const q of rest().slice(0, count[1])) { q.decor = 'rock'; decor.push({ kind: 'rock', c: q.c, r: q.r }); }
      if (big) for (const q of cells) if (q.decor) q.block = true;
      isle.decor = decor; isle.hut = hut; isle.big = big;
      paintMap(); cellNodes();
    }
    function paintMap() {
      const s = st.res, px = Math.ceil((S + MP * 2) * s);
      mapCv.width = mapCv.height = px;
      const g = mapCv.getContext('2d'); g.setTransform(s, 0, 0, s, MP * s, MP * s);
      const rnd = A.rng(isle.seed), edge = [];
      for (let i = 0; i < 4; i++) for (let k = 0; k < 7; k++) { const t = k / 7, j = () => (rnd() - 0.5) * 9; edge.push(i === 0 ? [t * S + j(), j()] : i === 1 ? [S + j(), t * S + j()] : i === 2 ? [S - t * S + j(), S + j()] : [j(), S - t * S + j()]); }
      g.beginPath(); A.cut(g, edge, 14, 0, 3); A.paper(g, s, '#F0DFB4', { shadow: 1, depth: 1.5, box: { x: 0, y: 0, w: S, h: S }, light: 0.06, grain: 0.4 });
      g.save(); g.beginPath(); A.cut(g, edge, 14, 0, 3); g.clip();
      for (let i = 0; i < 9; i++) { g.beginPath(); A.blob(g, rnd() * S, rnd() * S, 40 + rnd() * 80, 30 + rnd() * 60, 0.2, i + 3); g.fillStyle = 'rgba(170,120,60,.07)'; g.fill(); }
      g.strokeStyle = 'rgba(150,100,50,.25)'; g.lineWidth = 10; g.beginPath(); A.cut(g, edge, 14, 0, 3); g.stroke();
      g.restore();
      // the sea
      const sx = ML - 8, sy = PT - 8, sw = G + 16;
      g.save(); g.beginPath(); A.rect(g, sx, sy, sw, sw, 16, 5, 1.5); g.clip();
      g.beginPath(); g.rect(sx - 4, sy - 4, sw + 8, sw + 8); A.paper(g, s, SEA, { shadow: 0, box: { x: sx, y: sy, w: sw, h: sw }, light: 0.08, grain: 0.3 });
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 46; i++) { const x = sx + rnd() * sw, y = sy + rnd() * sw; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 9, y - 7, x + 18, y); g.quadraticCurveTo(x + 27, y - 7, x + 36, y); g.stroke(); }
      // the island: foam, sand, grass
      const ox = ML + G / 2, oy = PT + G / 2, shape = (k, wob, ph, seed) => { const pts = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.283, r = rad(a) * G * k * (1 + wob * Math.sin(4 * a + ph) + wob * 0.7 * Math.sin(7 * a + seed)); pts.push([ox + Math.cos(a) * r, oy - Math.sin(a) * r]); } return pts; };
      g.beginPath(); A.smooth(g, shape(1.035, 0, 0, 0)); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
      g.beginPath(); A.smooth(g, shape(1, 0, 0, 0)); A.paper(g, s, SAND, { shadow: 0.9, box: { x: sx, y: sy, w: sw, h: sw }, light: 0.06, grain: 0.3 });
      g.fillStyle = 'rgba(190,150,80,.4)'; for (let i = 0; i < 120; i++) { const a = rnd() * 6.283, r = rad(a) * G * (0.72 + rnd() * 0.25); g.beginPath(); g.arc(ox + Math.cos(a) * r, oy - Math.sin(a) * r, 1.5 + rnd() * 2, 0, 7); g.fill(); }
      g.beginPath(); A.smooth(g, shape(0.74, 0.035, isle.p3, isle.p1)); A.paper(g, s, '#A9D07C', { shadow: 0.35, box: { x: sx, y: sy, w: sw, h: sw }, light: 0.07, grain: 0.3 });
      for (let i = 0; i < 16; i++) { const a = rnd() * 6.283, r = rad(a) * G * rnd() * 0.6; g.beginPath(); A.blob(g, ox + Math.cos(a) * r, oy - Math.sin(a) * r, 20 + rnd() * G * 0.07, 14 + rnd() * G * 0.05, 0.15, i + 9); g.fillStyle = i % 3 ? 'rgba(120,175,90,.35)' : 'rgba(200,225,140,.4)'; g.fill(); }
      g.strokeStyle = 'rgba(79,135,82,.55)'; g.lineWidth = 2.5; for (let i = 0; i < 34; i++) { const a = rnd() * 6.283, r = rad(a) * G * rnd() * 0.66, x = ox + Math.cos(a) * r, y = oy - Math.sin(a) * r; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x - 7, y - 9); g.moveTo(x, y); g.lineTo(x, y - 12); g.moveTo(x + 5, y); g.lineTo(x + 7, y - 9); g.stroke(); }
      // what stands on it
      const lx = (c) => ML + c * cs, ly = (r) => PT + (N - 1 - r) * cs;
      for (const d of isle.decor.slice().sort((a, b) => b.r - a.r)) {
        g.save();
        if (isle.big) {
          if (d.kind === 'lake') { g.translate(lx(d.c) + d.w * cs / 2, ly(d.r + d.h - 1) + d.h * cs / 2); ART.lake(g, s, d.w * cs, d.h * cs); }
          else { g.translate(lx(d.c) + cs / 2, ly(d.r) + cs / 2); ART[d.kind](g, s, cs * 0.96); }
        } else {      // roomy squares: a small picture in the top corner, and the middle stays free for digging
          g.translate(lx(d.c) + cs * 0.74, ly(d.r) + cs * 0.27);
          if (d.kind === 'lake') ART.lake(g, s, cs * 0.5, cs * 0.38); else ART[d.kind](g, s, cs * 0.54);
        }
        g.restore();
      }
      g.restore();
      // the grid
      g.strokeStyle = 'rgba(46,42,59,.34)'; g.lineWidth = N >= 8 ? 2 : 2.6; g.beginPath();
      for (let i = 1; i < N; i++) { g.moveTo(ML + i * cs, PT); g.lineTo(ML + i * cs, PT + G); g.moveTo(ML, PT + i * cs); g.lineTo(ML + G, PT + i * cs); }
      g.stroke();
      g.strokeStyle = 'rgba(46,42,59,.6)'; g.lineWidth = 4; g.beginPath(); A.rect(g, ML, PT, G, G, 6, 2, 0.6); g.stroke();
    }

    /* ---------- the map on the stage ---------- */
    const map = st.add({ z: 10, x: X0, y: Y0, turn: 1 });
    const lf = () => K.clamp(cs * 0.42, 24, land ? 50 : 34);
    map.draw = (g) => {
      g.save(); g.translate(S / 2, 0); g.scale(map.turn, 1); g.translate(-S / 2, 0);
      g.drawImage(mapCv, -MP, -MP, S + MP * 2, S + MP * 2);
      if (map.turn < 0.98 || !R) { g.restore(); return; }
      const gx = ML, gy = PT, colX = (c) => gx + c * cs, rowY = (r) => gy + (N - 1 - r) * cs, pulse = 0.5 + 0.5 * Math.sin(st.t * 6);
      const hint = R.showLine ? R.target : null, hv = hover;
      // warmer / colder: squares it can still be in
      if (R.cands) for (const q of R.cands) { g.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * pulse})`; g.beginPath(); rr(g, colX(q.c) + 5, rowY(q.r) + 5, cs - 10, cs - 10, cs * 0.14); g.fill(); }
      for (const [q, a] of [[hint, 0.1 + 0.12 * pulse], [hv, 0.26]]) {
        if (!q) continue;
        g.fillStyle = `rgba(242,179,61,${a})`; g.fillRect(colX(q.c), gy, cs, G); g.fillRect(gx, rowY(q.r), G, cs);
      }
      if (hv) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(colX(hv.c), rowY(hv.r), cs, cs); g.strokeStyle = C.marigold; g.lineWidth = 6; g.beginPath(); rr(g, colX(hv.c) + 3, rowY(hv.r) + 3, cs - 6, cs - 6, cs * 0.12); g.stroke(); }
      if (R.showCell) { const q = R.target; g.strokeStyle = `rgba(232,102,74,${0.5 + 0.5 * pulse})`; g.lineWidth = 7; g.beginPath(); rr(g, colX(q.c) + 5, rowY(q.r) + 5, cs - 10, cs - 10, cs * 0.14); g.stroke(); }
      // the way, once it has been shown
      if (R.showPath && R.path) { g.save(); g.strokeStyle = C.tomato; g.lineWidth = Math.max(5, cs * 0.07); g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([2, cs * 0.2]); g.beginPath(); R.path.forEach((q, i) => { const x = colX(q.c) + cs / 2, y = rowY(q.r) + cs / 2; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); g.restore(); const q = R.path[0]; g.strokeStyle = C.teal; g.lineWidth = 6; g.beginPath(); g.arc(colX(q.c) + cs / 2, rowY(q.r) + cs / 2, cs * 0.42, 0, 7); g.stroke(); }
      // X marks the spot
      if (R.kind === 'reverse' && !R.dug) { const q = R.target, x = colX(q.c) + cs / 2, y = rowY(q.r) + cs / 2 + (isle.big ? 0 : cs * 0.1), k = cs * (isle.big ? 0.26 : 0.18) * (1 + 0.06 * pulse); A.line(g, 'rgba(255,255,255,.8)', cs * 0.15, (h) => { h.moveTo(x - k, y - k); h.lineTo(x + k, y + k); h.moveTo(x + k, y - k); h.lineTo(x - k, y + k); }); A.line(g, C.tomato, cs * 0.09, (h) => { h.moveTo(x - k, y - k); h.lineTo(x + k, y + k); h.moveTo(x + k, y - k); h.lineTo(x - k, y + k); }); }
      // holes, with what was learned there
      for (const o of holes) {
        const k = Math.min(1, (st.t - o.t) * 5), x = colX(o.c) + cs / 2, y = rowY(o.r) + cs / 2 + (isle.big ? cs * 0.12 : cs * 0.16), rx = Math.min(cs * 0.3, 70) * k;
        g.beginPath(); g.ellipse(x, y, rx * 1.25, rx * 0.72, 0, 0, 7); g.fillStyle = '#D5B26E'; g.fill();
        g.beginPath(); g.ellipse(x, y + rx * 0.04, rx, rx * 0.52, 0, 0, 7); g.fillStyle = '#6B4A33'; g.fill();
        g.beginPath(); g.ellipse(x, y + rx * 0.2, rx * 0.8, rx * 0.3, 0, 0, 7); g.fillStyle = '#4E3524'; g.fill();
        if (o.dist != null) {
          const col = o.dist <= 1 ? C.tomato : o.dist <= 3 ? '#EE8A3A' : o.dist <= 6 ? C.marigold : C.blue, r2 = Math.min(cs * 0.3, 44) * k;
          g.beginPath(); g.arc(x, y - cs * 0.22, r2, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke();
          g.font = `700 ${r2 * 1.3}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFFFFF'; g.fillText(String(o.dist), x, y - cs * 0.22 + r2 * 0.08);
        } else if (o.label) {
          const f = K.clamp(cs * 0.26, 20, 34); g.font = `700 ${f}px ${A.FONT_BODY}`; const tw = g.measureText(o.label).width + f * 0.8;
          g.beginPath(); rr(g, x - tw / 2, y - cs * 0.24 - f * 0.75, tw, f * 1.4, f * 0.5); g.fillStyle = 'rgba(251,246,236,.94)'; g.fill();
          g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(o.label, x, y - cs * 0.24);
        }
      }
      for (const o of rings) { const k = (st.t - o.t) / 0.7; if (k > 1) continue; g.beginPath(); g.ellipse(colX(o.c) + cs / 2, rowY(o.r) + cs / 2, cs * 0.5 * k, cs * 0.3 * k, 0, 0, 7); g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.lineWidth = 6; g.stroke(); }
      // letters and numbers round the edge
      const f = lf(); g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = 0; i < N; i++) {
        for (const ax of [0, 1]) {
          const on = (hv && (ax ? hv.r : hv.c) === i) || (hint && (ax ? hint.r : hint.c) === i), x = ax ? ML * 0.5 : colX(i) + cs / 2, y = ax ? rowY(i) + cs / 2 : gy + G + (S - gy - G) * 0.5 + 2, k = on ? 1.25 : 1;
          if (on) { g.beginPath(); g.arc(x, y, f * 0.72, 0, 7); g.fillStyle = hv && (ax ? hv.r : hv.c) === i ? C.marigold : A.alpha(C.marigold, 0.4 + 0.5 * pulse); g.fill(); }
          g.font = `700 ${f * k}px ${A.FONT_BODY}`; g.fillStyle = on ? '#FFFFFF' : '#6B4430'; g.fillText(ax || pairs ? String(i + 1) : LET[i], x, y + f * 0.04);
        }
      }
      g.restore();
    };
    function cellNodes() {
      for (const c of map.children.slice()) c.remove();
      for (const q of cells) {
        const n = map.add(new K.engine.Node({ x: ML + q.c * cs, y: PT + (N - 1 - q.r) * cs, hit: { x: 0, y: 0, w: cs, h: cs }, pad: 0, pressable: false, label: name(q.c, q.r) }));
        n.onDown = (p) => aim(p); n.onMove = (p) => aim(p);
        n.onUp = (p, e) => { const h = hover; if (!e || e.pointerType !== 'mouse') hover = null; if (h) dig(h.c, h.r); };
        n.onTap = (p) => { if (!p) dig(q.c, q.r); };
        q.node = n;
      }
    }
    function aim(p) {
      const c = Math.floor((p.x - X0 - ML) / cs), r = N - 1 - Math.floor((p.y - Y0 - PT) / cs), was = hover;
      hover = c >= 0 && r >= 0 && c < N && r < N ? { c, r } : null;
      if (hover && (!was || was.c !== c || was.r !== r)) K.sfx.tone(520 + r * 40 + c * 14, 0.04, { type: 'triangle', vol: 0.06 });
    }
    st.onmove = (p, e, s) => { if (!s && e && e.pointerType === 'mouse') aim(p); };
    // the name of the square under the finger, floating above it
    const chip = st.add({ z: 55 });
    chip.draw = (g) => {
      if (!hover || !R || R.lock) return;
      const t = name(hover.c, hover.r), f = land ? 44 : 38; g.font = `700 ${f}px ${A.FONT_BODY}`;
      const tw = g.measureText(t).width + 36, x = K.clamp(cx(hover.c), X0 + tw / 2, X0 + S - tw / 2); let y = cy(hover.r) - cs / 2 - 44; if (y < Y0 + 10) y = cy(hover.r) + cs / 2 + 44;
      g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 10 * st.res; g.shadowOffsetY = 4 * st.res; g.beginPath(); rr(g, x - tw / 2, y - 32, tw, 64, 26); g.fillStyle = CREAM; g.fill(); g.restore();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.tomato; g.fillText(t, x, y + 3);
    };

    /* ---------- Pip, who walks the routes ---------- */
    const pip = st.add({ z: 30, visible: false, happy: false });
    pip.draw = (g) => {
      const e = pic(pip.happy ? 'pip/pip-happy' : 'pip/pip'), h = K.clamp(cs * 0.92, 70, 190);
      g.beginPath(); g.ellipse(0, 4, h * 0.26, h * 0.07, 0, 0, 7); g.fillStyle = 'rgba(40,36,60,.22)'; g.fill();
      if (e.ok) { const w = h * e.im.width / e.im.height; g.drawImage(e.im, -w / 2, -h, w, h); }
      else { g.beginPath(); g.ellipse(0, -h * 0.42, h * 0.3, h * 0.4, 0, 0, 7); g.fillStyle = '#F08A2E'; g.fill(); g.fillStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * h * 0.1, -h * 0.52, h * 0.035, 0, 7); g.fill(); } }
    };
    const pipAt = (q) => ({ x: cx(q.c), y: cy(q.r) + cs * 0.36 });
    async function hop(q, dur) {
      const to = pipAt(q); pip.to({ x: to.x }, { dur, ease: 'linear' });
      const y0 = pip.y, top = Math.min(y0, to.y) - cs * 0.3;
      await pip.to({ y: top }, { dur: dur / 2, ease: 'out' }); await pip.to({ y: to.y }, { dur: dur / 2, ease: (t) => t * t });
    }

    /* ---------- the clue page ---------- */
    const stripH = land ? 132 : 108, bodyTop = land ? 96 : 70, bodyH = PN.h - stripH - bodyTop - (land ? 30 : 14);
    const slotX = (i) => PN.x + 14 + (PN.w - 28) * (i + 0.5) / 4, slotK = Math.min(stripH * 0.62, (PN.w - 28) / 4 * 0.74) / 120, slotY = PN.y + PN.h - stripH / 2 - 4;
    const page = st.add({ z: 10, x: PN.x, y: PN.y, pop: 0 });
    page.sprite = A.sprite('trsPage' + Math.round(PN.w) + 'x' + Math.round(PN.h), [-10, -10, PN.w + 20, PN.h + 20], (g, s) => {
      g.beginPath(); A.rect(g, 0, 0, PN.w, PN.h, 28, 4, 1.2); A.paper(g, s, CREAM, { shadow: 1, depth: 1.3, box: { x: 0, y: 0, w: PN.w, h: PN.h }, light: 0.04 });
      const y = PN.h - stripH - 8;
      g.beginPath(); A.rect(g, 14, y, PN.w - 28, stripH - 6, 22, 6, 0.8); A.paper(g, s, '#B9824F', { shadow: 0.6, box: { x: 14, y, w: PN.w - 28, h: stripH }, light: 0.08 });
      A.line(g, 'rgba(70,40,22,.25)', 3, (h) => { h.moveTo(30, y + stripH * 0.3); h.lineTo(PN.w - 30, y + stripH * 0.28); h.moveTo(30, y + stripH * 0.68); h.lineTo(PN.w - 30, y + stripH * 0.7); });
      for (let i = 0; i < 4; i++) { const x = 14 + (PN.w - 28) * (i + 0.5) / 4, r = Math.min(stripH * 0.36, (PN.w - 28) / 8 - 5); g.beginPath(); g.arc(x, y + stripH / 2 - 3, r, 0, 7); g.fillStyle = 'rgba(60,34,20,.28)'; g.fill(); g.beginPath(); g.arc(x, y + stripH / 2 - 1, r - 3, 0, 7); g.fillStyle = 'rgba(240,215,170,.3)'; g.fill(); }
    });
    const text = (g, t, x, y, f, col, font, align) => { g.font = `${font === 'T' ? 800 : 700} ${f}px ${font === 'T' ? A.FONT_TITLE : A.FONT_BODY}`; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillStyle = col || INK; g.fillText(t, x, y); };
    const TITLE = { coord: 'Dig at', pair: 'Dig at', route: 'Follow the arrows', reverse: 'Where is the treasure?', warm: 'How far away?', list: 'Read the clues' };
    const compass = (r) => A.sprite('trsRose' + Math.round(r), [-r - 8, -r - 8, r * 2 + 16, r * 2 + 16], (g, s) => {
      g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, '#F6E9C8', { shadow: 0.8, box: box(r), light: 0.06 });
      g.beginPath(); g.arc(0, 0, r * 0.9, 0, 7); g.strokeStyle = 'rgba(107,68,48,.5)'; g.lineWidth = 2.5; g.stroke();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, big = i % 2 === 0, len = r * (big ? 0.6 : 0.36), wd = r * (big ? 0.13 : 0.09); g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, -wd); g.lineTo(len, 0); g.lineTo(0, wd); g.closePath(); g.fillStyle = big ? (i === 6 ? C.tomato : C.teal) : C.marigold; g.fill(); g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.lineTo(0, wd); g.closePath(); g.fillStyle = 'rgba(46,42,59,.22)'; g.fill(); g.restore(); }
      g.beginPath(); g.arc(0, 0, r * 0.09, 0, 7); g.fillStyle = INK; g.fill();
      for (const [t, x, y] of [['N', 0, -r * 0.75], ['E', r * 0.76, 0], ['S', 0, r * 0.76], ['W', -r * 0.76, 0]]) text(g, t, x, y + 1, r * 0.26, t === 'N' ? C.tomato : '#6B4430', 'T');
    });
    page.draw = (g) => {
      // what has been found
      strip.forEach((k, i) => { g.save(); g.translate(slotX(i) - PN.x, slotY - PN.y); const q = slotK * (i === strip.length - 1 ? 1 + page.pop * 0.3 : 1); put(g, findSprite(k, k === 'chest'), q); g.restore(); });
      if (strip.length < 4) { g.save(); g.translate(slotX(3) - PN.x, slotY - PN.y); g.beginPath(); g.arc(0, 0, slotK * 64, 0, 7); g.fillStyle = 'rgba(251,246,236,.5)'; g.fill(); g.globalAlpha = 0.6; g.translate(0, stripH * 0.02); put(g, findSprite('chest'), slotK * 0.74); g.restore(); }
      if (store.chests) { const f = land ? 30 : 24, x = PN.w - (land ? 26 : 20), y = land ? 44 : 34; text(g, '× ' + store.chests, x, y, f, '#6B4430', 'T', 'right'); g.save(); g.translate(x - g.measureText('× ' + store.chests).width - f * 0.95, y + f * 0.1); put(g, findSprite('chest'), f * 1.4 / 120); g.restore(); }
      if (!R) return;
      const w = PN.w, mid = bodyTop + bodyH / 2, tf = land ? (w < 430 ? 32 : 38) : 30;
      text(g, TITLE[R.kind], store.chests && !land ? w / 2 - 30 : w / 2, land ? 54 : 38, R.kind === 'reverse' && w < 430 ? tf - 5 : tf, '#6B4430', 'T');
      if (R.kind === 'coord' || R.kind === 'pair') {
        const q = R.target, tw = Math.min(land ? 200 : 150, (w - (pairs ? 190 : 110)) / 2), th = Math.min(tw * 1.18, bodyH - 56), gap = pairs ? tw * 0.34 : 18, y0 = mid - th / 2 - 22;
        [0, 1].forEach((i) => {
          const x = w / 2 + (i ? gap / 2 : -gap / 2 - tw), lit = R.help && hover && (i ? hover.r === q.r : hover.c === q.c);
          g.save(); g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = 8 * st.res; g.shadowOffsetY = 4 * st.res; g.beginPath(); rr(g, x, y0, tw, th, 22); g.fillStyle = lit ? C.teal : i ? '#FFF1CC' : '#FCE1D6'; g.fill(); g.restore();
          text(g, pairs ? String((i ? q.r : q.c) + 1) : i ? String(q.r + 1) : LET[q.c], x + tw / 2, y0 + th / 2 + th * 0.04, th * 0.62, lit ? '#FFFFFF' : i ? '#B87514' : C.tomato);
          // which way to look for it
          const ay = y0 + th + 28; g.save(); g.translate(x + tw / 2 - (pairs ? 44 : 0), ay); g.rotate(i ? -Math.PI / 2 : 0); g.beginPath(); arrowPath(g, 36); g.fillStyle = i ? '#B87514' : C.tomato; g.fill(); g.restore();
          if (pairs) text(g, i ? 'up' : 'across', x + tw / 2 + 20, ay, 26, '#6B4430');
        });
        if (pairs) { const f = th * 0.5; text(g, '(', w / 2 - gap / 2 - tw - f * 0.22, y0 + th / 2, f, INK); text(g, ',', w / 2, y0 + th * 0.62, f, INK); text(g, ')', w / 2 + gap / 2 + tw + f * 0.22, y0 + th / 2, f, INK); }
      } else if (R.kind === 'route') {
        const n = R.legs.length, rr0 = land ? Math.min(100, w * 0.24, bodyH * 0.2) : Math.min(84, bodyH * 0.4), ccx = land ? w / 2 : rr0 + 26, ccy = land ? bodyTop + rr0 + 4 : mid;
        g.save(); g.translate(ccx, ccy); put(g, compass(rr0), 1);
        if (R.walkLeg != null) { const d = DIRS[R.legs[R.walkLeg].d]; g.rotate(d.ang); g.beginPath(); g.moveTo(rr0 * 0.2, -rr0 * 0.2); g.lineTo(rr0 * 0.74, 0); g.lineTo(rr0 * 0.2, rr0 * 0.2); g.closePath(); g.fillStyle = A.alpha(C.marigold, 0.85); g.fill(); }
        g.restore();
        const ax0 = land ? 22 : ccx + rr0 + 22, aw = w - ax0 - 22, ay0 = land ? ccy + rr0 + 22 : bodyTop + 4, ah = bodyTop + bodyH - ay0, cols = n > 2 || !land ? 2 : 1, rows = Math.ceil(n / cols);
        const tw = (aw - (cols - 1) * 12) / cols, th = Math.min(land ? 150 : 120, (ah - (rows - 1) * 12) / rows), yy = ay0 + (ah - rows * th - (rows - 1) * 12) / 2;
        R.legs.forEach((leg, i) => {
          const x = ax0 + (i % cols) * (tw + 12) + (cols === 1 ? 0 : 0), y = yy + Math.floor(i / cols) * (th + 12), on = R.walkLeg === i, d = DIRS[leg.d];
          g.save(); g.shadowColor = 'rgba(46,40,70,.2)'; g.shadowBlur = 7 * st.res; g.shadowOffsetY = 3 * st.res; g.beginPath(); rr(g, x, y, tw, th, 20); g.fillStyle = on ? '#FFE9A8' : '#F4EAD2'; g.fill(); g.restore();
          g.beginPath(); g.arc(x + 20, y + 20, 13, 0, 7); g.fillStyle = '#6B4430'; g.fill(); text(g, String(i + 1), x + 20, y + 21, 17, '#FFFFFF');
          const wordF = Math.min(28, th * 0.2), my = y + th * 0.43;
          text(g, String(leg.n), x + tw * 0.34, my + 2, th * 0.5, INK);
          g.save(); g.translate(x + tw * 0.68, my); g.rotate(d.ang); g.beginPath(); arrowPath(g, Math.min(th * 0.5, tw * 0.34)); g.fillStyle = C.tomato; g.fill(); g.restore();
          text(g, pairs ? d.w3 : d.w2, x + tw / 2, y + th - wordF * 0.85, wordF, '#6B4430');
        });
      } else if (R.kind === 'list') {
        const n = R.lines.length, lh = Math.min(land ? 84 : 58, bodyH / n), f = Math.min(land ? (w < 430 ? 29 : 35) : 30, lh * 0.56), y0 = mid - (n * lh) / 2 + lh / 2;
        R.lines.forEach((t, i) => {
          const y = y0 + i * lh, on = R.walkLeg === i - 1 && i > 0 && i < n - 1;
          if (on) { g.beginPath(); rr(g, 14, y - lh / 2 + 4, w - 28, lh - 8, 14); g.fillStyle = '#FFE9A8'; g.fill(); }
          g.beginPath(); g.arc(40, y, f * 0.52, 0, 7); g.fillStyle = [C.teal, C.tomato, C.plum, C.blue, C.marigold][i % 5]; g.fill(); text(g, String(i + 1), 40, y + 1, f * 0.6, '#FFFFFF');
          text(g, t, 40 + f * 0.95, y + 1, f, INK, 'B', 'left');
        });
      } else if (R.kind === 'warm') {
        const last = R.last;
        if (last == null) { text(g, '?', w / 2, mid - 10, Math.min(190, bodyH * 0.6), A.alpha(C.plum, 0.5 + 0.2 * Math.sin(st.t * 3)), 'T'); }
        else { const f = Math.min(land ? 200 : 150, bodyH * 0.56); text(g, String(last), w / 2, mid - f * 0.2, f * (1 + page.pop * 0.12), last <= 1 ? C.tomato : last <= 3 ? '#EE8A3A' : last <= 6 ? '#B87514' : C.blue); text(g, last === 1 ? 'square away' : 'squares away', w / 2, mid + f * 0.42, land ? 36 : 30, INK); text(g, 'across + up', w / 2, mid + f * 0.42 + (land ? 46 : 36), land ? 26 : 22, '#6B4430'); }
      }
    };
    page.update = (dt) => { page.pop = Math.max(0, page.pop - dt * 2.4); };

    /* ---------- digging ---------- */
    const sandFx = (x, y) => { ctx.fx.burst(x, y, { n: 12, colors: ['#E9CF8E', '#D5B26E', '#F1DDA4', '#C9A769'], star: false }); K.sfx.noise(0.16, { freq: 1100, vol: 0.22 }); K.sfx.tone(180, 0.1, { to: 90, vol: 0.16 }); };
    function bonk(q) {
      rings.push({ c: q.c, r: q.r, t: st.t });
      if (!q.land || q.decor === 'lake') { K.sfx.noise(0.3, { freq: 1500, vol: 0.2 }); K.sfx.tone(520, 0.18, { to: 260, vol: 0.12 }); ctx.fx.burst(cx(q.c), cy(q.r), { n: 9, colors: ['#BFE3F2', '#FFFFFF', '#74B9D8'], star: false }); if (!q.land && !saidSea) { saidSea = true; ctx.say(SAY.sea); } }
      else if (q.decor === 'rock') { K.sfx.tone(140, 0.12, { type: 'square', vol: 0.1 }); K.sfx.noise(0.05, { freq: 3000, vol: 0.2 }); }
      else if (q.decor === 'hut') { K.sfx.tone(300, 0.07, { type: 'triangle', vol: 0.2 }); K.sfx.tone(300, 0.07, { type: 'triangle', vol: 0.2, delay: 0.16 }); }
      else { K.sfx.noise(0.22, { freq: 3200, vol: 0.14 }); ctx.fx.burst(cx(q.c), cy(q.r) - cs * 0.2, { n: 5, colors: [C.leaf, C.leafLight], star: false }); }
    }
    function dig(c, r) {
      const q = cell(c, r);
      if (!q || !R || R.lock) return;
      if (R.kind === 'reverse') { K.sfx.tap(); for (const b of R.choices) b.pop = 0.6; return; }
      if (!free(q)) return bonk(q);
      if (holes.some((o) => o.c === c && o.r === r)) { K.sfx.tap(); return; }
      const t = R.target, x = cx(c), y = cy(r);
      if (R.kind === 'warm') {
        const d = Math.abs(c - t.c) + Math.abs(r - t.r);
        if (d === 0) return found(q);
        sandFx(x, y); holes.push({ c, r, t: st.t, dist: d }); R.digs.push({ c, r, d }); page.pop = 1; K.sfx.step(Math.max(0, 9 - d));
        if (R.last != null) ctx.say(d < R.last ? SAY.warmer : d > R.last ? SAY.colder : SAY.same);
        R.last = d;
        if (R.digs.length >= (skill > 0 ? 6 : 4)) { R.cands = cells.filter((o) => free(o) && R.digs.every((g2) => Math.abs(o.c - g2.c) + Math.abs(o.r - g2.r) === g2.d)); if (!R.toldGlow) { R.toldGlow = true; ctx.after(900, () => { if (R && R.kind === 'warm') ctx.say(SAY.glow); }); } }
        return;
      }
      if (q === t) return found(q);
      R.misses++; sandFx(x, y); holes.push({ c, r, t: st.t, label: name(c, r) }); K.sfx.whoops();
      if (R.kind === 'route') { ctx.say(SAY.count); if (R.misses >= 2) R.showPath = true; pip.to({ rot: 0.12 }, { dur: 0.1 }).then(() => pip.to({ rot: 0 }, { dur: 0.5, ease: 'elastic' })); }
      else if (R.kind === 'list') { ctx.say(SAY.one); if (R.misses >= 2) R.showPath = true; }
      else { ctx.say(pairs ? SAY.across + ' ' + SAY.up : SAY.letter + ' ' + SAY.number); if (R.misses >= 2) R.showLine = true; if (R.misses >= 3) R.showCell = true; }
    }
    async function walk() {
      const path = R.path; let k = 0;
      if (R.kind === 'list') { const p0 = pipAt(path[0]); pip.x = p0.x; pip.y = p0.y; pip.visible = true; pip.sx = pip.sy = 0; K.sfx.pop(); await pip.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back' }); }
      for (let i = 0; i < R.legs.length; i++) { R.walkLeg = i; for (let j = 0; j < R.legs[i].n; j++) { k++; K.sfx.step(k); await hop(path[k], 0.24); } await wait(160); }
      R.walkLeg = null;
    }
    async function found(q) {
      const me = R; R.lock = true; hover = null; R.showLine = R.showCell = false;
      if (R.path) { await walk(); R.showPath = false; }
      const x = cx(q.c), y = cy(q.r), kind = strip.length >= SETS - 1 ? 'chest' : FINDS[findNo++ % FINDS.length];
      R.dug = true; sandFx(x, y); holes.push({ c: q.c, r: q.r, t: st.t }); R.cands = null;
      const base = K.clamp(cs * 0.85, 96, 170) / 120, f = st.add({ z: 60, x, y: y + cs * 0.1, k: 0, open: false });
      f.draw = (g) => { g.rotate(Math.sin(st.t * 5) * 0.05); put(g, findSprite(kind, f.open), f.k); };
      f.to({ k: base * 1.2 }, { dur: 0.45, ease: 'back' }); await f.to({ y: y - cs * 0.3 }, { dur: 0.45, ease: 'back' });
      K.sfx.ding(); ctx.fx.burst(x, y - cs * 0.3, { n: 12, colors: [C.marigold, '#FFE27A', CREAM] }); pip.happy = true;
      ctx.say(SAY[kind]);
      if (kind === 'chest') { await wait(500); f.open = true; K.sfx.sparkle(); f.to({ k: base * 1.5 }, { dur: 0.3, ease: 'back' }); for (let i = 0; i < 3; i++) ctx.after(i * 180, () => ctx.fx.burst(x, y - cs * 0.4, { n: 12, colors: ['#F2C23D', '#FFE27A', '#F8DC78'], star: i % 2 === 0 })); }
      await wait(1300);
      const i = strip.length; f.to({ x: slotX(i), k: slotK }, { dur: 0.6, ease: 'inOut' }); K.sfx.whoosh(); await f.to({ y: slotY }, { dur: 0.6, ease: 'inOut' });
      strip.push(kind); page.pop = 1; f.remove(); K.sfx.pop(); K.sfx.step(i + 3);
      if (pip.visible) pip.to({ sx: 0, sy: 0 }, { dur: 0.25 }).then(() => { pip.visible = false; });
      if (me.misses >= 2) { skill = Math.max(0, skill - 1); clean = 0; } else if (me.misses === 0 && ++clean >= 2) { skill = Math.min(2, skill + 1); clean = 0; }
      roundNo++;
      await wait(500);
      let fresh = false;
      if (strip.length >= SETS) { store.chests = (store.chests || 0) + 1; K.save(); await ctx.celebrate({ ms: 3400 }); strip.length = 0; fresh = true; }
      if (R === me) next(null, fresh);
    }

    /* ---------- rounds ---------- */
    const sizeFor = () => (L === 1 ? (skill > 0 ? 4 : 3) : L === 2 ? (skill > 0 ? 6 : 5) : 8);
    const SEQ = { 1: ['coord'], 2: ['coord', 'route', 'reverse'], 3: ['pair', 'route', 'warm', 'list', 'reverse'] };
    function route(start, legsN, maxLen) {
      for (let tries = 0; tries < 300; tries++) {
        const path = [start], legs = []; let cur = start, prev = null, ok = true;
        for (let i = 0; i < legsN && ok; i++) {
          const opts = Object.keys(DIRS).filter((d) => !prev || (DIRS[d].dx !== 0) !== (DIRS[prev].dx !== 0));
          const d = K.pick(opts), n = K.randInt(1, maxLen), D = DIRS[d];
          for (let j = 0; j < n; j++) { const q = cell(cur.c + D.dx, cur.r + D.dy); if (!free(q) || path.indexOf(q) >= 0) { ok = false; break; } path.push(q); cur = q; }
          legs.push({ d, n }); prev = d;
        }
        if (ok && legs.reduce((a, l) => a + l.n, 0) >= legsN + (legsN > 1 ? 1 : 0)) return { path, legs, end: cur };
      }
      return null;
    }
    async function flip(n) {
      K.sfx.whoosh(); await map.to({ turn: 0 }, { dur: 0.22, ease: 'inOut' }); newIsland(n); await map.to({ turn: 1 }, { dur: 0.3, ease: 'back' });
    }
    async function next(force, fresh) {
      if (!alive) return;
      for (const n of junk.splice(0)) n.remove();
      const prev = R; R = null; hover = null; pip.happy = false;
      if (fresh || sizeFor() !== N) await flip(sizeFor()); else if (prev) { holes.length = 0; }
      const seq = SEQ[L] || SEQ[1]; let kind = force || seq[roundNo % seq.length];
      const frees = cells.filter(free);
      let target = null, extra = {};
      if (kind === 'route' || kind === 'list') {
        const legsN = kind === 'list' ? (skill > 0 ? 3 : 2) : L >= 3 ? (skill > 0 ? 4 : 3) : 2, fromHut = kind === 'list' && Math.random() < 0.6;
        let rt = null;
        for (let i = 0; i < 12 && !rt; i++) rt = route(fromHut && i < 6 ? isle.hut : K.pick(frees), legsN, L >= 3 ? 3 : Math.min(3, N - 2));
        if (!rt) kind = pairs ? 'pair' : 'coord';
        else {
          target = rt.end; extra = { path: rt.path, legs: rt.legs };
          if (kind === 'list') {
            const s0 = rt.path[0];
            extra.lines = [s0 === isle.hut ? 'Start at the hut.' : `Start at ${name(s0.c, s0.r)}.`].concat(rt.legs.map((l) => `Go ${l.n} ${l.n === 1 ? 'square' : 'squares'} ${DIRS[l.d].w3}.`), ['Dig!']);
          }
        }
      }
      if (!target) { const pool = frees.filter((q) => name(q.c, q.r) !== lastKey && (kind !== 'pair' || q.c !== q.r || frees.length < 6)); target = K.pick(pool.length ? pool : frees); }
      lastKey = name(target.c, target.r);
      const me = (R = Object.assign({ kind, target, misses: 0, lock: false, help: L < 3, choices: [], digs: [], last: null, walkLeg: null }, extra));
      page.pop = 0.6; K.sfx.pop();
      if (kind === 'coord' || kind === 'pair') ctx.prompt(SAY.dig + ' ' + spoken(target.c, target.r), { show: 'Dig at ' + name(target.c, target.r) });
      else if (kind === 'route') {
        const p0 = pipAt(R.path[0]); pip.x = p0.x; pip.y = p0.y; pip.rot = 0; pip.visible = true; pip.sx = pip.sy = 0; pip.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' });
        ctx.prompt(`${SAY.pip} ${SAY.arrows} ${SAY.thenDig}`);
      } else if (kind === 'list') ctx.prompt(`${SAY.read} ${SAY.thenDig}`);
      else if (kind === 'warm') ctx.prompt(`${SAY.hidden} ${SAY.far}`);
      else {
        // read off where the X is: the right name, and near misses
        const t = target, opts = [name(t.c, t.r)], add = (c, r) => { const q = cell(c, r), nm = q && name(c, r); if (q && opts.indexOf(nm) < 0 && opts.length < (L >= 3 ? 4 : 3)) opts.push(nm); };
        if (t.c !== t.r) add(t.r, t.c);
        for (const [dc, dr] of K.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2]])) add(t.c + dc, t.r + dr);
        const list = K.shuffle(opts), cols = land && PN.w < 430 ? 1 : 2, rows = Math.ceil(list.length / cols), bw = (PN.w - 44 - (cols - 1) * 16) / cols, bh = Math.min(land ? 128 : 108, (bodyH - (rows - 1) * 16) / rows), y0 = PN.y + bodyTop + (bodyH - rows * bh - (rows - 1) * 16) / 2;
        list.forEach((nm, i) => {
          const last1 = i === list.length - 1 && list.length % cols === 1 && cols === 2;
          const b = st.add({ z: 20, x: PN.x + 22 + bw / 2 + (last1 ? (bw + 16) / 2 : (i % cols) * (bw + 16)), y: y0 + bh / 2 + Math.floor(i / cols) * (bh + 16), label: 'choice ' + nm, hit: { x: -bw / 2, y: -bh / 2, w: bw, h: bh }, pad: 2, pop: 0, wob: 0, glow: false, nm, _bsx: 1, _bsy: 1, alpha: 0 });
          b.to({ alpha: 1 }, { dur: 0.25, delay: i * 0.07 });
          const sp = (glow) => A.sprite(`trsChoice|${nm}|${Math.round(bw)}|${Math.round(bh)}|${glow}`, [-bw / 2 - 10, -bh / 2 - 10, bw + 20, bh + 20], (g, s) => {
            if (glow) { g.beginPath(); A.rect(g, -bw / 2 - 7, -bh / 2 - 7, bw + 14, bh + 14, 30, 3, 0.5); g.fillStyle = C.marigold; g.fill(); }
            g.beginPath(); A.rect(g, -bw / 2, -bh / 2, bw, bh, 24, nm.length + i, 0.8); A.paper(g, s, '#FFF1CC', { shadow: 1, box: { x: -bw / 2, y: -bh / 2, w: bw, h: bh }, light: 0.05 });
            text(g, nm, 0, 4, Math.min(bh * 0.5, bw * 0.3), INK);
          });
          b.draw = (g) => { const q = sp(b.glow), k = 1 + b.pop * 0.1 + (b.glow ? Math.sin(st.t * 6) * 0.03 : 0); g.save(); g.rotate(Math.sin(b.wob * 24) * 0.1 * b.wob); g.scale(k, k); g.drawImage(q.canvas, -q.ox, -q.oy, q.w, q.h); g.restore(); };
          b.update = (dt) => { b.pop = Math.max(0, b.pop - dt * 3); b.wob = Math.max(0, b.wob - dt * 1.7); };
          b.onTap = () => {
            if (R !== me || R.lock) return;
            if (nm === name(t.c, t.r)) { K.sfx.ding(); b.pop = 1; for (const o of R.choices) if (o !== b) o.to({ alpha: 0.35 }, { dur: 0.3 }); found(t); return; }
            R.misses++; b.wob = 1; K.sfx.whoops(); ctx.say(pairs ? SAY.across + ' ' + SAY.up : SAY.under + ' ' + SAY.beside);
            if (R.misses >= 2) { R.showLine = true; R.choices.find((o) => o.nm === name(t.c, t.r)).glow = true; }
          };
          junk.push(b); R.choices.push(b);
        });
        ctx.prompt(`${SAY.where} ${SAY.pick}`);
      }
    }

    K._treasure = {
      get R() { return R; }, get N() { return N; }, get skill() { return skill; }, get strip() { return strip.slice(); }, get holes() { return holes; }, get cells() { return cells; },
      get target() { return R && R.target ? { c: R.target.c, r: R.target.r, name: name(R.target.c, R.target.r) } : null; },
      name, dig, free: () => cells.filter(free).map((q) => ({ c: q.c, r: q.r })), lines,
      /** Where a square is on screen, in CSS pixels. */
      at: (c, r) => ({ x: cx(c) * st.unit, y: cy(r) * st.unit }),
      jump(kind) { for (const n of junk.splice(0)) n.remove(); pip.visible = false; R = null; return next(kind); },
      setSkill(n) { skill = n; },
    };
    ctx.onExit(() => { alive = false; K._treasure = null; });
    pic('pip/pip'); pic('pip/pip-happy');
    newIsland(sizeFor());
    map.turn = 0; map.to({ turn: 1 }, { dur: 0.45, ease: 'back' });
    ctx.after(500, () => next());
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#C99A66'; g.fillRect(0, 0, w, w);
    g.save(); g.translate(150 * u, 150 * u); g.rotate(-0.05);
    g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 12 * u; g.shadowOffsetY = 6 * u; g.fillStyle = '#F0DFB4'; g.beginPath(); g.rect(-126 * u, -122 * u, 252 * u, 244 * u); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = '#9DD0DE'; g.fillRect(-108 * u, -106 * u, 216 * u, 212 * u);
    g.fillStyle = '#F1DDA4'; g.beginPath(); g.ellipse(0, 4 * u, 92 * u, 84 * u, 0.2, 0, 7); g.fill();
    g.fillStyle = '#A9D07C'; g.beginPath(); g.ellipse(-6 * u, 0, 62 * u, 54 * u, 0.3, 0, 7); g.fill();
    g.strokeStyle = 'rgba(46,42,59,.28)'; g.lineWidth = 2 * u; g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo((-108 + i * 54) * u, -106 * u); g.lineTo((-108 + i * 54) * u, 106 * u); g.moveTo(-108 * u, (-106 + i * 53) * u); g.lineTo(108 * u, (-106 + i * 53) * u); } g.stroke();
    g.strokeStyle = '#E8664A'; g.lineWidth = 5 * u; g.lineCap = 'round'; g.setLineDash([2 * u, 13 * u]); g.beginPath(); g.moveTo(-70 * u, 56 * u); g.quadraticCurveTo(-30 * u, -20 * u, 10 * u, 20 * u); g.quadraticCurveTo(36 * u, 40 * u, 52 * u, -22 * u); g.stroke(); g.setLineDash([]);
    g.lineWidth = 11 * u; g.beginPath(); g.moveTo(40 * u, -50 * u); g.lineTo(70 * u, -20 * u); g.moveTo(70 * u, -50 * u); g.lineTo(40 * u, -20 * u); g.stroke();
    g.strokeStyle = '#8A5A3C'; g.lineWidth = 8 * u; g.beginPath(); g.moveTo(-58 * u, 0); g.quadraticCurveTo(-62 * u, -30 * u, -50 * u, -52 * u); g.stroke();
    for (const [a, col] of [[-2.8, '#4F8752'], [-0.3, '#4F8752'], [-2.2, '#6FA65F'], [-0.9, '#6FA65F'], [-1.57, '#93C27A']]) { g.save(); g.translate(-50 * u, -52 * u); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(18 * u, -13 * u, 38 * u, 4 * u); g.quadraticCurveTo(18 * u, 4 * u, 0, 0); g.fill(); g.restore(); }
    g.restore();
  }

  K.game({ id: 'treasure', title: 'Treasure Map', voice: 'treasure', group: 'arcade', age: 7, subject: 'thinking', order: 38, icon, start, lines, resize: () => K.go('treasure') });
})();
