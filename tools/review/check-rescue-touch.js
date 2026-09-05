async (page) => {
  const context=await page.context().browser().newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
  const mobile=await context.newPage();
  try {
    await mobile.goto(await page.evaluate(()=>location.href));
    await mobile.getByRole('button',{name:'Enter the courtyard ↗'}).tap();
    await mobile.evaluate(()=>window.__NEON_NEXT__.review('rescue'));
    const button=await mobile.locator('#touch-rescue').boundingBox();
    const client=await context.newCDPSession(mobile);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:button.x+button.width/2,y:button.y+button.height/2}]});
    await mobile.waitForTimeout(2100);
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const result=await mobile.evaluate(()=>window.__NEON_NEXT__.snapshot());
    if(result.company[0].hp!==35||result.rescues!==1)throw new Error('Touch assist failed');
    await mobile.screenshot({path:'output/playwright/combat-touch-rescue.png'});
    return {scope:'Emulated touchscreen with a development-only downed setup',rescues:result.rescues,companionHealth:result.company[0].hp};
  } finally {await context.close();}
}
