import { test, expect } from '@playwright/test';

const OPEN = { status: 'open' };
const neighborhoods = [
  ['Capivari', 'R$ 9,00'],
  ['São Lourenço', 'R$ 4,00'],
  ['Favela', 'R$ 5,00'],
  ['Rua 12', 'R$ 5,00'],
  ['Parque Eldorado', 'R$ 7,00'],
  ['Ruas da 1 a porta de aço', 'R$ 6,00'],
  ['Figueira', 'R$ 5,00'],
  ['Loteamento', 'R$ 5,00'],
  ['Santa Cruz', 'R$ 12,00'],
  ['Cangulo', 'R$ 25,00'],
  ['Primavera', 'R$ 15,00'],
  ['Berra boi', 'R$ 8,00'],
];

async function openApp(page, status = OPEN) {
  await page.route('**/api/status', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(status),
  }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'text/css', body: '/* fonte do sistema nos testes offline */',
  }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, body: '' }));
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.__openedURL = null;
    window.open = url => { window.__openedURL = url; return null; };
  });
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText('Aberto');
}

async function openDelivery(page) {
  await page.getByRole('button', { name: /Adicionar X Bacon/ }).click();
  await page.locator('#cart-toggle').click();
  await page.getByLabel('Entrega', { exact: true }).check();
  await page.getByLabel('Pix', { exact: true }).check();
  await page.locator('#address-street').fill('Rua das Flores');
  await page.locator('#address-number').fill('123');
}

function pickerOption(page, name) {
  return page.locator(`#neighborhood-options > li[data-neighborhood="${name.replaceAll('"', '\\"')}"]`);
}

async function choose(page, name) {
  await page.locator('#neighborhood-trigger').click();
  const option = pickerOption(page, name);
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.locator('#neighborhood-name')).toHaveText(name);
  await expect(page.locator('#neighborhood-panel')).toBeHidden();
}

async function capture(page, path) {
  await expect(page.locator('#toast')).not.toHaveClass(/is-visible/);
  await expect(page.locator('#toast')).toHaveCSS('opacity', '0');
  await page.screenshot({ path });
}

test.describe('contrato e acessibilidade do picker de bairro', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await openApp(page);
    await openDelivery(page);
  });

  test('mantém select oculto e expõe trigger, listbox, opções separadas e taxas legíveis', async ({ page }) => {
    const select = page.locator('#address-neighborhood');
    const trigger = page.locator('#neighborhood-trigger');
    await expect(select).toHaveAttribute('tabindex', '-1');
    await expect(select).toHaveAttribute('aria-hidden', 'true');
    await expect(select).toBeHidden();
    await expect(select.locator('option')).toHaveCount(13);
    await expect(select.locator('option').first()).toHaveText('Selecione seu bairro');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-labelledby', 'neighborhood-label neighborhood-name neighborhood-fee');
    await expect(page.locator('#neighborhood-panel')).toBeHidden();

    await trigger.click();
    await expect(page.locator('#neighborhood-panel')).toBeVisible();
    await expect(page.locator('#neighborhood-options')).toHaveAttribute('role', 'listbox');
    await expect(page.locator('#neighborhood-options')).toHaveAttribute('aria-labelledby', 'neighborhood-label');
    await expect(page.locator('#neighborhood-options > li')).toHaveCount(12);
    for (let i = 0; i < neighborhoods.length; i++) {
      const [name, fee] = neighborhoods[i];
      const option = page.locator('#neighborhood-options > li').nth(i);
      await expect(option).toHaveAttribute('role', 'option');
      await expect(option).toHaveAttribute('tabindex', '-1');
      await expect(option).toHaveAttribute('data-neighborhood', name);
      await expect(option.locator('.neighborhood-picker__name')).toHaveText(name);
      await expect(option.locator('.neighborhood-picker__fee')).toHaveText(fee);
      await expect(option.locator('.neighborhood-picker__name')).not.toHaveCSS('text-overflow', 'ellipsis');
      await expect(option.locator('.neighborhood-picker__fee')).not.toHaveCSS('text-overflow', 'ellipsis');
    }
  });

  test('navega por setas, Home/End e typeahead sem confirmar até Enter ou Espaço', async ({ page }) => {
    const trigger = page.locator('#neighborhood-trigger');
    await trigger.click();
    const options = page.locator('#neighborhood-options > li');
    await expect(options.first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toBeFocused();
    await expect(page.locator('#address-neighborhood')).toHaveValue('');
    await page.keyboard.press('ArrowUp');
    await expect(options.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(options.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(options.first()).toBeFocused();
    await page.keyboard.type('sao lourenco');
    await expect(options.nth(1)).toBeFocused();
    await expect(page.locator('#address-neighborhood')).toHaveValue('');
    await page.keyboard.press('Enter');
    await expect(page.locator('#address-neighborhood')).toHaveValue('São Lourenço');
    await expect(trigger).toBeFocused();
    await expect(trigger.locator('#neighborhood-name')).toHaveText('São Lourenço');

    await trigger.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(page.locator('#address-neighborhood')).toHaveValue('Favela');
    await expect(trigger).toBeFocused();
  });

  test('Escape cancela, clique fora e Tab fecham sem prender o foco nem o drawer', async ({ page }) => {
    const trigger = page.locator('#neighborhood-trigger');
    await trigger.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.locator('#neighborhood-panel')).toBeHidden();
    await expect(page.locator('#address-neighborhood')).toHaveValue('');
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.locator('#address-street').click();
    await expect(page.locator('#neighborhood-panel')).toBeHidden();
    await trigger.click();
    await page.keyboard.press('Tab');
    await expect(page.locator('#neighborhood-panel')).toBeHidden();
    await expect(page.locator('#address-reference')).toBeFocused();
    await trigger.click();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#neighborhood-panel')).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'false');
  });

  test('toggle de entrega e retirada reflete estado e desabilita o trigger', async ({ page }) => {
    const trigger = page.locator('#neighborhood-trigger');
    await expect(trigger).toBeEnabled();
    await page.getByLabel('Retirada', { exact: true }).check();
    await expect(trigger).toBeDisabled();
    await expect(page.locator('#neighborhood-panel')).toBeHidden();
    await page.getByLabel('Entrega', { exact: true }).check();
    await expect(trigger).toBeEnabled();
    await choose(page, 'Capivari');
    await page.getByLabel('Retirada', { exact: true }).check();
    await expect(trigger).toBeDisabled();
    await page.getByLabel('Entrega', { exact: true }).check();
    await expect(trigger.locator('#neighborhood-name')).toHaveText('Capivari');
    await expect(page.locator('#address-neighborhood')).toHaveValue('Capivari');
  });

  test('lista alcança a última opção, cabe no drawer e tem alvos de toque de pelo menos 48px', async ({ page }) => {
    await page.locator('#neighborhood-trigger').click();
    const panel = page.locator('#neighborhood-panel');
    const drawer = page.locator('#cart-drawer');
    await page.locator('#neighborhood-options').evaluate(el => el.scrollTop = el.scrollHeight);
    await pickerOption(page, 'Berra boi').scrollIntoViewIfNeeded();
    await expect(pickerOption(page, 'Berra boi')).toBeInViewport();
    for (const locator of [page.locator('#neighborhood-trigger'), page.locator('#neighborhood-options > li')]) {
      const count = await locator.count();
      for (let i = 0; i < count; i++) {
        const box = await locator.nth(i).boundingBox();
        expect(box?.height, `alvo ${i} deve ter 48px`).toBeGreaterThanOrEqual(48);
      }
    }
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await drawer.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.locator('#neighborhood-trigger').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
});

test.describe('picker mobile em temas e toque', () => {
  for (const width of [320, 360]) {
    test(`não tem overflow e não trunca nomes/taxas em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openApp(page);
      await openDelivery(page);
      await page.locator('#neighborhood-trigger').click();
      for (const selector of ['#neighborhood-trigger', '#neighborhood-panel', '#neighborhood-options', '.neighborhood-picker__name', '.neighborhood-picker__fee']) {
        const matches = page.locator(selector);
        for (let i = 0; i < await matches.count(); i++) {
          const locator = matches.nth(i);
          await expect(locator).not.toHaveCSS('text-overflow', 'ellipsis');
          expect(await locator.evaluate(el => el.scrollWidth <= el.clientWidth && (el.id === 'neighborhood-options' || el.scrollHeight <= el.clientHeight))).toBe(true);
        }
      }
      expect(await page.locator('.drawer__body').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.locator('#cart-close').click();
      await page.locator('#theme-toggle').click();
      await page.locator('#cart-toggle').click();
      await page.locator('#neighborhood-trigger').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      expect(await page.locator('.drawer__body').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await pickerOption(page, 'Ruas da 1 a porta de aço').focus();
      await pickerOption(page, 'Ruas da 1 a porta de aço').scrollIntoViewIfNeeded();
      await capture(page, `review/bairro-picker-${width}-light.png`);
    });

    test(`drawer de checkout mantém seções, alvos e resumo utilizáveis em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openApp(page);
      await openDelivery(page);
      const drawer = page.locator('#cart-drawer');
      await expect(page.locator('#checkout-fields')).toBeVisible();
      await expect(page.locator('#address-fields')).toBeVisible();
      await expect(page.locator('#checkout-review')).toBeVisible();
      await expect(page.locator('#checkout-review-title')).toHaveText('Resumo do pedido');
      await expect(page.locator('#drawer__body, .drawer__body')).toHaveCount(1);
      await expect(page.locator('.drawer__footer')).toBeVisible();
      await expect(page.locator('#checkout-hint')).toBeAttached();
      await expect(page.locator('#checkout-btn')).toBeAttached();
      await expect(page.locator('.checkout-caption')).toBeVisible();
      for (const selector of [
        '#neighborhood-trigger', '#address-street', '#address-number', '#address-reference',
        'input[name="delivery-type"] + span', 'input[name="payment-method"] + span', '#order-notes',
      ]) {
        const item = page.locator(selector).first();
        const box = await item.boundingBox();
        expect(box?.height, `${selector} deve ter alvo legível`).toBeGreaterThanOrEqual(48);
      }
      expect(await drawer.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect(await page.locator('.drawer__body').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.locator('.drawer__body').evaluate(el => el.scrollTop = 0);
      await capture(page, `review/checkout-${width}-escuro-entrega.png`);
      await page.locator('#neighborhood-trigger').click();
      await pickerOption(page, 'Ruas da 1 a porta de aço').focus();
      await pickerOption(page, 'Ruas da 1 a porta de aço').scrollIntoViewIfNeeded();
      await capture(page, `review/bairro-picker-${width}-escuro-aberto.png`);
      await pickerOption(page, 'Ruas da 1 a porta de aço').click();
      await page.locator('#neighborhood-trigger').scrollIntoViewIfNeeded();
      await capture(page, `review/bairro-picker-${width}-escuro-selecionado.png`);
      await page.getByLabel('Pix', { exact: true }).check();
      await page.locator('#order-notes').fill('sem cebola');
      await page.locator('#checkout-review').scrollIntoViewIfNeeded();
      await capture(page, `review/bairro-picker-${width}-escuro-resumo.png`);
      await page.locator('#cart-close').click();
      await page.locator('#theme-toggle').click();
      await page.locator('#cart-toggle').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.locator('#checkout-review').scrollIntoViewIfNeeded();
      await capture(page, `review/bairro-picker-${width}-claro-resumo.png`);
    });

    test(`checkout e lista continuam acessíveis em ${width}px com altura de 640px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 640 });
      await openApp(page);
      await openDelivery(page);
      await page.locator('#neighborhood-trigger').tap();
      await pickerOption(page, 'Berra boi').scrollIntoViewIfNeeded();
      await pickerOption(page, 'Berra boi').tap();
      await expect(page.locator('#cart-total')).toHaveText('R$ 23,00');
      await page.locator('#checkout-review').scrollIntoViewIfNeeded();
      await expect(page.locator('#checkout-review')).toBeInViewport();
      await expect(page.locator('#checkout-btn')).toBeInViewport();
      const button = await page.locator('#checkout-btn').boundingBox();
      expect(button.y + button.height).toBeLessThanOrEqual(640);
      for (const selector of ['#cart-drawer', '.drawer__body', '#checkout-review']) {
        expect(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      }
      await capture(page, `review/checkout-${width}x640-resumo.png`);
    });
  }

  test.use({ hasTouch: true });
  test('toque em opção confirma pelo locator.tap quando disponível', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await openApp(page);
    await openDelivery(page);
    await page.locator('#neighborhood-trigger').tap();
    await pickerOption(page, 'Capivari').tap();
    await expect(page.locator('#address-neighborhood')).toHaveValue('Capivari');
    await expect(page.locator('#neighborhood-trigger')).toHaveAttribute('aria-expanded', 'false');
  });
});

test('todos os 12 bairros atualizam cálculo e mensagem WhatsApp sem envio externo', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await openApp(page);
  await openDelivery(page);
  for (const [name, fee] of neighborhoods) {
    await choose(page, name);
    const feeNumber = Number(fee.replace('R$ ', '').replace('.', '').replace(',', '.'));
    const total = (15 + feeNumber).toFixed(2).replace('.', ',');
    await expect(page.locator('#cart-delivery-fee')).toHaveText(`+ ${fee}`);
    await expect(page.locator('#cart-total')).toHaveText(`R$ ${total}`);
    await page.locator('#checkout-btn').click();
    const url = new URL(await page.evaluate(() => window.__openedURL));
    expect(url.hostname).toBe('wa.me');
    expect(url.searchParams.get('text')).toContain(`Rua das Flores, 123 - ${name}`);
    expect(url.searchParams.get('text')).toContain(`Total: R$ ${total}`);
  }
});
