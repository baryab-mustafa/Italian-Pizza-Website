/* Italian Pizza admin demo. Sign-in is mocked and all data is sample data kept in this browser. */
(function () {
  'use strict';
  function start() {
    var IP = window.IP;
    if (!IP) return;
    var $ = IP.$, $$ = IP.$$, esc = IP.esc, rs = IP.rs, store = IP.store, icon = IP.icon;
    var STATUSES = IP.STATUSES;
    var VIEWS = [
      { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
      { id: 'orders', label: 'Orders', icon: 'clipboard-list' },
      { id: 'products', label: 'Products', icon: 'pizza' },
      { id: 'categories', label: 'Categories', icon: 'tag' },
      { id: 'members', label: 'Member Cards', icon: 'credit-card' },
      { id: 'deals', label: 'Deals', icon: 'badge-percent' },
      { id: 'customers', label: 'Customers', icon: 'users' }
    ];
    var state = { view: 'overview', orderFilter: 'All', memberQuery: '' };
    var main = $('#adm-main');
    var dlg = $('#adm-dlg');
    IP.wireDialog(dlg);

    function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('c-' + Date.now()); }
    function sClass(s) { return 's-' + s.toLowerCase(); }
    function badge(s) { return '<span class="status ' + sClass(s) + '">' + esc(s) + '</span>'; }
    function sameDay(ts) { var a = new Date(ts), b = new Date(); return a.toDateString() === b.toDateString(); }
    function timeCell(ts) { return sameDay(ts) ? IP.fmtTime(ts) : IP.fmtDate(new Date(ts).toISOString()) + ', ' + IP.fmtTime(ts); }
    function switchEl(attr, on, label) {
      return '<label class="switch"><input type="checkbox" role="switch" ' + attr + (on ? ' checked' : '') + ' aria-label="' + esc(label) + '"><span class="sw"></span><span>' + (on ? 'On' : 'Off') + '</span></label>';
    }
    function setDialog(title, body) {
      dlg.innerHTML = '<div class="dlg-head"><h2 id="adm-dlg-title">' + esc(title) + '</h2><button type="button" class="dlg-close" data-close aria-label="Close">&times;</button></div>' + body;
      IP.wireDialog(dlg);
      IP.refreshIcons();
      IP.openDialog(dlg);
    }
    var confirmTimers = {};
    function confirmButton(btn, action) {
      if (btn.getAttribute('data-armed') === '1') { clearTimeout(confirmTimers[btn.id]); action(); return; }
      var old = btn.textContent;
      btn.setAttribute('data-armed', '1');
      btn.textContent = 'Confirm delete';
      btn.classList.add('btn-primary');
      confirmTimers[btn.id] = setTimeout(function () { btn.setAttribute('data-armed', '0'); btn.textContent = old; btn.classList.remove('btn-primary'); }, 4000);
    }

    /* Sections */
    var views = {};

    views.overview = function () {
      var orders = store.orders();
      var today = orders.filter(function (o) { return sameDay(o.ts); });
      var pending = today.filter(function (o) { return ['New', 'Accepted', 'Preparing', 'Ready'].indexOf(o.status) > -1; }).length;
      var done = today.filter(function (o) { return o.status === 'Completed'; }).length;
      var sales = today.filter(function (o) { return o.status !== 'Cancelled'; }).reduce(function (s, o) { return s + o.total; }, 0);
      var counts = {}; STATUSES.forEach(function (s) { counts[s] = today.filter(function (o) { return o.status === s; }).length; });
      var max = Math.max(1, Math.max.apply(null, STATUSES.map(function (s) { return counts[s]; })));
      return '<div class="tiles">' +
        '<div class="tile"><span class="k">Today\'s Orders</span><span class="v">' + today.length + '</span><span class="s">All statuses</span></div>' +
        '<div class="tile' + (pending ? ' attn' : '') + '"><span class="k">Pending Orders</span><span class="v">' + pending + '</span><span class="s">New to Ready</span></div>' +
        '<div class="tile"><span class="k">Completed Orders</span><span class="v">' + done + '</span><span class="s">Delivered or collected</span></div>' +
        '<div class="tile"><span class="k">Total Sales</span><span class="v">' + rs(sales) + '</span><span class="s">Today, excludes cancelled</span></div></div>' +
        '<div class="split"><section class="panel" aria-labelledby="sb-h"><h2 id="sb-h">Orders by status</h2><div class="bars">' + STATUSES.map(function (s) {
          return '<div class="bar-row"><span>' + s + '</span><span class="track"><span class="fill ' + sClass(s) + '" style="display:block;width:' + Math.round(counts[s] / max * 100) + '%"></span></span><span class="n">' + counts[s] + '</span></div>';
        }).join('') + '</div></section>' +
        '<section aria-labelledby="lo-h" style="display:grid;gap:12px;min-width:0"><div class="adm-head"><h2 id="lo-h" style="font-size:1.2rem">Latest orders</h2><a href="#orders" data-go="orders" class="link-btn">All orders</a></div>' + ordersTable(orders.slice(0, 5), false) + '</section></div>';
    };

    function ordersTable(list, editable) {
      if (!list.length) return '<p class="empty-note">No orders match this filter.</p>';
      return '<div class="table-wrap" tabindex="0" role="region" aria-label="Orders table, scrolls sideways on small screens"><table class="data"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th class="num">Total</th><th>Status</th><th>Time</th></tr></thead><tbody>' + list.map(function (o) {
        return '<tr><td class="id-cell">#' + esc(o.id) + '</td><td class="wrap">' + esc(o.name) + '<br><span class="muted" style="font-size:.85rem">' + esc(o.type) + '</span></td><td class="items">' + esc(IP.itemSummary(o.items)) + '</td><td class="num">' + rs(o.total) + '</td><td>' +
          (editable ? '<select class="sel" data-order="' + esc(o.id) + '" aria-label="Status for order ' + esc(o.id) + '">' + STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' : badge(o.status)) + '</td><td style="white-space:nowrap">' + esc(timeCell(o.ts)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    }

    views.orders = function () {
      var orders = store.orders();
      var list = state.orderFilter === 'All' ? orders : orders.filter(function (o) { return o.status === state.orderFilter; });
      var chips = ['All'].concat(STATUSES).map(function (s) {
        var n = s === 'All' ? orders.length : orders.filter(function (o) { return o.status === s; }).length;
        return '<button type="button" class="chip" data-filter="' + s + '" aria-pressed="' + (state.orderFilter === s) + '">' + s + ' (' + n + ')</button>';
      }).join('');
      return '<div class="chips" role="group" aria-label="Filter orders by status">' + chips + '</div>' + ordersTable(list, true) + '<p class="muted adm-note">Change a status with the menu in each row. The customer order status page shows the same status.</p>';
    };

    function addonChecks(sel) {
      return Object.keys(IP.ADDONS).map(function (k) { return '<label><input type="checkbox" name="addons" value="' + k + '"' + (sel.indexOf(k) > -1 ? ' checked' : '') + '>' + esc(IP.ADDONS[k].name) + ' (+ ' + rs(IP.ADDONS[k].price) + ')</label>'; }).join('');
    }

    views.products = function () {
      var cats = store.cats(), catName = {}; cats.forEach(function (c) { catName[c.id] = c.name; });
      var prods = store.products();
      return '<div class="toolbar"><p class="muted adm-note">Disabled products are hidden from the menu. Change a price in the table and it updates on the menu.</p><button type="button" class="btn btn-primary" data-add-product>' + icon('plus') + 'Add product</button></div>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Products table, scrolls sideways on small screens"><table class="data"><thead><tr><th>Product</th><th>Category</th><th class="num">Price (Rs.)</th><th class="num">Member price</th><th>Available</th><th>Actions</th></tr></thead><tbody>' + prods.map(function (p) {
          return '<tr><td class="wrap"><strong>' + esc(p.name) + '</strong></td><td>' + esc(catName[p.cat] || p.cat) + '</td><td class="num"><input class="price-input" type="number" min="0" step="1" value="' + p.price + '" data-price="' + esc(p.id) + '" aria-label="Price for ' + esc(p.name) + '"></td><td class="num">' + (p.memberPrice != null && p.memberPrice !== '' ? rs(p.memberPrice) : 'None') + '</td><td>' + switchEl('data-toggle-product="' + esc(p.id) + '"', p.enabled, 'Available: ' + p.name) + '</td><td class="actions"><button type="button" class="btn btn-quiet btn-sm" data-edit-product="' + esc(p.id) + '">Edit</button><button type="button" class="btn btn-quiet btn-sm" id="del-p-' + esc(p.id) + '" data-del-product="' + esc(p.id) + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    };

    function productDialog(id) {
      var cats = store.cats().filter(function (c) { return c.id !== 'deals'; });
      var p = id ? store.products().filter(function (x) { return x.id === id; })[0] : { name: '', cat: cats[0] ? cats[0].id : 'pizza', desc: '', price: '', memberPrice: '', addons: [], enabled: true };
      setDialog(id ? 'Edit product' : 'Add product',
        '<form class="dlg-body form-grid" id="product-form" novalidate>' +
        '<div class="field"><label for="pf-name">Name</label><input id="pf-name" value="' + esc(p.name) + '" required><p class="field-error" id="pf-name-err"></p></div>' +
        '<div class="field"><label for="pf-cat">Category</label><select id="pf-cat">' + cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === p.cat ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="pf-desc">Description</label><textarea id="pf-desc">' + esc(p.desc) + '</textarea></div>' +
        '<div class="field-row two"><div class="field"><label for="pf-price">Price (Rs.)</label><input id="pf-price" type="number" min="0" step="1" value="' + esc(p.price) + '" required><p class="field-error" id="pf-price-err"></p></div><div class="field"><label for="pf-mprice">Member price (Rs.)</label><input id="pf-mprice" type="number" min="0" step="1" value="' + esc(p.memberPrice == null ? '' : p.memberPrice) + '"><span class="hint">Leave empty if members get no discount on this item.</span></div></div>' +
        '<div class="field"><span class="label">Add-ons offered</span><div class="check-list">' + addonChecks(p.addons || []) + '</div></div>' +
        '<label class="switch"><input type="checkbox" id="pf-enabled"' + (p.enabled ? ' checked' : '') + '><span class="sw"></span><span>Available on the menu</span></label>' +
        '<div class="inline-actions"><button class="btn btn-primary" type="submit">Save product</button><button class="btn btn-quiet" type="button" data-close>Cancel</button></div></form>');
      $('#product-form', dlg).addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('#pf-name').value.trim(), price = Number($('#pf-price').value);
        $('#pf-name-err').textContent = name ? '' : 'Enter a product name.';
        $('#pf-price-err').textContent = $('#pf-price').value !== '' && price >= 0 ? '' : 'Enter a price of 0 or more.';
        if (!name || $('#pf-price').value === '' || price < 0) return;
        var mp = $('#pf-mprice').value;
        var rec = { id: id || ('p-' + Date.now()), cat: $('#pf-cat').value, name: name, desc: $('#pf-desc').value.trim(), price: price, memberPrice: mp === '' ? null : Number(mp), addons: $$('input[name=addons]:checked', dlg).map(function (c) { return c.value; }), enabled: $('#pf-enabled').checked };
        var list = store.products();
        if (id) list = list.map(function (x) { return x.id === id ? rec : x; }); else list.push(rec);
        store.setProducts(list); dlg.close(); render(); IP.toast('Product saved.');
      });
    }

    views.categories = function () {
      var cats = store.cats(), prods = store.products();
      return '<form class="toolbar" id="cat-add" novalidate><div class="field"><label for="cat-new">New category</label><input id="cat-new" placeholder="Example: Desserts"><p class="field-error" id="cat-new-err"></p></div><button class="btn btn-primary" type="submit" style="align-self:end">' + icon('plus') + 'Add category</button></form>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Categories table, scrolls sideways on small screens"><table class="data"><thead><tr><th>Name</th><th class="num">Products</th><th>Shown on menu</th><th>Order</th><th>Actions</th></tr></thead><tbody>' + cats.map(function (c, i) {
          var n = c.id === 'deals' ? store.deals().length : prods.filter(function (p) { return p.cat === c.id; }).length;
          return '<tr><td><input class="name-input" value="' + esc(c.name) + '" data-rename="' + esc(c.id) + '" aria-label="Name of category ' + esc(c.name) + '"></td><td class="num">' + n + '</td><td>' + switchEl('data-toggle-cat="' + esc(c.id) + '"', c.enabled, 'Shown on menu: ' + c.name) + '</td><td class="actions"><button type="button" class="btn btn-quiet btn-sm" data-move="' + esc(c.id) + '" data-dir="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move ' + esc(c.name) + ' up">' + icon('chevron-up') + '</button><button type="button" class="btn btn-quiet btn-sm" data-move="' + esc(c.id) + '" data-dir="1"' + (i === cats.length - 1 ? ' disabled' : '') + ' aria-label="Move ' + esc(c.name) + ' down">' + icon('chevron-down') + '</button></td><td class="actions">' + (c.id === 'deals' ? '<span class="muted">Managed in Deals</span>' : '<button type="button" class="btn btn-quiet btn-sm" id="del-c-' + esc(c.id) + '" data-del-cat="' + esc(c.id) + '"' + (n ? ' disabled title="Move or delete its products first"' : '') + '>Delete</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="muted adm-note">A category with products cannot be deleted. Move or remove the products first.</p>';
    };

    function memberNo() {
      var max = 1000;
      store.members().forEach(function (m) { var n = parseInt(String(m.no).replace(/\D/g, ''), 10); if (n > max) max = n; });
      return 'IP' + (max + 1);
    }
    function isExpired(m) { return m.expiry && new Date(m.expiry + 'T23:59:59') < new Date(); }

    views.members = function () {
      var q = state.memberQuery.trim().toLowerCase();
      var list = store.members().filter(function (m) { return !q || (m.no + ' ' + m.name + ' ' + m.phone).toLowerCase().indexOf(q) > -1; });
      var reqs = store.requests();
      return '<div class="toolbar"><div class="field"><label for="m-search">Search card number</label><input id="m-search" type="search" value="' + esc(state.memberQuery) + '" placeholder="Example: IP1001"></div><button type="button" class="btn btn-primary" data-add-member style="align-self:end">' + icon('plus') + 'Add card</button></div>' +
        (list.length ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Member cards table, scrolls sideways on small screens"><table class="data"><thead><tr><th>Card</th><th>Member</th><th>Status</th><th>Expiry date</th><th>Actions</th></tr></thead><tbody>' + list.map(function (m) {
          var on = m.status === 'active';
          return '<tr><td class="id-cell">' + esc(m.no) + '</td><td class="wrap">' + esc(m.name) + '<br><span class="muted" style="font-size:.85rem">' + esc(m.phone) + '</span></td><td><span class="status ' + (on && !isExpired(m) ? 'on' : 'off') + '">' + (on ? (isExpired(m) ? 'Expired' : 'Active') : 'Inactive') + '</span></td><td><input class="date-input" type="date" value="' + esc(m.expiry || '') + '" data-expiry="' + esc(m.no) + '" aria-label="Expiry date for card ' + esc(m.no) + '"></td><td class="actions"><button type="button" class="btn btn-quiet btn-sm" data-card-toggle="' + esc(m.no) + '">' + (on ? 'Deactivate' : 'Activate') + '</button><button type="button" class="btn btn-quiet btn-sm" data-card-view="' + esc(m.no) + '">View</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="empty-note">No card matches that search.</p>') +
        (reqs.length ? '<section class="panel" aria-labelledby="rq-h"><h2 id="rq-h">Membership requests</h2><ul class="req-list">' + reqs.map(function (r) {
          return '<li><div><strong>' + esc(r.name) + '</strong><br><span class="muted">' + esc(r.phone) + ', ' + esc(r.address) + '</span></div><div class="inline-actions"><button type="button" class="btn btn-basil btn-sm" data-approve="' + esc(r.id) + '">Approve and issue card</button><button type="button" class="btn btn-quiet btn-sm" data-dismiss="' + esc(r.id) + '">Dismiss</button></div></li>';
        }).join('') + '</ul></section>' : '');
    };

    function memberDialog() {
      var d = new Date(); d.setFullYear(d.getFullYear() + 1);
      var iso = d.toISOString().slice(0, 10);
      setDialog('Add member card',
        '<form class="dlg-body form-grid" id="member-form" novalidate><p class="muted">The next card number is <strong>' + memberNo() + '</strong>.</p>' +
        '<div class="field"><label for="mf-name">Name</label><input id="mf-name"><p class="field-error" id="mf-name-err"></p></div>' +
        '<div class="field"><label for="mf-phone">Phone</label><input id="mf-phone" type="tel" placeholder="03XX XXXXXXX"><p class="field-error" id="mf-phone-err"></p></div>' +
        '<div class="field"><label for="mf-exp">Expiry date</label><input id="mf-exp" type="date" value="' + iso + '"></div>' +
        '<div class="inline-actions"><button class="btn btn-primary" type="submit">Issue card</button><button class="btn btn-quiet" type="button" data-close>Cancel</button></div></form>');
      $('#member-form', dlg).addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('#mf-name').value.trim(), phone = $('#mf-phone').value.trim();
        $('#mf-name-err').textContent = name ? '' : 'Enter the member name.';
        $('#mf-phone-err').textContent = IP.validPhone(phone) ? '' : 'Enter a valid phone number.';
        if (!name || !IP.validPhone(phone)) return;
        var list = store.members(); list.push({ no: memberNo(), name: name, phone: phone, address: '', status: 'active', expiry: $('#mf-exp').value }); store.setMembers(list);
        dlg.close(); render(); IP.toast('Card issued.');
      });
    }

    function viewMember(no) {
      var m = store.members().filter(function (x) { return x.no === no; })[0]; if (!m) return;
      var phoneKey = m.phone.replace(/\D/g, '');
      var orders = store.orders().filter(function (o) { return o.card === m.no || o.phone.replace(/\D/g, '') === phoneKey; });
      setDialog('Member ' + m.no, '<div class="dlg-body"><dl class="detail-list"><div><dt>Name</dt><dd>' + esc(m.name) + '</dd></div><div><dt>Phone</dt><dd>' + esc(m.phone) + '</dd></div><div><dt>Address</dt><dd>' + esc(m.address || 'Not recorded') + '</dd></div><div><dt>Status</dt><dd>' + esc(m.status === 'active' ? 'Active' : 'Inactive') + '</dd></div><div><dt>Expiry</dt><dd>' + esc(m.expiry ? IP.fmtDate(m.expiry) : 'Not set') + '</dd></div><div><dt>Orders</dt><dd>' + orders.length + '</dd></div></dl><button class="btn btn-quiet" type="button" data-close style="justify-self:start">Close</button></div>');
    }

    var KINDS = { current: 'Current offer', member: 'Member only', combo: 'Combo deal', limited: 'Limited time' };
    views.deals = function () {
      var deals = store.deals();
      return '<div class="toolbar"><p class="muted adm-note">Deals appear on the Deals page and in the Deals menu section. In the full build, start and end dates will switch deals on and off automatically.</p><button type="button" class="btn btn-primary" data-add-deal>' + icon('plus') + 'Create deal</button></div>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Deals table, scrolls sideways on small screens"><table class="data"><thead><tr><th>Deal</th><th>Type</th><th class="num">Price</th><th>Dates</th><th>Eligible items</th><th>Active</th><th>Actions</th></tr></thead><tbody>' + deals.map(function (d) {
          return '<tr><td class="wrap"><strong>' + esc(d.title) + '</strong>' + (d.discount ? '<br><span class="muted" style="font-size:.85rem">' + esc(d.discount) + '</span>' : '') + '</td><td>' + esc(KINDS[d.kind] || d.kind) + '</td><td class="num">' + rs(d.price) + (d.memberPrice != null && d.memberPrice !== '' ? '<br><span class="muted" style="font-size:.85rem">Member ' + rs(d.memberPrice) + '</span>' : '') + '</td><td style="white-space:nowrap">' + esc(d.start ? IP.fmtDate(d.start) : 'Not set') + '<br>to ' + esc(d.end ? IP.fmtDate(d.end) : 'Not set') + '</td><td class="num">' + (d.eligible || []).length + '</td><td>' + switchEl('data-toggle-deal="' + esc(d.id) + '"', d.enabled, 'Active: ' + d.title) + '</td><td class="actions"><button type="button" class="btn btn-quiet btn-sm" data-edit-deal="' + esc(d.id) + '">Edit</button><button type="button" class="btn btn-quiet btn-sm" id="del-d-' + esc(d.id) + '" data-del-deal="' + esc(d.id) + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    };

    function dealDialog(id) {
      var d = id ? store.deals().filter(function (x) { return x.id === id; })[0] : { title: '', desc: '', price: '', memberPrice: null, kind: 'current', discount: '', eligible: [], start: new Date().toISOString().slice(0, 10), end: '', enabled: true, featured: false, memberOnly: false };
      var prods = store.products();
      setDialog(id ? 'Edit deal' : 'Create deal',
        '<form class="dlg-body form-grid" id="deal-form" novalidate>' +
        '<div class="field"><label for="df-title">Deal name</label><input id="df-title" value="' + esc(d.title) + '"><p class="field-error" id="df-title-err"></p></div>' +
        '<div class="field"><label for="df-desc">Description</label><textarea id="df-desc">' + esc(d.desc) + '</textarea></div>' +
        '<div class="field-row two"><div class="field"><label for="df-kind">Type</label><select id="df-kind">' + Object.keys(KINDS).map(function (k) { return '<option value="' + k + '"' + (k === d.kind ? ' selected' : '') + '>' + KINDS[k] + '</option>'; }).join('') + '</select></div><div class="field"><label for="df-discount">Discount note</label><input id="df-discount" value="' + esc(d.discount || '') + '" placeholder="Example: Save Rs. 200"></div></div>' +
        '<div class="field-row two"><div class="field"><label for="df-price">Price (Rs.)</label><input id="df-price" type="number" min="0" step="1" value="' + esc(d.price) + '"><p class="field-error" id="df-price-err"></p></div><div class="field"><label for="df-mprice">Member price (Rs.)</label><input id="df-mprice" type="number" min="0" step="1" value="' + esc(d.memberPrice == null ? '' : d.memberPrice) + '"></div></div>' +
        '<div class="field-row two"><div class="field"><label for="df-start">Start date</label><input id="df-start" type="date" value="' + esc(d.start || '') + '"></div><div class="field"><label for="df-end">End date</label><input id="df-end" type="date" value="' + esc(d.end || '') + '"></div></div>' +
        '<div class="field"><span class="label">Eligible products</span><div class="check-list">' + prods.map(function (p) { return '<label><input type="checkbox" name="elig" value="' + esc(p.id) + '"' + ((d.eligible || []).indexOf(p.id) > -1 ? ' checked' : '') + '>' + esc(p.name) + '</label>'; }).join('') + '</div></div>' +
        '<label class="switch"><input type="checkbox" id="df-memberonly"' + (d.memberOnly ? ' checked' : '') + '><span class="sw"></span><span>Member only (needs a verified card)</span></label>' +
        '<label class="switch"><input type="checkbox" id="df-featured"' + (d.featured ? ' checked' : '') + '><span class="sw"></span><span>Show in Today\'s Deals on the home page</span></label>' +
        '<label class="switch"><input type="checkbox" id="df-enabled"' + (d.enabled ? ' checked' : '') + '><span class="sw"></span><span>Active</span></label>' +
        '<div class="inline-actions"><button class="btn btn-primary" type="submit">Save deal</button><button class="btn btn-quiet" type="button" data-close>Cancel</button></div></form>');
      $('#deal-form', dlg).addEventListener('submit', function (e) {
        e.preventDefault();
        var title = $('#df-title').value.trim(), pv = $('#df-price').value, price = Number(pv);
        $('#df-title-err').textContent = title ? '' : 'Enter a deal name.';
        $('#df-price-err').textContent = pv !== '' && price >= 0 ? '' : 'Enter a price of 0 or more.';
        if (!title || pv === '' || price < 0) return;
        var mp = $('#df-mprice').value;
        var rec = { id: id || ('dl-' + Date.now()), title: title, desc: $('#df-desc').value.trim(), price: price, memberPrice: mp === '' ? null : Number(mp), memberOnly: $('#df-memberonly').checked, kind: $('#df-kind').value, featured: $('#df-featured').checked, discount: $('#df-discount').value.trim(), eligible: $$('input[name=elig]:checked', dlg).map(function (c) { return c.value; }), start: $('#df-start').value, end: $('#df-end').value, enabled: $('#df-enabled').checked };
        var list = store.deals();
        if (id) list = list.map(function (x) { return x.id === id ? rec : x; }); else list.push(rec);
        store.setDeals(list); dlg.close(); render(); IP.toast('Deal saved.');
      });
    }

    views.customers = function () {
      var map = {};
      store.orders().forEach(function (o) {
        var key = o.phone.replace(/\D/g, '');
        var c = map[key] || (map[key] = { name: o.name, phone: o.phone, orders: 0, last: 0, card: '' });
        c.orders++; if (o.ts > c.last) c.last = o.ts; if (o.card) c.card = o.card;
      });
      store.members().forEach(function (m) {
        var key = m.phone.replace(/\D/g, '');
        var c = map[key] || (map[key] = { name: m.name, phone: m.phone, orders: 0, last: 0, card: '' });
        c.card = m.no; c.member = m;
      });
      var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.last - a.last; });
      return '<div class="table-wrap" tabindex="0" role="region" aria-label="Customers table, scrolls sideways on small screens"><table class="data"><thead><tr><th>Name</th><th>Phone</th><th class="num">Orders</th><th>Member status</th></tr></thead><tbody>' + list.map(function (c) {
        var st;
        if (!c.card) st = '<span class="status off">Not a member</span>';
        else {
          var m = store.members().filter(function (x) { return x.no === c.card; })[0];
          var ok = m && m.status === 'active' && !isExpired(m);
          st = '<span class="status ' + (ok ? 'on' : 'off') + '">' + esc(c.card) + (ok ? ' active' : ' not active') + '</span>';
        }
        return '<tr><td class="wrap">' + esc(c.name) + '</td><td style="white-space:nowrap">' + esc(c.phone) + '</td><td class="num">' + c.orders + '</td><td>' + st + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="muted adm-note">Customers are built from orders and member cards. Names and phone numbers here are sample data.</p>';
    };

    /* Frame and routing */
    function render() {
      var v = VIEWS.filter(function (x) { return x.id === state.view; })[0] || VIEWS[0];
      $$('.adm-nav a').forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('data-go') === v.id ? 'page' : 'false'); });
      main.innerHTML = '<div class="adm-head"><h1>' + v.label + '</h1><span class="status off">Sample data</span></div>' + views[v.id]();
      IP.refreshIcons();
    }
    function go(id) {
      state.view = id;
      try { window.location.hash = id; } catch (e) { /* ignore */ }
      render();
      main.focus({ preventScroll: true });
    }

    $('#adm-nav-list').innerHTML = VIEWS.map(function (v) { return '<li><a href="#' + v.id + '" data-go="' + v.id + '">' + icon(v.icon) + v.label + '</a></li>'; }).join('');
    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
      var t;
      if ((t = e.target.closest('[data-filter]'))) { state.orderFilter = t.getAttribute('data-filter'); render(); return; }
      if (e.target.closest('[data-add-product]')) { productDialog(); return; }
      if ((t = e.target.closest('[data-edit-product]'))) { productDialog(t.getAttribute('data-edit-product')); return; }
      if ((t = e.target.closest('[data-del-product]'))) { var pid = t.getAttribute('data-del-product'); confirmButton(t, function () { store.setProducts(store.products().filter(function (p) { return p.id !== pid; })); render(); IP.toast('Product deleted.'); }); return; }
      if ((t = e.target.closest('[data-del-cat]'))) { var cid = t.getAttribute('data-del-cat'); confirmButton(t, function () { store.setCats(store.cats().filter(function (c) { return c.id !== cid; })); render(); IP.toast('Category deleted.'); }); return; }
      if ((t = e.target.closest('[data-move]'))) {
        var cats = store.cats(), i = cats.map(function (c) { return c.id; }).indexOf(t.getAttribute('data-move')), j = i + Number(t.getAttribute('data-dir'));
        if (cats[j]) { var tmp = cats[i]; cats[i] = cats[j]; cats[j] = tmp; store.setCats(cats); render(); }
        return;
      }
      if (e.target.closest('[data-add-member]')) { memberDialog(); return; }
      if ((t = e.target.closest('[data-card-toggle]'))) { var no = t.getAttribute('data-card-toggle'); store.setMembers(store.members().map(function (m) { if (m.no === no) m.status = m.status === 'active' ? 'inactive' : 'active'; return m; })); render(); return; }
      if ((t = e.target.closest('[data-card-view]'))) { viewMember(t.getAttribute('data-card-view')); return; }
      if ((t = e.target.closest('[data-approve]'))) {
        var rid = t.getAttribute('data-approve'), req = store.requests().filter(function (r) { return r.id === rid; })[0];
        if (req) {
          var d = new Date(); d.setFullYear(d.getFullYear() + 1);
          var ms = store.members(); var no2 = memberNo(); ms.push({ no: no2, name: req.name, phone: req.phone, address: req.address, status: 'active', expiry: d.toISOString().slice(0, 10) }); store.setMembers(ms);
          store.setRequests(store.requests().filter(function (r) { return r.id !== rid; })); render(); IP.toast('Card ' + no2 + ' issued.');
        }
        return;
      }
      if ((t = e.target.closest('[data-dismiss]'))) { var did = t.getAttribute('data-dismiss'); store.setRequests(store.requests().filter(function (r) { return r.id !== did; })); render(); return; }
      if (e.target.closest('[data-add-deal]')) { dealDialog(); return; }
      if ((t = e.target.closest('[data-edit-deal]'))) { dealDialog(t.getAttribute('data-edit-deal')); return; }
      if ((t = e.target.closest('[data-del-deal]'))) { var dd = t.getAttribute('data-del-deal'); confirmButton(t, function () { store.setDeals(store.deals().filter(function (x) { return x.id !== dd; })); render(); IP.toast('Deal deleted.'); }); return; }
    });
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-order]')) { var id = t.getAttribute('data-order'); store.setOrders(store.orders().map(function (o) { if (o.id === id) o.status = t.value; return o; })); render(); return; }
      if (t.matches('[data-price]')) { var v = Number(t.value); if (t.value === '' || v < 0) { render(); return; } var pid = t.getAttribute('data-price'); store.setProducts(store.products().map(function (p) { if (p.id === pid) p.price = v; return p; })); IP.toast('Price updated.'); render(); return; }
      if (t.matches('[data-toggle-product]')) { var tp = t.getAttribute('data-toggle-product'); store.setProducts(store.products().map(function (p) { if (p.id === tp) p.enabled = t.checked; return p; })); render(); return; }
      if (t.matches('[data-toggle-cat]')) { var tc = t.getAttribute('data-toggle-cat'); store.setCats(store.cats().map(function (c) { if (c.id === tc) c.enabled = t.checked; return c; })); render(); return; }
      if (t.matches('[data-toggle-deal]')) { var td = t.getAttribute('data-toggle-deal'); store.setDeals(store.deals().map(function (d) { if (d.id === td) d.enabled = t.checked; return d; })); render(); return; }
      if (t.matches('[data-rename]')) { var rc = t.getAttribute('data-rename'), nm = t.value.trim(); if (!nm) { render(); return; } store.setCats(store.cats().map(function (c) { if (c.id === rc) c.name = nm; return c; })); IP.toast('Category renamed.'); return; }
      if (t.matches('[data-expiry]')) { var en = t.getAttribute('data-expiry'); store.setMembers(store.members().map(function (m) { if (m.no === en) m.expiry = t.value; return m; })); render(); return; }
    });
    document.addEventListener('input', function (e) {
      if (e.target.id === 'm-search') { state.memberQuery = e.target.value; var pos = e.target.selectionStart; render(); var el = $('#m-search'); el.focus(); el.setSelectionRange(pos, pos); }
    });
    document.addEventListener('submit', function (e) {
      if (e.target.id === 'cat-add') {
        e.preventDefault();
        var name = $('#cat-new').value.trim();
        if (!name) { $('#cat-new-err').textContent = 'Enter a category name.'; return; }
        var cats = store.cats(), id = slug(name);
        if (cats.some(function (c) { return c.id === id; })) { $('#cat-new-err').textContent = 'That category already exists.'; return; }
        cats.splice(Math.max(0, cats.length - 1), 0, { id: id, name: name, enabled: true, icon: 'utensils', blurb: '' });
        store.setCats(cats); render(); IP.toast('Category added.');
      }
    });

    /* Mock sign-in */
    function showApp() {
      $('#gate').hidden = true; $('#app').hidden = false;
      var h = (window.location.hash || '').replace('#', '');
      if (VIEWS.some(function (v) { return v.id === h; })) state.view = h;
      render();
    }
    $('#signin-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = $('#adm-user').value.trim(), p = $('#adm-pass').value;
      var er = $('#signin-err');
      if (!u || !p) { er.textContent = 'Enter a username and password. Any values work in this demo.'; return; }
      IP.write(IP.K.admin, true); showApp();
    });
    $('#signout').addEventListener('click', function () { IP.write(IP.K.admin, false); $('#app').hidden = true; $('#gate').hidden = false; });
    window.addEventListener('hashchange', function () {
      var h = (window.location.hash || '').replace('#', '');
      if (!$('#app').hidden && VIEWS.some(function (v) { return v.id === h; }) && h !== state.view) { state.view = h; render(); }
    });
    if (IP.read(IP.K.admin, false)) showApp();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); }); else setTimeout(start, 0);
})();
