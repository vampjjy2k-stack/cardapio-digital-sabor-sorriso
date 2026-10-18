import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('docs/fotos-produtos/associacoes.json', root), 'utf8'));
const hash = path => createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
const expected = {
  'artesanal-02.webp': 'artesanais-artesanal-02',
  'artesanal-03-1.webp': 'artesanais-artesanal-03',
  'artesanal-03-2.webp': 'artesanais-artesanal-03',
  'artesanal-04.webp': 'artesanais-artesanal-04',
  'cheddar-03.webp': 'linha-cheddar-x-cheddar-03',
  'cheddar-05.webp': 'linha-cheddar-x-cheddar-05',
  'combo-02.webp': 'combos-combo-02',
  'combo-03.webp': 'combos-combo-03',
  'combo-04.webp': 'combos-combo-04',
  'combo-06.webp': 'combos-combo-06',
};

test('somente dez derivados de alimentos confirmados entram no site; fontes ficam fora', () => {
  assert.equal(existsSync(new URL('docs/fotos-produtos/originais/', root)), false);
  assert.equal(existsSync(new URL('docs/fotos-produtos/preparar.py', root)), false);
  const foods = manifest.records.filter(record => record.page);
  assert.equal(foods.length, 18);
  const associated = foods.filter(record => record.item_id);
  assert.equal(associated.length, 10);
  assert.equal(new Set(associated.map(record => record.item_id)).size, 9);
  for (const record of associated) {
    const filename = record.asset.split('/').at(-1);
    assert.equal(record.asset, `public/img/produtos/${filename}`);
    assert.equal(record.item_id, expected[filename]);
    assert.equal(hash(record.asset), record.asset_sha256);
    assert.equal(record.pending, null);
    const bytes = readFileSync(new URL(record.asset, root));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  assert.deepEqual(readdirSync(new URL('public/img/produtos/', root)).sort(), Object.keys(expected).sort());
  for (const record of foods.filter(record => !record.item_id)) {
    assert.equal(record.asset, null);
    assert.ok(record.pending);
  }
  const walk = dir => readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(`${dir}${entry.name}/`) : [`${dir}${entry.name}`]);
  assert.equal(walk('public/').some(path => /\.(pdf|jpe?g)$/i.test(path)), false);
});

test('sete fotos próprias de bebidas mantêm hashes; H2OH 1,5 L e oito fotos ambíguas sem associação', () => {
  assert.equal(manifest.existing_drink_provenance.length, 6);
  for (const record of manifest.existing_drink_provenance) assert.equal(hash(record.asset), record.asset_sha256);
  const coca = manifest.records.find(record => record.item_id === 'bebidas-coca-cola-2l');
  assert.ok(coca);
  assert.equal(hash(coca.asset), coca.asset_sha256);
  const pending = manifest.records.filter(record => record.pending);
  assert.equal(pending.length, 9);
  for (const record of pending) {
    assert.equal(record.asset, null);
    assert.equal(record.item_id, null);
  }
});
