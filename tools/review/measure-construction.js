async (page) => {
  await page.setViewportSize({width:1600,height:1000});await page.bringToFront();
  await page.getByText('Workshop ledger',{exact:true}).click();await page.getByRole('button',{name:'Reset all defenses & crowns'}).click();await page.getByText('Workshop ledger',{exact:true}).click();
  await page.getByRole('button',{name:'West watch Open site',exact:true}).click();
  await page.getByRole('button',{name:/2 CAPACITY Royal Ballista/}).click();
  await page.getByRole('button',{name:'III Siege frame',exact:true}).click();
  await page.getByRole('button',{name:'Build rank III · 500 crowns',exact:true}).click();
  await page.getByRole('button',{name:'West courtyard Open site',exact:true}).click();
  await page.getByRole('button',{name:/1 CAPACITY Aegis Projector/}).click();
  await page.getByRole('button',{name:'III Bastion engine',exact:true}).click();
  await page.getByRole('button',{name:'Build rank III · 550 crowns',exact:true}).click();
  await page.getByRole('button',{name:'Enter courtyard ↗',exact:true}).click();
  await page.waitForFunction(()=>window.__NEON_NEXT__.snapshot().structureHits>0,{},{timeout:12000});
  return await page.evaluate(async()=> {
    const values=[];let previous;
    await new Promise(resolve=>{const sample=t=>{if(previous!==undefined)values.push(t-previous);previous=t;if(values.length<120)requestAnimationFrame(sample);else resolve();};requestAnimationFrame(sample);});
    values.sort((a,b)=>a-b);
    const gl=document.querySelector('canvas').getContext('webgl2'), debug=gl.getExtension('WEBGL_debug_renderer_info');
    const s=window.__NEON_NEXT__.snapshot();
    const urls=performance.getEntriesByType('resource').map(r=>r.name).filter(u=>u.startsWith('http'));
    return {samples:120,viewport:[innerWidth,innerHeight],medianFrameMs:values[60],p95FrameMs:values[114],drawCalls:s.drawCalls,trianglesIncludingPasses:s.triangles,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),browser:navigator.userAgent,defenses:s.defenses.map(b=>[b.kind,b.rank]),visiblePaladins:3,externalRequests:urls.filter(u=>new URL(u).origin!==location.origin),helpers:Object.keys(window.__NEON_NEXT__)};
  });
}
