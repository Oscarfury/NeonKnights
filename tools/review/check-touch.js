async (page) => {
  const context = await page
    .context()
    .browser()
    .newContext({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 1,
    });
  const touch = await context.newPage(),
    errors = [];
  touch.on('pageerror', (e) => errors.push(e.message));
  await touch.goto('http://127.0.0.1:5173/NeonKnights/');
  await touch.getByRole('button', { name: 'Enter the training yard' }).click();
  await touch.getByRole('button', { name: 'Slow time', exact: true }).waitFor();
  const client = await context.newCDPSession(touch);
  const slow = await touch.getByRole('button', { name: 'Slow time', exact: true }).boundingBox();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: slow.x + slow.width / 2, y: slow.y + slow.height / 2, id: 1 }],
  });
  await touch.waitForTimeout(300);
  const during = await touch.evaluate(() => window.__NEON__.snapshot());
  if (!during.slow || during.energy >= 100) throw new Error('Touch slow button does not work');
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.getByRole('button', { name: 'Phase north' }).tap();
  await touch.waitForTimeout(100);
  const after = await touch.evaluate(() => window.__NEON__.snapshot());
  if (after.slow || after.sector !== 0) throw new Error('Touch release or phasing failed');
  await touch.screenshot({ path: 'output/playwright/overhaul-touch-landscape.png' });
  const dimensions = await touch
    .locator('.touch-controls button')
    .evaluateAll((buttons) =>
      buttons.map((b) => ({
        text: b.textContent,
        width: b.getBoundingClientRect().width,
        height: b.getBoundingClientRect().height,
      })),
    );
  await touch.evaluate(() => window.dispatchEvent(new Event('blur')));
  if (!(await touch.evaluate(() => window.__NEON__.snapshot())).paused)
    throw new Error('Focus loss did not pause');
  if (errors.length) throw new Error(errors.join('\n'));
  const report = {
    touchSlow: true,
    touchRelease: true,
    touchPhase: true,
    focusPause: true,
    errors,
    dimensions,
  };
  await page.evaluate((report) => (window.__touchReport = report), report);
  await context.close();
}
