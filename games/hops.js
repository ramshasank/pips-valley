/* Frog Hops — adding and taking away on a number line.
   Frog sits on numbered lily pads across a pond. The child makes Frog hop with the hop buttons, by tapping
   a pad, or by dragging Frog along the pads. Every hop is counted aloud and leaves an arc behind it, so the
   sum is something the child does: start at 5, hop 3 more, land on 8.
     Level 1  pads 0-5 then 0-10: "Hop to... Four!", "Hop two more. Where are you?"
     Level 2  sums within 10 then 20, hopping back to take away, and "how many hops to the fly?"
     Level 3  a line to 100 with big hops of ten and small hops of one (34 + 23), hopping in twos, fives and
              tens (4 x 5 as four hops of five), and landing on the fly with a mix of hop sizes.
   A long line scrolls with Frog, zooms out for a big hop, and has a little map of the whole line on top.
   Nothing can go wrong: hop too far and Frog says so and waits; after two slips the fly shows the pad. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, ID = 'hops';
  const num = (n) => K.numWord(n), capW = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const cnt = (n) => capW(num(n)) + '!';
  const SAY = {
    to: 'Hop to…', where: 'Where are you?', far: 'Too far!', back: 'Come back.', keep: 'Keep hopping!',
    toFly: 'How many hops to the fly?', how: 'Tap the arrows, or drag Frog.',
    big: 'Big hops are ten.', little: 'Little hops are one.', add: 'Add them up.', take: 'Take them away.',
    in2: 'Hop in twos.', in5: 'Hop in fives.', in10: 'Hop in tens.', howMany: 'How many hops?', land: 'Land on the fly.', yum: 'Yum!',
  };
  const more = (n) => `Hop ${num(n)} more.`, backN = (n) => `Hop ${num(n)} back.`;
  const lines = () => { const out = Object.values(SAY); for (let n = 1; n <= 10; n++) out.push(cnt(n)); for (let n = 1; n <= 9; n++) out.push(more(n), backN(n)); return out; };
  const MINUS = '−', TIMES = '×';

  /* ---------------- pictures ---------------- */
  const PIC = {};
  function load(name, src) { const im = new Image(); im.onload = () => { PIC[name] = im; }; im.src = src; }
  load('idle', 'img/bobo/frog.webp'); load('happy', 'img/tales/frog-happy.webp'); load('oh', 'img/tales/frog-oh.webp'); load('lily', 'img/tales/lilypad.webp');
  const MOOD_K = { idle: 1, happy: 1.1, oh: 1.06 };       // the three pictures are cropped differently
  const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
  /** Frog, feet at (0,0), about 150 units tall. */
  function frogSprite(mood) {
    const im = PIC[mood] || PIC.idle;
    return A.sprite('hops-frog' + mood + (im ? 'P' : ''), [-100, -176, 200, 190], (g, s) => {
      if (im) { const h = 150 * MOOD_K[PIC[mood] ? mood : 'idle'], w = h * im.width / im.height; g.save(); g.shadowColor = 'rgba(30,60,70,.28)'; g.shadowBlur = 8 * s; g.shadowOffsetY = 4 * s; g.drawImage(im, -w / 2, 6 - h, w, h); g.restore(); return; }
      const green = '#8DB548';
      for (const x of [-26, 26]) { g.beginPath(); g.ellipse(x, 0, 22, 10, 0, 0, 7); A.paper(g, s, A.shade(green, -0.06), { shadow: 0.4 }); }
      g.beginPath(); A.blob(g, 0, -46, 46, 50, 0.03, 3, 12); A.paper(g, s, green, { box: { x: -46, y: -96, w: 92, h: 100 } });
      g.beginPath(); A.blob(g, 0, -38, 28, 34, 0.03, 5, 12); g.fillStyle = '#F3E3A6'; g.fill();
      g.beginPath(); A.blob(g, 0, -106, 56, 40, 0.03, 7, 12); A.paper(g, s, green, { box: { x: -56, y: -146, w: 112, h: 80 }, shadow: 0.5 });
      for (const x of [-30, 30]) { g.beginPath(); g.arc(x, -138, 20, 0, 7); A.paper(g, s, green, { shadow: 0.3 }); g.beginPath(); g.arc(x, -138, 13, 0, 7); g.fillStyle = '#FFFDF6'; g.fill(); g.beginPath(); g.arc(x + 2, -137, 7, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
      g.fillStyle = 'rgba(232,102,74,.5)'; for (const x of [-36, 36]) { g.beginPath(); g.arc(x, -100, 9, 0, 7); g.fill(); }
      if (mood === 'idle') A.line(g, A.C.ink, 3.5, (h) => h.arc(0, -108, 18, 0.3, Math.PI - 0.3));
      else { g.beginPath(); g.ellipse(0, -98, mood === 'oh' ? 8 : 18, mood === 'oh' ? 10 : 13, 0, 0, 7); g.fillStyle = '#B0403A'; g.fill(); }
    });
  }
  function padSprite(P, kind) {
    const rx = P * 0.46, ry = P * 0.23, col = ['#6FA65F', '#5E9A58', '#86B964'][kind];
    return A.sprite('hops-pad' + Math.round(P) + 'k' + kind, [-rx - 4, -ry - 6, rx * 2 + 8, ry * 2 + 18], (g, s) => {
      const shape = (dy, grow) => { g.beginPath(); g.moveTo(rx * 0.16, dy - ry * 0.25); g.lineTo(rx * 0.86 + grow, dy - ry * 0.62); g.ellipse(0, dy, rx + grow, ry + grow * 0.5, 0, -0.5, Math.PI * 2 - 0.92); g.closePath(); };
      shape(7, 0); g.fillStyle = 'rgba(30,70,90,.22)'; g.fill();
      shape(0, 0); A.paper(g, s, col, { shadow: 0.5, box: { x: -rx, y: -ry, w: rx * 2, h: ry * 2 }, light: 0.09 });
      A.line(g, 'rgba(255,255,255,.22)', 2.5, (h) => { for (const a of [2.2, 2.9, 3.6, 4.4, 1.3, 0.5]) { h.moveTo(rx * 0.1, -ry * 0.1); h.lineTo(Math.cos(a) * rx * 0.8, Math.sin(a) * ry * 0.8); } });
      if (kind === 2) { for (let i = 0; i < 5; i++) { const a = -1.9 + i * 0.5; g.beginPath(); g.ellipse(-rx * 0.62 + Math.cos(a) * 7, -ry * 0.5 + Math.sin(a) * 6, 8, 5, a, 0, 7); g.fillStyle = i % 2 ? '#F6A9B8' : '#F9C3CC'; g.fill(); } g.beginPath(); g.arc(-rx * 0.62, -ry * 0.5, 4, 0, 7); g.fillStyle = A.C.marigold; g.fill(); }
    });
  }
  function fly(g, t, k) {
    g.save(); g.scale(k, k);
    const f = Math.sin(t * 46) * 0.5;
    g.fillStyle = 'rgba(255,255,255,.82)'; for (const sd of [-1, 1]) { g.save(); g.rotate(sd * (0.5 + f * 0.5)); g.beginPath(); g.ellipse(sd * 10, -9, 11, 6, sd * 0.5, 0, 7); g.fill(); g.strokeStyle = 'rgba(46,42,59,.3)'; g.lineWidth = 1; g.stroke(); g.restore(); }
    g.beginPath(); g.ellipse(0, 0, 10, 8, 0, 0, 7); g.fillStyle = '#3A3446'; g.fill();
    g.fillStyle = '#FFFDF6'; for (const x of [-4, 4]) { g.beginPath(); g.arc(x, -2, 2.6, 0, 7); g.fill(); }
    g.restore();
  }
  function backdrop(g, s, W, H, bankY) {
    const sky = g.createLinearGradient(0, 0, 0, bankY); sky.addColorStop(0, '#BFE0E8'); sky.addColorStop(1, '#F3ECD8');
    g.fillStyle = sky; g.fillRect(0, 0, W, bankY + 10);
    if (W >= 1000) { g.beginPath(); g.arc(W * 0.9, bankY - 104, 44, 0, 7); g.fillStyle = 'rgba(247,210,122,.75)'; g.fill(); }
    const hill = (y, amp, col, seed) => { const r = A.rng(seed), pts = [[-30, bankY + 30]]; const n = 7; for (let i = 0; i <= n; i++) pts.push([(i / n) * (W + 60) - 30, bankY - y - r() * amp]); pts.push([W + 30, bankY + 30]); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); A.smooth(g, pts, true); g.closePath(); A.paper(g, s, col, { shadow: 0.4, grain: 0.25, box: { x: 0, y: bankY - y - amp, w: W, h: y + amp } }); };
    hill(60, 70, A.C.far, 4); hill(22, 46, A.C.mid, 9);
    // water
    g.beginPath(); g.rect(0, bankY, W, H - bankY); const wg = g.createLinearGradient(0, bankY, 0, H); wg.addColorStop(0, '#9CCBDA'); wg.addColorStop(1, '#5FA3BC'); g.fillStyle = wg; g.fill();
    g.save(); g.beginPath(); g.rect(0, bankY, W, H - bankY); g.clip(); A.paper(g, s, 'rgba(255,255,255,0)', { shadow: 0, light: 0, grain: 0.3 }); g.restore();
    const r = A.rng(12);
    for (let i = 0; i < Math.round(W * H / 26000); i++) { const x = r() * W, y = bankY + 30 + r() * (H - bankY - 40), l = 26 + r() * 60; A.line(g, `rgba(255,255,255,${0.14 + r() * 0.16})`, 3, (h) => { h.moveTo(x, y); h.quadraticCurveTo(x + l / 2, y - 5, x + l, y); }); }
    // the bank: grass, reeds
    g.beginPath(); const n = Math.max(8, Math.round(W / 90)); g.moveTo(-20, bankY - 14); for (let i = 0; i < n; i++) g.quadraticCurveTo((i + 0.5) * (W / n), bankY + 26 + (i % 2) * 10, (i + 1) * (W / n) + (i === n - 1 ? 20 : 0), bankY + 2); g.lineTo(W + 20, bankY - 30); g.lineTo(-20, bankY - 30); g.closePath(); A.paper(g, s, A.C.meadow, { shadow: 0.7, grain: 0.25 });
    const rr = A.rng(77);
    for (let i = 0; i < Math.round(W / 150); i++) {
      const x = 40 + rr() * (W - 80), base = bankY + 14, hgt = 70 + rr() * 60, lean = (rr() - 0.5) * 30;
      if (x > W * 0.3 && x < W * 0.7 && rr() < 0.6) continue;
      for (const d of [-14, 12]) A.line(g, A.C.leafDark, 5, (h) => { h.moveTo(x + d * 0.4, base); h.quadraticCurveTo(x + d, base - hgt * 0.4, x + d * 2.2 + lean, base - hgt * 0.7); });
      A.line(g, A.C.leafDark, 4.5, (h) => { h.moveTo(x, base); h.quadraticCurveTo(x + lean * 0.3, base - hgt * 0.5, x + lean, base - hgt); });
      g.save(); g.translate(x + lean, base - hgt); g.rotate(lean * 0.01); g.beginPath(); A.rect(g, -7, -30, 14, 34, 7, i + 2, 0.4); A.paper(g, s, A.C.bark, { shadow: 0.4 }); g.restore();
    }
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, SET = 4;
    const sumY = land ? 204 : 232, padY = Math.round(land ? H * 0.635 : H * 0.575), btnY = land ? H - 132 : H - 205;
    let N = 5, P = 104, HF = 150;                                // pads 0..N, pitch, Frog's height
    const bankY = padY - 300;
    const lilies = land ? [[0.07, padY - 170, 0.5], [0.93, padY - 150, 0.56], [0.12, padY + 170, 0.62], [0.9, padY + 215, 0.7]] : [[0.1, padY - 190, 0.5], [0.9, padY - 170, 0.56], [0.2, padY + 150, 0.6], [0.78, padY + 180, 0.66]];
    st.add({ z: 0, draw(g) {
      put(g, A.sprite('hops-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (q, s) => backdrop(q, s, W, H, bankY)));
      if (PIC.lily) for (const [fx, y, k] of lilies) { const w = 230 * k, h = w * PIC.lily.height / PIC.lily.width; g.drawImage(PIC.lily, fx * W - w / 2 + Math.sin(st.t * 0.7 + y) * 4, y - h / 2 + Math.sin(st.t * 0.9 + fx * 9) * 2, w, h); }
    } });

    let R = null, pos = 0, won = 0, skill = 0, roundNo = 0, lastKey = '', lastKind = '', touched = false, said = {};
    let hop = null, drag = null, mood = 'idle', moodT = 0, zoomT = 0, bounce = 0, tongue = 0;
    const q = [], trail = [], ripples = [];
    const cam = { x: 0, z: 1, tz: 1 };

    /* ---------- the pond: pads, hop arcs, the fly and Frog (scrolls and zooms together) ---------- */
    const pond = st.add({ z: 10, x: 0, y: padY });
    const toWorld = (p) => ({ x: (p.x - pond.x) / cam.z, y: (p.y - pond.y) / cam.z });
    const line = pond.add(new E.Node({ z: 0 }));
    const chip = (g, s, x, y, t, col, fs) => { g.font = `800 ${fs}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = Math.max(fs * 1.3, g.measureText(t).width + fs * 0.7); g.beginPath(); A.rect(g, x - w / 2, y - fs * 0.72, w, fs * 1.44, fs * 0.7, 3, 0.3); A.paper(g, s, col, { shadow: 0.5, grain: 0.1, light: 0 }); g.fillStyle = '#FFFDF6'; g.fillText(t, x, y + 1); };
    line.draw = (g, s) => {
      const x0 = (0 - pond.x) / cam.z, x1 = (W - pond.x) / cam.z, i0 = Math.max(0, Math.floor(x0 / P) - 1), i1 = Math.min(N, Math.ceil(x1 / P) + 1);
      for (const r of ripples) { g.beginPath(); g.ellipse(r.x, r.y, r.r * (1 + r.t * 1.6), r.r * 0.42 * (1 + r.t * 1.6), 0, 0, 7); g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - r.t)})`; g.lineWidth = 4; g.stroke(); }
      const fs = P * (N > 20 ? 0.27 : 0.32);
      for (let i = i0; i <= i1; i++) {
        const x = i * P, bob = Math.sin(st.t * 1.4 + i * 1.7) * 2.5, tens = N > 20 && i % 10 === 0;
        g.save(); g.translate(x, bob);
        if (R && R.glowPad === i) { g.beginPath(); g.ellipse(0, 0, P * 0.56, P * 0.31, 0, 0, 7); g.fillStyle = A.alpha(A.C.glow, 0.6 + Math.sin(st.t * 7) * 0.3); g.fill(); }
        put(g, padSprite(P, tens ? 2 : i % 2));
        if (R && R.start === i && !R.over) { g.beginPath(); g.ellipse(0, 0, P * 0.4, P * 0.19, 0, 0, 7); g.strokeStyle = A.alpha(A.C.marigold, 0.9); g.lineWidth = 5; g.setLineDash([12, 9]); g.stroke(); g.setLineDash([]); }
        // the number, on a pebble in front of the pad
        const t = String(i), ty = P * 0.44, here = !hop && !drag && i === pos, rw = Math.max(fs * 0.86, fs * 0.36 * t.length + fs * 0.42);
        g.beginPath(); g.ellipse(0, ty, rw, fs * 0.78, 0, 0, 7); g.fillStyle = 'rgba(30,70,90,.2)'; g.fill();
        g.beginPath(); g.ellipse(0, ty - 4, rw, fs * 0.78, 0, 0, 7); g.fillStyle = here ? A.C.marigold : tens ? '#FFE9B8' : '#FFFDF6'; g.fill();
        g.fillStyle = A.C.ink; g.font = `800 ${fs}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, ty - 3);
        g.restore();
      }
      // the hops so far
      let k = 0;
      trail.forEach((h) => {
        const xa = h.a * P, xb = h.b * P, d = Math.abs(h.b - h.a), fwd = h.b > h.a, top = d === 1 ? P * 1.02 : Math.min(P * 1.8, P * (1.15 + d * 0.07)), col = fwd ? (d > 1 ? A.C.tomato : A.C.marigold) : d > 1 ? A.C.plum : A.C.blue;
        A.line(g, 'rgba(255,255,255,.55)', 9, (p) => { p.moveTo(xa, -P * 0.16); p.quadraticCurveTo((xa + xb) / 2, -top * 2 + P * 0.16, xb, -P * 0.16); });
        A.line(g, col, 5, (p) => { p.moveTo(xa, -P * 0.16); p.quadraticCurveTo((xa + xb) / 2, -top * 2 + P * 0.16, xb, -P * 0.16); });
        k++;
        chip(g, s, (xa + xb) / 2, -top - 2, d === 1 && R && R.count === 'dist' ? String(Math.abs(h.b - R.start)) : R && R.count === 'hops' ? String(k) : (fwd ? '+' : MINUS) + d, col, P * 0.22);
      });
    };
    line.update = (dt) => { for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].t += dt * 1.5; if (ripples[i].t >= 1) ripples.splice(i, 1); } };
    const splash = (x, y, r) => { ripples.push({ x, y, r: r || P * 0.5, t: 0 }); if (ripples.length > 8) ripples.shift(); };

    const bug = pond.add(new E.Node({ z: 5, drop: 0 }));
    bug.draw = (g) => {
      if (!R || !R.showFly) return;
      const x = R.target * P + Math.sin(st.t * 3.1) * 12, y = -HF - 30 + Math.cos(st.t * 4.3) * 9 - bug.drop * 260;
      bug.px = x; bug.py = y; g.translate(x, y); fly(g, st.t, P / 62);
    };
    bug.update = (dt) => { bug.drop = Math.max(0, bug.drop - dt * 2.6); };

    const frog = pond.add(new E.Node({ z: 10, x: 0, y: 0, lift: 0, pressable: false, pad: 0, label: 'Frog' }));
    frog.draw = (g) => {
      const k = HF / 150, up = frog.lift + Math.sin(Math.min(1, bounce) * Math.PI) * 26 * (bounce > 0 ? 1 : 0);
      g.beginPath(); g.ellipse(0, 4, P * 0.3 * (1 - up / 400), P * 0.09, 0, 0, 7); g.fillStyle = `rgba(30,60,50,${0.26 - Math.min(0.14, up / 900)})`; g.fill();
      if (tongue > 0 && bug.px != null) { const e = Math.sin(Math.min(1, tongue) * Math.PI); A.line(g, '#E8748A', 8, (p) => { p.moveTo(0, -HF * 0.58 - up); p.lineTo((bug.px - frog.x) * e, -HF * 0.58 - up + (bug.py + HF * 0.58 + up) * e); }); }
      const sq = hop ? Math.sin(hop.t * Math.PI) * 0.1 : drag ? 0.05 : Math.sin(st.t * 2.2) * 0.012;
      g.translate(0, -up); g.rotate(hop ? (hop.to > hop.from ? 1 : -1) * Math.sin(hop.t * Math.PI * 2) * 0.12 : drag ? Math.sin(st.t * 9) * 0.05 : moodT > 0 && mood === 'oh' ? Math.sin(st.t * 30) * 0.05 : 0);
      g.scale(k * (1 - sq), k * (1 + sq)); put(g, frogSprite(mood));
    };
    const setFrogHit = () => { frog.hit = { x: -HF * 0.42, y: -HF * 1.05, w: HF * 0.84, h: HF * 1.1 }; };
    const ribbit = () => { bounce = 0.001; K.sfx.tone(210, 0.12, { to: 330, type: 'square', vol: 0.07 }); K.sfx.tone(250, 0.14, { to: 380, type: 'square', vol: 0.07, delay: 0.14 }); };
    frog.onDown = (p) => {
      touched = true;
      if (!R || R.over || R.lock || hop || q.length || !R.free) { ribbit(); return; }
      drag = { from: pos, last: pos, sx: p.x, off: toWorld(p).x - frog.x }; frog.to({ lift: 34 }, { dur: 0.15 }); K.sfx.tap();
    };
    frog.onMove = (p) => { if (drag) drag.sx = p.x; };
    frog.onUp = (p, e, s) => {
      if (!drag) return; const d = drag; drag = null; frog.to({ lift: 0 }, { dur: 0.2, ease: 'back' });
      const to = d.last; frog.to({ x: to * P }, { dur: 0.16 });
      if (s.moved < 24 || to === d.from) { if (s.moved < 24) ribbit(); return; }
      const dir = Math.sign(to - d.from); if (Math.abs(to - d.from) <= 12) for (let i = d.from; i !== to; i += dir) step(i, i + dir); else step(d.from, to);
      pos = to; landed(true);
    };
    frog.onTap = (p) => { if (!p) ribbit(); };

    /* ---------- hopping ---------- */
    const planned = () => q.reduce((a, b) => a + b, hop ? hop.to : pos);
    function request(d, quiet) {
      if (!R || R.over || R.lock || drag) return false;
      const to = planned() + d;
      if (to < 0 || to > N) { mood = 'oh'; moodT = 0.5; K.sfx.tap(); return false; }
      if (q.length < 14) q.push(d); return true;
    }
    function travel(i) {                                   // tap a pad: hop there one pad at a time
      if (!R || R.over || R.lock || hop || q.length || drag) return;
      const d = i - pos; if (!d) { ribbit(); return; }
      if (Math.abs(d) <= 12) for (let k = 0; k < Math.abs(d); k++) q.push(Math.sign(d)); else q.push(d);
    }
    function step(a, b) { const last = trail[trail.length - 1]; if (last && last.a === b && last.b === a) trail.pop(); else trail.push({ a, b }); }
    function begin(d) {
      const big = Math.abs(d) > 1;
      hop = { from: pos, to: pos + d, t: 0, dur: big ? K.clamp(0.5 + Math.abs(d) * 0.012, 0.5, 0.9) : q.length ? 0.4 : 0.32, lift: big ? Math.min(P * 1.5, P * (0.9 + Math.abs(d) * 0.07)) : P * 0.8 };
      if (Math.abs(d) >= 5) { cam.tz = K.clamp(W / ((Math.abs(d) + 3.5) * P), 0.5, 1); zoomT = 0.5; }
      if (mood !== 'idle' && !R.over) { mood = 'idle'; }
      K.sfx.tone(big ? 240 : 320, big ? 0.3 : 0.16, { to: big ? 720 : 640, type: 'sine', vol: 0.2 });
    }
    function landed(carried) {
      const x = pos * P;
      splash(x, 0); K.sfx.tone(560, 0.1, { to: 300, type: 'sine', vol: 0.18 }); K.sfx.noise(0.06, { freq: 1400, vol: 0.08 });
      if (!R || R.over) return;
      R.rest = 0; R.judged = false; R.nag = false; R.hops += carried ? 0 : 1;
      note();
      let n = 0;
      if (R.count === 'pad') n = pos; else if (R.count === 'dist') n = Math.abs(pos - R.start); else if (R.count === 'hops') n = Number.isInteger(pos / R.by) ? pos / R.by : 0;
      K.sfx.step(Math.max(0, (n || R.hops) - 1));
      if (n >= 1 && n <= 10 && !R.lock) ctx.say(cnt(n));
    }
    function judge() {
      if (pos === R.target) { win(); return; }
      if (R.kind === 'puzzle' || pos === R.start) return;
      const dir = Math.sign(R.target - R.start), over = (pos - R.target) * dir > 0, wrong = (pos - R.start) * dir < 0;
      if (!over && !wrong) return;
      R.misses++; mood = 'oh'; moodT = 1.6; K.sfx.whoops();
      ctx.say(over ? SAY.far + ' ' + SAY.back : R.again);
      if (R.misses >= 2) reveal();
    }
    function reveal() { if (R.showFly) { R.glowPad = R.target; return; } R.showFly = true; bug.drop = 1; R.glowPad = R.target; K.sfx.tone(900, 0.3, { to: 1200, type: 'sawtooth', vol: 0.03 }); }

    /* ---------- the sum, as big text ---------- */
    const sum = st.add({ ui: true, z: 40, x: W / 2, y: sumY, pop: 0, a: [], note: '' });
    const T = (t, o) => Object.assign({ t }, o), OP = (t) => ({ t, op: 1 }), ASK = () => T('?', { q: 1 });
    const eq = (a, op, b, c) => [T(a), OP(op), typeof b === 'object' ? b : T(b), OP('='), typeof c === 'object' ? c : T(c)];
    function setSum(a) { sum.a = a; sum.pop = 1; }
    sum.draw = (g, s) => {
      if (!sum.a.length) return;
      const fs = land ? 100 : 82, toks = sum.a;
      g.save(); const k0 = 1 + sum.pop * 0.12; g.scale(k0, k0);
      g.font = `800 ${fs}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const gap = fs * 0.26, ws = toks.map((t) => Math.max(g.measureText(String(t.t)).width, t.q || t.c ? fs * 0.62 : 0) + (t.q || t.c ? fs * 0.3 : 0));
      const total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1), k = Math.min(1, (W - 70) / total);
      g.scale(k, k); let x = -total / 2;
      toks.forEach((t, i) => {
        const w = ws[i], cx = x + w / 2; x += w + gap;
        if (t.q || t.c) {
          const bob = t.q ? Math.sin(st.t * 3) * 3 : 0, col = t.c || A.C.plum;
          g.beginPath(); A.rect(g, cx - w / 2, -fs * 0.56 + bob, w, fs * 1.1, fs * 0.22, 3 + i, 0.5); A.paper(g, s, '#FFFDF6', { shadow: 0.5, grain: 0.1, light: 0 });
          if (t.q) { g.save(); g.setLineDash([fs * 0.1, fs * 0.09]); g.lineWidth = fs * 0.045; g.strokeStyle = col; g.beginPath(); A.rect(g, cx - w / 2 + 5, -fs * 0.56 + 5 + bob, w - 10, fs * 1.1 - 10, fs * 0.16, 3, 0.5); g.stroke(); g.restore(); }
          g.fillStyle = col; g.fillText(String(t.t), cx, fs * 0.04 + bob);
        } else { g.fillStyle = t.op ? A.C.plum : A.C.ink; g.fillText(String(t.t), cx, fs * 0.04); }
      });
      g.restore();
    };
    sum.update = (dt) => { sum.pop = Math.max(0, sum.pop - dt * 2.6); };
    /** The small line under the map: what the hops add up to so far. */
    function note() {
      if (!R) return;
      if (R.kind === 'add2' || R.kind === 'sub2') {
        let tens = 0, ones = 0; for (const h of trail) { const d = h.b - h.a; if (Math.abs(d) === 10) tens += Math.sign(d); else ones += d; }
        const sg = R.kind === 'sub2' ? -1 : 1; tens *= sg; ones *= sg;
        const sh = (v) => (v < 0 ? MINUS + -v : String(v)); R.note = tens || ones ? `${sh(tens)} ${Math.abs(tens) === 1 ? 'ten' : 'tens'}   ${sh(ones)} ${Math.abs(ones) === 1 ? 'one' : 'ones'}` : '';
      } else if (R.kind === 'skip') { const k = pos / R.by; R.note = pos > 0 && Number.isInteger(k) ? `${k} ${k === 1 ? 'hop' : 'hops'} of ${R.by}` : ''; }
      else if (R.kind === 'puzzle') R.note = R.hops ? `${R.hops} ${R.hops === 1 ? 'hop' : 'hops'}` : '';
    }

    /* ---------- the little map of the whole line ---------- */
    const mapY = sumY + (land ? 92 : 86), mw = Math.min(W - 90, 820);
    const mini = st.add({ ui: true, z: 38, x: W / 2, y: mapY });
    mini.draw = (g, s) => {
      if (!R) return;
      const long = (N + 1.6) * P > W + 4;
      if (long) {
        const mx = (v) => -mw / 2 + (v / N) * mw, every = N > 20 ? 10 : 5;
        g.beginPath(); A.rect(g, -mw / 2 - 22, -15, mw + 44, 30, 15, 4, 0.4); A.paper(g, s, '#FFFDF6', { shadow: 0.6, grain: 0.1, light: 0 });
        const v0 = K.clamp((0 - pond.x) / cam.z / P, 0, N), v1 = K.clamp((W - pond.x) / cam.z / P, 0, N);
        g.beginPath(); A.rect(g, mx(v0) - 6, -11, mx(v1) - mx(v0) + 12, 22, 11, 2, 0); g.fillStyle = A.alpha(A.C.water, 0.55); g.fill();
        g.font = `700 ${land ? 20 : 19}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let v = 0; v <= N; v++) { if (v % every && N > 20) continue; const big = v % every === 0; g.beginPath(); g.arc(mx(v), 0, big ? 4 : 2.2, 0, 7); g.fillStyle = A.alpha(A.C.ink, big ? 0.5 : 0.3); g.fill(); if (big) { g.fillStyle = A.alpha(A.C.ink, 0.75); g.fillText(String(v), mx(v), 30); } }
        if (!R.over) { g.beginPath(); g.arc(mx(R.start), 0, 9, 0, 7); g.strokeStyle = A.C.marigold; g.lineWidth = 4; g.stroke(); }
        if (R.showFly) { g.save(); g.translate(mx(R.target), -3 + Math.sin(st.t * 6) * 2); fly(g, st.t, 0.9); g.restore(); }
        const fx = mx(frog.x / P); g.beginPath(); g.arc(fx, 0, 12, 0, 7); g.fillStyle = '#7FAE3E'; g.fill(); g.strokeStyle = '#FFFDF6'; g.lineWidth = 3; g.stroke();
        for (const d of [-5, 5]) { g.beginPath(); g.arc(fx + d, -9, 5, 0, 7); g.fillStyle = '#7FAE3E'; g.fill(); g.beginPath(); g.arc(fx + d, -9, 2.2, 0, 7); g.fillStyle = A.C.ink; g.fill(); }
      }
      if (R.note) { g.font = `700 ${land ? 38 : 34}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const y = long ? 76 : 14, w = g.measureText(R.note).width + 48; g.beginPath(); A.rect(g, -w / 2, y - 27, w, 54, 27, 6, 0.4); A.paper(g, s, A.alpha('#FFFDF6', 0.9), { shadow: 0.5, grain: 0.1, light: 0 }); g.fillStyle = A.C.ink; g.fillText(R.note, 0, y + 2); }
    };

    /* ---------- hop buttons ---------- */
    let buttons = [];
    function makeButtons(steps) {
      buttons.forEach((b) => b.remove());
      const n = steps.length, sp = Math.min(land ? 184 : 172, (W - 16) / n), r = Math.min(68, sp / 2 - 7);
      buttons = steps.map((d, i) => {
        const fwd = d > 0, big = Math.abs(d) > 1, col = fwd ? (big ? A.C.tomato : A.C.marigold) : big ? A.C.plum : A.C.blue;
        const b = st.add({ ui: true, z: 50, x: W / 2 + (i - (n - 1) / 2) * sp, y: btnY, sx: 0, sy: 0, hitR: r + 4, pad: 4, label: 'hop ' + (fwd ? '+' : '-') + Math.abs(d) });
        b._bsx = b._bsy = 1; b.to({ sx: 1, sy: 1 }, { dur: 0.35, ease: 'back', delay: i * 0.06 });
        const text = L > 1 || big;
        b.draw = (g, s) => {
          g.beginPath(); A.blob(g, 0, 0, r, r, 0.02, 3 + i, 14); A.paper(g, s, col, { box: { x: -r, y: -r, w: r * 2, h: r * 2 }, depth: 1.2, light: 0.09 });
          g.beginPath(); g.arc(0, 0, r - 9, 0, 7); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.stroke();
          g.save(); g.scale((fwd ? 1 : -1) * r / 66, r / 66); g.translate(0, text ? -12 : 4);
          const a = big ? 30 : 22, hgt = big ? 34 : 24;
          A.line(g, '#FFFDF6', 8, (p) => { p.moveTo(-a, 8); p.quadraticCurveTo(0, 8 - hgt * 2, a, 8); });
          if (big) A.line(g, 'rgba(255,253,246,.6)', 5, (p) => { p.moveTo(-a + 12, 8); p.quadraticCurveTo(0, 8 - hgt * 1.1, a - 12, 8); });
          g.beginPath(); A.cut(g, [[a - 14, 0], [a + 10, -2], [a + 2, 20]], 3, 0, 2); g.fillStyle = '#FFFDF6'; g.fill();
          g.restore();
          if (text) { g.fillStyle = '#FFFDF6'; g.font = `800 ${r * 0.52}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((fwd ? '+' : MINUS) + Math.abs(d), 0, r * 0.4); }
        };
        b.onTap = () => { touched = true; request(d); };
        return b;
      });
    }

    /* ---------- flies caught ---------- */
    const tally = st.add({ ui: true, z: 6, x: land ? 66 : W / 2 - 1.5 * 74, y: land ? H - 64 : H - 66, pop: 0 });
    tally.draw = (g, s) => {
      for (let i = 0; i < SET; i++) {
        g.save(); g.translate(i * 74, 0);
        g.beginPath(); g.ellipse(0, 6, 30, 19, 0, 0, 7); A.paper(g, s, i < won ? '#86B964' : A.alpha('#6FA65F', 0.45), { shadow: i < won ? 0.5 : 0, grain: 0.1 });
        if (i < won) { const k = i === won - 1 ? 1 + tally.pop * 0.6 : 1; g.translate(0, -4); fly(g, st.t * 0.25 + i, 1.15 * k); }
        g.restore();
      }
    };
    tally.update = (dt) => { tally.pop = Math.max(0, tally.pop - dt * 2.5); };

    /* ---------- rounds ---------- */
    const ri = K.randInt;
    function spec(kind) {
      const S = { kind, free: L < 3, steps: [-1, 1], count: 'dist', showFly: false, by: 1 };
      if (skill >= 1.5) said.grown = 1;                       // the line grows once and stays long
      S.N = L === 3 ? 100 : (L === 1 ? 5 : 10) * (said.grown ? 2 : 1);
      const n = S.N;
      if (kind === 'goto') {
        S.start = K.clamp(pos, 0, n); do { S.target = ri(1, n); } while (Math.abs(S.target - S.start) < (n > 5 ? 2 : 1));
        S.count = 'pad'; S.sum = [T(S.target, { c: A.C.teal })]; S.prompt = SAY.to + ' ' + cnt(S.target); S.done = [T(S.target, { c: A.C.teal })];
      } else if (kind === 'more' || kind === 'add') {
        const b = ri(1, kind === 'more' ? 3 : skill < 1 ? 4 : 9), a = ri(kind === 'more' ? 0 : 1, n - b);
        S.start = a; S.target = a + b; S.sum = eq(a, '+', b, ASK()); S.done = eq(a, '+', b, T(a + b, { c: A.C.teal })); S.prompt = more(b) + ' ' + SAY.where; S.again = more(b);
      } else if (kind === 'back' || kind === 'sub') {
        const a = ri(kind === 'back' ? 2 : 3, n), b = ri(1, Math.min(kind === 'back' ? 3 : 9, a));
        S.start = a; S.target = a - b; S.sum = eq(a, MINUS, b, ASK()); S.done = eq(a, MINUS, b, T(a - b, { c: A.C.teal })); S.prompt = backN(b) + ' ' + SAY.where; S.again = backN(b);
      } else if (kind === 'diff') {
        const d = ri(2, Math.min(9, n - 1)), a = ri(0, n - d);
        S.start = a; S.target = a + d; S.showFly = true; S.sum = eq(a, '+', ASK(), a + d); S.done = eq(a, '+', T(d, { c: A.C.teal }), a + d); S.prompt = SAY.toFly; S.again = SAY.toFly; S.answer = d;
      } else if (kind === 'add2' || kind === 'sub2') {
        const add = kind === 'add2', a = add ? ri(11, 58) : ri(35, 99), b = ri(11, Math.min(39, add ? 100 - a : a - 1));
        S.start = a; S.target = add ? a + b : a - b; S.steps = [-10, -1, 1, 10]; S.count = '';
        S.sum = eq(a, add ? '+' : MINUS, b, ASK()); S.done = eq(a, add ? '+' : MINUS, b, T(S.target, { c: A.C.teal }));
        S.prompt = add ? SAY.add : SAY.take; S.again = S.prompt; S.intro = SAY.big + ' ' + SAY.little;
      } else if (kind === 'skip') {
        const by = K.pick([2, 5, 10]), k = ri(by === 2 ? 3 : 2, 10);
        S.by = by; S.start = 0; S.target = k * by; S.steps = [-by, by]; S.count = 'hops';
        S.sum = eq(k, TIMES, by, ASK()); S.done = eq(k, TIMES, by, T(k * by, { c: A.C.teal })); S.prompt = SAY['in' + by] + ' ' + SAY.howMany + ' ' + cnt(k); S.again = SAY['in' + by];
      } else {
        S.steps = skill < 3 ? [-1, 1, 5, 10] : K.pick([[-1, 2, 10], [-2, 5, 10], [-5, 2, 10], [-1, 5, 10]]);
        S.start = ri(0, 24); S.target = S.start + ri(13, 48); S.showFly = true; S.count = '';
        S.sum = eq(S.start, '+', ASK(), S.target); S.done = eq(S.start, '+', T(S.target - S.start, { c: A.C.teal }), S.target); S.prompt = SAY.land; S.again = SAY.land;
      }
      S.key = kind + '/' + S.start + '/' + S.target;
      return S;
    }
    function kinds() {
      if (L === 1) return skill < 1 ? ['goto'] : skill < 2 ? ['goto', 'more'] : ['goto', 'more', 'back'];
      if (L === 2) return skill < 1 ? ['add'] : ['add', 'sub', 'diff'];
      return skill < 1 ? ['add2', 'skip'] : skill < 2 ? ['add2', 'skip', 'sub2'] : ['add2', 'sub2', 'skip', 'puzzle'];
    }
    const camClamp = (x) => { const hw = W / (2 * cam.z), lo = -P * 0.85 + hw, hi = N * P + P * 0.85 - hw; return lo >= hi ? (N * P) / 2 : K.clamp(x, lo, hi); };
    async function newRound(force) {
      let S, guard = 0; const list = kinds();
      do { const kind = force || (roundNo === 0 ? list[0] : K.pick(list)); if (!force && kind === lastKind && list.length > 1 && guard++ < 8) continue; S = spec(kind); } while ((!S || S.key === lastKey || S.target === (R && R.target)) && guard++ < 40);
      lastKey = S.key; lastKind = S.kind; roundNo++;
      const first = !R;
      R = S; R.over = false; R.lock = true; R.misses = 0; R.hops = 0; R.rest = 0; R.judged = true; R.note = ''; R.glowPad = -1;
      const fly0 = R.showFly; R.showFly = false;
      mood = 'idle'; q.length = 0; trail.length = 0;
      // the line itself may change length; Frog keeps his number where he can
      const oldP = P; N = R.N;
      P = L === 3 ? (land ? 104 : 88) : land ? K.clamp((W - 70) / (N + 1.2), 104, 150) : 104;
      HF = P * 1.44; setFrogHit();
      pos = K.clamp(pos, 0, N); if (first || oldP !== P) { frog.x = pos * P; cam.x = camClamp(frog.x); }
      makeButtons(R.steps);
      setSum(R.sum); K.sfx.whoosh();
      if (pos !== R.start) {                         // Frog leaps to where this sum begins
        const d = R.start - pos; begin(d); await ctx.wait(hop.dur * 1000 + 350); if (R !== S) return;
      }
      trail.length = 0; R.hops = 0; R.showFly = fly0; if (fly0) { bug.drop = 1; R.peek = (N + 1.6) * P > W ? 1.1 : 0; }
      R.lock = false; R.rest = 0; R.judged = true;
      let extra = roundNo === 1 ? ' ' + SAY.how : ''; if (R.intro && !said.big) { said.big = 1; extra = ' ' + R.intro; }
      ctx.prompt(R.prompt + extra);
    }
    async function win() {
      const r = R; r.over = true; r.lock = true; r.glowPad = -1;
      skill = K.clamp(skill + (r.misses ? -0.5 : 0.5), 0, 4);
      if (!r.showFly) { r.showFly = true; bug.drop = 1; await ctx.wait(520); if (R !== r) return; }
      tongue = 0.001; K.sfx.tone(700, 0.12, { to: 1400, type: 'sine', vol: 0.16 });
      await ctx.wait(170); if (R !== r) return;
      r.showFly = false; mood = 'happy'; moodT = 99; bounce = 0.001;
      K.sfx.ding(); const sp = st.toScreen(frog, 0, -HF * 0.6); ctx.fx.burst(sp.x, sp.y, { n: 16 });
      setSum(r.done);
      const tell = r.answer && r.answer <= 10 ? cnt(r.answer) : won % 2 === 0 ? SAY.yum : '';
      if (tell) ctx.say(tell);
      ctx.after(260, () => K.sfx.sparkle());
      await ctx.wait(1900); if (R !== r) return;
      won++; tally.pop = 1; K.sfx.pop();
      await ctx.wait(700); if (R !== r) return;
      if (won >= SET) { await ctx.celebrate({ ms: 3400 }); if (R !== r) return; won = 0; }
      newRound();
    }

    /* ---------- every frame ---------- */
    st.onframe = (dt) => {
      if (hop) {
        hop.t += dt / hop.dur; const k = Math.min(1, hop.t), e = k * k * (3 - 2 * k);
        frog.x = (hop.from + (hop.to - hop.from) * e) * P; frog.lift = Math.sin(k * Math.PI) * hop.lift;
        if (k >= 1) { const h = hop; hop = null; frog.lift = 0; pos = h.to; if (R && !R.lock) step(h.from, h.to); landed(false); }
      } else if (q.length && R && !drag) begin(q.shift());
      if (drag) {
        const edge = 110; if (drag.sx < edge) cam.x = camClamp(cam.x - 620 * dt * (1 - drag.sx / edge)); else if (drag.sx > W - edge) cam.x = camClamp(cam.x + 620 * dt * (1 - (W - drag.sx) / edge));
        pond.x = W / 2 - cam.x * cam.z;
        frog.x = K.clamp((drag.sx - pond.x) / cam.z - drag.off, 0, N * P);
        const near = Math.round(frog.x / P); if (near !== drag.last) { drag.last = near; K.sfx.step(Math.abs(near - drag.from)); splash(near * P, 0, P * 0.3); }
      } else {
        let tx = frog.x;
        if (R && R.peek > 0) { R.peek -= dt; tx = R.target * P; }
        else if (R && R.showFly && !R.over) tx += K.clamp((R.target * P - frog.x) * 0.4, -W * 0.3, W * 0.3);
        if (!hop || Math.abs(hop.to - hop.from) < 5) { zoomT -= dt; if (zoomT <= 0) cam.tz = 1; }
        cam.z += (cam.tz - cam.z) * Math.min(1, dt * 6);
        cam.x += (camClamp(tx) - cam.x) * Math.min(1, dt * 4.5);
      }
      pond.x = W / 2 - cam.x * cam.z; pond.sx = pond.sy = cam.z;
      if (bounce > 0) { bounce += dt * 3.2; if (bounce >= 1) bounce = 0; }
      if (tongue > 0) { tongue += dt * 3; if (tongue >= 1) tongue = 0; }
      if (moodT > 0 && moodT < 50) { moodT -= dt; if (moodT <= 0 && mood === 'oh') mood = 'idle'; }
      if (R && !R.over && !R.lock && !hop && !q.length && !drag) {
        R.rest += dt;
        if (!R.judged && R.rest > 0.85) { R.judged = true; judge(); }
        if (!R.nag && R.rest > 8 && pos !== R.start && pos !== R.target && R.kind !== 'puzzle') { R.nag = true; ctx.say(SAY.keep); }
      }
    };
    // tap a pad to hop there; tap the water for a ripple
    st.ondown = (p, e, n) => {
      if (n) return;
      const w = toWorld(p), i = Math.round(w.x / P);
      if (w.y > -P * 0.5 && w.y < P * 0.85 && i >= 0 && i <= N && Math.abs(w.x - i * P) < P * 0.5) { touched = true; if (R && R.free) travel(i); else { splash(i * P, 0, P * 0.4); K.sfx.tap(); } }
      else if (p.y > bankY + 20) { splash(w.x, w.y, 30); K.sfx.tone(700, 0.08, { to: 420, type: 'sine', vol: 0.12 }); }
    };

    /* ---------- a paper hand shows the first move ---------- */
    const hand = st.add({ ui: true, z: 80, visible: false });
    hand.draw = (g, s) => { g.scale(0.8, 0.8); A.hand(g, s, (st.t * 1.1) % 1 < 0.3 ? 1 : 0.3); };
    hand.update = () => { const b = buttons[buttons.length - 1]; hand.visible = !touched && roundNo === 1 && !!R && !R.lock && st.t > 4 && !!b; if (hand.visible) { hand.x = b.x + 10; hand.y = b.y + 14; } };

    K._hops = {                                            // for browser tests
      get R() { return R; }, get pos() { return pos; }, get N() { return N; }, get P() { return P; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; }, cam, trail,
      get busy() { return !!hop || q.length > 0; }, get sum() { return sum.a.map((t) => t.t).join(' '); },
      hop: (d) => request(d), goTo: (i) => travel(i), next: (kind) => newRound(kind),
      screen: (i) => st.toScreen(pond, i * P, 0), unit: st.unit,
    };
    ctx.onExit(() => { st.onframe = null; st.ondown = null; K._hops = null; });
    setFrogHit();
    ctx.after(350, () => newRound());
  }

  function icon(g, w) {
    const u = w / 300;
    const sky = g.createLinearGradient(0, 0, 0, w); sky.addColorStop(0, '#BFE0E8'); sky.addColorStop(0.34, '#F3ECD8'); sky.addColorStop(0.36, '#9CCBDA'); sky.addColorStop(1, '#5FA3BC');
    g.fillStyle = sky; g.fillRect(0, 0, w, w);
    g.fillStyle = '#7FB08A'; g.beginPath(); g.moveTo(0, 112 * u); g.quadraticCurveTo(80 * u, 60 * u, 170 * u, 100 * u); g.quadraticCurveTo(240 * u, 70 * u, w, 104 * u); g.lineTo(w, 116 * u); g.lineTo(0, 116 * u); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3 * u; g.lineCap = 'round';
    for (const [x, y] of [[40, 150], [210, 140], [120, 270], [250, 262]]) { g.beginPath(); g.moveTo(x * u, y * u); g.quadraticCurveTo((x + 18) * u, (y - 4) * u, (x + 36) * u, y * u); g.stroke(); }
    const xs = [56, 150, 244], y = 226 * u;
    for (const x of xs) { g.fillStyle = 'rgba(30,70,90,.22)'; g.beginPath(); g.ellipse(x * u, y + 6 * u, 42 * u, 19 * u, 0, 0, 7); g.fill(); g.fillStyle = x === 150 ? '#86B964' : '#6FA65F'; g.beginPath(); g.moveTo(x * u + 8 * u, y - 4 * u); g.lineTo(x * u + 38 * u, y - 12 * u); g.ellipse(x * u, y, 42 * u, 19 * u, 0, -0.5, Math.PI * 2 - 0.9); g.fill(); }
    g.strokeStyle = '#F2B33D'; g.lineWidth = 7 * u; g.setLineDash([2 * u, 13 * u]); g.beginPath(); g.moveTo(56 * u, 196 * u); g.quadraticCurveTo(103 * u, 96 * u, 150 * u, 150 * u); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#F2B33D'; g.lineWidth = 6 * u; g.beginPath(); g.moveTo(170 * u, 150 * u); g.quadraticCurveTo(210 * u, 110 * u, 244 * u, 200 * u); g.globalAlpha = 0.45; g.stroke(); g.globalAlpha = 1;
    const im = PIC.happy || PIC.idle;
    if (im) { const h = 150 * u, wd = h * im.width / im.height; g.drawImage(im, 150 * u - wd / 2, y - h + 8 * u, wd, h); }
    else { g.fillStyle = '#8DB548'; g.beginPath(); g.ellipse(150 * u, y - 44 * u, 40 * u, 46 * u, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(150 * u, y - 98 * u, 48 * u, 34 * u, 0, 0, 7); g.fill(); for (const d of [-26, 26]) { g.fillStyle = '#8DB548'; g.beginPath(); g.arc((150 + d) * u, y - 126 * u, 17 * u, 0, 7); g.fill(); g.fillStyle = '#FFFDF6'; g.beginPath(); g.arc((150 + d) * u, y - 126 * u, 11 * u, 0, 7); g.fill(); g.fillStyle = '#2E2A3B'; g.beginPath(); g.arc((150 + d) * u, y - 125 * u, 6 * u, 0, 7); g.fill(); } }
    g.save(); g.translate(244 * u, 150 * u); g.fillStyle = 'rgba(255,255,255,.85)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 12 * u, -10 * u, 12 * u, 7 * u, sd * 0.6, 0, 7); g.fill(); } g.fillStyle = '#3A3446'; g.beginPath(); g.ellipse(0, 0, 11 * u, 9 * u, 0, 0, 7); g.fill(); g.restore();
  }

  K.game({ id: ID, title: 'Frog Hops', voice: ID, group: 'arcade', age: 5, subject: 'math', order: 40, icon, start, lines, resize: () => K.go(ID) });
})();
