import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const evidence = process.env.ILUSTRACOES_EVIDENCE_DIR || '/workspace/sabor-cardapio-ilustrativo-evidencias-20261023/previas';
mkdirSync(evidence, { recursive: true });
const captureStyle = '#site-header, #category-nav, .skip-link { visibility: hidden !important; }';
async function openApp(page, width = 390, theme = 'dark') {
  await page.setViewportSize({ width, height: 844 });
  await page.route('**/api/status', r => r.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
  await page.goto('/index.html');
  await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
}
const artisan = (page, n) => page.locator('#artesanais [data-card]').filter({ has: page.getByRole('heading', { name: `Artesanal 0${n}`, exact: true }) });
async function decoded(root) {
  await root.locator('img').evaluateAll(async imgs => Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode(); })));
}
async function checkLabels(root) {
  for (const label of await root.locator('.photo-disclaimer').all()) {
    await expect(label).toHaveText('Imagem ilustrativa');
    const result = await label.evaluate(node => {
      const r = node.getBoundingClientRect(), t = node.closest('.card__thumb, .product-photo').getBoundingClientRect();
      const button = node.closest('.card__media')?.querySelector('.add-btn');
      const b = button?.getBoundingClientRect();
      return { contained: r.width > 0 && r.height > 0 && r.left >= t.left - 1 && r.right <= t.right + 1 && r.top >= t.top - 1 && r.bottom <= t.bottom + 1,
        overlaps: !!b && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top,
        clipped: node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight + 1 };
    });
    expect(result).toEqual({ contained: true, overlaps: false, clipped: false });
  }
}

for (const width of [320, 390, 430]) for (const theme of ['dark', 'light']) {
  test(`ilustrações rotuladas sem corte ou sobreposição em ${width}px ${theme}`, async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await openApp(page, width, theme);
    await expect(page.locator('#acai .photo-disclaimer')).toHaveCount(6);
    await expect(page.locator('#vitaminas .photo-disclaimer')).toHaveCount(1);
    await expect(page.locator('#artesanais .photo-disclaimer')).toHaveCount(3);
    const acaiSources = await page.locator('#acai .photo-disclaimer').evaluateAll(labels => labels.map(label => label.closest('.photo-illustrative').querySelector('img').getAttribute('src')));
    expect(new Set(acaiSources).size).toBe(6);
    for (const n of [1, 5, 6]) {
      await expect(artisan(page, n).locator('img')).toHaveAttribute('src', `img/ilustracoes/catalogo/artesanais-artesanal-0${n}.webp`);
      await expect(artisan(page, n).locator('img')).toHaveAttribute('alt', new RegExp(`^Imagem ilustrativa de Artesanal 0${n} — exemplo genérico;`));
    }
    for (const n of [2, 3, 4]) {
      await expect(artisan(page, n).locator('.photo-disclaimer')).toHaveCount(0);
      await expect(artisan(page, n).locator('img')).toHaveCount(n === 3 ? 2 : 1);
    }
    for (const id of ['artesanais', 'acai', 'vitaminas']) {
      const section = page.locator(`#${id}`); await section.scrollIntoViewIfNeeded(); await decoded(section); await checkLabels(section);
      await section.screenshot({ path: `${evidence}/${id}-${width}-${theme}.png`, style: captureStyle });
    }
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    expect(errors).toEqual([]);
  });
}

test('vitaminas usam a ilustração própria de cada sabor e tamanho, preservam preço e carrinho', async ({ page }) => {
  await openApp(page);
  await page.locator('[data-open-beverage="vitaminas"]').click();
  const photo = page.locator('#product-photo');
  await expect(photo.locator('.photo-disclaimer')).toHaveText('Imagem ilustrativa');
  const assets = {
    'Morango ao Leite': ['vitaminas-morango-ao-leite-copo-300ml.webp', 'vitaminas-morango-ao-leite-copo-500ml.webp'],
    'Cupuaçu ao Leite': ['vitaminas-cupuacu-ao-leite-copo-300ml.webp', 'vitaminas-cupuacu-ao-leite-copo-500ml.webp'],
    'Maracujá ao Leite': ['vitaminas-maracuja-ao-leite-copo-300ml.webp', 'vitaminas-maracuja-ao-leite-copo-500ml.webp'],
    'Graviola ao Leite': ['vitaminas-graviola-ao-leite-copo-300ml.webp', 'vitaminas-graviola-ao-leite-copo-500ml.webp']
  };
  for (const [flavor, prices] of [['Morango ao Leite', [10, 13]], ['Cupuaçu ao Leite', [10, 13]], ['Maracujá ao Leite', [12, 15]], ['Graviola ao Leite', [10, 13]]]) {
    await page.locator(`input[name="product-flavor"][value="${flavor}"]`).check();
    for (const [index, pack] of ['Copo 300ML', 'Copo 500ML'].entries()) {
      await page.locator(`input[name="product-pack"][value="${pack}"]`).check();
      await expect(photo.locator('img')).toHaveAttribute('src', `img/ilustracoes/catalogo/${assets[flavor][index]}`);
      await expect(photo.locator('img')).toHaveAttribute('alt', new RegExp(`^Imagem ilustrativa de ${flavor} — ${flavor} · ${pack} — exemplo genérico;`));
      await expect(photo.locator('.photo-disclaimer')).toHaveText('Imagem ilustrativa');
      await expect(page.locator('#product-add')).toContainText(`R$ ${prices[index]},00`);
    }
  }
  await decoded(photo); await checkLabels(page.locator('#product-dialog'));
  await photo.scrollIntoViewIfNeeded();
  await page.locator('#product-dialog').screenshot({ path: `${evidence}/vitaminas-modal-390-dark.png` });
  await page.locator('#product-add').click();
  await expect(page.locator('#vitaminas .photo-disclaimer')).toHaveText('Imagem ilustrativa');
  await page.locator('#cart-toggle').click();
  await expect(page.locator('.cart-line')).toContainText('Graviola ao Leite');
  await expect(page.locator('#cart-subtotal')).toHaveText('R$ 13,00');
  await page.locator('.cart-line [data-action="edit"]').click();
  await expect(photo.locator('.photo-disclaimer')).toHaveText('Imagem ilustrativa');
  await expect(photo.locator('img')).toHaveAttribute('src', 'img/ilustracoes/catalogo/vitaminas-graviola-ao-leite-copo-500ml.webp');
});

test('Fanta PET 2 L usa uma ilustração distinta por sabor', async ({ page }) => {
  await openApp(page);
  await page.locator('[data-open-beverage="fanta"]').click();
  const expected = { Uva: 'bebidas-fanta-2l-uva.webp', Laranja: 'bebidas-fanta-2l-laranja.webp' };
  for (const flavor of ['Uva', 'Laranja']) {
    await page.locator(`input[name="product-flavor"][value="${flavor}"]`).check();
    await page.locator('input[name="product-pack"][value="PET 2 L"]').check();
    await expect(page.locator('#product-photo .photo-disclaimer')).toHaveText('Imagem ilustrativa');
    await expect(page.locator('#product-photo img')).toHaveAttribute('src', `img/ilustracoes/catalogo/${expected[flavor]}`);
    await expect(page.locator('#product-photo img')).toHaveAttribute('alt', new RegExp(`^Imagem ilustrativa de Fanta — ${flavor} · PET 2 L — exemplo genérico;`));
  }
});

test('falha da imagem ilustrativa mantém aviso e oferece fallback sem afetar fotos reais', async ({ page }) => {
  await page.route('**/img/ilustracoes/**', r => r.abort());
  await openApp(page);
  await page.locator('#acai').scrollIntoViewIfNeeded();
  await expect(page.locator('#acai img')).toHaveCount(0);
  await expect(page.locator('#acai .photo-disclaimer')).toHaveCount(6);
  await expect(page.locator('#acai .photo-unavailable')).toHaveCount(6);
  await checkLabels(page.locator('#acai'));
  await expect(artisan(page, 2).locator('img')).toHaveAttribute('src', 'img/produtos/artesanal-02.webp');
});
