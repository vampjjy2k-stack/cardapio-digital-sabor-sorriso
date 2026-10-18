import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const adminHTML = await readFile(new URL('../../public/admin.html', import.meta.url), 'utf8');
const evidenceDir = process.env.ADMIN_SHORTCUT_EVIDENCE_DIR;

async function openApp(page, status = 'open', { clock = true } = {}) {
  const apiRequests = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) {
      apiRequests.push({ path: new URL(request.url()).pathname, method: request.method() });
    }
  });
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }));
  await page.route('**/api/status', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ status }),
  }));
  await page.route('**/api/session', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ authenticated: false }),
  }));
  // O servidor estático da suíte não resolve a rota limpa do Pages.
  // Apenas entrega o HTML existente: admin.js e a checagem de sessão são reais.
  await page.route('**/admin', route => route.fulfill({ contentType: 'text/html', body: adminHTML }));
  if (clock) {
    await page.clock.install({ time: new Date('2026-10-18T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-18T12:00:01Z'));
  }
  await page.goto('/index.html');
  await expect(page.locator('#store-status .store-status__text')).toHaveText(status === 'open' ? 'Aberto agora' : 'Fechado');
  return apiRequests;
}

function assertReadOnly(requests) {
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every(request => request.method === 'GET')).toBe(true);
  expect(requests.every(request => ['/api/status', '/api/session'].includes(request.path))).toBe(true);
}

async function mouseDown(page, button = 'left') {
  const bounds = await page.locator('#store-status').boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down({ button });
}

async function expectUnchanged(page, requests, status = 'open') {
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#store-status')).not.toHaveClass(/is-holding/);
  await expect(page.locator('#store-status .store-status__text')).toHaveText(status === 'open' ? 'Aberto agora' : 'Fechado');
  expect(await page.evaluate(() => ({ storeOpen, statusState }))).toEqual({ storeOpen: status === 'open', statusState: 'ok' });
  assertReadOnly(requests);
}

async function expectLogin(page, requests) {
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator('#login-section')).toBeVisible();
  await expect(page.locator('#panel-section')).toBeHidden();
  await expect(page.locator('#password')).toBeFocused();
  expect(requests).toContainEqual({ path: '/api/session', method: 'GET' });
  assertReadOnly(requests);
}

for (const status of ['open', 'closed']) {
  test(`mouse: hold de 1500 ms abre apenas o login, loja ${status}`, async ({ page }) => {
    const requests = await openApp(page, status);
    await mouseDown(page);
    await expect(page.locator('#store-status')).toHaveClass(/is-holding/);
    await page.clock.fastForward(1499);
    await expect(page).toHaveURL(/\/index\.html$/);
    expect(await page.evaluate(() => storeOpen)).toBe(status === 'open');
    await page.clock.fastForward(1);
    await page.mouse.up();
    await expectLogin(page, requests);
  });

  test(`clique curto não navega nem muda status, loja ${status}`, async ({ page }) => {
    const requests = await openApp(page, status);
    await page.locator('#store-status').click();
    await page.clock.fastForward(2000);
    await expectUnchanged(page, requests, status);
  });
}

for (const cancel of ['soltar em 1499 ms', 'pointercancel', 'perda de captura', 'sair do alvo', 'Escape', 'blur', 'aba oculta']) {
  test(`cancela antes do prazo: ${cancel}`, async ({ page }) => {
    const requests = await openApp(page);
    await mouseDown(page);
    await page.clock.fastForward(1499);
    if (cancel === 'soltar em 1499 ms') await page.mouse.up();
    if (cancel === 'pointercancel') await page.locator('#store-status').dispatchEvent('pointercancel', { pointerId: 1 });
    if (cancel === 'perda de captura') await page.evaluate(() => document.querySelector('#store-status').releasePointerCapture(1));
    if (cancel === 'sair do alvo') await page.mouse.move(5, 200);
    if (cancel === 'Escape') await page.keyboard.press('Escape');
    if (cancel === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    if (cancel === 'aba oculta') await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(2000);
    await page.mouse.up();
    await expectUnchanged(page, requests);
  });
}

test('cancelar não acumula tempo: novo hold exige novamente 1500 ms', async ({ page }) => {
  const requests = await openApp(page);
  await mouseDown(page);
  await page.clock.fastForward(1000);
  await page.mouse.up();
  await mouseDown(page);
  await page.clock.fastForward(1499);
  await expect(page).toHaveURL(/\/index\.html$/);
  await page.clock.fastForward(1);
  await page.mouse.up();
  await expectLogin(page, requests);
});

test('botão direito não inicia hold nem navega', async ({ page }) => {
  const requests = await openApp(page);
  await mouseDown(page, 'right');
  await page.clock.fastForward(2000);
  await page.mouse.up({ button: 'right' });
  await expectUnchanged(page, requests);
});

for (const key of ['Enter', 'Space']) {
  test(`alternativa acessível: ${key} abre login sem hold`, async ({ page }) => {
    const requests = await openApp(page);
    await page.keyboard.press('Tab'); // pular para o cardápio
    await page.keyboard.press('Tab'); // marca
    await page.keyboard.press('Tab'); // indicador
    const button = page.getByRole('button', { name: /Aberto agora.*acessar login administrativo/ });
    await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleDescription(/segure por 1,5 segundo ou use Enter ou Espaço.*não altera o status/);
    expect(await button.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
    await page.keyboard.press(key);
    await expectLogin(page, requests);
  });
}

test('ativação assistiva sem evento de ponteiro abre o login', async ({ page }) => {
  const requests = await openApp(page);
  await page.locator('#store-status').evaluate(node => node.click());
  await expectLogin(page, requests);
});

test.describe('touch real no Chromium mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const action of ['tap', 'hold', 'cancel']) {
    test(`touch ${action}: preserva status e autenticação`, async ({ page }) => {
      const requests = await openApp(page);
      const target = page.locator('#store-status');
      if (action === 'tap') {
        await target.tap();
        await page.clock.fastForward(2000);
        await expectUnchanged(page, requests);
        return;
      }
      const bounds = await target.boundingBox();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
      await expect(target).toHaveClass(/is-holding/);
      await page.clock.fastForward(1499);
      await expect(page).toHaveURL(/\/index\.html$/);
      if (action === 'cancel') {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await page.clock.fastForward(2000);
        await expectUnchanged(page, requests);
      } else {
        await page.clock.fastForward(1);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expectLogin(page, requests);
      }
      await cdp.detach();
    });
  }
});

for (const width of [320, 390, 1440]) {
  test(`responsividade, foco e captura da interação em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    const requests = await openApp(page);
    const target = page.locator('#store-status');
    const bounds = await target.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    for (const theme of ['dark', 'light']) {
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      await target.focus();
      await expect(target).toHaveAccessibleName(/Aberto agora.*acessar login administrativo/);
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await mouseDown(page);
      await page.clock.fastForward(750);
      await expect(page.locator('.store-admin-hint')).toBeVisible();
      const hintBounds = await page.locator('.store-admin-hint').boundingBox();
      expect(hintBounds.x).toBeGreaterThanOrEqual(0);
      expect(hintBounds.x + hintBounds.width).toBeLessThanOrEqual(width);
      if (evidenceDir && width !== 320) await page.screenshot({ path: `${evidenceDir}/${width === 390 ? 'mobile' : 'desktop'}-${theme}-hold.png` });
      await page.mouse.up();
      await page.clock.fastForward(2000);
      await expectUnchanged(page, requests);
    }
    await target.focus();
    if (evidenceDir && width !== 320) await page.screenshot({ path: `${evidenceDir}/${width === 390 ? 'mobile' : 'desktop'}-keyboard-focus.png` });
    await page.keyboard.press('Enter');
    await expectLogin(page, requests);
    if (evidenceDir && width !== 320) await page.screenshot({ path: `${evidenceDir}/${width === 390 ? 'mobile' : 'desktop'}-login.png` });
  });
}

test('hold com temporizador real também chega ao login', async ({ page }) => {
  const requests = await openApp(page, 'open', { clock: false });
  await mouseDown(page);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 4000 });
  await page.mouse.up();
  await expectLogin(page, requests);
});
