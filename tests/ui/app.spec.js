import { test, expect } from '@playwright/test';

const OPEN = { status: 'open' };
const CLOSED = { status: 'closed' };

async function openApp(page, status = OPEN) {
  await page.route('**/api/status', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(status),
  }));
  // A suíte isola fontes e status: não é um teste de integração da Cloudflare.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'text/css', body: '/* fonte do sistema nos testes offline */',
  }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, body: '' }));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('pw-ui-clean')) {
      localStorage.clear();
      sessionStorage.setItem('pw-ui-clean', '1');
    }
    window.__openedURL = null;
    window.open = url => { window.__openedURL = url; return null; };
  });
  await page.goto('/index.html');
  await expect(page.locator('#store-status')).toContainText(status.status === 'closed' ? 'Fechado' : 'Aberto');
}

function card(page, name) {
  return page.locator('[data-card]').filter({ has: page.getByRole('heading', { name, exact: true }) }).first();
}
async function add(page, name) {
  await card(page, name).getByRole('button', { name: new RegExp(`Adicionar ${name}`) }).click();
}
async function openCart(page) {
  await page.locator('#cart-toggle').click();
  await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'false');
}

async function chooseNeighborhood(page, name) {
  const trigger = page.locator('#neighborhood-trigger');
  await trigger.click();
  await page.getByRole('option', { name: new RegExp(`^${name}\\s+R\\$`) }).click();
  await expect(trigger.locator('#neighborhood-name')).toHaveText(name);
}

test.describe('cardápio responsivo e pesquisa', () => {
  for (const width of [320, 390, 1440]) {
    test(`renderiza os dois temas sem overflow horizontal em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openApp(page);
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await expect(page.locator('#search')).toBeVisible();
      await expect(page.locator('#store-status')).toBeVisible();
      if (width !== 320) await page.screenshot({ path: `review/${width === 390 ? 'celular' : 'desktop'}-escuro.png` });
      await page.locator('#theme-toggle').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      if (width === 390) await page.screenshot({ path: 'review/celular-claro.png' });
    });
  }

  test('busca ignora acentos, mostra resultados, estado vazio e restaura categorias', async ({ page }) => {
    await openApp(page);
    await page.locator('#search').fill('hamburguer');
    await expect(page.locator('#search-results')).toContainText(/resultado/i);
    await expect(card(page, 'Hambúrguer')).toBeVisible();
    await page.locator('#search').fill('zzzz-nada-zzzz');
    await expect(page.locator('#no-results')).toBeVisible();
    await expect(page.locator('#search-results')).toContainText('0');
    await page.locator('#search').fill('');
    await expect(page.locator('#destaques')).toBeVisible();
    await expect(page.locator('#category-nav-list > li:visible')).toHaveCount(12);
  });

  test('categorias navegam e vitaminas selecionam sabor e volume com preço correto', async ({ page }) => {
    await openApp(page);
    await page.locator('[data-scroll="vitaminas"]').click();
    await expect(page.locator('#vitaminas')).toBeInViewport();
    const vit = page.locator("[data-group='vitaminas']");
    await expect(vit.locator('[data-price]')).toHaveText('A partir de R$ 10,00');
    await vit.locator('[data-open-beverage="vitaminas"]').click();
    const product = page.locator('#product-dialog');
    await expect(product).toBeVisible();
    await product.locator('input[name="product-flavor"][value="Morango ao Leite"]').check();
    await expect(product.locator('#product-add')).toBeDisabled();
    await product.locator('input[name="product-pack"][value="Copo 500ML"]').check();
    await expect(product.locator('#product-add')).toContainText(/R\$ 13,00/);
    await product.locator('#product-add').click();
    await openCart(page);
    await expect(page.locator('.cart-line')).toContainText('Copo 500ML');
    await expect(page.locator('#cart-total')).toHaveText('R$ 13,00');
  });
});

test.describe('carrinho e checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
  });

  test('adiciona, incrementa, decrementa, remove e limpa o carrinho', async ({ page }) => {
    await add(page, 'X Bacon');
    await expect(card(page, 'X Bacon').locator('[data-add]')).toHaveClass(/is-added/);
    await openCart(page);
    const line = page.locator('.cart-line').filter({ hasText: 'X Bacon' });
    await expect(line.locator('.qty__value')).toHaveText('1');
    await line.getByRole('button', { name: /Aumentar quantidade/ }).click();
    await expect(line.locator('.qty__value')).toHaveText('2');
    await expect(page.locator('#cart-total')).toHaveText('R$ 30,00');
    await line.getByRole('button', { name: /Diminuir quantidade/ }).click();
    await expect(line.locator('.qty__value')).toHaveText('1');
    await line.getByRole('button', { name: /Remover/ }).click();
    await expect(page.locator('#cart-empty')).toBeVisible();
    await expect(page.locator('#cart-browse')).toBeFocused();
    await page.locator('#cart-close').click();
    await add(page, 'X Bacon');
    await openCart(page);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#clear-btn').click();
    await expect(page.locator('#cart-empty')).toBeVisible();
    await expect(page.locator('#cart-browse')).toBeFocused();
  });

  test('limite de 99 unidades não exibe falsa confirmação', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('saborsorriso:carrinho:v1', JSON.stringify([
      { id: 'hamburgueres-x-bacon', opt: null, qty: 99 },
    ])));
    await page.reload();
    const button = card(page, 'X Bacon').locator('[data-add]');
    await button.click();
    await expect(button).not.toHaveClass(/is-added/);
    await expect(page.locator('#toast')).toContainText('Limite de 99');
    await expect(page.locator('#cart-count')).toHaveText('99');
  });

  test('persiste itens e observações entre recarregamentos', async ({ page }) => {
    await add(page, 'X Burguer');
    await openCart(page);
    await page.locator('#order-notes').fill('sem cebola');
    await page.reload();
    await openCart(page);
    await expect(page.locator('.cart-line')).toContainText('X Burguer');
    await expect(page.locator('#order-notes')).toHaveValue('sem cebola');
  });

  test('valida entrega, taxa por bairro, resumo e conteúdo do WhatsApp sem envio externo', async ({ page }) => {
    await add(page, 'X Bacon');
    await openCart(page);
    await expect(page.locator('#checkout-btn')).toBeDisabled();
    await page.getByLabel('Entrega', { exact: true }).check();
    await page.getByLabel('Cartão').check();
    await expect(page.locator('#checkout-btn')).toBeDisabled();
    await page.locator('#address-street').fill('Rua das Flores');
    await page.locator('#address-number').fill('123');
    await chooseNeighborhood(page, 'Capivari');
    await expect(page.locator('#delivery-fee-row')).toBeVisible();
    await expect(page.locator('#cart-delivery-fee')).toHaveText('+ R$ 9,00');
    await expect(page.locator('#cart-total')).toHaveText('R$ 26,00');
    await expect(page.locator('#checkout-btn')).toBeEnabled();
    await expect(page.locator('#cart-summary')).toHaveText('1 item · Entrega · Cartão');
    await page.locator('#checkout-btn').click();
    let url = new URL(await page.evaluate(() => window.__openedURL));
    expect(url.hostname).toBe('wa.me');
    expect(url.pathname).toBe('/5521995792519');
    expect(url.searchParams.get('text')).toContain('Rua das Flores, 123 - Capivari');
    expect(url.searchParams.get('text')).toContain('Total: R$ 26,00');
    await page.getByLabel('Retirada', { exact: true }).check();
    await page.getByLabel('Pix').check();
    await expect(page.locator('#address-fields')).toBeHidden();
    await expect(page.locator('#delivery-fee-row')).toBeHidden();
    await expect(page.locator('#cart-summary')).toHaveText('1 item · Retirada no local · Pix');
    await page.locator('#checkout-btn').click();
    url = new URL(await page.evaluate(() => window.__openedURL));
    expect(url.searchParams.get('text')).toContain('Retirada no local');
    expect(url.searchParams.get('text')).not.toContain('Rua das Flores');
    expect(url.searchParams.get('text')).toContain('Total: R$ 15,00');
    await expect(page.locator('#toast')).not.toHaveClass(/is-visible/);
    await page.screenshot({ path: 'review/carrinho-celular.png' });
  });

  test('exibe exatamente os 12 bairros, taxas e placeholder bloqueado', async ({ page }) => {
    await add(page, 'X Bacon');
    await openCart(page);
    const expected = [
      ['Capivari', 'R$ 9,00'], ['São Lourenço', 'R$ 4,00'], ['Favela', 'R$ 5,00'],
      ['Rua 12', 'R$ 5,00'], ['Parque Eldorado', 'R$ 7,00'],
      ['Ruas da 1 a porta de aço', 'R$ 6,00'], ['Figueira', 'R$ 5,00'],
      ['Loteamento', 'R$ 5,00'], ['Santa Cruz', 'R$ 12,00'], ['Cangulo', 'R$ 25,00'],
      ['Primavera', 'R$ 15,00'], ['Berra boi', 'R$ 8,00'],
    ];
    const options = page.locator('#address-neighborhood option');
    await expect(options).toHaveCount(13);
    await expect(page.locator('select#address-neighborhood')).toHaveCount(1);
    await expect(page.locator('select#address-neighborhood')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('select#address-neighborhood')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#neighborhood-panel')).toBeHidden();
    await expect(options.nth(0)).toHaveText('Selecione seu bairro');
    await expect(options.nth(0)).toBeDisabled();
    await expect(options.nth(0)).toHaveAttribute('value', '');
    for (let i = 0; i < expected.length; i++) {
      await expect(options.nth(i + 1)).toHaveText(`${expected[i][0]} — ${expected[i][1]}`);
      await expect(options.nth(i + 1)).toHaveAttribute('value', expected[i][0]);
    }
    await page.getByLabel('Entrega', { exact: true }).check();
    await page.locator('#neighborhood-trigger').click();
    await expect(page.locator('#neighborhood-options > li')).toHaveCount(12);
    for (let i = 0; i < expected.length; i++) {
      const option = page.locator('#neighborhood-options > li').nth(i);
      await expect(option).toHaveAttribute('data-neighborhood', expected[i][0]);
      await expect(option.locator('.neighborhood-picker__name')).toHaveText(expected[i][0]);
      await expect(option.locator('.neighborhood-picker__fee')).toHaveText(expected[i][1]);
    }
    await page.keyboard.press('Escape');
    await chooseNeighborhood(page, 'Ruas da 1 a porta de aço');
    expect(await page.locator('.drawer__body').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('exige bairro apenas na entrega e mudança atualiza carrinho, barra e WhatsApp', async ({ page }) => {
    await add(page, 'X Bacon');
    await openCart(page);
    await page.getByLabel('Entrega', { exact: true }).check();
    await page.getByLabel('Pix').check();
    await page.locator('#address-street').fill('Rua das Flores');
    await page.locator('#address-number').fill('123');
    await expect(page.locator('#address-neighborhood')).toHaveJSProperty('required', true);
    await expect(page.locator('#checkout-btn')).toBeDisabled();
    await chooseNeighborhood(page, 'Capivari');
    await expect(page.locator('#cart-delivery-fee')).toHaveText('+ R$ 9,00');
    await expect(page.locator('#cart-total')).toHaveText('R$ 24,00');
    await expect(page.locator('#cart-bar-total')).toHaveText('R$ 24,00');
    await chooseNeighborhood(page, 'Primavera');
    await expect(page.locator('#cart-delivery-fee')).toHaveText('+ R$ 15,00');
    await expect(page.locator('#cart-total')).toHaveText('R$ 30,00');
    await expect(page.locator('#cart-bar-total')).toHaveText('R$ 30,00');
    await expect(page.locator('#checkout-btn')).toBeEnabled();
    await page.locator('#checkout-btn').click();
    const url = new URL(await page.evaluate(() => window.__openedURL));
    const message = url.searchParams.get('text');
    expect(message).toContain('Rua das Flores, 123 - Primavera');
    expect(message).toContain('*Taxa de entrega:* R$ 15,00');
    expect(message).toContain('*Total: R$ 30,00*');
    expect(message).not.toContain('a confirmar');
    expect(message).not.toContain('desconhecido');
  });

  test('mostra taxa do cartão uma única vez e soma cartão mais entrega', async ({ page }) => {
    await add(page, 'X Bacon');
    await openCart(page);
    await page.getByLabel('Entrega', { exact: true }).check();
    await page.getByLabel('Cartão').check();
    await expect(page.locator('label.radio-option').filter({ has: page.locator('input[name="payment-method"][value="card"]') })).toHaveText('Cartão');
    await page.locator('#address-street').fill('Rua das Flores');
    await page.locator('#address-number').fill('123');
    await chooseNeighborhood(page, 'Capivari');
    await expect(page.locator('#cart-total')).toHaveText('R$ 26,00');
    await expect(page.locator('#fee-row')).toBeVisible();
    await expect(page.locator('#fee-row')).toContainText('Taxa do cartão');
    await expect(page.locator('#fee-row')).toHaveCount(1);
    await page.locator('#checkout-btn').click();
    const message = new URL(await page.evaluate(() => window.__openedURL)).searchParams.get('text');
    expect((message.match(/Taxa do cartão/g) || []).length).toBe(1);
    expect((message.match(/Taxa de entrega/g) || []).length).toBe(1);
    expect(message).toContain('*Total: R$ 26,00*');
  });

  test('retirada desabilita e não exige bairro nem inclui endereço ou taxa', async ({ page }) => {
    await add(page, 'X Bacon');
    await openCart(page);
    await page.getByLabel('Retirada', { exact: true }).check();
    await page.getByLabel('Pix').check();
    await expect(page.locator('#address-fields')).toBeHidden();
    await expect(page.locator('#address-neighborhood')).toBeDisabled();
    await expect(page.locator('#address-neighborhood')).toHaveJSProperty('required', false);
    await expect(page.locator('#delivery-fee-row')).toBeHidden();
    await expect(page.locator('#checkout-btn')).toBeEnabled();
    await page.locator('#checkout-btn').click();
    const message = new URL(await page.evaluate(() => window.__openedURL)).searchParams.get('text');
    expect(message).toContain('*Tipo:* Retirada no local');
    expect(message).not.toContain('Taxa de entrega');
    expect(message).not.toContain('Endereço');
  });

  test('restaura bairro válido e limpa bairro desconhecido legado, bloqueando entrega', async ({ page }) => {
    await add(page, 'X Bacon');
    await openCart(page);
    await page.evaluate(() => localStorage.setItem('saborsorriso:entrega-dados', JSON.stringify({
      deliveryType: 'delivery', paymentMethod: 'pix',
      address: { street: 'Rua das Flores', number: '123', neighborhood: 'Capivari', reference: '' },
    })));
    await page.reload();
    await openCart(page);
    await expect(page.locator('#address-neighborhood')).toHaveValue('Capivari');
    await expect(page.locator('#neighborhood-name')).toHaveText('Capivari');
    await expect(page.locator('#neighborhood-fee')).toHaveText('Taxa de entrega: R$ 9,00');
    await expect(page.locator('#cart-delivery-fee')).toHaveText('+ R$ 9,00');
    await page.evaluate(() => localStorage.setItem('saborsorriso:entrega-dados', JSON.stringify({
      deliveryType: 'delivery', paymentMethod: 'pix',
      address: { street: 'Rua das Flores', number: '123', neighborhood: 'Bairro Antigo', reference: '' },
    })));
    await page.reload();
    await openCart(page);
    await expect(page.locator('#address-neighborhood')).toHaveValue('');
    await expect(page.locator('#neighborhood-name')).toHaveText('Selecione seu bairro');
    await expect(page.locator('#neighborhood-trigger')).toBeEnabled();
    await expect(page.locator('#address-neighborhood')).toBeEnabled();
    await expect(page.locator('#address-neighborhood')).toHaveJSProperty('required', true);
    await expect(page.locator('#checkout-btn')).toBeDisabled();
    await expect(page.locator('#checkout-hint')).toContainText('bairro atendido');
  });
});

test.describe('acessibilidade, status e qualidade', () => {
  test('ingredientes alinham nome acessível, texto visível e produto ao expandir e recolher', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await page.getByRole('button', { name: 'Hambúrgueres', exact: true }).click();
    const buttons = page.locator('#cardapio [data-more]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.locator('xpath=ancestor::li').locator('.card__name').textContent();
      await expect(button).toHaveAttribute('aria-label', `Ver mais ingredientes de ${name}`);
      if (await button.isVisible()) {
        await expect(button).toHaveAccessibleName(`Ver mais ingredientes de ${name}`);
      }
      await expect(button).toHaveText('Ver mais');
      await expect(button).toHaveAttribute('aria-expanded', 'false');
    }
    const product = card(page, 'X Tudo');
    const button = product.locator('[data-more]');
    await expect(button).toHaveAccessibleName('Ver mais ingredientes de X Tudo');
    await expect(button).toBeVisible();
    const controlledId = await button.getAttribute('aria-controls');
    await button.click();
    await expect(button).toHaveText('Ver menos');
    await expect(button).toHaveAccessibleName('Ver menos ingredientes de X Tudo');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(product.locator('.card__desc')).toHaveAttribute('id', controlledId);
    await expect(product.locator('.card__desc')).toHaveClass(/is-open/);
    await product.getByRole('button', { name: 'Ver menos ingredientes de X Tudo', exact: true }).click();
    await expect(button).toHaveText('Ver mais');
    await expect(button).toHaveAccessibleName('Ver mais ingredientes de X Tudo');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(product.locator('.card__desc')).not.toHaveClass(/is-open/);
  });

  test('loja fechada informa estado e impede finalizar', async ({ page }) => {
    await openApp(page, CLOSED);
    await add(page, 'X Bacon');
    await openCart(page);
    await expect(page.locator('#checkout-btn')).toBeDisabled();
    await expect(page.locator('#checkout-btn')).toContainText(/fechada/i);
    expect(await page.evaluate(() => window.__openedURL)).toBeNull();
  });

  test('Escape restaura foco, Tab e Shift+Tab ficam no modal e movimento reduzido é respeitado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page);
    await add(page, 'X Burguer');
    const toggle = page.locator('#cart-toggle');
    await toggle.click();
    const close = page.locator('#cart-close');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#clear-btn')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.querySelector('#cart-drawer').contains(document.activeElement))).toBe(true);
    }
    expect(await page.locator('html').evaluate(el => getComputedStyle(el).scrollBehavior)).toBe('auto');
    const durations = await page.locator('#cart-drawer').evaluate(el => getComputedStyle(el).transitionDuration.split(',').map(parseFloat));
    expect(durations.every(duration => duration <= 0.001)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#cart-drawer')).toHaveAttribute('aria-hidden', 'true');
    await expect(toggle).toBeFocused();
  });

  test('não emite erros de console ou execução no fluxo principal', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await openApp(page);
    await add(page, 'X Bacon');
    await openCart(page);
    await page.getByLabel('Retirada', { exact: true }).check();
    await page.getByLabel('Dinheiro', { exact: true }).check();
    await page.locator('#checkout-btn').click();
    await page.locator('#cart-close').click();
    await page.locator('#search').fill('bacon');
    await expect(page.locator('#search-results')).toContainText('resultado');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
