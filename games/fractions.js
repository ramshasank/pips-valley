/* Pizza Party — fractions by cutting and sharing.
   A pizza on a board, a cutter dial (2, 3, 4, 6, 8 ...) and hungry animal friends with plates.
   Tap a number and the pizza is cut into that many equal pieces; drag the pieces onto the plates
   (or tap a piece, then a friend). The bell is the child's "I am ready".
   Level 1: share the pizza fairly between two, three or four friends; spot the pizza with equal pieces.
   Level 2: make one half, one third, one quarter, three quarters ... for a friend; the written fraction
            stands beside the plate; two friends compare their pieces (who has more?).
   Level 3: cover a shape with smaller pieces (2/4 covers 1/2), add fractions with the same bottom number
            on a chocolate bar, share olives over the slices (a quarter of 12), and cut a ribbon to put a
            friend on a number line from 0 to 1.
   Nothing can be lost: a wrong try wobbles and gets a hint, after two the helpful number or shape glows. */
(function () {
  'use strict';
  const A = K.art, E = K.engine;
  const num = (n) => K.numWord(n), TAU = Math.PI * 2;
  const FR = { '1/2': 'one half', '1/3': 'one third', '1/4': 'one quarter', '1/6': 'one sixth', '1/8': 'one eighth', '2/3': 'two thirds', '3/4': 'three quarters', '3/8': 'three eighths', '5/8': 'five eighths', '5/6': 'five sixths' };
  const T = {
    share: (f) => `Share the pizza fairly between ${num(f)} friends.`,
    cut: 'Tap a number to cut it up.', drag: 'Drag the pieces to your friends.', bell: 'Ring the bell when you are ready.',
    unfair: 'That is not fair yet.', same: 'Give everyone the same.', left: 'There is still some left.', moreCuts: 'Try cutting it into more pieces.',
    pick: 'Which pizza has equal pieces?', notSame: 'Those pieces are not the same size.', equal: 'Equal pieces are all the same size.',
    give: (name) => `Give your friend ${name}.`,
    much: 'That is too much.', few: 'That is not enough.', bottom: 'The bottom number says how many pieces to cut.', top: 'The top number says how many to give.',
    compare: 'Who has more?', beside: 'Lay them side by side.', bigger: 'The bigger piece is more.',
    equiv: 'Cover the shape on the plate.', cover: 'They cover the same!',
    add: 'Add them up on the plate.',
    set: 'Share the olives fairly on the pizza.', olive: 'Tap a piece to add an olive.', every: 'Every piece needs the same.', look: 'Look at one piece.',
    ribbon: 'Cut the ribbon into equal parts.', line: 'Put your friend on the right mark.', parts: 'Count the parts from zero.',
    yum: 'Yum! Thank you!',
  };
  function lines() {
    const out = [T.share(2), T.share(3), T.share(4)];
    for (const k in FR) out.push(T.give(FR[k]));
    for (const k in T) if (typeof T[k] === 'string') out.push(T[k]);
    return out;
  }

  /* ---------------- pictures ---------------- */
  const FACES = ['cat', 'chick', 'dog', 'hedgehog', 'lion', 'mouse', 'owl', 'panda', 'pig'];
  const FCOL = { cat: '#A89A90', chick: '#F2CF4A', dog: '#C99A66', hedgehog: '#B58E6C', lion: '#F0B24E', mouse: '#B9B4BE', owl: '#A77B5A', panda: '#F4F1EA', pig: '#F4B4B0' };
  const IM = {};
  for (const f of FACES) for (const v of [f, f + '-shut']) { const im = new Image(); im.onload = () => { IM[v] = im; }; im.src = 'img/faces/' + v + '.webp'; }
  function drawFace(g, name, r, shut) {
    const im = IM[shut ? name + '-shut' : name] || IM[name];
    if (im) { const k = (r * 2.1) / Math.max(im.width, im.height); g.drawImage(im, -im.width * k / 2, -im.height * k / 2, im.width * k, im.height * k); return; }
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = FCOL[name]; g.fill();
    g.fillStyle = '#2E2A3B'; if (!shut) { g.beginPath(); g.arc(-r * 0.34, -r * 0.1, r * 0.1, 0, 7); g.arc(r * 0.34, -r * 0.1, r * 0.1, 0, 7); g.fill(); }
    g.lineWidth = r * 0.07; g.strokeStyle = '#2E2A3B'; g.lineCap = 'round'; g.beginPath(); g.arc(0, r * 0.14, r * 0.26, 0.3, Math.PI - 0.3); g.stroke();
  }
  const put = (g, sp, x, y, k) => { k = k == null ? 1 : k; g.drawImage(sp.canvas, x - sp.ox * k, y - sp.oy * k, sp.w * k, sp.h * k); };
  function text(g, t, x, y, size, col, o) {
    o = o || {}; g.font = `700 ${size}px ${o.font || A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(t, x, y);
  }
  /** Draw a row of numbers, signs, words and stacked fractions ([top, bottom]) centred on (x, y). */
  function expr(g, toks, x, y, size, col, maxW, hot) {
    const f = (z, body) => `700 ${z}px ${body ? A.FONT_BODY : A.FONT_TITLE}`, isW = (t) => typeof t === 'string' && /^[a-z]/.test(t);
    const ws = toks.map((t) => { if (Array.isArray(t)) { g.font = f(size * 0.6); return Math.max(g.measureText(String(t[0])).width, g.measureText(String(t[1])).width) + size * 0.2; } g.font = f(isW(t) ? size * 0.55 : size, isW(t)); return g.measureText(String(t)).width; });
    const gap = size * 0.24, tot = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1), k = maxW && tot > maxW ? maxW / tot : 1;
    g.save(); g.translate(x, y); g.scale(k, k); let cx = -tot / 2;
    toks.forEach((t, i) => {
      const mx = cx + ws[i] / 2, c = hot && hot === i ? A.C.tomato : col;
      if (Array.isArray(t)) { text(g, String(t[0]), mx, -size * 0.34, size * 0.6, c); text(g, String(t[1]), mx, size * 0.38, size * 0.6, c); g.fillStyle = c; g.beginPath(); g.roundRect(cx + size * 0.03, -size * 0.035, ws[i] - size * 0.06, size * 0.07, size * 0.035); g.fill(); }
      else text(g, String(t), mx, isW(t) ? size * 0.04 : 0, isW(t) ? size * 0.55 : size, c, { font: isW(t) ? A.FONT_BODY : null });
      cx += ws[i] + gap;
    });
    g.restore(); return tot * k;
  }
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  /* ---------------- drawn food ---------------- */
  const TOPS = ['pepperoni', 'mushroom', 'pepper', 'olive', 'basil'];
  /** A whole pizza painted once into its own bitmap (the slices are cut out of it every frame). */
  function makePizza(R, res, seed, plain) {
    const pad = 8, c = document.createElement('canvas'); c.width = c.height = Math.ceil((R + pad) * 2 * res);
    const g = c.getContext('2d'); g.setTransform(res, 0, 0, res, (R + pad) * res, (R + pad) * res);
    const rnd = A.rng(seed), box = { x: -R, y: -R, w: R * 2, h: R * 2 };
    g.beginPath(); A.blob(g, 0, 0, R, R, 0.012, seed, 22); A.paper(g, res, '#E2A85A', { shadow: 0, light: 0.08, box });
    for (let i = 0; i < 16; i++) { const a = rnd() * TAU; g.beginPath(); g.ellipse(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, R * 0.05, R * 0.025, a + 1.57, 0, 7); g.fillStyle = 'rgba(150,90,40,.28)'; g.fill(); }
    g.beginPath(); A.blob(g, 0, 0, R * 0.88, R * 0.88, 0.02, seed + 1, 18); g.fillStyle = '#D9553B'; g.fill();
    g.beginPath(); A.blob(g, 0, 0, R * 0.84, R * 0.84, 0.035, seed + 2, 16); A.paper(g, res, '#F6D878', { shadow: 0, light: 0.07, grain: 0.3, box });
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = rnd() * R * 0.7; g.beginPath(); A.blob(g, Math.cos(a) * d, Math.sin(a) * d, R * (0.07 + rnd() * 0.07), R * (0.05 + rnd() * 0.05), 0.2, i + seed); g.fillStyle = 'rgba(255,246,200,.5)'; g.fill(); }
    if (plain) return c;
    const kinds = K.shuffle(TOPS).slice(0, 2 + Math.floor(rnd() * 2)), spots = [];
    for (let i = 0, tries = 0; i < 20 && tries < 400; tries++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.72, x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (spots.some((p) => Math.hypot(p[0] - x, p[1] - y) < R * 0.24)) continue;
      spots.push([x, y]); const kind = kinds[i % kinds.length], r = R * 0.1; i++;
      g.save(); g.translate(x, y); g.rotate(rnd() * TAU);
      g.shadowColor = 'rgba(90,50,20,.3)'; g.shadowBlur = 3 * res; g.shadowOffsetY = 2 * res;
      if (kind === 'pepperoni') { g.beginPath(); g.arc(0, 0, r * 1.05, 0, 7); g.fillStyle = '#C8402F'; g.fill(); g.shadowColor = 'transparent'; g.fillStyle = '#A8301F'; for (const [px, py] of [[-0.4, -0.3], [0.35, 0.1], [-0.1, 0.5]]) { g.beginPath(); g.arc(px * r, py * r, r * 0.16, 0, 7); g.fill(); } }
      else if (kind === 'olive') { g.beginPath(); g.arc(0, 0, r * 0.62, 0, 7); g.fillStyle = '#3B3A45'; g.fill(); g.shadowColor = 'transparent'; g.beginPath(); g.arc(0, 0, r * 0.26, 0, 7); g.fillStyle = '#F6D878'; g.fill(); }
      else if (kind === 'basil') { g.beginPath(); g.ellipse(0, 0, r * 1.15, r * 0.6, 0, 0, 7); g.fillStyle = '#5E9E57'; g.fill(); g.shadowColor = 'transparent'; A.line(g, 'rgba(40,90,50,.6)', 2, (h) => { h.moveTo(-r, 0); h.lineTo(r, 0); }); }
      else if (kind === 'pepper') { g.lineWidth = r * 0.36; g.strokeStyle = '#6FA860'; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, r * 0.7, 0.4, Math.PI * 1.5); g.stroke(); }
      else { g.beginPath(); g.arc(0, -r * 0.15, r * 0.8, Math.PI, 0); g.closePath(); g.fillStyle = '#EADBC4'; g.fill(); g.beginPath(); g.roundRect(-r * 0.22, -r * 0.2, r * 0.44, r * 0.9, r * 0.2); g.fill(); }
      g.restore();
    }
    return c;
  }
  function olive(g, r) { g.beginPath(); g.arc(1.5, 2.5, r, 0, 7); g.fillStyle = 'rgba(46,40,70,.25)'; g.fill(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = '#3F4A34'; g.fill(); g.beginPath(); g.arc(-r * 0.1, -r * 0.1, r * 0.42, 0, 7); g.fillStyle = '#D9553B'; g.fill(); g.beginPath(); g.arc(-r * 0.4, -r * 0.45, r * 0.16, 0, 7); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill(); }
  const plateSp = (r) => A.sprite('pz-plate-' + Math.round(r), [-r - 4, -r - 4, r * 2 + 8, r * 2 + 8], (g, s) => {
    g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, '#FBF8F1', { box: { x: -r, y: -r, w: r * 2, h: r * 2 }, grain: 0.12 });
    g.beginPath(); g.arc(0, 0, r * 0.8, 0, 7); g.lineWidth = Math.max(2, r * 0.03); g.strokeStyle = A.alpha(A.C.blue, 0.4); g.stroke();
    g.beginPath(); g.arc(0, 0, r * 0.93, 0, 7); g.lineWidth = Math.max(2, r * 0.025); g.setLineDash([r * 0.05, r * 0.09]); g.strokeStyle = A.alpha(A.C.tomato, 0.5); g.stroke();
  });
  const traySp = (w, h) => A.sprite(`pz-tray-${Math.round(w)}x${Math.round(h)}`, [-w / 2 - 4, -h / 2 - 4, w + 8, h + 8], (g, s) => {
    g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, h * 0.22, 3, 1); A.paper(g, s, '#FBF8F1', { box: { x: -w / 2, y: -h / 2, w, h }, grain: 0.12 });
    g.beginPath(); A.rect(g, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, h * 0.16, 4, 0.5); g.lineWidth = 3; g.setLineDash([6, 9]); g.strokeStyle = A.alpha(A.C.tomato, 0.5); g.stroke();
  });
  const boardSp = (R) => A.sprite('pz-board-' + Math.round(R), [-R - 40, -R - 40, R * 2 + 130, R * 2 + 80], (g, s) => {
    g.beginPath(); A.rect(g, R * 0.7, -24, R * 0.62, 48, 22, 5, 1); A.paper(g, s, '#C99A66', { box: { x: R, y: -24, w: 80, h: 48 } });
    g.beginPath(); g.arc(R + R * 0.2, 0, 9, 0, 7); g.fillStyle = 'rgba(90,60,40,.45)'; g.fill();
    g.beginPath(); A.blob(g, 0, 0, R + 26, R + 26, 0.008, 4, 24); A.paper(g, s, '#D6A671', { depth: 1.3, box: { x: -R - 26, y: -R - 26, w: R * 2 + 52, h: R * 2 + 52 } });
    A.line(g, 'rgba(120,80,45,.22)', 3, (h) => { for (const q of [-0.6, -0.2, 0.25, 0.62]) { const y = q * (R + 20), x = Math.sqrt(Math.max(0, (R + 20) * (R + 20) - y * y)); h.moveTo(-x, y); h.bezierCurveTo(-x / 3, y - 7, x / 3, y + 7, x, y); } });
  });
  function backdrop(W, H) {
    return A.sprite(`pz-bg-${Math.round(W)}x${Math.round(H)}`, [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#8CBB6C', { shadow: 0, grain: 0.3, light: 0.03, box: { x: 0, y: 0, w: W, h: H } });
      const m = 16; g.beginPath(); A.rect(g, m, m, W - m * 2, H - m * 2, 38, 3, 3); A.paper(g, s, '#F8EEDC', { box: { x: m, y: m, w: W - m * 2, h: H - m * 2 }, grain: 0.26 });
      g.save(); g.beginPath(); A.rect(g, m, m, W - m * 2, H - m * 2, 38, 3, 3); g.clip();
      const step = 92; g.fillStyle = A.alpha(A.C.tomato, 0.1);
      for (let x = m + 30; x < W; x += step) g.fillRect(x, 0, step * 0.42, H);
      for (let y = m + 30; y < H; y += step) g.fillRect(0, y, W, step * 0.42);
      g.restore();
      // party bunting across the top
      const y0 = 112, sag = 26, n = Math.round(W / 74), cols = [A.C.tomato, A.C.marigold, A.C.teal, A.C.blue, A.C.plum, A.C.leaf];
      const at = (t) => [t * W, y0 + Math.sin(t * Math.PI) * sag];
      A.line(g, A.alpha(A.C.ink, 0.5), 3, (h) => { h.moveTo(0, y0); for (let i = 1; i <= 30; i++) { const p = at(i / 30); h.lineTo(p[0], p[1]); } });
      for (let i = 0; i < n; i++) { const p = at((i + 0.5) / n); g.beginPath(); A.cut(g, [[p[0] - 20, p[1] + 1], [p[0] + 20, p[1] + 1], [p[0], p[1] + 44]], 4, 1, i + 2); A.paper(g, s, cols[i % cols.length], { shadow: 0.5, box: { x: p[0] - 20, y: p[1], w: 40, h: 44 } }); }
    });
  }
  const disc = () => A.sprite('pz-disc', [-64, -64, 128, 128], (g, s) => { g.beginPath(); g.arc(0, 0, 60, 0, 7); A.paper(g, s, '#FFF9EA', { depth: 1.2, box: { x: -60, y: -60, w: 120, h: 120 } }); });
  function bellIcon(g) {
    g.fillStyle = A.C.marigold; g.beginPath(); g.moveTo(-28, 16); g.quadraticCurveTo(-24, -30, 0, -30); g.quadraticCurveTo(24, -30, 28, 16); g.closePath(); g.fill();
    g.beginPath(); A.rect(g, -34, 14, 68, 10, 5, 2, 0); g.fillStyle = A.shade(A.C.marigold, -0.1); g.fill();
    g.beginPath(); g.arc(0, 30, 7, 0, 7); g.fillStyle = A.C.bark; g.fill(); g.beginPath(); g.arc(0, -33, 6, 0, 7); g.fill();
    A.line(g, 'rgba(255,255,255,.6)', 5, (h) => { h.arc(0, -4, 18, Math.PI * 1.1, Math.PI * 1.45); });
  }

  function start(st, ctx) {
    const W = st.W, H = st.H, land = W >= 1150, level = ctx.level;
    /* ---------- layout ---------- */
    const G = { land };
    if (land) {
      G.R = 212; G.px = Math.max(470, W * 0.36 + 20); G.py = 606; G.card = { x: G.px, y: 244, w: 420, h: 156 };
      const ax = G.px + G.R + 78; G.area = { x: ax, y: 150, w: W - 44 - ax, h: 660 };
      G.bell = { x: ax + (W - 44 - ax) / 2, y: 894, r: 60 }; G.lab = { x: G.px, y: 902, size: 84 }; G.dial = { r: 50 };
    } else {
      G.card = { x: W / 2, y: 206, w: Math.min(340, W - 220), h: 116 }; G.area = { x: 22, y: 276, w: W - 44, h: 262 };
      G.R = K.clamp((H - 538 - 44 - 334) / 2, 96, 168); G.px = W * 0.4; G.py = 538 + 44 + G.R;
      G.bell = { x: W - 76, y: G.py + G.R * 0.45, r: 54 }; G.lab = { x: W / 2, y: G.py, size: 78 }; G.dial = { r: 52 };
    }
    const R0 = G.R, BW = R0 * 2, BH = R0 * 0.56;
    st.add({ z: 0, sprite: backdrop(W, H) });
    const board = st.add({ z: 2, x: G.px, y: G.py, sprite: boardSp(R0) });
    const foil = st.add({ z: 2, x: G.px, y: G.py, visible: false, sprite: A.sprite('pz-foil-' + Math.round(R0), [-BW / 2 - 34, -BH / 2 - 30, BW + 68, BH + 60], (g, s) => {
      g.beginPath(); A.cut(g, [[-BW / 2 - 30, -BH / 2 - 22], [BW / 2 + 26, -BH / 2 - 28], [BW / 2 + 32, BH / 2 + 24], [-BW / 2 - 24, BH / 2 + 28]], 10, 3, 5); A.paper(g, s, '#F0D9A0', { box: { x: -BW / 2, y: -BH / 2, w: BW, h: BH }, light: 0.1 });
      A.line(g, 'rgba(255,255,255,.7)', 3, (h) => { for (let i = 0; i < 7; i++) { const x = -BW / 2 + (i + 0.5) * BW / 7; h.moveTo(x - 12, -BH / 2 - 18); h.lineTo(x + 8, -BH / 2 - 6); h.moveTo(x + 10, BH / 2 + 8); h.lineTo(x - 8, BH / 2 + 20); } });
    }) });

    /* ---------- state ---------- */
    let R = null, won = 0, skill = 0, played = 0, prevKey = '', lastAct = 0, bag = [], pizza = null, sel = null, toldBell = false, cutT = -9;
    let slices = [], friends = [], dials = [], extra = [], olives = [];
    const building = () => R && R.phase === 'build';
    const base = (i, n) => -Math.PI / 2 + (i * TAU) / n;
    const front = (n, z) => { n.z = z; st.root._sorted = false; };

    /* ---------- pieces of pizza or chocolate ---------- */
    function wedge(g, n, r) { g.beginPath(); if (n <= 1) g.arc(0, 0, r, 0, TAU); else { g.moveTo(0, 0); g.arc(0, 0, r, 0, TAU / n); g.closePath(); } }
    function drawPiece(g, sl) {
      const n = sl.n, lift = sl.lift || (sl === sel ? 1 : 0);
      if (sl === sel) { const q = 1.07 + Math.sin(st.t * 7) * 0.02; g.scale(q, q); }
      if (R.food === 'bar') {
        const w = BW / n;
        g.beginPath(); g.roundRect(3, -BH / 2 + 6, w, BH, 7); g.fillStyle = 'rgba(46,40,70,.24)'; g.fill();
        g.beginPath(); g.roundRect(0.8, -BH / 2, w - 1.6, BH, 7); g.fillStyle = '#6B4430'; g.fill();
        const iw = Math.max(4, w - 16); g.beginPath(); g.roundRect((w - iw) / 2, -BH / 2 + 9, iw, BH - 18, 5); g.fillStyle = '#85573A'; g.fill();
        g.beginPath(); g.roundRect((w - iw) / 2 + 3, -BH / 2 + 12, Math.max(2, iw - 6), 7, 3); g.fillStyle = 'rgba(255,220,180,.3)'; g.fill();
      } else {
        const off = 5 + lift * 8, cs = Math.cos(-sl.rot), sn = Math.sin(-sl.rot);
        g.save(); g.translate(off * 0.5 * cs - off * sn, off * 0.5 * sn + off * cs); wedge(g, n, R0); g.fillStyle = 'rgba(46,40,70,.22)'; g.fill(); g.restore();
        g.save(); wedge(g, n, R0); g.clip(); g.rotate(-base(sl.i, n)); if (pizza) g.drawImage(pizza, -R0 - 8, -R0 - 8, R0 * 2 + 16, R0 * 2 + 16); g.restore();
        if (n > 1) { wedge(g, n, R0); g.lineWidth = 3.5; g.lineJoin = 'round'; g.strokeStyle = 'rgba(255,246,220,.85)'; g.stroke(); }
      }
      if (sl === sel || sl.glow) { g.save(); g.globalAlpha = 0.42 + Math.sin(st.t * 7) * 0.22; if (R.food === 'bar') { g.beginPath(); g.roundRect(0, -BH / 2, BW / n, BH, 7); } else wedge(g, n, R0); g.fillStyle = '#FFF6C8'; g.fill(); g.restore(); }
    }
    const homeT = (sl) => (R.food === 'bar' ? { x: G.px - BW / 2 + (sl.i * BW) / sl.n, y: G.py, rot: 0, sx: 1, sy: 1 } : { x: G.px, y: G.py, rot: base(sl.i, sl.n), sx: 1, sy: 1 });
    function plateT(fr, j, n) {
      if (R.food === 'bar') { const k = (fr.pr * 1.84) / BW; return { x: fr.x - fr.pr * 0.92 + (j * BW * k) / n, y: fr.y, rot: 0, sx: k, sy: k }; }
      const k = (fr.pr * 0.86) / R0; return { x: fr.x, y: fr.y, rot: base(j, n), sx: k, sy: k };
    }
    function hitOf(n) {
      if (R.food === 'bar') return { x: 0, y: -BH / 2, w: BW / n, h: BH };
      if (n <= 1) return { x: -R0 * 0.7, y: -R0 * 0.7, w: R0 * 1.4, h: R0 * 1.4 };
      const a = Math.PI / n, d = R0 * 0.6, h = K.clamp(d * Math.sin(a) + 12, R0 * 0.2, R0 * 0.36);
      return { x: Math.cos(a) * d - h, y: Math.sin(a) * d - h, w: h * 2, h: h * 2 };
    }
    function makeSlices(n) {
      for (const s of slices) s.remove(); slices = []; sel = null;
      for (const f of friends) f.items = [];
      for (let i = 0; i < n; i++) {
        const sl = st.add({ z: 12, i, n, where: -1, label: 'Piece ' + (i + 1), pad: 2, olives: [] });
        Object.assign(sl, homeT(sl)); sl.hit = hitOf(n);
        sl.draw = (g) => drawPiece(g, sl);
        sl.onDown = (p) => { if (!building() || R.scene === 'set' || n <= 1) return; sl.tweens.length = 0; sl.grab = { dx: p.x - sl.x, dy: p.y - sl.y }; front(sl, 40); sl.lift = 1; lastAct = st.t; K.sfx.tap(); };
        sl.onMove = (p) => { if (sl.grab) { sl.x = p.x - sl.grab.dx; sl.y = p.y - sl.grab.dy; } };
        sl.onUp = (p, e, s) => {
          lastAct = st.t;
          if (!sl.grab) { if (s.moved < 24) tapPiece(sl); return; }
          sl.grab = null; sl.lift = 0;
          if (s.moved < 24) return tapPiece(sl);
          let best = -1, bd = 1e9; const home = R.food === 'bar' ? Math.abs(p.x - G.px) < BW / 2 && Math.abs(p.y - G.py) < BH / 2 + 24 : Math.hypot(p.x - G.px, p.y - G.py) < R0;
          if (!home) friends.forEach((f, k) => { const d = Math.hypot(p.x - f.x, p.y - f.y + f.pr * 0.3); if (d < f.pr + 110 && d < bd) { bd = d; best = k; } });
          moveTo(sl, best);
        };
        sl.onTap = (p) => { if (!p) tapPiece(sl); };
        slices.push(sl);
      }
    }
    function settle(sl, quick) {
      const t = sl.where < 0 ? homeT(sl) : plateT(friends[sl.where], friends[sl.where].items.indexOf(sl), sl.n);
      front(sl, sl.where < 0 ? 12 : 22); sl.to(t, { dur: quick ? 0.2 : 0.34, ease: 'out' });
    }
    function moveTo(sl, k) {
      if (sl.where >= 0) { const it = friends[sl.where].items; it.splice(it.indexOf(sl), 1); it.forEach((o) => settle(o, true)); }
      sl.where = k; if (sel === sl) sel = null;
      if (k >= 0) { const f = friends[k]; f.items.push(sl); f.pop = 1; K.sfx.pop(); if (f.ghost) f.ghostHide = 0; } else K.sfx.tone(300, 0.08, { type: 'triangle', vol: 0.12 });
      settle(sl);
      if (!toldBell && R.kind === 'share' && slices.every((s) => s.where >= 0)) { toldBell = true; bell.pulse = true; ctx.say(T.bell); }
    }
    function tapPiece(sl) {
      if (!building()) return;
      if (R.scene === 'set') return addOlive(sl);
      if (sl.n <= 1) { K.sfx.tap(); for (const d of dials) d.wob = 0.4; ctx.say(T.cut); return; }
      if (sl.where >= 0) return moveTo(sl, -1);
      if (friends.length === 1) return moveTo(sl, 0);
      sel = sel === sl ? null : sl; K.sfx.tap();
    }
    function cut(n) {
      if (!building() || !R.dial) return;
      lastAct = st.t; R.n = n; cutT = st.t;
      K.sfx.noise(0.16, { filter: 'highpass', freq: 2400, vol: 0.16 }); K.sfx.tone(700, 0.08, { to: 380, type: 'triangle', vol: 0.14, delay: 0.05 });
      for (const d of dials) { d.on = d.n === n; d.pulse = false; }
      if (R.scene === 'line') { place(Math.round(R.pos * n)); return; }
      for (const o of olives) if (o.on >= 0) sendOlive(o, -1);
      makeSlices(n);
      for (const s of slices) { s.sx = s.sy = 0.94; s.to({ sx: 1, sy: 1 }, { dur: 0.35, ease: 'back' }); }
    }

    /* ---------- friends ---------- */
    function seat(nF) {
      const a = G.area, out = [];
      const side = !land && nF <= 2, cols = land ? (nF === 1 ? 1 : 2) : nF, rows = Math.ceil(nF / cols), cw = a.w / cols, chh = a.h / rows;
      for (let i = 0; i < nF; i++) {
        const cx = a.x + (i % cols + 0.5) * cw, cy = a.y + (Math.floor(i / cols) + 0.5) * chh;
        if (side) { const pr = Math.min(chh * 0.44, cw * 0.27), fr = pr * 0.6; out.push({ x: cx + fr * 0.9, y: cy, pr, fx: cx - pr - fr * 0.1, fy: cy, fr }); }
        else { const pr = Math.min(cw * 0.42, chh * 0.31, 168), fr = pr * (nF === 1 ? 0.56 : 0.62); out.push({ x: cx, y: cy + fr * 0.75, pr, fx: cx, fy: cy + fr * 0.75 - pr - fr * 0.5, fr }); }
      }
      return out;
    }
    function makeFriends(nF, o) {
      o = o || {};
      const names = K.shuffle(FACES).slice(0, nF), seats = o.seats || seat(nF);
      friends = seats.map((p, i) => {
        const f = st.add(Object.assign({ z: 8, i, name: names[i], items: [], pop: 0, chew: 0, wob: 0, blink: 0, nextBlink: 1 + Math.random() * 3, label: 'Friend ' + (i + 1), pad: 0, sx: 0, sy: 0 }, p));
        f.hit = { x: Math.min(-p.pr, p.fx - p.x - p.fr), y: Math.min(-p.pr, p.fy - p.y - p.fr), w: 0, h: 0 }; f.hit.w = Math.max(p.pr, p.fx - p.x + p.fr) - f.hit.x; f.hit.h = p.pr - f.hit.y;
        f.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: i * 0.08 });
        f.draw = (g) => {
          const bar = R.food === 'bar';
          g.save(); if (f.pulse) { const q = 1 + Math.sin(st.t * 6) * 0.04; g.scale(q, q); }
          if (bar) put(g, traySp(f.pr * 2, f.pr * 0.76), 0, 0); else put(g, plateSp(f.pr), 0, 0);
          if (f.ghost && !(f.ghostHide > 0)) {                       // the shape to cover
            const [a, b] = f.ghost; g.save(); g.globalAlpha = 0.75 + Math.sin(st.t * 4) * 0.15;
            if (bar) { g.beginPath(); g.roundRect(-f.pr * 0.92, -f.pr * 0.257, (f.pr * 1.84 * a) / b, f.pr * 0.515, 6); }
            else { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, f.pr * 0.86, -Math.PI / 2, -Math.PI / 2 + (TAU * a) / b); g.closePath(); }
            g.fillStyle = 'rgba(242,179,61,.3)'; g.fill(); g.setLineDash([10, 8]); g.lineWidth = 4; g.strokeStyle = A.C.marigold; g.stroke(); g.restore();
          }
          g.restore();
          g.save(); g.translate(f.fx - f.x, f.fy - f.y + Math.sin(st.t * 2 + f.i) * 2);
          const ch = f.chew > 0 ? Math.sin(st.t * 24) : 0, q = 1 + f.pop * 0.14;
          g.rotate(Math.sin(f.wob * 26) * f.wob * 0.3 + (f.chew > 0 ? Math.sin(st.t * 9) * 0.05 : 0)); g.scale(q * (1 + ch * 0.03), q * (1 - ch * 0.05));
          g.beginPath(); g.ellipse(3, f.fr * 0.86, f.fr * 0.7, f.fr * 0.14, 0, 0, 7); g.fillStyle = 'rgba(46,40,70,.14)'; g.fill();
          drawFace(g, f.name, f.fr, f.blink > 0 || (f.chew > 0 && ch > 0.2)); g.restore();
        };
        f.update = (dt) => { f.pop = Math.max(0, f.pop - dt * 3); f.chew = Math.max(0, f.chew - dt); f.wob = Math.max(0, f.wob - dt); f.blink -= dt; f.nextBlink -= dt; if (f.nextBlink < 0) { f.blink = 0.14; f.nextBlink = 2 + Math.random() * 4; } };
        f.onTap = () => tapFriend(i);
        // the written fraction beside the plate
        const chip = st.add({ z: 30, x: p.x + (o.chipDx != null ? o.chipDx : p.pr * 0.82), y: p.y + (o.chipDy != null ? o.chipDy : p.pr * 0.78) });
        chip.draw = (g) => {
          const fr = f.shown || (level >= 2 && R.scene === 'serve' && f.items.length ? [f.items.length, R.n] : null); if (!fr) return;
          const z = K.clamp(p.pr * 0.5, 44, 74);
          g.beginPath(); g.roundRect(-z * 0.5 + 2, -z * 0.78 + 4, z, z * 1.56, z * 0.3); g.fillStyle = 'rgba(46,40,70,.18)'; g.fill();
          g.beginPath(); g.roundRect(-z * 0.5, -z * 0.78, z, z * 1.56, z * 0.3); g.fillStyle = '#FFF9EA'; g.fill();
          expr(g, [fr], 0, 0, z, A.C.ink, z * 0.86);
        };
        extra.push(chip);
        return f;
      });
    }
    function tapFriend(i) {
      const f = friends[i]; lastAct = st.t;
      if (R.scene === 'compare') return choose(i);
      if (building() && sel) return moveTo(sel, i);
      f.pop = 1; K.sfx.tone(520 + i * 90, 0.12, { to: 760 + i * 90, type: 'sine', vol: 0.16 });
    }

    /* ---------- card, label, dial, bell ---------- */
    const cardSp = () => A.sprite(`pz-card-${Math.round(G.card.w)}`, [-G.card.w / 2, -G.card.h / 2, G.card.w, G.card.h], (g, s) => {
      const w = G.card.w, h = G.card.h; g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 26, 4, 2); A.paper(g, s, '#FFF9EA', { box: { x: -w / 2, y: -h / 2, w, h } });
      g.beginPath(); A.rect(g, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 16, 6, 1); g.lineWidth = 3; g.setLineDash([3, 9]); g.lineCap = 'round'; g.strokeStyle = A.alpha(A.C.tomato, 0.5); g.stroke();
    });
    const card = st.add({ z: 15, x: G.card.x, y: G.card.y, pop: 0 });
    card.draw = (g) => {
      if (!R || !R.card) return;
      const q = 1 + card.pop * 0.12, h = G.card.h; g.save(); g.scale(q, q); put(g, cardSp(), 0, 0);
      if (R.card === 'friends') {
        const n = R.F, r = Math.min(h * 0.27, (G.card.w - 150) / (n * 2.3)), x0 = -((n - 1) * r * 2.3 + r * 3.2) / 2 + r;
        g.beginPath(); g.arc(x0, 0, r * 1.1, 0, 7); g.fillStyle = '#E2A85A'; g.fill(); g.beginPath(); g.arc(x0, 0, r * 0.88, 0, 7); g.fillStyle = '#F6D878'; g.fill();
        g.fillStyle = '#C8402F'; for (const [x, y] of [[-0.35, -0.3], [0.3, -0.1], [-0.1, 0.42]]) { g.beginPath(); g.arc(x0 + x * r, y * r, r * 0.2, 0, 7); g.fill(); }
        A.line(g, A.C.ink, 5, (p) => { const x = x0 + r * 1.5; p.moveTo(x, 0); p.lineTo(x + r * 0.8, 0); p.moveTo(x + r * 0.5, -r * 0.3); p.lineTo(x + r * 0.85, 0); p.lineTo(x + r * 0.5, r * 0.3); });
        friends.forEach((f, i) => { g.save(); g.translate(x0 + r * 3.5 + i * r * 2.3, 0); drawFace(g, f.name, r, false); g.restore(); });
      } else expr(g, R.card, 0, 2, h * 0.62, A.C.ink, G.card.w - 60);
      g.restore();
    };
    card.update = (dt) => { card.pop = Math.max(0, card.pop - dt * 2.5); };
    const lab = st.add({ z: 60, x: G.lab.x, y: G.lab.y, toks: null, sx: 0, sy: 0 });
    lab.show = (toks) => { lab.toks = toks; lab.sx = lab.sy = 0.4; lab.to({ sx: 1, sy: 1 }, { dur: 0.5, ease: 'elastic' }); };
    lab.draw = (g) => {
      if (!lab.toks) return;
      const z = G.lab.size; g.save(); g.globalAlpha = 0; const w = expr(g, lab.toks, 0, 0, z, '#000', W - 90) + 70; g.restore();
      const h = z * 1.62; g.beginPath(); g.roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 30); g.fillStyle = 'rgba(46,40,70,.2)'; g.fill();
      g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 30); g.fillStyle = '#FFF6C8'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#FFFFFF'; g.stroke();
      expr(g, lab.toks, 0, 2, z, A.C.tomato, W - 90);
    };
    const bell = st.add({ z: 20, x: G.bell.x, y: G.bell.y, hitR: G.bell.r + 4, label: 'Ready', pulse: false, wob: 0 });
    bell.draw = (g) => {
      const q = (bell.pulse ? 1 + Math.sin(st.t * 6) * 0.07 : 1) * G.bell.r / 60; g.save(); g.scale(q, q);
      if (bell.pulse) { g.beginPath(); g.arc(0, 0, 70 + Math.sin(st.t * 6) * 4, 0, 7); g.fillStyle = 'rgba(255,246,200,.8)'; g.fill(); }
      put(g, disc(), 0, 0); g.rotate(Math.sin(bell.wob * 30) * bell.wob * 0.7); bellIcon(g); g.restore();
    };
    bell.update = (dt) => { bell.wob = Math.max(0, bell.wob - dt); };
    bell.onTap = () => { lastAct = st.t; ring(); };
    function makeDial(opts) {
      for (const d of dials) d.remove(); dials = [];
      if (!opts) return;
      const m = opts.length, r = G.dial.r;
      opts.forEach((n, i) => {
        let x, y;
        if (land) { x = 108; y = 580 + (i - (m - 1) / 2) * Math.min(112, 640 / m); }
        else { const per = m <= 4 ? m : Math.ceil(m / 2), row = Math.floor(i / per), inRow = row ? m - per : per, top = G.py + G.R + 26, room = H - top; x = W / 2 + (i - row * per - (inRow - 1) / 2) * Math.min(132, (W - 30) / per); y = top + (m <= 4 ? Math.min(room * 0.5, 130) : room * (row ? 0.66 : 0.27)); }
        const d = st.add({ z: 20, x, y, n, hitR: r + 3, label: 'Cut into ' + n, on: false, pulse: false, wob: 0, sx: 0, sy: 0 });
        d.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back', delay: 0.1 + i * 0.05 });
        d.draw = (g) => {
          const q = (d.pulse ? 1 + Math.sin(st.t * 6) * 0.08 : 1) * r / 60; g.save(); g.scale(q, q); g.rotate(Math.sin(d.wob * 28) * d.wob * 0.4);
          if (d.pulse) { g.beginPath(); g.arc(0, 0, 71, 0, 7); g.fillStyle = 'rgba(255,246,200,.85)'; g.fill(); }
          put(g, disc(), 0, 0);
          if (d.on) { g.beginPath(); g.arc(0, 0, 53, 0, 7); g.fillStyle = A.C.marigold; g.fill(); }
          g.strokeStyle = d.on ? '#FFF9EA' : A.alpha(A.C.tomato, 0.75); g.lineWidth = 4.5; g.lineCap = 'round'; g.beginPath();
          for (let k = 0; k < n; k++) { const a = base(k, n); g.moveTo(Math.cos(a) * 37, Math.sin(a) * 37); g.lineTo(Math.cos(a) * 50, Math.sin(a) * 50); } g.stroke();
          text(g, String(n), 0, 2, n > 9 ? 44 : 54, A.C.ink); g.restore();
        };
        d.update = (dt) => { d.wob = Math.max(0, d.wob - dt); };
        d.onTap = () => cut(n);
        dials.push(d);
      });
      if (land && dials.length) {
        const c = st.add({ z: 19, x: 108, y: dials[0].y - r - 58, sx: 0, sy: 0, draw(g) {
          g.rotate(-0.5 + Math.sin(st.t * 1.6) * 0.06); A.line(g, A.C.tomato, 13, (h) => { h.moveTo(0, 6); h.lineTo(0, 54); });
          g.beginPath(); g.arc(2, 3, 27, 0, 7); g.fillStyle = 'rgba(46,40,70,.2)'; g.fill(); g.beginPath(); g.arc(0, 0, 27, 0, 7); g.fillStyle = '#D5DAE0'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#F4F6F8'; g.stroke();
          g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fillStyle = A.C.tomato; g.fill();
        } });
        c.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back' }); extra.push(c);
      }
    }
    // the cutter's flash across the pizza
    st.add({ z: 45, draw(g) {
      const k = (st.t - cutT) / 0.3; if (k >= 1 || !R || !R.n || R.scene === 'line') return;
      g.save(); g.translate(G.px, G.py); g.globalAlpha = 1 - k; g.strokeStyle = '#FFFFFF'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath();
      if (R.food === 'bar') for (let i = 1; i < R.n; i++) { const x = -BW / 2 + (i * BW) / R.n; g.moveTo(x, -BH * 0.6 * k - 8); g.lineTo(x, BH * 0.6 * k + 8); }
      else for (let i = 0; i < R.n && R.n > 1; i++) { const a = base(i, R.n); g.moveTo(0, 0); g.lineTo(Math.cos(a) * (R0 + 14) * Math.min(1, k * 2), Math.sin(a) * (R0 + 14) * Math.min(1, k * 2)); }
      g.stroke(); g.restore();
    } });

    /* ---------- olives (a fraction of a set) ---------- */
    function makeOlives(N) {
      const a = G.area, cx = a.x + a.w / 2, cy = a.y + a.h / 2, br = Math.min(a.w * 0.4, a.h * 0.42, 190), r = K.clamp(br * 0.14, 18, 24);
      const bowl = st.add({ z: 8, x: cx, y: cy, sprite: A.sprite('pz-bowl-' + Math.round(br), [-br - 4, -br - 4, br * 2 + 8, br * 2 + 8], (g, s) => {
        g.beginPath(); g.arc(0, 0, br, 0, 7); A.paper(g, s, A.C.teal, { box: { x: -br, y: -br, w: br * 2, h: br * 2 } });
        g.beginPath(); g.arc(0, 0, br * 0.82, 0, 7); A.paper(g, s, '#EAF3EE', { shadow: 0, box: { x: -br, y: -br, w: br * 2, h: br * 2 }, grain: 0.1 });
      }) });
      extra.push(bowl); olives = [];
      for (let i = 0; i < N; i++) {
        const ring = i < 10 ? 0 : 1, k = ring ? i - 10 : i, m = ring ? N - 10 : Math.min(10, N), rad = ring ? br * (N - 10 < 2 ? 0 : 0.28) : br * 0.6, an = (k / m) * TAU + ring;
        const hx = cx + Math.cos(an) * rad * (N <= 1 ? 0 : 1), hy = cy + Math.sin(an) * rad;
        const o = st.add({ z: 26, x: hx, y: hy, hx, hy, on: -1, sx: 0, sy: 0, draw(g) { olive(g, r); } });
        o.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back', delay: 0.2 + i * 0.03 }); olives.push(o);
      }
      G.oliveR = r;
    }
    function sendOlive(o, k) {
      if (k < 0) { if (o.on >= 0 && slices[o.on]) { const l = slices[o.on].olives; l.splice(l.indexOf(o), 1); } o.on = -1; o.to({ x: o.hx, y: o.hy }, { dur: 0.35, ease: 'inOut' }); return; }
      const sl = slices[k], j = sl.olives.length, n = sl.n, a = base(k, n) + (TAU / n) * (n <= 2 ? [0.5, 0.25, 0.75, 0.4, 0.6, 0.15, 0.85][j % 7] : [0.5, 0.3, 0.7][j % 3]), d = R0 * (n <= 2 ? [0.3, 0.55, 0.55, 0.75, 0.75, 0.7, 0.7][j % 7] : [0.36, 0.6, 0.6, 0.8, 0.82, 0.8][j % 6]);
      o.on = k; sl.olives.push(o); o.to({ x: G.px + Math.cos(a) * d, y: G.py + Math.sin(a) * d }, { dur: 0.3, ease: 'out' });
    }
    function addOlive(sl) {
      if (sl.n <= 1) { K.sfx.tap(); for (const d of dials) d.wob = 0.4; ctx.say(T.cut); return; }
      const o = olives.filter((q) => q.on < 0).pop();
      if (!o || sl.olives.length >= 6) { K.sfx.whoops(); return; }
      sendOlive(o, sl.i); K.sfx.tone(360 + sl.olives.length * 50, 0.1, { type: 'triangle', vol: 0.2 });
    }

    /* ---------- the ribbon: a number line from 0 to 1 ---------- */
    function makeLine() {
      const x0 = land ? 250 : 62, x1 = land ? W - 150 : W - 62, y = land ? 640 : G.py - 10, L = x1 - x0, fr = land ? 62 : 50;
      G.line = { x0, x1, y, fr };
      const rib = st.add({ z: 9, x: x0, y, draw(g) {
        const h = 54;
        g.fillStyle = 'rgba(46,40,70,.18)'; g.beginPath(); g.roundRect(-26, -h / 2 + 7, L + 56, h, 6); g.fill();
        for (const d of [-1, 1]) { const ex = d < 0 ? 0 : L; g.beginPath(); g.moveTo(ex, -h / 2); g.lineTo(ex + d * 40, -h / 2); g.lineTo(ex + d * 22, 0); g.lineTo(ex + d * 40, h / 2); g.lineTo(ex, h / 2); g.closePath(); g.fillStyle = A.shade(A.C.teal, -0.08); g.fill(); }
        g.fillStyle = A.C.teal; g.fillRect(0, -h / 2, L, h); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, -h / 2 + 6, L, 6); g.fillRect(0, h / 2 - 12, L, 6);
        const n = R.n || 1, k = Math.min(1, (st.t - cutT) / 0.3);
        g.strokeStyle = '#FFF9EA'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= n; i++) { const x = (i * L) / n, e = i === 0 || i === n ? 1 : k; g.moveTo(x, -(h / 2 + 12) * e); g.lineTo(x, (h / 2 + 12) * e); } g.stroke();
        if (R.hintJ != null && R.n) { g.beginPath(); g.arc((R.hintJ * L) / R.n, 0, 22 + Math.sin(st.t * 7) * 6, 0, 7); g.fillStyle = 'rgba(255,246,200,.9)'; g.fill(); }
        for (const [t, x] of [['0', 0], ['1', L]]) { g.beginPath(); g.arc(x, h / 2 + 62, 34, 0, 7); g.fillStyle = '#FFF9EA'; g.fill(); text(g, t, x, h / 2 + 64, 46, A.C.ink); }
      } });
      const name = K.pick(FACES);
      const mk = st.add({ z: 30, x: x0, y: y - 34, label: 'Marker', hit: { x: -fr - 6, y: -fr * 2.2, w: fr * 2 + 12, h: fr * 2.2 + 50 }, pad: 10, pop: 0 });
      mk.draw = (g) => {
        g.fillStyle = A.C.tomato; g.beginPath(); g.moveTo(0, 30); g.lineTo(-17, -8); g.lineTo(17, -8); g.closePath(); g.fill();
        g.save(); g.translate(0, -fr * 1.02); const q = 1 + mk.pop * 0.15; g.scale(q, q); g.rotate(mk.drag ? Math.sin(st.t * 10) * 0.05 : 0);
        g.beginPath(); g.arc(2, 5, fr * 0.98, 0, 7); g.fillStyle = 'rgba(46,40,70,.18)'; g.fill(); drawFace(g, name, fr, false); g.restore();
        if (R.n > 1 && !mk.drag) { const z = 46; g.save(); g.translate(0, -fr * 2.05 - z * 0.9); g.beginPath(); g.roundRect(-z * 0.52, -z * 0.8, z * 1.04, z * 1.6, 14); g.fillStyle = '#FFF9EA'; g.fill(); expr(g, [[R.j, R.n]], 0, 0, z, A.C.ink, z * 0.9); g.restore(); }
      };
      mk.update = (dt) => { mk.pop = Math.max(0, mk.pop - dt * 3); };
      const setX = (px) => { mk.x = K.clamp(px, x0, x1); R.pos = (mk.x - x0) / L; };
      mk.onDown = (p) => { if (!building()) return; mk.tweens.length = 0; mk.drag = { dx: p.x - mk.x }; lastAct = st.t; K.sfx.tap(); };
      mk.onMove = (p) => { if (mk.drag) setX(p.x - mk.drag.dx); };
      mk.onUp = () => { if (!mk.drag) return; mk.drag = null; place(Math.round(R.pos * (R.n || 1))); };
      G.mk = mk; extra.push(rib, mk);
    }
    function place(j) {
      const n = R.n || 1, l = G.line; j = K.clamp(j, 0, n); R.j = j; R.pos = j / n; R.hintJ = null; lastAct = st.t;
      G.mk.to({ x: l.x0 + (l.x1 - l.x0) * R.pos }, { dur: 0.2, ease: 'back' }); G.mk.pop = 1; K.sfx.tone(392 + 392 * R.pos, 0.12, { type: 'triangle', vol: 0.2 });
    }

    /* ---------- two friends compare ---------- */
    function makeCompare() {
      const a = land ? { x: 150, y: 150, w: W - 300, h: 700 } : { x: 20, y: 280, w: W - 40, h: H - 520 };
      const pr = Math.min(a.w * 0.2, a.h * 0.3, 180), fr = pr * 0.5, seats = [0, 1].map((i) => { const x = a.x + a.w * (i ? 0.75 : 0.25), y = a.y + a.h * 0.56; return { x, y, pr, fx: x, fy: y - pr - fr * 0.62, fr }; });
      makeFriends(2, { seats, chipDx: 0, chipDy: pr + 70 });
      friends.forEach((f, i) => {
        const [fa, fb] = R.pair[i]; f.shown = [fa, fb];
        const grp = st.add({ z: 24, x: f.x, y: f.y, hx: f.x, hy: f.y, hit: { x: -pr, y: -pr, w: pr * 2, h: pr * 2 }, pad: 0, label: 'Plate ' + (i + 1), al: 1 });
        const k = (pr * 0.86) / R0;
        grp.draw = (g) => {
          g.save(); g.scale(k, k); g.globalAlpha *= grp.al;
          for (let j = 0; j < fa; j++) { g.save(); g.rotate(base(j, fb)); const sl = { i: j, n: fb, rot: base(j, fb), lift: 0 }; drawPiece(g, sl); g.restore(); }
          g.restore();
        };
        grp.onDown = (p) => { if (!building()) return; grp.tweens.length = 0; grp.grab = { dx: p.x - grp.x, dy: p.y - grp.y }; front(grp, 40); lastAct = st.t; };
        grp.onMove = (p, e, s) => { if (grp.grab && s.moved > 12) { grp.x = p.x - grp.grab.dx; grp.y = p.y - grp.grab.dy; grp.al = 0.8; } };
        grp.onUp = (p, e, s) => {
          if (!grp.grab) return; grp.grab = null;
          if (s.moved < 24) { grp.to({ x: grp.hx, y: grp.hy, al: 1 }, { dur: 0.15 }); return choose(i); }
          const o = friends[1 - i];
          if (Math.hypot(grp.x - o.x, grp.y - o.y) < pr * 1.3) { K.sfx.pop(); grp.to({ x: o.x, y: o.y }, { dur: 0.2, ease: 'out' }).then(() => ctx.wait(1500)).then(() => { front(grp, 24); grp.to({ x: grp.hx, y: grp.hy, al: 1 }, { dur: 0.4, ease: 'inOut' }); }); }
          else { front(grp, 24); grp.to({ x: grp.hx, y: grp.hy, al: 1 }, { dur: 0.3, ease: 'out' }); }
        };
        grp.onTap = (p) => { if (!p) choose(i); };
        f.grp = grp; extra.push(grp);
      });
    }
    /** Slide one friend's pieces over the other's, so the bigger one sticks out. */
    function overlay(i) {
      const g = friends[i].grp, o = friends[1 - i]; front(g, 40); g.al = 0.8;
      return g.to({ x: o.x, y: o.y }, { dur: 0.5, ease: 'inOut' }).then(() => ctx.wait(1300)).then(() => g.to({ x: g.hx, y: g.hy, al: 1 }, { dur: 0.45, ease: 'inOut' })).then(() => front(g, 24));
    }
    async function choose(i) {
      if (!building()) return;
      const r = R, v = r.pair.map((p) => p[0] / p[1]), right = v[i] > v[1 - i];
      if (!right) { r.misses++; r.phase = 'show'; K.sfx.whoops(); friends[i].wob = 0.5; ctx.say(`${T.beside} ${T.bigger}`); await overlay(i); if (R !== r) return; r.phase = 'build'; if (r.misses >= 2) friends[1 - i].pulse = true; return; }
      r.phase = 'done'; K.sfx.ding(); friends[i].pop = 1; friends[1 - i].pulse = false;
      await overlay(1 - i); if (R !== r) return;
      lab.show([r.pair[i], '>', r.pair[1 - i]]); K.sfx.sparkle(); ctx.fx.burst(friends[i].x, friends[i].y, { n: 16 });
      for (const f of friends) munch(f, f.grp);
      finish(r);
    }

    /* ---------- which pizza has equal pieces? ---------- */
    function makePick() {
      const n = R.n, m = R.opts.length, a = land ? { x: 150, w: W - 300, y: 560 } : { x: 20, w: W - 40, y: H * 0.5 };
      const pr = Math.min(a.w / (m * 2.5), land ? 230 : 300);
      R.opts.forEach((eq, i) => {
        const x = land ? a.x + (a.w * (i + 0.5)) / m : W / 2, y = land ? a.y : 330 + (i + 0.5) * ((H - 420) / m), rr = land ? pr : Math.min(pr * 2.2, (H - 420) / m * 0.43, W * 0.36);
        const rnd = A.rng(played * 17 + i * 5 + 3), ang = []; let off = 0;
        if (eq) for (let k = 0; k < n; k++) ang.push(base(k, n) + 0.4);
        else if (n === 2) off = (0.3 + rnd() * 0.2) * (rnd() < 0.5 ? -1 : 1);
        else { const w = []; let tot = 0; for (let k = 0; k < n; k++) { const v = k % 2 ? 0.45 + rnd() * 0.2 : 1.35 + rnd() * 0.5; w.push(v); tot += v; } let c = rnd() * TAU; for (let k = 0; k < n; k++) { ang.push(c); c += (w[k] / tot) * TAU; } }
        const pz = st.add({ z: 12, x, y, hitR: rr, label: 'Pizza ' + (i + 1), eq, wob: 0, pulse: false, sx: 0, sy: 0 });
        pz.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: i * 0.12 });
        pz.draw = (g) => {
          const q = rr / R0 * (pz.pulse ? 1 + Math.sin(st.t * 6) * 0.04 : 1); g.save(); g.rotate(Math.sin(pz.wob * 26) * pz.wob * 0.2); g.scale(q, q);
          put(g, boardSp(R0), 0, 0); g.beginPath(); g.arc(4, 7, R0, 0, 7); g.fillStyle = 'rgba(46,40,70,.2)'; g.fill();
          if (pizza) g.drawImage(pizza, -R0 - 8, -R0 - 8, R0 * 2 + 16, R0 * 2 + 16);
          g.save(); g.beginPath(); g.arc(0, 0, R0, 0, 7); g.clip(); g.lineCap = 'round';
          for (const [lw, col] of [[12, 'rgba(120,60,20,.35)'], [6, '#FFF6DC']]) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); if (off) { g.moveTo(off * R0, -R0); g.lineTo(off * R0, R0); } else for (const t of ang) { g.moveTo(0, 0); g.lineTo(Math.cos(t) * R0 * 1.1, Math.sin(t) * R0 * 1.1); } g.stroke(); }
          g.restore(); g.restore();
        };
        pz.update = (dt) => { pz.wob = Math.max(0, pz.wob - dt); };
        pz.onTap = () => pick(i);
        extra.push(pz);
      });
    }
    function pick(i) {
      if (!building()) return;
      const pz = extra.filter((n) => n.eq != null)[i], r = R; lastAct = st.t;
      if (!pz.eq) { r.misses++; K.sfx.whoops(); pz.wob = 0.6; ctx.say(T.notSame); if (r.misses >= 2) extra.forEach((n) => { if (n.eq) n.pulse = true; }); return; }
      r.phase = 'done'; K.sfx.ding(); K.sfx.sparkle(); ctx.fx.burst(pz.x, pz.y, { n: 18 }); pz.pulse = false; pz.to({ sx: 1.08, sy: 1.08 }, { dur: 0.3, ease: 'back' });
      ctx.say(T.equal); lab.show([[1, r.n]]); finish(r);
    }

    /* ---------- rounds ---------- */
    const DIALS = [2, 3, 4, 5, 6, 8, 10, 12];
    function dialFor(need, without, size) { const pool = K.shuffle(DIALS.filter((n) => !need.includes(n) && n !== without)); return need.concat(pool.slice(0, Math.max(0, size - need.length))).sort((a, b) => a - b); }
    function make(kind) {
      const up = K.clamp(skill, 0, 1), q = { kind, misses: 0, phase: 'build', scene: 'serve', food: 'pizza', n: 0, F: 1 };
      for (let tries = 0; tries < 30; tries++) {
        if (kind === 'share') { q.F = level > 1 ? 3 : K.pick(played < 1 ? [2] : played < 2 ? [4] : up > 0.3 ? [2, 3, 4] : [2, 4]); q.dial = q.F === 3 || up > 0.5 ? [2, 3, 4, 6] : played < 1 ? [2, 4] : [2, 4, 8]; q.card = 'friends'; q.key = 'share' + q.F; }
        else if (kind === 'pick') { q.scene = 'pick'; q.n = K.pick(up > 0.4 ? [2, 3, 4, 6] : [2, 4]); q.opts = K.shuffle(up > 0.6 ? [true, false, false] : [true, false]); q.dial = null; q.key = 'pick' + q.n; }
        else if (kind === 'unit' || kind === 'give') {
          const f = K.pick(kind === 'unit' ? (up > 0.3 ? ['1/2', '1/3', '1/4', '1/6', '1/8'] : ['1/2', '1/4', '1/3']) : (up > 0.4 ? ['3/4', '2/3', '3/8', '5/8', '5/6'] : ['3/4', '2/3'])).split('/').map(Number);
          q.a = f[0]; q.b = f[1]; q.dial = [2, 3, 4, 6, 8]; q.card = [f]; q.key = 'give' + f.join('/'); if (kind === 'give' && up > 0.5 && Math.random() < 0.4) q.food = 'bar';
        } else if (kind === 'compare') {
          q.scene = 'compare'; q.dial = null;
          const easy = [[[1, 2], [1, 3]], [[1, 2], [1, 4]], [[1, 3], [1, 4]], [[1, 4], [1, 8]], [[1, 3], [1, 6]], [[1, 2], [1, 8]]], mid = [[[3, 4], [1, 2]], [[2, 3], [1, 3]], [[5, 8], [3, 8]], [[1, 2], [3, 8]], [[2, 3], [1, 2]]], hard = [[[2, 3], [3, 4]], [[5, 8], [3, 4]], [[5, 6], [3, 4]], [[3, 8], [1, 3]], [[2, 5], [1, 2]], [[3, 5], [2, 3]], [[5, 6], [7, 8]]];
          q.pair = K.pick(level >= 3 ? (up > 0.3 ? hard : mid) : up > 0.5 ? mid : easy).slice(); if (Math.random() < 0.5) q.pair.reverse(); q.key = 'cmp' + q.pair.join('|');
        } else if (kind === 'equiv') {
          const o = K.pick([[1, 2, [4, 6, 8]], [1, 2, [4, 8, 10]], [1, 3, [6, 12]], [2, 3, [6, 12]], [1, 4, [8, 12]], [3, 4, [8, 12]]].slice(0, up > 0.3 ? 6 : 3));
          q.a = o[0]; q.b = o[1]; q.dial = dialFor(o[2], o[1], 5); q.card = [[o[0], o[1]]]; q.ghost = true; q.key = 'eq' + o[0] + '/' + o[1]; if (Math.random() < 0.35) q.food = 'bar';
        } else if (kind === 'add') {
          q.b = K.pick(up > 0.4 ? [5, 6, 8, 10, 12] : [4, 5, 6, 8]); q.a1 = K.randInt(1, q.b - 2); q.a2 = K.randInt(1, q.b - 1 - q.a1); q.a = q.a1 + q.a2;
          q.food = 'bar'; q.dial = dialFor([q.b], 0, 5); q.card = [[q.a1, q.b], '+', [q.a2, q.b]]; q.key = 'add' + q.a1 + q.a2 + q.b;
        } else if (kind === 'set') {
          q.scene = 'set'; q.b = K.pick([2, 3, 4, 5, 6]); q.each = K.randInt(2, q.b <= 3 ? 4 : 3); q.N = q.b * q.each; q.a = up > 0.5 && q.b > 2 ? K.randInt(1, q.b - 1) : 1;
          q.dial = dialFor([q.b], 0, 5); q.card = [[q.a, q.b], 'of', q.N]; q.plain = true; q.F = 0; q.key = 'set' + q.a + q.b + q.N;
        } else if (kind === 'line') {
          q.scene = 'line'; q.b = K.pick(up > 0.4 ? [3, 4, 5, 6, 8] : [2, 3, 4]); q.a = K.randInt(1, q.b - 1); q.pos = 0; q.j = 0;
          q.dial = dialFor([q.b], 0, 5); q.card = [[q.a, q.b]]; q.F = 0; q.key = 'line' + q.a + q.b;
        }
        if (q.key !== prevKey) break;
      }
      prevKey = q.key; return q;
    }
    function nextKind() {
      if (!bag.length) bag = level <= 1 ? (played === 0 ? ['share', 'share', 'pick', 'share'] : K.shuffle(['share', 'share', 'pick'])) : level === 2 ? (played === 0 ? ['unit', 'give', 'compare', 'unit'] : K.shuffle(['unit', 'give', 'compare', 'give', 'share'])) : (played === 0 ? ['equiv', 'add', 'set', 'line'] : K.shuffle(['equiv', 'add', 'set', 'line', 'compare']));
      return bag.shift();
    }
    function clear() {
      for (const n of slices.concat(friends, dials, extra, olives)) n.remove();
      slices = []; friends = []; dials = []; extra = []; olives = []; sel = null; lab.toks = null;
    }
    function newRound(kind) {
      clear(); R = make(kind || nextKind()); const first = played === 0; played++;
      bell.pulse = false; lastAct = st.t; card.pop = 1; cutT = -9;
      lab.y = land ? G.lab.y : R.scene === 'line' ? 420 : R.scene === 'compare' ? Math.min(H - 150, 1010) : G.lab.y; foil.visible = R.food === 'bar'; bell.y = !land && R.scene === 'line' ? 340 : G.bell.y;
      const serve = R.scene === 'serve' || R.scene === 'set';
      board.visible = serve && R.food === 'pizza'; bell.visible = R.scene !== 'compare' && R.scene !== 'pick'; card.visible = !!R.card;
      pizza = makePizza(R0, st.res, 1 + Math.floor(Math.random() * 9999), R.plain);
      if (R.scene === 'serve') { makeFriends(R.F); if (R.food === 'bar' && (land || R.F > 2)) for (const f of friends) f.y -= f.pr * 0.42; if (R.ghost) friends[0].ghost = [R.a, R.b]; makeSlices(1); }
      else if (R.scene === 'set') { makeSlices(1); makeOlives(R.N); }
      else if (R.scene === 'line') makeLine();
      else if (R.scene === 'compare') makeCompare();
      else makePick();
      makeDial(R.dial);
      const fs = (t) => t.map((x) => (Array.isArray(x) ? x.join('/') : x)).join(' ');
      if (R.kind === 'share') ctx.prompt(T.share(R.F) + (first ? ` ${T.cut} ${T.drag}` : ''), { show: T.share(R.F) });
      else if (R.kind === 'pick') ctx.prompt(T.pick);
      else if (R.kind === 'unit' || R.kind === 'give') ctx.prompt(T.give(FR[R.a + '/' + R.b]) + (first ? ' ' + T.cut : ''), { show: T.give(FR[R.a + '/' + R.b]) });
      else if (R.kind === 'compare') ctx.prompt(T.compare);
      else if (R.kind === 'equiv') ctx.prompt(T.equiv + (first ? ' ' + T.cut : ''), { show: `Cover ${fs(R.card)} with smaller pieces` });
      else if (R.kind === 'add') ctx.prompt(T.add, { show: `${fs(R.card)}: add them up on the plate` });
      else if (R.kind === 'set') ctx.prompt(`${T.set} ${T.olive}`, { show: `Find ${fs(R.card)} olives: share them fairly` });
      else ctx.prompt(`${T.ribbon} ${T.line}`, { show: `Put your friend on ${fs(R.card)}` });
    }

    function hintDial(ok) { const d = dials.filter((o) => ok(o.n)); for (const o of d) o.pulse = true; return d.length; }
    function miss(text) { R.misses++; K.sfx.whoops(); bell.wob = 0.3; for (const f of friends) f.wob = 0.4; ctx.say(text); }
    function munch(f, node) {
      f.chew = 2.2;
      for (let k = 0; k < 5; k++) ctx.after(250 + k * 330, () => { K.sfx.noise(0.07, { freq: 900 + Math.random() * 500, vol: 0.14 }); ctx.fx.burst(f.fx, f.fy + f.fr * 0.5, { n: 3, colors: ['#E2A85A', '#F6D878'], star: false }); });
      const its = node ? [node] : f.items; its.forEach((s, j) => s.to({ sx: 0, sy: 0 }, { dur: 0.3, ease: 'inOut', delay: 0.5 + j * (1.3 / its.length) }));
    }
    function ring() {
      if (!building() || R.scene === 'compare' || R.scene === 'pick') return;
      K.sfx.ding(); bell.wob = 0.5; bell.pulse = false;
      const r = R, n = r.n;
      if (r.scene === 'line') {
        if (n && r.j * r.b === r.a * n) { r.phase = 'done'; G.mk.pop = 1; K.sfx.sparkle(); ctx.fx.burst(G.mk.x, G.mk.y - 60, { n: 18 }); lab.show(r.j === r.a ? [[r.a, r.b]] : [[r.j, n], '=', [r.a, r.b]]); G.mk.to({ y: G.mk.y - 50 }, { dur: 0.2, ease: 'out' }).then(() => G.mk.to({ y: G.line.y - 34 }, { dur: 0.5, ease: 'elastic' })); return finish(r); }
        miss(!n || (r.a * n) % r.b ? T.bottom : T.parts);
        if (r.misses >= 2) { if (n && (r.a * n) % r.b === 0) r.hintJ = (r.a * n) / r.b; else hintDial((d) => d === r.b); }
        return;
      }
      if (r.scene === 'set') {
        const left = olives.filter((o) => o.on < 0).length, ns = slices.map((s) => s.olives.length), lo = Math.min(...ns), hi = Math.max(...ns);
        if (n !== r.b) { miss(T.bottom); if (r.misses >= 2) hintDial((d) => d === r.b); return; }
        if (lo !== hi) { miss(T.every); for (const s of slices) while (s.olives.length > lo) sendOlive(s.olives[s.olives.length - 1], -1); return; }
        if (left) { miss(T.left); return; }
        r.phase = 'done'; K.sfx.sparkle(); ctx.say(T.look); lab.show([[r.a, r.b], 'of', r.N, '=', r.a * lo]);
        for (let k = 0; k < r.a; k++) slices[k].glow = true; ctx.fx.burst(G.px, G.py, { n: 18 });
        return finish(r);
      }
      const ks = friends.map((f) => f.items.length), onBoard = slices.filter((s) => s.where < 0).length;
      if (r.kind === 'share') {
        const lo = Math.min(...ks), hi = Math.max(...ks);
        if (n <= 1) { miss(T.cut); hintDial((d) => d % r.F === 0); return; }
        if (lo === hi && !onBoard) { r.phase = 'done'; const g = gcd(lo, n); lab.show(g > 1 && lo / g === 1 ? [[lo, n], '=', [1, n / g]] : [[lo, n]]); return party(r); }
        if (n % r.F) { miss(T.moreCuts); if (r.misses >= 2 || !onBoard) hintDial((d) => d % r.F === 0); return; }
        miss(lo !== hi ? `${T.unfair} ${T.same}` : T.left);
        if (r.misses >= 2) friends.forEach((f, i) => { f.pulse = ks[i] === lo && lo !== hi; });
        return;
      }
      const k = ks[0];                                             // one friend, one fraction to make
      if (n > 1 && k * r.b === r.a * n) {
        r.phase = 'done';
        lab.show(r.kind === 'add' ? [[r.a1, r.b], '+', [r.a2, r.b], '=', [r.a, r.b]] : k === r.a ? [[r.a, r.b]] : [[k, n], '=', [r.a, r.b]]);
        if (r.kind === 'equiv') ctx.say(T.cover);
        return party(r);
      }
      const can = n > 1 && (r.a * n) % r.b === 0;
      if (!can) { miss(n > 1 && r.kind === 'equiv' ? T.moreCuts : T.bottom); if (r.misses >= 2 || r.kind !== 'equiv') hintDial((d) => (r.a * d) % r.b === 0); return; }
      miss(k * r.b > r.a * n ? T.much : T.few);
      if (r.misses >= 2) { friends[0].ghost = [r.a, r.b]; friends[0].ghostHide = 0; if (r.kind !== 'equiv' && r.kind !== 'add') ctx.after(1300, () => { if (R === r && building()) ctx.say(T.top); }); }
    }
    function party(r) {
      K.sfx.sparkle(); for (const f of friends) { f.pulse = false; f.ghost = null; f.pop = 1; munch(f); ctx.fx.burst(f.x, f.y, { n: 10 }); }
      if (won % 3 === 0) ctx.after(700, () => { if (R === r) ctx.say(T.yum); });
      finish(r);
    }
    async function finish(r) {
      await ctx.wait(3000); if (R !== r) return;
      won++; skill = K.clamp(skill + (r.misses >= 2 ? -0.1 : r.misses ? 0.04 : 0.14), 0, 1);
      if (won % 4 === 0) { await ctx.celebrate(); if (R !== r) return; }
      newRound();
    }
    // a quiet nudge: the dial waves before the first cut, the bell once everything looks served
    ctx.every(1500, () => {
      if (!building()) return; const idle = st.t - lastAct;
      if (R.dial && !R.n && idle > 6) for (const d of dials) d.wob = 0.4;
      if (R.scene === 'serve' && R.n > 1 && idle > 8 && friends.some((f) => f.items.length)) bell.pulse = true;
    });

    const css = (n, dx, dy) => ({ x: (n.x + (dx || 0)) * st.unit, y: (n.y + (dy || 0)) * st.unit });
    K._fractions = {
      get R() { return R; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      cut, ring, pick, place, choose, jump: (kind) => newRound(kind),
      give: (i, f) => moveTo(slices[i], f), olive: (i) => addOlive(slices[i]),
      state: () => ({ kind: R.kind, scene: R.scene, phase: R.phase, n: R.n, a: R.a, b: R.b, F: R.F, N: R.N, each: R.each, dial: R.dial, pair: R.pair, opts: R.opts, j: R.j, misses: R.misses, plates: friends.map((f) => f.items.length), onBoard: slices.filter((s) => s.where < 0).length, won }),
      geom: () => ({
        unit: st.unit, bell: css(bell), dial: dials.map((d) => Object.assign({ n: d.n }, css(d))), friends: friends.map((f) => css(f)),
        slices: slices.map((s) => { const b = st.bounds(s); return { where: s.where, x: (b.x + b.w / 2) * st.unit, y: (b.y + b.h / 2) * st.unit }; }),
        picks: extra.filter((n) => n.eq != null).map((n) => css(n)), marker: G.mk ? css(G.mk, 0, -40) : null, line: G.line ? { x0: G.line.x0 * st.unit, x1: G.line.x1 * st.unit } : null,
      }),
    };
    ctx.onExit(() => { K._fractions = null; });
    ctx.after(350, () => newRound());
  }

  function icon(g, w) {
    g.fillStyle = '#F8EEDC'; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(232,102,74,.13)'; for (let i = 0; i < 4; i++) { g.fillRect(w * (0.06 + i * 0.26), 0, w * 0.11, w); g.fillRect(0, w * (0.06 + i * 0.26), w, w * 0.11); }
    const cx = w * 0.46, cy = w * 0.54, r = w * 0.34;
    g.beginPath(); g.arc(cx, cy, r * 1.12, 0, 7); g.fillStyle = '#D6A671'; g.fill();
    const piece = (a0, a1, dx, dy) => {
      g.save(); g.translate(cx + dx, cy + dy);
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a0, a1); g.closePath(); g.fillStyle = '#E2A85A'; g.fill();
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * 0.86, a0, a1); g.closePath(); g.fillStyle = '#F6D878'; g.fill();
      g.fillStyle = '#C8402F'; for (let k = 0; k < 2; k++) { const a = a0 + (a1 - a0) * (0.3 + k * 0.42), d = r * (0.42 + k * 0.2); g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.1, 0, 7); g.fill(); }
      g.strokeStyle = '#FFF6DC'; g.lineWidth = w * 0.012; g.beginPath(); g.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); g.lineTo(0, 0); g.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); g.stroke();
      g.restore();
    };
    for (let i = 1; i < 4; i++) piece(-Math.PI / 2 + i * Math.PI / 2, -Math.PI / 2 + (i + 1) * Math.PI / 2, 0, 0);
    piece(-Math.PI / 2, 0, w * 0.1, -w * 0.1);
    g.save(); g.translate(w * 0.8, w * 0.8); drawFace(g, 'panda', w * 0.15, false); g.restore();
  }

  K.game({ id: 'fractions', title: 'Pizza Party', voice: 'fractions', group: 'arcade', age: 7, subject: 'math', order: 36, icon, start, lines, resize: () => K.go('fractions') });
})();
