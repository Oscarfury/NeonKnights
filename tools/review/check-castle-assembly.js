// Authoring fixtures: inspect architectural progression, not campaign balance.
async (page) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const saved = await page.evaluate(() => localStorage.getItem('neon-knights:v3:castle:1'));
  const fixtures = await page.evaluate(async () => {
    const C = await import('/NeonKnights/src/next/castle/Campaign.ts');
    const s = C.createCampaign(); s.gold = 10000;
    const states = [{ name: 'empty', state: structuredClone(s) }];
    C.build(s, 'tavern', 'inner-sw');
    states.push({ name: 'first-wing', state: structuredClone(s) });
    C.build(s, 'sanctuary', 'inner-se');
    states.push({ name: 'two-wings', state: structuredClone(s) });
    C.build(s, 'sanctuary', 'inner-ne'); C.build(s, 'sanctuary', 'inner-nw');
    states.push({ name: 'tier-1', state: structuredClone(s) });
    for (const tier of [2, 3]) {
      C.upgradeWalls(s);
      for (const b of s.buildings) C.upgradeBuilding(s, b.id);
      states.push({ name: `tier-${tier}`, state: structuredClone(s) });
    }
    return states;
  });
  const result = [];
  for (const f of fixtures) {
    await page.evaluate(s => localStorage.setItem('neon-knights:v3:castle:1', JSON.stringify(s)), f.state);
    await page.reload(); await page.getByRole('button', {name: 'Build', exact: true}).waitFor();
    await page.waitForTimeout(700);
    await page.screenshot({path: `output/playwright/castle-${f.name}.png`});
    const s = await page.evaluate(() => window.__castle.snapshot());
    result.push({name:f.name, architecture:s.architecture, render:s.render});
  }
  await page.evaluate(s => localStorage.setItem('neon-knights:v3:castle:1', s), saved);
  await page.reload();
  return {result, errors};
}
