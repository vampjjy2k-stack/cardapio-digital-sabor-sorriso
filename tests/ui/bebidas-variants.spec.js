import { test, expect } from '@playwright/test';

async function openApp(page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.route('**/api/status', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'open' }) }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, body: '' }));
  await page.addInitScript(() => {
    const guard = 'bebidas-variants-reset-v2';
    if (!sessionStorage.getItem(guard)) { localStorage.clear(); sessionStorage.setItem(guard, '1'); }
    window.__openedURL = null;
    window.open = url => { window.__openedURL = String(url); return null; };
  });
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText('Aberto');
  await page.getByRole('button', { name: /Bebidas/ }).click();
}
async function showBeveragesAfterReload(page) {
  await expect(page.locator('#store-status')).toContainText('Aberto');
  await page.getByRole('button', { name: /Bebidas/ }).click();
}
function group(page, key) { return page.locator(`[data-group="${key}"]`); }
function openButton(page, key) { return page.locator(`[data-open-beverage="${key}"]`); }
function dialog(page) { return page.locator('#product-dialog'); }
async function openProduct(page, key) { await openButton(page, key).click(); await expect(dialog(page)).toBeVisible(); }

// The old matrix indexes remain useful in tests, but selection now exercises dimensions.
async function choose(page, index, key = 'coca-cola') {
  const root = dialog(page);
  if (key === 'coca-cola') {
    await root.locator('input[name="product-pack"]').nth(index).check();
    return;
  }
  if (key === 'fanta') {
    const flavor = index % 2 === 0 ? 'Uva' : 'Laranja';
    const pack = index < 2 ? 'Lata 350 ml' : 'PET 2 L';
    await root.locator('input[name="product-flavor"][value="' + flavor + '"]').check();
    await root.locator('input[name="product-pack"][value="' + pack + '"]').check();
    return;
  }
  const flavors = ['Maracujá ao Leite', 'Morango ao Leite', 'Cupuaçu ao Leite', 'Graviola ao Leite'];
  await root.locator('input[name="product-flavor"][value="' + flavors[Math.floor(index / 2)] + '"]').check();
  await root.locator('input[name="product-pack"][value="' + (index % 2 ? 'Copo 500ML' : 'Copo 300ML') + '"]').check();
}
async function openCart(page) { await page.locator('#cart-toggle').click(); await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'false'); }

 test.describe('variantes de bebidas em modal', () => {
  test('cards compactos têm nome/foto e CTA escolher, sem opções inline', async ({ page }) => {
    await openApp(page);
    for (const key of ['coca-cola', 'fanta', 'vitaminas', 'sucos']) {
      const card = group(page, key);
      await expect(card).toHaveCount(1);
      await expect(card.locator('input')).toHaveCount(0);
      await expect(openButton(page, key)).toBeVisible();
      await expect(card.locator('.card__name, h3, h2').first()).toBeVisible();
      await expect(card.locator('img, .thumb-emoji').first()).toBeVisible();
    }
    await expect(group(page, 'vitaminas')).toContainText(/Copo 300ML|Copo 500ML/);
    await expect(group(page, 'sucos')).toContainText('Copo 500ML');
  });

  test('modal usa grupos flavor/pack, preço por opção, Coca sem default e Fanta incompleta desabilitada', async ({ page }) => {
    await openApp(page); await openProduct(page, 'coca-cola');
    await expect(dialog(page).locator('input[name="product-flavor"]')).toHaveCount(0);
    const packs = dialog(page).locator('input[name="product-pack"]');
    await expect(packs).toHaveCount(3);
    for (const input of await packs.all()) await expect(input).not.toBeChecked();
    await expect(dialog(page)).toContainText(/Lata 350 ml|PET 600 ml|PET 2 L/);
    await expect(dialog(page).locator('.product-option')).toHaveCount(3);
    await expect(page.locator('#product-add')).toBeDisabled();
    await page.locator('#product-close').click();
    await openProduct(page, 'fanta');
    await expect(dialog(page).locator('input[name="product-flavor"]')).toHaveCount(2);
    await expect(dialog(page).locator('input[name="product-pack"]')).toHaveCount(2);
    await expect(dialog(page).locator('input:checked')).toHaveCount(0);
    await dialog(page).locator('input[name="product-flavor"][value="Uva"]').check();
    await expect(page.locator('#product-add')).toBeDisabled();
    await expect(dialog(page).locator('input[name="product-pack"]')).toHaveCount(2);
    await expect(dialog(page).locator('.product-option').filter({ hasText: 'PET 2 L' })).toContainText('R$ 13,00');
  });

  test('Vitaminas exigem sabor e volume; suco tem sabor e pack 500ML informado automaticamente', async ({ page }) => {
    await openApp(page); await openProduct(page, 'vitaminas');
    await expect(dialog(page).locator('input[name="product-flavor"]')).toHaveCount(4);
    await expect(dialog(page).locator('input[name="product-pack"]')).toHaveCount(2);
    await dialog(page).locator('input[name="product-flavor"][value="Maracujá ao Leite"]').check();
    await expect(page.locator('#product-add')).toBeDisabled();
    await dialog(page).locator('input[name="product-pack"][value="Copo 500ML"]').check();
    await expect(page.locator('#product-add')).toBeEnabled();
    await expect(page.locator('#product-add')).toContainText(/Adicionar · R\$ 15,00/);
    await page.locator('#product-close').click(); await openProduct(page, 'sucos');
    await expect(dialog(page).locator('[data-dimension="pack"]')).toContainText('Copo 500ML');
    await expect(dialog(page).locator('input[name="product-flavor"]')).toHaveCount(2);
    await expect(page.locator('#product-add')).toBeDisabled();
  });

  test('troca seleção, foto e total; cancelar não altera; confirmar atualiza card', async ({ page }) => {
    await openApp(page); await openProduct(page, 'coca-cola'); await choose(page, 0);
    await expect(dialog(page).locator('input[name="product-pack"][value="Lata 350 ml"]')).toBeChecked();
    await expect(page.locator('#product-photo img')).toHaveCount(0);
    await expect(page.locator('#product-photo .thumb-emoji')).toHaveAttribute('aria-label', 'Ilustração genérica de Bebidas');
    await choose(page, 2); await expect(page.locator('#product-photo img')).toHaveCount(0);
    await expect(page.locator('#product-photo .thumb-emoji')).toHaveAttribute('aria-label', 'Ilustração genérica de Bebidas');
    await page.locator('#product-plus').click(); await expect(page.locator('#product-add')).toContainText(/total|R\$/);
    await page.locator('#product-close').click();
    await expect(group(page, 'coca-cola')).toContainText(/Escolher/);
    await openProduct(page, 'coca-cola'); await choose(page, 1); await page.locator('#product-add').click();
    await expect(group(page, 'coca-cola')).toContainText(/PET 600 ml/);
    await expect(group(page, 'coca-cola').locator('[data-beverage-summary]')).not.toContainText('Escolher');
  });

  test('adiciona e mescla variante igual, edição é atômica e CTA muda para salvar', async ({ page }) => {
    await openApp(page); await openProduct(page, 'coca-cola'); await choose(page, 1); await page.locator('#product-add').click();
    await openProduct(page, 'coca-cola'); await choose(page, 1); await page.locator('#product-plus').click(); await page.locator('#product-add').click();
    await openCart(page);
    let line = page.locator('.cart-line').filter({ hasText: 'Coca-Cola - PET 600 ml' });
    await expect(line).toHaveCount(1); await expect(line.locator('.qty__value')).toHaveText('3');
    const edit = line.locator('[data-action="edit"][data-key]'); await expect(edit).toHaveText('Editar'); await edit.click();
    await expect(dialog(page)).toBeVisible(); await expect(page.locator('#product-add')).toContainText(/Salvar ·/);
    await choose(page, 2); await page.locator('#product-plus').click(); await page.locator('#product-add').click();
    await expect(page.locator('.cart-line').filter({ hasText: 'Coca-Cola - PET 2 L' })).toHaveCount(1);
    await expect(page.locator('.cart-line').filter({ hasText: 'PET 600 ml' })).toHaveCount(0);
  });

  test('edição cancelada não remove linha, limite 99 é atômico e reload preserva', async ({ page }) => {
    await openApp(page); await openProduct(page, 'coca-cola'); await choose(page, 0); await page.locator('#product-add').click(); await openCart(page);
    const line = page.locator('.cart-line').filter({ hasText: 'Coca-Cola - Lata 350 ml' });
    await line.locator('[data-action="edit"]').click(); await page.locator('#product-close').click(); await expect(line).toBeVisible();
    await page.evaluate(() => localStorage.setItem('saborsorriso:carrinho:v1', JSON.stringify([{ id: 'bebidas-coca-cola-lata', opt: null, qty: 98 }])));
    await page.reload(); await showBeveragesAfterReload(page); await openProduct(page, 'coca-cola'); await choose(page, 0);
    await page.locator('#product-plus').click(); await page.locator('#product-plus').click(); await page.locator('#product-add').click();
    await expect(page.locator('#product-feedback')).toContainText('Limite de 99'); await expect(dialog(page)).toBeVisible(); await page.locator('#product-close').click(); await openCart(page);
    await expect(page.locator('.cart-line').filter({ hasText: 'Lata 350 ml' }).locator('.qty__value')).toHaveText('98');
  });

  test('foco Tab/Esc fica no modal e carrinho não consome teclas enquanto modal abre', async ({ page }) => {
    await openApp(page); await openProduct(page, 'fanta');
    const modal = dialog(page); await page.locator('#product-close').focus();
    for (let i = 0; i < 10; i += 1) { await page.keyboard.press('Tab'); await expect.poll(() => page.evaluate(() => document.activeElement?.closest('#product-dialog')?.id || '')).toBe('product-dialog'); }
    await page.keyboard.press('Escape'); await expect(modal).not.toBeVisible(); await expect(openButton(page, 'fanta')).toBeFocused();
    await page.locator('#cart-toggle').click(); await page.locator('#cart-close').click(); await openProduct(page, 'fanta'); await page.keyboard.press('Escape');
    await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'true');
  });

  test('320 e 390 px sem overflow e ação fixa ao rolar as opções', async ({ page }) => {
    for (const width of [320, 390]) {
      await openApp(page, width);
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await openProduct(page, 'vitaminas');
      await choose(page, 3, 'vitaminas');
      const button = page.locator('#product-add');
      const before = await button.boundingBox();
      await expect(dialog(page).locator('.product-dialog__footer')).toHaveCSS('position', 'sticky');
      await dialog(page).locator('.product-dialog__body').evaluate(element => element.scrollTo(0, element.scrollHeight));
      await expect.poll(() => dialog(page).locator('.product-dialog__body').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      const after = await button.boundingBox();
      expect(Math.abs(before.y - after.y)).toBeLessThan(1);
      expect(after.x).toBeGreaterThanOrEqual(0);
      expect(after.x + after.width).toBeLessThanOrEqual(width);
      await page.locator('#product-close').click();
    }
  });

  test('Fanta PET 2 L Uva e Laranja continuam separadas, R$ 13 cada, inclusive após recarregar', async ({ page }) => {
    await openApp(page);
    for (const flavor of ['Uva', 'Laranja']) {
      await openProduct(page, 'fanta');
      await dialog(page).locator(`input[name="product-flavor"][value="${flavor}"]`).check();
      await dialog(page).locator('input[name="product-pack"][value="PET 2 L"]').check();
      await expect(page.locator('#product-add')).toHaveText('Adicionar · R$ 13,00');
      await page.locator('#product-add').click();
    }
    await page.reload(); await openCart(page);
    await expect(page.locator('.cart-line')).toHaveCount(2);
    await expect(page.locator('#cart-list')).toContainText('Fanta - PET 2 L - Uva');
    await expect(page.locator('#cart-list')).toContainText('Fanta - PET 2 L - Laranja');
    await expect(page.locator('#cart-total')).toHaveText('R$ 26,00');
  });

  test('editar para variante já existente respeita limite sem perder nenhuma linha e faz merge ao reduzir', async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => localStorage.setItem('saborsorriso:carrinho:v1', JSON.stringify([
      { id: 'bebidas-coca-cola-lata', opt: null, qty: 98 },
      { id: 'bebidas-coca-cola-600ml', opt: null, qty: 2 },
    ])));
    await page.reload(); await showBeveragesAfterReload(page); await openCart(page);
    const original = page.locator('.cart-line').filter({ hasText: 'PET 600 ml' });
    await original.locator('[data-action="edit"]').click();
    await choose(page, 0); await page.locator('#product-add').click();
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#product-feedback')).toContainText('Limite de 99');
    await page.keyboard.press('Escape');
    await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'false');
    await expect(original.locator('.qty__value')).toHaveText('2');
    await expect(original.locator('[data-action="edit"]')).toBeFocused();
    await original.locator('[data-action="edit"]').click();
    await choose(page, 0); await page.locator('#product-minus').click(); await page.locator('#product-add').click();
    await expect(dialog(page)).not.toBeVisible();
    await expect(page.locator('.cart-line')).toHaveCount(1);
    await expect(page.locator('.cart-line .qty__value')).toHaveText('99');
    await expect(page.locator('#cart-close')).toBeFocused();
    await expect(page.locator('#cart-total')).toHaveText('R$ 693,00');
    await page.reload(); await openCart(page);
    await expect(page.locator('.cart-line .qty__value')).toHaveText('99');
  });
});
