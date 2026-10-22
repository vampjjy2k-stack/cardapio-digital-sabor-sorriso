import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const evidence = process.env.FRANGO_PICANHA_EVIDENCE_DIR || '/workspace/sabor-picanha04-brioche-evidencias';
const desc = 'pão Bimbo + filé de peito de frango empanado (120 g) + alface + cheddar em fatia + cebola roxa crua + molho especial';
async function openApp(page) {
  await page.route('**/api/status', r => r.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
  await page.addInitScript(() => { localStorage.clear(); window.open = () => { throw new Error('Envio externo proibido no teste'); }; });
  await page.goto('/index.html');
}
for (const width of [320, 360, 390]) {
  test(`Frango Fresh corrigido com foto exclusiva e soma correta em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openApp(page);
    await page.locator('#search').fill('Frango Fresh');
    const card = page.locator('#hamburgueres [data-card]').filter({ has: page.locator('[data-add="hamburgueres-frango-fresh"]') });
    await expect(card).toHaveCount(1);
    await expect(card.locator('.card__desc')).toHaveText(desc);
    await expect(card).not.toContainText(/picles|cream cheese/i);
    await expect(card.locator('[data-price]')).toHaveText('R$ 24,00');
    const photo = card.locator('img');
    await expect(photo).toHaveAttribute('src', 'img/produtos/frango-fresh.webp');
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toHaveJSProperty('complete', true);
    expect(await photo.evaluate(img => img.naturalWidth)).toBe(750);
    await expect(page.locator('img[src="img/produtos/frango-fresh.webp"]')).toHaveCount(1);
    await card.locator('[data-add]').click();
    await page.locator('#search').fill('picanha');
    await expect(page.locator('#linha-picanha [data-card]:visible')).toHaveCount(4);
    const p04 = page.locator('#linha-picanha [data-card]').filter({ hasText: 'X Picanha 04' });
    await expect(p04.locator('.card__desc')).toHaveText('pão brioche + hambúrguer de picanha 120 gramas + queijo + presunto + bacon + tomate + alface + molhos + ketchup');
    await expect(p04.locator('.card__desc')).not.toContainText(/bimbo/i);
    await expect(page.locator('#linha-picanha .photo-unavailable')).toHaveCount(3);
    for (const id of ['01', '02', '03', '04']) await page.locator(`[data-add="linha-picanha-x-picanha-${id}"]`).click();
    await page.locator('#cart-toggle').click();
    await expect(page.locator('.cart-line')).toHaveCount(5);
    await expect(page.locator('#cart-total')).toHaveText('R$ 123,00');
    await expect(page.locator('.cart-line').filter({ hasText: 'Frango Fresh' })).toContainText('R$ 24,00');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  });
}
test('prévias mobile finais nos temas claro e escuro', async ({ page }) => {
  test.setTimeout(90000);
  mkdirSync(evidence, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  const targets = [ ['frango-fresh', 'Frango Fresh', '#hamburgueres'], ['picanha', 'picanha', '#linha-picanha'], ['xduplo', 'X Duplo', '#hamburgueres'], ['combo07', 'Combo 07', '#combos'], ['dogao', 'Dogão', '#hot-dogs'], ['batatas', 'Batata Maluca', '#porcoes'], ['h2oh', 'H2OH', '#bebidas'], ['cheddar', 'X Cheddar', '#linha-cheddar'] ];
  for (const theme of ['light', 'dark']) {
    await page.evaluate(t => { document.documentElement.dataset.theme = t; localStorage.setItem('sabor-theme', t); }, theme);
    for (const [label, search, selector] of targets) {
      await page.locator('#search').fill(search);
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      for (const image of await section.locator('img:visible').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveJSProperty('complete', true);
        expect(await image.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
      }
      const more = section.locator('[data-more]:visible');
      for (const button of await more.all()) if (await button.getAttribute('aria-expanded') === 'false') await button.click();
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${evidence}/mobile-${label}-${theme}.png`, fullPage: true });
    }
  }
});
