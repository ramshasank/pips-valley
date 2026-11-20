/* Story Studio — picture books the child acts out with their hands.
   A shelf of books in the story-tree nook. A tale is data (see story-tales.js): pages with a drawn
   scene, a sentence or two of narration and ONE hands-on action that moves the story on. A choice
   page really changes later pages and the ending.

   The action library, each returning a promise: P.drag, P.shake, P.rub, P.taps, P.hold, P.swipe,
   P.choice. Narration never blocks: the action is live while the sentence is still being read.
   No fail state: after a quiet spell a paper arrow appears and finishes the page for the child.
   Finished books and the choices made are kept in K.s.done.story. */
(function () {
  'use strict';
  const A = K.art, E = K.engine, St = A.story;
  const SAY = { pick: 'Pick a story!', end: 'The end.', turn: 'Turn the page!' };
  const val = (v, ch) => (typeof v === 'function' ? v(ch) : v);
  const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const lines = () => { const out = Object.values(SAY); for (const t of K.tales || []) { out.push(t.title); for (const l of t.lines()) out.push(l); } return out; };

  function start(st, ctx) {
    const W = st.W, H = st.H, port = W < 1000, k = port ? 0.8 : 1.3;
    const TH = port ? 290 : 176, SH = H - TH, G = SH - (port ? 250 : 150);
    const store = (K.s.done.story = K.s.done.story || {});
    const tales = K.tales || [];
    let pics = null; let view = 'shelf', tale = null, idx = 0, ch = {}, page = null, shelf = null, book = null, turning = false;
    const finger = { x: W / 2, y: SH / 2, t: -9, down: false, up: -9 };
    st.onmove = (p) => { finger.x = p.x; finger.y = p.y; finger.t = st.t; };
    st.ondown = (p) => { finger.x = p.x; finger.y = p.y; finger.t = st.t; finger.down = true; };
    st.onup = () => { finger.down = false; finger.up = st.t; };

    // a sheet of paper that covers the screen while the book opens and closes
    const veil = st.add({ ui: true, z: 80, alpha: 0, draw(g) { if (veil.alpha > 0.01) { g.fillStyle = '#F6EFE3'; g.fillRect(0, 0, W, H); } } });
    const cover = (fn) => veil.to({ alpha: 1 }, { dur: 0.28 }).then(() => { fn(); return veil.to({ alpha: 0 }, { dur: 0.35 }); });

    /* ============================ the shelf ============================ */
    const bs = port ? 0.7 : Math.min(1, (W - 360) / 3 / 280), gapX = port ? 180 : Math.min(330, (W - 300) / 3);
    const shelfY = port ? 790 : 640, shelfW = port ? 536 : gapX * 3 + 30;
    function coverSprite(t) {
      return A.sprite('stcover' + t.id, [-124, -164, 248, 328], (g, s) => {
        g.beginPath(); A.rect(g, -120, -160, 240, 320, 14, 3, 1); A.paper(g, s, t.color, { shadow: 1.3, depth: 1.4, box: { x: -120, y: -160, w: 240, h: 320 }, light: 0.08 });
        g.beginPath(); A.rect(g, -120, -160, 26, 320, [14, 2, 2, 14], 4, 0.5); g.fillStyle = A.shade(t.color, -0.1); g.fill();
        g.beginPath(); A.rect(g, -80, -138, 184, 190, 12, 5, 1); A.paper(g, s, t.sky || '#CFE6E8', { shadow: 0.5, light: 0.04, box: { x: -80, y: -138, w: 184, h: 190 } });
        g.save(); g.beginPath(); g.rect(-80, -138, 184, 190); g.clip(); g.translate(12, 40); t.cover(g, s); g.restore();
        g.fillStyle = '#FBF6EC'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const words = t.title.split(' '); const mid = Math.ceil(words.length / 2); const rows = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
        let fs = 30; g.font = `700 ${fs}px ${A.FONT_TITLE}`; while (Math.max(...rows.map((r) => g.measureText(r).width)) > 186 && fs > 16) { fs -= 2; g.font = `700 ${fs}px ${A.FONT_TITLE}`; }
        rows.forEach((r, i) => g.fillText(r, 12, 88 + (i - (rows.length - 1) / 2) * (fs + 4) + 8));
      });
    }
    function showShelf(justRead) {
      view = 'shelf'; tale = null; page = null;
      // fetch any generated pictures while the child looks at the shelf; a book only uses them if every one arrived
      for (const t of K.tales) if (t.art && !t._pics) { const m = (t._pics = {}); let left = t.art.names.length; for (const e of t.art.names) { const [nm, rel] = e.split('='); const im = new Image(); im.onload = () => { m[nm] = im; if (--left === 0) t.pics = m; }; im.src = rel ? 'img/' + rel + '.webp' : t.art.dir + '/' + nm + '.webp'; } }
      if (book) { book.remove(); book = null; }
      shelf = st.add({ z: 1 });
      shelf.add(new E.Node({ z: 0, sprite: A.sprite('stnook' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => St.nook(g, s, W, H, shelfY, shelfW)) }));
      tales.forEach((t, i) => {
        const x = W / 2 + (i - (tales.length - 1) / 2) * gapX, y = shelfY - 164 * bs - 2;
        const n = shelf.add(new E.Node({ x, y, z: 5, sx: bs, sy: bs, rot: (i - 1) * 0.025, hit: { x: -120, y: -160, w: 240, h: 320 }, pad: 6, label: t.title, sprite: coverSprite(t), ph: i * 1.7 }));
        n.update = () => { n.rot = (i - 1) * 0.025 + Math.sin(st.t * 1.1 + n.ph) * 0.012; };
        const rib = n.add(new E.Node({ x: 84, y: -160, z: 2, visible: !!store[t.id], draw: (g, s) => St.ribbon(g, s) }));
        if (justRead === t.id) { rib.visible = true; rib.y = -330; rib.alpha = 0; rib.to({ y: -160, alpha: 1 }, { dur: 0.7, ease: 'back', delay: 0.5 }).then(() => { K.sfx.sparkle(); const p = st.toScreen(n, 84, -110); ctx.fx.burst(p.x, p.y, { n: 14 }); }); }
        n.onTap = () => { if (view !== 'shelf') return; view = 'opening'; K.sfx.pop(); St.snd.page(); n.to({ sx: bs * 1.14, sy: bs * 1.14, y: y - 30 }, { dur: 0.25, ease: 'back' }); ctx.after(200, () => cover(() => openBook(t))); };
      });
      // Pip, waiting to be read to
      const pip = shelf.add(new E.Node({ x: port ? W * 0.2 : W * 0.12, y: port ? H - 96 : H - 150, z: 6, sx: port ? 0.95 : 1.15, sy: port ? 0.95 : 1.15, sq: 0, look: 0, blink: 0, bt: 2, hit: St.hit.pip, label: 'Pip' }));
      pip.draw = (g, s) => A.pip(g, s, { blink: pip.blink, squash: pip.sq + Math.sin(st.t * 2.4) * 0.012, look: pip.look, mouth: pip.mouth, wave: pip.wave || 0, leaf: Math.sin(st.t * 2) * 0.08 });
      pip.update = (dt) => { pip.bt -= dt; if (pip.bt < 0) pip.bt = 2 + Math.random() * 3; pip.blink = pip.bt < 0.14 ? 1 : 0; const tx = st.t - finger.t < 2.5 ? K.clamp((finger.x - pip.x) / 300, -1, 1) : 0.6; pip.look += (tx - pip.look) * Math.min(1, dt * 8); };
      pip.onTap = () => { St.snd.boing(); pip.mouth = 'open'; pip.to({ y: pip.y - 50 }, { dur: 0.16, ease: 'out' }).then(() => pip.to({ y: pip.y + 50 }, { dur: 0.3, ease: (t) => t * t })).then(() => { pip.mouth = 'smile'; }); K.say(SAY.pick); };
      ctx.prompt(SAY.pick);
    }

    /* ============================ the book ============================ */
    function openBook(t) {
      if (shelf) { shelf.remove(); shelf = null; }
      view = 'book'; tale = t; ch = {}; idx = 0;
      pics = t.art && t.pics ? t.pics : null;    // generated pictures, if this book has them and they have all arrived
      K.preloadVoice(t.voice);
      book = st.add({ z: 1 });
      // text band
      const band = book.add(new E.Node({ z: 500, hit: { x: 0, y: SH, w: W - 190, h: TH }, pad: 0, pressable: false, label: 'Read it again' }));
      band.draw = (g, s) => {
        g.beginPath(); g.moveTo(-10, H + 10); g.lineTo(-10, SH + 6); for (let x = 0; x <= W + 30; x += 30) g.lineTo(x, SH + Math.sin(x * 0.045) * 5 + Math.sin(x * 0.013) * 4); g.lineTo(W + 10, H + 10); g.closePath();
        g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 14 * s; g.shadowOffsetY = -3 * s; g.fillStyle = '#F6EFE3'; g.fill(); g.restore();
        if (!page) return;
        const maxW = W - (port ? 190 : 420), shown = page.shown;
        let fs = port ? 34 : 40, rows;
        for (; fs >= 20; fs -= 2) {
          g.font = `600 ${fs}px ${A.FONT_TITLE}`; rows = [];
          let row = [], w = 0; const sp = g.measureText(' ').width;
          shown.forEach((sen, si) => sen.split(' ').forEach((word) => { const ww = g.measureText(word).width; if (row.length && w + sp + ww > maxW) { rows.push({ row, w }); row = []; w = 0; } row.push({ word, si, ww }); w += (row.length > 1 ? sp : 0) + ww; }));
          if (row.length) rows.push({ row, w });
          if (rows.length * fs * 1.28 <= TH - (port ? 118 : 40)) break;
        }
        g.textBaseline = 'middle'; g.textAlign = 'left'; const sp = g.measureText(' ').width, lh = fs * 1.28;
        const cx = port ? (W - 150) / 2 + 8 : W / 2 - 20, y0 = SH + (port ? (TH - 96) / 2 : TH / 2) + 6 - ((rows.length - 1) * lh) / 2;
        rows.forEach((r, ri) => { let x = cx - r.w / 2; for (const it of r.row) { g.fillStyle = page.cur === it.si ? A.C.ink : page.cur < 0 ? A.alpha(A.C.ink, 0.86) : A.alpha(A.C.ink, 0.42); g.fillText(it.word, x, y0 + ri * lh); x += it.ww + sp; } });
        // page dots
        const n = tale.pages.length; for (let i = 0; i < n; i++) { g.beginPath(); g.arc(W / 2 + (i - (n - 1) / 2) * 20, port ? SH + TH - 100 : H - 18, i === idx ? 6 : 4, 0, 7); g.fillStyle = i === idx ? A.C.tomato : A.alpha(A.C.ink, 0.2); g.fill(); }
      };
      band.onTap = () => { if (page && page.alive) { const t2 = page.shown.slice(); K.hush(); page.cur = -1; t2.reduce((p, s2) => p.then(() => (page && page.alive ? K.say(s2) : null)), Promise.resolve()); } };
      // the arrow that turns the page
      const ar = book.add(new E.Node({ z: 510, x: W - (port ? 84 : 104), y: port ? SH + 96 : SH + TH / 2, hitR: port ? 60 : 64, label: 'Next page', visible: false, sx: 0, sy: 0 }));
      ar.draw = (g, s) => {
        const r = port ? 54 : 60, q = 1 + (page && page.done ? Math.sin(st.t * 5) * 0.06 : 0); g.save(); g.scale(q, q);
        g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, page && page.done ? A.C.tomato : '#E9B98C', { shadow: 1.1, light: 0.08, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
        g.beginPath(); A.cut(g, [[-26, -12], [2, -12], [2, -30], [32, 0], [2, 30], [2, 12], [-26, 12]], 6, 0, 3); g.fillStyle = '#FBF6EC'; g.fill(); g.restore();
      };
      ar.update = () => {
        const want = !!page && page.alive && !turning && (page.done || st.t - page.touch > 8);
        if (want && !ar.visible) { ar.visible = true; ar._bsx = ar._bsy = 1; ar.to({ sx: 1, sy: 1 }, { dur: 0.35, ease: 'back' }); if (page.done) K.sfx.tone(880, 0.12, { type: 'triangle', vol: 0.12 }); }
        if (!want && ar.visible && !ar.tweens.length) { ar.visible = false; ar.sx = ar.sy = 0; }
      };
      ar.onTap = () => { if (!page || turning) return; K.sfx.tap(); if (page.done) next(); else { page.auto = true; page.skip = true; const c = page._cur; if (c) (c.auto || c.fin)(); } };
      // back to the shelf
      const bk = book.add(new E.Node({ ui: true, z: 520, x: 78, y: 190, hitR: 46, label: 'Books' }));
      bk.draw = (g, s) => { g.beginPath(); g.arc(0, 0, 42, 0, 7); A.paper(g, s, '#FBF6EC', { shadow: 0.9, light: 0.03, box: { x: -42, y: -42, w: 84, h: 84 } }); [['#E8664A', -16], ['#2F8F8A', -2], ['#F2B33D', 12]].forEach(([col, x], i) => { g.beginPath(); A.rect(g, x - 6, -20 + i * 3, 12, 40 - i * 3, 3, i + 2, 0.4); g.fillStyle = col; g.fill(); }); };
      bk.onTap = () => { K.sfx.tap(); K.hush(); if (page) page.alive = false; cover(() => showShelf()); };
      startPage(0);
    }

    function next() {
      if (turning || !page) return;
      if (idx < tale.pages.length - 1) startPage(idx + 1); else finish();
    }
    function finish() {
      const t = tale, P = page; turning = true;
      store[t.id] = { n: ((store[t.id] || {}).n || 0) + 1, ch: Object.assign({}, ch) }; K.save();
      K.hush(); ctx.say(SAY.end);
      ctx.celebrate({ ms: 3000 }).then(() => { P.alive = false; turning = false; cover(() => showShelf(t.id)); });
    }

    function startPage(i) {
      const old = page; K.hush(); idx = i;
      const def = tale.pages[i];
      const node = book.add(new E.Node({ x: old ? W * 1.04 : 0, z: 10 + i }));
      const P = makePage(node, def); page = P;
      if (old) {
        old.alive = false; turning = true; St.snd.page();
        old.node.to({ x: -W * 1.04, rot: -0.03 }, { dur: 0.55, ease: 'inOut' }).then(() => old.node.remove());
        node.to({ x: 0 }, { dur: 0.55, ease: 'inOut' }).then(() => { turning = false; P.touch = st.t; });
      }
      const hint = val(def.hint, ch);
      ctx.prompt(hint || SAY.turn, { silent: true, show: (port && def.cap) || hint || SAY.turn });
      // narration, then the spoken hint, all on one queue so nothing talks over anything else
      ctx.after(old ? 500 : 250, () => { for (const t of arr(val(def.text, ch))) P.speak(t); if (hint) P.speak(hint, false, () => !P.done); });
      let ran;
      try { ran = Promise.resolve(def.scene(P)); } catch (e) { console.error(e); ran = Promise.resolve(); }
      ran.then(() => {
        if (!P.alive) return;
        P.done = true; P.hint = null;
        ctx.prompt(SAY.turn, { silent: true });
        for (const t of arr(val(def.more, ch))) P.speak(t);
        if (P.skip) ctx.after(700, () => { if (P.alive && page === P) next(); });
      });
    }

    /* ============================ one page ============================ */
    function makePage(node, def) {
      const P = { node, alive: true, done: false, auto: false, W, SH, H, G, k, port, ch, X: (f) => f * W, touch: st.t + 0.3, shown: [], cur: -1, hint: null, _cur: null, snd: St.snd, st };
      let chain = Promise.resolve();
      /** Queue a spoken sentence (and show it in the text band unless show === false). */
      P.speak = (t, show, ok) => { if (!t) return chain; chain = chain.then(() => { if (!P.alive || (ok && !ok())) return null; const i = show === false ? -1 : P.shown.push(t) - 1; P.cur = i; return ctx.say(t).then(() => { if (P.cur === i) P.cur = -1; }); }); return chain; };
      P.wait = (ms) => new Promise((res) => ctx.after(ms, () => { if (P.alive) res(); }));
      const tick = (n) => { n.update = (dt) => { if (n.tick0) n.tick0(dt); if (n.tick) n.tick(dt); }; };
      const withMood = (fn) => { const m = A.mood; A.mood = P.mood || 'day'; try { return fn(); } finally { A.mood = m; } };

      /* ---- generated picture-book art (tale.art): painted backgrounds and cut-out characters stand in for
         the drawn ones. Positions, touch areas and every motion stay exactly as they are. ---- */
      const art = pics && tale.art, upp = (nm) => (art.h[nm] || art.h[nm.replace(/-[a-z]+$/, '')]) / pics[nm].height;   // a face without its own height is as tall as the plain one
      P.pics = art ? pics : null; P.hillCol = (art && art.hill) || '#86B585';
      const pic = (g, nm, w, h, x, y) => g.drawImage(pics[nm], x, y, w, h);
      const picBg = (kind, o) => {
        o = o || {}; const im = pics['bg-' + kind], hz = art.horizon, flat = (art.flat || []).includes(kind);
        const sc = flat ? Math.max(W / im.width, H / im.height) : Math.max(W / im.width, G / (im.height * hz), (H - G) / (im.height * (1 - hz)));
        const orb = o.moon ? ['moon', W * (o.moon === 2 ? 0.84 : W < 1000 ? 0.36 : 0.21), W < 1000 ? 250 : 200, W < 1000 ? 0.8 : 1.15] : o.sun ? ['sun', W * 0.86, W < 1000 ? 260 : 200, W < 1000 ? 0.75 : 0.95] : null;
        const osp = orb && withMood(() => A.sprite('storb' + orb[0], [-170, -170, 340, 340], (g, s) => St.prop[orb[0]](g, s, {}))  /* room for the glow */);
        const n = node.add(new E.Node({ z: 0, kind }));
        n.draw = (g) => {
          g.drawImage(im, W / 2 - im.width * sc / 2, flat ? H / 2 - im.height * sc / 2 : G - im.height * hz * sc, im.width * sc, im.height * sc);
          if (orb) g.drawImage(osp.canvas, orb[1] - osp.ox * orb[3], orb[2] - osp.oy * orb[3], osp.w * orb[3], osp.h * orb[3]);
        };
        return n;
      };
      const picProp = (n, name) => {
        const [w, cx, by] = art.props[name] || [0, 0, 0], im = pics[name], h = im ? w * im.height / im.width : 0;
        n.sprite = null;
        if (art.custom && art.custom[name]) { n.draw = (g) => art.custom[name](g, n, st.t, pics); return; }
        n.draw = (g) => {
          const b = n.puff ? 1 + Math.sin(st.t * 18) * 0.03 : 1; g.save(); g.scale(b, 2 - b); pic(g, name, w, h, cx - w / 2, by - h); g.restore();
          if (name === 'puddle') { const age = st.t - (n.rip == null ? -9 : n.rip); if (age < 1.6) for (let i = 0; i < 3; i++) { const q = age / 1.6 - i * 0.18; if (q <= 0 || q > 1) continue; g.beginPath(); g.ellipse(n.ripX || 0, 0, 40 + q * 150, 9 + q * 34, 0, 0, 7); g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - q)})`; g.lineWidth = 4; g.stroke(); } }
        };
      };
      const picActor = (n, base) => {
        if (art.custom && art.custom[base]) { n.draw = (g) => { if (n.float) g.translate(0, Math.sin(st.t * 2 + n.id) * 8); art.custom[base](g, n, st.t, pics); }; return; }
        const sky = (art.sky || []).includes(base);     // things that float: no ground shadow, a soft glow and a gentle sway
        n.draw = (g) => {
          if (n.float) g.translate(0, Math.sin(st.t * 2 + n.id) * 8);
          const sq = n.sq || 0; if (!sky) A.groundShadow(g, 50 * (1 + Math.max(0, -sq) * 0.6), 0);
          const br = n.sleep ? Math.sin(st.t * 1.6) * 0.02 : Math.sin(st.t * 2.4 + n.id) * 0.008;
          g.scale(1 - sq * 0.5, 1 + sq + br); g.rotate((n.tilt || 0) * 0.5);
          if (sky) { const gl = n.glow == null ? 0.6 : n.glow, cy = -art.h[base] / 2; if (gl > 0) { const gr = g.createRadialGradient(0, cy, 20, 0, cy, 125); gr.addColorStop(0, `rgba(255,236,160,${Math.min(1, 0.55 * gl)})`); gr.addColorStop(1, 'rgba(255,236,160,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, cy, 125, 0, 7); g.fill(); } g.translate(0, cy); g.rotate(Math.sin(st.t * 1.6) * 0.05); g.translate(0, -cy); }
          const one = (nm, a) => { if (!pics[nm]) nm = base; const im = pics[nm], u = upp(nm), w = im.width * u, h = im.height * u; if (a < 1) { g.save(); g.globalAlpha *= a; } pic(g, nm, w, h, -w / 2, (sky ? 0 : 6) - h); if (a < 1) g.restore(); };
          const mud = n.mud || 0, m = n.mouth, v = n.sleep ? 'sleep' : n.wink ? 'wink' : m === 'sad' ? 'sad' : m === 'oh' && pics[base + '-oh'] ? 'oh' : m === 'open' || m === 'oh' || (n.arms || 0) > 0.4 || (n.wave || 0) > 0.3 ? 'happy' : '';
          if (mud < 0.98 || !pics[base + '-mud']) one(v ? base + '-' + v : base, 1);
          if (mud > 0.02 && pics[base + '-mud']) one(base + '-mud', Math.min(1, mud));
        };
      };
      P.bg = (kind, o) => { if (art && pics['bg-' + kind]) { P.mood = St.mood(kind); return picBg(kind, o); } P.mood = St.mood(kind); return node.add(new E.Node({ z: 0, kind, sprite: A.sprite('stbg' + kind + JSON.stringify(o || {}) + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => St.bg(g, s, kind, W, H, G, o)) })); };
      /** Custom static art over the whole scene. */
      P.paint = (key, z, fn) => node.add(new E.Node({ z, sprite: withMood(() => A.sprite('stpt' + tale.id + key + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], fn)) }));
      P.prop = (name, x, y, o) => {
        o = o || {}; const sc = (o.scale || 1) * k;
        const n = node.add(new E.Node(Object.assign({ x, y, z: 5, sx: sc * (o.flip ? -1 : 1), sy: sc, name }, o)));
        const box = St.box[name];
        if (box) { n.sprite = withMood(() => A.sprite('stp' + name + (o.cargo || '') + (o.lit ? 'L' : ''), box, (g, s) => St.prop[name](g, s, o, 0))); n.hit = n.hit || { x: box[0], y: box[1], w: box[2], h: box[3] }; }
        else { n.draw = (g, s) => St.prop[name](g, s, n, st.t); n.hit = n.hit || St.hit[name]; }
        if (art && ((art.props[name] && pics[name]) || (art.custom && art.custom[name]))) picProp(n, name);
        tick(n); return n;
      };
      P.actor = (kind, x, y, o) => {
        o = o || {}; const sc = (o.scale || 1) * k;
        const n = node.add(new E.Node(Object.assign({ x, y, z: 10, sx: sc * (o.flip ? -1 : 1), sy: sc, kind, sq: 0, look: 0, blink: 0, wave: 0, mouth: 'smile', bt: 1 + Math.random() * 3, hit: St.hit[kind] || St.hit.critter }, o)));
        n.draw = (g, s) => { if (n.float) g.translate(0, Math.sin(st.t * 2 + n.id) * 8); St.actor(g, s, n, st.t); };
        n.tick0 = (dt) => {
          n.bt -= dt; if (n.bt < 0) n.bt = 2 + Math.random() * 3; n.blink = n.sleep ? 1 : n.bt < 0.14 ? 1 : 0;
          const p = st.toScreen(n, 0, -80); let tx = st.t - finger.t < 2.5 ? K.clamp((finger.x - p.x) / 260, -1, 1) : n.gaze || 0; if (n.sx < 0) tx = -tx;
          n.look += (tx - n.look) * Math.min(1, dt * 8);
        };
        if (art) { const nm = art.actors(kind, o); if (nm && pics[nm]) picActor(n, nm); }
        tick(n); return n;
      };
      /** An invisible touch area. */
      P.zone = (x, y, w, h, z) => node.add(new E.Node({ x, y, z: z == null ? 3 : z, hit: { x: 0, y: 0, w, h }, pad: 0 }));

      /* ---- little motions ---- */
      P.hop = (n, h) => { const y = n.y, d = (h || 50) * k; n.sq = 0.1; return n.to({ y: y - d, sq: 0.12 }, { dur: 0.17, ease: 'out' }).then(() => n.to({ y, sq: 0 }, { dur: 0.2, ease: (t) => t * t })).then(() => { n.sq = -0.14; return n.to({ sq: 0 }, { dur: 0.4, ease: 'elastic' }); }); };
      P.squash = (n, a) => { n.sq = -(a || 0.2); return n.to({ sq: 0 }, { dur: 0.5, ease: 'elastic' }); };
      P.cheer = (n) => { n.mouth = 'open'; n.arms = 1; P.hop(n, 70).then(() => { n.mouth = 'smile'; n.arms = 0; }); };
      P.at = (n, lx, ly) => st.toScreen(n, lx || 0, ly == null ? -70 : ly);
      P.burst = (n, o) => { const p = n instanceof E.Node ? P.at(n) : n; ctx.fx.burst(p.x, p.y, o || { n: 12 }); };
      /* ---- particles drawn in the page: steam, drops, hearts, sleepy z ---- */
      const parts = [];
      P.rain = 0;
      P.puff = (x, y, kind, n, o) => { o = o || {}; for (let i = 0; i < (n || 1); i++) { const a = Math.random() * 6.283; parts.push(Object.assign({ x: x + (Math.random() - 0.5) * 20, y, kind, t: 0, life: kind === 'drop' ? 0.9 : 1.5, r: (kind === 'steam' ? 16 : kind === 'drop' ? 7 : 15) * k * (0.7 + Math.random() * 0.6),
        vx: kind === 'drop' ? Math.cos(a) * 260 * k * (o.spread || 1) : (Math.random() - 0.5) * 50 + (o.vx || 0), vy: kind === 'drop' ? -(260 + Math.random() * 420) * k * (o.up || 1) : -(70 + Math.random() * 60) * k, g: kind === 'drop' ? 1500 * k : 0 }, o.p)); } };
      const fxn = node.add(new E.Node({ z: 70 }));
      fxn.update = (dt) => { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > p.life || (p.g && p.y > G + 40 && p.vy > 0)) parts.splice(i, 1); } };
      fxn.draw = (g) => {
        if (P.rain > 0.01) { g.save(); g.strokeStyle = 'rgba(214,232,244,.75)'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); const n = Math.round(46 * P.rain * (W / 1000)); for (let i = 0; i < n; i++) { const sx = ((i * 197.3) % W), sp = 900 + (i % 7) * 60, yy = ((st.t * sp + i * 131) % (G + 80)) - 40; if (P.rainTop && yy < P.rainTop) continue; g.moveTo(sx - yy * 0.08, yy); g.lineTo(sx - yy * 0.08 - 3, yy + 26); } g.stroke(); g.restore(); }
        for (const p of parts) {
          const q = p.t / p.life; g.save(); g.translate(p.x, p.y); g.globalAlpha = Math.max(0, 1 - q * q);
          if (p.kind === 'steam') { g.beginPath(); g.arc(0, 0, p.r * (1 + q * 1.4), 0, 7); g.fillStyle = '#FBF8F1'; g.fill(); }
          else if (p.kind === 'drop') { g.beginPath(); g.moveTo(0, -p.r * 1.5); g.quadraticCurveTo(p.r, 0, 0, p.r); g.quadraticCurveTo(-p.r, 0, 0, -p.r * 1.5); g.fillStyle = p.col || '#9CCBEA'; g.fill(); }
          else if (p.kind === 'heart') { const r = p.r * (0.6 + q * 0.6); g.beginPath(); g.moveTo(0, r * 0.9); g.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.7, -r * 1.3, 0, -r * 0.4); g.bezierCurveTo(r * 0.7, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9); g.fillStyle = '#E8664A'; g.fill(); }
          else if (p.kind === 'z') { const r = p.r * (0.7 + q * 0.8); A.line(g, 'rgba(255,255,255,.9)', 4 * k, (h) => { h.moveTo(-r, -r); h.lineTo(r, -r); h.lineTo(-r, r); h.lineTo(r, r); }); }
          g.restore();
        }
      };

      /* ---- actions ---- */
      /** Bring the thing to act on to the front, for the eye and for the finger. */
      const lift = (n, o) => { if (o && o.flat) return; if ((n.z || 0) < 40) { n.z = 40 + (n.z || 0) * 0.1; if (n.wag) n.wag.z = n.z - 0.05; node._sorted = false; } };
      function action(setup, slow) {
        return new Promise((res) => {
          let over = false;
          const a = { t0: st.t, slow: slow || 15, fin: () => { if (over) return; over = true; if (P._cur === a) P._cur = null; P.hint = null; P.touch = st.t; res(); }, auto: null };
          P._cur = a; setup(a.fin, a);
          if (P.auto) ctx.after(60, () => { if (P.alive && !over) (a.auto || a.fin)(); });
        });
      }
      const off = (n) => { n.onDown = n.onMove = n.onUp = n.onTap = null; };
      const pt = (t) => (typeof t === 'function' ? t() : t);

      /** Drag a thing to a place. target {x,y} or a function. o {r, label, path(x) -> y, onMove}
          Forgiving: it lands when let go anywhere near, or most of the way there; it snaps in when it
          gets close; and each tap carries it a third of the way. */
      P.drag = (n, target, o) => action((fin, a) => {
        o = o || {}; const home = { x: n.x, y: n.y }, r = (o.r || 250) * k; let grab = null, busy = false, glide = null;
        n.label = o.label || n.label || 'drag'; n.pad = 60; lift(n, o); P.hint = { kind: 'drag', n, to: target, ty: o.markY, path: o.path, home };
        const tg = () => { const t = pt(target); return { x: t.x, y: o.path ? o.path(t.x) : t.y }; };
        const follow = () => { if (o.path) n.y = o.path(n.x); if (o.onMove) o.onMove(n); };
        const prog = () => { const t = tg(), tx = t.x - home.x, ty = o.path ? 0 : t.y - home.y; return ((n.x - home.x) * tx + (o.path ? 0 : (n.y - home.y) * ty)) / (tx * tx + ty * ty || 1); };
        const dist = () => { const t = tg(); return Math.hypot(n.x - t.x, o.path ? 0 : n.y - t.y); };
        const t0 = n.tick;
        n.tick = (dt) => { if (t0) t0(dt); if (!glide) return; glide.q = Math.min(1, glide.q + dt / glide.dur); const e = glide.q * glide.q * (3 - 2 * glide.q); n.x = glide.x0 + (glide.x1 - glide.x0) * e; if (!o.path) n.y = glide.y0 + (glide.y1 - glide.y0) * e; follow(); if (glide.q >= 1) { const fn = glide.then; glide = null; if (fn) fn(); } };
        const go = (x1, y1, dur, then) => { glide = { x0: n.x, y0: n.y, x1, y1, dur, q: 0, then }; };
        const land = (dur) => { if (busy) return; busy = true; off(n); grab = null; n.held = false; const t = tg(); go(t.x, t.y, dur, () => { n.tick = t0; follow(); K.sfx.pop(); fin(); }); };
        a.auto = () => land(o.path ? 1.1 : 0.7);
        n.onDown = (p) => { if (busy) return; P.touch = st.t; glide = null; grab = { x: n.x - p.x, y: n.y - p.y }; n.held = true; K.sfx.tap(); };
        n.onMove = (p) => { if (!grab || busy) return; P.touch = st.t; n.x = K.clamp(p.x + grab.x, 30, W - 30); n.y = K.clamp(p.y + grab.y, 150, SH - 10); follow(); if (dist() < 80 * k || (o.path && prog() > 0.8)) land(0.18); };
        n.onUp = () => { if (!grab || busy) return; grab = null; n.held = false; if (dist() < r || prog() > 0.6) land(0.3); else if (!o.path && Math.hypot(n.x - home.x, n.y - home.y) > 30 && prog() < 0.15) go(home.x, home.y, 0.4); };
        n.onTap = (p) => { if (busy) return; if (!p) return a.auto(); P.touch = st.t; const f = prog() + 0.36; if (f > 0.6) return land(0.35); const t = tg(); K.sfx.step(3); go(home.x + (t.x - home.x) * f, home.y + (t.y - home.y) * f, 0.3); };
      });

      /** Wiggle a thing until it comes loose. Any back-and-forth, however small, counts; so does a tap. o {n, amp, label, step(count)} */
      P.shake = (n, o) => action((fin, a) => {
        o = o || {}; const need = o.n || 3, amp = (o.amp || 70) * k, hx = n.x; let c = 0, last = null, dir = 0, trav = 0, busy = false;
        n.label = o.label || n.label || 'shake'; n.pad = 70; lift(n, o); P.hint = { kind: 'shake', n, need, got: 0 };
        const bump = () => { c++; P.touch = st.t; if (P.hint) P.hint.got = c; K.sfx.tone(480 + c * 90, 0.1, { type: 'triangle', vol: 0.2 }); if (o.step) o.step(c, need); if (c >= need) { busy = true; off(n); n.to({ x: hx }, { dur: 0.25, ease: 'back' }).then(fin); } };
        a.auto = () => { const go = () => { if (busy || !P.alive) return; n.to({ x: hx + amp * (c % 2 ? -1 : 1) }, { dur: 0.13 }).then(() => { bump(); go(); }); }; go(); };
        n.onDown = (p) => { last = p; dir = 0; trav = 0; P.touch = st.t; };
        n.onMove = (p) => { if (last == null || busy) return; P.touch = st.t; const dx = p.x - last.x, dy = p.y - last.y; last = p; n.x = K.clamp(n.x + dx, hx - amp, hx + amp); const d = Math.sign(dx); if (d && d !== dir) { if (dir && trav > 8 * k) { bump(); trav = 0; } dir = d; } trav += Math.abs(dx) + Math.abs(dy) * 0.6; if (!busy && trav > 130 * k) { trav = 0; bump(); } };
        n.onUp = () => { last = null; if (!busy) n.to({ x: hx }, { dur: 0.5, ease: 'elastic' }); };
        n.onTap = () => { if (busy) return; n.x = hx + amp * 0.7 * (c % 2 ? -1 : 1); n.to({ x: hx }, { dur: 0.5, ease: 'elastic' }); bump(); };
      });

      /** Rub a thing (to clean it, or to rub something away). A little rubbing goes a long way; taps count too. o {dist, label, step(prog, point)} */
      P.rub = (n, o) => action((fin, a) => {
        o = o || {}; const need = Math.min(o.dist || 600, 600) * k; let acc = 0, last = null, busy = false;
        n.label = o.label || n.label || 'rub'; n.pad = 60; n.prog = 0; lift(n, o); P.hint = { kind: 'rub', n, at: o.at };
        const add = (d, p) => { if (busy) return; acc += d; P.touch = st.t; n.prog = Math.min(1, acc / need); if (o.step) o.step(n.prog, p); if (n.prog >= 1) { busy = true; off(n); fin(); } };
        a.auto = () => { const t = ctx.every(60, () => { if (busy || !P.alive) { clearInterval(t); return; } add(need / 14); }); };
        n.onDown = (p) => { last = p; add(need * 0.06, p); };
        n.onMove = (p) => { if (!last) return; add(Math.hypot(p.x - last.x, p.y - last.y), p); last = p; if (Math.random() < 0.25) K.sfx.noise(0.05, { freq: 1800 + Math.random() * 900, vol: 0.05 }); };
        n.onUp = () => { last = null; };
        n.onTap = (p) => { add(need * (p ? 0.22 : 0.34), p); };
      });

      /** Tap one thing n times, or each of several things once. o {n, count:'up'|'down', label, step(count, node)} */
      P.taps = (ns, o) => action((fin, a) => {
        o = o || {}; const list = Array.isArray(ns) ? ns : [ns], need = o.n || list.length, seen = new Set(); let c = 0, busy = false;
        P.hint = { kind: 'tap', n: list[0], need, got: 0 };
        const hit = (n) => {
          if (busy || !n) return;
          if (list.length > 1) { if (seen.has(n)) { P.hop(n, 20); return; } seen.add(n); }
          c++; P.touch = st.t;
          if (o.count) K.say(K.numWord(o.count === 'down' ? need - c + 1 : c)); else K.sfx.step(c + 2);
          if (o.step) o.step(c, n);
          const nx = list.find((m) => !seen.has(m)); if (P.hint) { P.hint.got = c; if (list.length > 1 && nx) P.hint.n = nx; }
          if (c >= need) { busy = true; list.forEach((m) => { m.onTap = null; }); fin(); }
        };
        list.forEach((n) => { n.label = n.label || o.label || 'tap'; n.pad = 50; lift(n, o); n.onTap = () => hit(n); });
        a.auto = () => { const t = ctx.every(480, () => { if (busy || !P.alive) { clearInterval(t); return; } hit(list.length > 1 ? list.find((m) => !seen.has(m)) : list[0]); }); };
      });

      /** Press and hold a thing until it is full: well under a second, and short presses add up. o {secs, label, step(prog, holding, dt)} */
      P.hold = (n, o) => action((fin, a) => {
        o = o || {}; const secs = Math.min(o.secs || 0.8, 0.8); let down = false, busy = false, autoing = false;
        n.prog = 0; n.label = o.label || n.label || 'hold'; n.pad = 60; lift(n, o); P.hint = { kind: 'hold', n };
        const t0 = n.tick;
        n.tick = (dt) => {
          if (t0) t0(dt); if (busy) return;
          if (down || autoing) { n.prog = Math.min(1, n.prog + dt / secs); P.touch = st.t; } else n.prog = Math.max(0, n.prog - dt * 0.08);
          if (o.step) o.step(n.prog, down || autoing, dt);
          if (n.prog >= 1) { busy = true; off(n); n.tick = t0; fin(); }
        };
        n.onDown = () => { down = true; n.prog = Math.min(0.97, n.prog + 0.22); K.sfx.tap(); };
        n.onUp = () => { down = false; };
        n.onTap = (p) => { if (!p) autoing = true; }; // a keyboard press cannot be held, so it fills by itself
        a.auto = () => { autoing = true; };
      });

      /** Swipe across a thing (to blow or to push). It follows the finger from the first touch: every bit of
          sideways travel counts, short strokes and taps too. o {n, dir, label, step(count, dir), live(frac, dir)} */
      P.swipe = (n, o) => action((fin, a) => {
        o = o || {}; const need = o.n || 3, per = (o.per || 85) * k; let c = 0, last = null, part = 0, got = false, dir = o.dir || 1, busy = false;
        n.label = o.label || n.label || 'swipe'; if (n.pad == null) n.pad = 60; lift(n, o); P.hint = { kind: 'swipe', n, at: o.at, dir: o.dir || 1, both: !o.dir };
        const live = () => { if (o.live) o.live(Math.min(1, (c + Math.min(1, part / per)) / need), dir); };
        const go = (d) => { if (busy) return; c++; got = true; P.touch = st.t; if (o.step) o.step(c, d, need); live(); if (c >= need) { busy = true; off(n); fin(); } };
        n.onDown = (p) => { last = p; part = 0; got = false; P.touch = st.t; };
        n.onMove = (p) => { if (!last || busy) return; const dx = p.x - last.x, dy = p.y - last.y; last = p; P.touch = st.t; if (dx) dir = Math.sign(dx); part += Math.abs(dx) + Math.abs(dy) * 0.5; while (part >= per && !busy) { part -= per; go(dir); } if (!busy) live(); };
        n.onUp = () => { if (last && !busy && !got && part > 22 * k) { part = 0; go(dir); } last = null; part = 0; if (!busy) live(); };
        n.onTap = () => go(o.dir || dir);
        a.auto = () => { const t = ctx.every(520, () => { if (busy || !P.alive) { clearInterval(t); return; } go(o.dir || 1); }); };
      });

      /** Choose one of two or three drawn cards. Sets P.ch[key]. opts [{id, label, draw(g, s, t)}], o {y, to:{x,y}} */
      P.choice = (key, opts, o) => action((fin, a) => {
        o = o || {}; const cs = port ? 156 : 210, gap = port ? 22 : 44, tot = opts.length * cs + (opts.length - 1) * gap, y = o.y || SH * (port ? 0.37 : 0.34); let busy = false; const cards = [];
        const pick = (c) => {
          if (busy) return; busy = true; P.touch = st.t; ch[key] = c.opt.id; K.sfx.ding(); P.hint = null;
          cards.forEach((d) => { d.onTap = null; if (d !== c) d.to({ alpha: 0, sx: 0.6, sy: 0.6 }, { dur: 0.3 }).then(() => d.remove()); });
          const p = P.at(c, 0, 0); ctx.fx.burst(p.x, p.y, { n: 14 });
          c.to({ sx: 1.18, sy: 1.18 }, { dur: 0.25, ease: 'back' }).then(() => P.wait(450)).then(() => c.to({ alpha: 0, sx: 0.3, sy: 0.3, x: (o.to || c).x, y: (o.to || c).y }, { dur: 0.35, ease: 'inOut' })).then(() => { c.remove(); fin(); });
        };
        opts.forEach((opt, i) => {
          const c = node.add(new E.Node({ x: W / 2 - tot / 2 + cs / 2 + i * (cs + gap), y: y - 50, alpha: 0, z: 60, hit: { x: -cs / 2, y: -cs / 2, w: cs, h: cs }, pad: 10, label: opt.label, opt, ph: i * 1.3 }));
          c.draw = (g, s) => { g.save(); g.translate(0, Math.sin(st.t * 2 + c.ph) * 6); g.rotate(Math.sin(st.t * 1.3 + c.ph) * 0.02); g.beginPath(); A.rect(g, -cs / 2, -cs / 2, cs, cs, 28, i + 3, 1.2); A.paper(g, s, '#FBF6EC', { shadow: 1.2, depth: 1.4, box: { x: -cs / 2, y: -cs / 2, w: cs, h: cs } }); g.scale(cs / 210, cs / 210); const im = art && pics[opt.id]; if (im) { const q = Math.min(150 / im.width, 160 / im.height); g.drawImage(im, -im.width * q / 2, -im.height * q / 2, im.width * q, im.height * q); } else opt.draw(g, s, st.t); g.restore(); };
          c.to({ alpha: 1, y }, { dur: 0.4, ease: 'back', delay: 0.12 * i + 0.25 }); c.onTap = () => pick(c); cards.push(c);
        });
        P.hint = { kind: 'tap', n: cards[0], all: cards, t0: st.t + 0.9 }; P.cards = cards;
        a.auto = () => pick(K.pick(cards));
      }, 24);

      /* ---- the wordless guide: the thing to touch glows, and a paper hand acts out the move on it.
         It is there about a second after the page settles, steps aside while the child is touching,
         and comes straight back. If the page is still not done after a long while, it finishes itself. ---- */
      const ctr = (n) => { const b = st.bounds(n); return b ? { x: b.x + b.w / 2 - node.x, y: b.y + b.h / 2, r: Math.max(60, Math.min(b.w, b.h) / 2) } : { x: n.x, y: n.y, r: 80 }; };
      const HS = port ? 1.05 : 1.3;
      const hand = (g, press) => { g.save(); g.scale(HS, HS); A.hand(g, st.res, press); g.restore(); };
      const arrow = (g, x0, y0, x1, y1, w) => { const a = Math.atan2(y1 - y0, x1 - x0), hd = w * 3.2; g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; for (const [col, lw] of [[A.alpha(A.C.ink, 0.35), w + 6], ['#FFFFFF', w]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.moveTo(x1 - Math.cos(a - 0.6) * hd, y1 - Math.sin(a - 0.6) * hd); g.lineTo(x1, y1); g.lineTo(x1 - Math.cos(a + 0.6) * hd, y1 - Math.sin(a + 0.6) * hd); g.stroke(); } g.restore(); };
      const smooth01 = (e) => { e = Math.max(0, Math.min(1, e)); return e * e * (3 - 2 * e); };
      // the glow sits just behind the thing itself
      const gl = node.add(new E.Node({ z: 39 }));
      gl.update = () => { const h = P.hint; const v = h && (h.at || h.n); if (v && !h.all && gl.for !== v) { gl.for = v; gl.z = (v.z || 0) - 0.02; node._sorted = false; } };
      gl.draw = (g) => {
        const h = P.hint; if (!h || !P.alive || h.all) return;
        const c = ctr(h.at || h.n), r = c.r * 1.55 + 30, pulse = 0.5 + 0.5 * Math.sin(st.t * 4.2);
        const gr = g.createRadialGradient(c.x, c.y, r * 0.25, c.x, c.y, r * (1 + pulse * 0.12)); gr.addColorStop(0, `rgba(255,246,196,${0.62 + pulse * 0.2})`); gr.addColorStop(0.6, `rgba(255,236,150,${0.3 + pulse * 0.12})`); gr.addColorStop(1, 'rgba(255,236,150,0)');
        g.fillStyle = gr; g.fillRect(c.x - r * 1.2, c.y - r * 1.2, r * 2.4, r * 2.4);
      };
      const hn = node.add(new E.Node({ z: 90 }));
      hn.update = () => {
        const c = P._cur; if (!c || P.done || !P.alive || turning || finger.down) return;
        if (st.t - c.t0 > c.slow && st.t - P.touch > 3) { c.t0 = 1e9; P.auto = true; (c.auto || c.fin)(); }
      };
      hn.draw = (g) => {
        const h = P.hint; if (!h || !P.alive) return;
        const t = st.t, c0 = ctr(h.all ? h.all[Math.floor(t / 1.6) % h.all.length] : h.at || h.n);
        const quiet = Math.min(t - P.touch, finger.down ? 0 : t - finger.up + 0.4, t - (h.t0 || 0));
        // where it goes: a dotted trail and a ring at the place (always on, so a held thing knows its way)
        if (h.kind === 'drag') {
          const to = pt(h.to), ty = h.ty != null ? h.ty : (h.path ? h.path(to.x) : to.y) - 66 * k, pulse = 0.5 + 0.5 * Math.sin(t * 4);
          g.save(); const gr = g.createRadialGradient(to.x, ty, 10, to.x, ty, 110 * k); gr.addColorStop(0, `rgba(255,246,196,${0.5 + pulse * 0.2})`); gr.addColorStop(1, 'rgba(255,246,196,0)'); g.fillStyle = gr; g.fillRect(to.x - 120 * k, ty - 120 * k, 240 * k, 240 * k);
          g.setLineDash([16, 13]); g.lineDashOffset = -t * 26; g.lineCap = 'round';
          for (const [col, lw] of [[A.alpha(A.C.ink, 0.3), 11], ['#FFFFFF', 6]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(to.x, ty, 80 * k + pulse * 5, 0, 7); g.stroke();
            g.beginPath(); if (h.path) { const x0 = h.n.x, n2 = 18; for (let i = 0; i <= n2; i++) { const x = x0 + (to.x - x0) * (i / n2), y = h.path(x) - 66 * k; if (i) g.lineTo(x, y); else g.moveTo(x, y); } } else { const dx = to.x - c0.x, dy = ty - c0.y, L = Math.hypot(dx, dy) || 1, cut = Math.min(L * 0.45, 86 * k); g.moveTo(c0.x, c0.y); g.lineTo(to.x - (dx / L) * cut, ty - (dy / L) * cut); } g.stroke(); }
          g.restore();
        }
        // how many taps or wiggles are left
        if ((h.kind === 'tap' || h.kind === 'shake') && h.need > 1 && !h.all) { const n2 = h.need, y = c0.y - c0.r - 34 * k; for (let i = 0; i < n2; i++) { const x = c0.x + (i - (n2 - 1) / 2) * 36; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fillStyle = A.alpha(A.C.ink, 0.3); g.fill(); g.beginPath(); g.arc(x, y, 10, 0, 7); g.fillStyle = i < h.got ? A.C.marigold : '#FFFFFF'; g.fill(); } }
        if (quiet < 0.6) return;
        const a = Math.min(1, (quiet - 0.6) * 3.5); let x = c0.x, y = c0.y, press = 0;
        g.save(); g.globalAlpha = a;
        if (h.kind === 'drag') {
          const q = (t * 0.42) % 1, to = pt(h.to), ty = h.ty != null ? h.ty : (h.path ? h.path(to.x) : to.y) - 66 * k, e = smooth01((q - 0.2) / 0.55);
          x = c0.x + (to.x - c0.x) * e; y = h.path ? h.path(h.n.x + (to.x - h.n.x) * e) - 66 * k : c0.y + (ty - c0.y) * e; press = q > 0.12 && q < 0.82 ? 1 : 0; g.globalAlpha = a * (q > 0.86 ? Math.max(0, 1 - (q - 0.86) / 0.1) : Math.min(1, q / 0.08));
        } else if (h.kind === 'shake') { const w = Math.max(70, c0.r * 0.9); x += Math.sin(t * 8) * w * 0.6; press = 1; arrow(g, c0.x - 20, c0.y - c0.r - 6, c0.x - w - 40, c0.y - c0.r - 6, 9); arrow(g, c0.x + 20, c0.y - c0.r - 6, c0.x + w + 40, c0.y - c0.r - 6, 9); }
        else if (h.kind === 'rub') { x += Math.sin(t * 8) * 58 * k; y += Math.sin(t * 2.1) * 34 * k; press = 1; g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const yy = c0.y - 30 * k + i * 30 * k; g.beginPath(); g.moveTo(c0.x - 64 * k, yy); g.quadraticCurveTo(c0.x, yy - 14, c0.x + 64 * k, yy); g.stroke(); } g.restore(); }
        else if (h.kind === 'swipe') {
          const q = (t * 0.7) % 1, e = smooth01((q - 0.15) / 0.5), span = Math.min(260 * k, W * 0.3), d = h.both && Math.floor(t * 0.7) % 2 ? -h.dir : h.dir;
          x = c0.x + (e - 0.5) * 2 * span * d; press = q > 0.1 && q < 0.7 ? 1 : 0; g.globalAlpha = a * (q > 0.75 ? Math.max(0, 1 - (q - 0.75) / 0.15) : Math.min(1, q / 0.08));
          g.save(); g.globalAlpha = a; arrow(g, c0.x - span * d, c0.y - 70 * k, c0.x + span * d, c0.y - 70 * k, 11); g.restore();
        } else if (h.kind === 'hold') {
          const q = (t * 0.6) % 1, f = smooth01((q - 0.15) / 0.6); press = q > 0.1 ? 1 : 0;
          g.save(); g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 62, 0, 7); g.strokeStyle = A.alpha(A.C.ink, 0.25); g.lineWidth = 14; g.stroke(); g.beginPath(); g.arc(x, y, 62, -1.57, -1.57 + Math.max(0.02, (h.n.prog > 0.05 ? h.n.prog : f)) * 6.283); g.strokeStyle = '#FFFFFF'; g.lineWidth = 10; g.stroke(); g.restore();
        } else {
          const q = (t * 1.25) % 1; press = q < 0.35 ? 1 : 0; y -= press ? 0 : 26 * Math.sin(((q - 0.35) / 0.65) * Math.PI);
          if (q < 0.6) { g.save(); g.beginPath(); g.arc(c0.x, c0.y, 26 + q * 80, 0, 7); g.strokeStyle = `rgba(255,255,255,${1 - q / 0.6})`; g.lineWidth = 7; g.stroke(); g.restore(); }
        }
        g.translate(x, y); hand(g, press);
        g.restore();
      };
      return P;
    }

    /* ============================ go ============================ */
    K._story = {
      /** For the browser test: open a book at a page. */
      open(id, i) { if (view === 'shelf') openBook(K.tales.find((t) => t.id === id)); if (i) { ch.pal = ch.pal || 'frog'; startPage(i); } },
      get view() { return view; }, get tale() { return tale && tale.id; }, get idx() { return idx; }, get ch() { return ch; }, get store() { return store; },
      get done() { return !!(page && page.done); }, get turning() { return turning; }, get pages() { return tale ? tale.pages.length : 0; },
      /** What the current action wants, in screen units, for the browser test. */
      get hint() {
        const h = page && page.hint; if (!h) return null;
        const b = st.bounds(h.n), out = { kind: h.kind, label: h.n.label, x: b.x + b.w / 2, y: b.y + b.h / 2, dir: h.dir || 1 };
        if (h.to) { const t = typeof h.to === 'function' ? h.to() : h.to; out.tx = t.x; out.ty = t.y; out.gx = h.n.x; out.gy = h.n.y; }
        if (h.all) out.labels = h.all.map((c) => c.label);
        return out;
      },
    };
    ctx.onExit(() => { K._story = null; });
    showShelf();
  }

  K.game({ id: 'story', title: 'Story Studio', voice: 'story', group: 'stories', order: 1, start, lines, resize: () => K.go('story') });
})();
