/* Tidy Up — sorting by hand in a messy playroom.
   Drag each thing to where it belongs, or tap it and then tap the place. Every thing says its name when it
   is picked up. A thing in the wrong place hops back out with a kind hint; nothing can be failed.
   Level 1: two baskets with picture labels: sort by kind (food / clothes / toys) or by colour.
   Level 2: three baskets by kind, then the very same things tip out and are sorted another way
            (by colour, by size), so one set can be sorted in more than one way.
   Level 3: two overlapping rings ("red things", "food", and red food in the middle), a spare shelf for
            things that belong nowhere, and guess-my-rule: some things are sorted already, the labels are
            hidden, and the child works out where the rest go.
   The room and most things are the painted pictures in img/; baskets, rings and a few things are drawn here. */
(function () {
  'use strict';
  const A = K.art;
  const INK = '#2E2A3B', CREAM = '#FBF6EC';
  const COLS = { red: '#DE4E46', yellow: '#F2CF4A', green: '#5E9E57', blue: '#4F8FCB' };

  /* ---------------- pictures ---------------- */
  const PICS = {};
  function pic(path) { let p = PICS[path]; if (!p) { p = PICS[path] = { im: new Image(), ok: false }; p.im.onload = () => { p.ok = true; }; p.im.src = 'img/' + path + '.webp'; } return p; }
  const sprites = new Map();
  function picSprite(path, bw, bh) {
    const p = pic(path); if (!p.ok) return null;
    const key = path + '|' + Math.round(bw) + 'x' + Math.round(bh) + '|' + A.res; let sp = sprites.get(key); if (sp) return sp;
    const k = Math.min(bw / p.im.width, bh / p.im.height), w = p.im.width * k, h = p.im.height * k, pad = 14, s = A.res;
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil((w + pad * 2) * s)); c.height = Math.max(1, Math.ceil((h + pad * 2) * s));
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.shadowColor = 'rgba(46,40,70,.26)'; g.shadowBlur = 8 * s; g.shadowOffsetX = 2 * s; g.shadowOffsetY = 4 * s;
    g.drawImage(p.im, pad * s, pad * s, w * s, h * s);
    sp = { canvas: c, w, h, pad }; sprites.set(key, sp); return sp;
  }
  function drawPic(g, path, bw, bh) { const sp = picSprite(path, bw, bh); if (!sp) return false; g.drawImage(sp.canvas, -sp.w / 2 - sp.pad, -sp.h / 2 - sp.pad, sp.w + sp.pad * 2, sp.h + sp.pad * 2); return true; }
  function star5(g, x, y, r, rot) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (rot || 0) - Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.48 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }

  /* ---------------- things drawn in code (about 100 units across) ---------------- */
  const DRAW = {
    tshirt(g, s) {
      const P = [[-20, -46], [-8, -40], [8, -40], [20, -46], [54, -24], [40, 2], [26, -8], [26, 48], [-26, 48], [-26, -8], [-40, 2], [-54, -24]];
      g.beginPath(); A.cut(g, P, 7, 0.6, 3); A.paper(g, s, '#F2C744', { light: 0.08, box: { x: -54, y: -46, w: 108, h: 94 } });
      g.save(); g.beginPath(); A.cut(g, P, 7, 0.6, 3); g.clip(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-60, 10, 120, 9); g.fillRect(-60, 28, 120, 9); g.fillStyle = 'rgba(190,140,30,.35)'; g.fillRect(-60, -30, 22, 40); g.fillRect(38, -30, 22, 40); g.restore();
      g.beginPath(); g.ellipse(0, -42, 13, 9, 0, 0, Math.PI); g.fillStyle = '#C9972C'; g.fill();
      star5(g, 0, -10, 11); g.fillStyle = '#E8664A'; g.fill();
    },
    scarf(g, s) {
      const tail = (pts, col, seed) => { g.beginPath(); A.cut(g, pts, 5, 0.6, seed); A.paper(g, s, col, { shadow: 0.7, light: 0.07, box: { x: -40, y: -12, w: 90, h: 60 } }); g.save(); g.beginPath(); A.cut(g, pts, 5, 0.6, seed); g.clip(); g.fillStyle = '#B7DC8E'; for (const y of [8, 26]) g.fillRect(-50, y, 110, 8); g.restore(); };
      tail([[4, -14], [32, -14], [48, 38], [20, 44]], '#4F8752', 4);
      A.line(g, '#4F8752', 3.5, (h) => { for (let i = 0; i < 4; i++) { h.moveTo(23 + i * 7.5, 42 - i * 1.6); h.lineTo(25 + i * 7.5, 54 - i * 1.6); } });
      tail([[-36, -14], [-6, -14], [-2, 48], [-32, 48]], '#5E9E57', 2);
      A.line(g, '#5E9E57', 3.5, (h) => { for (let i = 0; i < 4; i++) { h.moveTo(-29 + i * 8, 48); h.lineTo(-29 + i * 8, 59); } });
      g.beginPath(); A.blob(g, 0, -26, 50, 23, 0.04, 6, 12); A.paper(g, s, '#6FAE62', { light: 0.1, box: { x: -50, y: -50, w: 100, h: 48 } });
      g.save(); g.beginPath(); A.blob(g, 0, -26, 50, 23, 0.04, 6, 12); g.clip(); g.fillStyle = '#B7DC8E'; for (const x of [-30, -6, 18]) { g.save(); g.translate(x, -26); g.rotate(0.3); g.fillRect(-4, -30, 8, 60); g.restore(); } g.restore();
    },
    duck(g, s) {
      g.beginPath(); A.smooth(g, [[-52, 0], [-40, -16], [-16, -2], [10, -6], [36, 2], [48, 22], [32, 42], [-8, 47], [-40, 36]]); A.paper(g, s, '#F5CF45', { light: 0.1, box: { x: -52, y: -16, w: 100, h: 64 } });
      g.beginPath(); A.cut(g, [[40, -32], [64, -22], [42, -12]], 5, 0.5, 3); A.paper(g, s, '#F0923B', { shadow: 0.4 });
      g.beginPath(); g.arc(20, -26, 26, 0, 7); A.paper(g, s, '#F7D653', { shadow: 0.5, light: 0.1, box: { x: -6, y: -52, w: 52, h: 52 } });
      g.beginPath(); g.arc(28, -32, 4.6, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(26.6, -33.6, 1.6, 0, 7); g.fillStyle = '#fff'; g.fill();
      A.line(g, '#D9A93A', 4.5, (h) => { h.moveTo(-22, 12); h.quadraticCurveTo(-4, 34, 16, 14); });
    },
    block(g, s) {
      g.beginPath(); A.rect(g, -45, -45, 90, 90, 13, 3, 0.8); A.paper(g, s, '#4F8FCB', { light: 0.09, box: { x: -45, y: -45, w: 90, h: 90 } });
      g.beginPath(); A.rect(g, -30, -30, 60, 60, 8, 4, 0.5); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill();
      star5(g, 0, 1, 19); g.fillStyle = '#FFFDF7'; g.fill();
    },
  };
  const THINGS = [
    { id: 'apple', name: 'Apple.', kind: 'food', col: 'red', pic: 'kitchen/apple' }, { id: 'strawberry', name: 'Strawberry.', kind: 'food', col: 'red', pic: 'kitchen/strawberry' },
    { id: 'banana', name: 'Banana.', kind: 'food', col: 'yellow', pic: 'kitchen/banana' }, { id: 'lemon', name: 'Lemon.', kind: 'food', col: 'yellow', pic: 'kitchen/lemon' },
    { id: 'pear', name: 'Pear.', kind: 'food', col: 'green', pic: 'kitchen/pear' }, { id: 'broccoli', name: 'Broccoli.', kind: 'food', col: 'green', pic: 'kitchen/broccoli' },
    { id: 'hat', name: 'Hat.', kind: 'clothes', col: 'blue', pic: 'kitchen/hat' }, { id: 'shoe', name: 'Shoe.', kind: 'clothes', col: 'red', pic: 'kitchen/shoe' },
    { id: 'sock', name: 'Sock.', kind: 'clothes', col: null, pic: 'kitchen/sock' }, { id: 'tshirt', name: 'T-shirt.', kind: 'clothes', col: 'yellow' }, { id: 'scarf', name: 'Scarf.', kind: 'clothes', col: 'green' },
    { id: 'ball', name: 'Ball.', kind: 'toys', col: null, pic: 'kitchen/ball' }, { id: 'balloon', name: 'Balloon.', kind: 'toys', col: 'red', pic: 'town/balloon', box: [100, 150] },
    { id: 'kite', name: 'Kite.', kind: 'toys', col: null, pic: 'tales/kite', box: [100, 156] }, { id: 'train', name: 'Train.', kind: 'toys', col: 'red', pic: 'toot/toot' },
    { id: 'duck', name: 'Duck.', kind: 'toys', col: 'yellow' }, { id: 'block', name: 'Block.', kind: 'toys', col: 'blue' },
  ];
  const BY = (id) => THINGS.find((t) => t.id === id);
  /** A thing about 116 units across, centred. */
  function drawThing(g, s, t) {
    if (t.pic) { if (drawPic(g, t.pic, t.box ? t.box[0] : 116, t.box ? t.box[1] : 116)) return; const f = A.kitchen && A.kitchen.draw && A.kitchen.draw[t.id]; if (f) { f(g, s); return; } g.beginPath(); A.blob(g, 0, 0, 46, 44, 0.05, 3); A.paper(g, s, COLS[t.col] || '#C08A5A', {}); return; }
    const sp = A.sprite('tidy-' + t.id, [-66, -62, 132, 124], DRAW[t.id]); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
  }

  /* ---------------- words ---------------- */
  const KIND_SAY = { food: 'That is food.', clothes: 'That is something to wear.', toys: 'That is a toy.' };
  const COL_SAY = { red: 'That is red.', yellow: 'That is yellow.', green: 'That is green.', blue: 'That is blue.' };
  const SIZE_SAY = { big: 'That one is big.', small: 'That one is small.' };
  const RULE_SAY = { kind: 'My rule was what kind of thing it is.', col: 'My rule was colour.', size: 'My rule was size.' };
  const T = { tidy: 'Tidy up!', put: 'Put each thing where it belongs.', byCol: 'Now sort them by colour.', bySize: 'Now sort them by size.', rings: 'Two rings!',
    shelf: 'If it does not belong, put it on the shelf.', guess: 'Guess my rule.', inside: 'Look at what is already inside.', done: 'All tidy!' };
  const VENNS = [
    { col: 'red', kind: 'food', a: 'Red things go in one ring.', b: 'Food goes in the other.', ab: 'Red food goes in the middle.' },
    { col: 'yellow', kind: 'food', a: 'Yellow things go in one ring.', b: 'Food goes in the other.', ab: 'Yellow food goes in the middle.' },
    { col: 'red', kind: 'toys', a: 'Red things go in one ring.', b: 'Toys go in the other.', ab: 'Red toys go in the middle.' },
  ];
  function lines() {
    const out = THINGS.map((t) => t.name).concat(Object.values(T), Object.values(KIND_SAY), Object.values(COL_SAY), Object.values(SIZE_SAY), Object.values(RULE_SAY));
    for (const v of VENNS) out.push(v.a, v.b, v.ab);
    return out.filter((x, i) => out.indexOf(x) === i);
  }

  /* ---------------- labels ---------------- */
  const REP = { food: 'kitchen/apple', clothes: 'kitchen/hat', toys: 'kitchen/ball' };
  /** What a basket or ring is for: a picture (and, for readers, a word). lab = {type, key, secret} */
  function drawLabel(g, s, lab, sz, word) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (lab.secret) { g.fillStyle = A.C.plum; g.font = `800 ${sz * 0.7}px ${A.FONT_TITLE}`; g.fillText('?', 0, sz * 0.04); return; }
    const py = word ? -sz * 0.12 : 0, ps = word ? sz * 0.6 : sz * 0.76;
    g.save(); g.translate(0, py);
    if (lab.type === 'kind') { if (!drawPic(g, REP[lab.key], ps, ps)) { g.beginPath(); g.arc(0, 0, ps * 0.4, 0, 7); g.fillStyle = { food: '#DE4E46', clothes: '#4F8FCB', toys: '#F2B33D' }[lab.key]; g.fill(); } }
    else if (lab.type === 'col') { g.beginPath(); A.blob(g, 0, 0, ps * 0.46, ps * 0.42, 0.1, 5 + lab.key.length, 11); A.paper(g, s, COLS[lab.key], { shadow: 0.4, light: 0.1, box: { x: -ps / 2, y: -ps / 2, w: ps, h: ps } }); g.beginPath(); g.ellipse(-ps * 0.14, -ps * 0.14, ps * 0.1, ps * 0.06, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill(); }
    else if (lab.type === 'size') { const r = lab.key === 'big' ? ps * 0.48 : ps * 0.2; star5(g, 0, lab.key === 'big' ? 2 : 0, r); g.fillStyle = '#F2B33D'; g.fill(); }
    else { g.fillStyle = 'rgba(46,42,59,.4)'; for (const x of [-1, 0, 1]) { g.beginPath(); g.arc(x * ps * 0.3, 0, ps * 0.09, 0, 7); g.fill(); } }
    g.restore();
    if (word) { g.fillStyle = INK; g.font = `700 ${sz * 0.22}px ${A.FONT_BODY}`; g.fillText(lab.type === 'other' ? 'other' : lab.key, 0, sz * 0.36); }
  }
  function tagBack(sz) { return A.sprite('tidyTag' + Math.round(sz), [-sz / 2, -sz / 2, sz, sz], (g, s) => { g.beginPath(); A.rect(g, -sz / 2, -sz / 2, sz, sz, sz * 0.24, 4, 0.8); A.paper(g, s, CREAM, { shadow: 0.8, light: 0.04, box: { x: -sz / 2, y: -sz / 2, w: sz, h: sz } }); }); }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const SET = L === 2 ? 4 : 3, words = L >= 2;
    const floorY = land ? 620 : Math.round(H * 0.54), baseY = floorY + (land ? 54 : 64);
    let S = { mode: '' }, won = 0, skill = 0, turn = 0, force = null, lastAct = 0, demos = 0, pending = null;
    const last = {};
    let stuff = [], things = [], targets = [], sel = null, finish = null;
    sprites.clear();
    THINGS.forEach((t) => t.pic && pic(t.pic)); pic(land ? 'build/room-wide' : 'build/room-tall');

    const sfx = {
      plop(i) { K.sfx.tone(300, 0.12, { to: 150, vol: 0.2 }); K.sfx.step(i || 0); },
      boing() { K.sfx.tone(240, 0.22, { to: 520, type: 'sine', vol: 0.16 }); },
      flip() { K.sfx.noise(0.08, { freq: 1800, vol: 0.12 }); K.sfx.tone(700, 0.1, { to: 1000, type: 'triangle', vol: 0.12 }); },
    };
    const tell = (text, ms) => Promise.all([ctx.say(text), ctx.wait(ms || 1100)]);
    const pickNew = (list, key, fn) => { fn = fn || ((x) => x); const ok = list.filter((x) => fn(x) !== last[key]); const x = K.pick(ok.length ? ok : list); last[key] = fn(x); return x; };
    const resort = () => { st.root._sorted = false; };
    const keep = (n) => { stuff.push(n); return n; };
    const wobble = (n) => n.to({ rot: 0.16 }, { dur: 0.07 }).then(() => n.to({ rot: -0.13 }, { dur: 0.1 })).then(() => n.to({ rot: n.rest || 0 }, { dur: 0.3, ease: 'elastic' }));
    const touch = () => { lastAct = st.t; if (hand.alpha > 0) { hand.stop = true; hand.to({ alpha: 0 }, { dur: 0.15 }); } };

    /* ---------- the room: the painted picture, cut so the floor is deep enough to play on ---------- */
    let bg = null;
    function paintRoom() {
      const c = document.createElement('canvas'); c.width = Math.round(W * st.res); c.height = Math.round(H * st.res);
      const g = c.getContext('2d'); g.scale(st.res, st.res);
      const p = pic(land ? 'build/room-wide' : 'build/room-tall');
      if (p.ok) {
        const im = p.im, iw = im.width, ih = im.height, F = land ? { wall: 0.552, trim: 0.764, floor: 0.803 } : { wall: 0.452, trim: 0.61, floor: 0.646 };
        const k = Math.max(W / iw, (floorY * 0.74) / (F.wall * ih)), dx = (W - iw * k) / 2, hA = F.wall * ih * k, hT = (F.floor - F.trim) * ih * k;
        const slice = (a, b, y0, y1) => g.drawImage(im, 0, a * ih, iw, (b - a) * ih, dx, y0, iw * k, y1 - y0 + 0.6);
        slice(0, F.wall, 0, hA); slice(F.wall, F.trim, hA, floorY - hT); slice(F.trim, F.floor, floorY - hT, floorY); slice(F.floor, 1, floorY, H);
      } else {
        g.fillStyle = '#BFE0DA'; g.fillRect(0, 0, W, floorY); g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = 20; x < W; x += 90) g.fillRect(x, 0, 44, floorY);
        g.fillStyle = '#F7E7C2'; g.fillRect(0, floorY - 150, W, 150); g.fillStyle = '#FBF1DA'; g.fillRect(0, floorY - 30, W, 30);
        g.fillStyle = '#F0A63C'; g.fillRect(0, floorY, W, H - floorY); g.strokeStyle = 'rgba(190,110,20,.35)'; g.lineWidth = 3; g.beginPath(); for (let y = floorY + 60; y < H; y += 70) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
      }
      const sh = g.createLinearGradient(0, floorY, 0, floorY + 70); sh.addColorStop(0, 'rgba(120,60,10,.22)'); sh.addColorStop(1, 'rgba(120,60,10,0)'); g.fillStyle = sh; g.fillRect(0, floorY, W, 70);
      return { c, pic: p.ok };
    }
    st.add({ z: 0, draw(g) { if (!bg || (!bg.pic && pic(land ? 'build/room-wide' : 'build/room-tall').ok)) bg = paintRoom(); g.drawImage(bg.c, 0, 0, W, H); } });
    // stars for the rounds done in this set
    const tally = st.add({ ui: true, z: 45, x: W / 2, y: land ? 142 : 166, pop: 0 });
    tally.draw = (g, s) => { const n = won % SET; for (let i = 0; i < SET; i++) { g.save(); g.translate((i - (SET - 1) / 2) * 46, 0); const k = i === n - 1 ? 1 + tally.pop * 0.5 : 1; g.scale(k, k); star5(g, 0, 0, 19); if (i < n) A.paper(g, s, '#F2B33D', { shadow: 0.6, grain: 0.1 }); else { g.fillStyle = 'rgba(255,255,255,.6)'; g.fill(); } g.restore(); } };
    tally.update = (dt) => { tally.pop = Math.max(0, tally.pop - dt * 2); };
    // the hand that shows the move
    const hand = st.add({ ui: true, z: 85, alpha: 0, x: 0, y: 0, press: 0 });
    hand.draw = (g, s) => { g.scale(0.9, 0.9); A.hand(g, s * 0.9, hand.press); };
    async function demo() {
      const c = things.find((x) => !x.locked && !x.grab), tg = c && targets.find((q) => q.key === c.want);
      if (!c || !tg || S.secret || sel || hand.alpha > 0) return;
      hand.x = c.x + 10; hand.y = c.y + 10; hand.press = 0; hand.stop = false;
      await hand.to({ alpha: 1 }, { dur: 0.25 }); if (hand.stop) return; await hand.to({ press: 1 }, { dur: 0.2 }); if (hand.stop) return;
      await hand.to({ x: tg.hx, y: tg.hy }, { dur: 1.1, ease: 'inOut' }); if (hand.stop) return; tg.pop = 1;
      await hand.to({ press: 0 }, { dur: 0.2 }); if (!hand.stop) await hand.to({ alpha: 0 }, { dur: 0.3 });
    }
    ctx.every(3000, () => { if (finish && !S.secret && st.t - lastAct > 11 && demos < 6) { demos++; lastAct = st.t; demo(); } });

    /* ---------- loose things ---------- */
    function scatter(n, top) {
      const cols = land ? (n <= 8 ? n : Math.ceil(n / 2)) : (n <= 4 ? n : Math.ceil(n / Math.ceil(n / 4)));
      const stepX = Math.min(land ? 152 : 134, (W - (land ? 150 : 44)) / cols), stepY = land ? 108 : 122, out = [];
      for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols), c = i - r * cols; out.push({ x: W / 2 + (c - (inRow - 1) / 2) * stepX + (Math.random() - 0.5) * 22, y: top + r * stepY + (Math.random() - 0.5) * (land && n <= cols ? 60 : 18) + (land && n <= cols ? 24 : 0) }); }
      return K.shuffle(out);
    }
    const SIZE = { big: 1.26, small: 0.72 };
    /** A loose thing. item = {t, size}; home = where it lies; from = where it pops out of (optional). */
    function addThing(item, home, from, i) {
      const t = item.t, base = (land ? 1 : 0.94) * (SIZE[item.size] || 1), hr = Math.max(58, 54 / base);
      const c = keep(st.add({ z: 30 + i * 0.01, x: from ? from.x : home.x, y: from ? from.y : home.y - 30, sx: from ? base * 0.4 : 0, sy: from ? base * 0.4 : 0, rot: (Math.random() - 0.5) * 0.5, label: t.id, pressable: false, pad: 2, hit: { x: -hr, y: -hr, w: hr * 2, h: hr * 2 }, t, size: item.size || null, base, home, tries: 0, picked: false, locked: false }));
      c.rest = c.rot;
      c.draw = (g, s) => {
        if (c.picked && !c.locked) { g.translate(0, Math.sin(st.t * 6) * 5 - 8); g.beginPath(); g.arc(0, 0, 66, 0, 7); g.fillStyle = A.alpha('#FFF3C4', 0.75 + Math.sin(st.t * 6) * 0.15); g.fill(); g.lineWidth = 5; g.strokeStyle = '#2F8F8A'; g.stroke(); }
        drawThing(g, s, t);
      };
      if (from) { c.to({ x: home.x, sx: base, sy: base }, { dur: 0.55, ease: 'out', delay: i * 0.05 }); c.to({ y: from.y - 150 }, { dur: 0.22, ease: 'out', delay: i * 0.05 }).then(() => c.to({ y: home.y }, { dur: 0.36, ease: (q) => q * q })); }
      else c.to({ sx: base, sy: base, y: home.y }, { dur: 0.45, ease: 'back', delay: 0.15 + i * 0.07 });
      const lift = () => { touch(); c.z = 60; resort(); K.sfx.tap(); ctx.say(t.name); c.to({ rot: 0 }, { dur: 0.15 }); };
      c.goHome = () => { c.z = 30 + i * 0.01; resort(); c.to({ x: home.x, y: home.y, sx: base, sy: base, rot: c.rest }, { dur: 0.5, ease: 'back' }); };
      c.onDown = (p) => { if (c.locked || !finish) return; c.grab = { dx: c.x - p.x, dy: c.y - p.y, drag: false }; lift(); };
      c.onMove = (p, e, s) => {
        if (!c.grab) return;
        if (s.moved > 24 && !c.grab.drag) { c.grab.drag = true; if (sel === c) { sel = null; c.picked = false; } else select(null); c.to({ sx: base * 1.12, sy: base * 1.12 }, { dur: 0.15 }); }
        if (c.grab.drag) { c.x = p.x + c.grab.dx; c.y = p.y + c.grab.dy; for (const q of targets) q.hover = q.contains(c.x, c.y); }
      };
      c.onUp = () => {
        if (!c.grab) return; const drag = c.grab.drag; c.grab = null; for (const q of targets) q.hover = false;
        if (!drag) { select(sel === c ? null : c); if (!c.picked) c.goHome(); return; }
        const tg = targets.find((q) => q.contains(c.x, c.y));
        if (tg) dropOn(c, tg, true); else c.goHome();
      };
      c.onTap = (p) => { if (!p && !c.locked && finish) { lift(); select(c); } };
      things.push(c); return c;
    }
    function select(c) { if (sel && sel !== c) { sel.picked = false; if (!sel.locked) sel.goHome(); } sel = c; if (c) { c.picked = true; for (const q of targets) q.pop = 0.6; } }
    function tapTarget(tg) { touch(); if (sel && !sel.locked) { const c = sel; sel = null; c.picked = false; dropOn(c, tg, false); } else { tg.pop = 1; K.sfx.tap(); } }
    /** Put a thing in a place. A right place keeps it; a wrong one lets it hop back out with a hint. */
    async function dropOn(c, tg, dragged) {
      if (c.locked || !finish) return;
      touch();
      if (tg.key === c.want) {
        c.locked = true; c.picked = false; c.onDown = c.onTap = null;
        const p = tg.slot(c); c.z = 61; resort();
        if (!dragged) { c.to({ y: Math.min(c.y, p.y) - 120 }, { dur: 0.2, ease: 'out' }); await c.to({ x: p.x }, { dur: 0.3, ease: 'inOut' }); }
        c.to({ x: p.x, y: p.y, sx: p.k, sy: p.k, rot: (Math.random() - 0.5) * 0.3 }, { dur: 0.3, ease: 'out' }).then(() => { c.z = p.z; resort(); });
        sfx.plop(S.total - S.left); tg.pop = 1; tg.pulse = false; ctx.fx.burst(tg.hx, tg.hy - 40, { n: 8 });
        S.left--; if (S.left <= 0 && finish) { const f = finish; finish = null; f(); }
      } else {
        S.misses++; c.tries++; c.busy = true;
        if (!dragged) await c.to({ x: tg.hx, y: tg.hy - 60, sx: c.base * 0.8, sy: c.base * 0.8 }, { dur: 0.32, ease: 'inOut' });
        K.sfx.whoops(); sfx.boing(); tg.shake = 1;
        ctx.say(S.hint(c, tg));
        c.z = 60; resort();
        c.to({ y: c.y - 110 }, { dur: 0.16, ease: 'out' }).then(() => { c.goHome(); wobble(c); c.busy = false; });
        if (c.tries >= 2) { const r = targets.find((q) => q.key === c.want); if (r) r.pulse = true; }
      }
    }

    /* ---------- baskets ---------- */
    const BANDS = ['#2F8F8A', '#E8664A', '#6E4E7E'];
    function addBasket(x, w, h, lab, i, n) {
      const small = (land ? 0.56 : w < 180 ? 0.42 : 0.48), tsz = Math.min(w * 0.56, h * 0.62) * (words ? 1.12 : 1);
      const band = lab.type === 'col' && !lab.secret ? COLS[lab.key] : lab.secret ? '#6E4E7E' : BANDS[i % 3];
      const front = A.sprite('tidyBasket' + Math.round(w) + 'x' + h + i + band, [-w / 2 - 22, -h - 16, w + 44, h + 22], (g, s) => {
        const body = (q) => A.cut(q, [[-w / 2, -h + 6], [w / 2, -h + 6], [w / 2 - w * 0.08, 0], [-w / 2 + w * 0.08, 0]], [8, 8, 30, 30], 1, 3 + i);
        g.beginPath(); body(g); A.paper(g, s, '#DDAA63', { shadow: 1, depth: 1.2, light: 0.08, box: { x: -w / 2, y: -h, w, h } });
        g.save(); g.beginPath(); body(g); g.clip();
        for (let r = 0, y = -h + 24; y < 4; y += 27, r++) for (let x0 = -w / 2 - 20 + (r % 2) * 19; x0 < w / 2; x0 += 38) { g.beginPath(); A.rect(g, x0 + 2, y + 2, 34, 23, 8, r * 7 + x0, 0.6); g.fillStyle = (Math.round(x0 / 38) + r) % 2 ? 'rgba(160,105,50,.24)' : 'rgba(255,240,200,.3)'; g.fill(); }
        g.fillStyle = A.alpha(band, 0.92); g.fillRect(-w / 2, -h * 0.2, w, h * 0.09);
        g.restore();
        for (const k of [-1, 1]) A.line(g, '#B97F4A', 9, (q) => { q.arc(k * (w / 2 + 2), -h + 4, 15, k > 0 ? -Math.PI / 2 : Math.PI / 2, k > 0 ? Math.PI / 2 : Math.PI * 1.5); });
        g.beginPath(); A.rect(g, -w / 2 - 9, -h - 10, w + 18, 28, 14, 5 + i, 0.8); A.paper(g, s, '#C48D52', { shadow: 0.6, light: 0.09, box: { x: -w / 2, y: -h - 10, w, h: 28 } });
      });
      const b = { key: lab.key, lab, x, w, h, count: 0, pop: 0, shake: 0, pulse: false, hover: false, hx: x, hy: baseY - h - 30 };
      const tf = (g) => { const k = 1 + b.pop * 0.06 + (b.hover ? 0.05 : 0) + (b.pulse ? Math.sin(st.t * 7) * 0.02 : 0); g.rotate(Math.sin(st.t * 40) * b.shake * 0.05); g.scale(k + b.pop * 0.03, k - b.pop * 0.05); };
      const back = keep(st.add({ z: 15, x, y: baseY + 260, draw(g, s) {
        g.save(); tf(g);
        if (b.pulse) { g.beginPath(); A.rect(g, -w / 2 - 20, -h - 44, w + 40, h + 60, 40, 2, 0); g.fillStyle = A.alpha('#F7D27A', 0.6 + Math.sin(st.t * 7) * 0.25); g.fill(); }
        g.beginPath(); g.ellipse(0, 6, w * 0.5, 14, 0, 0, 7); g.fillStyle = 'rgba(90,50,10,.22)'; g.fill();
        g.beginPath(); A.rect(g, -w / 2 + 5, -h - 34, w - 10, 64, 12, 9, 0.6); g.fillStyle = '#8F6238'; g.fill(); g.restore();
      } }));
      const fr = keep(st.add({ z: 17, x, y: baseY + 260, fl: 0, label: lab.secret ? 'basket ' + (i + 1) : lab.key, pressable: false, hit: { x: -w / 2, y: -h - 50, w, h: h + 50 } }));
      fr.draw = (g, s) => {
        g.save(); tf(g); g.drawImage(front.canvas, -front.ox, -front.oy, front.w, front.h);
        if (fr.fl >= 0.5 && b.next) { b.lab = b.next; b.next = null; }
        g.translate(0, -h * 0.56); g.rotate(-0.03 + i * 0.03); g.scale(Math.max(0.02, Math.abs(Math.cos(fr.fl * Math.PI))), 1);
        const tb = tagBack(tsz); g.drawImage(tb.canvas, -tb.ox, -tb.oy, tb.w, tb.h); drawLabel(g, s, b.lab, tsz, words && !b.lab.secret);
        g.restore();
      };
      fr.update = (dt) => { b.pop = Math.max(0, b.pop - dt * 3); b.shake = Math.max(0, b.shake - dt * 2.4); back.y = fr.y; };
      fr.to({ y: baseY }, { dur: 0.5, ease: 'back', delay: 0.1 * i });
      fr.onTap = () => tapTarget(b);
      b.node = fr;
      b.contains = (px, py) => Math.abs(px - x) < w / 2 + 34 && py > baseY - h - 150 && py < baseY + 40;
      const per = w < 180 ? 2 : 3, gap = (w - 50) / per;
      b.slot = (c) => { const q = b.count++, r = Math.floor(q / per), ci = q % per; return { x: x + (ci - (per - 1) / 2) * gap + (r % 2) * 10, y: baseY - h - 28 - r * (land ? 42 : 34), k: small * (c.size ? (c.size === 'big' ? 1.22 : 0.74) : 1), z: 16 - r * 0.1 + ci * 0.01 }; };
      b.reveal = (labNow) => { sfx.flip(); b.next = labNow; return fr.to({ fl: 1 }, { dur: 0.5, ease: 'linear' }); };
      targets.push(b); return b;
    }
    function basketRow(labs) {
      const n = labs.length, w = land ? (n === 2 ? 290 : 250) : (n === 2 ? 216 : 152), h = land ? 190 : (n === 2 ? 170 : 150);
      const span = land ? Math.min(W - 140, n === 2 ? 760 : 1060) : W - 30;
      return labs.map((lab, i) => addBasket(W / 2 + (i - (n - 1) / 2) * (span / n), w, h, lab, i, n));
    }
    /** Things that start inside a basket (guess my rule). */
    function preload(b, item, i) {
      const c = keep(st.add({ z: 16, x: b.x, y: baseY - b.h - 300, sx: 0, sy: 0, rot: (Math.random() - 0.5) * 0.3, t: item.t }));
      c.size = item.size || null; c.draw = (g, s) => drawThing(g, s, item.t);
      const p = b.slot(c); c.z = p.z; c.x = p.x;
      c.to({ sx: p.k, sy: p.k }, { dur: 0.2, delay: 0.5 + i * 0.12 }); c.to({ y: p.y }, { dur: 0.45, ease: (q) => q * q, delay: 0.5 + i * 0.12 }).then(() => { sfx.plop(i); b.pop = 0.6; });
    }

    /* ---------- rounds ---------- */
    function clearRound() {
      for (const n of stuff) { n.onTap = n.onDown = null; n.to({ alpha: 0 }, { dur: 0.25 }).then(() => n.remove()); }
      stuff = []; things = []; targets = []; sel = null; finish = null;
      return ctx.wait(320);
    }
    /** Lay out loose things and wait until every one is in its place. */
    function play(items, wantOf, top, from) {
      const homes = scatter(items.length, top);
      items.forEach((it, i) => { const c = addThing(it, homes[i], from && from(it), i); c.want = wantOf(it); });
      S.total = S.left = items.length; S.id = (S.id || 0) + 1; S.misses = 0;
      S.things = things.map((c) => ({ id: c.t.id, want: c.want })); S.targets = targets.map((q) => q.key);
      touch();
      return new Promise((res) => { finish = res; });
    }
    async function tidyDone() {
      K.sfx.sparkle(); for (const q of targets) { q.pop = 1; ctx.fx.burst(q.hx, q.hy, { n: 10 }); }
      await tell(T.done, 1500);
    }
    const hintOf = { kind: (c) => KIND_SAY[c.t.kind], col: (c) => COL_SAY[c.t.col], size: (c) => SIZE_SAY[c.size] };
    const wantBy = { kind: (it) => it.t.kind, col: (it) => it.t.col, size: (it) => it.size };
    const top0 = baseY + (land ? 100 : 112);

    async function basketRound(type, keys, items, prompt, from) {
      S = { mode: type, type, keys, misses: 0, hint: hintOf[type], id: S.id };
      basketRow(keys.map((key) => ({ type, key })));
      if (prompt) ctx.prompt(prompt);
      const done = play(items, wantBy[type], top0, from);
      if (turn === 0 && !from) ctx.after(1900, () => { if (S.left === S.total && finish) { demos++; demo(); } });
      await done;
      await tidyDone();
    }
    function sizes(items) { const order = K.shuffle(items.map((x, i) => i)); order.forEach((ix, k) => { items[ix].size = k % 2 ? 'small' : 'big'; }); return items; }
    const ofKind = (k, f) => THINGS.filter((t) => t.kind === k && (!f || f(t)));

    async function roundL1() {
      const n = 4 + Math.min(skill, 2), byCol = turn % 2 === 1;
      if (!byCol) {
        const pair = pickNew([['food', 'clothes'], ['food', 'toys'], ['clothes', 'toys']], 'pair', (p) => p.join());
        const a = Math.ceil(n / 2), items = K.sample(ofKind(pair[0]), a).concat(K.sample(ofKind(pair[1]), n - a)).map((t) => ({ t }));
        await basketRound('kind', pair, items, `${T.tidy} ${T.put}`);
      } else {
        const pair = pickNew([['red', 'yellow'], ['red', 'green'], ['yellow', 'green'], ['red', 'blue'], ['yellow', 'blue']], 'pair', (p) => p.join());
        const of = (c) => THINGS.filter((t) => t.col === c), b = Math.min(of(pair[1]).length, Math.floor(n / 2)), items = K.sample(of(pair[0]), n - b).concat(K.sample(of(pair[1]), b)).map((t) => ({ t }));
        await basketRound('col', K.shuffle(pair), items, `${T.tidy} ${T.put}`);
      }
    }
    async function roundL2() {
      if (pending) {       // the same things, sorted another way
        const pd = pending; pending = null;
        const keys = pd.next === 'col' ? pd.cols : ['big', 'small'];
        S = { mode: pd.next, type: pd.next, keys, misses: 0, hint: hintOf[pd.next], id: S.id };
        basketRow(keys.map((key) => ({ type: pd.next, key })));
        ctx.prompt(pd.next === 'col' ? T.byCol : T.bySize);
        await play(pd.items, wantBy[pd.next], top0, (it) => ({ x: pd.at[it.t.kind] || W / 2, y: baseY - 200 }));
        await tidyDone();
        return;
      }
      const next = pickNew(['col', 'size'], 'resort'), per = 2 + (skill >= 2 ? 1 : 0), extra = skill === 1 ? 1 : 0;
      let items, cols = null;
      if (next === 'col') {
        cols = K.pick([['red', 'yellow', 'green'], ['red', 'yellow', 'blue']]);
        for (let guard = 0; guard < 40; guard++) {
          items = [].concat(...['food', 'clothes', 'toys'].map((k, i) => K.sample(ofKind(k, (t) => cols.includes(t.col)), per + (i === 0 ? extra : 0)))).map((t) => ({ t }));
          if (cols.every((c) => items.some((it) => it.t.col === c))) break;
        }
        cols = K.shuffle(cols);
      } else items = sizes([].concat(...['food', 'clothes', 'toys'].map((k, i) => K.sample(ofKind(k), per + (i === 2 ? extra : 0)))).map((t) => ({ t })));
      const keys = K.shuffle(['food', 'clothes', 'toys']);
      await basketRound('kind', keys, items, `${T.tidy} ${T.put}`);
      const at = {}; targets.forEach((q) => { at[q.key] = q.x; });
      pending = { next, items, cols, at };
    }

    /* ---------- level 3: two rings and a spare shelf ---------- */
    async function roundVenn(withShelf) {
      const v = pickNew(VENNS, 'venn', (x) => x.col + x.kind);
      const inA = (t) => t.col === v.col, inB = (t) => t.kind === v.kind;
      const reg = (t) => (inA(t) && inB(t) ? 'middle' : inA(t) ? 'ring one' : inB(t) ? 'ring two' : 'shelf');
      const cap = land ? 8 : (withShelf ? 6 : 8), each = Math.min(3, 2 + (skill >= 2 ? 1 : 0));
      let list = THINGS.filter((t) => reg(t) === 'middle').concat(K.sample(THINGS.filter((t) => reg(t) === 'ring one'), each), K.sample(THINGS.filter((t) => reg(t) === 'ring two'), each)).slice(0, cap);
      if (withShelf) list = list.concat(K.sample(THINGS.filter((t) => reg(t) === 'shelf'), 2));
      S = { mode: 'venn', v, withShelf, misses: 0, id: S.id, hint: (c) => [COL_SAY[c.t.col], KIND_SAY[c.t.kind]].filter(Boolean).join(' ') };
      // geometry: side by side on a tablet, one above the other on a phone
      const r = land ? 205 : 155, d = land ? 260 : 198, q5 = 155 / 165, cx = land ? W / 2 - (withShelf ? 80 : 0) : W / 2, cy = land ? 405 : 0;
      const ca = land ? { x: cx - d / 2, y: cy } : { x: cx, y: 366 }, cb = land ? { x: cx + d / 2, y: cy } : { x: cx, y: 366 + d };
      const mat = land ? { x: cx - d / 2 - r - 40, y: cy - r - 38, w: d + r * 2 + 80, h: r * 2 + 76 } : { x: 14, y: ca.y - r - 26, w: W - 28, h: d + r * 2 + 52 };
      const colA = COLS[v.col], colB = '#2F8F8A', tsz = land ? 112 : 96;
      const labA = { type: 'col', key: v.col }, labB = { type: 'kind', key: v.kind };
      const tagA = land ? { x: ca.x - r * 0.84, y: ca.y - r * 0.86 } : { x: ca.x - r * 0.96, y: ca.y - r * 0.6 }, tagB = land ? { x: cb.x + r * 0.84, y: cb.y - r * 0.86 } : { x: cb.x - r * 0.96, y: cb.y + r * 0.6 };
      const board = keep(st.add({ z: 10, alpha: 0, sprite: A.sprite('tidyMat' + Math.round(W) + (withShelf ? 's' : 'n') + v.col, [mat.x, mat.y, mat.w, mat.h], (g, s) => {
        g.beginPath(); A.rect(g, mat.x, mat.y, mat.w, mat.h, 54, 3, 1.5); A.paper(g, s, '#FBF3E0', { shadow: 1, depth: 1.3, light: 0.03, box: mat });
        for (const [c, col] of [[ca, colA], [cb, colB]]) { g.beginPath(); g.arc(c.x, c.y, r, 0, 7); g.fillStyle = A.alpha(col, 0.2); g.fill(); }
        for (const [c, col] of [[ca, colA], [cb, colB]]) { g.save(); g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 6 * s; g.shadowOffsetY = 3 * s; g.beginPath(); g.arc(c.x, c.y, r, 0, 7); g.strokeStyle = col; g.lineWidth = 13; g.stroke(); g.restore(); g.beginPath(); g.arc(c.x, c.y, r + 3, Math.PI * 1.05, Math.PI * 1.45); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke(); }
      }) }));
      board.to({ alpha: 1 }, { dur: 0.35 });
      board.hit = mat; board.pressable = false; board.onTap = (p) => { const q = p && targets.find((x) => x.contains(p.x, p.y)); if (q) tapTarget(q); };
      const tags = keep(st.add({ z: 12, alpha: 0, draw(g, s) { for (const [p, lab, rot] of [[tagA, labA, -0.06], [tagB, labB, 0.05]]) { g.save(); g.translate(p.x, p.y); g.rotate(rot); const tb = tagBack(tsz); g.drawImage(tb.canvas, -tb.ox, -tb.oy, tb.w, tb.h); drawLabel(g, s, lab, tsz, true); g.restore(); } } }));
      tags.to({ alpha: 1 }, { dur: 0.35, delay: 0.15 });
      const SL = land
        ? { 'ring one': [[-125, 0], [-38, -95], [-38, 95], [-125, -95], [-125, 95], [-38, 0]].map(([x, y]) => [ca.x + x, ca.y + y]), middle: [[0, 0], [0, -92], [0, 92]].map(([x, y]) => [cx + x, cy + y]), 'ring two': [[125, 0], [38, -95], [38, 95], [125, -95], [125, 95], [38, 0]].map(([x, y]) => [cb.x + x, cb.y + y]) }
        : { 'ring one': [[0, -95], [-78, -70], [78, -70], [-105, 0], [105, 0], [0, -15]].map(([x, y]) => [ca.x + x * q5, ca.y + y * q5]), middle: [[0, 0], [-76, 0], [76, 0]].map(([x, y]) => [cx + x, ca.y + d / 2 + y]), 'ring two': [[0, 95], [-78, 70], [78, 70], [-105, 0], [105, 0], [0, 15]].map(([x, y]) => [cb.x + x * q5, cb.y + y * q5]) };
      const inC = (c, x, y) => Math.hypot(x - c.x, y - c.y) < r + 6;
      const region = (key, test) => {
        const pts = SL[key], xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), bx = Math.min(...xs) - 44, by = Math.min(...ys) - 44;
        const q = { key, count: 0, pop: 0, pulse: false, hover: false, shake: 0, hx: (Math.min(...xs) + Math.max(...xs)) / 2, hy: (Math.min(...ys) + Math.max(...ys)) / 2 + 40, contains: test };
        q.slot = () => { const p = pts[q.count++ % pts.length]; return { x: p[0], y: p[1], k: land ? 0.68 : 0.54, z: 13 + q.count * 0.01 }; };
        const n = keep(st.add({ z: 11, x: bx, y: by, label: key, pressable: false, pad: 0, hit: { x: 0, y: 0, w: Math.max(...xs) - bx + 44, h: Math.max(...ys) - by + 44 } }));
        n.draw = (g) => { if (!q.pulse && !q.hover && q.pop < 0.05) return; g.beginPath(); g.arc(q.hx - bx, q.hy - 40 - by, key === 'middle' ? 62 : 84, 0, 7); g.fillStyle = A.alpha('#F7D27A', q.pulse ? 0.55 + Math.sin(st.t * 7) * 0.25 : Math.max(q.hover ? 0.4 : 0, q.pop * 0.5)); g.fill(); };
        n.update = (dt) => { q.pop = Math.max(0, q.pop - dt * 3); q.shake = 0; };
        n.onTap = () => tapTarget(q); q.node = n; targets.push(q); return q;
      };
      region('ring one', (x, y) => inC(ca, x, y) && !inC(cb, x, y));
      region('middle', (x, y) => inC(ca, x, y) && inC(cb, x, y));
      region('ring two', (x, y) => inC(cb, x, y) && !inC(ca, x, y));
      let top = land ? 770 : mat.y + mat.h + 96;
      if (withShelf) {
        const sw = land ? Math.min(250, W - (mat.x + mat.w) - 50) : 300, sx = land ? mat.x + mat.w + 26 + sw / 2 : W / 2, sy = land ? 470 : mat.y + mat.h + 100;
        const q = { key: 'shelf', count: 0, pop: 0, pulse: false, hover: false, shake: 0, hx: sx, hy: sy - 30, contains: (x, y) => Math.abs(x - sx) < sw / 2 + 30 && y > sy - 170 && y < sy + 50 };
        q.slot = () => { const i = q.count++; return { x: sx + (i % 2 ? 1 : -1) * sw * 0.23, y: sy - (land ? 50 : 46) - Math.floor(i / 2) * 20, k: land ? 0.72 : 0.68, z: 13 + i * 0.01 }; };
        const n = keep(st.add({ z: 12, x: sx, y: sy, alpha: 0, label: 'shelf', pressable: false, hit: { x: -sw / 2, y: -150, w: sw, h: 190 } }));
        n.draw = (g, s) => {
          const k = 1 + q.pop * 0.05 + (q.hover ? 0.04 : 0); g.rotate(Math.sin(st.t * 40) * q.shake * 0.04); g.scale(k, k);
          if (q.pulse) { g.beginPath(); A.rect(g, -sw / 2 - 14, -150, sw + 28, 200, 30, 2, 0); g.fillStyle = A.alpha('#F7D27A', 0.55 + Math.sin(st.t * 7) * 0.25); g.fill(); }
          for (const x of [-sw * 0.3, sw * 0.3]) { g.beginPath(); A.cut(g, [[x - 13, 24], [x + 13, 24], [x, 58]], 5, 0.5, 4); A.paper(g, s, '#B97F4A', { shadow: 0.5 }); }
          g.beginPath(); A.rect(g, -sw / 2, -8, sw, 38, 12, 6, 0.8); A.paper(g, s, '#DDA35C', { shadow: 0.9, light: 0.08, box: { x: -sw / 2, y: -8, w: sw, h: 38 } });
          g.fillStyle = 'rgba(90,50,20,.75)'; g.font = `700 25px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('other', 0, 12);
        };
        n.update = (dt) => { q.pop = Math.max(0, q.pop - dt * 3); q.shake = Math.max(0, q.shake - dt * 2.4); };
        n.to({ alpha: 1 }, { dur: 0.35, delay: 0.2 }); n.onTap = () => tapTarget(q); q.node = n; targets.push(q);
        if (!land) top = sy + 130;
      }
      ctx.prompt(`${T.rings} ${v.a} ${v.b} ${v.ab}` + (withShelf ? ' ' + T.shelf : ''), { show: `${v.col[0].toUpperCase() + v.col.slice(1)} things, ${v.kind}, and both in the middle` });
      await play(K.shuffle(list).map((t) => ({ t })), (it) => reg(it.t), top);
      await tidyDone();
    }

    /* ---------- level 3: guess my rule ---------- */
    async function roundGuess() {
      const type = pickNew(['col', 'kind', 'size'], 'rule'), nb = type === 'size' ? 2 : (skill >= 1 ? 3 : 2), loose = 4 + Math.min(skill, 2);
      let keys, pre = {}, items = [];
      const two = (list, differ) => { const a = list[0], b = list.find((t) => t !== a && differ(t) !== differ(a)) || list[1]; return [a, b]; };
      if (type === 'size') {
        keys = K.shuffle(['big', 'small']); const all = sizes(K.sample(THINGS, 4 + loose).map((t) => ({ t })));
        for (const k of keys) { const mine = all.filter((it) => it.size === k); pre[k] = mine.slice(0, 2); items = items.concat(mine.slice(2)); }
      } else {
        const groups = type === 'col' ? ['red', 'yellow', 'green'] : ['food', 'clothes', 'toys'], f = type === 'col' ? (t) => t.col : (t) => t.kind, g2 = type === 'col' ? (t) => t.kind : (t) => t.col;
        keys = K.sample(groups, nb); let rest = [];
        for (const k of keys) { const mine = K.shuffle(THINGS.filter((t) => f(t) === k)), p2 = two(mine, g2); pre[k] = p2.map((t) => ({ t })); const others = mine.filter((t) => !p2.includes(t)); if (others.length) { items.push({ t: others[0] }); rest = rest.concat(others.slice(1)); } }
        items = items.concat(K.sample(rest, Math.max(0, loose - items.length)).map((t) => ({ t })));
      }
      S = { mode: 'guess', type, keys, secret: true, misses: 0, id: S.id, hint: () => T.inside };
      const bs = basketRow(keys.map((key) => ({ type, key, secret: true })));
      bs.forEach((b) => pre[b.key].forEach((it, i) => preload(b, it, i)));
      ctx.prompt(`${T.guess} ${T.inside}`);
      await ctx.wait(900);
      await play(K.shuffle(items), wantBy[type], top0);
      K.sfx.sparkle();
      await Promise.all(bs.map((b, i) => ctx.wait(i * 160).then(() => b.reveal({ type, key: b.key }))));
      for (const q of targets) { q.pop = 1; ctx.fx.burst(q.hx, q.hy, { n: 10 }); }
      await tell(RULE_SAY[type], 2200);
    }

    /* ---------- the session ---------- */
    function nextKind() {
      if (force) { const f = force; force = null; return f; }
      if (L === 1) return 'l1';
      if (L === 2) return 'l2';
      return ['venn', 'guess', 'shelf', 'guess'][turn % 4];
    }
    let roundNo = 0;
    async function loop() {
      await ctx.wait(350);
      while (ctx.alive) {
        const kind = nextKind();
        roundNo++;
        if (kind === 'l1') await roundL1(); else if (kind === 'l2') await roundL2(); else if (kind === 'guess') await roundGuess(); else await roundVenn(kind === 'shelf');
        if (!ctx.alive) return;
        if (!S.misses) skill = Math.min(3, skill + 1); else if (S.misses >= 3) skill = Math.max(0, skill - 1);
        turn++; won++; tally.pop = 1; K.sfx.ding();
        await ctx.wait(450);
        await clearRound();
        if (won % SET === 0) await ctx.celebrate({ ms: 3400 });
      }
    }
    K._tidy = { get S() { return S; }, get won() { return won; }, get round() { return roundNo; }, get skill() { return skill; }, set skill(v) { skill = v; }, set force(v) { force = v; },
      get things() { return things; }, get targets() { return targets; },
      /** where things and places are on the page, in CSS pixels, for pointer tests */
      at(id) { const c = things.find((x) => x.t.id === id); return c && { x: c.x * st.unit, y: c.y * st.unit, locked: c.locked, want: c.want }; },
      place(key) { const q = targets.find((x) => x.key === key); return q && { x: q.hx * st.unit, y: (q.hy - (q.h ? 0 : 40)) * st.unit }; } };
    ctx.onExit(() => { K._tidy = null; });
    loop();
  }

  /** The shelf picture: a basket with things peeking out. */
  function icon(g, w) {
    const u = w / 300; g.scale(u, u);
    const rr = (x, y, ww, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + h, r); g.arcTo(x + ww, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
    rr(0, 0, 300, 300, 40); g.save(); g.clip();
    g.fillStyle = '#BFE0DA'; g.fillRect(0, 0, 300, 300); g.fillStyle = 'rgba(255,255,255,.22)'; for (let x = 14; x < 300; x += 58) g.fillRect(x, 0, 28, 300);
    g.fillStyle = '#F0A63C'; g.fillRect(0, 214, 300, 86); g.fillStyle = '#FBF1DA'; g.fillRect(0, 200, 300, 16);
    const put = (path, x, y, sz, col, rot) => { const p = PICS[path]; g.save(); g.translate(x, y); g.rotate(rot || 0); if (p && p.ok) { const k = sz / Math.max(p.im.width, p.im.height); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 8; g.shadowOffsetY = 4; g.drawImage(p.im, -p.im.width * k / 2, -p.im.height * k / 2, p.im.width * k, p.im.height * k); } else { g.beginPath(); g.arc(0, 0, sz * 0.42, 0, 7); g.fillStyle = col; g.fill(); } g.restore(); };
    g.fillStyle = '#8F6238'; rr(62, 96, 176, 60, 12); g.fill();
    put('kitchen/apple', 104, 100, 78, '#DE4E46', -0.2); put('kitchen/banana', 190, 104, 86, '#F2CF4A', 0.3); put('kitchen/hat', 150, 82, 80, '#4F8FCB', 0);
    g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 12; g.shadowOffsetY = 6; g.beginPath(); g.moveTo(54, 122); g.lineTo(246, 122); g.lineTo(228, 252); g.quadraticCurveTo(226, 262, 214, 262); g.lineTo(86, 262); g.quadraticCurveTo(74, 262, 72, 252); g.closePath(); g.fillStyle = '#DDAA63'; g.fill(); g.restore();
    g.save(); g.clip(); for (let r = 0, y = 138; y < 262; y += 26, r++) for (let x = 40 + (r % 2) * 19; x < 260; x += 38) { rr(x + 2, y + 2, 34, 22, 8); g.fillStyle = (Math.round(x / 38) + r) % 2 ? 'rgba(160,105,50,.26)' : 'rgba(255,240,200,.32)'; g.fill(); } g.restore();
    g.fillStyle = '#C48D52'; rr(44, 108, 212, 28, 14); g.fill();
    put('kitchen/ball', 238, 246, 74, '#5B8FC7', 0); put('kitchen/sock', 50, 250, 70, '#2F8F8A', -0.3);
    g.restore();
  }
  ['kitchen/apple', 'kitchen/banana', 'kitchen/hat', 'kitchen/ball', 'kitchen/sock'].forEach(pic);    // for the shelf picture

  K.game({ id: 'tidy', title: 'Tidy Up', voice: 'tidy', group: 'arcade', age: 3, subject: 'thinking', order: 17, icon, start, lines, resize: () => K.go('tidy') });
})();
