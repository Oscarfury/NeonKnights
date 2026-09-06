async(page)=>{
 const errors=[],warnings=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
 const result={};
 await page.evaluate(async()=>{const C=await import('/NeonKnights/src/next/castle/Campaign.ts');const s=C.createCampaign();s.encounter=s.wins=15;localStorage.setItem(C.campaignKey,JSON.stringify(s));});
 await page.reload();await page.getByRole('heading',{name:'The hold endures'}).waitFor();
 result.completedSave=true;
 await page.evaluate(async()=>{
   const C=await import('/NeonKnights/src/next/castle/Campaign.ts');const s=C.createCampaign();s.encounter=s.wins=14;s.gold=10000;C.upgradeWalls(s);C.upgradeWalls(s);
   for(const [kind,site] of [['tavern','inner-sw'],['sanctuary','inner-se'],['forge','inner-ne'],['war-room','inner-nw'],['ballista','west-watch'],['spire','east-watch'],['aegis','west-court'],['mortar','east-court']])C.build(s,kind,site,3);
   for(const id of ['elin','mira']){C.recruit(s,id);C.promote(s,id);C.promote(s,id);}
   C.improveWeapon(s,'stormbow');C.improveWeapon(s,'stormbow');C.chooseRelic(s,'worldpiercer');C.chooseRelic(s,'ember-crown');C.ascendRelic(s,'worldpiercer');localStorage.setItem(C.campaignKey,JSON.stringify(s));
 });
 await page.reload();await page.getByRole('button',{name:'Build',exact:true}).waitFor();
 await page.screenshot({path:'output/playwright/campaign-castle-tier3.png'});
 await page.getByRole('button',{name:'Knights',exact:true}).click();
 await page.getByText('Inspect the enemy',{exact:true}).click();await page.locator('[data-action="inspect:golem"]').click();
 await page.getByRole('button',{name:'Play attack',exact:true}).click();await page.waitForTimeout(1200);
 await page.screenshot({path:'output/playwright/campaign-golem-inspect.png'});await page.getByRole('button',{name:'Return to the walls',exact:true}).click();
 await page.getByRole('button',{name:/^Begin watch/}).click();await page.waitForTimeout(16000);
 const frames=await page.evaluate(async()=>{const values=[];let previous=performance.now();for(let i=0;i<181;i++){const now=await new Promise(requestAnimationFrame);if(i)values.push(now-previous);previous=now;}values.sort((a,b)=>a-b);return {frames:values.length,median:values[90],p95:values[171]};});
 result.performance={...frames,...await page.evaluate(()=>{const s=window.__castle.snapshot();return{draws:s.render.calls,triangles:s.render.triangles,buildings:s.state.buildings.length,actors:s.enemies.filter(e=>e.hp>0).length+s.knights.filter(k=>k.hp>0).length+1,pixelRatio:s.pixelRatio};})};
 await page.screenshot({path:'output/playwright/campaign-performance.png'});
 await page.keyboard.press('Escape');return {...result,errors,warnings};
}
