/* Paint Studio — colouring pictures, free painting, and paint that mixes.
   Pick a pot, then touch the picture: colour spreads out from the finger into that shape. Drag
   across shapes to colour them as you go. On blank paper the finger is a brush.
   The mixing dish: dab one colour in, dab another, and they swirl into a new one (blue and yellow
   make green) which the brush picks up. The water jar rinses the dish.
   No wrong answers anywhere. Colours put on pictures are remembered per child.

   Spoken lines are the ones Draw and Coloring already had recorded. */
(function () {
  'use strict';
  /* The painted studio wall (img/paint). Fetched when the app starts; the drawn room is used until it arrives. */
  const STUDIO = { im: new Image(), ok: false, bad: false };
  STUDIO.wait = new Promise((res) => { STUDIO.im.onload = () => { STUDIO.ok = true; res(true); }; STUDIO.im.onerror = () => { STUDIO.bad = true; res(false); }; });
  STUDIO.im.src = 'img/paint/studio.webp';
  const A = K.art, E = K.engine, Pic = A.pictures;
  const POTS = [
    { name: 'red', c: '#E2483F' }, { name: 'orange', c: '#F08A35' }, { name: 'yellow', c: '#F5CD3D' }, { name: 'green', c: '#57A85B' }, { name: 'blue', c: '#3F7FD0' },
    { name: 'purple', c: '#7E57B5' }, { name: 'pink', c: '#EE8FB0' }, { name: 'brown', c: '#9A6A45' }, { name: 'black', c: '#2E2A3B' }, { name: 'white', c: '#FFFFFF' },
  ];
  const NAMED = POTS.concat([{ name: 'gray', c: '#9AA0A8' }, { name: 'light blue', c: '#9CCBEA' }]);
  const SIZES = [9, 20, 40], SIZE_NAMES = ['small', 'medium', 'big'];
  const SAY = { pick: 'Pick a picture to color!', done: 'Beautiful!', free: 'Draw anything you like!', wipe: 'Tap again to wipe it all away!', blank: 'white paper' };
  const lines = () => [...Object.values(SAY), ...NAMED.map((p) => p.name), ...SIZE_NAMES, ...Pic.list.map((p) => `Color the ${p.name}!`), ...Pic.list.map((p) => `You colored the ${p.name}!`)];

  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  /** Mix paints the way pigments do (darker, not greyer), then lift the colour a little. */
  function mix(cols) {
    const acc = [0, 0, 0]; for (const c of cols) rgb(c).forEach((v, i) => (acc[i] += Math.log(Math.max(8, v))));
    let out = acc.map((v) => Math.exp(v / cols.length)); const m = (out[0] + out[1] + out[2]) / 3;
    out = out.map((v) => K.clamp(m + (v - m) * 1.35, 0, 255));
    return '#' + out.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  }
  function nameOf(c) { const a = rgb(c); let best = NAMED[0], bd = 1e9; for (const p of NAMED) { const b = rgb(p.c), d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; if (d < bd) { bd = d; best = p; } } return best.name; }

  function start(st, ctx) {
    const W = st.W, H = st.H, land = W >= 1000;
    // paper side, in units; in portrait it gives way so three rows of controls always fit below it
    const P = land ? Math.min(H - 180, W - 500) : Math.max(300, Math.min(W - 48, H - 140 - 350));
    const px = land ? (W - P) / 2 + 26 : (W - P) / 2, py = land ? 132 : 140;
    const S = Math.min(1400, Math.round(P * st.res)), k = S / 400;         // paper bitmap
    const store = (K.s.done.paint = K.s.done.paint || {});
    K.preloadVoice('color'); K.preloadVoice('draw');

    const paint = document.createElement('canvas'); paint.width = paint.height = S; const pg = paint.getContext('2d');
    const ink = document.createElement('canvas'); ink.width = ink.height = S; const ig = ink.getContext('2d');
    let pic = null, fills = [], brush = POTS[0].c, size = 1, mode = 'fill', chooserOpen = false, finished = false;
    const anims = [], undo = [];
    const playerId = (K.players.current() || {}).id || 'guest';
    let loaded = false, revision = 0, changed = false;
    const paintingKey = () => playerId + ':' + (pic ? pic.id : 'blank');
    function savePainting() {
      if (!loaded || !changed) return;
      // Complete pending pours before taking the snapshot.
      pg.setTransform(k, 0, 0, k, 0, 0);
      for (const a of anims) { Pic.fillRegion(pg, pic, a.i, a.col); Pic.paintAbove(pg, pic, fills, a.i); }
      anims.length = 0;
      K.artwork.put(paintingKey(), paint.toDataURL('image/png'));
      changed = false;
    }
    ctx.onExit(savePainting);

    /* ---------- room ---------- */
    if (!STUDIO.ok && !STUDIO.bad) STUDIO.wait.then((ok) => { if (ok && ctx.alive) K.go('paint'); });      // the painted wall arrived late: start again with it
    st.add({ z: 0, sprite: A.sprite('studio' + (STUDIO.ok ? 'P' : '') + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      if (STUDIO.ok) {     // the painted studio wall; its floor (the bottom sixth of the picture) is laid along the bottom of the screen
        const im = STUDIO.im, fy = H - 96, wy = im.height * 0.835, sc = Math.max(W / im.width, fy / wy), dw = im.width * sc, x0 = W / 2 - dw / 2;
        g.drawImage(im, 0, 0, im.width, wy, x0, fy - wy * sc, dw, wy * sc); g.drawImage(im, 0, wy, im.width, im.height - wy, x0, fy - 1, dw, 98);
      } else {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#E9D6B8', { shadow: 0, box: { x: 0, y: 0, w: 0, h: H }, light: 0.04, grain: 0.3 });
      for (let x = 0; x < W; x += 118) A.line(g, 'rgba(150,110,70,.22)', 3, (h) => { h.moveTo(x, 0); h.lineTo(x + 2, H); });
      const fy = H - 96; g.beginPath(); g.rect(0, fy, W, 96); A.paper(g, s, '#B98558', { shadow: 0, grain: 0.3, light: 0 });
      A.line(g, 'rgba(90,60,40,.3)', 3, (h) => { h.moveTo(0, fy); h.lineTo(W, fy); for (let x = 60; x < W; x += 210) { h.moveTo(x, fy); h.lineTo(x - 40, H); } });
      }
      // drawing board with clips
      g.beginPath(); A.rect(g, px - 24, py - 24, P + 48, P + 48, 16, 4, 1.2); A.paper(g, s, '#C99666', { shadow: 1.3, depth: 1.5, box: { x: px, y: py, w: P, h: P } });
      g.beginPath(); g.rect(px, py, P, P); A.paper(g, s, Pic.PAPER, { shadow: 0.9, grain: 0.1, light: 0 });
      if (land) { g.beginPath(); A.rect(g, 14, 120, 250, 824, 22, 7, 1); A.paper(g, s, '#D9BE98', { shadow: 0.8, light: 0.03 }); }
    }) });

    /* ---------- the paper ---------- */
    const paper = st.add({ z: 10, x: px, y: py, hit: { x: 0, y: 0, w: P, h: P }, pad: 0, pressable: false, label: 'paper' });
    paper.draw = (g) => {
      g.drawImage(paint, 0, 0, P, P);
      if (pic) g.drawImage(ink, 0, 0, P, P);
      A.line(g, 'rgba(46,42,59,.18)', 2, (h) => h.rect(0, 0, P, P));
      // two clips holding the paper
      for (const x of [P * 0.28, P * 0.72]) { g.beginPath(); A.rect(g, x - 26, -34, 52, 44, 8, 3, 0.5); A.paper(g, st.res, '#8E8A96', { shadow: 0.8, light: 0.1, box: { x: x - 26, y: -34, w: 52, h: 44 } }); }
    };
    const toPic = (p) => ({ x: ((p.x - px) / P) * 400, y: ((p.y - py) / P) * 400 });
    function snapshot() { const c = document.createElement('canvas'); c.width = c.height = S; c.getContext('2d').drawImage(paint, 0, 0); undo.push({ c, fills: fills.slice() }); if (undo.length > 6) undo.shift(); }
    function repaintAll() {
      pg.setTransform(k, 0, 0, k, 0, 0); pg.fillStyle = Pic.PAPER; pg.fillRect(0, 0, 400, 400);
      if (pic) pic.regions.forEach((r, i) => { if (fills[i]) Pic.fillRegion(pg, pic, i, fills[i]); else if (i) Pic.fillRegion(pg, pic, i, Pic.PAPER); });
    }
    function load(next) {
      savePainting();
      loaded = true; changed = false;
      const version = ++revision;
      anims.length = 0; undo.length = 0; finished = false;
      pic = next; fills = pic ? (store[pic.id] || []).slice() : []; mode = pic ? 'fill' : 'brush';
      ig.setTransform(1, 0, 0, 1, 0, 0); ig.clearRect(0, 0, S, S);
      if (pic) { ig.setTransform(k, 0, 0, k, 0, 0); Pic.ink(ig, pic, 5); }
      repaintAll();
      store._last = pic ? pic.id : 'blank'; K.save();
      K.artwork.get(paintingKey()).then((data) => {
        if (!data || !ctx.alive || version !== revision) return;
        const im = new Image();
        im.onload = () => { if (ctx.alive && version === revision) { pg.setTransform(1, 0, 0, 1, 0, 0); pg.drawImage(im, 0, 0, S, S); } };
        im.src = data;
      });
      if (pic) finished = pic.regions.every((r, i) => fills[i]);
      ctx.prompt(pic ? `Color the ${pic.name}!` : SAY.free);
    }
    let last = null, gesture = false;
    function touch(p, first) {
      revision++; changed = true;
      const q = toPic(p);
      if (mode === 'fill' && !pic) {
        // pouring onto blank paper covers the whole sheet
        if (!first || q.x < 0 || q.y < 0 || q.x > 400 || q.y > 400) return;
        snapshot(); gesture = true; pg.setTransform(k, 0, 0, k, 0, 0); pg.fillStyle = brush; pg.fillRect(0, 0, 400, 400); K.sfx.tone(380, 0.16, { to: 700, vol: 0.14 });
      } else if (mode === 'fill') {
        if (q.x < 0 || q.y < 0 || q.x > 400 || q.y > 400) return;
        const i = Pic.hit(pg, pic, q.x, q.y); if (i < 0 || fills[i] === brush || anims.some((a) => a.i === i && a.col === brush)) return;
        if (!gesture) { snapshot(); gesture = true; }
        fills[i] = brush; store[pic.id] = fills.slice(); K.save();
        anims.push({ i, col: brush, x: q.x, y: q.y, r: 6 });
        K.sfx.tone(380 + Math.random() * 240, 0.16, { to: 700, vol: 0.14 });
        if (!finished && pic.regions.every((r, j) => fills[j])) { finished = true; ctx.after(700, done); }
      } else {
        if (!gesture) { snapshot(); gesture = true; }
        const w = SIZES[size];
        pg.save(); pg.setTransform(k, 0, 0, k, 0, 0); pg.beginPath(); pg.rect(0, 0, 400, 400); pg.clip(); pg.lineCap = 'round'; pg.lineJoin = 'round'; pg.strokeStyle = brush;
        const a = first || !last ? q : last;
        for (const [alpha, extra] of [[0.25, 5], [1, 0]]) { pg.globalAlpha = alpha; pg.lineWidth = w + extra; pg.beginPath(); pg.moveTo(a.x, a.y); pg.lineTo(q.x + 0.01, q.y + 0.01); pg.stroke(); }
        pg.globalAlpha = 1; pg.restore(); last = q;
      }
    }
    paper.onDown = (p) => { if (chooserOpen) return; gesture = false; last = null; touch(p, true); };
    paper.onMove = (p) => { if (!chooserOpen) touch(p, false); };
    paper.onUp = () => { last = null; gesture = false; savePainting(); };
    function done() {
      K.sfx.sparkle(); ctx.fx.burst(px + P / 2, py + P / 2, { n: 26 }); ctx.fx.confetti();
      ctx.say(`You colored the ${pic.name}!`).then(() => ctx.say(SAY.done));
      book.pulse = true;
    }

    /* ---------- paint pots ---------- */
    const potPos = (i) => (land ? { x: 84 + (i % 2) * 110, y: 206 + Math.floor(i / 2) * 122 } : { x: 62 + (i % 5) * 109, y: py + P + 84 + Math.floor(i / 5) * 104 });
    POTS.forEach((pt, i) => {
      const pos = potPos(i);
      const n = st.add({ z: 20, x: pos.x, y: pos.y, hitR: 50, label: pt.name, lift: 0 });
      n.draw = (g, s) => {
        const on = brush === pt.c; n.lift += ((on ? 1 : 0) - n.lift) * 0.2;
        g.save(); g.translate(0, -n.lift * 10); const q = 1 + n.lift * 0.08; g.scale(q, q);
        if (n.lift > 0.05) { g.beginPath(); g.arc(0, 0, 54, 0, 7); g.strokeStyle = A.alpha(A.C.ink, 0.55 * n.lift); g.lineWidth = 5; g.stroke(); }
        g.beginPath(); A.cut(g, [[-38, -22], [38, -22], [32, 38], [-32, 38]], [6, 6, 12, 12], 0.5, i + 2); A.paper(g, s, '#F3EBDD', { shadow: 0.9, box: { x: -38, y: -22, w: 76, h: 60 }, light: 0.05 });
        g.beginPath(); g.ellipse(0, -22, 39, 14, 0, 0, 7); A.paper(g, s, pt.c, { shadow: 0, grain: 0.12, light: 0.08, box: { x: -39, y: -36, w: 78, h: 28 } });
        g.beginPath(); g.ellipse(0, -22, 39, 14, 0, 0, 7); g.strokeStyle = 'rgba(46,42,59,.22)'; g.lineWidth = 2.5; g.stroke();
        g.beginPath(); A.blob(g, 16, 4, 7, 15, 0.1, i + 9); g.fillStyle = pt.c; g.fill();   // a drip down the side
        if (pt.name === 'white') { g.beginPath(); A.blob(g, 16, 4, 7, 15, 0.1, i + 9); g.strokeStyle = 'rgba(46,42,59,.2)'; g.lineWidth = 2; g.stroke(); }
        g.restore();
      };
      n.onTap = () => { brush = pt.c; K.sfx.tap(); K.say(pt.name); };
    });

    /* ---------- mixing dish and water jar ---------- */
    const row3 = py + P + 84 + 208, tall = !land && H - (row3 + 50) > 150;   // a tall phone has room for a fourth row and bigger tools
    const dp = land ? { x: 92, y: 872 } : tall ? { x: W / 2 - 80, y: row3 + 128 } : { x: 62, y: row3 };
    const dish = st.add({ z: 20, x: dp.x, y: dp.y, sx: land || tall ? 1 : 0.78, sy: land || tall ? 1 : 0.78, hitR: 62, label: 'mixing dish', cols: [], col: null, swirl: 0 });
    dish.draw = (g, s) => {
      const on = dish.col && brush === dish.col;
      if (on) { g.beginPath(); g.arc(0, 0, 70, 0, 7); g.strokeStyle = A.alpha(A.C.ink, 0.55); g.lineWidth = 5; g.stroke(); }
      g.beginPath(); A.blob(g, 0, 0, 62, 58, 0.03, 4, 12); A.paper(g, s, '#FBF6EC', { shadow: 1, box: { x: -62, y: -58, w: 124, h: 116 }, light: 0.05 });
      g.beginPath(); g.arc(0, 0, 47, 0, 7); g.fillStyle = 'rgba(46,42,59,.07)'; g.fill();
      if (dish.col) {
        g.save(); g.beginPath(); A.blob(g, 0, 0, 44, 41, 0.07, 6, 11); g.clip();
        g.fillStyle = dish.col; g.fillRect(-50, -50, 100, 100);
        if (dish.swirl > 0) { g.globalAlpha = Math.min(1, dish.swirl); dish.cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); for (let t = 0; t < 5.5; t += 0.25) { const a = t + st.t * 9 + (i * 6.283) / dish.cols.length, r = 5 + t * 6.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); }); g.globalAlpha = 1; }
        g.beginPath(); g.ellipse(-14, -16, 13, 7, -0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill();
        g.restore();
      }
    };
    dish.update = (dt) => { dish.swirl = Math.max(0, dish.swirl - dt * 0.9); };
    dish.onTap = () => {
      if (!dish.col) { dish.cols = [brush]; dish.col = brush; K.sfx.tone(300, 0.12, { to: 160, vol: 0.2 }); return; }
      if (brush !== dish.col) {
        dish.cols.push(brush); if (dish.cols.length > 4) dish.cols.shift();
        dish.col = mix(dish.cols); dish.swirl = 1.4;
        for (let i = 0; i < 6; i++) K.sfx.tone(300 + i * 60, 0.09, { vol: 0.1, delay: i * 0.07 });
        ctx.after(650, () => K.say(nameOf(dish.col)));
      } else dish.swirl = 0.8;
      brush = dish.col;
    };
    const wp = land ? { x: 206, y: 880 } : tall ? { x: W / 2 + 80, y: row3 + 136 } : { x: 150, y: row3 + 8 };
    const water = st.add({ z: 20, x: wp.x, y: wp.y, sx: land || tall ? 1 : 0.8, sy: land || tall ? 1 : 0.8, hit: { x: -40, y: -70, w: 80, h: 110 }, label: 'water', tint: null, slosh: 0 });
    water.draw = (g) => {
      const path = (h) => { h.moveTo(-32, -58); h.lineTo(32, -58); h.lineTo(26, 34); h.lineTo(-26, 34); h.closePath(); };
      g.save(); g.beginPath(); path(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-40, -60, 80, 100);
      const top = -24 + Math.sin(st.t * 14) * water.slosh * 5; g.beginPath(); g.moveTo(-40, top); g.quadraticCurveTo(0, top + water.slosh * 10 * Math.sin(st.t * 11), 40, top); g.lineTo(40, 40); g.lineTo(-40, 40); g.closePath();
      g.fillStyle = water.tint ? A.mix('#BFE3EE', water.tint, 0.45) : '#BFE3EE'; g.fill(); g.restore();
      g.beginPath(); path(g); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4; g.stroke();
      g.beginPath(); path(g); g.strokeStyle = 'rgba(70,110,120,.3)'; g.lineWidth = 1.5; g.stroke();
    };
    water.update = (dt) => { water.slosh = Math.max(0, water.slosh - dt * 1.2); };
    water.onTap = () => { water.tint = dish.col || water.tint; dish.cols = []; if (brush === dish.col) brush = POTS[0].c; dish.col = null; water.slosh = 1; K.sfx.noise(0.3, { freq: 900, vol: 0.14 }); K.sfx.tone(500, 0.2, { to: 250, vol: 0.12 }); };

    /* ---------- tools ---------- */
    const toolPos = (i) => (land ? { x: W - 104, y: 226 + i * 128 } : tall ? { x: 64 + i * 108, y: row3 } : { x: 232 + i * 73, y: row3 });
    const tool = (i, label, icon, onTap) => {
      const pos = toolPos(i), r = land ? 50 : tall ? 46 : 34;
      const n = st.add({ z: 20, x: pos.x, y: pos.y, hitR: r + 4, label, pulse: false, on: null });
      n.draw = (g, s) => { const q = (n.pulse ? 1 + Math.sin(st.t * 6) * 0.07 : 1) * (r / 50); g.save(); g.scale(q, q); g.beginPath(); g.arc(0, 0, 50, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 1, light: 0.04, box: { x: -50, y: -50, w: 100, h: 100 } }); if (n.on && n.on()) { g.beginPath(); g.arc(0, 0, 55, 0, 7); g.strokeStyle = A.C.tomato; g.lineWidth = 8; g.stroke(); } icon(g, s); g.restore(); };
      n.onTap = () => onTap(n);
      return n;
    };
    const book = tool(0, 'pictures', (g, s) => {
      for (const [dx, rot, col] of [[-6, -0.14, '#E9DCC6'], [5, 0.08, '#FFFFFF']]) { g.save(); g.translate(dx, 2); g.rotate(rot); g.beginPath(); A.rect(g, -24, -28, 48, 56, 5, 3, 0.4); A.paper(g, s, col, { shadow: 0.6, grain: 0.08 }); g.restore(); }
      g.save(); g.translate(5, 2); g.rotate(0.08); g.beginPath(); g.arc(8, -12, 7, 0, 7); g.fillStyle = A.C.marigold; g.fill(); g.beginPath(); g.moveTo(-20, 22); g.quadraticCurveTo(-4, -4, 8, 12); g.quadraticCurveTo(16, 4, 20, 22); g.closePath(); g.fillStyle = A.C.leaf; g.fill(); g.restore();
    }, () => { K.sfx.pop(); openChooser(); });
    // pour (fills a whole shape) or brush (paints where the finger goes): the ringed one is in use
    const bucket = tool(1, 'pour', (g, s) => {
      g.save(); g.rotate(-0.5); g.beginPath(); A.cut(g, [[-22, -18], [22, -18], [17, 24], [-17, 24]], 5, 0.4, 3); A.paper(g, s, '#B9B4BE', { shadow: 0.5 });
      g.beginPath(); g.ellipse(0, -18, 22, 7, 0, 0, 7); g.fillStyle = brush; g.fill(); g.strokeStyle = 'rgba(46,42,59,.3)'; g.lineWidth = 2; g.stroke(); g.restore();
      g.beginPath(); A.blob(g, 26, 16, 9, 13, 0.1, 4); g.fillStyle = brush; g.fill(); if (brush === '#FFFFFF') { g.strokeStyle = 'rgba(46,42,59,.25)'; g.lineWidth = 2; g.stroke(); }
    }, () => { mode = 'fill'; K.sfx.tap(); });
    bucket.on = () => mode === 'fill';
    const brushTool = tool(2, 'brush', (g, s) => {
      g.save(); g.translate(-6, 8); g.rotate(0.7);
      g.beginPath(); A.rect(g, -5, -2, 10, 40, 5, 2, 0.3); A.paper(g, s, A.C.wood, { shadow: 0.4 });
      g.beginPath(); A.rect(g, -7, -12, 14, 12, 2, 3, 0.2); g.fillStyle = '#B9B4BE'; g.fill();
      g.beginPath(); g.moveTo(-7, -12); g.quadraticCurveTo(-9, -32, 0, -44); g.quadraticCurveTo(9, -32, 7, -12); g.closePath(); g.fillStyle = brush; g.fill(); if (brush === '#FFFFFF') { g.strokeStyle = 'rgba(46,42,59,.25)'; g.lineWidth = 2; g.stroke(); }
      g.restore();
      g.beginPath(); g.arc(24, 22, [5, 9, 14][size], 0, 7); g.fillStyle = A.C.ink; g.fill();
    }, () => { if (mode === 'brush') { size = (size + 1) % 3; K.say(SIZE_NAMES[size]); } mode = 'brush'; K.sfx.tap(); });
    brushTool.on = () => mode === 'brush';
    tool(3, 'undo', (g) => { A.line(g, A.C.ink, 7, (h) => { h.arc(2, 4, 20, Math.PI * 1.15, Math.PI * 0.35); }); g.beginPath(); g.moveTo(-30, -16); g.lineTo(-8, -20); g.lineTo(-20, 2); g.closePath(); g.fillStyle = A.C.ink; g.fill(); },
      () => { const u = undo.pop(); if (!u) { K.sfx.tap(); return; } revision++; changed = true; anims.length = 0; pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, S, S); pg.drawImage(u.c, 0, 0); fills = u.fills; if (pic) { store[pic.id] = fills.slice(); K.save(); finished = false; } savePainting(); K.sfx.whoosh(); });
    let armed = 0;
    tool(4, 'wipe', (g, s) => { g.save(); g.rotate(-0.2); g.beginPath(); A.rect(g, -28, -18, 56, 36, 10, 3, 1); A.paper(g, s, '#F2D060', { shadow: 0.6 }); for (const [x, y, r] of [[-12, -4, 5], [8, 4, 4], [14, -8, 3]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#D9B345'; g.fill(); } g.restore(); },
      (n) => {
        if (performance.now() - armed > 4000) { armed = performance.now(); n.pulse = true; ctx.after(4000, () => (n.pulse = false)); K.sfx.tap(); K.say(SAY.wipe); return; }
        armed = 0; n.pulse = false; snapshot(); revision++; changed = true; anims.length = 0; fills = []; if (pic) { store[pic.id] = []; K.save(); finished = false; } repaintAll(); savePainting(); K.sfx.whoosh();
      });
    // the loaded brush, so the current colour is always in view
    if (land) st.add({ z: 20, x: W - 104, y: 880, draw(g, s) {
      g.save(); g.rotate(0.35);
      g.beginPath(); A.rect(g, -8, -10, 16, 96, 7, 2, 0.4); A.paper(g, s, A.C.wood, { shadow: 0.8 });
      g.beginPath(); A.rect(g, -11, -26, 22, 20, 3, 3, 0.3); A.paper(g, s, '#B9B4BE', { shadow: 0.3 });
      g.beginPath(); g.moveTo(-11, -26); g.quadraticCurveTo(-14, -60, 0, -84); g.quadraticCurveTo(14, -60, 11, -26); g.closePath(); A.paper(g, s, brush, { shadow: 0.5, grain: 0.15 });
      if (brush === '#FFFFFF') { g.strokeStyle = 'rgba(46,42,59,.25)'; g.lineWidth = 2; g.stroke(); }
      g.restore();
    } });

    /* ---------- picture chooser ---------- */
    let chooser = null;
    function openChooser() {
      if (chooserOpen) return; chooserOpen = true; book.pulse = false;
      const cols = 3, n = Pic.list.length + 1, rows = Math.ceil(n / cols);
      const t = Math.min((W - 120) / cols - 24, (H - 220) / rows - 24, 250), gap = 24;
      const pw = cols * t + (cols + 1) * gap, ph = rows * t + (rows + 1) * gap;
      const x0 = (W - pw) / 2, y0 = (H - ph) / 2 + 20;
      chooser = st.add({ z: 200, ui: true, alpha: 0, hit: { x: 0, y: 0, w: W, h: H }, pad: 0, pressable: false });
      chooser.draw = (g, s) => { g.fillStyle = 'rgba(46,42,59,.45)'; g.fillRect(0, 0, W, H); g.beginPath(); A.rect(g, x0, y0, pw, ph, 30, 4, 1.5); A.paper(g, s, '#F6EFE3', { shadow: 1.4, depth: 1.6, box: { x: x0, y: y0, w: pw, h: ph } }); };
      chooser.onTap = (p) => { if (p && (p.x < x0 || p.x > x0 + pw || p.y < y0 || p.y > y0 + ph)) closeChooser(); };
      chooser.to({ alpha: 1 }, { dur: 0.2 });
      const px2 = Math.round(t * st.res);
      [null].concat(Pic.list).forEach((p, i) => {
        const bmp = p ? Pic.render(p, store[p.id], px2) : null;
        const tile = chooser.add(new E.Node({ x: x0 + gap + (i % cols) * (t + gap) + t / 2, y: y0 + gap + Math.floor(i / cols) * (t + gap) + t / 2, hit: { x: -t / 2, y: -t / 2, w: t, h: t }, pad: 4, label: p ? p.name : SAY.blank, z: 1 }));
        tile.draw = (g, s) => {
          g.beginPath(); A.rect(g, -t / 2, -t / 2, t, t, 10, i + 3, 0.6); A.paper(g, s, Pic.PAPER, { shadow: 1, light: 0, grain: 0.06 });
          if (bmp) g.drawImage(bmp, -t / 2 + 4, -t / 2 + 4, t - 8, t - 8);
          else { g.save(); g.rotate(-0.5); g.beginPath(); A.rect(g, -5, -t * 0.04, 10, t * 0.34, 5, 2, 0.3); g.fillStyle = A.C.wood; g.fill(); g.beginPath(); g.moveTo(-8, -t * 0.04); g.quadraticCurveTo(-10, -t * 0.2, 0, -t * 0.3); g.quadraticCurveTo(10, -t * 0.2, 8, -t * 0.04); g.closePath(); g.fillStyle = A.C.tomato; g.fill(); g.restore(); A.line(g, A.C.blue, 8, (h) => { h.moveTo(-t * 0.3, t * 0.26); h.bezierCurveTo(-t * 0.1, t * 0.1, t * 0.05, t * 0.4, t * 0.3, t * 0.22); }); }
          if (p && p.regions.every((r, j) => (store[p.id] || [])[j])) { g.save(); g.translate(t / 2 - 22, -t / 2 + 22); g.beginPath(); for (let q = 0; q < 10; q++) { const a = (q / 10) * 6.283 - 1.57, rr = q % 2 ? 9 : 19; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); A.paper(g, s, A.C.marigold, { shadow: 0.7 }); g.restore(); }
        };
        tile.onTap = () => { K.sfx.pop(); closeChooser(); load(p); };
      });
      K.say(SAY.pick);
    }
    function closeChooser() { if (!chooser) return; const c = chooser; chooser = null; c.to({ alpha: 0 }, { dur: 0.15 }).then(() => { c.remove(); chooserOpen = false; }); }

    /* ---------- frame: paint spreading out from the finger ---------- */
    st.onframe = (dt) => {
      if (!anims.length) return;
      pg.setTransform(k, 0, 0, k, 0, 0);
      for (let n = anims.length - 1; n >= 0; n--) {
        const a = anims[n]; a.r += dt * (520 + a.r * 2.2);
        const end = a.r > 600;
        if (fills[a.i] === a.col) { Pic.fillRegion(pg, pic, a.i, a.col, end ? null : a); Pic.paintAbove(pg, pic, fills, a.i); }
        if (end) anims.splice(n, 1);
      }
    };

    K._paint = { get pic() { return pic; }, get fills() { return fills; }, get brush() { return brush; }, get mode() { return mode; }, dish, toPage: (x, y) => ({ x: px + (x / 400) * P, y: py + (y / 400) * P }) }; // for browser tests
    ctx.onExit(() => { K._paint = null; });
    load(store._last === 'blank' ? null : Pic.list.find((p) => p.id === store._last) || Pic.list.find((p) => !p.regions.every((r, i) => (store[p.id] || [])[i])) || Pic.list[0]);
  }

  K.game({ id: 'paint', title: 'Paint Studio', voice: 'color', group: 'create', order: 1, start, lines, resize: () => K.go('paint') });
})();
