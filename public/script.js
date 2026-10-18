/* =========================================================
   Sabor & Sorriso — Cardápio Digital
   JavaScript vanilla (ES6). Sem dependências.
   ========================================================= */
'use strict';

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const WHATSAPP_NUMBER = '21995792519';
const STORAGE_KEY = 'saborsorriso:carrinho:v1';
const THEME_KEY = 'saborsorriso:tema';
const NOTES_KEY = 'saborsorriso:observacoes:v1';
const DELIVERY_KEY = 'saborsorriso:entrega-dados';
const MAX_QTY = 99;
const CARD_FEE = 2.00; // Taxa para pagamento em cartão
const DELIVERY_FEES = [
  { neighborhood: 'Capivari', fee: 9 },
  { neighborhood: 'São Lourenço', fee: 4 },
  { neighborhood: 'Favela', fee: 5 },
  { neighborhood: 'Rua 12', fee: 5 },
  { neighborhood: 'Parque Eldorado', fee: 7 },
  { neighborhood: 'Ruas da 1 a porta de aço', fee: 6 },
  { neighborhood: 'Figueira', fee: 5 },
  { neighborhood: 'Loteamento', fee: 5 },
  { neighborhood: 'Santa Cruz', fee: 12 },
  { neighborhood: 'Cangulo', fee: 25 },
  { neighborhood: 'Primavera', fee: 15 },
  { neighborhood: 'Berra boi', fee: 8 }
];

const IMG = {
  logo: 'img/logo.webp',
  cheeseburger: 'img/cheeseburger.webp',
  burgerBacon: 'img/burger-bacon.webp',
  burgerCamadas: 'img/burger-camadas.webp',
  combo: 'img/combo.webp',
  hotdog: 'img/hotdog.webp',
  acai: 'img/acai.webp',
  milkshake: 'img/milkshake.webp',
  antarctica: 'img/guarana-antarctica.webp',
  sobremesas: 'img/sobremesas.webp',
  lata: 'img/icones/lata.webp',
  garrafa600: 'img/icones/garrafa-600.webp',
  garrafa2l: 'img/icones/garrafa-2l.webp',
  pastel: 'img/icones/pastel.webp',
  sucoMaracuja: 'img/icones/suco-maracuja.webp',
  sucoLaranja: 'img/icones/suco-laranja.webp',
  sucoAbacaxi: 'img/icones/suco-abacaxi-hortela.webp',
  sucoAcerola: 'img/icones/suco-acerola-laranja.webp',
  sucoDetox: 'img/icones/suco-detox.webp'
};

const ITEM_PHOTOS = {};

const DRINK_ICON = { '2L': 'garrafa2l', '600ML': 'garrafa600', 'Lata': 'lata' };

/* =========================================================
   DADOS DO CARDÁPIO (ATUALIZADO)
   ========================================================= */

const p = (name, price, desc, extra = {}) => ({ name, price, desc, ...extra });

const MENU = [
  {
    id: 'hamburgueres', title: 'Hambúrgueres', icon: '🍔', img: 'cheeseburger',
    items: [
      p('X Tudo', 16, 'Pão bimbu + carne + queijo + presunto + tomate + alface + maionese + ketchup'),
      p('X Burguer', 11, 'Pão bimbu + carne + queijo + tomate + alface + maionese + ketchup'),
      p('Hambúrguer', 10, 'Pão bimbu + carne + queijo + maionese + ketchup'),
      p('X Bacon', 15, 'Pão bimbu + carne + queijo + bacon + tomate + alface + maionese + ketchup'),
      p('X Calabresa', 14, 'Pão bimbu + carne + queijo + calabresa + tomate + alface + maionese + ketchup'),
      p('X Salada', 14, 'Pão bimbu + carne + queijo + ovo + tomate + alface + maionese + ketchup'),
      p('X Duplo', 26, 'Pão bimbu + 2 carnes + 2 queijos + presunto + tomate + alface + maionese + ketchup')
    ]
  },
  {
    id: 'linha-cheddar', title: 'Linha Cheddar', icon: '🧀', img: 'cheeseburger',
    items: [
      p('X Cheddar 01', 13, 'pão bimbu + carne + queijo + cheddar + presunto + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 02', 17, 'pão bimbu + 2 carnes + dobro de cheddar + dobro de presunto + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 03', 17, 'pão bimbu + carne + cheddar + presunto + ovo + bacon + calabresa + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 04', 16, 'pão bimbu + carne + queijo + cheddar + presunto + bacon + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 05', 27, 'pão bimbu + carnes, dois queijos + cheddar + o dobro de presunto + 2 ovos + o dobro de bacon + o dobro de calabresa + tomate + alface + maionese temperada + molho Billy Jack + ketchup')
    ]
  },
  {
    id: 'artesanais', title: 'Artesanais', icon: '🥩', img: 'burgerCamadas',
    items: [
      p('Artesanal 01', 21, 'pão brioche + carne artesanal + queijo cheddar + bacon + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 02', 25, 'pão brioche + carne artesanal + queijo cheddar + bacon + presunto + calabresa + ovo + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 03', 35, 'pão brioche + 2 carnes artesanais + dobro de queijo cheddar + dobro de bacon + dobro de presunto + dobro de calabresa + dobro de ovo + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 04', 30, 'pão brioche + 2 carnes artesanais + 2 queijos cheddar + 2 presuntos + bacon + calabresa + cebola + tomate + alface + todos os molhos + alho torradinho'),
      p('Artesanal 05', 23, 'pão brioche + carne artesanal + creme de cheddar + bacon + anéis de cebola'),
      p('Artesanal 06', 22, 'pão brioche + carne artesanal + creme de cheddar + cebola caramelizada')
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
      p('Brutal 05', 149, '5 artesanal pão brioche + carne + queijo cheddar + bacon + molho especial + batata frita com cheddar + farofa de bacon + 5 anéis de cebola + 5 nuggets + 1 coca-cola 2 litros', { img: 'burgerCamadas' })
    ]
  },
  {
    id: 'hot-dogs', title: 'Hot Dogs', icon: '🌭', img: 'hotdog',
    items: [
      p('Cachorro Quente Salsicha', 15, 'Salsicha, milho, ervilha, cenoura, uva passas, azeitona, ovos de codorna, queijo ralado, maionese temperada, ketchup e batata palha.'),
      p('Cachorro Quente Linguiça', 16, 'Linguiça, milho, ervilha, cenoura, uva passas, azeitona, ovos de codorna, queijo ralado, maionese temperada, ketchup e batata palha.'),
      p('Dogão Quente Salsicha', 22, 'Salsicha, milho, ervilha, cenoura, uva passas, ovos de codorna, azeitonas, maionese temperada, ketchup, billy jack, queijo ralado, batata palha.'),
      p('Dogão Quente Linguiça', 23, 'Linguiça, milho, ervilha, cenoura, uva passas, ovos de codorna, azeitonas, maionese temperada, ketchup, billy jack, queijo ralado, batata palha.')
    ]
  },
  {
    id: 'porcoes', title: 'Porções', icon: '🍟',
    items: [
      p('Baguetão Mineiro', 24, 'Pão baguete + linguiça mineira gourmet + molho especial + geleia de pimenta + queijo mussarela + bacon + creme cheddar + salada', { icon: '🥖' }),
      p('Batata Maluca P', 16, 'Porção de batata frita com molho especial', { icon: '🍟' }),
      p('Batata Maluca G', 27, 'Porção grande de batata frita com molho especial', { icon: '🍟' }),
      p('Batata Maluca P com Cheddar e Bacon', 18, 'Batata frita com creme cheddar e farofa de bacon', { icon: '🍟' }),
      p('Batata Maluca G com Cheddar e Bacon', 32, 'Porção grande de batata frita com creme cheddar e farofa de bacon', { icon: '🍟' })
    ]
  },
  {
    id: 'pasteis', compact: true, title: 'Pastéis', icon: '🥟', img: 'pastel', prefix: 'Pastel de ',
    items: [
      p('Carne', 10, ''),
      p('Queijo e Presunto', 10, ''),
      p('Pizza', 10, ''),
      p('Queijo Mussarela', 10, ''),
      p('Carne com Cheddar', 10, '')
    ]
  },
  {
    id: 'acai', compact: true, title: 'Açaí', icon: '🍇', img: 'acai', prefix: 'Açaí ',
    items: [
      p('200 ML', 8, ''),
      p('250 ML', 9, ''),
      p('300 ML', 11, ''),
      p('400 ML', 14, ''),
      p('500 ML', 16, ''),
      p('790 ML', 20, '')
    ]
  },
  {
    id: 'vitaminas', compact: true, title: 'Vitaminas', icon: '🥛', img: 'milkshake', prefix: 'Vitamina de ',
    items: [
      p('Morango ao Leite', null, '', { options: [{ label: 'Copo 300ML', price: 10 }, { label: 'Copo 500ML', price: 13 }] }),
      p('Cupuaçu ao Leite', null, '', { options: [{ label: 'Copo 300ML', price: 10 }, { label: 'Copo 500ML', price: 13 }] }),
      p('Maracujá ao Leite', null, '', { options: [{ label: 'Copo 300ML', price: 12 }, { label: 'Copo 500ML', price: 15 }] }),
      p('Graviola ao Leite', null, '', { options: [{ label: 'Copo 300ML', price: 10 }, { label: 'Copo 500ML', price: 13 }] })
    ]
  },
  {
    id: 'sucos', compact: true, title: 'Sucos Naturais', icon: '🍹', prefix: 'Suco de ',
    items: [
      p('Maracujá', 9, '', { meta: 'Copo 500ML', img: 'sucoMaracuja' }),
      p('Acerola', 9, '', { meta: 'Copo 500ML', img: 'sucoAcerola' })
    ]
  },
  {
    id: 'bebidas', compact: true, title: 'Bebidas', icon: '🥤',
    items: [
      // Latas
      p('Coca Cola', 7, '', { meta: 'Lata', img: 'lata' }),
      p('Fanta Uva', 7, '', { meta: 'Lata', img: 'lata' }),
      p('Fanta Laranja', 7, '', { meta: 'Lata', img: 'lata' }),
      p('Guaraná Antártica', 7, '', { meta: 'Lata', img: 'antarctica' }),
      // 2 Litros
      p('Coca Cola', 15, '', { meta: '2L', img: 'garrafa2l' }),
      p('Kuat', 8, '', { meta: '2L', img: 'garrafa2l' }),
      p('Fanta', 13, '', { meta: '2L', img: 'garrafa2l' }),
      // 600ml
      p('Coca Cola', 8, '', { meta: '600ML', img: 'garrafa600' }),
      p('H2O', 7, '', { meta: '600ML', img: 'garrafa600' })
    ]
  },
  {
    id: 'sobremesas', title: 'Sobremesas', icon: '🍨', img: 'sobremesas',
    info: 'Temos sim! Consulte as opções disponíveis no momento.',
    items: []
  }
];

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

const norm = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const debounce = (fn, ms) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
};

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
  storeStatus: $('#store-status'),
  storeBanner: $('#store-banner'),
  main: $('#conteudo'),
  footer: $('#site-footer'),
  nav: $('#category-nav'),
  navList: $('#category-nav-list'),
  featured: $('#destaques'),
  featuredGrid: $('#featured-grid'),
  menu: $('#cardapio'),
  search: $('#search'),
  noResults: $('#no-results'),
  cartToggle: $('#cart-toggle'),
  cartCount: $('#cart-count'),
  cartBar: $('#cart-bar'),
  cartBarBtn: $('#cart-bar-btn'),
  cartBarCount: $('#cart-bar-count'),
  cartBarLabel: $('#cart-bar-label'),
  cartBarTotal: $('#cart-bar-total'),
  drawer: $('#cart-drawer'),
  overlay: $('#overlay'),
  closeBtn: $('#cart-close'),
  browseBtn: $('#cart-browse'),
  list: $('#cart-list'),
  empty: $('#cart-empty'),
  checkoutFields: $('#checkout-fields'),
  addressFields: $('#address-fields'),
  subtotal: $('#cart-subtotal'),
  feeRow: $('#fee-row'),
  fee: $('#cart-fee'),
  deliveryFeeRow: $('#delivery-fee-row'),
  deliveryFee: $('#cart-delivery-fee'),
  totalLabel: $('#cart-total-label'),
  summary: $('#cart-summary'),
  total: $('#cart-total'),
  checkoutHint: $('#checkout-hint'),
  note: $('#cart-note'),
  notes: $('#order-notes'),
  checkout: $('#checkout-btn'),
  clear: $('#clear-btn'),
  toast: $('#toast')
};

/* =========================================================
   RENDERIZAÇÃO DO CARDÁPIO
   ========================================================= */

function thumbHTML(item, section, size = 104) {
  const icon = item.icon || section.icon;
  const key = item.img || (item.icon ? null : section.img);
  const src = (item.id && ITEM_PHOTOS[item.id]) || (key && IMG[key]);
  if (src) {
    return `<img src="${src}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" data-fallback="${icon}">`;
  }
  return `<span class="thumb-emoji" aria-hidden="true">${icon}</span>`;
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

const addLabel = item => `Adicionar ${item.name}${item.meta ? ' ' + item.meta : ''} ao carrinho`;

function plusButtonHTML(item) {
  return `<button type="button" class="add-btn" data-add="${item.id}" aria-label="${esc(addLabel(item))}">+</button>`;
}

function addButtonHTML(item) {
  return `<button type="button" class="btn btn--add" data-add="${item.id}" aria-label="${esc(addLabel(item))}">Adicionar</button>`;
}

function searchText(item, section) {
  return norm([section.prefix || '', item.name, item.meta || '', item.desc || '', section.title].join(' '));
}

function cardHTML(item, section) {
  const search = esc(searchText(item, section));

  if (section.compact) {
    return `
  <li class="card card--compact" data-card data-search="${search}">
    <div class="card__thumb">${thumbHTML(item, section, 56)}</div>
    <div class="card__body">
      <h3 class="card__name">${esc(item.name)}</h3>
      ${item.meta ? `<span class="card__meta">${esc(item.meta)}</span>` : ''}
      ${priceHTML(item)}
    </div>
    ${item.options ? '' : plusButtonHTML(item)}
    ${optionsHTML(item)}
    ${item.options ? `<div class="card__full">${addButtonHTML(item)}</div>` : ''}
  </li>`;
  }

  return `
  <li class="card" data-card data-search="${search}">
    <div class="card__body">
      <h3 class="card__name">${esc(item.name)}</h3>
      ${item.meta ? `<span class="card__meta">${esc(item.meta)}</span>` : ''}
      ${item.desc ? `<p class="card__desc" id="desc-${item.id}">${esc(item.desc)}</p>
      <button type="button" class="more-btn" data-more aria-controls="desc-${item.id}" aria-label="Ver mais ingredientes de ${esc(item.name)}" aria-expanded="false" hidden>Ver mais</button>` : ''}
      ${priceHTML(item)}
    </div>
    <div class="card__media">
      <div class="card__thumb">${thumbHTML(item, section)}</div>
      ${plusButtonHTML(item)}
    </div>
    ${optionsHTML(item)}
  </li>`;
}

function infoCardHTML(section) {
  return `
  <li class="card card--info" data-card data-search="${esc(norm(section.title + ' ' + section.info))}">
    <div class="card__thumb">${thumbHTML({}, section, 56)}</div>
    <div class="card__body">
      <h3 class="card__name">Sobremesas</h3>
      <p class="card__desc">${esc(section.info)}</p>
    </div>
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
    <div class="feat-card__media">${thumbHTML(item, section, 168)}</div>
    <div class="feat-card__body">
      <h3 class="card__name">${esc(item.name)}</h3>
      <p class="card__desc">${esc(item.desc)}</p>
      ${priceHTML(item)}
      ${addButtonHTML(item)}
    </div>
  </li>`;
}

function renderMenu() {
  els.menu.insertAdjacentHTML('afterbegin', MENU.map(sectionHTML).join(''));

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

function measureClamps() {
  const descs = $$('.card__desc:not(.is-open)', els.menu).filter(d => d.nextElementSibling && d.nextElementSibling.matches('[data-more]'));
  const truncated = descs.map(d => d.offsetParent !== null && d.scrollHeight > d.clientHeight + 1);
  descs.forEach((d, i) => { d.nextElementSibling.hidden = !truncated[i]; });
}

function toggleMore(btn) {
  const desc = btn.previousElementSibling;
  const open = desc.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', String(open));
  btn.textContent = open ? 'Ver menos' : 'Ver mais';
  const name = btn.closest('[data-card]').querySelector('.card__name').textContent;
  btn.setAttribute('aria-label', `${btn.textContent} ingredientes de ${name}`);
}

/* =========================================================
   STATUS DA LOJA (ABERTO/FECHADO)
   Vem do servidor (/api/status), então é igual para todos os clientes.
   Quem muda o status é a dona da loja, em /admin.
   ========================================================= */

const STATUS_URL = '/api/status';
const STATUS_POLL_MS = 60 * 1000;   // reconfere a cada 1 minuto (só com a aba visível)

let storeOpen = false;              // Só uma resposta válida pode habilitar envio.
let statusState = 'checking';       // 'checking' | 'ok' | 'unavailable'
let statusRequestVersion = 0;

async function loadStoreStatus() {
  const version = ++statusRequestVersion;
  const wasKnown = statusState === 'ok';
  const wasOpen = storeOpen;
  statusState = 'checking';
  storeOpen = false;
  updateStoreStatusUI();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  let nextOpen = false;
  let ok = false;

  try {
    const res = await fetch(STATUS_URL, { cache: 'no-store', signal: controller.signal });
    if (res.ok) {
      const data = await res.json();
      if (!data.degraded && (data.status === 'open' || data.status === 'closed')) {
        nextOpen = data.status === 'open';
        ok = true;
      }
    }
  } catch { /* Estado desconhecido nunca mantém uma abertura anterior. */ }
  clearTimeout(timer);
  // Uma resposta antiga de "open" não pode sobrescrever falha mais recente.
  if (version !== statusRequestVersion) return;
  statusState = ok ? 'ok' : 'unavailable';
  storeOpen = ok && nextOpen;
  updateStoreStatusUI();
  if (wasKnown && ok && wasOpen !== storeOpen) {
    showToast(storeOpen ? 'A loja acabou de abrir! Pedidos habilitados.' : 'A loja fechou. Pedidos pausados.');
  }
}

function updateStoreStatusUI() {
  const pill = els.storeStatus;
  if (pill) {
    pill.hidden = false;
    pill.classList.toggle('is-open', statusState === 'ok' && storeOpen);
    pill.classList.toggle('is-closed', statusState === 'ok' && !storeOpen);
    pill.querySelector('.store-status__text').textContent = statusState === 'checking'
      ? 'Verificando...' : statusState === 'unavailable' ? 'Status indisponível' : storeOpen ? 'Aberto agora' : 'Fechado';
  }
  if (els.storeBanner) {
    els.storeBanner.hidden = storeOpen;
    els.storeBanner.innerHTML = statusState === 'ok'
      ? '<strong>Estamos fechados no momento.</strong> Você pode montar o pedido, mas só consegue enviá-lo quando a loja abrir.'
      : '<strong>Não foi possível confirmar se a loja está aberta.</strong> O envio está temporariamente bloqueado até confirmar o status.';
  }
  updateCheckoutState();
}

function startStatusPolling() {
  setInterval(() => { if (!document.hidden) loadStoreStatus(); }, STATUS_POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadStoreStatus(); });
  window.addEventListener('online', loadStoreStatus);
}

/* =========================================================
   BUSCA
   ========================================================= */

let searching = false;
let chipItems = [];
let sectionEls = [];
let sectionCards = [];

function applySearch(query) {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  searching = terms.length > 0;
  let totalVisible = 0;

  sectionEls.forEach((section, i) => {
    let visible = 0;
    sectionCards[i].forEach(card => {
      const match = !searching || terms.every(term => card.dataset.search.includes(term));
      if (card.hidden === match) card.hidden = !match;
      if (match) visible += 1;
    });
    section.hidden = visible === 0;
    chipItems[i].hidden = visible === 0;
    totalVisible += visible;
  });

  els.featured.hidden = searching;
  els.noResults.hidden = totalVisible > 0;

  $('#search-results').textContent = searching
    ? `${totalVisible} ${totalVisible === 1 ? 'resultado encontrado' : 'resultados encontrados'}.`
    : '';
  if (searching) setActiveCategory(null);
  else refreshActive();
  requestAnimationFrame(measureClamps);
}

/* =========================================================
   CARRINHO
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
      .filter(l => describeLine(l));
  } catch (err) {
    return [];
  }
}

function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (err) {}
}

let cart = loadCart();

function addToCart(id, opt) {
  const ref = ITEM_INDEX.get(id);
  if (!ref) return false;
  if (ref.item.options && opt == null) opt = 0;
  if (!ref.item.options) opt = null;

  const existing = cart.find(l => l.id === id && l.opt === opt);
  if (existing && existing.qty >= MAX_QTY) {
    showToast(`Limite de ${MAX_QTY} unidades deste item.`);
    return false;
  }
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + 1);
  else cart.push({ id, opt, qty: 1 });

  saveCart();
  renderCart();
  bumpCounter();
  showToast(`${describeLine({ id, opt }).name} adicionado ao carrinho`);
  return true;
}

function changeQty(key, delta) {
  const index = cart.findIndex(l => lineKey(l) === key);
  if (index === -1) return;
  const name = describeLine(cart[index]).name;
  const next = cart[index].qty + delta;
  if (next > MAX_QTY) {
    showToast(`Limite de ${MAX_QTY} unidades deste item.`);
    return;
  }
  if (next <= 0) cart.splice(index, 1);
  else cart[index].qty = Math.min(MAX_QTY, next);
  saveCart();
  renderCart();
  const updated = els.list.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (updated) updated.closest('.cart-line').classList.add('is-updated');
  showToast(next <= 0 ? `${name} removido do carrinho` : `${name}: ${next} ${next === 1 ? 'unidade' : 'unidades'}`);
}

function removeLine(key) {
  const line = cart.find(l => lineKey(l) === key);
  if (!line) return;
  const name = describeLine(line).name;
  cart = cart.filter(l => lineKey(l) !== key);
  saveCart();
  renderCart();
  showToast(`${name} removido do carrinho`);
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
  showToast('Carrinho limpo. Escolha seus favoritos no cardápio.');
  if (isCartOpen()) els.browseBtn.focus();
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

/* =========================================================
   CHECKOUT
   ========================================================= */

function loadDeliveryData() {
  try {
    const data = JSON.parse(localStorage.getItem(DELIVERY_KEY));
    if (data) {
      if (data.deliveryType) {
        const radio = document.querySelector(`input[name="delivery-type"][value="${data.deliveryType}"]`);
        if (radio) radio.checked = true;
        if (data.deliveryType === 'delivery') els.addressFields.hidden = false;
      }
      if (data.paymentMethod) {
        const radio = document.querySelector(`input[name="payment-method"][value="${data.paymentMethod}"]`);
        if (radio) radio.checked = true;
      }
      if (data.address) {
        $('#address-street').value = data.address.street || '';
        $('#address-number').value = data.address.number || '';
        $('#address-neighborhood').value = data.address.neighborhood || '';
        $('#address-reference').value = data.address.reference || '';
      }
    }
  } catch (e) {}
}

function saveDeliveryData() {
  const deliveryType = document.querySelector('input[name="delivery-type"]:checked')?.value || null;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || null;
  const address = {
    street: $('#address-street')?.value.trim() || '',
    number: $('#address-number')?.value.trim() || '',
    neighborhood: $('#address-neighborhood')?.value.trim() || '',
    reference: $('#address-reference')?.value.trim() || ''
  };
  try {
    localStorage.setItem(DELIVERY_KEY, JSON.stringify({ deliveryType, paymentMethod, address }));
  } catch (e) {}
}

function updateCheckoutState() {
  const isEmpty = cart.length === 0;
  const deliveryType = document.querySelector('input[name="delivery-type"]:checked')?.value;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

  if (deliveryType === 'delivery') {
    els.addressFields.hidden = false;
  } else {
    els.addressFields.hidden = true;
  }

  ['#address-street', '#address-number', '#address-neighborhood'].forEach(sel => {
    $(sel).required = deliveryType === 'delivery';
  });
  const deliveryLabels = { delivery: 'Entrega', pickup: 'Retirada no local' };
  const paymentLabels = { cash: 'Dinheiro', card: 'Cartão', pix: 'Pix' };
  const count = totals().count;
  els.summary.hidden = isEmpty;
  els.summary.textContent = [
    `${count} ${count === 1 ? 'item' : 'itens'}`,
    deliveryLabels[deliveryType], paymentLabels[paymentMethod]
  ].filter(Boolean).join(' · ');

  let valid = !isEmpty && storeOpen;
  if (valid) {
    if (!deliveryType || !paymentMethod) valid = false;
    if (deliveryType === 'delivery') {
      const street = $('#address-street')?.value.trim();
      const number = $('#address-number')?.value.trim();
      const neighborhood = $('#address-neighborhood')?.value.trim();
      if (!street || !number || !neighborhood) valid = false;
    }
  }

  els.checkout.disabled = !valid;

  // Dica do que falta (antes o botão ficava apagado sem explicar o motivo)
  let hint = '';
  if (!isEmpty) {
    if (!storeOpen) {
      hint = statusState === 'ok' ? 'A loja está fechada. Você poderá enviar o pedido quando ela abrir.' : 'Status não confirmado. O envio está temporariamente bloqueado.';
    } else {
      const missing = [];
      if (!deliveryType) missing.push('entrega ou retirada');
      if (deliveryType === 'delivery' && ![$('#address-street'), $('#address-number'), $('#address-neighborhood')].every(f => f && f.value.trim())) missing.push('endereço completo');
      if (!paymentMethod) missing.push('forma de pagamento');
      if (missing.length) hint = `Falta informar: ${missing.join(', ')}.`;
    }
  }
  els.checkoutHint.textContent = hint;
  els.checkoutHint.hidden = !hint;

  if (!storeOpen && !isEmpty) {
    els.checkout.textContent = statusState === 'ok' ? 'Loja fechada no momento' : 'Status não confirmado';
  } else {
    els.checkout.innerHTML = '<span aria-hidden="true">💬</span> Finalizar Pedido no WhatsApp';
  }
}

// Taxa de cartão só existe quando há itens no carrinho
function paymentFee() {
  const method = document.querySelector('input[name="payment-method"]:checked')?.value;
  return method === 'card' && cart.length > 0 ? CARD_FEE : 0;
}

// null/ausência de correspondência não significa entrega grátis.
function deliveryCharge() {
  const type = document.querySelector('input[name="delivery-type"]:checked')?.value;
  if (cart.length === 0 || type !== 'delivery') return { fee: 0, pending: false };
  const normalizeNeighborhood = value => norm(value).trim().replace(/\s+/g, ' ');
  const neighborhood = normalizeNeighborhood($('#address-neighborhood').value);
  const match = DELIVERY_FEES.find(entry => normalizeNeighborhood(entry.neighborhood) === neighborhood);
  return match ? { fee: match.fee, pending: false } : { fee: 0, pending: true };
}

function renderCart() {
  const { total, pending, count } = totals();
  const fee = paymentFee();
  const delivery = deliveryCharge();
  const countText = `${count} ${count === 1 ? 'item' : 'itens'}`;
  const totalText = pending && total === 0 ? 'A confirmar' : money(total + fee + delivery.fee);
  const barTotalText = delivery.pending ? `${totalText} + entrega` : totalText;

  els.cartCount.textContent = count;
  els.cartCount.hidden = count === 0;
  els.cartToggle.setAttribute('aria-label', `Ver carrinho, ${countText}`);

  els.cartBar.hidden = count === 0;
  document.body.classList.toggle('has-bar', count > 0);
  els.cartBarCount.textContent = count;
  els.cartBarTotal.textContent = barTotalText;
  els.cartBarBtn.setAttribute('aria-label', `Ver carrinho, ${countText}, ${delivery.pending ? 'parcial sem entrega' : 'total'} ${barTotalText}`);

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

  const isEmpty = cart.length === 0;
  els.empty.hidden = !isEmpty;
  els.list.hidden = isEmpty;
  els.checkoutFields.hidden = isEmpty;
  els.clear.hidden = isEmpty;
  els.subtotal.textContent = money(total);
  els.feeRow.hidden = fee === 0;
  els.fee.textContent = `+ ${money(fee)}`;
  els.deliveryFeeRow.hidden = isEmpty || document.querySelector('input[name="delivery-type"]:checked')?.value !== 'delivery';
  els.deliveryFee.textContent = delivery.pending ? 'A confirmar no WhatsApp' : `+ ${money(delivery.fee)}`;
  els.totalLabel.textContent = delivery.pending ? 'Parcial (sem entrega)' : 'Total';
  els.total.textContent = totalText;

  const notices = [];
  if (pending > 0) {
    notices.push(pending === 1
      ? '1 item está sem preço definido. O valor será confirmado no WhatsApp.'
      : `${pending} itens estão sem preço definido. Os valores serão confirmados no WhatsApp.`);
  }
  if (delivery.pending) notices.push('A taxa de entrega será confirmada no WhatsApp. O valor parcial não inclui a entrega; o total final ainda será confirmado.');
  els.note.hidden = notices.length === 0;
  els.note.textContent = notices.join(' ');

  updateCheckoutState();
  saveDeliveryData();
}

function bumpCounter() {
  els.cartCount.classList.remove('is-bump');
  void els.cartCount.offsetWidth;
  els.cartCount.classList.add('is-bump');
}

// Mantém o botão disponível para toques repetidos, sem alterar seu nome acessível.
const addedTimers = new WeakMap();
function flashAdded(button) {
  clearTimeout(addedTimers.get(button));
  button.classList.add('is-added');
  button.textContent = button.classList.contains('add-btn') ? '✓' : 'Adicionado ✓';
  addedTimers.set(button, setTimeout(() => {
    button.classList.remove('is-added');
    button.textContent = button.classList.contains('add-btn') ? '+' : 'Adicionar';
    addedTimers.delete(button);
  }, 900));
}

/* =========================================================
   DRAWER (CARRINHO LATERAL)
   ========================================================= */

const pageRegions = [els.header, els.main, els.footer, els.cartBar];
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
  requestAnimationFrame(() => {
    if (isCartOpen()) els.closeBtn.focus({ preventScroll: true });
  });
  loadStoreStatus(); // Bloqueia envio enquanto reconfirma o status ao abrir o carrinho.
}

function closeCart() {
  els.drawer.classList.remove('is-open');
  els.overlay.classList.remove('is-open');
  els.drawer.setAttribute('aria-hidden', 'true');
  els.drawer.setAttribute('inert', '');
  pageRegions.forEach(region => region.removeAttribute('inert'));
  document.body.classList.remove('no-scroll');
  els.cartToggle.setAttribute('aria-expanded', 'false');
  if (lastFocused && typeof lastFocused.focus === 'function' && !lastFocused.hidden) lastFocused.focus({ preventScroll: true });
}

const isCartOpen = () => els.drawer.classList.contains('is-open');

/* =========================================================
   WHATSAPP
   ========================================================= */

function openWhatsApp(text) {
  if (!/^\d{10,11}$/.test(WHATSAPP_NUMBER)) {
    showToast('Configure o número do WhatsApp no arquivo script.js');
    console.warn('[Sabor & Sorriso] Defina WHATSAPP_NUMBER no script.js.');
    return;
  }
  const url = `https://wa.me/55${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function buildOrderMessage() {
  const { total, pending } = totals();
  const deliveryType = document.querySelector('input[name="delivery-type"]:checked')?.value;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
  const lines = ['🍔 *Novo pedido — Sabor & Sorriso*', ''];

  if (deliveryType === 'delivery') {
    lines.push('*Tipo:* Entrega');
    const street = $('#address-street')?.value.trim();
    const number = $('#address-number')?.value.trim();
    const neighborhood = $('#address-neighborhood')?.value.trim();
    const reference = $('#address-reference')?.value.trim();
    if (street) lines.push(`📍 *Endereço:* ${street}, ${number} - ${neighborhood}${reference ? ` (Ref: ${reference})` : ''}`);
  } else if (deliveryType === 'pickup') {
    lines.push('*Tipo:* Retirada no local');
  }

  const paymentLabels = { cash: 'Dinheiro', card: 'Cartão (+ R$ 2,00)', pix: 'Pix' };
  if (paymentMethod) lines.push(`💳 *Pagamento:* ${paymentLabels[paymentMethod]}`);

  lines.push('', '*Itens:*');

  cart.forEach(line => {
    const info = describeLine(line);
    if (info.price == null) {
      lines.push(`• ${line.qty}x ${info.name} — preço a confirmar`);
    } else {
      lines.push(`• ${line.qty}x ${info.name} — ${money(info.price * line.qty)}`);
    }
  });

  const fee = paymentFee();
  const delivery = deliveryCharge();
  const finalTotal = total + fee + delivery.fee;
  lines.push('', `*Subtotal:* ${money(total)}`);
  if (fee) lines.push(`*Taxa do cartão:* ${money(fee)}`);
  if (deliveryType === 'delivery') {
    lines.push(`*Taxa de entrega:* ${delivery.pending ? 'a confirmar no WhatsApp' : money(delivery.fee)}`);
  }
  if (delivery.pending) {
    lines.push(`*Parcial (sem entrega): ${money(finalTotal)}*${pending ? ' (+ itens com preço a confirmar)' : ''}`);
    lines.push('*Total final: a confirmar no WhatsApp.*');
  } else {
    lines.push(`*Total: ${money(finalTotal)}*${pending ? ' (+ itens com preço a confirmar)' : ''}`);
  }

  const notes = els.notes.value.trim();
  if (notes) lines.push('', `📝 *Observações:* ${notes}`);

  return lines.join('\n');
}

function checkout() {
  if (cart.length === 0) return;
  if (statusState !== 'ok' || !storeOpen) {
    showToast(statusState === 'ok' ? 'A loja está fechada no momento.' : 'Status não confirmado. Tente novamente mais tarde.');
    return;
  }
  openWhatsApp(buildOrderMessage());
}

/* =========================================================
   TEMA CLARO / ESCURO
   ========================================================= */

const THEME_COLORS = { dark: '#14110d', light: '#F7F1E6' };
const themeToggle = $('#theme-toggle');
const themeMeta = $('meta[name="theme-color"]');

const currentTheme = () =>
  document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

function applyTheme(theme, save) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeMeta) themeMeta.setAttribute('content', THEME_COLORS[theme]);
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
  if (save) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (err) {}
  }
}

themeToggle.addEventListener('click', () => {
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
});

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
   NAVEGAÇÃO POR CATEGORIAS
   ========================================================= */

let chips = [];
let activeId = null;
let atBottom = false;
let spyLock = false;
let spyTimer;
const inBand = new Set();

function setActiveCategory(id) {
  if (id === activeId) return;
  const prev = chips.find(c => c.dataset.scroll === activeId);
  const next = chips.find(c => c.dataset.scroll === id);
  activeId = id;
  if (prev) { prev.classList.remove('is-active'); prev.removeAttribute('aria-current'); }
  if (next) {
    next.classList.add('is-active');
    next.setAttribute('aria-current', 'true');
    const left = next.parentElement.offsetLeft - (els.navList.clientWidth - next.offsetWidth) / 2;
    els.navList.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
}

function refreshActive() {
  if (spyLock || searching) return;
  if (atBottom) {
    const last = [...sectionEls].reverse().find(s => !s.hidden);
    if (last) setActiveCategory(last.id);
    return;
  }
  const first = sectionEls.find(s => inBand.has(s));
  if (first) { setActiveCategory(first.id); return; }
  const firstVisible = sectionEls.find(s => !s.hidden);
  const atTop = firstVisible && firstVisible.getBoundingClientRect().top > els.header.offsetHeight + els.nav.offsetHeight;
  if (atTop) setActiveCategory(null);
}

function setupScrollSpy() {
  const offset = els.header.offsetHeight + els.nav.offsetHeight + 8;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) inBand.add(entry.target);
      else inBand.delete(entry.target);
    });
    refreshActive();
  }, { rootMargin: `-${offset}px 0px -60% 0px` });
  sectionEls.forEach(section => observer.observe(section));

  new IntersectionObserver(([entry]) => {
    atBottom = entry.isIntersecting;
    refreshActive();
  }).observe(els.footer);
}

function releaseSpyLock() {
  clearTimeout(spyTimer);
  spyLock = false;
  refreshActive();
}

function scrollToSection(id, fromChip) {
  const target = document.getElementById(id);
  if (!target) return;
  if (fromChip) {
    setActiveCategory(id);
    spyLock = true;
    clearTimeout(spyTimer);
    spyTimer = setTimeout(releaseSpyLock, 1200);
    window.addEventListener('scrollend', releaseSpyLock, { once: true });
  }
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

/* =========================================================
   FALLBACK DE IMAGENS
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

  const addBtn = target.closest('[data-add]');
  if (addBtn) {
    const card = addBtn.closest('[data-card]');
    const checked = card && card.querySelector('input[type="radio"]:checked');
    if (addToCart(addBtn.dataset.add, checked ? Number(checked.value) : null)) {
      flashAdded(addBtn);
    }
    return;
  }

  const moreBtn = target.closest('[data-more]');
  if (moreBtn) {
    toggleMore(moreBtn);
    return;
  }

  const scrollBtn = target.closest('[data-scroll]');
  if (scrollBtn) {
    scrollToSection(scrollBtn.dataset.scroll, scrollBtn.classList.contains('chip'));
    return;
  }

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

document.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  if (input.type === 'radio' && input.name.startsWith('opt-')) {
    const card = input.closest('[data-card]');
    const priceEl = card && card.querySelector('[data-price]');
    if (priceEl) priceEl.textContent = money(Number(input.dataset.priceValue));
  }

  if (input.name === 'delivery-type' || input.name === 'payment-method') {
    saveDeliveryData();
    renderCart();
  }
});

['#address-street', '#address-number', '#address-neighborhood'].forEach(sel => {
  const el = document.querySelector(sel);
  if (el) el.addEventListener('input', () => {
    if (sel === '#address-neighborhood') renderCart();
    else { saveDeliveryData(); updateCheckoutState(); }
  });
});

els.cartToggle.addEventListener('click', openCart);
els.cartBarBtn.addEventListener('click', openCart);
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
  if (!isCartOpen()) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeCart();
  }
  if (event.key === 'Tab') {
    const focusable = $$('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]', els.drawer)
      .filter(el => el.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !els.drawer.contains(document.activeElement))) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !els.drawer.contains(document.activeElement))) {
      event.preventDefault();
      first?.focus();
    }
  }
});

els.search.addEventListener('input', debounce(() => applySearch(els.search.value), 120));
els.search.addEventListener('focus', () => els.search.closest('form').scrollIntoView({ block: 'start' }));

try { els.notes.value = localStorage.getItem(NOTES_KEY) || ''; } catch (err) {}
els.notes.addEventListener('input', () => {
  try { localStorage.setItem(NOTES_KEY, els.notes.value); } catch (err) {}
});

window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) {
    cart = loadCart();
    renderCart();
  }
});

window.addEventListener('resize', debounce(measureClamps, 200));

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

applyTheme(currentTheme(), false);
renderMenu();
$('#delivery-neighborhoods').innerHTML = DELIVERY_FEES.map(entry =>
  `<option value="${esc(entry.neighborhood)}">${money(entry.fee)}</option>`).join('');
loadDeliveryData();   // antes de renderCart(): renderCart salva os campos e apagaria os dados guardados
renderCart();
loadStoreStatus();
startStatusPolling();

chips = $$('.chip', els.navList);
chipItems = chips.map(chip => chip.parentElement);
sectionEls = $$('.menu-section', els.menu);
sectionCards = sectionEls.map(section => $$('[data-card]', section));

setupScrollSpy();

if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureClamps);
requestAnimationFrame(measureClamps);

$$('img[data-fallback-text]').forEach(img => {
  if (img.complete && img.naturalWidth === 0) applyImageFallback(img);
});
