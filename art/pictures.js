/* Pip's Playhouse — colouring pictures for Paint Studio.
   Each picture is a full page in a 400x400 box: closed regions listed back to front (every one is a
   place to put colour), then ink details on top. Regions may be clipped to an earlier region
   (`clip: index`) so stripes and bands stay inside their shape.
   Names match the recorded lines "Color the <name>!" and "You colored the <name>!". */
(function () {
  'use strict';
  const A = K.art;
  const Pic = (A.pictures = {});
  const INK = '#2E2A3B';
  const TAU = Math.PI * 2;

  /* ---- path helpers (p is a Path2D or a canvas context) ---- */
  const rect = (x, y, w, h) => (p) => p.rect(x, y, w, h);
  const circ = (x, y, r) => (p) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (x, y, rx, ry, rot) => (p) => { p.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); p.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  const smooth = (pts) => (p) => A.smooth(p, pts);
  const cut = (pts, rad) => (p) => A.cut(p, pts, rad == null ? 8 : rad, 0, 1);
  const mirror = (pts) => pts.map(([x, y]) => [400 - x, y]);
  const cloud = (x, y, s) => smooth([[x, y], [x + 14 * s, y - 30 * s], [x + 50 * s, y - 50 * s], [x + 86 * s, y - 36 * s], [x + 120 * s, y - 30 * s], [x + 132 * s, y], [x + 66 * s, y + 8 * s]]);
  const star = (x, y, r) => (p) => { for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, q = i % 2 ? r * 0.46 : r; p[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } p.closePath(); };
  const poly = (fn) => (p) => { fn(p); p.closePath(); };
  /* ---- detail helpers (g is a context already set to ink strokes) ---- */
  const eye = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(x + r * 0.3, y - r * 0.35, r * 0.34, 0, TAU); g.fillStyle = '#fff'; g.fill(); };
  const line = (g, fn) => { g.beginPath(); fn(g); g.stroke(); };
  const smile = (g, x, y, w, d) => line(g, (h) => { h.moveTo(x - w, y); h.quadraticCurveTo(x, y + d, x + w, y); });
  const rays = (g, x, y, a, b, n) => line(g, (h) => { for (let i = 0; i < (n || 10); i++) { const t = (i / (n || 10)) * TAU; h.moveTo(x + Math.cos(t) * a, y + Math.sin(t) * a); h.lineTo(x + Math.cos(t) * b, y + Math.sin(t) * b); } });

  const heart = (x, y, s) => (p) => { p.moveTo(x, y + s); p.bezierCurveTo(x - s * 1.5, y + s * 0.1, x - s * 0.85, y - s * 1.05, x, y - s * 0.35); p.bezierCurveTo(x + s * 0.85, y - s * 1.05, x + s * 1.5, y + s * 0.1, x, y + s); p.closePath(); };
  /** One big sparkly eye. */
  const bigEye = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = INK; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + r * 0.32, y - r * 0.36, r * 0.38, 0, TAU); g.fill(); g.beginPath(); g.arc(x - r * 0.3, y + r * 0.34, r * 0.18, 0, TAU); g.fill(); };
  const blush = (g, x, y, s) => line(g, (h) => { for (const d of [-1, 0, 1]) { h.moveTo(x + d * s * 0.42 - s * 0.14, y + s * 0.26); h.lineTo(x + d * s * 0.42 + s * 0.14, y - s * 0.26); } });
  /** A cute face: two sparkly eyes set wide, a tiny smile, blush marks. s = eye spacing unit. */
  const face = (g, x, y, s, o) => {
    o = o || {};
    bigEye(g, x - s, y, s * 0.5); bigEye(g, x + s, y, s * 0.5);
    g.save(); g.lineWidth = Math.max(2.5, s * 0.2);
    if (o.open) { g.beginPath(); g.moveTo(x - s * 0.36, y + s * 0.4); g.quadraticCurveTo(x, y + s * 0.34, x + s * 0.36, y + s * 0.4); g.quadraticCurveTo(x + s * 0.3, y + s * 0.95, x, y + s * 0.95); g.quadraticCurveTo(x - s * 0.3, y + s * 0.95, x - s * 0.36, y + s * 0.4); g.fillStyle = INK; g.fill(); }
    else smile(g, x, y + s * 0.45, s * 0.3, s * 0.3);
    if (o.blush !== false) { blush(g, x - s * 1.75, y + s * 0.6, s * 0.55); blush(g, x + s * 1.75, y + s * 0.6, s * 0.55); }
    g.restore();
  };
  /** Regions are added back to front; add() returns the index, for clipping later regions to it. */
  const page = (id, name, build, detail) => { const R = []; build((d, clip) => R.push(clip == null ? { d } : { d, clip }) - 1); return { id, name, regions: R, detail }; };
  const hillTop = (y, dip) => poly((p) => { p.moveTo(0, y); p.quadraticCurveTo(200, y - dip, 400, y); p.lineTo(400, 400); p.lineTo(0, 400); });

  Pic.list = [
    page('fish', 'fish', (add) => {
      add(rect(0, 0, 400, 400));
      add(poly((p) => { p.moveTo(0, 350); p.quadraticCurveTo(100, 328, 200, 352); p.quadraticCurveTo(300, 374, 400, 344); p.lineTo(400, 400); p.lineTo(0, 400); }));
      add(poly((p) => { p.moveTo(28, 372); p.bezierCurveTo(8, 320, 58, 300, 34, 240); p.bezierCurveTo(76, 290, 38, 330, 62, 372); }));
      add(poly((p) => { p.moveTo(232, 378); p.bezierCurveTo(218, 348, 254, 338, 240, 300); p.bezierCurveTo(276, 334, 246, 356, 264, 380); }));
      add(star(322, 358, 30));
      add(cut([[284, 208], [344, 150], [370, 168], [352, 208], [370, 248], [344, 266]], [12, 14, 10, 16, 10, 14]));
      add(poly((p) => { p.moveTo(146, 124); p.quadraticCurveTo(190, 54, 246, 130); }));
      add(poly((p) => { p.moveTo(170, 290); p.quadraticCurveTo(200, 338, 232, 288); }));
      const body = add(ell(184, 208, 116, 96));
      add(poly((p) => { p.moveTo(196, 100); p.quadraticCurveTo(216, 208, 196, 312); p.lineTo(230, 312); p.quadraticCurveTo(250, 208, 230, 100); }), body);
      add(poly((p) => { p.moveTo(256, 100); p.quadraticCurveTo(274, 208, 256, 312); p.lineTo(284, 312); p.quadraticCurveTo(300, 208, 284, 100); }), body);
      add(circ(126, 192, 30));
      add(circ(60, 110, 17)); add(circ(86, 62, 11)); add(heart(330, 76, 18));
    }, (g) => { bigEye(g, 130, 194, 17); smile(g, 100, 244, 13, 12); blush(g, 152, 246, 13); face(g, 322, 358, 7, { blush: false }); line(g, (h) => { h.moveTo(300, 190); h.lineTo(344, 172); h.moveTo(302, 208); h.lineTo(350, 208); h.moveTo(300, 226); h.lineTo(344, 246); }); }),

    page('car', 'car', (add) => {
      add(rect(0, 0, 400, 400)); add(circ(330, 70, 38)); add(cloud(34, 106, 1.05));
      add(poly((p) => { p.moveTo(0, 262); p.quadraticCurveTo(120, 186, 240, 250); p.quadraticCurveTo(330, 292, 400, 236); p.lineTo(400, 400); p.lineTo(0, 400); }));
      add(poly((p) => { p.moveTo(0, 326); p.lineTo(400, 326); p.lineTo(400, 400); p.lineTo(0, 400); }));
      add(poly((p) => { p.moveTo(100, 220); p.quadraticCurveTo(104, 122, 196, 122); p.quadraticCurveTo(284, 122, 296, 220); }));
      add(poly((p) => { p.moveTo(122, 208); p.quadraticCurveTo(126, 146, 190, 144); p.lineTo(190, 208); }));
      add(poly((p) => { p.moveTo(206, 208); p.lineTo(206, 144); p.quadraticCurveTo(264, 146, 274, 208); }));
      add(cut([[40, 308], [40, 238], [82, 206], [312, 206], [364, 246], [364, 308]], [18, 34, 26, 34, 38, 18]));
      add(ell(352, 244, 9, 13)); add(heart(84, 250, 15));
      add(circ(118, 308, 38)); add(circ(288, 308, 38)); add(circ(118, 308, 15)); add(circ(288, 308, 15));
    }, (g) => { rays(g, 330, 70, 48, 62, 10); face(g, 330, 70, 13); face(g, 96, 92, 10); face(g, 270, 250, 17, { open: true }); line(g, (h) => { h.moveTo(198, 212); h.lineTo(198, 296); h.moveTo(150, 240); h.lineTo(172, 240); for (let x = 20; x < 400; x += 80) { h.moveTo(x, 368); h.lineTo(x + 40, 368); } }); }),

    page('house', 'house', (add) => {
      add(rect(0, 0, 400, 400)); add(circ(338, 62, 36)); add(cloud(24, 92, 1));
      add(hillTop(304, 36));
      add(cut([[130, 400], [150, 312], [194, 312], [222, 400]], 3));
      add(cut([[328, 320], [332, 244], [352, 244], [356, 320]], 4));
      add((p) => A.blob(p, 342, 198, 50, 56, 0.07, 4, 9));
      add(cut([[214, 150], [214, 86], [246, 86], [246, 170]], 4));
      add(cut([[60, 316], [60, 176], [282, 176], [282, 316]], 10));
      add(cut([[30, 190], [171, 74], [312, 190]], [16, 22, 16]));
      add(poly((p) => { p.moveTo(144, 316); p.lineTo(144, 262); p.arc(172, 262, 28, Math.PI, 0); p.lineTo(200, 316); }));
      add(circ(104, 222, 27)); add(circ(238, 222, 27));
      add(heart(171, 136, 15));
      add(star(44, 342, 19)); add(star(86, 360, 16)); add(star(262, 352, 19));
    }, (g) => { rays(g, 338, 62, 46, 60, 10); face(g, 338, 62, 12); face(g, 86, 78, 10); bigEye(g, 108, 224, 13); bigEye(g, 242, 224, 13); blush(g, 84, 266, 13); blush(g, 258, 266, 13); face(g, 342, 198, 11);
      line(g, (h) => { h.moveTo(228, 72); h.bezierCurveTo(216, 56, 246, 48, 234, 30); h.moveTo(44, 357); h.lineTo(44, 384); h.moveTo(86, 373); h.lineTo(86, 392); h.moveTo(262, 367); h.lineTo(262, 390); });
      for (const [x, y] of [[188, 290], [44, 342], [86, 360], [262, 352]]) { g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fillStyle = INK; g.fill(); } }),

    page('butterfly', 'butterfly', (add) => {
      const up = [[196, 204], [150, 118], [90, 82], [44, 114], [50, 180], [108, 216]], lo = [[194, 224], [120, 222], [76, 258], [92, 310], [150, 314], [186, 272]];
      add(rect(0, 0, 400, 400)); add(cloud(16, 64, 0.8)); add(cloud(276, 56, 0.8));
      add(poly((p) => { p.moveTo(0, 356); p.quadraticCurveTo(100, 336, 200, 354); p.quadraticCurveTo(300, 372, 400, 350); p.lineTo(400, 400); p.lineTo(0, 400); }));
      add(smooth(lo)); add(smooth(mirror(lo))); add(smooth(up)); add(smooth(mirror(up)));
      add(heart(102, 150, 24)); add(heart(298, 150, 24)); add(circ(128, 270, 19)); add(circ(272, 270, 19));
      add(ell(200, 250, 17, 60));
      add(circ(200, 152, 38));
    }, (g) => { line(g, (h) => { h.moveTo(186, 118); h.quadraticCurveTo(170, 84, 150, 78); h.moveTo(214, 118); h.quadraticCurveTo(230, 84, 250, 78); for (const y of [232, 256, 280]) { h.moveTo(185, y); h.lineTo(215, y); } }); for (const x of [148, 252]) { g.beginPath(); g.arc(x, 76, 6, 0, TAU); g.fillStyle = INK; g.fill(); } face(g, 200, 150, 13); }),

    page('rocket', 'rocket', (add) => {
      const fin = [[154, 236], [100, 304], [110, 326], [160, 300]];
      add(rect(0, 0, 400, 400)); add(circ(318, 92, 46)); add(hillTop(346, 54));
      add(ell(84, 364, 28, 10)); add(ell(310, 368, 36, 12));
      add(star(66, 70, 26)); add(star(96, 200, 16)); add(star(336, 230, 19));
      add(smooth([[164, 300], [236, 300], [228, 354], [200, 394], [172, 354]]));
      add(smooth([[184, 300], [216, 300], [212, 338], [200, 362], [188, 338]]));
      add(cut(fin, 10)); add(cut(mirror(fin), 10));
      const body = add(poly((p) => { p.moveTo(144, 304); p.lineTo(144, 176); p.quadraticCurveTo(144, 88, 200, 40); p.quadraticCurveTo(256, 88, 256, 176); p.lineTo(256, 304); }));
      add(rect(120, 20, 160, 100), body); add(rect(120, 276, 160, 50), body);
      add(circ(200, 164, 32)); add(circ(200, 164, 20));
    }, (g) => { line(g, (h) => { h.ellipse(318, 92, 68, 14, -0.35, 0.3, Math.PI - 0.3); h.moveTo(190, 158); h.quadraticCurveTo(193, 151, 200, 149); }); face(g, 200, 230, 14); face(g, 314, 88, 11, { blush: false }); face(g, 66, 72, 6, { blush: false });
      for (const [x, y] of [[40, 150], [250, 30], [290, 300], [150, 30], [370, 160]]) { g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fillStyle = INK; g.fill(); } }),

    page('teddy', 'teddy bear', (add) => {
      add(rect(0, 0, 400, 400)); add(poly((p) => { p.moveTo(0, 334); p.lineTo(400, 334); p.lineTo(400, 400); p.lineTo(0, 400); })); add(ell(200, 366, 176, 26));
      add(circ(112, 62, 40)); add(circ(288, 62, 40)); add(circ(112, 62, 19)); add(circ(288, 62, 19));
      add(ell(112, 262, 25, 46, 0.6)); add(ell(288, 262, 25, 46, -0.6));
      add(ell(132, 344, 44, 32, -0.25)); add(ell(268, 344, 44, 32, 0.25)); add(ell(120, 348, 19, 15, -0.25)); add(ell(280, 348, 19, 15, 0.25));
      add(ell(200, 288, 76, 72));
      add(heart(200, 296, 30));
      add((p) => A.blob(p, 200, 132, 116, 98, 0.015, 3, 12));
      add(ell(200, 168, 40, 30));
      add(cut([[198, 232], [150, 210], [150, 256]], 8)); add(cut([[202, 232], [250, 210], [250, 256]], 8)); add(circ(200, 233, 12));
    }, (g) => { bigEye(g, 152, 126, 15); bigEye(g, 248, 126, 15); blush(g, 116, 166, 15); blush(g, 284, 166, 15); g.beginPath(); g.ellipse(200, 156, 12, 8.5, 0, 0, TAU); g.fillStyle = INK; g.fill(); line(g, (h) => { h.moveTo(200, 164); h.lineTo(200, 172); h.moveTo(187, 172); h.quadraticCurveTo(193.5, 182, 200, 172); h.quadraticCurveTo(206.5, 182, 213, 172); }); }),

    page('flower', 'flower', (add) => {
      add(rect(0, 0, 400, 400)); add(circ(60, 60, 36)); add(cloud(262, 62, 0.85)); add(hillTop(334, 40));
      add(poly((p) => { p.moveTo(191, 310); p.quadraticCurveTo(184, 256, 193, 190); p.lineTo(209, 190); p.quadraticCurveTo(200, 256, 209, 310); }));
      add(poly((p) => { p.moveTo(193, 282); p.quadraticCurveTo(136, 288, 110, 240); p.quadraticCurveTo(168, 230, 195, 264); }));
      add(poly((p) => { p.moveTo(206, 262); p.quadraticCurveTo(262, 262, 282, 216); p.quadraticCurveTo(228, 212, 204, 246); }));
      add(cut([[146, 394], [134, 326], [266, 326], [254, 394]], 10)); add(cut([[124, 304], [276, 304], [276, 332], [124, 332]], 10)); add(heart(200, 362, 16));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2; add(ell(200 + Math.cos(a) * 62, 128 + Math.sin(a) * 62, 40, 27, a)); }
      add(circ(200, 128, 46));
      // a bee
      add(ell(318, 176, 13, 20, -0.5)); add(ell(338, 174, 13, 20, 0.5));
      const bee = add(ell(326, 204, 32, 23));
      add(rect(322, 176, 12, 56), bee); add(rect(344, 176, 10, 56), bee);
    }, (g) => { rays(g, 60, 60, 46, 60, 10); face(g, 60, 60, 12); face(g, 200, 126, 15, { open: true }); bigEye(g, 306, 200, 6); smile(g, 303, 211, 5, 4);
      line(g, (h) => { h.moveTo(150, 256); h.lineTo(180, 268); h.moveTo(246, 238); h.lineTo(218, 250); h.moveTo(358, 204); h.lineTo(368, 204); }); g.save(); g.setLineDash([3, 11]); line(g, (h) => { h.moveTo(370, 214); h.bezierCurveTo(396, 250, 330, 262, 366, 292); }); g.restore(); }),

    page('icecream', 'ice cream', (add) => {
      add(rect(0, 0, 400, 400)); add(circ(62, 62, 36)); add(cloud(268, 64, 0.85));
      add(poly((p) => { p.moveTo(0, 360); p.lineTo(400, 360); p.lineTo(400, 400); p.lineTo(0, 400); }));
      add(heart(66, 250, 20)); add(heart(336, 216, 16));
      add(cut([[262, 92], [286, 100], [264, 190], [240, 182]], 5));
      add(cut([[136, 276], [264, 276], [200, 398]], [8, 8, 12]));
      add(smooth([[116, 236], [134, 180], [200, 160], [266, 180], [284, 236], [266, 276], [242, 262], [226, 290], [200, 268], [174, 290], [158, 262], [134, 276]]));
      add(circ(200, 124, 52));
      add(circ(200, 66, 20));
    }, (g) => { rays(g, 62, 62, 46, 60, 10); face(g, 62, 62, 12); face(g, 200, 214, 17, { open: true });
      line(g, (h) => { h.moveTo(206, 48); h.quadraticCurveTo(212, 30, 228, 28);
        h.moveTo(168, 296); h.lineTo(184, 366); h.moveTo(202, 298); h.lineTo(200, 392); h.moveTo(236, 296); h.lineTo(216, 366); h.moveTo(150, 302); h.lineTo(250, 302); h.moveTo(166, 336); h.lineTo(234, 336);
        for (const [x, y, a] of [[176, 104, 0.6], [216, 96, -0.5], [232, 128, 0.9], [178, 140, -0.3], [202, 122, 0.2]]) { h.moveTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7); h.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); } }); }),
  ];
  Pic.byId = (id) => Pic.list.find((p) => p.id === id);

  /** Build the Path2D objects once. */
  function prep(pic) { if (!pic.paths) pic.paths = pic.regions.map((r) => { const p = new Path2D(); r.d(p); return p; }); return pic; }
  Pic.prep = prep;
  /** Region index under a point (400-space), top-most first; -1 if none. g is any 2D context. */
  Pic.hit = function (g, pic, x, y) {
    prep(pic);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    let found = -1;
    for (let i = pic.regions.length - 1; i >= 0; i--) { const r = pic.regions[i]; if (g.isPointInPath(pic.paths[i], x, y) && (r.clip == null || g.isPointInPath(pic.paths[r.clip], x, y))) { found = i; break; } }
    g.restore(); return found;
  };
  /** Paint one region's colour. g is scaled to 400-space. spot {x,y,r}: only within that circle (for the spreading-paint effect). */
  Pic.fillRegion = function (g, pic, i, col, spot) {
    prep(pic); const r = pic.regions[i];
    g.save();
    if (r.clip != null) g.clip(pic.paths[r.clip]);
    g.clip(pic.paths[i]);
    g.fillStyle = col;
    if (spot) { g.beginPath(); g.arc(spot.x, spot.y, spot.r, 0, TAU); g.fill(); } else g.fillRect(0, 0, 400, 400);
    g.restore();
  };
  /** Repaint every region above `from` in its current colour, so colour put on a shape never covers what sits on it. */
  Pic.PAPER = '#FDFBF5';
  Pic.paintAbove = function (g, pic, fills, from) { for (let j = from + 1; j < pic.regions.length; j++) Pic.fillRegion(g, pic, j, fills[j] || Pic.PAPER); };
  /** The ink: region outlines and details, on a TRANSPARENT layer scaled to 400-space.
      Each shape first rubs out the ink underneath it, so hidden edges never show through. */
  Pic.ink = function (g, pic, w) {
    prep(pic);
    g.save(); g.strokeStyle = INK; g.lineWidth = w || 5; g.lineJoin = 'round'; g.lineCap = 'round';
    pic.regions.forEach((r, i) => {
      if (i === 0) return;
      g.save(); if (r.clip != null) g.clip(pic.paths[r.clip]);
      g.globalCompositeOperation = 'destination-out'; g.fill(pic.paths[i]);
      g.globalCompositeOperation = 'source-over'; g.stroke(pic.paths[i]);
      g.restore();
      if (r.clip != null) g.stroke(pic.paths[r.clip]); // the outline of the shape a band sits in goes back on top
    });
    pic.detail(g);
    g.restore();
  };
  /** A finished-looking bitmap of a picture (paper, colours, ink) at px size, for thumbnails. */
  Pic.render = function (pic, fills, px) {
    const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'); const k = px / 400;
    g.setTransform(k, 0, 0, k, 0, 0); g.fillStyle = Pic.PAPER; g.fillRect(0, 0, 400, 400);
    if (fills) pic.regions.forEach((r, i) => { if (fills[i]) Pic.fillRegion(g, pic, i, fills[i]); else if (i) Pic.fillRegion(g, pic, i, Pic.PAPER); });
    const l = document.createElement('canvas'); l.width = l.height = px; const lg = l.getContext('2d'); lg.setTransform(k, 0, 0, k, 0, 0); Pic.ink(lg, pic, 5);
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(l, 0, 0);
    return c;
  };
})();
