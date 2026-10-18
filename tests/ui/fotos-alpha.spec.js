import { test, expect } from '@playwright/test';

const stems = ['guarana-antarctica-350ml', 'fanta-laranja-350ml', 'fanta-uva-350ml', 'kuat-2l', 'coca-cola-600ml', 'coca-cola-lata', 'coca-cola-2l'];
for (const stem of stems) {
  test(`${stem}: bebida PNG decodifica com fundo transparente e produto opaco`, async ({ page }) => {
    await page.goto('/index.html');
    const stats = await page.evaluate(async stem => {
      const response = await fetch(`/img/${stem}.png`);
      if (!response.ok) throw new Error(`Asset indisponível: ${response.status}`);
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0, opaque = 0, smooth = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) transparent++;
        else if (data[i] === 255) opaque++;
        else smooth++;
      }
      return { transparent, opaque, smooth, total: canvas.width * canvas.height };
    }, stem);
    expect(stats.transparent).toBeGreaterThan(0);
    expect(stats.opaque).toBeGreaterThan(0);
    // A PET 2 L aprovada possui alpha binário original: não retocar para criar suavização.
    if (stem === 'coca-cola-2l') expect(stats.smooth).toBe(0);
    else expect(stats.smooth).toBeGreaterThan(0);
  });
}
