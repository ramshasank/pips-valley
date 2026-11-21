/* Sink or Float — a water tank experiment.
   Things wait on a shelf above a glass tank. Tap one and it drops in: a splash, ripples, and then it
   either bobs on the water or sinks to the sand with a trail of bubbles.

   Level 1: drop things in and watch; each result is named ("The ball floats!"). When all are in, sort them
            onto the floats shelf and the sinks shelf by tapping the float or the sink marker.
   Level 2: predict first (tap a marker), then test. Surprises are counted, and a short reason is spoken.
   Level 3: predict rounds with trickier things, and experiments with one thing changed:
            a ball of clay sinks but the same clay pressed into a boat floats; a raft and a deep boat are
            loaded with coins until they sink; an egg sinks in plain water and floats once salt is shaken in.
            The child writes each result on a small picture chart.
   Only clear-cut things are used, so the facts are right. */
(function () {
  'use strict';
  const A = K.art;
  const INK = '#2E2A3B', CREAM = '#FBF6EC', CLAY = '#C9785A';
  const ITEMS = [
    { name: 'ball', the: 'The ball', floats: true, sub: 0.22, why: 'air', easy: 1 },
    { name: 'apple', the: 'The apple', floats: true, sub: 0.76, why: 'air', easy: 1 },
    { name: 'banana', the: 'The banana', floats: true, sub: 0.74, why: 'light', easy: 1, hh: 34 },
    { name: 'leaf', the: 'The leaf', floats: true, sub: 0.3, why: 'light', easy: 1, hh: 12, flutter: 1, flat: 0.4 },
    { name: 'feather', the: 'The feather', floats: true, sub: 0.1, why: 'light', easy: 1, hh: 12, flutter: 1, flat: 0.6 },
    { name: 'boat', the: 'The toy boat', floats: true, sub: 0.34, why: 'wood', easy: 1, hh: 46 },
    { name: 'stone', the: 'The stone', floats: false, why: 'stone', easy: 1, hh: 36 },
    { name: 'key', the: 'The key', floats: false, why: 'metal', easy: 1, hh: 26 },
    { name: 'coin', the: 'The coin', floats: false, why: 'metal', easy: 1, hh: 38 },
    { name: 'sponge', the: 'The sponge', floats: true, sub: 0.4, why: 'air', hh: 30 },
    { name: 'lemon', the: 'The lemon', floats: true, sub: 0.8, why: 'air', hh: 34 },
    { name: 'orange', the: 'The orange', floats: true, sub: 0.8, why: 'air' },
    { name: 'stick', the: 'The stick', floats: true, sub: 0.5, why: 'wood', hh: 14, flat: 0.25 },
    { name: 'ice', the: 'The ice cube', floats: true, sub: 0.88, why: 'ice', hh: 38 },
    { name: 'grapes', the: 'The grapes', floats: false, why: 'heavy', many: 1 },
    { name: 'spoon', the: 'The spoon', floats: false, why: 'metal', hh: 30 },
  ];
  const WHY = {
    air: 'It has air inside.', light: 'It is light for its size.', heavy: 'It is heavy for its size.', stone: 'Stone is heavy for its size.',
    metal: 'Metal is heavy for its size.', wood: 'Wood is light for its size.', ice: 'Ice is lighter than water.',
  };
  const line = (d) => `${d.the} ${d.floats ? (d.many ? 'float' : 'floats') : (d.many ? 'sink' : 'sinks')}!`;
  const T = {
    tap: 'Tap one to drop it in the water.', sort: 'Now sort them! Did it float or sink?', look: 'Look again.',
    will: 'Will it float or sink?', drop: 'Now drop it in.', right: 'Your guess was right!', surprise: 'Surprise!',
    chart: 'Tap the chart to write it down.',
    dropBall: 'Drop the ball of clay in.', ballSinks: 'The ball of clay sinks!', press: 'Press the clay into a boat.', dropBoat: 'Now drop the boat in.', boatFloats: 'The clay boat floats!', air: 'The boat shape holds air inside.',
    loadRaft: 'Load coins onto the raft.', loadDeep: 'Load coins onto the deep boat.', heavy: 'Too heavy!', which: 'Which one held more coins?', sides: 'Tall sides keep the water out.',
    dropEgg: 'Drop the egg in.', eggSinks: 'The egg sinks!', salt: 'Now shake in some salt.', eggFloats: 'Now the egg floats!', heavier: 'Salt makes the water heavier.',
  };
  function lines() {
    const all = Object.values(T).concat(Object.values(WHY), ITEMS.map(line));
    const seen = {}, out = [];
    for (const t of all) for (const s of t.match(/[^.!?…]+[.!?…]*/g) || []) { const key = K.voiceKey(s); if (key && !seen[key]) { seen[key] = 1; out.push(s.trim()); } }
    return out;
  }

  /* ---------------- drawings (about 100 across around 0,0) ---------------- */
  const P = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);
  const box = (r) => ({ x: -r, y: -r, w: r * 2, h: r * 2 });
  const shine = (g, x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot == null ? -0.6 : rot, 0, 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); };
  function coinArt(g, s, r) {
    P(g, s, '#F2B33D', (h) => h.arc(0, 0, r, 0, 7), { box: box(r), light: 0.1 });
    g.beginPath(); g.arc(0, 0, r * 0.76, 0, 7); g.strokeStyle = '#D0902A'; g.lineWidth = r * 0.08; g.stroke();
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 - 1.571, q = i % 2 ? r * 0.22 : r * 0.5; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); g.fillStyle = '#F9DC8A'; g.fill();
    shine(g, -r * 0.4, -r * 0.42, r * 0.14, r * 0.3);
  }
  const D = {
    stone(g, s) {
      P(g, s, '#9C9BA8', (h) => A.blob(h, 0, 6, 50, 38, 0.09, 12, 10), { box: box(50), light: 0.09 });
      g.beginPath(); A.blob(g, -14, -6, 22, 12, 0.1, 3, 8); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill();
      for (const [x, y, r] of [[18, 10, 4], [-6, 22, 3], [28, -6, 3], [-30, 12, 3.5], [4, 2, 2.5]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = 'rgba(60,58,80,.28)'; g.fill(); }
      A.line(g, 'rgba(60,58,80,.3)', 3, (h) => { h.moveTo(10, -26); h.lineTo(18, -12); h.lineTo(12, -4); });
    },
    key(g, s) {
      g.save(); g.rotate(-0.5);
      P(g, s, '#E0A93A', (h) => { A.rect(h, -14, -7, 68, 14, 5, 2, 0.3); A.rect(h, 30, 4, 9, 18, 3, 3, 0.3); A.rect(h, 43, 4, 9, 13, 3, 4, 0.3); }, { light: 0.08 });
      P(g, s, '#E0A93A', (h) => { h.arc(-32, 0, 25, 0, Math.PI * 2); h.moveTo(-21, 0); h.arc(-32, 0, 11, 0, Math.PI * 2, true); }, { box: { x: -57, y: -25, w: 50, h: 50 }, light: 0.1 });
      A.line(g, 'rgba(255,255,255,.5)', 3, (h) => { h.arc(-32, 0, 19, 3.4, 4.6); });
      g.restore();
    },
    coin(g, s) { coinArt(g, s, 40); },
    spoon(g, s) {
      g.save(); g.rotate(0.7);
      P(g, s, '#C6CCD6', (h) => A.rect(h, -6, -14, 12, 74, 6, 2, 0.3), { light: 0.1 });
      P(g, s, '#C6CCD6', (h) => h.ellipse(0, -34, 23, 30, 0, 0, 7), { box: { x: -23, y: -64, w: 46, h: 60 }, light: 0.12 });
      g.beginPath(); g.ellipse(2, -32, 14, 20, 0, 0, 7); g.fillStyle = 'rgba(90,100,120,.16)'; g.fill(); shine(g, -9, -42, 4, 11, 0.2);
      g.restore();
    },
    leaf(g, s) {
      g.save(); g.rotate(-0.4);
      P(g, s, '#6FA65F', (h) => { h.moveTo(-54, 0); h.quadraticCurveTo(-6, -46, 54, 0); h.quadraticCurveTo(-6, 46, -54, 0); }, { box: box(54), light: 0.08 });
      A.line(g, '#4F8752', 3.5, (h) => { h.moveTo(-62, 2); h.lineTo(44, 0); for (const x of [-26, -4, 18]) { h.moveTo(x, 0); h.lineTo(x + 14, -15); h.moveTo(x, 0); h.lineTo(x + 14, 15); } });
      g.restore();
    },
    feather(g, s) {
      g.save(); g.rotate(-0.6);
      P(g, s, '#F4B49A', (h) => A.smooth(h, [[-46, 2], [-24, -20], [16, -24], [48, -12], [58, 0], [46, 12], [10, 22], [-26, 16]]), { box: box(56), light: 0.08 });
      A.line(g, '#FBF6EC', 3.5, (h) => { h.moveTo(-64, 6); h.quadraticCurveTo(0, -4, 54, 0); });
      A.line(g, 'rgba(200,110,80,.5)', 2.5, (h) => { for (const x of [-22, -4, 14, 32]) { h.moveTo(x, 1); h.lineTo(x + 12, -16); h.moveTo(x, 1); h.lineTo(x + 12, 15); } });
      g.restore();
    },
    boat(g, s) {
      A.line(g, '#8A5A3C', 6, (h) => { h.moveTo(0, 8); h.lineTo(0, -52); });
      P(g, s, '#E8664A', (h) => A.cut(h, [[5, -50], [44, 0], [5, 0]], 5, 0.6, 2), { shadow: 0.5 });
      P(g, s, CREAM, (h) => A.cut(h, [[-5, -40], [-5, 0], [-32, 0]], 5, 0.6, 3), { shadow: 0.5 });
      P(g, s, '#C08A5A', (h) => A.cut(h, [[-56, 8], [56, 8], [40, 42], [-40, 42]], [6, 6, 16, 16], 0.6, 4), { box: { x: -56, y: 8, w: 112, h: 34 }, light: 0.09 });
      A.line(g, '#8A5A3C', 3, (h) => { h.moveTo(-48, 20); h.lineTo(48, 20); });
    },
    stick(g, s) {
      g.save(); g.rotate(-0.25);
      A.line(g, '#8A5A3C', 7, (h) => { h.moveTo(10, -2); h.lineTo(30, -24); });
      P(g, s, '#6FA65F', (h) => { h.moveTo(30, -24); h.quadraticCurveTo(40, -42, 56, -34); h.quadraticCurveTo(48, -20, 30, -24); }, { shadow: 0.3 });
      P(g, s, '#A9744A', (h) => A.rect(h, -58, -9, 116, 18, 9, 3, 1.2), { light: 0.08 });
      A.line(g, 'rgba(90,50,30,.4)', 2.5, (h) => { for (const x of [-36, -8, 24]) { h.moveTo(x, -3); h.lineTo(x + 12, -1); } });
      g.beginPath(); g.ellipse(-55, 0, 4, 7, 0, 0, 7); g.fillStyle = '#E3C39A'; g.fill();
      g.restore();
    },
    ice(g, s) {
      g.save(); g.rotate(0.14);
      P(g, s, '#CBE7F3', (h) => A.rect(h, -38, -38, 76, 76, 14, 3, 1), { box: box(40), light: 0.1, grain: 0.1 });
      g.beginPath(); A.rect(g, -28, -28, 56, 56, 9, 4, 0.6); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4; g.stroke();
      shine(g, -16, -14, 6, 14); for (const [x, y, r] of [[12, 14, 4], [20, 2, 2.5], [4, 22, 2.5]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill(); }
      g.restore();
    },
    egg(g, s) {
      P(g, s, '#F6E7CE', (h) => { h.moveTo(0, -48); h.bezierCurveTo(30, -48, 40, 0, 38, 14); h.bezierCurveTo(36, 40, 16, 48, 0, 48); h.bezierCurveTo(-16, 48, -36, 40, -38, 14); h.bezierCurveTo(-40, 0, -30, -48, 0, -48); }, { box: box(48), light: 0.08 });
      shine(g, -14, -18, 7, 14);
    },
  };
  let EGG = null; { const im = new Image(); im.onload = () => { EGG = im; }; im.src = 'img/words/egg.webp'; }
  function itemSprite(name) {
    const Kt = A.kitchen;
    if (!D[name] && Kt && Kt.draw[name]) return Kt.sprite(name);
    const sp = A.sprite('fl-' + name, [-66, -66, 132, 132], D[name]);
    return name === 'egg' && EGG ? A.fitPic('fl-egg', sp, EGG, { mid: 1 }) : sp;
  }
  /* Clay shapes, drawn live so the ball can be pressed into a boat. Centre at (0,0). */
  function clayArt(g, s, stage) {
    if (stage === 0) { P(g, s, CLAY, (h) => A.blob(h, 0, 0, 42, 41, 0.04, 5, 11), { box: box(42), light: 0.1 }); shine(g, -16, -16, 7, 13); }
    else if (stage === 1) { P(g, s, CLAY, (h) => A.blob(h, 0, 8, 58, 30, 0.04, 6, 11), { box: { x: -58, y: -22, w: 116, h: 60 }, light: 0.1 }); shine(g, -24, -4, 12, 5, 0); }
    else hullArt(g, s, stage === 2 ? 132 : 150, stage === 2 ? 34 : 58);
  }
  /** A bowl-shaped boat seen from the side, w wide and h tall, centred. */
  function hullArt(g, s, w, h, coins) {
    const a = w / 2, t = -h / 2, b = h / 2;
    P(g, s, CLAY, (p) => { p.moveTo(-a, t); p.bezierCurveTo(-a + 4, b * 0.7, -a * 0.6, b, -a * 0.36, b); p.lineTo(a * 0.36, b); p.bezierCurveTo(a * 0.6, b, a - 4, b * 0.7, a, t); p.closePath(); }, { box: { x: -a, y: t, w, h }, light: 0.1 });
    g.beginPath(); g.ellipse(0, t, a - 2, 8, 0, 0, 7); g.fillStyle = '#9A5440'; g.fill();
    g.beginPath(); g.ellipse(0, t, a - 2, 8, 0, 0, 7); g.strokeStyle = '#DE9478'; g.lineWidth = 3; g.stroke();
    if (coins) pile(g, coins, t - 2, a - 26);
    A.line(g, 'rgba(255,255,255,.3)', 4, (p) => { p.moveTo(-a + 14, t + 12); p.quadraticCurveTo(-a + 16, b * 0.5, -a * 0.5, b - 8); });
  }
  function raftArt(g, s, w, coins) {
    P(g, s, CLAY, (p) => A.rect(p, -w / 2, -9, w, 20, 9, 3, 0.8), { box: { x: -w / 2, y: -9, w, h: 20 }, light: 0.1 });
    g.beginPath(); g.ellipse(0, -8, w / 2 - 6, 5, 0, 0, 7); g.fillStyle = '#DE9478'; g.fill();
    if (coins) pile(g, coins, -9, w / 2 - 26);
  }
  /** Coins seen edge-on, piled from y upward across +-half. */
  function pile(g, n, y, half) {
    const per = Math.max(2, Math.floor((half * 2) / 30) + 1);
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / per), col = i % per, cnt = Math.min(per, n - row * per), x = (col - (cnt - 1) / 2) * 30 + (row % 2) * 6, yy = y - row * 11;
      g.beginPath(); g.ellipse(x, yy - 5, 15, 6.5, 0, 0, 7); g.fillStyle = '#C98A2B'; g.fill();
      g.beginPath(); g.ellipse(x, yy - 8, 15, 6.5, 0, 0, 7); g.fillStyle = '#F2B33D'; g.fill();
      g.beginPath(); g.ellipse(x - 3, yy - 9, 7, 2.5, 0, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
    }
  }
  const SPECIAL = {
    clay: { name: 'clay', floats: false, hh: 40, draw: (g, s, th) => clayArt(g, s, th.stage) },
    raft: { name: 'raft', floats: true, sub: 0.5, hh: 10, draw: (g, s, th) => raftArt(g, s, 160, th.load) },
    deep: { name: 'deep boat', floats: true, sub: 0.3, hh: 34, draw: (g, s, th) => hullArt(g, s, 160, 68, th.load) },
    egg: { name: 'egg', floats: false, sub: 0.84, hh: 44 },
    coin: { name: 'coin', floats: false, hh: 20, scale: 0.5 },
  };
  /** The round float / sink sign: a ball on the water, or under it. */
  function sign(g, kind, r) {
    g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip();
    g.fillStyle = '#EEF6F4'; g.fillRect(-r, -r, r * 2, r * 2);
    const wy = kind === 'float' ? r * 0.12 : -r * 0.3;
    g.beginPath(); g.moveTo(-r, wy); for (let x = -r; x <= r + 4; x += r / 6) g.lineTo(x, wy + Math.sin((x / r) * 7) * r * 0.06); g.lineTo(r, r); g.lineTo(-r, r); g.closePath(); g.fillStyle = '#86BCD0'; g.fill();
    const by = kind === 'float' ? wy - r * 0.16 : r * 0.44, br = r * 0.3;
    g.beginPath(); g.arc(0, by, br, 0, 7); g.fillStyle = '#E8664A'; g.fill();
    g.beginPath(); g.arc(-br * 0.3, by - br * 0.3, br * 0.28, 0, 7); g.fillStyle = 'rgba(255,255,255,.45)'; g.fill();
    if (kind === 'float') { g.beginPath(); g.moveTo(-r, wy); for (let x = -r; x <= r + 4; x += r / 6) g.lineTo(x, wy + Math.sin((x / r) * 7) * r * 0.06); g.lineTo(r, r); g.lineTo(-r, r); g.closePath(); g.fillStyle = 'rgba(134,188,208,.6)'; g.fill(); }
    else for (const [x, y, q] of [[-0.12, 0.02, 0.06], [0.1, -0.12, 0.045], [-0.02, -0.2, 0.035]]) { g.beginPath(); g.arc(x * r, y * r, q * r, 0, 7); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(1.5, r * 0.035); g.stroke(); }
    g.beginPath(); g.moveTo(-r, wy); for (let x = -r; x <= r + 4; x += r / 6) g.lineTo(x, wy + Math.sin((x / r) * 7) * r * 0.06); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(2, r * 0.05); g.stroke();
    g.restore();
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.strokeStyle = 'rgba(46,42,59,.14)'; g.lineWidth = Math.max(1.5, r * 0.04); g.stroke();
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, cx = W / 2;
    const IS = land ? 1 : 0.86, shelfY = 338;
    const T0 = land ? { x0: cx - 320, x1: cx + 320, top: 428, bottom: 872, surf: 514 } : { x0: 30, x1: W - 30, top: 428, bottom: 806, surf: 506 };
    const floorY = T0.bottom - 30, side = land ? 470 : 132;
    const MK = { r: land ? 76 : 70, y: land ? 548 : 918 }, plankY = land ? 806 : 1152;
    let S = null, skill = 0, seq = 0, expNo = K.randInt(0, 2), quietUntil = 0, lastNames = [], surprises = 0, tallyPop = 0;
    const waits = {};
    const ev = (name) => new Promise((res) => { waits[name] = res; });
    const fire = (name, v) => { const f = waits[name]; if (!f) return false; delete waits[name]; f(v); return true; };
    const speak = (t, quiet) => { quietUntil = st.t + (quiet || 2.2); return ctx.say(t); };
    const sayWait = (t, ms) => Promise.all([speak(t, ms / 1000), ctx.wait(ms)]);
    const water = { ripples: [], drops: [], bubbles: [], grains: [], salt: 0, haze: 0 };

    /* ---------- the room ---------- */
    const key = Math.round(W) + 'x' + Math.round(H);
    st.add({ z: 0, sprite: A.sprite('flroom' + key, [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#DDEBE6', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.03, grain: 0.3 });
      // tiles behind the tank
      const ty = T0.bottom - 300;
      g.beginPath(); g.rect(0, ty, W, 300); A.paper(g, s, '#F3EBDD', { shadow: 0, grain: 0.2, light: 0 });
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath();
      for (let y = ty; y <= T0.bottom; y += 75) { g.moveTo(0, y); g.lineTo(W, y); }
      for (let row = 0; row < 4; row++) for (let x = (row % 2) * 60 - 20; x < W; x += 120) { g.moveTo(x, ty + row * 75); g.lineTo(x, ty + (row + 1) * 75); }
      g.stroke();
      P(g, s, '#86BCD0', (h) => A.rect(h, -10, ty - 14, W + 20, 16, 3, 3, 0.5), { shadow: 0.5 });
      const rnd = A.rng(5);
      for (let i = 0; i < 12; i++) { const x = rnd() * W, y = 150 + rnd() * (ty - 220), r = 8 + rnd() * 18; g.beginPath(); g.arc(x, y, r, 0, 7); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.2, 0, 7); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill(); }
      // the waiting shelf
      const sw = Math.min(W - 40, 760), sx = cx - sw / 2;
      for (const x of [sx + 50, sx + sw - 50]) P(g, s, '#A9744A', (h) => A.cut(h, [[x - 9, shelfY + 10], [x + 9, shelfY + 10], [x + 7, shelfY + 50], [x - 7, shelfY + 44]], 4, 0.5, 2), { shadow: 0.5 });
      P(g, s, '#C99666', (h) => A.rect(h, sx, shelfY - 2, sw, 20, 6, 4, 0.6), { shadow: 1, box: { x: sx, y: shelfY, w: sw, h: 20 }, light: 0.07 });
      // the table
      P(g, s, '#B98558', (h) => h.rect(-20, T0.bottom + 34, W + 40, H - T0.bottom), { shadow: 0, box: { x: 0, y: T0.bottom, w: 0, h: H - T0.bottom }, light: 0.06 });
      P(g, s, '#DDB083', (h) => A.rect(h, -20, T0.bottom, W + 40, 44, 4, 2, 0.6), { shadow: 0.8, box: { x: 0, y: T0.bottom, w: 0, h: 44 }, light: 0.07 });
      A.line(g, 'rgba(255,255,255,.3)', 3, (h) => { h.moveTo(0, T0.bottom + 5); h.lineTo(W, T0.bottom + 5); });
    }) });

    /* ---------- the tank ---------- */
    const tw = T0.x1 - T0.x0, th0 = T0.bottom - T0.top;
    st.add({ z: 10, sprite: A.sprite('fltankB' + key, [T0.x0 - 30, T0.top - 30, tw + 60, th0 + 60], (g, s) => {
      P(g, s, '#EAF5F4', (h) => A.rect(h, T0.x0, T0.top, tw, th0, 10, 3, 0.4), { shadow: 1, depth: 1.3, light: 0.02, grain: 0.08, box: { x: T0.x0, y: T0.top, w: tw, h: th0 } });
      g.save(); g.beginPath(); g.rect(T0.x0 + 6, T0.top, tw - 12, th0 - 4); g.clip();
      // a water plant, sand and pebbles
      const px = T0.x1 - 96;
      [[-26, 150, '#5E9E57'], [0, 200, '#6FA65F'], [24, 130, '#4F8752']].forEach(([dx, hgt, c], i) => { g.beginPath(); g.moveTo(px + dx - 9, floorY + 8); g.quadraticCurveTo(px + dx - 30 + i * 22, floorY - hgt * 0.5, px + dx + (i - 1) * 16, floorY - hgt); g.quadraticCurveTo(px + dx + 20 + i * 8, floorY - hgt * 0.5, px + dx + 9, floorY + 8); g.fillStyle = c; g.fill(); });
      g.beginPath(); g.moveTo(T0.x0, floorY + 4); for (let x = T0.x0; x <= T0.x1; x += 40) g.quadraticCurveTo(x + 20, floorY - 8 + Math.sin(x * 0.05) * 5, x + 40, floorY + 2); g.lineTo(T0.x1, T0.bottom); g.lineTo(T0.x0, T0.bottom); g.closePath(); A.paper(g, s, '#EBD6A4', { shadow: 0, grain: 0.4, light: 0 });
      const r = A.rng(8); for (let i = 0; i < 9; i++) { const x = T0.x0 + 30 + r() * (tw - 60), q = 5 + r() * 8; g.beginPath(); g.ellipse(x, floorY + 12 + r() * 6, q * 1.3, q, 0, 0, 7); g.fillStyle = ['#C9B58A', '#B4B2BC', '#D9C49A'][i % 3]; g.fill(); }
      g.restore();
    }) });
    st.add({ z: 32, sprite: A.sprite('fltankF' + key, [T0.x0 - 30, T0.top - 30, tw + 60, th0 + 70], (g, s) => {
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 7; g.beginPath(); A.rect(g, T0.x0, T0.top, tw, th0, 10, 3, 0.4); g.stroke();
      g.strokeStyle = 'rgba(70,110,120,.35)'; g.lineWidth = 2; g.beginPath(); A.rect(g, T0.x0, T0.top, tw, th0, 10, 3, 0.4); g.stroke();
      A.line(g, 'rgba(255,255,255,.6)', 10, (h) => { h.moveTo(T0.x0 + 26, T0.top + 30); h.lineTo(T0.x0 + 26, T0.top + 190); });
      A.line(g, 'rgba(255,255,255,.4)', 6, (h) => { h.moveTo(T0.x0 + 46, T0.top + 40); h.lineTo(T0.x0 + 46, T0.top + 120); });
      P(g, s, '#2F8F8A', (h) => A.rect(h, T0.x0 - 14, T0.bottom - 6, tw + 28, 22, 8, 4, 0.5), { shadow: 0.9, light: 0.07, box: { x: T0.x0, y: T0.bottom - 6, w: tw, h: 22 } });
    }) });
    const surfAt = (x) => {
      let y = T0.surf + Math.sin(x * 0.021 + st.t * 1.5) * 2.4;
      for (const r of water.ripples) { const d = Math.abs(x - r.x); if (d < r.t * 430 + 30) y += r.a * Math.exp(-r.t * 1.7) * Math.exp(-d / 240) * Math.sin(d * 0.048 - r.t * 9); }
      return y;
    };
    function splash(x, power, quiet) {
      water.ripples.push({ x, t: 0, a: 20 * power }); if (water.ripples.length > 6) water.ripples.shift();
      const n = Math.round(10 * power) + 2;
      for (let i = 0; i < n; i++) water.drops.push({ x: x + (Math.random() - 0.5) * 60, y: T0.surf - 4, vx: (Math.random() - 0.5) * 520 * power, vy: -(260 + Math.random() * 520) * Math.sqrt(power), r: 3 + Math.random() * 6 });
      if (quiet) return;
      K.sfx.noise(0.3 * Math.max(0.4, power), { freq: 1300, vol: 0.22 * Math.min(1, power + 0.2) }); K.sfx.tone(480, 0.22, { to: 170, type: 'sine', vol: 0.16 * Math.min(1, power + 0.2) });
    }
    const bubbleAt = (x, y, r) => water.bubbles.push({ x, y, r: r || 3 + Math.random() * 5, v: 90 + Math.random() * 80, p: Math.random() * 6 });
    // the water is drawn twice: most of its colour behind the things, a thin veil in front of them
    st.add({ z: 12, draw(g) {
      g.save(); g.beginPath(); g.rect(T0.x0 + 5, T0.top, tw - 10, th0 - 5); g.clip();
      g.beginPath(); g.moveTo(T0.x0, surfAt(T0.x0)); for (let x = T0.x0; x <= T0.x1 + 14; x += 14) g.lineTo(x, surfAt(x)); g.lineTo(T0.x1, T0.bottom); g.lineTo(T0.x0, T0.bottom); g.closePath();
      const gr = g.createLinearGradient(0, T0.surf, 0, T0.bottom); gr.addColorStop(0, 'rgba(120,196,222,.34)'); gr.addColorStop(1, 'rgba(58,138,190,.42)'); g.fillStyle = gr; g.fill();
      g.restore();
    } });
    const wat = st.add({ z: 30 });
    wat.update = (dt) => {
      for (const r of water.ripples) r.t += dt;
      while (water.ripples.length && water.ripples[0].t > 3.5) water.ripples.shift();
      for (const d of water.drops) { d.vy += 1900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
      for (let i = water.drops.length - 1; i >= 0; i--) if (water.drops[i].y > T0.surf + 6 && water.drops[i].vy > 0) water.drops.splice(i, 1);
      for (const b of water.bubbles) { b.y -= b.v * dt; b.x += Math.sin(st.t * 6 + b.p) * 16 * dt; }
      for (let i = water.bubbles.length - 1; i >= 0; i--) if (water.bubbles[i].y < T0.surf + 6) water.bubbles.splice(i, 1);
      for (const q of water.grains) { q.vy += (q.y > T0.surf ? -q.vy * 4 + 60 : 1500) * dt; q.y += q.vy * dt; q.x += q.vx * dt; if (q.y > T0.surf) q.life -= dt * 0.9; }
      for (let i = water.grains.length - 1; i >= 0; i--) if (water.grains[i].life <= 0) water.grains.splice(i, 1);
      water.haze += (water.salt - water.haze) * Math.min(1, dt * 1.5);
    };
    wat.draw = (g) => {
      const top = (h) => { h.moveTo(T0.x0, surfAt(T0.x0)); for (let x = T0.x0; x <= T0.x1 + 14; x += 14) h.lineTo(x, surfAt(x)); };
      g.save(); g.beginPath(); g.rect(T0.x0 + 5, T0.top, tw - 10, th0 - 5); g.clip();
      g.beginPath(); top(g); g.lineTo(T0.x1, T0.bottom); g.lineTo(T0.x0, T0.bottom); g.closePath();
      const gr = g.createLinearGradient(0, T0.surf, 0, T0.bottom); gr.addColorStop(0, 'rgba(120,196,222,.16)'); gr.addColorStop(1, 'rgba(58,138,190,.26)'); g.fillStyle = gr; g.fill();
      if (water.haze > 0.02) { g.fillStyle = `rgba(255,255,255,${Math.min(0.3, water.haze * 0.06)})`; g.fill(); }
      for (const q of water.grains) { g.globalAlpha = Math.min(1, q.life * 2); g.fillStyle = '#FFFFFF'; g.fillRect(q.x - 2.5, q.y - 2.5, 5, 5); } g.globalAlpha = 1;
      for (const b of water.bubbles) { g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.8; g.stroke(); }
      g.beginPath(); top(g); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
      g.restore();
      for (const d of water.drops) { g.beginPath(); g.arc(d.x, d.y, d.r, 0, 7); g.fillStyle = 'rgba(150,208,232,.95)'; g.fill(); g.beginPath(); g.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.3, 0, 7); g.fillStyle = 'rgba(255,255,255,.8)'; g.fill(); }
    };

    /* ---------- things ---------- */
    const things = [];
    function makeThing(def, x, y, delay) {
      const sc = (def.scale || 1) * IS;
      const th = { def, floats: def.floats, sub: def.sub || 0.5, hh: (def.hh || 44) * sc, sc, ph: 'shelf', vy: 0, vr: 0, seed: Math.random() * 6, pulse: false, guess: null, misses: 0, wet: 0, told: false, tx: cx, stage: 0, load: 0, restRot: (Math.random() - 0.5) * 0.5 };
      const n = st.add({ z: 40, x, y, sx: 0.05, sy: 0.05, hit: { x: -60, y: -60, w: 120, h: 120 }, pad: 6, label: def.name, pressable: false });
      n._bsx = n._bsy = sc; n.to({ sx: sc, sy: sc }, { dur: 0.36, ease: 'back', delay: delay || 0 });
      n.draw = (g, s) => {
        const k = th.pulse ? 1 + Math.sin(st.t * 7) * 0.07 : 1;
        if (th.pulse) { g.beginPath(); g.arc(0, 0, 70 + Math.sin(st.t * 7) * 5, 0, 7); g.fillStyle = 'rgba(247,205,90,.5)'; g.fill(); }
        g.save(); g.scale(k, k);
        if (def.draw) def.draw(g, s, th); else { const sp = itemSprite(def.name); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); }
        g.restore();
        if (th.guess != null && th.ph !== 'sorted' && th.ph !== 'fly') { g.save(); g.translate(48, -48); g.rotate(-n.rot); g.beginPath(); g.arc(0, 0, 31, 0, 7); g.fillStyle = CREAM; g.fill(); sign(g, th.guess ? 'float' : 'sink', 26); g.restore(); }
      };
      n.update = (dt) => tick(th, dt);
      n.onTap = () => tapThing(th);
      th.n = n; things.push(th); return th;
    }
    function removeThing(th) { const i = things.indexOf(th); if (i >= 0) things.splice(i, 1); th.ph = 'gone'; th.n.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' }).then(() => th.n.remove()); }
    function tick(th, dt) {
      const n = th.n, d = th.def;
      if (th.ph === 'air') {
        th.vy += 2400 * dt;
        if (d.flutter) { th.vy = Math.min(th.vy, 240); n.x = th.tx + Math.sin((st.t - th.t0) * 4.2) * 44; n.rot = Math.sin((st.t - th.t0) * 4.2 + 1.2) * 0.5; } else n.rot += th.vr * dt;
        n.y += th.vy * dt;
        if (n.y + th.hh * 0.5 > surfAt(n.x)) {
          th.ph = 'water'; th.wet = 0; splash(n.x, d.flutter ? 0.22 : th.soft ? 0.5 : 1); th.vy *= d.flutter ? 0.4 : 0.45;
          if (!d.flutter) for (let i = 0; i < 6; i++) bubbleAt(n.x + (Math.random() - 0.5) * 60, n.y + 30 + Math.random() * 40);
        }
      } else if (th.ph === 'water') {
        th.wet += dt;
        if (th.floats) {
          const ty = T0.surf + (2 * th.sub - 1) * th.hh + Math.sin(st.t * 2.1 + th.seed) * 3;
          th.vy += (-72 * (n.y - ty) - 5.5 * th.vy) * dt; n.y += th.vy * dt;
          n.rot += (Math.sin(st.t * 1.7 + th.seed) * 0.07 + (d.flat || 0) - n.rot) * Math.min(1, dt * 4);
          if (!th.told && th.wet > 1.1) result(th);
        } else {
          th.vy += (230 - th.vy) * Math.min(1, dt * 3.5); n.y += th.vy * dt;
          n.x += Math.sin(st.t * 5 + th.seed) * 24 * dt; n.rot += Math.sin(st.t * 3 + th.seed) * 0.9 * dt;
          if (Math.random() < dt * 9) bubbleAt(n.x + (Math.random() - 0.5) * 40, n.y - th.hh * 0.5);
          const rest = floorY - th.hh * 0.86;
          if (n.y >= rest) { n.y = rest; th.ph = 'rest'; K.sfx.tone(150, 0.16, { to: 90, vol: 0.2 }); for (let i = 0; i < 5; i++) bubbleAt(n.x + (Math.random() - 0.5) * 70, n.y); result(th); }
        }
        n.x += (K.clamp(th.tx, T0.x0 + 60, T0.x1 - 60) - n.x) * Math.min(1, dt * 1.3);
      } else if (th.ph === 'rest') n.rot += (th.restRot - n.rot) * Math.min(1, dt * 5);
    }
    function drop(th, tx, soft) {
      th.ph = 'hop'; th.pulse = false; th.told = false; th.tx = tx == null ? cx : tx; th.soft = soft; K.sfx.whoosh();
      th.n.z = 25; st.root._sorted = false;
      th.n.to({ x: th.tx, y: T0.top - (soft ? 20 : 70) - th.hh, rot: 0, sx: th.sc, sy: th.sc }, { dur: 0.3, ease: 'out' }).then(() => { th.ph = 'air'; th.vy = 0; th.t0 = st.t; th.vr = (Math.random() - 0.5) * 3; });
    }
    const slotX = (i) => T0.x0 + tw * ([0.5, 0.26, 0.74, 0.12, 0.88][i % 5]);
    function toShelf(th) {
      const k = th.floats ? 'fl' : 'sk', j = S[k]++, sgn = th.floats ? -1 : 1;
      th.ph = 'fly'; th.pulse = false; th.n.z = 17; st.root._sorted = false; K.sfx.whoosh();
      const q = 0.5 * th.sc / (th.def.scale || 1);
      return th.n.to({ x: cx + sgn * side + ((j % 4) - 1.5) * 58, y: plankY - 26 - Math.floor(j / 4) * 60, sx: q, sy: q, rot: 0 }, { dur: 0.55, ease: 'inOut' }).then(() => { th.ph = 'sorted'; K.sfx.pop(); });
    }

    /* ---------- float and sink markers, their shelves, the surprise tally ---------- */
    const marks = {};
    ['float', 'sink'].forEach((kind) => {
      const sgn = kind === 'float' ? -1 : 1;
      const m = st.add({ z: 16, x: cx + sgn * side, y: MK.y, hitR: MK.r + 6, label: kind, visible: false, hot: false, glow: false, wig: -9 });
      m._bsx = m._bsy = 1;
      const disc = A.sprite('flmark' + kind + MK.r, [-MK.r - 6, -MK.r - 6, MK.r * 2 + 12, MK.r * 2 + 12], (g, s) => { g.beginPath(); g.arc(0, 0, MK.r, 0, 7); A.paper(g, s, CREAM, { shadow: 1, light: 0.04, box: box(MK.r) }); sign(g, kind, MK.r - 12); });
      m.draw = (g) => {
        const k = m.hot ? 1 + Math.sin(st.t * 5 + sgn) * 0.045 : 1, w = st.t - m.wig < 0.5 ? Math.sin((st.t - m.wig) * 32) * 0.1 : 0;
        g.save(); g.rotate(w); g.scale(k, k);
        if (m.glow) { g.beginPath(); g.arc(0, 0, MK.r + 12 + Math.sin(st.t * 7) * 4, 0, 7); g.fillStyle = 'rgba(247,200,80,.85)'; g.fill(); }
        g.drawImage(disc.canvas, -disc.ox, -disc.oy, disc.w, disc.h);
        g.restore();
        g.font = `700 ${land ? 34 : 30}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(kind + 's', 0, MK.r + 30);
      };
      m.onTap = () => tapMark(kind === 'float');
      marks[kind] = m;
    });
    const planks = st.add({ z: 9, visible: false });
    planks.draw = (g, s) => { for (const sgn of [-1, 1]) { g.beginPath(); A.rect(g, cx + sgn * side - 124, plankY, 248, 16, 6, 4 + sgn, 0.6); A.paper(g, s, land ? '#C99666' : '#EBCDA4', { shadow: 0.8 }); } };
    const tally = st.add({ z: 16, x: land ? cx + side : cx, y: land ? 300 : MK.y, visible: false });
    tally.draw = (g, s) => {
      const k = 1 + tallyPop * 0.25, r = land ? 50 : 40; g.save(); g.scale(k, k);
      g.beginPath(); for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.283 + st.t * 0.3, q = i % 2 ? r * 0.76 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); A.paper(g, s, '#F2B33D', { shadow: 0.8, light: 0.08, box: box(r) });
      g.font = `800 ${r * 0.95}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(String(surprises), 0, 3);
      g.restore();
      g.font = `700 ${land ? 26 : 22}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.fillStyle = INK; g.fillText('surprises', 0, r + 22);
    };
    tally.update = (dt) => { tallyPop = Math.max(0, tallyPop - dt * 2.5); };
    const showMarks = (on) => { for (const k in marks) { const m = marks[k]; if (on && !m.visible) { m.sx = m.sy = 0.2; m.to({ sx: 1, sy: 1 }, { dur: 0.35, ease: 'back' }); } m.visible = on; if (!on) { m.hot = m.glow = false; } } };

    /* ---------- drop-and-sort (level 1) and predict-then-test (levels 2, 3) ---------- */
    function pickItems(size) {
      const hard = L === 3 || skill >= 2, pool = ITEMS.filter((d) => (hard || d.easy) && !lastNames.includes(d.name));
      const sink = K.shuffle(pool.filter((d) => !d.floats)), fl = K.shuffle(pool.filter((d) => d.floats));
      if (L === 3) fl.sort((a, b) => (a.easy || 0) - (b.easy || 0));          // the trickier floaters first
      const ns = K.clamp(Math.round(size * (0.3 + Math.random() * 0.25)), 1, Math.min(size - 1, sink.length));
      let out = sink.slice(0, ns).concat(fl.slice(0, size - ns));
      if (out.length < size) out = out.concat(K.shuffle(ITEMS.filter((d) => (hard || d.easy) && d.floats && !out.includes(d))).slice(0, size - out.length));
      out = K.shuffle(out);
      lastNames = out.map((d) => d.name); return out;
    }
    function clearAll() { for (const th of things.slice()) removeThing(th); }
    function newSet() {
      clearAll();
      const kind = L === 1 ? 'drop' : 'predict';
      const size = L === 1 ? (skill < 1 ? 3 : skill < 3 ? 4 : 5) : L === 2 ? (skill < 2 ? 4 : 5) : 3;
      const defs = pickItems(size), sp = Math.min(land ? 142 : 124, (W - 50) / size);
      S = { kind, phase: kind === 'drop' ? 'test' : 'pick', cur: null, tested: 0, sorted: 0, fl: 0, sk: 0, nf: 0, ns: 0, set: [], surprises: 0, misses: 0 };
      defs.forEach((d, i) => S.set.push(makeThing(d, cx + (i - (size - 1) / 2) * sp, shelfY - 6 - (d.hh || 44) * IS - (d.flat ? 14 : 0), 0.1 + i * 0.09)));
      planks.visible = true; chart.visible = false; rowN.forEach((r) => { r.visible = false; }); counter.visible = false;
      showMarks(kind === 'predict'); tally.visible = kind === 'predict';
      if (kind === 'predict') { marks.float.hot = marks.sink.hot = false; for (const th of S.set) th.pulse = false; }
      K.sfx.whoosh();
      ctx.prompt(kind === 'drop' ? T.tap : T.will);
    }
    function tapThing(th) {
      const s = S; if (!s || th.ph === 'gone') return;
      if (s.kind === 'exp') { if (!fire('thing', th)) { K.sfx.tap(); th.n.press(); } return; }
      if (s.kind === 'drop') {
        if (s.phase === 'test' && th.ph === 'shelf') drop(th, slotX(th.floats ? s.nf++ : s.ns++));
        else if (s.phase === 'sort' && (th.ph === 'water' || th.ph === 'rest')) { K.sfx.tap(); select(th); }
        return;
      }
      if (th.ph !== 'shelf') return;
      if (s.phase === 'pick') {
        s.cur = th; s.phase = 'guess'; th.pulse = true; K.sfx.pop(); th.n.to({ y: th.n.y - 26 }, { dur: 0.25, ease: 'back' });
        marks.float.hot = marks.sink.hot = true;
        if (st.t > quietUntil) ctx.prompt(T.will);
      } else if (th !== s.cur) { K.sfx.tap(); th.n.press(); }
      else if (s.phase === 'guess') { K.sfx.tap(); marks.float.wig = marks.sink.wig = st.t; if (st.t > quietUntil) speak(T.will); }
      else if (s.phase === 'drop') { s.phase = 'wait'; marks.float.hot = marks.sink.hot = false; drop(th); }
    }
    function select(th) { for (const o of S.set) o.pulse = false; S.cur = th; if (th) th.pulse = true; }
    function tapMark(isFloat) {
      const s = S, m = marks[isFloat ? 'float' : 'sink']; if (!s) return;
      if (s.kind === 'predict') {
        if (s.phase !== 'guess' && s.phase !== 'drop') { K.sfx.tap(); return; }
        s.cur.guess = isFloat; K.sfx.pop();
        if (s.phase === 'guess') { s.phase = 'drop'; ctx.prompt(T.drop); }
        return;
      }
      if (s.kind !== 'drop' || s.phase !== 'sort' || !s.cur) { K.sfx.tap(); return; }
      const th = s.cur;
      if (th.floats === isFloat) {
        marks.float.glow = marks.sink.glow = false; K.sfx.ding(); ctx.fx.burst(m.x, m.y, { n: 8 });
        speak(line(th.def)); s.sorted++; s.cur = null;
        toShelf(th).then(() => {
          if (S !== s) return;
          const left = s.set.filter((o) => o.ph === 'water' || o.ph === 'rest');
          if (left.length) select(left[0]); else finishSet();
        });
      } else {
        K.sfx.whoops(); m.wig = st.t; th.misses++; s.misses++;
        if (th.floats) { th.vy = 300; splash(th.n.x, 0.4, true); } else th.n.to({ y: th.n.y - 50 }, { dur: 0.2, ease: 'out' }).then(() => th.n.to({ y: floorY - th.hh * 0.86 }, { dur: 0.5, ease: 'inOut' }));
        speak(T.look + ' ' + line(th.def), 3);
        if (th.misses >= 2) marks[th.floats ? 'float' : 'sink'].glow = true;
      }
    }
    function startSort() {
      const s = S; if (!s || s.phase !== 'test') return;
      s.phase = 'sort'; showMarks(true); marks.float.hot = marks.sink.hot = true;
      select(s.set[0]); ctx.prompt(T.sort);
    }
    async function result(th) {
      if (th.told) return; th.told = true;
      const s = S;
      if (s.kind === 'exp') { fire('result', th); return; }
      if (s.kind === 'drop') {
        speak(line(th.def)); s.tested++;
        if (s.tested === s.set.length) ctx.after(2000, startSort);
        return;
      }
      const right = th.guess === th.floats;
      if (right) { K.sfx.ding(); ctx.after(200, () => K.sfx.sparkle()); ctx.fx.burst(th.n.x, th.n.y - 40, { n: 14 }); }
      else { s.surprises++; surprises++; tallyPop = 1; K.sfx.pop(); if (tally.visible) ctx.fx.burst(tally.x, tally.y, { n: 8, color: '#F2B33D' }); }
      ctx.prompt(line(th.def), { silent: true });
      await sayWait((right ? T.right : T.surprise) + ' ' + line(th.def) + ' ' + WHY[th.def.why], 4200);
      if (S !== s) return;
      await toShelf(th);
      s.tested++; s.cur = null;
      if (s.tested >= s.set.length) finishSet();
      else { s.phase = 'pick'; ctx.prompt(T.will, { silent: true }); }
    }
    async function finishSet() {
      const s = S;
      if (s.kind === 'drop' ? s.misses <= 1 : s.surprises <= 1) skill++; else if ((s.kind === 'drop' ? s.misses : s.surprises) >= 3) skill = Math.max(0, skill - 1);
      if (s.kind === 'drop') showMarks(false); else marks.float.hot = marks.sink.hot = false;
      await ctx.wait(900);
      await ctx.celebrate({ ms: 3400 });
      if (S === s) nextUp();
    }
    function nextUp() { seq++; if (L === 3 && seq % 2 === 1) startExp(); else newSet(); }

    /* ---------- experiments (level 3) ---------- */
    const CH = land ? { x: T0.x1 + 28, y: 452, w: Math.min(292, W - T0.x1 - 44), rh: 124 } : { x: 26, y: 852, w: 318, rh: 124 };
    const chart = st.add({ z: 14, x: CH.x, y: CH.y, visible: false, sprite: A.sprite('flchart' + key, [0, 0, CH.w, CH.rh * 2 + 44], (g, s) => {
      P(g, s, CREAM, (h) => A.rect(h, 0, 0, CH.w, CH.rh * 2 + 44, 18, 6, 1), { depth: 1.2, box: { x: 0, y: 0, w: CH.w, h: CH.rh * 2 + 44 }, light: 0.03 });
      P(g, s, '#E8664A', (h) => A.rect(h, CH.w / 2 - 44, -10, 88, 26, 8, 3, 0.6), { shadow: 0.5 });
      A.line(g, 'rgba(46,42,59,.2)', 3, (h) => { h.moveTo(16, 30 + CH.rh); h.lineTo(CH.w - 16, 30 + CH.rh); h.moveTo(112, 34); h.lineTo(112, CH.rh * 2 + 24); });
    }) });
    const glass = (g, salty) => {
      g.beginPath(); g.moveTo(-26, -30); g.lineTo(26, -30); g.lineTo(20, 32); g.lineTo(-20, 32); g.closePath(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill();
      g.beginPath(); g.moveTo(-24.5, -14); g.lineTo(24.5, -14); g.lineTo(20, 32); g.lineTo(-20, 32); g.closePath(); g.fillStyle = salty ? '#B5D6E2' : '#86BCD0'; g.fill();
      if (salty) for (const [x, y] of [[-10, 2], [6, 14], [-2, 22], [12, -2], [-14, 18], [2, 4]]) { g.fillStyle = '#FFFFFF'; g.fillRect(x - 2.5, y - 2.5, 5, 5); }
      g.beginPath(); g.moveTo(-26, -30); g.lineTo(26, -30); g.lineTo(20, 32); g.lineTo(-20, 32); g.closePath(); g.strokeStyle = 'rgba(46,42,59,.35)'; g.lineWidth = 2.5; g.stroke();
    };
    const ICON = {
      ball: (g, s) => { g.scale(0.72, 0.72); clayArt(g, s, 0); }, boat: (g, s) => { g.scale(0.56, 0.56); clayArt(g, s, 3); },
      raft: (g, s) => { g.scale(0.52, 0.52); raftArt(g, s, 160, 0); }, deep: (g, s) => { g.scale(0.52, 0.52); hullArt(g, s, 160, 68, 0); },
      water: (g) => glass(g, false), salt: (g) => glass(g, true),
    };
    const rowN = [0, 1].map((i) => {
      const r = st.add({ z: 15, x: CH.x + 8, y: CH.y + 32 + i * CH.rh, hit: { x: 0, y: 2, w: CH.w - 16, h: CH.rh - 6 }, label: 'chart row ' + (i + 1), visible: false, pressable: false, row: null, wig: -9 });
      r.draw = (g, s) => {
        const row = r.row; if (!row) return;
        const w = st.t - r.wig < 0.5 ? Math.sin((st.t - r.wig) * 32) * 5 : 0;
        g.save(); g.translate(w, 0);
        if (row.pulse) { g.beginPath(); A.rect(g, 2, 4, CH.w - 20, CH.rh - 10, 14, 3, 0.5); g.fillStyle = `rgba(247,205,90,${0.45 + Math.sin(st.t * 6) * 0.25})`; g.fill(); }
        g.save(); g.translate(52, CH.rh / 2); ICON[row.icon](g, s); g.restore();
        const x0 = 112, cw = CH.w - 16 - x0, mid = CH.rh / 2;
        if (row.val == null) { g.save(); g.translate(x0 + cw / 2, mid); g.rotate(Math.sin(st.t * 2 + i) * 0.08); g.font = `800 60px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = row.pulse ? A.C.plum : 'rgba(46,42,59,.25)'; g.fillText('?', 0, 4); g.restore(); }
        else if (typeof row.val === 'string') { const k = Math.min(1, (st.t - row.t) * 5); g.save(); g.translate(x0 + cw / 2, mid); g.scale(k, k); sign(g, row.val, 42); g.restore(); }
        else {
          const shown = Math.min(row.val, Math.floor((st.t - row.t) / 0.16) + 1), per = 4;
          for (let c = 0; c < shown; c++) { const x = x0 + 18 + (c % per) * 27, y = mid - (row.val > per ? 16 : 0) + Math.floor(c / per) * 30; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fillStyle = '#F2B33D'; g.fill(); g.strokeStyle = '#C98A2B'; g.lineWidth = 2.5; g.stroke(); }
          g.font = `800 50px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(String(shown), x0 + cw - 24, mid + 3);
        }
        g.restore();
      };
      r.onTap = () => { if (!fire('row' + i) && !fire('row', i)) K.sfx.tap(); };
      return r;
    });
    function setChart(icons) { chart.visible = true; chart.sx = chart.sy = 1; rowN.forEach((r, i) => { r.row = { icon: icons[i], val: null, pulse: false, t: 0 }; r.visible = true; }); }
    async function record(i, val) {
      const row = rowN[i].row; row.pulse = true; ctx.prompt(T.chart);
      await ev('row' + i);
      row.pulse = false; row.val = val; row.t = st.t; K.sfx.pop();
      if (typeof val === 'number') for (let c = 0; c < val; c++) ctx.after(c * 160, () => K.sfx.step(c));
      else ctx.fx.burst(CH.x + CH.w * 0.7, CH.y + 32 + (i + 0.5) * CH.rh, { n: 8 });
      await ctx.wait(700 + (typeof val === 'number' ? val * 160 : 0));
    }
    // the coin pile and the salt shaker stand on the shelf
    const stack = st.add({ z: 40, x: cx + (land ? 190 : 150), y: shelfY - 4, hit: { x: -60, y: -96, w: 120, h: 100 }, label: 'coins', visible: false, pulse: false });
    stack.draw = (g, s) => {
      const k = stack.pulse ? 1 + Math.sin(st.t * 6) * 0.06 : 1;
      if (stack.pulse) { g.beginPath(); g.arc(0, -40, 66 + Math.sin(st.t * 6) * 4, 0, 7); g.fillStyle = 'rgba(247,205,90,.5)'; g.fill(); }
      g.save(); g.scale(k * 1.5, k * 1.5); g.shadowColor = 'rgba(46,40,70,.22)'; g.shadowBlur = 5 * s; g.shadowOffsetY = 3 * s; pile(g, 7, 0, 30); g.restore();
    };
    const shaker = st.add({ z: 40, x: cx - (land ? 170 : 130), y: shelfY - 4, hit: { x: -50, y: -112, w: 100, h: 116 }, label: 'salt', visible: false, pulse: false, shake: 0, pressable: false });
    const shakerSp = A.sprite('flshaker', [-44, -116, 88, 120], (g, s) => {
      P(g, s, '#EDF5F6', (h) => A.cut(h, [[-30, -76], [30, -76], [36, 0], [-36, 0]], [10, 10, 12, 12], 0.6, 3), { box: { x: -36, y: -76, w: 72, h: 76 }, light: 0.05, grain: 0.08 });
      g.beginPath(); A.cut(g, [[-31, -44], [31, -44], [33, -4], [-33, -4]], 8, 0.4, 4); g.fillStyle = '#FFFFFF'; g.fill();
      P(g, s, '#B9BEC9', (h) => { h.moveTo(-32, -74); h.quadraticCurveTo(-30, -110, 0, -110); h.quadraticCurveTo(30, -110, 32, -74); h.closePath(); }, { shadow: 0.4, light: 0.1, box: { x: -32, y: -110, w: 64, h: 36 } });
      for (const [x, y] of [[-10, -96], [8, -98], [0, -86], [-16, -84], [16, -86]]) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fillStyle = INK; g.fill(); }
      A.line(g, 'rgba(255,255,255,.7)', 4, (h) => { h.moveTo(-22, -66); h.lineTo(-25, -14); });
    });
    shaker.draw = (g) => {
      const k = shaker.pulse && shaker.shake <= 0 ? 1 + Math.sin(st.t * 6) * 0.06 : 1;
      if (shaker.pulse && shaker.shake <= 0) { g.beginPath(); g.arc(0, -56, 72 + Math.sin(st.t * 6) * 4, 0, 7); g.fillStyle = 'rgba(247,205,90,.5)'; g.fill(); }
      g.save(); g.scale(k, k); g.drawImage(shakerSp.canvas, -shakerSp.ox, -shakerSp.oy, shakerSp.w, shakerSp.h); g.restore();
    };
    const shakeHome = { x: shaker.x, y: shaker.y };
    shaker.update = (dt) => {
      if (shaker.shake <= 0) return;
      shaker.shake -= dt; const on = shaker.shake > 0;
      shaker.x = on ? cx - 110 + Math.sin(st.t * 40) * 9 : shakeHome.x; shaker.y = on ? T0.top - 96 + Math.cos(st.t * 34) * 7 : shakeHome.y; shaker.rot = on ? 2.5 : 0;
      if (on && Math.random() < dt * 60) water.grains.push({ x: cx - 70 + (Math.random() - 0.5) * 50, y: T0.top - 40, vx: (Math.random() - 0.5) * 60, vy: 100 + Math.random() * 200, life: 1.6 });
    };
    shaker.onTap = () => {
      if (!S || S.kind !== 'exp' || !S.salting) { K.sfx.tap(); return; }
      shaker.shake = 0.6; for (let i = 0; i < 5; i++) K.sfx.noise(0.05, { freq: 5200, vol: 0.12, delay: i * 0.09 });
      ctx.after(420, () => { water.salt++; fire('salt'); });
    };
    stack.onTap = () => {
      const s = S; if (!s || s.kind !== 'exp' || !s.boat || !s.boat.floats || s.boat.ph !== 'water') { K.sfx.tap(); return; }
      const b = s.boat; s.flying = (s.flying || 0) + 1; K.sfx.tap();
      const x0 = stack.x, y0 = stack.y - 60, t0 = st.t;
      const c = st.add({ z: 41, x: x0, y: y0, sprite: itemSprite('coin'), sx: 0.4 * IS, sy: 0.4 * IS });
      c.update = () => {
        const q = Math.min(1, (st.t - t0) / 0.45), y1 = b.n.y - b.hh - 14;
        c.x = x0 + (b.n.x - x0) * q; c.y = y0 + (y1 - y0) * q * q - Math.sin(q * Math.PI) * 90; c.rot = q * 6;
        if (q < 1) return;
        c.remove(); s.flying--;
        if (!b.floats) { const o = makeThing(SPECIAL.coin, b.n.x + 40, y1); s.extra.push(o); o.n.sx = o.n.sy = o.sc; o.n.tweens.length = 0; o.n.z = 25; o.ph = 'air'; o.tx = b.n.x + 60; o.told = true; return; }
        if (b.load < b.cap) { b.load++; s.count = b.load; counterPop = 1; b.sub = b.sub0 + (0.93 - b.sub0) * (b.load / b.cap); b.vy += 110; K.sfx.step(b.load - 1); K.sfx.tone(1900, 0.06, { type: 'triangle', vol: 0.12 }); water.ripples.push({ x: b.n.x, t: 0, a: 6 }); }
        else {                                            // one coin too many
          b.floats = false; b.told = false; stack.pulse = false; K.sfx.whoops(); splash(b.n.x, 0.7); speak(T.heavy);
          const o = makeThing(SPECIAL.coin, b.n.x + 30, y1); s.extra.push(o); o.n.sx = o.n.sy = o.sc; o.n.tweens.length = 0; o.n.z = 25; o.ph = 'air'; o.tx = b.n.x + 80; o.told = true;
        }
      };
    };
    let counterPop = 0;
    const counter = st.add({ z: 16, x: land ? cx - side : W - 112, y: land ? 560 : 968, visible: false });
    counter.draw = (g, s) => {
      const k = 1 + counterPop * 0.2, r = land ? 84 : 70; g.save(); g.scale(k, k);
      g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, CREAM, { shadow: 1, light: 0.04, box: box(r) });
      g.font = `800 ${r * 1.1}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(String((S && S.count) || 0), 0, -2);
      g.save(); g.translate(0, r * 0.66); g.scale(0.9, 0.9); pile(g, 1, 8, 0); g.restore();
      g.restore();
    };
    counter.update = (dt) => { counterPop = Math.max(0, counterPop - dt * 3); };

    function startExp(name) {
      clearAll(); showMarks(false); planks.visible = false; tally.visible = false; stack.visible = shaker.visible = counter.visible = false; water.salt = 0;
      name = name || ['shape', 'load', 'salt'][expNo++ % 3];
      S = { kind: 'exp', exp: name, extra: [], count: 0 };
      K.sfx.whoosh();
      ({ shape: expShape, load: expLoad, salt: expSalt })[name](S);
    }
    async function endExp(s) {
      skill++;
      await ctx.wait(700);
      await ctx.celebrate({ ms: 3400 });
      if (S !== s) return;
      stack.visible = shaker.visible = counter.visible = false; water.salt = 0;
      nextUp();
    }
    const shelfSpot = (th) => ({ x: cx, y: shelfY - 6 - th.hh });
    async function tapToDrop(th, text) { th.pulse = true; ctx.prompt(text); await ev('thing'); th.pulse = false; drop(th); await ev('result'); }
    async function expShape(s) {
      setChart(['ball', 'boat']);
      const th = makeThing(SPECIAL.clay, cx, shelfY - 6 - 40 * IS, 0.1);
      await tapToDrop(th, T.dropBall);
      await sayWait(T.ballSinks, 1900);
      await record(0, 'sink');
      th.ph = 'tool'; th.n.z = 40; st.root._sorted = false; K.sfx.whoosh(); splash(th.n.x, 0.3, true);
      await th.n.to({ x: cx, y: shelfY - 6 - th.hh, rot: 0 }, { dur: 0.7, ease: 'inOut' });
      th.pulse = true; ctx.prompt(T.press);
      for (let i = 1; i <= 3; i++) {
        await ev('thing');
        th.stage = i; K.sfx.pop(); K.sfx.tone(200 + i * 60, 0.12, { to: 120, vol: 0.18 });
        th.hh = [40, 30, 17, 29][i] * th.sc; th.n.y = shelfY - 6 - th.hh;
        th.n.sx = th.sc * 1.25; th.n.sy = th.sc * 0.7; th.n.to({ sx: th.sc, sy: th.sc }, { dur: 0.4, ease: 'elastic' });
      }
      th.floats = true; th.sub = 0.42; th.ph = 'shelf';
      await ctx.wait(500);
      await tapToDrop(th, T.dropBoat);
      K.sfx.ding(); ctx.fx.burst(th.n.x, th.n.y - 50, { n: 14 });
      await sayWait(T.boatFloats, 1900);
      await record(1, 'float');
      await sayWait(T.air, 2600);
      endExp(s);
    }
    async function expLoad(s) {
      const kinds = K.shuffle(['raft', 'deep']), small = K.randInt(2, 4), caps = { raft: small, deep: small + K.randInt(2, 4) };
      setChart(kinds); counter.visible = true; stack.visible = true;
      for (let i = 0; i < 2; i++) {
        const k = kinds[i], th = makeThing(SPECIAL[k], cx, T0.top - 60, 0);
        th.cap = caps[k]; th.sub0 = th.sub; s.boat = th; s.count = 0;
        await ctx.wait(350); drop(th, cx, true); th.told = true;
        await ctx.wait(900);
        stack.pulse = true; ctx.prompt(k === 'raft' ? T.loadRaft : T.loadDeep);
        await ev('result');                              // it rests on the sand
        await ctx.wait(900);
        await record(i, th.cap);
        removeThing(th); for (const o of s.extra.splice(0)) removeThing(o);
        s.boat = null; await ctx.wait(400);
      }
      stack.visible = false; counter.visible = false;
      const best = kinds.indexOf('deep'); let misses = 0;
      ctx.prompt(T.which);
      for (;;) {
        const pick = await ev('row');
        if (pick === best) break;
        K.sfx.whoops(); rowN[pick].wig = st.t; misses++; speak(T.look);
        if (misses >= 2) rowN[best].row.pulse = true;
      }
      rowN[best].row.pulse = false; K.sfx.ding(); ctx.after(200, () => K.sfx.sparkle()); ctx.fx.burst(CH.x + CH.w / 2, CH.y + 32 + (best + 0.5) * CH.rh, { n: 16 });
      await sayWait(T.sides, 2800);
      endExp(s);
    }
    async function expSalt(s) {
      setChart(['water', 'salt']);
      const th = makeThing(SPECIAL.egg, cx, shelfY - 6 - 44 * IS, 0.1);
      await tapToDrop(th, T.dropEgg);
      await sayWait(T.eggSinks, 1900);
      await record(0, 'sink');
      const need = K.randInt(3, 5), rest = th.n.y;
      shaker.visible = true; shaker.pulse = true; shaker.sx = shaker.sy = 0.2; shaker._bsx = shaker._bsy = 1; shaker.to({ sx: 1, sy: 1 }, { dur: 0.35, ease: 'back' });
      s.salting = true; ctx.prompt(T.salt);
      while (water.salt < need) {
        await ev('salt');
        if (water.salt < need) { const lift = 16 * water.salt; th.n.to({ y: rest - lift }, { dur: 0.35, ease: 'out' }).then(() => { if (!th.floats) th.n.to({ y: rest }, { dur: 0.7, ease: 'inOut' }); }); }
      }
      s.salting = false; shaker.pulse = false;
      th.n.tweens.length = 0; th.floats = true; th.told = false; th.ph = 'water'; th.vy = -60; th.wet = 0;
      await ev('result');
      K.sfx.ding(); ctx.after(200, () => K.sfx.sparkle()); ctx.fx.burst(th.n.x, T0.surf - 60, { n: 14 });
      await sayWait(T.eggFloats + ' ' + T.heavier, 3800);
      await record(1, 'float');
      endExp(s);
    }

    K._floats = {                                         // for browser tests
      get S() { return S; }, things, marks, rows: rowN, stack, shaker, water, fire, startExp, newSet, T: T0,
      get skill() { return skill; }, set skill(v) { skill = v; }, get surprises() { return surprises; },
      get answer() { return S && S.cur ? (S.cur.floats ? 'float' : 'sink') : null; },
    };
    ctx.onExit(() => { K._floats = null; });
    ctx.after(400, () => { if (L === 3) { seq = -1; } nextUp(); });
  }

  function icon(g, w) {
    const u = w / 300;
    g.fillStyle = '#DDEBE6'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#DDB083'; g.fillRect(0, 252 * u, w, 48 * u);
    g.fillStyle = '#EAF5F4'; g.fillRect(34 * u, 70 * u, 232 * u, 186 * u);
    g.fillStyle = '#EBD6A4'; g.fillRect(34 * u, 232 * u, 232 * u, 24 * u);
    g.beginPath(); g.ellipse(196 * u, 228 * u, 30 * u, 22 * u, 0, 0, 7); g.fillStyle = '#9C9BA8'; g.fill();
    g.beginPath(); g.arc(108 * u, 112 * u, 34 * u, 0, 7); g.fillStyle = '#E8664A'; g.fill();
    g.beginPath(); g.arc(96 * u, 100 * u, 9 * u, 0, 7); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill();
    g.beginPath(); g.moveTo(34 * u, 122 * u); for (let x = 34; x <= 266; x += 8) g.lineTo(x * u, (122 + Math.sin(x * 0.09) * 5) * u); g.lineTo(266 * u, 256 * u); g.lineTo(34 * u, 256 * u); g.closePath(); g.fillStyle = 'rgba(90,170,210,.55)'; g.fill();
    g.beginPath(); g.moveTo(34 * u, 122 * u); for (let x = 34; x <= 266; x += 8) g.lineTo(x * u, (122 + Math.sin(x * 0.09) * 5) * u); g.strokeStyle = '#FFFFFF'; g.lineWidth = 5 * u; g.stroke();
    for (const [x, y, r] of [[190, 190, 6], [204, 166, 4], [188, 146, 5]]) { g.beginPath(); g.arc(x * u, y * u, r * u, 0, 7); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.5 * u; g.stroke(); }
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 7 * u; g.strokeRect(34 * u, 70 * u, 232 * u, 186 * u);
    g.fillStyle = '#2F8F8A'; g.fillRect(24 * u, 250 * u, 252 * u, 14 * u);
  }

  K.game({ id: 'floats', title: 'Sink or Float', voice: 'floats', group: 'arcade', age: 5, subject: 'science', order: 28, icon, start, lines, resize: () => K.go('floats') });
})();
