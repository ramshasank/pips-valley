/* Pip's Playhouse — core engine.
   Everything hangs off the global `K`. Activities call K.register({...}) and receive a `ctx`.
   See web/ACTIVITY_API.md for the contract. */
/* Small fill-ins so the app also runs on older iPads and phones (Safari before 16). */
(function () {
  'use strict';
  try {
    const P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
    const rr = function (x, y, w, h, r) {
      let rs = Array.isArray(r) ? r.slice() : [r || 0];
      rs = rs.map((v) => (v && typeof v === 'object' ? v.x || 0 : +v || 0));
      if (rs.length === 1) rs = [rs[0], rs[0], rs[0], rs[0]]; else if (rs.length === 2) rs = [rs[0], rs[1], rs[0], rs[1]]; else if (rs.length === 3) rs = [rs[0], rs[1], rs[2], rs[1]];
      if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
      const k = Math.min(1, w / Math.max(1e-6, rs[0] + rs[1]), w / Math.max(1e-6, rs[3] + rs[2]), h / Math.max(1e-6, rs[0] + rs[3]), h / Math.max(1e-6, rs[1] + rs[2]));
      const [a, b, c, d] = rs.map((v) => v * k);
      this.moveTo(x + a, y); this.lineTo(x + w - b, y); this.arcTo(x + w, y, x + w, y + b, b); this.lineTo(x + w, y + h - c); this.arcTo(x + w, y + h, x + w - c, y + h, c);
      this.lineTo(x + d, y + h); this.arcTo(x, y + h, x, y + h - d, d); this.lineTo(x, y + a); this.arcTo(x, y, x + a, y, a); this.closePath();
    };
    if (P && !P.roundRect) P.roundRect = rr;
    if (window.Path2D && !Path2D.prototype.roundRect) Path2D.prototype.roundRect = rr;
    const at = function (i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return i < 0 || i >= this.length ? undefined : this[i]; };
    for (const C of [Array, String]) if (!C.prototype.at) Object.defineProperty(C.prototype, 'at', { value: at, writable: true, configurable: true });
    if (!Object.hasOwn) Object.hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
    if (!String.prototype.replaceAll) String.prototype.replaceAll = function (a, b) { return typeof a === 'string' ? this.split(a).join(b) : this.replace(a, b); };
  } catch (e) { /* ignore */ }
})();
(function () {
  'use strict';
  const K = (window.K = {});

  /* ---------------- settings & persistence ---------------- */
  /* Device-wide settings + one profile per child. Everything stays on this device.
     K.s is the live view activities use: {name, avatar, level, stickers, done} of the current child
     plus the device settings {voice, sound, voiceName}. */
  const STORE = 'pips-playhouse.v1';
  const dev = { voice: true, sound: true, voiceName: '', voiceStyle: 'playful', profiles: [], current: null };
  K.s = { name: '', avatar: '🦁', level: 1, stickers: [], done: {}, voice: true, sound: true, voiceName: '' };
  const KID = ['name', 'avatar', 'level', 'stickers', 'done'], DEV = ['voice', 'sound', 'voiceName', 'voiceStyle'];
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
    if (Array.isArray(raw.profiles)) Object.assign(dev, raw);
    else if (raw && (raw.name || (raw.stickers && raw.stickers.length))) { // older single-child save
      dev.profiles.push({ id: 'p1', name: raw.name || '', avatar: '🦁', level: raw.level || 1, stickers: raw.stickers || [], done: raw.done || {} });
      dev.current = 'p1'; DEV.forEach((k) => { if (raw[k] != null) dev[k] = raw[k]; });
    } else if (raw && raw.level) K.s.level = raw.level;
  } catch (e) { /* storage unavailable */ }
  DEV.forEach((k) => (K.s[k] = dev[k]));
  const curProfile = () => dev.profiles.find((x) => x.id === dev.current) || null;
  function activate(pr) { dev.current = pr ? pr.id : null; if (pr) KID.forEach((k) => (K.s[k] = pr[k] == null ? K.s[k] : pr[k])); if (pr && !pr.done) K.s.done = {}; if (pr && !pr.stickers) K.s.stickers = []; }
  activate(curProfile());
  K.save = function () {
    const pr = curProfile(); if (pr) KID.forEach((k) => (pr[k] = K.s[k]));
    DEV.forEach((k) => (dev[k] = K.s[k]));
    try { localStorage.setItem(STORE, JSON.stringify(dev)); return true; } catch (e) { return false; }
  };
  K.players = {
    list: () => dev.profiles.slice(),
    current: curProfile,
    add(p) { let id = 'p' + Date.now().toString(36); while (dev.profiles.some((pr) => pr.id === id)) id += 'x'; const pr = { id, name: (p.name || '').trim(), avatar: p.avatar || '🦁', level: p.level || 1, stickers: [], done: {} }; K.save(); dev.profiles.push(pr); K.s.stickers = []; K.s.done = {}; activate(pr); K.save(); return pr; },
    use(id) { K.save(); const pr = dev.profiles.find((x) => x.id === id); if (pr) { K.s.stickers = []; K.s.done = {}; activate(pr); K.save(); } return pr; },
    remove(id) { if (K.artwork) K.artwork.removePlayer(id); dev.profiles = dev.profiles.filter((x) => x.id !== id); if (dev.current === id) { dev.current = null; const n = dev.profiles[0]; if (n) activate(n); } K.save(); },
  };
  /** Difficulty band: 1 = age 3, 2 = ages 4-5, 3 = ages 6-8. */
  K.level = () => K.s.level || 1;

  /* ---------------- tiny helpers ---------------- */
  K.rand = (a, b) => a + Math.random() * (b - a);
  K.randInt = (a, b) => Math.floor(K.rand(a, b + 1));
  K.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  K.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  K.sample = (arr, n) => K.shuffle(arr).slice(0, n);
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  K.numWord = (n) => NUM[n] || String(n);

  /** DOM builder: K.el('div.card.pop-in', {onclick, style:{}, html, text, ...attrs}, [children]) */
  K.el = function (spec, attrs, kids) {
    const parts = spec.split('.');
    const node = document.createElement(parts[0] || 'div');
    if (parts.length > 1) node.className = parts.slice(1).join(' ');
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null) continue;
      if (k === 'style' && typeof v === 'object') { for (const p in v) { if (p.startsWith('--')) node.style.setProperty(p, v[p]); else node.style[p] = v[p]; } }
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    if (kids) for (const c of [].concat(kids)) if (c != null) node.append(c);
    return node;
  };
  /** Emoji as a sized span. */
  K.emoji = (ch, size, cls) => K.el('span.emoji' + (cls ? '.' + cls : ''), { text: ch, style: size ? { fontSize: typeof size === 'number' ? size + 'px' : size } : null });
  /** Restart a CSS animation class on an element. */
  K.anim = function (node, cls) { node.classList.remove('wiggle', 'bounce', 'pop-in', cls); void node.offsetWidth; node.classList.add(cls); };

  /* ---------------- sound effects (WebAudio synth, no files) ---------------- */
  let ac = null;
  let keepAlive = null, voiceOut = null;
  /** iPhones mute WebAudio when the ring/silent switch is on silent. A silent, looping <audio>
      element switches the page to media playback, which the switch does not mute. */
  function unmuteForSilentSwitch() {
    if (keepAlive) { if (keepAlive.paused) keepAlive.play().catch(() => {}); return; }
    try {
      const rate = 8000, n = rate / 2, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
      const put = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
      put(0, 'RIFF'); v.setUint32(4, 36 + n, true); put(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); put(36, 'data'); v.setUint32(40, n, true);
      for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
      keepAlive = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
      keepAlive.loop = true; keepAlive.setAttribute('playsinline', ''); keepAlive.play().catch(() => {});
    } catch (e) { /* not essential */ }
  }
  function audio() {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
    if (ac && ac.state !== 'running') ac.resume().catch(() => {});
    return ac;
  }
  /** Where recorded speech is sent: boosted and gently limited so it carries on a phone speaker. */
  function voiceBus(a) {
    if (voiceOut) return voiceOut;
    try {
      const g = a.createGain(); g.gain.value = 2.6;
      const c = a.createDynamicsCompressor(); c.threshold.value = -9; c.knee.value = 8; c.ratio.value = 8; c.attack.value = 0.003; c.release.value = 0.2;
      g.connect(c).connect(a.destination); voiceOut = g;
    } catch (e) { voiceOut = a.destination; }
    return voiceOut;
  }
  function tone(freq, dur, opts) {
    if (!K.s.sound) return; const a = audio(); if (!a) return;
    opts = opts || {};
    const t = a.currentTime + (opts.delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = opts.type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    const vol = opts.vol == null ? 0.22 : opts.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, opts) {
    if (!K.s.sound) return; const a = audio(); if (!a) return;
    opts = opts || {};
    const t = a.currentTime + (opts.delay || 0);
    const buf = a.createBuffer(1, Math.max(1, Math.floor(a.sampleRate * dur)), a.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = opts.filter || 'bandpass'; f.frequency.value = opts.freq || 1200;
    const g = a.createGain(); g.gain.value = opts.vol == null ? 0.3 : opts.vol;
    src.connect(f).connect(g).connect(a.destination); src.start(t);
  }
  K.sfx = {
    tone, noise,
    tap() { tone(520, 0.07, { type: 'triangle', vol: 0.15 }); },
    pop() { tone(420, 0.12, { to: 900, type: 'sine', vol: 0.25 }); noise(0.05, { freq: 2500, vol: 0.15 }); },
    ding() { tone(880, 0.18, { type: 'triangle' }); tone(1320, 0.3, { type: 'triangle', delay: 0.09 }); },
    whoops() { tone(330, 0.16, { to: 240, type: 'sine', vol: 0.16 }); },
    whoosh() { noise(0.25, { freq: 700, vol: 0.18 }); },
    sparkle() { [1568, 2093, 2637].forEach((f, i) => tone(f, 0.16, { type: 'sine', vol: 0.1, delay: i * 0.05 })); },
    tada() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.11 })); tone(1568, 0.5, { type: 'sine', vol: 0.14, delay: 0.46 }); },
    /** Musical note with a soft mallet envelope. */
    note(freq, dur) { tone(freq, dur || 0.6, { type: 'triangle', vol: 0.28 }); tone(freq * 2, (dur || 0.6) * 0.6, { type: 'sine', vol: 0.07 }); },
    drum(kind) {
      if (kind === 'kick') tone(150, 0.25, { to: 45, vol: 0.5 });
      else if (kind === 'snare') { noise(0.16, { freq: 1800, vol: 0.4 }); tone(190, 0.1, { vol: 0.2 }); }
      else if (kind === 'hat') noise(0.05, { filter: 'highpass', freq: 6000, vol: 0.25 });
      else if (kind === 'tom') tone(220, 0.22, { to: 110, vol: 0.4 });
      else noise(0.3, { filter: 'highpass', freq: 4000, vol: 0.2 });
    },
    /** n-th step of a rising pentatonic scale — nice for "progress" feedback. */
    step(n) { const sc = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760]; tone(sc[n % sc.length], 0.18, { type: 'triangle', vol: 0.2 }); },
  };

  /* ---------------- voice ---------------- */
  const synth = window.speechSynthesis || null;
  let voice = null;
  // Rank the device's voices so the most natural, human-sounding one wins.
  const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|wobble|zarvox|trinoids|whisper|jester|organ|superstar|good news|deranged|hysterical|pipe/i;
  const COMPACT = /\b(fred|junior|ralph|kathy|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|espeak)\b/i;
  function voiceScore(v) {
    let n = 0; const name = v.name || '';
    if (K.s.voiceName && name === K.s.voiceName) n += 1000;
    if (/premium|enhanced|natural|neural|wavenet|online/i.test(name)) n += 60;
    if (/siri/i.test(name)) n += 50;
    if (/google/i.test(name)) n += 35;
    if (/\b(ava|samantha|allison|zoe|joelle|noelle|nicky|susan|karen|serena|moira|tessa|jenny|aria|libby|sonia)\b/i.test(name)) n += 25;
    if (/en[-_]us/i.test(v.lang)) n += 10; else if (/en[-_](gb|au|in|ie|za)/i.test(v.lang)) n += 6;
    if (NOVELTY.test(name)) n -= 500;
    if (COMPACT.test(name)) n -= 40;
    return n;
  }
  /** English voices on this device, best first. */
  K.voices = function () {
    if (!synth) return [];
    return synth.getVoices().filter((v) => /^en/i.test(v.lang) && !NOVELTY.test(v.name)).sort((a, b) => voiceScore(b) - voiceScore(a));
  };
  function chooseVoice() { const vs = K.voices(); if (vs.length) voice = vs[0]; }
  if (synth) { chooseVoice(); try { synth.addEventListener('voiceschanged', chooseVoice); } catch (e) { /* older browsers */ } }
  let sayToken = 0, speaking = false;
  K.isSpeaking = () => speaking;
  // Keep character changes subtle. Device speech is a fallback, never a caricature.
  K.speechStyle = function (text, opts) {
    opts = opts || {};
    const gentle = K.s.voiceStyle === 'gentle', cheer = /!\s*$/.test(text) && text.length < 100;
    return {
      rate: opts.rate == null ? (gentle ? 0.86 : cheer ? 0.98 : 0.93) : opts.rate,
      pitch: opts.pitch == null ? (opts.who === 'monster' ? 0.9 : gentle ? 1 : cheer ? 1.1 : 1.04) : opts.pitch,
      gap: opts.gap == null ? (gentle ? 340 : /[?]\s*$/.test(text) ? 280 : 180) : opts.gap,
    };
  };

  /* ----- recorded voice -----
     web/voice/index.json maps a normalised sentence to [bundleId, byteOffset, byteLength];
     web/voice/<bundleId>.mp3 is those mp3 clips back to back. Built by tools/voice.py with a
     neural voice. Any line without a recording falls back to the device's own speech engine. */
  let clipIdx = null, curSrc = null, bundleIds = null;
  const bundles = {}, decoded = new Map();
  K.voiceKey = (t) => String(t).toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = (t) => (String(t).match(/[^.!?…]+[.!?…]*/g) || []).map((x) => x.trim()).filter((x) => K.voiceKey(x));
  /** What actually happened with the recorded voice on this device — shown in the grown-ups panel. */
  const vstat = { state: 'loading', clips: 0, recorded: 0, device: 0, problem: '' };
  K.voiceStatus = () => Object.assign({}, vstat);
  function loadBundle(id) {
    if (!bundles[id]) bundles[id] = fetch('voice/' + id + '.mp3' + (window.VOICE_V ? '?v=' + window.VOICE_V : '')).then((r) => { if (r.ok) return r.arrayBuffer(); vstat.problem = `recording file "${id}" answered ${r.status}`; return null; }).catch(() => { vstat.problem = `recording file "${id}" could not be fetched`; return null; }).then((buf) => { if (!buf) delete bundles[id]; return buf; });
    return bundles[id];
  }
  K.loadVoice = function () {
    if (location.protocol === 'file:') { vstat.state = 'missing'; vstat.problem = 'opened as a local file'; return Promise.resolve(); } // recordings need http(s)
    try {
      return fetch('voice/index.json' + (window.VOICE_V ? '?v=' + window.VOICE_V : '')).then((r) => { if (r.ok) return r.json(); vstat.problem = 'recording list answered ' + r.status; return null; })
        .then((j) => { clipIdx = j; bundleIds = null; vstat.state = j ? 'ready' : 'missing'; if (j) { vstat.clips = Object.keys(j).length; K.preloadVoice('core'); } })
        .catch((e) => { vstat.state = 'missing'; vstat.problem = 'recording list could not be fetched (' + (e && e.message) + ')'; });
    } catch (e) { vstat.state = 'missing'; vstat.problem = String(e && e.message); return Promise.resolve(); }
  };
  /** Start fetching the recordings an activity needs (called automatically by K.go). */
  K.preloadVoice = (id) => { if (!clipIdx) return; if (!bundleIds) bundleIds = new Set(Object.values(clipIdx).map((r) => r[0])); for (const bundle of bundleIds) if (bundle === id || bundle.startsWith(id + '-')) loadBundle(bundle); };
  function clipPlan(text, who) {
    if (!clipIdx) return null;
    // A whole line recorded in one take sounds most natural; use it when it exists.
    const whole = clipIdx[(who ? who + '|' : '') + K.voiceKey(text)];
    if (whole) return [{ text, ref: whole }];
    const parts = sentences(text); if (!parts.length) return null;
    const plan = [];
    for (const part of parts) { const ref = clipIdx[(who ? who + '|' : '') + K.voiceKey(part)]; if (!ref) return null; plan.push({ text: part, ref }); }
    return plan;
  }
  function clipBuffer(a, item) {
    const key = item.ref.join(':');
    if (decoded.has(key)) return Promise.resolve(decoded.get(key));
    return loadBundle(item.ref[0]).then((buf) => {
      if (!buf) return null;
      const slice = buf.slice(item.ref[1], item.ref[1] + item.ref[2]);
      return new Promise((res) => { try { const pr = a.decodeAudioData(slice, (ab) => res(ab), () => res(null)); if (pr && pr.catch) pr.catch(() => res(null)); } catch (e) { res(null); } });
    }).then((ab) => { if (ab) { decoded.set(key, ab); if (decoded.size > 300) decoded.delete(decoded.keys().next().value); } return ab; });
  }
  function stopClip() { if (curSrc) { const src = curSrc; curSrc = null; try { src.onended = null; src.stop(); } catch (e) { /* already stopped */ } if (src._done) src._done(); } }
  /** Play recorded clips in order. Resolves true when finished, false if a clip was unavailable. */
  function playClips(plan, token, opts, fullText) {
    const a = audio(); if (!a) return Promise.resolve(false);
    let timeoutId;
    const timeout = new Promise((res) => { timeoutId = setTimeout(() => res('slow'), 6000); });
    return Promise.race([Promise.all(plan.map((it) => clipBuffer(a, it))), timeout]).then((bufs) => {
      clearTimeout(timeoutId);
      if (token !== sayToken) return true;
      if (bufs === 'slow') { vstat.problem = 'recordings took more than 6 seconds to load'; return false; }
      if (!bufs || bufs.some((x) => !x)) { if (!vstat.problem) vstat.problem = 'a recording could not be decoded on this device'; return false; }
      vstat.recorded++;
      try { synth && synth.cancel(); } catch (e) { /* ignore */ }
      stopClip();
      let searchFrom = 0;
      const playOne = (i) => new Promise((res) => {
        if (token !== sayToken || i >= bufs.length) return res();
        const src = a.createBufferSource(); src.buffer = bufs[i]; src.connect(voiceBus(a)); curSrc = src;
        const timers = [];
        if (opts.onword) { // approximate word timing so read-along highlighting follows the recording
          const base = fullText.indexOf(plan[i].text, searchFrom); searchFrom = base < 0 ? searchFrom : base + plan[i].text.length;
          const words = []; const re = /\S+/g; let m; while ((m = re.exec(plan[i].text))) words.push([m.index, m[0].length]);
          const total = words.reduce((n, w) => n + w[1] + 2, 0) || 1; let acc = 0;
          for (const w of words) { const at = (acc / total) * bufs[i].duration * 1000; acc += w[1] + 2;
            timers.push(setTimeout(() => { if (token === sayToken) opts.onword(Math.max(0, base) + w[0], w[1]); }, at)); }
        }
        src._done = () => { timers.forEach(clearTimeout); if (curSrc === src) curSrc = null; res(); };
        src.onended = src._done;
        src.start();
      }).then(() => (i + 1 < bufs.length && token === sayToken ? new Promise((r) => setTimeout(r, K.speechStyle(plan[i].text, opts).gap)).then(() => playOne(i + 1)) : undefined));
      return playOne(0).then(() => true);
    });
  }

  function tts(text, opts, token) {
    const est = 500 + text.length * 75;
    if (!synth) return new Promise((r) => setTimeout(r, Math.min(est, 900)));
    return new Promise((resolve) => {
      let done = false;
      const fin = () => { if (!done) { done = true; resolve(); } };
      try {
        if (opts.interrupt !== false) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (voice) u.voice = voice;
        u.lang = (voice && voice.lang) || 'en-US';
        const style = K.speechStyle(text, opts);
        u.rate = style.rate; u.pitch = style.pitch;
        if (opts.onword) u.onboundary = (e) => { if (token === sayToken) opts.onword(e.charIndex, e.charLength || 0); };
        u.onend = fin; u.onerror = fin;
        setTimeout(() => { if (token !== sayToken) return fin(); try { synth.speak(u); } catch (e) { fin(); } }, opts.interrupt === false ? 0 : 40);
      } catch (e) { fin(); }
      setTimeout(fin, est + 2500);
    });
  }
  /** Speak text: a recorded clip when one exists, else the device voice. Resolves when finished
      (or after a safe timeout). Options: {interrupt=true, who, rate, pitch, onword(charIndex, charLength)}.
      `who` picks a recorded character voice (e.g. 'monster'); rate/pitch only affect the device-voice fallback. */
  K.say = function (text, opts) {
    opts = opts || {};
    text = String(text || '');
    if (opts.idle && speaking) return Promise.resolve();
    const token = ++sayToken;
    if (opts.interrupt !== false) { stopClip(); try { synth && synth.cancel(); } catch (e) { /* optional */ } }
    speaking = false;
    if (!K.s.voice || !text) return new Promise((r) => setTimeout(r, 50));
    speaking = true;
    const plan = clipPlan(text, opts.who);
    const finish = () => { if (token === sayToken) speaking = false; };
    const playback = plan ? playClips(plan, token, opts, text).then((ok) => { if (ok || token !== sayToken) return; vstat.device++; return tts(text, opts, token); }) : (vstat.device++, tts(text, opts, token));
    return playback.then(finish, () => { vstat.problem = 'Speech playback was interrupted'; finish(); });
  };
  K.hush = () => { sayToken++; speaking = false; stopClip(); try { synth && synth.cancel(); } catch (e) { /* ignore */ } };
  /** True only when every sentence has a recording. Unknown names never go to device speech. */
  K.hasClip = (text, who) => !!clipPlan(text, who);
  /** Say the first candidate that is fully recorded, so one voice is used for the whole line. */
  K.sayBest = function (candidates) { return K.say(candidates.find((t) => K.hasClip(t)) || candidates[candidates.length - 1]); };
  /** Every line the core itself can speak — used by tools/collect-lines.js to pre-record them. */
  K.coreLines = function (name) {
    const out = PRAISE.concat(NUDGE, ['You got a sticker!', "Hi! I'm Pip. Let's play!", 'Hi! What shall we play?', 'Play games to win stickers!', 'Wow!',
      'Hello! I am Pip. Can you hear me?', "Hello! I'm Pip. Shall we read a story?", 'Great job!', 'You did it!', 'Hooray!', 'Super star!', 'My Stickers', "Who's playing?", "Hi! Let's play!", "Let's play!", 'What shall we play?']);
    for (let n = 1; n <= 60; n++) out.push(`You have ${n} stickers!`);
    for (const a of K.activities) out.push(a.title);
    for (const nm of [].concat(name || [])) if (nm) out.push(`Hi ${nm}!`);
    return out;
  };
  K.hasVoice = () => !!(synth && K.s.voice);
  const PRAISE = ['Great job!', 'You did it!', 'Awesome!', 'Wonderful!', 'Hooray!', 'Super!', 'Wow, nice work!', 'Fantastic!', 'High five!', 'You are so clever!'];
  const NUDGE = ['Try again!', 'Almost! Try another one.', 'Hmm, not that one.', 'Oops! Have another go.'];
  K.praise = () => K.say(K.pick(PRAISE));
  K.nudge = () => K.say(K.pick(NUDGE));

  /* ---------------- particles ---------------- */
  let fx, fxc, parts = [], fxRun = false;
  function fxLoop() {
    if (!fx) return;
    const w = fx.width, h = fx.height;
    fxc.clearRect(0, 0, w, h);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
      fxc.save(); fxc.globalAlpha = Math.min(1, p.life / 20); fxc.translate(p.x, p.y); fxc.rotate(p.rot);
      fxc.fillStyle = p.c;
      if (p.shape === 'star') { fxc.font = p.s * 2.2 + 'px sans-serif'; fxc.textAlign = 'center'; fxc.textBaseline = 'middle'; fxc.fillText('★', 0, 0); }
      else fxc.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      fxc.restore();
    }
    if (parts.length) requestAnimationFrame(fxLoop); else fxRun = false;
  }
  function fxSize() { if (!fx) return; const r = devicePixelRatio || 1; fx.width = innerWidth * r; fx.height = innerHeight * r; }
  const COLORS = ['#ff6b6b', '#ffd23f', '#7ed957', '#5bb8f5', '#9b5de5', '#ff9f1c', '#ff7eb6'];
  function spawn(x, y, n, spread, shape) {
    if (!fx) return; const r = devicePixelRatio || 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = K.rand(2, spread) * r;
      parts.push({ x: x * r, y: y * r, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3 * r, g: 0.25 * r, rot: Math.random() * 6, vr: K.rand(-0.2, 0.2), s: K.rand(6, 13) * r, c: K.pick(COLORS), life: K.rand(35, 70), shape });
    }
    if (parts.length > 500) parts.splice(0, parts.length - 500);
    if (!fxRun) { fxRun = true; requestAnimationFrame(fxLoop); }
  }
  /** Small sparkle burst at viewport point, or at an element's center. */
  K.burst = function (xOrEl, y) {
    let x = xOrEl;
    if (xOrEl && xOrEl.getBoundingClientRect) { const b = xOrEl.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 2; }
    spawn(x, y, 14, 7, 'star');
  };
  K.confetti = function () { for (let i = 0; i < 6; i++) setTimeout(() => spawn(K.rand(0.1, 0.9) * innerWidth, K.rand(0.05, 0.35) * innerHeight, 26, 9), i * 130); };

  /* ---------------- mascot ---------------- */
  /** Pip the friendly sprout-creature. Returns an <svg> element. */
  K.pip = function (size, cls) {
    const wrap = K.el('div', { html:
      `<svg class="pip ${cls || ''}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="60" cy="112" rx="34" ry="6" fill="rgba(43,45,91,.18)"/>
        <path d="M60 22 C60 8 48 4 42 6 C46 14 52 20 60 22Z" fill="#7ed957"/><path d="M60 22 C62 8 74 2 82 6 C78 16 70 22 60 22Z" fill="#5cc93e"/>
        <path d="M60 20 C92 20 104 48 104 70 C104 96 86 108 60 108 C34 108 16 96 16 70 C16 48 28 20 60 20Z" fill="#ffb347"/>
        <path d="M60 60 C80 60 90 74 88 88 C84 100 72 104 60 104 C48 104 36 100 32 88 C30 74 40 60 60 60Z" fill="#ffe0a3"/>
        <circle cx="30" cy="72" r="7" fill="#ff8fa3" opacity=".7"/><circle cx="90" cy="72" r="7" fill="#ff8fa3" opacity=".7"/>
        <g class="eye"><circle cx="45" cy="56" r="10" fill="#fff"/><circle cx="47" cy="57" r="5.5" fill="#2b2d5b"/><circle cx="49" cy="55" r="2" fill="#fff"/></g>
        <g class="eye"><circle cx="75" cy="56" r="10" fill="#fff"/><circle cx="77" cy="57" r="5.5" fill="#2b2d5b"/><circle cx="79" cy="55" r="2" fill="#fff"/></g>
        <path d="M48 76 Q60 90 72 76" fill="#c0392b" stroke="#2b2d5b" stroke-width="3" stroke-linejoin="round"/>
      </svg>` });
    return wrap.firstElementChild;
  };

  /* ---------------- shapes & shared data ---------------- */
  K.data = {
    colors: [
      { name: 'red', hex: '#ff4d4d' }, { name: 'blue', hex: '#3d8bff' }, { name: 'yellow', hex: '#ffd23f' }, { name: 'green', hex: '#4cc94c' },
      { name: 'orange', hex: '#ff9f1c' }, { name: 'purple', hex: '#9b5de5' }, { name: 'pink', hex: '#ff7eb6' }, { name: 'brown', hex: '#a0673c' },
    ],
    shapes: ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'oval', 'rectangle'],
    animals: [
      { e: '🐶', name: 'dog', sound: 'woof woof' }, { e: '🐱', name: 'cat', sound: 'meow' }, { e: '🐮', name: 'cow', sound: 'moo' },
      { e: '🐷', name: 'pig', sound: 'oink oink' }, { e: '🐑', name: 'sheep', sound: 'baa' }, { e: '🐴', name: 'horse', sound: 'neigh' },
      { e: '🦆', name: 'duck', sound: 'quack quack' }, { e: '🐔', name: 'chicken', sound: 'cluck cluck' }, { e: '🐸', name: 'frog', sound: 'ribbit' },
      { e: '🦁', name: 'lion', sound: 'roar' }, { e: '🐵', name: 'monkey', sound: 'ooh ooh ah ah' }, { e: '🐘', name: 'elephant', sound: 'pawoo' },
      { e: '🐝', name: 'bee', sound: 'buzz' }, { e: '🦉', name: 'owl', sound: 'hoo hoo' }, { e: '🐍', name: 'snake', sound: 'hiss' }, { e: '🐭', name: 'mouse', sound: 'squeak' },
    ],
    fruits: [
      { e: '🍎', name: 'apple' }, { e: '🍌', name: 'banana' }, { e: '🍇', name: 'grapes' }, { e: '🍓', name: 'strawberry' }, { e: '🍊', name: 'orange' },
      { e: '🍉', name: 'watermelon' }, { e: '🍐', name: 'pear' }, { e: '🍒', name: 'cherries' }, { e: '🍍', name: 'pineapple' }, { e: '🥕', name: 'carrot' },
    ],
    vehicles: [
      { e: '🚗', name: 'car' }, { e: '🚌', name: 'bus' }, { e: '🚂', name: 'train' }, { e: '✈️', name: 'airplane' }, { e: '🚀', name: 'rocket' },
      { e: '🚜', name: 'tractor' }, { e: '🚒', name: 'fire truck' }, { e: '⛵', name: 'boat' }, { e: '🚁', name: 'helicopter' }, { e: '🚲', name: 'bicycle' },
    ],
    /** One friendly word per letter (emoji + word). */
    abc: {
      A: ['🍎', 'apple'], B: ['🐻', 'bear'], C: ['🐱', 'cat'], D: ['🐶', 'dog'], E: ['🐘', 'elephant'], F: ['🐟', 'fish'], G: ['🍇', 'grapes'],
      H: ['🏠', 'house'], I: ['🍦', 'ice cream'], J: ['🧃', 'juice'], K: ['🪁', 'kite'], L: ['🦁', 'lion'], M: ['🌙', 'moon'], N: ['👃', 'nose'],
      O: ['🐙', 'octopus'], P: ['🐧', 'penguin'], Q: ['👸', 'queen'], R: ['🌈', 'rainbow'], S: ['⭐', 'star'], T: ['🐢', 'turtle'], U: ['☂️', 'umbrella'],
      V: ['🎻', 'violin'], W: ['🐳', 'whale'], X: ['🩻', 'x-ray'], Y: ['🪀', 'yo-yo'], Z: ['🦓', 'zebra'],
    },
    stickers: ['⭐', '🌈', '🦄', '🚀', '🐶', '🐱', '🦁', '🐸', '🐙', '🦋', '🍦', '🍩', '🎈', '🎁', '🏆', '👑', '🚂', '🚗', '🦖', '🐳', '🌻', '🍓', '🧸', '🎨', '🥁', '🪁', '🐧', '🐝', '🍉', '🌟', '🎠', '🛸', '🐢', '🦊', '🐼', '🍭'],
  };
  /** SVG markup for a named shape filled with a color. */
  K.shapeSVG = function (name, color, size) {
    const s = size || 100;
    const body = {
      circle: '<circle cx="50" cy="50" r="42"/>',
      square: '<rect x="10" y="10" width="80" height="80" rx="8"/>',
      rectangle: '<rect x="4" y="24" width="92" height="52" rx="8"/>',
      oval: '<ellipse cx="50" cy="50" rx="46" ry="30"/>',
      triangle: '<path d="M50 8 L94 88 L6 88 Z" stroke-linejoin="round"/>',
      diamond: '<path d="M50 5 L92 50 L50 95 L8 50 Z" stroke-linejoin="round"/>',
      star: '<path d="M50 5 L61 37 L95 38 L68 58 L78 91 L50 72 L22 91 L32 58 L5 38 L39 37 Z" stroke-linejoin="round"/>',
      heart: '<path d="M50 88 C10 60 4 36 16 22 C28 8 46 14 50 28 C54 14 72 8 84 22 C96 36 90 60 50 88 Z"/>',
    }[name] || '<circle cx="50" cy="50" r="42"/>';
    return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="${color}" stroke="rgba(43,45,91,.35)" stroke-width="3" aria-hidden="true">${body}</svg>`;
  };

  /* ---------------- dragging ---------------- */
  /** Make an element draggable with one finger. handlers: {start(ev), move(x,y,ev), end(x,y,ev)} (viewport coords of finger).
      The element follows the finger via transform; call returned.reset() to glide back. */
  K.drag = function (node, h) {
    h = h || {};
    let sx = 0, sy = 0, ox = 0, oy = 0, id = null;
    node.style.touchAction = 'none';
    const apply = () => { node.style.transform = `translate(${ox}px,${oy}px)`; };
    node.addEventListener('pointerdown', (e) => {
      if (id !== null) return; id = e.pointerId; sx = e.clientX - ox; sy = e.clientY - oy;
      try { node.setPointerCapture(id); } catch (err) { /* ignore */ }
      node.style.transition = 'none'; node.style.zIndex = 20; h.start && h.start(e);
    });
    node.addEventListener('pointermove', (e) => { if (e.pointerId !== id) return; ox = e.clientX - sx; oy = e.clientY - sy; apply(); h.move && h.move(e.clientX, e.clientY, e); });
    const up = (e) => { if (e.pointerId !== id) return; id = null; node.style.zIndex = ''; h.end && h.end(e.clientX, e.clientY, e); };
    node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
    return {
      reset() { node.style.transition = 'transform .35s cubic-bezier(.3,1.4,.5,1)'; ox = 0; oy = 0; apply(); },
      set(x, y) { ox = x; oy = y; apply(); },
      get offset() { return { x: ox, y: oy }; },
    };
  };
  /** True if viewport point (x,y) is inside element's box grown by `pad` px. */
  K.hit = function (node, x, y, pad) { const b = node.getBoundingClientRect(); pad = pad || 0; return x >= b.left - pad && x <= b.right + pad && y >= b.top - pad && y <= b.bottom + pad; };

  /* ---------------- activity registry & navigation ---------------- */
  K.activities = [];
  /** Register an activity. def = {id, title, emoji, color, group:'learn'|'play'|'stories'|'create', order, start(body, ctx)} */
  K.register = function (def) { K.activities.push(def); };

  const stage = () => document.getElementById('stage');
  let current = null; // {cleanups:[], alive:true}
  function teardown() {
    K.navigation = (K.navigation || 0) + 1;
    K.hush();
    if (current) { current.alive = false; for (const fn of current.cleanups) { try { fn(); } catch (e) { console.error(e); } } current = null; }
    const ov = document.getElementById('overlay'); if (ov) ov.replaceChildren();
    stage().replaceChildren();
  }
  K._teardown = teardown;
  K._stageEl = stage;

  function makeCtx() {
    const me = { cleanups: [], alive: true };
    current = me;
    const ctx = {
      level: K.level(),
      get alive() { return me.alive; },
      /** Register a teardown callback (remove listeners, stop loops). */
      onExit(fn) { me.cleanups.push(fn); },
      /** Promise that resolves after ms — and never resolves once the child has left the activity. */
      wait(ms) { return new Promise((res) => { const t = setTimeout(() => { if (me.alive) res(); }, ms); me.cleanups.push(() => clearTimeout(t)); }); },
      after(ms, fn) { const t = setTimeout(() => { if (me.alive) fn(); }, ms); me.cleanups.push(() => clearTimeout(t)); return t; },
      every(ms, fn) { const t = setInterval(() => { if (me.alive) fn(); }, ms); me.cleanups.push(() => clearInterval(t)); return t; },
      /** requestAnimationFrame loop: fn(dtSeconds, tSeconds). Stops automatically on exit. */
      loop(fn) { let last = performance.now(), t0 = last; const step = (now) => { if (!me.alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; fn(dt, (now - t0) / 1000); requestAnimationFrame(step); }; requestAnimationFrame(step); },
      /** Speak; resolves only if the activity is still alive. */
      say(text, opts) { if (ctx._poke) ctx._poke(); return K.say(text, opts).then(() => new Promise((res) => { if (ctx._poke) ctx._poke(); if (me.alive) res(); })); },
    };
    return ctx;
  }

  K.go = function (id) {
    const def = K.activities.find((a) => a.id === id);
    if (!def) return K.home();
    teardown();
    const ctx = makeCtx();
    if (def.canvas) { K.preloadVoice(def.voice || def.id); return K.engine.run(def, ctx, stage()); } // drawn games bring their own chrome
    let promptText = '', promptWho;
    const promptEl = K.el('div.act-prompt');
    const starsEl = K.el('div.act-stars');
    const body = K.el('div.act-body');
    const bar = K.el('div.act-bar', null, [
      K.el('button.round-btn', { 'aria-label': 'Home', onclick: () => { K.sfx.tap(); K.home(); } }, K.emoji('🏠')),
      K.el('div', { style: { flex: '1', minWidth: '0' } }, [promptEl, starsEl]),
      K.el('button.round-btn', { 'aria-label': 'Say it again', onclick: () => { K.sfx.tap(); if (promptText) K.say(promptText, { who: promptWho }); } }, K.emoji('🔊')),
    ]);
    stage().append(K.el('div.act', null, [bar, body]));
    let idle = null;
    const armIdle = () => { clearTimeout(idle); idle = setTimeout(() => { if (ctx.alive && promptText) { K.say(promptText, { who: promptWho, idle: true }); armIdle(); } }, 22000); };
    const poke = () => armIdle();
    body.addEventListener('pointerdown', poke); body.addEventListener('pointermove', poke); body.addEventListener('pointerup', poke);
    ctx._poke = () => { if (idle) armIdle(); };
    ctx.onExit(() => clearTimeout(idle));
    /** Show + speak the current instruction. It is re-spoken on the 🔊 button and after idle time. */
    ctx.prompt = function (text, opts) { promptText = text; promptWho = opts && opts.who; promptEl.textContent = (opts && opts.show) || text; armIdle(); return (opts && opts.silent) ? Promise.resolve() : ctx.say(text, { who: promptWho }); };
    /** Progress stars under the prompt. */
    ctx.progress = function (n, total) { starsEl.replaceChildren(); for (let i = 0; i < total; i++) starsEl.append(K.el('span' + (i < n ? '.on' : ''), { text: '⭐' })); };
    /** Finished a set of rounds: confetti, praise, sticker. Resolves when the party is over. */
    ctx.celebrate = function (opts) { return K.celebrate(Object.assign({ ctx }, opts)); };
    ctx.body = body; ctx.def = def;
    K.preloadVoice(def.voice || def.id);
    try { def.start(body, ctx); } catch (e) { console.error(e); }
  };

  /** Full celebration overlay. opts: {emoji, text, sticker=true, ctx}. Resolves after ~2.6s. */
  K.celebrate = function (opts) {
    opts = opts || {};
    const ov = document.getElementById('overlay');
    let sticker = null;
    if (opts.sticker !== false) {
      const fresh = K.data.stickers.filter((x) => !K.s.stickers.includes(x));
      sticker = K.pick(fresh.length ? fresh : K.data.stickers);
      K.s.stickers.push(sticker); if (K.s.stickers.length > 400) K.s.stickers.shift(); K.save();
    }
    const pip = K.pip(Math.min(innerWidth, innerHeight) * 0.26, 'cheer');
    const card = K.el('div.card.cele-card.pop-in', null, [
      pip,
      K.el('div.txt', { text: opts.text || K.pick(['Great job!', 'You did it!', 'Hooray!', 'Super star!']) }),
      sticker ? K.el('div.big.emoji.pop-in', { text: sticker, style: { animationDelay: '.35s' } }) : (opts.emoji ? K.el('div.big.emoji', { text: opts.emoji }) : null),
    ]);
    const wrap = K.el('div.cele', null, card);
    ov.append(wrap);
    K.sfx.tada(); K.confetti();
    K.say(opts.say || K.pick(PRAISE) + (sticker ? ' You got a sticker!' : ''));
    return new Promise((res) => {
      const done = () => { wrap.remove(); if (!opts.ctx || opts.ctx.alive) res(); };
      const t = setTimeout(done, opts.ms || 2800);
      if (opts.ctx) opts.ctx.onExit(() => { clearTimeout(t); wrap.remove(); });
    });
  };

  /* ---------------- screens: start, home, stickers, parents ---------------- */
  const GROUPS = [
    { id: 'learn', title: 'Learn', emoji: '🎓' }, { id: 'stories', title: 'Stories', emoji: '📚' },
    { id: 'play', title: 'Play', emoji: '🎈' }, { id: 'create', title: 'Make', emoji: '🎨' },
  ];
  K.home = function () {
    teardown();
    if (K.valley) { K.valley.show(stage(), makeCtx()); return; }
    const name = (K.s.name || '').trim();
    const scroll = K.el('div.home-scroll');
    for (const g of GROUPS) {
      const acts = K.activities.filter((a) => a.group === g.id).sort((a, b) => (a.order || 0) - (b.order || 0));
      if (!acts.length) continue;
      scroll.append(K.el('div.group-title', null, [K.emoji(g.emoji), document.createTextNode(g.title)]));
      const grid = K.el('div.tiles');
      acts.forEach((a, i) => grid.append(K.el('button.tile.pop-in', {
        'aria-label': a.title, style: { background: a.color || 'var(--grape)', animationDelay: Math.min(i * 0.04, 0.4) + 's' },
        onclick: () => { K.sfx.pop(); K.go(a.id); },
      }, [K.emoji(a.emoji), K.el('span.label', { text: a.title })])));
      scroll.append(grid);
    }
    let holdT = null;
    const parentBtn = K.el('button.round-btn', { 'aria-label': 'Grown-ups: press and hold', style: { fontSize: '26px' } }, K.emoji('⚙️'));
    const startHold = () => { parentBtn.classList.add('pulse'); holdT = setTimeout(() => { K.parents(); }, 1500); };
    const endHold = () => { parentBtn.classList.remove('pulse'); clearTimeout(holdT); };
    parentBtn.addEventListener('pointerdown', startHold); parentBtn.addEventListener('pointerup', endHold); parentBtn.addEventListener('pointerleave', endHold); parentBtn.addEventListener('pointercancel', endHold);
    const pip = K.pip(64); pip.addEventListener('click', () => { K.anim(pip, 'cheer'); K.sfx.sparkle(); K.sayBest([name ? `Hi ${name}! What shall we play?` : '', 'Hi! What shall we play?'].filter(Boolean)); });
    stage().append(K.el('div.home', null, [
      K.el('div.home-top', null, [
        pip,
        K.el('div.hello', { text: name ? `Hi, ${name}!` : "Let's play!" }),
        K.el('button.round-btn', { 'aria-label': 'Change player', onclick: () => { K.sfx.pop(); K.who(); } }, K.emoji(K.s.avatar || '🦁')),
        K.el('button.round-btn', { 'aria-label': 'My stickers', onclick: () => { K.sfx.pop(); K.stickers(); } }, K.emoji('🏆')),
        parentBtn,
      ]),
      scroll,
    ]));
  };

  K.stickers = function () {
    teardown();
    const total = 36, have = K.s.stickers.slice(-total);
    const grid = K.el('div.sticker-grid');
    for (let i = 0; i < total; i++) {
      const st = have[i];
      const cell = K.el('button.sticker.emoji' + (st ? '.pop-in' : '.empty'), { text: st || '·', style: { animationDelay: i * 0.02 + 's' }, 'aria-label': st ? 'sticker' : 'empty' });
      if (st) cell.addEventListener('click', () => { K.anim(cell, 'bounce'); K.sfx.sparkle(); K.burst(cell); });
      grid.append(cell);
    }
    stage().append(K.el('div.act', null, [
      K.el('div.act-bar', null, [
        K.el('button.round-btn', { 'aria-label': 'Home', onclick: () => { K.sfx.tap(); K.home(); } }, K.emoji('🏠')),
        K.el('div.act-prompt', { text: 'My Stickers' }), K.el('div', { style: { width: '64px' } }),
      ]),
      K.el('div.panel', null, K.el('div.card', null, grid)),
    ]));
    K.say(K.s.stickers.length ? `You have ${K.s.stickers.length} stickers! Wow!` : 'Play games to win stickers!');
  };

  K.parents = function () {
    teardown();
    const seg = (key, options) => {
      const row = K.el('div.seg');
      options.forEach(([val, label]) => row.append(K.el('button' + (K.s[key] === val ? '.on' : ''), { type: 'button', text: label, onclick: () => { K.s[key] = val; K.save(); K.parents(); } })));
      return row;
    };
    stage().append(K.el('div.act.sheet', null, [
      K.el('div.act-bar', null, [
        K.el('button.round-btn', { 'aria-label': 'Back', onclick: () => K.home() }, icon('home')),
        K.el('div.act-prompt', { text: 'For grown-ups' }), K.el('div', { style: { width: '64px' } }),
      ]),
      K.el('div.panel', null, K.el('div.card.form', null, [
        (function () {
          const v = K.voiceStatus();
          const head = v.state === 'ready' ? `Recorded voice: loaded (${v.clips} lines).` : v.state === 'loading' ? 'Recorded voice: still loading…' : 'Recorded voice: NOT loaded — this device\'s built-in voice is being used instead.';
          const use = `Since opening: ${v.recorded} lines spoken with the recorded voice, ${v.device} with the device voice.`;
          return K.el('label', null, [document.createTextNode('Voice check  ·  version ' + (window.BUILD || 'dev')),
            K.el('span.hint', { style: { opacity: '1', fontWeight: '700', color: v.state === 'ready' && !v.device ? '#2F7D5B' : '#C2473D' }, text: head }),
            K.el('span.hint', { text: use + (v.problem ? ' Last problem: ' + v.problem + '.' : '') }),
            K.el('div.seg', null, [
              K.el('button', { type: 'button', text: 'Play recorded sample', onclick: () => K.say("Hello! I'm Pip. Shall we read a story?").then(() => K.parents()) }),
              K.el('button', { type: 'button', text: 'Play device sample', onclick: () => { K.hush(); try { const u = new SpeechSynthesisUtterance("Hello! I'm Pip. Shall we read a story?"); speechSynthesis.speak(u); } catch (e) { /* no device voice */ } } }),
            ])]);
        })(),
        K.el('label', null, [document.createTextNode('Players'), K.el('button.soft-btn', { type: 'button', text: 'Add or change players', onclick: () => K.who(true) }),
          K.el('span.hint', { text: 'Each child gets their own progress and age band. Nothing leaves this device.' })]),
        K.artwork && K.artwork.status() ? K.el('p', { role: 'status', text: K.artwork.status() }) : null,
        K.el('label', null, [document.createTextNode('Age band for ' + (K.s.name || 'this player')), seg('level', [[1, 'Age 3'], [2, 'Ages 4–5'], [3, 'Ages 6–8']]),
          K.el('span.hint', { text: 'Changes how much help the games give and how hard the little challenges get.' })]),
        K.el('label', null, [document.createTextNode('Talking voice'), seg('voice', [[true, 'On'], [false, 'Off']])]),
        K.el('label', null, [document.createTextNode('Voice delivery'), seg('voiceStyle', [['playful', 'Playful'], ['gentle', 'Gentle']]), K.el('span.hint', { text: 'Changes sentence pauses and the backup voice. Recorded characters keep their original voice.' })]),
        K.el('span.hint', { text: 'Pip’s recorded voice is AI generated. The app does not record your child or send their name for narration. Missing recordings use your device’s speech voice.' }),
        K.el('label', null, [document.createTextNode('Sound effects'), seg('sound', [[true, 'On'], [false, 'Off']])]),
        (function () {
          const vs = K.voices(); if (!vs.length) return null;
          const sel = K.el('select', { id: 'voice-pick' });
          vs.forEach((v, i) => sel.append(K.el('option', { value: v.name, text: v.name + (i === 0 && !K.s.voiceName ? '  (best match)' : '') })));
          sel.value = (voice && voice.name) || vs[0].name;
          sel.addEventListener('change', () => { K.s.voiceName = sel.value; K.save(); chooseVoice(); K.say("Hello! I'm Pip. Shall we read a story?"); });
          return K.el('label', { for: 'voice-pick' }, [document.createTextNode('Backup voice (only used if the recorded voice cannot load)'), sel,
            K.el('span.hint', { text: 'Pick the one that sounds most human. Names with Enhanced, Premium, Natural or Google are usually best.' })]);
        })(),
        K.el('button.soft-btn', { type: 'button', text: 'Test the voice', onclick: () => K.say('Hello! I am Pip. Can you hear me?') }),
        K.el('span.hint', { text: 'For a warmer, more human voice: on iPad or iPhone open Settings, Accessibility, Spoken Content, Voices, English, and download an Enhanced or Premium voice; on Android install or update Speech Services by Google. Then choose it above. No sound at all? Check the device is not on silent.' }),
        K.el('button.quiet', { type: 'button', text: 'Reset progress', onclick: () => { const p = K.players.current(); if (K.artwork && p) K.artwork.removePlayer(p.id); K.s.stickers = []; K.s.done = {}; K.save(); K.parents(); } }),
      ])),
    ]));
  };

  /** Small drawn icons for the grown-up screens, so they need no emoji. */
  function icon(kind) {
    const c = document.createElement('canvas'), r = Math.min(3, devicePixelRatio || 1); c.width = c.height = 40 * r; c.className = 'icon';
    const g = c.getContext('2d'); g.scale(r, r); g.translate(20, 20); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#2E2A3B'; g.lineWidth = 5;
    if (kind === 'home') {
      g.fillStyle = '#EAD9BC'; g.beginPath(); g.roundRect(-11, -3, 22, 17, 3); g.fill();
      g.fillStyle = '#E2574C'; g.beginPath(); g.moveTo(-16, -1); g.lineTo(0, -15); g.lineTo(16, -1); g.closePath(); g.fill();
      g.fillStyle = '#2F8F8A'; g.beginPath(); g.roundRect(-4, 4, 8, 10, 2); g.fill();
    } else if (kind === 'back') { g.beginPath(); g.moveTo(5, -11); g.lineTo(-7, 0); g.lineTo(5, 11); g.stroke(); }
    else { g.lineWidth = 6; g.beginPath(); g.moveTo(-11, 0); g.lineTo(11, 0); g.moveTo(0, -11); g.lineTo(0, 11); g.stroke(); }
    return c;
  }
  const TINTS = ['#F3C9B8', '#BFE0D8', '#F4DDA0', '#CFC6E6', '#BCD6EE', '#CFE3B4'];

  const AVATARS = () => (K.art ? K.art.faces : ['🦁', '🐯', '🐼', '🦊', '🐸', '🐵', '🦄', '🐙', '🦖', '🐳', '🐶', '🐱', '🐰', '🦋', '🚀', '🚂']);
  /** A player's face: drawn when the art kit is loaded, else the old emoji. */
  const avatarEl = (av, px) => (K.art ? K.art.faceCanvas(av, px) : K.emoji(av));
  function enter() { const n = (K.s.name || '').trim(); K.home(); K.sayBest([n ? `Hi ${n}! Let's play!` : '', "Hi! Let's play!"].filter(Boolean)); }
  /** "Who's playing?" — big avatar per child. manage=true shows edit pencils (grown-ups). */
  K.who = function (manage) {
    teardown();
    const list = K.players.list();
    const grid = K.el('div.tiles.players');
    list.forEach((pr, i) => {
      const tile = K.el('button.tile.player.pop-in', { 'aria-label': pr.name || 'Player', style: { '--tint': TINTS[i % TINTS.length], animationDelay: i * 0.05 + 's' },
        onclick: () => { K.sfx.pop(); if (manage) K.editPlayer(pr.id); else { K.players.use(pr.id); enter(); } } },
        [K.el('span.halo', null, avatarEl(pr.avatar, 160)), K.el('span.label', { text: pr.name || 'Player' }), manage ? K.el('span.edit', { text: 'Edit' }) : null]);
      grid.append(tile);
    });
    grid.append(K.el('button.tile.player.add.pop-in', { 'aria-label': 'Add a player', onclick: () => { K.sfx.tap(); K.editPlayer(null); } },
      [K.el('span.halo', null, icon('plus')), K.el('span.label', { text: 'New player' })]));
    stage().append(K.el('div.act.sheet', null, [
      K.el('div.act-bar', null, [
        list.length && K.players.current() ? K.el('button.round-btn', { 'aria-label': 'Home', onclick: () => { K.sfx.tap(); K.home(); } }, icon('home')) : K.el('div', { style: { width: '64px' } }),
        K.el('div.act-prompt', { text: manage ? 'Players' : "Who's playing?" }), K.el('div', { style: { width: '64px' } }),
      ]),
      K.el('div.panel', null, grid),
    ]));
    if (!manage) K.say("Who's playing?");
  };
  /** Add (id=null) or edit a child's profile. A grown-up step: it has a text field. */
  K.editPlayer = function (id) {
    teardown();
    const pr = id ? K.players.list().find((x) => x.id === id) : null;
    const draft = { name: pr ? pr.name : '', avatar: pr ? (K.art ? K.art.faceId(pr.avatar) : pr.avatar) : K.pick(AVATARS()), level: pr ? pr.level : 1 };
    const nameIn = K.el('input', { type: 'text', id: 'child-name', maxlength: '16', value: draft.name, placeholder: 'First name', autocomplete: 'off', autocapitalize: 'words' });
    nameIn.addEventListener('input', () => (draft.name = nameIn.value));
    const avRow = K.el('div.seg.faces'), lvRow = K.el('div.seg');
    const paint = () => {
      avRow.replaceChildren(...AVATARS().map((av) => K.el('button' + (draft.avatar === av ? '.on' : ''), { type: 'button', 'aria-label': 'avatar', onclick: () => { draft.avatar = av; K.sfx.pop(); paint(); } }, avatarEl(av, 112))));
      lvRow.replaceChildren(...[[1, 'Age 3'], [2, 'Ages 4–5'], [3, 'Ages 6–8']].map(([v, t]) => K.el('button' + (draft.level === v ? '.on' : ''), { type: 'button', text: t, onclick: () => { draft.level = v; paint(); } })));
    };
    paint();
    let armed = false;
    const del = pr ? K.el('button.quiet', { type: 'button', text: 'Remove this player',
      onclick: () => { if (!armed) { armed = true; del.textContent = 'Tap again to remove ' + (pr.name || 'player') + ' and their progress'; del.classList.add('danger'); return; } K.players.remove(pr.id); K.who(true); } }) : null;
    const done = () => {
      if (pr) { const was = K.players.current(); K.players.use(pr.id); Object.assign(K.s, draft, { name: draft.name.trim() }); K.save(); if (was && was.id !== pr.id) { /* stay on edited player */ } }
      else K.players.add(draft);
      enter();
    };
    stage().append(K.el('div.act.sheet', null, [
      K.el('div.act-bar', null, [
        K.el('button.round-btn', { 'aria-label': 'Back', onclick: () => (K.players.list().length ? K.who() : K.boot2()) }, icon('back')),
        K.el('div.act-prompt', { text: pr ? 'Edit player' : 'New player' }), K.el('div', { style: { width: '64px' } }),
      ]),
      K.el('div.panel', null, K.el('div.card.form', null, [
        K.el('label', { for: 'child-name' }, [document.createTextNode("Child's first name"), nameIn, K.el('span.hint', { text: 'Stays on this device. Used on the home screen and in the hello.' })]),
        K.el('label', null, [document.createTextNode('Pick a face'), avRow]),
        K.el('label', null, [document.createTextNode('Age'), lvRow, K.el('span.hint', { text: 'Sets how much help the games give. You can change it any time.' })]),
        K.el('button.big-btn', { type: 'button', text: pr ? 'Save' : "Let's play!", style: { justifySelf: 'center' }, onclick: done }),
        del,
      ])),
    ]));
  };

  K.boot = function () {
    const app = document.getElementById('app');
    K.loadVoice();
    fx = document.getElementById('fx'); fxc = fx.getContext('2d'); fxSize(); addEventListener('resize', fxSize);
    // No pinch-zoom, context menus, or rubber-banding while small hands explore.
    document.addEventListener('pointerdown', () => { if (ac) { unmuteForSilentSwitch(); audio(); } }, true); // re-arm sound after the app was backgrounded
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    const clouds = [K.el('div.cloud.emoji', { text: '☁️', style: { top: '6%', animationDelay: '-8s' } }), K.el('div.cloud.emoji', { text: '☁️', style: { top: '24%', animationDelay: '-27s', fontSize: '9vmin' } })];
    const go = () => {
      unmuteForSilentSwitch(); audio(); K.sfx.tada();
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* optional */ }
      // Automated browser tests skip the grown-up setup form.
      if (!K.players.list().length && navigator.webdriver && !window.__realSetup) K.players.add({ name: '', avatar: '🦁', level: K.s.level });
      const n = K.players.list().length;
      if (!n) K.editPlayer(null); else if (n === 1) { K.players.use(K.players.list()[0].id); enter(); } else K.who();
    };
    K.boot2 = () => { teardown(); if (K.valley) K.valley.show(stage(), makeCtx(), { intro: go }); else stage().append(startScreen()); };
    const startScreen = () => K.el('div.start', null, [
      ...clouds,
      K.el('div.float', null, K.pip(Math.min(innerWidth, innerHeight) * 0.34)),
      K.el('h1', { text: "Pip's Valley" }),
      K.el('div', { text: 'Version ' + (window.BUILD || 'dev'), style: { position: 'absolute', bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))', left: '0', right: '0', textAlign: 'center', color: '#fff', opacity: '.85', fontWeight: '700', fontSize: '14px' } }),
      K.el('button.big-btn.pulse', { text: '▶ Play', onclick: go }),
    ]);
    K.boot2();
    void app;
  };
})();
