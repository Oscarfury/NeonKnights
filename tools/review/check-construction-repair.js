async (page) => {
  await page.waitForFunction(()=>window.__NEON_NEXT__);
  const read=()=>page.evaluate(()=>window.__NEON_NEXT__.snapshot());
  await page.getByRole('button',{name:'Enter courtyard ↗',exact:true}).click();
  await page.keyboard.down('KeyA');await page.waitForTimeout(1250);await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyW');await page.waitForTimeout(375);await page.keyboard.up('KeyW');
  await page.getByRole('button',{name:'Start ward trial',exact:true}).click();
  await page.waitForFunction(()=>window.__NEON_NEXT__.snapshot().defenses.some(b=>b.hp<300||b.kind==='aegis'&&b.hp<330),{},{timeout:9000});
  await page.getByRole('button',{name:'End ward trial',exact:true}).click();
  const wound=(await read()).defenses.find(b=>b.kind==='aegis').hp;
  await page.getByRole('button',{name:'Restore company',exact:true}).first().click();
  if((await read()).defenses.find(b=>b.kind==='aegis').hp!==wound)throw new Error('Company reset healed a structure');
  await page.getByRole('button',{name:'Workshop',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:/Visit the workshop/}).click();
  if((await read()).plan.buildings.find(b=>b.kind==='aegis').hp!==wound)throw new Error('Structure wounds lost on reload');
  await page.getByRole('button',{name:'West courtyard Aegis Projector III',exact:true}).click();
  const gold=(await read()).plan.gold, price=Math.ceil((330-wound)/4);
  await page.getByRole('button',{name:new RegExp(`Repair ${wound} / 330`)}).click();
  if((await read()).plan.gold!==gold-price||(await read()).plan.buildings.find(b=>b.kind==='aegis').hp!==330)throw new Error('Incorrect repair cost or durability');
  await page.getByRole('button',{name:'Salvage · recover 385 crowns',exact:true}).click();
  const after=await read();if(after.plan.gold!==gold-price+385||after.plan.buildings.length!==1)throw new Error('Incorrect salvage');
  return {wound,repairPrice:price,plan:after.plan};
}
