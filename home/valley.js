/* Pip's Playhouse — home: Pip's Valley.
   A panorama about four screens wide. Drag to look around; it settles on the nearest landmark and
   Pip hops over. Toys at the landmarks open games. The valley follows the clock (day, dusk, night).

   Until each toy is rebuilt it opens the closest existing activity (`legacy`). */
(function () {
  'use strict';
  const A = K.art, V = A.valley, E = K.engine;

  const WORLD = 4000;
  const TOYS = [
    { key: 'blocks', title: 'Build It', x: 250, id: 'build', legacy: 'puzzle', box: [-100, -268, 200, 270] },
    { key: 'letters', title: 'Letter Monsters', x: 930, id: 'letters', legacy: 'abc', box: [-100, -244, 300, 246] },
    { key: 'books', title: 'Story Studio', x: 1600, id: 'story', legacy: 'story', box: [-100, -150, 200, 152] },
    { key: 'kitchen', title: 'Monster Kitchen', x: 1960, legacy: 'kitchen', box: [-150, -336, 300, 338] },
    { key: 'car', title: "Pip's Town", x: 2730, id: 'town', legacy: 'vroom', box: [-130, -200, 330, 202] },
    { key: 'band', title: 'Animal Band', x: 3040, id: 'band', legacy: 'music', box: [-126, -170, 340, 172] },
    { key: 'easel', title: 'Paint Studio', x: 3790, legacy: 'paint', box: [-134, -266, 270, 268] },
  ];
  const WIDE_SPOTS = [590, 1480, 2200, 2860, 3480]; // where the camera settles on a wide screen
  const WIDE_PIP = [600, 1460, 2150, 2900, 3560];
  // On a narrow screen only one toy fits, so the camera stops with each toy in the middle.
  const TOY_MID = TOYS.map((t) => t.x + t.box[0] + t.box[2] / 2);
  let SPOTS = WIDE_SPOTS, PIP_SPOTS = WIDE_PIP;
  function pickSpots() {
    const narrow = st.W < 1000;
    SPOTS = narrow ? TOY_MID : WIDE_SPOTS;
    PIP_SPOTS = narrow ? TOYS.map((t, i) => TOY_MID[i] - (t.box[2] / 2 + 70) * (i === 0 ? -1 : 1)) : WIDE_PIP;
  }

  let st = null, S = null; // the stage and the scene, kept between visits so home opens instantly

  /* ---------------- baked layers ---------------- */
  function layer(p, y0, y1, ops, z) {
    const tiles = new Map();
    const node = new E.Node({ z, parallax: 0 });
    node.flush = () => tiles.clear();
    node.draw = function (g) {
      const res = st.res, TW = 1024 / res; // tile width in units: 1024 device px
      const off = st.cam.x * p;
      const i0 = Math.floor(off / TW), i1 = Math.floor((off + st.W) / TW);
      let made = 0;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = i0; i <= i1; i++) {
        let t = tiles.get(i);
        if (!t) {
          if (made++ > 1 && node.ready) continue; // spread the work over frames once the first view is up
          t = document.createElement('canvas'); t.width = 1024; t.height = Math.ceil((y1 - y0) * res);
          const tg = t.getContext('2d'); tg.setTransform(res, 0, 0, res, -i * TW * res, -y0 * res);
          const x0 = i * TW, x1 = x0 + TW;
          for (const op of ops) if (op.x1 >= x0 - 40 && op.x0 <= x1 + 40) op.fn(tg, res, x0, x1);
          tiles.set(i, t);
        }
        g.drawImage(t, Math.round((i * TW - off) * res), Math.round(y0 * res));
      }
      g.restore();
      node.ready = true;
      for (const k of tiles.keys()) if (k < i0 - 2 || k > i1 + 2) tiles.delete(k);
    };
    return node;
  }
  const Lw = (p) => (WORLD - st.W) * p + st.W;

  /* ---------------- scene ---------------- */
  function build() {
    const C = A.c;
    pickSpots();
    const H = st.H, G = H - 250; // ground line
    S = { G, toys: [], spots: SPOTS, pip: null, nodes: [] };
    st.root.children.slice().forEach((n) => n.remove());
    A.setRes(st.res);
    const add = (n) => st.add(n);

    /* sky */
    st.background = function (g) {
      const sky = { day: ['#9FCBD8', '#CFE6E8', '#F3E9D6'], dusk: ['#7F7FB0', '#E3A58E', '#F6D2A2'], night: ['#151C3B', '#27305C', '#47487A'] }[A.mood];
      const gr = g.createLinearGradient(0, 0, 0, G);
      gr.addColorStop(0, sky[0]); gr.addColorStop(0.62, sky[1]); gr.addColorStop(1, sky[2]);
      g.fillStyle = gr; g.fillRect(0, 0, st.W, st.H);
    };
    if (A.mood === 'night') {
      const r = A.rng(3), stars = [];
      for (let i = 0; i < 90; i++) stars.push([r() * (st.W + 200), r() * (G - 300), 0.8 + r() * 2.2, r() * 6]);
      add({ z: 1, parallax: 0.02, draw(g) { for (const [x, y, rr, ph] of stars) { g.globalAlpha = 0.45 + 0.45 * Math.sin(st.t * 1.3 + ph); g.beginPath(); g.arc(x, y, rr, 0, 7); g.fillStyle = '#FFF6DA'; g.fill(); } g.globalAlpha = 1; } });
    }
    const orb = add({ z: 2, parallax: 0.04, x: st.W * 0.8, y: A.mood === 'dusk' ? G - 260 : 150 });
    orb.draw = function (g) {
      if (A.mood === 'night') {
        const gl = g.createRadialGradient(0, 0, 20, 0, 0, 160); gl.addColorStop(0, 'rgba(255,240,200,.25)'); gl.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gl; g.fillRect(-160, -160, 320, 320);
        g.beginPath(); g.arc(0, 0, 48, 0, 7); g.fillStyle = '#F6EBCB'; g.fill();
        g.beginPath(); g.arc(22, -12, 44, 0, 7); g.fillStyle = '#27305C'; g.globalAlpha = 0.92; g.fill(); g.globalAlpha = 1;
      } else {
        const r0 = A.mood === 'dusk' ? 74 : 56, col = A.mood === 'dusk' ? '#F2A266' : '#F6C453';
        const gl = g.createRadialGradient(0, 0, r0 * 0.6, 0, 0, r0 * 3); gl.addColorStop(0, A.alpha(col, 0.35)); gl.addColorStop(1, A.alpha(col, 0)); g.fillStyle = gl; g.fillRect(-r0 * 3, -r0 * 3, r0 * 6, r0 * 6);
        g.save(); g.rotate(st.t * 0.05);
        for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(-6, r0 + 12); g.lineTo(0, r0 + 30); g.lineTo(6, r0 + 12); g.fillStyle = A.alpha(col, 0.6); g.fill(); }
        g.restore();
        g.beginPath(); A.blob(g, 0, 0, r0, r0, 0.02, 4, 12); A.paper(g, st.res, col, { shadow: 0, light: 0.06, box: { x: -r0, y: -r0, w: r0 * 2, h: r0 * 2 } });
      }
    };
    // clouds
    const cr = A.rng(12);
    for (let i = 0; i < 6; i++) {
      const w = 160 + cr() * 160, sp = A.sprite('cloud' + i, [-w * 0.6, -w * 0.45, w * 1.2, w * 0.5], (g, s) => V.cloud(g, s, w, 20 + i));
      const n = add({ z: 3, parallax: 0.1, sprite: sp, x: cr() * Lw(0.1), y: 90 + cr() * Math.max(80, G - 520), speed: 5 + cr() * 7 });
      n.alpha = A.mood === 'night' ? 0.55 : 0.95;
      n.update = (dt) => { n.x += n.speed * dt; if (n.x > Lw(0.1) + 300) n.x = -300; };
    }

    /* far hills */
    const pf = 0.3, wf = Lw(pf), far = [];
    far.push({ x0: -1e5, x1: 1e5, fn: (g, s, x0, x1) => V.hill(g, s, x0 - 30, x1 + 30, G - 230, 150, 1100, 11, C('far2'), G + 30) });
    const mill = { x: wf * 0.58 }; mill.y = V.hillY(mill.x, G - 230, 150, 1100, 11) + 10;
    far.push({ x0: mill.x - 80, x1: mill.x + 80, fn: (g, s) => V.windmillBody(g, s, mill.x, mill.y) });
    const fh = A.rng(5);
    for (let x = 60; x < wf; x += 240 + fh() * 380) { const hx = x, hy = V.hillY(hx, G - 230, 150, 1100, 11) + 8, k = 0.7 + fh() * 0.3; if (Math.abs(hx - mill.x) > 120) far.push({ x0: hx - 50, x1: hx + 50, fn: (g, s) => V.farmhouse(g, s, hx, hy, k) }); }
    far.push({ x0: -1e5, x1: 1e5, fn: (g, s, x0, x1) => V.hill(g, s, x0 - 30, x1 + 30, G - 140, 100, 800, 12, C('far'), G + 30) });
    const ft = A.rng(6);
    for (let x = 20; x < wf; x += 50 + ft() * 120) { const tx = x, ty = V.hillY(tx, G - 140, 100, 800, 12) + 6, sz = 30 + ft() * 26, sd = Math.floor(ft() * 1e6), kind = ft() > 0.7 ? 'tall' : 'lolly'; far.push({ x0: tx - sz, x1: tx + sz, fn: (g, s) => V.tree(g, s, tx, ty, sz, sd, kind) }); }
    add(layer(pf, G - 420, G + 30, far, 5));
    const sails = add({ z: 6, parallax: pf, x: mill.x, y: mill.y - 118, sprite: A.sprite('sails', [-80, -80, 160, 160], V.windmillSails) });
    sails.update = (dt) => (sails.rot += dt * 0.5);

    /* mid hills */
    const pm = 0.62, wm = Lw(pm), mid = [];
    mid.push({ x0: -1e5, x1: 1e5, fn: (g, s, x0, x1) => V.hill(g, s, x0 - 30, x1 + 30, G - 70, 120, 700, 21, C('mid2'), G + 40) });
    const mt = A.rng(8);
    for (let x = 40; x < wm; x += 90 + mt() * 200) { const tx = x, ty = V.hillY(tx, G - 70, 120, 700, 21) + 10, sz = 70 + mt() * 60, sd = Math.floor(mt() * 1e6), kind = ['lolly', 'round', 'tall'][Math.floor(mt() * 3)]; mid.push({ x0: tx - sz, x1: tx + sz, fn: (g, s) => V.tree(g, s, tx, ty, sz, sd, kind) }); }
    mid.push({ x0: -1e5, x1: 1e5, fn: (g, s, x0, x1) => V.hill(g, s, x0 - 30, x1 + 30, G - 18, 54, 520, 22, C('mid'), G + 40) });
    for (let x = 30; x < wm; x += 140 + mt() * 260) { const bx = x, by = V.hillY(bx, G - 18, 54, 520, 22) + 14, bw = 70 + mt() * 50, sd = Math.floor(mt() * 1e6); mid.push({ x0: bx - bw, x1: bx + bw, fn: (g, s) => V.bush(g, s, bx, by, bw, sd) }); }
    add(layer(pm, G - 330, G + 40, mid, 7));

    /* ground: meadow, path, landmarks */
    const ground = [];
    const meadowY = (x) => G + 4 - 9 * Math.sin(x / 260) - 5 * Math.sin(x / 97 + 1);
    const pathT = (x) => G + 74 + 6 * Math.sin(x / 170), pathB = (x) => G + 130 + 7 * Math.sin(x / 213 + 1);
    ground.push({ x0: -1e5, x1: 1e5, fn: (g, s, x0, x1) => {
      const xs = []; for (let x = x0 - 30; x <= x1 + 46; x += 16) xs.push(x);
      g.save(); g.beginPath(); g.moveTo(xs[0], H + 10); xs.forEach((x) => g.lineTo(x, meadowY(x))); g.lineTo(xs[xs.length - 1], H + 10); g.closePath();
      g.shadowColor = 'rgba(46,40,70,.2)'; g.shadowBlur = 14 * s; g.shadowOffsetY = -2 * s; g.fillStyle = C('meadow'); g.fill(); g.restore();
      g.beginPath(); g.moveTo(xs[0], H + 10); xs.forEach((x) => g.lineTo(x, meadowY(x))); g.lineTo(xs[xs.length - 1], H + 10); g.closePath();
      A.paper(g, s, C('meadow'), { shadow: 0, box: { x: 0, y: G, w: 0, h: H - G }, light: 0.035 });
      // path
      g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(x, pathT(x)) : g.moveTo(x, pathT(x)))); for (let i = xs.length - 1; i >= 0; i--) g.lineTo(xs[i], pathB(xs[i])); g.closePath();
      A.paper(g, s, C('path'), { shadow: 0.5, box: { x: 0, y: G + 70, w: 0, h: 64 }, light: 0.04, grain: 0.3 });
      const r = A.rng(Math.floor(x0) + 99);
      for (let i = 0; i < 18; i++) { const px = x0 + r() * (x1 - x0), py = pathT(px) + 10 + r() * 40; g.beginPath(); g.ellipse(px, py, 4 + r() * 6, 2.5 + r() * 3, 0, 0, 7); g.fillStyle = A.alpha(A.shade(C('path'), -0.12), 0.7); g.fill(); }
      // the lower meadow is a touch darker: nearer, in the trees' shade
      g.save(); g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(x, pathB(x) + 6) : g.moveTo(x, pathB(x) + 6))); g.lineTo(xs[xs.length - 1], H + 10); g.lineTo(xs[0], H + 10); g.closePath(); g.fillStyle = A.alpha(A.shade(C('meadow'), -0.06), 0.55); g.fill(); g.restore();
    } });
    const LY = G + 36;
    const lm = (x, fn, half) => ground.push({ x0: x - half, x1: x + half, fn: (g, s) => { g.save(); g.translate(x, LY); fn(g, s); g.restore(); } });
    const gb = A.rng(31);
    for (let x = 80; x < WORLD; x += 120 + gb() * 220) { const bx = x, bw = 60 + gb() * 60, sd = Math.floor(gb() * 1e6); if (![600, 1400, 2330, 3360].some((m) => Math.abs(m - bx) < 260)) ground.push({ x0: bx - bw, x1: bx + bw, fn: (g, s) => V.bush(g, s, bx, LY - 4, bw, sd) }); }
    lm(600, V.school, 240);
    lm(1400, V.tree_, 340);
    ground.push({ x0: 2330 - 300, x1: 2330 + 300, fn: (g, s) => { g.save(); g.translate(2330, G + 8); V.pond(g, s); g.restore(); } });
    lm(3360, V.barn, 320);
    const fl = A.rng(41);
    for (let x = 0; x < WORLD; x += 30 + fl() * 70) { const fx = x, fy = pathB(x) + 30 + fl() * (H - G - 190), sz = 7 + fl() * 5, col = [C('#FBF8F1'), C('#F4D7D0'), C('#F7E3A6'), C('#D9C8E8')][Math.floor(fl() * 4)]; ground.push({ x0: fx - 20, x1: fx + 20, fn: (g, s) => V.flower(g, s, fx, fy, sz, col) }); }
    add(layer(1, G - 740, H, ground, 10));

    /* ambient life */
    const smoke = (x, y, every, col, z, big) => {
      const puffs = []; let tt = 0;
      return add({ z, x, y, update(dt) { tt -= dt; if (tt <= 0) { tt = every; puffs.push({ x: 0, y: 0, r: big ? 10 : 7, a: 0.7, ph: Math.random() * 6 }); } for (const p of puffs) { p.y -= dt * (big ? 30 : 22); p.x += Math.sin(st.t + p.ph) * dt * 8 + dt * 6; p.r += dt * 7; p.a -= dt * 0.16; } while (puffs.length && puffs[0].a <= 0) puffs.shift(); },
        draw(g) { for (const p of puffs) { g.globalAlpha = Math.max(0, p.a); g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fillStyle = col; g.fill(); } g.globalAlpha = 1; } });
    };
    smoke(600 - 129, LY - 386, 1.3, A.mood === 'night' ? '#6B6E93' : '#F1ECE4', 9, true);
    if (A.mood !== 'day') {
      const lx = 1400 + 104, ly = LY - 206;
      add({ z: 11, x: lx, y: ly, draw(g) {
        const f = 0.85 + 0.15 * Math.sin(st.t * 7) * Math.sin(st.t * 3.1);
        const gl = g.createRadialGradient(0, 8, 4, 0, 8, 120 * f); gl.addColorStop(0, A.alpha(A.C.glow, 0.55)); gl.addColorStop(1, A.alpha(A.C.glow, 0)); g.fillStyle = gl; g.fillRect(-130, -120, 260, 260);
      } });
    }
    add({ z: 12, x: 1400 + 104, y: LY - 214, draw(g, s) {
      g.save(); g.rotate(Math.sin(st.t * 1.2) * 0.06);
      A.line(g, A.c('barkDark'), 2, (h) => { h.moveTo(0, 0); h.lineTo(0, 8); });
      g.beginPath(); A.rect(g, -12, 8, 24, 32, 5, 3); g.fillStyle = A.mood === 'day' ? '#EFE4C4' : A.C.glow; g.fill();
      g.beginPath(); A.rect(g, -15, 4, 30, 8, 3, 4); g.fillStyle = A.c('#3E3A48'); g.fill();
      g.beginPath(); A.rect(g, -15, 38, 30, 6, 3, 5); g.fillStyle = A.c('#3E3A48'); g.fill();
      g.restore();
    } });
    // the pond glints
    add({ z: 11, x: 2330, y: G + 8, draw(g) {
      g.strokeStyle = A.alpha('#FFFFFF', A.mood === 'night' ? 0.25 : 0.55); g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const ph = st.t * 0.6 + i * 1.7, k = (Math.sin(ph) + 1) / 2; g.globalAlpha = 0.3 + 0.7 * k; g.beginPath(); const x = -150 + i * 95, y = -16 + (i % 2) * 26; g.moveTo(x - 18 - k * 6, y); g.lineTo(x + 18 + k * 6, y); g.stroke(); }
      g.globalAlpha = 1;
    } });
    if (A.mood === 'night' || A.mood === 'dusk') {
      const flies = []; const rr = A.rng(77);
      for (let i = 0; i < 22; i++) flies.push({ cx: [1400, 2330, 3360, 600][i % 4] + (rr() - 0.5) * 500, cy: G - 60 - rr() * 260, ph: rr() * 6, sp: 0.3 + rr() * 0.5 });
      add({ z: 14, draw(g) { for (const f of flies) { const x = f.cx + Math.sin(st.t * f.sp + f.ph) * 60, y = f.cy + Math.sin(st.t * f.sp * 1.7 + f.ph) * 30, a = 0.5 + 0.5 * Math.sin(st.t * 2.4 + f.ph * 3); const gl = g.createRadialGradient(x, y, 0, x, y, 16); gl.addColorStop(0, `rgba(255,236,150,${0.9 * a})`); gl.addColorStop(1, 'rgba(255,236,150,0)'); g.fillStyle = gl; g.fillRect(x - 16, y - 16, 32, 32); } } });
    } else {
      // two butterflies
      for (let i = 0; i < 2; i++) {
        const cx = [1200, 3000][i], col = [A.C.peach, A.C.marigold][i];
        add({ z: 14, x: cx, y: G - 40, draw(g) {
          const t = st.t + i * 4, x = Math.sin(t * 0.37) * 260, y = Math.sin(t * 0.9) * 50 - Math.abs(Math.sin(t * 0.23)) * 80, flap = Math.abs(Math.sin(t * 11));
          g.save(); g.translate(x, y); g.rotate(Math.cos(t * 0.37) * 0.3);
          for (const side of [-1, 1]) { g.save(); g.scale(side * (0.25 + 0.75 * flap), 1); g.beginPath(); g.ellipse(9, -6, 10, 8, 0.4, 0, 7); g.ellipse(7, 7, 7, 5, -0.4, 0, 7); g.fillStyle = col; g.fill(); g.restore(); }
          g.beginPath(); g.ellipse(0, 0, 2.5, 9, 0, 0, 7); g.fillStyle = A.C.ink; g.fill(); g.restore();
        } });
      }
    }

    /* toys */
    const TY = G + 44;
    for (const t of TOYS) {
      const n = add({ z: 20, x: t.x, y: TY, label: t.title, hit: { x: t.box[0], y: t.box[1], w: t.box[2], h: t.box[3] } });
      n.toy = t;
      n.onTap = () => launch(n);
      const sp = (k, fn, box) => n.add(new E.Node({ sprite: A.sprite(k, box, fn) }));
      if (t.key === 'blocks') { n.add(new E.Node({ sprite: A.sprite('blocks', [-100, -270, 200, 272], V.toys.blocks) })); }
      if (t.key === 'books') sp('books', V.toys.books, [-100, -150, 200, 152]);
      if (t.key === 'car') { n.car = sp('car', V.toys.car, [-110, -200, 320, 202]); }
      if (t.key === 'band') sp('band', V.toys.band, [-126, -170, 340, 172]);
      if (t.key === 'easel') sp('easel', V.toys.easel, [-150, -266, 290, 268]);
      if (t.key === 'letters') {
        sp('chalk', V.toys.chalkboard, [-100, -240, 200, 242]);
        const a = n.add(new E.Node({ x: 140, y: 0, sprite: A.sprite('letterA', [-70, -150, 140, 152], V.toys.letterA) }));
        const blink = blinker();
        a.add(new E.Node({ draw(g) { const b = blink(); for (const ex of [-14, 16]) { g.beginPath(); g.ellipse(ex, -96, 7, 9 * Math.max(0.12, 1 - b), 0, 0, 7); g.fillStyle = A.C.ink; g.fill(); if (b < 0.5) { g.beginPath(); g.arc(ex + 2.5, -99, 2.6, 0, 7); g.fillStyle = '#fff'; g.fill(); } } } }));
        a.update = () => { a.sy = 1 + Math.sin(st.t * 2.2) * 0.025; a.sx = 1 - Math.sin(st.t * 2.2) * 0.02; };
        n.hop = a;
      }
      if (t.key === 'kitchen') {
        sp('stallBack', V.toys.stallBack, [-152, -336, 304, 230]);
        const blink = blinker(); const m = n.add(new E.Node({ x: -30, y: -96, sx: 0.66, sy: 0.66 }));
        m.state = {}; m.draw = (g, s) => { m.state.blink = blink(); A.monster(g, s, m.state); };
        m.update = () => { m.y = -96 + Math.sin(st.t * 1.6) * 4; m.state.look = Math.sin(st.t * 0.4); };
        sp('stallFront', V.toys.stallFront, [-140, -190, 280, 192]);
        n.monster = m;
        smokeOn(n, 70, -196);
      }
      // a bobbing "play" tag marks the things that open, so scenery is not mistaken for a toy
      const ph = S.toys.length * 0.9, tx = t.box[0] + t.box[2] / 2, ty = t.box[1] - 46;
      n.add(new E.Node({ z: 9, x: tx, y: ty,
        update() { this.y = ty + Math.sin(st.t * 2.4 + ph) * 7; const k = 1 + Math.max(0, Math.sin(st.t * 2.4 + ph)) * 0.06; this.sx = this.sy = k; },
        draw(g, s) {
          g.beginPath(); g.moveTo(-11, 30); g.lineTo(0, 46); g.lineTo(11, 30); g.closePath(); g.fillStyle = A.shade(A.C.tomato, -0.06); g.fill();
          g.beginPath(); A.blob(g, 0, 0, 36, 36, 0.02, 7, 12); A.paper(g, s, A.C.tomato, { shadow: 1, light: 0.08, box: { x: -36, y: -36, w: 72, h: 72 } });
          g.beginPath(); A.cut(g, [[-10, -16], [18, 0], [-10, 16]], 5, 0.4, 2); g.fillStyle = '#FBF6EC'; g.fill();
        } }));
      n.hit = { x: t.box[0], y: t.box[1] - 90, w: t.box[2], h: t.box[3] + 90 };
      S.toys.push(n);
    }
    // music notes drifting up from the band
    const band = S.toys.find((n) => n.toy.key === 'band');
    const notes = []; let nt = 0;
    band.add(new E.Node({ update(dt) { nt -= dt; if (nt <= 0) { nt = 2.2; notes.push({ x: -60 + Math.random() * 120, y: -150, a: 1, ph: Math.random() * 6, col: [A.C.tomato, A.C.teal, A.C.plum, A.C.blue][notes.length % 4] }); } for (const q of notes) { q.y -= dt * 34; q.x += Math.sin(st.t * 2 + q.ph) * dt * 20; q.a -= dt * 0.28; } while (notes.length && notes[0].a <= 0) notes.shift(); },
      draw(g) { for (const q of notes) { g.globalAlpha = Math.max(0, Math.min(1, q.a * 1.5)); g.save(); g.translate(q.x, q.y); g.rotate(-0.2); g.beginPath(); g.ellipse(0, 0, 9, 7, -0.4, 0, 7); g.fillStyle = A.ct(q.col); g.fill(); g.fillRect(6, -30, 3.5, 30); g.beginPath(); g.moveTo(9.5, -30); g.quadraticCurveTo(22, -24, 18, -12); g.lineWidth = 3.5; g.strokeStyle = A.ct(q.col); g.stroke(); g.restore(); } g.globalAlpha = 1; } }));

    /* Pip */
    const pip = add({ z: 30, x: PIP_SPOTS[0], y: G + 112, dir: 1, hopT: 0, target: PIP_SPOTS[0], state: {}, label: 'Pip', hit: { x: -70, y: -150, w: 140, h: 156 } });
    const pb = blinker();
    pip.draw = (g, s) => { g.save(); g.scale(pip.dir * 0.95, 0.95); pip.state.blink = pb(); pip.state.leaf = Math.sin(st.t * 1.7) * 0.08; A.pip(g, s, pip.state); g.restore(); };
    pip.update = function (dt) {
      const dx = pip.target - pip.x;
      if (Math.abs(dx) > 4) {
        pip.dir = dx > 0 ? 1 : -1;
        pip.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 430);
        pip.hopT += dt * 7.5;
        const h = Math.abs(Math.sin(pip.hopT));
        pip.y = G + 112 - h * 34; pip.state.squash = (h < 0.25 ? -0.08 : 0.05);
        pip.state.mouth = 'smile';
      } else {
        pip.y += (G + 112 - pip.y) * Math.min(1, dt * 12); pip.hopT = 0;
        pip.state.squash = (pip.cheer || 0) > 0 ? -0.06 + Math.sin(st.t * 18) * 0.04 : Math.sin(st.t * 2) * 0.012;
        if (pip.cheer > 0) { pip.cheer -= dt; pip.state.wave = Math.sin(st.t * 12) * 0.5 + 0.5; pip.state.mouth = 'open'; } else { pip.state.wave = 0; pip.state.mouth = 'smile'; }
      }
    };
    pip.onTap = () => { pip.cheer = 1.4; K.sfx.sparkle(); const nm = (K.s.name || '').trim(); K.sayBest([nm ? `Hi ${nm}! What shall we play?` : '', 'Hi! What shall we play?'].filter(Boolean)); };
    S.pip = pip;

    /* near grass, in front of everything */
    const pg = 1.25, fgOps = [], fr = A.rng(51);
    for (let x = -40; x < Lw(pg) + 80; x += 70 + fr() * 140) { const tx = x, h = 46 + fr() * 40, sd = Math.floor(fr() * 1e6), col = fr() > 0.5 ? A.c('leafDark') : A.c('#5E9256'); fgOps.push({ x0: tx - 60, x1: tx + 60, fn: (g, s) => V.tuft(g, s, tx, H + 6, h, sd, col) }); if (fr() > 0.7) { const fx = tx + 30; fgOps.push({ x0: fx - 20, x1: fx + 20, fn: (g, s) => V.flower(g, s, fx, H + 4, 9, A.c('#FBF8F1')) }); } }
    add(layer(pg, H - 110, H, fgOps, 40));

    /* soft vignette */
    add({ z: 50, ui: true, draw(g) { const gr = g.createRadialGradient(st.W / 2, st.H * 0.45, Math.min(st.W, st.H) * 0.45, st.W / 2, st.H * 0.45, Math.max(st.W, st.H) * 0.85); gr.addColorStop(0, 'rgba(40,30,60,0)'); gr.addColorStop(1, A.mood === 'night' ? 'rgba(10,10,30,.35)' : 'rgba(60,40,70,.16)'); g.fillStyle = gr; g.fillRect(0, 0, st.W, st.H); } });

    chrome();
    if (introCb) intro(introCb);
  }
  let introCb = null;

  function smokeOn(n, x, y) {
    const puffs = []; let tt = 0;
    n.add(new E.Node({ update(dt) { tt -= dt; if (tt <= 0) { tt = 0.9; puffs.push({ x: (Math.random() - 0.5) * 30, y: 0, r: 6, a: 0.6, ph: Math.random() * 6 }); } for (const p of puffs) { p.y -= dt * 26; p.x += Math.sin(st.t * 2 + p.ph) * dt * 10; p.r += dt * 6; p.a -= dt * 0.22; } while (puffs.length && puffs[0].a <= 0) puffs.shift(); },
      draw(g) { g.save(); g.translate(x, y); for (const p of puffs) { g.globalAlpha = Math.max(0, p.a); g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fillStyle = '#FBF8F1'; g.fill(); } g.restore(); g.globalAlpha = 1; } }));
  }
  /** Returns a function giving 0..1 eyelid closure: a blink every 3-6 s. */
  function blinker() { let next = 1 + Math.random() * 4, t0 = -1; return () => { const t = st.t; if (t0 < 0 && t > next) t0 = t; if (t0 >= 0) { const k = (t - t0) / 0.16; if (k >= 1) { t0 = -1; next = t + 3 + Math.random() * 3; return 0; } return Math.sin(k * Math.PI); } return 0; }; }

  /* ---------------- player badge and grown-ups button ---------------- */
  function chrome() {
    const pr = K.players.current();
    const face = A.faceId(K.s.avatar);
    const name = (K.s.name || '').trim();
    const badge = st.add({ ui: true, z: 60, x: 78, y: 78, label: 'Change player', hit: { x: -56, y: -56, w: 112 + (name ? 40 + name.length * 19 : 0), h: 112 } });
    const fb = blinker();
    badge.draw = (g, s) => {
      if (name) {
        g.font = `700 36px ${A.FONT_TITLE}`; const tw = g.measureText(name).width;
        g.beginPath(); A.rect(g, 10, -30, tw + 82, 60, 30, 3, 0.6); A.paper(g, s, '#FBF6EC', { shadow: 0.9, box: { x: 10, y: -30, w: tw + 82, h: 60 }, light: 0.03 });
        g.fillStyle = A.C.ink; g.textBaseline = 'middle'; g.fillText(name, 66, 2);
      }
      g.beginPath(); g.arc(0, 0, 52, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 1, light: 0.03, box: { x: -52, y: -52, w: 104, h: 104 } });
      g.save(); g.scale(0.82, 0.82); const m = A.mood; A.mood = 'day'; A.face(g, s * 0.82, face, { blink: fb() }); A.mood = m; g.restore();
    };
    badge.onTap = () => { K.sfx.pop(); K.who(); };
    void pr;
    const gear = st.add({ ui: true, z: 60, x: st.W - 66, y: 66, label: 'Grown-ups: press and hold', hit: { x: -40, y: -40, w: 80, h: 80 }, hold: 0, pressable: false });
    let holding = false;
    gear.onDown = () => { holding = true; };
    gear.onUp = () => { holding = false; };
    gear.onTap = (p) => { if (!p) K.parents(); }; // keyboard / screen reader: open straight away
    gear.update = (dt) => { gear.hold = holding ? gear.hold + dt / 1.5 : Math.max(0, gear.hold - dt * 3); if (gear.hold >= 1) { holding = false; gear.hold = 0; K.parents(); } };
    gear.draw = (g, s) => {
      g.beginPath(); g.arc(0, 0, 34, 0, 7); A.paper(g, s, A.alpha('#FBF6EC', 0.9), { shadow: 0.7, light: 0, grain: 0.1 });
      g.save(); g.fillStyle = A.alpha(A.C.ink, 0.45);
      g.beginPath(); for (let i = 0; i < 8; i++) { g.save(); g.rotate((i * Math.PI) / 4); g.rect(-5, -21, 10, 9); g.restore(); } g.fill();
      g.beginPath(); g.arc(0, 0, 15, 0, Math.PI * 2); g.moveTo(6, 0); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill('evenodd'); g.restore();
      if (gear.hold > 0) { g.beginPath(); g.arc(0, 0, 40, -Math.PI / 2, -Math.PI / 2 + gear.hold * Math.PI * 2); g.strokeStyle = A.C.tomato; g.lineWidth = 6; g.lineCap = 'round'; g.stroke(); }
    };
  }

  /* ---------------- title card (first screen) ---------------- */
  function intro(onPlay) {
    const card = st.add({ ui: true, z: 70, x: st.W / 2, y: st.H * 0.3 });
    card.draw = (g, s) => {
      g.save(); g.rotate(-0.025);
      g.font = `800 ${Math.min(108, st.W / 8)}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = g.measureText("Pip's Playhouse").width, w = tw + 110, h = 150;
      for (const side of [-1, 1]) { g.beginPath(); A.cut(g, [[side * (w / 2 - 20), -40], [side * (w / 2 + 60), -30], [side * (w / 2 + 36), 10], [side * (w / 2 + 64), 52], [side * (w / 2 - 20), 46]], 6, 1, side + 3); A.paper(g, s, A.shade(A.C.tomato, -0.08), { shadow: 0.8 }); }
      g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 18, 5, 1.2); A.paper(g, s, '#FBF6EC', { shadow: 1.2, depth: 1.4, box: { x: -w / 2, y: -h / 2, w, h }, light: 0.04 });
      g.fillStyle = A.C.ink; g.fillText("Pip's Playhouse", 0, 6);
      g.restore();
    };
    const play = st.add({ ui: true, z: 71, x: st.W / 2, y: st.H * 0.3 + 170, label: 'Play', hitR: 76 });
    play.update = () => { const k = 1 + Math.sin(st.t * 3) * 0.035; if (!play.tweens.length) { play.sx = play.sy = k; } };
    play.draw = (g, s) => {
      g.beginPath(); A.blob(g, 0, 0, 72, 72, 0.02, 7, 12); A.paper(g, s, A.C.tomato, { shadow: 1.2, depth: 1.3, light: 0.08, box: { x: -72, y: -72, w: 144, h: 144 } });
      g.beginPath(); A.cut(g, [[-20, -32], [36, 0], [-20, 32]], 8, 0.5, 2); g.fillStyle = '#FBF6EC'; g.fill();
    };
    let gone = false;
    const go = () => { if (gone) return; gone = true; introCb = null; card.to({ y: -200, alpha: 0 }, { dur: 0.45, ease: 'inOut' }); play.to({ sx: 0, sy: 0, alpha: 0 }, { dur: 0.3, ease: 'inOut' }).then(() => { card.remove(); play.remove(); }); onPlay(); };
    play.onTap = go;
    return { go };
  }

  /* ---------------- camera ---------------- */
  let drag = null, vel = 0, settle = null;
  function maxCam() { return Math.max(0, WORLD - st.W); }
  function nearestSpot(cx) { const mid = cx + st.W / 2; let b = 0; SPOTS.forEach((x, i) => { if (Math.abs(x - mid) < Math.abs(SPOTS[b] - mid)) b = i; }); return b; }
  function goSpot(i) { settle = K.clamp(SPOTS[i] - st.W / 2, 0, maxCam()); if (S && S.pip) S.pip.target = PIP_SPOTS[i]; }
  function camFrame(dt) {
    if (!S) return;
    if (!drag) {
      if (Math.abs(vel) > 40) { st.cam.x += vel * dt; vel *= Math.exp(-3.2 * dt); settle = null; if (Math.abs(vel) <= 40) goSpot(nearestSpot(st.cam.x)); }
      else if (settle != null) { st.cam.x += (settle - st.cam.x) * Math.min(1, dt * 4.5); if (Math.abs(settle - st.cam.x) < 0.5) { st.cam.x = settle; settle = null; } }
    }
    const lo = 0, hi = maxCam();
    if (st.cam.x < lo) { st.cam.x += (lo - st.cam.x) * Math.min(1, dt * 10); vel = 0; }
    if (st.cam.x > hi) { st.cam.x += (hi - st.cam.x) * Math.min(1, dt * 10); vel = 0; }
  }
  function wire() {
    st.ondown = (p) => { drag = { x: p.x, cam: st.cam.x, last: p.x, t: performance.now(), on: false }; vel = 0; };
    st.onmove = (p) => {
      if (!drag) return;
      if (!drag.on && Math.abs(p.x - drag.x) > 14) { drag.on = true; st.cancelTaps(); }
      if (drag.on) { const now = performance.now(), dtt = Math.max(1, now - drag.t) / 1000; const v = -(p.x - drag.last) / dtt; vel = vel * 0.6 + v * 0.4; drag.last = p.x; drag.t = now; let x = drag.cam - (p.x - drag.x); if (x < 0) x *= 0.4; if (x > maxCam()) x = maxCam() + (x - maxCam()) * 0.4; st.cam.x = x; }
    };
    st.onup = () => {
      if (!drag) return; const was = drag.on, wasCam = drag.cam; drag = null;
      if (!was) { vel = 0; return; }
      // a flick goes to the next stop that way; a slow drag settles on the nearest
      const v = vel; vel = 0;
      let i = nearestSpot(st.cam.x);
      if (Math.abs(v) >= 120) { const cur = nearestSpot(wasCam); i = K.clamp(cur + (v > 0 ? 1 : -1), 0, SPOTS.length - 1); if (Math.abs(nearestSpot(st.cam.x) - cur) > 1) i = nearestSpot(st.cam.x); }
      goSpot(i);
    };
    st.canvas.addEventListener('wheel', (e) => { e.preventDefault(); st.cam.x += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / st.unit; vel = 0; clearTimeout(wire.wt); wire.wt = setTimeout(() => goSpot(nearestSpot(st.cam.x)), 160); settle = null; }, { passive: false });
    addEventListener('keydown', (e) => { if (!st.alive) return; const i = nearestSpot(st.cam.x); if (e.key === 'ArrowRight') goSpot(Math.min(SPOTS.length - 1, i + 1)); if (e.key === 'ArrowLeft') goSpot(Math.max(0, i - 1)); });
  }

  /* ---------------- launching a toy ---------------- */
  let launching = false;
  function launch(n) {
    if (launching || (K.valley.introOpen)) return;
    launching = true;
    const t = n.toy;
    K.sfx.pop();
    if (n.monster) { n.monster.state.mouth = 'open'; }
    if (n.hop) n.hop.to({ y: -40 }, { dur: 0.16, ease: 'out' }).then(() => n.hop.to({ y: 0 }, { dur: 0.3, ease: 'back' }));
    if (n.car) n.car.to({ x: 18 }, { dur: 0.2 }).then(() => n.car.to({ x: 0 }, { dur: 0.4, ease: 'back' }));
    if (t.key === 'band') [523, 659, 784].forEach((f, i) => setTimeout(() => K.sfx.note(f, 0.4), i * 110));
    S.pip.target = n.x - 40 * Math.sign(n.x - S.pip.x || 1);
    const far = Math.abs(S.pip.x - n.x) > 400;
    setTimeout(() => {
      launching = false;
      if (n.monster) n.monster.state.mouth = 'smile';
      let id = t.id && K.activities.some((x) => x.id === t.id) ? t.id : t.legacy;
      if (id === 'story' && !K.activities.some((x) => x.id === 'story')) { const st2 = K.activities.filter((a) => a.group === 'stories'); const seen = K.s.done || {}; const fresh = st2.filter((a) => !seen[a.id]); id = (K.pick(fresh.length ? fresh : st2) || {}).id; }
      K.go(id);
    }, far ? 700 : 480);
  }

  /* ---------------- public ---------------- */
  K.valley = {
    introOpen: false,
    /** Show the valley in host. opts.intro(fn): show the title card; fn runs when Play is pressed. */
    show(host, ctx, opts) {
      opts = opts || {};
      const mood = A.moodFor();
      if (!st) {
        st = E.stage(host, { minW: 560 }); // phones in portrait see less of the valley, but bigger
        st.canvas.setAttribute('aria-hidden', 'true');
        st.onresize = () => { if (S) { A.setRes(st.res); build(); goSpot(nearestSpot(st.cam.x)); st.cam.x = settle == null ? st.cam.x : settle; } };
        wire();
        A.mood = mood; build();
        goSpot(0); st.cam.x = settle; settle = null;
        // Fonts may arrive after the first paint: redraw the lettering once they are in.
        A.fontsReady().then(() => { A.flush(); build(); });
      } else {
        st.resume(host);
        if (mood !== A.mood) { A.mood = mood; A.flush(); build(); }
      }
      const moodTimer = setInterval(() => { const m = A.moodFor(); if (m !== A.mood) { A.mood = m; A.flush(); build(); } }, 60000);
      st.onframe = camFrame;
      ctx.onExit(() => { clearInterval(moodTimer); st.pause(); });
      launching = false;
      for (const n of st.root.children.slice()) if (n.z >= 70) n.remove();
      if (opts.intro) { K.valley.introOpen = true; introCb = () => { K.valley.introOpen = false; opts.intro(); }; intro(introCb); }
      else { K.valley.introOpen = false; introCb = null; }
      return st;
    },
  };
})();
