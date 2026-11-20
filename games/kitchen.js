/* Monster Kitchen — Munch is hungry.
   Food tumbles onto the counter. Tap a food and it flies to Munch; or pick it up, carry it, throw it.
   His eyes follow the food, his mouth opens as it comes near, he chews, burps and counts out loud.
   Wrong things are funny, never bad: he spits the shoe back out. "Bleh! That's a shoe!"
   The blender is free play: drop food in, press the button, and Munch drinks the smoothie and
   turns its colour for a moment.

   Orders (same sentences as the old Feed Me, so the recorded monster voice still fits):
   Level 1: "I want a banana!"   Level 2: "I want strawberries! Three of them!", "something red!"
   Level 3: bigger numbers and adding ("Two, and one more!").
   In counting rounds the child decides when it is enough and rings the bell. Too few: "More, please!"
   Too many: a big burp, "I only wanted three.", and a fresh order. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, Kt = A.kitchen;
  const FOODS = Kt.FOODS, SILLY = Kt.SILLY;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const WHO = 'monster';
  const COUNT_MAX = 10, ADD_A = 5, ADD_B = 3, FED_MAX = 11;
  const num = (n) => K.numWord(n);
  const T = {
    wantOne: (f) => `I want ${f.a}!`,
    wantMany: (f) => `I want ${f.many}!`,
    wantCount: (f, n) => `${T.wantMany(f)} ${cap(num(n))} of them!`,
    wantAdd: (f, a, b) => `${T.wantMany(f)} ${cap(num(a))}, and ${num(b)} more!`,
    wantColor: (c) => `I want something ${c}!`,
    yum: (f, i) => [`Yum yum! ${cap(f.name)}! Thank you!`, `Mmm! ${cap(f.name)}! Delicious!`, `Yummy! ${cap(f.name)}! Thank you!`][i],
    yumColor: (f) => `Yum! ${cap(f.name)}! That was ${f.color}!`,
    full: (n) => `${cap(num(n))}! I'm full!`,
    fullAdd: (a, b) => `${cap(num(a))} and ${num(b)} more makes ${num(a + b)}! I'm full!`,
    silly: (f, i) => [`Bleh! That's ${f.a}!`, `Yuck! I can't eat ${f.a}!`, `Ha ha! ${cap(f.a)} is not food!`][i],
    notThat: (f) => `No thank you! That's ${f.a}.`,
    notColor: (f) => `${cap(f.name)}! That's ${f.color}!`,
    bell: 'Then ring the bell!',
    had: (n) => `That was ${num(n)}!`,
    more: 'More, please!',
    countAgain: (n) => `${cap(num(n))} of them!`,
    addAgain: (a, b) => `${cap(num(a))}, and ${num(b)} more!`,
    only: (n) => `I only wanted ${num(n)}.`,
    hungry: 'Feed me! Feed me!',
    tickle: ['Hee hee! That tickles!', "I'm so hungry!", 'Feed me! Feed me!', 'Hee hee hee!'],
    smoothie: 'Mmm! Delicious!',
    count: (n) => num(n) + '!', // the narrator counts along
  };
  function uniq(list) {
    const seen = {}, out = [];
    for (const item of list) {
      const who = item.who || '', text = item.text || item;
      for (const s of String(text).match(/[^.!?…]+[.!?…]*/g) || []) { const key = K.voiceKey(s); if (!key || seen[who + '|' + key]) continue; seen[who + '|' + key] = 1; out.push(who ? { text: s.trim(), who } : s.trim()); }
    }
    return out;
  }
  function lines() {
    const m = [], narrator = [];
    for (const f of FOODS) { m.push(T.wantOne(f), T.yum(f, 0), T.yum(f, 1), T.yum(f, 2), T.notThat(f)); if (f.color) m.push(T.wantColor(f.color), T.yumColor(f), T.notColor(f)); if (f.many) m.push(T.wantMany(f)); }
    for (const f of SILLY) m.push(T.silly(f, 0), T.silly(f, 1), T.silly(f, 2));
    const any = FOODS.find((f) => f.many);
    for (let n = 1; n <= FED_MAX; n++) { narrator.push(T.count(n)); m.push(T.had(n)); }
    for (let n = 2; n <= COUNT_MAX; n++) m.push(T.wantCount(any, n), T.full(n), T.only(n));
    m.push(T.bell, T.more, T.hungry, T.smoothie);
    for (let a = 1; a <= ADD_A; a++) for (let b = 1; b <= ADD_B; b++) m.push(T.wantAdd(any, a, b), T.fullAdd(a, b));
    return uniq(narrator.concat(T.tickle.concat(m).map((text) => ({ text, who: WHO }))));
  }
  function fit(n, W, H, gap, max) {
    let best = { cols: n, size: 0 };
    for (let c = 1; c <= n; c++) { const r = Math.ceil(n / c), s = Math.min((W - gap * (c + 1)) / c, (H - gap * (r + 1)) / r); if (s > best.size + 0.5) best = { cols: c, size: s }; }
    best.size = Math.max(20, Math.min(best.size, max)); best.rows = Math.ceil(n / best.cols);
    return best;
  }

  function start(st, ctx) {
    const L = ctx.level, ROUNDS = 4;
    const W = st.W, H = st.H, land = W >= 1000;
    const cy = H - (land ? 250 : 300), floor = cy + 30;          // counter top; where food rests
    const ms = land ? 2.3 : 1.75, mx = land ? W - 300 : W - 170, my = cy + 14;
    const mouth = { x: mx, y: my + A.MONSTER_MOUTH.y * ms - 8 };
    const FR = land ? 50 : 42, eatR = land ? 150 : 118;
    const bs = land ? 1 : 0.78, bx = land ? 150 : 86;
    const world = E.world({ floor, left: bx + 80 * bs, right: land ? W - 170 : W - 8 });
    const foods = [];
    let R = null, won = 0, lastKey = '', lastKind = '', lastAct = 0, firstRound = true;

    const sfx = {
      chomp() { for (let i = 0; i < 3; i++) { K.sfx.tone(190, 0.09, { type: 'square', vol: 0.1, to: 110, delay: i * 0.22 }); K.sfx.noise(0.06, { freq: 900, vol: 0.2, delay: i * 0.22 }); } },
      burp() { K.sfx.tone(170, 0.5, { type: 'sawtooth', to: 62, vol: 0.16 }); K.sfx.tone(85, 0.5, { type: 'square', to: 45, vol: 0.08 }); },
      bleh() { K.sfx.tone(320, 0.4, { type: 'sawtooth', to: 120, vol: 0.1 }); },
      giggle() { [660, 880, 700, 990, 780].forEach((f, i) => K.sfx.tone(f, 0.08, { type: 'triangle', vol: 0.15, delay: i * 0.09 })); },
      plop() { K.sfx.tone(300, 0.12, { to: 140, vol: 0.2 }); },
      gulp(i) { K.sfx.tone(240, 0.12, { to: 120, vol: 0.2, delay: i * 0.25 }); },
    };
    const mSay = (text) => ctx.say(text, { who: WHO, pitch: 0.6, rate: 0.92 });

    /* ---------- room ---------- */
    const key = Math.round(W) + 'x' + Math.round(H);
    if (!Kt.pics) Kt.ready().then((ok) => { if (ok && ctx.alive) K.go('kitchen'); });      // the pictures arrived late: start again with them
    st.add({ z: 0, sprite: A.sprite('kwall' + (Kt.pics ? 'P' : '') + key, [0, 0, W, H], (g, s) => Kt.wall(g, s, W, H, cy)) });
    st.add({ z: 20, sprite: A.sprite('kcounter' + (Kt.pics ? 'P' : '') + key, [0, 0, W, H], (g, s) => Kt.counter(g, s, W, H, cy)) });
    // the cookie jar counts the orders Munch has enjoyed
    const jp = land ? { x: W * 0.44, y: cy - 202 } : { x: W - 84, y: 540 }; // on the tile ledge; on a phone, on a little wall shelf
    // (with the painted wall the jar gets its own little shelf on the tablet too)
    if (!land || Kt.pics) st.add({ z: 1, draw(g, s) { for (const y of land ? [jp.y] : [344, 540]) { g.beginPath(); A.rect(g, land ? jp.x - 78 : W - 150, y, land ? 156 : 134, 14, 4, y, 0.5); A.paper(g, s, Kt.pics ? '#E3A04A' : '#C08A5A', { shadow: 0.8 }); } } });
    const cookieJar = st.add({ z: 2, x: jp.x, y: jp.y, pop: 0 });
    cookieJar.draw = (g, s) => {
      g.save(); const k = 1 + cookieJar.pop * 0.12; g.scale(k, k);
      g.beginPath(); A.rect(g, -44, -104, 88, 104, 16, 3, 0.5); A.paper(g, s, 'rgba(235,245,246,.75)', { shadow: 0.7, grain: 0.05, light: 0 });
      for (let i = 0; i < won; i++) { g.save(); g.translate([-16, 18, -12, 16][i], -22 - i * 20); g.rotate(i * 0.7); g.scale(0.4, 0.4); const sp = Kt.sprite('cookie'); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore(); }
      A.line(g, 'rgba(255,255,255,.7)', 4, (h) => { h.moveTo(-30, -88); h.lineTo(-30, -30); });
      g.beginPath(); A.rect(g, -40, -118, 80, 18, 7, 4, 0.4); A.paper(g, s, '#E8664A', { shadow: 0.5 });
      g.restore();
    };
    cookieJar.update = (dt) => { cookieJar.pop = Math.max(0, cookieJar.pop - dt * 2.5); };

    /* ---------- Munch ---------- */
    const m = { open: 0, openT: 0, chew: 0, bleh: 0, cheer: 0, lookX: 0, lookY: 0, tint: null, tintK: 0, belly: 0, blinkAt: 2, blink: 0, lookAt: null };
    const mon = st.add({ z: 10, x: mx, y: my, label: 'monster', pressable: false, hit: { x: -88 * ms, y: -168 * ms, w: 176 * ms, h: 150 * ms } });
    mon.draw = (g, s) => {
      g.save(); g.scale(ms, ms);
      A.monster(g, s * ms, { open: m.open, blink: m.blink, lookX: m.lookX, lookY: m.lookY, bleh: m.bleh > 0, tint: m.tint, tintK: m.tintK, belly: m.belly,
        squash: m.cheer > 0 ? Math.sin(st.t * 16) * 0.05 : Math.sin(st.t * 1.8) * 0.012, arms: m.cheer > 0 ? 1 : m.open * 0.4 });
      g.restore();
    };
    mon.onTap = () => { m.cheer = 0.8; sfx.giggle(); ctx.fx.burst(mx, my - 100 * ms, { n: 8 }); if (R && !R.over && !R.busy) mSay(K.pick(T.tickle)); };
    function monsterFrame(dt) {
      m.blinkAt -= dt; if (m.blinkAt < 0) { m.blink = Math.sin(Math.min(1, -m.blinkAt / 0.16) * Math.PI); if (m.blinkAt < -0.16) { m.blinkAt = 3 + Math.random() * 3; m.blink = 0; } }
      let target = m.openT;
      if (m.chew > 0) { m.chew -= dt; target = 0.25 + 0.5 * Math.abs(Math.sin(m.chew * 14)); }
      m.open += (target - m.open) * Math.min(1, dt * 16);
      m.bleh = Math.max(0, m.bleh - dt); m.cheer = Math.max(0, m.cheer - dt); m.tintK = Math.max(0, m.tintK - dt / 5);
      let tx = Math.sin(st.t * 0.5) * 0.4, ty = 0.1;
      const at = m.lookAt;
      if (at) { tx = K.clamp((at.x - mx) / 320, -1, 1); ty = K.clamp((at.y - (my - 106 * ms)) / 320, -1, 1); }
      m.lookX += (tx - m.lookX) * Math.min(1, dt * 10); m.lookY += (ty - m.lookY) * Math.min(1, dt * 10);
    }

    /* ---------- blender ---------- */
    const jar = { items: [], busy: false, spin: 0, level: 0, levelT: 0, col: '#E26A5A', shake: 0 };
    const blender = st.add({ z: 25, x: bx, y: floor, sx: bs, sy: bs });
    const baseSp = A.sprite('blender', [-76, -96, 152, 98], Kt.blenderBase);
    blender.draw = (g, s) => {
      g.save(); g.translate(Math.sin(st.t * 60) * jar.shake * 4, 0);
      // contents and liquid, clipped to the jar
      g.save(); g.beginPath(); Kt.jarPath(g); g.clip();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-70, -300, 140, 210);
      if (jar.level > 0.01) { const top = -92 - 200 * jar.level; g.beginPath(); g.moveTo(-70, top); for (let x = -70; x <= 70; x += 14) g.lineTo(x, top + Math.sin(x * 0.08 + st.t * (jar.spin > 0 ? 22 : 3)) * (jar.spin > 0 ? 9 : 3)); g.lineTo(70, -90); g.lineTo(-70, -90); g.closePath(); g.fillStyle = jar.col; g.fill(); }
      jar.items.forEach((it, i) => {
        const sp = Kt.sprite(it.f.name), k = (jar.spin > 0 ? Math.max(0.1, jar.spin / 1.7) : 1) * 0.5;
        const a = jar.spin > 0 ? st.t * 18 + i * 1.6 : 0;
        const x = jar.spin > 0 ? Math.cos(a) * 26 : (i % 2 ? 20 : -20), y = -126 - Math.floor(i / 2) * 52 - (jar.spin > 0 ? 30 + Math.sin(a * 0.7) * 30 : Math.sin(st.t * 2 + i) * 3);
        g.save(); g.translate(x, y); g.rotate(jar.spin > 0 ? a : it.rot); g.scale(k, k); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); g.restore();
      });
      g.restore();
      // glass
      g.beginPath(); Kt.jarPath(g); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.stroke();
      g.beginPath(); Kt.jarPath(g); g.strokeStyle = 'rgba(70,110,120,.35)'; g.lineWidth = 1.5; g.stroke();
      A.line(g, 'rgba(255,255,255,.7)', 6, (h) => { h.moveTo(-44, -270); h.lineTo(-36, -150); });
      g.drawImage(baseSp.canvas, -baseSp.ox, -baseSp.oy, baseSp.w, baseSp.h);
      g.restore();
    };
    const button = blender.add(new E.Node({ x: 0, y: -40, hitR: 44, label: 'Blend' }));
    button.draw = (g, s) => {
      const ready = jar.items.length && !jar.busy, k = ready ? 1 + Math.sin(st.t * 5) * 0.05 : 1;
      g.save(); g.scale(k, k);
      g.beginPath(); g.arc(0, 0, 27, 0, 7); A.paper(g, s, ready ? '#E8664A' : '#C98B7C', { shadow: 0.7, light: 0.1, box: { x: -27, y: -27, w: 54, h: 54 } });
      g.beginPath(); for (let i = 0; i < 3; i++) { const a = st.t * (jar.spin > 0 ? 20 : 0) + i * 2.094; g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a + 0.6) * 14, Math.sin(a + 0.6) * 14, Math.cos(a) * 17, Math.sin(a) * 17); } g.strokeStyle = '#FBF6EC'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke();
      g.restore();
    };
    button.onTap = blend;
    const glass = st.add({ z: 27, x: 0, y: floor, visible: false, level: 1, col: '#fff' });
    glass.draw = (g) => {
      const path = (h) => { h.moveTo(-26, -84); h.lineTo(26, -84); h.lineTo(20, 0); h.lineTo(-20, 0); h.closePath(); };
      g.save(); g.beginPath(); path(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-30, -90, 60, 90); g.fillStyle = glass.col; g.fillRect(-30, -78 * glass.level, 60, 80); g.restore();
      g.beginPath(); path(g); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4; g.stroke();
      A.line(g, '#E8664A', 5, (h) => { h.moveTo(6, -30); h.lineTo(22, -112); });
    };
    const inJarZone = (b) => Math.abs(b.x - bx) < 72 * bs && b.y > floor - 298 * bs - 150 && b.y < floor - 140 * bs;
    function intoJar(o) {
      if (jar.busy || jar.items.length >= 4) { o.body.vx = 420; o.body.vy = -520; o.body.thrown = false; jar.shake = 0.5; K.sfx.tap(); return; }
      unpile(o); o.busy = true; sfx.plop();
      o.node.to({ x: bx, y: floor - 210 * bs, sx: o.base * 0.5, sy: o.base * 0.5 }, { dur: 0.18, ease: 'out' }).then(() => {
        o.node.remove(); jar.items.push({ f: o.f, rot: Math.random() * 6 });
        if (o.f.silly) ctx.after(450, () => {   // the blender will not have it
          const i = jar.items.findIndex((it) => it.f === o.f); if (i >= 0) jar.items.splice(i, 1);
          jar.shake = 0.6; K.sfx.whoops(); sfx.giggle();
          const n = drop(o.f, bx + 30, 0); n.body.x = bx + 20; n.body.y = floor - 330 * bs; n.body.vx = 420 + Math.random() * 200; n.body.vy = -760; n.body.vr = 9;
          if (R && !R.over && !R.busy) mSay(T.silly(o.f, 2));
        });
      });
      restock();
    }
    function blend() {
      if (jar.busy) return;
      if (!jar.items.length) { jar.shake = 0.3; K.sfx.tap(); return; }
      jar.busy = true; lastAct = performance.now();
      let rgb = [0, 0, 0]; for (const it of jar.items) { const h = (it.f.juice || '#C9A070').slice(1); rgb = rgb.map((v, i) => v + parseInt(h.substr(i * 2, 2), 16)); }
      jar.col = '#' + rgb.map((v) => Math.round(v / jar.items.length).toString(16).padStart(2, '0')).join('');
      jar.levelT = 0.3 + 0.13 * jar.items.length; jar.spin = 1.7; jar.shake = 1.7;
      for (let i = 0; i < 16; i++) ctx.after(i * 100, () => { K.sfx.noise(0.12, { freq: 400 + Math.random() * 700, vol: 0.13 }); K.sfx.tone(130 + i * 7, 0.1, { type: 'sawtooth', vol: 0.05 }); });
      ctx.wait(1750).then(() => {
        jar.items.length = 0; K.sfx.ding();
        glass.visible = true; glass.x = bx + 120 * bs; glass.y = floor; glass.rot = 0; glass.level = 1; glass.col = jar.col; glass.alpha = 1; glass.sx = glass.sy = 0.2;
        jar.levelT = 0;
        return glass.to({ sx: 1, sy: 1 }, { dur: 0.3, ease: 'back' });
      }).then(() => { K.sfx.whoosh(); m.lookAt = glass; return glass.to({ x: mouth.x - 96 }, { dur: 0.9, ease: 'inOut' }); })
        .then(() => { m.openT = 1; return glass.to({ x: mouth.x - 46, y: mouth.y + 40, rot: 0.75 }, { dur: 0.35 }); })
        .then(() => { for (let i = 0; i < 3; i++) sfx.gulp(i); return glass.to({ level: 0 }, { dur: 0.8, ease: 'linear' }); })
        .then(() => {
          m.openT = 0; m.lookAt = null; m.tint = jar.col; m.tintK = 1; m.cheer = 1; sfx.burp(); ctx.fx.burst(mouth.x, mouth.y - 60, { n: 16, color: jar.col });
          if (R && !R.over && !R.busy) mSay(T.smoothie);
          return glass.to({ alpha: 0, y: floor + 10 }, { dur: 0.4 });
        }).then(() => { glass.visible = false; jar.busy = false; });
    }

    /* ---------- food ---------- */
    function drop(f, x, delay) {
      const body = { x, y: -80 - Math.random() * 60, r: FR, vr: (Math.random() - 0.5) * 6, ghost: true };
      const base = FR / 50;
      const node = st.add({ z: 30, sprite: Kt.sprite(f.name), sx: base, sy: base, hitR: FR + 10, label: f.name, pressable: false, pad: 4, visible: false });
      const o = { f, node, body, base, round: R, busy: false, grab: false, fly: null, pulse: false };
      world.add(body);
      ctx.after(delay || 0, () => { body.ghost = false; node.visible = true; });
      node.update = (dt) => {
        if (o.fly) {
          const fl = o.fly; fl.t += dt / fl.dur; const k = Math.min(1, fl.t), e = k * k * (3 - 2 * k);
          node.x = fl.x0 + (mouth.x - fl.x0) * e; node.y = fl.y0 + (mouth.y - fl.y0) * e - Math.sin(k * Math.PI) * fl.lift; node.rot += dt * 9;
          const sc = base * (1 - 0.45 * Math.max(0, (k - 0.6) / 0.4)); node.sx = node.sy = sc;
          body.x = node.x; body.y = node.y;
          if (k >= 1) { o.fly = null; arrive(o); }
        } else if (!o.gone) {
          node.x = body.x; node.y = body.y; node.rot = body.rot;
          if (!node.tweens.length) { const p = o.pulse ? 1 + Math.sin(st.t * 7) * 0.09 : o.grab ? 1.12 : 1; node.sx = node.sy = base * p; }
        }
      };
      node.onDown = (p) => { if (o.busy || o.gone) return; o.grab = true; body.held = true; body.thrown = false; body.tx = p.x; body.ty = Math.min(p.y, floor - FR); node.z = 36; st.root._sorted = false; K.sfx.tap(); m.lookAt = body; lastAct = performance.now(); };
      node.onMove = (p) => { if (!o.grab) return; body.tx = p.x; body.ty = Math.min(p.y, floor - FR); m.openT = Math.hypot(body.x - mouth.x, body.y - mouth.y) < eatR * 2 ? 1 : 0; };
      node.onUp = (p, e, s) => {
        if (!o.grab) return; o.grab = false; body.held = false; node.z = 30; st.root._sorted = false;
        const d = Math.hypot(body.x - mouth.x, body.y - mouth.y);
        if (s.moved < 24) toMouth(o, 0.4);                         // a tap: it flies there by itself
        else if (d < eatR * 1.15) toMouth(o, 0.14);
        else if (inJarZone(body)) { m.openT = 0; m.lookAt = null; intoJar(o); }
        else { body.thrown = true; m.openT = 0; }
      };
      node.onTap = (p) => { if (!p && !o.busy && !o.gone) toMouth(o, 0.4); }; // keyboard / screen reader
      foods.push(o);
      return o;
    }
    function toMouth(o, dur) {
      if (o.busy || o.gone) return;
      o.busy = true; o.body.ghost = true; o.body.held = false; o.body.vx = o.body.vy = 0;
      o.fly = { x0: o.body.x, y0: o.body.y, t: 0, dur, lift: dur > 0.2 ? 120 : 0 };
      o.node.z = 36; st.root._sorted = false;
      m.openT = 1; m.lookAt = o.body; if (dur > 0.2) K.sfx.whoosh();
    }
    function unpile(o) { o.gone = true; world.remove(o.body); const i = foods.indexOf(o); if (i >= 0) foods.splice(i, 1); }
    function spit(o) {
      const b = o.body; o.busy = false; b.ghost = false; b.thrown = false;
      b.x = mouth.x - 50; b.y = mouth.y - 10; b.vx = -(520 + Math.random() * 420); b.vy = -(620 + Math.random() * 260); b.vr = -9;
      o.node.z = 30; o.node.sx = o.node.sy = o.base; st.root._sorted = false;
    }
    function restock() {
      if (!R || R.over) return;
      const have = foods.filter((o) => R.want(o.f)).length;
      const need = R.stop ? Math.min(Math.max(0, R.need - R.fed), 2) + 1 : 1;
      if (have < need && foods.length < 14) ctx.after(700, () => { if (R && !R.over) { drop(R.target, world.left + FR + Math.random() * Math.max(10, mx - 200 - world.left - FR * 2), 0); restock(); } });
    }

    /* ---------- the order bubble ---------- */
    const bw = land ? 380 : Math.min(W - 196, 400), bh = land ? 230 : 210;
    const bub = st.add({ z: 45, x: land ? mx - 500 : 24, y: land ? 140 : 150, pop: 0 });
    bub.draw = (g, s) => {
      if (!R) return;
      const k = 1 + bub.pop * 0.08; g.save(); g.translate(bw / 2, bh / 2); g.scale(k, k); g.translate(-bw / 2, -bh / 2);
      const tail = land ? [[bw - 40, bh - 60], [bw + 66, bh + 40], [bw - 110, bh - 16]] : [[bw - 150, bh - 20], [bw - 90, bh + 70], [bw - 220, bh - 20]];
      g.beginPath(); A.cut(g, tail, 8, 0.5, 4); A.paper(g, s, '#FBF6EC', { shadow: 0.9 });
      g.beginPath(); A.rect(g, 0, 0, bw, bh, 44, 6, 1.2); A.paper(g, s, '#FBF6EC', { shadow: 0.9, depth: 1.2, box: { x: 0, y: 0, w: bw, h: bh }, light: 0.03 });
      g.beginPath(); A.cut(g, tail, 8, 0.5, 4); g.fillStyle = '#FBF6EC'; g.fill();
      // contents
      const items = [];
      if (R.kind === 'count') for (let i = 0; i < R.need; i++) items.push('plate');
      else if (R.kind === 'add') { for (let i = 0; i < R.a; i++) items.push('plate'); items.push('plus'); for (let i = 0; i < R.b; i++) items.push('plate'); }
      else items.push(R.reveal ? (R.kind === 'color' ? 'color' : 'food') : 'q');
      const f = fit(items.length, bw - 30, bh - 24, 8, items.length === 1 ? 150 : 96);
      const tw = f.cols * f.size + (f.cols - 1) * 8, th = f.rows * f.size + (f.rows - 1) * 8;
      let pi = 0;
      items.forEach((it, i) => {
        const cx = (bw - tw) / 2 + (i % f.cols) * (f.size + 8) + f.size / 2, cyy = (bh - th) / 2 + Math.floor(i / f.cols) * (f.size + 8) + f.size / 2, r = f.size / 2;
        g.save(); g.translate(cx, cyy);
        const food = (sc) => { const sp = Kt.sprite(R.target.name), q = (r / 62) * sc; g.scale(q, q); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); };
        if (it === 'plate') { const on = R.fill && pi < R.fed; Kt.plate(g, r * 0.94, on); if (on) food(0.8); pi++; }
        else if (it === 'plus') { g.fillStyle = A.C.ink; g.font = `800 ${r * 1.5}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', 0, 0); }
        else if (it === 'q') { g.fillStyle = A.C.plum; g.font = `800 ${r * 1.7}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.rotate(Math.sin(st.t * 2) * 0.08); g.fillText('?', 0, r * 0.08); }
        else if (it === 'color') { g.beginPath(); A.blob(g, 0, 0, r * 0.8, r * 0.74, 0.12, 5, 11); A.paper(g, s, Kt.COLORS[R.color], { shadow: 0.5, box: { x: -r, y: -r, w: r * 2, h: r * 2 } }); }
        else food(1);
        g.restore();
      });
      g.restore();
    };
    bub.update = (dt) => { bub.pop = Math.max(0, bub.pop - dt * 3); };

    /* ---------- the bell ---------- */
    const bell = st.add({ z: 40, x: land ? W - 86 : W - 84, y: land ? floor + 4 : 346, sprite: A.sprite('bell', [-56, -92, 112, 94], Kt.bell), label: 'all done', hit: { x: -56, y: -92, w: 112, h: 94 }, visible: false, sx: land ? 1 : 0.85, sy: land ? 1 : 0.85 });
    bell.onTap = ring;

    /* ---------- rounds ---------- */
    function makeRound() {
      const r = Math.random();
      let kind = L === 1 ? 'pick' : L === 2 ? (r < 0.5 ? 'count' : r < 0.8 ? 'color' : 'pick') : (r < 0.4 ? 'count' : r < 0.8 ? 'add' : 'color');
      if (firstRound && L === 2) kind = 'count';
      if (firstRound && L === 3) kind = 'add';
      if (kind === lastKind && kind !== 'pick' && Math.random() < 0.6) kind = L === 2 ? (kind === 'count' ? 'color' : 'count') : (kind === 'add' ? 'count' : 'add');
      const others = (t, n, withSilly) => { const list = K.sample(FOODS.filter((f) => f !== t), n); if (withSilly && n > 0) list[0] = K.pick(SILLY); return list; };
      const S = { kind, fed: 0, misses: 0, need: 1 };
      if (kind === 'pick') {
        const t = K.pick(FOODS), n = L === 1 ? (firstRound ? 2 : K.randInt(2, 3)) : 4;
        Object.assign(S, { key: 'p' + t.name, target: t, want: (f) => f === t, items: [t].concat(others(t, n - 1, Math.random() < 0.65)), prompt: T.wantOne(t), again: T.wantOne(t), done: T.yum(t, K.randInt(0, 2)) });
      } else if (kind === 'color') {
        const byColor = {}; for (const f of FOODS) if (f.color) (byColor[f.color] = byColor[f.color] || []).push(f);
        const cs = K.sample(Object.keys(byColor), L === 2 ? 3 : 5), t = K.pick(byColor[cs[0]]);
        Object.assign(S, { key: 'c' + cs[0], target: t, color: cs[0], want: (f) => f.color === cs[0], items: cs.map((c, i) => (i ? K.pick(byColor[c]) : t)), prompt: T.wantColor(cs[0]), again: T.wantColor(cs[0]), done: T.yumColor(t) });
      } else {
        const t = K.pick(FOODS.filter((f) => f.many));
        let a = 0, b = 0, N;
        if (kind === 'add') { a = K.randInt(1, ADD_A); b = K.randInt(1, ADD_B); N = a + b; } else N = L === 2 ? K.randInt(2, 5) : K.randInt(4, COUNT_MAX);
        // the counter starts with a handful; more tumbles in as Munch eats, so there is always one too many to choose from
        const first = Math.min(N + 1, 5), nd = 2;
        Object.assign(S, { key: kind + t.name + N, target: t, need: N, a, b, want: (f) => f === t, items: Array(first).fill(t).concat(others(t, nd, true)), again: T.wantMany(t), stop: true, fill: L === 2 });
        if (kind === 'add') Object.assign(S, { prompt: T.wantAdd(t, a, b) + ' ' + T.bell, show: `I want ${a} ${a === 1 ? t.name : t.many} and ${b} more! Then ring the bell!`, done: T.fullAdd(a, b), howMany: T.addAgain(a, b) });
        else Object.assign(S, { prompt: T.wantCount(t, N) + ' ' + T.bell, show: `I want ${N} ${t.many}! Then ring the bell!`, done: T.full(N), howMany: T.countAgain(N) });
      }
      return S;
    }
    function newRound() {
      let S, guard = 0;
      do { S = makeRound(); } while (S.key === lastKey && guard++ < 20);
      lastKey = S.key; lastKind = S.kind; firstRound = false;
      R = S; R.over = false; R.busy = false; R.reveal = false; lastAct = performance.now();
      m.belly = 0; bub.pop = 1; bell.visible = !!R.stop;
      const list = K.shuffle(S.items), x0 = world.left + FR + 10, x1 = Math.max(x0 + 20, (land ? mx - 190 : world.right) - FR - 10);
      list.forEach((f, i) => drop(f, x0 + ((i + 0.5) / list.length) * (x1 - x0) + (Math.random() - 0.5) * 30, 150 + i * 110));
      K.sfx.whoosh(); m.cheer = 0.5;
      ctx.prompt(S.prompt, { show: S.show, who: WHO });
    }
    function arrive(o) {
      m.openT = 0; m.lookAt = null;
      if (o.round !== R || R.over) { spit(o); return; }
      const f = o.f;
      if (!R.want(f)) {
        R.misses++; m.bleh = 0.9; K.sfx.whoops(); sfx.bleh(); spit(o);
        const line = f.silly ? T.silly(f, K.randInt(0, 2)) : R.kind === 'color' && f.color ? T.notColor(f) : T.notThat(f);
        mSay(line + ' ' + R.again);
        if (R.misses >= 2) { if (!R.reveal && (R.kind === 'pick' || R.kind === 'color')) { R.reveal = true; bub.pop = 1; } for (const x of foods) if (R.want(x.f)) x.pulse = true; }
        return;
      }
      unpile(o); o.node.remove();
      if (R.stop) for (const x of foods) x.pulse = false;   // the "which food" hint must not turn into "keep going"
      R.fed++;
      sfx.chomp(); K.sfx.step(R.fed - 1); m.chew = 0.9; ctx.fx.burst(mouth.x, mouth.y, { n: 8 });
      m.belly = Math.min(R.fed, 10) / 10; lastAct = performance.now();
      if (R.fill) bub.pop = 0.6;
      if (R.stop) ctx.say(T.count(R.fed));   // count along; stopping is the child's call
      else if (R.fed >= R.need) finish();
      else ctx.say(T.count(R.fed));
      restock();
    }
    async function ring() {
      if (!R || !R.stop || R.over || R.busy) return;
      const r = R; lastAct = performance.now();
      K.sfx.note(1319, 0.5); K.sfx.note(1760, 0.7);
      if (r.fed === r.need) { finish(); return; }
      r.busy = true;
      if (r.fed > r.need) {   // too many is funny, never bad: a big burp, and a new order
        r.over = true; sfx.burp(); m.cheer = 1.1; ctx.fx.burst(mx, my - 90 * ms, { n: 14 });
        await Promise.all([mSay(T.had(r.fed) + ' ' + T.only(r.need)), ctx.wait(2400)]);
        clearPile(); await ctx.wait(1500); newRound(); return;
      }
      m.bleh = 0.6; K.sfx.whoops();
      await Promise.all([mSay(r.fed ? `${T.had(r.fed)} ${T.more} ${r.howMany}` : `${T.hungry} ${r.again} ${r.howMany}`), ctx.wait(1200)]);
      r.busy = false; lastAct = performance.now();
    }
    function clearPile() { for (const o of foods.slice()) { unpile(o); o.busy = true; o.node.to({ sx: 0, sy: 0 }, { dur: 0.25, ease: 'inOut' }).then(() => o.node.remove()); } }
    async function finish() {
      const r = R; r.over = true;
      for (const x of foods) x.pulse = false;
      if (!r.reveal && (r.kind === 'pick' || r.kind === 'color')) { r.reveal = true; bub.pop = 1; }
      await ctx.wait(650);
      sfx.burp(); m.cheer = 1.1; ctx.fx.burst(mx, my - 90 * ms, { n: 14 });
      ctx.after(250, () => K.sfx.sparkle());
      await Promise.all([mSay(r.done), ctx.wait(2100)]);
      won++; cookieJar.pop = 1; K.sfx.ding();
      await ctx.wait(900);
      clearPile();
      await ctx.wait(600);
      if (won >= ROUNDS) { await ctx.celebrate({ ms: 3600 }); won = 0; }
      newRound();
    }
    // if food has gone in and nothing has happened for a while, the bell gives a little wave
    ctx.every(2500, () => { if (R && R.stop && !R.over && !R.busy && R.fed > 0 && performance.now() - lastAct > 7000) { bell.press(); K.sfx.tap(); } });

    st.onframe = (dt) => {
      world.step(dt);
      monsterFrame(dt);
      jar.shake = Math.max(0, jar.shake - dt); jar.spin = Math.max(0, jar.spin - dt);
      jar.level += (jar.levelT - jar.level) * Math.min(1, dt * (jar.levelT > jar.level ? 2.5 : 1.6));
      for (const o of foods) {
        const b = o.body;
        if (b.thrown && !o.busy && !b.held) {
          if (Math.hypot(b.x - mouth.x, b.y - mouth.y) < eatR * 0.85) toMouth(o, 0.12);
          else if (b.vy > 0 && inJarZone(b)) intoJar(o);
          else if (b.ground && Math.abs(b.vx) < 80) b.thrown = false;
        }
      }
    };
    K._kitchen = { get R() { return R; }, foods, jar, mouth, world, get won() { return won; } }; // for browser tests
    ctx.onExit(() => { K._kitchen = null; });
    ctx.after(350, newRound);
  }

  K.game({ id: 'kitchen', title: 'Monster Kitchen', voice: 'feed', group: 'play', order: 1, start, lines, resize: () => K.go('kitchen') });
})();
