import { test, expect } from '@playwright/test';

const INITIAL_VERSION = '0123456789abcdef0123456789abcdef01234567';
const UPDATED_VERSION = 'fedcba9876543210fedcba9876543210fedcba98';
const OPEN = { status: 'open' };

async function configurePage(page, state) {
  let checks = 0;
  let navigations = 0;
  await page.route('**/api/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(OPEN),
  }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'text/css', body: '/* fontes desativadas nos testes */',
  }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, body: '' }));
  await page.route('**/build-info.js', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `window.SABOR_APP_VERSION = ${JSON.stringify(state.version)};`,
  }));
  await page.route('**/version.json*', route => {
    checks += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: state.version }),
    });
  });
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('version-update-test-clean')) {
      localStorage.clear();
      sessionStorage.setItem('version-update-test-clean', '1');
    }
    window.open = () => null;
  });
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) navigations += 1;
  });
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText('Aberto');
  await expect.poll(() => checks).toBeGreaterThan(0);
  await page.waitForTimeout(50);
  return {
    getChecks: () => checks,
    getNavigations: () => navigations,
  };
}

async function addXBacon(page) {
  const card = page.locator('[data-card]').filter({
    has: page.getByRole('heading', { name: 'X Bacon', exact: true }),
  }).first();
  await card.getByRole('button', { name: /Adicionar X Bacon/ }).click();
}

async function chooseNeighborhood(page, name) {
  await page.locator('#neighborhood-trigger').click();
  await page.getByRole('option', { name: new RegExp(`^${name}\\s+R\\$`) }).click();
}

test('ao voltar ao foco, espera o carrinho fechar e restaura pedido, checkout e referência', async ({ page }) => {
  const state = { version: INITIAL_VERSION };
  const tracker = await configurePage(page, state);
  const startingNavigations = tracker.getNavigations();

  await addXBacon(page);
  await page.locator('#cart-toggle').click();
  await page.getByLabel('Entrega', { exact: true }).check();
  await page.getByLabel('Cartão').check();
  await page.locator('#address-street').fill('Rua das Flores');
  await page.locator('#address-number').fill('123');
  await chooseNeighborhood(page, 'Capivari');
  await page.locator('#address-reference').fill('portão azul');
  await page.locator('#order-notes').fill('sem cebola');

  state.version = UPDATED_VERSION;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => tracker.getChecks()).toBeGreaterThan(1);
  await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#address-reference')).toHaveValue('portão azul');
  await expect(page.locator('#order-notes')).toHaveValue('sem cebola');
  expect(tracker.getNavigations()).toBe(startingNavigations);

  const reload = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await page.locator('#cart-close').click();
  await reload;
  await page.locator('#cart-toggle').click();

  await expect(page.locator('.cart-line')).toContainText('X Bacon');
  await expect(page.locator('#address-street')).toHaveValue('Rua das Flores');
  await expect(page.locator('#address-number')).toHaveValue('123');
  await expect(page.locator('#address-reference')).toHaveValue('portão azul');
  await expect(page.locator('#order-notes')).toHaveValue('sem cebola');
  await expect(page.getByLabel('Entrega', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Cartão')).toBeChecked();
});

test('a recarga aguarda salvar a personalização de produto antes de atualizar', async ({ page }) => {
  const state = { version: INITIAL_VERSION };
  const tracker = await configurePage(page, state);
  const vitamins = page.locator("[data-group='vitaminas']");
  await vitamins.locator('[data-open-beverage="vitaminas"]').click();
  const product = page.locator('#product-dialog');
  await expect(product).toBeVisible();
  await product.locator('input[name="product-flavor"][value="Morango ao Leite"]').check();
  await product.locator('input[name="product-pack"][value="Copo 500ML"]').check();

  const startingNavigations = tracker.getNavigations();
  state.version = UPDATED_VERSION;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => tracker.getChecks()).toBeGreaterThan(1);
  await expect(product).toBeVisible();
  expect(tracker.getNavigations()).toBe(startingNavigations);

  const reload = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await product.locator('#product-add').click();
  await reload;
  await page.locator('#cart-toggle').click();
  await expect(page.locator('.cart-line')).toContainText('Morango ao Leite');
  await expect(page.locator('.cart-line')).toContainText('Copo 500ML');
});

test('uma aba ociosa detecta a nova versão pelo polling periódico', async ({ page }) => {
  await page.clock.install();
  const state = { version: INITIAL_VERSION };
  const tracker = await configurePage(page, state);
  const startingNavigations = tracker.getNavigations();
  state.version = UPDATED_VERSION;

  await page.clock.runFor(60_500);
  await expect.poll(() => tracker.getNavigations()).toBe(startingNavigations + 1);
  await expect.poll(() => tracker.getChecks()).toBeGreaterThan(1);
});
