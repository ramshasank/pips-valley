/* Pip's Shop — a market stall with paper play coins.
   A friend comes to the stall and wants something. The child pays for it by dragging (or tapping)
   coins from the coin tray onto the counter mat; the till shows the running total as a big number.
   Coins on the mat can be tapped to take them back. A coin that would make it too much hops back.

   Level 1: prices 1-5, only 1-coins, counted aloud.
   Level 2: prices to 12 with 1, 2 and 5 coins; any way that makes the price works, and the fewest
            coins earns a shiny star.
   Level 3: prices to 100 with 1, 2, 5, 10, 20, 50: pay a price, buy two things (add the prices),
            be the shopkeeper and hand back the change, and "you have 20 coins, what can you buy?".
   The coins are play money ("coins"), not any real currency. */
(function () {
  'use strict';
  const A = K.art;
  const num = (n) => K.numWord(n), cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const GOODS = [
    { name: 'apple', say: 'An apple!', col: '#D94B3F' }, { name: 'banana', say: 'A banana!', col: '#F3CE4B' },
    { name: 'cookie', say: 'A cookie!', col: '#C99255' }, { name: 'donut', say: 'A donut!', col: '#EE8FA8' },
    { name: 'cheese', say: 'Some cheese!', col: '#F2C24B' }, { name: 'lemon', say: 'A lemon!', col: '#F2D84B' },
    { name: 'pear', say: 'A pear!', col: '#B5C957' }, { name: 'carrot', say: 'A carrot!', col: '#EE8A3A' },
  ];
  const FRIENDS = { cat: '#5B8FC7', dog: '#E8664A', panda: '#2F8F8A', pig: '#6E4E7E', mouse: '#F2B33D', owl: '#C9553F', chick: '#5B8FC7', lion: '#2F8F8A', hedgehog: '#E8664A' };
  const FUR = { cat: '#B4A498', dog: '#D9A066', panda: '#F4EFE6', pig: '#F2B7B0', mouse: '#C9C3BC', owl: '#B98A5E', chick: '#F6D55C', lion: '#E9B35A', hedgehog: '#C9A27E' };
  const COIN = { 1: '#D8935E', 2: '#B7C3CC', 5: '#F2B33D', 10: '#4FA7A0', 20: '#9A76AE', 50: '#E8664A' };
  const COIN_K = { 1: 0.86, 2: 0.9, 5: 0.95, 10: 1, 20: 1.04, 50: 1.08 };
  const DENOMS = { 1: [1], 2: [1, 2, 5], 3: [1, 2, 5, 10, 20, 50] };
  const MAT_MAX = 12, BUDGET = 20, PRICE_SAY = 12, COUNT_SAY = 5;
  const T = {
    cost: (n) => (n === 1 ? 'It costs one coin.' : `It costs ${num(n)} coins.`),
    count: (n) => cap(num(n)) + '!',
    drag: 'Drag the coins onto the counter.',
    few: 'Can you use the fewest coins?',
    much: 'That is too much.', tryCoin: 'Try this coin.', full: 'Try a bigger coin.',
    fewest: 'The fewest coins!', bigger: 'Bigger coins make it quicker.', thanks: 'Thank you!',
    pay: 'Pay the price.', two: 'Two things!', add: 'Add the prices.',
    keeper: 'You are the shopkeeper!', change: 'Give back the change.',
    have: 'You have twenty coins.', what: 'What can you buy?', bell: 'Ring the bell when you are done.',
    more: 'You can buy more.', spent: 'Every coin is spent!',
  };
  function lines() {
    const out = GOODS.map((x) => x.say);
    for (let n = 1; n <= PRICE_SAY; n++) out.push(T.cost(n));
    for (let n = 1; n <= COUNT_SAY; n++) out.push(T.count(n));
    for (const k in T) if (typeof T[k] === 'string') out.push(T[k]);
    return out;
  }
  function minCoins(n) { let c = 0; for (const d of [50, 20, 10, 5, 2, 1]) { c += Math.floor(n / d); n %= d; } return c; }

  /* ---------------- pictures ---------------- */
  const PIC = {};
  function pic(path) {
    let e = PIC[path];
    if (!e) { e = PIC[path] = { im: new Image(), ok: false }; e.im.onload = () => { e.ok = true; }; e.im.src = 'img/' + path + '.webp'; }
    return e.ok ? e.im : null;
  }
  for (const x of GOODS) pic('kitchen/' + x.name);
  for (const f in FRIENDS) { pic('faces/' + f); pic('faces/' + f + '-shut'); }

  /* ---------------- drawing ---------------- */
  /** One of the goods, about `size` across, centred on (0,0). */
  function drawGood(g, good, size) {
    const im = pic('kitchen/' + good.name);
    if (im) { const k = size / Math.max(im.width, im.height); g.drawImage(im, -im.width * k / 2, -im.height * k / 2, im.width * k, im.height * k); return; }
    g.beginPath(); g.ellipse(0, size * 0.04, size * 0.42, size * 0.4, 0, 0, 7); g.fillStyle = good.col; g.fill();
    g.beginPath(); g.ellipse(-size * 0.16, -size * 0.1, size * 0.07, size * 0.12, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
  }
  /** A round animal face `w` wide. */
  function drawFace(g, name, w, shut) {
    const im = pic('faces/' + name + (shut ? '-shut' : '')) || pic('faces/' + name);
    if (im) { const h = w * im.height / im.width; g.drawImage(im, -w / 2, -h / 2, w, h); return; }
    const r = w * 0.44, c = FUR[name] || '#D9B38C';
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * r * 0.7, -r * 0.62, r * 0.32, 0, 7); g.fillStyle = A.shade(c, -0.12); g.fill(); }
    g.beginPath(); g.ellipse(0, 0, r, r * 0.9, 0, 0, 7); g.fillStyle = c; g.fill();
    for (const sx of [-1, 1]) {
      g.beginPath(); g.arc(sx * r * 0.6, r * 0.3, r * 0.19, 0, 7); g.fillStyle = 'rgba(240,120,110,.5)'; g.fill();
      g.beginPath(); if (shut) { g.arc(sx * r * 0.4, 0, r * 0.12, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = '#2E2A3B'; g.lineWidth = r * 0.06; g.stroke(); } else { g.arc(sx * r * 0.4, -r * 0.05, r * 0.12, 0, 7); g.fillStyle = '#2E2A3B'; g.fill(); }
    }
    g.beginPath(); g.arc(0, r * 0.26, r * 0.2, 0.3, Math.PI - 0.3); g.strokeStyle = '#7A4A3C'; g.lineWidth = r * 0.06; g.lineCap = 'round'; g.stroke();
  }
  /** A paper play coin of value v and radius r. s = 0 draws it flat (for the icon). */
  function drawCoin(g, s, v, r) {
    const c = COIN[v], dark = A.shade(c, -0.16), light = v === 2 || v === 5;
    g.beginPath(); g.arc(0, 0, r, 0, 7);
    if (s) A.paper(g, s, c, { shadow: 0.85, light: 0.1, box: { x: -r, y: -r, w: r * 2, h: r * 2 } }); else { g.fillStyle = c; g.fill(); }
    g.beginPath(); g.arc(0, 0, r * 0.78, 0, 7); g.fillStyle = A.shade(c, 0.05); g.fill();
    g.beginPath(); g.arc(0, 0, r * 0.78, 0, 7); g.strokeStyle = dark; g.lineWidth = r * 0.05; g.stroke();
    g.fillStyle = dark; for (let i = 0; i < 16; i++) { const a = i * 0.3927; g.beginPath(); g.arc(Math.cos(a) * r * 0.89, Math.sin(a) * r * 0.89, r * 0.035, 0, 7); g.fill(); }
    g.font = `800 ${r * (v >= 10 ? 0.86 : 1.08)}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(46,42,59,.25)'; g.fillText(String(v), r * 0.03, r * 0.1);
    g.fillStyle = light ? '#4A3B2E' : '#FFF8E8'; g.fillText(String(v), 0, r * 0.06);
    g.beginPath(); g.arc(0, 0, r * 0.62, Math.PI * 1.08, Math.PI * 1.42); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = r * 0.07; g.lineCap = 'round'; g.stroke();
  }
  const coinSp = (v, r) => A.sprite('shopcoin' + v + 'r' + Math.round(r), [-r - 2, -r - 2, r * 2 + 4, r * 2 + 4], (g, s) => drawCoin(g, s, v, r * COIN_K[v]));
  /** A price tag `h` tall with its string hole on the left; the number is the price. */
  function drawTag(g, s, price, h, glow) {
    const w = h * (price >= 10 ? 1.7 : 1.35);
    g.save(); g.rotate(-0.07);
    A.line(g, '#B98558', h * 0.05, (p) => { p.moveTo(-w / 2 + h * 0.2, 0); p.quadraticCurveTo(-w / 2 - h * 0.2, -h * 0.5, -w / 2 - h * 0.34, -h * 0.2); });
    g.beginPath(); A.cut(g, [[-w / 2 + h * 0.3, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2 + h * 0.3, h / 2], [-w / 2, 0]], h * 0.12, 0.6, 5);
    A.paper(g, s, glow ? '#FFE9A8' : '#FFF6DE', { shadow: 0.8, box: { x: -w / 2, y: -h / 2, w, h } });
    g.beginPath(); g.arc(-w / 2 + h * 0.22, 0, h * 0.07, 0, 7); g.fillStyle = '#B98558'; g.fill();
    g.fillStyle = A.C.ink; g.font = `800 ${h * 0.78}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(price), h * 0.16, h * 0.05);
    g.restore();
  }
  function starPath(g, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * 0.6283, q = i % 2 ? r * 0.5 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); }

  /** The stall behind the counter: sky, hills, poles, back cloth, awning. */
  function backdrop(g, s, W, H, cy, land) {
    const sk = g.createLinearGradient(0, 0, 0, cy); sk.addColorStop(0, '#A9D3DD'); sk.addColorStop(1, '#F3E9D6'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
    g.beginPath(); g.arc(W * 0.8, 250, 54, 0, 7); g.fillStyle = '#F7D27A'; g.fill();
    g.beginPath(); A.smooth(g, [[-40, cy + 20], [-40, cy - 150], [W * 0.2, cy - 230], [W * 0.45, cy - 130], [W * 0.7, cy - 250], [W + 40, cy - 160], [W + 40, cy + 20]]); A.paper(g, s, '#A9C9B4', { shadow: 0.4 });
    g.beginPath(); A.smooth(g, [[-40, cy + 20], [-40, cy - 60], [W * 0.3, cy - 120], [W * 0.62, cy - 50], [W + 40, cy - 110], [W + 40, cy + 20]]); A.paper(g, s, '#7FB08A', { shadow: 0.4 });
    // back cloth with soft stripes
    const bx = 56, bw = W - 112, by = 120;
    g.beginPath(); A.rect(g, bx, by, bw, cy - by + 20, 4, 3, 0.8); A.paper(g, s, '#F6E7CC', { shadow: 0.5, box: { x: bx, y: by, w: bw, h: cy - by }, light: 0.03, grain: 0.3 });
    for (let x = bx + 30; x < bx + bw - 30; x += 96) { g.fillStyle = 'rgba(214,150,110,.13)'; g.fillRect(x, by, 44, cy - by + 20); }
    // a little shelf of goods beside the till on a tablet
    if (land) {
      const sx0 = W - 400, sy = 308;
      g.beginPath(); A.rect(g, sx0, sy, 350, 16, 5, 9, 0.5); A.paper(g, s, '#C08A5A', { shadow: 0.8 });
      [['lemon', 0], ['donut', 1], ['pear', 2]].forEach(([nm, i]) => { g.save(); g.translate(sx0 + 62 + i * 112, sy - 46); drawGood(g, GOODS.find((x) => x.name === nm), 92); g.restore(); });
    }
    // poles
    for (const x of [34, W - 62]) { g.beginPath(); A.rect(g, x, 96, 28, cy - 70, 8, x, 0.6); A.paper(g, s, '#B98558', { shadow: 0.8, box: { x, y: 96, w: 28, h: cy - 70 } }); }
    // awning: stripes with a scalloped edge
    const ah = land ? 150 : 136, n = Math.max(6, Math.round(W / 118)), sw = (W + 40) / n;
    for (let i = 0; i < n; i++) {
      const x = -20 + i * sw, col = i % 2 ? '#FBF1DC' : '#E8664A';
      g.beginPath(); g.moveTo(x, -20); g.lineTo(x + sw + 1, -20); g.lineTo(x + sw + 1, ah); g.arc(x + sw / 2, ah, sw / 2, 0, Math.PI); g.closePath();
      A.paper(g, s, col, { shadow: 0.9, light: 0.05, box: { x, y: 0, w: sw, h: ah + sw / 2 } });
    }
    g.fillStyle = 'rgba(46,40,70,.10)'; g.fillRect(0, ah - 16, W, 16);
  }
  /** Counter top, the felt mat, the wooden front and the coin tray. */
  function counter(g, s, W, H, cy, mat, tray) {
    g.beginPath(); A.rect(g, -20, cy + 150, W + 40, H - cy, 4, 2, 0.6); A.paper(g, s, '#B67E52', { shadow: 0, box: { x: 0, y: cy + 150, w: W, h: H - cy - 150 }, light: 0.05 });
    for (let x = 60; x < W; x += 150) A.line(g, 'rgba(90,55,35,.22)', 3, (p) => { p.moveTo(x, cy + 190); p.lineTo(x + 4, H); });
    g.beginPath(); A.rect(g, -20, cy, W + 40, 172, 6, 4, 0.8); A.paper(g, s, '#E6BC8A', { shadow: 0.9, box: { x: 0, y: cy, w: W, h: 172 }, light: 0.06 });
    g.beginPath(); A.rect(g, -20, cy + 166, W + 40, 18, 5, 6, 0.6); A.paper(g, s, '#C99666', { shadow: 0.8 });
    A.line(g, 'rgba(255,255,255,.35)', 3, (p) => { p.moveTo(0, cy + 6); p.lineTo(W, cy + 6); });
    for (const y of [cy + 60, cy + 118]) A.line(g, 'rgba(150,100,60,.16)', 2, (p) => { p.moveTo(0, y); p.lineTo(W, y + 2); });
    // the mat
    g.beginPath(); A.rect(g, mat.x - mat.w / 2, mat.y - mat.h / 2, mat.w, mat.h, 26, 8, 1); A.paper(g, s, '#3E8E86', { shadow: 0.7, box: { x: mat.x - mat.w / 2, y: mat.y - mat.h / 2, w: mat.w, h: mat.h }, light: 0.05, grain: 0.4 });
    g.save(); g.setLineDash([10, 9]); A.line(g, 'rgba(255,255,255,.5)', 3, (p) => A.rect(p, mat.x - mat.w / 2 + 10, mat.y - mat.h / 2 + 10, mat.w - 20, mat.h - 20, 18, 9, 0.5)); g.restore();
    // the coin tray
    g.beginPath(); A.rect(g, tray.x - tray.w / 2 - 14, tray.y - 14, tray.w + 28, tray.h + 28, 34, 11, 1); A.paper(g, s, '#8A5A3C', { shadow: 1, box: { x: tray.x - tray.w / 2, y: tray.y, w: tray.w, h: tray.h } });
    g.beginPath(); A.rect(g, tray.x - tray.w / 2, tray.y, tray.w, tray.h, 24, 12, 0.8); A.paper(g, s, '#6E4E7E', { shadow: 0, box: { x: tray.x - tray.w / 2, y: tray.y, w: tray.w, h: tray.h }, light: 0.07, grain: 0.45 });
    g.fillStyle = 'rgba(30,20,40,.16)'; g.beginPath(); A.rect(g, tray.x - tray.w / 2, tray.y, tray.w, 16, 12, 13, 0.5); g.fill();
  }
  function tillBody(g, s) {
    g.beginPath(); A.rect(g, -128, -40, 256, 40, 10, 3, 0.8); A.paper(g, s, '#F3DDB8', { shadow: 0.9, box: { x: -128, y: -40, w: 256, h: 40 } });
    g.beginPath(); g.arc(0, -20, 8, 0, 7); g.fillStyle = '#B98558'; g.fill();
    g.beginPath(); A.cut(g, [[-112, -40], [-96, -128], [96, -128], [112, -40]], 14, 0.8, 4); A.paper(g, s, '#E8664A', { shadow: 0.7, box: { x: -112, y: -128, w: 224, h: 88 }, light: 0.07 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { g.beginPath(); g.arc(-64 + c * 32, -100 + r * 30, 10, 0, 7); g.fillStyle = (r + c) % 3 ? '#FBF1DC' : '#F2B33D'; g.fill(); }
    g.beginPath(); A.rect(g, -104, -226, 208, 100, 16, 6, 0.8); A.paper(g, s, '#C9553F', { shadow: 0.8, box: { x: -104, y: -226, w: 208, h: 100 } });
    g.beginPath(); A.rect(g, -88, -212, 176, 72, 10, 7, 0.4); g.fillStyle = '#2E3A46'; g.fill();
  }
  function bellArt(g, s) {
    g.beginPath(); A.rect(g, -62, -16, 124, 16, 8, 2); A.paper(g, s, '#3E3A52', { shadow: 0.8 });
    g.beginPath(); g.moveTo(-52, -16); g.quadraticCurveTo(-52, -84, 0, -86); g.quadraticCurveTo(52, -84, 52, -16); g.closePath(); A.paper(g, s, '#F2B33D', { box: { x: -52, y: -86, w: 104, h: 70 }, light: 0.1 });
    g.beginPath(); g.ellipse(-22, -54, 8, 16, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
    g.beginPath(); g.arc(0, -94, 11, 0, 7); A.paper(g, s, '#3E3A52', { shadow: 0.4 });
  }

  /* ---------------- the game ---------------- */
  function start(st, ctx) {
    const L = ctx.level, ROUNDS = 4, W = st.W, H = st.H, land = W >= 1000;
    const denoms = DENOMS[L], loose = L === 1;
    const nSrc = loose ? 7 : denoms.length;
    const CR = land ? 48 : 50;                                   // coin radius in the tray
    const gapX = loose ? CR * 2 + 18 : (land ? 150 : 160);
    const rows = W - 60 >= nSrc * gapX ? 1 : 2;
    const tray = { w: Math.min(W - 40, (rows === 1 ? nSrc : Math.ceil(nSrc / 2)) * gapX + 60), h: rows === 1 ? 160 : 290 };
    tray.x = W / 2; tray.y = H - tray.h - 40;
    const cy = tray.y - 250;                                     // y of the counter's back edge
    const mat = { x: W / 2, y: cy + 88, w: Math.min(560, W - 40), h: 152 };
    const fw = land ? 250 : 190, fx = land ? Math.max(180, W * 0.15) : 112, fy = cy - fw * 0.5;
    const ts = land ? 1 : 0.7, tx = land ? W - 200 : W - 104, ty = cy + (land ? 40 : 12);
    const bub = land ? { x: fx + 170, y: 186, w: Math.min(560, W - fx - 170 - 380), h: cy - 186 - 84 } : { x: 20, y: 160, w: W - 40, h: Math.min(300, cy - fw - 180) };
    const drawer = { x: tx, y: ty - 20 * ts };
    let R = null, won = 0, skill = 0, lastKey = '', roundNo = 0, toldBigger = false, friendName = '';
    const stars = [];

    const key = Math.round(W) + 'x' + Math.round(H) + 'L' + L;
    const bg = st.add({ z: 0 });
    const paintBg = () => { bg.sprite = A.sprite('shopbg' + key + (pic('kitchen/pear') ? 'P' : ''), [0, 0, W, H], (g, s) => backdrop(g, s, W, H, cy, land)); };
    paintBg(); ctx.after(1200, paintBg);                         // pictures that arrived late
    st.add({ z: 20, sprite: A.sprite('shopcounter' + key, [0, 0, W, H], (g, s) => counter(g, s, W, H, cy, mat, tray)) });

    /* ---------- the friend ---------- */
    const fr = { happy: 0, blink: 0, nextBlink: 2, hold: null, look: 0 };
    const friend = st.add({ z: 10, x: -300, y: fy, label: 'friend', pressable: false, hit: { x: -fw / 2, y: -fw * 0.45, w: fw, h: fw * 0.9 } });
    friend.draw = (g, s) => {
      if (!friendName) return;
      const bob = fr.happy > 0 ? Math.abs(Math.sin(st.t * 11)) * -22 : Math.sin(st.t * 1.6) * 3;
      g.save(); g.translate(0, bob);
      const col = FRIENDS[friendName];
      g.beginPath(); A.smooth(g, [[-fw * 0.36, fw * 0.3], [0, fw * 0.22], [fw * 0.36, fw * 0.3], [fw * 0.46, fw * 0.95], [-fw * 0.46, fw * 0.95]]); A.paper(g, s, col, { shadow: 0.7, box: { x: -fw * 0.46, y: fw * 0.2, w: fw * 0.92, h: fw * 0.75 } });
      g.beginPath(); A.rect(g, -fw * 0.3, fw * 0.3, fw * 0.6, fw * 0.11, fw * 0.05, 3, 0.5); A.paper(g, s, '#FBF1DC', { shadow: 0.4 });
      g.save(); g.rotate(Math.sin(st.t * 1.3) * 0.02 + (fr.happy > 0 ? Math.sin(st.t * 11) * 0.05 : 0)); drawFace(g, friendName, fw, fr.blink > 0); g.restore();
      if (fr.hold) fr.hold.forEach((it, i) => { g.save(); g.translate((i - (fr.hold.length - 1) / 2) * fw * 0.42, fw * 0.56); g.rotate(Math.sin(st.t * 3 + i) * 0.08); drawGood(g, it, fw * 0.4); g.restore(); });
      g.restore();
    };
    friend.update = (dt) => { fr.happy = Math.max(0, fr.happy - dt); fr.nextBlink -= dt; if (fr.nextBlink < 0) { fr.blink = 0.14; fr.nextBlink = 2 + Math.random() * 3; } fr.blink = Math.max(0, fr.blink - dt); };
    friend.onTap = () => { fr.happy = 0.7; K.sfx.pop(); ctx.fx.burst(friend.x, fy - fw * 0.3, { n: 6 }); };

    /* ---------- the till ---------- */
    const till = st.add({ z: 22, x: tx, y: ty, sx: ts, sy: ts, pop: 0, shake: 0 });
    const tillSp = A.sprite('shoptill', [-134, -232, 268, 236], tillBody);
    till.draw = (g) => {
      g.save(); g.translate(Math.sin(st.t * 50) * till.shake * 6, 0);
      g.drawImage(tillSp.canvas, -tillSp.ox, -tillSp.oy, tillSp.w, tillSp.h);
      if (R) {
        const v = R.kind === 'budget' ? R.left : R.total, k = 1 + till.pop * 0.25;
        g.save(); g.translate(0, -176); g.scale(k, k);
        g.fillStyle = '#F7D27A'; g.font = `800 64px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(v), 0, 4);
        g.restore();
      }
      g.restore();
    };
    till.update = (dt) => { till.pop = Math.max(0, till.pop - dt * 3); till.shake = Math.max(0, till.shake - dt * 2.5); };

    /* ---------- stars for finished rounds ---------- */
    const starRow = st.add({ z: 21, x: W / 2, y: cy + 208 });
    starRow.draw = (g, s) => {
      g.beginPath(); A.rect(g, -ROUNDS * 31 - 14, -30, ROUNDS * 62 + 28, 60, 30, 5, 0.5); A.paper(g, s, '#9A6844', { shadow: 0.5, light: 0.03, box: { x: -140, y: -30, w: 280, h: 60 } });
      for (let i = 0; i < ROUNDS; i++) {
        const sd = stars[i]; g.save(); g.translate((i - (ROUNDS - 1) / 2) * 62, 0);
        if (sd) { const k = 1 + sd.pop * 0.6; g.scale(k, k); g.rotate(sd.pop * 0.6); if (sd.bonus) { g.beginPath(); g.arc(0, 0, 27 + Math.sin(st.t * 5) * 2, 0, 7); g.fillStyle = 'rgba(255,240,170,.75)'; g.fill(); } starPath(g, 22); A.paper(g, s, sd.bonus ? '#FFD23F' : '#F2B33D', { shadow: 0.6 }); }
        else { starPath(g, 19); g.fillStyle = 'rgba(50,28,18,.3)'; g.fill(); }
        g.restore();
      }
    };
    starRow.update = (dt) => { for (const sd of stars) sd.pop = Math.max(0, sd.pop - dt * 2); };

    /* ---------- what the friend wants: a speech bubble (or the shelf, when the child shops) ---------- */
    const bubble = st.add({ z: 45, x: bub.x, y: bub.y, pop: 0, visible: false });
    const eqFont = land ? 58 : 46;
    function itemSpots() {                                       // centres of the goods inside the bubble
      const eq = R.kind === 'two' || R.kind === 'change', rowH = eq ? bub.h - eqFont - 26 : bub.h;
      const n = R.kind === 'pay' ? 1 : 2;
      const size = Math.min(rowH - 36, land ? 150 : 124, bub.w * (n === 1 ? 0.3 : 0.2));
      return R.items.map((it, i) => ({ x: bub.w * (n === 1 ? 0.5 : i ? 0.74 : 0.26) - size * 0.36, y: rowH / 2 + 4, size, rowH }));
    }
    bubble.draw = (g, s) => {
      if (!R) return;
      const k = 1 + bubble.pop * 0.07, bw = bub.w, bh = bub.h;
      g.save(); g.translate(bw / 2, bh / 2); g.scale(k, k); g.translate(-bw / 2, -bh / 2);
      if (R.kind === 'budget') {                               // two shelf boards
        g.beginPath(); A.rect(g, 0, 0, bw, bh, 22, 6, 1); A.paper(g, s, '#F9EBD0', { shadow: 0.9, box: { x: 0, y: 0, w: bw, h: bh }, light: 0.03 });
        g.beginPath(); A.rect(g, 12, bh - 30, bw - 24, 18, 6, 4, 0.5); A.paper(g, s, '#C08A5A', { shadow: 0.7 });
        // the purse: twenty coins to spend
        g.save(); g.translate(bw / 2, 48);
        g.beginPath(); A.rect(g, -112, -34, 224, 68, 34, 8, 0.6); A.paper(g, s, '#6E4E7E', { shadow: 0.6, box: { x: -112, y: -34, w: 224, h: 68 } });
        for (const o of [-80, -34]) { g.save(); g.translate(o, 0); drawCoin(g, s, 10, 25); g.restore(); }
        g.fillStyle = '#FFF8E8'; g.font = `800 50px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('= ' + BUDGET, 50, 3);
        g.restore();
        g.restore(); return;
      }
      const tail = land ? [[30, bh * 0.45], [-62, bh * 0.66], [30, bh * 0.72]] : [[70, bh - 30], [fx + 20 - bub.x, bh + 56], [150, bh - 30]];
      g.beginPath(); A.cut(g, tail, 8, 0.5, 4); A.paper(g, s, '#FBF6EC', { shadow: 0.9 });
      g.beginPath(); A.rect(g, 0, 0, bw, bh, 44, 6, 1.2); A.paper(g, s, '#FBF6EC', { shadow: 0.9, depth: 1.2, box: { x: 0, y: 0, w: bw, h: bh }, light: 0.03 });
      g.beginPath(); A.cut(g, tail, 8, 0.5, 4); g.fillStyle = '#FBF6EC'; g.fill();
      const spots = itemSpots(), sp0 = spots[0];
      R.items.forEach((it, i) => {
        const sp = spots[i];
        if (!it.gone) { g.save(); g.translate(sp.x, sp.y); g.rotate(Math.sin(st.t * 2 + i) * 0.04); drawGood(g, it.good, sp.size); g.restore(); }
        g.save(); g.translate(sp.x + sp.size * 0.92, sp.y + sp.size * 0.08); drawTag(g, s, it.price, sp.size * 0.48, false); g.restore();
      });
      g.fillStyle = A.C.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (R.kind === 'two') { g.font = `800 ${sp0.size * 0.5}px ${A.FONT_TITLE}`; g.fillText('+', bw / 2, sp0.y); }
      if (R.kind === 'change') {                               // the coin the friend pays with
        const r = sp0.size * 0.36; g.save(); g.translate(bw * 0.76, sp0.y); g.rotate(Math.sin(st.t * 2.2) * 0.06); drawCoin(g, s, R.paidCoin, r); g.restore();
      }
      if (R.kind !== 'pay') {
        const a = R.kind === 'two' ? R.items[0].price : R.paidCoin, b = R.kind === 'two' ? R.items[1].price : R.items[0].price, show = R.done || R.reveal;
        const left = `${a} ${R.kind === 'two' ? '+' : '−'} ${b} = `, ans = show ? String(R.target) : '?';
        g.font = `800 ${eqFont}px ${A.FONT_TITLE}`;
        const wl = g.measureText(left).width, wa = g.measureText(ans).width, x0 = bw / 2 - (wl + wa) / 2, y = bh - eqFont * 0.5 - 16;
        g.textAlign = 'left'; g.fillStyle = A.C.ink; g.fillText(left, x0, y);
        g.save(); g.translate(x0 + wl + wa / 2, y); const q = show ? 1 + Math.sin(st.t * 6) * 0.06 : 1 + Math.sin(st.t * 3) * 0.05; g.scale(q, q); g.textAlign = 'center'; g.fillStyle = show ? A.C.teal : A.C.tomato; g.fillText(ans, 0, 0); g.restore();
      }
      g.restore();
    };
    bubble.update = (dt) => { bubble.pop = Math.max(0, bubble.pop - dt * 3); };

    /* ---------- coins ---------- */
    const sources = [], moving = [];
    const spriteFor = (v) => coinSp(v, CR);
    function buildSources() {
      const list = loose ? Array(7).fill(1) : denoms;
      const per = rows === 1 ? list.length : Math.ceil(list.length / 2);
      list.forEach((v, i) => {
        const row = Math.floor(i / per), col = i % per, inRow = row === 0 ? per : list.length - per;
        const x = tray.x + (col - (inRow - 1) / 2) * gapX + (loose ? Math.sin(i * 2.4) * 8 : 0);
        const y = rows === 1 ? tray.y + tray.h / 2 + 4 : tray.y + 80 + row * 132;
        const src = { v, x, y, loose, used: false, drag: null };
        const node = st.add({ z: 32, x, y, hitR: CR + 6, pad: 8, label: 'coin ' + v, pressable: false });
        src.node = node;
        node.draw = (g) => {
          const sp = spriteFor(v), hint = R && !R.over && R.hintV === v, k = hint ? 1 + Math.sin(st.t * 7) * 0.07 : 1;
          if (hint) { g.beginPath(); g.arc(0, 0, CR + 16 + Math.sin(st.t * 7) * 4, 0, 7); g.fillStyle = 'rgba(255,236,150,.8)'; g.fill(); }
          g.save(); g.scale(k, k);
          if (!loose) for (const o of [12, 6]) g.drawImage(sp.canvas, -sp.ox, -sp.oy + o, sp.w, sp.h);
          g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore();
        };
        node.onDown = (p) => {
          if (!R || R.over || R.kind === 'budget' || src.drag) return;
          K.sfx.tap(); const c = spawn(src); src.drag = c; c.dx = src.x - p.x; c.dy = src.y - p.y; c.node.to({ sx: 1.14, sy: 1.14 }, { dur: 0.1, ease: 'out' });
        };
        node.onMove = (p) => { const c = src.drag; if (c) { c.node.x = p.x + c.dx; c.node.y = p.y + c.dy; } };
        node.onUp = (p, e, s) => { const c = src.drag; if (!c) return; src.drag = null; if (s.moved < 24 || overCounter(c.node)) place(c); else giveBack(c); };
        node.onTap = (p) => { if (!p && R && !R.over && R.kind !== 'budget') place(spawn(src)); };   // keyboard / screen reader
        sources.push(src);
      });
    }
    const overCounter = (n) => n.y > cy - 70 && n.y < mat.y + mat.h / 2 + 46;
    function spawn(src) {
      const node = st.add({ z: 60, x: src.x, y: src.y, sprite: spriteFor(src.v) });
      if (src.loose) { src.used = true; src.node.visible = false; }
      const c = { v: src.v, src, node }; moving.push(c); return c;
    }
    function giveBack(c) {
      const i = moving.indexOf(c); if (i >= 0) moving.splice(i, 1);
      c.node.onTap = null; c.node.label = null;
      c.node.to({ x: c.src.x, y: c.src.y, sx: 1, sy: 1 }, { dur: 0.28, ease: 'out' }).then(() => { c.node.remove(); if (c.src.loose) { c.src.used = false; c.src.node.visible = true; } });
    }
    function matSlot(i, n) {
      const per = 6, row = Math.floor(i / per), nr = Math.ceil(n / per), inRow = row < nr - 1 ? per : n - per * (nr - 1), gap = Math.min(88, (mat.w - 36) / per);
      return { x: mat.x + (i % per - (inRow - 1) / 2) * gap, y: mat.y + (row - (nr - 1) / 2) * 68, k: (nr > 1 ? 33 : Math.min(44, gap / 2 - 2)) / CR };
    }
    function layoutMat() { R.paid.forEach((c, i) => { const p = matSlot(i, R.paid.length); c.node.to({ x: p.x, y: p.y, sx: p.k, sy: p.k }, { dur: 0.22, ease: 'out' }); }); }
    function setHint() {
      if (!R || R.kind === 'budget') return;
      const rest = R.target - R.total;
      R.hintV = R.misses >= 2 && rest > 0 ? denoms.filter((d) => d <= rest).pop() : 0;
    }
    function place(c) {
      if (!R || R.over || R.kind === 'budget') return giveBack(c);
      const tooMany = R.paid.length >= MAT_MAX;
      if (tooMany || R.total + c.v > R.target) {                 // it hops onto the mat and straight back
        R.misses++; K.sfx.whoops(); till.shake = 0.5; if (!tooMany && R.misses >= 2 && R.kind !== 'pay') R.reveal = true;
        setHint();
        c.node.to({ x: mat.x, y: mat.y - 30, sx: 1, sy: 1 }, { dur: 0.16, ease: 'out' }).then(() => c.node.to({ rot: 0.3 }, { dur: 0.08 })).then(() => c.node.to({ rot: 0 }, { dur: 0.1 })).then(() => giveBack(c));
        ctx.say(tooMany ? T.full : R.hintV ? `${T.much} ${T.tryCoin}` : T.much);
        return;
      }
      const i = moving.indexOf(c); if (i >= 0) moving.splice(i, 1);
      R.paid.push(c); R.total += c.v; till.pop = 1; setHint();
      c.node.z = 30; st.root._sorted = false; c.node.hitR = CR * 1.2; c.node.pad = 0; c.node.label = 'paid coin ' + c.v; c.node.pressable = false;
      c.node.onTap = () => takeBack(c);
      layoutMat();
      K.sfx.step(R.paid.length - 1); K.sfx.tone(2400, 0.08, { type: 'triangle', vol: 0.08, delay: 0.12 });
      if (R.total === R.target) finish();
      else if (loose) ctx.say(T.count(R.total));
    }
    function takeBack(c) {
      if (!R || R.over) return;
      const i = R.paid.indexOf(c); if (i < 0) return;
      R.paid.splice(i, 1); R.total -= c.v; till.pop = 0.6; K.sfx.tap(); setHint();
      c.node.z = 60; st.root._sorted = false; layoutMat(); giveBack(c);
    }

    /* ---------- the child goes shopping: goods on the shelf, a bell ---------- */
    const shelf = [];
    const bell = st.add({ z: 32, x: tray.x, y: tray.y + tray.h / 2 + (land ? 58 : 70), sprite: A.sprite('shopbell', [-66, -108, 132, 110], bellArt), label: 'all done', hit: { x: -66, y: -108, w: 132, h: 110 }, visible: false, bsc: rows === 1 ? 1.05 : 1.4 });
    bell.onTap = ring;
    function buildShelf(items) {
      const n = items.length, gap = Math.min(128, (bub.w - 20) / n), size = Math.min(104, gap - 14);
      items.forEach((it, i) => {
        const home = { x: bub.x + bub.w / 2 + (i - (n - 1) / 2) * gap, y: bub.y + bub.h - 30 - size * 0.5 - 30 };
        const node = st.add({ z: 46, x: home.x, y: home.y - 400, hitR: Math.max(52, size * 0.52), pad: 6, label: `${it.good.name} ${it.price}`, pressable: false });
        const o = { good: it.good, price: it.price, node, home, size, inBasket: false, grab: false, pulse: false };
        node.draw = (g, s) => {
          const k = o.pulse && !o.inBasket ? 1 + Math.sin(st.t * 7) * 0.07 : 1;
          g.save(); g.scale(k, k); drawGood(g, o.good, size);
          g.translate(size * 0.1, size * 0.5 + 6); drawTag(g, s, o.price, size * 0.42, o.pulse && !o.inBasket); g.restore();
        };
        node.onDown = (p) => { if (!R || R.over || o.busy) return; o.grab = true; o.dx = node.x - p.x; o.dy = node.y - p.y; node.z = 60; st.root._sorted = false; K.sfx.tap(); node.to({ sx: 1.12, sy: 1.12 }, { dur: 0.1 }); };
        node.onMove = (p) => { if (o.grab) { node.x = p.x + o.dx; node.y = p.y + o.dy; } };
        node.onUp = (p, e, s) => {
          if (!o.grab) return; o.grab = false; node.z = 46; st.root._sorted = false;
          const tap = s.moved < 24, onMat = overCounter(node);
          if (o.inBasket ? (tap || !onMat) : (tap || onMat)) toggle(o); else settle(o);
        };
        node.onTap = (p) => { if (!p && R && !R.over) toggle(o); };
        node.to({ y: home.y }, { dur: 0.5, ease: 'back', delay: 0.1 + i * 0.09 });
        shelf.push(o);
      });
    }
    function settle(o) {
      const inb = shelf.filter((x) => x.inBasket), i = inb.indexOf(o);
      const p = o.inBasket ? { x: mat.x + (i - (inb.length - 1) / 2) * Math.min(104, (mat.w - 60) / Math.max(1, inb.length)), y: mat.y - 18, k: 0.82 } : { x: o.home.x, y: o.home.y, k: 1 };
      o.node.to({ x: p.x, y: p.y, sx: p.k, sy: p.k }, { dur: 0.26, ease: 'out' });
    }
    function toggle(o) {
      if (!R || R.over) return settle(o);
      if (o.inBasket) { o.inBasket = false; R.left += o.price; till.pop = 0.6; K.sfx.tap(); }
      else if (o.price > R.left) {
        R.misses++; K.sfx.whoops(); till.shake = 0.5; ctx.say(T.much);
        if (R.misses >= 2) for (const x of shelf) x.pulse = x.price <= R.left;
        o.busy = true; o.node.to({ x: mat.x, y: mat.y - 40 }, { dur: 0.16, ease: 'out' }).then(() => o.node.to({ rot: 0.25 }, { dur: 0.08 })).then(() => o.node.to({ rot: 0 }, { dur: 0.1 })).then(() => { o.busy = false; settle(o); });
        return;
      } else { o.inBasket = true; R.left -= o.price; till.pop = 1; K.sfx.step(shelf.filter((x) => x.inBasket).length - 1); }
      if (R.misses >= 2) for (const x of shelf) x.pulse = x.price <= R.left;
      shelf.forEach(settle);
      if (R.left === 0) { const r = R; ctx.after(700, () => { if (R === r && !r.over && r.left === 0) finishBudget(); }); }
    }
    function ring() {
      if (!R || R.kind !== 'budget' || R.over) return;
      K.sfx.note(1319, 0.5); K.sfx.note(1760, 0.7);
      const got = shelf.filter((x) => x.inBasket), can = shelf.filter((x) => !x.inBasket && x.price <= R.left);
      if (!got.length) { ctx.say(T.what); for (const x of shelf) x.pulse = x.price <= R.left; return; }
      if (can.length && !R.warned) { R.warned = true; ctx.say(T.more); for (const x of shelf) x.pulse = x.price <= R.left; return; }
      finishBudget();
    }
    async function finishBudget() {
      const r = R; r.over = true; const all = r.left === 0;
      for (const x of shelf) x.pulse = false;
      K.sfx.ding(); K.sfx.noise(0.12, { freq: 3200, vol: 0.12 }); fr.happy = 1.6;
      shelf.filter((x) => x.inBasket).forEach((o, i) => { ctx.after(i * 130, () => { ctx.fx.burst(o.node.x, o.node.y, { n: 7 }); K.sfx.step(i); o.node.to({ y: o.node.y - 46 }, { dur: 0.18, ease: 'out' }).then(() => o.node.to({ y: mat.y - 18 }, { dur: 0.3, ease: 'back' })); }); });
      await Promise.all([ctx.say(all ? T.spent : T.thanks), ctx.wait(1700)]);
      await award(all, r);
      for (const o of shelf.splice(0)) o.node.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' }).then(() => o.node.remove());
      bell.visible = false;
      await next();
    }

    /* ---------- rounds ---------- */
    const rint = K.randInt;
    function makeRound() {
      const S = { total: 0, paid: [], misses: 0, hintV: 0, items: [] };
      const good = () => K.pick(GOODS.filter((x) => !S.items.some((it) => it.good === x) && x.name !== lastGood));
      const kinds = ['pay', 'two', 'change', 'budget'];
      S.kind = L < 3 ? 'pay' : kinds[roundNo % 4];
      if (S.kind === 'pay') {
        const p = L === 1 ? rint(1, Math.min(5, 3 + skill)) : L === 2 ? [rint(3, 6), rint(4, 8), rint(6, 10), rint(7, 12)][Math.min(3, skill)] : skill === 0 ? rint(3, 10) * 5 : skill === 1 ? rint(12, 60) : rint(21, 99);
        S.items.push({ good: good(), price: p }); S.target = p;
        S.prompt = S.items[0].good.say + ' ' + (p <= PRICE_SAY ? T.cost(p) : T.pay);
        if (L === 2 && roundNo > 0 && roundNo % 2 === 1) S.prompt += ' ' + T.few;
        S.show = `${cap(S.items[0].good.name)}: ${p} ${p === 1 ? 'coin' : 'coins'}`;
      } else if (S.kind === 'two') {
        let a, b;
        if (skill === 0) { a = rint(1, 6) * 5; b = rint(1, 4) * 5; } else if (skill === 1) { a = rint(11, 40); b = rint(1, 5) * 5; } else { a = rint(12, 58); b = rint(11, 100 - a - 1); }
        S.items.push({ good: good(), price: a }); S.items.push({ good: good(), price: b }); S.target = a + b;
        S.prompt = `${T.two} ${T.add}`; S.show = `${a} + ${b}`;
      } else if (S.kind === 'change') {
        let coin, p;
        if (skill === 0) { coin = K.pick([10, 20]); p = coin === 10 ? rint(3, 8) : rint(1, 3) * 5; } else if (skill === 1) { coin = K.pick([20, 50]); p = coin === 20 ? rint(6, 17) : rint(2, 9) * 5; } else { coin = 50; p = rint(11, 47); }
        S.items.push({ good: good(), price: p }); S.paidCoin = coin; S.target = coin - p;
        S.prompt = `${T.keeper} ${T.change}`; S.show = `${coin} − ${p}`;
      } else {
        // some of the goods add up to exactly twenty; the rest are there to choose between
        const n = land ? 5 : 4; let a, b, set, guard = 0;
        do { a = rint(3, 9); b = rint(2, 9); set = new Set([a, b, BUDGET - a - b]); } while (set.size < 3);
        while (set.size < n && guard++ < 60) set.add(rint(2, 16));
        const goods = K.sample(GOODS, n);
        S.shop = K.shuffle([...set]).map((p, i) => ({ good: goods[i], price: p })); S.left = BUDGET; S.target = 0;
        S.prompt = `${T.have} ${T.what} ${T.bell}`; S.show = `${BUDGET} coins to spend`;
      }
      S.key = S.kind + S.target + (S.items[0] ? S.items[0].good.name : '');
      return S;
    }
    let lastGood = '';
    async function newRound() {
      let S, guard = 0;
      do { S = makeRound(); } while ((S.key === lastKey || (R && S.target && S.target === R.target)) && guard++ < 30);
      lastKey = S.key; lastGood = S.items[0] ? S.items[0].good.name : '';
      const first = roundNo === 0; roundNo++;
      R = S; fr.hold = null;
      if (!friendName || S.kind !== 'budget' || first) friendName = K.pick(Object.keys(FRIENDS).filter((f) => f !== friendName));
      friend.x = -fw; friend.to({ x: fx }, { dur: 0.55, ease: 'back' }); K.sfx.whoosh();
      await ctx.wait(450);
      bubble.visible = true; bubble.pop = 1; K.sfx.pop();
      if (S.kind === 'budget') { buildShelf(S.shop); bell.visible = true; bell._bsx = bell._bsy = bell.bsc; bell.sx = bell.sy = 0.2; bell.to({ sx: bell.bsc, sy: bell.bsc }, { dur: 0.35, ease: 'back' }); }
      for (const src of sources) { src.used = false; src.node.visible = S.kind !== 'budget'; }
      ctx.prompt(S.prompt + (first && S.kind !== 'budget' ? ' ' + T.drag : ''), { show: S.show });
    }
    async function award(bonus, r) {
      const sd = { pop: 1, bonus }; stars.push(sd); won++; K.sfx.ding();
      ctx.fx.burst(starRow.x + (stars.length - 1 - (ROUNDS - 1) / 2) * 62, starRow.y, { n: bonus ? 16 : 8 });
      if (bonus) K.sfx.sparkle();
      skill = r.misses === 0 ? Math.min(4, skill + 1) : r.misses >= 2 ? Math.max(0, skill - 1) : skill;
      await ctx.wait(600);
    }
    async function next() {
      bubble.visible = false;
      await friend.to({ x: -fw * 1.2 }, { dur: 0.4, ease: 'inOut' });
      if (won >= ROUNDS) { await ctx.celebrate({ ms: 3400 }); won = 0; stars.length = 0; }
      await ctx.wait(250);
      newRound();
    }
    async function finish() {
      const r = R; r.over = true; r.hintV = 0;
      const fewest = L >= 2 && r.paid.length === minCoins(r.target);
      await ctx.wait(500);
      r.done = true; bubble.pop = 1;
      K.sfx.ding(); K.sfx.noise(0.12, { freq: 3200, vol: 0.14 }); K.sfx.tone(1900, 0.2, { type: 'triangle', vol: 0.12, delay: 0.1 }); till.pop = 1;
      // the coins go into the till (or, as change, to the friend)
      const dest = r.kind === 'change' ? { x: fx, y: fy + fw * 0.55 } : drawer;
      r.paid.forEach((c, i) => { c.node.onTap = null; c.node.label = null; c.node.z = 61; c.node.to({ x: dest.x, y: dest.y, sx: 0.3, sy: 0.3, alpha: 0.2 }, { dur: 0.4, delay: i * 0.05, ease: 'inOut' }).then(() => c.node.remove()); });
      st.root._sorted = false;
      // the goods fly to the friend
      const spots = itemSpots();
      r.items.forEach((it, i) => {
        it.gone = true; const sp = spots[i];
        const n = st.add({ z: 62, x: bub.x + sp.x, y: bub.y + sp.y }); n.draw = (g) => drawGood(g, it.good, sp.size);
        const k = fw * 0.4 / sp.size;
        n.to({ x: fx + (i - (r.items.length - 1) / 2) * fw * 0.42, y: fy + fw * 0.56, sx: k, sy: k }, { dur: 0.5, delay: 0.15 + i * 0.12, ease: 'inOut' }).then(() => { n.remove(); fr.hold = (fr.hold || []).concat(it.good); K.sfx.pop(); });
      });
      await ctx.wait(750);
      fr.happy = 1.6; ctx.fx.burst(fx, fy, { n: 12 }); K.sfx.sparkle();
      await Promise.all([ctx.say(T.thanks), ctx.wait(r.kind === 'pay' ? 1300 : 2200)]);
      await award(fewest, r);
      if (fewest) await Promise.all([ctx.say(T.fewest), ctx.wait(1100)]);
      else if (L >= 2 && !toldBigger && r.paid.length > minCoins(r.target) + 1) { toldBigger = true; await Promise.all([ctx.say(T.bigger), ctx.wait(1500)]); }
      await next();
    }

    buildSources();
    K._shop = {                                                  // for browser tests
      get R() { return R; }, sources, shelf, mat, tray, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      get stars() { return stars; }, minCoins, setKind(k) { roundNo = ['pay', 'two', 'change', 'budget'].indexOf(k); },
    };
    ctx.onExit(() => { K._shop = null; });
    ctx.after(350, newRound);
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#CFE6E8'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#F6E7CC'; g.fillRect(24 * u, 60 * u, 252 * u, 150 * u);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#FBF1DC' : '#E8664A'; g.beginPath(); g.moveTo(i * 50 * u, 0); g.lineTo((i + 1) * 50 * u + 1, 0); g.lineTo((i + 1) * 50 * u + 1, 62 * u); g.arc((i + 0.5) * 50 * u, 62 * u, 25 * u, 0, Math.PI); g.closePath(); g.fill(); }
    g.fillStyle = '#B67E52'; g.fillRect(0, 214 * u, w, 86 * u);
    g.fillStyle = '#E6BC8A'; g.fillRect(0, 192 * u, w, 40 * u);
    g.save(); g.translate(96 * u, 150 * u); drawGood(g, GOODS[0], 120 * u); g.restore();
    g.save(); g.translate(176 * u, 118 * u); g.rotate(-0.07); g.fillStyle = '#FFF6DE'; g.beginPath(); g.moveTo(-34 * u, 0); g.lineTo(-16 * u, -26 * u); g.lineTo(46 * u, -26 * u); g.lineTo(46 * u, 26 * u); g.lineTo(-16 * u, 26 * u); g.closePath(); g.fill();
    g.fillStyle = '#2E2A3B'; g.font = `800 ${40 * u}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('3', 14 * u, 2 * u); g.restore();
    [[150, 244, 5, 36], [214, 232, 2, 32], [248, 262, 1, 30]].forEach(([x, y, v, r]) => { g.save(); g.translate(x * u, y * u); g.fillStyle = 'rgba(46,40,70,.2)'; g.beginPath(); g.arc(2 * u, 5 * u, r * u, 0, 7); g.fill(); drawCoin(g, 0, v, r * u); g.restore(); });
  }

  K.game({ id: 'shop', title: "Pip's Shop", voice: 'shop', group: 'arcade', age: 5, subject: 'math', order: 43, icon, start, lines, resize: () => K.go('shop') });
})();
