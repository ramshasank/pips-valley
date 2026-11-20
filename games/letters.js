/* Letter Monsters — letters that are little creatures, and words that come alive.
   Meet: a handful of letter monsters live in the meadow. Tap one and it hops and says its name
   and what it is for; pick one up and it dangles, let go and it drops with a bounce. The arrow
   brings the next few letters, so all 26 come round.
   Build: a picture card shows a three-letter thing. The letters it needs wait on the grass. Tap
   or drag one to the little hill: the right letter hops into its place, any other shakes its head
   and hops home. When the word is whole the letters say themselves in order, hug, and the picture
   climbs off its card (the cat walks away, the sun rises, the egg hatches).
   Trace: a big letter waits on a drawing board, capital first and then the small one. A paper
   fingertip shows each stroke before the child tries; a finger anywhere near the line lays down
   thick paint along it (lift and carry on whenever you like). When both are painted the small
   letter climbs off the paper as its monster.
   In every mode the paper fingertip shows the move again after a quiet spell, so the toy can be
   played with the sound off. Nothing can be failed. Words built, letters met and letters traced
   are remembered per child.

   Spoken lines reuse the ones Letters and ABC Match already had recorded. */
(function () {
  'use strict';
  const A = K.art, Lt = A.letters;
  const ABC = 'abcdefghijklmnopqrstuvwxyz';
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  const isFor = (l) => `${l} is for ${K.data.abc[l.toUpperCase()][1]}.`;
  const SAY = { meet: 'Tap a letter!', trace: (l) => `Trace the letter ${l}!`, ask: (w) => `${cap(w)}! What letter does it start with?`, word: (w) => `${cap(w)}!`, starts: (w) => `${cap(w)} starts with ${w[0]}.` };
  const lines = () => [SAY.meet, ...ABC.split('').flatMap((l) => [`${l}.`, isFor(l), SAY.trace(l)]), ...Lt.WORDS.flatMap((x) => [SAY.ask(x.w), SAY.word(x.w), SAY.starts(x.w)])];

  function start(st, ctx) {
    const W = st.W, H = st.H, port = W < 1000, L = ctx.level || 1;
    const G = port ? H - 170 : 880;                       // where feet meet the grass
    const cx = W / 2;
    const store = (K.s.done.letters = K.s.done.letters || {}); store.words = store.words || {}; store.met = store.met || {}; store.traced = store.traced || {};
    K.preloadVoice('abc'); K.preloadVoice('sounds');
    let mode = null, busy = false, ptr = null, sayTok = 0, built = 0, gen = 0;
    const mons = [];

    const bgKey = 'meadowL' + Math.round(W) + 'x' + Math.round(H);
    const bg = st.add({ z: 0, sprite: A.sprite(bgKey, [0, 0, W, H], (g, s) => Lt.meadow(g, s, W, H, G)) });
    const bgBuild = () => A.sprite(bgKey + 'm', [0, 0, W, H], (g, s) => Lt.meadow(g, s, W, H, G, { x: cx, y: slotY, w: slotW * 3 + 30, n: 3 }));
    const bgMeet = bg.sprite;
    /* ---------------- the wordless hint: a paper fingertip shows the move ----------------
       hintFn() returns {tap: {x, y}} | {drag: [from, to]} | {path: [[x, y], …]} in screen units, or null. */
    let hintFn = null, quiet = 0, firstHint = true, hintMon = null, hintOn = false;
    const fresh = (lead) => { quiet = -(lead || 0); firstHint = true; };
    const hand = st.add({ ui: true, z: 96 });
    hand.update = (dt) => { quiet += dt; };
    hand.draw = (g, s) => {
      hintOn = false;
      const lead = firstHint ? 1.3 : 4.5; if (busy || !hintFn || quiet < lead) return;
      const h = hintFn(); if (!h) return;
      let len = 0; if (h.path) for (let i = 1; i < h.path.length; i++) len += Math.hypot(h.path[i][0] - h.path[i - 1][0], h.path[i][1] - h.path[i - 1][1]);
      const cyc = h.tap ? 1.5 : h.drag ? 2.3 : 1.1 + len / 420, t = (quiet - lead) % (cyc * 2 + 3.5);
      if (t > cyc * 2) return;                       // show the move twice, then rest
      hintOn = true;
      const u = (t % cyc) / cyc; let x, y, press = 1, a = Math.min(1, u * 8, (1 - u) * 8);
      if (h.tap) { x = h.tap.x; y = h.tap.y; press = u > 0.35 && u < 0.6 ? 1 : 0; if (u > 0.4 && u < 0.85) { const r = (u - 0.4) / 0.45; g.beginPath(); g.arc(x, y, 20 + r * 50, 0, 7); g.strokeStyle = `rgba(255,255,255,${0.9 * (1 - r)})`; g.lineWidth = 7; g.stroke(); } }
      else if (h.drag) { const [p0, p1] = h.drag, r = K.clamp((u - 0.25) / 0.5, 0, 1), e = r * r * (3 - 2 * r); x = p0.x + (p1.x - p0.x) * e; y = p0.y + (p1.y - p0.y) * e - Math.sin(e * Math.PI) * 60; press = u > 0.12 && u < 0.86 ? 1 : 0; }
      else { const r = K.clamp((u - 0.15) / 0.7, 0, 1) * len; let acc = 0; x = h.path[0][0]; y = h.path[0][1]; for (let i = 1; i < h.path.length; i++) { const d = Math.hypot(h.path[i][0] - h.path[i - 1][0], h.path[i][1] - h.path[i - 1][1]); if (acc + d >= r) { const k = d ? (r - acc) / d : 0; x = h.path[i - 1][0] + (h.path[i][0] - h.path[i - 1][0]) * k; y = h.path[i - 1][1] + (h.path[i][1] - h.path[i - 1][1]) * k; break; } acc += d; x = h.path[i][0]; y = h.path[i][1]; } press = u > 0.08 && u < 0.92 ? 1 : 0; }
      g.save(); g.globalAlpha = a; g.translate(x, y); const q = port ? 0.95 : 1.15; g.scale(q, q); Lt.finger(g, s, press); g.restore();
    };
    st.ondown = (p) => { ptr = p; quiet = 0; firstHint = false; }; st.onmove = (p, e, s) => { if (s || e.pointerType === 'mouse') ptr = p; };

    /* ---------------- a letter monster ---------------- */
    function monster(ch, x, y, F) {
      const hgt = Lt.height(ch, F), m = Lt.metrics(ch), hw = Math.max(58, ((m.r - m.l) * F) / 2 + 14);
      const n = st.add({ z: 30, x, y, ch, F, hgt, label: 'letter ' + ch, hit: { x: -hw, y: -hgt - 6, w: hw * 2, h: hgt + 22 }, pad: 10, pressable: false,
        vy: 0, squash: 0, sqv: 0, blinkT: 1 + Math.random() * 3, blink: 0, talkT: 0, shakeT: 0, happy: false, held: false, floor: y, home: { x, y }, slot: -1, j: null });
      n.draw = (g) => {
        let lx = 0, ly = 0;
        if (ptr) { const dx = ptr.x - n.x, dy = ptr.y - (n.y - hgt * 0.6), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160); lx = (dx / d) * k; ly = (dy / d) * k; }
        Lt.monster(g, st.res, ch, F, { air: n.leaving ? 0 : Math.min(600, n.floor - n.y), blink: n.blink, lookX: lx, lookY: ly, squash: n.squash + (hintOn && hintMon === n ? Math.sin(st.t * 8) * 0.035 : 0), happy: n.happy || n.held,
          open: n.talkT > 0 ? 0.55 + 0.45 * Math.sin(st.t * 19) : n.held ? 0.5 : 0, shake: n.shakeT > 0 ? Math.sin(n.shakeT * 26) * 0.16 * Math.min(1, n.shakeT * 3) : n.held ? Math.sin(st.t * 7) * 0.07 : 0 });
        if (n.hat) { g.save(); g.translate(0, -hgt + 16 - n.squash * hgt); g.scale(0.62, 0.62); n.hat(g, st.res, st.t, true); g.restore(); }
      };
      n.update = (dt) => {
        n.talkT -= dt; n.shakeT = Math.max(0, n.shakeT - dt);
        n.blinkT -= dt; if (n.blinkT < 0) n.blinkT = 2 + Math.random() * 3.5; n.blink = n.blinkT < 0.14 ? Math.sin((n.blinkT / 0.14) * Math.PI) : 0;
        n.sqv += (-n.squash * 300 - n.sqv * 15) * dt; n.squash = K.clamp(n.squash + n.sqv * dt, -0.3, 0.3);
        if (n.held) { const k = Math.min(1, dt * 24); n.x += (n.tx - n.x) * k; n.y += (n.ty - n.y) * k; n.squash += (0.08 - n.squash) * k * 0.5; return; }
        if (n.j) {
          const j = n.j; j.t += dt; if (j.t < 0) return;
          const p = Math.min(1, j.t / j.dur);
          n.x = j.x0 + (j.x1 - j.x0) * p; n.y = j.y0 + (j.y1 - j.y0) * p - j.h * 4 * p * (1 - p);
          if (p >= 1) { n.j = null; n.vy = 0; n.squash = -0.2; n.sqv = 0; thud(); j.res(); }
          return;
        }
        if (n.y < n.floor || n.vy < 0) {
          n.vy += 3200 * dt; n.y += n.vy * dt;
          if (n.y >= n.floor) { n.y = n.floor; n.squash = -Math.min(0.28, n.vy / 4200); n.sqv = 0; thud(); n.vy = n.vy > 500 ? -n.vy * 0.32 : 0; }
        } else n.y = n.floor;
      };
      /** Hop to a place along an arc. */
      n.jump = (x, y, o) => new Promise((res) => {
        o = o || {}; if (n.j) n.j.res();
        n.j = { x0: n.x, y0: n.y, x1: x, y1: y, h: o.h == null ? 110 : o.h, t: -(o.delay || 0), dur: o.dur || 0.42, res };
        if (!o.delay) { n.squash = 0.14; n.sqv = 0; }
      });
      n.talk = (sec) => { n.talkT = sec; };
      n.lift = (z) => { n.z = z; n.parent._sorted = false; };
      n.onDown = (p) => { if (busy || n.j || n.leaving) return; n.grab = { dx: n.x - p.x, dy: n.y - p.y }; };
      n.onMove = (p, e, s) => {
        if (!n.grab) return;
        if (!n.held && s.moved > 18) { n.held = true; n.lift(60); K.sfx.tone(320, 0.1, { to: 520, vol: 0.14 }); }
        if (n.held) { n.tx = K.clamp(p.x, 50, W - 50); n.ty = Math.min(G + 60, p.y + hgt * 0.5); }
      };
      n.onUp = () => { if (!n.grab) return; n.grab = null; if (!n.held) return; n.held = false; n.lift(30); n.vy = 0; dropped(n); };
      n.onTap = () => { if (busy || n.held || n.leaving) return; tapped(n); };
      mons.push(n);
      return n;
    }
    const thud = () => K.sfx.tone(150, 0.08, { to: 80, vol: 0.16 });
    const boing = () => K.sfx.tone(300, 0.14, { to: 560, type: 'sine', vol: 0.16 });
    function leave(list, dir) {
      list.forEach((n, i) => { n.leaving = true; const k = mons.indexOf(n); if (k >= 0) mons.splice(k, 1); n.floor = 1e5; n.jump(dir > 0 ? W + 220 : -220, G, { h: 170, dur: 0.55, delay: i * 0.07 }).then(() => n.remove()); });
    }
    function speak(n, list) {
      const tok = ++sayTok; let p = Promise.resolve();
      list.forEach((t) => { p = p.then(() => { if (tok !== sayTok || !ctx.alive) return null; n.talk(0.5 + t.length * 0.055); return K.say(t); }); });
      return p.then(() => { n.talkT = Math.min(n.talkT, 0.1); });
    }

    /* ---------------- meet the letters ---------------- */
    const perPage = port ? 4 : 5, pages = Math.ceil(26 / perPage), FM = port ? 158 : 230;
    function pageLetters(pg) { const out = []; for (let i = 0; i < perPage; i++) out.push(ABC[(pg * perPage + i) % 26]); return out; }
    function showPage(dir) {
      leave(mons.slice(), dir || 1);
      const ls = pageLetters(store.page || 0), x0 = port ? 82 : 200, x1 = W - (port ? 82 : 240);
      ls.forEach((ch, i) => {
        const x = x0 + ((x1 - x0) * i) / (ls.length - 1), y = G + (i % 2 ? 26 : 0);
        const n = monster(ch, -160 - i * 30, y, FM); n.floor = y; n.home = { x, y };
        n.jump(x, y, { h: 190, dur: 0.6, delay: 0.25 + i * 0.12 });
      });
      fresh(1);
      hintFn = () => { const n = mons.find((m) => !store.met[m.ch] && !m.j && !m.held && !m.leaving) || mons.find((m) => !m.j && !m.held && !m.leaving); hintMon = n; return n ? { tap: { x: n.x, y: n.y - n.hgt * 0.45 } } : null; };
    }
    function wander() {
      if (mode !== 'meet' || busy) return;
      const idle = mons.filter((n) => !n.held && !n.j && !n.grab && n.y >= n.floor && n.talkT <= 0);
      if (!idle.length) return;
      const n = K.pick(idle), x = K.clamp(n.home.x + K.rand(-46, 46), 70, W - 70);
      n.jump(x, n.floor, { h: 46, dur: 0.34 });
    }
    ctx.every(2300, wander);

    /* ---------------- build a word ---------------- */
    const FB = port ? (L === 1 ? 158 : 128) : 170, slotW = port ? (L === 1 ? 172 : 142) : 186, slotY = port ? G - 320 : 640;
    const cardW = port ? 280 : 360, cardH = port ? 290 : 340, cardY = port ? 268 + cardH / 2 : 122 + cardH / 2;
    const slotX = (i) => cx + (i - 1) * slotW;
    let word = null, slots = [], pic = null;
    const card = st.add({ z: 10, x: cx, y: -400, visible: false, hit: { x: -cardW / 2, y: -cardH / 2, w: cardW, h: cardH }, pad: 0, label: 'picture' });
    card.draw = (g, s) => { const sp = A.sprite('lcard' + cardW + (word ? word.tint : ''), [-cardW / 2 - 12, -cardH / 2 - 24, cardW + 24, cardH + 44], (h, r) => Lt.card(h, r, cardW, cardH, word && word.tint)); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); };
    card.onTap = () => { if (busy || !word) return; K.sfx.pop(); if (pic) { pic.sq = 0.16; } K.say(SAY.word(word.w)); };
    const step = st.add({ z: 12, x: cx, y: slotY, visible: false, alpha: 0 });
    step.draw = (g) => {
      if (!word || L > 2) return;
      const next = slots.findIndex((x) => !x);
      for (let i = 0; i < 3; i++) if (!slots[i] && (L === 1 || i === next)) { g.save(); g.translate((i - 1) * slotW, sink(word.w[i])); Lt.monster(g, st.res, word.w[i], FB, { ghost: i === next ? 0.5 + 0.12 * Math.sin(st.t * 4) : 0.26, color: '#FFFFFF' }); g.restore(); }
    };
    /** Letters with tails hang them over the edge, so the word sits on one line. */
    const sink = (ch) => { const d = Lt.metrics(ch).bot * FB; return d > FB * 0.06 ? d : 0; };
    const TINTS = ['#DCEBE6', '#F3E3C8', '#E3E0F0', '#F5DCD6', '#DDE9C9'];
    function newPic() {
      if (pic) pic.remove();
      const ps = (cardH - 96) / 170;
      pic = st.add({ z: 14, x: card.x, y: card.y, sx: ps, sy: ps, alive: 0, sq: 0, base: ps, dy: cardH / 2 - 46 });
      const w = word;
      pic.draw = (g) => { g.save(); g.scale(1 + pic.sq * 0.6, 1 - pic.sq); w.draw(g, st.res, st.t, pic.alive); g.restore(); };
      pic.update = (dt) => { pic.sq += (0 - pic.sq) * Math.min(1, dt * 9); if (!pic.free) { pic.x = card.x; pic.y = card.y + pic.dy; } };
    }
    function nextWord(skipCurrent) {
      const order = Lt.WORDS, undone = order.filter((x) => !store.words[x.w] && x !== word), my = gen;
      const nx = skipCurrent && word ? order[(order.indexOf(word) + 1) % order.length] : undone.length ? undone[0] : K.pick(order.filter((x) => x !== word));
      busy = true; leave(mons.slice(), 1);
      const swap = () => {
        if (my !== gen) return null;
        word = nx; word.tint = TINTS[order.indexOf(nx) % TINTS.length]; slots = [null, null, null]; newPic();
        card.visible = true; step.visible = true; step.to({ alpha: 1 }, { dur: 0.3 });
        K.sfx.whoosh();
        return card.to({ y: cardY }, { dur: 0.55, ease: 'back' });
      };
      let out = Promise.resolve();
      if (card.visible && card.y > 0) { if (pic) pic.to({ alpha: 0 }, { dur: 0.2 }); out = card.to({ y: -420 }, { dur: 0.3, ease: 'inOut' }); }
      out.then(swap).then(() => {
        if (my !== gen) return;
        const extra = K.sample(ABC.split('').filter((c) => !word.w.includes(c) && !'qxz'.includes(c)), L === 1 ? 0 : L === 2 ? 1 : 2);
        let ls = K.shuffle(word.w.split('').concat(extra));
        if (ls.join('') === word.w) ls = ls.slice(1).concat(ls[0]);  // never hand the word over already spelled
        const gap = Math.min(port ? 130 : 200, (W - 70) / ls.length), x0 = cx - (gap * (ls.length - 1)) / 2;
        ls.forEach((ch, i) => { const x = x0 + i * gap, y = G + (i % 2 ? 24 : 0); const n = monster(ch, -150 - i * 30, y, FB); n.floor = y; n.home = { x, y }; n.jump(x, y, { h: 170, dur: 0.55, delay: i * 0.1 }); });
        busy = false; fresh(0.8);
        hintFn = () => { const i = slots.findIndex((x) => !x); if (!word || i < 0) return null; const n = mons.find((m) => m.slot < 0 && m.ch === word.w[i] && !m.j && !m.held && !m.leaving); hintMon = n; return n ? { drag: [{ x: n.x, y: n.y - n.hgt * 0.45 }, { x: slotX(i), y: slotY - 70 }] } : null; };
        ctx.prompt(SAY.ask(word.w), port ? { show: SAY.word(word.w) } : null);
      });
    }
    function place(n, i) {
      const sy = slotY + sink(n.ch); slots[i] = n; n.slot = i; n.floor = sy; n.home = { x: slotX(i), y: sy }; n.lift(31 + i);
      boing();
      n.jump(slotX(i), sy, { h: n.y > slotY + 40 ? 150 : 70, dur: 0.42 }).then(() => {
        K.sfx.step(i + 2); ctx.fx.burst(n.x, n.y - n.hgt * 0.6, { n: 7 });
        if (slots.every(Boolean)) complete(); else speak(n, [`${n.ch}.`]);
      });
    }
    const wants = (ch) => { for (let i = 0; i < 3; i++) if (!slots[i] && word.w[i] === ch) return i; return -1; };
    function nope(n) {
      K.sfx.whoops(); n.shakeT = 0.6;
      ctx.after(430, () => { if (!n.leaving && n.slot < 0) { n.floor = n.home.y; n.jump(n.home.x, n.home.y, { h: 90 }); } });
    }
    async function complete() {
      busy = true; built++;
      const w = word, team = slots.slice(), my = gen;
      await ctx.wait(450); if (my !== gen) return;
      for (const n of team) { n.jump(n.x, n.floor, { h: 54, dur: 0.3 }); boing(); n.talk(0.5); await Promise.all([ctx.say(`${n.ch}.`), ctx.wait(620)]); n.talkT = 0; if (my !== gen) return; }
      team.forEach((n, i) => { n.happy = true; n.jump(slotX(i) - (i - 1) * slotW * 0.14, n.floor, { h: 40, dur: 0.3 }); });   // hug
      K.sfx.sparkle(); ctx.fx.burst(cx, slotY - 90, { n: 22 });
      store.words[w.w] = 1; K.save(); ctx.prompt(SAY.word(w.w), { silent: true });
      team.forEach((n) => n.talk(0.8));
      await Promise.all([ctx.say(SAY.word(w.w)), ctx.wait(900)]); if (my !== gen) return;
      await alive(w, team); if (my !== gen) return;
      await Promise.all([ctx.say(SAY.starts(w.w)), ctx.wait(700)]); if (my !== gen) return;
      if (built % 3 === 0) await ctx.celebrate();
      if (my === gen) nextWord();
    }
    /** The picture climbs off its card. */
    async function alive(w, team) {
      const p = pic; p.free = true; p.z = 40; p.parent._sorted = false; p.sq = -0.2; K.sfx.pop();
      ctx.fx.burst(p.x, p.y - 90, { n: 14 });
      const hopTo = (x, y, h, dur) => new Promise((res) => { const x0 = p.x, y0 = p.y; let t = 0; p.hop = (dt) => { t += dt; const q = Math.min(1, t / dur); p.x = x0 + (x - x0) * q; p.y = y0 + (y - y0) * q - h * 4 * q * (1 - q); if (q >= 1) { p.hop = null; p.sq = 0.2; thud(); res(); } }; });
      const up = p.update; p.update = (dt) => { up(dt); if (p.hop) p.hop(dt); };
      const big = p.base * (port ? 1.05 : 1.2), gy = G + 70;
      if (w.act === 'walk') {
        p.alive = 1; p.to({ sx: big, sy: big }, { dur: 0.4 });
        await hopTo(cx - (port ? 120 : 260), gy, 200, 0.6);
        await ctx.wait(350);
        while (p.x < W + 160 && ctx.alive) { boing(); await hopTo(p.x + 150, gy, 70, 0.3); }
      } else if (w.act === 'drive') {
        p.to({ sx: big, sy: big }, { dur: 0.4 });
        await hopTo(cx - (port ? 130 : 300), gy, 180, 0.55);
        p.alive = 1; K.sfx.tone(392, 0.16, { type: 'square', vol: 0.09 }); K.sfx.tone(392, 0.3, { type: 'square', vol: 0.09, delay: 0.22 });
        await ctx.wait(650);
        for (let i = 0; i < 8; i++) K.sfx.tone(90 + i * 6, 0.16, { type: 'sawtooth', vol: 0.05, delay: i * 0.13 });
        await p.to({ x: W + 320 }, { dur: 1.3, ease: 'inOut' });
      } else if (w.act === 'rise') {
        p.alive = 1; [523, 659, 784, 1047].forEach((f, i) => K.sfx.tone(f, 0.5, { type: 'sine', vol: 0.12, delay: i * 0.22 }));
        p.to({ sx: big, sy: big }, { dur: 1.4 });
        await p.to({ y: (port ? 250 : 126) + 180 * big, x: port ? cx : cx - 410 }, { dur: 1.4, ease: 'inOut' });   // up into the sky, clear of the caption
        ctx.fx.burst(p.x, p.y - 90, { n: 20, colors: ['#F7CF5E', '#F2A93B', '#FFF3C4'] });
        await ctx.wait(1100);
      } else if (w.act === 'fly') {
        p.alive = 1; for (let i = 0; i < 9; i++) K.sfx.noise(0.07, { freq: 500, vol: 0.1, delay: i * 0.17 });
        K.sfx.tone(520, 0.3, { to: 400, vol: 0.14 }); K.sfx.tone(440, 0.4, { to: 340, vol: 0.14, delay: 0.4 });
        await p.to({ x: cx - (port ? 150 : 330), y: slotY - 120 }, { dur: 0.7, ease: 'inOut' });
        await p.to({ x: cx + (port ? 150 : 330), y: slotY - 220 }, { dur: 0.8, ease: 'inOut' });
        await p.to({ x: W + 200, y: 120 }, { dur: 0.8, ease: 'inOut' });
      } else if (w.act === 'wear') {
        const m = team[1];
        await hopTo(m.x, m.y - m.hgt + 16, 190, 0.55);
        p.visible = false; m.hat = w.draw; m.squash = -0.22; ctx.fx.burst(m.x, m.y - m.hgt, { n: 12 });
        for (let i = 0; i < 3; i++) { boing(); await m.jump(m.x, m.floor, { h: 80, dur: 0.36 }); }
        await ctx.wait(300);
      } else if (w.act === 'hatch') {
        const t0 = st.t; let cracked = false;
        const tick = p.update; p.update = (dt) => { tick(dt); p.alive = Math.min(1, Math.max(0.02, (st.t - t0) / 1.9)); if (!cracked && p.alive >= 0.5) { cracked = true; K.sfx.noise(0.12, { freq: 2600, vol: 0.3 }); K.sfx.pop(); ctx.fx.burst(p.x, p.y - 110, { n: 14, colors: ['#FBF3E2', '#F7D55C'] }); } };
        for (let i = 0; i < 5; i++) K.sfx.noise(0.04, { freq: 3000, vol: 0.18, delay: 0.15 + i * 0.16 });
        await ctx.wait(2100);
        for (let i = 0; i < 3; i++) K.sfx.tone(1900, 0.09, { to: 2500, vol: 0.12, delay: i * 0.2 });
        await ctx.wait(900);
      }
    }
    function tapped(n) {
      if (mode === 'meet') {
        boing(); n.jump(n.x, n.floor, { h: port ? 170 : 230, dur: 0.56 }); ctx.fx.burst(n.x, n.y - n.hgt, { n: 6 });
        store.met[n.ch] = 1; K.save();
        speak(n, [`${n.ch}.`, isFor(n.ch)]);
        return;
      }
      if (n.slot >= 0) { boing(); n.jump(n.x, n.floor, { h: 60, dur: 0.3 }); speak(n, [`${n.ch}.`]); return; }
      const i = wants(n.ch);
      if (i >= 0) place(n, i); else nope(n);
    }
    function dropped(n) {
      if (mode === 'meet') { n.floor = G + (n.y > G + 10 ? 26 : 0); n.home = { x: n.x, y: n.floor }; return; }
      if (n.slot >= 0) { n.jump(slotX(n.slot), n.floor, { h: 60 }); return; }
      const near = Math.abs(n.y - n.hgt * 0.5 - (slotY - 60)) < 190 && Math.abs(n.x - cx) < slotW * 1.5 + 90;
      const i = wants(n.ch), lifted = n.y < G - 90 || Math.hypot(n.x - n.home.x, n.y - n.home.y) > 150;   // any real carry counts
      if (i >= 0 && (near || lifted)) place(n, i);
      else if (near) nope(n);
      else { n.floor = n.home.y; n.jump(n.home.x, n.home.y, { h: 80 }); }
    }

    /* ---------------- trace a letter ---------------- */
    const TP = port ? Math.min(W - 70, H - 730) : Math.min(H - 270, 640, W - 520), tbx = cx - TP / 2, tby = port ? 276 : 150;
    const tpad = TP * 0.15, tsc = TP - tpad * 2, FT = port ? 170 : 230;
    let tr = null, traced = 0;
    const board = st.add({ z: 20, x: tbx, y: -TP - 120, visible: false, hit: { x: 0, y: 0, w: TP, h: TP }, pad: 40, pressable: false, label: 'paper' });
    const seg = (g, pts, a, b) => { if (b <= a) return; g.beginPath(); g.moveTo(pts[a][0], pts[a][1]); for (let i = a + 1; i < b; i++) g.lineTo(pts[i][0], pts[i][1]); if (b - a < 2) g.lineTo(pts[a][0] + 0.01, pts[a][1] + 0.01); g.stroke(); };
    const dot = (g, x, y, r, n, fill, ink) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); g.strokeStyle = ink; g.lineWidth = Math.max(3, r * 0.16); g.stroke(); g.fillStyle = ink; g.font = `700 ${Math.round(r * 1.25)}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x, y + r * 0.08); };
    board.draw = (g, s) => {
      const sp = A.sprite('lboard' + Math.round(TP), [-44, -56, TP + 88, TP + 120], (h, r) => Lt.board(h, r, TP)); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
      if (!tr) return;
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      if (tr.mini) { g.save(); g.translate(TP * 0.045, TP * 0.035); g.scale(0.2, 0.2); g.strokeStyle = tr.col; g.lineWidth = TP * 0.12; tr.mini.forEach((p) => seg(g, p, 0, p.length)); g.restore(); }
      g.globalAlpha = tr.fade;
      g.strokeStyle = '#E8E0D0'; g.lineWidth = tr.tw; tr.pts.forEach((p) => seg(g, p, 0, p.length));
      tr.pts.forEach((p, i) => {
        const n = i < tr.si ? p.length : i === tr.si ? Math.min(p.length, Math.ceil(tr.show)) : 0; if (n <= 0) return;
        g.strokeStyle = tr.col; g.lineWidth = tr.tw * (0.84 + (i === tr.pop ? tr.popT * 0.22 : 0)); seg(g, p, 0, n);
        g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = tr.tw * 0.22; g.save(); g.translate(-tr.tw * 0.16, -tr.tw * 0.16); seg(g, p, 0, n); g.restore();
      });
      const cur = tr.pts[tr.si];
      if (cur && !tr.lock) {
        const c0 = Math.min(cur.length - 1, tr.ci), e = cur[cur.length - 1];
        if (cur.length - c0 > 3) {
          g.setLineDash([1, 17]); g.strokeStyle = 'rgba(46,42,59,.5)'; g.lineWidth = 7; seg(g, cur, c0, cur.length - 1); g.setLineDash([]);
          const b = cur[Math.max(0, cur.length - 4)], an = Math.atan2(e[1] - b[1], e[0] - b[0]);
          g.save(); g.translate(e[0], e[1]); g.rotate(an); g.beginPath(); g.moveTo(15, 0); g.lineTo(-11, -15); g.lineTo(-11, 15); g.closePath(); g.fillStyle = 'rgba(46,42,59,.6)'; g.fill(); g.restore();
        }
        for (let i = tr.pts.length - 1; i > tr.si; i--) dot(g, tr.pts[i][0][0], tr.pts[i][0][1], tr.tw * 0.26, i + 1, '#FBF6EC', 'rgba(46,42,59,.4)');
        const h = cur[c0], k = 1 + Math.sin(st.t * 5) * 0.09;
        g.beginPath(); g.arc(h[0], h[1], tr.tw * 0.62 * k, 0, 7); g.fillStyle = A.alpha(tr.col, 0.25); g.fill();
        dot(g, h[0], h[1], tr.tw * 0.4 * k, tr.si + 1, '#FFFFFF', tr.col);
      }
      g.restore();
    };
    board.update = (dt) => { if (!tr) return; tr.show += (tr.ci - tr.show) * Math.min(1, dt * 20); tr.popT = Math.max(0, tr.popT - dt * 3); tr.fade += ((tr.fadeTo) - tr.fade) * Math.min(1, dt * 10); };
    function setGlyph(stage) {
      const low = stage === 1, k = low ? 1.25 : 1;
      const map = (key, kk) => Lt.glyph(key).map((p) => p.map((q) => [tpad + (0.5 + (q[0] - 0.5) * kk) * tsc, tpad + (0.52 + (q[1] - 0.52) * kk) * tsc]));
      tr.stage = stage; tr.pts = map(low ? tr.ch : tr.ch.toUpperCase(), k); tr.mini = low ? map(tr.ch.toUpperCase(), 1) : null;
      tr.tw = TP * (low ? 0.105 : 0.12); tr.si = 0; tr.ci = 0; tr.show = 0; tr.pop = -1; tr.popT = 0; tr.lock = false; tr.fade = 0; tr.fadeTo = 1; tr.tone = 0;
      fresh(0.4);
    }
    function startTrace(ch) {
      const my = gen; busy = true; leave(mons.slice(), 1);
      tr = { ch, col: Lt.color(ch) }; setGlyph(0); tr.lock = true;
      hintFn = () => { if (!tr || tr.lock) return null; const cur = tr.pts[tr.si]; if (!cur) return null; const c0 = Math.min(cur.length - 1, tr.ci), pts = cur.slice(c0).map((q) => [board.x + q[0], board.y + q[1]]); return pts.length < 4 ? { tap: { x: pts[0][0], y: pts[0][1] } } : { path: pts }; };
      const ready = () => { if (my !== gen) return; busy = false; tr.lock = false; fresh(0.3); ctx.prompt(SAY.trace(ch), { show: `${ch.toUpperCase()} ${ch}` }); };
      if (!board.visible || board.y < 0) { board.visible = true; K.sfx.whoosh(); board.to({ y: tby }, { dur: 0.5, ease: 'back' }).then(ready); } else ready();
    }
    function nextTrace(skip) {
      const i = tr ? ABC.indexOf(tr.ch) : -1; let ch = null;
      if (!skip) for (let k = 1; k <= 26 && !ch; k++) { const c = ABC[(i + k + 26) % 26]; if (!store.traced[c]) ch = c; }
      startTrace(ch || ABC[(i + 1) % 26]);
    }
    function traceAt(p) {
      if (mode !== 'trace' || !tr || tr.lock || busy) return; const cur = tr.pts[tr.si]; if (!cur) return;
      const qx = p.x - board.x, qy = p.y - board.y, R = TP * 0.17, ahead = Math.max(8, Math.round(cur.length * 0.22));
      let best = -1, bd = R * R;
      for (let j = Math.max(0, tr.ci - 1); j < cur.length && j <= tr.ci + ahead; j++) { const d = (cur[j][0] - qx) ** 2 + (cur[j][1] - qy) ** 2; if (d <= bd) { bd = d; best = j; } }
      if (best < 0 || best + 2 <= tr.ci) return;
      tr.ci = Math.min(cur.length, best + 2);
      if (st.t - tr.tone > 0.07) { tr.tone = st.t; K.sfx.tone(300 + (tr.ci / cur.length) * 360, 0.09, { vol: 0.08 }); }
      if (tr.ci >= cur.length - 1) strokeDone();
    }
    function strokeDone() {
      const cur = tr.pts[tr.si], e = cur[cur.length - 1];
      tr.pop = tr.si; tr.popT = 1; K.sfx.step(tr.si + 2); ctx.fx.burst(board.x + e[0], board.y + e[1], { n: 9, colors: [tr.col, '#FFFFFF', '#F7CF5E'] });
      tr.si++; tr.ci = 0; tr.show = 0; fresh(0.5);
      if (tr.si >= tr.pts.length) glyphDone();
    }
    async function glyphDone() {
      const my = gen, t = tr; t.lock = true;
      K.sfx.sparkle(); ctx.fx.burst(board.x + TP / 2, board.y + TP / 2, { n: 18 });
      await ctx.wait(800); if (my !== gen) return;
      if (t.stage === 0) { t.fadeTo = 0; await ctx.wait(260); if (my !== gen) return; setGlyph(1); return; }
      // both painted: the small letter climbs off the paper as its monster
      busy = true; store.traced[t.ch] = 1; K.save(); traced++;
      const low = Lt.metrics(t.ch).bot > 0.06 ? 1 : 0.72;
      const n = monster(t.ch, cx, board.y + tpad + (0.52 + (low - 0.52) * 1.25) * tsc, FT);
      n.floor = G; n.home = { x: port ? cx : Math.max(140, tbx - 160), y: G }; n.happy = true; n.lift(40);
      t.fadeTo = 0; t.mini = null; K.sfx.pop(); n.squash = -0.2;
      await ctx.wait(450); if (my !== gen) return;
      boing(); await n.jump(n.home.x, G, { h: 150, dur: 0.6 }); if (my !== gen) return;
      ctx.fx.burst(n.x, n.y - n.hgt * 0.6, { n: 14 });
      const talk = speak(n, [`${t.ch}.`, isFor(t.ch)]);
      for (let i = 0; i < 2; i++) { await ctx.wait(500); if (my !== gen) return; boing(); await n.jump(n.x, G, { h: 110, dur: 0.42 }); }
      await Promise.all([talk, ctx.wait(1500)]); if (my !== gen) return;
      if (traced % 3 === 0) { await ctx.celebrate(); if (my !== gen) return; }
      nextTrace();
    }
    board.onDown = (p) => traceAt(p);
    board.onMove = (p) => traceAt(p);
    board.onTap = (p) => { if (!p && tr && !tr.lock && !busy && tr.pts[tr.si]) { tr.ci = tr.pts[tr.si].length; strokeDone(); } };   // keyboard and switch users: one press paints a stroke

    /* ---------------- buttons: the three ways to play, and "more" ---------------- */
    const bx = W - 78, disc = (g, s) => { g.beginPath(); g.arc(0, 0, 48, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 0.9, light: 0.03, box: { x: -48, y: -48, w: 96, h: 96 } }); };
    const ICON = {
      meet: (g) => { g.save(); g.translate(0, 34); Lt.monster(g, st.res, 'a', 92, { happy: true, air: 900 }); g.restore(); },
      trace: (g) => {
        g.lineCap = 'round'; g.lineWidth = 15; g.strokeStyle = '#E3DACB'; g.beginPath(); g.arc(2, 2, 22, -0.8, -5.5, true); g.stroke();
        g.strokeStyle = A.C.tomato; g.lineWidth = 13; g.beginPath(); g.arc(2, 2, 22, -0.8, -3.3, true); g.stroke();
        const hx = 2 + Math.cos(-3.3) * 22, hy = 2 + Math.sin(-3.3) * 22; g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = A.C.tomato; g.lineWidth = 3.5; g.stroke();
        g.beginPath(); g.arc(2 + Math.cos(-0.8) * 22, 2 + Math.sin(-0.8) * 22, 4, 0, 7); g.fillStyle = '#fff'; g.fill();
      },
      build: (g, s) => {
        g.save(); g.rotate(-0.08);
        g.beginPath(); A.rect(g, -24, -30, 48, 46, 6, 3, 0.5); A.paper(g, s, '#DCEBE6', { shadow: 0.5, grain: 0.1 });
        g.beginPath(); g.arc(0, -8, 11, 0, 7); g.fillStyle = '#F6C445'; g.fill();
        for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; A.line(g, '#F2A93B', 3, (h) => { h.moveTo(Math.cos(a) * 14, -8 + Math.sin(a) * 14); h.lineTo(Math.cos(a) * 18, -8 + Math.sin(a) * 18); }); }
        g.restore();
        for (let i = 0; i < 3; i++) { g.beginPath(); A.rect(g, -26 + i * 18, 20, 15, 12, 4, i + 1, 0.3); g.fillStyle = [A.C.teal, A.C.tomato, A.C.plum][i]; g.fill(); }
      },
    };
    [['meet', 'meet letters'], ['trace', 'trace letters'], ['build', 'build words']].forEach(([m, label], i) => {
      const b = st.add({ ui: true, z: 100, x: port ? 78 + i * 116 : 78, y: port ? 196 : 196 + i * 116, hitR: 54, label, on: 0 });
      b.draw = (g, s) => {
        b.on += ((mode === m ? 1 : 0) - b.on) * 0.2;
        g.save(); const q = 0.94 + b.on * 0.1; g.scale(q, q);
        if (b.on > 0.05) { g.beginPath(); g.arc(0, 0, 55, 0, 7); g.fillStyle = A.alpha(A.C.marigold, b.on); g.fill(); }
        disc(g, s); ICON[m](g, s); g.restore();
      };
      b.onTap = () => { K.sfx.pop(); setMode(m); };
    });
    const more = st.add({ ui: true, z: 100, x: bx, y: 196, hitR: 52, label: 'more' });
    more.draw = (g, s) => { disc(g, s); g.fillStyle = A.C.ink; g.beginPath(); A.cut(g, [[-6, -24], [22, 0], [-6, 24]], 6, 0, 3); g.fill(); A.line(g, A.C.ink, 9, (h) => { h.moveTo(-22, 0); h.lineTo(0, 0); }); };
    more.onTap = () => {
      if (busy && mode !== 'trace') return; K.sfx.whoosh();
      if (mode === 'meet') { store.page = ((store.page || 0) + 1) % pages; K.save(); showPage(1); }
      else if (mode === 'trace') { gen++; sayTok++; K.hush(); nextTrace(true); }
      else nextWord(true);
    };

    function setMode(m) {
      if (m === mode) return;
      mode = m; gen++; store.mode = m; K.save(); sayTok++; K.hush(); hintFn = null; hintMon = null;
      bg.sprite = m === 'build' ? bgBuild() : bgMeet;
      if (m !== 'build') {
        if (pic) { pic.remove(); pic = null; } word = null;
        if (card.visible) card.to({ y: -420 }, { dur: 0.3 }).then(() => { if (mode !== 'build') card.visible = false; });
        step.to({ alpha: 0 }, { dur: 0.2 }).then(() => { if (mode !== 'build') step.visible = false; });
      }
      if (m !== 'trace' && board.visible) { tr = null; board.to({ y: -TP - 120 }, { dur: 0.3 }).then(() => { if (mode !== 'trace') board.visible = false; }); }
      if (m === 'meet') { busy = false; showPage(1); ctx.prompt(SAY.meet); }
      else if (m === 'trace') { const first = ABC.split('').find((c) => !store.traced[c]) || 'a'; tr = null; startTrace(first); }
      else { card.y = -420; nextWord(); }
    }

    // keep meadow letters from standing on top of each other
    st.onframe = (dt) => {
      if (mode !== 'meet') return;
      for (let i = 0; i < mons.length; i++) for (let j = i + 1; j < mons.length; j++) {
        const a = mons[i], b = mons[j]; if (a.held || b.held || a.j || b.j || a.y < a.floor - 4 || b.y < b.floor - 4) continue;
        const dx = b.x - a.x, min = (a.hit.w + b.hit.w) * 0.42;
        if (Math.abs(dx) < min) { const push = (dx >= 0 ? 1 : -1) * dt * 160; a.x = K.clamp(a.x - push, 60, W - 60); b.x = K.clamp(b.x + push, 60, W - 60); a.home.x = a.x; b.home.x = b.x; }
      }
    };

    K._letters = { get mode() { return mode; }, get word() { return word && word.w; }, get busy() { return busy; }, get slots() { return slots.map((n) => (n ? n.ch : '')); },
      get mons() { return mons.map((n) => ({ ch: n.ch, x: n.x, y: n.y, h: n.hgt, slot: n.slot })); }, slotX, slotY, G, store, setMode,
      /** For tests: the letter being traced and its remaining strokes as screen points. */
      get trace() { return tr && { ch: tr.ch, stage: tr.stage, si: tr.si, ci: tr.ci, lock: tr.lock, strokes: tr.pts.map((p) => p.map((q) => [board.x + q[0], board.y + q[1]])) }; },
      get hint() { return hintOn; } };
    ctx.onExit(() => { K._letters = null; });
    A.fontsReady().then(() => { if (ctx.alive) setMode(['build', 'trace'].includes(store.mode) ? store.mode : 'meet'); });
  }

  K.game({ id: 'letters', title: 'Letter Monsters', voice: 'abc', group: 'learn', order: 1, start, lines, resize: () => K.go('letters') });
})();
