// Repeatable funded performance fixture, independent of campaign balance checks.
async (page) => {
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.setViewportSize({width:1600,height:1000});
  await page.goto('http://127.0.0.1:5173/NeonKnights/next/');
  await page.getByRole('button',{name:'Build',exact:true}).waitFor();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.castle-stage')).position==='relative');
  const saved=await page.evaluate(()=>localStorage.getItem('neon-knights:v3:castle:1'));
  await page.evaluate(async()=>{
    const C=await import('/NeonKnights/src/next/castle/Campaign.ts');
    const s=C.createCampaign(); s.gold=6000;
    C.build(s,'tavern','inner-sw'); C.recruit(s,'elin'); C.recruit(s,'corvin');
    C.upgradeWalls(s); C.build(s,'sanctuary','inner-se');
    C.build(s,'ballista','west-watch'); C.build(s,'ballista','east-court');
    C.build(s,'spire','east-watch'); C.build(s,'aegis','west-court');
    localStorage.setItem('neon-knights:v3:castle:1',JSON.stringify(s));
  });
  await page.reload(); await page.getByRole('button',{name:'Build',exact:true}).waitFor();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.castle-stage')).position==='relative');
  await page.getByRole('button',{name:/^Begin watch/}).click();
  await page.waitForTimeout(6000);
  const client=await page.context().newCDPSession(page);
  await client.send('Profiler.enable'); await client.send('Profiler.setSamplingInterval',{interval:1000});
  await client.send('Profiler.start');
  const frames=await page.evaluate(()=>new Promise(resolve=>{
    const values=[]; let before=performance.now();
    const tick=now=>{values.push(now-before);before=now;if(values.length===300)resolve(values);else requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  }));
  const {profile}=await client.send('Profiler.stop'); await client.detach();
  const self=new Map(), inclusive=new Map(), nodes=new Map(profile.nodes.map(n=>[n.id,n]));
  const parents=new Map(); for(const n of profile.nodes) for(const child of n.children||[])parents.set(child,n.id);
  profile.samples.forEach((id,i)=>{
    const duration=profile.timeDeltas[i]/1000;
    self.set(id,(self.get(id)||0)+duration);
    for(let current=id;current;current=parents.get(current))inclusive.set(current,(inclusive.get(current)||0)+duration);
  });
  const hottest=map=>[...map].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([id,ms])=>({fn:nodes.get(id).callFrame.functionName,url:nodes.get(id).callFrame.url.split('?')[0].split('/').slice(-2).join('/'),ms:Math.round(ms)}));
  const state=await page.evaluate(()=>window.__castle.snapshot());
  const sorted=frames.slice().sort((a,b)=>a-b);
  const result={viewport:'1600x1000',samples:frames.length,medianMs:sorted[150],p95Ms:sorted[285],over33ms:frames.filter(t=>t>33.5).length,pixelRatio:state.pixelRatio,bodies:state.characterMeshes,render:state.render,actors:state.enemies.length+state.knights.length+1,phase:state.phase,time:state.time,self:hottest(self),inclusive:hottest(inclusive),errors};
  await page.evaluate(s=>localStorage.setItem('neon-knights:v3:castle:1',s),saved);await page.reload();
  return result;
}
