import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const integration = JSON.parse(readFileSync(new URL('docs/ilustracoes-integracao-20261023.json', root)));
const source = readFileSync(new URL('public/script.js', root), 'utf8');
const evidence = process.env.ILLUSTRATION_EVIDENCE_DIR || '/tmp/sabor-ilustracoes-previas';
mkdirSync(evidence, { recursive: true });

function constantObject(name) {
  const start = source.indexOf(`const ${name} = {`);
  const end = source.indexOf('\n};', start) + 3;
  if (start < 0 || end < 3) throw new Error(`Não foi possível ler ${name}`);
  return Function(`${source.slice(start, end)}; return ${name};`)();
}
const realPhotos = constantObject('ITEM_PHOTOS');

async function openApp(page, width, theme) {
  await page.setViewportSize({ width, height: 900 });
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }));
  await page.goto('/index.html');
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
}

async function verifyImage(page, path, disclaimer = false, imageOverride = null) {
  const image = imageOverride || page.locator(`img[src="${path}"]`).first();
  await expect(image).toBeAttached();
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(element => element.decode());
  const result = await image.evaluate(element => {
    const frame = element.closest('.card__thumb, .product-photo, .feat-card__media');
    const imageRect = element.getBoundingClientRect();
    const frameRect = frame?.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      objectFit: style.objectFit,
      imageInsideFrame: Boolean(frameRect) && imageRect.left >= frameRect.left - 1 && imageRect.top >= frameRect.top - 1 && imageRect.right <= frameRect.right + 1 && imageRect.bottom <= frameRect.bottom + 1,
      disclaimer: element.closest('.photo-illustrative')?.querySelector('.photo-disclaimer')?.textContent.trim() || ''
    };
  });
  expect(result.naturalWidth).toBeGreaterThan(0);
  expect(result.naturalHeight).toBeGreaterThan(0);
  expect(result.objectFit).toBe('contain');
  expect(result.imageInsideFrame, `${path}: ${JSON.stringify(result)}`).toBeTruthy();
  if (disclaimer) expect(result.disclaimer).toBe('Imagem ilustrativa');
  return result;
}

for (const width of [320, 390, 430]) for (const theme of ['light', 'dark']) {
  test(`ilustrações e fotos sem corte/overflow em ${width}px, tema ${theme}`, async ({ page }) => {
    await openApp(page, width, theme);

    const directRecords = integration.records.filter(record => !record.variant_key && !record.item_id.startsWith('sucos-'));
    for (const record of directRecords) {
      const image = page.locator(`#cardapio img[src="${record.app_asset}"]`);
      await expect(image).toHaveCount(1);
      await verifyImage(page, record.app_asset, true, image);
    }

    // Cada sabor/tamanho de vitamina mostra o WebP correspondente no modal, com selo.
    await page.locator('[data-open-beverage="vitaminas"]').click();
    for (const record of integration.records.filter(record => record.variant_key?.startsWith('vitaminas-'))) {
      const flavor = record.item_name.replace(/^Vitamina de /, '');
      const pack = record.variant_key.endsWith(':option:0') ? 'Copo 300ML' : 'Copo 500ML';
      await page.locator(`#product-options input[data-dimension="flavor"][value="${flavor}"]`).check();
      await page.locator(`#product-options input[data-dimension="pack"][value="${pack}"]`).check();
      await expect(page.locator(`#product-photo img[src="${record.app_asset}"]`)).toBeAttached();
      await verifyImage(page, record.app_asset, true);
    }
    await page.locator('#product-close').click();

    // Os dois sucos são agrupados num card; cada arte aparece na seleção do sabor correto.
    await page.locator('[data-open-beverage="sucos"]').click();
    for (const record of integration.records.filter(record => record.section === 'Sucos Naturais')) {
      const flavor = record.item_name.replace(/^Suco de /, '');
      await page.locator(`#product-options input[data-dimension="flavor"][value="${flavor}"]`).check();
      await expect(page.locator(`#product-photo img[src="${record.app_asset}"]`)).toBeAttached();
      await verifyImage(page, record.app_asset, true);
    }
    await page.locator('#product-close').click();

    // As duas ilustrações de Fanta 2 L são específicas por sabor, sem substituir fotos de lata.
    await page.locator('[data-open-beverage="fanta"]').click();
    for (const record of integration.records.filter(record => record.variant_key?.startsWith('bebidas-fanta-2l:'))) {
      const flavor = record.variant_key.endsWith(':Uva') ? 'Uva' : 'Laranja';
      await page.locator(`#product-options input[data-dimension="flavor"][value="${flavor}"]`).check();
      await page.locator('#product-options input[data-dimension="pack"][value="PET 2 L"]').check();
      await expect(page.locator(`#product-photo img[src="${record.app_asset}"]`)).toBeAttached();
      await verifyImage(page, record.app_asset, true);
    }
    await page.locator('#product-close').click();

    // As fotos próprias de bebidas agrupadas também são verificadas no tamanho/variante correto.
    const beveragePhotos = [
      { group: 'coca-cola', path: realPhotos['bebidas-coca-cola-lata'], pack: 'Lata 350 ml' },
      { group: 'coca-cola', path: realPhotos['bebidas-coca-cola-600ml'], pack: 'PET 600 ml' },
      { group: 'coca-cola', path: realPhotos['bebidas-coca-cola-2l'], pack: 'PET 2 L' },
      { group: 'fanta', path: realPhotos['bebidas-fanta-uva-lata'], flavor: 'Uva', pack: 'Lata 350 ml' },
      { group: 'fanta', path: realPhotos['bebidas-fanta-laranja-lata'], flavor: 'Laranja', pack: 'Lata 350 ml' }
    ];
    for (const group of ['coca-cola', 'fanta']) {
      await page.locator(`[data-open-beverage="${group}"]`).click();
      for (const photo of beveragePhotos.filter(item => item.group === group)) {
        if (photo.flavor) await page.locator(`#product-options input[data-dimension="flavor"][value="${photo.flavor}"]`).check();
        await page.locator(`#product-options input[data-dimension="pack"][value="${photo.pack}"]`).check();
        await expect(page.locator(`#product-photo img[src="${photo.path}"]`)).toBeAttached();
        await verifyImage(page, photo.path, false);
      }
      await page.locator('#product-close').click();
    }

    const viewport = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      theme: document.documentElement.dataset.theme,
      brokenImages: [...document.querySelectorAll('#cardapio img')].filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc),
      objectFitViolations: [...document.querySelectorAll('.card__thumb img, .feat-card__media img')].filter(image => getComputedStyle(image).objectFit !== 'contain').map(image => image.currentSrc),
      imageBoundsViolations: [...document.querySelectorAll('.card__thumb img, .feat-card__media img')].filter(image => {
        const frame = image.closest('.card__thumb, .feat-card__media');
        const ir = image.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        return ir.left < fr.left - 1 || ir.top < fr.top - 1 || ir.right > fr.right + 1 || ir.bottom > fr.bottom + 1;
      }).map(image => image.currentSrc)
    }));
    expect(viewport.width).toBe(width);
    expect(viewport.documentWidth).toBeLessThanOrEqual(width);
    expect(viewport.bodyWidth).toBeLessThanOrEqual(width);
    expect(viewport.theme).toBe(theme);
    expect(viewport.brokenImages).toEqual([]);
    expect(viewport.objectFitViolations).toEqual([]);
    expect(viewport.imageBoundsViolations).toEqual([]);

    await page.screenshot({ path: `${evidence}/cardapio-${width}-${theme}.png`, fullPage: true });
    for (const [section, name] of [['#combos', 'combos'], ['#linha-picanha', 'picanha'], ['#acai', 'acai']]) {
      await page.locator(section).screenshot({
        path: `${evidence}/secao-${name}-${width}-${theme}.png`,
        style: '#site-header, .site-header, #category-nav, .category-nav, .skip-link, .cart-bar { visibility: hidden !important; }'
      });
    }
    if (width === 390 && theme === 'light') {
      await page.locator('#acai [data-card]').filter({ hasText: '790 ML' }).screenshot({
        path: `${evidence}/acai-790ml-390-light.png`,
        style: '#site-header, .site-header, #category-nav, .category-nav, .skip-link, .cart-bar { visibility: hidden !important; }'
      });
    }
  });
}
