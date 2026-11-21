/* Make Ten — number bonds with an egg box (a ten-frame).
   The egg box does the teaching: the child can always see and move the eggs.
     fill    the box is partly full; tap or drag eggs in until it is full. The sum counts along (6 + 4 = 10).
     nest    three nests hold different numbers of eggs: which one fills the box exactly? (6 + ? = 10)
     hop     the box is full, some eggs hop out: how many are left? (10 - 4 = ?)
     make    a sum with a missing number; move eggs in or out until it is true (4 + ? = 7, 10 - ? = 6)
     bridge  two boxes: 8 + 5. Fill the first box from the five and see 10 + 3 = 13.
   Level 1: a box of five. Level 2: a box of ten. Level 3: two boxes (to 20), little boxes of ten (to 100),
   bridging through ten and missing numbers. The kinds of round widen as the child succeeds.
   Nothing can go wrong: a nest that does not fit hops back, a wrong number wobbles and the eggs get counted. */
(function () {
  'use strict';
  const A = K.art, ID = 'tens';
  const capW = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const cnt = (n) => capW(K.numWord(n)) + '!';
  const SAY = {
    fill: 'Fill the egg box.', how: 'Tap an egg, or drag it in.', full: 'The box is full!', howAdd: 'How many did you put in?',
    nest: 'Which nest fills the box?', notFull: 'Not full yet.', tooMany: 'Too many!', tryNest: 'Try another nest.',
    hop: 'Some eggs hop out!', left: 'How many are left?', countBox: 'Count the eggs in the box.',
    make: 'Make the sum true.', makeHow: 'Move the eggs in or out.',
    bridge: 'Put all the eggs in.', now: 'How many eggs are there now?', tenMore: 'Ten, and how many more?',
    tens: 'Each little box holds ten eggs.', noRoom: 'No more room!',
  };
  const lines = () => { const out = Object.values(SAY); for (let n = 1; n <= 10; n++) out.push(cnt(n)); return out; };
  const MINUS = '−';

  /* ---------------- pictures ---------------- */
  const PIC = {};
  function load(name, src) { const im = new Image(); im.onload = () => { PIC[name] = im; }; im.src = src; }
  load('egg', 'img/words/egg.webp'); load('chick', 'img/faces/chick.webp');
  const TINT = [null, '#E0A67C', '#7CC4EC'];                 // cream (as painted), brown, duck-egg blue
  const PAPER = ['#F6E3BE', '#D9A273', '#A9D4E6'], INK = ['#B07E3C', '#B5693A', '#2F86AE'];
  const tinted = {};
  function eggImage(kind) {
    const im = PIC.egg; if (!kind) return im;
    if (tinted[kind]) return tinted[kind];
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = kind === 2 ? 'color' : 'multiply'; g.fillStyle = TINT[kind]; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0);
    return (tinted[kind] = c);
  }
  /** One egg, 100 units tall, centred. */
  function eggSprite(kind) {
    const im = PIC.egg;
    return A.sprite('tens-egg' + kind + (im ? 'P' : ''), [-42, -54, 84, 110], (g, s) => {
      if (im) { g.save(); g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = 7 * s; g.shadowOffsetX = 2 * s; g.shadowOffsetY = 4 * s; g.drawImage(eggImage(kind), -35, -50, 70, 100); g.restore(); return; }
      g.beginPath(); A.smooth(g, [[0, -48], [22, -32], [34, 4], [26, 36], [0, 46], [-26, 36], [-34, 4], [-22, -32]]);
      A.paper(g, s, PAPER[kind], { box: { x: -34, y: -48, w: 68, h: 94 }, light: 0.08 });
      g.fillStyle = A.C.ink; for (const x of [-11, 11]) { g.beginPath(); g.arc(x, 4, 3.6, 0, 7); g.fill(); }
      A.line(g, A.C.ink, 2.6, (h) => h.arc(0, 9, 7, 0.3, Math.PI - 0.3));
      g.fillStyle = 'rgba(232,102,74,.4)'; for (const x of [-20, 20]) { g.beginPath(); g.arc(x, 14, 6, 0, 7); g.fill(); }
    });
  }
  /** A little shut box of ten eggs, the same size as one egg. */
  function tenSprite(kind) {
    const lid = ['#E9CFA4', '#E39A6B', '#8CC6DC'][kind];
    return A.sprite('tens-ten' + kind, [-44, -44, 88, 88], (g, s) => {
      g.beginPath(); A.rect(g, -38, -6, 76, 40, 9, 3, 0.6); A.paper(g, s, A.shade(lid, -0.12), { box: { x: -38, y: -6, w: 76, h: 40 } });
      g.beginPath(); A.rect(g, -40, -34, 80, 44, 12, 5, 0.6); A.paper(g, s, lid, { box: { x: -40, y: -34, w: 80, h: 44 }, light: 0.08, shadow: 0.6 });
      g.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-28 + i * 14, -25, 5, 3.4, 0, 0, 7); g.fill(); }
      g.beginPath(); A.rect(g, -9, 4, 18, 9, 3, 2, 0); g.fillStyle = A.shade(lid, -0.26); g.fill();
      g.fillStyle = A.C.ink; g.font = `800 30px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10', 0, -9);
    });
  }
  const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);

  /* ---------------- the room ---------------- */
  function backdrop(g, s, W, H, ty) {
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#F6E7CB', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.03, grain: 0.3 });
    const r = A.rng(31), cols = [A.C.marigold, A.C.peach, A.C.teal, A.C.tomato];
    for (let i = 0; i < 16; i++) { const x = r() * W, y = r() * ty, q = 12 + r() * 22; g.beginPath(); A.blob(g, x, y, q, q, 0.08, i + 2); g.fillStyle = A.alpha(cols[i % 4], 0.1); g.fill(); }
    // a gingham cloth over the table
    const n = Math.max(6, Math.round(W / 110)), w = W / n;
    const edge = (dy) => { g.moveTo(-20, ty + 20 + dy); g.lineTo(0, ty + 20 + dy); for (let i = 0; i < n; i++) g.quadraticCurveTo(i * w + w / 2, ty - 16 + dy, (i + 1) * w, ty + 20 + dy); g.lineTo(W + 20, ty + 20 + dy); };
    const cloth = () => { g.beginPath(); edge(0); g.lineTo(W + 20, H + 20); g.lineTo(-20, H + 20); g.closePath(); };
    cloth(); A.paper(g, s, '#9CCBC0', { shadow: 0.9, box: { x: 0, y: ty, w: W, h: H - ty }, light: 0.05, grain: 0.28 });
    g.save(); cloth(); g.clip();
    g.fillStyle = 'rgba(255,255,255,.13)';
    for (let x = 30; x < W; x += 120) g.fillRect(x, ty - 10, 60, H);
    for (let y = ty + 50; y < H; y += 120) g.fillRect(0, y, W, 60);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.setLineDash([10, 12]); g.beginPath(); edge(17); g.stroke(); g.setLineDash([]);
    g.restore();
  }
  /** The straw nest that loose eggs sit in. */
  function straw(g, s, w, h, seed) {
    g.beginPath(); A.blob(g, 0, 0, w / 2, h / 2, 0.035, seed, 14); A.paper(g, s, '#D9A94E', { box: { x: -w / 2, y: -h / 2, w, h }, depth: 1.1 });
    g.beginPath(); A.blob(g, 0, -h * 0.04, w / 2 - 14, h / 2 - 13, 0.03, seed + 1, 14); A.paper(g, s, '#EFCB72', { shadow: 0, box: { x: -w / 2, y: -h / 2, w, h }, light: 0.05 });
    g.save(); g.beginPath(); A.blob(g, 0, 0, w / 2, h / 2, 0.035, seed, 14); g.clip();
    const r = A.rng(seed + 9);
    for (let i = 0; i < Math.round(w / 7); i++) { const x = (r() - 0.5) * w, y = (r() - 0.5) * h, a = (r() - 0.5) * 1.2, l = 16 + r() * 26; A.line(g, r() < 0.5 ? 'rgba(170,120,40,.35)' : 'rgba(255,240,190,.5)', 2.4, (p) => { p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 - 4, x + Math.cos(a) * l, y + Math.sin(a) * l); }); }
    g.restore();
  }
  function boxBase(g, s, w, h, p, rows) {
    g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 26, 4, 1); A.paper(g, s, '#D7B286', { box: { x: -w / 2, y: -h / 2, w, h }, depth: 1.4, light: 0.07 });
    g.beginPath(); A.rect(g, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 20, 6, 0.6); g.fillStyle = '#B58E60'; g.fill();
    for (let r = 0; r < rows; r++) for (let c = 0; c < 5; c++) { g.beginPath(); g.ellipse((c - 2) * p, (r - (rows - 1) / 2) * p + p * 0.2 - 4, p * 0.4, p * 0.27, 0, 0, 7); g.fillStyle = '#8F6C47'; g.fill(); }
  }
  function boxFront(g, s, w, p, last) {
    const x0 = -w / 2 + 6, x1 = w / 2 - 6, peak = p * 0.1, dip = p * 0.33, bot = p * 0.5 + (last ? 15 : 3);
    g.beginPath(); g.moveTo(x0, bot - 12); g.lineTo(x0, peak + 8);
    g.quadraticCurveTo(x0, peak, -2.5 * p + 8, peak);
    for (let c = 0; c < 5; c++) { const cx = (c - 2) * p; g.bezierCurveTo(cx - p * 0.34, peak, cx - p * 0.3, dip, cx, dip); g.bezierCurveTo(cx + p * 0.3, dip, cx + p * 0.34, peak, cx + p * 0.5 - (c === 4 ? 8 : 0), peak); }
    g.quadraticCurveTo(x1, peak, x1, peak + 8); g.lineTo(x1, bot - 12); g.quadraticCurveTo(x1, bot, x1 - 14, bot); g.lineTo(x0 + 14, bot); g.quadraticCurveTo(x0, bot, x0, bot - 12); g.closePath();
    A.paper(g, s, '#E7CA9E', { shadow: 0.45, box: { x: x0, y: peak, w: x1 - x0, h: bot - peak }, light: 0.08 });
    A.line(g, 'rgba(255,255,255,.35)', 3, (h) => { for (let c = 0; c < 5; c++) { const cx = (c - 2) * p; h.moveTo(cx - p * 0.22, dip + 9); h.quadraticCurveTo(cx, dip + 3, cx + p * 0.22, dip + 9); } });
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, SET = 4;
    const tableY = land ? 292 : 276;
    st.add({ z: 0, sprite: A.sprite('tens-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => backdrop(g, s, W, H, tableY)) });

    let R = null, won = 0, skill = 0, lastKey = '', lastKind = '', roundNo = 0, touched = false, said = {};
    let G = null;                                   // this round's geometry
    const eggs = [], scene = [];                    // scene: every node that belongs to the round
    let slots = [], spots = [];
    const add = (o) => { const n = st.add(o); scene.push(n); return n; };

    /* ---------- layout ---------- */
    function layout(cap, tiles, two) {
      const nb = cap > 10 ? 2 : 1, rows = cap === 5 ? 1 : 2, top = land ? 128 : 150, avail = H - 26 - top;
      let p = land ? Math.min(cap === 5 ? 140 : nb === 1 ? 122 : 108, (W - 150) / (nb * 5 + 0.7)) : Math.min(104, (W - 70) / 5);
      let tp = land ? Math.min(cap === 5 ? 118 : 98, (W - 130) / 10) : Math.min(104, (W - 40) / 5);
      const tr = land ? 1 : 2, hs = two ? (land ? 166 : 172) : land ? 150 : 128, hq = tiles ? 148 : 0, hc = land ? 0 : 72;
      const need = (k) => hs + (land ? rows * p * k + 40 : nb * (rows * p * k + 40) + (nb - 1) * 16) + tr * tp * k + 34 + hq + hc;
      let k = 1; while (k > 0.6 && need(k) > avail) k -= 0.02;
      p *= k; tp *= k;
      const bh = rows * p + 40, bw = 5 * p + 36, hb = land ? bh : nb * bh + (nb - 1) * 16, ht = tr * tp + 34;
      const spare = avail - need(k), gaps = tiles ? 4 : 3, gap = K.clamp(spare / gaps, 0, 56);
      let y = top + Math.max(0, spare - gap * gaps) * 0.4;
      const g = { nb, rows, p, tp, bw, bh, size: p * 0.9, sumY: y + hs / 2 };
      y += hs + gap; const boxTop = y; y += hb + gap; g.trayY = y + ht / 2; g.trayH = ht; y += ht + gap; g.tilesY = y + hq / 2; g.chickY = land ? H - 62 : Math.min(H - 50, y + hq + (tiles ? gap * 0.5 : 0) + hc / 2);
      g.boxes = []; for (let b = 0; b < nb; b++) g.boxes.push(land ? { x: W / 2 + (b - (nb - 1) / 2) * (bw + 26), y: boxTop + bh / 2 } : { x: W / 2, y: boxTop + bh / 2 + b * (bh + 16) });
      g.slot = (i) => { const bx = g.boxes[Math.floor(i / 10)], c = i % 5, r = Math.floor((i % 10) / 5); return { x: bx.x + (c - 2) * p, y: bx.y + (r - (rows - 1) / 2) * p - 6, row: r }; };
      const order = land ? [4, 5, 3, 6, 2, 7, 1, 8, 0, 9] : [2, 1, 3, 0, 4, 7, 6, 8, 5, 9];
      g.spot = (j) => { const i = order[j]; return land ? { x: W / 2 + (i - 4.5) * tp, y: g.trayY - 6 } : { x: W / 2 + ((i % 5) - 2) * tp, y: g.trayY + (Math.floor(i / 5) - 0.5) * tp - 4 }; };
      g.trayW = (land ? 10 : 5) * tp + 44;
      return g;
    }

    /* ---------- the sum, as big text ---------- */
    const sum = st.add({ ui: true, z: 40, x: W / 2, y: 200, pop: 0, a: [], b: null });
    function drawTokens(g, s, toks, fs, y) {
      g.font = `800 ${fs}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const gap = fs * 0.26, ws = toks.map((t) => Math.max(g.measureText(String(t.t)).width, t.q || t.c ? fs * 0.62 : 0) + (t.q || t.c ? fs * 0.3 : 0));
      const total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1), k = Math.min(1, (W - 70) / total);
      g.save(); g.translate(0, y); g.scale(k, k);
      let x = -total / 2;
      toks.forEach((t, i) => {
        const w = ws[i], cx = x + w / 2; x += w + gap;
        if (t.q) {
          const bob = t.t === '?' ? Math.sin(st.t * 3) * 3 : 0;
          g.beginPath(); A.rect(g, cx - w / 2, -fs * 0.56 + bob, w, fs * 1.1, fs * 0.2, 3, 0.5); A.paper(g, s, '#FFFDF6', { shadow: 0.5, grain: 0.1, light: 0 });
          g.save(); g.setLineDash([fs * 0.1, fs * 0.09]); g.lineWidth = fs * 0.045; g.strokeStyle = t.c || A.C.plum; g.beginPath(); A.rect(g, cx - w / 2 + 5, -fs * 0.56 + 5 + bob, w - 10, fs * 1.1 - 10, fs * 0.16, 3, 0.5); g.stroke(); g.restore();
          g.fillStyle = t.c || A.C.plum; g.fillText(String(t.t), cx, fs * 0.04 + bob);
        } else if (t.c) {
          g.beginPath(); A.rect(g, cx - w / 2, -fs * 0.56, w, fs * 1.1, fs * 0.24, 5, 0.5); A.paper(g, s, '#FFFDF6', { shadow: 0.5, grain: 0.1, light: 0 });
          g.fillStyle = t.c; g.fillText(String(t.t), cx, fs * 0.04);
        } else { g.fillStyle = t.op ? A.C.plum : A.C.ink; g.fillText(String(t.t), cx, fs * 0.04); }
      });
      g.restore();
    }
    sum.draw = (g, s) => {
      if (!sum.a.length) return;
      const k = 1 + sum.pop * 0.12, two = !!sum.b, fs = (land ? 104 : 84) * (two ? 0.74 : 1);
      g.save(); g.scale(k, k);
      drawTokens(g, s, sum.a, fs, two ? -fs * 0.58 : 0);
      if (two) drawTokens(g, s, sum.b, fs, fs * 0.62);
      g.restore();
    };
    sum.update = (dt) => { sum.pop = Math.max(0, sum.pop - dt * 2.6); };
    const T = (t, o) => Object.assign({ t }, o), OP = (t) => ({ t, op: 1 });
    const eq = (a, op, b, c) => [typeof a === 'object' ? a : T(a), OP(op), typeof b === 'object' ? b : T(b), OP('='), typeof c === 'object' ? c : T(c)];
    function setSum(a, b) { const key = JSON.stringify([a, b]); if (key !== sum.key) { sum.key = key; sum.pop = 1; } sum.a = a; sum.b = b || null; }

    /* ---------- chicks: one hatches for every round ---------- */
    const chicks = st.add({ ui: true, z: 6, x: land ? 64 : W / 2 - 1.5 * 76, y: 0, pop: 0 });
    chicks.draw = (g, s) => {
      for (let i = 0; i < SET; i++) {
        g.save(); g.translate(i * 76, 0);
        g.beginPath(); g.ellipse(0, 16, 33, 17, 0, 0, 7); g.fillStyle = '#D9A94E'; g.fill(); g.beginPath(); g.ellipse(0, 13, 26, 11, 0, 0, 7); g.fillStyle = '#EFCB72'; g.fill();
        if (i < won) {
          const k = i === won - 1 ? 1 + chicks.pop * 0.5 : 1; g.scale(k, k); g.rotate(Math.sin(st.t * 3 + i) * 0.06);
          if (PIC.chick) { const im = PIC.chick, w = 62; g.drawImage(im, -w / 2, -w * im.height / im.width / 2 - 6, w, w * im.height / im.width); }
          else { g.beginPath(); g.arc(0, -6, 27, 0, 7); A.paper(g, s, '#F6CF4F', { shadow: 0.5 }); g.fillStyle = A.C.ink; for (const x of [-9, 9]) { g.beginPath(); g.arc(x, -10, 3.2, 0, 7); g.fill(); } g.beginPath(); A.cut(g, [[-7, -3], [7, -3], [0, 7]], 2, 0, 2); g.fillStyle = A.C.tomato; g.fill(); }
        }
        g.restore();
      }
    };
    chicks.update = (dt) => { chicks.pop = Math.max(0, chicks.pop - dt * 2.5); };

    /* ---------- eggs ---------- */
    const itemSprite = (kind) => (R && R.unit === 10 ? tenSprite(kind) : eggSprite(kind));
    function makeEgg(kind, x, y, scale) {
      const size = G.size;
      const o = { kind, where: 'tray', slot: -1, spot: -1, fixed: false, fly: null, grab: false, wob: Math.random() * 6, wig: 0, sq: 0, pulse: false, unit: R.unit };
      const node = add({ z: 30, x, y, sx: scale == null ? 0 : scale, sy: scale == null ? 0 : scale, pressable: false, pad: 4, hit: { x: -size * 0.42, y: -size * 0.52, w: size * 0.84, h: size * 1.04 } });
      o.node = node;
      if (scale == null) node.to({ sx: 1, sy: 1 }, { dur: 0.34, ease: 'back', delay: Math.random() * 0.25 });
      node.draw = (g) => {
        const sp = o.unit === 10 ? tenSprite(o.kind) : eggSprite(o.kind), k = (size / 100) * (o.grab ? 1.14 : 1) * (o.pulse ? 1 + Math.sin(st.t * 7) * 0.07 : 1);
        g.rotate((o.where === 'box' && !o.fly ? 0 : Math.sin(st.t * 2 + o.wob) * 0.045) + Math.sin(o.wig * 22) * o.wig * 0.3);
        g.scale(k * (1 + o.sq), k * (1 - o.sq)); put(g, sp);
      };
      node.update = (dt) => {
        o.wig = Math.max(0, o.wig - dt * 1.6); o.sq += (0 - o.sq) * Math.min(1, dt * 12);
        const f = o.fly; if (!f) return;
        f.t += dt / f.dur; const k = Math.min(1, f.t), e = k * k * (3 - 2 * k);
        node.x = f.x0 + (f.x1 - f.x0) * e; node.y = f.y0 + (f.y1 - f.y0) * e - Math.sin(k * Math.PI) * f.lift;
        if (k >= 1) { o.fly = null; o.sq = 0.16; if (f.then) f.then(); }
      };
      node.onDown = (p) => {
        touched = true;
        if (!R || R.over || R.busy || o.fly || !movable(o)) { wiggle(o); return; }
        o.grab = true; o.gx = p.x - node.x; o.gy = p.y - node.y; setZ(node, 60); K.sfx.tap();
      };
      node.onMove = (p, e, s) => { if (o.grab && s.moved > 8) { node.x = p.x - o.gx; node.y = p.y - o.gy; } };
      node.onUp = (p, e, s) => {
        if (!o.grab) return; o.grab = false;
        if (s.moved < 24) toggle(o); else dropped(o);
      };
      node.onTap = (p) => { if (p) return; if (R && !R.over && !R.busy && !o.fly && movable(o)) toggle(o); else wiggle(o); };   // keyboard and tests
      eggs.push(o);
      return o;
    }
    const setZ = (node, z) => { node.z = z; st.root._sorted = false; };
    function wiggle(o) { o.wig = 1; K.sfx.tone(640 + Math.random() * 320, 0.08, { type: 'triangle', vol: 0.12 }); }
    function fly(o, x, y, opts) {
      opts = opts || {}; const n = o.node, d = Math.hypot(x - n.x, y - n.y);
      setZ(n, 60);
      return new Promise((res) => { o.fly = { x0: n.x, y0: n.y, x1: x, y1: y, t: 0, dur: opts.dur || K.clamp(d / 1500, 0.2, 0.42), lift: opts.lift == null ? Math.min(110, 30 + d * 0.22) : opts.lift, then: res }; });
    }
    function movable(o) {
      if (!R || o.where === 'out' || o.where === 'nest') return false;
      if (R.mode === 'fill') return !o.fixed;
      if (R.mode === 'bridge') return !o.fixed && !R.phase;
      return R.mode === 'make' && (R.sub || !o.fixed);
    }
    const inBox = () => slots.filter(Boolean).length;
    const inTray = () => eggs.filter((o) => o.where === 'tray').length;
    const firstFree = (arr) => { for (let i = 0; i < arr.length; i++) if (!arr[i]) return i; return -1; };
    function seat(o, i) { o.where = 'box'; o.slot = i; slots[i] = o; }
    function toSlot(o, quiet) {
      const i = firstFree(slots);
      if (i < 0) { wiggle(o); home(o); if (!said.room) { said.room = 1; ctx.say(SAY.noRoom); } return false; }
      if (o.spot >= 0) { spots[o.spot] = null; o.spot = -1; }
      seat(o, i); const s = G.slot(i);
      fly(o, s.x, s.y).then(() => { setZ(o.node, 20 + s.row * 2); if (!quiet) { K.sfx.pop(); changed(o, true); } });
      return true;
    }
    function toTray(o, quiet, where) {
      const j = firstFree(spots);
      if (j < 0) { wiggle(o); home(o); return false; }
      if (o.slot >= 0) { slots[o.slot] = null; o.slot = -1; }
      o.where = where || 'tray'; o.spot = j; spots[j] = o; const s = G.spot(j);
      fly(o, s.x, s.y).then(() => { setZ(o.node, 30 + (land ? 0 : j >= 5 ? 1 : 0)); if (!quiet) { K.sfx.tone(360, 0.1, { to: 250, vol: 0.16 }); changed(o, false); } });
      return true;
    }
    function home(o) { const s = o.where === 'box' ? G.slot(o.slot) : G.spot(o.spot); fly(o, s.x, s.y, { lift: 20 }).then(() => setZ(o.node, o.where === 'box' ? 20 + s.row * 2 : 30)); }
    const toggle = (o) => (o.where === 'tray' ? toSlot(o) : toTray(o));
    function dropped(o) {
      const n = o.node, over = G.boxes.some((b) => Math.abs(n.x - b.x) < G.bw / 2 + 50 && Math.abs(n.y - b.y) < G.bh / 2 + 50);
      if (over === (o.where === 'box')) home(o); else if (over) toSlot(o); else toTray(o);
    }

    /* ---------- what the sum says right now ---------- */
    const moved = () => (R.sub ? R.start - inBox() : inBox() - R.a);
    function refresh() {
      const u = R.unit, c = INK[R.col];
      if (R.mode === 'fill') { const k = moved(); setSum(eq(R.a * u, '+', T(k * u, { c }), (R.a + k) * u)); }
      else if (R.mode === 'make') { const k = moved(), done = inBox() === R.T; setSum(eq(R.start * u, R.sub ? MINUS : '+', T(k > 0 ? k * u : '?', done ? { c } : { q: 1, c: k > 0 ? c : null }), R.T * u)); }
      else if (R.mode === 'bridge' && !R.phase) setSum(eq(R.a, '+', T(R.b, { c }), T('?', { q: 1 })));
    }
    function changed(o, into) {
      if (!R || R.over) return;
      const k = moved(); R.dwell = 0; refresh();
      K.sfx.step(Math.max(0, k - 1));
      const fullNow = R.nb === 2 && into && o.slot === 9 && slots.slice(0, 10).every(Boolean);
      if (fullNow) { R.glow = 1.2; const b = G.boxes[0]; ctx.fx.burst(b.x, b.y, { n: 10, color: A.C.marigold }); }
      if (R.unit === 1 && k >= 1 && k <= 10 && (into !== !!R.sub)) ctx.say(cnt(k) + (fullNow && R.mode === 'bridge' ? ' ' + SAY.full : ''));
      if (R.mode === 'make' && !R.warned && ((R.sub && inBox() < R.T) || (!R.sub && inBox() > R.T))) { R.warned = true; R.misses++; ctx.after(700, () => { if (R && !R.over) ctx.say(SAY.tooMany); }); }
    }

    /* ---------- number tiles (for "how many are left?") ---------- */
    function ask(answer, hint, onRight) {
      const set = [answer]; for (const v of K.shuffle([answer - 1, answer + 1, answer - 2, answer + 2])) if (v >= 0 && set.length < 3) set.push(v);
      const opts = K.shuffle(set), sp = land ? 190 : 172;
      R.answer = answer; R.tiles = opts.map((v, i) => {
        const n = add({ ui: true, z: 45, x: W / 2 + (i - 1) * sp, y: G.tilesY, sx: 0, sy: 0, hitR: 68, pad: 6, label: 'answer ' + v, v, dim: 0, pulse: false });
        n._bsx = n._bsy = 1; n.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back', delay: i * 0.09 });
        n.draw = (g, s) => {
          const k = n.pulse ? 1 + Math.sin(st.t * 7) * 0.07 : 1; g.scale(k, k);
          if (n.pulse) { g.beginPath(); g.arc(0, 0, 76, 0, 7); g.fillStyle = A.alpha(A.C.glow, 0.7 + Math.sin(st.t * 7) * 0.2); g.fill(); }
          g.globalAlpha *= 1 - n.dim * 0.55;
          g.beginPath(); A.blob(g, 0, 0, 64, 64, 0.025, 4 + i, 14); A.paper(g, s, '#FFFDF6', { box: { x: -64, y: -64, w: 128, h: 128 }, depth: 1.2 });
          g.beginPath(); g.arc(0, 0, 53, 0, 7); g.strokeStyle = A.alpha([A.C.tomato, A.C.teal, A.C.marigold][i], 0.8); g.lineWidth = 5; g.stroke();
          const t = String(v * R.unit); g.fillStyle = A.C.ink; g.font = `800 ${t.length > 2 ? 46 : 62}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 3);
        };
        n.onTap = () => {
          if (!R || R.over || R.busy || n.dim) return; touched = true;
          if (v === answer) { K.sfx.ding(); ctx.fx.burst(n.x, n.y, { n: 14 }); n.pulse = false; R.tiles.forEach((q) => { if (q !== n) q.to({ alpha: 0 }, { dur: 0.3 }); }); onRight(); return; }
          R.misses++; K.sfx.whoops(); n.dim = 1; n.rot = 0.22; n.to({ rot: 0 }, { dur: 0.6, ease: 'elastic' });
          hint(); if (R.misses >= 2) R.tiles.forEach((q) => { q.pulse = q.v === answer; });
        };
        return n;
      });
    }
    /** Pop a number over each egg in the box, one at a time. */
    function countUp(list, gapMs) {
      R.labels = R.labels || [];
      list.forEach((o, i) => ctx.after(i * gapMs, () => {
        if (!eggs.includes(o)) return;
        o.sq = -0.2; K.sfx.step(i);
        const n = add({ z: 58, x: o.node.x, y: o.node.y - G.size * 0.62, sx: 0, sy: 0, v: i + 1 });
        n.draw = (g, s) => { g.beginPath(); g.arc(0, 0, 21, 0, 7); A.paper(g, s, A.C.plum, { shadow: 0.6, grain: 0.1 }); g.fillStyle = '#FFFDF6'; g.font = `800 ${n.v > 9 ? 22 : 27}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n.v), 0, 1); };
        n.to({ sx: 1, sy: 1 }, { dur: 0.25, ease: 'back' }); R.labels.push(n);
      }));
      return ctx.wait(list.length * gapMs + 200);
    }
    const boxEggs = () => slots.filter(Boolean);

    /* ---------- nests (which one fills the box?) ---------- */
    function makeNests(vals) {
      const n = vals.length, bw = land ? Math.min(330, (W - 80) / 3 - 24) : (W - 36) / 3 - 10, bh = G.trayH - 6, cols = land ? 5 : 3;
      const one = Math.max(...vals) <= cols, pitch = (bw - 34) / cols, es = Math.min(pitch / 0.74, land ? (bh - 20) / (one ? 1.05 : 1.9) : one ? 84 : 62), rowH = es * (land ? 0.86 : 0.8);
      R.nests = vals.map((v, i) => {
        const b = add({ z: 28, x: W / 2 + (i - (n - 1) / 2) * (bw + (land ? 28 : 10)), y: G.trayY, sx: 0, sy: 0, hit: { x: -bw / 2, y: -bh / 2, w: bw, h: bh }, pad: 2, label: 'nest ' + v, v, left: v, shake: 0, pulse: false });
        b._bsx = b._bsy = 1; b.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: 0.15 + i * 0.1 });
        const rows = Math.ceil(v / cols);
        b.pos = (j) => { const r = Math.floor(j / cols), inRow = Math.min(cols, v - r * cols); return { x: ((j % cols) - (inRow - 1) / 2) * pitch, y: (r - (rows - 1) / 2) * rowH - 4 }; };
        b.es = es;
        const sp = A.sprite('tens-nest' + Math.round(bw) + 'x' + Math.round(bh) + i, [-bw / 2, -bh / 2, bw, bh], (g, s) => straw(g, s, bw, bh, 5 + i));
        b.draw = (g, s) => {
          const k = b.pulse ? 1 + Math.sin(st.t * 7) * 0.04 : 1; g.scale(k, k); g.rotate(Math.sin(b.shake * 30) * b.shake * 0.05);
          if (b.pulse) { g.beginPath(); g.ellipse(0, 0, bw / 2 + 10, bh / 2 + 10, 0, 0, 7); g.fillStyle = A.alpha(A.C.glow, 0.75); g.fill(); }
          put(g, sp);
          const item = itemSprite(R.col);
          for (let j = 0; j < b.left; j++) { const q = b.pos(j); g.save(); g.translate(q.x, q.y); g.rotate(Math.sin(st.t * 2 + j + i) * 0.04 + Math.sin(b.shake * 30 + j) * b.shake * 0.2); g.scale(es / 100, es / 100); put(g, item); g.restore(); }
          if (L >= 2) { g.save(); g.translate(bw / 2 - 26, -bh / 2 + 22); g.rotate(0.1); g.beginPath(); A.rect(g, -30, -24, 60, 48, 12, 3, 0.5); A.paper(g, s, '#FFFDF6', { shadow: 0.7, grain: 0.1 }); g.fillStyle = INK[R.col]; const t = String(v * R.unit); g.font = `800 ${t.length > 1 ? 30 : 36}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 2); g.restore(); }
        };
        b.update = (dt) => { b.shake = Math.max(0, b.shake - dt * 1.4); };
        b.onTap = () => pour(b);
        return b;
      });
    }
    async function pour(b) {
      if (!R || R.over || R.busy) return;
      touched = true; R.busy = true; const r = R, k = b.v, n = Math.min(k, r.need), sent = [];
      K.sfx.whoosh();
      for (let i = 0; i < n; i++) {
        const q = b.pos(b.left - 1); b.left--;
        const o = makeEgg(r.col, b.x + q.x, b.y + q.y, b.es / G.size); o.where = 'nest';
        o.node.to({ sx: 1, sy: 1 }, { dur: 0.3 }); sent.push(o);
        const idx = firstFree(slots); seat(o, idx); const s = G.slot(idx);
        fly(o, s.x, s.y, { dur: 0.36 }).then(() => { setZ(o.node, 20 + s.row * 2); K.sfx.step(i); K.sfx.pop(); });
        await ctx.wait(200);
      }
      await ctx.wait(480); if (R !== r) return;
      if (k === r.need) {
        setSum(eq(r.a * r.unit, '+', T(r.need * r.unit, { c: INK[r.col] }), r.cap * r.unit));
        r.nests.forEach((q) => { q.pulse = false; if (q !== b) q.to({ alpha: 0.35 }, { dur: 0.3 }); });
        r.glow = 1.4; ctx.say(SAY.full); win(); return;
      }
      r.misses++; K.sfx.whoops();
      if (k < r.need) { r.holes = 1.6; ctx.say(SAY.notFull + ' ' + SAY.tryNest); } else { b.shake = 1; ctx.say(SAY.tooMany + ' ' + SAY.tryNest); }
      await ctx.wait(1500); if (R !== r) return;
      for (const o of sent.reverse()) {
        slots[o.slot] = null; const q = b.pos(b.left);
        o.node.to({ sx: b.es / G.size, sy: b.es / G.size }, { dur: 0.3 });
        fly(o, b.x + q.x, b.y + q.y, { dur: 0.3 }).then(() => { b.left++; o.node.remove(); eggs.splice(eggs.indexOf(o), 1); });
        await ctx.wait(90);
      }
      await ctx.wait(360); if (R !== r) return;
      if (r.misses >= 2) r.nests.forEach((q) => { q.pulse = q.v === r.need; });
      r.busy = false;
    }

    /* ---------- rounds ---------- */
    const ri = K.randInt;
    function spec(kind) {
      const S = { kind, unit: 1, cap: 10, a: 0, need: 0, tray: 0, col: K.pick([1, 2]) };
      if (kind === 'fill5') { S.mode = 'fill'; S.cap = 5; S.a = ri(1, 4); }
      else if (kind === 'fill10') { S.mode = 'fill'; S.a = skill < 1 ? ri(5, 9) : ri(1, 9); }
      else if (kind === 'fill20') { S.mode = 'fill'; S.cap = 20; S.a = ri(11, 18); }
      else if (kind === 'tensFill') { S.mode = 'fill'; S.unit = 10; S.a = ri(1, 9); }
      else if (kind === 'nest5') { S.mode = 'nest'; S.cap = 5; S.a = ri(1, 4); S.n = skill < 2 ? 2 : 3; }
      else if (kind === 'nest10') { S.mode = 'nest'; S.a = ri(1, 9); S.n = 3; }
      else if (kind === 'nest20') { S.mode = 'nest'; S.cap = 20; S.a = ri(11, 18); S.n = 3; }
      else if (kind === 'tensNest') { S.mode = 'nest'; S.unit = 10; S.a = ri(1, 8); S.n = 3; }
      else if (kind === 'hop5') { S.mode = 'hop'; S.cap = 5; S.a = 5; S.out = ri(1, 4); }
      else if (kind === 'hop10') { S.mode = 'hop'; S.a = 10; S.out = ri(1, 9); }
      else if (kind === 'hop20') { S.mode = 'hop'; S.cap = 20; S.a = 20; S.out = ri(2, 9); }
      else if (kind === 'makeAdd') { S.mode = 'make'; if (skill >= 3) { S.cap = 20; S.a = ri(6, 13); S.T = S.a + ri(3, Math.min(9, 20 - S.a)); } else { S.a = ri(1, 7); S.T = ri(S.a + 1, 10); } S.tray = Math.min(10, S.T - S.a + ri(2, 3)); }
      else if (kind === 'tensMake') { S.mode = 'make'; S.unit = 10; S.a = ri(1, 6); S.T = ri(S.a + 2, 10); S.tray = Math.min(10, S.T - S.a + 2); }
      else if (kind === 'makeSub') { S.mode = 'make'; S.sub = true; S.a = ri(7, 10); S.T = ri(1, S.a - 1); }
      else { S.mode = 'bridge'; S.cap = 20; S.a = skill < 1 ? ri(8, 9) : ri(6, 9); S.b = ri(11 - S.a + (S.a === 9 ? 1 : 0), 9); S.tray = S.b; }
      if (S.mode === 'fill' || S.mode === 'nest') { S.need = S.cap - S.a; if (S.mode === 'fill') S.tray = Math.min(10, S.need + ri(1, 2)); }
      if (S.mode === 'nest') {
        const lim = S.cap === 5 ? 5 : 10, pool = [S.need - 1, S.need + 1, S.need - 2, S.need + 2].filter((v) => v >= 1 && v <= lim);
        S.opts = K.shuffle([S.need].concat(K.shuffle(pool.slice(0, 2)).concat(pool.slice(2)).slice(0, S.n - 1)));
      }
      S.key = kind + '/' + S.a + '/' + (S.need || S.out || S.T || S.b);
      S.start = S.a; S.nb = S.cap > 10 ? 2 : 1;
      return S;
    }
    function kinds() {
      if (L === 1) return skill < 1 ? ['fill5'] : skill < 2 ? ['fill5', 'nest5'] : ['fill5', 'nest5', 'nest5', 'hop5'];
      if (L === 2) return skill < 1 ? ['fill10'] : skill < 2 ? ['fill10', 'hop10', 'nest10'] : ['fill10', 'nest10', 'nest10', 'hop10', 'hop10'];
      return skill < 1 ? ['bridge', 'nest10'] : skill < 2 ? ['bridge', 'fill20', 'makeAdd'] : skill < 3 ? ['bridge', 'nest20', 'tensFill', 'makeAdd', 'makeSub'] : ['bridge', 'nest20', 'tensNest', 'tensMake', 'makeSub', 'makeAdd', 'hop20'];
    }
    function clear() {
      for (const n of scene) n.remove(); scene.length = 0; eggs.length = 0;
    }
    function newRound(force) {
      let S, guard = 0; const list = kinds();
      do { let kind = force || (roundNo === 0 ? list[0] : K.pick(list)); if (!force && kind === lastKind && list.length > 1 && guard < 12) { guard++; continue; } S = spec(kind); } while ((!S || S.key === lastKey) && guard++ < 30);
      clear(); lastKey = S.key; lastKind = S.kind; roundNo++;
      R = S; R.over = false; R.busy = true; R.misses = 0; R.dwell = 0; R.phase = 0; R.glow = 0; R.holes = 0; R.tiles = null; R.nests = null; R.labels = null;
      G = layout(R.cap, R.mode === 'hop' || R.mode === 'bridge', R.mode === 'bridge'); sum.y = G.sumY; chicks.y = G.chickY;
      slots = new Array(R.cap).fill(null); spots = new Array(10).fill(null);
      const key = Math.round(G.p * 10) + 'r' + G.rows;
      // the egg box: the back, then one front lip for each row so the eggs sit down inside
      G.boxes.forEach((b, bi) => {
        const base = add({ z: 10, x: b.x, y: b.y, sx: 0.6, sy: 0.6, alpha: 0, sprite: A.sprite('tens-box' + key, [-G.bw / 2, -G.bh / 2, G.bw, G.bh], (g, s) => boxBase(g, s, G.bw, G.bh, G.p, G.rows)) });
        base.to({ sx: 1, sy: 1, alpha: 1 }, { dur: 0.35, ease: 'back', delay: bi * 0.08 });
        for (let r = 0; r < G.rows; r++) {
          const last = r === G.rows - 1, f = add({ z: 21 + r * 2, x: b.x, y: b.y + (r - (G.rows - 1) / 2) * G.p - 6, alpha: 0, sprite: A.sprite('tens-front' + key + (last ? 'L' : ''), [-G.bw / 2, 0, G.bw, G.p * 0.5 + 20], (g, s) => boxFront(g, s, G.bw, G.p, last)) });
          f.to({ alpha: 1 }, { dur: 0.2, delay: 0.2 + bi * 0.08 });
        }
      });
      // glow, empty-cup rings and the little count tags
      add({ z: 26, draw(g, s) {
        if (!R) return;
        if (R.glow > 0) for (const b of G.boxes.slice(0, R.mode === 'bridge' && !R.over ? 1 : 9)) { g.save(); g.globalAlpha = Math.min(1, R.glow) * (0.6 + Math.sin(st.t * 12) * 0.3); g.lineWidth = 9; g.strokeStyle = A.C.glow; g.beginPath(); A.rect(g, b.x - G.bw / 2 - 6, b.y - G.bh / 2 - 6, G.bw + 12, G.bh + 12, 30, 4, 0.5); g.stroke(); g.restore(); }
        if (R.holes > 0) for (let i = 0; i < slots.length; i++) if (!slots[i]) { const q = G.slot(i); g.beginPath(); g.ellipse(q.x, q.y + G.p * 0.2, G.p * 0.36, G.p * 0.25, 0, 0, 7); g.strokeStyle = A.alpha('#FFF6C8', Math.min(1, R.holes) * (0.6 + Math.sin(st.t * 10) * 0.4)); g.lineWidth = 6; g.stroke(); }
        if (R.nb === 2 && R.unit === 1 && (R.mode !== 'bridge' || R.phase)) G.boxes.forEach((b, bi) => {
          const c = slots.slice(bi * 10, bi * 10 + 10).filter(Boolean).length; if (!c) return;
          g.save(); g.translate(b.x + G.bw / 2 - 26, b.y + G.bh / 2 - 12); g.rotate(-0.07);
          g.beginPath(); A.rect(g, -30, -25, 60, 50, 13, 3, 0.5); A.paper(g, s, c === 10 ? A.C.marigold : '#FFFDF6', { shadow: 0.7, grain: 0.1 });
          g.fillStyle = A.C.ink; g.font = `800 34px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(c), 0, 2); g.restore();
        });
      }, update(dt) { if (R) { R.glow = Math.max(0, R.glow - dt); R.holes = Math.max(0, R.holes - dt); } } });
      for (let i = 0; i < R.a; i++) { const q = G.slot(i), o = makeEgg(0, q.x, q.y); o.fixed = true; seat(o, i); o.node.z = 20 + q.row * 2; }
      // loose eggs wait in a straw nest
      if (R.mode !== 'nest') {
        const tw = G.trayW, th = G.trayH;
        const tray = add({ z: 8, x: W / 2, y: G.trayY + 8, alpha: 0, sprite: A.sprite('tens-tray' + Math.round(tw) + 'x' + Math.round(th), [-tw / 2, -th / 2, tw, th], (g, s) => straw(g, s, tw, th, 3)) });
        tray.to({ alpha: 1 }, { dur: 0.3 });
        for (let j = 0; j < R.tray; j++) { const q = G.spot(j), o = makeEgg(R.col, q.x, q.y); o.spot = j; spots[j] = o; o.node.z = 30 + (land ? 0 : j >= 5 ? 1 : 0); o.node.label = R.unit === 10 ? 'box of ten' : 'egg'; }
      } else makeNests(R.opts);
      st.root._sorted = false;
      K.sfx.whoosh();
      const u = R.unit, first = (k) => { if (said[k]) return false; said[k] = 1; return true; };
      const tens = u === 10 && first('tens') ? SAY.tens + ' ' : '';
      if (R.mode === 'fill') { refresh(); ctx.prompt(tens + SAY.fill + (first('how') ? ' ' + SAY.how : '')); R.busy = false; }
      else if (R.mode === 'nest') { setSum(eq(R.a * u, '+', T('?', { q: 1 }), R.cap * u)); ctx.prompt(tens + SAY.nest); R.busy = false; }
      else if (R.mode === 'make') { refresh(); if (R.sub) eggs.forEach((o) => { o.node.label = 'egg'; }); ctx.prompt(tens + SAY.make + (first('makeHow') ? ' ' + SAY.makeHow : '')); R.busy = false; }
      else if (R.mode === 'bridge') { refresh(); ctx.prompt(SAY.bridge + (first('how') ? ' ' + SAY.how : '')); R.busy = false; }
      else hopOut(R);
    }
    async function hopOut(r) {
      setSum([T(r.cap)]);
      await ctx.wait(1300); if (R !== r) return;
      ctx.prompt(SAY.hop + ' ' + SAY.left);
      for (let i = 0; i < r.out; i++) {
        const o = slots[r.cap - 1 - i]; o.fixed = false; toTray(o, true, 'out'); K.sfx.tone(420, 0.14, { to: 760, type: 'sine', vol: 0.2 });
        setSum(eq(r.cap, MINUS, T(i + 1, { c: INK[r.col] }), T('?', { q: 1 })));
        await ctx.wait(300); if (R !== r) return;
      }
      await ctx.wait(350); if (R !== r) return;
      const left = r.cap - r.out;
      ask(left, () => { ctx.say(SAY.countBox); if (!r.labels) countUp(boxEggs(), 260); }, () => { setSum(eq(r.cap, MINUS, T(r.out, { c: INK[r.col] }), T(left, { c: A.C.teal }))); win(); });
      r.busy = false;
    }
    async function fullBox(r) {                       // a fill round is done: look again at what went in
      r.over = true; r.glow = 1.6; K.sfx.ding();
      const mine = boxEggs().filter((o) => !o.fixed);
      ctx.fx.burst(G.boxes[r.nb - 1].x, G.boxes[r.nb - 1].y, { n: 14 });
      if (L < 3 && r.unit === 1) {
        await Promise.all([ctx.say(SAY.full + ' ' + SAY.howAdd), ctx.wait(1900)]); if (R !== r) return;
        await countUp(mine, 330); if (R !== r) return;
        sum.pop = 1; ctx.say(cnt(r.need));
      } else ctx.say(SAY.full);
      win();
    }
    async function bridged(r) {                       // every egg is in: ten and some more
      r.phase = 1; r.busy = true; const total = r.a + r.b, rest = total - 10;
      setSum(eq(r.a, '+', T(r.b, { c: INK[r.col] }), T('?', { q: 1 })), eq(T(10, { c: A.C.marigold }), '+', rest, T('?', { q: 1 })));
      ctx.prompt(SAY.now); await ctx.wait(500); if (R !== r) return;
      ask(total, () => ctx.say(SAY.tenMore), () => { setSum(eq(r.a, '+', T(r.b, { c: INK[r.col] }), T(total, { c: A.C.teal })), eq(T(10, { c: A.C.marigold }), '+', rest, T(total, { c: A.C.teal }))); r.glow = 1.4; win(); });
      r.busy = false;
    }
    async function win() {
      const r = R; r.over = true; r.busy = true;
      eggs.forEach((o) => { o.pulse = false; });
      ctx.after(200, () => K.sfx.sparkle());
      skill = K.clamp(skill + (r.misses ? -0.5 : 0.5), 0, 4);
      await ctx.wait(1900); if (R !== r) return;
      won++; chicks.pop = 1; K.sfx.ding(); const cp = st.toScreen(chicks, (won - 1) * 76, 0); ctx.fx.burst(cp.x, cp.y, { n: 8, color: A.C.marigold });
      await ctx.wait(800); if (R !== r) return;
      if (won >= SET) { await ctx.celebrate({ ms: 3400 }); if (R !== r) return; won = 0; }
      newRound();
    }

    /* ---------- watching for the goal ---------- */
    st.onframe = (dt) => {
      if (!R || R.over || R.busy) return;
      if (eggs.some((o) => o.fly || o.grab)) { R.dwell = 0; return; }
      const c = inBox();
      const ok = R.mode === 'fill' ? c === R.cap : R.mode === 'make' ? c === R.T : R.mode === 'bridge' ? !R.phase && inTray() === 0 : false;
      if (!ok) { R.dwell = 0; return; }
      R.dwell += dt;
      if (R.dwell < (R.mode === 'make' ? 0.9 : 0.45)) return;
      if (R.mode === 'fill') fullBox(R);
      else if (R.mode === 'bridge') bridged(R);
      else { refresh(); sum.pop = 1; K.sfx.ding(); R.glow = 1.2; ctx.fx.burst(W / 2, G.boxes[0].y, { n: 14 }); win(); }
    };

    /* ---------- a paper hand shows the first move ---------- */
    const hand = st.add({ ui: true, z: 80, visible: false, k: 0 });
    hand.draw = (g, s) => { g.scale(0.8, 0.8); A.hand(g, s, hand.k < 0.15 || hand.k > 0.85 ? 1 : 0.4); };
    hand.update = (dt) => {
      const show = !touched && roundNo === 1 && R && !R.busy && !R.over && st.t > 3.5 && R.mode !== 'hop' && R.mode !== 'nest';
      hand.visible = !!show; if (!show) return;
      hand.k = (hand.k + dt / 2.2) % 1;
      let from, to;
      { const o = eggs.find((q) => q.where === 'tray'), i = firstFree(slots); if (!o || i < 0) { hand.visible = false; return; } from = { x: o.node.x, y: o.node.y }; to = G.slot(i); }
      const e = K.clamp((hand.k - 0.15) / 0.6, 0, 1), m = e * e * (3 - 2 * e);
      hand.x = from.x + (to.x - from.x) * m + 6; hand.y = from.y + (to.y - from.y) * m + 10;
    };

    K._tens = {                                          // for browser tests
      get R() { return R; }, get G() { return G; }, eggs, get slots() { return slots; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      get sum() { return sum.a.map((t) => t.t).join(' ') + (sum.b ? ' | ' + sum.b.map((t) => t.t).join(' ') : ''); },
      next: (kind) => newRound(kind), inBox, inTray,
    };
    ctx.onExit(() => { st.onframe = null; K._tens = null; });
    ctx.after(350, () => newRound());
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#F6E7CB'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#9CCBC0'; g.beginPath(); g.moveTo(0, 96 * u); for (let i = 0; i <= 6; i++) g.quadraticCurveTo((i * 50 - 25) * u, 82 * u, i * 50 * u, 96 * u); g.lineTo(w, w); g.lineTo(0, w); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; for (let x = 20; x < 300; x += 80) g.fillRect(x * u, 90 * u, 40 * u, w);
    const p = 50 * u, x0 = 50 * u, y0 = 150 * u;
    g.save(); g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 12 * u; g.shadowOffsetY = 6 * u;
    g.fillStyle = '#D7B286'; g.beginPath(); g.roundRect(x0 - 36 * u, y0 - 38 * u, 272 * u, 140 * u, 20 * u); g.fill(); g.restore();
    g.fillStyle = '#B58E60'; g.beginPath(); g.roundRect(x0 - 28 * u, y0 - 30 * u, 256 * u, 124 * u, 14 * u); g.fill();
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const x = x0 + c * p, y = y0 + r * p * 1.08, i = r * 5 + c;
        g.fillStyle = '#8F6C47'; g.beginPath(); g.ellipse(x, y + 14 * u, 19 * u, 12 * u, 0, 0, 7); g.fill();
        if (i >= 8) continue;
        if (PIC.egg) g.drawImage(i < 6 ? PIC.egg : eggImage(2), x - 17 * u, y - 28 * u, 34 * u, 49 * u);
        else { g.fillStyle = i < 6 ? PAPER[0] : PAPER[2]; g.beginPath(); g.ellipse(x, y - 4 * u, 16 * u, 22 * u, 0, 0, 7); g.fill(); }
      }
      g.fillStyle = '#E7CA9E'; g.beginPath(); g.roundRect(x0 - 32 * u, y0 + r * p * 1.08 + 14 * u, 264 * u, (r ? 30 : 16) * u, 8 * u); g.fill();
    }
    for (let i = 0; i < 2; i++) {
      const x = (112 + i * 76) * u, y = 52 * u;
      if (PIC.egg) g.drawImage(eggImage(2), x - 22 * u, y - 32 * u, 44 * u, 63 * u);
      else { g.fillStyle = PAPER[2]; g.beginPath(); g.ellipse(x, y, 20 * u, 27 * u, 0, 0, 7); g.fill(); }
    }
  }

  K.game({ id: ID, title: 'Make Ten', voice: ID, group: 'arcade', age: 5, subject: 'math', order: 29, icon, start, lines, resize: () => K.go(ID) });
})();
