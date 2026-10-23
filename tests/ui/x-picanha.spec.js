import { test, expect } from '@playwright/test';

for (const width of [320, 390, 1440]) {
  test(`Linha Picanha preserva preços e soma no carrinho em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }));
    await page.addInitScript(() => {
      localStorage.clear();
      window.open = () => { throw new Error('Este teste não deve abrir pedidos externos'); };
    });
    await page.goto('/index.html');
    await expect(page.locator('#store-status')).toContainText('Aberto');
    const section = page.locator('#linha-picanha');
    await expect(section.locator('[data-card]')).toHaveCount(4);
    await expect(section.locator('img')).toHaveCount(4);
    await expect(section.locator('img[src="img/ilustracoes/catalogo/linha-picanha-x-picanha-01.webp"]')).toHaveCount(1);
    await expect(section.locator('img[src="img/ilustracoes/catalogo/linha-picanha-x-picanha-02.webp"]')).toHaveCount(1);
    await expect(section.locator('img[src="img/ilustracoes/catalogo/linha-picanha-x-picanha-04.webp"]')).toHaveCount(1);
    const photo = section.locator('img[src="img/produtos/picanha-03.webp"]');
    await expect(photo).toHaveAttribute('src', 'img/produtos/picanha-03.webp');
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toHaveJSProperty('complete', true);
    expect(await photo.evaluate(img => img.naturalWidth)).toBe(540);
    await expect(section.locator('[data-card]').filter({ has: page.locator('[data-add="linha-picanha-x-picanha-03"]') }).locator('img')).toHaveCount(1);
    await expect(section.locator('.photo-unavailable')).toHaveCount(0);
    await expect(section.locator('.thumb-emoji')).toHaveCount(0);
    const prices = [19, 23, 36, 21];
    for (const [index, price] of prices.entries()) {
      const name = `X Picanha 0${index + 1}`;
      const card = section.locator('[data-card]').filter({ has: page.getByRole('heading', { name, exact: true }) });
      await expect(card.locator('[data-price]')).toHaveText(`R$ ${price},00`);
      await expect(card.locator('.card__desc')).toContainText(/^pão brioche \+ /);
      await expect(card.locator('.card__desc')).not.toContainText(/bimbo/i);
      await card.locator('[data-add]').click();
    }
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.locator('#search').fill('picanha');
    await expect(section.locator('[data-card]:visible')).toHaveCount(4);
    await page.locator('#cart-toggle').click();
    await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.cart-line')).toHaveCount(4);
    await expect(page.locator('#cart-total')).toHaveText('R$ 99,00');
    for (const [index, price] of prices.entries()) {
      const line = page.locator('.cart-line').filter({ hasText: `X Picanha 0${index + 1}` });
      await expect(line).toContainText(`R$ ${price},00`);
      await expect(line.locator('.qty__value')).toHaveText('1');
    }
  });
}
