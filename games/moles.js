/* Peek-a-Boo Garden — a gentle, no-pressure take on whack-a-mole.
   Animal friends peek out from behind the bushes of a garden. A soft boop makes them giggle and
   duck. There is no timer and nothing is counted against the child: a friend waits a kind while,
   then ducks and peeks out somewhere else. A wrong boop gets a little head shake and a spoken hint;
   after two misses the right friend glows.
   Level 1: boop anyone (each friend says who it is).
   Level 2: "Boop the panda!" among others, or watch 2-3 friends pop up and boop them in that order.
   Level 3: the friends hold number cards (numerals to 100, or number words): boop the biggest or
            smallest, boop them all in order, or boop "the number that is five more than three".
   Every fourth task ends in a celebration, then play carries on. */
(function () {
  'use strict';
  const A = K.art;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = (n) => K.numWord(n);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const lerp = (a, b, k) => a + (b - a) * k;

  const ANIMALS = { cat: '#F2A65E', chick: '#F7CF4D', dog: '#C9925E', hedgehog: '#B78B66', lion: '#F0B24A', mouse: '#B9B5C2', owl: '#A77F5E', panda: '#F1E3CC', pig: '#F3A6B4' };
  const NAMES = Object.keys(ANIMALS);
  // [start, change, +1 more / -1 less]
  const CALC = [[3, 5, 1], [6, 2, 1], [4, 10, 1], [7, 4, 1], [8, 6, 1], [9, 3, -1], [12, 2, -1], [20, 1, -1]];
  const T = {
    free: ['Boop a friend!', 'Peek-a-boo! Who is hiding?'],
    name: (a) => `${cap(a)}!`,
    find: (a) => `Boop the ${a}!`,
    watch: 'Watch who pops up!', same: 'Now boop them in the same order!', first: 'Who came first?', next: 'Who came next?',
    biggest: 'Boop the biggest number!', smallest: 'Boop the smallest number!',
    asc: 'Boop them from smallest to biggest!', desc: 'Boop them from biggest to smallest!',
    bigger: 'Find a bigger number.', smaller: 'Find a smaller number.',
    calc: (a, b, d) => `Boop the number that is ${num(b)} ${d > 0 ? 'more' : 'less'} than ${num(a)}!`,
    calcIs: (a, b, d) => (d > 0 ? `${cap(num(a))} and ${num(b)} more makes ${num(a + b)}.` : `${cap(num(a))} take away ${num(b)} leaves ${num(a - b)}.`),
  };
  function lines() {
    const out = [...T.free, T.watch, T.same, T.first, T.next, T.biggest, T.smallest, T.asc, T.desc, T.bigger, T.smaller];
    for (const a of NAMES) out.push(T.name(a), T.find(a));
    for (const [a, b, d] of CALC) out.push(T.calc(a, b, d), T.calcIs(a, b, d));
    return out;
  }

  /* ---------------- pictures ---------------- */
  const PIC = {};
  function pic(path) {
    let e = PIC[path];
    if (!e) { e = PIC[path] = { im: new Image(), ok: false }; e.im.onload = () => { e.ok = true; }; e.im.src = 'img/' + path + '.webp'; }
    return e.ok ? e.im : null;
  }
  pic('tales/bush'); pic('tales/sunflower');
  for (const a of NAMES) { pic('faces/' + a); pic('faces/' + a + '-shut'); }

  /* ---------------- drawing ---------------- */
  /** A round paper face for when the picture has not arrived. Plain canvas calls; r is half the width. */
  function plainFace(g, name, r, shut) {
    const c = ANIMALS[name] || '#F1E3CC', dark = name === 'panda' ? '#4A3B3A' : A.shade(c, -0.14);
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * r * 0.72, -r * 0.6, r * 0.34, 0, 7); g.fillStyle = dark; g.fill(); }
    g.beginPath(); g.ellipse(0, 0, r, r * 0.88, 0, 0, 7); g.fillStyle = c; g.fill();
    if (name === 'panda') for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * r * 0.4, -r * 0.05, r * 0.24, r * 0.28, sx * 0.3, 0, 7); g.fillStyle = dark; g.fill(); }
    for (const sx of [-1, 1]) {
      g.beginPath(); g.arc(sx * r * 0.62, r * 0.3, r * 0.2, 0, 7); g.fillStyle = 'rgba(240,120,110,.5)'; g.fill();
      if (shut) { g.beginPath(); g.arc(sx * r * 0.4, -r * 0.02, r * 0.12, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = '#2E2A3B'; g.lineWidth = r * 0.06; g.lineCap = 'round'; g.stroke(); }
      else { g.beginPath(); g.arc(sx * r * 0.4, -r * 0.05, r * 0.12, 0, 7); g.fillStyle = '#2E2A3B'; g.fill(); g.beginPath(); g.arc(sx * r * 0.4 - r * 0.04, -r * 0.09, r * 0.04, 0, 7); g.fillStyle = '#fff'; g.fill(); }
    }
    g.beginPath(); g.ellipse(0, r * 0.2, r * 0.12, r * 0.08, 0, 0, 7); g.fillStyle = '#7A4A3C'; g.fill();
    g.beginPath(); g.arc(0, r * 0.3, r * 0.2, 0.3, Math.PI - 0.3); g.strokeStyle = '#7A4A3C'; g.lineWidth = r * 0.05; g.lineCap = 'round'; g.stroke();
  }
  /** A bush about w wide centred on (0,0), for when the picture has not arrived. Plain canvas calls. */
  function plainBush(g, w) {
    const lobes = [[0, -0.2, 0.3, '#2F6B55'], [-0.26, -0.02, 0.24, '#2F6B55'], [0.26, -0.02, 0.24, '#2F6B55'], [-0.3, 0.14, 0.2, '#3F8060'], [0, 0.12, 0.26, '#3F8060'], [0.3, 0.14, 0.2, '#3F8060'], [-0.22, 0.26, 0.16, '#5E9A58'], [0.02, 0.27, 0.17, '#5E9A58'], [0.24, 0.26, 0.16, '#5E9A58']];
    for (const [x, y, r, c] of lobes) { g.beginPath(); g.arc(x * w, y * w, r * w, 0, 7); g.fillStyle = c; g.fill(); }
    for (const [x, y] of [[-0.2, -0.08], [0.22, -0.16], [0.16, 0.12]]) { g.beginPath(); g.arc(x * w, y * w, 0.028 * w, 0, 7); g.fillStyle = '#D9523F'; g.fill(); }
  }
  function drawFace(g, name, w, shut) {
    const im = pic('faces/' + name + (shut ? '-shut' : '')) || pic('faces/' + name);
    if (im) { const h = w * im.height / im.width; g.drawImage(im, -w / 2, -h / 2, w, h); } else plainFace(g, name, w * 0.46, shut);
  }
  function drawBush(g, w) {
    const im = pic('tales/bush');
    if (im) { const h = w * im.height / im.width; g.drawImage(im, -w / 2, -h / 2, w, h); } else plainBush(g, w * 0.94);
  }

  function garden(g, s, W, H) {
    const r = A.rng(17), top = 236;
    const sk = g.createLinearGradient(0, 0, 0, 260); sk.addColorStop(0, '#8CC8E8'); sk.addColorStop(1, '#DDF1F0'); g.fillStyle = sk; g.fillRect(0, 0, W, 280);
    for (const [x, y, k] of [[0.2, 150, 1], [0.58, 132, 0.8], [0.9, 160, 0.9]]) { g.beginPath(); A.blob(g, W * x, y, 86 * k, 26 * k, 0.05, 3 + x * 10); A.blob(g, W * x - 30 * k, y - 16 * k, 44 * k, 26 * k, 0.05, 5); A.blob(g, W * x + 28 * k, y - 12 * k, 36 * k, 22 * k, 0.05, 6); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill(); }
    // far hedge, then the fence
    for (let x = -60; x < W + 120; x += 128) { g.beginPath(); A.blob(g, x + r() * 30, 214 + r() * 12, 104, 70 + r() * 22, 0.06, x + 3); A.paper(g, s, r() < 0.5 ? '#6FA77A' : '#7DB386', { shadow: 0.4 }); }
    const fy = 170;
    for (const y of [fy + 24, fy + 62]) { g.beginPath(); A.rect(g, -20, y, W + 40, 13, 3, y, 0.5); A.paper(g, s, '#E4D2AC', { shadow: 0.5 }); }
    const n = Math.round(W / 50), step = W / n;
    for (let i = 0; i < n; i++) { const x = i * step + (step - 32) / 2, d = (r() - 0.5) * 8; g.beginPath(); A.cut(g, [[x, fy + 12 + d], [x + 16, fy - 6 + d], [x + 32, fy + 12 + d], [x + 32, fy + 100], [x, fy + 100]], 5, 1, i + 9); A.paper(g, s, i % 2 ? '#F8EFDC' : '#F3E6CC', { shadow: 0.6, box: { x, y: fy, w: 32, h: 100 } }); }
    // the lawn, mown in soft bands
    const pts = []; for (let x = -120; x <= W + 240; x += 120) pts.push([x, top + (r() - 0.5) * 16]);
    g.beginPath(); A.smooth(g, pts, true); g.lineTo(W + 240, H + 40); g.lineTo(-120, H + 40); g.closePath(); A.paper(g, s, '#B0DA74', { shadow: 0.7, light: 0.05, box: { x: 0, y: top, w: W, h: H - top } });
    g.save(); g.beginPath(); g.rect(0, top + 12, W, H); g.clip();
    const band = 132; for (let y = top + 20, i = 0; y < H + band; y += band, i++) if (i % 2 === 0) { g.beginPath(); g.moveTo(-20, y); g.quadraticCurveTo(W / 2, y + 26, W + 20, y); g.lineTo(W + 20, y + band); g.quadraticCurveTo(W / 2, y + band + 26, -20, y + band); g.closePath(); g.fillStyle = 'rgba(255,255,220,.13)'; g.fill(); }
    g.restore();
    // tufts and daisies
    const count = Math.round((W * H) / 26000);
    for (let i = 0; i < count; i++) {
      const x = 20 + r() * (W - 40), y = top + 46 + r() * (H - top - 70);
      if (r() < 0.55) A.line(g, r() < 0.5 ? '#86BC58' : '#94C660', 4, (h) => { for (const d of [-9, 0, 9]) { h.moveTo(x + d * 0.5, y); h.quadraticCurveTo(x + d, y - 10, x + d * 1.5, y - 17 - (d ? 0 : 6)); } });
      else { const c = ['#FFFDF6', '#F9B7C5', '#FFE08A', '#FFFDF6'][Math.floor(r() * 4)], q = 5 + r() * 2.5; g.save(); g.shadowColor = 'rgba(40,70,40,.25)'; g.shadowBlur = 3 * s; g.shadowOffsetY = 2 * s; g.fillStyle = c; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 + r(); g.moveTo(x + Math.cos(a) * q + q, y + Math.sin(a) * q); g.arc(x + Math.cos(a) * q, y + Math.sin(a) * q, q, 0, 7); } g.fill(); g.restore(); g.beginPath(); g.arc(x, y, q * 0.72, 0, 7); g.fillStyle = c === '#FFE08A' ? '#F08A4B' : '#F2B33D'; g.fill(); }
    }
  }

  /* ---------------- the game ---------------- */
  function start(st, ctx) {
    const W = st.W, H = st.H, L = ctx.level, RES = st.res;
    const bg = st.add({ z: 0 });
    bg.draw = (g) => { const sp = A.sprite('moles-bg' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g2, s2) => garden(g2, s2, W, H)); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); };

    /* ---------- layout: a bush for every hiding place ---------- */
    const cols = W >= 1250 && L >= 3 ? 4 : W >= 900 ? 3 : 2, rows = cols >= 3 ? 2 : 3;
    const top = 226, bottom = H - 34, pitch = (bottom - top) / rows, cellW = W / cols;
    const bw = Math.min(cellW * 0.84, pitch / 1.36, 310);
    const holes = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const shift = (r % 2 ? 1 : -1) * Math.min(34, Math.max(0, (cellW - bw) / 2 - 8));
      const x = cellW * (c + 0.5) + shift, y = top + pitch * r + (pitch - 1.32 * bw) / 2 + 0.92 * bw;
      const h = st.add({ z: 10 + r, x, y, i: holes.length, animal: null, up: 0, card: null, word: false, wob: 0, rustle: 0, shut: 0, squash: 0, blinkAt: rnd(1, 4), ph: rnd(0, 6), until: 0, leaving: false, gen: 0, pop: 0,
        hit: { x: -bw * 0.5, y: -bw * 0.92, w: bw, h: bw * 1.32 }, pad: 0, pressable: false, label: 'bush ' + (holes.length + 1) });
      h.update = (dt) => {
        h.wob = Math.max(0, h.wob - dt * 1.6); h.rustle = Math.max(0, h.rustle - dt * 2.2); h.shut = Math.max(0, h.shut - dt); h.squash = Math.max(0, h.squash - dt * 3);
        if (h.animal && (h.blinkAt -= dt) < 0) { h.shut = Math.max(h.shut, 0.14); h.blinkAt = rnd(1.8, 5); }
      };
      h.draw = (g) => {
        g.beginPath(); g.ellipse(0, bw * 0.37, bw * 0.47, bw * 0.075, 0, 0, 7); g.fillStyle = 'rgba(52,92,48,.26)'; g.fill();
        if (h.animal && h.up > 0.02) {
          const glow = glows(h), fw = bw * 0.66, fy = lerp(bw * 0.1, -bw * 0.6, h.up) + Math.sin(st.t * 2.2 + h.ph) * bw * 0.012;
          g.save(); g.translate(0, fy);
          if (glow) { const a = 0.75 + Math.sin(st.t * 7) * 0.25, gr = g.createRadialGradient(0, 0, fw * 0.3, 0, 0, fw * 1.05); gr.addColorStop(0, `rgba(255,250,190,${a})`); gr.addColorStop(0.55, `rgba(255,236,120,${a * 0.75})`); gr.addColorStop(1, 'rgba(255,236,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, fw * 1.05, 0, 7); g.fill(); }
          g.rotate(Math.sin(h.wob * 22) * 0.2 * h.wob + Math.sin(st.t * 1.6 + h.ph) * 0.03);
          const q = (glow ? 1 + Math.sin(st.t * 7) * 0.04 : 1), sq = Math.sin(h.squash * Math.PI) * 0.16;
          g.scale(q * (1 + sq), q * (1 - sq));
          drawFace(g, h.animal, fw, h.shut > 0);
          g.restore();
        }
        g.save(); g.translate(0, bw * 0.36); g.rotate(Math.sin(h.rustle * 24) * 0.05 * h.rustle); g.scale(1 + Math.sin(h.rustle * 24) * 0.02 * h.rustle, 1 - h.pop * 0.04); g.translate(0, -bw * 0.36);
        drawBush(g, bw);
        g.restore();
        if (h.card != null && h.up > 0.3) {
          const k = K.clamp((h.up - 0.3) / 0.7, 0, 1.1), cw = bw * (h.word ? 0.62 : 0.47), ch = bw * 0.34, fur = ANIMALS[h.animal];
          g.save(); g.translate(0, bw * 0.07); g.rotate(Math.sin(h.ph) * 0.05 + Math.sin(h.wob * 22) * 0.06 * h.wob); g.scale(k, k);
          g.save(); g.shadowColor = 'rgba(30,50,40,.4)'; g.shadowBlur = 8 * RES; g.shadowOffsetY = 4 * RES; g.beginPath(); A.rect(g, -cw / 2, -ch / 2, cw, ch, 12, h.i + 3, 1.5); g.fillStyle = '#FFFBF0'; g.fill(); g.restore();
          g.beginPath(); A.rect(g, -cw / 2 + 7, -ch / 2 + 7, cw - 14, ch - 14, 8, h.i + 5, 1); g.strokeStyle = 'rgba(242,179,61,.75)'; g.lineWidth = 3; g.stroke();
          const t = h.word ? num(h.card) : String(h.card);
          let fs = h.word ? ch * 0.44 : ch * 0.74; g.font = `700 ${fs}px ${A.FONT_BODY}`;
          const tw = g.measureText(t).width; if (tw > cw - 26) { fs *= (cw - 26) / tw; g.font = `700 ${fs}px ${A.FONT_BODY}`; }
          g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = A.C.ink; g.fillText(t, 0, ch * 0.04);
          for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * (cw / 2 - bw * 0.075), -ch / 2 + 2, bw * 0.047, ch * 0.13, 0, 0, 7); g.fillStyle = fur; g.fill(); g.strokeStyle = A.shade(fur, -0.16); g.lineWidth = 2.5; g.stroke(); }
          g.restore();
        }
      };
      h.onDown = () => boop(h);
      h.onTap = (p) => { if (!p) boop(h); };      // keyboard, screen reader and tests
      holes.push(h);
    }
    // a sunflower or two at the edges when there is room
    if (cellW - bw > 150) for (const sx of [0, 1]) {
      const n = st.add({ z: 9, x: sx ? W - 44 : 44, y: H - 30, ph: sx * 2 });
      n.draw = (g) => { const im = pic('tales/sunflower'); if (!im) return; const hh = 250; g.rotate(Math.sin(st.t * 1.1 + n.ph) * 0.03); g.drawImage(im, -hh * im.width / im.height / 2, -hh, hh * im.width / im.height, hh); };
    }

    /* ---------- state ---------- */
    let ask = null, done = 0, skill = 0, lastKey = '', lastType = '', lastHole = -1, nextPop = 0, freeN = 0, full = false;
    const glows = (h) => !!(ask && !ask.locked && ask.misses >= 2 && !h.leaving && ask.target && ask.target() === h);
    const ups = () => holes.filter((h) => h.animal && !h.leaving);
    const empty = () => holes.filter((h) => !h.animal);
    const facePos = (h) => ({ x: h.x, y: h.y - bw * 0.6 });

    function raise(h, animal, card, word) {
      h.gen++; h.animal = animal; h.card = card == null ? null : card; h.word = !!word; h.leaving = false; h.shut = 0; h.wob = 0; h.blinkAt = rnd(1.2, 4); h.until = st.t + rnd(6.5, 9.5);
      h.pop = 1; h.to({ pop: 0 }, { dur: 0.4 }); h.rustle = 0.6;
      h.to({ up: 1 }, { dur: 0.5, ease: 'back' });
      K.sfx.tone(420, 0.13, { to: 760, type: 'sine', vol: 0.12 });
      lastHole = h.i;
    }
    function duck(h, delay) {
      if (!h.animal) return;
      const gen = h.gen; h.leaving = true;
      h.to({ up: 0 }, { dur: 0.32, ease: 'inOut', delay: delay || 0 }).then(() => { if (h.gen === gen) { h.animal = null; h.card = null; h.leaving = false; h.rustle = 0.5; } });
    }
    function giggle() { [1047, 1319, 1175, 1480, 1319].forEach((f, i) => K.sfx.tone(f, 0.09, { to: f * 1.12, type: 'sine', vol: 0.13, delay: 0.05 + i * 0.085 })); }
    function happy(h, stay) {
      K.sfx.pop(); giggle(); h.shut = 0.8; h.squash = 1;
      const p = facePos(h); ctx.fx.burst(p.x, p.y, { n: 9, colors: ['#F2B33D', '#FFF3C4', '#F4B49A', '#FBF8F1'] });
      if (!stay) duck(h, 0.5);
    }
    function wrong(h, hint) {
      K.sfx.whoops(); h.wob = 1; ask.misses++; ask.missed = true;
      K.say(hint);
    }
    function rustle(h) { h.rustle = 1; K.sfx.noise(0.12, { freq: 1900, vol: 0.05 }); }

    function boop(h) {
      if (!h.animal || h.leaving || h.up < 0.5) { rustle(h); return; }
      if (!ask || ask.locked) { h.squash = 1; K.sfx.tap(); return; }      // still popping up: a friendly wiggle, nothing more
      ask.boop(h);
    }

    /* ---------- tasks ---------- */
    const someAnimals = (n, not) => K.shuffle(NAMES.filter((a) => a !== not)).slice(0, n);
    function someHoles(n) {
      const pool = K.shuffle(empty().length >= n ? empty() : holes);
      return pool.slice(0, n).sort((a, b) => a.i - b.i);
    }
    const many = (base) => Math.min(holes.length - 1, base);

    function askFree() {
      const me = (ask = { type: 'free', need: 3, got: 0, misses: 0, locked: false, key: 'free' + freeN });
      me.target = () => null;
      me.right = () => ups().find((h) => h.up > 0.8) || null;
      me.boop = (h) => { happy(h); K.say(T.name(h.animal)); me.got++; nextPop = Math.min(nextPop, st.t + 0.5); if (me.got >= me.need) finish(); };
      ctx.prompt(T.free[freeN++ % T.free.length]); nextPop = st.t + 0.3;
    }
    function askFind() {
      const n = many(3 + (skill >= 2 ? 1 : 0) + (skill >= 4 ? 1 : 0));
      let animals; do animals = someAnimals(n); while ('find' + animals[0] === lastKey || (animals.includes('lion') && animals.includes('hedgehog')));      // those two look alike
      const hs = K.shuffle(someHoles(n)), t = animals[0];
      const me = (ask = { type: 'find', misses: 0, locked: true, key: 'find' + t, goal: hs[0] });
      me.target = () => me.goal; me.right = me.target;
      me.boop = (h) => { if (h === me.goal) { happy(h); K.say(T.name(t)); finish(); } else wrong(h, `${T.name(h.animal)} ${T.find(t)}`); };
      hs.forEach((h, i) => ctx.after(i * 170, () => { if (ask === me) raise(h, animals[i]); }));
      ctx.after(hs.length * 170 + 250, () => { if (ask === me) me.locked = false; });
      ctx.prompt(T.find(t));
    }
    function askOrder() {
      const n = many(skill >= 3 ? 3 : 2), animals = someAnimals(n), hs = K.shuffle(someHoles(n));
      const me = (ask = { type: 'order', misses: 0, locked: true, key: 'order' + animals.join(), seq: hs, i: 0 });
      me.target = () => me.seq[me.i]; me.right = me.target;
      me.boop = (h) => {
        if (h === me.seq[me.i]) { happy(h); K.sfx.step(me.i * 2); me.i++; me.misses = 0; if (me.i >= n) finish(); }
        else wrong(h, me.i === 0 ? T.first : T.next);
      };
      ctx.prompt(T.watch);
      ctx.wait(1300).then(() => {
        hs.forEach((h, i) => ctx.after(i * 1150, () => { if (ask !== me) return; raise(h, animals[i]); K.sfx.step(i * 2); h.squash = 1; }));
        return ctx.wait(n * 1150 + 200);
      }).then(() => { if (ask !== me) return; me.locked = false; ctx.prompt(T.same); });
    }
    /** n different numbers for the cards. */
    function someNumbers(n, lo, hi) { const out = []; while (out.length < n) { const v = rint(lo, hi); if (!out.includes(v)) out.push(v); } return out; }
    function showCards(me, values, word) {
      const hs = K.shuffle(someHoles(values.length)), animals = someAnimals(values.length);
      hs.forEach((h, i) => ctx.after(i * 170, () => { if (ask === me) raise(h, animals[i], values[i], word); }));
      ctx.after(hs.length * 170 + 250, () => { if (ask === me) me.locked = false; });
      return hs;
    }
    function range() { const word = skill >= 2 && Math.random() < 0.35; return { word, hi: word || skill < 1 ? 20 : skill < 3 ? 50 : 100 }; }
    function askMost() {
      const big = lastKey === 'biggest' ? false : lastKey === 'smallest' ? true : Math.random() < 0.5, n = many(3 + Math.min(2, Math.floor(skill / 2))), rg = range();
      const vals = someNumbers(n, 1, rg.hi), best = big ? Math.max(...vals) : Math.min(...vals);
      const me = (ask = { type: 'most', misses: 0, locked: true, key: big ? 'biggest' : 'smallest' });
      const hs = showCards(me, vals, rg.word); me.goal = hs[vals.indexOf(best)];
      me.target = () => me.goal; me.right = me.target;
      me.boop = (h) => { if (h === me.goal) { happy(h); finish(); } else wrong(h, big ? T.bigger : T.smaller); };
      ctx.prompt(big ? T.biggest : T.smallest);
    }
    function askSort() {
      const up = lastKey === 'asc' ? false : lastKey === 'desc' ? true : Math.random() < 0.6, n = many(3 + (skill >= 2 ? 1 : 0) + (skill >= 4 ? 1 : 0)), rg = range();
      const vals = someNumbers(n, 1, rg.hi);
      const me = (ask = { type: 'sort', misses: 0, locked: true, key: up ? 'asc' : 'desc', i: 0 });
      const hs = showCards(me, vals, rg.word);
      me.seq = hs.slice().sort((a, b) => (vals[hs.indexOf(a)] - vals[hs.indexOf(b)]) * (up ? 1 : -1));
      me.target = () => me.seq[me.i]; me.right = me.target;
      me.boop = (h) => {
        if (h === me.seq[me.i]) { happy(h); K.sfx.step(me.i * 2); me.i++; me.misses = 0; if (me.i >= n) finish(); }
        else wrong(h, up ? T.smaller : T.bigger);
      };
      ctx.prompt(up ? T.asc : T.desc);
    }
    function askCalc() {
      let c; do c = K.pick(CALC); while ('calc' + c.join() === lastKey);
      const [a, b, d] = c, ans = a + b * d, n = many(3 + (skill >= 2 ? 1 : 0));
      const others = K.shuffle([a, ans - 1, ans + 1, ans - 2, ans + 2, a - b * d, ans + 10, b].filter((v, i, arr) => v >= 1 && v !== ans && arr.indexOf(v) === i)).slice(0, n - 1);
      const vals = [ans, ...others];
      const me = (ask = { type: 'calc', misses: 0, locked: true, key: 'calc' + c.join() });
      const hs = showCards(me, vals, false); me.goal = hs[0];
      me.target = () => me.goal; me.right = me.target;
      me.boop = (h) => { if (h === me.goal) { happy(h); finish(); } else wrong(h, T.calcIs(a, b, d)); };
      ctx.prompt(T.calc(a, b, d));
    }
    const ASK = { free: askFree, find: askFind, order: askOrder, most: askMost, sort: askSort, calc: askCalc };
    function pickType() {
      if (L === 1) return 'free';
      if (L === 2) return done === 0 ? 'find' : lastType === 'order' ? 'find' : Math.random() < 0.45 ? 'order' : 'find';
      if (done === 0) return 'most';
      let t; do t = K.pick(['most', 'sort', 'calc']); while (t === lastType);
      return t;
    }
    function next(type) {
      for (const h of holes) if (h.animal && !h.leaving) duck(h);
      type = type || pickType(); lastType = type; full = false;
      ASK[type]();
    }
    function finish() {
      const me = ask; me.locked = true; lastKey = me.key; done++; full = done % 4 === 0;
      if (!me.missed) skill = Math.min(6, skill + 1); else if (me.misses >= 2) skill = Math.max(0, skill - 1);
      ups().forEach((h, i) => duck(h, 0.75 + i * 0.1));
      ctx.after(420, () => K.sfx.ding());
      ctx.wait(1250).then(() => { if (done % 4 === 0) return ctx.celebrate(); K.praise(); return ctx.wait(1250); }).then(() => { if (ask === me) next(); });
    }

    // free play: friends peek out by themselves, wait a kind while, then duck and peek out elsewhere
    ctx.every(250, () => {
      if (!ask || ask.type !== 'free' || ask.locked) return;
      for (const h of ups()) if (st.t > h.until && h.up > 0.9) duck(h);
      const want = Math.min(3, 1 + Math.floor(skill / 2) + (done > 0 ? 1 : 0));
      if (ups().length < want && st.t >= nextPop) {
        const pool = empty().filter((h) => h.i !== lastHole), h = K.pick(pool.length ? pool : empty());
        const out = holes.map((q) => q.animal), a = K.pick(NAMES.filter((x) => !out.includes(x)));
        if (h && a) { raise(h, a); nextPop = st.t + rnd(0.7, 1.3); }
      }
    });

    /* ---------- how far to the party ---------- */
    const pips = st.add({ ui: true, z: 98, x: W / 2, y: 140 });
    pips.draw = (g) => {
      const got = full ? 4 : done % 4;
      for (let i = 0; i < 4; i++) {
        const on = i < got, x = (i - 1.5) * 44, q = on ? 8 : 6;
        g.fillStyle = on ? '#FFFDF6' : 'rgba(255,255,255,.55)'; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; g.moveTo(x + Math.cos(a) * q + q, Math.sin(a) * q); g.arc(x + Math.cos(a) * q, Math.sin(a) * q, q, 0, 7); } g.fill();
        g.beginPath(); g.arc(x, 0, q * 0.75, 0, 7); g.fillStyle = on ? '#F2B33D' : 'rgba(255,255,255,.8)'; g.fill();
      }
    };

    K._moles = {
      holes, get ask() { return ask; }, get done() { return done; }, get skill() { return skill; }, set skill(v) { skill = v; },
      right: () => (ask && !ask.locked ? ask.right() : null), boop, go: (type) => next(type),
    };
    ctx.onExit(() => { K._moles = null; });
    ctx.wait(350).then(() => next());
  }

  function icon(g, w) {
    const sk = g.createLinearGradient(0, 0, 0, w * 0.5); sk.addColorStop(0, '#8CC8E8'); sk.addColorStop(1, '#DDF1F0'); g.fillStyle = sk; g.fillRect(0, 0, w, w);
    g.fillStyle = '#7DB386'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w * (0.1 + i * 0.28), w * 0.36, w * 0.17, 0, 7); g.fill(); }
    g.fillStyle = '#B0DA74'; g.fillRect(0, w * 0.4, w, w * 0.6);
    g.fillStyle = 'rgba(255,255,220,.16)'; g.fillRect(0, w * 0.62, w, w * 0.2);
    g.save(); g.translate(w * 0.5, w * 0.31); g.rotate(-0.06); drawFace(g, 'panda', w * 0.58, false); g.restore();
    g.beginPath(); g.ellipse(w * 0.5, w * 1.0, w * 0.4, w * 0.05, 0, 0, 7); g.fillStyle = 'rgba(52,92,48,.26)'; g.fill();
    g.save(); g.translate(w * 0.5, w * 0.78); drawBush(g, w * 0.78); g.restore();
  }

  K.game({ id: 'moles', title: 'Peek-a-Boo Garden', voice: 'moles', group: 'arcade', age: 3, order: 11, icon, start, lines, resize: () => K.go('moles') });
})();
