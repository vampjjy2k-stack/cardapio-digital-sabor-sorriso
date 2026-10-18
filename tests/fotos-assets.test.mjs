import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('docs/fotos-produtos/associacoes.json', root), 'utf8'));
const hash = path => createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
test('nenhuma das 18 fotos do PDF integra public ou associações efetivas', () => {
  assert.equal(existsSync(new URL('public/img/produtos/', root)), false);
  assert.equal(existsSync(new URL('docs/fotos-produtos/originais/', root)), false);
  assert.equal(existsSync(new URL('docs/fotos-produtos/preparar.py', root)), false);
  const foods = manifest.records.filter(record => record.page);
  assert.equal(foods.length, 18);
  for (const record of foods) {
    assert.equal(record.asset, null);
    assert.equal(record.item_id, null);
    assert.equal(record.review_status, 'excluida_por_joao_foto_de_teste');
  }
  const script = readFileSync(new URL('public/script.js', root), 'utf8');
  assert.equal(script.includes('img/produtos/'), false);
});
test('seis bebidas próprias e Coca PET 2 L mantêm hashes; H2OH 1,5 L e PDF sem associação', () => {
  assert.equal(manifest.existing_drink_provenance.length, 6);
  for (const record of manifest.existing_drink_provenance) assert.equal(hash(record.asset), record.asset_sha256);
  const coca = manifest.records.find(record => record.item_id === 'bebidas-coca-cola-2l');
  assert.ok(coca);
  assert.equal(hash(coca.asset), coca.asset_sha256);
  const pending = manifest.records.filter(record => record.pending);
  assert.equal(pending.length, 19);
  for (const record of pending) {
    assert.equal(record.asset, null);
    assert.equal(record.item_id, null);
  }
});
