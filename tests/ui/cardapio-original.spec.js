import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const evidence = process.env.CARDAPIO_EVIDENCE_DIR || '/workspace/sabor-cardapio-evidencias-20261023';
// Apenas no instante da captura de seções longas; não muda layout ou CSS publicado.
const captureStyle = '#site-header, #category-nav, .skip-link { visibility: hidden !important; }';
mkdirSync(evidence, { recursive: true });
async function openApp(page, width = 390, theme = 'dark') {
  await page.setViewportSize({ width, height: 844 });
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }));
  await page.goto('/index.html');
  await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
}
const product = (page, name) => page.locator('#cardapio [data-card]').filter({ has: page.getByRole('heading', { name, exact: true }) });

for (const width of [320, 390, 430]) {
  for (const theme of ['dark', 'light']) {
    test(`oito combos em ordem, um por linha e acessíveis em ${width}px ${theme}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await openApp(page, width, theme);
      await expect(page.locator('#featured-title')).toHaveText('Combos 01 a 08');
      const cards = page.locator('#featured-grid [data-card]');
      await expect(cards).toHaveCount(8);
      await expect(cards.locator('h3')).toHaveText(Array.from({ length: 8 }, (_, i) => `Combo 0${i + 1}`));
      await expect(page.locator('#combos [data-card]')).toHaveCount(13);
      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        await expect(card.getByRole('button', { name: /Adicionar Combo/ })).toBeInViewport();
      }
      const boxes = await cards.evaluateAll(nodes => nodes.map(node => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }));
      boxes.forEach((box, i) => {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
        if (i) expect(box.top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
      });
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await page.locator('#featured-grid img').evaluateAll(async imgs => Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode(); })));
      await page.locator('#destaques').screenshot({ path: `${evidence}/combos-${width}-${theme}.png`, style: captureStyle });
      expect(errors).toEqual([]);
    });
  }
}

test('batata P com ilustração, G com a foto confirmada e demais associações preservadas', async ({ page }) => {
  await openApp(page);
  const p = product(page, 'Batata Maluca P');
  const g = product(page, 'Batata Maluca G');
  await expect(p.locator('img')).toHaveAttribute('src', 'img/ilustracoes/catalogo/porcoes-batata-maluca-p.webp');
  await expect(p.locator('.photo-disclaimer')).toHaveText('Imagem ilustrativa');
  await expect(g.locator('img')).toHaveAttribute('src', 'img/produtos/batata-maluca-p.webp');
  await expect(g.locator('img')).toHaveAttribute('alt', 'Foto de Batata Maluca G');
  await expect(p.locator('[data-price]')).toHaveText('R$ 16,00');
  await expect(g.locator('[data-price]')).toHaveText('R$ 27,00');
  await expect(product(page, 'Batata Maluca G com Cheddar e Bacon').locator('img')).toHaveAttribute('src', 'img/produtos/batata-cheddar-bacon-g.webp');
  await page.locator('#porcoes').scrollIntoViewIfNeeded();
  await page.locator('#porcoes img').evaluateAll(async imgs => Promise.all(imgs.map(img => img.decode())));
  for (const button of await page.locator('#porcoes [data-more]:visible').all()) await button.click();
  await page.locator('#porcoes').screenshot({ path: `${evidence}/batatas-390-dark.png`, style: captureStyle });
});

test('X Tudo tem ingredientes completos, expande e mantém preço no carrinho sem enviar pedido', async ({ page }) => {
  await openApp(page);
  await page.locator('#search').fill('X Tudo');
  const tudo = product(page, 'X Tudo');
  await expect(tudo).toBeVisible();
  await tudo.scrollIntoViewIfNeeded();
  await tudo.getByRole('button', { name: 'Ver mais ingredientes de X Tudo', exact: true }).click();
  for (const ingredient of ['ovo', 'bacon', 'calabresa', 'milho', 'ervilha', 'molho Billy Jack', 'maionese temperada', 'batata palha']) await expect(tudo.locator('.card__desc')).toContainText(ingredient);
  await tudo.screenshot({ path: `${evidence}/x-tudo-390-dark.png`, style: captureStyle });
  await tudo.locator('[data-add]').click();
  await page.locator('#cart-toggle').click();
  await expect(page.locator('.cart-line__name')).toHaveText('X Tudo');
  await expect(page.locator('#cart-subtotal')).toHaveText('R$ 16,00');
});

test('desktop mantém os oito combos e grade sem transbordamento', async ({ page }) => {
  await openApp(page, 1440, 'light');
  await expect(page.locator('#featured-grid [data-card]')).toHaveCount(8);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 1440);
  await page.locator('#featured-grid img').evaluateAll(async imgs => Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode(); })));
  await page.locator('#destaques').screenshot({ path: `${evidence}/combos-1440-light.png`, style: captureStyle });
});
