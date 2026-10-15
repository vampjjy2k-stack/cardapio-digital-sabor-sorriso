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
const WHATSAPP_NUMBER = '21995792519';

const STORAGE_KEY = 'saborsorriso:carrinho:v1';
const THEME_KEY = 'saborsorriso:tema';
const NOTES_KEY = 'saborsorriso:observacoes:v1';
const MAX_QTY = 99;

// Imagens (pasta img/ ao lado do index.html)
const IMG = {
  logo: 'img/logo.webp',
  // Fotos
  cheeseburger: 'img/cheeseburger.webp',
  burgerBacon: 'img/burger-bacon.webp',
  burgerCamadas: 'img/burger-camadas.webp',
  combo: 'img/combo.webp',
  hotdog: 'img/hotdog.webp',
  acai: 'img/acai.webp',
  milkshake: 'img/milkshake.webp',
  antarctica: 'img/guarana-antarctica.webp',
  sobremesas: 'img/sobremesas.webp',
  // Ícones neutros (sem marca) para itens que ainda não têm foto própria
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

/* ---------------------------------------------------------
   FOTO PRÓPRIA POR ITEM (opcional)
   Para trocar a imagem de UM item, coloque o arquivo na pasta img/
   e informe aqui o id do item e o caminho. O id é:  id-da-seção + "-" + nome-do-item
   (minúsculas, sem acento, com hífen). Exemplos:
     'hamburgueres-big-tudo':   'img/itens/big-tudo.png',
     'bebidas-coca-cola-2l':    'img/itens/coca-2l.png',
     'vitaminas-morango-ao-leite': 'img/itens/vitamina-morango.png'
   --------------------------------------------------------- */
const ITEM_PHOTOS = {
};

// Qual ícone usar em cada tamanho de bebida
const DRINK_ICON = { '2L': 'garrafa2l', '600ML': 'garrafa600', 'Lata': 'lata' };

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
    id: 'porcoes', title: 'Porções', icon: '🍟',
    items: [
      p('Baguetão Mineiro', 24, 'Pão baguete + linguiça mineira gourmet + molho especial + geleia de pimenta + queijo mussarela + bacon + creme cheddar + salada', { icon: '🥖' }),
      p('Cestinha de Batata', 12, 'Cestinha de batata + creme cheddar + farofa de bacon', { icon: '🍟' })
    ]
  },
  {
    id: 'pasteis', compact: true, title: 'Pastéis', icon: '🥟', img: 'pastel', prefix: 'Pastel de ',
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
    id: 'acai', compact: true, title: 'Açaí', icon: '🍇', img: 'acai', prefix: 'Açaí ',
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
    id: 'vitaminas', compact: true, title: 'Vitaminas', icon: '🥛', img: 'milkshake', prefix: 'Vitamina de ',
    items: ['Morango ao Leite', 'Cupuaçu ao Leite', 'Maracujá ao Leite', 'Graviola ao Leite'].map(name =>
      p(name, null, '', { options: [{ label: 'Copo 300ML', price: 10 }, { label: 'Copo 500ML', price: 13 }] })
    )
  },
  {
    id: 'sucos', compact: true, title: 'Sucos Naturais', icon: '🍹', prefix: 'Suco de ',
    items: [
      ['Maracujá', 'sucoMaracuja'],
      ['Laranja', 'sucoLaranja'],
      ['Abacaxi com Hortelã', 'sucoAbacaxi'],
      ['Acerola com Laranja', 'sucoAcerola'],
      ['Detox', 'sucoDetox']
    ].map(([name, img]) => p(name, null, '', { meta: 'Copo 500ML', img }))
  },
  {
    id: 'bebidas', compact: true, title: 'Bebidas', icon: '🥤',
    // Ícone neutro por tamanho (2L, 600ML, Lata). Foto só quando é exatamente o produto.
    items: [
      ['Kuat', '2L'], ['Sukita', '2L'], ['Coca Cola', '2L'], ['Coca Cola Zero', '2L'],
      ['Retornável', '2L'], ['Sprite', '2L'], ['Fanta Uva', '2L'], ['Fanta Laranja', '2L'],
      ['Coca Cola', '600ML'], ['Coca Cola Zero', '600ML'], ['Fanta Uva', '600ML'], ['Fanta Laranja', '600ML'],
      ['Fanta Uva', 'Lata'], ['Fanta Laranja', 'Lata'], ['Antártica', 'Lata'], ['Sprite', 'Lata'],
      ['Coca Cola', 'Lata'], ['Coca Cola Zero', 'Lata'], ['Guaravita', 'Lata'], ['Guaraviton', 'Lata']
    ].map(([name, meta]) =>
      p(name, null, '', { meta, img: (name === 'Antártica' && meta === 'Lata') ? 'antarctica' : DRINK_ICON[meta] })
    )
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
const money = value => brl.format(value).replace(/ /g, ' ');

const esc = value => String(value).replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const slug = text => text
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Texto sem acento e minúsculo (para a busca)
const norm = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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

// Botão "+" redondo (cartões do cardápio)
function plusButtonHTML(item) {
  return `<button type="button" class="add-btn" data-add="${item.id}" aria-label="${esc(addLabel(item))}">+</button>`;
}

// Botão largo (cartões de destaque)
function addButtonHTML(item) {
  return `<button type="button" class="btn btn--add" data-add="${item.id}" aria-label="${esc(addLabel(item))}">Adicionar</button>`;
}

function searchText(item, section) {
  return norm([section.prefix || '', item.name, item.meta || '', item.desc || '', section.title].join(' '));
}

function cardHTML(item, section) {
  const search = esc(searchText(item, section));

  // Compacto: pastéis, açaí, sucos, bebidas, vitaminas
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
      ${item.desc ? `<p class="card__desc">${esc(item.desc)}</p>
      <button type="button" class="more-btn" data-more aria-expanded="false" hidden>Ver mais</button>` : ''}
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
  // Uma única inserção no DOM (mais rápido que inserir seção por seção)
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

/* "Ver mais": só aparece quando a descrição é cortada em 2 linhas */
function measureClamps() {
  const descs = $$('.card__desc:not(.is-open)', els.menu).filter(d => d.nextElementSibling && d.nextElementSibling.matches('[data-more]'));
  // Primeiro lê tudo, depois escreve (evita recalcular o layout várias vezes)
  const truncated = descs.map(d => d.offsetParent !== null && d.scrollHeight > d.clientHeight + 1);
  descs.forEach((d, i) => { d.nextElementSibling.hidden = !truncated[i]; });
}

function toggleMore(btn) {
  const desc = btn.previousElementSibling;
  const open = desc.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', String(open));
  btn.textContent = open ? 'Ver menos' : 'Ver mais';
}

/* =========================================================
   BUSCA
   ========================================================= */

let searching = false;
let chipItems = [];     // <li> de cada chip (mesma ordem de MENU)
let sectionEls = [];
let sectionCards = [];  // cartões de cada seção

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

  if (searching) setActiveCategory(null);
  else refreshActive();
  requestAnimationFrame(measureClamps);
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
  const countText = `${count} ${count === 1 ? 'item' : 'itens'}`;
  const totalText = pending && total === 0 ? 'A confirmar' : money(total);

  // Contador do header + barra fixa embaixo
  els.cartCount.textContent = count;
  els.cartCount.hidden = count === 0;
  els.cartToggle.setAttribute('aria-label', `Ver carrinho, ${countText}`);

  els.cartBar.hidden = count === 0;
  document.body.classList.toggle('has-bar', count > 0);
  els.cartBarCount.textContent = count;
  els.cartBarTotal.textContent = totalText;
  els.cartBarBtn.setAttribute('aria-label', `Ver carrinho, ${countText}, total ${totalText}`);

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
  if (lastFocused && typeof lastFocused.focus === 'function' && !lastFocused.hidden) lastFocused.focus({ preventScroll: true });
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
   TEMA CLARO / ESCURO
   (o tema inicial já foi aplicado por um script no <head>)
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
    try { localStorage.setItem(THEME_KEY, theme); } catch (err) { /* modo privado */ }
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
   Antes: um ouvinte de "scroll" lia a posição de todas as seções a cada
   quadro (pesado e travava a rolagem). Agora usamos IntersectionObserver:
   o navegador avisa só quando uma seção entra/sai da faixa de leitura.
   ========================================================= */

let chips = [];
let activeId = null;
let atBottom = false;         // true quando o rodapé está visível
let spyLock = false;          // true enquanto a página rola por clique num chip
let spyTimer;
const inBand = new Set();     // seções que estão na faixa de leitura

function setActiveCategory(id) {
  if (id === activeId) return;
  const prev = chips.find(c => c.dataset.scroll === activeId);
  const next = chips.find(c => c.dataset.scroll === id);
  activeId = id;
  if (prev) { prev.classList.remove('is-active'); prev.removeAttribute('aria-current'); }
  if (next) {
    next.classList.add('is-active');
    next.setAttribute('aria-current', 'true');
    // centraliza o chip ativo na barra horizontal (só mexe na barra, não na página)
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
  // Nenhuma na faixa: acima da primeira seção → nada ativo; no fim da página → a última
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

  // Chegou ao rodapé: destaca a última categoria (a última seção é curta)
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
    // marca o chip na hora e ignora o observador até a rolagem terminar
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

  // "Ver mais" / "Ver menos" na descrição
  const moreBtn = target.closest('[data-more]');
  if (moreBtn) {
    toggleMore(moreBtn);
    return;
  }

  // Rolagem (chips da barra e botões)
  const scrollBtn = target.closest('[data-scroll]');
  if (scrollBtn) {
    scrollToSection(scrollBtn.dataset.scroll, scrollBtn.classList.contains('chip'));
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
  if (event.key === 'Escape' && isCartOpen()) closeCart();
});

// Busca: filtra enquanto digita
els.search.addEventListener('input', debounce(() => applySearch(els.search.value), 120));
// Ao tocar na busca, traz o campo para o topo da tela (os resultados aparecem logo abaixo)
els.search.addEventListener('focus', () => els.search.closest('form').scrollIntoView({ block: 'start' }));

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

// Ao mudar o tamanho da tela, refaz a checagem de "Ver mais"
window.addEventListener('resize', debounce(measureClamps, 200));

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

applyTheme(currentTheme(), false);
renderMenu();
renderCart();

chips = $$('.chip', els.navList);
chipItems = chips.map(chip => chip.parentElement);
sectionEls = $$('.menu-section', els.menu);
sectionCards = sectionEls.map(section => $$('[data-card]', section));

setupScrollSpy();

if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureClamps);
requestAnimationFrame(measureClamps);

// Logo: caso a imagem já tenha falhado antes do script carregar
$$('img[data-fallback-text]').forEach(img => {
  if (img.complete && img.naturalWidth === 0) applyImageFallback(img);
});
