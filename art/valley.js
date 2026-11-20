/* Pip's Playhouse — the art of Pip's Valley: scenery, landmarks and the toy objects that open games.
   Painters draw in units with (0,0) at the thing's base centre, y up is negative. g is already
   scaled; s is device pixels per unit (for shadows and grain). Colours go through A.c / A.ct so the
   valley re-lights at dusk and night. */
(function () {
  'use strict';
  const A = K.art;
  const V = (A.valley = {});
  const c = (n) => A.c(n), ct = (n) => A.ct(n);
  const night = () => A.mood === 'night';
  const piece = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);

  /* ---------------- scenery pieces ---------------- */
  /** Height of a rolling hill line at x (deterministic, so tiles join seamlessly). */
  V.hillY = function (x, base, amp, wl, seed) {
    const r = A.rng(seed); const p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28;
    const n = 0.55 * Math.sin((x / wl) * 6.283 + p1) + 0.3 * Math.sin((x / (wl * 0.43)) * 6.283 + p2) + 0.15 * Math.sin((x / (wl * 0.19)) * 6.283 + p3);
    return base - amp * (n + 1) / 2;
  };
  /** A hill band from x0 to x1, filled down to `bottom`, with a soft halo shadow on what is behind. */
  V.hill = function (g, s, x0, x1, base, amp, wl, seed, col, bottom) {
    const trace = (h) => { h.moveTo(x0, bottom); for (let x = x0; x <= x1 + 16; x += 16) h.lineTo(x, V.hillY(x, base, amp, wl, seed)); h.lineTo(x1 + 16, bottom); h.closePath(); };
    g.save(); g.beginPath(); trace(g); g.shadowColor = 'rgba(46,40,70,.2)'; g.shadowBlur = 16 * s; g.shadowOffsetY = -2 * s; g.fillStyle = col; g.fill(); g.restore();
    g.beginPath(); trace(g); A.paper(g, s, col, { shadow: 0, box: { x: x0, y: base - amp, w: 0, h: bottom - base + amp }, light: 0.05 });
  };
  /** Lollipop / round / tall trees. */
  V.tree = function (g, s, x, y, size, seed, kind) {
    const r = A.rng(seed);
    const lc = [c('leaf'), c('leafDark'), c('leafLight'), c('#7FA35A')][Math.floor(r() * 4)];
    piece(g, s, c('bark'), (h) => A.cut(h, [[x - size * 0.07, y], [x - size * 0.05, y - size * 0.75], [x + size * 0.05, y - size * 0.75], [x + size * 0.07, y]], 2, 0.4, seed), { shadow: 0.5 });
    if (kind === 'tall') {
      piece(g, s, lc, (h) => A.blob(h, x, y - size * 1.05, size * 0.3, size * 0.62, 0.05, seed), { box: { x: x - size * 0.3, y: y - size * 1.7, w: size * 0.6, h: size * 1.3 } });
    } else {
      const ry = kind === 'round' ? 0.5 : 0.42;
      piece(g, s, lc, (h) => A.blob(h, x, y - size * 0.95, size * 0.48, size * ry, 0.06, seed), { box: { x: x - size * 0.5, y: y - size * 1.45, w: size, h: size } });
      // a lighter top-left cap, cut separately
      g.save(); g.beginPath(); A.blob(g, x, y - size * 0.95, size * 0.48, size * ry, 0.06, seed); g.clip();
      g.beginPath(); A.blob(g, x - size * 0.16, y - size * 1.12, size * 0.34, size * 0.24, 0.08, seed + 1); g.fillStyle = A.alpha(A.shade(lc, 0.07), 0.8); g.fill(); g.restore();
    }
  };
  V.bush = function (g, s, x, y, w, seed) {
    const col = c('leafDark');
    piece(g, s, col, (h) => { A.blob(h, x - w * 0.25, y - w * 0.22, w * 0.3, w * 0.26, 0.06, seed); A.blob(h, x + w * 0.2, y - w * 0.25, w * 0.34, w * 0.3, 0.06, seed + 1); A.blob(h, x, y - w * 0.36, w * 0.28, w * 0.26, 0.06, seed + 2); }, { box: { x: x - w / 2, y: y - w * 0.6, w, h: w * 0.6 }, shadow: 0.7 });
    const r = A.rng(seed + 9);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + (r() - 0.5) * w * 0.7, y - w * (0.2 + r() * 0.3), 4, 0, 7); g.fillStyle = r() > 0.5 ? ct('#F4D7D0') : ct('#F7E3A6'); g.fill(); }
  };
  V.flower = function (g, s, x, y, size, col) {
    A.line(g, c('leafDark'), 2.5, (h) => { h.moveTo(x, y); h.quadraticCurveTo(x - 3, y - size, x, y - size * 2); });
    g.save(); g.translate(x, y - size * 2);
    for (let i = 0; i < 5; i++) { g.rotate(1.2566); g.beginPath(); g.ellipse(0, -size * 0.42, size * 0.28, size * 0.42, 0, 0, 7); g.fillStyle = col; g.fill(); }
    g.beginPath(); g.arc(0, 0, size * 0.24, 0, 7); g.fillStyle = ct('marigold'); g.fill(); g.restore();
  };
  V.tuft = function (g, s, x, y, h, seed, col) {
    const r = A.rng(seed);
    g.beginPath();
    for (let i = 0; i < 6; i++) { const bx = x + (i - 2.5) * h * 0.13, lean = (r() - 0.5) * h * 0.5, hh = h * (0.6 + r() * 0.5); g.moveTo(bx - h * 0.06, y); g.quadraticCurveTo(bx + lean * 0.3, y - hh * 0.6, bx + lean, y - hh); g.quadraticCurveTo(bx + lean * 0.2 + h * 0.02, y - hh * 0.5, bx + h * 0.07, y); }
    A.paper(g, s, col, { shadow: 0.4, light: 0 });
  };
  V.cloud = function (g, s, w, seed) {
    const r = A.rng(seed);
    piece(g, s, night() ? '#4A4F7E' : A.mood === 'dusk' ? '#F6D9C8' : '#FBF8F1', (h) => {
      const n = 4; for (let i = 0; i < n; i++) { const t = i / (n - 1); A.blob(h, -w / 2 + t * w, -w * (0.12 + Math.sin(t * Math.PI) * 0.16) - r() * w * 0.04, w * (0.2 + Math.sin(t * Math.PI) * 0.1), w * (0.14 + Math.sin(t * Math.PI) * 0.1), 0.05, seed + i); }
      A.rect(h, -w * 0.55, -w * 0.16, w * 1.1, w * 0.16, w * 0.08, seed);
    }, { shadow: 0.5, box: { x: -w / 2, y: -w * 0.4, w, h: w * 0.4 }, light: 0.04 });
  };
  /** A window pane that lights up at night. */
  function glass(g, s, trace, box) {
    if (night() || A.mood === 'dusk') {
      g.save(); g.beginPath(); trace(g); g.shadowColor = A.alpha(A.C.glow, night() ? 0.8 : 0.4); g.shadowBlur = 26 * s; g.fillStyle = night() ? A.C.glow : A.mix(A.C.glow, '#A9D2E3', 0.5); g.fill(); g.restore();
    } else {
      g.beginPath(); trace(g); A.paper(g, s, ct('#A9D2E3'), { shadow: 0, grain: 0.12, box, light: 0.08 });
      g.save(); g.beginPath(); trace(g); g.clip(); g.globalAlpha = 0.45;
      A.line(g, '#fff', box.w * 0.16, (h) => { h.moveTo(box.x + box.w * 0.15, box.y + box.h * 0.9); h.lineTo(box.x + box.w * 0.85, box.y + box.h * 0.05); }); g.restore();
    }
  }
  function windowBox(g, s, x, y, w, h, seed) {
    piece(g, s, ct('white'), (p) => A.rect(p, x - 7, y - 7, w + 14, h + 14, 6, seed), { shadow: 0.6, grain: 0.12 });
    glass(g, s, (p) => A.rect(p, x, y, w, h, 3, seed + 1, 0.5), { x, y, w, h });
    A.line(g, ct('white'), 5, (p) => { p.moveTo(x + w / 2, y); p.lineTo(x + w / 2, y + h); p.moveTo(x, y + h / 2); p.lineTo(x + w, y + h / 2); });
  }

  /* ---------------- landmarks (baked into the ground layer) ---------------- */
  V.school = function (g, s) {
    const wall = c('cream'), roof = c('tomato');
    piece(g, s, c('#A65441'), (h) => A.rect(h, -150, -372, 42, 100, 4, 11), { shadow: 0.6 });
    piece(g, s, c('#8E4638'), (h) => A.rect(h, -156, -384, 54, 16, 4, 12), { shadow: 0.4 });
    piece(g, s, wall, (h) => A.rect(h, -186, -236, 372, 236, 8, 3), { box: { x: -186, y: -236, w: 372, h: 236 } });
    g.save(); g.beginPath(); A.rect(g, -186, -236, 372, 236, 8, 3); g.clip();
    const r = A.rng(5);
    for (let y = -212; y < 0; y += 24) A.line(g, A.shade(wall, -0.07), 2.4, (h) => { h.moveTo(-190, y); h.lineTo(190, y + (r() - 0.5) * 2.5); });
    g.restore();
    // roof
    piece(g, s, roof, (h) => A.cut(h, [[-218, -220], [0, -404], [218, -220]], [10, 16, 10], 1.5, 4), { box: { x: -218, y: -404, w: 436, h: 184 }, depth: 1.3 });
    g.save(); g.beginPath(); A.cut(g, [[-218, -220], [0, -404], [218, -220]], [10, 16, 10], 1.5, 4); g.clip();
    for (let row = 0, y = -372; y < -224; y += 24, row++) { g.beginPath(); for (let x = -230 + (row % 2) * 13; x < 230; x += 26) { g.moveTo(x + 13, y); g.arc(x, y, 13, 0, Math.PI); } g.strokeStyle = A.shade(roof, -0.1); g.lineWidth = 2.4; g.stroke(); }
    g.restore();
    A.line(g, A.mix(roof, '#4A3442', 0.38), 7, (h) => { h.moveTo(-214, -222); h.lineTo(0, -400); h.lineTo(214, -222); });
    // gable window
    piece(g, s, ct('white'), (h) => h.arc(0, -292, 32, 0, 7), { shadow: 0.6, grain: 0.1 });
    glass(g, s, (h) => h.arc(0, -292, 23, 0, 7), { x: -23, y: -315, w: 46, h: 46 });
    A.line(g, ct('white'), 4, (h) => { h.moveTo(0, -315); h.lineTo(0, -269); h.moveTo(-23, -292); h.lineTo(23, -292); });
    // bell tower
    piece(g, s, wall, (h) => A.rect(h, -36, -468, 72, 76, 5, 8), { box: { x: -36, y: -468, w: 72, h: 76 } });
    piece(g, s, c('#5B4A5E'), (h) => { h.moveTo(-20, -404); h.lineTo(-20, -440); h.arc(0, -440, 20, Math.PI, 0); h.lineTo(20, -404); h.closePath(); }, { shadow: 0, grain: 0.1 });
    piece(g, s, ct('marigold'), (h) => { h.moveTo(-13, -410); h.quadraticCurveTo(-13, -444, 0, -446); h.quadraticCurveTo(13, -444, 13, -410); h.closePath(); }, { shadow: 0.3 });
    piece(g, s, roof, (h) => A.cut(h, [[-50, -462], [0, -526], [50, -462]], [6, 6, 6], 1, 9), { depth: 0.8 });
    // door + step
    piece(g, s, c('#B9AFA3'), (h) => A.rect(h, -62, -12, 124, 16, 5, 21), { shadow: 0.5 });
    piece(g, s, ct('white'), (h) => { h.moveTo(-50, -10); h.lineTo(-50, -100); h.arc(0, -100, 50, Math.PI, 0); h.lineTo(50, -10); h.closePath(); }, { shadow: 0.6, grain: 0.1 });
    piece(g, s, ct('teal'), (h) => { h.moveTo(-40, -10); h.lineTo(-40, -100); h.arc(0, -100, 40, Math.PI, 0); h.lineTo(40, -10); h.closePath(); }, { shadow: 0, box: { x: -40, y: -140, w: 80, h: 130 } });
    A.line(g, A.shade(ct('teal'), -0.08), 2.5, (h) => { h.moveTo(0, -138); h.lineTo(0, -12); });
    piece(g, s, ct('marigold'), (h) => h.arc(24, -66, 6, 0, 7), { shadow: 0.4 });
    // windows with flower boxes
    for (const wx of [-122, 122]) {
      windowBox(g, s, wx - 34, -196, 68, 84, wx > 0 ? 31 : 32);
      piece(g, s, c('#6E9C5A'), (h) => A.rect(h, wx - 46, -104, 92, 22, 4, 40 + wx), { shadow: 0.6 });
      const rr = A.rng(wx + 400);
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(wx - 36 + i * 14.5, -108 - rr() * 5, 6 + rr() * 2, 0, 7); g.fillStyle = [ct('tomato'), ct('marigold'), ct('#F4D7D0')][i % 3]; g.fill(); }
    }
  };

  const TRUNK = [[-168, 0], [-96, -28], [-70, -140], [-72, -290], [-160, -392], [-130, -414], [-44, -334], [-6, -430], [34, -432], [42, -334], [130, -424], [162, -402], [72, -290], [68, -140], [96, -28], [172, 0]];
  V.tree_ = function (g, s) {
    const back = c('#5C8C5A'), mid = c('#78A964'), front = c('#93BE73');
    // the back of the canopy, behind the trunk
    const blobs = (list, col, seed, sh) => list.forEach(([x, y, rx, ry], i) => piece(g, s, col, (h) => A.blob(h, x, y, rx, ry, 0.06, seed + i, 11), { box: { x: x - rx, y: y - ry, w: rx * 2, h: ry * 2 }, depth: sh || 1.2 }));
    blobs([[-250, -470, 170, 120], [240, -490, 170, 125], [0, -610, 230, 150], [-90, -420, 150, 90], [110, -430, 150, 95]], back, 60);
    piece(g, s, c('bark'), (h) => A.smooth(h, TRUNK), { box: { x: -170, y: -432, w: 340, h: 432 }, depth: 1.2 });
    g.save(); g.beginPath(); A.smooth(g, TRUNK); g.clip();
    g.beginPath(); g.ellipse(80, -160, 70, 260, 0.1, 0, 7); g.fillStyle = A.alpha(c('barkDark'), 0.4); g.fill();
    for (const [x0, k] of [[-46, 1], [-14, -1], [52, 1]]) A.line(g, A.alpha(c('barkDark'), 0.7), 3, (h) => { h.moveTo(x0, -20); h.bezierCurveTo(x0 + 14 * k, -110, x0 - 10 * k, -190, x0 + 6 * k, -290); });
    g.restore();
    blobs([[-150, -560, 175, 125], [150, -580, 170, 120], [-290, -420, 115, 82], [290, -430, 115, 82], [0, -500, 170, 100]], mid, 80);
    blobs([[-170, -640, 105, 70], [40, -690, 130, 72], [200, -630, 80, 56]], front, 100, 0.9);
    // leaf flecks
    const r = A.rng(77);
    for (let i = 0; i < 90; i++) { const x = (r() - 0.5) * 640, y = -380 - r() * 360; if ((x / 330) ** 2 + ((y + 540) / 190) ** 2 > 1) continue; g.save(); g.translate(x, y); g.rotate(r() * 6); g.beginPath(); g.ellipse(0, 0, 9, 4.5, 0, 0, 7); g.fillStyle = A.alpha(r() > 0.5 ? A.shade(mid, 0.08) : A.shade(back, -0.05), 0.75); g.fill(); g.restore(); }
    // hollow door
    piece(g, s, c('barkDark'), (h) => { h.moveTo(-58, -4); h.lineTo(-58, -120); h.arc(0, -120, 58, Math.PI, 0); h.lineTo(58, -4); h.closePath(); }, { shadow: 0.5 });
    piece(g, s, ct('plum'), (h) => { h.moveTo(-44, -4); h.lineTo(-44, -120); h.arc(0, -120, 44, Math.PI, 0); h.lineTo(44, -4); h.closePath(); }, { shadow: 0, box: { x: -44, y: -164, w: 88, h: 160 } });
    A.line(g, A.shade(ct('plum'), -0.08), 2.5, (h) => { for (const x of [-15, 15]) { h.moveTo(x, -8); h.lineTo(x, -150); } });
    piece(g, s, c('barkDark'), (h) => h.arc(0, -118, 18, 0, 7), { shadow: 0 });
    glass(g, s, (h) => h.arc(0, -118, 13, 0, 7), { x: -13, y: -131, w: 26, h: 26 });
    piece(g, s, ct('marigold'), (h) => h.arc(28, -62, 6, 0, 7), { shadow: 0.4 });
    piece(g, s, c('#B9AFA3'), (h) => A.cut(h, [[-70, 2], [-50, -12], [56, -12], [74, 2]], 6, 1, 3), { shadow: 0.5 });
    // lantern hook
    A.line(g, c('barkDark'), 4, (h) => { h.moveTo(70, -230); h.lineTo(104, -236); h.lineTo(104, -214); });
  };

  V.barn = function (g, s) {
    const red = c('barn'), trim = c('#F1E4CF'), roof = c('roof');
    // silo
    piece(g, s, c('#B7C3BC'), (h) => A.rect(h, 214, -330, 96, 330, 6, 12), { box: { x: 214, y: -330, w: 96, h: 330 } });
    g.save(); g.beginPath(); A.rect(g, 214, -330, 96, 330, 6, 12); g.clip(); for (let y = -300; y < 0; y += 44) A.line(g, A.shade(c('#B7C3BC'), -0.08), 3, (h) => { h.moveTo(210, y); h.lineTo(314, y); }); g.restore();
    piece(g, s, roof, (h) => { h.moveTo(206, -326); h.arc(262, -326, 56, Math.PI, 0); h.closePath(); }, { depth: 0.8 });
    const W = [[-200, 0], [-200, -222], [-148, -330], [0, -384], [148, -330], [200, -222], [200, 0]];
    piece(g, s, red, (h) => A.cut(h, W, [4, 8, 8, 12, 8, 8, 4], 1.5, 6), { box: { x: -200, y: -384, w: 400, h: 384 }, depth: 1.2 });
    g.save(); g.beginPath(); A.cut(g, W, [4, 8, 8, 12, 8, 8, 4], 1.5, 6); g.clip();
    for (let x = -180; x < 200; x += 30) A.line(g, A.shade(red, -0.07), 2.4, (h) => { h.moveTo(x, -390); h.lineTo(x + 1, 0); });
    g.restore();
    A.line(g, roof, 26, (h) => { h.moveTo(-214, -210); h.lineTo(-156, -338); h.lineTo(0, -396); h.lineTo(156, -338); h.lineTo(214, -210); });
    A.line(g, A.shade(roof, 0.08), 4, (h) => { h.moveTo(-205, -222); h.lineTo(-150, -345); h.lineTo(0, -403); h.lineTo(150, -345); h.lineTo(205, -222); });
    // hayloft
    piece(g, s, c('#4A2E2E'), (h) => A.rect(h, -44, -322, 88, 74, 4, 15), { shadow: 0.3 });
    A.line(g, trim, 8, (h) => A.rect(h, -44, -322, 88, 74, 4, 15));
    const r = A.rng(8);
    A.line(g, c('#E8B84A'), 3, (h) => { for (let i = 0; i < 16; i++) { const x = -38 + i * 5; h.moveTo(x, -252); h.lineTo(x + (r() - 0.5) * 16, -268 - r() * 12); } });
    // doors
    piece(g, s, A.shade(red, -0.05), (h) => A.rect(h, -96, -206, 192, 206, 4, 17), { shadow: 0.4 });
    A.line(g, trim, 10, (h) => { A.rect(h, -96, -206, 192, 206, 4, 17); h.moveTo(0, -206); h.lineTo(0, 0); h.moveTo(-96, -206); h.lineTo(0, 0); h.lineTo(96, -206); h.moveTo(-96, 0); h.lineTo(0, -206); h.lineTo(96, 0); });
    // small windows either side
    for (const wx of [-150, 150]) windowBox(g, s, wx - 22, -170, 44, 50, wx + 90);
  };

  V.pond = function (g, s) {
    const w = 270, h = 62;
    piece(g, s, c('#6E9C5A'), (p) => A.blob(p, 0, 0, w + 18, h + 14, 0.03, 4, 14), { shadow: 0.4, light: 0 });
    g.beginPath(); A.blob(g, 0, 0, w, h, 0.03, 5, 14);
    const gr = g.createLinearGradient(0, -h, 0, h); gr.addColorStop(0, A.shade(c('water'), -0.06)); gr.addColorStop(1, A.shade(c('water'), 0.06));
    g.fillStyle = gr; g.fill();
    // reflection of the sky
    g.save(); g.beginPath(); A.blob(g, 0, 0, w, h, 0.03, 5, 14); g.clip();
    g.beginPath(); g.ellipse(-60, -10, 160, 18, 0, 0, 7); g.fillStyle = A.alpha('#FFFFFF', night() ? 0.08 : 0.22); g.fill(); g.restore();
    // lily pads
    for (const [x, y, r0] of [[-170, 10, 22], [-130, 26, 15], [150, -14, 20]]) { piece(g, s, c('#6FA65F'), (p) => { p.moveTo(x, y); p.arc(x, y, r0, 0.4, Math.PI * 2 - 0.1); p.closePath(); }, { shadow: 0.4, light: 0.05 }); }
    V.flower(g, s, -128, 22, 0, c('#F4D7D0'));
    // reeds
    for (const [x, k] of [[w - 10, 1], [w + 8, 1], [-w + 4, -1]]) {
      A.line(g, c('leafDark'), 4, (p) => { p.moveTo(x, 10); p.quadraticCurveTo(x + k * 6, -50, x + k * 4, -96); });
      piece(g, s, c('#8A5A3C'), (p) => A.rect(p, x + k * 4 - 5, -96, 10, 28, 5, x), { shadow: 0.3 });
    }
    // dock
    piece(g, s, c('wood'), (p) => A.rect(p, -40 - w * 0.55, -24, 110, 18, 3, 9), { shadow: 0.8 });
    for (const x of [-34 - w * 0.55, 54 - w * 0.55]) piece(g, s, A.shade(c('wood'), -0.12), (p) => A.rect(p, x, -14, 9, 28, 2, x), { shadow: 0.3 });
  };

  /* ---------------- toy objects (separate nodes; tappable) ---------------- */
  V.toys = {};
  V.toys.blocks = function (g, s) {
    const block = (x, y, w, h, col, seed) => {
      piece(g, s, col, (p) => A.rect(p, x, y, w, h, 7, seed, 0.8), { box: { x, y, w, h }, light: 0.08 });
      A.line(g, A.alpha('#FFFFFF', 0.35), 3, (p) => { p.moveTo(x + 8, y + 5); p.lineTo(x + w - 8, y + 5); });
      A.line(g, A.alpha(A.shade(col, -0.15), 0.8), 2.5, (p) => A.rect(p, x + 9, y + 10, w - 18, h - 18, 5, seed + 1, 0.4));
    };
    block(-92, -62, 184, 62, ct('teal'), 1);
    block(-82, -128, 64, 64, ct('marigold'), 2);
    block(14, -128, 64, 64, ct('tomato'), 3);
    block(-52, -196, 104, 66, ct('blue'), 4);
    piece(g, s, ct('plum'), (p) => A.cut(p, [[-50, -198], [0, -262], [50, -198]], [6, 8, 6], 0.8, 5), { box: { x: -50, y: -262, w: 100, h: 64 } });
    // cut-out star on the red cube
    g.save(); g.translate(46, -96); g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 - 1.5708, rr = i % 2 ? 7 : 16; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fillStyle = A.shade(ct('tomato'), 0.12); g.fill(); g.restore();
    g.beginPath(); g.arc(-50, -96, 13, 0, 7); g.fillStyle = A.shade(ct('marigold'), 0.1); g.fill();
  };
  V.toys.chalkboard = function (g, s) {
    const wood = ct('wood');
    A.line(g, A.shade(wood, -0.1), 10, (p) => { p.moveTo(-4, -196); p.lineTo(18, 0); });
    A.line(g, wood, 11, (p) => { p.moveTo(-60, -200); p.lineTo(-86, 0); p.moveTo(60, -200); p.lineTo(86, 0); });
    piece(g, s, wood, (p) => A.rect(p, -96, -236, 192, 150, 8, 2), { box: { x: -96, y: -236, w: 192, h: 150 } });
    piece(g, s, ct('slate'), (p) => A.rect(p, -84, -224, 168, 126, 4, 3), { shadow: 0, grain: 0.35, light: 0.03, box: { x: -84, y: -224, w: 168, h: 126 } });
    g.save(); g.beginPath(); A.rect(g, -84, -224, 168, 126, 4, 3); g.clip();
    g.globalAlpha = 0.12; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-20, -170, 70, 30, -0.3, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = A.alpha('#EEEBE2', 0.92); g.font = `700 64px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.save(); g.translate(-26, -130); g.rotate(-0.06); g.fillText('b', 0, 0); g.restore();
    g.save(); g.translate(34, -128); g.rotate(0.05); g.fillText('c', 0, 0); g.restore();
    A.line(g, A.alpha('#EEEBE2', 0.7), 3, (p) => { p.moveTo(-62, -110); p.bezierCurveTo(-30, -118, 10, -104, 60, -114); });
    g.restore();
    piece(g, s, A.shade(wood, -0.05), (p) => A.rect(p, -92, -92, 184, 10, 3, 5), { shadow: 0.5 });
    for (const [x, col] of [[-50, '#F6F1E6'], [-30, ct('#F2C3B8')], [40, ct('#BFE0E6')]]) piece(g, s, col, (p) => A.rect(p, x, -98, 18, 7, 3, x), { shadow: 0.3, grain: 0 });
  };
  /** The letter-monster: a fat marigold "a" with feet. Eyes are drawn live on top. */
  V.toys.letterA = function (g, s) {
    for (const fx of [-22, 22]) { g.beginPath(); g.ellipse(fx, -6, 16, 8, 0, 0, 7); g.fillStyle = A.shade(ct('marigold'), -0.15); g.fill(); }
    g.font = `700 170px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.save(); g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = 9 * s; g.shadowOffsetX = 2.5 * s; g.shadowOffsetY = 5 * s; g.fillStyle = ct('marigold'); g.fillText('a', 0, -4); g.restore();
    g.save(); g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(-50, -120, 40, 0); gr.addColorStop(0, A.alpha('#FFF3C9', 0.4)); gr.addColorStop(1, A.alpha('#B8742A', 0.25)); g.fillStyle = gr; g.fillRect(-80, -140, 160, 140);
    g.restore();
  };
  V.toys.books = function (g, s) {
    const book = (x, y, w, h, col, seed) => {
      piece(g, s, col, (p) => A.rect(p, x, y, w, h, 6, seed, 0.6), { box: { x, y, w, h } });
      piece(g, s, ct('#F6EFE3'), (p) => A.rect(p, x + w - 14, y + 5, 12, h - 10, 2, seed + 1, 0.3), { shadow: 0, grain: 0.1 });
      A.line(g, A.shade(ct('#F6EFE3'), -0.1), 1.5, (p) => { for (let i = 1; i < 4; i++) { const yy = y + 5 + (i * (h - 10)) / 4; p.moveTo(x + w - 13, yy); p.lineTo(x + w - 3, yy); } });
      A.line(g, A.alpha(A.shade(col, 0.14), 0.9), 3, (p) => { p.moveTo(x + 14, y + h * 0.35); p.lineTo(x + w * 0.55, y + h * 0.35); });
    };
    book(-96, -44, 186, 44, ct('teal'), 1);
    book(-80, -86, 160, 42, ct('tomato'), 2);
    book(-88, -122, 150, 36, ct('marigold'), 3);
    // open book on top
    g.save(); g.translate(-10, -126);
    piece(g, s, ct('plum'), (p) => A.cut(p, [[-86, 0], [-80, -14], [0, -4], [80, -14], [86, 0], [0, 8]], 4, 0.5, 4), { shadow: 0.7 });
    piece(g, s, ct('#FBF6EC'), (p) => { p.moveTo(-78, -6); p.quadraticCurveTo(-40, -30, 0, -10); p.lineTo(0, 0); p.quadraticCurveTo(-40, -18, -78, 2); p.closePath(); p.moveTo(78, -6); p.quadraticCurveTo(40, -30, 0, -10); p.lineTo(0, 0); p.quadraticCurveTo(40, -18, 78, 2); p.closePath(); }, { shadow: 0, grain: 0.1 });
    A.line(g, A.alpha(A.C.ink, 0.25), 2, (p) => { for (const k of [-1, 1]) for (let i = 0; i < 3; i++) { p.moveTo(k * 66, -6 - i * 4); p.quadraticCurveTo(k * 40, -20 - i * 3, k * 12, -9 - i * 2); } });
    g.restore();
    piece(g, s, ct('tomato'), (p) => A.cut(p, [[30, -30], [38, -30], [38, 6], [34, 0], [30, 6]], 1, 0, 6), { shadow: 0.3, grain: 0 });
  };
  /** Kitchen stall in two layers so the monster can stand between them. */
  V.toys.stallBack = function (g, s) {
    const wood = ct('wood');
    for (const x of [-124, 114]) piece(g, s, wood, (p) => A.rect(p, x, -300, 10, 190, 3, x), { shadow: 0.5 });
    // awning
    const top = -318, h = 44;
    for (let i = 0; i < 9; i++) {
      const x = -144 + i * 32;
      piece(g, s, i % 2 ? ct('#FBF6EC') : ct('teal'), (p) => { p.moveTo(x, top); p.lineTo(x + 32, top); p.lineTo(x + 32, top + h); p.arc(x + 16, top + h, 16, 0, Math.PI); p.closePath(); }, { shadow: 0.6, box: { x, y: top, w: 32, h: h + 16 } });
    }
    piece(g, s, A.shade(ct('teal'), -0.08), (p) => A.rect(p, -150, top - 16, 300, 20, 6, 3), { shadow: 0.6 });
  };
  V.toys.stallFront = function (g, s) {
    const wood = ct('wood');
    piece(g, s, ct('#FBF6EC'), (p) => A.rect(p, -126, -118, 252, 118, 6, 7), { box: { x: -126, y: -118, w: 252, h: 118 } });
    g.save(); g.beginPath(); A.rect(g, -126, -118, 252, 118, 6, 7); g.clip();
    for (let x = -126 + 18; x < 126; x += 56) { g.fillStyle = A.alpha(ct('tomato'), 0.85); g.fillRect(x, -118, 26, 118); }
    g.restore();
    piece(g, s, wood, (p) => A.rect(p, -138, -132, 276, 18, 5, 9), { shadow: 0.6, box: { x: -138, y: -132, w: 276, h: 18 } });
    // pot
    piece(g, s, ct('#46606A'), (p) => { p.moveTo(30, -130); p.lineTo(34, -176); p.lineTo(106, -176); p.lineTo(110, -130); p.quadraticCurveTo(70, -122, 30, -130); }, { shadow: 0.6, box: { x: 30, y: -176, w: 80, h: 50 } });
    piece(g, s, A.shade(ct('#46606A'), 0.06), (p) => A.rect(p, 26, -186, 88, 12, 6, 4), { shadow: 0.4 });
    for (const x of [22, 112]) A.line(g, ct('#46606A'), 6, (p) => { p.arc(x, -160, 8, Math.PI * 0.5, Math.PI * 1.5, x > 50); });
    // a bowl of apples
    piece(g, s, ct('#F2B33D'), (p) => { p.moveTo(-110, -146); p.quadraticCurveTo(-74, -112, -38, -146); p.closePath(); }, { shadow: 0.5 });
    for (const [x, y] of [[-96, -152], [-74, -158], [-54, -150]]) { piece(g, s, ct('tomato'), (p) => p.arc(x, y, 12, 0, 7), { shadow: 0.3 }); A.line(g, c('barkDark'), 2.5, (p) => { p.moveTo(x, y - 11); p.lineTo(x + 2, y - 17); }); }
  };
  V.toys.car = function (g, s) {
    const body = ct('tomato');
    // signpost
    A.line(g, ct('wood'), 8, (p) => { p.moveTo(150, 0); p.lineTo(150, -170); });
    piece(g, s, ct('blue'), (p) => A.cut(p, [[108, -196], [178, -196], [198, -172], [178, -148], [108, -148]], 6, 0.8, 3), { shadow: 0.7 });
    A.line(g, ct('#FBF6EC'), 5, (p) => { p.moveTo(122, -172); p.lineTo(170, -172); p.moveTo(156, -184); p.lineTo(170, -172); p.lineTo(156, -160); });
    // car
    piece(g, s, ct('#FBF6EC'), (p) => A.cut(p, [[-62, -76], [-40, -128], [40, -128], [66, -76]], [6, 14, 14, 6], 0.8, 4), { box: { x: -62, y: -128, w: 128, h: 52 } });
    for (const [x0, x1] of [[-50, -6], [4, 54]]) glass(g, s, (p) => A.cut(p, [[x0, -80], [x0 + (x0 < 0 ? 16 : 0), -118], [x1 - (x1 > 0 ? 16 : 0), -118], [x1, -80]], 5, 0.5, x0), { x: x0, y: -118, w: x1 - x0, h: 38 });
    piece(g, s, body, (p) => A.rect(p, -104, -84, 212, 58, [16, 24, 18, 14], 5), { box: { x: -104, y: -84, w: 212, h: 58 }, depth: 1.1 });
    A.line(g, A.alpha('#FFFFFF', 0.35), 4, (p) => { p.moveTo(-88, -76); p.lineTo(80, -76); });
    piece(g, s, ct('marigold'), (p) => A.blob(p, 98, -60, 8, 10, 0.02, 2), { shadow: 0, grain: 0 });
    for (const x of [-60, 62]) {
      piece(g, s, c('ink'), (p) => p.arc(x, -24, 25, 0, 7), { shadow: 0.7 });
      piece(g, s, ct('#C9C3BA'), (p) => p.arc(x, -24, 11, 0, 7), { shadow: 0, grain: 0.1 });
    }
  };
  V.toys.easel = function (g, s) {
    const wood = ct('wood');
    A.line(g, A.shade(wood, -0.1), 10, (p) => { p.moveTo(0, -250); p.lineTo(0, 0); });
    A.line(g, wood, 11, (p) => { p.moveTo(-14, -262); p.lineTo(-74, 0); p.moveTo(14, -262); p.lineTo(74, 0); });
    piece(g, s, wood, (p) => A.rect(p, -92, -104, 184, 12, 3, 4), { shadow: 0.5 });
    const x = -84, y = -246, w = 168, h = 142;
    piece(g, s, ct('#FBF8F1'), (p) => A.rect(p, x, y, w, h, 3, 6), { box: { x, y, w, h }, light: 0.04, depth: 1.1 });
    g.save(); g.beginPath(); A.rect(g, x + 8, y + 8, w - 16, h - 16, 2, 7); g.clip();
    g.globalAlpha = 0.9;
    g.fillStyle = ct('#BFDCE8'); g.fillRect(x, y, w, h);
    g.beginPath(); A.blob(g, 36, -214, 22, 22, 0.08, 3); g.fillStyle = ct('marigold'); g.fill();
    g.beginPath(); g.moveTo(x, -150); g.quadraticCurveTo(-30, -196, 20, -160); g.quadraticCurveTo(60, -136, x + w, -168); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath(); g.fillStyle = ct('#7DB65F'); g.fill();
    A.line(g, ct('leafDark'), 4, (p) => { p.moveTo(-36, -112); p.lineTo(-36, -150); });
    g.beginPath(); A.blob(g, -36, -156, 13, 13, 0.12, 9); g.fillStyle = ct('tomato'); g.fill();
    g.beginPath(); g.arc(-36, -156, 5, 0, 7); g.fillStyle = ct('marigold'); g.fill();
    g.restore();
    // paint pots on the ground
    for (const [px, col] of [[-128, ct('tomato')], [-90, ct('blue')], [112, ct('marigold')]]) {
      piece(g, s, ct('#E9E2D6'), (p) => A.rect(p, px - 17, -34, 34, 34, 5, px), { shadow: 0.6 });
      piece(g, s, col, (p) => { p.ellipse(px, -34, 17, 6, 0, 0, 7); }, { shadow: 0, grain: 0.1 });
      piece(g, s, col, (p) => A.blob(p, px + 8, -20, 4, 8, 0.1, px), { shadow: 0, grain: 0 });
    }
    // brush
    g.save(); g.translate(-64, -12); g.rotate(-0.3);
    piece(g, s, ct('wood'), (p) => A.rect(p, 0, -4, 60, 7, 3, 1), { shadow: 0.4 }); piece(g, s, ct('teal'), (p) => A.blob(p, 66, 0, 10, 5, 0.05, 2), { shadow: 0.3 });
    g.restore();
  };
  V.toys.band = function (g, s) {
    const wood = ct('wood');
    // xylophone
    A.line(g, A.shade(wood, -0.1), 8, (p) => { p.moveTo(-100, -70); p.lineTo(-110, 0); p.moveTo(70, -60); p.lineTo(80, 0); });
    piece(g, s, wood, (p) => A.cut(p, [[-122, -92], [92, -76], [92, -62], [-122, -70]], 4, 0.6, 2), { shadow: 0.7 });
    const bars = [ct('tomato'), ct('#F08A45'), ct('marigold'), ct('#7DB65F'), ct('teal'), ct('blue'), ct('plum')];
    bars.forEach((col, i) => { const x = -114 + i * 29, hh = 104 - i * 9; piece(g, s, col, (p) => A.rect(p, x, -88 - hh * 0.5 + i * 2, 23, hh, 6, i + 10, 0.4), { box: { x, y: -140, w: 23, h: hh }, light: 0.09 }); g.beginPath(); g.arc(x + 11.5, -88 - hh * 0.5 + i * 2 + 10, 3, 0, 7); g.fillStyle = A.alpha('#FFFFFF', 0.6); g.fill(); });
    // mallets
    // two mallets resting across the bars
    for (const [x, y, a] of [[-70, -128, -0.25], [-20, -116, -0.1]]) { g.save(); g.translate(x, y); g.rotate(a); A.line(g, A.shade(wood, -0.05), 5, (p) => { p.moveTo(0, 0); p.lineTo(64, 0); }); piece(g, s, ct('#FBF6EC'), (p) => p.arc(70, 0, 10, 0, 7), { shadow: 0.5 }); g.restore(); }
    // drum
    g.save(); g.translate(150, 0);
    piece(g, s, ct('tomato'), (p) => { p.moveTo(-56, -110); p.lineTo(-56, -14); p.ellipse(0, -14, 56, 14, 0, Math.PI, 0, true); p.lineTo(56, -110); p.closePath(); }, { box: { x: -56, y: -124, w: 112, h: 124 } });
    A.line(g, ct('#FBF6EC'), 3, (p) => { for (let i = 0; i < 5; i++) { const x0 = -56 + i * 28; p.moveTo(x0, -100); p.lineTo(x0 + 14, -26); p.lineTo(x0 + 28, -100); } });
    for (const y of [-108, -18]) A.line(g, ct('#FBF6EC'), 8, (p) => p.ellipse(0, y, 56, 14, 0, y < -50 ? Math.PI : 0, y < -50 ? Math.PI * 2 : Math.PI));
    piece(g, s, ct('#FBF1DF'), (p) => p.ellipse(0, -110, 52, 12, 0, 0, 7), { shadow: 0, grain: 0.12 });
    g.restore();
  };
  /** A tiny house shape for the far hills. */
  V.farmhouse = function (g, s, x, y, k) {
    piece(g, s, c('#E9D8C0'), (p) => A.rect(p, x - 30 * k, y - 36 * k, 60 * k, 36 * k, 3, 5), { shadow: 0.4 });
    piece(g, s, c('#C66B55'), (p) => A.cut(p, [[x - 38 * k, y - 34 * k], [x, y - 64 * k], [x + 38 * k, y - 34 * k]], 3, 0.4, 6), { shadow: 0.4 });
    if (night()) { g.save(); g.shadowColor = A.C.glow; g.shadowBlur = 12 * s; g.fillStyle = A.C.glow; g.fillRect(x - 8 * k, y - 26 * k, 14 * k, 12 * k); g.restore(); }
  };
  V.windmillBody = function (g, s, x, y) {
    piece(g, s, c('#EDE2CF'), (p) => A.cut(p, [[x - 26, y], [x - 16, y - 120], [x + 16, y - 120], [x + 26, y]], 3, 0.6, 3), { shadow: 0.5, box: { x: x - 26, y: y - 120, w: 52, h: 120 } });
    piece(g, s, c('#B9614E'), (p) => A.cut(p, [[x - 24, y - 116], [x, y - 146], [x + 24, y - 116]], 4, 0.4, 4), { shadow: 0.4 });
    piece(g, s, c('#6C5A5A'), (p) => A.rect(p, x - 7, y - 26, 14, 26, 3, 5), { shadow: 0 });
  };
  V.windmillSails = function (g, s) {
    for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); piece(g, s, c('#F6EFE3'), (p) => A.rect(p, -7, -76, 14, 70, 3, i), { shadow: 0.4, grain: 0.1 }); A.line(g, c('#C9B9A5'), 1.5, (p) => { for (let y = -70; y < -10; y += 12) { p.moveTo(-6, y); p.lineTo(6, y); } }); g.restore(); }
    piece(g, s, c('#6C5A5A'), (p) => p.arc(0, 0, 7, 0, 7), { shadow: 0.3 });
  };
})();
