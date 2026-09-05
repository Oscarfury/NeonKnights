async (page) => {
  const fixture={"version": 1, "gold": 124, "encounter": 1, "wallTier": 2, "walls": [360, 360, 360, 360], "kingHp": 160, "weapon": "stormbow", "ranks": {"stormbow": 1, "sunlance": 1}, "sockets": {"stormbow": [], "sunlance": []}, "knights": [{"id": "aldren", "active": true, "hp": 135, "rank": 1, "xp": 2, "gear": 3, "stance": "guard"}, {"id": "elin", "active": true, "hp": 95, "rank": 1, "xp": 2, "gear": null, "stance": "hunt"}, {"id": "corvin", "active": true, "hp": 135, "rank": 1, "xp": 2, "gear": null, "stance": "guard"}], "inventory": [{"id": 3, "kind": "ward-seal"}], "offers": ["storm-seal", "field-kit", "quickdraw", "sundering", "vital-spark", "forked-light"], "bought": [], "rerolls": 0, "nextId": 4, "buildings": [{"id": 1, "kind": "ballista", "site": "east-court", "rank": 2, "yaw": 0.7853981633974483, "hp": 220}, {"id": 2, "kind": "ballista", "site": "west-watch", "rank": 2, "yaw": -2.356194490192345, "hp": 220}], "relic": null, "difficulty": "normal", "wins": 1};
  await page.setViewportSize({width:1600,height:1000});
  await page.goto('http://127.0.0.1:5173/NeonKnights/next/');
  await page.waitForFunction(()=>window.__castle);
  const backup=await page.evaluate(()=>localStorage.getItem('neon-knights:v3:castle:1'));
  await page.evaluate(s=>localStorage.setItem('neon-knights:v3:castle:1',JSON.stringify(s)),fixture);
  await page.reload();await page.waitForFunction(()=>window.__castle);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('button',{name:'Sound the horns \u2197',exact:true}).click();
  await page.waitForFunction(()=>window.__castle.snapshot().dangers.some(d=>d.kind==='breath'&&d.age>d.windup+.1),{},{timeout:40000});
  await page.screenshot({path:'output/playwright/castle-active-prism-breath.png'});
  const sample=await page.evaluate(async()=>{const times=[];let last=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-last);last=now;}times.sort((a,b)=>a-b);const s=window.__castle.snapshot();return {median:times[60],p95:times[114],actors:s.enemies.filter(e=>e.hp>0).length+s.knights.length+1,render:s.render,kingHp:s.king.hp,stats:s.stats};});
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.evaluate(raw=>{if(raw===null)localStorage.removeItem('neon-knights:v3:castle:1');else localStorage.setItem('neon-knights:v3:castle:1',raw);},backup);
  return {fixture:'Recorded legal second-encounter checkpoint, restored for VFX inspection',viewport:{width:1600,height:1000},sample,errors};
}
