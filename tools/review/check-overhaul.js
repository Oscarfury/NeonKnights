async (page) => {
  const report = { errors: [], checks: {}, url: page.url() };
  page.on('pageerror', (error) => report.errors.push(error.message));
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  await page.goto('http://127.0.0.1:5173/NeonKnights/');
  await page.getByRole('button', { name: 'Begin the siege' }).waitFor();
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.screenshot({ path: 'output/playwright/overhaul-menu.png' });
  await page.getByRole('button', { name: 'Begin the siege' }).click();
  await page.keyboard.press('Escape');
  const paused = await page.evaluate(() => window.__NEON__.snapshot());
  await page.waitForTimeout(300);
  const still = await page.evaluate(() => window.__NEON__.snapshot());
  assert(paused.paused && paused.time === still.time, 'Pause did not freeze gameplay');
  report.checks.pause = true;
  await page.getByRole('button', { name: 'Return to the battlements' }).click();
  await page.mouse.move(1130, 480);
  await page.mouse.down();
  await page.keyboard.down('Space');
  let previous = '';
  const start = Date.now();
  while (Date.now() - start < 45000) {
    const next = await page.evaluate(() => {
      const r = window.__NEON__.snapshot(),
        box = document.querySelector('canvas').getBoundingClientRect();
      const enemy = r.enemies
        .filter((e) => !e.dead)
        .sort((a, b) => Math.hypot(a.x - 640, a.y - 420) - Math.hypot(b.x - 640, b.y - 420))[0];
      if (!enemy) return { phase: r.phase };
      return {
        phase: r.phase,
        x: box.x + (enemy.x / 1280) * box.width,
        y: box.y + (enemy.y / 800) * box.height,
        key: ['w', 'd', 's', 'a'][enemy.sector],
      };
    });
    if (next.phase !== 'battle') break;
    if (next.key) {
      if (previous !== next.key) {
        if (previous) await page.keyboard.up(previous);
        await page.keyboard.down(next.key);
        previous = next.key;
      }
      await page.mouse.move(next.x, next.y);
    }
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  await page.keyboard.up('Space');
  if (previous) await page.keyboard.up(previous);
  const afterWave = await page.evaluate(() => window.__NEON__.snapshot());
  assert(afterWave.phase === 'shop' && afterWave.wave === 2, 'Natural first wave did not complete');
  report.checks.naturalWave = { hp: afterWave.hp, gold: afterWave.gold, seconds: afterWave.time };
  await page.screenshot({ path: 'output/playwright/overhaul-shop.png' });
  const before = afterWave.offers.map((o) => o.id);
  await page.locator('.offer').first().getByRole('button', { name: 'Acquire' }).click();
  const bought = await page.evaluate(() => window.__NEON__.snapshot());
  assert(bought.rank === 2, 'Owned weapon did not level');
  assert(
    JSON.stringify(before) === JSON.stringify(bought.offers.map((o) => o.id)),
    'Purchase changed other offers',
  );
  report.checks.stableOffers = true;
  await page.locator('.offer').nth(1).getByRole('button', { name: 'Try for 10 seconds' }).click();
  assert(
    (await page.evaluate(() => window.__NEON__.snapshot())).training,
    'Preview did not enter sandbox',
  );
  await page.getByRole('button', { name: 'Leave yard' }).click();
  assert(
    (await page.evaluate(() => window.__NEON__.snapshot())).gold === bought.gold,
    'Preview spent campaign gold',
  );
  report.checks.previewIsolation = true;
  await page.reload();
  await page.getByRole('button', { name: 'Continue saved campaign' }).click();
  const restored = await page.evaluate(() => window.__NEON__.snapshot());
  assert(
    restored.rank === 2 && restored.gold === bought.gold && restored.wave === 2,
    'Checkpoint did not restore purchase',
  );
  report.checks.saveResume = true;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'output/playwright/overhaul-shop-mobile.png' });
  report.checks.mobileShop = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
    panel: document.querySelector('.planning').getBoundingClientRect().toJSON(),
  }));
  assert(report.checks.mobileShop.document <= 390, 'Mobile shop overflows');
  await page.goto('http://127.0.0.1:5173/NeonKnights/');
  await page.getByRole('button', { name: 'Begin the siege' }).waitFor();
  await page.screenshot({ path: 'output/playwright/overhaul-menu-mobile.png' });
  report.checks.mobileMenu = await page.evaluate(() => ({
    scroll: document.getElementById('ui').scrollWidth,
    width: innerWidth,
  }));
  assert(report.checks.mobileMenu.scroll <= 390, 'Mobile menu overflows');
  await page.setViewportSize({ width: 1440, height: 960 });
  for (const [wave, kind] of [
    [5, 'dragon'],
    [10, 'golem'],
    [15, 'king'],
  ]) {
    await page.evaluate(
      async ({ wave, kind }) => {
        const { createRun } = await import('/NeonKnights/src/game/simulation/RunState.ts');
        const { beginWave, spawnEnemy } = await import(
          '/NeonKnights/src/game/simulation/WaveDirector.ts'
        );
        const r = createRun(445, 'sunlance');
        r.wave = wave;
        r.rank = 3;
        r.branch = 1;
        r.runes = { precision: 1, chain: 2 };
        r.pads = [
          { kind: 'tesla', rank: 2, cooldown: 1, built: 1 },
          { kind: 'ballista', rank: 2, cooldown: 1, built: 1 },
          { kind: 'aegis', rank: 1, cooldown: 0, built: 1 },
          { kind: 'chapel', rank: 1, cooldown: 0, built: 1 },
        ];
        beginWave(r);
        r.spawns = [];
        spawnEnemy(r, { time: 0, kind, sector: 0, offset: 0, reward: true });
        r.enemies[0].windup = 2;
        r.paused = true;
        window.__NEON_DEV__.setRun(r);
        // Hide the pause overlay solely for a controlled presentation capture.
        document.querySelector('.scrim')?.remove();
      },
      { wave, kind },
    );
    await page.waitForTimeout(200);
    await page.screenshot({ path: `output/playwright/overhaul-${kind}.png` });
  }
  assert(report.errors.length === 0, 'Browser emitted JavaScript errors');
  await page.evaluate((report) => (window.__overhaulReport = report), report);
  console.log(JSON.stringify(report));
}
