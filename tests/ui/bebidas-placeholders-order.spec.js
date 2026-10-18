import { test, expect } from '@playwright/test';

test('fotos autorizadas por sabor, ícones sem associação e WhatsApp completo sem envio', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/status', r => r.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
  await page.addInitScript(() => { window.open = url => { window.__openedURL = url; return null; }; });
  await page.goto('/index.html');
  const fanta = page.locator('[data-group="fanta"]');
  for (const image of await page.locator('#sucos img, #vitaminas img').all()) {
    await expect(image).toHaveAttribute('src', /^img\/icones\//);
  }
  await expect(fanta.locator('img')).toHaveAttribute('src', 'img/fanta-uva-350ml.png');
  await fanta.getByLabel('Laranja', { exact: true }).check();
  await expect(fanta.locator('img')).toHaveAttribute('src', 'img/fanta-laranja-350ml.png');
  await expect(fanta.locator('img')).toHaveAttribute('alt', 'Foto de Fanta Laranja — Lata 350 ml');
  await fanta.locator('img').evaluate(image => image.decode());
  await expect(fanta.locator('img')).toHaveJSProperty('complete', true);
  await fanta.screenshot({ path: 'review/variantes-fanta-laranja-350ml-mobile.png' });
  await fanta.getByLabel('PET 2 L', { exact: true }).check();
  await expect(fanta.locator('img')).toHaveAttribute('src', 'img/icones/garrafa-2l.webp');
  await expect(fanta.locator('img')).toHaveAttribute('alt', /foto desta opção pendente/);
  await fanta.locator('[data-add]').click();
  await fanta.getByLabel('Uva', { exact: true }).check();
  await fanta.locator('[data-add]').click();
  await fanta.locator('[data-add]').click();
  await expect(page.locator('#toast')).not.toHaveClass(/is-visible/);
  await fanta.screenshot({ path: 'review/variantes-fanta-2l-mobile.png' });
  const coca = page.locator('[data-group="coca-cola"]');
  await coca.getByLabel('PET 600 ml', { exact: true }).check();
  await expect(coca.locator('img')).toHaveAttribute('src', 'img/coca-cola-600ml.png');
  await coca.getByLabel('PET 2 L', { exact: true }).check();
  await expect(coca.locator('img')).toHaveAttribute('src', 'img/coca-cola-2l.png');
  const vitamins = page.locator('[data-group="vitaminas"]');
  await vitamins.getByLabel('Maracujá ao Leite', { exact: true }).check();
  await vitamins.getByLabel('Copo 500ML', { exact: true }).check();
  await expect(vitamins.locator('img')).toHaveCount(0);
  await vitamins.screenshot({ path: 'review/variantes-vitaminas-mobile.png' });
  await page.reload();
  await page.locator('#cart-toggle').click();
  await expect(page.locator('.cart-line')).toHaveCount(2);
  const uva = page.locator('.cart-line').filter({ hasText: 'Uva' });
  const orange = page.locator('.cart-line').filter({ hasText: 'Laranja' });
  await expect(uva.locator('.qty__value')).toHaveText('2');
  await expect(orange.locator('.qty__value')).toHaveText('1');
  await expect(page.locator('#cart-subtotal')).toHaveText('R$ 39,00');
  await uva.getByRole('button', { name: /Diminuir quantidade/ }).click();
  await expect(orange.locator('.qty__value')).toHaveText('1');
  await expect(page.locator('#cart-subtotal')).toHaveText('R$ 26,00');
  await page.getByLabel('Retirada', { exact: true }).check();
  await page.getByLabel('Pix', { exact: true }).check();
  await expect(page.locator('#checkout-btn')).toBeEnabled();
  await expect(page.locator('#toast')).not.toHaveClass(/is-visible/);
  await page.locator('.drawer__body').evaluate(el => { el.scrollTop = 0; });
  await page.locator('#cart-list').screenshot({ path: 'review/variantes-linhas-carrinho-mobile.png' });
  await page.screenshot({ path: 'review/variantes-carrinho-mobile.png' });
  await page.locator('#checkout-btn').click();
  const url = new URL(await page.evaluate(() => window.__openedURL));
  const text = url.searchParams.get('text');
  expect(text).toMatch(/1x Fanta - PET 2 L - Uva/);
  expect(text).toMatch(/1x Fanta - PET 2 L - Laranja/);
  expect(text).not.toMatch(/confirmar preço|valor herdado/i);
  expect(text).toContain('Total: R$ 26,00');
  expect(url.hostname).toBe('wa.me');
});

test('sete fotos próprias exatas, incluindo Coca 2L, e pendências sem associação', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }));
  await page.goto('/index.html');
  const coca = page.locator('[data-group="coca-cola"]');
  const fanta = page.locator('[data-group="fanta"]');
  async function photo(root, src) {
    const image = root.locator('img');
    await expect(image).toHaveAttribute('src', src);
    await expect(image).toHaveAttribute('alt', /^Foto de /);
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(image => image.decode());
    expect(await image.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  }
  await photo(coca, 'img/coca-cola-lata.png');
  await expect(coca.locator('img')).toHaveAttribute('alt', 'Foto de Coca Cola — Lata (volume a confirmar)');
  await coca.getByLabel('PET 600 ml', { exact: true }).check();
  await photo(coca, 'img/coca-cola-600ml.png');
  await coca.getByLabel('PET 2 L', { exact: true }).check();
  await photo(coca, 'img/coca-cola-2l.png');
  await photo(fanta, 'img/fanta-uva-350ml.png');
  await fanta.getByLabel('Laranja', { exact: true }).check();
  await photo(fanta, 'img/fanta-laranja-350ml.png');
  await fanta.getByLabel('PET 2 L', { exact: true }).check();
  await expect(fanta.locator('img')).toHaveAttribute('src', 'img/icones/garrafa-2l.webp');
  const guarana = page.locator('#bebidas [data-card]').filter({ has: page.getByRole('heading', { name: 'Guaraná Antártica', exact: true }) });
  const kuat = page.locator('#bebidas [data-card]').filter({ has: page.getByRole('heading', { name: 'Kuat', exact: true }) });
  await photo(guarana, 'img/guarana-antarctica-350ml.png');
  await photo(kuat, 'img/kuat-2l.png');
  const h2oh = page.locator('#bebidas [data-card]').filter({ has: page.getByRole('heading', { name: 'H2OH!', exact: true }) });
  await expect(h2oh.locator('img')).toHaveAttribute('src', 'img/icones/garrafa-600.webp');
  await expect(h2oh.locator('[data-add]')).toHaveAttribute('data-add', 'bebidas-h2o-600ml');
  await expect(h2oh).toContainText('500 ml');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  }
});
