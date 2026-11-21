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
  await page.goto('/dist/playhouse.html'); await page.waitForFunction(() => window.K && K.valley);
  await page.evaluate(() => { K.s.voice = false; K.players.add({ name: 'Test', level: 1 }); K.go('paint'); });
  await page.waitForFunction(() => K._paint); await page.waitForTimeout(200);
  expect(await page.evaluate(() => K.activities.length)).toBe(41);
  expect(failures).toEqual([]);
});
