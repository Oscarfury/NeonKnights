async (page) => {
  const read=()=>page.evaluate(()=>window.__NEON_NEXT__.snapshot());
  await page.evaluate(()=>window.__NEON_NEXT__.review('rescue'));
  await page.keyboard.down('KeyF');await page.waitForTimeout(950);
  const assisting=await read();
  if(assisting.rescueTarget!==1||assisting.rescueProgress<.5)throw new Error('Assist did not start');
  await page.screenshot({path:'output/playwright/combat-assisting.png'});
  await page.waitForTimeout(1050);await page.keyboard.up('KeyF');
  const rescued=await read();
  if(rescued.company[0].hp!==35||rescued.rescueCharges!==1)throw new Error('Companion rescue did not resolve');
  await page.screenshot({path:'output/playwright/combat-recovery.png'});
  await page.evaluate(()=>window.__NEON_NEXT__.review('commander'));
  await page.waitForTimeout(3800);
  const commander=await read();
  if(commander.player.hp!==35||commander.rescues!==1)throw new Error('Commander rescue did not resolve');
  return {scope:'Development-only controlled rescue setup, normal input and simulation thereafter',assisting,rescued,commander};
}
