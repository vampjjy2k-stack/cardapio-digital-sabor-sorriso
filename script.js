/* =========================================================
   Sabor & Sorriso — Cardápio Digital
   ========================================================= */
'use strict';

const WHATSAPP_NUMBER = '5521995792519';
const INSTAGRAM_URL = 'https://www.instagram.com/sabor.e.sorriso';

const STORAGE_KEY = 'saborsorriso:carrinho:v1';
const THEME_KEY = 'saborsorriso:tema';
const NOTES_KEY = 'saborsorriso:observacoes:v1';
const MAX_QTY = 99;

const IMG = {
  logo: 'img/logo.png',
  cheeseburger: 'img/cheeseburger.png',
  burgerBacon: 'img/burger-bacon.png',
  burgerCamadas: 'img/burger-camadas.png',
  combo: 'img/combo.png',
  hotdog: 'img/hotdog.png',
  acai: 'img/acai.png',
  milkshake: 'img/milkshake.png',
  antarctica: 'img/guarana-antarctica.png',
  sobremesas: 'img/sobremesas.png',
  lata: 'img/icones/lata.png',
  garrafa600: 'img/icones/garrafa-600.png',
  garrafa2l: 'img/icones/garrafa-2l.png',
  pastel: 'img/icones/pastel.png',
  sucoMaracuja: 'img/icones/suco-maracuja.png',
  sucoLaranja: 'img/icones/suco-laranja.png',
  sucoAbacaxi: 'img/icones/suco-abacaxi-hortela.png',
  sucoAcerola: 'img/icones/suco-acerola-laranja.png',
  sucoDetox: 'img/icones/suco-detox.png'
};

const DRINK_ICON = { '2L': 'garrafa2l', '600ML': 'garrafa600', 'Lata': 'lata' };

const p = (name, price, desc, extra = {}) => ({ name, price, desc, ...extra });

/* CATEGORIZAÇÃO CORRIGIDA conforme o cardápio impresso */
const MENU = [
  {
    id: 'churrasco-petiscos', title: 'Churrasco e Petiscos', icon: '🍖', img: 'combo',
    items: [
      p('Churrasco Misto', 75, 'Contrafilé + calabresa + filé de frango + aipim ou batata frita + molhos especiais + geleia de pimenta', { img: 'combo' }),
      p('Combo Petisco', 79, 'Batata frita + linguiça mineira gourmet + anel de cebola + nuggets + azeitona + ovos de codorna', { img: 'combo' })
    ]
  },
  {
    id: 'hamburgueres', title: 'Hambúrgueres', icon: '🍔', img: 'cheeseburger',
    items: [
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
    id: 'linha-cheddar', title: 'Linha Cheddar', icon: '🧀', img: 'cheeseburger',
    items: [
      p('X Cheddar 01', 12, 'Pão bimbu + carne + queijo + cheddar + presunto + tomate + alface + maionese temperada + molho Billy Jack + maionese + ketchup'),
      p('X Cheddar 02', 16, 'Pão bimbu + 2 carnes + dobro de cheddar + dobro de presunto + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 03', 15, 'Pão bimbu + carne + cheddar + presunto + ovo + bacon + calabresa + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 04', 14, 'Pão bimbu + carne + queijo + cheddar + presunto + bacon + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar 05', 24, 'Pão bimbu + carnes, dois queijos + cheddar + o dobro de presunto + 2 ovos + o dobro de bacon + o dobro de calabresa + tomate + alface + maionese temperada + molho Billy Jack + ketchup'),
      p('X Cheddar Bacon', 27, '2 carnes artesanais + 2 camadas de creme cheddar + 2 camadas de bacon'),
      p('Onion Cheddar Duplo', 24, '2 carne artesanais + 2 camadas de creme cheddar + 2 camadas de cebola caramelizada')
    ]
  },
  {
    id: 'artesanais', title: 'Artesanais', icon: '🥩', img: 'burgerCamadas',
    items: [
      p('Artesanal 01', 19, 'Pão brioche + carne artesanal + queijo cheddar + bacon + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 02', 23, 'Pão brioche + carne artesanal + queijo cheddar + bacon + presunto + calabresa + ovo + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 03', 33, 'Pão brioche + 2 carnes artesanais + dobro de queijo cheddar + dobro de bacon + dobro de presunto + dobro de calabresa + dobro de ovo + tomate + alface + todos os molhos + alho torradinho + cebola'),
      p('Artesanal 04', 28, 'Pão brioche + 2 carnes artesanais + 2 queijos cheddar + 2 presuntos + bacon + calabresa + cebola + tomate + alface + todos os molhos + alho torradinho'),
      p('Artesanal 05', 21, 'Pão brioche + carne artesanal + creme de cheddar + bacon + anéis de cebola'),
      p('Artesanal 06', 20, 'Pão brioche + carne artesanal + creme de cheddar + cebola caramelizada')
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
      p('Cachorro Quente Linguiça', 15, 'Milho, ervilha, cenoura, uva passas, azeitona, ovos de codorna, queijo ralado, maionese temperada, ketchup e batata palha.'),
      p('Cachorro Quente Salsicha', 14, 'Milho, ervilha, cenoura, uva passas, azeitona, ovos de codorna, queijo ralado, maionese temperada, ketchup e batata palha.'),
      p('Dogão Quente Linguiça', 21, 'Milho, ervilha, cenoura, uva passas, ovos de codorna, azeitonas, maionese temperada, ketchup, billy jack, queijo ralado, batata palha.'),
      p('Dogão Quente Salsicha', 20, 'Milho, ervilha, cenoura, uva passas, ovos de codorna, azeitonas, maionese temperada, ketchup, billy jack, queijo ralado, batata palha.'),
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
    id: 'pasteis', title: 'Pastéis', icon: '🥟', img: 'pastel', prefix: 'Pastel de ',
    items: ['Carne', 'Queijo e Presunto', 'Pizza', 'Queijo Mussarela', 'Carne com Cheddar', 'Frango Catupiry'].map(n => p(n, 10, ''))
  },
  {
    id: 'acai', title: 'Açaí', icon: '🍇', img: 'acai', prefix: 'Açaí ',
    items: [['150 ML',5],['200 ML',6],['250 ML',7],['300 ML',9],['400 ML',12],['500 ML',14],['790 ML',18]].map(([n,v]) => p(n, v, ''))
  },
  {
    id: 'vitaminas', title: 'Vitaminas', icon: '🥛', img: 'milkshake', prefix: 'Vitamina de ',
    items: ['Morango ao Leite', 'Cupuaçu ao Leite', 'Maracujá ao Leite', 'Graviola ao Leite'].map(n =>
      p(n, null, '', { options: [{ label: '300 ML', price: 10 }, { label: '500 ML', price: 13 }] })
    )
  },
  {
    id: 'sucos', title: 'Sucos Naturais', icon: '🍹', prefix: 'Suco de ',
    items: [
      ['Maracujá', 'sucoMaracuja'], ['Laranja', 'sucoLaranja'], ['Abacaxi com Hortelã', 'sucoAbacaxi'],
      ['Acerola com Laranja', 'sucoAcerola'], ['Detox', 'sucoDetox']
    ].map(([name, img]) => p(name, null, '', { meta: '500 ML', img }))
  },
  {
    id: 'bebidas', title: 'Bebidas', icon: '🥤',
    items: [
      ['Kuat','2L'],['Sukita','2L'],['Coca Cola','2L'],['Coca Cola Zero','2L'],['Retornável','2L'],['Sprite','2L'],['Fanta Uva','2L'],['Fanta Laranja','2L'],
      ['Coca Cola','600ML'],['Coca Cola Zero','600ML'],['Fanta Uva','600ML'],['Fanta Laranja','600ML'],
      ['Fanta Uva','Lata'],['Fanta Laranja','Lata'],['Antártica','Lata'],['Sprite','Lata'],['Coca Cola','Lata'],['Coca Cola Zero','Lata'],['Guaravita','Lata'],['Guaraviton','Lata']
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

const FEATURED_IDS = ['combos-combo-06', 'combos-combo-08', 'combos-mini-01'];

/* ---------- Util ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = v => brl.format(v).replace(/\u00a0/g, ' ');
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const ITEM_INDEX = new Map();
MENU.forEach(s => s.items.forEach(i => {
  i.id = `${s.id}-${slug(i.name + (i.meta ? ' ' + i.meta : ''))}`;
  ITEM_INDEX.set(i.id, { section: s, item: i });
}));

const els = {
  header: $('#site-header'), main: $('#top'), footer: $('#site-footer'),
  nav: $('#category-nav'), navList: $('#category-nav-list'),
  featuredGrid: $('#featured-grid'), menu: $('#cardapio'),
  searchInput: $('#search-input'), searchClear: $('#search-clear'), searchEmpty: $('#search-empty'),
  cartFab: $('#cart-fab'), cartCount: $('#cart-count'),
  drawer: $('#cart-drawer'), overlay: $('#overlay'), closeBtn: $('#cart-close'),
  browseBtn: $('#cart-browse'), list: $('#cart-list'), empty: $('#cart-empty'),
  subtotal: $('#cart-subtotal'), note: $('#cart-note'), notes: $('#order-notes'),
  checkout: $('#checkout-btn'), clear: $('#clear-btn'), toast: $('#toast'),
  sheet: $('#product-sheet'), sheetClose: $('#sheet-close'),
  sheetMedia: $('#sheet-media'), sheetTitle: $('#sheet-title'), sheetMeta: $('#sheet-meta'),
  sheetDesc: $('#sheet-desc'), sheetOptions: $('#sheet-options'),
  sheetPrice: $('#sheet-price'), sheetAdd: $('#sheet-add')
};

function thumbHTML(item, section) {
  const icon = item.icon || section.icon;
  const key = item.img || (item.icon ? null : section.img);
  const src = key && IMG[key];
  if (src) return `<img src="${src}" alt="" loading="lazy" decoding="async" data-fallback="${icon}">`;
  return `<span class="thumb-emoji" aria-hidden="true">${icon}</span>`;
}
function priceHTML(item) {
  if (item.options) return `<p class="card__price" data-price>${money(item.options[0].price)}</p>`;
  if (item.price == null) return `<p class="card__price card__price--consult">Pergunte no WhatsApp</p>`;
  return `<p class="card__price">${money(item.price)}</p>`;
}
function optionsHTML(item, inSheet) {
  if (!item.options) return '';
  const radios = item.options.map((opt, i) => `
    <label class="option">
      <input type="radio" name="opt-${item.id}-${inSheet?'s':'c'}" value="${i}" data-price-value="${opt.price}" ${i===0?'checked':''}>
      <span>${esc(opt.label)}<b>${money(opt.price)}</b></span>
    </label>`).join('');
  return `<fieldset class="options"><legend class="sr-only">Tamanho</legend>${radios}</fieldset>`;
}
function cardHTML(item, section) {
  return `
  <li class="card" data-card data-id="${item.id}">
    <div class="card__media">${thumbHTML(item, section)}</div>
    <div class="card__body">
      <h3 class="card__name">${esc(item.name)}</h3>
      ${item.meta ? `<span class="card__meta">${esc(item.meta)}</span>` : ''}
      ${item.desc ? `<p class="card__desc">${esc(item.desc)}</p>` : ''}
      ${optionsHTML(item, false)}
      <div class="card__footer">
        ${priceHTML(item)}
        <button type="button" class="card__add" data-add="${item.id}" data-direct="true" aria-label="Adicionar ${esc(item.name)}">+</button>
      </div>
    </div>
  </li>`;
}
function infoCardHTML(section) {
  return `
  <li class="card card--info">
    <div class="card__media">${thumbHTML({}, section)}</div>
    <div class="card__body">
      <h3 class="card__name">Sobremesas</h3>
      <p class="card__desc">${esc(section.info)}</p>
      <div class="card__footer">
        <button type="button" class="btn btn--primary" data-action="ask-desserts" style="width:100%;min-height:38px;font-size:.8rem">
          <span aria-hidden="true">💬</span> Consultar
        </button>
      </div>
    </div>
  </li>`;
}
function sectionHTML(section) {
  const cards = section.info ? infoCardHTML(section) : section.items.map(i => cardHTML(i, section)).join('');
  return `
  <section class="menu-section" id="${section.id}" aria-labelledby="${section.id}-title" tabindex="-1">
    <h2 class="section-title" id="${section.id}-title">${esc(section.title)}</h2>
    <ul class="card-list">${cards}</ul>
  </section>`;
}
function featuredHTML(item, section) {
  return `
  <li class="feat-card" data-card data-id="${item.id}">
    <span class="badge">🔥 Popular</span>
    <div class="feat-card__media">${thumbHTML(item, section)}</div>
    <div class="feat-card__body">
      <h3 class="card__name">${esc(item.name)}</h3>
      <p class="card__desc" style="-webkit-line-clamp:2">${esc(item.desc)}</p>
      <div class="card__footer">
        ${priceHTML(item)}
        <button type="button" class="card__add" data-add="${item.id}" data-direct="true" aria-label="Adicionar ${esc(item.name)}">+</button>
      </div>
    </div>
  </li>`;
}
function renderMenu() {
  els.menu.insertAdjacentHTML('beforeend', MENU.map(sectionHTML).join(''));
  els.navList.innerHTML = MENU.map(s => `<li><button type="button" class="category-tab" data-scroll="${s.id}">${esc(s.title)}</button></li>`).join('');
  els.featuredGrid.innerHTML = FEATURED_IDS.map(id => ITEM_INDEX.get(id)).filter(Boolean).map(({ item, section }) => featuredHTML(item, section)).join('');
}

function filterMenu(q) {
  const query = q.trim().toLowerCase();
  els.searchClear.hidden = !query;
  const sections = $$('.menu-section', els.menu);
  let totalVisible = 0;
  sections.forEach(section => {
    const cards = $$('.card', section);
    let visible = 0;
    cards.forEach(card => {
      const text = (card.textContent || '').toLowerCase();
      const match = !query || text.includes(query);
      card.hidden = !match;
      if (match) visible++;
    });
    section.hidden = visible === 0;
    totalVisible += visible;
  });
  els.searchEmpty.hidden = totalVisible > 0;
}

els.searchInput.addEventListener('input', e => filterMenu(e.target.value));
els.searchClear.addEventListener('click', () => { els.searchInput.value = ''; filterMenu(''); els.searchInput.focus(); });

function describeLine(line) {
  const ref = ITEM_INDEX.get(line.id);
  if (!ref) return null;
  const { section, item } = ref;
  let price = item.price, label = '';
  if (item.options) {
    const opt = item.options[line.opt];
    if (!opt) return null;
    price = opt.price; label = opt.label;
  }
  const name = (section.prefix || '') + item.name + (item.meta ? ` - ${item.meta}` : '') + (label ? ` - ${label}` : '');
  return { name, price: price == null ? null : price };
}
const lineKey = l => `${l.id}|${l.opt == null ? '' : l.opt}`;

function loadCart() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(d)) return [];
    return d.map(l => ({
      id: String(l.id),
      opt: Number.isInteger(l.opt) ? l.opt : null,
      qty: Math.min(MAX_QTY, Math.max(1, parseInt(l.qty, 10) || 1))
    })).filter(l => describeLine(l));
  } catch { return []; }
}
function saveCart() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {} }

let cart = loadCart();

function addToCart(id, opt) {
  const ref = ITEM_INDEX.get(id);
  if (!ref) return;
  if (ref.item.options && opt == null) opt = 0;
  if (!ref.item.options) opt = null;
  const ex = cart.find(l => l.id === id && l.opt === opt);
  if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + 1);
  else cart.push({ id, opt, qty: 1 });
  saveCart(); renderCart(); bumpCount();
  showToast(`✓ ${describeLine({ id, opt }).name}`);
}
function changeQty(key, d) {
  const i = cart.findIndex(l => lineKey(l) === key);
  if (i === -1) return;
  const n = cart[i].qty + d;
  if (n <= 0) cart.splice(i, 1);
  else cart[i].qty = Math.min(MAX_QTY, n);
  saveCart(); renderCart();
}
function removeLine(key) { cart = cart.filter(l => lineKey(l) !== key); saveCart(); renderCart(); }
function clearCart() { cart = []; saveCart(); renderCart(); }

function totals() {
  let total = 0, pending = 0, count = 0;
  cart.forEach(l => {
    const info = describeLine(l);
    if (!info) return;
    count += l.qty;
    if (info.price == null) pending++;
    else total += info.price * l.qty;
  });
  return { total, pending, count };
}

function renderCart() {
  const { total, pending, count } = totals();
  els.cartCount.textContent = count;
  els.cartCount.hidden = count === 0;
  els.cartFab.hidden = count === 0;
  els.cartFab.setAttribute('aria-label', `Ver carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`);
  els.list.innerHTML = cart.map(line => {
    const info = describeLine(line);
    if (!info) return '';
    const key = esc(lineKey(line));
    const name = esc(info.name);
    const unit = info.price == null ? 'A confirmar' : `${money(info.price)} cada`;
    const lineTotal = info.price == null ? '—' : money(info.price * line.qty);
    return `
    <li class="cart-line">
      <div class="cart-line__head">
        <p class="cart-line__name">${name}</p>
        <p class="cart-line__total">${lineTotal}</p>
      </div>
      <p class="cart-line__unit">${unit}</p>
      <div class="cart-line__actions">
        <div class="qty" role="group">
          <button type="button" class="qty__btn" data-action="dec" data-key="${key}" aria-label="Diminuir">−</button>
          <span class="qty__value">${line.qty}</span>
          <button type="button" class="qty__btn" data-action="inc" data-key="${key}" aria-label="Aumentar">+</button>
        </div>
        <button type="button" class="remove-btn" data-action="remove" data-key="${key}">Remover</button>
      </div>
    </li>`;
  }).join('');
  const isEmpty = cart.length === 0;
  els.empty.hidden = !isEmpty;
  els.list.hidden = isEmpty;
  els.checkout.disabled = isEmpty;
  els.clear.hidden = isEmpty;
  els.subtotal.textContent = money(total);
  if (pending > 0) {
    els.note.hidden = false;
    els.note.textContent = pending === 1 ? '1 item sem preço definido.' : `${pending} itens sem preço definido.`;
  } else { els.note.hidden = true; els.note.textContent = ''; }
}
function bumpCount() {
  els.cartCount.classList.remove('bump');
  void els.cartCount.offsetWidth;
  els.cartCount.classList.add('bump');
}

const pageRegions = [els.header, els.main, els.footer];
let lastFocused = null;
function openCart() {
  lastFocused = document.activeElement;
  els.drawer.removeAttribute('inert');
  els.drawer.setAttribute('aria-hidden', 'false');
  els.drawer.classList.add('is-open');
  els.overlay.classList.add('is-open');
  pageRegions.forEach(r => r.setAttribute('inert', ''));
  document.body.classList.add('no-scroll');
  els.closeBtn.focus();
}
function closeCart() {
  els.drawer.classList.remove('is-open');
  els.overlay.classList.remove('is-open');
  els.drawer.setAttribute('aria-hidden', 'true');
  els.drawer.setAttribute('inert', '');
  pageRegions.forEach(r => r.removeAttribute('inert'));
  document.body.classList.remove('no-scroll');
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}
const isCartOpen = () => els.drawer.classList.contains('is-open');

function openSheet(id) {
  const ref = ITEM_INDEX.get(id);
  if (!ref) return;
  const { section, item } = ref;
  const icon = item.icon || section.icon;
  const key = item.img || (item.icon ? null : section.img);
  const src = key && IMG[key];
  els.sheetMedia.innerHTML = src ? `<img src="${src}" alt="" data-fallback="${icon}">` : `<span class="thumb-emoji" aria-hidden="true">${icon}</span>`;
  els.sheetTitle.textContent = item.name;
  els.sheetMeta.textContent = item.meta || '';
  els.sheetMeta.hidden = !item.meta;
  els.sheetDesc.textContent = item.desc || '';
  els.sheetDesc.hidden = !item.desc;
  if (item.options) {
    els.sheetOptions.innerHTML = optionsHTML(item, true);
    els.sheetOptions.hidden = false;
    els.sheetPrice.textContent = money(item.options[0].price);
  } else {
    els.sheetOptions.innerHTML = ''; els.sheetOptions.hidden = true;
    els.sheetPrice.textContent = item.price != null ? money(item.price) : 'Consulte';
  }
  els.sheetAdd.dataset.add = item.id;
  els.sheetAdd.dataset.direct = 'false';
  if (els.sheet.showModal) els.sheet.showModal(); else els.sheet.setAttribute('open', '');
}
function closeSheet() {
  if (els.sheet.close) els.sheet.close(); else els.sheet.removeAttribute('open');
}
els.sheet.addEventListener('click', e => { if (e.target === els.sheet) closeSheet(); });
els.sheet.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });
els.sheetClose.addEventListener('click', closeSheet);
els.sheetOptions.addEventListener('change', e => {
  if (e.target.type === 'radio') els.sheetPrice.textContent = money(Number(e.target.dataset.priceValue));
});

function openWhatsApp(text) {
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}
$$('[data-contact="wa"]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  openWhatsApp('Olá! Vim pelo cardápio digital da Sabor & Sorriso.');
}));
function buildOrderMessage() {
  const { total, pending } = totals();
  const lines = ['🍔 *Novo pedido — Sabor & Sorriso*', '', '*Itens:*'];
  cart.forEach(l => {
    const info = describeLine(l);
    if (!info) return;
    if (info.price == null) lines.push(`• ${l.qty}x ${info.name} — a confirmar`);
    else lines.push(`• ${l.qty}x ${info.name} — ${money(info.price * l.qty)}`);
  });
  lines.push('', `*Total: ${money(total)}*${pending ? ' (+ itens a confirmar)' : ''}`);
  const notes = els.notes.value.trim();
  if (notes) lines.push('', `📝 *Observações:* ${notes}`);
  return lines.join('\n');
}
function checkout() { if (cart.length) openWhatsApp(buildOrderMessage()); }

const THEME_COLORS = { dark: '#0E0E10', light: '#FAFAFB' };
const themeToggle = $('#theme-toggle');
const themeMeta = $('meta[name="theme-color"]');
const currentTheme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
function applyTheme(t, save) {
  document.documentElement.setAttribute('data-theme', t);
  if (themeMeta) themeMeta.setAttribute('content', THEME_COLORS[t]);
  themeToggle.setAttribute('aria-checked', t === 'dark' ? 'true' : 'false');
  themeToggle.setAttribute('aria-label', t === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
  if (save) try { localStorage.setItem(THEME_KEY, t); } catch {}
}
themeToggle.addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true));

let toastTimer;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 2200);
}

function scrollToSection(id) {
  const t = document.getElementById(id);
  if (!t) return;
  t.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  t.focus({ preventScroll: true });
}
let tabs = [], sectionEls = [], activeId = null;
function setActiveCategory(id) {
  activeId = id;
  tabs.forEach(tab => {
    const on = tab.dataset.scroll === id;
    tab.classList.toggle('is-active', on);
    if (on) {
      const left = tab.parentElement.offsetLeft - (els.navList.clientWidth - tab.offsetWidth) / 2;
      els.navList.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  });
}
function updateActiveCategory() {
  const offset = els.header.offsetHeight + els.nav.offsetHeight + 24;
  let cur = null;
  for (const s of sectionEls) {
    if (s.hidden) continue;
    if (s.getBoundingClientRect().top - offset <= 0) cur = s;
    else break;
  }
  const id = cur ? cur.id : null;
  if (id !== activeId) setActiveCategory(id);
}
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateActiveCategory(); ticking = false; });
}

function applyImageFallback(img) {
  const span = document.createElement('span');
  if (img.dataset.fallbackText) { span.className = 'brand-text'; span.textContent = img.dataset.fallbackText; }
  else { span.className = 'thumb-emoji'; span.setAttribute('aria-hidden', 'true'); span.textContent = img.dataset.fallback || '🍔'; }
  img.replaceWith(span);
}
document.addEventListener('error', e => {
  if (e.target instanceof HTMLImageElement && (e.target.dataset.fallback || e.target.dataset.fallbackText)) {
    applyImageFallback(e.target);
  }
}, true);

document.addEventListener('click', e => {
  const t = e.target;
  const btn = t.closest('.btn, .card__add, .social-btn');
  if (btn) {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--x', (e.clientX - r.left) + 'px');
    btn.style.setProperty('--y', (e.clientY - r.top) + 'px');
  }
  const addBtn = t.closest('[data-add]');
  if (addBtn) {
    e.stopPropagation();
    const direct = addBtn.dataset.direct === 'true';
    if (direct) {
      const ref = ITEM_INDEX.get(addBtn.dataset.add);
      if (ref && ref.item.options) openSheet(addBtn.dataset.add);
      else addToCart(addBtn.dataset.add, null);
    } else {
      const checked = els.sheetOptions.querySelector('input[type="radio"]:checked');
      addToCart(addBtn.dataset.add, checked ? Number(checked.value) : null);
      closeSheet();
    }
    return;
  }
  const card = t.closest('[data-card]');
  if (card && card.dataset.id && !t.closest('[data-action]')) { openSheet(card.dataset.id); return; }
  const scrollBtn = t.closest('[data-scroll]');
  if (scrollBtn) { scrollToSection(scrollBtn.dataset.scroll); return; }
  const actionBtn = t.closest('[data-action]');
  if (!actionBtn) return;
  const { action, key } = actionBtn.dataset;
  if (action === 'ask-desserts') { openWhatsApp('Olá! Gostaria de saber quais sobremesas estão disponíveis hoje.'); return; }
  if (action === 'inc' || action === 'dec') changeQty(key, action === 'inc' ? 1 : -1);
  else if (action === 'remove') removeLine(key);
});

document.addEventListener('change', e => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return;
  const card = input.closest('[data-card]');
  if (card) {
    const priceEl = card.querySelector('[data-price]');
    if (priceEl) priceEl.textContent = money(Number(input.dataset.priceValue));
  }
});

els.cartFab.addEventListener('click', openCart);
els.closeBtn.addEventListener('click', closeCart);
els.overlay.addEventListener('click', closeCart);
els.browseBtn.addEventListener('click', () => { closeCart(); scrollToSection('cardapio'); });
els.checkout.addEventListener('click', checkout);
els.clear.addEventListener('click', () => { if (confirm('Remover todos os itens?')) clearCart(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && isCartOpen()) closeCart(); });
try { els.notes.value = localStorage.getItem(NOTES_KEY) || ''; } catch {}
els.notes.addEventListener('input', () => { try { localStorage.setItem(NOTES_KEY, els.notes.value); } catch {} });
window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) { cart = loadCart(); renderCart(); } });

function initReveal() {
  if (!('IntersectionObserver' in window)) { $$('.menu-section').forEach(s => s.classList.add('is-visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
  $$('.menu-section').forEach(s => io.observe(s));
}

applyTheme(currentTheme(), false);
renderMenu();
renderCart();
initReveal();
tabs = $$('.category-tab', els.navList);
sectionEls = $$('.menu-section', els.menu);
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
updateActiveCategory();