import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const evidence = process.env.COMBO_EVIDENCE_DIR || '/workspace/sabor-cardapio-combo04-05-evidencias-20261023/previas';
mkdirSync(evidence, { recursive: true });
const description = '3 X-Tudo podrão + 1 Batata Maluca + ovos de codorna + 6 nuggets';
const combo = (page, name) => page.locator('#combos [data-card]').filter({ has: page.getByRole('heading', { name, exact: true }) });

async function openApp(page, width, theme) {
  await page.setViewportSize({ width, height: 900 });
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }));
  await page.goto('/index.html');
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
}

for (const width of [320, 390, 430, 1440]) for (const theme of ['light', 'dark']) {
  test(`Combo 04 sem foto e Combo 05 com foto real + ilustração etiquetada em ${width}px (${theme})`, async ({ page }) => {
    await openApp(page, width, theme);

    const combo04 = combo(page, 'Combo 04');
    const combo05 = combo(page, 'Combo 05');
    await expect(combo04.locator('.card__desc')).toHaveText(description);
    await expect(combo04.locator('.card__thumb img')).toHaveCount(0);
    await expect(combo04.locator('.photo-unavailable')).toHaveText('Foto de exemplo não disponível');
    await expect(combo05.locator('.card__thumb img')).toHaveCount(2);
    await expect(combo05.locator('.card__thumb img').nth(0)).toHaveAttribute('src', 'img/produtos/combo-04.webp');
    await expect(combo05.locator('.card__thumb img').nth(0)).toHaveAttribute('alt', 'Foto confirmada de Combo 05');
    await expect(combo05.locator('.card__thumb img').nth(1)).toHaveAttribute('src', 'img/ilustracoes/catalogo/combos-combo-05.webp');
    await expect(combo05.locator('.photo-disclaimer')).toHaveText('Imagem ilustrativa');
    await expect(combo05.locator('.photo-unavailable')).toHaveCount(0);
    await combo05.scrollIntoViewIfNeeded();
    await combo05.locator('.card__thumb img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);

    if (width === 390 && theme === 'light') {
      for (const card of [combo04, combo05]) {
        const more = card.locator('[data-more]');
        if (await more.isVisible()) await more.click();
      }
      await page.locator('#combos [data-card]').evaluateAll(cards => {
        for (const card of cards) {
          if (!['Combo 04', 'Combo 05'].includes(card.querySelector('.card__name')?.textContent.trim())) card.style.display = 'none';
        }
      });
      await page.locator('#combos').screenshot({
        path: `${evidence}/combos-04-05-390-light.png`,
        style: '#site-header, #category-nav, .skip-link { visibility: hidden !important; }'
      });
    }
  });
}
