// Observe an unattended fresh watch so invaders can reach the castle.
async (page) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('http://127.0.0.1:5173/NeonKnights/next/');
  await page.getByRole('button', { name: 'Build', exact: true }).waitFor();
  const saved = await page.evaluate(() => localStorage.getItem('neon-knights:v3:castle:1'));
  try {
    await page.evaluate(() => localStorage.removeItem('neon-knights:v3:castle:1'));
    await page.reload();
    await page.getByRole('button', { name: /^Begin watch/ }).click();
    let prior = new Map(), samples = 0, committedSamples = 0, wallContacts = 0;
    let maxTurnDuringStrike = 0, captured = false, last;
    for (let i = 0; i < 400; i++) {
      last = await page.evaluate(() => window.__castle.snapshot());
      if (last.phase !== 'battle') break;
      for (const e of last.enemies) {
        if (e.hp <= 0 || !e.assault) continue;
        const old = prior.get(e.id), strike = e.assault.strike;
        if (old && strike && old.assault?.strike && e.action && e.action === old.action &&
            e.actionTime > old.actionTime && JSON.stringify(strike) === JSON.stringify(old.assault.strike)) {
          committedSamples++;
          maxTurnDuringStrike = Math.max(maxTurnDuringStrike, Math.abs(Math.atan2(Math.sin(e.yaw-old.yaw),Math.cos(e.yaw-old.yaw))));
          if (!old.fired && e.fired && strike.wall !== undefined) wallContacts++;
        }
      }
      if (!captured && last.enemies.some(e => e.hp > 0 && e.assault?.strike?.wall !== undefined)) {
        await page.screenshot({ path: 'output/playwright/assault-wall-line.png' });
        captured = true;
      }
      prior = new Map(last.enemies.map(e => [e.id, e]));
      samples++;
      await page.waitForTimeout(100);
    }
    await page.screenshot({ path: 'output/playwright/assault-unattended.png' });
    if (committedSamples < 10 || wallContacts < 1 || maxTurnDuringStrike > 0.01) {
      throw Error(JSON.stringify({ committedSamples, wallContacts, maxTurnDuringStrike }));
    }
    return { fixture: 'Fresh watch, one knight, no purchases or player input', samples, committedSamples, wallContacts, maxTurnDuringStrike, phase: last.phase, time: last.time, walls: last.state.walls, stats: last.stats, errors };
  } finally {
    await page.evaluate(value => {
      if (value === null) localStorage.removeItem('neon-knights:v3:castle:1');
      else localStorage.setItem('neon-knights:v3:castle:1', value);
    }, saved);
    await page.reload();
  }
}
