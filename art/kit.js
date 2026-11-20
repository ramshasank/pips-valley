/* Pip's Playhouse — drawing kit for the "cut-paper picture book" look.
   Everything a child sees is drawn with these helpers, so it shares one light, one palette and one
   paper texture. No emoji. Art is drawn in design units (see engine/stage.js) into cached bitmaps. */
(function () {
  'use strict';
  const A = (K.art = K.art || {});

  /* ---------------- palette ---------------- */
  A.C = {
    sky: '#CFE6E8', skyTop: '#A9D3DD', horizon: '#F3E9D6',
    far: '#A9C9B4', far2: '#95BCA4', mid: '#7FB08A', mid2: '#6EA37B', ground: '#5E9A6B', meadow: '#74AC73',
    paper: '#F6EFE3', cream: '#F3DDB8', ink: '#2E2A3B', path: '#E8D6B0',
    tomato: '#E8664A', marigold: '#F2B33D', peach: '#F4B49A', teal: '#2F8F8A', plum: '#6E4E7E', blue: '#5B8FC7',
    leaf: '#6FA65F', leafDark: '#4F8752', leafLight: '#93C27A', bark: '#8A5A3C', barkDark: '#6B4430', wood: '#C08A5A',
    barn: '#C9553F', roof: '#5A4256', water: '#86BCD0', glow: '#F7D27A', white: '#FBF8F1', slate: '#3E5A52',
    shadow: 'rgba(58,53,80,.18)',
  };

  /* ---------------- colour maths ---------------- */
  const hexRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgbHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  function rgbHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function hslHex(h, s, l) { h = ((h % 360) + 360) % 360; const f = (n) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return rgbHex(f(0) * 255, f(8) * 255, f(4) * 255); }
  A.mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
  /** Hue-shifted shading: shade(c, -0.1) darkens toward cool violet, shade(c, +0.1) lightens toward warm yellow. */
  A.shade = function (hex, amt) {
    const [h, s, l] = rgbHsl(...hexRgb(hex));
    const target = amt < 0 ? 250 : 50, k = Math.min(1, Math.abs(amt) * 1.6);
    let dh = ((target - h + 540) % 360) - 180;
    return hslHex(h + dh * k * 0.35, Math.min(1, s * (amt < 0 ? 1.05 : 0.95)), Math.max(0, Math.min(1, l + amt)));
  };
  A.alpha = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };

  /* ---------------- time of day ----------------
     Painters ask A.c('tomato') rather than A.C.tomato, so the whole scene can be re-lit at dusk or
     night with one tint, keeping its relationships. Lit windows and lanterns skip the tint. */
  A.mood = 'day';
  const TINT = { day: null, dusk: ['#D9826F', 0.2], night: ['#222B52', 0.56] };
  const tcache = {};
  A.c = function (name, keep) {
    const base = A.C[name] || name;
    const t = TINT[A.mood]; if (!t || keep) return base;
    const k = A.mood + base + (keep || '');
    return tcache[k] || (tcache[k] = A.mix(base, t[0], t[1]));
  };
  /** How much a tappable thing is tinted: less than the scenery so it stays readable at night. */
  A.ct = function (name) { const t = TINT[A.mood]; const base = A.C[name] || name; return t ? A.mix(base, t[0], t[1] * 0.55) : base; };
  A.moodFor = function (d) { const q = new URLSearchParams(location.search).get('time'); if (q) return q; const h = (d || new Date()).getHours() + (d || new Date()).getMinutes() / 60; return h >= 6.5 && h < 17.5 ? 'day' : h >= 17.5 && h < 19.5 ? 'dusk' : 'night'; };

  /* ---------------- randomness (seeded, so art is the same every time) ---------------- */
  A.rng = function (seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------------- paths ---------------- */
  /** Smooth closed (or open) curve through points (Catmull-Rom). */
  A.smooth = function (g, pts, open) {
    const n = pts.length; if (n < 2) return;
    const P = (i) => (open ? pts[Math.max(0, Math.min(n - 1, i))] : pts[(i + n) % n]);
    g.moveTo(pts[0][0], pts[0][1]);
    const last = open ? n - 1 : n;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (!open) g.closePath();
  };
  /** Points round an ellipse with a hand-cut wobble (wob as a fraction of the radius). */
  A.blobPts = function (cx, cy, rx, ry, n, wob, r) {
    const out = []; const ph = r ? r() * 6.28 : 0;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + ph; const k = 1 + (r ? (r() - 0.5) * 2 * wob : 0); out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return out;
  };
  A.blob = (g, cx, cy, rx, ry, wob, seed, n) => { A.smooth(g, A.blobPts(cx, cy, rx, ry, n || 9, wob == null ? 0.04 : wob, A.rng(seed || 1))); };
  /** Polygon with slightly imperfect, rounded corners — the shape of a hand-cut paper piece. */
  A.cut = function (g, pts, rad, wob, seed) {
    const r = A.rng(seed || 7); const j = wob == null ? 1.5 : wob;
    const p = pts.map(([x, y]) => [x + (r() - 0.5) * 2 * j, y + (r() - 0.5) * 2 * j]);
    const n = p.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(p[n - 1], p[0]); g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; const rr = Array.isArray(rad) ? rad[i] : rad; g.arcTo(a[0], a[1], b[0], b[1], rr == null ? 6 : rr); }
    g.closePath();
  };
  /** Rounded rectangle cut from paper. */
  A.rect = (g, x, y, w, h, rad, seed, wob) => A.cut(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], rad == null ? 6 : rad, wob, seed);

  /* ---------------- paper texture ---------------- */
  let grain = null;
  function grainTile() {
    if (grain) return grain;
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const x = c.getContext('2d'); const img = x.createImageData(160, 160); const r = A.rng(42);
    // Fibrous paper: soft noise with a few longer streaks, centred on mid-grey for overlay blending.
    for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 46; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    x.globalAlpha = 0.18; x.strokeStyle = '#fff'; x.lineWidth = 0.6;
    for (let i = 0; i < 70; i++) { const a = r() * 6.28, px = r() * 160, py = r() * 160, l = 3 + r() * 9; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    return (grain = c);
  }

  /** Fill the current path as a piece of cut paper: soft drop shadow, light from the top-left,
      paper grain. s = device pixels per unit of g (shadows ignore the transform).
      opts: {shadow=true|0..1, light=0.06, grain=0.22, depth=1} */
  A.paper = function (g, s, color, opts) {
    opts = opts || {};
    const path = opts.path; // optional Path2D; otherwise the current path
    const fill = () => (path ? g.fill(path) : g.fill());
    const sh = opts.shadow == null ? 1 : opts.shadow;
    const box = opts.box; // {x,y,w,h} for the light gradient; defaults to a guess from the current transform
    if (sh) {
      g.save(); g.shadowColor = `rgba(46,40,70,${0.2 * sh})`; g.shadowBlur = 9 * s * (opts.depth || 1); g.shadowOffsetX = 2.5 * s * (opts.depth || 1); g.shadowOffsetY = 5 * s * (opts.depth || 1);
      g.fillStyle = color; fill(); g.restore();
    }
    const L = opts.light == null ? 0.06 : opts.light;
    if (L && box) {
      const gr = g.createLinearGradient(box.x, box.y, box.x + box.w * 0.6, box.y + box.h);
      gr.addColorStop(0, A.shade(color, L)); gr.addColorStop(0.55, color); gr.addColorStop(1, A.shade(color, -L * 0.9));
      g.fillStyle = gr;
    } else g.fillStyle = color;
    fill();
    const G = opts.grain == null ? 0.22 : opts.grain;
    if (G) {
      g.save(); if (path) g.clip(path); else g.clip();
      const pat = g.createPattern(grainTile(), 'repeat');
      if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1.4 / s));
      g.globalCompositeOperation = 'overlay'; g.globalAlpha = G; g.fillStyle = pat;
      g.fillRect(-1e4, -1e4, 2e4, 2e4); g.restore();
    }
  };
  /** Shorthand: begin a path, let fn trace it, fill as paper. */
  A.piece = function (g, s, color, fn, opts) { g.beginPath(); fn(g); A.paper(g, s, color, opts); };
  /** A thin pencil-like line (stitches, plank lines, chalk). */
  A.line = function (g, color, w, fn, cap) { g.save(); g.beginPath(); fn(g); g.strokeStyle = color; g.lineWidth = w; g.lineCap = cap || 'round'; g.lineJoin = 'round'; g.stroke(); g.restore(); };

  /** The pointing paper hand that shows a move. The tip of the pointing finger is at (0,0) and the hand
      hangs down to the right. The pointing finger stands alone on one edge, the thumb pokes out low on
      the far side and the other fingers are a row of small curled knuckles. press 0..1 dips it down. */
  A.hand = function (g, s, press) {
    press = press || 0;
    g.save(); g.translate(0, (1 - press) * -14); g.rotate(-0.36);
    const skin = '#FFF9EE', ink = 'rgba(46,42,59,.5)';
    const body = () => {
      g.beginPath();
      A.rect(g, -15, -2, 30, 96, 15, 1, 0);                    // the pointing finger
      A.rect(g, -17, 70, 81, 66, 22, 2, 0);                    // palm
      g.moveTo(41, 72); g.ellipse(28, 72, 13, 14, 0, 0, 7);    // three curled fingers, each lower than the last
      g.moveTo(57, 77); g.ellipse(45, 77, 12, 13, 0, 0, 7);
      g.moveTo(68, 86); g.ellipse(58, 86, 10, 12, 0, 0, 7);
      g.moveTo(-10, 100); g.ellipse(-27, 100, 13, 27, -0.75, 0, 7); // thumb, out to the side
    };
    g.save(); g.shadowColor = 'rgba(46,40,70,.36)'; g.shadowBlur = (14 - 7 * press) * s; g.shadowOffsetX = 2 * s; g.shadowOffsetY = (8 - 5 * press) * s; body(); g.fillStyle = skin; g.fill(); g.restore();
    body(); A.paper(g, s, skin, { shadow: 0, light: 0.04, box: { x: -45, y: -2, w: 115, h: 140 } });
    g.save(); g.lineWidth = 3; g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-15, 92); g.lineTo(-15, 13); g.arc(0, 13, 15, Math.PI, 0); g.lineTo(15, 92); g.stroke();   // the finger stands out from the fist
    g.beginPath(); g.moveTo(40, 70); g.lineTo(39, 90); g.moveTo(55, 76); g.lineTo(53, 94); g.moveTo(15, 96); g.quadraticCurveTo(38, 104, 62, 98); g.stroke();
    g.beginPath(); g.arc(0, 14, 8, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = 'rgba(232,102,74,.75)'; g.stroke();        // nail
    g.restore();
    g.beginPath(); A.rect(g, -12, 126, 72, 24, 8, 7, 0.5); A.paper(g, s, '#E8664A', { shadow: 0.3, light: 0.05, box: { x: -12, y: 126, w: 72, h: 24 } });  // cuff
    g.restore();
  };

  /* ---------------- sprites ---------------- */
  /** Render art once into a bitmap at the stage's resolution and reuse it.
      paint(g, s) draws in units with (0,0) at the sprite's anchor. box = [x, y, w, h] in units around the anchor. */
  const cache = new Map();
  A.res = 1;
  A.setRes = function (res) { if (Math.abs(res - A.res) > 1e-3) { A.res = res; cache.clear(); } };
  A.flush = () => cache.clear();
  A.sprite = function (key, box, paint) {
    const k = key + '|' + A.mood;
    let sp = cache.get(k);
    if (sp) return sp;
    const pad = 14; // room for the paper shadow
    const [bx, by, bw, bh] = box; const s = A.res;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil((bw + pad * 2) * s)); c.height = Math.max(1, Math.ceil((bh + pad * 2) * s));
    const g = c.getContext('2d');
    g.setTransform(s, 0, 0, s, (pad - bx) * s, (pad - by) * s);
    paint(g, s);
    sp = { canvas: c, ox: pad - bx, oy: pad - by, w: bw + pad * 2, h: bh + pad * 2 };
    cache.set(k, sp);
    return sp;
  };

  /* ---------------- type ---------------- */
  A.FONT_TITLE = '"Fraunces", Georgia, serif';
  A.FONT_BODY = '"Andika", "Avenir Next", system-ui, sans-serif';
  A.fontsReady = () => (document.fonts && document.fonts.load ? Promise.all([
    document.fonts.load('700 40px "Fraunces"'), document.fonts.load('400 40px "Andika"'), document.fonts.load('700 40px "Andika"'),
  ]).catch(() => null) : Promise.resolve());
})();
