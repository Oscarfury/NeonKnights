async (page) => {
  await page.reload();
  await page.getByRole('button',{name:'Knights',exact:true}).click();
  await page.getByText('Inspect the enemy',{exact:true}).click();
  await page.locator('[data-action="inspect:dragon"]').click();
  await page.waitForTimeout(800);
  await page.screenshot({path:'output/playwright/emberwing-idle.png'});
  await page.getByRole('button',{name:'Play attack',exact:true}).click();
  await page.waitForTimeout(2400);
  await page.screenshot({path:'output/playwright/emberwing-breath.png'});
  await page.getByRole('button',{name:'Return to the walls',exact:true}).click();
  return {dragon:'Inspected idle and breath animations in the game renderer'};
}
