/* Tick Tock Clock — learn to tell the time on a big friendly paper clock.
   The hands are dragged by their round knobs (or tap the face and the nearer hand jumps there).
   Dragging the long hand round moves the short hand along with it, like a real clock; dragging
   the short hand keeps the minutes. The clock checks itself when a hand is let go: the right time
   makes it laugh, a wrong hand gets a wobble and a hint, and after two misses a ghost hand or a
   glowing number shows where to go. The window shows the time of day.

   Level 1: hours only. "Set the clock. Three o'clock." (the short hand snaps to hours) or
            "Find the clock." from two clocks; sun or moon in the window, breakfast, lunch, play, bed.
   Level 2: o'clock and half past; set the hands, or find the clock from three.
   Level 3: quarter past, quarter to and five-minute steps: set a spoken time, set the clock to match
            a digital card, choose the card for a clock, and "what time will it be in one hour /
            half an hour?".
   Inside a session clean rounds make it a little harder and missy rounds ease it off. */
(function () {
  'use strict';
  const A = K.art, TAU = Math.PI * 2;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const hw = (h) => K.numWord(((h + 11) % 12) + 1);
  /** The spoken sentence for h (1..12) and m, for the times that have one. */
  function timeS(h, m) {
    if (m === 0) return `${cap(hw(h))} o'clock.`;
    if (m === 30) return `Half past ${hw(h)}.`;
    if (m === 15) return `Quarter past ${hw(h)}.`;
    if (m === 45) return `Quarter to ${hw(h + 1)}.`;
    return '';
  }
  const hourOf = (t) => Math.floor(t / 60) % 12 || 12;
  const sayT = (t) => timeS(hourOf(t), t % 60);
  const digital = (t) => hourOf(t) + ':' + String(t % 60).padStart(2, '0');
  const T = {
    set: 'Set the clock.', find: 'Find the clock.', match: 'Set the clock to match the card.', card: 'Which card matches the clock?',
    hour1: 'What time will it be in one hour?', half1: 'What time will it be in half an hour?',
    short: 'The short hand shows the hour.', long: 'The long hand shows the minutes.',
    mvShort: 'Now move the short hand.', mvLong: 'Now move the long hand.',
    r0: "For o'clock, the long hand points to twelve.", r30: 'For half past, the long hand points to six.',
    r15: 'For quarter past, the long hand points to three.', r45: 'For quarter to, the long hand points to nine.',
    otherClock: 'Try another clock.', otherCard: 'Try another card.',
    breakfast: 'Breakfast time!', lunch: 'Lunch time!', play: 'Play time!', bed: 'Bedtime!',
  };
  function lines() {
    const out = Object.values(T);
    for (let h = 1; h <= 12; h++) for (const m of [0, 30, 15, 45]) out.push(timeS(h, m));
    return out;
  }

  /* ---------- pictures ---------- */
  const PIC = {};
  const load = (src) => { let im = PIC[src]; if (!im) { im = PIC[src] = new Image(); im.src = 'img/' + src + '.webp'; } return im; };
  const ok = (im) => !!(im && im.complete && im.naturalWidth > 0);
  const SKY = { morning: 'bobo/bg-day', day: 'bobo/bg-day', dusk: 'toot/bg-eve', night: 'star/bg-night' };
  const RIMS = ['#2F8F8A', '#F2B33D', '#7B5AA6'];

  function hand(g, ang, len, w, tail) { g.save(); g.rotate(ang); g.beginPath(); g.moveTo(-w / 2, tail); g.lineTo(-w / 2, -len); g.arc(0, -len, w / 2, Math.PI, 0); g.lineTo(w / 2, tail); g.arc(0, tail, w / 2, 0, Math.PI); g.closePath(); g.fill(); g.restore(); }

  function icon(g, w) {
    const u = w / 300;
    g.save(); g.scale(u, u);
    g.fillStyle = '#CFE5DC'; g.fillRect(0, 0, 300, 300);
    g.fillStyle = 'rgba(255,255,255,.22)'; for (let x = 10; x < 300; x += 60) g.fillRect(x, 0, 30, 300);
    g.translate(150, 154);
    g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 14 * u; g.shadowOffsetY = 7 * u; g.fillStyle = '#E8664A'; g.beginPath(); g.arc(0, 0, 118, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#FFFBF0'; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.fill();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.fillStyle = i % 3 ? 'rgba(46,42,59,.45)' : '#2E2A3B'; g.beginPath(); g.arc(Math.sin(a) * 84, -Math.cos(a) * 84, i % 3 ? 4.5 : 7.5, 0, TAU); g.fill(); }
    g.fillStyle = '#2E2A3B'; for (const x of [-26, 26]) { g.beginPath(); g.arc(x, -34, 7, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(244,165,140,.7)'; for (const x of [-48, 48]) { g.beginPath(); g.arc(x, -12, 12, 0, TAU); g.fill(); }
    g.strokeStyle = '#2E2A3B'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(0, 22, 28, 0.5, Math.PI - 0.5); g.stroke();
    g.fillStyle = '#2F8F8A'; hand(g, 0, 70, 11, 12);
    g.fillStyle = '#E8664A'; hand(g, TAU / 3, 46, 16, 10);
    g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
    g.restore();
  }

  function start(st, ctx) {
    const L = ctx.level, W = st.W, H = st.H, land = W >= 1000, SET = 4;
    /* ---------- layout ---------- */
    const R0 = land ? 300 : K.clamp((H - 660) / 2, 170, 232);
    const cx = land ? 130 + R0 : W / 2, cy = land ? 562 : 196 + R0;
    const sx = land ? (cx + R0 + 60 + W - 50) / 2 : W / 2;                  // middle of the side panel
    const ww = land ? 330 : 228, wh = land ? 240 : 180;
    const below = cy + R0 * 1.08 + 34;                                       // portrait: where the things under the clock start
    const winY = land ? 300 : below + wh / 2 + 34;
    const infoW = land ? 330 : 236, infoH = land ? 176 : 150;
    const infoY = land ? 640 : winY;
    const cardW = land ? 300 : 232, cardH = land ? 104 : 92;
    const felt = load('faces/felt'), wood = load('build/wood');
    for (const k in SKY) load(SKY[k]);
    const sunIm = load('toot/sun'), moonIm = load('star/moon'), ballIm = load('kitchen/ball'), appleIm = load('kitchen/apple'), cheeseIm = load('kitchen/cheese');

    let R = null, won = 0, skill = 0, streak = 0, rounds = 0, lastKind = '', lastTarget = -1;
    let Tm = 0, Tc = 0, shown = 0;          // the time on the big clock (minutes, 0..719); the same unwrapped; what is drawn
    let grab = null, happy = 0, shake = 0, blink = 0, nextBlink = 2, look = { x: 0, y: 0 };
    const extras = [];                       // choice clocks and cards of the current round

    /* ---------- the room ---------- */
    const floorY = H - 64;
    const room = (g, s) => {
      if (ok(felt)) { g.save(); const pat = g.createPattern(felt, 'repeat'); if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(0.55)); g.fillStyle = pat; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#C3E3DA'; g.fillRect(0, 0, W, H); g.restore(); }
      else { g.beginPath(); g.rect(0, 0, W, H); A.paper(g, s, '#C9E2D9', { shadow: 0, light: 0.03, grain: 0.3, box: { x: 0, y: 0, w: 0, h: H } }); }
      g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = 24; x < W; x += 104) g.fillRect(x, 0, 50, floorY - 40);
      g.fillStyle = 'rgba(47,143,138,.1)'; for (let x = 24; x < W; x += 104) g.fillRect(x + 72, 0, 6, floorY - 40);
      g.beginPath(); A.rect(g, -20, floorY - 44, W + 40, 50, 6, 3, 0.6); A.paper(g, s, '#FBF3E2', { shadow: 0.6, light: 0.04, box: { x: 0, y: floorY - 44, w: 0, h: 50 } });
      if (ok(wood)) { g.save(); g.beginPath(); g.rect(0, floorY, W, H - floorY + 14); g.clip(); const pat = g.createPattern(wood, 'repeat'); if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(0.7)); g.fillStyle = pat; g.fillRect(0, floorY, W, H); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#EFA24E'; g.fillRect(0, floorY, W, H); g.restore(); }
      else { g.beginPath(); g.rect(0, floorY, W, H - floorY + 14); A.paper(g, s, '#E2A865', { shadow: 0, grain: 0.3 }); }
      A.line(g, 'rgba(120,70,30,.25)', 3, (h) => { h.moveTo(0, floorY + 2); h.lineTo(W, floorY + 2); });
    };
    const key = Math.round(W) + 'x' + Math.round(H);
    const bg = st.add({ z: 0 });
    bg.draw = (g) => { const sp = A.sprite('clockroom' + key + (ok(felt) ? 'f' : '') + (ok(wood) ? 'w' : ''), [0, 0, W, H], room); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); };

    /* ---------- clock faces ---------- */
    const faceSp = (r, rim, big) => A.sprite('clockface' + Math.round(r) + rim + (big ? 'b' : ''), [-r * 1.12, -r * 1.12 - (big ? 60 : 0), r * 2.24, r * 2.24 + (big ? 60 : 0)], (g, s) => {
      if (big) {  // it hangs from a nail
        A.line(g, '#8A5A3C', 5, (h) => { h.moveTo(-r * 0.32, -r * 1.0); h.lineTo(0, -r * 1.08 - 40); h.lineTo(r * 0.32, -r * 1.0); });
        g.beginPath(); g.arc(0, -r * 1.08 - 42, 9, 0, TAU); A.paper(g, s, '#6B4430', { shadow: 0.6 });
      }
      g.beginPath(); g.arc(0, 0, r * 1.085, 0, TAU); A.paper(g, s, rim, { shadow: 1, depth: big ? 1.7 : 1.1, light: 0.09, box: { x: -r * 1.085, y: -r * 1.085, w: r * 2.17, h: r * 2.17 } });
      g.beginPath(); g.arc(0, 0, r * 1.0, 0, TAU); g.fillStyle = A.shade(rim, -0.1); g.fill();
      g.beginPath(); g.arc(0, 0, r * 0.975, 0, TAU); A.paper(g, s, '#FFFBF0', { shadow: 0, light: 0.035, grain: 0.18, box: { x: -r, y: -r, w: r * 2, h: r * 2 } });
      g.beginPath(); g.arc(0, 0, r * 0.955, 0, TAU); g.strokeStyle = 'rgba(46,40,70,.07)'; g.lineWidth = r * 0.035; g.stroke();
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * TAU, sn = Math.sin(a), cs = -Math.cos(a);
        if (i % 5) { if (r > 150) { g.beginPath(); g.arc(sn * r * 0.9, cs * r * 0.9, r * 0.011, 0, TAU); g.fillStyle = 'rgba(46,42,59,.4)'; g.fill(); } }
        else A.line(g, i % 15 ? 'rgba(46,42,59,.6)' : A.C.tomato, r * (i % 15 ? 0.02 : 0.028), (h) => { h.moveTo(sn * r * 0.865, cs * r * 0.865); h.lineTo(sn * r * 0.925, cs * r * 0.925); });
      }
      g.fillStyle = A.C.ink; g.font = `700 ${r * 0.2}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let n = 1; n <= 12; n++) { const a = (n / 12) * TAU; g.fillText(String(n), Math.sin(a) * r * 0.71, -Math.cos(a) * r * 0.71 + r * 0.012); }
    });
    /** Both hands and the middle cap. o: {knobs, grabbed} */
    function hands(g, r, t, o) {
      o = o || {};
      const ha = (t / 720) * TAU, ma = (t / 60) * TAU, s = st.res;
      const one = (ang, len, w, col, which) => {
        g.save(); g.shadowColor = 'rgba(46,40,70,.28)'; g.shadowBlur = 7 * s; g.shadowOffsetX = 2 * s; g.shadowOffsetY = 4 * s; g.fillStyle = col; hand(g, ang, len, w, r * 0.09); g.restore();
        if (o.knobs && (which === 'h' || !o.hourOnly)) {
          const k = o.grabbed === which ? 1.25 : 1 + Math.sin(st.t * 3 + (which === 'h' ? 0 : 1.5)) * 0.04, kr = r * (which === 'h' ? 0.085 : 0.075) * k;
          g.save(); g.rotate(ang); g.translate(0, -len);
          g.save(); g.shadowColor = 'rgba(46,40,70,.3)'; g.shadowBlur = 8 * s; g.shadowOffsetY = 4 * s; g.beginPath(); g.arc(0, 0, kr, 0, TAU); g.fillStyle = col; g.fill(); g.restore();
          g.beginPath(); g.arc(0, 0, kr * 0.52, 0, TAU); g.fillStyle = '#FFFBF0'; g.fill(); g.restore();
        }
      };
      one(ma, r * 0.78, r * 0.05, A.C.teal, 'm');
      one(ha, r * 0.5, r * 0.078, A.C.tomato, 'h');
      g.beginPath(); g.arc(0, 0, r * 0.058, 0, TAU); g.fillStyle = A.C.marigold; g.fill();
      g.beginPath(); g.arc(-r * 0.014, -r * 0.014, r * 0.022, 0, TAU); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill();
    }

    /* ---------- the big clock ---------- */
    const clockN = st.add({ z: 10, x: cx, y: cy, sprite: faceSp(R0, A.C.tomato, true), hitR: R0 * 1.1, pad: 0, label: 'clock', pressable: false });
    clockN.draw = (g) => {
      const r = R0;
      if (R && !R.over) {
        // hints: a ghost of the short hand, a glow where the long hand should point, and the minute numbers
        const pulse = 0.5 + Math.sin(st.t * 6) * 0.3;
        if (R.hint.m) {
          const a = ((R.target % 60) / 60) * TAU;
          g.beginPath(); g.arc(Math.sin(a) * r * 0.895, -Math.cos(a) * r * 0.895, r * (0.07 + pulse * 0.02), 0, TAU); g.fillStyle = A.alpha('#5CC5BB', 0.4 + pulse * 0.4); g.fill();
          if (R.step === 5) {
            g.font = `700 ${r * 0.075}px ${A.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
            for (let i = 0; i < 12; i++) { const b = (i / 12) * TAU, x = Math.sin(b) * r * 1.03, y = -Math.cos(b) * r * 1.03; const hit = i * 5 === R.target % 60, q = hit ? 1.25 + pulse * 0.2 : 1; g.beginPath(); g.arc(x, y, r * 0.062 * q, 0, TAU); g.fillStyle = hit ? A.C.teal : '#FFFBF0'; g.fill(); g.fillStyle = hit ? '#FFFBF0' : A.C.teal; g.fillText(String(i * 5), x, y + 1); }
          }
        }
        if (R.hint.h) { const a = (R.target / 720) * TAU; g.beginPath(); g.arc(Math.sin(a) * r * 0.71, -Math.cos(a) * r * 0.71, r * (0.14 + pulse * 0.03), 0, TAU); g.fillStyle = A.alpha('#F4A58C', 0.3 + pulse * 0.35); g.fill(); }
        if (R.hint.h) { g.save(); g.globalAlpha *= 0.25 + pulse * 0.3; g.fillStyle = A.C.tomato; hand(g, (R.target / 720) * TAU, r * 0.5, r * 0.078, r * 0.09); g.restore(); }
      }
      // the face
      const ey = -r * 0.3, sm = happy > 0 ? 1 : 0;
      for (const k of [-1, 1]) {
        g.beginPath(); g.arc(k * r * 0.36, -r * 0.14, r * 0.07, 0, TAU); g.fillStyle = 'rgba(244,165,140,.55)'; g.fill();
        g.fillStyle = A.C.ink;
        if (blink > 0 || sm) A.line(g, A.C.ink, r * 0.022, (h) => { h.arc(k * r * 0.2, ey + (sm ? r * 0.03 : 0), r * 0.045, sm ? Math.PI * 1.1 : 0.15, sm ? Math.PI * 1.9 : Math.PI - 0.15); });
        else { g.beginPath(); g.arc(k * r * 0.2 + look.x * r * 0.015, ey + look.y * r * 0.015, r * 0.042, 0, TAU); g.fill(); g.beginPath(); g.arc(k * r * 0.2 + look.x * r * 0.015 - r * 0.012, ey + look.y * r * 0.015 - r * 0.014, r * 0.013, 0, TAU); g.fillStyle = '#fff'; g.fill(); }
      }
      if (sm) { g.beginPath(); g.arc(0, r * 0.2, r * 0.15, 0.2, Math.PI - 0.2); g.closePath(); g.fillStyle = '#7A3B3B'; g.fill(); g.beginPath(); g.ellipse(0, r * 0.31, r * 0.07, r * 0.035, 0, 0, TAU); g.fillStyle = A.C.tomato; g.fill(); }
      else A.line(g, A.C.ink, r * 0.022, (h) => { h.arc(0, r * 0.16, r * 0.13, 0.55, Math.PI - 0.55); });
      hands(g, r, shown, { knobs: R && !R.over && R.drag, hourOnly: R && R.hourOnly, grabbed: grab });
    };
    clockN.update = (dt) => {
      shown += (Tc - shown) * Math.min(1, dt * 13); if (Math.abs(Tc - shown) < 0.02) shown = Tc;
      happy = Math.max(0, happy - dt); shake = Math.max(0, shake - dt); clockN.rot = shake > 0 ? Math.sin(shake * 34) * 0.03 * Math.min(1, shake * 3) : 0;
      blink = Math.max(0, blink - dt); if ((nextBlink -= dt) < 0) { blink = 0.14; nextBlink = 2 + Math.random() * 3.5; }
      if (!grab) { look.x *= 1 - Math.min(1, dt * 4); look.y *= 1 - Math.min(1, dt * 4); }
    };
    /** Put the clock at t (0..719), turning the short way round; sweep=false jumps there. */
    function setTime(t, sweep) {
      t = ((Math.round(t) % 720) + 720) % 720;
      Tc += ((t - Tm + 1080) % 720) - 360; Tm = t;
      if (sweep === false) shown = Tc;
    }
    const tick = (lo) => K.sfx.tone(lo ? 700 : 1150, 0.035, { type: 'triangle', vol: 0.1 });
    function dragTo(p) {
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
      const ang = (Math.atan2(dx, -dy) + TAU) % TAU;
      look.x = dx / d; look.y = dy / d;
      if (grab === 'm') {
        const m = (Math.round(((ang / TAU) * 60) / R.step) * R.step) % 60;
        let dm = m - (Tm % 60); if (dm > 30) dm -= 60; if (dm <= -30) dm += 60;
        if (dm) { Tc += dm; Tm = (((Tm + dm) % 720) + 720) % 720; tick(false); }   // the short hand follows, and the hour rolls over
      } else {
        const min = Tm % 60, hr = ((Math.round((ang / TAU) * 12 - min / 60 + 0.1) % 12) + 12) % 12, t = hr * 60 + min;
        if (t !== Tm) { setTime(t); tick(true); }
      }
    }
    clockN.onDown = (p) => {
      if (!R || R.over || !R.drag) return;
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy), ang = (Math.atan2(dx, -dy) + TAU) % TAU;
      const diff = (a) => { const q = Math.abs(ang - a) % TAU; return q > Math.PI ? TAU - q : q; };
      const dh = diff(((Tm / 720) * TAU) % TAU), dm = diff((((Tm % 60) / 60) * TAU) % TAU);
      if (R.hourOnly) grab = 'h';
      else if (Math.min(dh, dm) < 0.45) grab = Math.abs(dh - dm) < 0.3 ? (d > R0 * 0.62 ? 'm' : 'h') : dh < dm ? 'h' : 'm';
      else grab = d > R0 * 0.62 ? 'm' : 'h';
      K.sfx.tap(); R.touched = true; dragTo(p);
    };
    clockN.onMove = (p) => { if (grab && R && !R.over) dragTo(p); };
    clockN.onUp = () => { if (!grab) return; const h = grab; grab = null; if (R && !R.over) release(h); };

    function release(which) {
      const r = R, hOK = Math.floor(Tm / 60) === Math.floor(r.target / 60), mOK = Tm % 60 === r.target % 60;
      if (hOK && mOK) { win(); return; }
      const tipR = which === 'h' ? 0.5 : 0.78, a = which === 'h' ? (Tm / 720) * TAU : ((Tm % 60) / 60) * TAU, tx = cx + Math.sin(a) * R0 * tipR, ty = cy - Math.cos(a) * R0 * tipR;
      if (which === 'h' ? hOK : mOK) {         // this hand is right: on to the other one
        K.sfx.ding(); ctx.fx.burst(tx, ty, { n: 8, color: which === 'h' ? A.C.tomato : A.C.teal });
        if (!r.nudged[which]) { r.nudged[which] = true; ctx.say(which === 'h' ? T.mvLong : T.mvShort); }
        return;
      }
      r.misses++; const n = ++r.miss[which];
      K.sfx.whoops(); shake = 0.5;
      if (n >= 2) r.hint[which] = true;
      if (n <= 2 || n % 2 === 0) ctx.say(which === 'h' ? T.short : ({ 0: T.r0, 30: T.r30, 15: T.r15, 45: T.r45 })[r.target % 60] || T.long);
    }

    /* ---------- the window: what time of day is it? ---------- */
    const winN = st.add({ z: 5, x: sx, y: winY, pop: 0 });
    const frameSp = A.sprite('clockwin' + ww, [-ww / 2 - 20, -wh / 2 - 20, ww + 40, wh + 40], (g, s) => { g.beginPath(); A.rect(g, -ww / 2 - 15, -wh / 2 - 15, ww + 30, wh + 30, 12, 5, 0.8); A.paper(g, s, '#FFFDF7', { shadow: 0.9, box: { x: -ww / 2, y: -wh / 2, w: ww, h: wh } }); });
    const overSp = A.sprite('clockwinover' + ww, [-ww / 2 - 70, -wh / 2 - 50, ww + 140, wh + 100], (g, s) => {
      A.line(g, '#FFFDF7', 9, (h) => { h.moveTo(0, -wh / 2); h.lineTo(0, wh / 2); h.moveTo(-ww / 2, 0); h.lineTo(ww / 2, 0); });
      for (const k of [-1, 1]) { const x0 = k * (ww / 2 + 20); g.beginPath(); g.moveTo(x0, -wh / 2 - 24); g.lineTo(x0 - k * ww * 0.25, -wh / 2 - 24); g.quadraticCurveTo(x0 - k * ww * 0.22, wh * 0.05, x0 - k * ww * 0.09, wh * 0.26); g.lineTo(x0, wh * 0.36); g.closePath(); A.paper(g, s, '#EE8A72', { shadow: 0.7, light: 0.08, box: { x: -ww / 2, y: -wh / 2, w: ww, h: wh } }); A.line(g, '#D9705C', 3, (h) => { h.moveTo(x0 - k * ww * 0.12, -wh / 2 - 14); h.quadraticCurveTo(x0 - k * ww * 0.11, 0, x0 - k * ww * 0.05, wh * 0.24); }); }
      g.beginPath(); A.rect(g, -ww / 2 - 44, -wh / 2 - 38, ww + 88, 14, 7, 8, 0.4); A.paper(g, s, '#C08A5A', { shadow: 0.5 });
      for (const k of [-1, 1]) { g.beginPath(); g.arc(k * (ww / 2 + 46), -wh / 2 - 31, 11, 0, TAU); A.paper(g, s, '#C08A5A', { shadow: 0.4 }); }
      g.beginPath(); A.rect(g, -ww / 2 - 30, wh / 2 + 10, ww + 60, 18, 6, 4, 0.5); A.paper(g, s, '#FBF3E2', { shadow: 0.8 });
    });
    const SUN = { morning: [0.27, 0.56], day: [0.7, 0.3], dusk: [0.72, 0.6], night: [0.7, 0.32] };
    winN.draw = (g) => {
      const part = (R && R.scene.part) || 'day';
      g.drawImage(frameSp.canvas, -frameSp.ox, -frameSp.oy, frameSp.w, frameSp.h);
      g.save(); g.beginPath(); g.rect(-ww / 2, -wh / 2, ww, wh); g.clip();
      const im = PIC[SKY[part]];
      if (ok(im)) { const sh = im.naturalHeight * 0.74, k = Math.max(ww / im.naturalWidth, wh / sh); g.drawImage(im, -im.naturalWidth * k / 2, -wh / 2, im.naturalWidth * k, im.naturalHeight * k); }
      else {
        const gr = g.createLinearGradient(0, -wh / 2, 0, wh / 2), c = { morning: ['#A9D3DD', '#F6E7C6'], day: ['#8FC8E8', '#D8EEF2'], dusk: ['#8E78B8', '#F6B48C'], night: ['#1E2452', '#3B4A7C'] }[part];
        gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillRect(-ww / 2, -wh / 2, ww, wh);
        g.beginPath(); g.moveTo(-ww / 2, wh * 0.3); g.quadraticCurveTo(-ww * 0.1, wh * 0.05, ww * 0.2, wh * 0.28); g.quadraticCurveTo(ww * 0.4, wh * 0.4, ww / 2, wh * 0.2); g.lineTo(ww / 2, wh / 2); g.lineTo(-ww / 2, wh / 2); g.fillStyle = part === 'night' ? '#2E5A58' : '#8CBF7A'; g.fill();
      }
      const p = SUN[part], q = ww * 0.3 * (1 + winN.pop * 0.25), x = (p[0] - 0.5) * ww, y = (p[1] - 0.5) * wh + Math.sin(st.t * 1.3) * 3, body = part === 'night' ? moonIm : sunIm;
      g.save(); g.translate(x, y); if (part !== 'night') g.rotate(Math.sin(st.t * 0.6) * 0.12);
      if (ok(body)) g.drawImage(body, -q / 2, -q / 2, q, q * body.naturalHeight / body.naturalWidth);
      else { g.beginPath(); g.arc(0, 0, q * 0.4, 0, TAU); g.fillStyle = part === 'night' ? '#F3EBCB' : '#F6C453'; g.fill(); }
      g.restore();
      if (part === 'dusk' || part === 'morning') { g.fillStyle = part === 'dusk' ? 'rgba(240,140,90,.14)' : 'rgba(255,220,150,.16)'; g.fillRect(-ww / 2, -wh / 2, ww, wh); }
      g.restore();
      g.drawImage(overSp.canvas, -overSp.ox, -overSp.oy, overSp.w, overSp.h);
    };
    winN.update = (dt) => { winN.pop = Math.max(0, winN.pop - dt * 2); };

    /* what happens at this time: a little picture on the window sill */
    const EVENT = {
      breakfast(g, s) {
        A.line(g, 'rgba(255,255,255,.9)', 4, (h) => { for (const x of [-12, 8]) { h.moveTo(x, -22); h.quadraticCurveTo(x + 9, -30, x, -38); h.quadraticCurveTo(x - 9, -46, x + 2, -52); } });
        A.line(g, '#B9B4C4', 6, (h) => { h.moveTo(14, -8); h.lineTo(40, -36); });
        g.beginPath(); g.moveTo(-40, -8); g.quadraticCurveTo(-36, 34, 0, 34); g.quadraticCurveTo(36, 34, 40, -8); g.closePath(); A.paper(g, s, '#5B8FC7', { shadow: 0.5, light: 0.08, box: { x: -40, y: -8, w: 80, h: 42 } });
        g.beginPath(); g.ellipse(0, -8, 40, 10, 0, 0, TAU); g.fillStyle = '#FBE9C6'; g.fill();
        for (const [x, y] of [[-16, -9], [4, -6], [20, -10]]) { g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fillStyle = '#E8664A'; g.fill(); }
      },
      lunch(g, s) {
        g.beginPath(); g.ellipse(0, 18, 46, 14, 0, 0, TAU); A.paper(g, s, '#FFFDF7', { shadow: 0.5 });
        if (ok(appleIm) && ok(cheeseIm)) { g.drawImage(cheeseIm, -44, -22, 54, 54 * cheeseIm.naturalHeight / cheeseIm.naturalWidth); g.drawImage(appleIm, 0, -34, 44, 44 * appleIm.naturalHeight / appleIm.naturalWidth); }
        else { g.beginPath(); A.cut(g, [[-40, 16], [-2, 16], [-2, -8], [-34, -20]], 5, 0.5, 2); g.fillStyle = '#F2C24B'; g.fill(); g.beginPath(); g.arc(22, -6, 22, 0, TAU); g.fillStyle = '#D94B3F'; g.fill(); }
      },
      play(g) {
        if (ok(ballIm)) g.drawImage(ballIm, -40, -40, 80, 80);
        else { g.beginPath(); g.arc(0, 0, 38, 0, TAU); g.fillStyle = '#FFFDF7'; g.fill(); g.save(); g.clip(); g.fillStyle = '#E8664A'; g.fillRect(-40, -40, 30, 80); g.fillStyle = '#5B8FC7'; g.fillRect(12, -40, 30, 80); g.restore(); }
      },
      bed(g, s) {
        g.beginPath(); A.rect(g, -50, -34, 20, 60, 7, 2, 0.4); A.paper(g, s, '#A8713F', { shadow: 0.5 });
        g.beginPath(); A.rect(g, -42, 2, 92, 24, 6, 3, 0.4); A.paper(g, s, '#FBF3E2', { shadow: 0.4 });
        g.beginPath(); A.rect(g, -36, -14, 34, 20, 9, 4, 0.4); A.paper(g, s, '#FFFFFF', { shadow: 0.4 });
        g.beginPath(); A.rect(g, -6, -8, 58, 30, 8, 5, 0.6); A.paper(g, s, '#7B5AA6', { shadow: 0.4, light: 0.08, box: { x: -6, y: -8, w: 58, h: 30 } });
        g.fillStyle = '#F2B33D'; for (const [x, y] of [[10, 2], [30, 10], [40, -1]]) { g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill(); }
        g.fillStyle = '#A8713F'; g.fillRect(-46, 24, 8, 12); g.fillRect(40, 24, 8, 12);
      },
    };
    const badge = winN.add(new (K.engine.Node)({ x: ww / 2 - 26, y: wh / 2 - 6, visible: false }));
    badge.draw = (g, s) => {
      const ev = R && R.scene.event; if (!ev) return;
      const sp = A.sprite('clockev' + ev + (ok(appleIm) && ok(cheeseIm) && ok(ballIm) ? 'p' : ''), [-64, -64, 128, 128], (h, s2) => { h.beginPath(); h.arc(0, 0, 60, 0, TAU); A.paper(h, s2, '#FFF6DE', { shadow: 1, light: 0.05, box: { x: -60, y: -60, w: 120, h: 120 } }); h.beginPath(); h.arc(0, 0, 52, 0, TAU); h.strokeStyle = 'rgba(242,179,61,.6)'; h.lineWidth = 4; h.setLineDash([7, 8]); h.stroke(); h.setLineDash([]); EVENT[ev](h, s2); });
      g.rotate(Math.sin(st.t * 2) * 0.05); g.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h);
    };

    /* ---------- digital cards ---------- */
    const cardSp = (w, h, text, sub) => A.sprite('clockcard' + w + 'x' + h + text + (sub || ''), [-w / 2, -h / 2, w, h], (g, s) => {
      g.beginPath(); A.rect(g, -w / 2, -h / 2, w, h, 20, 4, 0.8); A.paper(g, s, '#FFF6DE', { shadow: 1, depth: 1.2, light: 0.05, box: { x: -w / 2, y: -h / 2, w, h } });
      const sh = sub ? h * 0.52 : h - 28, sy = -h / 2 + 14;
      g.beginPath(); A.rect(g, -w / 2 + 16, sy, w - 32, sh, 14, 6, 0.4); g.fillStyle = '#33414A'; g.fill();
      g.fillStyle = '#FFE39A'; g.font = `700 ${Math.min(sh * 0.78, w * 0.3)}px ${A.FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, sy + sh / 2 + 3);
      if (sub) { g.fillStyle = A.C.tomato; g.font = `700 ${h * 0.2}px ${A.FONT_BODY}`; g.fillText(sub, 0, sy + sh + (h - 14 - sh) / 2 - 2); }
    });
    const infoN = st.add({ z: 6, x: land ? sx : W - 20 - infoW / 2, y: infoY, visible: false });

    /* ---------- stars for finished rounds ---------- */
    const stars = st.add({ z: 4, x: land ? sx : W / 2, y: land ? 858 : Math.min(floorY - 80, H - 150), pop: 0 });
    stars.draw = (g, s) => {
      for (let i = 0; i < SET; i++) {
        g.save(); g.translate((i - (SET - 1) / 2) * 66, 0); const on = i < won, k = on && i === won - 1 ? 1 + stars.pop * 0.5 : 1; g.scale(k, k); g.rotate(on ? Math.sin(st.t * 2 + i) * 0.08 : 0);
        g.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j / 10) * TAU, q = j % 2 ? 12.5 : 25; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); g.lineJoin = 'round';
        if (on) A.paper(g, s, '#F2B33D', { shadow: 0.7, light: 0.1, box: { x: -25, y: -25, w: 50, h: 50 } }); else { g.fillStyle = 'rgba(47,110,105,.18)'; g.fill(); }
        g.restore();
      }
    };
    stars.update = (dt) => { stars.pop = Math.max(0, stars.pop - dt * 2.2); };

    /* ---------- rounds ---------- */
    const rnd = (a, b) => K.randInt(a, b);
    function scene(t) {
      const h = hourOf(t), m = t % 60, e = m === 0;
      if (L === 3) return { part: 'day', event: null };
      if (h === 7 || h === 8) return Math.random() < 0.5 ? { part: 'morning', event: e ? 'breakfast' : null } : { part: 'night', event: e ? 'bed' : null };
      if (h === 12) return { part: 'day', event: e ? 'lunch' : null };
      if (h === 3 || h === 4) return { part: 'day', event: e ? 'play' : null };
      if (h >= 9 && h <= 11) return { part: 'morning', event: null };
      if (h === 6) return { part: 'dusk', event: null };
      return { part: 'day', event: null };
    }
    function makeRound(force) {
      force = force || {};
      let kind, m = 0, step = L === 1 ? 60 : L === 2 ? 30 : 5;
      if (L < 3) kind = rounds === 0 || lastKind === 'pick' ? 'set' : Math.random() < 0.42 ? 'pick' : 'set';
      else kind = rounds === 0 ? 'set' : K.pick(['set', 'digi', 'card'].concat(skill >= 1 ? ['later'] : []).filter((k) => k !== lastKind));
      if (force.kind) kind = force.kind;
      if (L === 2) m = Math.random() < [0.35, 0.5, 0.65, 0.75][skill] ? 30 : 0;
      if (L === 3) {
        const five = () => K.pick([5, 10, 20, 25, 35, 40, 50, 55]), q = () => K.pick([15, 45, 15, 45, 30, 0]);
        m = kind === 'set' ? K.pick([15, 45, 15, 45, 30]) : kind === 'digi' ? (skill === 0 ? q() : Math.random() < 0.75 ? five() : q()) : kind === 'card' ? (skill === 0 && Math.random() < 0.5 ? q() : five()) : 0;
      }
      let target, guard = 0;
      do { target = (rnd(1, 12) % 12) * 60 + m; } while (target === lastTarget && guard++ < 20);
      const S = { kind, step, hourOnly: L === 1, drag: kind !== 'pick' && kind !== 'card', misses: 0, miss: { h: 0, m: 0 }, hint: { h: false, m: false }, nudged: {}, over: false };
      if (kind === 'later') {
        const from = (rnd(1, 12) % 12) * 60 + K.pick(skill >= 2 ? [0, 30, 15, 45] : [0, 30]), add = skill >= 2 && Math.random() < 0.6 ? 30 : skill >= 1 && Math.random() < 0.3 ? 30 : 60;
        S.from = from; S.add = add; target = (from + add) % 720; S.start = from;
        S.prompt = add === 60 ? T.hour1 : T.half1; S.short = add === 60 ? 'In one hour?' : 'In half an hour?';
      }
      if (force.target != null) target = force.target;
      S.target = target; S.scene = scene(target);
      if (kind === 'set') { S.prompt = `${T.set} ${sayT(target)}`; S.short = sayT(target); }
      if (kind === 'digi') { S.prompt = T.match; S.short = 'Match the card.'; }
      if (kind === 'set' || kind === 'digi') { let h0; do { h0 = rnd(0, 11); } while (Math.min((h0 - Math.floor(target / 60) + 12) % 12, (Math.floor(target / 60) - h0 + 12) % 12) < 2); S.start = h0 * 60; }
      if (kind === 'pick') {
        const n = L === 1 && skill < 2 ? 2 : 3, th = Math.floor(target / 60), list = [target];
        const cands = K.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((d) => ((th + d) % 12) * 60 + m));
        if (L === 2) cands.unshift(th * 60 + (m ? 0 : 30));           // the same hour, the other half
        if (L === 2 && m === 0) cands.splice(1, 0, ((th + 6) % 12) * 60 + 30);
        for (const c of cands) if (list.length < n && !list.includes(c)) list.push(c);
        S.choices = K.shuffle(list); S.prompt = `${T.find} ${sayT(target)}`; S.short = sayT(target);
      }
      if (kind === 'card') {
        const th = Math.floor(target / 60), list = [target];
        const swap = (((m / 5) % 12) * 60 + (th % 12) * 5) % 720;   // what you read if you mix the hands up
        const cands = [swap].concat(K.shuffle([((th + 1) % 12) * 60 + m, ((th + 11) % 12) * 60 + m, th * 60 + (m + 30) % 60, th * 60 + (m + 5) % 60, th * 60 + (m + 55) % 60]));
        for (const c of cands) if (list.length < 3 && !list.includes(c)) list.push(c);
        S.choices = K.shuffle(list); S.prompt = T.card; S.short = 'Which card?';
      }
      return S;
    }
    function clearExtras() { for (const n of extras.splice(0)) n.remove(); }
    function option(S, t, x, y, i, n) {      // one choice: a small clock (pick) or a digital card (card)
      const isClock = S.kind === 'pick', r = S.rc;
      const node = st.add(Object.assign({ z: 12, x, y, sx: 0.01, sy: 0.01, label: (isClock ? 'clock ' : 'card ') + (i + 1), t, pulse: false, k: 1 },
        isClock ? { hitR: r * 1.1, sprite: faceSp(r, RIMS[i % 3], false) } : { hit: { x: -cardW / 2, y: -cardH / 2, w: cardW, h: cardH }, sprite: cardSp(cardW, cardH, digital(t)) }));
      node._bsx = node._bsy = 1;
      node.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back', delay: 0.12 + i * 0.12 });
      if (isClock) node.draw = (g) => { hands(g, r, node.t); if (node.pulse) { g.beginPath(); g.arc(0, 0, r * 1.14, 0, TAU); g.strokeStyle = A.alpha('#FFD66B', 0.7 + Math.sin(st.t * 7) * 0.3); g.lineWidth = 9; g.stroke(); } };
      else node.draw = (g) => { if (!node.pulse) return; g.beginPath(); A.rect(g, -cardW / 2 - 6, -cardH / 2 - 6, cardW + 12, cardH + 12, 24, 3, 0); g.strokeStyle = A.alpha('#FFD66B', 0.7 + Math.sin(st.t * 7) * 0.3); g.lineWidth = 8; g.stroke(); };
      node.update = () => { if (node.pulse && !node.tweens.length) node.sx = node.sy = 1 + Math.sin(st.t * 7) * 0.05; };
      node.onTap = () => {
        if (R !== S || S.over) return;
        if (t === S.target) { K.sfx.pop(); S.chosen = node; win(); return; }
        S.misses++; K.sfx.whoops();
        node.to({ rot: 0.1 }, { dur: 0.07 }).then(() => node.to({ rot: -0.1 }, { dur: 0.1 })).then(() => node.to({ rot: 0 }, { dur: 0.3, ease: 'elastic' }));
        if (S.misses >= 2) for (const q of extras) if (q.t === S.target) q.pulse = true;
        ctx.say(`${isClock ? sayT(t) + ' ' : ''}${isClock ? T.otherClock : T.otherCard}`);
      };
      extras.push(node);
      return node;
    }
    function newRound(force) {
      clearExtras();
      const S = makeRound(force); S.n = rounds++; lastKind = S.kind; lastTarget = S.target; R = S;
      grab = null; happy = 0;
      const pick = S.kind === 'pick', card = S.kind === 'card', info = S.kind === 'digi' || S.kind === 'later';
      clockN.visible = !pick;
      winN.visible = !(land && pick); winN.pop = 1;
      winN.x = land ? sx : info || card ? 160 : W / 2;
      winN.y = land ? (card ? 276 : info ? winY : 410) : winY;
      winN.sx = winN.sy = land ? (!card && !info ? 1.22 : 1) : info || card ? 0.88 : 1.1;
      badge.visible = !!S.scene.event; if (badge.visible) { badge.sx = badge.sy = 0.2; badge.to({ sx: 1, sy: 1 }, { dur: 0.5, ease: 'back', delay: 0.3 }); }
      infoN.visible = info;
      if (info) {
        infoN.sprite = S.kind === 'digi' ? cardSp(infoW, infoH, digital(S.target)) : cardSp(infoW, infoH, digital(S.from), S.add === 60 ? '+ 1 hour' : '+ 30 minutes');
        infoN.sx = infoN.sy = 0.3; infoN.to({ sx: 1, sy: 1 }, { dur: 0.45, ease: 'back' });
      }
      if (pick) {
        const n = S.choices.length;
        if (land) { S.rc = Math.min(n === 2 ? 215 : 190, ((W - 120) / n - 56) / 2); S.choices.forEach((t, i) => option(S, t, W / 2 + (i - (n - 1) / 2) * ((W - 120) / n), 560, i, n)); }
        else if (n === 2) { S.rc = Math.min(110, R0 * 0.52); S.choices.forEach((t, i) => option(S, t, W / 2 + (i ? 1 : -1) * 138, cy, i, n)); }
        else { S.rc = Math.min(110, R0 * 0.52); const dy = S.rc * 1.2; S.choices.forEach((t, i) => option(S, t, i < 2 ? W / 2 + (i ? 1 : -1) * 138 : W / 2, cy + (i < 2 ? -dy : dy), i, n)); }
      } else if (card) {
        setTime(S.target);
        S.choices.forEach((t, i) => option(S, t, land ? sx : W - 20 - cardW / 2, (land ? 500 : winY - cardH - 14) + i * (cardH + 14), i, 3));
      } else setTime(S.start);
      K.sfx.whoosh();
      ctx.prompt(S.prompt, { show: W < 700 ? S.short : S.prompt });
    }
    async function win() {
      const r = R; r.over = true; grab = null;
      happy = 2.6; K.sfx.sparkle(); K.sfx.ding();
      const at = r.chosen || clockN, rr = r.chosen ? (r.rc || 80) : R0;
      ctx.fx.burst(at.x, at.y, { n: 22 }); ctx.fx.burst(at.x - rr * 0.7, at.y - rr * 0.6, { n: 8 }); ctx.fx.burst(at.x + rr * 0.7, at.y - rr * 0.6, { n: 8 });
      for (const q of extras) { q.pulse = false; if (q !== r.chosen) q.to({ alpha: 0.35 }, { dur: 0.3 }); }
      if (r.chosen) r.chosen.to({ sx: 1.12, sy: 1.12 }, { dur: 0.14, ease: 'out' }).then(() => r.chosen.to({ sx: 1, sy: 1 }, { dur: 0.5, ease: 'elastic' }));
      else clockN.to({ sx: 1.05, sy: 0.95 }, { dur: 0.1, ease: 'out' }).then(() => clockN.to({ sx: 0.97, sy: 1.04 }, { dur: 0.12 })).then(() => clockN.to({ sx: 1, sy: 1 }, { dur: 0.5, ease: 'elastic' }));
      badge.to({ sx: 1.25, sy: 1.25 }, { dur: 0.15, ease: 'out' }).then(() => badge.to({ sx: 1, sy: 1 }, { dur: 0.5, ease: 'elastic' }));
      const ev = r.scene.event, line = `${sayT(r.target)} ${ev ? T[ev] : ''}`.trim();
      await Promise.all([line ? ctx.say(line) : ctx.wait(300), ctx.wait(line ? 1900 : 1200)]);
      won++; stars.pop = 1; K.sfx.ding();
      if (r.misses === 0) { if (++streak >= 2) { skill = Math.min(3, skill + 1); streak = 0; } } else { streak = 0; if (r.misses >= 3) skill = Math.max(0, skill - 1); }
      await ctx.wait(700);
      for (const q of extras) q.to({ sx: 0.01, sy: 0.01 }, { dur: 0.25, ease: 'inOut' });
      await ctx.wait(260);
      if (r.kind === 'pick') {   // the big clock comes back, showing the time that was found
        clearExtras(); setTime(r.target, false); clockN.visible = winN.visible = true; clockN.sx = clockN.sy = 0.6; clockN.to({ sx: 1, sy: 1 }, { dur: 0.4, ease: 'back' });
      }
      if (won >= SET) { await ctx.celebrate(); won = 0; }
      newRound();
    }

    K._clock = {   // for browser tests
      get R() { return R; }, get T() { return Tm; }, get won() { return won; }, get skill() { return skill; }, set skill(v) { skill = v; },
      set: (t) => setTime(t), release, extras, next: (force) => newRound(force), geom: { cx, cy, R: R0 }, unit: () => st.unit,
    };
    ctx.onExit(() => { K._clock = null; });
    ctx.after(350, () => newRound());
  }

  K.game({ id: 'clock', title: 'Tick Tock Clock', voice: 'clock', group: 'arcade', age: 7, order: 32, icon, start, lines, resize: () => K.go('clock') });
})();
