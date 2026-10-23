import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

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

test('H2OH Limão 500 ml: alpha externo transparente e RGB opaco idêntico à base', async ({ page }) => {
  const original = execFileSync('git', ['show', '72952cc919e251dca977b9d9809863fd91678951:public/img/h2oh-limao-500ml.webp']);
  expect(createHash('sha256').update(original).digest('hex')).toBe('5184e83ecd188a78d4d1810adfd032d3ab79459d018df7f79e77f90b668842b1');
  await page.route('**/__h2oh-original.webp', route => route.fulfill({ contentType: 'image/webp', body: original }));
  await page.goto('/index.html');
  const stats = await page.evaluate(async () => {
    const decode = async url => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Asset indisponível: ${response.status}`);
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return { width: canvas.width, height: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data };
    };
    const before = await decode('/__h2oh-original.webp');
    const after = await decode('/img/h2oh-limao-500ml.webp');
    let transparent = 0, opaque = 0, smooth = 0, opaqueRgbChanged = 0, edgeNonzero = 0, originalNonopaque = 0;
    for (let y = 0; y < after.height; y++) {
      for (let x = 0; x < after.width; x++) {
        const i = (y * after.width + x) * 4;
        const alpha = after.data[i + 3];
        if (before.data[i + 3] !== 255) originalNonopaque++;
        if (alpha === 0) transparent++;
        else if (alpha === 255) {
          opaque++;
          if ([0, 1, 2].some(c => after.data[i + c] !== before.data[i + c])) opaqueRgbChanged++;
        } else smooth++;
        if ((x === 0 || y === 0 || x === after.width - 1 || y === after.height - 1) && alpha !== 0) edgeNonzero++;
      }
    }
    return { beforeSize: [before.width, before.height], afterSize: [after.width, after.height], transparent, opaque, smooth, opaqueRgbChanged, edgeNonzero, originalNonopaque };
  });
  expect(stats).toEqual({ beforeSize: [507, 600], afterSize: [507, 600], transparent: 233140, opaque: 66070, smooth: 4990, opaqueRgbChanged: 0, edgeNonzero: 0, originalNonopaque: 0 });
});
