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

test('catálogo e destaques usam placeholders sem carregar fotos; assets preservados', async ({ page }) => {
  const imageRequests = [];
  page.on('request', request => { if (request.resourceType() === 'image') imageRequests.push(new URL(request.url()).pathname); });
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto('/index.html');
  await expect(page.locator('.menu-section img, #featured-grid img')).toHaveCount(0);
  for (const card of await page.locator('.menu-section [data-card], #featured-grid > li').all()) {
    await expect(card.locator('.thumb-emoji')).toHaveCount(1);
    await expect(card.locator('.thumb-emoji')).toHaveAttribute('aria-label', /^Ilustração genérica de /);
  }
  await expect(page.locator('.hero')).toHaveCSS('background-image', 'none');
  await expect(page.locator('.brand img')).toHaveAttribute('src', 'img/logo.webp');
  for (const width of [320, 360, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) window.scrollTo(0, y);
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  }
  expect(imageRequests).toEqual(['/img/logo.webp']);
  for (const asset of [...Object.values(photos), 'artesanal-03-1.webp', 'artesanal-03-2.webp']) {
    expect((await page.request.get(`/img/produtos/${asset}`)).status()).toBe(200);
  }
});
