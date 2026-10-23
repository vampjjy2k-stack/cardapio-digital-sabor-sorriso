import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const parent = '9bb0cca5e3727f0426405956cd345b2fb3054a47';
const legacyIllustrationParent = 'e49f8264a2355126c288203b2cd6be8bddd41beb';
const git = (...args) => execFileSync('git', args, { cwd: root });
const source = readFileSync(new URL('public/script.js', root), 'utf8');
const baseSource = git('show', `${parent}:public/script.js`).toString();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function data(text) {
  const end = text.indexOf('/* =========================================================\n   UTILIDADES');
  const prefix = text.slice(0, end);
  return JSON.parse(vm.runInNewContext(`${prefix}; JSON.stringify({MENU, ITEM_PHOTOS, ITEM_PHOTO_SETS, illustrations: ILLUSTRATIVE_PHOTOS})`));
}
const base = data(baseSource);
const candidate = data(source);
const sourceManifest = JSON.parse(readFileSync(new URL('docs/ilustracoes-pacote-20261023.json', root)));
const integration = JSON.parse(readFileSync(new URL('docs/ilustracoes-integracao-20261023.json', root)));

test('candidato parte do checkout revisado e Combo 04 recebe a confirmação final sem mudar preço', () => {
  const head = git('rev-parse', 'HEAD').toString().trim();
  if (head !== parent) assert.equal(git('rev-parse', 'HEAD^').toString().trim(), parent);
  const expected = structuredClone(base.MENU);
  const combo = expected.find(section => section.id === 'combos').items.find(item => item.name === 'Combo 04');
  assert.equal(combo.price, 73);
  combo.desc = '3 X-Tudo podrão + 1 Batata Maluca + ovos de codorna + 6 nuggets';
  assert.deepEqual(candidate.MENU, expected);
});

test('51 ilustrações do ZIP têm arquivos distintos, hashes corretos e associação de manifesto sem reuso', () => {
  assert.equal(sourceManifest.assets.length, 51);
  assert.equal(integration.asset_count, 51);
  assert.equal(integration.records.length, 51);
  assert.equal(integration.reuse, false);
  const records = integration.records;
  const paths = records.map(record => record.app_asset);
  assert.equal(new Set(paths).size, 51);
  assert.equal(readdirSync(new URL('public/img/ilustracoes/catalogo/', root)).length, 51);
  assert.equal(Object.keys(candidate.illustrations.items).length, 41);
  assert.equal(Object.keys(candidate.illustrations.variants).length, 10);
  for (const [index, record] of records.entries()) {
    const upstream = sourceManifest.assets[index];
    assert.equal(record.item_id, upstream.item_id);
    assert.equal(record.section, upstream.section);
    assert.equal(record.item_name, upstream.item_name);
    assert.equal(record.source_webp, upstream.webp_640.asset);
    assert.equal(record.sha256, upstream.webp_640.sha256);
    assert.equal(record.label_required, 'Imagem ilustrativa');
    assert.equal(record.confirms_exact_recipe_or_real_size, false);
    assert.equal(hash(readFileSync(new URL(`public/${record.app_asset}`, root))), record.sha256, record.app_asset);
    const mapped = record.variant_key
      ? candidate.illustrations.variants[record.variant_key]
      : candidate.illustrations.items[record.item_id];
    assert.equal(mapped, record.app_asset, record.variant_key || record.item_id);
  }
});

test('tamanhos de vitaminas e sabores da Fanta 2 L têm mapa próprio por variante', () => {
  const variants = candidate.illustrations.variants;
  assert.equal(variants['vitaminas-morango-ao-leite:option:0'], 'img/ilustracoes/catalogo/vitaminas-morango-ao-leite-copo-300ml.webp');
  assert.equal(variants['vitaminas-morango-ao-leite:option:1'], 'img/ilustracoes/catalogo/vitaminas-morango-ao-leite-copo-500ml.webp');
  assert.equal(variants['bebidas-fanta-2l:flavor:Uva'], 'img/ilustracoes/catalogo/bebidas-fanta-2l-uva.webp');
  assert.equal(variants['bebidas-fanta-2l:flavor:Laranja'], 'img/ilustracoes/catalogo/bebidas-fanta-2l-laranja.webp');
});

test('foto real confirmada do Combo 05 permanece preservada ao lado da sua ilustração etiquetada', () => {
  assert.deepEqual(candidate.ITEM_PHOTOS, base.ITEM_PHOTOS);
  assert.deepEqual(candidate.ITEM_PHOTO_SETS, base.ITEM_PHOTO_SETS);
  assert.equal(candidate.ITEM_PHOTOS['combos-combo-05'], 'img/produtos/combo-04.webp');
  assert.equal(candidate.illustrations.items['combos-combo-05'], 'img/ilustracoes/catalogo/combos-combo-05.webp');
  assert.match(source, /photo-compare__entry--illustrative/);
  assert.match(source, /photo-disclaimer\">Imagem ilustrativa/);
  assert.equal(candidate.illustrations.items['combos-combo-04'], undefined);
});

test('nenhuma escala interna dos copos de açaí foi alterada: seis WebPs originais 640×640 permanecem íntegros', () => {
  const acai = integration.records.filter(record => record.item_id.startsWith('acai-'));
  assert.equal(acai.length, 6);
  assert.ok(acai.every(record => record.dimensions_px[0] === 640 && record.dimensions_px[1] === 640));
  for (const record of acai) {
    assert.equal(hash(readFileSync(new URL(`public/${record.app_asset}`, root))), record.sha256);
  }
});

test('X-Picanha 03 e X Duplo não recebem ilustração por inferência', () => {
  assert.equal(candidate.illustrations.items['linha-picanha-x-picanha-03'], undefined);
  assert.equal(candidate.illustrations.items['hamburgueres-x-duplo'], undefined);
  assert.match(integration.exceptions_and_review_notes.find(note => note.item_id === 'hamburgueres-x-duplo').issue, /inconsistent|pendente/);
  assert.match(integration.exceptions_and_review_notes.find(note => note.item_id === 'linha-picanha-x-picanha-03').handling, /preservada/);
});

test('selo ilustrativo está no HTML e as molduras usam contain sem recorte', () => {
  const css = readFileSync(new URL('public/style.css', root), 'utf8');
  assert.match(source, /<small class="photo-disclaimer">Imagem ilustrativa<\/small>/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /aspect-ratio:\s*1\s*\/\s*1/);
  assert.match(css, /overflow:\s*hidden/);
});

test('fotos e registros históricos da base revisada continuam byte a byte intactos', () => {
  const paths = git('ls-tree', '-r', '--name-only', parent, 'public/img', 'docs/fotos-produtos').toString().trim().split('\n');
  for (const path of paths) {
    assert.equal(hash(readFileSync(new URL(path, root))), hash(git('show', `${parent}:${path}`)), path);
  }
  const oldManifest = JSON.parse(readFileSync(new URL('docs/ilustracoes-autorizadas-20261023.json', root)));
  assert.equal(oldManifest.parent, legacyIllustrationParent);
  assert.equal(oldManifest.records.length, 3);
  for (const record of oldManifest.records) {
    assert.equal(hash(readFileSync(new URL(`public/${record.asset}`, root))), record.output_sha256, record.asset);
  }
});
