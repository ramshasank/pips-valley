/* Pattern Train - Toot pulls a row of wagons that carry a pattern. One or two wagons are empty.
   The child picks what belongs in the gap from the cards below: tap a card and it flies to the glowing
   wagon, or drag it onto a wagon. A wrong try wobbles back and the pattern is read out loud; after two
   misses the right card glows. When every gap is filled the train toots, chuffs off and a new one rolls in.

   Level 1: AB patterns with big colours, fruit and shapes (red, blue, red, blue, ?).
   Level 2: AAB, ABB and ABC patterns with shapes, sizes and pictures; the gap can be in the middle.
   Level 3: number and growing patterns (2, 4, 6, ?; 1, 2, 4, 8, ?; 20, 17, 14, ?), shapes that gain a side,
            arrows that turn, two gaps, and a short spoken rule after each right answer.
   Inside a level the trains get harder after clean answers and ease off after misses. Cannot be failed. */
(function () {
  'use strict';
  const A = K.art, Kt = A.kitchen;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = (n) => K.numWord(n);
  const TAU = Math.PI * 2;

  /* ---------------- what the wagons can carry ---------------- */
  const COLS = { red: '#D9423E', blue: '#4F8FD0', yellow: '#F5D33F', green: '#5E9E57', orange: '#F28C28', purple: '#7B5AA6' };
  const ALIKE = ['red orange', 'orange yellow', 'blue purple', 'lemon banana', 'apple strawberry', 'orange carrot', 'orange lemon'].reduce((a, p) => a.concat(p, p.split(' ').reverse().join(' ')), []);   // too alike to share a pattern
  const FRUITS = ['apple', 'banana', 'pear', 'lemon', 'strawberry', 'orange', 'carrot'];
  const SHAPES = { circle: '#E8664A', square: '#5B8FC7', triangle: '#F2B33D', star: '#6E4E7E', heart: '#E8798F' };
  const DIRS = ['up', 'up and right', 'right', 'down and right', 'down', 'down and left', 'left', 'up and left'];
  const UPS = [1, 2, 3, 4, 5, 10], DOWNS = [1, 2, 3, 4, 5, 10];
  const col = (name) => ({ k: 'col', name, key: 'c-' + name, label: name, word: cap(name) });
  const pic = (name) => ({ k: 'pic', name, key: 'p-' + name, label: name, word: cap(name) });
  const shp = (shape, big, bySize) => ({ k: 'shp', shape, big, key: 's-' + shape + (big ? 'B' : 'S'), label: (big ? 'big ' : 'small ') + shape, word: bySize ? (big ? 'Big' : 'Small') : cap(shape) });
  const numI = (n) => ({ k: 'num', n, key: 'n-' + n, label: 'number ' + n });
  const poly = (n) => ({ k: 'poly', n, key: 'g-' + n, label: 'shape with ' + n + ' sides' });
  const arrow = (d) => { d = ((d % 8) + 8) % 8; return { k: 'arrow', d, key: 'a-' + d, label: 'arrow pointing ' + DIRS[d] }; };
  const cnt = (name, n) => ({ k: 'cnt', name, n, key: 'k-' + name + n, label: n + ' ' + name });

  /* ---------------- spoken lines ---------------- */
  const T = {
    look: 'Look at the pattern.',
    next: 'What comes next?',
    missing: 'What is missing?',
    two: 'Two wagons are empty.',
    first: 'Fill the glowing one first.',
    glow: 'Try the glowing one.',
    upDown: 'Do the numbers go up or down?',
    jump: 'Look at the jump from one number to the next.',
    sides: 'Count the sides.',
    turn: 'Watch how the arrow turns.',
    fruit: 'Count the fruit in each wagon.',
    up: (n) => `It goes up by ${num(n)} each time.`,
    down: (n) => `It goes down by ${num(n)} each time.`,
    doubles: 'It doubles each time.',
    bigger: 'The jump gets one bigger each time.',
    side: 'It gains one side each time.',
    sideLess: 'It loses one side each time.',
    quarter: 'It makes a quarter turn each time.',
    little: 'It turns a little each time.',
    repeats: 'It repeats again and again.',
  };
  function lines() {
    const out = [];
    for (const v of Object.values(T)) if (typeof v === 'string') out.push(v);
    for (const n of UPS) out.push(T.up(n));
    for (const n of DOWNS) out.push(T.down(n));
    for (const n of Object.keys(COLS)) out.push(cap(n) + '.');
    for (const n of FRUITS) out.push(cap(n) + '.');
    for (const n of Object.keys(SHAPES)) out.push(cap(n) + '.');
    out.push('Big.', 'Small.');
    return [...new Set(out)];
  }

  /* ---------------- making a pattern ---------------- */
  const uniq = (items) => { const seen = {}; return items.filter((it) => (seen[it.key] ? false : (seen[it.key] = 1))); };
  function pool(kind) {
    if (kind === 'col') return Object.keys(COLS).map(col);
    if (kind === 'pic') return FRUITS.map(pic);
    return Object.keys(SHAPES).map((s) => shp(s, true));
  }
  /** A repeating pattern: unit is the part that repeats, n wagons, gaps are wagon numbers (never in the first unit). */
  function rep(unit, extra, n, gaps, nCh) {
    const seq = []; for (let i = 0; i < n; i++) seq.push(unit[i % unit.length]);
    const own = uniq(unit), ch = own.concat(K.shuffle(extra)).slice(0, Math.max(nCh, own.length));
    return { type: 'rep', seq, gaps, choices: K.shuffle(ch), rule: T.repeats };
  }
  function repKind(kind, shape, n, gaps, nCh) {
    const distinct = Math.max(...shape) + 1;
    if (kind === 'size') {
      const names = K.sample(Object.keys(SHAPES), 2), flip = Math.random() < 0.5;
      const two = [shp(names[0], !flip, true), shp(names[0], flip, true)];
      return rep(shape.map((i) => two[i]), [shp(names[1], true, true), shp(names[1], false, true)], n, gaps, nCh);
    }
    let p, items, guard = 0;
    do { p = K.shuffle(pool(kind)); items = p.slice(0, distinct); } while (guard++ < 30 && items.some((a) => items.some((b) => ALIKE.includes(a.name + ' ' + b.name))));
    return rep(shape.map((i) => items[i]), p.slice(distinct), n, gaps, nCh);
  }
  const midGap = (period, n) => K.randInt(period, n - 2);
  const twoGaps = (from, n) => K.sample(Array.from({ length: n - from }, (_, i) => i + from), 2).sort((x, y) => x - y);
  /** A number pattern: vals are the numbers on the wagons. */
  function nums(vals, gaps, rule, hint) {
    const answers = gaps.map((i) => vals[i]), cand = [];
    for (const i of gaps) { const a = vals[i], d = Math.abs(vals[i] - vals[i - 1]) || 1; cand.push(a + 1, a - 1, a + d, a - d, a + 2, a - 2, a + 10, a + d + 1); }
    const wrong = K.shuffle([...new Set(cand)].filter((v) => v > 0 && !answers.includes(v)));
    const ch = [...new Set(answers)].concat(wrong).slice(0, 4);
    return { type: 'num', seq: vals.map(numI), gaps, choices: K.shuffle(ch.map(numI)), rule, hint: hint || (T.upDown + ' ' + T.jump) };
  }
  function arith(step, n, gaps) {
    const up = step > 0, s = Math.abs(step);
    const start = up ? (s === 10 ? K.randInt(1, 40) : s === 5 ? K.pick([5, 10, 15, 20, 35]) : K.randInt(1, 12)) : s * (n - 1) + (s === 10 ? K.pick([10, 20, 5, 8]) : K.randInt(1, 9));
    return nums(Array.from({ length: n }, (_, i) => start + i * step), gaps, up ? T.up(s) : T.down(s));
  }
  /** Choices close to the answer a: make(a) and three neighbours between lo and hi. */
  function near(make, a, lo, hi) { const out = [make(a)]; for (const v of K.shuffle([a - 1, a + 1, a - 2, a + 2]).concat([a + 3, a - 3])) if (v >= lo && v <= hi && out.length < 4) out.push(make(v)); return K.shuffle(out); }
  const run = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

  function makeRound(L, skill, maxN, first) {
    const r = Math.random();
    if (L === 1) {
      const kind = first || skill === 0 ? 'col' : skill === 1 ? K.pick(['col', 'pic']) : K.pick(['col', 'pic', 'shp']);
      const n = skill < 2 ? 5 : 6;
      return repKind(kind, [0, 1], n, [n - 1], 3);
    }
    if (L === 2) {
      const t = first ? 0 : K.randInt(Math.max(0, skill - 2), Math.min(skill, 3));
      const kind = K.pick(['pic', 'shp', 'col']);
      if (t === 0) return repKind(K.pick(['pic', 'col']), [0, 1, 2], 6, [5], 4);
      if (t === 1) return repKind(K.pick(['shp', 'pic']), K.pick([[0, 0, 1], [0, 1, 1]]), 6, [5], 4);
      if (t === 2) return repKind(kind, K.pick([[0, 0, 1], [0, 1, 1], [0, 1, 2]]), 6, [midGap(3, 6)], 4);
      if (r < 0.5) { const sh = K.pick([[0, 1], [0, 0, 1], [0, 1, 1]]); return repKind('size', sh, 6, [K.pick([5, midGap(sh.length, 6)])], 4); }
      return repKind(kind, [0, 1, 2], maxN, [midGap(3, maxN)], 4);
    }
    const t = first ? 0 : K.randInt(Math.max(0, skill - 2), Math.min(skill, 5));
    const n = K.pick([4, 5]);
    if (t === 0) return arith(K.pick([1, 2, 2, 3, 5, 10]), n, [n - 1]);
    if (t === 1) return arith(-K.pick([1, 2, 3, 5, 10]), n, [n - 1]);
    if (t === 2) {
      if (r < 0.4) {   // a shape that gains (or loses) a side
        const up = Math.random() < 0.65, s0 = up ? K.randInt(3, 4) : K.randInt(7, 8), g = K.pick([3, 3, 2]), v = (i) => s0 + (up ? i : -i);
        return { type: 'poly', seq: run(4, (i) => poly(v(i))), gaps: [g], choices: near(poly, v(g), 3, 9), rule: up ? T.side : T.sideLess, hint: T.sides };
      }
      if (r < 0.75) {  // an arrow that makes quarter turns
        const d0 = K.randInt(0, 3) * 2, dir = K.pick([2, -2]);
        return { type: 'arrow', seq: run(n, (i) => arrow(d0 + i * dir)), gaps: [n - 1], choices: K.shuffle([0, 2, 4, 6].map(arrow)), rule: T.quarter, hint: T.turn };
      }
      const up = r < 0.9, name = K.pick(FRUITS.slice(0, 6)), s0 = up ? K.randInt(1, 2) : K.randInt(5, 6), v = (i) => s0 + (up ? i : -i);
      return { type: 'cnt', seq: run(4, (i) => cnt(name, v(i))), gaps: [3], choices: near((x) => cnt(name, x), v(3), 1, 6), rule: up ? T.up(1) : T.down(1), hint: T.fruit };
    }
    if (t === 3) {
      if (r < 0.4) { const s = K.pick([1, 2, 3, 5]); return nums(run(5, (i) => s * Math.pow(2, i)), [K.pick([4, 4, 3])], T.doubles, T.jump); }
      if (r < 0.75) return arith(K.pick([4, 3, 5, -4, -2, -3]), 5, [K.randInt(2, 3)]);
      const d0 = K.randInt(0, 7), dir = K.pick([1, -1]), a = d0 + 4 * dir;   // an arrow that turns a little each time
      return { type: 'arrow', seq: run(5, (i) => arrow(d0 + i * dir)), gaps: [4], choices: K.shuffle([a, a + 1, a - 1, a + 4].map(arrow)), rule: T.little, hint: T.turn };
    }
    if (t === 4) return arith(K.pick([2, 3, 4, 5, 10, -2, -3, -5, -10]), 6, twoGaps(2, 6));
    if (r < 0.4) { let v = K.randInt(1, 5); const d0 = K.pick([1, 2]); return nums(run(5, (i) => (v += i ? d0 + i - 1 : 0)), [4], T.bigger, T.jump); }
    if (r < 0.7) { const sh = K.pick([[0, 1, 2], [0, 0, 1], [0, 1, 1]]); return repKind(K.pick(['shp', 'pic']), sh, maxN, twoGaps(3, maxN), 4); }
    const s = K.pick([1, 2, 3]); return nums(run(5, (i) => s * Math.pow(2, i)), [2, 4], T.doubles, T.jump);
  }

  /* ---------------- pictures and paper pieces ---------------- */
  const PIC = {};
  for (const [k, src] of [['toot', 'toot/toot'], ['happy', 'toot/toot-happy']]) { const im = new Image(); im.onload = () => { PIC[k] = im; }; im.src = 'img/' + src + '.webp'; }
  const put = (g, sp, k) => { k = k || 1; g.drawImage(sp.canvas, -sp.ox * k, -sp.oy * k, sp.w * k, sp.h * k); };
  const P = 132, WR = 20, EW = 196, ITEM_Y = -124;   // wagon pitch, wheel radius, engine width, where a load sits

  function fruitSprite(name) {
    if (Kt && Kt.draw && Kt.draw[name]) return Kt.sprite(name);
    return A.sprite('pt-fr-' + name, [-62, -62, 124, 124], (g, s) => { g.beginPath(); A.blob(g, 0, 0, 46, 44, 0.04, 3, 12); A.paper(g, s, '#E8664A', { box: { x: -46, y: -46, w: 92, h: 92 } }); });
  }
  function shapePath(g, shape, r) {
    if (shape === 'circle') A.blob(g, 0, 0, r, r, 0.02, 2, 12);
    else if (shape === 'square') A.rect(g, -r * 0.88, -r * 0.88, r * 1.76, r * 1.76, r * 0.16, 3, 1);
    else if (shape === 'triangle') A.cut(g, [[0, -r], [r, r * 0.8], [-r, r * 0.8]], r * 0.14, 1, 4);
    else if (shape === 'star') { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, q = i % 2 ? r * 0.5 : r * 1.06; pts.push([Math.cos(a) * q, Math.sin(a) * q + r * 0.05]); } A.cut(g, pts, r * 0.08, 0.4, 6); }
    else { g.moveTo(0, r * 0.9); g.bezierCurveTo(-r * 1.3, r * 0.05, -r * 0.8, -r * 1.0, 0, -r * 0.42); g.bezierCurveTo(r * 0.8, -r * 1.0, r * 1.3, r * 0.05, 0, r * 0.9); g.closePath(); }
  }
  const SPOTS = [null, [[0, 0]], [[-26, 0], [26, 0]], [[0, -25], [-27, 23], [27, 23]], [[-26, -26], [26, -26], [-26, 26], [26, 26]], [[-31, -31], [31, -31], [0, 0], [-31, 31], [31, 31]], [[-35, -24], [0, -24], [35, -24], [-35, 24], [0, 24], [35, 24]]];
  const SPOT_K = [0, 0.62, 0.44, 0.42, 0.42, 0.37, 0.33];
  function paintItem(g, s, it) {
    const bx = { x: -52, y: -52, w: 104, h: 104 };
    if (it.k === 'col') {
      g.beginPath(); A.blob(g, 0, 0, 50, 49, 0.03, 5, 12); A.paper(g, s, COLS[it.name], { box: bx, light: 0.1 });
      g.beginPath(); g.ellipse(-20, -20, 9, 15, 0.7, 0, 7); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill();
    } else if (it.k === 'shp') {
      const r = it.big ? 50 : 26; g.beginPath(); shapePath(g, it.shape, r); A.paper(g, s, SHAPES[it.shape], { box: { x: -r, y: -r, w: r * 2, h: r * 2 }, light: 0.09 });
    } else if (it.k === 'poly') {
      const pts = [], a0 = -Math.PI / 2 + (it.n % 2 ? 0 : Math.PI / it.n);
      for (let i = 0; i < it.n; i++) { const a = a0 + (i / it.n) * TAU; pts.push([Math.cos(a) * 52, Math.sin(a) * 52 + (it.n === 3 ? 10 : 0)]); }
      g.beginPath(); A.cut(g, pts, 5, 0.5, it.n); A.paper(g, s, A.C.teal, { box: bx, light: 0.1 });
    } else if (it.k === 'num') {
      g.beginPath(); A.rect(g, -50, -50, 100, 100, 18, (it.n % 7) + 1, 1); A.paper(g, s, '#FBF6EC', { box: bx, light: 0.04 });
      const t = String(it.n); g.font = `700 ${t.length === 1 ? 78 : t.length === 2 ? 60 : 42}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = A.C.plum; g.fillText(t, 0, 5);
    } else if (it.k === 'arrow') {
      g.beginPath(); g.arc(0, 0, 51, 0, 7); A.paper(g, s, '#FBF6EC', { box: bx, light: 0.04 });
      g.save(); g.rotate(it.d * Math.PI / 4); g.beginPath(); A.cut(g, [[0, -42], [31, -5], [12, -5], [12, 38], [-12, 38], [-12, -5], [-31, -5]], 5, 0.4, 3); A.paper(g, s, A.C.tomato, { shadow: 0.4, light: 0 }); g.restore();
    } else if (it.k === 'cnt') {
      for (const [x, y] of SPOTS[it.n]) { g.save(); g.translate(x, y); put(g, fruitSprite(it.name), SPOT_K[it.n]); g.restore(); }
    }
  }
  function itemSprite(it) {
    if (it.k === 'pic') return fruitSprite(it.name);
    return A.sprite('pt-i-' + it.key + (it.k === 'cnt' && Kt && Kt.pics ? 'P' : ''), [-66, -66, 132, 132], (g, s) => paintItem(g, s, it));
  }
  const wagonSprite = (c) => A.sprite('pt-wagon' + c, [-66, -74, 156, 56], (g, s) => {
    A.line(g, '#3E3A52', 7, (h) => { h.moveTo(52, -36); h.lineTo(P - 52, -36); });
    g.beginPath(); A.rect(g, -58, -62, 116, 40, 9, 3, 0.8); A.paper(g, s, c, { box: { x: -58, y: -62, w: 116, h: 40 }, light: 0.09 });
    A.line(g, 'rgba(255,255,255,.28)', 3, (h) => { h.moveTo(-42, -40); h.lineTo(42, -40); });
    g.beginPath(); A.rect(g, -63, -70, 126, 14, 6, 5, 0.5); A.paper(g, s, A.shade(c, -0.1), { shadow: 0.5 });
  });
  const wheelSprite = () => A.sprite('pt-wheel', [-22, -22, 44, 44], (g, s) => {
    g.beginPath(); g.arc(0, 0, WR, 0, 7); A.paper(g, s, '#3E3A52', { shadow: 0.5, light: 0 });
    g.beginPath(); g.arc(0, 0, WR * 0.62, 0, 7); g.fillStyle = '#F3DDB8'; g.fill();
    A.line(g, '#3E3A52', 3.5, (h) => { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; h.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); h.lineTo(-Math.cos(a) * 12, -Math.sin(a) * 12); } });
    g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.fillStyle = '#E8664A'; g.fill();
  });
  /** The engine drawn from paper, used until its picture has loaded. Origin: middle of its base. */
  const engineSprite = () => A.sprite('pt-engine', [-108, -132, 216, 136], (g, s) => {
    const red = '#DC4A3C';
    g.beginPath(); A.cut(g, [[32, -104], [64, -104], [60, -60], [36, -60]], 4, 0.5, 2); A.paper(g, s, '#4A3A52', { shadow: 0.5 });
    g.beginPath(); A.rect(g, 24, -122, 48, 20, 9, 3, 0.4); A.paper(g, s, '#7B5AA6', { shadow: 0.5 });
    g.beginPath(); g.arc(-8, -66, 18, 0, 7); A.paper(g, s, '#F2B33D', { shadow: 0.4 });
    g.beginPath(); A.cut(g, [[-30, -68], [98, -68], [98, 0], [-30, 0]], [14, 40, 4, 4], 0.6, 5); A.paper(g, s, red, { box: { x: -30, y: -68, w: 128, h: 68 }, light: 0.08 });
    g.beginPath(); A.rect(g, -98, -112, 72, 112, 6, 4, 0.8); A.paper(g, s, A.shade(red, -0.04), { box: { x: -98, y: -112, w: 72, h: 112 }, light: 0.08 });
    g.beginPath(); A.rect(g, -104, -128, 86, 20, 9, 6, 0.4); A.paper(g, s, '#5A4256', { shadow: 0.5 });
    g.beginPath(); A.rect(g, -86, -98, 46, 38, 8, 2, 0.4); g.fillStyle = '#CFE6E8'; g.fill();
    A.line(g, 'rgba(255,255,255,.8)', 5, (h) => { h.moveTo(-58, -92); h.lineTo(-72, -68); });
    g.beginPath(); A.rect(g, -4, -68, 11, 68, 3, 2, 0.3); g.fillStyle = '#F2B33D'; g.fill();
    g.beginPath(); A.rect(g, -104, -10, 204, 13, 6, 8, 0.4); A.paper(g, s, '#5A4256', { shadow: 0.4 });
    for (const x of [36, 70]) { g.beginPath(); g.arc(x, -40, 8, 0, 7); g.fillStyle = '#3A2A2A'; g.fill(); g.beginPath(); g.arc(x + 2.5, -43, 2.8, 0, 7); g.fillStyle = '#fff'; g.fill(); }
    for (const x of [24, 82]) { g.beginPath(); g.ellipse(x, -24, 8, 5.5, 0, 0, 7); g.fillStyle = 'rgba(255,170,160,.75)'; g.fill(); }
    A.line(g, '#3A2A2A', 3.5, (h) => h.arc(53, -30, 10, 0.35, Math.PI - 0.35));
  });
  const cloudSprite = () => A.sprite('pt-cloud', [-110, -56, 220, 100], (g, s) => {
    g.beginPath(); for (const [x, y, r] of [[-56, 4, 34], [-14, -14, 42], [38, -2, 36], [74, 12, 24], [0, 14, 30]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } A.paper(g, s, '#FBF8F1', { shadow: 0.35, light: 0 });
  });
  const cardSprite = () => A.sprite('pt-card', [-75, -75, 150, 150], (g, s) => { g.beginPath(); A.rect(g, -72, -72, 144, 144, 28, 4, 1); A.paper(g, s, '#FFFBF2', { box: { x: -72, y: -72, w: 144, h: 144 }, light: 0.04, shadow: 0.9 }); });

  function paintBg(g, s, W, H, ty) {
    const sky = g.createLinearGradient(0, 0, 0, ty); sky.addColorStop(0, A.C.skyTop); sky.addColorStop(1, A.C.horizon); g.fillStyle = sky; g.fillRect(-20, -20, W + 40, H + 40);
    const sx = W * 0.72, sy = ty - 330;
    const gl = g.createRadialGradient(sx, sy, 20, sx, sy, 170); gl.addColorStop(0, 'rgba(255,236,170,.75)'); gl.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = gl; g.fillRect(sx - 180, sy - 180, 360, 360);
    g.beginPath(); A.blob(g, sx, sy, 56, 55, 0.02, 3, 12); A.paper(g, s, '#F6C453', { shadow: 0.3, box: { x: sx - 56, y: sy - 56, w: 112, h: 112 }, light: 0.08 });
    const hills = (c, y0, amp, seed) => {
      const r = A.rng(seed); g.beginPath(); g.moveTo(-40, H + 40); g.lineTo(-40, y0); let x = -40;
      while (x < W + 40) { const w = 220 + r() * 240, h = amp * (0.5 + r() * 0.5); g.quadraticCurveTo(x + w / 2, y0 - h * 2, x + w, y0 + (r() - 0.5) * amp * 0.2); x += w; }
      g.lineTo(W + 40, H + 40); g.closePath(); A.paper(g, s, c, { shadow: 0.5, box: { x: 0, y: y0 - amp, w: 0, h: amp * 4 }, light: 0.06 });
    };
    hills(A.C.far, ty - 150, 80, 11);
    hills(A.C.mid, ty - 86, 54, 23);
    const r = A.rng(5);
    for (let x = 60 + r() * 80; x < W; x += 170 + r() * 190) {   // little trees along the hill
      const y = ty - 70 + r() * 20, k = 0.8 + r() * 0.5;
      g.beginPath(); A.rect(g, x - 5 * k, y - 46 * k, 10 * k, 50 * k, 3, 2, 0.4); A.paper(g, s, A.C.bark, { shadow: 0.3 });
      g.beginPath(); A.blob(g, x, y - 70 * k, 34 * k, 40 * k, 0.07, Math.round(x), 10); A.paper(g, s, r() < 0.5 ? A.C.leafDark : A.C.leaf, { shadow: 0.5, box: { x: x - 34 * k, y: y - 110 * k, w: 68 * k, h: 80 * k }, light: 0.08 });
    }
    g.beginPath(); g.moveTo(-40, H + 40); g.lineTo(-40, ty - 30); for (let x = -40; x <= W + 40; x += 80) g.lineTo(x, ty - 30 + Math.sin(x * 0.011) * 6); g.lineTo(W + 60, ty - 30); g.lineTo(W + 60, H + 40); g.closePath();
    A.paper(g, s, A.C.meadow, { shadow: 0.5, box: { x: 0, y: ty - 30, w: 0, h: H - ty + 30 }, light: 0.07 });
    // the track: ballast, sleepers and a rail for the wheels
    g.beginPath(); A.rect(g, -30, ty - 2, W + 60, 34, 10, 3, 1); A.paper(g, s, '#DCCBA6', { shadow: 0.6 });
    for (let x = -10; x < W + 30; x += 50) { g.beginPath(); A.rect(g, x, ty + 7, 24, 19, 4, Math.round(x) + 9, 0.6); g.fillStyle = A.C.bark; g.fill(); }
    g.beginPath(); g.rect(-30, ty, W + 60, 8); g.fillStyle = '#5B566C'; g.fill();
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-30, ty, W + 60, 2.5);
    // grass tufts and flowers in the meadow
    const cols = ['#FBF8F1', '#F4B49A', '#F2B33D', '#E8798F'];
    for (let i = 0; i < Math.round(W * (H - ty) / 16000); i++) {
      const x = r() * W, y = ty + 60 + r() * (H - ty - 80);
      A.line(g, A.C.leafDark, 3, (h) => { h.moveTo(x - 7, y); h.quadraticCurveTo(x - 6, y - 12, x - 10, y - 18); h.moveTo(x, y); h.lineTo(x, y - 22); h.moveTo(x + 7, y); h.quadraticCurveTo(x + 6, y - 12, x + 11, y - 17); });
      if (r() < 0.55) { g.beginPath(); g.arc(x, y - 25, 7, 0, 7); g.fillStyle = cols[Math.floor(r() * 4)]; g.fill(); g.beginPath(); g.arc(x, y - 25, 2.6, 0, 7); g.fillStyle = '#F2B33D'; g.fill(); }
    }
  }

  /* ---------------- the thumbnail ---------------- */
  function icon(g, w) {
    const u = w / 300; g.save(); g.scale(u, u);
    const sky = g.createLinearGradient(0, 0, 0, 220); sky.addColorStop(0, '#A9D3DD'); sky.addColorStop(1, '#F3E9D6'); g.fillStyle = sky; g.fillRect(0, 0, 300, 300);
    g.fillStyle = '#F6C453'; g.beginPath(); g.arc(232, 62, 30, 0, 7); g.fill();
    g.fillStyle = '#A9C9B4'; g.beginPath(); g.ellipse(70, 232, 190, 86, 0, 0, 7); g.fill();
    g.fillStyle = '#7FB08A'; g.beginPath(); g.ellipse(250, 240, 170, 60, 0, 0, 7); g.fill();
    g.fillStyle = '#74AC73'; g.fillRect(0, 214, 300, 86);
    g.fillStyle = '#DCCBA6'; g.fillRect(0, 216, 300, 22);
    g.fillStyle = '#8A5A3C'; for (let x = 6; x < 300; x += 30) g.fillRect(x, 224, 14, 12);
    g.fillStyle = '#5B566C'; g.fillRect(0, 216, 300, 6);
    const wheel = (x, r) => { g.fillStyle = '#3E3A52'; g.beginPath(); g.arc(x, 216 - r, r, 0, 7); g.fill(); g.fillStyle = '#F3DDB8'; g.beginPath(); g.arc(x, 216 - r, r * 0.55, 0, 7); g.fill(); };
    const wagon = (x, c) => {
      g.fillStyle = '#2F8F8A'; g.beginPath(); g.roundRect ? g.roundRect(x - 36, 178, 72, 26, 6) : g.rect(x - 36, 178, 72, 26); g.fill();
      g.fillStyle = '#277B77'; g.fillRect(x - 39, 174, 78, 8); wheel(x - 20, 11); wheel(x + 20, 11);
      if (c) { g.fillStyle = c; g.beginPath(); g.arc(x, 142, 31, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(x - 12, 130, 6, 10, 0.7, 0, 7); g.fill(); }
      else { g.setLineDash([9, 7]); g.lineWidth = 5; g.strokeStyle = '#FBF8F1'; g.beginPath(); g.arc(x, 142, 28, 0, 7); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill(); }
    };
    g.translate(4, 216); g.scale(0.8, 0.8); g.translate(0, -216);
    wagon(42, '#DE4E46'); wagon(124, '#5B8FC7'); wagon(206, null);
    g.fillStyle = '#3E3A52'; g.fillRect(74, 190, 20, 5); g.fillRect(156, 190, 20, 5); g.fillRect(238, 190, 14, 5);
    if (PIC.toot) g.drawImage(PIC.toot, 248, 128, 112, 72);
    else {
      g.fillStyle = '#DC4A3C'; g.fillRect(250, 126, 44, 76); g.beginPath(); g.moveTo(290, 202); g.lineTo(290, 158); g.lineTo(340, 158); g.quadraticCurveTo(360, 158, 360, 180); g.lineTo(360, 202); g.fill();
      g.fillStyle = '#5A4256'; g.fillRect(244, 116, 56, 13); g.fillRect(322, 132, 20, 28); g.fillStyle = '#CFE6E8'; g.fillRect(258, 138, 26, 24);
      g.fillStyle = '#3A2A2A'; g.beginPath(); g.arc(326, 176, 4.5, 0, 7); g.arc(346, 176, 4.5, 0, 7); g.fill();
    }
    wheel(268, 13); wheel(304, 13); wheel(340, 13);
    g.restore();
  }

  /* ---------------- the game ---------------- */
  let mem = { level: 0 };   // what carries on over a resize: how hard, how many trains, the train on the track
  const WCOLS = ['#2F8F8A', '#5B8FC7', '#6E4E7E', '#D9963A', '#5E9A6B'];

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, SET = 4;
    if (mem.level !== L) mem = { level: L, skill: 0, won: 0, round: null, lastKey: '', first: true, wcol: 0 };
    const maxN = land ? 7 : 6, big = land ? 1 : 1.18;   // on a narrow screen the loads are drawn a little larger than their wagons
    const ty = land ? 596 : Math.round(H * 0.5), trayY = land ? 806 : Math.round(H * 0.73);
    const cardS = land ? 150 : Math.min(124, (W - 82) / 4), cardGap = land ? 28 : 14, q = cardS / 150;
    let R = null, cars = [], chs = [], drag = null, lastAct = 0, k = 1, len = 0, happy = 0, starPop = 0, over = -1;

    st.add({ z: 0, sprite: A.sprite('pt-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => paintBg(g, s, W, H, ty)) });
    for (let i = 0; i < 3; i++) {
      const c = st.add({ z: 1, x: W * (0.12 + i * 0.37), y: (land ? 200 : 230) + (i % 2) * 74, sprite: cloudSprite(), sx: 0.75 + i * 0.16, sy: 0.75 + i * 0.16, alpha: 0.92 });
      c.update = (dt) => { c.x += (5 + i * 3) * dt; if (c.x > W + 170) c.x = -170; };
    }
    // one star for every train sent on its way
    st.add({ ui: true, z: 5, x: W / 2, y: 152,
      update(dt) { starPop = Math.max(0, starPop - dt * 2); },
      draw(g) {
        for (let i = 0; i < SET; i++) {
          const on = i < mem.won, kk = on && i === mem.won - 1 ? 1 + starPop * 0.5 : 1;
          g.save(); g.translate((i - (SET - 1) / 2) * 58, 0); g.scale(kk, kk); g.rotate(on ? Math.sin(st.t * 2 + i) * 0.08 : 0);
          g.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j / 10) * TAU, rr = j % 2 ? 10 : 22; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath();
          g.fillStyle = on ? '#F2B33D' : 'rgba(251,246,236,.6)'; g.fill(); g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = on ? '#D9963A' : 'rgba(46,42,59,.14)'; g.stroke();
          g.restore();
        }
      } });

    /* ---------- the train ---------- */
    const train = st.add({ z: 10, x: -4000, y: ty, pressable: false });
    let px = train.x, dist = 0, moving = false, wheelRot = 0, idlePuff = 0, wcol = WCOLS[0];
    const puffs = [];
    const chimney = () => ({ x: train.x + (cars.length * P + 10 + EW * 0.735) * k, y: ty - 148 * k });
    function puff(big) { const c = chimney(); for (let i = 0; i < 3; i++) puffs.push({ x: c.x + (i - 1) * 9 * k, y: c.y - (i === 1 ? 7 : 0) * k, r: (big ? 13 : 9) * k, vx: -26 - Math.random() * 30, vy: -64 - Math.random() * 36, life: 0.8 }); while (puffs.length > 45) puffs.shift(); }
    train.update = (dt) => {
      const dx = train.x - px; px = train.x; wheelRot += dx / (WR * k); dist += Math.abs(dx); moving = dt > 0 && Math.abs(dx / dt) > 12;
      if (dist > 230) { dist = 0; puff(true); K.sfx.noise(0.09, { freq: 460, vol: 0.1 }); }
      if (!moving && (idlePuff -= dt) < 0) { idlePuff = 1.5; puff(false); }
      happy = Math.max(0, happy - dt);
      for (const c of cars) { c.hop = Math.max(0, c.hop - dt * 2.6); c.wob = Math.max(0, c.wob - dt * 1.8); c.pop = Math.max(0, c.pop - dt * 3); }
      for (const p of puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += 14 * dt * k; p.life -= dt * 0.75; }
      while (puffs.length && puffs[0].life <= 0) puffs.shift();
    };
    train.draw = (g) => {
      const wh = wheelSprite(), wg = wagonSprite(wcol), n = cars.length, act = activeGap();
      for (let i = 0; i < n; i++) {
        const c = cars[i];
        g.save(); g.translate(i * P + P / 2, 0);
        g.save(); g.translate(0, (moving ? Math.sin(st.t * 17 + i * 1.3) * 1.3 : 0) - Math.sin((1 - c.hop) * Math.PI) * (c.hop > 0 ? 26 : 0));
        g.rotate(c.wob > 0 ? Math.sin(st.t * 30) * 0.07 * c.wob : 0);
        put(g, wg);
        g.translate(0, ITEM_Y);
        if (c.item) { const kk = (1 + c.pop * 0.3) * big; g.translate(0, (1 - big) * 52); g.scale(kk, kk); put(g, itemSprite(c.item)); }
        else {
          const on = i === act, hov = i === over, kk = (hov ? 1.14 : 1) * (on ? 1 + Math.sin(st.t * 5) * 0.035 : 1) * big;
          g.translate(0, (1 - big) * 52);
          g.scale(kk, kk);
          if (on) { g.save(); g.shadowColor = '#FFE9A8'; g.shadowBlur = (18 + Math.sin(st.t * 5) * 8) * st.res * k; g.beginPath(); A.rect(g, -50, -50, 100, 100, 22, 2, 0); g.fillStyle = 'rgba(255,240,190,.75)'; g.fill(); g.restore(); }
          g.beginPath(); A.rect(g, -50, -50, 100, 100, 22, 2, 0); g.fillStyle = on ? 'rgba(255,250,235,.7)' : 'rgba(255,255,255,.36)'; g.fill();
          g.setLineDash([12, 9]); g.lineWidth = 5; g.lineCap = 'round'; g.strokeStyle = on ? '#F2B33D' : '#FBF8F1'; g.stroke(); g.setLineDash([]);
          g.rotate(Math.sin(st.t * 2.2 + i) * 0.1); g.font = `800 66px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = A.C.plum; g.fillText('?', 0, 5);
        }
        g.restore();
        for (const wx of [-34, 34]) { g.save(); g.translate(wx, -WR); g.rotate(wheelRot); put(g, wh); g.restore(); }
        g.restore();
      }
      // Toot, the engine
      g.save(); g.translate(n * P + 10, 0);
      g.save();
      const sq = happy > 0 ? Math.sin(st.t * 16) * 0.045 : Math.sin(st.t * 2.2) * 0.008 + (moving ? Math.sin(st.t * 17) * 0.012 : 0);
      g.translate(EW / 2, -20); g.scale(1 + sq, 1 - sq);
      const im = (happy > 0 && PIC.happy) || PIC.toot;
      if (im) { const h = EW * im.height / im.width; g.drawImage(im, -EW / 2, -h, EW, h); } else put(g, engineSprite());
      g.restore();
      for (const wx of [36, 100, 162]) { g.save(); g.translate(wx, -WR * 1.1); g.rotate(wheelRot / 1.1); put(g, wh, 1.1); g.restore(); }
      g.restore();
    };
    st.add({ z: 11, draw(g) { for (const p of puffs) { g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fillStyle = `rgba(255,253,246,${Math.max(0, Math.min(0.85, p.life))})`; g.fill(); } } });
    // touching the train: the wagon hops, Toot toots
    const touch = st.add({ z: 12, x: 0, y: ty, hit: { x: 0, y: -260, w: W, h: 270 }, pad: 0, pressable: false });
    touch.onDown = (p) => {
      const lx = (p.x - train.x) / k, i = Math.floor(lx / P);
      if (lx < 0 || lx > len) return;
      lastAct = st.t;
      if (i >= cars.length) { whistle(); happy = 0.9; puff(true); } else if (cars[i].hop <= 0) { cars[i].hop = 1; K.sfx.step(i); }
    };
    const whistle = () => { K.sfx.tone(784, 0.26, { type: 'triangle', vol: 0.16 }); K.sfx.tone(988, 0.42, { type: 'triangle', vol: 0.16, delay: 0.28 }); };
    const activeGap = () => { if (!R) return -1; for (const i of R.gaps) if (!R.filled[i]) return i; return -1; };
    const gapPos = (i) => ({ x: train.x + (i * P + P / 2) * k, y: ty + (ITEM_Y + (1 - big) * 52) * k });
    function gapNear(x, y) {
      let best = -1, bd = 1e9;
      for (const i of R.gaps) { if (R.filled[i]) continue; const p = gapPos(i), d = Math.hypot(p.x - x, p.y - y); if (d < 100 * k + 60 && d < bd) { bd = d; best = i; } }
      return best;
    }

    /* ---------- the cards ---------- */
    const trayW = () => { const n = R ? R.choices.length : 4; return n * cardS + (n - 1) * cardGap + (land ? 70 : 36); };
    st.add({ z: 20, x: W / 2, y: trayY, draw(g, s) {
      const w = trayW(), h = cardS + (land ? 56 : 40);
      g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 40, 6, 1.2); A.paper(g, s, '#E9D5AC', { shadow: 1, depth: 1.3, box: { x: -w / 2, y: -h / 2, w, h }, light: 0.06, grain: 0.3 });
      g.beginPath(); A.rect(g, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 32, 7, 0.8); g.strokeStyle = 'rgba(138,90,60,.28)'; g.lineWidth = 3; g.setLineDash([3, 11]); g.lineCap = 'round'; g.stroke(); g.setLineDash([]);
    } });
    function buildChoices(delay) {
      for (const c of chs) c.node.remove(); chs = [];
      const n = R.choices.length, tot = n * cardS + (n - 1) * cardGap;
      R.choices.forEach((it, i) => {
        const node = st.add({ z: 22, x: W / 2 - tot / 2 + cardS / 2 + i * (cardS + cardGap), y: trayY, hit: { x: -cardS / 2, y: -cardS / 2, w: cardS, h: cardS }, pad: 6, label: it.label, pressable: false, sx: 0, sy: 0, _bsx: 1, _bsy: 1 });
        const c = { it, node, glow: false, hop: 0, out: false };
        node.update = (dt) => { c.hop = Math.max(0, c.hop - dt * 2.4); };
        node.draw = (g) => {
          const pul = c.glow ? 1.03 + Math.sin(st.t * 7) * 0.07 : 1;
          g.save(); g.translate(0, -Math.sin((1 - c.hop) * Math.PI) * (c.hop > 0 ? 24 : 0)); g.scale(q * pul, q * pul);
          if (c.glow) { const gw = 10 + Math.sin(st.t * 7) * 4; g.save(); g.shadowColor = '#FFD95E'; g.shadowBlur = 34 * st.res * q; g.beginPath(); A.rect(g, -72 - gw, -72 - gw, 144 + gw * 2, 144 + gw * 2, 28 + gw, 2, 0); g.fillStyle = '#F7C233'; g.fill(); g.fill(); g.restore(); }
          put(g, cardSprite());
          if (c.out) g.globalAlpha *= 0.3;
          put(g, itemSprite(c.it), 1.04);
          g.restore();
        };
        node.onDown = (p) => grab(c, p);
        node.onMove = (p) => { if (!drag || drag.c !== c) return; drag.ghost.x = p.x + drag.ox; drag.ghost.y = p.y + drag.oy - Math.min(40, Math.hypot(p.x - drag.sx, p.y - drag.sy) * 0.5); over = gapNear(drag.ghost.x, drag.ghost.y); };
        node.onUp = (p, e, s2) => {
          if (!drag || drag.c !== c) return;
          const d = drag; drag = null; over = -1;
          if (s2.moved < 24) deliver(d, activeGap(), 0.42, 120);
          else { const gi = gapNear(d.ghost.x, d.ghost.y); if (gi >= 0) deliver(d, gi, 0.14, 0); else flyBack(d); }
        };
        node.onTap = (p) => { if (!p && grab(c, { x: node.x, y: node.y })) { const d = drag; drag = null; deliver(d, activeGap(), 0.42, 120); } };   // keyboard / screen reader
        node.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back', delay: delay + i * 0.09 });
        chs.push(c);
      });
    }
    function grab(c, p) {
      if (!R || R.over || R.busy || drag || c.out || activeGap() < 0) return false;
      lastAct = st.t; K.sfx.tap(); c.out = true; c.hop = 0;
      const ghost = st.add({ z: 40, x: c.node.x, y: c.node.y, sx: q * 1.14, sy: q * 1.14 });
      ghost.draw = (g) => put(g, itemSprite(c.it));
      drag = { c, ghost, ox: c.node.x - p.x, oy: c.node.y - p.y, sx: p.x, sy: p.y };
      return true;
    }
    /** Glide a flying piece to wherever target() is by the time it lands. */
    function fly(ghost, target, s1, dur, lift) {
      const x0 = ghost.x, y0 = ghost.y, s0 = ghost.sx; ghost.t = 0;
      ghost.update = () => { const e = ghost.t, p = target(); ghost.x = x0 + (p.x - x0) * e; ghost.y = y0 + (p.y - y0) * e - Math.sin(e * Math.PI) * lift; ghost.sx = ghost.sy = s0 + (s1 - s0) * e; ghost.rot = Math.sin(e * Math.PI) * 0.18; };
      return ghost.to({ t: 1 }, { dur, ease: 'inOut' });
    }
    function flyBack(d) { const c = d.c; fly(d.ghost, () => c.node, q, 0.3, 50).then(() => { d.ghost.remove(); c.out = false; }); }
    function deliver(d, gi, dur, lift) {
      if (gi < 0 || !R || R.over) { flyBack(d); return; }
      R.busy = true; if (lift) K.sfx.whoosh();
      fly(d.ghost, () => gapPos(gi), k * big, dur, lift).then(() => landed(d, gi));
    }
    function landed(d, gi) {
      const it = d.c.it, r = R; r.busy = false; lastAct = st.t;
      if (it.key !== r.seq[gi].key) {
        r.miss++; r.missTotal++; cars[gi].wob = 1; K.sfx.whoops(); flyBack(d); hint(gi); return;
      }
      d.ghost.remove(); d.c.out = false;
      cars[gi].item = it; cars[gi].pop = 1; r.filled[gi] = 1; r.miss = 0;
      for (const c of chs) c.glow = false;
      const p = gapPos(gi); ctx.fx.burst(p.x, p.y, { n: 12 }); K.sfx.pop(); K.sfx.step(gi);
      if (activeGap() < 0) solved();
    }
    /** The words on the wagons just before wagon gi, for reading the pattern out loud. */
    function readout(gi) {
      let from = Math.max(0, gi - 6); for (let i = from; i < gi; i++) if (!cars[i].item) from = i + 1;
      const words = []; for (let i = from; i < gi; i++) { words.push(R.seq[i].word + '.'); ctx.after((i - from) * 430, () => { if (cars[i]) cars[i].hop = 1; }); }
      return words.join(' ');
    }
    function hint(gi) {
      const second = R.miss >= 2, act = activeGap();
      if (second) for (const c of chs) c.glow = c.it.key === R.seq[act].key;
      const why = R.type === 'rep' ? (readout(gi) + ' ' + T.next).trim() : second ? R.rule : R.hint;
      ctx.say(second ? why + ' ' + T.glow : why);
    }
    async function solved() {
      const r = R; r.over = true; happy = 2.4;
      cars.forEach((c, i) => ctx.after(i * 70, () => { c.hop = 1; }));
      K.sfx.ding(); ctx.after(260, () => K.sfx.sparkle());
      for (const i of r.gaps) { const p = gapPos(i); ctx.fx.burst(p.x, p.y - 20, { n: 10 }); }
      const line = L >= 3 ? r.rule : r.gaps.map((i) => r.seq[i].word + '!').join(' ');
      await Promise.all([ctx.say(line), ctx.wait(1500)]);
      if (r.missTotal === 0) mem.skill = Math.min(8, mem.skill + 1); else if (r.missTotal >= 2) mem.skill = Math.max(0, mem.skill - 1);
      mem.won++; starPop = 1; mem.round = null;
      whistle(); happy = 1.6;
      for (const c of chs) c.node.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' });
      await train.to({ x: W + 80 }, { dur: 1.5, ease: (t) => t * t });
      if (mem.won >= SET) { await ctx.celebrate(); mem.won = 0; }
      if (R === r) newRound();
    }

    /* ---------- rounds ---------- */
    function enter(S) {
      R = S; R.over = false; R.busy = false; over = -1;
      if (drag) { drag.ghost.remove(); drag = null; }
      cars = S.seq.map((it, i) => ({ item: S.gaps.includes(i) && !S.filled[i] ? null : it, hop: 0, wob: 0, pop: 0 }));
      wcol = WCOLS[mem.wcol % WCOLS.length];
      const n = cars.length; len = n * P + EW + 16;
      k = Math.min(land ? 1.25 : 1, (W - (land ? 90 : 14)) / len); train.sx = train.sy = k;
      train.x = px = -len * k - 80; dist = 0;
      train.to({ x: (W - len * k) / 2 }, { dur: 1.7, ease: 'outCubic' });
      lastAct = st.t + 2;
      buildChoices(0.85);
      const two = S.gaps.length - Object.keys(S.filled).length > 1;
      const ask = two ? T.two + ' ' + T.first : activeGap() === n - 1 ? T.next : T.missing;
      ctx.prompt((mem.first ? T.look + ' ' : '') + ask, { show: two ? 'Fill the two gaps.' : ask });
      mem.first = false;
    }
    function newRound() {
      let S, guard = 0;
      do { S = makeRound(L, mem.skill, maxN, mem.first); } while (S.seq[S.gaps[0]].key === mem.lastKey && guard++ < 40);
      mem.lastKey = S.seq[S.gaps[0]].key; mem.wcol++;
      S.filled = {}; S.miss = 0; S.missTotal = 0; mem.round = S;
      enter(S);
    }
    // a quiet spell: the cards give a little wave
    ctx.every(1000, () => { if (R && !R.over && !drag && st.t - lastAct > 9) { lastAct = st.t; chs.forEach((c, i) => ctx.after(i * 110, () => { c.hop = 1; })); } });

    K._patterns = {   // for browser tests
      get R() { return R; }, get cards() { return chs; }, get skill() { return mem.skill; }, get won() { return mem.won; }, get k() { return k; },
      activeGap, gapPos, makeRound, lines,
      answer() { const i = activeGap(); return i < 0 ? null : R.seq[i].key; },
      jump(skill) { mem.skill = skill; newRound(); },
    };
    ctx.onExit(() => { K._patterns = null; });
    ctx.after(300, () => { if (mem.round && !mem.round.over) enter(mem.round); else newRound(); });
  }

  K.game({ id: 'patterns', title: 'Pattern Train', voice: 'patterns', group: 'arcade', age: 5, order: 24, icon, start, lines, resize: () => K.go('patterns') });
})();
