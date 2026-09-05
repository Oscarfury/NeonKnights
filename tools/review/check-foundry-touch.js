async (page) => {
  const browser=page.context().browser();
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const mobile=await context.newPage();const errors=[];
  mobile.on('pageerror',e=>errors.push(e.message));
  const origin=await page.evaluate(()=>location.origin);
  try {
    await mobile.goto(origin+'/NeonKnights/next/');
    await mobile.getByRole('button',{name:'Enter the courtyard ↗'}).waitFor();
    await mobile.screenshot({path:'output/playwright/foundry-mobile.png',fullPage:true});
    await mobile.getByRole('button',{name:'Enter the courtyard ↗'}).tap();
    const read=()=>mobile.evaluate(()=>window.__NEON_NEXT__.snapshot());
    await mobile.locator('#touch-swap').tap();await mobile.waitForTimeout(1300);
    if((await read()).player.weapon!=='sunlance')throw new Error('Touch swap failed');
    const pad=await mobile.locator('#move-pad').boundingBox();
    await mobile.mouse.move(pad.x+pad.width*.78,pad.y+pad.height*.5);await mobile.mouse.down();await mobile.waitForTimeout(350);await mobile.mouse.up();
    if((await read()).player.x<.5)throw new Error('Move pad failed');
    const before=await read();await mobile.locator('#touch-dodge').tap();await mobile.waitForTimeout(100);
    if((await read()).dodgeCharges!==before.dodgeCharges-1)throw new Error('Touch dodge failed');
    await mobile.touchscreen.tap(210,330);await mobile.waitForTimeout(850);
    if((await read()).shots<1)throw new Error('A short aim/fire tap was dropped');
    await mobile.locator('#touch-order').tap();await mobile.touchscreen.tap(210,410);await mobile.waitForTimeout(100);
    if((await read()).order!=='hold')throw new Error('Touch order failed');
    await mobile.screenshot({path:'output/playwright/courtyard-mobile.png'});
    await mobile.setViewportSize({width:915,height:412});await mobile.waitForTimeout(150);
    await mobile.screenshot({path:'output/playwright/courtyard-touch-landscape.png'});
    await mobile.evaluate(()=>window.dispatchEvent(new Event('blur')));await mobile.waitForTimeout(100);
    const paused=await read();if(!paused.paused)throw new Error('Focus loss did not pause');
    const external=await mobile.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(url=>!url.startsWith(location.origin)&&!url.startsWith('blob:')&&!url.startsWith('data:')));
    if(external.length)throw new Error('Unexpected external runtime requests: '+JSON.stringify(external));
    return {errors,externalRequests:external,portrait:'412x915',landscape:'915x412',result:paused};
  } finally {await context.close();}
}
