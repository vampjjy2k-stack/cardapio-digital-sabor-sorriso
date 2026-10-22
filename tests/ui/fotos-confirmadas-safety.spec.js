import { test, expect } from '@playwright/test';

async function openApp(page) {
  await page.route('**/api/status', r => r.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
  await page.addInitScript(() => { window.open = url => { window.__openedURL = String(url); return null; }; });
  await page.goto('/index.html');
}

test('H2OH! mantém ID legado, foto de 500 ml e Limão no pedido sem envio', async ({ page }) => {
  await openApp(page);
  const add = page.locator('[data-add="bebidas-h2o-600ml"]');
  const card = page.locator('#bebidas [data-card]').filter({ has: add });
  await expect(card).toContainText('500 ml · Limão');
  await expect(card.locator('img')).toHaveAttribute('src', 'img/h2oh-limao-500ml.webp');
  await expect(card.locator('img')).toHaveAttribute('alt', /500 ml; Limão/);
  await add.click();
  await page.locator('#cart-toggle').click();
  await expect(page.locator('.cart-line')).toContainText('H2OH! - 500 ml - Limão');
  await expect(page.locator('#cart-total')).toHaveText('R$ 7,00');
  await page.getByLabel('Retirada', { exact: true }).check();
  await page.getByLabel('Pix', { exact: true }).check();
  await page.locator('#checkout-btn').click();
  const url = new URL(await page.evaluate(() => window.__openedURL));
  expect(url.hostname).toBe('wa.me');
  expect(url.searchParams.get('text')).toContain('H2OH! - 500 ml - Limão');
  expect(url.searchParams.get('text')).not.toContain('sabor a confirmar');
});

test('foto indisponível vira placeholder rotulado; Dogão não atribui proteína visualmente', async ({ page }) => {
  await page.route('**/img/produtos/x-duplo.webp', r => r.abort());
  await openApp(page);
  await page.locator('#search').fill('X Duplo');
  const card = page.locator('#hamburgueres [data-card]').filter({ hasText: 'X Duplo' });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.photo-unavailable')).toHaveText('Foto de exemplo não disponível');
  await expect(card.locator('img')).toHaveCount(0);
  await expect(card.locator('[data-price]')).toHaveText('R$ 26,00');
  for (const dog of await page.locator('#hot-dogs img[src="img/produtos/dogao-quente.webp"]').all()) {
    await expect(dog).toHaveAttribute('alt', 'Foto genérica de Dogão Quente — proteína não identificada na imagem');
  }
  await page.locator('#search').fill('');
  for (const width of [320, 360, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    const clipped = await page.locator('.card__thumb .photo-unavailable').evaluateAll(labels => labels.filter(label => {
      const r = label.getBoundingClientRect(), t = label.closest('.card__thumb').getBoundingClientRect();
      return r.width > 0 && (r.left < t.left - 1 || r.right > t.right + 1 || r.bottom > t.bottom + 1);
    }).length);
    expect(clipped).toBe(0);
    const overlapped = await page.locator('.card__media .photo-unavailable').evaluateAll(labels => labels.filter(label => {
      const button = label.closest('.card__media').querySelector('.add-btn');
      if (!button) return false;
      const r = label.getBoundingClientRect(), b = button.getBoundingClientRect();
      return r.width > 0 && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
    }).length);
    expect(overlapped).toBe(0);
  }
});
