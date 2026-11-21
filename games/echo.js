/* Copy the Tune — a row of animal drummers on a hill, each with a drum of its own colour and its own note.
   They play a short tune, lighting up one after another; the child plays it back.
   Level 1: four drummers, tunes of two or three notes, slow. The next drum glows softly when the child waits.
   Level 2: five drummers. A tune of three notes grows by one each time it is copied, up to five (then six).
   Level 3: six drummers, quicker. The tune grows from four notes to eight and beyond, with twists in between:
            "now play it backwards" for a short tune, or a tune to copy by ear alone (the drums stay dark).
   A wrong drum never ends anything: the tune is simply played again, a little slower, and after two misses the
   right drum glows. Tapping a drum always sounds it, so the drums are also a toy before and between tunes. */
(function () {
  'use strict';
  const A = K.art;
  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  const COLS = ['#E8664A', '#F2B33D', '#6FA65F', '#5B8FC7', '#8E6BB0', '#EE8FA8'];
  const SKIN = '#F8EEDC', PLAIN = '#CDBFA6';
  const SAY = {
    free: 'Tap the drums!', listen: 'Listen!', copy: 'Then copy the tune.', turn: 'Your turn!',
    again: 'Listen again.', slow: 'Nice and slow.', glow: 'Tap the glowing one!',
    more: 'One more note!', fresh: 'A new tune!', faster: 'A little faster!', shorter: "Let's try a shorter one.",
    back: 'Now play it backwards!', lastFirst: 'Last one first!', ear: 'This time, just listen!', dark: 'No lights this time.',
  };
  const lines = () => Object.values(SAY);

  /* ---------------- pictures (img/faces): each singer has an open-eyed and a shut-eyed head ---------------- */
  const PIC = {};
  const SINGERS = [['cat', '#A99C92'], ['chick', '#F6D25A'], ['dog', '#C99666'], ['lion', '#F0B45A'], ['mouse', '#B9B4BC'], ['owl', '#A07850'], ['panda', '#F4F0EA'], ['pig', '#F3B0B8'], ['hedgehog', '#B08A6A']].map(([name, fur]) => {
    const s = { name, fur };
    for (const v of ['', '-shut']) { const p = (PIC[name + v] = { im: new Image(), ok: false }); p.im.onload = () => { p.ok = true; if (!v) furOf(s, p.im); }; p.im.src = 'img/faces/' + name + v + '.webp'; }
    return s;
  });
  /** The paws take the colour of the picture's forehead. */
  function furOf(s, im) {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 24, 24);
      const d = x.getImageData(6, 5, 12, 4).data; let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      const h = (v) => Math.round(v / n).toString(16).padStart(2, '0'); if (n) s.fur = '#' + h(r) + h(g) + h(b);
    } catch (e) { /* keep the stand-in colour */ }
  }
  const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);

  function headSprite(s, shut, R) {
    const p = PIC[s.name + (shut ? '-shut' : '')], ok = p && p.ok;
    return A.sprite('echo-head-' + s.name + (shut ? 's' : '') + (ok ? '' : '?') + Math.round(R), [-R * 0.82, -R * 0.74, R * 1.64, R * 1.48], (g, r) => {
      if (ok) {
        const k = Math.min(R * 1.6 / p.im.width, R * 1.42 / p.im.height), w = p.im.width * k, h = p.im.height * k;
        g.save(); g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = 8 * r; g.shadowOffsetY = 4 * r; g.drawImage(p.im, -w / 2, -h / 2, w, h); g.restore();
        return;
      }
      for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * R * 0.46, -R * 0.44, R * 0.2, 0, 7); A.paper(g, r, A.shade(s.fur, -0.06), { shadow: 0.5 }); }
      g.beginPath(); A.blob(g, 0, 0, R * 0.66, R * 0.6, 0.025, 9, 10); A.paper(g, r, s.fur, { shadow: 0.8, light: 0.06, box: { x: -R * 0.66, y: -R * 0.6, w: R * 1.32, h: R * 1.2 } });
      for (const sx of [-1, 1]) {
        if (shut) A.line(g, A.C.ink, R * 0.04, (h) => { h.moveTo(sx * R * 0.24 - R * 0.08, -R * 0.08); h.quadraticCurveTo(sx * R * 0.24, -R * 0.01, sx * R * 0.24 + R * 0.08, -R * 0.08); });
        else { g.beginPath(); g.ellipse(sx * R * 0.24, -R * 0.08, R * 0.075, R * 0.095, 0, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
        g.beginPath(); g.arc(sx * R * 0.42, R * 0.16, R * 0.1, 0, 7); g.fillStyle = 'rgba(240,140,130,.5)'; g.fill();
      }
      A.line(g, A.C.ink, R * 0.035, (h) => { h.moveTo(-R * 0.1, R * 0.2); h.quadraticCurveTo(0, R * 0.3, R * 0.1, R * 0.2); });
    });
  }
  /** A paper drum seen a little from above. (0,0) is the middle of the shell front; the skin is at y = -R/4. */
  function drumSprite(col, R) {
    return A.sprite('echo-drum-' + col + Math.round(R), [-R * 1.1, -R * 0.62, R * 2.2, R * 1.5], (g, s) => {
      const top = -R * 0.25, bot = R * 0.7, dark = A.shade(col, -0.13);
      const shell = () => { g.beginPath(); g.moveTo(-R, top); g.lineTo(-R * 0.93, bot - R * 0.13); g.quadraticCurveTo(0, bot + R * 0.15, R * 0.93, bot - R * 0.13); g.lineTo(R, top); g.closePath(); };
      shell(); A.paper(g, s, col, { shadow: 1, light: 0.1, box: { x: -R, y: top, w: R * 2, h: bot - top } });
      g.save(); shell(); g.clip();
      A.line(g, SKIN, R * 0.075, (h) => { const n = 6; for (let i = 0; i <= n; i++) { const x = -R * 0.97 + (i / n) * R * 1.94, sag = (1 - (x / R) * (x / R)) * R * 0.12, y = (i % 2 ? R * 0.2 : R * 0.48) + sag; if (i) h.lineTo(x, y); else h.moveTo(x, y); } });
      A.line(g, dark, R * 0.13, (h) => { h.moveTo(-R, bot - R * 0.17); h.quadraticCurveTo(0, bot + R * 0.13, R, bot - R * 0.17); });
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-R * 0.8, top, R * 0.22, bot - top + R * 0.2);
      g.restore();
      g.beginPath(); g.ellipse(0, top, R * 1.02, R * 0.31, 0, 0, 7); A.paper(g, s, dark, { shadow: 0.5, light: 0.06, box: { x: -R, y: top - R * 0.3, w: R * 2, h: R * 0.6 } });
      g.beginPath(); g.ellipse(0, top - R * 0.025, R * 0.9, R * 0.25, 0, 0, 7); A.paper(g, s, SKIN, { shadow: 0, light: 0.06, grain: 0.14, box: { x: -R, y: top - R * 0.3, w: R * 2, h: R * 0.6 } });
      for (const x of [-0.72, -0.26, 0.26, 0.72]) { g.beginPath(); g.arc(x * R, top + Math.sqrt(1 - x * x) * R * 0.3 + R * 0.07, R * 0.05, 0, 7); g.fillStyle = SKIN; g.fill(); }
    });
  }
  function note(g, r, col) {
    g.fillStyle = col; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = r * 0.16; g.lineJoin = 'round';
    const shape = () => { g.beginPath(); g.ellipse(-r * 0.2, r * 0.5, r * 0.42, r * 0.3, -0.35, 0, 7); g.rect(r * 0.08, -r * 0.7, r * 0.16, r * 1.2); g.moveTo(r * 0.1, -r * 0.72); g.quadraticCurveTo(r * 0.8, -r * 0.55, r * 0.72, 0.02 * r); g.quadraticCurveTo(r * 0.55, -r * 0.3, r * 0.1, -r * 0.3); g.closePath(); };
    shape(); g.stroke(); shape(); g.fill();
  }
  function backdrop(W, H, land, ys, R) {
    return A.sprite('echo-bg' + Math.round(W) + 'x' + Math.round(H) + ys.join(), [0, 0, W, H], (g, s) => {
      const hz = ys[0] - R * 0.25;
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#BFE0E4', { shadow: 0, light: 0, grain: 0.26 });
      const sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, 'rgba(150,200,214,.75)'); sk.addColorStop(1, 'rgba(250,236,208,.85)'); g.fillStyle = sk; g.fillRect(0, 0, W, hz + 40);
      const sx = land ? W * 0.83 : W * 0.5, sy = land ? 300 : 300;
      const halo = g.createRadialGradient(sx, sy, 20, sx, sy, 230); halo.addColorStop(0, 'rgba(255,240,190,.6)'); halo.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = halo; g.fillRect(sx - 240, sy - 240, 480, 480);
      g.beginPath(); g.arc(sx, sy, land ? 76 : 62, 0, 7); A.paper(g, s, '#F6C453', { shadow: 0.5, light: 0.08, box: { x: sx - 76, y: sy - 76, w: 152, h: 152 } });
      const cloud = (x, y, k) => { g.beginPath(); for (const [dx, dy, q] of [[-60, 8, 36], [-18, -14, 46], [34, -4, 40], [70, 12, 28]]) { g.moveTo(x + (dx + q) * k, y + dy * k); g.arc(x + dx * k, y + dy * k, q * k, 0, 7); } A.paper(g, s, '#FFFDF6', { shadow: 0.45, light: 0.03, grain: 0.14, box: { x: x - 100 * k, y: y - 60 * k, w: 200 * k, h: 110 * k } }); };
      if (land) { cloud(W * 0.2, 290, 1.1); cloud(W * 0.6, 330, 0.7); } else { cloud(W * 0.2, 250, 0.62); cloud(W * 0.84, 226, 0.5); }
      const hill = (y, amp, col, seed, n) => { const q = A.rng(seed), pts = [[-60, H + 40]]; for (let i = 0; i <= n; i++) pts.push([-60 + (i / n) * (W + 120), y - q() * amp]); pts.push([W + 60, H + 40]); g.beginPath(); A.smooth(g, pts); A.paper(g, s, col, { shadow: 0.7, light: 0.05, grain: 0.26, box: { x: 0, y: y - amp, w: W, h: 340 } }); };
      hill(hz - 150, 90, '#A9C9B4', 5, 5); hill(hz - 70, 70, '#8DBB93', 9, 4);
      const greens = ['#7FB37A', '#74AC73', '#69A46C'], r = A.rng(17);
      ys.forEach((y, i) => {
        hill(y - R * 0.12, 26, greens[i % 3], 21 + i * 4, 4);
        const y1 = i + 1 < ys.length ? ys[i + 1] - R * 0.3 : H;
        for (let k = 0; k < (land ? 26 : 9); k++) {
          const x = r() * W, yy = y + R * 0.25 + r() * Math.max(30, y1 - y - R * 0.3);
          if (k % 3 === 0) { for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.2566) * 7, yy + Math.sin(a * 1.2566) * 7, 5, 0, 7); g.fillStyle = k % 2 ? '#FBF6EC' : '#F7D27A'; g.fill(); } g.beginPath(); g.arc(x, yy, 4.5, 0, 7); g.fillStyle = k % 2 ? '#F2B33D' : '#E8664A'; g.fill(); }
          else A.line(g, 'rgba(60,120,80,.5)', 3.5, (h) => { for (const d of [-8, 0, 8]) { h.moveTo(x + d * 0.5, yy); h.lineTo(x + d, yy - 15 - Math.abs(d) * 0.3); } });
        }
      });
    });
  }

  /* ---------------- the game ---------------- */
  let live = null;
  function start(st, ctx) {
    const L = ctx.level, NP = L + 3, BASE = L === 1 ? 2 : L === 2 ? 3 : 4;
    let W = st.W, H = st.H, land = W >= 1000, bg = null;
    let phase = 'intro', round = null, pos = 0, hint = -1, gen = 0, lastAct = 0, freeTaps = 0, freeFrom = 0;
    let tune = [], cap = L === 1 ? 3 : L === 2 ? 5 : 8, speed = 1, clean = 0, tuneClean = true, ease = false, twistDue = false, twists = 0, backWins = 0, earWins = 0, sinceCele = 0, started = 0, prevSeq = '', forced = null, spedUp = false;
    let beads = [];
    const stat = { rounds: 0, misses: 0, celebrations: 0 };
    const singers = K.shuffle(SINGERS).slice(0, NP);
    const pads = singers.map((s, i) => ({ i, s, col: COLS[i], freq: NOTES[i], h: 9, show: false, litDur: 0.35, blink: 0, nextBlink: 1 + Math.random() * 3, R: 100, x: 0, y: 0 }));

    /* ---------- layout ---------- */
    function layout() {
      W = st.W; H = st.H; land = W >= 1000; A.setRes(st.res);
      const n = pads.length; let ys;
      if (land) {
        const sp = Math.min(330, (W - 70) / n), R = Math.min(140, sp * 0.455), y = H * 0.71;
        pads.forEach((p, i) => { p.R = R; p.x = W / 2 + (i - (n - 1) / 2) * sp; p.y = y; p.row = 0; });
        ys = [y];
      } else {
        const rows = Math.ceil(n / 2), room = H - 232 - 50, R = Math.min(120, room / rows * 0.36, W * 0.21), rowH = Math.min(room / rows, R * 3.3), top = 232 + (room - rowH * rows) / 2;
        ys = [];
        pads.forEach((p, i) => { const row = Math.floor(i / 2), alone = row === rows - 1 && n % 2; p.R = R; p.row = row; p.x = W / 2 + (alone ? 0 : (i % 2 ? 1 : -1) * W * 0.25); p.y = top + row * rowH + rowH * 0.67; ys[row] = p.y; });
      }
      if (bg) bg.remove();
      bg = st.add({ z: 0, sprite: backdrop(W, H, land, ys.map(Math.round), pads[0].R) });
      for (const p of pads) if (p.node) { p.node.x = p.x; p.node.y = p.y; p.node.z = 10 + p.row; p.node.hit = { x: -p.R * 1.06, y: -p.R * 1.72, w: p.R * 2.12, h: p.R * 2.52 }; }
      st.root._sorted = false;
      if (strip) { strip.x = W / 2; strip.y = land ? 172 : 176; }
    }

    /* ---------- the drummers ---------- */
    const notes = [];
    const air = st.add({ z: 60,
      update(dt) { for (const n of notes) { n.age += dt; n.y -= 150 * dt; n.x += Math.sin(n.age * 3 + n.ph) * 40 * dt; } for (let i = notes.length - 1; i >= 0; i--) if (notes[i].age > 1.3) notes.splice(i, 1); },
      draw(g) { for (const n of notes) { g.save(); g.globalAlpha = Math.min(1, (1.3 - n.age) * 2.2); g.translate(n.x, n.y); g.rotate(Math.sin(n.age * 3 + n.ph) * 0.25); const q = Math.min(1, n.age * 8); g.scale(q, q); note(g, n.r, n.col); g.restore(); } } });
    /** One drummer plays: the sound, and (unless it is a tune to copy by ear) the hop, the light and a floating note. */
    function sing(p, see, dur, quiet) {
      if (!quiet) K.sfx.note(p.freq, Math.max(0.45, (dur || 0.4) * 1.5));
      if (see === false) return;
      p.h = 0; p.show = true; p.litDur = dur || 0.38;
      if (notes.length < 14) notes.push({ x: p.x + (Math.random() - 0.5) * p.R * 0.6, y: p.y - p.R * 1.5, age: 0, ph: Math.random() * 6, r: p.R * 0.2, col: p.col });
    }
    pads.forEach((p) => {
      const node = (p.node = st.add({ z: 10, sx: 0, sy: 0, pad: 4, label: 'drum ' + (p.i + 1) }));
      node._bsx = node._bsy = 1;
      node.update = (dt) => { p.h += dt; p.blink = Math.max(0, p.blink - dt); if ((p.nextBlink -= dt) < 0) { p.blink = 0.13; p.nextBlink = 1.8 + Math.random() * 3.5; } };
      node.draw = (g) => {
        const R = p.R, k0 = Math.max(0, 1 - p.h / 0.34), k = k0 * k0 * (3 - 2 * k0), lit = p.show ? K.clamp((p.litDur + 0.16 - p.h) / 0.16, 0, 1) : 0, glow = hint === p.i && phase === 'input';
        const pulse = 0.6 + Math.sin(st.t * 6) * 0.25, top = -R * 0.25;
        g.beginPath(); g.ellipse(0, R * 0.74, R * 1.06, R * 0.17, 0, 0, 7); g.fillStyle = 'rgba(40,70,60,.2)'; g.fill();
        if (glow || lit > 0.02) { const q = glow && lit < 0.1 ? 1 + Math.sin(st.t * 6) * 0.025 : 1 + lit * 0.05; g.translate(0, R * 0.7); g.scale(q, q); g.translate(0, -R * 0.7); }
        if (lit > 0.02 || glow) {
          const soft = glow && lit < 0.1, a = soft ? 0.55 + pulse * 0.45 : lit, c = soft ? '#FFE98A' : A.mix(p.col, '#FFFFFF', 0.5), gr = g.createRadialGradient(0, -R * 0.4, R * 0.5, 0, -R * 0.4, R * 2.1);
          gr.addColorStop(0, A.alpha(c, a)); gr.addColorStop(1, A.alpha(c, 0)); g.fillStyle = gr; g.fillRect(-R * 2.2, -R * 2.6, R * 4.4, R * 4.4);
        }
        // the singer, peeping over the drum; eyes shut while it sings
        g.save(); g.translate(0, -R * 0.98 - k * R * 0.2 + Math.sin(st.t * 2.1 + p.i * 1.3) * R * 0.02 + (glow ? Math.sin(st.t * 6) * R * 0.03 : 0)); g.rotate(Math.sin(p.h * 22) * 0.07 * k);
        put(g, headSprite(p.s, (p.show && p.h < 0.34) || p.blink > 0, R)); g.restore();
        g.save(); g.translate(0, R * 0.7); g.scale(1 + k * 0.045, 1 - k * 0.06); g.translate(0, -R * 0.7);
        put(g, drumSprite(p.col, R));
        if (lit > 0.02) { g.beginPath(); g.ellipse(0, top - R * 0.025, R * 0.9, R * 0.25, 0, 0, 7); g.fillStyle = A.alpha(A.mix(p.col, '#FFFFFF', 0.3), lit * 0.95); g.fill(); }
        else if (glow) { g.beginPath(); g.ellipse(0, top - R * 0.025, R * 0.9, R * 0.25, 0, 0, 7); g.fillStyle = A.alpha('#FFD84A', 0.35 + pulse * 0.6); g.fill(); }
        g.restore();
        // paws drum on the far edge of the skin
        const up = Math.sin(Math.min(1, p.h / 0.3) * Math.PI) * R * 0.2 * (p.show ? 1 : 0);
        for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * R * 0.5, top - R * 0.2 - up * (sx > 0 ? 1 : 0.55), R * 0.15, R * 0.115, sx * 0.3, 0, 7); g.fillStyle = A.shade(p.s.fur, -0.05); g.fill(); g.strokeStyle = 'rgba(46,42,59,.14)'; g.lineWidth = 2; g.stroke(); }
        if (p.show && p.h < 0.5) { const q = p.h / 0.5; g.beginPath(); g.ellipse(0, top, R * (1 + q * 0.5), R * (0.3 + q * 0.2), 0, 0, 7); g.strokeStyle = A.alpha(A.mix(p.col, '#FFFFFF', 0.5), (1 - q) * 0.9); g.lineWidth = R * 0.06 * (1 - q) + 1; g.stroke(); }
      };
      node.onDown = () => press(p);
      node.onTap = (pt) => { if (!pt) press(p); };
    });

    /* ---------- the row of beads: one for each note of the tune ---------- */
    const strip = st.add({ ui: true, z: 50, x: W / 2, y: 172 });
    strip.draw = (g) => {
      const n = beads.length; if (!n) return;
      const back = round && round.mode === 'back', ear = round && round.mode === 'ear', gap = Math.min(42, (W - 150) / n), w = n * gap + 34 + (back ? 46 : 0), x0 = -(back ? 23 : 0) - ((n - 1) / 2) * gap;
      g.beginPath(); A.rect(g, -w / 2, -26, w, 52, 26, 5, 0.6); A.paper(g, st.res, '#FBF6EC', { shadow: 0.8, light: 0, grain: 0.12 });
      const next = phase === 'input' ? (back ? n - 1 - pos : pos) : -1;
      for (let i = 0; i < n; i++) {
        const b = beads[i], x = x0 + i * gap;
        if (b) { const q = Math.min(1, (st.t - b.t) / 0.22), e = 1 + Math.sin(q * Math.PI) * 0.45, r = Math.min(14, gap * 0.36) * e; g.beginPath(); g.arc(x, 0, r, 0, 7); g.fillStyle = b.c; g.fill(); g.beginPath(); g.arc(x - r * 0.3, -r * 0.3, r * 0.25, 0, 7); g.fillStyle = 'rgba(255,255,255,.45)'; g.fill(); }
        else { const r = Math.min(10, gap * 0.28) * (i === next ? 1.15 + Math.sin(st.t * 6) * 0.15 : 1); g.beginPath(); g.arc(x, 0, r, 0, 7); g.fillStyle = A.alpha(A.C.ink, i === next ? 0.3 : 0.14); g.fill(); }
      }
      if (back) { const x = x0 + n * gap + 2, d = Math.sin(st.t * 5) * 3; g.beginPath(); A.cut(g, [[x - 16 - d, 0], [x + 2 - d, -13], [x + 2 - d, -5], [x + 16 - d, -5], [x + 16 - d, 5], [x + 2 - d, 5], [x + 2 - d, 13]], 3, 0, 4); g.fillStyle = '#E8664A'; g.fill(); }
      if (ear && !(round.reveal)) { const x = -w / 2 - 30; g.save(); g.translate(x, 0); note(g, 17, '#6E4E7E'); g.restore(); }
    };
    const beadXY = (i) => { const n = beads.length, back = round && round.mode === 'back', gap = Math.min(42, (W - 150) / n); return { x: strip.x - (back ? 23 : 0) + (i - (n - 1) / 2) * gap, y: strip.y }; };

    /* ---------- tunes ---------- */
    function randomSeq(len, notSame) {
      for (let tries = 0; tries < 40; tries++) {
        const s = []; while (s.length < len) { const n = Math.floor(Math.random() * NP); if (n === s[s.length - 1] && (L < 3 || n === s[s.length - 2])) continue; s.push(n); }
        if (s.join() === prevSeq) continue;
        if (notSame && s.join() === s.slice().reverse().join()) continue;
        return s;
      }
      return Array.from({ length: len }, (v, i) => i % NP);
    }
    function nextRound() {
      let seq, mode = 'copy', pre = SAY.listen;
      const kind = forced || (twistDue ? (twists % 2 ? 'ear' : 'back') : null); forced = null;
      if (kind === 'back' || kind === 'ear') {
        twistDue = false; twists++; mode = kind;
        seq = randomSeq(kind === 'ear' ? (earWins >= 1 ? 3 : 2) : (backWins >= 2 ? 4 : 3), kind === 'back');
        pre = kind === 'back' ? SAY.back : SAY.ear + ' ' + SAY.dark;
      } else if (L === 1) {
        seq = randomSeq(clean >= 2 ? 3 : 2); if (!started) pre = SAY.listen + ' ' + SAY.copy;
      } else {
        if (ease) { ease = false; tune = randomSeq(Math.max(BASE, tune.length - 1)); tuneClean = false; pre = SAY.shorter; }
        else if (!tune.length || tune.length >= cap) { tune = randomSeq(BASE); tuneClean = true; pre = !started ? SAY.listen + ' ' + SAY.copy : spedUp ? SAY.fresh + ' ' + SAY.faster : SAY.fresh; spedUp = false; }
        else { let n; do { n = Math.floor(Math.random() * NP); } while (n === tune[tune.length - 1] && (L < 3 || n === tune[tune.length - 2])); tune = tune.concat(n); pre = SAY.more; }
        seq = tune.slice();
      }
      prevSeq = seq.join(); started++;
      return { seq, want: mode === 'back' ? seq.slice().reverse() : seq, mode, pre, fails: 0, slow: 1, reveal: false, replayed: false };
    }
    const gapMs = () => (L === 1 ? (clean >= 4 ? 740 : 840) : L === 2 ? 640 : Math.max(390, 570 - 20 * round.seq.length) * speed) * round.slow;
    const speak = (t) => Promise.all([Promise.race([ctx.prompt(t), ctx.wait(2800)]), ctx.wait(750)]);

    async function begin() {
      const g0 = ++gen; phase = 'pause'; hint = -1;
      round = nextRound(); beads = new Array(round.seq.length).fill(null);
      await speak(round.pre); if (g0 !== gen) return;
      show(g0);
    }
    async function show(g0) {
      phase = 'show'; hint = -1; beads.fill(null);
      await ctx.wait(320); if (g0 !== gen) return;
      const gap = gapMs(), dark = round.mode === 'ear' && !round.reveal;
      for (let i = 0; i < round.seq.length; i++) {
        const p = pads[round.seq[i]];
        sing(p, !dark, gap * 0.00062);
        beads[i] = { c: dark ? PLAIN : p.col, t: st.t };
        await ctx.wait(gap); if (g0 !== gen) return;
      }
      await ctx.wait(140); if (g0 !== gen) return;
      beads.fill(null); pos = 0; phase = 'input'; lastAct = st.t;
      const t = round.fails >= 2 ? SAY.glow : round.mode === 'back' ? SAY.lastFirst : SAY.turn;
      ctx.prompt(t, { silent: t === SAY.turn && stat.rounds >= 3 && !round.fails });
      K.sfx.tone(1175, 0.1, { type: 'sine', vol: 0.07 });
      for (const p of pads) p.node.press();
    }
    function press(p) {
      lastAct = st.t;
      if (phase === 'intro') { phase = 'free'; freeFrom = st.t; }
      if (phase === 'show') { K.sfx.tap(); p.node.press(); return; }   // the tune is playing: a quiet tick, so it stays clear
      sing(p, true, 0.36);
      if (phase === 'free') { freeTaps++; return; }
      if (phase !== 'input') return;
      const r = round;
      if (p.i !== r.want[pos]) { miss(p); return; }
      const bi = r.mode === 'back' ? r.want.length - 1 - pos : pos, at = beadXY(bi);
      beads[bi] = { c: p.col, t: st.t }; pos++; hint = -1;
      ctx.fx.burst(at.x, at.y, { n: 5, color: p.col });
      if (pos === r.want.length) success();
    }
    async function miss(p) {
      const g0 = ++gen, r = round; phase = 'pause'; hint = -1; r.fails++; stat.misses++;
      r.slow = Math.min(1.7, r.slow * 1.22); if (r.mode === 'ear' && r.fails >= 2) r.reveal = true;
      ctx.after(190, () => K.sfx.whoops());
      p.node.to({ rot: 0.07 }, { dur: 0.08 }).then(() => p.node.to({ rot: -0.06 }, { dur: 0.1 })).then(() => p.node.to({ rot: 0 }, { dur: 0.35, ease: 'elastic' }));
      await ctx.wait(700); if (g0 !== gen) return;
      await speak(r.fails === 1 ? SAY.again + ' ' + SAY.slow : SAY.again); if (g0 !== gen) return;
      show(g0);
    }
    async function success() {
      const g0 = ++gen, r = round, ok = r.fails === 0; phase = 'pause'; hint = -1; stat.rounds++; sinceCele++;
      clean = ok ? clean + 1 : 0;
      let cele = sinceCele >= 4;
      if (r.mode !== 'copy') { if (ok) { if (r.mode === 'back') backWins++; else earWins++; } }
      else if (L > 1) {
        if (!ok) tuneClean = false;
        if (r.fails >= 2) ease = true;
        else if (tune.length >= cap) {             // the whole tune is done: a longer (and at level 3 quicker) one next time if it went well
          if (L === 2) cele = true;
          if (tuneClean) { const c2 = Math.min(cap + 1, L === 2 ? 6 : 10); if (L === 3 && speed > 0.82) { speed *= 0.93; spedUp = true; } cap = c2; }
        } else if (L === 3 && tune.length >= 5 && tune.length % 2 === 1) twistDue = true;
      }
      if (cele) { sinceCele = 0; stat.celebrations++; }
      ctx.after(260, () => { if (g0 === gen) K.sfx.sparkle(); });
      pads.forEach((q, i) => ctx.after(300 + i * 80, () => { if (g0 === gen) sing(q, true, 0.22, true); }));
      beads.forEach((b, i) => ctx.after(200 + i * 50, () => { if (g0 !== gen) return; const at = beadXY(i); ctx.fx.burst(at.x, at.y, { n: 4, colors: ['#F2B33D', '#FBF6EC'] }); }));
      if (cele) { await ctx.wait(1000); if (g0 !== gen) return; await ctx.celebrate(); if (g0 !== gen) return; await ctx.wait(250); }
      else { ctx.after(650, () => { if (g0 === gen && ok) K.praise(); }); await ctx.wait(ok ? 1900 : 1200); }
      if (g0 !== gen) return;
      begin();
    }

    /* ---------- waiting, hints, and the free play before the first tune ---------- */
    ctx.every(250, () => {
      const idle = st.t - lastAct;
      if (phase === 'free') { if (st.t - freeFrom > 3 && ((freeTaps >= 3 && idle > 1.7) || idle > 6 || freeTaps >= 12)) begin(); return; }
      if (phase !== 'input' || !round) return;
      if (round.fails >= 2) hint = round.want[pos];
      else if (L === 1) { if (idle > 2.6) hint = round.want[pos]; }
      else if (idle > 7) { if (!round.replayed && pos === 0) { round.replayed = true; show(++gen); } else hint = round.want[pos]; }
    });

    layout();
    live = layout;
    // they pop up one by one and each plays its note, low to high
    pads.forEach((p, i) => {
      ctx.after(250 + i * 190, () => { p.node.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back' }); K.sfx.pop(); });
      ctx.after(700 + NP * 190 + i * 230, () => { if (phase === 'intro') sing(p, true, 0.3); });
    });
    ctx.after(800 + NP * 420, () => { if (phase !== 'intro') return; phase = 'free'; freeFrom = lastAct = st.t; });
    ctx.prompt(SAY.free);

    K._echo = {       // for browser tests
      st, pads, stat, get phase() { return phase; }, get round() { return round; }, get pos() { return pos; }, get hint() { return hint; }, get cap() { return cap; }, get tune() { return tune; }, get beads() { return beads; },
      press: (i) => press(pads[i]), begin: (kind) => { forced = kind || null; begin(); },
    };
    ctx.onExit(() => { live = null; K._echo = null; });
  }

  /* ---------------- thumbnail ---------------- */
  function icon(g, w) {
    const u = w / 300;
    const sky = g.createLinearGradient(0, 0, 0, w); sky.addColorStop(0, '#A9D3DD'); sky.addColorStop(0.7, '#F3E9D6'); g.fillStyle = sky; g.fillRect(0, 0, w, w);
    g.save(); g.scale(u, u);
    g.beginPath(); g.arc(238, 62, 30, 0, 7); g.fillStyle = '#F6C453'; g.fill();
    g.beginPath(); g.moveTo(0, 190); g.quadraticCurveTo(150, 130, 300, 186); g.lineTo(300, 300); g.lineTo(0, 300); g.fillStyle = '#7FB37A'; g.fill();
    const drum = (x, y, R, col, rim) => {
      g.beginPath(); g.ellipse(x, y + R * 0.74, R * 1.05, R * 0.17, 0, 0, 7); g.fillStyle = 'rgba(40,70,60,.2)'; g.fill();
      g.beginPath(); g.moveTo(x - R, y - R * 0.25); g.lineTo(x - R * 0.93, y + R * 0.57); g.quadraticCurveTo(x, y + R * 0.85, x + R * 0.93, y + R * 0.57); g.lineTo(x + R, y - R * 0.25); g.closePath(); g.fillStyle = col; g.fill();
      g.beginPath(); for (let i = 0; i <= 6; i++) { const px = x - R * 0.9 + (i / 6) * R * 1.8, py = y + (i % 2 ? R * 0.22 : R * 0.5); if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokeStyle = SKIN; g.lineWidth = R * 0.08; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
      g.beginPath(); g.ellipse(x, y - R * 0.25, R * 1.02, R * 0.31, 0, 0, 7); g.fillStyle = rim; g.fill();
      g.beginPath(); g.ellipse(x, y - R * 0.275, R * 0.9, R * 0.25, 0, 0, 7); g.fillStyle = SKIN; g.fill();
    };
    const head = (name, x, y, s2, alt) => { const p = PIC[name]; if (p && p.ok) { const k = Math.min(s2 / p.im.width, s2 / p.im.height); g.drawImage(p.im, x - p.im.width * k / 2, y - p.im.height * k / 2, p.im.width * k, p.im.height * k); } else { g.beginPath(); g.arc(x, y, s2 * 0.4, 0, 7); g.fillStyle = alt; g.fill(); g.fillStyle = '#2E2A3B'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * s2 * 0.14, y - s2 * 0.05, s2 * 0.05, 0, 7); g.fill(); } } };
    head('chick', 66, 148, 74, '#F6D25A'); drum(66, 206, 46, '#E8664A', '#C9523B');
    head('pig', 234, 152, 74, '#F3B0B8'); drum(234, 210, 46, '#5B8FC7', '#4A78AB');
    const glow = g.createRadialGradient(150, 170, 10, 150, 170, 120); glow.addColorStop(0, 'rgba(255,246,200,.75)'); glow.addColorStop(1, 'rgba(255,246,200,0)'); g.fillStyle = glow; g.fillRect(30, 50, 240, 240);
    head('cat', 150, 150, 96, '#A99C92'); drum(150, 226, 58, '#F2B33D', '#D9952B');
    g.beginPath(); g.ellipse(150, 210, 52, 14.5, 0, 0, 7); g.fillStyle = 'rgba(255,250,215,.7)'; g.fill();
    g.save(); g.translate(92, 62); g.rotate(-0.2); note(g, 26, '#E8664A'); g.restore();
    g.save(); g.translate(160, 40); g.rotate(0.15); note(g, 20, '#6E4E7E'); g.restore();
    g.restore();
  }

  K.game({ id: 'echo', title: 'Copy the Tune', voice: 'echo', group: 'arcade', age: 5, order: 23, icon, start, lines, resize: () => { if (live) live(); } });
})();
