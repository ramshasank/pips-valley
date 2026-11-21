/* Number Blocks — place value with paper base-ten blocks.
   Single cubes, rods of ten and flats of a hundred live on a mat with a column (or, on a phone
   with three places, a row) for each place. Blocks are dragged or tapped out of the tray onto the
   mat; each place counts its own blocks and the card shows the total. Ten loose cubes snap
   together into a rod (and ten rods into a flat); tap a rod or a flat to break it apart again.
   Drag a block off the mat to take it away.

   Level 1: build 11-20 as one ten and some ones (later: read the blocks).
   Level 2: two-digit numbers: build, read a block picture with the number dials, ten more / ten less.
   Level 3: three-digit numbers: build, add two numbers by tipping the second pile in (cubes carry
            into rods as they join), subtract by taking blocks away (break a rod to borrow), and
            choose the bigger / smaller of two block pictures. */
(function () {
  'use strict';
  const A = K.art;
  const num = (n) => K.numWord(n), cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const COL = ['#F2B33D', '#3FA39B', '#E8664A'], NAMES = ['ones', 'tens', 'hundreds'], VAL = [1, 10, 100];
  const MINUS = '−';
  const T = {
    n: (n) => cap(num(n)) + '!',
    build: 'Build this number.', drag: 'Drag the blocks onto the mat.',
    snapRod: 'Ten cubes make a rod!', snapFlat: 'Ten rods make a flat!', rodIs: 'A rod is ten.', flatIs: 'A flat is one hundred.',
    oneTen: 'One ten and some ones.',
    tooMany: 'Too many!', takeSome: 'Take some away.', dragOff: 'Drag a block off the mat.', tooFew: 'Too few!', putBack: 'Put some back.',
    read: 'What number is this?', tapNum: 'Tap the numbers.',
    countP: ['Count the cubes.', 'Count the rods.', 'Count the flats.'],
    more: 'Make ten more.', less: 'Make ten less.',
    add: 'Add them together.', tapPile: 'Tap the new blocks.', how: 'How many now?',
    sub: 'Take the blocks away.', breakRod: 'Tap a rod to break it.', breakFlat: 'Tap a flat to break it.', notThat: 'That is too many.',
    bigger: 'Which number is bigger?', smaller: 'Which number is smaller?',
    look: ['Look at the ones.', 'Look at the tens.', 'Look at the hundreds.'],
  };
  function lines() {
    const out = [];
    for (let n = 11; n <= 20; n++) out.push(T.n(n));
    for (const k in T) { if (typeof T[k] === 'string') out.push(T[k]); else if (Array.isArray(T[k])) out.push(...T[k]); }
    return out;
  }
  const digits = (n) => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)];

  /* ---------------- drawing ---------------- */
  const SIZE = (p, u) => [p === 2 ? u * 10 : u, p >= 1 ? u * 10 : u];
  /** A block of place p (0 cube, 1 rod, 2 flat) with cubes u across, centred on (0,0). s = 0 draws it flat. */
  function paintBlock(g, s, p, u, col) {
    const [w, h] = SIZE(p, u), rad = Math.max(2, u * 0.2);
    g.beginPath(); A.rect(g, -w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, rad, 3, 0.3);
    if (s) A.paper(g, s, col, { shadow: 0.75, light: 0.08, box: { x: -w / 2, y: -h / 2, w, h } }); else { g.fillStyle = col; g.fill(); }
    const lite = A.shade(col, 0.09), dark = A.shade(col, -0.13), inset = Math.max(1.2, u * 0.13), nx = p === 2 ? 10 : 1, ny = p >= 1 ? 10 : 1;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = -w / 2 + i * u + inset, y = -h / 2 + j * u + inset, c = u - inset * 2;
      g.beginPath(); A.rect(g, x, y, c, c, Math.max(1, u * 0.14), 2, 0); g.fillStyle = lite; g.fill();
      g.fillStyle = dark; g.fillRect(x + c * 0.14, y + c - Math.max(1, c * 0.1), c * 0.72, Math.max(1, c * 0.1));
      g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x + c * 0.16, y + c * 0.14, c * 0.34, Math.max(1, c * 0.11));
    }
    g.beginPath(); A.rect(g, -w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, rad, 3, 0.3); g.strokeStyle = A.shade(col, -0.2); g.lineWidth = Math.max(1, u * 0.07); g.stroke();
  }
  const spr = (p, u, c) => { const [w, h] = SIZE(p, u); return A.sprite('pl' + p + 'u' + u + 'c' + c, [-w / 2, -h / 2, w, h], (g, s) => paintBlock(g, s, p, u, COL[c])); };
  function stamp(g, p, u, x, y, k, rot, c) { const sp = spr(p, u, c == null ? p : c); g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (k !== 1) g.scale(k, k); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore(); }
  function starPath(g, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * 0.6283, q = i % 2 ? r * 0.5 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); }

  /** Where the blocks go: one zone per place inside rect r.
      rows: the places are stacked (hundreds on top) with their label on the left; otherwise they are columns. */
  function makeLayout(r, places, rows, mini) {
    const Z = [], hw = mini ? 0 : 124, head = mini ? 0 : 150;
    let u, g;
    if (rows) {
      u = Math.max(8, Math.min(mini ? 20 : 22, Math.floor((r.h - 20 - (mini ? 34 : 76) - (places - 1) * 8 - (places - 1) * 26) / (places === 1 ? 2 : (places - 1) * 10 + 2)), Math.floor((r.w - hw - 30) / 17)));
      g = Math.max(2, Math.round(u * 0.22));
      const hs = [Math.max(mini ? 0 : 112, u * 2 + g + 30), u * 10 + 26, u * 10 + 26].slice(0, places);
      const gap = Math.min(16, (r.h - 20 - hs.reduce((a, b) => a + b, 0)) / Math.max(1, places - 1));
      let y = r.y + (r.h - hs.reduce((a, b) => a + b, 0) - gap * (places - 1)) / 2;
      for (let p = places - 1; p >= 0; p--) { Z[p] = { x: r.x + (mini ? 18 : hw), y, w: r.w - (mini ? 36 : hw + 10), h: hs[p], hx: r.x + hw / 2 + 6, hy: y + hs[p] / 2 + 16, ly: y + 22, hit: { x: r.x + hw, y: y - 4, w: r.w - hw, h: hs[p] + 8 }, head: { x: r.x + 2, y, w: hw, h: hs[p] } }; y += hs[p] + gap; }
    } else {
      const fr = places === 3 ? [0.23, 0.33, 0.44] : [0.4, 0.6];
      u = Math.max(8, Math.min(places === 3 ? 26 : 46, Math.floor((r.h - head - 42) / 10), Math.floor((r.w * fr[1] - 30) / 11.2)));
      g = Math.max(2, Math.round(u * 0.22));
      let x = r.x;
      for (let p = places - 1; p >= 0; p--) { const w = r.w * fr[p]; Z[p] = { x: x + 8, y: r.y + head, w: w - 16, h: r.h - head - 14, hx: x + w / 2, hy: r.y + 100, ly: r.y + 32, hit: { x, y: r.y + head, w, h: r.h - head }, head: { x, y: r.y, w, h: head } }; x += w; }
    }
    const slot = (p, i, n) => {
      const z = Z[p], cx = z.x + z.w / 2, cy = z.y + z.h / 2;
      if (p === 0) {
        if (rows) { const nr = Math.max(1, Math.ceil(n / 10)), tw = 10 * (u + g) - g + 8; return { x: cx - tw / 2 + u / 2 + (i % 10) * (u + g) + (i % 10 >= 5 ? 8 : 0), y: cy + (Math.floor(i / 10) - (nr - 1) / 2) * (u + g) }; }
        const nc = Math.max(2, Math.ceil(n / 5)); return { x: cx + (Math.floor(i / 5) - (nc - 1) / 2) * (u + g), y: z.y + 14 + u / 2 + (i % 5) * (u + g) };
      }
      if (p === 1) { const sp = Math.min(u + g + 2, (z.w - u - 8) / Math.max(1, n - 1)); return { x: cx + (i - (n - 1) / 2) * sp, y: rows ? cy : z.y + 14 + 5 * u }; }
      const ox = Math.min(u * 10 + 6, (z.w - 10 * u - 8) / Math.max(1, n - 1)), oy = rows ? 0 : Math.min(u * 0.7, (z.h - 10 * u - 24) / Math.max(1, n - 1));
      return { x: cx + (i - (n - 1) / 2) * ox, y: rows ? cy : z.y + 14 + 5 * u + i * oy };
    };
    return { r, Z, u, g, slot, rows, places };
  }
  /** The mat: a sheet of paper with a tinted zone for each place. */
  function paintMat(g, s, lay) {
    const r = lay.r;
    g.beginPath(); A.rect(g, r.x, r.y, r.w, r.h, 28, 5, 1); A.paper(g, s, '#FBF4E4', { shadow: 1, depth: 1.2, box: r, light: 0.03, grain: 0.3 });
    lay.Z.forEach((z, p) => {
      const a = lay.rows ? { x: r.x + 8, y: z.y - 3, w: r.w - 16, h: z.h + 6 } : { x: z.hit.x + 6, y: r.y + 8, w: z.hit.w - 12, h: r.h - 16 };
      g.beginPath(); A.rect(g, a.x, a.y, a.w, a.h, 20, 7 + p, 0.8); g.fillStyle = A.alpha(COL[p], 0.16); g.fill();
      g.save(); g.setLineDash([9, 8]); A.line(g, A.alpha(A.shade(COL[p], -0.1), 0.5), 2.5, (h) => A.rect(h, a.x + 7, a.y + 7, a.w - 14, a.h - 14, 15, 9 + p, 0.5)); g.restore();
    });
  }

  /* ---------------- the game ---------------- */
  function start(st, ctx) {
    const L = ctx.level, ROUNDS = 4, W = st.W, H = st.H, land = W >= 1000, places = L === 3 ? 3 : 2, MAXN = places === 3 ? 999 : 99;
    const card = land ? { x: 30, y: 150, w: 300, h: 270 } : { x: 20, y: 138, w: W - 40, h: 150 };
    const matR = land ? { x: 350, y: 140, w: W - 380, h: H - 180 } : { x: 20, y: 302, w: W - 40, h: H - 250 - 302 };
    const dock = land ? { x: 30, y: 436, w: 300, h: H - 40 - 436 } : { x: 20, y: H - 236, w: W - 40, h: 150 };
    const lay = makeLayout(matR, places, !land && places === 3, false), u = lay.u;
    const inMat = (p) => p.x > matR.x && p.x < matR.x + matR.w && p.y > matR.y && p.y < matR.y + matR.h;
    let R = null, won = 0, skill = 0, roundNo = 0, lastKey = '', busy = 0, held = null, shake = 0;
    const blocks = [], tiles = [], minis = [], stars = [], said = {};
    const live = (b) => !b.join && !b.dead;
    const list = (p) => blocks.filter((b) => b.p === p && live(b));
    const count = (p) => { let n = 0; for (const b of blocks) if (b.p === p && live(b)) n++; return n; };
    const total = () => count(0) + count(1) * 10 + count(2) * 100;

    /* ---------- table and mat ---------- */
    const key = Math.round(W) + 'x' + Math.round(H) + 'p' + places;
    st.add({ z: 0, sprite: A.sprite('plbg' + key, [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#BFDCD6', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.05, grain: 0.3 });
      const rnd = A.rng(31), cols = ['#FFFFFF', '#F2B33D', '#3FA39B', '#E8664A'];
      for (let i = 0; i < 46; i++) { const x = rnd() * W, y = rnd() * H, q = 12 + rnd() * 22; g.save(); g.translate(x, y); g.rotate(rnd() * 3); g.beginPath(); A.rect(g, -q / 2, -q / 2, q, q, q * 0.22, i, 0.5); g.fillStyle = A.alpha(cols[i % 4], i % 4 ? 0.13 : 0.28); g.fill(); g.restore(); }
    }) });
    const matNode = st.add({ z: 5, sprite: A.sprite('plmat' + key, [0, 0, W, H], (g, s) => paintMat(g, s, lay)) });

    /* ---------- place headers: label, and a tile that counts the blocks (or is a number dial) ---------- */
    const TS = lay.rows ? 78 : 96;
    const heads = lay.Z.map((z, p) => {
      const n = st.add({ z: 7, hit: z.head, label: NAMES[p], pressable: false, pop: 0, wob: 0 });
      n.draw = (g, s) => {
        if (!R || R.mode === 'cmp') return;
        g.fillStyle = A.shade(COL[p], -0.22); g.font = `700 ${lay.rows ? 22 : 28}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(NAMES[p], z.hx, z.ly);
        const dial = R.dials, v = dial ? R.dial[p] : R.hide ? null : count(p);
        const k = 1 + n.pop * 0.22 + (dial && !R.over && v == null ? Math.sin(st.t * 5 + p) * 0.04 : 0);
        g.save(); g.translate(z.hx + Math.sin(st.t * 40) * n.wob * 6, z.hy); g.scale(k, k);
        g.beginPath(); A.rect(g, -TS / 2, -TS / 2, TS, TS, 20, 3 + p, 0.8); A.paper(g, s, COL[p], { shadow: dial ? 1 : 0.5, box: { x: -TS / 2, y: -TS / 2, w: TS, h: TS } });
        g.beginPath(); A.rect(g, -TS / 2 + 7, -TS / 2 + 7, TS - 14, TS - 14, 14, 4 + p, 0.5); g.fillStyle = dial ? '#FFFFFF' : '#FFF8EA'; g.fill();
        g.fillStyle = v == null ? A.alpha(A.C.ink, 0.35) : A.C.ink; g.font = `800 ${TS * 0.62}px ${A.FONT_TITLE}`; g.fillText(v == null ? '?' : String(v), 0, TS * 0.04);
        if (dial && R.ghost && !R.over && R.dial[p] !== digits(R.target)[p]) {          // after two misses the right digit shows
          const q = 1 + Math.sin(st.t * 6) * 0.1; g.translate(TS * 0.46, -TS * 0.46); g.scale(q, q);
          g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fillStyle = '#FFE48A'; g.fill(); g.fillStyle = A.C.ink; g.font = `800 30px ${A.FONT_TITLE}`; g.fillText(String(digits(R.target)[p]), 0, 2);
        }
        g.restore();
      };
      n.update = (dt) => { n.pop = Math.max(0, n.pop - dt * 4); n.wob = Math.max(0, n.wob - dt * 2); };
      n.onTap = () => turnDial(p);
      return n;
    });
    function turnDial(p) {
      if (!R || !R.dials || R.over) { heads[p].pop = 0.5; K.sfx.tap(); return; }
      const v = R.dial[p] == null ? 1 : (R.dial[p] + 1) % 10;
      R.dial[p] = v; R.dialAt = st.t; R.dialHinted = false; heads[p].pop = 1; K.sfx.step(v ? v - 1 : 9);
      const b = list(p)[v - 1]; if (b) b.k = 1.35;                 // the block that was just counted hops
    }

    /* ---------- the blocks ---------- */
    function relayout() {
      for (let p = 0; p < places; p++) { const bs = list(p); bs.forEach((b, i) => { const sl = lay.slot(p, i, bs.length); b.tx = sl.x; b.ty = sl.y; }); }
      for (const b of blocks) {
        if (b.join) { const big = b.join.big, i = b.join.i; if (b.p === 0) { b.tx = big.tx; b.ty = big.ty - 4.5 * u + i * u; } else { b.tx = big.tx - 4.5 * u + i * u; b.ty = big.ty; } }
        if (b.hidden) { b.x = b.tx; b.y = b.ty; }
      }
    }
    const layer = st.add({ z: 10 });
    layer.update = (dt) => {
      relayout();
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        if (b.dead) { b.dead -= dt; b.k = Math.max(0, b.dead / 0.25); if (b.to) { b.x += (b.to.x - b.x) * Math.min(1, dt * 12); b.y += (b.to.y - b.y) * Math.min(1, dt * 12); } if (b.dead <= 0) blocks.splice(i, 1); continue; }
        if (b.delay > 0) { b.delay -= dt; continue; }
        b.mix = Math.max(0, (b.mix || 0) - dt * 1.5);
        if (held && held.b === b) continue;
        const q = Math.min(1, dt * (b.join ? 15 : 12));
        b.x += (b.tx - b.x) * q; b.y += (b.ty - b.y) * q; b.k += (1 - b.k) * Math.min(1, dt * 9);
      }
      shake = Math.max(0, shake - dt * 2.5);
    };
    layer.draw = (g) => {
      if (!R || R.mode === 'cmp') return;
      g.save(); g.translate(Math.sin(st.t * 45) * shake * 7, 0);
      if (R.ghost && !R.over && !R.dials && R.mode !== 'sub') {       // after two misses: the outline of the answer
        const d = digits(R.target), a = 0.45 + Math.sin(st.t * 5) * 0.25;
        g.save(); g.setLineDash([7, 6]); g.lineWidth = 3;
        for (let p = 0; p < places; p++) for (let i = 0; i < d[p]; i++) { const sl = lay.slot(p, i, d[p]), [w, h] = SIZE(p, u); g.strokeStyle = A.alpha(A.shade(COL[p], -0.25), a); g.strokeRect(sl.x - w / 2 - 2, sl.y - h / 2 - 2, w + 4, h + 4); }
        g.restore();
      }
      const hintSet = R.pulse || null;
      for (let p = places - 1; p >= 0; p--) for (const b of blocks) {
        if (b.p !== p || b.hidden || b.delay > 0 || (held && held.b === b)) continue;
        const pk = hintSet && hintSet.has(b) ? 1 + Math.sin(st.t * 8) * (p ? 0.05 : 0.18) : 1;
        stamp(g, p, u, b.x, b.y, b.k * pk, hintSet && hintSet.has(b) ? Math.sin(st.t * 8) * 0.03 : 0);
        if (b.mix > 0) { g.globalAlpha = Math.min(1, b.mix); stamp(g, p, u, b.x, b.y, b.k * pk, 0, b.alt); g.globalAlpha = 1; }
      }
      g.restore();
      if (held) { const b = held.b; g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 14 * st.res; g.shadowOffsetY = 8 * st.res; stamp(g, b.p, u, b.x, b.y, 1.1, b.p === 0 ? 0 : -0.04); g.restore(); }
    };
    function put(p, x, y, o) { const b = Object.assign({ p, x, y, tx: x, ty: y, k: 1, mix: 0, delay: 0 }, o); blocks.push(b); return b; }
    function setBlocks(n) {
      blocks.length = 0;
      const d = digits(n); let c = 0;
      for (let p = places - 1; p >= 0; p--) for (let i = 0; i < d[p]; i++) { const sl = lay.slot(p, i, d[p]); put(p, sl.x, sl.y - 60, { k: 0.3, delay: c++ * 0.035 }); }
    }
    const canAdd = (p) => total() + VAL[p] <= MAXN;
    /** A new block lands on the mat. */
    function addBlock(p, x, y, quiet) {
      put(p, x, y, { k: 1.25 });
      K.sfx.step(Math.max(0, count(p) - 1)); heads[p].pop = 1;
      if (!quiet && p > 0 && !said['is' + p]) { said['is' + p] = 1; if (R.mode === 'build' && R.misses === 0) ctx.say(p === 1 ? T.rodIs : T.flatIs); }
      afterAdd();
    }
    function afterAdd() {
      if (count(0) >= 10 && places > 1) snap(0);
      else if (count(1) >= 10 && places > 2) snap(1);
      else judge(true);
    }
    /** Ten blocks of place p join into one of the next place. */
    function snap(p) {
      busy++;
      const ten = list(p).slice(0, 10);
      const big = put(p + 1, 0, 0, { hidden: true, alt: p });
      ten.forEach((b, i) => { b.join = { big, i }; b.delay = i * 0.03; });
      for (let i = 0; i < 10; i++) ctx.after(i * 50, () => K.sfx.tone(520 + i * 62, 0.07, { type: 'triangle', vol: 0.13 }));
      const r = R;
      ctx.after(720, () => {
        if (R !== r) return;
        busy--;
        for (const b of ten) { const i = blocks.indexOf(b); if (i >= 0) blocks.splice(i, 1); }
        big.hidden = false; big.k = 1.3; big.mix = 1; heads[p + 1].pop = 1; heads[p].pop = 1;
        K.sfx.ding(); K.sfx.tone(1568, 0.3, { type: 'sine', vol: 0.12, delay: 0.1 }); ctx.fx.burst(big.x, big.y, { n: 16, colors: [COL[p], COL[p + 1], '#FFFFFF'] });
        if (!said['snap' + p]) { said['snap' + p] = 1; ctx.say(p ? T.snapFlat : T.snapRod); }
        afterAdd();
      });
    }
    /** A rod falls apart into ten cubes (a flat into ten rods). */
    function breakBlock(b) {
      if (busy || b.p === 0 || !R || R.over || R.lock) return;
      if (count(b.p - 1) + 10 > 19) { b.k = 1.15; shake = 0.3; K.sfx.tap(); return; }
      blocks.splice(blocks.indexOf(b), 1);
      for (let i = 0; i < 10; i++) put(b.p - 1, b.p === 1 ? b.x : b.x - 4.5 * u + i * u, b.p === 1 ? b.y - 4.5 * u + i * u : b.y, { mix: 1, alt: b.p, delay: i * 0.035, k: 1.15 });
      for (let i = 0; i < 10; i++) ctx.after(i * 40, () => K.sfx.tone(1100 - i * 55, 0.06, { type: 'triangle', vol: 0.12 }));
      K.sfx.pop(); ctx.fx.burst(b.x, b.y, { n: 8, color: COL[b.p - 1] }); heads[b.p].pop = 1; heads[b.p - 1].pop = 1;
      R.broke = true; judge(false);
    }
    function removeBlock(b) {
      if (R.mode === 'sub') {
        if (R.taken + VAL[b.p] > R.sub) { miss(b.p ? `${T.notThat} ${b.p === 1 ? T.breakRod : T.breakFlat}` : T.notThat); return; }
        R.taken += VAL[b.p]; const t = tiles[0]; b.dead = 0.3; b.to = t ? { x: t.cx, y: t.cy } : null; if (t) t.pop = 1;
        K.sfx.step(Math.min(9, Math.floor(R.taken / Math.max(1, R.sub) * 9))); heads[b.p].pop = 1;
        if (R.taken === R.sub) win();
        return;
      }
      b.dead = 0.25; K.sfx.pop(); ctx.fx.burst(b.x, b.y, { n: 5, color: COL[b.p] }); heads[b.p].pop = 1;
      judge(false);
    }
    function miss(text) {
      R.misses++; K.sfx.whoops(); shake = 0.5; ctx.say(text);
      if (R.misses >= 2) R.ghost = true;
    }
    function judge(added) {
      if (!R || R.over || !['build', 'more', 'less'].includes(R.mode)) return;
      const t = total(), past = R.mode === 'less' ? t < R.target : t > R.target;
      R.eqAt = t === R.target ? st.t : 0;
      if (past && !R.far && (added || R.mode === 'less')) {
        R.far = true;
        const hint = R.mode === 'less' ? `${T.tooFew} ${T.putBack}` : `${T.tooMany} ${T.takeSome}` + (said.off ? '' : ' ' + T.dragOff);
        if (R.mode !== 'less') said.off = 1;
        miss(R.misses === 1 && L === 1 ? `${T.tooMany} ${T.oneTen}` : hint);
      } else if (!past) R.far = false;
    }

    /* ---------- hands on the mat: each place is one big target that finds its nearest block ---------- */
    lay.Z.forEach((z, p) => {
      const n = st.add({ z: 6, hit: z.hit, pad: 0, label: NAMES[p] + ' blocks', pressable: false });
      n.onDown = (pt) => {
        if (!R || R.over || R.lock || busy || held) return;
        let best = null, bd = 1e9;
        for (const b of list(p)) { const [w, h] = SIZE(p, u), d = Math.hypot(Math.max(0, Math.abs(pt.x - b.x) - w / 2), Math.max(0, Math.abs(pt.y - b.y) - h / 2)); if (d <= bd) { bd = d; best = b; } }
        if (!best) return;
        held = { b: best, node: n }; K.sfx.tap();
      };
      n.onMove = (pt, e, s) => { if (held && held.node === n && s.moved > 10) { held.b.x = pt.x; held.b.y = pt.y - (p ? 0 : 24); } };
      n.onUp = (pt, e, s) => {
        if (!held || held.node !== n) return;
        const b = held.b; held = null;
        if (s.moved < 24) { if (b.p > 0) breakBlock(b); else { b.k = 1.3; } }
        else if (!inMat(pt)) removeBlock(b);
      };
      n.onTap = (pt) => { if (!pt && p > 0) { const b = list(p).pop(); if (b) breakBlock(b); } };   // keyboard / screen reader
    });

    /* ---------- the tray: blocks to take, a second pile to tip in, or the take-away basket ---------- */
    function clearTiles() { for (const t of tiles.splice(0)) t.node.remove(); }
    function buildTiles(defs) {
      clearTiles();
      const n = defs.length, gap = 12;
      defs.forEach((d, i) => {
        const w = land ? dock.w : Math.min(d.type === 'bin' ? dock.w : 250, (dock.w - gap * (n - 1)) / n), h = land ? Math.min(d.type === 'bin' ? 240 : n < 3 ? 200 : 164, (dock.h - gap * (n - 1)) / n) : dock.h;
        const x = land ? dock.x : dock.x + (dock.w - (w * n + gap * (n - 1))) / 2 + i * (w + gap), y = land ? dock.y + i * (h + gap) : dock.y;
        const t = Object.assign({ x, y, w, h, cx: x + w / 2, cy: y + h / 2, pop: 0, wob: 0 }, d);
        const lbl = d.type === 'src' ? 'add ' + NAMES[d.p] : d.type === 'cluster' ? 'tip in ' + NAMES[d.p] : 'basket';
        const node = st.add({ z: 8, x: t.cx, y: t.cy + 300, hit: { x: -w / 2, y: -h / 2, w, h }, pad: 0, label: lbl, pressable: false });
        t.node = node; node.to({ y: t.cy }, { dur: 0.45, ease: 'back', delay: i * 0.07 });
        node.draw = (g, s) => drawTile(g, s, t);
        node.update = (dt) => { t.pop = Math.max(0, t.pop - dt * 3.5); t.wob = Math.max(0, t.wob - dt * 2.5); };
        if (d.type === 'src') {
          node.onDown = (pt) => { if (!R || R.over || R.lock || held) return; K.sfx.tap(); t.pop = 0.6; held = { b: { p: d.p, x: pt.x, y: pt.y, k: 1 }, node, tile: t }; };
          node.onMove = (pt) => { if (held && held.node === node) { held.b.x = pt.x; held.b.y = pt.y - (d.p ? 0 : 20); } };
          node.onUp = (pt, e, s) => {
            if (!held || held.node !== node) return;
            const b = held.b; held = null;
            if (s.moved < 24) fromTile(t); else if (inMat(pt)) { if (busy || !canAdd(d.p)) { t.wob = 0.5; K.sfx.tap(); } else addBlock(d.p, b.x, b.y); }
          };
          node.onTap = (pt) => { if (!pt) fromTile(t); };
        } else if (d.type === 'cluster') {
          node.onDown = () => { K.sfx.tap(); t.pop = 0.6; };
          node.onUp = (pt, e, s) => { if (s.moved < 24 || inMat(pt)) pour(t); };
          node.onTap = (pt) => { if (!pt) pour(t); };
        }
        tiles.push(t);
      });
    }
    function fromTile(t) {
      if (!R || R.over || R.lock) return;
      if (busy || !canAdd(t.p)) { t.wob = 0.5; K.sfx.tap(); return; }
      t.pop = 1; addBlock(t.p, t.cx, t.cy);
    }
    function drawTile(g, s, t) {
      const { w, h, p } = t, k = 1 + t.pop * 0.07, c = t.type === 'bin' ? '#8A6FA3' : COL[p];
      g.save(); g.translate(Math.sin(st.t * 40) * t.wob * 6, 0); g.scale(k, k);
      g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 26, 4 + (p || 0), 1); A.paper(g, s, '#FBF4E4', { shadow: 1, box: { x: -w / 2, y: -h / 2, w, h }, light: 0.03 });
      g.beginPath(); A.rect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 19, 6, 0.6); g.fillStyle = A.alpha(c, 0.2); g.fill();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (t.type === 'src') {
        const px = land ? -w * 0.2 : 0, py = land ? 0 : -h * 0.14, bob = Math.sin(st.t * 2.2 + p) * 3;
        if (p === 0) stamp(g, 0, 44, px, py + bob, 1, 0.08); else if (p === 1) stamp(g, 1, land ? 15 : Math.min(18, Math.floor((w - 36) / 10)), land ? -48 : 0, py + bob, 1, Math.PI / 2 - 0.06); else stamp(g, 2, land ? 11 : 8, px, py + bob, 1, 0.05);
        g.fillStyle = A.shade(c, -0.25); g.font = `800 ${land ? 54 : 38}px ${A.FONT_TITLE}`; g.fillText(String(VAL[p]), land ? w * 0.29 : 0, land ? 3 : h * 0.3);
      } else if (t.type === 'cluster') {
        const n = t.n, cu = p === 2 ? 10 : p === 1 ? (land ? 13 : 11) : 28;
        if (p === 0) for (let i = 0; i < n; i++) stamp(g, 0, cu, (i % 5 - 2) * (cu + 5), (Math.floor(i / 5) - (Math.ceil(n / 5) - 1) / 2) * (cu + 5), 1, 0);
        else if (p === 1) for (let i = 0; i < n; i++) stamp(g, 1, cu, (i - (n - 1) / 2) * (cu + 5), 0, 1, 0);
        else for (let i = 0; i < n; i++) stamp(g, 2, cu, (i - (n - 1) / 2) * Math.min(26, (w - 130) / Math.max(1, n - 1)), 0, 1, 0);
        if (n > 0 && R && !R.over && !R.pouring) { const a = 0.5 + Math.sin(st.t * 5) * 0.3; g.strokeStyle = A.alpha(A.shade(c, -0.2), a); g.lineWidth = 4; g.beginPath(); A.rect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 19, 6, 0.6); g.stroke(); }
      } else {
        // the take-away basket and how many have gone into it
        const bw = Math.min(150, w * 0.42), bx = land ? 0 : -w * 0.22, by = land ? -h * 0.2 : 4;
        g.save(); g.translate(bx, by);
        g.beginPath(); A.cut(g, [[-bw / 2, -22], [bw / 2, -22], [bw * 0.4, 44], [-bw * 0.4, 44]], 12, 0.8, 5); A.paper(g, s, '#C99666', { shadow: 0.7, box: { x: -bw / 2, y: -22, w: bw, h: 66 } });
        A.line(g, 'rgba(110,70,40,.4)', 3, (q) => { for (let i = -2; i <= 2; i++) { q.moveTo(i * bw * 0.17, -18); q.lineTo(i * bw * 0.14, 40); } q.moveTo(-bw * 0.46, 4); q.lineTo(bw * 0.46, 4); });
        g.beginPath(); A.rect(g, -bw / 2 - 6, -32, bw + 12, 16, 8, 6, 0.5); A.paper(g, s, '#B98558', { shadow: 0.5 });
        g.restore();
        const tx = land ? 0 : w * 0.2, ty = land ? h * 0.16 : 0;
        g.fillStyle = A.C.ink; g.font = `800 ${land ? 58 : 54}px ${A.FONT_TITLE}`; g.fillText(`${MINUS} ${R ? R.taken : 0}`, tx, ty - (land ? 0 : 14));
        g.fillStyle = A.alpha(A.C.ink, 0.55); g.font = `700 ${land ? 26 : 24}px ${A.FONT_BODY}`; g.fillText(`of ${R ? R.sub : 0}`, tx, ty + (land ? 44 : 32));
      }
      g.restore();
    }
    /** Tip a pile into the mat, one block at a time, waiting while ten cubes join. */
    async function pour(t) {
      if (!R || R.over || R.mode !== 'add' || t.n <= 0 || R.pouring) return;
      const r = R; r.pouring = true;
      while (t.n > 0 && R === r) { while (busy) await ctx.wait(60); if (R !== r) return; t.n--; t.pop = 0.5; addBlock(t.p, t.cx, t.cy, true); await ctx.wait(t.p === 0 ? 130 : 170); }
      while (busy) await ctx.wait(60);
      if (R !== r) return;
      r.pouring = false;
      if (tiles.every((x) => x.type !== 'cluster' || x.n === 0)) { await ctx.wait(600); if (R === r) askDials(`${T.how} ${T.tapNum}`, `${r.a} + ${r.b} = ?`); }
    }
    function askDials(text, show) {
      const d = digits(R.target);
      R.dials = true; R.hide = false; R.dial = d.slice(0, places).map((v) => (v === 0 ? 0 : null));   // an empty place already says 0 R.dialAt = 0;
      heads.forEach((h) => { h.pop = 1; });
      ctx.prompt(text, { show });
    }

    /* ---------- the card: the number to make, what is on the mat, and the stars ---------- */
    const cardNode = st.add({ z: 8, x: card.x, y: card.y, pop: 0 });
    const fitText = (g, text, size, max, font) => { g.font = `800 ${size}px ${font || A.FONT_TITLE}`; const w = g.measureText(text).width; if (w > max) g.font = `800 ${Math.floor(size * max / w)}px ${font || A.FONT_TITLE}`; };
    cardNode.draw = (g, s) => {
      const { w, h } = card;
      g.beginPath(); A.rect(g, 0, 0, w, h, 30, 2, 1); A.paper(g, s, '#FFFDF6', { shadow: 1, box: { x: 0, y: 0, w, h }, light: 0.03 });
      g.beginPath(); A.rect(g, 0, 0, w, land ? 20 : 14, [30, 30, 4, 4], 3, 0.4); g.fillStyle = A.C.plum; g.fill();
      if (!R) return;
      const m = R.mode, k = 1 + cardNode.pop * 0.1;
      const main = m === 'build' ? String(R.target) : m === 'more' ? `${R.a} + 10` : m === 'less' ? `${R.a} ${MINUS} 10` : m === 'add' ? `${R.a} + ${R.b}` : m === 'sub' ? `${R.a} ${MINUS} ${R.sub}` : m === 'cmp' ? (R.over ? `${R.a} ${R.a > R.b ? '>' : '<'} ${R.b}` : R.want) : '';
      const comp = R.dials ? R.dial.slice().reverse().map((v) => (v == null ? '?' : v)).join('').replace(/^0+(?=.)/, '') : '?';
      const t = total(), second = m === 'read' ? '' : m === 'cmp' ? '' : m === 'add' ? `= ${R.over ? R.target : R.dials ? comp : '?'}` : m === 'sub' ? `= ${R.over ? R.target : '?'}` : `${t}`;
      const mx = land ? w / 2 : w * 0.29, my = land ? 92 : h / 2 + 6, sx = land ? w / 2 : w * 0.74, sy = land ? 174 : h * 0.36, stx = land ? w / 2 : w * 0.74, sty = land ? 232 : h * 0.76;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.translate(mx, my); g.scale(k, k);
      if (m === 'read') { fitText(g, comp, land ? 120 : 92, land ? w - 40 : w * 0.5); g.fillStyle = R.over ? A.C.teal : A.C.plum; g.fillText(comp, 0, land ? 30 : 0); }
      else { fitText(g, main, m === 'build' ? (land ? 124 : 96) : m === 'cmp' && !R.over ? (land ? 64 : 56) : (land ? 62 : 52), land ? w - 36 : w * 0.52, m === 'cmp' && !R.over ? A.FONT_BODY : null); g.fillStyle = A.C.ink; g.fillText(main, 0, 0); }
      g.restore();
      if (second) {
        const live = m === 'build' || m === 'more' || m === 'less', ok = live ? t === R.target : R.over;
        g.font = `800 ${land ? 50 : 46}px ${A.FONT_TITLE}`;
        const tw = g.measureText(second).width + (live ? 96 : 44);
        g.beginPath(); A.rect(g, sx - tw / 2, sy - 34, tw, 68, 34, 7, 0.6); A.paper(g, s, ok ? '#D5EEDD' : '#F3E9D6', { shadow: 0.4, box: { x: sx - tw / 2, y: sy - 34, w: tw, h: 68 } });
        if (live) { for (let i = 0; i < 3; i++) { g.fillStyle = COL[2 - i]; g.fillRect(sx - tw / 2 + 20 + i * 5, sy - 12 + i * 5, 14, 14); } }
        g.fillStyle = ok ? A.C.teal : A.C.ink; g.fillText(second, sx + (live ? 22 : 0), sy + 3);
      }
      for (let i = 0; i < ROUNDS; i++) {
        const sd = stars[i]; g.save(); g.translate(stx + (i - (ROUNDS - 1) / 2) * 50, sty);
        if (sd) { const q = 1 + sd.pop * 0.6; g.scale(q, q); g.rotate(sd.pop * 0.6); starPath(g, 19); A.paper(g, s, '#F2B33D', { shadow: 0.5 }); } else { starPath(g, 16); g.fillStyle = 'rgba(46,42,59,.12)'; g.fill(); }
        g.restore();
      }
    };
    cardNode.update = (dt) => { cardNode.pop = Math.max(0, cardNode.pop - dt * 3); for (const sd of stars) sd.pop = Math.max(0, sd.pop - dt * 2); };

    /* ---------- bigger / smaller: two block pictures to choose between ---------- */
    function buildMinis(a, b) {
      const area = land ? matR : { x: 20, y: 302, w: W - 40, h: H - 302 - 40 }, gap = 20;
      [a, b].forEach((n, i) => {
        const r = land ? { x: area.x + i * (area.w + gap) / 2, y: area.y, w: (area.w - gap) / 2, h: 0 } : { x: area.x, y: area.y + i * (area.h + gap) / 2, w: area.w, h: (area.h - gap) / 2 };
        if (land) { r.h = Math.min(area.h, 620); r.y = area.y + (area.h - r.h) / 2; }
        const ml = makeLayout({ x: r.x, y: r.y + 8, w: r.w, h: r.h - 16 }, 3, true, true), d = digits(n);
        const node = st.add({ z: 8, hit: r, pad: 0, label: 'number ' + (i + 1), pop: 0, wob: 0, pressable: false, alpha: 0 });
        node.to({ alpha: 1 }, { dur: 0.3, delay: i * 0.15 });
        const m = { n, node, r };
        node.draw = (g, s) => {
          const glow = R && R.ghost && !R.over && i === R.answer, k = 1 + node.pop * 0.05 + (glow ? Math.sin(st.t * 6) * 0.015 : 0), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          g.save(); g.translate(cx + Math.sin(st.t * 40) * node.wob * 7, cy); g.scale(k, k); g.translate(-cx, -cy);
          if (glow) { g.beginPath(); A.rect(g, r.x - 10, r.y - 10, r.w + 20, r.h + 20, 36, 3, 1); g.fillStyle = 'rgba(255,228,138,.9)'; g.fill(); }
          g.beginPath(); A.rect(g, r.x, r.y, r.w, r.h, 28, 5 + i, 1); A.paper(g, s, R && R.over && i === R.answer ? '#E5F4E3' : '#FBF4E4', { shadow: 1, box: r, light: 0.03 });
          for (let p = 2; p >= 0; p--) for (let j = 0; j < d[p]; j++) { const sl = ml.slot(p, j, d[p]); stamp(g, p, ml.u, sl.x, sl.y, 1, 0); }
          if (R && R.over) { g.fillStyle = A.C.ink; g.font = `800 60px ${A.FONT_TITLE}`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(String(n), r.x + r.w - 24, r.y + r.h - 44); }
          g.restore();
        };
        node.update = (dt) => { node.pop = Math.max(0, node.pop - dt * 3); node.wob = Math.max(0, node.wob - dt * 2.5); };
        node.onTap = () => choose(i);
        minis.push(m);
      });
    }
    function choose(i) {
      if (!R || R.mode !== 'cmp' || R.over) return;
      const m = minis[i]; m.node.pop = 1;
      if (i === R.answer) { K.sfx.pop(); ctx.fx.burst(m.r.x + m.r.w / 2, m.r.y + m.r.h / 2, { n: 14 }); win(); return; }
      m.node.wob = 0.5; const da = digits(R.a), db = digits(R.b), p = da[2] !== db[2] ? 2 : da[1] !== db[1] ? 1 : 0;
      miss(T.look[p]);
    }

    /* ---------- rounds ---------- */
    const rint = K.randInt;
    function makeRound() {
      const S = { misses: 0, taken: 0, start: 0 };
      const kinds = L === 1 ? (skill >= 2 ? ['build', 'build', 'read'] : ['build']) : L === 2 ? ['build', 'read', 'more', 'build', 'less', 'read'] : ['build', 'add', 'sub', 'cmp'];
      const m = forced || kinds[roundNo % kinds.length]; S.mode = m;
      if (m === 'build') {
        S.target = L === 1 ? (skill === 0 ? rint(11, 15) : rint(11, 20)) : L === 2 ? (skill === 0 ? rint(21, 49) : rint(21, 99)) : skill === 0 ? rint(101, 399) : rint(101, 999);
        S.prompt = T.build + (S.target <= 20 ? ' ' + T.n(S.target) : ''); S.show = 'Build ' + S.target; S.tiles = 'src';
      } else if (m === 'read') {
        S.target = L === 1 ? rint(11, 19) : L === 2 ? (skill === 0 ? rint(21, 59) : rint(21, 99)) : rint(101, 999);
        S.start = S.target; S.lock = true; S.prompt = `${T.read} ${T.tapNum}`; S.show = 'What number is this?';
      } else if (m === 'more' || m === 'less') {
        S.a = m === 'more' ? rint(11, 89) : rint(20, 99); S.start = S.a; S.target = S.a + (m === 'more' ? 10 : -10);
        S.prompt = m === 'more' ? T.more : T.less; S.show = `${S.a} ${m === 'more' ? '+' : MINUS} 10`; S.tiles = 'src'; S.far = false;
      } else if (m === 'add') {
        let a, b;
        if (skill === 0) { const o1 = rint(4, 9), o2 = rint(11 - o1, 9); a = rint(1, 4) * 10 + o1; b = rint(1, 3) * 10 + o2; }
        else if (skill === 1) { const o1 = rint(3, 9), o2 = rint(10 - o1, 9); a = rint(1, 5) * 100 + rint(0, 4) * 10 + o1; b = rint(1, 4) * 10 + o2; }
        else { const o1 = rint(2, 9), o2 = rint(10 - o1, 9), t1 = rint(3, 8), t2 = rint(9 - t1, 8); a = rint(1, 4) * 100 + t1 * 10 + o1; b = rint(1, 3) * 100 + t2 * 10 + o2; }
        Object.assign(S, { a, b, start: a, target: a + b, lock: true, hide: true, prompt: `${T.add} ${T.tapPile}`, show: `${a} + ${b}`, tiles: 'cluster' });
      } else if (m === 'sub') {
        let a, b;
        if (skill === 0) { const o = rint(1, 6); a = rint(2, 6) * 10 + o; b = rint(o + 1, 9); }
        else if (skill === 1) { const o = rint(0, 6); a = rint(4, 9) * 10 + o; b = rint(1, 3) * 10 + rint(o + 1, 9); }
        else { const t = rint(0, 5), o = rint(0, 9); a = rint(2, 6) * 100 + t * 10 + o; b = rint(t + 1, 9) * 10 + rint(0, 9); }
        Object.assign(S, { a, sub: b, start: a, target: a - b, show: `${a} ${MINUS} ${b}`, tiles: 'bin' });
        S.borrow = digits(b)[0] > digits(a)[0] ? T.breakRod : digits(b)[1] > digits(a)[1] ? T.breakFlat : '';
        S.prompt = T.sub;
      } else {
        let a, b;
        if (skill === 0) { a = rint(1, 9) * 100 + rint(0, 99); do { b = rint(1, 9) * 100 + rint(0, 99); } while (Math.floor(b / 100) === Math.floor(a / 100)); }
        else if (skill === 1) { const h = rint(1, 9) * 100; a = h + rint(0, 9) * 10 + rint(0, 9); do { b = h + rint(0, 9) * 10 + rint(0, 9); } while (Math.floor(b / 10) === Math.floor(a / 10)); }
        else if (Math.random() < 0.5) { const h = rint(1, 8); a = h * 100 + rint(6, 9) * 10 + rint(5, 9); b = (h + 1) * 100 + rint(0, 2) * 10 + rint(0, 3); if (Math.random() < 0.5) [a, b] = [b, a]; }   // fewer blocks, bigger number
        else { const h = rint(1, 9) * 100, x = rint(1, 9), y = rint(0, 9); a = h + x * 10 + y; b = h + y * 10 + x; if (a === b) b += 1; }
        const want = Math.random() < 0.6 ? 'bigger' : 'smaller';
        Object.assign(S, { a, b, want, answer: (want === 'bigger') === (a > b) ? 0 : 1, target: want === 'bigger' ? Math.max(a, b) : Math.min(a, b), prompt: T[want], show: T[want], lock: true });
      }
      S.key = m + S.target;
      return S;
    }
    let forced = null;
    function newRound() {
      let S, guard = 0;
      do { S = makeRound(); } while ((S.key === lastKey || (R && S.target === R.target)) && guard++ < 30);
      forced = null; lastKey = S.key;
      if (S.borrow && (said.sub = (said.sub || 0) + 1) <= 2) S.prompt += ' ' + S.borrow;   // the first times, say how to borrow
      const first = roundNo === 0; roundNo++;
      R = S; busy = 0; held = null; blocks.length = 0;
      clearTiles(); for (const m of minis.splice(0)) m.node.remove();
      const cmp = S.mode === 'cmp';
      matNode.visible = !cmp; heads.forEach((h) => { h.visible = !cmp; });
      if (cmp) buildMinis(S.a, S.b);
      else {
        setBlocks(S.start);
        if (S.tiles === 'src') buildTiles(Array.from({ length: places }, (x, p) => ({ type: 'src', p })).reverse());
        else if (S.tiles === 'cluster') { const d = digits(S.b); buildTiles([2, 1, 0].filter((p) => d[p] > 0).map((p) => ({ type: 'cluster', p, n: d[p] }))); }
        else if (S.tiles === 'bin') buildTiles([{ type: 'bin' }]);
      }
      if (S.mode === 'read') askDials(S.prompt, S.show);
      else ctx.prompt(S.prompt + (first && S.tiles === 'src' ? ' ' + T.drag : ''), { show: S.show });
      cardNode.pop = 1; K.sfx.whoosh();
    }
    async function win() {
      const r = R; if (r.over) return; r.over = true; r.ghost = false; r.pulse = null;
      K.sfx.ding(); ctx.after(200, () => K.sfx.sparkle()); cardNode.pop = 1;
      blocks.forEach((b, i) => { if (live(b)) ctx.after(i * 22, () => { b.k = 1.3; }); });
      if (r.mode !== 'cmp') ctx.fx.burst(matR.x + matR.w / 2, matR.y + matR.h / 2, { n: 18 });
      if (r.target >= 11 && r.target <= 20 && r.mode !== 'build') ctx.say(T.n(r.target));
      await ctx.wait(1500);
      stars.push({ pop: 1 }); won++; K.sfx.step(won + 3);
      skill = r.misses === 0 ? Math.min(4, skill + 1) : r.misses >= 2 ? Math.max(0, skill - 1) : skill;
      await ctx.wait(900);
      if (won >= ROUNDS) { await ctx.celebrate({ ms: 3400 }); won = 0; stars.length = 0; }
      newRound();
    }

    st.onframe = () => {
      if (!R || R.over) return;
      if (R.eqAt && st.t - R.eqAt > 0.75 && !busy && !held && total() === R.target) win();
      if (R.dials && R.dialAt) {
        const d = digits(R.target), bad = []; let unset = false;
        for (let p = places - 1; p >= 0; p--) { if (R.dial[p] == null) unset = true; if ((R.dial[p] || 0) !== d[p]) bad.push(p); }
        if (!bad.length && !unset && st.t - R.dialAt > 0.8) win();
        else if (bad.length && !unset && st.t - R.dialAt > 2.4 && !R.dialHinted) { R.dialHinted = true; heads[bad[0]].wob = 0.6; miss(T.countP[bad[0]]); }
      }
      if (R.mode === 'sub' && R.ghost) {                         // after two misses: what to touch next pulses
        const need = digits(R.sub - R.taken), set = new Set();
        if (need[0] > count(0)) { const b = list(1).pop() || list(2).pop(); if (b) set.add(b); }
        else if (need[1] > count(1)) { const b = list(2).pop(); if (b) set.add(b); }
        else for (let p = 0; p < places; p++) list(p).slice(-need[p] || 1e9).forEach((b) => set.add(b));
        R.pulse = set;
      }
    };

    K._place = {                                                 // for browser tests
      get R() { return R; }, total, count, blocks, tiles, minis, lay, matR, digits,
      get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; }, get busy() { return busy; },
      jump(mode) { forced = mode; newRound(); },
      add(p) { const t = tiles.find((x) => x.type === 'src' && x.p === p); if (t) fromTile(t); },
      take(p) { const b = list(p).pop(); if (b) removeBlock(b); return !!b; },
      breakOne(p) { const b = list(p).pop(); if (b) breakBlock(b); },
      dial: turnDial, choose,
    };
    ctx.onExit(() => { K._place = null; });
    ctx.after(350, newRound);
  }

  function icon(g, w) {
    const k = w / 300;
    g.fillStyle = '#BFDCD6'; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(46,40,70,.16)'; g.beginPath(); g.roundRect ? g.roundRect(26 * k, 34 * k, 256 * k, 248 * k, 26 * k) : g.rect(26 * k, 34 * k, 256 * k, 248 * k); g.fill();
    g.fillStyle = '#FBF4E4'; g.beginPath(); g.roundRect ? g.roundRect(20 * k, 26 * k, 256 * k, 248 * k, 26 * k) : g.rect(20 * k, 26 * k, 256 * k, 248 * k); g.fill();
    g.fillStyle = 'rgba(63,163,155,.18)'; g.fillRect(34 * k, 40 * k, 130 * k, 220 * k);
    g.fillStyle = 'rgba(242,179,61,.22)'; g.fillRect(172 * k, 40 * k, 90 * k, 220 * k);
    const u = 19 * k;
    for (const x of [70, 108]) { g.save(); g.translate(x * k + u / 2, 150 * k); paintBlock(g, 0, 1, u, COL[1]); g.restore(); }
    [[196, 70], [226, 70], [196, 100], [226, 100], [196, 130]].forEach(([x, y]) => { g.save(); g.translate(x * k, y * k); paintBlock(g, 0, 0, 24 * k, COL[0]); g.restore(); });
    g.fillStyle = '#2E2A3B'; g.font = `800 ${62 * k}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('25', 216 * k, 214 * k);
  }

  K.game({ id: 'place', title: 'Number Blocks', voice: 'place', group: 'arcade', age: 7, subject: 'math', order: 34, icon, start, lines, resize: () => K.go('place') });
})();
