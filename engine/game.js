/* Pip's Playhouse — drawn games.
   K.game({id, title, voice, lines, start(stage, ctx)}) registers a game that runs on its own canvas
   stage instead of the old DOM activity frame. The engine supplies the chrome every game shares:
   Home and "say it again" buttons, a caption for grown-ups, sparkles, the celebration, and a small
   physics world for things that tumble.

   ctx is the usual activity ctx (wait/after/every/say/onExit/alive/level) plus:
     ctx.stage                 the Stage
     ctx.prompt(text, {who})   speak the instruction; repeated by the speaker button and when idle
     ctx.fx.burst(x, y, opts)  paper sparkles; ctx.fx.confetti()
     ctx.celebrate({ms})       confetti, Pip cheers, spoken praise */
(function () {
  'use strict';
  const E = K.engine, A = K.art;

  K.game = function (def) {
    def.canvas = true;
    K.activities = K.activities.filter((a) => a.id !== def.id);
    K.register(def);
  };

  E.run = function (def, ctx, host) {
    const st = E.stage(host, { minW: def.minW || 560 });
    st.canvas.setAttribute('aria-hidden', 'true');
    const mood = A.mood; A.mood = 'day'; // games are lit as day, whatever the valley is doing
    A.setRes(st.res);
    ctx.onExit(() => { A.mood = mood; st.destroy(); });
    ctx.stage = st;

    /* ---- prompt: spoken, repeated on the speaker button and after a quiet spell ---- */
    let text = '', who, idle = null, caption = '';
    const arm = () => { clearTimeout(idle); idle = setTimeout(() => { if (ctx.alive && text) { K.say(text, { who }); arm(); } }, 14000); };
    ctx._poke = () => { if (idle) arm(); };
    st.canvas.addEventListener('pointerdown', () => ctx._poke());
    ctx.onExit(() => clearTimeout(idle));
    ctx.prompt = function (t, o) { text = t; who = o && o.who; caption = (o && o.show) || t; arm(); return o && o.silent ? Promise.resolve() : ctx.say(t, { who }); };
    ctx.progress = () => {};

    /* ---- chrome ---- */
    const disc = (g, s, r) => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); A.paper(g, s, '#FBF6EC', { shadow: 0.9, light: 0.03, box: { x: -r, y: -r, w: r * 2, h: r * 2 } }); };
    const home = st.add({ ui: true, z: 100, x: 78, y: 78, label: 'Home', hitR: 52 });
    home.draw = (g, s) => {
      disc(g, s, 48);
      g.beginPath(); A.rect(g, -20, -6, 40, 30, 4, 2, 0.5); g.fillStyle = A.C.cream; g.fill();
      g.beginPath(); A.cut(g, [[-30, -4], [0, -30], [30, -4]], 5, 0.5, 3); g.fillStyle = A.C.tomato; g.fill();
      g.beginPath(); A.rect(g, -7, 6, 14, 18, 3, 4, 0); g.fillStyle = A.C.teal; g.fill();
    };
    home.onTap = () => { K.sfx.tap(); K.home(); };
    const again = st.add({ ui: true, z: 100, x: st.W - 78, y: 78, label: 'Say it again', hitR: 52 });
    again.draw = (g, s) => {
      disc(g, s, 48);
      g.fillStyle = A.C.ink; g.beginPath(); A.cut(g, [[-22, -8], [-10, -8], [4, -22], [4, 22], [-10, 8], [-22, 8]], 3, 0, 5); g.fill();
      A.line(g, A.C.ink, 4.5, (h) => { h.arc(4, 0, 13, -0.8, 0.8); h.moveTo(4 + Math.cos(-0.9) * 24, Math.sin(-0.9) * 24); h.arc(4, 0, 24, -0.9, 0.9); });
    };
    again.onTap = () => { K.sfx.tap(); if (text) K.say(text, { who }); };
    const cap = st.add({ ui: true, z: 99, x: st.W / 2, y: 70 });
    cap.draw = (g, s) => {
      if (!caption) return;
      g.font = `700 ${st.W < 900 ? 26 : 32}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const max = st.W - 300; let t = caption; while (g.measureText(t).width > max && t.length > 8) t = t.slice(0, -2); if (t !== caption) t += '…';
      const w = g.measureText(t).width + 56;
      g.beginPath(); A.rect(g, -w / 2, -28, w, 56, 28, 6, 0.6); A.paper(g, s, A.alpha('#FBF6EC', 0.92), { shadow: 0.6, light: 0, grain: 0.12 });
      g.fillStyle = A.C.ink; g.fillText(t, 0, 2);
    };
    st.onresize = () => { again.x = st.W - 78; cap.x = st.W / 2; if (def.resize) def.resize(st, ctx); };

    /* ---- sparkles & confetti ---- */
    const parts = [];
    st.add({ ui: true, z: 90,
      update(dt) { for (const p of parts) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt; } for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1); },
      draw(g) { for (const p of parts) { g.save(); g.globalAlpha = Math.min(1, p.life * 3); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; if (p.star) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283, r = i % 2 ? p.s * 0.45 : p.s; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); } else g.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2); g.restore(); } } });
    const COLS = [A.C.tomato, A.C.marigold, A.C.teal, A.C.blue, A.C.plum, A.C.peach];
    ctx.fx = {
      burst(x, y, o) { o = o || {}; for (let i = 0; i < (o.n || 12); i++) { const a = Math.random() * 6.283, v = 150 + Math.random() * 380; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, g: 900, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, s: 7 + Math.random() * 9, c: o.color || K.pick(o.colors || COLS), life: 0.6 + Math.random() * 0.5, star: o.star !== false }); } },
      confetti() { for (let i = 0; i < 90; i++) parts.push({ x: Math.random() * st.W, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 200, vy: 200 + Math.random() * 300, g: 260, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 8 + Math.random() * 8, c: K.pick(COLS), life: 2.6 + Math.random(), star: false }); },
    };

    /* ---- celebration ---- */
    ctx.celebrate = function (o) {
      o = o || {};
      const ms = o.ms || 3200;
      const pip = st.add({ ui: true, z: 95, x: st.W / 2, y: st.H + 320, state: { mouth: 'open' } });
      pip.draw = (g, s) => { g.save(); g.scale(2.1, 2.1); pip.state.wave = Math.sin(st.t * 12) * 0.5 + 0.5; pip.state.squash = Math.sin(st.t * 14) * 0.04; A.pip(g, s, pip.state); g.restore(); };
      pip.to({ y: st.H + 60 }, { dur: 0.5, ease: 'back' });
      K.sfx.tada(); ctx.fx.confetti(); ctx.after(500, () => ctx.fx.confetti());
      K.praise();
      return ctx.wait(ms - 400).then(() => pip.to({ y: st.H + 340 }, { dur: 0.35, ease: 'inOut' })).then(() => { pip.remove(); });
    };

    try { def.start(st, ctx); } catch (e) { console.error(e); }
    return st;
  };

  /* ---------------- physics: round things that tumble ----------------
     world({gravity, floor, left, right, boxes:[{x0,x1,y0}]}) -> {bodies, add(b), remove(b), step(dt)}
     body: {x, y, vx, vy, r, rot, vr, held, ghost, tx, ty} — held bodies chase (tx,ty); ghosts are ignored. */
  E.world = function (o) {
    const w = Object.assign({ gravity: 2800, floor: 800, left: 0, right: 1000, boxes: [], bodies: [] }, o);
    w.add = (b) => { Object.assign(b, { vx: b.vx || 0, vy: b.vy || 0, rot: b.rot || 0, vr: b.vr || 0 }); w.bodies.push(b); return b; };
    w.remove = (b) => { const i = w.bodies.indexOf(b); if (i >= 0) w.bodies.splice(i, 1); };
    function sub(dt) {
      const bs = w.bodies;
      for (const b of bs) {
        if (b.ghost) continue;
        if (b.held) { b.vx = K.clamp((b.tx - b.x) * 22, -5000, 5000); b.vy = K.clamp((b.ty - b.y) * 22, -5000, 5000); }
        else b.vy += w.gravity * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
        b.ground = false;
        if (b.y + b.r > w.floor) { b.y = w.floor - b.r; if (b.vy > 0) b.vy = b.vy > 260 ? -b.vy * 0.32 : 0; b.vx *= 1 - 2.2 * dt; b.vr += (b.vx / b.r - b.vr) * Math.min(1, 14 * dt); b.ground = true; }
        if (b.held) continue; // a held thing can be carried anywhere above the floor
        if (b.x - b.r < w.left) { b.x = w.left + b.r; if (b.vx < 0) b.vx = -b.vx * 0.4; }
        if (b.x + b.r > w.right) { b.x = w.right - b.r; if (b.vx > 0) b.vx = -b.vx * 0.4; }
        for (const k of w.boxes) {
          if (b.x + b.r > k.x0 && b.x - b.r < k.x1 && b.y + b.r > k.y0) {
            const top = b.y + b.r - k.y0, l = b.x + b.r - k.x0, r = k.x1 - (b.x - b.r);
            if (top < l && top < r) { b.y = k.y0 - b.r; if (b.vy > 0) b.vy = -b.vy * 0.3; b.vx += (b.x < (k.x0 + k.x1) / 2 ? -1 : 1) * 30; }
            else if (l < r) { b.x = k.x0 - b.r; if (b.vx > 0) b.vx = -b.vx * 0.4; } else { b.x = k.x1 + b.r; if (b.vx < 0) b.vx = -b.vx * 0.4; }
          }
        }
      }
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i], b = bs[j]; if (a.ghost || b.ghost) continue;
        const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = min - d;
        const ma = a.held ? 0 : 1, mb = b.held ? 0 : 1, m = ma + mb || 1;
        a.x -= nx * pen * (ma / m); a.y -= ny * pen * (ma / m); b.x += nx * pen * (mb / m); b.y += ny * pen * (mb / m);
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) { const jn = -(1.25) * rv / m; a.vx -= jn * nx * ma; a.vy -= jn * ny * ma; b.vx += jn * nx * mb; b.vy += jn * ny * mb; }
      }
      for (const b of bs) if (!b.held && !b.ghost) { const k = 1 - 0.6 * dt; b.vx *= k; b.vr *= 1 - 1.5 * dt; if (b.ground && Math.abs(b.vx) < 6) { b.vx = 0; b.vr *= 0.8; } }
    }
    w.step = (dt) => { const n = Math.max(1, Math.ceil(dt / (1 / 120))); for (let i = 0; i < n; i++) sub(dt / n); };
    return w;
  };
})();
