/* Count the Eggs — hands-on counting in the hen house.
   Every count is a touch: an egg hops into the basket and the basket says the next number, so
   counting is always one thing for one number. Nothing can be lost; a wrong try gets a wobble and
   a kind hint, and after two misses the answer glows.

   Level 1 (age 3):   touch and count 1-5 eggs; "Pip wants this many" (the basket counts as eggs land
                      and says when there are enough).
   Level 2 (4-5):     count to 10; quick-look amounts in dice and ten-frame layouts under a cloth;
                      one more / one fewer; which basket has more or fewer.
   Level 3 (6-8):     boxes of ten and loose eggs (count in tens, then make a number such as 34);
                      counting on from the number on the basket; sharing fairly between 2-4 nests;
                      counting in twos. The sum is shown as big text when a round is done.
   Inside a session the numbers grow as the child succeeds and ease off after misses.
   Each finished round hatches a chick on the roof of the nest box; four chicks is a celebration. */
(function () {
  'use strict';
  const A = K.art;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = (n) => K.numWord(n);
  const N = (n) => cap(num(n)) + '!';
  const SPOKEN_MAX = 20;
  const SAY = {
    count: 'Count the eggs.', touch: 'Touch each one.',
    wants: 'Pip wants this many.', enough: 'That is enough!',
    tooMany: 'Too many!', back: 'Tap the basket to take one back.',
    quick: 'How many?', look: 'Quick look!', peek: 'Tap the cloth to look again.', countThem: 'Count them.',
    more1: 'Make one more.', less1: 'Make one fewer.',
    whichMore: 'Which basket has more?', whichFewer: 'Which basket has fewer?', hasMore: 'This one has more.', hasFewer: 'This one has fewer.',
    box: 'Each box has ten eggs.', tens: 'Count in tens.', useBox: 'Use the boxes of ten.',
    on: 'Count on from the basket.',
    share: 'Share the eggs.', same: 'The same for everyone.', pickNest: 'Now touch a nest.', notSame: 'Not the same yet.', allSame: 'Everyone has the same!',
    twos: 'Count in twos.',
  };
  function lines() { const out = Object.values(SAY); for (let n = 1; n <= SPOKEN_MAX; n++) out.push(N(n)); return out; }

  /* ---------------- pictures ---------------- */
  const PIC = {};
  for (const [k, src] of [['egg', 'words/egg'], ['chick', 'words/egg-open']]) { const im = new Image(); im.onload = () => { PIC[k] = im; }; im.src = 'img/' + src + '.webp'; }

  /* ---------------- paper drawings ---------------- */
  const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
  const EGG_COLS = ['#FFF8EA', '#E9BC8E', '#F7E3C2', '#D5E6E0', '#F1D2B4'];
  function eggPath(h, w, ht) {
    const a = w / 2, b = ht / 2;
    h.moveTo(0, -b); h.bezierCurveTo(a * 0.72, -b, a, -b * 0.1, a, b * 0.26); h.bezierCurveTo(a, b * 0.76, a * 0.56, b, 0, b);
    h.bezierCurveTo(-a * 0.56, b, -a, b * 0.76, -a, b * 0.26); h.bezierCurveTo(-a, -b * 0.1, -a * 0.72, -b, 0, -b); h.closePath();
  }
  function paintEgg(g, s, v, w, ht) {
    w = w || 66; ht = ht || 86;
    g.beginPath(); eggPath(g, w, ht); A.paper(g, s, EGG_COLS[v % EGG_COLS.length], { shadow: 0.9, light: 0.09, box: { x: -w / 2, y: -ht / 2, w, h: ht } });
    const r = A.rng(11 + v * 7);
    g.save(); g.beginPath(); eggPath(g, w, ht); g.clip();
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc((r() - 0.5) * w * 0.8, (r() - 0.3) * ht * 0.7, 1.4 + r() * 2, 0, 7); g.fillStyle = 'rgba(150,104,60,.22)'; g.fill(); }
    g.beginPath(); g.ellipse(w * 0.16, ht * 0.3, w * 0.5, ht * 0.3, 0, 0, 7); g.fillStyle = 'rgba(120,80,60,.07)'; g.fill();
    g.restore();
    g.beginPath(); g.ellipse(-w * 0.17, -ht * 0.2, w * 0.1, ht * 0.15, 0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
  }
  const eggSp = (v) => A.sprite('count-egg' + (v % EGG_COLS.length), [-40, -50, 80, 100], (g, s) => paintEgg(g, s, v));
  const boxSp = () => A.sprite('count-box', [-126, -60, 252, 120], (g, s) => {
    g.beginPath(); A.rect(g, -118, -40, 236, 92, 18, 3, 0.8); A.paper(g, s, '#8FB6C9', { depth: 1.1, light: 0.07, box: { x: -118, y: -40, w: 236, h: 92 } });
    g.beginPath(); A.rect(g, -110, -34, 220, 70, 14, 5, 0.6); g.fillStyle = '#6F9BB2'; g.fill();
    for (let i = 0; i < 10; i++) {
      const x = -88 + (i % 5) * 44, y = i < 5 ? -24 : 16;
      g.save(); g.translate(x, y); g.beginPath(); g.ellipse(0, 10, 19, 12, 0, 0, 7); g.fillStyle = 'rgba(40,70,90,.3)'; g.fill();
      paintEgg(g, s * 0.5, i, 34, 42); g.restore();
    }
    g.beginPath(); A.rect(g, -118, 30, 236, 22, 10, 7, 0.5); A.paper(g, s, '#A3C6D6', { shadow: 0.4, light: 0.05 });
  });
  const pairSp = () => A.sprite('count-pair', [-70, -56, 140, 112], (g, s) => {
    g.beginPath(); g.ellipse(0, 26, 62, 24, 0, 0, 7); A.paper(g, s, '#D9A84E', { shadow: 0.9, light: 0.05 });
    g.save(); g.translate(-27, -6); g.rotate(-0.1); paintEgg(g, s, 1, 56, 72); g.restore();
    g.save(); g.translate(27, -6); g.rotate(0.1); paintEgg(g, s, 3, 56, 72); g.restore();
    g.beginPath(); g.moveTo(-62, 24); g.quadraticCurveTo(0, 62, 62, 24); g.quadraticCurveTo(0, 40, -62, 24); A.paper(g, s, '#E8C067', { shadow: 0.3 });
    const r = A.rng(3); A.line(g, 'rgba(150,100,30,.5)', 2.5, (h) => { for (let i = 0; i < 9; i++) { const x = -52 + i * 13; h.moveTo(x, 30 + r() * 8); h.lineTo(x + 10, 36 + r() * 8); } });
  });
  const BW = 150, BH = 118;
  const basketBack = () => A.sprite('count-bback', [-190, -170, 380, 180], (g, s) => {
    for (const k of [-1, 1]) A.line(g, '#A06E3C', 13, (h) => { h.arc(k * (BW + 2), -BH + 26, 24, 0, 7); });
    g.beginPath(); g.ellipse(0, -BH, BW, 30, 0, 0, 7); A.paper(g, s, '#9A6838', { shadow: 0.7, light: 0 });
    g.beginPath(); g.ellipse(0, -BH + 5, BW - 14, 22, 0, 0, 7); g.fillStyle = '#6E4526'; g.fill();
  });
  const basketFront = () => A.sprite('count-bfront', [-190, -170, 380, 180], (g, s) => {
    const path = (h) => { h.moveTo(-BW, -BH); h.bezierCurveTo(-BW * 0.6, -BH + 34, BW * 0.6, -BH + 34, BW, -BH); h.lineTo(BW - 30, -24); h.quadraticCurveTo(BW - 36, 0, BW - 64, 0); h.lineTo(-BW + 64, 0); h.quadraticCurveTo(-BW + 36, 0, -BW + 30, -24); h.closePath(); };
    g.beginPath(); path(g); A.paper(g, s, '#CB9550', { box: { x: -BW, y: -BH, w: BW * 2, h: BH }, light: 0.09, depth: 1.2 });
    g.save(); g.beginPath(); path(g); g.clip();
    for (let r = 0; r < 5; r++) for (let i = -8; i <= 8; i++) {
      const x = i * 40 + (r % 2 ? 20 : 0), y = -BH + 44 + r * 21 + Math.cos(x / 110) * -10;
      g.beginPath(); A.rect(g, x - 18, y - 8, 36, 16, 7, r * 20 + i + 30, 0.4); g.fillStyle = (i + r) % 2 ? 'rgba(120,70,30,.24)' : 'rgba(255,238,196,.26)'; g.fill();
    }
    g.restore();
    g.beginPath(); g.moveTo(-BW - 6, -BH - 5); g.bezierCurveTo(-BW * 0.6, -BH + 31, BW * 0.6, -BH + 31, BW + 6, -BH - 5); g.lineTo(BW + 2, -BH + 15); g.bezierCurveTo(BW * 0.6, -BH + 52, -BW * 0.6, -BH + 52, -BW - 2, -BH + 15); g.closePath();
    A.paper(g, s, '#E0B272', { shadow: 0.5, light: 0.07, box: { x: -BW, y: -BH, w: BW * 2, h: 50 } });
    A.line(g, 'rgba(120,70,30,.3)', 2.5, (h) => { for (let i = -6; i <= 6; i++) { const x = i * 23, y = -BH + 22 - (x * x) / 1500; h.moveTo(x - 5, y - 9); h.lineTo(x + 5, y + 9); } });
  });
  const nestSp = () => A.sprite('count-nest', [-124, -62, 248, 124], (g, s) => {
    g.beginPath(); A.blob(g, 0, 0, 112, 48, 0.05, 4, 14); A.paper(g, s, '#DDAE4E', { depth: 1.1, light: 0.07, box: { x: -112, y: -48, w: 224, h: 96 } });
    g.beginPath(); g.ellipse(0, -8, 84, 28, 0, 0, 7); g.fillStyle = '#A9792F'; g.fill();
    const r = A.rng(8);
    for (const [col, n] of [['rgba(140,92,28,.45)', 30], ['rgba(255,236,170,.6)', 24]]) A.line(g, col, 3, (h) => { for (let i = 0; i < n; i++) { const a = r() * 6.283, d = 0.78 + r() * 0.22, x = Math.cos(a) * 104 * d, y = Math.sin(a) * 40 * d + 2, t = a + 1.5 + (r() - 0.5); h.moveTo(x, y); h.lineTo(x + Math.cos(t) * 22, y + Math.sin(t) * 9); } });
  });
  const henSp = () => A.sprite('count-hen', [-110, -196, 220, 200], (g, s) => {
    A.line(g, '#E2952B', 6, (h) => { h.moveTo(-14, -30); h.lineTo(-14, -2); h.moveTo(-28, -2); h.lineTo(-2, -2); h.moveTo(24, -30); h.lineTo(24, -2); h.moveTo(10, -2); h.lineTo(36, -2); });
    for (const [rot, len, c] of [[-1.0, 66, '#EBD9B6'], [-0.62, 80, '#F3E6CA'], [-0.25, 68, '#EBD9B6']]) { g.save(); g.translate(60, -88); g.rotate(rot); g.beginPath(); g.ellipse(len / 2, 0, len / 2, 17, 0, 0, 7); A.paper(g, s, c, { shadow: 0.4, light: 0.05 }); g.restore(); }
    for (const [x, y] of [[-66, -172], [-50, -180], [-34, -172]]) { g.beginPath(); g.arc(x, y, 12, 0, 7); A.paper(g, s, '#E8664A', { shadow: 0.3 }); }
    g.beginPath(); A.smooth(g, [[-74, -84], [-44, -122], [18, -128], [68, -106], [88, -66], [62, -32], [2, -20], [-50, -32]]); A.paper(g, s, '#FBF4E4', { light: 0.07, box: { x: -76, y: -128, w: 166, h: 110 } });
    g.beginPath(); g.arc(-50, -138, 37, 0, 7); A.paper(g, s, '#FBF4E4', { shadow: 0.5, light: 0.06, box: { x: -87, y: -175, w: 74, h: 74 } });
    g.beginPath(); A.cut(g, [[-82, -146], [-82, -124], [-106, -132]], 4, 0.4, 2); A.paper(g, s, '#F2B33D', { shadow: 0.4 });
    g.beginPath(); g.ellipse(-76, -110, 8, 13, 0.2, 0, 7); A.paper(g, s, '#E8664A', { shadow: 0.3 });
    g.beginPath(); g.arc(-60, -144, 5.5, 0, 7); g.fillStyle = A.C.ink; g.fill(); g.beginPath(); g.arc(-62, -146, 1.8, 0, 7); g.fillStyle = '#fff'; g.fill();
    g.beginPath(); g.arc(-44, -126, 8, 0, 7); g.fillStyle = 'rgba(244,150,130,.5)'; g.fill();
    g.beginPath(); A.smooth(g, [[-10, -92], [22, -100], [54, -84], [40, -54], [6, -52]]); A.paper(g, s, '#EBD9B6', { shadow: 0.5, light: 0.05 });
    A.line(g, 'rgba(150,110,60,.4)', 2.5, (h) => { h.moveTo(4, -70); h.quadraticCurveTo(20, -62, 40, -70); h.moveTo(10, -60); h.quadraticCurveTo(22, -55, 34, -60); });
  });
  function paintChick(g, s) {    // a paper chick in half a shell, for when the picture is missing; about 80 x 120, base at (0,0)
    g.beginPath(); g.arc(0, -70, 34, 0, 7); A.paper(g, s, '#F6CE4A', { shadow: 0.6, light: 0.07, box: { x: -34, y: -104, w: 68, h: 68 } });
    for (const k of [-1, 1]) { g.beginPath(); g.arc(k * 12, -76, 4, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
    g.beginPath(); A.cut(g, [[-7, -68], [7, -68], [0, -58]], 2, 0, 1); g.fillStyle = '#EE8A3A'; g.fill();
    g.beginPath(); A.cut(g, [[-36, -52], [-22, -40], [-10, -54], [2, -40], [14, -54], [26, -40], [36, -52], [30, -8], [0, 0], [-30, -8]], 5, 0.4, 3); A.paper(g, s, '#FBF4E4', { shadow: 0.6, light: 0.06 });
  }
  function tag(g, s, text, x, y, r, col) {
    g.save(); g.translate(x, y);
    g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, col || A.C.tomato, { shadow: 0.7, light: 0.08, grain: 0.1, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
    g.fillStyle = '#FFFDF6'; g.font = `800 ${Math.round(r * (String(text).length > 1 ? 1.0 : 1.25))}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, r * 0.06);
    g.restore();
  }
  function glowAt(g, rx, ry, k) {
    g.save(); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, rx * 0.35, 0, 0, rx); gr.addColorStop(0, `rgba(255,236,140,${k})`); gr.addColorStop(1, 'rgba(255,236,140,0)');
    g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  }
  const DICE = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const key = Math.round(W) + 'x' + Math.round(H);
    /* ---------- where things are ---------- */
    const T = land ? { x0: W * 0.05, x1: W * 0.63, y0: 372, y1: 700 } : { x0: 16, x1: W - 16, y0: 306, y1: 724 };   // the nest box
    const floorY = land ? 742 : T.y1 + 70;
    const inner = { x: T.x0 + 26, y: T.y0 + 36, w: T.x1 - T.x0 - 52, h: T.y1 - T.y0 - 54 };
    const BK = land ? { x: W * 0.745, y: 904, s: 1 } : { x: 168, y: H - 150, s: 0.84 };
    const PP = land ? { x: W * 0.91, y: 952, s: 1.5 } : { x: W - 96, y: H - 46, s: 1.2 };
    const BUB = land ? { x: PP.x - 196, y: 500, w: 276, h: 156 } : { x: W - 240, y: PP.y - 206 - 138, w: 224, h: 122 };
    let R = null, won = 0, skill = 0, lastKey = '', lastMode = '', lastTouch = 0, bag = [], rounds = 0;
    const sk = () => Math.floor(skill);

    /* ---------- the hen house ---------- */
    st.add({ z: 0, sprite: A.sprite('count-room' + key, [0, 0, W, H], (g, s) => {
      const r = A.rng(5);
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#EBCB98', { shadow: 0, grain: 0.3, light: 0.05, box: { x: 0, y: 0, w: W, h: H } });
      for (let x = 0; x < W; x += 124) {
        g.fillStyle = `rgba(160,100,50,${0.03 + r() * 0.09})`; g.fillRect(x, 0, 124, floorY);
        A.line(g, 'rgba(120,74,40,.28)', 3, (h) => { h.moveTo(x, 0); h.lineTo(x, floorY); });
        if (r() < 0.6) { const ky = 160 + r() * (floorY - 260); A.line(g, 'rgba(120,74,40,.22)', 2.5, (h) => { h.ellipse(x + 40 + r() * 40, ky, 9, 15, 0, 0, 7); }); }
      }
      if (land) {    // a round window on the valley
        const wx = W * 0.82, wy = 318, wr = 118;
        g.beginPath(); g.arc(wx, wy, wr + 16, 0, 7); A.paper(g, s, '#FBF4E4', { shadow: 0.9 });
        g.save(); g.beginPath(); g.arc(wx, wy, wr, 0, 7); g.clip();
        const sky = g.createLinearGradient(0, wy - wr, 0, wy + wr); sky.addColorStop(0, '#9FD0E6'); sky.addColorStop(1, '#EAF3E2'); g.fillStyle = sky; g.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
        g.beginPath(); g.arc(wx + 44, wy - 40, 30, 0, 7); g.fillStyle = '#F7CF5A'; g.fill();
        g.beginPath(); g.ellipse(wx - 50, wy + 110, 150, 90, 0, 0, 7); g.fillStyle = '#9CC98A'; g.fill();
        g.beginPath(); g.ellipse(wx + 80, wy + 126, 150, 80, 0, 0, 7); g.fillStyle = '#7FB877'; g.fill();
        g.restore();
        A.line(g, '#FBF4E4', 10, (h) => { h.moveTo(wx - wr, wy); h.lineTo(wx + wr, wy); h.moveTo(wx, wy - wr); h.lineTo(wx, wy + wr); });
      }
      // straw floor
      g.beginPath(); A.smooth(g, [[-30, floorY + 8], [W * 0.25, floorY - 6], [W * 0.5, floorY + 6], [W * 0.75, floorY - 8], [W + 30, floorY + 4], [W + 30, H + 30], [-30, H + 30]]); A.paper(g, s, '#EDC96C', { shadow: 1, light: 0.05, grain: 0.3, box: { x: 0, y: floorY, w: W * 0.4, h: H - floorY } });
      for (const [col, n] of [['rgba(170,120,40,.3)', Math.round(W / 9)], ['rgba(255,244,190,.55)', Math.round(W / 12)]]) A.line(g, col, 3, (h) => { for (let i = 0; i < n; i++) { const x = r() * W, y = floorY + 14 + r() * (H - floorY - 20), a = (r() - 0.5) * 1.2, l = 16 + r() * 26; h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); } });
      // the nest box: legs, back, straw bed, frame, roof rail
      const wood = '#B57C48', wood2 = '#D19C62';
      for (const x of [T.x0 + 30, T.x1 - 56]) { g.beginPath(); A.rect(g, x, T.y1 - 10, 26, floorY - T.y1 + 26, 5, x, 0.6); A.paper(g, s, '#9A6638', { shadow: 0.7 }); }
      g.beginPath(); A.rect(g, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 14, 3, 1); A.paper(g, s, wood, { depth: 1.3, light: 0.05, box: { x: T.x0, y: T.y0, w: T.x1 - T.x0, h: T.y1 - T.y0 } });
      g.beginPath(); A.rect(g, T.x0 + 14, T.y0 + 22, T.x1 - T.x0 - 28, T.y1 - T.y0 - 40, 12, 6, 0.8); g.fillStyle = '#8A5A34'; g.fill();
      g.beginPath(); A.rect(g, T.x0 + 14, T.y0 + 34, T.x1 - T.x0 - 28, T.y1 - T.y0 - 52, 16, 9, 2); A.paper(g, s, '#E2B85C', { shadow: 0, light: 0.06, grain: 0.3, box: { x: T.x0, y: T.y0, w: T.x1 - T.x0, h: T.y1 - T.y0 } });
      g.save(); g.beginPath(); g.rect(T.x0 + 14, T.y0 + 34, T.x1 - T.x0 - 28, T.y1 - T.y0 - 52); g.clip();
      for (const [col, per] of [['rgba(150,100,30,.32)', 26], ['rgba(255,240,180,.55)', 40]]) A.line(g, col, 3, (h) => { const n = Math.round((T.x1 - T.x0) * (T.y1 - T.y0) / (per * 60)); for (let i = 0; i < n; i++) { const x = T.x0 + r() * (T.x1 - T.x0), y = T.y0 + 34 + r() * (T.y1 - T.y0 - 52), a = (r() - 0.5) * 1.4, l = 18 + r() * 30; h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); } });
      g.restore();
      g.beginPath(); A.rect(g, T.x0 - 6, T.y1 - 20, T.x1 - T.x0 + 12, 26, 9, 12, 0.8); A.paper(g, s, wood2, { shadow: 0.8, light: 0.06, box: { x: T.x0, y: T.y1 - 20, w: T.x1 - T.x0, h: 26 } });
      g.beginPath(); A.rect(g, T.x0 - 22, T.y0 - 4, T.x1 - T.x0 + 44, 30, 10, 14, 0.8); A.paper(g, s, wood2, { shadow: 1, depth: 1.2, light: 0.07, box: { x: T.x0, y: T.y0 - 4, w: T.x1 - T.x0, h: 30 } });
      A.line(g, 'rgba(255,240,200,.4)', 3, (h) => { h.moveTo(T.x0 - 8, T.y0 + 2); h.lineTo(T.x1 + 8, T.y0 + 2); });
    }) });

    /* ---------- small helpers ---------- */
    const lerp = (a, b, k) => a + (b - a) * k;
    function flyStep(n, dt) {
      const f = n.fly; if (!f) return;
      f.t += dt / f.dur; const k = Math.min(1, f.t), e = k * k * (3 - 2 * k);
      n.x = lerp(f.x0, f.x1, e); n.y = lerp(f.y0, f.y1, e) - Math.sin(k * Math.PI) * f.lift; n.sx = n.sy = lerp(f.s0, f.s1, e);
      if (k >= 1) { n.fly = null; f.res(); }
    }
    function fly(n, x, y, o) { o = o || {}; n.tweens.length = 0; return new Promise((res) => { n.fly = { x0: n.x, y0: n.y, x1: x, y1: y, s0: n.sx, s1: o.s == null ? n.sx : o.s, t: 0, dur: o.dur || 0.42, lift: o.lift == null ? 110 : o.lift, res }; }); }
    const wob = (n) => { K.sfx.whoops(); n.to({ rot: 0.12 }, { dur: 0.08 }).then(() => n.to({ rot: -0.1 }, { dur: 0.1 })).then(() => n.to({ rot: 0 }, { dur: 0.35, ease: 'elastic' })); };
    const top = (n, z) => { n.z = z; st.root._sorted = false; };
    function slots(n, dx, dy, rect) {
      rect = rect || inner;
      const per = Math.max(1, Math.floor(rect.w / dx)), rows = Math.ceil(n / per), each = Math.ceil(n / rows), ddy = Math.min(dy, rect.h / rows), out = [];
      for (let i = 0; i < n; i++) { const r = Math.floor(i / each), inRow = Math.min(each, n - r * each), c = i - r * each; out.push({ x: rect.x + rect.w / 2 + (c - (inRow - 1) / 2) * dx, y: rect.y + rect.h / 2 + (r - (rows - 1) / 2) * ddy }); }
      return out;
    }
    const sayN = (n) => { if (n >= 1 && n <= SPOKEN_MAX) ctx.say(N(n)); };
    const pickN = (a, b, tag2) => { let n, guard = 0; do { n = K.randInt(a, b); } while (tag2 + n === lastKey && a !== b && guard++ < 20); return n; };

    /* ---------- hen and chicks on the roof of the nest box ---------- */
    const hs = land ? 1 : 0.72;
    const hen = st.add({ z: 12, x: T.x0 + (land ? 110 : 92), y: T.y0 - 2, sx: hs, sy: hs, label: 'hen', hit: { x: -100, y: -190, w: 200, h: 190 }, bob: 0 });
    hen.draw = (g) => { g.save(); const b = Math.sin(st.t * 2.2) * 0.012 + hen.bob * 0.08 * Math.sin(st.t * 30); g.scale(1 - b, 1 + b); put(g, henSp()); g.restore(); };
    hen.update = (dt) => { hen.bob = Math.max(0, hen.bob - dt * 1.6); };
    const cluck = () => { [0, 0.13, 0.26].forEach((d, i) => K.sfx.tone(i === 2 ? 620 : 430, i === 2 ? 0.2 : 0.07, { type: 'square', vol: 0.07, to: i === 2 ? 760 : 380, delay: d })); };
    hen.onTap = () => { cluck(); hen.bob = 1; ctx.fx.burst(hen.x, hen.y - 120 * hs, { n: 7, colors: ['#FBF4E4', '#F3E6CA', '#F2B33D'], star: false }); };
    const chicks = [];
    for (let i = 0; i < 4; i++) {
      const c = st.add({ z: 12, x: T.x1 - (land ? 70 : 52) - i * (land ? 92 : 74), y: T.y0 - 2, hatched: false, hop: 0, label: 'chick', hit: { x: -40, y: -120, w: 80, h: 120 }, pressable: false });
      const ch = land ? 122 : 100;
      c.draw = (g, s) => {
        g.save(); g.translate(0, -Math.abs(Math.sin(c.hop * 9)) * 26 * Math.min(1, c.hop)); const im = c.hatched ? PIC.chick : PIC.egg;
        if (im) { const k = (c.hatched ? ch : ch * 0.86) / im.height; g.drawImage(im, -im.width * k / 2, -im.height * k, im.width * k, im.height * k); }
        else if (c.hatched) { g.scale(ch / 120, ch / 120); paintChick(g, s * ch / 120); } else { g.translate(0, -ch * 0.43); g.scale(ch / 100, ch / 100); paintEgg(g, s, 0); }
        g.restore();
      };
      c.update = (dt) => { c.hop = Math.max(0, c.hop - dt); };
      c.onTap = () => { c.hop = 0.7; K.sfx.tone(c.hatched ? 1500 : 500, 0.09, { type: 'triangle', vol: 0.12, to: c.hatched ? 1900 : 420 }); if (c.hatched) K.sfx.tone(1700, 0.09, { type: 'triangle', vol: 0.1, to: 2100, delay: 0.12 }); };
      chicks.push(c);
    }
    function hatch(i) { const c = chicks[i]; if (!c) return; c.hatched = true; c.hop = 1.1; K.sfx.pop(); ctx.fx.burst(c.x, c.y - 70, { n: 12, colors: ['#FBF4E4', '#F6CE4A', '#FFFFFF'] }); ctx.after(200, () => { K.sfx.tone(1500, 0.09, { type: 'triangle', vol: 0.12, to: 1900 }); K.sfx.tone(1700, 0.09, { type: 'triangle', vol: 0.1, to: 2100, delay: 0.12 }); }); }

    /* ---------- Pip and his order bubble ---------- */
    const pip = st.add({ z: 20, x: PP.x, y: PP.y, sx: PP.s, sy: PP.s, cheer: 0, blink: 0, nextBlink: 2, label: 'Pip', hit: { x: -66, y: -172, w: 132, h: 172 }, state: {} });
    pip.draw = (g, s) => { const p = pip.state; p.squash = pip.cheer > 0 ? Math.sin(st.t * 15) * 0.05 : Math.sin(st.t * 1.8) * 0.012; p.mouth = pip.cheer > 0 ? 'open' : 'smile'; p.wave = pip.cheer > 0 ? Math.sin(st.t * 12) * 0.5 + 0.5 : 0; p.blink = pip.blink > 0 ? 1 : 0; A.pip(g, s * PP.s, p); };
    pip.update = (dt) => { pip.cheer = Math.max(0, pip.cheer - dt); pip.blink = Math.max(0, pip.blink - dt); if ((pip.nextBlink -= dt) < 0) { pip.blink = 0.14; pip.nextBlink = 2 + Math.random() * 3; } };
    pip.onTap = () => { pip.cheer = 0.8; K.sfx.sparkle(); ctx.fx.burst(pip.x, pip.y - 150 * PP.s, { n: 8 }); };
    const bub = st.add({ z: 45, x: BUB.x, y: BUB.y, pop: 0 });
    bub.draw = (g, s) => {
      const b = R && R.bubble; if (!b) return;
      const w = BUB.w, h = BUB.h, k = 1 + bub.pop * 0.08;
      g.save(); g.translate(w / 2, h / 2); g.scale(k, k); g.translate(-w / 2, -h / 2);
      const tail = [[w * 0.56, h - 14], [w * 0.72, h + 40], [w * 0.8, h - 14]];
      g.beginPath(); A.cut(g, tail, 8, 0.5, 4); A.paper(g, s, '#FFFDF6', { shadow: 0.9 });
      g.beginPath(); A.rect(g, 0, 0, w, h, 40, 6, 1.2); A.paper(g, s, '#FFFDF6', { shadow: 0.9, depth: 1.2, light: 0.03, box: { x: 0, y: 0, w, h } });
      g.beginPath(); A.cut(g, tail, 8, 0.5, 4); g.fillStyle = '#FFFDF6'; g.fill();
      if (b.eggs) {
        const n = b.eggs, per = n <= 5 ? n : Math.ceil(n / 2), rows = n <= 5 ? 1 : 2, cw = Math.min(64, (w - 30) / per), q = Math.min(cw / 70, (h - 24) / rows / 92);
        for (let i = 0; i < n; i++) {
          const r = Math.floor(i / per), inRow = r === rows - 1 ? n - per * (rows - 1) : per, x = w / 2 + (i - r * per - (inRow - 1) / 2) * cw, y = h / 2 + (r - (rows - 1) / 2) * 92 * q;
          g.save(); g.translate(x, y); g.scale(q, q);
          if (i < (b.filled || 0)) put(g, eggSp(1)); else { g.beginPath(); eggPath(g, 62, 82); g.fillStyle = '#EFE6D4'; g.fill(); g.setLineDash([7, 7]); g.strokeStyle = 'rgba(46,42,59,.3)'; g.lineWidth = 3; g.stroke(); g.setLineDash([]); }
          g.restore();
        }
      } else {
        g.fillStyle = b.col || A.C.ink; g.font = `800 ${Math.round(h * 0.62)}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.text, w / 2, h / 2 + 4);
      }
      g.restore();
    };
    bub.update = (dt) => { bub.pop = Math.max(0, bub.pop - dt * 3); };

    /* ---------- baskets ---------- */
    function mkBasket(x, y, s, label) {
      const b = { x, y, s, count: 0, showTag: true, glow: false, pop: 0 };
      const n = st.add({ z: 40, x, y, sx: s, sy: s, label, hit: { x: -BW - 10, y: -BH - 70, w: BW * 2 + 20, h: BH + 76 }, pad: 4 });
      b.node = n;
      n.draw = (g, sc) => {
        if (b.glow) { g.save(); g.translate(0, -BH * 0.6); glowAt(g, 250, 190, 0.5 + Math.sin(st.t * 7) * 0.25); g.restore(); }
        put(g, basketBack());
        const pile = Math.min(10, b.count);
        for (let i = pile - 1; i >= 0; i--) { const front = i < 5, x2 = (front ? -96 : -84) + (i % 5) * (front ? 48 : 42), y2 = -BH - (front ? 8 : 40); g.save(); g.translate(x2, y2); g.rotate(((i * 37) % 7 - 3) * 0.05); g.scale(0.62, 0.62); put(g, eggSp(i + (b.seed || 0))); g.restore(); }
        put(g, basketFront());
        if (b.showTag) {
          const k = 1 + b.pop * 0.25; g.save(); g.translate(0, -50); g.rotate(-0.04); g.scale(k, k);
          A.line(g, 'rgba(90,56,36,.6)', 3, (h) => { h.moveTo(-20, -40); h.lineTo(0, -52); h.lineTo(20, -40); });
          g.beginPath(); A.rect(g, -58, -42, 116, 82, 16, 5, 0.8); A.paper(g, sc, '#FFFDF6', { shadow: 0.8, light: 0.03, box: { x: -58, y: -42, w: 116, h: 82 } });
          g.fillStyle = A.C.tomato; g.font = `800 ${String(b.count).length > 1 ? 58 : 66}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(b.count), 0, 4);
          g.restore();
        }
      };
      n.update = (dt) => { b.pop = Math.max(0, b.pop - dt * 3); };
      b.add = (v) => { b.count += v; b.pop = 1; n.to({ sy: s * 0.93 }, { dur: 0.08, ease: 'out' }).then(() => n.to({ sy: s }, { dur: 0.4, ease: 'elastic' })); };
      b.mouth = () => ({ x: b.x, y: b.y - (BH + 30) * b.s });
      return b;
    }
    const B = mkBasket(BK.x, BK.y, BK.s, 'basket');
    B.node.onTap = () => { lastTouch = st.t; if (R && !R.over && R.basketTap) R.basketTap(); else K.sfx.tap(); };

    /* ---------- the banner that shows the sum ---------- */
    const banner = st.add({ z: 70, x: inner.x + inner.w / 2, y: inner.y + inner.h / 2, sx: 0, sy: 0, text: '' });
    banner.draw = (g, s) => {
      if (!banner.text) return;
      g.font = `800 ${land ? 96 : 76}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const w = Math.min(inner.w + 20, g.measureText(banner.text).width + 90), h = land ? 150 : 124;
      g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 34, 3, 1.5); A.paper(g, s, '#FFFDF6', { depth: 1.6, light: 0.03, box: { x: -w / 2, y: -h / 2, w, h } });
      g.fillStyle = A.C.ink; g.fillText(banner.text, 0, 6, w - 50);
    };
    const showBanner = (t) => { banner.text = t; banner.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' }); };
    const hideBanner = () => banner.to({ sx: 0, sy: 0 }, { dur: 0.2, ease: 'inOut' }).then(() => { banner.text = ''; });

    /* ---------- things to count: eggs, boxes of ten, pairs ---------- */
    const KIND = { egg: { val: 1, label: 'egg', glow: [70, 80], tagY: -50 }, box: { val: 10, label: 'box of ten', glow: [170, 100], tagY: -54 }, pair: { val: 2, label: 'two eggs', glow: [100, 84], tagY: -52 } };
    function mkItem(kind, pos, sc, i) {
      const kd = KIND[kind];
      const it = { kind, val: kd.val, where: 'src', home: { x: pos.x, y: pos.y, s: sc }, v: i, tag: null, glow: false, lit: false, busy: false };
      const n = st.add(Object.assign({ z: 30, x: pos.x, y: pos.y, sx: 0, sy: 0, rot: kind === 'egg' ? (Math.random() - 0.5) * 0.3 : 0, pad: 10, pressable: false, label: kd.label }, kind === 'egg' ? { hitR: 46 } : kind === 'box' ? { hit: { x: -118, y: -46, w: 236, h: 98 } } : { hit: { x: -66, y: -50, w: 132, h: 100 } }));
      it.node = n;
      n.draw = (g, s) => {
        if (it.glow || it.lit) glowAt(g, kd.glow[0], kd.glow[1], it.glow ? 0.6 + Math.sin(st.t * 7) * 0.25 : 0.6);
        put(g, kind === 'egg' ? eggSp(it.v) : kind === 'box' ? boxSp() : pairSp());
        if (it.tag != null) tag(g, s, String(it.tag), 0, kd.tagY, kind === 'egg' ? 25 : 30);
      };
      n.update = (dt) => flyStep(n, dt);
      n.to({ sx: sc, sy: sc }, { dur: 0.36, ease: 'back', delay: 0.05 + i * 0.05 });
      n.onDown = (p) => {
        lastTouch = st.t;
        if (!R || R.over || R.locked || it.busy || !R.items.includes(it)) return;
        it.grab = { dx: n.x - p.x, dy: n.y - p.y, s: n.sx }; K.sfx.tap(); n.tweens.length = 0; n.sx = n.sy = it.grab.s * 1.14; top(n, 62);
      };
      n.onMove = (p, e, s) => { if (!it.grab || !R.drop) return; if (s.moved > 24) { it.drag = true; n.x = p.x + it.grab.dx; n.y = p.y + it.grab.dy; } };
      n.onUp = () => {
        if (!it.grab) return; const g0 = it.grab; it.grab = null; n.sx = n.sy = g0.s; const was = it.drag; it.drag = false;
        if (!R || R.over) { goHome(it); return; }
        if (was) R.drop(it); else { top(n, 30); R.tap(it); }
      };
      n.onTap = (p) => { if (!p && R && !R.over && !R.locked && !it.busy) R.tap(it); };
      R.items.push(it); R.nodes.push(n);
      return it;
    }
    function goHome(it) { it.busy = true; it.where = 'src'; it.node.visible = true; return fly(it.node, it.home.x, it.home.y, { s: it.home.s, dur: 0.34, lift: 60 }).then(() => { it.busy = false; top(it.node, 30); }); }
    function hopInPlace(it) { fly(it.node, it.node.x, it.node.y, { dur: 0.3, lift: 36 }); }
    /** An item hops into the main basket and is counted as it lands. */
    function toBasket(it, quick) {
      const r = R; it.busy = true; it.where = 'dst'; it.glow = false; r.inFlight++; r.stamp++; top(it.node, 62); K.sfx.whoosh();
      const m = B.mouth();
      return fly(it.node, m.x, m.y, { s: it.home.s * 0.6, dur: quick ? 0.2 : 0.42, lift: quick ? 30 : 130 }).then(() => {
        if (R !== r) return;
        it.node.visible = false; it.busy = false; r.inFlight--; r.given.push(it); B.add(it.val);
        K.sfx.step((B.count - 1) % 10); ctx.fx.burst(m.x, m.y, { n: 6 }); sayN(B.count); if (B.count > SPOKEN_MAX) K.sfx.ding();
        if (r.bubble && r.bubble.eggs) { r.bubble.filled = B.count; bub.pop = 0.6; }
        r.landed();
      });
    }
    function fromBasket() {
      const r = R, it = r.given.pop(); if (!it) { K.sfx.tap(); return null; }
      r.stamp++; B.add(-it.val); B.glow = false; const m = B.mouth(); it.node.x = m.x; it.node.y = m.y; it.node.sx = it.node.sy = it.home.s * 0.6;
      K.sfx.pop(); goHome(it); if (r.bubble && r.bubble.eggs) r.bubble.filled = B.count;
      return it;
    }
    const nearBasket = (it) => { const m = B.mouth(); return Math.abs(it.node.x - B.x) < (BW + 60) * B.s && it.node.y > m.y - 150 * B.s && it.node.y < B.y + 40; };
    const left = () => R.items.filter((it) => it.where === 'src');

    /* ---------- rounds ---------- */
    const SET = {};
    /* touch and count: every egg (or pair, or egg after the number on the basket) hops in as it is touched */
    SET.touch = (r, o) => {
      const n = o.n || (L === 1 ? pickN(rounds === 0 ? 2 : 1, Math.min(5, 3 + sk()), 'touch') : pickN(4, Math.min(10, 6 + sk()), 'touch'));
      r.answer = n; r.say = `${SAY.count} ${SAY.touch}`;
      slots(n, 116, 120).forEach((p, i) => mkItem('egg', { x: p.x + (Math.random() - 0.5) * 16, y: p.y + (Math.random() - 0.5) * 14 }, 1, i));
      r.tap = (it) => { if (it.where === 'src') toBasket(it); };
      r.drop = (it) => (nearBasket(it) ? toBasket(it, true) : goHome(it));
      r.landed = () => { if (!left().length && !r.inFlight) finish(); };
    };
    SET.on = (r, o) => {
      const k = o.k || K.randInt(2, Math.min(5, 3 + sk())), s0 = o.n || pickN(5, Math.min(SPOKEN_MAX - k, 8 + sk() * 3), 'on');
      r.answer = s0 + k; B.count = s0; r.say = `${N(s0)} ${SAY.on}`; r.show = `${s0} in the basket. Count on.`;
      slots(k, 116, 120).forEach((p, i) => mkItem('egg', p, 1, i));
      r.tap = (it) => { if (it.where === 'src') toBasket(it); };
      r.drop = (it) => (nearBasket(it) ? toBasket(it, true) : goHome(it));
      r.landed = () => { if (!left().length && !r.inFlight) finish({ banner: `${s0} + ${k} = ${s0 + k}` }); };
    };
    SET.twos = (r, o) => {
      const dx = land ? 142 : 156, cap2 = Math.max(3, Math.min(10, Math.floor(inner.w / dx) * Math.floor(inner.h / 112)));
      const n = o.n || pickN(3, Math.min(cap2, 5 + sk() * 2), 'twos');
      r.answer = n * 2; r.say = SAY.twos;
      slots(n, dx, 124).forEach((p, i) => mkItem('pair', p, 1, i));
      r.tap = (it) => { if (it.where === 'src') toBasket(it); };
      r.drop = (it) => (nearBasket(it) ? toBasket(it, true) : goHome(it));
      r.landed = () => { if (!left().length && !r.inFlight) finish({ banner: `${n} × 2 = ${n * 2}` }); };
    };
    /* give Pip a number of eggs: the child decides when to stop */
    function giveLogic(r) {
      r.tap = (it) => {
        if (it.where !== 'src') return;
        if (r.lock && B.count + r.inFlight >= r.target) { hopInPlace(it); return; }
        toBasket(it);
      };
      r.drop = (it) => (nearBasket(it) && !(r.lock && B.count + r.inFlight >= r.target) ? toBasket(it, true) : goHome(it));
      const settle = (ms) => { const stamp = ++r.stamp; ctx.after(ms, () => { if (R === r && !r.over && r.stamp === stamp && !r.inFlight && B.count === r.target) { r.locked = true; finish({ say: r.doneSay, banner: r.doneBanner && r.doneBanner() }); } }); };
      r.check = () => {
        if (r.over) return;
        if (r.wrong && r.wrong()) { r.miss++; wob(B.node); if (B.count > r.target) B.glow = true; ctx.say(r.hint()); return; }
        B.glow = false;
        if (B.count === r.target && !r.inFlight) { if (r.lock) r.locked = true; settle(r.lock ? 750 : 1300); }
      };
      r.landed = r.check;
      r.basketTap = () => { if (r.lock || r.locked) { K.sfx.tap(); return; } if (fromBasket()) { sayN(B.count); r.check(); } };
    }
    SET.give = (r, o) => {
      const n = o.n || (L === 1 ? pickN(rounds < 2 ? 2 : 1, Math.min(5, 3 + sk()), 'give') : pickN(3, Math.min(9, 5 + sk()), 'give'));
      const capN = Math.floor(inner.w / 116) * Math.max(2, Math.floor(inner.h / 100));
      r.answer = r.target = n; r.lock = L === 1; r.bubble = { eggs: n, filled: 0 };
      r.say = `${SAY.wants} ${N(n)}`; r.show = `Give Pip ${n} ${n === 1 ? 'egg' : 'eggs'}`; r.doneSay = SAY.enough;
      slots(Math.min(capN, n + (L === 1 ? 2 : 3)), 116, 120).forEach((p, i) => mkItem('egg', p, 1, i));
      r.wrong = () => B.count > n; r.hint = () => `${SAY.tooMany} ${SAY.back}`;
      giveLogic(r);
    };
    SET.adjust = (r, o) => {
      const n = o.n || pickN(2, Math.min(8, 4 + sk() * 2), 'adjust'), dir = o.dir || (Math.random() < 0.5 ? 1 : -1);
      r.answer = r.target = n + dir; r.bubble = { text: dir > 0 ? '+1' : '−1', col: A.C.teal };
      r.say = `${N(n)} ${dir > 0 ? SAY.more1 : SAY.less1}`; r.show = dir > 0 ? `${n} and one more` : `${n} and one fewer`;
      const ps = slots(n + 3, 116, 120);
      for (let i = 0; i < n + 3; i++) { const it = mkItem('egg', ps[i], 1, i); if (i >= 3) { it.where = 'dst'; it.node.visible = false; r.given.push(it); } }
      B.count = n;
      r.wrong = () => (dir > 0 ? B.count < n || B.count > n + 1 : B.count > n || B.count < n - 1);
      r.hint = () => (dir > 0 ? SAY.more1 : SAY.less1);
      r.doneBanner = () => `${n} ${dir > 0 ? '+' : '−'} 1 = ${n + dir}`;
      giveLogic(r);
    };
    /* boxes of ten and loose eggs */
    function tensLayout(nb, nl) {
      const bs = land ? 0.9 : 0.85, es = 0.82;
      const ra = land ? { x: inner.x, y: inner.y, w: inner.w * 0.62, h: inner.h } : { x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.5 };
      const rb = land ? { x: inner.x + inner.w * 0.62, y: inner.y, w: inner.w * 0.38, h: inner.h } : { x: inner.x, y: inner.y + inner.h * 0.5, w: inner.w, h: inner.h * 0.5 };
      slots(nb, 236 * bs + 10, 112 * bs + 8, ra).forEach((p, i) => mkItem('box', p, bs, i));
      slots(nl, land ? 90 : 94, 96, rb).forEach((p, i) => mkItem('egg', p, es, i + 2));
    }
    SET.tens = (r, o) => {
      const nb = o.b || K.randInt(1, Math.min(4, 2 + sk())); let nl = o.l, guard = 0;
      if (nl == null) do { nl = K.randInt(sk() ? 0 : 1, sk() ? 9 : 5); } while ('tens' + (nb * 10 + nl) === lastKey && guard++ < 20);
      r.answer = nb * 10 + nl; r.total = 0; r.bubble = { text: '0', col: A.C.tomato }; r.hideBasket = true;
      r.say = `${SAY.box} ${SAY.tens}`;
      tensLayout(nb, nl);
      r.tap = (it) => {
        if (it.lit) { hopInPlace(it); K.sfx.tap(); return; }
        it.lit = true; r.total += it.val; it.tag = r.total; r.bubble.text = String(r.total); bub.pop = 1; hopInPlace(it);
        K.sfx.step(r.items.filter((x) => x.lit).length - 1); if (it.val === 10) K.sfx.note(392, 0.3); ctx.fx.burst(it.node.x, it.node.y, { n: 6 }); sayN(r.total); if (r.total > SPOKEN_MAX) K.sfx.pop();
        if (r.items.every((x) => x.lit)) finish({ banner: nl && nb ? `${nb * 10} + ${nl} = ${r.total}` : String(r.total) });
      };
    };
    SET.make = (r, o) => {
      const nb = sk() >= 2 ? 4 : 3, n = o.n || pickN(11, Math.min(nb * 10 + 9, 19 + sk() * 8), 'make');
      r.answer = r.target = n; r.bubble = { text: String(n), col: A.C.ink };
      r.say = `${SAY.wants}${n <= SPOKEN_MAX ? ' ' + N(n) : ''} ${SAY.useBox}`; r.show = `Give Pip ${n} eggs`; r.doneSay = SAY.enough;
      tensLayout(nb, 9);
      r.wrong = () => B.count > n; r.hint = () => `${SAY.tooMany} ${SAY.back}`;
      r.doneBanner = () => { const b = r.given.filter((x) => x.kind === 'box').length, l = r.given.length - b; return b && l ? `${b * 10} + ${l} = ${n}` : String(n); };
      giveLogic(r);
    };
    /* quick look: an amount in a dice or ten-frame layout, hidden under a cloth after a moment */
    SET.quick = (r, o) => {
      const dice = o.dice == null ? sk() < 2 : o.dice, n = o.n || (dice ? pickN(1, 6, 'quick') : pickN(4, 10, 'quick'));
      r.answer = n; r.hideBasket = true; r.say = `${SAY.quick} ${SAY.look}`; r.open = false; r.tags = 0;
      const cx = inner.x + inner.w / 2, cy = inner.y + inner.h / 2;
      const bw = dice ? 290 : 484, bh = dice ? 290 : 204, sc = Math.min(1, (inner.w - 4) / bw, (inner.h - 14) / bh);
      const pts = dice ? DICE[n].map(([a, b]) => [a * 88, b * 88]) : Array.from({ length: n }, (_, i) => [(i % 5 - 2) * 92, i < 5 ? -46 : 46]);
      const board = st.add({ z: 30, x: cx, y: cy, sx: 0, sy: 0 });
      const boardSp = A.sprite('count-board' + (dice ? 'd' : 'f'), [-bw / 2 - 6, -bh / 2 - 6, bw + 12, bh + 12], (g, s) => {
        g.beginPath(); A.rect(g, -bw / 2, -bh / 2, bw, bh, dice ? 40 : 22, 4, 1.2); A.paper(g, s, dice ? '#E2B455' : '#B57C48', { depth: 1.2, light: 0.06, box: { x: -bw / 2, y: -bh / 2, w: bw, h: bh } });
        if (dice) { g.beginPath(); A.rect(g, -bw / 2 + 16, -bh / 2 + 16, bw - 32, bh - 32, 30, 6, 1.5); g.fillStyle = '#F3D98E'; g.fill(); }
        else for (let i = 0; i < 10; i++) { g.beginPath(); A.rect(g, (i % 5 - 2) * 92 - 41, (i < 5 ? -46 : 46) - 41, 82, 82, 16, i + 2, 0.8); g.fillStyle = '#F3D98E'; g.fill(); }
      });
      board.draw = (g, s) => { put(g, boardSp); pts.forEach(([x, y], i) => { g.save(); g.translate(x, y - 2); g.scale(0.8, 0.8); put(g, eggSp(i)); g.restore(); if (i < r.tags) tag(g, s, String(i + 1), x + 22, y - 30, 20); }); };
      board.to({ sx: sc, sy: sc }, { dur: 0.4, ease: 'back' });
      const cw = bw * sc + 30, chh = bh * sc + 26;
      const cloth = st.add({ z: 34, x: cx, y: cy - 300, alpha: 0, visible: false, label: 'cloth', hit: { x: -cw / 2, y: -chh / 2, w: cw, h: chh }, pad: 0, down: false,
        sprite: A.sprite('count-cloth' + Math.round(cw) + 'x' + Math.round(chh), [-cw / 2 - 4, -chh / 2 - 4, cw + 8, chh + 8], (g, s) => {
          g.beginPath(); A.rect(g, -cw / 2, -chh / 2, cw, chh, 20, 8, 3); A.paper(g, s, '#E8664A', { depth: 1.4, light: 0.06, box: { x: -cw / 2, y: -chh / 2, w: cw, h: chh } });
          g.save(); g.beginPath(); A.rect(g, -cw / 2, -chh / 2, cw, chh, 20, 8, 3); g.clip(); g.fillStyle = 'rgba(255,250,236,.3)';
          for (let x = -cw / 2 + 18; x < cw / 2; x += 60) g.fillRect(x, -chh / 2, 30, chh); for (let y = -chh / 2 + 16; y < chh / 2; y += 60) g.fillRect(-cw / 2, y, cw, 30);
          g.restore();
        }) });
      const cover = () => { if (R !== r || r.over || r.open) return; cloth.visible = true; cloth.down = true; K.sfx.whoosh(); cloth.to({ y: cy, alpha: 1 }, { dur: 0.35, ease: 'out' }); hen.bob = 0.6; };
      const lift = () => { cloth.down = false; K.sfx.whoosh(); return cloth.to({ y: cy - 300, alpha: 0 }, { dur: 0.3, ease: 'inOut' }).then(() => { cloth.visible = false; }); };
      cloth.onTap = () => { lastTouch = st.t; if (!cloth.down || r.over) return; const stamp = ++r.stamp; lift(); ctx.after(2200, () => { if (r.stamp === stamp) cover(); }); };
      ctx.after(L >= 3 ? 1900 : 2700, () => { cover(); if (R === r && !r.over && !r.open && rounds < 6) ctx.after(2600, () => { if (R === r && !r.over && cloth.down && !r.miss) ctx.say(SAY.peek); }); });
      // three number cards
      const lo = 1, hi = dice ? 6 : 10, opts = K.shuffle([n - 2, n - 1, n + 1, n + 2].filter((v) => v >= lo && v <= hi)).slice(0, 2).concat(n).sort((a, b) => a - b);
      const cs = land ? 156 : 140, cyy = land ? floorY + 122 : floorY + 96;
      r.cards = opts.map((v, i) => {
        const c = st.add({ z: 40, x: cx + (i - 1) * (cs + (land ? 44 : 30)), y: cyy, sx: 0, sy: 0, label: String(v), val: v, hit: { x: -cs / 2, y: -cs / 2, w: cs, h: cs }, pad: 6, dim: false, glow: false });
        c.draw = (g, s) => {
          if (c.glow) glowAt(g, cs, cs, 0.55 + Math.sin(st.t * 7) * 0.25);
          g.beginPath(); A.rect(g, -cs / 2, -cs / 2, cs, cs, 28, v + 3, 1.5); A.paper(g, s, c.dim ? '#E9E0CF' : '#FFFDF6', { depth: 1.2, light: 0.04, box: { x: -cs / 2, y: -cs / 2, w: cs, h: cs } });
          g.fillStyle = c.dim ? 'rgba(46,42,59,.3)' : [A.C.tomato, A.C.teal, A.C.plum][i]; g.font = `800 ${Math.round(cs * 0.64)}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(v), 0, cs * 0.04);
        };
        c.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back', delay: 0.2 + i * 0.08 });
        c.onTap = () => {
          lastTouch = st.t; if (r.over || c.dim) return;
          if (v === n) {
            r.open = true; r.stamp++; r.locked = true; if (cloth.down) lift(); K.sfx.ding(); ctx.fx.burst(c.x, c.y, { n: 12 });
            for (let k = 1; k <= n; k++) ctx.after(250 + k * 150, () => { r.tags = k; K.sfx.step(k - 1); });
            ctx.after(300 + n * 150, () => { sayN(n); finish(); });
          } else {
            r.miss++; c.dim = true; wob(c); r.open = true; r.stamp++; if (cloth.down) lift(); ctx.say(SAY.countThem);
            if (r.miss >= 2) { r.tags = n; r.cards.forEach((q) => { q.glow = q.val === n; }); }
          }
        };
        r.nodes.push(c); return c;
      });
      r.nodes.push(board, cloth);
    };
    /* which basket has more (or fewer) */
    SET.which = (r, o) => {
      const fewer = o.fewer == null ? rounds > 2 && Math.random() < 0.4 : o.fewer, gap = Math.max(1, 3 - sk());
      let a, b, guard = 0;
      do { a = K.randInt(1, 10); b = K.randInt(1, 10); } while ((Math.abs(a - b) < gap || 'which' + (fewer ? Math.min(a, b) : Math.max(a, b)) === lastKey) && guard++ < 60);
      if (o.a) { a = o.a; b = o.b; }
      r.answer = fewer ? Math.min(a, b) : Math.max(a, b); r.hideBasket = true; r.say = fewer ? SAY.whichFewer : SAY.whichMore;
      const s2 = land ? Math.min(1, (inner.w / 2 - 14) / (BW * 2 + 50)) : 0.86, by = T.y1 - 26;
      r.baskets = [a, b].map((n, i) => {
        const bk = land ? mkBasket(inner.x + inner.w * (i ? 0.75 : 0.25), by, s2, i ? 'second basket' : 'first basket') : mkBasket(inner.x + inner.w * (i ? 0.56 : 0.44), i ? by + 4 : by - 186, s2, i ? 'second basket' : 'first basket');
        bk.count = n; bk.showTag = false; bk.seed = i * 2; bk.node.sx = bk.node.sy = 0; bk.node.to({ sx: s2, sy: s2 }, { dur: 0.4, ease: 'back', delay: i * 0.12 });
        bk.node.onTap = () => {
          lastTouch = st.t; if (r.over) return;
          if (n === r.answer) {
            r.baskets.forEach((q) => { q.showTag = true; q.pop = 1; q.glow = false; }); K.sfx.ding(); ctx.fx.burst(bk.x, bk.y - 150 * s2, { n: 12 });
            finish({ say: fewer ? SAY.hasFewer : SAY.hasMore, banner: fewer ? `${Math.min(a, b)} < ${Math.max(a, b)}` : `${Math.max(a, b)} > ${Math.min(a, b)}`, bannerY: T.y0 + 76 });
          } else {
            r.miss++; wob(bk.node); r.baskets.forEach((q) => { q.showTag = true; q.pop = 1; }); ctx.say(`${SAY.countThem} ${r.say}`);
            if (r.miss >= 2) r.baskets.forEach((q) => { q.glow = q.count === r.answer; });
          }
        };
        r.nodes.push(bk.node); return bk;
      });
    };
    /* share the eggs fairly between the nests */
    SET.share = (r, o) => {
      const choices = sk() < 1 ? [[2, 4], [2, 6], [2, 8]] : sk() < 2 ? [[2, 8], [3, 6], [3, 9], [2, 10]] : [[3, 9], [3, 12], [4, 8], [4, 12], [2, 12]];
      let [k, n] = K.pick(choices), guard = 0; while ('share' + n + '/' + k === lastKey && guard++ < 20) [k, n] = K.pick(choices);
      if (o.k) { k = o.k; n = o.n; }
      r.answer = n / k; r.key = n + '/' + k; r.hideBasket = true; r.hidePip = !land; r.say = `${SAY.share} ${SAY.same}`; r.sel = null; r.told = false;
      slots(n, 116, 120).forEach((p, i) => mkItem('egg', p, 1, i));
      const ns = land ? Math.min(1, (W * 0.76) / (k * 252)) : 0.92, faces = K.sample(A.faces, k);
      r.nests = Array.from({ length: k }, (_, i) => {
        const x = land ? W * 0.05 + (W * 0.76) * ((i + 0.5) / k) : (k === 3 && i === 2 ? W / 2 : W * (i % 2 ? 0.73 : 0.27));
        const y = land ? floorY + 146 : floorY + 150 + Math.floor(i / 2) * 196;
        const ne = { x, y, s: ns, eggs: [], glow: false, tagOn: false, hop: 0 };
        const nd = st.add({ z: 28, x, y, sx: 0, sy: 0, label: 'nest ' + (i + 1), hit: { x: -116, y: -64, w: 232, h: 120 }, pad: 6 });
        nd.draw = (g, s) => {
          g.save(); g.translate(0, -92 - Math.abs(Math.sin(ne.hop * 10)) * 16 * Math.min(1, ne.hop)); g.scale(0.92, 0.92); A.face(g, s, faces[i], {}); g.restore();
          if (ne.glow) glowAt(g, 170, 110, 0.5 + Math.sin(st.t * 7) * 0.25);
          put(g, nestSp());
        };
        nd.update = (dt) => { ne.hop = Math.max(0, ne.hop - dt); };
        nd.to({ sx: ns, sy: ns }, { dur: 0.4, ease: 'back', delay: i * 0.1 });
        nd.onTap = () => { lastTouch = st.t; if (!r.over) r.nestTap(i); };
        ne.node = nd; r.nodes.push(nd);
        const tg = st.add({ z: 64, x: x + 92 * ns, y: y + 30 * ns, visible: false }); tg.draw = (g, s) => tag(g, s, String(ne.eggs.length), 0, 0, 26, A.C.teal); ne.tagNode = tg; r.nodes.push(tg);
        return ne;
      });
      const slot = (ne, j) => ({ x: ne.x + ((j % 3) - 1) * 50 * ne.s, y: ne.y - (22 + Math.floor(j / 3) * 34) * ne.s });
      const tidy = (ne) => ne.eggs.forEach((it, j) => { const p = slot(ne, j); if (!it.busy) { it.node.to({ x: p.x, y: p.y }, { dur: 0.2 }); top(it.node, 32 + (9 - Math.floor(j / 3))); } });
      const unsel = () => { if (r.sel) { r.sel.glow = false; r.sel.node.to({ sx: r.sel.home.s, sy: r.sel.home.s }, { dur: 0.15 }); r.sel = null; } r.nests.forEach((q) => { if (!q.over) q.glow = false; }); };
      function toNest(it, i) {
        unsel(); const ne = r.nests[i]; if (typeof it.where === 'number') { const old = r.nests[it.where]; old.eggs.splice(old.eggs.indexOf(it), 1); tidy(old); }
        it.where = i; it.busy = true; r.inFlight++; ne.eggs.push(it); const p = slot(ne, ne.eggs.length - 1); top(it.node, 62); K.sfx.whoosh();
        fly(it.node, p.x, p.y, { s: 0.58 * ne.s, dur: 0.36, lift: 90 }).then(() => { if (R !== r) return; it.busy = false; r.inFlight--; K.sfx.step(ne.eggs.length - 1); ne.hop = 0.5; tidy(ne); r.check(); });
      }
      function takeBack(it) { const ne = r.nests[it.where]; ne.eggs.splice(ne.eggs.indexOf(it), 1); tidy(ne); K.sfx.pop(); goHome(it); r.check(); }
      r.tap = (it) => {
        if (typeof it.where === 'number') { if (r.sel) toNest(r.sel, it.where); else takeBack(it); return; }
        if (r.sel === it) { unsel(); return; }
        unsel(); r.sel = it; it.glow = true; it.node.to({ sx: it.home.s * 1.14, sy: it.home.s * 1.14 }, { dur: 0.15, ease: 'back' }); r.nests.forEach((q) => { q.glow = true; });
        if (!r.told) { r.told = true; ctx.say(SAY.pickNest); }
      };
      r.nestTap = (i) => { const ne = r.nests[i]; if (r.sel) toNest(r.sel, i); else if (ne.eggs.length) takeBack(ne.eggs[ne.eggs.length - 1]); else { K.sfx.tap(); ne.hop = 0.4; } };
      r.drop = (it) => {
        let best = -1, bd = 1e9; r.nests.forEach((ne, i) => { const d = Math.hypot(it.node.x - ne.x, (it.node.y - (ne.y - 30)) * 1.2); if (d < 190 * ne.s + 30 && d < bd) { bd = d; best = i; } });
        if (best >= 0) { if (it.where === best) { it.where = 'x'; const ne = r.nests[best]; ne.eggs.splice(ne.eggs.indexOf(it), 1); } toNest(it, best); }
        else if (typeof it.where === 'number') takeBack(it); else goHome(it);
      };
      r.check = () => {
        if (r.over) return;
        r.nests.forEach((ne) => { ne.over = false; ne.glow = false; ne.tagNode.visible = r.miss > 0; });
        if (left().length || r.inFlight) return;
        if (r.nests.every((ne) => ne.eggs.length === r.answer)) { r.nests.forEach((ne) => { ne.tagNode.visible = true; ne.hop = 1; }); finish({ say: SAY.allSame, banner: `${n} ÷ ${k} = ${r.answer}` }); return; }
        r.miss++; K.sfx.whoops(); ctx.say(`${SAY.notSame} ${SAY.same}`);
        r.nests.forEach((ne) => { ne.tagNode.visible = true; if (ne.eggs.length > r.answer) { ne.over = true; ne.glow = true; ne.hop = 0.6; } });
      };
    };

    const MODES = L === 1 ? ['touch', 'give'] : L === 2 ? ['touch', 'quick', 'adjust', 'which', 'give'] : ['tens', 'make', 'on', 'share', 'twos'];
    function clearRound() {
      if (!R) return; const old = R;
      for (const n of old.nodes) { n.onTap = n.onDown = null; n.fly = null; n.to({ sx: 0, sy: 0 }, { dur: 0.22, ease: 'inOut' }).then(() => n.remove()); }
      ctx.after(400, () => old.nodes.forEach((n) => n.remove()));
    }
    function newRound(mode, o) {
      if (R) clearRound();
      if (!mode) {
        if (rounds === 0) mode = MODES[0];
        else { if (!bag.length) bag = K.shuffle(MODES); if (bag[0] === lastMode && bag.length > 1) bag.push(bag.shift()); mode = bag.shift(); }
      }
      const r = R = { mode, nodes: [], items: [], given: [], miss: 0, over: false, locked: false, inFlight: 0, stamp: 0, bubble: null };
      B.count = 0; B.glow = false; B.showTag = true; hideBanner();
      SET[mode](r, o || {});
      B.node.visible = !r.hideBasket; pip.visible = !r.hidePip; bub.visible = !r.hidePip; bub.pop = 1;
      lastKey = mode + (r.key || r.answer); lastMode = mode; lastTouch = st.t; rounds++;
      K.sfx.pop();
      ctx.prompt(r.say, { show: r.show });
    }
    async function finish(x) {
      const r = R; if (r.over) return; r.over = true; x = x || {};
      for (const it of r.items) it.glow = false; B.glow = false;
      await ctx.wait(350);
      if (R !== r) return;
      K.sfx.sparkle(); pip.cheer = 1.4; hen.bob = 1; ctx.fx.burst(B.node.visible ? B.x : inner.x + inner.w / 2, B.node.visible ? B.y - 200 * B.s : inner.y, { n: 16 });
      if (x.banner && L >= 2) { banner.y = x.bannerY || inner.y + inner.h / 2; showBanner(x.banner); }
      if (x.say) await Promise.all([ctx.say(x.say), ctx.wait(1500)]); else await ctx.wait(L >= 2 && x.banner ? 1700 : 1000);
      if (R !== r) return;
      if (r.miss === 0) skill = Math.min(4, skill + 0.5); else if (r.miss >= 2) skill = Math.max(0, skill - 1);
      won++; hatch(won - 1);
      await ctx.wait(900);
      if (R !== r) return;
      hideBanner(); clearRound(); R = null;
      await ctx.wait(420);
      if (R) return;
      if (won >= 4) { await ctx.celebrate({ ms: 3400 }); won = 0; chicks.forEach((c) => { c.hatched = false; c.hop = 0.5; }); if (R) return; }
      newRound();
    }
    // a quiet spell: the next thing to touch gives a little hop
    ctx.every(1500, () => {
      if (!R || R.over || R.locked || st.t - lastTouch < 8) return; lastTouch = st.t - 3;
      const it = R.items.find((q) => q.where === 'src' && !q.lit && !q.busy);
      if (it && R.mode !== 'adjust' && !(R.target != null && B.count >= R.target)) { hopInPlace(it); K.sfx.tap(); }
    });

    K._count = {   // for browser tests
      get R() { return R; }, get skill() { return skill; }, set skill(v) { skill = v; }, get won() { return won; }, B, chicks, unit: st.unit,
      jump(mode, o) { if (R) R.over = true; newRound(mode, o); return R.answer; },
      at: (n) => ({ x: n.x * st.unit, y: n.y * st.unit }),
    };
    ctx.onExit(() => { K._count = null; });
    ctx.after(350, () => newRound());
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#EBCB98'; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(120,74,40,.25)'; g.lineWidth = 3 * u; for (let x = 60; x < 300; x += 80) { g.beginPath(); g.moveTo(x * u, 0); g.lineTo(x * u, w); g.stroke(); }
    g.fillStyle = '#EDC96C'; g.beginPath(); g.ellipse(w / 2, w * 1.02, w * 0.8, w * 0.3, 0, 0, 7); g.fill();
    g.save(); g.translate(150 * u, 250 * u); g.scale(u, u);
    g.fillStyle = '#9A6838'; g.beginPath(); g.ellipse(0, -BH, BW * 0.8, 26, 0, 0, 7); g.fill();
    const eggs = [[-66, -150, 0], [-22, -160, 1], [26, -156, 3], [68, -148, 2], [-44, -196, 4], [4, -204, 0], [48, -194, 1]];
    for (const [x, y, v] of eggs.slice(4).concat(eggs.slice(0, 4))) { g.save(); g.translate(x, y); g.rotate((v - 2) * 0.08); g.beginPath(); eggPath(g, 58, 76); g.fillStyle = EGG_COLS[v]; g.fill(); g.strokeStyle = 'rgba(120,80,40,.25)'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.ellipse(-10, -16, 6, 11, 0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill(); g.restore(); }
    g.fillStyle = '#CB9550'; g.beginPath(); g.moveTo(-BW * 0.8, -BH); g.bezierCurveTo(-70, -BH + 30, 70, -BH + 30, BW * 0.8, -BH); g.lineTo(BW * 0.8 - 26, -20); g.quadraticCurveTo(BW * 0.8 - 30, 0, BW * 0.8 - 54, 0); g.lineTo(-BW * 0.8 + 54, 0); g.quadraticCurveTo(-BW * 0.8 + 30, 0, -BW * 0.8 + 26, -20); g.closePath(); g.fill();
    g.fillStyle = 'rgba(120,70,30,.2)'; for (let r = 0; r < 4; r++) for (let i = -3; i <= 3; i++) if ((i + r) % 2) g.fillRect(i * 30 - 13 + (r % 2 ? 15 : 0), -BH + 44 + r * 20, 26, 12);
    g.fillStyle = '#E0B272'; g.beginPath(); g.moveTo(-BW * 0.8 - 5, -BH - 4); g.bezierCurveTo(-70, -BH + 28, 70, -BH + 28, BW * 0.8 + 5, -BH - 4); g.lineTo(BW * 0.8, -BH + 14); g.bezierCurveTo(70, -BH + 46, -70, -BH + 46, -BW * 0.8, -BH + 14); g.closePath(); g.fill();
    g.restore();
    g.save(); g.translate(232 * u, 70 * u); g.fillStyle = '#E8664A'; g.beginPath(); g.arc(0, 0, 44 * u, 0, 7); g.fill();
    g.fillStyle = '#FFFDF6'; g.font = `800 ${58 * u}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', 0, 3 * u); g.restore();
  }

  K.game({ id: 'count', title: 'Count the Eggs', voice: 'count', group: 'arcade', subject: 'math', age: 3, order: 14, icon, start, lines, resize: () => K.go('count') });
})();
