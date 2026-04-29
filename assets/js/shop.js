/*!
 * assets/js/shop.js — Pixy Dust Seasoning
 * Single rendering owner for all product cards and carousels.
 * Covers: shop.html, gifting.html, juniors.html, and any page with [data-category] carousels.
 * Depends on window.PIXY (exposed by main.js before DOMContentLoaded).
 *
 * Sections:
 *   A. Shop cards      — enhance static HTML cards in shop.html
 *   B. Build card      — shared product card factory
 *   C. Collection carousels — data-category="..." wrappers (index.html, shop.html)
 *   D. Juniors cards   — mini-card placeholders
 *   E. Juniors carousels — jr-carousel-wrap wiring
 *   F. Gifting cards   — gift-media pouch placeholder fill
 */

(function () {
  "use strict";

  // Shorthand helpers via PIXY namespace
  function getProducts()             { return window.PIXY.getProducts(); }
  function getProductByKey(key)      { return window.PIXY.getProductByKey(key); }
  function rememberListingPage()     { window.PIXY.rememberListingPage(); }
  function decorateProductLink(a)    { window.PIXY.decorateProductLink(a); }
  function addToCart(id, qty)        { return window.PIXY.addToCart(id, qty); }
  function openEcwidCart()           { return window.PIXY.openEcwidCart(); }

  function getParam(name) {
    try { return new URLSearchParams(window.location.search).get(name); }
    catch (e) { return null; }
  }

  // ================================================================
  // A. SHOP CARDS (static HTML product cards in shop.html)
  // ================================================================
  function enhanceShopCards() {
    var grid = document.querySelector(".grid.products");
    if (!grid) return;

    var products = getProducts();
    if (!products || !products.length) return;

    var byKey = {};
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (p && p.key) byKey[p.key] = p;
    }

    var cards = grid.querySelectorAll("article.card.product[id]");
    for (var c = 0; c < cards.length; c++) {
      var card = cards[c];
      var prod = byKey[card.id];
      if (!prod) continue;

      var ph = card.querySelector(".pouch-placeholder");
      if (ph && prod.image) {
        ph.style.backgroundImage    = 'url("' + prod.image + '")';
        ph.style.backgroundRepeat   = "no-repeat";
        ph.style.backgroundPosition = "center";
        ph.style.backgroundSize     = "contain";
      }

      var cta = card.querySelector("a.btn.btn-primary");
      if (cta) cta.setAttribute("href", "product.html?key=" + encodeURIComponent(prod.key));
    }
  }

  // ================================================================
  // B. BUILD PRODUCT CARD
  // ================================================================
  function buildProductCard(p) {
    var card = document.createElement("article");
    card.className = "card product";
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", p.title || "View product");

    var href = "product.html?key=" + encodeURIComponent(p.key);

    function go() { rememberListingPage(); window.location.href = href; }

    card.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.closest && (t.closest("a") || t.closest("button"))) return;
      go();
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });

    var media = document.createElement("div");
    media.className = "product-media";

    var img = document.createElement("img");
    img.className = "pouch pouch-placeholder";
    img.alt = p.title || "";
    img.loading = "lazy";
    img.src = p.image || "assets/images/logo-pixy-gold.png";
    img.onerror = function () { this.src = "assets/images/logo-pixy-gold.png"; };
    media.appendChild(img);

    var h3 = document.createElement("h3");
    h3.className = "card-title";
    h3.textContent = p.title || "";

    var priceEl = null;
    if (p.price != null) {
      priceEl = document.createElement("p");
      priceEl.className = "card-price";
      priceEl.textContent = "$" + Number(p.price).toFixed(2);
      if (p.freeShipping) {
        var badge = document.createElement("span");
        badge.className = "card-free-ship";
        badge.textContent = " — Free Shipping";
        priceEl.appendChild(badge);
      }
    }

    var blurb = document.createElement("p");
    blurb.className = "muted";
    blurb.textContent = p.blurb || p.story || "";

    var actions = document.createElement("div");
    actions.className = "product-actions";

    var details = document.createElement("a");
    details.className = "btn";
    details.href = href;
    details.textContent = "View Details";
    decorateProductLink(details);
    actions.appendChild(details);

    if (p.key) {
      var add = document.createElement("button");
      add.type = "button";
      add.className = "btn btn-secondary";
      add.textContent = "Add to Cart";
      (function(pkey) {
        add.addEventListener("click", function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          if (window.PIXY_CART && typeof window.PIXY_CART.addByKey === "function") {
            window.PIXY_CART.addByKey(pkey, 1);
            if (typeof window.PIXY_CART.open === "function") window.PIXY_CART.open();
          }
        });
      })(p.key);
      actions.appendChild(add);
    }

    card.appendChild(media);
    card.appendChild(h3);
    if (priceEl) card.appendChild(priceEl);
    if (blurb.textContent) card.appendChild(blurb);
    card.appendChild(actions);
    return card;
  }

  // ================================================================
  // C. COLLECTION CAROUSELS (data-category="..." wrappers)
  // ================================================================
  function fillCarouselWrap(wrap) {
    if (!wrap) return;
    var category = wrap.getAttribute("data-category");
    var track    = wrap.querySelector("[data-carousel-track]");
    if (!category || !track) return;

    var products = getProducts();
    if (!products || !products.length) return;

    var list = [];
    for (var i = 0; i < products.length; i++) {
      if (products[i] && products[i].category === category) list.push(products[i]);
    }

    track.innerHTML = "";
    for (var j = 0; j < list.length; j++) track.appendChild(buildProductCard(list[j]));

    var prev = wrap.querySelector("[data-carousel-prev]");
    var next = wrap.querySelector("[data-carousel-next]");
    var scrolling = false;
    function scroll(dir) {
      if (scrolling) return;
      var first = track.querySelector(".card");
      if (!first) return;
      // Measure exact card width + gap to snap to card boundaries
      var cardW = Math.round(first.getBoundingClientRect().width);
      var gap   = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap) || 16;
      var step  = cardW + gap;
      if (step < 10) return;
      var currentCard = Math.round(track.scrollLeft / step);
      var targetPos   = Math.max(0, (currentCard + dir) * step);
      scrolling = true;
      track.scrollTo({ left: targetPos, behavior: "smooth" });
      // Release lock after smooth scroll completes (~400ms)
      setTimeout(function () { scrolling = false; }, 420);
    }
    if (prev) prev.addEventListener("click", function () { scroll(-1); });
    if (next) next.addEventListener("click", function () { scroll(1); });

    var viewAll = wrap.querySelector("[data-carousel-viewall]");
    if (viewAll) viewAll.addEventListener("click", function () {
      window.location.href = "shop.html?view=" + encodeURIComponent(category);
    });
  }

  function cssEscape(s) {
    try { return CSS && CSS.escape ? CSS.escape(String(s)) : String(s).replace(/"/g, '\\"'); }
    catch (e) { return String(s).replace(/"/g, '\\"'); }
  }

  function enhanceCollectionCarousels() {
    var wraps = document.querySelectorAll(".carousel-wrap[data-category]");
    for (var i = 0; i < wraps.length; i++) fillCarouselWrap(wraps[i]);

    var view = getParam("view");
    if (view) {
      var target = document.querySelector('[data-view-section="' + cssEscape(view) + '"]') || document.getElementById(view);
      if (target && target.scrollIntoView) {
        setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
      }
    }
  }

  // ================================================================
  // D. JUNIORS CARDS
  // ================================================================
  function enhanceJuniorsCards() {
    if (!document.querySelector(".juniors-hero")) return;
    var products = getProducts();
    if (!products || !products.length) return;

    var bottles = [], books = [];
    for (var i = 0; i < products.length; i++) {
      if (!products[i]) continue;
      if (products[i].category === "Bottles") bottles.push(products[i]);
      if (products[i].category === "Books")   books.push(products[i]);
    }

    function fillPlaceholders(selector, list) {
      var phs = document.querySelectorAll(".juniors-card " + selector);
      for (var b = 0; b < phs.length; b++) {
        var ph = phs[b]; var p = list[b]; if (!p) continue;
        if (p.image) {
          ph.style.backgroundImage    = 'url("' + p.image + '")';
          ph.style.backgroundRepeat   = "no-repeat";
          ph.style.backgroundPosition = "center";
          ph.style.backgroundSize     = "contain";
        }
        var card = ph.closest(".mini-card"); if (!card) continue;
        var titleEl = card.querySelector(".mini-title");
        if (titleEl && p.title) titleEl.textContent = p.title;
        var cta = card.querySelector(".mini-cta");
        if (cta) cta.setAttribute("href", "product.html?key=" + encodeURIComponent(p.key));
      }
    }

    fillPlaceholders(".bottle-placeholder", bottles);
    fillPlaceholders(".book-placeholder",   books);
  }

  // ================================================================
  // E. JUNIORS CAROUSELS
  // ================================================================
  function enhanceJuniorsCarousels() {
    var products = getProducts();
    if (!products || !products.length) return;

    // Wire data-product-key nodes (used in juniors + gifting carousels)
    var nodes = document.querySelectorAll("[data-product-key]");
    for (var i = 0; i < nodes.length; i++) {
      (function (el) {
        var key = el.getAttribute("data-product-key");
        if (!key) return;
        var p = getProductByKey(key);
        if (!p) return;

        var media = el.querySelector("[data-media]");
        if (media && p.image) {
          media.innerHTML = "";
          var img = document.createElement("img");
          img.src = p.image;
          img.setAttribute("data-key", p.key);
          img.alt = p.title || "";
          img.loading = "lazy";
          img.addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation();
            rememberListingPage();
            window.location.href = "product.html?key=" + encodeURIComponent(p.key);
          });
          media.appendChild(img);
        }

        var titleEl = el.querySelector("[data-title]");
        if (titleEl) titleEl.textContent = p.title || "";

        var cta = el.querySelector("[data-cta]");
        if (cta && cta.tagName === "A") {
          cta.setAttribute("href", "product.html?key=" + encodeURIComponent(p.key));
          decorateProductLink(cta);
        }

        var addBtn = el.querySelector("[data-add-to-cart]");
        if (addBtn) {
          addBtn.addEventListener("click", function (ev) {
            ev.preventDefault(); ev.stopPropagation();
            if (window.PIXY_CART && typeof window.PIXY_CART.addByKey === "function") {
              window.PIXY_CART.addByKey(p.key, 1);
              if (typeof window.PIXY_CART.open === "function") window.PIXY_CART.open();
            } else if (window.PIXY_CART && typeof window.PIXY_CART.add === "function") {
              window.PIXY_CART.add(p, 1);
              if (typeof window.PIXY_CART.open === "function") window.PIXY_CART.open();
            }
          });
        }
      })(nodes[i]);
    }

    // Fill Bottles carousel track
    var track = document.querySelector('[aria-label="Classic bottles carousel"][data-jr-track]') ||
                document.querySelector('[aria-label="Classic bottles carousel"]');
    if (track) {
      track.innerHTML = "";
      var btls = [];
      for (var j = 0; j < products.length; j++) {
        if (products[j] && products[j].category === "Bottles") btls.push(products[j]);
      }
      for (var k = 0; k < btls.length; k++) {
        var p2 = btls[k];
        var c2 = document.createElement("article");
        c2.className = "mini-card";
        c2.setAttribute("data-product-key", p2.key);

        var m2 = document.createElement("div");
        m2.className = "bottle-placeholder";
        m2.setAttribute("data-media", "");
        var i2 = document.createElement("img");
        i2.src = p2.image || "assets/images/logo-pixy-gold.png";
        i2.alt = p2.title || ""; i2.loading = "lazy";
        m2.appendChild(i2);

        var t2 = document.createElement("div");
        t2.className = "mini-title"; t2.setAttribute("data-title", ""); t2.textContent = p2.title || "";

        var a2 = document.createElement("a");
        a2.className = "mini-cta"; a2.setAttribute("data-cta", "");
        a2.href = "product.html?key=" + encodeURIComponent(p2.key);
        a2.textContent = "View Details";
        decorateProductLink(a2);

        c2.appendChild(m2); c2.appendChild(t2); c2.appendChild(a2);
        track.appendChild(c2);
      }
    }

    // Wire jr carousel prev/next/viewall
    var jrWraps = document.querySelectorAll(".jr-carousel-wrap[data-jr-carousel]");
    for (var w = 0; w < jrWraps.length; w++) {
      (function (wrap) {
        var t = wrap.querySelector("[data-jr-track]");
        var prev = wrap.querySelector("[data-jr-prev]");
        var next = wrap.querySelector("[data-jr-next]");
        var viewAll = wrap.querySelector("[data-jr-viewall]");
        if (!t) return;

        function scrollBy(dir) {
          var first = t.querySelector(".mini-card");
          var cw = first ? first.getBoundingClientRect().width : 220;
          t.scrollBy({ left: dir * (cw + 14), behavior: "smooth" });
        }
        if (prev) prev.addEventListener("click", function () { scrollBy(-1); });
        if (next) next.addEventListener("click", function () { scrollBy(1); });
        if (viewAll) viewAll.addEventListener("click", function () {
          var cat = wrap.getAttribute("data-jr-category") || "Bottles";
          window.location.href = "shop.html?view=" + encodeURIComponent(cat);
        });
      })(jrWraps[w]);
    }
  }

  // ================================================================
  // F. GIFTING CARDS
  // ================================================================
  function enhanceGiftingCards() {
    var medias = document.querySelectorAll(".gift-media");
    if (!medias || !medias.length) return;

    var products = getProducts();
    if (!products || !products.length) return;

    var pouches = [];
    for (var i = 0; i < products.length; i++) {
      if (products[i] && products[i].category === "Pouches") pouches.push(products[i]);
    }
    if (!pouches.length) return;

    for (var m = 0; m < medias.length; m++) {
      var holders = medias[m].querySelectorAll(".pouch-placeholder");
      for (var h = 0; h < holders.length; h++) {
        var p = pouches[(m * 3 + h) % pouches.length];
        if (!p) continue;
        holders[h].style.backgroundImage    = 'url("' + (p.image || "assets/images/logo-pixy-gold.png") + '")';
        holders[h].style.backgroundRepeat   = "no-repeat";
        holders[h].style.backgroundPosition = "center";
        holders[h].style.backgroundSize     = "contain";
      }
    }
  }

  // ================================================================
  // BOOT
  // ================================================================
  document.addEventListener("DOMContentLoaded", function () {
    if (!window.PIXY || typeof window.PIXY.ensureProductsLoaded !== "function") return;

    window.PIXY.ensureProductsLoaded().then(function () {
      enhanceShopCards();
      enhanceCollectionCarousels();
      enhanceJuniorsCards();
      enhanceJuniorsCarousels();
      enhanceGiftingCards();
    });
  });

})();
