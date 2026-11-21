/* Bubble Pop — soft bubbles float up from the frog's pond.
   A touch pops a bubble at once. Bubbles never run out and nothing is lost when one floats away.
   A wrong bubble only wobbles and bounces aside, with a spoken hint; after two misses the right
   ones glow.
   Level 1: pop anything (each pop says its colour), then "Pop the red bubbles!" with 2-4 colours.
   Level 2: bubbles carry numbers or shapes: "Pop number four!", "Pop the stars!".
   Level 3: bubbles carry numbers 1-20 and the ask is a rule: even / odd, bigger / smaller than ten,
            the answer to a small sum, or skip counting in order by twos and fives.
   A round is 3-5 right pops; every fourth round ends in a celebration, then play carries on. */
(function () {
  'use strict';
  const A = K.art;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = (n) => K.numWord(n);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));

  const COLS = [
    { name: 'red', c: '#E5483F' }, { name: 'yellow', c: '#F6C12C' }, { name: 'green', c: '#55B45C' },
    { name: 'blue', c: '#3E8FE2' }, { name: 'purple', c: '#9460C8' },
  ];
  const SHAPES = [{ name: 'star', many: 'stars' }, { name: 'heart', many: 'hearts' }, { name: 'triangle', many: 'triangles' }, { name: 'square', many: 'squares' }];
  const SUMS = [[2, 3], [3, 4], [4, 5], [6, 6], [7, 6], [9, 8]];
  const SKIPS = { skip2: { word: 'twos', seq: [2, 4, 6, 8, 10], long: [2, 4, 6, 8, 10, 12] }, skip5: { word: 'fives', seq: [5, 10, 15, 20], long: [5, 10, 15, 20] } };
  const T = {
    free: 'Pop the bubbles!',
    color: (c) => `Pop the ${c.name} bubbles!`,
    colorName: (c) => `${cap(c.name)}!`,
    number: (n) => `Pop number ${num(n)}!`,
    numName: (n) => `${cap(num(n))}!`,
    shape: (s) => `Pop the ${s.many}!`,
    shapeName: (s) => `A ${s.name}!`,
    even: 'Pop the even numbers!', odd: 'Pop the odd numbers!',
    isEven: 'That is an even number.', isOdd: 'That is an odd number.',
    big: 'Pop numbers bigger than ten!', small: 'Pop numbers smaller than ten!',
    notBig: 'That is not bigger than ten.', notSmall: 'That is not smaller than ten.',
    sum: (a, b) => `Pop the answers to ${num(a)} plus ${num(b)}!`,
    sumIs: (a, b) => `${cap(num(a))} plus ${num(b)} is ${num(a + b)}.`,
    skip: (k) => `Count by ${SKIPS[k].word}!`,
    startAt: (n) => `Start at ${num(n)}.`,
    next: 'What comes next?',
  };
  function lines() {
    const out = [T.free, T.even, T.odd, T.isEven, T.isOdd, T.big, T.small, T.notBig, T.notSmall, T.next];
    for (const c of COLS) out.push(T.color(c), T.colorName(c));
    for (const s of SHAPES) out.push(T.shape(s), T.shapeName(s));
    for (let n = 1; n <= 10; n++) out.push(T.number(n));
    for (let n = 1; n <= 20; n++) out.push(T.numName(n));
    for (const [a, b] of SUMS) out.push(T.sum(a, b), T.sumIs(a, b));
    for (const k in SKIPS) out.push(T.skip(k), T.startAt(SKIPS[k].seq[0]));
    return out;
  }

  /* ---------------- pictures ---------------- */
  const PIC = {};
  function pic(path) {
    let e = PIC[path];
    if (!e) { e = PIC[path] = { im: new Image(), ok: false }; e.im.onload = () => { e.ok = true; }; e.im.src = 'img/' + path + '.webp'; }
    return e.ok ? e.im : null;
  }
  ['bobo/bg-day', 'bobo/frog', 'tales/lilypad'].forEach(pic);

  /* ---------------- drawing ---------------- */
  /** One soft bubble of radius r at (0,0). Plain canvas calls only, so the thumbnail can use it too. */
  function paintBubble(g, r, col, s) {
    g.save();
    g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = r * 0.12 * s; g.shadowOffsetY = r * 0.07 * s;
    const gr = g.createRadialGradient(-r * 0.32, -r * 0.36, r * 0.06, 0, 0, r);
    gr.addColorStop(0, A.alpha(A.mix(col, '#ffffff', 0.6), 0.94)); gr.addColorStop(0.62, A.alpha(A.mix(col, '#ffffff', 0.08), 0.9)); gr.addColorStop(1, A.alpha(A.shade(col, -0.1), 0.96));
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = gr; g.fill();
    g.restore();
    g.beginPath(); g.arc(0, 0, r * 0.965, 0, 7); g.strokeStyle = 'rgba(255,255,255,.62)'; g.lineWidth = r * 0.045; g.stroke();
    g.beginPath(); g.ellipse(-r * 0.4, -r * 0.5, r * 0.27, r * 0.13, -0.62, 0, 7); g.fillStyle = 'rgba(255,255,255,.88)'; g.fill();
    g.beginPath(); g.arc(-r * 0.66, -r * 0.2, r * 0.06, 0, 7); g.fill();
    g.beginPath(); g.arc(0, 0, r * 0.8, 0.35, 1.2); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = r * 0.07; g.lineCap = 'round'; g.stroke();
  }
  function shapePath(g, name, r) {
    g.beginPath();
    if (name === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.5 : r * 1.08; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); }
    else if (name === 'heart') { g.moveTo(0, r * 0.95); g.bezierCurveTo(-r * 1.5, -r * 0.1, -r * 0.75, -r * 1.2, 0, -r * 0.42); g.bezierCurveTo(r * 0.75, -r * 1.2, r * 1.5, -r * 0.1, 0, r * 0.95); g.closePath(); }
    else if (name === 'triangle') { g.moveTo(0, -r); g.lineTo(r * 1.02, r * 0.78); g.lineTo(-r * 1.02, r * 0.78); g.closePath(); }
    else g.rect(-r * 0.82, -r * 0.82, r * 1.64, r * 1.64);
  }
  const bubbleSprite = (col) => A.sprite('bubbles-b' + col, [-112, -112, 224, 230], (g, s) => paintBubble(g, 100, col, s));

  function backdrop(g, s, W, H) {
    const im = pic('bobo/bg-day');
    if (im) { const sc = Math.max(W / im.width, H / im.height); g.drawImage(im, W / 2 - im.width * sc / 2, H - im.height * sc, im.width * sc, im.height * sc); }
    else {
      const sk = g.createLinearGradient(0, 0, 0, H * 0.6); sk.addColorStop(0, '#6FB6E6'); sk.addColorStop(1, '#CDEBF2'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
      g.beginPath(); A.blob(g, W * 0.25, H * 0.56, W * 0.5, H * 0.1, 0.04, 3, 10); A.paper(g, s, '#8CC56A', { shadow: 0.4 });
      g.beginPath(); A.blob(g, W * 0.8, H * 0.57, W * 0.45, H * 0.09, 0.04, 5, 10); A.paper(g, s, '#7DBB63', { shadow: 0.4 });
      g.beginPath(); g.rect(-20, H * 0.55, W + 40, H); A.paper(g, s, '#A3D35C', { shadow: 0.5 });
    }
    // the pond along the bottom
    const py = H - 96;
    g.beginPath(); A.blob(g, W / 2, H + 70, W * 0.66, 215, 0.035, 8, 14); A.paper(g, s, '#7DB96A', { shadow: 0.7 });
    g.beginPath(); A.blob(g, W / 2, H + 80, W * 0.63, 205, 0.03, 9, 14); A.paper(g, s, '#7CC3DC', { shadow: 0.5, light: 0.05, box: { x: 0, y: H - 140, w: W, h: 200 } });
    g.beginPath(); A.blob(g, W * 0.56, H + 96, W * 0.5, 170, 0.03, 12, 12); g.fillStyle = 'rgba(255,255,255,.2)'; g.fill();
    A.line(g, 'rgba(255,255,255,.6)', 4, (h) => { for (const [x, y, w] of [[0.38, 30, 70], [0.62, 62, 90], [0.5, 8, 46], [0.2, 70, 50], [0.78, 22, 60]]) { h.moveTo(W * x - w / 2, py + y); h.quadraticCurveTo(W * x, py + y - 7, W * x + w / 2, py + y); } });
    const lp = pic('tales/lilypad');
    const pad = (x, y, w, flip) => {
      g.save(); g.translate(x, y); if (flip) g.scale(-1, 1);
      if (lp) g.drawImage(lp, -w / 2, -w * lp.height / lp.width * 0.72, w, w * lp.height / lp.width);
      else { g.beginPath(); g.ellipse(0, 0, w / 2, w * 0.13, 0, 0.25, 6.1); g.lineTo(0, 0); g.closePath(); A.paper(g, s, '#5DA052', { shadow: 0.6 }); g.beginPath(); g.arc(w * 0.1, -w * 0.07, w * 0.09, 0, 7); g.fillStyle = '#F4A6B8'; g.fill(); }
      g.restore();
    };
    pad(W - Math.min(190, W * 0.3), H - 38, Math.min(250, W * 0.42), true);
    g.beginPath(); g.ellipse(frogX(W), H - 30, 100, 24, 0, 0, 7); A.paper(g, s, '#5DA052', { shadow: 0.6 });
    g.beginPath(); g.ellipse(frogX(W) - 12, H - 33, 76, 15, 0, 0, 7); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill();
  }
  const frogX = (W) => (W >= 1000 ? 170 : 108);

  /* ---------------- the game ---------------- */
  function start(st, ctx) {
    const W = st.W, H = st.H, L = ctx.level, RES = st.res;
    const bg = st.add({ z: 0 });
    bg.draw = (g) => {
      const key = 'bubbles-bg' + (pic('bobo/bg-day') ? 'P' : '') + (pic('tales/lilypad') ? 'L' : '') + Math.round(W) + 'x' + Math.round(H);
      const sp = A.sprite(key, [0, 0, W, H], (g2, s2) => backdrop(g2, s2, W, H));
      g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
    };

    /* ---------- the frog who blows the bubbles ---------- */
    const frog = st.add({ z: 8, x: frogX(W), y: H - 36, hop: 0, puff: 0 });
    frog.update = (dt) => { frog.hop = Math.max(0, frog.hop - dt * 2.2); frog.puff = Math.max(0, frog.puff - dt * 3); };
    frog.draw = (g) => {
      const im = pic('bobo/frog'), k = Math.sin((1 - frog.hop) * Math.PI) * (frog.hop > 0 ? 1 : 0), breathe = Math.sin(st.t * 2) * 0.012;
      g.translate(0, -k * 64); g.scale(1 + breathe + frog.puff * 0.06 - k * 0.05, 1 - breathe - frog.puff * 0.05 + k * 0.07);
      const h = 178;
      if (im) g.drawImage(im, -h * im.width / im.height / 2, -h, h * im.width / im.height, h);
      else {
        g.beginPath(); g.ellipse(0, -62, 56, 62, 0, 0, 7); g.fillStyle = '#7DB54A'; g.fill();
        g.beginPath(); g.ellipse(0, -44, 34, 40, 0, 0, 7); g.fillStyle = '#F3E08A'; g.fill();
        for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 30, -128, 24, 0, 7); g.fillStyle = '#7DB54A'; g.fill(); g.beginPath(); g.arc(sx * 30, -130, 14, 0, 7); g.fillStyle = '#FBF8F1'; g.fill(); g.beginPath(); g.arc(sx * 30, -130, 8, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
        A.line(g, A.C.ink, 4, (p) => { p.arc(0, -104, 22, 0.3, Math.PI - 0.3); });
      }
    };

    /* ---------- state ---------- */
    const bubbles = [];
    let round = null, busy = true, rounds = 0, skill = 0, lastKey = '', lastType = '', spawnT = 0, serial = 0;
    const maxB = K.clamp(Math.round((W * H) / (L === 1 ? 140000 : 112000)), 5, 11);
    const speed = () => (L === 1 ? 50 : L === 2 ? 56 : 60) + skill * 2.5;
    const baseR = () => (W < 800 ? rnd(66, 76) : rnd(72, 88));
    const anyCol = () => K.pick(COLS);

    /* ---------- rounds ---------- */
    function build(type) {
      const need = (n) => K.clamp(n + (skill >= 3 ? 1 : 0), 3, 5);
      const numBubble = (n) => ({ col: anyCol(), num: n });
      if (type === 'free') return { key: 'free', text: T.free, need: 5, ok: () => true, gen: () => ({ col: anyCol() }), name: (b) => T.colorName(b.col) };
      if (type === 'color') {
        const pool = K.shuffle(COLS).slice(0, K.clamp(2 + Math.floor(skill / 2) + (L > 1 ? 1 : 0), 2, 4)), t = pool[0], others = pool.slice(1);
        return { key: 'color' + t.name, text: T.color(t), need: need(3), ok: (b) => b.col === t, gen: (right) => ({ col: right ? t : K.pick(others) }), name: (b) => T.colorName(b.col), hint: (b) => `${T.colorName(b.col)} ${T.color(t)}` };
      }
      if (type === 'shape') {
        const pool = K.shuffle(SHAPES).slice(0, K.clamp(2 + Math.floor((skill + 1) / 2), 2, 4)), t = pool[0], others = pool.slice(1);
        return { key: 'shape' + t.name, text: T.shape(t), need: need(3), ok: (b) => b.shape === t, gen: (right) => ({ col: anyCol(), shape: right ? t : K.pick(others) }), name: (b) => T.shapeName(b.shape), hint: (b) => `${T.shapeName(b.shape)} ${T.shape(t)}` };
      }
      if (type === 'number') {
        const hi = skill < 2 ? 5 : 10, t = rint(1, hi), others = K.shuffle(Array.from({ length: hi }, (_, i) => i + 1).filter((n) => n !== t)).slice(0, K.clamp(2 + Math.floor(skill / 2), 2, 4));
        return { key: 'number' + t, text: T.number(t), need: need(3), ok: (b) => b.num === t, gen: (right) => numBubble(right ? t : K.pick(others)), name: (b) => T.numName(b.num), hint: (b) => `${T.numName(b.num)} ${T.number(t)}` };
      }
      if (type === 'even' || type === 'odd') {
        const want = type === 'even' ? 0 : 1, hi = skill < 2 ? 10 : 20, pickN = (par) => { let n; do n = rint(1, hi); while (n % 2 !== par); return n; };
        return { key: type, text: T[type], need: need(4), ok: (b) => b.num % 2 === want, gen: (right) => numBubble(pickN(right ? want : 1 - want)), name: (b) => T.numName(b.num), hint: (b) => `${T.numName(b.num)} ${want ? T.isEven : T.isOdd}` };
      }
      if (type === 'big' || type === 'small') {
        const ok = (n) => (type === 'big' ? n > 10 : n < 10), pickN = (right) => { let n; do n = rint(1, 20); while (n === 10 || ok(n) !== right); return n; };
        return { key: type, text: T[type], need: need(4), ok: (b) => ok(b.num), gen: (right) => numBubble(pickN(right)), name: (b) => T.numName(b.num), hint: (b) => `${T.numName(b.num)} ${type === 'big' ? T.notBig : T.notSmall}` };
      }
      if (type === 'sum') {
        const [a, b0] = K.pick(SUMS.filter((q) => (skill < 2 ? q[0] + q[1] <= 12 : true))), ans = a + b0;
        const near = [ans - 3, ans - 2, ans - 1, ans + 1, ans + 2, ans + 3, a, b0, ans + 10 > 20 ? ans - 10 : ans + 10].filter((n) => n >= 1 && n <= 20 && n !== ans);
        return { key: 'sum' + a + '+' + b0, text: T.sum(a, b0), need: 3, ok: (b) => b.num === ans, gen: (right) => numBubble(right ? ans : K.pick(near)), name: (b) => T.numName(b.num), hint: () => T.sumIs(a, b0) };
      }
      // skip counting: pop the numbers in order
      const sk = SKIPS[type], seq = skill >= 3 ? sk.long : sk.seq, r = { key: type, text: `${T.skip(type)} ${T.startAt(seq[0])}`, need: seq.length, seq, got: 0 };
      r.ok = (b) => b.num === seq[r.got];
      r.gen = (right) => { if (right) return numBubble(seq[r.got]); let n; do n = Math.random() < 0.6 ? K.pick(seq) : rint(1, seq[seq.length - 1]); while (n === seq[r.got]); return numBubble(n); };
      r.name = (b) => T.numName(b.num); r.hint = () => T.next;
      return r;
    }
    function pickType() {
      if (L === 1) return rounds % 4 === 0 ? 'free' : 'color';
      const pool = L === 2 ? ['number', 'shape', 'color', 'number', 'shape'] : rounds === 0 ? ['even'] : ['even', 'odd', 'big', 'small', 'sum', 'sum', 'skip2', 'skip5'];
      let t; do t = K.pick(pool); while (pool.length > 1 && t === lastType);
      return t;
    }
    function startRound(type) {
      type = type || pickType();
      let r, tries = 0; do r = build(type); while (r.key === lastKey && ++tries < 12);
      r.type = type; r.got = 0; r.misses = 0;
      round = r; lastKey = r.key; lastType = type; busy = false;
      for (const b of bubbles.slice()) away(b);
      ctx.prompt(r.text);
      // a first handful already in the air, so there is something to pop straight away
      const n0 = Math.ceil(maxB * 0.7), slots = K.shuffle(Array.from({ length: n0 }, (_, i) => i));
      for (let i = 0; i < n0; i++) {
        const rr = baseR(), x = K.clamp(((slots[i] + 0.5) / n0) * W + rnd(-20, 20), rr + 14, W - rr - 14);
        spawn(i < 2 || Math.random() < 0.4, x, rnd(Math.max(330, H * 0.3), H - 250), rr, i * 0.07);
      }
      spawnT = 1.2;
    }

    /* ---------- bubbles ---------- */
    function spawn(right, x, y, r, delay) {
      r = r || baseR();
      if (x == null) {       // rise from the pond, away from the ones just launched
        let best = -1;
        for (let i = 0; i < 7; i++) { const cx = rnd(r + 14, W - r - 14); let d = 1e9; for (const o of bubbles) if (o.y > H - 420) d = Math.min(d, Math.abs(o.x - cx)); if (d > best) { best = d; x = cx; } }
        y = H + r + 6;
      }
      const c = round.gen(right);
      const b = st.add(Object.assign({ z: 30, x, y, r, k: 0, age: 0, ph: rnd(0, 6.28), vy: speed() * rnd(0.85, 1.15), kx: 0, ky: 0, wob: 0, fade: 1, hitR: r, pad: 4, pressable: false,
        label: 'bubble ' + (c.num != null ? c.num : c.shape ? c.shape.name : c.col.name) + ' ' + (++serial) }, c));
      b.to({ k: 1 }, { dur: 0.45, ease: 'back', delay: delay || 0 });
      b.update = (dt) => {
        b.age += dt; b.wob = Math.max(0, b.wob - dt * 1.7);
        b.y -= b.vy * dt; b.x += Math.sin(b.age * 1.3 + b.ph) * 16 * dt + b.kx * dt; b.y += b.ky * dt;
        b.kx *= 1 - Math.min(1, dt * 3); b.ky *= 1 - Math.min(1, dt * 3);
        if (b.x < b.r + 8) { b.x = b.r + 8; b.kx = Math.abs(b.kx); } if (b.x > W - b.r - 8) { b.x = W - b.r - 8; b.kx = -Math.abs(b.kx); }
        if (b.going) { b.fade -= dt * 2.6; if (b.fade <= 0) kill(b); return; }
        // near the top the bubble thins out and is gone before it reaches the buttons
        b.fade = K.clamp((b.y - b.r - 128) / 90, 0, 1);
        if (b.fade <= 0) kill(b);
      };
      b.draw = (g) => {
        const glow = round && !busy && round.misses >= 2 && !b.going && round.ok(b);
        const w = b.wob, sq = Math.sin(b.age * 2.1 + b.ph) * 0.025, pulse = glow ? 1.04 + Math.sin(st.t * 7) * 0.07 : 1;
        g.globalAlpha *= Math.min(1, b.fade * 1.4);
        g.rotate(Math.sin(b.wob * 26) * 0.2 * w);
        const q = (b.r / 100) * b.k * pulse; g.scale(q * (1 + sq + Math.sin(w * 20) * 0.12 * w), q * (1 - sq - Math.sin(w * 20) * 0.12 * w));
        if (glow) { const a = 0.75 + Math.sin(st.t * 7) * 0.25, gr = g.createRadialGradient(0, 0, 84, 0, 0, 168); gr.addColorStop(0, `rgba(255,250,200,${a})`); gr.addColorStop(0.45, `rgba(255,236,130,${a * 0.6})`); gr.addColorStop(1, 'rgba(255,236,130,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 168, 0, 7); g.fill(); }
        const sp = bubbleSprite(b.col.c); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
        if (b.num != null) {
          const t = String(b.num); g.font = `700 ${t.length > 1 ? 88 : 108}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.lineJoin = 'round'; g.lineWidth = 13; g.strokeStyle = A.alpha(A.shade(b.col.c, -0.24), 0.9); g.strokeText(t, 0, 6); g.fillStyle = '#FFFDF6'; g.fillText(t, 0, 6);
        } else if (b.shape) {
          g.save(); g.translate(0, b.shape.name === 'triangle' ? 8 : 4);
          g.save(); g.shadowColor = A.alpha(A.shade(b.col.c, -0.3), 0.55); g.shadowBlur = 8 * RES; g.shadowOffsetY = 4 * RES; shapePath(g, b.shape.name, 50); g.fillStyle = '#FFFDF6'; g.fill(); g.restore();
          g.restore();
        }
      };
      b.onDown = (p) => touch(b, p);
      b.onTap = (p) => { if (!p) touch(b, null); };      // keyboard, screen reader and tests
      bubbles.push(b);
      return b;
    }
    function kill(b) { const i = bubbles.indexOf(b); if (i >= 0) bubbles.splice(i, 1); b.remove(); }
    function away(b) { b.going = true; b.onDown = b.onTap = null; b.hitR = 0; }
    function ring(x, y, r, col) {
      const n = st.add({ z: 40, x, y, t: 0 });
      n.update = (dt) => { n.t += dt * 3.4; if (n.t >= 1) n.remove(); };
      n.draw = (g) => { const e = 1 - (1 - n.t) * (1 - n.t); g.beginPath(); g.arc(0, 0, r * (0.9 + e * 0.6), 0, 7); g.strokeStyle = A.alpha('#FFFFFF', 0.85 * (1 - n.t)); g.lineWidth = 7 * (1 - n.t) + 1; g.stroke(); for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3; g.beginPath(); g.arc(Math.cos(a) * r * (1 + e * 0.75), Math.sin(a) * r * (1 + e * 0.75), 7 * (1 - n.t), 0, 7); g.fillStyle = A.alpha(A.mix(col, '#ffffff', 0.35), 1 - n.t); g.fill(); } };
    }

    function touch(b, p) {
      if (!round || busy || b.going || b.fade < 0.25 || b.k < 0.5) return;
      if (round.ok(b)) {
        const say = round.name(b);
        K.sfx.pop(); K.sfx.note([523.25, 587.33, 659.25, 783.99, 880, 1046.5][Math.min(5, round.got)], 0.35);
        ring(b.x, b.y, b.r, b.col.c); ctx.fx.burst(b.x, b.y, { n: 9, color: A.mix(b.col.c, '#ffffff', 0.25) });
        frog.hop = 1; kill(b);
        round.got++; spawnT = Math.min(spawnT, 0.45);
        K.say(say);
        if (round.got >= round.need) finish();
      } else {
        K.sfx.whoops(); b.wob = 1;
        let dx = p ? b.x - p.x : rnd(-1, 1), dy = p ? b.y - p.y : -0.4; const d = Math.hypot(dx, dy) || 1; if (d < 12) { dx = Math.random() < 0.5 ? -1 : 1; dy = -0.3; }
        const dd = Math.hypot(dx, dy) || 1; b.kx = (dx / dd) * 330; b.ky = (dy / dd) * 240 - 60;
        round.misses++; skill = Math.max(0, skill - 0.5);
        K.say(round.hint(b));
        // make sure a right one is there to find
        if (!bubbles.some((o) => !o.going && round.ok(o) && o.fade > 0.6)) spawnT = 0;
      }
    }
    function finish() {
      busy = true; rounds++;
      if (round.misses === 0) skill = Math.min(6, skill + 1); else if (round.misses >= 3) skill = Math.max(0, skill - 1);
      bubbles.slice().forEach((b, i) => ctx.after(120 + i * 70, () => { if (!b.going) { away(b); b.ky = -90; } }));
      ctx.after(260, () => K.sfx.sparkle());
      ctx.wait(900).then(() => { if (rounds % 4 === 0) return ctx.celebrate(); K.praise(); return ctx.wait(1300); }).then(() => startRound());
    }

    /* ---------- the stream of bubbles, and keeping them apart ---------- */
    st.onframe = (dt) => {
      if (round && !busy) {
        spawnT -= dt;
        const live = bubbles.filter((b) => !b.going);
        if (spawnT <= 0 && live.length < maxB) {
          const rights = live.filter((b) => round.ok(b) && b.fade > 0.6).length;
          spawn(rights < 2 || Math.random() < 0.38);
          frog.puff = 1;
          spawnT = Math.max(0.8, ((H - 150) / speed() / maxB) * rnd(0.8, 1.2) * (live.length < maxB * 0.6 ? 0.5 : 1));
        }
      }
      for (let i = 0; i < bubbles.length; i++) for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i], b = bubbles[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r + 10, d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 0.01) continue;
        const d = Math.sqrt(d2), push = (min - d) * Math.min(1, dt * 5) * 0.5;
        a.x -= (dx / d) * push; a.y -= (dy / d) * push * 0.5; b.x += (dx / d) * push; b.y += (dy / d) * push * 0.5;
      }
    };

    /* ---------- how many pops to go ---------- */
    const pips = st.add({ ui: true, z: 98, x: W / 2, y: 140 });
    pips.draw = (g) => {
      if (!round) return;
      const n = round.need, seq = round.seq, gap = seq ? 46 : 40, x0 = -((n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) {
        const on = i < round.got;
        if (seq) {      // skip counting: the numbers popped so far stay written up
          g.beginPath(); g.arc(x0 + i * gap, 0, 19, 0, 7); g.fillStyle = on ? '#FFF6C8' : 'rgba(255,255,255,.4)'; g.fill(); g.strokeStyle = on ? '#F2B33D' : 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.stroke();
          if (on) { g.font = `700 ${seq[i] > 9 ? 20 : 24}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = A.C.ink; g.fillText(String(seq[i]), x0 + i * gap, 1.5); }
          continue;
        }
        g.beginPath(); g.arc(x0 + i * gap, 0, on ? 14 : 11, 0, 7); g.fillStyle = on ? '#FFF6C8' : 'rgba(255,255,255,.4)'; g.fill(); g.strokeStyle = on ? '#F2B33D' : 'rgba(255,255,255,.9)'; g.lineWidth = on ? 4 : 3; g.stroke();
        if (on) { g.beginPath(); g.arc(x0 + i * gap - 4, -5, 3.5, 0, 7); g.fillStyle = '#fff'; g.fill(); }
      }
    };

    K._bubbles = {
      bubbles, get round() { return round; }, get busy() { return busy; }, get skill() { return skill; }, set skill(v) { skill = v; }, get rounds() { return rounds; }, maxB,
      isRight: (b) => !!(round && round.ok(b)), touch: (b) => touch(b, null), spawn: (right) => spawn(right), go: (type) => startRound(type),
    };
    ctx.onExit(() => { st.onframe = null; K._bubbles = null; });
    ctx.wait(350).then(() => startRound());
  }

  function icon(g, w) {
    const u = w / 300, sk = g.createLinearGradient(0, 0, 0, w); sk.addColorStop(0, '#6DB7E8'); sk.addColorStop(0.7, '#CFECF3'); g.fillStyle = sk; g.fillRect(0, 0, w, w);
    g.fillStyle = '#8CC56A'; g.beginPath(); g.ellipse(w * 0.3, w * 0.98, w * 0.6, w * 0.24, 0, 0, 7); g.fill();
    g.fillStyle = '#A3D35C'; g.beginPath(); g.ellipse(w * 0.8, w * 1.02, w * 0.6, w * 0.22, 0, 0, 7); g.fill();
    g.fillStyle = '#7CC3DC'; g.beginPath(); g.ellipse(w * 0.5, w * 1.02, w * 0.42, w * 0.12, 0, 0, 7); g.fill();
    for (const [x, y, r, c] of [[92, 178, 62, 0], [206, 122, 70, 3], [120, 66, 40, 1], [232, 232, 36, 2], [52, 264, 26, 4]]) { g.save(); g.translate(x * u, y * u); paintBubble(g, r * u, COLS[c].c, 1); g.restore(); }
    g.save(); g.translate(206 * u, 126 * u); shapePath(g, 'star', 32 * u); g.fillStyle = '#FFFDF6'; g.fill(); g.restore();
  }

  K.game({ id: 'bubbles', title: 'Bubble Pop', voice: 'bubbles', group: 'arcade', age: 3, order: 10, icon, start, lines, resize: () => K.go('bubbles') });
})();
