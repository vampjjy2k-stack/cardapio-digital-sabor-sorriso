import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const parent = 'e49f8264a2355126c288203b2cd6be8bddd41beb';
const git = (...args) => execFileSync('git', args, { cwd: root });
const source = readFileSync(new URL('public/script.js', root), 'utf8');
const old = git('show', `${parent}:public/script.js`).toString();
const hash = b => createHash('sha256').update(b).digest('hex');
function data(text, extra = '') {
  const prefix = text.slice(0, text.indexOf('/* =========================================================\n   UTILIDADES'));
  return JSON.parse(vm.runInNewContext(`${prefix}; JSON.stringify({MENU, ITEM_PHOTOS, ITEM_PHOTO_SETS, FEATURED_IDS, placeholders: [...PHOTO_PRESENTATION_PLACEHOLDERS]${extra}})`));
}
const before = data(old), after = data(source);

test('filho preserva integralmente catálogo, preços, opções, receitas, destaques e fotos reais do pai e49f826', () => {
  assert.deepEqual(after, before);
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

test('todos os assets antigos e documentos históricos de associação permanecem byte a byte iguais ao pai', () => {
  const paths = git('ls-tree', '-r', '--name-only', parent, 'public/img', 'docs/fotos-produtos').toString().trim().split('\n');
  for (const path of paths) assert.equal(hash(readFileSync(new URL(path, root))), hash(git('show', `${parent}:${path}`)), path);
});

test('apenas três assets finais de ilustração, com proveniência e sem originais-fonte PNG', () => {
  const dir = new URL('public/img/ilustracoes/', root);
  assert.deepEqual(readdirSync(dir).sort(), ['acai-generico.webp', 'artesanal-generico.webp', 'vitamina-generica.webp']);
  const manifest = JSON.parse(readFileSync(new URL('docs/ilustracoes-autorizadas-20261023.json', root)));
  assert.equal(manifest.parent, parent);
  assert.equal(manifest.records.length, 3);
  for (const r of manifest.records) {
    assert.equal(hash(readFileSync(new URL(`public/${r.asset}`, root))), r.output_sha256);
    assert.equal(r.disclaimer, 'Imagem ilustrativa');
    assert.equal(r.confirms_recipe_or_flavor, false);
  }
});
