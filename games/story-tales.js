/* Story Studio — the tales. Each tale is data for the engine in story.js:
     { id, title, voice (recorded bundle), color, sky, cover(g, s), vars: {choiceKey: [ids]}, extra: [spoken reaction lines],
       pages: [{ text, hint, more, scene(P) }] }
   text / hint / more may be functions of the choices made so far. scene(P) builds the picture and
   returns a promise that resolves when the page's hands-on action is done.
   Sentences are kept from the old recorded stories wherever they still fit, so their clips match. */
(function () {
  'use strict';
  const A = K.art, St = A.story;
  K.tales = K.tales || [];
  const tale = (t) => {
    t.lines = () => {
      const out = (t.extra || []).slice(); const keys = Object.keys(t.vars || {});
      const combos = keys.reduce((acc, key) => acc.flatMap((c) => t.vars[key].map((v) => Object.assign({}, c, { [key]: v }))), [{}]);
      for (const p of t.pages) for (const f of [p.text, p.hint, p.more]) for (const c of combos) for (const l of [].concat(typeof f === 'function' ? f(c) : f || [])) if (l && !out.includes(l)) out.push(l);
      return out;
    };
    K.tales.push(t);
  };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const fall = (t) => t * t;
  /** A bystander that hops and makes its sound when tapped. */
  const toy = (P, n, snd, label) => { n.label = label || n.kind; n.onTap = () => { P.hop(n); if (snd) P.snd[snd](); }; return n; };
  const friendCard = (id, label) => ({ id, label: label || id, draw: (g, s) => { g.translate(0, 78); St.critter(g, s, { blink: 0 }, id); } });
  const pop = (P, n) => { n.alpha = 0; n.to({ alpha: 1 }, { dur: 0.2 }); return P.hop(n, 90); };

  /* =====================================================================================
     1. Little Lost Star — the choice: which friend comes along in the rocket
     ===================================================================================== */
  const TRY = { owl: 'The wise old owl said, "Try a rocket!"', cat: 'The clever cat said, "Try a rocket!"', panda: 'The kind panda said, "Try a rocket!"' };
  const SKY = [[0.52, 0.22], [0.82, 0.32], [0.62, 0.52]], SPOT = [0.3, 0.42];
  const ROCKET_HIT = { x: -80, y: -300, w: 160, h: 310 };
  tale({
    id: 'star', title: 'Little Lost Star', voice: 'story-star', color: '#4A4A8C', sky: '#2B3466', vars: { friend: ['owl', 'cat', 'panda'] },
    extra: ['Bump!', 'Whoosh!', 'She said, "Thank you, Pip!"', 'three', 'two', 'one'],
    cover(g, s) { for (const [x, y, r] of [[-60, -150, 3], [50, -120, 2.5], [-30, -90, 2], [70, -160, 3], [10, -165, 2]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#FFF6DA'; g.fill(); } g.translate(0, 0); g.scale(0.95, 0.95); St.star(g, s, { glow: 1 }, 0); },
    pages: [
      { text: 'One night, a little star fell down from the sky.', hint: 'Wiggle the star!', more: 'She landed in the soft, green grass.',
        async scene(P) {
          P.bg('night', { moon: 1 });
          const owl = toy(P, P.actor('owl', P.X(0.16), P.G + 34, { scale: 0.9 }), 'hoot');
          const star = P.actor('star', P.X(0.6), P.G - P.SH * 0.46, { float: 1, label: 'Little Star' });
          await P.shake(star, { step: () => { P.snd.twinkle(); P.burst(star, { n: 5 }); } });
          star.float = 0; star.mouth = 'open';
          await star.to({ y: P.G + 26 }, { dur: 0.6, ease: fall });
          P.snd.thud(); P.squash(star, 0.32); P.burst(star); P.speak('Bump!'); P.hop(owl); P.snd.hoot();
          await P.wait(700); star.mouth = 'smile';
        } },
      { text: ['Little Star said, "I want to go home."', 'Pip said, "I will help you!"'], hint: 'Take Pip to Little Star!', cap: 'Take Pip to Star!', more: 'But home was far away, up in the sky.',
        async scene(P) {
          P.bg('night', { moon: 1 });
          P.prop('house', P.X(P.port ? 0.84 : 0.86), P.G + 6, { scale: P.port ? 0.8 : 0.95, lit: 1 });
          const star = P.actor('star', P.X(P.port ? 0.52 : 0.58), P.G + 40, { mouth: 'sad' });
          const pip = P.actor('pip', P.X(0.15), P.G + 50, { label: 'Pip' });
          await P.drag(pip, { x: star.x - 128 * P.k, y: P.G + 50 });
          star.mouth = 'smile'; P.cheer(pip); P.hop(star); P.snd.giggle(); P.puff((pip.x + star.x) / 2, P.G - 110 * P.k, 'heart', 5);
          await P.wait(800);
        } },
      { text: ['Pip lifted Star up, up, up!', 'But not high enough.'], hint: 'Press and hold Pip to make him stretch!', cap: 'Press and hold Pip!', more: 'Pip said, "Let\'s try again."',
        async scene(P) {
          P.bg('night', { moon: 2 });
          toy(P, P.actor('bunny', P.X(0.14), P.G + 60, { scale: 0.8 }), 'boing');
          const pip = P.actor('pip', P.X(0.5), P.G + 50, { label: 'Pip', scale: 1.15 });
          const star = P.actor('star', P.X(0.5), 0, { z: 45, scale: 0.8, lift: 0 });
          star.tick = () => { star.x = pip.x; star.y = pip.y - (132 * (1 + pip.sq) + star.lift) * pip.sy; };
          await P.hold(pip, { secs: 1.7, step: (p, h) => { pip.sq = p * 0.55; pip.mouth = h ? 'oh' : 'smile'; if (h && Math.random() < 0.12) K.sfx.tone(300 + p * 600, 0.06, { vol: 0.08 }); } });
          star.mouth = 'open'; P.snd.boing(); await star.to({ lift: 150 }, { dur: 0.35, ease: 'out' }); await star.to({ lift: 0 }, { dur: 0.3, ease: fall });
          P.snd.slide(); pip.mouth = 'smile'; star.mouth = 'smile'; await pip.to({ sq: 0 }, { dur: 0.6, ease: 'elastic' });
        } },
      { text: 'They needed a friend to help.', hint: 'Who will come with Pip?', cap: 'Who will come?', more: (c) => TRY[c.friend],
        async scene(P) {
          P.bg('night', P.port ? {} : { moon: 2 });
          const pip = P.actor('pip', P.X(0.22), P.G + 50); P.actor('star', P.X(0.22) + 120 * P.k, P.G + 40, { scale: 0.8 });
          const to = { x: P.X(0.72), y: P.G - 40 };
          await P.choice('friend', [friendCard('owl'), friendCard('cat'), friendCard('panda')], { to });
          const f = P.actor(P.ch.friend, to.x, P.G + 50, { flip: 1 }); P.snd[P.ch.friend === 'owl' ? 'hoot' : 'boing'](); P.cheer(pip);
          await pop(P, f); P.cheer(f); await P.wait(500);
        } },
      { text: 'So Pip and Star hopped into the little red rocket.', hint: 'Put Little Star in the rocket!', cap: 'Star in the rocket!', more: 'Pip said, "Hold on tight, Little Star!"',
        async scene(P) {
          P.bg('night', { moon: 1 });
          const rocket = P.prop('rocket', P.X(0.76), P.G + 36, { z: 6, hit: ROCKET_HIT });
          const pip = P.actor('pip', P.X(0.13), P.G + 56, { scale: 0.9 }), f = P.actor(P.ch.friend, P.X(0.29), P.G + 60, { scale: 0.85 });
          const star = P.actor('star', P.X(0.47), P.G + 44, { scale: 0.8, label: 'Little Star' });
          await P.drag(star, { x: rocket.x, y: rocket.y - 108 * P.k }, { markY: rocket.y - 160 * P.k });
          star.to({ alpha: 0, sx: 0.2, sy: 0.2 }, { dur: 0.2 }); rocket.riders = 1; P.snd.twinkle(); P.burst({ x: rocket.x, y: rocket.y - 160 * P.k }, { n: 8 });
          for (const n of [f, pip]) { P.hop(n, 60); await n.to({ x: rocket.x - 30 * P.k, alpha: 0 }, { dur: 0.55, ease: 'inOut' }); K.sfx.pop(); }
          await P.wait(200);
        } },
      { text: 'Ready for blast off!', hint: 'Tap the rocket three times to blast off!', cap: 'Tap the rocket!', more: 'Whoosh!',
        async scene(P) {
          P.bg('night', { moon: 1 });
          P.prop('house', P.X(0.14), P.G + 6, { scale: 0.7, lit: 1 });
          const rocket = P.prop('rocket', P.X(0.52), P.G + 40, { z: 6, hit: ROCKET_HIT, riders: 1, label: 'rocket', scale: 1.15 });
          await P.taps(rocket, { n: 3, count: 'down', step: (c) => { rocket.rot = 0.07 * (c % 2 ? 1 : -1); rocket.to({ rot: 0 }, { dur: 0.45, ease: 'elastic' }); rocket.fire = c * 0.22; P.puff(rocket.x, rocket.y, 'steam', 4); } });
          await P.wait(700); P.snd.rocket(); rocket.fire = 1;
          rocket.tick = () => { if (Math.random() < 0.6) P.puff(rocket.x, Math.min(P.G + 30, rocket.y + 40), 'steam', 1); };
          await rocket.to({ y: -260 }, { dur: 1.6, ease: fall });
        } },
      { text: ['Up, up, up they flew.', 'But where was Star\'s family?'], hint: 'Rub the clouds away!', cap: 'Rub the clouds!', more: 'And this time, it was high enough!',
        async scene(P) {
          P.bg('space', { planet: 1 });
          P.prop('rocket', P.X(0.2), P.SH * 0.78, { z: 6, riders: 1, fire: 0.6, rot: 0.5, scale: 0.8, float: 1 });
          const ms = SKY.map(([fx, fy], i) => P.prop('ministar', P.X(fx), P.SH * fy + 40 * P.k, { glow: 0, ph: i * 2, z: 4 }));
          const cl = SKY.map(([fx, fy], i) => P.prop('cloud', P.X(fx) + (i - 1) * 20, P.SH * fy, { z: 20, scale: 1.05, x0: P.X(fx), hit: null }));
          const zone = P.zone(0, 150, P.W, P.SH - 160, 22);
          await P.rub(zone, { label: 'clouds', at: cl[2], flat: 1, step: (p) => { cl.forEach((c, i) => { c.puff = true; c.alpha = 1 - p; c.x = c.x0 + (i - 1) * p * 90 + Math.sin(P.st.t * 30 + i) * 5 * (p < 1 ? 1 : 0); }); ms.forEach((m) => { m.glow = p; }); } });
          P.snd.twinkle(); ms.forEach((m, i) => { P.burst({ x: m.x, y: m.y - 40 * P.k }, { n: 6 }); P.wait(i * 120).then(() => P.hop(m, 30)); });
          await P.wait(700);
        } },
      { text: 'Little Star hopped back into her spot.', hint: 'Put Little Star back in the sky!', cap: 'Back in the sky!', more: 'She shone brighter than ever.',
        async scene(P) {
          P.bg('space', { planet: 1 });
          P.prop('rocket', P.X(0.16), P.SH * 0.86, { z: 6, fire: 0.4, rot: 0.5, scale: 0.75 });
          const ms = SKY.map(([fx, fy], i) => P.prop('ministar', P.X(fx), P.SH * fy + 40 * P.k, { glow: 1, ph: i * 2, z: 4 }));
          const gap = P.prop('gap', P.X(SPOT[0]), P.SH * SPOT[1], { z: 4 });
          const star = P.actor('star', P.X(0.3), P.SH * 0.84, { label: 'Little Star', float: 1 });
          await P.drag(star, { x: gap.x, y: gap.y });
          gap.remove(); star.float = 0; star.glow = 1.5; star.mouth = 'open'; P.snd.twinkle(); P.burst(star, { n: 18 }); P.speak('She said, "Thank you, Pip!"');
          ms.forEach((m) => P.hop(m, 30)); await P.hop(star, 40); star.mouth = 'smile';
        } },
      { text: ['Pip flew home to bed.', 'And every night, Little Star winks at Pip.'], hint: 'Tap Little Star!', more: 'Good night, Little Star.',
        async scene(P) {
          P.bg('night', { moon: 2 });
          P.prop('house', P.X(0.24), P.G + 6, { scale: P.port ? 0.8 : 1, lit: 1 });
          P.prop('rocket', P.X(0.9), P.G + 30, { scale: 0.6, z: 4 });
          const pip = P.actor('pip', P.X(0.52), P.G + 56, { gaze: 0.4 }), f = P.actor(P.ch.friend || 'owl', P.X(0.7), P.G + 60, { scale: 0.9 });
          toy(P, f, 'boing');
          const star = P.actor('star', P.X(0.62), P.SH * 0.3, { float: 1, label: 'Little Star', scale: 0.9, glow: 1.2 });
          await P.taps(star, { n: 1 });
          star.wink = true; P.snd.twinkle(); P.burst(star, { n: 16 }); pip.to({ wave: 1 }, { dur: 0.3 }).then(() => pip.to({ wave: 0 }, { dur: 0.5 })); P.cheer(f);
          await P.wait(900); star.wink = false; P.snd.yawn(); P.puff(P.X(0.24), P.G - 230 * P.k, 'z', 3);
        } },
    ],
  });

  /* =====================================================================================
     2. Toot the Little Train — the choice: what Toot carries over the hill
     ===================================================================================== */
  const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  /** A hill with rails. dir 1 climbs to the right, -1 runs down to the right. Returns {y(x), put(toot)}. */
  function hill(P, dir) {
    const xa = P.X(dir > 0 ? 0.3 : 0.2), xb = P.X(dir > 0 ? 0.9 : 0.82), hh = Math.min(P.SH * 0.4, (xb - xa) * 0.6), base = P.G + 40;
    const y = (x) => base - hh * (dir > 0 ? smooth((x - xa) / (xb - xa)) : 1 - smooth((x - xa) / (xb - xa)));
    P.paint('hill' + dir, 4, (g, s) => { St.bigHill(g, s, (x) => y(x) + 6, -20, P.W + 20, P.H, '#86B585'); St.track(g, s, y, -20, P.W + 20); });
    const slope = (x) => { const d = 50 * P.k; return Math.atan2(y(x + d) - y(x - d), d * 2); };
    const put = (t) => {
      t.y = y(t.x); t.rot = slope(t.x); if (t.px != null) t.roll += (t.x - t.px) / Math.abs(t.sx); t.px = t.x;
      const w = t.wag; if (!w) return;
      let wx = t.x - 212 * t.sx; for (let i = 0; i < 3; i++) wx = t.x - 212 * t.sx * Math.cos(slope((wx + t.x) / 2));
      w.x = wx; w.y = y(wx); w.rot = slope(wx); w.roll = t.roll; w.cargo = t.cargo;
    };
    /** Toot with a wagon that follows the rails by itself. */
    const train = (x, o) => { const wag = P.actor('wagon', x, 0, { scale: 0.72, z: (o.z || 10) - 1, hit: null }); const t = P.actor('toot', x, 0, Object.assign({ scale: 0.72, cargo: P.ch.cargo, roll: 0, label: 'Toot', wagon: false, wag }, o)); put(t); return t; };
    return { y, put, xa, xb, train };
  }
  const steam = (P, toot, n) => { const p = P.at(toot, 78, -190); P.puff(p.x, p.y, 'steam', n || 2); };
  const CARGO = ['apples', 'cakes', 'flowers'];
  tale({
    id: 'toot', title: 'Toot the Little Train', voice: 'story-toot', color: '#C9553F', sky: '#CFE6E8', vars: { cargo: CARGO },
    extra: ['Choo choo!', 'Oh no!', 'He rolled back down.', 'Push, push, push!', 'one', 'two', 'three'],
    cover(g, s) { g.beginPath(); g.ellipse(0, 70, 150, 60, 0, 0, 7); g.fillStyle = '#86B585'; g.fill(); g.translate(26, 26); g.scale(0.42, 0.42); St.toot(g, s, { cargo: 'apples' }); },
    pages: [
      { text: 'This is Toot, the little red train.', hint: 'Wake up Toot!', more: 'Today, Toot has a big job.',
        async scene(P) {
          P.bg('day', { sun: 1, trees: [[0.06, 230, 3], [0.94, 190, 8]] });
          P.paint('flat', 4, (g, s) => St.track(g, s, () => P.G + 40, -20, P.W + 20));
          P.prop('shed', P.X(0.5) - 110 * P.k, P.G + 28, { scale: 1.25, z: 3 });
          const bunny = toy(P, P.actor('bunny', P.X(0.88), P.G + 70, { scale: 0.85, flip: 1 }), 'boing');
          const toot = P.actor('toot', P.X(0.5) + 70 * P.k, P.G + 40, { sleep: true, label: 'Toot', scale: 0.92 });
          let zt = 0; toot.tick = (dt) => { zt -= dt; if (toot.sleep && zt < 0) { zt = 1.3; const p = P.at(toot, 120, -150); P.puff(p.x, p.y, 'z', 1); } };
          await P.taps(toot, { n: 3, step: (c) => { P.squash(toot, 0.07); if (c === 1) P.snd.snore(); if (c === 2) { P.snd.yawn(); toot.mouth = 'oh'; } } });
          toot.sleep = false; toot.mouth = 'open'; P.snd.choo(); steam(P, toot, 5); P.speak('Choo choo!'); P.hop(toot, 30); P.cheer(bunny);
          await P.wait(900); toot.mouth = 'smile';
        } },
      { text: 'Toot had an empty wagon.', hint: 'What will Toot carry today?', cap: 'Pick one for Toot!', more: (c) => `Toot must take the ${c.cargo} over the big, big hill.`,
        async scene(P) {
          P.bg('day', { sun: P.port ? 0 : 1, trees: [[0.08, 210, 5]] });
          P.paint('flat', 4, (g, s) => St.track(g, s, () => P.G + 40, -20, P.W + 20));
          const toot = P.actor('toot', P.X(0.5) + 80 * P.k, P.G + 40, { scale: 0.92 });
          const to = P.at(toot, -212, -90);
          await P.choice('cargo', CARGO.map((c) => ({ id: c, label: c, draw: (g, s) => { g.translate(0, 62); g.scale(1.2, 1.2); St.prop.crate(g, s, { cargo: c }); } })), { to });
          toot.cargo = P.ch.cargo; K.sfx.pop(); P.snd.choo(); steam(P, toot, 4); toot.mouth = 'open'; await P.hop(toot, 30); toot.mouth = 'smile';
        } },
      { text: ['Up went Toot.', 'Chug, chug, puff!'], hint: 'Press and hold Toot to make steam!', cap: 'Hold Toot!', more: 'The hill was just too steep.',
        async scene(P) {
          P.bg('day', { sun: 1 }); const h = hill(P, 1);
          const toot = h.train(h.xa, { u: 0 });
          toot.tick = () => { toot.x = h.xa + (h.xb - h.xa - 40 * P.k) * toot.u; h.put(toot); }; toot.tick();
          let pt = 0;
          await P.hold(toot, { secs: 1.8, step: (p, on, dt) => { toot.sq = on ? Math.sin(P.st.t * 40) * 0.02 * (0.4 + p) : 0; pt -= dt; if (on && pt < 0) { pt = 0.34 - p * 0.24; steam(P, toot, 1); K.sfx.noise(0.08, { freq: 520, vol: 0.12 + p * 0.1 }); } } });
          toot.sq = 0; P.snd.chug(); await toot.to({ u: 0.56 }, { dur: 1.3, ease: 'out' });
          toot.mouth = 'oh'; P.speak('Oh no!'); await P.wait(450); P.snd.slide(); await toot.to({ u: 0 }, { dur: 0.9, ease: fall });
          P.squash(toot, 0.1); P.speak('He rolled back down.'); await P.wait(500); toot.mouth = 'smile';
        } },
      { text: ['Toot said, "I will try again!"', 'But he needs a little help.'], hint: 'Push Toot up the hill!', cap: 'Push Toot!', more: 'Toot said, "I did it!"',
        async scene(P) {
          P.bg('day', {}); const h = hill(P, 1);
          // the helpers stand on the grass below the rails, never in front of the train
          const pals = [P.actor('bunny', P.X(P.port ? 0.56 : 0.05), P.G + (P.port ? 200 : 110), { scale: 0.7, z: 8 }), P.actor('bear', P.X(P.port ? 0.82 : 0.13), P.G + (P.port ? 210 : 120), { scale: 0.7, z: 8, flip: P.port ? 1 : 0 })]; pals.forEach((n) => toy(P, n, 'boing'));
          const toot = h.train(h.xa, { u: 0, pad: 110 }); let tu = 0;
          toot.tick = (dt) => { toot.u += (tu - toot.u) * Math.min(1, (dt || 1) * 9); toot.x = h.xa + (h.xb - h.xa - 40 * P.k) * toot.u; h.put(toot); }; toot.tick();
          await P.swipe(toot, { n: 4, dir: 1, live: (f) => { tu = Math.max(tu, f); }, step: (c) => { P.snd.chug(); steam(P, toot, 2); P.hop(pals[c % 2], 40); if (c === 1) P.speak('Push, push, push!', false); } });
          await P.wait(600); P.snd.choo(); toot.mouth = 'open'; steam(P, toot, 5); P.burst(toot, { n: 20 }); pals.forEach((n) => P.cheer(n));
          await P.wait(700); toot.mouth = 'smile';
        } },
      { text: 'Toot was on top of the hill!', hint: 'Blow the clouds away!', cap: 'Blow the clouds!', more: 'He could see the town far below.',
        async scene(P) {
          P.bg('day', { sun: 0 });
          const top = P.G - (P.port ? 10 : 40), y = (x) => top + Math.pow((x - P.X(0.3)) / P.W, 2) * (P.port ? 900 : 560);
          const town = P.prop('town', P.X(0.8), P.G + 60, { scale: P.port ? 0.42 : 0.5, z: 2, alpha: 0.25 });
          P.paint('top', 4, (g, s) => { St.bigHill(g, s, (x) => y(x) + 6, -20, P.W + 20, P.H, '#86B585'); St.track(g, s, y, -20, P.X(0.62)); });
          const toot = P.actor('toot', P.X(0.36), 0, { scale: 0.72, cargo: P.ch.cargo, gaze: 1 }); toot.y = y(toot.x);
          toy(P, toot, 'choo', 'Toot');
          const cl = [[0.66, 0.5], [0.9, 0.62], [0.78, 0.36]].map(([fx, fy], i) => P.prop('cloud', P.X(fx), P.SH * fy, { z: 20, scale: 1.15, awake: i === 0, hit: null, x0: P.X(fx), f: 0 }));
          let tf = 0, td = 1;
          cl.forEach((n, i) => { n.tick = (dt) => { n.f += (tf - n.f) * Math.min(1, dt * 10); n.x = n.x0 + td * n.f * (300 + i * 60) * P.k; n.alpha = 1 - n.f; }; });
          town.tick = () => { town.alpha = 0.25 + 0.75 * cl[0].f; };
          const zone = P.zone(0, 150, P.W, P.SH - 160, 22);
          await P.swipe(zone, { label: 'clouds', at: cl[0], flat: 1, n: 3, pad: 0, live: (f, dir) => { tf = f; td = dir; cl.forEach((n) => { n.puff = true; }); }, step: () => { P.snd.wind(); } });
          P.snd.choo(); toot.mouth = 'open'; steam(P, toot, 4); P.hop(toot, 30); await P.wait(800); toot.mouth = 'smile';
        } },
      { text: 'Down the other side went Toot.', hint: 'Drive Toot down the hill!', cap: 'Drive Toot down!', more: ['Wheee!', 'Clickety-clack!'],
        async scene(P) {
          P.bg('day', { sun: 1 }); const h = hill(P, -1);
          P.prop('town', P.X(0.86), P.G + 16, { scale: P.port ? 0.36 : 0.5, z: 3 });
          const toot = h.train(P.X(P.port ? 0.42 : 0.3), { z: 12 });
          let ct = 0;
          await P.drag(toot, { x: h.xb + 20 * P.k, y: P.G + 40 }, { path: h.y, markY: P.G - 20 * P.k, onMove: (n) => { h.put(n); toot.mouth = 'open'; ct += 1; if (ct % 9 === 0) K.sfx.noise(0.04, { freq: 900, vol: 0.12 }); } });
          h.put(toot); P.snd.wheee(); steam(P, toot, 4); P.squash(toot, 0.08); await P.wait(600); toot.mouth = 'smile';
        } },
      { text: (c) => `Toot rolled into town with all the ${c.cargo}.`, hint: 'Give everyone some!', cap: 'Share them out!', more: (c) => ['Everybody cheered, "Hooray for Toot!"', `There were ${c.cargo} for everyone.`],
        async scene(P) {
          P.bg('day', { sun: 1 });
          P.paint('flat', 4, (g, s) => St.track(g, s, () => P.G + 40, -20, P.W + 20));
          P.prop('town', P.X(0.66), P.G + 20, { scale: P.port ? 0.6 : 0.95, z: 3 });
          const toot = P.actor('toot', P.X(P.port ? 0.44 : 0.36), P.G + 40, { scale: P.port ? 0.7 : 0.82, cargo: P.ch.cargo });
          const cargo = P.ch.cargo || 'apples';
          const pals = ['bear', 'cat', 'frog'].map((id, i) => P.actor(id, P.X((P.port ? 0.2 : 0.6) + i * (P.port ? 0.3 : 0.14)), P.G + (P.port ? 150 : 100), { scale: 0.85, z: 14, label: id, arms: 0.5 }));
          await P.taps(pals, { count: 'up', step: (c, n) => {
            const from = P.at(toot, -212, -110);
            const it = P.node.add(new K.engine.Node({ x: from.x, y: from.y, z: 30, sx: P.k * 1.2, sy: P.k * 1.2, draw: (g, s) => St.item[cargo](g, s, 0, 0, 1) }));
            it.to({ x: n.x, y: n.y - 60 * n.sy }, { dur: 0.5, ease: 'inOut' }).then(() => { K.sfx.pop(); n.arms = 0; P.cheer(n); P.burst({ x: n.x, y: n.y - 80 * n.sy }, { n: 8 }); });
          } });
          await P.wait(700); P.snd.choo(); steam(P, toot, 4); toot.mouth = 'open'; P.hop(toot, 30); await P.wait(500);
        } },
      { text: ['That night, Toot was sleepy and proud.', 'He said, "I kept on trying."'], hint: 'Say good night to Toot!', cap: 'Good night, Toot!', more: 'Good night, little Toot.',
        async scene(P) {
          P.bg('eve', { moon: 1 });
          P.paint('flat', 4, (g, s) => St.track(g, s, () => P.G + 40, -20, P.W + 20));
          P.prop('shed', P.X(0.5) - 110 * P.k, P.G + 28, { scale: 1.25, z: 3 });
          toy(P, P.actor('owl', P.X(0.88), P.G + 70, { scale: 0.85, flip: 1 }), 'hoot');
          const toot = P.actor('toot', P.X(0.5) + 70 * P.k, P.G + 40, { label: 'Toot', scale: 0.92 });
          // the thing he carried, kept as a little prize on his wagon
          const prize = P.ch.cargo || 'apples'; const pp = P.at(toot, -212, -124);
          P.node.add(new K.engine.Node({ x: pp.x, y: pp.y, z: 11, sx: P.k * 1.3, sy: P.k * 1.3, draw: (g, s) => St.item[prize](g, s, 0, 0, 1) }));
          await P.taps(toot, { n: 1 });
          P.snd.yawn(); toot.mouth = 'oh'; await P.wait(700); toot.sleep = true; toot.mouth = 'smile'; P.snd.snore();
          let zt = 0; toot.tick = (dt) => { zt -= dt; if (zt < 0) { zt = 1.2; const p = P.at(toot, 120, -150); P.puff(p.x, p.y, 'z', 1); } };
          await P.wait(600);
        } },
    ],
  });

  /* =====================================================================================
     3. Bobo and the Puddle — the choice: which friend jumps in first
     ===================================================================================== */
  const PALS = ['frog', 'bunny', 'fox'];
  const JUMP = { frog: 'Ribbit! Jump in, Bobo!', bunny: 'Hop, hop! Jump in, Bobo!', fox: 'Yip, yip! Jump in, Bobo!' };
  const splash = (P, pud, x, n, up) => { pud.rip = P.st.t; pud.ripX = (x - pud.x) / pud.sx; P.snd.splash(); P.puff(x, pud.y - 10, 'drop', n || 12, { up: up || 1 }); };
  const puddleAt = (P) => P.prop('puddle', P.X(P.port ? 0.6 : 0.62), P.G + (P.port ? 110 : 84), { z: 6, scale: P.port ? 0.95 : 1.1 });
  tale({
    id: 'bobo', title: 'Bobo and the Puddle', voice: 'story-bobo', color: '#2F8F8A', sky: '#AEBDC8', vars: { pal: PALS },
    // generated pictures (tools/gen_images.py). h: height in scene units; like: same scale as; props: [width, centre x, bottom y]
    art: { dir: 'img/bobo', horizon: 0.53,
      names: ['bobo', 'bobo-happy', 'bobo-sleep', 'bobo-mud', 'mama', 'frog', 'bunny', 'fox', 'bg-rain', 'bg-day', 'den', 'cloud', 'rainbow', 'puddle'],
      h: { bobo: 196, mama: 200, frog: 140, bunny: 200, fox: 185 }, like: { 'bobo-happy': 'bobo', 'bobo-sleep': 'bobo', 'bobo-mud': 'bobo' },
      props: { den: [330, 0, 12], cloud: [230, 0, 70], rainbow: [700, 0, 6], puddle: [430, 0, 54] },
      actors: (kind, o) => (kind === 'bear' ? (o.scarf ? 'mama' : 'bobo') : kind) },
    extra: ['Drip, drop, drip, drop.', 'Dip!', 'Splash, splash, splash!'],
    cover(g, s) { A.line(g, 'rgba(255,255,255,.7)', 3, (h) => { for (const [x, y] of [[-60, -150], [-20, -120], [40, -160], [70, -110], [10, -80], [-70, -90]]) { h.moveTo(x, y); h.lineTo(x - 4, y + 18); } }); g.beginPath(); g.ellipse(0, 78, 96, 20, 0, 0, 7); g.fillStyle = '#7FB7D6'; g.fill(); g.translate(0, 74); g.scale(0.8, 0.8); St.critter(g, s, { blink: 0 }, 'bear'); },
    pages: [
      { text: 'Bobo the bear cub woke up.', hint: 'Wake up Bobo!', more: ['Pitter, patter!', 'What was that sound?'],
        async scene(P) {
          P.bg('rain', { trees: [[0.9, 240, 4]] }); P.rain = 0.22;
          const den = P.prop('den', P.X(0.38), P.G + 30, { scale: P.port ? 1 : 1.25, z: 5 });
          const bobo = P.actor('bear', den.x, P.G + 36, { scale: 0.82, sleep: true, label: 'Bobo' });
          let zt = 0; bobo.tick = (dt) => { zt -= dt; if (bobo.sleep && zt < 0) { zt = 1.3; P.puff(bobo.x + 50 * P.k, bobo.y - 150 * P.k, 'z', 1); } };
          await P.taps(bobo, { n: 3, step: (c) => { P.squash(bobo, 0.12); bobo.tilt = 0.2 * (c % 2 ? 1 : -1); bobo.to({ tilt: 0 }, { dur: 0.5, ease: 'elastic' }); if (c === 2) P.snd.yawn(); } });
          bobo.sleep = false; P.snd.giggle(); bobo.to({ x: P.X(0.72) }, { dur: 0.6, ease: 'inOut' }); await P.hop(bobo, 70); P.snd.drip();
        } },
      { text: 'It was rain!', hint: 'Shake the rain out of the cloud!', cap: 'Shake the cloud!', more: ['Bobo had never seen rain before.', 'It tickled his nose.'],
        async scene(P) {
          P.bg('rain'); P.rain = 0.1;
          const cloud = P.prop('cloud', P.X(0.5), P.SH * 0.26, { grey: 1, scale: P.port ? 1.5 : 1.7, z: 20, label: 'cloud' });
          P.rainTop = cloud.y;
          const bobo = P.actor('bear', P.X(0.5), P.G + 60, { scale: 0.9 }); toy(P, bobo, 'giggle', 'Bobo');
          await P.shake(cloud, { n: 4, amp: 90, step: (c) => { cloud.puff = true; cloud.awake = true; P.rain = 0.1 + c * 0.22; P.snd.drip(); P.puff(cloud.x, cloud.y + 50 * P.k, 'drop', 8, { up: 0.1, spread: 0.6 }); } });
          P.speak('Drip, drop, drip, drop.'); bobo.mouth = 'open'; P.snd.giggle(); bobo.tilt = 0.25; bobo.to({ tilt: 0 }, { dur: 0.7, ease: 'elastic' }); await P.hop(bobo, 40);
        } },
      { text: ['Then Bobo saw a big, shiny puddle.', 'He asked, "Is it scary?"'], hint: 'Who will jump in first?', cap: 'Who goes first?', more: (c) => JUMP[c.pal],
        async scene(P) {
          P.bg('rain'); P.rain = 0.35;
          const pud = puddleAt(P);
          const bobo = P.actor('bear', P.X(0.14), P.G + 70, { scale: 0.9, gaze: 1 }); toy(P, bobo, 'giggle', 'Bobo');
          await P.choice('pal', PALS.map((id) => friendCard(id)), { to: { x: pud.x, y: P.G - 140 * P.k } });
          const f = P.actor(P.ch.pal, pud.x + 40 * P.k, P.G - 260 * P.k, { flip: 1, scale: 0.9, z: 9 });
          await f.to({ y: pud.y + 6 }, { dur: 0.45, ease: fall }); P.squash(f, 0.25); splash(P, pud, f.x, 16); P.hop(bobo, 30);
          await P.wait(500); P.cheer(f);
        } },
      { text: 'Bobo put in one little toe.', hint: 'Bring Bobo to the puddle!', cap: 'To the puddle!', more: 'It was cold and tickly.',
        async scene(P) {
          P.bg('rain'); P.rain = 0.35;
          const pud = puddleAt(P);
          const f = P.actor(P.ch.pal, pud.x + 70 * P.k, pud.y + 6, { flip: 1, scale: 0.9, z: 9 }); toy(P, f, 'boing');
          const bobo = P.actor('bear', P.X(0.13), P.G + 70, { scale: 0.9, label: 'Bobo' });
          await P.drag(bobo, { x: pud.x - 170 * pud.sx, y: pud.y });
          P.speak('Dip!'); pud.rip = P.st.t; pud.ripX = -150; P.snd.drip(); P.puff(bobo.x + 30 * P.k, pud.y - 10, 'drop', 4, { up: 0.5 });
          await P.wait(350); P.snd.giggle(); bobo.mouth = 'open'; bobo.tilt = 0.2; bobo.to({ tilt: 0 }, { dur: 0.6, ease: 'elastic' }); await P.hop(bobo, 30);
        } },
      { text: ['Bobo wiggled his bottom.', 'Was he ready to jump?'], hint: 'Press and hold Bobo to make him jump!', cap: 'Hold Bobo to jump!', more: (c) => `Bobo and ${cap(c.pal)} jumped in the puddle.`,
        async scene(P) {
          P.bg('rain'); P.rain = 0.35;
          const pud = puddleAt(P);
          const f = P.actor(P.ch.pal, pud.x + 80 * P.k, pud.y + 6, { flip: 1, scale: 0.9, z: 9 });
          const bx = pud.x - 190 * pud.sx - 30 * P.k, bobo = P.actor('bear', bx, P.G + 76, { scale: 0.9, label: 'Bobo', z: 10 });
          await P.hold(bobo, { secs: 1.4, step: (p, on) => { bobo.sq = -p * 0.3; bobo.x = bx + (on ? Math.sin(P.st.t * 26) * 7 * p : 0); bobo.arms = p * 0.5; } });
          bobo.mouth = 'open'; P.snd.boing(); bobo.sq = 0.15; bobo.arms = 1;
          bobo.to({ x: pud.x - 50 * P.k }, { dur: 0.7, ease: 'linear' }); await bobo.to({ y: P.G - 240 * P.k }, { dur: 0.35, ease: 'out' }); await bobo.to({ y: pud.y + 8 }, { dur: 0.35, ease: fall });
          splash(P, pud, bobo.x, 30, 1.3); bobo.sq = -0.25; bobo.to({ sq: 0 }, { dur: 0.5, ease: 'elastic' }); bobo.to({ mud: 1 }, { dur: 0.3 }); bobo.arms = 0; P.speak('Splash, splash, splash!');
          for (let i = 0; i < 2; i++) { await P.wait(350); P.hop(i ? bobo : f, 60).then(() => splash(P, pud, i ? bobo.x : f.x, 12)); }
          await P.wait(800);
        } },
      { text: ['Then the rain went drip, drop, stop.', 'But two grey clouds were still in the way.'], hint: 'Blow the clouds away!', cap: 'Blow the clouds!', more: 'Out came a big, bright rainbow!',
        async scene(P) {
          P.bg('rain'); P.rain = 0.3;
          const day = P.bg('day', { sun: 1 }); day.alpha = 0; day.z = 1;
          const bow = P.prop('rainbow', P.X(0.5), P.G + 30, { z: 2, alpha: 0, scale: P.port ? 0.95 : 1.15, hit: null });
          const pud = puddleAt(P);
          const f = toy(P, P.actor(P.ch.pal, pud.x + 90 * P.k, pud.y + 6, { flip: 1, scale: 0.9, z: 9, gaze: 0 }), 'boing');
          const bobo = toy(P, P.actor('bear', pud.x - 70 * P.k, pud.y + 8, { scale: 0.9, mud: 1, z: 10 }), 'giggle', 'Bobo');
          const cl = [[0.34, 0.27, -1], [0.72, 0.33, 1]].map(([fx, fy, d]) => P.prop('cloud', P.X(fx), P.SH * (fy + (P.port ? 0.05 : 0)), { grey: 1, scale: P.port ? 1.15 : 1.5, z: 20, hit: null, x0: P.X(fx), d, f: 0 }));
          let tf = 0;
          cl.forEach((n) => { n.tick = (dt) => { n.f += (tf - n.f) * Math.min(1, dt * 10); n.x = n.x0 + n.d * n.f * P.W * 0.6; n.alpha = 1 - n.f * 0.9; }; });
          const zone = P.zone(0, 150, P.W, P.SH * 0.62 - 150, 22);
          await P.swipe(zone, { label: 'clouds', at: cl[0], flat: 1, n: 3, pad: 0, live: (f) => { tf = f; P.rain = 0.3 * (1 - f); cl.forEach((n) => { n.puff = true; }); }, step: () => { P.snd.wind(); } });
          cl.forEach((n) => { n.tick = null; });
          cl.forEach((n) => n.to({ alpha: 0 }, { dur: 0.3 })); day.to({ alpha: 1 }, { dur: 1.2 }); await P.wait(300); P.snd.twinkle(); bow.to({ alpha: 1 }, { dur: 1.2 }); P.cheer(bobo); P.cheer(f);
          await P.wait(1200);
        } },
      { text: 'Bobo was muddy from his nose to his toes.', hint: 'Rub the mud off Bobo!', cap: 'Rub off the mud!', more: ['Mama Bear gave Bobo a big, warm hug.', 'Bobo said, "I love puddles!"'],
        async scene(P) {
          P.bg('day', { sun: 1, trees: [[0.06, 220, 6]] });
          P.prop('rainbow', P.X(0.5), P.G + 30, { z: 2, alpha: 0.9, scale: P.port ? 0.95 : 1.15, hit: null });
          const mama = P.actor('bear', P.X(0.76), P.G + 60, { scale: 1.4, scarf: '#E8664A', flip: 1 }); toy(P, mama, 'boing', 'Mama Bear');
          const bobo = P.actor('bear', P.X(0.36), P.G + 70, { scale: 1.05, mud: 1, label: 'Bobo', z: 12 });
          await P.rub(bobo, { dist: 1300, step: (p, pt) => { bobo.mud = 1 - p; bobo.sq = Math.sin(P.st.t * 30) * 0.02; if (pt && Math.random() < 0.3) P.puff(pt.x, pt.y, 'steam', 1); } });
          bobo.sq = 0; bobo.mud = 0; K.sfx.sparkle(); P.burst(bobo, { n: 18 }); bobo.mouth = 'open';
          await mama.to({ x: bobo.x + 130 * P.k }, { dur: 0.6, ease: 'inOut' });
          mama.arms = 0.7; bobo.arms = 0.7; P.squash(mama, 0.08); P.squash(bobo, 0.12); P.snd.giggle(); P.puff((bobo.x + mama.x) / 2, P.G - 190 * P.k, 'heart', 6);
          await P.wait(900);
        } },
      { text: 'He asked, "Can it rain again tomorrow?"', hint: 'Splash in the puddle!', cap: 'Tap the puddle!', more: (c) => `${cap(c.pal || 'frog')} said, "Yes, please!"`,
        async scene(P) {
          P.bg('day', { sun: 1 });
          P.prop('rainbow', P.X(0.5), P.G + 30, { z: 2, alpha: 0.9, scale: P.port ? 0.95 : 1.15, hit: null });
          const pud = P.prop('puddle', P.X(0.5), P.G + (P.port ? 110 : 84), { z: 6, scale: P.port ? 0.95 : 1.1, label: 'puddle' });
          const who = [P.actor('bear', pud.x - 250 * P.k, P.G + 70, { scale: 1.3, scarf: '#E8664A', z: 9 }), P.actor('bear', pud.x - 40 * P.k, P.G + 60, { scale: 0.9, z: 9 }), P.actor(P.ch.pal || 'frog', pud.x + 200 * P.k, P.G + 70, { scale: 0.9, flip: 1, z: 9 })];
          await P.taps(pud, { n: 1, flat: 1 });
          who.forEach((n, i) => { P.wait(i * 160).then(() => { n.mouth = 'open'; n.arms = 1; return P.hop(n, 80); }).then(() => { n.arms = 0; splash(P, pud, K.clamp(n.x, pud.x - 150 * P.k, pud.x + 150 * P.k), 14, 1.1); }); });
          await P.wait(1300);
        } },
    ],
  });
})();
