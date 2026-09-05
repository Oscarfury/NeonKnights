async (page) => {
  const read=()=>page.evaluate(()=>window.__castle.snapshot());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(()=>localStorage.removeItem('neon-knights:v3:castle:1'));await page.reload();
  await page.getByRole('button',{name:'Build',exact:true}).waitFor();
  const tab=async name=>page.getByRole('button',{name,exact:true}).click();
  const act=async action=>page.locator(`.council-content [data-action="${action}"]`).click();
  const buy=async(kind,slot)=>{await page.locator(`[data-pick="${kind}"]`).click();await act(`slot:${slot}`);};
  await act('walls-up');await buy('ballista','west-watch');await buy('spire','east-watch');await buy('sanctuary','east-court');
  await tab('Knights');await act('talent:aldren:taunt');await act('knight:elin');await act('talent:elin:mending');await act('knight:corvin');await act('talent:corvin:slam');
  const results=[];
  for(let round=0;round<3;round++) {
    let state=(await read()).state;
    if(round>0) {
      await tab('Build');if(await page.locator('[data-action="walls-repair"]').count())await act('walls-repair');
      for(const b of state.buildings) {await act(`slot:${b.site}`);if(await page.locator('[data-action="building-repair"]').count())await act('building-repair');}
      await tab('Knights');
      for(const k of state.knights) {await act(`knight:${k.id}`);const heal=page.locator(`[data-action="treat:${k.id}"]`);if(await heal.isEnabled())await heal.click();}
      await act(`knight:aldren`);await act(`talent:aldren:${round===1?'bulwark':'renewal'}`);
      await act(`knight:elin`);await act(`talent:elin:${round===1?'shelter':'beacon'}`);
      await act(`knight:corvin`);await act(`talent:corvin:${round===1?'aftershock':'earthshaker'}`);
      await tab('King & gear');const king=page.locator('[data-action="king-treat"]');if(await king.isEnabled())await king.click();
      if((await read()).state.gold>=150 && (await read()).state.ranks.stormbow===1)await act('weapon-up');
      await tab('Build');
      if(round===1 && (await read()).state.gold>=120)await buy('aegis','west-court');
      if(round===2 && (await read()).state.gold>=460)await act('walls-up');
      await act('slot:west-watch');if(await page.locator('[data-action="building-up"]').isEnabled())await act('building-up');
      if(round===2){await tab('Relics');await act('relic:storm-oath');}
    }
    const checkpoint=(await read()).state;
    await page.getByRole('button',{name:/^Begin watch/}).click();
    const canvas=await page.locator('.castle-canvas canvas').boundingBox();
    let shot=false,charged=false;
    for(let tick=0;tick<1000;tick++) {
      const s=await read();if(s.phase!=='battle')break;
      const alive=s.enemies.filter(e=>e.hp>0&&e.action!=='arrive');
      const side=e=>Math.abs(e.z)>=Math.abs(e.x)?e.z<0?0:2:e.x>0?1:3;
      alive.sort((a,b)=>(s.state.walls[side(a)]-s.state.walls[side(b)])*.07+Math.hypot(a.x-s.king.x,a.z-s.king.z)-Math.hypot(b.x-s.king.x,b.z-s.king.z));
      const angle=Math.atan2(s.king.x,s.king.z),dragon=alive.find(e=>e.role==='dragon');
      let heading=alive.length?Math.atan2(alive[0].x,alive[0].z):angle;
      if(dragon && ['breath','rake'].includes(dragon.action)&&dragon.actionTime<3.5)heading=angle+.85;
      const x=Math.sin(heading)*15,z=Math.cos(heading)*15,y=[2.28,3.28,4.28][s.state.wallTier-1];
      const length=Math.hypot(27,34),f=1/Math.tan(41*Math.PI/360),depth=-(y-28)*27/length-(z-34)*34/length;
      const px=canvas.x+canvas.width/2+x/depth*f*canvas.height/2;
      const py=canvas.y+canvas.height/2-((y-28)*34/length-(z-34)*27/length)/depth*f*canvas.height/2;
      await page.mouse.move(px,py);
      if(tick%12===0 && alive.some(e=>Math.hypot(e.x-s.king.x,e.z-s.king.z)<12))await page.keyboard.press('Space');
      if(dragon && !shot){await page.screenshot({path:'output/playwright/circular-dragon-battle.png'});shot=true;}
      if(dragon?.action==='breath' && dragon.actionTime>2.2 && dragon.actionTime<2.55)await page.screenshot({path:'output/playwright/circular-dragon-fire.png'});
      if(alive.length && tick%24===0){await page.mouse.down();charged=true;}
      if(charged && s.king.action==='' && s.time%2<.2){await page.mouse.up();charged=false;}
      if(charged && tick%24===12){await page.mouse.up();charged=false;}
      await page.waitForTimeout(140);
    }
    await page.mouse.up();const result=await read();results.push({checkpoint,phase:result.phase,time:result.time,kingHp:result.king.hp,stats:result.stats,state:result.state});
    await page.evaluate(value=>localStorage.setItem('neon-test:circular-results',JSON.stringify(value)),results);
    await page.screenshot({path:`output/playwright/circular-watch-${round+1}.png`});
    if(result.phase!=='won')return {results,errors,failed:round+1};
    await page.getByRole('button',{name:'Return to the council',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Build',exact:true}).waitFor();
    if((await read()).state.encounter!==round+1)throw new Error('Win did not persist');
  }
  return {results,errors,final:(await read()).state};
}
