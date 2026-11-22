const { test, expect } = require('@playwright/test');

async function ready(page) {
  await page.goto('/'); await page.waitForFunction(() => window.K && K.valley);
  await page.evaluate(() => { K.s.voice = false; K.players.add({ name: 'Test player', level: 1 }); K.home(); });
}
async function open(page, id) {
  await page.evaluate((id) => K.go(id), id);
  await expect(page.locator('.load-card')).toHaveCount(0);
}

async function hasRedStroke(page) {
  return page.evaluate(() => {
    if (!K._paint) return false;
    const cv = document.querySelector('.stage-canvas'), rect = cv.getBoundingClientRect();
    const unit = Math.min(rect.height / 1000, rect.width / 560);
    const point = K._paint.toPage(180, 180);
    const pixel = cv.getContext('2d').getImageData(Math.round(point.x * unit * cv.width / rect.width), Math.round(point.y * unit * cv.height / rect.height), 1, 1).data;
    return pixel[0] > 170 && pixel[1] < 130 && pixel[2] < 130;
  });
}

test('boot defers game code and all 41 activities can open without runtime errors', async ({ page }) => {
  const errors = [], loaded = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('net::')) errors.push(m.text()); });
  page.on('request', (r) => { if (/\/games\/.+\.js/.test(r.url())) loaded.push(r.url()); });
  await ready(page); expect(loaded).toHaveLength(0);
  const ids = await page.evaluate(() => K.activities.map((a) => a.id)); expect(ids).toHaveLength(41);
  for (const id of ids) { await open(page, id); await page.waitForTimeout(100); }
  expect(errors).toEqual([]);
});

test('the valley loads one letter preview and defers activity artwork', async ({ page }) => {
  const letters = [], rooms = [];
  page.on('request', (r) => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith('/img/letters/')) letters.push(path);
    if (/^\/art\/(kitchen|build|band|town|story|pictures)\.js$/.test(path)) rooms.push(path);
  });
  await ready(page); await page.waitForTimeout(150);
  expect(rooms).toEqual([]); expect(letters).toEqual(['/img/letters/a.webp']);
  await open(page, 'kitchen'); expect(rooms).toContain('/art/kitchen.js');
});

test('freehand painting survives resize, reload and player switching', async ({ page }) => {
  await ready(page); await open(page, 'paint');
  await page.getByRole('button', { name: 'pictures', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'white paper', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const points = await page.evaluate(() => {
    const p = K._paint.toPage(120, 180), q = K._paint.toPage(250, 180);
    const cv = document.querySelector('.stage-canvas'), rect = cv.getBoundingClientRect();
    const scale = rect.width / (Math.max(560, rect.width / (rect.height / 1000)));
    return [p, q].map((v) => ({ x: rect.left + v.x * scale, y: rect.top + v.y * scale }));
  });
  await page.mouse.move(points[0].x, points[0].y); await page.mouse.down();
  await page.mouse.move(points[1].x, points[1].y, { steps: 8 }); await page.mouse.up();
  const stored = await page.evaluate(async () => {
    const id = K.players.current().id; const value = await K.artwork.get(id + ':blank');
    return { id, value };
  });
  expect(stored.value).toMatch(/^data:image\/png/);
  await expect.poll(() => hasRedStroke(page)).toBeTruthy();
  await page.setViewportSize({ width: 430, height: 900 }); await page.waitForTimeout(500);
  expect(await page.evaluate(() => K._paint.pic)).toBeNull();
  await expect.poll(() => hasRedStroke(page)).toBeTruthy();
  await page.reload(); await page.waitForFunction(() => window.K && K.valley);
  await open(page, 'paint');
  expect(await page.evaluate(async (id) => K.artwork.get(id + ':blank'), stored.id)).toBe(stored.value);
  await expect.poll(() => hasRedStroke(page)).toBeTruthy();
  await page.evaluate(() => { K.home(); K.players.add({ name: 'Another player', level: 1 }); });
  expect(await page.evaluate(() => K.artwork.get(K.players.current().id + ':blank'))).toBeNull();
});

test('failed game downloads offer retry and successful retry opens the game', async ({ page }) => {
  await ready(page);
  await page.route('**/games/clock.js*', (route) => route.abort());
  await page.evaluate(() => K.go('clock'));
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await page.unroute('**/games/clock.js*');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('.load-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Say it again', exact: true })).toBeAttached();
});

test('returning home while code loads cancels the pending navigation', async ({ page }) => {
  await ready(page);
  let resume;
  await page.route('**/games/clock.js*', async (route) => { await new Promise((resolve) => { resume = resolve; }); await route.continue(); });
  await page.evaluate(() => { K.go('clock'); });
  await expect.poll(() => !!resume).toBeTruthy();
  await page.evaluate(() => K.home()); resume();
  await page.waitForFunction(() => !K.activities.find((a) => a.id === 'clock').lazy);
  await expect(page.locator('button[aria-label="Game Room"]')).toBeAttached();
  await expect(page.getByRole('button', { name: 'Say it again', exact: true })).toHaveCount(0);
});

test('recorded speech plays without falling back to the device voice', async ({ page }) => {
  await ready(page);
  await page.locator('button[aria-label="Pip"]').focus(); await page.keyboard.press('Enter');
  const status = await page.evaluate(async () => {
    K.hush(); K.s.voice = true; await K.loadVoice();
    const before = K.voiceStatus(); await K.say('Great job!');
    const after = K.voiceStatus(); return { recorded: after.recorded - before.recorded, device: after.device - before.device, speaking: K.isSpeaking() };
  });
  expect(status).toEqual({ recorded: 1, device: 0, speaking: false });
});

test('portable distribution loads its artwork and recordings from adjacent folders', async ({ page }) => {
  const failures = [];
  page.on('response', (r) => { if (r.status() >= 400) failures.push(new URL(r.url()).pathname); });
  page.on('pageerror', (e) => failures.push(e.message));
  await page.goto('/dist/'); await page.waitForFunction(() => window.K && K.valley);
  await expect(page).toHaveTitle("Pip's Valley");
  const alias = await page.request.get('/dist/playhouse.html');
  expect(await alias.text()).toBe(await (await page.request.get('/dist/index.html')).text());
  await page.evaluate(() => { K.s.voice = false; K.players.add({ name: 'Test', level: 1 }); K.go('paint'); });
  await page.waitForFunction(() => K._paint); await page.waitForTimeout(200);
  expect(await page.evaluate(() => K.activities.length)).toBe(41);
  expect(failures).toEqual([]);
});

test('deleting paintings clears stored and cached copies even when a read is already pending', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const id = K.players.current().id;
    await K.artwork.put(id + ':blank', 'old painting');
    for (let i = 0; i < 21; i++) await K.artwork.put('other:' + i, 'another painting');
    const read = K.artwork.get(id + ':blank');
    const deletion = K.artwork.removePlayer(id);
    await Promise.all([read, deletion]);
    return { id, removed: await K.artwork.get(id + ':blank'), kept: await K.artwork.get('other:0') };
  });
  expect(result.removed).toBeNull(); expect(result.kept).toBe('another painting');
  await page.reload(); await page.waitForFunction(() => window.K && K.valley);
  expect(await page.evaluate((id) => K.artwork.get(id + ':blank'), result.id)).toBeNull();
});

test('speech waits for an in-flight recording index and still uses the recording', async ({ page }) => {
  let release;
  await page.route('**/voice/index.json*', async (route) => { await new Promise((resolve) => { release = resolve; }); await route.continue(); });
  await page.goto('/'); await page.waitForFunction(() => window.K && K.valley);
  await expect.poll(() => !!release).toBeTruthy();
  await page.locator('button[aria-label="Play"]').focus(); await page.keyboard.press('Enter');
  await page.evaluate(() => { K.hush(); window.pendingSpeech = K.say('Great job!'); });
  release();
  const status = await page.evaluate(async () => { await window.pendingSpeech; return K.voiceStatus(); });
  expect(status.recorded).toBe(1); expect(status.device).toBe(0);
});

test('voice index download can recover after a temporary failure', async ({ page }) => {
  await page.route('**/voice/index.json*', (route) => route.abort());
  await ready(page);
  await expect.poll(() => page.evaluate(() => K.voiceStatus().state)).toBe('missing');
  await page.unroute('**/voice/index.json*');
  await page.evaluate(() => K.loadVoice());
  expect(await page.evaluate(() => K.voiceStatus().state)).toBe('ready');
});

test('parent audio controls persist and effects soften during narration', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    window.__gains = [];
    window.AudioContext = class extends Original {
      createGain() { const gain = super.createGain(); window.__gains.push(gain); return gain; }
    };
  });
  await ready(page); await page.evaluate(() => K.parents());
  const input = page.getByLabel('Voice volume', { exact: true });
  await input.press('Home'); for (let i = 0; i < 8; i++) await input.press('ArrowRight');
  expect(await page.evaluate(() => K.s.voiceVolume)).toBe(0.4);
  const effects = page.getByLabel('Play sounds volume', { exact: true });
  await effects.press('End'); for (let i = 0; i < 4; i++) await effects.press('ArrowLeft');
  await page.evaluate(() => { K.sfx.tone(440, 3, { vol: 0.01 }); K.s.voice = true; K.say('Hello!'); });
  await page.waitForTimeout(250);
  const quiet = await page.evaluate(() => window.__gains[1].gain.value);
  expect(quiet).toBeLessThan(0.4);
  await page.evaluate(() => K.hush()); await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__gains[1].gain.value)).toBeGreaterThan(0.7);
  await page.reload(); await page.waitForFunction(() => window.K && K.valley);
  expect(await page.evaluate(() => ({ voice: K.s.voiceVolume, effects: K.s.effectsVolume }))).toEqual({ voice: 0.4, effects: 0.8 });
});

test('story player supports keyboard pause, replay and returning focus to its card', async ({ page }) => {
  await ready(page); await open(page, 'films');
  const first = page.locator('.film-card').first();
  await first.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
  await expect(page.locator('.films-shelf')).toHaveJSProperty('inert', true);
  await expect(page.getByRole('button', { name: /(?:Pause|Play) the story/ })).toBeFocused();
  await expect.poll(() => page.locator('video').evaluate((v) => !v.paused)).toBeTruthy();
  await page.getByRole('button', { name: 'Pause the story', exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'Play the story', exact: true })).toBeFocused();
  expect(await page.locator('video').evaluate((v) => v.paused)).toBeTruthy();
  await page.getByRole('button', { name: 'Replay the story', exact: true }).press('Enter');
  await expect.poll(() => page.locator('video').evaluate((v) => !v.paused)).toBeTruthy();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(first).toBeFocused(); await expect(page.locator('.films-shelf')).toHaveJSProperty('inert', false);
});

test('story shelf recovers after a failed catalog request', async ({ page }) => {
  await ready(page); await page.route('**/films/index.json', (route) => route.abort());
  await open(page, 'films'); await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await page.unroute('**/films/index.json'); await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('.film-card')).toHaveCount(22);
});

test('a failed story film offers a visible retry without losing the close control', async ({ page }) => {
  await ready(page); await open(page, 'films');
  await page.route('**/films/*.mp4', (route) => route.abort());
  await page.locator('.film-card').first().click();
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close the story', exact: true })).toBeVisible();
  await page.unroute('**/films/*.mp4'); await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect.poll(() => page.locator('video').evaluate((v) => !v.paused && v.readyState >= 2)).toBeTruthy();
});
