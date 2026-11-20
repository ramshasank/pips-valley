/* Pip's Playhouse — art for Letter Monsters.
   A letter monster is the lowercase letter itself, cut fat and round from ONE colour of paper
   (closed bowls are backed with the same paper, a touch deeper), with big shiny eyes set close
   together, a small smile, blush and two little feet.
   Also the strokes for writing every letter, big and small, and the paper fingertip that shows how.
   Also: the meadow they live in, the picture cards for three-letter words, and the things that
   come alive off those cards. */
(function () {
  'use strict';
  const A = K.art; let V; // valley art loads after this file
  const Lt = (A.letters = {});
  const TAU = Math.PI * 2;

  /* ---------------- letter monsters ---------------- */
  const VOWELS = 'aeiou';
  const WARM = ['#E8664A', '#EE8A4E', '#E36F8C', '#F0A23C', '#D9583F'];
  const COOL = ['#2F8F8A', '#5B8FC7', '#7A5BA6', '#5FA05A', '#3F7FB8', '#8C5E9E', '#3E9C9C'];
  Lt.color = (ch) => (VOWELS.includes(ch) ? WARM[VOWELS.indexOf(ch)] : COOL[(ch.charCodeAt(0) - 97) % COOL.length]);

  /* Where the face sits, in ems from the middle of the letter's ink (x) and its baseline (y), and
     how big it is. Bowls carry a big face in the tummy; other letters wear it on a stroke. */
  const FACE = {
    a: [-0.03, -0.25, 0.95], b: [0.05, -0.25, 0.95], c: [-0.12, -0.26, 0.8], d: [-0.05, -0.25, 0.95], e: [-0.13, -0.2, 0.72],
    f: [-0.03, -0.26, 0.74], g: [-0.04, -0.27, 0.95], h: [-0.15, -0.3, 0.76], i: [0, -0.24, 0.76], j: [0.07, -0.24, 0.74],
    k: [-0.13, -0.3, 0.76], l: [0, -0.38, 0.76], m: [0, -0.22, 0.72], n: [-0.14, -0.24, 0.76], o: [0, -0.25, 1],
    p: [0.05, -0.26, 0.95], q: [-0.05, -0.26, 0.95], r: [-0.08, -0.24, 0.76], s: [0, -0.26, 0.7], t: [-0.02, -0.25, 0.74],
    u: [0.14, -0.26, 0.76], v: [0, -0.13, 0.7], w: [0, -0.2, 0.66], x: [0, -0.255, 0.78], y: [0.02, -0.2, 0.68], z: [0, -0.26, 0.66],
  };

  const mcv = document.createElement('canvas'); const mg = mcv.getContext('2d');
  const metrics = {}, feet = {};
  /** Ink box of a letter in ems (text centred on x=0, baseline y=0): {l, r, top, bot, cx}. */
  Lt.metrics = function (ch) {
    if (metrics[ch]) return metrics[ch];
    mg.font = `700 200px ${A.FONT_BODY}`; mg.textAlign = 'center'; mg.textBaseline = 'alphabetic';
    const m = mg.measureText(ch);
    const o = { l: -m.actualBoundingBoxLeft / 200, r: m.actualBoundingBoxRight / 200, top: -m.actualBoundingBoxAscent / 200, bot: m.actualBoundingBoxDescent / 200 };
    o.cx = (o.l + o.r) / 2;
    return (metrics[ch] = o);
  };

  /** The paper body of a letter as a cached sprite. Anchor: middle of the ink, at its bottom (the feet). */
  Lt.body = function (ch, F, col) {
    col = col || Lt.color(ch);
    const m = Lt.metrics(ch), fat = F * 0.046;
    const box = [m.l * F - m.cx * F - fat - 6, (m.top - m.bot) * F - fat - 6, (m.r - m.l) * F + fat * 2 + 12, (m.bot - m.top) * F + fat * 2 + 12];
    return A.sprite('lm3' + ch + col + Math.round(F), box, (g, s) => {
      const w = g.canvas.width, h = g.canvas.height, T = g.getTransform();
      const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.setTransform(T); return [c, x]; };
      const [mask, mx] = mk();
      mx.font = `700 ${F}px ${A.FONT_BODY}`; mx.textAlign = 'center'; mx.textBaseline = 'alphabetic'; mx.lineJoin = 'round'; mx.lineWidth = fat * 2;
      const tx = -m.cx * F, ty = -m.bot * F - fat * 0.2;
      mx.strokeText(ch, tx, ty); mx.fillText(ch, tx, ty);
      // closed bowls: anything not reachable from the edge is backed with the same paper
      const img = mx.getImageData(0, 0, w, h), d = img.data, out = new Uint8Array(w * h), stack = [];
      const push = (i) => { if (!out[i] && d[i * 4 + 3] < 128) { out[i] = 1; stack.push(i); } };
      for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
      while (stack.length) { const i = stack.pop(), x = i % w; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (i >= w) push(i - w); if (i < w * (h - 1)) push(i + w); }
      // where the ink touches the ground, so the feet go under the legs
      let fl = w, fr = 0; const y1 = Math.round(T.f - fat * 0.3 * s), y0 = Math.round(y1 - F * 0.1 * s);
      for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) { if (x < fl) fl = x; if (x > fr) fr = x; }
      if (fr > fl) feet[ch] = [((fl - T.e) / s) / F, ((fr - T.e) / s) / F];
      const [tum, tg] = mk(); const ti = tg.createImageData(w, h); let any = false;
      for (let i = 0; i < w * h; i++) if (!out[i] && d[i * 4 + 3] < 128) { ti.data[i * 4 + 3] = 255; any = true; }
      const layer = (maskCv, color, light) => {
        const [c, x] = mk();
        x.beginPath(); x.rect(box[0] - 20, box[1] - 20, box[2] + 40, box[3] + 40);
        A.paper(x, s, color, { shadow: 0, light, grain: 0.24, box: { x: box[0], y: box[1], w: box[2], h: box[3] } });
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(maskCv, 0, 0);
        return c;
      };
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      if (any) { tg.putImageData(ti, 0, 0); g.drawImage(layer(tum, A.shade(col, -0.1), 0), 0, 0); }
      g.shadowColor = 'rgba(46,40,70,.26)'; g.shadowBlur = 8 * s; g.shadowOffsetX = 2.5 * s; g.shadowOffsetY = 5 * s;
      g.drawImage(layer(mask, col, 0.035), 0, 0);
      g.restore();
    });
  };

  /** Draw a whole letter monster with its feet at (0,0).
      st: {air (units above the ground, for the shadow), blink 0..1, lookX, lookY (-1..1), open 0..1, squash (+ taller), shake (radians), happy, ghost} */
  Lt.monster = function (g, s, ch, F, st) {
    st = st || {};
    const m = Lt.metrics(ch), col = st.color || Lt.color(ch), sp = Lt.body(ch, F, col);
    const q = st.squash || 0, w = (m.r - m.l) * F;
    const ft = feet[ch] || [-w / 2 / F, w / 2 / F], span = (ft[1] - ft[0]) * F, fc = ((ft[0] + ft[1]) / 2) * F;
    const foot = F * 0.1, fx = span > F * 0.36 ? span / 2 - F * 0.085 : F * 0.075;
    g.save();
    if (st.ghost) g.globalAlpha *= st.ghost;
    else { const air = Math.max(0, st.air || 0), k = 1 / (1 + air / 260); g.beginPath(); g.ellipse(fc, 4 + air, (Math.max(span * 0.5, F * 0.16) + 16) * (0.55 + 0.45 * k), 9 * (0.6 + 0.4 * k), 0, 0, TAU); g.fillStyle = `rgba(40,34,60,${0.07 + 0.09 * k})`; g.fill(); }
    // feet stay planted while the body squashes above them
    if (!st.ghost) for (const side of [-1, 1]) {
      g.beginPath(); g.ellipse(fc + side * fx, 0, foot, foot * 0.55, 0, 0, TAU);
      g.fillStyle = A.shade(col, -0.16); g.fill();
    }
    g.translate(0, -4); g.rotate(st.shake || 0); g.scale(1 - q * 0.8, 1 + q);
    g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
    if (!st.ghost) {
      const f = FACE[ch] || [0, -0.26, 0.8], k = f[2] * F;
      g.translate(f[0] * F, (f[1] - m.bot) * F);
      const lx = st.lookX || 0, ly = st.lookY || 0, bl = Math.max(0.1, 1 - (st.blink || 0));
      const er = k * 0.112, ex = er * 0.97;
      for (const side of [-1, 1]) {
        g.beginPath(); g.ellipse(side * ex, 0, er, er * bl, 0, 0, TAU); g.fillStyle = '#FFFDF7'; g.fill();
        g.strokeStyle = 'rgba(46,42,59,.2)'; g.lineWidth = Math.max(1, k * 0.008); g.stroke();
        if (bl > 0.4) {
          const px = side * ex - side * er * 0.1 + lx * er * 0.26, py = ly * er * 0.24 + er * 0.08, pr = er * 0.66;
          g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fillStyle = A.C.ink; g.fill();
          g.beginPath(); g.arc(px + pr * 0.34, py - pr * 0.38, pr * 0.34, 0, TAU); g.fillStyle = '#fff'; g.fill();
          g.beginPath(); g.arc(px - pr * 0.36, py + pr * 0.36, pr * 0.16, 0, TAU); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill();
        } else A.line(g, A.C.ink, k * 0.022, (h) => { h.moveTo(side * ex - er * 0.7, 0); h.quadraticCurveTo(side * ex, er * 0.45, side * ex + er * 0.7, 0); });
      }
      const my = er * 1.42, op = st.open || 0;
      if (op > 0.08) {
        g.beginPath(); g.ellipse(0, my + k * 0.012 * op, k * 0.046, k * (0.02 + 0.046 * op), 0, 0, TAU); g.fillStyle = '#5A2440'; g.fill();
        g.save(); g.clip(); g.beginPath(); g.ellipse(0, my + k * 0.07 * op, k * 0.036, k * 0.028, 0, 0, TAU); g.fillStyle = '#E88A9C'; g.fill(); g.restore();
      } else A.line(g, A.C.ink, Math.max(2, k * 0.022), (h) => { const mw = k * (st.happy ? 0.058 : 0.04); h.moveTo(-mw, my - k * 0.012); h.quadraticCurveTo(0, my + k * (st.happy ? 0.058 : 0.034), mw, my - k * 0.012); });
      for (const side of [-1, 1]) { g.beginPath(); g.ellipse(side * er * 1.95, my - er * 0.3, er * 0.46, er * 0.3, 0, 0, TAU); g.fillStyle = 'rgba(255,110,120,.4)'; g.fill(); }
    }
    g.restore();
  };
  /** Height of the monster's body above its feet, in units. */
  Lt.height = (ch, F) => { const m = Lt.metrics(ch); return (m.bot - m.top) * F + F * 0.1; };

  /* ---------------- writing the letters ----------------
     Strokes in a unit square, y down. Capitals come from the shared stroke data; the small letters
     are here (top of tall letters 0.04, top of small letters 0.36, the line 0.72, tails to 1.0).
     ["M",x,y] move, ["L",x,y] line, ["A",cx,cy,rx,ry,deg0,deg1] arc (0 = right, 90 = down). */
  const BOWL = ['A', 0.46, 0.54, 0.22, 0.18, 0, -360];
  const LOW = {
    a: [[BOWL], [['M', 0.68, 0.36], ['L', 0.68, 0.72]]],
    b: [[['M', 0.28, 0.04], ['L', 0.28, 0.72]], [['M', 0.28, 0.54], ['A', 0.49, 0.54, 0.21, 0.18, 180, 540]]],
    c: [[['A', 0.5, 0.54, 0.22, 0.18, -45, -315]]],
    d: [[BOWL], [['M', 0.68, 0.04], ['L', 0.68, 0.72]]],
    e: [[['M', 0.28, 0.54], ['L', 0.7, 0.54], ['A', 0.49, 0.54, 0.21, 0.18, 0, -315]]],
    f: [[['A', 0.54, 0.19, 0.15, 0.15, -25, -180], ['L', 0.39, 0.72]], [['M', 0.22, 0.38], ['L', 0.6, 0.38]]],
    g: [[BOWL], [['M', 0.68, 0.36], ['L', 0.68, 0.84], ['A', 0.47, 0.84, 0.21, 0.14, 0, 150]]],
    h: [[['M', 0.28, 0.04], ['L', 0.28, 0.72]], [['M', 0.28, 0.53], ['A', 0.48, 0.53, 0.2, 0.17, 180, 360], ['L', 0.68, 0.72]]],
    i: [[['M', 0.5, 0.36], ['L', 0.5, 0.72]], [['M', 0.5, 0.17], ['L', 0.5, 0.18]]],
    j: [[['M', 0.58, 0.36], ['L', 0.58, 0.86], ['A', 0.41, 0.86, 0.17, 0.13, 0, 150]], [['M', 0.58, 0.17], ['L', 0.58, 0.18]]],
    k: [[['M', 0.3, 0.04], ['L', 0.3, 0.72]], [['M', 0.66, 0.36], ['L', 0.3, 0.57]], [['M', 0.42, 0.5], ['L', 0.68, 0.72]]],
    l: [[['M', 0.5, 0.04], ['L', 0.5, 0.72]]],
    m: [[['M', 0.14, 0.36], ['L', 0.14, 0.72]], [['M', 0.14, 0.51], ['A', 0.32, 0.51, 0.18, 0.15, 180, 360], ['L', 0.5, 0.72]], [['M', 0.5, 0.51], ['A', 0.68, 0.51, 0.18, 0.15, 180, 360], ['L', 0.86, 0.72]]],
    n: [[['M', 0.28, 0.36], ['L', 0.28, 0.72]], [['M', 0.28, 0.53], ['A', 0.48, 0.53, 0.2, 0.17, 180, 360], ['L', 0.68, 0.72]]],
    o: [[['A', 0.5, 0.54, 0.22, 0.18, -90, -450]]],
    p: [[['M', 0.28, 0.36], ['L', 0.28, 1]], [['M', 0.28, 0.54], ['A', 0.49, 0.54, 0.21, 0.18, 180, 540]]],
    q: [[BOWL], [['M', 0.68, 0.36], ['L', 0.68, 1]]],
    r: [[['M', 0.34, 0.36], ['L', 0.34, 0.72]], [['M', 0.34, 0.55], ['A', 0.53, 0.55, 0.19, 0.19, 180, 305]]],
    s: [[['A', 0.5, 0.45, 0.17, 0.09, -30, -270], ['A', 0.5, 0.63, 0.18, 0.09, -90, 150]]],
    t: [[['M', 0.44, 0.12], ['L', 0.44, 0.61], ['A', 0.55, 0.61, 0.11, 0.11, 180, 55]], [['M', 0.26, 0.36], ['L', 0.66, 0.36]]],
    u: [[['M', 0.28, 0.36], ['L', 0.28, 0.56], ['A', 0.48, 0.56, 0.2, 0.16, 180, 0], ['L', 0.68, 0.36]], [['M', 0.68, 0.36], ['L', 0.68, 0.72]]],
    v: [[['M', 0.26, 0.36], ['L', 0.5, 0.72], ['L', 0.74, 0.36]]],
    w: [[['M', 0.12, 0.36], ['L', 0.31, 0.72], ['L', 0.5, 0.4], ['L', 0.69, 0.72], ['L', 0.88, 0.36]]],
    x: [[['M', 0.28, 0.36], ['L', 0.72, 0.72]], [['M', 0.72, 0.36], ['L', 0.28, 0.72]]],
    y: [[['M', 0.28, 0.36], ['L', 0.5, 0.72]], [['M', 0.72, 0.36], ['L', 0.36, 1]]],
    z: [[['M', 0.28, 0.36], ['L', 0.72, 0.36], ['L', 0.28, 0.72], ['L', 0.72, 0.72]]],
  };
  function sampleStroke(cmds) {
    const pts = []; let cur = null;
    for (const c of cmds) {
      if (c[0] === 'M') { cur = [c[1], c[2]]; pts.push(cur); }
      else if (c[0] === 'L') { const a = cur || [c[1], c[2]]; for (let i = 1; i <= 12; i++) pts.push([a[0] + ((c[1] - a[0]) * i) / 12, a[1] + ((c[2] - a[1]) * i) / 12]); cur = [c[1], c[2]]; }
      else { const [, cx, cy, rx, ry, a0, a1] = c, n = Math.max(2, Math.floor(Math.abs(a1 - a0) / 3));
        for (let i = cur ? 1 : 0; i <= n; i++) { const d = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; pts.push([cx + rx * Math.cos(d), cy + ry * Math.sin(d)]); }
        cur = pts[pts.length - 1]; }
    }
    return pts;
  }
  function resample(pts, gap) {
    const out = [pts[0]]; let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      let a = pts[i - 1]; const b = pts[i]; let seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!seg) continue;
      let need = gap - carry;
      while (seg >= need) { const t = need / seg; a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; out.push(a); seg -= need; need = gap; carry = 0; }
      carry += seg;
    }
    const last = pts[pts.length - 1], tail = out[out.length - 1];
    if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > gap * 0.4) out.push(last);
    return out;
  }
  const glyphs = {};
  /** Strokes of a letter ('A' or 'a') as lists of evenly spaced [x, y] points in the unit square,
      centred sideways, in the order and direction a hand writes them. */
  Lt.glyph = function (ch) {
    if (glyphs[ch]) return glyphs[ch];
    const src = LOW[ch] || (window.GLYPHS || {})[ch] || [];
    const st = src.map((c) => resample(sampleStroke(c), 0.02));
    let lo = 1, hi = 0; for (const p of st) for (const q of p) { lo = Math.min(lo, q[0]); hi = Math.max(hi, q[0]); }
    const dx = 0.5 - (lo + hi) / 2;
    return (glyphs[ch] = st.map((p) => p.map((q) => [q[0] + dx, q[1]])));
  };

  /** The pointing paper hand (shared); the fingertip is at (0,0). press 0..1 dips it down. */
  Lt.finger = (g, s, press) => A.hand(g, s, press);

  /** The drawing board for writing a letter: a square of paper P wide on a wooden board, top-left at (0,0). */
  Lt.board = function (g, s, P) {
    g.beginPath(); A.rect(g, -20, -20, P + 40, P + 40, 22, 4, 1.2); A.paper(g, s, '#C99666', { shadow: 1.3, depth: 1.5, box: { x: -20, y: -20, w: P + 40, h: P + 40 } });
    g.beginPath(); A.rect(g, 0, 0, P, P, 10, 7, 0.8); A.paper(g, s, '#FBF6EC', { shadow: 0.8, grain: 0.12, light: 0.02, box: { x: 0, y: 0, w: P, h: P } });
    for (const x of [P * 0.3, P * 0.7]) { g.beginPath(); A.rect(g, x - 26, -32, 52, 42, 8, 3, 0.5); A.paper(g, s, '#8E8A96', { shadow: 0.8, light: 0.1, box: { x: x - 26, y: -32, w: 52, h: 42 } }); }
  };

  /* ---------------- the meadow ---------------- */
  /** mound: {x, y, w} adds the little hill the word stands on, with a stepping stone per letter. */
  Lt.meadow = function (g, s, W, H, G, mound) {
    V = A.valley;
    const sky = g.createLinearGradient(0, 0, 0, G); sky.addColorStop(0, '#BFDDE4'); sky.addColorStop(0.7, '#E4EEDD'); sky.addColorStop(1, '#F4EAD2');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, 'rgba(255,255,255,0)', { shadow: 0, light: 0, grain: 0.18 });
    g.save(); g.translate(W * 0.2, G * 0.26); V.cloud(g, s, 210, 3); g.restore();
    g.save(); g.translate(W * 0.78, G * 0.4); V.cloud(g, s, 160, 8); g.restore();
    V.hill(g, s, 0, W, G - 250, 120, 900, 5, '#B7D2BC', H);
    V.hill(g, s, 0, W, G - 150, 90, 620, 11, '#9CC3A2', H);
    const r = A.rng(21);
    for (let i = 0; i < Math.round(W / 190); i++) { const x = r() * W; if (mound && Math.abs(x - mound.x) < mound.w / 2 + 230) continue; V.tree(g, s, x, V.hillY(x, G - 150, 90, 620, 11) + 8, 70 + r() * 50, 30 + i, ['round', 'tall', 'lolly'][i % 3]); }
    V.hill(g, s, 0, W, G - 60, 40, 760, 17, '#86B685', H);
    // big trees framing the sides, bushes in front of them
    V.tree(g, s, 40, G - 46, 330, 4, 'round'); V.tree(g, s, W - 30, G - 50, 380, 6, 'lolly');
    V.bush(g, s, 120, G - 36, 170, 2); V.bush(g, s, W - 150, G - 38, 190, 5);
    if (mound) {
      const { x, y, w } = mound, hw = w / 2, D = G - y, col = '#8FC088';
      g.beginPath(); g.moveTo(x - hw - 250, G + 20); g.bezierCurveTo(x - hw - 130, G - 10, x - hw - 90, y + 4, x - hw + 10, y + 6);
      g.lineTo(x + hw - 10, y + 6); g.bezierCurveTo(x + hw + 90, y + 4, x + hw + 130, G - 10, x + hw + 250, G + 20); g.closePath();
      A.paper(g, s, col, { shadow: 1, depth: 1.4, light: 0.06, box: { x: x - hw, y, w, h: D } });
      g.save(); g.clip(); g.beginPath(); g.ellipse(x - hw * 0.5, y + 10, hw * 1.1, 46, -0.03, 0, TAU); g.fillStyle = 'rgba(255,255,255,.14)'; g.fill(); g.restore();
      const n = mound.n || 3, sw = w / n;
      for (let i = 0; i < n; i++) { const sx = x + (i - (n - 1) / 2) * sw; g.beginPath(); A.blob(g, sx, y + 14, sw * 0.38, 15, 0.05, 40 + i, 10); A.paper(g, s, '#EFE6D2', { shadow: 0.7, light: 0.05, box: { x: sx - sw * 0.38, y, w: sw * 0.76, h: 30 } }); }
      const q = A.rng(77);
      for (let i = 0; i < 9; i++) { const side = i % 2 ? 1 : -1, tx = x + side * (hw + 20 + q() * 150), ty = y + 60 + q() * (D - 110); if (q() < 0.4) V.flower(g, s, tx, ty, 9, ['#F6E7C8', '#F4B8AE', '#F7D98A'][i % 3]); else V.tuft(g, s, tx, ty, 22, i + 50, '#79B274'); }
      for (let i = 0; i < 5; i++) V.tuft(g, s, x - hw + 30 + q() * (w - 60), y + 70 + q() * Math.max(10, D - 150), 20, i + 70, '#7DB579');
    }
    // the lawn the monsters stand on
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, G - 44 + Math.sin(x / 170) * 7); g.lineTo(W + 20, H); g.closePath();
    A.paper(g, s, '#79B274', { shadow: 0.9, light: 0.04, box: { x: 0, y: G - 50, w: 0, h: H - G + 50 } });
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, G + 46 + Math.sin(x / 120 + 2) * 6); g.lineTo(W + 20, H); g.closePath();
    A.paper(g, s, '#6BA66A', { shadow: 0.5, light: 0.03, box: { x: 0, y: G + 40, w: 0, h: H - G } });
    for (let i = 0; i < Math.round(W / 70); i++) {
      const x = r() * W, y = G - 30 + r() * (H - G + 10);
      if (r() < 0.35) V.flower(g, s, x, y, 9 + r() * 5, ['#F6E7C8', '#F4B8AE', '#F7D98A', '#D9C4EA'][i % 4]); else V.tuft(g, s, x, y, 22 + r() * 16, i + 3, r() < 0.5 ? '#5F9C62' : '#8CC081');
    }
  };

  /* ---------------- picture cards ---------------- */
  const eye = (g, x, y, r, blink) => {
    const k = Math.max(0.12, 1 - (blink || 0));
    g.beginPath(); g.ellipse(x, y, r, r * 1.15 * k, 0, 0, TAU); g.fillStyle = A.C.ink; g.fill();
    if (k > 0.5) { g.beginPath(); g.arc(x + r * 0.3, y - r * 0.4, r * 0.36, 0, TAU); g.fillStyle = '#fff'; g.fill(); }
  };
  const cheek = (g, x, y, r) => { g.beginPath(); g.ellipse(x, y, r, r * 0.62, 0, 0, TAU); g.fillStyle = 'rgba(232,102,74,.32)'; g.fill(); };
  const smile = (g, x, y, w, lw) => A.line(g, A.C.ink, lw || 2.8, (h) => { h.moveTo(x - w, y); h.quadraticCurveTo(x, y + w * 0.9, x + w, y); });
  const pp = (g, s, col, trace, box, sh) => { g.beginPath(); trace(g); A.paper(g, s, col, { shadow: sh == null ? 0.6 : sh, light: 0.07, box, grain: 0.2 }); };

  /** A four-legged friend seen from the front: round body, stubby legs, big head. Feet at y=0. */
  function critter(g, s, o, t, a) {
    const hop = a ? Math.abs(Math.sin(t * 9)) : 0, bob = Math.sin(t * 2.4) * 1.5;
    // tail
    if (o.tail) { g.save(); g.translate(34, -46); g.rotate(-0.5 + Math.sin(t * (a ? 14 : 3)) * 0.25); o.tail(g, s); g.restore(); }
    for (const [x, ph] of [[-22, 0], [22, 1]]) { const ly = a ? Math.max(0, Math.sin(t * 18 + ph * Math.PI)) * 7 : 0; pp(g, s, A.shade(o.c, -0.08), (h) => A.rect(h, x - 11, -22 - ly, 22, 24, 9, 3, 0.4), null, 0.3); }
    pp(g, s, o.c, (h) => h.ellipse(0, -48 + bob * 0.4, 44, 36, 0, 0, TAU), { x: -44, y: -84, w: 88, h: 72 }, 0.5);
    if (o.belly) { g.beginPath(); g.ellipse(0, -40, 24, 22, 0, 0, TAU); g.fillStyle = o.belly; g.fill(); }
    if (o.body) o.body(g, s);
    g.save(); g.translate(0, -112 + bob - hop * 3); g.rotate(Math.sin(t * 1.7) * 0.03); o.head(g, s, t); g.restore();
  }
  const blinkAt = (t, off) => { const p = (t + (off || 0)) % 3.4; return p < 0.14 ? Math.sin((p / 0.14) * Math.PI) : 0; };
  const ownHead = (g, s, o, t) => {
    const bl = blinkAt(t, o.off);
    if (o.ears) o.ears(g, s, true);
    pp(g, s, o.c, (h) => A.blob(h, 0, 2, 46, 43, 0.025, 9, 10), { x: -46, y: -41, w: 92, h: 86 }, 0.7);
    if (o.patch) o.patch(g, s);
    if (o.ears) o.ears(g, s, false);
    eye(g, -17, -6, 6, bl); eye(g, 17, -6, 6, bl);
    o.muzzle(g, s);
    cheek(g, -31, 12, 7); cheek(g, 31, 12, 7);
  };
  const dog = { c: '#C9925F', belly: '#F1DDBE', off: 0.4,
    tail: (g, s) => pp(g, s, '#8A5A3C', (h) => A.rect(h, -6, -34, 12, 38, 6, 2, 0.3), null, 0.3),
    ears: (g, s, back) => { if (back) return; for (const sd of [-1, 1]) { g.save(); g.translate(sd * 40, -22); g.rotate(sd * -0.22); pp(g, s, '#8A5A3C', (h) => h.ellipse(0, 22, 15, 30, 0, 0, TAU), { x: -15, y: -8, w: 30, h: 60 }, 0.5); g.restore(); } },
    patch: (g) => { g.beginPath(); g.ellipse(17, -7, 15, 17, 0.2, 0, TAU); g.fillStyle = 'rgba(138,90,60,.55)'; g.fill(); },
    muzzle: (g) => { g.beginPath(); g.ellipse(0, 17, 21, 16, 0, 0, TAU); g.fillStyle = '#F6E7CF'; g.fill(); g.beginPath(); g.ellipse(0, 9, 8, 6, 0, 0, TAU); g.fillStyle = A.C.ink; g.fill(); smile(g, 0, 19, 8); g.beginPath(); g.ellipse(0, 28, 6, 7, 0, 0, TAU); g.fillStyle = '#EE8FA0'; g.fill(); } };
  dog.head = (g, s, t) => ownHead(g, s, dog, t);
  const pig = { c: '#F3AEB8', belly: '#F9CBD0', off: 1.1,
    tail: (g) => A.line(g, '#E58A9A', 6, (h) => { h.moveTo(0, 0); h.bezierCurveTo(16, -6, 14, -26, 2, -20); h.bezierCurveTo(-6, -16, 2, -8, 10, -14); }),
    ears: (g, s, back) => { if (!back) return; for (const sd of [-1, 1]) { g.save(); g.scale(sd, 1); pp(g, s, '#E995A4', (h) => A.cut(h, [[14, -34], [46, -56], [44, -18]], 9, 0.5, 2), null, 0.5); g.restore(); } },
    muzzle: (g) => { g.beginPath(); g.ellipse(0, 13, 19, 14, 0, 0, TAU); g.fillStyle = '#E98C9E'; g.fill(); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 7, 13, 3.4, 5, 0, 0, TAU); g.fillStyle = '#B85A70'; g.fill(); } smile(g, 0, 30, 7, 2.6); } };
  pig.head = (g, s, t) => ownHead(g, s, pig, t);
  const cow = { c: '#FBF8F1', belly: '#F6C9C4', off: 2,
    tail: (g, s) => { A.line(g, '#3E3848', 5, (h) => { h.moveTo(0, 0); h.quadraticCurveTo(14, -16, 6, -34); }); g.beginPath(); g.arc(6, -38, 7, 0, TAU); g.fillStyle = '#3E3848'; g.fill(); },
    body: (g) => { g.save(); g.beginPath(); g.ellipse(0, -48, 44, 36, 0, 0, TAU); g.clip(); g.beginPath(); A.blob(g, -30, -62, 20, 16, 0.12, 4); A.blob(g, 34, -34, 16, 20, 0.12, 6); g.fillStyle = '#3E3848'; g.fill(); g.restore(); },
    ears: (g, s, back) => { if (!back) return; for (const sd of [-1, 1]) { g.save(); g.scale(sd, 1); pp(g, s, '#E9D9A8', (h) => A.cut(h, [[18, -36], [24, -62], [34, -34]], 5, 0, 3), null, 0.4); g.translate(52, -16); g.rotate(0.3); pp(g, s, '#3E3848', (h) => h.ellipse(0, 0, 17, 10, 0, 0, TAU), null, 0.5); g.restore(); } },
    patch: (g) => { g.save(); g.beginPath(); A.blob(g, 0, 2, 46, 43, 0.025, 9, 10); g.clip(); g.beginPath(); A.blob(g, -28, -22, 24, 22, 0.1, 5); g.fillStyle = '#3E3848'; g.fill(); g.restore(); g.beginPath(); g.ellipse(-17, -6, 9, 10, 0, 0, TAU); g.fillStyle = '#FBF8F1'; g.fill(); },
    muzzle: (g) => { g.beginPath(); g.ellipse(0, 19, 27, 17, 0, 0, TAU); g.fillStyle = '#F4B9BC'; g.fill(); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 10, 15, 3.4, 4.6, 0, 0, TAU); g.fillStyle = '#B8697A'; g.fill(); } smile(g, 0, 24, 8, 2.6); } };
  cow.head = (g, s, t) => ownHead(g, s, cow, t);
  const faceHead = (id) => (g, s, t) => A.face(g, s, id, { blink: blinkAt(t, id.length) });
  const cat = { c: '#9A90A8', belly: '#E9E3EC', head: faceHead('cat'), tail: (g, s) => pp(g, s, '#857B94', (h) => { h.moveTo(-6, 4); h.bezierCurveTo(10, -10, 20, -30, 6, -48); h.bezierCurveTo(22, -34, 22, -4, 6, 6); h.closePath(); }, null, 0.3) };
  const fox = { c: '#E3793F', belly: '#FBF1E4', head: faceHead('fox'), tail: (g, s) => { pp(g, s, '#D56A33', (h) => h.ellipse(8, -22, 15, 30, 0.4, 0, TAU), null, 0.4); g.beginPath(); g.ellipse(17, -42, 9, 11, 0.4, 0, TAU); g.fillStyle = '#FBF1E4'; g.fill(); } };

  function owl(g, s, t, a) {
    const flap = a ? Math.sin(t * 16) * 0.9 : Math.sin(t * 2) * 0.05;
    for (const sd of [-1, 1]) { g.save(); g.translate(sd * 36, -66); g.rotate(sd * (0.25 - flap)); pp(g, s, '#684C7A', (h) => h.ellipse(sd * 12, 22, 17, 36, sd * -0.2, 0, TAU), null, 0.4); g.restore(); }
    pp(g, s, '#7A5A8C', (h) => h.ellipse(0, -48, 42, 46, 0, 0, TAU), { x: -42, y: -94, w: 84, h: 92 }, 0.5);
    g.beginPath(); g.ellipse(0, -36, 26, 30, 0, 0, TAU); g.fillStyle = '#EADCF0'; g.fill();
    A.line(g, 'rgba(122,90,140,.5)', 2.5, (h) => { for (const [x, y] of [[-10, -44], [8, -44], [-1, -30], [-12, -18], [10, -18]]) { h.moveTo(x - 5, y); h.quadraticCurveTo(x, y + 6, x + 5, y); } });
    for (const sd of [-1, 1]) { g.beginPath(); A.cut(g, [[sd * 8, 0], [sd * 22, 0], [sd * 15, -9]], 3, 0, 2); g.fillStyle = A.C.marigold; g.fill(); }
    g.save(); g.translate(0, -112); A.face(g, s, 'owl', { blink: blinkAt(t, 1.6) }); g.restore();
  }
  function sun(g, s, t, a) {
    g.save(); g.translate(0, -82);
    g.save(); g.rotate(t * (a ? 1.4 : 0.25));
    for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); pp(g, s, i % 2 ? '#F7CF5E' : '#F2A93B', (h) => A.cut(h, [[-11, -56], [11, -56], [0, -88 - (i % 2 ? 0 : 8)]], 6, 0.4, i + 1), null, 0.25); }
    g.restore();
    pp(g, s, '#F6C445', (h) => A.blob(h, 0, 0, 56, 55, 0.02, 4, 12), { x: -56, y: -55, w: 112, h: 110 }, 0.7);
    const bl = blinkAt(t, 0.7); eye(g, -20, -6, 7, bl); eye(g, 20, -6, 7, bl);
    cheek(g, -34, 12, 9); cheek(g, 34, 12, 9); smile(g, 0, 12, 13, 3.4);
    g.restore();
  }
  function bus(g, s, t, a) {
    const b = a ? Math.sin(t * 22) * 1.5 : 0;
    g.save(); g.translate(0, b);
    pp(g, s, '#F2B93B', (h) => A.cut(h, [[-88, -124], [70, -124], [90, -74], [90, -26], [-88, -26]], [20, 26, 12, 12, 14], 0.6, 3), { x: -88, y: -124, w: 178, h: 98 }, 0.7);
    pp(g, s, '#E09A28', (h) => A.rect(h, -88, -52, 178, 14, 4, 2, 0.3), null, 0);
    for (const x of [-72, -30, 12]) { g.beginPath(); A.rect(g, x, -110, 34, 36, 8, 2, 0.4); g.fillStyle = '#CDE8EE'; g.fill(); g.beginPath(); g.moveTo(x + 4, -80); g.lineTo(x + 16, -106); g.lineTo(x + 24, -106); g.lineTo(x + 12, -80); g.closePath(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill(); }
    // little passengers
    for (const [x, c] of [[-55, '#E3793F'], [-13, '#9A90A8']]) { g.save(); g.beginPath(); g.rect(x - 17, -110, 34, 36); g.clip(); g.beginPath(); g.arc(x, -78, 13, 0, TAU); g.fillStyle = c; g.fill(); eye(g, x - 5, -82, 2.2); eye(g, x + 5, -82, 2.2); g.restore(); }
    // the bus's own face on the front
    g.beginPath(); A.rect(g, 52, -108, 30, 34, 8, 4, 0.4); g.fillStyle = '#CDE8EE'; g.fill();
    const bl = blinkAt(t, 2.2); eye(g, 60, -92, 4.5, bl); eye(g, 75, -92, 4.5, bl); cheek(g, 56, -66, 6); smile(g, 70, -66, 8, 2.8);
    g.beginPath(); g.arc(84, -40, 6, 0, TAU); g.fillStyle = '#FFF3C4'; g.fill();
    g.restore();
    for (const x of [-50, 50]) { g.save(); g.translate(x, -20); g.rotate(a ? t * 12 : 0); g.beginPath(); g.arc(0, 0, 20, 0, TAU); A.paper(g, s, '#3E3848', { shadow: 0.5, light: 0.05 }); g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fillStyle = '#D9D4DE'; g.fill(); g.fillStyle = '#3E3848'; g.fillRect(-1.5, -9, 3, 18); g.restore(); }
  }
  function hat(g, s, t) {
    g.save(); g.translate(0, -14); g.rotate(Math.sin(t * 2) * 0.03);
    pp(g, s, '#3F6FA8', (h) => h.ellipse(0, 0, 92, 20, 0, 0, TAU), { x: -92, y: -20, w: 184, h: 40 }, 0.7);
    pp(g, s, '#4C82C2', (h) => { h.moveTo(-54, -2); h.bezierCurveTo(-58, -70, -40, -112, 0, -112); h.bezierCurveTo(40, -112, 58, -70, 54, -2); h.quadraticCurveTo(0, 12, -54, -2); h.closePath(); }, { x: -56, y: -112, w: 112, h: 116 }, 0.4);
    pp(g, s, '#F2B33D', (h) => { h.moveTo(-55, -20); h.quadraticCurveTo(0, -6, 55, -20); h.lineTo(54, -2); h.quadraticCurveTo(0, 12, -54, -2); h.closePath(); }, null, 0);
    // a flower on the band
    g.save(); g.translate(34, -16); for (let i = 0; i < 5; i++) { g.rotate(TAU / 5); g.beginPath(); g.ellipse(0, -9, 6, 8, 0, 0, TAU); g.fillStyle = '#F4B8AE'; g.fill(); } g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fillStyle = '#FFF3C4'; g.fill(); g.restore();
    const bl = blinkAt(t, 1.3); eye(g, -16, -58, 5.5, bl); eye(g, 16, -58, 5.5, bl); cheek(g, -28, -44, 7); cheek(g, 28, -44, 7); smile(g, 0, -46, 9, 2.8);
    g.restore();
  }
  function egg(g, s, t, a) {
    const k = a ? Math.min(1, a) : 0; // 0 whole … 1 hatched
    const wob = k > 0 && k < 0.5 ? Math.sin(t * 30) * 0.08 : Math.sin(t * 2) * 0.02;
    const shell = (h) => { h.moveTo(0, -128); h.bezierCurveTo(44, -128, 62, -60, 60, -42); h.bezierCurveTo(58, -8, 30, 0, 0, 0); h.bezierCurveTo(-30, 0, -58, -8, -60, -42); h.bezierCurveTo(-62, -60, -44, -128, 0, -128); h.closePath(); };
    g.save(); g.rotate(wob);
    if (k >= 0.5) {
      const up = Math.min(1, (k - 0.5) * 2.4);
      // chick
      g.save(); g.translate(0, -52 - up * 34 + Math.abs(Math.sin(t * 8)) * 4 * (k >= 1 ? 1 : 0));
      pp(g, s, '#F7D55C', (h) => A.blob(h, 0, 0, 40, 38, 0.03, 5, 10), { x: -40, y: -38, w: 80, h: 76 }, 0.4);
      g.beginPath(); A.cut(g, [[-4, -36], [0, -52], [6, -36]], 3, 0, 2); g.fillStyle = '#F2A93B'; g.fill();
      eye(g, -14, -6, 5, blinkAt(t, 0.3)); eye(g, 14, -6, 5, blinkAt(t, 0.3)); cheek(g, -24, 8, 6); cheek(g, 24, 8, 6);
      g.beginPath(); A.cut(g, [[-8, 4], [8, 4], [0, 14]], 3, 0, 1); g.fillStyle = '#EE8A3C'; g.fill();
      g.restore();
      // bottom half of the shell, top half tipped off
      g.save(); g.beginPath(); g.moveTo(-70, -54); for (let i = 0; i <= 8; i++) g.lineTo(-64 + i * 16, -54 - (i % 2 ? 16 : 0)); g.lineTo(70, 10); g.lineTo(-70, 10); g.closePath(); g.clip(); pp(g, s, '#FBF3E2', shell, { x: -60, y: -128, w: 120, h: 128 }, 0.6); g.restore();
      g.save(); g.translate(58 + up * 30, -92 - up * 20); g.rotate(0.5 + up * 0.6); g.translate(0, 92); g.beginPath(); g.moveTo(-70, -54); for (let i = 0; i <= 8; i++) g.lineTo(-64 + i * 16, -54 - (i % 2 ? 16 : 0)); g.lineTo(70, -140); g.lineTo(-70, -140); g.closePath(); g.clip(); pp(g, s, '#FBF3E2', shell, { x: -60, y: -128, w: 120, h: 128 }, 0.4); g.restore();
    } else {
      pp(g, s, '#FBF3E2', shell, { x: -60, y: -128, w: 120, h: 128 }, 0.7);
      for (const [x, y, r] of [[-28, -92, 7], [26, -30, 9], [-34, -30, 5], [22, -96, 5]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = 'rgba(232,180,120,.4)'; g.fill(); }
      const bl = blinkAt(t, 1.9); eye(g, -18, -62, 6, bl); eye(g, 18, -62, 6, bl); cheek(g, -32, -46, 8); cheek(g, 32, -46, 8); smile(g, 0, -48, 9, 2.8);
      if (k > 0) A.line(g, '#B9A78A', 3, (h) => { h.moveTo(-58, -50); for (let i = 1; i <= Math.ceil(k * 2 * 8); i++) h.lineTo(-58 + i * 14.5, -50 - (i % 2 ? 14 : 0)); });
    }
    g.restore();
  }

  /** Words the child can build. Each picture is drawn with its feet/base at (0,0), about 150 tall.
      draw(g, s, t, alive): alive is truthy once it has come off the card (egg: 0..1 hatching). */
  Lt.WORDS = [
    { w: 'cat', act: 'walk', draw: (g, s, t, a) => critter(g, s, cat, t, a) },
    { w: 'sun', act: 'rise', draw: sun },
    { w: 'dog', act: 'walk', draw: (g, s, t, a) => critter(g, s, dog, t, a) },
    { w: 'bus', act: 'drive', draw: bus },
    { w: 'pig', act: 'walk', draw: (g, s, t, a) => critter(g, s, pig, t, a) },
    { w: 'hat', act: 'wear', draw: hat },
    { w: 'fox', act: 'walk', draw: (g, s, t, a) => critter(g, s, fox, t, a) },
    { w: 'egg', act: 'hatch', draw: egg },
    { w: 'cow', act: 'walk', draw: (g, s, t, a) => critter(g, s, cow, t, a) },
    { w: 'owl', act: 'fly', draw: owl },
  ];

  /** The card a picture sits on (centre at 0,0). */
  Lt.card = function (g, s, w, h, tint) {
    g.save(); g.rotate(-0.025);
    g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 26, 5, 1.6); A.paper(g, s, '#FBF6EC', { shadow: 1.3, depth: 1.5, box: { x: -w / 2, y: -h / 2, w, h } });
    g.beginPath(); A.rect(g, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 16, 8, 1); A.paper(g, s, tint || '#DCEBE6', { shadow: 0, light: 0.03, grain: 0.18, box: { x: -w / 2, y: -h / 2, w, h } });
    g.save(); g.beginPath(); A.rect(g, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 16, 8, 1); g.clip();
    g.beginPath(); g.ellipse(0, h / 2 + 30, w * 0.7, 110, 0, 0, TAU); g.fillStyle = A.mix(tint || '#DCEBE6', '#7FB08A', 0.45); g.fill(); g.restore();
    // washi tape
    g.save(); g.translate(0, -h / 2 + 2); g.rotate(0.05); g.beginPath(); A.rect(g, -46, -16, 92, 30, 3, 3, 1); A.paper(g, s, A.alpha('#F2B33D', 0.85), { shadow: 0.5, light: 0 }); g.restore();
    g.restore();
  };
})();
