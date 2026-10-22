import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const currentScript = fs.readFileSync(new URL('../public/script.js', import.meta.url), 'utf8');
const marker = '/* Referências do DOM */';

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

function evaluate(source) {
  const elements = new Map();
  const document = {
    body: new StubElement('body'),
    documentElement: new StubElement('html'),
    activeElement: null,
    querySelector(selector) {
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        if (!elements.has(id)) elements.set(id, new StubElement(id));
        return elements.get(id);
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
  assert.ok(source.includes(marker), 'script deve manter o marcador de referências do DOM');
  const prefix = source.split(marker)[0];
  const utilityStart = source.indexOf('function describeLine');
  const utilityEnd = source.indexOf('function loadCart', utilityStart);
  assert.ok(utilityStart > -1 && utilityEnd > utilityStart, 'utilidades de linha precisam existir');
  const utilities = source.slice(utilityStart, utilityEnd);
  const expose = '\nglobalThis.__xPicanhaTest = { MENU, ITEM_PHOTOS, ITEM_PHOTO_SETS, describeLine };';
  vm.runInContext(prefix + utilities + expose, context, { filename: 'public/script.js' });
  return context.__xPicanhaTest;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseRuntime() {
  const source = execFileSync('git', ['show', 'a15e8ff:public/script.js'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });
  return evaluate(source);
}

function currentRuntime() {
  return evaluate(currentScript);
}

const expectedItems = [
  {
    id: 'linha-picanha-x-picanha-01',
    name: 'X Picanha 01',
    price: 19,
    desc: 'pão brioche + hambúrguer picanha 120 gramas + queijo + presunto + tomate + alface + molhos + ketchup',
  },
  {
    id: 'linha-picanha-x-picanha-02',
    name: 'X Picanha 02',
    price: 23,
    desc: 'pão brioche + hambúrguer picanha 120 gramas + queijo + presunto + ovo + bacon + tomate + alface + molhos',
  },
  {
    id: 'linha-picanha-x-picanha-03',
    name: 'X Picanha 03',
    price: 36,
    desc: 'pão brioche + 2 hambúrgueres de picanha 120 gramas (2 carnes) + queijo + presunto + calabresa + 2 ovos + o dobro de bacon + tomate + alface + molhos + ketchup',
  },
  {
    id: 'linha-picanha-x-picanha-04',
    name: 'X Picanha 04',
    price: 21,
    desc: 'pão brioche + hambúrguer de picanha 120 gramas + queijo + presunto + bacon + tomate + alface + molhos + ketchup',
  },
];

test('inclui exatamente a seção Linha Picanha com os quatro itens e preços', () => {
  const api = currentRuntime();
  const sections = api.MENU.filter(section => section.id === 'linha-picanha');
  assert.equal(sections.length, 1);
  assert.deepEqual(plain(sections[0]), {
    id: 'linha-picanha', title: 'Linha Picanha', icon: '🥩', img: 'burgerCamadas', items: expectedItems,
  });
  for (const item of expectedItems) {
    const line = api.describeLine({ id: item.id, opt: null });
    assert.deepEqual(plain(line), { name: item.name, price: item.price });
  }
});

test('mantém itens do candidato de fotos, exceto adições Picanha e Frango Fresh', () => {
  const current = currentRuntime();
  const base = baseRuntime();
  const withoutPicanha = api => plain(api.MENU.filter(section => section.id !== 'linha-picanha')).map(section => ({ ...section, items: section.items.filter(item => item.id !== 'hamburgueres-frango-fresh') }));
  assert.deepEqual(withoutPicanha(current), withoutPicanha(base));
});

test('mantém fotos do candidato anterior, adiciona Frango Fresh e foto literal exclusiva de Picanha 03', () => {
  const current = currentRuntime();
  const base = baseRuntime();
  const photos = plain(current.ITEM_PHOTOS);
  delete photos['hamburgueres-frango-fresh'];
  delete photos['linha-picanha-x-picanha-03'];
  assert.deepEqual(photos, plain(base.ITEM_PHOTOS));
  assert.deepEqual(plain(current.ITEM_PHOTO_SETS), plain(base.ITEM_PHOTO_SETS));
  assert.equal(current.ITEM_PHOTOS['linha-picanha-x-picanha-01'], undefined);
  assert.equal(current.ITEM_PHOTOS['linha-picanha-x-picanha-02'], undefined);
  assert.equal(current.ITEM_PHOTOS['linha-picanha-x-picanha-03'], 'img/produtos/picanha-03.webp');
  assert.deepEqual(Object.entries(current.ITEM_PHOTOS).filter(([, src]) => src.endsWith('picanha-03.webp')), [['linha-picanha-x-picanha-03', 'img/produtos/picanha-03.webp']]);
  assert.equal(current.ITEM_PHOTOS['linha-picanha-x-picanha-04'], undefined);
});

test('preserva a pendência histórica de Frango sem reescrever o manifesto antigo', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../docs/fotos-produtos/associacoes.json', import.meta.url), 'utf8'));
  const frango = manifest.records.filter(record => record.caption === 'Frango');
  assert.equal(frango.length, 1);
  assert.equal(frango[0].item_id, null);
  assert.equal(frango[0].asset, null);
});

const frangoDescription = 'pão Bimbo + filé de peito de frango empanado (120 g) + alface + cheddar em fatia + cebola roxa crua + molho especial';
test('Frango Fresh tem receita corrigida por João, R$24, foto exclusiva e ID estável', () => {
  const api = currentRuntime();
  const items = plain(api.MENU).flatMap(s => s.items);
  const frango = items.filter(i => i.name === 'Frango Fresh');
  assert.deepEqual(frango, [{ id: 'hamburgueres-frango-fresh', name: 'Frango Fresh', price: 24, desc: frangoDescription }]);
  assert.doesNotMatch(frango[0].desc, /picles|cream cheese/i);
  assert.deepEqual(plain(api.describeLine({ id: frango[0].id, opt: null })), { name: 'Frango Fresh', price: 24 });
  assert.deepEqual(Object.entries(api.ITEM_PHOTOS).filter(([, src]) => src.endsWith('frango-fresh.webp')), [[frango[0].id, 'img/produtos/frango-fresh.webp']]);
  const manifest = JSON.parse(fs.readFileSync(new URL('../docs/fotos-produtos/associacoes-confirmadas-20261022.json', import.meta.url), 'utf8'));
  const record = manifest.records.find(r => r.source_caption === 'Frango');
  assert.deepEqual(record.item_ids, [frango[0].id]);
  assert.equal(record.source_filename, 'foto-009.jpg');
  assert.equal(record.confirmed_description, frangoDescription);
  assert.equal(record.confirmed_price, 24);
});
test('todos os X Picanha usam brioche sem Bimbo e o 04 mantém R$21', () => {
  const items = currentRuntime().MENU.find(s => s.id === 'linha-picanha').items;
  for (const item of items) {
    assert.match(item.desc, /^pão brioche \+ /);
    assert.doesNotMatch(item.desc, /bimbo/i);
  }
  assert.equal(items.find(i => i.name === 'X Picanha 04').price, 21);
});


test('correção Picanha 03 preserva catálogo de bcab8ed exceto brioche autorizado no 04', () => {
  const previous = evaluate(execFileSync('git', ['show', 'bcab8ed8b2d77aae2ce14e3d178863d45bb367fb:public/script.js'], { cwd: root, encoding: 'utf8' }));
  const current = currentRuntime();
  const expected = plain(previous.MENU);
  expected.find(s => s.id === 'linha-picanha').items.find(i => i.name === 'X Picanha 04').desc = 'pão brioche + ' + expected.find(s => s.id === 'linha-picanha').items.find(i => i.name === 'X Picanha 04').desc;
  assert.deepEqual(plain(current.MENU), expected, 'apenas o prefixo brioche do 04 pode mudar; todos os preços, itens e demais receitas são preservados');
  const photos = plain(current.ITEM_PHOTOS);
  assert.equal(photos['linha-picanha-x-picanha-03'], 'img/produtos/picanha-03.webp');
  delete photos['linha-picanha-x-picanha-03'];
  assert.deepEqual(photos, plain(previous.ITEM_PHOTOS));
  assert.deepEqual(plain(current.ITEM_PHOTO_SETS), plain(previous.ITEM_PHOTO_SETS));
  const manifest = JSON.parse(fs.readFileSync(new URL('../docs/fotos-produtos/associacoes-confirmadas-20261022.json', import.meta.url), 'utf8'));
  const picanha = manifest.records.filter(r => r.item_ids.some(id => id.startsWith('linha-picanha-')));
  assert.equal(picanha.length, 1);
  assert.deepEqual(picanha[0].item_ids, ['linha-picanha-x-picanha-03']);
  assert.equal(picanha[0].source_caption, 'Picanha 03');
  assert.equal(picanha[0].source_sha256, '7be671740a7349d1b611ee4ffabd1314f4ec1d0bf1f5630bf7de6eac1cc4a882');
});

test('delta do candidato 15c6189 limita-se ao brioche no X Picanha 04', () => {
  const previous = evaluate(execFileSync('git', ['show', '15c6189e055f1d647801a19d9ecd001e1c2fcbc5:public/script.js'], { cwd: root, encoding: 'utf8' }));
  const current = currentRuntime();
  const expected = plain(previous.MENU);
  const item = expected.find(s => s.id === 'linha-picanha').items.find(i => i.id === 'linha-picanha-x-picanha-04');
  item.desc = 'pão brioche + ' + item.desc;
  assert.deepEqual(plain(current.MENU), expected);
  assert.deepEqual(plain(current.ITEM_PHOTOS), plain(previous.ITEM_PHOTOS));
  assert.deepEqual(plain(current.ITEM_PHOTO_SETS), plain(previous.ITEM_PHOTO_SETS));
});
