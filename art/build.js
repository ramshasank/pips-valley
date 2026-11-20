/* Pip's Playhouse — art for Build It: painted wooden blocks, the playroom, the wrecking ball. */
(function () {
  'use strict';
  const A = K.art, B = (A.build = {});

  B.COL = { red: '#DE5F48', blue: '#5B8FC7', teal: '#3E9C96', yellow: '#EFB84A', plum: '#7E5A92', green: '#7DB069', peach: '#F2A98A', wood: '#D6A873', dark: '#534C63', white: '#EFE8DB' };
  const C = B.COL;
  /** w, h in block units; sup = how much of the top can carry another block (0 = nothing balances on a point). */
  B.TYPES = {
    square: { w: 1, h: 1, say: 'square', cols: [C.red, C.blue, C.yellow], sup: 1, sym: Math.PI / 2 },
    brick: { w: 2, h: 1, say: 'rectangle', cols: [C.teal, C.yellow, C.red], sup: 1, sym: Math.PI },
    triangle: { w: 2, h: 1, say: 'triangle', cols: [C.plum, C.red], sup: 0, sym: Math.PI * 2 },
    arch: { w: 2, h: 1, say: 'arch', cols: [C.yellow, C.green], sup: 1, sym: Math.PI * 2 },
    half: { w: 2, h: 1, say: 'half circle', cols: [C.blue, C.peach], sup: 0.4, sym: Math.PI * 2 },
    circle: { w: 1, h: 1, say: 'circle', cols: [C.green, C.wood, C.plum], sup: 0.5, sym: Math.PI / 2 },
  };

  /* Painted pictures (img/build): the playroom, wide and tall, and a painted-wood surface that is laid over
     every block. They are fetched when the app starts; until they have all arrived the room and blocks
     are drawn from paper as before. */
  const PIC = {}; let pLeft = 3, pBad = false;
  B.pics = false;
  for (const nm of ['room-wide', 'room-tall', 'wood']) { const im = new Image(); im.onload = () => { PIC[nm] = im; pLeft--; B.pics = pLeft <= 0 && !pBad; }; im.onerror = () => { pBad = true; pLeft--; }; im.src = 'img/build/' + nm + '.webp'; }
  /** Resolves true once the pictures are in, false if they are not coming. */
  B.ready = () => new Promise((res) => { const t0 = Date.now(); (function wait() { if (pLeft <= 0 || Date.now() - t0 > 8000) res(B.pics); else setTimeout(wait, 80); })(); });
  /** Where the wall meets the floor in each room picture, as a fraction of its height. */
  const ROOM_HZ = { 'room-wide': 0.785, 'room-tall': 0.645 };

  /** Trace a block's outline, centred on (0,0). */
  B.path = function (g, t, w, h) {
    const x = -w / 2, y = -h / 2;
    if (t === 'square' || t === 'brick') A.rect(g, x, y, w, h, h * 0.13, 3, 0.5);
    else if (t === 'triangle') A.cut(g, [[x, y + h], [0, y], [x + w, y + h]], [h * 0.1, h * 0.16, h * 0.1], 0.5, 5);
    else if (t === 'arch') { const r = h * 0.56, c = h * 0.14; g.moveTo(x, y + h); g.lineTo(x, y + c); g.quadraticCurveTo(x, y, x + c, y); g.lineTo(x + w - c, y); g.quadraticCurveTo(x + w, y, x + w, y + c); g.lineTo(x + w, y + h); g.lineTo(r, y + h); g.arc(0, y + h, r, 0, Math.PI, true); g.closePath(); }
    else if (t === 'half') { g.moveTo(x, y + h); g.ellipse(0, y + h, w / 2, h, 0, Math.PI, Math.PI * 2); g.closePath(); }
    else g.arc(0, 0, w / 2, 0, Math.PI * 2);
  };

  /** A painted wooden block: paper body, bevelled edge, a little grain. */
  B.block = function (g, s, t, col, w, h, o) {
    o = o || {};
    g.beginPath(); B.path(g, t, w, h);
    A.paper(g, s, col, { shadow: o.shadow == null ? 0.85 : o.shadow, box: { x: -w / 2, y: -h / 2, w, h }, light: 0.09, grain: 0.3 });
    g.save(); g.beginPath(); B.path(g, t, w, h); g.clip();
    const r = A.rng(t.length * 7 + w);
    if (B.pics) {      // real painted wood, in the block's own colour
      const im = PIC.wood, k = (Math.max(w, h * 2) * 1.05) / im.width, r0 = A.rng(t.length * 13 + Math.round(w)), ox = r0() * 0.3, oy = r0() * 0.4;
      g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9; g.drawImage(im, im.width * ox, im.height * oy, im.width * 0.6, im.height * 0.6 * (h / Math.max(w, h * 2)) * 2, -w / 2, -h / 2, w, h); g.restore();
    } else
    for (let i = 0; i < 3; i++) { const y0 = -h / 2 + (i + 0.7) * (h / 3.2); A.line(g, A.alpha(A.shade(col, -0.22), 0.2), h * 0.022, (p) => { p.moveTo(-w / 2, y0); p.bezierCurveTo(-w / 6, y0 - h * 0.08 + r() * h * 0.16, w / 6, y0 - h * 0.08 + r() * h * 0.16, w / 2, y0 + (r() - 0.5) * h * 0.1); }); }
    const e = h * 0.07; g.lineWidth = h * 0.13;
    g.save(); g.translate(-e, -e); g.beginPath(); B.path(g, t, w, h); g.strokeStyle = A.alpha(A.shade(col, -0.3), 0.3); g.stroke(); g.restore();   // shade, lower right
    g.save(); g.translate(e, e); g.beginPath(); B.path(g, t, w, h); g.strokeStyle = 'rgba(255,255,255,.32)'; g.stroke(); g.restore();            // light, upper left
    g.restore();
    if (t === 'circle') {
      g.beginPath(); g.arc(0, 0, w * 0.27, 0, 7); g.fillStyle = A.shade(col, 0.13); g.fill();
      g.beginPath(); g.arc(0, 0, w * 0.09, 0, 7); g.fillStyle = A.shade(col, -0.22); g.fill();
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; g.beginPath(); g.arc(Math.cos(a) * w * 0.18, Math.sin(a) * w * 0.18, w * 0.03, 0, 7); g.fillStyle = A.alpha(A.shade(col, -0.25), 0.6); g.fill(); }
    }
  };
  B.sprite = (t, col, w, h) => A.sprite('blk|' + (B.pics ? 'P' : '') + t + col + Math.round(w) + 'x' + Math.round(h), [-w / 2, -h / 2, w, h], (g, s) => B.block(g, s, t, col, w, h));

  /** A small friendly face. k scales it; o: {open, look, shut} */
  B.face = function (g, x, y, k, o) {
    o = o || {};
    g.save(); g.translate(x, y); g.scale(k, k);
    for (const sx of [-1, 1]) {
      g.beginPath(); g.ellipse(sx * 26, 8, 9, 6, 0, 0, 7); g.fillStyle = 'rgba(240,120,120,.55)'; g.fill();
      if (o.shut) A.line(g, A.C.ink, 3.4, (p) => { p.moveTo(sx * 16 - 6, -5); p.quadraticCurveTo(sx * 16, -11, sx * 16 + 6, -5); });
      else { g.beginPath(); g.ellipse(sx * 16 + (o.look || 0) * 2, -6, 6.5, 8.5, 0, 0, 7); g.fillStyle = A.C.ink; g.fill(); g.beginPath(); g.arc(sx * 16 - 2 + (o.look || 0) * 2, -9, 2.6, 0, 7); g.fillStyle = '#fff'; g.fill(); }
    }
    if (o.open) { g.beginPath(); g.moveTo(-9, 4); g.quadraticCurveTo(0, 6, 9, 4); g.quadraticCurveTo(8, 17, 0, 17); g.quadraticCurveTo(-8, 17, -9, 4); g.fillStyle = '#7A2F35'; g.fill(); }
    else A.line(g, A.C.ink, 3.4, (p) => { p.moveTo(-8, 5); p.quadraticCurveTo(0, 13, 8, 5); });
    g.restore();
  };

  /** The wrecking ball: a cheerful iron ball, centred on (0,0). */
  B.ball = function (g, s, r, o) {
    g.beginPath(); A.blob(g, 0, 0, r, r, 0.015, 3, 14); A.paper(g, s, '#5B546C', { shadow: 1.2, light: 0.12, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
    g.beginPath(); g.ellipse(-r * 0.36, -r * 0.42, r * 0.26, r * 0.15, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.2)'; g.fill();
    g.beginPath(); A.rect(g, -r * 0.2, -r * 1.2, r * 0.4, r * 0.3, 5, 2, 0.3); g.fillStyle = '#4A4458'; g.fill();
    B.face(g, 0, r * 0.08, r / 46, o);
  };

  /* ---------------- the playroom ---------------- */
  /** lay: {W, H, FY (floor line the blocks stand on), L0, R0 (build area), U, land, rx (ruler x), rows, slots, cx} */
  B.room = function (g, s, lay) {
    const { W, H, FY, L0, R0, U, land, rx, rows, cx } = lay, WY = FY - 86;
    const pic = B.pics && PIC[land ? 'room-wide' : 'room-tall'];
    if (pic) {         // the painted playroom, with its skirting board on the line where the drawn wall met the floor
      // the wall is fitted above the skirting line; the picture's floor is then stretched down to the bottom edge
      const hz = ROOM_HZ[land ? 'room-wide' : 'room-tall'], sc = Math.max(W / pic.width, WY / (pic.height * hz)), dw = pic.width * sc, x0 = W / 2 - dw / 2, wy = pic.height * hz;
      g.drawImage(pic, 0, 0, pic.width, wy, x0, WY - wy * sc, dw, wy * sc);
      g.drawImage(pic, 0, wy, pic.width, pic.height - wy, x0, WY - 1, dw, H - WY + 2);
    } else {
    // wall, with a paler panelled lower half
    g.beginPath(); g.rect(0, 0, W, WY); A.paper(g, s, '#D3DEDF', { shadow: 0, grain: 0.25, light: 0.03, box: { x: 0, y: 0, w: W * 0.3, h: WY } });
    for (let x = 40; x < W; x += 96) A.line(g, 'rgba(255,255,255,.2)', 14, (p) => { p.moveTo(x, 0); p.lineTo(x, WY - 190); });
    g.beginPath(); g.rect(0, WY - 190, W, 190); A.paper(g, s, '#EEE7D9', { shadow: 0, grain: 0.22, light: 0 });
    for (let x = 30; x < W; x += 150) A.line(g, 'rgba(120,100,80,.13)', 3, (p) => { p.moveTo(x, WY - 176); p.lineTo(x, WY - 14); });
    g.beginPath(); A.rect(g, -10, WY - 204, W + 20, 22, 6, 4, 0.6); A.paper(g, s, '#F7F1E4', { shadow: 0.5, light: 0 });

    // window with the valley outside
    const ww = land ? 300 : 170, wh = land ? 270 : 180, wx = land ? cx + (R0 - L0) * 0.24 - ww / 2 : W / 2 - ww / 2, wy = land ? 150 : 196;
    g.beginPath(); A.rect(g, wx - 18, wy - 18, ww + 36, wh + 36, 14, 6, 0.8); A.paper(g, s, '#F7F1E4', { shadow: 0.9, box: { x: wx, y: wy, w: ww, h: wh } });
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    const sky = g.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#A9D3DD'); sky.addColorStop(1, '#E9EEDC'); g.fillStyle = sky; g.fillRect(wx, wy, ww, wh);
    g.beginPath(); g.arc(wx + ww * 0.74, wy + wh * 0.28, 26, 0, 7); g.fillStyle = '#F7D27A'; g.fill();
    g.beginPath(); A.blob(g, wx + ww * 0.3, wy + wh * 0.3, 44, 17, 0.1, 8); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill();
    g.beginPath(); A.smooth(g, [[wx - 20, wy + wh * 0.7], [wx + ww * 0.3, wy + wh * 0.52], [wx + ww * 0.62, wy + wh * 0.7], [wx + ww + 20, wy + wh * 0.56], [wx + ww + 20, wy + wh + 20], [wx - 20, wy + wh + 20]]); g.fillStyle = '#95BCA4'; g.fill();
    g.beginPath(); A.smooth(g, [[wx - 20, wy + wh * 0.86], [wx + ww * 0.45, wy + wh * 0.72], [wx + ww + 20, wy + wh * 0.84], [wx + ww + 20, wy + wh + 20], [wx - 20, wy + wh + 20]]); g.fillStyle = '#74AC73'; g.fill();
    g.beginPath(); g.rect(wx + ww * 0.2 - 4, wy + wh * 0.62, 8, 40); g.fillStyle = '#8A5A3C'; g.fill(); g.beginPath(); A.blob(g, wx + ww * 0.2, wy + wh * 0.56, 30, 34, 0.08, 4); g.fillStyle = '#4F8752'; g.fill();
    g.restore();
    A.line(g, '#F7F1E4', 10, (p) => { p.moveTo(wx + ww / 2, wy); p.lineTo(wx + ww / 2, wy + wh); p.moveTo(wx, wy + wh / 2); p.lineTo(wx + ww, wy + wh / 2); }, 'butt');
    g.beginPath(); A.rect(g, wx - 30, wy + wh + 14, ww + 60, 20, 6, 8, 0.6); A.paper(g, s, '#F7F1E4', { shadow: 0.8, light: 0 });
    for (const sd of [-1, 1]) { // curtains
      const ex = sd < 0 ? wx - 22 : wx + ww + 22;
      g.beginPath(); A.smooth(g, [[ex, wy - 24], [ex - sd * 74, wy - 24], [ex - sd * 62, wy + wh * 0.45], [ex - sd * 22, wy + wh * 0.72], [ex - sd * 30, wy + wh + 6], [ex + sd * 4, wy + wh + 6]]);
      A.paper(g, s, '#D98D76', { shadow: 0.7, light: 0.05, box: { x: Math.min(ex, ex - sd * 74), y: wy - 24, w: 78, h: wh + 30 } });
      A.line(g, 'rgba(120,60,50,.22)', 3, (p) => { p.moveTo(ex - sd * 40, wy - 20); p.quadraticCurveTo(ex - sd * 36, wy + wh * 0.4, ex - sd * 16, wy + wh * 0.7); });
    }
    g.beginPath(); A.rect(g, wx - 44, wy - 40, ww + 88, 16, 8, 3, 0.4); A.paper(g, s, '#C08A5A', { shadow: 0.6 });

    if (land) { // a toy shelf on the wall
      const sx = L0 + 70, sy = 388, sw = Math.min(330, wx - sx - 90);
      if (sw > 200) {
        g.beginPath(); A.rect(g, sx, sy, sw, 18, 6, 2, 0.6); A.paper(g, s, '#C08A5A', { shadow: 1, light: 0.04, box: { x: sx, y: sy, w: sw, h: 18 } });
        [['#5B8FC7', 26, 92], ['#E8664A', 22, 78], ['#F2B33D', 30, 86], ['#6E4E7E', 20, 70]].forEach(([c, bw, bh], i) => { const bx = sx + 18 + i * 31; g.save(); g.translate(bx, sy); if (i === 3) g.rotate(0.22); g.beginPath(); A.rect(g, 0, -bh, bw, bh, 4, i + 2, 0.5); A.paper(g, s, c, { shadow: 0.5, light: 0.05, box: { x: 0, y: -bh, w: bw, h: bh } }); A.line(g, 'rgba(255,255,255,.4)', 3, (p) => { p.moveTo(5, -bh + 14); p.lineTo(bw - 5, -bh + 14); }); g.restore(); });
        // teddy
        const tx = sx + sw - 110, c = '#C9966A';
        for (const d of [-1, 1]) { g.beginPath(); g.arc(tx + d * 25, sy - 96, 13, 0, 7); A.paper(g, s, c, { shadow: 0.4 }); g.beginPath(); g.ellipse(tx + d * 26, sy - 12, 15, 11, 0, 0, 7); A.paper(g, s, A.shade(c, -0.05), { shadow: 0.4 }); }
        g.beginPath(); A.blob(g, tx, sy - 34, 34, 36, 0.03, 5); A.paper(g, s, c, { shadow: 0.6, box: { x: tx - 34, y: sy - 70, w: 68, h: 72 } });
        g.beginPath(); A.blob(g, tx, sy - 30, 20, 22, 0.03, 6); g.fillStyle = '#EAD2B0'; g.fill();
        g.beginPath(); A.blob(g, tx, sy - 82, 32, 28, 0.03, 7); A.paper(g, s, c, { shadow: 0.5, box: { x: tx - 32, y: sy - 110, w: 64, h: 56 } });
        g.beginPath(); g.ellipse(tx, sy - 74, 13, 10, 0, 0, 7); g.fillStyle = '#EAD2B0'; g.fill();
        for (const d of [-1, 1]) { g.beginPath(); g.arc(tx + d * 12, sy - 88, 3.6, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
        g.beginPath(); g.ellipse(tx, sy - 78, 4.5, 3.2, 0, 0, 7); g.fillStyle = A.C.ink; g.fill();
        // ball
        g.beginPath(); g.arc(sx + sw - 36, sy - 27, 27, 0, 7); A.paper(g, s, '#2F8F8A', { shadow: 0.6, light: 0.1, box: { x: sx + sw - 63, y: sy - 54, w: 54, h: 54 } });
        g.save(); g.beginPath(); g.arc(sx + sw - 36, sy - 27, 27, 0, 7); g.clip(); A.line(g, '#F6EFE3', 9, (p) => { p.moveTo(sx + sw - 70, sy - 40); p.quadraticCurveTo(sx + sw - 36, sy - 16, sx + sw, sy - 40); }); g.restore();
        for (const bx of [sx + 34, sx + sw - 34]) { g.beginPath(); g.moveTo(bx - 5, sy + 18); g.lineTo(bx + 5, sy + 18); g.lineTo(bx + 3, sy + 46); g.closePath(); g.fillStyle = '#A9784E'; g.fill(); }
      }
    }

    // floor boards
    g.beginPath(); g.rect(0, WY, W, H - WY); A.paper(g, s, '#C99C6E', { shadow: 0, grain: 0.3, light: 0.03, box: { x: 0, y: WY, w: W * 0.2, h: H - WY } });
    A.line(g, 'rgba(90,60,40,.28)', 3, (p) => { for (let i = 1; i < 6; i++) { const y = WY + (H - WY) * Math.pow(i / 6, 1.5); p.moveTo(0, y); p.lineTo(W, y); } });
    g.beginPath(); A.rect(g, -10, WY - 12, W + 20, 20, 5, 9, 0.5); A.paper(g, s, '#F7F1E4', { shadow: 0.5, light: 0 });
    }
    // rug
    const ry0 = FY - 50, ry1 = Math.min(H - 20, FY + (land ? 96 : 60)), rx0 = L0 - 34, rx1 = R0 + 20;
    A.line(g, '#E9DCC6', 4, (p) => { for (let y = ry0 + 12; y < ry1 - 6; y += 13) { p.moveTo(rx0 - 13, y); p.lineTo(rx0 + 4, y); p.moveTo(rx1 - 4, y); p.lineTo(rx1 + 13, y); } });
    g.beginPath(); A.rect(g, rx0, ry0, rx1 - rx0, ry1 - ry0, 22, 5, 1.2); A.paper(g, s, '#86AEAA', { shadow: 0.7, grain: 0.42, light: 0.04, box: { x: rx0, y: ry0, w: rx1 - rx0, h: ry1 - ry0 } });
    g.beginPath(); A.rect(g, rx0 + 14, ry0 + 12, rx1 - rx0 - 28, ry1 - ry0 - 24, 14, 6, 1); g.strokeStyle = 'rgba(246,239,227,.75)'; g.lineWidth = 5; g.stroke();
    g.beginPath(); A.rect(g, rx0 + 28, ry0 + 24, rx1 - rx0 - 56, ry1 - ry0 - 48, 10, 7, 1); g.strokeStyle = 'rgba(217,141,118,.7)'; g.lineWidth = 4; g.stroke();

    // measuring pole: one band per block
    for (let i = 0; i < rows; i++) { g.beginPath(); g.rect(rx - 19, FY - (i + 1) * U, 38, U); g.fillStyle = i % 2 ? '#F7EDD0' : '#F1D488'; g.fill(); }
    g.beginPath(); A.rect(g, rx - 19, FY - rows * U, 38, rows * U, 5, 2, 0.4); g.strokeStyle = 'rgba(90,70,40,.35)'; g.lineWidth = 2.5; g.stroke();
    g.font = `700 ${Math.round(U * 0.36)}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(46,42,59,.72)';
    for (let i = 1; i <= rows; i++) g.fillText(String(i), rx, FY - (i - 0.5) * U + 2);

    // block store: a cubby unit on the tablet, a tray along the bottom on the phone
    const sl = lay.slots, wood = '#C48F5F', inner = '#9C6D46';
    if (land) {
      const x0 = sl[0].x - 92, y0 = sl[0].y - 74, w = 184, h = sl[5].y - sl[0].y + 148;
      g.beginPath(); A.rect(g, x0, y0, w, h, 16, 3, 1); A.paper(g, s, wood, { shadow: 1.2, depth: 1.4, light: 0.05, box: { x: x0, y: y0, w, h } });
      for (const q of sl) { g.beginPath(); A.rect(g, q.x - 80, q.y - 60, 160, 120, 10, 5, 0.6); g.fillStyle = inner; g.fill(); g.beginPath(); g.rect(q.x - 80, q.y + 44, 160, 16); g.fillStyle = A.shade(inner, 0.07); g.fill(); g.save(); g.beginPath(); g.rect(q.x - 80, q.y - 60, 160, 120); g.clip(); g.fillStyle = 'rgba(40,25,20,.2)'; g.fillRect(q.x - 80, q.y - 60, 160, 14); g.fillRect(q.x - 80, q.y - 60, 10, 120); g.restore(); }
    } else {
      const sw = sl[1].x - sl[0].x, x0 = sl[0].x - sw / 2 - 4, y0 = sl[0].y - 62, w = sw * 3 + 8, h = sl[5].y - sl[0].y + 124;
      g.beginPath(); A.rect(g, x0, y0, w, h, 16, 3, 1); A.paper(g, s, wood, { shadow: 1.2, depth: 1.4, light: 0.05, box: { x: x0, y: y0, w, h } });
      for (const q of sl) { g.beginPath(); A.rect(g, q.x - sw / 2 + 5, q.y - 49, sw - 10, 98, 9, 5, 0.5); g.fillStyle = inner; g.fill(); g.fillStyle = 'rgba(40,25,20,.2)'; g.fillRect(q.x - sw / 2 + 7, q.y - 49, sw - 14, 11); }
    }
  };
})();
