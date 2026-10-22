import { test, expect } from '@playwright/test';

async function openApp(page) {
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }));
  await page.addInitScript(() => {
    window.open = url => { window.__openedURL = String(url); return null; };
  });
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText('Aberto');
}

function card(page, name) {
  return page.locator('#combos [data-card]').filter({
    has: page.getByRole('heading', { name, exact: true }),
  });
}

test('treze combos exibem novos preços e pedido usa 48 + 65 + 32 sem envio', async ({ page }) => {
  await openApp(page);
  const prices = {
    'Combo 01': 25, 'Combo 02': 48, 'Combo 03': 65, 'Combo 04': 73,
    'Combo 05': 78, 'Combo 06': 113, 'Combo 07': 128, 'Combo 08': 98,
    'Mini 01': 32, 'Dupla Perfeita 02': 60, 'Bomba de Sabor 03': 103,
    'Explosão de Sabor 04': 138, 'Brutal 05': 152,
  };
  await expect(page.locator('#combos [data-card]')).toHaveCount(13);
  for (const [name, price] of Object.entries(prices)) {
    await expect(card(page, name).locator('[data-price]')).toHaveText(`R$ ${price},00`);
  }
  for (const name of ['Combo 02', 'Combo 03', 'Mini 01']) {
    await card(page, name).locator('[data-add]').click();
  }
  await page.reload();
  await page.locator('#cart-toggle').click();
  await expect(page.locator('.cart-line')).toHaveCount(3);
  await expect(page.locator('#cart-total')).toHaveText('R$ 145,00');
  await page.getByLabel('Retirada', { exact: true }).check();
  await page.getByLabel('Pix', { exact: true }).check();
  await page.locator('#checkout-btn').click();
  const url = new URL(await page.evaluate(() => window.__openedURL));
  expect(url.hostname).toBe('wa.me');
  const text = url.searchParams.get('text');
  for (const name of ['Combo 02', 'Combo 03', 'Mini 01']) expect(text).toContain(name);
  expect(text).toContain('Total: R$ 145,00');
});

test('Bimbo aparece só nos cinco Cheddars e Frango Fresh confirmados', async ({ page }) => {
  await openApp(page);
  const cheddar = page.locator('#linha-cheddar [data-card]');
  await expect(cheddar).toHaveCount(5);
  for (const item of await cheddar.all()) await expect(item).toContainText('pão Bimbo +');
  const traditional = page.locator('#hamburgueres [data-card]').filter({ hasNot: page.locator('[data-add="hamburgueres-frango-fresh"]') });
  for (const card of await traditional.all()) await expect(card).not.toContainText('Bimbo');
  await expect(page.locator('#artesanais')).not.toContainText('Bimbo');
  await expect(page.locator('#combos')).not.toContainText('Bimbo');
  await page.locator('#search').fill('Bimbo');
  await expect(page.locator('#search-results')).toHaveText('6 resultados encontrados.');
  await expect(page.locator('#linha-cheddar')).toBeVisible();
  await expect(page.locator('#hamburgueres')).toBeVisible();
  await expect(page.locator('#hamburgueres [data-card]:visible')).toHaveCount(1);
  await expect(page.locator('#hamburgueres [data-card]:visible')).toContainText('Frango Fresh');
  await expect(page.locator('#artesanais')).toBeHidden();
});
