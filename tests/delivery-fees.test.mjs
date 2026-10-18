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
    open(url) { this.openedURL = url; },
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
  const expose = `\nglobalThis.__deliveryTest = { DELIVERY_FEES, deliveryCharge, renderCart, buildOrderMessage, loadDeliveryData, checkout, els, setCart: value => { cart = value; }, setOpen: () => { storeOpen = true; statusState = 'ok'; } };`;
  vm.runInContext(prefix + expose, context, { filename: 'public/script.js' });
  const api = context.__deliveryTest;
  return { ...api, elements, localStorage, window, radios, neighborhood: elements['address-neighborhood'], delivery, pickup, cash, card, pix };
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

test('deliveryCharge aceita somente valores exatos da lista e rejeita vazio ou desconhecido', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  choose(runtime, 'delivery');
  for (const [neighborhood, fee] of fees) {
    runtime.neighborhood.value = neighborhood;
    assertVmEqual(runtime.deliveryCharge(), { fee, pending: false }, neighborhood);
  }
  for (const unknown of ['', 'Capivar', 'Capivari Centro', 'Rua 1', 'Rua 12 x', 'Berra boi velho', ' capivari ', 'SAO LOURENCO']) {
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

test('bairro obrigatório em Entrega; ausente ou adulterado bloqueia envio sem taxa a confirmar', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  runtime.setOpen();
  choose(runtime, 'delivery', 'card');
  runtime.elements['address-street'].value = 'Rua das Flores';
  runtime.elements['address-number'].value = '123';
  for (const value of ['', 'Capivari Centro']) {
    runtime.neighborhood.value = value;
    runtime.renderCart();
    assert.equal(runtime.neighborhood.required, true);
    assert.equal(runtime.neighborhood.disabled, false);
    assert.equal(runtime.els.checkout.disabled, true);
    assert.equal(runtime.els.deliveryFee.textContent, 'Selecione um bairro');
    assert.equal(runtime.els.totalLabel.textContent, 'Parcial (sem entrega)');
    assert.match(runtime.els.cartBarTotal.textContent, /R\$ 24,00 \+ entrega/);
    assert.doesNotMatch(runtime.els.note.textContent, /confirmar|WhatsApp/);
    assert.match(runtime.els.checkoutHint.textContent, /bairro atendido/);
    assert.throws(() => runtime.buildOrderMessage(), /Selecione um bairro atendido/);
    runtime.checkout();
    assert.equal(runtime.window.openedURL, undefined);
  }
  runtime.neighborhood.value = 'Capivari';
  runtime.neighborhood.dispatch('change');
  assert.equal(runtime.els.checkout.disabled, false);
  runtime.checkout();
  assert.match(runtime.window.openedURL, /^https:\/\/wa.me\//);
});

test('mudança no mesmo select recalcula; retirada desabilita bairro e cobra cartão só uma vez', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  choose(runtime, 'delivery', 'card');
  runtime.neighborhood.value = 'Figueira';
  const sameSelect = runtime.neighborhood;
  runtime.neighborhood.dispatch('change');
  assert.equal(runtime.neighborhood, sameSelect);
  assert.match(runtime.els.total.textContent, /R\$ 29,00/);
  runtime.neighborhood.value = 'Cangulo';
  runtime.neighborhood.dispatch('change');
  assert.match(runtime.els.total.textContent, /R\$ 49,00/);
  choose(runtime, 'pickup', 'card');
  runtime.renderCart();
  assert.equal(runtime.neighborhood.required, false);
  assert.equal(runtime.neighborhood.disabled, true);
  assert.equal(runtime.els.deliveryFeeRow.hidden, true);
  assert.match(runtime.els.total.textContent, /R\$ 24,00/);
  const message = runtime.buildOrderMessage();
  assert.doesNotMatch(message, /Taxa de entrega|Endereço|Cangulo/);
  assert.equal((message.match(/Taxa do cartão/g) || []).length, 1);
  assert.match(message, /\*Total: R\$ 24,00\*/);
  runtime.neighborhood.value = '';
  runtime.setOpen();
  runtime.renderCart();
  assert.equal(runtime.els.checkout.disabled, false);
});

test('carrinho vazio permanece zerado mesmo com entrega e cartão', () => {
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

test('todos os 12 bairros e meios de pagamento discriminam subtotal, taxa e total no carrinho e WhatsApp', () => {
  const runtime = makeRuntime();
  runtime.setCart(item(2));
  for (const payment of ['pix', 'cash', 'card']) {
    choose(runtime, 'delivery', payment);
    for (const [neighborhood, fee] of fees) {
      runtime.neighborhood.value = neighborhood;
      runtime.neighborhood.dispatch('change');
      const formattedFee = `R$ ${fee},00`;
      const formattedTotal = `R$ ${44 + fee + (payment === 'card' ? 2 : 0)},00`;
      assert.equal(runtime.els.subtotal.textContent, 'R$ 44,00');
      assert.equal(runtime.els.deliveryFee.textContent, `+ ${formattedFee}`, neighborhood);
      assert.equal(runtime.els.totalLabel.textContent, 'Total');
      assert.equal(runtime.els.total.textContent, formattedTotal, neighborhood);
      assert.equal(runtime.els.cartBarTotal.textContent, formattedTotal, neighborhood);
      const message = runtime.buildOrderMessage();
      assert.ok(message.includes(`*Taxa de entrega:* ${formattedFee}`), neighborhood);
      assert.ok(message.includes(`*Total: ${formattedTotal}*`), neighborhood);
      assert.equal((message.match(/Taxa do cartão/g) || []).length, payment === 'card' ? 1 : 0);
      assert.doesNotMatch(message, /Cartão \(\+ R\$ 2,00\)|taxa.*confirmar/i);
    }
  }
});

test('restaura bairro válido; dados legados fora da lista são descartados e bloqueiam entrega', () => {
  const runtime = makeRuntime();
  runtime.setCart(item());
  runtime.setOpen();
  for (const neighborhood of ['São Lourenço', 'Outro bairro', '']) {
    runtime.localStorage.setItem('saborsorriso:entrega-dados', JSON.stringify({
      deliveryType: 'delivery', paymentMethod: 'pix',
      address: { street: 'Rua das Flores', number: '123', neighborhood }
    }));
    runtime.loadDeliveryData();
    runtime.renderCart();
    const valid = neighborhood === 'São Lourenço';
    assert.equal(runtime.neighborhood.value, valid ? neighborhood : '');
    assert.equal(runtime.els.checkout.disabled, !valid);
    const saved = JSON.parse(runtime.localStorage.getItem('saborsorriso:entrega-dados'));
    assert.equal(saved.address.neighborhood, valid ? neighborhood : '');
  }
});
