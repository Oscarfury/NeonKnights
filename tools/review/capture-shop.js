async (page) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(() => {
    game.wave=2;
    game.gold=225;
    game.state=STATE.UPGRADE;
    planNextWave();
    buildUpgradeUI();
    showOverlay(true);
    updateHUD();
  });
  await page.waitForTimeout(1200);
  await page.screenshot({path:'docs/assets/review/live-shop-controlled.png'});
}
