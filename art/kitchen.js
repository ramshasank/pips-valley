/* Pip's Playhouse — art for Monster Kitchen: food, silly things, the room, the blender, the bell.
   Foods are drawn about 100 units across around (0,0). Each has a juice colour for the blender. */
(function () {
  'use strict';
  const A = K.art;
  const Kt = (A.kitchen = {});
  const P = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);
  const shine = (g, x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot || -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill(); };
  const stem = (g, x, y, x2, y2) => A.line(g, '#6B4430', 5, (h) => { h.moveTo(x, y); h.quadraticCurveTo(x + 3, (y + y2) / 2, x2, y2); });
  const leafAt = (g, s, x, y, rot, len, col) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.4, -len * 0.45, len, 0); g.quadraticCurveTo(len * 0.4, len * 0.35, 0, 0); A.paper(g, s, col || '#6FA65F', { shadow: 0.3, light: 0.06 }); g.restore(); };
  const box = (r) => ({ x: -r, y: -r, w: r * 2, h: r * 2 });

  const F = (Kt.draw = {});
  F.banana = (g, s) => {
    g.save(); g.rotate(-0.15);
    P(g, s, '#F3CE4B', (h) => { h.moveTo(-48, -16); h.quadraticCurveTo(-4, 44, 48, -26); h.quadraticCurveTo(52, -16, 44, -8); h.quadraticCurveTo(0, 62, -52, -4); h.closePath(); }, { box: box(50) });
    A.line(g, '#D9A93A', 3, (h) => { h.moveTo(-40, -4); h.quadraticCurveTo(-2, 46, 42, -14); });
    P(g, s, '#7A5A3A', (h) => A.rect(h, 42, -32, 10, 12, 3, 2), { shadow: 0 }); P(g, s, '#7A5A3A', (h) => h.arc(-50, -10, 5, 0, 7), { shadow: 0 });
    g.restore();
  };
  F.apple = (g, s) => {
    P(g, s, '#D94B3F', (h) => { h.moveTo(0, -30); h.bezierCurveTo(-30, -52, -56, -18, -46, 14); h.bezierCurveTo(-38, 44, -14, 50, 0, 42); h.bezierCurveTo(14, 50, 38, 44, 46, 14); h.bezierCurveTo(56, -18, 30, -52, 0, -30); }, { box: box(50) });
    shine(g, -24, -12, 9, 16); stem(g, 0, -30, 6, -50); leafAt(g, s, 6, -44, -0.5, 28);
  };
  F.strawberry = (g, s) => {
    P(g, s, '#E0464C', (h) => A.cut(h, [[-42, -24], [42, -24], [0, 52]], [26, 26, 14], 0.8, 3), { box: box(50) });
    for (const [x, y] of [[-18, -8], [8, -12], [24, 2], [-4, 10], [-22, 14], [12, 24], [-4, 34]]) { g.beginPath(); g.ellipse(x, y, 3, 4.5, 0.2, 0, 7); g.fillStyle = '#F7E3A6'; g.fill(); }
    for (let i = 0; i < 5; i++) leafAt(g, s, 0, -28, -Math.PI + i * (Math.PI / 4), 26, '#5E9E57');
    shine(g, -22, -6, 6, 12);
  };
  F.orange = (g, s) => {
    P(g, s, '#F0923B', (h) => A.blob(h, 0, 2, 46, 45, 0.02, 3, 12), { box: box(48) });
    const r = A.rng(4); for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((r() - 0.5) * 60, 4 + (r() - 0.5) * 60, 1.8, 0, 7); g.fillStyle = 'rgba(190,100,30,.5)'; g.fill(); }
    shine(g, -20, -16, 9, 15); P(g, s, '#5E9E57', (h) => h.arc(4, -40, 5, 0, 7), { shadow: 0 }); leafAt(g, s, 4, -42, -0.3, 26);
  };
  F.carrot = (g, s) => {
    g.save(); g.rotate(0.6);
    for (const a of [-0.5, 0, 0.5]) leafAt(g, s, 0, -38, -Math.PI / 2 + a, 30, '#5E9E57');
    P(g, s, '#EE8A3A', (h) => A.cut(h, [[-20, -40], [20, -40], [3, 54]], [12, 12, 5], 0.6, 2), { box: box(50) });
    A.line(g, '#D2702A', 2.5, (h) => { for (const [y, w] of [[-22, 12], [-4, 9], [14, 7], [30, 4]]) { h.moveTo(-w, y); h.lineTo(w * 0.2, y + 2); } });
    g.restore();
  };
  F.cookie = (g, s) => {
    P(g, s, '#C99255', (h) => A.blob(h, 0, 0, 46, 45, 0.045, 6, 12), { box: box(48) });
    for (const [x, y, r] of [[-18, -16, 7], [12, -22, 6], [22, 4, 7], [-6, 6, 6], [-24, 16, 5], [8, 26, 7]]) { g.beginPath(); A.blob(g, x, y, r, r * 0.9, 0.1, x + 30); g.fillStyle = '#5C3A2A'; g.fill(); }
  };
  F.pear = (g, s) => {
    P(g, s, '#B5C957', (h) => A.smooth(h, [[0, -40], [18, -30], [22, -8], [38, 12], [34, 40], [0, 50], [-34, 40], [-38, 12], [-22, -8], [-18, -30]]), { box: box(50) });
    shine(g, -18, 12, 8, 16); stem(g, 0, -40, 8, -56);
  };
  F.lemon = (g, s) => {
    g.save(); g.rotate(-0.25);
    P(g, s, '#F2D84B', (h) => A.smooth(h, [[-54, 0], [-40, -22], [0, -34], [40, -22], [54, 0], [40, 22], [0, 34], [-40, 22]]), { box: box(50) });
    shine(g, -14, -14, 16, 7, 0.1); g.restore();
  };
  F.tomato = (g, s) => {
    P(g, s, '#E2533F', (h) => A.blob(h, 0, 4, 47, 42, 0.025, 8, 12), { box: box(48) });
    shine(g, -22, -8, 9, 14);
    for (let i = 0; i < 5; i++) leafAt(g, s, 0, -32, -Math.PI + i * (Math.PI / 4) + 0.1, 24, '#4F8752');
  };
  F.cucumber = (g, s) => {
    g.save(); g.rotate(-0.45);
    P(g, s, '#5E9E57', (h) => A.rect(h, -54, -19, 108, 38, 19, 3, 0.6), { box: box(50) });
    A.line(g, '#86BE77', 3, (h) => { for (const y of [-7, 5]) { h.moveTo(-40, y); h.lineTo(40, y); } });
    g.restore();
  };
  F.eggplant = (g, s) => {
    g.save(); g.rotate(0.5);
    P(g, s, '#6B4A8A', (h) => A.smooth(h, [[0, -34], [20, -22], [32, 10], [26, 40], [0, 54], [-26, 40], [-32, 10], [-20, -22]]), { box: box(50) });
    shine(g, -14, 8, 7, 18, 0.1);
    for (let i = 0; i < 4; i++) leafAt(g, s, 0, -34, -Math.PI + 0.3 + i * 0.8, 22, '#5E9E57'); stem(g, 0, -36, 4, -52);
    g.restore();
  };
  F.grapes = (g, s) => {
    stem(g, 0, -34, 8, -54); leafAt(g, s, 6, -44, -0.2, 28);
    const rows = [[-27, 0, 27], [-14, 14], [-27, 0, 27], [-14, 14], [0]];
    rows.forEach((row, i) => row.forEach((x) => { const y = -26 + i * 18; P(g, s, '#7B5AA6', (h) => h.arc(x, y, 15, 0, 7), { shadow: 0.5, box: { x: x - 15, y: y - 15, w: 30, h: 30 } }); g.beginPath(); g.arc(x - 5, y - 5, 3.5, 0, 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); }));
  };
  F.broccoli = (g, s) => {
    P(g, s, '#9CC47E', (h) => A.cut(h, [[-14, 4], [14, 4], [10, 50], [-10, 50]], 6, 0.6, 2));
    for (const [x, y, r] of [[-26, -6, 22], [26, -6, 22], [0, -26, 26], [-12, 2, 18], [14, 2, 18]]) P(g, s, '#4F8752', (h) => A.blob(h, x, y, r, r * 0.92, 0.07, x + 40), { shadow: 0.4, box: { x: x - r, y: y - r, w: r * 2, h: r * 2 } });
    for (const [x, y] of [[-30, -12], [-4, -34], [22, -14], [6, -8]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fillStyle = 'rgba(160,210,130,.6)'; g.fill(); }
  };
  F.cheese = (g, s) => {
    P(g, s, '#F2C24B', (h) => A.cut(h, [[-48, 30], [48, 30], [48, -8], [-36, -32]], 7, 0.8, 4), { box: box(50) });
    for (const [x, y, r] of [[-18, 6, 9], [14, 12, 7], [26, -4, 5], [-2, -12, 5]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#D9A435'; g.fill(); }
  };
  F.donut = (g, s) => {
    const ring = (h, ro, wob, seed) => { A.blob(h, 0, 0, ro, ro * 0.96, wob, seed, 12); h.moveTo(13, 0); h.arc(0, 0, 13, 0, Math.PI * 2, true); };
    g.beginPath(); ring(g, 47, 0.02, 2); g.save(); g.shadowColor = 'rgba(46,40,70,.2)'; g.shadowBlur = 9 * s; g.shadowOffsetY = 5 * s; g.fillStyle = '#D9A066'; g.fill('evenodd'); g.restore();
    g.beginPath(); ring(g, 38, 0.09, 5); g.fillStyle = '#EE8FA8'; g.fill('evenodd');
    const r = A.rng(9); const cols = ['#FBF6EC', '#F2B33D', '#5B8FC7', '#6FA65F'];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283 + r() * 0.3, d = 20 + r() * 12; g.save(); g.translate(Math.cos(a) * d, Math.sin(a) * d); g.rotate(r() * 3); g.fillStyle = cols[i % 4]; g.fillRect(-4, -1.5, 8, 3); g.restore(); }
  };
  F.watermelon = (g, s) => {
    g.save(); g.rotate(-0.2);
    P(g, s, '#4F8752', (h) => { h.moveTo(-52, -14); h.arc(0, -14, 52, Math.PI, 0, true); h.closePath(); }, { box: box(52) });
    g.beginPath(); g.moveTo(-45, -14); g.arc(0, -14, 45, Math.PI, 0, true); g.closePath(); g.fillStyle = '#F3F0DC'; g.fill();
    g.beginPath(); g.moveTo(-40, -14); g.arc(0, -14, 40, Math.PI, 0, true); g.closePath(); g.fillStyle = '#E4525A'; g.fill();
    for (const [x, y] of [[-20, -2], [0, 8], [20, -2], [-8, -6], [10, -8]]) { g.beginPath(); g.ellipse(x, y, 2.6, 4.5, 0, 0, 7); g.fillStyle = '#3A2A2A'; g.fill(); }
    g.restore();
  };
  /* silly things */
  F.shoe = (g, s) => {
    P(g, s, '#FBF6EC', (h) => A.rect(h, -52, 16, 104, 16, 8, 2), { box: box(50) });
    P(g, s, '#E8664A', (h) => A.smooth(h, [[-50, 18], [-50, -24], [-34, -34], [-16, -22], [4, -4], [34, 0], [52, 12], [50, 20]]), { box: box(50) });
    A.line(g, '#FBF6EC', 4, (h) => { for (const x of [-14, -2, 10]) { h.moveTo(x - 6, -14 + (x + 14) * 0.6); h.lineTo(x + 6, -4 + (x + 14) * 0.5); } });
  };
  F.sock = (g, s) => {
    P(g, s, '#2F8F8A', (h) => A.smooth(h, [[-20, -48], [14, -48], [16, 4], [44, 22], [44, 40], [20, 48], [-14, 40], [-22, 16]]), { box: box(50) });
    g.save(); g.beginPath(); A.smooth(g, [[-20, -48], [14, -48], [16, 4], [44, 22], [44, 40], [20, 48], [-14, 40], [-22, 16]]); g.clip();
    g.fillStyle = '#FBF6EC'; g.fillRect(-30, -52, 60, 16); g.fillStyle = '#F2B33D'; g.fillRect(-30, -26, 60, 8); g.fillRect(-30, -10, 60, 8); g.restore();
  };
  F.hat = (g, s) => {
    P(g, s, '#3E3A52', (h) => h.ellipse(0, 28, 54, 13, 0, 0, 7), { box: box(52) });
    P(g, s, '#3E3A52', (h) => A.cut(h, [[-32, 28], [-30, -40], [30, -40], [32, 28]], 6, 0.8, 2), { box: box(50) });
    g.fillStyle = '#E8664A'; g.beginPath(); A.rect(g, -32, 8, 64, 14, 2, 5, 0); g.fill();
  };
  F.ball = (g, s) => {
    P(g, s, '#FBF6EC', (h) => h.arc(0, 0, 46, 0, 7), { box: box(46) });
    g.save(); g.beginPath(); g.arc(0, 0, 46, 0, 7); g.clip();
    const cols = ['#E8664A', '#5B8FC7', '#F2B33D'];
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, -46); g.quadraticCurveTo(-70 + i * 46, 0, 0, 46); g.quadraticCurveTo(-46 + i * 46, 0, 0, -46); g.fillStyle = cols[i]; g.fill(); }
    g.restore(); shine(g, -18, -20, 8, 13);
  };
  F.sponge = (g, s) => {
    P(g, s, '#F2D060', (h) => A.rect(h, -48, -30, 96, 60, 14, 3, 1.5), { box: box(50) });
    for (const [x, y, r] of [[-26, -10, 7], [-4, 8, 5], [18, -12, 8], [30, 12, 5], [-30, 14, 4], [2, -16, 4]]) { g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, 7); g.fillStyle = '#D9B345'; g.fill(); }
  };
  F.book = (g, s) => {
    g.save(); g.rotate(-0.12);
    P(g, s, '#5B8FC7', (h) => A.rect(h, -40, -50, 80, 100, 6, 2), { box: box(50) });
    P(g, s, '#FBF6EC', (h) => A.rect(h, 28, -44, 9, 88, 2, 3, 0.3), { shadow: 0 });
    P(g, s, '#F2B33D', (h) => h.arc(-8, -8, 16, 0, 7), { shadow: 0 });
    g.restore();
  };

  Kt.FOODS = [
    { name: 'banana', a: 'a banana', many: 'bananas', color: 'yellow', juice: '#F3D66B' },
    { name: 'apple', a: 'an apple', many: 'apples', color: 'red', juice: '#E26A5A' },
    { name: 'strawberry', a: 'a strawberry', many: 'strawberries', color: 'red', juice: '#E8566A' },
    { name: 'orange', a: 'an orange', many: 'oranges', color: 'orange', juice: '#F2A04A' },
    { name: 'carrot', a: 'a carrot', many: 'carrots', color: 'orange', juice: '#EE9448' },
    { name: 'cookie', a: 'a cookie', many: 'cookies', color: 'brown', juice: '#C9A070' },
    { name: 'pear', a: 'a pear', many: 'pears', color: 'green', juice: '#C3D36E' },
    { name: 'lemon', a: 'a lemon', many: 'lemons', color: 'yellow', juice: '#F4E06A' },
    { name: 'tomato', a: 'a tomato', many: 'tomatoes', color: 'red', juice: '#E4604C' },
    { name: 'cucumber', a: 'a cucumber', many: 'cucumbers', color: 'green', juice: '#8CC27A' },
    { name: 'eggplant', a: 'an eggplant', many: 'eggplants', color: 'purple', juice: '#8A68A8' },
    { name: 'donut', a: 'a donut', many: 'donuts', juice: '#EE9FB4' },
    { name: 'watermelon', a: 'a watermelon', many: 'watermelons', juice: '#EC6A72' },
    { name: 'grapes', a: 'some grapes', color: 'purple', juice: '#8E6DB6' },
    { name: 'broccoli', a: 'some broccoli', color: 'green', juice: '#6FA860' },
    { name: 'cheese', a: 'some cheese', color: 'yellow', juice: '#F2CE6A' },
  ];
  Kt.SILLY = [
    { name: 'shoe', a: 'a shoe', silly: 1 }, { name: 'sock', a: 'a sock', silly: 1 }, { name: 'hat', a: 'a hat', silly: 1 },
    { name: 'ball', a: 'a ball', silly: 1 }, { name: 'sponge', a: 'a sponge', silly: 1 }, { name: 'book', a: 'a book', silly: 1 },
  ];
  Kt.COLORS = { red: '#DE4E46', yellow: '#F2CF4A', orange: '#F0923B', green: '#5E9E57', purple: '#7B5AA6', brown: '#B07A4E' };
  Kt.sprite = (name) => A.sprite('food-' + name, [-62, -62, 124, 124], F[name]);

  /* ---------------- the room ---------------- */
  /** Wall, window and shelf. cy = y of the counter top. */
  Kt.wall = function (g, s, W, H, cy) {
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#F1E2C8', { shadow: 0, box: { x: 0, y: 0, w: 0, h: H }, light: 0.03, grain: 0.3 });
    // soft wallpaper stripes
    for (let x = 30; x < W; x += 92) { g.fillStyle = 'rgba(214,170,120,.10)'; g.fillRect(x, 0, 40, cy - 190); }
    // tiled splashback
    const ty = cy - 190;
    g.beginPath(); g.rect(0, ty, W, 190); A.paper(g, s, '#DDE9E4', { shadow: 0, grain: 0.2, light: 0 });
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.beginPath();
    for (let y = ty; y <= cy; y += 63.3) { g.moveTo(0, y); g.lineTo(W, y); }
    for (let row = 0; row < 3; row++) for (let x = (row % 2) * 48; x < W; x += 96) { g.moveTo(x, ty + row * 63.3); g.lineTo(x, ty + (row + 1) * 63.3); }
    g.stroke();
    P(g, s, '#C99666', (h) => A.rect(h, -10, ty - 12, W + 20, 16, 3, 3, 0.5), { shadow: 0.5 });
    // window with the valley outside
    const wx = Math.max(150, W * 0.13), wy = 150, ww = Math.min(330, W * 0.42), wh = Math.min(300, ty - 230);
    if (wh > 150) {
      P(g, s, '#FBF6EC', (h) => A.rect(h, wx - 14, wy - 14, ww + 28, wh + 28, 10, 5), { shadow: 0.8 });
      g.save(); g.beginPath(); A.rect(g, wx, wy, ww, wh, 4, 6, 0.4); g.clip();
      const sk = g.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, '#A9D3DD'); sk.addColorStop(1, '#F3E9D6'); g.fillStyle = sk; g.fillRect(wx, wy, ww, wh);
      g.beginPath(); g.arc(wx + ww * 0.74, wy + wh * 0.3, 30, 0, 7); g.fillStyle = '#F6C453'; g.fill();
      g.beginPath(); g.moveTo(wx, wy + wh * 0.72); g.quadraticCurveTo(wx + ww * 0.3, wy + wh * 0.45, wx + ww * 0.6, wy + wh * 0.7); g.quadraticCurveTo(wx + ww * 0.85, wy + wh * 0.85, wx + ww, wy + wh * 0.6); g.lineTo(wx + ww, wy + wh); g.lineTo(wx, wy + wh); g.fillStyle = '#A9C9B4'; g.fill();
      g.beginPath(); g.moveTo(wx, wy + wh * 0.9); g.quadraticCurveTo(wx + ww * 0.5, wy + wh * 0.66, wx + ww, wy + wh * 0.88); g.lineTo(wx + ww, wy + wh); g.lineTo(wx, wy + wh); g.fillStyle = '#7FB08A'; g.fill();
      g.restore();
      A.line(g, '#FBF6EC', 9, (h) => { h.moveTo(wx + ww / 2, wy); h.lineTo(wx + ww / 2, wy + wh); h.moveTo(wx, wy + wh / 2); h.lineTo(wx + ww, wy + wh / 2); });
      // curtains
      for (const side of [0, 1]) { const x0 = side ? wx + ww + 18 : wx - 18, k = side ? -1 : 1; P(g, s, '#E8876F', (h) => { h.moveTo(x0, wy - 26); h.lineTo(x0 + k * 74, wy - 26); h.quadraticCurveTo(x0 + k * 66, wy + wh * 0.5, x0 + k * 26, wy + wh * 0.72); h.lineTo(x0, wy + wh * 0.8); h.closePath(); }, { shadow: 0.7, box: { x: wx, y: wy, w: ww, h: wh } }); }
      P(g, s, '#C08A5A', (h) => A.rect(h, wx - 40, wy - 40, ww + 80, 14, 7, 8), { shadow: 0.5 });
    }
    // jars and a plant along the ledge
    const lx = W >= 1000 ? W * 0.44 : W - 250, ly = ty - 12;
    const jar = (x, w, h, col, lid) => { P(g, s, col, (p) => A.rect(p, x, ly - h, w, h, 10, x), { shadow: 0.6, box: { x, y: ly - h, w, h } }); P(g, s, lid, (p) => A.rect(p, x + 4, ly - h - 12, w - 8, 14, 5, x + 1), { shadow: 0.4 }); };
    if (W >= 1000) { jar(lx - 230, 58, 80, '#E9B9A6', '#C08A5A'); jar(lx - 160, 50, 58, '#B9D4CE', '#5E8F8C'); }
    P(g, s, '#C9785A', (h) => A.cut(h, [[lx + 76, ly - 44], [lx + 130, ly - 44], [lx + 122, ly], [lx + 84, ly]], 5, 0.5, 4), { shadow: 0.6 });
    for (const [a, l] of [[-2.2, 44], [-1.6, 56], [-1.0, 46], [-2.7, 34], [-0.5, 34]]) leafAt(g, s, lx + 103, ly - 44, a, l, '#5E9E57');
  };
  /** Counter: worktop and cupboards. Drawn in front of the monster. */
  Kt.counter = function (g, s, W, H, cy) {
    P(g, s, '#5E8F8C', (h) => h.rect(-20, cy + 50, W + 40, H - cy), { shadow: 0, box: { x: 0, y: cy + 50, w: 0, h: H - cy - 50 }, light: 0.05 });
    const n = Math.max(2, Math.round(W / 300)), dw = W / n;
    for (let i = 0; i < n; i++) {
      const x = i * dw + 16;
      A.line(g, 'rgba(40,70,68,.35)', 3, (h) => A.rect(h, x, cy + 76, dw - 32, H - cy - 100, 10, i + 3, 0.5));
      P(g, s, '#F2B33D', (h) => h.arc(x + dw - 70, cy + 110, 9, 0, 7), { shadow: 0.5 });
    }
    P(g, s, '#D9A878', (h) => A.rect(h, -20, cy, W + 40, 40, 4, 2, 0.6), { shadow: 0, box: { x: 0, y: cy, w: 0, h: 40 }, light: 0.07 });
    P(g, s, '#B98558', (h) => A.rect(h, -20, cy + 38, W + 40, 16, 4, 3, 0.6), { shadow: 0.8 });
    A.line(g, 'rgba(255,255,255,.3)', 3, (h) => { h.moveTo(0, cy + 4); h.lineTo(W, cy + 4); });
  };
  /** Blender base (the jar and what is in it are drawn live). Origin: centre of the base bottom. */
  Kt.blenderBase = function (g, s) {
    P(g, s, '#2F8F8A', (h) => A.cut(h, [[-70, 0], [-56, -78], [56, -78], [70, 0]], [10, 14, 14, 10], 0.8, 3), { box: { x: -70, y: -78, w: 140, h: 78 }, depth: 1.1 });
    P(g, s, '#277B77', (h) => A.rect(h, -62, -92, 124, 18, 8, 4), { shadow: 0.4 });
    A.line(g, 'rgba(255,255,255,.3)', 3, (h) => { h.moveTo(-50, -70); h.lineTo(-58, -14); });
  };
  /** Jar outline as a path (in blender coordinates). */
  Kt.jarPath = (h) => { h.moveTo(-48, -92); h.lineTo(-64, -290); h.quadraticCurveTo(-64, -298, -56, -298); h.lineTo(56, -298); h.quadraticCurveTo(64, -298, 64, -290); h.lineTo(48, -92); h.closePath(); };
  Kt.bell = function (g, s) {
    P(g, s, '#3E3A52', (h) => A.rect(h, -52, -14, 104, 14, 7, 2), { shadow: 0.8 });
    P(g, s, '#F2B33D', (h) => { h.moveTo(-44, -14); h.quadraticCurveTo(-44, -70, 0, -72); h.quadraticCurveTo(44, -70, 44, -14); h.closePath(); }, { box: { x: -44, y: -72, w: 88, h: 58 }, light: 0.1 });
    shine(g, -18, -46, 7, 14);
    P(g, s, '#3E3A52', (h) => h.arc(0, -78, 9, 0, 7), { shadow: 0.4 });
  };
  /** A plate for the order bubble. */
  Kt.plate = function (g, r, on) {
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = on ? '#FFFFFF' : '#EFE8DA'; g.fill();
    g.beginPath(); g.arc(0, 0, r * 0.7, 0, 7); g.strokeStyle = 'rgba(46,42,59,.16)'; g.lineWidth = Math.max(1.5, r * 0.06); g.stroke();
  };
})();
