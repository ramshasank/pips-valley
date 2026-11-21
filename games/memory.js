/* Memory Match — paper cards lie face down on the table; turn two and find the pairs.
   Level 1: three pairs of the very same picture. The cards are shown first, each card says its name,
            and a pair that does not match stays up a little longer before it turns back.
   Level 2: six pairs. Same pictures, then a number with that many dots, then a colour with a thing of that colour.
   Level 3: eight to ten pairs of ideas that go together: a sum and its answer, a clock and its time in words,
            a word and its picture, a big letter and its little letter.
   There is no move limit and nothing to lose: cards that do not match simply turn back. After a few misses in a
   row the partner of the card just turned gives a little wiggle. A finished table is cheered and dealt again,
   with a card or two more when it went well and fewer when it was hard. */
(function () {
  'use strict';
  const A = K.art;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const N = (n) => cap(K.numWord(n)) + '.';
  const CREAM = '#FBF6EC', BACK = '#E8664A', TABLE = '#5FA7A6';

  /* ---------------- pictures (img/) ---------------- */
  const PIC = {};
  const thing = (name, dir, col) => { const p = (PIC[name] = { im: new Image(), ok: false }); p.im.onload = () => { p.ok = true; }; p.im.src = 'img/' + dir + '/' + name + '.webp'; return { name, col }; };
  const FACES = [['cat', '#A99C92'], ['chick', '#F6D25A'], ['dog', '#C99666'], ['hedgehog', '#B08A6A'], ['lion', '#F0B45A'], ['mouse', '#B9B4BC'], ['owl', '#A07850'], ['panda', '#F4F0EA'], ['pig', '#F3B0B8']].map(([n, c]) => thing(n, 'faces', c));
  const FOODS = [['apple', '#D94B3F'], ['banana', '#F3CE4B'], ['pear', '#B5C957'], ['orange', '#F0923B'], ['lemon', '#F2D84B'], ['strawberry', '#E0464C'], ['grapes', '#7B5AA6'], ['watermelon', '#E4525A'], ['carrot', '#EE8A3A'], ['cheese', '#F2C24B'], ['cookie', '#C99255']].map(([n, c]) => thing(n, 'kitchen', c));
  const EXTRA = [['bus', '#F2B33D'], ['cow', '#F4F0EA'], ['egg', '#F6EBD8']].map(([n, c]) => thing(n, 'words', c));
  const THINGS = FACES.concat(FOODS, EXTRA);
  const byName = (n) => THINGS.find((t) => t.name === n);
  const WORDS = THINGS.filter((t) => t.name.length <= 6);
  const COLOURS = [['red', '#DE4E46', 'apple'], ['yellow', '#F2CF4A', 'banana'], ['orange', '#F0923B', 'carrot'], ['green', '#6FA65F', 'pear'], ['purple', '#7B5AA6', 'grapes'], ['brown', '#B07A4E', 'cookie']].map(([name, hex, t]) => ({ name, hex, thing: t }));
  const LETTERS = 'ABDEFGHMNQRT'.split('');
  const NUM_MAX = 20;

  const SAY = {
    look: 'Look at the cards!', same: 'Find two the same!', together: 'Find the pairs that go together!',
    numdots: 'Match the number to the dots!', colour: 'Match the colour to the thing!', sum: 'Match the sum to its answer!',
    clock: 'Match the clock to the time!', word: 'Match the word to its picture!', letter: 'Match the big letter to the little letter!',
    back: 'Not a pair. They turn back.', remember: 'Remember where they are!', wiggle: 'Look! One card is wiggling.',
    sameTime: 'The same time!', bigLittle: 'Big and little!', again: 'Here are some new cards!', more: 'More cards this time!',
  };
  function lines() {
    const out = Object.values(SAY);
    for (const t of THINGS) out.push(cap(t.name) + '.');
    for (let n = 1; n <= NUM_MAX; n++) out.push(N(n));
    for (const c of COLOURS) out.push(cap(c.name) + '.');
    return out;
  }

  /* ---------------- card faces ---------------- */
  const picF = (t) => ({ t: 'pic', key: 'pic:' + t.name, thing: t, say: cap(t.name) + '.' });
  const wordF = (t) => ({ t: 'word', key: 'word:' + t.name, text: t.name });
  const numF = (n, speak) => ({ t: 'num', key: 'num:' + n, n, say: speak ? N(n) : null });
  const dotsF = (n) => ({ t: 'dots', key: 'dots:' + n, n });
  const swF = (c) => ({ t: 'sw', key: 'sw:' + c.name, c, say: cap(c.name) + '.' });
  const sumF = (text) => ({ t: 'sum', key: 'sum:' + text, text });
  const clockF = (h, m) => ({ t: 'clock', key: 'clock:' + h + ':' + m, h, m });
  const timeF = (lines2) => ({ t: 'time', key: 'time:' + lines2.join(' '), lines: lines2 });
  const letF = (ch, big) => ({ t: 'let', key: 'let:' + ch, ch, big });
  const timeWords = (h, m) => (m === 0 ? [K.numWord(h), "o'clock"] : m === 30 ? ['half past', K.numWord(h)] : m === 15 ? ['quarter past', K.numWord(h)] : ['quarter to', K.numWord((h % 12) + 1)]);

  const star = (g, x, y, r, inner) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.2832 - 1.5708, rr = i % 2 ? r * (inner || 0.5) : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  const base = (g, s, w, h, col, seed) => { g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.13, seed, 0.8); A.paper(g, s, col, { shadow: 1, light: 0.05, box: { x: -w / 2, y: -h / 2, w, h } }); };
  const type = (g, text, y, px, maxW, font, col) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = px; g.font = `700 ${size}px ${font}`;
    const tw = g.measureText(text).width; if (tw > maxW) { size = Math.max(10, size * maxW / tw); g.font = `700 ${size}px ${font}`; }
    g.fillStyle = col; g.fillText(text, 0, y); return size;
  };
  /** A picture fitted into a box around (x, y); a paper shape stands in until the picture has arrived. */
  function drawThing(g, s, t, x, y, bw, bh) {
    const p = PIC[t.name];
    if (p && p.ok) {
      const k = Math.min(bw / p.im.width, bh / p.im.height), w = p.im.width * k, h = p.im.height * k;
      g.save(); g.shadowColor = 'rgba(46,40,70,.2)'; g.shadowBlur = 6 * s; g.shadowOffsetY = 3 * s; g.drawImage(p.im, x - w / 2, y - h / 2, w, h); g.restore();
      return;
    }
    const F = A.kitchen && A.kitchen.draw && A.kitchen.draw[t.name], k = Math.min(bw, bh) / 124;
    g.save(); g.translate(x, y); g.scale(k, k);
    if (F) F(g, s * k);
    else {
      g.beginPath(); A.blob(g, 0, 0, 50, 46, 0.03, 9, 10); A.paper(g, s * k, t.col, { shadow: 0.7, light: 0.06, box: { x: -50, y: -46, w: 100, h: 92 } });
      for (const sx of [-17, 17]) { g.beginPath(); g.ellipse(sx, -6, 6, 7.5, 0, 0, 7); g.fillStyle = A.C.ink; g.fill(); g.beginPath(); g.arc(sx + 2, -9, 2, 0, 7); g.fillStyle = '#fff'; g.fill(); }
      A.line(g, A.C.ink, 3, (h2) => { h2.moveTo(-9, 16); h2.quadraticCurveTo(0, 24, 9, 16); });
    }
    g.restore();
  }
  const DOTS = { 1: [[0, 0]], 2: [[-0.5, -0.5], [0.5, 0.5]], 3: [[-0.6, -0.6], [0, 0], [0.6, 0.6]], 4: [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]], 5: [[-0.6, -0.6], [0.6, -0.6], [0, 0], [-0.6, 0.6], [0.6, 0.6]], 6: [[-0.5, -0.75], [0.5, -0.75], [-0.5, 0], [0.5, 0], [-0.5, 0.75], [0.5, 0.75]] };
  const dotAt = (n) => { if (DOTS[n]) return DOTS[n]; const out = []; for (let i = 0; i < n; i++) out.push([-0.8 + (i % 5) * 0.4, i < 5 ? -0.3 : 0.3]); return out; };
  const EDGE = { pic: '#2F8F8A', word: '#F2B33D', num: '#6E4E7E', dots: '#2F8F8A', sw: '#C9B79A', sum: '#E8664A', clock: '#2F8F8A', time: '#5B8FC7', let: '#F2B33D' };

  function paintFace(g, s, f, w, h) {
    const m = Math.min(w, h);
    base(g, s, w, h, CREAM, 3);
    A.line(g, A.alpha(EDGE[f.t], 0.5), Math.max(2.5, m * 0.022), (p) => A.rect(p, -w / 2 + m * 0.065, -h / 2 + m * 0.065, w - m * 0.13, h - m * 0.13, m * 0.08, 4, 0.5));
    if (f.t === 'pic') drawThing(g, s, f.thing, 0, 0, w * 0.76, h * 0.66);
    else if (f.t === 'word') {
      const size = type(g, f.text, -m * 0.02, m * 0.3, w * 0.76, A.FONT_BODY, A.C.ink);
      A.line(g, '#F2B33D', Math.max(3, m * 0.03), (p) => { p.moveTo(-w * 0.26, size * 0.72); p.quadraticCurveTo(0, size * 0.72 + m * 0.05, w * 0.26, size * 0.72); });
    } else if (f.t === 'num') type(g, String(f.n), m * 0.02, h * 0.5, w * 0.7, A.FONT_TITLE, '#6E4E7E');
    else if (f.t === 'dots') {
      const big = f.n <= 6, r = w * (big ? 0.105 : 0.07), k = w * (big ? 0.3 : 0.37);
      dotAt(f.n).forEach(([x, y], i) => { g.beginPath(); g.arc(x * k, y * k, r, 0, 7); A.paper(g, s, i < 5 || big ? '#2F8F8A' : '#E8664A', { shadow: 0.5, light: 0.08, grain: 0.15, box: { x: x * k - r, y: y * k - r, w: r * 2, h: r * 2 } }); g.beginPath(); g.arc(x * k - r * 0.3, y * k - r * 0.3, r * 0.22, 0, 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); });
    } else if (f.t === 'sw') {
      const cy = -h * 0.09, rx = w * 0.31;
      g.beginPath(); A.blob(g, 0, cy, rx, rx * 0.86, 0.1, f.c.name.length * 7 + 3, 11); A.paper(g, s, f.c.hex, { shadow: 0.7, light: 0.08, box: { x: -rx, y: cy - rx, w: rx * 2, h: rx * 2 } });
      for (const [dx, dy, q] of [[0.95, 0.62, 0.13], [-1.0, -0.5, 0.09], [0.7, -0.85, 0.07]]) { g.beginPath(); g.arc(dx * rx, cy + dy * rx, q * rx, 0, 7); g.fillStyle = f.c.hex; g.fill(); }
      g.beginPath(); g.ellipse(-rx * 0.36, cy - rx * 0.36, rx * 0.2, rx * 0.11, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill();
      type(g, f.c.name, h * 0.33, m * 0.19, w * 0.74, A.FONT_BODY, A.C.ink);
    } else if (f.t === 'sum') type(g, f.text, m * 0.01, m * 0.36, w * 0.78, A.FONT_TITLE, A.C.ink);
    else if (f.t === 'clock') {
      const R = Math.min(w * 0.4, h * 0.36);
      g.beginPath(); g.arc(0, 0, R, 0, 7); A.paper(g, s, '#2F8F8A', { shadow: 0.7, light: 0.08, box: { x: -R, y: -R, w: R * 2, h: R * 2 } });
      g.beginPath(); g.arc(0, 0, R * 0.86, 0, 7); A.paper(g, s, '#FFFDF6', { shadow: 0, light: 0.03, grain: 0.12, box: { x: -R, y: -R, w: R * 2, h: R * 2 } });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832, q = i % 3 ? R * 0.035 : 0; if (!q) continue; g.beginPath(); g.arc(Math.sin(a) * R * 0.7, -Math.cos(a) * R * 0.7, q, 0, 7); g.fillStyle = A.alpha(A.C.ink, 0.45); g.fill(); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${R * 0.27}px ${A.FONT_BODY}`; g.fillStyle = A.C.ink;
      for (const [n, a] of [[12, 0], [3, 1.5708], [6, 3.1416], [9, 4.7124]]) g.fillText(String(n), Math.sin(a) * R * 0.66, -Math.cos(a) * R * 0.66 + R * 0.02);
      const ha = ((f.h % 12) + f.m / 60) / 12 * 6.2832, ma = (f.m / 60) * 6.2832;
      A.line(g, A.C.ink, R * 0.12, (p) => { p.moveTo(0, 0); p.lineTo(Math.sin(ha) * R * 0.44, -Math.cos(ha) * R * 0.44); });
      A.line(g, '#E8664A', R * 0.08, (p) => { p.moveTo(0, 0); p.lineTo(Math.sin(ma) * R * 0.7, -Math.cos(ma) * R * 0.7); });
      g.beginPath(); g.arc(0, 0, R * 0.09, 0, 7); g.fillStyle = A.C.ink; g.fill();
    } else if (f.t === 'time') {
      const px = m * 0.2; g.font = `700 ${px}px ${A.FONT_BODY}`;
      const widest = Math.max(...f.lines.map((t) => g.measureText(t).width)), size = widest > w * 0.8 ? px * w * 0.8 / widest : px;
      f.lines.forEach((t, i) => type(g, t, (i - (f.lines.length - 1) / 2) * size * 1.25, size, w, A.FONT_BODY, /past|to|clock/.test(t) ? '#2F6FA8' : A.C.ink));
    } else if (f.t === 'let') type(g, f.ch, m * 0.02, h * 0.52, w * 0.7, A.FONT_TITLE, f.big ? '#E8664A' : '#2F8F8A');
  }
  function paintBack(g, s, w, h) {
    const m = Math.min(w, h);
    base(g, s, w, h, BACK, 5);
    g.save(); g.beginPath(); A.rect(g, -w / 2 + m * 0.09, -h / 2 + m * 0.09, w - m * 0.18, h - m * 0.18, m * 0.07, 6, 0.5); g.clip();
    const gap = m * 0.17; g.fillStyle = 'rgba(255,238,214,.22)';
    for (let row = 0, y = -h / 2; y < h / 2 + gap; y += gap, row++) for (let x = -w / 2 + (row % 2) * gap / 2; x < w / 2 + gap; x += gap) { g.beginPath(); g.arc(x, y, m * 0.022, 0, 7); g.fill(); }
    g.restore();
    A.line(g, 'rgba(255,240,220,.75)', Math.max(2.5, m * 0.024), (p) => A.rect(p, -w / 2 + m * 0.075, -h / 2 + m * 0.075, w - m * 0.15, h - m * 0.15, m * 0.08, 6, 0.5));
    const r = m * 0.27;
    g.beginPath(); A.blob(g, 0, 0, r, r, 0.03, 8, 12); A.paper(g, s, CREAM, { shadow: 0.6, light: 0.04, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
    star(g, 0, r * 0.04, r * 0.66, 0.5); A.paper(g, s, '#F2B33D', { shadow: 0.4, light: 0.08, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
  }
  const sprite = (key, w, h, paint) => A.sprite('mem-' + key + '|' + Math.round(w) + 'x' + Math.round(h), [-w / 2 - 6, -h / 2 - 6, w + 12, h + 12], paint);
  const faceReady = (f) => !f.thing || (PIC[f.thing.name] && PIC[f.thing.name].ok);

  function table(W, H) {
    return A.sprite('mem-table' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, TABLE, { shadow: 0, light: 0.05, grain: 0.34, box: { x: 0, y: 0, w: W, h: H } });
      const gr = g.createRadialGradient(W / 2, H * 0.52, 60, W / 2, H * 0.52, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(255,250,225,.22)'); gr.addColorStop(0.6, 'rgba(255,250,225,0)'); gr.addColorStop(1, 'rgba(30,50,70,.24)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const r = A.rng(31);
      for (let i = 0; i < 16; i++) { const x = r() * W, y = r() * H, q = 12 + r() * 20; g.save(); g.translate(x, y); g.rotate(r() * 6); if (i % 2) star(g, 0, 0, q, 0.5); else { g.beginPath(); g.arc(0, 0, q * 0.6, 0, 7); } g.fillStyle = i % 3 ? 'rgba(255,255,255,.06)' : 'rgba(30,60,70,.07)'; g.fill(); g.restore(); }
      g.save(); g.setLineDash([16, 13]); A.line(g, 'rgba(255,248,230,.4)', 3.5, (p) => A.rect(p, 16, 16, W - 32, H - 32, 30, 3, 0)); g.restore();
    });
  }

  /* ---------------- the game ---------------- */
  let live = null;
  function start(st, ctx) {
    const L = ctx.level;
    const HELP = L === 1 ? 2 : L === 2 ? 3 : 4;            // misses in a row before the partner card wiggles
    const HOLD = L === 1 ? 1900 : L === 2 ? 1300 : 1050;   // how long a pair that does not match stays up
    let W = st.W, H = st.H, G = null, bg = null;
    let cards = [], open = [], pend = null, busy = true, gen = 0;
    let step = 0, round = 0, found = 0, pairsN = 0, misses = 0, streak = 0, told = {}, lastKeys = [], saidBack = false, saidWiggle = false, prevN = 0, deals = 0;
    const stat = { matches: 0, misses: 0, boards: 0 };

    const fresh = (pool, n, key) => { const s = K.shuffle(pool); s.sort((a, b) => (lastKeys.indexOf(key(a)) >= 0) - (lastKeys.indexOf(key(b)) >= 0)); return s.slice(0, n); };
    const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
    const same = (pool) => (n) => fresh(pool, n, (t) => t.name).map((t) => ({ key: t.name, kind: 'same', a: picF(t), b: picF(t) }));
    const MAKE = {
      sameFace: same(FACES), sameFood: same(FOODS.slice(0, 8)), sameAll: same(FACES.concat(FOODS)),
      numdots: (n) => fresh(range(1, n > 6 || step > 0 ? 10 : 6), n, (v) => 'n' + v).map((v) => ({ key: 'n' + v, kind: 'numdots', a: numF(v, true), b: dotsF(v), say: N(v) })),
      colour: (n) => fresh(COLOURS, n, (c) => c.name).map((c) => ({ key: c.name, kind: 'colour', a: swF(c), b: picF(byName(c.thing)), say: cap(c.name) + '.' })),
      word: (n) => fresh(WORDS, n, (t) => t.name).map((t) => ({ key: t.name, kind: 'word', a: wordF(t), b: picF(t), say: cap(t.name) + '.' })),
      letter: (n) => fresh(LETTERS, n, (c) => 'l' + c).map((c) => ({ key: 'l' + c, kind: 'letter', a: letF(c, true), b: letF(c.toLowerCase(), false), say: SAY.bigLittle })),
      sum: (n) => fresh(range(step ? 6 : 4, [12, 16, NUM_MAX][step]), n, (v) => 's' + v).map((v) => {
        let text;
        if (step && Math.random() < 0.4 && v <= 14) { const b = K.randInt(2, Math.min(8, NUM_MAX - v)); text = (v + b) + ' − ' + b; }
        else { const a = K.randInt(v > 4 ? 2 : 1, v - (v > 4 ? 2 : 1)); text = a + ' + ' + (v - a); }
        return { key: 's' + v, kind: 'sum', a: sumF(text), b: numF(v, false), say: N(v) };
      }),
      clock: (n) => { const pool = []; for (let h = 1; h <= 12; h++) for (const m of step ? [0, 30, 15, 45] : [0, 30]) pool.push([h, m]); return fresh(pool, n, (v) => 'c' + v[0] + ':' + v[1]).map(([h, m]) => ({ key: 'c' + h + ':' + m, kind: 'clock', a: clockF(h, m), b: timeF(timeWords(h, m)), say: SAY.sameTime })); },
    };
    function plan() {
      const n = (L === 1 ? 3 : L === 2 ? 6 : 8) + (L === 1 ? Math.min(1, step) : step);
      let parts, prompt = SAY.together;
      if (L === 1) { parts = [[step >= 2 ? 'sameAll' : round % 2 ? 'sameFood' : 'sameFace', n]]; prompt = SAY.same; }
      else if (L === 2) {
        const r = round % 4, c = Math.min(6, n);
        if (r === 0) { parts = [['sameAll', n]]; prompt = SAY.same; }
        else if (r === 1) { parts = [['numdots', n]]; prompt = SAY.numdots; }
        else if (r === 2) { parts = [['colour', c], ['numdots', n - c]]; if (n === c) prompt = SAY.colour; }
        else parts = [['numdots', Math.ceil(n / 2)], ['colour', Math.floor(n / 2)]];
      } else { const c = [['word', 'letter'], ['sum', 'clock'], ['word', 'sum'], ['letter', 'clock'], ['word', 'clock'], ['letter', 'sum']][round % 6]; parts = [[c[0], Math.ceil(n / 2)], [c[1], Math.floor(n / 2)]]; }
      let pairs = []; for (const [kind, k] of parts) if (k > 0) pairs = pairs.concat(MAKE[kind](k));
      return { pairs, prompt };
    }

    /** The biggest cards that fit n of them between the top buttons and the bottom edge. */
    function grid(n) {
      const land = W >= 1000, top = land ? 146 : 152, mx = land ? 34 : 22, aw = W - mx * 2, ah = H - top - (land ? 36 : 56);
      let best = null;
      for (let c = 1; c <= n; c++) {
        const r = Math.ceil(n / c), gap = Math.max(10, Math.min(22, aw / c * 0.1));
        const cw = (aw - gap * (c - 1)) / c, ch = (ah - gap * (r - 1)) / r;
        const w = Math.min(cw, ch * 0.84, 290), h = Math.min(ch, w * (land ? 1.3 : 1.5));
        if (!best || w * h > best.w * best.h + 1) best = { c, r, w, h, gap };
      }
      const { c, r, w, h, gap } = best, pos = [], th = r * h + (r - 1) * gap, y0 = top + (ah - th) / 2 + h / 2;
      for (let i = 0; i < n; i++) { const row = Math.floor(i / c), inRow = row === r - 1 ? n - c * (r - 1) : c, col = i % c; pos.push({ x: W / 2 + (col - (inRow - 1) / 2) * (w + gap), y: y0 + row * (h + gap) }); }
      return { w, h, pos, gap };
    }

    const flick = () => { K.sfx.noise(0.07, { freq: 2200, vol: 0.1 }); K.sfx.tone(700, 0.05, { type: 'triangle', vol: 0.07 }); };
    function turn(c, up, delay) {
      c.up = up; c.z = 6; st.root._sorted = false;
      return c.to({ flip: up ? 1 : 0 }, { dur: 0.36, ease: 'inOut', delay: delay || 0 }).then(() => { if (c.flip === (up ? 1 : 0)) { c.z = c.done ? 2 : 3; st.root._sorted = false; } });
    }
    function makeCard(i, pair, f) {
      const c = st.add({ z: 3, x: W / 2, y: H + 260, rot: (Math.random() - 0.5) * 0.8, flip: 0, gold: 0, hint: 0, i, pair: pair.key, kind: pair.kind, f, say: pair.say, up: false, done: false, seen: false, label: 'card ' + (i + 1) });
      c.hit = { x: -G.w / 2, y: -G.h / 2, w: G.w, h: G.h }; c.pad = Math.max(2, G.gap / 2 - 1);
      c.draw = (g) => {
        const w = G.w, h = G.h, k = Math.cos(c.flip * Math.PI), lift = Math.sin(c.flip * Math.PI), faceUp = c.flip > 0.5;
        if (c.hint > 0 && !faceUp) { g.save(); g.shadowColor = '#FFF3C4'; g.shadowBlur = (26 + Math.sin(st.t * 7) * 10) * st.res; g.beginPath(); A.rect(g, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, Math.min(w, h) * 0.14, 5, 0); g.fillStyle = '#FFF3C4'; g.fill(); g.fill(); g.restore(); }
        g.save();
        g.translate(0, -lift * h * 0.07);
        g.transform(Math.max(0.03, Math.abs(k)) * (1 + lift * 0.07), Math.sin(c.flip * Math.PI * 2) * -0.1, 0, 1 + lift * 0.07, 0, 0);
        if (faceUp) { if (!c.spUp || (!c.spOk && faceReady(c.f))) { c.spOk = faceReady(c.f); c.spUp = sprite(c.f.key + (c.spOk ? '' : '?'), w, h, (g2, s) => paintFace(g2, s, c.f, w, h)); } const sp = c.spUp; g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); }
        else { const sp = c.spBack || (c.spBack = sprite('back', w, h, (g2, s) => paintBack(g2, s, w, h))); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); }
        if (lift > 0.02) { g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.13, faceUp ? 3 : 5, 0.8); g.fillStyle = faceUp ? `rgba(255,255,255,${lift * 0.25})` : `rgba(46,40,70,${lift * 0.2})`; g.fill(); }
        if (c.gold > 0.01 && faceUp) {
          const m = Math.min(w, h);
          g.globalAlpha *= c.gold;
          A.line(g, '#F2B33D', Math.max(4, m * 0.05), (p) => A.rect(p, -w / 2 + m * 0.025, -h / 2 + m * 0.025, w - m * 0.05, h - m * 0.05, m * 0.12, 3, 0));
          const q = m * 0.13 * (0.6 + 0.4 * c.gold); g.translate(w / 2 - m * 0.13, -h / 2 + m * 0.13); g.rotate(0.2);
          star(g, 0, 0, q * 1.25, 0.5); g.fillStyle = CREAM; g.fill(); star(g, 0, 0, q, 0.5); g.fillStyle = '#F2B33D'; g.fill();
        }
        g.restore();
      };
      c.update = () => { if (c.hint > 0 && !c.up) c.rot = Math.sin(st.t * 9) * 0.045; };
      c.onDown = () => tap(c);
      c.onTap = (p) => { if (!p) tap(c); };
      return c;
    }

    function deal(pre) {
      const g0 = ++gen; busy = true; open = []; pend = null; found = 0; misses = 0; streak = 0; told = {};
      for (const c of cards) c.remove();
      const p = plan(); pairsN = p.pairs.length; deals++;
      lastKeys = p.pairs.map((q) => q.key);
      let faces = []; for (const q of p.pairs) faces.push([q, q.a], [q, q.b]);
      faces = K.shuffle(faces);
      G = grid(faces.length);
      cards = faces.map(([q, f], i) => makeCard(i, q, f));
      cards.forEach((c, i) => {
        c.to({ x: G.pos[i].x, y: G.pos[i].y, rot: 0 }, { dur: 0.5, ease: 'back', delay: 0.15 + i * 0.05 });
        ctx.after(150 + i * 50, () => { if (g0 === gen) K.sfx.tone(520 + (i % 6) * 40, 0.04, { type: 'triangle', vol: 0.07 }); });
      });
      const dealt = 650 + cards.length * 50;
      const more = prevN && pairsN > prevN; prevN = pairsN;
      const intro = pre ? Promise.race([ctx.say(more ? SAY.more : SAY.again), ctx.wait(2600)]) : Promise.resolve();
      if (L === 1) {             // the gentlest game shows the cards first
        intro.then(() => { if (g0 === gen) ctx.prompt(SAY.look); });
        ctx.after(dealt + 250, () => { if (g0 !== gen) return; cards.forEach((c, i) => { turn(c, true, i * 0.07); }); flick(); });
        ctx.after(dealt + 2900, () => { if (g0 !== gen) return; cards.forEach((c, i) => { turn(c, false, i * 0.07); }); flick(); });
        ctx.after(dealt + 3500, () => { if (g0 !== gen) return; busy = false; ctx.prompt(p.prompt); });
      } else {
        intro.then(() => { if (g0 === gen) ctx.prompt(p.prompt); });
        told[p.prompt] = 1;
        ctx.after(dealt, () => { if (g0 === gen) busy = false; });
      }
    }

    function turnBack() {
      if (!pend) return; const { a, b } = pend; pend = null;
      for (const c of [a, b]) { c.hint = 0; turn(c, false); }
      flick();
    }
    function tap(c) {
      if (busy || !c.parent) return;
      if (pend && (c === pend.a || c === pend.b)) { turnBack(); return; }      // touching a pair that did not match turns it back at once
      if (c.done || c.up) { c.press(); if (c.done) K.sfx.tone(880, 0.06, { type: 'sine', vol: 0.06 }); return; }
      if (pend) turnBack();
      for (const o of cards) if (o.hint) { o.hint = 0; o.rot = 0; }
      c.press(); flick(); turn(c, true); c.seen = true; open.push(c);
      let said = null;
      if (c.f.say) { said = c.f.say; K.say(said); }
      else if (L >= 2 && !told[SAY[c.kind]] && SAY[c.kind]) { told[SAY[c.kind]] = 1; ctx.prompt(SAY[c.kind]); }
      if (open.length < 2) { helpWith(c); return; }
      const [a, b] = open; open = [];
      if (a.pair === b.pair) match(a, b, said); else miss(a, b);
    }
    /** After a few misses in a row the partner wiggles, if the child has already seen it. */
    function helpWith(c) {
      if (streak < HELP) return;
      const mate = cards.find((o) => o !== c && o.pair === c.pair);
      if (!mate || (!mate.seen && streak < HELP + 2)) return;
      mate.hint = 1;
      if (!saidWiggle && !c.f.say) { saidWiggle = true; ctx.after(500, () => { if (mate.hint) K.say(SAY.wiggle); }); }
    }
    function match(a, b, said) {
      const g0 = gen; found++; streak = 0; stat.matches++;
      a.done = b.done = true;
      ctx.after(330, () => {
        if (g0 !== gen) return;
        K.sfx.ding(); K.sfx.step(found + 2);
        for (const c of [a, b]) {
          c.to({ gold: 1 }, { dur: 0.4 });
          c.to({ y: c.y - G.h * 0.12 }, { dur: 0.16, ease: 'out' }).then(() => { if (g0 === gen && c.parent) c.to({ y: G.pos[c.i].y }, { dur: 0.5, ease: 'elastic' }); });
          ctx.fx.burst(c.x, c.y, { n: 9, colors: ['#F2B33D', '#FBF6EC', '#E8664A'] });
        }
        if (a.say && a.say !== said) K.say(a.say);
      });
      if (found === pairsN) {
        busy = true; stat.boards++;
        ctx.after(1100, () => {
          if (g0 !== gen) return;
          cards.forEach((c, i) => { c.to({ rot: (i % 2 ? 1 : -1) * 0.07 }, { dur: 0.18, delay: i * 0.03 }).then(() => c.to({ rot: 0 }, { dur: 0.5, ease: 'elastic' })); });
          ctx.celebrate().then(() => {
            if (g0 !== gen) return;
            if (misses <= pairsN) step = Math.min(2, step + 1); else if (misses > pairsN * 3) step = Math.max(0, step - 1);
            round++;
            const old = cards; cards = [];
            old.forEach((c, i) => { c.to({ y: H + 300, rot: (i % 2 ? 1 : -1) * 0.7 }, { dur: 0.45, ease: 'inOut', delay: i * 0.025 }).then(() => c.remove()); });
            K.sfx.whoosh();
            ctx.after(520 + old.length * 25, () => { if (g0 === gen) deal(true); });
          });
        });
      }
    }
    function miss(a, b) {
      const g0 = gen; misses++; streak++; stat.misses++;
      const mine = (pend = { a, b });
      ctx.after(420, () => {
        if (g0 !== gen || pend !== mine) return;
        K.sfx.whoops();
        for (const c of [a, b]) c.to({ rot: 0.06 }, { dur: 0.09 }).then(() => c.to({ rot: -0.05 }, { dur: 0.1 })).then(() => c.to({ rot: 0 }, { dur: 0.3, ease: 'elastic' }));
      });
      const quiet = !a.f.say && !b.f.say;
      if (!saidBack) { saidBack = true; ctx.after(quiet ? 500 : 1000, () => { if (g0 === gen) K.say(SAY.back); }); }
      else if (streak === HELP) ctx.after(quiet ? 500 : 1000, () => { if (g0 === gen) K.say(SAY.remember); });
      ctx.after(HOLD, () => { if (g0 === gen && pend === mine) turnBack(); });
    }

    function scene() {
      W = st.W; H = st.H; A.setRes(st.res);
      if (bg) bg.remove();
      bg = st.add({ z: 0, sprite: table(W, H) });
    }
    scene();
    live = () => {             // the screen changed shape: slide the cards to their new places
      scene();
      if (!cards.length) return;
      G = grid(cards.length);
      for (const c of cards) { c.spUp = c.spBack = null; c.hit = { x: -G.w / 2, y: -G.h / 2, w: G.w, h: G.h }; c.pad = Math.max(2, G.gap / 2 - 1); c.to({ x: G.pos[c.i].x, y: G.pos[c.i].y }, { dur: 0.3 }); }
    };

    K._memory = {       // for browser tests
      st,      get cards() { return cards; }, get busy() { return busy; }, get found() { return found; }, get pairs() { return pairsN; }, get step() { return step; }, get round() { return round; },
      get grid() { return G; }, stat, tap: (i) => tap(cards[i]),
      mate: (i) => cards.findIndex((o, k) => k !== i && o.pair === cards[i].pair),
      jump(r, s) { round = r; if (s != null) step = s; deal(false); },
    };
    ctx.onExit(() => { live = null; K._memory = null; });
    deal(false);
  }

  /* ---------------- thumbnail ---------------- */
  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = TABLE; g.fillRect(0, 0, w, w);
    const gr = g.createRadialGradient(w / 2, w / 2, w * 0.1, w / 2, w / 2, w * 0.75); gr.addColorStop(0, 'rgba(255,250,225,.25)'); gr.addColorStop(1, 'rgba(30,50,70,.22)'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    const rr = (x, y, cw, ch, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + cw, y, x + cw, y + ch, r); g.arcTo(x + cw, y + ch, x, y + ch, r); g.arcTo(x, y + ch, x, y, r); g.arcTo(x, y, x + cw, y, r); g.closePath(); };
    const card = (x, y, rot, col, inside) => {
      g.save(); g.translate(x * u, y * u); g.rotate(rot); g.scale(u, u);
      g.save(); g.shadowColor = 'rgba(30,40,60,.35)'; g.shadowBlur = 14 * u; g.shadowOffsetY = 7 * u; rr(-62, -80, 124, 160, 18); g.fillStyle = col; g.fill(); g.restore();
      inside(); g.restore();
    };
    const st5 = (r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.2832 - 1.5708, q = i % 2 ? r * 0.5 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); };
    const backIn = () => { g.strokeStyle = 'rgba(255,240,220,.8)'; g.lineWidth = 4; rr(-52, -70, 104, 140, 12); g.stroke(); g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fillStyle = CREAM; g.fill(); st5(23); g.fillStyle = '#F2B33D'; g.fill(); };
    const faceIn = (name, alt) => () => {
      g.strokeStyle = 'rgba(47,143,138,.5)'; g.lineWidth = 4; rr(-52, -70, 104, 140, 12); g.stroke();
      const p = PIC[name];
      if (p && p.ok) { const k = Math.min(96 / p.im.width, 96 / p.im.height); g.drawImage(p.im, -p.im.width * k / 2, -p.im.height * k / 2, p.im.width * k, p.im.height * k); }
      else { g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fillStyle = alt; g.fill(); g.fillStyle = '#2E2A3B'; for (const sx of [-13, 13]) { g.beginPath(); g.arc(sx, -6, 5, 0, 7); g.fill(); } g.beginPath(); g.arc(0, 8, 12, 0.3, 2.84); g.lineWidth = 4; g.lineCap = 'round'; g.strokeStyle = '#2E2A3B'; g.stroke(); }
    };
    card(78, 118, -0.2, BACK, backIn);
    card(226, 112, 0.16, CREAM, faceIn('cat', '#A99C92'));
    card(150, 190, -0.03, CREAM, faceIn('cat', '#A99C92'));
    g.save(); g.translate(246 * u, 232 * u); g.scale(u, u); st5(26); g.fillStyle = CREAM; g.fill(); st5(19); g.fillStyle = '#F2B33D'; g.fill(); g.restore();
  }

  K.game({ id: 'memory', title: 'Memory Match', voice: 'memory', group: 'arcade', age: 5, order: 22, icon, start, lines, resize: () => { if (live) live(); } });
})();
