/* Build a Sentence — word cards that come true.
   The child puts word cards in order on the writing line. When the sentence is right it is read out
   and the picture above acts it out: the frog really jumps over the log.
   Level 1: three or four word cards. The picture plays first ("Look!"), then the child writes what happened.
   Level 2: 4-6 words, a capital letter first and a full stop (or a question mark) last; and silly sentences
            made from rows of choices (who + does what + where), which play out whatever they say.
   Level 3: 6-9 words with describing and joining words; spot and fix one mistake; sort words into
            naming, doing and describing words.
   Nothing can be lost. A wrong order sends only the wrong cards back, with a hint that teaches. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, C = A.C;
  const CREAM = '#FBF6EC', INK = C.ink;

  /* ---------------- pictures ---------------- */
  const PIC = {};
  function pic(path) {
    let e = PIC[path];
    if (!e) { e = PIC[path] = { im: new Image(), ok: false }; e.im.onload = () => { e.ok = true; }; e.im.src = 'img/' + path + '.webp'; }
    return e;
  }
  /* k: height against a standing animal; mid: drawn about its middle (things that spin or get carried);
     mouth / top: where food goes and where a hat sits, as [across, up] in body heights. */
  const THING = {
    frog: { p: 'bobo/frog', happy: 'tales/frog-happy', col: '#86B94A', k: 0.9 },
    bear: { p: 'bobo/bobo', happy: 'bobo/bobo-happy', sad: 'tales/bobo-sad', sleep: 'bobo/bobo-sleep', col: '#D9913E', k: 1 },
    fox: { p: 'bobo/fox', happy: 'tales/fox-happy', sad: 'tales/fox-sad', col: '#F07F2E', k: 0.98 },
    bunny: { p: 'bobo/bunny', happy: 'tales/bunny-happy', sad: 'tales/bunny-sad', col: '#DCD5CE', k: 1 },
    panda: { p: 'star/panda', happy: 'tales/panda-happy', col: '#EFEAE2', k: 1 },
    mouse: { p: 'tales/mouse', happy: 'tales/mouse-happy', col: '#BDB3AD', k: 0.84 },
    owl: { p: 'star/owl', fly: 'tales/owl-fly', col: '#B9793F', k: 0.86 },
    train: { p: 'tales/toot-rolling', col: '#D8382F', k: 0.95, mouth: [0.3, 0.36], top: [0.3, 0.86] },
    cheese: { p: 'kitchen/cheese', col: '#F2C24B', k: 0.36, mid: 1 },
    honey: { p: 'tales/honey', col: '#E9A53A', k: 0.44, mid: 1 },
    apple: { p: 'kitchen/apple', col: '#D94B3F', k: 0.38, mid: 1 },
    sock: { p: 'kitchen/sock', col: '#2F8F8A', k: 0.42, mid: 1 },
    ball: { p: 'kitchen/ball', col: '#5B8FC7', k: 0.38, mid: 1 },
    hat: { p: 'kitchen/hat', col: '#3E3A52', k: 0.42, mid: 1 },
    bush: { p: 'tales/bush', col: '#3F7F5F', k: 0.92 },
    den: { p: 'bobo/den', col: '#B9793F', k: 1.5 },
    moon: { p: 'star/moon', col: '#F3E2A6', k: 0.8 },
    town: { p: 'toot/town', col: '#E9C79A', k: 0.5 },
    log: { k: 0.4, col: '#9A6A44', draw: drawLog },
    snowman: { p: 'tales/snowman', col: '#F4F4F4', k: 1 },
  };
  function drawLog(g, hh) {
    const w = hh * 2.5, r = hh / 2;
    g.fillStyle = '#8A5A3C'; g.beginPath(); A.rect(g, -w / 2, -hh, w, hh, r, 3, 0); g.fill();
    const gr = g.createLinearGradient(0, -hh, 0, 0); gr.addColorStop(0, 'rgba(255,220,170,.35)'); gr.addColorStop(0.5, 'rgba(255,220,170,0)'); gr.addColorStop(1, 'rgba(40,20,30,.25)');
    g.fillStyle = gr; g.beginPath(); A.rect(g, -w / 2, -hh, w, hh, r, 3, 0); g.fill();
    A.line(g, 'rgba(70,40,26,.5)', hh * 0.05, (h) => { h.moveTo(-w * 0.3, -hh * 0.7); h.lineTo(w * 0.1, -hh * 0.66); h.moveTo(-w * 0.12, -hh * 0.36); h.lineTo(w * 0.24, -hh * 0.4); h.moveTo(-w * 0.34, -hh * 0.2); h.lineTo(-w * 0.14, -hh * 0.18); });
    g.beginPath(); g.ellipse(w / 2 - r * 0.62, -r, r * 0.6, r * 0.94, 0, 0, 7); g.fillStyle = '#E3BE8C'; g.fill();
    A.line(g, 'rgba(138,90,60,.7)', hh * 0.045, (h) => { h.ellipse(w / 2 - r * 0.62, -r, r * 0.36, r * 0.58, 0, 0, 7); h.moveTo(w / 2 - r * 0.5, -r); h.ellipse(w / 2 - r * 0.62, -r, r * 0.12, r * 0.2, 0, 0, 7); });
    g.beginPath(); g.ellipse(-w * 0.2, -hh * 1.04, hh * 0.2, hh * 0.1, -0.5, 0, 7); g.fillStyle = '#6FA65F'; g.fill();
    g.beginPath(); g.ellipse(-w * 0.11, -hh * 1.08, hh * 0.18, hh * 0.09, 0.5, 0, 7); g.fillStyle = '#93C27A'; g.fill();
  }
  const BG = {
    day: { p: 'bobo/bg-day', sky: ['#7EC3EE', '#CFEAF2'], ground: '#93C83F' },
    rain: { p: 'bobo/bg-rain', sky: ['#8E9BAA', '#C5CED3'], ground: '#8DB85A' },
    snow: { p: 'tales/bg-snow', sky: ['#A9CBEA', '#E6F0F8'], ground: '#F4F8FC' },
    night: { p: 'star/bg-night', sky: ['#111C5A', '#27408F'], ground: '#2C6B58' },
    moon: { p: 'star/bg-space', sky: ['#1B1B6E', '#3A2A8C'], ground: '#F1DFA0' },
  };

  /* ---------------- the sentences ---------------- */
  /** v = which word is the doing word (for the mistakes of level 3). */
  const S = (t, lv, sc, v) => ({ t, lv, sc, v, words: t.slice(0, -1).split(' '), end: t.slice(-1) });
  const BANK = [
    S('The frog jumps.', 1, { a: 'frog', act: 'jump' }),
    S('The bear sleeps.', 1, { a: 'bear', act: 'sleep' }),
    S('The owl flies.', 1, { a: 'owl', act: 'fly' }),
    S('The fox runs.', 1, { a: 'fox', act: 'run' }),
    S('The bunny hops.', 1, { a: 'bunny', act: 'hop' }),
    S('The panda dances.', 1, { a: 'panda', act: 'dance' }),
    S('The mouse eats cheese.', 1, { a: 'mouse', act: 'eat', o: 'cheese' }),
    S('The bear eats honey.', 1, { a: 'bear', act: 'eat', o: 'honey' }),
    S('Can the frog jump?', 2, { a: 'frog', act: 'jump' }),
    S('Is the bear asleep?', 2, { a: 'bear', act: 'sleep' }),
    S('Where is the fox?', 2, { a: 'fox', act: 'peek', o: 'bush' }),
    S('The panda eats the apple.', 2, { a: 'panda', act: 'eat', o: 'apple' }, 2),
    S('The bunny hugs the panda.', 2, { a: 'bunny', act: 'hug', o: 'panda' }, 2),
    S('The frog jumps over the log.', 2, { a: 'frog', act: 'over', o: 'log' }, 2),
    S('The fox hides in the bush.', 2, { a: 'fox', act: 'hide', o: 'bush' }, 2),
    S('The owl flies to the moon.', 2, { bg: 'night', a: 'owl', act: 'fly', o: 'moon' }, 2),
    S('The train rolls to the town.', 2, { a: 'train', act: 'roll', o: 'town' }, 2),
    S('The fox runs and the bunny hops.', 3, { a: 'fox', act: 'run', b: { a: 'bunny', act: 'hop' } }, 2),
    S('The owl flies because it is night.', 3, { bg: 'night', a: 'owl', act: 'fly' }, 2),
    S('The happy mouse eats the yellow cheese.', 3, { a: 'mouse', act: 'eat', o: 'cheese' }, 3),
    S('The frog is happy because it is raining.', 3, { bg: 'rain', a: 'frog', act: 'feel', mood: 'happy' }, 2),
    S('The little frog jumps over the big log.', 3, { a: 'frog', act: 'over', o: 'log', size: { frog: 0.72, log: 1.5 } }, 3),
    S('The tired bear sleeps in the warm den.', 3, { a: 'bear', act: 'sleep', o: 'den' }, 3),
    S('The red train rolls to the little town.', 3, { a: 'train', act: 'roll', o: 'town', size: { town: 0.8 } }, 3),
    S('The fox is sad but the bunny is happy.', 3, { a: 'fox', act: 'feel', mood: 'sad', b: { a: 'bunny', act: 'feel', mood: 'happy' } }, 2),
  ];
  const WRONG = { jumps: 'jump', eats: 'eat', hides: 'hide', flies: 'fly', hugs: 'hug', rolls: 'roll', sleeps: 'sleep', runs: 'run', is: 'are' };
  const WHO = [{ t: 'The panda', a: 'panda' }, { t: 'The frog', a: 'frog' }, { t: 'The train', a: 'train' }];
  const WHAT = [{ t: 'eats a sock', act: 'eat', o: 'sock' }, { t: 'kicks a ball', act: 'kick', o: 'ball' }, { t: 'wears a hat', act: 'wear', o: 'hat' }];
  const WHERE = [{ t: 'on the moon', bg: 'moon', p: 'moon' }, { t: 'in the snow', bg: 'snow', p: 'snowman' }];
  const silly = (i, j, k) => `${WHO[i].t} ${WHAT[j].t} ${WHERE[k].t}.`;
  const KINDS = {
    naming: ['frog', 'bear', 'fox', 'owl', 'bunny', 'panda', 'mouse', 'train', 'log', 'moon', 'den', 'cheese', 'honey', 'bush', 'town', 'apple'],
    doing: ['jumps', 'sleeps', 'flies', 'runs', 'hops', 'eats', 'hides', 'rolls', 'hugs', 'dances'],
    describing: ['little', 'big', 'happy', 'sad', 'red', 'yellow', 'tired', 'warm'],
  };
  const SAY = {
    look: 'Look!', build: 'Build the sentence.', listen: 'Listen.', again: 'Try a different order.',
    cap: 'Start with the capital letter.', stop: 'The full stop goes at the end.',
    qmark: 'A question ends with a question mark.', tell: 'A telling sentence ends with a full stop.', ask: 'Is it telling or asking?',
    silly: 'Make a silly sentence!', rows: 'Pick one from each row.', play: 'Now press play.',
    fix: 'Oh no, a mistake!', tapWrong: 'Tap the wrong word.', first: 'Look at the first word.', doing: 'Look at the doing word.', swap: 'Two words are the wrong way round.',
    sort: 'Sort the words.', naming: 'Naming words.', doingB: 'Doing words.', describing: 'Describing words.',
    namingX: 'A naming word is an animal or a thing.', doingX: 'A doing word tells what happens.', describingX: 'A describing word tells what it is like.',
    dot: 'Full stop.', q: 'Question mark.',
  };
  const BIN_SAY = { naming: SAY.naming, doing: SAY.doingB, describing: SAY.describing };
  const BIN_WHY = { naming: SAY.namingX, doing: SAY.doingX, describing: SAY.describingX };
  function lines() {
    const out = Object.keys(SAY).map((k) => SAY[k]), seen = {};
    for (const s of BANK) out.push(s.t);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) out.push(silly(i, j, k));
    const word = (w) => { const key = K.voiceKey(w); if (!seen[key]) { seen[key] = 1; out.push(w); } };
    for (const s of BANK) s.words.forEach(word);
    for (const k in KINDS) KINDS[k].forEach(word);
    return out;
  }

  const ease2 = (t) => t * t;
  const sfx = {
    boing() { K.sfx.tone(280, 0.2, { to: 640, type: 'sine', vol: 0.16 }); },
    thud() { K.sfx.tone(150, 0.1, { to: 80, vol: 0.2 }); },
    chomp(i) { K.sfx.tone(200, 0.09, { type: 'square', vol: 0.08, to: 120, delay: i * 0.02 }); K.sfx.noise(0.06, { freq: 900, vol: 0.18 }); },
    snore() { K.sfx.tone(120, 0.5, { to: 90, type: 'sawtooth', vol: 0.05 }); K.sfx.tone(520, 0.35, { to: 700, type: 'sine', vol: 0.04, delay: 0.55 }); },
    chug() { K.sfx.noise(0.09, { freq: 500, vol: 0.14 }); },
    toot() { K.sfx.tone(620, 0.22, { type: 'triangle', vol: 0.2 }); K.sfx.tone(740, 0.22, { type: 'triangle', vol: 0.14 }); K.sfx.tone(620, 0.4, { type: 'triangle', vol: 0.2, delay: 0.28 }); K.sfx.tone(740, 0.4, { type: 'triangle', vol: 0.14, delay: 0.28 }); },
    rustle() { K.sfx.noise(0.16, { freq: 2600, vol: 0.1 }); },
    sad() { K.sfx.tone(392, 0.5, { to: 262, type: 'sine', vol: 0.14 }); },
    flip() { K.sfx.tone(700, 0.1, { to: 1100, type: 'triangle', vol: 0.16 }); },
  };

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, g0 = st.g;
    const GAP = 12, CH = land ? 104 : 100, MINW = 104, PITCH = CH + 12, SETS = 4;
    let R = null, done = 0, roundNo = 0, skill = 0, clean = 0, lastT = '', lastKind = '', alive = true, gen = 0;
    const junk = [];                                    // this round's nodes
    const wait = (ms) => ctx.wait(ms);
    const measure = (text, font) => { g0.save(); g0.font = font; const w = g0.measureText(text).width; g0.restore(); return w; };
    const cardFont = (f) => `700 ${f}px ${A.FONT_BODY}`;
    const isPunct = (w) => w === '.' || w === '?';
    const cardW = (w, f) => (isPunct(w) ? (L === 1 ? 76 : MINW) : Math.max(MINW, Math.ceil(measure(w, cardFont(f)) + f * (land ? 0.95 : 0.8))));

    /* ---------- backdrop: a desk of warm paper ---------- */
    st.add({ z: 0, sprite: A.sprite('senDesk' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#F0DDBB', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.05, grain: 0.3 });
      const rnd = A.rng(11), cols = [C.tomato, C.marigold, C.teal, C.blue, C.plum];
      for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H, r = 14 + rnd() * 30; g.beginPath(); A.blob(g, x, y, r, r * 0.9, 0.1, i + 2); g.fillStyle = A.alpha(cols[i % 5], 0.09); g.fill(); }
    }) });

    /* ---------- the picture ---------- */
    const sc = { x: 0, y: 0, w: 400, h: 300, bg: 'day', items: [], gy: 0, ah: 0, on: true };
    const scene = st.add({ z: 10 });
    const rr = (g, x, y, w, h, r) => { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    sc.setBox = (x, y, w, h) => {
      Object.assign(sc, { x, y, w, h, gy: h * 0.88, ah: Math.min(h * 0.56, w * 0.23) }); scene.x = x; scene.y = y;
      scene.sprite = A.sprite('senFrame' + Math.round(w) + 'x' + Math.round(h), [-14, -14, w + 28, h + 28], (g, s) => { g.beginPath(); A.rect(g, -12, -12, w + 24, h + 24, 32, 3, 1); A.paper(g, s, CREAM, { shadow: 1, depth: 1.2, box: { x: -12, y: -12, w: w + 24, h: h + 24 }, light: 0.03 }); });
    };
    scene.draw = (g) => {
      const { w, h } = sc, B = BG[sc.bg], e = pic(B.p);
      g.beginPath(); rr(g, 0, 0, w, h, 22); g.clip();
      if (e.ok) { const im = e.im, k = Math.max(w / im.width, h / im.height), ih = im.height * k; const oy = K.clamp(h * 0.52 - ih * 0.5, h - ih, 0); g.drawImage(im, (w - im.width * k) / 2, oy, im.width * k, ih); }
      else { const gr = g.createLinearGradient(0, 0, 0, h * 0.6); gr.addColorStop(0, B.sky[0]); gr.addColorStop(1, B.sky[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = B.ground; g.fillRect(0, h * 0.56, w, h); }
      if (sc.bg === 'moon') {                           // the moon to stand on
        g.beginPath(); g.ellipse(w / 2, h * 1.62, w * 0.8, h, 0, 0, 7); const gr = g.createLinearGradient(0, h * 0.6, 0, h); gr.addColorStop(0, '#F6E7AE'); gr.addColorStop(1, '#E3C987'); g.fillStyle = gr; g.fill();
        for (const [fx, fy, r] of [[0.16, 0.9, 0.05], [0.37, 0.76, 0.035], [0.7, 0.93, 0.06], [0.88, 0.82, 0.03], [0.55, 0.97, 0.03]]) { g.beginPath(); g.ellipse(w * fx, h * fy, w * r, w * r * 0.36, 0, 0, 7); g.fillStyle = 'rgba(190,150,80,.35)'; g.fill(); }
      }
      for (const it of sc.items) {
        if (!it.visible || it.noShadow) continue;
        const lift = Math.max(0, it.gy - it.y - (it.mid ? it.hh / 2 : 0)), k = Math.max(0.3, 1 - lift / (sc.ah * 2));
        g.beginPath(); g.ellipse(it.x, it.gy + 3, Math.max(8, it.hw * 0.82 * k * Math.abs(it.sx)), Math.max(4, it.hh * 0.06 * k + 3), 0, 0, 7); g.fillStyle = `rgba(40,36,60,${0.22 * k})`; g.fill();
      }
    };
    const drawThing = (g, it) => {
      const T = THING[it.thing], path = T[it.pose] || T.p, hh = it.hh;
      let e = path && pic(path); if (e && !e.ok && T.p && pic(T.p).ok) e = pic(T.p);      // the plain picture stands in while a pose is still on its way
      let wob = it.still ? 0 : Math.sin(st.t * 2.2 + it.ph) * 0.012;
      if (it.flap) wob = Math.sin(st.t * 15) * 0.07;
      if (it.dozing) wob = Math.sin(st.t * 1.6) * 0.03;
      g.save(); if (it.running) g.translate(0, -Math.abs(Math.sin(st.t * 17)) * hh * 0.07);
      g.scale(1 - wob * 0.5, 1 + wob); if (it.mid) g.translate(0, hh / 2);
      if (e && e.ok) { const w = hh * e.im.width / e.im.height; it.hw = w / 2; g.drawImage(e.im, -w / 2, -hh, w, hh); }
      else if (T.draw) { it.hw = hh * 1.25; T.draw(g, hh); }
      else {                                            // a paper stand-in until the picture arrives
        it.hw = hh * 0.36; g.beginPath(); A.blob(g, 0, -hh / 2, hh * 0.36, hh * 0.5, 0.04, 4, 10); g.fillStyle = T.col; g.fill();
        if (!T.mid && T.k > 0.8) for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * hh * 0.12, -hh * 0.68, hh * 0.035, 0, 7); g.fillStyle = INK; g.fill(); }
      }
      g.restore();
    };
    sc.clear = () => { for (const c of scene.children.slice()) c.remove(); sc.items.length = 0; weather(); };
    sc.add = (name, fx, o) => {
      o = o || {}; const T = THING[name], hh = sc.ah * T.k * (o.size || 1), gy = sc.gy + (o.dy || 0) * sc.h;
      for (const k of ['p', 'happy', 'sad', 'sleep', 'fly']) if (T[k]) pic(T[k]);
      const it = scene.add(new E.Node({ z: o.z || 20, x: fx * sc.w, y: gy - (T.mid ? hh / 2 : 0), gy, thing: name, pose: 'p', hh, hw: hh * 0.36, ph: Math.random() * 6, mid: !!T.mid, noShadow: !!o.noShadow, still: !!o.still }));
      it.draw = (g) => drawThing(g, it);
      sc.items.push(it); return it;
    };
    function weather() {
      if (sc.bg !== 'rain' && sc.bg !== 'snow') return;
      const rain = sc.bg === 'rain', n = rain ? 46 : 34, rnd = A.rng(5), ps = []; for (let i = 0; i < n; i++) ps.push([rnd(), rnd(), 0.6 + rnd() * 0.6]);
      const wn = scene.add(new E.Node({ z: 70 }));
      wn.draw = (g) => {
        for (const [fx, fy, k] of ps) {
          const y = ((fy + st.t * (rain ? 1.3 : 0.16) * k) % 1) * sc.h, x = ((fx + (rain ? 0 : Math.sin(st.t * 0.9 + fy * 9) * 0.02) + 1) % 1) * sc.w;
          if (rain) { g.strokeStyle = 'rgba(235,245,255,.75)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 22 * k); g.stroke(); }
          else { g.beginPath(); g.arc(x, y, 5 * k, 0, 7); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill(); }
        }
      };
    }
    function floater(kind, x, y, o) {
      o = o || {};
      const f = scene.add(new E.Node({ z: 80, x, y, age: 0, life: o.life || 1.5, vy: o.vy == null ? -70 : o.vy, sz: o.size || sc.ah * 0.2, col: o.col, sway: o.sway == null ? 22 : o.sway, ph: Math.random() * 6 }));
      f.draw = (g) => {
        const s = f.sz * Math.min(1, f.age * 6 + 0.3);
        if (kind === 'z') { g.font = `800 ${s * 1.3}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.fillStyle = '#FFFFFF'; g.strokeStyle = 'rgba(46,42,59,.55)'; g.lineWidth = s * 0.12; g.strokeText('z', 0, 0); g.fillText('z', 0, 0); }
        else if (kind === 'note') { g.fillStyle = f.col || C.plum; g.beginPath(); g.ellipse(-s * 0.2, s * 0.3, s * 0.3, s * 0.22, -0.4, 0, 7); g.fill(); g.fillRect(s * 0.02, -s * 0.6, s * 0.1, s * 0.9); g.beginPath(); g.moveTo(s * 0.1, -s * 0.6); g.quadraticCurveTo(s * 0.6, -s * 0.5, s * 0.5, -s * 0.05); g.quadraticCurveTo(s * 0.4, -s * 0.35, s * 0.1, -s * 0.3); g.fill(); }
        else if (kind === 'heart') { g.fillStyle = C.tomato; g.beginPath(); g.moveTo(0, s * 0.5); g.bezierCurveTo(-s * 1.1, -s * 0.2, -s * 0.5, -s * 0.9, 0, -s * 0.35); g.bezierCurveTo(s * 0.5, -s * 0.9, s * 1.1, -s * 0.2, 0, s * 0.5); g.fill(); g.beginPath(); g.ellipse(-s * 0.3, -s * 0.3, s * 0.1, s * 0.16, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill(); }
        else if (kind === 'tear') { g.fillStyle = '#7EC0EA'; g.beginPath(); g.moveTo(0, -s * 0.5); g.quadraticCurveTo(s * 0.45, s * 0.2, 0, s * 0.4); g.quadraticCurveTo(-s * 0.45, s * 0.2, 0, -s * 0.5); g.fill(); }
        else if (kind === 'spark') { g.fillStyle = f.col || '#FFE27A'; g.rotate(f.age * 3); g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, r = i % 2 ? s * 0.22 : s * 0.6; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); }
        else { g.beginPath(); g.arc(0, 0, s * (0.4 + f.age * 0.5), 0, 7); g.fillStyle = f.col || 'rgba(255,255,255,.85)'; g.fill(); }   // puff
      };
      f.update = (dt) => { f.age += dt; f.y += f.vy * dt; f.x += Math.sin(f.age * 3 + f.ph) * f.sway * dt; f.alpha = Math.max(0, Math.min(1, (f.life - f.age) * 2.5)); if (f.age >= f.life) f.remove(); };
      return f;
    }
    const sparks = (it, n) => { for (let i = 0; i < (n || 5); i++) floater('spark', it.x + (Math.random() - 0.5) * it.hh, it.y - it.hh * (0.4 + Math.random() * 0.7), { vy: -50 - Math.random() * 60, life: 0.9 + Math.random() * 0.5, size: sc.ah * (0.1 + Math.random() * 0.08) }); K.sfx.sparkle(); };
    const front = (it, z) => { it.z = z; scene._sorted = false; };

    /** One springy hop to x. */
    async function arc(it, x, lift, dur) {
      await it.to({ sy: 0.84, sx: 1.12 }, { dur: 0.09, ease: 'out' });
      sfx.boing(); it.to({ sy: 1.06, sx: 0.95 }, { dur: 0.14 });
      if (x !== it.x) it.to({ x }, { dur, ease: 'linear' });
      const y0 = it.y;
      await it.to({ y: y0 - lift }, { dur: dur / 2, ease: 'out' });
      await it.to({ y: y0 }, { dur: dur / 2, ease: ease2 });
      sfx.thud(); await it.to({ sy: 0.86, sx: 1.12 }, { dur: 0.07, ease: 'out' });
      it.to({ sy: 1, sx: 1 }, { dur: 0.35, ease: 'elastic' });
    }
    const POS = { jump: 0.5, sleep: 0.5, fly: 0.2, run: 0.15, hop: 0.15, dance: 0.5, eat: 0.4, hug: 0.24, over: 0.18, hide: 0.2, peek: 0.6, roll: 0.2, kick: 0.36, wear: 0.5, feel: 0.5 };
    const ACT = {
      async jump(c) { for (let i = 0; i < 2; i++) await arc(c.a, c.a.x, sc.ah * 0.8, 0.5); c.a.pose = 'happy'; sparks(c.a); await wait(350); },
      async over(c) { await arc(c.a, c.a.x, sc.ah * 0.22, 0.28); await arc(c.a, sc.w * 0.82, c.o.hh + sc.ah * 0.7, 0.9); c.a.pose = 'happy'; sparks(c.a); await wait(400); },
      async hop(c) { const a = c.a, dir = a.x < sc.w / 2 ? 1 : -1, x0 = a.x; for (let i = 1; i <= 4; i++) await arc(a, x0 + dir * sc.w * 0.17 * i, sc.ah * 0.42, 0.34); a.pose = 'happy'; await wait(200); },
      async run(c) {
        const a = c.a, dir = a.x < sc.w / 2 ? 1 : -1;
        await a.to({ rot: 0.15 * dir }, { dur: 0.15 }); a.running = true; K.sfx.whoosh();
        for (let i = 0; i < 6; i++) ctx.after(i * 190, () => { if (a.parent) { floater('puff', a.x - dir * a.hw * 0.8, a.gy - 6, { vy: -20, life: 0.5, size: sc.ah * 0.14, col: 'rgba(255,250,235,.8)', sway: 0 }); K.sfx.tone(240 + (i % 2) * 60, 0.05, { vol: 0.08 }); } });
        await a.to({ x: sc.w * (dir > 0 ? 0.85 : 0.15) }, { dur: 1.25, ease: 'inOut' });
        a.running = false; await a.to({ rot: 0 }, { dur: 0.25, ease: 'back' }); a.pose = 'happy'; await wait(250);
      },
      async sleep(c) {
        const a = c.a; await a.to({ sy: 1.06, sx: 0.97 }, { dur: 0.5, ease: 'inOut' }); a.pose = 'sleep';
        await a.to({ sy: 0.94, sx: 1.03 }, { dur: 0.45, ease: 'inOut' }); a.to({ sy: 1, sx: 1 }, { dur: 0.3 }); a.dozing = true;
        for (let i = 0; i < 3; i++) { sfx.snore(); floater('z', a.x + a.hw * 0.7 + i * sc.ah * 0.12, a.y - a.hh * 0.8, { vy: -55, life: 1.7, size: sc.ah * (0.16 + i * 0.05), sway: 30 }); await wait(650); }
        await wait(300);
      },
      async fly(c) {
        const a = c.a; a.pose = 'fly'; a.flap = true; K.sfx.whoosh(); front(a, 40);
        if (c.o) {
          a.to({ x: c.o.x - c.o.hw * 0.2 }, { dur: 2.1, ease: 'inOut' }); a.to({ sx: 0.6, sy: 0.6 }, { dur: 2.1, ease: 'inOut' });
          await a.to({ y: c.o.y - c.o.hh * 0.28 }, { dur: 2.1, ease: 'inOut' });
          sparks(a, 7); c.o.to({ rot: 0.1 }, { dur: 0.15 }).then(() => c.o.to({ rot: 0 }, { dur: 0.6, ease: 'elastic' })); await wait(500);
        } else {
          a.to({ x: sc.w * 0.8 }, { dur: 1.5, ease: 'inOut' }); await a.to({ y: sc.h * 0.4 }, { dur: 0.9, ease: 'out' }); await a.to({ y: sc.h * 0.56 }, { dur: 0.6, ease: 'inOut' });
          K.sfx.whoosh(); a.to({ x: sc.w * 0.5 }, { dur: 1.1, ease: 'inOut' }); await a.to({ y: sc.h * 0.44 }, { dur: 1.1, ease: 'inOut' }); sparks(a);
          await wait(300);
        }
      },
      async dance(c) {
        const a = c.a, x0 = a.x, notes = [523, 659, 784, 659]; a.pose = 'happy';
        for (let i = 0; i < 4; i++) { const d = i % 2 ? -1 : 1; K.sfx.note(notes[i], 0.3); floater('note', a.x + d * a.hw * 1.2, a.y - a.hh * 0.9, { col: [C.plum, C.tomato, C.teal, C.blue][i], size: sc.ah * 0.24 }); a.to({ rot: d * 0.2 }, { dur: 0.2, ease: 'inOut' }); await arc(a, x0 + d * sc.w * 0.05, sc.ah * 0.3, 0.34); }
        await a.to({ rot: 0 }, { dur: 0.25, ease: 'back' }); sparks(a); await wait(250);
      },
      async eat(c) {
        const a = c.a, o = c.o, T = THING[a.thing], m = T.mouth || [0, 0.5]; front(o, 45);
        o.to({ x: a.x + m[0] * a.hh * 1.3 }, { dur: 0.55, ease: 'inOut' }); o.to({ rot: 0.5 }, { dur: 0.55 }); K.sfx.whoosh();
        await o.to({ y: a.gy - m[1] * a.hh }, { dur: 0.55, ease: 'back' });
        for (let i = 0; i < 3; i++) { sfx.chomp(i); const k = [0.7, 0.4, 0.01][i]; o.to({ sx: k, sy: k }, { dur: 0.16 }); await a.to({ sy: 0.93, sx: 1.05 }, { dur: 0.09, ease: 'out' }); await a.to({ sy: 1, sx: 1 }, { dur: 0.13 }); await wait(60); }
        o.visible = false; a.pose = 'happy'; sparks(a); await arc(a, a.x, sc.ah * 0.3, 0.4); await wait(200);
      },
      async hug(c) {
        const a = c.a, o = c.o, mid = sc.w / 2, d = (a.hw + o.hw) * 0.42, ax = a.x, ox = o.x;
        for (let i = 1; i <= 2; i++) await Promise.all([arc(a, ax + (mid - d - ax) * i / 2, sc.ah * 0.3, 0.36), arc(o, ox + (mid + d - ox) * i / 2, sc.ah * 0.3, 0.36)]);
        a.pose = 'happy'; o.pose = 'happy'; a.to({ rot: 0.13 }, { dur: 0.25, ease: 'back' }); o.to({ rot: -0.13 }, { dur: 0.25, ease: 'back' });
        K.sfx.sparkle(); for (let i = 0; i < 3; i++) { floater('heart', mid + (i - 1) * sc.ah * 0.25, a.y - a.hh * (0.9 + (i % 2) * 0.15), { size: sc.ah * (0.16 + (i === 1 ? 0.08 : 0)), life: 1.6, vy: -50 }); }
        await wait(1100); a.to({ rot: 0 }, { dur: 0.3 }); o.to({ rot: 0 }, { dur: 0.3 }); await wait(300);
      },
      async hide(c) {
        const a = c.a, b = c.o; front(a, 10);
        await arc(a, b.x - b.hw * 0.5, sc.ah * 0.4, 0.4); await arc(a, b.x, sc.ah * 0.5, 0.42);
        a.still = true; await a.to({ sy: 0.45 }, { dur: 0.3, ease: 'inOut' }); sfx.rustle();
        await b.to({ rot: 0.05 }, { dur: 0.1 }); await b.to({ rot: -0.05 }, { dur: 0.12 }); await b.to({ rot: 0 }, { dur: 0.3, ease: 'elastic' });
        await wait(350); a.pose = 'happy'; K.sfx.pop(); await a.to({ sy: 0.86 }, { dur: 0.22, ease: 'back' }); await wait(600);
        await a.to({ sy: 0.45 }, { dur: 0.25, ease: 'inOut' }); sfx.rustle(); b.to({ rot: 0.04 }, { dur: 0.1 }).then(() => b.to({ rot: 0 }, { dur: 0.4, ease: 'elastic' })); await wait(450);
      },
      async peek(c) {
        const a = c.a, b = c.o;
        for (let i = 0; i < 2; i++) { sfx.rustle(); await b.to({ rot: 0.06 }, { dur: 0.1 }); await b.to({ rot: -0.06 }, { dur: 0.12 }); await b.to({ rot: 0 }, { dur: 0.25, ease: 'elastic' }); await wait(150); }
        a.pose = 'happy'; K.sfx.pop(); await a.to({ sy: 1.1 }, { dur: 0.25, ease: 'back' }); await wait(350);
        front(a, 45); await arc(a, b.x - b.hw - a.hw * 0.7, sc.ah * 0.6, 0.55); sparks(a); await wait(350);
      },
      async roll(c) {
        const a = c.a; a.running = true;
        for (let i = 0; i < 8; i++) ctx.after(i * 220, () => { if (a.parent) { sfx.chug(); floater('puff', a.x + a.hw * 0.42, a.y - a.hh * 0.95, { vy: -60, life: 0.9, size: sc.ah * 0.2 }); } });
        await a.to({ x: sc.w * 0.56 }, { dur: 1.9, ease: 'inOut' }); a.running = false; sfx.toot();
        if (c.o) { sparks(c.o, 6); c.o.to({ sy: 1.08 }, { dur: 0.12 }).then(() => c.o.to({ sy: 1 }, { dur: 0.4, ease: 'elastic' })); }
        await wait(800);
      },
      async kick(c) {
        const a = c.a, o = c.o, x0 = a.x;
        await a.to({ rot: -0.14 }, { dur: 0.2 }); a.to({ rot: 0.16 }, { dur: 0.1 }); await a.to({ x: x0 + sc.w * 0.05 }, { dur: 0.1 });
        K.sfx.pop(); sfx.thud(); K.sfx.whoosh(); front(o, 45); o.noShadow = true;
        o.to({ rot: 14 }, { dur: 1.3, ease: 'linear' }); o.to({ x: sc.w * 1.2 }, { dur: 1.3, ease: 'linear' });
        a.to({ rot: 0 }, { dur: 0.3, ease: 'back' }); a.to({ x: x0 }, { dur: 0.3 });
        await o.to({ y: sc.h * 0.12 }, { dur: 0.6, ease: 'out' }); a.pose = 'happy'; sparks(a);
        await o.to({ y: sc.h * 0.3 }, { dur: 0.7, ease: ease2 }); await arc(a, a.x, sc.ah * 0.3, 0.4);
      },
      async wear(c) {
        const a = c.a, o = c.o, T = THING[a.thing], top = T.top || [0, 0.95];
        o.visible = true; o.x = a.x + top[0] * a.hh * 1.3; o.y = -o.hh; o.rot = -0.5; K.sfx.whoosh(); front(o, 45);
        o.to({ rot: 0 }, { dur: 0.6 }); await o.to({ y: a.gy - top[1] * a.hh - o.hh * 0.18 }, { dur: 0.6, ease: 'back' });
        K.sfx.pop(); a.pose = 'happy'; await a.to({ sy: 0.93, sx: 1.05 }, { dur: 0.08 }); a.to({ sy: 1, sx: 1 }, { dur: 0.4, ease: 'elastic' }); sparks(a);
        for (let i = 0; i < 2; i++) { const d = i ? -1 : 1; a.to({ rot: d * 0.06 }, { dur: 0.22, ease: 'inOut' }); await o.to({ rot: d * 0.16 }, { dur: 0.22, ease: 'inOut' }); }
        a.to({ rot: 0 }, { dur: 0.2 }); await o.to({ rot: 0 }, { dur: 0.3, ease: 'back' }); await wait(250);
      },
      async feel(c) {
        const a = c.a;
        if (c.mood === 'sad') { a.pose = 'sad'; sfx.sad(); await a.to({ sy: 0.95 }, { dur: 0.5, ease: 'inOut' }); for (let i = 0; i < 2; i++) { floater('tear', a.x + (i ? 1 : -1) * a.hw * 0.5, a.y - a.hh * 0.62, { vy: 70, life: 0.9, size: sc.ah * 0.14, sway: 0 }); await wait(420); } await wait(250); }
        else { a.pose = 'happy'; for (let i = 0; i < 2; i++) await arc(a, a.x, sc.ah * 0.45, 0.42); sparks(a); await wait(250); }
      },
    };
    /** Put the actors and things in their places for a sentence. */
    function stage(spec) {
      sc.bg = spec.bg || 'day'; sc.clear();
      const size = spec.size || {}, two = !!spec.b, cast = [];
      [spec, spec.b].forEach((cl, side) => {
        if (!cl) return;
        let fx = POS[cl.act]; if (two) fx = cl.act === 'feel' ? (side ? 0.68 : 0.32) : side ? 0.85 : 0.15;
        const c = { act: cl.act, mood: cl.mood, a: null, o: null };
        if (cl.a) c.a = sc.add(cl.a, fx, { size: size[cl.a], z: 20 + side * 2 });
        const o = cl.o, act = cl.act;
        if (o) {
          if (act === 'eat') c.o = sc.add(o, fx + 0.2, { size: size[o], z: 25 });
          else if (act === 'hug') c.o = sc.add(o, 0.76, { size: size[o] });
          else if (act === 'over') c.o = sc.add(o, 0.5, { size: size[o], z: 15, still: true });
          else if (act === 'hide' || act === 'peek') { c.o = sc.add(o, act === 'hide' ? 0.66 : fx, { z: 30, still: true }); if (act === 'peek' && c.a) { c.a.z = 10; c.a.sy = 0.45; c.a.still = true; } }
          else if (act === 'roll') c.o = sc.add(o, 0.86, { size: size[o], z: 8, dy: -0.07, still: true, noShadow: true });
          else if (act === 'kick') c.o = sc.add(o, fx + 0.14, { z: 25 });
          else if (act === 'wear') { c.o = sc.add(o, fx, { z: 25, noShadow: true }); c.o.visible = false; }
          else if (act === 'fly') { c.o = sc.add(o, 0.82, { z: 5, still: true, noShadow: true }); c.o.y = sc.h * 0.46; }
          else if (act === 'sleep') { c.o = sc.add(o, 0.5, { z: 5, still: true }); if (c.a) c.a.hh *= 0.8; }
        }
        cast.push(c);
      });
      sc.cast = cast; scene._sorted = false;
      return cast;
    }
    const playing = { n: 0 };
    async function play(spec, restage) {
      const cast = restage === false && sc.cast ? sc.cast : stage(spec);
      playing.n++;
      await wait(restage === false ? 60 : 250);
      await Promise.all(cast.map((c) => (c.a && ACT[c.act] ? ACT[c.act](c) : null)));
      playing.n--;
    }

    /* ---------- cards ---------- */
    function cardSprite(word, f, state) {
      const w = cardW(word, f);
      return A.sprite(`senCard|${word}|${f}|${state}|${CH}`, [-w / 2 - 8, -CH / 2 - 8, w + 16, CH + 16], (g, s) => {
        const box = { x: -w / 2, y: -CH / 2, w, h: CH };
        if (state === 'glow') { g.beginPath(); A.rect(g, -w / 2 - 7, -CH / 2 - 7, w + 14, CH + 14, 28, 5, 0.5); g.fillStyle = C.marigold; g.fill(); }
        g.beginPath(); A.rect(g, -w / 2, -CH / 2, w, CH, 22, word.length + w, 0.8);
        A.paper(g, s, state === 'done' ? '#E6F3DA' : state === 'bad' ? '#FBE3D6' : CREAM, { shadow: 1, box, light: 0.04 });
        A.line(g, state === 'done' ? 'rgba(79,135,82,.35)' : 'rgba(91,143,199,.28)', 3, (h) => { h.moveTo(-w / 2 + 16, CH * 0.27); h.lineTo(w / 2 - 16, CH * 0.27); });
        g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        if (isPunct(word)) { g.font = `800 ${f * 1.5}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.fillStyle = word === '?' ? C.plum : C.tomato; g.fillText(word, 0, word === '?' ? f * 0.5 : f * 0.36); return; }
        g.font = cardFont(f); const tw = g.measureText(word).width, x0 = -tw / 2, y0 = f * 0.34;
        if (/^[A-Z]/.test(word)) { const c1 = word.charAt(0), cw = g.measureText(c1).width; g.fillStyle = C.tomato; g.fillText(c1, x0, y0); g.fillStyle = INK; g.fillText(word.slice(1), x0 + cw, y0); }
        else { g.fillStyle = INK; g.fillText(word, x0, y0); }
      });
    }
    function skin(n) { n.w = cardW(n.word, n.f); n.hit = { x: -n.w / 2, y: -CH / 2, w: n.w, h: CH }; n.sprite = cardSprite(n.word, n.f, n.state || ''); }
    function setState(n, s) { if (n.state !== s) { n.state = s; skin(n); } }
    const cardLabel = (w) => 'card ' + (w === '.' ? 'full stop' : w === '?' ? 'question mark' : w);
    function addCard(word, x, y, delay) {
      const n = st.add({ z: 40, x, y: y + 40, tx: x, ty: y, home: { x, y }, word, punct: isPunct(word), where: 'tray', base: 0, wob: 0, pop: 0, glow: false, held: false, state: '', misses: 0, label: cardLabel(word), pressable: false, pad: 4, alpha: 0, f: R.f });
      skin(n);
      n.to({ base: 1 }, { dur: 0.4, ease: 'back', delay: delay || 0 }); n.to({ alpha: 1 }, { dur: 0.2, delay: delay || 0 });
      n.update = (dt) => {
        if (!n.held) { const k = Math.min(1, dt * 13); n.x += (n.tx - n.x) * k; n.y += (n.ty - n.y) * k; }
        n.wob = Math.max(0, n.wob - dt * 1.7); n.pop = Math.max(0, n.pop - dt * 3.5);
        n.rot = Math.sin(n.wob * 24) * 0.13 * n.wob + (n.held ? 0.05 : 0);
        const k2 = n.base * (1 + n.pop * 0.14 + (n.glow ? 0.04 + Math.sin(st.t * 6) * 0.05 : 0) + (n.held ? 0.08 : 0));
        n.sx = k2 * (n.turn == null ? 1 : n.turn); n.sy = k2;
        setState(n, n.fixed ? 'done' : n.glow || n.sel ? 'glow' : '');
      };
      n.onDown = (p) => { if (!R || R.lock || n.gone) return; n.grab = true; n.pop = 1; K.sfx.tap(); if (R.drag) { n.held = true; n.ox = p.x - n.x; n.oy = p.y - n.y; n.z = 60; st.root._sorted = false; } };
      n.onMove = (p) => { if (n.held) { n.x = p.x - n.ox; n.y = p.y - n.oy; } };
      n.onUp = (p, e, s) => { if (!n.grab) return; n.grab = false; const was = n.held; n.held = false; n.z = 40; st.root._sorted = false; if (!R || R.lock || n.gone) return; if (!was || s.moved < 24) R.tap(n); else R.drop(n, p); };
      n.onTap = (p) => { if (!p && R && !R.lock && !n.gone) R.tap(n); };
      junk.push(n); R.cards.push(n);
      return n;
    }
    const sayWord = (n) => ctx.say(n.word === '.' ? SAY.dot : n.word === '?' ? SAY.q : n.word);
    function flow(ws, maxW, gap) {
      const rows = [[]]; let x = 0;
      ws.forEach((w, i) => { if (x > 0 && x + w > maxW) { rows.push([]); x = 0; } rows[rows.length - 1].push(i); x += w + gap; });
      const pos = [];
      rows.forEach((row, r) => { const tot = row.reduce((a, i) => a + ws[i], 0) + gap * (row.length - 1); let cx = -tot / 2; for (const i of row) { pos[i] = { x: cx + ws[i] / 2, row: r }; cx += ws[i] + gap; } });
      return { pos, rows: rows.length };
    }

    /* ---------- the writing line ---------- */
    const strip = st.add({ z: 20, visible: false });
    strip.draw = (g) => {
      if (!R || !R.strip) return;
      const q = R.strip, wv = W - (land ? 60 : 24);
      for (let r = 0; r < q.rows; r++) {
        const y = q.y0 + r * PITCH;
        g.beginPath(); rr(g, (W - wv) / 2, y - CH / 2 - 8, wv, CH + 16, 26); g.fillStyle = 'rgba(255,252,244,.6)'; g.fill();
        A.line(g, 'rgba(91,143,199,.4)', 3, (h) => { h.moveTo((W - wv) / 2 + 24, y + CH / 2 - 4); h.lineTo((W + wv) / 2 - 24, y + CH / 2 - 4); });
      }
      g.setLineDash([10, 9]); g.lineWidth = 3.5; g.strokeStyle = 'rgba(46,42,59,.3)';
      for (const s of R.ghosts || []) { g.beginPath(); rr(g, s.x - 44, s.y - CH / 2 + 8, 88, CH - 16, 18); g.stroke(); }
      g.setLineDash([]);
    };
    const rowY = (r) => R.strip.y0 + r * PITCH;
    function restrip() {
      const n = R.answer.length, ws = R.placed.map((c) => c.w);
      for (let i = R.placed.length; i < n; i++) ws.push(88);
      const fl = flow(ws, W - (land ? 80 : 36), GAP);
      R.placed.forEach((c, i) => { c.tx = W / 2 + fl.pos[i].x; c.ty = rowY(Math.min(fl.pos[i].row, R.strip.rows - 1)); });
      R.ghosts = ws.slice(R.placed.length).map((_, k) => { const p = fl.pos[R.placed.length + k]; return { x: W / 2 + p.x, y: rowY(Math.min(p.row, R.strip.rows - 1)) }; });
    }
    /** Sizes for this round: the font, the rows, and where picture, line and tray sit. */
    function layout(tokens, trayWords, o) {
      o = o || {};
      const fonts = land ? [56, 50, 45, 40] : [46, 42, 38], maxW = W - (land ? 80 : 36);
      let f, a, b;
      fit: for (const most of [1, 2, 3, 9]) for (f of fonts) { a = flow(tokens.map((w) => cardW(w, f)), maxW, GAP); b = flow(trayWords.map((w) => cardW(w, f)), maxW, GAP + 8); if (a.rows <= most && b.rows <= Math.max(2, most)) break fit; }
      const top = land ? 132 : 150, stripH = a.rows * PITCH + 8, trayH = trayWords.length ? b.rows * (PITCH + 6) : 0, avail = H - (land ? 50 : 70) - top;
      const sceneH = o.noScene ? 0 : K.clamp(avail - stripH - trayH - 64, 200, land ? 410 : 340);
      const spare = Math.max(0, avail - sceneH - stripH - trayH - 64);
      const stripTop = top + sceneH + 34 + spare * (trayWords.length ? 0.25 : 0.3), trayTop = stripTop + stripH + 30 + spare * 0.3;
      R.f = f; R.strip = { y0: stripTop + CH / 2 + 4, rows: a.rows };
      R.trayPos = trayWords.map((w, i) => ({ x: W / 2 + b.pos[i].x, y: trayTop + CH / 2 + b.pos[i].row * (PITCH + 6) }));
      if (!o.noScene) { const sw = Math.min(W - (land ? 60 : 30), sceneH * 2.5); sc.setBox((W - sw) / 2, top, sw, sceneH); }
      scene.visible = !o.noScene; strip.visible = true;
    }

    /* ---------- little stars: rounds done in this set ---------- */
    const stars = st.add({ ui: true, z: 30, x: W / 2, y: 0, pop: 0 });
    stars.draw = (g) => {
      const y = land ? 962 : H - 34;
      for (let i = 0; i < SETS; i++) {
        const on = i < done, k = on && i === done - 1 ? 1 + stars.pop * 0.6 : 1;
        g.save(); g.translate((i - (SETS - 1) / 2) * 44, y); g.scale(k, k); g.beginPath();
        for (let j = 0; j < 10; j++) { const a = (j / 10) * 6.283 - 1.571, r = j % 2 ? 7.5 : 16; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.closePath(); g.fillStyle = on ? C.marigold : 'rgba(46,42,59,.14)'; g.fill(); g.restore();
      }
    };
    stars.update = (dt) => { stars.pop = Math.max(0, stars.pop - dt * 2); };

    /* ---------- rounds ---------- */
    function clearRound() {
      for (const n of junk.splice(0)) { n.gone = true; n.to({ alpha: 0 }, { dur: 0.2 }).then(() => n.remove()); }
      strip.visible = false;
    }
    async function roundDone(misses) {
      const my = gen; done++; stars.pop = 1; K.sfx.ding(); roundNo++;
      if (misses >= 2) { skill = Math.max(0, skill - 1); clean = 0; } else if (misses === 0 && ++clean >= 2) { skill = Math.min(2, skill + 1); clean = 0; }
      await wait(650);
      if (my !== gen) return;
      if (done >= SETS) { await ctx.celebrate({ ms: 3400 }); done = 0; }
      if (my === gen) next();
    }
    const SEQ = { 1: ['build'], 2: ['build', 'ask', 'silly', 'build', 'ask'], 3: ['build', 'fix', 'sort', 'build', 'fix', 'silly'] };
    function pickSentence(pool) {
      const list = pool.filter((s) => s.t !== lastT); const s = K.pick(list.length ? list : pool); lastT = s.t; return s;
    }
    function buildPool(kind) {
      if (L === 1) return BANK.filter((s) => s.lv === 1 && (skill > 0 || s.words.length === 3));
      if (L === 2) return BANK.filter((s) => s.lv === 2 && (skill > 0 || s.words.length <= 5) && (kind === 'ask' || roundNo > 0 || s.end === '.'));
      return BANK.filter((s) => s.lv === 3 && (skill > 0 ? true : s.words.length <= 7));
    }
    function next(force) {
      if (!alive) return;
      clearRound();
      const seq = SEQ[L] || SEQ[1], kind = force || seq[roundNo % seq.length];
      lastKind = kind;
      const my = ++gen;
      ctx.after(260, () => { if (my === gen) ({ build: startBuild, ask: startBuild, silly: startSilly, fix: startFix, sort: startSort })[kind](kind); });
    }

    /* ----- build: put the cards in order ----- */
    async function startBuild(kind, forced) {
      const s = forced || pickSentence(buildPool(kind));
      const answer = s.words.concat(L >= 2 ? [s.end] : []);
      const extra = L >= 2 && (kind === 'ask' || skill > 0) ? [s.end === '.' ? '?' : '.'] : [];
      let tray = K.shuffle(answer.concat(extra)), guard = 0;
      while (guard++ < 20 && tray.slice(0, answer.length).every((w, i) => w === answer[i])) tray = K.shuffle(tray);
      const me = (R = { kind: 'build', s, answer, placed: [], cards: [], misses: 0, lock: true, drag: true, both: extra.length > 0 });
      layout(answer.concat(L === 1 ? ['.'] : []), tray);
      restrip();
      R.tap = (n) => {
        if (n.where === 'tray') { sayWord(n); if (R.placed.length < answer.length) { n.where = 'strip'; R.placed.push(n); changed(); } else n.wob = 0.6; }
        else { n.where = 'tray'; R.placed.splice(R.placed.indexOf(n), 1); n.tx = n.home.x; n.ty = n.home.y; K.sfx.tone(380, 0.08, { to: 300, vol: 0.12 }); changed(); }
      };
      R.drop = (n, p) => {
        const y0 = rowY(0) - CH / 2 - 50, y1 = rowY(R.strip.rows - 1) + CH / 2 + 50, i0 = R.placed.indexOf(n);
        if (i0 >= 0) R.placed.splice(i0, 1);
        if (n.y > y0 && n.y < y1 && R.placed.length < answer.length) {
          let idx = 0; for (const c of R.placed) if (c.ty < n.y - PITCH / 2 || (Math.abs(c.ty - n.y) <= PITCH / 2 && c.tx < n.x)) idx++;
          if (n.where === 'tray') sayWord(n); else K.sfx.tap();
          n.where = 'strip'; R.placed.splice(idx, 0, n);
        } else { n.where = 'tray'; n.tx = n.home.x; n.ty = n.home.y; K.sfx.tone(380, 0.08, { to: 300, vol: 0.12 }); }
        changed();
      };
      const reglow = () => { const want = R.misses >= 2 && R.placed.every((c, i) => c.word === answer[i]) ? answer[R.placed.length] : null; let got = false; for (const c of R.cards) { c.glow = !got && want != null && c.where === 'tray' && c.word === want; if (c.glow) got = true; } };
      function changed() { restrip(); reglow(); if (R.placed.length === answer.length) { R.lock = true; ctx.after(420, () => { if (R === me) check(); }); } }
      function check() {
        if (R.placed.every((c, i) => c.word === answer[i])) return win();
        R.misses++; K.sfx.whoops();
        const first = R.placed.findIndex((c, i) => c.word !== answer[i]), pIdx = R.placed.findIndex((c) => c.punct), lastC = R.placed[answer.length - 1];
        let hint = SAY.again;
        if (L === 1) hint = SAY.listen + ' ' + s.t;
        else if (pIdx >= 0 && pIdx < answer.length - 1) hint = s.end === '?' ? SAY.qmark : SAY.stop;
        else if (lastC.punct && lastC.word !== s.end) hint = s.end === '?' ? SAY.qmark : SAY.tell;
        else if (!lastC.punct) hint = s.end === '?' ? SAY.qmark : SAY.stop;
        else if (first === 0) hint = SAY.cap;
        else if (R.misses >= 2) hint = SAY.listen + ' ' + s.t;
        const back = R.placed.splice(first);
        back.forEach((c, i) => { c.wob = 1; ctx.after(350 + i * 90, () => { if (R === me) { c.where = 'tray'; c.tx = c.home.x; c.ty = c.home.y; } }); });
        ctx.after(400 + back.length * 90, () => { if (R !== me) return; restrip(); reglow(); R.lock = false; });
        ctx.say(hint);
      }
      async function win() {
        R.lock = true; K.sfx.ding();
        for (const c of R.cards) { c.glow = false; if (c.where === 'tray') { c.gone = true; c.to({ alpha: 0 }, { dur: 0.3 }); } }
        if (L === 1) { const d = addCard('.', W + 80, rowY(0), 0); d.where = 'strip'; R.placed.push(d); R.answer = answer.concat(['.']); restrip(); R.ghosts = []; }
        R.placed.forEach((c, i) => ctx.after(i * 90, () => { c.fixed = true; c.pop = 1; K.sfx.step(i); }));
        const mid = R.placed[Math.floor(R.placed.length / 2)]; ctx.fx.burst(mid.tx, mid.ty - 30, { n: 14 });
        await wait(350);
        const talk = ctx.prompt(s.t);
        await Promise.all([play(s.sc, false), Promise.race([talk, wait(4500)]), wait(1800)]);
        await wait(700);
        if (R === me) roundDone(me.misses);
      }
      R.win = win;
      if (L === 1) {                                    // the picture first, then the words
        ctx.prompt(SAY.look + ' ' + SAY.build, { silent: true }); ctx.say(SAY.look);
        await play(s.sc); await wait(500);
        if (R !== me) return;
        stage(s.sc);
      } else stage(s.sc);
      tray.forEach((w, i) => { const p = R.trayPos[i]; addCard(w, p.x, p.y, i * 0.07); });
      K.sfx.whoosh(); R.lock = false;
      ctx.prompt(L === 1 ? SAY.build : R.both ? SAY.build + ' ' + SAY.ask : SAY.build);
    }

    /* ----- fix: one mistake in the sentence ----- */
    function startFix(kind, forcedType) {
      const s = pickSentence(BANK.filter((x) => x.v && (x.lv === 3 || (x.lv === 2 && skill === 0))));
      const type = forcedType || K.pick(['cap', 'order', 'verb'].filter((t) => t !== startFix.last)); startFix.last = type;
      const answer = s.words.concat([s.end]), shown = answer.slice(), bad = [];
      if (type === 'cap') { shown[0] = shown[0].toLowerCase(); bad.push(0); }
      else if (type === 'verb') { shown[s.v] = WRONG[shown[s.v]] || shown[s.v]; bad.push(s.v); }
      else { const t = shown[s.v]; shown[s.v] = shown[s.v - 1]; shown[s.v - 1] = t; bad.push(s.v - 1, s.v); }
      const me = (R = { kind: 'fix', type, s, answer, placed: [], cards: [], misses: 0, lock: true, drag: false, bad });
      layout(answer, []); stage(s.sc);
      const fl = flow(shown.map((w) => cardW(w, R.f)), W - (land ? 80 : 36), GAP);
      shown.forEach((w, i) => { const c = addCard(w, W / 2 + fl.pos[i].x, rowY(Math.min(fl.pos[i].row, R.strip.rows - 1)), i * 0.06); c.where = 'strip'; R.placed.push(c); });
      R.ghosts = [];
      R.tap = async (n) => {
        const i = R.placed.indexOf(n);
        if (bad.indexOf(i) < 0) {
          R.misses++; n.wob = 1; K.sfx.whoops();
          ctx.say(type === 'cap' ? SAY.first : type === 'verb' ? SAY.doing : SAY.swap);
          if (R.misses >= 2) bad.forEach((b) => { R.placed[b].glow = true; });
          return;
        }
        R.lock = true; sfx.flip(); bad.forEach((b) => { R.placed[b].glow = false; });
        if (type === 'order') { const a = R.placed[bad[0]]; R.placed[bad[0]] = R.placed[bad[1]]; R.placed[bad[1]] = a; a.pop = 1; R.placed[bad[0]].pop = 1; restrip(); R.ghosts = []; }
        else { n.turn = 1; await n.to({ turn: 0 }, { dur: 0.14, ease: 'inOut' }); n.word = answer[i]; n.label = cardLabel(n.word); skin(n); restrip(); R.ghosts = []; await n.to({ turn: 1 }, { dur: 0.3, ease: 'back' }); }
        ctx.fx.burst(n.tx, n.ty - 20, { n: 10 });
        await wait(380); K.sfx.ding();
        R.placed.forEach((c, k) => ctx.after(k * 80, () => { c.fixed = true; c.pop = 1; K.sfx.step(k); }));
        const talk = ctx.prompt(s.t);
        await Promise.all([play(s.sc, false), Promise.race([talk, wait(4500)]), wait(1800)]);
        await wait(700);
        if (R === me) roundDone(me.misses);
      };
      R.drop = () => {};
      R.lock = false; K.sfx.whoosh();
      ctx.prompt(SAY.fix + ' ' + SAY.tapWrong);
    }

    /* ----- sort: naming, doing and describing words ----- */
    const BIN_COL = { naming: C.teal, doing: C.tomato, describing: C.plum }, BIN_PIC = { naming: 'bobo/frog', doing: 'tales/fox-happy', describing: 'star/star-happy' };
    function startSort() {
      const per = skill > 0 ? 3 : 2, words = [];
      for (const k in KINDS) for (const w of K.sample(KINDS[k], per)) words.push({ w, k });
      const list = K.shuffle(words);
      const me = (R = { kind: 'sort', cards: [], placed: [], answer: [], misses: 0, lock: true, drag: true, bins: [], left: list.length, sel: null });
      layout([], list.map((x) => x.w), { noScene: true }); strip.visible = false;
      const bw = land ? Math.min(330, (W - 200) / 3) : Math.min(240, (W - 80) / 3), bh = land ? 300 : 290, gap = land ? 44 : 20, by = (land ? 250 : 290) + bh;
      const trayTop = by + (land ? 70 : 80), fl = flow(list.map((x) => cardW(x.w, R.f)), W - (land ? 80 : 36), GAP + 8);
      Object.keys(KINDS).forEach((k, i) => {
        const b = st.add({ z: 20, x: W / 2 + (i - 1) * (bw + gap), y: by + 60, kind: k, words: [], pop: 0, glow: false, alpha: 0, label: 'bin ' + k, hit: { x: -bw / 2, y: -bh - 70, w: bw, h: bh + 80 }, pad: 0, _bsx: 1, _bsy: 1 });
        b.to({ y: by }, { dur: 0.45, ease: 'back', delay: i * 0.08 }); b.to({ alpha: 1 }, { dur: 0.2, delay: i * 0.08 });
        const sp = (glow) => A.sprite(`senBin|${k}|${bw}|${bh}|${glow}`, [-bw / 2 - 14, -bh - 16, bw + 28, bh + 22], (g, s) => {
          const col = BIN_COL[k], box = { x: -bw / 2, y: -bh, w: bw, h: bh };
          if (glow) { g.beginPath(); A.cut(g, [[-bw / 2 - 9, -bh - 9], [bw / 2 + 9, -bh - 9], [bw / 2 - 8, 9], [-bw / 2 + 8, 9]], 26, 0.5, 3); g.fillStyle = C.marigold; g.fill(); }
          g.beginPath(); A.cut(g, [[-bw / 2, -bh + 20], [bw / 2, -bh + 20], [bw / 2 - 16, 0], [-bw / 2 + 16, 0]], 22, 1, 4); A.paper(g, s, col, { shadow: 1, box, light: 0.07 });
          A.line(g, 'rgba(255,255,255,.16)', 5, (h) => { for (let y = -bh + 70; y < -10; y += 34) { h.moveTo(-bw / 2 + 16, y); h.lineTo(bw / 2 - 16, y); } });
          g.beginPath(); A.rect(g, -bw / 2 - 6, -bh, bw + 12, 40, 16, 7, 0.6); A.paper(g, s, A.shade(col, -0.07), { shadow: 0.5 });
          const pw = bw - (land ? 36 : 16), ph = land ? 60 : 50, py = -bh + 56;
          g.beginPath(); A.rect(g, -pw / 2, py, pw, ph, 14, 9, 0.6); A.paper(g, s, CREAM, { shadow: 0.4 });
          g.font = `700 ${land ? 36 : 25}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = INK; g.fillText(k, 0, py + ph / 2 + (land ? 12 : 9));
        });
        b.draw = (g) => {
          const e = pic(BIN_PIC[k]), mh = land ? 150 : 120, hop = b.pop * 26;
          if (e.ok) { const mw = mh * e.im.width / e.im.height; g.drawImage(e.im, -mw / 2, -bh - mh * 0.62 - hop, mw, mh); }
          const q = sp(b.glow), kk = 1 + b.pop * 0.05 + (b.glow ? Math.sin(st.t * 6) * 0.02 : 0); g.save(); g.scale(kk, kk); g.drawImage(q.canvas, -q.ox, -q.oy, q.w, q.h);
          g.font = `700 ${land ? 30 : 24}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          b.words.forEach((w, j) => { const y = -bh + (land ? 152 : 132) + j * (land ? 46 : 36), tw = g.measureText(w).width + 28; g.beginPath(); rr(g, -tw / 2, y - (land ? 20 : 16), tw, land ? 40 : 32, 12); g.fillStyle = 'rgba(255,252,244,.92)'; g.fill(); g.fillStyle = INK; g.fillText(w, 0, y + 2); });
          g.restore();
        };
        b.update = (dt) => { b.pop = Math.max(0, b.pop - dt * 2.4); };
        b.onTap = () => { if (R !== me || R.lock) return; if (R.sel) tryBin(R.sel, b); else { K.sfx.tap(); b.pop = 0.6; ctx.say(BIN_SAY[k]); } };
        junk.push(b); R.bins.push(b);
      });
      list.forEach((x, i) => { const c = addCard(x.w, W / 2 + fl.pos[i].x, trayTop + CH / 2 + fl.pos[i].row * (PITCH + 8), 0.25 + i * 0.07); c.kindOf = x.k; });
      const select = (n) => { for (const c of R.cards) c.sel = false; R.sel = n; if (n) n.sel = true; reglow(); };
      const reglow = () => { for (const b of R.bins) b.glow = !!(R.sel && R.sel.misses >= 2 && b.kind === R.sel.kindOf); };
      function tryBin(n, b) {
        if (b.kind === n.kindOf) {
          n.gone = true; n.sel = false; R.sel = null; reglow(); K.sfx.step(b.words.length + 2); K.sfx.pop();
          n.tx = b.x; n.ty = b.y - bh * 0.4; n.to({ base: 0.2 }, { dur: 0.28 }); n.to({ alpha: 0 }, { dur: 0.28, delay: 0.12 });
          ctx.after(240, () => { if (R !== me) return; b.words.push(n.word); b.pop = 1; ctx.fx.burst(b.x, b.y - bh * 0.6, { n: 8, color: BIN_COL[b.kind] }); });
          if (--R.left <= 0) { R.lock = true; ctx.after(700, async () => { if (R !== me) return; K.sfx.sparkle(); R.bins.forEach((x, i) => ctx.after(i * 120, () => { x.pop = 1; })); ctx.fx.burst(W / 2, by - bh / 2, { n: 18 }); await wait(1300); if (R === me) roundDone(me.misses > 2 ? 2 : me.misses > 0 ? 1 : 0); }); }
        } else {
          n.misses++; R.misses++; n.wob = 1; n.tx = n.home.x; n.ty = n.home.y; K.sfx.whoops(); b.pop = 0.3;
          ctx.say(BIN_WHY[n.kindOf]); select(n);
        }
      }
      R.tap = (n) => { ctx.say(n.word); select(R.sel === n ? null : n); };
      R.drop = (n) => {
        const b = R.bins.find((q) => Math.abs(n.x - q.x) < bw / 2 + 30 && n.y > q.y - bh - 90 && n.y < q.y + 50);
        if (b) tryBin(n, b); else { n.tx = n.home.x; n.ty = n.home.y; }
      };
      R.tryBin = tryBin;
      R.lock = false; K.sfx.whoosh();
      ctx.prompt(SAY.sort);
    }

    /* ----- silly sentences: who + does what + where ----- */
    function startSilly() {
      const me = (R = { kind: 'silly', cards: [], placed: [], answer: [], misses: 0, lock: false, pick: [-1, -1, -1], plays: 0, chips: [] });
      const ROWS = [WHO, WHAT, WHERE];
      let rx0, rw, ry, chipH, banner, playAt, nextAt;
      if (land) {
        const sw = W * 0.5 - 60, sh = 460; sc.setBox(44, 140, sw, sh);
        rx0 = W * 0.5 + 16; rw = W - 44 - rx0; chipH = 132; ry = [140 + 66, 140 + 230, 140 + 394];
        banner = { x: 44, y: 640, w: W - 88, h: 104 }; playAt = { x: W / 2, y: 846, r: 66 }; nextAt = { x: W / 2 + 200, y: 846, r: 52 };
      } else {
        // portrait: picture, sentence, three rows; play sits at the end of the last row
        const sh = K.clamp(H - 152 - 18 - 66 - 14 - 3 * 136 - 150, 150, 330); sc.setBox(18, 152, W - 36, sh);
        rx0 = 14; rw = W - 28; chipH = 124; const y0 = 152 + sh + 18 + 66 + 14 + chipH / 2; ry = [y0, y0 + 136, y0 + 272];
        banner = { x: 14, y: 152 + sh + 18, w: W - 28, h: 66 }; playAt = { x: rx0 + (rw - 24) / 6 + 2 * ((rw - 24) / 3 + 12), y: ry[2], r: 60 }; nextAt = { x: W / 2, y: Math.min(H - 112, ry[2] + chipH / 2 + 74), r: 52 };
      }
      scene.visible = true; strip.visible = false;
      const cw = (rw - 2 * 12) / 3, tf = land ? 30 : 24;
      const chipSp = (text, on) => A.sprite(`senChip|${text}|${Math.round(cw)}|${on}`, [-cw / 2 - 10, -chipH / 2 - 10, cw + 20, chipH + 20], (g, s) => {
        if (on) { g.beginPath(); A.rect(g, -cw / 2 - 7, -chipH / 2 - 7, cw + 14, chipH + 14, 30, 3, 0.5); g.fillStyle = C.marigold; g.fill(); }
        g.beginPath(); A.rect(g, -cw / 2, -chipH / 2, cw, chipH, 24, text.length, 0.8); A.paper(g, s, on ? '#FFF6D8' : CREAM, { shadow: 1, box: { x: -cw / 2, y: -chipH / 2, w: cw, h: chipH }, light: 0.04 });
        g.font = `700 ${tf}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = INK; g.fillText(text, 0, chipH / 2 - 16);
      });
      const restage = () => {
        const [i, j, k] = me.pick; sc.bg = k >= 0 ? WHERE[k].bg : 'day'; sc.clear(); sc.cast = null;
        if (i < 0) return;
        if (j >= 0) stage({ bg: sc.bg, a: WHO[i].a, act: WHAT[j].act, o: WHAT[j].o });
        else { const a = sc.add(WHO[i].a, 0.5, {}); a.sy = 0.8; a.to({ sy: 1 }, { dur: 0.4, ease: 'elastic' }); }
      };
      ROWS.forEach((row, r) => row.forEach((it, i) => {
        const x = rx0 + cw / 2 + (i + (row.length === 2 && land ? 0.5 : 0)) * (cw + 12);
        const n = st.add({ z: 30, x, y: ry[r] + 30, alpha: 0, label: it.t, hit: { x: -cw / 2, y: -chipH / 2, w: cw, h: chipH }, pad: 2, _bsx: 1, _bsy: 1 });
        n.to({ y: ry[r] }, { dur: 0.4, ease: 'back', delay: (r * 3 + i) * 0.05 }); n.to({ alpha: 1 }, { dur: 0.2, delay: (r * 3 + i) * 0.05 });
        n.draw = (g) => {
          const on = me.pick[r] === i, q = chipSp(it.t, on); g.drawImage(q.canvas, -q.ox, -q.oy, q.w, q.h);
          const name = it.a || it.o || it.p, T = THING[name], e = pic(T.p), ph = chipH - tf - 34, cy = -chipH / 2 + 10 + ph / 2;
          g.save(); g.translate(0, cy + (on ? Math.sin(st.t * 5) * 2.5 : 0));
          if (e.ok) { const k = Math.min(ph / e.im.height, (cw - 30) / e.im.width); g.drawImage(e.im, -e.im.width * k / 2, -e.im.height * k / 2, e.im.width * k, e.im.height * k); }
          else { g.beginPath(); g.arc(0, 0, ph * 0.4, 0, 7); g.fillStyle = T.col; g.fill(); }
          g.restore();
        };
        n.onTap = () => { if (R !== me || R.lock) return; R.pick[r] = i; K.sfx.pop(); K.sfx.step(r * 2 + i); restage(); if (R.pick.every((v) => v >= 0)) { play1.pop = 1; if (!R.told) { R.told = true; ctx.say(SAY.play); } } };
        junk.push(n); R.chips.push(n);
      }));
      const bn = st.add({ z: 25, x: banner.x, y: banner.y, alpha: 0 }); bn.to({ alpha: 1 }, { dur: 0.3 });
      bn.sprite = A.sprite(`senBanner|${Math.round(banner.w)}|${banner.h}`, [-8, -8, banner.w + 16, banner.h + 16], (g, s) => { g.beginPath(); A.rect(g, 0, 0, banner.w, banner.h, 26, 5, 0.8); A.paper(g, s, CREAM, { shadow: 1, box: { x: 0, y: 0, w: banner.w, h: banner.h }, light: 0.03 }); A.line(g, 'rgba(91,143,199,.35)', 3, (h) => { h.moveTo(22, banner.h - 16); h.lineTo(banner.w - 22, banner.h - 16); }); });
      bn.draw = (g) => {
        const parts = me.pick.map((v, r) => (v >= 0 ? ROWS[r][v].t : null)); let f = land ? 58 : 34;
        const width = () => { g.font = cardFont(f); const sp = g.measureText(' ').width; return parts.reduce((a, p) => a + (p ? g.measureText(p).width : f * 2.4) + sp, 0) + g.measureText('.').width - sp; };
        while (f > 20 && width() > banner.w - 40) f -= 2;
        g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        const sp = g.measureText(' ').width; let x = (banner.w - width()) / 2; const y = banner.h / 2 + f * 0.34;
        parts.forEach((p, r) => {
          if (p) { if (r === 0) { const c1 = p.charAt(0), cw1 = g.measureText(c1).width; g.fillStyle = C.tomato; g.fillText(c1, x, y); g.fillStyle = INK; g.fillText(p.slice(1), x + cw1, y); } else { g.fillStyle = INK; g.fillText(p, x, y); } x += g.measureText(p).width; }
          else { g.fillStyle = A.alpha([C.teal, C.tomato, C.plum][r], 0.35); g.beginPath(); rr(g, x, y - f * 0.72, f * 2.4, f * 0.9, 10); g.fill(); x += f * 2.4; }
          if (r < 2) x += sp;
        });
        g.fillStyle = C.tomato; g.fillText('.', x, y);
      };
      junk.push(bn);
      const btn = (at, label, col, icon) => {
        const n = st.add({ z: 30, x: at.x, y: at.y, hitR: at.r + 6, label, pop: 0, alpha: 0, _bsx: 1, _bsy: 1 }); n.to({ alpha: 1 }, { dur: 0.3 });
        n.sprite = A.sprite(`senBtn|${label}|${at.r}`, [-at.r - 6, -at.r - 6, at.r * 2 + 12, at.r * 2 + 12], (g, s) => { g.beginPath(); g.arc(0, 0, at.r, 0, 7); A.paper(g, s, col, { shadow: 1, depth: 1.2, box: { x: -at.r, y: -at.r, w: at.r * 2, h: at.r * 2 }, light: 0.1 }); g.fillStyle = CREAM; g.beginPath(); icon(g, at.r); g.fill(); });
        n.update = (dt) => { n.pop = Math.max(0, n.pop - dt * 2.5); };
        junk.push(n); return n;
      };
      const play1 = btn(playAt, 'play', C.tomato, (g, r) => A.cut(g, [[-r * 0.3, -r * 0.45], [r * 0.5, 0], [-r * 0.3, r * 0.45]], r * 0.12, 0, 3));
      const next1 = btn(nextAt, 'next', C.teal, (g, r) => A.cut(g, [[-r * 0.5, -r * 0.16], [0, -r * 0.16], [0, -r * 0.48], [r * 0.56, 0], [0, r * 0.48], [0, r * 0.16], [-r * 0.5, r * 0.16]], r * 0.08, 0, 3));
      next1.visible = false;
      const pu = play1.update; play1.update = (dt) => { pu(dt); const ready = R === me && !R.lock && R.pick.every((v) => v >= 0), k = 1 + play1.pop * 0.2 + (ready ? Math.sin(st.t * 5) * 0.05 : 0); play1.sx = play1.sy = k; play1.alpha = Math.min(play1.alpha, 1) * 1; play1.dim = !ready; };
      play1.draw = (g) => { if (play1.dim) { g.beginPath(); g.arc(0, 0, playAt.r, 0, 7); g.fillStyle = 'rgba(240,221,187,.55)'; g.fill(); } };
      play1.onTap = async () => {
        if (R !== me || R.lock) return;
        if (!R.pick.every((v) => v >= 0)) { K.sfx.tap(); ctx.say(SAY.rows); R.chips.forEach((c) => c.press()); return; }
        R.lock = true; K.sfx.ding(); play1.pop = 1;
        const [i, j, k] = R.pick, t = silly(i, j, k), spec = { bg: WHERE[k].bg, a: WHO[i].a, act: WHAT[j].act, o: WHAT[j].o };
        R.last = t; const talk = ctx.prompt(t);
        await Promise.all([play(spec), Promise.race([talk, wait(5000)]), wait(1800)]);
        if (R !== me) return;
        R.plays++; ctx.fx.burst(sc.x + sc.w / 2, sc.y + sc.h / 2, { n: 14 }); K.sfx.sparkle();
        await wait(500); if (R !== me) return;
        R.lock = false; if (!next1.visible) { next1.visible = true; next1.sx = next1.sy = 0.2; next1.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' }); }
        ctx.prompt(SAY.silly, { silent: true });
      };
      next1.onTap = () => { if (R !== me || R.lock) return; R.lock = true; K.sfx.tap(); roundDone(0); };
      R.play1 = play1; R.next1 = next1;
      sc.bg = 'day'; sc.clear(); K.sfx.whoosh();
      ctx.prompt(SAY.silly + ' ' + SAY.rows);
    }

    K._sentence = {
      get R() { return R; }, get done() { return done; }, get skill() { return skill; }, sc, BANK, lines,
      get answer() { return R && R.answer; },
      cards: () => (R ? R.cards.filter((c) => !c.gone) : []),
      /** Tap the first free card that shows this word (tray first). */
      tap(word, where) { const c = R.cards.find((x) => !x.gone && x.word === word && x.where === (where || 'tray')); if (c && !R.lock) R.tap(c); return !!c; },
      jump(kind, arg) { roundNo = 1; clearRound(); R = null; const my = ++gen; if (kind === 'build' || kind === 'ask') ctx.after(260, () => { if (my === gen) startBuild(kind, arg && BANK.find((s) => s.t === arg)); }); else if (kind === 'fix') ctx.after(260, () => { if (my === gen) startFix(kind, arg); }); else next(kind); },
      setSkill(n) { skill = n; },
      get playing() { return playing.n; },
    };
    ctx.onExit(() => { alive = false; K._sentence = null; });
    for (const s of BANK) if (s.lv === L || (L === 3 && s.lv === 2)) { for (const cl of [s.sc, s.sc.b]) if (cl) for (const nm of [cl.a, cl.o]) if (nm && THING[nm].p) pic(THING[nm].p); }
    for (const k in BG) if (L > 1 || k === 'day') pic(BG[k].p);
    sc.setBox(W / 2 - 200, 140, 400, 300); scene.visible = false;
    ctx.after(350, () => next());
  }

  function icon(g, w) {
    const u = w / 300, e = pic('bobo/frog');
    g.fillStyle = '#BFE3F2'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#9CCB58'; g.beginPath(); g.ellipse(w / 2, w * 0.86, w * 0.8, w * 0.36, 0, 0, 7); g.fill();
    g.save(); g.translate(150 * u, 196 * u); drawLog(g, 34 * u); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5 * u; g.setLineDash([3 * u, 11 * u]); g.lineCap = 'round'; g.beginPath(); g.moveTo(52 * u, 150 * u); g.quadraticCurveTo(150 * u, 20 * u, 238 * u, 120 * u); g.stroke(); g.setLineDash([]);
    g.save(); g.translate(196 * u, 150 * u); g.rotate(0.22);
    if (e.ok) { const h = 122 * u, ww = h * e.im.width / e.im.height; g.drawImage(e.im, -ww / 2, -h, ww, h); }
    else { g.fillStyle = '#86B94A'; g.beginPath(); g.ellipse(0, -50 * u, 40 * u, 52 * u, 0, 0, 7); g.fill(); g.fillStyle = '#2E2A3B'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 16 * u, -78 * u, 5 * u, 0, 7); g.fill(); } }
    g.restore();
    const cards = [[48, 64, '#FBF6EC', '#E8664A'], [128, 82, '#FBF6EC', '#2E2A3B'], [220, 86, '#FBF6EC', '#2E2A3B']];
    let x = 18 * u;
    for (const [, cw, col, ink] of cards) {
      g.save(); g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 8 * u; g.shadowOffsetY = 4 * u; g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(x, 232 * u, cw * u, 50 * u, 12 * u) : g.rect(x, 232 * u, cw * u, 50 * u); g.fill(); g.restore();
      g.fillStyle = ink; g.beginPath(); g.roundRect ? g.roundRect(x + 12 * u, 251 * u, (cw - 24) * u, 12 * u, 6 * u) : g.rect(x + 12 * u, 251 * u, (cw - 24) * u, 12 * u); g.fill();
      x += (cw + 10) * u;
    }
    g.fillStyle = '#E8664A'; g.beginPath(); g.arc(278 * u, 268 * u, 8 * u, 0, 7); g.fill();
  }

  K.game({ id: 'sentence', title: 'Build a Sentence', voice: 'sentence', group: 'arcade', age: 7, subject: 'reading', order: 37, icon, start, lines, resize: () => K.go('sentence') });
})();
