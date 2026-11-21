/* Happy or Sad? — naming feelings and caring about them.
   Level 1: a friend, a tiny scene (the balloon flies away, a gift pops up). The child says how the friend
            feels by tapping a big happy or sad face, then cheers a sad friend up (a hug, sharing a toy)
            and watches the friend change.
   Level 2: seven feelings on drawn faces. Match a face to a short spoken moment, and "make the face":
            build it from eyebrow, mouth and (later) eye pieces. Every mix of pieces makes some face, and the
            game names the ones it knows, so trying things out is part of the play.
   Level 3: short social stories (name the feeling, then choose what to do; the unkind choice is shown gently
            and the child gets another go), sorting "what helps when I feel cross", and harder face building.
   Nothing can be failed. All the faces are drawn here in code; the friends are the painted pictures in img/. */
(function () {
  'use strict';
  const A = K.art, E = K.engine;
  const INK = '#2E2A3B', SKIN = '#F6C95A', CREAM = '#FBF6EC', MOUTH = '#6B2E3A';

  /* ---------------- words ---------------- */
  const WORD = { happy: 'Happy.', sad: 'Sad.', cross: 'Cross.', scared: 'Scared.', surprised: 'Surprised.', sleepy: 'Sleepy.', proud: 'Proud.' };
  const T = {
    feel: 'How does our friend feel?', yes: 'Yes!', ohno: 'Oh no!', look: 'Look!',
    smileHint: 'Look at the big smile.', sadHint: 'Look at the sad mouth.',
    cheer: 'What would cheer our friend up?', hug: 'A hug helps.', share: 'Sharing helps.', nohelp: 'Hmm, that did not help.',
    which: 'Which face is that?', make: 'Can you make this face?',
    brows: 'Look at the eyebrows.', mouth: 'Look at the mouth.', eyes: 'Look at the eyes.',
    kindQ: 'What is the kind thing to do?', kind: 'That was kind.', again: "Let's try again.",
    crossQ: 'What helps when I feel cross?', canHelp: 'That can help.', calm: 'Now I feel calm.',
  };
  const SCENES = [
    { id: 'balloon', feel: 'sad', say: 'The balloon flew away.' },
    { id: 'icecream', feel: 'sad', say: 'The ice cream fell down.' },
    { id: 'snowman', feel: 'sad', say: 'The snowman melted.' },
    { id: 'gift', feel: 'happy', say: 'A gift!' },
    { id: 'rainbow', feel: 'happy', say: 'A rainbow!' },
    { id: 'kite', feel: 'happy', say: 'The kite is flying!' },
  ];
  const SITS = [
    { feel: 'happy', say: 'It is my birthday!', art: 'birthday' },
    { feel: 'sad', say: 'The balloon flew away.', art: 'balloon' },
    { feel: 'cross', say: 'Someone broke my tower.', art: 'tower' },
    { feel: 'sleepy', say: 'It is very late.', art: 'late' },
    { feel: 'surprised', say: 'Something jumped out of the box!', art: 'box' },
    { feel: 'scared', say: 'A big bang in the dark!', art: 'bang' },
    { feel: 'proud', say: 'I did it all by myself!', art: 'myself' },
  ];
  const STORIES = [
    { id: 'ball', victim: 'bunny', actor: 'fox', feel: 'sad', setup: 'Fox took the ball without asking.', kind: 'Give it back and say sorry.', unkind: 'Run away with the ball.' },
    { id: 'tower', victim: 'bear', actor: 'bunny', feel: 'sad', setup: "Bunny knocked over Bear's tower.", kind: 'Say sorry and help build it again.', unkind: 'Laugh and walk away.' },
    { id: 'dark', victim: 'star', actor: 'cat', feel: 'scared', setup: 'Star is scared of the dark.', kind: 'Hold hands and stay close.', unkind: 'Say boo and laugh.' },
  ];
  const IDEAS = [
    { id: 'breathe', helps: true, say: 'Take a big breath.', word: 'breathe' },
    { id: 'count', helps: true, say: 'Count to five.', word: 'count' },
    { id: 'hug', helps: true, say: 'Ask for a hug.', word: 'hug' },
    { id: 'throw', helps: false, say: 'Throw the toys.', word: 'throw' },
    { id: 'shout', helps: false, say: 'Shout and scream.', word: 'shout' },
    { id: 'break', helps: false, say: 'Break the tower.', word: 'break' },
  ];
  function lines() {
    const out = Object.values(WORD).concat(Object.values(T));
    for (const s of SCENES) out.push(s.say);
    for (const s of SITS) out.push(s.say);
    for (const s of STORIES) out.push(s.setup, s.kind, s.unkind);
    for (const s of IDEAS) out.push(s.say);
    return out.filter((x, i) => out.indexOf(x) === i);
  }

  /* ---------------- pictures ---------------- */
  const FRIENDS = {
    bunny: { happy: 'tales/bunny-happy', sad: 'tales/bunny-sad', col: '#EFE3D6' },
    cat: { happy: 'tales/cat-happy', sad: 'tales/cat-sad', col: '#A9A39E' },
    fox: { happy: 'tales/fox-happy', sad: 'tales/fox-sad', col: '#F08A3C' },
    bear: { happy: 'bobo/bobo-happy', sad: 'tales/bobo-sad', col: '#C98A4B' },
    star: { happy: 'star/star-happy', sad: 'star/star-sad', col: '#F6C453' },
  };
  const PICS = {};
  function pic(path) { let p = PICS[path]; if (!p) { p = PICS[path] = { im: new Image(), ok: false }; p.im.onload = () => { p.ok = true; }; p.im.src = 'img/' + path + '.webp'; } return p; }
  const sprites = new Map();
  /** A picture fitted into a box (units), drawn once at the stage's sharpness with a soft paper shadow. Null until it has loaded. */
  function picSprite(path, bw, bh) {
    const p = pic(path); if (!p.ok) return null;
    const key = path + '|' + Math.round(bw) + 'x' + Math.round(bh) + '|' + A.res; let sp = sprites.get(key); if (sp) return sp;
    const k = Math.min(bw / p.im.width, bh / p.im.height), w = p.im.width * k, h = p.im.height * k, pad = 14, s = A.res;
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil((w + pad * 2) * s)); c.height = Math.max(1, Math.ceil((h + pad * 2) * s));
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.shadowColor = 'rgba(46,40,70,.24)'; g.shadowBlur = 8 * s; g.shadowOffsetX = 2 * s; g.shadowOffsetY = 4 * s;
    g.drawImage(p.im, pad * s, pad * s, w * s, h * s);
    sp = { canvas: c, w, h, pad }; sprites.set(key, sp); return sp;
  }
  /** Draw a picture centred on (0,0), or standing on it with foot = true. False while it is still loading. */
  function drawPic(g, path, bw, bh, foot) {
    const sp = picSprite(path, bw, bh); if (!sp) return false;
    g.drawImage(sp.canvas, -sp.w / 2 - sp.pad, (foot ? -sp.h : -sp.h / 2) - sp.pad, sp.w + sp.pad * 2, sp.h + sp.pad * 2); return true;
  }

  /* ---------------- drawn faces ---------------- */
  const FEEL = {
    happy: { brows: 'up', mouth: 'smile', eyes: 'open' },
    sad: { brows: 'sad', mouth: 'frown', eyes: 'open', extra: 'tear' },
    cross: { brows: 'cross', mouth: 'frown', eyes: 'open' },
    scared: { brows: 'sad', mouth: 'wavy', eyes: 'wide', extra: 'sweat' },
    surprised: { brows: 'up', mouth: 'o', eyes: 'wide' },
    sleepy: { brows: 'flat', mouth: 'o', eyes: 'sleepy', extra: 'zzz' },
    proud: { brows: 'up', mouth: 'smile', eyes: 'shut', extra: 'star' },
  };
  const BIG = { happy: { brows: 'up', mouth: 'grin', eyes: 'open' }, sad: FEEL.sad };
  /** The pieces a child needs for each feeling in "make the face". */
  const RECIPE = { happy: { brows: 'up', mouth: 'smile' }, sad: { brows: 'sad', mouth: 'frown' }, cross: { brows: 'cross', mouth: 'frown' }, surprised: { brows: 'up', mouth: 'o' },
    scared: { brows: 'sad', mouth: 'wavy' }, sleepy: { eyes: 'sleepy', mouth: 'o' }, proud: { brows: 'up', mouth: 'smile', eyes: 'shut' } };
  /** Which feeling a built face shows, or null for a face with no name. */
  function classify(m) {
    const e = m.eyes || 'open';
    if (!m.mouth) return null;
    if (e === 'sleepy') return m.mouth === 'o' ? 'sleepy' : null;
    if (!m.brows) return null;
    const k = m.brows + '+' + m.mouth;
    if (k === 'up+smile') return e === 'shut' ? 'proud' : 'happy';
    if (e === 'shut') return null;
    return { 'sad+frown': 'sad', 'cross+frown': 'cross', 'up+o': 'surprised', 'sad+wavy': 'scared' }[k] || null;
  }
  const discSprite = (r, col) => A.sprite('feelDisc' + Math.round(r) + col, [-r - 2, -r - 2, r * 2 + 4, r * 2 + 4], (g, s) => { g.beginPath(); A.blob(g, 0, 0, r, r * 0.975, 0.012, 5, 14); A.paper(g, s, col, { shadow: 0.9, light: 0.08, box: { x: -r, y: -r, w: r * 2, h: r * 2 } }); });
  function star5(g, x, y, r, rot) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (rot || 0) - Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.48 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }
  function heart(g, r) { g.moveTo(0, r * 0.92); g.bezierCurveTo(-r * 1.55, -r * 0.1, -r * 0.78, -r * 1.2, 0, -r * 0.45); g.bezierCurveTo(r * 0.78, -r * 1.2, r * 1.55, -r * 0.1, 0, r * 0.92); g.closePath(); }
  function drop(g, x, y, r, col) { g.beginPath(); g.moveTo(x, y - r * 1.5); g.quadraticCurveTo(x + r * 1.1, y, x, y + r * 0.9); g.quadraticCurveTo(x - r * 1.1, y, x, y - r * 1.5); g.fillStyle = col; g.fill(); }
  /** One part of a face, radius r around (0,0). */
  function facePart(g, part, kind, r, blink) {
    const lw = Math.max(3, r * 0.078);
    if (part === 'eyes') {
      for (const k of [-1, 1]) {
        g.save(); g.translate(k * r * 0.34, -r * 0.1);
        if (kind === 'wide') { g.beginPath(); g.arc(0, 0, r * 0.175, 0, 7); g.fillStyle = '#FFFDF7'; g.fill(); g.beginPath(); g.arc(0, r * 0.02, r * 0.085, 0, 7); g.fillStyle = INK; g.fill(); }
        else if (kind === 'sleepy') { g.beginPath(); g.arc(0, 0, r * 0.125, 0, Math.PI); g.closePath(); g.fillStyle = INK; g.fill(); A.line(g, INK, lw, (h) => { h.moveTo(-r * 0.17, 0); h.lineTo(r * 0.17, 0); }); }
        else if (kind === 'shut') A.line(g, INK, lw, (h) => { h.arc(0, r * 0.07, r * 0.135, Math.PI * 1.12, Math.PI * 1.88); });
        else { g.scale(1, 1 - (blink || 0) * 0.9); g.beginPath(); g.ellipse(0, 0, r * 0.095, r * 0.128, 0, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(-r * 0.03, -r * 0.05, r * 0.036, 0, 7); g.fillStyle = '#fff'; g.fill(); }
        g.restore();
      }
    } else if (part === 'brows') {
      for (const k of [-1, 1]) A.line(g, INK, lw, (h) => {
        if (kind === 'up') { h.moveTo(k * r * 0.18, -r * 0.45); h.quadraticCurveTo(k * r * 0.36, -r * 0.63, k * r * 0.55, -r * 0.43); }
        else if (kind === 'sad') { h.moveTo(k * r * 0.16, -r * 0.54); h.lineTo(k * r * 0.53, -r * 0.37); }
        else if (kind === 'cross') { h.moveTo(k * r * 0.13, -r * 0.31); h.lineTo(k * r * 0.53, -r * 0.5); }
        else { h.moveTo(k * r * 0.2, -r * 0.41); h.lineTo(k * r * 0.53, -r * 0.41); }
      });
    } else if (part === 'mouth') {
      if (kind === 'smile') A.line(g, INK, lw, (h) => { h.moveTo(-r * 0.33, r * 0.3); h.quadraticCurveTo(0, r * 0.7, r * 0.33, r * 0.3); });
      else if (kind === 'grin') {
        const p = (h) => { h.moveTo(-r * 0.38, r * 0.26); h.quadraticCurveTo(0, r * 0.37, r * 0.38, r * 0.26); h.quadraticCurveTo(0, r * 0.98, -r * 0.38, r * 0.26); h.closePath(); };
        g.save(); g.beginPath(); p(g); g.fillStyle = MOUTH; g.fill(); g.clip(); g.beginPath(); g.ellipse(0, r * 0.62, r * 0.2, r * 0.12, 0, 0, 7); g.fillStyle = '#E8664A'; g.fill(); g.restore();
      }
      else if (kind === 'frown') A.line(g, INK, lw, (h) => { h.moveTo(-r * 0.29, r * 0.56); h.quadraticCurveTo(0, r * 0.25, r * 0.29, r * 0.56); });
      else if (kind === 'o') { g.beginPath(); g.ellipse(0, r * 0.44, r * 0.13, r * 0.17, 0, 0, 7); g.fillStyle = MOUTH; g.fill(); }
      else if (kind === 'wavy') A.line(g, INK, lw, (h) => { h.moveTo(-r * 0.32, r * 0.46); for (let i = 0; i < 4; i++) h.quadraticCurveTo(-r * 0.32 + (i + 0.5) * r * 0.16, r * (i % 2 ? 0.56 : 0.34), -r * 0.32 + (i + 1) * r * 0.16, r * 0.46); });
      else A.line(g, INK, lw, (h) => { h.moveTo(-r * 0.22, r * 0.45); h.lineTo(r * 0.22, r * 0.45); });
    }
  }
  /** A whole face. f = {brows, mouth, eyes, extra}; o = {col, blink, t, pop: {brows, mouth, eyes}, ghost} */
  function drawFace(g, f, r, o) {
    o = o || {};
    const sp = discSprite(r, o.col || SKIN); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
    g.fillStyle = 'rgba(232,102,74,.26)'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * r * 0.58, r * 0.2, r * 0.15, r * 0.11, 0, 0, 7); g.fill(); }
    for (const part of ['eyes', 'brows', 'mouth']) {
      const kind = f[part];
      if (!kind) { if (o.ghost) { g.save(); g.globalAlpha = 0.16; facePart(g, part, 'flat', r, 0); g.restore(); } continue; }
      const p = o.pop && o.pop[part];
      if (p) { const cy = part === 'mouth' ? r * 0.45 : part === 'brows' ? -r * 0.45 : -r * 0.1, k = 1 + p * 0.5; g.save(); g.translate(0, cy); g.scale(k, k); g.translate(0, -cy); facePart(g, part, kind, r, o.blink); g.restore(); }
      else facePart(g, part, kind, r, o.blink);
    }
    const t = o.t || 0;
    if (f.extra === 'tear') drop(g, -r * 0.36, r * 0.2 + ((t * 0.5) % 1) * r * 0.12, r * 0.075, '#6FB3DC');
    else if (f.extra === 'sweat') drop(g, r * 0.66, -r * 0.42, r * 0.07, '#8CC7E6');
    else if (f.extra === 'zzz') { g.fillStyle = A.C.plum; g.textAlign = 'center'; g.textBaseline = 'middle'; [[0.62, -0.62, 0.3], [0.86, -0.9, 0.22]].forEach(([x, y, q], i) => { g.font = `800 ${r * q}px ${A.FONT_TITLE}`; g.fillText('z', r * x, r * y + Math.sin(t * 2 + i) * r * 0.03); }); }
    else if (f.extra === 'star') { star5(g, r * 0.7, -r * 0.72, r * 0.3, Math.sin(t * 2) * 0.15); g.fillStyle = '#FFFDF7'; g.fill(); star5(g, r * 0.7, -r * 0.72, r * 0.22, Math.sin(t * 2) * 0.15); g.fillStyle = '#E8664A'; g.fill(); }
  }

  /* ---------------- small paper things ---------------- */
  const BLOCKS = ['#E8664A', '#5B8FC7', '#F2B33D', '#6FA65F'];
  function block(g, s, x, y, sz, col, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.beginPath(); A.rect(g, -sz / 2, -sz / 2, sz, sz, sz * 0.14, 3, 0.6); A.paper(g, s, col, { shadow: 0.7, light: 0.08, box: { x: -sz / 2, y: -sz / 2, w: sz, h: sz } });
    g.beginPath(); A.rect(g, -sz * 0.3, -sz * 0.3, sz * 0.6, sz * 0.6, sz * 0.08, 4, 0.4); g.fillStyle = 'rgba(255,255,255,.26)'; g.fill();
    g.restore();
  }
  const TOWER = { up: [[0, -30, 0], [0, -90, 0], [0, -150, 0], [0, -210, 0]], down: [[-70, -30, 0.3], [18, -30, -0.2], [96, -32, 1.0], [-12, -86, 0.7]] };
  /** A block tower, k = 0 fallen ... 1 standing; sz = block size. */
  function tower(g, s, k, sz) { const q = sz / 60; for (let i = 0; i < 4; i++) { const a = TOWER.down[i], b = TOWER.up[i], e = K.clamp(k * 4 - i * 0.6, 0, 1); block(g, s, (a[0] + (b[0] - a[0]) * e) * q, (a[1] + (b[1] - a[1]) * e) * q, sz, BLOCKS[i], a[2] * (1 - e)); } }
  function sun(g, s, r, t) {
    g.save(); g.rotate(t * 0.4); g.fillStyle = '#F2B33D'; for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.beginPath(); g.moveTo(-r * 0.16, -r * 1.12); g.lineTo(0, -r * 1.55); g.lineTo(r * 0.16, -r * 1.12); g.fill(); } g.restore();
    g.beginPath(); g.arc(0, 0, r, 0, 7); A.paper(g, s, '#F6C453', { shadow: 0.6, light: 0.1, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
  }
  function burstShape(g, r, n) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, q = i % 2 ? r * 0.62 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); }
  function wrap(g, text, max) { const out = []; let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
  /** Pictures for the "moment" cards and the idea cards, about 200 units across, centred. */
  const ART = {
    birthday(g, s, t) { for (let i = 0; i < 5; i++) { g.beginPath(); A.cut(g, [[-150 + i * 62, -118], [-98 + i * 62, -118], [-124 + i * 62, -70]], 4, 0.5, i + 1); g.fillStyle = BLOCKS[i % 4]; g.fill(); } g.save(); g.translate(0, 24); g.rotate(Math.sin(t * 2) * 0.03); if (!drawPic(g, 'toot/cakes', 190, 200)) { g.beginPath(); A.rect(g, -60, -30, 120, 90, 14, 2); A.paper(g, s, '#F29BB2', {}); } g.restore(); },
    balloon(g, s, t) { A.line(g, 'rgba(255,255,255,.8)', 5, (h) => { for (const x of [-96, -62]) { h.moveTo(x, 70); h.lineTo(x + 14, 30); } }); g.save(); g.translate(20, -10 + Math.sin(t * 1.6) * 8); g.rotate(0.3); if (!drawPic(g, 'town/balloon', 150, 230)) { g.beginPath(); g.ellipse(0, -30, 56, 70, 0, 0, 7); A.paper(g, s, '#E8664A', {}); } g.restore(); },
    tower(g, s) { g.save(); g.translate(-10, 96); tower(g, s, 0, 74); g.restore(); },
    late(g, s, t) { for (const [x, y, r] of [[-120, -80, 9], [110, -96, 7], [130, 30, 10], [-96, 60, 6]]) { star5(g, x, y, r * (1 + Math.sin(t * 3 + x) * 0.2)); g.fillStyle = '#F7D27A'; g.fill(); } g.save(); g.rotate(Math.sin(t) * 0.05); if (!drawPic(g, 'star/moon', 190, 190)) { g.beginPath(); g.arc(0, 0, 70, 0, 7); A.paper(g, s, '#F7D27A', {}); } g.restore(); },
    box(g, s, t) { const k = 0.5 + 0.5 * Math.sin(t * 3); A.line(g, '#8A5A3C', 7, (h) => { h.moveTo(0, 10); for (let i = 0; i < 5; i++) h.lineTo((i % 2 ? 16 : -16), 10 - (i + 1) * (15 + k * 5)); }); g.save(); g.translate(0, -78 - k * 26); burstShape(g, 46, 9); g.fillStyle = '#F2B33D'; g.fill(); star5(g, 0, 0, 24); g.fillStyle = '#FFFDF7'; g.fill(); g.restore(); g.save(); g.translate(0, 70); if (!drawPic(g, 'tales/toybox', 190, 170)) { g.beginPath(); A.rect(g, -80, -40, 160, 100, 10, 2); A.paper(g, s, '#2F8F8A', {}); } g.restore(); },
    bang(g, s, t) { const k = 1 + Math.sin(t * 9) * 0.05; g.save(); g.scale(k, k); burstShape(g, 118, 11); g.fillStyle = '#F2B33D'; g.fill(); burstShape(g, 78, 11); g.fillStyle = '#FFF3C4'; g.fill(); g.restore(); A.line(g, '#F7D27A', 8, (h) => { h.moveTo(-150, -96); h.lineTo(-128, -70); h.lineTo(-146, -60); h.lineTo(-122, -32); h.moveTo(150, 60); h.lineTo(128, 80); h.lineTo(146, 92); h.lineTo(124, 116); }); },
    myself(g, s, t) { g.save(); g.translate(-10, 122); tower(g, s, 1, 62); g.restore(); star5(g, -10, -150, 34 * (1 + Math.sin(t * 4) * 0.06), Math.sin(t * 2) * 0.2); g.fillStyle = '#F2B33D'; g.fill(); },
    breathe(g) { A.line(g, '#5B8FC7', 9, (h) => { for (const [y, w] of [[-26, 70], [2, 96], [30, 60]]) { h.moveTo(-w, y); h.lineTo(w * 0.5, y); h.arc(w * 0.5, y - 13, 13, Math.PI / 2, -Math.PI * 0.75, true); } }); },
    count(g) { g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 46px ${A.FONT_TITLE}`; ['1', '2', '3', '4', '5'].forEach((d, i) => { g.fillStyle = [A.C.tomato, A.C.blue, A.C.marigold, A.C.teal, A.C.plum][i]; g.fillText(d, -72 + i * 36, i % 2 ? 10 : -8); }); },
    hug(g, s) { g.beginPath(); heart(g, 42); A.paper(g, s, '#E8664A', { shadow: 0.6, light: 0.1, box: { x: -50, y: -50, w: 100, h: 100 } }); },
    throw(g, s) { A.line(g, 'rgba(46,42,59,.45)', 6, (h) => { for (const y of [-22, 2, 26]) { h.moveTo(-80, y + 16); h.lineTo(-34, y); } }); g.save(); g.translate(28, -6); if (!drawPic(g, 'kitchen/ball', 84, 84)) { g.beginPath(); g.arc(0, 0, 38, 0, 7); A.paper(g, s, '#5B8FC7', {}); } g.restore(); },
    shout(g) { burstShape(g, 62, 9); g.fillStyle = '#E8664A'; g.fill(); g.fillStyle = '#FFFDF7'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 64px ${A.FONT_TITLE}`; g.fillText('!', 0, 2); },
    break(g, s) { g.save(); g.translate(-8, 44); tower(g, s, 0, 46); g.restore(); },
  };

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000;
    const SET = L === 3 ? 3 : 4;
    const ground = land ? 812 : Math.round(H * 0.5), FH = land ? 450 : 360;
    const fx = land ? W * 0.21 : W * 0.33, px = fx + (land ? 255 : 212);
    const area = land ? { x: W * 0.52, y: 170, w: W * 0.44, h: 700 } : { x: 28, y: ground + 66, w: W - 56, h: H - ground - 66 - 106 };
    const mid = land ? { x: W * 0.27, y: 500 } : { x: W / 2, y: Math.round(ground * 0.6) + 12 };
    let S = { kind: '' }, won = 0, skill = 0, makeWins = 0, turn = 0, force = null;
    const last = {};
    let stuff = [], ui = [];
    sprites.clear();
    for (const k in FRIENDS) { pic(FRIENDS[k].happy); pic(FRIENDS[k].sad); }
    ['bobo/bg-day', 'town/balloon', 'tales/gift', 'tales/kite', 'tales/snowman', 'bobo/puddle', 'bobo/rainbow', 'bobo/cloud', 'kitchen/ball', 'toot/cakes', 'star/moon', 'tales/toybox'].forEach(pic);

    const sfx = {
      aww() { K.sfx.tone(440, 0.5, { to: 300, type: 'sine', vol: 0.14 }); },
      giggle() { [660, 880, 700, 990].forEach((f, i) => K.sfx.tone(f, 0.08, { type: 'triangle', vol: 0.14, delay: i * 0.09 })); },
      plop() { K.sfx.tone(300, 0.14, { to: 130, vol: 0.2 }); },
      rain() { for (let i = 0; i < 8; i++) K.sfx.noise(0.05, { freq: 2600 + (i % 3) * 500, vol: 0.07, delay: i * 0.13 }); },
      warm() { [392, 494, 587].forEach((f, i) => K.sfx.tone(f, 0.45, { type: 'sine', vol: 0.13, delay: i * 0.08 })); },
    };
    const tell = (text, ms) => Promise.all([ctx.say(text), ctx.wait(ms || 1100)]);
    const pickNew = (list, key, fn) => { const ok = list.filter((x) => (fn ? fn(x) : x) !== last[key]); const x = K.pick(ok.length ? ok : list); last[key] = fn ? fn(x) : x; return x; };
    const resort = () => { st.root._sorted = false; };
    const wobble = (n) => n.to({ rot: 0.16 }, { dur: 0.07 }).then(() => n.to({ rot: -0.13 }, { dur: 0.1 })).then(() => n.to({ rot: 0 }, { dur: 0.3, ease: 'elastic' }));
    const keep = (n) => { stuff.push(n); return n; };

    /* ---------- the meadow ---------- */
    let bg = null;
    function paintBg() {
      const c = document.createElement('canvas'); c.width = Math.round(W * st.res); c.height = Math.round(H * st.res);
      const g = c.getContext('2d'); g.scale(st.res, st.res);
      const hz = ground - 140, p = pic('bobo/bg-day');
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#3F9FE8'); sky.addColorStop(1, '#BFE4F2'); g.fillStyle = sky; g.fillRect(0, 0, W, hz + 2);
      const gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#A6D52C'); gr.addColorStop(1, '#8FCB2B'); g.fillStyle = gr; g.fillRect(0, hz, W, H - hz);
      if (p.ok) { const k = Math.max(W / p.im.width, hz / (0.53 * p.im.height)), w = p.im.width * k, h = p.im.height * k; g.drawImage(p.im, (W - w) / 2, hz - 0.53 * h, w, h); if (hz + 0.47 * h < H) { const f = g.createLinearGradient(0, hz + 0.47 * h - 90, 0, hz + 0.47 * h); f.addColorStop(0, 'rgba(143,203,43,0)'); f.addColorStop(1, '#8FCB2B'); g.fillStyle = f; g.fillRect(0, hz + 0.47 * h - 90, W, 92); } }
      else { g.fillStyle = '#7DBB3A'; g.beginPath(); g.ellipse(W * 0.25, hz + 6, W * 0.4, 70, 0, Math.PI, 0); g.fill(); g.fillStyle = '#8CC63A'; g.beginPath(); g.ellipse(W * 0.8, hz + 6, W * 0.42, 54, 0, Math.PI, 0); g.fill(); }
      return { c, pic: p.ok };
    }
    st.add({ z: 0, draw(g) { if (!bg || (!bg.pic && pic('bobo/bg-day').ok)) bg = paintBg(); g.drawImage(bg.c, 0, 0, W, H); } });
    // on a phone the choices sit on a paper board under the meadow
    if (!land) st.add({ z: 40, sprite: A.sprite('feelBoard' + Math.round(W) + 'x' + Math.round(H), [0, ground + 20, W, H - ground], (g, s) => { g.beginPath(); A.rect(g, -20, ground + 34, W + 40, H - ground + 60, 46, 3, 1); A.paper(g, s, '#FBF1DC', { shadow: 1, depth: 1.4, light: 0.03, box: { x: 0, y: ground, w: W, h: H - ground } }); A.line(g, 'rgba(192,138,90,.35)', 4, (h) => { h.moveTo(W / 2 - 46, ground + 54); h.lineTo(W / 2 + 46, ground + 54); }); }) });
    // hearts for the rounds done in this set
    const tally = st.add({ ui: true, z: 45, x: W / 2, y: land ? 142 : 166, pop: 0 });
    tally.draw = (g, s) => { const n = won % SET; for (let i = 0; i < SET; i++) { g.save(); g.translate((i - (SET - 1) / 2) * 46, 0); const k = i === n - 1 ? 1 + tally.pop * 0.5 : 1; g.scale(k, k); g.beginPath(); heart(g, 15); if (i < n) A.paper(g, s, '#E8664A', { shadow: 0.6, grain: 0.1 }); else { g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); } g.restore(); } };
    tally.update = (dt) => { tally.pop = Math.max(0, tally.pop - dt * 2); };

    /* ---------- friends ---------- */
    function friend(key, x, y, h) {
      const f = FRIENDS[key];
      const n = keep(st.add({ z: 20, x, y, mood: 'happy', hop: 0, squash: 0, who: key, label: key, pressable: false, hit: { x: -h * 0.3, y: -h * 0.92, w: h * 0.6, h: h * 0.9 } }));
      n.draw = (g) => {
        g.save(); g.scale(1 + n.hop / 900, 1); g.beginPath(); g.ellipse(0, 4, h * 0.26, h * 0.045, 0, 0, 7); g.fillStyle = 'rgba(40,70,30,.2)'; g.fill(); g.restore();
        const br = Math.sin(st.t * 2.2 + n.id) * 0.012 + n.squash;
        g.save(); g.translate(0, -n.hop); g.scale(1 + br, 1 - br);
        if (!drawPic(g, f[n.mood], h * 0.84, h, true)) {
          g.beginPath(); A.blob(g, 0, -h * 0.3, h * 0.2, h * 0.3, 0.03, 4, 12); g.fillStyle = f.col; g.fill();
          g.save(); g.translate(0, -h * 0.68); drawFace(g, n.mood === 'sad' ? FEEL.sad : BIG.happy, h * 0.24, { col: f.col, t: st.t }); g.restore();
        }
        g.restore();
      };
      n.setMood = (m) => { if (n.mood === m) return Promise.resolve(); return n.to({ squash: 0.12 }, { dur: 0.12, ease: 'out' }).then(() => { n.mood = m; return n.to({ squash: 0 }, { dur: 0.5, ease: 'elastic' }); }); };
      n.jump = (ht) => n.to({ squash: 0.07 }, { dur: 0.08 }).then(() => { n.to({ squash: 0 }, { dur: 0.3, ease: 'elastic' }); return n.to({ hop: ht || 70 }, { dur: 0.2, ease: 'out' }); }).then(() => n.to({ hop: 0 }, { dur: 0.24, ease: (t) => t * t }));
      n.onTap = () => { if (n.hop > 1) return; if (n.mood === 'sad') { sfx.aww(); wobble(n); } else { sfx.giggle(); n.jump(50); ctx.fx.burst(n.x, n.y - h * 0.7, { n: 6 }); } };
      n.walkIn = (from) => { const tx = n.x; n.x = from; return n.to({ x: tx }, { dur: 0.55, ease: 'out' }); };
      return n;
    }
    function prop(path, x, y, bw, bh, o) {
      o = o || {};
      const n = keep(st.add({ z: o.z == null ? 22 : o.z, x, y, sx: o.pop ? 0 : 1, sy: o.pop ? 0 : 1, alpha: o.alpha == null ? 1 : o.alpha }));
      n.draw = (g, s) => { g.save(); if (o.sway) g.rotate(Math.sin(st.t * o.sway) * 0.08); if (o.bob) g.translate(0, Math.sin(st.t * 2) * o.bob); if (o.paint) o.paint(g, s); else if (!drawPic(g, path, bw, bh, o.foot)) { g.beginPath(); A.blob(g, 0, o.foot ? -bh / 2 : 0, Math.min(bw, bh) * 0.4, Math.min(bw, bh) * 0.4, 0.05, 3); A.paper(g, s, o.col || '#E8664A', { shadow: 0.6 }); } g.restore(); };
      if (o.pop) n.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back', delay: o.delay || 0 });
      return n;
    }
    /** A little rain cloud over (x, y) for ms. */
    function rainOn(x, y, ms) {
      const c = prop('bobo/cloud', x, y - 60, 200, 150, { z: 30, alpha: 0, col: '#9A9AA8' }); c.rain = 0;
      const base = c.draw; c.draw = (g, s) => { base(g, s); if (c.rain > 0) A.line(g, 'rgba(111,179,220,.9)', 5, (h) => { for (let i = 0; i < 6; i++) { const q = (st.t * 2.2 + i * 0.37) % 1, rx = -66 + i * 26; h.moveTo(rx, 50 + q * 110); h.lineTo(rx - 5, 68 + q * 110); } }); };
      c.to({ alpha: 1, y }, { dur: 0.4 }).then(() => { c.rain = 1; sfx.rain(); });
      return ctx.wait(ms).then(() => { c.rain = 0; return c.to({ alpha: 0, y: y - 50 }, { dur: 0.4 }); }).then(() => c.remove());
    }
    function hearts(x, y) { ctx.fx.burst(x, y, { n: 14, colors: ['#E8664A', '#F4B49A', '#F2B33D'], star: true }); }

    /* ---------- choices ---------- */
    function grid(n, cw, ch, gap) {
      let cols = n; while (cols > 1 && cols * cw + (cols - 1) * gap > area.w) cols--;
      if (n === 4 && cols === 3) cols = 2;
      const rows = Math.ceil(n / cols), th = rows * ch + (rows - 1) * gap, out = [];
      for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - cols * (rows - 1) : cols, c = i - r * cols; out.push({ x: area.x + area.w / 2 + (c - (inRow - 1) / 2) * (cw + gap), y: area.y + area.h / 2 - th / 2 + ch / 2 + r * (ch + gap) }); }
      return out;
    }
    function button(pos, hit, label, paint, i) {
      const n = st.add({ z: 50, x: pos.x, y: pos.y, sx: 0, sy: 0, label, hit, pulse: false, off: false });
      n._bsx = n._bsy = 1;
      n.draw = (g, s) => {
        if (n.pulse) { const k = 1 + Math.sin(st.t * 7) * 0.05; g.scale(k, k); g.beginPath(); A.rect(g, hit.x - 12, hit.y - 12, hit.w + 24, hit.h + 24, Math.min(hit.w, hit.h) * 0.5 + 12, 2, 0); g.fillStyle = A.alpha('#F7D27A', 0.55 + Math.sin(st.t * 7) * 0.25); g.fill(); }
        paint(g, s, n);
      };
      n.to({ sx: 1, sy: 1 }, { dur: 0.42, ease: 'back', delay: 0.08 * (i || 0) });
      ui.push(n); return n;
    }
    function clearUI() { for (const n of ui) { n.onTap = null; n.to({ sx: 0, sy: 0 }, { dur: 0.2, ease: 'inOut' }).then(() => n.remove()); } ui = []; }
    function clearRound() { clearUI(); for (const n of stuff) { n.onTap = n.onDown = null; n.to({ alpha: 0 }, { dur: 0.25 }).then(() => n.remove()); } stuff = []; return ctx.wait(320); }
    const miss = () => { S.misses = (S.misses || 0) + 1; };
    /** Face buttons. Resolves when the right one is tapped. */
    function askFaces(feels, right, o) {
      o = o || {};
      const n = feels.length, r = n <= 2 ? (land ? 122 : 104) : (land ? 104 : 92), pos = grid(n, r * 2 + 16, r * 2 + 16, land ? 34 : 22);
      S.answer = right; S.wrong = feels.find((f) => f !== right);
      return new Promise((res) => {
        let tries = 0, done = false; const nodes = {};
        feels.forEach((fl, i) => {
          const b = nodes[fl] = button(pos[i], { x: -r, y: -r, w: r * 2, h: r * 2 }, fl, (g) => drawFace(g, (o.big && BIG[fl]) || FEEL[fl], r, { t: st.t }), i);
          b.onTap = () => {
            if (done) return;
            if (fl === right) { done = true; K.sfx.ding(); ctx.fx.burst(b.x, b.y, { n: 16 }); b.pulse = false; b.z = 52; resort(); b.to({ sx: 1.16, sy: 1.16 }, { dur: 0.3, ease: 'back' }); for (const k in nodes) if (k !== fl) nodes[k].to({ alpha: 0.35 }, { dur: 0.3 }); res(b); }
            else { tries++; miss(); K.sfx.whoops(); wobble(b); if (o.hint) o.hint(fl); if (tries >= 2) nodes[right].pulse = true; }
          };
        });
      });
    }

    /* ---------- level 1: a friend and a tiny scene ---------- */
    const EVENTS = {
      balloon(fr) { const b = prop('town/balloon', px - 30, ground - 290, 130, 210, { bob: 6, pop: true }); return ctx.wait(900).then(() => { K.sfx.whoosh(); fr.setMood('sad'); sfx.aww(); return b.to({ y: 236, x: px + 70, rot: 0.3, sx: 0.45, sy: 0.45 }, { dur: 1.5, ease: 'inOut' }); }); },
      icecream(fr) {
        const cone = prop('', px - 20, ground - 250, 0, 0, { pop: true, paint(g, s) { g.beginPath(); A.cut(g, [[-36, 0], [36, 0], [0, 118]], [6, 6, 8], 0.6, 3); A.paper(g, s, '#D9A066', { shadow: 0.7, light: 0.08, box: { x: -36, y: 0, w: 72, h: 118 } }); A.line(g, 'rgba(138,90,60,.5)', 2.5, (h) => { for (let i = 0; i < 4; i++) { h.moveTo(-28 + i * 16, 4); h.lineTo(-4 + i * 6, 90 - i * 18); h.moveTo(28 - i * 16, 4); h.lineTo(4 - i * 6, 90 - i * 18); } }); } });
        const sc = prop('', px - 20, ground - 280, 0, 0, { z: 23, pop: true, paint(g, s) { g.beginPath(); A.blob(g, 0, 0, 50, 46, 0.05, 6, 11); A.paper(g, s, '#F29BB2', { shadow: 0.7, light: 0.1, box: { x: -50, y: -46, w: 100, h: 92 } }); g.beginPath(); g.ellipse(-16, -16, 9, 14, -0.6, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill(); g.beginPath(); g.arc(8, -44, 11, 0, 7); g.fillStyle = '#D94B3F'; g.fill(); } });
        return ctx.wait(900).then(() => { cone.to({ rot: 0.5 }, { dur: 0.3 }); return sc.to({ rot: 0.5, x: px + 26 }, { dur: 0.3 }); }).then(() => { cone.to({ y: ground - 34, x: px - 20, rot: 1.8 }, { dur: 0.44, ease: (t) => t * t }); return sc.to({ y: ground - 14, rot: Math.PI * 2 }, { dur: 0.38, ease: (t) => t * t }); }).then(() => { sfx.plop(); fr.setMood('sad'); sfx.aww(); return sc.to({ sx: 1.5, sy: 0.42, y: ground - 6 }, { dur: 0.25, ease: 'back' }); });
      },
      snowman(fr) {
        const sm = prop('tales/snowman', px - 6, ground + 4, 190, 270, { foot: true, pop: true, col: '#FBF8F1' });
        const pd = prop('bobo/puddle', px - 6, ground - 4, 250, 66, { z: 21, alpha: 0, col: '#86BCD0' });
        const sn = prop('', px + 40, ground - 520, 0, 0, { pop: true, delay: 0.5, z: 6, paint: (g, s) => sun(g, s, 52, st.t) });
        return ctx.wait(1200).then(() => { K.sfx.tone(700, 1.1, { to: 260, type: 'sine', vol: 0.1 }); pd.to({ alpha: 1 }, { dur: 1.1 }); sn.to({ sx: 1.2, sy: 1.2 }, { dur: 1 }); return sm.to({ sy: 0.3, sx: 1.12 }, { dur: 1.2, ease: 'inOut' }); }).then(() => { fr.setMood('sad'); sfx.aww(); });
      },
      gift(fr) { return ctx.wait(500).then(() => { prop('tales/gift', px - 10, ground + 4, 200, 220, { foot: true, pop: true, col: '#7B5AA6' }); K.sfx.pop(); return ctx.wait(450); }).then(() => { K.sfx.sparkle(); ctx.fx.burst(px - 10, ground - 130, { n: 14 }); fr.jump(); }); },
      rainbow(fr) { const rb = prop('bobo/rainbow', land ? W * 0.3 : W / 2, ground - 150, land ? 620 : 520, 380, { z: 5, alpha: 0, foot: true, col: '#F2B33D' }); rb.sx = rb.sy = 0.7; return ctx.wait(500).then(() => { K.sfx.sparkle(); sfx.warm(); return rb.to({ alpha: 1, sx: 1, sy: 1 }, { dur: 1, ease: 'out' }); }).then(() => fr.jump()); },
      kite(fr) {
        const k = prop('tales/kite', px + 10, ground - 250, 150, 260, { sway: 1.7, bob: 10, pop: true, col: '#E8664A' });
        const base = k.draw; k.draw = (g, s) => { A.line(g, 'rgba(255,255,255,.85)', 3, (h) => { h.moveTo(0, 110); h.quadraticCurveTo(-60, 190, fx + FH * 0.22 - k.x, ground - FH * 0.55 - k.y); }); base(g, s); };
        return ctx.wait(700).then(() => { K.sfx.whoosh(); return k.to({ y: ground - (land ? 470 : 400) }, { dur: 0.9, ease: 'out' }); }).then(() => fr.jump());
      },
    };
    function helpCards(fr, withCloud) {
      const kinds = K.shuffle(['hug', 'share'].concat(withCloud ? ['cloud'] : []));
      const c = land ? 196 : 152, pos = grid(kinds.length, c, c, land ? 30 : 20), names = { hug: 'a hug', share: 'share a toy', cloud: 'rain cloud' };
      S.answer = names.hug; S.wrong = withCloud ? names.cloud : null;
      const card = A.sprite('feelCard' + c, [-c / 2, -c / 2, c, c], (g, s) => { g.beginPath(); A.rect(g, -c / 2, -c / 2, c, c, 34, 5, 1); A.paper(g, s, CREAM, { shadow: 0.9, light: 0.04, box: { x: -c / 2, y: -c / 2, w: c, h: c } }); });
      const icon = {
        hug: (g, s) => { g.save(); const k = (c / 196) * (1 + Math.sin(st.t * 4) * 0.04); g.scale(k, k); g.beginPath(); heart(g, 56); A.paper(g, s, '#E8664A', { shadow: 0.5, light: 0.1, box: { x: -60, y: -60, w: 120, h: 120 } }); g.restore(); },
        share: (g, s) => { g.save(); g.rotate(Math.sin(st.t * 2.5) * 0.12); if (!drawPic(g, 'kitchen/ball', c * 0.62, c * 0.62)) { g.beginPath(); g.arc(0, 0, c * 0.28, 0, 7); A.paper(g, s, '#5B8FC7', {}); } g.restore(); },
        cloud: (g, s) => { A.line(g, 'rgba(111,179,220,.9)', 5, (h) => { for (let i = 0; i < 4; i++) { h.moveTo(-36 + i * 24, c * 0.2); h.lineTo(-41 + i * 24, c * 0.32); } }); g.save(); g.translate(0, -c * 0.06); if (!drawPic(g, 'bobo/cloud', c * 0.74, c * 0.5)) { g.beginPath(); A.blob(g, 0, 0, c * 0.3, c * 0.2, 0.08, 4); A.paper(g, s, '#9A9AA8', {}); } g.restore(); },
      };
      return new Promise((res) => {
        let done = false, busy = false;
        kinds.forEach((kind, i) => {
          const b = button(pos[i], { x: -c / 2, y: -c / 2, w: c, h: c }, names[kind], (g, s) => { g.drawImage(card.canvas, -card.ox, -card.oy, card.w, card.h); icon[kind](g, s); }, i);
          b.onTap = async () => {
            if (done || busy) return;
            if (kind === 'cloud') {
              busy = true; miss(); K.sfx.whoops(); wobble(b);
              await Promise.all([rainOn(fr.x, fr.y - FH - 40, 1300), tell(T.nohelp, 1500)]);
              b.onTap = null; b.to({ alpha: 0.3 }, { dur: 0.3 }); busy = false; return;
            }
            done = true; K.sfx.pop();
            const fly = keep(st.add({ z: 60, x: b.x, y: b.y })); fly.draw = (g, s) => icon[kind](g, s);
            b.to({ alpha: 0.4 }, { dur: 0.2 });
            if (kind === 'hug') { await fly.to({ x: fr.x, y: fr.y - FH * 0.4, sx: 1.5, sy: 1.5 }, { dur: 0.55, ease: 'inOut' }); fr.to({ squash: -0.07 }, { dur: 0.15 }).then(() => fr.to({ squash: 0 }, { dur: 0.5, ease: 'elastic' })); fly.to({ alpha: 0, sx: 2.4, sy: 2.4 }, { dur: 0.5 }); }
            else { await fly.to({ x: fr.x + FH * 0.36, y: ground - (land ? 60 : 46) }, { dur: 0.6, ease: 'inOut' }); sfx.plop(); fly.to({ y: fly.y - 50 }, { dur: 0.18, ease: 'out' }).then(() => fly.to({ y: fly.y + 50 }, { dur: 0.2, ease: (t) => t * t })); }
            sfx.warm(); hearts(fr.x, fr.y - FH * 0.6);
            res(kind);
          };
        });
      });
    }
    async function playScene() {
      const lf = last.feels || (last.feels = []), only = !lf.length ? 'sad' : lf.length > 1 && lf[lf.length - 1] === lf[lf.length - 2] ? (lf[lf.length - 1] === 'sad' ? 'happy' : 'sad') : null;   // the first friend needs help; never three of one feeling in a row
      const sc = pickNew(SCENES.filter((x) => !only || x.feel === only), 'scene', (x) => x.id), who = pickNew(Object.keys(FRIENDS), 'who');
      lf.push(sc.feel);
      S = { kind: 'scene', id: sc.id, feel: sc.feel, step: 'event', misses: 0 };
      const fr = friend(who, fx, ground, FH); fr.walkIn(-FH * 0.5);
      await ctx.wait(650);
      ctx.prompt(`${sc.feel === 'sad' ? T.ohno : T.look} ${sc.say} ${T.feel}`);
      await EVENTS[sc.id](fr);
      S.step = 'feel';
      await askFaces(K.shuffle(['happy', 'sad']), sc.feel, { big: true, hint: () => { ctx.say(sc.feel === 'sad' ? T.sadHint : T.smileHint); fr.jump(26); } });
      await tell(T.yes + ' ' + WORD[sc.feel], 1300);
      clearUI();
      if (sc.feel === 'sad') {
        await ctx.wait(250);
        S.step = 'help'; ctx.prompt(T.cheer);
        const how = await helpCards(fr, skill >= 1);
        await fr.setMood('happy'); fr.jump();
        await tell(how === 'hug' ? T.hug : T.share, 1500);
        clearUI();
      } else { K.sfx.sparkle(); await fr.jump(90); await fr.jump(60); }
    }

    /* ---------- level 2: which face is that? ---------- */
    function momentCard(art) {
      const cw = land ? 430 : 400, ch = land ? 390 : 330, dark = art === 'late' || art === 'bang';
      const back = A.sprite('feelMoment' + cw + (dark ? 'd' : 'l'), [-cw / 2, -ch / 2, cw, ch], (g, s) => {
        g.beginPath(); A.rect(g, -cw / 2, -ch / 2, cw, ch, 40, 4, 1.2); A.paper(g, s, CREAM, { shadow: 1, depth: 1.3, light: 0.03, box: { x: -cw / 2, y: -ch / 2, w: cw, h: ch } });
        g.beginPath(); A.rect(g, -cw / 2 + 18, -ch / 2 + 18, cw - 36, ch - 36, 26, 6, 0.8); A.paper(g, s, dark ? '#2E3566' : '#CFE9F2', { shadow: 0, light: 0.06, box: { x: -cw / 2, y: -ch / 2, w: cw, h: ch } });
      });
      const n = keep(st.add({ z: 20, x: mid.x, y: mid.y, sx: 0, sy: 0, rot: -0.2 }));
      n.draw = (g, s) => { g.drawImage(back.canvas, -back.ox, -back.oy, back.w, back.h); g.save(); const k = ch / 390; g.scale(k, k); ART[art](g, s, st.t); g.restore(); };
      n.to({ sx: 1, sy: 1, rot: -0.03 }, { dur: 0.5, ease: 'back' }); K.sfx.whoosh();
      return n;
    }
    async function playMatch(sit, feels) {
      S = { kind: 'match', feel: sit.feel, step: 'feel', misses: 0 };
      const card = momentCard(sit.art);
      ctx.prompt(`${sit.say} ${T.which}`);
      await ctx.wait(500);
      const b = await askFaces(feels, sit.feel, { hint: (fl) => ctx.say(WORD[fl]) });
      card.to({ rot: 0.04 }, { dur: 0.15 }).then(() => card.to({ rot: -0.03 }, { dur: 0.5, ease: 'elastic' }));
      b.to({ x: card.x + (land ? 170 : 150), y: card.y + (land ? 150 : 120), sx: 0.62, sy: 0.62 }, { dur: 0.5, ease: 'inOut' });
      await tell(T.yes + ' ' + WORD[sit.feel], 1500);
    }
    function nextMatch() {
      const pool = skill >= 1 || L === 3 ? SITS : SITS.slice(0, 5), sit = pickNew(pool, 'feel', (x) => x.feel);
      const n = skill >= 2 || L === 3 ? 4 : 3;
      return playMatch(sit, K.shuffle([sit.feel].concat(K.sample(pool.map((x) => x.feel).filter((f) => f !== sit.feel), n - 1))));
    }

    /* ---------- level 2 and 3: make the face ---------- */
    async function playMake(tier) {
      const targets = tier ? ['happy', 'sad', 'cross', 'surprised', 'scared', 'sleepy', 'proud'] : ['happy', 'sad', 'cross', 'surprised'];
      const target = pickNew(tier && makeWins < 6 ? targets.slice(3) : targets, 'make'), need = RECIPE[target];
      const rows = [['brows', ['up', 'sad', 'cross']], ['mouth', tier ? ['smile', 'frown', 'o', 'wavy'] : ['smile', 'frown', 'o']]].concat(tier ? [['eyes', ['open', 'wide', 'sleepy', 'shut']]] : []);
      const M = { brows: null, mouth: null, eyes: 'open' }, pop = { brows: 0, mouth: 0, eyes: 0 };
      S = { kind: 'make', feel: target, step: 'make', misses: 0, M, tier, answer: Object.keys(need).map((p) => p + ' ' + need[p]) };
      const R = land ? 190 : 148, fc = land ? { x: mid.x - 20, y: 470 } : { x: W / 2 - 46, y: mid.y - 20 };
      let done = false, model = makeWins === 0 || (tier && !last.tierSeen), blinkAt = 2, blink = 0, extra = null;
      if (tier) last.tierSeen = true;
      const face = keep(st.add({ z: 20, x: fc.x, y: fc.y, sx: 0, sy: 0, hop: 0, label: 'my face', pressable: false, hitR: R }));
      face.draw = (g) => { g.save(); g.translate(0, -face.hop); drawFace(g, Object.assign({}, M, { extra }), R, { ghost: true, pop, blink, t: st.t }); g.restore(); };
      face.update = (dt) => { for (const k in pop) pop[k] = Math.max(0, pop[k] - dt * 3.2); blinkAt -= dt; if (blinkAt < 0) { blink = Math.sin(Math.min(1, -blinkAt / 0.16) * Math.PI); if (blinkAt < -0.16) { blinkAt = 2.5 + Math.random() * 3; blink = 0; } } };
      face.onTap = () => { blinkAt = 0; sfx.giggle(); face.to({ hop: 24 }, { dur: 0.12, ease: 'out' }).then(() => face.to({ hop: 0 }, { dur: 0.2 })); };
      face.to({ sx: 1, sy: 1 }, { dur: 0.5, ease: 'back' });
      // the word to read, and a small face to copy while the idea is new
      const word = WORD[target].replace('.', '').toLowerCase();
      const tag = keep(st.add({ z: 21, x: fc.x, y: fc.y + R + (land ? 74 : 56), sx: 0, sy: 0 }));
      tag.draw = (g, s) => { g.font = `800 ${land ? 54 : 44}px ${A.FONT_TITLE}`; const w = g.measureText(word).width + 70, h = land ? 84 : 70; g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, h / 2, 3, 0.8); A.paper(g, s, CREAM, { shadow: 0.9, box: { x: -w / 2, y: -h / 2, w, h }, light: 0.03 }); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, 0, 3); };
      tag.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: 0.2 });
      const mr = land ? 70 : 58, mo = keep(st.add({ z: 22, x: fc.x + R + (land ? 60 : 46), y: fc.y - R + (land ? 40 : 30), sx: 0, sy: 0, rot: 0.1 }));
      mo.draw = (g) => { g.beginPath(); g.arc(0, 0, mr + 12, 0, 7); g.fillStyle = 'rgba(255,255,255,.75)'; g.fill(); drawFace(g, FEEL[target], mr, { t: st.t }); };
      const showModel = () => { if (mo.sx < 0.5) { mo.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back' }); K.sfx.pop(); } };
      if (model) ctx.after(500, showModel);
      // the pieces
      const cr = land ? 62 : 56, gapX = Math.min(cr * 2 + 22, (area.w - cr * 2) / 3), gapY = Math.min(cr * 2 + 26, (area.h - cr * 2) / Math.max(1, rows.length - 1));
      const chips = {};
      const finish = new Promise((res) => {
        rows.forEach(([part, kinds], ri) => kinds.forEach((kind, ci) => {
          const pos = { x: area.x + area.w / 2 + (ci - (kinds.length - 1) / 2) * gapX, y: area.y + area.h / 2 + (ri - (rows.length - 1) / 2) * gapY };
          const b = chips[part + ' ' + kind] = button(pos, { x: -cr, y: -cr, w: cr * 2, h: cr * 2 }, part + ' ' + kind, (g) => {
            const on = M[part] === kind;
            if (on) { g.beginPath(); g.arc(0, 0, cr + 9, 0, 7); g.fillStyle = '#2F8F8A'; g.fill(); }
            const sp = discSprite(cr, on ? '#F9D56E' : '#FBE7A6'); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
            g.save(); const q = cr * 0.92; g.translate(0, part === 'mouth' ? -q * 0.42 : part === 'brows' ? q * 0.44 : q * 0.1); g.scale(1.25, 1.25); facePart(g, part, kind, q, 0); g.restore();
          }, ri * 3 + ci);
          b.onTap = () => {
            if (done) return;
            K.sfx.pop(); M[part] = kind; pop[part] = 1; ctx.fx.burst(face.x, face.y + (part === 'mouth' ? R * 0.45 : -R * 0.3), { n: 5 });
            b.pulse = false;
            const full = M.mouth && (M.brows || M.eyes === 'sleepy'); if (!full) return;
            const got = classify(M);
            if (got === target) { done = true; res(); return; }
            miss();
            const off = ['brows', 'mouth', 'eyes'].find((p) => need[p] && M[p] !== need[p]) || 'eyes';
            if (got) ctx.say(S.misses >= 2 ? `${WORD[got]} ${T[off]}` : WORD[got]); else if (S.misses >= 2) ctx.say(T[off]);
            if (S.misses >= 2) { showModel(); for (const p in need) if (M[p] !== need[p]) chips[p + ' ' + need[p]].pulse = true; }
            if (S.misses >= 3 && !need.eyes && M.eyes !== 'open' && chips['eyes open']) chips['eyes open'].pulse = true;
          };
        }));
      });
      ctx.prompt(`${T.make} ${WORD[target]}`);
      await finish;
      extra = FEEL[target].extra || null; K.sfx.ding(); ctx.fx.burst(face.x, face.y, { n: 20 });
      face.to({ hop: 60 }, { dur: 0.2, ease: 'out' }).then(() => face.to({ hop: 0 }, { dur: 0.25, ease: (t) => t * t }));
      makeWins++;
      await tell(T.yes + ' ' + WORD[target], 1700);
    }

    /* ---------- level 3: what could they do? ---------- */
    function textCards(texts) {
      const cw = Math.min(area.w, 600), ch = land ? 150 : 132, th = texts.length * ch + (texts.length - 1) * 30;     // one card to a row
      const pos = texts.map((t, i) => ({ x: area.x + area.w / 2, y: area.y + area.h / 2 - th / 2 + ch / 2 + i * (ch + 30) }));
      const back = A.sprite('feelText' + Math.round(cw) + 'x' + ch, [-cw / 2, -ch / 2, cw, ch], (g, s) => { g.beginPath(); A.rect(g, -cw / 2, -ch / 2, cw, ch, 36, 7, 1); A.paper(g, s, CREAM, { shadow: 0.9, light: 0.04, box: { x: -cw / 2, y: -ch / 2, w: cw, h: ch } }); });
      return texts.map((text, i) => button(pos[i], { x: -cw / 2, y: -ch / 2, w: cw, h: ch }, text, (g) => {
        g.drawImage(back.canvas, -back.ox, -back.oy, back.w, back.h);
        g.beginPath(); g.arc(-cw / 2 + 46, 0, 15, 0, 7); g.fillStyle = [A.C.teal, A.C.plum][i % 2]; g.fill();
        g.font = `700 ${land ? 36 : 32}px ${A.FONT_BODY}`; g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle';
        const ls = wrap(g, text, cw - 126), lh = land ? 46 : 40; ls.forEach((l, k) => g.fillText(l, -cw / 2 + 82, (k - (ls.length - 1) / 2) * lh + 2));
      }, i));
    }
    async function playStory() {
      const so = pickNew(STORIES, 'story', (x) => x.id), h = Math.round(FH * (land ? 0.86 : 0.8));
      S = { kind: 'story', id: so.id, feel: so.feel, step: 'event', misses: 0 };
      const vx = land ? W * 0.14 : W * 0.25, ax = land ? W * 0.39 : W * 0.76, mx = (vx + ax) / 2;
      let night = null;
      if (so.id === 'dark') { night = keep(st.add({ z: 4, alpha: 0, draw(g) { g.fillStyle = '#1F2550'; g.fillRect(0, 0, W, land ? H : ground + 60); for (const [x, y, r] of [[0.1, 0.24, 7], [0.24, 0.16, 5], [0.4, 0.28, 8], [0.62, 0.2, 5], [0.8, 0.3, 7], [0.9, 0.18, 5]]) { star5(g, x * W, y * H * (land ? 1 : 0.5) + 60, r * (1 + Math.sin(st.t * 2 + x * 9) * 0.25)); g.fillStyle = '#F7D27A'; g.fill(); } } })); night.to({ alpha: 0.72 }, { dur: 0.6 }); }
      const vic = friend(so.victim, vx, ground, h), act = friend(so.actor, ax, ground, h);
      vic.mood = 'sad'; vic.walkIn(-h * 0.5); act.walkIn(W + h * 0.5);
      let thing = null, tw = null;
      if (so.id === 'ball') thing = prop('kitchen/ball', ax - h * 0.34, ground - 44, 96, 96, { col: '#5B8FC7', pop: true, delay: 0.5, z: 24 });
      if (so.id === 'tower') { tw = keep(st.add({ z: 19, x: mx, y: ground + 6, k: 0, alpha: 0 })); tw.draw = (g, s) => tower(g, s, tw.k, land ? 58 : 46); tw.to({ alpha: 1 }, { dur: 0.3, delay: 0.4 }); }
      await ctx.wait(700);
      // 1: how does the friend feel?
      S.step = 'feel';
      const ring = keep(st.add({ z: 18, x: vx, y: ground - h * 0.5, draw(g) { g.beginPath(); g.ellipse(0, 0, h * 0.44, h * 0.58, 0, 0, 7); g.strokeStyle = A.alpha('#FFF3C4', 0.6 + Math.sin(st.t * 5) * 0.25); g.lineWidth = 10; g.setLineDash([22, 16]); g.lineDashOffset = -st.t * 30; g.stroke(); g.setLineDash([]); } }));
      ctx.prompt(`${so.setup} ${T.feel}`);
      const others = so.feel === 'scared' ? ['happy', 'sleepy', 'proud', 'cross'] : ['happy', 'sleepy', 'proud', 'surprised'];
      await askFaces(K.shuffle([so.feel].concat(K.sample(others, 3))), so.feel, { hint: (fl) => ctx.say(WORD[fl]) });
      ring.remove();
      await tell(T.yes + ' ' + WORD[so.feel], 1300);
      clearUI(); await ctx.wait(250);
      // 2: what is the kind thing to do?
      S.step = 'choose'; S.answer = so.kind; S.wrong = so.unkind;
      const order = K.shuffle([so.kind, so.unkind]);
      ctx.prompt(`${T.kindQ} ${order[0]} ${order[1]}`, { show: T.kindQ });
      await new Promise((res) => {
        let busy = false; const cards = textCards(order);
        cards.forEach((b, i) => {
          b.onTap = async () => {
            if (busy) return; busy = true;
            if (order[i] === so.kind) { K.sfx.ding(); ctx.fx.burst(b.x, b.y, { n: 14 }); cards.forEach((c) => { if (c !== b) c.to({ alpha: 0.3 }, { dur: 0.3 }); }); res(); return; }
            // the unkind way, shown gently: nobody feels better, and the child gets another go
            miss(); K.sfx.whoops(); wobble(b);
            act.to({ x: ax + (land ? 90 : 50) }, { dur: 0.5, ease: 'inOut' }); if (thing) thing.to({ x: thing.x + (land ? 90 : 50) }, { dur: 0.5, ease: 'inOut' });
            await Promise.all([rainOn(vx, ground - h - 60, 1500), tell(T.nohelp, 1700)]);
            act.setMood('sad'); act.to({ x: ax }, { dur: 0.5, ease: 'inOut' }); if (thing) thing.to({ x: ax - h * 0.34 }, { dur: 0.5, ease: 'inOut' });
            b.onTap = null; b.to({ alpha: 0.3 }, { dur: 0.3 });
            await tell(T.again, 900);
            cards.find((c) => c !== b).pulse = true; busy = false;
          };
        });
      });
      // the kind way plays out
      S.step = 'play';
      const near = vx + h * (land ? 0.72 : 0.7);
      act.setMood('happy'); await act.to({ x: near }, { dur: 0.7, ease: 'inOut' });
      if (thing) { thing.to({ x: (vx + near) / 2, y: ground - 40 }, { dur: 0.5, ease: 'inOut' }); }
      if (tw) { tw.to({ x: (vx + near) / 2 }, { dur: 0.3 }); for (let i = 0; i < 4; i++) ctx.after(i * 260, () => K.sfx.step(i)); tw.to({ k: 1 }, { dur: 1.2, ease: 'linear' }); await ctx.wait(1100); }
      if (night) night.to({ alpha: 0 }, { dur: 1.2 });
      sfx.warm(); hearts((vx + near) / 2, ground - h * 0.6);
      await vic.setMood('happy'); vic.jump(); act.jump();
      if (thing) { const y0 = ground - 40; for (let i = 0; i < 2; i++) ctx.after(i * 520, () => { sfx.plop(); thing.to({ y: y0 - 120 }, { dur: 0.24, ease: 'out' }).then(() => thing.to({ y: y0 }, { dur: 0.26, ease: (t) => t * t })); }); }
      clearUI();
      await tell(T.kind, 1900);
    }

    /* ---------- level 3: what helps when I feel cross? ---------- */
    async function playSort() {
      const n = skill >= 1 ? 6 : 4, ideas = K.shuffle(K.sample(IDEAS.filter((x) => x.helps), n / 2).concat(K.sample(IDEAS.filter((x) => !x.helps), n / 2)));
      S = { kind: 'sort', step: 'sort', misses: 0, left: n, ideas: ideas.map((x) => ({ id: x.id, helps: x.helps, label: x.word })) };
      const zw = land ? Math.min(330, W * 0.24) : (W - 76) / 2, zh = land ? 420 : 268, zy = land ? 190 : 172;
      const cw = land ? 176 : 160, ch = land ? 166 : 150, small = land ? 0.62 : 0.4;
      const fr = land ? 128 : 82, fpos = land ? { x: W / 2, y: 400 } : { x: W / 2, y: zy + zh + 22 + fr };
      const zones = [true, false].map((helps, zi) => {
        const z = keep(st.add({ z: 12, x: land ? (zi ? W - 60 - zw : 60) : (zi ? W / 2 + 10 : 28), y: zy, sx: 1, sy: 1, alpha: 0, helps, count: 0, pulse: false, pop: 0, label: helps ? 'helps' : 'does not help', pressable: false, hit: { x: 0, y: 0, w: zw, h: zh } }));
        const col = helps ? '#DDF0D2' : '#DAD6E6', back = A.sprite('feelZone' + zi + Math.round(zw) + 'x' + zh, [0, 0, zw, zh], (g, s) => {
          g.beginPath(); A.rect(g, 0, 0, zw, zh, 40, 3 + zi, 1.2); A.paper(g, s, col, { shadow: 0.9, light: 0.05, box: { x: 0, y: 0, w: zw, h: zh } });
          g.beginPath(); A.rect(g, 14, 14, zw - 28, zh - 28, 28, 5 + zi, 0.8); g.strokeStyle = helps ? 'rgba(79,135,82,.35)' : 'rgba(110,78,126,.35)'; g.lineWidth = 4; g.setLineDash([14, 12]); g.stroke(); g.setLineDash([]);
        });
        z.draw = (g, s) => {
          g.save(); g.translate(zw / 2, zh / 2); const k = 1 + z.pop * 0.05 + (z.pulse ? Math.sin(st.t * 7) * 0.025 : 0); g.scale(k, k); g.translate(-zw / 2, -zh / 2);
          if (z.pulse) { g.beginPath(); A.rect(g, -12, -12, zw + 24, zh + 24, 48, 2, 0); g.fillStyle = A.alpha('#F7D27A', 0.6 + Math.sin(st.t * 7) * 0.25); g.fill(); }
          g.drawImage(back.canvas, -back.ox, -back.oy, back.w, back.h);
          g.save(); g.translate(zw / 2, land ? 66 : 52); const q = land ? 1 : 0.8; g.scale(q, q);
          if (helps) sun(g, s, 26, st.t); else { g.translate(0, -4); if (!drawPic(g, 'bobo/cloud', 110, 80)) { g.beginPath(); A.blob(g, 0, 0, 44, 28, 0.08, 4); g.fillStyle = '#9A9AA8'; g.fill(); } A.line(g, '#F2B33D', 6, (h) => { h.moveTo(4, 26); h.lineTo(-8, 44); h.lineTo(6, 44); h.lineTo(-4, 62); }); }
          g.restore();
          g.font = `800 ${land ? 30 : 23}px ${A.FONT_TITLE}`; g.fillStyle = helps ? '#3F7A45' : '#5D4A75'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(z.label, zw / 2, land ? 128 : 112);
          g.restore();
        };
        z.update = (dt) => { z.pop = Math.max(0, z.pop - dt * 3); };
        z.to({ alpha: 1 }, { dur: 0.35, delay: zi * 0.1 });
        z.slot = (i) => ({ x: z.x + zw * (0.28 + 0.44 * (i % 2)), y: z.y + (land ? 222 : 164) + Math.floor(i / 2) * (ch * small + 12) });
        return z;
      });
      // the cross face that calms down
      let calmT = 0; const total = n / 2;
      const face = keep(st.add({ z: 14, x: fpos.x, y: fpos.y, sx: 0, sy: 0, hop: 0 }));
      face.draw = (g) => {
        const stage = calmT >= total ? 3 : Math.min(2, Math.floor((calmT / total) * 3));
        const f = [{ brows: 'cross', mouth: 'frown', eyes: 'open' }, { brows: 'cross', mouth: 'flat', eyes: 'open' }, { brows: 'flat', mouth: 'flat', eyes: 'open' }, { brows: 'up', mouth: 'smile', eyes: 'open' }][stage];
        g.save(); g.translate(stage === 0 ? Math.sin(st.t * 30) * 2 : 0, -face.hop); drawFace(g, f, fr, { col: ['#F08A5C', '#F2A45B', '#F4B95B', SKIN][stage], t: st.t });
        if (stage === 0) A.line(g, 'rgba(255,255,255,.8)', 6, (h) => { for (const k of [-1, 1]) { const q = (st.t * 1.2 + (k > 0 ? 0.5 : 0)) % 1; h.moveTo(k * fr * 0.8, -fr * 0.9 - q * 30); h.arc(k * fr * 0.8 + 10 * k, -fr * 0.9 - q * 30, 10, Math.PI * (k > 0 ? 1 : 0), Math.PI * (k > 0 ? 2.4 : 1.4)); } });
        g.restore();
      };
      face.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back' });
      // the idea cards
      const back = A.sprite('feelIdea' + cw, [-cw / 2, -ch / 2, cw, ch], (g, s) => { g.beginPath(); A.rect(g, -cw / 2, -ch / 2, cw, ch, 26, 9, 1); A.paper(g, s, CREAM, { shadow: 0.9, light: 0.04, box: { x: -cw / 2, y: -ch / 2, w: cw, h: ch } }); });
      const cols = land ? n : Math.ceil(n / 2), gap = land ? Math.min(24, (W - 120 - cols * cw) / (cols - 1)) : 14;
      const cy0 = land ? 780 : fpos.y + fr + 50 + ch / 2;
      let sel = null;
      const select = (c) => { if (sel && sel !== c) sel.picked = false; sel = c; if (c) { c.picked = true; zones.forEach((z) => { z.pop = 1; }); } };
      await new Promise((res) => {
        const cards = ideas.map((idea, i) => {
          const r = land ? 0 : Math.floor(i / cols), ci = land ? i : i % cols, inRow = land ? n : Math.min(cols, n - r * cols);
          const home = { x: W / 2 + (ci - (inRow - 1) / 2) * (cw + gap), y: cy0 + r * (ch + 16) };
          const c = keep(st.add({ z: 55, x: home.x, y: home.y, sx: 0, sy: 0, rot: (Math.random() - 0.5) * 0.08, label: idea.word, pressable: false, pad: 4, hit: { x: -cw / 2, y: -ch / 2, w: cw, h: ch }, picked: false, tries: 0 }));
          c.draw = (g, s) => {
            if (c.picked && !c.locked) { g.translate(0, Math.sin(st.t * 6) * 5 - 8); g.beginPath(); A.rect(g, -cw / 2 - 9, -ch / 2 - 9, cw + 18, ch + 18, 32, 2, 0); g.fillStyle = '#2F8F8A'; g.fill(); }
            g.drawImage(back.canvas, -back.ox, -back.oy, back.w, back.h);
            g.save(); g.translate(0, -20); g.scale(0.82, 0.82); ART[idea.id](g, s, st.t); g.restore();
            g.font = `700 ${land ? 27 : 25}px ${A.FONT_BODY}`; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(idea.word, 0, ch / 2 - 26);
          };
          c.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: 0.3 + i * 0.08 });
          const lift = () => { c.z = 60; resort(); K.sfx.tap(); ctx.say(idea.say); };
          const goHome = () => { c.z = 55; resort(); c.to({ x: home.x, y: home.y, sx: 1, sy: 1 }, { dur: 0.45, ease: 'back' }); };
          function dropOn(z) {
            if (c.locked) return;
            if (z.helps === idea.helps) {
              c.locked = true; c.picked = false; if (sel === c) sel = null; c.onDown = c.onTap = null;
              const p = z.slot(z.count++); c.z = 16; resort(); c.to({ x: p.x, y: p.y, sx: small, sy: small, rot: 0 }, { dur: 0.4, ease: 'out' });
              K.sfx.ding(); z.pop = 1; z.pulse = false; ctx.fx.burst(p.x, p.y, { n: 8 });
              if (idea.helps) { calmT++; sfx.warm(); face.to({ hop: 18 }, { dur: 0.12 }).then(() => face.to({ hop: 0 }, { dur: 0.2 })); }
              if (--S.left <= 0) res();
            } else {
              miss(); c.tries++; K.sfx.whoops(); goHome(); wobble(c); ctx.say(idea.helps ? T.canHelp : T.nohelp);
              if (c.tries >= 2) zones.find((q) => q.helps === idea.helps).pulse = true;
            }
          }
          c.place = (helps) => dropOn(zones.find((q) => q.helps === helps));
          c.onDown = (p) => { if (c.locked) return; c.grab = { dx: c.x - p.x, dy: c.y - p.y, drag: false }; lift(); };
          c.onMove = (p, e, s) => { if (!c.grab) return; if (s.moved > 24) { c.grab.drag = true; select(null); } if (c.grab.drag) { c.x = p.x + c.grab.dx; c.y = p.y + c.grab.dy; } };
          c.onUp = () => {
            if (!c.grab) return; const drag = c.grab.drag; c.grab = null;
            if (!drag) { select(c); return; }
            const z = zones.find((q) => c.x > q.x - 30 && c.x < q.x + zw + 30 && c.y > q.y - 30 && c.y < q.y + zh + 30);
            if (z) dropOn(z); else goHome();
          };
          c.onTap = (p) => { if (!p) { lift(); select(c); } };
          return c;
        });
        zones.forEach((z) => { z.onTap = () => { if (sel && !sel.locked) { const c = sel; select(null); c.picked = false; c.place(z.helps); } else { z.pop = 1; K.sfx.tap(); } }; });
        S.cards = cards;
        ctx.prompt(T.crossQ);
      });
      face.to({ hop: 50 }, { dur: 0.2, ease: 'out' }).then(() => face.to({ hop: 0 }, { dur: 0.25, ease: (t) => t * t }));
      K.sfx.sparkle(); ctx.fx.burst(face.x, face.y, { n: 20 });
      await tell(T.calm, 2000);
    }

    /* ---------- the session ---------- */
    function nextKind() {
      if (force) { const f = force; force = null; return f; }
      if (L === 1) return 'scene';
      if (L === 2) return turn % 2 ? 'make' : 'match';
      return ['story', 'sort', 'make'][turn % 3];
    }
    let roundNo = 0;
    async function loop() {
      await ctx.wait(350);
      while (ctx.alive) {
        const kind = nextKind();
        roundNo++;
        if (kind === 'scene') await playScene();
        else if (kind === 'match') await nextMatch();
        else if (kind === 'make') await playMake(L === 3 || makeWins >= 2 ? 1 : 0);
        else if (kind === 'story') await playStory();
        else await playSort();
        if (!ctx.alive) return;
        // success makes the next rounds a little richer; a wobbly round eases off
        if (!S.misses) skill = Math.min(3, skill + 1); else if (S.misses >= 3) skill = Math.max(0, skill - 1);
        turn++; won++; tally.pop = 1; K.sfx.ding();
        await ctx.wait(500);
        await clearRound();
        if (won % SET === 0) await ctx.celebrate({ ms: 3400 });
      }
    }
    K._feelings = { get S() { return S; }, get won() { return won; }, get round() { return roundNo; }, get skill() { return skill; }, set skill(v) { skill = v; }, set force(v) { force = v; }, get ui() { return ui; }, classify, RECIPE, area };
    ctx.onExit(() => { K._feelings = null; });
    loop();
  }

  /** The shelf picture: a happy face and a sad face, and a heart between them. */
  function icon(g, w) {
    const u = w / 300; g.scale(u, u);
    const rr = (x, y, ww, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + h, r); g.arcTo(x + ww, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
    rr(0, 0, 300, 300, 40); g.save(); g.clip();
    const sky = g.createLinearGradient(0, 0, 0, 300); sky.addColorStop(0, '#7CC3EE'); sky.addColorStop(1, '#D4EEF6'); g.fillStyle = sky; g.fillRect(0, 0, 300, 300);
    g.fillStyle = '#9CD038'; g.beginPath(); g.ellipse(150, 330, 260, 110, 0, 0, 7); g.fill();
    const face = (x, y, r, f, col, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 12; g.shadowOffsetY = 6; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = col; g.fill(); g.restore();
      g.fillStyle = 'rgba(232,102,74,.28)'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * r * 0.58, r * 0.2, r * 0.15, r * 0.11, 0, 0, 7); g.fill(); }
      facePart(g, 'eyes', f.eyes, r, 0); facePart(g, 'brows', f.brows, r, 0); facePart(g, 'mouth', f.mouth, r, 0);
      if (f.extra === 'tear') drop(g, -r * 0.36, r * 0.24, r * 0.08, '#4F9FD0');
      g.restore();
    };
    face(196, 176, 78, FEEL.sad, '#BFD3EC', 0.1);
    face(108, 140, 92, BIG.happy, SKIN, -0.08);
    g.save(); g.translate(226, 62); g.rotate(0.2); g.beginPath(); heart(g, 30); g.fillStyle = '#E8664A'; g.shadowColor = 'rgba(46,40,70,.25)'; g.shadowBlur = 8; g.shadowOffsetY = 4; g.fill(); g.restore();
    g.restore();
  }

  K.game({ id: 'feelings', title: 'Happy or Sad?', voice: 'feelings', group: 'arcade', age: 3, subject: 'world', order: 16, icon, start, lines, resize: () => K.go('feelings') });
})();
