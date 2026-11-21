/* Odd One Out — a mat of picture cards; one does not belong. Touch it.
   A wrong card wobbles and Pip's voice says what to look at; after two wrong tries the odd card glows.
   After the right answer the game says why in two short sentences ("They are all fruit. This one is
   something to wear.") and, where it helps, shows it (first letters or rhyming ends coloured, sides counted).

   Level 1 (the gentlest): 3-4 big cards. Three the same and one different thing, or a different
     colour, size or shape.
   Level 2 (ages 4-5): 4-6 cards. Kinds of thing (fruit, vegetables, animals, things to wear),
     fish that swim the other way, stripes and spots, shape or colour when everything else is mixed.
   Level 3 (ages 6-8): 6-9 cards. Even and odd numbers, times tables, words by first letter, words that
     rhyme, shapes by number of sides, block figures where one is flipped over, fruit against vegetables.
   Clean rounds add cards and bigger numbers; rounds with misses take them away again. */
(function () {
  'use strict';
  const A = K.art;
  const P = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);
  const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
  const num = (n) => K.numWord(n);
  const INK = '#2E2A3B';

  const COLS = { red: '#DE4E46', blue: '#5B8FC7', yellow: '#F2C84B', green: '#5E9E57' };
  const PAINTS = Object.values(COLS).concat(['#7B5AA6', '#F0923B', '#2F8F8A', '#EE8FA8']);
  const SHAPES = { circle: { one: 'a circle', all: 'circles' }, square: { one: 'a square', all: 'squares' }, triangle: { one: 'a triangle', all: 'triangles' } };
  const GROUPS = {
    fruit: { all: 'They are all fruit.', one: 'This one is a fruit.', items: ['apple', 'banana', 'grapes', 'lemon', 'orange', 'pear', 'strawberry', 'watermelon'] },
    veg: { all: 'They are all vegetables.', one: 'This one is a vegetable.', items: ['broccoli', 'carrot', 'cucumber', 'eggplant'] },
    animal: { all: 'They are all animals.', one: 'This one is an animal.', face: true, items: ['cat', 'chick', 'dog', 'hedgehog', 'lion', 'mouse', 'owl', 'panda', 'pig'] },
    wear: { one: 'This one is something to wear.', items: ['hat', 'shoe', 'sock'] },
  };
  const THINGS = GROUPS.fruit.items.concat(GROUPS.veg.items, ['cookie', 'donut', 'cheese']), SILLY = ['shoe', 'sock', 'hat', 'ball', 'book'];
  const LETTERS = {
    B: ['ball', 'bus', 'bed', 'bat', 'book', 'bee', 'bird', 'box', 'bag'], C: ['cat', 'cup', 'car', 'cow', 'cake', 'corn', 'coat', 'cot'],
    S: ['sun', 'sock', 'sea', 'star', 'sand', 'six', 'soap', 'seed'], M: ['moon', 'map', 'milk', 'mouse', 'mud', 'man', 'mat', 'mop'],
  };
  const OTHER_WORDS = ['dog', 'fish', 'hat', 'jam', 'leg', 'pig', 'red', 'ten', 'van', 'web', 'nut', 'gate'];
  const RHYMES = [
    ['cat', 'hat', 'bat', 'mat', 'rat', 'sat', 'flat', 'chat'], ['dog', 'log', 'frog', 'fog', 'hog', 'jog'], ['sun', 'run', 'fun', 'bun', 'one', 'done'],
    ['pig', 'big', 'dig', 'wig', 'fig', 'twig'], ['bed', 'red', 'fed', 'led', 'head', 'said', 'bread'], ['cake', 'lake', 'rake', 'bake', 'make', 'snake', 'take'],
    ['bee', 'tree', 'see', 'knee', 'three', 'me', 'tea', 'key'], ['top', 'hop', 'mop', 'pop', 'shop', 'stop', 'drop'],
  ];
  const reg = (n, r, a0) => Array.from({ length: n }, (_, i) => { const a = a0 + (i / n) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r]; });
  const POLY = {
    3: [[[0, -84], [80, 62], [-80, 62]], [[-72, -70], [72, 66], [-72, 66]], [[0, -90], [54, 72], [-54, 72]]],
    4: [[[-66, -66], [66, -66], [66, 66], [-66, 66]], [[-88, -50], [88, -50], [88, 50], [-88, 50]], [[0, -90], [60, 0], [0, 90], [-60, 0]], [[-44, -56], [44, -56], [86, 56], [-86, 56]]],
    5: [reg(5, 84, -Math.PI / 2), [[0, -86], [70, -28], [70, 70], [-70, 70], [-70, -28]], reg(5, 84, 0.3)],
    6: [reg(6, 82, 0), [[-40, -60], [40, -60], [88, 0], [40, 60], [-40, 60], [-88, 0]], reg(6, 82, 0.5)],
  };
  const FIGS = [[[0, 0], [0, 1], [0, 2], [1, 2]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]];

  /* ---------------- words ---------------- */
  const T = {
    ask: 'Which one does not belong?',
    belongs: 'That one belongs with the others.',
    same: 'These are all the same. This one is different.',
    allCol: (c) => `These are all ${c}.`, oneCol: (c) => `This one is ${c}.`,
    size: (big) => (big ? 'These are all big. This one is small.' : 'These are all small. This one is big.'),
    allShape: (s) => `These are all ${SHAPES[s].all}.`, oneShape: (s) => `This one is ${SHAPES[s].one}.`,
    swim: 'These all swim the same way. This one swims the other way.',
    pattern: (stripes) => (stripes ? 'These all have stripes. This one has spots.' : 'These all have spots. This one has stripes.'),
    even: (even) => (even ? 'They are all even numbers. This one is odd.' : 'They are all odd numbers. This one is even.'),
    times: (k) => `They are all in the ${num(k)} times table. This one is not.`,
    letter: (l) => `They all start with ${l}. This one starts with a different letter.`,
    rhyme: 'They all rhyme. This one does not rhyme.',
    sides: (n) => `They all have ${num(n)} sides. This one has a different number of sides.`,
    flip: 'These are all the same shape, turned around. This one is flipped over.',
    hint: {
      same: 'Look for the one that is different.', color: 'Look at the colours.', size: 'Look at the sizes.', shape: 'Look at the shapes.', kind: 'What kind of thing is each one?',
      swim: 'Look which way they swim.', pattern: 'Look at the patterns.', number: 'Think about the numbers.', letter: 'Look at the first letters.', rhyme: 'Say the words out loud.',
      sides: 'Count the sides.', flip: 'Turn them around in your head.',
    },
  };
  function lines() {
    const out = [T.ask, T.belongs, T.same, T.size(true), T.size(false), T.swim, T.pattern(true), T.pattern(false), T.even(true), T.even(false), T.times(5), T.times(10), T.rhyme, T.flip].concat(Object.values(T.hint));
    for (const c in COLS) out.push(T.allCol(c), T.oneCol(c));
    for (const s in SHAPES) out.push(T.allShape(s), T.oneShape(s));
    for (const k in GROUPS) { if (GROUPS[k].all) out.push(GROUPS[k].all); out.push(GROUPS[k].one); }
    for (const l in LETTERS) out.push(T.letter(l));
    for (const n of [3, 4, 5, 6]) out.push(T.sides(n));
    const seen = {}, list = [];
    for (const text of out) for (const sn of String(text).match(/[^.!?]+[.!?]*/g) || []) { const k = K.voiceKey(sn); if (k && !seen[k]) { seen[k] = 1; list.push(sn.trim()); } }
    return list;
  }

  /* ---------------- pictures: animal faces (fetched the first time the game opens) ---------------- */
  const FACE = {}; let asked = false, facesLeft = 0;
  function loadFaces() { if (asked) return; asked = true; facesLeft = GROUPS.animal.items.length; for (const nm of GROUPS.animal.items) { const im = new Image(); im.onload = () => { FACE[nm] = im; facesLeft--; }; im.onerror = () => { facesLeft--; }; im.src = 'img/faces/' + nm + '.webp'; } }
  const FACE_COL = { cat: '#B9B0AC', chick: '#F2CF4A', dog: '#C98A45', hedgehog: '#B07A4E', lion: '#F2B33D', mouse: '#C9C1BC', owl: '#B07A4E', panda: '#FBF6EC', pig: '#F2A7B5' };

  /* ---------------- what is on a card (drawn about the middle, inside 200 x 200) ---------------- */
  function shapePath(h, it) {
    if (it.pts) return A.cut(h, it.pts, 8, 0.6, 3);
    if (it.shape === 'circle') return h.arc(0, 0, 76, 0, Math.PI * 2);
    if (it.shape === 'square') return A.rect(h, -68, -68, 136, 136, 14, 3, 0.6);
    if (it.shape === 'triangle') return A.cut(h, [[0, -80], [82, 62], [-82, 62]], 12, 0.6, 3);
    if (it.shape === 'star') return A.cut(h, reg(10, 86, -Math.PI / 2).map(([x, y], i) => (i % 2 ? [x * 0.5, y * 0.5] : [x, y])), 7, 0.4, 3);
    h.moveTo(0, 70); h.bezierCurveTo(-110, 0, -70, -90, 0, -40); h.bezierCurveTo(70, -90, 110, 0, 0, 70); h.closePath();       // heart
  }
  function drawShape(g, s, it) {
    g.save(); g.rotate(it.rot || 0); const k = it.size || 1; g.scale(k, k);
    P(g, s, it.col, (h) => shapePath(h, it), { box: { x: -84, y: -84, w: 168, h: 168 }, light: 0.08 });
    if (it.pattern) {
      g.save(); g.beginPath(); shapePath(g, it); g.clip(); g.fillStyle = 'rgba(255,255,255,.62)';
      if (it.pattern === 'stripes') { g.rotate(0.6); for (let x = -140; x < 140; x += 36) g.fillRect(x, -160, 16, 320); }
      else for (let y = -90, r = 0; y <= 90; y += 32, r++) for (let x = -96 + (r % 2) * 18; x <= 96; x += 36) { g.beginPath(); g.arc(x, y, 9.5, 0, 7); g.fill(); }
      g.restore();
    }
    g.restore();
  }
  function drawFish(g, s, it) {
    const c = it.col, d = A.shade(c, -0.1);
    g.save(); g.scale(it.dir, 1);
    P(g, s, d, (h) => A.cut(h, [[-48, 0], [-96, -46], [-84, 0], [-96, 46]], 8, 0.5, 3), { shadow: 0.5 });
    P(g, s, d, (h) => A.cut(h, [[-14, -38], [14, -72], [32, -34]], 7, 0.5, 4), { shadow: 0.3 });
    P(g, s, d, (h) => A.cut(h, [[-8, 38], [8, 62], [28, 36]], 6, 0.5, 5), { shadow: 0.3 });
    P(g, s, c, (h) => h.ellipse(10, 0, 72, 47, 0, 0, 7), { box: { x: -62, y: -47, w: 144, h: 94 }, light: 0.08 });
    A.line(g, 'rgba(255,255,255,.5)', 4.5, (h) => { for (const x of [-26, -2]) { h.moveTo(x, -30); h.quadraticCurveTo(x + 15, 0, x, 30); } });
    g.beginPath(); g.arc(46, -12, 13, 0, 7); g.fillStyle = '#FBF8F1'; g.fill();
    g.beginPath(); g.arc(50, -12, 6.5, 0, 7); g.fillStyle = INK; g.fill();
    g.beginPath(); g.arc(52, -14.5, 2.2, 0, 7); g.fillStyle = '#FFFFFF'; g.fill();
    A.line(g, INK, 3.2, (h) => h.arc(66, 10, 9, 2.0, 3.5));
    g.fillStyle = 'rgba(120,180,210,.55)'; for (const [x, y, r] of [[92, -40, 6], [84, -62, 4]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.restore();
  }
  function drawFig(g, s, it) {
    const c = 46, xs = it.cells.map((p) => p[0]), ys = it.cells.map((p) => p[1]);
    const ox = (Math.min(...xs) + Math.max(...xs) + 1) / 2, oy = (Math.min(...ys) + Math.max(...ys) + 1) / 2;
    g.save(); g.rotate(it.rot * Math.PI / 2); g.scale(it.flip ? -1 : 1, 1);
    for (const [x, y] of it.cells) P(g, s, it.col, (h) => A.rect(h, (x - ox) * c + 1.5, (y - oy) * c + 1.5, c - 3, c - 3, 9, x * 7 + y, 0.4), { shadow: 0.55, light: 0.08, box: { x: (x - ox) * c, y: (y - oy) * c, w: c, h: c } });
    g.restore();
  }
  function drawFace(g, s, it) {
    const im = FACE[it.name];
    if (im) { const k = Math.min(184 / im.width, 184 / im.height); g.drawImage(im, -im.width * k / 2, -im.height * k / 2, im.width * k, im.height * k); return; }
    const c = FACE_COL[it.name] || '#C9A070', d = A.shade(c, -0.1);
    for (const k of [-1, 1]) P(g, s, d, (h) => h.arc(k * 56, -56, 26, 0, 7), { shadow: 0.4 });
    P(g, s, c, (h) => A.blob(h, 0, 4, 80, 74, 0.03, 4, 11), { box: { x: -80, y: -70, w: 160, h: 148 } });
    g.fillStyle = INK; for (const k of [-1, 1]) { g.beginPath(); g.arc(k * 28, -6, 8, 0, 7); g.fill(); }
    g.beginPath(); g.ellipse(0, 20, 11, 8, 0, 0, 7); g.fill();
    for (const k of [-1, 1]) { g.beginPath(); g.arc(k * 50, 22, 11, 0, 7); g.fillStyle = 'rgba(240,120,120,.45)'; g.fill(); }
  }
  const rime = (w) => { const i = w.search(/[aeiou]/); return i < 0 ? 0 : i; };
  function drawWord(g, it, show) {
    const w = it.w, size = w.length > 5 ? 54 : w.length > 4 ? 62 : 72;
    g.font = `700 ${size}px ${A.FONT_BODY}`; g.textBaseline = 'middle'; g.textAlign = 'left';
    const cut = it.mark === 'first' ? 1 : rime(w), a = w.slice(0, cut), b = w.slice(cut), x0 = -g.measureText(w).width / 2;
    const hot = it.odd ? '#DE4E46' : '#2F8F8A';
    g.fillStyle = show && it.mark === 'first' ? hot : INK; g.fillText(a, x0, 4);
    g.fillStyle = show && it.mark === 'end' ? hot : INK; g.fillText(b, x0 + g.measureText(a).width, 4);
  }
  function drawItem(g, s, it, show) {
    if (it.t === 'pic') { const Kt = A.kitchen; if (Kt && Kt.sprite) { g.save(); g.scale(1.5, 1.5); put(g, Kt.sprite(it.name)); g.restore(); } else drawShape(g, s, { shape: 'circle', col: '#F0923B' }); }
    else if (it.t === 'face') drawFace(g, s, it);
    else if (it.t === 'shape') drawShape(g, s, it);
    else if (it.t === 'fish') drawFish(g, s, it);
    else if (it.t === 'fig') drawFig(g, s, it);
    else if (it.t === 'num') { g.fillStyle = INK; g.font = `800 ${it.n > 99 ? 96 : 124}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(it.n), 0, 8); }
    else if (it.t === 'word') drawWord(g, it, show);
    if (show && it.sides) {     // the sides, counted
      g.beginPath(); g.arc(88, 88, 25, 0, 7); g.fillStyle = it.odd ? '#DE4E46' : '#2F8F8A'; g.fill();
      g.fillStyle = '#FFFFFF'; g.font = `800 32px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(it.sides), 88, 90);
    }
  }
  function paintCard(g, s, it, show) {
    P(g, s, '#FBF6EC', (h) => A.rect(h, -122, -122, 244, 244, 30, 5, 1), { box: { x: -122, y: -122, w: 244, h: 244 }, depth: 1.1, light: 0.04 });
    A.line(g, 'rgba(46,42,59,.07)', 3, (h) => A.rect(h, -110, -110, 220, 220, 22, 6, 0.6));
    drawItem(g, s, it, show);
  }

  /* ---------------- rounds: each maker returns {items, odd, why, hint, key} ---------------- */
  const two = (list) => K.sample(list, 2);
  function build(kind, hint, why, same, odd, key) { return { kind, hint, why, same, oddItem: odd, key: kind + ':' + key }; }
  const MAKE = {
    same(n) { const silly = Math.random() < 0.4, x = K.pick(silly ? SILLY : THINGS), y = K.pick(silly ? THINGS : SILLY); return build('same', T.hint.same, T.same, Array(n - 1).fill({ t: 'pic', name: x }), { t: 'pic', name: y }, y); },
    color(n) { const [a, b] = two(Object.keys(COLS)), shape = K.pick(['circle', 'square', 'triangle', 'star', 'heart']); return build('color', T.hint.color, `${T.allCol(a)} ${T.oneCol(b)}`, Array(n - 1).fill({ t: 'shape', shape, col: COLS[a] }), { t: 'shape', shape, col: COLS[b] }, b); },
    color2(n) { const [a, b] = two(Object.keys(COLS)), sh = () => K.pick(['circle', 'square', 'triangle', 'star', 'heart']); return build('color2', T.hint.color, `${T.allCol(a)} ${T.oneCol(b)}`, Array.from({ length: n - 1 }, () => ({ t: 'shape', shape: sh(), col: COLS[a] })), { t: 'shape', shape: sh(), col: COLS[b] }, b); },
    size(n) { const big = Math.random() < 0.5, shape = K.pick(['circle', 'square', 'star', 'heart']), col = K.pick(PAINTS); return build('size', T.hint.size, T.size(big), Array(n - 1).fill({ t: 'shape', shape, col, size: big ? 1 : 0.5 }), { t: 'shape', shape, col, size: big ? 0.5 : 1 }, big); },
    shape(n) { const [a, b] = two(Object.keys(SHAPES)), col = K.pick(PAINTS); return build('shape', T.hint.shape, `${T.allShape(a)} ${T.oneShape(b)}`, Array(n - 1).fill({ t: 'shape', shape: a, col }), { t: 'shape', shape: b, col }, b); },
    shape2(n) { const [a, b] = two(Object.keys(SHAPES)), cs = K.shuffle(PAINTS); return build('shape2', T.hint.shape, `${T.allShape(a)} ${T.oneShape(b)}`, Array.from({ length: n - 1 }, (_, i) => ({ t: 'shape', shape: a, col: cs[i % cs.length] })), { t: 'shape', shape: b, col: cs[(n - 1) % cs.length] }, b); },
    category(n, o) {
      let a, b;
      if (o.hard) { a = 'fruit'; b = 'veg'; }
      else { a = K.pick(['fruit', 'animal'].concat(n <= 5 ? ['veg'] : [])); b = K.pick(Object.keys(GROUPS).filter((k) => k !== a && !(a !== 'animal' && (k === 'fruit' || k === 'veg')))); }
      const it = (grp) => (name) => ({ t: GROUPS[grp].face ? 'face' : 'pic', name });
      const odd = K.pick(GROUPS[b].items);
      return build('category', T.hint.kind, `${GROUPS[a].all} ${GROUPS[b].one}`, K.sample(GROUPS[a].items, n - 1).map(it(a)), it(b)(odd), odd);
    },
    category3(n) { return MAKE.category(n, { hard: true }); },
    swim(n) { const dir = Math.random() < 0.5 ? 1 : -1, cs = K.shuffle(PAINTS); return build('swim', T.hint.swim, T.swim, Array.from({ length: n - 1 }, (_, i) => ({ t: 'fish', dir, col: cs[i % cs.length] })), { t: 'fish', dir: -dir, col: cs[(n - 1) % cs.length] }, dir); },
    pattern(n) { const st = Math.random() < 0.5, shape = K.pick(['circle', 'square', 'heart']), cs = K.shuffle(PAINTS); return build('pattern', T.hint.pattern, T.pattern(st), Array.from({ length: n - 1 }, (_, i) => ({ t: 'shape', shape, col: cs[i % cs.length], pattern: st ? 'stripes' : 'dots' })), { t: 'shape', shape, col: cs[(n - 1) % cs.length], pattern: st ? 'dots' : 'stripes' }, st); },
    even(n, o) {
      const even = Math.random() < 0.6, max = o.skill < 2 ? 20 : o.skill < 4 ? 50 : 98, pool = [];
      for (let v = 2; v <= max; v++) pool.push(v);
      const odd = K.pick(pool.filter((v) => (v % 2 === 0) !== even));
      return build('even', T.hint.number, T.even(even), K.sample(pool.filter((v) => (v % 2 === 0) === even), n - 1).map((v) => ({ t: 'num', n: v })), { t: 'num', n: odd }, odd);
    },
    times(n) {
      const k = K.pick([5, 10]), ms = K.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], n - 1).map((m) => m * k);
      const odd = K.randInt(1, 11) * k + (k === 10 ? (Math.random() < 0.5 ? 5 : K.pick([2, 4, 6, 8])) : K.pick([1, 2, 3, 4]));
      return build('times', T.hint.number, T.times(k), ms.map((v) => ({ t: 'num', n: v })), { t: 'num', n: odd }, odd);
    },
    letter(n) {
      const l = K.pick(Object.keys(LETTERS)), odd = K.pick(OTHER_WORDS.concat(...Object.keys(LETTERS).filter((x) => x !== l).map((x) => LETTERS[x])));
      return build('letter', T.hint.letter, T.letter(l), K.sample(LETTERS[l], n - 1).map((w) => ({ t: 'word', w, mark: 'first' })), { t: 'word', w: odd, mark: 'first' }, odd);
    },
    rhyme(n) {
      const fam = K.pick(RHYMES.filter((f) => f.length >= n - 1)), odd = K.pick([].concat(...RHYMES.filter((f) => f !== fam)));
      return build('rhyme', T.hint.rhyme, T.rhyme, K.sample(fam, n - 1).map((w) => ({ t: 'word', w, mark: 'end' })), { t: 'word', w: odd, mark: 'end' }, odd);
    },
    sides(n) {
      const k = K.pick([3, 4, 5, 6]), k2 = k === 3 ? 4 : k === 6 ? 5 : k + K.pick([-1, 1]), cs = K.shuffle(PAINTS);
      const mk = (sd, i) => ({ t: 'shape', pts: K.pick(POLY[sd]), col: cs[i % cs.length], rot: K.pick([0, 0, Math.PI / 2, Math.PI, 0.35, -0.35]), sides: sd });
      return build('sides', T.hint.sides, T.sides(k), Array.from({ length: n - 1 }, (_, i) => mk(k, i)), mk(k2, n - 1), k + '>' + k2);
    },
    flip(n) {
      const fi = K.randInt(0, FIGS.length - 1), cells = FIGS[fi], col = K.pick(PAINTS);
      const rots = Array.from({ length: n - 1 }, (_, i) => (i < 4 ? i : K.randInt(0, 3)));
      return build('flip', T.hint.flip, T.flip, K.shuffle(rots).map((rot) => ({ t: 'fig', cells, col, rot })), { t: 'fig', cells, col, rot: K.randInt(0, 3), flip: true }, fi);
    },
  };
  const KINDS = { 1: ['same', 'color', 'size', 'shape'], 2: ['category', 'swim', 'pattern', 'shape2', 'color2'], 3: ['even', 'times', 'letter', 'rhyme', 'sides', 'flip', 'category3'] };
  const MOST = { category3: 9, letter: 9, rhyme: 7, flip: 8 };   // the most cards a kind can fill

  function paintTable(g, s, W, H, mat) {
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#F6E7CB', { shadow: 0, grain: 0.3, light: 0.04, box: { x: 0, y: 0, w: W, h: H } });
    const r = A.rng(11), tints = ['rgba(47,143,138,.13)', 'rgba(232,102,74,.12)', 'rgba(242,179,61,.2)', 'rgba(91,143,199,.13)'];
    for (let i = 0, n = Math.round(W * H / 30000); i < n; i++) {
      const x = r() * W, y = r() * H, k = 14 + r() * 18; g.save(); g.translate(x, y); g.rotate(r() * 6); g.fillStyle = tints[i % 4]; g.beginPath();
      if (i % 3 === 0) g.arc(0, 0, k, 0, 7); else if (i % 3 === 1) { g.moveTo(0, -k); g.lineTo(k, k * 0.8); g.lineTo(-k, k * 0.8); g.closePath(); } else g.rect(-k * 0.8, -k * 0.8, k * 1.6, k * 1.6);
      g.fill(); g.restore();
    }
    P(g, s, '#8FC7BE', (h) => A.rect(h, mat.x, mat.y, mat.w, mat.h, 44, 4, 1.5), { box: mat, depth: 1.4, light: 0.05, grain: 0.3 });
    g.save(); g.setLineDash([16, 13]); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); A.rect(g, mat.x + 16, mat.y + 16, mat.w - 32, mat.h - 32, 32, 4, 1); g.stroke(); g.restore();
  }
  const starPath = (g, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.48 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); };

  function start(st, ctx) {
    loadFaces();
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, ROUNDS = 4;
    const mt = land ? 128 : 146, mat = { x: land ? 40 : 14, y: mt, w: W - (land ? 80 : 28), h: H - mt - 92 };
    const gap = land ? 26 : 16, inset = land ? 34 : 26, maxSize = land ? 290 : 250;
    let cards = [], R = null, won = 0, gain = 0, skill = 0, lastKind = '', lastKey = '', lastIdx = -1, bag = [KINDS[L][0]].concat(K.shuffle(KINDS[L].slice(1)));   // the gentlest kind first

    st.add({ z: 0, sprite: A.sprite('odd-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => paintTable(g, s, W, H, mat)) });
    const tray = st.add({ ui: true, z: 55, x: W / 2, y: H - 46 });
    tray.draw = (g) => {
      const w = ROUNDS * 50 + 24;
      g.save(); g.shadowColor = 'rgba(46,40,70,.18)'; g.shadowBlur = 8 * st.res; g.shadowOffsetY = 3 * st.res; g.beginPath(); A.rect(g, -w / 2, -26, w, 52, 26, 4, 0.4); g.fillStyle = '#FBF6EC'; g.fill(); g.restore();
      for (let i = 0; i < ROUNDS; i++) { g.save(); g.translate((i - (ROUNDS - 1) / 2) * 50, 1); const on = i < won, k = on && i === won - 1 ? 1 + gain * 0.6 : 1; g.scale(k, k); g.rotate(on && i === won - 1 ? gain * 1.2 : 0); starPath(g, on ? 19 : 13); g.fillStyle = on ? '#F2B33D' : 'rgba(46,42,59,.16)'; g.fill(); g.restore(); }
    };
    tray.update = (dt) => { gain = Math.max(0, gain - dt * 2); };

    /** A card bitmap for this round only (not kept in the art cache, which never forgets). */
    function raster(it, show) {
      const pad = 16, s = st.res, c = document.createElement('canvas'); c.width = c.height = Math.ceil((260 + pad * 2) * s);
      const g = c.getContext('2d'); g.setTransform(s, 0, 0, s, (130 + pad) * s, (130 + pad) * s); paintCard(g, s, it, show);
      return { canvas: c, ox: 130 + pad, oy: 130 + pad, w: 260 + pad * 2, h: 260 + pad * 2 };
    }
    function layout(n) {
      const aw = mat.w - inset * 2, ah = mat.h - inset * 2; let best = null;
      for (let c = 1; c <= n; c++) { const r = Math.ceil(n / c), size = Math.min((aw - gap * (c - 1)) / c, (ah - gap * (r - 1)) / r, maxSize), score = size - (c * r - n) * 4; if (!best || score > best.score + 0.5) best = { c, r, size, score }; }
      return Array.from({ length: n }, (_, i) => { const row = Math.floor(i / best.c), col = i % best.c, nr = Math.min(best.c, n - row * best.c); return { x: W / 2 + (col - (nr - 1) / 2) * (best.size + gap), y: mat.y + mat.h / 2 + (row - (best.r - 1) / 2) * (best.size + gap), sc: best.size / 252 }; });
    }
    const speak = (text, min) => Promise.race([Promise.all([ctx.prompt(text), ctx.wait(min || 900)]), ctx.wait(9000)]);
    const wantN = () => (L === 1 ? (skill < 2 ? 3 : 4) : L === 2 ? (skill < 2 ? 4 : skill < 4 ? 5 : 6) : skill < 1 ? 6 : skill < 3 ? 7 : skill < 5 ? 8 : 9);

    function newRound(force) {
      for (const c of cards) c.node.remove(); cards = [];
      if (!bag.length) { bag = K.shuffle(KINDS[L]); if (bag[0] === lastKind) bag.push(bag.shift()); }
      const kind = force || bag.shift(), n = Math.min(wantN(), MOST[kind] || 9);
      let r, guard = 0;
      do { r = MAKE[kind](n, { skill }); } while (r.key === lastKey && guard++ < 12);
      lastKind = kind; lastKey = r.key;
      do { r.odd = K.randInt(0, n - 1); } while (r.odd === lastIdx && n > 1);
      lastIdx = r.odd;
      r.items = r.same.map((it) => Object.assign({}, it)); r.items.splice(r.odd, 0, Object.assign({ odd: true }, r.oddItem));
      r.misses = 0; r.busy = true; r.glow = false; R = r;
      const spots = layout(n);
      cards = r.items.map((it, i) => {
        const sp = spots[i], tilt = (Math.random() - 0.5) * 0.06;
        const node = st.add({ x: sp.x, y: sp.y, z: 10, sx: 0, sy: 0, rot: tilt, hit: { x: -122, y: -122, w: 244, h: 244 }, pad: 2, label: 'card ' + (i + 1), wob: 0, hop: 0 });
        node._bsx = node._bsy = sp.sc;
        const c = { i, it, node, sp, tilt, spr: raster(it, false), won: false };
        node.draw = (g) => {
          const t = st.t, hint = r.glow && i === r.odd && !c.won;
          g.translate(0, -node.hop); g.rotate(Math.sin(t * 34) * node.wob * 0.09);
          if (hint) { const q = 1 + Math.sin(t * 6) * 0.04; g.scale(q, q); const gr = g.createRadialGradient(0, 0, 90, 0, 0, 190); gr.addColorStop(0, 'rgba(255,236,140,.95)'); gr.addColorStop(1, 'rgba(255,236,140,0)'); g.fillStyle = gr; g.fillRect(-190, -190, 380, 380); }
          if (c.won) { g.beginPath(); A.rect(g, -131, -131, 262, 262, 36, 5, 1); g.fillStyle = '#F2B33D'; g.fill(); }
          put(g, c.spr);
        };
        node.to({ sx: sp.sc, sy: sp.sc }, { dur: 0.4, ease: 'back', delay: 0.1 + 0.07 * i });
        ctx.after(100 + 70 * i, () => K.sfx.tone(520 + i * 40, 0.06, { type: 'triangle', vol: 0.08 }));
        node.onDown = () => { K.sfx.tap(); node.press(); };
        node.onTap = () => choose(c);
        return c;
      });
      ctx.after(300 + n * 70, () => { if (R === r) r.busy = false; });
      ctx.prompt(T.ask);
    }
    function choose(c) {
      const r = R; if (!r || r.busy) return;
      if (c.i === r.odd) { win(r, c); return; }
      r.misses++; K.sfx.whoops();
      c.node.wob = 1; c.node.to({ wob: 0 }, { dur: 0.6, ease: 'out' });
      if (r.misses >= 2) r.glow = true;
      ctx.say(`${T.belongs} ${r.hint}`);
    }
    async function win(r, c) {
      r.busy = true; c.won = true;
      K.sfx.ding(); ctx.after(200, () => K.sfx.sparkle());
      ctx.fx.burst(c.node.x, c.node.y, { n: 18 });
      c.node.z = 20; st.root._sorted = false;
      c.node._bsx = c.node._bsy = c.sp.sc * 1.08; c.node.to({ sx: c.sp.sc * 1.08, sy: c.sp.sc * 1.08, rot: 0.05 }, { dur: 0.4, ease: 'back' });
      for (const o of cards) { o.spr = raster(o.it, true); if (o !== c) { o.node.to({ hop: 16 }, { dur: 0.16, ease: 'out', delay: 0.25 + o.i * 0.06 }).then(() => o.node.to({ hop: 0 }, { dur: 0.3, ease: 'inOut' })); } }
      skill = r.misses === 0 ? Math.min(6, skill + 1) : r.misses >= 2 ? Math.max(0, skill - 1) : skill;
      await ctx.wait(450); if (R !== r) return;
      await speak(r.why, 2600); if (R !== r) return;
      won++; gain = 1; K.sfx.step(won + 1);
      await ctx.wait(900); if (R !== r) return;
      R = null; ctx.prompt('', { silent: true });
      for (const o of cards) o.node.to({ sx: 0, sy: 0, rot: o.node.rot + 0.3 }, { dur: 0.25, ease: 'inOut', delay: o.i * 0.03 });
      await ctx.wait(420);
      if (won >= ROUNDS) { await ctx.celebrate(); won = 0; }
      newRound();
    }

    K._oddone = { // for browser tests
      get R() { return R; }, get cards() { return cards; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      get answer() { return R && !R.busy ? R.odd : null; }, next(kind) { newRound(kind); }, kinds: KINDS[L],
    };
    ctx.onExit(() => { K._oddone = null; });
    // the animal faces may still be on their way the very first time
    let waited = 0; const go = () => { if (L === 1 || facesLeft <= 0 || waited++ > 14) newRound(); else ctx.after(100, go); };
    ctx.after(350, go);
  }

  function icon(g, w) {
    const u = w / 300; g.save(); g.scale(u, u);
    g.fillStyle = '#8FC7BE'; g.fillRect(0, 0, 300, 300);
    const rr = (x, y, w2, h2, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w2, y, x + w2, y + h2, r); g.arcTo(x + w2, y + h2, x, y + h2, r); g.arcTo(x, y + h2, x, y, r); g.arcTo(x, y, x + w2, y, r); g.closePath(); g.fill(); };
    const card = (x, y, rot, ring, fn) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = 'rgba(46,40,70,.18)'; rr(-55, -51, 116, 116, 18);
      if (ring) { g.fillStyle = '#F2B33D'; rr(-66, -66, 132, 132, 24); }
      g.fillStyle = '#FBF6EC'; rr(-58, -58, 116, 116, 18);
      fn(); g.restore();
    };
    const apple = () => { g.fillStyle = '#DE4E46'; g.beginPath(); g.arc(-13, 6, 27, 0, 7); g.arc(13, 6, 27, 0, 7); g.fill(); g.strokeStyle = '#6B4430'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -18); g.lineTo(5, -36); g.stroke(); g.fillStyle = '#5E9E57'; g.beginPath(); g.ellipse(18, -32, 14, 7, -0.5, 0, 7); g.fill(); };
    const fish = () => { g.fillStyle = '#4C7FB8'; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-44, -22); g.lineTo(-44, 22); g.closePath(); g.fill(); g.fillStyle = '#5B8FC7'; g.beginPath(); g.ellipse(6, 0, 34, 23, 0, 0, 7); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(22, -6, 7, 0, 7); g.fill(); g.fillStyle = '#2E2A3B'; g.beginPath(); g.arc(24, -6, 3.5, 0, 7); g.fill(); };
    card(84, 84, -0.05, false, apple); card(216, 84, 0.04, false, apple); card(84, 216, 0.03, false, apple); card(216, 216, 0.1, true, fish);
    g.restore();
  }

  K.game({ id: 'oddone', title: 'Odd One Out', voice: 'oddone', group: 'arcade', age: 5, order: 20, icon, start, lines, resize: () => K.go('oddone') });
})();
