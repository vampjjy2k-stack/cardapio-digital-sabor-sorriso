import { test, expect } from '@playwright/test';
test('nenhuma foto do PDF é carregada; oito itens voltam às ilustrações anteriores', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.goto('/index.html');
  await expect(page.locator('.menu-section img[src^="img/produtos/"]')).toHaveCount(0);
  for (const id of ['artesanais-artesanal-02', 'artesanais-artesanal-04', 'linha-cheddar-x-cheddar-03', 'linha-cheddar-x-cheddar-05', 'combos-combo-02', 'combos-combo-03', 'combos-combo-04', 'combos-combo-06']) {
    const card = page.locator(`.menu-section [data-card]:has([data-add="${id}"])`);
    await expect(card).toHaveCount(1);
    const image = card.locator('img');
    await expect(image).not.toHaveAttribute('src', /img\/produtos\//);
    await expect(image).toHaveAttribute('alt', '');
  }
  const response = await page.request.get('/img/produtos/artesanal-04.webp');
  expect(response.status()).toBe(404);
  const combo = await page.request.get('/img/produtos/combo-04.webp');
  expect(combo.status()).toBe(404);
});
