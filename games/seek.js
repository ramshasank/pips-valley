/* Hide and Seek — the friends hide in the meadow and the child looks for them.
   Touch a hiding place to look. An empty place rustles ("Nobody here."), another friend pops up to say
   hello, and the friend we are looking for jumps out and cheers. Nothing can go wrong: after two looks
   in the wrong place the right one glows.

   Level 1 (age 3): "Where is Bunny?" Three or four places and a pair of ears peeking out.
   Level 2 (ages 4-5): five or six places and a clue with a position word ("Next to the pond.",
     "Behind something tall."), and a memory round: watch two friends hide, then find each one.
   Level 3 (ages 6-8): six to eight places and two or three written clues that only fit one place
     ("Not behind a bush. Left of the tree."). The clues are chosen so that one place is left whether
     "left of" is read as "in the same row" or "anywhere to the left".
   Clean rounds make the next ones harder (more places, more clues); misses ease it off again. */
(function () {
  'use strict';
  const A = K.art;
  const lerp = (a, b, k) => a + (b - a) * k;
  const P = (g, s, col, fn, o) => A.piece(g, s, col, fn, o);
  const put = (g, sp) => g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);

  const FRIENDS = [
    { id: 'bunny', name: 'Bunny', pic: 'bobo/bunny', happy: 'tales/bunny-happy', col: '#D5CEC8', ear: '#F2A7B5' },
    { id: 'fox', name: 'Fox', pic: 'bobo/fox', happy: 'tales/fox-happy', col: '#EE7F2D', ear: '#FBF1DC' },
    { id: 'frog', name: 'Frog', pic: 'bobo/frog', happy: 'tales/frog-happy', col: '#8DB548', ear: '#FBF6EC' },
    { id: 'mouse', name: 'Mouse', pic: 'tales/mouse', happy: 'tales/mouse-happy', col: '#B9B0AC', ear: '#F2A7B5' },
    { id: 'bobo', name: 'Bobo', pic: 'bobo/bobo', happy: 'bobo/bobo-happy', col: '#C98A45', ear: '#E9B77C' },
  ];

  /* ---------------- pictures (fetched the first time the game opens; paper shapes until they arrive) ---------------- */
  const PIC = {}; let asked = false;
  function loadPics() {
    if (asked) return; asked = true;
    const want = { bg: 'bobo/bg-day', bush: 'tales/bush', lily: 'tales/lilypad', puddle: 'bobo/puddle', den: 'bobo/den' };
    for (const f of FRIENDS) { want[f.id] = f.pic; want[f.id + '+'] = f.happy; }
    for (const k in want) { const im = new Image(); im.onload = () => { PIC[k] = im; }; im.src = 'img/' + want[k] + '.webp'; }
  }

  /* ---------------- friends ---------------- */
  /** A friend 200 units tall, drawn from the top middle (0,0) downwards. */
  function friendSprite(f, happy) {
    const k = f.id + (happy ? '+' : ''), im = PIC[k] || PIC[f.id];
    return A.sprite('seek-f-' + k + (PIC[k] ? 'P' : im ? 'p' : ''), [-92, 0, 184, 204], (g, s) => {
      if (im) { const w = 200 * im.width / im.height; g.drawImage(im, -w / 2, 0, w, 200); return; }
      // paper stand-in: ears, head, body, belly, face
      const c = f.col, dark = A.shade(c, -0.08);
      if (f.id === 'bunny') for (const k2 of [-1, 1]) { P(g, s, c, (h) => h.ellipse(k2 * 20, 26, 12, 30, k2 * 0.12, 0, 7), { shadow: 0.4 }); g.beginPath(); g.ellipse(k2 * 20, 28, 5, 20, k2 * 0.12, 0, 7); g.fillStyle = f.ear; g.fill(); }
      else if (f.id === 'fox') for (const k2 of [-1, 1]) P(g, s, c, (h) => A.cut(h, [[k2 * 44, 10], [k2 * 46, 62], [k2 * 10, 46]], 6, 0.5, 3), { shadow: 0.4 });
      else if (f.id === 'frog') for (const k2 of [-1, 1]) { P(g, s, c, (h) => h.arc(k2 * 26, 32, 20, 0, 7), { shadow: 0.4 }); g.beginPath(); g.arc(k2 * 26, 30, 11, 0, 7); g.fillStyle = f.ear; g.fill(); }
      else for (const k2 of [-1, 1]) { const r = f.id === 'mouse' ? 28 : 17; P(g, s, c, (h) => h.arc(k2 * 40, 34, r, 0, 7), { shadow: 0.4 }); g.beginPath(); g.arc(k2 * 40, 34, r * 0.6, 0, 7); g.fillStyle = f.ear; g.fill(); }
      P(g, s, dark, (h) => A.blob(h, 0, 146, 46, 54, 0.03, 3, 10), { box: { x: -46, y: 92, w: 92, h: 108 } });
      g.beginPath(); g.ellipse(0, 150, 26, 36, 0, 0, 7); g.fillStyle = '#FBF1DC'; g.fill();
      if (happy) for (const k2 of [-1, 1]) A.line(g, dark, 16, (h) => { h.moveTo(k2 * 36, 120); h.lineTo(k2 * 70, 84); });
      P(g, s, c, (h) => A.blob(h, 0, 72, 52, 46, 0.03, 5, 10), { box: { x: -52, y: 26, w: 104, h: 92 } });
      g.fillStyle = A.C.ink; for (const k2 of [-1, 1]) { g.beginPath(); g.arc(k2 * 18, 68, 5.5, 0, 7); g.fill(); }
      for (const k2 of [-1, 1]) { g.beginPath(); g.arc(k2 * 32, 84, 8, 0, 7); g.fillStyle = 'rgba(240,130,130,.5)'; g.fill(); }
      A.line(g, A.C.ink, 3.5, (h) => { h.arc(0, 82, happy ? 12 : 8, 0.2, Math.PI - 0.2); });
    });
  }

  /* ---------------- hiding places ----------------
     Drawn around the middle of the place's foot (0,0), about 300 units wide. A friend sits at `hid` (out of
     sight), `peek` (a bit showing) or `out` (found); each is [middle x, top y] of the friend. Whatever part of
     the friend lies outside `clip` is not drawn, so it rises from behind a bush or slides out from behind a tree. */
  const above = (y) => (g) => g.rect(-600, -1000, 1200, 1000 + y);
  const arch = (r, bottom, mid) => (g) => { g.moveTo(-r, bottom); g.lineTo(-r, mid); g.arc(0, mid, r, Math.PI, 0); g.lineTo(r, bottom); g.closePath(); };
  const picSprite = (key, box, fallback) => A.sprite('seek-' + key + (PIC[key] ? 'P' : ''), [box[0] - 6, box[1] - 6, box[2] + 12, box[3] + 12], (g, s) => { if (PIC[key]) g.drawImage(PIC[key], box[0], box[1], box[2], box[3]); else fallback(g, s); });

  function paintBush(g, s) {
    for (const [x, y, r, c, sd] of [[-74, -78, 70, '#3F7F5E', 2], [76, -80, 72, '#3F7F5E', 4], [0, -120, 88, '#4F9470', 6], [-30, -60, 66, '#5BA77D', 8], [44, -58, 64, '#5BA77D', 10]])
      P(g, s, c, (h) => A.blob(h, x, y, r, r * 0.9, 0.06, sd, 11), { shadow: 0.5, box: { x: x - r, y: y - r, w: r * 2, h: r * 2 } });
    for (const [x, y] of [[-70, -96], [30, -150], [84, -70]]) { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fillStyle = '#D9534A'; g.fill(); }
  }
  function paintTree(g, s) {
    P(g, s, '#9A6A44', (h) => A.cut(h, [[-38, 0], [-22, -56], [-20, -214], [20, -214], [22, -56], [38, 0]], 10, 1, 3), { box: { x: -38, y: -214, w: 76, h: 214 } });
    A.line(g, 'rgba(90,56,34,.5)', 3, (h) => { h.moveTo(-8, -30); h.quadraticCurveTo(-12, -100, -6, -170); h.moveTo(9, -50); h.quadraticCurveTo(13, -110, 8, -150); });
    g.beginPath(); g.ellipse(-2, -104, 7, 11, 0, 0, 7); g.fillStyle = 'rgba(70,42,26,.6)'; g.fill();
    for (const [x, y, r, c, sd] of [[-74, -232, 76, '#4F8752', 3], [76, -238, 78, '#4F8752', 5], [0, -282, 90, '#63A05A', 7], [-28, -226, 68, '#6FA65F', 9], [42, -222, 64, '#7DB36A', 11]])
      P(g, s, c, (h) => A.blob(h, x, y, r, r * 0.9, 0.06, sd, 11), { shadow: 0.55, box: { x: x - r, y: y - r, w: r * 2, h: r * 2 } });
    for (const [x, y, r] of [[-40, -300, 22], [36, -262, 18], [-86, -250, 16]]) { g.beginPath(); g.ellipse(x, y, r, r * 0.6, -0.5, 0, 7); g.fillStyle = 'rgba(190,225,150,.35)'; g.fill(); }
    for (const [x, y] of [[-78, -214], [14, -318], [88, -252], [-6, -226], [-112, -246]]) { P(g, s, '#E8664A', (h) => h.arc(x, y, 11, 0, 7), { shadow: 0.4, box: { x: x - 11, y: y - 11, w: 22, h: 22 } }); g.beginPath(); g.arc(x - 3, y - 4, 3, 0, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill(); }
  }
  function paintLog(g, s) {
    P(g, s, '#A8703F', (h) => A.rect(h, -112, -98, 240, 96, 42, 3, 1), { box: { x: -112, y: -98, w: 240, h: 96 } });
    A.line(g, 'rgba(90,56,34,.42)', 3, (h) => { for (const [x, y, l] of [[-50, -78, 70], [34, -70, 60], [-34, -50, 96], [70, -36, 36], [-56, -24, 64], [30, -16, 50]]) { h.moveTo(x, y); h.lineTo(x + l, y + 2); } });
    P(g, s, '#E7C08A', (h) => h.ellipse(-106, -50, 30, 47, 0, 0, 7), { shadow: 0.5, box: { x: -136, y: -97, w: 60, h: 94 } });
    A.line(g, '#C4915A', 3, (h) => { h.ellipse(-106, -50, 19, 31, 0, 0, 7); h.moveTo(-98, -50); h.ellipse(-106, -50, 8, 14, 0, 0, 7); });
    P(g, s, '#6FA65F', (h) => A.blob(h, 36, -97, 56, 13, 0.12, 4, 9), { shadow: 0.3 });
    P(g, s, '#F6E7C8', (h) => A.rect(h, 86, -126, 12, 30, 4, 2, 0.4), { shadow: 0.3 });
    P(g, s, '#E8664A', (h) => { h.moveTo(68, -122); h.quadraticCurveTo(92, -164, 116, -122); h.closePath(); }, { shadow: 0.4 });
    g.fillStyle = '#FBF6EC'; for (const [x, y, r] of [[84, -134, 4], [98, -140, 3.4], [92, -128, 2.6]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  }
  const barrelBody = (h) => A.smooth(h, [[-56, -186], [0, -189], [56, -186], [77, -132], [82, -92], [77, -52], [58, -2], [0, 2], [-58, -2], [-77, -52], [-82, -92], [-77, -132]]);
  function paintBarrel(g, s) {
    P(g, s, '#C08A5A', barrelBody, { box: { x: -82, y: -189, w: 164, h: 191 } });
    g.save(); g.beginPath(); barrelBody(g); g.clip();
    A.line(g, 'rgba(110,70,40,.4)', 3, (h) => { for (const x of [-46, -16, 16, 46]) { h.moveTo(x * 0.8, -192); h.quadraticCurveTo(x * 1.3, -92, x * 0.8, 6); } });
    for (const y of [-152, -46]) { g.beginPath(); g.moveTo(-92, y); g.quadraticCurveTo(0, y + 12, 92, y); g.lineTo(92, y + 17); g.quadraticCurveTo(0, y + 29, -92, y + 17); g.closePath(); g.fillStyle = '#5F5870'; g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-64, -190, 22, 200);
    g.restore();
    g.beginPath(); g.ellipse(0, -182, 58, 15, 0, 0, 7); g.fillStyle = '#4A3324'; g.fill();
    A.line(g, '#DDB07E', 5, (h) => h.ellipse(0, -182, 58, 15, 0, 0, 7));
  }
  const tentDoor = arch(60, 0, -105);
  function paintTent(g, s) {
    A.line(g, '#EFE3C8', 3.5, (h) => { h.moveTo(-96, -100); h.lineTo(-192, -2); h.moveTo(96, -100); h.lineTo(192, -2); });
    for (const k of [-1, 1]) P(g, s, '#8A5A3C', (h) => A.rect(h, k * 192 - 5, -16, 10, 20, 3, 2, 0.3), { shadow: 0.3 });
    const body = (h) => A.cut(h, [[0, -266], [156, 0], [-156, 0]], [14, 10, 10], 1, 5);
    P(g, s, '#E8664A', body, { box: { x: -156, y: -266, w: 312, h: 266 } });
    g.save(); g.beginPath(); body(g); g.clip();
    g.fillStyle = '#F6E7C8'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(0, -270); g.lineTo(k * 118, 4); g.lineTo(k * 78, 4); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(46,40,70,.1)'; g.beginPath(); g.moveTo(0, -270); g.lineTo(160, 4); g.lineTo(0, 4); g.closePath(); g.fill();
    g.restore();
    g.beginPath(); tentDoor(g); g.fillStyle = '#43324F'; g.fill();
    A.line(g, A.C.ink, 4, (h) => { h.moveTo(0, -262); h.lineTo(0, -304); });
    P(g, s, '#F2B33D', (h) => A.cut(h, [[2, -306], [38, -294], [2, -280]], 3, 0.4, 2), { shadow: 0.4 });
  }
  function tentFlaps(g) {
    for (const k of [-1, 1]) { g.save(); g.scale(k, 1); g.beginPath(); g.moveTo(0, -165); g.arc(0, -105, 60, -Math.PI / 2, Math.PI, true); g.lineTo(-60, -24); g.quadraticCurveTo(-50, -100, 0, -165); g.fillStyle = '#F6E7C8'; g.fill(); g.restore(); }
  }
  function paintPond(g, s) {
    P(g, s, '#B98558', (h) => h.ellipse(0, -40, 150, 39, 0, 0, 7), { shadow: 0.5 });
    g.beginPath(); g.ellipse(0, -42, 138, 32, 0, 0, 7); g.fillStyle = '#9CCFE4'; g.fill();
    g.beginPath(); g.ellipse(-50, -50, 46, 8, 0, 0, 7); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill();
  }
  function paintLily(g, s) {
    P(g, s, '#6FA65F', (h) => { h.ellipse(70, -22, 72, 22, 0, 0.3, 6.0); h.lineTo(70, -22); h.closePath(); }, { shadow: 0.4 });
    for (let i = 0; i < 5; i++) { g.save(); g.translate(70, -30); g.rotate(-1.1 + i * 0.55); P(g, s, i % 2 ? '#F29BB4' : '#F7B9CB', (h) => h.ellipse(0, -18, 10, 22, 0, 0, 7), { shadow: 0.2 }); g.restore(); }
    g.beginPath(); g.arc(70, -32, 8, 0, 7); g.fillStyle = '#F2B33D'; g.fill();
  }
  const caveDoor = arch(60, -14, -88);
  function paintCave(g, s) {
    P(g, s, '#B9825A', (h) => A.smooth(h, [[-122, 0], [-116, -90], [-70, -180], [0, -212], [70, -180], [116, -90], [122, 0]]), { box: { x: -122, y: -212, w: 244, h: 212 } });
    P(g, s, '#8DB04E', (h) => A.smooth(h, [[-100, -128], [-66, -184], [0, -216], [66, -184], [100, -128], [50, -160], [0, -150], [-50, -160]]), { shadow: 0.3 });
    g.beginPath(); caveDoor(g); g.fillStyle = '#5A3324'; g.fill();
    for (const [x, r] of [[-96, 16], [100, 14]]) P(g, s, '#C9BBA8', (h) => A.blob(h, x, -8, r, r * 0.7, 0.08, r), { shadow: 0.4 });
  }

  const SPR = {
    bush: () => picSprite('bush', [-138, -214, 276, 220], paintBush),
    tree: () => A.sprite('seek-tree', [-150, -380, 300, 386], paintTree),
    log: () => A.sprite('seek-log', [-142, -170, 290, 176], paintLog),
    barrel: () => A.sprite('seek-barrel', [-96, -204, 192, 212], paintBarrel),
    tent: () => A.sprite('seek-tent', [-204, -312, 408, 320], paintTent),
    puddle: () => picSprite('puddle', [-152, -80, 304, 78], paintPond),
    lily: () => picSprite('lily', [-4, -60, 150, 58], paintLily),
    den: () => picSprite('den', [-125, -222, 250, 227], paintCave),
  };
  const hitBox = (w, h) => ({ x: -w / 2, y: -h, w, h: h + 8 });
  const TYPES = {
    bush: { name: 'bush', at: 'behind the bush', atA: 'behind a bush', h: 214, hit: hitBox(276, 214), clip: above(-84), hid: [0, -150], peek: [0, -246], out: [0, -348], front: (g) => put(g, SPR.bush()) },
    tree: { name: 'tree', at: 'behind the tree', h: 370, hit: hitBox(230, 370), clip: (g) => g.rect(21, -1000, 700, 1000), hid: [-54, -206], peek: [-6, -206], out: [104, -206], front: (g) => put(g, SPR.tree()) },
    log: { name: 'log', at: 'behind the log', h: 130, hit: hitBox(280, 190), clip: above(-52), hid: [10, -84], peek: [10, -140], out: [10, -278], front: (g) => put(g, SPR.log()) },
    pond: { name: 'pond', at: 'in the pond', h: 90, hit: hitBox(304, 190), clip: above(-36), hid: [-28, -30], peek: [-28, -88], out: [-28, -214], back: (g) => put(g, SPR.puddle()), front: (g) => put(g, SPR.lily()) },
    barrel: { name: 'barrel', at: 'in the barrel', h: 190, hit: hitBox(200, 200), clip: (g) => { g.moveTo(-600, -1000); g.lineTo(600, -1000); g.lineTo(600, -182); g.lineTo(58, -182); g.ellipse(0, -182, 58, 15, 0, 0, Math.PI); g.lineTo(-600, -182); g.closePath(); }, hid: [0, -160], peek: [0, -226], out: [0, -352], back: (g) => put(g, SPR.barrel()) },
    tent: { name: 'tent', at: 'in the tent', h: 266, hit: hitBox(300, 270), clip: tentDoor, fs: 0.76, hid: [128, -150], peek: [74, -150], out: [0, -150], back: (g) => put(g, SPR.tent()), front: tentFlaps },
    cave: { name: 'cave', at: 'in the cave', h: 216, hit: hitBox(250, 220), clip: caveDoor, fs: 0.66, hid: [118, -132], peek: [66, -132], out: [0, -132], back: (g) => put(g, SPR.den()) },
  };
  const TYPE_IDS = Object.keys(TYPES);

  /* ---------------- words ---------------- */
  const T = {
    where: (f) => `Where is ${f.name}?`,
    found: (f) => `You found ${f.name}!`,
    hello: 'Hello!',
    thisIs: (f) => `This is ${f.name}.`,
    nobody: 'Nobody here.',
    peek: 'Look! Something is peeking out.',
    look: (t) => `Look ${t.at}.`,
    next: (t) => `Next to the ${t.name}.`,
    left: (t) => `Left of the ${t.name}.`,
    right: (t) => `Right of the ${t.name}.`,
    not: (t) => `Not ${t.atA || t.at}.`,
    tall: 'Behind something tall.',
    wet: 'In the water.',
    watch: 'Watch! Two friends are hiding.',
    remember: 'Where did they hide?',
  };
  function lines() {
    const out = [T.hello, T.nobody, T.peek, T.tall, T.wet, T.watch, T.remember];
    for (const f of FRIENDS) out.push(T.where(f), T.found(f), T.thisIs(f));
    for (const id of TYPE_IDS) { const t = TYPES[id]; out.push(T.look(t), T.next(t), T.left(t), T.right(t), T.not(t)); }
    const seen = {}, list = [];
    for (const text of out) for (const sn of String(text).match(/[^.!?]+[.!?]*/g) || []) { const k = K.voiceKey(sn); if (k && !seen[k]) { seen[k] = 1; list.push(sn.trim()); } }
    return list;
  }

  /* ---------------- the meadow ---------------- */
  function paintMeadow(g, s, W, H, hy) {
    const im = PIC.bg;
    if (im) {
      const sc = Math.max(W / im.width, (H - hy) / (im.height * 0.53), hy / (im.height * 0.47));
      g.drawImage(im, W / 2 - im.width * sc / 2, hy - 0.47 * im.height * sc, im.width * sc, im.height * sc);
    } else {
      const sk = g.createLinearGradient(0, 0, 0, hy); sk.addColorStop(0, '#8CCBEA'); sk.addColorStop(1, '#DFF1EE'); g.fillStyle = sk; g.fillRect(0, 0, W, hy + 40);
      P(g, s, '#9CCB8A', (h) => { h.moveTo(-20, hy + 20); h.quadraticCurveTo(W * 0.25, hy - 90, W * 0.55, hy + 6); h.quadraticCurveTo(W * 0.8, hy - 70, W + 20, hy + 10); h.lineTo(W + 20, hy + 80); h.lineTo(-20, hy + 80); h.closePath(); }, { shadow: 0 });
      const gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, '#A9D85E'); gr.addColorStop(1, '#7FBF4A'); g.fillStyle = gr; g.fillRect(0, hy, W, H - hy);
    }
    // paper tufts and daisies scattered over the grass
    const r = A.rng(31), n = Math.round(W / 70);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = hy + 70 + r() * (H - hy - 90), k = 0.7 + r() * 0.6;
      if (i % 3) { g.fillStyle = i % 2 ? 'rgba(86,150,62,.55)' : 'rgba(120,180,80,.6)'; for (const d of [-1, 0, 1]) { g.beginPath(); g.moveTo(x + d * 9 * k - 4 * k, y); g.quadraticCurveTo(x + d * 14 * k, y - 20 * k, x + d * 18 * k, y - 30 * k); g.quadraticCurveTo(x + d * 12 * k, y - 12 * k, x + d * 9 * k + 4 * k, y); g.fill(); } }
      else { g.fillStyle = '#FBF8F1'; for (let p = 0; p < 6; p++) { g.beginPath(); g.ellipse(x + Math.cos(p * 1.047) * 7 * k, y + Math.sin(p * 1.047) * 7 * k, 5 * k, 5 * k, 0, 0, 7); g.fill(); } g.beginPath(); g.arc(x, y, 4.5 * k, 0, 7); g.fillStyle = '#F2B33D'; g.fill(); }
    }
  }
  const starPath = (g, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, q = i % 2 ? r * 0.48 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); };

  function start(st, ctx) {
    loadPics();
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, ROUNDS = 4;
    const topY = land ? (L === 1 ? 200 : 236) : (L === 1 ? 250 : L === 2 ? 252 : 336);
    const botY = H - 84, hy = land ? 470 : topY + 96;
    const key = Math.round(W) + 'x' + Math.round(H) + 'L' + L;
    let places = [], cards = [], R = null, won = 0, skill = 0, roundNo = 0, lastFriend = null, lastSpot = -1, lastAct = 0, curN = 0, cellW = 300, redeal = true, gain = 0;

    st.add({ z: 0, draw(g) { put(g, A.sprite('seek-bg' + (PIC.bg ? 'P' : '') + key, [0, 0, W, H], (g2, s) => paintMeadow(g2, s, W, H, hy))); } });
    // two slow clouds
    for (let i = 0; i < 2; i++) {
      const c = st.add({ z: 1, x: W * (0.2 + i * 0.55), y: (land ? 250 : hy - 150) + i * 70, k: 0.8 + i * 0.3 });
      c.update = (dt) => { c.x += dt * (7 + i * 4); if (c.x > W + 160) c.x = -160; };
      c.draw = (g) => { g.fillStyle = 'rgba(255,255,255,.8)'; for (const [x, y, r] of [[-50, 6, 30], [-12, -10, 40], [34, 2, 34], [70, 12, 22]]) { g.beginPath(); g.ellipse(x * c.k, y * c.k, r * c.k, r * 0.72 * c.k, 0, 0, 7); g.fill(); } };
    }

    /* ---------- hiding places ---------- */
    const rustle = (p, k) => { p.node.shake = k; p.node.to({ shake: 0 }, { dur: 0.55, ease: 'out' }); K.sfx.noise(0.1, { freq: 2200, vol: 0.07 * k }); K.sfx.noise(0.12, { freq: 1500, vol: 0.06 * k, delay: 0.09 }); };
    function drawPlace(p, g) {
      const n = p.node, Tp = p.T, t = st.t;
      if (p.glow) { const r = 215 + Math.sin(t * 5) * 16, cy = -Tp.h * 0.5, gr = g.createRadialGradient(0, cy, 20, 0, cy, r); gr.addColorStop(0, 'rgba(255,244,170,.98)'); gr.addColorStop(0.55, 'rgba(255,240,150,.6)'); gr.addColorStop(1, 'rgba(255,240,150,0)'); g.fillStyle = gr; g.fillRect(-r, cy - r, r * 2, r * 2); }
      g.beginPath(); g.ellipse(0, 0, Tp.hit.w * 0.46, 15, 0, 0, 7); g.fillStyle = 'rgba(40,70,40,.2)'; g.fill();
      g.save();
      g.rotate(Math.sin(t * 40) * n.shake * 0.04);
      const q = p.glow ? 1 + Math.sin(t * 5) * 0.035 : 1; g.scale(q + n.shake * 0.03, q - n.shake * 0.03);
      if (Tp.back) Tp.back(g);
      if (p.who) {
        const pk = n.pk * (1 - n.up) * (0.86 + 0.14 * Math.sin(t * 2.2 + p.i));
        const x = Tp.hid[0] + (Tp.peek[0] - Tp.hid[0]) * pk + (Tp.out[0] - Tp.hid[0]) * n.up, y = Tp.hid[1] + (Tp.peek[1] - Tp.hid[1]) * pk + (Tp.out[1] - Tp.hid[1]) * n.up;
        if (pk > 0.01 || n.up > 0.01) {
          g.save(); g.beginPath(); Tp.clip(g); g.clip();
          const fs = Tp.fs || 1, hop = p.cheer ? Math.abs(Math.sin((t - p.cheer) * 9)) * 14 * Math.max(0, 1 - (t - p.cheer) / 1.6) : 0;
          g.translate(x, y - hop); g.scale(fs, fs);
          if (p.mood) { g.translate(0, 200); g.rotate(Math.sin(t * 7) * 0.04); g.translate(0, -200); }
          put(g, friendSprite(p.who, p.mood)); g.restore();
        }
      }
      if (Tp.front) Tp.front(g);
      g.restore();
    }
    function deal(N) {
      for (const p of places) { const n = p.node; n.onTap = n.onDown = null; n.to({ sx: 0, sy: 0 }, { dur: 0.22, ease: 'inOut' }).then(() => n.remove()); }
      let types = K.sample(TYPE_IDS, Math.min(N, TYPE_IDS.length)); while (types.length < N) types.push('bush');
      if (L === 3 && N < 8 && Math.random() < 0.5 && types.includes('bush')) types[types.findIndex((x) => x !== 'bush')] = 'bush';
      types = K.shuffle(types);
      const rows = land ? (N <= 4 ? 1 : 2) : (N <= 4 ? 2 : 3), cols = Math.ceil(N / rows);
      cellW = Math.min((W - (land ? 100 : 20)) / cols, 400);
      const cellH = (botY - topY) / rows, s = Math.min(cellW / 292, cellH / 345, 1.15);
      const seen = {};
      places = types.map((type, i) => {
        const Tp = TYPES[type], row = Math.floor(i / cols), col = i % cols, nr = Math.min(cols, N - row * cols);
        const x = W / 2 + (col - (nr - 1) / 2) * cellW + (Math.random() - 0.5) * 16, y = topY + row * cellH + cellH / 2 + 165 * s + (Math.random() - 0.5) * 14;
        seen[type] = (seen[type] || 0) + 1;
        const p = { i, type, T: Tp, row, col, x, y, s, who: null, mood: false, glow: false, open: false, cheer: 0 };
        const node = p.node = st.add({ x, y, z: 10 + row, sx: 0, sy: 0, hit: Tp.hit, pad: 4, label: seen[type] > 1 ? `${Tp.name} ${seen[type]}` : Tp.name, pressable: false, up: 0, pk: 0, shake: 0 });
        p.label = node.label; node._bsx = node._bsy = s;
        node.draw = (g) => drawPlace(p, g);
        node.to({ sx: s, sy: s }, { dur: 0.42, ease: 'back', delay: 0.07 * i });
        node.onDown = () => look(p); node.onTap = (pt) => { if (!pt) look(p); };
        return p;
      });
      curN = N; lastSpot = -1; K.sfx.whoosh();
    }

    /* ---------- who we are looking for, the clue notes, the star tray ---------- */
    const brd = land || L < 3 ? { x: W / 2, y: land ? 166 : 186 } : { x: 84, y: 228 };
    const bR = land ? 54 : 56;
    const badge = st.add({ ui: true, z: 60, x: brd.x, y: brd.y, visible: false, f: null });
    badge.draw = (g) => {
      if (!badge.f) return;
      put(g, A.sprite('seek-badge' + bR, [-bR - 8, -bR - 8, bR * 2 + 16, bR * 2 + 16], (g2, s) => { P(g2, s, '#F2B33D', (h) => h.arc(0, 0, bR + 6, 0, 7), { box: { x: -bR, y: -bR, w: bR * 2, h: bR * 2 } }); P(g2, s, '#FBF6EC', (h) => h.arc(0, 0, bR, 0, 7), { shadow: 0 }); }));
      g.save(); g.beginPath(); g.arc(0, 0, bR - 2, 0, 7); g.clip();
      const q = bR / 50; g.translate(0, -bR * 0.98); g.scale(q, q); put(g, friendSprite(badge.f, false)); g.restore();
    };
    function setBadge(f) { badge.f = f; badge.visible = !!f; if (f) { badge.sx = badge.sy = 0.4; badge.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' }); } }
    function showCards(texts) {
      for (const c of cards) c.remove(); cards = [];
      let font = land ? 30 : 27; const g = st.g, h = land ? 58 : 56, gap = 16;
      const measure = () => { g.save(); g.font = `700 ${font}px ${A.FONT_BODY}`; const ws = texts.map((t) => g.measureText(t).width + 52); g.restore(); return ws; };
      let ws = measure();
      const stacked = !land && L === 3, room = stacked ? W - 170 : W - 60 - (bR * 2 + gap);
      const need = stacked ? Math.max(0, ...ws) : ws.reduce((a, b) => a + b + gap, 0);
      if (need > room) { font = Math.max(18, Math.floor(font * room / need)); ws = measure(); }
      if (stacked) { const w = Math.max(...ws, 300); ws = ws.map(() => w); }
      const total = bR * 2 + ws.reduce((a, b) => a + b + gap, 0);
      let x = W / 2 - total / 2;
      if (!stacked) { badge.x = texts.length ? x + bR : W / 2; x += bR * 2 + gap; }
      texts.forEach((text, i) => {
        const w = ws[i], n = st.add({ ui: true, z: 58, x: stacked ? 152 + (W - 172) / 2 : x + w / 2, y: stacked ? 164 + i * 64 : brd.y, sx: 0, sy: 0, rot: (i % 2 ? 1 : -1) * 0.012 });
        n._bsx = n._bsy = 1; x += w + gap;
        n.draw = (g2) => {
          g2.save(); g2.shadowColor = 'rgba(46,40,70,.24)'; g2.shadowBlur = 8 * st.res; g2.shadowOffsetY = 4 * st.res; g2.beginPath(); A.rect(g2, -w / 2, -h / 2, w, h, 14, i + 3, 0.7); g2.fillStyle = '#FBF6EC'; g2.fill(); g2.restore();
          g2.fillStyle = ['#F2B33D', '#7FC4BF', '#F4B49A'][i % 3]; g2.save(); g2.translate(0, -h / 2); g2.rotate(-0.05); g2.fillRect(-22, -7, 44, 14); g2.restore();
          g2.fillStyle = A.C.ink; g2.font = `700 ${font}px ${A.FONT_BODY}`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(text, 0, 3);
        };
        n.to({ sx: 1, sy: 1 }, { dur: 0.36, ease: 'back', delay: 0.15 + i * 0.3 });
        cards.push(n);
      });
    }
    const tray = st.add({ ui: true, z: 55, x: W / 2, y: H - 44 });
    tray.draw = (g) => {
      const w = ROUNDS * 50 + 24;
      g.beginPath(); A.rect(g, -w / 2, -26, w, 52, 26, 4, 0.4); g.fillStyle = 'rgba(251,246,236,.88)'; g.fill();
      for (let i = 0; i < ROUNDS; i++) { g.save(); g.translate((i - (ROUNDS - 1) / 2) * 50, 1); const on = i < won, k = on && i === won - 1 ? 1 + gain * 0.6 : 1; g.scale(k, k); g.rotate(on ? gain * (i === won - 1 ? 1.2 : 0) : 0); starPath(g, on ? 19 : 13); g.fillStyle = on ? '#F2B33D' : 'rgba(46,42,59,.16)'; g.fill(); g.restore(); }
    };
    tray.update = (dt) => { gain = Math.max(0, gain - dt * 2); };

    /* ---------- clues ---------- */
    const only = (p) => places.filter((q) => q.type === p.type).length === 1;
    const beside = (a, b) => a.row === b.row && Math.abs(a.col - b.col) === 1;
    /** Every true clue about place t: S = the places it leaves when read strictly (same row), Lo = when read loosely. */
    function cluesFor(t) {
      const out = [];
      for (const id of TYPE_IDS) if (id !== t.type && places.some((p) => p.type === id)) { const keep = places.filter((p) => p.type !== id); out.push({ kind: 'not', text: T.not(TYPES[id]), S: keep, Lo: keep }); }
      for (const a of places) {
        if (a === t || !only(a) || a.row !== t.row) continue;
        if (t.col < a.col) out.push({ kind: 'left', text: T.left(a.T), S: places.filter((p) => p.row === a.row && p.col < a.col), Lo: places.filter((p) => p !== a && (p.x < a.x - cellW * 0.3 || (p.row === a.row && p.col < a.col))) });
        if (t.col > a.col) out.push({ kind: 'right', text: T.right(a.T), S: places.filter((p) => p.row === a.row && p.col > a.col), Lo: places.filter((p) => p !== a && (p.x > a.x + cellW * 0.3 || (p.row === a.row && p.col > a.col))) });
        if (beside(a, t)) out.push({ kind: 'next', text: T.next(a.T), S: places.filter((p) => beside(a, p)), Lo: places.filter((p) => p !== a && (beside(a, p) || (Math.abs(p.row - a.row) === 1 && Math.abs(p.x - a.x) < cellW * 0.8))) });
      }
      return out;
    }
    const solves = (set, t) => ['S', 'Lo'].every((k) => { const left = places.filter((p) => set.every((c) => c[k].includes(p))); return left.length === 1 && left[0] === t; });
    /** Two or three clues that fit only t, none of them giving it away alone. */
    function logicClues(t, want) {
      const all = cluesFor(t), sets = { 2: [], 3: [] };
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        if (solves([a], t) || solves([b], t)) continue;
        if (solves([a, b], t)) { sets[2].push([a, b]); continue; }
        for (let k = j + 1; k < all.length; k++) { const c = all[k]; if (!solves([c], t) && !solves([a, c], t) && !solves([b, c], t) && solves([a, b, c], t)) sets[3].push([a, b, c]); }
      }
      const pool = sets[want].length ? sets[want] : sets[want === 2 ? 3 : 2];
      if (!pool.length) return null;
      const score = (s) => (s.some((c) => c.kind === 'not') ? 1 : 0) + (s.some((c) => c.kind !== 'not') ? 2 : 0) + new Set(s.map((c) => c.kind)).size * 0.5 + new Set(s.map((c) => c.text.split(' ').pop())).size;   // mixed kinds, and each clue about a different place
      const best = Math.max(...pool.map(score));
      return K.pick(pool.filter((s) => score(s) >= best - 0.5)).slice().sort((a, b) => (a.kind === 'not') - (b.kind === 'not'));
    }
    /** One clue with a position word for level 2. */
    function easyClue(t, direct) {
      const opts = [];
      if (!direct) for (const a of places) if (a !== t && only(a) && beside(a, t) && places.filter((p) => beside(a, p)).length === 1) opts.push({ kind: 'next', text: T.next(a.T), S: [t] });
      if (!opts.length || Math.random() < 0.3) { if (t.type === 'tree') opts.push({ kind: 'riddle', text: T.tall, S: [t] }); if (t.type === 'pond') opts.push({ kind: 'riddle', text: T.wet, S: [t] }); }
      return opts.length ? K.pick(opts) : { kind: 'direct', text: T.look(t.T), S: [t] };
    }

    /* ---------- rounds ---------- */
    const wantN = () => (L === 1 ? (skill < 2 ? 3 : 4) : L === 2 ? (skill < 2 ? 5 : 6) : skill < 2 ? 6 : skill < 4 ? 7 : 8);
    const speak = (text, min) => Promise.race([Promise.all([ctx.say(text), ctx.wait(min || 900)]), ctx.wait(6000)]);
    const friendsBut = (n, not) => K.sample(FRIENDS.filter((f) => !not.includes(f)), n);
    async function newRound(force) {
      R = null; roundNo++;
      const N = wantN();
      if (redeal || N !== curN) { redeal = false; deal(N); await ctx.wait(420 + N * 70); }
      for (const p of places) { p.who = null; p.mood = false; p.glow = false; p.open = false; p.found = false; p.cheer = 0; p.node.up = 0; p.node.pk = 0; }
      const kind = force || (L === 1 ? 'peek' : L === 2 ? (roundNo % 4 === 3 ? 'memory' : 'clue') : 'logic');
      const r = { kind, misses: 0, total: 0, busy: true, idx: 0, targets: [], clues: [] };
      const f = friendsBut(1, [lastFriend])[0]; lastFriend = f;
      let spots = K.shuffle(places.filter((p) => p.i !== lastSpot)), t = spots[0];
      if (kind === 'logic') {
        const want = skill < 3 ? 2 : 3; let cl = null;
        for (const p of spots) { cl = logicClues(p, want); if (cl) { t = p; break; } }
        r.clues = cl || [{ kind: 'direct', text: T.look(t.T), S: [t] }];
      } else if (kind === 'clue') r.clues = [easyClue(t, roundNo === 1)];
      lastSpot = t.i; t.who = f; r.targets.push({ f, p: t });
      const free = K.shuffle(places.filter((p) => p !== t));
      if (kind === 'memory') { const f2 = friendsBut(1, [f])[0]; free[0].who = f2; r.targets.push({ f: f2, p: free[0] }); if (Math.random() < 0.5) r.targets.reverse(); }
      else { const others = friendsBut(L === 3 && N > 6 ? 2 : L === 1 && skill < 1 ? 0 : 1, [f]); others.forEach((o, i) => { free[i].who = o; }); }
      R = r; lastAct = st.t;
      const first = r.targets[0];
      if (kind === 'memory') {
        setBadge(null); showCards([]);
        ctx.prompt(T.watch);
        for (const tg of r.targets) { tg.p.mood = true; tg.p.node.to({ up: 1 }, { dur: 0.4, ease: 'back' }); K.sfx.pop(); await ctx.wait(350); }
        await ctx.wait(2300); if (R !== r) return;
        for (const tg of r.targets) { rustle(tg.p, 0.8); tg.p.node.to({ up: 0 }, { dur: 0.35, ease: 'inOut' }); }
        await ctx.wait(500); if (R !== r) return;
        for (const tg of r.targets) tg.p.mood = false;
      } else if (kind === 'peek') {
        showCards([]);
        if (roundNo === 1) { t.node.to({ up: 0.8 }, { dur: 0.35, ease: 'back', delay: 0.3 }); K.sfx.pop(); await ctx.wait(1300); if (R !== r) return; rustle(t, 0.8); await t.node.to({ up: 0 }, { dur: 0.4, ease: 'inOut' }); }
        else for (const p of places) ctx.after(p.i * 90, () => rustle(p, 0.5));
        t.node.to({ pk: 1 }, { dur: 0.5, ease: 'back', delay: 0.2 });
        if (skill >= 3) for (const p of places) if (p.who && p !== t) p.node.to({ pk: 1 }, { dur: 0.5, ease: 'back', delay: 0.5 });
      } else { showCards(r.clues.map((c) => c.text.replace(/\.$/, ''))); for (const p of places) ctx.after(p.i * 70, () => rustle(p, 0.4)); }
      if (R !== r) return;
      setBadge(first.f); r.busy = false; lastAct = st.t;
      ctx.prompt([T.where(first.f)].concat(r.clues.map((c) => c.text)).join(' '), { show: T.where(first.f) });
    }
    function look(p) {
      const r = R; lastAct = st.t;
      if (!r || r.busy || p.open) { rustle(p, 0.4); K.sfx.tap(); return; }
      const cur = r.targets[r.idx];
      rustle(p, 1); K.sfx.tap();
      if (p === cur.p) { found(r, cur); return; }
      r.misses++; r.total++; K.sfx.whoops();
      let hint;
      if (r.misses >= 2) { cur.p.glow = true; hint = T.look(cur.p.T); }
      else if (r.kind === 'peek') { hint = T.peek; cur.p.node.to({ pk: 1.5 }, { dur: 0.3, ease: 'back', delay: 0.7 }); ctx.after(700, () => { if (R === r) rustle(cur.p, 1); }); }
      else if (r.kind === 'memory') hint = T.remember;
      else { const i = Math.max(0, r.clues.findIndex((c) => !c.S.includes(p))); hint = r.clues[i].text; if (cards[i]) ctx.after(500, () => { if (R === r && cards[i]) cards[i].press(); }); }
      if (p.who) {
        p.open = true; p.mood = true; p.node.to({ up: 1 }, { dur: 0.35, ease: 'back' }); K.sfx.pop();
        ctx.say(`${T.hello} ${T.thisIs(p.who)} ${hint}`);
        ctx.after(1900, () => { if (R === r && !p.found) p.node.to({ up: 0 }, { dur: 0.3, ease: 'inOut' }).then(() => { if (R === r) { p.open = false; p.mood = false; } }); });
      } else {
        const at = st.toScreen(p.node, 0, -p.T.h * 0.6); ctx.fx.burst(at.x, at.y, { n: 7, colors: ['#6FA65F', '#93C27A', '#4F8752'], star: false });
        ctx.say(`${T.nobody} ${hint}`);
      }
    }
    async function found(r, cur) {
      r.busy = true; const p = cur.p;
      p.open = true; p.found = true; p.mood = true; p.glow = false; p.cheer = st.t;
      p.node.to({ up: 1 }, { dur: 0.45, ease: 'back' });
      K.sfx.ding(); ctx.after(220, () => K.sfx.sparkle());
      const fs = p.T.fs || 1, at = st.toScreen(p.node, p.T.out[0], p.T.out[1] + 60 * fs); ctx.fx.burst(at.x, at.y, { n: 16 });
      await speak(T.found(cur.f), 1500); if (R !== r) return;
      if (r.idx + 1 < r.targets.length) { r.idx++; r.misses = 0; const nx = r.targets[r.idx]; setBadge(nx.f); r.busy = false; lastAct = st.t; ctx.prompt(T.where(nx.f)); return; }
      skill = r.total === 0 ? Math.min(6, skill + 1) : r.total >= 2 ? Math.max(0, skill - 1) : skill;
      won++; gain = 1; K.sfx.step(won + 1);
      await ctx.wait(800); if (R !== r) return;
      R = null; setBadge(null); showCards([]); ctx.prompt('', { silent: true });
      for (const q of places) { q.found = false; q.glow = false; q.node.to({ up: 0, pk: 0 }, { dur: 0.3, ease: 'inOut' }); }
      await ctx.wait(420);
      if (won >= ROUNDS) { await ctx.celebrate(); won = 0; redeal = true; }
      newRound();
    }
    // a quiet spell: the hiding place gives itself away with a rustle (not in the logic rounds)
    ctx.every(1500, () => {
      const r = R; if (!r || r.busy || r.kind === 'logic' || st.t - lastAct < (L === 1 ? 6 : 11)) return;
      const p = r.targets[r.idx].p; lastAct = st.t - 3; rustle(p, 1);
      if (r.kind !== 'peek') { p.node.to({ pk: 1 }, { dur: 0.3, ease: 'back' }).then(() => p.node.to({ pk: 0 }, { dur: 0.4, ease: 'inOut', delay: 0.5 })); }
    });

    K._seek = { // for browser tests
      get R() { return R; }, get places() { return places; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      get answer() { return R && !R.busy ? R.targets[R.idx].p.label : null; },
      get clues() { return R ? R.clues.map((c) => c.text) : []; },
      next(kind) { redeal = true; return newRound(kind); }, cluesFor, logicClues, solves,
    };
    ctx.onExit(() => { K._seek = null; });
    ctx.after(350, () => newRound());
  }

  function icon(g, w) {
    const u = w / 300; g.save(); g.scale(u, u);
    const sk = g.createLinearGradient(0, 0, 0, 300); sk.addColorStop(0, '#9FD6EE'); sk.addColorStop(1, '#E6F4DC'); g.fillStyle = sk; g.fillRect(0, 0, 300, 300);
    g.fillStyle = '#FFFFFF'; for (const [x, y, r] of [[60, 60, 22], [88, 50, 28], [118, 62, 20]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#93CC62'; g.beginPath(); g.ellipse(150, 330, 250, 130, 0, 0, 7); g.fill();
    // a bunny peeking over a bush
    for (const k of [-1, 1]) { g.save(); g.translate(150 + k * 24, 104); g.rotate(k * 0.16); g.fillStyle = '#DAD3CD'; g.beginPath(); g.ellipse(0, 0, 17, 50, 0, 0, 7); g.fill(); g.fillStyle = '#F2A7B5'; g.beginPath(); g.ellipse(0, 4, 8, 34, 0, 0, 7); g.fill(); g.restore(); }
    g.fillStyle = '#DAD3CD'; g.beginPath(); g.arc(150, 172, 52, 0, 7); g.fill();
    g.fillStyle = '#2E2A3B'; for (const k of [-1, 1]) { g.beginPath(); g.arc(150 + k * 19, 162, 6.5, 0, 7); g.fill(); }
    g.fillStyle = '#FFFFFF'; for (const k of [-1, 1]) { g.beginPath(); g.arc(152 + k * 19, 160, 2.2, 0, 7); g.fill(); }
    for (const [x, y, r, c] of [[74, 236, 58, '#3F7F5E'], [228, 238, 60, '#3F7F5E'], [150, 232, 70, '#4F9470'], [110, 262, 56, '#5BA77D'], [196, 264, 56, '#5BA77D'], [150, 290, 80, '#5BA77D']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#E8664A'; for (const [x, y] of [[84, 222], [206, 214], [150, 250], [240, 262]]) { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }
    g.restore();
  }

  K.game({ id: 'seek', title: 'Hide and Seek', voice: 'seek', group: 'arcade', age: 3, order: 12, icon, start, lines, resize: () => K.go('seek') });
})();
