/* Big and Small — measuring by hand in the meadow.
   Everything is done with the fingers: friends are dragged into a line from small to big, bowls are
   carried to the friend they fit, two ribbons are laid side by side to see which is longer, blocks
   are laid along a pencil to measure it, a paper ruler is slid underneath, parcels are put on a
   see-saw. Nothing can be lost: a wrong try wobbles and gets a kind hint, and after two misses the
   answer glows.

   Level 1 (age 3):   three friends in order from small to big; the bowl that fits each friend
                      (too big / too small); touch the big, small, tall, short or long one.
   Level 2 (4-5):     order 4-5 flowers by height or caterpillars by length; find the tallest,
                      shortest, longest; compare two by lining them up against each other.
   Level 3 (6-8):     measure with blocks (lay them and count), read a ruler, "how many blocks
                      longer?" by touching the blocks that stick out, heavier and lighter on a
                      see-saw (size does not tell you the weight), and order rolled ribbons by the
                      number on them. The number sentence is shown as big text.
   Inside a session things get closer in size and longer as the child succeeds, and ease off after
   misses. Each finished round grows a sunflower; four sunflowers is a celebration. */
(function () {
  'use strict';
  const A = K.art;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const N = (n) => cap(K.numWord(n)) + '!';
  const SPOKEN_MAX = 10;
  const SAY = {
    line: 'Line them up.', sb: 'Small to big.', st: 'Short to tall.', sl: 'Short to long.',
    bowls: 'Give each friend the bowl that fits.', tooBig: 'Too big!', tooSmall: 'Too small!',
    big: 'Touch the big one.', small: 'Touch the small one.', tall: 'Touch the tall one.', short: 'Touch the short one.', long: 'Touch the long one.',
    biggest: 'Touch the biggest one.', smallest: 'Touch the smallest one.', tallest: 'Touch the tallest one.', shortest: 'Touch the shortest one.', longest: 'Touch the longest one.',
    again: 'Look again.',
    longer: 'Which one is longer?', shorter: 'Which one is shorter?', check: 'Line them up to check.', isLonger: 'This one is longer.', isShorter: 'This one is shorter.',
    howLong: 'How long is it?', lay: 'Lay the blocks beside it.',
    ruler: 'Slide the ruler under it.', end: 'Where does it end?',
    more: 'How many blocks longer?', stick: 'Touch the blocks that stick out.', samePart: 'That part is the same.',
    seesaw: 'Put them on the see-saw.', heavier: 'Which one is heavier?', lighter: 'Which one is lighter?', isHeavier: 'This one is heavier.', isLighter: 'This one is lighter.',
    numSays: 'The number says how long.',
  };
  function lines() { const out = Object.values(SAY); for (let n = 1; n <= SPOKEN_MAX; n++) out.push(N(n)); return out; }

  /* ---------------- pictures ---------------- */
  const FR = { bear: 'bobo/bobo', bunny: 'bobo/bunny', fox: 'bobo/fox', frog: 'bobo/frog', cat: 'star/cat', owl: 'star/owl', panda: 'star/panda' };
  const FR_COL = { bear: '#B5774A', bunny: '#EFE6DA', fox: '#E8833F', frog: '#86BE5F', cat: '#A9A0B4', owl: '#B0794A', panda: '#F6F3EC' };
  const PIC = {};
  const load = (k, src) => { const im = new Image(); im.onload = () => { PIC[k] = im; }; im.src = 'img/' + src + '.webp'; };
  for (const k in FR) load(k, FR[k]);
  load('sprout', 'tales/sprout'); load('sunflower', 'tales/sunflower');

  /* ---------------- paper drawings ---------------- */
  const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
  const COLS = ['#E8664A', '#2F8F8A', '#F2B33D', '#6E4E7E', '#5B8FC7', '#E58FA6'];
  const aspect = (id) => (PIC[id] ? PIC[id].width / PIC[id].height : 0.62);
  /** A friend standing with feet at (0,0), h units tall. */
  function drawFriend(g, s, id, h) {
    g.beginPath(); g.ellipse(0, 0, h * 0.26, h * 0.045, 0, 0, 7); g.fillStyle = 'rgba(46,60,50,.2)'; g.fill();
    const im = PIC[id];
    if (im) { const k = h / im.height; g.drawImage(im, -im.width * k / 2, -h, im.width * k, h); return; }
    g.beginPath(); A.blob(g, 0, -h * 0.3, h * 0.25, h * 0.3, 0.03, 4, 10); A.paper(g, s, FR_COL[id], { light: 0.07, box: { x: -h * 0.25, y: -h * 0.6, w: h * 0.5, h: h * 0.6 } });
    g.beginPath(); g.ellipse(0, -h * 0.26, h * 0.14, h * 0.18, 0, 0, 7); g.fillStyle = 'rgba(255,250,236,.6)'; g.fill();
    g.save(); g.translate(0, -h * 0.7); g.scale(h / 200, h / 200); A.face(g, s * h / 200, id, {}); g.restore();
  }
  const FLOWER = ['#F2B33D', '#E8664A', '#E58FA6', '#8C6BB8', '#5B8FC7'];
  function paintFlower(g, s, h, v) {
    const cy = -h + 70;
    A.line(g, '#3F8F47', 15, (p) => { p.moveTo(0, 0); p.quadraticCurveTo(12, (cy + 20) * 0.5, 0, cy + 20); });
    for (const [f, k] of [[0.32, 1], [0.58, -1], [0.8, 1]]) {
      const y = (cy + 40) * f; if (-y < 40 || -y > h - 150) continue;
      g.save(); g.translate(k * 3, y); g.scale(k, 1); g.rotate(-0.5); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(30, -34, 76, -8); g.quadraticCurveTo(34, 18, 0, 0); A.paper(g, s, '#58A856', { shadow: 0.5, light: 0.08 }); g.restore();
    }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; g.save(); g.translate(Math.cos(a) * 43, cy + Math.sin(a) * 43); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 32, 18, 0, 0, 7); A.paper(g, s, i % 2 ? A.shade(FLOWER[v], 0.05) : FLOWER[v], { shadow: 0.35, light: 0.06 }); g.restore(); }
    g.beginPath(); g.arc(0, cy, 37, 0, 7); A.paper(g, s, '#8A5A34', { shadow: 0.4, light: 0.09, box: { x: -37, y: cy - 37, w: 74, h: 74 } });
    for (const k of [-1, 1]) { g.beginPath(); g.arc(k * 13, cy - 6, 4.6, 0, 7); g.fillStyle = '#2E2A3B'; g.fill(); g.beginPath(); g.arc(k * 22, cy + 6, 6, 0, 7); g.fillStyle = 'rgba(240,130,110,.4)'; g.fill(); }
    A.line(g, '#2E2A3B', 3.2, (p) => { p.moveTo(-10, cy + 9); p.quadraticCurveTo(0, cy + 18, 10, cy + 9); });
  }
  const flowerSp = (h, v) => A.sprite('sizes-fl' + v + '-' + h, [-84, -h - 14, 168, h + 24], (g, s) => paintFlower(g, s, h, v));
  /** A long thing lying from x = 0 to x = len, centred on y = 0. */
  function paintLong(g, s, kind, len, v) {
    const c = COLS[v % COLS.length];
    if (kind === 'pencil') {
      const t = Math.min(52, len * 0.3);
      g.beginPath(); A.cut(g, [[len - t, -24], [len, 0], [len - t, 24]], 3, 0.4, 2); A.paper(g, s, '#F1D6A6', { shadow: 0.8 });
      g.beginPath(); A.cut(g, [[len - t * 0.36, -8], [len, 0], [len - t * 0.36, 8]], 2, 0, 2); g.fillStyle = '#3E3A52'; g.fill();
      g.beginPath(); A.rect(g, 30, -24, len - t - 28, 48, 4, 3, 0.5); A.paper(g, s, c, { shadow: 0.8, light: 0.08, box: { x: 0, y: -24, w: len, h: 48 } });
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(34, -16, len - t - 36, 9); g.fillStyle = 'rgba(40,30,60,.12)'; g.fillRect(34, 9, len - t - 36, 9);
      g.beginPath(); A.rect(g, 0, -23, 22, 46, 9, 5, 0.4); A.paper(g, s, '#F0A3AC', { shadow: 0.6 });
      g.beginPath(); A.rect(g, 18, -25, 16, 50, 3, 6, 0.3); A.paper(g, s, '#C7CBD3', { shadow: 0.3, light: 0.1 });
    } else if (kind === 'ribbon') {
      g.beginPath(); A.cut(g, [[0, -25], [len, -25], [len - 18, 0], [len, 25], [0, 25], [18, 0]], 3, 0.5, 4); A.paper(g, s, c, { shadow: 0.9, light: 0.08, box: { x: 0, y: -25, w: len, h: 50 } });
      g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(22, -5, len - 44, 10);
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let x = 34; x < len - 26; x += 40) { g.beginPath(); g.arc(x, -15, 3.5, 0, 7); g.arc(x + 20, 15, 3.5, 0, 7); g.fill(); }
    } else {   // a caterpillar
      const c2 = A.shade(c, -0.08), hx = len - 36, n = Math.max(1, Math.round((hx - 30) / 42)), step = n > 1 ? (hx - 36 - 28) / (n - 1) : 0;
      for (let i = 0; i < n; i++) {
        const x = n > 1 ? 28 + i * step : Math.max(28, hx - 44);
        A.line(g, '#3E3A52', 5, (p) => { p.moveTo(x - 9, 22); p.lineTo(x - 11, 33); p.moveTo(x + 9, 22); p.lineTo(x + 11, 33); });
        g.beginPath(); g.arc(x, 0, 28, 0, 7); A.paper(g, s, i % 2 ? c2 : c, { shadow: 0.6, light: 0.09, box: { x: x - 28, y: -28, w: 56, h: 56 } });
      }
      A.line(g, '#3E3A52', 4, (p) => { p.moveTo(hx - 12, -30); p.quadraticCurveTo(hx - 20, -50, hx - 8, -54); p.moveTo(hx + 12, -30); p.quadraticCurveTo(hx + 24, -48, hx + 14, -56); });
      g.beginPath(); g.arc(hx, -2, 36, 0, 7); A.paper(g, s, A.shade(c, 0.06), { shadow: 0.7, light: 0.09, box: { x: hx - 36, y: -38, w: 72, h: 72 } });
      for (const k of [-1, 1]) { g.beginPath(); g.arc(hx + 4 + k * 12, -8, 5, 0, 7); g.fillStyle = '#2E2A3B'; g.fill(); g.beginPath(); g.arc(hx + 2 + k * 12, -10, 1.7, 0, 7); g.fillStyle = '#fff'; g.fill(); }
      A.line(g, '#2E2A3B', 3, (p) => { p.moveTo(hx - 6, 8); p.quadraticCurveTo(hx + 5, 18, hx + 16, 8); });
      g.beginPath(); g.arc(hx - 16, 6, 6, 0, 7); g.arc(hx + 26, 6, 6, 0, 7); g.fillStyle = 'rgba(240,130,120,.45)'; g.fill();
    }
  }
  const longSp = (kind, len, v) => A.sprite('sizes-' + kind + v + '-' + Math.round(len), [-8, -62, len + 16, 104], (g, s) => paintLong(g, s, kind, len, v));
  const bowlSp = (w, v) => A.sprite('sizes-bowl' + v + '-' + w, [-w / 2 - 30, -w * 0.72, w + 60, w * 0.76], (g, s) => {
    const h = w * 0.5, c = COLS[v % COLS.length];
    A.line(g, '#C08A5A', Math.max(6, w * 0.06), (p) => { p.moveTo(w * 0.1, -h * 0.9); p.lineTo(w * 0.52, -h * 1.3); });
    g.beginPath(); g.ellipse(0, -h * 0.84, w / 2, h * 0.2, 0, 0, 7); A.paper(g, s, A.shade(c, -0.1), { shadow: 0.6, light: 0 });
    g.beginPath(); g.ellipse(0, -h * 0.82, w / 2 - w * 0.06, h * 0.14, 0, 0, 7); g.fillStyle = '#F8E9C6'; g.fill();
    g.beginPath(); g.moveTo(-w / 2, -h * 0.84); g.bezierCurveTo(-w * 0.3, -h * 0.62, w * 0.3, -h * 0.62, w / 2, -h * 0.84); g.quadraticCurveTo(w * 0.44, 0, w * 0.2, 0); g.lineTo(-w * 0.2, 0); g.quadraticCurveTo(-w * 0.44, 0, -w / 2, -h * 0.84); g.closePath();
    A.paper(g, s, c, { light: 0.09, box: { x: -w / 2, y: -h, w, h } });
    g.fillStyle = 'rgba(255,255,255,.3)'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * w * 0.2, -h * 0.34, w * 0.045, 0, 7); g.fill(); }
  });
  const blockSp = (u, v) => A.sprite('sizes-block' + v + '-' + u, [-u / 2, -u / 2, u, u], (g, s) => {
    const c = v ? '#F2B33D' : '#5B8FC7';
    g.beginPath(); A.rect(g, -u / 2 + 3, -u / 2 + 3, u - 6, u - 6, 13, 3, 0.6); A.paper(g, s, c, { shadow: 0.8, light: 0.1, box: { x: -u / 2, y: -u / 2, w: u, h: u } });
    g.beginPath(); A.rect(g, -u / 2 + 13, -u / 2 + 13, u - 26, u - 26, 8, 5, 0.4); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill();
  });
  const RM = 34, RH = 92;
  const rulerSp = (u, M) => A.sprite('sizes-ruler' + u + '-' + M, [-RM - 4, -4, M * u + RM * 2 + 8, RH + 8], (g, s) => {
    g.beginPath(); A.rect(g, -RM, 0, M * u + RM * 2, RH, 12, 3, 0.8); A.paper(g, s, '#F8DC8C', { depth: 1.2, light: 0.07, box: { x: -RM, y: 0, w: M * u + RM * 2, h: RH } });
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-RM + 8, RH - 16, M * u + RM * 2 - 16, 6);
    A.line(g, '#3E3A52', 4, (p) => { for (let i = 0; i <= M; i++) { p.moveTo(i * u, 2); p.lineTo(i * u, 28); } }, 'butt');
    A.line(g, 'rgba(62,58,82,.55)', 3, (p) => { for (let i = 0; i < M; i++) { p.moveTo(i * u + u / 2, 2); p.lineTo(i * u + u / 2, 16); } }, 'butt');
    g.fillStyle = '#3E3A52'; g.font = `700 38px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i <= M; i++) g.fillText(String(i), i * u, 58);
  });
  const parcelSp = (sz, v) => A.sprite('sizes-parcel' + v + '-' + sz, [-sz / 2 - 20, -sz - 34, sz + 40, sz + 40], (g, s) => {
    const c = COLS[v % COLS.length];
    g.beginPath(); A.rect(g, -sz / 2, -sz, sz, sz, 12, v + 2, 1); A.paper(g, s, c, { depth: 1.1, light: 0.09, box: { x: -sz / 2, y: -sz, w: sz, h: sz } });
    g.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc((i % 2 ? 1 : -1) * sz * 0.28, -sz * (i < 2 ? 0.74 : 0.26), sz * 0.06, 0, 7); g.fill(); }
    g.fillStyle = '#FFF6DC'; g.fillRect(-sz * 0.09, -sz, sz * 0.18, sz); g.fillRect(-sz / 2, -sz * 0.59, sz, sz * 0.18);
    for (const k of [-1, 1]) { g.save(); g.translate(0, -sz); g.scale(k, 1); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(10, -34, 44, -34, 36, -8); g.bezierCurveTo(30, 6, 12, 4, 0, 0); A.paper(g, s, '#FFF6DC', { shadow: 0.5, light: 0.05 }); g.restore(); }
    g.beginPath(); g.arc(0, -sz - 2, 9, 0, 7); A.paper(g, s, '#F3E3B5', { shadow: 0.3 });
  });
  const rollSp = (v, n, k) => A.sprite('sizes-roll' + v + '-' + n + '-' + k, [-80 * k, -80 * k, 160 * k, 170 * k], (g, s) => {
    const c = COLS[v % COLS.length]; g.scale(k, k); s *= k;
    g.beginPath(); A.cut(g, [[30, 34], [74, 44], [60, 62], [72, 80], [22, 70]], 4, 0.5, 3); A.paper(g, s, A.shade(c, -0.06), { shadow: 0.7 });
    g.beginPath(); g.arc(0, 0, 66, 0, 7); A.paper(g, s, c, { depth: 1.1, light: 0.09, box: { x: -66, y: -66, w: 132, h: 132 } });
    A.line(g, 'rgba(255,255,255,.35)', 4, (p) => { for (let a = 0; a < 15; a += 0.2) { const r = 62 - a * 2.4, x = Math.cos(a) * r, y = Math.sin(a) * r; if (a === 0) p.moveTo(x, y); else p.lineTo(x, y); } });
    g.beginPath(); g.arc(0, 0, 38, 0, 7); A.paper(g, s, '#FFFDF6', { shadow: 0.5, light: 0.03 });
    g.fillStyle = '#2E2A3B'; g.font = `800 ${n > 9 ? 42 : 50}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 0, 3);
  });
  function glowAt(g, rx, ry, k) {
    g.save(); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx); gr.addColorStop(0, `rgba(255,240,150,${k})`); gr.addColorStop(1, 'rgba(255,240,150,0)');
    g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  }
  function tag(g, s, text, x, y, r, col) {
    g.save(); g.translate(x, y); g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, col || A.C.tomato, { shadow: 0.7, light: 0.08, grain: 0.1, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
    g.fillStyle = '#FFFDF6'; g.font = `800 ${Math.round(r * (String(text).length > 1 ? 1.0 : 1.25))}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, r * 0.06); g.restore();
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const key = Math.round(W) + 'x' + Math.round(H);
    const P = { x: 40, y: 165, w: W - 80, h: H - 165 - 120 };          // where play happens
    const gy = Math.round(H * 0.56);                                  // where the meadow begins
    let R = null, won = 0, skill = 0, lastKey = '', lastMode = '', lastTouch = 0, bag = [], rounds = 0;
    const sk = () => Math.floor(skill);

    /* ---------- the meadow ---------- */
    st.add({ z: 0, sprite: A.sprite('sizes-bg' + key, [0, 0, W, H], (g, s) => {
      const r = A.rng(31);
      const sky = g.createLinearGradient(0, 0, 0, gy + 40); sky.addColorStop(0, '#A9D8EC'); sky.addColorStop(1, '#EEF4DD'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const sx = W * 0.8, sy = land ? 250 : 240, halo = g.createRadialGradient(sx, sy, 20, sx, sy, 190); halo.addColorStop(0, 'rgba(255,240,180,.7)'); halo.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = halo; g.fillRect(sx - 200, sy - 200, 400, 400);
      g.beginPath(); g.arc(sx, sy, 58, 0, 7); A.paper(g, s, '#F8D264', { shadow: 0.4, light: 0.06, box: { x: sx - 58, y: sy - 58, w: 116, h: 116 } });
      for (const [cx, cy, k] of [[W * 0.2, 250, 1], [W * 0.56, 190, 0.7], [W * 0.95, 400, 0.8]]) { g.beginPath(); for (const [dx, dy, rr] of [[-50, 8, 34], [-12, -12, 46], [36, 4, 38], [70, 14, 24]]) { g.moveTo(cx + (dx + rr) * k, cy + dy * k); g.arc(cx + dx * k, cy + dy * k, rr * k, 0, 7); } A.paper(g, s, '#FFFDF6', { shadow: 0.35, light: 0, grain: 0.1 }); }
      const hill = (y, amp, col, seed) => { const q = A.rng(seed), pts = [[-40, H + 20]]; for (let x = -40; x <= W + 40; x += W / 5) pts.push([x, y - q() * amp]); pts.push([W + 40, H + 20]); g.beginPath(); A.smooth(g, pts); A.paper(g, s, col, { shadow: 0.6, light: 0.05, grain: 0.25, box: { x: 0, y: y - amp, w: W * 0.5, h: 400 } }); };
      hill(gy - 60, 120, '#BFDDB4', 5); hill(gy - 10, 80, '#A6D095', 9); hill(gy + 30, 40, '#8DC47B', 14);
      g.beginPath(); g.rect(-20, gy + 70, W + 40, H); const gr = g.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, 'rgba(141,196,123,0)'); gr.addColorStop(0.25, '#86BF74'); gr.addColorStop(1, '#74B165'); g.fillStyle = gr; g.fillRect(0, gy, W, H - gy);
      for (const [col, n] of [['rgba(70,130,70,.35)', Math.round(W / 9)], ['rgba(220,240,170,.5)', Math.round(W / 14)]]) A.line(g, col, 3, (p) => { for (let i = 0; i < n; i++) { const x = r() * W, y = gy + 50 + r() * (H - gy - 60); p.moveTo(x - 6, y); p.lineTo(x - 9, y - 16); p.moveTo(x, y); p.lineTo(x, y - 20); p.moveTo(x + 6, y); p.lineTo(x + 10, y - 15); } });
      for (let i = 0; i < W / 70; i++) { const x = r() * W, y = gy + 60 + r() * (H - gy - 80); g.beginPath(); g.arc(x, y, 5, 0, 7); g.fillStyle = ['#FFFDF6', '#F8D264', '#F2A6B6'][i % 3]; g.fill(); }
    }) });
    // the paper mat that measuring is done on
    const matNode = st.add({ z: 4, alpha: 0 });
    matNode.draw = (g) => { const m = R && R.mat; if (!m) return; put(g, A.sprite('sizes-mat' + key + [m.x, m.y, m.w, m.h].map(Math.round).join('x'), [m.x, m.y, m.w, m.h], (h, s) => {
      h.beginPath(); A.rect(h, m.x, m.y, m.w, m.h, 34, 5, 2); A.paper(h, s, '#FBF4E2', { depth: 1.4, light: 0.04, grain: 0.3, box: m });
      h.save(); h.beginPath(); A.rect(h, m.x, m.y, m.w, m.h, 34, 5, 2); h.clip(); A.line(h, 'rgba(91,143,199,.13)', 2.5, (p) => { for (let x = m.x + 46; x < m.x + m.w; x += 46) { p.moveTo(x, m.y); p.lineTo(x, m.y + m.h); } for (let y = m.y + 46; y < m.y + m.h; y += 46) { p.moveTo(m.x, y); p.lineTo(m.x + m.w, y); } }); h.restore();
    })); };

    /* ---------- helpers ---------- */
    const lerp = (a, b, k) => a + (b - a) * k;
    function flyStep(n, dt) {
      const f = n.fly; if (!f) return;
      f.t += dt / f.dur; const k = Math.min(1, f.t), e = k * k * (3 - 2 * k);
      n.x = lerp(f.x0, f.x1, e); n.y = lerp(f.y0, f.y1, e) - Math.sin(k * Math.PI) * f.lift;
      if (k >= 1) { n.fly = null; f.res(); }
    }
    function fly(n, x, y, o) { o = o || {}; return new Promise((res) => { n.fly = { x0: n.x, y0: n.y, x1: x, y1: y, t: 0, dur: o.dur || 0.36, lift: o.lift == null ? 70 : o.lift, res }; }); }
    const wob = (n) => { K.sfx.whoops(); n.to({ rot: 0.09 }, { dur: 0.08 }).then(() => n.to({ rot: -0.08 }, { dur: 0.1 })).then(() => n.to({ rot: 0 }, { dur: 0.35, ease: 'elastic' })); };
    const bump = (n, k) => { n.tweens.length = 0; n.sx = n.sy = 1; n.to({ sx: k || 1.14, sy: k || 1.14 }, { dur: 0.1, ease: 'out' }).then(() => n.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'elastic' })); };
    const top = (n, z) => { n.z = z; st.root._sorted = false; };
    const sayN = (n) => { if (n >= 1 && n <= SPOKEN_MAX) ctx.say(N(n)); };
    const mixed = (vals) => { let o, guard = 0; do { o = K.shuffle(vals); } while (vals.length > 1 && guard++ < 30 && o.every((v, i) => !i || v > o[i - 1])); return o; };
    const hopT = (t) => fly(t.node, t.node.x, t.node.y, { dur: 0.28, lift: 30 });
    const goHome = (t) => { t.busy = true; return fly(t.node, t.home.x, t.home.y, { dur: 0.3, lift: 40 }).then(() => { t.busy = false; top(t.node, t.z0); }); };

    /* ---------- sunflowers that grow with each round ---------- */
    const grown = [0, 0, 0, 0];
    st.add({ z: 6, draw(g, s) {
      for (let i = 0; i < 4; i++) {
        const x = 54 + i * 70, y = H - 14, k = grown[i]; g.save(); g.translate(x, y);
        const im = k > 0.5 ? PIC.sunflower : PIC.sprout, hh = k > 0.5 ? 60 + 60 * k : 54;
        if (im) { const q = hh / im.height; g.drawImage(im, -im.width * q / 2, -hh, im.width * q, hh); }
        else if (k > 0.5) { g.scale(hh / 170, hh / 170); paintFlower(g, s, 170, 0); } else { A.line(g, '#4F9A4E', 7, (p) => { p.moveTo(0, 0); p.lineTo(0, -26); }); for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * 15, -32, 16, 9, d * -0.5, 0, 7); g.fillStyle = '#6FB565'; g.fill(); } }
        g.restore();
      }
    }, update(dt) { for (let i = 0; i < 4; i++) if (grown[i] > 0 && grown[i] < 1) grown[i] = Math.min(1, grown[i] + dt * 2); } });
    const grow = (i) => { grown[i] = 0.51; K.sfx.pop(); ctx.fx.burst(54 + i * 70, H - 110, { n: 10, colors: ['#F8D264', '#FFFDF6', '#6FB565'] }); };

    /* ---------- the banner that shows a number sentence ---------- */
    const banner = st.add({ z: 70, x: W / 2, y: P.y + 70, sx: 0, sy: 0, text: '' });
    banner.draw = (g, s) => {
      if (!banner.text) return;
      g.font = `800 ${land ? 88 : 64}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const w = Math.min(W - 60, g.measureText(banner.text).width + 80), h = land ? 136 : 106;
      g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 32, 3, 1.5); A.paper(g, s, '#FFFDF6', { depth: 1.6, light: 0.03, box: { x: -w / 2, y: -h / 2, w, h } });
      g.fillStyle = A.C.ink; g.fillText(banner.text, 0, 5, w - 44);
    };
    const showBanner = (t, y) => { banner.text = t; banner.y = y || P.y + 70; banner.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' }); };
    const hideBanner = () => banner.to({ sx: 0, sy: 0 }, { dur: 0.2, ease: 'inOut' }).then(() => { banner.text = ''; });

    /* ---------- things that can be touched and carried ---------- */
    function mkThing(r, o) {
      const t = Object.assign({ glow: false, lit: false, busy: false, tag: null, z0: o.z || 30 }, o);
      const hb = o.hit, n = st.add({ z: t.z0, x: o.x, y: o.y, sx: 0, sy: 0, rot: o.rot || 0, hit: hb, pad: o.pad == null ? 10 : o.pad, pressable: false, label: o.label });
      t.node = n; t.home = { x: o.x, y: o.y };
      n.draw = (g, s) => {
        if (t.glow || t.lit) { g.save(); g.translate(hb.x + hb.w / 2, hb.y + hb.h / 2); glowAt(g, hb.w * 0.5 + 60, hb.h * 0.5 + 60, t.glow ? 0.6 + Math.sin(st.t * 7) * 0.25 : 0.55); g.restore(); }
        if (t.dim) g.globalAlpha *= 0.45;
        o.draw(g, s, t);
        if (t.tag != null) tag(g, s, String(t.tag), hb.x + hb.w / 2, hb.y + hb.h / 2, Math.min(30, hb.h * 0.32));
      };
      n.update = (dt) => flyStep(n, dt);
      n.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back', delay: o.delay == null ? 0.05 + Math.min(8, r.things.length) * 0.06 : o.delay });
      n.onDown = (p) => {
        lastTouch = st.t;
        if (R !== r || r.over || r.locked || t.busy || t.dim) return;
        t.grab = { dx: n.x - p.x, dy: n.y - p.y }; K.sfx.tap(); n.tweens.length = 0; n.sx = n.sy = 1.07; if (r.down) r.down(t);
      };
      n.onMove = (p, e, s) => {
        if (!t.grab || !r.canDrag || !r.canDrag(t)) return;
        if (s.moved > 24) { if (!t.drag) { t.drag = true; top(n, 62); n.fly = null; } n.x = p.x + t.grab.dx; n.y = p.y + t.grab.dy; if (r.moved) r.moved(t); }
      };
      n.onUp = (p) => {
        if (!t.grab) return; t.grab = null; n.sx = n.sy = 1; const was = t.drag; t.drag = false;
        if (R !== r || r.over) return;
        if (was) { top(n, t.z0); r.drop(t, p); } else r.tap(t, p);
      };
      n.onTap = (p) => { if (!p && R === r && !r.over && !r.locked && !t.busy) r.tap(t, null); };
      r.things.push(t); r.nodes.push(n);
      return t;
    }
    const extra = (r, o) => { const n = st.add(o); r.nodes.push(n); return n; };

    /* ---------- rows of things that differ in size ---------- */
    function buildRow(r, kind, n, o) {
      o = o || {}; let slot, vals, axis = 'x';
      const v0 = K.randInt(0, 5);
      if (kind === 'friend') {
        const id = K.pick(Object.keys(FR)), hmax = land ? 430 : 310, fr = n === 2 ? [0.52, 1] : n === 3 ? [0.44, 0.7, 1] : [0.4, 0.58, 0.78, 1];
        const yy = land ? 840 : Math.round(H * 0.7), span = Math.min(P.w, n * (land ? 330 : 172)), asp = aspect(id);
        slot = (i) => ({ x: W / 2 + (i - (n - 1) / 2) * span / n, y: yy });
        vals = fr.map((f) => Math.round(hmax * f));
        mixed(vals).forEach((h, i) => mkThing(r, Object.assign(slot(i), { val: h, label: 'friend', pad: 14, hit: { x: -h * asp / 2, y: -h, w: h * asp, h }, draw: (g, s) => drawFriend(g, s, id, h) })));
        r.marks = { y: yy + 44, slot, n };
      } else if (kind === 'flower') {
        const hmax = land ? 520 : 500, hmin = 180, yy = land ? 850 : Math.round(H * 0.75), span = Math.min(P.w, n * 200);
        slot = (i) => ({ x: W / 2 + (i - (n - 1) / 2) * span / n, y: yy });
        vals = Array.from({ length: n }, (_, i) => Math.round(hmin + (hmax - hmin) * (n > 1 ? i / (n - 1) : 1) + (i > 0 && i < n - 1 ? K.randInt(-14, 14) : 0)));
        const cols = K.shuffle([0, 1, 2, 3, 4]);
        mixed(vals).forEach((h, i) => mkThing(r, Object.assign(slot(i), { val: h, label: 'flower', pad: 4, hit: { x: -62, y: -h - 4, w: 124, h: h + 4 }, draw: (g) => put(g, flowerSp(h, cols[i % 5])) })));
        r.marks = { y: yy + 40, slot, n };
      } else if (kind === 'worm') {
        axis = 'y';
        const lmax = Math.min(P.w - 110, 900), lmin = Math.max(150, lmax * 0.3), dy = Math.min(132, (P.h - 70) / n), y0 = P.y + P.h / 2 - ((n - 1) / 2) * dy + 10, x0 = W / 2 - lmax / 2 + 14;
        slot = (i) => ({ x: x0, y: y0 + i * dy });
        vals = Array.from({ length: n }, (_, i) => Math.round(lmin + (lmax - lmin) * (n > 1 ? i / (n - 1) : 1) + (i > 0 && i < n - 1 ? K.randInt(-12, 12) : 0)));
        mixed(vals).forEach((len, i) => mkThing(r, Object.assign(slot(i), { val: len, label: 'caterpillar', pad: 4, hit: { x: -6, y: -50, w: len + 12, h: 96 }, draw: (g) => put(g, longSp('worm', len, (v0 + i) % 6)) })));
        r.mat = { x: x0 - 70, y: y0 - 96, w: lmax + 124, h: (n - 1) * dy + 196 };
        r.marks = { x: x0 - 36, slot, n };
      } else {   // rolled ribbons with a number
        const k = land ? 1.3 : 1, span = Math.min(P.w, n * 230 * k), yy = P.y + P.h * 0.5;
        slot = (i) => ({ x: W / 2 + (i - (n - 1) / 2) * span / n, y: yy });
        const pool = K.shuffle(Array.from({ length: sk() >= 2 ? 28 : 18 }, (_, i) => i + 2)); vals = pool.slice(0, n).sort((a, b) => a - b);
        mixed(vals).forEach((v, i) => mkThing(r, Object.assign(slot(i), { val: v, label: 'ribbon ' + v, pad: 6, hit: { x: -72 * k, y: -72 * k, w: 144 * k, h: 150 * k }, draw: (g) => put(g, rollSp((v0 + i) % 6, v, k)) })));
        r.mat = { x: W / 2 - span / 2 - 20, y: yy - 150 * k, w: span + 40, h: 330 * k };
        r.marks = { y: yy + 122 * k, slot, n };
      }
      r.vals = vals.slice().sort((a, b) => a - b); r.axis = axis; r.slot = slot;
      // small-to-big marks that show which way the line goes
      extra(r, { z: 8, draw(g) {
        const m = r.marks; for (let i = 0; i < m.n; i++) { const p = m.slot(i), x = m.x == null ? p.x : m.x, y = m.y == null ? p.y : m.y, rr = 11 + (i / Math.max(1, m.n - 1)) * 17, hint = r.hintSlot === i;
          g.beginPath(); g.arc(x, y, rr * (hint ? 1.3 + Math.sin(st.t * 7) * 0.2 : 1), 0, 7); g.fillStyle = hint ? '#FFF0A0' : (r.mat ? 'rgba(46,42,59,.2)' : 'rgba(255,253,246,.75)'); g.fill(); }
      } });
    }
    /** Make a row sortable: drag a thing along the row and the others make room; or tap two to swap them. */
    function sortable(r, hint) {
      r.order = r.things.slice(); r.canDrag = () => true; r.sel = null;
      const place = () => r.order.forEach((t, i) => { const p = r.slot(i); t.home = p; if (!t.grab && !t.drag) { t.node.fly = null; t.node.to({ x: p.x, y: p.y }, { dur: 0.22 }); } });
      const at = (t) => { let best = 0, bd = 1e9; for (let i = 0; i < r.order.length; i++) { const p = r.slot(i), d = Math.abs(r.axis === 'x' ? t.node.x - p.x : t.node.y - p.y); if (d < bd) { bd = d; best = i; } } return best; };
      const sorted = () => r.order.every((t, i) => t.val === r.vals[i]);
      const judge = (t, from) => {
        for (const q of r.things) q.glow = false; r.hintSlot = -1;
        const i = r.order.indexOf(t);
        if (sorted()) { r.things.forEach((q, k) => ctx.after(k * 90, () => bump(q.node))); finish({ banner: r.doneBanner }); return; }
        if (i === from) return;
        if (r.vals[i] === t.val) { K.sfx.step(i); ctx.fx.burst(t.home.x, t.home.y - 40, { n: 6 }); return; }
        r.miss++; wob(t.node); if (r.miss % 2 === 1) ctx.say(hint);
        if (r.miss >= 2) { const k = r.order.findIndex((q, j) => q.val !== r.vals[j]); r.hintSlot = k; r.things.find((q) => q.val === r.vals[k]).glow = true; }
      };
      r.down = (t) => { t.from = r.order.indexOf(t); };
      r.moved = (t) => { const j = at(t), i = r.order.indexOf(t); if (j !== i) { r.order.splice(i, 1); r.order.splice(j, 0, t); K.sfx.tap(); place(); } };
      r.drop = (t) => { place(); judge(t, t.from); };
      r.tap = (t) => {
        if (r.sel && r.sel !== t) { const a = r.sel, i = r.order.indexOf(a), j = r.order.indexOf(t); r.order[i] = t; r.order[j] = a; a.glow = false; r.sel = null; K.sfx.whoosh(); place(); judge(a, i); }
        else if (r.sel === t) { t.glow = false; r.sel = null; place(); }
        else { for (const q of r.things) q.glow = false; r.sel = t; t.glow = true; place(); bump(t.node, 1.08); }
      };
      r.answer = r.vals.slice();
    }

    const SET = {};
    SET.order = (r, o) => {
      const kinds = L === 1 ? ['friend'] : land ? ['flower', 'worm', 'flower', 'worm', 'friend'] : ['flower', 'worm'];
      let kind = o.kind || K.pick(kinds), guard = 0; while (!o.kind && 'order' + kind === lastKey && kinds.length > 1 && guard++ < 20) kind = K.pick(kinds);
      const n = o.n || (kind === 'friend' ? (L === 1 ? 3 : 4) : kind === 'flower' ? (land ? Math.min(5, 4 + sk()) : 4) : Math.min(5, 4 + (sk() >= 2 ? 1 : 0)));
      r.key = kind; buildRow(r, kind, n);
      const dir = kind === 'friend' ? SAY.sb : kind === 'flower' ? SAY.st : SAY.sl;
      r.say = `${SAY.line} ${dir}`; sortable(r, dir);
    };
    SET.ordernum = (r, o) => {
      const n = o.n || (land ? Math.min(5, 3 + sk()) : 3);
      buildRow(r, 'roll', n); r.key = r.vals.join(',');
      r.say = `${SAY.numSays} ${SAY.sl}`; sortable(r, SAY.sl); r.doneBanner = r.vals.join(' < ');
    };
    SET.find = (r, o) => {
      const sets = L === 1 ? [['friend', 'big', 'small'], ['flower', 'tall', 'short'], ['worm', 'long', 'short']] : [['friend', 'biggest', 'smallest'], ['flower', 'tallest', 'shortest'], ['worm', 'longest', 'shortest']];
      let set, word, guard = 0;
      do { set = K.pick(sets); word = set[Math.random() < 0.5 ? 1 : 2]; } while ('find' + set[0] + word === lastKey && guard++ < 20);
      if (o.kind) { set = sets.find((q) => q[0] === o.kind); word = set[o.min ? 2 : 1]; }
      const kind = set[0], n = o.n || (L === 1 ? 2 : kind === 'friend' ? (land ? 4 : 3) : kind === 'flower' ? (land ? Math.min(5, 4 + sk()) : 4) : 4);
      buildRow(r, kind, n); r.marks = { n: 0 }; if (n === 2 && Math.random() < 0.5) { const [a, b] = r.things; const pa = { x: a.node.x, y: a.node.y }; a.node.x = b.node.x; a.node.y = b.node.y; b.node.x = pa.x; b.node.y = pa.y; }
      const want = word === set[1] ? r.vals[n - 1] : r.vals[0];
      r.key = kind + word; r.answer = want; r.say = SAY[word]; r.canDrag = null;
      r.tap = (t) => {
        if (t.val === want) { for (const q of r.things) q.glow = false; t.lit = true; K.sfx.ding(); bump(t.node); const b = st.bounds(t.node); ctx.fx.burst(b.x + b.w / 2, b.y + b.h / 2, { n: 12 }); finish(); }
        else { r.miss++; wob(t.node); ctx.say(`${SAY.again} ${r.say}`); if (r.miss >= 2) r.things.find((q) => q.val === want).glow = true; }
      };
    };
    /* the bowl that fits each friend */
    SET.match = (r, o) => {
      const n = o.n || (L === 1 && sk() < 1 ? 2 : 3), id = K.pick(Object.keys(FR)), asp = aspect(id);
      const hmax = land ? 360 : 260, fr = n === 2 ? [0.56, 1] : [0.46, 0.7, 1], bw = land ? (n === 2 ? [130, 214] : [116, 166, 222]) : (n === 2 ? [116, 188] : [100, 142, 188]);
      const fy = land ? 650 : Math.round(H * 0.56), by = land ? 872 : Math.round(H * 0.8), span = Math.min(P.w, n * (land ? 330 : 170));
      const xs = (i) => W / 2 + (i - (n - 1) / 2) * span / n;
      r.key = id + n; r.answer = n; r.say = SAY.bowls; r.sel = null;
      const fo = K.shuffle(fr.map((_, i) => i)), bo = mixed(fr.map((_, i) => i)), col = K.randInt(0, 5);
      const friends = fo.map((rank, i) => { const h = Math.round(hmax * fr[rank]); return mkThing(r, { x: xs(i), y: fy, role: 'friend', rank, val: h, label: 'friend ' + (rank + 1), pad: 8, hit: { x: -h * asp / 2, y: -h, w: h * asp, h: h + 30 }, hop: 0, draw: (g, s, t) => { g.translate(0, -Math.abs(Math.sin(t.hop * 10)) * 22 * Math.min(1, t.hop)); t.hop = Math.max(0, t.hop - 0.016); drawFriend(g, s, id, h); } }); });
      const bowls = bo.map((rank, i) => { const w = bw[rank]; return mkThing(r, { x: xs(i), y: by, z: 34, role: 'bowl', rank, val: w, label: 'bowl ' + (rank + 1), pad: 14, hit: { x: -w / 2, y: -w * 0.6, w, h: w * 0.62 }, draw: (g) => put(g, bowlSp(w, col)) }); });
      r.canDrag = (t) => t.role === 'bowl' && !t.done;
      const attempt = (b, f) => {
        for (const q of r.things) q.glow = false; r.sel = null;
        if (f.done) { goHome(b); return; }
        if (b.rank === f.rank) {
          b.done = f.done = true; b.busy = true; top(b.node, 34); fly(b.node, f.node.x + f.val * asp * 0.34, f.node.y + 26, { dur: 0.25, lift: 30 }); K.sfx.ding(); f.hop = 0.8; ctx.fx.burst(f.node.x, f.node.y - f.val * 0.6, { n: 10 });
          if (bowls.every((q) => q.done)) finish();
        } else {
          r.miss++; wob(b.node); goHome(b); ctx.say(b.rank > f.rank ? SAY.tooBig : SAY.tooSmall);
          if (r.miss >= 2) { const k = Math.min(...bowls.filter((q) => !q.done).map((q) => q.rank)); bowls.find((q) => q.rank === k).glow = true; friends.find((q) => q.rank === k).glow = true; }
        }
      };
      r.tap = (t) => {
        if (t.role === 'bowl') { if (t.done) return; for (const q of r.things) q.glow = false; if (r.sel === t) { r.sel = null; return; } r.sel = t; t.glow = true; bump(t.node); for (const f of friends) if (!f.done) f.hop = 0.35; }
        else if (r.sel) attempt(r.sel, t); else { t.hop = 0.5; K.sfx.tap(); }
      };
      r.drop = (t) => { const f = friends.find((q) => Math.abs(t.node.x - q.node.x) < Math.max(90, q.val * asp * 0.6) && t.node.y < q.node.y + 90 && t.node.y > q.node.y - q.val - 40); if (f) attempt(t, f); else goHome(t); };
    };
    /* two things: which is longer? drag one beside the other to check */
    SET.compare = (r, o) => {
      const kind = K.pick(['ribbon', 'pencil', 'worm']), lmax = Math.min(P.w - 100, 780), gap = [0.24, 0.17, 0.11, 0.08][Math.min(3, sk())];
      const la = Math.round(lmax * K.rand(0.8, 1)), lb = Math.round(la * (1 - gap)), shorter = o.shorter == null ? Math.random() < 0.35 : o.shorter, flip = Math.random() < 0.5;
      const lens = flip ? [lb, la] : [la, lb], ys = land ? [P.y + P.h * 0.34, P.y + P.h * 0.66] : [P.y + P.h * 0.3, P.y + P.h * 0.62], c0 = K.randInt(0, 5), mx = W / 2 - lmax / 2 - 30;
      r.mat = land ? { x: mx, y: P.y + 80, w: lmax + 60, h: P.h - 130 } : { x: mx, y: P.y + 60, w: lmax + 60, h: P.h * 0.78 }; r.key = String(la); r.answer = shorter ? lb : la; r.aligned = false;
      r.say = `${shorter ? SAY.shorter : SAY.longer} ${SAY.check}`; r.show = shorter ? SAY.shorter : SAY.longer;
      lens.forEach((len, i) => mkThing(r, { x: i ? mx + lmax + 30 - len : mx + 30, y: ys[i], val: len, label: i ? 'second one' : 'first one', pad: 6, hit: { x: -6, y: -46, w: len + 12, h: 92 }, draw: (g) => put(g, longSp(kind, len, (c0 + i * 2) % 6)) }));
      const [a, b] = r.things;
      extra(r, { z: 28, draw(g) {
        if (!r.aligned) return; const x = Math.min(a.node.x, b.node.x), y0 = Math.min(a.node.y, b.node.y) - 70, y1 = Math.max(a.node.y, b.node.y) + 70;
        g.save(); g.setLineDash([12, 10]); g.lineWidth = 4; g.strokeStyle = 'rgba(46,42,59,.45)'; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.moveTo(x + lb, y0); g.lineTo(x + lb, y1); g.stroke(); g.restore();
        g.fillStyle = 'rgba(248,210,100,.5)'; const lg = a.val > b.val ? a : b; g.fillRect(x + lb, lg.node.y - 40, la - lb, 80);
      } });
      const align = (t, other) => { let y = other.node.y + (t.node.y >= other.node.y ? 104 : -104); if (y > r.mat.y + r.mat.h - 56) y = other.node.y - 104; if (y < r.mat.y + 56) y = other.node.y + 104; const ax = r.mat.x + 30; t.home = { x: ax, y }; t.busy = true; if (Math.abs(other.node.x - ax) > 2) fly(other.node, ax, other.node.y, { dur: 0.25, lift: 0 }); return fly(t.node, ax, y, { dur: 0.25, lift: 0 }).then(() => { t.busy = false; r.aligned = true; K.sfx.step(3); }); };
      r.canDrag = () => true;
      r.down = () => { r.aligned = false; };
      r.drop = (t) => {
        const other = t === a ? b : a;
        if (Math.abs(t.node.y - other.node.y) < 190) align(t, other);
        else { t.node.x = K.clamp(t.node.x, r.mat.x + 10, r.mat.x + r.mat.w - t.val - 10); t.node.y = K.clamp(t.node.y, r.mat.y + 50, r.mat.y + r.mat.h - 50); r.aligned = Math.abs(a.node.x - b.node.x) < 8; }
      };
      r.tap = (t) => {
        r.aligned = Math.abs(a.node.x - b.node.x) < 8;
        if (t.val === r.answer) { for (const q of r.things) q.glow = false; t.lit = true; K.sfx.ding(); bump(t.node, 1.05); ctx.fx.burst(t.node.x + t.val / 2, t.node.y, { n: 12 }); const other = t === a ? b : a; if (!r.aligned) align(other, t); finish({ say: shorter ? SAY.isShorter : SAY.isLonger }); }
        else { r.miss++; wob(t.node); ctx.say(`${SAY.check} ${r.show}`); const other = t === a ? b : a; if (!r.aligned) align(t, other); if (r.miss >= 2) other.glow = true; }
      };
    };
    /* measuring */
    const U = land ? 92 : 90, MAXU = land ? Math.min(10, Math.floor((P.w - 80) / U)) : 5;
    function longThing(r, n, y, x0, v, kind) { return mkThing(r, { x: x0, y, role: 'obj', val: n, label: 'thing', pad: 0, hit: { x: 0, y: -40, w: n * U, h: 80 }, draw: (g) => put(g, longSp(kind, n * U, v)) }); }
    SET.blocks = (r, o) => {
      const n = o.n || pick2(2, Math.min(MAXU, 4 + sk() * 2), 'blocks'), kind = K.pick(['pencil', 'worm', 'ribbon']), x0 = W / 2 - (MAXU * U) / 2, yo = P.y + P.h * (land ? 0.24 : 0.3), yb = yo + 54 + U / 2;
      const py = land ? P.y + P.h * 0.78 : P.y + P.h * 0.74;
      r.mat = { x: x0 - 40, y: yo - 90, w: MAXU * U + 80, h: U + 190 }; r.key = String(n); r.answer = n; r.k = 0; r.say = `${SAY.howLong} ${SAY.lay}`; r.canDrag = (t) => t.role === 'next';
      const obj = longThing(r, n, yo, x0, K.randInt(0, 5), kind);
      extra(r, { z: 6, draw(g) { g.save(); g.setLineDash([10, 10]); g.lineWidth = 4; g.strokeStyle = 'rgba(46,42,59,.3)'; g.beginPath(); g.moveTo(x0, yo - 50); g.lineTo(x0, yb + U / 2 + 8); if (r.k >= n) { g.moveTo(x0 + n * U, yo - 50); g.lineTo(x0 + n * U, yb + U / 2 + 8); } g.stroke(); g.restore(); } });
      extra(r, { z: 20, x: W / 2, y: py, draw(g, s) { g.beginPath(); A.rect(g, -170, 20, 340, 40, 16, 4, 1); A.paper(g, s, '#C08A5A', { depth: 1.1, light: 0.06, box: { x: -170, y: 20, w: 340, h: 40 } }); for (const [x, y, v] of [[-100, -18, 0], [100, -18, 1], [-52, -24, 1], [52, -22, 0]]) { g.save(); g.translate(x, y); g.rotate(x / 900); put(g, blockSp(U, v)); g.restore(); } } });
      const spawn = () => { const t = mkThing(r, { x: W / 2, y: py - 30 - U * 0.5, z: 36, delay: 0.1, role: 'next', label: 'block', pad: 14, hit: { x: -U / 2, y: -U / 2, w: U, h: U }, draw: (g) => put(g, blockSp(U, r.k % 2)) }); r.next = t; return t; };
      const place = (t) => {
        if (t.role !== 'next' || r.k >= n) { hopT(t); K.sfx.tap(); return; }
        const k = ++r.k; t.role = 'laid'; t.busy = true; top(t.node, 34); K.sfx.whoosh();
        if (k < n) spawn();
        fly(t.node, x0 + (k - 0.5) * U, yb, { dur: 0.34, lift: 90 }).then(() => { if (R !== r) return; t.tag = k; K.sfx.step(k - 1); sayN(k); ctx.fx.burst(t.node.x, t.node.y, { n: 5 }); if (k === n) { bump(obj.node, 1.04); finish({ banner: `${n} ${n === 1 ? 'block' : 'blocks'}`, bannerY: land ? P.y + P.h * 0.74 : P.y + P.h * 0.6 }); } });
      };
      r.tap = place; r.drop = place;
      spawn();
    };
    SET.ruler = (r, o) => {
      const M = land ? Math.min(12, Math.floor((P.w - 100) / 96)) : 5, u = land ? 96 : 86, n = o.n || pick2(2, Math.min(M, 5 + sk() * 3), 'ruler'), kind = K.pick(['pencil', 'worm', 'ribbon']);
      const x0 = W / 2 - (M * u) / 2, yo = P.y + P.h * (land ? 0.26 : 0.3), ry = yo + 56;
      r.mat = { x: x0 - 70, y: yo - 100, w: M * u + 140, h: land ? 520 : 600 }; r.key = String(n); r.answer = n; r.aligned = false; r.say = SAY.ruler; r.bad = {}; r.hintIdx = -1;
      mkThing(r, { x: x0, y: yo, role: 'obj', val: n, label: 'thing', pad: 0, hit: { x: 0, y: -40, w: n * u, h: 80 }, draw: (g) => put(g, longSp(kind, n * u, K.randInt(0, 5))) });
      extra(r, { z: 6, draw(g) { g.save(); g.setLineDash([10, 10]); g.lineWidth = 4; g.strokeStyle = 'rgba(46,42,59,.3)'; g.beginPath(); g.moveTo(x0, yo - 50); g.lineTo(x0, ry + 30); if (r.aligned) { g.moveTo(x0 + n * u, yo - 50); g.lineTo(x0 + n * u, ry + 30); } g.stroke(); g.restore(); } });
      const ruler = mkThing(r, { x: x0 + (land ? K.randInt(-30, 40) : 14), y: ry + (land ? 250 : 300), rot: land ? 0.035 : 0.06, z: 36, role: 'ruler', label: 'ruler', pad: 6, hit: { x: -RM, y: 0, w: M * u + RM * 2, h: RH }, draw: (g, s) => {
        put(g, rulerSp(u, M));
        for (let i = 0; i <= M; i++) { if (r.bad[i]) { g.fillStyle = 'rgba(248,220,140,.75)'; g.fillRect(i * u - 24, 36, 48, 46); } if (r.hintIdx === i || (r.over && i === n)) { g.save(); g.translate(i * u, 58); glowAt(g, 60, 60, 0.7 + Math.sin(st.t * 7) * 0.25); g.restore(); tag(g, s, String(i), i * u, 58, 28); } }
      } });
      ruler.glow = false;
      const snap = () => { ruler.busy = true; ruler.node.to({ rot: 0 }, { dur: 0.25 }); return fly(ruler.node, x0, ry, { dur: 0.3, lift: 0 }).then(() => { if (R !== r) return; ruler.busy = false; r.aligned = true; K.sfx.ding(); ctx.fx.burst(x0, ry, { n: 6 }); ctx.prompt(SAY.end); }); };
      r.canDrag = (t) => t.role === 'ruler' && !r.aligned;
      r.drop = (t) => { if (Math.abs(t.node.x - x0) < 170 && Math.abs(t.node.y - ry) < 200) snap(); else { t.node.x = K.clamp(t.node.x, 20 + RM, W - 20 - RM - M * u * 0.5); t.node.y = K.clamp(t.node.y, P.y, P.y + P.h - RH); } };
      r.tap = (t, p) => {
        if (t.role !== 'ruler') { hopT(t); K.sfx.tap(); return; }
        if (!r.aligned) { snap(); return; }
        const i = p ? K.clamp(Math.round((p.x - t.node.x) / u), 0, M) : n;
        if (i === n) { K.sfx.ding(); ctx.fx.burst(x0 + n * u, ry + 58, { n: 12 }); finish({ banner: `${n} ${n === 1 ? 'block' : 'blocks'} long`, bannerY: ry + (land ? 230 : 280) }); }
        else if (!r.bad[i]) { r.miss++; r.bad[i] = true; wob(t.node); ctx.say(`${SAY.again} ${SAY.end}`); if (r.miss >= 2) r.hintIdx = n; }
      };
    };
    SET.longer = (r, o) => {
      let a, d, guard = 0; do { a = K.randInt(3, MAXU); d = K.randInt(1, Math.min(a - 1, 2 + sk())); } while ('longer' + a + '-' + d === lastKey && guard++ < 20);
      if (o.a) { a = o.a; d = o.d; }
      const b = a - d, x0 = W / 2 - (MAXU * U) / 2, flip = Math.random() < 0.5, lens = flip ? [b, a] : [a, b], rowH = land ? 300 : 360, y0 = P.y + (land ? 96 : 190), c0 = K.randInt(0, 5), kind = K.pick(['pencil', 'ribbon', 'worm']);
      r.mat = { x: x0 - 40, y: y0 - 80, w: MAXU * U + 80, h: rowH + U + 150 }; r.key = a + '-' + d; r.answer = d; r.k = 0; r.say = `${SAY.more} ${SAY.stick}`; r.canDrag = null; r.same = false;
      lens.forEach((len, row) => {
        const y = y0 + row * rowH; longThing(r, len, y, x0, (c0 + row * 3) % 6, kind);
        for (let i = 0; i < len; i++) mkThing(r, { x: x0 + (i + 0.5) * U, y: y + 54 + U / 2, role: 'block', row, idx: i, extra: len === a && i >= b, label: 'block', pad: 0, hit: { x: -U / 2, y: -U / 2, w: U, h: U }, draw: (g) => put(g, blockSp(U, row)) });
      });
      extra(r, { z: 6, draw(g) {
        g.save(); g.setLineDash([10, 10]); g.lineWidth = 4; g.strokeStyle = 'rgba(46,42,59,.3)'; g.beginPath(); g.moveTo(x0, y0 - 50); g.lineTo(x0, y0 + rowH + U + 60); g.moveTo(x0 + b * U, y0 - 50); g.lineTo(x0 + b * U, y0 + rowH + U + 60); g.stroke(); g.restore();
        if (r.same) { g.fillStyle = 'rgba(46,143,138,.14)'; g.fillRect(x0, y0 - 50, b * U, rowH + U + 110); }
      } });
      r.tap = (t) => {
        if (t.role !== 'block') { hopT(t); K.sfx.tap(); return; }
        if (!t.extra) { r.miss++; r.same = true; wob(t.node); ctx.say(`${SAY.samePart} ${SAY.stick}`); if (r.miss >= 2) for (const q of r.things) if (q.extra && !q.lit) q.glow = true; return; }
        if (t.lit) { bump(t.node); return; }
        t.glow = false; t.lit = true; t.tag = ++r.k; bump(t.node); K.sfx.step(r.k - 1); sayN(r.k); ctx.fx.burst(t.node.x, t.node.y, { n: 6 });
        if (r.k === d) finish({ banner: `${a} − ${b} = ${d}`, bannerY: y0 + rowH * 0.5 + 40 });
      };
    };
    /* heavier and lighter on the see-saw */
    SET.seesaw = (r, o) => {
      const n = o.n || (sk() >= 1 ? 3 : 2), lighter = o.lighter == null ? Math.random() < 0.4 : o.lighter;
      const cx = W / 2, cy = P.y + P.h * (land ? 0.46 : 0.42), Ls = land ? 380 : 216, hy = land ? cy + 300 : cy + 350, span = land ? 720 : 440;
      const ws = K.shuffle([1, 2, 3].slice(0, n)), szs = K.shuffle(land ? [112, 138, 164] : [92, 112, 132]).slice(0, n), cols = K.shuffle([0, 1, 2, 3, 4, 5]);
      r.say = SAY.seesaw; r.ask = lighter ? SAY.lighter : SAY.heavier; r.key = ws.join(''); r.seat = [null, null]; r.ang = 0; r.av = 0; r.asked = false; r.answer = lighter ? 1 : n;
      const seatPos = (k, t) => { const d = k ? 1 : -1, c = Math.cos(r.ang), s2 = Math.sin(r.ang), lx = d * Ls * 0.76, ly = -17; return { x: cx + lx * c - ly * s2, y: cy + lx * s2 + ly * c }; };
      const seesaw = extra(r, { z: 20, x: cx, y: cy, sx: 0, sy: 0 });
      seesaw.draw = (g, s) => {
        g.beginPath(); A.cut(g, [[-78, 112], [0, -6], [78, 112]], [14, 20, 14], 0.8, 3); A.paper(g, s, '#2F8F8A', { depth: 1.2, light: 0.08, box: { x: -78, y: -6, w: 156, h: 118 } });
        g.beginPath(); g.ellipse(0, 114, 130, 14, 0, 0, 7); g.fillStyle = 'rgba(46,60,50,.18)'; g.fill();
        g.save(); g.rotate(r.ang);
        g.beginPath(); A.rect(g, -Ls, -16, Ls * 2, 30, 14, 5, 0.6); A.paper(g, s, '#D9A05E', { depth: 1.2, light: 0.08, box: { x: -Ls, y: -16, w: Ls * 2, h: 30 } });
        for (const d of [-1, 1]) { g.beginPath(); A.rect(g, d * Ls - (d > 0 ? 22 : 0), -40, 22, 34, 8, 6, 0.4); A.paper(g, s, '#E8664A', { shadow: 0.5, light: 0.06 }); }
        g.beginPath(); g.arc(0, 0, 15, 0, 7); A.paper(g, s, '#F2B33D', { shadow: 0.5, light: 0.08 });
        g.restore();
      };
      seesaw.update = (dt) => {
        const wl = r.seat[0] ? r.seat[0].w : 0, wr = r.seat[1] ? r.seat[1].w : 0, target = wl === wr ? 0 : wr > wl ? 0.19 : -0.19;
        r.av += ((target - r.ang) * 46 - r.av * 7.5) * dt; r.ang += r.av * dt;
        for (const k of [0, 1]) { const t = r.seat[k]; if (t && !t.busy && !t.drag) { const p = seatPos(k); t.node.x = p.x; t.node.y = p.y; t.node.rot = r.ang; } }
      };
      seesaw.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' });
      ws.forEach((w, i) => { const sz = szs[i]; mkThing(r, { x: cx + (i - (n - 1) / 2) * span / n, y: hy, z: 32, w, val: w, seat: null, label: 'parcel ' + (i + 1), pad: 12, hit: { x: -sz / 2, y: -sz - 20, w: sz, h: sz + 20 }, draw: (g) => put(g, parcelSp(sz, cols[i])) }); });
      const both = () => r.seat[0] && r.seat[1];
      const sit = (t, k) => { t.busy = true; t.seat = k; r.seat[k] = t; t.glow = false; top(t.node, 32); const p = seatPos(k); K.sfx.whoosh(); fly(t.node, p.x, p.y, { dur: 0.32, lift: 110 }).then(() => { if (R !== r) return; t.busy = false; K.sfx.drum('tom'); r.av += (k ? 1 : -1) * 0.5; if (both() && !r.asked) ctx.after(800, () => { if (R === r && !r.over && both()) { r.asked = true; ctx.prompt(r.ask); } }); }); };
      const leave = (t) => { r.seat[t.seat] = null; t.seat = null; t.node.rot = 0; r.asked = false; return goHome(t); };
      r.canDrag = (t) => t.seat == null;
      r.drop = (t) => { let k = t.node.x < cx ? 0 : 1; if (Math.abs(t.node.y - cy) < 260 && (!r.seat[k] || !r.seat[1 - k])) { if (r.seat[k]) k = 1 - k; sit(t, k); } else goHome(t); };
      r.tap = (t) => {
        if (t.seat == null) { const k = !r.seat[0] ? 0 : !r.seat[1] ? 1 : -1; if (k < 0) { hopT(t); K.sfx.tap(); } else sit(t, k); return; }
        if (!both()) { leave(t); return; }
        if (!r.asked) { r.asked = true; ctx.prompt(r.ask); return; }
        const other = r.seat[1 - t.seat], right = lighter ? t.w < other.w : t.w > other.w;
        if (right) {
          for (const q of r.things) q.glow = false; K.sfx.ding(); bump(t.node); ctx.fx.burst(t.node.x, t.node.y - 60, { n: 12 });
          const rest = r.things.filter((q) => q.seat == null && !q.dim);
          if (rest.length) { r.locked = true; ctx.after(700, () => { if (R !== r) return; other.dim = true; leave(other).then(() => { r.locked = false; }); rest[0].glow = true; ctx.prompt(SAY.seesaw); }); }
          else { t.lit = true; finish({ say: lighter ? SAY.isLighter : SAY.isHeavier }); }
        } else { r.miss++; K.sfx.whoops(); bump(t.node, 0.88); r.av += (r.ang > 0 ? 1 : -1) * 1.6; ctx.say(`${SAY.again} ${r.ask}`); if (r.miss >= 2) other.glow = true; }
      };
    };
    const pick2 = (a, b, tg) => { let n, guard = 0; do { n = K.randInt(a, b); } while (tg + n === lastKey && a !== b && guard++ < 20); return n; };

    const MODES = L === 1 ? ['order', 'match', 'find'] : L === 2 ? ['order', 'compare', 'find', 'match'] : ['blocks', 'ruler', 'longer', 'seesaw', 'ordernum'];
    function clearRound() {
      if (!R) return; const old = R;
      for (const n of old.nodes) { n.onTap = n.onDown = null; n.fly = null; n.to({ sx: 0, sy: 0 }, { dur: 0.22, ease: 'inOut' }).then(() => n.remove()); }
      matNode.to({ alpha: 0 }, { dur: 0.2 });
      ctx.after(400, () => old.nodes.forEach((n) => n.remove()));
    }
    function newRound(mode, o) {
      if (R) clearRound();
      if (!mode) {
        if (rounds === 0) mode = MODES[0];
        else { if (!bag.length) bag = K.shuffle(MODES); if (bag[0] === lastMode && bag.length > 1) bag.push(bag.shift()); mode = bag.shift(); }
      }
      const r = R = { mode, nodes: [], things: [], miss: 0, over: false, locked: false, hintSlot: -1 };
      hideBanner(); SET[mode](r, o || {});
      matNode.tweens.length = 0; matNode.alpha = 0; if (r.mat) matNode.to({ alpha: 1 }, { dur: 0.3 });
      lastKey = mode + (r.key == null ? r.answer : r.key); lastMode = mode; lastTouch = st.t; rounds++;
      K.sfx.pop();
      ctx.prompt(r.say, { show: r.show });
    }
    async function finish(x) {
      const r = R; if (r.over) return; r.over = true; x = x || {};
      await ctx.wait(350); if (R !== r) return;
      K.sfx.sparkle(); ctx.fx.burst(W / 2, P.y + P.h * 0.4, { n: 16 });
      if (x.banner && L >= 2) showBanner(x.banner, x.bannerY);
      if (x.say) await Promise.all([ctx.say(x.say), ctx.wait(1500)]); else await ctx.wait(x.banner && L >= 2 ? 1900 : 1100);
      if (R !== r) return;
      if (r.miss === 0) skill = Math.min(4, skill + 0.5); else if (r.miss >= 2) skill = Math.max(0, skill - 1);
      won++; grow(won - 1);
      await ctx.wait(900); if (R !== r) return;
      hideBanner(); clearRound(); R = null;
      await ctx.wait(420); if (R) return;
      if (won >= 4) { await ctx.celebrate({ ms: 3400 }); won = 0; grown.fill(0); if (R) return; }
      newRound();
    }
    // a quiet spell: something that can be moved gives a little hop
    ctx.every(1500, () => {
      if (!R || R.over || R.locked || st.t - lastTouch < 9) return; lastTouch = st.t - 3;
      const t = R.things.find((q) => !q.busy && !q.done && !q.lit && !q.dim && q.role !== 'obj' && q.role !== 'friend' && q.role !== 'laid' && q.seat == null && (q.role !== 'block' || q.extra));
      if (t && !t.node.fly) { hopT(t); K.sfx.tap(); }
    });

    K._sizes = {   // for browser tests
      get R() { return R; }, get skill() { return skill; }, set skill(v) { skill = v; }, get won() { return won; }, unit: st.unit, U,
      jump(mode, o) { if (R) R.over = true; newRound(mode, o); return R.answer; },
      mid(t) { const h = t.node.hit; return { x: (t.node.x + h.x + h.w / 2) * st.unit, y: (t.node.y + h.y + h.h / 2) * st.unit }; },
    };
    ctx.onExit(() => { K._sizes = null; });
    ctx.after(350, () => newRound());
  }

  function icon(g, w) {
    const u = w / 300, sky = g.createLinearGradient(0, 0, 0, w); sky.addColorStop(0, '#A9D8EC'); sky.addColorStop(0.7, '#EEF4DD'); g.fillStyle = sky; g.fillRect(0, 0, w, w);
    g.fillStyle = '#A6D095'; g.beginPath(); g.ellipse(w * 0.25, w * 0.86, w * 0.6, w * 0.22, 0, 0, 7); g.fill();
    g.fillStyle = '#86BF74'; g.beginPath(); g.ellipse(w * 0.6, w * 1.0, w * 0.8, w * 0.26, 0, 0, 7); g.fill();
    const im = PIC.bear;
    [[62, 92], [140, 150], [232, 216]].forEach(([x, h], i) => {
      g.save(); g.translate(x * u, 262 * u);
      g.fillStyle = 'rgba(46,60,50,.2)'; g.beginPath(); g.ellipse(0, 0, h * 0.28 * u, h * 0.05 * u, 0, 0, 7); g.fill();
      if (im) { const k = (h * u) / im.height; g.drawImage(im, -im.width * k / 2, -h * u, im.width * k, h * u); }
      else { g.fillStyle = '#B5774A'; g.beginPath(); g.ellipse(0, -h * 0.32 * u, h * 0.26 * u, h * 0.32 * u, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -h * 0.74 * u, h * 0.24 * u, 0, 7); g.fill(); for (const k of [-1, 1]) { g.beginPath(); g.arc(k * h * 0.19 * u, -h * 0.93 * u, h * 0.09 * u, 0, 7); g.fill(); } g.fillStyle = '#F3DDB8'; g.beginPath(); g.ellipse(0, -h * 0.68 * u, h * 0.1 * u, h * 0.08 * u, 0, 0, 7); g.fill(); g.fillStyle = '#2E2A3B'; for (const k of [-1, 1]) { g.beginPath(); g.arc(k * h * 0.09 * u, -h * 0.79 * u, h * 0.025 * u, 0, 7); g.fill(); } }
      g.restore();
      g.fillStyle = '#FFFDF6'; g.beginPath(); g.arc(x * u, 282 * u, (5 + i * 4) * u, 0, 7); g.fill();
    });
  }

  K.game({ id: 'sizes', title: 'Big and Small', voice: 'sizes', group: 'arcade', subject: 'math', age: 3, order: 15, icon, start, lines, resize: () => K.go('sizes') });
})();
