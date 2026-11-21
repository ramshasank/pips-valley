/* Jigsaw — puzzles cut from the valley's own pictures.
   A scene (a background with a few friends on it) is composed on a hidden canvas and cut into pieces.
   Drag a piece near its place and it locks with a click. A piece dropped in the wrong part of the board
   wobbles and slides back to the tray. After a while a "show me" lamp appears: it points one piece home.
   When the last piece is in, the picture comes alive for a moment (the friends hop), then three new
   pictures are offered.

   Level 1: 2 x 2 (then 3 x 2) soft-edged pieces, a pale guide picture, a very generous snap.
   Level 2: 3 x 3 (then 4 x 3) with real knobs and sockets, pale guide.
   Level 3: 4 x 4 (then 5 x 4), no guide, only a small reference picture (tap it for a peek), pieces scattered. */
(function () {
  'use strict';
  const A = K.art;
  const SIZES = [[[2, 2], [3, 2]], [[3, 3], [4, 3]], [[4, 4], [5, 4]]];
  const SNAP = [0.62, 0.44, 0.36];
  /* Scenes: x = middle, y = feet, h = height, all as fractions of the picture. move: hop | float | sway */
  const C = (pic, x, y, h, move, col) => ({ pic, x, y, h, move: move || 'hop', col: col || '#E8664A' });
  const SCENES = [
    { id: 'meadow', say: 'A sunny day in the meadow!', bg: 'bobo/bg-day', sky: ['#4FA8E8', '#BFE3F5'], ground: '#9BCB3C', items: [C('bobo/rainbow', 0.5, 0.56, 0.44, 'float', '#F2B33D'), C('toot/sun', 0.13, 0.3, 0.24, 'sway', '#F6C453'), C('bobo/bobo', 0.24, 0.93, 0.46, 'hop', '#B98558'), C('bobo/bunny', 0.5, 0.9, 0.4, 'hop', '#FBF6EC'), C('bobo/fox', 0.74, 0.94, 0.42, 'hop', '#E8864A'), C('bobo/frog', 0.92, 0.95, 0.26, 'hop', '#6FA65F')] },
    { id: 'night', say: 'A starry night!', bg: 'star/bg-night', sky: ['#1B2380', '#2A3A9A'], ground: '#1F7A5C', items: [C('star/moon', 0.84, 0.36, 0.3, 'sway', '#F7E3A6'), C('star/house', 0.24, 0.8, 0.44, 'none', '#C9553F'), C('star/star-happy', 0.5, 0.36, 0.26, 'float', '#F6C453'), C('star/owl', 0.52, 0.92, 0.32, 'hop', '#B98558'), C('star/cat', 0.72, 0.95, 0.34, 'hop', '#F0923B'), C('star/panda', 0.9, 0.93, 0.34, 'hop', '#FBF6EC')] },
    { id: 'snow', say: 'A snowy day!', bg: 'tales/bg-snow', sky: ['#A9C6E8', '#D3E3F5'], ground: '#F3F7FC', items: [C('tales/snowman', 0.26, 0.9, 0.5, 'sway', '#FBF8F1'), C('tales/bunny-happy', 0.52, 0.92, 0.38, 'hop', '#EFE8DA'), C('tales/fox-happy', 0.76, 0.93, 0.4, 'hop', '#E8864A'), C('tales/gift', 0.93, 0.95, 0.18, 'sway', '#DE4E46'), C('tales/snowball', 0.08, 0.94, 0.12, 'hop', '#FFFFFF')] },
    { id: 'space', say: 'A trip to space!', bg: 'star/bg-space', sky: ['#1A1740', '#35307A'], ground: '#35307A', flat: true, items: [C('star/moon', 0.16, 0.44, 0.32, 'sway', '#F7E3A6'), C('star/rocket-riders', 0.5, 0.92, 0.72, 'float', '#DE4E46'), C('star/ministar', 0.82, 0.3, 0.17, 'float', '#F6C453'), C('star/star-wink', 0.84, 0.86, 0.3, 'float', '#F6C453'), C('star/star', 0.17, 0.9, 0.17, 'float', '#F6C453')] },
    { id: 'rain', say: 'A rainy day!', bg: 'bobo/bg-rain', sky: ['#8FA6B8', '#C5D3DC'], ground: '#7FAE6A', items: [C('bobo/cloud', 0.24, 0.3, 0.22, 'float', '#EEF2F5'), C('bobo/puddle', 0.44, 0.97, 0.13, 'none', '#86BCD0'), C('bobo/bobo-mud', 0.36, 0.92, 0.46, 'hop', '#B98558'), C('bobo/frog', 0.62, 0.94, 0.3, 'hop', '#6FA65F'), C('tales/umbrella', 0.84, 0.9, 0.42, 'sway', '#DE4E46')] },
    { id: 'evening', say: 'A train at sunset!', bg: 'toot/bg-eve', sky: ['#7B62B8', '#F2A07A'], ground: '#6FA043', items: [C('toot/shed', 0.8, 0.8, 0.4, 'none', '#C9553F'), C('tales/kite', 0.2, 0.42, 0.3, 'float', '#DE4E46'), C('toot/toot-happy', 0.4, 0.95, 0.42, 'hop', '#2F8F8A'), C('toot/flowers', 0.93, 0.97, 0.2, 'sway', '#EE8FA8')] },
  ];
  const T = {
    start: 'Put the picture together!', drag: 'Drag a piece to its place.', corners: 'Start with the corners.',
    noGuide: 'This time there is no picture underneath. Look at the little picture.',
    miss: ['Not there. Try another spot.', 'Look at the colours on the edges.'], here: 'This piece goes here.',
    half: 'Halfway there!', last: 'One piece to go!', pick: 'Pick a new picture!', lamp: 'Tap the lamp for help.',
  };
  const lines = () => [T.start, T.drag, T.corners, 'This time there is no picture underneath.', 'Look at the little picture.', 'Not there.', 'Try another spot.', T.miss[1], T.here, T.half, T.last, T.pick, T.lamp, ...SCENES.map((s) => s.say)];

  /* ---------------- pictures ---------------- */
  const IM = {};
  function pic(name) {
    let o = IM[name];
    if (!o) { const im = new Image(); o = IM[name] = { im, ok: false }; o.p = new Promise((res) => { im.onload = () => { o.ok = true; res(true); }; im.onerror = () => res(false); }); im.src = 'img/' + name + '.webp'; }
    return o;
  }
  const names = (sc) => [sc.bg].concat(sc.items.map((it) => it.pic));
  const load = (sc) => Promise.all(names(sc).map((n) => pic(n).p));
  const loaded = (sc) => names(sc).every((n) => pic(n).ok);
  /** Paint a scene w by h. t = seconds of life (null: still); k = how lively (0..1); what: 'bg' | 'items' | both. */
  function paintScene(g, sc, w, h, t, k, what) {
    if (what !== 'items') {
      const bg = pic(sc.bg);
      if (bg.ok) g.drawImage(bg.im, 0, 0, w, h);
      else {   // paper stand-in until the picture arrives
        const sk = g.createLinearGradient(0, 0, 0, h * 0.6); sk.addColorStop(0, sc.sky[0]); sk.addColorStop(1, sc.sky[1]); g.fillStyle = sk; g.fillRect(0, 0, w, h);
        if (!sc.flat) { g.fillStyle = A.shade(sc.ground, -0.08); g.beginPath(); g.moveTo(0, h * 0.5); g.quadraticCurveTo(w * 0.25, h * 0.36, w * 0.55, h * 0.52); g.quadraticCurveTo(w * 0.8, h * 0.38, w, h * 0.5); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.fillStyle = sc.ground; g.fillRect(0, h * 0.52, w, h * 0.48); }
      }
    }
    if (what === 'bg') return;
    sc.items.forEach((it, i) => {
      const o = pic(it.pic), ih = it.h * h, iw = o.ok ? ih * (o.im.width / o.im.height) : ih * 0.75;
      let dy = 0, rot = 0, sq = 0;
      if (t != null && k > 0) {
        const ph = i * 1.7;
        if (it.move === 'hop') { const b = Math.abs(Math.sin(t * 5.2 + ph)); dy = -b * ih * 0.13 * k; sq = (0.5 - b) * 0.08 * k; }
        else if (it.move === 'float') { dy = Math.sin(t * 3 + ph) * ih * 0.08 * k; rot = Math.sin(t * 2.2 + ph) * 0.07 * k; }
        else if (it.move === 'sway') rot = Math.sin(t * 3.4 + ph) * 0.09 * k;
      }
      g.save(); g.translate(it.x * w, it.y * h + dy); g.rotate(rot); g.scale(1 + sq, 1 - sq);
      if (o.ok) g.drawImage(o.im, -iw / 2, -ih, iw, ih);
      else { g.beginPath(); g.ellipse(0, -ih / 2, iw / 2, ih / 2, 0, 0, 7); g.fillStyle = it.col; g.fill(); g.fillStyle = '#2E2A3B'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * iw * 0.16, -ih * 0.6, Math.max(1.5, ih * 0.035), 0, 7); g.fill(); } }
      g.restore();
    });
  }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

  /* ---------------- piece outlines ---------------- */
  /** One side of a piece from (x0,y0) to (x1,y1). k: 0 flat, +1 knob out (to the left of travel on screen: outwards when going clockwise), -1 socket. */
  function edge(g, x0, y0, x1, y1, k, s, o, soft) {
    if (!k) { g.lineTo(x1, y1); return; }
    const len = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / len, dy = (y1 - y0) / len, nx = dy, ny = -dx;
    const mx = (x0 + x1) / 2 + dx * o * s, my = (y0 + y1) / 2 + dy * o * s;
    const P = (a, b) => [mx + dx * a * s + nx * b * s * k, my + dy * a * s + ny * b * s * k];
    const bz = (a, b, c) => g.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]);
    if (soft) { const q = P(0, 0.07); g.quadraticCurveTo(q[0], q[1], x1, y1); return; }
    const p0 = P(-0.2, 0); g.lineTo(p0[0], p0[1]);
    bz(P(-0.06, 0), P(-0.1, 0.05), P(-0.11, 0.1));
    bz(P(-0.13, 0.15), P(-0.2, 0.13), P(-0.2, 0.21));
    bz(P(-0.2, 0.33), P(0.2, 0.33), P(0.2, 0.21));
    bz(P(0.2, 0.13), P(0.13, 0.15), P(0.11, 0.1));
    bz(P(0.1, 0.05), P(0.06, 0), P(0.2, 0));
    g.lineTo(x1, y1);
  }
  /** Random cut for cols x rows: h[r][c] is the edge above piece (r,c), v[r][c] the edge to its left. */
  function cut(cols, rows) {
    const mk = () => ({ k: Math.random() < 0.5 ? 1 : -1, o: (Math.random() - 0.5) * 0.14 }), h = [], v = [];
    for (let r = 0; r <= rows; r++) { h.push([]); v.push([]); for (let c = 0; c <= cols; c++) { h[r].push(r > 0 && r < rows ? mk() : null); v[r].push(c > 0 && c < cols ? mk() : null); } }
    return { h, v };
  }
  function piecePath(g, ct, r, c, cw, ch, soft) {
    const hw = cw / 2, hh = ch / 2, s = Math.min(cw, ch), top = ct.h[r][c], bot = ct.h[r + 1][c], lef = ct.v[r][c], rig = ct.v[r][c + 1];
    g.moveTo(-hw, -hh);
    edge(g, -hw, -hh, hw, -hh, top ? -top.k : 0, s, top ? top.o : 0, soft);
    edge(g, hw, -hh, hw, hh, rig ? rig.k : 0, s, rig ? rig.o : 0, soft);
    edge(g, hw, hh, -hw, hh, bot ? bot.k : 0, s, bot ? -bot.o : 0, soft);
    edge(g, -hw, hh, -hw, -hh, lef ? -lef.k : 0, s, lef ? -lef.o : 0, soft);
    g.closePath();
  }

  function wood(g, s, W, H) {
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#D9AE7C', { shadow: 0, grain: 0.32, light: 0.05, box: { x: 0, y: 0, w: W, h: H } });
    const r = A.rng(8);
    for (let y = 0, row = 0; y < H; y += 132, row++) {
      g.fillStyle = A.alpha(row % 2 ? '#C4925E' : '#E6C194', 0.22); g.fillRect(0, y, W, 132);
      g.strokeStyle = A.alpha('#8A5A3C', 0.28); g.lineWidth = 3; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      for (let x = (row % 2) * 260 + r() * 120; x < W; x += 520) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 132); g.stroke(); }
      g.strokeStyle = A.alpha('#8A5A3C', 0.1); g.lineWidth = 2; for (let i = 0; i < 3; i++) { const yy = y + 24 + i * 38 + r() * 12; g.beginPath(); g.moveTo(0, yy); for (let x = 0; x <= W + 80; x += 80) g.quadraticCurveTo(x - 40, yy + (r() - 0.5) * 10, x, yy + (r() - 0.5) * 5); g.stroke(); }
    }
  }
  function mat(g, s, m) {
    g.beginPath(); A.rect(g, m.x, m.y, m.w, m.h, 34, 3, 1.5); A.paper(g, s, '#3F8F88', { shadow: 0.9, grain: 0.36, light: 0.05, box: m });
    g.save(); g.setLineDash([14, 13]); g.lineCap = 'round'; g.strokeStyle = A.alpha('#FBF6EC', 0.5); g.lineWidth = 4; g.beginPath(); A.rect(g, m.x + 14, m.y + 14, m.w - 28, m.h - 28, 24, 4, 1); g.stroke(); g.restore();
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, res = st.res;
    const SET = [3, 2, 1][L - 1];
    /* ---------- layout ---------- */
    let bx, by = 152, bw, bh, mats, ref = null;
    if (land) {
      bx = 40; bw = Math.min(W * 0.56, (H - by - 60) * 1.5); bh = bw / 1.5;
      const cx = bx + bw + 44; mats = [{ x: cx, y: 142, w: W - cx - 22, h: H - 142 - 30 }];
      if (H - (by + bh + 50) - 30 > 130) mats.push({ x: bx - 16, y: by + bh + 50, w: bw + 32, h: H - (by + bh + 50) - 30 });
      if (L === 3) { const rw = Math.min(250, mats[0].w - 150); ref = { x: mats[0].x + 26, y: mats[0].y + 24, w: rw, h: rw / 1.5 }; }
    } else {
      bx = 24; bw = W - 48; bh = bw / 1.5; const ty = by + bh + 46; mats = [{ x: 10, y: ty, w: W - 20, h: H - ty - 44 }];
      if (L === 3) ref = { x: 30, y: H - 44 - 22 - 124, w: 186, h: 124 };
    }
    const lamp = { x: W - (land ? 96 : 88), y: H - (land ? 104 : 118), r: 50 };
    const keep = [{ x: lamp.x - 64, y: lamp.y - 64, w: 128, h: 128 }].concat(ref ? [{ x: ref.x - 14, y: ref.y - 14, w: ref.w + 28, h: ref.h + 28 }] : []);
    st.add({ z: 0, sprite: (() => { const c = canvas(W * res, H * res), g = c.getContext('2d'); g.setTransform(res, 0, 0, res, 0, 0); wood(g, res, W, H); for (const m of mats) mat(g, res, m);
      g.beginPath(); A.rect(g, bx - 20, by - 20, bw + 40, bh + 40, 22, 5, 1); A.paper(g, res, '#FBF4E4', { shadow: 1, depth: 1.5, light: 0.04, box: { x: bx - 20, y: by - 20, w: bw + 40, h: bh + 40 } });
      g.fillStyle = '#E4D6BB'; g.fillRect(bx - 3, by - 3, bw + 6, bh + 6); g.fillStyle = '#EFE5D0'; g.fillRect(bx, by, bw, bh);
      return { canvas: c, ox: 0, oy: 0, w: W, h: H }; })() });

    for (const sc of SCENES) load(sc);
    let refN = null, Z = null, done = 0, stage = 0, lastScene = null, hand = null, cards = [], first = true;
    const sfx = {
      click() { K.sfx.noise(0.035, { freq: 3400, vol: 0.26 }); K.sfx.tone(1040, 0.05, { type: 'triangle', vol: 0.16 }); K.sfx.tone(320, 0.07, { to: 200, vol: 0.14 }); },
      lift() { K.sfx.tone(430, 0.07, { to: 610, type: 'triangle', vol: 0.13 }); },
    };
    const top = (n, z) => { n.z = z; st.root._sorted = false; };

    /* ---------- board layers: guide, peek, slot glow, the living picture ---------- */
    const guide = st.add({ z: 2, alpha: 0, peek: 0 });
    guide.draw = (g) => {
      if (!Z || !Z.img) return;
      const a = Math.max(Z.guide, guide.peek);
      if (a > 0.01) { g.save(); g.globalAlpha *= a; g.drawImage(Z.img, bx, by, bw, bh); g.restore(); }
      if (Z.guide > 0) { g.save(); g.strokeStyle = A.alpha('#5A4A3A', 0.22); g.lineWidth = 2; for (const P of Z.pieces) { if (P.locked) continue; g.save(); g.translate(P.home.x, P.home.y); g.beginPath(); piecePath(g, Z.ct, P.r, P.c, Z.cw, Z.ch, Z.soft); g.stroke(); g.restore(); } g.restore(); }
    };
    st.add({ z: 9, draw(g) {
      if (!Z) return;
      for (const P of Z.pieces) {
        if (P.locked || !(P.glow || P.near)) continue;
        const k = 0.5 + 0.5 * Math.sin(st.t * 6);
        g.save(); g.translate(P.home.x, P.home.y); g.beginPath(); piecePath(g, Z.ct, P.r, P.c, Z.cw, Z.ch, Z.soft);
        if (P.glow) { g.shadowColor = '#FFF2A8'; g.shadowBlur = (16 + 14 * k) * res; g.strokeStyle = A.alpha('#FFF6C8', 0.75 + 0.25 * k); g.lineWidth = 6 + 3 * k; g.stroke(); g.fillStyle = A.alpha('#FFF6C8', 0.25 + 0.15 * k); g.fill(); }
        else { g.fillStyle = 'rgba(255,255,255,.3)'; g.fill(); }
        g.restore();
      }
    } });
    const live = st.add({ z: 8, alpha: 0, k: 0, t0: 0, visible: false });
    live.draw = (g) => { if (!Z) return; g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip(); g.translate(bx, by); if (Z.bgImg) g.drawImage(Z.bgImg, 0, 0, bw, bh); else paintScene(g, Z.scene, bw, bh, null, 0, 'bg'); paintScene(g, Z.scene, bw, bh, st.t - live.t0, live.k, 'items'); g.restore(); };

    /* ---------- reference picture (level 3) ---------- */
    if (ref) {
      const rn = refN = st.add({ z: 4, x: ref.x + ref.w / 2, y: ref.y + ref.h / 2, hit: { x: -ref.w / 2, y: -ref.h / 2, w: ref.w, h: ref.h }, label: 'look at the picture' });
      rn.draw = (g, s) => {
        g.beginPath(); A.rect(g, -ref.w / 2 - 10, -ref.h / 2 - 10, ref.w + 20, ref.h + 20, 12, 4, 0.8); A.paper(g, s.res, '#FBF4E4', { shadow: 0.9, light: 0.03, box: { x: -ref.w / 2, y: -ref.h / 2, w: ref.w, h: ref.h } });
        if (Z && Z.img) g.drawImage(Z.img, -ref.w / 2, -ref.h / 2, ref.w, ref.h);
      };
      rn.onTap = () => { K.sfx.sparkle(); guide.peek = 0; guide.to({ peek: 0.42 }, { dur: 0.3 }).then(() => guide.to({ peek: 0 }, { dur: 0.6, delay: 2.2 })); };
    }

    /* ---------- the "show me" lamp ---------- */
    const lampN = st.add({ z: 40, x: lamp.x, y: lamp.y, hitR: lamp.r + 6, label: 'Show me', visible: false });
    lampN.draw = (g, s) => {
      const q = 1 + Math.sin(st.t * 5) * 0.05; g.save(); g.scale(q, q);
      g.beginPath(); g.arc(0, 0, lamp.r, 0, 7); A.paper(g, s.res, '#FBF6EC', { shadow: 1, light: 0.04, box: { x: -50, y: -50, w: 100, h: 100 } });
      A.line(g, A.alpha('#F2B33D', 0.8), 4, (h) => { for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; h.moveTo(Math.cos(a) * 30, -8 + Math.sin(a) * 30); h.lineTo(Math.cos(a) * 38, -8 + Math.sin(a) * 38); } });
      g.beginPath(); g.arc(0, -8, 21, 0, 7); g.fillStyle = '#F6C453'; g.fill();
      g.beginPath(); g.arc(-7, -15, 6, 0, 7); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
      g.beginPath(); A.rect(g, -10, 12, 20, 16, 4, 2, 0); g.fillStyle = '#6E6A7A'; g.fill();
      g.restore();
    };
    lampN.onTap = () => showMe();
    const lampOn = (on) => { if (lampN.visible === on) return; lampN.visible = on; if (on) { lampN.sx = lampN.sy = 0.2; lampN._bsx = lampN._bsy = 1; lampN.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' }); K.sfx.pop(); if (!Z.toldLamp && L < 3) { Z.toldLamp = true; ctx.say(T.lamp); } } };
    function killHand() { if (hand) { hand.remove(); hand = null; } }
    function showMe() {
      if (!Z || Z.busy) return;
      const loose = Z.pieces.filter((P) => !P.locked && !P.grab); if (!loose.length) return;
      const P = loose.sort((a, b) => b.misses - a.misses)[0];
      for (const q of Z.pieces) q.glow = false;
      P.glow = true; Z.helped++; Z.sinceGood = 0; Z.lastGood = st.t; lampOn(false); K.sfx.sparkle(); ctx.say(T.here);
      top(P.node, 34); P.node.to({ sx: P.ts * 1.15, sy: P.ts * 1.15 }, { dur: 0.2 }).then(() => P.node.to({ sx: P.ts, sy: P.ts }, { dur: 0.4, ease: 'elastic' }));
      killHand();
      const h = hand = st.add({ z: 80, x: P.node.x, y: P.node.y, alpha: 0, press: 0 });
      h.draw = (g, s) => A.hand(g, s.res, h.press);
      h.to({ alpha: 1 }, { dur: 0.25 }).then(() => h.to({ press: 1 }, { dur: 0.25 })).then(() => h.to({ x: P.home.x, y: P.home.y }, { dur: 1.2, ease: 'inOut' }))
        .then(() => h.to({ press: 0 }, { dur: 0.2 })).then(() => h.to({ alpha: 0 }, { dur: 0.4, delay: 0.4 })).then(() => { if (hand === h) killHand(); });
    }
    ctx.every(1000, () => { if (Z && !Z.busy && Z.ready && !lampN.visible && (st.t - Z.lastGood > [10, 14, 18][L - 1] || Z.sinceGood >= 2)) lampOn(true); });

    /* ---------- a puzzle ---------- */
    function slots(n, cw, ch) {
      for (let ts = 1; ; ts -= 0.04) {
        const f = L === 1 ? 1.1 : 1.26, sw = cw * ts * f, sh = ch * ts * f, out = [];
        for (const m of mats) {
          const iw = m.w - 24, ih = m.h - 24, cols = Math.floor(iw / sw), rows = Math.floor(ih / sh);
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const x = m.x + 12 + (c + 0.5) * (iw / cols), y = m.y + 12 + (r + 0.5) * (ih / rows);
            if (!keep.some((k) => x + sw / 2 > k.x && x - sw / 2 < k.x + k.w && y + sh / 2 > k.y && y - sh / 2 < k.y + k.h)) out.push({ x, y });
          }
        }
        if (out.length >= n || ts < 0.42) return { ts, list: K.shuffle(out) };
      }
    }
    async function newPuzzle(scene, size) {
      for (const c of cards) c.to({ alpha: 0, sx: 0.8, sy: 0.8 }, { dur: 0.25 }).then(() => c.remove()); cards = [];
      if (Z) for (const P of Z.pieces) P.node.remove();
      killHand(); lampN.visible = false; if (refN) refN.visible = true; live.visible = false; live.alpha = 0; guide.peek = 0;
      scene = scene || K.pick(SCENES.filter((s) => s !== lastScene)); lastScene = scene;
      const [cols, rows] = size || SIZES[L - 1][stage], cw = bw / cols, ch = bh / rows;
      const z = Z = { scene, cols, rows, cw, ch, ct: cut(cols, rows), soft: L === 1, guide: 0, pieces: [], busy: true, ready: false, helped: 0, misses: 0, sinceGood: 0, lastGood: st.t, left: cols * rows, said: {} };
      await Promise.race([load(scene), ctx.wait(3000)]);
      if (Z !== z) return;
      // the whole picture, and the background alone for when it comes alive
      const pw = Math.round(bw * res), ph = Math.round(bh * res);
      z.img = canvas(pw, ph); paintScene(z.img.getContext('2d'), scene, pw, ph, null, 0);
      z.bgImg = canvas(pw, ph); paintScene(z.bgImg.getContext('2d'), scene, pw, ph, null, 0, 'bg');
      guide.alpha = 1; if (L < 3) z.guide = 0.3;
      const s = Math.min(cw, ch), m = s * 0.36, pad = 16, bwid = cw + 2 * m, bhei = ch + 2 * m;
      const sl = slots(cols * rows, cw, ch), ts = sl.ts;
      let i = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const render = (lifted) => {
          const cv = canvas((bwid + pad * 2) * res, (bhei + pad * 2) * res), g = cv.getContext('2d');
          g.setTransform(res, 0, 0, res, (pad + bwid / 2) * res, (pad + bhei / 2) * res);
          const path = () => { g.beginPath(); piecePath(g, z.ct, r, c, cw, ch, z.soft); };
          if (lifted) { g.save(); g.shadowColor = 'rgba(40,30,60,.42)'; g.shadowBlur = 8 * res; g.shadowOffsetX = 2.5 * res; g.shadowOffsetY = 5 * res; path(); g.fillStyle = '#C9B48E'; g.fill(); g.restore(); }
          g.save(); path(); g.clip();
          { // Safari stretches a source box that pokes outside the picture, so cut the box to the picture first
            const iw = z.img.width, ih = z.img.height, sx0 = (c * cw - m) * res, sy0 = (r * ch - m) * res;
            const x0 = Math.max(0, sx0), y0 = Math.max(0, sy0), x1 = Math.min(iw, sx0 + bwid * res), y1 = Math.min(ih, sy0 + bhei * res);
            if (x1 > x0 && y1 > y0) g.drawImage(z.img, x0, y0, x1 - x0, y1 - y0, -bwid / 2 + (x0 - sx0) / res, -bhei / 2 + (y0 - sy0) / res, (x1 - x0) / res, (y1 - y0) / res);
          }
          g.lineJoin = 'round';
          g.save(); g.translate(1.6, 2.2); path(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3.2; g.stroke(); g.restore();
          g.save(); g.translate(-1.6, -2.2); path(); g.strokeStyle = 'rgba(40,30,60,.3)'; g.lineWidth = 3.2; g.stroke(); g.restore();
          path(); g.strokeStyle = lifted ? 'rgba(40,30,60,.5)' : 'rgba(40,30,60,.22)'; g.lineWidth = lifted ? 2 : 1.4; g.stroke();
          g.restore();
          return { canvas: cv, ox: pad + bwid / 2, oy: pad + bhei / 2, w: bwid + pad * 2, h: bhei + pad * 2 };
        };
        const at = sl.list[i % sl.list.length], jx = L === 3 ? 0.1 : 0.05;
        const P = { r, c, i, home: { x: bx + (c + 0.5) * cw, y: by + (r + 0.5) * ch }, tray: { x: at.x + (Math.random() - 0.5) * cw * ts * jx * 2, y: at.y + (Math.random() - 0.5) * ch * ts * jx * 2 }, rot: (Math.random() - 0.5) * (L === 3 ? 0.5 : 0.14), ts, locked: false, grab: null, misses: 0, flat: null, up: render(true), render };
        const hw = Math.max(cw / 2, 54 / ts), hh = Math.max(ch / 2, 54 / ts);
        const n = P.node = st.add({ z: 20 + i, x: bx + bw / 2, y: by + bh / 2, sx: 0, sy: 0, rot: P.rot, sprite: P.up, hit: { x: -hw, y: -hh, w: hw * 2, h: hh * 2 }, pad: 2, pressable: false, label: `piece ${r + 1} ${c + 1}` });
        n.onDown = (p) => { if (P.locked || z.busy) return; P.grab = { dx: n.x - p.x, dy: n.y - p.y }; top(n, 60); killHand(); sfx.lift(); n.to({ sx: 1.04, sy: 1.04, rot: 0 }, { dur: 0.14, ease: 'out' }); };
        n.onMove = (p) => { if (!P.grab) return; n.x = K.clamp(p.x + P.grab.dx, 20, W - 20); n.y = K.clamp(p.y + P.grab.dy, 30, H - 20); P.near = Math.hypot(n.x - P.home.x, n.y - P.home.y) < s * SNAP[L - 1]; };
        n.onUp = () => { if (!P.grab) return; P.grab = null; drop(P); };
        n.onTap = (p) => { if (!p && !P.locked && !z.busy) lock(P, 0.35); };   // keyboard and screen readers
        z.pieces.push(P); i++;
      }
      // deal the pieces out of the middle of the board
      K.sfx.whoosh();
      K.shuffle(z.pieces).forEach((P, k) => { P.node.to({ x: P.tray.x, y: P.tray.y, sx: ts, sy: ts }, { dur: 0.5, ease: 'back', delay: 0.15 + k * 0.05 }); ctx.after(150 + k * 50, () => K.sfx.tone(480 + (k % 8) * 50, 0.05, { type: 'triangle', vol: 0.08 })); });
      ctx.prompt(T.start + ' ' + (L === 3 ? T.noGuide : first && L === 2 ? T.corners : T.drag), { show: land ? T.start : 'Make the picture!' }); first = false;
      await ctx.wait(500 + z.pieces.length * 50);
      if (Z !== z) return;
      z.busy = false; z.ready = true; z.lastGood = st.t;
    }
    function toTray(P) { top(P.node, 21 + P.i); P.node.to({ x: P.tray.x, y: P.tray.y, sx: P.ts, sy: P.ts, rot: P.rot }, { dur: 0.42, ease: 'back' }); }
    function drop(P) {
      const z = Z, n = P.node, s = Math.min(z.cw, z.ch); P.near = false;
      if (Math.hypot(n.x - P.home.x, n.y - P.home.y) < s * SNAP[L - 1]) return lock(P, 0.1);
      if (n.x > bx - 10 && n.x < bx + bw + 10 && n.y > by - 10 && n.y < by + bh + 10) {   // on the board, but not its place
        P.misses++; z.misses++; z.sinceGood++; K.sfx.whoops();
        n.to({ rot: 0.16 }, { dur: 0.07 }).then(() => n.to({ rot: -0.12 }, { dur: 0.09 })).then(() => toTray(P));
        if (z.misses === 1 || z.misses % 4 === 0) ctx.say(T.miss[(z.misses >> 2) % 2]);
        if (P.misses >= 2) P.glow = true;
        return;
      }
      P.tray = { x: n.x, y: n.y }; top(n, 21 + P.i); n.to({ sx: P.ts, sy: P.ts }, { dur: 0.25, ease: 'back' });
    }
    function lock(P, dur) {
      const z = Z, n = P.node; P.locked = true; P.glow = false; z.left--; z.sinceGood = 0; z.lastGood = st.t; lampOn(false);
      top(n, 60);
      n.to({ x: P.home.x, y: P.home.y, sx: 1, sy: 1, rot: 0 }, { dur, ease: 'out' }).then(() => {
        n.sprite = P.flat = P.render(false); top(n, 3); sfx.click(); K.sfx.step((z.pieces.length - z.left - 1) % 10);
        ctx.fx.burst(P.home.x, P.home.y, { n: 6 });
        n.to({ sx: 1.05, sy: 1.05 }, { dur: 0.07 }).then(() => n.to({ sx: 1, sy: 1 }, { dur: 0.25, ease: 'back' }));
      });
      const n0 = z.pieces.length;
      if (!z.left) finish();
      else if (z.left === 1 && n0 > 4 && !z.said.last) { z.said.last = 1; ctx.say(T.last); }
      else if (n0 >= 9 && z.left === Math.floor(n0 / 2) && !z.said.half) { z.said.half = 1; ctx.say(T.half); }
    }
    async function finish() {
      const z = Z; z.busy = true; killHand(); lampN.visible = false;
      await ctx.wait(420);
      if (Z !== z) return;
      [523, 659, 784, 1047].forEach((f, i) => K.sfx.tone(f, 0.3, { type: 'triangle', vol: 0.2, delay: i * 0.1 })); K.sfx.sparkle();
      for (let i = 0; i < 5; i++) ctx.after(i * 130, () => ctx.fx.burst(bx + bw * (0.1 + 0.2 * i), by + bh * (0.3 + 0.2 * (i % 2)), { n: 10 }));
      live.visible = true; live.t0 = st.t; live.k = 0; live.alpha = 0; guide.to({ alpha: 0 }, { dur: 0.3 });
      live.to({ alpha: 1 }, { dur: 0.45 }); live.to({ k: 1 }, { dur: 0.5, delay: 0.2 });
      await Promise.all([ctx.say(z.scene.say), ctx.wait(3400)]);
      if (Z !== z) return;
      live.to({ k: 0 }, { dur: 0.6 });
      for (const P of z.pieces) P.node.visible = false;
      done++;
      if (z.helped === 0 && z.misses <= 2) stage = 1; else if (z.helped >= 3) stage = 0;
      if (done % SET === 0) await ctx.celebrate({ ms: 3200 });
      if (Z !== z) return;
      offer();
    }
    /** Three new pictures to choose from, laid over the tray. */
    function offer() {
      const picks = K.shuffle(SCENES.filter((s) => s !== Z.scene)).slice(0, 3), m = mats[0];
      if (refN) refN.visible = false;
      const row = !land && m.h < 560, cw0 = row ? (m.w - 60) / 3 : Math.min(m.w - 80, (m.h - 80) / 3 * 1.5 - 20, 330), chh = cw0 / 1.5;
      picks.forEach((sc, i) => {
        const x = row ? m.x + 30 + cw0 / 2 + i * (cw0 + 0) : m.x + m.w / 2, y = row ? m.y + m.h / 2 : m.y + m.h / 2 + (i - 1) * (chh + 30);
        const n = st.add({ z: 50, x, y, sx: 0, sy: 0, rot: (i - 1) * 0.04, hit: { x: -cw0 / 2, y: -chh / 2, w: cw0, h: chh }, label: 'picture: ' + sc.id });
        let th = null;
        n.draw = (g, s) => {
          g.beginPath(); A.rect(g, -cw0 / 2 - 10, -chh / 2 - 10, cw0 + 20, chh + 20, 14, 4 + i, 0.8); A.paper(g, s.res, '#FBF4E4', { shadow: 1, depth: 1.3, light: 0.03, box: { x: -cw0 / 2, y: -chh / 2, w: cw0, h: chh } });
          if (!th && loaded(sc)) { th = canvas(cw0 * res, chh * res); paintScene(th.getContext('2d'), sc, th.width, th.height, null, 0); }
          if (th) g.drawImage(th, -cw0 / 2, -chh / 2, cw0, chh); else { g.save(); g.translate(-cw0 / 2, -chh / 2); paintScene(g, sc, cw0, chh, null, 0); g.restore(); }
        };
        n.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back', delay: i * 0.12 }); ctx.after(i * 120, () => K.sfx.pop());
        n.onTap = () => { if (Z.chosen) return; Z.chosen = true; K.sfx.ding(); newPuzzle(sc); };
        cards.push(n);
      });
      ctx.prompt(T.pick);
    }

    K._jigsaw = { unit: st.unit, get Z() { return Z; }, get done() { return done; }, get stage() { return stage; }, get cards() { return cards; }, get lamp() { return lampN; }, board: { x: bx, y: by, w: bw, h: bh }, mats, ref,
      go: (id, cols, rows) => newPuzzle(SCENES.find((s) => s.id === id), cols ? [cols, rows] : null) }; // for browser tests
    ctx.onExit(() => { K._jigsaw = null; });
    ctx.after(250, () => newPuzzle());
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#3F8F88'; g.fillRect(0, 0, w, w);
    g.save(); g.scale(u, u);
    const ct = { h: [[null, null, null], [{ k: 1, o: 0 }, { k: -1, o: 0 }, null], [null, null, null]], v: [[null, { k: 1, o: 0 }, null], [null, { k: -1, o: 0 }, null], [null, null, null]] };
    const S = 108, x0 = 150 - S, y0 = 150 - S;
    const scene = () => { g.fillStyle = '#58AEEA'; g.fillRect(x0 - 60, y0 - 60, S * 2 + 120, S * 2 + 120); g.fillStyle = '#F6C453'; g.beginPath(); g.arc(x0 + 56, y0 + 58, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x0 + 150, y0 + 60, 40, 17, 0, 0, 7); g.fill();
      g.fillStyle = '#7FB84A'; g.beginPath(); g.moveTo(x0 - 60, y0 + 130); g.quadraticCurveTo(x0 + 70, y0 + 80, x0 + 150, y0 + 130); g.quadraticCurveTo(x0 + 210, y0 + 100, x0 + 280, y0 + 124); g.lineTo(x0 + 280, y0 + 300); g.lineTo(x0 - 60, y0 + 300); g.fill();
      g.fillStyle = '#E8664A'; g.beginPath(); g.arc(x0 + 150, y0 + 162, 26, 0, 7); g.fill(); g.fillStyle = '#2E2A3B'; g.beginPath(); g.arc(x0 + 141, y0 + 158, 3.5, 0, 7); g.fill(); g.beginPath(); g.arc(x0 + 159, y0 + 158, 3.5, 0, 7); g.fill(); };
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const out = r === 0 && c === 1;
      g.save(); g.translate(x0 + (c + 0.5) * S, y0 + (r + 0.5) * S);
      if (out) { g.translate(22, -20); g.rotate(0.2); }
      g.save(); g.shadowColor = 'rgba(30,20,50,.35)'; g.shadowBlur = (out ? 14 : 6) * u; g.shadowOffsetY = (out ? 8 : 3) * u; g.beginPath(); piecePath(g, ct, r, c, S, S, false); g.fillStyle = '#EFE5D0'; g.fill(); g.restore();
      g.beginPath(); piecePath(g, ct, r, c, S, S, false); g.save(); g.clip(); g.translate(-(x0 + (c + 0.5) * S), -(y0 + (r + 0.5) * S)); scene(); g.restore();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
      g.restore();
    }
    g.restore();
  }

  K.game({ id: 'jigsaw', title: 'Jigsaw', voice: 'jigsaw', group: 'arcade', age: 5, order: 21, icon, start, lines, resize: () => K.go('jigsaw') });
})();
