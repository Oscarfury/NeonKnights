async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await context.newPage();
  await p.goto('http://127.0.0.1:4173/NeonKnights/next/');
  await p.getByRole('button', {name:'Build', exact:true}).waitFor();
  await p.locator('[data-pick="tavern"]').tap();
  await p.locator('.platform-target:visible').first().waitFor();
  const targets = await p.locator('.platform-target:visible').evaluateAll(list => list.map(e => {
    const r=e.getBoundingClientRect(), x=r.x+r.width/2, y=r.y+r.height/2;
    return { label:e.getAttribute('aria-label'), x,y,width:r.width,height:r.height, reachable:document.elementFromPoint(x,y)?.closest('.platform-target')===e };
  }));
  await p.screenshot({path:'output/playwright/castle-wing-targets.png'});
  if (targets.length !== 4 || targets.some(t=>!t.reachable)) throw Error('A wing target is obscured');
  const placements = [];
  for (const quadrant of ['NW', 'NE', 'SE', 'SW']) {
    if (placements.length) await p.locator('.council-content [data-pick^="move:"]').tap();
    await p.getByRole('button', {name:`Place on Courtyard ${quadrant} platform`, exact:true}).tap();
    const s = await p.evaluate(()=>JSON.parse(localStorage.getItem('neon-knights:v3:castle:1')));
    if (s.buildings[0].site !== `inner-${quadrant.toLowerCase()}` || s.gold !== 240) throw Error('Wing placement or free move failed');
    placements.push(s.buildings[0].site);
  }
  await context.close();
  return { targets, allReachable:true, placements, freeMoves:true };
}
