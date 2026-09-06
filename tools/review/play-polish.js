async (page) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.evaluate(() => localStorage.removeItem('neon-knights:v3:castle:1'));
  await page.reload();
  await page.getByRole('button', { name: 'Build', exact: true }).waitFor();
  const read = () => page.evaluate(() => window.__castle.snapshot());
  const tab = (name) => page.getByRole('button', { name, exact: true }).click();
  const act = (name) => page.locator(`.council-content [data-action="${name}"]`).click();
  const build = async (kind, site) => {
    await tab('Build'); await act(`zone:${site.startsWith('inner') ? 'inner' : 'wall'}`);
    await page.locator(`[data-pick="${kind}"]`).click(); await act(`slot:${site}`);
  };
  const talent = async (id, name) => {
    await act(`knight:${id}`);
    if (!await page.locator('.knight-talents').evaluate(e=>e.open)) await page.locator('.knight-talents summary').click();
    await act(`talent:${id}:${name}`);
  };
  if ((await read()).state.knights.length !== 1) throw Error('Expected one starting knight');
  await tab('Knights');
  if (await page.locator('[data-action^="recruit:"]').count()) throw Error('Recruiting unlocked before tavern');
  await build('tavern', 'inner-sw');
  await tab('Knights'); await act('recruit:elin');
  await talent('aldren', 'slam'); await talent('elin', 'mending');
  await build('ballista', 'west-watch');
  await page.screenshot({ path: 'output/playwright/polish-company-planning.png' });
  const results = [], attacks = new Set();
  for (let round = 0; round < 3; round++) {
    if (round) {
      await tab('Build');
      if (await page.locator('[data-action="walls-repair"]').count()) await act('walls-repair');
      let s = (await read()).state;
      for (const b of s.buildings) {
        await act(`zone:${b.site.startsWith('inner') ? 'inner' : 'wall'}`); await act(`slot:${b.site}`);
        if (await page.locator('[data-action="building-repair"]').count()) await act('building-repair');
      }
      await tab('Knights');
      for (const k of s.knights) {
        await act(`knight:${k.id}`);
        if (await page.locator(`[data-action="treat:${k.id}"]`).isEnabled()) await act(`treat:${k.id}`);
      }
      if (round === 1) {
        await act('recruit:corvin'); await talent('corvin', 'slam');
        await talent('aldren', 'aftershock'); await talent('elin', 'shelter');
        await build('sanctuary', 'inner-se');
        if ((await read()).state.gold >= 140) await build('spire', 'east-watch');
      } else {
        await talent('aldren', 'earthshaker'); await talent('elin', 'beacon'); await talent('corvin', 'aftershock');
        await tab('Build'); if (await page.locator('[data-action="walls-up"]').isEnabled()) await act('walls-up');
        await tab('King & gear'); if (await page.locator('[data-action="weapon-up"]').isEnabled()) await act('weapon-up');
        await tab('Build');
        if (!(await read()).state.buildings.some((b) => b.kind === 'spire')) await build('spire', 'east-watch');
        await act('zone:wall'); await act('slot:west-watch');
        if (await page.locator('[data-action="building-up"]').isEnabled()) await act('building-up');
        await tab('Relics'); await act('relic:storm-oath');
      }
    }
    const checkpoint = (await read()).state;
    await page.getByRole('button', { name: /^Begin watch/ }).click();
    await page.waitForTimeout(250);
    const canvas = await page.locator('.castle-canvas canvas').boundingBox();
    let held = false;
    for (let tick = 0; tick < 1400; tick++) {
      const s = await read(); if (s.phase !== 'battle') break;
      if (s.paused) throw Error('Unexpected pause');
      const alive = s.enemies.filter((e) => e.hp > 0 && e.action !== 'arrive');
      const side = (e) => Math.abs(e.z) >= Math.abs(e.x) ? e.z < 0 ? 0 : 2 : e.x > 0 ? 1 : 3;
      alive.sort((a, b) => s.state.walls[side(a)] * 0.08 - s.state.walls[side(b)] * 0.08 + Math.hypot(a.x-s.king.x,a.z-s.king.z) - Math.hypot(b.x-s.king.x,b.z-s.king.z));
      const angle = Math.atan2(s.king.x, s.king.z);
      let heading = alive.length ? Math.atan2(alive[0].x, alive[0].z) : angle;
      const delta = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
      const unsafe = (a) => s.dangers.some((t) => {
        const dx = Math.sin(a)*5.3-t.x, dz = Math.cos(a)*5.3-t.z, d = Math.hypot(dx,dz);
        if (t.kind === 'hex') return d <= t.radius + 0.4;
        if (t.width) return dx*Math.sin(t.yaw)+dz*Math.cos(t.yaw) >= t.radius && dx*Math.sin(t.yaw)+dz*Math.cos(t.yaw) <= t.length && Math.abs(dx*Math.cos(t.yaw)-dz*Math.sin(t.yaw)) < t.width/2+0.5;
        return d <= t.length && d >= t.radius && Math.abs(delta(Math.atan2(dx,dz),t.yaw)) < t.arc/2+0.08;
      });
      if (unsafe(heading) || unsafe(angle)) {
        const safe = Array.from({length:64},(_,i)=>i*Math.PI*2/64).filter(a=>!unsafe(a));
        safe.sort((a,b)=>Math.abs(delta(a,angle)) + 0.3*Math.abs(delta(a,heading)) - Math.abs(delta(b,angle)) - 0.3*Math.abs(delta(b,heading)));
        if (safe.length) heading=safe[0];
      }
      const x=Math.sin(heading)*15,z=Math.cos(heading)*15,y=[2.28,3.28,4.28][s.state.wallTier-1];
      const length=Math.hypot(27,34),f=1/Math.tan(41*Math.PI/360),depth=-(y-28)*27/length-(z-34)*34/length;
      await page.mouse.move(canvas.x+canvas.width/2+x/depth*f*canvas.height/2,canvas.y+canvas.height/2-((y-28)*34/length-(z-34)*27/length)/depth*f*canvas.height/2);
      if (s.power >= 100 && alive.some(e=>Math.hypot(e.x-s.king.x,e.z-s.king.z)<11)) await page.keyboard.press('Space');
      if (!held && alive.length && tick%18===0) { await page.mouse.down(); held=true; }
      if (held && s.charge >= 0.98) { await page.mouse.up(); held=false; }
      const t = s.dangers.find(t=>t.kind!=='hex');
      if (t) {
        const key = `${t.kind}-${t.age<t.windup?'warning':'impact'}`;
        if (!attacks.has(key)) { attacks.add(key); await page.screenshot({path:`output/playwright/polish-${key}.png`}); }
      }
      if (tick === 200) await page.screenshot({path:`output/playwright/polish-battle-${round+1}.png`});
      await page.waitForTimeout(95);
    }
    await page.mouse.up();
    const result = await read();
    results.push({ checkpoint, phase: result.phase, time: result.time, kingHp: result.king.hp, stats: result.stats, loot: result.loot, state: result.state });
    await page.evaluate(v=>localStorage.setItem('neon-test:polish-results',JSON.stringify(v)),results);
    await page.screenshot({path:`output/playwright/polish-result-${round+1}.png`});
    if (result.phase !== 'won') return { failed: round+1, results, attacks:[...attacks], errors };
    await page.getByRole('button',{name:'Return to the council',exact:true}).click();
    await page.reload(); await page.getByRole('button',{name:'Build',exact:true}).waitFor();
    if ((await read()).state.encounter!==round+1) throw Error('Victory did not persist');
  }
  return { results, attacks:[...attacks], errors };
}
