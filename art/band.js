/* Pip's Playhouse — art for Animal Band: the little theatre, the four musicians' bodies, their
   instruments, and the small control icons. Everything static is cached as a sprite; the game
   draws arms, sticks and bounces on top each frame.
   Musicians are authored with their feet at (0,0), about 260 units tall. */
(function () {
  'use strict';
  const A = K.art;
  const B = (A.band = {});
  B.ANIMALS = {
    bear: { c: '#A8754F', belly: '#E3C29C', accent: '#E8664A' },
    bunny: { c: '#F1E7DA', belly: '#FFFFFF', accent: '#2F8F8A' },
    fox: { c: '#E3793F', belly: '#FBF1E4', accent: '#F2B33D' },
    frog: { c: '#7DB65F', belly: '#B9D88E', accent: '#6E4E7E' },
  };
  B.BARS = ['#E8664A', '#F2B33D', '#6FA65F', '#5B8FC7', '#8E6BB0'];
  B.BAR_H = [116, 108, 100, 92, 84];
  /** Draw a cached sprite at the current origin. */
  B.put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
  const star = (g, x, y, r, n, inner) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * 6.2832 - 1.5708, rr = i % 2 ? r * inner : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  B.star = star;

  /* ---------------- the theatre ---------------- */
  /** L: {land, cw (curtain width), floorY, tier: null | {top, face, h}, spots: [{x, y}]} */
  B.backdrop = (W, H, L) => A.sprite('band-room' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
    const r = A.rng(77);
    // painted night-sky flat at the back of the stage
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#4B4A6E', { shadow: 0, light: 0.07, grain: 0.3, box: { x: 0, y: 0, w: W * 0.3, h: H } });
    for (let i = 0; i < (L.land ? 22 : 12); i++) { const x = 60 + r() * (W - 120), y = 150 + r() * (L.floorY - 420), q = 4 + r() * 6; g.globalAlpha = 0.5 + r() * 0.4; star(g, x, y, q, 4, 0.35); g.fillStyle = '#F1DFA8'; g.fill(); }
    g.globalAlpha = 1;
    const mx = W * (L.land ? 0.5 : 0.74), my = L.land ? 372 : 300;
    const halo = g.createRadialGradient(mx, my, 20, mx, my, 190); halo.addColorStop(0, 'rgba(250,232,180,.32)'); halo.addColorStop(1, 'rgba(250,232,180,0)');
    g.fillStyle = halo; g.fillRect(mx - 200, my - 200, 400, 400);
    g.beginPath(); g.arc(mx, my, 62, 0, 7); A.paper(g, s, '#F3E3B5', { shadow: 0.6, light: 0.05, box: { x: mx - 62, y: my - 62, w: 124, h: 124 } });
    for (const [dx, dy, q] of [[-20, -14, 12], [18, 16, 8], [10, -26, 6]]) { g.beginPath(); g.arc(mx + dx, my + dy, q, 0, 7); g.fillStyle = 'rgba(190,160,110,.22)'; g.fill(); }
    // scenery hills
    const hill = (y, amp, col, seed) => { const q = A.rng(seed), pts = [[-40, H]]; for (let x = -40; x <= W + 40; x += W / 6) pts.push([x, y - q() * amp]); pts.push([W + 40, H]); g.beginPath(); A.smooth(g, pts); A.paper(g, s, col, { shadow: 0.7, light: 0.05, box: { x: 0, y: y - amp, w: W, h: 300 } }); };
    hill(L.floorY - 150, 90, '#5A6189', 5); hill(L.floorY - 70, 70, '#62798A', 9);
    // warm pools of light behind each player
    for (const p of L.spots) { const gy = p.y - 170, gr = g.createRadialGradient(p.x, gy, 10, p.x, gy, 250); gr.addColorStop(0, 'rgba(255,232,180,.26)'); gr.addColorStop(1, 'rgba(255,232,180,0)'); g.fillStyle = gr; g.fillRect(p.x - 260, gy - 260, 520, 520); }
    // the stage floor (and, on a phone, a raised tier at the back)
    const planks = (y0, y1, col) => {
      g.beginPath(); g.rect(-20, y0, W + 40, y1 - y0); A.paper(g, s, col, { shadow: 1, light: 0.05, grain: 0.3, box: { x: 0, y: y0, w: W * 0.5, h: y1 - y0 } });
      A.line(g, 'rgba(90,56,36,.22)', 2.5, (h) => { let y = y0 + 26, gap = 30; while (y < y1) { h.moveTo(0, y); h.lineTo(W, y); gap *= 1.25; y += gap; } for (let x = 90; x < W; x += 260) { h.moveTo(x, y0); h.lineTo(x + (x - W / 2) * 0.12, y0 + 26); } });
      g.fillStyle = 'rgba(255,244,214,.3)'; g.fillRect(0, y0, W, 5);
    };
    if (L.tier) {
      planks(L.tier.top, L.tier.face, '#C89461');
      g.beginPath(); g.rect(-20, L.tier.face, W + 40, L.tier.h); A.paper(g, s, '#9C6C46', { shadow: 0.8, light: 0.03, grain: 0.3 });
      for (let x = 40; x < W; x += 96) { star(g, x, L.tier.face + L.tier.h / 2, 11, 5, 0.5); g.fillStyle = 'rgba(243,221,184,.5)'; g.fill(); }
      planks(L.tier.face + L.tier.h, H + 20, '#C89461');
    } else planks(L.floorY, H + 20, '#C89461');
    for (const p of L.spots) { g.beginPath(); g.ellipse(p.x, p.y + 4, 118, 26, 0, 0, 7); g.fillStyle = 'rgba(255,240,200,.16)'; g.fill(); }
    // bunting
    if (L.land) {
      const x0 = L.cw - 10, x1 = W - L.cw + 10, y0 = 210, sag = 62, pt = (t) => [x0 + (x1 - x0) * t, y0 + sag * 4 * t * (1 - t)];
      A.line(g, 'rgba(243,221,184,.7)', 3, (h) => { h.moveTo(x0, y0); h.quadraticCurveTo(W / 2, y0 + sag * 2, x1, y0); });
      const cols = ['#F3DDB8', '#F4B49A', '#8CC5BF', '#F2C46A', '#B9A3C9'], n = Math.round((x1 - x0) / 96);
      for (let i = 0; i < n; i++) { const [ax, ay] = pt((i + 0.18) / n), [bx, by] = pt((i + 0.82) / n); g.beginPath(); A.cut(g, [[ax, ay], [bx, by], [(ax + bx) / 2 + 3, (ay + by) / 2 + 58]], 4, 0.6, i + 2); A.paper(g, s, cols[i % cols.length], { shadow: 0.6, light: 0.06, box: { x: ax, y: ay, w: bx - ax, h: 58 } }); }
    }
    // curtains
    const cw = L.cw, tie = H * 0.56, red = '#B8473D';
    for (const side of [0, 1]) {
      g.save(); if (side) { g.translate(W, 0); g.scale(-1, 1); }
      g.beginPath(); g.moveTo(-20, -20); g.lineTo(cw * 1.5, -20); g.bezierCurveTo(cw * 1.45, tie * 0.5, cw * 1.2, tie * 0.85, cw * 0.62, tie); g.bezierCurveTo(cw * 0.95, tie + (H - tie) * 0.3, cw * 1.08, tie + (H - tie) * 0.7, cw * 1.02, H + 20); g.lineTo(-20, H + 20); g.closePath();
      A.paper(g, s, red, { shadow: 1.2, depth: 1.6, light: 0.08, grain: 0.3, box: { x: 0, y: 0, w: cw * 1.5, h: H } });
      g.save(); g.clip();
      for (const k of [0.3, 0.62, 0.95]) { A.line(g, 'rgba(90,24,26,.22)', cw * 0.11, (h) => { h.moveTo(cw * 1.5 * k, -20); h.bezierCurveTo(cw * 1.45 * k, tie * 0.5, cw * 1.2 * k, tie * 0.85, cw * 0.62 * k + 4, tie); h.bezierCurveTo(cw * 0.95 * k, tie + (H - tie) * 0.3, cw * 1.08 * k, tie + (H - tie) * 0.7, cw * 1.02 * k, H + 20); }); }
      g.restore();
      g.beginPath(); A.rect(g, -10, tie - 15, cw * 0.62 + 22, 30, 12, 4, 0.5); A.paper(g, s, '#F2B33D', { shadow: 0.8, light: 0.08, box: { x: 0, y: tie - 15, w: cw, h: 30 } });
      g.restore();
    }
    // valance, two layers of scalloped paper
    const val = (vh, depth, col, n) => { const w = W / n; g.beginPath(); g.moveTo(-20, -20); g.lineTo(W + 20, -20); g.lineTo(W + 20, vh); for (let i = n; i > 0; i--) g.quadraticCurveTo((i - 0.5) * w, vh + depth * 2, (i - 1) * w, vh); g.lineTo(-20, vh); g.closePath(); A.paper(g, s, col, { shadow: 1.2, depth: 1.5, light: 0.05, grain: 0.3, box: { x: 0, y: 0, w: W * 0.4, h: vh + depth } }); };
    const n = Math.max(4, Math.round(W / 170));
    val(L.land ? 118 : 104, 20, '#9E3B36', n); val(L.land ? 84 : 76, 16, red, n * 2);
    A.line(g, 'rgba(242,179,61,.85)', 4, (h) => { const w = W / (n * 2), vh = (L.land ? 84 : 76) - 9; h.moveTo(W, vh); for (let i = n * 2; i > 0; i--) h.quadraticCurveTo((i - 0.5) * w, vh + 32, (i - 1) * w, vh); });
  });

  /* ---------------- musicians ---------------- */
  B.body = (id) => A.sprite('band-body-' + id, [-100, -140, 200, 152], (g, s) => {
    const a = B.ANIMALS[id], c = a.c;
    if (id === 'fox') { g.beginPath(); A.smooth(g, [[-36, -20], [-70, -18], [-94, -52], [-84, -96], [-64, -74], [-44, -44]]); A.paper(g, s, A.shade(c, -0.05), { shadow: 0.6 }); g.beginPath(); A.smooth(g, [[-92, -62], [-84, -98], [-68, -78], [-78, -60]]); g.fillStyle = a.belly; g.fill(); }
    if (id === 'bunny') { g.beginPath(); g.arc(-50, -30, 17, 0, 7); A.paper(g, s, '#FFFFFF', { shadow: 0.5 }); }
    for (const side of [-1, 1]) { g.beginPath(); g.ellipse(side * (id === 'frog' ? 34 : 26), -7, id === 'frog' ? 30 : 24, 12, 0, 0, 7); A.paper(g, s, A.shade(c, -0.1), { shadow: 0.5, grain: 0.15 }); }
    g.beginPath(); A.blob(g, 0, -68, 55, 64, 0.03, 12, 10); A.paper(g, s, c, { shadow: 0.9, light: 0.06, box: { x: -55, y: -132, w: 110, h: 128 } });
    g.beginPath(); g.ellipse(0, -56, 35, 43, 0, 0, 7); g.fillStyle = A.alpha(a.belly, 0.92); g.fill();
  });
  B.head = (id, blink) => A.sprite('band-head-' + id + (blink ? 'b' : ''), [-80, -116, 160, 180], (g, s) => { A.face(g, s, id, { blink: blink ? 1 : 0 }); });
  /** A soft paper arm from shoulder to hand, with a round paw. */
  B.arm = function (g, col, sx, sy, hx, hy, w) {
    const mx = (sx + hx) / 2 + (hy - sy) * 0.18, my = (sy + hy) / 2 + Math.abs(hx - sx) * 0.12 + 6;
    A.line(g, col, w || 20, (h) => { h.moveTo(sx, sy); h.quadraticCurveTo(mx, my, hx, hy); });
    g.beginPath(); g.arc(hx, hy, (w || 20) * 0.62, 0, 7); g.fillStyle = col; g.fill();
  };

  /* ---------------- instruments ---------------- */
  B.bassDrum = () => A.sprite('band-bass', [-70, -70, 140, 150], (g, s) => {
    A.line(g, '#6B4430', 9, (h) => { h.moveTo(-34, 44); h.lineTo(-46, 70); h.moveTo(34, 44); h.lineTo(46, 70); });
    g.beginPath(); g.arc(0, 0, 62, 0, 7); A.paper(g, s, '#E8664A', { shadow: 1, light: 0.08, box: { x: -62, y: -62, w: 124, h: 124 } });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.2832 + 0.39; g.beginPath(); g.arc(Math.cos(a) * 55, Math.sin(a) * 55, 4.5, 0, 7); g.fillStyle = '#F3DDB8'; g.fill(); }
    g.beginPath(); g.arc(0, 0, 47, 0, 7); A.paper(g, s, '#F8EEDC', { shadow: 0.5, light: 0.05, grain: 0.15, box: { x: -47, y: -47, w: 94, h: 94 } });
    star(g, 0, 2, 26, 5, 0.5); A.paper(g, s, '#F2B33D', { shadow: 0.4, light: 0.06, box: { x: -26, y: -24, w: 52, h: 52 } });
  });
  B.snare = () => A.sprite('band-snare', [-52, -22, 104, 126], (g, s) => {
    A.line(g, '#8E8A96', 6, (h) => { h.moveTo(0, 26); h.lineTo(0, 62); h.moveTo(0, 62); h.lineTo(-30, 98); h.moveTo(0, 62); h.lineTo(30, 98); });
    g.beginPath(); A.cut(g, [[-44, -4], [44, -4], [40, 34], [-40, 34]], [4, 4, 12, 12], 0.4, 3); A.paper(g, s, '#2F8F8A', { shadow: 0.9, light: 0.08, box: { x: -44, y: -4, w: 88, h: 38 } });
    A.line(g, '#F3DDB8', 3.5, (h) => { for (let i = 0; i < 6; i++) { h.moveTo(-38 + i * 14, 4); h.lineTo(-31 + i * 14, 28); h.lineTo(-24 + i * 14, 4); } });
    g.beginPath(); g.ellipse(0, -5, 45, 13, 0, 0, 7); A.paper(g, s, '#F8EEDC', { shadow: 0.3, light: 0.05, grain: 0.12, box: { x: -45, y: -18, w: 90, h: 26 } });
    g.beginPath(); g.ellipse(0, -5, 45, 13, 0, 0, 7); g.strokeStyle = 'rgba(46,42,59,.2)'; g.lineWidth = 2.5; g.stroke();
  });
  B.cymbal = () => A.sprite('band-cymbal', [-58, -18, 116, 36], (g, s) => {
    g.beginPath(); g.ellipse(0, 0, 54, 12, 0, 0, 7); A.paper(g, s, '#F2B33D', { shadow: 0.8, light: 0.12, box: { x: -54, y: -12, w: 108, h: 24 } });
    g.beginPath(); g.ellipse(0, -1, 34, 7, 0, 0, 7); g.strokeStyle = 'rgba(160,100,20,.3)'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.ellipse(0, -4, 11, 6, 0, 0, 7); g.fillStyle = '#D9952B'; g.fill();
  });
  B.xyloFrame = () => A.sprite('band-xframe', [-136, -116, 272, 122], (g, s) => {
    A.line(g, '#6B4430', 10, (h) => { h.moveTo(-104, -40); h.lineTo(-116, 0); h.moveTo(104, -40); h.lineTo(116, 0); });
    for (const [y, w] of [[-104, 9], [-36, 9]]) { g.beginPath(); A.cut(g, [[-130, y - w + (y < -60 ? -6 : 0)], [130, y - w + (y < -60 ? 12 : 0)], [130, y + w + (y < -60 ? 12 : 0)], [-130, y + w + (y < -60 ? -6 : 0)]], 7, 0.4, 5); A.paper(g, s, '#C08A5A', { shadow: 0.8, light: 0.06, box: { x: -130, y: y - w, w: 260, h: w * 2 } }); }
  });
  B.bar = (i) => A.sprite('band-bar' + i, [-22, -B.BAR_H[i], 44, B.BAR_H[i]], (g, s) => {
    const h = B.BAR_H[i];
    g.beginPath(); A.rect(g, -20, -h, 40, h, 11, i + 3, 0.5); A.paper(g, s, B.BARS[i], { shadow: 0.9, light: 0.1, box: { x: -20, y: -h, w: 40, h } });
    for (const y of [-h + 16, -16]) { g.beginPath(); g.arc(0, y, 4.5, 0, 7); g.fillStyle = 'rgba(46,42,59,.3)'; g.fill(); }
    g.beginPath(); A.rect(g, -13, -h + 26, 7, h - 52, 3.5, 2, 0); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill();
  });
  /** Trumpet, mouthpiece at (0,0), pointing right. */
  B.horn = () => A.sprite('band-horn', [-12, -48, 144, 96], (g, s) => {
    const gold = '#F2B33D';
    g.beginPath(); A.cut(g, [[70, -9], [112, -38], [124, 0], [112, 38], [70, 9]], [3, 12, 14, 12, 3], 0.4, 4); A.paper(g, s, gold, { shadow: 0.9, light: 0.12, box: { x: 70, y: -38, w: 54, h: 76 } });
    g.beginPath(); g.ellipse(116, 0, 9, 33, 0, 0, 7); g.fillStyle = '#C98A22'; g.fill();
    g.beginPath(); A.rect(g, -2, -8, 78, 16, 8, 2, 0.3); A.paper(g, s, gold, { shadow: 0.7, light: 0.12, box: { x: 0, y: -8, w: 78, h: 16 } });
    g.beginPath(); A.rect(g, 14, 6, 48, 16, 8, 3, 0.3); g.strokeStyle = '#D9952B'; g.lineWidth = 6; g.stroke();
    for (const x of [22, 37, 52]) { g.beginPath(); A.rect(g, x - 5, -24, 10, 18, 3, 2, 0); A.paper(g, s, '#F8EEDC', { shadow: 0.4, grain: 0.1 }); }
    g.beginPath(); A.rect(g, -10, -7, 12, 14, 4, 2, 0); g.fillStyle = '#D9952B'; g.fill();
  });
  /** Ukulele lying along +x, body centred on (0,0). */
  B.uke = () => A.sprite('band-uke', [-78, -46, 236, 92], (g, s) => {
    g.beginPath(); A.rect(g, 30, -8, 96, 16, 4, 2, 0.3); A.paper(g, s, '#6B4430', { shadow: 0.7, light: 0.05 });
    g.beginPath(); A.cut(g, [[122, -13], [150, -11], [150, 11], [122, 13]], 5, 0.3, 3); A.paper(g, s, '#8A5A3C', { shadow: 0.7 });
    for (const [x, y] of [[132, -13], [143, -12], [132, 13], [143, 12]]) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fillStyle = '#F8EEDC'; g.fill(); }
    g.beginPath(); A.smooth(g, [[-70, 0], [-62, -26], [-36, -32], [-14, -28], [8, -40], [34, -34], [44, 0], [34, 34], [8, 40], [-14, 28], [-36, 32], [-62, 26]]); A.paper(g, s, '#E9B26E', { shadow: 1, light: 0.1, box: { x: -70, y: -40, w: 114, h: 80 } });
    g.beginPath(); g.arc(-2, 0, 13, 0, 7); g.fillStyle = '#5A3A28'; g.fill(); g.beginPath(); g.arc(-2, 0, 17, 0, 7); g.strokeStyle = 'rgba(106,68,48,.45)'; g.lineWidth = 2.5; g.stroke();
    g.beginPath(); A.rect(g, -50, -13, 9, 26, 3, 2, 0); g.fillStyle = '#6B4430'; g.fill();
  });
  /* ---------------- painted pictures (img/band) ----------------
     Each drawn piece above (a head, a body, a drum) can be swapped for a picture. The picture is fitted into
     the very same space the drawn piece fills, so every position, swing and bounce in the game stays as it was.
     Pictures are fetched when the app starts; until they have all arrived the paper pieces are used. */
  const PIC_NAMES = ['bear-head', 'bear-head-shut', 'bear-body', 'bunny-head', 'bunny-head-shut', 'bunny-body', 'fox-head', 'fox-head-shut', 'fox-body', 'frog-head', 'frog-head-shut', 'frog-body', 'bass', 'snare', 'cymbal', 'xframe', 'bar', 'horn', 'uke'];
  const PIC = {}; let pLeft = PIC_NAMES.length, pBad = false;
  B.pics = false;
  const allIn = () => {
    B.pics = !pBad;
    if (B.pics) for (const id in B.ANIMALS) B.ANIMALS[id].c = avgColor(PIC[id + '-body']);     // the drawn arms take the picture's fur colour
  };
  for (const nm of PIC_NAMES) { const im = new Image(); im.onload = () => { PIC[nm] = im; if (--pLeft <= 0) allIn(); }; im.onerror = () => { pBad = true; pLeft--; }; im.src = 'img/band/' + nm + '.webp'; }
  B.ready = () => new Promise((res) => { const t0 = Date.now(); (function wait() { if (pLeft <= 0 || Date.now() - t0 > 8000) res(B.pics); else setTimeout(wait, 80); })(); });
  /** The usual colour of the upper part of a picture (its fur), skipping the pale tummy. */
  function avgColor(im) {
    const c = document.createElement('canvas'); c.width = c.height = 40; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 40, 40);
    const d = x.getImageData(0, 0, 40, 12).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    const h = (v) => Math.round(v / (n || 1)).toString(16).padStart(2, '0'); return n ? '#' + h(r) + h(g) + h(b) : '#A8754F';
  }
  const fit = A.fitPic;
  const swap = (name, pic, o) => { const old = B[name]; B[name] = function (a, b) { const nm = pic(a, b), im = B.pics && PIC[nm]; const sp = old(a, b); return im ? fit(nm + (o && o.key ? o.key(a) : ''), sp, im, typeof o === 'function' ? o(a) : o) : sp; }; };
  swap('body', (id) => id + '-body');
  swap('head', (id, blink) => id + '-head' + (blink ? '-shut' : ''), { grow: 1.06 });
  swap('bassDrum', () => 'bass'); swap('snare', () => 'snare'); swap('cymbal', () => 'cymbal', { mid: 1, stretch: 1 });
  swap('xyloFrame', () => 'xframe', { stretch: 1 }); swap('horn', () => 'horn', { mid: 1 }); swap('uke', () => 'uke', { mid: 1 });
  { const old = B.bar; B.bar = (i) => { const sp = old(i); return B.pics && PIC.bar ? fit('bar' + i, sp, PIC.bar, { tint: B.BARS[i], stretch: 1 }) : sp; }; }

  B.plaque = () => A.sprite('band-plaque', [-112, -24, 224, 48], (g, s) => { g.beginPath(); A.rect(g, -110, -22, 220, 44, 22, 5, 0.6); A.paper(g, s, '#F6EFE3', { shadow: 0.9, light: 0.04, grain: 0.15, box: { x: -110, y: -22, w: 220, h: 44 } }); });

  /* ---------------- little icons (drawn inside a radius of about 34) ---------------- */
  B.disc = (r) => A.sprite('band-disc' + r, [-r, -r, r * 2, r * 2], (g, s) => { g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 1, light: 0.04, box: { x: -r, y: -r, w: r * 2, h: r * 2 } }); });
  B.moon = function (g, r, col) {
    g.beginPath(); g.arc(0, 0, r, 0.9, 5.4); g.quadraticCurveTo(-r * 0.05, 0, Math.cos(0.9) * r, Math.sin(0.9) * r); g.closePath(); g.fillStyle = col || '#6E4E7E'; g.fill();
    star(g, r * 0.62, -r * 0.5, r * 0.3, 4, 0.4); g.fillStyle = '#F2B33D'; g.fill();
  };
  B.tortoise = function (g, hop) {
    g.save(); g.translate(-2, 6 - hop * 3);
    for (const x of [-18, 12]) { g.beginPath(); A.rect(g, x, 4, 12, 15, 5, 2, 0); g.fillStyle = '#8FBF74'; g.fill(); }
    g.beginPath(); g.arc(27, -4 - hop * 2, 11, 0, 7); g.fillStyle = '#9CCB80'; g.fill();
    g.beginPath(); g.arc(30, -7 - hop * 2, 2.6, 0, 7); g.fillStyle = A.C.ink; g.fill();
    g.beginPath(); g.moveTo(-27, 8); g.quadraticCurveTo(-26, -26, 0, -26); g.quadraticCurveTo(24, -26, 22, 8); g.closePath(); g.fillStyle = '#4F8752'; g.fill();
    for (const [x, y, q] of [[-12, -8, 6], [4, -14, 6], [8, 0, 5], [-4, 2, 4.5]]) { g.beginPath(); g.arc(x, y, q, 0, 7); g.fillStyle = '#7FB56A'; g.fill(); }
    g.restore();
  };
  B.hare = function (g, hop) {
    g.save(); g.translate(-2, 6 - hop * 9); g.rotate(-hop * 0.18);
    g.beginPath(); g.arc(-25, 2, 7, 0, 7); g.fillStyle = '#FFFFFF'; g.fill();
    g.beginPath(); g.ellipse(-4, 4, 23, 15, -0.12, 0, 7); g.fillStyle = '#E9D2B4'; g.fill();
    for (const [x, rot] of [[14, -0.5], [20, -0.85]]) { g.save(); g.translate(x, -10); g.rotate(rot); g.beginPath(); g.ellipse(0, -15, 5.5, 16, 0, 0, 7); g.fillStyle = '#E9D2B4'; g.fill(); g.beginPath(); g.ellipse(0, -15, 2.5, 11, 0, 0, 7); g.fillStyle = '#F0A8A0'; g.fill(); g.restore(); }
    g.beginPath(); g.arc(19, -6, 12, 0, 7); g.fillStyle = '#F1DCC0'; g.fill();
    g.beginPath(); g.arc(23, -8, 2.6, 0, 7); g.fillStyle = A.C.ink; g.fill();
    g.beginPath(); g.arc(30, -3, 2.2, 0, 7); g.fillStyle = '#E58A8A'; g.fill();
    for (const [x, rot] of [[-16, 0.5 + hop], [10, -0.5 - hop]]) { g.save(); g.translate(x, 14); g.rotate(rot); g.beginPath(); g.ellipse(0, 5, 5, 10, 0, 0, 7); g.fillStyle = '#DDBF9C'; g.fill(); g.restore(); }
    g.restore();
  };
  /** A floating note bubble, radius r. */
  B.bubble = function (g, r, col) {
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = 'rgba(255,255,255,.2)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.ellipse(-r * 0.38, -r * 0.45, r * 0.26, r * 0.13, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.75)'; g.fill();
    g.fillStyle = col; g.beginPath(); g.ellipse(-r * 0.12, r * 0.3, r * 0.26, r * 0.19, -0.35, 0, 7); g.fill();
    g.fillRect(r * 0.08, -r * 0.42, r * 0.11, r * 0.72);
    g.beginPath(); g.moveTo(r * 0.08, -r * 0.44); g.quadraticCurveTo(r * 0.5, -r * 0.34, r * 0.46, 0); g.quadraticCurveTo(r * 0.36, -r * 0.2, r * 0.08, -r * 0.2); g.closePath(); g.fill();
  };
})();
