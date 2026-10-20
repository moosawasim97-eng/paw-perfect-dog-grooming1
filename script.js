(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var WA_NUMBER = '447403218926';
  var gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { return null; }
    return null;
  }
  function openWhatsApp(text) {
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
    return url;
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = d.querySelector('.nav-toggle');
  var mnav = d.getElementById('mobile-nav');
  function closeNav() {
    if (!toggle || !mnav) return;
    mnav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && mnav) {
    toggle.addEventListener('click', function () {
      var open = mnav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  }

  /* ---------- Header on scroll ---------- */
  var header = d.querySelector('.site-header');
  var lastScrolled = null;
  function onScrollHeader() {
    var s = window.scrollY > 8;
    if (s !== lastScrolled && header) { header.classList.toggle('is-scrolled', s); lastScrolled = s; }
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Button ripple from the touch point ---------- */
  if (!reduce) {
    d.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2.2;
      var s = d.createElement('span');
      s.className = 'ripple';
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px';
      s.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(s);
      s.addEventListener('animationend', function () { s.remove(); });
    });
  }

  /* ---------- Soap bubbles: pop with a fine spray, then float up again ---------- */
  function spray(bubble) {
    var field = bubble.parentNode;
    var fr = field.getBoundingClientRect();
    var br = bubble.getBoundingClientRect();
    var cx = br.left - fr.left + br.width / 2;
    var cy = br.top - fr.top + br.height / 2;
    var n = 7;
    for (var i = 0; i < n; i++) {
      var dot = d.createElement('i');
      dot.className = 'droplet';
      dot.style.left = cx + 'px';
      dot.style.top = cy + 'px';
      field.appendChild(dot);
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      var dist = br.width * (0.55 + Math.random() * 0.5);
      var tx = Math.cos(ang) * dist;
      var ty = Math.sin(ang) * dist;
      var anim = dot.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 0.95 },
        { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(0.8)', opacity: 0.7, offset: 0.55 },
        { transform: 'translate(' + tx * 1.1 + 'px,' + (ty + 26) + 'px) scale(0.4)', opacity: 0 }
      ], { duration: 520 + Math.random() * 180, easing: 'cubic-bezier(.2,.7,.4,1)' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(dot);
    }
  }
  if (!reduce) {
    d.querySelectorAll('.spark').forEach(function (s) {
      var popping = false;
      function pop() {
        if (popping) return;
        popping = true;
        s.classList.add('is-pop');
        spray(s);
        setTimeout(function () {
          s.classList.remove('is-pop');
          s.style.animation = 'none';
          void s.offsetWidth;
          s.style.animation = '';
          s.style.setProperty('--delay', '0s');
          popping = false;
        }, 260);
      }
      s.addEventListener('pointerenter', pop);
      s.addEventListener('pointerdown', pop);
    });
  }

  /* ---------- Pause looping motion when off screen; start trails and reveals ---------- */
  if ('IntersectionObserver' in window) {
    var heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-paused', !en.isIntersecting); });
    });
    d.querySelectorAll('.hero, .page-hero').forEach(function (el) { heroObs.observe(el); });

    var walkObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-walking', en.isIntersecting); });
    }, { threshold: 0.2 });
    d.querySelectorAll('.trail').forEach(function (el) { walkObs.observe(el); });

    if (root.classList.contains('reveal-ready')) {
      // Observe the grid (a fully clipped photo never reports as visible), then reveal its photos in turn
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.querySelectorAll('.photo').forEach(function (p, i) {
            p.style.setProperty('--delay', i * 120 + 'ms');
            p.classList.add('is-in');
          });
          revObs.unobserve(en.target);
        });
      }, { threshold: 0.12 });
      d.querySelectorAll('.photos').forEach(function (grid) { revObs.observe(grid); });
    }
  } else {
    root.classList.remove('reveal-ready');
  }

  /* ---------- Reviews marquee: pause button, and rest when off screen ---------- */
  d.querySelectorAll('.reviews').forEach(function (sec) {
    var mq = sec.querySelector('.marquee');
    var btn = sec.querySelector('.marquee-toggle');
    if (btn && mq) {
      btn.addEventListener('click', function () {
        var paused = mq.classList.toggle('is-paused');
        btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        btn.querySelector('span').textContent = paused ? 'Play' : 'Pause';
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { sec.classList.toggle('is-offscreen', !en.isIntersecting); });
      }).observe(sec);
    }
  });

  /* ---------- Numbers count up when the stats band comes into view ---------- */
  var counters = d.querySelectorAll('[data-to]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countObs.unobserve(en.target);
        var el = en.target;
        var to = parseFloat(el.getAttribute('data-to'));
        var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
        var t0 = null, dur = 1400;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = p < 1 ? (to * e).toFixed(dec) : to.toFixed(dec);
          if (p < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      el.textContent = (0).toFixed(parseInt(el.getAttribute('data-dec') || '0', 10));
      countObs.observe(el);
    });
  }

  /* ---------- Hero photo follows the pointer slightly ---------- */
  var visual = d.querySelector('.hero__visual');
  var hero = d.querySelector('.hero');
  if (visual && hero && finePointer && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      visual.style.setProperty('--px', (x * 18).toFixed(1) + 'px');
      visual.style.setProperty('--py', (y * 14).toFixed(1) + 'px');
    });
    hero.addEventListener('pointerleave', function () {
      visual.style.setProperty('--px', '0px');
      visual.style.setProperty('--py', '0px');
    });
  }

  /* ---------- Timeline draws as you scroll ---------- */
  var lists = d.querySelectorAll('.steps');
  var ticking = false;
  function updateSteps() {
    ticking = false;
    var line = window.innerHeight * 0.62;
    lists.forEach(function (ul) {
      var r = ul.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (line - r.top) / r.height));
      ul.style.setProperty('--p', p.toFixed(3));
      ul.querySelectorAll('li').forEach(function (li) {
        li.classList.toggle('is-on', li.getBoundingClientRect().top < line);
      });
    });
  }
  if (lists.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateSteps); }
    }, { passive: true });
    window.addEventListener('resize', updateSteps);
    updateSteps();
  }

  /* ---------- WhatsApp widget: one short peek per visit ---------- */
  var wa = d.querySelector('.wa');
  if (wa && !reduce) {
    var seen = false;
    try { seen = !!window.sessionStorage.getItem('pp-wa-peek'); } catch (e) { seen = false; }
    if (!seen) {
      setTimeout(function () { wa.classList.add('is-peek'); }, 2500);
      setTimeout(function () {
        wa.classList.remove('is-peek');
        try { window.sessionStorage.setItem('pp-wa-peek', '1'); } catch (e) { /* ignore */ }
      }, 7500);
    }
  }

  /* ---------- Booking form (sends the message through WhatsApp) ---------- */
  d.querySelectorAll('.book-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var fields = form.querySelectorAll('[required]');
    function check(field) {
      var v = field.value.trim();
      var ok = v.length > 0 && (field.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      var group = field.closest('.field-group');
      if (group) group.classList.toggle('is-invalid', !ok);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { if (f.value.trim()) check(f); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { if (!check(f) && !firstBad) firstBad = f; });
      if (firstBad) {
        firstBad.focus();
        status.textContent = 'Please fix the highlighted fields.';
        return;
      }
      var v = function (n) { return (form.elements[n] ? form.elements[n].value : '').trim(); };
      var lines = ['Hi Paw Perfect, I’d like to book an appointment.', 'Name: ' + v('first') + ' ' + v('last'), 'Email: ' + v('email')];
      if (v('phone')) lines.push('Phone: ' + v('phone'));
      lines.push('Message: ' + v('message'));
      var url = openWhatsApp(lines.join('\n'));
      status.textContent = '';
      status.appendChild(d.createTextNode('Opening WhatsApp with your message… If it doesn’t open, '));
      var a = d.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'tap here';
      status.appendChild(a);
      status.appendChild(d.createTextNode('.'));
    });
  });

  /* ---------- Shop ---------- */
  var dataEl = d.getElementById('product-data');
  var products = dataEl ? JSON.parse(dataEl.textContent) : [];
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });
  var cart = [];
  try { cart = JSON.parse(store('pp-cart') || '[]') || []; } catch (e) { cart = []; }
  cart = cart.filter(function (i) { return i && typeof i.price === 'number' && i.name; });
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cartTotal() { return cart.reduce(function (n, i) { return n + i.price * i.qty; }, 0); }
  function lineHTML(item, idx, editable) {
    var qty = editable
      ? '<div class="qty"><button type="button" data-q="-1" data-i="' + idx + '" aria-label="Remove one ' + esc(item.name) + '">\u2212</button><span>' + item.qty + '</span>' +
        '<button type="button" data-q="1" data-i="' + idx + '" aria-label="Add one ' + esc(item.name) + '">+</button></div>'
      : '<p>Qty ' + item.qty + '</p>';
    var sw = item.img ? '<span class="line-item__swatch has-img" style="background-image:url(\'' + esc(item.img) + '\')" aria-hidden="true"></span>'
      : '<span class="line-item__swatch ' + esc(item.pat) + '" aria-hidden="true"></span>';
    return sw +
      '<div><h3>' + esc(item.name) + '</h3>' + (item.opts ? '<p>' + esc(item.opts) + '</p>' : '') + qty + '</div>' +
      '<span class="line-item__price">' + gbp.format(item.price * item.qty) + '</span>';
  }
  function orderText() {
    var lines = ['Hi Paw Perfect, I\u2019d like to order:'];
    cart.forEach(function (item) {
      lines.push('- ' + item.qty + ' x ' + item.name + (item.opts ? ' (' + item.opts + ')' : '') + ' \u2013 ' + gbp.format(item.price * item.qty));
    });
    lines.push('Total: ' + gbp.format(cartTotal()) + ' (free UK postage)');
    return lines.join('\n');
  }
  var cartBtn = d.querySelector('.cart-btn');
  var countEl = d.querySelector('.cart-count');
  var drawer = d.getElementById('cart');
  var scrim = d.querySelector('.scrim');
  var lastFocus = null;

  function cartCount() { return cart.reduce(function (n, i) { return n + i.qty; }, 0); }
  var cartListeners = [];
  function saveCart() {
    store('pp-cart', JSON.stringify(cart));
    cartListeners.forEach(function (fn) { fn(); });
  }
  window.addEventListener('storage', function (e) {
    if (e.key !== 'pp-cart') return;
    try { cart = (JSON.parse(e.newValue || '[]') || []).filter(function (i) { return i && typeof i.price === 'number' && i.name; }); } catch (err) { cart = []; }
    renderCount(false);
    if (drawer && drawer.classList.contains('is-open')) renderCart();
    cartListeners.forEach(function (fn) { fn(); });
  });
  function renderCount(bump) {
    if (!countEl) return;
    var n = cartCount();
    countEl.textContent = n;
    countEl.hidden = n === 0;
    if (cartBtn) cartBtn.hidden = n === 0 && !d.body.classList.contains('page-shop');
    if (cartBtn) cartBtn.setAttribute('aria-label', 'Basket, ' + n + (n === 1 ? ' item' : ' items'));
    if (bump && !reduce) {
      countEl.classList.remove('is-bump'); void countEl.offsetWidth; countEl.classList.add('is-bump');
    }
  }
  function renderCart() {
    if (!drawer) return;
    var body = drawer.querySelector('.drawer__body');
    var foot = drawer.querySelector('.drawer__foot');
    body.textContent = '';
    if (!cart.length) {
      body.innerHTML = '<div class="empty"><p>Your basket is empty.</p><a class="btn btn--outline" href="shop.html">Browse the shop</a></div>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    cart.forEach(function (item, idx) {
      var row = d.createElement('div');
      row.className = 'line-item';
      row.innerHTML = lineHTML(item, idx, true);
      body.appendChild(row);
    });
    drawer.querySelector('.total span:last-child').textContent = gbp.format(cartTotal());
  }
  function openCart() {
    if (!drawer) return;
    lastFocus = d.activeElement;
    renderCart();
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    d.body.style.overflow = 'hidden';
    setTimeout(function () { drawer.querySelector('.drawer__close').focus(); }, 60);
  }
  function closeCart() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    d.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (scrim) scrim.addEventListener('click', closeCart);
  if (drawer) {
    drawer.querySelector('.drawer__close').addEventListener('click', closeCart);
    drawer.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (!b) return;
      var i = +b.getAttribute('data-i');
      cart[i].qty += +b.getAttribute('data-q');
      if (cart[i].qty <= 0) cart.splice(i, 1);
      saveCart(); renderCart(); renderCount(false);
    });
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(drawer.querySelectorAll('button, a[href]'), function (el) { return el.offsetParent !== null && !el.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeCart(); closeNav(); }
  });
  d.addEventListener('click', function (e) {
    if (e.target.closest('.order-btn') && cart.length) openWhatsApp(orderText());
  });

  function flyToCart(fromEl) {
    if (reduce || !cartBtn || !fromEl.animate) return;
    var a = fromEl.getBoundingClientRect();
    var b = cartBtn.getBoundingClientRect();
    var sx = a.left + a.width / 2, sy = a.top + a.height / 2;
    var ex = b.left + b.width / 2, ey = b.top + b.height / 2;
    var dot = d.createElement('span');
    dot.className = 'fly';
    dot.style.left = sx + 'px';
    dot.style.top = sy + 'px';
    d.body.appendChild(dot);
    var dx = ex - sx, dy = ey - sy;
    var anim = dot.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: 'translate(' + dx * 0.45 + 'px,' + (dy * 0.45 - 90) + 'px) scale(1.15)', offset: 0.45 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.4)', opacity: 0.6 }
    ], { duration: 700, easing: 'cubic-bezier(.45,.05,.35,1)' });
    anim.onfinish = function () { dot.remove(); renderCount(true); };
  }

  var grid = d.querySelector('.products');
  if (grid) {
    grid.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var id = form.getAttribute('data-id');
      var opts = [];
      var price = parseFloat(form.getAttribute('data-price'));
      form.querySelectorAll('select').forEach(function (s) {
        opts.push(s.getAttribute('data-label') + ': ' + s.value);
        var o = s.options[s.selectedIndex];
        if (o && o.getAttribute('data-price')) price = parseFloat(o.getAttribute('data-price'));
      });
      var key = id + '|' + opts.join(', ');
      var found = cart.filter(function (i) { return i.key === key; })[0];
      if (found) found.qty += 1;
      else cart.push({ key: key, id: id, name: byId[id].name, pat: byId[id].pat, img: byId[id].img, opts: opts.join(', '), price: price, qty: 1 });
      saveCart();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.querySelector('span');
      label.textContent = 'Added';
      setTimeout(function () { label.textContent = 'Add to basket'; }, 1400);
      if (cartBtn && cartBtn.hidden) cartBtn.hidden = false;
      if (reduce) renderCount(false); else flyToCart(btn);
      var live = d.getElementById('shop-status');
      if (live) live.textContent = byId[id].name + ' added to your basket.';
    });

    // Price follows the chosen size
    grid.addEventListener('change', function (e) {
      var s = e.target;
      var o = s.options && s.options[s.selectedIndex];
      if (!o || !o.getAttribute('data-price')) return;
      var now = s.closest('.product').querySelector('.price__now');
      now.textContent = gbp.format(parseFloat(o.getAttribute('data-price')));
      if (!reduce) { now.classList.remove('is-change'); void now.offsetWidth; now.classList.add('is-change'); }
    });

    // Filters and sorting with smooth re-layout (FLIP)
    var cards = Array.prototype.slice.call(grid.children);
    var countText = d.getElementById('result-count');
    var current = 'all';
    function flip(change) {
      var first = new Map();
      cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });
      change();
      if (reduce) return;
      cards.forEach(function (c) {
        if (c.hidden) return;
        var last = c.getBoundingClientRect();
        var f = first.get(c);
        if (f) {
          var dx = f.left - last.left, dy = f.top - last.top;
          if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.22,.8,.3,1)' });
        } else {
          c.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,.8,.3,1)' });
        }
      });
    }
    function applyFilter() {
      var n = 0;
      cards.forEach(function (c) {
        var show = current === 'all' || c.getAttribute('data-cat') === current;
        c.hidden = !show;
        if (show) n++;
      });
      if (countText) countText.textContent = current === 'all' ? 'Showing all ' + n + ' products' : 'Showing ' + n + (n === 1 ? ' product' : ' products');
    }
    d.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        d.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        current = chip.getAttribute('data-cat');
        flip(applyFilter);
      });
    });
    var sortSel = d.getElementById('sort');
    if (sortSel) {
      sortSel.addEventListener('change', function () {
        var mode = sortSel.value;
        flip(function () {
          var sorted = cards.slice().sort(function (a, b) {
            var pa = byId[a.getAttribute('data-id')], pb = byId[b.getAttribute('data-id')];
            if (mode === 'price-asc') return pa.min - pb.min || pa.order - pb.order;
            if (mode === 'price-desc') return pb.max - pa.max || pa.order - pb.order;
            if (mode === 'rating') return (pb.rating || 0) - (pa.rating || 0) || pa.order - pb.order;
            return pa.order - pb.order;
          });
          sorted.forEach(function (c) { grid.appendChild(c); });
        });
      });
    }
  }
  renderCount(false);

  /* ---------- Checkout (PayPal: PayPal, Pay Later and cards) ---------- */
  // DEMO: 'test' is PayPal's sandbox client ID. Swap in the business's live client ID to take real payments.
  var PAYPAL_CLIENT_ID = 'test';
  var co = d.getElementById('checkout');
  if (co) {
    var done = d.getElementById('done');
    var emptyBox = d.getElementById('checkout-empty');
    var delivery = d.getElementById('delivery');
    var payStatus = d.getElementById('pay-status');
    var mount = d.getElementById('paypal-buttons');
    var reqd = delivery.querySelectorAll('[required]');
    var pcRe = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    var val = function (n) { return (delivery.elements[n].value || '').trim(); };

    var renderSummary = function () {
      var box = co.querySelector('.summary__items');
      box.textContent = '';
      cart.forEach(function (item, idx) {
        var row = d.createElement('div');
        row.className = 'line-item';
        row.innerHTML = lineHTML(item, idx, false);
        box.appendChild(row);
      });
      co.querySelector('.js-subtotal').textContent = gbp.format(cartTotal());
      co.querySelector('.js-total').textContent = gbp.format(cartTotal());
    };
    var checkField = function (f) {
      var v = f.value.trim();
      var ok = v.length > 0;
      if (ok && f.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (ok && f.name === 'postcode') ok = pcRe.test(v);
      var g = f.closest('.field-group');
      if (g) g.classList.toggle('is-invalid', !ok);
      f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    var validDelivery = function (focus) {
      var bad = null;
      reqd.forEach(function (f) { if (!checkField(f) && !bad) bad = f; });
      if (bad && focus) { bad.focus(); payStatus.textContent = 'Please complete your delivery details first.'; }
      return !bad;
    };
    reqd.forEach(function (f) {
      f.addEventListener('blur', function () { if (f.value.trim()) checkField(f); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') checkField(f); });
    });

    var showDone = function (details) {
      var name = val('name').split(' ')[0];
      var ref = details && details.id ? ' Your reference is ' + details.id + '.' : '';
      co.hidden = true;
      done.hidden = false;
      var pc = val('postcode').toUpperCase().replace(/\s+/g, '');
      pc = pc.slice(0, -3) + ' ' + pc.slice(-3);
      done.querySelector('.js-done-text').textContent = 'Thanks ' + name + '. Your payment went through and your order will be posted free to ' + pc +
        '. PayPal will email you a receipt.' + ref;
      cart = []; saveCart(); renderCount(false);
      done.focus();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    };

    var mountButtons = function () {
      mount.textContent = '';
      window.paypal.Buttons({
        style: { layout: 'vertical', shape: 'pill', color: 'gold', label: 'pay', height: 48 },
        onClick: function (data, actions) {
          payStatus.textContent = '';
          return validDelivery(true) ? actions.resolve() : actions.reject();
        },
        createOrder: function (data, actions) {
          var total = cartTotal().toFixed(2);
          var address = { address_line_1: val('addr1'), admin_area_2: val('town'), postal_code: val('postcode').toUpperCase(), country_code: 'GB' };
          if (val('addr2')) address.address_line_2 = val('addr2');
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              description: 'Paw Perfect shop order',
              amount: { currency_code: 'GBP', value: total, breakdown: { item_total: { currency_code: 'GBP', value: total }, shipping: { currency_code: 'GBP', value: '0.00' } } },
              items: cart.map(function (i) {
                return { name: i.name.slice(0, 127), description: (i.opts || '').slice(0, 127), quantity: String(i.qty), category: 'PHYSICAL_GOODS', unit_amount: { currency_code: 'GBP', value: i.price.toFixed(2) } };
              }),
              shipping: { name: { full_name: val('name') }, address: address }
            }],
            application_context: { shipping_preference: 'SET_PROVIDED_ADDRESS', brand_name: 'Paw Perfect' }
          });
        },
        onApprove: function (data, actions) {
          payStatus.textContent = 'Confirming your payment…';
          return actions.order.capture().then(showDone);
        },
        onCancel: function () { payStatus.textContent = 'Payment cancelled. Your basket is still saved.'; },
        onError: function () { payStatus.textContent = 'The payment didn’t go through. Please try again, or send your order on WhatsApp.'; }
      }).render(mount);
    };

    var sdkRequested = false;
    var loadPayPal = function () {
      if (sdkRequested) return;
      sdkRequested = true;
      var sdk = d.createElement('script');
      sdk.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(PAYPAL_CLIENT_ID) +
        '&currency=GBP&intent=capture&components=buttons&enable-funding=paylater,card' +
        (PAYPAL_CLIENT_ID === 'test' ? '&buyer-country=GB' : '');
      sdk.async = true;
      sdk.onerror = function () {
        mount.innerHTML = '<p class="pay__loading">Payment options couldn\u2019t load. Check your connection and refresh, or send your order on WhatsApp.</p>';
      };
      sdk.onload = function () {
        if (window.paypal && window.paypal.Buttons) mountButtons();
        else sdk.onerror();
      };
      d.head.appendChild(sdk);
    };
    var syncCheckout = function () {
      if (!done.hidden) return;
      if (!cart.length) { co.hidden = true; emptyBox.hidden = false; return; }
      co.hidden = false; emptyBox.hidden = true;
      renderSummary();
      loadPayPal();
    };
    cartListeners.push(syncCheckout);
    syncCheckout();
  }
})();
