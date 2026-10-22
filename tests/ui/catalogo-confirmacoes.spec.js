import { test, expect } from '@playwright/test';

const evidence = process.env.CATALOGO_EVIDENCE_DIR || '/workspace/sabor-catalogo-fotos-confirmadas-evidencias';

test('confirmações mobile preservam complementos, proteínas, fotos reais e placeholders', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/status', r => r.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
  const requests = [];
  page.on('request', r => { if (r.resourceType() === 'image') requests.push(new URL(r.url()).pathname); });
  await page.goto('/index.html');
  const traditional = page.locator('#hamburgueres');
  for (const card of await traditional.locator('[data-card]').filter({ hasNot: page.locator('[data-add="hamburgueres-frango-fresh"]') }).all()) await expect(card).not.toContainText(/bimbo|bimbu/i);
  await expect(traditional).toContainText('Pão + carne + queijo + maionese + ketchup');
  await expect(traditional).toContainText('2 carnes + 2 queijos + presunto + tomate + alface + maionese + ketchup');
  for (const card of await page.locator('#linha-cheddar [data-card]').all()) {
    await expect(card).toContainText('pão Bimbo');
    await expect(card).toContainText('queijo cheddar');
    await expect(card).toContainText('molho Billy Jack');
  }
  for (const text of ['Dogão Quente Salsicha', 'Dogão Quente Linguiça']) await expect(page.locator('#hot-dogs')).toContainText(text);
  await expect(page.locator('.menu-section img, #featured-grid img')).not.toHaveCount(0);
  await expect(page.locator('.photo-placeholder .photo-unavailable').first()).toHaveText('Foto de exemplo não disponível');
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.locator('#theme-toggle').click();
    for (const [name, search] of [['tradicionais', 'Pão'], ['xduplo', 'X Duplo'], ['combo07', 'Combo 07'], ['cheddar', 'Bimbo'], ['dogao', 'Dogão'], ['batatas', 'Batata Maluca'], ['h2oh', 'H2OH']]) {
      await page.locator('#search').fill(search);
      await page.waitForTimeout(350);
      const target = name === 'batatas' ? page.locator('#porcoes') : page.locator('.menu-section:visible').first();
      await target.scrollIntoViewIfNeeded();
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
      await page.screenshot({ path: `${evidence}/mobile-${name}-${theme}.png` });
    }
    await page.locator('#search').fill('');
    await page.waitForTimeout(350);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 320);
  expect([...new Set(requests)]).toContain('/img/logo.webp');
  expect([...new Set(requests)]).toContain('/img/h2oh-limao-500ml.webp');
});
