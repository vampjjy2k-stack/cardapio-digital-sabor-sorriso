import { test, expect } from '@playwright/test';

async function openApp(page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.route('**/api/status', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'open' }),
  }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, body: '' }));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('pw-beverage-ui-clean')) {
      localStorage.clear();
      sessionStorage.setItem('pw-beverage-ui-clean', '1');
    }
    window.__openedURL = null;
    window.open = url => { window.__openedURL = url; return null; };
  });
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText('Aberto');
  await page.getByRole('button', { name: /Bebidas/ }).click();
}

function group(page, key) {
  return page.locator(`[data-group="${key}"]`);
}

async function openCart(page) {
  await page.locator('#cart-toggle').click();
  await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'false');
}

test.describe('variantes de bebidas', () => {
  test('renderiza os quatro grupos, controles dimensionais e labels selecionados', async ({ page }) => {
    await openApp(page);
    for (const key of ['coca-cola', 'fanta', 'vitaminas', 'sucos']) {
      await expect(group(page, key)).toHaveCount(1);
      await expect(group(page, key).locator('[data-price]')).toBeVisible();
      await expect(group(page, key).locator('[data-selected-label]')).toBeVisible();
      await expect(group(page, key).locator('[data-add]')).toBeVisible();
    }
    await expect(group(page, 'fanta').locator('input[data-dimension="flavor"]')).toHaveCount(2);
    await expect(group(page, 'fanta').locator('input[data-dimension="flavor"][value="Uva"]')).toBeChecked();
    await expect(group(page, 'fanta').locator('input[data-dimension="flavor"][value="Laranja"]')).toHaveCount(1);
    await expect(group(page, 'fanta').locator('input[data-dimension="pack"]')).toHaveCount(2);
    await expect(group(page, 'coca-cola').locator('input[data-dimension="pack"][value="PET 600 ml"]')).toHaveCount(1);
    await expect(group(page, 'coca-cola').locator('input[data-dimension="pack"][value="Lata (volume a confirmar)"]')).toHaveCount(1);
    await expect(group(page, 'vitaminas').locator('input[data-dimension="pack"]')).toHaveCount(2);
    await expect(group(page, 'sucos').locator('[data-price]')).toHaveText('R$ 9,00');
  });

  test('atualiza Fanta 2L por sabor com preço confirmado e cria duas linhas distintas após reload', async ({ page }) => {
    await openApp(page);
    const fanta = group(page, 'fanta');
    await fanta.locator('input[data-dimension="pack"][value="PET 2 L"]').check();
    await expect(fanta.locator('[data-price]')).toHaveText('R$ 13,00');
    await expect(fanta.locator('[data-beverage-note]')).toHaveText('Uva e Laranja: R$ 13,00 cada.');
    await expect(fanta).not.toContainText(/confirmar preço|valor herdado/i);
    await fanta.locator('input[data-dimension="flavor"][value="Uva"]').check();
    await fanta.locator('[data-add]').click();
    await fanta.locator('input[data-dimension="flavor"][value="Laranja"]').check();
    await expect(fanta.locator('[data-price]')).toHaveText('R$ 13,00');
    await fanta.locator('[data-add]').click();
    await openCart(page);
    const lines = page.locator('.cart-line').filter({ hasText: 'Fanta' });
    await expect(lines).toHaveCount(2);
    await expect(page.locator('#cart-total')).toHaveText('R$ 26,00');
    await expect(page.locator('#cart-list')).toContainText('Uva');
    await expect(page.locator('#cart-list')).toContainText('Laranja');
    await expect(page.locator('#cart-list')).not.toContainText(/confirmar preço|valor herdado/i);
    await page.reload();
    await openCart(page);
    await expect(page.locator('.cart-line').filter({ hasText: 'Fanta' })).toHaveCount(2);
    await expect(page.locator('#cart-total')).toHaveText('R$ 26,00');
  });

  test('seleciona Coca 600, H2OH! preserva ID antigo com meta 500, vitamina Maracujá 500 e adiciona suco', async ({ page }) => {
    await openApp(page);
    const coca = group(page, 'coca-cola');
    await coca.locator('input[data-dimension="pack"][value="PET 600 ml"]').check();
    await expect(coca.locator('[data-price]')).toHaveText('R$ 8,00');
    await coca.locator('[data-add]').click();
    const h2o = page.locator('[data-card]').filter({ hasText: 'H2OH!' }).first();
    await expect(h2o.locator('.card__name')).toHaveText('H2OH!');
    await expect(h2o).toContainText(/500 ml|500ML/i);
    await expect(h2o).toContainText(/sabor a confirmar/i);
    await expect(h2o.locator('[data-add]')).toHaveAttribute('data-add', 'bebidas-h2o-600ml');
    await expect(h2o.locator('[data-add]')).toHaveAttribute('aria-label', 'Adicionar H2OH! 500ML ao carrinho');
    await expect(h2o.locator('img')).toHaveAttribute('alt', 'Ícone ilustrativo de H2OH! — 500 ml; sabor a confirmar');
    await h2o.locator('[data-add]').click();
    const vit = group(page, 'vitaminas');
    await vit.locator('input[data-dimension="flavor"][value="Maracujá ao Leite"]').check();
    await vit.locator('input[data-dimension="pack"][value="Copo 500ML"]').check();
    await expect(vit.locator('[data-price]')).toHaveText('R$ 15,00');
    await vit.locator('[data-add]').click();
    await group(page, 'sucos').locator('[data-add]').click();
    await openCart(page);
    await expect(page.locator('#cart-total')).toHaveText('R$ 39,00');
    await expect(page.locator('#cart-list')).toContainText(/Maracujá.*Copo 500ML/);
    await expect(page.locator('#cart-list')).toContainText(/Suco de Maracujá|Suco de Acerola/);
  });

  test('não cria overflow em 320/390px e captura screenshots móveis das variantes', async ({ page }) => {
    for (const width of [320, 390]) {
      await openApp(page, width);
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      const fanta = group(page, 'fanta');
      const pack = fanta.locator('input[data-dimension="pack"][value="PET 2 L"]');
      await pack.focus();
      await page.keyboard.press('Space');
      await expect(pack).toBeChecked();
      await fanta.locator('[data-add]').click();
      await page.screenshot({ path: `review/variantes-mobile-${width}.png`, fullPage: true });
      await page.evaluate(() => localStorage.clear());
    }
  });

  test('intercepta WhatsApp sem envio externo e mantém interação por teclado', async ({ page }) => {
    await openApp(page, 390);
    const fanta = group(page, 'fanta');
    const pack = fanta.locator('input[data-dimension="pack"][value="PET 2 L"]');
    await pack.focus();
    await page.keyboard.press('Space');
    await expect(pack).toBeChecked();
    await fanta.locator('[data-add]').click();
    await page.evaluate(() => localStorage.setItem('saborsorriso:carrinho:v1', JSON.stringify([{ id: 'bebidas-fanta-2l', opt: null, flavor: 'Uva', qty: 1 }])));
    await page.reload();
    await openCart(page);
    await page.getByLabel('Retirada', { exact: true }).check();
    await page.getByLabel('Pix').check();
    await expect(page.locator('#checkout-btn')).toBeEnabled();
    await page.evaluate(() => { window.__openedURL = null; window.open = url => { window.__openedURL = String(url); return null; }; });
    await page.locator('#checkout-btn').click();
    const opened = await page.evaluate(() => window.__openedURL);
    expect(opened).toBeTruthy();
    const url = new URL(opened);
    expect(url.hostname).toBe('wa.me');
    expect(url.searchParams.get('text')).toContain('Fanta');
    expect(url.searchParams.get('text')).toContain('Total: R$ 13,00');
    expect(url.searchParams.get('text')).not.toMatch(/confirmar preço|valor herdado/i);
  });
});
