/* Pip's Playhouse — canvas engine.
   A Stage is one full-screen <canvas> with a small scene graph drawn every frame.

   Design space: the screen is always 1000 units tall (st.H may be taller on portrait phones, see
   fit below); st.W follows the aspect ratio. Art is authored in units, so it looks the same on a
   phone and a tablet. Nodes are drawn in world space shifted by the camera (times each node's
   parallax), or in screen space with {ui:true}.

   Tappable nodes get an invisible <button aria-label> laid over them, so screen readers, the
   keyboard and browser tests can find and press them. Real touches go to the canvas hit test. */
(function () {
  'use strict';
  const E = (K.engine = {});

  /* ---------------- easing & tweens ---------------- */
  E.ease = {
    linear: (t) => t,
    out: (t) => 1 - (1 - t) * (1 - t),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    back: (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, // overshoots, like cubic-bezier(.34,1.56,.64,1)
    elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
  };

  /* ---------------- nodes ---------------- */
  let nid = 0;
  class Node {
    constructor(o) {
      Object.assign(this, { x: 0, y: 0, sx: 1, sy: 1, rot: 0, alpha: 1, z: 0, parallax: 1, visible: true, children: [], tweens: [] }, o);
      this.id = ++nid;
      // Hit box in local units (relative to x,y): {x,y,w,h}; or radius hitR.
    }
    add(n) { n.parent = this; this.children.push(n); this._sorted = false; return n; }
    remove() { if (this.parent) { const c = this.parent.children; const i = c.indexOf(this); if (i >= 0) c.splice(i, 1); this.parent = null; } if (this.proxy) { this.proxy.remove(); this.proxy = null; } for (const k of this.children.slice()) k.remove(); }
    /** Animate numeric props. Returns a promise. opts {dur=0.3 s, ease='outCubic', delay=0} */
    to(props, opts) {
      opts = opts || {};
      const tw = { from: {}, props, t: -(opts.delay || 0), dur: Math.max(0.001, opts.dur == null ? 0.3 : opts.dur), ease: E.ease[opts.ease || 'outCubic'] || opts.ease };
      for (const k in props) tw.from[k] = this[k];
      // A new tween on a prop replaces any running one on that prop.
      this.tweens = this.tweens.filter((o) => { for (const k in props) if (k in o.props) { delete o.props[k]; } return Object.keys(o.props).length; });
      this.tweens.push(tw);
      return new Promise((res) => (tw.done = res));
    }
    /** Squash on press, springy release. */
    press() { this.to({ sx: this.bsx * 0.92, sy: this.bsy * 0.92 }, { dur: 0.09, ease: 'out' }).then(() => this.to({ sx: this.bsx, sy: this.bsy }, { dur: 0.42, ease: 'elastic' })); }
    get bsx() { return this._bsx == null ? (this._bsx = this.sx) : this._bsx; }
    get bsy() { return this._bsy == null ? (this._bsy = this.sy) : this._bsy; }
  }
  E.Node = Node;

  function tickTweens(n, dt) {
    if (n.tweens.length) {
      for (const tw of n.tweens.slice()) {
        tw.t += dt; if (tw.t < 0) continue;
        const p = Math.min(1, tw.t / tw.dur), e = tw.ease(p);
        for (const k in tw.props) n[k] = tw.from[k] + (tw.props[k] - tw.from[k]) * e;
        if (p >= 1) { n.tweens.splice(n.tweens.indexOf(tw), 1); tw.done && tw.done(); }
      }
    }
    if (n.update) n.update(dt);
    for (const c of n.children) tickTweens(c, dt);
  }

  /* ---------------- stage ---------------- */
  /** opts: {minW=0: on narrow screens shrink the unit so at least minW units fit across} */
  E.stage = function (host, opts) {
    opts = opts || {};
    const canvas = document.createElement('canvas');
    canvas.className = 'stage-canvas';
    const a11y = document.createElement('div');
    a11y.className = 'stage-a11y';
    host.append(canvas, a11y);
    const g = canvas.getContext('2d');
    const st = { canvas, g, a11y, root: new Node(), cam: { x: 0, y: 0 }, unit: 1, dpr: 1, W: 1000, H: 1000, t: 0, onframe: null, onresize: null, alive: true };
    st.root.stage = st;

    function fit() {
      const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
      st.dpr = Math.min(2, devicePixelRatio || 1);
      st.unit = Math.min(h / 1000, opts.minW ? w / opts.minW : Infinity);
      st.W = w / st.unit; st.H = h / st.unit; st.cssW = w; st.cssH = h;
      canvas.width = Math.round(w * st.dpr); canvas.height = Math.round(h * st.dpr);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      /** Device pixels per unit, for rasterising art at the right size. */
      st.res = st.unit * st.dpr;
      if (st.onresize) st.onresize();
    }
    st.fit = fit;
    fit();
    const ro = new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; if (Math.abs(w - st.cssW) > 1 || Math.abs(h - st.cssH) > 1) fit(); });
    ro.observe(host);

    /* ---- drawing ---- */
    function drawNode(n, cx, cy) {
      if (!n.visible || n.alpha <= 0) return;
      if (!n._sorted) { n.children.sort((a, b) => a.z - b.z); n._sorted = true; }
      g.save();
      const ox = n.ui ? 0 : cx * n.parallax, oy = n.ui ? 0 : cy * n.parallax;
      g.translate(n.x - ox, n.y - oy);
      if (n.rot) g.rotate(n.rot);
      if (n.sx !== 1 || n.sy !== 1) g.scale(n.sx, n.sy);
      if (n.alpha < 1) g.globalAlpha *= n.alpha;
      if (n.sprite) { const s = n.sprite; g.drawImage(s.canvas, -s.ox, -s.oy, s.w, s.h); }
      if (n.draw) n.draw(g, st);
      // Children are relative to the parent and inherit its camera shift.
      for (const c of n.children) drawNode(c, 0, 0);
      g.restore();
    }
    function frame(dt) {
      // A hidden tab or pane has no size yet; wait for the resize instead of drawing.
      if (!(st.unit > 0) || !isFinite(st.W)) return;
      st.t += dt;
      tickTweens(st.root, dt);
      if (st.onframe) st.onframe(dt, st.t);
      g.setTransform(st.res, 0, 0, st.res, 0, 0);
      g.clearRect(0, 0, st.W, st.H);
      if (st.background) st.background(g, st);
      if (!st.root._sorted) { st.root.children.sort((a, b) => a.z - b.z); st.root._sorted = true; }
      for (const c of st.root.children) drawNode(c, st.cam.x, st.cam.y);
      placeProxies();
    }
    let last = performance.now(), raf = 0;
    const loop = (now) => { if (!st.alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; try { frame(dt); } catch (e) { console.error(e); } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    st.frameNow = () => frame(0);

    /* ---- geometry ---- */
    /** Screen position (units) of a node's local point. */
    st.toScreen = function (n, lx, ly) {
      const chain = []; for (let p = n; p && p !== st.root; p = p.parent) chain.unshift(p);
      // Apply each transform to the point, innermost node first.
      let pt = { x: lx || 0, y: ly || 0 };
      for (let i = chain.length - 1; i >= 0; i--) {
        const c = chain[i];
        let px = pt.x * c.sx, py = pt.y * c.sy;
        if (c.rot) { const cs = Math.cos(c.rot), sn = Math.sin(c.rot); [px, py] = [px * cs - py * sn, px * sn + py * cs]; }
        pt = { x: px + c.x, y: py + c.y };
      }
      const top = chain[0];
      if (top && !top.ui) { pt.x -= st.cam.x * top.parallax; pt.y -= st.cam.y * top.parallax; }
      return pt;
    };
    /** Screen-space bounding box (units) of a node's hit area. */
    st.bounds = function (n) {
      const h = n.hit || (n.hitR ? { x: -n.hitR, y: -n.hitR, w: n.hitR * 2, h: n.hitR * 2 } : null);
      if (!h) return null;
      const pts = [[h.x, h.y], [h.x + h.w, h.y], [h.x, h.y + h.h], [h.x + h.w, h.y + h.h]].map(([x, y]) => st.toScreen(n, x, y));
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    };

    /* ---- input ---- */
    const tappables = () => { const out = []; const walk = (n) => { if (!n.visible) return; if (n.onTap || n.onDown) out.push(n); n.children.forEach(walk); }; walk(st.root); return out; };
    function pick(ux, uy) {
      let best = null;
      for (const n of tappables()) {
        const b = st.bounds(n); if (!b) continue;
        const pad = n.pad == null ? 12 : n.pad;
        if (ux >= b.x - pad && ux <= b.x + b.w + pad && uy >= b.y - pad && uy <= b.y + b.h + pad) {
          // Prefer the top-most (highest z, then later in the tree), and UI over world.
          let top = n, depth = 0; while (top.parent && top.parent !== st.root) { top = top.parent; depth++; }
          const score = (top.ui ? 1e6 : 0) + (top.z || 0) * 1000 + depth * 100 + (depth ? (n.z || 0) : 0) + n.id / 1e6; // children sit above their parent
          if (!best || score > best.score) best = { n, score };
        }
      }
      return best && best.n;
    }
    const toUnits = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / st.unit, y: (e.clientY - r.top) / st.unit }; };
    const pointers = new Map();
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', (e) => {
      const p = toUnits(e); const n = pick(p.x, p.y);
      pointers.set(e.pointerId, { sx: p.x, sy: p.y, x: p.x, y: p.y, n, moved: 0, t: performance.now() });
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (n && n.onDown) n.onDown(p, e);
      else if (n && n.onTap && n.pressable !== false) n.press();
      if (st.ondown) st.ondown(p, e, n);
    });
    canvas.addEventListener('pointermove', (e) => {
      const s = pointers.get(e.pointerId); const p = toUnits(e);
      if (s) { s.moved = Math.max(s.moved, Math.hypot(p.x - s.sx, p.y - s.sy)); s.x = p.x; s.y = p.y; if (s.n && s.n.onMove) s.n.onMove(p, e, s); }
      if (st.onmove) st.onmove(p, e, s);
    });
    const up = (e) => {
      const s = pointers.get(e.pointerId); if (!s) return; pointers.delete(e.pointerId);
      const p = toUnits(e);
      if (s.n && s.n.onUp) s.n.onUp(p, e, s);
      if (st.onup) st.onup(p, e, s);
      // A tap is a short press that barely moved. A drag never fires onTap.
      if (e.type === 'pointerup' && s.n && s.n.onTap && s.moved < 24 && !s.cancelled) s.n.onTap(p, e);
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    /** Stop the current presses becoming taps (e.g. once a drag starts). */
    st.cancelTaps = () => pointers.forEach((s) => (s.cancelled = true));

    /* ---- accessibility proxies ---- */
    function placeProxies() {
      const seen = new Set();
      for (const n of tappables()) {
        if (!n.label) continue;
        seen.add(n);
        if (!n.proxy || !n.proxy.isConnected) { // (a hidden node loses its proxy; make a new one when it returns)
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'proxy'; b.setAttribute('aria-label', n.label);
          // Keyboard and screen-reader presses arrive as clicks with no pointer behind them.
          b.addEventListener('click', (e) => { if (e.detail === 0 && n.onTap) { n.press(); n.onTap(null, e); } });
          a11y.append(b); n.proxy = b;
        }
        const bb = st.bounds(n);
        const onScreen = bb && bb.x + bb.w > 0 && bb.x < st.W && bb.y + bb.h > 0 && bb.y < st.H;
        n.proxy.hidden = !onScreen;
        if (onScreen) {
          const s = st.unit, st2 = n.proxy.style;
          st2.left = bb.x * s + 'px'; st2.top = bb.y * s + 'px'; st2.width = bb.w * s + 'px'; st2.height = bb.h * s + 'px';
        }
      }
      // Drop proxies whose nodes have gone.
      a11y.querySelectorAll('.proxy').forEach((b) => { if (![...seen].some((n) => n.proxy === b)) b.remove(); });
    }

    st.add = (n) => st.root.add(n instanceof Node ? n : new Node(n));
    st.destroy = function () { st.alive = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); a11y.remove(); };
    /** Detach from the page but keep everything (for screens that come back, like home). */
    st.pause = function () { st.alive = false; cancelAnimationFrame(raf); };
    st.resume = function (newHost) {
      if (newHost && canvas.parentNode !== newHost) { newHost.append(canvas, a11y); host = newHost; ro.disconnect(); ro.observe(host); }
      if (!st.alive) { st.alive = true; last = performance.now(); raf = requestAnimationFrame(loop); }
      fit();
    };
    return st;
  };
})();
