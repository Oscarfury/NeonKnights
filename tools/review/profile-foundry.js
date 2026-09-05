async (page) => {
  await page.bringToFront();
  const read=()=>page.evaluate(()=>window.__NEON_NEXT__.snapshot());
  if((await read()).mode==='inspection')await page.getByRole('button',{name:'Enter the courtyard ↗'}).click();
  if(await page.getByRole('button',{name:'End ward trial'}).count())await page.getByRole('button',{name:'End ward trial'}).click();
  return await page.evaluate(()=>new Promise(resolve=>{
    const timings=[];let previous=performance.now();
    function tick(now){timings.push(now-previous);previous=now;if(timings.length<120){requestAnimationFrame(tick);return;}
      const sorted=timings.slice(5).sort((a,b)=>a-b),canvas=document.querySelector('.field-stage canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
      resolve({scenario:'Three paladins and training court, 120 animation frames, desktop preview',viewport:[innerWidth,innerHeight],browser:navigator.userAgent,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),medianFrameMs:sorted[Math.floor(sorted.length*.5)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],snapshot:window.__NEON_NEXT__.snapshot(),productionHelpers:Object.keys(window.__NEON_NEXT__)});
    }requestAnimationFrame(tick);
  }));
}
