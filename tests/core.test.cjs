const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function app() {
  const storage = new Map(), timers = new Map(), spoken = [];
  let timer = 0;
  const synth = { getVoices: () => [], addEventListener() {}, cancel() {}, speak(u) { spoken.push(u); } };
  const env = { window: { speechSynthesis: synth }, console, Date: { now: () => 1000 },
    SpeechSynthesisUtterance: function (text) { this.text = text; },
    setTimeout: (fn, ms) => { timers.set(++timer, { fn, ms }); return timer; }, clearTimeout: (id) => timers.delete(id),
    localStorage: { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) } };
  vm.createContext(env); vm.runInContext(fs.readFileSync('js/core.js', 'utf8'), env);
  return { K: env.window.K, spoken, timers, run(ms) { for (const [id, t] of [...timers]) if (t.ms === ms) { timers.delete(id); t.fn(); } } };
}

test('profiles remain distinct even when created in the same millisecond', () => {
  const { K } = app();
  const a = K.players.add({ name: 'First', level: 1 }); K.s.done.puzzle = 9; K.save();
  const b = K.players.add({ name: 'Second', level: 3 });
  assert.notEqual(a.id, b.id); assert.equal(K.s.done.puzzle, undefined);
  K.players.use(a.id); assert.equal(K.s.done.puzzle, 9); assert.equal(K.level(), 1);
});

test('cancelled device speech cannot start after leaving an activity', () => {
  const a = app(); a.K.say('Pick a game.'); a.K.hush(); a.run(40);
  assert.equal(a.spoken.length, 0); assert.equal(a.K.isSpeaking(), false);
});

test('idle reminders never interrupt a line already being spoken', () => {
  const a = app(); a.K.say('A little star fell from the sky.'); a.K.say('Try again!', { idle: true }); a.run(40);
  assert.equal(a.spoken.length, 1); assert.equal(a.spoken[0].text, 'A little star fell from the sky.');
});

test('switching voice off silences already scheduled speech', () => {
  const a = app(); a.K.say('Hello!'); a.K.s.voice = false; a.K.say('Hello again!'); a.run(40);
  assert.equal(a.spoken.length, 0);
});

test('gentle delivery slows down and explicit caller settings are preserved', () => {
  const { K } = app(); const lively = K.speechStyle('You did it!');
  K.s.voiceStyle = 'gentle'; const gentle = K.speechStyle('You did it!');
  assert.ok(gentle.rate < lively.rate); assert.ok(gentle.gap > lively.gap);
  assert.equal(K.speechStyle('Hello', { rate: 0.8, pitch: 1, gap: 0 }).gap, 0);
});

test('missing recordings use the generic greeting rather than speaking a saved name', () => {
  const a = app(); a.K.sayBest(['Hi Example! Let’s play!', 'Hi! Let’s play!']); a.run(40);
  assert.equal(a.spoken[0].text, 'Hi! Let’s play!');
});

test('voice and effects levels are bounded and persist separately from player profiles', () => {
  const a = app(); a.K.players.add({ name: 'First' });
  a.K.setVolume('voiceVolume', 0.4); a.K.setVolume('effectsVolume', 2);
  a.K.players.add({ name: 'Second' });
  assert.equal(a.K.s.voiceVolume, 0.4); assert.equal(a.K.s.effectsVolume, 1);
  a.K.setVolume('voiceVolume', 'invalid'); assert.equal(a.K.s.voiceVolume, 0.4);
  a.K.say('Hello!'); a.run(40); assert.equal(a.spoken[0].volume, 0.4);
});

test('edge silence is shortened without removing a pause inside the spoken line', () => {
  const { K } = app();
  const samples = new Float32Array(1000);
  samples.fill(0.1, 120, 400); samples.fill(0.1, 600, 820);
  const result = K.voiceWindow({ sampleRate: 1000, length: 1000, duration: 1, numberOfChannels: 1, getChannelData: () => samples });
  assert.ok(result.offset >= 0.07 && result.offset <= 0.09);
  assert.ok(result.offset + result.duration >= 0.86);
  assert.ok(result.offset + result.duration < 0.9);
  assert.ok(result.offset < 0.4 && result.offset + result.duration > 0.6);
});

test('a quiet beginning in either stereo channel is preserved', () => {
  const { K } = app();
  const left = new Float32Array(1000), right = new Float32Array(1000);
  right.fill(0.003, 0, 900); left.fill(0.1, 300, 900);
  const result = K.voiceWindow({ sampleRate: 1000, length: 1000, duration: 1, numberOfChannels: 2, getChannelData: (c) => c ? right : left });
  assert.equal(result.offset, 0);
});
