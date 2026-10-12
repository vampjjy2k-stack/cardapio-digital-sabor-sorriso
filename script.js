/* =========================================================
   Sabor & Sorriso — Cardápio Digital
   JavaScript vanilla (ES6). Sem dependências.
   ========================================================= */
'use strict';

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

// ⚠️ TROQUE PELO NÚMERO DO WHATSAPP DA LOJA.
// Informe apenas dígitos, com DDD e SEM o código do país (55 já é adicionado).
// Exemplo: '11999999999'  →  https://wa.me/5511999999999
const WHATSAPP_NUMBER = 'SEU_NUMERO_AQUI';

const STORAGE_KEY = 'saborsorriso:carrinho:v1';
const NOTES_KEY = 'saborsorriso:observacoes:v1';
const MAX_QTY = 99;

// Imagens (pasta img/ ao lado do index.html)
const IMG = {
  logo: 'img/logo.png',
  cheeseburger: 'img/cheeseburger.png',
  burgerBacon: 'img/burger-bacon.png',
  burgerCamadas: 'img/burger-camadas.png',
  combo: 'img/combo.png',
  hotdog: 'img/hotdog.png',
  acai: 'img/acai.png',
  milkshake: 'img/milkshake.png',
  coca: 'img/coca-cola.png',
  antarctica: 'img/guarana-antarctica.png',
  guaravita: 'img/guaravita.png',
  sobremesas: 'img/sobremesas.png'
};

/* =========================================================
   DADOS DO CARDÁPIO (fonte oficial)
   price: null  →  "Consulte o preço" (preço não informado)
   options: [{label, price}]  →  item com tamanhos
   ========================================================= */

const p = (name, price, desc, extra = {}) => ({ name, price, desc, ...extra });

const MENU = [
  {
    id: 'hamburgueres', title: 'Hambúrgueres', icon: '🍔', img: 'cheeseburger',
    items: [
      p('Churrasco Misto', 75, 'Contrafilé + calabresa + filé de frango + aipim ou batata frita + molhos especiais + geleia de pimenta', { img: 'combo' }),
      p('Combo Petisco', 79, 'Batata frita + linguiça mineira gourmet + anel de cebola + nuggets + azeitona + ovos de codorna', { img: 'combo' }),
      p('Frango Fresh', 23, 'Pão bimbu + filé de peito de frango empanado (120g) + alface + cream cheese + cheddar fatia + picles + cebola roxa crua + molho especial'),
      p('Frango Croc', 24, 'Pão bimbu + filé de peito de frango empanado (120g) + creme de cheddar + bacon fatia + onion rings + cream cheese + molho especial'),
      p('Abacaxi Smash', 27, 'Pão brioche + blend 180g + queijo mussarela + bacon fatia + abacaxi grelhado + rúcula + molho especial'),
      p('Onion Smash', 24, 'Pão artesanal com gergelim + smash 90g + cream cheese + creme de cheddar + onion rings + molho especial + rúcula'),
      p('Banana Bacon', 23, 'Pão brioche + smash 90g + banana grelhada + bacon fatia + creme de cheddar', { img: 'burgerBacon' }),
      p('Doce Bacon', 28, 'Pão brioche + blend 180g + queijo mussarela + farofa de bacon + doce de leite', { img: 'burgerBacon' }),
      p('Big Australiano', 29, 'Pão australiano + blend 180g + creme de cheddar + bacon em tiras + cream cheese + onion rings + rúcula + molho especial'),
      p('Clássico Bacon', 25, 'Pão artesanal com gergelim + blend 180g + cream cheese + bacon fatia + alface + cebola roxa + molho especial', { img: 'burgerBacon' }),
      p('Barbecue Rings', 24, 'Pão brioche + blend 180g + cheddar fatia + onion rings + bacon fatia + molho barbecue'),
      p('Smash Duplo', 32, 'Pão brioche + 2 smash 80g (160g total) + cream cheese + onion rings + bacon + molho especial'),
      p('Big Tudo', 45, 'Pão brioche + 2 blends 180g (360g total) + creme de cheddar + cream cheese + bacon fatia + onion rings + alface + cebola roxa + picles + molho barbecue + molho especial'),
      p('Big Bacon', 30, 'Pão brioche + blend 180g + creme de cheddar + cream cheese + bacon fatia + onion rings + alface + cebola roxa + picles + molho barbecue + molho especial', { img: 'burgerBacon' }),
      p('Cheddar Coalho', 31, 'Pão brioche + blend 180g + queijo coalho caramelizado + queijo cheddar + bacon em tiras'),
      p('Bacon Caramel', 25, 'Pão brioche + blend 180g + creme de cheddar + farofa de bacon caramelizada', { img: 'burgerBacon' }),
      p('Smash Super', 34, 'Pão brioche + 4 smash 60g + creme de cheddar + molho especial + cebola caramelizada')
    ]
  },
  {
    id: 'artesanais', title: 'Artesanais', icon: '🥩', img: 'burgerCamadas',
    items: [
      p('Artesanal 01', 19, 'pão brioche + carne artesanal + queijo cheddar + bacon + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 02', 23, 'pão brioche + carne artesanal + queijo cheddar + bacon + presunto + calabresa + ovo + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 03', 33, 'pão brioche + 2 carnes artesanais + dobro de queijo cheddar + dobro de bacon + dobro de presunto + dobro de calabresa + dobro de ovo + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 04', 28, 'pão brioche + 2 carnes artesanais + 2 queijos cheddar + 2 presuntos + bacon + calabresa + cebola + tomate + alface + todos os molhos + alho torradinho'),
      p('Artesanal 05', 21, 'pão brioche + carne artesanal + creme de cheddar + bacon + anéis de cebola'),
      p('Artesanal 06', 20, 'pão brioche + carne artesanal + creme de cheddar + cebola caramelizada')
    ]
  },
  {
    id: 'linha-cheddar', title: 'Linha Cheddar', icon: '🧀', img: 'cheeseburger',
    items: [
      p('X Cheddar 01', 12, 'pão bimbu + carne + queijo + cheddar + presunto + tomate + alface + maionese temperada + molho Billy Jack + maionese + ketchup'),
      p('X Cheddar 02', 16, 'pão bimbu + 2 carnes + dobro de cheddar + dobro de presunto + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 03', 15, 'pão bimbu + carne + cheddar + presunto + ovo + bacon + calabresa + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 04', 14, 'pão bimbu + carne + queijo + cheddar + presunto + bacon + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 05', 24, 'pão bimbu + carnes, dois queijos + cheddar + o dobro de presunto + 2 ovos + o dobro de bacon + o dobro de calabresa + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar Bacon', 27, '2 carnes artesanais + 2 camadas de creme cheddar + 2 camadas de bacon'),
      p('Onion Cheddar Duplo', 24, '2 carne artesanais + 2 camadas de creme cheddar + 2 camadas de cebola caramelizada')
    ]
  },
  {
    id: 'combos', title: 'Combos', icon: '🎁', img: 'combo',
    items: [
      p('Combo 01', 22, 'X-tudo + batata + guaraná natural'),
      p('Combo 02', 44, '2 x-bacon + batata maluca + 2 anéis de cebola + 2 nuggets + 2 guaraná natural'),
      p('Combo 03', 60, '3 x-burguer + batata + 6 anéis de cebola + 6 nuggets + ovos de codorna + 1 refrigerante pakera ou kuat guaraná de 2 litros'),
      p('Combo 04', 70, '3 x-tudos padrão + batata palha + ovos de codorna + 6 anéis de cebola'),
      p('Combo 05', 75, '4 x-calabresa + batata maluca + 1 refrigerante pakera ou kuat guaraná de 2 litros'),
      p('Combo 06', 110, '6 x-tudo + batata + 6 anéis de cebola + 6 nuggets + 1 refrigerante pakera ou kuat guaraná de 2 litros'),
      p('Combo 07', 125, '5 x-tudos padrão + batata maluca + 5 anéis de cebola + 5 nuggets + ovos de codorna + 1 refrigerante pakera ou kuat guaraná de 2 litros'),
      p('Combo 08', 95, '4 cachorro-quente (2 de linguiça, 2 de salsicha) + batata + 8 nuggets + 8 anéis de cebola + 1 refrigerante pakera ou kuat guaraná de 2 litros', { img: 'hotdog' }),
      p('Mini 01', 29, '1 artesanal pão brioche, carne, queijo cheddar, molho especial, batata frita e coca-cola lata', { img: 'cheeseburger' }),
      p('Dupla Perfeita 02', 57, '2 artesanal pão brioche + carne + queijo cheddar + molho especial + batata + nuggets + 2 coca-cola lata', { img: 'burgerCamadas' }),
      p('Bomba de Sabor 03', 100, '3 artesanal pão brioche + carne + queijo cheddar + bacon + molho especial + salada + batata frita com cheddar + nuggets + anel de cebola + 1 coca-cola 2 litros', { img: 'burgerCamadas' }),
      p('Explosão de Sabor 04', 135, '4 artesanal pão brioche + carne + queijo cheddar + molho especial + cebola caramelizada + batata com cheddar e farofa de bacon + 1 coca-cola 2 litros', { img: 'burgerCamadas' }),
      p('Brutal 05', 149, '5 artesanal pão brioche + carne + queijo cheddar + bacon + molho especial + batata frita com cheddar + farofa de bacon + 5 anéis de cebola + 5 nuggets + 1 coca-cola 2 litros', { img: 'burgerCamadas' }),
      p('Piscinão Cheddar 06', 168, '6 artesanal partido ao meio (total de 12 metades) + carne + queijo cheddar + molho especial + mergulhado na piscina de cheddar + batata frita com cheddar + farofa de bacon + 1 coca-cola 2 litros', { img: 'burgerCamadas' })
    ]
  },
  {
    id: 'hot-dogs', title: 'Hot Dogs', icon: '🌭', img: 'hotdog',
    items: [
      p('Cachorro Quente Linguiça', 15, 'Linguiça, milho, ervilha, cenoura, uva passas, azeitona, ovos de codorna, queijo ralado, maionese temperada, ketchup e batata palha.'),
      p('Cachorro Quente Salsicha', 14, 'Salsicha, milho, ervilha, cenoura, uva passas, azeitona, ovos de codorna, queijo ralado, maionese temperada, ketchup e batata palha.'),
      p('Dogão Quente Linguiça', 21, 'Linguiça, milho, ervilha, cenoura, uva passas, ovos de codorna, azeitonas, maionese temperada, ketchup, billy jack, queijo ralado, batata palha.'),
      p('Dogão Quente Salsicha', 20, 'Salsicha, milho, ervilha, cenoura, uva passas, ovos de codorna, azeitonas, maionese temperada, ketchup, billy jack, queijo ralado, batata palha.'),
      p('Hot Dog 01', 17, 'Pão + linguiça + queijo cheddar + bacon em cubos + cebola roxa + molho especial + ovo de codorna'),
      p('Hot Dog 02', 16, 'Pão + salsicha + bacon em cubos + cream cheese + cebola roxa + molho especial'),
      p('Hot Dog 03', 18, 'Pão + linguiça + bacon + creme cheddar + cebola caramelizada + molho especial + batata palha'),
      p('Hot Dog 04', 14, 'Pão + salsicha + creme de cheddar + ovo de codorna + milho + cebola caramelizada + molho especial + batata palha'),
      p('Hot Dog 05', 17, 'Pão + linguiça + vinagrete + queijo cheddar + cebola + alho torrado + molho especial')
    ]
  },
  {
    id: 'porcoes', title: 'Porções', icon: '🍟', img: 'combo',
    items: [
      p('Baguetão Mineiro', 24, 'Pão baguete + linguiça mineira gourmet + molho especial + geleia de pimenta + queijo mussarela + bacon + creme cheddar + salada'),
      p('Cestinha de Batata', 12, 'Cestinha de batata + creme cheddar + farofa de bacon')
    ]
  },
  {
    id: 'pasteis', title: 'Pastéis', icon: '🥟', img: 'combo', prefix: 'Pastel de ',
    items: [
      p('Carne', 10, ''),
      p('Queijo e Presunto', 10, ''),
      p('Pizza', 10, ''),
      p('Queijo Mussarela', 10, ''),
      p('Carne com Cheddar', 10, ''),
      p('Frango Catupiry', 10, '')
    ]
  },
  {
    id: 'acai', title: 'Açaí', icon: '🍇', img: 'acai', prefix: 'Açaí ',
    items: [
      p('150 ML', 5, ''),
      p('200 ML', 6, ''),
      p('250 ML', 7, ''),
      p('300 ML', 9, ''),
      p('400 ML', 12, ''),
      p('500 ML', 14, ''),
      p('790 ML', 18, '')
    ]
  },
  {
    id: 'vitaminas', title: 'Vitaminas', icon: '🥛', img: 'milkshake', prefix: 'Vitamina de ',
    items: ['Morango ao Leite', 'Cupuaçu ao Leite', 'Maracujá ao Leite', 'Graviola ao Leite'].map(name =>
      p(name, null, '', { options: [{ label: 'Copo 300ML', price: 10 }, { label: 'Copo 500ML', price: 13 }] })
    )
  },
  {
    id: 'sucos', title: 'Sucos Naturais', icon: '🍹', img: 'milkshake', prefix: 'Suco de ',
    items: ['Maracujá', 'Laranja', 'Abacaxi com Hortelã', 'Acerola com Laranja', 'Detox'].map(name =>
      p(name, null, '', { meta: 'Copo 500ML' })
    )
  },
  {
    id: 'bebidas', title: 'Bebidas', icon: '🥤',
    // Sem imagem própria: só marcas que temos foto (as demais usam o ícone 🥤)
    items: [
      p('Kuat', null, '', { meta: '2L' }),
      p('Sukita', null, '', { meta: '2L' }),
      p('Coca Cola', null, '', { meta: '2L', img: 'coca' }),
      p('Coca Cola Zero', null, '', { meta: '2L' }),
      p('Retornável', null, '', { meta: '2L' }),
      p('Sprite', null, '', { meta: '2L' }),
      p('Fanta Uva', null, '', { meta: '2L' }),
      p('Fanta Laranja', null, '', { meta: '2L' }),
      p('Coca Cola', null, '', { meta: '600ML', img: 'coca' }),
      p('Coca Cola Zero', null, '', { meta: '600ML' }),
      p('Fanta Uva', null, '', { meta: '600ML' }),
      p('Fanta Laranja', null, '', { meta: '600ML' }),
      p('Fanta Uva', null, '', { meta: 'Lata' }),
      p('Fanta Laranja', null, '', { meta: 'Lata' }),
      p('Antártica', null, '', { meta: 'Lata', img: 'antarctica' }),
      p('Sprite', null, '', { meta: 'Lata' }),
      p('Coca Cola', null, '', { meta: 'Lata', img: 'coca' }),
      p('Coca Cola Zero', null, '', { meta: 'Lata' }),
      p('Guaravita', null, '', { meta: 'Lata', img: 'guaravita' }),
      p('Guaraviton', null, '', { meta: 'Lata' })
    ]
  },
  {
    id: 'sobremesas', title: 'Sobremesas', icon: '🍨', img: 'sobremesas',
    info: 'Temos sim! Consulte as opções disponíveis no momento.',
    items: []
  }
];

// Combos exibidos em "Combos que Salvam" (ids gerados abaixo)
const FEATURED_IDS = ['combos-combo-06', 'combos-combo-08', 'combos-mini-01'];

/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = value => brl.format(value).replace(/\u00a0/g, ' ');

const esc = value => String(value).replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const slug = text => text
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Índice de itens por id */
const ITEM_INDEX = new Map();
MENU.forEach(section => {
  section.items.forEach(item => {
    item.id = `${section.id}-${slug(item.name + (item.meta ? ' ' + item.meta : ''))}`;
    ITEM_INDEX.set(item.id, { section, item });
  });
});

/* Referências do DOM */
const els = {
  header: $('#site-header'),
  main: $('#conteudo'),
  footer: $('#site-footer'),
  nav: $('#category-nav'),
  navList: $('#category-nav-list'),
  featuredGrid: $('#featured-grid'),
  menu: $('#cardapio'),
  cartToggle: $('#cart-toggle'),
  cartCount: $('#cart-count'),
  drawer: $('#cart-drawer'),
  overlay: $('#overlay'),
  closeBtn: $('#cart-close'),
  browseBtn: $('#cart-browse'),
  list: $('#cart-list'),
  empty: $('#cart-empty'),
  subtotal: $('#cart-subtotal'),
  note: $('#cart-note'),
  notes: $('#order-notes'),
  checkout: $('#checkout-btn'),
  clear: $('#clear-btn'),
  toast: $('#toast')
};

/* =========================================================
   RENDERIZAÇÃO DO CARDÁPIO
   ========================================================= */

function thumbHTML(item, section) {
  const key = item.img || section.img;
  if (key && IMG[key]) {
    return `<img src="${IMG[key]}" alt="" width="96" height="96" loading="lazy" decoding="async" data-fallback="${section.icon}">`;
  }
  return `<span class="thumb-emoji" aria-hidden="true">${section.icon}</span>`;
}

function priceHTML(item) {
  if (item.options) return `<p class="card__price" data-price>${money(item.options[0].price)}</p>`;
  if (item.price == null) return `<p class="card__price card__price--consult" data-price>Consulte o preço</p>`;
  return `<p class="card__price" data-price>${money(item.price)}</p>`;
}

function optionsHTML(item) {
  if (!item.options) return '';
  const radios = item.options.map((opt, i) => `
    <label class="option">
      <input type="radio" name="opt-${item.id}" value="${i}" data-price-value="${opt.price}" ${i === 0 ? 'checked' : ''}>
      <span>${esc(opt.label)}<b>${money(opt.price)}</b></span>
    </label>`).join('');
  return `<fieldset class="options"><legend class="sr-only">Tamanho de ${esc(item.name)}</legend>${radios}</fieldset>`;
}

function addButtonHTML(item) {
  return `<button type="button" class="btn btn--add" data-add="${item.id}" aria-label="Adicionar ${esc(item.name)}${item.meta ? ' ' + esc(item.meta) : ''} ao carrinho">
    <span class="btn__plus" aria-hidden="true">+</span> Adicionar</button>`;
}

function cardHTML(item, section) {
  return `
  <li class="card" data-card>
    <div class="card__top">
      <div class="card__thumb">${thumbHTML(item, section)}</div>
      <div class="card__info">
        <h3 class="card__name">${esc(item.name)}</h3>
        ${item.meta ? `<span class="card__meta">${esc(item.meta)}</span>` : ''}
        ${priceHTML(item)}
      </div>
    </div>
    ${item.desc ? `<p class="card__desc">${esc(item.desc)}</p>` : ''}
    ${optionsHTML(item)}
    ${addButtonHTML(item)}
  </li>`;
}

function infoCardHTML(section) {
  return `
  <li class="card card--info">
    <div class="card__top">
      <div class="card__thumb">${thumbHTML({}, section)}</div>
      <div class="card__info"><h3 class="card__name">Sobremesas</h3></div>
    </div>
    <p class="card__desc">${esc(section.info)}</p>
    <button type="button" class="btn" data-action="ask-desserts"><span aria-hidden="true">💬</span> Consultar no WhatsApp</button>
  </li>`;
}

function sectionHTML(section) {
  const cards = section.info
    ? infoCardHTML(section)
    : section.items.map(item => cardHTML(item, section)).join('');
  return `
  <section class="menu-section" id="${section.id}" aria-labelledby="${section.id}-title" tabindex="-1">
    <h2 class="section-title" id="${section.id}-title"><span aria-hidden="true">${section.icon}</span> ${esc(section.title)}</h2>
    <ul class="card-list">${cards}</ul>
  </section>`;
}

function featuredHTML(item, section) {
  return `
  <li class="feat-card" data-card>
    <span class="badge">🔥 Popular</span>
    <div class="feat-card__media">${thumbHTML(item, section)}</div>
    <div class="feat-card__body">
      <h3 class="card__name">${esc(item.name)}</h3>
      <p class="card__desc card__desc--clamp">${esc(item.desc)}</p>
      ${priceHTML(item)}
      ${addButtonHTML(item)}
    </div>
  </li>`;
}

function renderMenu() {
  els.menu.insertAdjacentHTML('beforeend', MENU.map(sectionHTML).join(''));

  els.navList.innerHTML = MENU.map(section => `
    <li><button type="button" class="chip" data-scroll="${section.id}">
      <span aria-hidden="true">${section.icon}</span> ${esc(section.title)}
    </button></li>`).join('');

  els.featuredGrid.innerHTML = FEATURED_IDS
    .map(id => ITEM_INDEX.get(id))
    .filter(Boolean)
    .map(({ item, section }) => featuredHTML(item, section))
    .join('');
}

/* =========================================================
   CARRINHO
   Cada linha: { id, opt, qty }  (opt = índice da opção ou null)
   Preços sempre vêm do MENU (nunca do localStorage).
   ========================================================= */

function describeLine(line) {
  const ref = ITEM_INDEX.get(line.id);
  if (!ref) return null;
  const { section, item } = ref;
  let price = item.price;
  let label = '';
  if (item.options) {
    const option = item.options[line.opt];
    if (!option) return null;
    price = option.price;
    label = option.label;
  }
  const name = (section.prefix || '') + item.name
    + (item.meta ? ` - ${item.meta}` : '')
    + (label ? ` - ${label}` : '');
  return { name, price: price == null ? null : price };
}

const lineKey = line => `${line.id}|${line.opt == null ? '' : line.opt}`;

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    return data
      .map(l => ({
        id: String(l.id),
        opt: Number.isInteger(l.opt) ? l.opt : null,
        qty: Math.min(MAX_QTY, Math.max(1, parseInt(l.qty, 10) || 1))
      }))
      .filter(l => describeLine(l)); // descarta itens que não existem mais
  } catch (err) {
    return [];
  }
}

function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (err) { /* modo privado */ }
}

let cart = loadCart();

function addToCart(id, opt) {
  const ref = ITEM_INDEX.get(id);
  if (!ref) return;
  if (ref.item.options && opt == null) opt = 0;
  if (!ref.item.options) opt = null;

  const existing = cart.find(l => l.id === id && l.opt === opt);
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + 1);
  else cart.push({ id, opt, qty: 1 });

  saveCart();
  renderCart();
  bumpCounter();
  showToast(`${describeLine({ id, opt }).name} adicionado ao carrinho`);
}

function changeQty(key, delta) {
  const index = cart.findIndex(l => lineKey(l) === key);
  if (index === -1) return;
  const next = cart[index].qty + delta;
  if (next <= 0) cart.splice(index, 1);
  else cart[index].qty = Math.min(MAX_QTY, next);
  saveCart();
  renderCart();
}

function removeLine(key) {
  cart = cart.filter(l => lineKey(l) !== key);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function totals() {
  let total = 0;
  let pending = 0;
  let count = 0;
  cart.forEach(line => {
    const info = describeLine(line);
    count += line.qty;
    if (info.price == null) pending += 1;
    else total += info.price * line.qty;
  });
  return { total, pending, count };
}

function renderCart() {
  const { total, pending, count } = totals();

  // Contador do header
  els.cartCount.textContent = count;
  els.cartCount.hidden = count === 0;
  els.cartToggle.setAttribute('aria-label', `Ver carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`);

  // Lista
  els.list.innerHTML = cart.map(line => {
    const info = describeLine(line);
    const key = esc(lineKey(line));
    const name = esc(info.name);
    const unit = info.price == null ? 'Preço a confirmar' : `${money(info.price)} cada`;
    const lineTotal = info.price == null ? 'A confirmar' : money(info.price * line.qty);
    return `
    <li class="cart-line">
      <div class="cart-line__head">
        <p class="cart-line__name">${name}</p>
        <p class="cart-line__total">${lineTotal}</p>
      </div>
      <p class="cart-line__unit">${unit}</p>
      <div class="cart-line__actions">
        <div class="qty" role="group" aria-label="Quantidade de ${name}">
          <button type="button" class="qty__btn" data-action="dec" data-key="${key}" aria-label="Diminuir quantidade de ${name}">−</button>
          <span class="qty__value" aria-live="polite">${line.qty}</span>
          <button type="button" class="qty__btn" data-action="inc" data-key="${key}" aria-label="Aumentar quantidade de ${name}">+</button>
        </div>
        <button type="button" class="remove-btn" data-action="remove" data-key="${key}" aria-label="Remover ${name} do carrinho">Remover</button>
      </div>
    </li>`;
  }).join('');

  // Estado vazio / rodapé
  const isEmpty = cart.length === 0;
  els.empty.hidden = !isEmpty;
  els.list.hidden = isEmpty;
  els.checkout.disabled = isEmpty;
  els.clear.hidden = isEmpty;
  els.subtotal.textContent = money(total);

  if (pending > 0) {
    els.note.hidden = false;
    els.note.textContent = pending === 1
      ? '1 item está sem preço definido. O valor será confirmado no WhatsApp.'
      : `${pending} itens estão sem preço definido. Os valores serão confirmados no WhatsApp.`;
  } else {
    els.note.hidden = true;
    els.note.textContent = '';
  }
}

function bumpCounter() {
  els.cartCount.classList.remove('is-bump');
  void els.cartCount.offsetWidth; // reinicia a animação
  els.cartCount.classList.add('is-bump');
}

/* =========================================================
   DRAWER (carrinho lateral)
   ========================================================= */

const pageRegions = [els.header, els.main, els.footer];
let lastFocused = null;

function openCart() {
  lastFocused = document.activeElement;
  els.drawer.removeAttribute('inert');
  els.drawer.setAttribute('aria-hidden', 'false');
  els.drawer.classList.add('is-open');
  els.overlay.classList.add('is-open');
  pageRegions.forEach(region => region.setAttribute('inert', ''));
  document.body.classList.add('no-scroll');
  els.cartToggle.setAttribute('aria-expanded', 'true');
  els.closeBtn.focus();
}

function closeCart() {
  els.drawer.classList.remove('is-open');
  els.overlay.classList.remove('is-open');
  els.drawer.setAttribute('aria-hidden', 'true');
  els.drawer.setAttribute('inert', '');
  pageRegions.forEach(region => region.removeAttribute('inert'));
  document.body.classList.remove('no-scroll');
  els.cartToggle.setAttribute('aria-expanded', 'false');
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

const isCartOpen = () => els.drawer.classList.contains('is-open');

/* =========================================================
   WHATSAPP
   ========================================================= */

function openWhatsApp(text) {
  if (!/^\d{10,11}$/.test(WHATSAPP_NUMBER)) {
    showToast('Configure o número do WhatsApp no arquivo script.js');
    console.warn('[Sabor & Sorriso] Defina WHATSAPP_NUMBER no script.js (somente dígitos com DDD, ex.: "11999999999").');
    return;
  }
  const url = `https://wa.me/55${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function buildOrderMessage() {
  const { total, pending } = totals();
  const lines = ['🍔 *Novo pedido — Sabor & Sorriso*', '', '*Itens:*'];

  cart.forEach(line => {
    const info = describeLine(line);
    if (info.price == null) {
      lines.push(`• ${line.qty}x ${info.name} — preço a confirmar`);
    } else {
      lines.push(`• ${line.qty}x ${info.name} — ${money(info.price * line.qty)}`);
    }
  });

  lines.push('', `*Total: ${money(total)}*${pending ? ' (+ itens com preço a confirmar)' : ''}`);

  const notes = els.notes.value.trim();
  if (notes) lines.push('', `📝 *Observações:* ${notes}`);

  return lines.join('\n');
}

function checkout() {
  if (cart.length === 0) return;
  openWhatsApp(buildOrderMessage());
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 2400);
}

/* =========================================================
   NAVEGAÇÃO POR CATEGORIAS (scroll suave + destaque ativo)
   ========================================================= */

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

let chips = [];
let sectionEls = [];
let activeId = null;

function setActiveCategory(id) {
  activeId = id;
  chips.forEach(chip => {
    const on = chip.dataset.scroll === id;
    chip.classList.toggle('is-active', on);
    if (on) {
      chip.setAttribute('aria-current', 'true');
      // centraliza o botão ativo na barra horizontal
      const left = chip.parentElement.offsetLeft - (els.navList.clientWidth - chip.offsetWidth) / 2;
      els.navList.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
    } else {
      chip.removeAttribute('aria-current');
    }
  });
}

function updateActiveCategory() {
  const offset = els.header.offsetHeight + els.nav.offsetHeight + 24;
  let current = null;
  for (const section of sectionEls) {
    if (section.getBoundingClientRect().top - offset <= 0) current = section;
    else break;
  }
  const id = current ? current.id : null;
  if (id !== activeId) setActiveCategory(id);
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateActiveCategory();
    ticking = false;
  });
}

/* =========================================================
   FALLBACK DE IMAGENS (se o arquivo não existir)
   ========================================================= */

function applyImageFallback(img) {
  const holder = document.createElement('span');
  if (img.dataset.fallbackText) {
    holder.className = 'brand-text';
    holder.textContent = img.dataset.fallbackText;
  } else {
    holder.className = 'thumb-emoji';
    holder.setAttribute('aria-hidden', 'true');
    holder.textContent = img.dataset.fallback || '🍔';
  }
  img.replaceWith(holder);
}

document.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && (event.target.dataset.fallback || event.target.dataset.fallbackText)) {
    applyImageFallback(event.target);
  }
}, true);

/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener('click', event => {
  const target = event.target;

  // Adicionar ao carrinho
  const addBtn = target.closest('[data-add]');
  if (addBtn) {
    const card = addBtn.closest('[data-card]');
    const checked = card && card.querySelector('input[type="radio"]:checked');
    addToCart(addBtn.dataset.add, checked ? Number(checked.value) : null);
    return;
  }

  // Rolagem suave (chips e botão do hero)
  const scrollBtn = target.closest('[data-scroll]');
  if (scrollBtn) {
    scrollToSection(scrollBtn.dataset.scroll);
    return;
  }

  // Ações do carrinho
  const actionBtn = target.closest('[data-action]');
  if (!actionBtn) return;
  const { action, key } = actionBtn.dataset;

  if (action === 'ask-desserts') {
    openWhatsApp('Olá! Gostaria de saber quais sobremesas estão disponíveis hoje.');
    return;
  }

  if (action === 'inc' || action === 'dec') {
    changeQty(key, action === 'inc' ? 1 : -1);
    const same = els.list.querySelector(`[data-action="${action}"][data-key="${CSS.escape(key)}"]`);
    (same || els.list.querySelector('.qty__btn') || els.closeBtn).focus();
  } else if (action === 'remove') {
    removeLine(key);
    (els.list.querySelector('.remove-btn') || els.browseBtn).focus();
  }
});

// Atualiza o preço exibido quando troca o tamanho (vitaminas)
document.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return;
  const card = input.closest('[data-card]');
  const priceEl = card && card.querySelector('[data-price]');
  if (priceEl) priceEl.textContent = money(Number(input.dataset.priceValue));
});

els.cartToggle.addEventListener('click', openCart);
els.closeBtn.addEventListener('click', closeCart);
els.overlay.addEventListener('click', closeCart);
els.browseBtn.addEventListener('click', () => {
  closeCart();
  scrollToSection('cardapio');
});
els.checkout.addEventListener('click', checkout);
els.clear.addEventListener('click', () => {
  if (window.confirm('Deseja remover todos os itens do carrinho?')) clearCart();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && isCartOpen()) closeCart();
});

// Observações do pedido (persistem no localStorage)
try { els.notes.value = localStorage.getItem(NOTES_KEY) || ''; } catch (err) { /* ignora */ }
els.notes.addEventListener('input', () => {
  try { localStorage.setItem(NOTES_KEY, els.notes.value); } catch (err) { /* ignora */ }
});

// Mantém o carrinho sincronizado entre abas
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) {
    cart = loadCart();
    renderCart();
  }
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

renderMenu();
renderCart();

chips = $$('.chip', els.navList);
sectionEls = $$('.menu-section', els.menu);

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
updateActiveCategory();

// Logo: caso a imagem já tenha falhado antes do script carregar
$$('img[data-fallback-text]').forEach(img => {
  if (img.complete && img.naturalWidth === 0) applyImageFallback(img);
});
