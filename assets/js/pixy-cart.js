/*!
 * assets/js/pixy-cart.js — Pixy Dust Seasoning
 * localStorage-based cart system. No external dependencies.
 *
 * Public API (window.PIXY_CART):
 *   add(product, qty)          — add a full product object
 *   addByKey(key, qty)         — add by products.js key
 *   addByEcwidId(ecwidId, qty) — add by Ecwid product ID (legacy compat)
 *   remove(key)                — remove all qty of a product
 *   setQty(key, qty)           — set exact qty (0 = remove)
 *   getCart()                  — returns { items, subtotal, count }
 *   clear()                    — empty the cart
 *   open()                     — open drawer (set by cart.js)
 *   close()                    — close drawer (set by cart.js)
 *
 * Events:
 *   document → "pixy:cart:change"  detail: { items, subtotal, count }
 *   document → "pixy:cart:added"   detail: { product, qty, cart }
 */

(function () {
  "use strict";

  var STORAGE_KEY = "pixy_cart_v2";

  // ── Storage ──────────────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (_) { return []; }
  }

  function save(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (_) {}
    emit("pixy:cart:change");
  }

  function emit(name, extra) {
    var detail = Object.assign({}, getCart(), extra || {});
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: false })); } catch (_) {}
  }

  // ── Computed cart ────────────────────────────────────────────────
  function getCart() {
    var items = load();
    var subtotal = 0;
    var count    = 0;
    for (var i = 0; i < items.length; i++) {
      subtotal += (items[i].price || 0) * (items[i].qty || 1);
      count    += (items[i].qty || 1);
    }
    return { items: items, subtotal: subtotal, count: count };
  }

  // ── Lookup helpers ───────────────────────────────────────────────
  function findProductByKey(key) {
    var list = window.PIXY_PRODUCTS;
    if (!Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].key) === String(key)) return list[i];
    }
    return null;
  }

  function findProductByEcwidId(ecwidId) {
    var list = window.PIXY_PRODUCTS;
    if (!Array.isArray(list)) return null;
    var id = Number(ecwidId);
    for (var i = 0; i < list.length; i++) {
      if (list[i] && Number(list[i].ecwidProductId) === id) return list[i];
    }
    return null;
  }

  // ── Core operations ──────────────────────────────────────────────
  function add(product, qty) {
    if (!product || !product.key) { console.warn("[pixy-cart] add() requires product with key"); return null; }
    qty = Math.max(1, parseInt(qty, 10) || 1);

    var items    = load();
    var existing = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].key === product.key) { existing = items[i]; break; }
    }

    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        key:              product.key,
        title:            product.title            || "",
        price:            product.price            || 0,
        image:            product.image            || null,
        category:         product.category         || null,
        ecwidProductId:   product.ecwidProductId   || null,
        qty:              qty
      });
    }

    save(items);

    try { document.dispatchEvent(new CustomEvent("pixy:cart:added", {
      detail: { product: product, qty: qty, cart: getCart() }, bubbles: false
    })); } catch (_) {}

    return getCart();
  }

  function addByKey(key, qty) {
    var p = findProductByKey(key);
    if (!p) {
      // Retry once products load
      if (!Array.isArray(window.PIXY_PRODUCTS)) {
        console.warn("[pixy-cart] Products not loaded yet for key:", key);
      } else {
        console.warn("[pixy-cart] Product not found for key:", key);
      }
      return null;
    }
    return add(p, qty);
  }

  function addByEcwidId(ecwidId, qty) {
    var p = findProductByEcwidId(ecwidId);
    if (!p) {
      console.warn("[pixy-cart] Product not found for ecwidId:", ecwidId);
      return null;
    }
    return add(p, qty);
  }

  function remove(key) {
    save(load().filter(function (i) { return i.key !== key; }));
  }

  function setQty(key, qty) {
    qty = parseInt(qty, 10) || 0;
    if (qty <= 0) { remove(key); return; }
    var items = load();
    for (var i = 0; i < items.length; i++) {
      if (items[i].key === key) { items[i].qty = qty; break; }
    }
    save(items);
  }

  function clear() { save([]); }

  // ── Public API ───────────────────────────────────────────────────
  window.PIXY_CART = {
    add:            add,
    addByKey:       addByKey,
    addByEcwidId:   addByEcwidId,
    remove:         remove,
    setQty:         setQty,
    getCart:        getCart,
    clear:          clear,
    open:           null,  // injected by cart.js
    close:          null   // injected by cart.js
  };

  // Emit initial badge update on load
  document.addEventListener("DOMContentLoaded", function () {
    emit("pixy:cart:change");
  });

})();
