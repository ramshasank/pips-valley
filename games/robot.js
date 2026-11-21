/* Robot Path — a first coding game. Toot stands on a board of paper tiles and wants to reach the apple,
   the cake or the shed. The child lays arrow blocks in a row (a program), presses Go, and watches Toot
   follow it one block at a time with the running block lit up.
   Nothing can be lost: if Toot bumps into something or stops short, Toot says "oh", rolls back to the
   start and the program stays, ready to be changed (tap a block to take it out, or the brush to clear).
   After two muddles the way is shown as dots on the tiles and the next block to add pulses.

   Level 1: a 3x3 or 4x3 board, up / down / left / right, 2-4 steps, and each tap moves Toot at once.
   Level 2: a 5x4 board with puddles and bushes, programs of 4-8 blocks run with Go, and an apple to
            pick up on the way.
   Level 3: a 6x5 (later 7x5) board, forward / turn left / turn right, a loop block that repeats the
            block after it 2, 3 or 4 times (tap it to change the count), and golden spaces in the
            program row: fit the program into them to win a gold star. Using more is never wrong.
   Every puzzle is made at random and solved in code before it is shown (see makePuzzle / solve). */
(function () {
  'use strict';
  const A = K.art;
  const SAY = {
    apple: 'Help Toot get to the apple!', cake: 'Help Toot get to the cake!', shed: 'Help Toot get home to the shed!',
    how1: 'Tap the arrows.', how2: 'Add blocks, then press Go.', pick: 'Pick up the apple on the way.',
    few: 'Fill only the golden spaces to win a gold star.', loopHow: 'The loop repeats the next block.',
    puddle: 'Oh! A puddle is in the way.', bush: 'Oh! A bush is in the way.', edge: 'Oh! That is the edge.',
    short: 'Not there yet.', more: 'Add more blocks.', first: 'Get the apple first.', dots: 'Follow the dots.',
    fix: 'Change the blocks and try again.', loop: 'Put a block after the loop.', full: 'The row is full. Press Go!',
    again: "Let's start again.", win: 'Toot made it!', gold: 'A gold star!', tryLoop: 'Try the loop block next time.',
    rep: { 2: 'Two times.', 3: 'Three times.', 4: 'Four times.' },
  };
  function lines() { const out = []; for (const k in SAY) { if (typeof SAY[k] === 'string') out.push(SAY[k]); else for (const j in SAY[k]) out.push(SAY[k][j]); } return out; }

  /* ---------- pictures ---------- */
  const PIC = {}, SRC = { toot: 'toot/toot', happy: 'toot/toot-happy', oh: 'toot/toot-oh', apple: 'toot/apples', cake: 'toot/cakes', shed: 'toot/shed', puddle: 'bobo/puddle', bush: 'tales/bush' };
  for (const nm in SRC) { const im = new Image(); im.onload = () => { PIC[nm] = im; }; im.src = 'img/' + SRC[nm] + '.webp'; }
  const disc = (g, x, y, rx, ry, col) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fillStyle = col; g.fill(); };
  /** Toot, w wide, centred, facing right. */
  function drawToot(g, w, face) {
    const im = PIC[face] || PIC.toot;
    if (im) { const h = w * im.height / im.width; g.drawImage(im, -w / 2, -h / 2, w, h); return; }
    const u = w / 100; g.save(); g.scale(u, u);
    g.fillStyle = '#4A3A56'; g.fillRect(-48, 24, 92, 8); g.fillRect(14, -30, 16, 22);
    g.fillStyle = '#E0483A'; g.beginPath(); g.roundRect(-46, -26, 40, 52, 6); g.fill(); g.beginPath(); g.roundRect(-10, -8, 54, 34, 14); g.fill();
    g.fillStyle = '#6E4E7E'; g.fillRect(-50, -32, 48, 9); g.fillRect(10, -34, 24, 8);
    g.fillStyle = '#CFE6E8'; g.beginPath(); g.roundRect(-38, -16, 22, 18, 4); g.fill();
    g.fillStyle = '#F2B33D'; g.fillRect(2, -8, 5, 34);
    g.fillStyle = '#2E2A3B'; disc(g, 20, 6, 3.5, 4.5, '#2E2A3B'); disc(g, 34, 6, 3.5, 4.5, '#2E2A3B');
    if (face === 'oh') disc(g, 27, 16, 3, 3.5, '#2E2A3B');
    else { g.beginPath(); g.arc(27, 12, 6, 0.2, Math.PI - 0.2); g.strokeStyle = '#2E2A3B'; g.lineWidth = 2.5; g.lineCap = 'round'; g.stroke(); }
    g.restore();
  }
  /** A thing on a tile: apple, cake, shed, puddle or bush. c is the tile size. */
  function drawItem(g, kind, c) {
    const im = PIC[kind];
    if (im) {
      let w, h;
      if (kind === 'puddle') { w = c * 0.92; h = c * 0.46; } else if (kind === 'bush') { w = c * 0.9; h = w * im.height / im.width; } else if (kind === 'shed') { w = c * 0.94; h = w * im.height / im.width; } else { h = c * (kind === 'cake' ? 0.82 : 0.68); w = h * im.width / im.height; }
      g.drawImage(im, -w / 2, -h / 2 + (kind === 'puddle' ? c * 0.06 : 0), w, h); return;
    }
    if (kind === 'puddle') { disc(g, 0, c * 0.06, c * 0.44, c * 0.22, '#A9764A'); disc(g, 0, c * 0.06, c * 0.38, c * 0.17, '#9CCBE0'); disc(g, -c * 0.12, c * 0.01, c * 0.12, c * 0.035, 'rgba(255,255,255,.6)'); }
    else if (kind === 'bush') { for (const [x, y, r] of [[-0.2, 0.08, 0.2], [0.2, 0.08, 0.2], [0, -0.1, 0.24], [0, 0.14, 0.2]]) disc(g, x * c, y * c, r * c, r * c * 0.92, r > 0.21 ? '#2F7A64' : '#3E8A62'); }
    else if (kind === 'apple') { disc(g, -c * 0.07, 0.03 * c, c * 0.2, c * 0.24, '#D94B3F'); disc(g, c * 0.07, 0.03 * c, c * 0.2, c * 0.24, '#D94B3F'); g.fillStyle = '#6B4430'; g.fillRect(-c * 0.02, -c * 0.3, c * 0.04, c * 0.14); g.save(); g.translate(c * 0.1, -c * 0.24); g.rotate(-0.5); disc(g, 0, 0, c * 0.1, c * 0.05, '#6FA65F'); g.restore(); }
    else if (kind === 'cake') { g.fillStyle = '#8CC4DE'; g.beginPath(); g.moveTo(-c * 0.2, 0); g.lineTo(c * 0.2, 0); g.lineTo(c * 0.15, c * 0.3); g.lineTo(-c * 0.15, c * 0.3); g.closePath(); g.fill(); disc(g, 0, -c * 0.02, c * 0.24, c * 0.12, '#F08DAA'); disc(g, 0, -c * 0.14, c * 0.17, c * 0.1, '#F5A5BC'); disc(g, 0, -c * 0.26, c * 0.07, c * 0.07, '#D94B3F'); }
    else { g.fillStyle = '#4E9E90'; g.fillRect(-c * 0.4, -c * 0.12, c * 0.8, c * 0.5); g.fillStyle = '#3A3446'; g.beginPath(); g.roundRect(-c * 0.22, 0, c * 0.44, c * 0.38, [c * 0.14, c * 0.14, 0, 0]); g.fill(); g.fillStyle = '#E0564A'; g.beginPath(); g.moveTo(-c * 0.46, -c * 0.1); g.lineTo(0, -c * 0.4); g.lineTo(c * 0.46, -c * 0.1); g.closePath(); g.fill(); }
  }

  /* ---------- blocks ---------- */
  const BLOCK = {
    U: { c: '#5B8FC7', name: 'up', rot: 0 }, R: { c: '#5B8FC7', name: 'right', rot: Math.PI / 2 }, D: { c: '#5B8FC7', name: 'down', rot: Math.PI }, L: { c: '#5B8FC7', name: 'left', rot: -Math.PI / 2 },
    F: { c: '#2F8F8A', name: 'forward' }, TL: { c: '#E9A52F', name: 'turn left' }, TR: { c: '#8A62A0', name: 'turn right' }, REP: { c: '#D9728C', name: 'repeat' },
  };
  function glyph(g, t, u, n) {
    g.save(); g.fillStyle = '#FFFBF0'; g.strokeStyle = '#FFFBF0'; g.lineJoin = 'round'; g.lineCap = 'round';
    if (t === 'TL' || t === 'TR') {
      if (t === 'TR') g.scale(-1, 1);
      g.lineWidth = u * 0.15; g.beginPath(); g.moveTo(u * 0.2, u * 0.32); g.lineTo(u * 0.2, u * 0.02); g.quadraticCurveTo(u * 0.2, -u * 0.16, 0, -u * 0.16); g.lineTo(-u * 0.08, -u * 0.16); g.stroke();
      g.lineWidth = u * 0.05; g.beginPath(); g.moveTo(-u * 0.34, -u * 0.16); g.lineTo(-u * 0.08, -u * 0.37); g.lineTo(-u * 0.08, u * 0.05); g.closePath(); g.fill(); g.stroke();
    } else if (t === 'REP') {
      g.lineWidth = u * 0.085; g.beginPath(); g.arc(0, 0, u * 0.3, -0.9, 4.2); g.stroke();
      const a = -0.9, x = Math.cos(a) * u * 0.3, y = Math.sin(a) * u * 0.3;
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2 + Math.PI); g.lineWidth = u * 0.04; g.beginPath(); g.moveTo(-u * 0.15, 0); g.lineTo(u * 0.02, -u * 0.13); g.lineTo(u * 0.02, u * 0.13); g.closePath(); g.fill(); g.stroke(); g.restore();
      g.font = `700 ${u * 0.36}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n || 2), 0, u * 0.03);
    } else {
      g.rotate(BLOCK[t].rot || 0); g.lineWidth = u * 0.06;
      g.beginPath(); g.moveTo(0, -u * 0.33); g.lineTo(u * 0.25, -u * 0.04); g.lineTo(u * 0.09, -u * 0.04); g.lineTo(u * 0.09, u * 0.31); g.lineTo(-u * 0.09, u * 0.31); g.lineTo(-u * 0.09, -u * 0.04); g.lineTo(-u * 0.25, -u * 0.04); g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }
  function paintBlock(g, s, t, n, S) {
    const c = BLOCK[t].c, h = S / 2;
    g.beginPath(); A.rect(g, -h, -h, S, S, S * 0.22, t.length + (n || 0), 1); A.paper(g, s, c, { shadow: 0.85, light: 0.09, box: { x: -h, y: -h, w: S, h: S } });
    g.beginPath(); A.rect(g, -h + S * 0.07, -h + S * 0.07, S * 0.86, S * 0.86, S * 0.17, 3, 0.5); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2.5; g.stroke();
    g.save(); g.translate(1.5, 3); g.globalAlpha = 0.22; g.globalCompositeOperation = 'multiply'; glyph(g, t, S, n); g.restore();
    glyph(g, t, S, n);
  }
  const blockSprite = (t, n, S) => A.sprite('rb-blk-' + t + (n || '') + '-' + Math.round(S), [-S / 2 - 2, -S / 2 - 2, S + 4, S + 4], (g, s) => paintBlock(g, s, t, n, S));

  /* ---------- the puzzle rules (pure, so they can be checked without the screen) ---------- */
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]], ABS = { R: 0, D: 1, L: 2, U: 3 };
  function cellAt(P, x, y) { if (x < 0 || y < 0 || x >= P.cols || y >= P.rows) return 'edge'; const b = P.blocks.find((o) => o.x === x && o.y === y); return b ? b.kind : null; }
  const startState = (P) => ({ x: P.start.x, y: P.start.y, d: P.start.d, got: !P.apple });
  /** One move. Returns the new state, with bump (what was hit), apple (picked up now), goal, or early (at the goal without the apple). */
  function stepState(P, s, op) {
    if (op === 'TL' || op === 'TR') return { x: s.x, y: s.y, d: (s.d + (op === 'TL' ? 3 : 1)) % 4, got: s.got, turn: true };
    const d = op === 'F' ? s.d : ABS[op], nx = s.x + DIRS[d][0], ny = s.y + DIRS[d][1], hit = cellAt(P, nx, ny);
    if (hit) return { x: s.x, y: s.y, d: s.d, got: s.got, bump: hit, dir: d };
    const apple = !!P.apple && !s.got && P.apple.x === nx && P.apple.y === ny, atGoal = nx === P.goal.x && ny === P.goal.y, got = s.got || apple;
    return { x: nx, y: ny, d: s.d, got, apple, dir: d, goal: atGoal && got, early: atGoal && !got };
  }
  /** Blocks -> the single moves they stand for. i is the block doing the move, ri the loop block around it (or -1). */
  function expand(prog) {
    const out = [];
    for (let i = 0; i < prog.length; i++) {
      const b = prog[i];
      if (b.t !== 'REP') { out.push({ op: b.t, i, ri: -1, k: 0 }); continue; }
      const nx = prog[i + 1];
      if (nx && nx.t !== 'REP') { for (let k = 0; k < b.n; k++) out.push({ op: nx.t, i: i + 1, ri: i, k }); i++; } else out.push({ op: null, i, ri: i, k: 0 });
    }
    return out;
  }
  /** Run a program with no pictures. -> {ok, reason, at (the failing step), state} */
  function simulate(P, prog) {
    let s = startState(P); const steps = expand(prog);
    for (let j = 0; j < steps.length; j++) {
      if (!steps[j].op) return { ok: false, reason: 'loop', at: j, state: s };
      const n = stepState(P, s, steps[j].op);
      if (n.bump) return { ok: false, reason: n.bump, at: j, state: s };
      s = { x: n.x, y: n.y, d: n.d, got: n.got };
      if (n.early) return { ok: false, reason: 'first', at: j, state: s };
      if (n.goal) return { ok: true, used: j + 1, state: s };
    }
    return { ok: false, reason: 'short', at: steps.length, state: s };
  }
  const keyOf = (P, s) => s.x + ',' + s.y + ',' + (P.rel ? s.d : 0) + ',' + (s.got ? 1 : 0);
  /** The shortest list of single moves from a state to the goal (breadth-first), or null. */
  function solve(P, from) {
    const ops = P.rel ? ['F', 'TL', 'TR'] : ['R', 'D', 'L', 'U'], s0 = from || startState(P);
    const seen = new Set([keyOf(P, s0)]), queue = [{ s: s0, path: [] }];
    while (queue.length) {
      const { s, path } = queue.shift();
      for (const op of ops) {
        const n = stepState(P, s, op); if (n.bump || n.early) continue;
        if (n.goal) return path.concat(op);
        const k = keyOf(P, n); if (seen.has(k)) continue; seen.add(k); queue.push({ s: n, path: path.concat(op) });
      }
    }
    return null;
  }
  /** The program with the fewest blocks (a loop block and the block inside it count as two). */
  function fewest(P) {
    const open = [{ s: startState(P), c: 0, prog: [] }], done = new Set();
    while (open.length) {
      open.sort((a, b) => a.c - b.c); const cur = open.shift();
      if (cur.end) return cur.prog;
      const k = keyOf(P, cur.s); if (done.has(k)) continue; done.add(k);
      for (const t of ['TL', 'TR']) { const n = stepState(P, cur.s, t); open.push({ s: n, c: cur.c + 1, prog: cur.prog.concat({ t }) }); }
      let s = cur.s;
      for (let j = 1; j <= 4; j++) {
        const n = stepState(P, s, 'F'); if (n.bump || n.early) break;
        const prog = cur.prog.concat(j === 1 ? [{ t: 'F' }] : [{ t: 'REP', n: j }, { t: 'F' }]);
        open.push({ s: n, c: cur.c + (j === 1 ? 1 : 2), prog, end: n.goal }); if (n.goal) break;
        s = n;
      }
    }
    return null;
  }
  let pid = 0;
  /** A fresh puzzle for this level and skill, always solvable (solved here, then run through simulate to be sure). */
  function makePuzzle(L, skill, wide) {
    const h = skill >> 1;
    const cfg = L === 1 ? { cols: skill < 2 ? 3 : 4, rows: 3, obs: skill < 2 ? 0 : skill < 4 ? 1 : 2, lo: 2, hi: skill < 1 ? 2 : skill < 3 ? 3 : 4, goals: ['apple', 'cake'] }
      : L === 2 ? { cols: 5, rows: 4, obs: 3 + Math.min(2, h), lo: 4 + Math.min(2, h), hi: Math.min(8, 6 + h), apple: true, goals: ['shed', 'cake'] }
        : { cols: skill < 4 || !wide ? 6 : 7, rows: 5, obs: 5 + Math.min(4, h), lo: 5 + Math.min(4, skill), hi: 10 + Math.min(5, skill), rel: true, goals: ['apple', 'cake', 'shed'] };
    const cells = []; for (let y = 0; y < cfg.rows; y++) for (let x = 0; x < cfg.cols; x++) cells.push({ x, y });
    for (let t = 0; t < 600; t++) {
      const c = K.shuffle(cells); let i = 0;
      const P = { id: ++pid, cols: cfg.cols, rows: cfg.rows, rel: !!cfg.rel, start: Object.assign({ d: cfg.rel && skill >= 3 ? K.randInt(0, 3) : 0 }, c[i++]), goal: Object.assign({ kind: K.pick(cfg.goals) }, c[i++]), apple: cfg.apple ? c[i++] : null, blocks: [] };
      for (let k = 0; k < cfg.obs; k++) P.blocks.push(Object.assign({ kind: Math.random() < 0.5 ? 'puddle' : 'bush' }, c[i++]));
      const sol = solve(P); if (!sol || sol.length < cfg.lo || sol.length > cfg.hi) continue;
      P.sol = sol;
      if (P.rel) {
        P.best = fewest(P); if (!P.best || P.best.length > 9) continue;
        if (sol.filter((o) => o !== 'F').length < (skill >= 1 ? 1 : 0)) continue;
        P.par = P.best.length;
      } else P.best = sol.map((o) => ({ t: o }));
      if (!simulate(P, P.best).ok || !simulate(P, sol.map((o) => ({ t: o }))).ok) continue;
      return P;
    }
    // (never reached in practice) an open board with the goal two steps away
    const P = { id: ++pid, cols: cfg.cols, rows: cfg.rows, rel: !!cfg.rel, start: { x: 0, y: cfg.rows - 1, d: 0 }, goal: { x: 2, y: cfg.rows - 1, kind: cfg.goals[0] }, apple: cfg.apple ? { x: 1, y: cfg.rows - 1 } : null, blocks: [] };
    P.sol = solve(P); P.best = P.rel ? fewest(P) : P.sol.map((o) => ({ t: o })); P.par = P.best.length; return P;
  }

  /* ---------- the game ---------- */
  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, IMM = L === 1;
    const store = (K.s.done.robot = K.s.done.robot || {}); store.skill = store.skill || {};
    let skill = Math.max(0, (store.skill[L] || 0) - 1);
    const INK = A.C.ink, CREAM = '#FBF6EC';
    let P = null, T = null, prog = [], running = false, busy = true, won = false, fails = 0, cur = -1, curRep = -1, curK = 0, errIdx = -1;
    let hintOp = null, pathCells = null, played = 0, toldLoop = false, toldFull = false, shake = 0;
    const wins = [];

    /* ---- layout ---- */
    const S = land ? 112 : 104, TB = land ? 122 : 118, COLS = land ? 4 : 5, CAP = IMM ? 8 : land ? 12 : 10;
    const px = land ? Math.round(W * 0.585) : 6, py = land ? 140 : 616, pw = land ? W - px - 28 : W - 12;
    const rowsN = Math.ceil(CAP / COLS), pitch = S + 6;
    const stripH = rowsN * pitch + 18, trayY = py + 12 + stripH + (land ? 40 : 22) + TB / 2, ctrlY = trayY + TB / 2 + (land ? 46 : 26) + (land ? 58 : 52);
    const ph = ctrlY + (land ? 58 : 52) + (land ? 40 : 30) - py;
    const slotPos = (i) => ({ x: px + pw / 2 + ((i % COLS) - (COLS - 1) / 2) * pitch, y: py + 21 + S / 2 + Math.floor(i / COLS) * pitch });
    const area = land ? { x: 30, y: 142, w: px - 54, h: H - 142 - 56 } : { x: 14, y: 150, w: W - 28, h: 452 };
    let cell = 100, bx = 0, by = 0;
    const cx = (x) => bx + (x + 0.5) * cell, cy = (y) => by + (y + 0.5) * cell;

    /* ---- meadow and work table ---- */
    st.add({ z: 0, sprite: A.sprite('rb-bg-' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9CCB8B'); gr.addColorStop(1, '#7DB57A'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const r = A.rng(31);
      for (let i = 0; i < 16; i++) { g.beginPath(); A.blob(g, r() * W, r() * H, 90 + r() * 150, 50 + r() * 70, 0.18, i + 3, 10); g.fillStyle = i % 2 ? 'rgba(255,255,220,.1)' : 'rgba(60,120,80,.1)'; g.fill(); }
      for (let i = 0; i < 46; i++) {
        const x = r() * W, y = r() * H;
        if (i % 3 === 0) { const col = ['#FBF6EC', '#F2B33D', '#F4B49A'][i % 9 / 3 | 0]; for (let k = 0; k < 5; k++) disc(g, x + Math.cos(k * 1.257) * 7, y + Math.sin(k * 1.257) * 7, 5, 5, col); disc(g, x, y, 4, 4, '#E8664A'); }
        else A.line(g, 'rgba(70,130,80,.5)', 3, (h) => { for (const d of [-7, 0, 7]) { h.moveTo(x + d, y + 8); h.quadraticCurveTo(x + d * 1.4, y - 2, x + d * 1.9, y - 9); } });
      }
      g.beginPath(); A.rect(g, px, py, pw, ph, 34, 6, 1.5); A.paper(g, s, CREAM, { shadow: 1, depth: 1.3, light: 0.03, box: { x: px, y: py, w: pw, h: ph } });
      const sw = Math.min(COLS * pitch + 18, pw - 10);
      g.beginPath(); A.rect(g, px + pw / 2 - sw / 2, py + 12, sw, stripH, 26, 4, 0.8); g.fillStyle = '#EFE3CB'; g.fill();
    }) });

    /* ---- the board ---- */
    const tileSp = (tone, c) => A.sprite('rb-tile-' + tone + '-' + Math.round(c), [-c / 2, -c / 2, c, c], (g, s) => { const q = c - 8; g.beginPath(); A.rect(g, -q / 2, -q / 2, q, q, c * 0.14, tone + 2, 1.2); A.paper(g, s, tone ? '#F6E7C6' : '#EFDCB4', { shadow: 0.7, light: 0.05, box: { x: -q / 2, y: -q / 2, w: q, h: q } }); });
    const frameSp = (P2, c) => A.sprite('rb-frame-' + P2.cols + 'x' + P2.rows + '-' + Math.round(c), [-16, -16, P2.cols * c + 32, P2.rows * c + 32], (g, s) => { g.beginPath(); A.rect(g, -14, -14, P2.cols * c + 28, P2.rows * c + 28, 30, 4, 1.5); A.paper(g, s, '#4F8752', { shadow: 1, depth: 1.4, light: 0.05, box: { x: 0, y: 0, w: P2.cols * c, h: P2.rows * c } }); g.beginPath(); A.rect(g, -5, -5, P2.cols * c + 10, P2.rows * c + 10, 22, 5, 0.8); g.fillStyle = '#3F7446'; g.fill(); });
    const board = st.add({ z: 5, pop: 0 });
    board.draw = (g) => {
      if (!P) return;
      g.save(); g.translate(bx, by);
      const fs = frameSp(P, cell); g.drawImage(fs.canvas, -fs.ox, -fs.oy, fs.w, fs.h);
      for (let y = 0; y < P.rows; y++) for (let x = 0; x < P.cols; x++) { const sp = tileSp((x + y) % 2, cell); g.drawImage(sp.canvas, (x + 0.5) * cell - sp.ox, (y + 0.5) * cell - sp.oy, sp.w, sp.h); }
      const ring = (x, y, col, k) => { g.save(); g.translate((x + 0.5) * cell, (y + 0.5) * cell); g.setLineDash([cell * 0.09, cell * 0.08]); g.lineWidth = cell * 0.045; g.lineCap = 'round'; g.strokeStyle = col; g.beginPath(); g.arc(0, 0, cell * 0.36 * k, 0, 7); g.stroke(); g.restore(); };
      ring(P.start.x, P.start.y, 'rgba(47,143,138,.5)', 1);
      disc(g, (P.goal.x + 0.5) * cell, (P.goal.y + 0.5) * cell, cell * 0.4, cell * 0.4, 'rgba(242,179,61,.3)');
      ring(P.goal.x, P.goal.y, '#E9A52F', 1 + Math.sin(st.t * 3) * 0.05);
      if (pathCells) pathCells.forEach((c, i) => { const k = 0.5 + 0.5 * Math.sin(st.t * 5 - i * 0.9); disc(g, (c.x + 0.5) * cell, (c.y + 0.5) * cell, cell * (0.09 + k * 0.035), cell * (0.09 + k * 0.035), A.alpha('#E8664A', 0.45 + k * 0.4)); });
      for (const b of P.blocks) { g.save(); g.translate((b.x + 0.5) * cell, (b.y + 0.5) * cell); if (b.kind === 'bush') g.rotate(Math.sin(st.t * 1.3 + b.x) * 0.025); drawItem(g, b.kind, cell); g.restore(); }
      if (P.apple && !(T && T.got)) { g.save(); g.translate((P.apple.x + 0.5) * cell, (P.apple.y + 0.5) * cell + Math.sin(st.t * 3) * cell * 0.03); g.scale(0.78, 0.78); drawItem(g, 'apple', cell); g.restore(); }
      g.save(); g.translate((P.goal.x + 0.5) * cell, (P.goal.y + 0.5) * cell + Math.sin(st.t * 2.4) * cell * 0.025); const q = 1 + board.pop * 0.25; g.scale(q, 2 - q); if (!won || P.goal.kind === 'shed') drawItem(g, P.goal.kind, cell); g.restore();   // (Toot gobbles the apple or the cake)
     
      g.restore();
    };
    board.update = (dt) => { board.pop = Math.max(0, board.pop - dt * 2); shake = Math.max(0, shake - dt * 2.5); };

    /* ---- Toot ---- */
    const toot = st.add({ z: 8, face: 'toot', rot2: 0, fx: 1, fy: 1, hop: 0, sx: 0, sy: 0, label: 'Toot', pressable: false });
    toot.draw = (g) => {
      if (!P) return;
      disc(g, 0, cell * 0.3, cell * 0.36, cell * 0.09, 'rgba(46,40,70,.18)');
      const hp = Math.abs(Math.sin(toot.hop * Math.PI * 2)) * (toot.hop > 0 ? 1 : 0);
      g.save(); g.translate(0, -cell * 0.03 - hp * cell * 0.16 + Math.sin(st.t * 9) * (running ? 1.5 : 0)); g.rotate(toot.rot2 + (toot.face === 'oh' ? Math.sin(st.t * 30) * 0.05 : 0)); g.scale(toot.fx * (1 + hp * 0.05), toot.fy * (1 - hp * 0.05));
      drawToot(g, cell * 0.9, toot.face); g.restore();
      if (P.apple && T.got) { g.save(); g.translate(-toot.fx * cell * 0.2, -cell * 0.42 - hp * cell * 0.16); g.scale(0.42, 0.42); drawItem(g, 'apple', cell); g.restore(); }
    };
    toot.update = (dt) => { toot.hop = Math.max(0, toot.hop - dt * 1.6); };
    toot.onTap = () => { if (running || busy) return; toot.hop = 0.5; K.sfx.note(660, 0.2); K.sfx.note(880, 0.25); };
    function faceDir(d, quick) {
      if (!P.rel) { if (d === 0) toot.fx = 1; if (d === 2) toot.fx = -1; return; }
      // turn the short way, then keep the picture the right way up when facing left
      let target = d * Math.PI / 2; while (target - toot.rot2 > Math.PI) target -= Math.PI * 2; while (target - toot.rot2 < -Math.PI) target += Math.PI * 2;
      const fy = d === 2 ? -1 : d === 0 ? 1 : toot.fy;
      if (quick) { toot.rot2 = target; toot.fy = fy; return; }
      toot.to({ rot2: target }, { dur: 0.3, ease: 'inOut' }).then(() => { if (fy !== toot.fy) toot.to({ fy }, { dur: 0.2, ease: 'inOut' }); });
    }
    function placeToot(quick) {
      T = startState(P); toot.face = 'toot';
      const x = cx(T.x), y = cy(T.y);
      if (quick) { toot.x = x; toot.y = y; toot.fx = 1; faceDir(T.d, true); }
      else { toot.to({ x, y }, { dur: 0.5, ease: 'inOut' }); if (P.rel) faceDir(T.d); else toot.fx = 1; }
    }
    async function doStep(op) {
      const n = stepState(P, T, op);
      if (n.turn) { T.d = n.d; K.sfx.tone(op === 'TL' ? 440 : 520, 0.12, { to: op === 'TL' ? 560 : 400, type: 'triangle', vol: 0.16 }); faceDir(T.d); await ctx.wait(430); return n; }
      if (!P.rel) faceDir(n.dir);
      if (n.bump) {
        const dx = DIRS[n.dir][0] * cell * 0.26, dy = DIRS[n.dir][1] * cell * 0.26, x0 = toot.x, y0 = toot.y;
        toot.to({ x: x0 + dx, y: y0 + dy }, { dur: 0.13, ease: 'out' }).then(() => { toot.face = 'oh'; K.sfx.whoops(); K.sfx.drum('tom'); return toot.to({ x: x0, y: y0 }, { dur: 0.45, ease: 'elastic' }); });
        await ctx.wait(620); return n;
      }
      T.x = n.x; T.y = n.y; toot.hop = 0.5;
      K.sfx.noise(0.09, { freq: 520, vol: 0.14 }); K.sfx.tone(196, 0.1, { type: 'square', vol: 0.05 }); K.sfx.noise(0.07, { freq: 700, vol: 0.1, delay: 0.16 });
      toot.to({ x: cx(n.x), y: cy(n.y) }, { dur: 0.36, ease: 'inOut' });
      await ctx.wait(400);
      if (n.apple) { T.got = true; K.sfx.sparkle(); K.sfx.pop(); ctx.fx.burst(toot.x, toot.y - cell * 0.2, { n: 10, colors: ['#E8664A', '#F2B33D', '#FBF6EC'] }); await ctx.wait(220); }
      return n;
    }

    /* ---- the program row ---- */
    const slots = [];
    for (let i = 0; i < CAP; i++) {
      const p = slotPos(i);
      const n = st.add({ z: 12, x: p.x, y: p.y, i, hit: { x: -S / 2, y: -S / 2, w: S, h: S }, pad: 2, label: 'step ' + (i + 1), k: 1 });
      n.draw = (g) => {
        const b = prog[i], gold = P && P.rel && i < P.par;
        if (!b) {
          const next = i === prog.length && !running && !won, a = next ? 0.5 + 0.3 * Math.sin(st.t * 4) : 0.22;
          g.beginPath(); A.rect(g, -S / 2 + 7, -S / 2 + 7, S - 14, S - 14, S * 0.2, 3, 0);
          if (gold) { g.fillStyle = 'rgba(242,179,61,.26)'; g.fill(); }
          g.save(); g.setLineDash([9, 8]); g.lineWidth = 3; g.strokeStyle = gold ? A.alpha('#D08A12', a + 0.25) : A.alpha(INK, a); g.stroke(); g.restore();
          return;
        }
        const on = running && (i === cur || i === curRep), err = i === errIdx && !running;
        const pop = Math.min(1, (st.t - b.born) / 0.25), e = K.engine.ease.back(pop);
        g.save(); g.rotate(err ? Math.sin(st.t * 9) * 0.07 : 0); const k = e * (on ? 1.12 : 1) * (running && !on ? 0.94 : 1); g.scale(k, k);
        if (on) { g.beginPath(); A.rect(g, -S / 2 - 6, -S / 2 - 6, S + 12, S + 12, S * 0.26, 2, 0); g.fillStyle = '#F7D27A'; g.fill(); }
        if (running && !on) g.globalAlpha *= 0.6;
        const sp = blockSprite(b.t, b.n, S - 10); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
        if (b.t === 'REP' && running && i === curRep) for (let j = 0; j < b.n; j++) disc(g, (j - (b.n - 1) / 2) * 15, S * 0.37, 5, 5, j <= curK ? '#FFFBF0' : 'rgba(255,255,255,.4)');
        g.restore();
      };
      n.update = () => { n.onTap = prog[i] && !running && !won ? () => tapSlot(i) : null; };
      slots.push(n);
    }
    // a soft band ties a loop block to the block it repeats; the star marks the end of the golden spaces
    st.add({ z: 11, draw(g) {
      prog.forEach((b, i) => { if (b.t !== 'REP' || !prog[i + 1] || prog[i + 1].t === 'REP' || (i + 1) % COLS === 0) return; const p = slotPos(i); g.beginPath(); A.rect(g, p.x - S * 0.3, p.y - S / 2 + 1, pitch + S * 0.6, S - 2, S * 0.26, 2, 0); g.fillStyle = 'rgba(217,114,140,.42)'; g.fill(); });
    } });
    st.add({ z: 13, draw(g) {
      if (!P || !P.rel) return;
      const p = slotPos(P.par - 1), ok = prog.length <= P.par;
      g.save(); g.translate(p.x + S / 2 - 12, p.y - S / 2 + 12); g.rotate(Math.sin(st.t * 2) * 0.12); const k = 1 + (ok ? Math.sin(st.t * 4) * 0.06 : 0); g.scale(k, k); g.globalAlpha = ok ? 1 : 0.45; starShape(g, 19, '#F2B33D'); g.restore();
    } });
    function starShape(g, r, col) { g.save(); g.lineJoin = 'round'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.5 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 5 * st.res; g.shadowOffsetY = 2 * st.res; g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * 0.3; g.stroke(); g.shadowColor = 'transparent'; g.fill(); disc(g, -r * 0.25, -r * 0.2, r * 0.16, r * 0.1, 'rgba(255,255,255,.5)'); g.restore(); }

    /* ---- the tray of blocks ---- */
    const kinds = L === 3 ? ['TL', 'F', 'TR', 'REP'] : ['L', 'U', 'D', 'R'];
    kinds.forEach((t, i) => {
      const n = st.add({ z: 14, x: px + pw / 2 + (i - 1.5) * (TB + (land ? 8 : 10)), y: trayY, hit: { x: -TB / 2, y: -TB / 2, w: TB, h: TB }, pad: 3, label: 'block ' + BLOCK[t].name });
      n.draw = (g) => {
        const hint = hintOp === t && !running && !busy, k = hint ? 1.06 + Math.sin(st.t * 6) * 0.06 : 1;
        g.save(); g.translate(shake > 0 ? Math.sin(st.t * 50) * shake * 5 : 0, 0); g.scale(k, k);
        if (hint) { g.beginPath(); A.rect(g, -TB / 2 - 8, -TB / 2 - 8, TB + 16, TB + 16, TB * 0.27, 2, 0); g.fillStyle = A.alpha('#F7D27A', 0.65 + 0.35 * Math.sin(st.t * 6)); g.fill(); }
        if (running) g.globalAlpha *= 0.55;
        const sp = blockSprite(t, t === 'REP' ? 2 : 0, TB); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore();
      };
      n.onTap = () => addBlock(t, i);
    });

    /* ---- Go, clear, and the stars won ---- */
    const GW = land ? 250 : 220, GH = land ? 116 : 104;
    const goSp = A.sprite('rb-go-' + GW, [-GW / 2, -GH / 2, GW, GH], (g, s) => {
      g.beginPath(); A.rect(g, -GW / 2, -GH / 2, GW, GH, GH / 2, 4, 1); A.paper(g, s, '#58A85C', { shadow: 0.9, light: 0.1, box: { x: -GW / 2, y: -GH / 2, w: GW, h: GH } });
      g.beginPath(); A.rect(g, -GW / 2 + 8, -GH / 2 + 8, GW - 16, GH - 16, GH / 2 - 8, 4, 0.5); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; g.stroke();
      g.beginPath(); A.cut(g, [[-GH * 0.2, -GH * 0.27], [GH * 0.3, 0], [-GH * 0.2, GH * 0.27]], 7, 0, 3); g.fillStyle = '#FFFBF0'; g.fill();
    });
    if (!IMM) {
      const go = st.add({ z: 14, x: px + pw / 2, y: ctrlY, hit: { x: -GW / 2, y: -GH / 2, w: GW, h: GH }, pad: 4, label: 'Go' });
      go.draw = (g) => { const ready = prog.length && !running && !won, k = ready ? 1 + Math.sin(st.t * 5) * 0.035 : 1; g.save(); g.scale(k, k); if (!ready) g.globalAlpha *= 0.55; g.drawImage(goSp.canvas, -goSp.ox, -goSp.oy, goSp.w, goSp.h); g.restore(); };
      go.onTap = () => run();
    }
    const CR = land ? 52 : 54;
    const clear = st.add({ z: 14, x: px + (land ? 76 : 66), y: ctrlY, hitR: CR, pad: 4, label: 'Clear', sprite: A.sprite('rb-clear-' + CR, [-CR, -CR, CR * 2, CR * 2], (g, s) => {
      g.beginPath(); g.arc(0, 0, CR - 2, 0, 7); A.paper(g, s, '#F3DDB8', { shadow: 0.9, light: 0.06, box: { x: -CR, y: -CR, w: CR * 2, h: CR * 2 } });
      // a little brush that sweeps the row clean
      g.save(); g.rotate(-0.6); g.fillStyle = '#8A5A3C'; g.beginPath(); g.roundRect(-5, -34, 10, 36, 4); g.fill(); g.fillStyle = '#E8664A'; g.beginPath(); g.roundRect(-17, 0, 34, 12, 4); g.fill();
      g.fillStyle = '#F2B33D'; g.beginPath(); g.moveTo(-17, 11); g.lineTo(17, 11); g.lineTo(22, 34); g.lineTo(-22, 34); g.closePath(); g.fill();
      A.line(g, 'rgba(138,90,60,.6)', 2, (h) => { for (const x of [-10, 0, 10]) { h.moveTo(x, 15); h.lineTo(x * 1.25, 32); } }); g.restore();
    }) });
    clear.onTap = () => { if (running || won || busy) return; if (!prog.length) { K.sfx.tap(); return; } K.sfx.whoosh(); prog = []; errIdx = -1; if (IMM) placeToot(false); updateHint(); };
    st.add({ z: 14, x: px + pw - (land ? 80 : 68), y: ctrlY, draw(g) {
      for (let i = 0; i < 4; i++) {
        const x = (i % 2 ? 1 : -1) * 25, y = (i < 2 ? -1 : 1) * 25, w = wins[i];
        if (!w) { disc(g, x, y, 15, 15, 'rgba(46,42,59,.1)'); continue; }
        const k = K.engine.ease.back(Math.min(1, (st.t - w.t) / 0.4)); g.save(); g.translate(x, y); g.scale(k, k); g.rotate(Math.sin(st.t * 2 + i) * 0.1); starShape(g, 21, w.gold ? '#F2B33D' : '#F4B49A'); g.restore();
      }
    } });

    /* ---- building the program ---- */
    function updateHint() {
      hintOp = null; pathCells = null;
      if (fails < 2 || won || !P) return;
      const from = IMM ? { x: T.x, y: T.y, d: T.d, got: T.got } : startState(P), sol = IMM ? solve(P, from) : P.sol;
      if (!sol) return;
      if (IMM) hintOp = sol[0];
      else { const done = expand(prog).map((s) => s.op); if (done.every((op, i) => op === sol[i])) hintOp = sol[done.length] || null; }
      pathCells = []; let s = from; for (const op of sol) { const n = stepState(P, s, op); if (!n.turn) pathCells.push({ x: n.x, y: n.y }); s = n; }
      pathCells.pop();
    }
    function addBlock(t, i) {
      if (running || won || busy) return;
      K.sfx.tone(392 + i * 66, 0.1, { type: 'triangle', vol: 0.2 }); K.sfx.pop();
      if (IMM) { stepNow(t); return; }
      if (prog.length >= CAP) { shake = 1; if (!toldFull) { toldFull = true; ctx.say(SAY.full); } return; }
      prog.push(t === 'REP' ? { t, n: 2, born: st.t } : { t, born: st.t }); errIdx = -1;
      if (t === 'REP') { if (!toldLoop) { toldLoop = true; ctx.say(SAY.loopHow); } else ctx.say(SAY.rep[2]); }
      updateHint();
    }
    function tapSlot(i) {
      const b = prog[i]; if (!b || running || won || busy) return;
      errIdx = -1;
      if (IMM) { K.sfx.whoosh(); prog = []; placeToot(false); updateHint(); return; }
      if (b.t === 'REP' && b.n < 4) { b.n++; b.born = st.t - 0.12; K.sfx.step(b.n); ctx.say(SAY.rep[b.n]); }
      else { prog.splice(i, 1); K.sfx.tone(520, 0.12, { to: 300, type: 'triangle', vol: 0.16 }); }
      updateHint();
    }
    const WHY = { puddle: SAY.puddle, bush: SAY.bush, edge: SAY.edge, first: SAY.first, loop: SAY.loop, short: SAY.short + ' ' + SAY.more };
    async function stepNow(t) {                                  // level 1: every arrow moves Toot straight away
      busy = true;
      const n = await doStep(t);
      if (n.bump) {
        fails++; ctx.say(WHY[n.bump]); await ctx.wait(700); toot.face = 'toot';
        updateHint(); if (fails === 2) ctx.after(900, () => { if (!won) ctx.say(SAY.dots); });
        busy = false; return;
      }
      prog.push({ t, born: st.t });
      if (n.goal) return win();
      if (prog.length >= CAP) { fails++; toot.face = 'oh'; K.sfx.whoops(); ctx.say(SAY.short + ' ' + SAY.again); await ctx.wait(1500); prog = []; placeToot(false); await ctx.wait(550); }
      updateHint(); busy = false;
    }
    async function run() {
      if (running || won || busy) return;
      if (!prog.length) { shake = 1; K.sfx.tap(); ctx.say(SAY.how2); return; }
      running = true; errIdx = -1; hintOp = null; K.sfx.ding();
      const steps = expand(prog); let why = 'short', at = prog.length - 1;
      await ctx.wait(350);
      for (const s of steps) {
        cur = s.i; curRep = s.ri; curK = s.k;
        if (!s.op) { why = 'loop'; at = s.i; K.sfx.whoops(); toot.face = 'oh'; break; }
        const n = await doStep(s.op);
        if (n.bump) { why = n.bump; at = s.i; break; }
        if (n.early) { why = 'first'; at = s.i; toot.face = 'oh'; K.sfx.whoops(); break; }
        if (n.goal) { why = null; break; }
        await ctx.wait(90);
      }
      if (!why) return win();
      if (why === 'short') { toot.face = 'oh'; K.sfx.whoops(); }
      // nothing is lost: Toot rolls back and the blocks stay
      fails++; errIdx = why === 'short' ? -1 : at;
      ctx.say(WHY[why]);
      await ctx.wait(1500);
      placeToot(false); cur = curRep = -1; running = false; busy = true;
      await ctx.wait(600);
      busy = false; updateHint();
      if (fails === 2) ctx.say(SAY.dots); else if (fails > 2 && fails % 2 === 1) ctx.say(SAY.fix);
    }
    async function win() {
      won = true; busy = true; const gold = P.rel && prog.length <= P.par, usedLoop = prog.some((b) => b.t === 'REP');
      toot.face = 'happy'; toot.hop = 1.5; board.pop = 1; pathCells = null; hintOp = null;
      if (P.rel) { toot.fy = 1; toot.to({ rot2: Math.round(toot.rot2 / (Math.PI * 2)) * Math.PI * 2 }, { dur: 0.3, ease: 'back' }); }
      K.sfx.ding(); ctx.after(220, () => K.sfx.sparkle()); ctx.fx.burst(toot.x, toot.y - cell * 0.2, { n: 20 });
      await ctx.wait(500);
      wins.push({ gold: gold || !P.rel, t: st.t }); K.sfx.step(wins.length + 3);
      ctx.say(SAY.win + (gold ? ' ' + SAY.gold : P.rel && !usedLoop && played % 2 === 0 ? ' ' + SAY.tryLoop : ''));
      if (gold) ctx.fx.burst(px + pw - 70, ctrlY, { n: 14, color: '#F2B33D' });
      if (fails === 0) skill = Math.min(12, skill + 0.5); else if (fails >= 3) skill = Math.max(0, skill - 1);
      store.skill[L] = skill; K.save();
      await ctx.wait(gold ? 2500 : 2000);
      cur = curRep = -1; running = false;
      if (wins.length >= 4) { await ctx.celebrate({ ms: 3400 }); wins.length = 0; }
      await toot.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' });
      newPuzzle();
    }
    function newPuzzle(given) {
      const before = P ? P.sol.join('') : '';
      for (let i = 0; i < 8; i++) { P = given || makePuzzle(L, skill, land); if (P.sol.join('') !== before) break; }   // never the same walk twice running
      cell = Math.min(area.w / P.cols, area.h / P.rows, land ? 190 : 150);
      bx = area.x + (area.w - P.cols * cell) / 2; by = area.y + (area.h - P.rows * cell) / 2;
      prog = []; fails = 0; won = false; running = false; cur = curRep = errIdx = -1; hintOp = null; pathCells = null;
      placeToot(true);
      toot.hit = { x: -cell * 0.45, y: -cell * 0.4, w: cell * 0.9, h: cell * 0.8 };
      toot.sx = toot.sy = 0; toot.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: 0.15 });
      board.pop = 0.6; K.sfx.pop();
      const goal = SAY[P.goal.kind];
      let extra = P.apple ? ' ' + SAY.pick : '';
      if (played === 0) extra += ' ' + (IMM ? SAY.how1 : SAY.how2); else if (played === 1 && P.rel) extra += ' ' + SAY.few;
      played++;
      ctx.prompt(goal + extra, { show: goal });
      ctx.after(500, () => { busy = false; });
      busy = true;
    }

    K._robot = {                                           // for browser tests
      get P() { return P; }, get T() { return T; }, get prog() { return prog; }, get running() { return running; }, get busy() { return busy; }, get won() { return won; },
      get fails() { return fails; }, get wins() { return wins; }, get skill() { return skill; }, set skill(v) { skill = v; }, get hintOp() { return hintOp; }, get cell() { return cell; },
      makePuzzle, solve, fewest, simulate, expand, lines, newPuzzle,
      /** Make n puzzles for a level and check every one is solvable by running its own answer. */
      pool(level, n, sk) { const out = []; for (let i = 0; i < n; i++) { const p = makePuzzle(level, sk == null ? i % 8 : sk, true); out.push({ p, ok: simulate(p, p.best).ok, steps: p.sol.length, par: p.best.length }); } return out; },
    };
    ctx.onExit(() => { K._robot = null; });
    ctx.after(400, () => newPuzzle());
  }

  function icon(g, w) {
    const gr = g.createLinearGradient(0, 0, 0, w); gr.addColorStop(0, '#9CCB8B'); gr.addColorStop(1, '#78B076'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    const c = w * 0.29, x0 = w * 0.065, y0 = w * 0.065;
    g.fillStyle = '#3F7446'; g.beginPath(); g.roundRect(x0 - w * 0.02, y0 - w * 0.02, c * 3 + w * 0.04, c * 3 + w * 0.04, w * 0.05); g.fill();
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { g.fillStyle = (x + y) % 2 ? '#F6E7C6' : '#EFDCB4'; g.beginPath(); g.roundRect(x0 + x * c + w * 0.012, y0 + y * c + w * 0.012, c - w * 0.024, c - w * 0.024, w * 0.035); g.fill(); }
    const at = (x, y) => [x0 + (x + 0.5) * c, y0 + (y + 0.5) * c];
    g.fillStyle = '#E8664A'; for (const [x, y] of [[1, 2], [2, 2], [2, 1]]) { const p = at(x, y); g.beginPath(); g.arc(p[0], p[1], w * 0.028, 0, 7); g.fill(); }
    let p = at(2, 0); g.save(); g.translate(p[0], p[1]); drawItem(g, 'apple', c); g.restore();
    p = at(1, 0); g.save(); g.translate(p[0], p[1]); drawItem(g, 'bush', c); g.restore();
    p = at(0, 2); g.save(); g.translate(p[0] + w * 0.02, p[1] - w * 0.01); drawToot(g, c * 1.25, 'toot'); g.restore();
    // an arrow block, like the ones in the tray
    g.save(); g.translate(w * 0.2, w * 0.3); g.rotate(-0.12); const S = w * 0.27;
    g.fillStyle = 'rgba(46,40,70,.2)'; g.beginPath(); g.roundRect(-S / 2 + 3, -S / 2 + 6, S, S, S * 0.22); g.fill();
    g.fillStyle = '#5B8FC7'; g.beginPath(); g.roundRect(-S / 2, -S / 2, S, S, S * 0.22); g.fill(); glyph(g, 'R', S); g.restore();
  }

  K.game({ id: 'robot', title: 'Robot Path', voice: 'robot', group: 'arcade', age: 7, order: 33, icon, start, lines, resize: () => K.go('robot') });
})();
