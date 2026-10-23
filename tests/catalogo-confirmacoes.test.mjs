import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { applyReviewedDescriptions } from './helpers/cardapio-original.mjs';

const baseSHA = '46de50afe46bb268b7efe70498213096ff86d520';
const root = new URL('../', import.meta.url);
const current = readFileSync(new URL('public/script.js', root), 'utf8');
const base = execFileSync('git', ['show', `${baseSHA}:public/script.js`], { cwd: root, encoding: 'utf8' });
function menu(source) {
  const data = source.slice(source.indexOf('const p ='), source.indexOf('const FEATURED_IDS'));
  return JSON.parse(vm.runInNewContext(`${data}; JSON.stringify(MENU)`));
}

test('delta preserva os itens originais exceto as 12 descrições autorizadas', () => {
  const expected = menu(base);
  for (const section of expected) {
    for (const item of section.items) {
      if (section.id === 'hamburgueres') item.desc = item.desc.replace(/^Pão bimbu/, 'Pão');
      if (section.id === 'linha-cheddar') item.desc = item.desc.replace(/\bcheddar\b/g, 'queijo cheddar');
    }
  }
  const original = menu(current).filter(s => s.id !== 'linha-picanha').map(s => ({ ...s, items: s.items.filter(i => i.name !== 'Frango Fresh') }));
  applyReviewedDescriptions(expected);
  assert.deepEqual(original, expected);
});

test('renderização de fotos não usa mapa IMG genérico nem exige o mapa histórico', () => {
  assert.match(current, /ITEM_PHOTOS/);
  assert.match(current, /ITEM_PHOTO_SETS/);
  assert.match(current, /Foto de exemplo não disponível|photo-placeholder/);
  assert.equal(readFileSync(new URL('docs/fotos-produtos/associacoes.json', root), 'utf8'), execFileSync('git', ['show', `${baseSHA}:docs/fotos-produtos/associacoes.json`], { cwd: root, encoding: 'utf8' }));
});

test('nomes confirmados e opções existentes ficam preservados; itens sem confirmação não são criados', () => {
  const sections = menu(current);
  assert.ok(sections.find(s => s.id === 'hamburgueres').items.some(i => i.name === 'X Duplo' && i.price === 26));
  assert.ok(sections.find(s => s.id === 'combos').items.some(i => i.name === 'Combo 07' && i.price === 128));
  const dogs = sections.find(s => s.id === 'hot-dogs').items.filter(i => i.name.startsWith('Dogão'));
  assert.deepEqual(dogs.map(i => [i.name, i.price]), [['Dogão Quente Salsicha', 22], ['Dogão Quente Linguiça', 23]]);
  assert.deepEqual(sections.flatMap(s => s.items).filter(i => /picanha|frango/i.test(i.name)).map(i => i.name).sort(), ['Frango Fresh', 'X Picanha 01', 'X Picanha 02', 'X Picanha 03', 'X Picanha 04']);
});
