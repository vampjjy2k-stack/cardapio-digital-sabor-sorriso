import { test, expect } from '@playwright/test';

async function offline(page) {
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '' }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
  await page.addInitScript(() => {
    localStorage.clear();
    window.__openedURL = null;
    window.open = url => { window.__openedURL = url; return null; };
  });
}
const respond = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
async function readyCart(page) {
  const product = page.locator('[data-card]').filter({ has: page.getByRole('heading', { name: 'X Bacon', exact: true }) }).first();
  await product.locator('[data-add]').click();
  await page.locator('#cart-toggle').click();
  await page.getByLabel('Retirada', { exact: true }).check();
  await page.getByLabel('Pix', { exact: true }).check();
}
async function assertBlocked(page) {
  await expect(page.locator('#checkout-btn')).toBeDisabled();
  await expect(page.locator('#checkout-hint')).toContainText('Status não confirmado');
  // Exercita também o guard, não somente o atributo disabled.
  await page.evaluate(() => checkout());
  expect(await page.evaluate(() => window.__openedURL)).toBeNull();
}

for (const mode of ['503', 'invalid', 'degraded', 'malformed', 'network']) {
  test(`P1 público: ${mode} nunca assume aberta e bloqueia envio`, async ({ page }) => {
    await offline(page);
    await page.route('**/api/status', route => {
      if (mode === 'network') return route.abort('failed');
      if (mode === 'malformed') return route.fulfill({ status: 200, contentType: 'application/json', body: '{invalid' });
      return respond(route, mode === '503' ? 503 : 200,
        mode === '503' ? { status: 'unavailable' } : mode === 'degraded' ? { status: 'open', degraded: true } : { status: 'unknown' });
    });
    await page.goto('/index.html');
    await expect(page.locator('#store-status')).toContainText('Status indisponível');
    await expect(page.locator('#store-banner')).toBeVisible();
    await expect(page.locator('#store-banner')).toContainText('Não foi possível confirmar');
    await readyCart(page);
    await assertBlocked(page);
  });
}

test('P1 público: demora bloqueia enquanto verifica e timeout permanece indisponível', async ({ page }) => {
  await offline(page);
  await page.route('**/api/status', async route => {
    await new Promise(resolve => setTimeout(resolve, 6500));
    await respond(route, 200, { status: 'open' }).catch(() => {});
  });
  await page.goto('/index.html');
  await readyCart(page);
  await expect(page.locator('#checkout-btn')).toBeDisabled();
  await expect(page.locator('#store-status')).toContainText('Status indisponível', { timeout: 9000 });
  await assertBlocked(page);
});

test('P1 público: aberta → falha bloqueia, fechada continua bloqueada e recuperação aberta libera', async ({ page }) => {
  await offline(page);
  let state = 'open';
  await page.route('**/api/status', r => respond(r, state === 'unavailable' ? 503 : 200, { status: state }));
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText('Aberto');
  await readyCart(page);
  await expect(page.locator('#checkout-btn')).toBeEnabled();
  state = 'unavailable';
  await page.evaluate(() => loadStoreStatus());
  await assertBlocked(page);
  state = 'closed';
  await page.evaluate(() => loadStoreStatus());
  await expect(page.locator('#checkout-btn')).toBeDisabled();
  state = 'open';
  await page.evaluate(() => loadStoreStatus());
  await expect(page.locator('#checkout-btn')).toBeEnabled();
  await page.locator('#checkout-btn').click();
  expect(new URL(await page.evaluate(() => window.__openedURL)).hostname).toBe('wa.me');
});

test('P1 público: resposta aberta atrasada não sobrescreve falha de consulta mais nova', async ({ page }) => {
  await offline(page);
  let hold = false;
  let held;
  let count = 0;
  await page.route('**/api/status', r => {
    if (!hold) return respond(r, 200, { status: 'open' });
    if (++count === 1) { held = r; return; }
    return respond(r, 503, { status: 'unavailable' });
  });
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText('Aberto');
  await readyCart(page);
  await expect(page.locator('#checkout-btn')).toBeEnabled();
  hold = true;
  await page.evaluate(() => { window.__refresh = loadStoreStatus(); });
  await expect.poll(() => Boolean(held)).toBe(true);
  await page.evaluate(() => loadStoreStatus());
  await respond(held, 200, { status: 'open' });
  await page.evaluate(() => window.__refresh);
  await expect(page.locator('#store-status')).toContainText('Status indisponível');
  await assertBlocked(page);
});

for (const mode of ['503', 'invalid', 'network']) {
  test(`P1 admin: ${mode} não exibe aberta nem habilita alternância`, async ({ page }) => {
    await offline(page);
    await page.route('**/api/session', r => respond(r, 200, { authenticated: true }));
    await page.route('**/api/status', r => mode === 'network' ? r.abort('failed') : respond(r, mode === '503' ? 503 : 200, { status: mode === '503' ? 'unavailable' : 'unknown' }));
    await page.goto('/admin.html');
    await expect(page.locator('#panel-section')).toBeVisible();
    await expect(page.locator('#status-label')).toHaveText('Status INDISPONÍVEL');
    await expect(page.locator('#toggle-btn')).toBeDisabled();
    await expect(page.locator('#panel-error')).toBeVisible();
  });
}

test('P1 admin: erro de gravação não anuncia sucesso ou mantém estado aberto', async ({ page }) => {
  await offline(page);
  await page.route('**/api/session', r => respond(r, 200, { authenticated: true }));
  await page.route('**/api/status', r => r.request().method() === 'PUT'
    ? respond(r, 503, { error: 'Serviço temporariamente indisponível.' }) : respond(r, 200, { status: 'open' }));
  await page.goto('/admin.html');
  await expect(page.locator('#status-label')).toHaveText('Loja ABERTA');
  await page.locator('#toggle-btn').click();
  await expect(page.locator('#status-label')).toHaveText('Status INDISPONÍVEL');
  await expect(page.locator('#toggle-btn')).toBeDisabled();
});

test('P1 admin: estados válidos continuam permitindo alternar', async ({ page }) => {
  await offline(page);
  let state = 'closed';
  await page.route('**/api/session', r => respond(r, 200, { authenticated: true }));
  await page.route('**/api/status', async r => {
    if (r.request().method() === 'PUT') state = r.request().postDataJSON().status;
    await respond(r, 200, { success: true, status: state });
  });
  await page.goto('/admin.html');
  await expect(page.locator('#status-label')).toHaveText('Loja FECHADA');
  await page.locator('#toggle-btn').click();
  await expect(page.locator('#status-label')).toHaveText('Loja ABERTA');
  await expect(page.locator('#toggle-btn')).toBeEnabled();
});
