/* Pip's Playhouse — Story Time: short narrated story films to watch.
   The films are made outside the app (bedtime/ in the source repo) and listed in films/index.json as
   [{id, title, seconds}], with films/<id>.mp4 and a poster films/<id>.jpg each. */
(function () {
  'use strict';
  const A = K.art;
  let LIST = null;
  const load = () => (LIST ? Promise.resolve(LIST) : fetch('films/index.json').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((l) => (LIST = l)));

  function start(st, ctx) {
    const W = st.W, H = st.H;
    const seen = (K.s.done.films = K.s.done.films || {});
    // a calm night-sky wall behind the shelf
    st.add({ z: 0, sprite: A.sprite('filmsWall' + Math.round(W) + 'x' + Math.round(H), [0, 0, W, H], (g, s) => {
      g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#1E2C74', { shadow: 0, box: { x: 0, y: 0, w: W, h: H }, light: 0.04, grain: 0.3 });
      const rnd = A.rng(11);
      for (let i = 0; i < 46; i++) { const x = rnd() * W, y = rnd() * H, r = 2 + rnd() * 4; g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = A.alpha('#FBF6EC', 0.35 + rnd() * 0.5); g.fill(); }
      g.beginPath(); A.blob(g, W - 150, 150, 62, 62, 0.03, 5); A.paper(g, s, '#F7E7AE', { shadow: 0.6, light: 0.06, box: { x: W - 212, y: 88, w: 124, h: 124 } });
    }) });

    const host = st.canvas.parentNode;
    const shelf = K.el('div.films-shelf', { role: 'list', 'aria-label': 'Stories' });
    host.appendChild(shelf);
    let player = null;
    function close() {
      if (!player) return;
      const v = player.querySelector('video'); try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* ignore */ }
      player.remove(); player = null;
    }
    function play(f) {
      close(); K.hush(); ctx.prompt('', { silent: true });      // nothing talks over a film
      const v = K.el('video', { src: 'films/' + f.id + '.mp4', playsinline: '', 'webkit-playsinline': '', preload: 'auto', 'aria-label': f.title });
      v.addEventListener('ended', () => { seen[f.id] = true; K.save(); const c = shelf.querySelector('[data-id="' + f.id + '"]'); if (c) c.classList.add('seen'); close(); K.sfx.sparkle(); });
      v.addEventListener('click', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); });
      player = K.el('div.films-player', null, [v, K.el('button.films-close', { type: 'button', 'aria-label': 'Close the story', onclick: () => { K.sfx.tap(); close(); } })]);
      host.appendChild(player);
      v.play().catch(() => {});
    }
    ctx.onExit(() => { close(); shelf.remove(); K._films = null; });
    K._films = { list: () => LIST, play: (id) => { const f = (LIST || []).find((x) => x.id === id); if (f) play(f); }, close, playing: () => !!player };

    load().then((list) => {
      if (!ctx.alive) return;
      if (!list.length) { shelf.appendChild(K.el('div.films-empty', { text: 'The stories are on their way.' })); return; }
      for (const f of list) {
        shelf.appendChild(K.el('button.film-card' + (seen[f.id] ? '.seen' : ''), { type: 'button', role: 'listitem', 'data-id': f.id, 'aria-label': f.title, onclick: () => { K.sfx.pop(); play(f); } },
          [K.el('img', { src: 'films/' + f.id + '.jpg', alt: '', loading: 'lazy' }), K.el('i'), K.el('span', { text: f.title })]));
      }
    });
    ctx.prompt('Pick a story.');
  }
  const lines = () => ['Pick a story.'];
  K.game({ id: 'films', title: 'Story Time', voice: 'story', group: 'stories', order: 9, start, lines, resize: (st, ctx) => {} });
})();
