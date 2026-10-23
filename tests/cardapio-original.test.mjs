import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { applyReviewedDescriptions, applyReviewedPhotos, reviewedDescriptions } from './helpers/cardapio-original.mjs';

const root = new URL('../', import.meta.url);
const baseSHA = '80b2aae3e9226d54f44e6e87f3674fc0b4b9dbda';
const current = readFileSync(new URL('public/script.js', root), 'utf8');
const git = (...args) => execFileSync('git', args, { cwd: root });
const original = git('show', `${baseSHA}:public/script.js`).toString();
function data(source) {
  const prefix = source.slice(0, source.indexOf('/* =========================================================\n   UTILIDADES'));
  return JSON.parse(vm.runInNewContext(`${prefix}; JSON.stringify({MENU, ITEM_PHOTOS, ITEM_PHOTO_SETS, FEATURED_IDS})`));
}
const baseline = data(original);
const candidate = data(current);

test('somente dez descrições respaldadas mudam; nomes, preços, opções e categorias ficam iguais à produção', () => {
  assert.deepEqual(candidate.MENU, applyReviewedDescriptions(structuredClone(baseline.MENU)));
  assert.equal(Object.keys(reviewedDescriptions).length, 10);
  assert.equal(candidate.MENU.flatMap(s => s.items).length, 71);
});

test('Combo 04 usa a resposta final de Janei sem alterar o preço confirmado', () => {
  const combo = candidate.MENU.find(section => section.id === 'combos').items.find(item => item.name === 'Combo 04');
  assert.equal(combo.desc, '3 X-Tudo podrão + 1 Batata Maluca + ovos de codorna + 6 nuggets');
  assert.equal(combo.price, 73);
});

test('X Tudo recupera ovo, bacon, calabresa e complementos; X Salada segue a receita legível sem ovo', () => {
  const items = candidate.MENU.find(s => s.id === 'hamburgueres').items;
  const tudo = items.find(i => i.name === 'X Tudo');
  for (const ingredient of ['ovo', 'bacon', 'calabresa', 'milho', 'ervilha', 'molho Billy Jack', 'maionese temperada', 'batata palha']) assert.ok(tudo.desc.split(' + ').includes(ingredient), ingredient);
  const salada = items.find(i => i.name === 'X Salada');
  assert.ok(salada.desc.includes('presunto'));
  assert.doesNotMatch(salada.desc, /\bovo\b/);
  for (const item of items.filter(i => i.name !== 'Frango Fresh')) assert.doesNotMatch(item.desc, /bimbo|bimbu/i);
});

test('Frango, Cheddars, X-Picanhas e H2OH preservam todos os dados confirmados', () => {
  for (const sectionId of ['linha-cheddar', 'linha-picanha', 'bebidas']) {
    assert.deepEqual(candidate.MENU.find(s => s.id === sectionId), baseline.MENU.find(s => s.id === sectionId));
  }
  const frango = candidate.MENU.flatMap(s => s.items).find(i => i.name === 'Frango Fresh');
  assert.equal(frango.price, 24);
  assert.doesNotMatch(frango.desc, /picles|cream cheese/i);
  assert.deepEqual(frango, baseline.MENU.flatMap(s => s.items).find(i => i.name === 'Frango Fresh'));
});

test('mudanças de foto limitam-se às correções Janei P→G e Combo 04→05, com avisos genéricos onde falta foto', () => {
  assert.deepEqual(candidate.ITEM_PHOTOS, applyReviewedPhotos(structuredClone(baseline.ITEM_PHOTOS)));
  assert.deepEqual(candidate.ITEM_PHOTO_SETS, baseline.ITEM_PHOTO_SETS);
  assert.equal(candidate.ITEM_PHOTOS['porcoes-batata-maluca-p'], undefined);
  assert.equal(candidate.ITEM_PHOTOS['porcoes-batata-maluca-g'], 'img/produtos/batata-maluca-p.webp');
  assert.equal(candidate.ITEM_PHOTOS['combos-combo-04'], undefined);
  assert.equal(candidate.ITEM_PHOTOS['combos-combo-05'], 'img/produtos/combo-04.webp');
  const manifest = JSON.parse(readFileSync(new URL('docs/fotos-produtos/associacoes-confirmadas-20261022.json', root)));
  const potato = manifest.records.find(r => r.asset.endsWith('/batata-maluca-p.webp'));
  assert.deepEqual(potato.item_ids, ['porcoes-batata-maluca-g']);
  assert.match(potato.limits.join(' '), /Janei.*23\/10\/2026/);
  assert.ok(manifest.no_photo_items.some(r => r.item_id === 'porcoes-batata-maluca-p' && r.asset === null));
  assert.ok(!manifest.no_photo_items.some(r => r.item_id === 'porcoes-batata-maluca-g'));
});

test('todos os assets e o manifesto histórico continuam byte a byte iguais à base', () => {
  const paths = git('ls-tree', '-r', '--name-only', baseSHA, 'public/img').toString().trim().split('\n');
  for (const path of [...paths, 'docs/fotos-produtos/associacoes.json']) {
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash(readFileSync(new URL(path, root))), hash(git('show', `${baseSHA}:${path}`)), path);
  }
});

test('destaques são exatamente os oito combos originais em sequência, sem perder os cinco artesanais', () => {
  assert.deepEqual(candidate.FEATURED_IDS, Array.from({ length: 8 }, (_, i) => `combos-combo-0${i + 1}`));
  const expected = applyReviewedDescriptions(structuredClone(baseline.MENU));
  assert.deepEqual(candidate.MENU.find(s => s.id === 'combos'), expected.find(s => s.id === 'combos'));
  assert.equal(candidate.MENU.find(s => s.id === 'combos').items.length, 13);
});
