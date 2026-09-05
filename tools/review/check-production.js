async (page) => {
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
  await page.reload();
  await page.getByRole('button',{name:'Begin the siege'}).waitFor();
  if(await page.evaluate(()=>typeof window.__NEON_DEV__!=='undefined'))throw new Error('Development mutation helpers leaked into production');
  await page.getByRole('button',{name:'Open settings'}).click();
  await page.getByLabel('Decorative effects and hit flashes').uncheck();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button',{name:'Open settings'}).click();
  if(await page.getByLabel('Decorative effects and hit flashes').isChecked())throw new Error('Settings did not persist');
  await page.getByRole('button',{name:'Restore default settings'}).click();
  await page.getByRole('button',{name:'Close settings'}).click();
  await page.getByRole('button',{name:'Select Starfall Mortar'}).click();
  await page.getByRole('button',{name:'Enter the training yard'}).click();
  await page.mouse.move(1000,400);await page.mouse.down();await page.waitForTimeout(1300);await page.mouse.up();
  const run=await page.evaluate(()=>window.__NEON__.snapshot());
  if(run.weapon!=='starfall'||run.time<=0)throw new Error('Production simulation did not run');
  const frameStats=await page.evaluate(async()=>{
    const times=[];let previous=performance.now();
    for(let i=0;i<90;i++){const now=await new Promise(requestAnimationFrame);times.push(now-previous);previous=now;}
    times.shift();times.sort((a,b)=>a-b);return {medianMs:times[Math.floor(times.length/2)],p95Ms:times[Math.floor(times.length*.95)],sampleFrames:times.length};
  });
  await page.keyboard.press('Escape');
  const before=await page.evaluate(()=>window.__NEON__.snapshot().time);await page.waitForTimeout(200);
  if(before!==await page.evaluate(()=>window.__NEON__.snapshot().time))throw new Error('Production pause failed');
  await page.getByRole('button',{name:'Return to title'}).click();
  await page.screenshot({path:'output/playwright/overhaul-production.png'});
  if(errors.length||failed.length)throw new Error(JSON.stringify({errors,failed}));
  await page.evaluate(report=>window.__productionReport=report,{url:page.url(),errors,failed,settings:true,weapon:true,pause:true,devHooksAbsent:true,frameStats});
}
