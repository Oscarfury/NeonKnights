async (page) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('https://oscarfury.github.io/NeonKnights/');
  await page.waitForTimeout(1200);
  const report = { url: page.url(), errors: [] };
  page.on('pageerror', error => report.errors.push(error.message));
  report.initial = await page.evaluate(() => ({
    title: document.title,
    viewport: {width: innerWidth, height: innerHeight},
    canvas: {width: canvas.width, height: canvas.height, rect: canvas.getBoundingClientRect().toJSON()},
    controls: handleControls.toString(),
    position: updatePlayerPos.toString(),
    reward: onEnemyDeath.toString(),
  }));
  // The constantly animated button does not pass Playwright's stability check.
  await page.getByRole('button', {name: '⚔️ Battle!', exact: true}).click({force: true});
  for (let i = 0; i < 80; i++) {
    const target = await page.evaluate(() => {
      if (game.state !== STATE.PLAY) return null;
      const enemies = game.enemies.filter(e => !e.dead);
      enemies.sort((a,b) => Math.hypot(a.x-CENTER.x,a.y-CENTER.y)-Math.hypot(b.x-CENTER.x,b.y-CENTER.y));
      const e = enemies[0];
      if (!e) return null;
      const r = canvas.getBoundingClientRect();
      return {x:r.left+e.x*r.width/canvas.width,y:r.top+e.y*r.height/canvas.height};
    });
    if (target) { await page.mouse.move(target.x,target.y); await page.mouse.down(); }
    await page.waitForTimeout(150);
    if (i === 20) await page.screenshot({path:'output/playwright/live-combat-desktop.png'});
    const state = await page.evaluate(() => game.state);
    if (state !== 'PLAY') break;
  }
  await page.mouse.up();
  report.playResult = await page.evaluate(() => ({state:game.state,wave:game.wave,gold:game.gold,hp:game.castleHp,enemies:game.enemies.length}));
  if (report.playResult.state === 'UPGRADE') await page.waitForTimeout(800);
  await page.screenshot({path:'output/playwright/live-after-first-wave.png'});
  if (report.playResult.state === 'PLAY') await page.keyboard.press('Escape');
  report.probes = await page.evaluate(() => {
    game.state = STATE.PAUSE;
    const waves = [1,5,10,20].map(w => {game.wave=w; planNextWave(); return {wave:w,types:game.nextWave.map(s=>s.type),bosses:game.nextWave.filter(s=>['dragon','golem'].includes(s.type)).map(s=>({type:s.type,hp:Math.round(ENEMY[s.type].hp*s.hpScale*DIFFICULTY.ENEMY_HP_MULT)}))};});
    game.wave=2;
    planNextWave();
    game.gold=1000;
    game.upgrades=defaultUpgrades();
    game.upgrades.sniper=1;
    game.dtScale=1;
    game.enemies=[];
    buildUpgradeUI();
    const sniperOfferedAgain=[...document.querySelectorAll('#ovBody .title')].some(el=>el.textContent==='Sniper Shot');
    const beamDamage = power => {game.sniperLines=[]; fire({x:CENTER.x,y:CENTER.y},power); return game.sniperLines.map(line=>line.damage);};
    const normalSniper=beamDamage(0), chargedSniper=beamDamage(1);
    game.sniperLines=[];
    const turretProjectile=makeProjectile(CENTER.x,CENTER.y,0,{});
    const turretFactory={returnedProjectile:!!turretProjectile,createdSniperLines:game.sniperLines.length};
    game.upgrades=defaultUpgrades();
    game.state=STATE.UPGRADE;
    buildUpgradeUI();
    showOverlay(true);
    return {waves,sniperOfferedAgain,normalSniper,chargedSniper,turretFactory,rapidIntervals:[0,1,2,3,7,8].map(level=>({level,interval:Math.max(.08,game.player.rate-.04*level)})),upgradeCount:upgradeDefs().length};
  });
  await page.waitForTimeout(2300);
  await page.screenshot({path:'output/playwright/live-shop-probe.png'});
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await page.waitForTimeout(1200);
  await page.screenshot({path:'output/playwright/live-menu-mobile.png'});
  report.mobile=await page.evaluate(()=>({viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,canvas:canvas.getBoundingClientRect().toJSON(),hud:document.querySelector('.hud').getBoundingClientRect().toJSON(),modal:document.querySelector('.modal').getBoundingClientRect().toJSON()}));
  await page.evaluate(result => { window.__reviewReport=result; },report);
  return report;
}
