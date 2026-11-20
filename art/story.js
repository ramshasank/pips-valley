/* Pip's Playhouse — Story Studio art: the reading nook, page backdrops, the story cast and props.
   Painters draw in units with (0,0) at the thing's base centre (feet on the ground), y up negative.
   Live things take the node as their state (n.blink, n.sq, n.look, n.mouth, n.wave ...). */
(function () {
  'use strict';
  const A = K.art;
  const V = new Proxy({}, { get: (o, key) => A.valley[key] }); // art/valley.js loads after this file
  const St = (A.story = { prop: {}, box: {}, item: {}, snd: {} });
  const piece = (g, s, c, fn, o) => A.piece(g, s, c, fn, o);
  const c = (n) => A.ct(n);

  function eye(g, x, y, rx, ry, blink, look) {
    const k = Math.max(0.12, 1 - (blink || 0));
    g.save(); g.translate(x + (look || 0) * rx * 0.35, y);
    g.beginPath(); g.ellipse(0, 0, rx, ry * k, 0, 0, 7); g.fillStyle = A.C.ink; g.fill();
    if (k > 0.5) { g.beginPath(); g.arc(rx * 0.32, -ry * 0.38, rx * 0.36, 0, 7); g.fillStyle = '#fff'; g.fill(); }
    g.restore();
  }
  const cheek = (g, x, y, r) => { g.beginPath(); g.ellipse(x, y, r, r * 0.62, 0, 0, 7); g.fillStyle = A.alpha(A.C.tomato, 0.34); g.fill(); };
  const smile = (g, x, y, w, d, lw) => A.line(g, A.C.ink, lw || 4, (h) => { h.moveTo(x - w, y); h.quadraticCurveTo(x, y + d, x + w, y); });
  const starPts = (cx, cy, R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 - 1.571, rr = i % 2 ? r : R; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; };
  St.starPath = (g, cx, cy, R, r, rad) => A.cut(g, starPts(cx, cy, R, r || R * 0.54), rad == null ? R * 0.16 : rad, 0, 3);

  /* ---------------- sounds (all synthesised) ---------------- */
  const T = (f, d, o) => K.sfx.tone(f, d, o), N = (d, o) => K.sfx.noise(d, o);
  Object.assign(St.snd, {
    thud() { T(120, 0.2, { to: 50, vol: 0.4 }); N(0.08, { freq: 300, vol: 0.2 }); },
    twinkle() { [1568, 2093, 2637, 3136].forEach((f, i) => T(f, 0.2, { vol: 0.09, delay: i * 0.06 })); },
    choo() { [0, 0.34].forEach((d) => { T(880, 0.26, { type: 'square', vol: 0.05, delay: d }); T(1108, 0.26, { type: 'square', vol: 0.05, delay: d }); }); },
    chug() { [0, 0.16, 0.32].forEach((d) => N(0.1, { freq: 520, vol: 0.2, delay: d })); },
    slide() { T(700, 0.7, { to: 180, vol: 0.14 }); },
    splash() { N(0.4, { filter: 'lowpass', freq: 1900, vol: 0.34 }); T(640, 0.22, { to: 190, vol: 0.1 }); },
    drip() { T(1250, 0.09, { to: 640, vol: 0.16 }); T(1500, 0.08, { to: 800, vol: 0.1, delay: 0.14 }); },
    boing() { T(170, 0.36, { to: 540, vol: 0.2 }); },
    rocket() { N(1.4, { filter: 'lowpass', freq: 600, vol: 0.4 }); T(90, 1.4, { type: 'sawtooth', to: 240, vol: 0.12 }); },
    giggle() { [0, 0.09, 0.18, 0.27].forEach((d, i) => T(760 + i * 90, 0.07, { type: 'triangle', vol: 0.12, delay: d })); },
    hoot() { T(392, 0.24, { vol: 0.2 }); T(330, 0.5, { vol: 0.2, delay: 0.3 }); },
    yawn() { T(520, 0.9, { to: 250, vol: 0.1 }); },
    snore() { T(92, 0.6, { type: 'sawtooth', to: 72, vol: 0.07 }); T(520, 0.5, { to: 700, vol: 0.03, delay: 0.7 }); },
    wind() { N(0.8, { freq: 520, vol: 0.16 }); T(300, 0.7, { to: 520, vol: 0.03 }); },
    page() { N(0.22, { freq: 2400, vol: 0.12 }); N(0.12, { freq: 900, vol: 0.1, delay: 0.1 }); },
    wheee() { T(500, 0.9, { to: 1100, vol: 0.1 }); },
  });

  /* ---------------- things to give and carry ---------------- */
  St.item.apples = function (g, s, x, y, k) {
    g.save(); g.translate(x, y); g.scale(k || 1, k || 1);
    piece(g, s, '#D9483B', (h) => A.blob(h, 0, 0, 22, 21, 0.04, 3, 9), { shadow: 0.5, box: { x: -22, y: -21, w: 44, h: 42 }, light: 0.1 });
    A.line(g, A.C.barkDark, 3.5, (h) => { h.moveTo(0, -17); h.quadraticCurveTo(2, -26, 6, -29); });
    g.beginPath(); g.ellipse(13, -25, 9, 4.5, -0.5, 0, 7); g.fillStyle = A.C.leaf; g.fill();
    g.beginPath(); g.ellipse(-8, -8, 5, 7, 0.4, 0, 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
    g.restore();
  };
  St.item.cakes = function (g, s, x, y, k) {
    g.save(); g.translate(x, y); g.scale(k || 1, k || 1);
    piece(g, s, '#E9B98C', (h) => A.cut(h, [[-19, -2], [19, -2], [14, 22], [-14, 22]], 4, 0.4, 4), { shadow: 0.5 });
    A.line(g, 'rgba(120,80,50,.35)', 2, (h) => { for (const x2 of [-8, 0, 8]) { h.moveTo(x2 * 1.2, 0); h.lineTo(x2, 20); } });
    piece(g, s, '#F4A9BE', (h) => { A.blob(h, 0, -8, 24, 13, 0.05, 6, 9); A.blob(h, 0, -19, 15, 10, 0.05, 7, 8); }, { shadow: 0.3, light: 0.08, box: { x: -24, y: -30, w: 48, h: 34 } });
    g.beginPath(); g.arc(0, -29, 6, 0, 7); g.fillStyle = '#D9483B'; g.fill();
    g.restore();
  };
  St.item.flowers = function (g, s, x, y, k) {
    g.save(); g.translate(x, y); g.scale(k || 1, k || 1);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; g.beginPath(); g.ellipse(Math.cos(a) * 14, Math.sin(a) * 14, 11, 8, a, 0, 7); g.fillStyle = i % 2 ? '#F2B33D' : '#F6C95A'; g.fill(); }
    piece(g, s, '#E8664A', (h) => h.arc(0, 0, 10, 0, 7), { shadow: 0.3, grain: 0.1 });
    g.restore();
  };

  /* ---------------- the cast ---------------- */
  const COL = { bunny: '#F1E7DA', fox: '#E3793F', owl: '#7A5A8C', frog: '#7DB65F', bear: '#A8754F', cat: '#9A90A8', panda: '#F6F3EC', lion: '#F2B33D' };
  const BELLY = { bunny: '#FFFFFF', fox: '#FBF1E4', owl: '#D9C3E0', frog: '#B9D88E', bear: '#E3C29C', cat: '#E9E3EC', panda: '#FFFFFF', lion: '#F8DDB4' };
  const MUD = [[-22, -30, 14, 10], [18, -52, 11, 9], [-6, -66, 9, 7], [26, -20, 12, 8]];
  /** A small animal friend, about 165 units tall: n = {sq, blink, look, wave, arms, mud, scarf}. */
  St.critter = function (g, s, n, id) {
    const col = COL[id] || COL.bear, sq = n.sq || 0, dark = id === 'panda' ? '#3A3446' : null, limb = dark || A.shade(col, -0.1), belly = BELLY[id] || '#fff';
    const bird = id === 'owl', arms = n.arms || 0, wave = n.wave || 0;
    A.groundShadow(g, 50 * (1 + Math.max(0, -sq) * 0.6), 0);
    g.save(); g.scale(1 - sq * 0.5, 1 + sq);
    // tail, behind everything
    if (id === 'fox') { g.save(); g.translate(30, -22); g.rotate(0.5 + Math.sin((n.look || 0) * 2) * 0.05); g.beginPath(); A.smooth(g, [[0, 6], [16, -8], [40, -34], [46, -62], [34, -78], [20, -56], [6, -30], [-6, -8]]); A.paper(g, s, A.shade(col, -0.06), { shadow: 0.4, grain: 0.2 }); g.beginPath(); A.smooth(g, [[44, -50], [46, -64], [34, -78], [26, -64], [34, -56]]); g.fillStyle = '#FBF1E4'; g.fill(); g.restore(); }
    if (id === 'cat') A.line(g, A.shade(col, -0.1), 13, (h) => { h.moveTo(26, -14); h.bezierCurveTo(62, -10, 66, -50, 50, -70); });
    if (id === 'bunny') { g.beginPath(); A.blob(g, 34, -22, 14, 13, 0.1, 3, 9); g.fillStyle = '#FFFFFF'; g.fill(); }
    if (id === 'bear' || id === 'panda') { g.beginPath(); g.arc(36, -24, 10, 0, 7); g.fillStyle = limb; g.fill(); }
    // feet: talons for the bird, soft paws with toes for the rest
    for (const side of [-1, 1]) {
      g.save(); g.translate(side * 20, -5);
      if (bird) { g.fillStyle = '#F2B33D'; for (const dx of [-9, 0, 9]) { g.beginPath(); g.ellipse(dx, 2, 5, 9, dx * 0.04, 0, 7); g.fill(); } }
      else { g.beginPath(); A.blob(g, side * 2, 0, 19, 10, 0.05, 4 + side, 9); g.fillStyle = limb; g.fill(); A.line(g, A.alpha('#2E2A3B', 0.22), 1.6, (h) => { for (const dx of [-6, 3]) { h.moveTo(side * 2 + dx, -6); h.lineTo(side * 2 + dx + 1, 1); } }); }
      g.restore();
    }
    // body: a soft pear, wider at the hips, with a shaded underside
    const body = () => { g.beginPath(); A.smooth(g, [[0, -96], [22, -92], [36, -74], [42, -48], [45, -22], [36, -5], [14, 0], [-14, 0], [-36, -5], [-45, -22], [-42, -48], [-36, -74], [-22, -92]]); };
    body(); A.paper(g, s, col, { shadow: 0, light: 0.08, grain: 0.22, box: { x: -45, y: -96, w: 90, h: 96 } });
    g.save(); body(); g.clip();
    const sh = g.createLinearGradient(0, -60, 0, 4); sh.addColorStop(0, 'rgba(46,42,59,0)'); sh.addColorStop(1, 'rgba(46,42,59,.16)'); g.fillStyle = sh; g.fillRect(-50, -100, 100, 104);
    if (dark) { g.beginPath(); g.ellipse(0, -84, 52, 22, 0, 0, 7); g.fillStyle = dark; g.fill(); g.beginPath(); g.ellipse(-30, -4, 22, 20, 0, 0, 7); g.ellipse(30, -4, 22, 20, 0, 0, 7); g.fill(); }
    g.restore();
    // tummy
    g.beginPath(); A.smooth(g, [[0, -70], [20, -62], [28, -40], [24, -16], [0, -8], [-24, -16], [-28, -40], [-20, -62]]); g.fillStyle = belly; g.fill();
    if (bird) { // rows of little chest feathers
      g.save(); g.strokeStyle = A.alpha(col, 0.5); g.lineWidth = 2.2; g.lineCap = 'round';
      for (let r = 0; r < 4; r++) for (let i = -2 + (r % 2 ? 0.5 : 0); i <= 2; i++) { const x = i * 10, y = -58 + r * 12; if (Math.abs(x) > 22 - Math.abs(r - 1.5) * 3) continue; g.beginPath(); g.arc(x, y, 5, 0.2, Math.PI - 0.2); g.stroke(); }
      g.restore();
    } else if (id !== 'frog') { // a tuft of chest fur where tummy meets coat
      g.beginPath(); g.moveTo(-14, -66); for (let i = 0; i < 5; i++) { g.lineTo(-11 + i * 7 - 3.5, -74 - (i % 2 ? 0 : 3)); g.lineTo(-11 + i * 7, -65); } g.closePath(); g.fillStyle = belly; g.fill();
    }
    const mud = n.mud || 0;
    if (mud > 0.02) { g.save(); g.globalAlpha = mud; for (const [x, y, rx, ry] of MUD) { g.beginPath(); A.blob(g, x, y, rx, ry, 0.12, x + 40, 7); g.fillStyle = '#573726'; g.fill(); } g.restore(); }
    // arms (wings for the bird), in front of the body so they read as limbs
    for (const side of [-1, 1]) {
      g.save(); g.translate(side * 36, -74); g.rotate(side * (0.42 + (side > 0 ? wave * 1.5 : 0) - arms * 1.7));
      if (bird) { g.beginPath(); A.smooth(g, [[0, -6], [side * 10, 4], [side * 12, 26], [side * 4, 50], [-side * 6, 34], [-side * 8, 10]]); A.paper(g, s, A.shade(col, -0.14), { shadow: 0.4, grain: 0.2 }); A.line(g, A.alpha('#2E2A3B', 0.2), 1.8, (h) => { for (const yy of [18, 30, 40]) { h.moveTo(-side * 4, yy - 4); h.quadraticCurveTo(side * 2, yy + 3, side * 8, yy - 6); } }); }
      else { g.beginPath(); A.smooth(g, [[0, -8], [10, 0], [11, 24], [6, 36], [-6, 36], [-11, 24], [-10, 0]]); A.paper(g, s, limb, { shadow: 0.35, grain: 0.2, light: 0.04 }); g.beginPath(); g.ellipse(0, 30, 6.5, 5, 0, 0, 7); g.fillStyle = dark ? '#5A5266' : A.mix(belly, col, 0.35); g.fill(); }
      g.restore();
    }
    if (n.scarf) { g.beginPath(); A.rect(g, -30, -92, 60, 15, 7, 3, 0.5); g.fillStyle = n.scarf; g.fill(); g.beginPath(); A.rect(g, 12, -86, 14, 32, 5, 4, 0.5); g.fillStyle = A.shade(n.scarf, -0.06); g.fill(); }
    g.save(); g.translate((n.look || 0) * 4, -116 + (n.nod || 0)); g.rotate((n.tilt || 0)); g.scale(0.92, 0.92);
    // cheek fluff breaks the round outline of the head
    if (id !== 'frog') for (const side of [-1, 1]) { g.beginPath(); g.moveTo(side * 38, 2); g.quadraticCurveTo(side * 47, 8, side * 51, 13); g.quadraticCurveTo(side * 45, 14, side * 43, 17); g.quadraticCurveTo(side * 47, 22, side * 48, 26); g.quadraticCurveTo(side * 40, 28, side * 34, 28); g.closePath(); g.fillStyle = A.shade(col, -0.035); g.fill(); }
    A.face(g, s, id, { blink: n.blink });
    if (bird && !n.blink) { // feathered face disc and a bright catch-light
      A.line(g, A.alpha(col, 0.45), 1.8, (h) => { for (const side of [-1, 1]) for (let i = 0; i < 7; i++) { const a = -2.2 + i * 0.75, cx = side * 18, cy = -4; h.moveTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13); h.lineTo(cx + Math.cos(a) * 16.5, cy + Math.sin(a) * 16.5); } });
    }
    if (mud > 0.02) { g.globalAlpha = mud; for (const [x, y, rx, ry] of [[-26, -18, 10, 7], [22, 22, 9, 6]]) { g.beginPath(); A.blob(g, x, y, rx, ry, 0.12, 9, 7); g.fillStyle = '#573726'; g.fill(); } }
    g.restore();
    g.restore();
  };

  /** Little Star, about 130 tall. n = {blink, look, mouth:'smile'|'sad'|'open', glow, wink, sq} */
  St.star = function (g, s, n, t) {
    const sq = n.sq || 0, glow = n.glow == null ? 0.6 : n.glow;
    g.save(); g.translate(0, -66); g.scale(1 - sq * 0.5, 1 + sq); g.rotate(Math.sin(t * 1.6) * 0.05 + (n.tilt || 0));
    if (glow > 0) { const gr = g.createRadialGradient(0, 0, 20, 0, 0, 120); gr.addColorStop(0, `rgba(255,236,160,${0.55 * glow})`); gr.addColorStop(1, 'rgba(255,236,160,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill(); }
    g.beginPath(); St.starPath(g, 0, 0, 68, 37, 13); A.paper(g, s, '#F6C445', { shadow: 0.7, light: 0.1, box: { x: -68, y: -68, w: 136, h: 136 } });
    g.beginPath(); St.starPath(g, -3, -3, 44, 24, 8); g.fillStyle = 'rgba(255,244,196,.5)'; g.fill();
    const lk = n.look || 0;
    if (n.wink) { A.line(g, A.C.ink, 4, (h) => { h.moveTo(-23, 0); h.quadraticCurveTo(-15, -8, -7, 0); }); eye(g, 15, -2, 7.5, 9.5, 0, lk); }
    else { eye(g, -15, -2, 7.5, 9.5, n.blink, lk); eye(g, 15, -2, 7.5, 9.5, n.blink, lk); }
    cheek(g, -27, 12, 8); cheek(g, 27, 12, 8);
    if (n.mouth === 'sad') { smile(g, 0, 22, 8, -7, 3.5); g.beginPath(); g.ellipse(-22, 8 + ((t * 30) % 16), 3.5, 5.5, 0, 0, 7); g.fillStyle = '#9CCBEA'; g.fill(); }
    else if (n.mouth === 'open') { g.beginPath(); g.ellipse(0, 18, 8, 7, 0, 0, 7); g.fillStyle = '#7A2F35'; g.fill(); }
    else smile(g, 0, 14, 9, 8, 3.5);
    g.restore();
  };

  /** Toot the little red train (engine facing right, wheels on y = 0), with his wagon behind.
      n = {roll, blink, sleep, mouth, cargo, sq} */
  function wheel(g, s, x, r, roll) {
    g.save(); g.translate(x, -r); g.rotate(roll / r);
    piece(g, s, '#3E3446', (h) => h.arc(0, 0, r, 0, 7), { shadow: 0.5, grain: 0.1 });
    g.beginPath(); g.arc(0, 0, r * 0.62, 0, 7); g.fillStyle = '#F2B33D'; g.fill();
    A.line(g, '#3E3446', 3.5, (h) => { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; h.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); h.lineTo(-Math.cos(a) * r * 0.6, -Math.sin(a) * r * 0.6); } });
    g.beginPath(); g.arc(0, 0, r * 0.2, 0, 7); g.fillStyle = '#3E3446'; g.fill();
    g.restore();
  }
  /** Toot's wagon. dx 0 draws it where it sits behind the engine; ACT.wagon centres it on its own wheels. */
  St.wagon = function (g, s, n, dx) {
    const roll = n.roll || 0;
    g.save(); g.translate(dx || 0, 0);
    A.line(g, '#3E3446', 6, (h) => { h.moveTo(-112, -34); h.lineTo(-136, -34); });
    if (n.cargo) for (let i = 0; i < 3; i++) St.item[n.cargo](g, s, -254 + i * 44, -108 - (i === 1 ? 12 : 0), 1.05);
    piece(g, s, '#C08A5A', (h) => A.rect(h, -292, -100, 160, 68, 8, 5), { shadow: 0.8, box: { x: -292, y: -100, w: 160, h: 68 } });
    A.line(g, 'rgba(90,60,40,.3)', 2.5, (h) => { for (const x of [-252, -212, -172]) { h.moveTo(x, -96); h.lineTo(x, -36); } });
    piece(g, s, '#A8754F', (h) => A.rect(h, -298, -106, 172, 14, 6, 6), { shadow: 0.4 });
    wheel(g, s, -256, 22, roll); wheel(g, s, -168, 22, roll);
    g.restore();
  };
  St.toot = function (g, s, n) {
    const roll = n.roll || 0, red = '#D9483B', sq = n.sq || 0;
    g.save(); g.scale(1 - sq * 0.3, 1 + sq);
    if (n.wagon !== false) St.wagon(g, s, n, 0);
    // engine
    piece(g, s, A.shade(red, -0.06), (h) => A.rect(h, -106, -170, 88, 140, 10, 2), { shadow: 0.8, box: { x: -106, y: -170, w: 88, h: 140 } });
    piece(g, s, '#CFE6E8', (h) => A.rect(h, -90, -152, 54, 46, 8, 3, 0.4), { shadow: 0, grain: 0.05 });
    A.line(g, 'rgba(255,255,255,.7)', 4, (h) => { h.moveTo(-80, -116); h.lineTo(-62, -144); });
    piece(g, s, '#5A4256', (h) => A.rect(h, -118, -188, 112, 22, 9, 4), { shadow: 0.6 });
    piece(g, s, '#5A4256', (h) => A.cut(h, [[62, -120], [56, -166], [100, -166], [94, -120]], 4, 0.5, 5), { shadow: 0.5 });
    piece(g, s, '#6E4E7E', (h) => A.rect(h, 48, -180, 60, 18, 8, 6), { shadow: 0.4 });
    piece(g, s, '#F2B33D', (h) => { h.moveTo(-10, -122); h.arc(8, -122, 18, Math.PI, 0); h.closePath(); }, { shadow: 0.4 });
    piece(g, s, red, (h) => A.rect(h, -30, -126, 156, 98, [18, 40, 22, 10], 7), { shadow: 0.8, box: { x: -30, y: -126, w: 156, h: 98 }, light: 0.09 });
    g.beginPath(); A.rect(g, 14, -126, 11, 98, 3, 2, 0); g.fillStyle = '#F2B33D'; g.fill();
    piece(g, s, '#3E3446', (h) => A.rect(h, -114, -38, 246, 18, 7, 8), { shadow: 0.5 });
    piece(g, s, '#F2B33D', (h) => A.cut(h, [[126, -40], [156, -6], [118, -6]], 5, 0.5, 9), { shadow: 0.5 });
    // face
    const bl = n.sleep ? 1 : n.blink || 0;
    if (n.sleep) { A.line(g, A.C.ink, 4, (h) => { for (const x of [56, 96]) { h.moveTo(x - 9, -90); h.quadraticCurveTo(x, -82, x + 9, -90); } }); }
    else { eye(g, 56, -92, 9, 12, bl, n.look); eye(g, 96, -92, 9, 12, bl, n.look); }
    cheek(g, 40, -68, 10); cheek(g, 112, -68, 10);
    if (n.mouth === 'oh') { g.beginPath(); g.ellipse(76, -62, 7, 9, 0, 0, 7); g.fillStyle = '#7A2F35'; g.fill(); }
    else if (n.mouth === 'open') { g.beginPath(); g.moveTo(62, -70); g.quadraticCurveTo(76, -66, 90, -70); g.quadraticCurveTo(88, -50, 76, -50); g.quadraticCurveTo(64, -50, 62, -70); g.fillStyle = '#7A2F35'; g.fill(); }
    else smile(g, 76, -70, 12, n.sleep ? 5 : 11, 4);
    wheel(g, s, -70, 30, roll); wheel(g, s, 14, 25, roll); wheel(g, s, 88, 25, roll);
    g.restore();
  };

  const ACT = {
    pip: (g, s, n, t) => A.pip(g, s, { blink: n.blink, squash: n.sq, look: n.look, mouth: n.mouth, wave: n.wave, leaf: Math.sin(t * 2) * 0.08 }),
    star: (g, s, n, t) => St.star(g, s, n, t),
    toot: (g, s, n) => St.toot(g, s, n),
    wagon: (g, s, n) => St.wagon(g, s, n, 212),
  };
  St.actor = function (g, s, n, t) { (ACT[n.kind] || ((g2, s2, n2) => St.critter(g2, s2, n2, n2.kind)))(g, s, n, t); };
  St.hit = { pip: { x: -70, y: -150, w: 140, h: 155 }, star: { x: -72, y: -138, w: 144, h: 144 }, critter: { x: -60, y: -175, w: 120, h: 180 }, toot: { x: -140, y: -190, w: 300, h: 195 }, wagon: { x: -90, y: -130, w: 180, h: 130 } };

  /* ---------------- props ---------------- */
  const P = St.prop, B = St.box;
  B.moon = [-80, -80, 160, 160];
  P.moon = function (g, s) {
    const gr = g.createRadialGradient(0, 0, 50, 0, 0, 150); gr.addColorStop(0, 'rgba(255,244,200,.35)'); gr.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 150, 0, 7); g.fill();
    piece(g, s, '#FBF1CF', (h) => h.arc(0, 0, 68, 0, 7), { shadow: 0.5, box: { x: -68, y: -68, w: 136, h: 136 }, light: 0.06 });
    for (const [x, y, r] of [[-30, -28, 9], [26, 30, 12], [34, -22, 6]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = 'rgba(210,190,140,.35)'; g.fill(); }
    A.line(g, A.C.ink, 3.5, (h) => { for (const x of [-18, 18]) { h.moveTo(x - 8, -4); h.quadraticCurveTo(x, 4, x + 8, -4); } });
    cheek(g, -32, 14, 9); cheek(g, 32, 14, 9); smile(g, 0, 14, 8, 6, 3);
  };
  B.sun = [-110, -110, 220, 220];
  P.sun = function (g, s) {
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.save(); g.rotate(a); g.beginPath(); A.rect(g, 78, -7, i % 2 ? 22 : 30, 14, 7, i, 0); g.fillStyle = '#F6C95A'; g.fill(); g.restore(); }
    piece(g, s, '#F6C445', (h) => h.arc(0, 0, 66, 0, 7), { shadow: 0.4, box: { x: -66, y: -66, w: 132, h: 132 }, light: 0.1 });
    eye(g, -20, -6, 7, 9); eye(g, 20, -6, 7, 9); cheek(g, -36, 14, 10); cheek(g, 36, 14, 10); smile(g, 0, 12, 12, 10, 3.5);
  };
  B.planet = [-100, -70, 200, 140];
  P.planet = function (g, s) {
    A.line(g, '#F4B49A', 9, (h) => h.ellipse(0, 0, 92, 22, -0.3, Math.PI * 0.95, Math.PI * 2.05));
    piece(g, s, '#8C6BB0', (h) => h.arc(0, 0, 54, 0, 7), { shadow: 0.5, box: { x: -54, y: -54, w: 108, h: 108 }, light: 0.1 });
    for (const [y, w] of [[-18, 44], [10, 50]]) { g.beginPath(); A.rect(g, -w, y, w * 2, 9, 4, 3, 0); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill(); }
    A.line(g, '#F4B49A', 9, (h) => h.ellipse(0, 0, 92, 22, -0.3, Math.PI * 0.05, Math.PI * 0.95));
  };
  B.house = [-160, -280, 320, 290];
  P.house = function (g, s, o) {
    const lit = o && o.lit;
    piece(g, s, c('#A65441'), (h) => A.rect(h, 60, -236, 36, 80, 4, 11), { shadow: 0.5 });
    piece(g, s, c('#F3E4C8'), (h) => A.rect(h, -112, -150, 224, 150, 8, 3), { box: { x: -112, y: -150, w: 224, h: 150 } });
    piece(g, s, c('#D9614A'), (h) => A.cut(h, [[-146, -140], [0, -256], [146, -140]], [12, 18, 12], 1.2, 4), { box: { x: -146, y: -256, w: 292, h: 116 }, depth: 1.2 });
    piece(g, s, c('#FBF8F1'), (h) => { h.moveTo(-30, 0); h.lineTo(-30, -78); h.arc(0, -78, 30, Math.PI, 0); h.lineTo(30, 0); h.closePath(); }, { shadow: 0.4, grain: 0.1 });
    piece(g, s, c('#2F8F8A'), (h) => { h.moveTo(-22, 0); h.lineTo(-22, -78); h.arc(0, -78, 22, Math.PI, 0); h.lineTo(22, 0); h.closePath(); }, { shadow: 0 });
    g.beginPath(); g.arc(12, -44, 4, 0, 7); g.fillStyle = '#F2B33D'; g.fill();
    for (const x of [-78, 78]) {
      piece(g, s, c('#FBF8F1'), (h) => A.rect(h, x - 24, -112, 48, 50, 6, 5), { shadow: 0.4, grain: 0.1 });
      g.beginPath(); A.rect(g, x - 18, -106, 36, 38, 4, 6, 0); g.fillStyle = lit ? '#F7D27A' : c('#BFE3EE'); g.fill();
      A.line(g, c('#FBF8F1'), 3, (h) => { h.moveTo(x, -106); h.lineTo(x, -68); h.moveTo(x - 18, -87); h.lineTo(x + 18, -87); });
    }
    piece(g, s, c('#FBF8F1'), (h) => h.arc(0, -178, 18, 0, 7), { shadow: 0.3, grain: 0.1 });
    g.beginPath(); g.arc(0, -178, 12, 0, 7); g.fillStyle = lit ? '#F7D27A' : c('#BFE3EE'); g.fill();
  };
  /** n = {fire: 0..1, riders} */
  P.rocket = function (g, s, n, t) {
    const fire = n.fire || 0;
    if (fire > 0) for (const [w, l, col] of [[30, 130, '#F08A35'], [18, 90, '#F6D365']]) { const k = fire * (0.8 + 0.2 * Math.sin(t * 40 + w)); g.beginPath(); g.moveTo(-w, -14); g.quadraticCurveTo(-w * 0.8, l * k * 0.5, 0, l * k); g.quadraticCurveTo(w * 0.8, l * k * 0.5, w, -14); g.closePath(); g.fillStyle = col; g.fill(); }
    for (const side of [-1, 1]) piece(g, s, '#6E4E7E', (h) => A.cut(h, [[side * 34, -110], [side * 84, -16], [side * 34, -34]], [6, 12, 4], 0.6, 5), { shadow: 0.6 });
    piece(g, s, '#3E3446', (h) => A.rect(h, -26, -34, 52, 22, 6, 4), { shadow: 0.4 });
    const body = (h) => { h.moveTo(0, -292); h.bezierCurveTo(56, -230, 58, -100, 40, -30); h.lineTo(-40, -30); h.bezierCurveTo(-58, -100, -56, -230, 0, -292); h.closePath(); };
    piece(g, s, '#E2553F', body, { shadow: 0.9, box: { x: -52, y: -292, w: 104, h: 262 }, light: 0.1 });
    g.save(); g.beginPath(); body(g); g.clip(); g.fillStyle = '#FBF1DF'; g.fillRect(-60, -300, 120, 74); g.fillStyle = '#F2B33D'; g.fillRect(-60, -74, 120, 14); g.restore();
    piece(g, s, '#FBF8F1', (h) => h.arc(0, -160, 34, 0, 7), { shadow: 0.4, grain: 0.1 });
    g.beginPath(); g.arc(0, -160, 25, 0, 7); g.fillStyle = n.riders ? '#FCE9A6' : '#BFE3EE'; g.fill();
    if (n.riders) { g.beginPath(); St.starPath(g, 0, -158, 17, 9.5, 3); g.fillStyle = '#F6C445'; g.fill(); g.beginPath(); g.arc(-5, -160, 2, 0, 7); g.arc(5, -160, 2, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
    else A.line(g, 'rgba(255,255,255,.8)', 4, (h) => { h.moveTo(-12, -150); h.lineTo(2, -174); });
  };
  /** n = {grey, sleepy, alpha} */
  P.cloud = function (g, s, n, t) {
    const col = n.grey ? '#8C96AA' : '#FBF8F1';
    g.beginPath(); A.blob(g, -72, 2, 62, 44, 0.04, 3, 9); A.blob(g, 0, -24, 78, 58, 0.04, 4, 10); A.blob(g, 76, 4, 60, 42, 0.04, 5, 9); A.blob(g, 0, 18, 112, 34, 0.03, 6, 10);
    A.paper(g, s, col, { shadow: 0.6, light: 0.06, box: { x: -130, y: -80, w: 260, h: 130 }, grain: 0.14 });
    const ink = n.grey ? '#3E4660' : A.alpha(A.C.ink, 0.7);
    if (n.awake) { eye(g, -24, -6, 7, 9, n.blink); eye(g, 24, -6, 7, 9, n.blink); }
    else A.line(g, ink, 3.5, (h) => { for (const x of [-24, 24]) { h.moveTo(x - 9, -6); h.quadraticCurveTo(x, 2, x + 9, -6); } });
    cheek(g, -44, 12, 9); cheek(g, 44, 12, 9);
    if (n.puff) { g.beginPath(); g.ellipse(0, 14, 7, 8, 0, 0, 7); g.fillStyle = ink; g.fill(); } else A.line(g, ink, 3, (h) => { h.moveTo(-7, 12); h.quadraticCurveTo(0, 18, 7, 12); });
  };
  St.hit.cloud = { x: -140, y: -90, w: 280, h: 150 };
  /** n = {rip: time of last splash} */
  P.puddle = function (g, s, n, t) {
    piece(g, s, '#5E8F68', (h) => A.blob(h, 0, 0, 206, 54, 0.03, 4, 14), { shadow: 0, light: 0 });
    piece(g, s, '#7FB7D6', (h) => A.blob(h, 0, 0, 190, 44, 0.03, 5, 14), { shadow: 0, light: 0.1, box: { x: -190, y: -44, w: 380, h: 88 }, grain: 0.1 });
    g.beginPath(); g.ellipse(-70, -12, 60, 9, -0.05, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
    const age = t - (n.rip == null ? -9 : n.rip);
    if (age < 1.6) for (let i = 0; i < 3; i++) { const k = age / 1.6 - i * 0.18; if (k <= 0 || k > 1) continue; g.beginPath(); g.ellipse(n.ripX || 0, 0, 40 + k * 150, 9 + k * 34, 0, 0, 7); g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; g.lineWidth = 4; g.stroke(); }
  };
  St.hit.puddle = { x: -200, y: -70, w: 400, h: 130 };
  P.rainbow = function (g) {
    const cols = ['#E8664A', '#F2A03D', '#F5DD6A', '#7DB65F', '#5B8FC7', '#8C6BB0'];
    cols.forEach((col, i) => { g.beginPath(); g.arc(0, 0, 330 - i * 22, Math.PI, 0); g.strokeStyle = col; g.lineWidth = 23; g.stroke(); });
  };
  B.den = [-220, -250, 440, 260];
  P.den = function (g, s) {
    piece(g, s, c('#8E7C6A'), (h) => { h.moveTo(-206, 0); h.bezierCurveTo(-216, -180, -110, -246, 0, -240); h.bezierCurveTo(120, -246, 214, -170, 206, 0); h.closePath(); }, { box: { x: -206, y: -240, w: 412, h: 240 }, depth: 1.3 });
    for (const [x, y, r] of [[-130, -120, 26], [128, -90, 22], [60, -200, 18], [-60, -206, 14]]) { g.beginPath(); A.blob(g, x, y, r, r * 0.8, 0.08, x + 300, 8); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); }
    piece(g, s, c('#3A2F3A'), (h) => { h.moveTo(-92, 0); h.lineTo(-92, -70); h.bezierCurveTo(-92, -170, 92, -170, 92, -70); h.lineTo(92, 0); h.closePath(); }, { shadow: 0, grain: 0.1 });
    piece(g, s, c('#6FA65F'), (h) => { A.blob(h, -150, -224, 60, 22, 0.08, 3); A.blob(h, -20, -246, 90, 24, 0.08, 4); A.blob(h, 130, -210, 66, 22, 0.08, 5); }, { shadow: 0.4 });
  };
  B.shed = [-210, -290, 420, 300];
  P.shed = function (g, s) {
    piece(g, s, c('#4E8F8B'), (h) => A.rect(h, -180, -210, 360, 210, 8, 3), { box: { x: -180, y: -210, w: 360, h: 210 } });
    A.line(g, 'rgba(30,60,60,.25)', 3, (h) => { for (let x = -150; x < 180; x += 44) { h.moveTo(x, -206); h.lineTo(x, -4); } });
    piece(g, s, c('#3A2F3A'), (h) => { h.moveTo(-126, 0); h.lineTo(-126, -100); h.bezierCurveTo(-126, -180, 126, -180, 126, -100); h.lineTo(126, 0); h.closePath(); }, { shadow: 0, grain: 0.1 });
    piece(g, s, c('#D9614A'), (h) => A.cut(h, [[-206, -196], [0, -282], [206, -196]], [10, 16, 10], 1.2, 4), { depth: 1.2, box: { x: -206, y: -282, w: 412, h: 86 } });
    piece(g, s, c('#F2B33D'), (h) => h.arc(0, -214, 16, 0, 7), { shadow: 0.4 });
  };
  /** A wooden crate of things: o.cargo */
  B.crate = [-76, -120, 152, 124];
  P.crate = function (g, s, o) {
    for (let i = 0; i < 3; i++) St.item[o.cargo || 'apples'](g, s, -40 + i * 40, -78 - (i === 1 ? 14 : 0), 1.15);
    piece(g, s, '#C08A5A', (h) => A.rect(h, -66, -70, 132, 70, 7, 5), { shadow: 0.8, box: { x: -66, y: -70, w: 132, h: 70 } });
    A.line(g, 'rgba(90,60,40,.32)', 2.5, (h) => { h.moveTo(-64, -46); h.lineTo(64, -46); h.moveTo(-64, -22); h.lineTo(64, -22); });
    for (const x of [-56, 46]) { g.beginPath(); A.rect(g, x, -70, 10, 70, 3, 2, 0); g.fillStyle = '#A8754F'; g.fill(); }
  };
  B.town = [-340, -250, 680, 260];
  P.town = function (g, s) {
    V.tree(g, s, -290, 0, 190, 7, 0); V.tree(g, s, 300, 0, 170, 9, 0);
    V.farmhouse(g, s, -190, 0, 2.5); V.farmhouse(g, s, 180, 0, 2.3);
    piece(g, s, c('#F3E4C8'), (h) => A.rect(h, -70, -130, 140, 130, 6, 3), { box: { x: -70, y: -130, w: 140, h: 130 } });
    piece(g, s, c('#5B8FC7'), (h) => A.cut(h, [[-88, -124], [0, -200], [88, -124]], [8, 12, 8], 1, 4), { depth: 1.1 });
    piece(g, s, c('#FBF8F1'), (h) => h.arc(0, -150, 15, 0, 7), { shadow: 0.3 }); A.line(g, A.C.ink, 2.5, (h) => { h.moveTo(0, -150); h.lineTo(0, -160); h.moveTo(0, -150); h.lineTo(7, -147); });
    piece(g, s, c('#D9614A'), (h) => { h.moveTo(-18, 0); h.lineTo(-18, -52); h.arc(0, -52, 18, Math.PI, 0); h.lineTo(18, 0); h.closePath(); }, { shadow: 0.2 });
    for (const x of [-44, 44]) { g.beginPath(); A.rect(g, x - 12, -92, 24, 26, 4, 3, 0); g.fillStyle = c('#BFE3EE'); g.fill(); }
    // bunting
    A.line(g, 'rgba(46,42,59,.4)', 2, (h) => { h.moveTo(-200, -140); h.quadraticCurveTo(-130, -110, -70, -128); h.moveTo(70, -128); h.quadraticCurveTo(130, -104, 196, -128); });
    [[-170, -128], [-140, -121], [-108, -122], [100, -119], [132, -114], [164, -118]].forEach(([x, y], i) => { g.beginPath(); A.cut(g, [[x - 9, y], [x + 9, y], [x, y + 18]], 2, 0, i); g.fillStyle = ['#E8664A', '#F2B33D', '#2F8F8A'][i % 3]; g.fill(); });
  };
  /** The empty place in the sky where Little Star belongs. */
  P.gap = function (g, s, n, t) {
    g.save(); g.translate(0, -66); g.setLineDash([12, 10]); g.lineDashOffset = -t * 14;
    g.beginPath(); St.starPath(g, 0, 0, 66, 36, 12); g.strokeStyle = `rgba(255,244,200,${0.6 + 0.3 * Math.sin(t * 3)})`; g.lineWidth = 5; g.stroke(); g.restore();
  };
  /** A small star in the sky. n = {glow 0..1, hello} */
  P.ministar = function (g, s, n, t) {
    const gl = n.glow == null ? 1 : n.glow, tw = 1 + Math.sin(t * 3 + (n.ph || 0)) * 0.06 * gl;
    g.save(); g.translate(0, -40); g.scale(tw, tw);
    const gr = g.createRadialGradient(0, 0, 10, 0, 0, 80); gr.addColorStop(0, `rgba(255,236,160,${0.5 * gl})`); gr.addColorStop(1, 'rgba(255,236,160,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 80, 0, 7); g.fill();
    g.beginPath(); St.starPath(g, 0, 0, 42, 23, 8); A.paper(g, s, A.mix('#8E8A6A', '#F9D66B', gl), { shadow: 0.4, light: 0.08, box: { x: -42, y: -42, w: 84, h: 84 }, grain: 0.12 });
    if (gl > 0.5) { eye(g, -10, -2, 4.5, 6, n.blink); eye(g, 10, -2, 4.5, 6, n.blink); smile(g, 0, 9, 6, 5, 2.5); }
    g.restore();
  };
  St.hit.ministar = { x: -50, y: -92, w: 100, h: 100 };

  /** Rails along a curve y(x), drawn from x0 to x1. */
  St.track = function (g, s, y, x0, x1) {
    for (let x = x0; x <= x1; x += 34) { const a = Math.atan2(y(x + 6) - y(x - 6), 12); g.save(); g.translate(x, y(x)); g.rotate(a); g.beginPath(); A.rect(g, -8, -2, 16, 12, 3, x, 0); g.fillStyle = '#8A5A3C'; g.fill(); g.restore(); }
    A.line(g, '#5C5568', 6, (h) => { h.moveTo(x0, y(x0) - 3); for (let x = x0; x <= x1 + 8; x += 8) h.lineTo(x, y(x) - 3); });
    A.line(g, 'rgba(255,255,255,.3)', 2, (h) => { h.moveTo(x0, y(x0) - 5); for (let x = x0; x <= x1 + 8; x += 8) h.lineTo(x, y(x) - 5); });
  };
  /** A big hill under the curve y(x). */
  St.bigHill = function (g, s, y, x0, x1, bottom, col) {
    g.beginPath(); g.moveTo(x0, bottom); for (let x = x0; x <= x1 + 10; x += 10) g.lineTo(x, y(x)); g.lineTo(x1 + 10, bottom); g.closePath();
    A.paper(g, s, col, { shadow: 0.8, light: 0.06, box: { x: x0, y: bottom - 500, w: 0, h: 500 } });
  };

  /* ---------------- page backdrops ---------------- */
  const PAL = {
    night: { sky: ['#141B3C', '#2B3466', '#4B4C82'], hills: ['#2E3B68', '#2A4660'], ground: '#2F5A52', stars: 70, mood: 'night' },
    day: { sky: ['#9FCBD8', '#CFE6E8', '#F3E9D6'], hills: ['#A9C9B4', '#7FB08A'], ground: '#74AC73', mood: 'day' },
    rain: { sky: ['#8496AA', '#AEBDC8', '#D2D8D6'], hills: ['#93AFA4', '#779C88'], ground: '#6C9C74', mood: 'day' },
    eve: { sky: ['#4E4F8E', '#B98AA6', '#F2C79A'], hills: ['#5F5E96', '#4F6488'], ground: '#44756A', stars: 24, mood: 'dusk' },
    space: { sky: ['#0C102B', '#1A1F4E', '#3A3472'], stars: 150, none: true, mood: 'night' },
  };
  St.mood = (kind) => (PAL[kind] || PAL.day).mood;
  /** o = {moon, sun, planet, trees:[[fx, size, seed]], flat} */
  St.bg = function (g, s, kind, W, H, G, o) {
    o = o || {}; const p = PAL[kind] || PAL.day; const m = A.mood; A.mood = p.mood;
    const gr = g.createLinearGradient(0, 0, 0, p.none ? H : G); gr.addColorStop(0, p.sky[0]); gr.addColorStop(0.6, p.sky[1]); gr.addColorStop(1, p.sky[2]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (p.stars) { const r = A.rng(5); for (let i = 0; i < p.stars; i++) { g.beginPath(); g.arc(r() * W, r() * (p.none ? H : G - 140), 0.8 + r() * 2.4, 0, 7); g.fillStyle = `rgba(255,246,218,${0.35 + r() * 0.55})`; g.fill(); } }
    const at = (x, y, k, fn) => { g.save(); g.translate(x, y); g.scale(k, k); fn(g, s, {}); g.restore(); };
    if (o.moon) at(W * (o.moon === 2 ? 0.84 : W < 1000 ? 0.36 : 0.21), W < 1000 ? 250 : 200, W < 1000 ? 0.8 : 1.15, P.moon);
    if (o.sun) at(W * 0.86, W < 1000 ? 260 : 200, W < 1000 ? 0.75 : 0.95, P.sun);
    if (o.planet) at(W * 0.8, H * 0.2, W < 1000 ? 0.8 : 1.1, P.planet);
    if (!p.none) {
      V.hill(g, s, 0, W, G - 80, 170, 900, 11, p.hills[0], H);
      V.hill(g, s, 0, W, G - 14, 90, 640, 23, p.hills[1], H);
      for (const [fx, size, seed] of o.trees || []) V.tree(g, s, fx * W, G - 6, size, seed, 0);
      if (!o.bare) { V.bush(g, s, W * 0.02, G + 4, 150, 3); V.bush(g, s, W * 0.985, G + 2, 130, 8); }
      V.hill(g, s, 0, W, G + 8, 22, 520, 31, p.ground, H);
      const r = A.rng(77);
      for (let i = 0; i < Math.round(W / 70); i++) { const x = r() * W, y = G + 30 + r() * (H - G - 40); V.tuft(g, s, x, y, 12 + r() * 12, i, A.shade(p.ground, -0.05)); if (kind === 'day' && r() < 0.4) V.flower(g, s, x + 30, y + 6, 9 + r() * 5, ['#FBF8F1', '#F2B33D', '#F4B49A'][i % 3]); }
    }
    A.mood = m;
  };

  /* ---------------- the reading nook (inside the story tree) ---------------- */
  St.nook = function (g, s, W, H, shelfY, shelfW) {
    const port = W < 1000, fy = H - (port ? 250 : 170);
    g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#D8B88E', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.05, grain: 0.3 });
    // bark rings of the tree wall
    A.line(g, 'rgba(120,80,50,.16)', 5, (h) => { for (let i = 0; i < 7; i++) { const x = W * (0.08 + i * 0.15); h.moveTo(x, 0); h.bezierCurveTo(x + 30, H * 0.3, x - 30, H * 0.6, x + 10, fy); } });
    // round window with leaves
    const wx = port ? W * 0.76 : W * 0.86, wy = port ? 290 : 250, wr = port ? 100 : 104;
    piece(g, s, '#A8754F', (h) => h.arc(wx, wy, wr + 16, 0, 7), { shadow: 0.8 });
    g.save(); g.beginPath(); g.arc(wx, wy, wr, 0, 7); g.clip();
    const gr = g.createLinearGradient(0, wy - wr, 0, wy + wr); gr.addColorStop(0, '#9FCBD8'); gr.addColorStop(1, '#E9EFD9'); g.fillStyle = gr; g.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
    V.hill(g, s, wx - wr, wx + wr, wy + wr * 0.7, 40, 260, 5, '#8DBB8A', wy + wr);
    for (const [dx, dy, r, col] of [[-0.8, -0.7, 0.5, '#6FA65F'], [-0.3, -0.95, 0.42, '#93C27A'], [0.7, -0.8, 0.5, '#4F8752'], [0.95, -0.2, 0.3, '#6FA65F']]) { g.beginPath(); A.blob(g, wx + dx * wr, wy + dy * wr, r * wr, r * wr * 0.8, 0.08, 4 + r * 10); g.fillStyle = col; g.fill(); }
    g.restore();
    A.line(g, '#A8754F', 9, (h) => { h.moveTo(wx - wr, wy); h.lineTo(wx + wr, wy); h.moveTo(wx, wy - wr); h.lineTo(wx, wy + wr); });
    // bunting
    const bx0 = port ? 40 : W * 0.2, bx1 = port ? W * 0.56 : W * 0.72, by = port ? 200 : 118;
    A.line(g, 'rgba(46,42,59,.4)', 2.5, (h) => { h.moveTo(bx0, by); h.quadraticCurveTo((bx0 + bx1) / 2, by + 50, bx1, by); });
    for (let i = 1; i < 9; i++) { const t = i / 9, x = bx0 + (bx1 - bx0) * t, y = by + 100 * t * (1 - t) + 2; g.beginPath(); A.cut(g, [[x - 15, y], [x + 15, y], [x, y + 30]], 3, 0.5, i); A.paper(g, s, ['#E8664A', '#F2B33D', '#2F8F8A', '#F4B49A', '#6E4E7E'][i % 5], { shadow: 0.5 }); }
    // floor and rug
    g.beginPath(); g.rect(0, fy, W, H - fy); A.paper(g, s, '#B98558', { shadow: 0, grain: 0.3, light: 0 });
    A.line(g, 'rgba(90,60,40,.3)', 3, (h) => { h.moveTo(0, fy); h.lineTo(W, fy); for (let x = 80; x < W; x += 220) { h.moveTo(x, fy); h.lineTo(x - 50, H); } });
    piece(g, s, '#C9553F', (h) => h.ellipse(W / 2, fy + (H - fy) * 0.55, Math.min(W * 0.4, 520), (H - fy) * 0.34, 0, 0, 7), { shadow: 0.5, light: 0.04 });
    A.line(g, '#F3DDB8', 6, (h) => h.ellipse(W / 2, fy + (H - fy) * 0.55, Math.min(W * 0.4, 520) - 26, (H - fy) * 0.34 - 16, 0, 0, 7));
    // the shelf
    const x0 = W / 2 - shelfW / 2;
    piece(g, s, '#C99666', (h) => A.rect(h, x0 - 20, shelfY - (port ? 330 : 440), shelfW + 40, (port ? 330 : 440) + 30, 18, 4, 1.2), { shadow: 1.2, depth: 1.5, box: { x: x0, y: shelfY - 440, w: shelfW, h: 470 } });
    piece(g, s, '#8E6644', (h) => A.rect(h, x0, shelfY - (port ? 310 : 420), shelfW, port ? 310 : 420, 10, 5, 0.8), { shadow: 0, light: 0.03, box: { x: x0, y: shelfY - 420, w: shelfW, h: 420 } });
    piece(g, s, '#D9AE7C', (h) => A.rect(h, x0 - 26, shelfY, shelfW + 52, 30, 10, 6), { shadow: 1, box: { x: x0, y: shelfY, w: shelfW, h: 30 } });
    // a cushion and a lamp
    if (!port) {
      piece(g, s, '#2F8F8A', (h) => A.blob(h, W * 0.12, fy + 46, 120, 56, 0.05, 8, 10), { shadow: 0.9, box: { x: W * 0.12 - 120, y: fy - 10, w: 240, h: 112 } });
      piece(g, s, '#F2B33D', (h) => A.blob(h, W * 0.9, fy + 60, 96, 46, 0.05, 9, 10), { shadow: 0.9, box: { x: W * 0.9 - 96, y: fy + 14, w: 192, h: 92 } });
    }
  };
  /** A hanging ribbon for a finished book. */
  St.ribbon = function (g, s) {
    piece(g, s, '#E2483F', (h) => A.cut(h, [[-18, -8], [18, -8], [18, 92], [0, 74], [-18, 92]], [3, 3, 3, 3, 3], 0.6, 4), { shadow: 0.8, light: 0.08, box: { x: -18, y: -8, w: 36, h: 100 } });
    g.beginPath(); St.starPath(g, 0, 30, 12, 6.5, 2); g.fillStyle = '#F6C445'; g.fill();
  };
})();
