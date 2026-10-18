import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../public/script.js', import.meta.url), 'utf8');

class MockClassList {
  #items = new Set();
  add(...names) { names.forEach(name => this.#items.add(name)); }
  remove(...names) { names.forEach(name => this.#items.delete(name)); }
  toggle(name, force) {
    const next = force === undefined ? !this.#items.has(name) : Boolean(force);
    next ? this.#items.add(name) : this.#items.delete(name);
    return next;
  }
  contains(name) { return this.#items.has(name); }
}

class MockElement {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.checked = false;
    this.required = false;
    this.type = 'text';
    this.name = '';
    this.dataset = {};
    this.classList = new MockClassList();
    this.listeners = new Map();
  }
  addEventListener(type, callback) {
    const list = this.listeners.get(type) || [];
    list.push(callback);
    this.listeners.set(type, list);
  }
  dispatch(type) {
    for (const callback of this.listeners.get(type) || []) callback({ target: this });
  }
  setAttribute(name, value) { this[name] = String(value); }
  removeAttribute(name) { delete this[name]; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  focus() {}
}

function makeRuntime() {
  const ids = [
    'site-header', 'conteudo', 'site-footer', 'category-nav', 'category-nav-list',
    'destaques', 'featured-grid', 'cardapio', 'search', 'no-results', 'cart-toggle',
    'cart-count', 'cart-bar', 'cart-bar-btn', 'cart-bar-count', 'cart-bar-label',
    'cart-bar-total', 'cart-drawer', 'overlay', 'cart-close', 'cart-browse', 'cart-list',
    'cart-empty', 'checkout-fields', 'address-fields', 'cart-subtotal', 'fee-row',
    'cart-fee', 'delivery-fee-row', 'cart-delivery-fee', 'cart-summary', 'cart-total', 'cart-total-label', 'checkout-hint',
    'cart-note', 'order-notes', 'checkout-btn', 'clear-btn', 'toast', 'address-street',
    'address-number', 'address-neighborhood', 'address-reference', 'theme-toggle'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, new MockElement(id)]));
  elements.search.closest = () => ({ scrollIntoView() {} });
  elements['order-notes'].value = '';
  elements['cart-toggle'].setAttribute = MockElement.prototype.setAttribute;
  elements['cart-bar-btn'].setAttribute = MockElement.prototype.setAttribute;

  const delivery = new MockElement(); delivery.type = 'radio'; delivery.name = 'delivery-type'; delivery.value = 'delivery';
  const pickup = new MockElement(); pickup.type = 'radio'; pickup.name = 'delivery-type'; pickup.value = 'pickup';
  const cash = new MockElement(); cash.type = 'radio'; cash.name = 'payment-method'; cash.value = 'cash';
  const card = new MockElement(); card.type = 'radio'; card.name = 'payment-method'; card.value = 'card';
  const pix = new MockElement(); pix.type = 'radio'; pix.name = 'payment-method'; pix.value = 'pix';
  const radios = [delivery, pickup, cash, card, pix];

  const store = new Map();
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  };
  const document = {
    body: new MockElement('body'),
    documentElement: new MockElement('html'),
    activeElement: null,
    querySelector(selector) {
      if (selector.startsWith('#')) return elements[selector.slice(1)] || null;
      const checked = selector.match(/^input\[name="([^"]+)"\]:checked$/);
      if (checked) return radios.find(r => r.name === checked[1] && r.checked) || null;
      const valued = selector.match(/^input\[name="([^"]+)"\]\[value="([^"]+)"\]$/);
      if (valued) return radios.find(r => r.name === valued[1] && r.value === valued[2]) || null;
      const named = selector.match(/^input\[name="([^"]+)"\]$/);
      if (named) return radios.find(r => r.name === named[1]) || null;
      return null;
    },
    querySelectorAll(selector) {
      const named = selector.match(/^input\[name="([^"]+)"\]$/);
      return named ? radios.filter(r => r.name === named[1]) : [];
    },
    addEventListener() {}
  };
  const window = {
    localStorage,
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); }
  };
  const context = {
    console, document, window, localStorage, setTimeout, clearTimeout,
    requestAnimationFrame: window.requestAnimationFrame,
    IntersectionObserver: class {},
    HTMLInputElement: MockElement,
    HTMLImageElement: MockElement,
    CSS: { escape: value => value },
    Intl, URL, URLSearchParams
  };
  vm.createContext(context);
  // Executa também os listeners reais, mas não inicializa menu, polling ou rede.
  const marker = '/* =========================================================\n   INICIALIZAÇÃO';
  assert.ok(script.includes(marker), 'marcador de inicialização precisa existir');
  const prefix = script.split(marker)[0];
  const expose = `\nglobalThis.__deliveryTest = { DELIVERY_FEES, deliveryCharge, renderCart, buildOrderMessage, loadDeliveryData, els, setCart: value => { cart = value; }, setOpen: () => { storeOpen = true; statusState = 'ok'; } };`;
  vm.runInContext(prefix + expose, context, { filename: 'public/script.js' });
  const api = context.__deliveryTest;
  return { ...api, elements, localStorage, radios, neighborhood: elements['address-neighborhood'], delivery, pickup, cash, card, pix };
}

function item(qty = 1) { return [{ id: 'combos-combo-01', opt: null, qty }]; }
function choose(runtime, type, payment = null) {
  runtime.delivery.checked = type === 'delivery';
  runtime.pickup.checked = type === 'pickup';
  for (const radio of [runtime.cash, runtime.card, runtime.pix]) radio.checked = radio.value === payment;
}

function assertVmEqual(actual, expected, message) {
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, message);
}

const fees = [
  ['Capivari', 9], ['São Lourenço', 4], ['Favela', 5], ['Rua 12', 5],
  ['Parque Eldorado', 7], ['Ruas da 1 a porta de aço', 6], ['Figueira', 5],
  ['Loteamento', 5], ['Santa Cruz', 12], ['Cangulo', 25], ['Primavera', 15], ['Berra boi', 8]
];

test('DELIVERY_FEES contém exatamente os 12 bairros e valores contratados', () => {
  const runtime = makeRuntime();
  assertVmEqual(runtime.DELIVERY_FEES, fees.map(([neighborhood, fee]) => ({ neighborhood, fee })));
});

test('deliveryCharge normaliza acentos, caixa, espaços e nunca faz match parcial', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  choose(runtime, 'delivery');
  for (const [neighborhood, fee] of fees) {
    runtime.neighborhood.value = `  ${neighborhood.toUpperCase().replace('Ã', 'A')}   `;
    if (neighborhood === 'São Lourenço') runtime.neighborhood.value = ' são   lourenço ';
    assertVmEqual(runtime.deliveryCharge(), { fee, pending: false }, neighborhood);
  }
  for (const unknown of ['', 'Capivar', 'Capivari Centro', 'Rua 1', 'Rua 12 x', 'Berra boi velho']) {
    runtime.neighborhood.value = unknown;
    assertVmEqual(runtime.deliveryCharge(), { fee: 0, pending: true }, unknown);
  }
});

test('deliveryCharge não cobra em retirada, sem tipo ou com carrinho vazio', () => {
  const runtime = makeRuntime();
  runtime.neighborhood.value = 'Capivari';
  runtime.setCart(item());
  choose(runtime, 'pickup');
  assertVmEqual(runtime.deliveryCharge(), { fee: 0, pending: false });
  choose(runtime, null);
  assertVmEqual(runtime.deliveryCharge(), { fee: 0, pending: false });
  choose(runtime, 'delivery');
  runtime.setCart([]);
  assertVmEqual(runtime.deliveryCharge(), { fee: 0, pending: false });
});

test('renderCart discrimina taxa, total conhecido e estado pendente no bairro desconhecido', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  choose(runtime, 'delivery', 'cash');
  runtime.neighborhood.value = ' Capivari ';
  runtime.renderCart();
  assert.equal(runtime.els.deliveryFeeRow.hidden, false);
  assert.match(runtime.els.deliveryFee.textContent, /R\$ 9,00/);
  assert.equal(runtime.els.totalLabel.textContent, 'Total');
  assert.match(runtime.els.total.textContent, /R\$ 31,00/);
  assert.match(runtime.els.cartBarTotal.textContent, /R\$ 31,00/);

  runtime.neighborhood.value = 'Capivari Centro';
  runtime.renderCart();
  assert.equal(runtime.els.deliveryFeeRow.hidden, false);
  assert.equal(runtime.els.deliveryFee.textContent, 'A confirmar no WhatsApp');
  assert.equal(runtime.els.totalLabel.textContent, 'Parcial (sem entrega)');
  assert.match(runtime.els.cartBarTotal.textContent, /R\$ 22,00 \+ entrega/);
  assert.match(runtime.els.note.textContent, /taxa.*WhatsApp/i);
});

test('mudança de bairro renderiza no mesmo input, retirada não cobra e cartão soma R$ 2', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  choose(runtime, 'delivery', 'card');
  runtime.neighborhood.value = 'Figueira';
  const sameInput = runtime.neighborhood;
  runtime.neighborhood.dispatch('input');
  assert.equal(runtime.neighborhood, sameInput);
  assert.match(runtime.els.total.textContent, /R\$ 29,00/); // 22 + 5 + 2
  runtime.neighborhood.value = 'Cangulo';
  runtime.neighborhood.dispatch('input');
  assert.match(runtime.els.total.textContent, /R\$ 49,00/); // 22 + 25 + 2
  choose(runtime, 'pickup', 'card');
  runtime.renderCart();
  assert.equal(runtime.els.deliveryFeeRow.hidden, true);
  assert.match(runtime.els.total.textContent, /R\$ 24,00/);
});

test('carrinho vazio permanece zerado mesmo com rádio de entrega e cartão', () => {
  const runtime = makeRuntime();
  choose(runtime, 'delivery', 'card');
  runtime.neighborhood.value = 'Capivari';
  runtime.setCart([]);
  runtime.renderCart();
  assert.match(runtime.els.subtotal.textContent, /R\$ 0,00/);
  assert.match(runtime.els.total.textContent, /R\$ 0,00/);
  assert.equal(runtime.els.deliveryFeeRow.hidden, true);
  assert.equal(runtime.els.feeRow.hidden, true);
});

test('buildOrderMessage inclui subtotal, entrega e cartão; desconhecido não fixa total final', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  choose(runtime, 'delivery', 'card');
  runtime.neighborhood.value = 'Santa Cruz';
  const known = runtime.buildOrderMessage();
  assert.match(known, /\*Pagamento:\* Cartão/);
  assert.doesNotMatch(known, /Cartão \(\+ R\$ 2,00\)/);
  assert.match(known, /Subtotal.*R\$ 22,00/i);
  assert.match(known, /Taxa de entrega.*R\$ 12,00/i);
  assert.match(known, /taxa.*cart[aã]o.*R\$ 2,00/i);
  assert.match(known, /\*Total: R\$ 36,00\*/);

  runtime.neighborhood.value = 'Bairro inexistente';
  const unknown = runtime.buildOrderMessage();
  assert.match(unknown, /Parcial \(sem entrega\): R\$ 24,00/); // inclui cartão
  assert.match(unknown, /Taxa de entrega:\* a confirmar no WhatsApp/);
  assert.match(unknown, /Total final: a confirmar no WhatsApp/);
  assert.doesNotMatch(unknown, /\*Total(?: final)?:.*R\$/);

  choose(runtime, 'pickup', 'card');
  const pickup = runtime.buildOrderMessage();
  assert.doesNotMatch(pickup, /Taxa de entrega/);
  assert.match(pickup, /\*Total: R\$ 24,00\*/);
});

test('os 12 bairros têm taxa e total coerentes no carrinho e no WhatsApp', () => {
  const runtime = makeRuntime();
  runtime.setCart(item(2));
  choose(runtime, 'delivery', 'pix');
  for (const [neighborhood, fee] of fees) {
    runtime.neighborhood.value = neighborhood;
    runtime.neighborhood.dispatch('input');
    const formattedFee = `R$ ${fee},00`;
    const formattedTotal = `R$ ${44 + fee},00`;
    assert.equal(runtime.els.deliveryFee.textContent, `+ ${formattedFee}`, neighborhood);
    assert.equal(runtime.els.total.textContent, formattedTotal, neighborhood);
    const message = runtime.buildOrderMessage();
    assert.ok(message.includes(`*Taxa de entrega:* ${formattedFee}`), neighborhood);
    assert.ok(message.includes(`*Total: ${formattedTotal}*`), neighborhood);
  }
});

test('bairro livre é persistido e restaurado sem bloquear checkout por taxa pendente', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  runtime.setOpen();
  choose(runtime, 'delivery', 'pix');
  runtime.elements['address-street'].value = 'Rua das Flores';
  runtime.elements['address-number'].value = '123';
  runtime.neighborhood.value = 'Outro bairro';
  runtime.neighborhood.dispatch('input');
  assert.equal(runtime.els.checkout.disabled, false);
  const saved = JSON.parse(runtime.localStorage.getItem('saborsorriso:entrega-dados'));
  assert.equal(saved.address.neighborhood, 'Outro bairro');
  assert.equal(saved.deliveryType, 'delivery');

  runtime.neighborhood.value = '';
  choose(runtime, 'pickup', 'cash');
  runtime.loadDeliveryData();
  assert.equal(runtime.neighborhood.value, 'Outro bairro');
  assert.equal(runtime.delivery.checked, true);
  runtime.renderCart();
  assert.equal(runtime.els.totalLabel.textContent, 'Parcial (sem entrega)');
  assert.equal(runtime.els.deliveryFee.textContent, 'A confirmar no WhatsApp');
});
