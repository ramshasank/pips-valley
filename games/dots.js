/* Dot to Dot — join the dots in order and the outline turns into a cut-paper picture that wiggles.
   Tap the next dot, or put a finger down and draw from dot to dot. Each dot says its name as it is
   joined. A wrong dot only wobbles and the right one is named; after two misses it pulses.
   Level 1: 4-6 big dots, 1 2 3 ..., and the next dot always pulses.
   Level 2: 8-15 dots, numbers or the letters a b c ...
   Level 3: 15-26 dots whose labels follow a spoken rule: by twos, fives, tens, backwards from
            twenty, or the alphabet.
   Three pictures are pegged up in the little gallery, then a celebration, then fresh ones.
   Dots are added along the longest edges, and only while they stay a thumb apart on this screen. */
(function () {
  'use strict';
  const A = K.art, C = A.C;
  const ABC = 'abcdefghijklmnopqrstuvwxyz', ROUNDS = 3, INK = '#3A2A2A';
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const word = (n) => (n <= 20 ? K.numWord(n) : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + K.numWord(n % 10) : '') : n === 100 ? 'one hundred' : 'one hundred and ' + word(n - 100));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const nameOf = (v) => (typeof v === 'number' ? cap(word(v)) + '!' : v + '.');
  const NEXT = 'Next is…';
  const RULES = {
    one: { ask: 'Join the dots! Start at one.', show: 'Join the dots', max: 15, at: (i) => i + 1 },
    abc: { ask: 'Join the letters! Start at a.', show: 'Join a, b, c', max: 15, at: (i) => ABC[i] },
    twos: { ask: 'Count by twos! Start at two.', show: 'Count by twos', max: 20, at: (i) => 2 * i + 2 },
    fives: { ask: 'Count by fives! Start at five.', show: 'Count by fives', max: 20, at: (i) => 5 * i + 5 },
    tens: { ask: 'Count by tens! Start at ten.', show: 'Count by tens', max: 15, at: (i) => 10 * i + 10 },
    back: { ask: 'Count backwards! Start at twenty.', show: 'Count backwards', max: 20, at: (i) => 20 - i },
    alpha: { ask: 'Follow the alphabet! Start at a.', show: 'The alphabet', max: 26, at: (i) => ABC[i] },
  };
  const HARD = ['twos', 'fives', 'tens', 'back', 'alpha'];

  /* ---------------- little drawing helpers for the finished pictures ----------------
     Figures are authored in a 100 x 100 box. M.p(x, y) maps a figure point onto the paper, M.u is one figure unit. */
  const mp = (M, pts) => pts.map(([x, y]) => M.p(x, y));
  const poly = (g, s, M, pts, col, rad, sh) => { g.beginPath(); A.cut(g, mp(M, pts), (rad == null ? 3 : rad) * M.u, 0, 3); A.paper(g, s, col, { shadow: sh == null ? 0.3 : sh }); };
  const disc = (g, M, x, y, r, col) => { const p = M.p(x, y); g.beginPath(); g.arc(p[0], p[1], r * M.u, 0, 7); g.fillStyle = col; g.fill(); };
  const eye = (g, M, x, y, r) => { disc(g, M, x, y, r, INK); disc(g, M, x + r * 0.3, y - r * 0.35, r * 0.34, '#fff'); };
  const stroke = (g, M, pts, col, w, curve) => A.line(g, col, w * M.u, (h) => { const q = mp(M, pts); if (curve) A.smooth(h, q, true); else { h.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) h.lineTo(p[0], p[1]); } });
  const smile = (g, M, x, y, w) => A.line(g, INK, 1.7 * M.u, (h) => { const a = M.p(x - w, y), c = M.p(x, y + w * 1.25), b = M.p(x + w, y); h.moveTo(a[0], a[1]); h.quadraticCurveTo(c[0], c[1], b[0], b[1]); });
  const cheeks = (g, M, x1, x2, y, r) => { disc(g, M, x1, y, r, 'rgba(238,120,100,.55)'); disc(g, M, x2, y, r, 'rgba(238,120,100,.55)'); };
  const gem = (g, M, x, y, r, col) => { disc(g, M, x, y, r + 1, 'rgba(46,42,59,.22)'); disc(g, M, x, y, r, col); disc(g, M, x - r * 0.3, y - r * 0.3, r * 0.3, 'rgba(255,255,255,.7)'); };
  const pane = (g, s, M, x, y, w) => { poly(g, s, M, [[x, y], [x + w, y], [x + w, y + w], [x, y + w]], '#FBF8F1', 2, 0.25); poly(g, s, M, [[x + 2, y + 2], [x + w - 2, y + 2], [x + w - 2, y + w - 2], [x + 2, y + w - 2]], '#BFE0EA', 1.5, 0); stroke(g, M, [[x + w / 2, y + 2], [x + w / 2, y + w - 2]], '#FBF8F1', 1.6); stroke(g, M, [[x + 2, y + w / 2], [x + w - 2, y + w / 2]], '#FBF8F1', 1.6); };
  const starPts = (cx, cy, R, r) => { const out = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; out.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } return out; };
  function catFace(g, s, M, y) {
    poly(g, s, M, [[15, y - 40], [31, y - 29], [13, y - 19]], '#F6C3A6', 3, 0); poly(g, s, M, [[85, y - 40], [69, y - 29], [87, y - 19]], '#F6C3A6', 3, 0);
    eye(g, M, 34, y, 4.8); eye(g, M, 66, y, 4.8); cheeks(g, M, 24, 76, y + 11, 5);
    poly(g, s, M, [[45, y + 11], [55, y + 11], [50, y + 17]], '#D9614F', 2, 0);
    stroke(g, M, [[39, y + 20], [44, y + 24], [50, y + 18], [56, y + 24], [61, y + 20]], INK, 1.6, true);
    for (const d of [-1, 1]) { stroke(g, M, [[50 + d * 25, y + 15], [50 + d * 44, y + 11]], 'rgba(58,42,42,.6)', 1.1); stroke(g, M, [[50 + d * 25, y + 19], [50 + d * 44, y + 23]], 'rgba(58,42,42,.6)', 1.1); }
  }
  const flame = (g, s, M, y) => { poly(g, s, M, [[38, y], [62, y], [50, 100]], C.marigold, 4, 0.3); poly(g, s, M, [[44, y], [56, y], [50, y + (100 - y) * 0.6]], '#FBE3A0', 3, 0); };
  const port = (g, M, y) => { disc(g, M, 50, y, 10.5, 'rgba(46,42,59,.2)'); disc(g, M, 50, y, 9.5, '#FBF8F1'); disc(g, M, 50, y, 6.6, '#BFE0EA'); disc(g, M, 47.6, y - 2.4, 1.8, 'rgba(255,255,255,.85)'); };

  const FIGS = [
    { id: 'star', say: 'a star', col: '#F2B33D', rad: 7, lv: [2, 3], pts: starPts(50, 52, 50, 22),
      deco(g, s, M) { poly(g, s, M, starPts(50, 52.5, 31, 15), '#F9D272', 5, 0.3); eye(g, M, 43, 50, 3.4); eye(g, M, 57, 50, 3.4); cheeks(g, M, 36.5, 63.5, 57, 3.6); smile(g, M, 50, 57, 4.6); } },
    { id: 'kite', say: 'a kite', col: '#E8664A', rad: 5, lv: [1], pts: [[50, 2], [86, 36], [50, 84], [14, 36]], ext: [[58, 100]],
      under(g, s, M) { stroke(g, M, [[50, 84], [57, 89], [47, 94], [56, 100]], 'rgba(58,42,42,.7)', 1.2, true); gem(g, M, 55.5, 88.5, 2.6, C.teal); gem(g, M, 48.5, 94, 2.6, C.plum); },
      deco(g, s, M) { poly(g, s, M, [[50, 2], [86, 36], [50, 36]], '#F2B33D', 3, 0); poly(g, s, M, [[14, 36], [50, 36], [50, 84]], '#F2B33D', 3, 0); stroke(g, M, [[50, 4], [50, 82]], 'rgba(58,42,42,.45)', 1.2); stroke(g, M, [[17, 36], [83, 36]], 'rgba(58,42,42,.45)', 1.2); } },
    { id: 'gem', say: 'a diamond', col: '#3FA9A3', rad: 4, lv: [1], pts: [[26, 10], [74, 10], [97, 40], [50, 96], [3, 40]],
      deco(g, s, M) { poly(g, s, M, [[26, 10], [74, 10], [97, 40], [3, 40]], '#7CCFC6', 3, 0); for (const l of [[[26, 10], [38, 40], [50, 96]], [[74, 10], [62, 40], [50, 96]], [[38, 40], [50, 10], [62, 40]], [[3, 40], [97, 40]]]) stroke(g, M, l, 'rgba(255,255,255,.7)', 1.2); disc(g, M, 30, 22, 3, 'rgba(255,255,255,.75)'); } },
    { id: 'house1', say: 'a house', col: '#F6E0B5', rad: 4, lv: [1], pts: [[50, 6], [94, 44], [94, 94], [6, 94], [6, 44]], ext: [[1, 45], [99, 45], [50, 2]],
      deco(g, s, M) { poly(g, s, M, [[50, 2], [99, 45], [1, 45]], '#E8664A', 4, 0.5); poly(g, s, M, [[41, 94], [41, 66], [59, 66], [59, 94]], C.teal, 3, 0.25); disc(g, M, 55, 81, 1.7, C.marigold); pane(g, s, M, 14, 56, 18); pane(g, s, M, 68, 56, 18); } },
    { id: 'house', say: 'a house', col: '#F6E0B5', rad: 4, lv: [2, 3], pts: [[50, 10], [64, 23], [64, 0], [80, 0], [80, 37], [96, 52], [96, 98], [4, 98], [4, 52]],
      deco(g, s, M) { poly(g, s, M, [[64, 0], [80, 0], [80, 40], [64, 26]], '#C9553F', 2, 0.25); poly(g, s, M, [[50, 10], [97, 52.5], [3, 52.5]], '#E8664A', 4, 0.5); disc(g, M, 50, 37, 6, '#FBF8F1'); disc(g, M, 50, 37, 4.4, '#BFE0EA'); poly(g, s, M, [[42, 98], [42, 72], [58, 72], [58, 98]], C.teal, 3, 0.25); disc(g, M, 54.5, 86, 1.6, C.marigold); pane(g, s, M, 14, 62, 17); pane(g, s, M, 69, 62, 17); } },
    { id: 'boat', say: 'a boat', col: '#D95A45', rad: 4, lv: [1, 2, 3], pts: [[4, 62], [44, 62], [44, 4], [96, 62], [80, 94], [20, 94]], ext: [[0, 100], [100, 100]],
      deco(g, s, M) { poly(g, s, M, [[44, 4], [96, 62], [44, 62]], '#FBF8F1', 3, 0.3); poly(g, s, M, [[47, 30], [69.5, 36], [79, 46.5], [47, 46.5]], '#8FC4DA', 2, 0); stroke(g, M, [[44, 5], [44, 62]], C.bark, 2.2); poly(g, s, M, [[9, 70], [91, 70], [88, 77], [12, 77]], '#F6E0B5', 2, 0); stroke(g, M, [[0, 95], [12, 91], [25, 96], [38, 91], [50, 96], [62, 91], [75, 96], [88, 91], [100, 95]], '#6FB3CF', 3.2, true); } },
    { id: 'rocket1', say: 'a rocket', col: '#5B8FC7', rad: 5, lv: [1], pts: [[50, 2], [76, 36], [76, 86], [24, 86], [24, 36]], ext: [[6, 94], [94, 94], [50, 100]],
      under(g, s, M) { poly(g, s, M, [[24, 56], [6, 94], [26, 86]], '#E8664A', 4, 0.4); poly(g, s, M, [[76, 56], [94, 94], [74, 86]], '#E8664A', 4, 0.4); flame(g, s, M, 84); },
      deco(g, s, M) { poly(g, s, M, [[50, 2], [76, 36], [24, 36]], '#E8664A', 4, 0); port(g, M, 57); } },
    { id: 'rocket', say: 'a rocket', col: '#5B8FC7', rad: 5, lv: [2, 3], pts: [[50, 2], [72, 30], [72, 60], [94, 90], [68, 80], [32, 80], [6, 90], [28, 60], [28, 30]], ext: [[50, 100]],
      under(g, s, M) { flame(g, s, M, 78); },
      deco(g, s, M) { poly(g, s, M, [[72, 60], [94, 90], [68, 80]], '#E8664A', 4, 0); poly(g, s, M, [[28, 60], [6, 90], [32, 80]], '#E8664A', 4, 0); poly(g, s, M, [[50, 2], [72, 30], [28, 30]], '#E8664A', 4, 0); port(g, M, 48); stroke(g, M, [[34, 70], [66, 70]], 'rgba(255,255,255,.6)', 1.6); } },
    { id: 'cat1', say: 'a cat', col: '#F0A85A', rad: 10, lv: [1], pts: [[10, 6], [50, 26], [90, 6], [94, 62], [50, 96], [6, 62]], deco(g, s, M) { catFace(g, s, M, 54); } },
    { id: 'cat', say: 'a cat', col: '#F0A85A', rad: 10, lv: [2, 3], pts: [[10, 4], [36, 24], [64, 24], [90, 4], [95, 48], [80, 82], [50, 96], [20, 82], [5, 48]], deco(g, s, M) { catFace(g, s, M, 52); } },
    { id: 'tree', say: 'a tree', col: '#6FA65F', rad: 5, lv: [2, 3], pts: [[50, 2], [80, 40], [64, 40], [94, 80], [60, 80], [60, 98], [40, 98], [40, 80], [6, 80], [36, 40], [20, 40]],
      deco(g, s, M) { poly(g, s, M, [[40, 79], [60, 79], [60, 98], [40, 98]], C.bark, 3, 0); poly(g, s, M, [[50, 2], [80, 40], [20, 40]], '#93C27A', 5, 0.35); for (const [x, y] of [[50, 27], [36, 60], [60, 54], [74, 71], [26, 72], [50, 70]]) gem(g, M, x, y, 3.3, '#E8664A'); } },
    { id: 'crown', say: 'a crown', col: '#F2B33D', rad: 4, lv: [2, 3], pts: [[4, 24], [27, 54], [50, 10], [73, 54], [96, 24], [88, 92], [12, 92]], ext: [[0, 18], [100, 18], [50, 3]],
      deco(g, s, M) { poly(g, s, M, [[13.6, 77], [86.4, 77], [88, 92], [12, 92]], '#DE962B', 3, 0); gem(g, M, 30, 84.5, 3.6, C.teal); gem(g, M, 50, 84.5, 4.4, '#E8664A'); gem(g, M, 70, 84.5, 3.6, C.teal); gem(g, M, 7, 28, 5.2, '#E8664A'); gem(g, M, 50, 16, 5.8, C.teal); gem(g, M, 93, 28, 5.2, '#E8664A'); stroke(g, M, [[20, 68], [80, 68]], 'rgba(255,255,255,.45)', 1.6); } },
    { id: 'fish', say: 'a fish', col: '#F08A4B', smooth: true, lv: [2, 3], pts: [[4, 50], [22, 30], [46, 22], [62, 28], [78, 40], [96, 22], [90, 50], [96, 80], [78, 62], [62, 74], [44, 80], [22, 70]],
      deco(g, s, M) { stroke(g, M, [[36, 31], [40, 50], [36, 69]], 'rgba(150,70,30,.55)', 1.5, true); poly(g, s, M, [[47, 48], [63, 43], [61, 61]], '#D9703A', 3, 0.3); for (const x of [84, 89]) stroke(g, M, [[x, 40], [x - 3, 50], [x, 62]], 'rgba(150,70,30,.45)', 1.3, true); disc(g, M, 22, 44, 5.2, '#FBF8F1'); eye(g, M, 22.6, 44.4, 3.2); smile(g, M, 13, 57, 3.6); cheeks(g, M, 25, 25, 55, 3.2); } },
    { id: 'heart', say: 'a heart', col: '#E8667A', smooth: true, lv: [2, 3], pts: [[50, 26], [62, 10], [80, 6], [94, 18], [96, 38], [84, 60], [50, 96], [16, 60], [4, 38], [6, 18], [20, 6], [38, 10]],
      deco(g, s, M) { stroke(g, M, [[13, 30], [16, 19], [27, 14]], 'rgba(255,255,255,.6)', 3, true); eye(g, M, 39, 42, 3.4); eye(g, M, 61, 42, 3.4); cheeks(g, M, 31, 69, 50, 4); smile(g, M, 50, 50, 5); } },
    { id: 'butterfly', say: 'a butterfly', col: '#EE9BB5', smooth: true, lv: [3], pts: [[50, 28], [64, 10], [86, 4], [97, 22], [90, 44], [74, 52], [88, 66], [82, 88], [64, 92], [50, 74], [36, 92], [18, 88], [12, 66], [26, 52], [10, 44], [3, 22], [14, 4], [36, 10]], ext: [[38, 0], [62, 0]],
      under(g, s, M) { for (const d of [-1, 1]) { stroke(g, M, [[50, 22], [50 + d * 5, 10], [50 + d * 11, 3]], INK, 1.3, true); disc(g, M, 50 + d * 11, 3, 1.9, INK); } },
      deco(g, s, M) { for (const d of [-1, 1]) { gem(g, M, 50 + d * 28, 25, 8.5, '#F9D272'); gem(g, M, 50 + d * 23, 71, 6.4, '#FBF8F1'); disc(g, M, 50 + d * 37, 36, 2.6, '#C9608A'); disc(g, M, 50 + d * 30, 82, 2.2, '#C9608A'); } poly(g, s, M, [[46.6, 26], [53.4, 26], [52.6, 80], [47.4, 80]], '#6E4E7E', 3, 0.4); disc(g, M, 50, 23, 5, '#6E4E7E'); eye(g, M, 48.2, 22.4, 1.3); eye(g, M, 51.8, 22.4, 1.3); } },
    { id: 'whale', say: 'a whale', col: '#5B8FC7', smooth: true, lv: [3], pts: [[4, 56], [10, 38], [26, 27], [46, 26], [62, 34], [72, 46], [80, 30], [70, 10], [84, 18], [96, 6], [98, 28], [92, 50], [80, 68], [60, 80], [34, 82], [14, 74]], ext: [[22, 2]],
      under(g, s, M) { for (const d of [-1, 1]) stroke(g, M, [[31, 26], [31 + d * 2, 13], [31 + d * 9, 5]], '#8FC4DA', 2.6, true); },
      deco(g, s, M) { poly(g, s, M, [[38, 58], [58, 56], [51, 78]], '#4A7BB0', 3, 0.45); eye(g, M, 22, 48, 3.2); cheeks(g, M, 29, 29, 57, 3.4); smile(g, M, 14, 62, 5.5); } },
  ];

  function lines() {
    const out = [NEXT], seen = {};
    for (const k in RULES) out.push(RULES[k].ask);
    for (const f of FIGS) out.push(`It's ${f.say}!`);
    for (const k in RULES) for (let i = 0; i < RULES[k].max; i++) out.push(nameOf(RULES[k].at(i)));
    return out.join(' ').match(/[^.!?…]+[.!?…]*/g).map((t) => t.trim()).filter((t) => { const key = K.voiceKey(t); if (!key || seen[key]) return false; seen[key] = 1; return true; });
  }

  /* ---------------- the desk ---------------- */
  function crayon(g, s, x, y, rot, col, len) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath(); A.cut(g, [[-12, -len / 2 + 30], [0, -len / 2], [12, -len / 2 + 30]], 4, 0, 2); A.paper(g, s, A.shade(col, -0.08), { shadow: 0.7 });
    g.beginPath(); A.rect(g, -17, -len / 2 + 26, 34, len - 26, 7, 3, 0.4); A.paper(g, s, col, { shadow: 0.9, light: 0.08, box: { x: -17, y: -len / 2, w: 34, h: len } });
    g.beginPath(); A.rect(g, -17, -len / 2 + 58, 34, len - 104, 2, 4, 0); g.fillStyle = A.mix(col, '#FFFFFF', 0.55); g.fill();
    A.line(g, A.alpha(col, 0.8), 3, (h) => { h.moveTo(-17, -len / 2 + 70); h.lineTo(17, -len / 2 + 70); h.moveTo(-17, len / 2 - 58); h.lineTo(17, len / 2 - 58); });
    g.restore();
  }
  function desk(g, s, W, H, sheet, slots, land, TH) {
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#D6A56E', { shadow: 0, light: 0.05, grain: 0.34, box: { x: 0, y: 0, w: W, h: H } });
    const rnd = A.rng(11);
    for (let y = 0; y < H; y += 118) { A.line(g, 'rgba(120,76,40,.22)', 3, (h) => { h.moveTo(0, y + 4); h.lineTo(W, y + 2); }); for (let i = 0; i < 3; i++) { const x = rnd() * W, l = 60 + rnd() * 160, yy = y + 20 + rnd() * 80; A.line(g, 'rgba(120,76,40,.12)', 2, (h) => { h.moveTo(x, yy); h.quadraticCurveTo(x + l / 2, yy + 6, x + l, yy); }); } }
    // the gallery cards the finished pictures are kept on
    slots.forEach((p, i) => {
      g.save(); g.translate(p.x, p.y); g.rotate([-0.04, 0.03, -0.02][i]);
      const h = TH / 2 + 10; g.beginPath(); A.rect(g, -h, -h, h * 2, h * 2, 12, i + 3, 1); A.paper(g, s, '#F3E7CF', { shadow: 0.8, box: { x: -h, y: -h, w: h * 2, h: h * 2 }, light: 0.03 });
      g.setLineDash([9, 9]); A.line(g, 'rgba(46,42,59,.22)', 2.5, (q) => A.rect(q, -h + 10, -h + 10, h * 2 - 20, h * 2 - 20, 8, 2, 0)); g.setLineDash([]);
      g.beginPath(); A.rect(g, -22, -h - 9, 44, 20, 4, 6, 0.5); A.paper(g, s, [A.alpha('#E8664A', 0.8), A.alpha('#2F8F8A', 0.8), A.alpha('#F2B33D', 0.85)][i], { shadow: 0.3, grain: 0.1 });
      g.restore();
    });
    // the sheet of drawing paper
    g.save(); g.translate(sheet.x + sheet.w / 2, sheet.y + sheet.h / 2); g.rotate(land ? -0.004 : 0);
    g.beginPath(); A.rect(g, -sheet.w / 2, -sheet.h / 2, sheet.w, sheet.h, 16, 5, 2); A.paper(g, s, '#FCF8EF', { depth: 1.5, light: 0.025, grain: 0.2, box: { x: -sheet.w / 2, y: -sheet.h / 2, w: sheet.w, h: sheet.h } });
    for (const d of [-1, 1]) { g.save(); g.translate(d * (sheet.w / 2 - 70), -sheet.h / 2 + 4); g.rotate(d * 0.5); g.beginPath(); A.rect(g, -44, -15, 88, 30, 3, 8, 1); A.paper(g, s, 'rgba(242,190,90,.78)', { shadow: 0.3, grain: 0.12 }); g.restore(); }
    g.restore();
    if (land) { crayon(g, s, W - 96, 330, 0.16, '#E8664A', 190); crayon(g, s, W - 60, 520, -0.1, '#2F8F8A', 176); crayon(g, s, W - 92, 716, 0.3, '#F2B33D', 184); crayon(g, s, W - 50, 868, -0.5, '#6E4E7E', 150); }
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const sheet = land ? { x: 212, y: 134, w: W - 212 - 150, h: H - 134 - 34 } : { x: 18, y: 134, w: W - 36, h: H - 134 - 174 };
    const TH = land ? 132 : 116;
    const slots = [0, 1, 2].map((i) => (land ? { x: 106, y: 262 + i * 206 } : { x: W / 2 + (i - 1) * 158, y: H - 86 }));
    st.add({ z: 0, sprite: A.sprite('dotsDesk' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => desk(g, s, W, H, sheet, slots, land, TH)) });
    const cx = sheet.x + sheet.w / 2, cy = sheet.y + sheet.h / 2;
    let R = null, made = 0, rounds = 0, skill = L === 1 ? 0 : 0.25, lastFig = '', lastRule = '', lastAct = 0, band = null, gen = 0;
    const gallery = [];

    /** A private bitmap of a finished picture (so the shared sprite cache does not fill up with them). */
    function bake(box, paint) {
      const pad = 18, s = st.res, c = document.createElement('canvas');
      c.width = Math.ceil((box[2] + pad * 2) * s); c.height = Math.ceil((box[3] + pad * 2) * s);
      const g = c.getContext('2d'); g.setTransform(s, 0, 0, s, (pad - box[0]) * s, (pad - box[1]) * s); paint(g, s);
      return { canvas: c, ox: pad - box[0], oy: pad - box[1], w: box[2] + pad * 2, h: box[3] + pad * 2 };
    }
    const discSprite = (r, col) => A.sprite('dotsDisc' + r + col, [-r - 3, -r - 3, r * 2 + 6, r * 2 + 6], (g, s) => {
      g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, col, { shadow: 0.9, light: 0.05, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
      g.beginPath(); g.arc(0, 0, r - 1.2, 0, 7); g.lineWidth = 2.4; g.strokeStyle = 'rgba(46,42,59,.5)'; g.stroke();
    });

    /* ---------- the pencil lines ---------- */
    const board = st.add({ z: 10, grow: 1, close: 0, fade: 1 });
    board.draw = (g) => {
      if (!R) return;
      const P = R.dots, n = R.next;
      g.globalAlpha *= board.fade; g.lineCap = 'round'; g.lineJoin = 'round';
      if (band && n > 0 && !R.busy) { const a = P[n - 1]; g.save(); g.setLineDash([4, 16]); g.strokeStyle = 'rgba(46,42,59,.5)'; g.lineWidth = 7; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(band.x, band.y); g.stroke(); g.restore(); }
      if (n < 2) return;
      const path = () => {
        g.beginPath(); g.moveTo(P[0].x, P[0].y);
        for (let i = 1; i < n - 1; i++) g.lineTo(P[i].x, P[i].y);
        const a = P[n - 2], b = P[n - 1], k = board.grow; g.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
        if (board.close > 0) g.lineTo(b.x + (P[0].x - b.x) * board.close, b.y + (P[0].y - b.y) * board.close);
      };
      path(); g.strokeStyle = A.shade(R.fig.col, -0.22); g.lineWidth = R.lw + 5; g.globalAlpha *= 0.35; g.stroke(); g.globalAlpha /= 0.35;
      path(); g.strokeStyle = '#3B3548'; g.lineWidth = R.lw; g.stroke();
    };

    /* ---------- a round ---------- */
    function clearRound() { if (!R) return; for (const d of R.dots) d.remove(); if (R.pic && !R.kept) R.pic.remove(); R = null; band = null; }
    function newRound(force) {
      force = force || {};
      clearRound(); gen++;
      let rule = force.rule || (L === 1 ? 'one' : L === 2 ? (rounds && Math.random() < 0.4 && lastRule !== 'abc' ? 'abc' : 'one') : (rounds ? K.pick(HARD.filter((r) => r !== lastRule)) : 'twos'));
      const base = (f) => f.pts.length;
      const pool = FIGS.filter((f) => f.lv.indexOf(L) >= 0 && f.id.replace('1', '') !== lastFig.replace('1', '') && base(f) <= RULES[rule].max && (L > 1 || rounds > 0 || base(f) <= 5));
      const fig = (force.fig && FIGS.find((f) => f.id === force.fig)) || K.pick(pool);
      const want = force.n || (L === 1 ? base(fig) : L === 2 ? Math.round(8 + skill * 7) : Math.round(15 + skill * (RULES[rule].max - 15)));
      const target = Math.min(RULES[rule].max, Math.max(base(fig), want));
      lastFig = fig.id; lastRule = rule; rounds++;

      // fit the figure on the sheet (it may stretch a little to fill a tall or wide sheet)
      const all = fig.pts.concat(fig.ext || []), xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
      const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
      const padX = land ? 70 : 52, padY = 62, aw = sheet.w - padX * 2, ah = sheet.h - padY * 2, s0 = Math.min(aw / bw, ah / bh);
      const sx = Math.min(aw / bw, s0 * 1.25), sy = Math.min(ah / bh, s0 * (land ? 1.25 : 1.36)), u = Math.min(sx, sy);
      const M = { p: (x, y) => [(x - bx - bw / 2) * sx, (y - by - bh / 2) * sy], u };
      const pts0 = fig.pts.map(([x, y]) => M.p(x, y));
      // more dots: halve the longest edge, as long as every dot stays minD away from the others
      let pts = pts0.slice();
      const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), minD = L === 3 ? 66 : 92;
      while (pts.length < target) {
        let best = -1, bl = minD * 2 - 0.01, bm = null;
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], d = dist(a, b); if (d <= bl) continue; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (pts.every((q) => q === a || q === b || dist(q, m) >= minD)) { best = i; bl = d; bm = m; } }
        if (best < 0) break;
        pts.splice(best + 1, 0, bm);
      }
      const k0 = K.randInt(0, pts.length - 1); pts = pts.slice(k0).concat(pts.slice(0, k0)); if (Math.random() < 0.5) pts = [pts[0]].concat(pts.slice(1).reverse());
      const n = pts.length, labels = pts.map((p, i) => RULES[rule].at(i));
      let near = 1e9; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) near = Math.min(near, dist(pts[i], pts[j]));
      const r = Math.round(K.clamp(near * 0.4, 24, L === 1 ? 56 : L === 2 ? 40 : 32));
      const me = (R = { fig, rule, n, labels, next: 0, misses: 0, here: 0, pulse: L === 1, busy: false, r, near, lw: K.clamp(r * 0.3, 8, 11), M, pts0, dots: [], box: [-bw * sx / 2 - 8, -bh * sy / 2 - 8, bw * sx + 16, bh * sy + 16] });
      board.grow = 1; board.close = 0; board.fade = 1; board.tweens.length = 0;
      pts.forEach((p, i) => {
        const txt = String(labels[i]);
        const d = st.add({ z: i ? 20 : 21, x: cx + p[0], y: cy + p[1], sx: 0, sy: 0, i, txt, hitR: r + 12, pad: 0, label: 'dot ' + txt, joined: false, wob: 0, fs: Math.round(r * (txt.length > 2 ? 0.78 : txt.length > 1 ? 0.98 : 1.16)) });
        d._bsx = d._bsy = 1;
        d.to({ sx: 1, sy: 1 }, { dur: 0.32, ease: 'back', delay: 0.12 + i * 0.035 });
        d.update = (dt) => { d.wob = Math.max(0, d.wob - dt * 2.2); };
        d.draw = (g) => {
          const next = !me.busy && i === me.next;
          if (next && me.pulse) { const q = Math.sin(st.t * 6.5); g.beginPath(); g.arc(0, 0, r + 11 + q * 5, 0, 7); g.fillStyle = A.alpha('#F2B33D', 0.5 - q * 0.12); g.fill(); const k = 1 + q * 0.07; g.scale(k, k); }
          if (d.wob) { g.translate(Math.sin(st.t * 40) * 9 * d.wob, 0); g.rotate(Math.sin(st.t * 31) * 0.22 * d.wob); }
          const sp = discSprite(r, d.joined ? A.mix(fig.col, '#FFFFFF', 0.3) : '#FFFDF7'); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
          g.font = `700 ${d.fs}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.ink; g.fillText(txt, 0, r * 0.07);
        };
        d.onTap = (p2) => tap(p2 ? resolve(p2, i) : i);
        me.dots.push(d);
      });
      st.root._sorted = false;
      K.sfx.whoosh(); lastAct = st.t;
      ctx.prompt(RULES[rule].ask, land ? null : { show: RULES[rule].show });
    }
    /** Which dot a touch means: the next dot wins when the finger is about as near to it as to any other. */
    function resolve(p, i) {
      const nx = R.dots[R.next]; if (!nx) return i;
      let best = i, bd = 1e9; for (const d of R.dots) if (!d.joined) { const q = Math.hypot(d.x - p.x, d.y - p.y); if (q < bd) { bd = q; best = d.i; } }
      return Math.hypot(nx.x - p.x, nx.y - p.y) <= Math.max(bd * 1.3, R.r) ? R.next : best;
    }
    function tap(i) {
      if (!R || R.busy) return;
      const d = R.dots[i]; if (!d) return;
      lastAct = st.t;
      if (d.joined) { K.sfx.tap(); return; }
      if (i === R.next) join(i); else miss(i);
    }
    function join(i) {
      const d = R.dots[i], fig = R.fig;
      d.joined = true; d.z = 19; R.next++; R.here = 0; R.pulse = L === 1; lastAct = st.t;
      K.sfx.step(i % 10); K.say(nameOf(R.labels[i]));
      d._bsx = d._bsy = 0.86; d.to({ sx: 1.3, sy: 1.3 }, { dur: 0.09, ease: 'out' }).then(() => d.to({ sx: 0.86, sy: 0.86 }, { dur: 0.36, ease: 'elastic' }));
      ctx.fx.burst(d.x, d.y, { n: 5, color: fig.col });
      board.grow = i ? 0 : 1; if (i) board.to({ grow: 1 }, { dur: 0.16, ease: 'out' });
      if (R.next >= R.n) finish(); else { R.dots[R.next].z = 21; st.root._sorted = false; }
    }
    function miss(i) {
      const d = R.dots[i]; R.misses++; R.here++; d.wob = 1; K.sfx.whoops();
      ctx.say(NEXT + ' ' + nameOf(R.labels[R.next]));
      if (R.here >= 2) R.pulse = true;
    }
    async function finish() {
      const r = R, my = gen, fig = r.fig; r.busy = true; band = null;
      await board.to({ close: 1 }, { dur: 0.4, ease: 'inOut', delay: 0.2 }); if (my !== gen) return;
      const sp = bake(r.box, (g, s) => {
        if (fig.under) fig.under(g, s, r.M);
        g.beginPath(); if (fig.smooth) A.smooth(g, r.pts0); else A.cut(g, r.pts0, (fig.rad || 6) * r.M.u, 0, 5);
        A.paper(g, s, fig.col, { depth: 1.5, light: 0.07, box: { x: r.box[0], y: r.box[1], w: r.box[2], h: r.box[3] } });
        fig.deco(g, s, r.M);
      });
      const pic = (r.pic = st.add({ z: 30, x: cx, y: cy, sprite: sp, alpha: 0, k: 0.86, wig: 1, tilt: 0 }));
      pic.update = () => { const q = Math.sin(st.t * 11) * 0.024 * pic.wig; pic.sx = pic.k * (1 + q); pic.sy = pic.k * (1 - q); pic.rot = pic.tilt + Math.sin(st.t * 5.5) * (0.012 + 0.05 * pic.wig); };
      pic.to({ alpha: 1 }, { dur: 0.3 }); pic.to({ k: 1 }, { dur: 0.55, ease: 'back' });
      board.to({ fade: 0 }, { dur: 0.35 });
      r.dots.forEach((d, i) => d.to({ sx: 0, sy: 0, alpha: 0 }, { dur: 0.28, delay: i * 0.012, ease: 'inOut' }));
      K.sfx.sparkle(); K.sfx.ding(); ctx.fx.burst(cx, cy, { n: 22 });
      for (let i = 0; i < 4; i++) ctx.after(160 + i * 170, () => { const a = Math.random() * 6.28; ctx.fx.burst(cx + Math.cos(a) * r.box[2] * 0.36, cy + Math.sin(a) * r.box[3] * 0.36, { n: 6, color: fig.col }); });
      await ctx.wait(650); if (my !== gen) return;
      await Promise.all([ctx.say(`It's ${fig.say}!`), ctx.wait(1900)]); if (my !== gen) return;
      // peg it up in the gallery
      const slot = slots[made % ROUNDS], k = TH / Math.max(r.box[2], r.box[3]);
      made++; r.kept = true; gallery.push(pic); K.sfx.whoosh();
      await Promise.all([pic.to({ x: slot.x, y: slot.y + 4, k, wig: 0, tilt: [-0.04, 0.03, -0.02][(made - 1) % 3] }, { dur: 0.6, ease: 'inOut' }), ctx.wait(700)]); if (my !== gen) return;
      K.sfx.pop();
      skill = K.clamp(skill + (r.misses <= 1 ? 0.25 : r.misses >= 4 ? -0.25 : 0), 0, 1);
      if (made % ROUNDS === 0) {
        gallery.forEach((p, i) => { p.wig = 0.6; ctx.after(i * 120, () => K.sfx.step(i * 2)); });
        await ctx.celebrate({ ms: 3400 }); if (my !== gen) return;
        for (const p of gallery.splice(0)) p.to({ alpha: 0, k: p.k * 0.5 }, { dur: 0.35, ease: 'inOut' }).then(() => p.remove());
        await ctx.wait(400); if (my !== gen) return;
      }
      newRound();
    }

    /* ---------- drawing a line from dot to dot ---------- */
    const segDist = (d, a, b) => { const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy; const t = l2 ? K.clamp(((d.x - a.x) * vx + (d.y - a.y) * vy) / l2, 0, 1) : 0; return Math.hypot(d.x - a.x - vx * t, d.y - a.y - vy * t); };
    st.ondown = (p, e, n) => { if (R && !R.busy && n && n.i != null) K.sfx.tap(); };
    st.onmove = (p, e, s) => {
      if (!s || !R || R.busy || (s.n && s.n.ui)) return;
      const a = s.prev || { x: s.sx, y: s.sy }; s.prev = { x: p.x, y: p.y };
      if (s.moved < 16) return;
      band = p; lastAct = st.t;
      for (let k = 0; k < 3 && R && !R.busy; k++) { if (segDist(R.dots[R.next], a, p) > R.r + 10) break; st.cancelTaps(); join(R.next); }
    };
    st.onup = () => { band = null; };
    ctx.every(1000, () => { if (R && !R.busy && st.t - lastAct > 9) R.pulse = true; });

    K._dots = { // for browser tests
      get R() { return R && { fig: R.fig.id, rule: R.rule, n: R.n, next: R.next, labels: R.labels, misses: R.misses, busy: R.busy, pulse: R.pulse, r: R.r, near: R.near, dots: R.dots.map((d) => ({ x: d.x, y: d.y, joined: d.joined, txt: d.txt })) }; },
      get made() { return made; }, get skill() { return skill; }, set skill(v) { skill = v; },
      tap, round: newRound, figs: FIGS.map((f) => f.id), rules: Object.keys(RULES), sheet,
    };
    ctx.onExit(() => { K._dots = null; });
    ctx.after(300, () => newRound());
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#D6A56E'; g.fillRect(0, 0, w, w);
    g.save(); g.translate(w / 2, w / 2); g.rotate(-0.04); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 14 * u; g.shadowOffsetY = 6 * u;
    g.fillStyle = '#FCF8EF'; g.beginPath(); g.roundRect ? g.roundRect(-128 * u, -128 * u, 256 * u, 256 * u, 16 * u) : g.rect(-128 * u, -128 * u, 256 * u, 256 * u); g.fill(); g.restore();
    const P = starPts(150, 156, 104, 46).map(([x, y]) => [x * u, y * u]);
    g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = 'rgba(242,179,61,.38)'; g.fill();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); for (let i = 0; i <= 6; i++) (i ? g.lineTo(P[i][0], P[i][1]) : g.moveTo(P[i][0], P[i][1])); g.strokeStyle = '#3B3548'; g.lineWidth = 8 * u; g.stroke();
    g.setLineDash([3 * u, 13 * u]); g.beginPath(); g.moveTo(P[6][0], P[6][1]); for (let i = 7; i <= 10; i++) g.lineTo(P[i % 10][0], P[i % 10][1]); g.strokeStyle = 'rgba(59,53,72,.45)'; g.lineWidth = 6 * u; g.stroke(); g.setLineDash([]);
    g.font = `700 ${22 * u}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    P.forEach((p, i) => {
      g.beginPath(); g.arc(p[0], p[1], 19 * u, 0, 7); g.fillStyle = i <= 6 ? '#F9D272' : '#FFFDF7'; g.fill(); g.lineWidth = 2.5 * u; g.strokeStyle = 'rgba(46,42,59,.6)'; g.stroke();
      g.fillStyle = '#2E2A3B'; g.fillText(String(i + 1), p[0], p[1] + 1.5 * u);
    });
  }

  K.game({ id: 'dots', title: 'Dot to Dot', voice: 'dots', group: 'arcade', age: 5, order: 25, icon, start, lines, resize: () => K.go('dots') });
})();
