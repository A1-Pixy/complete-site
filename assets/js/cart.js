/*!
 * assets/js/cart.js — Pixy Dust Seasoning  v2.0
 * Slide-out cart drawer powered by pixy-cart.js (localStorage).
 * No Ecwid dependency.
 *
 * Registers: open/close on window.PIXY_CART
 * Listens:   document "pixy:cart:change"
 * Checkout:  navigates to checkout.html
 */

(function () {
  "use strict";

  // ── State ────────────────────────────────────────────────────────
  var _overlay  = null;
  var _bodyEl   = null;
  var _footEl   = null;
  var _isOpen   = false;

  // ── Utilities ────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;");
  }

  function fmt(n) {
    return "$" + Number(n || 0).toFixed(2);
  }

  // ── Build drawer DOM (once) ───────────────────────────────────────
  function buildDrawer() {
    var overlay = document.createElement("div");
    overlay.id        = "pixy-cart-overlay";
    overlay.className = "cart-drawer-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden    = true;

    var drawer = document.createElement("div");
    drawer.className = "cart-drawer";
    drawer.setAttribute("role",       "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Your cart");

    // Head
    var head = document.createElement("div");
    head.className = "cart-drawer-head";

    var headLeft = document.createElement("div");
    headLeft.className = "cart-drawer-head-left";

    var spark = document.createElement("span");
    spark.className = "cart-spark";
    spark.setAttribute("aria-hidden", "true");
    spark.textContent = "✦";

    var titleEl = document.createElement("span");
    titleEl.className = "cart-drawer-title";
    titleEl.textContent = "Your Cart";

    headLeft.appendChild(spark);
    headLeft.appendChild(titleEl);

    var closeBtn = document.createElement("button");
    closeBtn.type      = "button";
    closeBtn.className = "cart-drawer-close";
    closeBtn.setAttribute("aria-label", "Close cart");
    closeBtn.textContent = "×";

    head.appendChild(headLeft);
    head.appendChild(closeBtn);

    // Body (scrollable)
    var body = document.createElement("div");
    body.className = "cart-drawer-body";
    body.id        = "pixy-cart-body";

    // Foot (subtotal + checkout)
    var foot = document.createElement("div");
    foot.className = "cart-drawer-foot";
    foot.id        = "pixy-cart-foot";
    foot.hidden    = true;

    drawer.appendChild(head);
    drawer.appendChild(body);
    drawer.appendChild(foot);
    overlay.appendChild(drawer);
    document.body.appendChild(overlay);

    // Events
    closeBtn.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeDrawer();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && _isOpen) closeDrawer();
    });

    _overlay = overlay;
    _bodyEl  = body;
    _footEl  = foot;
  }

  // ── Render states ─────────────────────────────────────────────────
  function showEmpty() {
    if (!_bodyEl) return;
    _bodyEl.innerHTML =
      '<div class="cart-empty">' +
        '<span class="cart-empty-icon" aria-hidden="true">✦</span>' +
        '<p>Your cart is empty.</p>' +
        '<a class="btn btn-secondary cart-drawer-continue" href="shop.html">Continue Shopping</a>' +
      '</div>';
    if (_footEl) _footEl.hidden = true;
  }

  function renderCart(cart) {
    if (!_bodyEl) return;
    if (!cart || !cart.items || !cart.items.length) { showEmpty(); return; }

    var html = "";
    var items = cart.items;

    for (var i = 0; i < items.length; i++) {
      var item   = items[i];
      var name   = item.title || "Product";
      var qty    = item.qty   || 1;
      var price  = fmt((item.price || 0) * qty);
      var imgSrc = item.image || "assets/images/logo-circle.png";

      html +=
        '<article class="cart-item" data-key="' + esc(item.key) + '">' +
          '<div class="cart-item-img">' +
            '<img src="' + esc(imgSrc) + '" alt="' + esc(name) + '" loading="lazy"' +
              ' onerror="this.onerror=null;this.src=\'assets/images/logo-circle.png\'">' +
          '</div>' +
          '<div class="cart-item-info">' +
            '<p class="cart-item-name">' + esc(name) + '</p>' +
            '<div class="cart-item-controls">' +
              '<button class="cart-qty-btn" type="button" aria-label="Decrease quantity"' +
                ' data-action="dec" data-key="' + esc(item.key) + '">−</button>' +
              '<span class="cart-qty-val">' + qty + '</span>' +
              '<button class="cart-qty-btn" type="button" aria-label="Increase quantity"' +
                ' data-action="inc" data-key="' + esc(item.key) + '">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="cart-item-right">' +
            '<span class="cart-item-price">' + price + '</span>' +
            '<button class="cart-item-remove" type="button" aria-label="Remove ' + esc(name) + '"' +
              ' data-action="remove" data-key="' + esc(item.key) + '">×</button>' +
          '</div>' +
        '</article>';
    }

    _bodyEl.innerHTML = html;

    // Wire action buttons
    var btns = _bodyEl.querySelectorAll("[data-action]");
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener("click", handleItemAction);
    }

    renderFoot(cart);
    renderUpsell(cart.items);
  }

  function renderFoot(cart) {
    if (!_footEl) return;
    _footEl.hidden = false;
    _footEl.innerHTML = "";

    var subtotalRow = document.createElement("div");
    subtotalRow.className = "cart-drawer-subtotal";
    subtotalRow.innerHTML =
      '<span>Subtotal</span>' +
      '<span>' + fmt(cart.subtotal) + '</span>';

    var note = document.createElement("p");
    note.className   = "cart-drawer-note";
    note.textContent = "Shipping and taxes calculated at checkout.";

    var checkoutBtn = document.createElement("a");
    checkoutBtn.href      = "checkout.html";
    checkoutBtn.className = "btn btn-gold cart-drawer-checkout";
    checkoutBtn.textContent = "Proceed to Checkout";
    checkoutBtn.addEventListener("click", closeDrawer);

    var continueBtn = document.createElement("button");
    continueBtn.type      = "button";
    continueBtn.className = "btn btn-secondary cart-drawer-continue";
    continueBtn.textContent = "Continue Shopping";
    continueBtn.addEventListener("click", closeDrawer);

    _footEl.appendChild(subtotalRow);
    _footEl.appendChild(note);
    _footEl.appendChild(checkoutBtn);
    _footEl.appendChild(continueBtn);
  }

  function renderUpsell(currentItems) {
    var all = window.PIXY_PRODUCTS;
    if (!Array.isArray(all)) return;

    var currentKeys = {};
    for (var i = 0; i < currentItems.length; i++) {
      currentKeys[currentItems[i].key] = true;
    }

    var eligible = all.filter(function (p) {
      return p.category === "Pouches" && !currentKeys[p.key] && p.image;
    });

    if (!eligible.length) return;

    eligible = eligible.sort(function () { return 0.5 - Math.random(); }).slice(0, 2);

    var section = document.createElement("div");
    section.className = "cart-upsell";
    section.innerHTML = '<p class="cart-upsell-label">Add another blend</p>';

    for (var j = 0; j < eligible.length; j++) {
      var p = eligible[j];
      var card = document.createElement("div");
      card.className = "cart-upsell-card";
      card.innerHTML =
        '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">' +
        '<div class="cart-upsell-info">' +
          '<span class="cart-upsell-name">' + esc(p.title) + '</span>' +
          '<span class="cart-upsell-price">' + (p.price != null ? fmt(p.price) : "") + '</span>' +
        '</div>' +
        '<button class="cart-upsell-add btn btn-secondary" type="button"' +
          ' data-upsell-key="' + esc(p.key) + '">+ Add</button>';
      section.appendChild(card);
    }

    _bodyEl.appendChild(section);

    var addBtns = section.querySelectorAll("[data-upsell-key]");
    for (var k = 0; k < addBtns.length; k++) {
      addBtns[k].addEventListener("click", function (e) {
        var key = e.currentTarget.getAttribute("data-upsell-key");
        if (key && window.PIXY_CART) {
          window.PIXY_CART.addByKey(key, 1);
          e.currentTarget.textContent = "Added ✓";
          e.currentTarget.disabled = true;
        }
      });
    }
  }

  // ── Item actions ──────────────────────────────────────────────────
  function handleItemAction(e) {
    if (!window.PIXY_CART) return;
    var btn    = e.currentTarget;
    var action = btn.getAttribute("data-action");
    var key    = btn.getAttribute("data-key");
    if (!key) return;

    var cart  = window.PIXY_CART.getCart();
    var item  = null;
    for (var i = 0; i < cart.items.length; i++) {
      if (cart.items[i].key === key) { item = cart.items[i]; break; }
    }
    if (!item) return;

    if (action === "remove") {
      window.PIXY_CART.remove(key);
    } else if (action === "dec") {
      window.PIXY_CART.setQty(key, (item.qty || 1) - 1);
    } else if (action === "inc") {
      window.PIXY_CART.setQty(key, (item.qty || 1) + 1);
    }
  }

  // ── Badge ─────────────────────────────────────────────────────────
  function updateBadge(count) {
    var badges = document.querySelectorAll("[data-cart-badge]");
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = count > 0 ? String(count) : "";
      badges[i].hidden      = count <= 0;
    }
  }

  function injectBadges() {
    var btns = document.querySelectorAll("#openCartBtn, .cart-btn");
    for (var i = 0; i < btns.length; i++) {
      if (!btns[i].querySelector("[data-cart-badge]")) {
        var badge = document.createElement("span");
        badge.className = "cart-badge";
        badge.setAttribute("data-cart-badge", "");
        badge.hidden    = true;
        btns[i].appendChild(badge);
      }
    }
  }

  // ── Open / Close ──────────────────────────────────────────────────
  function openDrawer() {
    if (!_overlay) buildDrawer();
    if (_isOpen) return;

    var scrollW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow    = "hidden";
    if (scrollW > 0) document.body.style.paddingRight = scrollW + "px";

    _overlay.hidden = false;
    _overlay.removeAttribute("aria-hidden");

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        _overlay.classList.add("cart-drawer--open");
      });
    });

    _isOpen = true;

    var cart = window.PIXY_CART ? window.PIXY_CART.getCart() : { items: [], subtotal: 0, count: 0 };
    renderCart(cart);
  }

  function closeDrawer() {
    if (!_overlay || !_isOpen) return;
    _overlay.classList.remove("cart-drawer--open");
    _isOpen = false;
    document.body.style.overflow     = "";
    document.body.style.paddingRight = "";
    _overlay.setAttribute("aria-hidden", "true");
    setTimeout(function () {
      if (!_isOpen && _overlay) _overlay.hidden = true;
    }, 350);
  }

  // ── Boot ──────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    injectBadges();

    // Wire cart buttons
    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("#openCartBtn, .cart-btn") : null;
      if (btn) { e.preventDefault(); openDrawer(); }
    });

    // Listen for cart changes
    document.addEventListener("pixy:cart:change", function (e) {
      var count = e.detail ? (e.detail.count || 0) : 0;
      updateBadge(count);
      if (_isOpen && _bodyEl) renderCart(e.detail || { items: [], subtotal: 0, count: 0 });
    });

    // Listen for "Add to cart" toasts (show feedback)
    document.addEventListener("pixy:cart:added", function (e) {
      var detail = e.detail || {};
      var name   = detail.product && detail.product.title ? detail.product.title : "Item";
      showToast(name + " added to cart");
    });

    // Set open/close on PIXY_CART
    if (window.PIXY_CART) {
      window.PIXY_CART.open  = openDrawer;
      window.PIXY_CART.close = closeDrawer;
    }
  });

  // ── Toast ─────────────────────────────────────────────────────────
  function showToast(msg) {
    var t = document.querySelector("[data-toast]");
    if (!t) return;
    t.textContent = msg;
    t.hidden      = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () { t.hidden = true; }, 2800);
  }

})();
