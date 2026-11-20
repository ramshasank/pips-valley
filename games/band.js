/* Animal Band — four animals on a little stage, and a song that builds itself.
   Touch a drum, a bar, the fox or the frog and it plays at once. Whatever is played is snapped to
   the beat and comes round again every bar, so each animal keeps its part going and the layers
   pile up into a song. The dots under each animal are its part; the moon beside them sends that
   animal to rest. Tortoise and hare change the speed. Notes float up as bubbles to pop.
   Every pitched sound is in one pentatonic scale, so nothing can sound wrong.
   From level 2 the bunny sometimes plays a short pattern to copy. No way to fail.
   The song is remembered per child. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, B = A.band;
  const STEPS = 8;
  const SAY = { open: 'Tap to make music!', listen: 'Listen!', glow: 'Tap the glowing one!', bravo: 'Bravo!', keep: 'Keep going!', slow: 'Slow!', fast: 'Fast!', rest: 'Shh! Time to rest.' };
  const NAMES = { bear: 'Drums', bunny: 'Xylophone', fox: 'Trumpet', frog: 'Ukulele' };
  const lines = () => [...Object.values(SAY), ...Object.values(NAMES)];
  const XY = [523.25, 587.33, 659.25, 783.99, 880], HORN = [392, 440, 523.25, 587.33];
  const CHORDS = [[261.63, 329.63, 392], [220, 261.63, 329.63], [196, 293.66, 392]];
  const BAR_NAMES = ['red bar', 'yellow bar', 'green bar', 'blue bar', 'purple bar'];
  const TEMPO = [70, 96, 128]; // beats a minute: tortoise, normal, hare

  function sound(id, ev) {
    const s = K.sfx;
    if (id === 'bear') {
      if (ev.p === 'kick') s.drum('kick');
      else if (ev.p === 'snare') s.drum('snare');
      else { s.noise(0.34, { filter: 'highpass', freq: 5200, vol: 0.15 }); s.tone(2350, 0.22, { type: 'triangle', vol: 0.03 }); }
    } else if (id === 'bunny') s.note(XY[ev.n], 0.55);
    else if (id === 'fox') { const f = HORN[ev.n]; s.tone(f * 0.94, 0.36, { to: f, type: 'sawtooth', vol: 0.045 }); s.tone(f, 0.38, { type: 'triangle', vol: 0.2 }); s.tone(f * 2, 0.2, { type: 'sine', vol: 0.04 }); }
    else { CHORDS[ev.n].forEach((f, i) => { s.tone(f, 0.5, { type: 'triangle', vol: 0.15, delay: i * 0.035 }); s.tone(f * 2, 0.25, { type: 'sine', vol: 0.04, delay: i * 0.035 }); }); s.noise(0.04, { freq: 2600, vol: 0.06 }); }
  }

  function start(st, ctx) {
    const W = st.W, H = st.H, land = W >= 1000;
    const store = (K.s.done.band = K.s.done.band || {});
    const IDS = ['bear', 'bunny', 'fox', 'frog'];
    /* ---------- layout ---------- */
    const cw = land ? 96 : 34;
    let m, spots;
    if (land) {
      const ws = [300, 250, 200, 230], tot = 980; m = Math.min(1.32, (W - cw * 2 - 16) / tot);
      let x = (W - tot * m) / 2; spots = ws.map((w) => { const p = { x: x + (w / 2) * m, y: 806 }; x += w * m; return p; });
    } else { m = 0.86; const y1 = Math.round(H * 0.485), y2 = Math.round(H * 0.835); spots = [{ x: 150, y: y1 }, { x: 412, y: y1 }, { x: 150, y: y2 }, { x: 412, y: y2 }]; }
    const L = { land, cw, floorY: land ? 704 : spots[0].y - 84, tier: land ? null : { top: spots[0].y - 84, face: spots[0].y + 104, h: 44 }, spots };
    st.add({ z: 0, sprite: B.backdrop(W, H, L) });

    /* ---------- the beat ---------- */
    let tempo = store.tempo == null ? 1 : store.tempo, clock = 0, lastStep = -1, lastTouch = -1e9, party = false, lights = 0, follow = null, follows = 0;
    const stepDur = () => 60 / TEMPO[tempo] / 2;
    const ptr = { x: W / 2, y: H / 2, t: -99 };
    const log = [];
    const mus = IDS.map((id, i) => ({ id, i, h: 9, ev: null, lean: 0, sleep: 0, blink: 0, nextBlink: 1 + Math.random() * 3, taps: 0, named: false, loop: new Array(STEPS).fill(null), glow: -1 }));
    if (store.loops) for (const mu of mus) (store.loops[mu.id] || []).forEach((e, k) => { if (e && k < STEPS) mu.loop[k] = Object.assign({}, e); });
    const has = (mu) => mu.loop.some(Boolean);
    const save = () => { store.loops = {}; for (const mu of mus) store.loops[mu.id] = mu.loop.map((e) => (e ? (e.p ? { p: e.p } : { n: e.n }) : null)); store.tempo = tempo; K.save(); };

    function perform(mu, ev, n, fromLoop) {
      sound(mu.id, ev); mu.h = 0; mu.ev = ev; mu.sleep = 0;
      log.push({ step: n, id: mu.id, ev: ev.p || ev.n, loop: !!fromLoop }); if (log.length > 300) log.shift();
      if (!fromLoop || Math.random() < 0.3) bubble(mu, ev);
    }
    function tap(mu, ev) {
      lastTouch = st.t; const abs = Math.round(clock);
      perform(mu, ev, abs, false);
      mu.loop[((abs % STEPS) + STEPS) % STEPS] = Object.assign({ born: abs }, ev); save();
      if (!mu.named) { mu.named = true; if (!follow) K.say(NAMES[mu.id]); }
      if (!party && mus.filter(has).length >= 3) { party = true; ctx.after(stepDur() * STEPS * 2000, () => { lights = 7; store.songs = (store.songs || 0) + 1; K.save(); ctx.celebrate(); }); }
    }
    function rest(mu, quiet) { if (!has(mu)) return; mu.loop.fill(null); mu.sleep = 2.2; save(); if (!quiet) { K.sfx.tone(520, 0.4, { to: 220, type: 'sine', vol: 0.14 }); } }
    function fire(n) {
      const step = n % STEPS, any = mus.some(has);
      if (step % 2 === 0 && (any || st.t - lastTouch < 12)) K.sfx.tone(step === 0 ? 990 : 740, 0.05, { type: 'triangle', vol: any ? 0.035 : 0.05 });
      for (const mu of mus) { const ev = mu.loop[step]; if (ev && ev.born !== n) perform(mu, ev, n, true); }
    }
    st.onframe = (dt) => {
      clock += dt / stepDur(); lights = Math.max(0, lights - dt);
      const n = Math.floor(clock); while (lastStep < n) { lastStep++; fire(lastStep); }
    };
    const beatPulse = () => { const ph = (clock / 2) % 1; return Math.exp(-ph * 5); };

    /* ---------- bubbles ---------- */
    const bubbles = [];
    function bubble(mu, ev) {
      if (bubbles.length >= 9) return;
      if (st.t - (mu.lastBub || -9) < 0.45) return; mu.lastBub = st.t;
      const o = mu.id === 'bear' ? (ev.p === 'snare' ? [-104, -150] : ev.p === 'kick' ? [-70, -250] : [112, -214]) : mu.id === 'bunny' ? [(ev.n < 3 ? -1 : 1) * (96 + Math.random() * 20), -220] : mu.id === 'fox' ? [126, -186] : [96, -150];
      const col = mu.id === 'bunny' ? B.BARS[ev.n] : B.ANIMALS[mu.id].accent;
      const b = st.add({ z: 60, x: mu.node.x + o[0] * m, y: mu.node.y + o[1] * m, r: 24 + Math.random() * 8, sx: 0.2, sy: 0.2, age: 0, ph: Math.random() * 6, col, life: 2.2 + Math.random() * 0.6 });
      b.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back' });
      b.draw = (g) => { g.globalAlpha *= Math.min(1, (b.life - b.age) * 2.5); B.bubble(g, b.r, b.col); };
      b.update = (dt) => { b.age += dt; b.y -= (96 + b.r) * dt; b.x += Math.sin(b.age * 2.4 + b.ph) * 26 * dt; if (b.age > b.life) kill(b); };
      b.pop = () => { K.sfx.note(XY[Math.floor(Math.random() * 5)] * 2, 0.3); K.sfx.pop(); ctx.fx.burst(b.x, b.y, { n: 7, color: b.col }); lastTouch = st.t; kill(b); };
      bubbles.push(b);
    }
    function kill(b) { const i = bubbles.indexOf(b); if (i >= 0) bubbles.splice(i, 1); b.remove(); }

    /* ---------- musicians ---------- */
    const lerp = (a, b, k) => a + (b - a) * k;
    const stick = (g, hx, hy, tx, ty, col, ball) => { A.line(g, col, 6, (h) => { h.moveTo(hx, hy); h.lineTo(tx, ty); }); if (ball) { g.beginPath(); g.arc(tx, ty, 9, 0, 7); g.fillStyle = ball; g.fill(); } };
    function head(g, mu, x, y, extra) {
      const bp = beatPulse();
      g.save(); g.translate(x, y + bp * 3 + (mu.sleep > 0 ? 8 : 0)); g.rotate(mu.lean + (mu.sleep > 0 ? 0.14 : 0) + (extra || 0)); g.scale(1.1, 1.1);
      B.put(g, B.head(mu.id, mu.sleep > 0 || mu.blink > 0)); g.restore();
    }
    const DRAW = {
      bear(g, mu, k) {
        const c = B.ANIMALS.bear.c, ev = mu.ev || {}, kk = ev.p === 'kick' ? k : 0, ks = ev.p === 'snare' ? k : 0, kc = ev.p === 'cym' ? k : 0;
        A.line(g, '#8E8A96', 6, (h) => { h.moveTo(104, -164); h.lineTo(104, -6); h.moveTo(104, -30); h.lineTo(82, 0); h.moveTo(104, -30); h.lineTo(126, 0); });
        g.save(); g.translate(0, -34 - kk * 7); B.put(g, B.body('bear')); g.restore();
        head(g, mu, 0, -184 - kk * 7);
        g.save(); g.translate(-92, -96 + ks * 3); B.put(g, B.snare()); g.restore();
        g.save(); g.translate(104, -168); g.rotate(Math.sin(mu.h * 34) * 0.22 * kc); B.put(g, B.cymbal()); g.restore();
        g.save(); g.translate(0, -60); const q = 1 + kk * 0.07; g.scale(q, q); B.put(g, B.bassDrum()); g.restore();
        const arm = A.shade(c, -0.07), y0 = -146 - kk * 7;
        const lh = [lerp(-80, -82, ks), lerp(-152, -126, ks) - kk * 10], lt = [lerp(-104, -92, ks), lerp(-134, -103, ks) - kk * 10];
        const rh = [lerp(78, 80, kc), lerp(-204, -190, kc) - kk * 10], rt = [lerp(108, 104, kc), lerp(-228, -176, kc) - kk * 10];
        stick(g, lh[0], lh[1], lt[0], lt[1], '#E9C79A'); stick(g, rh[0], rh[1], rt[0], rt[1], '#E9C79A');
        B.arm(g, arm, -44, y0, lh[0], lh[1]); B.arm(g, arm, 44, y0, rh[0], rh[1]);
      },
      bunny(g, mu, k) {
        const c = B.ANIMALS.bunny.c, ev = mu.ev || { n: 0 }, n = ev.n || 0;
        g.save(); g.translate(0, -44); B.put(g, B.body('bunny')); g.restore();
        head(g, mu, 0, -194);
        B.put(g, B.xyloFrame());
        for (let i = 0; i < 5; i++) {
          const x = -92 + i * 46, hit = i === n ? k : 0, glow = mu.glow === i;
          g.save(); g.translate(x, -12 + hit * 5);
          if (glow || hit > 0.05) { g.save(); g.shadowColor = glow ? '#FFF6C8' : B.BARS[i]; g.shadowBlur = (glow ? 26 + Math.sin(st.t * 8) * 10 : 22 * hit) * st.res; g.beginPath(); g.rect(-18, -B.BAR_H[i] + 2, 36, B.BAR_H[i] - 4); g.fillStyle = glow ? '#FFF6C8' : B.BARS[i]; g.fill(); g.restore(); }
          const q = glow ? 1.05 + Math.sin(st.t * 8) * 0.04 : 1; g.scale(q, q);
          B.put(g, B.bar(i));
          if (glow) { g.beginPath(); g.rect(-20, -B.BAR_H[i], 40, B.BAR_H[i]); g.fillStyle = 'rgba(255,255,255,.28)'; g.fill(); }
          g.restore();
        }
        const arm = A.shade(c, -0.1), left = n < 3;
        const tx = -92 + n * 46, ty = -12 - B.BAR_H[n] + 30;
        const lt = left ? [lerp(-96, tx, k), lerp(-204, ty, k)] : [-96, -204], rt = !left ? [lerp(96, tx, k), lerp(-204, ty, k)] : [96, -204];
        const lh = left ? [lerp(-74, lt[0] - 14, k), lerp(-166, lt[1] - 40, k)] : [-74, -166], rh = !left ? [lerp(74, rt[0] + 14, k), lerp(-166, rt[1] - 40, k)] : [74, -166];
        stick(g, lh[0], lh[1], lt[0], lt[1], '#B98558', '#E8664A'); stick(g, rh[0], rh[1], rt[0], rt[1], '#B98558', '#2F8F8A');
        B.arm(g, arm, -42, -156, lh[0], lh[1], 18); B.arm(g, arm, 42, -156, rh[0], rh[1], 18);
      },
      fox(g, mu, k) {
        const c = B.ANIMALS.fox.c, up = k * 9;
        g.save(); g.translate(0, -up * 0.4); B.put(g, B.body('fox')); g.restore();
        head(g, mu, 0, -150 - up * 0.6, -k * 0.08);
        for (const side of [-1, 1]) { g.beginPath(); g.arc(side * 35, -136 - up * 0.6, 7 + k * 8, 0, 7); g.fillStyle = A.alpha('#F4A58C', 0.55 + k * 0.4); g.fill(); }
        const rot = -0.2 - k * 0.3, ox = 8, oy = -130 - up * 0.6, cs = Math.cos(rot), sn = Math.sin(rot);
        g.save(); g.translate(ox, oy); g.rotate(rot); const q = 1 + k * 0.08; g.scale(q, q); B.put(g, B.horn()); g.restore();
        const at = (lx, ly) => [ox + lx * cs - ly * sn, oy + lx * sn + ly * cs];
        const arm = A.shade(c, -0.07), a = at(24, 10), b = at(54, 10);
        B.arm(g, arm, -42, -106, a[0], a[1], 18); B.arm(g, arm, 42, -106, b[0], b[1], 18);
        if (k > 0.1) A.line(g, A.alpha('#FFF3C4', k * 0.9), 5, (h) => { for (const d of [-0.5, 0, 0.5]) { const p0 = at(134, d * 40), p1 = at(134 + 26 * k, d * 62); h.moveTo(p0[0], p0[1]); h.lineTo(p1[0], p1[1]); } });
      },
      frog(g, mu, k) {
        const c = B.ANIMALS.frog.c, sway = Math.sin(mu.h * 26) * k;
        B.put(g, B.body('frog'));
        head(g, mu, 0, -146, sway * 0.05);
        const rot = -0.32 + sway * 0.03, ox = 2, oy = -62, cs = Math.cos(rot), sn = Math.sin(rot);
        const arm = A.shade(c, -0.09), at = (lx, ly) => [ox + lx * cs - ly * sn, oy + lx * sn + ly * cs], nh = at(88, 2);
        B.arm(g, arm, 42, -104, nh[0], nh[1] + 6, 18);
        g.save(); g.translate(ox, oy); g.rotate(rot); B.put(g, B.uke());
        A.line(g, 'rgba(255,250,235,.9)', 1.8, (h) => { for (const y of [-5, 0, 5]) { h.moveTo(-46, y); h.quadraticCurveTo(40, y + Math.sin(mu.h * 60 + y) * 5 * k, 124, y * 0.8); } });
        g.restore();
        const sh = at(-4, -6 + sway * 20 + (k > 0 ? 0 : 0)); B.arm(g, arm, -42, -104, sh[0], sh[1], 18);
      },
    };
    const HIT = { bear: { x: -62, y: -256, w: 124, h: 140 }, bunny: { x: -62, y: -312, w: 124, h: 176 }, fox: { x: -94, y: -236, w: 210, h: 240 }, frog: { x: -96, y: -226, w: 200, h: 230 } };
    const parts = [];
    mus.forEach((mu, i) => {
      const node = st.add({ z: 10 + (land ? 0 : i >> 1), x: spots[i].x, y: spots[i].y, sx: m, sy: m, hit: HIT[mu.id], pad: 0, label: mu.id });
      mu.node = node;
      node.update = (dt) => {
        mu.h += dt; mu.sleep = Math.max(0, mu.sleep - dt); mu.blink = Math.max(0, mu.blink - dt);
        if ((mu.nextBlink -= dt) < 0) { mu.blink = 0.13; mu.nextBlink = 1.6 + Math.random() * 3.5; }
        const want = st.t - ptr.t < 3 ? K.clamp((ptr.x - node.x) / 700, -0.16, 0.16) : 0; mu.lean += (want - mu.lean) * Math.min(1, dt * 7);
      };
      node.draw = (g) => {
        const k = Math.max(0, 1 - mu.h / 0.26), bp = beatPulse() * (has(mu) ? 1 : 0.4);
        g.save(); g.scale(1 + bp * 0.018, 1 - bp * 0.028); DRAW[mu.id](g, mu, k * k * (3 - 2 * k)); g.restore();
        // this animal's part: one dot a step, and the step now playing
        g.save(); g.translate(0, 50); B.put(g, B.plaque());
        const now = ((lastStep % STEPS) + STEPS) % STEPS, col = B.ANIMALS[mu.id].accent, live = has(mu);
        for (let s2 = 0; s2 < STEPS; s2++) { const on = mu.loop[s2], cur = s2 === now, x = -92 + s2 * (live ? 19 : 26.3); g.beginPath(); g.arc(x, 0, on ? (cur ? 10 : 7.5) : cur ? 5.5 : 4, 0, 7); g.fillStyle = on ? (mu.id === 'bunny' ? B.BARS[on.n] : col) : A.alpha(A.C.ink, cur ? 0.4 : 0.16); g.fill(); }
        g.restore();
      };
      const def = () => { mu.taps++; if (mu.id === 'bear') return { p: mu.taps % 2 ? 'kick' : 'snare' }; if (mu.id === 'bunny') return { n: [0, 2, 4, 3, 1][mu.taps % 5] }; if (mu.id === 'fox') return { n: [0, 1, 2, 1, 3, 2][mu.taps % 6] }; return { n: mu.taps % 3 }; };
      const whole = (p) => {
        if (p && mu.id === 'fox') { const ly = (p.y - node.y) / m; mu.taps++; return tap(mu, { n: K.clamp(Math.floor((-ly / 236) * 4), 0, 3) }); }
        tap(mu, def());
      };
      node.onDown = whole; node.onTap = (p) => { if (!p) whole(null); };
      const part = (label, hit, ev) => {
        const n = node.add(new E.Node({ hit, pad: 0, label, z: 1, isPart: true }));
        n.play = () => { tap(mu, ev); if (follow && mu.id === 'bunny') copied(ev.n); };
        n.onDown = n.play; n.onTap = (p) => { if (!p) n.play(); };
        parts.push(n); return n;
      };
      if (mu.id === 'bear') { part('big drum', { x: -60, y: -120, w: 120, h: 120 }, { p: 'kick' }); part('little drum', { x: -140, y: -128, w: 92, h: 80 }, { p: 'snare' }); part('cymbal', { x: 52, y: -204, w: 100, h: 70 }, { p: 'cym' }); }
      if (mu.id === 'bunny') for (let b = 0; b < 5; b++) part(BAR_NAMES[b], { x: -115 + b * 46, y: -138, w: 46, h: 132 }, { n: b });
      // the moon sends this animal to rest (only there while it has a part going)
      const moon = node.add(new E.Node({ x: 84, y: 50, hitR: 26, pad: 10, z: 2, isMoon: true, label: 'rest ' + mu.id }));
      moon.draw = (g) => { g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fillStyle = '#E7DCEB'; g.fill(); B.moon(g, 12); };
      moon.update = () => { moon.visible = has(mu); };
      moon.onTap = () => rest(mu);
    });
    // sliding a finger along the bars or across the drums plays each one it meets
    st.ondown = (p, e, n) => {
      ptr.x = p.x; ptr.y = p.y; ptr.t = st.t;
      // bubbles never get in the way of a control; anywhere else a touch pops the one under the finger
      if (n && (n.ui || n.isMoon)) return;
      const b = bubbles.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < q.r + 16); if (b) b.pop();
    };
    st.onmove = (p, e, s) => {
      ptr.x = p.x; ptr.y = p.y; ptr.t = st.t;
      if (!s || !s.n || !s.n.isPart) return;
      for (const n of parts) { const b = st.bounds(n); if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { if ((s.last || s.n) !== n) { s.last = n; n.play(); } break; } }
    };

    /* ---------- the beat lights ---------- */
    st.add({ z: 5, draw(g) {
      const now = ((lastStep % STEPS) + STEPS) % STEPS, x0 = cw + (land ? 60 : 30), x1 = W - cw - (land ? 60 : 30), y0 = land ? 150 : 128, ph = clock % 1;
      A.line(g, 'rgba(46,42,59,.55)', 2.5, (h) => { h.moveTo(x0 - 30, y0 - 8); h.quadraticCurveTo(W / 2, y0 + 40, x1 + 30, y0 - 8); });
      for (let i = 0; i < STEPS; i++) {
        const t = (i + 0.5) / STEPS, x = x0 + (x1 - x0) * t, y = y0 - 8 + 48 * 2 * t * (1 - t) + 10;
        const on = lights > 0 ? (i + Math.floor(st.t * 8)) % 3 === 0 : i === now, k = on ? (lights > 0 ? 1 : Math.exp(-ph * 2.2)) : 0;
        const col = lights > 0 ? B.BARS[(i + Math.floor(st.t * 4)) % 5] : '#FFE9A8';
        if (k > 0.02) { const gr = g.createRadialGradient(x, y, 2, x, y, 46); gr.addColorStop(0, A.alpha(col, 0.8 * k)); gr.addColorStop(1, A.alpha(col, 0)); g.fillStyle = gr; g.fillRect(x - 48, y - 48, 96, 96); }
        g.beginPath(); g.arc(x, y, land ? 13 : 10, 0, 7); g.fillStyle = k > 0.02 ? A.mix('#D3C19A', col === '#FFE9A8' ? '#FFF3C2' : col, 0.3 + 0.7 * k) : (i % 2 ? '#C7B48E' : '#D3C19A'); g.fill();
        g.beginPath(); g.arc(x - 4, y - 4, 3.5, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
        g.fillStyle = '#3A3446'; g.fillRect(x - 5, y - (land ? 19 : 15), 10, 7);
      }
    } });

    /* ---------- speed and rest controls ---------- */
    const R = land ? 44 : 40, cy = land ? 78 : 196;
    const ctl = (x, label, icon, onTap, active) => {
      const n = st.add({ ui: true, z: 100, x, y: cy, hitR: R + 4, label });
      n.draw = (g) => { if (active && active()) { g.beginPath(); g.arc(0, 0, R + 7, 0, 7); g.fillStyle = '#F2B33D'; g.fill(); } B.put(g, B.disc(R)); g.save(); g.scale(R / 40, R / 40); icon(g); g.restore(); };
      n.onTap = onTap; return n;
    };
    const hop = (fast) => Math.abs(Math.sin(st.t * (fast ? 9 : 2.2)));
    ctl(land ? 196 : 66, 'slow', (g) => B.tortoise(g, tempo === 0 ? hop(false) : 0), () => { tempo = tempo === 0 ? 1 : 0; K.sfx.tap(); if (tempo === 0) K.say(SAY.slow); save(); }, () => tempo === 0);
    ctl(land ? 304 : 166, 'fast', (g) => B.hare(g, tempo === 2 ? hop(true) : 0), () => { tempo = tempo === 2 ? 1 : 2; K.sfx.tap(); if (tempo === 2) K.say(SAY.fast); save(); }, () => tempo === 2);
    ctl(land ? W - 196 : W - 66, 'everybody rest', (g) => { g.save(); g.translate(-3, 1); B.moon(g, 22); g.restore(); }, () => {
      if (!mus.some(has)) { K.sfx.tap(); return; }
      mus.forEach((mu) => rest(mu, true)); K.sfx.tone(520, 0.5, { to: 180, type: 'sine', vol: 0.16 }); K.say(SAY.rest);
    });

    /* ---------- follow me (level 2 and up): the bunny plays a short pattern to copy ---------- */
    const bunny = mus[1];
    function followMe() {
      if (follow) return; follows++;
      const len = ctx.level >= 3 ? 3 : 2, seq = []; while (seq.length < len) { const n = Math.floor(Math.random() * 5); if (n !== seq[seq.length - 1]) seq.push(n); }
      follow = { seq, i: 0, ready: false };
      ctx.say(SAY.listen).then(() => {
        if (!follow) return;
        seq.forEach((n, k) => ctx.after(k * 620, () => { perform(bunny, { n }, Math.round(clock), true); bunny.glow = n; ctx.after(420, () => { if (follow && !follow.ready) bunny.glow = -1; }); }));
        ctx.after(seq.length * 620 + 300, () => { if (!follow) return; follow.ready = true; bunny.glow = seq[0]; lastTouch = st.t; if (follows === 1) K.say(SAY.glow); });
      });
    }
    function copied(n) {
      if (!follow || !follow.ready || n !== follow.seq[follow.i]) return;
      follow.i++; const pos = st.toScreen(bunny.node, -92 + n * 46, -120); ctx.fx.burst(pos.x, pos.y, { n: 6, color: B.BARS[n] });
      if (follow.i < follow.seq.length) { bunny.glow = follow.seq[follow.i]; return; }
      follow = null; bunny.glow = -1; K.sfx.tada(); ctx.fx.confetti(); K.say(SAY.bravo); lights = 3;
    }
    if (ctx.level >= 2) ctx.every(1000, () => { if (!follow && follows < 3 && st.t - lastTouch > 9 && st.t > 6) followMe(); if (follow && follow.ready && st.t - lastTouch > 25) { follow = null; bunny.glow = -1; } });

    K._band = { mus, parts, bubbles, log, get clock() { return clock; }, get tempo() { return tempo; }, get follow() { return follow; }, followMe, m, stepDur }; // for browser tests
    ctx.onExit(() => { st.onframe = null; mus.forEach((mu) => mu.loop.fill(null)); K._band = null; });
    ctx.prompt(SAY.open);
  }

  K.game({ id: 'band', title: 'Animal Band', voice: 'music', group: 'create', order: 2, start, lines, resize: () => K.go('band') });
})();
