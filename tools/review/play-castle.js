async (page) => {
  await page.waitForFunction(()=>window.__castle);
  const read=()=>page.evaluate(()=>window.__castle.snapshot());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const results=[];
  if((await read()).phase==='lost')await page.getByRole('button',{name:'Revisit the council',exact:true}).click();
  for(let round=0;round<3;round++){
    const state=(await read()).state;if(state.encounter>=3)break;
    if(state.encounter>0){
      await page.getByRole('button',{name:'Castle',exact:true}).click();
      const repair=page.getByRole('button',{name:/^Repair walls/});if(await repair.isEnabled())await repair.click();
      await page.getByRole('button',{name:'Company',exact:true}).click();
      for(let i=0;i<state.knights.length;i++){const treat=page.getByRole('button',{name:/^Treat ·/}).nth(i);if(await treat.isEnabled())await treat.click();}
      await page.getByRole('button',{name:'Armory',exact:true}).click();const king=page.getByRole('button',{name:/^Treat the King/});if(await king.isEnabled())await king.click();
      await page.getByRole('button',{name:'Castle',exact:true}).click();
      if((await read()).state.gold>=460&&(await read()).state.wallTier===2)await page.getByRole('button',{name:/Raise tier III walls/}).click();
      for(const mount of ['east-court','west-watch']){
        await page.getByLabel('WALL PLATFORM',{exact:true}).selectOption(mount);
        const current=(await read()).state,b=current.buildings.find(b=>b.site===mount);
        if(b.rank===1&&current.gold>=160)await page.getByRole('button',{name:/Upgrade to II/}).click();
      }
      if(state.encounter===2){await page.getByRole('button',{name:'Relics',exact:true}).click();if(!(await read()).state.relic)await page.getByRole('button',{name:'Claim this relic',exact:true}).nth(1).click();await page.screenshot({path:'output/playwright/castle-relic-chosen.png'});}
    }
    if((await read()).state.encounter===2&&(await read()).state.gold>=150&&(await read()).state.ranks.stormbow===1){await page.getByRole('button',{name:'Armory',exact:true}).click();await page.getByRole('button',{name:/Improve Stormbow/}).click();}
    const checkpoint=(await read()).state;
    await page.getByRole('button',{name:'Sound the horns ↗',exact:true}).click();
    let held='',shot=false;
    for(let tick=0;tick<950;tick++){
      const s=await read();if(s.phase!=='battle')break;
      const alive=s.enemies.filter(e=>e.hp>0&&e.action!=='arrive').sort((a,b)=>Math.hypot(a.x-s.king.x,a.z-s.king.z)-Math.hypot(b.x-s.king.x,b.z-s.king.z));
      const angle=Math.atan2(s.king.x,s.king.z),dragon=alive.find(e=>e.role==='dragon');
      let heading=alive.length?Math.atan2(alive[0].x,alive[0].z)+Math.sin(s.time*2)*.32:angle;
      if(dragon&&['breath','rake'].includes(dragon.action)&&dragon.actionTime<3.5)heading=angle+1.25;
      const difference=Math.atan2(Math.sin(heading-angle),Math.cos(heading-angle));
      const next=Math.abs(difference)<.12?'':difference>0?'KeyD':'KeyA';
      if(next!==held){if(held)await page.keyboard.up(held);if(next)await page.keyboard.down(next);held=next;}
      if(s.time>10&&tick%12===0&&alive.some(e=>Math.hypot(e.x-s.king.x,e.z-s.king.z)<11))await page.keyboard.press('Space');
      if(dragon&&!shot){await page.screenshot({path:'output/playwright/castle-dragon-arrival.png'});shot=true;}
      if(dragon?.action==='breath'&&dragon.actionTime>1.2&&dragon.actionTime<1.55)await page.screenshot({path:'output/playwright/castle-dragon-breath.png'});
      await page.waitForTimeout(160);
    }
    if(held)await page.keyboard.up(held);
    const result=await read();results.push({checkpoint,phase:result.phase,time:result.time,kingHp:result.king.hp,stats:result.stats,state:result.state});
    await page.screenshot({path:`output/playwright/castle-encounter-${state.encounter+1}-result.png`});
    if(result.phase!=='won')return {results,errors,failed:`Encounter ${state.encounter+1} ended ${result.phase}`};
    await page.getByRole('button',{name:'Return to the council',exact:true}).click();
    await page.reload();await page.waitForFunction(()=>window.__castle);
    if((await read()).state.encounter!==state.encounter+1)throw new Error('Victory checkpoint was not restored after reload');
  }
  return {results,errors,final:(await read()).state};
}
