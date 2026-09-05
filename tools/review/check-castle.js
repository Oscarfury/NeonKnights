async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.waitForFunction(()=>window.__castle);
  const read=()=>page.evaluate(()=>window.__castle.snapshot());
  let state=(await read()).state;
  if(state.encounter!==0)throw new Error('This flow requires a first-watch checkpoint.');
  await page.getByRole('button',{name:'Castle',exact:true}).click();
  if(state.wallTier===1)await page.getByRole('button',{name:/Raise tier II walls/}).click();
  for(const site of ['east-court','west-watch']){
    await page.getByLabel('WALL PLATFORM',{exact:true}).selectOption(site);
    if(!(await read()).state.buildings.some(b=>b.site===site))await page.getByRole('button',{name:'Build I 100 ♜',exact:true}).click();
  }
  await page.getByRole('button',{name:'Armory',exact:true}).click();
  if(!(await read()).state.bought.includes(0))await page.getByRole('button',{name:'Purchase · 85 ♜',exact:true}).click();
  const offers=(await read()).state.offers;
  if(offers.length!==6||offers[0]!=='ward-seal')throw new Error('Purchase replaced other stock');
  await page.getByRole('button',{name:'Company',exact:true}).click();
  const id=(await read()).state.inventory.find(i=>i.kind==='ward-seal').id;
  await page.locator('#gear-aldren').selectOption(String(id));
  await page.getByRole('button',{name:'Inspect knight',exact:true}).first().click();
  await page.screenshot({path:'output/playwright/castle-warden-inspect.png'});
  await page.getByRole('button',{name:'Play attack',exact:true}).click();
  await page.waitForTimeout(650);await page.screenshot({path:'output/playwright/castle-warden-attack.png'});
  await page.getByRole('button',{name:'Return to the walls',exact:true}).click();
  await page.getByRole('button',{name:'Armory',exact:true}).click();
  await page.getByRole('button',{name:'Inspect the King',exact:true}).click();
  await page.screenshot({path:'output/playwright/castle-king-final.png'});
  await page.getByRole('button',{name:'Return to the walls',exact:true}).click();
  const checkpoint=(await read()).state;
  await page.reload();await page.waitForFunction(()=>window.__castle);
  if(JSON.stringify((await read()).state)!==JSON.stringify(checkpoint))throw new Error('Council reload changed saved state');
  await page.screenshot({path:'output/playwright/castle-tier2-ready.png'});
  await page.getByRole('button',{name:'Sound the horns ↗',exact:true}).click();
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(5200);await page.keyboard.up('KeyD');
  const deployed=await read();
  if(!deployed.knights.every(k=>k.deployed))throw new Error('Company did not leave both gates');
  if(deployed.king.y!==3.28||Math.max(Math.abs(deployed.king.x),Math.abs(deployed.king.z))<4.19)throw new Error('King left the wall');
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  const paused=await read();await page.waitForTimeout(400);if((await read()).time!==paused.time)throw new Error('Pause advanced combat');
  await page.getByRole('button',{name:'Resume the watch',exact:true}).click();
  await page.keyboard.down('KeyD');
  for(let i=0;i<24;i++){
    await page.waitForTimeout(2000);let s=await read();
    if(s.phase!=='battle')break;
    await page.keyboard.press('Space');
    if(i===9)await page.screenshot({path:'output/playwright/castle-first-watch.png'});
  }
  await page.keyboard.up('KeyD');
  const result=await read();
  console.log(JSON.stringify({checkpoint,deployed:deployed.knights.map(k=>({name:k.name,deployed:k.deployed,x:k.x,z:k.z})),phase:result.phase,time:result.time,stats:result.stats,state:result.state,errors}));
  await page.screenshot({path:'output/playwright/castle-watch-result.png'});
  if(errors.length)throw new Error(errors.join('\n'));
}
