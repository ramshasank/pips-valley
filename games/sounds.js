/* First Sounds — feed the letter monster.
   A letter monster sits on the picnic rug and asks for things that start with its sound. Pictures bob
   around it; drag one into its mouth (or tap it) and it munches and says the sound and the word: "b. ball."
   The wrong thing is handed back with a shake of the head and the sound again. After two misses the right
   ones glow.
   Level 1: one monster, three pictures, one right, sounds that are far apart.
   Level 2: two monsters share out five or six pictures; then last sounds ("What ends with this sound? g.").
   Level 3: the middle vowel of three-letter words (picture plus the word with a gap), blends and digraphs
   written on the monster's sign (sh, ch, th, st, sn ...), and sorting written words by their first two letters.
   Letter sounds are spoken as the one-letter sentence "b." and words as one-word sentences, so each is
   recorded once and reused. */
(function () {
  'use strict';
  const A = K.art;

  /* ---------------- pictures ----------------
     A word's picture is a painted cut-out from img/ where one reads clearly as its word, and a small paper
     drawing made here where there is none. Both are drawn about 120 units across around (0,0). */
  const SRC = { apple: 'kitchen/apple', banana: 'kitchen/banana', ball: 'kitchen/ball', book: 'kitchen/book', sock: 'kitchen/sock', shoe: 'kitchen/shoe', hat: 'kitchen/hat', carrot: 'kitchen/carrot',
    cheese: 'kitchen/cheese', cookie: 'kitchen/cookie', tomato: 'kitchen/tomato', lemon: 'kitchen/lemon', pear: 'kitchen/pear', donut: 'kitchen/donut', strawberry: 'kitchen/strawberry', watermelon: 'kitchen/watermelon',
    cat: 'star/cat', moon: 'star/moon', star: 'star/star', house: 'star/house', rocket: 'star/rocket', owl: 'star/owl', panda: 'star/panda', dog: 'words/dog', cow: 'words/cow', pig: 'words/pig', bus: 'words/bus',
    fox: 'bobo/fox', frog: 'bobo/frog', sun: 'toot/sun', mouse: 'tales/mouse', kite: 'tales/kite', gift: 'tales/gift', flag: 'tales/flag', can: 'tales/can', turtle: 'tales/turtle', snowman: 'tales/snowman',
    chick: 'faces/chick', lion: 'faces/lion' };
  const PIM = {};
  function loadPic(nm) { if (PIM[nm] !== undefined || !SRC[nm]) return; PIM[nm] = null; const im = new Image(); im.onload = () => { PIM[nm] = im; }; im.src = 'img/' + SRC[nm] + '.webp'; }

  const INK = '#2E2A3B', DARK = '#3B3346', D = {};
  const bx = (r) => ({ x: -r, y: -r, w: r * 2, h: r * 2 });
  const P = (g, s, col, fn, o) => A.piece(g, s, col, fn, Object.assign({ box: bx(56), shadow: 0.55 }, o));       // a piece of cut paper
  const F = (g, col, fn) => { g.beginPath(); fn(g); g.fillStyle = col; g.fill(); };                              // a flat detail
  const ln = (g, col, w, fn) => A.line(g, col, w, fn);
  const ell = (x, y, rx, ry, rot) => (h) => { h.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); h.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832); };
  const box = (x, y, w, h2, r, seed) => (h) => A.rect(h, x, y, w, h2, r == null ? 8 : r, seed || 3, 0.5);
  const poly = (pts, r, seed) => (h) => A.cut(h, pts, r == null ? 5 : r, 0.5, seed || 5);
  const eyes = (g, x1, x2, y, r) => { for (const x of [x1, x2]) { F(g, '#3A2A2A', ell(x, y, r, r)); F(g, '#fff', ell(x + r * 0.32, y - r * 0.36, r * 0.36, r * 0.36)); } };
  const cheeks = (g, x1, x2, y, r) => { for (const x of [x1, x2]) F(g, 'rgba(240,128,112,.75)', ell(x, y, r, r * 0.72)); };
  const smile = (g, x, y, w) => ln(g, '#3A2A2A', 2.6, (h) => { h.moveTo(x - w, y); h.quadraticCurveTo(x, y + w * 0.9, x + w, y); });
  const shine = (g, x, y, rx, ry, rot) => F(g, 'rgba(255,255,255,.34)', ell(x, y, rx, ry, rot == null ? -0.6 : rot));
  const rope = (g, s, col, w, fn) => { g.save(); g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = 8 * s; g.shadowOffsetY = 4 * s; ln(g, col, w, fn); g.restore(); };
  const num = (t, col) => (g, s) => { P(g, s, '#FBF6EC', box(-50, -50, 100, 100, 22, 4)); g.font = `800 ${t.length > 1 ? 66 : 82}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(t, 0, 5); };

  D.bee = (g, s) => {
    P(g, s, '#DDEFF2', ell(-8, -30, 17, 26, -0.45), { shadow: 0.35 }); P(g, s, '#EEF8F8', ell(20, -30, 17, 26, 0.35), { shadow: 0.35 });
    P(g, s, DARK, poly([[40, 0], [58, 8], [40, 16]], 2), { shadow: 0.2 });
    P(g, s, '#F5C83F', ell(0, 8, 46, 34));
    g.save(); g.beginPath(); g.ellipse(0, 8, 46, 34, 0, 0, 7); g.clip(); g.fillStyle = DARK; g.fillRect(4, -30, 12, 80); g.fillRect(26, -30, 12, 80); g.restore();
    ln(g, DARK, 3, (h) => { h.moveTo(-30, -18); h.quadraticCurveTo(-36, -38, -46, -40); h.moveTo(-18, -24); h.quadraticCurveTo(-20, -42, -30, -48); });
    eyes(g, -32, -12, 2, 6); cheeks(g, -39, -4, 15, 6); smile(g, -22, 13, 6);
  };
  D.tree = (g, s) => {
    P(g, s, '#8A5A3C', poly([[-10, 6], [10, 6], [15, 56], [-15, 56]], 4));
    P(g, s, '#5E9A5A', (h) => A.blob(h, 0, -14, 50, 42, 0.1, 5, 10));
    P(g, s, '#7DB56C', (h) => A.blob(h, -12, -24, 24, 19, 0.12, 8, 8), { shadow: 0.15 });
    P(g, s, '#7DB56C', (h) => A.blob(h, 22, -2, 13, 11, 0.12, 9, 7), { shadow: 0.15 });
  };
  D.key = (g, s) => {
    g.save(); g.rotate(-0.55); g.translate(-6, 0);
    P(g, s, '#E9B23C', (h) => { A.rect(h, -8, -7, 66, 14, 5, 2, 0.3); A.rect(h, 32, 4, 10, 18, 3, 3, 0.3); A.rect(h, 46, 4, 10, 13, 3, 4, 0.3); h.moveTo(-5, 0); h.arc(-30, 0, 25, 0, 6.2832); h.moveTo(-19, 0); h.arc(-30, 0, 11, 0, 6.2832, true); });
    shine(g, -44, -10, 4, 9);
    g.restore();
  };
  D.car = (g, s) => {
    P(g, s, '#D9503F', (h) => { h.moveTo(-36, -8); h.quadraticCurveTo(-28, -42, -4, -42); h.lineTo(12, -42); h.quadraticCurveTo(30, -40, 42, -8); h.closePath(); });
    F(g, '#CFE8EE', poly([[-25, -12], [-19, -33], [-3, -33], [-3, -12]], 4, 2)); F(g, '#CFE8EE', poly([[4, -12], [4, -33], [15, -33], [29, -12]], 4, 3));
    P(g, s, '#E8664A', box(-56, -14, 112, 38, 14, 2));
    F(g, '#F7D27A', ell(50, -2, 4.5, 6)); F(g, 'rgba(120,30,24,.35)', box(-10, -8, 14, 5, 2, 4));
    for (const x of [-30, 30]) { P(g, s, DARK, ell(x, 26, 17, 17), { shadow: 0.3 }); F(g, '#D8D2C8', ell(x, 26, 7, 7)); }
  };
  D.jar = (g, s) => {
    P(g, s, '#E3F1F2', box(-36, -30, 72, 86, 16, 2));
    g.save(); g.beginPath(); A.rect(g, -36, -30, 72, 86, 16, 2, 0.5); g.clip(); g.fillStyle = '#D9534F'; g.fillRect(-40, -8, 80, 70); g.restore();
    P(g, s, '#FBF6EC', box(-24, 4, 48, 32, 5, 4), { shadow: 0.2 }); F(g, '#D9534F', ell(0, 22, 8, 9)); F(g, '#6FA65F', ell(0, 13, 7, 3));
    ln(g, 'rgba(255,255,255,.7)', 4, (h) => { h.moveTo(-27, -16); h.lineTo(-27, 40); });
    P(g, s, '#2F8F8A', box(-32, -52, 64, 24, 7, 5));
  };
  D.box = (g, s) => {
    P(g, s, '#B98558', poly([[-44, -22], [-60, -42], [-22, -50], [-6, -26]], 3, 2)); P(g, s, '#B98558', poly([[44, -22], [60, -42], [22, -50], [6, -26]], 3, 3));
    F(g, '#7A5236', poly([[-44, -26], [44, -26], [44, -8], [-44, -8]], 2, 4));
    P(g, s, '#D2A070', box(-44, -18, 88, 70, 5, 5));
    F(g, '#EBD6AE', box(-8, -18, 16, 28, 2, 6));
    ln(g, 'rgba(90,60,40,.4)', 2.5, (h) => { for (const x of [20, 31]) { h.moveTo(x, 40); h.lineTo(x, 24); h.moveTo(x - 5, 29); h.lineTo(x, 24); h.lineTo(x + 5, 29); } });
  };
  D.fan = (g, s) => {
    P(g, s, '#2F8F8A', poly([[-8, 22], [8, 22], [10, 46], [-10, 46]], 3)); P(g, s, '#2F8F8A', box(-30, 44, 60, 12, 6, 2));
    P(g, s, '#DCEDEE', ell(0, -10, 44, 44));
    for (let i = 0; i < 3; i++) { g.save(); g.translate(0, -10); g.rotate(i * 2.094 + 0.3); P(g, s, '#5B8FC7', (h) => { h.moveTo(0, 0); h.bezierCurveTo(-20, -12, -18, -38, 4, -38); h.bezierCurveTo(18, -36, 12, -12, 0, 0); }, { shadow: 0.25 }); g.restore(); }
    F(g, INK, ell(0, -10, 7, 7));
    ln(g, '#2F8F8A', 5, (h) => h.arc(0, -10, 44, 0, 6.2832));
  };
  D.pan = (g, s) => {
    g.save(); g.rotate(-0.3);
    P(g, s, '#8A5A3C', box(22, -8, 42, 16, 7, 2));
    P(g, s, '#4A4458', ell(-14, 0, 42, 42)); F(g, '#6C667C', ell(-14, 0, 32, 32)); shine(g, -30, -12, 5, 13);
    g.restore();
  };
  D.bed = (g, s) => {
    P(g, s, '#A06A42', box(-58, -36, 14, 80, 6, 2)); P(g, s, '#A06A42', box(46, -6, 12, 50, 6, 3));
    P(g, s, '#FBF6EC', box(-48, 2, 98, 26, 6, 4));
    P(g, s, '#FFFFFF', box(-44, -16, 32, 20, 9, 5), { shadow: 0.3 });
    P(g, s, '#5B8FC7', box(-14, -4, 64, 34, 8, 6));
    F(g, '#8DB3DE', box(-14, -4, 64, 9, 4, 7));
    for (const [x, y] of [[4, 16], [22, 12], [38, 20]]) F(g, '#F7D27A', ell(x, y, 3.5, 3.5));
  };
  D.pen = (g, s) => {
    ln(g, '#3B5FA0', 3.5, (h) => { h.moveTo(-52, 46); h.bezierCurveTo(-34, 30, -26, 58, -4, 44); });
    g.save(); g.rotate(-0.78);
    P(g, s, INK, poly([[-64, 0], [-46, -7], [-46, 7]], 2), { shadow: 0.2 }); P(g, s, '#E9B23C', box(-48, -9, 12, 18, 2, 2), { shadow: 0.2 });
    P(g, s, '#5B8FC7', box(-38, -10, 70, 20, 5, 3)); P(g, s, '#3B5FA0', box(24, -11, 36, 22, 7, 4)); P(g, s, '#D8D2C8', box(20, -16, 30, 5, 2, 5), { shadow: 0.2 });
    g.restore();
  };
  D.hen = (g, s) => {
    ln(g, '#E9963A', 4, (h) => { for (const x of [-8, 12]) { h.moveTo(x, 34); h.lineTo(x, 54); h.moveTo(x - 8, 57); h.lineTo(x, 54); h.lineTo(x + 8, 57); } });
    P(g, s, '#C96E3A', (h) => { h.moveTo(26, 0); h.quadraticCurveTo(62, -34, 50, 8); h.quadraticCurveTo(60, 16, 38, 26); h.closePath(); });
    P(g, s, '#D9503F', (h) => { h.arc(-31, -46, 7, 0, 7); h.moveTo(-14, -51); h.arc(-22, -51, 8, 0, 7); h.moveTo(-6, -46); h.arc(-13, -46, 7, 0, 7); }, { shadow: 0.2 });
    P(g, s, '#F3E3C8', (h) => { h.moveTo(-40, -28); h.bezierCurveTo(-40, -54, -6, -52, -6, -22); h.bezierCurveTo(10, -14, 44, -14, 44, 12); h.bezierCurveTo(44, 34, 20, 40, 0, 40); h.bezierCurveTo(-28, 40, -40, 20, -40, -28); });
    P(g, s, '#E2C9A0', ell(12, 14, 20, 13, 0.2), { shadow: 0.2 });
    P(g, s, '#E9B23C', poly([[-40, -34], [-57, -28], [-40, -21]], 2), { shadow: 0.2 }); F(g, '#D9503F', ell(-37, -13, 5, 8));
    eyes(g, -27, -27, -33, 4.5); cheeks(g, -18, -18, -23, 5);
  };
  D.log = (g, s) => {
    ln(g, '#6B4430', 7, (h) => { h.moveTo(20, -20); h.lineTo(28, -38); });
    P(g, s, '#6FA65F', (h) => { h.moveTo(28, -38); h.quadraticCurveTo(40, -58, 54, -40); h.quadraticCurveTo(40, -30, 28, -38); }, { shadow: 0.2 });
    P(g, s, '#8A5A3C', box(-44, -22, 102, 46, 20, 2));
    ln(g, 'rgba(60,36,24,.4)', 3, (h) => { h.moveTo(-6, -10); h.lineTo(26, -10); h.moveTo(4, 6); h.lineTo(42, 6); h.moveTo(-12, 14); h.lineTo(8, 14); });
    P(g, s, '#E2BC8A', ell(-40, 1, 16, 24), { shadow: 0.2 }); ln(g, '#B98558', 2.5, (h) => { h.ellipse(-40, 1, 9, 15, 0, 0, 6.2832); h.moveTo(-37, 1); h.ellipse(-40, 1, 3, 6, 0, 0, 6.2832); });
  };
  D.bug = (g, s) => {
    ln(g, INK, 4, (h) => { for (const y of [-8, 10, 28]) { h.moveTo(-34, y); h.lineTo(-54, y + 6); h.moveTo(34, y); h.lineTo(54, y + 6); } h.moveTo(-8, -44); h.quadraticCurveTo(-12, -56, -24, -56); h.moveTo(8, -44); h.quadraticCurveTo(12, -56, 24, -56); });
    P(g, s, DARK, ell(0, -30, 23, 18));
    P(g, s, '#DE4E46', ell(0, 10, 41, 38));
    ln(g, DARK, 3, (h) => { h.moveTo(0, -27); h.lineTo(0, 47); });
    for (const [x, y, r] of [[-18, -4, 7], [18, -4, 7], [-23, 20, 6], [23, 20, 6], [-9, 34, 5], [9, 34, 5]]) F(g, DARK, ell(x, y, r, r));
    for (const x of [-9, 9]) { F(g, '#fff', ell(x, -37, 6, 6)); F(g, INK, ell(x, -36, 3, 3)); }
    shine(g, -24, -8, 4, 10);
  };
  D.rug = (g, s) => {
    g.save(); g.transform(1, 0, -0.32, 0.78, 0, 4);
    ln(g, '#C98A3A', 3, (h) => { for (let y = -26; y <= 26; y += 7.4) { h.moveTo(-46, y); h.lineTo(-61, y); h.moveTo(46, y); h.lineTo(61, y); } });
    P(g, s, '#C9553F', box(-50, -32, 100, 64, 5, 2));
    F(g, '#F2B33D', box(-38, -32, 12, 64, 1, 3)); F(g, '#F2B33D', box(26, -32, 12, 64, 1, 4)); F(g, '#2F8F8A', box(-15, -32, 30, 64, 1, 5));
    ln(g, '#FBF6EC', 3, (h) => { h.moveTo(-8, -24); for (let i = 1; i < 7; i++) h.lineTo(i % 2 ? 8 : -8, -24 + i * 8); });
    g.restore();
  };
  D.cup = (g, s) => {
    ln(g, 'rgba(46,42,59,.22)', 4, (h) => { h.moveTo(-12, -30); h.quadraticCurveTo(-22, -40, -10, -52); h.moveTo(10, -30); h.quadraticCurveTo(0, -40, 12, -54); });
    P(g, s, '#FBF6EC', ell(0, 40, 54, 11));
    rope(g, s, '#E8664A', 9, (h) => h.arc(38, 0, 14, -1.3, 1.5));
    P(g, s, '#E8664A', (h) => { h.moveTo(-40, -22); h.lineTo(40, -22); h.quadraticCurveTo(40, 36, 0, 38); h.quadraticCurveTo(-40, 36, -40, -22); });
    F(g, '#B8442F', ell(0, -21, 39, 6)); for (const [x, y] of [[-18, 4], [0, 14], [18, 4]]) F(g, '#FBF6EC', ell(x, y, 4.5, 4.5));
  };
  D.mug = (g, s) => {
    rope(g, s, '#5B8FC7', 11, (h) => h.arc(34, 6, 19, -1.3, 1.3));
    P(g, s, '#5B8FC7', box(-42, -38, 76, 88, 10, 2));
    F(g, '#FBF6EC', box(-42, -8, 76, 12, 1, 3)); F(g, '#F2B33D', box(-42, 10, 76, 8, 1, 4));
    F(g, '#3F6FA6', ell(-4, -35, 34, 5)); shine(g, -30, -8, 4, 22, 0);
  };
  D.bat = (g, s) => {
    for (const k of [-1, 1]) P(g, s, '#6E4E7E', (h) => { h.moveTo(k * 10, -12); h.quadraticCurveTo(k * 36, -46, k * 60, -22); h.quadraticCurveTo(k * 50, -8, k * 55, 12); h.quadraticCurveTo(k * 42, 2, k * 36, 17); h.quadraticCurveTo(k * 26, 6, k * 12, 20); h.closePath(); });
    P(g, s, '#6E4E7E', (h) => { for (const k of [-1, 1]) { h.moveTo(k * 20, -22); h.lineTo(k * 15, -52); h.lineTo(k * 2, -30); h.closePath(); } }, { shadow: 0.2 });
    P(g, s, '#84629A', ell(0, 2, 25, 33));
    eyes(g, -9, 9, -8, 5.5); cheeks(g, -15, 15, 3, 5); smile(g, 0, 5, 6);
    F(g, '#fff', poly([[-6, 9], [-1, 9], [-3.5, 15]], 1, 2)); F(g, '#fff', poly([[1, 9], [6, 9], [3.5, 15]], 1, 3));
  };
  D.van = (g, s) => {
    P(g, s, '#2F8F8A', (h) => A.cut(h, [[-56, -40], [20, -40], [40, -14], [57, -8], [57, 26], [-56, 26]], [10, 8, 6, 8, 8, 8], 0.5, 3));
    F(g, '#CFE8EE', poly([[8, -32], [18, -32], [33, -10], [8, -10]], 3, 2));
    F(g, '#FBF6EC', box(-48, -32, 48, 42, 5, 4)); ln(g, 'rgba(46,42,59,.3)', 2.5, (h) => { h.moveTo(-24, -32); h.lineTo(-24, 10); });
    F(g, '#F7D27A', ell(52, 6, 4, 6));
    for (const x of [-30, 32]) { P(g, s, DARK, ell(x, 28, 16, 16), { shadow: 0.3 }); F(g, '#D8D2C8', ell(x, 28, 6.5, 6.5)); }
  };
  D.map = (g, s) => {
    P(g, s, '#F3E3C0', (h) => A.cut(h, [[-54, -30], [-18, -42], [18, -30], [54, -42], [54, 32], [18, 44], [-18, 32], [-54, 44]], 3, 0.5, 4));
    F(g, 'rgba(120,90,50,.13)', poly([[-18, -42], [18, -30], [18, 44], [-18, 32]], 1, 2));
    F(g, '#93C27A', (h) => A.blob(h, -34, -8, 12, 15, 0.2, 3, 7)); F(g, '#86BCD0', (h) => A.blob(h, 34, 18, 13, 10, 0.2, 4, 7));
    g.save(); g.setLineDash([5, 7]); ln(g, '#D9503F', 3, (h) => { h.moveTo(-40, 24); h.quadraticCurveTo(-10, -10, 4, 12); h.quadraticCurveTo(14, 24, 24, 0); }); g.restore();
    ln(g, '#D9503F', 4.5, (h) => { h.moveTo(22, -24); h.lineTo(36, -10); h.moveTo(36, -24); h.lineTo(22, -10); });
  };
  D.pin = (g, s) => {
    g.save(); g.rotate(0.6); g.translate(0, -6);
    ln(g, '#9AA0A8', 4, (h) => { h.moveTo(0, 20); h.lineTo(0, 60); });
    P(g, s, '#D9503F', (h) => A.cut(h, [[-22, -48], [22, -48], [22, -38], [10, -32], [12, -2], [26, 10], [26, 20], [-26, 20], [-26, 10], [-12, -2], [-10, -32], [-22, -38]], 4, 0.4, 3));
    shine(g, -3, -17, 3, 12, 0);
    g.restore();
  };
  D.fish = (g, s) => {
    P(g, s, '#E8823A', poly([[24, 0], [58, -26], [50, 0], [58, 26]], 5, 2));
    P(g, s, '#E8823A', poly([[-10, -24], [10, -46], [18, -20]], 4, 3), { shadow: 0.2 });
    P(g, s, '#F2A03D', ell(-8, 0, 44, 30));
    ln(g, 'rgba(180,90,30,.5)', 2.5, (h) => { for (const [x, y] of [[2, -8], [2, 10], [16, 1]]) { h.moveTo(x + 7, y - 7); h.quadraticCurveTo(x - 3, y, x + 7, y + 7); } h.moveTo(-22, -24); h.quadraticCurveTo(-14, 0, -22, 24); });
    eyes(g, -35, -35, -6, 6); cheeks(g, -33, -33, 9, 5);
    ln(g, '#86BCD0', 2.5, (h) => { h.moveTo(-50, -30); h.arc(-54, -30, 4, 0, 6.2832); h.moveTo(-40, -46); h.arc(-46, -46, 6, 0, 6.2832); });
  };
  D.ring = (g, s) => {
    P(g, s, '#E9B23C', (h) => { h.moveTo(38, 16); h.arc(0, 16, 38, 0, 6.2832); h.moveTo(27, 16); h.arc(0, 16, 27, 0, 6.2832, true); });
    P(g, s, '#5BB7D9', poly([[-19, -34], [-10, -50], [10, -50], [19, -34], [0, -14]], 2, 3)); F(g, '#B0E2F2', poly([[-10, -50], [10, -50], [5, -37], [-5, -37]], 1, 2));
    shine(g, -27, 2, 4, 10);
  };
  D.king = (g, s) => {
    P(g, s, '#C9553F', (h) => { h.moveTo(-50, 58); h.quadraticCurveTo(-48, 14, 0, 14); h.quadraticCurveTo(48, 14, 50, 58); h.closePath(); });
    P(g, s, '#FBF6EC', box(-30, 14, 60, 16, 8, 2), { shadow: 0.2 }); for (const x of [-18, 0, 18]) F(g, INK, ell(x, 22, 2.5, 2.5));
    P(g, s, '#F2C9A0', ell(0, -8, 30, 28));
    P(g, s, '#E9B23C', (h) => A.cut(h, [[-32, -24], [-37, -58], [-17, -41], [0, -62], [17, -41], [37, -58], [32, -24]], 3, 0.4, 3));
    F(g, '#D9503F', ell(0, -34, 5, 5)); F(g, '#5B8FC7', ell(-20, -32, 4, 4)); F(g, '#5B8FC7', ell(20, -32, 4, 4));
    eyes(g, -11, 11, -8, 5); cheeks(g, -19, 19, 1, 5.5); smile(g, 0, 3, 7);
  };
  D.boat = (g, s) => {
    ln(g, '#8A5A3C', 5, (h) => { h.moveTo(-2, -56); h.lineTo(-2, 16); });
    P(g, s, '#FBF6EC', poly([[5, -52], [46, 8], [5, 8]], 4, 2)); P(g, s, '#F2B33D', poly([[-9, -38], [-9, 8], [-42, 8]], 4, 3));
    P(g, s, '#C9553F', (h) => A.cut(h, [[-56, 14], [56, 14], [38, 42], [-38, 42]], [4, 4, 14, 14], 0.5, 4));
    ln(g, '#5B8FC7', 5, (h) => { h.moveTo(-58, 50); for (let i = 0; i < 4; i++) { const x = -58 + i * 29; h.quadraticCurveTo(x + 7, 42, x + 14.5, 50); h.quadraticCurveTo(x + 22, 58, x + 29, 50); } });
  };
  D.coat = (g, s) => {
    P(g, s, '#C24A3A', poly([[-26, -40], [-57, 18], [-38, 28], [-22, -6]], 6, 2)); P(g, s, '#C24A3A', poly([[26, -40], [57, 18], [38, 28], [22, -6]], 6, 3));
    P(g, s, '#D9503F', (h) => A.cut(h, [[-28, -46], [28, -46], [36, 54], [-36, 54]], [12, 12, 6, 6], 0.5, 4));
    P(g, s, '#F3E3C8', poly([[-20, -50], [0, -22], [-8, -8], [-30, -34]], 3, 5), { shadow: 0.25 }); P(g, s, '#F3E3C8', poly([[20, -50], [0, -22], [8, -8], [30, -34]], 3, 6), { shadow: 0.25 });
    ln(g, 'rgba(120,30,24,.5)', 2.5, (h) => { h.moveTo(0, -20); h.lineTo(0, 54); h.moveTo(-28, 24); h.lineTo(-12, 24); h.moveTo(12, 24); h.lineTo(28, 24); });
    for (const y of [-4, 14, 32]) F(g, '#F2B33D', ell(8, y, 4, 4));
  };
  D.cake = (g, s) => {
    P(g, s, '#FBF6EC', ell(0, 44, 56, 10));
    for (const [x, c] of [[-22, '#5B8FC7'], [0, '#F2B33D'], [22, '#6FA65F']]) { F(g, c, box(x - 3, -46, 6, 24, 2, 4)); F(g, '#F2913D', ell(x, -52, 4, 6.5)); }
    P(g, s, '#E7B77A', box(-42, -8, 84, 50, 8, 2));
    F(g, '#D9534F', box(-42, 14, 84, 8, 1, 3));
    P(g, s, '#F4A7B9', (h) => { h.moveTo(-44, -14); h.quadraticCurveTo(-44, -26, -30, -26); h.lineTo(30, -26); h.quadraticCurveTo(44, -26, 44, -14); h.lineTo(44, -2); h.quadraticCurveTo(36, 12, 28, -2); h.quadraticCurveTo(20, 8, 10, -2); h.quadraticCurveTo(0, 14, -10, -2); h.quadraticCurveTo(-20, 6, -28, -2); h.quadraticCurveTo(-36, 12, -44, -2); h.closePath(); }, { shadow: 0.3 });
  };
  D.snake = (g, s) => {
    const body = (h) => { h.moveTo(-18, -34); h.bezierCurveTo(36, -46, 46, -6, 4, 0); h.bezierCurveTo(-44, 6, -40, 46, 12, 42); h.quadraticCurveTo(36, 40, 52, 28); };
    rope(g, s, '#5E9E57', 21, body);
    g.save(); g.setLineDash([1, 18]); ln(g, '#F2CF4A', 8, body); g.restore();
    ln(g, '#D9503F', 3, (h) => { h.moveTo(-46, -32); h.lineTo(-56, -30); h.lineTo(-61, -36); h.moveTo(-56, -30); h.lineTo(-61, -25); });
    P(g, s, '#5E9E57', ell(-28, -35, 21, 16, -0.15));
    eyes(g, -36, -22, -40, 4.5); cheeks(g, -40, -16, -30, 4); smile(g, -29, -30, 5);
  };
  D.bell = (g, s) => {
    ln(g, '#C98A2A', 6, (h) => h.arc(0, -46, 8, 0, 6.2832));
    P(g, s, '#8A5A3C', ell(0, 44, 9, 9), { shadow: 0.3 });
    P(g, s, '#F2B33D', (h) => { h.moveTo(-10, -40); h.quadraticCurveTo(-34, -34, -34, 4); h.quadraticCurveTo(-34, 24, -50, 34); h.lineTo(50, 34); h.quadraticCurveTo(34, 24, 34, 4); h.quadraticCurveTo(34, -34, 10, -40); h.closePath(); });
    F(g, '#D9952A', box(-50, 28, 100, 10, 5, 3)); shine(g, -18, -10, 6, 18, 0.2);
  };
  D.shell = (g, s) => {
    const pt = (i, r) => [Math.cos(Math.PI + i * Math.PI / 6) * r, 8 + Math.sin(Math.PI + i * Math.PI / 6) * r];
    P(g, s, '#E9A08A', poly([[-20, 34], [20, 34], [15, 54], [-15, 54]], 4, 2));
    P(g, s, '#F4B49A', (h) => { h.moveTo(-12, 44); h.lineTo(...pt(0, 54)); for (let i = 0; i < 6; i++) { const c = pt(i + 0.5, 68), p = pt(i + 1, 54); h.quadraticCurveTo(c[0], c[1], p[0], p[1]); } h.lineTo(12, 44); h.closePath(); });
    ln(g, 'rgba(190,100,80,.55)', 2.5, (h) => { for (let i = 1; i < 6; i++) { const p = pt(i, 50); h.moveTo(0, 40); h.lineTo(p[0], p[1]); } });
  };
  D.spoon = (g, s) => { g.save(); g.rotate(0.6); P(g, s, '#AEB6C2', (h) => { h.ellipse(0, -32, 21, 27, 0, 0, 6.2832); A.rect(h, -5, -10, 10, 70, 5, 2, 0.3); }); F(g, '#8F98A6', ell(0, -32, 14, 20)); shine(g, -6, -38, 3, 9, 0); g.restore(); };
  D.clock = (g, s) => {
    P(g, s, '#2F8F8A', ell(0, 0, 54, 54)); P(g, s, '#FBF6EC', ell(0, 0, 43, 43), { shadow: 0.2 });
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r = i % 3 ? 2 : 3.6; F(g, INK, ell(Math.cos(a) * 34, Math.sin(a) * 34, r, r)); }
    ln(g, INK, 5, (h) => { h.moveTo(0, 0); h.lineTo(0, -26); h.moveTo(0, 0); h.lineTo(16, 10); }); F(g, '#E8664A', ell(0, 0, 5, 5));
  };
  D.thumb = (g, s) => {
    P(g, s, '#5B8FC7', box(-46, 8, 24, 46, 5, 2));
    P(g, s, '#F6D7B8', (h) => { A.rect(h, -8, -54, 27, 62, 13, 3, 0.3); A.rect(h, -24, -6, 72, 60, 16, 4, 0.3); });
    ln(g, 'rgba(120,70,50,.45)', 2.5, (h) => { for (const y of [10, 24, 38]) { h.moveTo(16, y); h.lineTo(46, y); } h.moveTo(-6, -2); h.quadraticCurveTo(8, 6, 19, -2); });
  };
  D.ship = (g, s) => {
    for (const x of [-12, 12]) { P(g, s, '#D9503F', box(x - 8, -48, 16, 28, 3, 2)); F(g, INK, box(x - 8, -48, 16, 7, 2, 3)); }
    P(g, s, '#FBF6EC', box(-34, -24, 68, 28, 5, 4)); for (const x of [-20, 0, 20]) F(g, '#86BCD0', ell(x, -10, 5, 5));
    P(g, s, '#34507E', (h) => A.cut(h, [[-58, 0], [58, 0], [44, 36], [-46, 36]], [3, 3, 12, 10], 0.5, 5));
    F(g, '#D9503F', poly([[-51, 22], [50, 22], [44, 36], [-46, 36]], 3, 2));
    ln(g, '#5B8FC7', 5, (h) => { h.moveTo(-58, 46); for (let i = 0; i < 4; i++) { const x = -58 + i * 29; h.quadraticCurveTo(x + 7, 38, x + 14.5, 46); h.quadraticCurveTo(x + 22, 54, x + 29, 46); } });
  };
  D.chair = (g, s) => {
    P(g, s, '#8A5A3C', (h) => { A.rect(h, -32, -56, 10, 64, 4, 2, 0.4); A.rect(h, 22, -56, 10, 64, 4, 3, 0.4); A.rect(h, -32, -54, 64, 14, 5, 4, 0.4); A.rect(h, -32, -32, 64, 9, 4, 5, 0.4); A.rect(h, -32, -14, 64, 9, 4, 6, 0.4); });
    P(g, s, '#A06A42', (h) => { A.rect(h, -38, 16, 10, 40, 4, 7, 0.4); A.rect(h, 28, 16, 10, 40, 4, 8, 0.4); });
    P(g, s, '#D9503F', box(-42, 2, 84, 18, 8, 9));
  };
  D.snail = (g, s) => {
    ln(g, '#C9A070', 4, (h) => { h.moveTo(-42, -6); h.lineTo(-50, -30); h.moveTo(-30, -8); h.lineTo(-28, -34); });
    P(g, s, '#E2C08A', (h) => { h.moveTo(-54, 20); h.quadraticCurveTo(-58, -12, -36, -12); h.quadraticCurveTo(-18, -12, -20, 16); h.lineTo(44, 24); h.quadraticCurveTo(60, 30, 54, 42); h.lineTo(-40, 42); h.quadraticCurveTo(-54, 40, -54, 20); });
    P(g, s, '#C9785A', ell(14, -4, 36, 34));
    ln(g, '#8A4A34', 4, (h) => { h.moveTo(14, -4); for (let a = 0.3; a < 11; a += 0.3) h.lineTo(14 + Math.cos(a) * a * 2.6, -4 + Math.sin(a) * a * 2.6); });
    eyes(g, -50, -28, -33, 5); cheeks(g, -46, -30, 12, 4.5); smile(g, -38, 10, 5);
  };
  D.ten = num('10', '#2F8F8A'); D.six = num('6', '#6E4E7E'); D.three = num('3', '#E8664A');

  /** Draw a word's picture centred on (0,0), fitted into a square `size` units across. */
  function drawPic(g, nm, size) {
    if (D[nm]) { const sp = A.sprite('pc-' + nm, [-64, -64, 128, 128], D[nm]), k = size / 124; g.drawImage(sp.canvas, -sp.ox * k, -sp.oy * k, sp.w * k, sp.h * k); return; }
    const im = PIM[nm];
    if (im) { const q = Math.min(size / im.width, size / im.height); g.drawImage(im, -im.width * q / 2, -im.height * q / 2, im.width * q, im.height * q); return; }
    loadPic(nm);            // still on its way: a pale paper disc holds the place
    g.beginPath(); g.arc(0, 0, size * 0.38, 0, 7); g.fillStyle = 'rgba(251,246,236,.85)'; g.fill();
  }

  /* ---------------- letter monsters ----------------
     img/letters holds one friendly monster per letter, mouth shut and mouth open, with a blank tummy patch
     where the letter is written. For each: tummy [x, y, radius] and open mouth [x, y], as fractions of the picture. */
  const MON = { a: [0.494, 0.662, 0.279, 0.5, 0.385], b: [0.491, 0.644, 0.251, 0.503, 0.365], c: [0.493, 0.688, 0.269, 0.507, 0.421], d: [0.489, 0.684, 0.276, 0.511, 0.424], e: [0.49, 0.671, 0.277, 0.497, 0.4],
    f: [0.49, 0.684, 0.268, 0.511, 0.412], g: [0.494, 0.685, 0.264, 0.51, 0.44], h: [0.488, 0.63, 0.255, 0.501, 0.311], i: [0.494, 0.684, 0.272, 0.496, 0.38], j: [0.492, 0.716, 0.26, 0.494, 0.488],
    k: [0.494, 0.677, 0.257, 0.507, 0.445], l: [0.492, 0.667, 0.271, 0.503, 0.38], m: [0.493, 0.638, 0.273, 0.513, 0.347], n: [0.489, 0.691, 0.262, 0.497, 0.42], o: [0.49, 0.659, 0.262, 0.514, 0.377],
    p: [0.495, 0.671, 0.253, 0.519, 0.384], q: [0.489, 0.685, 0.271, 0.504, 0.405], r: [0.491, 0.669, 0.253, 0.468, 0.405], s: [0.494, 0.709, 0.26, 0.494, 0.466], t: [0.49, 0.681, 0.262, 0.494, 0.412],
    u: [0.489, 0.679, 0.261, 0.504, 0.385], v: [0.495, 0.677, 0.269, 0.511, 0.396], w: [0.494, 0.655, 0.277, 0.495, 0.35], x: [0.491, 0.66, 0.272, 0.495, 0.372], y: [0.489, 0.684, 0.275, 0.497, 0.404], z: [0.49, 0.667, 0.26, 0.497, 0.388] };
  const MIM = {}, FALL = ['#E8664A', '#5B8FC7', '#2F8F8A', '#6FA65F', '#F2B33D', '#6E4E7E'];
  function loadMon(ch) { for (const v of ['', '-open']) { const k = ch + v; if (MIM[k] !== undefined) continue; MIM[k] = null; const im = new Image(); im.onload = () => { MIM[k] = im; }; im.src = 'img/letters/' + k + '.webp'; } }
  const monW = (ch, F) => { const im = MIM[ch + '-open'] || MIM[ch]; return im ? F * im.width / im.height : F * 0.84; };
  /** A letter monster standing on (0,0), F units tall, with `text` on its tummy, or on a sign it holds. */
  function drawMon(g, s, ch, F, open, text, sign) {
    const im = MIM[ch + (open ? '-open' : '')] || MIM[ch], m = MON[ch], w = monW(ch, F);
    const tx = (m[0] - 0.5) * w, ty = -F + m[1] * F, tr = m[2] * w;
    if (im) g.drawImage(im, -F * im.width / im.height / 2, -F, F * im.width / im.height, F);
    else {                                                 // a paper stand-in until the picture arrives
      g.beginPath(); g.ellipse(0, -F * 0.46, F * 0.37, F * 0.45, 0, 0, 7); A.paper(g, s, FALL[ch.charCodeAt(0) % FALL.length], { box: { x: -F * 0.4, y: -F, w: F * 0.8, h: F } });
      F2(g, '#F8E3C0', tx, ty, tr); F2(g, '#3A2A2A', -F * 0.1, -F * 0.68, F * 0.035); F2(g, '#3A2A2A', F * 0.1, -F * 0.68, F * 0.035);
      F2(g, '#5A2440', (m[3] - 0.5) * w, -F + m[4] * F, F * (open ? 0.04 : 0.018));
    }
    let size = tr * 1.5;
    if (sign) {
      const cw = Math.max(tr * 2.3, F * 0.5), ch2 = tr * 1.5;
      g.beginPath(); A.rect(g, tx - F * 0.016, ty, F * 0.032, -ty - 2, 3, 2, 0.4); A.paper(g, s, '#8A5A3C', { shadow: 0.5 });
      g.beginPath(); A.rect(g, tx - cw / 2, ty - ch2 / 2, cw, ch2, F * 0.045, 3, 0.8); A.paper(g, s, '#FBF6EC', { shadow: 0.9, box: { x: tx - cw / 2, y: ty - ch2 / 2, w: cw, h: ch2 }, light: 0.04 });
      g.beginPath(); A.rect(g, tx - cw / 2 + 7, ty - ch2 / 2 + 7, cw - 14, ch2 - 14, F * 0.03, 4, 0.5); g.strokeStyle = '#E8664A'; g.lineWidth = 3; g.stroke();
      size = ch2 * 0.72;
    }
    g.font = `700 ${size}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = INK;
    g.fillText(text, tx, ty + size * 0.27);
  }
  const F2 = (g, col, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.fill(); };

  /* ---------------- words ----------------
     word: [first sound, last sound, middle vowel (three-letter words), opening pair]. A slot is left empty
     where the word would muddle that kind of round (a blend, a silent letter, a sound that depends on accent). */
  const WORDS = {
    moon: ['m', 'n'], mouse: ['m'], map: ['m', 'p', 'a'], mug: ['m', 'g', 'u'], sock: ['s', 'k'], sun: ['s', 'n', 'u'], six: ['s', 'x', 'i'],
    ball: ['b', 'l'], banana: ['b'], book: ['b', 'k'], bus: ['b', '', 'u'], bee: ['b'], bed: ['b', '', 'e'], box: ['b', 'x', 'o'], bat: ['b', 't', 'a'], bell: ['b', 'l'], bug: ['b', 'g', 'u'], boat: ['b', 't'],
    tomato: ['t'], turtle: ['t'], ten: ['t', 'n', 'e'], pig: ['p', 'g', 'i'], pear: ['p'], panda: ['p'], pan: ['p', 'n', 'a'], pen: ['p', 'n', 'e'], pin: ['p', 'n', 'i'],
    fox: ['f', 'x', 'o'], fish: ['f'], fan: ['f', 'n', 'a'], cat: ['c', 't', 'a'], cow: ['c'], carrot: ['c', 't'], cookie: ['c'], can: ['c', 'n', 'a'], cup: ['c', 'p', 'u'], car: ['c'], cake: ['c'], coat: ['c', 't'],
    key: ['k'], kite: ['k'], king: ['k'], dog: ['d', 'g', 'o'], donut: ['d', 't'], hat: ['h', 't', 'a'], house: ['h'], hen: ['h', 'n', 'e'],
    rocket: ['r', 't'], ring: ['r'], rug: ['r', 'g', 'u'], lemon: ['l', 'n'], log: ['l', 'g', 'o'], lion: ['l', 'n'],
    shoe: ['', '', '', 'sh'], shell: ['', 'l', '', 'sh'], ship: ['', 'p', '', 'sh'], cheese: ['', '', '', 'ch'], chick: ['', 'k', '', 'ch'], chair: ['', '', '', 'ch'], three: ['', '', '', 'th'], thumb: ['', '', '', 'th'],
    star: ['', '', '', 'st'], strawberry: ['', '', '', 'st'], snake: ['', '', '', 'sn'], snowman: ['', 'n', '', 'sn'], snail: ['', 'l', '', 'sn'], frog: ['', 'g', '', 'fr'], flag: ['', 'g', '', 'fl'], tree: ['', '', '', 'tr'],
    owl: ['', 'l'], clock: ['', 'k'], spoon: ['', 'n'],
  };
  const NUMERAL = { ten: 1, six: 1, three: 1 };
  /** Written words to sort by their first two letters. They are read, not spoken. */
  const READ = { sh: ['ship', 'shop', 'shed', 'shell', 'shut', 'shin'], ch: ['chip', 'chin', 'chop', 'chat', 'chick', 'check'], th: ['thin', 'that', 'then', 'this', 'them', 'thick'],
    st: ['stop', 'step', 'star', 'stem', 'stick', 'still'], fr: ['frog', 'from', 'free', 'fresh', 'fry'], sn: ['snap', 'snip', 'snow', 'snug', 'snack'], fl: ['flag', 'flip', 'flat', 'fly'], tr: ['tree', 'trip', 'trap', 'try'] };
  const IDX = { first: 0, last: 1, mid: 2, blend: 3 };
  const KEYS = { first: 'msbtpfcdhkrl'.split(''), last: 'gtnpkxl'.split(''), mid: 'aeiou'.split(''), blend: ['sh', 'ch', 'th', 'st', 'sn', 'fr', 'fl', 'tr'], sort: Object.keys(READ) };
  const EASY = 'msbtpfcdh';                                   // level 1: sounds that are far apart
  const SAME = { c: 'k', x: 's' };                            // letters that make (or end in) the same sound never meet in a round
  const snd = (k) => SAME[k] || k;
  const keyOf = (mode, w) => (mode === 'sort' ? w.slice(0, 2) : WORDS[w][IDX[mode]] || '');
  const pool = (mode) => (mode === 'sort' ? [].concat(...Object.values(READ)) : Object.keys(WORDS).filter((w) => keyOf(mode, w)));
  /** Which letters of a word carry the sound the round is about. */
  const marks = (mode, w) => (mode === 'last' ? [w.length - 1] : mode === 'mid' ? [1] : mode === 'first' ? [0] : [0, 1]);

  const T = {
    q: { first: 'What starts with this sound?', blend: 'What starts with this sound?', last: 'What ends with this sound?', mid: 'What has this sound in the middle?' },
    s: { first: 'Listen for the first sound.', blend: 'Listen for the first sound.', last: 'Listen for the last sound.', mid: 'Listen for the middle sound.', sort: 'Read the words. Who gets each one?' },
    not: 'Not my sound.', who: 'Now tap a monster.',
  };
  function lines() {
    const out = [].concat(Object.values(T.q), Object.values(T.s), [T.not, T.who]);
    for (const m in KEYS) for (const k of KEYS[m]) out.push(k + '.');
    for (const w in WORDS) out.push(w + '.');
    return out.filter((t, i) => out.indexOf(t) === i);
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, ROUNDS = 4;
    const ground = H - (land ? 96 : 150), PS = land ? 134 : 124;
    let R = null, won = 0, skill = 0, turns = 0, sel = null, held = null, forced = null, starPop = 0;
    const mons = [], items = [], recent = [];
    Object.keys(SRC).forEach(loadPic);
    const speak = (text, min, max, fn) => Promise.race([Promise.all([(fn || ctx.say)(text), ctx.wait(min)]), ctx.wait(max)]);
    const chomp = () => { for (let i = 0; i < 3; i++) { K.sfx.tone(200, 0.09, { type: 'square', vol: 0.09, to: 120, delay: i * 0.2 }); K.sfx.noise(0.06, { freq: 900, vol: 0.18, delay: i * 0.2 }); } };

    /* ---------- the meadow and the picnic rug ---------- */
    st.add({ z: 0, sprite: A.sprite('snd-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#CDE6E9', { shadow: 0, grain: 0.3, light: 0 });
      const warm = g.createLinearGradient(0, ground - 420, 0, ground - 40); warm.addColorStop(0, 'rgba(247,226,190,0)'); warm.addColorStop(1, 'rgba(247,226,190,.9)'); g.fillStyle = warm; g.fillRect(0, 0, W, H);
      const rnd = A.rng(11);
      for (let i = 0; i < (land ? 4 : 3); i++) { const x = (i + 0.3 + rnd() * 0.4) * W / (land ? 4 : 3), y = 190 + rnd() * 150 + (land ? 250 : 420), r = 34 + rnd() * 22; g.beginPath(); A.blob(g, x, y, r * 1.9, r * 0.62, 0.12, i + 3, 9); A.paper(g, s, '#F1F6F2', { shadow: 0.2, light: 0.02, grain: 0.1 }); }
      const hill = (x, y, rx, ry, col, seed) => { g.beginPath(); A.blob(g, x, y, rx, ry, 0.05, seed, 12); A.paper(g, s, col, { shadow: 0.5, box: { x: x - rx, y: y - ry, w: rx * 2, h: ry }, light: 0.05 }); };
      hill(W * 0.2, ground + 60, W * 0.42, 250, A.C.far, 4); hill(W * 0.82, ground + 70, W * 0.4, 300, A.C.far2, 6); hill(W * 0.5, ground + 90, W * 0.5, 210, A.C.mid, 8);
      g.beginPath(); g.moveTo(-20, ground - 46); g.quadraticCurveTo(W * 0.3, ground - 86, W * 0.6, ground - 54); g.quadraticCurveTo(W * 0.85, ground - 36, W + 20, ground - 66); g.lineTo(W + 20, H + 20); g.lineTo(-20, H + 20); g.closePath();
      A.paper(g, s, A.C.meadow, { shadow: 0.6, box: { x: 0, y: ground - 90, w: W, h: H - ground + 90 }, light: 0.06, grain: 0.3 });
      for (let i = 0; i < 26; i++) { const x = rnd() * W, y = ground - 30 + rnd() * (H - ground + 10); A.line(g, 'rgba(60,110,70,.4)', 3, (h) => { h.moveTo(x - 7, y); h.lineTo(x - 3, y - 12); h.moveTo(x, y); h.lineTo(x, y - 15); h.moveTo(x + 7, y); h.lineTo(x + 4, y - 11); }); }
      // the rug the monsters sit on
      const rw = Math.min(W - 60, land ? 980 : 520), x0 = W / 2 - rw / 2, y0 = ground - 26, rh = land ? 92 : 104, cut = (h) => A.cut(h, [[x0 + 34, y0], [x0 + rw - 34, y0], [x0 + rw, y0 + rh], [x0, y0 + rh]], 10, 1.5, 5);
      g.beginPath(); cut(g); A.paper(g, s, '#FBF6EC', { shadow: 0.8, grain: 0.25 });
      g.save(); g.beginPath(); cut(g); g.clip(); g.fillStyle = 'rgba(232,102,74,.55)';
      for (let i = -2; i < rw / 46 + 2; i += 2) { g.beginPath(); g.moveTo(x0 + i * 46 + 30, y0); g.lineTo(x0 + i * 46 + 76, y0); g.lineTo(x0 + i * 46 + 50 + (i * 46 - rw / 2) * 0.08, y0 + rh); g.lineTo(x0 + i * 46 + (i * 46 - rw / 2) * 0.08, y0 + rh); g.fill(); }
      g.fillRect(x0, y0 + rh * 0.3, rw, rh * 0.22); g.fillRect(x0, y0 + rh * 0.76, rw, rh * 0.3);
      g.restore();
      for (let i = 0; i < 9; i++) { const x = rnd() * W, y = ground - 20 + rnd() * (H - ground - 10); if (Math.abs(x - W / 2) < rw / 2 + 20) continue; for (let p = 0; p < 5; p++) F2(g, i % 2 ? '#FBF6EC' : '#F7D27A', x + Math.cos(p * 1.257) * 7, y + Math.sin(p * 1.257) * 7, 5); F2(g, '#E8664A', x, y, 4); }
    }) });

    /* ---------- stars for the rounds won ---------- */
    const stars = st.add({ ui: true, z: 50, x: W / 2, y: land ? 150 : 176 });
    stars.draw = (g) => {
      for (let i = 0; i < ROUNDS; i++) {
        const on = i < won, k = on && i === won - 1 ? 1 + starPop * 0.6 : 1;
        g.save(); g.translate((i - (ROUNDS - 1) / 2) * 50, 0); g.scale(k, k); g.rotate(on ? Math.sin(st.t * 2 + i) * 0.08 : 0);
        g.beginPath(); for (let p = 0; p < 10; p++) { const a = p * 0.6283 - 1.5708, r = p % 2 ? 8.5 : 19; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
        g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = on ? '#F2B33D' : 'rgba(46,42,59,.16)'; g.stroke(); g.fillStyle = on ? '#F7D27A' : 'rgba(251,246,236,.75)'; g.fill();
        g.restore();
      }
    };
    stars.update = (dt) => { starPop = Math.max(0, starPop - dt * 2.2); };

    /* ---------- monsters ---------- */
    const mouthOf = (m) => { const t = MON[m.ch], w = monW(m.ch, m.F); return { x: m.x + (t[3] - 0.5) * w, y: m.y - m.F + t[4] * m.F }; };
    function addMon(key, i, n) {
      const ch = mons.some((q) => q.ch === key[0]) && key[1] ? key[1] : key[0], F = land ? [470, 410, 350][n - 1] : [430, 300, 300][n - 1];
      const x = land ? W / 2 + (i - (n - 1) / 2) * (n === 2 ? 520 : 380) : W / 2 + (i - (n - 1) / 2) * 280;
      const m = { i, key, ch, F, x, y: ground, chew: 0, hop: 0, shake: 0, near: false, glow: 0, sign: key.length > 1 };
      loadMon(ch);
      const node = st.add({ z: 10 + i, x, y: ground, sx: 0, sy: 0, label: 'monster ' + key, pressable: false, pad: 0, hit: { x: -F * 0.34, y: -F * 0.92, w: F * 0.68, h: F * 0.92 } });
      node._bsx = node._bsy = 1;
      node.draw = (g, s) => {
        const q = m.hop > 0 ? Math.sin(m.hop * 18) * 0.05 : Math.sin(st.t * 2 + i * 1.7) * 0.012;
        const open = m.chew > 0 ? Math.floor(m.chew * 9) % 2 === 0 : m.near;
        g.beginPath(); g.ellipse(0, 4, F * 0.3, F * 0.035, 0, 0, 7); g.fillStyle = 'rgba(40,34,60,.16)'; g.fill();
        const lit = R && R.hint && !R.over && ((held && held.owner === i) || (sel && sel.owner === i));
        m.glow += ((lit ? 1 : 0) - m.glow) * 0.15;
        if (m.glow > 0.02) { const gr = g.createRadialGradient(0, -F * 0.48, F * 0.2, 0, -F * 0.48, F * 0.72); gr.addColorStop(0, `rgba(247,210,122,${0.95 * m.glow})`); gr.addColorStop(1, 'rgba(247,210,122,0)'); g.fillStyle = gr; g.fillRect(-F * 0.8, -F * 1.25, F * 1.6, F * 1.5); }
        g.save(); g.translate(0, -Math.abs(Math.sin(m.hop * 9)) * 26); g.rotate(m.shake > 0 ? Math.sin(m.shake * 26) * 0.07 : 0); g.scale(1 - q * 0.8, 1 + q);
        drawMon(g, s, ch, F, open, key, m.sign);
        g.restore();
      };
      node.update = (dt) => { m.chew = Math.max(0, m.chew - dt); m.hop = Math.max(0, m.hop - dt); m.shake = Math.max(0, m.shake - dt); };
      node.onTap = () => tapMon(m);
      node.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back', delay: 0.05 + i * 0.12 });
      m.node = node; mons.push(m);
      return m;
    }
    function tapMon(m) {
      if (!R || R.over) return;
      R.acted = true;
      if (sel && !sel.busy) { feed(sel, m, 0.42); return; }
      m.hop = 0.35; K.sfx.pop(); ctx.say(m.key + '.');
    }

    /* ---------- the things to feed them ---------- */
    function slots(n) {
      const out = [];
      if (land) { const gap = Math.min(204, (W - 190) / n); for (let i = 0; i < n; i++) { const u = n > 1 ? (i / (n - 1)) * 2 - 1 : 0; out.push({ x: W / 2 + (i - (n - 1) / 2) * gap, y: 316 - 50 * (1 - u * u) }); } return out; }
      const cols = n <= 3 ? n : n === 4 ? 2 : 3, rows = Math.ceil(n / cols), gap = cols === 2 ? 214 : 180;
      for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols; out.push({ x: W / 2 + ((i % cols) - (inRow - 1) / 2) * gap, y: 312 + r * 206 + ((i % cols) % 2 ? 18 : 0) }); }
      return out;
    }
    const letters = (g, w, x, y, size, on, gap) => {                 // a word, some of its letters picked out in colour
      g.font = `700 ${size}px ${A.FONT_BODY}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      const ws = w.split('').map((c) => g.measureText(c).width + size * 0.05), tot = ws.reduce((a, b) => a + b, 0); let cx = x - tot / 2;
      w.split('').forEach((c, i) => {
        if (gap === i) { g.fillStyle = '#E8664A'; g.fillRect(cx + 2, y + size * 0.08, ws[i] - 4, size * 0.09); }
        else { g.fillStyle = on.indexOf(i) >= 0 ? '#E8664A' : INK; g.fillText(c, cx + size * 0.025, y); }
        cx += ws[i];
      });
    };
    function addItem(it, slot, i) {
      const kind = R.mode === 'sort' ? 'text' : R.mode === 'mid' ? 'gap' : 'pic', w = it.word;
      const node = st.add({ z: 30, x: slot.x, y: slot.y, sx: 0, sy: 0, label: w, pressable: false, pad: 4,
        hit: kind === 'text' ? { x: -86, y: -50, w: 172, h: 100 } : kind === 'gap' ? { x: -70, y: -74, w: 140, h: 176 } : { x: -PS / 2, y: -PS / 2, w: PS, h: PS } });
      node._bsx = node._bsy = 1;
      Object.assign(it, { node, kind, home: slot, ph: i * 1.9, busy: true, held: false, round: R, hop: 0 });
      const word = (on) => A.sprite('snd-w-' + w + on.length, [-84, -48, 168, 96], (g, s) => { g.beginPath(); A.rect(g, -82, -46, 164, 92, 22, w.length, 1); A.paper(g, s, '#FBF6EC', { shadow: 0.9, box: { x: -82, y: -46, w: 164, h: 92 }, light: 0.04 }); letters(g, w, 0, 17, w.length > 4 ? 50 : 56, on); });
      const card = kind === 'text' ? word([])
        : kind === 'gap' ? A.sprite('snd-g-' + w, [-62, 52, 124, 50], (g, s) => { g.beginPath(); A.rect(g, -58, 54, 116, 46, 16, w.length + 2, 0.8); A.paper(g, s, '#FBF6EC', { shadow: 0.8 }); letters(g, w, 0, 90, 38, [], 1); }) : null;
      node.draw = (g) => {
        const on = sel === it, k = (it.pulse && !it.held ? 1 + Math.sin(st.t * 7) * 0.08 : 1), hy = -Math.abs(Math.sin(it.hop * 10)) * 22;
        if (on || (it.pulse && !it.held)) { const gr = g.createRadialGradient(0, 0, PS * 0.2, 0, 0, PS * 0.82); gr.addColorStop(0, 'rgba(247,210,122,.95)'); gr.addColorStop(1, 'rgba(247,210,122,0)'); g.fillStyle = gr; g.fillRect(-PS, -PS, PS * 2, PS * 2); }
        g.save(); g.translate(0, hy); g.scale(k, k);
        if (kind === 'text') { const c = R && R.hint ? word([0, 1]) : card; g.drawImage(c.canvas, -c.ox, -c.oy, c.w, c.h); }
        else { g.save(); if (kind === 'gap') { g.translate(0, -16); drawPic(g, w, PS * 0.86); } else drawPic(g, w, PS); g.restore(); if (card) g.drawImage(card.canvas, -card.ox, -card.oy, card.w, card.h); }
        g.restore();
      };
      node.update = (dt) => {
        it.hop = Math.max(0, it.hop - dt);
        if (it.busy || it.held || node.tweens.length) return;
        node.y = slot.y + Math.sin(st.t * 1.5 + it.ph) * 7 - (sel === it ? 16 : 0); node.rot = Math.sin(st.t * 1.1 + it.ph) * 0.045;
      };
      node.onDown = (p) => {
        if (it.busy || !R || R.over) return;
        if (sel && sel !== it) sel = null;
        held = it; it.held = true; it.dx = node.x - p.x; it.dy = node.y - p.y; node.z = 40; st.root._sorted = false; R.acted = true;
        K.sfx.tap(); node.to({ sx: 1.12, sy: 1.12 }, { dur: 0.1, ease: 'out' });
      };
      node.onMove = (p) => {
        if (!it.held) return;
        node.x = p.x + it.dx; node.y = p.y + it.dy; node.rot = 0;
        for (const m of mons) { const mo = mouthOf(m); m.near = Math.hypot(node.x - mo.x, node.y - mo.y) < m.F * 0.5; }
      };
      node.onUp = (p, e, s) => {
        if (!it.held) return;
        it.held = false; held = null; for (const m of mons) m.near = false;
        if (s.moved < 24) { node.to({ sx: 1, sy: 1 }, { dur: 0.2 }); tapItem(it); return; }
        let best = null, bd = 1e9;
        for (const m of mons) { const d = Math.hypot(node.x - m.x, node.y - (m.y - m.F * 0.52)); if (d < m.F * 0.6 && d < bd) { best = m; bd = d; } }
        if (best) feed(it, best, 0.16); else goHome(it);
      };
      node.onTap = (p) => { if (!p) tapItem(it); };              // keyboard and screen readers
      ctx.after(260 + i * 110, () => { if (it.round !== R) return; K.sfx.pop(); node.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back' }).then(() => { it.busy = false; }); });
      items.push(it);
    }
    function goHome(it) { it.busy = true; it.node.to({ x: it.home.x, y: it.home.y, sx: 1, sy: 1, rot: 0 }, { dur: 0.4, ease: 'back' }).then(() => { it.busy = false; it.node.z = 30; st.root._sorted = false; }); }
    function tapItem(it) {
      if (it.busy || !R || R.over) return;
      R.acted = true;
      if (mons.length === 1) { feed(it, mons[0], 0.42); return; }
      // with more than one monster a tap says the word and picks it up; then a monster is tapped
      sel = it; it.hop = 0.3;
      if (it.kind === 'text') K.sfx.pop(); else ctx.say(it.word + '.');
      if (!R.told) { R.told = true; ctx.after(1100, () => { if (sel === it && R && !R.over) { for (const m of mons) m.hop = 0.35; if (!toldOnce) { toldOnce = true; ctx.say(T.who); } } }); }
    }
    let toldOnce = false;
    function feed(it, m, dur) {
      if (it.busy) return;
      it.busy = true; if (sel === it) sel = null; m.near = true; it.node.z = 40; st.root._sorted = false;
      const mo = mouthOf(m); if (dur > 0.2) K.sfx.whoosh();
      it.node.to({ x: mo.x, y: mo.y, sx: 0.26, sy: 0.26, rot: 0 }, { dur, ease: 'inOut' }).then(() => arrive(it, m, mo));
    }
    function arrive(it, m, mo) {
      m.near = false;
      if (!R || it.round !== R || R.over) return;
      const text = it.kind === 'text';
      if (it.owner === m.i) {
        items.splice(items.indexOf(it), 1); it.node.remove();
        m.chew = 0.85; chomp(); K.sfx.step(R.fed++); ctx.fx.burst(mo.x, mo.y, { n: 9 });
        showWord(it.word, m);
        ctx.say(text ? m.key + '.' : R.mode === 'last' ? `${it.word}. ${m.key}.` : `${m.key}. ${it.word}.`);
        if (--R.left <= 0) finish();
        return;
      }
      R.misses++; m.shake = 0.6; K.sfx.whoops();
      it.node.to({ x: it.home.x, y: it.home.y, sx: 1, sy: 1 }, { dur: 0.5, ease: 'back' }).then(() => { it.busy = false; it.node.z = 30; st.root._sorted = false; });
      ctx.say(text ? `${T.not} ${m.key}.` : `${it.word}. ${T.not} ${m.key}.`);
      if (R.misses >= 2) {                                   // show the way: the right ones glow, and the monster that wants what is held lights up
        R.hint = true;
        if (mons.length === 1) for (const x of items) x.pulse = x.owner === 0;
      }
    }
    /** The word just eaten, written big above the monster, its sound picked out in colour. */
    function showWord(w, m) {
      const mode = R.mode, size = land ? 78 : 68;
      const n = st.add({ ui: true, z: 60, x: K.clamp(m.x, 150, W - 150), y: m.y - m.F * 0.95 - 34, sx: 0.2, sy: 0.2 });
      n.draw = (g, s) => {
        g.font = `700 ${size}px ${A.FONT_BODY}`; const tw = g.measureText(w).width + w.length * size * 0.05 + 60;
        g.beginPath(); A.rect(g, -tw / 2, -size * 0.72, tw, size * 1.3, size * 0.5, 4, 1); A.paper(g, s, '#FBF6EC', { shadow: 1, box: { x: -tw / 2, y: -size * 0.7, w: tw, h: size * 1.3 }, light: 0.04 });
        letters(g, w, 0, size * 0.24, size, marks(mode, w));
      };
      n.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back' }).then(() => n.to({ y: n.y - 26 }, { dur: 1.5, ease: 'out' })).then(() => n.to({ alpha: 0 }, { dur: 0.3 })).then(() => n.remove());
    }

    /* ---------- rounds ---------- */
    function plan() {
      const turn = turns++;
      if (forced) { const f = forced; forced = null; return f; }
      if (L === 1) return skill < 2 ? { mode: 'first', nm: 1, n: 3, r: 1 } : skill < 4 || turn % 2 ? { mode: 'first', nm: 1, n: 4, r: 2 } : { mode: 'first', nm: 2, n: 4 };
      if (L === 2) { if (turn % 3 === 2) return skill < 3 ? { mode: 'last', nm: 1, n: 4, r: 2 } : { mode: 'last', nm: 2, n: 5 }; return { mode: 'first', nm: 2, n: skill < 2 ? 5 : 6 }; }
      const mode = ['mid', 'blend', 'sort'][turn % 3];
      if (mode === 'mid') return skill < 2 ? { mode, nm: 1, n: 4, r: 2 } : { mode, nm: 2, n: skill < 4 ? 5 : 6 };
      if (mode === 'blend') return { mode, nm: 2, n: skill < 2 ? 4 : skill < 4 ? 5 : 6 };
      return { mode, nm: skill >= 3 && land ? 3 : 2, n: 6 };
    }
    function makeRound() {
      const p = plan(), mode = p.mode, keys = [];
      const ok = (w) => L > 1 || !NUMERAL[w], all = pool(mode).filter(ok);
      const from = K.shuffle(KEYS[mode].filter((k) => (L > 1 || mode !== 'first' || EASY.indexOf(k) >= 0)));
      for (const k of from) { if (keys.length >= p.nm) break; if (recent.indexOf(k) >= 0 && from.length - recent.length >= p.nm) continue; if (keys.some((q) => snd(q) === snd(k))) continue; if (all.some((w) => keyOf(mode, w) === k)) keys.push(k); }
      recent.push(...keys); while (recent.length > 3) recent.shift();
      const list = [], used = {};
      keys.forEach((k, i) => {
        const mine = all.filter((w) => keyOf(mode, w) === k && !used[w]), want = p.nm === 1 ? p.r : Math.ceil((p.n - list.length) / (p.nm - i));
        for (const w of K.sample(mine, want)) { list.push({ word: w, owner: i }); used[w] = 1; }
      });
      const rest = K.shuffle(all.filter((w) => !used[w] && !keys.some((k) => snd(k) === snd(keyOf(mode, w)))));   // these belong to nobody
      while (list.length < p.n && rest.length) list.push({ word: rest.pop(), owner: -1 });
      return { mode, keys, list: K.shuffle(list), left: list.filter((x) => x.owner >= 0).length, fed: 0, misses: 0, over: false, hint: false, acted: false };
    }
    function clear() {
      sel = held = null;
      for (const it of items.splice(0)) { const n = it.node; it.busy = true; n.to({ sx: 0, sy: 0, alpha: 0 }, { dur: 0.25, ease: 'inOut' }).then(() => n.remove()); }
      for (const m of mons.splice(0)) { const n = m.node; n.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' }).then(() => n.remove()); }
    }
    async function newRound() {
      clear();
      await ctx.wait(280);
      const r = (R = makeRound());
      r.keys.forEach((k, i) => addMon(k, i, r.keys.length));
      const sl = slots(r.list.length); r.list.forEach((it, i) => addItem(it, sl[i], i));
      K.sfx.whoosh();
      const one = r.keys.length === 1;
      await speak(one ? `${T.q[r.mode]} ${r.keys[0]}.` : `${T.s[r.mode]} ${r.keys.join('. ')}.`, 900, 6000, ctx.prompt);
      // with one monster a tap feeds it, so the pictures are named first
      if (one && r.mode !== 'sort') for (const it of r.list) { if (R !== r || r.acted || r.over) break; it.hop = 0.4; await speak(it.word + '.', 750, 2200); }
    }
    async function finish() {
      const r = R; r.over = true; sel = null;
      for (const it of items) { it.pulse = false; if (it.owner < 0) { it.busy = true; it.node.to({ alpha: 0, y: it.node.y - 50 }, { dur: 0.5, delay: 0.4 }); } }
      await ctx.wait(500);
      for (const m of mons) m.hop = 1.05; K.sfx.sparkle();
      for (const m of mons) ctx.fx.burst(m.x, m.y - m.F * 0.8, { n: 10 });
      await ctx.wait(1250);
      won++; starPop = 1; K.sfx.ding();
      skill = r.misses === 0 ? skill + 1 : r.misses >= 2 ? Math.max(0, skill - 1) : skill;
      await ctx.wait(650);
      if (won >= ROUNDS) { await ctx.celebrate({ ms: 3400 }); won = 0; }
      if (R === r) newRound();
    }

    K._sounds = { get R() { return R; }, mons, items, mouthOf, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; }, pics: { D, drawPic, SRC },
      /** Start a fresh round of a given kind: {mode, nm, n, r}. */
      go(p) { forced = p; if (R) R.over = true; return newRound(); } };
    ctx.onExit(() => { K._sounds = null; });
    ctx.after(350, newRound);
  }

  function icon(g, w) {
    const u = w / 300; g.save(); g.scale(u, u);
    g.fillStyle = '#CDE6E9'; g.fillRect(0, 0, 300, 300);
    g.fillStyle = '#A9C9B4'; g.beginPath(); g.ellipse(70, 250, 190, 90, 0, 0, 7); g.fill();
    g.fillStyle = '#74AC73'; g.beginPath(); g.ellipse(170, 310, 260, 90, 0, 0, 7); g.fill();
    const im = MIM['b-open'], t = MON.b;
    g.save(); g.translate(120, 280);
    if (im) { const h = 226, mw = h * im.width / im.height; g.drawImage(im, -mw / 2, -h, mw, h); g.fillStyle = INK; g.font = `700 86px ${A.FONT_BODY}`; g.textAlign = 'center'; g.fillText('b', (t[0] - 0.5) * mw, -h + t[1] * h + 24); }
    else { g.fillStyle = '#5BB1E0'; g.beginPath(); g.ellipse(0, -104, 86, 104, 0, 0, 7); g.fill(); g.fillStyle = '#F8E3C0'; g.beginPath(); g.arc(0, -78, 56, 0, 7); g.fill(); g.fillStyle = '#3A2A2A'; g.beginPath(); g.arc(-24, -160, 9, 0, 7); g.arc(24, -160, 9, 0, 7); g.fill(); g.fillStyle = '#5A2440'; g.beginPath(); g.ellipse(0, -140, 9, 11, 0, 0, 7); g.fill(); g.fillStyle = INK; g.font = `700 86px ${A.FONT_BODY}`; g.textAlign = 'center'; g.fillText('b', 0, -52); }
    g.restore();
    // a ball on its way in
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 5; g.lineCap = 'round'; g.setLineDash([2, 13]); g.beginPath(); g.moveTo(236, 96); g.quadraticCurveTo(200, 70, 150, 120); g.stroke(); g.setLineDash([]);
    g.save(); g.translate(242, 108);
    if (PIM.ball) g.drawImage(PIM.ball, -42, -42, 84, 84 * PIM.ball.height / PIM.ball.width);
    else { g.fillStyle = '#E8664A'; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.fill(); g.fillStyle = '#F7D27A'; g.beginPath(); g.ellipse(0, 0, 15, 38, 0.3, 0, 7); g.fill(); }
    g.restore(); g.restore();
  }
  loadMon('b'); loadPic('ball');

  K.game({ id: 'sounds', title: 'First Sounds', voice: 'sounds', group: 'arcade', subject: 'reading', age: 5, order: 41, icon, start, lines, resize: () => K.go('sounds') });
})();
