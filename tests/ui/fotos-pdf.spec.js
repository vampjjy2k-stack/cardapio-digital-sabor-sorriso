import { test, expect } from '@playwright/test';

const photos = {
  'artesanais-artesanal-02': 'artesanal-02.webp',
  'artesanais-artesanal-04': 'artesanal-04.webp',
  'linha-cheddar-x-cheddar-03': 'cheddar-03.webp',
  'linha-cheddar-x-cheddar-05': 'cheddar-05.webp',
  'combos-combo-02': 'combo-02.webp',
  'combos-combo-03': 'combo-03.webp',
  'combos-combo-04': 'combo-04.webp',
  'combos-combo-06': 'combo-06.webp',
};

test('dez fotos confirmadas em nove alimentos, sem eleger foto principal do Artesanal 03', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto('/index.html');
  await expect(page.locator('.menu-section img[src^="img/produtos/"]')).toHaveCount(10);
  for (const [id, asset] of Object.entries(photos)) {
    const card = page.locator(`.menu-section [data-card]:has([data-add="${id}"])`);
    await expect(card).toHaveCount(1);
    const image = card.locator('img');
    await expect(image).toHaveAttribute('src', `img/produtos/${asset}`);
    await expect(image).toHaveAttribute('alt', /^Foto de /);
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(image => image.decode());
    expect(await image.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveCSS('object-fit', 'contain');
    expect((await page.request.get(`/img/produtos/${asset}`)).status()).toBe(200);
  }
  await expect(page.locator('#featured-grid img[src="img/produtos/combo-06.webp"]')).toHaveCount(1);
  const pair = page.locator('.menu-section [data-card]:has([data-add="artesanais-artesanal-03"]) .photo-pair');
  await expect(pair).toHaveAttribute('aria-label', /sem principal/);
  await expect(pair.locator('img')).toHaveCount(2);
  for (const [index, asset] of ['artesanal-03-1.webp', 'artesanal-03-2.webp'].entries()) {
    await expect(pair.locator('img').nth(index)).toHaveAttribute('src', `img/produtos/${asset}`);
    await pair.locator('img').nth(index).evaluate(image => image.decode());
    expect((await page.request.get(`/img/produtos/${asset}`)).status()).toBe(200);
  }
  const sizes = await pair.locator('img').evaluateAll(images => images.map(image => image.getBoundingClientRect().width));
  expect(Math.abs(sizes[0] - sizes[1])).toBeLessThan(1);
  for (const id of ['hamburgueres-x-duplo', 'combos-combo-07', 'linha-cheddar-x-cheddar-01']) {
    const image = page.locator(`.menu-section [data-card]:has([data-add="${id}"]) img`);
    await expect(image).not.toHaveAttribute('src', /img\/produtos\//);
  }
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  }
});
