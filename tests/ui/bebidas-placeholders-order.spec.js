import { test, expect } from '@playwright/test';

async function openApp(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/status', r => r.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
  await page.addInitScript(() => {
    const guard = 'pw-photo-clean-v2';
    if (!sessionStorage.getItem(guard)) { localStorage.clear(); sessionStorage.setItem(guard, '1'); }
    window.open = url => { window.__openedURL = String(url); return null; };
  });
  await page.goto('/index.html');
  await page.getByRole('button', { name: /Bebidas/ }).click();
}
async function product(page, key) { await page.locator(`[data-open-beverage="${key}"]`).click(); await expect(page.locator('#product-dialog')).toBeVisible(); return page.locator('#product-dialog'); }
async function choose(page, key, flavor, pack) {
  const root = page.locator('#product-dialog');
  if (flavor) await root.locator(`input[name="product-flavor"][value="${flavor}"]`).check();
  if (pack) await root.locator(`input[name="product-pack"][value="${pack}"]`).check();
}
async function photo(root, src, alt = /^Foto de /) {
  const image = root.locator('#product-photo img');
  await expect(image).toHaveAttribute('src', src); await expect(image).toHaveAttribute('alt', alt);
  await image.evaluate(image => image.decode()); expect(await image.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
}

test('fotos são atualizadas por seleção confirmada e placeholders não inventam associação', async ({ page }) => {
  await openApp(page);
  for (const image of await page.locator('#sucos img, #vitaminas img').all()) await expect(image).toHaveAttribute('src', /^img\/icones\//);
  const coca = await product(page, 'coca-cola');
  for (const [pack, src] of [['Lata 350 ml', 'img/coca-cola-lata.png'], ['PET 600 ml', 'img/coca-cola-600ml.png'], ['PET 2 L', 'img/coca-cola-2l.png']]) {
    await choose(page, 'coca-cola', null, pack); await photo(coca, src); await coca.locator('#product-close').click(); await product(page, 'coca-cola');
  }
  await page.locator('#product-close').click();
  const fanta = await product(page, 'fanta');
  await choose(page, 'fanta', 'Uva', 'Lata 350 ml'); await photo(fanta, 'img/fanta-uva-350ml.png', 'Foto de Fanta Uva — Lata 350 ml');
  await choose(page, 'fanta', 'Laranja', 'Lata 350 ml'); await photo(fanta, 'img/fanta-laranja-350ml.png', 'Foto de Fanta Laranja — Lata 350 ml');
  await choose(page, 'fanta', 'Uva', 'PET 2 L');
  await expect(fanta.locator('#product-photo img')).toHaveCount(0);
  await expect(fanta.locator('#product-photo [role="img"]')).toHaveAttribute('aria-label', /foto desta embalagem pendente/);
  await page.locator('#product-close').click();
  await expect(group(page, 'coca-cola')).toContainText(/Escolher|Coca-Cola/);
});

function group(page, key) { return page.locator(`[data-group="${key}"]`); }

test('sete fotos próprias exatas, card reflete variante confirmada e WhatsApp usa produto+sabor+volume', async ({ page }) => {
  await openApp(page);
  for (const [key, src] of [['coca-cola', 'img/coca-cola-lata.png'], ['fanta', 'img/fanta-uva-350ml.png']]) {
    await expect(group(page, key).locator('img')).toHaveAttribute('src', src);
  }
  for (const [name, src] of [['Guaraná Antártica', 'img/guarana-antarctica-350ml.png'], ['Kuat', 'img/kuat-2l.png']]) await expect(page.locator('#bebidas [data-card]').filter({ hasText: name }).locator('img')).toHaveAttribute('src', src);
  await expect(page.locator('#bebidas [data-card]').filter({ hasText: 'H2OH!' }).locator('img')).toHaveAttribute('src', 'img/icones/garrafa-600.webp');
  const fanta = await product(page, 'fanta'); await choose(page, 'fanta', 'Uva', 'PET 2 L'); await fanta.locator('#product-plus').click(); await fanta.locator('#product-add').click();
  await expect(group(page, 'fanta')).toContainText('Uva'); await expect(group(page, 'fanta')).toContainText('PET 2 L');
  await product(page, 'fanta'); await choose(page, 'fanta', 'Laranja', 'Lata 350 ml'); await page.locator('#product-add').click();
  await page.reload(); await page.locator('#cart-toggle').click(); await expect(page.locator('.cart-line')).toHaveCount(2);
  const uva = page.locator('.cart-line').filter({ hasText: 'Fanta - PET 2 L - Uva' }); const orange = page.locator('.cart-line').filter({ hasText: 'Fanta Laranja - Lata 350 ml' });
  await expect(uva).toHaveCount(1); await expect(orange).toHaveCount(1); await expect(uva.locator('.qty__value')).toHaveText('2');
  await uva.locator('[data-action="edit"]').click();
  await choose(page, 'fanta', 'Laranja', 'PET 2 L');
  await expect(page.locator('#product-add')).toHaveText('Salvar · R$ 26,00');
  await page.locator('#product-add').click();
  await expect(uva).toHaveCount(0);
  await expect(page.locator('.cart-line').filter({ hasText: 'Fanta - PET 2 L - Laranja' }).locator('.qty__value')).toHaveText('2');
  await page.getByLabel('Retirada', { exact: true }).check(); await page.getByLabel('Pix', { exact: true }).check(); await page.locator('#checkout-btn').click();
  const url = new URL(await page.evaluate(() => window.__openedURL)); const text = url.searchParams.get('text');
  expect(text).toMatch(/2x Fanta - PET 2 L - Laranja/); expect(text).toMatch(/1x Fanta Laranja - Lata 350 ml/); expect(text).not.toContain('PET 2 L - Uva'); expect(text).not.toMatch(/confirmar preço|valor herdado/i); expect(url.hostname).toBe('wa.me');
});
