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

test('derivados históricos e confirmados entram no site; fontes ficam fora', () => {
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
  const files = readdirSync(new URL('public/img/produtos/', root)).sort();
  const newAssets = ['x-duplo.webp', 'combo-07.webp', 'batata-maluca-p.webp', 'batata-cheddar-bacon-g.webp', 'dogao-quente.webp', 'frango-fresh.webp', 'picanha-03.webp'];
  assert.deepEqual(files.sort(), [...Object.keys(expected), ...newAssets].sort());
  assert.ok(existsSync(new URL('public/img/h2oh-limao-500ml.webp', root)));
  for (const filename of newAssets) {
    const bytes = readFileSync(new URL(`public/img/produtos/${filename}`, root));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
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

test('retoque autorizado de câmera tem proveniência localizada; Artesanal 04 permanece intacto', () => {
  const combo = manifest.records.find(record => record.item_id === 'combos-combo-04');
  assert.equal(combo.edit_provenance.before_asset_sha256, '6275ab8ecd7596d5bfeb09af607ba6d51ee183cfc28d16bdbcd7ade279a73cad');
  assert.deepEqual(combo.edit_provenance.region_xyxy, [104, 942, 238, 963]);
  assert.equal(combo.edit_provenance.alpha_preserved, true);
  assert.equal(combo.edit_provenance.outside_region_pixels_preserved, true);
  assert.equal(hash(combo.asset), '8291ad055f5416b3183865b3afd5f58c1dba7329149d59a603d7f590edc9b649');
  const artesanal = manifest.records.find(record => record.item_id === 'artesanais-artesanal-04');
  assert.equal(hash(artesanal.asset), '39c72e1586b1de676db240c812cbbffd3edfc5a9d4c73b9ab6816ef71c539e19');
  assert.match(combo.review_note, /aprovação explícita do SHA final/);
});

test('oito derivados novos têm hashes, dimensões e proveniência separados do histórico', () => {
  const incremental = JSON.parse(readFileSync(new URL('docs/fotos-produtos/associacoes-confirmadas-20261022.json', root), 'utf8'));
  assert.equal(incremental.records.length, 8);
  const ids = incremental.records.flatMap(record => record.item_ids);
  assert.equal(ids.length, 9);
  assert.equal(new Set(ids).size, 9);
  for (const record of incremental.records) {
    assert.equal(hash(record.asset), record.derived_sha256);
    assert.deepEqual(record.derived_dimensions, record.source_dimensions);
    assert.equal(record.decoded_rgb_pixels_preserved, true);
    assert.equal(record.derived_mode, 'RGB');
    assert.match(record.source_sha256, /^[a-f0-9]{64}$/);
    if (record.item_ids.some(id => /picanha/.test(id))) {
      assert.deepEqual(record.item_ids, ['linha-picanha-x-picanha-03']);
      assert.equal(record.source_caption, 'Picanha 03');
      assert.equal(record.source_filename, 'foto-008.jpg');
      assert.equal(record.source_sha256, '7be671740a7349d1b611ee4ffabd1314f4ec1d0bf1f5630bf7de6eac1cc4a882');
      assert.equal(record.source_pdf_page, 2);
    }
  }
  const dog = incremental.records.find(record => record.asset.endsWith('dogao-quente.webp'));
  assert.deepEqual(dog.item_ids, ['hot-dogs-dogao-quente-salsicha', 'hot-dogs-dogao-quente-linguica']);
  const h2oh = incremental.records.find(record => record.source_filename === '1000026854.jpg');
  assert.deepEqual(h2oh.item_ids, ['bebidas-h2o-600ml']);
  assert.equal(h2oh.source_sha256, '253bdec418bc3b0f770ecf0130e7a171f94569ad5b4abcd5f628add22fb06c7a');
});
