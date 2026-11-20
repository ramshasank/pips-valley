/* Pip's Playhouse — the art of Pip's Town: the ground plan, shops and houses, the delivery van, the
   things it carries, the townsfolk and the places animals hide.
   Painters draw in units with (0,0) at the thing's base centre (y up is negative) unless noted.
   g is already scaled; s is device pixels per unit (for shadows and grain). */
(function () {
  'use strict';
  const A = K.art, C = A.C;
  // (this file loads before art/valley.js, so reach its painters when they are called)
  const V = {}; for (const k of ['hill', 'flower', 'tuft']) V[k] = (...a) => A.valley[k](...a);
  const T = (A.town = {});
  const piece = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);
  const bx = (x, y, w, h) => ({ x, y, w, h });
  const dot = (g, x, y, r, col) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.fill(); };
  function eye(g, x, y, rx, ry, blink) {
    const k = Math.max(0.12, 1 - (blink || 0));
    g.beginPath(); g.ellipse(x, y, rx, ry * k, 0, 0, 7); g.fillStyle = C.ink; g.fill();
    if (k > 0.5) dot(g, x + rx * 0.32, y - ry * 0.38, rx * 0.38, '#fff');
  }
  const cheek = (g, x, y, r) => { g.beginPath(); g.ellipse(x, y, r, r * 0.62, 0, 0, 7); g.fillStyle = A.alpha(C.tomato, 0.34); g.fill(); };
  const smile = (g, x, y, w) => A.line(g, C.ink, 2.6, (h) => { h.moveTo(x - w, y); h.quadraticCurveTo(x, y + w * 0.9, x + w, y); });

  /* ---------------- the street: sky, rolling hills, and one long road seen from the side ---------------- */
  const ROAD = '#B9B3BD', KERB = '#F1E8D6', PAVE = '#E6D9BF', MEADOW = '#A5CB8E', VERGE = '#93BF80';
  T.sky = function (g, s, W, H, hor) {
    const sky = g.createLinearGradient(0, 0, 0, hor); sky.addColorStop(0, '#9CCBDA'); sky.addColorStop(1, '#E9F3E6');
    g.fillStyle = sky; g.fillRect(0, 0, W, hor + 8);
    dot(g, W * 0.8, hor * 0.42, 40, '#FBE7A8'); dot(g, W * 0.8, hor * 0.42, 58, 'rgba(251,231,168,.3)');
  };
  /** A band of hills that repeats every tw units, so it can scroll for ever. Top of the box is y = -amp. */
  T.hills = function (g, s, tw, amp, depth, col, seed) {
    const r = A.rng(seed), p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28;
    const y = (x) => { const a = (x / tw) * 6.2832; return -amp * (0.5 + 0.28 * Math.sin(a + p1) + 0.14 * Math.sin(a * 2 + p2) + 0.08 * Math.sin(a * 5 + p3)); };
    const trace = (h) => { h.moveTo(-20, depth); for (let x = -20; x <= tw + 20; x += 14) h.lineTo(x, y(x)); h.lineTo(tw + 20, depth); h.closePath(); };
    g.save(); g.beginPath(); trace(g); g.shadowColor = 'rgba(46,40,70,.16)'; g.shadowBlur = 14 * s; g.shadowOffsetY = -2 * s; g.fillStyle = col; g.fill(); g.restore();
    g.beginPath(); trace(g); A.paper(g, s, col, { shadow: 0, light: 0.05, box: bx(0, -amp, 0, amp + depth), grain: 0.18 });
  };
  /** The railway that runs along the nearer hills: sleepers and two rails, repeating every tw. */
  T.rails = function (g, s, tw) {
    A.line(g, 'rgba(90,70,60,.45)', 5, (h) => { for (let x = 11; x < tw; x += 22) { h.moveTo(x, -2); h.lineTo(x, 8); } }, 'butt');
    A.line(g, '#8A8494', 3, (h) => { h.moveTo(-4, 0); h.lineTo(tw + 4, 0); h.moveTo(-4, 6); h.lineTo(tw + 4, 6); }, 'butt');
  };
  /** One long strip of ground, WW units round, drawn so that its two ends meet.
      o: {WW, H, hor (top of the meadow), py (back of the pavement), r (where wheels touch), pond:{x,y,rx,ry}, zebra:[x], keep:[[x,halfWidth]] } */
  T.street = function (g, s, o) {
    const { WW, H, hor, py, r } = o, rnd = A.rng(77);
    const rep = (x, fn) => { fn(x); if (x < 260) fn(x + WW); if (x > WW - 260) fn(x - WW); };
    const X0 = -60, XW = WW + 120;
    // meadow behind the street
    g.beginPath(); g.rect(X0, hor - 6, XW, py - hor + 10); A.paper(g, s, MEADOW, { shadow: 0, light: 0, grain: 0.2 });
    for (let i = 0; i < 30; i++) { const x = rnd() * WW, y = hor + 30 + rnd() * (py - hor - 50), rx = 70 + rnd() * 120, ry = 16 + rnd() * 26; rep(x, (q) => { g.beginPath(); A.blob(g, q, y, rx, ry, 0.12, i + 3); g.fillStyle = i % 2 ? 'rgba(255,255,220,.14)' : 'rgba(70,130,90,.1)'; g.fill(); }); }
    // pond
    const p = o.pond;
    piece(g, s, '#E9DDBE', (h) => A.blob(h, p.x, p.y, p.rx + 14, p.ry + 9, 0.04, 5, 14), { shadow: 0, light: 0 });
    g.save(); g.beginPath(); A.blob(g, p.x, p.y, p.rx, p.ry, 0.035, 6, 14); g.shadowColor = 'rgba(40,60,90,.35)'; g.shadowBlur = 8 * s; g.fillStyle = '#8CC3D6'; g.fill(); g.restore();
    g.save(); g.beginPath(); A.blob(g, p.x, p.y, p.rx, p.ry, 0.035, 6, 14); g.clip();
    g.beginPath(); g.ellipse(p.x - p.rx * 0.25, p.y - p.ry * 0.5, p.rx * 0.8, p.ry * 0.6, -0.05, 0, 7); g.fillStyle = 'rgba(255,255,255,.2)'; g.fill();
    A.line(g, 'rgba(255,255,255,.55)', 3, (h) => { for (const [dx, dy, w] of [[-90, 12, 34], [50, 18, 26], [100, -12, 30], [-30, -10, 22]]) { h.moveTo(p.x + dx - w, p.y + dy); h.quadraticCurveTo(p.x + dx, p.y + dy - 5, p.x + dx + w, p.y + dy); } });
    g.restore();
    for (const [dx, dy] of [[-p.rx - 4, 10], [-p.rx + 18, 24], [p.rx - 2, -8]]) { for (let i = 0; i < 3; i++) A.line(g, '#5E9A6B', 5, (h) => { h.moveTo(p.x + dx + i * 9, p.y + dy); h.quadraticCurveTo(p.x + dx + i * 9 - 4, p.y + dy - 24, p.x + dx + i * 11 - 8, p.y + dy - 40 - i * 6); }); }
    // flowers and tufts on the meadow, clear of the things that stand there
    const clear = (x) => (o.keep || []).every(([kx, hw]) => { const d = Math.abs(((x - kx) % WW + WW * 1.5) % WW - WW / 2); return d > hw; });
    const cols = [C.tomato, C.marigold, '#FBF8F1', '#EE8FB0', '#8E79C0'];
    for (let i = 0; i < 90; i++) { const x = rnd() * WW, y = hor + 40 + rnd() * (py - hor - 60); if (!clear(x) || ((x - p.x) / (p.rx + 40)) ** 2 + ((y - p.y) / (p.ry + 40)) ** 2 < 1) continue; rep(x, (q) => { if (i % 3) V.tuft(g, s, q, y, 10 + (i % 5) * 2, i, i % 2 ? '#7FB57A' : '#8FBF80'); else V.flower(g, s, q, y, 8 + (i % 4) * 1.5, cols[i % cols.length]); }); }
    // pavement, with a soft shadow on the meadow behind it
    g.save(); g.shadowColor = 'rgba(46,40,70,.2)'; g.shadowBlur = 8 * s; g.shadowOffsetY = -2 * s; g.fillStyle = PAVE; g.fillRect(X0, py - 8, XW, r - 40 - py + 8); g.restore();
    g.beginPath(); g.rect(X0, py - 8, XW, r - 40 - py + 8); A.paper(g, s, PAVE, { shadow: 0, light: 0, grain: 0.22 });
    A.line(g, 'rgba(120,96,70,.2)', 2.5, (h) => { for (let x = 0; x <= WW; x += 100) { h.moveTo(x + 12, py - 6); h.lineTo(x - 8, r - 42); } }, 'butt');
    // kerb and road
    g.fillStyle = KERB; g.fillRect(X0, r - 44, XW, 12);
    g.fillStyle = 'rgba(46,40,70,.16)'; g.fillRect(X0, r - 33, XW, 5);
    g.beginPath(); g.rect(X0, r - 30, XW, 104); A.paper(g, s, ROAD, { shadow: 0, light: 0, grain: 0.26 });
    g.fillStyle = 'rgba(251,246,236,.85)'; for (let x = 0; x < WW; x += 100) { g.beginPath(); A.rect(g, x + 20, r + 22, 56, 7, 3, x, 0.4); g.fill(); }
    for (const zx of o.zebra || []) { for (let i = -3; i <= 3; i++) { g.beginPath(); A.cut(g, [[zx + i * 26 - 3, r - 24], [zx + i * 26 + 13, r - 24], [zx + i * 26 + 3, r + 66], [zx + i * 26 - 13, r + 66]], 2, 0.3, i + 9); g.fillStyle = '#FBF6EC'; g.fill(); } }
    g.fillStyle = KERB; g.fillRect(X0, r + 72, XW, 10);
    // the near verge
    g.save(); g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = 8 * s; g.shadowOffsetY = -3 * s; g.fillStyle = VERGE; g.fillRect(X0, r + 80, XW, H - r); g.restore();
    g.beginPath(); g.rect(X0, r + 80, XW, H - r); A.paper(g, s, VERGE, { shadow: 0, light: 0, grain: 0.22 });
    for (let i = 0; i < 22; i++) { const x = rnd() * WW, y = r + 120 + rnd() * Math.max(10, H - r - 150), rx = 80 + rnd() * 130, ry = 18 + rnd() * 30; rep(x, (q) => { g.beginPath(); A.blob(g, q, y, rx, ry, 0.12, i + 40); g.fillStyle = i % 2 ? 'rgba(255,255,220,.12)' : 'rgba(60,120,80,.1)'; g.fill(); }); }
    for (let i = 0; i < 70; i++) { const x = rnd() * WW, y = r + 112 + rnd() * Math.max(10, H - r - 130); rep(x, (q) => { if (i % 3) V.tuft(g, s, q, y, 12 + (i % 5) * 2.5, i + 200, i % 2 ? '#74AC72' : '#83B878'); else V.flower(g, s, q, y, 9 + (i % 4) * 2, cols[i % cols.length]); }); }
  };
  /** A hump across the road (seen from the side): yellow and white, top at about y = -12. */
  T.bump = function (g, s) {
    piece(g, s, '#F2C24B', (p) => { p.moveTo(-46, 0); p.bezierCurveTo(-30, -16, 30, -16, 46, 0); p.closePath(); }, { shadow: 0.5, light: 0.08, box: bx(-46, -14, 92, 14) });
    g.save(); g.beginPath(); g.moveTo(-46, 0); g.bezierCurveTo(-30, -16, 30, -16, 46, 0); g.closePath(); g.clip(); g.fillStyle = '#FBF6EC'; for (const x of [-30, -6, 18]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, -16); g.lineTo(x + 18, -16); g.lineTo(x + 10, 0); g.fill(); } g.restore();
  };
  /** The pointing paper hand (shared); the fingertip is at (0,0) and the hand hangs down to the right. */
  T.hand = (g, s) => A.hand(g, s, 1);

  /* ---------------- things the van carries ---------------- */
  /** Centred on (0,0), about 80 units across. */
  T.item = function (g, s, name) {
    if (name === 'cake') {
      piece(g, s, '#FBF8F1', (h) => h.ellipse(0, 26, 40, 9, 0, 0, 7), { shadow: 0.5, light: 0 });
      piece(g, s, '#F6D9A8', (h) => A.rect(h, -30, -6, 60, 32, 8, 2, 0.6), { shadow: 0.4, box: bx(-30, -6, 60, 32) });
      piece(g, s, '#F29BB4', (h) => { h.moveTo(-32, -12); h.quadraticCurveTo(0, -24, 32, -12); h.lineTo(32, 0); for (let i = 3; i >= -3; i--) h.quadraticCurveTo(i * 9 + 5, 14 - (i & 1) * 6, i * 9 - 4, 2); h.closePath(); }, { shadow: 0.3, box: bx(-32, -22, 64, 30) });
      A.line(g, '#FBF8F1', 3, (h) => { h.moveTo(-22, 14); h.lineTo(22, 14); });
      piece(g, s, '#E2483F', (h) => h.arc(0, -24, 9, 0, 7), { shadow: 0.3, box: bx(-9, -33, 18, 18), light: 0.12 });
      A.line(g, '#6B4430', 2.4, (h) => { h.moveTo(1, -32); h.quadraticCurveTo(4, -40, 10, -41); });
    } else if (name === 'flowers') {
      for (const [x, y, c] of [[-18, -14, '#EE8FB0'], [16, -18, C.marigold], [0, -30, C.tomato]]) {
        A.line(g, '#5E9A6B', 4, (h) => { h.moveTo(0, 16); h.lineTo(x, y); });
        g.save(); g.translate(x, y); g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; g.moveTo(0, 0); g.ellipse(Math.cos(a) * 9, Math.sin(a) * 9, 8, 6, a, 0, 7); } A.paper(g, s, c, { shadow: 0.3, light: 0, grain: 0.1 }); dot(g, 0, 0, 5.5, '#FBE7A8'); g.restore();
      }
      piece(g, s, '#F6EFE3', (h) => A.cut(h, [[-24, 2], [24, 2], [8, 38], [-8, 38]], 5, 0.6, 3), { shadow: 0.5, box: bx(-24, 2, 48, 36) });
      A.line(g, '#EE8FB0', 5, (h) => { h.moveTo(-13, 24); h.lineTo(13, 24); });
    } else if (name === 'letter') {
      g.save(); g.rotate(-0.1);
      piece(g, s, '#FBF6EC', (h) => A.rect(h, -36, -24, 72, 48, 6, 4, 0.8), { shadow: 0.5, box: bx(-36, -24, 72, 48) });
      A.line(g, 'rgba(46,42,59,.3)', 2.5, (h) => { h.moveTo(-34, -22); h.lineTo(0, 4); h.lineTo(34, -22); });
      g.translate(0, 5); piece(g, s, C.tomato, (h) => { h.moveTo(0, 9); h.bezierCurveTo(-16, -3, -8, -14, 0, -5); h.bezierCurveTo(8, -14, 16, -3, 0, 9); }, { shadow: 0.2, light: 0 });
      g.restore();
    } else if (name === 'balloon') {
      A.line(g, 'rgba(46,42,59,.55)', 2, (h) => { h.moveTo(0, 10); h.quadraticCurveTo(8, 24, -2, 38); });
      piece(g, s, '#E2483F', (h) => h.ellipse(0, -12, 24, 29, 0, 0, 7), { shadow: 0.5, box: bx(-24, -41, 48, 58), light: 0.12 });
      piece(g, s, '#C93C34', (h) => A.cut(h, [[-5, 20], [5, 20], [0, 13]], 2, 0, 2), { shadow: 0 });
      g.beginPath(); g.ellipse(-9, -24, 5, 9, 0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,.45)'; g.fill();
    } else if (name === 'apples') {
      for (const [x, y, c] of [[-14, -8, '#D9463C'], [13, -10, '#E35B45'], [0, -22, '#C93C34']]) {
        piece(g, s, c, (h) => A.blob(h, x, y, 15, 14, 0.04, x + 30, 8), { shadow: 0.3, box: bx(x - 15, y - 14, 30, 28), light: 0.1 });
        A.line(g, '#6B4430', 2.4, (h) => { h.moveTo(x, y - 12); h.lineTo(x + 3, y - 19); });
        g.beginPath(); g.ellipse(x + 9, y - 18, 6, 3, -0.5, 0, 7); g.fillStyle = '#6FA65F'; g.fill();
      }
      piece(g, s, '#C99A5E', (h) => A.cut(h, [[-32, -2], [32, -2], [24, 34], [-24, 34]], 7, 0.6, 5), { shadow: 0.5, box: bx(-32, -2, 64, 36) });
      A.line(g, 'rgba(107,68,48,.45)', 2.5, (h) => { for (const y of [8, 19, 29]) { h.moveTo(-28, y); h.lineTo(28, y); } for (const x of [-15, 0, 15]) { h.moveTo(x, 0); h.lineTo(x * 0.8, 33); } });
    }
  };
  /** A round paper badge with an item on it (shop signs, the pointers at the screen edge). */
  T.badge = function (g, s, r, item, col) {
    piece(g, s, col || '#FBF6EC', (h) => h.arc(0, 0, r, 0, 7), { shadow: 0.9, box: bx(-r, -r, r * 2, r * 2), light: 0.04 });
    if (item) { g.save(); const k = r / 54; g.scale(k, k); T.item(g, s * k, item); g.restore(); }
  };

  /* ---------------- shops ---------------- */
  const SHOP = {
    bakery: { wall: '#F8E6CC', roof: '#B5654F', aw: '#E8664A', door: '#9A5B43' },
    flowers: { wall: '#E3EFD9', roof: '#5F8F72', aw: '#EE8FB0', door: '#4F8752' },
    post: { wall: '#DDE6F2', roof: '#4D6A96', aw: '#5B8FC7', door: '#C9553F' },
  };
  const WIN = [-90, -100, 100, 62]; // the serving window of a shop
  function awning(g, s, x, y, w, h, col, n) {
    const sw = w / n;
    const shape = (h2, i0, i1) => { h2.moveTo(x + i0 * sw, y); h2.lineTo(x + i1 * sw, y); for (let i = i1; i > i0; i--) { h2.lineTo(x + i * sw, y + h - sw / 2); h2.arc(x + (i - 0.5) * sw, y + h - sw / 2, sw / 2, 0, Math.PI); } h2.closePath(); };
    piece(g, s, col, (h2) => shape(h2, 0, n), { shadow: 1, light: 0 });
    for (let i = 0; i < n; i++) piece(g, s, i % 2 ? '#FBF6EC' : col, (h2) => shape(h2, i, i + 1), { shadow: 0, box: bx(x, y, w, h), light: 0.04 });
  }
  /** kind: bakery | flowers | post. 210 wide, about 215 tall. The keeper is drawn in the window after this. */
  T.shop = function (g, s, kind, item) {
    const o = SHOP[kind], w = 210, h = 128;
    piece(g, s, o.roof, (p) => A.cut(p, [[-w / 2 - 12, -h + 4], [-w / 2 + 24, -h - 56], [w / 2 - 24, -h - 56], [w / 2 + 12, -h + 4]], 9, 1, 3), { box: bx(-w / 2, -h - 56, w, 60) });
    A.line(g, A.alpha(A.shade(o.roof, -0.12), 0.6), 2.5, (p) => { for (const y of [-h - 38, -h - 20]) { p.moveTo(-w / 2 + 16 - (y + h + 56) * 0.5, y); p.lineTo(w / 2 - 16 + (y + h + 56) * 0.5, y); } });
    piece(g, s, o.wall, (p) => A.rect(p, -w / 2, -h, w, h, 6, 5, 1.2), { box: bx(-w / 2, -h, w, h) });
    piece(g, s, A.shade(o.wall, -0.07), (p) => p.rect(-w / 2 + 2, -16, w - 4, 16), { shadow: 0, light: 0 });
    // serving window: warm inside, pale frame
    g.beginPath(); A.rect(g, WIN[0] - 5, WIN[1] - 5, WIN[2] + 10, WIN[3] + 10, 10, 2, 0.5); g.fillStyle = '#FBF6EC'; g.fill();
    const wg = g.createLinearGradient(0, WIN[1], 0, WIN[1] + WIN[3]); wg.addColorStop(0, '#F3C98A'); wg.addColorStop(1, '#FBE3B4');
    g.beginPath(); A.rect(g, WIN[0], WIN[1], WIN[2], WIN[3], 7, 2, 0.3); g.fillStyle = wg; g.fill();
    // door
    piece(g, s, o.door, (p) => A.cut(p, [[34, 0], [34, -84], [86, -84], [86, 0]], [3, 22, 22, 3], 0.6, 6), { shadow: 0.5, box: bx(34, -84, 52, 84) });
    dot(g, 60, -58, 10, '#FBE3B4'); dot(g, 78, -36, 4, '#F2D060');
    awning(g, s, -w / 2 - 8, -h - 4, w + 16, 34, o.aw, 9);
    // the sign
    g.save(); g.translate(0, -h - 62); T.badge(g, s, 42, item); g.restore();
  };
  /** The sill in front of the keeper, and whatever stands outside the shop. */
  T.shopFront = function (g, s, kind) {
    const o = SHOP[kind];
    piece(g, s, A.shade(o.aw, -0.02), (p) => A.rect(p, WIN[0] - 10, WIN[1] + WIN[3] - 4, WIN[2] + 20, 13, 5, 3, 0.4), { shadow: 0.6, light: 0.05, box: bx(WIN[0] - 10, WIN[1] + WIN[3] - 4, WIN[2] + 20, 13) });
    if (kind === 'bakery') { for (const [x, c] of [[-74, '#E9B872'], [-50, '#F6D9A8'], [-26, '#E9B872']]) piece(g, s, c, (p) => p.ellipse(x, -46, 12, 8, 0, 0, 7), { shadow: 0.3, light: 0.08, box: bx(x - 12, -54, 24, 16) }); }
    if (kind === 'flowers') { for (const [x, c] of [[-84, '#EE8FB0'], [-62, C.marigold], [-40, C.tomato], [-18, '#FBF8F1'], [4, '#8E79C0']]) { A.line(g, '#5E9A6B', 3.5, (p) => { p.moveTo(x, -6); p.lineTo(x, -22); }); V.flower(g, s, x, -6, 13, c); } piece(g, s, '#C08A5A', (p) => A.rect(p, -98, -14, 116, 14, 4, 2, 0.5), { shadow: 0.5 }); }
    if (kind === 'post') { piece(g, s, '#FBF6EC', (p) => A.rect(p, -72, -52, 30, 20, 3, 2, 0.4), { shadow: 0.3 }); A.line(g, 'rgba(46,42,59,.3)', 1.8, (p) => { p.moveTo(-71, -51); p.lineTo(-57, -40); p.lineTo(-43, -51); }); }
  };
  T.KEEPER = { shop: { x: -40, y: -62, k: 0.55 }, stall: { x: 0, y: -98, k: 0.62 }, cart: { x: 58, y: -70, k: 0.58 } };

  /** Market stall, in two layers with the keeper between them. */
  T.stallBack = function (g, s) {
    for (const x of [-96, 96]) piece(g, s, '#C08A5A', (p) => A.rect(p, x - 6, -178, 12, 178, 4, x, 0.5), { shadow: 0.5 });
    piece(g, s, '#E8D9BD', (p) => A.rect(p, -92, -150, 184, 110, 4, 3, 0.8), { shadow: 0.3, light: 0.03, box: bx(-92, -150, 184, 110) });
  };
  T.stallFront = function (g, s) {
    piece(g, s, '#B9824F', (p) => A.rect(p, -108, -62, 216, 62, 7, 4, 1), { box: bx(-108, -62, 216, 62) });
    A.line(g, 'rgba(90,60,40,.3)', 2.5, (p) => { for (const y of [-42, -22]) { p.moveTo(-104, y); p.lineTo(104, y); } });
    const crate = (x, col, seed) => { const r = A.rng(seed); for (let i = 0; i < 6; i++) { const cx = x - 20 + (i % 3) * 20 + (r() - 0.5) * 4, cy = -80 - Math.floor(i / 3) * 13; piece(g, s, A.shade(col, (r() - 0.5) * 0.08), (p) => p.arc(cx, cy, 12, 0, 7), { shadow: 0.3, light: 0.1, box: bx(cx - 12, cy - 12, 24, 24), grain: 0.1 }); } piece(g, s, '#D7AE78', (p) => A.cut(p, [[x - 36, -84], [x + 36, -84], [x + 32, -58], [x - 32, -58]], 4, 0.6, seed), { shadow: 0.5 }); A.line(g, 'rgba(107,68,48,.4)', 2, (p) => { p.moveTo(x - 33, -72); p.lineTo(x + 33, -72); }); };
    crate(-66, '#D9463C', 4); crate(66, '#F08A35', 6); crate(0, '#9CC25B', 8);
    awning(g, s, -116, -206, 232, 40, C.marigold, 8);
    g.save(); g.translate(0, -218); T.badge(g, s, 40, 'apples'); g.restore();
  };
  /** Balloon cart: strings and balloons behind, the cart in front. */
  T.BALLOONS = [[-46, -150, '#E2483F'], [-8, -176, C.marigold], [30, -154, '#5B8FC7'], [-28, -118, '#EE8FB0'], [10, -128, '#6FA65F']];
  T.cart = function (g, s) {
    piece(g, s, '#5B8FC7', (p) => A.rect(p, -84, -74, 112, 46, 10, 3, 1), { box: bx(-84, -74, 112, 46) });
    piece(g, s, '#FBF6EC', (p) => A.rect(p, -84, -62, 112, 10, 2, 5, 0.4), { shadow: 0, light: 0 });
    A.line(g, '#8A5A3C', 6, (p) => { p.moveTo(28, -62); p.lineTo(52, -74); });
    A.line(g, '#8A5A3C', 5, (p) => { p.moveTo(-14, -30); p.lineTo(-14, 0); });
    for (const x of [-56, 2]) { piece(g, s, C.ink, (p) => p.arc(x, -18, 20, 0, 7), { shadow: 0.5, light: 0 }); dot(g, x, -18, 9, '#F3DDB8'); dot(g, x, -18, 3, C.ink); }
    g.save(); g.translate(-28, -118); g.restore();
  };
  T.balloon = function (g, s, col) {
    piece(g, s, col, (p) => p.ellipse(0, 0, 24, 29, 0, 0, 7), { shadow: 0.5, box: bx(-24, -29, 48, 58), light: 0.12 });
    piece(g, s, A.shade(col, -0.08), (p) => A.cut(p, [[-5, 33], [5, 33], [0, 26]], 2, 0, 2), { shadow: 0 });
    g.beginPath(); g.ellipse(-9, -11, 5, 9, 0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
  };

  /* ---------------- houses ---------------- */
  const HOUSE = {
    bear: { wall: '#F3D9A6', roof: '#A2553F', door: '#2F8F8A' },
    bunny: { wall: '#F4D4D8', roof: '#7E5A86', door: '#6E4E7E' },
    fox: { wall: '#CFE3E6', roof: '#D9783E', door: '#3F6F8F' },
  };
  T.house = function (g, s, kind) {
    const o = HOUSE[kind], w = 184, h = 108;
    piece(g, s, A.shade(o.roof, -0.08), (p) => A.rect(p, 40, -h - 86, 26, 60, 4, 2, 0.6), { shadow: 0.5 });
    piece(g, s, o.wall, (p) => A.rect(p, -w / 2, -h, w, h, 6, 4, 1.2), { box: bx(-w / 2, -h, w, h) });
    piece(g, s, A.shade(o.wall, -0.07), (p) => p.rect(-w / 2 + 2, -14, w - 4, 14), { shadow: 0, light: 0 });
    piece(g, s, o.roof, (p) => A.cut(p, [[-w / 2 - 18, -h + 6], [0, -h - 84], [w / 2 + 18, -h + 6]], [10, 16, 10], 1, 5), { box: bx(-w / 2, -h - 84, w, 90) });
    A.line(g, A.alpha(A.shade(o.roof, -0.12), 0.55), 2.5, (p) => { for (const k of [0.36, 0.68]) { p.moveTo(-(w / 2 + 12) * k, -h - 84 + 90 * k); p.lineTo((w / 2 + 12) * k, -h - 84 + 90 * k); } });
    dot(g, 0, -h - 26, 15, '#FBF6EC'); dot(g, 0, -h - 26, 10, '#F7D27A');
    // door on the right, window on the left
    piece(g, s, o.door, (p) => A.cut(p, [[20, 0], [20, -78], [68, -78], [68, 0]], [3, 20, 20, 3], 0.6, 6), { shadow: 0.5, box: bx(20, -78, 48, 78) });
    dot(g, 60, -36, 4, '#F2D060');
    g.beginPath(); A.rect(g, -74, -86, 62, 52, 8, 2, 0.5); g.fillStyle = '#FBF6EC'; g.fill();
    g.beginPath(); A.rect(g, -69, -81, 52, 42, 5, 2, 0.3); g.fillStyle = '#F7D9A0'; g.fill();
    A.line(g, '#FBF6EC', 4, (p) => { p.moveTo(-43, -81); p.lineTo(-43, -39); p.moveTo(-69, -60); p.lineTo(-17, -60); });
    piece(g, s, '#C08A5A', (p) => A.rect(p, -78, -36, 70, 12, 4, 2, 0.4), { shadow: 0.4 });
    for (const [x, c] of [[-66, C.tomato], [-43, C.marigold], [-20, '#EE8FB0']]) V.flower(g, s, x, -36, 10, c);
  };
  /** A friend standing outside: small body with the kit's face on top. About 150 tall. */
  const COAT = { bear: ['#A8754F', '#5B8FC7'], bunny: ['#F1E7DA', '#EE8FB0'], fox: ['#E3793F', '#6FA65F'] };
  T.friend = function (g, s, kind, st) {
    st = st || {}; const [fur, coat] = COAT[kind]; const up = st.arms || 0;
    g.beginPath(); g.ellipse(0, 0, 36, 7, 0, 0, 7); g.fillStyle = 'rgba(40,34,60,.16)'; g.fill();
    for (const x of [-14, 14]) { g.beginPath(); g.ellipse(x, -4, 12, 7, 0, 0, 7); g.fillStyle = A.shade(fur, -0.1); g.fill(); }
    for (const side of [-1, 1]) { g.save(); g.translate(side * 24, -44); g.rotate(side * (0.45 - up * 2.4)); g.beginPath(); g.ellipse(0, 12, 8, 16, 0, 0, 7); g.fillStyle = A.shade(fur, -0.04); g.fill(); g.restore(); }
    piece(g, s, coat, (p) => A.cut(p, [[-22, -56], [22, -56], [28, -6], [-28, -6]], [12, 12, 10, 10], 0.5, 3), { shadow: 0, box: bx(-28, -56, 56, 50), light: 0.07 });
    dot(g, 0, -34, 3.2, '#FBF6EC'); dot(g, 0, -20, 3.2, '#FBF6EC');
    g.save(); g.translate(0, -84); g.scale(0.64, 0.64); A.face(g, s * 0.64, kind, { blink: st.blink }); g.restore();
  };

  /* ---------------- townsfolk who keep the shops ---------------- */
  /** A head about 80 across centred on (0,0). kind: pig | chick | mouse | hedgehog | dog. st: {blink} */
  T.keeper = function (g, s, kind, st) {
    st = st || {};
    const col = { pig: '#F4B6B8', chick: '#F7D667', mouse: '#B9B4C4', hedgehog: '#F0D9B5', dog: '#E6C08C' }[kind];
    const head = (rx, ry) => piece(g, s, col, (p) => A.blob(p, 0, 0, rx || 38, ry || 35, 0.02, 4, 10), { shadow: 0.6, box: bx(-38, -35, 76, 70), light: 0.07 });
    if (kind === 'pig') {
      for (const side of [-1, 1]) piece(g, s, '#EE9FA6', (p) => A.cut(p, [[side * 14, -26], [side * 36, -44], [side * 36, -14]], 7, 0, 2), { shadow: 0.3 });
      head();
      piece(g, s, '#EE9FA6', (p) => p.ellipse(0, 11, 15, 11, 0, 0, 7), { shadow: 0.2, light: 0 }); dot(g, -5, 11, 2.6, '#B8606C'); dot(g, 5, 11, 2.6, '#B8606C');
      eye(g, -15, -7, 5.5, 7, st.blink); eye(g, 15, -7, 5.5, 7, st.blink); cheek(g, -27, 8, 7); cheek(g, 27, 8, 7);
      // baker's hat
      piece(g, s, '#FBF8F1', (p) => { p.moveTo(-20, -30); p.bezierCurveTo(-40, -42, -26, -68, -8, -58); p.bezierCurveTo(0, -72, 20, -70, 18, -56); p.bezierCurveTo(36, -60, 34, -36, 20, -30); p.closePath(); }, { shadow: 0.4, box: bx(-34, -70, 68, 40), light: 0.03 });
      piece(g, s, '#EFE9DD', (p) => A.rect(p, -22, -36, 44, 10, 4, 2, 0.3), { shadow: 0 });
    } else if (kind === 'chick') {
      for (const [x, a] of [[-6, -0.4], [0, 0], [6, 0.4]]) { g.save(); g.translate(x, -32); g.rotate(a); g.beginPath(); g.ellipse(0, -8, 4, 10, 0, 0, 7); g.fillStyle = '#F2B33D'; g.fill(); g.restore(); }
      head(36, 35);
      eye(g, -15, -6, 5.5, 7, st.blink); eye(g, 15, -6, 5.5, 7, st.blink); cheek(g, -26, 8, 7); cheek(g, 26, 8, 7);
      piece(g, s, '#F08A35', (p) => A.cut(p, [[-9, 4], [9, 4], [0, 16]], 3, 0, 2), { shadow: 0.2, light: 0 });
      g.save(); g.translate(-26, -26); V.flower(g, s, 0, 0, 12, '#EE8FB0'); g.restore();
    } else if (kind === 'mouse') {
      for (const side of [-1, 1]) { piece(g, s, A.shade(col, -0.04), (p) => p.arc(side * 30, -28, 21, 0, 7), { shadow: 0.4 }); dot(g, side * 30, -28, 12, '#F0B7B0'); }
      head();
      eye(g, -14, -6, 5.5, 7, st.blink); eye(g, 14, -6, 5.5, 7, st.blink); cheek(g, -26, 9, 7); cheek(g, 26, 9, 7);
      dot(g, 0, 7, 4.5, '#E58A8A'); smile(g, 0, 14, 6);
      A.line(g, A.alpha(C.ink, 0.4), 1.6, (p) => { for (const side of [-1, 1]) { p.moveTo(side * 10, 9); p.lineTo(side * 34, 4); p.moveTo(side * 10, 13); p.lineTo(side * 34, 16); } });
      // postal cap
      piece(g, s, '#4D6A96', (p) => { p.moveTo(-26, -26); p.quadraticCurveTo(0, -56, 26, -26); p.closePath(); }, { shadow: 0.4, box: bx(-26, -50, 52, 26) });
      piece(g, s, '#3A5078', (p) => A.rect(p, -30, -30, 60, 8, 4, 2, 0.3), { shadow: 0.2 }); dot(g, 0, -38, 4, '#F2D060');
    } else if (kind === 'hedgehog') {
      piece(g, s, '#8A6248', (p) => { for (let i = 0; i <= 14; i++) { const a = Math.PI + (i / 14) * Math.PI, r1 = i % 2 ? 44 : 56; p.lineTo(Math.cos(a) * r1 * 0.95, -4 + Math.sin(a) * r1); } p.lineTo(44, 14); p.lineTo(-44, 14); p.closePath(); }, { shadow: 0.5, box: bx(-52, -58, 104, 70) });
      head(34, 32);
      eye(g, -13, -5, 5.5, 7, st.blink); eye(g, 13, -5, 5.5, 7, st.blink); cheek(g, -24, 9, 7); cheek(g, 24, 9, 7);
      dot(g, 0, 7, 5, C.ink); smile(g, 0, 15, 6);
    } else {
      for (const side of [-1, 1]) { g.save(); g.translate(side * 34, -8); g.rotate(side * -0.25); piece(g, s, '#A8754F', (p) => p.ellipse(0, 8, 13, 26, 0, 0, 7), { shadow: 0.4 }); g.restore(); }
      head();
      piece(g, s, '#FBF1E4', (p) => p.ellipse(0, 12, 18, 13, 0, 0, 7), { shadow: 0, light: 0 });
      eye(g, -15, -8, 5.5, 7, st.blink); eye(g, 15, -8, 5.5, 7, st.blink); cheek(g, -28, 8, 7); cheek(g, 28, 8, 7);
      g.beginPath(); g.ellipse(0, 6, 6, 4.5, 0, 0, 7); g.fillStyle = C.ink; g.fill(); smile(g, 0, 14, 7);
      g.beginPath(); g.ellipse(0, 22, 5, 6, 0, 0, 7); g.fillStyle = '#E58A8A'; g.fill();
    }
  };

  /* ---------------- the van ---------------- */
  /** Faces right. Wheels touch y=0 at x=-56 and x=60. Pip sits behind the window (drawn first, by the game). */
  T.VAN = { box: [-112, -128, 226, 132], pip: { x: 46, y: -58, k: 0.43 }, wheels: [-56, 60], bed: [[-80, -66], [-50, -66], [-22, -66]] };
  T.vanBody = function (g, s) {
    const red = '#E8664A';
    // flat bed
    piece(g, s, A.shade(red, -0.06), (p) => A.rect(p, -104, -56, 116, 34, 7, 3, 0.8), { box: bx(-104, -56, 116, 34) });
    piece(g, s, '#FBF6EC', (p) => A.rect(p, -104, -46, 116, 9, 2, 4, 0.3), { shadow: 0, light: 0 });
    // Pip's leaf on the side
    g.save(); g.translate(-48, -26); g.rotate(0.7); g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(9, 0, 0, -10); g.quadraticCurveTo(-9, 0, 0, 8); g.fillStyle = '#FBF6EC'; g.fill(); g.restore();
    // cab
    const cab = (p) => A.cut(p, [[6, -22], [6, -108], [62, -112], [84, -74], [104, -68], [106, -22]], [6, 18, 16, 8, 14, 8], 0.5, 5);
    piece(g, s, red, cab, { box: bx(6, -112, 100, 90) });
    piece(g, s, '#FBF6EC', (p) => A.rect(p, 6, -46, 100, 9, 2, 4, 0.3), { shadow: 0, light: 0 });
    // window: a real hole so Pip shows through, then a wash of glass
    const win = (p) => A.cut(p, [[18, -102], [58, -104], [74, -72], [18, -72]], [10, 10, 5, 5], 0.3, 2);
    g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); win(g); g.fill(); g.restore();
    g.beginPath(); win(g); g.fillStyle = 'rgba(190,228,238,.3)'; g.fill();
    A.line(g, '#FBF6EC', 4, (p) => win(p));
    A.line(g, 'rgba(255,255,255,.6)', 3, (p) => { p.moveTo(26, -80); p.lineTo(34, -96); });
    // bumper, light, arches
    piece(g, s, '#B9B4BE', (p) => A.rect(p, 94, -30, 18, 12, 5, 2, 0.3), { shadow: 0.4 });
    dot(g, 101, -54, 7, '#FBE7A8'); dot(g, 101, -54, 11, 'rgba(251,231,168,.35)');
    for (const x of T.VAN.wheels) { g.beginPath(); g.arc(x, -18, 27, Math.PI, 0); g.fillStyle = A.shade(red, -0.14); g.fill(); }
    A.line(g, 'rgba(46,42,59,.3)', 2.5, (p) => { p.moveTo(40, -66); p.lineTo(40, -26); });
    dot(g, 48, -58, 3, '#FBF6EC');
  };
  T.wheel = function (g, rot) {
    dot(g, 0, 0, 21, C.ink); dot(g, 0, 0, 10, '#F3DDB8');
    g.save(); g.rotate(rot); for (let i = 0; i < 3; i++) { g.rotate(2.094); dot(g, 0, -15, 2.6, '#8E8A96'); } g.restore(); dot(g, 0, 0, 3.5, C.ink);
  };

  /* ---------------- places to hide ---------------- */
  T.cover = {
    bush(g, s) {
      for (const [x, y, rx, ry, c, sd] of [[-44, -40, 52, 42, C.leafDark, 3], [46, -38, 50, 40, C.leaf, 5], [0, -58, 62, 54, '#7DB56B', 7]]) piece(g, s, c, (p) => A.blob(p, x, y, rx, ry, 0.06, sd, 10), { shadow: 0.6, box: bx(x - rx, y - ry, rx * 2, ry * 2) });
      g.beginPath(); g.rect(-100, -4, 200, 12); g.fillStyle = 'rgba(0,0,0,0)'; g.fill();
      for (const [x, y] of [[-40, -52], [22, -78], [48, -34], [-8, -30], [-62, -22]]) dot(g, x, y, 5.5, '#E2483F');
    },
    tree(g, s) {
      piece(g, s, C.bark, (p) => A.cut(p, [[-17, 0], [-12, -110], [12, -110], [17, 0]], 4, 0.6, 3), { shadow: 0.5, box: bx(-17, -110, 34, 110) });
      for (const [x, y, rx, ry, c, sd] of [[-46, -150, 60, 52, C.leafDark, 3], [48, -146, 58, 50, '#5F9A5C', 5], [0, -184, 82, 72, C.leaf, 7]]) piece(g, s, c, (p) => A.blob(p, x, y, rx, ry, 0.05, sd, 11), { shadow: 0.6, box: bx(x - rx, y - ry, rx * 2, ry * 2) });
      g.save(); g.beginPath(); A.blob(g, 0, -184, 82, 72, 0.05, 7, 11); g.clip(); g.beginPath(); A.blob(g, -26, -214, 56, 40, 0.08, 9); g.fillStyle = A.alpha(C.leafLight, 0.7); g.fill(); g.restore();
      for (const [x, y] of [[-40, -170], [34, -196], [8, -140]]) dot(g, x, y, 6, '#E2483F');
    },
    pillar(g, s) {
      piece(g, s, '#D9463C', (p) => A.rect(p, -29, -112, 58, 112, 8, 3, 0.6), { box: bx(-29, -112, 58, 112), light: 0.1 });
      piece(g, s, '#C93C34', (p) => A.cut(p, [[-34, -108], [-22, -128], [22, -128], [34, -108]], 9, 0.4, 2), { shadow: 0.5 });
      piece(g, s, '#2E2A3B', (p) => A.rect(p, -18, -92, 36, 8, 4, 2, 0), { shadow: 0, light: 0, grain: 0 });
      piece(g, s, '#FBF6EC', (p) => A.rect(p, -16, -74, 32, 22, 3, 2, 0.3), { shadow: 0, light: 0 });
      piece(g, s, '#B5342E', (p) => A.rect(p, -32, -10, 64, 10, 3, 2, 0.3), { shadow: 0.3 });
    },
    lily(g, s) {
      piece(g, s, '#6FA65F', (p) => { p.moveTo(0, 0); p.lineTo(56, -12); p.ellipse(0, 0, 58, 24, 0, -0.22, Math.PI * 2 - 0.5); p.closePath(); }, { shadow: 0.4, box: bx(-58, -24, 116, 48), light: 0.08 });
      A.line(g, 'rgba(60,110,70,.4)', 2, (p) => { for (const a of [1, 2, 3.1, 4.2, 5.2]) { p.moveTo(0, 0); p.lineTo(Math.cos(a) * 50, Math.sin(a) * 20); } });
      g.save(); g.translate(-30, -4); for (let i = 0; i < 5; i++) { g.save(); g.rotate(-1 + i * 0.5); piece(g, s, i % 2 ? '#F6B6CC' : '#EE8FB0', (p) => p.ellipse(0, -11, 6, 12, 0, 0, 7), { shadow: 0.2, light: 0 }); g.restore(); } dot(g, 0, -3, 4, '#F2D060'); g.restore();
    },
    hay(g, s) {
      piece(g, s, '#E9C86A', (p) => { p.moveTo(-78, 0); p.bezierCurveTo(-86, -70, -50, -112, 0, -112); p.bezierCurveTo(50, -112, 86, -70, 78, 0); p.closePath(); }, { box: bx(-80, -112, 160, 112), light: 0.08 });
      const r = A.rng(5); A.line(g, 'rgba(160,120,40,.4)', 2.5, (p) => { for (let i = 0; i < 22; i++) { const x = -60 + r() * 120, y = -14 - r() * 76; p.moveTo(x, y); p.lineTo(x + (r() - 0.5) * 20, y - 14 - r() * 10); } });
      A.line(g, '#D9B345', 4, (p) => { for (const x of [-70, -52, 60, 74]) { p.moveTo(x, 0); p.lineTo(x - 6, -14); } });
    },
  };

  /* ---------------- small living things ---------------- */
  /** state: 'green' | 'yellow' | 'red' */
  T.light = function (g, s, state) {
    piece(g, s, '#6E6A78', (p) => A.rect(p, -5, -112, 10, 112, 3, 2, 0.3), { shadow: 0.4, light: 0 });
    piece(g, s, '#3A3446', (p) => A.rect(p, -19, -176, 38, 82, 10, 3, 0.5), { shadow: 0.7, box: bx(-19, -176, 38, 82) });
    [['red', '#F0584C', -158], ['yellow', '#F5CD3D', -135], ['green', '#6FD27A', -112]].forEach(([n, c, y]) => { const on = n === state; if (on) dot(g, 0, y, 16, A.alpha(c, 0.35)); dot(g, 0, y, 9.5, on ? c : A.mix(c, '#3A3446', 0.72)); });
  };
  T.duck = function (g, s, st) {
    st = st || {};
    if (st.land) { for (const x of [-8, 6]) piece(g, s, '#F08A35', (p) => p.ellipse(x + (st.step || 0) * (x < 0 ? 5 : -5), 9, 8, 4, 0, 0, 7), { shadow: 0.2, light: 0 }); }
    else A.line(g, 'rgba(255,255,255,.6)', 2.5, (p) => { p.ellipse(0, 6, 34, 9, 0, 0, 7); });
    piece(g, s, '#FBF8F1', (p) => { p.moveTo(-30, -6); p.quadraticCurveTo(-34, -24, -18, -18); p.quadraticCurveTo(0, -26, 16, -16); p.quadraticCurveTo(30, 8, 0, 8); p.quadraticCurveTo(-24, 8, -30, -6); }, { shadow: 0.4, box: bx(-34, -26, 64, 34), light: 0.03 });
    piece(g, s, '#FBF8F1', (p) => p.arc(18, -30, 14, 0, 7), { shadow: 0.2, light: 0.03, box: bx(4, -44, 28, 28) });
    piece(g, s, '#F08A35', (p) => A.cut(p, [[29, -33], [44, -28], [29, -23]], 3, 0, 2), { shadow: 0.2, light: 0 });
    eye(g, 21, -33, 3, 3.8, st.blink); cheek(g, 14, -25, 4);
    g.beginPath(); g.ellipse(-6, -8, 13, 7, 0.2, 0, 7); g.fillStyle = '#EFE9DD'; g.fill();
  };
  /** A little engine and two wagons, facing right; wheels on y=0, engine nose near x=0. */
  T.train = function (g, s) {
    const wheel = (x, r) => { dot(g, x, -r, r, C.ink); dot(g, x, -r, r * 0.42, '#F3DDB8'); };
    [[-300, '#F2B33D'], [-200, '#5B8FC7']].forEach(([x, c], i) => { piece(g, s, c, (p) => A.rect(p, x, -52, 86, 40, 8, i + 2, 0.8), { box: bx(x, -52, 86, 40) }); for (const wx of [x + 12, x + 46]) { g.beginPath(); A.rect(g, wx, -44, 26, 18, 4, 2, 0.3); g.fillStyle = '#FBE3B4'; g.fill(); } wheel(x + 20, 10); wheel(x + 66, 10); A.line(g, C.ink, 4, (p) => { p.moveTo(x + 86, -18); p.lineTo(x + 100, -18); }); });
    piece(g, s, '#3A3446', (p) => A.rect(p, -40, -84, 18, 34, 4, 3, 0.4), { shadow: 0.4 });
    piece(g, s, '#E8664A', (p) => A.rect(p, -100, -74, 46, 62, 8, 2, 0.8), { box: bx(-100, -74, 46, 62) });
    piece(g, s, '#E8664A', (p) => A.rect(p, -58, -52, 62, 40, 10, 4, 0.8), { box: bx(-58, -52, 62, 40) });
    piece(g, s, '#5A4256', (p) => A.rect(p, -106, -84, 58, 12, 5, 2, 0.4), { shadow: 0.4 });
    g.beginPath(); A.rect(g, -92, -64, 28, 24, 5, 2, 0.3); g.fillStyle = '#FBE3B4'; g.fill();
    dot(g, 2, -34, 6, '#FBE7A8'); wheel(-84, 13); wheel(-52, 10); wheel(-22, 10);
  };
  /** Thought bubble centred on (0,0) with two little puffs trailing down to (tx,ty). */
  T.bubble = function (g, s, w, h, tx, ty) {
    for (const [k, r] of [[0.92, 6], [0.72, 10]]) piece(g, s, '#FDFAF3', (p) => p.arc(tx * k, h / 2 * (1 - k) + ty * k, r, 0, 7), { shadow: 0.7, light: 0 });
    piece(g, s, '#FDFAF3', (p) => A.rect(p, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.42, 4, 1.5), { shadow: 1.1, depth: 1.2, box: bx(-w / 2, -h / 2, w, h), light: 0.03, grain: 0.1 });
  };
  /** A chunky arrow pointing down, tip at (0,0). */
  T.arrow = function (g, s, col) {
    piece(g, s, col, (p) => A.cut(p, [[0, 0], [-26, -30], [-11, -30], [-11, -62], [11, -62], [11, -30], [26, -30]], [6, 6, 3, 8, 8, 3, 6], 0.4, 3), { shadow: 0.9, box: bx(-26, -62, 52, 62), light: 0.08 });
  };
  T.bench = function (g, s) {
    for (const x of [-34, 34]) piece(g, s, '#6E6A78', (p) => A.rect(p, x - 4, -34, 8, 34, 2, 2, 0.3), { shadow: 0.3, light: 0 });
    for (const y of [-60, -44, -30]) piece(g, s, '#C08A5A', (p) => A.rect(p, -50, y, 100, 11, 4, y, 0.5), { shadow: 0.5, box: bx(-50, y, 100, 11) });
  };
  T.fence = function (g, s, w) {
    A.line(g, '#FBF6EC', 5, (p) => { p.moveTo(-w / 2, -22); p.lineTo(w / 2, -22); p.moveTo(-w / 2, -10); p.lineTo(w / 2, -10); });
    for (let x = -w / 2; x <= w / 2; x += 20) piece(g, s, '#FBF6EC', (p) => A.cut(p, [[x - 5, 0], [x - 5, -28], [x, -36], [x + 5, -28], [x + 5, 0]], 2, 0.3, x + 99), { shadow: 0.3, light: 0 });
  };
})();
