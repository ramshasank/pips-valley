/* Build It — wooden blocks with weight.
   Drag a block out of the store (or just tap it) and it drops, lands with a knock and stacks.
   A block set down with its middle hanging over the edge tumbles off; nothing balances on a
   point. The measuring pole counts how many blocks tall the tower is. The wrecking ball knocks
   everything down, which is half the fun.
   Plans: a pale outline of a car, house, rocket or train appears on the rug; blocks dropped near
   their place click in, and the finished thing comes to life (the car drives off, the rocket
   counts down and launches). Free building is one tap away in the plan chooser.
   No wrong answers: a block that does not belong simply hops back to the store. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, B = A.build, TYPES = B.TYPES, C = B.COL;
  const ORDER = ['square', 'brick', 'triangle', 'arch', 'half', 'circle'];
  const P = (t, x, y, c) => ({ t, x, y, c });
  const PLANS = [
    { id: 'car', name: 'car', pieces: () => [P('circle', -0.6, 0, C.dark), P('circle', 0.6, 0, C.dark), P('brick', 0, 1, C.red), P('half', 0, 2, C.blue)] },
    { id: 'house', name: 'house', pieces: (L) => (L === 1 ? [P('square', -0.5, 0, C.yellow), P('square', 0.5, 0, C.yellow), P('triangle', 0, 1, C.red)]
      : [P('square', -0.5, 0, C.yellow), P('square', 0.5, 0, C.yellow), P('square', -0.5, 1, C.yellow), P('square', 0.5, 1, C.yellow), P('triangle', 0, 2, C.red)]) },
    { id: 'rocket', name: 'rocket', pieces: (L) => (L === 1 ? [P('arch', 0, 0, C.red), P('brick', 0, 1, C.white), P('triangle', 0, 2, C.red)]
      : [P('arch', 0, 0, C.red), P('brick', 0, 1, C.white), P('brick', 0, 2, C.white), P('triangle', 0, 3, C.red)]) },
    { id: 'train', name: 'train', pieces: (L) => (L === 1 ? [P('circle', -0.6, 0, C.dark), P('circle', 0.6, 0, C.dark), P('brick', 0, 1, C.teal), P('square', -0.5, 2, C.red)]
      : [P('circle', -1.8, 0, C.dark), P('circle', -0.6, 0, C.dark), P('circle', 0.6, 0, C.dark), P('circle', 1.8, 0, C.dark), P('brick', -1.2, 1, C.blue), P('brick', 1.2, 1, C.teal), P('half', -1.2, 2, C.yellow), P('square', 0.7, 2, C.red)]), ex: (L) => (L === 1 ? 0 : 1.2) },
  ];
  const SAY = { free: 'Build what you like!', tall: 'So tall!', crash: 'Crash!', pick: 'What shall we build?', fits: ['It fits!', 'Click!', 'Yes!', 'Good one!'], blast: 'Blast off!', freeTile: 'free building', count: ['Three!', 'Two!', 'One!'] };
  const cap = (w) => w[0].toUpperCase() + w.slice(1) + '!';
  const lines = () => [SAY.free, SAY.tall, SAY.crash, SAY.pick, SAY.blast, SAY.freeTile, ...SAY.fits, ...SAY.count, ...ORDER.map((t) => TYPES[t].say),
    ...Array.from({ length: 12 }, (x, i) => cap(K.numWord(i + 1))), ...PLANS.map((p) => `Let's build a ${p.name}!`), ...PLANS.map((p) => `You made the ${p.name}!`)];

  function start(st, ctx) {
    const W = st.W, H = st.H, land = W >= 1000, L = ctx.level;
    const U = land ? 96 : 70, FY = land ? 850 : H - 344;
    const rx = land ? 250 : 46, L0 = land ? 292 : 76, R0 = land ? W - 196 : W - 100, cx = (L0 + R0) / 2;
    const rows = Math.floor((FY - (land ? 170 : 290)) / U), TS = land ? 0.56 : 0.62;
    const sw = (W - 24) / 3;
    const slots = ORDER.map((t, i) => (land ? { t, x: 108, y: 204 + i * 134 } : { t, x: 12 + ((i % 3) + 0.5) * sw, y: H - 200 + Math.floor(i / 3) * 108 }));
    const lay = { W, H, FY, L0, R0, U, land, rx, rows, cx, slots };
    const store = (K.s.done.build = K.s.done.build || {}); store.made = store.made || {}; store.tallest = store.tallest || 0;
    const goal = Math.min(rows, 7);

    st.add({ z: 0, sprite: A.sprite('buildroom' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => B.room(g, s, lay)) });

    /* ---------------- blocks and their small physics ---------------- */
    const blocks = [];
    let held = null, busy = false, chooserOpen = false, mode = 'free', plan = null, pslots = [], said = 0, partied = false, cursorX = null, builds = 0;
    const mk = (t, col, x, y) => { const T = TYPES[t]; const b = { t, col: col || K.pick(T.cols), w: T.w * U, h: T.h * U, x, y, vx: 0, vy: 0, rot: 0, vr: 0, rotT: null, state: 'fall', sq: 0, sqv: 0, k: 1 }; blocks.push(b); return b; };
    const drop = (b) => { const i = blocks.indexOf(b); if (i >= 0) blocks.splice(i, 1); };
    const solid = (o) => o.state === 'rest' || o.state === 'snap';
    const top = (b) => b.y - b.h / 2, bot = (b) => b.y + b.h / 2;
    const xo = (a, b, ax) => { const x = ax == null ? a.x : ax; return Math.min(x + a.w / 2, b.x + b.w / 2) - Math.max(x - a.w / 2, b.x - b.w / 2); };
    const yo = (a, b) => Math.min(bot(a), bot(b)) - Math.max(top(a), top(b));
    const onFloor = (b) => bot(b) >= FY - 1.5;
    const supports = (b) => blocks.filter((o) => o !== b && solid(o) && Math.abs(top(o) - bot(b)) < 2.5 && xo(b, o) > 4);
    /** The highest surface under a block at x (ignores where the block is now). */
    const surfTop = (b, x) => { let y = FY; for (const o of blocks) if (o !== b && solid(o) && xo(b, o, x) > 4 && top(o) < y) y = top(o); return y; };
    const blockedX = (b, nx) => blocks.some((o) => o !== b && solid(o) && yo(b, o) > 4 && xo(b, o, nx) > 2 && xo(b, o, nx) > xo(b, o));
    const snapRot = (b) => { const s = TYPES[b.t].sym; b.rotT = Math.round(b.rot / s) * s; b.vr = 0; };
    const knock = (imp) => { if (imp < 260) return; K.sfx.tone(170 + Math.random() * 70, 0.08, { type: 'triangle', vol: K.clamp(imp / 5200, 0.07, 0.3), to: 110 }); K.sfx.noise(0.03, { freq: 1400, vol: 0.08 }); };

    function landed(b, imp) {
      knock(imp); if (imp > 260) { b.sq = K.clamp(imp / 2600, 0.14, 0.6); b.sqv = 0; }
      b.vx = 0; snapRot(b);
      if (onFloor(b)) { rest(b); return; }
      const sup = supports(b); if (!sup.length) { b.state = 'rest'; return; }       // sitting on something still moving; sorts itself out
      let lo = 1e9, hi = -1e9; for (const o of sup) { const hw = (o.w / 2) * TYPES[o.t].sup; lo = Math.min(lo, o.x - hw); hi = Math.max(hi, o.x + hw); }
      const tol = hi > lo ? 3 : -1;
      if (b.x >= lo - tol && b.x <= hi + tol) rest(b);
      else { b.state = 'tumble'; b.tt = 0; b.rotT = null; b.dir = Math.abs(b.x - (lo + hi) / 2) < 2 ? (Math.random() < 0.5 ? -1 : 1) : b.x < (lo + hi) / 2 ? -1 : 1; K.sfx.tone(520, 0.14, { to: 300, vol: 0.1 }); }
    }
    function rest(b) { b.state = 'rest'; if (b.mine) { b.mine = false; cursorX = b.x; } }
    function step(dt) {
      const dyn = blocks.filter((b) => b.state === 'fall' || b.state === 'rest' || b.state === 'tumble').sort((a, b) => bot(b) - bot(a));
      for (const b of dyn) {
        if (b.state === 'rest') { if (!onFloor(b) && !supports(b).length) { b.state = 'fall'; b.vy = 0; } else continue; }
        if (b.state === 'tumble') {
          b.tt += dt; const nx = b.x + b.dir * 280 * dt; b.rot += b.dir * 6 * dt;
          if (b.tt > 1.3 || nx - b.w / 2 < L0 || nx + b.w / 2 > R0 || blockedX(b, nx)) { b.state = 'rest'; snapRot(b); continue; }
          b.x = nx; if (!supports(b).length) { b.state = 'fall'; b.vx = b.dir * 90; b.vr = b.dir * 6; }
          continue;
        }
        b.vy += 3400 * dt;
        if (b.vx) { const nx = b.x + b.vx * dt; if (nx - b.w / 2 >= L0 && nx + b.w / 2 <= R0 && !blockedX(b, nx)) b.x = nx; else b.vx = 0; b.vx *= 1 - 2 * dt; }
        b.rot += b.vr * dt;
        let sy = FY; for (const o of blocks) if (o !== b && (solid(o) || o.state === 'tumble' || o.state === 'fall') && xo(b, o) > 4 && top(o) >= bot(b) - 8 && top(o) < sy) sy = top(o);
        const ny = b.y + b.vy * dt;
        if (ny + b.h / 2 >= sy) { b.y = sy - b.h / 2; const imp = b.vy; b.vy = 0; landed(b, imp); } else b.y = ny;
      }
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        b.sqv += (-b.sq * 260 - b.sqv * 13) * dt; b.sq += b.sqv * dt;
        if (b.rotT != null) b.rot += (b.rotT - b.rot) * Math.min(1, 16 * dt);
        if (b.state === 'held') { b.x += (b.tx - b.x) * Math.min(1, 30 * dt); b.y += (b.ty - b.y) * Math.min(1, 30 * dt); b.rot += (K.clamp((b.tx - b.x) * 0.012, -0.3, 0.3) - b.rot) * Math.min(1, 12 * dt); b.k += (1.08 - b.k) * Math.min(1, 14 * dt); }
        else if (b.state === 'loose') {
          b.vy += 2600 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
          if (b.x < b.w / 2 + 8) { b.x = b.w / 2 + 8; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > W - b.w / 2 - 8) { b.x = W - b.w / 2 - 8; b.vx = -Math.abs(b.vx) * 0.5; }
          const fl = FY + b.fz - b.h / 2;
          if (b.y > fl) { b.y = fl; if (b.vy > 320) { knock(b.vy * 0.7); b.vy = -b.vy * 0.36; b.vr *= 0.6; } else { b.vy = 0; if (b.rotT == null) snapRot(b); } b.vx *= 1 - 5 * dt; }
        } else if (b.state === 'fly') {
          const f = b.fly; f.t += dt; if (f.t < 0) continue;
          if (f.x0 == null) { f.x0 = b.x; f.y0 = b.y; f.k0 = b.k; f.r0 = b.rot; b.rotT = null; }
          const p = Math.min(1, f.t / f.dur), e = E.ease.inOut(p);
          b.x = f.x0 + (f.x1 - f.x0) * e; b.y = f.y0 + (f.y1 - f.y0) * e - Math.sin(Math.PI * p) * f.arc; b.k = f.k0 + (f.k1 - f.k0) * e; b.rot = f.r0 * (1 - e);
          if (p >= 1) { b.state = ''; f.then(b); }
        }
      }
    }
    const fly = (b, x1, y1, o) => { b.state = 'fly'; b.fly = Object.assign({ x1, y1, dur: 0.32, arc: 0, k1: 1, t: 0, then: () => {} }, o); b.fly.t = -(b.fly.delay || 0); };
    const slotOf = (t) => slots[ORDER.indexOf(t)];
    /** Back to the store. */
    const putAway = (b, delay) => { const q = slotOf(b.t); fly(b, q.x, q.y, { dur: 0.3, arc: 60, k1: TS, delay, then: (x) => { drop(x); K.sfx.tone(700, 0.05, { vol: 0.08 }); } }); };

    /* ---------------- picking up and letting go ---------------- */
    function grab(b, p, fromStore) { held = b; b.state = 'held'; b.rotT = null; b.vr = 0; b.gx = fromStore ? 0 : p.x - b.x; b.gy = fromStore ? b.h * 0.45 : p.y - b.y; b.tx = p.x - b.gx; b.ty = p.y - b.gy; b.ox = b.x; b.oy = b.y; pip.watch = 1.5; }
    const moveHeld = (p) => { if (held) { held.tx = p.x - held.gx; held.ty = p.y - held.gy; } };
    const overStore = (b) => (land ? b.tx + b.w / 2 < L0 - 20 : b.ty > FY + 84);
    function release() {
      const b = held; held = null; if (!b) return;
      b.k = 1; b.x = b.tx; b.y = b.ty; b.rot = 0;
      if (mode === 'plan') { trySnap(b); return; }
      if (overStore(b)) { putAway(b); return; }
      b.x = K.clamp(b.x, L0 + b.w / 2, R0 - b.w / 2); b.y = Math.min(b.y, FY - b.h / 2);
      for (let i = 0; i < 14; i++) { const o = blocks.find((q) => q !== b && solid(q) && xo(b, q) > 4 && yo(b, q) > 2); if (!o) break; b.y = top(o) - b.h / 2; }
      // a little help lining up with the block underneath
      let under = null; for (const o of blocks) if (o !== b && solid(o) && xo(b, o) > 4 && top(o) >= bot(b) - 4 && (!under || top(o) < top(under))) under = o;
      if (under) { const tol = U * [0.36, 0.25, 0.14][L - 1]; const c = [under.x, under.x - under.w / 2 + b.w / 2, under.x + under.w / 2 - b.w / 2].sort((p, q) => Math.abs(p - b.x) - Math.abs(q - b.x))[0]; if (Math.abs(c - b.x) < tol) b.x = c; }
      b.state = 'fall'; b.vy = 0; b.mine = true; trim();
    }
    /** Keep the room from filling up: the oldest block quietly goes back to the store. */
    function trim() { const live = blocks.filter((b) => b.state === 'rest'); if (live.length > 26) putAway(live[0]); }

    /** Tap a block in the store: it hops out by itself. */
    function tapAdd(t, q) {
      K.say(TYPES[t].say); q.hop = 1;
      if (busy || chooserOpen) return;
      if (mode === 'plan') {
        const s = pslots.find((x) => x.t === t && avail(x));
        if (!s) { K.sfx.tone(300, 0.1, { to: 240, vol: 0.1 }); q.wig = 1; return; }
        const b = mk(t, s.c, q.x, q.y); b.k = TS; s.filled = b; fly(b, s.x, s.y, { dur: 0.42, arc: 130, then: () => clicked(b, s) });
        return;
      }
      const b = mk(t, null, q.x, q.y); b.k = TS;
      let x = K.clamp(cursorX == null ? cx : cursorX, L0 + b.w / 2, R0 - b.w / 2);
      if (surfTop(b, x) - b.h < 150) { x = K.clamp(x + (x > cx ? -1 : 1) * U * 2.5, L0 + b.w / 2, R0 - b.w / 2); cursorX = x; }
      fly(b, x, Math.max(150, surfTop(b, x) - b.h / 2 - 130), { dur: 0.4, arc: 90, then: () => { b.state = 'fall'; b.vy = 0; b.mine = true; trim(); } });
      K.sfx.tone(360, 0.12, { to: 620, vol: 0.12 });
    }

    /* ---------------- plans ---------------- */
    const avail = (s) => !s.filled && s.sup.every((j) => pslots[j].filled && pslots[j].filled.state === 'snap');
    const needs = (t) => pslots.some((s) => s.t === t && avail(s));
    const trayCol = (t) => { const s = pslots.find((x) => x.t === t); return s ? s.c : TYPES[t].cols[0]; };
    function setPlan(p) {
      for (const b of blocks.slice()) if (b.state !== 'fly') putAway(b, Math.random() * 0.2);
      plan = p; mode = p ? 'plan' : 'free'; said = 0; cursorX = null; marker.to({ alpha: 0 }, { dur: 0.2 });
      pslots = p ? p.pieces(L).map((q) => ({ t: q.t, c: q.c, ux: q.x, row: q.y, x: cx + q.x * U, y: FY - (q.y + 0.5) * U, w: TYPES[q.t].w * U, h: U, filled: null })) : [];
      pslots.forEach((s) => { s.sup = []; pslots.forEach((o, j) => { if (o.row === s.row - 1 && Math.abs(o.ux - s.ux) < (TYPES[o.t].w + TYPES[s.t].w) / 2 - 0.05) s.sup.push(j); }); });
      ctx.prompt(p ? `Let's build a ${p.name}!` : SAY.free);
    }
    function trySnap(b) {
      const R = [1e5, 230, 150][L - 1];
      let best = null, bd = R; for (const s of pslots) if (s.t === b.t && avail(s)) { const d = Math.hypot(s.x - b.x, s.y - b.y); if (d < bd) { bd = d; best = s; } }
      if (!best || overStore(b)) { putAway(b); if (!overStore(b)) K.sfx.tone(300, 0.1, { to: 240, vol: 0.1 }); return; }
      best.filled = b; fly(b, best.x, best.y, { dur: 0.16, then: () => clicked(b, best) });
    }
    function clicked(b, s) {
      b.state = 'snap'; b.rot = 0; b.sq = 0.4; b.sqv = 0; K.sfx.pop(); knock(1500);
      const n = pslots.filter((x) => x.filled).length; K.sfx.step(n); ctx.fx.burst(s.x, s.y, { n: 7 }); pip.cheer();
      if (pslots.every((x) => x.filled && x.filled.state === 'snap')) { busy = true; ctx.after(420, alive); }
      else if (n % 2 === 0) K.say(K.pick(SAY.fits));
    }

    /* ---------------- the finished thing comes to life ---------------- */
    let crea = null;
    async function alive() {
      const p = plan, ex = (p.ex ? p.ex(L) : 0) * U, topRow = Math.max(...pslots.map((s) => s.row));
      const c = (crea = st.add({ z: 14, x: cx, y: FY, fa: 0, fl: 0, spin: 0, shake: 0, t: 0 }));
      c.pieces = pslots.map((s) => ({ t: s.t, c: s.c, w: s.w, h: s.h, x: s.x - cx, y: s.y - FY }));
      for (const s of pslots) drop(s.filled); pslots = [];
      c.update = (dt) => { c.t += dt; };
      c.draw = (g, s) => {
        if (c.shake) g.translate(Math.sin(st.t * 70) * c.shake, 0);
        g.save(); g.globalAlpha *= c.fa;
        if (p.id === 'house') { const y = -(topRow + 0.5) * U; g.beginPath(); A.rect(g, U * 0.34, y - U * 0.58, U * 0.3, U * 0.6, 4, 2, 0.4); A.paper(g, s, '#A9604E', { shadow: 0.5 }); smoke(g, U * 0.49, y - U * 0.62, c.t); }
        if (p.id === 'train') { g.beginPath(); A.rect(g, ex + U * 0.42, -U * 2.52, U * 0.3, U * 0.56, 4, 2, 0.4); A.paper(g, s, C.dark, { shadow: 0.5 }); g.beginPath(); A.rect(g, ex + U * 0.36, -U * 2.62, U * 0.42, U * 0.14, 4, 3, 0.3); g.fillStyle = C.yellow; g.fill(); smoke(g, ex + U * 0.57, -U * 2.66, c.t); }
        if (p.id === 'rocket' && c.fl > 0) { const f = c.fl * (0.85 + Math.sin(st.t * 40) * 0.15); for (const [col, k] of [['#F08A35', 1], ['#F7D27A', 0.6]]) { g.beginPath(); g.moveTo(-U * 0.42 * k, -U * 0.3); g.quadraticCurveTo(-U * 0.5 * k, U * 0.5 * f * k, 0, U * 1.5 * f * k); g.quadraticCurveTo(U * 0.5 * k, U * 0.5 * f * k, U * 0.42 * k, -U * 0.3); g.closePath(); g.fillStyle = col; g.fill(); } }
        g.restore();
        for (const q of c.pieces) { const sp = B.sprite(q.t, q.c, q.w, q.h); g.save(); g.translate(q.x, q.y); if (q.t === 'circle') g.rotate(c.spin); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore(); }
        g.save(); g.globalAlpha *= c.fa; const fk = U / 62, happy = c.happy;
        if (p.id === 'car') { g.beginPath(); g.ellipse(0, -U * 2.02, U * 0.62, U * 0.62, 0, Math.PI, Math.PI * 2); g.fillStyle = 'rgba(226,243,247,.9)'; g.fill(); A.line(g, 'rgba(255,255,255,.8)', 5, (h) => h.arc(0, -U * 2.02, U * 0.46, Math.PI * 1.15, Math.PI * 1.4)); B.face(g, U * 0.25, -U * 1.5, fk, { open: happy, look: 1 }); g.beginPath(); g.arc(U * 0.86, -U * 1.3, U * 0.09, 0, 7); g.fillStyle = '#F7D27A'; g.fill(); }
        if (p.id === 'train') { B.face(g, ex + U * 0.3, -U * 1.5, fk, { open: happy, look: 1 }); const qx = (L === 1 ? -0.5 : 0.7) * U; g.beginPath(); A.rect(g, qx - U * 0.26, -U * 2.76, U * 0.52, U * 0.42, 6, 2, 0.4); g.fillStyle = 'rgba(226,243,247,.92)'; g.fill(); }
        if (p.id === 'rocket') { B.face(g, 0, -U * 1.52, fk, { open: happy }); if (topRow > 2) { g.beginPath(); g.arc(0, -U * 2.5, U * 0.3, 0, 7); g.fillStyle = '#5B8FC7'; g.fill(); g.beginPath(); g.arc(0, -U * 2.5, U * 0.21, 0, 7); g.fillStyle = 'rgba(226,243,247,.95)'; g.fill(); } }
        if (p.id === 'house') {
          const win = (x, y) => { g.beginPath(); A.rect(g, x - U * 0.24, y - U * 0.24, U * 0.48, U * 0.48, 5, 2, 0.4); g.fillStyle = '#FCE9A6'; g.fill(); A.line(g, '#F7F1E4', 5, (h) => { h.rect(x - U * 0.24, y - U * 0.24, U * 0.48, U * 0.48); h.moveTo(x, y - U * 0.24); h.lineTo(x, y + U * 0.24); h.moveTo(x - U * 0.24, y); h.lineTo(x + U * 0.24, y); }, 'butt'); };
          g.beginPath(); g.moveTo(-U * 0.76, 0); g.lineTo(-U * 0.76, -U * 0.42); g.arc(-U * 0.5, -U * 0.42, U * 0.26, Math.PI, 0); g.lineTo(-U * 0.24, 0); g.closePath(); g.fillStyle = C.teal; g.fill(); g.beginPath(); g.arc(-U * 0.34, -U * 0.3, U * 0.045, 0, 7); g.fillStyle = '#F7D27A'; g.fill();
          win(U * 0.5, -U * 0.52); if (topRow > 1) { win(-U * 0.5, -U * 1.5); win(U * 0.5, -U * 1.5); }
          B.face(g, 0, -(topRow + 0.42) * U, fk * 0.9, { open: happy });
        }
        g.restore();
      };
      K.sfx.sparkle(); await c.to({ fa: 1 }, { dur: 0.4 }); c.happy = true; pip.cheer();
      await c.to({ y: FY - 36 }, { dur: 0.17, ease: 'out' }); await c.to({ y: FY }, { dur: 0.15, ease: (t) => t * t }); knock(1800);
      c.to({ sy: 0.9, sx: 1.07 }, { dur: 0.07 }).then(() => c.to({ sy: 1, sx: 1 }, { dur: 0.4, ease: 'elastic' }));
      await ctx.wait(420);
      if (p.id === 'car' || p.id === 'train') {
        if (p.id === 'train') [0, 0.28].forEach((d) => { K.sfx.tone(620, 0.2, { type: 'triangle', vol: 0.2, delay: d }); K.sfx.tone(784, 0.2, { type: 'triangle', vol: 0.14, delay: d }); });
        else [0, 0.16].forEach((d) => K.sfx.tone(480, 0.1, { type: 'triangle', vol: 0.2, delay: d }));
        for (let i = 0; i < 9; i++) K.sfx.tone(90 + i * 14, 0.16, { type: 'sawtooth', vol: 0.05, delay: 0.3 + i * 0.13 });
        await ctx.wait(450);
        c.update = (dt) => { c.t += dt; c.spin = (c.x - cx) / (U * 0.5); };
        await c.to({ x: W + U * 5 }, { dur: 1.7, ease: (t) => t * t * (0.5 + 0.5 * t) });
      } else if (p.id === 'rocket') {
        for (const n of SAY.count) { K.say(n); K.sfx.tone(520, 0.12, { vol: 0.16 }); c.shake = 2; c.to({ sy: 0.96 }, { dur: 0.1 }).then(() => c.to({ sy: 1 }, { dur: 0.3, ease: 'elastic' })); await ctx.wait(780); }
        K.say(SAY.blast); c.shake = 4; c.to({ fl: 1 }, { dur: 0.3 }); K.sfx.noise(1.6, { freq: 500, vol: 0.3 }); K.sfx.tone(110, 1.5, { to: 520, type: 'sawtooth', vol: 0.08 });
        await ctx.wait(350); ctx.fx.burst(cx, FY, { n: 20, colors: ['#F08A35', '#F7D27A', '#FBF6EC'] });
        await c.to({ y: -U * 6 }, { dur: 1.5, ease: (t) => t * t * t });
      } else {
        const hx = cx + U * 1.9; pip.walk(Math.min(hx, pip.homeX), 0.55); await ctx.wait(700); pip.waveT = 2.2; K.sfx.ding();
        await ctx.wait(2400); pip.walk(pip.homeX, 0.5); ctx.fx.burst(cx, FY - U * 1.4, { n: 22 }); K.sfx.pop();
        await c.to({ sx: 0, sy: 0 }, { dur: 0.3, ease: 'inOut' });
      }
      c.remove(); crea = null;
      store.made[p.id] = (store.made[p.id] || 0) + 1; K.save(); builds++;
      K.say(`You made the ${p.name}!`); ctx.fx.confetti();
      if (builds % 3 === 0) await ctx.celebrate(); else await ctx.wait(1700);
      busy = false;
      setPlan(PLANS.find((q) => !store.made[q.id]) || null);   // once every plan is made, it is free building
      if (mode === 'free') card.pulse = true;
    }
    function smoke(g, x, y, t) { for (let i = 0; i < 3; i++) { const p = ((t * 0.55 + i / 3) % 1); g.beginPath(); g.arc(x + Math.sin(p * 5 + i) * 8, y - p * U * 0.9, 6 + p * 12, 0, 7); g.fillStyle = `rgba(250,250,250,${0.75 * (1 - p)})`; g.fill(); } }

    /* ---------------- the block layer ---------------- */
    const layer = st.add({ z: 12 });
    const drawBlock = (g, b) => { const sp = B.sprite(b.t, b.col, b.w, b.h); g.save(); g.translate(b.x, b.y + b.h / 2); g.scale((1 + b.sq * 0.2) * b.k, (1 - b.sq * 0.24) * b.k); g.translate(0, -b.h / 2); if (b.rot) g.rotate(b.rot); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore(); };
    layer.draw = (g) => {
      for (const s of pslots) {
        if (s.filled) continue; const on = avail(s), near = on && held && held.t === s.t;
        g.save(); g.translate(s.x, s.y); g.beginPath(); B.path(g, s.t, s.w - 6, s.h - 6);
        g.fillStyle = `rgba(255,255,255,${near ? 0.75 : on ? 0.4 + Math.sin(st.t * 4) * 0.12 : 0.14})`; g.fill();
        g.setLineDash([11, 9]); g.strokeStyle = `rgba(46,42,59,${on ? 0.4 : 0.2})`; g.lineWidth = 3; g.stroke(); g.restore();
      }
      if (held && mode === 'free' && !overStore(held)) { const x = K.clamp(held.x, L0 + held.w / 2, R0 - held.w / 2), y = surfTop(held, x); if (y > bot(held)) { g.beginPath(); g.ellipse(x, y, held.w * 0.46, 7, 0, 0, 7); g.fillStyle = 'rgba(46,40,70,.16)'; g.fill(); } }
      for (const b of blocks) if (b !== held && b.state !== 'fly' && b.state !== 'loose') drawBlock(g, b);
      for (const b of blocks) if (b.state === 'loose') drawBlock(g, b);
    };
    const over = st.add({ z: 22 });      // carried and flying blocks pass in front of everything
    over.draw = (g) => { for (const b of blocks) if (b.state === 'fly' && b.fly.t >= 0) drawBlock(g, b); if (held) drawBlock(g, held); };

    /* picking up blocks that are already built */
    const area = st.add({ z: 5, hit: { x: L0 - 4, y: 120, w: R0 - L0 + 8, h: FY - 120 + 30 }, pad: 0, pressable: false });
    area.onDown = (p) => {
      if (busy || chooserOpen || mode !== 'free' || held) return;
      let hit = null; for (const b of blocks) if (b.state === 'rest' && Math.abs(p.x - b.x) < b.w / 2 + 8 && Math.abs(p.y - b.y) < b.h / 2 + 8) hit = b;
      if (hit) { grab(hit, p); K.sfx.tone(300, 0.05, { vol: 0.1 }); }
    };
    area.onMove = (p) => moveHeld(p);
    area.onUp = (p, e, s) => {
      if (!held) return;
      if (s.moved < 14) { const b = held; held = null; b.x = b.ox; b.y = b.oy; b.k = 1; b.rot = 0; b.state = 'rest'; b.sq = 0.3; b.sqv = 0; K.say(TYPES[b.t].say); K.sfx.tap(); }
      else release();
    };

    /* the store */
    slots.forEach((q, i) => {
      const hw = land ? 86 : sw / 2, hh = land ? 62 : 54;
      const n = st.add({ z: 20, x: q.x, y: q.y, hit: { x: -hw, y: -hh, w: hw * 2, h: hh * 2 }, pad: 0, pressable: false, label: TYPES[q.t].say });
      q.hop = 0; q.wig = 0; q.dim = 0;
      n.update = (dt) => { q.hop = Math.max(0, q.hop - dt * 2.6); q.wig = Math.max(0, q.wig - dt * 2.5); const off = mode === 'plan' && !needs(q.t) && !busy; q.dim += ((off ? 1 : 0) - q.dim) * Math.min(1, 8 * dt); };
      n.draw = (g) => {
        const T = TYPES[q.t], col = mode === 'plan' ? trayCol(q.t) : T.cols[0], sp = B.sprite(q.t, col, T.w * U, T.h * U);
        const want = mode === 'plan' && needs(q.t) && !busy, bob = want ? Math.abs(Math.sin(st.t * 3 + i)) * 7 : 0;
        g.save(); g.translate(Math.sin(q.wig * 22) * q.wig * 8, -Math.sin(q.hop * Math.PI) * 16 - bob + (land ? 8 : 0)); g.globalAlpha = 1 - q.dim * 0.5; g.scale(TS * (1 - q.dim * 0.14), TS * (1 - q.dim * 0.14));
        g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore();
      };
      n.onDown = () => { q.drag = null; };
      n.onMove = (p, e, s) => {
        if (!q.drag && s.moved > 16 && !busy && !chooserOpen && !held) {
          if (mode === 'plan' && !needs(q.t)) { q.wig = 1; return; }
          const b = mk(q.t, mode === 'plan' ? trayCol(q.t) : null, q.x, q.y); b.k = TS; grab(b, p, true); q.drag = b; st.cancelTaps(); K.sfx.tone(360, 0.08, { to: 520, vol: 0.12 });
        }
        if (q.drag) moveHeld(p);
      };
      n.onUp = () => { if (q.drag && held === q.drag) release(); q.drag = null; };
      n.onTap = () => tapAdd(q.t, q);
    });

    /* ---------------- how tall? ---------------- */
    const marker = st.add({ z: 13, x: rx + 22, y: FY, alpha: 0 });
    marker.draw = (g, s) => { g.beginPath(); A.cut(g, [[0, 0], [22, -19], [62, -19], [62, 19], [22, 19]], [3, 8, 8, 8, 8], 0.5, 3); A.paper(g, s, A.C.marigold, { shadow: 0.9, box: { x: 0, y: -19, w: 62, h: 38 } }); g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 - 1.57, r = i % 2 ? 5 : 11; g.lineTo(40 + Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#FBF6EC'; g.fill(); };
    st.add({ z: 3, draw(g) { if (store.tallest >= 2) { const y = FY - Math.min(rows, store.tallest) * U; g.beginPath(); g.moveTo(rx - 19, y); g.lineTo(rx - 44, y + 11); g.lineTo(rx - 19, y + 22); g.closePath(); g.fillStyle = A.C.plum; g.fill(); } } }); // the tallest tower so far
    function measure() {
      if (mode !== 'free' || busy || held || blocks.some((b) => b.state === 'fall' || b.state === 'tumble' || b.state === 'fly')) return;
      let ty = FY; for (const b of blocks) if (b.state === 'rest' && top(b) < ty) ty = top(b);
      const n = Math.round((FY - ty) / U); if (n === said) return;
      if (n > said) {
        K.say(cap(K.numWord(n))); K.sfx.step(n); pip.cheer();
        if (n > store.tallest) { store.tallest = n; K.save(); }
        if (n === 5) ctx.after(800, () => { K.say(SAY.tall); ctx.fx.burst(cursorX || cx, ty, { n: 18 }); K.sfx.sparkle(); });
        if (n >= goal && !partied) { partied = true; ctx.after(900, () => ctx.celebrate()); }
      }
      said = n; marker.to({ y: ty, alpha: n ? 1 : 0 }, { dur: 0.3, ease: 'back' });
    }

    /* ---------------- knock it down ---------------- */
    const pv = { x: cx, y: -70 }, LR = FY - 62 - pv.y;
    const ball = st.add({ z: 18, visible: false, a: 0, len: 0 });
    ball.draw = (g, s) => { const x = pv.x + Math.sin(ball.a) * ball.len, y = pv.y + Math.cos(ball.a) * ball.len; A.line(g, '#6B5A4A', 7, (h) => { h.moveTo(pv.x, pv.y); h.lineTo(x, y - 50); }); g.save(); g.translate(x, y); g.rotate(-ball.a * 0.5); B.ball(g, s, 56, { open: true }); g.restore(); };
    let hitting = false;
    async function knockDown() {
      if (busy || chooserOpen) return; busy = true; if (held) { drop(held); held = null; }
      K.sfx.whoosh(); pip.oh = 1.6; marker.to({ alpha: 0 }, { dur: 0.2 });
      const a0 = Math.asin(Math.min(0.97, (R0 - cx + 90) / LR));
      ball.visible = true; ball.a = a0; ball.len = LR * 0.15;
      await ball.to({ len: LR }, { dur: 0.3, ease: 'out' });
      hitting = true; K.say(SAY.crash);
      await ball.to({ a: -a0 }, { dur: 0.9, ease: (t) => (1 - Math.cos(Math.PI * t)) / 2 });
      hitting = false;
      await ball.to({ len: LR * 0.1, a: -a0 * 0.5 }, { dur: 0.45, ease: 'inOut' }); ball.visible = false;
      await ctx.wait(1300);
      blocks.forEach((b, i) => { if (b.state === 'loose') putAway(b, i * 0.05); });
      await ctx.wait(500 + blocks.length * 50);
      said = 0; cursorX = null; busy = false;
    }
    function smash() {
      const bx = pv.x + Math.sin(ball.a) * ball.len;
      for (const b of blocks) {
        if (!(solid(b) || b.state === 'fall' || b.state === 'tumble') || b.x + b.w / 2 < bx - 30) continue;
        const hgt = (FY - b.y) / U; b.state = 'loose'; b.rotT = null; b.fz = 6 + Math.random() * (land ? 70 : 40);
        b.vx = -(260 + Math.random() * 520) / (1 + hgt * 0.12); b.vy = -(300 + Math.random() * 620); b.vr = (Math.random() - 0.5) * 18;
        for (const s of pslots) if (s.filled === b) s.filled = null;
        K.sfx.drum('tom'); knock(1400 + Math.random() * 1500); ctx.fx.burst(b.x, b.y, { n: 3 });
      }
    }

    /* ---------------- Pip watches ---------------- */
    const ps = land ? 1.12 : 0.74, homeX = land ? W - 100 : W - 50;
    const pip = st.add({ z: 16, x: homeX, y: land ? FY + 84 : FY + 44, homeX, state: {}, hopT: 0, watch: 0, oh: 0, waveT: 0, bl: 2 });
    pip.hit = { x: -70 * ps, y: -150 * ps, w: 140 * ps, h: 156 * ps }; pip.label = 'Pip'; pip.pressable = false; pip.onTap = () => { pip.cheer(); K.sfx.pop(); };
    pip.cheer = () => { pip.hopT = 0.45; pip.open = 0.9; };
    pip.walk = (x, dur) => pip.to({ x }, { dur, ease: 'inOut' });
    pip.update = (dt) => { pip.hopT = Math.max(0, pip.hopT - dt); pip.open = Math.max(0, (pip.open || 0) - dt); pip.oh = Math.max(0, pip.oh - dt); pip.waveT = Math.max(0, pip.waveT - dt); pip.bl -= dt; if (pip.bl < -0.12) pip.bl = 2 + Math.random() * 3; };
    pip.draw = (g, s) => {
      const hop = Math.sin((pip.hopT / 0.45) * Math.PI), sp = pip.state, tx = held ? held.x : crea ? crea.x : cx;
      sp.look = K.clamp((tx - pip.x) / 300, -1, 1); sp.blink = pip.bl < 0; sp.mouth = pip.oh > 0 ? 'oh' : pip.open > 0 || pip.waveT > 0 ? 'open' : 'smile';
      sp.squash = pip.hopT > 0 ? hop * 0.07 : Math.sin(st.t * 2.2) * 0.012; sp.leaf = Math.sin(st.t * 2) * 0.08; sp.wave = pip.waveT > 0 ? Math.sin(st.t * 12) * 0.5 + 0.5 : 0;
      g.save(); g.translate(0, -hop * 26); g.scale(ps, ps); A.pip(g, s, sp); g.restore();
    };

    /* ---------------- buttons ---------------- */
    const btn = (x, y, label, icon, onTap) => { const r = land ? 56 : 46; const n = st.add({ z: 20, x, y, hitR: r + 4, label, pulse: false }); n.draw = (g, s) => { const q = (n.pulse ? 1 + Math.sin(st.t * 6) * 0.07 : 1) * (r / 56); g.save(); g.scale(q, q); g.beginPath(); g.arc(0, 0, 56, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 1, light: 0.04, box: { x: -56, y: -56, w: 112, h: 112 } }); icon(g, s); g.restore(); }; n.onTap = () => onTap(n); return n; };
    const card = btn(land ? W - 100 : 70, land ? 250 : 216, 'plans', (g, s) => {
      g.save(); g.rotate(-0.08); g.beginPath(); A.rect(g, -34, -30, 68, 60, 6, 3, 0.5); A.paper(g, s, '#5B8FC7', { shadow: 0.6, grain: 0.15 });
      g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 3.4; g.lineJoin = 'round';
      g.beginPath(); g.rect(-18, -2, 36, 24); g.moveTo(-24, -2); g.lineTo(0, -22); g.lineTo(24, -2); g.stroke(); g.restore();
    }, () => { K.sfx.pop(); openChooser(); });
    btn(land ? W - 100 : W - 70, land ? 410 : 216, 'knock it down', (g, s) => { A.line(g, '#6B5A4A', 5, (h) => { h.moveTo(14, -52); h.lineTo(2, -24); }); g.save(); g.translate(-2, 8); g.rotate(0.2); B.ball(g, s, 31, { open: true }); g.restore(); }, () => knockDown());

    /* ---------------- plan chooser ---------------- */
    let chooser = null;
    function openChooser() {
      if (chooserOpen || busy) return; chooserOpen = true; card.pulse = false;
      const items = [null].concat(PLANS), cols = land ? 3 : 2, rws = Math.ceil(items.length / cols), gap = 24;
      const t = Math.min((W - 80) / cols - gap, (H - 240) / rws - gap, 260);
      const pw = cols * t + (cols + 1) * gap, ph = rws * t + (rws + 1) * gap, x0 = (W - pw) / 2, y0 = (H - ph) / 2 + 20;
      chooser = st.add({ z: 200, ui: true, alpha: 0, hit: { x: 0, y: 0, w: W, h: H }, pad: 0, pressable: false });
      chooser.draw = (g, s) => { g.fillStyle = 'rgba(46,42,59,.45)'; g.fillRect(0, 0, W, H); g.beginPath(); A.rect(g, x0, y0, pw, ph, 30, 4, 1.5); A.paper(g, s, '#F6EFE3', { shadow: 1.4, depth: 1.6, box: { x: x0, y: y0, w: pw, h: ph } }); };
      chooser.onTap = (p) => { if (p && (p.x < x0 || p.x > x0 + pw || p.y < y0 || p.y > y0 + ph)) closeChooser(); };
      chooser.to({ alpha: 1 }, { dur: 0.2 });
      items.forEach((p, i) => {
        const pcs = p ? p.pieces(L) : [P('brick', -0.3, 0, C.teal), P('circle', 1.3, 0, C.green), P('square', -0.6, 1, C.red), P('triangle', -0.2, 2, C.plum)];
        const xs = pcs.map((q) => [q.x - TYPES[q.t].w / 2, q.x + TYPES[q.t].w / 2]).flat(), wU = Math.max(...xs) - Math.min(...xs), hU = Math.max(...pcs.map((q) => q.y)) + 1, mid = (Math.max(...xs) + Math.min(...xs)) / 2;
        const k = Math.min((t * 0.7) / (wU * U), (t * 0.66) / (hU * U));
        const tile = chooser.add(new E.Node({ x: x0 + gap + (i % cols) * (t + gap) + t / 2, y: y0 + gap + Math.floor(i / cols) * (t + gap) + t / 2, hit: { x: -t / 2, y: -t / 2, w: t, h: t }, pad: 4, label: p ? p.name : SAY.freeTile, z: 1 }));
        tile.draw = (g, s) => {
          g.beginPath(); A.rect(g, -t / 2, -t / 2, t, t, 16, i + 3, 0.6); A.paper(g, s, p ? '#DCE9F2' : '#EFE3CF', { shadow: 1, light: 0.03, grain: 0.1, box: { x: -t / 2, y: -t / 2, w: t, h: t } });
          g.beginPath(); g.ellipse(0, t * 0.36, t * 0.36, t * 0.045, 0, 0, 7); g.fillStyle = 'rgba(46,40,70,.12)'; g.fill();
          g.save(); g.translate(0, t * 0.36); g.scale(k, k);
          for (const q of pcs) { const sp = B.sprite(q.t, q.c, TYPES[q.t].w * U, U); g.save(); g.translate((q.x - mid) * U, -(q.y + 0.5) * U); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore(); }
          g.restore();
          if (p && store.made[p.id]) { g.save(); g.translate(t / 2 - 26, -t / 2 + 26); g.beginPath(); for (let q = 0; q < 10; q++) { const a = (q / 10) * 6.283 - 1.57, rr = q % 2 ? 10 : 21; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); A.paper(g, s, A.C.marigold, { shadow: 0.7 }); g.restore(); }
        };
        tile.onTap = () => { K.sfx.pop(); closeChooser(); setPlan(p); };
      });
      K.say(SAY.pick);
    }
    function closeChooser() { if (!chooser) return; const c = chooser; chooser = null; c.to({ alpha: 0 }, { dur: 0.15 }).then(() => { c.remove(); chooserOpen = false; }); }

    st.onframe = (dt) => { step(dt); if (hitting) smash(); measure(); };

    K._build = { blocks, lay, get mode() { return mode; }, get plan() { return plan; }, get pslots() { return pslots; }, get said() { return said; }, get busy() { return busy; }, get held() { return held; }, store, setPlan, PLANS }; // for browser tests
    ctx.onExit(() => { K._build = null; });
    setPlan(PLANS.find((p) => !store.made[p.id]) || null);
  }

  K.game({ id: 'build', title: 'Build It', voice: 'puzzle', group: 'play', order: 2, start, lines, resize: () => K.go('build') });
})();
