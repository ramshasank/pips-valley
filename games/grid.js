/* Picture Sudoku - a wooden tray of pictures. Every row and every column (and every box, on the bigger
   trays) must hold each picture once. Tap an empty space, then tap a picture on the side tray; or drag a
   picture straight into a space. A picture that is already in that row, column or box hops back out, the
   row lights up gently and the reason is spoken. Nothing is ever marked wrong and nothing is lost.
   The lamp button shows the next space that can be worked out, and says why; pressed again it shows which
   picture goes there. A picture the child placed can be changed by tapping it and picking another.

   Level 1: 3x3 with three pictures and one or two empty spaces (rows and columns only).
   Level 2: 4x4 with 2x2 boxes and five to seven empty spaces.
   Level 3: 4x4 with eight to ten empty spaces, then 6x6 with 2x3 boxes, pictures or the numbers 1 to 6.
   Puzzles are made in code. Each one can be solved one step at a time with plain looking (a space where
   only one thing fits, or a thing with only one space left), so it has exactly one solution and the lamp
   always has a next step to show. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, Kt = A.kitchen;

  /* ---------------- pictures and numbers ---------------- */
  const FRUITS = [
    { id: 'apple', a: 'an apple', col: '#D94B3F' }, { id: 'banana', a: 'a banana', col: '#F3CE4B' }, { id: 'pear', a: 'a pear', col: '#B5C957' },
    { id: 'carrot', a: 'a carrot', col: '#EE8A3A' }, { id: 'donut', a: 'a donut', col: '#EE8FA8' }, { id: 'cookie', a: 'a cookie', col: '#C99255' },
  ].map((f) => Object.assign(f, { label: f.id }));
  const DIGC = ['#E8664A', '#D9963A', '#2F8F8A', '#5B8FC7', '#6E4E7E', '#4F8752'];
  const NUMS = [1, 2, 3, 4, 5, 6].map((n) => ({ id: 'n' + n, n, a: 'a ' + K.numWord(n), label: 'number ' + n, col: DIGC[n - 1] }));
  const SYM = {}; for (const s of FRUITS.concat(NUMS)) SYM[s.id] = s;

  /* ---------------- spoken lines ---------------- */
  const T = {
    rowsPic: 'Every row needs every picture.',
    rowsNum: 'Every row needs every number.',
    cols: 'Every column too.',
    boxes: 'And every box.',
    tap: 'Tap an empty space.',
    pickPic: 'Then pick a picture.',
    pickNum: 'Then pick a number.',
    firstTap: 'First tap an empty space.',
    clash: (s, unit) => `There is already ${s.a} in this ${unit}.`,
    look: { row: 'Look at this row.', column: 'Look at this column.', box: 'Look at this box.' },
    oneEmpty: 'Only one space is empty.',
    onlyOne: 'Only one fits here.',
    rowCol: 'Look along its row and its column.',
    boxToo: 'Look at its box too.',
    onePlacePic: 'This picture can only go in one space.',
    onePlaceNum: 'This number can only go in one space.',
    glow: 'Try the glowing one.',
    another: 'This one needs another look.',
    done: 'Everything is in its place!',
    newP: 'Here is a new puzzle.',
    bigger: 'This one is bigger.',
  };
  function lines() {
    const out = [];
    for (const v of Object.values(T)) { if (typeof v === 'string') out.push(v); else if (typeof v === 'object') out.push(...Object.values(v)); }
    for (const s of FRUITS.concat(NUMS)) for (const u of ['row', 'column', 'box']) out.push(T.clash(s, u));
    return out;
  }

  /* ---------------- the puzzle maker ---------------- */
  const boxDims = (N) => (N === 4 ? [2, 2] : N === 6 ? [2, 3] : null);   // rows and columns of one box
  const unitCache = {};
  /** Every row, column and box of an N by N tray: {all: [{type, cells}], of: [units of each cell]}. */
  function units(N) {
    if (unitCache[N]) return unitCache[N];
    const all = [], of = Array.from({ length: N * N }, () => []), bd = boxDims(N);
    for (let r = 0; r < N; r++) all.push({ type: 'row', cells: Array.from({ length: N }, (_, c) => r * N + c) });
    for (let c = 0; c < N; c++) all.push({ type: 'column', cells: Array.from({ length: N }, (_, r) => r * N + c) });
    if (bd) for (let br = 0; br < N; br += bd[0]) for (let bc = 0; bc < N; bc += bd[1]) { const cells = []; for (let r = 0; r < bd[0]; r++) for (let c = 0; c < bd[1]; c++) cells.push((br + r) * N + bc + c); all.push({ type: 'box', cells }); }
    for (const u of all) for (const i of u.cells) of[i].push(u);
    return (unitCache[N] = { all, of });
  }
  /** What could still go in space i. */
  function cand(g, U, N, i) {
    const used = []; for (const u of U.of[i]) for (const j of u.cells) if (g[j] >= 0) used[g[j]] = 1;
    const out = []; for (let v = 0; v < N; v++) if (!used[v]) out.push(v); return out;
  }
  function fill(g, U, N, i) {
    if (i === N * N) return true;
    for (const v of K.shuffle(cand(g, U, N, i))) { g[i] = v; if (fill(g, U, N, i + 1)) return true; }
    g[i] = -1; return false;
  }
  /** How many ways the tray can be finished (stops counting at limit). */
  function countSolutions(g, N, limit) {
    const U = units(N); g = g.slice(); let n = 0;
    (function go() {
      let best = -1, bc = null;
      for (let i = 0; i < g.length; i++) if (g[i] < 0) { const c = cand(g, U, N, i); if (!bc || c.length < bc.length) { best = i; bc = c; } }
      if (best < 0) { n++; return; }
      for (const v of bc) { g[best] = v; go(); if (n >= limit) break; }
      g[best] = -1;
    })();
    return n;
  }
  /** The next space that plain looking can settle: {cell, v, why: 'last' | 'only' | 'place', unit}. */
  function nextStep(g, N) {
    const U = units(N);
    for (const u of U.all) {   // a row, column or box with one space left
      const e = u.cells.filter((j) => g[j] < 0);
      if (e.length === 1) { const c = cand(g, U, N, e[0]); if (c.length === 1) return { cell: e[0], v: c[0], why: 'last', unit: u }; }
    }
    for (let i = 0; i < g.length; i++) if (g[i] < 0) { const c = cand(g, U, N, i); if (c.length === 1) return { cell: i, v: c[0], why: 'only' }; }
    for (const u of U.all) for (let v = 0; v < N; v++) {   // a picture with only one space left in its row, column or box
      if (u.cells.some((j) => g[j] === v)) continue;
      const spots = u.cells.filter((j) => g[j] < 0 && cand(g, U, N, j).includes(v));
      if (spots.length === 1) return { cell: spots[0], v, why: 'place', unit: u };
    }
    return null;
  }
  function logicSolvable(g, N) { g = g.slice(); for (;;) { const s = nextStep(g, N); if (!s) return g.every((v) => v >= 0); g[s.cell] = s.v; } }
  /** A solved tray with `empties` spaces taken out, still solvable step by step. */
  function makePuzzle(N, empties) {
    const U = units(N); let best = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      const sol = new Array(N * N).fill(-1); fill(sol, U, N, 0);
      const g = sol.slice(); let out = 0;
      for (const c of K.shuffle(sol.map((_, i) => i))) { if (out >= empties) break; const keep = g[c]; g[c] = -1; if (logicSolvable(g, N)) out++; else g[c] = keep; }
      if (!best || out > best.out) best = { sol, g, out };
      if (out >= empties) break;
    }
    if (countSolutions(best.g, N, 2) !== 1) return makePuzzle(N, Math.max(1, empties - 1));   // cannot happen with step-by-step puzzles; a safety net
    return { N, sol: best.sol, given: best.g.map((v) => v >= 0), cur: best.g.slice(), empties: best.out };
  }
  /** What to make at each level as the child gets better: [size, empty spaces, 'pic' | 'num']. */
  function plan(L, skill) {
    if (L === 1) return [3, skill < 1 ? 1 : 2, 'pic'];
    if (L === 2) return [4, 5 + Math.min(2, skill), 'pic'];
    const ladder = [[4, 8, 'pic'], [4, 9, 'pic'], [4, 10, 'pic'], [6, 12, 'pic'], [6, 14, 'num'], [6, 16, 'pic'], [6, 18, 'num'], [6, 19, 'pic'], [6, 20, 'num']];
    return ladder[Math.min(skill, ladder.length - 1)];
  }

  /* ---------------- paper pieces ---------------- */
  const put = (g, sp, k) => { k = k || 1; g.drawImage(sp.canvas, -sp.ox * k, -sp.oy * k, sp.w * k, sp.h * k); };
  function symSprite(s) {
    if (s.n) return A.sprite('gd-num' + s.n, [-62, -62, 124, 124], (g) => { g.font = `700 104px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(46,40,70,.16)'; g.fillText(String(s.n), 2, 9); g.fillStyle = s.col; g.fillText(String(s.n), 0, 5); });
    if (Kt && Kt.draw && Kt.draw[s.id]) return Kt.sprite(s.id);
    return A.sprite('gd-fr-' + s.id, [-62, -62, 124, 124], (g, r) => { g.beginPath(); A.blob(g, 0, 0, 46, 44, 0.04, 3, 12); A.paper(g, r, s.col, { box: { x: -46, y: -46, w: 92, h: 92 } }); });
  }
  const TILE = { g0: '#FBF0D8', g1: '#E7F0DA', p: '#FFFEF9' };
  const tileSprite = (kind, cs) => A.sprite('gd-tile' + kind + Math.round(cs), [-cs / 2, -cs / 2, cs, cs], (g, s) => {
    const m = Math.max(4, cs * 0.045), r = Math.min(22, cs * 0.17);
    g.beginPath(); A.rect(g, -cs / 2 + m, -cs / 2 + m, cs - m * 2, cs - m * 2, r, 3, 0.8); A.paper(g, s, TILE[kind], { box: { x: -cs / 2, y: -cs / 2, w: cs, h: cs }, light: 0.035, shadow: kind === 'p' ? 0.9 : 0.6 });
    if (kind === 'p') { g.beginPath(); A.rect(g, -cs / 2 + m + 4, -cs / 2 + m + 4, cs - m * 2 - 8, cs - m * 2 - 8, r - 3, 3, 0.5); g.strokeStyle = 'rgba(242,179,61,.5)'; g.lineWidth = 2.5; g.stroke(); }
  });
  const cardSprite = () => A.sprite('gd-card', [-75, -75, 150, 150], (g, s) => { g.beginPath(); A.rect(g, -72, -72, 144, 144, 30, 4, 1); A.paper(g, s, '#FFFBF2', { box: { x: -72, y: -72, w: 144, h: 144 }, light: 0.04, shadow: 0.9 }); });
  const lampSprite = () => A.sprite('gd-lamp', [-64, -64, 128, 128], (g, s) => {
    g.beginPath(); g.arc(0, 0, 56, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 1, light: 0.04, box: { x: -56, y: -56, w: 112, h: 112 } });
    g.beginPath(); A.rect(g, -11, 14, 22, 20, 5, 3, 0.4); A.paper(g, s, '#5A566B', { shadow: 0.3 });
    g.beginPath(); g.arc(0, -8, 25, 0, 7); A.paper(g, s, '#F2B33D', { shadow: 0.4, light: 0.12, box: { x: -25, y: -33, w: 50, h: 50 } });
    g.beginPath(); g.ellipse(-9, -16, 5, 9, 0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.45)'; g.fill();
    A.line(g, 'rgba(255,255,255,.35)', 2.5, (h) => { h.moveTo(-9, 21); h.lineTo(9, 21); h.moveTo(-9, 27); h.lineTo(9, 27); });
  });
  function paintBg(g, s, W, H) {
    g.beginPath(); g.rect(-20, -20, W + 40, H + 40); A.paper(g, s, '#CFE3D6', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.05, grain: 0.3 });
    const q = 112;   // a gingham cloth
    for (let x = -q / 2; x < W; x += q * 2) { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x, -20, q, H + 40); }
    for (let y = -q / 2; y < H; y += q * 2) { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-20, y, W + 40, q); }
    for (let x = -q / 2; x < W; x += q * 2) for (let y = -q / 2 + q; y < H; y += q * 2) { g.fillStyle = 'rgba(95,154,107,.07)'; g.fillRect(x + q, y, q, q); }
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(46,60,70,0)'); v.addColorStop(1, 'rgba(46,60,70,.16)'); g.fillStyle = v; g.fillRect(-20, -20, W + 40, H + 40);
  }

  /* ---------------- the thumbnail ---------------- */
  function icon(g, w) {
    const u = w / 300; g.save(); g.scale(u, u);
    g.fillStyle = '#CFE3D6'; g.fillRect(0, 0, 300, 300);
    g.fillStyle = 'rgba(255,255,255,.3)'; for (let x = 0; x < 300; x += 100) g.fillRect(x, 0, 50, 300); for (let y = 0; y < 300; y += 100) g.fillRect(0, y, 300, 50);
    const rr = (x, y, ww, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, ww, h, r); else g.rect(x, y, ww, h); };
    g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 14 * u; g.shadowOffsetY = 6 * u; g.fillStyle = '#C08A5A'; rr(30, 30, 240, 240, 26); g.fill(); g.restore();
    const cols = ['#D94B3F', '#F3CE4B', '#8FBF5A'], lay = [0, 1, 2, 1, 2, 0, 2, -1, 1];
    lay.forEach((v, i) => {
      const x = 46 + (i % 3) * 72, y = 46 + Math.floor(i / 3) * 72, cx = x + 32, cy = y + 32;
      g.fillStyle = v < 0 ? '#E3D0A8' : '#FBF0D8'; rr(x, y, 64, 64, 12); g.fill();
      if (v < 0) { g.strokeStyle = '#F2B33D'; g.lineWidth = 6; rr(x + 3, y + 3, 58, 58, 10); g.stroke(); return; }
      g.fillStyle = cols[v];
      if (v === 1) { g.beginPath(); g.moveTo(cx - 22, cy - 8); g.quadraticCurveTo(cx, cy + 22, cx + 22, cy - 14); g.quadraticCurveTo(cx + 4, cy + 36, cx - 24, cy - 2); g.closePath(); g.fill(); }
      else { g.beginPath(); if (v === 2) g.ellipse(cx, cy + 6, 17, 19, 0, 0, 7); else g.arc(cx, cy + 3, 21, 0, 7); g.fill(); if (v === 2) { g.beginPath(); g.arc(cx, cy - 10, 11, 0, 7); g.fill(); } g.strokeStyle = '#6B4430'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy - 18); g.lineTo(cx + 4, cy - 27); g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(cx - 9, cy - 2, 4, 7, 0.5, 0, 7); g.fill(); }
    });
    g.restore();
  }

  /* ---------------- the game ---------------- */
  let mem = { level: 0 };   // what carries on over a resize: how hard, the tray being worked on
  const WARM = '#F2B33D', SOFT = '#F08A5D';

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    if (mem.level !== L) mem = { level: L, skill: 0, placed: 0, puzzles: 0, puzzle: null, first: true, lastN: 0, lastKind: '' };
    let Z = null, U = null, N = 0, syms = [], geo = null, sel = -1, hover = -1, drag = null, hl = null, toks = [], nodes = [], over = false, busy = false;
    let hintCell = -1, lampPulse = 0, missRun = 0, lastAct = 0, leaveAt = 0;
    let pop = [], wob = [], hop = [], born = [], tilt = [];

    st.add({ z: 0, sprite: A.sprite('gd-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => paintBg(g, s, W, H)) });

    /* ---------- where everything goes ---------- */
    function layout(n) {
      const bd = boxDims(n), bgap = bd ? (land ? 12 : 6) : 0, nbc = bd ? n / bd[1] : 1, nbr = bd ? n / bd[0] : 1;
      const o = { bd, bgap };
      if (land) {
        o.G = Math.min(700, n * 190); o.cols = n === 3 ? 1 : 2; o.tk = 132; o.tg = 18;
      } else {
        o.cols = n === 4 ? 2 : 3; o.tk = 116; o.tg = 14;
        const th0 = Math.ceil(n / o.cols) * (o.tk + o.tg) - o.tg;
        o.G = Math.min(W - 24, n * 160, H - 158 - 70 - th0 - 40 - 44);   // a short, wide screen gets a smaller tray so the pictures still fit under it
      }
      o.cs = (o.G - bgap * (Math.max(nbc, nbr) - 1)) / n;
      o.bw = n * o.cs + bgap * (nbc - 1); o.bh = n * o.cs + bgap * (nbr - 1);
      o.rows = Math.ceil(n / o.cols);
      const tw = o.cols * o.tk + (o.cols - 1) * o.tg, th = o.rows * o.tk + (o.rows - 1) * o.tg;
      let tx, tyTop;
      if (land) {
        const total = o.bw + 100 + tw + 40;
        o.gx = (W - total) / 2; o.gy = 510 - o.bh / 2;
        tx = o.gx + o.bw + 100 + 20; tyTop = 510 - (th + 40 + 150) / 2 + 20;
        o.lamp = { x: tx + tw / 2, y: tyTop + th + 20 + 92 };
      } else {
        const content = o.bh + 70 + th + 40;
        o.gx = (W - o.bw) / 2; o.gy = 158 + Math.max(0, (H - 158 - content - 70) * 0.4);
        const block = tw + 40 + 22 + 112;
        tx = (W - block) / 2 + 20; tyTop = o.gy + o.bh + 70 + 20;
        o.lamp = { x: tx + tw + 20 + 22 + 56, y: tyTop + th / 2 };
      }
      o.panel = { x: tx - 20, y: tyTop - 20, w: tw + 40, h: th + 40 };
      o.tok = (i) => { const last = o.rows - 1, inLast = n - last * o.cols, r = Math.floor(i / o.cols), c = i % o.cols, shift = r === last ? (o.cols - inLast) * (o.tk + o.tg) / 2 : 0; return { x: tx + o.tk / 2 + c * (o.tk + o.tg) + shift, y: tyTop + o.tk / 2 + r * (o.tk + o.tg) }; };
      o.cell = (i) => { const r = Math.floor(i / n), c = i % n; return { x: o.gx + c * o.cs + (bd ? bgap * Math.floor(c / bd[1]) : 0) + o.cs / 2, y: o.gy + r * o.cs + (bd ? bgap * Math.floor(r / bd[0]) : 0) + o.cs / 2 }; };
      o.parity = (i) => (bd ? (Math.floor(Math.floor(i / n) / bd[0]) + Math.floor((i % n) / bd[1])) % 2 : 0);
      return o;
    }
    const band = (cells) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const i of cells) { const p = geo.cell(i); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); } const h = geo.cs / 2 - 1; return { x: x0 - h, y: y0 - h, w: x1 - x0 + h * 2, h: y1 - y0 + h * 2 }; };
    function cellAt(x, y) { for (let i = 0; i < N * N; i++) { const p = geo.cell(i); if (Math.abs(x - p.x) <= geo.cs / 2 + 3 && Math.abs(y - p.y) <= geo.cs / 2 + 3) return i; } return -1; }

    /* ---------- the wooden tray ---------- */
    st.add({ z: 2, draw(g) {
      if (!geo) return;
      const o = geo, fp = land ? 22 : 10;
      put(g, A.sprite('gd-board' + N + '_' + Math.round(o.cs) + '_' + Math.round(o.gx) + '_' + Math.round(o.gy), [o.gx - fp, o.gy - fp, o.bw + fp * 2, o.bh + fp * 2 + 8], (h, s) => {
        h.beginPath(); A.rect(h, o.gx - fp, o.gy - fp, o.bw + fp * 2, o.bh + fp * 2, land ? 34 : 22, 5, 1.2); A.paper(h, s, '#C08A5A', { depth: 1.3, box: { x: o.gx - fp, y: o.gy - fp, w: o.bw + fp * 2, h: o.bh + fp * 2 }, light: 0.08, grain: 0.34 });
        h.beginPath(); A.rect(h, o.gx - 5, o.gy - 5, o.bw + 10, o.bh + 10, 22, 6, 0.6); h.fillStyle = '#A9744A'; h.fill();
        for (let i = 0; i < N * N; i++) {
          const p = o.cell(i), m = Math.max(3, o.cs * 0.03), r = Math.min(20, o.cs * 0.16), x = p.x - o.cs / 2 + m, y = p.y - o.cs / 2 + m, w = o.cs - m * 2;
          h.beginPath(); A.rect(h, x, y, w, w, r, 2, 0); h.fillStyle = o.parity(i) ? '#D3DDBF' : '#E6D3AA'; h.fill();
          h.save(); h.clip(); h.strokeStyle = 'rgba(70,45,30,.22)'; h.lineWidth = 7; h.beginPath(); A.rect(h, x - 1, y - 1, w + 12, w + 12, r, 2, 0); h.stroke(); h.restore();
        }
      }));
    } });

    /* ---------- the pictures on the tray, and the lights ---------- */
    const symAt = (v) => syms[v];
    st.add({ z: 5,
      update(dt) { for (let i = 0; i < pop.length; i++) { pop[i] = Math.max(0, pop[i] - dt * 3); wob[i] = Math.max(0, wob[i] - dt * 1.6); hop[i] = Math.max(0, hop[i] - dt * 2.2); } lampPulse = Math.max(0, lampPulse - dt); },
      draw(g) {
        if (!Z) return;
        const cs = geo.cs, pk = (cs * 0.74) / 104;
        // the chosen space
        if (sel >= 0 && !over) {
          const p = geo.cell(sel), a = 0.75 + Math.sin(st.t * 6) * 0.25, h = cs / 2 - 2;
          g.save(); g.shadowColor = '#FFE08A'; g.shadowBlur = 22 * st.res; g.beginPath(); A.rect(g, p.x - h, p.y - h, h * 2, h * 2, Math.min(22, cs * 0.18), 2, 0); g.fillStyle = A.alpha('#FFE9A8', 0.55 + a * 0.3); g.fill(); g.restore();
        }
        if (hover >= 0 && hover !== sel && !Z.given[hover]) { const p = geo.cell(hover), h = cs / 2 - 3; g.beginPath(); A.rect(g, p.x - h, p.y - h, h * 2, h * 2, Math.min(22, cs * 0.18), 2, 0); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill(); }
        for (let i = 0; i < N * N; i++) {
          const v = Z.cur[i]; if (v < 0) continue;
          const p = geo.cell(i), giv = Z.given[i];
          let k = E.ease.back(K.clamp((st.t - born[i]) / 0.36, 0, 1)) * (1 + pop[i] * 0.22);
          if (leaveAt) k *= 1 - K.clamp((st.t - leaveAt - (i % N + Math.floor(i / N)) * 0.03) / 0.22, 0, 1);
          if (k <= 0.01) continue;
          g.save(); g.translate(p.x, p.y - Math.sin((1 - hop[i]) * Math.PI) * (hop[i] > 0 ? cs * 0.2 : 0)); g.rotate((giv ? 0 : tilt[i]) + (wob[i] > 0 ? Math.sin(st.t * 30) * 0.09 * wob[i] : 0)); g.scale(k, k);
          put(g, tileSprite(giv ? 'g' + geo.parity(i) : 'p', cs)); put(g, symSprite(symAt(v)), pk);
          g.restore();
        }
        if (sel >= 0 && !over) {
          const p = geo.cell(sel), h = cs / 2 - 2 + Math.sin(st.t * 6) * 1.5;
          g.beginPath(); A.rect(g, p.x - h, p.y - h, h * 2, h * 2, Math.min(22, cs * 0.18), 2, 0); g.strokeStyle = WARM; g.lineWidth = land ? 7 : 6; g.stroke();
        }
        if (hl && st.t < hl.until) {
          const left = hl.until - st.t, a = Math.min(1, left * 2, (st.t - hl.from) * 5) * (0.75 + Math.sin(st.t * 7) * 0.25);
          for (const b of hl.bands) {
            g.beginPath(); A.rect(g, b.x, b.y, b.w, b.h, Math.min(24, cs * 0.2), 2, 0); g.fillStyle = A.alpha(hl.col, 0.3 * a); g.fill();
            g.strokeStyle = A.alpha('#FFFFFF', 0.8 * a); g.lineWidth = land ? 11 : 9; g.stroke();
            g.strokeStyle = A.alpha(hl.col, a); g.lineWidth = land ? 6 : 5; g.stroke();
          }
        }
      } });
    const light = (bands, colr, secs) => { hl = { bands, col: colr, from: st.t, until: st.t + secs }; };

    /* ---------- the side tray and the lamp ---------- */
    st.add({ z: 20, draw(g, s) {
      if (!geo) return; const p = geo.panel;
      g.beginPath(); A.rect(g, p.x, p.y, p.w, p.h, 36, 6, 1.2); A.paper(g, s, '#E9D5AC', { shadow: 1, depth: 1.2, box: p, light: 0.06, grain: 0.3 });
      g.beginPath(); A.rect(g, p.x + 9, p.y + 9, p.w - 18, p.h - 18, 28, 7, 0.8); g.strokeStyle = 'rgba(138,90,60,.28)'; g.lineWidth = 3; g.setLineDash([3, 11]); g.lineCap = 'round'; g.stroke(); g.setLineDash([]);
    } });
    const lamp = st.add({ z: 21, x: -500, y: 0, hitR: 58, pad: 6, label: 'Hint' });
    lamp.draw = (g) => {
      const on = lampPulse > 0, k = on ? 1 + Math.sin(st.t * 8) * 0.07 : 1;
      g.save(); g.scale(k, k);
      if (on) { g.save(); g.shadowColor = '#FFD95E'; g.shadowBlur = 30 * st.res; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fillStyle = '#F7C233'; g.fill(); g.restore(); }
      put(g, lampSprite());
      A.line(g, A.alpha('#F2B33D', on ? 0.95 : 0.55), 4.5, (h) => { for (let i = 0; i < 5; i++) { const a = -Math.PI * (0.08 + i * 0.21), r0 = 32, r1 = 39 + (on ? Math.sin(st.t * 8 + i) * 3 : 0); h.moveTo(Math.cos(a) * r0, -8 + Math.sin(a) * r0); h.lineTo(Math.cos(a) * r1, -8 + Math.sin(a) * r1); } });
      g.restore();
    };
    lamp.onTap = () => hint();

    const empties = () => Z.cur.reduce((a, v, i) => (v < 0 ? a.concat(i) : a), []);
    const say = (t) => ctx.say(t);
    function select(i, quiet) {
      if (!Z || over || i < 0) return;
      lastAct = st.t;
      if (Z.given[i]) { wob[i] = 0.7; K.sfx.tap(); return; }
      sel = i; pop[i] = 0.5; if (!quiet) K.sfx.tone(660, 0.07, { type: 'triangle', vol: 0.14 });
    }
    function build() {
      for (const n of nodes) n.remove(); nodes = []; toks = [];
      for (let i = 0; i < N * N; i++) {
        const p = geo.cell(i), h = geo.cs / 2;
        const n = st.add({ z: 8, x: p.x, y: p.y, hit: { x: -h, y: -h, w: h * 2, h: h * 2 }, pad: 0, pressable: false, label: `row ${Math.floor(i / N) + 1} column ${(i % N) + 1}` });
        n.onDown = () => select(i); n.onTap = (pt) => { if (!pt) select(i); };
        nodes.push(n);
      }
      const q = geo.tk / 150;
      syms.forEach((s, v) => {
        const p = geo.tok(v);
        const node = st.add({ z: 22, x: p.x, y: p.y, hit: { x: -geo.tk / 2, y: -geo.tk / 2, w: geo.tk, h: geo.tk }, pad: 5, pressable: false, label: s.label, sx: 0, sy: 0, _bsx: 1, _bsy: 1 });
        const t = { v, node, glow: false, hop: 0, out: false, q };
        node.update = (dt) => { t.hop = Math.max(0, t.hop - dt * 2.4); };
        node.draw = (g) => {
          const pul = t.glow ? 1.03 + Math.sin(st.t * 7) * 0.07 : 1;
          g.save(); g.translate(0, -Math.sin((1 - t.hop) * Math.PI) * (t.hop > 0 ? 22 : 0)); g.scale(q * pul, q * pul);
          if (t.glow) { const gw = 10 + Math.sin(st.t * 7) * 4; g.save(); g.shadowColor = '#FFD95E'; g.shadowBlur = 34 * st.res * q; g.beginPath(); A.rect(g, -72 - gw, -72 - gw, 144 + gw * 2, 144 + gw * 2, 30 + gw, 2, 0); g.fillStyle = '#F7C233'; g.fill(); g.fill(); g.restore(); }
          put(g, cardSprite());
          if (t.out) g.globalAlpha *= 0.3;
          put(g, symSprite(s), 1.02);
          g.restore();
        };
        node.onDown = (pt) => grab(t, pt);
        node.onMove = (pt) => { if (!drag || drag.t !== t) return; drag.ghost.x = pt.x + drag.ox; drag.ghost.y = pt.y + drag.oy - Math.min(36, Math.hypot(pt.x - drag.sx, pt.y - drag.sy) * 0.5); hover = cellAt(drag.ghost.x, drag.ghost.y); };
        node.onUp = (pt, e, s2) => {
          if (!drag || drag.t !== t) return;
          const d = drag; drag = null; hover = -1;
          if (s2.moved < 24) return picked(d);
          const ci = cellAt(d.ghost.x, d.ghost.y);
          if (ci >= 0 && !Z.given[ci] && !over) { sel = ci; deliver(d, ci, 0.12, 0); } else { if (ci >= 0 && Z.given[ci]) { wob[ci] = 0.7; } flyBack(d); }
        };
        node.onTap = (pt) => { if (!pt && grab(t, { x: node.x, y: node.y })) { const d = drag; drag = null; picked(d); } };   // keyboard / screen reader
        node.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back', delay: 0.35 + v * 0.07 });
        nodes.push(node); toks.push(t);
      });
      lamp.x = geo.lamp.x; lamp.y = geo.lamp.y;
    }
    function grab(t, p) {
      if (!Z || over || busy || drag || t.out) return false;
      lastAct = st.t; K.sfx.tap(); t.out = true; t.hop = 0;
      const ghost = st.add({ z: 40, x: t.node.x, y: t.node.y, sx: t.q * 1.14, sy: t.q * 1.14 });
      ghost.draw = (g) => put(g, symSprite(symAt(t.v)));
      drag = { t, ghost, ox: t.node.x - p.x, oy: t.node.y - p.y, sx: p.x, sy: p.y };
      return true;
    }
    function fly(ghost, target, s1, dur, lift) {
      const x0 = ghost.x, y0 = ghost.y, s0 = ghost.sx; ghost.t = 0;
      ghost.update = () => { const e = ghost.t; ghost.x = x0 + (target.x - x0) * e; ghost.y = y0 + (target.y - y0) * e - Math.sin(e * Math.PI) * lift; ghost.sx = ghost.sy = s0 + (s1 - s0) * e; ghost.rot = Math.sin(e * Math.PI) * 0.16; };
      return ghost.to({ t: 1 }, { dur, ease: 'inOut' });
    }
    function flyBack(d) { const t = d.t; fly(d.ghost, t.node, t.q, 0.3, 40).then(() => { d.ghost.remove(); t.out = false; }); }
    /** A picture was tapped: it goes to the chosen space. */
    function picked(d) {
      const e = empties();
      if ((sel < 0 || Z.given[sel]) && e.length === 1) sel = e[0];
      if (sel < 0 || Z.given[sel]) {
        flyBack(d); K.sfx.tap(); e.forEach((i, n) => ctx.after(n * 50, () => { pop[i] = 1; })); light(e.map((i) => band([i])), WARM, 1.8); say(T.firstTap); return;
      }
      K.sfx.whoosh(); deliver(d, sel, 0.38, 90);
    }
    function deliver(d, ci, dur, lift) { busy = true; fly(d.ghost, geo.cell(ci), (geo.cs * 0.74) / 104, dur, lift).then(() => place(d, ci)); }
    function clashOf(ci, v) { for (const u of U.of[ci]) for (const j of u.cells) if (j !== ci && Z.cur[j] === v) return { unit: u, cell: j }; return null; }
    function place(d, ci) {
      const v = d.t.v; busy = false; lastAct = st.t;
      if (over) { flyBack(d); return; }
      const c = clashOf(ci, v);
      if (c) {   // not wrong, just taken: show where, say why, and the picture hops home
        flyBack(d); K.sfx.whoops(); wob[c.cell] = 1; pop[c.cell] = 0.6; light([band(c.unit.cells)], SOFT, 2.6);
        Z.miss[ci] = (Z.miss[ci] || 0) + 1; Z.misses++; missRun++;
        say(T.clash(symAt(v), c.unit.type));
        if (Z.miss[ci] >= 2) { sel = ci; for (const t of toks) t.glow = t.v === Z.sol[ci]; }
        if (missRun >= 3) lampPulse = 8;
        return;
      }
      d.ghost.remove(); d.t.out = false;
      Z.cur[ci] = v; born[ci] = st.t - 1; pop[ci] = 1; tilt[ci] = (Math.random() - 0.5) * 0.09;
      for (const t of toks) t.glow = false;
      if (v === Z.sol[ci]) missRun = 0;
      hintCell = -1; hl = null;
      const p = geo.cell(ci); ctx.fx.burst(p.x, p.y, { n: 9, color: symAt(v).col }); K.sfx.pop(); K.sfx.step(v + 2);
      const e = empties();
      sel = e.length && (L === 1 || e.length === 1) ? e[0] : -1;
      if (!e.length) finish();
    }

    /* ---------- the lamp: what can be worked out next, and why ---------- */
    function hint() {
      if (!Z || over || busy) return;
      lastAct = st.t; lampPulse = 0; missRun = 0; Z.hints++; K.sfx.tap();
      const bad = Z.cur.findIndex((v, i) => v >= 0 && !Z.given[i] && v !== Z.sol[i]);
      if (bad >= 0) {   // something the child placed is in the way: lift it out
        const v = Z.cur[bad], t = toks[v], p = geo.cell(bad);
        light([band([bad])], SOFT, 2.2); say(T.another); K.sfx.whoops();
        Z.cur[bad] = -1; sel = bad; hintCell = -1;
        const ghost = st.add({ z: 40, x: p.x, y: p.y, sx: (geo.cs * 0.74) / 104, sy: (geo.cs * 0.74) / 104 }); ghost.draw = (g) => put(g, symSprite(symAt(v)));
        fly(ghost, t.node, t.q, 0.5, 70).then(() => ghost.remove());
        return;
      }
      const s = nextStep(Z.cur, N); if (!s) return;
      const tok = toks[s.v];
      if (hintCell === s.cell) {   // asked twice about the same space: show which picture
        sel = s.cell; for (const t of toks) t.glow = t === tok; tok.hop = 1; say(T.glow); return;
      }
      hintCell = s.cell; sel = s.cell; pop[s.cell] = 1; K.sfx.sparkle(); for (const t of toks) t.glow = false;
      if (s.why === 'last') { light([band(s.unit.cells)], WARM, 4.5); say(T.look[s.unit.type] + ' ' + T.oneEmpty); }
      else if (s.why === 'only') { light(U.of[s.cell].map((u) => band(u.cells)), WARM, 5); say(T.onlyOne + ' ' + T.rowCol + (geo.bd ? ' ' + T.boxToo : '')); }
      else { light([band(s.unit.cells)], WARM, 5); tok.hop = 1; ctx.after(500, () => { tok.hop = 1; }); say(T.look[s.unit.type] + ' ' + (Z.kind === 'num' ? T.onePlaceNum : T.onePlacePic)); }
    }

    /* ---------- rounds ---------- */
    async function finish() {
      const z = Z; over = true; sel = -1; hl = null;
      for (let i = 0; i < N * N; i++) ctx.after((i % N + Math.floor(i / N)) * 70, () => { hop[i] = 1; });
      K.sfx.ding(); ctx.after(300, () => K.sfx.sparkle());
      for (let i = 0; i < N * N; i += N + 1) { const p = geo.cell(i); ctx.after(i * 20, () => ctx.fx.burst(p.x, p.y, { n: 8 })); }
      await Promise.all([say(T.done), ctx.wait(1900)]);
      const clean = z.misses <= (N > 4 ? 2 : N > 3 ? 1 : 0) && z.hints <= (N > 4 ? 2 : 0);
      if (clean) mem.skill = Math.min(9, mem.skill + 1); else if (z.misses >= 4 || z.hints >= 3) mem.skill = Math.max(0, mem.skill - 1);
      mem.placed += z.empties; mem.puzzles++; mem.puzzle = null;
      if (mem.placed >= 8 || mem.puzzles >= 4) { mem.placed = 0; mem.puzzles = 0; await ctx.celebrate(); }
      leaveAt = st.t; K.sfx.whoosh();
      for (const t of toks) t.node.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' });
      await ctx.wait(650);
      if (Z === z) newPuzzle();
    }
    function enter(z, fresh) {
      Z = z; N = z.N; U = units(N); syms = z.syms.map((id) => SYM[id]); geo = layout(N);
      over = false; busy = false; sel = -1; hover = -1; hl = null; hintCell = -1; missRun = 0; lampPulse = 0; leaveAt = 0; lastAct = st.t + 3;
      if (drag) { drag.ghost.remove(); drag = null; }
      pop = new Array(N * N).fill(0); wob = pop.slice(); hop = pop.slice(); tilt = pop.map(() => (Math.random() - 0.5) * 0.09);
      born = pop.map((_, i) => (fresh ? st.t + 0.1 + (i % N + Math.floor(i / N)) * 0.045 : st.t - 1));
      build();
      if (fresh) K.sfx.whoosh();
      const how = T.tap + ' ' + (z.kind === 'num' ? T.pickNum : T.pickPic), changed = N !== mem.lastN || z.kind !== mem.lastKind;
      const rules = (z.kind === 'num' ? T.rowsNum : T.rowsPic) + ' ' + T.cols + (geo.bd ? ' ' + T.boxes : '');
      const text = !fresh ? how : mem.first ? rules + ' ' + how : changed ? (N > mem.lastN ? T.bigger + ' ' : T.newP + ' ') + rules : T.newP + ' ' + how;
      ctx.prompt(text, { show: land ? how : z.kind === 'num' ? 'Fill in the numbers.' : 'Fill in the pictures.', silent: !fresh && !mem.first });
      mem.first = false; mem.lastN = N; mem.lastKind = z.kind;
      if (L === 1) ctx.after(fresh ? 900 : 100, () => { if (Z === z && sel < 0 && !over) { const e = empties(); if (e.length) select(e[0], true); } });
    }
    function newPuzzle() {
      const [n, e, kind] = plan(L, mem.skill);
      const z = makePuzzle(n, e);
      z.kind = kind; z.syms = kind === 'num' ? NUMS.slice(0, n).map((s) => s.id) : K.sample(FRUITS, n).map((s) => s.id);
      z.miss = {}; z.misses = 0; z.hints = 0; mem.puzzle = z;
      enter(z, true);
    }
    // a quiet spell: the lamp offers itself
    ctx.every(1000, () => { if (Z && !over && !drag && st.t - lastAct > 22) { lastAct = st.t; lampPulse = 4; } });

    K._grid = {   // for browser tests
      get Z() { return Z; }, get sel() { return sel; }, get over() { return over; }, get skill() { return mem.skill; }, get geo() { return geo; }, get hl() { return hl && st.t < hl.until ? hl : null; },
      get toks() { return toks; }, lamp, select, hint, makePuzzle, countSolutions, nextStep, logicSolvable, lines, plan,
      jump(skill) { mem.skill = skill; newPuzzle(); },
    };
    ctx.onExit(() => { K._grid = null; });
    ctx.after(300, () => { if (mem.puzzle && mem.puzzle.cur.some((v) => v < 0)) enter(mem.puzzle, false); else newPuzzle(); });
  }

  K.game({ id: 'grid', title: 'Picture Sudoku', voice: 'grid', group: 'arcade', age: 7, order: 30, icon, start, lines, resize: () => K.go('grid') });
})();
