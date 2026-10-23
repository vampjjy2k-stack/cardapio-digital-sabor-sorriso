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
async function placeholder(root) {
  await expect(root.locator('#product-photo img')).toHaveCount(0);
  await expect(root.locator('#product-photo .thumb-emoji')).toHaveAttribute('aria-label', /^Ilustração genérica de /);
  await expect(root.locator('#product-photo .photo-unavailable')).toHaveText('Foto de exemplo não disponível');
}

test('placeholder rotulado permanece em variantes sem foto antes e depois da seleção', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#sucos img')).toHaveCount(1);
  await expect(page.locator('#sucos .photo-disclaimer')).toHaveText('Imagem ilustrativa');
  await expect(page.locator('#vitaminas img')).toHaveAttribute('src', 'img/ilustracoes/catalogo/vitaminas-morango-ao-leite-copo-300ml.webp');
  await expect(page.locator('#vitaminas .photo-disclaimer')).toHaveText('Imagem ilustrativa');
  const coca = await product(page, 'coca-cola');
  await expect(coca.locator('#product-photo img')).toHaveAttribute('src', 'img/coca-cola-lata.png');
  await expect(coca.locator('#product-photo img')).toHaveAttribute('alt', 'Foto de Coca Cola — Lata 350 ml');
  for (const pack of ['Lata 350 ml', 'PET 600 ml', 'PET 2 L']) {
    await choose(page, 'coca-cola', null, pack);
    await expect(coca.locator('#product-photo img')).toHaveCount(1);
    await expect(coca.locator('#product-photo img')).toHaveAttribute('alt', `Foto de Coca Cola — ${pack}`);
    await coca.locator('#product-close').click(); await product(page, 'coca-cola');
  }
  await page.locator('#product-close').click();
  const fanta = await product(page, 'fanta');
  for (const [flavor, pack] of [['Uva', 'Lata 350 ml'], ['Laranja', 'Lata 350 ml'], ['Uva', 'PET 2 L']]) {
    await choose(page, 'fanta', flavor, pack);
    if (pack === 'PET 2 L') {
      await expect(fanta.locator('#product-photo img')).toHaveAttribute('src', `img/ilustracoes/catalogo/bebidas-fanta-2l-${flavor.toLowerCase()}.webp`);
      await expect(fanta.locator('#product-photo .photo-disclaimer')).toHaveText('Imagem ilustrativa');
    }
    else await expect(fanta.locator('#product-photo img')).toHaveAttribute('src', `img/fanta-${flavor.toLowerCase()}-350ml.png`);
  }
  await page.locator('#product-close').click();
  await expect(group(page, 'coca-cola')).toContainText(/Escolher|Coca-Cola/);
});

function group(page, key) { return page.locator(`[data-group="${key}"]`); }

test('cards com foto real e variantes confirmadas mantêm WhatsApp produto+sabor+volume', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#bebidas img')).toHaveCount(5);
  await expect(page.locator('#bebidas .thumb-emoji')).toHaveCount(0);
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
