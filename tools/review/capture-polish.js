async (page) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const checkpoint = await page.evaluate(() => JSON.parse(localStorage.getItem('neon-test:polish-results'))[1].checkpoint);
  await page.evaluate(s => localStorage.setItem('neon-knights:v3:castle:1', JSON.stringify(s)), checkpoint);
  await page.reload(); await page.getByRole('button', { name: 'Build', exact: true }).waitFor();
  await page.getByRole('button', { name: /^Begin watch/ }).click();
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const s = await page.evaluate(() => window.__castle.snapshot());
    if (s.phase !== 'battle') break;
    const t = s.dangers.find((t) => t.kind !== 'hex');
    if (t) {
      const key = `${t.kind}-${t.age < t.windup ? 'warning' : 'impact'}`;
      if (!seen.has(key) && (t.age < t.windup ? t.age > t.windup * 0.6 : t.age > t.windup + t.duration * 0.3)) {
        seen.add(key);
        await page.screenshot({ path: `output/playwright/polish-final-${key}.png` });
      }
    }
    if (seen.size === 6) break;
    await page.waitForTimeout(85);
  }
  const frames = await page.evaluate(() => new Promise(resolve => {
    const times = []; let previous = performance.now();
    const tick = now => { times.push(now - previous); previous = now; if (times.length === 120) resolve(times.sort((a,b)=>a-b)); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
  const s = await page.evaluate(() => window.__castle.snapshot());
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  return { captured: [...seen], medianFrameMs: frames[60], p95FrameMs: frames[114], render: s.render, walls: s.state.walls, errors };
}
