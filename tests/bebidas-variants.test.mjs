import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const script = fs.readFileSync(new URL('../public/script.js', import.meta.url), 'utf8');

class StubElement {
  constructor(id = '') {
    this.id = id;
    this.dataset = {};
    this.style = {};
    this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    this.hidden = false;
    this.value = '';
    this.checked = false;
    this.textContent = '';
    this.innerHTML = '';
  }
  addEventListener() {}
  removeEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  setAttribute() {}
  removeAttribute() {}
  focus() {}
}

function runtime() {
  const elements = new Map();
  const document = {
    body: new StubElement('body'),
    documentElement: new StubElement('html'),
    activeElement: null,
    querySelector(selector) {
      if (selector.startsWith('#')) {
        if (!elements.has(selector.slice(1))) elements.set(selector.slice(1), new StubElement(selector.slice(1)));
        return elements.get(selector.slice(1));
      }
      return null;
    },
    querySelectorAll() { return []; },
    createElement() { return new StubElement(); },
    addEventListener() {},
  };
  const storage = new Map();
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); },
  };
  const window = {
    localStorage,
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); },
    open() {},
  };
  const context = {
    console, document, window, localStorage,
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: window.requestAnimationFrame,
    IntersectionObserver: class {},
    HTMLInputElement: StubElement,
    HTMLImageElement: StubElement,
    CSS: { escape: value => String(value) },
    Intl, URL, URLSearchParams, Node: StubElement,
  };
  vm.createContext(context);
  const marker = '/* Referências do DOM */';
  assert.ok(script.includes(marker), 'script deve manter o marcador de referências do DOM');
  const prefix = script.split(marker)[0];
  const utilityStart = script.indexOf('function describeLine');
  const utilityEnd = script.indexOf('function loadCart', utilityStart);
  assert.ok(utilityStart > -1 && utilityEnd > utilityStart, 'utilidades de linha precisam existir');
  const utilities = script.slice(utilityStart, utilityEnd);
  const expose = `\nglobalThis.__beverageTest = { MENU, ITEM_INDEX, ITEM_PHOTOS, BEVERAGE_GROUPS, describeLine, lineKey };`;
  vm.runInContext(prefix + utilities + expose, context, { filename: 'public/script.js' });
  return context.__beverageTest;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const expectedPrices = {
  'bebidas-coca-cola-lata': 7,
  'bebidas-coca-cola-600ml': 8,
  'bebidas-coca-cola-2l': 15,
  'bebidas-fanta-uva-lata': 7,
  'bebidas-fanta-laranja-lata': 7,
  'bebidas-fanta-2l': 13,
};

function allVariants(api) {
  return api.BEVERAGE_GROUPS.flatMap(group => group.variants.map(variant => ({ group, variant })));
}
function lineOf(variant) {
  return { id: variant.id, opt: variant.opt, ...(variant.id === 'bebidas-fanta-2l' ? { flavor: variant.flavor } : {}) };
}

test('BEVERAGE_GROUPS preserva as quatro chaves, títulos, seções e 71 combinações', () => {
  const api = runtime();
  assert.deepEqual(plain(api.BEVERAGE_GROUPS.map(group => group.key)), ['coca-cola', 'fanta', 'vitaminas', 'sucos']);
  assert.deepEqual(plain(api.BEVERAGE_GROUPS.map(group => group.section)), ['bebidas', 'bebidas', 'vitaminas', 'sucos']);
  assert.deepEqual(plain(api.BEVERAGE_GROUPS.map(group => group.title)), ['Coca-Cola', 'Fanta', 'Vitaminas ao leite', 'Sucos naturais']);
  assert.equal(allVariants(api).length, 17);
  for (const { group, variant } of allVariants(api)) {
    assert.match(variant.id, /^\w[\w-]*$/);
    assert.ok(variant.opt === null || Number.isInteger(variant.opt));
    assert.ok(api.ITEM_INDEX.has(variant.id), `${group.key}/${variant.id} deve apontar para ITEM_INDEX`);
  }
});

test('cada combinação tem preço correto, inclusive Fanta 2L confirmada sem ressalva', () => {
  const api = runtime();
  const variants = allVariants(api);
  const prices = variants.map(({ variant }) => api.describeLine(lineOf(variant)));
  assert.equal(prices.length, 17);
  assert.ok(prices.every(Boolean), 'toda variante deve ser descritível');
  for (const { variant } of variants) {
    const line = api.describeLine(lineOf(variant));
    if (variant.id === 'bebidas-fanta-2l') {
      assert.equal(line.price, 13, 'Fanta 2L custa R$ 13,00 nos dois sabores');
      assert.equal(line.name, `Fanta - PET 2 L - ${variant.flavor}`);
      assert.doesNotMatch(line.name, /confirmar preço|valor herdado/i);
    }
  }
  for (const [id, price] of Object.entries(expectedPrices)) {
    const refs = variants.filter(({ variant }) => variant.id === id);
    assert.ok(refs.length, `${id} deve estar no catálogo de variantes`);
    for (const { variant } of refs) assert.equal(api.describeLine(lineOf(variant)).price, price, id);
  }
  const maracuja500 = variants.find(({ variant }) => variant.id === 'vitaminas-maracuja-ao-leite' && variant.opt === 1);
  assert.ok(maracuja500, 'Maracujá 500ML deve existir');
  assert.equal(api.describeLine(lineOf(maracuja500.variant)).price, 15);
});

test('metadados de sabor e embalagem são exatos e referências inválidas são recusadas', () => {
  const api = runtime();
  const groups = Object.fromEntries(api.BEVERAGE_GROUPS.map(group => [group.key, group]));
  assert.deepEqual([...new Set(groups.fanta.variants.filter(v => v.id === 'bebidas-fanta-2l').map(v => v.flavor))].sort(), ['Laranja', 'Uva']);
  assert.deepEqual([...new Set(groups.fanta.variants.map(v => v.pack).filter(Boolean))].sort(), ['Lata 350 ml', 'PET 2 L']);
  assert.deepEqual([...new Set(groups['coca-cola'].variants.map(v => v.pack))].sort(), ['Lata (volume a confirmar)', 'PET 2 L', 'PET 600 ml']);
  assert.deepEqual([...new Set(groups.vitaminas.variants.map(v => v.flavor))].sort(), ['Cupuaçu ao Leite', 'Graviola ao Leite', 'Maracujá ao Leite', 'Morango ao Leite']);
  assert.deepEqual([...new Set(groups.vitaminas.variants.map(v => v.pack))].sort(), ['Copo 300ML', 'Copo 500ML']);
  assert.deepEqual([...new Set(groups.sucos.variants.map(v => v.pack))], ['Copo 500ML']);
  for (const bad of [
    { id: 'bebidas-fanta-2l', opt: null, flavor: 'Manga' },
    { id: 'bebidas-fanta-2l', opt: null, flavor: ['Uva'] },
    { id: 'bebidas-coca-cola-600ml', opt: null, flavor: 'Uva' },
    { id: 'nao-existe', opt: null },
    { id: 'vitaminas-maracuja-ao-leite', opt: 99 },
  ]) assert.equal(api.describeLine(bad), null, JSON.stringify(bad));
});

test('lineKey separa sabores da Fanta 2L, mas mantém demais IDs e opções compatíveis', () => {
  const api = runtime();
  const uva = { id: 'bebidas-fanta-2l', opt: null, flavor: 'Uva' };
  const laranja = { id: 'bebidas-fanta-2l', opt: null, flavor: 'Laranja' };
  assert.notEqual(api.lineKey(uva), api.lineKey(laranja));
  assert.equal(api.lineKey({ id: 'bebidas-fanta-2l', opt: null, flavor: 'Uva' }), api.lineKey(uva));
  assert.equal(api.lineKey({ id: 'bebidas-coca-cola-600ml', opt: null }), 'bebidas-coca-cola-600ml|');
  assert.notEqual(api.lineKey({ id: 'vitaminas-maracuja-ao-leite', opt: 0 }), api.lineKey({ id: 'vitaminas-maracuja-ao-leite', opt: 1 }));
  assert.equal(api.describeLine({ id: 'bebidas-h2o-600ml', opt: null }).price, 7);
  assert.equal(api.ITEM_INDEX.get('bebidas-h2o-600ml').item.meta, '500ML');
  assert.equal(api.ITEM_INDEX.get('bebidas-h2o-600ml').item.name, 'H2OH!');
  assert.equal(api.describeLine({ id: 'bebidas-h2o-600ml', opt: null }).name, 'H2OH! - 500 ml - sabor a confirmar');
  assert.equal(api.ITEM_INDEX.get('bebidas-guarana-antartica-lata').item.price, 7);
  assert.equal(api.ITEM_INDEX.get('bebidas-kuat-2l').item.price, 8);
});

test('preserva 66 registros e IDs com somente H2OH!, combos e Bimbo autorizados', () => {
  const api = runtime();
  const base = JSON.parse(fs.readFileSync(new URL('./fixtures/menu-base-7336733.json', import.meta.url), 'utf8'));
  const current = plain(api.MENU);
  const baseItems = base.flatMap(s => s.items);
  const items = current.flatMap(s => s.items);
  assert.equal(baseItems.length, 66);
  assert.equal(items.length, 66);
  assert.equal(api.ITEM_INDEX.size, 66);
  assert.deepEqual(items.map(i => i.id), baseItems.map(i => i.id));
  const h2o = baseItems.find(i => i.id === 'bebidas-h2o-600ml');
  h2o.name = 'H2OH!';
  h2o.meta = '500ML';
  for (const item of base.find(section => section.id === 'combos').items) {
    item.price = item.name === 'Combo 02' ? 48 : item.name === 'Combo 03' ? 65 : item.price + 3;
  }
  for (const item of base.find(section => section.id === 'linha-cheddar').items) {
    item.desc = item.desc.replace(/^pão bimbu/, 'pão Bimbo');
  }
  assert.deepEqual(current, base);
  const combinations = items.reduce((sum, item) => sum + (item.options?.length || 1), 0);
  assert.equal(combinations, 70);
  const groupedIds = new Set(allVariants(api).map(({ variant }) => variant.id));
  const standaloneCount = items.filter(item => !groupedIds.has(item.id))
    .reduce((sum, item) => sum + (item.options?.length || 1), 0);
  assert.equal(standaloneCount + allVariants(api).length, 71);
  const legacy = api.describeLine({ id: 'bebidas-fanta-2l', opt: null });
  assert.match(legacy.name, /sabor a confirmar/);
  assert.equal(legacy.price, 13);
});

test('todos os 13 combos usam preços novos em catálogo e carrinho, sem alterar composição', () => {
  const api = runtime();
  const expected = {
    'Combo 01': 25, 'Combo 02': 48, 'Combo 03': 65, 'Combo 04': 73,
    'Combo 05': 78, 'Combo 06': 113, 'Combo 07': 128, 'Combo 08': 98,
    'Mini 01': 32, 'Dupla Perfeita 02': 60, 'Bomba de Sabor 03': 103,
    'Explosão de Sabor 04': 138, 'Brutal 05': 152,
  };
  const combos = api.MENU.find(section => section.id === 'combos').items;
  assert.equal(combos.length, 13);
  for (const item of combos) {
    assert.equal(item.price, expected[item.name], item.name);
    assert.equal(api.describeLine({ id: item.id, opt: null }).price, expected[item.name], item.id);
  }
});

test('pão Bimbo fica restrito aos cinco Cheddars, sem generalização para hambúrgueres ou artesanais', () => {
  const api = runtime();
  const base = JSON.parse(fs.readFileSync(new URL('./fixtures/menu-base-7336733.json', import.meta.url), 'utf8'));
  const cheddar = api.MENU.find(section => section.id === 'linha-cheddar');
  assert.equal(cheddar.items.length, 5);
  for (const item of cheddar.items) assert.match(item.desc, /^pão Bimbo \+/);
  for (const section of api.MENU.filter(section => section.id !== 'linha-cheddar')) {
    assert.deepEqual(plain(section.items.map(item => item.desc)), base.find(s => s.id === section.id).items.map(item => item.desc));
  }
});

test('mapa de fotos contém exatamente as seis bebidas atuais, Coca 2L, sem fotos PDF', () => {
  const api = runtime();
  const expected = {
    'bebidas-guarana-antartica-lata': 'img/guarana-antarctica-350ml.png',
    'bebidas-fanta-laranja-lata': 'img/fanta-laranja-350ml.png',
    'bebidas-fanta-uva-lata': 'img/fanta-uva-350ml.png',
    'bebidas-kuat-2l': 'img/kuat-2l.png',
    'bebidas-coca-cola-600ml': 'img/coca-cola-600ml.png',
    'bebidas-coca-cola-lata': 'img/coca-cola-lata.png',
    'bebidas-coca-cola-2l': 'img/coca-cola-2l.png',
  };
  assert.deepEqual(plain(api.ITEM_PHOTOS), expected);
  assert.equal(Object.keys(api.ITEM_PHOTOS).length, 7);
  for (const [id, path] of Object.entries(expected)) {
    assert.match(id, /^\w[\w-]*$/);
    assert.ok(api.ITEM_INDEX.has(id), `${id} deve apontar para ITEM_INDEX`);
    assert.ok(fs.statSync(new URL(`../public/${path}`, import.meta.url)).size > 0, path);
  }
  assert.equal(api.ITEM_PHOTOS['bebidas-h2o-600ml'], undefined, 'H2OH! 500ml mantém ausência de foto');
  assert.equal(api.ITEM_PHOTOS['bebidas-fanta-2l'], undefined, 'Fanta 2L mantém ausência de foto');
  assert.equal(api.ITEM_PHOTOS['artesanais-artesanal-03'], undefined);
  assert.equal(api.ITEM_PHOTOS['artesanais-artesanal-04'], undefined);
  assert.equal(api.ITEM_PHOTOS['combos-combo-04'], undefined);
  assert.equal(api.ITEM_PHOTOS['combos-combo-07'], undefined);
  assert.equal(api.ITEM_PHOTOS['hamburgueres-x-duplo'], undefined);
  for (const id of ['linha-cheddar-x-cheddar-01', 'linha-cheddar-x-cheddar-02', 'linha-cheddar-x-cheddar-04']) assert.equal(api.ITEM_PHOTOS[id], undefined);
  const uva = fs.readFileSync(new URL('../public/img/fanta-uva-350ml.png', import.meta.url));
  assert.equal(createHash('sha256').update(uva).digest('hex'), '73487550d9eb4ca64e60908fe65f80d67a3139a27aa1f5600ff13b1b735bbc6e');
});
