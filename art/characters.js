/* Pip's Playhouse — characters. One kit: soft cut-paper bodies, solid ink eyes with a highlight,
   rosy cheeks, light from the top-left. Characters are drawn live each frame (they blink, breathe
   and squash), so these take a small state object instead of being cached. */
(function () {
  'use strict';
  const A = K.art;

  function eye(g, x, y, rx, ry, blink, look) { // look shifts the pupil sideways
    const k = Math.max(0.12, 1 - (blink || 0));
    g.save(); g.translate(x + (look || 0) * rx * 0.35, y);
    g.beginPath(); g.ellipse(0, 0, rx, ry * k, 0, 0, Math.PI * 2); g.fillStyle = A.C.ink; g.fill();
    if (k > 0.5) { g.beginPath(); g.arc(rx * 0.32, -ry * 0.38 * k, rx * 0.36, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); }
    g.restore();
  }
  function cheek(g, x, y, r) { g.beginPath(); g.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); g.fillStyle = A.alpha(A.C.tomato, 0.32); g.fill(); }
  /** Paper body without the drop shadow (live characters cast a ground shadow instead). */
  function body(g, s, color, trace, box, grain) { g.beginPath(); trace(g); A.paper(g, s, color, { shadow: 0, light: 0.07, box, grain: grain == null ? 0.2 : grain }); }
  function groundShadow(g, rx, y) { g.beginPath(); g.ellipse(0, y || 0, rx, rx * 0.18, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(40,34,60,.16)'; g.fill(); }
  A.groundShadow = groundShadow;

  /* ---------------- Pip ---------------- */
  const PIP_BODY = [[0, -132], [40, -123], [61, -90], [65, -47], [53, -13], [25, 0], [-25, 0], [-53, -13], [-65, -47], [-61, -90], [-40, -123]];
  function leaf(g, s, x, y, ang, len, wid, color) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(wid, -len * 0.45, 0, -len); g.quadraticCurveTo(-wid, -len * 0.45, 0, 0);
    A.paper(g, s, color, { shadow: 0, light: 0.08, box: { x: -wid, y: -len, w: wid * 2, h: len } });
    A.line(g, A.shade(color, -0.12), 2, (h) => { h.moveTo(0, -3); h.quadraticCurveTo(wid * 0.15, -len * 0.5, 0, -len * 0.85); });
    g.restore();
  }
  /** Pip, about 150 units tall, feet at (0,0).
      st: {blink, squash (+ stretches tall), look (-1..1), mouth: 'smile'|'open'|'oh', leaf (sway radians), wave} */
  A.pip = function (g, s, st) {
    st = st || {};
    const sq = st.squash || 0;
    groundShadow(g, 54 * (1 + Math.max(0, -sq) * 0.6), 0);
    g.save(); g.scale(1 - sq * 0.5, 1 + sq);
    const col = A.ct('#EE9A4E');
    // feet
    for (const fx of [-24, 24]) { g.beginPath(); g.ellipse(fx, -4, 17, 9, 0, 0, Math.PI * 2); g.fillStyle = A.shade(col, -0.12); g.fill(); }
    // leaves (behind the head)
    const sway = st.leaf || 0;
    leaf(g, s, -4, -126, -0.55 + sway, 48, 17, A.ct('#6FAE5E'));
    leaf(g, s, 4, -126, 0.5 + sway * 0.8, 40, 15, A.ct('#4F9A5C'));
    // body
    body(g, s, col, (h) => A.smooth(h, PIP_BODY), { x: -65, y: -132, w: 130, h: 132 });
    // side shade, cut-paper style: a darker crescent on the right
    g.save(); g.beginPath(); A.smooth(g, PIP_BODY); g.clip();
    g.beginPath(); g.ellipse(34, -40, 46, 92, -0.2, 0, Math.PI * 2); g.fillStyle = A.alpha(A.shade(col, -0.1), 0.45); g.fill();
    // belly
    g.beginPath(); A.blob(g, -2, -40, 38, 31, 0.03, 5, 10); g.fillStyle = A.ct('#F8DDB4'); g.fill();
    g.restore();
    // arms: little paper ovals; one can wave
    const wave = st.wave || 0;
    for (const side of [-1, 1]) {
      g.save(); g.translate(side * 58, -58); g.rotate(side * (0.5 + (side > 0 ? wave * 1.4 : 0)));
      g.beginPath(); g.ellipse(0, 12, 11, 20, 0, 0, Math.PI * 2); g.fillStyle = A.shade(col, -0.05); g.fill(); g.restore();
    }
    // face
    const look = st.look || 0;
    eye(g, -21, -84, 8.5, 11.5, st.blink, look); eye(g, 21, -84, 8.5, 11.5, st.blink, look);
    cheek(g, -39, -64, 10); cheek(g, 39, -64, 10);
    g.save(); g.translate(look * 4, 0);
    if (st.mouth === 'open' || st.mouth === 'oh') {
      g.beginPath();
      if (st.mouth === 'oh') g.ellipse(0, -60, 6, 8, 0, 0, Math.PI * 2);
      else { g.moveTo(-12, -64); g.quadraticCurveTo(0, -62, 12, -64); g.quadraticCurveTo(10, -46, 0, -46); g.quadraticCurveTo(-10, -46, -12, -64); }
      g.fillStyle = '#7A2F35'; g.fill();
      if (st.mouth === 'open') { g.beginPath(); g.ellipse(0, -50, 6, 3.5, 0, 0, Math.PI * 2); g.fillStyle = '#E58A8A'; g.fill(); }
    } else A.line(g, A.C.ink, 4, (h) => { h.moveTo(-10, -64); h.quadraticCurveTo(0, -55, 10, -64); });
    g.restore();
    g.restore();
  };

  /* ---------------- Munch, the kitchen monster ---------------- */
  /** About 170 units tall, feet at (0,0). The mouth centre is A.MONSTER_MOUTH.
      st: {blink, squash, open (0..1 mouth), lookX, lookY (-1..1), bleh (tongue out), tint (hex), tintK (0..1), belly (0..1)}
      Older callers may pass mouth:'open' and look. */
  A.MONSTER_MOUTH = { x: 0, y: -44 };
  A.monster = function (g, s, st) {
    st = st || {};
    const sq = st.squash || 0, belly = st.belly || 0;
    const open = st.open != null ? st.open : (st.mouth === 'open' || st.mouth === 'yum' ? 1 : 0);
    const lx = st.lookX != null ? st.lookX : (st.look || 0), ly = st.lookY || 0;
    g.save(); g.scale((1 - sq * 0.45) * (1 + belly * 0.1), 1 + sq);
    let col = A.ct('#8C6BB0'); if (st.tint && st.tintK) col = A.mix(col, st.tint, st.tintK * 0.7);
    // horns
    for (const side of [-1, 1]) {
      g.save(); g.translate(side * 36, -150); g.rotate(side * 0.35);
      g.beginPath(); g.moveTo(-10, 6); g.quadraticCurveTo(-4, -26, 2, -30); g.quadraticCurveTo(10, -12, 10, 6); g.closePath();
      A.paper(g, s, A.ct('marigold'), { shadow: 0, light: 0.08, box: { x: -10, y: -30, w: 20, h: 36 } }); g.restore();
    }
    // arms
    for (const side of [-1, 1]) {
      g.save(); g.translate(side * 80, -76); g.rotate(side * (0.5 - (st.arms || 0) * 1.6));
      g.beginPath(); g.ellipse(0, 16, 14, 30, 0, 0, 7); g.fillStyle = A.shade(col, -0.06); g.fill(); g.restore();
    }
    const pts = A.blobPts(0, -82, 84, 82, 12, 0.035, A.rng(31));
    body(g, s, col, (h) => A.smooth(h, pts), { x: -84, y: -164, w: 168, h: 164 });
    g.save(); g.beginPath(); A.smooth(g, pts); g.clip();
    g.beginPath(); g.ellipse(58, -50, 60, 110, -0.25, 0, Math.PI * 2); g.fillStyle = A.alpha(A.shade(col, -0.1), 0.3); g.fill();
    for (const [fx, fy, fr] of [[-52, -118, 5], [-40, -132, 3.5], [-60, -100, 3], [56, -124, 4]]) { g.beginPath(); g.arc(fx, fy, fr, 0, 7); g.fillStyle = A.alpha(A.shade(col, 0.14), 0.9); g.fill(); }
    g.restore();
    // eyes
    const bl = st.blink || 0;
    for (const ex of [-28, 28]) {
      g.beginPath(); g.ellipse(ex, -108, 22, 24 * Math.max(0.12, 1 - bl), 0, 0, Math.PI * 2); g.fillStyle = A.ct('#FBF8F1'); g.fill();
      if (bl < 0.6) eye(g, ex + lx * 8, -106 + ly * 8, 10, 12, 0, 0);
    }
    // mouth
    if (open > 0.06 || st.bleh) {
      const d = 10 + 46 * Math.max(open, st.bleh ? 0.5 : 0);
      g.beginPath(); g.moveTo(-42, -66); g.quadraticCurveTo(0, -72 + 8 * (1 - open), 42, -66); g.bezierCurveTo(40, -66 + d * 1.25, -40, -66 + d * 1.25, -42, -66); g.closePath();
      g.fillStyle = '#5A2440'; g.fill();
      g.save(); g.clip();
      g.beginPath(); g.ellipse(0, -66 + d * 0.92, 20, 10, 0, 0, 7); g.fillStyle = '#E07F92'; g.fill();
      for (const tx of [-22, 6]) { g.beginPath(); A.rect(g, tx, -72, 15, 15, 4, 3, 0); g.fillStyle = '#FBF8F1'; g.fill(); }
      g.restore();
      if (st.bleh) { g.beginPath(); g.moveTo(-14, -52); g.quadraticCurveTo(-16, -20, 0, -18); g.quadraticCurveTo(16, -20, 14, -52); g.closePath(); g.fillStyle = '#E07F92'; g.fill(); A.line(g, '#C4607A', 2.5, (h) => { h.moveTo(0, -48); h.lineTo(0, -26); }); }
    } else {
      A.line(g, A.C.ink, 5, (h) => { h.moveTo(-34, -62); h.quadraticCurveTo(0, -34, 34, -62); });
      g.beginPath(); g.moveTo(-16, -53); g.lineTo(-9, -42); g.lineTo(-2, -50); g.closePath(); g.fillStyle = '#FBF8F1'; g.fill();
    }
    cheek(g, -60, -78, 11); cheek(g, 60, -78, 11);
    g.restore();
  };

  /* ---------------- player faces ---------------- */
  /** Drawn animal faces for player profiles, radius about 50 around (0,0). */
  const FACES = {
    lion: { c: '#F2B33D', mane: '#D9783E', ear: 'round', muzzle: '#F8DDB4' },
    bear: { c: '#A8754F', ear: 'round', muzzle: '#E3C29C' },
    bunny: { c: '#F1E7DA', ear: 'long', inner: '#F0A8A0', muzzle: '#FFFFFF' },
    fox: { c: '#E3793F', ear: 'pointy', inner: '#3E2F3A', muzzle: '#FBF1E4' },
    frog: { c: '#7DB65F', ear: 'frog', muzzle: '#B9D88E' },
    panda: { c: '#F6F3EC', ear: 'round', earC: '#3A3446', patch: '#3A3446', muzzle: '#FFFFFF' },
    cat: { c: '#9A90A8', ear: 'pointy', inner: '#F0B7B0', muzzle: '#E9E3EC', whiskers: true },
    owl: { c: '#7A5A8C', ear: 'tuft', muzzle: '#F2B33D', owl: true },
  };
  A.faces = Object.keys(FACES);
  A.face = function (g, s, id, st) {
    const f = FACES[id] || FACES.lion; st = st || {};
    const earC = f.earC || A.shade(f.c, -0.06);
    if (f.mane) { const p = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rr = i % 2 ? 54 : 68; p.push([Math.cos(a) * rr, 2 + Math.sin(a) * rr]); } g.beginPath(); A.smooth(g, p); A.paper(g, s, f.mane, { shadow: 0.6, box: { x: -62, y: -58, w: 124, h: 120 } }); }
    const ears = (fn) => { for (const side of [-1, 1]) { g.save(); g.scale(side, 1); fn(); g.restore(); } };
    if (f.ear === 'round') ears(() => { g.beginPath(); g.arc(32, -34, 16, 0, 7); A.paper(g, s, earC, { shadow: 0.5, grain: 0.15 }); g.beginPath(); g.arc(32, -34, 8, 0, 7); g.fillStyle = A.shade(earC, -0.1); g.fill(); });
    if (f.ear === 'pointy') ears(() => { g.beginPath(); A.cut(g, [[14, -36], [44, -66], [44, -20]], 6, 0.5, 2); A.paper(g, s, f.c, { shadow: 0.5 }); g.beginPath(); A.cut(g, [[24, -36], [40, -54], [40, -28]], 4, 0, 2); g.fillStyle = f.inner; g.fill(); });
    if (f.ear === 'long') ears(() => { g.save(); g.rotate(0.18); g.beginPath(); g.ellipse(18, -66, 13, 36, 0, 0, 7); A.paper(g, s, f.c, { shadow: 0.5 }); g.beginPath(); g.ellipse(18, -64, 6, 26, 0, 0, 7); g.fillStyle = f.inner; g.fill(); g.restore(); });
    if (f.ear === 'tuft') ears(() => { g.beginPath(); A.cut(g, [[16, -38], [40, -62], [38, -26]], 5, 0, 3); A.paper(g, s, A.shade(f.c, -0.06), { shadow: 0.4 }); });
    if (f.ear === 'frog') ears(() => { g.beginPath(); g.arc(24, -36, 19, 0, 7); A.paper(g, s, f.c, { shadow: 0.5 }); });
    g.beginPath(); A.blob(g, 0, 2, 46, 43, 0.025, 9, 10);
    A.paper(g, s, f.c, { shadow: 0.8, box: { x: -46, y: -41, w: 92, h: 86 } });
    const blink = st.blink || 0;
    if (f.patch) for (const side of [-1, 1]) { g.beginPath(); g.ellipse(side * 17, -4, 12, 15, side * -0.5, 0, 7); g.fillStyle = f.patch; g.fill(); }
    if (f.owl) {
      for (const side of [-1, 1]) { g.beginPath(); g.arc(side * 18, -4, 16, 0, 7); g.fillStyle = '#F6EFE3'; g.fill(); }
      eye(g, -18, -4, 7, 8, blink); eye(g, 18, -4, 7, 8, blink);
      g.beginPath(); A.cut(g, [[-7, 10], [7, 10], [0, 22]], 3, 0, 1); g.fillStyle = f.muzzle; g.fill();
      return;
    }
    if (f.ear === 'frog') { eye(g, -24, -38, 8, 9, blink); eye(g, 24, -38, 8, 9, blink); }
    else { eye(g, -17, -6, 6, 7.5, blink); eye(g, 17, -6, 6, 7.5, blink); }
    g.beginPath(); g.ellipse(0, 16, 19, 14, 0, 0, 7); g.fillStyle = f.muzzle; g.fill();
    if (f.ear !== 'frog') { g.beginPath(); g.ellipse(0, 9, 6, 4.5, 0, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
    A.line(g, A.C.ink, 2.6, (h) => { h.moveTo(-8, 18); h.quadraticCurveTo(0, 25, 8, 18); });
    if (f.whiskers) A.line(g, A.alpha(A.C.ink, 0.5), 1.6, (h) => { for (const side of [-1, 1]) { h.moveTo(side * 16, 14); h.lineTo(side * 38, 10); h.moveTo(side * 16, 19); h.lineTo(side * 38, 22); } });
    cheek(g, -30, 12, 7); cheek(g, 30, 12, 7);
  };
  /** Old saves stored an emoji; map it to a drawn face. */
  const FROM_EMOJI = { '🦁': 'lion', '🐯': 'lion', '🐼': 'panda', '🦊': 'fox', '🐸': 'frog', '🐵': 'bear', '🦄': 'bunny', '🐙': 'owl', '🦖': 'frog', '🐳': 'cat', '🐶': 'bear', '🐱': 'cat', '🐰': 'bunny', '🦋': 'owl', '🚀': 'fox', '🚂': 'lion' };
  A.faceId = (av) => (FACES[av] ? av : FROM_EMOJI[av] || 'lion');
  /** A face as a standalone <canvas> for DOM screens (player picker). */
  A.faceCanvas = function (id, px) {
    const c = document.createElement('canvas'); const d = Math.min(2, devicePixelRatio || 1);
    c.width = c.height = Math.round(px * d); c.style.width = c.style.height = px + 'px';
    const g = c.getContext('2d'); const s = (px * d) / 150; g.setTransform(s, 0, 0, s, 75 * s, 80 * s);
    const mood = A.mood; A.mood = 'day'; A.face(g, s, A.faceId(id)); A.mood = mood;
    c.className = 'face'; return c;
  };
})();
