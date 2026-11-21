/* Number Rocket — fly from planet to planet on number power.
   A question sits on the big card (stars to count, or a sum in big type) and is asked out loud with a
   short fixed sentence. The answers are planets: tap the right one and the rocket hops to the next
   star on its way. After the last hop it lands on a new planet and everybody cheers.
   A wrong planet wobbles and dims, and a picture hint appears on the card (counting labels, a number
   line with hops, an array of dots). After two misses the right planet glows. No timer, no losing.

   Level 1: count the stars (1-5, later to 8), which group has more.
   Level 2: adding and taking away within 10 with dots to count, number bonds to 5 and 10, what comes next.
   Level 3: adding and subtracting (within 20, growing to 100), times tables (2, 5, 10, then 3, 4, then
            the rest), doubles and halves, missing numbers, which is bigger or smaller.
   The game gets a little harder after each first-try answer and eases off after a muddle. */
(function () {
  'use strict';
  const A = K.art;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const MINUS = '−', TIMES = '×';
  const LEG = 4;                       // answers between planets
  const SAY = {
    count: 'How many stars?', more: 'Which has more?', all: 'How many altogether?', left: 'How many are left?',
    missing: 'What is missing?', next: 'What comes next?', answer: 'What is the answer?', double: 'What is double?',
    half: 'What is half?', bigger: 'Which is bigger?', smaller: 'Which is smaller?',
    hCount: "Let's count.", hMore: 'Count each group.', hAll: 'Count them all.', hLeft: 'Count the ones that are left.',
    hEmpty: 'Count the empty ones.', hLine: 'Look at the number line.', hHops: 'Count the hops.', hDots: 'Count the dots.',
    hBig: 'Further along is bigger.', hSmall: 'Further back is smaller.', glow: 'Try the glowing one.',
    go: 'Blast off!', planet: 'A new planet!',
  };
  const numLine = (n) => cap(K.numWord(n)) + '!';
  function lines() { const out = Object.values(SAY); for (let n = 1; n <= 10; n++) out.push(numLine(n)); return out; }

  /* ---------- pictures ---------- */
  const PIC = {};
  for (const nm of ['rocket', 'moon', 'ministar', 'star', 'bg-space']) { const im = new Image(); im.onload = () => { PIC[nm] = im; }; im.src = 'img/star/' + nm + '.webp'; }

  /** The rocket, nose up, h tall, centred on (0,0). The picture when it has loaded, else cut paper. */
  function drawRocket(g, h) {
    const im = PIC.rocket;
    if (im) { const w = h * im.width / im.height; g.drawImage(im, -w / 2, -h / 2, w, h); return; }
    const k = h / 200; g.save(); g.scale(k, k);
    g.fillStyle = '#6E4E7E'; g.beginPath(); g.moveTo(-30, 30); g.quadraticCurveTo(-62, 60, -56, 96); g.lineTo(-24, 76); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(30, 30); g.quadraticCurveTo(62, 60, 56, 96); g.lineTo(24, 76); g.closePath(); g.fill();
    g.fillStyle = '#4A3A56'; g.fillRect(-18, 78, 36, 18);
    g.fillStyle = '#E0483A'; g.beginPath(); g.moveTo(0, -96); g.bezierCurveTo(44, -50, 42, 40, 28, 84); g.lineTo(-28, 84); g.bezierCurveTo(-42, 40, -44, -50, 0, -96); g.fill();
    g.fillStyle = '#F6DDB8'; g.beginPath(); g.moveTo(0, -98); g.bezierCurveTo(16, -82, 24, -66, 27, -50); g.lineTo(-27, -50); g.bezierCurveTo(-24, -66, -16, -82, 0, -98); g.fill();
    g.fillStyle = '#F2B33D'; g.fillRect(-33, 46, 66, 11);
    g.fillStyle = '#F6DDB8'; g.beginPath(); g.arc(0, -8, 22, 0, 7); g.fill();
    g.fillStyle = '#9FD3DA'; g.beginPath(); g.arc(0, -8, 16, 0, 7); g.fill();
    g.restore();
  }
  function starPath(g, r, inner) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * (inner || 0.55) : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); }
  /** A star r across (radius), smiling when the picture is there. */
  function drawStar(g, r, name) {
    const im = PIC[name || 'star'];
    if (im) { const w = r * 2.1, h = w * im.height / im.width; g.drawImage(im, -w / 2, -h / 2, w, h); return; }
    g.save(); g.lineJoin = 'round'; starPath(g, r * 0.86, 0.6); g.fillStyle = name === 'ministar' ? '#F8E3A0' : '#F2B33D'; g.strokeStyle = g.fillStyle; g.lineWidth = r * 0.3; g.stroke(); g.fill(); g.restore();
  }

  /* ---------- planets ---------- */
  const LOOKS = [
    { id: 'teal', c: '#2F8F8A', t: 'bands' }, { id: 'tomato', c: '#E8664A', t: 'spots' }, { id: 'plum', c: '#8A62A0', t: 'bands' },
    { id: 'blue', c: '#5B8FC7', t: 'spots' }, { id: 'gold', c: '#E9A52F', t: 'bands' }, { id: 'leaf', c: '#6FA65F', t: 'spots' }, { id: 'rose', c: '#D9728C', t: 'bands' },
  ];
  const EARTH = { id: 'earth', c: '#5B8FC7', t: 'earth' }, MOON = { id: 'moon', c: '#F1DDB0', t: 'moon' };
  function paintPlanet(g, s, look, r) {
    const c = look.c, box = { x: -r, y: -r, w: r * 2, h: r * 2 };
    g.beginPath(); A.blob(g, 0, 0, r, r * 0.985, 0.012, 3, 16); A.paper(g, s, c, { shadow: 0.9, light: 0.1, box });
    g.save(); g.beginPath(); g.arc(0, 0, r - 0.5, 0, 7); g.clip();
    const rr = A.rng(look.id.length * 7 + look.c.charCodeAt(2));
    if (look.t === 'bands') {
      [[-0.46, 0.2, -0.07], [0.02, 0.17, 0.07], [0.5, 0.24, -0.1]].forEach(([y, h, sh], i) => {
        g.beginPath(); const pts = [];
        for (let x = -1.1; x <= 1.11; x += 0.275) pts.push([x * r, (y + Math.sin(x * 3 + i * 2) * 0.05) * r]);
        for (let x = 1.1; x >= -1.11; x -= 0.275) pts.push([x * r, (y + h + Math.sin(x * 2.4 + i) * 0.05) * r]);
        A.smooth(g, pts); A.paper(g, s, A.shade(c, sh), { shadow: 0.25, light: 0, grain: 0.2 });
      });
    } else if (look.t === 'earth') {
      for (const [x, y, a, b] of [[-0.4, -0.3, 0.42, 0.3], [0.38, 0.25, 0.4, 0.34], [0.2, -0.62, 0.3, 0.16], [-0.5, 0.6, 0.3, 0.2]]) { g.beginPath(); A.blob(g, x * r, y * r, a * r, b * r, 0.2, 5 + x * 10, 9); A.paper(g, s, '#7DB56B', { shadow: 0.3, light: 0.05 }); }
    } else {
      const n = look.t === 'moon' ? 5 : 6;
      for (let i = 0; i < n; i++) { const a = rr() * 6.28, d = (0.2 + rr() * 0.6) * r, q = (0.1 + rr() * 0.14) * r; g.beginPath(); A.blob(g, Math.cos(a) * d, Math.sin(a) * d, q, q * 0.9, 0.1, i + 2, 9); g.fillStyle = A.shade(c, look.t === 'moon' ? -0.09 : i % 2 ? 0.07 : -0.08); g.fill(); }
    }
    const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.3, 0, 0, r * 1.05); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(34,24,70,.34)');
    g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
    g.restore();
  }
  const planetSprite = (look, r) => A.sprite('rk-planet-' + look.id + '-' + Math.round(r), [-r - 4, -r - 4, r * 2 + 8, r * 2 + 8], (g, s) => paintPlanet(g, s, look, r));
  function drawPlanet(g, look, r) {
    const halo = g.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.42); halo.addColorStop(0, A.alpha(look.c, 0.4)); halo.addColorStop(1, A.alpha(look.c, 0));
    g.fillStyle = halo; g.beginPath(); g.arc(0, 0, r * 1.42, 0, 7); g.fill();
    if (look.t === 'moon' && PIC.moon) { g.drawImage(PIC.moon, -r, -r, r * 2, r * 2); return; }
    const sp = planetSprite(look, r); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
  }

  /* ---------- questions ---------- */
  const R = (a, b) => K.randInt(a, b);
  /** Wrong answers that sit close to the right one, so guessing does not work and near-misses teach. */
  function choices(ans, n, extra, lo, hi) {
    lo = lo == null ? 0 : lo; hi = hi == null ? 1e9 : hi;
    const pool = [];
    const add = (v) => { if (v !== ans && v >= lo && v <= hi && Math.floor(v) === v && pool.indexOf(v) < 0) pool.push(v); };
    for (const v of K.shuffle(extra || [])) add(v);
    const near = K.shuffle([ans - 1, ans + 1, ans - 2, ans + 2]); for (const v of near) add(v);
    if (ans >= 20) for (const v of K.shuffle([ans - 10, ans + 10])) add(v);
    let step = 3; while (pool.length < n - 1 && step < 40) { add(ans + step); add(ans - step); step++; }
    const first = (extra && extra.length ? 2 : 0);
    const picked = pool.slice(0, first).concat(K.shuffle(pool.slice(first, first + 4))).slice(0, n - 1);
    return K.shuffle([ans].concat(picked));
  }
  /** Hops along a number line from a by d (tens first, then ones). */
  function hops(a, d) {
    const out = [], sg = d < 0 ? -1 : 1; let v = a, left = Math.abs(d);
    if (left > 12) while (left >= 10) { v += 10 * sg; left -= 10; out.push(v); }
    while (left > 0) { v += sg; left--; out.push(v); }
    return out;
  }
  function lineFor(a, b, small) {
    const lo0 = Math.min(a, b), hi0 = Math.max(a, b);
    if (small && hi0 <= 20) return { lo: 0, hi: hi0 <= 10 ? 10 : 20 };
    const lo = Math.max(0, Math.floor((lo0 - 1) / 10) * 10), hi = Math.ceil((hi0 + 1) / 10) * 10;
    return { lo, hi };
  }

  function generate(L, skill, kind, last) {
    const q = { misses: 0, hintK: 0, hintT: 0, counted: 0, solvedT: -1 };
    const nOpts = L === 1 ? 3 : L === 2 ? (skill < 3 ? 3 : 4) : 4;
    const sum = (a, op, b, res, unknown) => {       // unknown: 0 = first, 1 = second, 2 = result
      const parts = [String(a), op, String(b), '=', String(res)];
      q.tokens = parts.slice(); q.tokens[[0, 2, 4][unknown]] = '?'; q.full = parts; q.hole = [0, 2, 4][unknown];
      q.answer = [a, b, res][unknown];
    };
    if (L === 1) {
      kind = kind || (Math.random() < 0.65 ? 'count' : 'more');
      if (kind === 'count') {
        const max = skill < 2 ? 3 : skill < 5 ? 5 : 8;
        let n; do { n = R(1, max); } while (n === last);
        Object.assign(q, { kind, ask: SAY.count, hint: SAY.hCount, n, answer: n, opts: choices(n, 3, [], 1, max + 2), countTo: n });
      } else {
        const max = skill < 3 ? 5 : 8, gap = skill < 2 ? 2 : 1;
        let a, b; do { a = R(1, max); b = R(1, max); } while (Math.abs(a - b) < gap || Math.max(a, b) === last);
        Object.assign(q, { kind: 'more', ask: SAY.more, hint: SAY.hMore, answer: Math.max(a, b), opts: [a, b], group: true, icon: 'more', hintPic: { t: 'rows', a, b } });
      }
    } else if (L === 2) {
      kind = kind || K.pick(['add', 'add', 'sub', 'sub', 'bond', 'bond', 'next']);
      const max = skill < 2 ? 5 : 10;
      if (kind === 'add') {
        let a, b; do { a = R(1, max - 1); b = R(1, max - a); } while (a + b === last);
        sum(a, '+', b, a + b, 2); Object.assign(q, { kind, ask: SAY.all, hint: SAY.hAll, pic: { t: 'add', a, b }, countTo: a + b });
      } else if (kind === 'sub') {
        let a, b; do { a = R(2, max); b = R(1, a - 1); } while (a - b === last);
        sum(a, MINUS, b, a - b, 2); Object.assign(q, { kind, ask: SAY.left, hint: SAY.hLeft, pic: { t: 'sub', a, b }, countTo: a - b });
      } else if (kind === 'bond') {
        const T = skill < 2 ? 5 : Math.random() < 0.3 ? 5 : 10;
        let a; do { a = R(1, T - 1); } while (T - a === last);
        sum(a, '+', T - a, T, 1); Object.assign(q, { kind, ask: SAY.missing, hint: SAY.hEmpty, pic: { t: 'frame', a, T }, countTo: T - a });
      } else {
        const step = skill >= 5 && Math.random() < 0.4 ? 2 : 1, top = skill < 2 ? 4 : 16 - step * 3;
        let s; do { s = R(1, top); } while (s + 3 * step === last);
        const seq = [s, s + step, s + 2 * step], ans = s + 3 * step;
        Object.assign(q, { kind: 'next', ask: SAY.next, hint: SAY.hLine, tokens: seq.map((v) => v + ',').concat(['?']), full: seq.map((v) => v + ',').concat([String(ans)]), hole: 3, answer: ans,
          hintPic: Object.assign({ t: 'line', start: s, hops: [s + step, s + 2 * step, ans], ask: true, pins: seq }, { lo: 0, hi: ans <= 9 ? 10 : 20 }) });
      }
      q.opts = choices(q.answer, nOpts, [], 1, 20);
    } else {
      const t = skill < 3 ? 0 : skill < 6 ? 1 : skill < 10 ? 2 : 3;
      kind = kind || K.pick(['add', 'add', 'sub', 'sub', 'times', 'times', 'double', 'half', 'missing', 'missing', 'compare']);
      const M = [20, 50, 100, 100][t];
      let extra = [], guard = 0;
      do {
        if (kind === 'add') {
          const a = R(t ? 10 : 2, M - 2), b = R(1, Math.min(M - a, t === 0 ? 9 : 99));
          sum(a, '+', b, a + b, 2); Object.assign(q, { kind, ask: SAY.answer, hint: SAY.hLine, hintPic: Object.assign({ t: 'line', start: a, hops: hops(a, b), ask: true }, lineFor(a, a + b, t === 0)) });
        } else if (kind === 'sub') {
          const a = R(t ? 12 : 4, M), b = R(1, Math.min(a - 1, t === 0 ? 9 : 99));
          sum(a, MINUS, b, a - b, 2); Object.assign(q, { kind, ask: SAY.answer, hint: SAY.hLine, hintPic: Object.assign({ t: 'line', start: a, hops: hops(a, -b), ask: true }, lineFor(a, a - b, t === 0)) });
        } else if (kind === 'times') {
          const tab = K.pick([[2, 5, 10], [2, 3, 4, 5, 10], [3, 4, 6, 7, 8, 9], [6, 7, 8, 9, 11, 12]][t]), m = R(t ? 2 : 1, 10);
          const flip = Math.random() < 0.5; sum(flip ? tab : m, TIMES, flip ? m : tab, tab * m, 2);
          extra = [tab * (m + 1), tab * (m - 1), (tab + 1) * m];
          Object.assign(q, { kind, ask: SAY.answer, hint: SAY.hDots, hintPic: { t: 'array', rows: Math.min(tab, m), cols: Math.max(tab, m) } });
        } else if (kind === 'double') {
          const n = R(t ? 6 : 1, [10, 20, 50, 50][t]);
          Object.assign(q, { kind, ask: SAY.double, tokens: ['double', String(n), '=', '?'], full: ['double', String(n), '=', String(n * 2)], hole: 3, answer: n * 2 });
          if (n <= 12) Object.assign(q, { hint: SAY.hDots, hintPic: { t: 'array', rows: 2, cols: n } });
          else Object.assign(q, { hint: SAY.hLine, hintPic: Object.assign({ t: 'line', start: n, hops: hops(n, n), ask: true }, lineFor(n, n * 2)) });
        } else if (kind === 'half') {
          const n = 2 * R(t ? 4 : 1, [10, 20, 50, 50][t]);
          Object.assign(q, { kind, ask: SAY.half, tokens: ['half of', String(n), '=', '?'], full: ['half of', String(n), '=', String(n / 2)], hole: 3, answer: n / 2 });
          if (n <= 24) Object.assign(q, { hint: SAY.hDots, hintPic: { t: 'array', rows: 2, cols: n / 2 } });
          else Object.assign(q, { hint: SAY.hLine, hintPic: { t: 'line', lo: 0, hi: Math.ceil(n / 10) * 10, start: 0, hops: [n / 2, n], ask: false, mid: n / 2, pins: [0, n] } });
        } else if (kind === 'missing') {
          const C = [12, 20, 50, 100][t], form = K.pick(t >= 2 ? ['a', 'b', 's', 'x'] : ['a', 'a', 'b', 's']);
          if (form === 'x') {
            const tab = K.pick([2, 3, 4, 5, 10]), m = R(2, 10); sum(tab, TIMES, m, tab * m, 1); extra = [m + 1, m - 1];
            Object.assign(q, { hint: SAY.hDots, hintPic: { t: 'array', rows: tab, cols: m, rowsOnly: true } });
          } else {
            const c = R(5, C), a = R(1, c - 1), d = c - a;
            if (form === 'a') sum(a, '+', d, c, 1); else if (form === 'b') sum(d, '+', a, c, 0); else sum(c, MINUS, d, a, 1);
            Object.assign(q, { hint: SAY.hHops, hintPic: Object.assign({ t: 'line', start: a, hops: hops(a, d), pins: [a, c] }, lineFor(a, c, t === 0)) });
          }
          Object.assign(q, { kind, ask: SAY.missing });
        } else {
          const small = t >= 1 && Math.random() < 0.45, n = t === 0 ? 2 : 3, top = t >= 2 ? 999 : 99, lo = t >= 2 ? 100 : 10;
          const a = R(lo, top), s = String(a), set = [a];
          const swapped = Number(s.slice(-1) + s.slice(1, -1) + s[0]);
          if (swapped !== a && swapped >= lo) set.push(swapped);
          while (set.length < n) { const v = K.clamp(a + K.pick([-1, 1]) * K.pick([1, 2, 3, 9, 10, 11, 20]), lo, top); if (set.indexOf(v) < 0) set.push(v); }
          set.length = n;
          Object.assign(q, { kind: 'compare', ask: small ? SAY.smaller : SAY.bigger, hint: small ? SAY.hSmall : SAY.hBig, icon: small ? 'smaller' : 'bigger', answer: small ? Math.min(...set) : Math.max(...set), opts: K.shuffle(set),
            hintPic: { t: 'line', lo: t >= 2 ? Math.floor(Math.min(...set) / 100) * 100 : 0, hi: t >= 2 ? Math.ceil((Math.max(...set) + 1) / 100) * 100 : 100, pins: set, hops: [], start: null } });
        }
      } while (q.answer === last && guard++ < 30);
      if (!q.opts) q.opts = choices(q.answer, nOpts, extra, kind === 'missing' || kind === 'half' ? 1 : 0);
    }
    q.key = q.kind + ':' + (q.full ? q.full.join('') : q.opts.join(',')) + ':' + q.answer;
    return q;
  }

  /* ---------- the game ---------- */
  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const store = (K.s.done.rocket = K.s.done.rocket || {});
    store.skill = store.skill || {};
    let skill = Math.max(0, (store.skill[L] || 0) - 2);       // start a little below where the child left off
    let Q = null, busy = true, fuel = 0, legs = 0, lastAnswer = null, lastKind = '', forced = null, asked = 0;
    const recent = [];
    const INK = A.C.ink, CREAM = '#FBF6EC';

    /* ---- layout ---- */
    const SY = land ? 204 : 212, PX0 = land ? 196 : 60, PX1 = W - PX0, PR = land ? 60 : 42, RL = land ? 156 : 100;
    const stopX = (i) => { const a = PX0 + PR + RL / 2 + 4, b = PX1 - PR - RL / 2 + 16; return a + (b - a) * (i / LEG); };
    const CW = land ? Math.min(W - 180, 940) : W - 32, CH = land ? 350 : 396, CY = land ? 452 : 500;

    /* ---- space ---- */
    st.add({ z: 0, draw(g) {
      const im = PIC['bg-space'];
      if (im) { const k = Math.max(W / im.width, H / im.height) * 1.24; g.drawImage(im, 0, H - im.height * k, im.width * k, im.height * k);   // (zoomed so the picture's own planet stays out of the way)
        g.fillStyle = 'rgba(24,18,70,.18)'; g.fillRect(0, 0, W, H); }
      else { const gr = g.createLinearGradient(0, 0, W * 0.4, H); gr.addColorStop(0, '#3A2E8C'); gr.addColorStop(1, '#1D1A5E'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    } });
    const rs = A.rng(11), tw = [];
    for (let i = 0; i < (land ? 26 : 18); i++) tw.push({ x: rs() * W, y: rs() * H, r: 4 + rs() * 7, ph: rs() * 6, sp: 1 + rs() * 2 });
    st.add({ z: 1, draw(g) {
      for (const s of tw) {
        const k = 0.35 + 0.65 * Math.abs(Math.sin(st.t * s.sp + s.ph));
        g.save(); g.translate(s.x, s.y); g.globalAlpha = k * 0.9; g.fillStyle = '#FFF4CF'; g.beginPath();
        for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, q = i % 2 ? s.r * 0.3 : s.r * k; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
        g.fill(); g.restore();
      }
    } });

    /* ---- the journey: two planets, the stars between, the rocket ---- */
    const looks = K.shuffle(LOOKS);
    const mkPlanet = (look, x) => { const n = st.add({ z: 4, x, y: SY, look, k: 1 }); n.draw = (g) => { g.save(); g.rotate(Math.sin(st.t * 0.5 + x) * 0.06); drawPlanet(g, n.look, PR); g.restore(); }; return n; };
    let homeP = mkPlanet(EARTH, PX0), destP = mkPlanet(MOON, PX1);
    st.add({ z: 3, draw(g) {
      g.save(); g.setLineDash([3, 16]); g.lineCap = 'round'; g.lineWidth = 5; g.strokeStyle = 'rgba(255,244,207,.42)';
      g.beginPath(); g.moveTo(PX0 + PR + 8, SY); g.lineTo(PX1 - PR - 8, SY); g.stroke(); g.restore();
    } });
    const way = [];                                // the stars the rocket will reach on this leg
    function layStars() {
      for (const s of way) s.remove(); way.length = 0;
      for (let i = 1; i < LEG; i++) {
        const n = st.add({ z: 5, x: stopX(i) + RL * 0.36, y: SY, sx: 0, sy: 0, i }); const r = land ? 27 : 20;
        n.draw = (g) => { g.save(); g.translate(0, Math.sin(st.t * 2.2 + i) * 4); g.rotate(Math.sin(st.t * 1.4 + i * 2) * 0.12); drawStar(g, r, 'ministar'); g.restore(); };
        n.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: i * 0.08 }); way.push(n);
      }
    }
    const ship = st.add({ z: 8, x: stopX(0), y: SY, boost: 0, tilt: 0, label: 'rocket', hit: { x: -RL / 2, y: -RL * 0.3, w: RL, h: RL * 0.6 }, pressable: false });
    ship.draw = (g) => {
      g.save(); g.translate(0, Math.sin(st.t * 2.6) * 5); g.rotate(Math.PI / 2 + ship.tilt + Math.sin(st.t * 1.7) * 0.03);
      const f = 0.55 + ship.boost * 1.1 + Math.sin(st.t * 31) * 0.08, y0 = RL * 0.44;
      for (const [col, wd, len] of [['#F2B33D', 0.17, 0.62], ['#E8664A', 0.11, 0.42], ['#FFF1BF', 0.055, 0.24]]) {
        g.beginPath(); g.moveTo(-RL * wd, y0); g.quadraticCurveTo(-RL * wd * 1.1, y0 + RL * len * f * 0.5, Math.sin(st.t * 23 + len * 9) * 4, y0 + RL * len * f); g.quadraticCurveTo(RL * wd * 1.1, y0 + RL * len * f * 0.5, RL * wd, y0); g.closePath(); g.fillStyle = col; g.fill();
      }
      drawRocket(g, RL); g.restore();
    };
    ship.update = (dt) => { ship.boost = Math.max(0, ship.boost - dt * 1.1); };
    ship.onTap = () => { ship.boost = 1; K.sfx.whoosh(); ctx.fx.burst(ship.x - RL / 2, ship.y, { n: 6, colors: ['#F2B33D', '#E8664A', '#FFF1BF'] }); };

    /* ---- the question card ---- */
    const card = st.add({ z: 10, x: W / 2, y: CY, pop: 0 });
    const cardSp = A.sprite('rk-card-' + Math.round(CW) + 'x' + CH, [-CW / 2, -CH / 2, CW, CH], (g, s) => {
      g.beginPath(); A.rect(g, -CW / 2, -CH / 2, CW, CH, 46, 5, 1.5); A.paper(g, s, CREAM, { shadow: 1, depth: 1.3, light: 0.035, box: { x: -CW / 2, y: -CH / 2, w: CW, h: CH } });
      g.save(); g.setLineDash([10, 9]); g.lineWidth = 2.5; g.strokeStyle = 'rgba(110,78,126,.22)'; g.beginPath(); A.rect(g, -CW / 2 + 14, -CH / 2 + 14, CW - 28, CH - 28, 34, 5, 0); g.stroke(); g.restore();
    });
    const text = (g, t, x, y, size, col, font) => { g.font = `700 ${size}px ${font || A.FONT_BODY}`;   // (schoolbook digits: clearer than the display face for new readers)
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(t, x, y); };
    const dot = (g, x, y, r, col, label, a) => {
      g.save(); g.globalAlpha *= a == null ? 1 : a;
      g.beginPath(); g.arc(x + 1.5, y + 3, r, 0, 7); g.fillStyle = 'rgba(46,40,70,.16)'; g.fill();
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.fill();
      g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.26, 0, 7); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill();
      if (label != null) text(g, String(label), x, y + 1, r * 1.15, '#fff', A.FONT_BODY);
      g.restore();
    };
    function drawTokens(g, q, y, fs, maxW) {
      const toks = q.solvedT >= 0 ? q.full : q.tokens, gap = fs * 0.24, hole = q.hole;
      const font = (t) => `700 ${/^[a-z]/.test(t) ? fs * 0.5 : fs}px ${A.FONT_BODY}`;
      let ws, tot, guard = 0;
      do { ws = toks.map((t, i) => { g.font = font(t); return i === hole ? Math.max(fs * 0.82, g.measureText(q.full[i]).width + fs * 0.24) : g.measureText(t).width; }); tot = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1); if (tot > maxW) fs *= 0.93; } while (tot > maxW && guard++ < 20);
      let x = -tot / 2;
      toks.forEach((t, i) => {
        const cx = x + ws[i] / 2;
        if (i === hole) {
          if (q.solvedT < 0) {
            g.save(); g.translate(cx, y); g.rotate(Math.sin(st.t * 2.2) * 0.04);
            g.beginPath(); A.rect(g, -ws[i] / 2, -fs * 0.52, ws[i], fs * 1.04, fs * 0.2, 3, 0); g.fillStyle = 'rgba(110,78,126,.12)'; g.fill();
            g.setLineDash([9, 8]); g.lineWidth = 3.5; g.strokeStyle = A.C.plum; g.stroke();
            text(g, '?', 0, fs * 0.04, fs * 0.8, A.C.plum); g.restore();
          } else {
            const k = Math.min(1, (st.t - q.solvedT) / 0.35), e = K.engine.ease.back(k);
            g.save(); g.translate(cx, y); g.scale(0.4 + 0.6 * e, 0.4 + 0.6 * e);
            g.beginPath(); A.rect(g, -ws[i] / 2, -fs * 0.52, ws[i], fs * 1.04, fs * 0.2, 3, 0); g.fillStyle = 'rgba(47,143,138,.16)'; g.fill();
            text(g, t, 0, fs * 0.04, fs, A.C.teal); g.restore();
          }
        } else if (/^[a-z]/.test(t)) text(g, t, cx, y + fs * 0.1, fs * 0.5, A.C.plum, A.FONT_BODY);
        else text(g, t, cx, y + fs * 0.04, fs, /[0-9]/.test(t) ? INK : A.C.tomato);
        x += ws[i] + gap;
      });
    }
    function drawPic(g, q, y, w, hh) {
      const p = q.pic, shown = Math.floor(q.counted);
      if (p.t === 'add' || p.t === 'sub') {
        const n = p.t === 'add' ? p.a + p.b + 1 : p.a, pitch = Math.min(84, w / (n + 0.5)), r = pitch * 0.4, x0 = -(n - 1) * pitch / 2;
        for (let i = 0, c = 0; i < n; i++) {
          if (p.t === 'add' && i === p.a) { text(g, '+', x0 + i * pitch, y, r * 1.8, A.C.tomato); continue; }
          c++;
          const gone = p.t === 'sub' && i >= p.a - p.b, x = x0 + i * pitch, yy = y + Math.sin(st.t * 2 + i) * 2;
          dot(g, x, yy, r, p.t === 'add' && i > p.a ? A.C.teal : A.C.tomato, !gone && c <= shown ? c : null, gone ? 0.28 : 1);
          if (gone) A.line(g, A.alpha(INK, 0.6), 4, (h) => { h.moveTo(x - r * 0.9, yy + r * 0.9); h.lineTo(x + r * 0.9, yy - r * 0.9); });
        }
      } else {
        const cols = 5, rows = p.T / 5, c = Math.min(84, w / 6, hh / rows), x0 = -cols * c / 2, y0 = y - rows * c / 2;
        g.beginPath(); A.rect(g, x0 - 7, y0 - 7, cols * c + 14, rows * c + 14, 14, 3, 0.6); g.fillStyle = '#EFE2C8'; g.fill();
        for (let i = 0, e = 0; i < p.T; i++) {
          const cx = x0 + (i % cols + 0.5) * c, cy = y0 + (Math.floor(i / cols) + 0.5) * c;
          g.beginPath(); A.rect(g, cx - c / 2 + 4, cy - c / 2 + 4, c - 8, c - 8, 10, i + 1, 0.4); g.fillStyle = '#FFFBF2'; g.fill();
          if (i < p.a) dot(g, cx, cy, c * 0.33, A.C.tomato);
          else { e++; if (e <= shown) dot(g, cx, cy, c * 0.33, A.C.teal, e); else if (q.solvedT >= 0) dot(g, cx, cy, c * 0.33, A.C.teal); }
        }
      }
    }
    function drawHint(g, q, y, w, hh) {
      const p = q.hintPic; if (!p) return;
      if (p.t === 'rows') {                               // the two groups lined up, one under the other
        const pitch = Math.min(52, (w - 90) / 8), x0 = -(8 * pitch + 50) / 2 + pitch / 2, upto = q.hintT * 9;
        [p.a, p.b].forEach((n, i) => {
          const yy = y + (i - 0.5) * pitch * 1.25;
          for (let j = 0; j < n; j++) if (j < upto) dot(g, x0 + j * pitch, yy, pitch * 0.4, i ? A.C.teal : A.C.tomato);
          if (upto >= n) text(g, String(n), x0 + 8 * pitch + 14, yy + 2, pitch * 0.95, i ? A.C.teal : A.C.tomato);
        });
        return;
      }
      if (p.t === 'array') {
        const pitch = Math.min(40, (w - 20) / p.cols, hh / p.rows), r = pitch * 0.38, x0 = -(p.cols - 1) * pitch / 2, y0 = y - (p.rows - 1) * pitch / 2;
        const upto = q.hintT * Math.max(12, p.rows * p.cols * 0.9);
        for (let i = 0; i < p.rows; i++) for (let j = 0; j < p.cols; j++) if (i * p.cols + j < upto) dot(g, x0 + j * pitch, y0 + i * pitch, r, (p.rowsOnly ? j : i) % 2 ? A.C.teal : A.C.tomato);
        return;
      }
      const x0 = -w / 2 + 34, x1 = w / 2 - 34, span = p.hi - p.lo, px = (x1 - x0) / span, X = (v) => x0 + (v - p.lo) * px, ly = y - hh * 0.03;
      A.line(g, INK, 4, (h) => { h.moveTo(x0 - 16, ly); h.lineTo(x1 + 16, ly); });
      const minor = px >= 7 ? 1 : px * 5 >= 7 ? 5 : px * 10 >= 7 ? 10 : 50;
      A.line(g, INK, 2.5, (h) => { for (let v = p.lo; v <= p.hi; v += minor) { const len = v % 10 === 0 ? 13 : v % 5 === 0 ? 9 : 6; h.moveTo(X(v), ly - len); h.lineTo(X(v), ly + len); } });
      const step = [1, 2, 5, 10, 20, 50, 100, 200, 500].find((s) => s * px >= (span > 99 ? 54 : 34)) || 500;
      for (let v = p.lo; v <= p.hi; v += step) text(g, String(v), X(v), ly + 34, 22, A.alpha(INK, 0.75), A.FONT_BODY);
      const nh = Math.floor(q.hintT * 5);
      let prev = p.start;
      p.hops.forEach((v, i) => {
        if (i < nh) {
          const a = X(prev), b = X(v), big = Math.abs(v - prev) >= 10, top = Math.min(big ? 62 : 44, Math.abs(b - a) * 0.9 + 12);
          A.line(g, big ? A.C.plum : i % 2 ? A.C.teal : A.C.tomato, big ? 5 : 4, (h) => { h.moveTo(a, ly - 8); h.quadraticCurveTo((a + b) / 2, ly - 8 - top * 1.6, b, ly - 8); });
        }
        prev = v;
      });
      // name tags under the marked numbers, nudged apart when two numbers sit close together
      const tags = (p.pins || (p.start != null ? [p.start] : [])).map((v, i) => ({ v, x: X(v), w: String(v).length * 13 + 18, col: q.kind === 'compare' ? [A.C.tomato, A.C.teal, A.C.plum][i % 3] : A.C.tomato })).sort((a, b) => a.x - b.x);
      for (let k = 0; k < 3; k++) for (let i = 1; i < tags.length; i++) { const a = tags[i - 1], b = tags[i], need = (a.w + b.w) / 2 + 5 - (b.x - a.x); if (need > 0) { a.x -= need / 2; b.x += need / 2; } }
      for (const t of tags) { g.beginPath(); g.arc(X(t.v), ly, 9, 0, 7); g.fillStyle = t.col; g.fill(); const tx = K.clamp(t.x, -w / 2 + t.w / 2, w / 2 - t.w / 2); g.beginPath(); A.rect(g, tx - t.w / 2, ly + 50, t.w, 34, 10, 2, 0); g.fillStyle = t.col; g.fill(); text(g, String(t.v), tx, ly + 68, 23, '#fff', A.FONT_BODY); }
      if (p.mid != null) { g.beginPath(); g.arc(X(p.mid), ly, 11, 0, 7); g.fillStyle = A.C.plum; g.fill(); text(g, '?', X(p.mid), ly + 70, 30, A.C.plum); }
      if (p.ask && nh >= p.hops.length) { const v = p.hops[p.hops.length - 1]; g.beginPath(); g.arc(X(v), ly, 11 + Math.sin(st.t * 6) * 2, 0, 7); g.fillStyle = A.C.plum; g.fill(); }
    }
    function drawIcon(g, q) {
      const k = 1 + Math.sin(st.t * 3) * 0.04, u = Math.min(CH * 0.3, 112, (CW - 70) / 5);
      const ring = (x, y, r) => { g.save(); g.setLineDash([12, 10]); g.lineWidth = 5; g.strokeStyle = A.C.marigold; g.beginPath(); g.arc(x, y, r * k, 0, 7); g.stroke(); g.restore(); };
      if (q.icon === 'more') {
        g.save(); g.translate(-u * 1.6, 0); drawStar(g, u * 0.34); g.restore();
        for (const [x, y] of [[-0.42, -0.4], [0.42, -0.4], [0, 0.05], [-0.42, 0.5], [0.42, 0.5]]) { g.save(); g.translate(u * 1.6 + x * u, y * u); drawStar(g, u * 0.34); g.restore(); }
        ring(u * 1.6, 0.04 * u, u * 1.08);
      } else {
        const big = q.icon === 'bigger';
        dot(g, -u * 1.8, u * 0.3, u * 0.36, A.C.teal); dot(g, u * 1.2, 0, u * 0.86, A.C.tomato);
        ring(big ? u * 1.2 : -u * 1.8, big ? 0 : u * 0.3, big ? u * 1.08 : u * 0.6);
      }
      text(g, '?', q.icon === 'more' ? -u * 0.15 : -u * 0.62, 0, u * 1.1, A.C.plum);
    }
    card.draw = (g) => {
      const k = 1 + card.pop * 0.06; g.save(); g.scale(k, k);
      g.drawImage(cardSp.canvas, -cardSp.ox, -cardSp.oy, cardSp.w, cardSp.h);
      const q = Q;
      if (!q && asked) {                                 // between questions: the stars dance
        for (let i = 0; i < 3; i++) { g.save(); g.translate((i - 1) * CH * 0.5, -Math.abs(Math.sin(st.t * 5 + i * 1.1)) * CH * 0.14 + CH * 0.05); g.rotate(Math.sin(st.t * 5 + i) * 0.2); drawStar(g, CH * (i === 1 ? 0.24 : 0.18)); g.restore(); }
      } else if (q) {
        const w = CW - 70, h = CH - 50, base = land ? 150 : 124;
        if (q.kind === 'count') {
          const n = q.n, cols = n <= 5 ? n : Math.ceil(n / 2), rows = n <= 5 ? 1 : 2, pitch = Math.min(w / (cols + 0.2), (h - 30) / rows, 170), r = pitch * 0.4, shown = Math.floor(q.counted);
          for (let i = 0; i < n; i++) {
            const row = Math.floor(i / cols), inRow = row === rows - 1 ? n - cols * (rows - 1) : cols, x = (i % cols - (inRow - 1) / 2) * pitch, y = (row - (rows - 1) / 2) * pitch - (shown ? 12 : 0);
            const hop = i === shown - 1 ? Math.max(0, 1 - (q.counted - shown) * 3) : 0;
            g.save(); g.translate(x, y - hop * 16 + Math.sin(st.t * 2 + i * 1.3) * 4); g.rotate(Math.sin(st.t * 1.6 + i) * 0.06); drawStar(g, r); g.restore();
            if (i < shown) { g.beginPath(); g.arc(x, y + r * 0.86, 20, 0, 7); g.fillStyle = A.C.plum; g.fill(); text(g, String(i + 1), x, y + r * 0.86 + 1, 25, '#fff', A.FONT_BODY); }
          }
        } else if (q.icon) {
          const hk = q.hintPic ? q.hintK : 0; g.save(); g.translate(0, -h * 0.27 * hk); g.scale(1 - 0.5 * hk, 1 - 0.5 * hk); drawIcon(g, q); g.restore();
          if (hk > 0.01 && q.hintPic) { g.save(); g.globalAlpha *= hk; drawHint(g, q, h * 0.17, w, h * 0.5); g.restore(); }
        } else {
          const lower = q.pic ? 1 : q.hintK;
          drawTokens(g, q, -h * (q.pic ? 0.28 : 0.3) * lower, base * (1 - (q.pic ? 0.34 : 0.38) * lower), w);
          if (q.pic) drawPic(g, q, h * 0.2, w, h * 0.5);
          else if (lower > 0.01) { g.save(); g.globalAlpha *= lower; drawHint(g, q, h * 0.17, w, h * 0.5); g.restore(); }
        }
      }
      g.restore();
    };
    card.update = (dt) => {
      card.pop = Math.max(0, card.pop - dt * 3);
      const q = Q; if (!q) return;
      if (q.hintOn) { q.hintK = Math.min(1, q.hintK + dt * 3); q.hintT += dt; if (q.countTo && !q.spoken) q.counted = Math.min(q.countTo, q.counted + dt * 2.6); }
    };

    /* ---- the answer planets ---- */
    let options = [];
    function place(n) {
      if (land) { const gap = Math.min(270, (W - 120) / n); return Array.from({ length: n }, (_, i) => ({ x: W / 2 + (i - (n - 1) / 2) * gap, y: 800 + (i % 2 ? 14 : -10), r: 98 })); }
      if (n === 4) return [0, 1, 2, 3].map((i) => ({ x: W / 2 + (i % 2 ? 128 : -128), y: (i < 2 ? 838 : 1046) + (i % 2 ? 12 : -8), r: 94 }));
      const gap = n === 2 ? 250 : 180, r = n === 2 ? 104 : 84;
      return Array.from({ length: n }, (_, i) => ({ x: W / 2 + (i - (n - 1) / 2) * gap, y: 910 + (i % 2 ? 22 : -14), r }));
    }
    function clearOptions() { for (const o of options) { const n = o.node; n.onTap = null; n.to({ sx: 0, sy: 0, alpha: 0 }, { dur: 0.22, ease: 'inOut' }).then(() => n.remove()); } options = []; }
    function showOptions(q) {
      const spots = place(q.opts.length), cols = K.shuffle(LOOKS);
      options = q.opts.map((v, i) => {
        const p = spots[i], look = cols[i % cols.length];
        const node = st.add({ z: 20, x: p.x, y: p.y, sx: 0, sy: 0, _bsx: 1, _bsy: 1, hitR: p.r, pad: 6, label: (q.group ? 'group of ' : 'answer ') + v });   // (_bsx: a tap while it pops in still springs back to full size)
       
        const o = { v, node, r: p.r, out: false, glow: false, ph: Math.random() * 6 };
        node.draw = (g) => {
          g.save(); g.translate(0, Math.sin(st.t * 1.5 + o.ph) * 6);
          if (o.glow) { const k = 0.5 + 0.5 * Math.sin(st.t * 6); const gr = g.createRadialGradient(0, 0, p.r * 0.7, 0, 0, p.r * (1.5 + k * 0.2)); gr.addColorStop(0, 'rgba(255,236,150,.95)'); gr.addColorStop(1, 'rgba(255,236,150,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, p.r * 1.8, 0, 7); g.fill(); const s2 = 1 + k * 0.06; g.scale(s2, s2); }
          drawPlanet(g, look, p.r);
          if (q.group) {
            const rows = v <= 3 ? [v] : v <= 6 ? [Math.ceil(v / 2), Math.floor(v / 2)] : [3, v - 6 > 0 ? 3 : v - 3, v - 6].filter((x) => x > 0), sr = p.r * (v <= 3 ? 0.27 : 0.23), pitch = sr * 2.2;
            rows.forEach((cnt, ri) => { for (let j = 0; j < cnt; j++) { g.save(); g.translate((j - (cnt - 1) / 2) * pitch, (ri - (rows.length - 1) / 2) * pitch); drawStar(g, sr, 'ministar'); g.restore(); } });
            if (Q === q && q.hintK > 0.5) { g.beginPath(); g.arc(0, p.r + 6, 26, 0, 7); g.fillStyle = CREAM; g.fill(); text(g, String(v), 0, p.r + 8, 32, INK, A.FONT_BODY); }
          } else {
            const s = String(v), fs = p.r * (s.length >= 3 ? 0.66 : s.length === 2 ? 0.84 : 1);
            text(g, s, 3, 7, fs, 'rgba(34,24,70,.45)'); text(g, s, 0, 3, fs, '#FFFBF0');
          }
          g.restore();
        };
        node.onTap = () => tap(o);
        node.to({ sx: 1, sy: 1 }, { dur: 0.38, ease: 'back', delay: 0.12 + i * 0.09 });
        ctx.after(120 + i * 90, () => K.sfx.tone(520 + i * 90, 0.07, { type: 'triangle', vol: 0.08 }));
        return o;
      });
    }

    /* ---- rounds ---- */
    function ask() {
      let q, guard = 0;
      const kind = forced; forced = null;
      do { q = generate(L, skill, kind || (asked === 0 ? { 1: 'count', 2: 'add', 3: 'add' }[L] : null), lastAnswer); } while (guard++ < 8 && (recent.indexOf(q.key) >= 0 || (!kind && asked > 0 && L > 1 && guard < 3 && q.kind === lastKind)));
      recent.push(q.key); if (recent.length > 4) recent.shift();
      asked++; lastKind = q.kind; lastAnswer = q.answer;
      Q = q; busy = false; card.pop = 1; K.sfx.pop();
      showOptions(q);
      ctx.prompt(q.ask);
    }
    function tap(o) {
      const q = Q; if (!q || busy || q.done || o.out) return;
      if (o.v === q.answer) return right(o);
      q.misses++; o.out = true; K.sfx.whoops();
      const n = o.node; n.to({ rot: 0.2 }, { dur: 0.07 }).then(() => n.to({ rot: -0.2 }, { dur: 0.1 })).then(() => n.to({ rot: 0 }, { dur: 0.4, ease: 'elastic' }));
      n.to({ alpha: 0.4 }, { dur: 0.3 });
      const left = options.filter((x) => !x.out);
      if (q.misses >= 2 || left.length === 1) { const good = options.find((x) => x.v === q.answer); good.glow = true; }
      if (!q.hintOn) { q.hintOn = true; hintTalk(q); } else if (q.misses >= 2) ctx.say(SAY.glow);
    }
    async function hintTalk(q) {
      ctx.say(q.hint);
      if (q.kind !== 'count') return;
      q.spoken = true;                                  // the stars are counted out loud, one by one
      await ctx.wait(1100);
      for (let i = 1; i <= q.n; i++) {
        if (Q !== q || q.done) return;
        q.counted = i; K.sfx.step(i - 1); ctx.say(numLine(i));
        await ctx.wait(720);
      }
    }
    async function right(o) {
      const q = Q; q.done = true; busy = true; q.solvedT = st.t; q.hintOn = false;
      if (q.countTo) q.counted = q.countTo;
      K.sfx.ding(); ctx.fx.burst(o.node.x, o.node.y, { n: 16 }); o.glow = false;
      for (const x of options) if (x !== o) x.node.to({ alpha: 0, sx: 0.6, sy: 0.6 }, { dur: 0.3 });
      o.node.to({ sx: 1.18, sy: 1.18 }, { dur: 0.3, ease: 'back' });
      if (L <= 2 && q.answer <= 10 && q.answer >= 1) ctx.say(numLine(q.answer));
      if (q.misses === 0) skill = Math.min(14, skill + 0.5); else if (q.misses >= 2) skill = Math.max(0, skill - 1);
      store.skill[L] = skill; K.save();
      await ctx.wait(420);
      // a star of fuel flies up to the rocket, and off it goes
      const fl = st.add({ z: 30, x: o.node.x, y: o.node.y, sx: 0.4, sy: 0.4 }); fl.draw = (g) => { g.rotate(st.t * 6); drawStar(g, 30, 'ministar'); };
      fl.to({ x: ship.x - RL * 0.3, y: ship.y, sx: 1, sy: 1 }, { dur: 0.45, ease: 'inOut' }).then(() => { fl.remove(); ctx.fx.burst(ship.x - RL * 0.3, ship.y, { n: 6, color: '#FFF1BF' }); });
      await ctx.wait(450);
      fuel++; ship.boost = 1.2; K.sfx.whoosh(); K.sfx.tone(220, 0.5, { to: 520, type: 'sawtooth', vol: 0.05 });
      ship.to({ tilt: -0.14 }, { dur: 0.2 }).then(() => ship.to({ tilt: 0 }, { dur: 0.5, ease: 'out' }));
      await ship.to({ x: stopX(fuel) }, { dur: 0.75, ease: 'inOut' });
      const star = way.find((s) => s.i === fuel);
      if (star) { K.sfx.sparkle(); ctx.fx.burst(star.x, star.y, { n: 10, color: '#FFE9A0' }); star.to({ sx: 0, sy: 0 }, { dur: 0.2 }); }
      await ctx.wait(fuel >= LEG ? 150 : 550);
      clearOptions();
      if (fuel >= LEG) await land_();
      else await ctx.wait(260);
      Q = null; ask();
    }
    async function land_() {
      legs++;
      destP.to({ sx: 1.25, sy: 0.82 }, { dur: 0.12, ease: 'out' }).then(() => destP.to({ sx: 1, sy: 1 }, { dur: 0.6, ease: 'elastic' }));
      ctx.fx.burst(destP.x, destP.y, { n: 22 }); K.sfx.drum('tom'); ctx.say(SAY.planet);
      Q = null;
      await ctx.wait(1300);
      await ctx.celebrate({ ms: 3200 });
      // the planet we reached becomes home, and a new one rolls into view
      const old = homeP; old.to({ x: -PR * 3 }, { dur: 0.9, ease: 'inOut' }).then(() => old.remove());
      homeP = destP; homeP.to({ x: PX0 }, { dur: 0.9, ease: 'inOut' });
      ship.to({ x: stopX(0) }, { dur: 0.9, ease: 'inOut' });
      destP = mkPlanet(looks[(legs - 1) % looks.length], W + PR * 3); destP.to({ x: PX1 }, { dur: 0.9, ease: 'inOut' });
      fuel = 0; K.sfx.whoosh(); ctx.say(SAY.go);
      await ctx.wait(950);
      layStars();
      await ctx.wait(500);
    }

    K._rocket = {                                         // for browser tests
      get q() { return Q; }, get busy() { return busy; }, get fuel() { return fuel; }, get legs() { return legs; },
      get skill() { return skill; }, set skill(v) { skill = v; }, get options() { return options; },
      pick(v) { const o = options.find((x) => x.v === v); if (o) tap(o); return !!o; },
      force(kind) { forced = kind; }, generate, lines,
    };
    ctx.onExit(() => { K._rocket = null; });
    layStars();
    ctx.after(700, ask);
  }

  function icon(g, w) {
    const im = PIC['bg-space'];
    if (im) { const k = Math.max(w / im.width, w / im.height) * 1.3; g.drawImage(im, (w - im.width * k) * 0.3, (w - im.height * k) / 2, im.width * k, im.height * k); }
    else { const gr = g.createLinearGradient(0, 0, w * 0.4, w); gr.addColorStop(0, '#3A2E8C'); gr.addColorStop(1, '#1D1A5E'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }
    const rr = A.rng(5); g.fillStyle = '#FFF4CF';
    for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(rr() * w, rr() * w, w * (0.006 + rr() * 0.008), 0, 7); g.fill(); }
    // a planet with a number on it, and the rocket heading for it
    const px = w * 0.76, py = w * 0.27, pr = w * 0.17;
    const halo = g.createRadialGradient(px, py, pr * 0.8, px, py, pr * 1.5); halo.addColorStop(0, 'rgba(47,143,138,.5)'); halo.addColorStop(1, 'rgba(47,143,138,0)'); g.fillStyle = halo; g.beginPath(); g.arc(px, py, pr * 1.5, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(px, py, pr, 0, 7); g.fillStyle = '#2F8F8A'; g.fill(); g.clip();
    g.fillStyle = '#3FA39D'; g.fillRect(px - pr, py - pr * 0.5, pr * 2, pr * 0.3); g.fillStyle = '#267D79'; g.fillRect(px - pr, py + pr * 0.35, pr * 2, pr * 0.3); g.restore();
    g.font = `700 ${pr * 1.1}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFFBF0'; g.fillText('5', px, py + pr * 0.06);
    g.save(); g.translate(w * 0.4, w * 0.6); g.rotate(0.62);
    const fh = w * 0.54;
    for (const [col, wd, len] of [['#F2B33D', 0.13, 0.36], ['#E8664A', 0.085, 0.25], ['#FFF1BF', 0.04, 0.14]]) { g.beginPath(); g.moveTo(-fh * wd, fh * 0.44); g.quadraticCurveTo(0, fh * (0.44 + len * 2), fh * wd, fh * 0.44); g.closePath(); g.fillStyle = col; g.fill(); }
    drawRocket(g, fh); g.restore();
  }

  K.game({ id: 'rocket', title: 'Number Rocket', voice: 'rocket', group: 'arcade', age: 5, order: 27, icon, start, lines, resize: () => K.go('rocket') });
})();
