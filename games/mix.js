/* Colour Mixer — a paint lab.
   Jars of paint stand on a shelf. Tap a jar and a dollop flies into the big glass pot; the paint in
   the pot changes colour smoothly, sloshes and bubbles. An "empty the pot" button starts again.
   The mixing is a paint (subtractive) model on the red-yellow-blue wheel: yellow and blue give green,
   all three give brown, white tints and black shades. Only the proportions matter, never the amount.

   Level 1: red, yellow, blue. Free mixing first (each colour names itself, discoveries are announced),
            then "Can you make green?" with the two jars glowing.
   Level 2: white and black join. Make orange, green, purple, pink, light blue, grey, brown from a swatch.
   Level 3: match a colour by ratio from a written recipe ("2 yellow + 1 blue"), lighter and darker with
            white and black, and predict-then-test rounds ("What will blue and red make?").
   Every colour made is used to paint a paper picture, which is pegged up in the gallery. */
(function () {
  'use strict';
  const A = K.art;
  const KEYS = ['red', 'yellow', 'blue', 'white', 'black'];
  const PIG = { red: '#E23D30', yellow: '#F9D62E', blue: '#2B62C8', white: '#FBF8F1', black: '#2E2A3B' };
  const CAP = 9;                                  // dollops the pot holds
  const INK = '#2E2A3B', CREAM = '#FBF6EC';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = (c) => '#' + c.map((v) => Math.round(K.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const sum = (p) => KEYS.reduce((n, k) => n + (p[k] || 0), 0);

  /* ---------------- the paint model ----------------
     The corners of the red-yellow-blue cube are hand-picked paint colours (index = red*4 + yellow*2 + blue);
     a mixture is placed in the cube by its proportions and read off by interpolation. */
  const CUBE = ['#FBF8F1', '#2B62C8', '#F9D62E', '#3AA048', '#E23D30', '#8044A6', '#F28A22', '#7A5230'].map(hex);
  function mixRgb(p) {
    const r = p.red || 0, y = p.yellow || 0, b = p.blue || 0, w = p.white || 0, k = p.black || 0, c = r + y + b, n = c + w + k;
    if (!n) return null;
    let out = CUBE[0];
    if (c) {
      const m = Math.max(r, y, b), R = r / m, Y = y / m, B = b / m;
      out = mix3(mix3(mix3(CUBE[0], CUBE[4], R), mix3(CUBE[2], CUBE[6], R), Y), mix3(mix3(CUBE[1], CUBE[5], R), mix3(CUBE[3], CUBE[7], R), Y), B);
      if (w) out = mix3(out, CUBE[0], w / (c + w));
    }
    if (k) out = mix3(out, hex(PIG.black), Math.pow(k / n, 0.8));
    return out;
  }
  const mixHex = (p) => toHex(mixRgb(p) || CUBE[0]);
  /** Same pigments, and each one's share of the pot within tol of the recipe's. */
  function matches(p, recipe, tol) {
    const tp = sum(p), tr = sum(recipe); if (!tp) return false;
    for (const k of KEYS) { if (!p[k] !== !recipe[k]) return false; if (Math.abs((p[k] || 0) / tp - (recipe[k] || 0) / tr) > tol + 1e-6) return false; }
    return true;
  }
  const sameSet = (p, recipe) => KEYS.every((k) => !p[k] === !recipe[k]);

  const NAMED = [
    { key: 'orange', name: 'orange', tier: 0, r: { red: 1, yellow: 1 }, line: 'Red and yellow make orange!', ask: 'What will red and yellow make?' },
    { key: 'green', name: 'green', tier: 0, r: { yellow: 1, blue: 1 }, line: 'Yellow and blue make green!', ask: 'What will yellow and blue make?' },
    { key: 'purple', name: 'purple', tier: 0, r: { red: 1, blue: 1 }, line: 'Red and blue make purple!', ask: 'What will red and blue make?' },
    { key: 'pink', name: 'pink', tier: 1, r: { red: 1, white: 1 }, line: 'Red and white make pink!', ask: 'What will red and white make?' },
    { key: 'lightblue', name: 'light blue', tier: 1, r: { blue: 1, white: 1 }, line: 'Blue and white make light blue!', ask: 'What will blue and white make?' },
    { key: 'grey', name: 'grey', tier: 1, r: { white: 1, black: 1 }, line: 'Black and white make grey!', ask: 'What will black and white make?' },
    { key: 'brown', name: 'brown', tier: 2, r: { red: 1, yellow: 1, blue: 1 }, line: 'Red, yellow and blue make brown!' },
  ];
  const RATIO = [
    { key: 'lime', name: 'lime green', tier: 0, r: { yellow: 2, blue: 1 } },
    { key: 'sea', name: 'sea green', tier: 0, r: { blue: 2, yellow: 1 } },
    { key: 'amber', name: 'golden orange', tier: 0, r: { yellow: 2, red: 1 } },
    { key: 'flame', name: 'flame red', tier: 0, r: { red: 2, yellow: 1 } },
    { key: 'violet', name: 'violet', tier: 0, r: { blue: 2, red: 1 } },
    { key: 'berry', name: 'berry red', tier: 0, r: { red: 2, blue: 1 } },
    { key: 'rose', name: 'pale pink', tier: 1, r: { white: 2, red: 1 } },
    { key: 'sky', name: 'sky blue', tier: 1, r: { white: 3, blue: 1 } },
    { key: 'maroon', name: 'dark red', tier: 1, r: { red: 3, black: 1 } },
    { key: 'navy', name: 'navy blue', tier: 1, r: { blue: 2, black: 1 } },
    { key: 'silver', name: 'light grey', tier: 1, r: { white: 3, black: 1 } },
    { key: 'mint', name: 'mint green', tier: 2, r: { white: 2, yellow: 1, blue: 1 } },
    { key: 'lilac', name: 'lilac', tier: 2, r: { white: 2, red: 1, blue: 1 } },
    { key: 'peach', name: 'peach', tier: 2, r: { white: 2, red: 1, yellow: 1 } },
    { key: 'forest', name: 'forest green', tier: 2, r: { yellow: 1, blue: 1, black: 1 } },
  ];
  const order = (r) => KEYS.filter((k) => r[k]).sort((a, b) => r[b] - r[a]);
  const recipeText = (r) => order(r).map((k) => r[k] + ' ' + k).join(' + ');

  const T = {
    name: (k) => cap(k) + '.',
    free: 'Tap a jar to pour the paint. What will you make?',
    can: (N) => `Can you make ${N.name}?`,
    canThis: 'Can you make this colour?', read: 'Read the recipe.',
    notIn: 'That colour is not in this one.', empty: 'Empty the pot and try again.', full: 'The pot is full.',
    more: (k) => `Add more ${k}.`,
    paint: 'Now paint the picture!', match: 'It matches!',
    test: 'Now test it!', right: 'Your guess was right!', surprise: 'Surprise!',
  };
  function lines() {
    const all = [T.free, T.canThis, T.read, T.notIn, T.empty, T.full, T.paint, T.match, T.test, T.right, T.surprise];
    for (const k of KEYS) all.push(T.name(k), T.more(k));
    for (const N of NAMED) { all.push(N.line, T.can(N)); if (N.ask) all.push(N.ask); }
    const seen = {}, out = [];
    for (const t of all) for (const s of t.match(/[^.!?…]+[.!?…]*/g) || []) { const key = K.voiceKey(s); if (key && !seen[key]) { seen[key] = 1; out.push(s.trim()); } }
    return out;
  }

  /* ---------------- drawing ---------------- */
  const P = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);
  const dropPath = (h, x, y, r) => { h.moveTo(x, y - r * 1.7); h.bezierCurveTo(x + r * 0.25, y - r, x + r, y - r * 0.35, x + r, y + r * 0.1); h.arc(x, y + r * 0.1, r, 0, Math.PI); h.bezierCurveTo(x - r, y - r * 0.35, x - r * 0.25, y - r, x, y - r * 1.7); h.closePath(); };
  function drop(g, x, y, r, col) {
    g.beginPath(); dropPath(g, x, y, r); g.fillStyle = col; g.fill();
    g.strokeStyle = col === PIG.white ? 'rgba(46,42,59,.4)' : 'rgba(46,42,59,.14)'; g.lineWidth = Math.max(1.5, r * 0.1); g.stroke();
    g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.05, r * 0.2, r * 0.36, 0.5, 0, 7); g.fillStyle = col === PIG.black ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.55)'; g.fill();
  }
  function swatch(g, s, x, y, r, col, seed) { g.beginPath(); A.blob(g, x, y, r, r * 0.93, 0.07, seed || 3, 11); A.paper(g, s, col, { shadow: 0.6, light: 0.07, box: { x: x - r, y: y - r, w: r * 2, h: r * 2 } }); }

  /** A paint tin, base centre at (0,0). */
  function jarArt(g, s, key) {
    const col = PIG[key], top = key === 'black' ? '#4B4660' : key === 'white' ? '#FFFFFF' : A.shade(col, 0.09), side = key === 'white' ? '#F1EADB' : col;
    P(g, s, side, (h) => A.rect(h, -54, -120, 108, 120, [8, 8, 22, 22], 3, 0.8), { box: { x: -54, y: -120, w: 108, h: 120 }, light: 0.09, depth: 1.1 });
    if (key === 'white') A.line(g, 'rgba(46,42,59,.2)', 2.5, (h) => A.rect(h, -54, -120, 108, 120, [8, 8, 22, 22], 3, 0.8));
    g.beginPath(); g.ellipse(0, -120, 58, 17, 0, 0, 7); A.paper(g, s, '#E9E1D0', { shadow: 0.5, light: 0 });
    g.beginPath(); g.ellipse(0, -120, 49, 12, 0, 0, 7); g.fillStyle = top; g.fill();
    g.beginPath(); g.ellipse(-14, -122, 18, 4, -0.1, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
    g.beginPath(); A.rect(g, 22, -122, 17, 50, 8.5, 5, 0); g.fillStyle = top; g.fill();                       // a drip down the side
    P(g, s, key === 'white' ? '#E6DECC' : CREAM, (h) => A.rect(h, -36, -86, 60, 62, 12, 6, 0.7), { shadow: 0.35, light: 0.03 });
    drop(g, -6, -50, 15, col);
    A.line(g, 'rgba(255,255,255,.35)', 5, (h) => { h.moveTo(-44, -100); h.lineTo(-44, -26); });
  }

  /* Paper pictures to paint, about 220 across around (0,0). c is the colour of the part that gets painted. */
  const detail = 'rgba(46,42,59,.22)';
  const eye = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#FFFFFF'; g.fill(); g.beginPath(); g.arc(x + r * 0.15, y + r * 0.1, r * 0.55, 0, 7); g.fillStyle = INK; g.fill(); };
  const PICS = {
    flower(g, s, c) {
      A.line(g, '#4F8752', 10, (h) => { h.moveTo(0, 10); h.quadraticCurveTo(-14, 70, 2, 116); });
      for (const k of [-1, 1]) P(g, s, '#6FA65F', (h) => { h.moveTo(-2, 86); h.quadraticCurveTo(k * 42, 40, k * 76, 60); h.quadraticCurveTo(k * 44, 104, -2, 86); }, { shadow: 0.4 });
      for (let i = 0; i < 6; i++) { g.save(); g.translate(0, -34); g.rotate((i * Math.PI) / 3); P(g, s, c, (h) => h.ellipse(0, -52, 27, 40, 0, 0, 7), { shadow: 0.45, box: { x: -27, y: -92, w: 54, h: 80 } }); A.line(g, detail, 3, (h) => { h.moveTo(0, -30); h.lineTo(0, -66); }); g.restore(); }
      P(g, s, '#F2B33D', (h) => A.blob(h, 0, -34, 27, 26, 0.05, 4, 10), { shadow: 0.4, box: { x: -27, y: -60, w: 54, h: 54 } });
      for (const [x, y] of [[-8, -40], [8, -38], [0, -26], [-10, -26], [10, -24]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fillStyle = '#C98A2B'; g.fill(); }
    },
    fish(g, s, c) {
      P(g, s, c, (h) => A.cut(h, [[58, 0], [116, -52], [104, 0], [116, 52]], 10, 1, 3), { shadow: 0.5, box: { x: 58, y: -52, w: 58, h: 104 } });
      P(g, s, c, (h) => A.cut(h, [[-30, -50], [20, -88], [30, -44]], 9, 1, 5), { shadow: 0.4 });
      P(g, s, c, (h) => A.smooth(h, [[-106, 4], [-78, -42], [-20, -62], [40, -40], [76, 0], [40, 44], [-20, 62], [-78, 46]]), { box: { x: -106, y: -62, w: 182, h: 124 } });
      A.line(g, detail, 3.5, (h) => { for (const [x, y] of [[-20, -18], [14, -4], [-16, 16], [22, 22], [40, -22], [-46, 0]]) { h.moveTo(x + 14, y - 12); h.quadraticCurveTo(x - 4, y, x + 14, y + 12); } h.moveTo(92, -26); h.lineTo(74, -6); h.moveTo(92, 26); h.lineTo(74, 8); });
      eye(g, -66, -10, 13); A.line(g, INK, 4, (h) => { h.moveTo(-98, 18); h.quadraticCurveTo(-88, 28, -76, 24); });
      for (const [x, y, r] of [[-112, -52, 9], [-96, -80, 6]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.strokeStyle = 'rgba(91,143,199,.8)'; g.lineWidth = 3.5; g.stroke(); }
    },
    butterfly(g, s, c) {
      A.line(g, '#5C4A3A', 4, (h) => { h.moveTo(-4, -62); h.quadraticCurveTo(-18, -96, -34, -100); h.moveTo(4, -62); h.quadraticCurveTo(18, -96, 34, -100); });
      for (const k of [-1, 1]) {
        P(g, s, c, (h) => A.smooth(h, [[k * 8, -6], [k * 40, -84], [k * 96, -92], [k * 112, -44], [k * 70, 0]]), { shadow: 0.5, box: { x: k > 0 ? 8 : -112, y: -92, w: 104, h: 92 } });
        P(g, s, c, (h) => A.smooth(h, [[k * 8, 4], [k * 72, 6], [k * 90, 50], [k * 54, 90], [k * 18, 60]]), { shadow: 0.5, box: { x: k > 0 ? 8 : -90, y: 4, w: 82, h: 86 } });
        for (const [x, y, r] of [[70, -54, 17], [54, 46, 13], [92, -66, 7]]) { g.beginPath(); g.arc(k * x, y, r, 0, 7); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill(); g.strokeStyle = detail; g.lineWidth = 3; g.stroke(); }
      }
      P(g, s, '#5C4A3A', (h) => A.rect(h, -10, -66, 20, 132, 10, 3, 0.4), { shadow: 0.5 });
    },
    bird(g, s, c) {
      A.line(g, '#E8664A', 6, (h) => { h.moveTo(0, 70); h.lineTo(-4, 106); h.moveTo(26, 68); h.lineTo(28, 106); h.moveTo(-18, 106); h.lineTo(8, 106); h.moveTo(14, 106); h.lineTo(40, 106); });
      P(g, s, c, (h) => A.cut(h, [[60, 10], [122, -26], [112, 34]], 10, 1, 2), { shadow: 0.5 });
      P(g, s, c, (h) => A.blob(h, 10, 16, 80, 62, 0.03, 5, 12), { box: { x: -70, y: -46, w: 160, h: 124 } });
      P(g, s, '#F2B33D', (h) => A.cut(h, [[-90, -58], [-128, -42], [-90, -30]], 6, 0.6, 4), { shadow: 0.4 });
      P(g, s, c, (h) => h.arc(-56, -46, 42, 0, 7), { shadow: 0.4, box: { x: -98, y: -88, w: 84, h: 84 } });
      g.beginPath(); A.smooth(g, [[-20, 6], [30, -14], [78, 16], [34, 50]]); g.fillStyle = 'rgba(46,42,59,.14)'; g.fill();
      A.line(g, detail, 3.5, (h) => { h.moveTo(0, 16); h.quadraticCurveTo(30, 6, 56, 20); h.moveTo(8, 32); h.quadraticCurveTo(30, 24, 48, 34); });
      eye(g, -66, -54, 11);
    },
    turtle(g, s, c) {
      for (const [x, w] of [[-70, 34], [34, 36]]) P(g, s, '#7DB56A', (h) => A.rect(h, x, 30, w, 52, 14, x + 80, 0.6), { shadow: 0.4 });
      P(g, s, '#7DB56A', (h) => A.cut(h, [[70, 30], [116, 44], [72, 54]], 7, 0.6, 3), { shadow: 0.3 });
      P(g, s, '#7DB56A', (h) => A.blob(h, -98, 6, 34, 30, 0.04, 6, 10), { shadow: 0.5, box: { x: -132, y: -24, w: 68, h: 60 } });
      P(g, s, c, (h) => { h.moveTo(-84, 44); h.bezierCurveTo(-80, -70, 80, -70, 84, 44); h.closePath(); }, { box: { x: -84, y: -44, w: 168, h: 88 } });
      A.line(g, detail, 4, (h) => { h.moveTo(-30, -36); h.lineTo(-40, 42); h.moveTo(30, -36); h.lineTo(40, 42); h.moveTo(-70, 2); h.lineTo(70, 2); });
      P(g, s, '#E9DFC6', (h) => A.rect(h, -90, 38, 180, 14, 7, 2, 0.5), { shadow: 0.3 });
      eye(g, -108, -2, 8); A.line(g, INK, 3.5, (h) => { h.moveTo(-124, 16); h.quadraticCurveTo(-114, 24, -104, 20); });
    },
  };
  const PIC_NAMES = Object.keys(PICS);
  const picSprite = (name, col) => A.sprite('mixpic-' + name + col, [-134, -110, 268, 232], (g, s) => PICS[name](g, s, col));

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const keys = L === 1 ? KEYS.slice(0, 3) : KEYS, n = keys.length;
    const shelfY = land ? 344 : 612, tableY = land ? 852 : 1030, potX = W / 2, potS = land ? 1 : 0.88;
    const gap = Math.min(land ? 172 : 150, (W - 36) / n), jarS = Math.min(1, gap / 126);
    const B = land ? { x: 36, y: 388, w: 300, h: 440 } : { x: 30, y: 142, w: W - 60, h: 272 };
    const parts = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
    const total = () => sum(parts);
    let R = null, won = 0, skill = 0, pending = 0, evalAt = 0, quietUntil = 0, roundNo = 0, lastKey = '', hintAt = 0, freeDue = L === 1, picNo = K.randInt(0, 4), waitPaint = null;
    const doneKeys = {}, gallery = [];
    const pot = { lv: 0, col: CUBE[0].slice(), slosh: 0, shake: 0, bubbles: [], swirls: [] };
    const speak = (t, quiet) => { quietUntil = st.t + (quiet || 2.4); return ctx.say(t); };
    const glug = (f) => { K.sfx.tone(f || 300, 0.13, { to: (f || 300) * 0.55, vol: 0.2 }); K.sfx.noise(0.05, { freq: 900, vol: 0.08 }); };

    /* ---------- the room ---------- */
    const key = Math.round(W) + 'x' + Math.round(H) + 'n' + n;
    st.add({ z: 0, sprite: A.sprite('mixroom' + key, [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#F4E7CF', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.03, grain: 0.3 });
      const rnd = A.rng(11), cols = [PIG.red, PIG.yellow, PIG.blue, '#3AA048', '#F28A22', '#8044A6'];
      for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * tableY, r = 12 + rnd() * 34; g.beginPath(); A.blob(g, x, y, r, r * 0.9, 0.16, i + 2, 9); g.fillStyle = A.alpha(cols[i % 6], 0.1); g.fill(); }
      // the shelf the jars stand on
      const sw = gap * n + 40, sx = W / 2 - sw / 2;
      for (const x of [sx + 46, sx + sw - 46]) P(g, s, '#A9744A', (h) => A.cut(h, [[x - 9, shelfY + 10], [x + 9, shelfY + 10], [x + 7, shelfY + 52], [x - 7, shelfY + 46]], 4, 0.5, 2), { shadow: 0.5 });
      P(g, s, '#C99666', (h) => A.rect(h, sx, shelfY - 2, sw, 20, 6, 4, 0.6), { shadow: 1, box: { x: sx, y: shelfY, w: sw, h: 20 }, light: 0.07 });
      // the table
      P(g, s, '#B98558', (h) => h.rect(-20, tableY + 34, W + 40, H - tableY), { shadow: 0, box: { x: 0, y: tableY, w: 0, h: H - tableY }, light: 0.06 });
      P(g, s, '#DDB083', (h) => A.rect(h, -20, tableY, W + 40, 44, 4, 2, 0.6), { shadow: 0.8, box: { x: 0, y: tableY, w: 0, h: 44 }, light: 0.07 });
      A.line(g, 'rgba(255,255,255,.3)', 3, (h) => { h.moveTo(0, tableY + 5); h.lineTo(W, tableY + 5); });
      for (let i = 0; i < 7; i++) { const x = rnd() * W, y = tableY + 70 + rnd() * (H - tableY - 100), r = 8 + rnd() * 16; g.beginPath(); A.blob(g, x, y, r * 1.5, r * 0.6, 0.2, i + 40, 9); g.fillStyle = A.alpha(cols[i % 6], 0.5); g.fill(); }
      if (land) { // a line to peg the pictures on, and a cup of brushes
        A.line(g, '#8A5A3C', 4, (h) => { h.moveTo(W - 326, 424); h.quadraticCurveTo(W - 170, 452, W - 14, 420); });
        const cx = W - 150, cy = tableY;
        [[-16, -0.25, PIG.red], [0, 0.02, PIG.blue], [15, 0.28, PIG.yellow]].forEach(([dx, rot, c]) => { g.save(); g.translate(cx + dx, cy - 60); g.rotate(rot); P(g, s, '#C99666', (h) => A.rect(h, -5, -62, 10, 70, 4, 3, 0.3), { shadow: 0.4 }); g.fillStyle = '#B9BEC9'; g.fillRect(-6, -74, 12, 16); g.beginPath(); g.moveTo(-7, -74); g.quadraticCurveTo(0, -116, 7, -74); g.fillStyle = c; g.fill(); g.restore(); });
        P(g, s, '#2F8F8A', (h) => A.cut(h, [[cx - 40, cy - 78], [cx + 40, cy - 78], [cx + 32, cy + 2], [cx - 32, cy + 2]], 8, 0.6, 4), { box: { x: cx - 40, y: cy - 78, w: 80, h: 80 }, light: 0.08 });
        P(g, s, CREAM, (h) => A.rect(h, cx - 38, cy - 56, 76, 14, 3, 5, 0.3), { shadow: 0 });
      }
    }) });

    /* ---------- the pot ---------- */
    const bowl = (h) => { h.moveTo(-180, -264); h.bezierCurveTo(-206, -120, -150, -8, -70, -6); h.lineTo(70, -6); h.bezierCurveTo(150, -8, 206, -120, 180, -264); h.closePath(); };
    const topY = () => -18 - pot.lv * 200;
    const potTrim = A.sprite('mixpot', [-200, -290, 400, 310], (g, s) => {
      P(g, s, '#A9744A', (h) => A.rect(h, -92, -10, 184, 22, 9, 3, 0.5), { shadow: 0.8 });
      P(g, s, CREAM, (h) => A.rect(h, -194, -280, 388, 24, 12, 4, 0.6), { shadow: 0.8, box: { x: -194, y: -280, w: 388, h: 24 }, light: 0.05 });
    });
    const potN = st.add({ z: 20, x: potX, y: tableY + 4, sx: potS, sy: potS });
    const bubble = (x) => pot.bubbles.push({ x: x == null ? (Math.random() - 0.5) * 240 : x, y: -22, r: 5 + Math.random() * 9, v: 70 + Math.random() * 90, p: Math.random() * 6 });
    potN.update = (dt) => {
      const tot = total(), target = mixRgb(parts), f = tot ? Math.min(1, 0.2 + 0.8 * tot / CAP) : 0;
      if (target) { if (pot.lv < 0.02) pot.col = target.slice(); else pot.col = mix3(pot.col, target, Math.min(1, dt * 3.4)); }
      pot.lv += (f - pot.lv) * Math.min(1, dt * (f > pot.lv ? 5 : 2.4));
      pot.slosh = Math.max(0, pot.slosh - dt * 0.8); pot.shake = Math.max(0, pot.shake - dt * 2.2);
      const top = topY();
      for (const b of pot.bubbles) { b.y -= b.v * dt; b.x += Math.sin(st.t * 5 + b.p) * 14 * dt; }
      for (let i = pot.bubbles.length - 1; i >= 0; i--) if (pot.bubbles[i].y < top + 6) pot.bubbles.splice(i, 1);
      if (tot && Math.random() < dt * (0.8 + pot.slosh * 5)) bubble();
      for (const w of pot.swirls) w.t += dt;
      for (let i = pot.swirls.length - 1; i >= 0; i--) if (pot.swirls[i].t > 1.3) pot.swirls.splice(i, 1);
    };
    potN.draw = (g) => {
      g.save(); g.translate(Math.sin(st.t * 46) * pot.shake * 7, 0); g.rotate(Math.sin(st.t * 9) * pot.slosh * 0.012);
      g.beginPath(); bowl(g); g.fillStyle = 'rgba(255,255,255,.42)'; g.fill();
      if (pot.lv > 0.004) {
        const top = topY(), amp = 2.5 + pot.slosh * 15, col = toHex(pot.col);
        g.save(); g.beginPath(); bowl(g); g.clip();
        g.beginPath(); g.moveTo(-210, top);
        for (let x = -210; x <= 210; x += 14) g.lineTo(x, top + Math.sin(x * 0.03 + st.t * 5.2) * amp + Math.sin(x * 0.071 - st.t * 3.1) * amp * 0.45);
        g.lineTo(210, 0); g.lineTo(-210, 0); g.closePath();
        g.fillStyle = col; g.fill(); g.save(); g.clip();
        const gr = g.createLinearGradient(0, top, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(0.35, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(30,20,60,.2)'); g.fillStyle = gr; g.fillRect(-210, top - 30, 420, 40 - top);
        for (const w of pot.swirls) {    // the new paint curls into the old
          g.save(); g.translate(w.x, (top + -10) / 2); g.rotate(w.a + w.t * 4.5); g.globalAlpha = Math.max(0, 1 - w.t / 1.3) * 0.75;
          g.strokeStyle = w.col; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath();
          for (let a = 0; a < 7.5; a += 0.3) { const rr = (8 + a * 11) * (0.5 + w.t * 0.8); g.lineTo(Math.cos(a) * rr * 1.5, Math.sin(a) * rr * 0.62); }
          g.stroke(); g.restore();
        }
        for (const b of pot.bubbles) { g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fillStyle = 'rgba(255,255,255,.2)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.stroke(); }
        g.restore(); g.restore();
      }
      g.beginPath(); bowl(g); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 7; g.stroke();
      g.beginPath(); bowl(g); g.strokeStyle = 'rgba(70,110,120,.38)'; g.lineWidth = 2; g.stroke();
      A.line(g, 'rgba(255,255,255,.75)', 9, (h) => { h.moveTo(-158, -236); h.quadraticCurveTo(-170, -130, -128, -60); });
      A.line(g, 'rgba(255,255,255,.5)', 5, (h) => { h.moveTo(150, -220); h.quadraticCurveTo(160, -160, 144, -110); });
      g.drawImage(potTrim.canvas, -potTrim.ox, -potTrim.oy, potTrim.w, potTrim.h);
      g.restore();
    };

    /* ---------- jars ---------- */
    const glowing = (k) => !!R && !R.over && !R.lock && ((R.reveal && R.recipe && !!R.recipe[k] && !R.needEmpty) || R.hintKey === k || (R.kind === 'free' && R.nudge && !parts[k]));
    const jars = {};
    keys.forEach((k, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * gap, sp = A.sprite('mixjar-' + k, [-70, -146, 140, 152], (g, s) => jarArt(g, s, k));
      const j = st.add({ z: 15, x, y: shelfY, sx: jarS, sy: jarS, label: k, hit: { x: -62, y: -144, w: 124, h: 148 }, pad: 4, pop: 0 });
      j.draw = (g) => {
        if (glowing(k)) { const q = 0.5 + Math.sin(st.t * 6) * 0.5; g.beginPath(); g.ellipse(0, -68, 84 + q * 10, 92 + q * 10, 0, 0, 7); g.fillStyle = `rgba(247,200,80,${0.4 + q * 0.3})`; g.fill(); g.beginPath(); g.ellipse(0, -68, 74, 82, 0, 0, 7); g.fillStyle = 'rgba(255,244,200,.8)'; g.fill(); }
        const b = glowing(k) ? Math.abs(Math.sin(st.t * 3)) * -8 : 0;
        g.drawImage(sp.canvas, -sp.ox, -sp.oy + b, sp.w, sp.h);
      };
      j.onTap = () => pour(k);
      jars[k] = j;
    });

    function pour(k) {
      const r = R, j = jars[k]; if (!r || !j || r.lock) return;
      if (r.kind === 'predict' && r.phase === 'guess') { K.sfx.tap(); r.wig = st.t; if (st.t > hintAt) { hintAt = st.t + 3; speak(r.target.ask); } return; }
      if (total() + pending >= CAP) { K.sfx.tap(); pot.shake = 1; if (!pending) evaluate(); return; }
      pending++; glug(340 - keys.indexOf(k) * 22);
      const dir = j.x < potX - 10 ? 1 : j.x > potX + 10 ? -1 : (Math.random() < 0.5 ? 1 : -1);
      j.to({ y: shelfY - 30, rot: dir * 0.5 }, { dur: 0.13, ease: 'out' }).then(() => j.to({ y: shelfY, rot: 0 }, { dur: 0.5, ease: 'elastic' }));
      if (L === 1 && st.t > quietUntil) ctx.say(T.name(k));
      const x0 = j.x + dir * 50 * jarS, y0 = shelfY - 138 * jarS, x1 = potX + (Math.random() - 0.5) * 150 * potS, t0 = st.t + 0.1, dur = 0.4;
      const d = st.add({ z: 40, x: x0, y: y0, visible: false });
      d.draw = (g) => drop(g, 0, 0, 20, PIG[k]);
      d.update = () => {
        const q = (st.t - t0) / dur; if (q < 0) return; d.visible = true;
        const y1 = potN.y + topY() * potS, e = Math.min(1, q);
        d.x = x0 + (x1 - x0) * e; d.y = y0 + (y1 - y0) * e * e - Math.sin(e * Math.PI) * 46; d.rot = (x1 - x0) / 600 * (1 - e);
        if (q >= 1) { d.remove(); arrive(k, x1, y1); }
      };
    }
    function arrive(k, x, y) {
      pending--; parts[k]++;
      pot.slosh = 1; pot.swirls.push({ x: (x - potX) / potS, col: PIG[k], t: 0, a: Math.random() * 6 });
      for (let i = 0; i < 4; i++) bubble((x - potX) / potS + (Math.random() - 0.5) * 80);
      ctx.fx.burst(x, y, { n: 6, color: PIG[k] === PIG.white ? '#FFFFFF' : PIG[k], star: false });
      K.sfx.tone(520, 0.1, { to: 260, type: 'sine', vol: 0.16 }); K.sfx.noise(0.07, { freq: 1500, vol: 0.1 });
      evalAt = st.t + 0.5;
    }
    function emptyPot() {
      if (!total()) { pot.shake = 0.6; K.sfx.tap(); return; }
      for (const k of KEYS) parts[k] = 0;
      pot.slosh = 1; for (let i = 0; i < 8; i++) bubble();
      K.sfx.whoosh(); for (let i = 0; i < 4; i++) K.sfx.tone(300 - i * 40, 0.12, { to: 150 - i * 15, vol: 0.16, delay: i * 0.11 });
      if (R) { R.needEmpty = false; R.hintKey = null; R.nudge = false; R.seen = {}; }
      evalAt = 0;
    }

    /* ---------- the empty button ---------- */
    const eb = st.add({ z: 30, x: land ? potX + 300 : W - 72, y: land ? tableY - 76 : tableY - 72, hitR: 60, label: 'Empty the pot' });
    eb.draw = (g, s) => {
      const on = R && R.needEmpty && !R.lock, k = on ? 1 + Math.sin(st.t * 6) * 0.08 : 1;
      g.save(); g.scale(k, k);
      if (on) { g.beginPath(); g.arc(0, 0, 66, 0, 7); g.fillStyle = 'rgba(247,200,80,.75)'; g.fill(); }
      g.beginPath(); g.arc(0, 0, 56, 0, 7); A.paper(g, s, CREAM, { shadow: 1, light: 0.04, box: { x: -56, y: -56, w: 112, h: 112 } });
      g.save(); g.translate(-6, -8); g.rotate(-0.95);               // a tipped pot, pouring out
      g.beginPath(); g.moveTo(-26, -20); g.bezierCurveTo(-30, 8, -18, 22, -8, 22); g.lineTo(8, 22); g.bezierCurveTo(18, 22, 30, 8, 26, -20); g.closePath(); g.fillStyle = '#2F8F8A'; g.fill();
      g.fillStyle = INK; g.beginPath(); A.rect(g, -30, -26, 60, 9, 4, 2, 0); g.fill(); g.restore();
      const c = total() ? toHex(pot.col) : '#86BCD0';
      [[-30, 14, 9], [-22, 34, 7], [-36, 36, 5]].forEach(([x, y, r], i) => drop(g, x, y + ((st.t * 30 + i * 9) % 8), r, c));
      g.restore();
    };
    eb.onTap = () => { if (R && R.lock) { K.sfx.tap(); return; } emptyPot(); };

    /* ---------- the board: what to make, the recipe, the guesses, the picture ---------- */
    const board = st.add({ z: 12, x: B.x, y: B.y, sprite: A.sprite('mixboard' + key, [0, 0, B.w, B.h], (g, s) => {
      P(g, s, CREAM, (h) => A.rect(h, 0, 0, B.w, B.h, 22, 6, 1.2), { depth: 1.2, box: { x: 0, y: 0, w: B.w, h: B.h }, light: 0.03 });
      for (const x of [B.w * 0.22, B.w * 0.78]) { g.save(); g.translate(x, 2); g.rotate(x < B.w / 2 ? -0.12 : 0.1); P(g, s, '#F2B33D', (h) => A.rect(h, -30, -12, 60, 24, 3, 8, 0.6), { shadow: 0.4 }); g.restore(); }
    }) });
    const text = (g, t, x, y, px, font, align, col) => { g.font = `${font === A.FONT_TITLE ? 800 : 700} ${px}px ${font}`; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillStyle = col || INK; g.fillText(t, x, y); };
    function rows(g, x, y, rh, recipe, nums) {
      order(recipe).forEach((k, i) => {
        const yy = y + i * rh; let xx = x;
        if (nums) { if (i) text(g, '+', xx + 4, yy, 34, A.FONT_TITLE, 'center', 'rgba(46,42,59,.55)'); text(g, String(recipe[k]), xx + 44, yy + 2, 44, A.FONT_TITLE); xx += 74; }
        drop(g, xx + 16, yy + 2, 15, PIG[k]); text(g, k, xx + 42, yy + 2, 30, A.FONT_BODY, 'left');
      });
    }
    board.draw = (g, s) => {
      const r = R; if (!r || r.mode === 'paint') { if (r) { g.beginPath(); A.rect(g, 16, 22, B.w - 32, B.h - 38, 14, 3, 0.8); g.fillStyle = '#CFE6E8'; g.fill(); } return; }
      const cx = land ? B.w / 2 : 126, cy = land ? 172 : 152, br = land ? 86 : 82;
      if (r.kind === 'predict') {
        const ey = land ? 58 : 56, ex = B.w / 2, ks = order(r.recipe);
        drop(g, ex - 104, ey + 4, 22, PIG[ks[0]]); text(g, '+', ex - 62, ey, 40, A.FONT_TITLE); drop(g, ex - 20, ey + 4, 22, PIG[ks[1]]); text(g, '=', ex + 26, ey, 40, A.FONT_TITLE);
        if (r.shown) swatch(g, s, ex + 86, ey, 30, mixHex(r.recipe), 4);
        else { g.save(); g.translate(ex + 82, ey + 2); g.rotate(Math.sin(st.t * 2) * 0.1); text(g, '?', 0, 0, 56, A.FONT_TITLE, 'center', A.C.plum); g.restore(); }
        return;
      }
      if (r.kind === 'free') {
        if (total()) swatch(g, s, cx, cy, br, toHex(pot.col), 5);
        else { g.save(); g.setLineDash([14, 12]); g.beginPath(); A.blob(g, cx, cy, br, br * 0.93, 0.07, 5, 11); g.strokeStyle = 'rgba(46,42,59,.3)'; g.lineWidth = 5; g.stroke(); g.restore(); g.save(); g.translate(cx, cy); g.rotate(Math.sin(st.t * 2) * 0.1); text(g, '?', 0, 4, 100, A.FONT_TITLE, 'center', A.C.plum); g.restore(); }
        const ks = keys.filter((k) => parts[k]);
        ks.forEach((k, i) => drop(g, land ? cx + (i - (ks.length - 1) / 2) * 62 : 300 + i * 64, land ? 340 : 152, 22, PIG[k]));
        return;
      }
      text(g, r.target.name, cx, land ? 50 : 40, r.target.name.length > 11 ? 30 : 36, A.FONT_TITLE);
      swatch(g, s, cx, cy, br, mixHex(r.recipe), 5);
      if (total()) { const q = br * 0.48, x = cx + br * 0.78, y = cy + br * 0.62; g.beginPath(); g.arc(x, y, q + 7, 0, 7); g.fillStyle = CREAM; g.fill(); swatch(g, s, x, y, q, toHex(pot.col), 9); }
      const rx = land ? 30 : 262, ry = land ? 302 : (sum(r.recipe) && order(r.recipe).length > 2 ? 76 : 104), rh = land ? 50 : 62;
      if (r.kind === 'ratio' && !r.hidden) rows(g, rx, ry, rh, r.recipe, true);
      else if (r.kind === 'make' && r.reveal) rows(g, rx + 30, ry, rh, r.recipe, false);
    };
    // the "?" flap that hides a recipe until it is asked for
    const flap = st.add({ z: 13, x: B.x + (land ? B.w / 2 : 370), y: B.y + (land ? 350 : 150), hitR: 62, label: 'Show the recipe', visible: false });
    flap.draw = (g, s) => { g.save(); g.rotate(Math.sin(st.t * 2.2) * 0.06); g.beginPath(); A.rect(g, -56, -50, 112, 100, 18, 4, 1); A.paper(g, s, '#CFE6E8', { shadow: 0.8, box: { x: -56, y: -50, w: 112, h: 100 } }); text(g, '?', 0, 4, 70, A.FONT_TITLE, 'center', A.C.teal); g.restore(); };
    flap.onTap = () => { if (R && R.hidden) { R.hidden = false; flap.visible = false; K.sfx.pop(); ctx.prompt(T.read, { show: 'Make ' + R.target.name + (land ? ': ' + recipeText(R.recipe) : '') }); } };
    // three guesses for a predict round
    const choices = [0, 1, 2].map((i) => {
      const c = st.add({ z: 13, x: land ? B.x + B.w / 2 : B.x + B.w / 2 + (i - 1) * 156, y: land ? B.y + 162 + i * 108 : B.y + 180, hitR: land ? 52 : 62, visible: false });
      c.draw = (g, s) => {
        const r = R, N = c.N; if (!r || !N) return;
        const rad = land ? 46 : 56, hot = r.phase === 'guess', k = hot ? 1 + Math.sin(st.t * 5 + i * 1.3) * 0.05 : 1, wig = r.wig && st.t - r.wig < 0.5 ? Math.sin((st.t - r.wig) * 30) * 0.12 : 0;
        g.save(); g.rotate(wig); g.scale(k, k);
        if (r.shown && N === r.target) { g.beginPath(); g.arc(0, 0, rad + 12 + Math.sin(st.t * 7) * 4, 0, 7); g.fillStyle = 'rgba(247,200,80,.85)'; g.fill(); }
        if (r.guess === N) { g.beginPath(); g.arc(0, 0, rad + 7, 0, 7); g.strokeStyle = INK; g.lineWidth = 6; g.setLineDash([12, 9]); g.stroke(); g.setLineDash([]); }
        swatch(g, s, 0, 0, rad, mixHex(N.r), 3 + i);
        g.restore();
      };
      c.onTap = () => {
        const r = R; if (!r || r.kind !== 'predict' || r.phase !== 'guess' || !c.N) return;
        r.guess = c.N; r.phase = 'test'; r.reveal = true; K.sfx.pop(); ctx.prompt(T.test);
      };
      return c;
    });
    // the picture to paint
    const picN = st.add({ z: 14, x: B.x + B.w / 2, y: B.y + B.h / 2 + 8, hit: { x: -134, y: -110, w: 268, h: 232 }, label: 'Paint the picture', visible: false, pressable: false });
    picN.draw = (g) => {
      const r = R; if (!r || !r.pic) return;
      const wob = r.paintAt ? Math.sin((st.t - r.paintAt) * 14) * Math.max(0, 0.6 - (st.t - r.paintAt)) * 0.14 : Math.sin(st.t * 3) * 0.025;
      g.save(); g.rotate(wob);
      const a = picSprite(r.pic, '#FFFDF8'); g.drawImage(a.canvas, -a.ox, -a.oy, a.w, a.h);
      if (r.paintAt) { const rad = ((st.t - r.paintAt) / 0.8) * 300, b = picSprite(r.pic, r.col); g.save(); g.beginPath(); g.arc(r.px, r.py, rad, 0, 7); g.clip(); g.drawImage(b.canvas, -b.ox, -b.oy, b.w, b.h); g.restore(); }
      g.restore();
    };
    picN.onTap = (p) => {
      const r = R; if (!r || r.mode !== 'paint' || r.paintAt) return;
      r.paintAt = st.t; r.px = p ? K.clamp((p.x - picN.x) / picN.sx, -120, 120) : 0; r.py = p ? K.clamp((p.y - picN.y) / picN.sy, -100, 100) : 0;
      K.sfx.whoosh(); glug(420); ctx.after(450, () => K.sfx.sparkle()); ctx.fx.burst(picN.x + r.px * picN.sx, picN.y + r.py * picN.sy, { n: 14, color: r.col });
      if (waitPaint) { const f = waitPaint; waitPaint = null; f(); }
    };
    // the gallery of painted pictures
    const slots = land ? [[W - 250, 498], [W - 112, 498], [W - 250, 618], [W - 112, 618]] : [0, 1, 2, 3].map((i) => [72 + i * 94, tableY + 104]);
    st.add({ z: 11, draw(g, s) {
      gallery.forEach((it, i) => {
        const [x, y] = slots[i % 4], q = (land ? 0.42 : 0.33) * Math.min(1, (st.t - it.t) * 4), sp = picSprite(it.pic, it.col);
        g.save(); g.translate(x, y); g.rotate((i % 2 ? 1 : -1) * 0.05 + Math.sin(st.t * 1.4 + i) * 0.015); g.scale(q, q);
        g.beginPath(); A.rect(g, -138, -122, 276, 252, 12, i + 2, 1.5); g.fillStyle = 'rgba(46,40,70,.16)'; g.fill();
        g.beginPath(); A.rect(g, -142, -128, 276, 252, 12, i + 2, 1.5); g.fillStyle = '#FFFDF8'; g.fill();
        g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
        if (land) { g.beginPath(); A.rect(g, -12, -150, 24, 44, 6, 3, 0.5); g.fillStyle = '#E8664A'; g.fill(); }
        g.restore();
      });
    } });

    /* ---------- rounds ---------- */
    function next() {
      roundNo++;
      const r = { misses: 0, seen: {}, mode: 'target', kind: 'make', recipe: null, tol: 0.2 };
      const fresh = (pool, used) => { let p = pool.filter((N) => !used[N.key] && N.key !== lastKey); if (!p.length) { for (const N of pool) delete used[N.key]; p = pool.filter((N) => N.key !== lastKey); } return K.pick(p); };
      if (L === 1 && freeDue) { freeDue = false; r.kind = 'free'; }
      else if (L === 3) r.kind = roundNo % 3 === 0 ? 'predict' : 'ratio';
      if (r.kind === 'make') {
        const tier = L === 1 ? 0 : skill < 2 ? 0 : skill < 4 ? 1 : 2;
        r.target = L === 1 && roundNo === 2 && lastKey !== 'green' ? NAMED[1] : fresh(NAMED.filter((N) => N.tier <= tier), doneKeys);
        r.recipe = r.target.r; r.tol = L === 1 ? 0.3 : 0.2; r.reveal = L === 1 && skill < 3;
      } else if (r.kind === 'ratio') {
        const tier = skill < 2 ? 0 : skill < 4 ? 1 : 2;
        r.target = fresh(RATIO.filter((N) => N.tier <= tier && N.tier >= tier - 1), doneKeys);
        r.recipe = r.target.r; r.tol = 0.05; r.hidden = skill >= 5;
      } else if (r.kind === 'predict') {
        r.target = fresh(NAMED.filter((N) => N.ask), {}); r.recipe = r.target.r; r.phase = 'guess'; r.tol = 0.3;
        const opts = K.shuffle([r.target].concat(K.sample(NAMED.filter((N) => N !== r.target), 2)));
        choices.forEach((c, i) => { c.N = opts[i]; });
      }
      if (r.target) { lastKey = r.target.key; doneKeys[r.target.key] = 1; }
      R = r; hintAt = 0;
      choices.forEach((c, i) => { c.visible = r.kind === 'predict'; if (c.visible) { c.sx = c.sy = 0.2; c._bsx = c._bsy = 1; c.to({ sx: 1, sy: 1 }, { dur: 0.35, ease: 'back', delay: i * 0.08 }); } });
      flap.visible = !!r.hidden; picN.visible = false;
      K.sfx.whoosh();
      if (r.kind === 'free') ctx.prompt(T.free);
      else if (r.kind === 'make') ctx.prompt(T.can(r.target));
      else if (r.kind === 'predict') ctx.prompt(r.target.ask);
      else ctx.prompt(r.hidden ? T.canThis : T.canThis + ' ' + T.read, { show: 'Make ' + r.target.name + (r.hidden || !land ? '' : ': ' + recipeText(r.recipe)) });
      quietUntil = st.t + 2.2;
    }
    function miss(text) {
      const r = R; K.sfx.whoops(); pot.shake = 1;
      if (!r.needEmpty) {
        r.needEmpty = true; r.misses++;
        if (r.misses === 2) skill = Math.max(0, skill - 1);
        if (r.misses >= 2 || L === 1) { r.reveal = true; if (r.hidden) { r.hidden = false; flap.visible = false; } }
        if (L === 1) ctx.after(3000, () => { if (R === r && r.needEmpty && !r.over) emptyPot(); });
      }
      if (st.t > hintAt) { hintAt = st.t + 3.5; speak(text + ' ' + T.empty, 3.4); }
    }
    function evaluate() {
      const r = R; if (!r || r.over || r.lock) return;
      const tot = total(), used = KEYS.filter((k) => parts[k]);
      if (!tot) return;
      const found = used.length > 1 ? NAMED.find((N) => sameSet(parts, N.r)) : null;
      if (r.kind === 'free') {
        if (found) { success(found); return; }
        if (tot >= CAP) { K.sfx.whoops(); pot.shake = 1; speak(T.full); ctx.after(1300, () => { if (R === r && !r.over) emptyPot(); }); return; }
        if (tot >= 2) r.nudge = true;
        return;
      }
      const extra = used.find((k) => !r.recipe[k]);
      if (r.kind === 'predict') {
        if (sameSet(parts, r.recipe)) reveal();
        else if (extra || tot >= CAP) miss(extra ? T.notIn : T.full);
        return;
      }
      if (matches(parts, r.recipe, r.tol)) { success(r.target); return; }
      const news = found && found !== r.target && !r.seen[found.key] && r.kind === 'make' ? found : null;
      if (news) r.seen[news.key] = 1;
      if (extra) { miss(news ? news.line : T.notIn); return; }
      if (tot >= CAP) { miss(T.full); return; }
      if (news) { speak(news.line); return; }
      if (KEYS.every((k) => !r.recipe[k] || parts[k]) && tot >= sum(r.recipe)) {   // right paints, wrong shares: say which one is short
        let best = null, gapMax = 0; const tr = sum(r.recipe);
        for (const k of KEYS) { const d = (r.recipe[k] || 0) / tr - parts[k] / tot; if (d > gapMax) { gapMax = d; best = k; } }
        if (best) { r.hintKey = best; if (st.t > hintAt) { hintAt = st.t + 2.5; speak(T.more(best)); } }
      } else r.hintKey = null;
    }
    const sparkleAt = (col) => { K.sfx.ding(); ctx.after(220, () => K.sfx.sparkle()); ctx.fx.burst(potX, potN.y - 290 * potS, { n: 18 }); ctx.fx.burst(potX, potN.y - 150 * potS, { n: 10, color: col }); };
    async function wrapUp(r) {
      won++; emptyPot();
      await ctx.wait(650);
      if (won % 4 === 0) { await ctx.celebrate({ ms: 3400 }); gallery.length = 0; freeDue = L === 1; }
      if (R === r) next();
    }
    async function success(N) {
      const r = R; r.over = true; r.lock = true; r.hintKey = null;
      const col = mixHex(parts);
      if (!r.misses) skill++;
      sparkleAt(col); pot.slosh = 1;
      await Promise.all([speak(r.kind === 'ratio' ? T.match : N.line, 3), ctx.wait(2100)]);
      // paint a picture with it
      r.pic = PIC_NAMES[picNo++ % PIC_NAMES.length]; r.col = col; r.mode = 'paint'; flap.visible = false;
      const q = Math.min((B.w - 30) / 268, (B.h - 40) / 232, 1.15);
      picN.visible = true; picN.sx = picN.sy = 0.2; picN.to({ sx: q, sy: q }, { dur: 0.4, ease: 'back' }); K.sfx.pop();
      ctx.prompt(T.paint);
      await Promise.race([new Promise((res) => { waitPaint = res; }), ctx.wait(9000)]);
      if (R !== r) return;
      if (!r.paintAt) picN.onTap(null);
      await ctx.wait(1900);
      gallery.push({ pic: r.pic, col: r.col, t: st.t }); if (gallery.length > 4) gallery.shift();
      K.sfx.pop();
      await wrapUp(r);
    }
    async function reveal() {
      const r = R; r.over = true; r.lock = true; r.shown = true;
      const right = r.guess === r.target;
      if (right) { skill++; sparkleAt(mixHex(parts)); } else { K.sfx.ding(); ctx.fx.burst(potX, potN.y - 290 * potS, { n: 10, color: mixHex(parts) }); }
      await Promise.all([speak((right ? T.right : T.surprise) + ' ' + r.target.line, 4), ctx.wait(3400)]);
      choices.forEach((c) => { c.visible = false; });
      await wrapUp(r);
    }

    st.onframe = () => { if (evalAt && st.t >= evalAt && !pending) { evalAt = 0; evaluate(); } };
    K._mix = {                                            // for browser tests
      get R() { return R; }, parts, keys, jars, choices, mixHex, matches, NAMED, RATIO,
      get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; }, get gallery() { return gallery; },
      get answer() { return R && R.recipe; }, pour, empty: emptyPot, paint: () => picN.onTap(null),
      jump(kind) { roundNo = kind === 'predict' ? 2 : 0; freeDue = kind === 'free'; emptyPot(); next(); },
    };
    ctx.onExit(() => { K._mix = null; });
    ctx.after(400, next);
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#F4E7CF'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#DDB083'; g.fillRect(0, 236 * u, w, 64 * u); g.fillStyle = '#B98558'; g.fillRect(0, 262 * u, w, 38 * u);
    const bowl = () => { g.beginPath(); g.moveTo(56 * u, 112 * u); g.bezierCurveTo(40 * u, 190 * u, 86 * u, 248 * u, 120 * u, 248 * u); g.lineTo(180 * u, 248 * u); g.bezierCurveTo(214 * u, 248 * u, 260 * u, 190 * u, 244 * u, 112 * u); g.closePath(); };
    bowl(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill();
    g.save(); bowl(); g.clip(); g.fillStyle = '#3AA048'; g.beginPath(); g.moveTo(0, 158 * u); for (let x = 0; x <= 300; x += 10) g.lineTo(x * u, (158 + Math.sin(x * 0.07) * 5) * u); g.lineTo(w, w); g.lineTo(0, w); g.fill();
    g.fillStyle = 'rgba(255,255,255,.3)'; for (const [x, y, r] of [[110, 200, 9], [176, 186, 6], [150, 222, 7]]) { g.beginPath(); g.arc(x * u, y * u, r * u, 0, 7); g.fill(); } g.restore();
    bowl(); g.strokeStyle = '#FFFFFF'; g.lineWidth = 6 * u; g.stroke();
    g.fillStyle = '#FBF6EC'; g.beginPath(); g.roundRect ? g.roundRect(46 * u, 100 * u, 208 * u, 18 * u, 9 * u) : g.rect(46 * u, 100 * u, 208 * u, 18 * u); g.fill();
    [[84, 58, PIG.red], [150, 44, PIG.yellow], [216, 58, PIG.blue]].forEach(([x, y, c]) => drop(g, x * u, y * u, 24 * u, c));
  }

  K.game({ id: 'mix', title: 'Colour Mixer', voice: 'mix', group: 'arcade', age: 3, subject: 'science', order: 18, icon, start, lines, resize: () => K.go('mix') });
})();
