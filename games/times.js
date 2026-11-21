/* Times Garden — multiplication as rows and columns.
   A garden bed with a corner handle. Drag the corner (or tap a plot) and seedlings fill the bed in
   rows and columns. The watering can is the child's "I am ready": the right garden is counted row by
   row (3, 6, 9, 12), the fact appears as big text and the garden blooms.
   Level 1: "Plant two rows. Three in each row." Small numbers, counted aloud (repeated adding).
   Level 2: facts from the 2, 5 and 10 tables. The child skip-counts by tapping the rows, and turns
            the bed a quarter turn to see that 3 x 5 is the same as 5 x 3.
   Level 3: every table to 10 x 10 (12 x 12 once it is going well), "make 24 in as many ways as you
            can" (each new rectangle is kept on the card), missing numbers (? x 6 = 42) found by
            stretching the bed, and sharing a harvest into baskets (division, leftovers stay on the grass).
   Nothing can be lost: a wrong garden gets a wobble and a hint, and after two the answer is outlined. */
(function () {
  'use strict';
  const A = K.art, E = K.engine;
  const num = (n) => K.numWord(n), cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const X = '×', DIV = '÷';
  const T = {
    rows: (n) => `Plant ${num(n)} rows.`, each: (n) => `${cap(num(n))} in each row.`,
    drag: 'Drag the corner to plant.', can: 'Then tap the watering can.',
    card: 'Plant the garden on the card.',
    count: (n) => cap(num(n)) + '.', tapRows: 'Tap each row to count.',
    turn: 'Now turn the bed.', same: 'It is still the same!',
    hRows: 'Count the rows again.', hEach: 'Look how many are in each row.', hTurn: 'Try turning the bed.',
    many: 'That is too many.', few: 'That is not enough.',
    total: 'Make the number on the card.', another: 'Find another way.', already: 'You found that one already.',
    missing: 'Find the missing number.', stretch: 'Stretch the bed until it fits.',
    share: 'Share the apples fairly.', basket: 'Tap a basket to put an apple in.', bell: 'Ring the bell when it is fair.',
    unfair: 'Every basket needs the same.', more: 'You can share some more.', rest: 'The rest stay on the grass.',
    grew: 'Look, your garden grew!',
  };
  function lines() {
    const out = [];
    for (let n = 2; n <= 5; n++) out.push(T.rows(n), T.each(n));
    for (let n = 1; n <= 20; n++) out.push(T.count(n));
    for (const k in T) if (typeof T[k] === 'string') out.push(T[k]);
    return out;
  }

  /* ---------------- pictures ---------------- */
  const PICS = { sprout: 'tales/sprout', sunflower: 'tales/sunflower', flowers: 'toot/flowers', apple: 'toot/apples', carrot: 'kitchen/carrot', tomato: 'kitchen/tomato', strawberry: 'kitchen/strawberry' };
  const TALL = { sprout: 0.92, sunflower: 1.55, flowers: 1.3, apple: 0.86, carrot: 0.9, tomato: 0.84, strawberry: 0.86 };
  const TINT = { sunflower: '#F2B33D', flowers: '#EE8E8A', apple: '#DE4E46', carrot: '#F0923B', tomato: '#E8664A', strawberry: '#DE4E61' };
  const BLOOMS = ['sunflower', 'flowers', 'carrot', 'tomato', 'strawberry', 'apple'];
  const IM = {};
  for (const k in PICS) { const im = new Image(); im.onload = () => { IM[k] = im; }; im.src = 'img/' + PICS[k] + '.webp'; }

  /** Paper stand-ins until the pictures have arrived (w wide, standing on y = 0). */
  function paperPlant(g, name, w) {
    const mound = () => { g.beginPath(); g.ellipse(0, -w * 0.07, w * 0.3, w * 0.1, 0, 0, 7); g.fillStyle = '#6B4430'; g.fill(); };
    const leaf = (x, y, rx, ry, rot, col) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fillStyle = col; g.fill(); g.restore(); };
    if (name === 'sprout') {
      mound(); g.fillStyle = '#7DB548'; g.fillRect(-w * 0.035, -w * 0.5, w * 0.07, w * 0.42);
      leaf(-w * 0.17, -w * 0.56, w * 0.2, w * 0.11, 0.5, '#8CC24E'); leaf(w * 0.17, -w * 0.6, w * 0.2, w * 0.11, -0.5, '#9CCB58');
    } else if (name === 'sunflower' || name === 'flowers') {
      const h = w * TALL[name]; mound(); g.fillStyle = '#6FA65F'; g.fillRect(-w * 0.035, -h * 0.72, w * 0.07, h * 0.66);
      leaf(-w * 0.16, -h * 0.34, w * 0.16, w * 0.08, 0.5, '#6FA65F'); leaf(w * 0.16, -h * 0.4, w * 0.16, w * 0.08, -0.5, '#7DB548');
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; leaf(Math.cos(a) * w * 0.2, -h * 0.74 + Math.sin(a) * w * 0.2, w * 0.14, w * 0.09, a, TINT[name]); }
      g.beginPath(); g.arc(0, -h * 0.74, w * 0.15, 0, 7); g.fillStyle = name === 'sunflower' ? '#8A5A3C' : '#F2CF4A'; g.fill();
    } else {
      g.beginPath(); g.arc(0, -w * 0.36, w * 0.33, 0, 7); g.fillStyle = TINT[name]; g.fill();
      leaf(w * 0.08, -w * 0.72, w * 0.14, w * 0.07, -0.6, '#6FA65F');
    }
  }
  /** A plant as a cached sprite, standing on its anchor, w units wide. */
  function plant(name, w) {
    w = Math.round(w); const im = IM[name], h = w * TALL[name];
    return A.sprite(`tg-${name}-${w}-${im ? 1 : 0}`, [-w / 2, -h, w, h], (g) => {
      if (!im) return paperPlant(g, name, w);
      const k = Math.min(w / im.width, h / im.height); g.drawImage(im, -im.width * k / 2, -im.height * k, im.width * k, im.height * k);
    });
  }
  const put = (g, sp, x, y, k) => { k = k == null ? 1 : k; g.drawImage(sp.canvas, x - sp.ox * k, y - sp.oy * k, sp.w * k, sp.h * k); };
  function text(g, t, x, y, size, col, o) {
    o = o || {}; const f = (z) => `${o.w || 700} ${z}px ${o.font || A.FONT_TITLE}`;
    g.font = f(size); g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.max) { const w = g.measureText(t).width; if (w > o.max) g.font = f(size * o.max / w); }
    g.fillStyle = col; g.fillText(t, x, y);
  }

  /* ---------------- scenery ---------------- */
  function backdrop(W, H) {
    return A.sprite(`tg-bg-${Math.round(W)}x${Math.round(H)}`, [0, 0, W, H], (g, s) => {
      const hy = H * 0.17, sk = g.createLinearGradient(0, 0, 0, hy); sk.addColorStop(0, '#BFE0E6'); sk.addColorStop(1, '#F3ECD8');
      g.fillStyle = sk; g.fillRect(0, 0, W, hy + 20);
      g.beginPath(); g.arc(W * 0.8, hy * 0.52, 46, 0, 7); g.fillStyle = A.alpha('#F7D27A', 0.9); g.fill();
      const rnd = A.rng(5);
      for (let i = 0; i < 7; i++) { g.beginPath(); A.blob(g, (i + 0.3) * W / 6, hy + 18, W / 7, 54 + rnd() * 44, 0.06, i + 3); A.paper(g, s, i % 2 ? A.C.far : A.C.far2, { shadow: 0.3, grain: 0.2 }); }
      g.beginPath(); g.rect(0, hy, W, H - hy); A.paper(g, s, '#8CBB6C', { shadow: 0, light: 0.04, grain: 0.3, box: { x: 0, y: hy, w: W, h: H - hy } });
      for (let i = 0; i < 26; i++) { const x = rnd() * W, y = hy + 30 + rnd() * (H - hy - 40); g.beginPath(); A.blob(g, x, y, 50 + rnd() * 90, 16 + rnd() * 22, 0.1, i + 20); g.fillStyle = A.alpha(i % 2 ? '#A4CF79' : '#6FA65F', 0.22); g.fill(); }
      // picket fence along the back of the lawn
      const fy = hy + 4;
      for (let x = -10; x < W + 40; x += 44) { g.beginPath(); A.cut(g, [[x, fy + 34], [x, fy - 26], [x + 13, fy - 42], [x + 26, fy - 26], [x + 26, fy + 34]], 4, 1, x); A.paper(g, s, '#F6EFE3', { shadow: 0.5, grain: 0.18, box: { x, y: fy - 42, w: 26, h: 76 } }); }
      g.beginPath(); g.rect(-10, fy - 8, W + 20, 9); g.fillStyle = '#E9DEC8'; g.fill();
      // grass tufts and daisies round the edges
      for (let i = 0; i < 60; i++) {
        const x = rnd() * W, y = hy + 50 + rnd() * (H - hy - 60), k = 0.7 + rnd() * 0.7;
        if (i % 4 === 0) { for (let p = 0; p < 5; p++) { const a = p * 1.2566; g.beginPath(); g.arc(x + Math.cos(a) * 7 * k, y + Math.sin(a) * 7 * k, 5.5 * k, 0, 7); g.fillStyle = '#FBF8F1'; g.fill(); } g.beginPath(); g.arc(x, y, 4.5 * k, 0, 7); g.fillStyle = A.C.marigold; g.fill(); }
        else A.line(g, A.alpha('#4F8752', 0.55), 3.5, (h) => { h.moveTo(x - 8 * k, y); h.lineTo(x - 11 * k, y - 15 * k); h.moveTo(x, y); h.lineTo(x, y - 20 * k); h.moveTo(x + 8 * k, y); h.lineTo(x + 12 * k, y - 14 * k); });
      }
    });
  }
  function bedSprite(S, max) {
    S = Math.round(S); const c = S / max;
    return A.sprite(`tg-bed-${S}-${max}`, [-34, -34, S + 68, S + 68], (g, s) => {
      g.beginPath(); A.rect(g, -24, -24, S + 48, S + 48, 30, 3, 2); A.paper(g, s, '#C08A5A', { depth: 1.3, box: { x: -24, y: -24, w: S + 48, h: S + 48 } });
      A.line(g, A.alpha('#6B4430', 0.3), 3, (h) => { for (const q of [0.25, 0.5, 0.75]) { h.moveTo(S * q, -22); h.lineTo(S * q, -3); h.moveTo(S * q, S + 3); h.lineTo(S * q, S + 22); h.moveTo(-22, S * q); h.lineTo(-3, S * q); h.moveTo(S + 3, S * q); h.lineTo(S + 22, S * q); } });
      g.beginPath(); A.rect(g, 0, 0, S, S, 16, 5, 1.5); A.paper(g, s, '#7A5238', { shadow: 0, light: 0.05, grain: 0.34, box: { x: 0, y: 0, w: S, h: S } });
      g.save(); g.beginPath(); A.rect(g, 0, 0, S, S, 16, 5, 1.5); g.clip();
      g.fillStyle = 'rgba(40,22,12,.22)'; g.fillRect(0, 0, S, 10); g.fillRect(0, 0, 9, S);
      for (let r = 0; r < max; r++) for (let q = 0; q < max; q++) {
        g.beginPath(); g.ellipse((q + 0.5) * c, (r + 0.8) * c, c * 0.24, c * 0.09, 0, 0, 7); g.fillStyle = 'rgba(52,30,18,.42)'; g.fill();
        g.beginPath(); g.ellipse((q + 0.5) * c, (r + 0.8) * c - c * 0.03, c * 0.2, c * 0.06, 0, 0, 7); g.fillStyle = 'rgba(160,112,78,.5)'; g.fill();
      }
      g.restore();
    });
  }
  function basketSprite(bw) {
    bw = Math.round(bw); const h = bw * 0.7;
    return A.sprite(`tg-basket-${bw}`, [-bw * 0.6, -h - 6, bw * 1.2, h + 12], (g, s) => {
      g.beginPath(); A.cut(g, [[-bw * 0.5, -h], [bw * 0.5, -h], [bw * 0.4, 0], [-bw * 0.4, 0]], [8, 8, bw * 0.16, bw * 0.16], 1, 3);
      A.paper(g, s, '#D9A866', { box: { x: -bw / 2, y: -h, w: bw, h } });
      g.save(); g.clip();
      for (let i = 1; i < 5; i++) A.line(g, A.alpha('#8A5A3C', 0.5), Math.max(2, bw * 0.022), (p) => { const y = -h + (h * i) / 5; p.moveTo(-bw * 0.5, y); for (let k = 0; k <= 8; k++) p.lineTo(-bw * 0.5 + (bw * k) / 8, y + (k % 2 ? -1 : 1) * bw * 0.02); });
      for (let k = 1; k < 6; k++) A.line(g, A.alpha('#8A5A3C', 0.28), Math.max(2, bw * 0.02), (p) => { const x = -bw * 0.5 + (bw * k) / 6; p.moveTo(x, -h); p.lineTo(x * 0.82, 0); });
      g.restore();
      g.beginPath(); A.rect(g, -bw * 0.56, -h - 5, bw * 1.12, bw * 0.13, bw * 0.06, 9, 0.6); A.paper(g, s, '#C08A5A', { shadow: 0.5, box: { x: -bw * 0.56, y: -h - 5, w: bw * 1.12, h: bw * 0.13 } });
    });
  }
  const ICON = {
    can(g) {
      g.fillStyle = A.C.teal; g.beginPath(); A.rect(g, -26, -12, 40, 38, 8, 2, 0.5); g.fill();
      A.line(g, A.C.teal, 8, (h) => { h.moveTo(12, 8); h.lineTo(36, -16); });
      g.save(); g.translate(38, -19); g.rotate(-0.78); g.beginPath(); g.ellipse(0, 0, 6, 13, 0, 0, 7); g.fillStyle = A.shade(A.C.teal, -0.08); g.fill(); g.restore();
      A.line(g, A.C.teal, 6.5, (h) => { h.arc(-28, 4, 15, Math.PI * 0.5, Math.PI * 1.5); });
      A.line(g, A.shade(A.C.teal, 0.14), 4, (h) => { h.moveTo(-18, -4); h.lineTo(6, -4); });
      g.fillStyle = A.C.blue; for (const [x, y] of [[40, 2], [48, 14], [34, 18]]) { g.beginPath(); g.ellipse(x, y, 3.4, 5.4, 0, 0, 7); g.fill(); }
    },
    bell(g) {
      g.fillStyle = A.C.marigold; g.beginPath(); g.moveTo(-28, 16); g.quadraticCurveTo(-24, -30, 0, -30); g.quadraticCurveTo(24, -30, 28, 16); g.closePath(); g.fill();
      g.beginPath(); A.rect(g, -34, 14, 68, 10, 5, 2, 0); g.fillStyle = A.shade(A.C.marigold, -0.1); g.fill();
      g.beginPath(); g.arc(0, 30, 7, 0, 7); g.fillStyle = A.C.bark; g.fill(); g.beginPath(); g.arc(0, -33, 6, 0, 7); g.fill();
      A.line(g, 'rgba(255,255,255,.6)', 5, (h) => { h.arc(0, -4, 18, Math.PI * 1.1, Math.PI * 1.45); });
    },
    turn(g) {
      A.line(g, A.C.plum, 9, (h) => { h.arc(0, 2, 24, -Math.PI * 0.95, Math.PI * 0.55); });
      g.save(); g.translate(24 * Math.cos(Math.PI * 0.55), 2 + 24 * Math.sin(Math.PI * 0.55)); g.rotate(Math.PI * 0.55 + Math.PI / 2); g.beginPath(); g.moveTo(-15, -4); g.lineTo(14, 0); g.lineTo(-10, 17); g.closePath(); g.fillStyle = A.C.plum; g.fill(); g.restore();
      g.beginPath(); A.rect(g, -11, -8, 22, 16, 3, 2, 0); g.fillStyle = A.alpha('#7A5238', 0.9); g.fill();
    },
  };
  const NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7];

  function start(st, ctx) {
    const W = st.W, H = st.H, land = W >= 1150, level = ctx.level;
    /* ---------- layout ---------- */
    const G = { land };
    if (land) {
      G.S = 640; G.by = 186; const pw = Math.min(470, W - G.S - 190); G.bx = (W - G.S - 70 - pw) / 2; const px = G.bx + G.S + 70;
      G.card = { x: px, y: 176, w: pw, h: 210 }; G.lab = { x: px + pw / 2, y: 468, size: 76, w: pw };
      G.btnR = 72; G.btnY = 730; G.turnX = px + pw * 0.26; G.canX = px + pw * 0.74;
    } else {
      G.card = { x: 30, y: 146, w: W - 60, h: 124 }; G.by = 302;
      G.S = Math.max(300, Math.min(W - 96, H - G.by - 330)); G.bx = (W - G.S) / 2;
      G.lab = { x: W / 2, y: G.by + G.S + 84, size: 60, w: W - 50 };
      G.btnR = 62; G.btnY = Math.min(H - 150, G.lab.y + 190); G.turnX = W * 0.27; G.canX = W * 0.73;
    }
    const S = G.S;
    st.add({ z: 0, sprite: backdrop(W, H) });

    /* ---------- state ---------- */
    let R = null, rows = 1, cols = 1, cell = S / 5, won = 0, skill = 0, played = 0, prevKey = '', lastAct = 0, toldCan = false, toldTurn = false, bag = [];
    const born = [], lit = [], chip = [], bloomAt = [];
    for (let r = 0; r < 12; r++) born.push(new Array(12).fill(-9));
    let ghost = null, waiter = null, drag = null;
    const busy = () => !R || R.phase !== 'build';

    function setDims(r, c, quiet) {
      r = K.clamp(r, 1, R.max); c = K.clamp(c, 1, R.max);
      if (r === rows && c === cols) return;
      let k = 0;
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) if (i >= rows || j >= cols) born[i][j] = st.t + Math.min(0.3, 0.016 * k++);
      const grew = r * c > rows * cols; rows = r; cols = c; lastAct = st.t;
      if (!quiet) { K.sfx.tone(240 * Math.pow(2, Math.min(rows * cols, 72) / 30), 0.09, { type: 'triangle', vol: 0.16 }); if (grew) K.sfx.noise(0.04, { freq: 1800, vol: 0.05 }); }
      lab.set(liveText()); if (ghost && ghost.r === rows && ghost.c === cols) ghost = null;
    }
    function liveText() {
      if (!R) return '';
      if (R.kind === 'share') return '';
      if (R.kind === 'rows') return `${rows} ${rows === 1 ? 'row' : 'rows'} of ${cols}`;
      return level >= 3 ? `${rows} ${X} ${cols} = ${rows * cols}` : `${rows} ${X} ${cols}`;
    }

    /* ---------- the bed ---------- */
    const bed = st.add({ z: 10, x: G.bx, y: G.by, label: 'Garden bed', hit: { x: -20, y: -20, w: S + 40, h: S + 40 }, pad: 16, turn: 0, shake: 0 });
    bed.draw = (g) => {
      if (!R) return;
      const c = cell, sway = st.t;
      g.save(); g.translate(Math.sin(bed.shake * 30) * bed.shake * 14, 0);
      put(g, bedSprite(S, R.max), 0, 0);
      if (ghost) { g.save(); g.globalAlpha = 0.55 + Math.sin(st.t * 6) * 0.3; g.setLineDash([16, 12]); g.lineDashOffset = -st.t * 30; g.lineWidth = 7; g.strokeStyle = '#FFF6C8'; g.beginPath(); g.roundRect(4, 4, ghost.c * c - 8, ghost.r * c - 8, 12); g.stroke(); g.restore(); }
      g.save();
      const tk = bed.turn; if (tk) { g.translate(rows * c * tk, 0); g.rotate(tk * Math.PI / 2); }
      for (let r = 0; r < rows; r++) if (lit[r]) { const a = Math.min(1, (st.t - lit[r]) * 6); g.beginPath(); g.roundRect(3, r * c + 3, cols * c - 6, c - 6, Math.min(16, c * 0.3)); g.fillStyle = `rgba(255,236,150,${0.2 + 0.25 * a + (1 - a) * 0.4})`; g.fill(); }
      const sp = plant('sprout', c * 0.8), bl = R.bloom ? plant(R.bloom, c * (TALL[R.bloom] > 1 ? 0.74 : 0.8)) : null;
      for (let r = 0; r < rows; r++) {
        const bt = bloomAt[r] != null ? st.t - bloomAt[r] : -1;
        for (let q = 0; q < cols; q++) {
          const age = st.t - born[r][q]; if (age <= 0) continue;
          let k = age >= 0.24 ? 1 : E.ease.back(age / 0.24), pic = sp;
          if (bt > q * 0.03) { pic = bl; const b = bt - q * 0.03; k = b >= 0.34 ? 1 : E.ease.back(b / 0.34); }
          g.save(); g.translate((q + 0.5) * c, (r + 0.9) * c); g.rotate(Math.sin(sway * 1.7 + q * 0.9 + r * 1.3) * 0.05 - tk * Math.PI / 2);
          put(g, pic, 0, 0, k); g.restore();
        }
      }
      g.restore();
      // skip-count numbers at the end of each counted row
      const cr = Math.min(32, Math.max(22, c * 0.46));
      for (let r = 0; r < rows; r++) if (chip[r]) {
        const x = Math.min(cols * c + cr + 6, W - cr - 8 - bed.x), y = (r + 0.5) * c, k = Math.min(1, (st.t - lit[r]) / 0.2), q = E.ease.back(k);
        g.save(); g.translate(x, y); g.scale(q, q); g.beginPath(); g.arc(0, 0, cr, 0, 7); g.fillStyle = 'rgba(46,40,70,.2)'; g.fill(); g.beginPath(); g.arc(-1.5, -3, cr, 0, 7); g.fillStyle = '#FFF9EA'; g.fill();
        text(g, String(chip[r]), -1.5, -2, cr * (chip[r] > 99 ? 0.82 : 1.08), A.C.ink); g.restore();
      }
      // the corner handle
      if (R.phase === 'build' && R.kind !== 'share') {
        const idle = st.t - lastAct > 3.5, q = (drag ? 1.15 : 1) * (idle ? 1 + Math.sin(st.t * 5) * 0.09 : 1), hr = G.land ? 34 : 38;
        g.save(); g.translate(cols * c, rows * c); g.scale(q, q);
        g.beginPath(); g.arc(2, 5, hr, 0, 7); g.fillStyle = 'rgba(46,40,70,.25)'; g.fill();
        g.beginPath(); g.arc(0, 0, hr, 0, 7); g.fillStyle = A.C.marigold; g.fill(); g.lineWidth = 5; g.strokeStyle = '#FFF9EA'; g.stroke();
        g.rotate(Math.PI / 4); g.fillStyle = '#FFF9EA';
        for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * hr * 0.72, 0); g.lineTo(d * hr * 0.3, -hr * 0.34); g.lineTo(d * hr * 0.3, hr * 0.34); g.closePath(); g.fill(); }
        g.fillRect(-hr * 0.34, -hr * 0.11, hr * 0.68, hr * 0.22);
        g.restore();
      }
      g.restore();
    };
    bed.update = (dt) => { bed.shake = Math.max(0, bed.shake - dt); };
    bed.onDown = (p) => {
      if (!R || R.kind === 'share') return;
      const x = p.x - bed.x, y = p.y - bed.y;
      if (R.phase === 'tap') { const r = Math.floor(y / cell); if (r >= 0 && r < rows && x < cols * cell + 70) tapRow(r); return; }
      if (R.phase !== 'build') return;
      const hx = cols * cell, hy = rows * cell;
      if (Math.hypot(x - hx, y - hy) < 58) drag = { ox: x - hx, oy: y - hy };
      else { setDims(Math.ceil(y / cell), Math.ceil(x / cell)); drag = { ox: x - cols * cell, oy: y - rows * cell }; }
      lastAct = st.t;
    };
    bed.onMove = (p) => { if (!drag || busy()) return; setDims(Math.round((p.y - bed.y - drag.oy) / cell), Math.round((p.x - bed.x - drag.ox) / cell)); };
    bed.onUp = () => { drag = null; };
    bed.onTap = (p) => { if (!p && R && R.phase === 'build' && R.kind !== 'share') setDims(rows, cols >= R.max ? 1 : cols + 1); else if (!p && R && R.phase === 'tap') tapRow(lit.slice(0, rows).findIndex((v) => !v)); };   // keyboard: one more in each row; the turn button swaps rows and columns

    /* ---------- card, label, buttons ---------- */
    const cardSp = () => A.sprite(`tg-card-${Math.round(G.card.w)}x${G.card.h}`, [0, 0, G.card.w, G.card.h], (g, s) => {
      g.beginPath(); A.rect(g, 0, 0, G.card.w, G.card.h, 26, 4, 2); A.paper(g, s, '#FFF9EA', { box: { x: 0, y: 0, w: G.card.w, h: G.card.h } });
      g.beginPath(); A.rect(g, 14, 14, G.card.w - 28, G.card.h - 28, 16, 6, 1); g.lineWidth = 3; g.setLineDash([3, 9]); g.lineCap = 'round'; g.strokeStyle = A.alpha(A.C.leafDark, 0.45); g.stroke();
    });
    const card = st.add({ z: 15, x: G.card.x + G.card.w / 2, y: G.card.y + G.card.h / 2, pop: 0 });
    function miniArray(g, x, y, size, r, c, on) {
      const m = Math.max(r, c), d = size / m;
      g.save(); g.translate(x - (c * d) / 2, y - (r * d) / 2);
      g.beginPath(); g.roundRect(-5, -5, c * d + 10, r * d + 10, 7); g.fillStyle = on ? '#7A5238' : 'rgba(122,82,56,.16)'; g.fill();
      if (on) { g.fillStyle = '#9CCB58'; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { g.beginPath(); g.arc((j + 0.5) * d, (i + 0.5) * d, d * 0.32, 0, 7); g.fill(); } }
      g.restore();
    }
    card.draw = (g) => {
      if (!R) return;
      const cw = G.card.w, ch = G.card.h, big = ch * (G.land ? 0.46 : 0.6);
      put(g, cardSp(), -cw / 2, -ch / 2);
      g.save(); const q = 1 + card.pop * 0.12; g.scale(q, q);
      if (R.kind === 'rows') {
        const ms = Math.min(ch * 0.5, 96);
        text(g, `${R.rows} rows of ${R.cols}`, -ms * 0.6, 0, big * 0.8, A.C.ink, { max: cw - ms - 110 });
        miniArray(g, cw / 2 - ms * 0.5 - 44, 0, ms, R.rows, R.cols, true);
      } else if (R.kind === 'fact') {
        const sub = level < 3;
        text(g, `${R.rows} ${X} ${R.cols}`, 0, sub && G.land ? -ch * 0.12 : sub ? -ch * 0.1 : 0, big, A.C.ink, { max: cw - 70 });
        if (sub) text(g, `${R.rows} rows of ${R.cols}`, 0, ch * 0.29, big * 0.36, A.C.leafDark, { font: A.FONT_BODY });
      } else if (R.kind === 'missing') {
        const parts = R.hole === 'rows' ? ['?', X, R.cols, '=', R.total] : [R.rows, X, '?', '=', R.total];
        g.font = `700 ${big}px ${A.FONT_TITLE}`; const gap = big * 0.26; let tw = -gap; const ws = parts.map((t) => { const w = g.measureText(String(t)).width; tw += w + gap; return w; });
        const k = Math.min(1, (cw - 70) / tw); g.scale(k, k); let x = -tw / 2;
        parts.forEach((t, i) => { if (t === '?') { g.save(); g.translate(x + ws[i] / 2, 0); g.rotate(Math.sin(st.t * 3) * 0.12); text(g, R.phase === 'done' ? String(R.hole === 'rows' ? R.rows : R.cols) : '?', 0, 0, big * 1.08, A.C.tomato); g.restore(); } else text(g, String(t), x + ws[i] / 2, 0, big, A.C.ink); x += ws[i] + gap; });
      } else if (R.kind === 'total') {
        const n = R.goal, slot = Math.min(G.land ? 92 : 78, (cw - 190) / n - 12), x0 = -cw / 2 + 96;
        text(g, String(R.total), x0, G.land ? -4 : 0, big * (G.land ? 1.15 : 1), A.C.ink);
        for (let i = 0; i < n; i++) {
          const f = R.found[i], x = x0 + 96 + (i + 0.5) * ((cw - 210) / n), k = f ? E.ease.back(Math.min(1, (st.t - f.t) / 0.3)) : 1;
          g.save(); g.translate(x, G.land ? -14 : -12); g.scale(k, k);
          if (f) { miniArray(g, 0, 0, slot * 0.72, f.r, f.c, true); text(g, `${f.r}${X}${f.c}`, 0, slot * 0.62, slot * 0.3, A.C.ink, { font: A.FONT_BODY }); }
          else { g.beginPath(); g.roundRect(-slot * 0.4, -slot * 0.4, slot * 0.8, slot * 0.8, 10); g.setLineDash([6, 8]); g.lineWidth = 3; g.strokeStyle = A.alpha(A.C.bark, 0.5); g.stroke(); }
          g.restore();
        }
      } else if (R.kind === 'share') {
        text(g, `${R.total} ${DIV} ${R.B}`, 0, 0, big, A.C.ink, { max: cw - 70 });
      }
      g.restore();
    };
    card.update = (dt) => { card.pop = Math.max(0, card.pop - dt * 2.5); };

    const lab = st.add({ z: 16, x: G.lab.x, y: G.lab.y, main: '', sub: '', big: 0 });
    lab.set = (m, sub, big) => { if (m === lab.main && (sub || '') === lab.sub && !big === !lab.big) return; lab.main = m; lab.sub = sub || ''; lab.big = big ? 1 : 0; lab.sx = lab.sy = big ? 0.5 : 0.9; lab.to({ sx: 1, sy: 1 }, { dur: big ? 0.5 : 0.18, ease: big ? 'elastic' : 'out' }); };
    lab.draw = (g) => {
      if (!lab.main) return;
      const z = G.lab.size * (lab.big ? 1 : 0.74); g.font = `700 ${z}px ${A.FONT_TITLE}`;
      const tw = Math.min(G.lab.w - 40, g.measureText(lab.main).width), w = tw + 64, h = z * 1.36;
      g.beginPath(); g.roundRect(-w / 2 + 2, -h / 2 + 5, w, h, h / 2); g.fillStyle = 'rgba(46,40,70,.16)'; g.fill();
      g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fillStyle = lab.big ? '#FFF6C8' : 'rgba(255,249,234,.94)'; g.fill();
      text(g, lab.main, 0, 2, z, lab.big ? A.C.tomato : A.C.ink, { max: G.lab.w - 40 });
      if (lab.sub) { const y = h / 2 + G.lab.size * 0.42; g.font = `700 ${G.lab.size * 0.4}px ${A.FONT_BODY}`; const sw = Math.min(G.lab.w - 30, g.measureText(lab.sub).width) + 40; g.beginPath(); g.roundRect(-sw / 2, y - G.lab.size * 0.3, sw, G.lab.size * 0.6, G.lab.size * 0.3); g.fillStyle = 'rgba(255,249,234,.9)'; g.fill(); text(g, lab.sub, 0, y + 1, G.lab.size * 0.4, A.C.slate, { font: A.FONT_BODY, max: G.lab.w - 30 }); }
    };

    const disc = () => A.sprite('tg-disc', [-64, -64, 128, 128], (g, s) => { g.beginPath(); g.arc(0, 0, 60, 0, 7); A.paper(g, s, '#FFF9EA', { depth: 1.2, box: { x: -60, y: -60, w: 120, h: 120 } }); });
    function button(x, label, icon, onTap) {
      const r = G.btnR, n = st.add({ z: 20, x, y: G.btnY, hitR: r + 4, label, pulse: false, wob: 0, icon });
      n.draw = (g) => {
        const q = (n.pulse ? 1 + Math.sin(st.t * 6) * 0.07 : 1) * r / 60;
        g.save(); g.scale(q, q); g.rotate(Math.sin(n.wob * 26) * n.wob * 0.5);
        if (n.pulse) { g.beginPath(); g.arc(0, 0, 70 + Math.sin(st.t * 6) * 4, 0, 7); g.fillStyle = 'rgba(255,246,200,.75)'; g.fill(); }
        put(g, disc(), 0, 0); n.icon(g); g.restore();
      };
      n.update = (dt) => { n.wob = Math.max(0, n.wob - dt); };
      n.onTap = () => { lastAct = st.t; onTap(); };
      return n;
    }
    const turnBtn = button(G.turnX, 'Turn the bed', ICON.turn, () => turn());
    const can = button(G.canX, 'Ready', ICON.can, () => ready());
    

    /* ---------- sharing a harvest (division) ---------- */
    const share = st.add({ z: 10, x: G.bx, y: G.by, visible: false });
    let apples = [], baskets = [];
    share.draw = (g) => {
      if (!R || R.kind !== 'share' || !G.share) return;
      const hr = Math.ceil(R.total / 8), a = G.share.a, h = a * (0.92 * hr + 0.5), w = Math.min(S + 40, a * (Math.min(8, R.total) + 1.2));
      put(g, A.sprite(`tg-cloth-${Math.round(w)}x${Math.round(h)}`, [-w / 2, 0, w, h], (c, q) => {
        c.beginPath(); A.rect(c, -w / 2, 0, w, h, 26, 8, 3); A.paper(c, q, '#F3DDB8', { box: { x: -w / 2, y: 0, w, h } });
        c.save(); c.clip(); c.fillStyle = A.alpha(A.C.tomato, 0.2); for (let x = -w / 2 + 22; x < w / 2; x += 56) c.fillRect(x, 0, 20, h); c.fillStyle = A.alpha(A.C.tomato, 0.13); for (let y = 16; y < h; y += 56) c.fillRect(-w / 2, y, w, 20); c.restore();
      }), S / 2, a * 0.2);
      for (const b of baskets) { g.beginPath(); g.ellipse(b.x + 4, b.y + 2, G.share.bw * 0.5, G.share.bw * 0.1, 0, 0, 7); g.fillStyle = 'rgba(40,70,40,.25)'; g.fill(); }
    };
    function shareSetup() {
      for (const n of share.children.slice()) n.remove();
      apples = []; baskets = [];
      const N = R.total, B = R.B, per = 8, a = S / 8.6, sp = plant('apple', a), rnd = A.rng(N * 7 + B);
      const bw = Math.min(190, (S + 30) / B - 16), bs = basketSprite(bw), by = S * 0.97;
      for (let i = 0; i < B; i++) {
        const x = S / 2 + (i - (B - 1) / 2) * (bw + 16);
        const b = share.add(new E.Node({ z: 3, x, y: by, i, n: 0, hit: { x: -bw * 0.56, y: -bw * 1.5, w: bw * 1.12, h: bw * 1.55 }, pad: 6, label: 'Basket ' + (i + 1), wob: 0, pulse: false }));
        b.draw = (g) => {
          g.save(); g.rotate(Math.sin(b.wob * 28) * b.wob * 0.3); if (b.pulse) { const q = 1 + Math.sin(st.t * 6) * 0.05; g.scale(q, q); }
          put(g, bs, 0, 0);
          g.beginPath(); g.arc(0, -bw * 0.34, bw * 0.2, 0, 7); g.fillStyle = '#FFF9EA'; g.fill(); text(g, String(b.n), 0, -bw * 0.33, bw * 0.27, A.C.ink);
          g.restore();
        };
        b.update = (dt) => { b.wob = Math.max(0, b.wob - dt); };
        b.onTap = () => give(i);
        baskets.push(b);
      }
      for (let i = 0; i < N; i++) {
        const row = Math.floor(i / per), inRow = Math.min(per, N - row * per);
        const hx = S / 2 + (i % per - (inRow - 1) / 2) * a + (rnd() - 0.5) * a * 0.22, hy = a * 1.05 + row * a * 0.92 + (rnd() - 0.5) * a * 0.2;
        const n = share.add(new E.Node({ z: 1, x: hx, y: hy, hx, hy, sprite: sp, where: -1, sx: 0, sy: 0, rot: (rnd() - 0.5) * 0.5 }));
        n.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back', delay: i * 0.025 });
        apples.push(n);
      }
      G.share = { a, bw };
    }
    function slot(b, k) { const bw = G.share.bw; return { x: b.x + ((k % 3) - 1) * bw * 0.27, y: b.y - bw * 0.62 - Math.floor(k / 3) * bw * 0.23 }; }
    function give(i) {
      if (busy() || R.kind !== 'share') return;
      const b = baskets[i], a = apples.filter((n) => n.where < 0).pop(); lastAct = st.t;
      if (!a) { K.sfx.whoops(); b.wob = 0.5; return; }
      const p = slot(b, b.n), k = (G.share.bw * 0.34) / G.share.a; a.where = i; a.k = b.n; b.n++; b.press();
      a.z = 2; share._sorted = false;
      a.to({ x: p.x, y: p.y, sx: k, sy: k, rot: 0 }, { dur: 0.28, ease: 'out' });
      K.sfx.tone(330 + b.n * 34, 0.1, { type: 'triangle', vol: 0.2 }); K.sfx.noise(0.03, { freq: 900, vol: 0.08, delay: 0.24 });
      lab.set(liveText());
    }
    function sendBack(a) { baskets[a.where].n--; a.where = -1; a.z = 1; share._sorted = false; a.to({ x: a.hx, y: a.hy, sx: 1, sy: 1 }, { dur: 0.4, ease: 'inOut' }); }

    /* ---------- rounds ---------- */
    const WAYS = (n, max) => { const out = []; for (let r = 2; r <= max; r++) if (n % r === 0 && n / r >= 2 && n / r <= max) out.push({ r, c: n / r }); return out; };
    function make(kind) {
      const hi = (a, b) => Math.round(a + (b - a) * K.clamp(skill, 0, 1)), ri = K.randInt;
      const q = { kind, misses: 0, phase: 'build', found: [], bloom: K.pick(BLOOMS) };
      for (let tries = 0; tries < 30; tries++) {
        if (level <= 1) { q.kind = 'rows'; q.max = 5; q.rows = ri(2, hi(3, 5)); q.cols = ri(2, hi(3, 5)); }
        else if (level === 2) { q.kind = 'fact'; q.max = 10; q.cols = K.pick([2, 5, 10]); q.rows = ri(2, hi(4, 10)); q.turnStep = played % 2 === 1 && q.rows !== q.cols; if (kind === 'turn') q.turnStep = true; }
        else {
          q.max = skill > 0.55 ? 12 : 10;
          if (kind === 'share') { q.B = ri(2, 5); const each = ri(2, Math.min(hi(4, 9), Math.floor(30 / q.B))); q.rem = Math.random() < 0.6 ? ri(1, q.B - 1) : 0; q.total = q.B * each + q.rem; q.each = each; }
          else if (kind === 'total') { q.total = K.pick([12, 16, 18, 20, 24, 30, 36, 40, 48, 60].slice(0, hi(6, 10))); q.ways = WAYS(q.total, q.max); q.goal = Math.min(3, q.ways.length); }
          else { q.rows = ri(hi(2, 4), hi(5, q.max)); q.cols = ri(hi(3, 6), hi(7, q.max)); if (Math.random() < 0.5) [q.rows, q.cols] = [q.cols, q.rows]; q.total = q.rows * q.cols; if (kind === 'missing') q.hole = Math.random() < 0.5 ? 'rows' : 'cols'; }
        }
        q.key = q.kind + (q.kind === 'share' ? q.total + '/' + q.B : q.kind === 'total' ? q.total : q.rows + 'x' + q.cols);
        if (q.key !== prevKey) break;
      }
      prevKey = q.key; return q;
    }
    function nextKind() { if (level < 3) return null; if (!bag.length) bag = played === 0 ? ['fact', 'total', 'missing', 'share'] : K.shuffle(['fact', 'total', 'missing', 'share']); return bag.shift(); }
    function newRound(kind) {
      R = make(kind || nextKind()); waiter = null; ghost = null; drag = null;
      for (let r = 0; r < 12; r++) { lit[r] = 0; chip[r] = 0; bloomAt[r] = null; }
      rows = 0; cols = 0; bed.turn = 0; can.pulse = turnBtn.pulse = false; lastAct = st.t;
      const sh = R.kind === 'share'; bed.visible = !sh; share.visible = sh; turnBtn.visible = level >= 2 && !sh; can.icon = sh ? ICON.bell : ICON.can; can.x = turnBtn.visible ? G.canX : (G.land ? (G.turnX + G.canX) / 2 : W / 2);
      card.pop = 1; lab.main = '';
      if (sh) { shareSetup(); lab.set(liveText()); }
      else { cell = S / R.max; setDims(1, 1, true); born[0][0] = st.t + 0.2; }
      const first = played === 0; played++;
      if (R.kind === 'rows') ctx.prompt(`${T.rows(R.rows)} ${T.each(R.cols)}` + (first ? ' ' + T.drag : ''), { show: `Plant ${R.rows} rows of ${R.cols}` });
      else if (R.kind === 'fact') ctx.prompt(T.card + (first ? ' ' + T.drag + ' ' + T.can : ''), { show: `Plant ${R.rows} rows of ${R.cols}` });
      else if (R.kind === 'total') ctx.prompt(T.total, { show: `Make ${R.total} in as many ways as you can` });
      else if (R.kind === 'missing') ctx.prompt(`${T.missing} ${T.stretch}`, { show: R.hole === 'rows' ? `? ${X} ${R.cols} = ${R.total}` : `${R.rows} ${X} ? = ${R.total}` });
      else ctx.prompt(`${T.share} ${T.basket} ${T.bell}`, { show: `Share ${R.total} apples between ${R.B} baskets` });
    }

    const fits = () => {
      if (R.kind === 'rows' || (R.kind === 'fact' && level < 3)) return rows === R.rows && cols === R.cols;
      if (R.kind === 'fact') return (rows === R.rows && cols === R.cols) || (rows === R.cols && cols === R.rows);
      if (R.kind === 'total') return rows * cols === R.total && rows > 1 && cols > 1;
      const known = R.hole === 'rows' ? R.cols : R.rows; return rows * cols === R.total && (rows === known || cols === known);
    };
    function miss(hint) {
      R.misses++; K.sfx.whoops(); bed.shake = 0.45; can.wob = 0.5; ctx.say(hint);
      if (R.misses >= 2 && R.kind !== 'share') ghost = R.kind === 'total' ? (() => { const w = R.ways.find((o) => !R.found.some((f) => f.r === o.r && f.c === o.c)); return w ? { r: w.r, c: w.c } : null; })() : { r: R.rows, c: R.cols };
    }
    function ready() {
      if (busy()) return;
      if (R.kind === 'share') return ring();
      K.sfx.whoosh(); can.wob = 0.3;
      if (R.kind === 'total' && rows * cols === R.total && R.found.some((f) => f.r === rows && f.c === cols)) { K.sfx.whoops(); bed.shake = 0.4; ctx.say(T.already); return; }
      if (fits()) return grow();
      const n = rows * cols;
      if (R.kind === 'rows' || (R.kind === 'fact' && level < 3)) {
        if (level >= 2 && rows === R.cols && cols === R.rows) { turnBtn.pulse = true; miss(T.hTurn); }
        else miss(rows !== R.rows ? T.hRows : T.hEach);
      } else if (n === R.total) miss(R.kind === 'missing' ? T.stretch : T.another);
      else miss(n > R.total ? T.many : T.few);
    }
    function countRow(r, speak) {
      if (lit[r]) return false;
      const k = lit.filter(Boolean).length + 1, v = k * cols; lit[r] = st.t; chip[r] = v;
      K.sfx.note(NOTES[(k - 1) % NOTES.length], 0.4);
      if (speak && v <= 20) K.say(T.count(v));
      return true;
    }
    function tapRow(r) { if (!R || R.phase !== 'tap') return; lastAct = st.t; if (countRow(r, true) && lit.filter(Boolean).length >= rows && waiter) { const w = waiter; waiter = null; w(); } }
    function turn() {
      if (!R || R.kind === 'share' || bed.turn || (R.phase !== 'build' && R.phase !== 'turn')) return Promise.resolve();
      K.sfx.whoosh(); turnBtn.pulse = false; turnBtn.wob = 0.3;
      const wasTurnStep = R.phase === 'turn'; if (wasTurnStep) R.phase = 'turning';
      for (let r = 0; r < 12; r++) { lit[r] = 0; chip[r] = 0; }
      return bed.to({ turn: 1 }, { dur: 0.7, ease: 'inOut' }).then(() => {
        const r0 = rows; rows = cols; cols = r0; bed.turn = 0;
        for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) born[i][j] = -9;
        K.sfx.pop(); if (ghost && ghost.r === rows && ghost.c === cols) ghost = null;
        if (wasTurnStep) { if (waiter) { const w = waiter; waiter = null; w(); } } else lab.set(liveText());
      });
    }
    const pause = () => new Promise((res) => { waiter = res; });
    async function grow() {
      const r = R, n = rows * cols; r.phase = 'count'; can.pulse = false; ghost = null;
      ctx.fx.burst(bed.x + cols * cell / 2, bed.y + rows * cell / 2, { n: 14, colors: ['#86BCD0', '#5B8FC7', '#CFE6E8'], star: false });
      K.sfx.noise(0.5, { filter: 'highpass', freq: 3200, vol: 0.08 });
      await ctx.wait(450); if (R !== r) return;
      if (level === 2) { r.phase = 'tap'; ctx.prompt(T.tapRows); await pause(); if (R !== r) return; r.phase = 'count'; }
      else for (let i = 0; i < rows; i++) { countRow(i, level < 3); await ctx.wait(level >= 3 ? Math.max(90, 520 / rows) : 780); if (R !== r) return; }
      if (r.kind === 'total') {
        r.found.push({ r: rows, c: cols, t: st.t }); K.sfx.ding(); card.pop = 1;
        if (r.found.length < r.goal) { await ctx.wait(500); if (R !== r) return; for (let i = 0; i < 12; i++) { lit[i] = 0; chip[i] = 0; } r.phase = 'build'; r.misses = 0; ctx.say(T.another); return; }
      }
      lab.set(`${rows} ${X} ${cols} = ${n}`, rows > 1 && rows <= 6 && level < 3 ? new Array(rows).fill(cols).join(' + ') + ' = ' + n : '', true); K.sfx.ding();
      if (r.turnStep) {
        await ctx.wait(900); if (R !== r) return;
        r.phase = 'turn'; turnBtn.pulse = true; ctx.prompt(T.turn); await pause(); if (R !== r) return;
        lab.set(`${rows} ${X} ${cols} = ${n}`, `${cols} ${X} ${rows} = ${n}`, true); ctx.say(T.same); await ctx.wait(1500); if (R !== r) return;
      }
      r.phase = 'done';
      for (let i = 0; i < rows; i++) { bloomAt[i] = st.t + i * Math.min(0.14, 0.9 / rows); }
      K.sfx.sparkle(); ctx.after(300, () => K.sfx.sparkle());
      ctx.fx.burst(bed.x + cols * cell / 2, bed.y + rows * cell / 2, { n: 18 });
      if (won === 0 || level < 2) ctx.say(T.grew);
      await finish(r);
    }
    async function ring() {
      const r = R, B = r.B, left = apples.filter((a) => a.where < 0).length, ns = baskets.map((b) => b.n), lo = Math.min(...ns), hi = Math.max(...ns);
      K.sfx.ding(); can.wob = 0.5;
      if (lo !== hi) {                                             // not fair: the extra apples hop back onto the grass
        r.misses++; K.sfx.whoops(); ctx.say(T.unfair);
        for (const b of baskets) { b.wob = b.n > lo ? 0.5 : 0; while (b.n > lo) sendBack(apples.find((a) => a.where === b.i && a.k === b.n - 1)); }
        lab.set(liveText()); return;
      }
      if (left >= B) { r.misses++; K.sfx.whoops(); ctx.say(T.more); if (r.misses >= 2) for (const b of baskets) b.pulse = true; return; }
      r.phase = 'done'; for (const b of baskets) { b.pulse = false; b.press(); }
      lab.set(`${r.total} ${DIV} ${B} = ${lo}`, left ? `${left} left over` : '', true);
      K.sfx.sparkle(); ctx.fx.burst(share.x + S / 2, share.y + S * 0.6, { n: 18 });
      if (left) { ctx.say(T.rest); for (const a of apples) if (a.where < 0) { a.to({ sy: 1.25, sx: 1.25 }, { dur: 0.2 }).then(() => a.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'elastic' })); } }
      await finish(r);
    }
    async function finish(r) {
      await ctx.wait(2600); if (R !== r) return;
      won++; skill = K.clamp(skill + (r.misses >= 2 ? -0.1 : r.misses ? 0.04 : 0.14), 0, 1);
      if (won % 4 === 0) { await ctx.celebrate(); if (R !== r) return; }
      newRound();
    }
    // gentle nudges: the handle pulses on its own; the can waves once the garden looks ready
    ctx.every(1200, () => {
      if (busy()) return;
      const idle = st.t - lastAct;
      can.pulse = R.kind === 'share' ? idle > 9 && apples.filter((a) => a.where < 0).length < R.B : (level < 2 && fits() && idle > 1.6) || (idle > 9 && rows * cols > 1);
      if (level < 2 && can.pulse && !toldCan && fits()) { toldCan = true; ctx.say(T.can); }
    });

    K._times = {
      get R() { return R; }, get rows() { return rows; }, get cols() { return cols; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      geom: () => ({ bx: bed.x, by: bed.y, S, cell, unit: st.unit, can: { x: can.x, y: can.y }, turn: { x: turnBtn.x, y: turnBtn.y }, baskets: baskets.map((b) => ({ x: share.x + b.x, y: share.y + b.y - (G.share ? G.share.bw : 0) * 0.4 })) }),
      set: (r, c) => setDims(r, c), ready, turn, tapRow, give, jump: (kind) => newRound(kind),
      answer: () => (R.kind === 'share' ? { each: R.each, rem: R.rem } : R.kind === 'total' ? R.ways : { rows: R.rows, cols: R.cols }),
      get baskets() { return baskets.map((b) => b.n); }, get heap() { return apples.filter((a) => a.where < 0).length; },
    };
    ctx.onExit(() => { K._times = null; });
    ctx.after(350, () => newRound());
  }

  function icon(g, w) {
    g.fillStyle = '#8CBB6C'; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(164,207,121,.6)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(w * (0.1 + i * 0.22), w * (i % 2 ? 0.08 : 0.95), w * 0.16, w * 0.05, 0, 0, 7); g.fill(); }
    const s = w * 0.7, x0 = w * 0.13, y0 = w * 0.13;
    g.fillStyle = 'rgba(46,40,70,.18)'; g.beginPath(); g.roundRect(x0 - w * 0.03, y0 - w * 0.02, s + w * 0.08, s + w * 0.09, w * 0.07); g.fill();
    g.fillStyle = '#C08A5A'; g.beginPath(); g.roundRect(x0 - w * 0.04, y0 - w * 0.04, s + w * 0.08, s + w * 0.08, w * 0.07); g.fill();
    g.fillStyle = '#7A5238'; g.beginPath(); g.roundRect(x0, y0, s, s, w * 0.04); g.fill();
    const c = s / 3;
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      const on = r < 2, cx = x0 + (q + 0.5) * c, by = y0 + (r + 0.9) * c;
      if (!on) { g.beginPath(); g.ellipse(cx, by - c * 0.1, c * 0.24, c * 0.08, 0, 0, 7); g.fillStyle = 'rgba(52,30,18,.4)'; g.fill(); continue; }
      const im = IM[r === 0 ? 'sunflower' : 'sprout'];
      if (im) { const hh = c * (r === 0 ? 1.1 : 0.78), k = Math.min(c * 0.84 / im.width, hh / im.height); g.drawImage(im, cx - im.width * k / 2, by - im.height * k, im.width * k, im.height * k); }
      else { g.save(); g.translate(cx, by); paperPlant(g, r === 0 ? 'flowers' : 'sprout', c * 0.8); g.restore(); }
    }
    const hx = x0 + s, hy = y0 + c * 2;
    g.beginPath(); g.arc(hx, hy, w * 0.075, 0, 7); g.fillStyle = '#F2B33D'; g.fill(); g.lineWidth = w * 0.014; g.strokeStyle = '#FFF9EA'; g.stroke();
  }

  K.game({ id: 'times', title: 'Times Garden', voice: 'times', group: 'arcade', age: 7, subject: 'math', order: 35, icon, start, lines, resize: () => K.go('times') });
})();
