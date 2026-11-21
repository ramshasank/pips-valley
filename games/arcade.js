/* Pip's Playhouse — the Game Room: a shelf of every small game, grouped by the age it suits.
   A game joins the shelf by registering with group 'arcade', an `age` (3, 5 or 7) and an
   `icon(g, w)` that draws its square picture into a plain 2D canvas context. */
(function () {
  'use strict';
  const A = K.art;
  const BANDS = [{ age: 3, title: 'Little ones', sub: 'ages 3 and up' }, { age: 5, title: 'Growing up', sub: 'ages 5 and up' }, { age: 7, title: 'Big kids', sub: 'ages 7 and up' }];
  // what each game mostly teaches; a game can say so itself with `subject`, this covers the ones that do not
  const SUBJECT = { bubbles: 'play', moles: 'play', seek: 'thinking', shapes: 'math', oddone: 'thinking', jigsaw: 'thinking', memory: 'memory', echo: 'music',
    patterns: 'math', dots: 'math', words: 'reading', rocket: 'math', grid: 'thinking', maze: 'thinking', clock: 'math', robot: 'coding' };
  const SUBJECTS = [['all', 'All games'], ['math', 'Maths'], ['reading', 'Words'], ['thinking', 'Thinking'], ['memory', 'Memory'], ['science', 'Science'], ['world', 'Feelings'], ['music', 'Music'], ['coding', 'Coding'], ['play', 'Just for fun']];
  const SAY = { all: 'All the games.', math: 'Maths games.', reading: 'Word games.', thinking: 'Thinking games.', memory: 'Memory games.', science: 'Science games.', world: 'Games about feelings.', music: 'Music games.', coding: 'Coding games.', play: 'Just for fun.' };
  const subjectOf = (d) => d.subject || SUBJECT[d.id] || 'play';
  const games = () => K.activities.filter((a) => a.group === 'arcade').sort((a, b) => (a.order || 0) - (b.order || 0));

  function paint(cv, def) {
    def = K.activities.find((a) => a.id === def.id) || def;
    const w = cv.width, g = cv.getContext('2d');
    g.clearRect(0, 0, w, w);
    try { g.save(); if (def.icon) def.icon(g, w); g.restore(); } catch (e) { console.error(e); }
  }

  function start(st, ctx) {
    const W = st.W, H = st.H;
    st.add({ z: 0, sprite: A.sprite('arcadeWall' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#F3DDB8', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.04, grain: 0.3 });
      const rnd = A.rng(23), cols = [A.C.tomato, A.C.marigold, A.C.teal, A.C.blue, A.C.plum, A.C.leaf];
      for (let i = 0; i < 40; i++) { const x = rnd() * W, y = rnd() * H, r = 10 + rnd() * 26; g.beginPath(); A.blob(g, x, y, r, r, 0.08, i); g.fillStyle = A.alpha(cols[i % cols.length], 0.13); g.fill(); }
    }) });
    const host = st.canvas.parentNode;
    const shelf = K.el('div.arcade-shelf', { 'aria-label': 'Games' });
    host.appendChild(shelf);
    const mine = K.level() >= 3 ? 7 : K.level() === 2 ? 5 : 3;                // the player's own age band comes first
    const bands = BANDS.slice().sort((a, b) => (b.age === mine) - (a.age === mine) || a.age - b.age);
    const list = games(), canvases = [], rows = [];
    const observer = window.IntersectionObserver ? new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        const cv = entry.target, def = list.find((d) => d.id === cv.dataset.game);
        observer.unobserve(cv);
        K.ensureActivity(def.id).then(() => {
          if (!ctx.alive) return;
          paint(cv, def);
          ctx.after(900, () => paint(cv, def));
        }).catch(() => {}); // the card remains usable; opening it offers a retry
      }
    }, { root: shelf, rootMargin: '100px' }) : null;
    const have = new Set(list.map(subjectOf));
    let pick = have.has(K.s.done.arcadeSubject) ? K.s.done.arcadeSubject : 'all';
    const chips = K.el('div.arcade-chips', { role: 'group', 'aria-label': 'Kinds of game' });
    const show = () => {
      for (const c of chips.children) c.classList.toggle('on', c.dataset.s === pick);
      for (const r of rows) { let n = 0; for (const c of r.row.children) { const ok = pick === 'all' || c.dataset.s === pick; c.hidden = !ok; if (ok) n++; } r.row.hidden = r.head.hidden = !n; }
    };
    for (const [id, title] of SUBJECTS) {
      if (id !== 'all' && !have.has(id)) continue;
      chips.appendChild(K.el('button.arcade-chip.arcade-s-' + id, { type: 'button', 'data-s': id, 'aria-label': title, text: title,
        onclick: () => { K.sfx.tap(); pick = id; K.s.done.arcadeSubject = id; K.save(); show(); shelf.scrollTop = 0; K.say(SAY[id]); } }));
    }
    if (list.length) shelf.appendChild(chips);
    for (const b of bands) {
      const mineList = list.filter((d) => (d.age || 3) === b.age);
      if (!mineList.length) continue;
      const head = K.el('div.arcade-band.arcade-age' + b.age, null, [K.el('b', { text: b.title }), K.el('span', { text: b.sub })]);
      shelf.appendChild(head);
      const row = K.el('div.arcade-row', { role: 'list' });
      for (const d of mineList) {
        const cv = K.el('canvas', { width: 300, height: 300, 'aria-hidden': 'true' });
        canvases.push([cv, d]); paint(cv, d);
        cv.dataset.game = d.id;
        if (observer) observer.observe(cv);
        else K.ensureActivity(d.id).then(() => { if (ctx.alive) paint(cv, d); }).catch(() => {});
        row.appendChild(K.el('button.arcade-card.arcade-age' + b.age, { type: 'button', role: 'listitem', 'data-id': d.id, 'data-s': subjectOf(d), 'aria-label': d.title,
          onclick: () => { K.sfx.pop(); K.s.done.arcadeLast = d.id; K.go(d.id); } }, [cv, K.el('span', { text: d.title })]));
      }
      shelf.appendChild(row); rows.push({ head, row });
    }
    show();
    if (!list.length) shelf.appendChild(K.el('div.arcade-band', { text: 'The games are on their way.' }));
    ctx.after(900, () => canvases.forEach(([cv, d]) => paint(cv, d)));          // pictures that were still loading
    ctx.after(2600, () => canvases.forEach(([cv, d]) => paint(cv, d)));
    const last = K.s.done.arcadeLast && shelf.querySelector('[data-id="' + K.s.done.arcadeLast + '"]');
    if (last) ctx.after(60, () => { try { last.scrollIntoView({ block: 'center' }); } catch (e) { /* ignore */ } });
    ctx.onExit(() => { if (observer) observer.disconnect(); shelf.remove(); K._arcade = null; });
    K._arcade = { list: () => games().map((d) => d.id), subjects: () => games().map((d) => d.id + ':' + subjectOf(d)) };
    ctx.prompt('Pick a game.');
  }
  K.game({ id: 'arcade', title: 'Game Room', voice: 'arcade', group: 'hub', order: 1, start, lines: () => ['Pick a game.'].concat(Object.keys(SAY).map((k) => SAY[k])), resize: () => {} });
})();
