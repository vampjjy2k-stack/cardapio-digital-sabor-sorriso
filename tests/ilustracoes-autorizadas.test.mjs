import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const parent = 'a0bbe7e6f6a80219b01b9c511cac5566949f72f5';
const illustrationParent = 'e49f8264a2355126c288203b2cd6be8bddd41beb';
const git = (...args) => execFileSync('git', args, { cwd: root });
const source = readFileSync(new URL('public/script.js', root), 'utf8');
const old = git('show', `${parent}:public/script.js`).toString();
const hash = b => createHash('sha256').update(b).digest('hex');
function data(text, extra = '') {
  const prefix = text.slice(0, text.indexOf('/* =========================================================\n   UTILIDADES'));
  return JSON.parse(vm.runInNewContext(`${prefix}; JSON.stringify({MENU, ITEM_PHOTOS, ITEM_PHOTO_SETS, FEATURED_IDS, placeholders: [...PHOTO_PRESENTATION_PLACEHOLDERS]${extra}})`));
}
const before = data(old), after = data(source);

test('novo candidato é filho direto do SHA confirmado e contém apenas o delta explícito de Combo 04/05', () => {
  assert.equal(git('rev-parse', 'HEAD^').toString().trim(), parent);
  const expected = structuredClone(before);
  const combo04 = expected.MENU.find(section => section.id === 'combos').items.find(item => item.name === 'Combo 04');
  assert.equal(combo04.price, 73);
  combo04.desc = '3 x-tudos padrão + Batata Maluca + ovos de codorna + 6 anéis de cebola';
  expected.ITEM_PHOTOS['combos-combo-05'] = expected.ITEM_PHOTOS['combos-combo-04'];
  delete expected.ITEM_PHOTOS['combos-combo-04'];
  assert.deepEqual(after, expected);
});

test('ilustrações limitadas às categorias açaí/vitaminas e Artesanais 01, 05, 06 sem foto própria', () => {
  const { illustrations } = data(source, ', illustrations: ILLUSTRATIVE_PHOTOS');
  assert.deepEqual(illustrations.sections, { acai: 'img/ilustracoes/acai-generico.webp', vitaminas: 'img/ilustracoes/vitamina-generica.webp' });
  assert.deepEqual(illustrations.items, {
    'artesanais-artesanal-01': 'img/ilustracoes/artesanal-generico.webp',
    'artesanais-artesanal-05': 'img/ilustracoes/artesanal-generico.webp',
    'artesanais-artesanal-06': 'img/ilustracoes/artesanal-generico.webp'
  });
  for (const id of Object.keys(illustrations.items)) {
    assert.equal(after.ITEM_PHOTOS[id], undefined);
    assert.equal(after.ITEM_PHOTO_SETS[id], undefined);
  }
  assert.match(source, /<small class="photo-disclaimer">Imagem ilustrativa<\/small>/);
  assert.match(source, /não representa sabor, ingredientes ou tamanho específicos/);
});

test('assets e manifestos históricos permanecem byte a byte iguais; mapa ativo registra a confirmação posterior', () => {
  const paths = git('ls-tree', '-r', '--name-only', parent, 'public/img', 'docs/fotos-produtos').toString().trim().split('\n').filter(path => path !== 'docs/fotos-produtos/mapa-publico.md');
  for (const path of paths) assert.equal(hash(readFileSync(new URL(path, root))), hash(git('show', `${parent}:${path}`)), path);
  const map = readFileSync(new URL('docs/fotos-produtos/mapa-publico.md', root), 'utf8');
  assert.match(map, /\| `combos-combo-05` \| `\/img\/produtos\/combo-04\.webp` \|/);
  assert.doesNotMatch(map, /\| `combos-combo-04` \| `\/img\/produtos\/combo-04\.webp` \|/);
});

test('apenas três assets finais de ilustração, com proveniência e sem originais-fonte PNG', () => {
  const dir = new URL('public/img/ilustracoes/', root);
  assert.deepEqual(readdirSync(dir).sort(), ['acai-generico.webp', 'artesanal-generico.webp', 'vitamina-generica.webp']);
  const manifest = JSON.parse(readFileSync(new URL('docs/ilustracoes-autorizadas-20261023.json', root)));
  assert.equal(manifest.parent, illustrationParent);
  assert.equal(manifest.records.length, 3);
  for (const r of manifest.records) {
    assert.equal(hash(readFileSync(new URL(`public/${r.asset}`, root))), r.output_sha256);
    assert.equal(r.disclaimer, 'Imagem ilustrativa');
    assert.equal(r.confirms_recipe_or_flavor, false);
  }
});
