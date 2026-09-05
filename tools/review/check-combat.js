async (page) => {
  await page.setViewportSize({width:1600,height:1000});
  await page.bringToFront();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.waitForFunction(()=>window.__NEON_NEXT__);
  const read=()=>page.evaluate(()=>window.__NEON_NEXT__.snapshot());
  if((await read()).mode!=='inspection')await page.getByRole('button',{name:'← The armory'}).click();
  const poses={};
  for(const clip of ['dodge_forward','dodge_backward','dodge_left','dodge_right','weapon_stow','lance_release','interact','recover']) {
    await page.getByRole('combobox',{name:'ANIMATION'}).selectOption(clip);
    await page.waitForTimeout(240);
    poses[clip]=(await read()).hero;
    if(clip==='weapon_stow'||clip==='interact')await page.screenshot({path:`output/playwright/combat-${clip}.png`});
  }
  await page.getByRole('button',{name:'Enter the courtyard ↗'}).click();
  await page.mouse.move(800,420);
  await page.mouse.down({button:'right'});await page.waitForTimeout(450);
  await page.keyboard.press('Space');await page.mouse.up({button:'right'});await page.waitForTimeout(600);
  if((await read()).shots!==0)throw new Error('Cancelled draw released a shot');
  await page.keyboard.press('KeyQ');await page.waitForTimeout(100);
  if((await read()).player.action!=='weapon_stow')throw new Error('Missing stow transition');
  await page.waitForTimeout(600);
  if((await read()).player.weapon!=='sunlance'||(await read()).player.action!=='weapon_equip')throw new Error('Missing equip transition');
  await page.waitForTimeout(650);
  await page.getByRole('button',{name:'Start ward trial'}).click();
  const patterns=new Set();
  for(let n=0;n<60;n++) {
    await page.waitForTimeout(220);
    const s=await read();s.hazards.forEach(h=>patterns.add(h.label));
    if(s.hazards.some(h=>h.shape.kind==='sweep'&&h.age>h.warning&&h.age<h.warning+h.active))await page.screenshot({path:'output/playwright/combat-sweep.png'});
    if(s.hazards.some(h=>h.cadence&&h.age>h.warning&&h.age<h.warning+h.active))await page.screenshot({path:'output/playwright/combat-fire.png'});
    if(patterns.size===3&&s.hazards.some(h=>h.cadence&&h.age>h.warning+.55))break;
  }
  if(patterns.size!==3)throw new Error('All three ward patterns did not stage');
  await page.getByRole('button',{name:'End ward trial'}).click();
  const result={errors,patterns:[...patterns],poses,combat:await read()};
  if(errors.length)throw new Error(JSON.stringify(errors));
  return result;
}
