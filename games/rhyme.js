/* Rhyme Time — words that sound alike.
   Cards lie on the grass. A tap says a card's word and picks it up, so the child can listen and compare;
   a second tap, a tap on the place it goes, or a drag sends it there. Right pairs hop together and both
   words are said again, their rhyming letters in colour. A wrong try is handed back and the two words are
   said side by side: "cat. sock. They do not rhyme." After two misses the right card glows.
   Level 1: a picture and two or three choices; one rhymes (cat / hat).
   Level 2: rhyme houses (the -at house, the -og house ...): sort the cards home; and the odd one out of three.
   Level 3: written words. Swap the first letter tile to make each word of a family (c-at, h-at, b-at; some
   tiles make no word), match rhymes that are spelt differently (bear / pear / hair), and finish a two-line verse.
   Words are spoken as one-word sentences so each is recorded once. Every set rhymes in American and British speech. */
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

  /* ---------------- words ---------------- */
  /** Rhyme families with pictures. Every set rhymes in both American and British speech. */
  const FAM = { at: ['cat', 'hat', 'bat'], og: ['dog', 'frog', 'log'], ox: ['fox', 'box'], an: ['can', 'pan', 'fan', 'van'], en: ['hen', 'pen', 'ten'], ee: ['bee', 'tree', 'key', 'three'],
    ar: ['car', 'star', 'jar'], ug: ['bug', 'rug', 'mug'], ake: ['cake', 'snake'], ing: ['ring', 'king'], oat: ['boat', 'coat'], ell: ['bell', 'shell'], oon: ['moon', 'spoon'],
    ouse: ['house', 'mouse'], ock: ['sock', 'clock'], air: ['pear', 'chair'] };
  /** Pictures that rhyme with none of the above: the odd ones. */
  const EXTRA = ['apple', 'banana', 'book', 'pig', 'cow', 'sun', 'bus', 'kite', 'gift', 'fish', 'lemon', 'cheese', 'cup', 'bed'];
  const NUMERAL = { ten: 1, three: 1 };
  /** Written words that rhyme though they are spelt differently (level 3). */
  const SPELT = [['bear', 'pear', 'hair', 'chair'], ['blue', 'shoe', 'two', 'zoo'], ['bee', 'key', 'tea', 'sea'], ['sun', 'one', 'done'], ['kite', 'night', 'light'], ['cake', 'snake', 'break'],
    ['fox', 'box', 'socks'], ['bed', 'said', 'head'], ['snail', 'tail', 'whale'], ['boat', 'coat', 'note']];
  /** First letters that do NOT make a word with each ending, for the letter-swap round. */
  const BAD = { at: 'zdlj', an: 'zlgs', en: 'vcsl', ug: 'zvsw', og: 'zvkp', ox: 'zmtn', ar: 'zvdn', ing: 'vhng', oat: 'zpsh', ake: 'zpgv', ell: 'zpgk', ock: 'zvgy', oon: 'zdvf', ouse: 'zpft' };
  const VERSES = [
    { a: 'I saw a fat cat.', b: 'It wore a red hat.', key: 'cat', word: 'hat', wrong: ['sock', 'shoe', 'coat'] },
    { a: 'Here is a busy bee.', b: 'It sits in a tree.', key: 'bee', word: 'tree', wrong: ['house', 'boat', 'box'] },
    { a: 'A frog sat on a log.', b: 'Along came a dog.', key: 'log', word: 'dog', wrong: ['cat', 'hen', 'pig'] },
    { a: 'Wake up, little snake.', b: 'Come and eat some cake.', key: 'snake', word: 'cake', wrong: ['cheese', 'pear', 'apple'] },
    { a: 'I can see a mouse.', b: 'It lives in my house.', key: 'mouse', word: 'house', wrong: ['shoe', 'box', 'hat'] },
    { a: 'Put on your coat.', b: 'We sail in a boat.', key: 'coat', word: 'boat', wrong: ['car', 'bus', 'van'] },
    { a: 'Look up at the moon.', b: 'I eat with a spoon.', key: 'moon', word: 'spoon', wrong: ['pan', 'cup', 'jar'] },
    { a: 'Ding dong goes the bell.', b: 'The snail is in its shell.', key: 'bell', word: 'shell', wrong: ['house', 'box', 'bed'] },
  ];
  const T = { pair: 'What rhymes with this?', houses: 'Put the rhymes in their houses.', odd: 'Two of these rhyme. Put the odd one in the basket.', swap: 'Change the first sound. Make a new word.',
    read: 'Read the words.', finish: 'Finish the rhyme.', no: 'They do not rhyme.', yes: 'They rhyme.', notWord: 'That is not a word.' };
  const famOf = {}; for (const f in FAM) for (const w of FAM[f]) famOf[w] = f;
  const speltOf = (w) => SPELT.findIndex((s) => s.indexOf(w) >= 0);
  /** Where a word's rhyming part starts, and the letters to pick out in colour. */
  const rimeAt = (w) => Math.max(0, w.search(/[aeiou]/));
  const marks = (w) => w.split('').map((c, i) => i).filter((i) => i >= rimeAt(w));
  function lines() {
    const out = [], seen = {};
    const add = (t) => { for (const s of String(t).match(/[^.!?]+[.!?]*/g) || []) { const k = s.trim(); if (k && !seen[k]) { seen[k] = 1; out.push(k); } } };
    Object.values(T).forEach(add);
    for (const v of VERSES) { add(v.a); add(v.b); for (const w of v.wrong.concat(v.word, v.key)) add(w + '.'); }
    for (const f in FAM) for (const w of FAM[f]) add(w + '.');
    for (const w of EXTRA.concat(...SPELT)) add(w + '.');
    return out;
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, ROUNDS = 4;
    const HZ = land ? 560 : 650, cy = land ? 365 : 440;
    let R = null, won = 0, skill = 0, turns = 0, sel = null, held = null, forced = null, starPop = 0, hands = 0;
    const cards = [], targets = [], extras = [], recent = [];
    Object.keys(SRC).forEach(loadPic);
    const speak = (text, min, max, fn) => Promise.race([Promise.all([(fn || ctx.say)(text), ctx.wait(min)]), ctx.wait(max)]);
    const okWord = (w) => L > 1 || !NUMERAL[w];
    const letters = (g, w, x, y, size, on) => {                       // a word, some of its letters picked out in colour
      g.font = `700 ${size}px ${A.FONT_BODY}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      const ws = w.split('').map((c) => g.measureText(c).width + size * 0.04), tot = ws.reduce((a, b) => a + b, 0); let cx = x - tot / 2;
      w.split('').forEach((c, i) => { g.fillStyle = on.indexOf(i) >= 0 ? '#E8664A' : INK; g.fillText(c, cx + size * 0.02, y); cx += ws[i]; });
    };
    const glow = (g, x, y, r, a) => { const gr = g.createRadialGradient(x, y, r * 0.25, x, y, r); gr.addColorStop(0, `rgba(247,210,122,${0.95 * a})`); gr.addColorStop(1, 'rgba(247,210,122,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };

    /* ---------- the hillside ---------- */
    st.add({ z: 0, sprite: A.sprite('rh-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#F8E6CF', { shadow: 0, grain: 0.3, light: 0 });
      const cool = g.createLinearGradient(0, 0, 0, HZ * 0.8); cool.addColorStop(0, 'rgba(176,214,226,.95)'); cool.addColorStop(1, 'rgba(176,214,226,0)'); g.fillStyle = cool; g.fillRect(0, 0, W, HZ);
      g.beginPath(); g.arc(W * (land ? 0.86 : 0.8), HZ * 0.42, land ? 62 : 50, 0, 7); A.paper(g, s, '#F7D27A', { shadow: 0.3, light: 0.08, box: { x: W * 0.8, y: HZ * 0.3, w: 130, h: 130 } });
      const hill = (x, y, rx, ry, col, seed) => { g.beginPath(); A.blob(g, x, y, rx, ry, 0.05, seed, 12); A.paper(g, s, col, { shadow: 0.5, box: { x: x - rx, y: y - ry, w: rx * 2, h: ry }, light: 0.05 }); };
      hill(W * 0.78, HZ + 90, W * 0.44, 330, '#C9BFD8', 4); hill(W * 0.16, HZ + 80, W * 0.4, 270, '#B5C9CF', 6); hill(W * 0.52, HZ + 120, W * 0.52, 250, '#9CC7AE', 8);
      g.beginPath(); g.moveTo(-20, HZ - 4); g.quadraticCurveTo(W * 0.25, HZ - 34, W * 0.55, HZ - 6); g.quadraticCurveTo(W * 0.8, HZ + 14, W + 20, HZ - 20); g.lineTo(W + 20, H + 20); g.lineTo(-20, H + 20); g.closePath();
      A.paper(g, s, '#8CC084', { shadow: 0.7, box: { x: 0, y: HZ - 40, w: W, h: H - HZ + 40 }, light: 0.07, grain: 0.3 });
      const rnd = A.rng(29);
      for (let i = 0; i < 30; i++) { const x = rnd() * W, y = HZ + 20 + rnd() * (H - HZ - 30); A.line(g, 'rgba(60,120,74,.38)', 3, (h) => { h.moveTo(x - 7, y); h.lineTo(x - 3, y - 12); h.moveTo(x, y); h.lineTo(x, y - 15); h.moveTo(x + 7, y); h.lineTo(x + 4, y - 11); }); }
      for (let i = 0; i < 12; i++) { const x = rnd() * W, y = HZ + 26 + rnd() * (H - HZ - 40), c = ['#FBF6EC', '#F7D27A', '#F4B49A'][i % 3]; for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.257) * 7, y + Math.sin(p * 1.257) * 7, 5, 0, 7); g.fillStyle = c; g.fill(); } g.beginPath(); g.arc(x, y, 4, 0, 7); g.fillStyle = '#E8664A'; g.fill(); }
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

    /* ---------- cards ---------- */
    const SIZE = { pic: [150, 150], both: [150, 192], word: [180, 106] };
    const sizeOf = (c) => (c.kind === 'tile' ? [62 + c.text.length * 38, 120] : SIZE[c.kind]);
    const cardSp = (w, h) => A.sprite('rh-c' + w + 'x' + h, [-w / 2, -h / 2, w, h], (g, s) => { g.beginPath(); A.rect(g, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 24, w + h, 1); A.paper(g, s, '#FBF6EC', { shadow: 0.9, box: { x: -w / 2, y: -h / 2, w, h }, light: 0.04 }); });
    const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
    /** A card: a picture, a picture with its word, a written word, or a letter tile. lit: the rhyming letters in colour. */
    function paintCard(g, c, lit) {
      const [w, h] = sizeOf(c), word = c.word;
      put(g, cardSp(w, h));
      if (c.kind === 'pic') { drawPic(g, word, 120); if (lit) { g.save(); g.translate(0, h / 2 + 36); put(g, cardSp(Math.max(110, word.length * 24 + 44), 56)); letters(g, word, 0, 12, 36, marks(word)); g.restore(); } }
      else if (c.kind === 'both') { g.save(); g.translate(0, -22); drawPic(g, word, 112); g.restore(); letters(g, word, 0, h / 2 - 22, word.length > 5 ? 30 : 36, lit ? marks(word) : []); }
      else if (c.kind === 'word') letters(g, word, 0, 17, word.length > 5 ? 44 : 52, lit ? marks(word) : []);
      else letters(g, c.text, 0, 22, 68, [0, 1, 2]);
    }
    function rowSlots(n, tiles) {
      const out = [];
      if (land || n <= 3 || tiles) { const gap = Math.min(tiles ? 150 : land ? 208 : 180, (W - 30) / n); for (let i = 0; i < n; i++) out.push({ x: W / 2 + (i - (n - 1) / 2) * gap, y: land ? 776 : 880 }); return out; }
      const cols = n === 4 ? 2 : 3, rows = Math.ceil(n / cols), gap = cols === 2 ? 210 : 180;
      for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols; out.push({ x: W / 2 + ((i % cols) - (inRow - 1) / 2) * gap, y: 830 + r * 196 }); }
      return out;
    }
    function addCard(c, slot, i) {
      const [w, h] = sizeOf(c);
      const node = st.add({ z: 30, x: slot.x, y: slot.y, sx: 0, sy: 0, label: c.word || 'letter ' + c.text, pressable: false, pad: 4, hit: { x: -w / 2, y: -h / 2, w, h } });
      node._bsx = node._bsy = 1;
      Object.assign(c, { node, home: slot, ph: i * 1.9, busy: true, held: false, round: R, hop: 0, lit: false, pulse: false, stay: false });
      node.draw = (g) => {
        const k = c.pulse && !c.held ? 1 + Math.sin(st.t * 7) * 0.07 : 1;
        if ((sel === c || c.pulse) && !c.held && !c.stay) glow(g, 0, 0, Math.max(w, h) * 0.95, 1);
        g.save(); g.translate(0, -Math.abs(Math.sin(c.hop * 10)) * 24); g.scale(k, k); paintCard(g, c, c.lit); g.restore();
      };
      node.update = (dt) => {
        c.hop = Math.max(0, c.hop - dt);
        if (c.busy || c.held || c.stay || node.tweens.length) return;
        node.y = slot.y + Math.sin(st.t * 1.4 + c.ph) * 5 - (sel === c ? 14 : 0); node.rot = Math.sin(st.t * 1.05 + c.ph) * 0.03;
      };
      node.onDown = (p) => {
        if (c.busy || c.stay || !R || R.over) return;
        if (sel && sel !== c) sel = null;
        held = c; c.held = true; c.dx = node.x - p.x; c.dy = node.y - p.y; node.z = 40; st.root._sorted = false; R.acted = true;
        K.sfx.tap(); node.to({ sx: 1.1, sy: 1.1 }, { dur: 0.1, ease: 'out' });
      };
      node.onMove = (p) => { if (c.held) { node.x = p.x + c.dx; node.y = p.y + c.dy; node.rot = 0; } };
      node.onUp = (p, e, s) => {
        if (!c.held) return;
        c.held = false; held = null;
        if (s.moved < 24) { node.to({ sx: 1, sy: 1 }, { dur: 0.2 }); tapCard(c); return; }
        let best = null, bd = 1e9;
        for (const tg of targets) { const d = Math.hypot(node.x - tg.x, node.y - tg.y); if (d < tg.r && d < bd) { best = tg; bd = d; } }
        if (best) deliver(c, best, 0.16); else goHome(c);
      };
      node.onTap = (p) => { if (!p) tapCard(c); };                      // keyboard and screen readers
      ctx.after(320 + i * 110, () => { if (c.round !== R) return; K.sfx.pop(); node.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back' }).then(() => { c.busy = false; }); });
      cards.push(c);
    }
    function goHome(c, then) { c.busy = true; c.node.to({ x: c.home.x, y: c.home.y, sx: 1, sy: 1, rot: 0 }, { dur: 0.45, ease: 'back' }).then(() => { c.busy = false; c.node.z = 30; st.root._sorted = false; if (then) then(); }); }
    /** A tap says the word and picks the card up. A second tap (or a tap on the place it goes) sends it. */
    function tapCard(c) {
      if (c.busy || c.stay || !R || R.over) return;
      R.acted = true;
      if (c.kind === 'tile' || (sel === c && targets.length === 1)) { deliver(c, targets[0], 0.4); return; }
      sel = c; c.hop = 0.3; ctx.say(c.word + '.');
      if (targets.length > 1) { for (const tg of targets) tg.hop = 0.3; return; }            // every house says: bring it here?
      if (hands < 2) ctx.after(1500, () => { if (sel === c && R && !R.over && !c.busy) showHand(c); });
    }
    function showHand(c) {
      const tg = targets[0]; if (!tg || hands >= 2) return;
      hands++;
      const n = st.add({ ui: true, z: 80, x: c.node.x + 10, y: c.node.y + 10, alpha: 0, press: 0 });
      n.draw = (g, s) => A.hand(g, s, n.press);
      n.to({ alpha: 1 }, { dur: 0.2 }).then(() => n.to({ press: 1 }, { dur: 0.2 })).then(() => n.to({ x: tg.x + 10, y: tg.y + 10 }, { dur: 0.9, ease: 'inOut' })).then(() => n.to({ press: 0 }, { dur: 0.2 })).then(() => n.to({ alpha: 0 }, { dur: 0.3, delay: 0.3 })).then(() => n.remove());
    }
    function deliver(c, tg, dur) {
      if (c.busy || !R || R.over) return;
      c.busy = true; if (sel === c) sel = null; c.node.z = 40; st.root._sorted = false;
      const d = tg.dest(c, tg); if (dur > 0.2) K.sfx.whoosh();
      c.node.to({ x: d.x, y: d.y, sx: d.k, sy: d.k, rot: d.rot || 0 }, { dur, ease: 'inOut' }).then(() => {
        if (!R || c.round !== R || R.over) return;
        if (c.owner === tg.i) { K.sfx.step(R.got++); ctx.fx.burst(d.x, d.y, { n: 10 }); R.right(c, tg); return; }
        R.misses++; K.sfx.whoops(); tg.shake = 0.5;
        goHome(c);
        R.wrong(c, tg);
        if (R.misses >= 2) { R.hint = true; for (const x of cards) x.pulse = x.owner >= 0 && !x.stay && targets.length === 1; }
      });
    }
    /** A place cards can go. o: {x, y, r, dest(card), draw(g, s, node), tap(), label, hit} */
    function addTarget(o) {
      const tg = Object.assign({ i: targets.length, shake: 0, hop: 0, glow: 0 }, o);
      const node = st.add({ z: 10, x: o.x, y: o.y, sx: 0, sy: 0, label: o.label, pressable: false, pad: 0, hit: o.hit });
      node._bsx = node._bsy = 1;
      node.draw = (g, s) => {
        const c = held || sel, lit = c && R && !R.over && (targets.length === 1 || (R.hint && c.owner === tg.i));
        tg.glow += ((lit ? 1 : 0) - tg.glow) * 0.15;
        g.save(); g.translate(0, -Math.abs(Math.sin(tg.hop * 9)) * 22); g.rotate(tg.shake > 0 ? Math.sin(tg.shake * 26) * 0.05 : 0); o.draw(g, s, tg); g.restore();
      };
      node.update = (dt) => { tg.shake = Math.max(0, tg.shake - dt); tg.hop = Math.max(0, tg.hop - dt); };
      node.onTap = () => { if (!R || R.over) return; R.acted = true; if (sel && !sel.busy) deliver(sel, tg, 0.4); else if (o.tap) o.tap(tg); };
      node.to({ sx: 1, sy: 1 }, { dur: 0.42, ease: 'back', delay: 0.05 + tg.i * 0.1 });
      tg.node = node; targets.push(tg);
      return tg;
    }
    /** Something else in the top half of this round's picture. */
    function extra(o) { const n = st.add(Object.assign({ z: 8, sx: 0, sy: 0 }, o)); n._bsx = n._bsy = 1; n.to({ sx: 1, sy: 1 }, { dur: 0.42, ease: 'back' }); extras.push(n); return n; }

    /* ---------- choosing words ---------- */
    const fresh = (list) => { const ok = list.filter((k) => recent.indexOf(k) < 0); const k = K.pick(ok.length ? ok : list); recent.push(k); while (recent.length > 3) recent.shift(); return k; };
    /** n pictures that do not rhyme with `word`, nor with each other. */
    function distract(word, n) {
      const out = [], fams = {}; fams[famOf[word]] = 1;
      for (const w of K.shuffle(Object.keys(famOf).concat(EXTRA).filter(okWord))) {
        if (out.length >= n) break;
        if (fams[famOf[w]] || (L === 1 && w.slice(-1) === word.slice(-1))) continue;
        if (famOf[w]) fams[famOf[w]] = 1;
        out.push(w);
      }
      return out;
    }

    /* ---------- the kinds of round ---------- */
    const BUILD = {
      /* a picture (or a written word) and the place beside it for its rhyme */
      pair(p, r, spelt) {
        let t, right, wrongs, key;
        if (spelt) {
          const set = SPELT[fresh(SPELT.map((s, i) => i))]; key = set[0];
          t = K.pick(set); const diff = set.filter((w) => w !== t && w.slice(rimeAt(w)) !== t.slice(rimeAt(t))); right = K.pick(diff.length ? diff : set.filter((w) => w !== t));
          // the others look alike but do not rhyme: the same last letters or the same first letter
          const sc = {}; for (const w of [].concat(...SPELT)) sc[w] = (w.slice(-2) === t.slice(-2) ? 2 : 0) + (w.slice(-1) === t.slice(-1) ? 1 : 0) + (w[0] === t[0] ? 1 : 0) + Math.random();
          const score = (w) => sc[w];
          const si = speltOf(t), used = {}; wrongs = [];
          for (const w of [].concat(...SPELT).filter((x) => speltOf(x) !== si).sort((a, b) => score(b) - score(a))) { if (wrongs.length >= p.n - 1) break; if (used[speltOf(w)]) continue; used[speltOf(w)] = 1; wrongs.push(w); }
        } else {
          key = fresh(Object.keys(FAM).filter((f) => FAM[f].filter(okWord).length >= 2));
          const ws = K.shuffle(FAM[key].filter(okWord)); t = ws[0]; right = ws[1]; wrongs = distract(t, p.n - 1);
        }
        const kind = spelt ? 'word' : L === 1 ? 'pic' : 'both', big = spelt ? 1.2 : 1.25, tc = { word: t, kind, lit: false, hop: 0 };
        const [w, h] = SIZE[kind], off = land ? 150 : 132, tx = W / 2 - off, sx = W / 2 + off;
        Object.assign(r, { key, prompt: spelt ? `${T.read} ${T.pair} ${t}.` : `${T.pair} ${t}.`, name: !spelt, list: K.shuffle([{ word: right, kind, owner: 0 }].concat(wrongs.map((x) => ({ word: x, kind, owner: -1 })))) });
        const tn = extra({ x: tx, y: cy, label: 'the word ' + t, pressable: false, hit: { x: -w * big / 2, y: -h * big / 2, w: w * big, h: h * big } });
        tn.draw = (g) => { g.save(); g.translate(0, -Math.abs(Math.sin(tc.hop * 10)) * 24); g.scale(big, big); paintCard(g, tc, tc.lit); g.restore(); };
        tn.update = (dt) => { tc.hop = Math.max(0, tc.hop - dt); };
        tn.onTap = () => { if (r.over) return; r.acted = true; if (sel && !sel.busy) deliver(sel, targets[0], 0.4); else { tc.hop = 0.3; ctx.say(t + '.'); } };
        extra({ x: W / 2, y: cy, z: 7, draw(g) { for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * 22, Math.sin(st.t * 3 + i) * 4, 6, 0, 7); g.fillStyle = 'rgba(110,78,126,.5)'; g.fill(); } } });
        addTarget({ x: sx, y: cy, r: 170, label: 'the rhyme goes here', hit: { x: -w * big / 2, y: -h * big / 2, w: w * big, h: h * big }, dest: () => ({ x: sx, y: cy, k: big }),
          draw(g, s, tg) {
            if (tg.glow > 0.02) glow(g, 0, 0, h * big * 0.85, tg.glow);
            if (r.placed) return;
            g.beginPath(); A.rect(g, -w * big / 2 + 4, -h * big / 2 + 4, w * big - 8, h * big - 8, 28, 5, 1); g.fillStyle = 'rgba(251,246,236,.5)'; g.fill();
            g.setLineDash([14, 12]); g.lineWidth = 5; g.strokeStyle = 'rgba(110,78,126,.55)'; g.stroke(); g.setLineDash([]);
            g.save(); g.rotate(Math.sin(st.t * 2) * 0.08); g.font = `800 ${h * 0.5}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(110,78,126,.6)'; g.fillText('?', 0, 6); g.restore();
          } });
        r.right = (c) => { r.placed = c; c.stay = true; c.lit = tc.lit = true; c.hop = tc.hop = 1.2; r.said = ctx.say(`${t}. ${c.word}.`); done(); };
        r.wrong = (c) => { tc.hop = 0.3; ctx.say(`${t}. ${c.word}. ${T.no}`); };
      },
      spelt(p, r) { BUILD.pair(p, r, true); },
      /* rhyme houses: each has one of its family at the window; the cards go home */
      houses(p, r) {
        const n = p.nh, ok = Object.keys(FAM).filter((f) => FAM[f].filter(okWord).length >= 3), fams = [];
        const six = n === 2 && p.n >= 6;                                  // six cards for two houses needs the big families
        for (const f of K.shuffle(ok)) {
          if (fams.length >= n) break;
          if (six ? FAM[f].length < 4 : (recent.indexOf(f) >= 0 && ok.length - recent.length >= n)) continue;
          if (fams.some((q) => (skill < 2 && q[0] === f[0]) || (q + f).replace(/[ae]n/g, '') === '')) continue;   // near rhymes (-an / -en) do not share a round
          fams.push(f);
        }
        recent.push(...fams); while (recent.length > 4) recent.shift();
        const per = six && fams.every((f) => FAM[f].filter(okWord).length >= 4) ? 3 : 2;
        const hw = land ? 270 : 172, hh = land ? 350 : 300, gap = land ? 70 : 12, base = HZ + 12, list = [], seeds = [];
        Object.assign(r, { key: fams[0], name: n * per <= 4 });
        fams.forEach((f, i) => {
          const ws = K.shuffle(FAM[f].filter(okWord)), seed = ws[0], x = W / 2 + (i - (n - 1) / 2) * (hw + gap); seeds.push(seed);
          for (const w of ws.slice(1, 1 + per)) list.push({ word: w, kind: 'pic', owner: i });
          const sp = A.sprite('rh-h' + f + hw + i, [-hw / 2 - 12, -hh - 12, hw + 24, hh + 24], (g, s) => house(g, s, hw, hh, i, '-' + f));
                    addTarget({ x, y: base - hh * 0.3, r: land ? 190 : 150, label: 'the ' + f + ' house', seed, hit: { x: -hw / 2, y: -hh * 0.7, w: hw, h: hh },
            dest: (c, tg) => ({ x: x + ((tg.n || 0) - (per - 1) / 2) * hw * 0.3, y: base + 34, k: 0.42 }),
            tap(tg) { tg.hop = 0.35; ctx.say(seed + '.'); },
            draw(g, s, tg) {
              g.translate(0, hh * 0.3);
              if (tg.glow > 0.02) glow(g, 0, -hh * 0.45, hh * 0.8, tg.glow);
              put(g, sp); g.save(); g.translate(0, -hh * 0.6 * 0.54); g.rotate(Math.sin(st.t * 1.6 + i) * 0.04); drawPic(g, seed, hw * 0.42); g.restore();
            } });
        });
        r.list = K.shuffle(list); r.prompt = `${T.houses} ${seeds.join('. ')}.`;
        r.right = (c, tg) => { c.stay = true; tg.n = (tg.n || 0) + 1; tg.hop = 0.6; c.node.z = 12; st.root._sorted = false; r.said = ctx.say(`${tg.seed}. ${c.word}.`); if (--r.left <= 0) done(); };
        r.wrong = (c, tg) => { ctx.say(`${c.word}. ${tg.seed}. ${T.no}`); };
      },
      /* three pictures, two rhyme: the odd one goes in the basket */
      odd(p, r) {
        const key = fresh(Object.keys(FAM).filter((f) => FAM[f].filter(okWord).length >= 2)), ws = K.shuffle(FAM[key].filter(okWord)), a = ws[0], b = ws[1], o = distract(a, 1)[0];
        const kind = L >= 3 ? 'both' : 'pic', bx0 = W / 2, by = HZ - 64, sp = A.sprite('rh-basket', [-140, -150, 280, 250], basket);
        const ca = { word: a, kind, owner: -1 }, cb = { word: b, kind, owner: -1 }; ca.mate = cb; cb.mate = ca;
        Object.assign(r, { key, prompt: T.odd, name: true, list: K.shuffle([ca, cb, { word: o, kind, owner: 0 }]) });
        addTarget({ x: bx0, y: by, r: 190, label: 'basket', hit: { x: -130, y: -130, w: 260, h: 220 }, dest: () => ({ x: bx0, y: by - 46, k: 0.7, rot: 0.12 }), tap(tg) { tg.hop = 0.3; K.sfx.pop(); },
          draw(g, s, tg) { if (tg.glow > 0.02) glow(g, 0, -10, 210, tg.glow); put(g, sp); } });
        r.right = (c) => { c.stay = true; ca.hop = cb.hop = 1.2; ca.lit = cb.lit = true; r.said = ctx.say(`${a}. ${b}. ${T.yes}`); done(); };
        r.wrong = (c) => { c.hop = c.mate.hop = 0.6; ctx.say(`${c.word}. ${c.mate.word}. ${T.yes}`); };
      },
      /* letter tiles: change the first sound and make each new word of the family */
      swap(p, r) {
        const key = fresh(Object.keys(BAD).filter((f) => p.blends || FAM[f].every((w) => w.length - f.length === 1))), ws = K.shuffle(FAM[key]).slice(0, 4), on = (w) => w.slice(0, w.length - key.length);
        Object.assign(r, { key, cur: ws[0], pop: 0, name: false, prompt: `${ws[0]}. ${T.swap}` });
        r.list = K.shuffle(ws.slice(1).map((w) => ({ word: w, text: on(w), kind: 'tile', owner: 0 })).concat(K.sample(BAD[key].split(''), p.bad).map((b) => ({ word: '', text: b, kind: 'tile', owner: -1 }))));
        const TW = 96, wy = cy + 96, ow = () => 62 + on(r.cur).length * 38, x0 = () => W / 2 - (ow() + key.length * TW) / 2;
        const pic = extra({ x: W / 2, y: cy - 78, label: 'the picture', pressable: false, hit: { x: -85, y: -85, w: 170, h: 170 } });
        pic.draw = (g) => { const k = 1 + r.pop * 0.25; g.save(); g.scale(k, k); g.rotate(Math.sin(st.t * 1.5) * 0.03); put(g, cardSp(176, 176)); drawPic(g, r.cur, 140); g.restore(); };
        pic.update = (dt) => { r.pop = Math.max(0, r.pop - dt * 2.5); };
        pic.onTap = () => { r.pop = 0.6; ctx.say(r.cur + '.'); };
        addTarget({ x: W / 2, y: wy, r: 210, label: 'the word', hit: { x: -220, y: -70, w: 440, h: 140 }, dest: () => ({ x: x0() + ow() / 2, y: wy, k: 1 }), tap() { r.pop = 0.6; ctx.say(r.cur + '.'); },
          draw(g, s, tg) {
            const o = on(r.cur), w0 = ow(), xs = x0() - W / 2;
            if (tg.glow > 0.02) glow(g, xs + w0 / 2, 0, 120, tg.glow);
            g.save(); g.translate(xs + w0 / 2, -Math.abs(Math.sin(r.pop * 6)) * 14); put(g, cardSp(w0, 120)); letters(g, o, 0, 22, 68, [0, 1, 2]); g.restore();
            key.split('').forEach((ch, i) => { g.save(); g.translate(xs + w0 + TW * (i + 0.5), 0); put(g, cardSp(TW, 120)); letters(g, ch, 0, 22, 68, []); g.restore(); });
          } });
        r.right = (c) => { cards.splice(cards.indexOf(c), 1); c.node.remove(); r.cur = c.word; r.pop = 1; r.said = ctx.say(c.word + '.'); if (--r.left <= 0) done(); };
        r.wrong = () => { ctx.say(T.notWord); };
      },
      /* a two-line verse with its last word missing */
      verse(p, r) {
        const v = VERSES[fresh(VERSES.map((x, i) => i))], pw = Math.min(W - 60, 860), ph = land ? 270 : 300, fs = land ? 50 : 38;
        Object.assign(r, { key: v.word, pop: 0, prompt: `${v.a} ${T.finish}`, name: true, slot: { x: W / 2, y: cy + 50 }, list: K.shuffle([{ word: v.word, kind: 'both', owner: 0 }].concat(K.sample(v.wrong, p.n - 1).map((w) => ({ word: w, kind: 'both', owner: -1 })))) });
        const sp = A.sprite('rh-page' + pw + 'x' + ph, [-pw / 2, -ph / 2, pw, ph], (g, s) => {
          g.beginPath(); A.rect(g, -pw / 2 + 4, -ph / 2 + 4, pw - 8, ph - 8, 30, 3, 1.5); A.paper(g, s, '#FFFBF1', { shadow: 1, box: { x: -pw / 2, y: -ph / 2, w: pw, h: ph }, light: 0.03 });
          g.beginPath(); A.rect(g, -pw / 2 + 4, -ph / 2 + 4, 26, ph - 8, [30, 4, 4, 30], 4, 0.5); g.fillStyle = '#E8664A'; g.fill();
        });
        const stem = v.b.replace(/\s+\S+$/, '');
        addTarget({ x: W / 2, y: cy, r: land ? 260 : 240, label: 'the verse', hit: { x: -pw / 2, y: -ph / 2, w: pw, h: ph }, dest: () => ({ x: r.slot.x, y: r.slot.y, k: 0.36 }), tap() { ctx.say(v.a); },
          draw(g, s, tg) {
            if (tg.glow > 0.02) glow(g, r.slot.x - W / 2, r.slot.y - cy, 130, tg.glow);
            put(g, sp);
            let f = fs; g.font = `700 ${f}px ${A.FONT_BODY}`; const widest = Math.max(g.measureText(v.a).width, g.measureText(v.b).width + 40); if (widest > pw - 90) f = Math.floor(f * (pw - 90) / widest);
            g.font = `700 ${f}px ${A.FONT_BODY}`; g.textBaseline = 'alphabetic'; g.fillStyle = INK; g.textAlign = 'center'; g.fillText(v.a, 12, -ph * 0.12);
            const sw = Math.max(f * 2.4, g.measureText(v.word).width + 24), tw = g.measureText(stem + ' ').width, tot = tw + sw + g.measureText('.').width, lx = 12 - tot / 2, ly = ph * 0.22;
            g.textAlign = 'left'; g.fillText(stem, lx, ly); g.fillText('.', lx + tw + sw, ly);
            r.slot.x = W / 2 + lx + tw + sw / 2; r.slot.y = cy + ly - f * 0.3;
            if (r.done) { g.save(); g.translate(lx + tw + sw / 2, ly); const k = 1 + r.pop * 0.3; g.scale(k, k); letters(g, v.word, 0, 0, f, marks(v.word)); g.restore(); }
            else { g.beginPath(); A.rect(g, lx + tw + 3, ly - f * 0.95, sw - 6, f * 1.25, 12, 6, 0.5); g.fillStyle = 'rgba(247,210,122,.35)'; g.fill(); g.setLineDash([10, 8]); g.lineWidth = 4; g.strokeStyle = 'rgba(110,78,126,.55)'; g.stroke(); g.setLineDash([]); }
          } });
        extras.push(st.add({ update(dt) { r.pop = Math.max(0, (r.pop || 0) - dt * 2); } }));
        r.right = (c) => { cards.splice(cards.indexOf(c), 1); c.node.remove(); r.done = true; r.pop = 1; r.said = ctx.say(v.b); done(2600); };
        r.wrong = (c) => { ctx.say(`${v.key}. ${c.word}. ${T.no}`); };
      },
    };
    /** A rhyme house: its family ending is written on the roof; the round window shows who lives there. */
    function house(g, s, hw, hh, i, name) {
      const col = ['#E8876F', '#6FB3A8', '#F2C063'][i % 3], roof = ['#6E4E7E', '#C9553F', '#3E6FA0'][i % 3], bw = hw * 0.84, bh = hh * 0.6, wr = hw * 0.27, wy = -bh * 0.54;
      g.beginPath(); A.rect(g, hw * 0.2, -hh * 0.9, hw * 0.13, hh * 0.3, 4, 3, 0.5); A.paper(g, s, '#B98558', { shadow: 0.5 });
      g.beginPath(); A.rect(g, -bw / 2, -bh, bw, bh, 12, 4, 1); A.paper(g, s, col, { shadow: 0.9, box: { x: -bw / 2, y: -bh, w: bw, h: bh }, light: 0.06 });
      g.beginPath(); A.cut(g, [[-hw / 2, -bh + 10], [0, -hh], [hw / 2, -bh + 10]], 16, 1, 5); A.paper(g, s, roof, { shadow: 0.8, box: { x: -hw / 2, y: -hh, w: hw, h: hh - bh }, light: 0.07 });
      g.beginPath(); g.arc(0, wy, wr + 9, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 0.4 });
      g.beginPath(); g.arc(0, wy, wr, 0, 7); g.fillStyle = '#FFF1CF'; g.fill();
      for (const k of [-1, 1]) { g.beginPath(); A.rect(g, k * bw * 0.36 - 9, -bh * 0.2, 18, bh * 0.2, 4, 6, 0.4); g.fillStyle = 'rgba(46,42,59,.12)'; g.fill(); }
      const py = -bh - (hh - bh) * 0.36, pw = Math.min(hw * 0.5, 40 + name.length * 20);
      g.beginPath(); A.rect(g, -pw / 2, py - 24, pw, 48, 12, 7, 0.6); A.paper(g, s, '#FBF6EC', { shadow: 0.5 });
      g.font = `700 ${name.length > 4 ? 28 : 34}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#E8664A'; g.fillText(name, 0, py + 11);
    }
    function basket(g, s) {
      A.line(g, '#9A6A3A', 13, (h) => { h.moveTo(-92, -4); h.bezierCurveTo(-84, -150, 84, -150, 92, -4); });
      g.beginPath(); A.cut(g, [[-112, -8], [112, -8], [86, 88], [-86, 88]], [8, 8, 28, 28], 1, 3); A.paper(g, s, '#CF9C60', { shadow: 0.9, box: { x: -112, y: -8, w: 224, h: 96 }, light: 0.07 });
      g.save(); g.beginPath(); A.cut(g, [[-112, -8], [112, -8], [86, 88], [-86, 88]], [8, 8, 28, 28], 1, 3); g.clip();
      g.strokeStyle = 'rgba(120,76,36,.4)'; g.lineWidth = 4; g.beginPath(); for (let y = 14; y < 90; y += 20) { g.moveTo(-120, y); g.lineTo(120, y); } for (let x = -100; x <= 100; x += 25) for (let y = -6; y < 90; y += 40) { g.moveTo(x + (y % 40 ? 12 : 0), y); g.lineTo(x + (y % 40 ? 12 : 0), y + 20); } g.stroke(); g.restore();
      g.beginPath(); A.rect(g, -122, -24, 244, 28, 13, 4, 0.8); A.paper(g, s, '#B5803F', { shadow: 0.6 });
    }

    /* ---------- rounds ---------- */
    function plan() {
      const t = turns++;
      if (forced) { const f = forced; forced = null; return f; }
      if (L === 1) return skill >= 4 && t % 3 === 2 ? { mode: 'houses', nh: 2, n: 4 } : { mode: 'pair', n: skill < 2 ? 2 : 3 };
      if (L === 2) return t % 3 === 1 ? { mode: 'odd' } : skill < 1 ? { mode: 'houses', nh: 2, n: 4 } : skill < 3 || t % 2 ? { mode: 'houses', nh: 3, n: 6 } : { mode: 'houses', nh: 2, n: 6 };
      const mode = ['swap', 'spelt', 'verse'][t % 3];
      return mode === 'swap' ? { mode, bad: skill < 2 ? 1 : 2, blends: skill >= 2 } : mode === 'spelt' ? { mode, n: skill < 2 ? 3 : 4 } : { mode, n: skill < 3 || !land ? 3 : 4 };
    }
    function clear() {
      sel = held = null;
      for (const c of cards.splice(0)) { const n = c.node; c.busy = true; n.to({ sx: 0, sy: 0, alpha: 0 }, { dur: 0.25, ease: 'inOut' }).then(() => n.remove()); }
      for (const n of targets.splice(0).map((t) => t.node).concat(extras.splice(0))) n.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' }).then(() => n.remove());
    }
    async function newRound() {
      clear();
      await ctx.wait(300);
      const p = plan(), r = (R = { mode: p.mode, misses: 0, got: 0, over: false, hint: false, acted: false });
      BUILD[p.mode](p, r);
      r.left = r.list.filter((c) => c.owner >= 0).length;
      const sl = rowSlots(r.list.length, p.mode === 'swap'); r.list.forEach((c, i) => addCard(c, sl[i], i));
      K.sfx.whoosh();
      await speak(r.prompt, 900, 7000, ctx.prompt);
      // name each card once, so the child has heard every word
      if (r.name) for (const c of r.list) { if (R !== r || r.acted || r.over) break; c.hop = 0.4; await speak(c.word + '.', 750, 2200); }
    }
    async function done(ms) {
      const r = R; r.over = true; sel = null;
      for (const c of cards) c.pulse = false;
      K.sfx.sparkle();
      await Promise.race([Promise.all([r.said, ctx.wait(ms || 2000)]), ctx.wait(4800)]);
      won++; starPop = 1; K.sfx.ding();
      skill = r.misses === 0 ? skill + 1 : r.misses >= 2 ? Math.max(0, skill - 1) : skill;
      await ctx.wait(750);
      if (won >= ROUNDS) { await ctx.celebrate({ ms: 3400 }); won = 0; }
      if (R === r) newRound();
    }

    K._rhyme = { get R() { return R; }, cards, targets, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      /** Start a fresh round of a given kind, e.g. {mode: 'houses', nh: 3, n: 6}. */
      go(p) { forced = p; if (R) R.over = true; return newRound(); } };
    ctx.onExit(() => { K._rhyme = null; });
    ctx.after(350, newRound);
  }

  function icon(g, w) {
    const u = w / 300; g.save(); g.scale(u, u);
    g.fillStyle = '#F8E6CF'; g.fillRect(0, 0, 300, 300);
    g.fillStyle = '#C9BFD8'; g.beginPath(); g.ellipse(230, 250, 190, 110, 0, 0, 7); g.fill();
    g.fillStyle = '#8CC084'; g.beginPath(); g.ellipse(130, 330, 280, 110, 0, 0, 7); g.fill();
    const card = (x, y, rot, nm, col) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 10 * u; g.shadowOffsetY = 5 * u; g.fillStyle = '#FBF6EC'; g.beginPath(); g.moveTo(-42, -62); g.arcTo(58, -62, 58, 62, 16); g.arcTo(58, 62, -58, 62, 16); g.arcTo(-58, 62, -58, -62, 16); g.arcTo(-58, -62, 58, -62, 16); g.closePath(); g.fill(); g.shadowColor = 'transparent';
      const im = PIM[nm];
      if (im) { const q = Math.min(96 / im.width, 96 / im.height); g.drawImage(im, -im.width * q / 2, -im.height * q / 2, im.width * q, im.height * q); }
      else { g.fillStyle = col; g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fill(); }
      g.restore();
    };
    card(98, 150, -0.1, 'cat', '#B9B2B8'); card(206, 144, 0.09, 'hat', '#5B8FC7');
    // two little notes: they sound alike
    g.fillStyle = '#E8664A'; g.strokeStyle = '#E8664A'; g.lineWidth = 6; g.lineCap = 'round';
    for (const [x, y] of [[134, 52], [168, 44]]) { g.beginPath(); g.ellipse(x, y + 22, 10, 8, -0.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 8, y + 20); g.lineTo(x + 8, y - 8); g.stroke(); }
    g.beginPath(); g.moveTo(142, 44); g.lineTo(176, 36); g.stroke();
    g.restore();
  }
  loadPic('cat'); loadPic('hat');

  K.game({ id: 'rhyme', title: 'Rhyme Time', voice: 'rhyme', group: 'arcade', subject: 'reading', age: 5, order: 42, icon, start, lines, resize: () => K.go('rhyme') });
})();
