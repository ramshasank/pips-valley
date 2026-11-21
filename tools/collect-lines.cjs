/* Extract authored lines in a fresh browser context, never from a player's saved data. */
const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:8000';
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) throw new Error('Serve the repository locally before collecting lines');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url); await page.waitForFunction(() => window.K && K.ensureActivity);
    const lines = await page.evaluate(async () => {
      for (const id of K.activities.map((a) => a.id)) await K.ensureActivity(id);
      const index = await fetch('voice/index.json').then((r) => r.json()), authored = new Map();
      const add = (entry) => {
        if (!entry) return;
        if (Array.isArray(entry)) return entry.forEach(add);
        const text = typeof entry === 'string' ? entry : entry.text;
        if (!text) return;
        const who = typeof entry === 'object' && entry.who;
        authored.set((who ? who + '|' : '') + K.voiceKey(text), text);
      };
      add(K.coreLines());
      for (const def of K.activities) if (def.lines) add(def.lines());
      return Object.entries(index).map(([key, ref]) => {
        const [who, plain] = key.includes('|') ? key.split('|', 2) : ['', key];
        const text = authored.get(key) || authored.get(plain) || (plain[0].toUpperCase() + plain.slice(1)).replace(/\bi\b/g, 'I') + '.';
        return { key, text, who, bundle: ref[0], reconstructed: !authored.has(key) && !authored.has(plain) };
      });
    });
    fs.writeFileSync('voice/lines.json', JSON.stringify(lines, null, 2) + '\n');
    console.log(`Prepared ${lines.length} public recording lines`);
  } finally { await browser.close(); }
})().catch(() => { console.error('Could not collect lines. Check the local server and browser installation.'); process.exitCode = 1; });
