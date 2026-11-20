/* Pip's Town — drive Pip's delivery van along a paper street.
   The street is seen from the side, like a picture book, and goes round for ever. Hold the big
   green button (or hold a finger anywhere) and the van drives; let go and it brakes. Tap a shop or
   a friend and it drives there by itself. Friends think of something they want: the van pulls up
   at the right shop on its own, the keeper tosses it on the back, and at the friend's house it is
   handed over. Nothing has to be placed or aimed. Around town things rustle: tap them and whoever
   is hiding pops out. Humps make the van hop, ducklings cross at the red light, the horn honks.

   Spoken lines reuse the old Vroom and Peekaboo recordings where they fit. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, T = A.town, V = A.valley;
  const WW = 3900, TILE = 975, NEAR = 190;
  const SHOPS = [
    { id: 'bakery', name: 'bakery', item: 'cake', kind: 'shop', x: 280, keeper: 'pig' },
    { id: 'flowers', name: 'flower shop', item: 'flowers', kind: 'shop', x: 1160, keeper: 'chick' },
    { id: 'post', name: 'post office', item: 'letter', kind: 'shop', x: 2620, keeper: 'mouse' },
    { id: 'balloons', name: 'balloon cart', item: 'balloon', kind: 'cart', x: 3030, keeper: 'dog' },
    { id: 'fruit', name: 'fruit stall', item: 'apples', kind: 'stall', x: 3740, keeper: 'hedgehog' },
  ];
  const FRIENDS = [{ face: 'bear', name: 'Bear', x: 650 }, { face: 'bunny', name: 'Bunny', x: 2130 }, { face: 'fox', name: 'Fox', x: 3290 }];
  const HIDES = [
    { a: 'owl', sound: 'hoo hoo', cover: 'tree', label: 'tree', x: 900, from: [0, -176], to: [-78, -246], k: 0.6, hit: [-90, -262, 180, 262] },
    { a: 'frog', sound: 'ribbit', cover: 'lily', label: 'lily pad', x: 1800, from: [8, 52], to: [8, -30], k: 0.6, clip: true, hit: [-70, -84, 140, 116] },
    { a: 'cat', sound: 'meow', cover: 'bush', label: 'bush', x: 2370, from: [0, -34], to: [0, -122], k: 0.62, hit: [-100, -116, 200, 122] },
    { a: 'panda', sound: 'hello', cover: 'pillar', label: 'mailbox', x: 2815, from: [0, -62], to: [0, -152], k: 0.52, hit: [-56, -140, 112, 150] },
    { a: 'lion', sound: 'roar', cover: 'hay', label: 'haystack', x: 3530, from: [0, -44], to: [0, -136], k: 0.6, hit: [-84, -116, 168, 122] },
  ];
  const LX = 1430, PONDX = 1730, BUMPS = [1010, 2470, 3410];
  const ITEM = { cake: ['a cake', 'two cakes'], flowers: ['flowers'], letter: ['a letter', 'two letters'], balloon: ['a balloon', 'two balloons'], apples: ['apples'] };
  const SAY = {
    horn: 'Beep beep!', great: 'Great driving!', who: 'Who is hiding? Tap and see!', again: 'They are hiding again!', choo: 'Choo choo!', quack: 'quack quack!',
    thanks: 'Thank you, Pip!', hello: 'Hello, Pip!', hold: 'Hold the green button to go!',
    want: (f, item, qty) => `${f.name} wants ${ITEM[item][qty - 1]}!`, drive: (s) => `Drive to the ${s.name}!`, take: (f) => `Take it to ${f.name}!`,
    found: (h) => `You found the ${h.a}!`, sound: (h) => `${h.sound}!`,
  };
  function lines() {
    const out = [SAY.horn, SAY.great, SAY.who, SAY.again, SAY.choo, SAY.quack, SAY.thanks, SAY.hello, SAY.hold];
    for (const f of FRIENDS) { out.push(SAY.take(f)); for (const i in ITEM) ITEM[i].forEach((w, q) => out.push(SAY.want(f, i, q + 1))); }
    for (const s of SHOPS) out.push(SAY.drive(s));
    for (const h of HIDES) out.push(SAY.found(h), SAY.sound(h));
    return out;
  }
  const mod = (a, n) => ((a % n) + n) % n;
  /** Signed shortest way round the street from a to b. */
  const wrapD = (a, b) => mod(b - a + WW / 2, WW) - WW / 2;

  function start(st, ctx) {
    const W = st.W, H = st.H, L = ctx.level, phone = W < 1000;
    const R = phone ? H - 420 : H - 250;        // where the wheels touch the road
    const PY = R - 96, HOR = PY - 240;          // back of the pavement; top of the meadow
    const VK = phone ? 1.14 : 1.16, MAXV = phone ? 340 : 440, AC = 560, BR = 780, BRK = 600;
    const POND = { x: PONDX, y: PY - 112, rx: 150, ry: 36 };
    const store = (K.s.done.town = K.s.done.town || { deliveries: 0, found: 0 });
    K.preloadVoice('vroom'); K.preloadVoice('peekaboo');
    const draw = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
    const toScreen = (x, y) => ({ x: x - st.cam.x, y });
    const key = (k) => k + Math.round(W) + 'x' + Math.round(H);

    /* ---------- the street goes round: everything is drawn at the copy nearest the camera ---------- */
    let camC = W / 2;
    const near = (bx) => bx + WW * Math.round((camC - bx) / WW);
    const wrapped = [];
    const world = (o) => { const n = st.add(o); n.bx = n.x; wrapped.push(n); return n; };

    /* ---------- sky, hills, railway (they slide by slowly) ---------- */
    const skySp = A.sprite(key('townSky'), [0, 0, W, HOR + 10], (g, s) => T.sky(g, s, W, H, HOR));
    const farSp = A.sprite('townHillF', [0, -170, 1500, 200], (g, s) => T.hills(g, s, 1500, 160, 30, A.C.far, 11));
    const nearSp = A.sprite('townHillN', [0, -90, 1320, 120], (g, s) => { T.hills(g, s, 1320, 70, 30, A.C.far2, 23); g.translate(0, -8); T.rails(g, s, 1320); });
    const clouds = [[0.12, 150, 150, 3], [0.5, 230, 110, 5], [0.86, 170, 130, 8]].map(([fx, y, w, seed], i) => ({ x: fx * (W + 500), y: phone ? y + 60 : y, sp: A.sprite('townCloud' + i, [-w, -w * 0.5, w * 2, w], (g, s) => V.cloud(g, s, w, seed)), v: 5 + i * 2 }));
    const tile = (g, sp, tw, off, y) => { for (let x = -mod(off, tw); x < W; x += tw) { g.save(); g.translate(x, y); draw(g, sp); g.restore(); } };
    st.add({ ui: true, z: 0, update(dt) { for (const c of clouds) c.x += c.v * dt; }, draw(g) {
      draw(g, skySp);
      for (const c of clouds) { g.save(); g.translate(mod(c.x - st.cam.x * 0.04, W + 500) - 250, c.y); draw(g, c.sp); g.restore(); }
      tile(g, farSp, 1500, st.cam.x * 0.08, HOR + 6);
      tile(g, nearSp, 1320, st.cam.x * 0.2, HOR + 4);
    } });

    /* ---------- small particles in the world: exhaust, dust, leaves, splashes ---------- */
    const puffs = [];
    st.add({ z: 19,
      update(dt) { for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.life -= dt; if (p.life <= 0) puffs.splice(i, 1); } },
      draw(g) { for (const p of puffs) { const k = p.life / p.max; g.globalAlpha = Math.min(1, k * 1.6) * (p.a || 0.8); g.beginPath(); g.arc(p.x, p.y, p.r * (p.grow ? 1.6 - k * 0.8 : 1), 0, 7); g.fillStyle = p.c; g.fill(); } g.globalAlpha = 1; } });
    const puff = (x, y, o) => puffs.push(Object.assign({ x, y, vx: 0, vy: -30, r: 9, c: '#FBF8F1', life: 0.7, max: o && o.life || 0.7, grow: true }, o));

    /* ---------- the train on the hills ---------- */
    const train = st.add({ ui: true, z: 1, x: -500, y: HOR - 6, px: 300, hit: { x: -320, y: -96, w: 340, h: 104 }, label: 'train', sprite: A.sprite('townTrain', [-310, -90, 320, 94], T.train) });
    train.update = (dt) => { train.px += dt * 70; const span = W + 4200; train.x = mod(train.px - st.cam.x * 0.2, span) - 400; if (train.x > -60 && train.x < W + 300 && Math.random() < dt * 5) puff(train.x - 30 + st.cam.x, train.y - 90, { vy: -40, vx: -25, r: 10, life: 1.2, a: 0.7 }); };
    function toot() { [0, 0.34].forEach((d) => { K.sfx.tone(587, 0.3, { type: 'triangle', vol: 0.12, delay: d }); K.sfx.tone(740, 0.3, { type: 'triangle', vol: 0.1, delay: d }); }); }
    train.onTap = () => { toot(); K.say(SAY.choo); for (let i = 0; i < 4; i++) puff(train.x - 30 + st.cam.x, train.y - 90, { vy: -70 - i * 14, vx: -20, r: 12, life: 1.3, a: 0.8 }); };

    /* ---------- the ground, in four tiles ---------- */
    const keep = SHOPS.map((q) => [q.x, 150]).concat(FRIENDS.map((q) => [q.x, 140]), HIDES.map((q) => [q.x, 110]));
    for (let i = 0; i < WW / TILE; i++) {
      const n = st.add({ z: 2, sprite: A.sprite(key('townStreet' + i), [i * TILE, HOR - 10, TILE, H - HOR + 10], (g, s) => T.street(g, s, { WW, H, hor: HOR, py: PY, r: R, pond: POND, zebra: [LX], keep })) });
      n.tileC = i * TILE + TILE / 2;
    }
    const tiles = st.root.children.filter((n) => n.tileC != null);

    /* ---------- pond life ---------- */
    [0, 1].forEach((i) => {
      const d = world({ z: 4, x: POND.x, y: POND.y, hitR: 50, label: 'duck', ph: i * 3.1, hop: 0, blink: 0 });
      d.update = (dt) => { d.ph += dt * (0.32 + i * 0.07); const a = d.ph; d.bx = POND.x + Math.cos(a) * (POND.rx - 60) - 30 * i; d.y = POND.y + Math.sin(a) * (POND.ry - 22) - 2; d.dir = -Math.sin(a) >= 0 ? 1 : -1; d.hop = Math.max(0, d.hop - dt * 2.2); d.blink = st.t % (3.3 + i) < 0.14 ? 1 : 0; };
      d.draw = (g, s) => { g.save(); g.translate(0, -Math.sin(d.hop * Math.PI) * 26 + Math.sin(st.t * 2.4 + i) * 1.5); g.scale(d.dir * 0.85, 0.85); g.rotate(-d.hop * 0.3); T.duck(g, s.res, { blink: d.blink }); g.restore(); };
      d.onTap = () => { d.hop = 1; K.sfx.tone(520, 0.09, { type: 'square', vol: 0.08 }); K.sfx.tone(440, 0.12, { type: 'square', vol: 0.08, delay: 0.12 }); K.say(SAY.quack); for (let k = 0; k < 5; k++) puff(d.x + (k - 2) * 12, d.y + 4, { vy: -90 - Math.random() * 60, vx: (k - 2) * 30, g: 420, r: 4, c: '#DDF0F5', life: 0.55, grow: false }); };
    });

    /* ---------- scenery with height ---------- */
    const prop = (k, x, y, box, paint, z) => world({ z: z || 9, x, y, sprite: A.sprite(k, box, paint) });
    [[80, 112, 12, 'round'], [470, 96, 31, 'tall'], [1320, 118, 35, 'round'], [1960, 120, 41, 'tall'], [2480, 104, 44, 'round'], [3170, 110, 47, 'tall'], [3640, 100, 52, 'round']].forEach(([x, size, seed, kind], i) =>
      prop('townTree' + i, x, PY - 40 - (i % 3) * 22, [-size * 0.6, -size * 1.8, size * 1.2, size * 1.85], (g, s) => V.tree(g, s, 0, 0, size, seed, kind), 8));
    prop('townBench', 1560, PY + 6, [-56, -66, 112, 70], T.bench, 11);
    prop('townFenceA', 420, PY - 6, [-100, -40, 200, 44], (g, s) => T.fence(g, s, 180));
    prop('townFenceB', 2000, PY - 6, [-100, -40, 200, 44], (g, s) => T.fence(g, s, 180));
    BUMPS.forEach((x) => prop('townBump', x, R + 4, [-48, -18, 96, 20], T.bump, 5));
    // the light, and the ducklings that cross while it is red
    const lightState = () => { const t = (st.t + 6) % 17; return t < 10.6 ? 'green' : t < 11.6 ? 'yellow' : t < 15.6 ? 'red' : 'green'; };
    const light = world({ z: 11, x: LX - 96, y: PY + 10 });
    light.draw = (g) => draw(g, A.sprite('townLight-' + lightState(), [-24, -182, 48, 184], (h, r) => T.light(h, r, lightState())));
    const cross = world({ z: 18, x: LX, y: 0 });
    cross.draw = (g, s) => {
      const t = (st.t + 6) % 17, p = (t - 11.3) / 4.1; if (p <= 0 || p >= 1) return;
      for (let i = 0; i < 3; i++) { const q = K.clamp(p * 1.25 - i * 0.1, 0, 1), k = (i ? 0.42 : 0.62) * (0.9 + q * 0.25); g.save(); g.globalAlpha = Math.min(1, q * 8, (1 - q) * 8); g.translate(-30 + q * 60 + (i ? 0 : 6), R - 46 + q * 132 - Math.abs(Math.sin(st.t * 10 + i)) * 5); g.scale(k, k); g.rotate(Math.sin(st.t * 10 + i) * 0.1); T.duck(g, s.res * k, { land: true, step: Math.sin(st.t * 10 + i) }); g.restore(); }
    };

    /* ---------- shops ---------- */
    const blinkOf = (seed) => (((st.t + seed * 1.7) % (3.1 + (seed % 3) * 0.7)) < 0.14 ? 1 : 0);
    SHOPS.forEach((sh, i) => {
      const kp = T.KEEPER[sh.kind];
      sh.y = sh.kind === 'cart' ? PY + 34 : PY - 4; sh.sx = sh.x + (sh.kind === 'cart' ? 0 : kp.x * 0.5);
      const back = sh.kind === 'shop' ? A.sprite('townShop' + sh.id, [-130, -244, 260, 250], (g, s) => T.shop(g, s, sh.id, sh.item)) : sh.kind === 'stall' ? A.sprite('townStallB', [-110, -190, 220, 194], T.stallBack) : null;
      const front = sh.kind === 'shop' ? A.sprite('townShopF' + sh.id, [-110, -60, 150, 64], (g, s) => T.shopFront(g, s, sh.id)) : sh.kind === 'stall' ? A.sprite('townStallF', [-124, -266, 248, 270], T.stallFront) : A.sprite('townCart', [-94, -84, 160, 90], T.cart);
      const n = world({ z: sh.kind === 'cart' ? 13 : 10, x: sh.x, y: sh.y, label: sh.name, pressable: false, hop: 0, place: sh,
        hit: sh.kind === 'cart' ? { x: -130, y: -250, w: 260, h: 290 } : { x: -140, y: -250, w: 280, h: 330 } });
      const bal = sh.kind === 'cart' ? T.BALLOONS.map(([bxx, byy, c], j) => ({ x: bxx, y: byy, sp: A.sprite('townBal' + j, [-28, -32, 56, 70], (g, s) => T.balloon(g, s, c)) })) : null;
      n.update = (dt) => { n.hop = Math.max(0, n.hop - dt * 1.8); };
      n.draw = (g, s) => {
        if (back) draw(g, back);
        if (bal) bal.forEach((b, j) => { const sway = Math.sin(st.t * 1.3 + j * 1.9) * 7; A.line(g, 'rgba(46,42,59,.4)', 1.8, (h) => { h.moveTo(-28, -72); h.quadraticCurveTo(b.x * 0.5, b.y * 0.5 - 20, b.x + sway, b.y + 32); }); g.save(); g.translate(b.x + sway, b.y); g.rotate(sway * 0.012); draw(g, b.sp); g.restore(); });
        const j = Math.sin(n.hop * Math.PI * 3) * n.hop * 12;
        g.save(); g.translate(kp.x, kp.y - Math.abs(j)); g.rotate(j * 0.012); g.scale(kp.k, kp.k);
        if (sh.kind === 'cart') { g.beginPath(); A.cut(g, [[-26, 30], [26, 30], [32, 118], [-32, 118]], 12, 0.5, 3); A.paper(g, s.res * kp.k, '#F2B33D', { shadow: 0.4, box: { x: -32, y: 30, w: 64, h: 88 } }); }
        T.keeper(g, s.res * kp.k, sh.keeper, { blink: blinkOf(i) }); g.restore();
        draw(g, front);
      };
      n.onTap = () => { K.sfx.tap(); n.hop = Math.max(n.hop, 0.5); driveTo(sh); };
      sh.n = n; sh.react = () => { n.hop = Math.max(n.hop, 0.45); };
    });

    /* ---------- friends and their houses ---------- */
    FRIENDS.forEach((f, i) => {
      f.sx = f.x - 46; f.py = PY + 28; f.hop = 0; f.happy = 0; f.order = null; f.hold = null; f.holdT = 0;
      const house = world({ z: 10, x: f.x, y: PY - 4, label: f.name, pressable: false, place: f, hit: { x: -140, y: -210, w: 280, h: 290 }, sprite: A.sprite('townHouse' + f.face, [-116, -204, 232, 210], (g, s) => T.house(g, s, f.face)) });
      house.onTap = () => { K.sfx.tap(); f.hop = Math.max(f.hop, 0.6); driveTo(f); };
      const body = world({ z: 12, x: f.sx, y: f.py });
      body.update = (dt) => { f.hop = Math.max(0, f.hop - dt * 1.6); f.happy = Math.max(0, f.happy - dt * 0.45); f.holdT = Math.max(0, f.holdT - dt); if (!f.holdT) f.hold = null; };
      body.draw = (g, s) => {
        const j = Math.abs(Math.sin(st.t * 9)) * 26 * Math.min(1, f.happy * 2) + Math.abs(Math.sin(f.hop * Math.PI * 2)) * 16 * f.hop;
        const sq = Math.sin(st.t * 2 + i) * 0.012;
        g.save(); g.translate(0, -j); g.scale(1 - sq, 1 + sq); T.friend(g, s.res, f.face, { blink: f.happy > 0.2 ? 0 : blinkOf(i + 7), arms: Math.max(Math.min(1, f.happy * 2) * (0.6 + Math.sin(st.t * 12) * 0.2), f.hop > 0.1 ? 0.5 : 0) });
        if (f.hold) { g.translate(0, -164 - Math.sin(st.t * 5) * 4); g.scale(0.62, 0.62); T.item(g, s.res * 0.62, f.hold); }
        g.restore();
      };
      f.n = body; f.react = () => { f.hop = Math.max(f.hop, 0.5); };
      // the thought bubble
      const bub = world({ z: 70, x: f.x + 30, y: f.py - 250, sx: 0, sy: 0, wig: 0 });
      bub.update = (dt) => { bub.wig = Math.max(0, bub.wig - dt * 1.5); };
      bub.draw = (g, s) => {
        const o = f.order; if (!o) return;
        const w = o.qty > 1 ? 168 : 116, tgt = o.loaded >= o.qty, k = tgt ? 1 + Math.sin(st.t * 5) * 0.05 : 1;
        g.save(); g.translate(0, Math.sin(st.t * 2.2 + i) * 5); g.rotate(Math.sin(bub.wig * 20) * 0.12 * bub.wig); g.scale(k, k);
        T.bubble(g, s.res, w, 104, -64, 80);
        for (let q = 0; q < o.qty; q++) { g.save(); g.translate((q - (o.qty - 1) / 2) * 68, -2); g.scale(0.9, 0.9); T.item(g, s.res * 0.9, o.item); g.restore(); }
        if (tgt) { g.save(); g.translate(w / 2 - 12, -40); g.beginPath(); g.arc(0, 0, 17, 0, 7); A.paper(g, s.res, '#6FA65F', { shadow: 0.6 }); A.line(g, '#fff', 5, (h) => { h.moveTo(-8, 0); h.lineTo(-2, 7); h.lineTo(9, -7); }); g.restore(); }
        g.restore();
      };
      f.bub = bub;
    });
    const PLACES = SHOPS.concat(FRIENDS);

    /* ---------- places to hide ---------- */
    let foundN = 0;
    HIDES.forEach((h, i) => {
      h.found = false; h.pop = 0; h.wig = 0; h.jump = 0; h.y = h.cover === 'lily' ? POND.y + 8 : PY - 12;
      const cb = { bush: [-106, -116, 212, 124], tree: [-112, -262, 224, 266], pillar: [-40, -134, 80, 140], lily: [-64, -34, 128, 66], hay: [-86, -118, 172, 124] }[h.cover];
      const sp = A.sprite('townCover' + h.cover, cb, T.cover[h.cover]);
      const n = world({ z: h.cover === 'lily' ? 4 : 11, x: h.x, y: h.y, pop: 0 });
      n.update = (dt) => { h.wig = Math.max(0, h.wig - dt * 1.4); h.jump = Math.max(0, h.jump - dt * 1.8); };
      n.draw = (g, s) => {
        const p = n.pop;
        if (p > 0.01) {
          g.save();
          if (h.clip) { g.beginPath(); g.rect(-90, -200, 180, 200); g.clip(); }
          g.translate(h.from[0] + (h.to[0] - h.from[0]) * p, h.from[1] + (h.to[1] - h.from[1]) * p - Math.abs(Math.sin(h.jump * Math.PI * 2)) * 22 * h.jump);
          g.rotate(Math.sin(st.t * 5 + i) * 0.07 * (h.found ? 1 : 0.3)); g.scale(h.k, h.k);
          A.face(g, s.res * h.k, h.a, { blink: blinkOf(i + 3) }); g.restore();
        }
        g.save(); const w = Math.sin(h.wig * 26) * 0.06 * h.wig; g.rotate(w); g.scale(1 + Math.abs(w) * 0.5, 1 - Math.abs(w) * 0.5); draw(g, sp); g.restore();
      };
      // taps go to an unseen node above everything, so a parked van never blocks a hiding place
      world({ z: 60, x: h.x, y: h.y, label: h.label, pressable: false, hide: true, hit: { x: h.hit[0], y: h.hit[1], w: h.hit[2], h: h.hit[3] }, pad: 10 }).onTap = () => reveal(h);
      h.n = n; h.sx = h.x; h.react = () => { if (!h.found) { h.wig = Math.max(h.wig, 0.6); } };
    });
    function leaves(h) { const c = { lily: '#DDF0F5', hay: '#E9C86A', pillar: '#FBF6EC' }[h.cover] || '#7DB56B'; for (let k = 0; k < 8; k++) puff(h.n.x + (Math.random() - 0.5) * 90, h.n.y + h.to[1] * 0.6 + (Math.random() - 0.5) * 40, { vx: (Math.random() - 0.5) * 220, vy: -120 - Math.random() * 120, g: 500, r: 5 + Math.random() * 3, c, life: 0.7, grow: false, a: 1 }); }
    function reveal(h) {
      h.wig = 1; leaves(h); K.sfx.pop();
      if (h.found) { h.jump = 1; K.say(SAY.sound(h)); return; }
      h.found = true; foundN++; store.found = (store.found || 0) + 1; K.save();
      h.n.to({ pop: 1 }, { dur: 0.45, ease: 'back' });
      const p = toScreen(h.n.x + h.to[0], h.n.y + h.to[1]); ctx.fx.burst(p.x, p.y, { n: 14 });
      K.sfx.sparkle(); ctx.say(SAY.found(h));
      // a little copy flies to the strip
      const slot = stripSlot(HIDES.indexOf(h));
      const fly = st.add({ ui: true, z: 85, x: p.x, y: p.y, sx: h.k, sy: h.k, draw(g, s) { A.face(g, s.res * fly.sx, h.a); } });
      fly.to({ x: slot.x, y: slot.y, sx: 0.4, sy: 0.4 }, { dur: 0.7, ease: 'inOut', delay: 0.5 }).then(() => { fly.remove(); h.inStrip = true; K.sfx.step(foundN); });
      if (foundN === HIDES.length) ctx.after(2200, () => ctx.celebrate().then(() => ctx.after(5000, rehide)));
    }
    function rehide() { foundN = 0; for (const h of HIDES) { h.found = false; h.inStrip = false; h.n.to({ pop: 0 }, { dur: 0.4, ease: 'inOut' }); h.wig = 1; } K.sfx.whoosh(); ctx.say(SAY.again); }
    const onScreen = (x, m) => { const sx = x - st.cam.x; return sx > (m || 0) && sx < W - (m || 0); };
    ctx.every(5200, () => {
      const pool = HIDES.filter((h) => !h.found && h.n.pop < 0.05); if (!pool.length) return;
      const seen = pool.filter((h) => onScreen(h.n.x, 20));
      const h = K.pick(seen.length ? seen : pool); h.wig = 1; leaves(h); K.sfx.noise(0.16, { freq: 1800, vol: 0.05 });
      h.n.to({ pop: 0.42 }, { dur: 0.3, ease: 'out' }).then(() => { if (!h.found) h.n.to({ pop: 0 }, { dur: 0.35, ease: 'inOut', delay: 0.7 }); });
    });

    /* ---------- grass by the road that bends as the van goes by ---------- */
    const tufts = [];
    for (let i = 0; i < 13; i++) {
      const x = 150 + i * 300 + (i % 3) * 40, hgt = 34 + (i % 4) * 7;
      const n = world({ z: 30, x, y: R + 108 + (i % 2) * 10, sway: 0, sv: 0, sprite: A.sprite('townTuft' + (i % 4), [-34, -hgt - 12, 68, hgt + 14], (g, s) => { V.tuft(g, s, 0, 0, hgt, i + 300, i % 2 ? '#6FA66E' : '#7DB172'); if (i % 4 === 1) V.flower(g, s, 14, 0, 10, '#FBF8F1'); }) });
      n.update = (dt) => { n.sv += (-n.sway * 60 - n.sv * 5) * dt; n.sway += n.sv * dt; n.rot = n.sway + Math.sin(st.t * 1.3 + i) * 0.03; };
      n.react = (dir) => { n.sv += dir * 3.2; }; n.sx0 = x; tufts.push(n);
    }

    /* ---------- who has been found: a strip of faces ---------- */
    const SW = HIDES.length * 64 + 20;
    const strip = st.add({ ui: true, z: 80, x: phone ? W / 2 - SW / 2 : 150, y: phone ? 136 : 41, hit: { x: 0, y: 0, w: SW, h: 74 }, label: 'who is hiding', pressable: false });
    const stripSlot = (i) => ({ x: strip.x + 42 + i * 64, y: strip.y + 39 });
    strip.draw = (g, s) => {
      g.beginPath(); A.rect(g, 0, 0, SW, 74, 37, 5, 0.8); A.paper(g, s.res, A.alpha('#FBF6EC', 0.94), { shadow: 0.8, light: 0, grain: 0.12 });
      HIDES.forEach((h, i) => {
        g.save(); g.translate(42 + i * 64, 39);
        if (h.inStrip) { g.scale(0.4, 0.4); A.face(g, s.res * 0.4, h.a); }
        else { g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fillStyle = 'rgba(46,42,59,.12)'; g.fill(); g.fillStyle = 'rgba(46,42,59,.22)'; g.beginPath(); g.arc(-8, -3, 3, 0, 7); g.arc(8, -3, 3, 0, 7); g.fill(); }
        g.restore();
      });
    };
    strip.onTap = () => { K.sfx.tap(); const pool = HIDES.filter((h) => !h.found); if (pool.length) { const h = K.pick(pool); h.wig = 1; leaves(h); } K.say(SAY.who); };

    /* ---------- the van ---------- */
    const VAN = T.VAN, vanSp = A.sprite('townVan', VAN.box, T.vanBody);
    const van = st.add({ z: 20, x: 430, y: R, label: 'van', pressable: false, hit: { x: -130 * VK, y: -150 * VK, w: 260 * VK, h: 172 * VK }, pad: 6,
      v: 0, face: 1, fs: 1, pitch: 0, wheel: 0, sq: 0, honk: 0, cargo: [], jy: 0, jv: 0, auto: null, place: null, pause: 0, loading: 0, waitRed: false, kick: 0 });
    let holdDir = 0, goHeld = false, goT = -9, hold = null, flag = 0, flagX = 0, quiet = 0, hinted = false;
    const stopFor = (q) => { const d0 = wrapD(van.x, q.sx), dir = Math.abs(d0) < 70 ? van.face : Math.sign(d0); return wrapD(van.x, q.sx + 50 * VK * dir); };
    const isTarget = (q) => targets().some((t) => t.q === q);
    function driveTo(q) {
      flag = 1; flagX = q.sx; quiet = 0;
      const d = stopFor(q);
      if (Math.abs(wrapD(van.x, q.sx)) < NEAR && Math.abs(van.v) < 160 && (Math.abs(d) < 90 || isTarget(q))) { van.auto = null; van.place = null; arrive(q); return; }
      if (Math.abs(van.v) < 20) K.sfx.tone(140, 0.25, { to: 220, type: 'sawtooth', vol: 0.05 });
      van.auto = van.x + d; van.place = q;
    }
    function driveToX(wx) { const d = wrapD(van.x, wx); flag = 1; flagX = wx; quiet = 0; if (Math.abs(d) < 40) return; van.auto = van.x + d; van.place = null; }
    function driveNext() { const t = targets()[0]; if (t) driveTo(t.q); else driveToX(van.x + van.face * 700); }
    function honk() {
      van.honk = 1; van.sq = 1; quiet = 0; K.sfx.tone(440, 0.14, { type: 'square', vol: 0.1 }); K.sfx.tone(440, 0.2, { type: 'square', vol: 0.1, delay: 0.2 }); K.say(SAY.horn);
      // everyone near looks up
      for (const q of PLACES) if (Math.abs(wrapD(van.x, q.sx)) < 520) q.react();
      for (const h of HIDES) if (Math.abs(wrapD(van.x, h.x)) < 520 && !h.found && h.n.pop < 0.05) { h.wig = 1; h.n.to({ pop: 0.42 }, { dur: 0.3, ease: 'out' }).then(() => { if (!h.found) h.n.to({ pop: 0 }, { dur: 0.35, ease: 'inOut', delay: 0.9 }); }); }
    }
    van.onTap = honk;
    const pipSt = { look: 0.6 };
    function dust(n, c) { for (let k = 0; k < n; k++) puff(van.x + (Math.random() - 0.5) * 150 * VK, R - 4, { vx: (Math.random() - 0.5) * 120 - van.v * 0.2, vy: -20 - Math.random() * 30, r: 7 + Math.random() * 4, c: c || '#E9DDBE', life: 0.5, a: 0.6 }); }
    van.update = (dt) => {
      van.honk = Math.max(0, van.honk - dt * 1.4); van.sq = Math.max(0, van.sq - dt * 3); flag = Math.max(0, flag - dt * 0.6); van.pause = Math.max(0, van.pause - dt);
      const prevX = van.x, prevV = van.v;
      let want = 0;
      if (van.auto != null) {
        const d = van.auto - van.x;
        if (Math.abs(d) < 6 && Math.abs(van.v) < 90) { van.x = van.auto; van.v = 0; const q = van.place; van.auto = null; van.place = null; arrive(q); }
        else want = Math.sign(d) * Math.min(MAXV, Math.sqrt(2 * BRK * Math.abs(d)) + 26);
      } else if (holdDir && !van.pause) {
        want = holdDir * MAXV;
        // it pulls up by itself where something is wanted
        const sd = (van.v * van.v) / (2 * BRK) + 60;
        for (const t of targets()) { const d = stopFor(t.q); if (d * holdDir > 0 && Math.abs(d) < sd && Math.abs(wrapD(van.x, t.q.sx)) > 60) { van.auto = van.x + d; van.place = t.q; break; } }
      } else if (!van.pause && Math.abs(van.v) < 30) {
        // left standing a little way off: roll up to the door
        for (const t of targets()) { const dn = Math.abs(wrapD(van.x, t.q.sx)); if (dn >= NEAR && dn < 320) { driveTo(t.q); break; } }
      }
      // the red light
      van.waitRed = false;
      if (want && lightState() === 'red') { const dir = Math.sign(want), ahead = wrapD(van.x, LX - dir * 240) * dir; if (ahead > -30 && ahead < 360) { want = dir * Math.min(Math.abs(want), Math.sqrt(2 * BRK * Math.max(0, ahead - 8))); van.waitRed = ahead < 50; } }
      // turn round before driving the other way
      if (want && Math.sign(want) !== van.face) { if (Math.abs(van.v) < 50) { van.face = Math.sign(want); van.jv = -200; van.v = 0; K.sfx.whoosh(); } else want = 0; }
      if (Math.abs(van.fs - van.face) > 0.5) want = 0;   // (still turning)
      van.fs += (van.face - van.fs) * Math.min(1, dt * 11);
      const speeding = Math.abs(want) > Math.abs(van.v), rate = speeding ? AC : BR;
      van.v += K.clamp(want - van.v, -rate * dt, rate * dt);
      van.x += van.v * dt;
      const acc = dt > 0 ? ((van.v - prevV) / dt) * van.face : 0;
      van.kick *= Math.exp(-dt * 7);
      van.pitch += (-K.clamp(acc / BR, -1, 1) * 0.055 + van.kick - van.pitch) * Math.min(1, dt * 8);
      if (Math.abs(prevV) < 15 && Math.abs(van.v) >= 15) { for (let k = 0; k < 5; k++) puff(van.x - van.face * (90 + k * 14) * VK, R - 8 - k * 3, { vx: -van.face * (50 + k * 20), vy: -18 - k * 6, r: 8 + k, life: 0.7, a: 0.7 }); K.sfx.tone(110, 0.3, { to: 190, type: 'sawtooth', vol: 0.05 }); }
      if (Math.abs(prevV) > 260 && want === 0 && Math.abs(van.v) > 120 && Math.random() < dt * 20) puff(van.x + van.face * 60 * VK, R - 4, { vx: van.v * 0.3, vy: -20, r: 6, c: '#E9DDBE', life: 0.4, a: 0.5 });
      const sp = Math.abs(van.v);
      if (sp > 60 && (van.putt = (van.putt || 0) + dt) > 0.15) { van.putt = 0; K.sfx.tone(70 + sp * 0.06, 0.07, { type: 'triangle', vol: 0.035 }); }
      if (sp > 60 && Math.random() < dt * 9) puff(van.x - van.face * 118 * VK, R - 26, { vx: -van.face * 40, vy: -24, r: 7, life: 0.6, a: 0.6 });
      // humps in the road: each axle hops over
      for (const bxx of BUMPS) for (const [wx, front] of [[VAN.wheels[1], 1], [VAN.wheels[0], 0]]) {
        const o = wx * VK * van.face, a = wrapD(prevX + o, bxx), b = wrapD(van.x + o, bxx);
        if (a * b < 0 && Math.abs(a) < 80 && sp > 70) { const k = Math.min(1, sp / 320); van.jv = Math.min(van.jv, -170 - 190 * k); van.kick += (front ? -1 : 1) * 0.09 * k; K.sfx.tone(front ? 150 : 120, 0.12, { to: 70, type: 'triangle', vol: 0.12 }); dust(2); }
      }
      van.jv += 2600 * dt; van.jy += van.jv * dt;
      if (van.jy > 0) { if (van.jv > 240) { van.sq = 1; dust(3); } van.jy = 0; van.jv = 0; }
      van.wheel += (van.v * van.face * dt) / (21 * VK);
      // things by the road notice the van going past
      if (sp > 110) {
        for (const q of PLACES.concat(HIDES)) { const d = Math.abs(wrapD(van.x, q.sx)); if (d < 110 && !q.passed) { q.passed = true; q.react(); } else if (d > 330) q.passed = false; }
        for (const n of tufts) { const d = Math.abs(wrapD(van.x, n.sx0)); if (d < 90 && !n.passed) { n.passed = true; n.react(Math.sign(van.v)); } else if (d > 200) n.passed = false; }
      }
      // generous: being anywhere near does the job
      if (sp < 170) for (const t of targets()) if (Math.abs(wrapD(van.x, t.q.sx)) < NEAR) visit(t.q, true);
      pipSt.blink = st.t % 3.7 < 0.14 ? 1 : 0; pipSt.mouth = van.honk > 0.3 || van.jy < -6 ? 'open' : 'smile'; pipSt.leaf = Math.sin(st.t * 9) * Math.min(1, sp / 300) * 0.25 - Math.min(0.3, sp / 1200);
    };
    van.draw = (g, s) => {
      const fs = Math.abs(van.fs) < 0.08 ? 0.08 * (van.fs < 0 ? -1 : 1) : van.fs;
      g.beginPath(); g.ellipse(0, 4, 108 * VK * Math.abs(fs) * (1 + van.jy * 0.004), 13, 0, 0, 7); g.fillStyle = 'rgba(40,34,60,.2)'; g.fill();
      const sp = Math.abs(van.v), bob = sp > 20 ? Math.sin(st.t * 22) * 1.5 : Math.sin(st.t * 14) * 0.5;
      g.save(); g.translate(0, van.jy); g.scale(fs * VK, VK);
      g.save(); g.translate(0, -22); g.rotate(van.pitch); g.translate(0, 22 + bob - 3); const q = Math.sin(van.sq * Math.PI) * 0.07; g.scale(1 + q, 1 - q);
      van.cargo.forEach((c, i) => { const b = VAN.bed[i % VAN.bed.length]; g.save(); g.translate(b[0], b[1] - Math.floor(i / 3) * 26 + Math.sin(st.t * 20 + i) * (sp > 20 ? 1.5 : 0)); g.scale(0.52, 0.52); T.item(g, s.res * 0.52, c); g.restore(); });
      g.save(); g.translate(VAN.pip.x, VAN.pip.y + Math.min(0, van.jy * 0.1)); g.scale(VAN.pip.k, VAN.pip.k); A.pip(g, s.res * VAN.pip.k, pipSt); g.restore();
      draw(g, vanSp);
      g.restore();
      for (const x of VAN.wheels) { g.save(); g.translate(x, -21 - van.jy * 0.25); T.wheel(g, van.wheel); g.restore(); }
      g.restore();
    };

    /* ---------- deliveries ---------- */
    const orders = []; let lastF = null, lastItem = null, made = 0;
    const shopOf = (item) => SHOPS.find((q) => q.item === item);
    /** Where the van is wanted now: the shop for anything not yet picked up, the friend once it is on board. */
    function targets() { const out = []; for (const o of orders) { if ((o.sent || 0) < o.qty) out.push({ q: shopOf(o.item), item: o.item, shop: true, o }); else if (o.loaded >= o.qty && !o.giving) out.push({ q: o.f, item: o.item, o }); } return out; }
    function tell(o) { ctx.prompt(o.loaded < o.qty ? SAY.want(o.f, o.item, o.qty) + (L === 1 ? ' ' + SAY.drive(shopOf(o.item)) : '') : SAY.take(o.f), { show: o.loaded < o.qty ? SAY.want(o.f, o.item, o.qty) : SAY.take(o.f) }); }
    function newOrder() {
      const f = K.pick(FRIENDS.filter((q) => !q.order && q !== lastF)) || K.pick(FRIENDS.filter((q) => !q.order)); if (!f) return;
      const item = K.pick(Object.keys(ITEM).filter((q) => q !== lastItem && !orders.some((o) => o.item === q)));
      const o = { f, item, qty: L >= 3 && ITEM[item][1] && Math.random() < 0.5 ? 2 : 1, loaded: 0 };
      orders.push(o); f.order = o; lastF = f; lastItem = item; f.hop = 0.8;
      f.bub.sx = f.bub.sy = 0; f.bub.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back' }); K.sfx.pop(); tell(o);
    }
    /** Toss a thing through the air between two moving points. */
    function toss(item, from, to, then) {
      const n = st.add({ z: 75, p: 0, draw(g, s) { const a = from(), b = to(), p = n.p; g.translate(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p - Math.sin(p * Math.PI) * 150); g.rotate((p - 0.5) * 0.8); g.scale(0.75, 0.75); T.item(g, s.res * 0.75, item); } });
      return n.to({ p: 1 }, { dur: 0.6, ease: 'inOut' }).then(() => { n.remove(); then(); });
    }
    const bedSlot = (i) => { const b = T.VAN.bed[i % 3]; return { x: van.x + van.face * b[0] * VK, y: van.y + b[1] * VK }; };
    function arrive(q) {
      dust(4); van.sq = 1;
      if (q) visit(q);
    }
    function visit(q, quietly) {
      if (q.kind) atShop(q, quietly); else atFriend(q, quietly);
    }
    function atShop(sh, quietly) {
      const os = orders.filter((o) => o.item === sh.item && (o.sent || 0) < o.qty); // (sent: already on its way through the air)
      if (!os.length) { if (!quietly) { sh.n.hop = 1; K.sfx.tap(); } return; }
      sh.n.hop = 1; van.pause = 1.1;
      const kp = T.KEEPER[sh.kind];
      for (const o of os) for (let q = (o.sent = o.sent || 0); q < o.qty; q++, o.sent++) {
        const slot = van.cargo.length + (van.loading = (van.loading || 0) + 1) - 1;
        ctx.after(q * 260, () => { K.sfx.whoosh(); toss(sh.item, () => ({ x: sh.n.x + kp.x, y: sh.n.y + kp.y }), () => bedSlot(slot), () => { van.loading--; van.cargo.push(sh.item); o.loaded++; van.sq = 1; K.sfx.pop(); const p = toScreen(van.x, R - 90); ctx.fx.burst(p.x, p.y, { n: 8 }); if (o.loaded === o.qty) { K.sfx.ding(); tell(o); } }); });
      }
    }
    function atFriend(f, quietly) {
      const o = f.order;
      if (!o) { if (!quietly) { f.hop = 1; K.sfx.tap(); K.say(SAY.hello); } return; }
      if (o.loaded < o.qty) { if (!quietly) { f.hop = 1; f.bub.wig = 1; K.sfx.tap(); tell(o); } return; }
      if (o.giving) return; o.giving = true; f.hop = 1; van.pause = 1.4;
      let left = o.qty;
      for (let q = 0; q < o.qty; q++) {
        const i = van.cargo.lastIndexOf(o.item), from = bedSlot(i); van.cargo.splice(i, 1);
        ctx.after(q * 240, () => { K.sfx.whoosh(); toss(o.item, () => from, () => ({ x: f.n.x, y: f.py - 150 }), () => { if (--left) return; delivered(f, o); }); });
      }
    }
    function delivered(f, o) {
      orders.splice(orders.indexOf(o), 1);
      f.order = null; f.hold = o.item; f.holdT = 5; f.happy = 1;
      f.bub.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' });
      const p = toScreen(f.n.x, f.py - 120); ctx.fx.burst(p.x, p.y, { n: 18, colors: ['#EE8FB0', A.C.tomato, A.C.marigold] });
      K.sfx.sparkle(); made++; store.deliveries = (store.deliveries || 0) + 1; K.save();
      ctx.prompt(SAY.thanks, { silent: true }); ctx.say(SAY.thanks);
      const more = () => { if (orders.length < (L >= 2 ? 2 : 1) && FRIENDS.some((q) => !q.order)) { newOrder(); ctx.after(3200, more); } };
      if (made % 3 === 0) ctx.after(1500, () => ctx.celebrate().then(() => { ctx.say(SAY.great); ctx.after(1200, more); })); else ctx.after(2200, more);
    }

    /* ---------- guides: where to go next ---------- */
    st.add({ z: 6, draw(g) {
      for (const t of targets()) { const x = near(t.q.sx), k = 0.5 + Math.sin(st.t * 4) * 0.5; g.beginPath(); g.ellipse(x, R + 18, 84 + k * 12, 24 + k * 4, 0, 0, 7); g.strokeStyle = A.alpha('#FFF3C4', 0.95 - k * 0.3); g.lineWidth = 8; g.stroke(); g.beginPath(); g.ellipse(x, R + 18, 70, 19, 0, 0, 7); g.fillStyle = A.alpha('#FFF3C4', 0.3); g.fill(); }
      if (flag > 0 && van.auto != null) { const x = near(flagX); g.beginPath(); g.ellipse(x, R + 18, 30 + (1 - flag) * 40, 10 + (1 - flag) * 12, 0, 0, 7); g.strokeStyle = A.alpha('#FFFFFF', flag * 0.9); g.lineWidth = 5; g.stroke(); }
    } });
    // the place to visit glows: a turning ring of light round the shop's sign, and an arrow that bobs above it
    const arrowSp = A.sprite('townArrow', [-30, -66, 60, 70], (g, s) => T.arrow(g, s, A.C.marigold));
    st.add({ z: 72, draw(g) { for (const t of targets()) {
      const q = t.q, k = 0.5 + Math.sin(st.t * 4) * 0.5, bob = Math.abs(Math.sin(st.t * 3.4)) * 18;
      if (!t.shop) { g.save(); g.translate(near(q.sx) - 30, q.py - 330 - bob); draw(g, arrowSp); g.restore(); continue; }
      const cy = q.y + (q.kind === 'shop' ? -190 : q.kind === 'stall' ? -218 : -150), r = q.kind === 'cart' ? 70 : 52;
      g.save(); g.translate(q.n.x + (q.kind === 'cart' ? -8 : 0), cy);
      g.save(); g.translate(0, -r - 34 - bob); draw(g, arrowSp); g.restore();
      g.beginPath(); g.arc(0, 0, r + 3 + k * 5, 0, 7); g.strokeStyle = A.alpha('#FFD95E', 0.95); g.lineWidth = 9; g.stroke();
      g.beginPath(); g.arc(0, 0, r + 12 + k * 9, 0, 7); g.strokeStyle = A.alpha('#FFF3C4', 0.55 - k * 0.25); g.lineWidth = 7; g.stroke();
      g.rotate(st.t * 0.9); for (let i = 0; i < 8; i++) { g.rotate(0.7854); g.beginPath(); g.arc(r + 26 + k * 8, 0, 5, 0, 7); g.fillStyle = A.alpha('#FFE58A', 0.9); g.fill(); }
      g.restore(); } } });
    // pointers at the edge of the screen for places that are out of view
    const pointers = [0, 1].map((i) => {
      const n = st.add({ ui: true, z: 82, hitR: 62, visible: false, label: 'pointer ' + (i + 1), t: null, ang: 0 });
      n.draw = (g, s) => {
        if (!n.t) return; const k = 1 + Math.sin(st.t * 5) * 0.06;
        g.save(); g.scale(k, k);
        g.save(); g.rotate(n.ang); g.beginPath(); A.cut(g, [[78, 0], [48, -26], [48, 26]], 6, 0, 2); A.paper(g, s.res, A.C.marigold, { shadow: 0.8 }); g.restore();
        T.badge(g, s.res, 54, n.t.shop ? n.t.item : null);
        if (!n.t.shop) { g.save(); g.scale(0.72, 0.72); A.face(g, s.res * 0.72, n.t.q.face); g.restore(); }
        g.restore();
      };
      n.onTap = () => { if (n.t) { K.sfx.tap(); driveTo(n.t.q); } };
      return n;
    });

    /* ---------- the two big buttons ---------- */
    const GO = { x: phone ? W - 150 : W - 132, y: phone ? H - 218 : H - 132, r: phone ? 92 : 86 };
    const go = st.add({ ui: true, z: 84, x: GO.x, y: GO.y, hitR: GO.r + 8, label: 'Go', pressable: false, down: 0 });
    go.update = (dt) => { go.down += ((goHeld ? 1 : 0) - go.down) * Math.min(1, dt * 18); };
    go.draw = (g, s) => {
      const r = GO.r, idle = !goHeld && Math.abs(van.v) < 20 && van.auto == null, k = (idle ? 1 + Math.sin(st.t * 4) * 0.035 : 1) * (1 - go.down * 0.07);
      if (idle) { const q = (st.t * 0.7) % 1; g.beginPath(); g.arc(0, 0, r + 6 + q * 26, 0, 7); g.strokeStyle = A.alpha('#FBF6EC', 0.7 * (1 - q)); g.lineWidth = 7; g.stroke(); }
      g.save(); g.scale(k, k);
      g.beginPath(); g.arc(0, 6, r, 0, 7); g.fillStyle = '#3E8A4C'; g.fill();
      g.beginPath(); g.arc(0, go.down * 5, r, 0, 7); A.paper(g, s.res, '#5FBF6B', { shadow: 1 - go.down * 0.7, light: 0.1, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
      g.translate(0, go.down * 5); g.beginPath(); A.cut(g, [[-r * 0.3, -r * 0.46], [r * 0.52, 0], [-r * 0.3, r * 0.46]], r * 0.12, 0.5, 2); g.fillStyle = '#FBF6EC'; g.fill();
      g.restore();
    };
    go.onDown = () => { goHeld = true; goT = st.t; quiet = 0; hinted = true; };
    go.onUp = () => { goHeld = false; };
    go.onTap = (p) => { if (!p || st.t - goT < 0.35) { K.sfx.tap(); driveNext(); } };
    const HN = { x: phone ? 132 : 122, y: phone ? H - 218 : H - 116, r: phone ? 74 : 70 };
    const horn = st.add({ ui: true, z: 84, x: HN.x, y: HN.y, hitR: HN.r + 6, label: 'Horn' });
    horn.draw = (g, s) => {
      const r = HN.r; g.beginPath(); g.arc(0, 6, r, 0, 7); g.fillStyle = '#C99A2E'; g.fill();
      g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s.res, '#F5CD3D', { shadow: 1, light: 0.1, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
      g.save(); g.rotate(-0.25); const q = 1 + van.honk * 0.15; g.scale(q * r / 70, q * r / 70);
      g.beginPath(); A.cut(g, [[-30, -9], [-8, -9], [22, -30], [22, 30], [-8, 9], [-30, 9]], 5, 0.4, 3); g.fillStyle = A.C.ink; g.fill();
      g.beginPath(); g.ellipse(-36, 0, 12, 14, 0, 0, 7); g.fillStyle = A.C.tomato; g.fill();
      if (van.honk > 0.05) A.line(g, A.alpha(A.C.ink, van.honk), 5, (h) => { h.arc(22, 0, 16, -0.7, 0.7); h.moveTo(22 + Math.cos(-0.8) * 28, Math.sin(-0.8) * 28); h.arc(22, 0, 28, -0.8, 0.8); });
      g.restore();
    };
    horn.onTap = honk;

    /* ---------- a paper hand that shows what to do when nothing is happening ---------- */
    const handSp = A.sprite('townHand', [-60, -20, 180, 170], T.hand);
    const hand = st.add({ ui: true, z: 88, alpha: 0, tx: 0, ty: 0, ph: 0, holdy: false });
    hand.update = (dt) => {
      const moving = Math.abs(van.v) > 15 || van.auto != null || hold || goHeld || van.loading || van.pause > 0;
      quiet = moving ? 0 : quiet + dt;
      const t = targets()[0], show = !!t && quiet > (hinted ? 6 : 1.6) && !K.valley.introOpen;
      hand.alpha += ((show ? 1 : 0) - hand.alpha) * Math.min(1, dt * 6);
      if (!show) { hand.ph = 0; return; }
      hand.ph += dt;
      const sx = near(t.q.sx) - st.cam.x;
      if (sx > 70 && sx < W - 70) { hand.tx = sx + (t.shop ? 0 : 46); hand.ty = t.shop ? PY - 96 : PY - 70; hand.holdy = false; } else { hand.tx = GO.x - 6; hand.ty = GO.y - 30; hand.holdy = true; }
    };
    hand.draw = (g) => {
      if (hand.alpha < 0.02) return;
      const per = hand.holdy ? 2.6 : 1.7, p = (hand.ph % per) / per, inn = hand.holdy ? 0.2 : 0.3, out = hand.holdy ? 0.85 : 0.7;
      const k = p < inn ? E.ease.out(p / inn) : p > out ? 1 - (p - out) / (1 - out) : 1, press = p >= inn && p <= out;
      if (press) { const q = hand.holdy ? ((p - inn) * per * 1.6) % 1 : (p - inn) / (out - inn); g.beginPath(); g.arc(hand.tx, hand.ty, 24 + q * 46, 0, 7); g.strokeStyle = A.alpha('#FFFFFF', 0.9 * (1 - q)); g.lineWidth = 7; g.stroke(); }
      const fl = hand.holdy ? -1 : 1; g.save(); g.translate(hand.tx + fl * (1 - k) * 46, hand.ty + (1 - k) * 60); const s2 = press ? 0.94 : 1; g.scale(s2 * fl, s2); draw(g, handSp); g.restore();
    };

    /* ---------- fingers: hold anywhere to drive that way, tap anywhere to send the van there ---------- */
    function startHold() { hold.on = true; st.cancelTaps(); van.auto = null; van.place = null; hinted = true; }
    st.ondown = (p, e, n) => { quiet = 0; if (n && n.ui) return; hold = { sx: p.x, x: p.x, t: st.t, on: false, n, dir: 0 }; };
    st.onmove = (p) => { if (!hold) return; hold.x = p.x; if (!hold.on && Math.abs(p.x - hold.sx) > 30 && !(hold.n && hold.n.hide)) startHold(); };
    st.onup = (p, e, s) => {
      const h = hold; hold = null; if (!h || h.on) return;
      if (s && !s.n && s.moved < 24 && p.y > HOR - 60) {
        const wx = p.x + st.cam.x; let best = null, bd = 240;
        for (const q of PLACES) { const d = Math.abs(wrapD(wx, q.sx)); if (d < bd) { bd = d; best = q; } }
        K.sfx.tap(); hinted = true; if (best) driveTo(best); else driveToX(wx - van.face * 0);
      }
    };

    st.onframe = (dt) => {
      // a long press: on a place it sends the van there, anywhere else the van drives while the finger stays down
      if (hold && !hold.on && st.t - hold.t > 0.28 && !(hold.n && (hold.n.hide || hold.n === van))) { if (hold.n && hold.n.place) { st.cancelTaps(); const q = hold.n.place; hold = null; K.sfx.tap(); driveTo(q); } else startHold(); }
      if (hold && hold.on) { const dx = hold.x - (van.x - st.cam.x); hold.dir = Math.abs(dx) < 100 * VK ? hold.dir || van.face : Math.sign(dx); holdDir = hold.dir; }
      else holdDir = goHeld && st.t - goT > 0.12 ? van.face : 0;
      // camera: the van a little behind centre, looking where it is going
      const cx = van.x + van.face * (phone ? 70 : 170) - W / 2;
      st.cam.x += (cx - st.cam.x) * Math.min(1, dt * 2.8); camC = st.cam.x + W / 2;
      for (const n of wrapped) n.x = near(n.bx);
      for (const n of tiles) n.x = WW * Math.round((camC - n.tileC) / WW);
      const ts = targets();
      pointers.forEach((n, i) => {
        const t = ts[i]; n.t = null; n.visible = false; if (!t) return;
        const sx = near(t.q.sx) - st.cam.x;
        if (sx > 50 && sx < W - 50) return;
        n.t = t; n.visible = true; n.x = sx < W / 2 ? 84 : W - 84; n.y = HOR - 64 - i * 136; n.ang = sx < W / 2 ? Math.PI : 0;
      });
    };

    /* ---------- go ---------- */
    st.cam.x = van.x + (phone ? 70 : 170) - W / 2; camC = st.cam.x + W / 2; st.onframe(0);
    ctx.after(700, () => { newOrder(); if (L >= 2) ctx.after(2600, newOrder); });
    K._town = { van, orders, SHOPS, FRIENDS, HIDES, pointers, driveTo, driveToX, lightState, targets, WW, R, PY, GO, HN, hand, get made() { return made; }, get found() { return foundN; }, get holdDir() { return holdDir; },
      screenOf: (x, y) => toScreen(near(x), y), stop: (q) => toScreen(near(q.sx), R) }; // for browser tests
    ctx.onExit(() => { K._town = null; });
  }

  K.game({ id: 'town', title: "Pip's Town", voice: 'vroom', group: 'play', order: 3, start, lines, resize: () => K.go('town') });
})();
