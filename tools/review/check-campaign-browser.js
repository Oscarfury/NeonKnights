async (page) => {
  const errors=[], failures=[], results=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url());});
  const read=()=>page.evaluate(()=>window.__castle.snapshot());
  const checkpoints=await page.evaluate(()=>window.__campaignReviewCheckpoints);
  if(!checkpoints)throw Error('Seed the legal simulation checkpoints before running this review.');
  for(const level of [0,4,7,9,14]){
    await page.evaluate(s=>localStorage.setItem('neon-knights:v3:campaign:2',JSON.stringify(s)),checkpoints[level]);
    await page.reload();await page.getByRole('button',{name:'Build',exact:true}).waitFor();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.castle-stage')).position==='relative');
    await page.screenshot({path:`output/playwright/campaign-council-${level+1}.png`});
    await page.getByRole('button',{name:/^Begin watch/}).click();
    const canvas=await page.locator('.castle-canvas canvas').boundingBox();
    let captured=false,peak=0,draws=0,triangles=0;
    for(let tick=0;tick<1800;tick++){
      const s=await read();if(s.phase!=='battle')break;
      const side=e=>Math.abs(e.z)>=Math.abs(e.x)?e.z<0?0:2:e.x>0?1:3;
      const alive=s.enemies.filter(e=>e.hp>0&&e.action!=='arrive');
      peak=Math.max(peak,alive.length);draws=Math.max(draws,s.render.calls);triangles=Math.max(triangles,s.render.triangles);
      alive.sort((a,b)=>Math.hypot(a.x-s.king.x,a.z-s.king.z)-Math.hypot(b.x-s.king.x,b.z-s.king.z));
      const threat=s.dangers.find(t=>t.wall!==undefined&&t.age<t.windup);
      const heading=threat?Math.PI-threat.wall*Math.PI/2:alive.length?Math.atan2(alive[0].x,alive[0].z):Math.atan2(s.king.x,s.king.z);
      const x=Math.sin(heading)*15,z=Math.cos(heading)*15,y=[2.28,3.28,4.28][s.state.wallTier-1];
      const length=Math.hypot(27,34),f=1/Math.tan(41*Math.PI/360),depth=-(y-28)*27/length-(z-34)*34/length;
      await page.mouse.move(canvas.x+canvas.width/2+x/depth*f*canvas.height/2,canvas.y+canvas.height/2-((y-28)*34/length-(z-34)*27/length)/depth*f*canvas.height/2);
      if(s.power>=100)await page.keyboard.press('Space');
      if(threat&&threat.windup-threat.age<.3&&s.guardCooldown===0&&side(s.king)===threat.wall)await page.keyboard.press('KeyE');
      if(!captured&&s.time>12){await page.screenshot({path:`output/playwright/campaign-battle-${level+1}.png`});captured=true;}
      await page.waitForTimeout(80);
    }
    const result=await read();
    results.push({level:level+1,phase:result.phase,seconds:result.time,peak,draws,triangles,stats:result.stats});
    await page.evaluate(r=>localStorage.setItem('neon-test:campaign-browser',JSON.stringify(r)),{results,errors,failures});
    if(result.phase!=='won')return{results,errors,failures};
    await page.getByRole('button',{name:'Return to the council',exact:true}).click();
    await page.reload();await page.getByRole('button',{name:'Build',exact:true}).waitFor();
    if((await read()).state.encounter!==level+1)throw Error('Victory checkpoint did not persist');
  }
  return {results,errors,failures};
}
