import { test, expect } from '@playwright/test';

const photos = {
  'artesanais-artesanal-02': 'artesanal-02.webp',
  'artesanais-artesanal-04': 'artesanal-04.webp',
  'linha-cheddar-x-cheddar-03': 'cheddar-03.webp',
  'linha-cheddar-x-cheddar-05': 'cheddar-05.webp',
  'combos-combo-02': 'combo-02.webp',
  'combos-combo-03': 'combo-03.webp',
  'combos-combo-04': 'combo-04.webp',
  'combos-combo-06': 'combo-06.webp',
  'combos-combo-07': 'combo-07.webp',
  'porcoes-batata-maluca-g': 'batata-maluca-p.webp',
  'porcoes-batata-maluca-g-com-cheddar-e-bacon': 'batata-cheddar-bacon-g.webp',
  'hot-dogs-dogao-quente-salsicha': 'dogao-quente.webp',
  'hot-dogs-dogao-quente-linguica': 'dogao-quente.webp',
};

const names = {
  'artesanais-artesanal-02': 'Artesanal 02', 'artesanais-artesanal-04': 'Artesanal 04',
  'linha-cheddar-x-cheddar-03': 'X Cheddar 03', 'linha-cheddar-x-cheddar-05': 'X Cheddar 05',
  'combos-combo-02': 'Combo 02', 'combos-combo-03': 'Combo 03', 'combos-combo-04': 'Combo 04', 'combos-combo-06': 'Combo 06',
  'hamburgueres-x-duplo': 'X Duplo', 'combos-combo-07': 'Combo 07',
  'porcoes-batata-maluca-g': 'Batata Maluca G', 'porcoes-batata-maluca-g-com-cheddar-e-bacon': 'Batata Maluca G com Cheddar e Bacon',
  'hot-dogs-dogao-quente-salsicha': 'Dogão Quente Salsicha', 'hot-dogs-dogao-quente-linguica': 'Dogão Quente Linguiça',
};

test('catálogo renderiza fotos reais mapeadas e placeholder rotulado nos itens sem foto', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { status: 'open' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto('/index.html');
  for (const [id, asset] of Object.entries(photos)) {
    const card = page.locator('[data-card]').filter({ has: page.getByRole('heading', { name: names[id], exact: true }) }).first();
    await expect(card).toHaveCount(1);
    await expect(card.locator('img')).toHaveAttribute('src', `img/produtos/${asset}`);
  }
  const duplo = page.locator('[data-card]').filter({ has: page.getByRole('heading', { name: 'X Duplo', exact: true }) });
  await expect(duplo.locator('img')).toHaveCount(0);
  await expect(duplo.locator('.photo-unavailable')).toHaveText('Foto de exemplo não disponível');
  await expect(page.locator('.photo-placeholder .photo-unavailable').first()).toHaveText('Foto de exemplo não disponível');
  await expect(page.locator('.hero')).toHaveCSS('background-image', 'none');
  await expect(page.locator('.brand img')).toHaveAttribute('src', 'img/logo.webp');
  for (const asset of [...Object.values(photos), 'x-duplo.webp', 'artesanal-03-1.webp', 'artesanal-03-2.webp']) {
    expect((await page.request.get(`/img/produtos/${asset}`)).status()).toBe(200);
  }
});
