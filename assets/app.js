/* Italian Pizza demo site: shared data, storage, cart and page behaviour.
   All data below is demo content. Prices, deals, discounts and customers are examples
   and are meant to be replaced with Italian Pizza's real information. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var rs = function (n) { return 'Rs. ' + Math.round(n).toLocaleString('en-US'); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* Storage with an in-memory fallback if the browser blocks it */
  var mem = {};
  function read(k, def) {
    try {
      var v = window.localStorage.getItem(k);
      if (v !== null) return JSON.parse(v);
      return k in mem ? mem[k] : def;
    } catch (e) { return k in mem ? mem[k] : def; }
  }
  function write(k, v) {
    mem[k] = v;
    try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* memory only */ }
  }
  function drop(k) { delete mem[k]; try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  var K = { cart: 'ip_cart', member: 'ip_member', orders: 'ip_orders', products: 'ip_products', deals: 'ip_deals', members: 'ip_members', requests: 'ip_requests', cats: 'ip_cats', last: 'ip_last_order', counter: 'ip_counter', type: 'ip_type', profile: 'ip_profile', admin: 'ip_admin' };

  /* Demo data */
  var DELIVERY_FEE = 100;
  var ADDONS = {
    cheese: { name: 'Extra cheese', price: 150 },
    chicken: { name: 'Extra chicken', price: 200 },
    jalapeno: { name: 'Jalapenos', price: 50 },
    dip: { name: 'Dip sauce', price: 60 },
    slice: { name: 'Cheese slice', price: 60 },
    cheesedip: { name: 'Cheese dip', price: 80 }
  };
  var SEED_CATS = [
    { id: 'pizza', name: 'Pizza', enabled: true, icon: 'pizza', blurb: 'Pizzas with the toppings you can see in the description. Add extras in the item view.' },
    { id: 'burgers', name: 'Burgers', enabled: true, icon: 'sandwich', blurb: 'Burgers for one.' },
    { id: 'fries', name: 'Fries', enabled: true, icon: 'utensils', blurb: 'Sides to share or keep.' },
    { id: 'drinks', name: 'Drinks', enabled: true, icon: 'cup-soda', blurb: 'Cold drinks.' },
    { id: 'deals', name: 'Deals', enabled: true, icon: 'tag', blurb: 'Bundles and offers. Member-only deals need a verified card.' }
  ];
  var SEED_PRODUCTS = [
    { id: 'p-chicken', cat: 'pizza', name: 'Chicken Pizza', desc: 'Freshly prepared chicken pizza with cheese and special sauce.', price: 999, memberPrice: 799, addons: ['cheese', 'chicken', 'jalapeno', 'dip'], enabled: true },
    { id: 'p-tikka', cat: 'pizza', name: 'Chicken Tikka Pizza', desc: 'Tikka chicken pieces, onion and cheese on a tomato base.', price: 1099, addons: ['cheese', 'chicken', 'jalapeno', 'dip'], enabled: true },
    { id: 'p-fajita', cat: 'pizza', name: 'Fajita Pizza', desc: 'Chicken fajita strips with capsicum, onion and cheese.', price: 1099, addons: ['cheese', 'chicken', 'jalapeno', 'dip'], enabled: true },
    { id: 'p-cheese', cat: 'pizza', name: 'Cheese Pizza', desc: 'Tomato sauce and a full layer of cheese.', price: 899, memberPrice: 699, addons: ['cheese', 'jalapeno', 'dip'], enabled: true },
    { id: 'b-chicken', cat: 'burgers', name: 'Chicken Burger', desc: 'Crispy chicken fillet, lettuce and sauce in a soft bun.', price: 450, memberPrice: 350, addons: ['slice', 'dip'], enabled: true },
    { id: 'b-zinger', cat: 'burgers', name: 'Zinger Burger', desc: 'Spicy zinger fillet with lettuce and mayo.', price: 550, memberPrice: 450, addons: ['slice', 'dip'], enabled: true },
    { id: 'f-plain', cat: 'fries', name: 'Plain Fries', desc: 'Salted fries.', price: 250, addons: ['dip', 'cheesedip'], enabled: true },
    { id: 'f-masala', cat: 'fries', name: 'Masala Fries', desc: 'Fries tossed in masala seasoning.', price: 300, addons: ['dip', 'cheesedip'], enabled: true },
    { id: 'f-loaded', cat: 'fries', name: 'Loaded Cheese Fries', desc: 'Fries topped with cheese sauce.', price: 450, addons: ['dip'], enabled: true },
    { id: 'd-coke', cat: 'drinks', name: 'Coke', desc: 'Served cold.', price: 120, addons: [], enabled: true },
    { id: 'd-pepsi', cat: 'drinks', name: 'Pepsi', desc: 'Served cold.', price: 120, addons: [], enabled: true },
    { id: 'd-water', cat: 'drinks', name: 'Mineral Water', desc: 'Bottled water.', price: 80, addons: [], enabled: true }
  ];
  var SEED_DEALS = [
    { id: 'dl-large', title: 'Large Chicken Pizza', desc: 'One large chicken pizza at a set price.', price: 999, kind: 'current', featured: true, discount: '', eligible: ['p-chicken'], start: '2026-10-01', end: '2026-12-31', enabled: true },
    { id: 'dl-family', title: 'Family Deal', desc: 'A group meal with pizza and drinks. Contents are an example until the real deal is set.', price: 1799, kind: 'combo', featured: true, discount: '', eligible: ['p-chicken', 'p-tikka', 'd-coke'], start: '2026-10-01', end: '2026-12-31', enabled: true },
    { id: 'dl-drink', title: 'Pizza + Drink Deal', desc: 'One pizza with a cold drink.', price: 1099, kind: 'combo', featured: true, discount: '', eligible: ['p-chicken', 'p-cheese', 'd-coke', 'd-pepsi'], start: '2026-10-01', end: '2026-12-31', enabled: true },
    { id: 'dl-burger', title: 'Burger + Fries Deal', desc: 'A burger with a portion of fries.', price: 749, kind: 'combo', featured: false, discount: '', eligible: ['b-chicken', 'f-plain'], start: '2026-10-01', end: '2026-12-31', enabled: true },
    { id: 'dl-member', title: 'Member Special', desc: 'An example of a member-only price. Needs a verified member card.', price: 1000, memberPrice: 500, memberOnly: true, kind: 'member', featured: false, discount: 'Member price shown after card check', eligible: ['p-tikka'], start: '2026-10-01', end: '2026-12-31', enabled: true },
    { id: 'dl-limited', title: 'Weekend Cheese Pizza', desc: 'A short offer on cheese pizza.', price: 799, kind: 'limited', featured: false, discount: '', eligible: ['p-cheese'], start: '2026-10-03', end: '2026-10-31', enabled: true }
  ];
  var SEED_MEMBERS = [
    { no: 'IP1001', name: 'Demo Member', phone: '0300 0000001', address: 'Dera Ismail Khan', status: 'active', expiry: '2026-12-31' },
    { no: 'IP1002', name: 'Sample Member', phone: '0300 0000002', address: 'Dera Ismail Khan', status: 'inactive', expiry: '2026-12-31' },
    { no: 'IP1003', name: 'Sample Member Two', phone: '0300 0000003', address: 'Dera Ismail Khan', status: 'active', expiry: '2026-06-30' }
  ];
  var STATUSES = ['New', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  function seedOrders() {
    var now = Date.now(), today = new Date(); today.setHours(0, 0, 0, 0);
    function t(m, i) { return Math.max(today.getTime() + 60000 * (i + 1), now - m * 60000); }
    function o(id, m, i, name, phone, type, status, items, subtotal) {
      return { id: id, ts: t(m, i), name: name, phone: phone, address: type === 'Delivery' ? 'Sample address, Dera Ismail Khan' : '', type: type, notes: '', items: items, subtotal: subtotal, discount: 0, delivery: type === 'Delivery' ? DELIVERY_FEE : 0, total: subtotal + (type === 'Delivery' ? DELIVERY_FEE : 0), status: status, card: '' };
    }
    return [
      o('IP1000', 12, 7, 'Maryam Iqbal', '0300 0000018', 'Delivery', 'New', [{ name: 'Chicken Pizza', qty: 2, unit: 999, addons: [] }], 1998),
      o('IP0999', 25, 6, 'Hassan Ali', '0300 0000017', 'Delivery', 'Accepted', [{ name: 'Chicken Tikka Pizza', qty: 1, unit: 1099, addons: [] }, { name: 'Pepsi', qty: 2, unit: 120, addons: [] }], 1339),
      o('IP0998', 45, 5, 'Zainab Noor', '0300 0000016', 'Delivery', 'Preparing', [{ name: 'Pizza + Drink Deal', qty: 1, unit: 1099, addons: [] }], 1099),
      o('IP0997', 70, 4, 'Bilal Hussain', '0300 0000015', 'Pickup', 'Preparing', [{ name: 'Fajita Pizza', qty: 1, unit: 1099, addons: [] }, { name: 'Chicken Burger', qty: 1, unit: 450, addons: [] }], 1549),
      o('IP0996', 95, 3, 'Ayesha Malik', '0300 0000014', 'Delivery', 'Ready', [{ name: 'Zinger Burger', qty: 2, unit: 550, addons: [] }, { name: 'Masala Fries', qty: 1, unit: 300, addons: [] }], 1400),
      o('IP0995', 180, 2, 'Usman Farooq', '0300 0000013', 'Delivery', 'Completed', [{ name: 'Family Deal', qty: 1, unit: 1799, addons: [] }], 1799),
      o('IP0994', 215, 1, 'Sara Ahmed', '0300 0000012', 'Pickup', 'Completed', [{ name: 'Cheese Pizza', qty: 1, unit: 899, addons: [] }, { name: 'Pepsi', qty: 1, unit: 120, addons: [] }], 1019),
      o('IP0993', 240, 0, 'Ali Raza', '0300 0000011', 'Delivery', 'Completed', [{ name: 'Chicken Pizza', qty: 1, unit: 999, addons: [] }, { name: 'Coke', qty: 2, unit: 120, addons: [] }], 1239),
      o('IP0992', 160, 8, 'Noor Fatima', '0300 0000019', 'Delivery', 'Cancelled', [{ name: 'Cheese Pizza', qty: 1, unit: 899, addons: [] }], 899)
    ];
  }

  /* Store */
  var store = {
    cats: function () { return read(K.cats, null) || clone(SEED_CATS); },
    setCats: function (v) { write(K.cats, v); },
    products: function () { return read(K.products, null) || clone(SEED_PRODUCTS); },
    setProducts: function (v) { write(K.products, v); },
    deals: function () { return read(K.deals, null) || clone(SEED_DEALS); },
    setDeals: function (v) { write(K.deals, v); },
    members: function () { return read(K.members, null) || clone(SEED_MEMBERS); },
    setMembers: function (v) { write(K.members, v); },
    requests: function () { return read(K.requests, []); },
    setRequests: function (v) { write(K.requests, v); },
    orders: function () {
      var v = read(K.orders, null);
      if (!v) { v = seedOrders(); write(K.orders, v); }
      return v;
    },
    setOrders: function (v) { write(K.orders, v); },
    nextOrderNo: function () {
      var n = read(K.counter, 1001);
      write(K.counter, n + 1);
      return 'IP' + n;
    }
  };

  /* Items: products and deals share one shape for the cart */
  function allItems(includeDisabled) {
    var cats = store.cats(), catOn = {};
    cats.forEach(function (c) { catOn[c.id] = c.enabled; });
    var list = store.products().filter(function (p) { return includeDisabled || (p.enabled && catOn[p.cat] !== false); }).map(function (p) {
      return { id: p.id, cat: p.cat, name: p.name, desc: p.desc, price: p.price, memberPrice: p.memberPrice == null || p.memberPrice === '' ? null : Number(p.memberPrice), addons: p.addons || [], memberOnly: false, kind: p.cat, enabled: p.enabled };
    });
    if (includeDisabled || catOn.deals !== false) {
      store.deals().forEach(function (d) {
        if (!includeDisabled && !d.enabled) return;
        list.push({ id: d.id, cat: 'deals', name: d.title, desc: d.desc, price: d.price, memberPrice: d.memberPrice == null || d.memberPrice === '' ? null : Number(d.memberPrice), addons: [], memberOnly: !!d.memberOnly, kind: 'deals', dealKind: d.kind, end: d.end, discount: d.discount, enabled: d.enabled });
      });
    }
    return list;
  }
  function getItem(id) { return allItems(false).filter(function (i) { return i.id === id; })[0] || null; }

  /* Member */
  function validCard(no) {
    var key = String(no || '').trim().toUpperCase();
    var m = store.members().filter(function (x) { return x.no.toUpperCase() === key; })[0];
    if (!m) return { ok: false, reason: 'We could not find that card number. Check the number and try again.' };
    if (m.status !== 'active') return { ok: false, reason: 'This card is not active. Please contact Italian Pizza to renew it.' };
    var end = new Date(m.expiry + 'T23:59:59');
    if (m.expiry && end < new Date()) return { ok: false, reason: 'This card expired on ' + fmtDate(m.expiry) + '. Please contact Italian Pizza to renew it.' };
    return { ok: true, member: m };
  }
  function currentMember() {
    var saved = read(K.member, null);
    if (!saved) return null;
    var r = validCard(saved.no);
    return r.ok ? r.member : null;
  }
  function setMember(no) { write(K.member, { no: no }); }
  function clearMember() { drop(K.member); }

  /* Cart */
  function getCart() { return read(K.cart, []); }
  function setCart(c) { write(K.cart, c); updateCartUI(); }
  function lineKey(id, addons) { return id + '|' + addons.slice().sort().join(','); }
  function addToCart(id, qty, addons) {
    var item = getItem(id);
    if (!item) return { ok: false, reason: 'This item is not available right now.' };
    if (item.memberOnly && !currentMember()) return { ok: false, reason: 'This deal needs a verified member card.', needsCard: true };
    addons = (addons || []).filter(function (a) { return item.addons.indexOf(a) > -1; });
    var cart = getCart(), key = lineKey(id, addons);
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty = Math.min(20, line.qty + qty); else cart.push({ key: key, id: id, qty: Math.min(20, qty), addons: addons });
    setCart(cart);
    return { ok: true, item: item };
  }
  function cartLines() {
    var member = currentMember();
    var out = [];
    getCart().forEach(function (l) {
      var item = getItem(l.id);
      if (!item) return;
      var addonSum = l.addons.reduce(function (s, a) { return s + (ADDONS[a] ? ADDONS[a].price : 0); }, 0);
      var unit = item.price + addonSum;
      var eligible = member && item.memberPrice != null && item.memberPrice < item.price;
      var memberUnit = eligible ? item.memberPrice + addonSum : unit;
      out.push({ key: l.key, item: item, qty: l.qty, addons: l.addons.map(function (a) { return ADDONS[a] ? ADDONS[a].name : a; }), unit: unit, memberUnit: memberUnit, eligible: !!eligible, total: memberUnit * l.qty, regularTotal: unit * l.qty });
    });
    return out;
  }
  function orderType() { return read(K.type, 'Delivery'); }
  function totals() {
    var lines = cartLines();
    var subtotal = lines.reduce(function (s, l) { return s + l.regularTotal; }, 0);
    var discount = lines.reduce(function (s, l) { return s + (l.regularTotal - l.total); }, 0);
    var delivery = lines.length && orderType() === 'Delivery' ? DELIVERY_FEE : 0;
    return { lines: lines, count: lines.reduce(function (s, l) { return s + l.qty; }, 0), subtotal: subtotal, discount: discount, delivery: delivery, total: subtotal - discount + delivery };
  }
  function updateCartUI() {
    var n = getCart().reduce(function (s, l) { return s + l.qty; }, 0);
    $$('[data-cart-count]').forEach(function (el) { el.textContent = n; el.setAttribute('data-zero', n === 0 ? 'true' : 'false'); });
    $$('[data-cart-label]').forEach(function (el) { el.setAttribute('aria-label', 'Cart, ' + n + (n === 1 ? ' item' : ' items')); });
  }

  /* Formatting */
  function fmtDate(iso) {
    var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtTime(ts) { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function itemSummary(items) { return items.map(function (i) { return i.name + ' x ' + i.qty; }).join(', '); }

  /* Icons (Lucide, loaded from the CDN) */
  function icon(name, cls) { return '<i data-lucide="' + name + '" class="ic ' + (cls || '') + '" aria-hidden="true"></i>'; }
  /* Inline icon set drawn in the Lucide style (24px grid, 2px round strokes). No external icon request. */
  var ICON_PATHS = {
    'menu': '<path d="M4 12h16M4 6h16M4 18h16"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'plus': '<path d="M5 12h14M12 5v14"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'house': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    'badge-percent': '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m15 9-6 6M9 9h.01M15 15h.01"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'external-link': '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    'clipboard-list': '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    'layout-dashboard': '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    'bike': '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    'cup-soda': '<path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/>',
    'sandwich': '<path d="M4 10a8 6 0 0 1 16 0Z"/><path d="M3 14h18"/><path d="M4 18h16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>',
    'pizza': '<path d="M12 22 3.5 6.5a17 17 0 0 1 17 0Z"/><circle cx="9.5" cy="9.5" r="1"/><circle cx="14.5" cy="9.5" r="1"/><circle cx="12" cy="14" r="1"/>'
  };
  function refreshIcons(root) {
    $$('i[data-lucide]', root).forEach(function (el) {
      var body = ICON_PATHS[el.getAttribute('data-lucide')];
      if (!body) return;
      var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('xmlns', ns); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.setAttribute('class', 'lucide ' + (el.getAttribute('class') || ''));
      svg.innerHTML = body;
      if (el.parentNode) el.parentNode.replaceChild(svg, el);
    });
  }

  /* Placeholder illustrations. These are flat drawings, not photos. */
  var PH = {
    pizza: '<circle cx="100" cy="75" r="58" fill="var(--ph-crust)" stroke="var(--ph-line)" stroke-width="2"/><circle cx="100" cy="75" r="48" fill="var(--ph-cheese)"/><g stroke="var(--ph-line)" stroke-width="1.5" opacity=".5" stroke-linecap="round"><path d="M100 27v96M52 75h96M66 41l68 68M134 41l-68 68"/></g><g fill="var(--ph-top)"><circle cx="82" cy="57" r="6"/><circle cx="119" cy="60" r="6"/><circle cx="100" cy="90" r="6"/><circle cx="75" cy="88" r="5"/><circle cx="126" cy="90" r="5"/></g><g fill="var(--ph-green)"><circle cx="100" cy="46" r="3"/><circle cx="66" cy="72" r="3"/><circle cx="134" cy="76" r="3"/><circle cx="90" cy="108" r="3"/></g>',
    burger: '<path d="M52 66c0-24 20-38 48-38s48 14 48 38z" fill="var(--ph-crust)" stroke="var(--ph-line)" stroke-width="2"/><g fill="var(--ph-cheese)"><ellipse cx="82" cy="48" rx="4" ry="2" transform="rotate(-20 82 48)"/><ellipse cx="100" cy="42" rx="4" ry="2"/><ellipse cx="118" cy="48" rx="4" ry="2" transform="rotate(20 118 48)"/></g><path d="M50 74q8 9 16 0t16 0 16 0 16 0 16 0 16 0" fill="none" stroke="var(--ph-green)" stroke-width="6" stroke-linecap="round"/><rect x="50" y="84" width="100" height="16" rx="8" fill="var(--ph-line)"/><path d="M52 106h96c0 14-12 20-48 20s-48-6-48-20z" fill="var(--ph-crust)" stroke="var(--ph-line)" stroke-width="2"/>',
    fries: '<g fill="var(--ph-cheese)" stroke="var(--ph-line)" stroke-width="1.5"><rect x="68" y="40" width="9" height="52" rx="2"/><rect x="79" y="30" width="9" height="62" rx="2"/><rect x="90" y="38" width="9" height="54" rx="2"/><rect x="101" y="28" width="9" height="64" rx="2"/><rect x="112" y="36" width="9" height="56" rx="2"/><rect x="123" y="44" width="9" height="48" rx="2"/></g><path d="M62 80h76l-9 48H71z" fill="var(--ph-top)" stroke="var(--ph-line)" stroke-width="2"/><rect x="82" y="94" width="36" height="16" rx="3" fill="var(--ph-cheese)" opacity=".9"/>',
    drink: '<path d="M106 40l8-24h18" fill="none" stroke="var(--ph-line)" stroke-width="4" stroke-linecap="round"/><path d="M70 52h60l-7 78H77z" fill="var(--ph-top)" stroke="var(--ph-line)" stroke-width="2"/><rect x="64" y="42" width="72" height="12" rx="4" fill="var(--ph-cheese)" stroke="var(--ph-line)" stroke-width="2"/><path d="M73 78h54l-2 24H75z" fill="var(--ph-bg)" opacity=".92"/>',
    store: '<rect x="40" y="62" width="120" height="68" fill="var(--surface)" stroke="var(--ph-line)" stroke-width="2"/><path d="M34 62h132l-8-26H42z" fill="var(--ph-top)"/><path d="M61.3 36h19.4l-2.7 26H56zM100 36h19.3l2.7 26h-22zM138.7 36H158l8 26h-22z" fill="var(--surface)"/><rect x="88" y="86" width="24" height="44" fill="var(--ph-crust)" stroke="var(--ph-line)" stroke-width="2"/><rect x="48" y="78" width="30" height="26" fill="var(--ph-bg)" stroke="var(--ph-line)" stroke-width="2"/><rect x="122" y="78" width="30" height="26" fill="var(--ph-bg)" stroke="var(--ph-line)" stroke-width="2"/>',
    deal: '<path d="M58 58h84l7 70H51z" fill="var(--ph-crust)" stroke="var(--ph-line)" stroke-width="2"/><path d="M80 58c0-20 40-20 40 0" fill="none" stroke="var(--ph-line)" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="94" r="18" fill="var(--ph-top)"/><path d="M92 102l16-16" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="93" cy="88" r="3" fill="#fff"/><circle cx="107" cy="100" r="3" fill="#fff"/>'
  };
  function ph(kind, label, opts) {
    opts = opts || {};
    var body = PH[kind] || PH.pizza;
    return '<div class="ph"' + (opts.id ? ' data-open="' + esc(opts.id) + '"' : '') + ' role="img" aria-label="' + esc('Placeholder image for ' + label + '. Photo to be supplied by Italian Pizza.') + '"><svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + body + '</svg><span class="ph-tag">Photo placeholder</span></div>';
  }
  function hydratePlaceholders() {
    $$('.ph[data-kind]').forEach(function (el) {
      var kind = el.getAttribute('data-kind'), label = el.getAttribute('data-label') || 'this item';
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'Placeholder image for ' + label + '. Photo to be supplied by Italian Pizza.');
      el.innerHTML = '<svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + (PH[kind] || PH.pizza) + '</svg><span class="ph-tag">Photo placeholder</span>';
    });
  }

  /* Toast */
  var toastTimer;
  function toast(msg, href, label) {
    var region = $('.toast-region');
    if (!region) { region = document.createElement('div'); region.className = 'toast-region'; region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite'); document.body.appendChild(region); }
    region.innerHTML = '<div class="toast"><span>' + esc(msg) + '</span>' + (href ? '<a href="' + esc(href) + '">' + esc(label || 'View') + '</a>' : '') + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { region.innerHTML = ''; }, 4500);
  }

  /* Dialog helper */
  function wireDialog(dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  }
  function openDialog(dlg) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }

  /* Chrome: header, mobile menu, counts, demo guide */
  function initChrome() {
    var page = (document.querySelector('[data-page]') || {}).getAttribute ? document.querySelector('[data-page]').getAttribute('data-page') : '';
    $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === page) a.setAttribute('aria-current', 'page'); });
    var btn = $('.menu-toggle'), panel = $('#mobile-nav');
    if (btn && panel) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.hidden = open;
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
    }
    updateCartUI();
    window.addEventListener('storage', function () { updateCartUI(); });
    $$('[data-demo-guide]').forEach(function (b) { b.addEventListener('click', openGuide); });
  }

  function openGuide() {
    var dlg = $('#demo-guide');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'demo-guide';
      dlg.className = 'sheet';
      dlg.setAttribute('aria-labelledby', 'guide-title');
      dlg.innerHTML = '<div class="dlg-head"><h2 id="guide-title">About this demo</h2><button type="button" class="dlg-close" data-close aria-label="Close">&times;</button></div>' +
        '<div class="dlg-body">' +
        '<p>This is a demo for Italian Pizza in Dera Ismail Khan. It shows how customers could browse the menu, check deals, verify a member card and place an order on one website.</p>' +
        '<div><h3>Try it</h3><ul class="prose" style="margin:8px 0 0;padding-left:1.2rem"><li>Add items on the Menu page, then open the cart.</li><li>Verify member card <strong>IP1001</strong> to see member prices on eligible items. <strong>IP1002</strong> is inactive and <strong>IP1003</strong> is expired.</li><li>Place an order, then see it in the <a href="admin.html">admin demo</a> (sign in with demo and demo) and change its status.</li></ul></div>' +
        '<div><h3>Still to be replaced</h3><ul class="prose" style="margin:8px 0 0;padding-left:1.2rem"><li>All photos are placeholders until real photos are supplied.</li><li>Menu items, prices, add-ons, deals and member discounts are examples.</li><li>Phone, WhatsApp, address, opening hours and delivery area are not confirmed.</li><li>Privacy Policy and Terms are drafts and have not been legally reviewed.</li><li>No payments, messages or orders leave your browser.</li></ul></div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap"><button type="button" class="btn btn-quiet" id="reset-demo">Reset demo data</button><button type="button" class="btn btn-primary" data-close>Close</button></div></div>';
      document.body.appendChild(dlg);
      wireDialog(dlg);
      $('#reset-demo', dlg).addEventListener('click', function () {
        Object.keys(K).forEach(function (k) { drop(K[k]); });
        mem = {};
        window.location.reload();
      });
    }
    openDialog(dlg);
  }

  /* Price blocks */
  function priceHTML(item, member) {
    var eligible = item.memberPrice != null && item.memberPrice < item.price;
    if (eligible && member) {
      return '<span class="price-was">' + rs(item.price) + '</span><span class="price price-member">' + rs(item.memberPrice) + '</span>';
    }
    return '<span class="price">' + rs(item.price) + '</span>';
  }
  function memberBadge(item, member) {
    var eligible = item.memberPrice != null && item.memberPrice < item.price;
    if (!eligible) return '';
    return member ? '<span class="badge">' + icon('circle-check') + 'Member price</span>' : '<span class="badge off">Member price available</span>';
  }

  /* Member box (cart and checkout) */
  function memberBoxHTML() {
    var m = currentMember();
    if (m) {
      return '<div class="member-box"><div class="notice ok">' + icon('circle-check') + '<div><strong>Member card ' + esc(m.no) + ' applied.</strong><br>Member prices apply to eligible items. <button type="button" class="link-btn" data-member-remove>Remove card</button></div></div></div>';
    }
    return '<div class="member-box"><form data-member-form novalidate><div class="field" style="flex:1 1 160px"><label for="mb-card">Member card number</label><input id="mb-card" name="card" type="text" autocomplete="off" autocapitalize="characters" placeholder="Example: IP1001" aria-describedby="mb-err"></div><button class="btn btn-quiet" type="submit" style="align-self:end">Verify Card</button></form><p class="field-error" id="mb-err" role="alert"></p><p class="muted" style="font-size:.88rem">Do not have a card? <a href="member.html">Get a Member Card</a></p></div>';
  }
  function bindMemberBox(root, after) {
    var form = $('[data-member-form]', root);
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = form.card.value;
      var err = $('#mb-err', root);
      if (!v.trim()) { err.textContent = 'Enter your member card number.'; form.card.focus(); return; }
      var r = validCard(v);
      if (!r.ok) { err.textContent = r.reason; form.card.focus(); return; }
      setMember(r.member.no);
      toast('Member card verified. Member prices applied.');
      after();
    });
    var rm = $('[data-member-remove]', root);
    if (rm) rm.addEventListener('click', function () { clearMember(); after(); });
  }

  function totalsHTML(t, opts) {
    opts = opts || {};
    var rows = '<div><dt>Subtotal</dt><dd>' + rs(t.subtotal) + '</dd></div>';
    if (t.discount > 0) rows += '<div class="discount"><dt>Member discount</dt><dd>- ' + rs(t.discount) + '</dd></div>';
    rows += '<div><dt>Delivery' + (opts.pickupNote ? '' : '') + '</dt><dd>' + (orderType() === 'Pickup' ? 'Free (pickup)' : rs(t.delivery)) + '</dd></div>';
    rows += '<div class="grand"><dt>Total</dt><dd>' + rs(t.total) + '</dd></div>';
    return '<dl class="totals">' + rows + '</dl>';
  }

  /* Pages */
  var pages = {};

  pages.home = function () {
    var root = $('#home-deals');
    if (!root) return;
    var member = currentMember();
    var deals = allItems(false).filter(function (i) { return i.cat === 'deals'; });
    var feat = store.deals().filter(function (d) { return d.enabled && d.featured; }).slice(0, 3);
    root.innerHTML = feat.map(function (d) { return dealCard(d, member); }).join('') || '<p class="empty-note">No deals are featured right now.</p>';
    bindDealButtons(root);
    void deals;
  };

  var KIND_LABEL = { current: 'Current offer', combo: 'Combo deal', member: 'Member only', limited: 'Limited time' };
  function dealCard(d, member) {
    var item = getItem(d.id);
    if (!item) return '';
    var locked = item.memberOnly && !member;
    var meta = d.kind === 'limited' && d.end ? '<p class="deal-meta">Ends ' + esc(fmtDate(d.end)) + '</p>' : (d.discount ? '<p class="deal-meta">' + esc(d.discount) + '</p>' : '');
    var priceBlock = item.memberOnly && !member
      ? '<span><span class="price"><small>from</small></span><span class="deal-meta">Price shown after card check</span></span>'
      : priceHTML(item, member);
    var btn = locked
      ? '<a class="btn btn-secondary btn-sm" href="member.html">Verify card to order</a>'
      : '<button type="button" class="btn btn-primary" data-order-now="' + esc(d.id) + '">Order Now</button>';
    return '<article class="deal-card"><span class="tag ' + esc(d.kind) + '">' + esc(KIND_LABEL[d.kind] || 'Offer') + '</span><h3>' + esc(d.title) + '</h3><div><p>' + esc(d.desc) + '</p>' + meta + '</div><div class="deal-foot">' + priceBlock + btn + '</div></article>';
  }
  function bindDealButtons(root) {
    $$('[data-order-now]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = addToCart(b.getAttribute('data-order-now'), 1, []);
        if (r.ok) window.location.href = 'cart.html'; else toast(r.reason, r.needsCard ? 'member.html' : null, 'Verify card');
      });
    });
  }

  pages.deals = function () {
    var member = currentMember();
    var groups = [
      { kind: 'current', title: 'Current offers', note: 'Everyday offers on single items.' },
      { kind: 'member', title: 'Member-only offers', note: 'Verify your member card to order these.' },
      { kind: 'combo', title: 'Combo deals', note: 'Several items together at one price.' },
      { kind: 'limited', title: 'Limited-time deals', note: 'These end on the date shown.' }
    ];
    var all = store.deals().filter(function (d) { return d.enabled; });
    var root = $('#deals-root');
    root.innerHTML = groups.map(function (g) {
      var list = all.filter(function (d) { return d.kind === g.kind; });
      if (!list.length) return '';
      return '<section class="section" style="padding-block:28px 8px" aria-labelledby="g-' + g.kind + '"><div class="section-head"><div><h2 id="g-' + g.kind + '">' + g.title + '</h2><p>' + g.note + '</p></div></div><div class="grid-cards three">' + list.map(function (d) { return dealCard(d, member); }).join('') + '</div></section>';
    }).join('') || '<p class="empty-note">There are no deals right now. Check the menu for regular prices.</p>';
    bindDealButtons(root);
  };

  /* Menu */
  function productCard(item, member) {
    var locked = item.memberOnly && !member;
    var btn = locked ? '<a class="btn btn-secondary btn-sm" href="member.html">Verify card to order</a>' : '<button type="button" class="btn btn-primary btn-sm" data-add="' + esc(item.id) + '">Add to Cart</button>';
    return '<article class="product">' + ph(item.kind === 'deals' ? 'deal' : (item.cat === 'burgers' ? 'burger' : item.cat === 'fries' ? 'fries' : item.cat === 'drinks' ? 'drink' : 'pizza'), item.name, { id: item.id }) +
      '<div class="product-body"><h3 style="font-size:inherit"><button type="button" class="product-name" data-open="' + esc(item.id) + '">' + esc(item.name) + '</button></h3><p class="product-desc">' + esc(item.desc) + '</p>' + memberBadge(item, member) +
      '<div class="product-foot"><div>' + priceHTML(item, member) + '</div>' + btn + '</div></div></article>';
  }
  function phKind(item) { return item.kind === 'deals' ? 'deal' : (item.cat === 'burgers' ? 'burger' : item.cat === 'fries' ? 'fries' : item.cat === 'drinks' ? 'drink' : 'pizza'); }

  pages.menu = function () {
    var member = currentMember();
    var cats = store.cats().filter(function (c) { return c.enabled; });
    var items = allItems(false);
    var nav = $('#cat-nav-list'), root = $('#menu-root');
    nav.innerHTML = cats.map(function (c, i) { return '<li><a href="#' + c.id + '" data-cat="' + c.id + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + icon(c.icon || 'utensils') + esc(c.name) + '</a></li>'; }).join('');
    root.innerHTML = cats.map(function (c) {
      var list = items.filter(function (i) { return i.cat === c.id; });
      return '<section class="menu-section" id="' + esc(c.id) + '" aria-labelledby="h-' + esc(c.id) + '"><h2 id="h-' + esc(c.id) + '">' + esc(c.name) + '</h2>' + (c.blurb ? '<p>' + esc(c.blurb) + '</p>' : '') + (list.length ? '<div class="product-grid">' + list.map(function (i) { return productCard(i, member); }).join('') + '</div>' : '<p class="empty-note">Nothing in this category right now.</p>') + '</section>';
    }).join('');

    root.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) {
        var r = addToCart(add.getAttribute('data-add'), 1, []);
        if (r.ok) toast(r.item.name + ' added to your cart.', 'cart.html', 'View cart'); else toast(r.reason, r.needsCard ? 'member.html' : null, 'Verify card');
        return;
      }
      var open = e.target.closest('[data-open]');
      if (open) openProduct(open.getAttribute('data-open'));
    });

    /* Active category while scrolling */
    if ('IntersectionObserver' in window) {
      var links = $$('[data-cat]', nav);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('data-cat') === en.target.id ? 'true' : 'false'); });
        });
      }, { rootMargin: '-130px 0px -65% 0px' });
      $$('.menu-section', root).forEach(function (s) { io.observe(s); });
    }
  };

  function openProduct(id) {
    var item = getItem(id), dlg = $('#pd');
    if (!item || !dlg) return;
    var member = currentMember();
    var qty = 1;
    var addonHTML = item.addons.length ? '<fieldset class="addons"><legend>Add-ons <span class="muted" style="font-weight:500">(example prices)</span></legend>' + item.addons.map(function (a) { return '<label class="addon"><input type="checkbox" name="addon" value="' + a + '"><span>' + esc(ADDONS[a].name) + '</span><span class="addon-price">+ ' + rs(ADDONS[a].price) + '</span></label>'; }).join('') + '</fieldset>' : '';
    var locked = item.memberOnly && !member;
    dlg.innerHTML = '<div class="dlg-head"><h2 id="pd-title">' + esc(item.name) + '</h2><button type="button" class="dlg-close" data-close aria-label="Close">&times;</button></div>' +
      '<form class="pd-grid" id="pd-form">' + ph(phKind(item), item.name) +
      '<div class="pd-info"><p>' + esc(item.desc) + '</p><div>' + priceHTML(item, member) + '</div>' + memberBadge(item, member) + addonHTML +
      (locked ? '<p class="notice">' + icon('lock') + '<span>This deal needs a verified member card.</span></p><a class="btn btn-secondary" href="member.html">Verify member card</a>' :
        '<div class="field"><span class="label" id="qty-label">Quantity</span><div class="qty" role="group" aria-labelledby="qty-label"><button type="button" data-q="-1" aria-label="Decrease quantity">&minus;</button><output id="pd-qty" aria-live="polite">1</output><button type="button" data-q="1" aria-label="Increase quantity">+</button></div></div><div class="pd-actions"><button type="submit" class="btn btn-primary" id="pd-add">Add to Cart</button></div>') +
      '</div></form>';
    wireDialog(dlg);
    var form = $('#pd-form', dlg);
    function unitNow() {
      var base = member && item.memberPrice != null && item.memberPrice < item.price ? item.memberPrice : item.price;
      return base + $$('input[name=addon]:checked', form).reduce(function (s, c) { return s + ADDONS[c.value].price; }, 0);
    }
    function refresh() {
      var out = $('#pd-qty', dlg), add = $('#pd-add', dlg);
      if (out) out.textContent = qty;
      if (add) add.textContent = 'Add to Cart  ·  ' + rs(unitNow() * qty);
    }
    form.addEventListener('click', function (e) {
      var q = e.target.closest('[data-q]');
      if (q) { qty = Math.max(1, Math.min(20, qty + Number(q.getAttribute('data-q')))); refresh(); }
    });
    form.addEventListener('change', refresh);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var addons = $$('input[name=addon]:checked', form).map(function (c) { return c.value; });
      var r = addToCart(id, qty, addons);
      dlg.close();
      if (r.ok) toast(qty + ' x ' + item.name + ' added to your cart.', 'cart.html', 'View cart'); else toast(r.reason);
    });
    refresh();
    refreshIcons();
    openDialog(dlg);
  }

  /* Member page */
  pages.member = function () {
    var form = $('#verify-form'), out = $('#verify-result'), err = $('#verify-error'), input = $('#card-no');
    function showVerified(m) {
      out.hidden = false;
      out.innerHTML = '<div class="verified" role="status"><h3>' + icon('circle-check') + 'Member Card Verified</h3><p><strong>Welcome back.</strong></p><p>Member discounts are now applied to eligible products. Card ' + esc(m.no) + ', valid until ' + esc(fmtDate(m.expiry)) + '.</p>' +
        '<div class="example-compare" aria-label="Example of a member price"><div><span class="k">Regular price</span><span class="price">Rs. 1,000</span></div><div class="is-member"><span class="k">Member price</span><span class="price price-member">Rs. 500</span></div></div>' +
        '<p class="muted" style="font-size:.9rem">Example only. Member prices apply to eligible products, and the discount rules will follow Italian Pizza\'s real membership scheme.</p>' +
        '<div class="strip-actions"><a class="btn btn-primary" href="menu.html">See Member Prices on the Menu</a><a class="btn btn-secondary" href="cart.html">Go to Cart</a></div><button type="button" class="link-btn" id="remove-card" style="justify-self:start">Remove card from this device</button></div>';
      $('#remove-card').addEventListener('click', function () { clearMember(); out.hidden = true; out.innerHTML = ''; });
      refreshIcons();
    }
    var m0 = currentMember();
    if (m0) showVerified(m0);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      if (!input.value.trim()) { err.textContent = 'Enter your member card number.'; input.focus(); return; }
      var r = validCard(input.value);
      if (!r.ok) { out.hidden = true; err.textContent = r.reason; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      input.removeAttribute('aria-invalid');
      setMember(r.member.no);
      showVerified(r.member);
    });

    var dlg = $('#join-dialog');
    wireDialog(dlg);
    $('#open-join').addEventListener('click', function () { $('#join-form').hidden = false; $('#join-done').hidden = true; openDialog(dlg); });
    var jf = $('#join-form');
    jf.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [['j-name', 'Enter your name.'], ['j-phone', 'Enter a valid phone number, for example 0300 1234567.'], ['j-address', 'Enter your address.']].forEach(function (f) {
        var el = $('#' + f[0]), er = $('#' + f[0] + '-err'), v = el.value.trim();
        var bad = !v || (f[0] === 'j-phone' && !validPhone(v));
        er.textContent = bad ? f[1] : '';
        el.closest('.field').setAttribute('data-invalid', bad ? 'true' : 'false');
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      var reqs = store.requests();
      reqs.push({ id: 'r-' + Date.now(), name: $('#j-name').value.trim(), phone: $('#j-phone').value.trim(), address: $('#j-address').value.trim(), ts: Date.now() });
      store.setRequests(reqs);
      jf.hidden = true; jf.reset();
      $('#join-done').hidden = false;
      $('#join-done h3').focus();
    });
  };

  function validPhone(v) { return /^\+?[0-9]{10,13}$/.test(String(v).replace(/[\s-]/g, '')); }

  /* Cart page */
  pages.cart = function () {
    var root = $('#cart-root');
    function render() {
      var t = totals();
      if (!t.lines.length) {
        root.innerHTML = '<div class="panel empty-state">' + icon('shopping-bag') + '<h2>Your cart is empty</h2><p class="muted">Add something from the menu and it will show up here.</p><a class="btn btn-primary" href="menu.html">Browse the Menu</a></div>';
        refreshIcons();
        return;
      }
      root.innerHTML = '<div class="two-col"><section class="panel" aria-labelledby="items-h"><h2 id="items-h">Your items</h2><ul class="cart-lines">' + t.lines.map(function (l) {
        return '<li class="cart-line"><div><div class="name">' + esc(l.item.name) + '</div>' + (l.addons.length ? '<div class="opts">' + esc(l.addons.join(', ')) + '</div>' : '') +
          '<div class="opts num">' + (l.eligible ? '<span class="price-was">' + rs(l.unit) + '</span><span style="color:var(--basil-text);font-weight:700">' + rs(l.memberUnit) + ' member price</span>' : rs(l.unit) + ' each') + ' x ' + l.qty + '</div></div>' +
          '<div class="line-total">' + rs(l.total) + '</div>' +
          '<div class="line-ctrl"><div class="qty" role="group" aria-label="Quantity for ' + esc(l.item.name) + '"><button type="button" data-dec="' + esc(l.key) + '" aria-label="Decrease quantity of ' + esc(l.item.name) + '">&minus;</button><output aria-live="polite">' + l.qty + '</output><button type="button" data-inc="' + esc(l.key) + '" aria-label="Increase quantity of ' + esc(l.item.name) + '">+</button></div><button type="button" class="remove-btn" data-rm="' + esc(l.key) + '">Remove<span class="sr-only"> ' + esc(l.item.name) + '</span></button></div></li>';
      }).join('') + '</ul></section>' +
        '<aside aria-labelledby="sum-h"><div class="panel"><h2 id="sum-h">Order summary</h2>' + totalsHTML(t) + '<p class="muted" style="font-size:.88rem">Delivery is free for pickup. You choose delivery or pickup at checkout. Fees are examples.</p><div id="mb-slot">' + memberBoxHTML() + '</div><div class="cart-actions"><a class="btn btn-primary btn-block" href="checkout.html">Checkout</a><a class="btn btn-secondary btn-block" href="menu.html">Continue Shopping</a></div></div></aside></div>';
      bindMemberBox($('#mb-slot'), render);
      refreshIcons();
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-inc],[data-dec],[data-rm]');
      if (!b) return;
      var cart = getCart();
      var key = b.getAttribute('data-inc') || b.getAttribute('data-dec') || b.getAttribute('data-rm');
      var line = cart.filter(function (l) { return l.key === key; })[0];
      if (!line) return;
      if (b.hasAttribute('data-inc')) line.qty = Math.min(20, line.qty + 1);
      if (b.hasAttribute('data-dec')) line.qty = Math.max(1, line.qty - 1);
      if (b.hasAttribute('data-rm')) cart = cart.filter(function (l) { return l.key !== key; });
      setCart(cart);
      render();
    });
    render();
  };

  /* Checkout */
  pages.checkout = function () {
    var root = $('#checkout-root');
    var profile = read(K.profile, {});
    function render() {
      var t = totals();
      if (!t.lines.length) {
        root.innerHTML = '<div class="panel empty-state">' + icon('shopping-bag') + '<h2>Your cart is empty</h2><p class="muted">Add items from the menu before checking out.</p><a class="btn btn-primary" href="menu.html">Browse the Menu</a></div>';
        refreshIcons();
        return;
      }
      var type = orderType();
      root.innerHTML = '<div class="two-col"><form class="panel" id="co-form" novalidate aria-labelledby="ci-h"><h2 id="ci-h">Customer information</h2>' +
        '<div class="field" data-f="name"><label for="co-name">Name</label><input id="co-name" name="name" type="text" autocomplete="name" value="' + esc(profile.name || '') + '" aria-describedby="co-name-err" required><p class="field-error" id="co-name-err" role="alert"></p></div>' +
        '<div class="field" data-f="phone"><label for="co-phone">Phone number</label><input id="co-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="03XX XXXXXXX" value="' + esc(profile.phone || '') + '" aria-describedby="co-phone-err" required><p class="field-error" id="co-phone-err" role="alert"></p></div>' +
        '<fieldset style="border:0;margin:0;padding:0" class="field"><legend class="label" style="padding:0;margin-bottom:6px">Order type</legend><div class="choice-grid"><label class="choice"><input type="radio" name="type" value="Delivery"' + (type === 'Delivery' ? ' checked' : '') + '><span><span class="choice-title">Delivery</span><span class="choice-sub">To your address</span></span></label><label class="choice"><input type="radio" name="type" value="Pickup"' + (type === 'Pickup' ? ' checked' : '') + '><span><span class="choice-title">Pickup</span><span class="choice-sub">Collect it yourself</span></span></label></div></fieldset>' +
        '<div class="field" data-f="address" id="addr-wrap"' + (type === 'Pickup' ? ' hidden' : '') + '><label for="co-address">Delivery address</label><textarea id="co-address" name="address" autocomplete="street-address" aria-describedby="co-address-err">' + esc(profile.address || '') + '</textarea><p class="field-error" id="co-address-err" role="alert"></p></div>' +
        '<div class="field"><label for="co-notes">Order notes <span class="muted" style="font-weight:500">(optional)</span></label><textarea id="co-notes" name="notes" placeholder="Anything we should know about your order"></textarea></div></form>' +
        '<aside aria-labelledby="os-h"><div class="panel"><h2 id="os-h">Order summary</h2><ul class="summary-list">' + t.lines.map(function (l) {
          return '<li><span>' + esc(l.item.name) + ' x ' + l.qty + (l.addons.length ? '<br><span class="muted" style="font-size:.85rem">' + esc(l.addons.join(', ')) + '</span>' : '') + '</span><span>' + rs(l.total) + '</span></li>';
        }).join('') + '</ul>' + totalsHTML(t) + '<div id="mb-slot">' + memberBoxHTML() + '</div><button type="submit" form="co-form" class="btn btn-primary btn-block" id="place-order">Place Order</button><p class="muted" style="font-size:.86rem">Demo only. No payment is taken and nothing is sent to the restaurant.</p><a href="cart.html" class="link-btn" style="justify-self:start">Back to cart</a></div></aside></div>';
      var form = $('#co-form');
      bindMemberBox($('#mb-slot'), function () { keep(); render(); });
      $$('input[name=type]', form).forEach(function (r) { r.addEventListener('change', function () { keep(); write(K.type, r.value); render(); }); });
      form.addEventListener('submit', submit);
      refreshIcons();
    }
    function keep() {
      var f = $('#co-form'); if (!f) return;
      profile = { name: f.name.value, phone: f.phone.value, address: f.address.value };
      profile.notes = f.notes.value;
    }
    function submit(e) {
      e.preventDefault();
      var f = $('#co-form'), type = orderType();
      var checks = [['name', f.name.value.trim().length < 2, 'Enter your name.'], ['phone', !validPhone(f.phone.value), 'Enter a valid phone number, for example 0300 1234567.'], ['address', type === 'Delivery' && f.address.value.trim().length < 6, 'Enter your delivery address.']];
      var first = null;
      checks.forEach(function (c) {
        var er = $('#co-' + c[0] + '-err'), wrap = er.closest('.field');
        er.textContent = c[1] ? c[2] : '';
        wrap.setAttribute('data-invalid', c[1] ? 'true' : 'false');
        if (c[1] && !first) first = f[c[0]];
      });
      if (first) { first.focus(); return; }
      var t = totals(), m = currentMember();
      var order = { id: store.nextOrderNo(), ts: Date.now(), name: f.name.value.trim(), phone: f.phone.value.trim(), address: type === 'Delivery' ? f.address.value.trim() : '', type: type, notes: f.notes.value.trim(), items: t.lines.map(function (l) { return { name: l.item.name, qty: l.qty, unit: l.memberUnit, addons: l.addons }; }), subtotal: t.subtotal, discount: t.discount, delivery: t.delivery, total: t.total, status: 'New', card: m ? m.no : '' };
      var orders = store.orders(); orders.unshift(order); store.setOrders(orders);
      write(K.last, order.id);
      write(K.profile, { name: order.name, phone: order.phone, address: f.address.value.trim() });
      setCart([]);
      root.innerHTML = '<div class="panel confirm" role="status"><h2 tabindex="-1" id="done-h">Order Received</h2><p><strong>Thank you. Your order has been received.</strong></p><div><span class="muted">Order number</span><div class="order-no">#' + esc(order.id) + '</div></div><p>Status: <span class="status-pill">' + icon('circle-check') + 'Order Received</span></p><ul class="summary-list" style="width:100%">' + order.items.map(function (i) { return '<li><span>' + esc(i.name) + ' x ' + i.qty + '</span><span>' + rs(i.unit * i.qty) + '</span></li>'; }).join('') + '</ul><p class="num"><strong>Total ' + rs(order.total) + '</strong> (' + esc(order.type) + ')</p><div class="strip-actions" style="width:100%"><a class="btn btn-primary" href="order-status.html">Track Order</a><a class="btn btn-secondary" href="menu.html">Back to Menu</a></div><p class="muted" style="font-size:.88rem">This is a demo order. It appears in the <a href="admin.html">admin demo</a>.</p></div>';
      refreshIcons();
      var h = $('#done-h'); if (h) h.focus();
      window.scrollTo(0, 0);
    }
    render();
  };

  /* Order status */
  var STEPS = ['Order Received', 'Preparing', 'Ready', 'Delivered'];
  function stepIndex(s) { return { New: 0, Accepted: 0, Preparing: 1, Ready: 2, Completed: 3 }[s]; }
  pages.status = function () {
    var root = $('#status-root'), shown = read(K.last, null), lastStatus = null;
    function find(id) { return store.orders().filter(function (o) { return o.id.toUpperCase() === String(id || '').replace('#', '').trim().toUpperCase(); })[0]; }
    function render() {
      var o = shown ? find(shown) : null;
      var look = '<form class="panel" id="lookup" novalidate><h2>Find an order</h2><div class="field"><label for="ord-no">Order number</label><input id="ord-no" type="text" placeholder="Example: IP1001" autocapitalize="characters" aria-describedby="ord-err"><p class="field-error" id="ord-err" role="alert"></p></div><button class="btn btn-quiet" type="submit">Show Order</button></form>';
      if (!o) { root.innerHTML = '<div class="panel"><h2>No order to show yet</h2><p class="muted">Place an order and it will appear here. You can also look up an order number below.</p><a class="btn btn-primary" href="menu.html" style="justify-self:start">Browse the Menu</a></div>' + look; bind(); return; }
      lastStatus = o.status;
      var idx = stepIndex(o.status), cancelled = o.status === 'Cancelled';
      var labels = STEPS.slice(); if (o.type === 'Pickup') labels[3] = 'Picked up';
      root.innerHTML = '<section class="panel" aria-labelledby="st-h"><div><span class="muted">Order</span><h2 id="st-h" class="order-no" style="font-size:1.8rem">#' + esc(o.id) + '</h2><p class="muted">' + esc(o.type) + ', placed at ' + esc(fmtTime(o.ts)) + '</p></div>' +
        (cancelled ? '<div class="notice err">' + icon('triangle-alert') + '<span>This order was cancelled.</span></div>' : '<ol class="stepper" aria-label="Order progress">' + labels.map(function (l, i) { return '<li class="' + (i < idx || o.status === 'Completed' ? 'done' : i === idx ? 'current' : '') + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="dot">' + (i < idx || o.status === 'Completed' ? icon('check') : (i + 1)) + '</span><span>' + l + '</span></li>'; }).join('') + '</ol>') +
        '<p>Current status: <span class="status-pill">' + esc(o.status === 'New' ? 'Order Received' : o.status) + '</span></p>' +
        '<ul class="summary-list">' + o.items.map(function (i) { return '<li><span>' + esc(i.name) + ' x ' + i.qty + '</span><span>' + rs(i.unit * i.qty) + '</span></li>'; }).join('') + '</ul><p class="num"><strong>Total ' + rs(o.total) + '</strong></p>' +
        (!cancelled && o.status !== 'Completed' ? '<div class="notice">' + icon('info') + '<div>Demo control. In the live site, Italian Pizza updates this from the admin screen.<br><button type="button" class="btn btn-quiet btn-sm" id="advance" style="margin-top:8px">Advance status (demo)</button></div></div>' : '') +
        '</section>' + look;
      bind(); refreshIcons();
    }
    function bind() {
      var adv = $('#advance');
      if (adv) adv.addEventListener('click', function () {
        var orders = store.orders(), o = find(shown);
        var next = { New: 'Accepted', Accepted: 'Preparing', Preparing: 'Ready', Ready: 'Completed' }[o.status];
        orders.forEach(function (x) { if (x.id === o.id && next) x.status = next; });
        store.setOrders(orders); render();
      });
      $('#lookup').addEventListener('submit', function (e) {
        e.preventDefault();
        var v = $('#ord-no').value, found = find(v);
        if (!v.trim() || !found) { $('#ord-err').textContent = v.trim() ? 'We could not find that order number.' : 'Enter an order number.'; return; }
        shown = found.id; write(K.last, shown); render();
      });
    }
    render();
    setInterval(function () { var o = shown ? find(shown) : null; if (o && o.status !== lastStatus) render(); }, 3000);
  };

  /* Contact */
  pages.contact = function () {
    var f = $('#contact-form'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [['c-name', 'Enter your name.', function (v) { return v.length > 1; }], ['c-phone', 'Enter a valid phone number, for example 0300 1234567.', validPhone], ['c-msg', 'Write a short message.', function (v) { return v.length > 3; }]].forEach(function (c) {
        var el = $('#' + c[0]), er = $('#' + c[0] + '-err'), good = c[2](el.value.trim());
        er.textContent = good ? '' : c[1]; el.closest('.field').setAttribute('data-invalid', good ? 'false' : 'true');
        if (!good && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      f.reset();
      $('#contact-done').hidden = false;
    });
  };

  /* Public API for the admin demo */
  window.IP = { $: $, $$: $$, esc: esc, rs: rs, clone: clone, store: store, K: K, read: read, write: write, drop: drop, STATUSES: STATUSES, ADDONS: ADDONS, allItems: allItems, icon: icon, refreshIcons: refreshIcons, toast: toast, wireDialog: wireDialog, openDialog: openDialog, fmtDate: fmtDate, fmtTime: fmtTime, itemSummary: itemSummary, validPhone: validPhone, openGuide: openGuide, SEED_CATS: SEED_CATS };

  function boot() {
    var pageEl = document.querySelector('[data-page]');
    var page = pageEl ? pageEl.getAttribute('data-page') : '';
    initChrome();
    hydratePlaceholders();
    if (pages[page]) pages[page]();
    refreshIcons();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
