/* Word Builder — spell the word for the picture.
   A picture hangs on the wall, a row of empty slots waits under it and chunky letter tiles lie on the
   table. Tap a tile and it hops to the next slot, or drag it to the slot you want. The right letter
   clicks in; a wrong one wobbles and hops back, and after two misses the letter that belongs there
   glows. Every tile says its name when touched. When the word is whole the tiles hop in turn, the
   word is spoken and the picture bounces.

   Level 1: three-letter words, faint letters in the slots to match, only the needed tiles.
   Level 2: three and four letter words, no faint letters, one or two extra tiles, first-letter help.
   Level 3: five to nine letter words, more extra tiles, plus "which letter is missing?" and
            "unscramble" rounds (the word is not spoken until it is built).
   Inside a session clean rounds make it a little harder and missy rounds ease it off. */
(function () {
  'use strict';
  const A = K.art, E = K.engine;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* word, picture (in img/) */
  const LIST = [
    ['hat', 'kitchen/hat'], ['cow', 'words/cow'], ['dog', 'words/dog'], ['pig', 'words/pig'], ['bus', 'words/bus'],
    ['egg', 'words/egg'], ['cat', 'star/cat'], ['owl', 'star/owl'], ['fox', 'bobo/fox'], ['sun', 'toot/sun'],
    ['pear', 'kitchen/pear'], ['sock', 'kitchen/sock'], ['book', 'kitchen/book'], ['ball', 'kitchen/ball'], ['shoe', 'kitchen/shoe'],
    ['frog', 'bobo/frog'], ['moon', 'star/moon'], ['star', 'star/star'], ['kite', 'tales/kite'], ['flag', 'tales/flag'],
    ['gift', 'tales/gift'], ['lion', 'faces/lion'],
    ['apple', 'kitchen/apple'], ['lemon', 'kitchen/lemon'], ['panda', 'star/panda'], ['mouse', 'tales/mouse'], ['bunny', 'bobo/bunny'],
    ['cloud', 'star/cloud'], ['house', 'star/house'], ['honey', 'tales/honey'], ['chick', 'faces/chick'], ['donut', 'kitchen/donut'],
    ['grapes', 'kitchen/grapes'], ['cheese', 'kitchen/cheese'], ['cookie', 'kitchen/cookie'], ['sponge', 'kitchen/sponge'],
    ['carrot', 'kitchen/carrot'], ['tomato', 'kitchen/tomato'], ['banana', 'kitchen/banana'], ['orange', 'kitchen/orange'],
    ['rocket', 'star/rocket'], ['turtle', 'tales/turtle'], ['balloon', 'town/balloon'], ['snowman', 'tales/snowman'],
    ['rainbow', 'bobo/rainbow'], ['umbrella', 'tales/umbrella'], ['sunflower', 'tales/sunflower'],
  ].map(([word, src]) => ({ word, src }));
  const BY_LEN = {}; for (const w of LIST) (BY_LEN[w.word.length] = BY_LEN[w.word.length] || []).push(w);
  const ABC = 'abcdefghijklmnopqrstuvwxyz';
  /* letters a child mixes up, used first when picking extra tiles */
  const ALIKE = { b: 'dp', d: 'bp', p: 'bq', q: 'pg', m: 'nw', n: 'mu', u: 'nv', w: 'mv', a: 'eo', e: 'ai', i: 'ey', o: 'au', c: 'ks', k: 'c', s: 'cz', f: 'vt', v: 'fw', g: 'jq', t: 'df', l: 'i', r: 'n', h: 'n', y: 'i' };

  const T = {
    build: 'Build the word.', starts: 'It starts with this letter.', listen: 'Listen.', here: 'This letter goes here.',
    missing1: 'Which letter is missing?', missing2: 'Which letters are missing?', jumble: 'Unscramble the letters.',
  };
  const letterS = (ch) => ch.toUpperCase() + '.';
  const wordS = (w) => cap(w) + '.';
  const lines = () => Object.values(T).concat(ABC.split('').map(letterS), LIST.map((w) => wordS(w.word)));

  /* ---------- pictures ---------- */
  const PIC = {};
  const load = (src) => { let im = PIC[src]; if (!im) { im = PIC[src] = new Image(); im.src = 'img/' + src + '.webp'; } return im; };
  const ok = (im) => !!(im && im.complete && im.naturalWidth > 0);
  load('kitchen/apple'); // for the thumbnail

  const VOWEL = '#E8664A', CONS = ['#2F8F8A', '#5B8FC7', '#7B5AA6', '#4F9A63'];
  const colour = (ch) => ('aeiou'.includes(ch) ? VOWEL : CONS[(ch.charCodeAt(0) * 7) % 4]);   // vowels are always tomato red

  function icon(g, w) {
    const u = w / 300;
    const rr = (x, y, w2, h2, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w2, y, x + w2, y + h2, r); g.arcTo(x + w2, y + h2, x, y + h2, r); g.arcTo(x, y + h2, x, y, r); g.arcTo(x, y, x + w2, y, r); g.closePath(); };
    g.save(); g.scale(u, u);
    g.fillStyle = '#F4E3C3'; g.fillRect(0, 0, 300, 300);
    g.fillStyle = '#E3A65E'; g.fillRect(0, 196, 300, 104);
    g.fillStyle = 'rgba(120,70,30,.18)'; g.fillRect(0, 196, 300, 8);
    // the picture card
    g.save(); g.translate(150, 100); g.rotate(-0.04);
    g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 10 * u; g.shadowOffsetY = 5 * u;
    g.fillStyle = '#FFFDF7'; rr(-86, -78, 172, 156, 14); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#CFE6E8'; rr(-74, -66, 148, 132, 10); g.fill();
    const im = PIC['kitchen/apple'];
    if (ok(im)) { const k = Math.min(112 / im.naturalWidth, 112 / im.naturalHeight); g.drawImage(im, -im.naturalWidth * k / 2, -im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); }
    else { g.fillStyle = '#D94B3F'; g.beginPath(); g.arc(0, 8, 46, 0, 7); g.fill(); g.fillStyle = '#6FA65F'; g.beginPath(); g.ellipse(16, -44, 20, 9, -0.5, 0, 7); g.fill(); }
    g.restore();
    // three tiles
    const chs = ['c', 'a', 't'], cols = ['#2F8F8A', VOWEL, '#5B8FC7'];
    chs.forEach((ch, i) => {
      g.save(); g.translate(64 + i * 86, 238); g.rotate([-0.06, 0.03, -0.02][i]);
      g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 8 * u; g.shadowOffsetY = 4 * u;
      g.fillStyle = cols[i]; rr(-36, -36, 72, 72, 15); g.fill();
      g.shadowColor = 'transparent';
      g.fillStyle = '#FFFDF6'; g.font = '700 50px ' + A.FONT_BODY; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(ch, 0, 16);
      g.restore();
    });
    g.restore();
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, SET = 4;
    const maxLen = land ? 9 : 7;
    const cardW = land ? 400 : 336, cardH = 330, cardX = W / 2, cardTop = 134, cardY = cardTop + cardH / 2;
    const slotY = cardTop + cardH + 98;
    const tableY = slotY + 100;
    const TS = land ? 108 : 98, tgap = land ? 16 : 11, rowH = TS + 16;
    let ts = TS;                                     // this round's tile size: bigger when there are only a few
    const perRow = Math.max(1, Math.floor((W - 44 + tgap) / (TS + tgap))), maxRows = Math.max(1, Math.min(3, Math.floor((H - 36 - tableY - 30 + 16) / rowH)));
    const trayMid = land ? (tableY + 34 + H - 40) / 2 : tableY + 44 + (rowH * maxRows - 16) / 2;
    const felt = load('faces/felt'), wood = load('build/wood');
    for (const w of LIST) if (w.word.length <= (L === 1 ? 3 : L === 2 ? 4 : 9)) load(w.src);

    let R = null, won = 0, skill = 0, streak = 0, rounds = 0, lastKind = '';
    const recent = [];
    const tiles = [];
    const top = () => { st.root._sorted = false; };

    /* ---------- the room ---------- */
    const tex = (g, im, x, y, w, h, sc, tint) => {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      const pat = g.createPattern(im, 'repeat'); if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(sc));
      g.fillStyle = pat; g.fillRect(x, y, w, h);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(x, y, w, h); g.restore();
    };
    const room = (g, s) => {
      if (ok(felt)) tex(g, felt, 0, 0, W, tableY, 0.55, '#F8E3BF');
      else { g.beginPath(); g.rect(0, 0, W, tableY); A.paper(g, s, '#F2E2C2', { shadow: 0, light: 0.03, grain: 0.3, box: { x: 0, y: 0, w: 0, h: H } }); }
      g.fillStyle = 'rgba(214,150,96,.17)';
      for (let y = 34, r = 0; y < tableY - 30; y += 62, r++) for (let x = (r % 2) * 34 + 22; x < W; x += 68) { g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill(); }
      const sh = g.createLinearGradient(0, tableY - 70, 0, tableY); sh.addColorStop(0, 'rgba(120,70,30,0)'); sh.addColorStop(1, 'rgba(120,70,30,.16)'); g.fillStyle = sh; g.fillRect(0, tableY - 70, W, 70);
      // the table
      if (ok(wood)) tex(g, wood, 0, tableY, W, H - tableY + 14, 0.7, '#F0A552');
      else { g.beginPath(); g.rect(0, tableY, W, H - tableY + 14); A.paper(g, s, '#E2A865', { shadow: 0, light: 0.05, grain: 0.3, box: { x: 0, y: tableY, w: 0, h: H - tableY } }); }
      const n = Math.max(3, Math.round(W / 330));
      A.line(g, 'rgba(140,80,30,.22)', 3, (h) => { for (let i = 1; i < n; i++) { const x = (i / n) * W; h.moveTo(x, tableY + 8); h.lineTo(x - 26, H + 10); } });
      g.beginPath(); A.rect(g, -20, tableY - 12, W + 40, 24, 8, 3, 0.6); A.paper(g, s, '#F4C27E', { shadow: 0.9, light: 0.06, box: { x: 0, y: tableY - 12, w: 0, h: 24 } });
      A.line(g, 'rgba(255,255,255,.4)', 3, (h) => { h.moveTo(0, tableY - 7); h.lineTo(W, tableY - 7); });
      if (land) shelf(g, s);
    };
    /* a little shelf of books and a plant, left of the picture (wide screens) */
    const shelf = (g, s) => {
      const x0 = Math.max(60, cardX - cardW / 2 - 330), sy = 372, w = 230;
      const P = (col, fn, o) => A.piece(g, s, col, fn, o);
      P('#C98B55', (h) => A.rect(h, x0, sy, w, 18, 6, 4, 0.5), { shadow: 0.9 });
      for (const bx of [x0 + 26, x0 + w - 40]) P('#A8713F', (h) => A.cut(h, [[bx, sy + 16], [bx + 14, sy + 16], [bx + 7, sy + 44]], 3, 0.4, 2), { shadow: 0.4 });
      [['#E8664A', 30, 104], ['#F2B33D', 26, 86], ['#5B8FC7', 34, 116], ['#6FA65F', 24, 92]].forEach(([c, bw, bh], i) => {
        const bx = x0 + 14 + [0, 32, 60, 96][i];
        P(c, (h) => A.rect(h, bx, sy - bh, bw, bh, 4, i + 2, 0.6), { shadow: 0.5, box: { x: bx, y: sy - bh, w: bw, h: bh } });
        g.fillStyle = 'rgba(255,253,246,.75)'; g.fillRect(bx + 5, sy - bh + 14, bw - 10, 6);
      });
      const px = x0 + w - 58;
      for (const [a, l] of [[-2.3, 54], [-1.57, 70], [-0.9, 56], [-2.8, 40], [-0.4, 40]]) { g.save(); g.translate(px, sy - 48); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.4, -l * 0.42, l, 0); g.quadraticCurveTo(l * 0.4, l * 0.34, 0, 0); A.paper(g, s, '#6FA65F', { shadow: 0.3, light: 0.06 }); g.restore(); }
      P('#D9785A', (h) => A.cut(h, [[px - 32, sy - 52], [px + 32, sy - 52], [px + 24, sy], [px - 24, sy]], 6, 0.5, 4), { shadow: 0.6, box: { x: px - 32, y: sy - 52, w: 64, h: 52 } });
    };
    const key = Math.round(W) + 'x' + Math.round(H);
    const bg = st.add({ z: 0 });
    bg.draw = (g) => { const sp = A.sprite('wordsroom' + key + (ok(felt) ? 'f' : '') + (ok(wood) ? 'w' : ''), [0, 0, W, H], room); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); };

    /* ---------- the picture card ---------- */
    const PANEL = ['#CFE6E8', '#F6D9C6', '#DCE9C8', '#E6DAEE', '#F8E6B4'];
    const card = st.add({ z: 5, x: cardX, y: cardY, rot: -0.018 });
    card.sprite = A.sprite('wordscard' + cardW, [-cardW / 2 - 6, -cardH / 2 - 22, cardW + 12, cardH + 30], (g, s) => {
      g.beginPath(); A.rect(g, -cardW / 2, -cardH / 2, cardW, cardH, 18, 5, 1.2); A.paper(g, s, '#FFFDF7', { shadow: 1, depth: 1.5, light: 0.03, box: { x: -cardW / 2, y: -cardH / 2, w: cardW, h: cardH } });
      for (const k of [-1, 1]) { g.save(); g.translate(k * (cardW / 2 - 60), -cardH / 2 - 2); g.rotate(k * 0.5 - 0.1); g.beginPath(); A.rect(g, -42, -13, 84, 26, 3, 9 + k, 1); A.paper(g, s, A.alpha('#F2B33D', 0.86), { shadow: 0.4, light: 0.05 }); g.restore(); }
    });
    const pw = cardW - 36, ph = cardH - 36;
    card.draw = (g) => { g.beginPath(); A.rect(g, -pw / 2, -ph / 2, pw, ph, 12, 8, 0.8); g.fillStyle = R ? PANEL[R.n % PANEL.length] : PANEL[0]; g.fill(); };
    const bw = pw - 44, bh = ph - 40;
    const picN = card.add(new E.Node({ x: 0, y: bh / 2, hit: { x: -bw / 2, y: -bh, w: bw, h: bh }, label: 'picture', pressable: false }));
    picN.draw = (g) => {
      const im = R && load(R.w.src);
      g.translate(0, -bh / 2 + Math.sin(st.t * 1.7) * 3); g.rotate(Math.sin(st.t * 1.1) * 0.012);
      if (ok(im)) {
        const k = Math.min(bw / im.naturalWidth, bh / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
        g.save(); g.shadowColor = 'rgba(46,40,70,.26)'; g.shadowBlur = 12 * st.res; g.shadowOffsetX = 3 * st.res; g.shadowOffsetY = 7 * st.res; g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
      } else { g.beginPath(); A.blob(g, 0, 0, 86, 80, 0.08, 4, 11); g.fillStyle = 'rgba(110,78,126,.3)'; g.fill(); for (const x of [-30, 0, 30]) { g.beginPath(); g.arc(x, 0, 8 + Math.sin(st.t * 5 + x) * 2, 0, 7); g.fillStyle = '#FFFDF7'; g.fill(); } }
    };
    function bounce(times) {
      const y0 = bh / 2; let p = Promise.resolve();
      for (let i = 0; i < times; i++) p = p.then(() => picN.to({ sy: 0.8, sx: 1.14 }, { dur: 0.11, ease: 'out' })).then(() => picN.to({ y: y0 - 64, sy: 1.1, sx: 0.93 }, { dur: 0.2, ease: 'out' })).then(() => picN.to({ y: y0, sy: 1, sx: 1 }, { dur: 0.18, ease: 'linear' })).then(() => picN.to({ sy: 0.86, sx: 1.1 }, { dur: 0.07, ease: 'out' }));
      return p.then(() => picN.to({ sx: 1, sy: 1 }, { dur: 0.5, ease: 'elastic' }));
    }
    // touching the picture: a little hop, and the word again (not while unscrambling: that is the puzzle)
    picN.onTap = () => { if (!R || R.over) return; K.sfx.pop(); bounce(1); if (R.kind !== 'jumble' || R.helped) K.say(wordS(R.w.word)); };

    /* ---------- stars for finished words ---------- */
    const starPath = (g, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.5 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); };
    const stars = st.add({ z: 4, x: Math.min(W - 56, cardX + cardW / 2 + 66), y: cardTop + 72, pop: 0 });
    stars.draw = (g, s) => {
      for (let i = 0; i < SET; i++) {
        g.save(); g.translate(0, i * 64); const on = i < won, k = on && i === won - 1 ? 1 + stars.pop * 0.5 : 1; g.scale(k, k); g.rotate(on ? Math.sin(st.t * 2 + i) * 0.08 : 0);
        starPath(g, 25); g.lineJoin = 'round';
        if (on) A.paper(g, s, '#F2B33D', { shadow: 0.7, light: 0.1, box: { x: -25, y: -25, w: 50, h: 50 } }); else { g.fillStyle = 'rgba(150,100,60,.16)'; g.fill(); }
        g.restore();
      }
    };
    stars.update = (dt) => { stars.pop = Math.max(0, stars.pop - dt * 2.2); };

    /* ---------- slots ---------- */
    const slotsN = st.add({ z: 10 });
    slotsN.draw = (g, s) => {
      if (!R || R.gone) return;
      const sl = R.slots, ss = R.ss, x0 = sl[0].x - ss / 2 - 22, x1 = sl[sl.length - 1].x + ss / 2 + 22;
      g.beginPath(); A.rect(g, x0, slotY + ss / 2 + 4, x1 - x0, 20, 8, 6, 0.6); A.paper(g, s, '#C98B55', { shadow: 0.9, light: 0.06, box: { x: x0, y: slotY + ss / 2, w: x1 - x0, h: 24 } });
      for (const o of sl) {
        const hov = R.hover === o && !o.tile, k = hov ? 1.07 : 1;
        g.save(); g.translate(o.x, o.y); g.scale(k, k);
        g.beginPath(); A.rect(g, -ss / 2, -ss / 2, ss, ss, ss * 0.2, 3, 0); g.fillStyle = hov ? 'rgba(255,253,246,.9)' : 'rgba(255,253,246,.6)'; g.fill();
        g.setLineDash([9, 8]); g.lineWidth = 3.5; g.strokeStyle = o.hint ? '#E59A1F' : 'rgba(130,86,50,.5)'; g.lineCap = 'round'; g.stroke(); g.setLineDash([]);
        if (!o.tile && (R.faint || o.hint)) {
          const a = o.hint ? 0.5 + Math.sin(st.t * 6) * 0.22 : 0.26;
          g.fillStyle = A.alpha(o.hint ? '#D9820F' : A.C.ink, a); g.font = `700 ${ss * 0.66}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(o.ch, 0, ss * 0.2);
        }
        g.restore();
      }
    };

    /* ---------- tiles ---------- */
    const tileSp = (ch) => A.sprite('wordstile' + ch + ts, [-ts / 2, -ts / 2, ts, ts + 9], (g, s) => {
      const col = colour(ch), seed = ch.charCodeAt(0);
      g.beginPath(); A.rect(g, -ts / 2, -ts / 2 + 9, ts, ts, ts * 0.2, seed, 0.8); A.paper(g, s, A.shade(col, -0.13), { shadow: 1 });
      g.beginPath(); A.rect(g, -ts / 2, -ts / 2, ts, ts, ts * 0.2, seed, 0.8); A.paper(g, s, col, { shadow: 0, light: 0.08, box: { x: -ts / 2, y: -ts / 2, w: ts, h: ts } });
      A.line(g, 'rgba(255,255,255,.28)', 3, (h) => { h.moveTo(-ts / 2 + 18, -ts / 2 + 9); h.lineTo(ts / 2 - 26, -ts / 2 + 9); });
      g.fillStyle = 'rgba(40,30,60,.22)'; g.font = `700 ${ts * 0.66}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(ch, 1.5, ts * 0.2 + 3);
      g.fillStyle = '#FFFDF6'; g.fillText(ch, 0, ts * 0.2);
    });
    function makeTile(ch, x, y, delay) {
      const node = st.add({ z: 30, x, y, sx: 0.01, sy: 0.01, sprite: tileSp(ch), hit: { x: -ts / 2, y: -ts / 2, w: ts, h: ts + 6 }, pad: 5, label: 'letter ' + ch, pressable: false });
      const t = { ch, node, hx: x, hy: y, tilt: (Math.random() - 0.5) * 0.09, slot: null, busy: true, pulse: false, grab: null, k: 1 };
      node.rot = t.tilt;
      node.to({ sx: 1, sy: 1 }, { dur: 0.34, ease: 'back', delay: delay || 0 }).then(() => { t.busy = false; });
      if (delay != null) ctx.after(delay * 1000, () => K.sfx.tone(500 + Math.random() * 300, 0.06, { type: 'triangle', vol: 0.08 }));
      node.draw = (g) => { if (!t.pulse) return; g.beginPath(); A.rect(g, -ts / 2 - 5, -ts / 2 - 5, ts + 10, ts + 19, ts * 0.24, 2, 0); g.strokeStyle = A.alpha('#FFD66B', 0.75 + Math.sin(st.t * 7) * 0.25); g.lineWidth = 7; g.stroke(); };
      node.update = () => { if (t.pulse && !t.grab && !node.tweens.length) node.sx = node.sy = t.k * (1 + Math.sin(st.t * 7) * 0.06); };
      const free = () => R && !R.over && !t.slot && !t.busy;
      node.onDown = (p) => {
        if (!free()) return;
        t.grab = { dx: node.x - p.x, dy: node.y - p.y }; node.z = 40; top();
        node.to({ sx: 1.13, sy: 1.13, rot: 0 }, { dur: 0.1, ease: 'out' });
        K.sfx.tap(); K.say(letterS(ch)); R.touched = true;
      };
      node.onMove = (p, e, s) => {
        if (!t.grab || s.moved < 10) return;
        node.x = K.clamp(p.x + t.grab.dx, ts / 2, W - ts / 2); node.y = K.clamp(p.y + t.grab.dy, 150, H - ts / 2);
        R.hover = near(node.x, node.y);
      };
      node.onUp = (p, e, s) => {
        if (!t.grab) return; t.grab = null;
        if (!R || R.over) { goHome(t); return; }
        const o = s.moved < 24 ? null : near(node.x, node.y); R.hover = null;
        if (s.moved < 24) tapTile(t); else if (o) tryPlace(t, o); else { K.sfx.tone(300, 0.08, { to: 220, vol: 0.1 }); goHome(t); }
      };
      node.onTap = (p) => { if (p || !free()) return; K.say(letterS(ch)); R.touched = true; tapTile(t); }; // keyboard / screen reader
      tiles.push(t);
      return t;
    }
    /** The empty slot a dragged tile is over, if any. */
    function near(x, y) {
      let best = null, bd = Math.max(ts * 0.8, R.ss * 0.9);
      for (const o of R.slots) { if (o.tile) continue; const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } }
      return best;
    }
    function goHome(t) {
      t.busy = true; t.k = 1;
      return t.node.to({ x: t.hx, y: t.hy, sx: 1, sy: 1, rot: t.tilt }, { dur: 0.36, ease: 'back' }).then(() => { t.busy = false; t.node.z = 30; top(); });
    }
    function tapTile(t) {
      const empty = R.slots.filter((o) => !o.tile);
      // with faint letters to match, a tapped tile finds its own letter; otherwise it goes to the next gap
      const o = (R.faint && empty.find((q) => q.ch === t.ch)) || empty[0];
      if (o) tryPlace(t, o); else goHome(t);
    }
    function setHint() {
      for (const t of tiles) t.pulse = false;
      const o = R.slots.find((q) => !q.tile && q.hint); if (!o) return;
      const t = tiles.find((q) => !q.slot && q.ch === o.ch); if (t) t.pulse = true;
    }
    function tryPlace(t, o) {
      const node = t.node, r = R;
      if (o.ch === t.ch) {
        t.slot = o; o.tile = t; o.hint = false; t.pulse = false; t.busy = true; t.k = (r.ss * 0.95) / ts; node.z = 20; top();
        node.to({ x: o.x, y: o.y - 4, sx: t.k, sy: t.k, rot: 0 }, { dur: 0.22, ease: 'back' }).then(() => { t.busy = false; });
        K.sfx.pop(); K.sfx.step(r.placed++); ctx.fx.burst(o.x, o.y, { n: 7, color: colour(t.ch) });
        setHint();
        if (r.slots.every((q) => q.tile)) finish();
        return;
      }
      r.misses++; o.miss++; t.busy = true; K.sfx.whoops();
      node.to({ x: o.x, y: o.y - 4, sx: 1, sy: 1 }, { dur: 0.14, ease: 'out' })
        .then(() => node.to({ rot: 0.2 }, { dur: 0.07 })).then(() => node.to({ rot: -0.2 }, { dur: 0.1 })).then(() => node.to({ rot: 0.12 }, { dur: 0.08 }))
        .then(() => goHome(t));
      if (o.miss >= 2 || r.misses >= 3) {       // show which letter belongs in the gap they are stuck on
        const h = o.miss >= 2 ? o : r.slots.find((q) => !q.tile);
        for (const q of r.slots) q.hint = false;
        h.hint = true; setHint(); r.helped = true;
        ctx.say(`${T.here} ${letterS(h.ch)}`);
      } else { r.helped = true; ctx.say(`${T.listen} ${wordS(r.w.word)}`); }
    }

    /* ---------- rounds ---------- */
    function distract(word, n) {
      const out = [];
      const add = (ch) => { if (out.length < n && !word.includes(ch) && !out.includes(ch)) out.push(ch); };
      for (const ch of K.shuffle(word.split(''))) for (const a of K.shuffle((ALIKE[ch] || '').split(''))) if (out.length < Math.ceil(n / 2) + 1) add(a);
      for (const ch of K.shuffle(ABC.replace(/[qxz]/g, '').split(''))) add(ch);
      return out;
    }
    function makeRound(force) {
      force = force || {};
      let lens, kind = 'build', extras = 0, faint = false, help = false;
      if (L === 1) { lens = [3]; faint = true; extras = skill >= 2 ? 1 : 0; }
      else if (L === 2) { lens = skill === 0 ? [3] : skill === 1 ? [3, 4] : [4]; extras = skill >= 2 ? 2 : 1; help = skill < 3; }
      else {
        lens = [[5], [5, 6], [6, 7], [7, 8, 9]][skill];
        const kinds = rounds === 0 ? ['build'] : ['build', 'missing', 'jumble'].filter((k) => k !== lastKind);
        kind = K.pick(kinds); extras = Math.min(4, 2 + skill);
      }
      const room = perRow * maxRows;
      if (force.kind) kind = force.kind;
      lens = lens.filter((n) => n <= maxLen && BY_LEN[n]);
      let pool = LIST.filter((w) => lens.includes(w.word.length) && !recent.includes(w.word));
      const ready = pool.filter((w) => ok(load(w.src))); if (ready.length) pool = ready;   // prefer pictures that have arrived
      let w = K.pick(pool);
      if (force.word) w = LIST.find((q) => q.word === force.word) || w;
      const word = w.word, S = { w, kind, faint, help, misses: 0, placed: 0, over: false, touched: false, helped: false, hover: null };
      S.fixed = [];
      if (kind === 'missing') {
        const gaps = K.sample(word.split('').map((c, i) => i), skill >= 2 && word.length >= 6 ? 2 : 1);
        S.fixed = word.split('').map((c, i) => i).filter((i) => !gaps.includes(i));
        S.letters = gaps.map((i) => word[i]).concat(distract(word, 3));
        S.prompt = `${gaps.length > 1 ? T.missing2 : T.missing1} ${wordS(word)}`; S.show = W < 700 ? 'Which letter?' : gaps.length > 1 ? T.missing2 : T.missing1;
      } else if (kind === 'jumble') {
        S.letters = word.split(''); S.prompt = T.jumble; S.show = W < 700 ? 'Unscramble!' : T.jumble;
      } else {
        S.letters = word.split('').concat(distract(word, Math.max(0, Math.min(extras, room - word.length)))); S.prompt = `${T.build} ${wordS(word)}`; S.show = T.build;
      }
      let order = K.shuffle(S.letters), guard = 0;
      while (order.join('').startsWith(word) && guard++ < 8) order = K.shuffle(S.letters);
      S.letters = order;
      return S;
    }
    function layout(n) {
      const per0 = ts > TS ? n : perRow, rows = Math.ceil(n / per0), per = Math.ceil(n / rows), out = [];
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / per), inRow = r === rows - 1 ? n - per * (rows - 1) : per, c = i - r * per;
        out.push({ x: W / 2 + (c - (inRow - 1) / 2) * (ts + tgap), y: trayMid + (r - (rows - 1) / 2) * rowH - (ts > TS && !land ? rowH * (maxRows - 1) / 2 - 20 : 0) });
      }
      return out;
    }
    function newRound(force) {
      for (const t of tiles.splice(0)) t.node.remove();
      const S = makeRound(force); S.n = rounds++;
      recent.push(S.w.word); if (recent.length > 6) recent.shift();
      lastKind = S.kind;
      const word = S.w.word, n = word.length, sgap = n > 6 ? 8 : 12;
      const ss = Math.min(land ? (n <= 5 ? 120 : 106) : n <= 4 ? 108 : 98, (W - 60 - (n - 1) * sgap) / n);
      const big = land ? 126 : 114; ts = (S.letters.length + 0) * (big + tgap) <= W - 60 ? big : TS;
      S.ss = ss;
      S.slots = word.split('').map((ch, i) => ({ i, ch, x: W / 2 + (i - (n - 1) / 2) * (ss + sgap), y: slotY, tile: null, miss: 0, hint: false }));
      R = S;
      for (const i of S.fixed) {                       // letters already in place (missing-letter rounds)
        const o = S.slots[i], t = makeTile(o.ch, o.x, o.y - 4, 0.1 + i * 0.05);
        t.slot = o; o.tile = t; t.k = (ss * 0.95) / ts; t.node.z = 20; t.node.rot = 0; t.tilt = 0;
        t.node.tweens.length = 0; t.node.to({ sx: t.k, sy: t.k }, { dur: 0.34, ease: 'back', delay: 0.1 + i * 0.05 }).then(() => { t.busy = false; });
      }
      const pos = layout(S.letters.length);
      S.letters.forEach((ch, i) => makeTile(ch, pos[i].x, pos[i].y, 0.25 + i * 0.07));
      top();
      picN.sx = picN.sy = 0.2; picN.y = bh / 2; picN.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back' });
      K.sfx.whoosh();
      const said = ctx.prompt(S.prompt, { show: S.show });
      if (S.help) Promise.all([said, ctx.wait(1300)]).then(() => {          // first-letter help
        if (R !== S || S.over || S.touched || S.placed) return;
        S.slots[0].hint = true; setHint(); ctx.say(`${T.starts} ${letterS(word[0])}`);
      });
    }
    async function finish() {
      const r = R; r.over = true;
      for (const t of tiles) { t.pulse = false; if (!t.slot) { t.busy = true; t.node.to({ sx: 0, sy: 0, rot: 0.6 }, { dur: 0.28, ease: 'inOut' }); } }
      await ctx.wait(380);
      r.slots.forEach((o, i) => ctx.after(i * 120, () => { const nd = o.tile.node, y = o.y - 4; K.sfx.step(i); nd.to({ y: y - 34 }, { dur: 0.12, ease: 'out' }).then(() => nd.to({ y }, { dur: 0.3, ease: 'elastic' })); }));
      await ctx.wait(r.slots.length * 120 + 260);
      K.sfx.sparkle(); bounce(2); ctx.fx.burst(cardX, cardY, { n: 20 });
      await Promise.all([ctx.say(wordS(r.w.word)), ctx.wait(1500)]);
      won++; stars.pop = 1; K.sfx.ding();
      if (r.misses === 0) { if (++streak >= 2) { skill = Math.min(3, skill + 1); streak = 0; } } else { streak = 0; if (r.misses >= 3) skill = Math.max(0, skill - 1); }
      await ctx.wait(650);
      for (const t of tiles) t.node.to({ y: t.node.y - 40, alpha: 0 }, { dur: 0.3, ease: 'inOut' });
      await ctx.wait(340); r.gone = true;
      if (won >= SET) { await ctx.celebrate(); won = 0; }
      newRound();
    }

    K._words = {   // for browser tests
      get R() { return R; }, tiles, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      next: (force) => newRound(force), place: (t, i) => tryPlace(t, R.slots[i]), unit: () => st.unit,
    };
    ctx.onExit(() => { K._words = null; });
    ctx.after(350, () => newRound());
  }

  K.game({ id: 'words', title: 'Word Builder', voice: 'words', group: 'arcade', age: 5, order: 26, icon, start, lines, resize: () => K.go('words') });
})();
