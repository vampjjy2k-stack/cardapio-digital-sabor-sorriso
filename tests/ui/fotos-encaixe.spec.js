import { test, expect } from '@playwright/test';

for (const width of [320, 360, 390, 430, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`fotos inteiras, moldura quadrada e botão separado: ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.route('**/api/status', r => r.fulfill({ json: { status: 'open' } }));
      await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
      await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ body: '' }));
      await page.goto('/index.html');
      await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
      await page.locator('.card img').evaluateAll(async imgs => {
        await Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode(); }));
      });
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      const violations = await page.locator('.card__media:has(img)').evaluateAll(media => {
        const errors = [];
        for (const holder of media) {
          const thumb = holder.querySelector('.card__thumb');
          const t = thumb.getBoundingClientRect();
          const button = holder.querySelector('.add-btn').getBoundingClientRect();
          if (Math.abs(t.width / t.height - 1) > 0.02) errors.push('proporção da moldura');
          if (t.width < 108 || t.width > 149) errors.push('largura responsiva');
          if (button.top < t.bottom + 7 || button.width < 44 || button.height < 44) errors.push('botão cobre foto/área de toque');
          for (const img of thumb.querySelectorAll('img')) {
            const s = getComputedStyle(img), r = img.getBoundingClientRect();
            if (!img.complete || !img.naturalWidth || !img.naturalHeight) errors.push(img.src + ': não decodificou');
            if (s.objectFit !== 'contain' || s.objectPosition !== '50% 50%') errors.push(img.src + ': corte/posição');
            if (r.left < t.left + 4 || r.right > t.right - 4 || r.top < t.top + 4 || r.bottom > t.bottom - 4) errors.push(img.src + ': ultrapassa área segura');
          }
          const card = holder.closest('[data-card]').getBoundingClientRect();
          if (card.left < -1 || card.right > innerWidth + 1 || t.right > card.right || button.bottom > card.bottom) errors.push('fora do card/viewport');
        }
        return errors;
      });
      expect(violations).toEqual([]);
      const pair = page.locator('.photo-pair');
      await expect(pair.locator('img')).toHaveCount(2);
      const sizes = await pair.locator('img').evaluateAll(imgs => imgs.map(i => i.getBoundingClientRect().width));
      expect(Math.abs(sizes[0] - sizes[1])).toBeLessThan(1);
      const duplo = page.locator('[data-card]').filter({ has: page.getByRole('heading', { name: 'X Duplo', exact: true }) });
      await expect(duplo.locator('img')).toHaveCount(0);
      await expect(duplo.locator('.photo-unavailable')).toHaveText('Foto de exemplo não disponível');
      await expect(duplo.locator('[data-price]')).toHaveText('R$ 26,00');
      await expect(page.locator('img[src="img/produtos/picanha-03.webp"]')).toHaveCount(1);
      const picanha = page.locator('[data-card]').filter({ has: page.getByRole('heading', { name: 'X Picanha 03', exact: true }) });
      await expect(picanha.locator('img')).toHaveAttribute('src', 'img/produtos/picanha-03.webp');
    });
  }
}
