// ================================================================
// PIXY DUST — assets/js/main.js  v3.0
//
// Core module: products, Ecwid cart, cart buttons, product page,
// chat shell, horizontal swipe, hero carousel/dust/swipe,
// scroll-to, year, nav, subscribe, boot.
//
// Absorbed from hero.js (v3.0):
//   A. Hero carousel — pouch revolver (#heroStack)
//   B. Hero dust     — gold particle canvas (#heroDust)
//   C. Hero swipe    — touch gesture on #heroStage
//
// Shop/juniors/gifting → assets/js/shop.js (reads window.PIXY)
//
// SECTIONS:
//   1.  Products — load & lookup
//   2.  Ecwid — cart load, open, add to cart
//   3.  Cart buttons — wire all cart triggers
//   4.  Product page — add-to-cart wiring
//   5.  Chat shell — open/close/drag/persist
//   6.  Horizontal swipe — drag-to-scroll rows
//   7.  Scroll-to delegate — [data-scroll-to]
//   8.  Hero carousel — pouch revolver
//   9.  Hero dust canvas — gold particle system
//  10.  Hero swipe — touch on #heroStage
//  11.  Year — fill copyright year
//  12.  Nav — mobile hamburger toggle
//  13.  Subscribe form — VIP email
//  14.  Boot
// ================================================================

(function () {
  "use strict";

  // ── Constants ──────────────────────────────────────────────────
  var ECWID_STORE_ID  = 62406545;
  var LS_CHAT_OPEN    = "pixy_chat_open_v1";
  var LS_CHAT_POS     = "pixy_chat_pos_v1";

  // ================================================================
  // 1. PRODUCTS
  // ================================================================
  function getProducts() {
    return Array.isArray(window.PIXY_PRODUCTS) ? window.PIXY_PRODUCTS : null;
  }

  function ensureProductsLoaded() {
    return new Promise(function (resolve) {
      if (getProducts()) { resolve(true); return; }

      var existing = document.querySelector(
        'script[src$="assets/js/products.js"],script[src*="/assets/js/products.js"]'
      );
      if (existing) { waitForProducts(resolve); return; }

      var s = document.createElement("script");
      s.src = "assets/js/products.js";
      s.defer = true;
      s.onload = function () { waitForProducts(resolve); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);

      waitForProducts(resolve);
    });
  }

  function waitForProducts(resolve) {
    var start = Date.now();
    var t = setInterval(function () {
      if (getProducts())              { clearInterval(t); resolve(true);  return; }
      if (Date.now() - start > 6000) { clearInterval(t); resolve(false); }
    }, 80);
  }

  function getParam(name) {
    try { return new URLSearchParams(window.location.search).get(name); }
    catch (e) { return null; }
  }

  function getProductByKey(key) {
    var list = getProducts();
    if (!list) return null;
    key = String(key || "");
    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].key) === key) return list[i];
    }
    return null;
  }

  function rememberListingPage() {
    try {
      sessionStorage.setItem(
        "pixy_last_listing",
        window.location.pathname.replace(/^.*\//, "") +
          window.location.search +
          window.location.hash
      );
    } catch (e) {}
  }

  function decorateProductLink(a) {
    if (!a) return;
    a.addEventListener("click", rememberListingPage);
  }

  // ================================================================
  // 2. ECWID CART
  // ================================================================
  var _ecwidBootPromise = null;

  function ecwidCartOpenReady() {
    return !!(
      (window.xProductBrowser && typeof window.xProductBrowser.showShoppingCart === "function") ||
      (window.Ecwid && typeof window.Ecwid.openPage === "function")
    );
  }

  function ecwidAddReady() {
    return !!(
      window.Ecwid &&
      window.Ecwid.Cart &&
      typeof window.Ecwid.Cart.addProduct === "function"
    );
  }

  function ensureEcwidLoaded(mode) {
    mode = mode || "cart";
    var isReady = mode === "add" ? ecwidAddReady : ecwidCartOpenReady;
    if (isReady()) return Promise.resolve(true);

    if (_ecwidBootPromise) {
      return _ecwidBootPromise.then(function () { return waitForEcwidMode(mode); });
    }

    _ecwidBootPromise = new Promise(function (resolve, reject) {
      var settled = false;
      function done() { if (!settled) { settled = true; resolve(true); } }
      function fail(e) { if (!settled) { settled = true; reject(e || new Error("Ecwid failed")); } }

      function afterScript() {
        try {
          window.ec = window.ec || {};
          window.ec.storefront = window.ec.storefront || {};
          window.ec.storefront.enable_catalog = false;
        } catch (_) {}

        var hooked = false;
        try {
          if (window.Ecwid && window.Ecwid.OnAPILoaded && typeof window.Ecwid.OnAPILoaded.add === "function") {
            hooked = true;
            window.Ecwid.OnAPILoaded.add(function () {
              try { if (window.Ecwid && typeof window.Ecwid.init === "function") window.Ecwid.init(); } catch (_) {}
              done();
            });
          }
        } catch (_) {}

        var tries = 0;
        var t = setInterval(function () {
          tries++;
          try { if (window.Ecwid && typeof window.Ecwid.init === "function") window.Ecwid.init(); } catch (_) {}
          if (ecwidCartOpenReady() || ecwidAddReady()) { clearInterval(t); done(); return; }
          if (hooked && tries < 100) return;
          if (tries >= 100) { clearInterval(t); fail(new Error("Ecwid timeout")); }
        }, 120);
      }

      var existing =
        document.querySelector('script[data-ecwid="true"]') ||
        document.querySelector('script[src*="app.ecwid.com/script.js?' + ECWID_STORE_ID + '"]');

      if (!existing) {
        window.ec = window.ec || {};
        window.ec.storefront = window.ec.storefront || {};
        window.ec.storefront.enable_catalog = false;

        var s = document.createElement("script");
        s.src = "https://app.ecwid.com/script.js?" + ECWID_STORE_ID + "&data_platform=code&data_date=2026-01-01";
        s.async = true;
        s.charset = "utf-8";
        s.setAttribute("data-ecwid", "true");
        s.onload = afterScript;
        s.onerror = function () { fail(new Error("Ecwid script failed")); };
        document.head.appendChild(s);
      } else {
        afterScript();
      }
    });

    return _ecwidBootPromise.then(function () { return waitForEcwidMode(mode); });
  }

  function waitForEcwidMode(mode) {
    var isReady = mode === "add" ? ecwidAddReady : ecwidCartOpenReady;
    if (isReady()) return Promise.resolve(true);

    return new Promise(function (resolve, reject) {
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        try { if (window.Ecwid && typeof window.Ecwid.init === "function") window.Ecwid.init(); } catch (_) {}
        if (isReady())   { clearInterval(t); resolve(true); return; }
        if (tries >= 80) { clearInterval(t); reject(new Error("Ecwid mode timeout")); }
      }, 120);
    });
  }

  function openEcwidCart() {
    // Custom luxury cart drawer takes priority when registered by cart.js
    if (window.PIXY_CART && typeof window.PIXY_CART.open === "function") {
      window.PIXY_CART.open();
      return Promise.resolve(true);
    }
    return ensureEcwidLoaded("cart").then(function () {
      try { if (window.Ecwid && typeof window.Ecwid.init === "function") window.Ecwid.init(); } catch (_) {}
      if (window.xProductBrowser && typeof window.xProductBrowser.showShoppingCart === "function") {
        window.xProductBrowser.showShoppingCart(); return true;
      }
      if (window.Ecwid && typeof window.Ecwid.openPage === "function") {
        window.Ecwid.openPage("cart"); return true;
      }
      return false;
    }).catch(function () { return false; });
  }

  function addToCart(ecwidProductId, qty) {
    qty = qty || 1;
    var id = Number(ecwidProductId);
    if (!id || !isFinite(id)) return Promise.resolve(false);

    // Prefer pixy-cart (localStorage) over Ecwid
    if (window.PIXY_CART && typeof window.PIXY_CART.addByEcwidId === "function") {
      var result = window.PIXY_CART.addByEcwidId(id, qty);
      if (result !== null) {
        if (typeof window.PIXY_CART.open === "function") window.PIXY_CART.open();
        return Promise.resolve(true);
      }
    }

    return ensureEcwidLoaded("add").then(function () {
      return new Promise(function (resolve) {
        try {
          window.Ecwid.Cart.addProduct({
            id: id,
            quantity: qty,
            callback: function () {
              openEcwidCart().then(function () { resolve(true); }).catch(function () { resolve(true); });
            }
          });
          setTimeout(function () {
            openEcwidCart().then(function () { resolve(true); }).catch(function () { resolve(true); });
          }, 350);
        } catch (e) { resolve(false); }
      });
    }).catch(function () { return false; });
  }

  // ================================================================
  // 3. CART BUTTONS
  // ================================================================
  function setupOpenCartButtons() {
    var SEL = "#openCartBtn,#openCartInlineBtn,[data-open-cart],.cart-btn,a[href='#cart'],a[href='cart'],a[href='/cart']";

    function bind(el) {
      if (!el || el.getAttribute("data-cart-wired") === "1") return;
      el.setAttribute("data-cart-wired", "1");
      el.addEventListener("click", function (e) { e.preventDefault(); openEcwidCart(); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEcwidCart(); }
      });
    }

    bind(document.getElementById("openCartBtn"));
    bind(document.getElementById("openCartInlineBtn"));

    var els = document.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) bind(els[i]);

    // Delegate future elements (e.g. injected by CMS)
    if (document.documentElement.getAttribute("data-cart-delegated") === "1") return;
    document.documentElement.setAttribute("data-cart-delegated", "1");
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest(SEL) : null;
      if (!t || t.getAttribute("data-cart-wired") === "1") return;
      e.preventDefault(); e.stopPropagation();
      openEcwidCart();
    });
  }

  // ================================================================
  // window.PIXY — shared namespace for hero.js and shop.js
  // Exposed synchronously so script tags after main.js can use it.
  // ================================================================
  window.PIXY = {
    getProducts:          getProducts,
    getProductByKey:      getProductByKey,
    ensureProductsLoaded: ensureProductsLoaded,
    rememberListingPage:  rememberListingPage,
    decorateProductLink:  decorateProductLink,
    ensureEcwidLoaded:    ensureEcwidLoaded,
    openEcwidCart:        openEcwidCart,
    addToCart:            addToCart
  };

  // ================================================================
  // 4. PRODUCT PAGE — Add to Cart
  // ================================================================
  function wireProductAddToCart() {
    var btn = document.getElementById("addToCartBtn");
    if (!btn || btn.getAttribute("data-wired") === "1") return;

    var key = getParam("key");
    if (!key) return;

    var p = getProductByKey(key);
    if (!p) return;

    btn.setAttribute("data-wired", "1");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (p.ecwidProductId == null) return;
      addToCart(p.ecwidProductId, 1);
    });
  }

  // ================================================================
  // 5. CHAT SHELL
  // ================================================================
  function setupChatShell() {
    var openBtn = document.querySelector("[data-chat-open]");
    var chat    = document.querySelector("[data-chat]");
    if (!openBtn || !chat) return;

    var closeBtn = chat.querySelector("[data-chat-close]") || chat.querySelector(".chat-close");
    var handle   = chat.querySelector(".chat-head");

    var open = false;
    try { open = localStorage.getItem(LS_CHAT_OPEN) === "1"; } catch (e) {}
    setChatOpen(open);

    openBtn.addEventListener("click", function (e) { e.preventDefault(); setChatOpen(chat.hidden); });

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation(); setChatOpen(false);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !chat.hidden) setChatOpen(false);
    });

    document.addEventListener("mousedown", function (e) {
      if (chat.hidden) return;
      var t = e.target; if (!t) return;
      if (chat.contains(t) || openBtn.contains(t)) return;
      setChatOpen(false);
    });

    if (handle) enableChatDrag(chat, handle);

    function setChatOpen(isOpen) {
      chat.hidden = !isOpen;
      chat.style.display = isOpen ? "" : "none";
      openBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      chat.setAttribute("aria-hidden", isOpen ? "false" : "true");
      try { localStorage.setItem(LS_CHAT_OPEN, isOpen ? "1" : "0"); } catch (e) {}
      if (isOpen) restoreChatPos(chat);
    }
  }

  function enableChatDrag(box, handle) {
    handle.style.cursor = "move";
    var dragging = false, sx = 0, sy = 0, sl = 0, st = 0;

    function pt(e) {
      return e.touches && e.touches[0]
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };
    }

    function onDown(e) {
      var cl = e.target && e.target.closest ? e.target.closest("[data-chat-close],.chat-close") : null;
      if (cl) return;
      dragging = true;
      var r = box.getBoundingClientRect();
      box.style.position = "fixed"; box.style.left = r.left + "px"; box.style.top = r.top + "px";
      box.style.right = "auto"; box.style.bottom = "auto";
      var p = pt(e); sx = p.x; sy = p.y; sl = r.left; st = r.top;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
    }

    function onMove(e) {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      var p = pt(e), pad = 10;
      box.style.left = Math.min(Math.max(sl + (p.x - sx), pad), innerWidth  - box.offsetWidth  - pad) + "px";
      box.style.top  = Math.min(Math.max(st + (p.y - sy), pad), innerHeight - box.offsetHeight - pad) + "px";
    }

    function onUp() {
      if (!dragging) return; dragging = false;
      document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onUp);
      try {
        var r = box.getBoundingClientRect();
        localStorage.setItem(LS_CHAT_POS, JSON.stringify({ left: r.left, top: r.top }));
      } catch (e) {}
    }

    handle.addEventListener("mousedown",  onDown);
    handle.addEventListener("touchstart", onDown, { passive: true });
  }

  function restoreChatPos(box) {
    try {
      var raw = localStorage.getItem(LS_CHAT_POS);
      if (!raw) return;
      var pos = JSON.parse(raw);
      if (!pos) return;
      box.style.position = "fixed";
      box.style.left   = Math.max(10, Number(pos.left) || 10) + "px";
      box.style.top    = Math.max(10, Number(pos.top)  || 10) + "px";
      box.style.right  = "auto"; box.style.bottom = "auto";
    } catch (e) {}
  }

  // ================================================================
  // 6. HORIZONTAL SWIPE (drag-to-scroll rows)
  // ================================================================
  function enableSwipeOnHorizontalScroll() {
    var SEL = [
      ".pouch-carousel", ".spices-row",
      ".junior-bottles-row", ".juniors-bottles-row",
      ".horizontal-scroll", "[data-swipe-scroll]"
    ];

    var els = [];
    for (var i = 0; i < SEL.length; i++) {
      var found = document.querySelectorAll(SEL[i]);
      for (var j = 0; j < found.length; j++) els.push(found[j]);
    }

    for (var k = 0; k < els.length; k++) {
      var el = els[k];
      if (!el || el.nodeType !== 1) continue;
      if (el.getAttribute("data-swipe-wired") === "1") continue;
      if (!isHScrollable(el)) continue;
      el.setAttribute("data-swipe-wired", "1");
      attachDrag(el);
    }
  }

  function isHScrollable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (el.scrollWidth <= el.clientWidth + 5) return false;
    var ox = window.getComputedStyle(el).overflowX;
    return ox === "auto" || ox === "scroll";
  }

  function attachDrag(el) {
    var down = false, startX = 0, startLeft = 0;

    function ignore(t) { return !!(t && t.closest && t.closest("a,button,input,textarea,select,label")); }
    function cx(e) { return e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX; }

    el.addEventListener("touchstart", function (e) {
      if (ignore(e.target) || !e.touches || e.touches.length !== 1) return;
      down = true; startX = cx(e); startLeft = el.scrollLeft;
    }, { passive: true });

    el.addEventListener("touchmove", function (e) {
      if (!down) return;
      el.scrollLeft = startLeft - (cx(e) - startX);
    }, { passive: true });

    el.addEventListener("touchend", function () { down = false; }, { passive: true });

    el.addEventListener("mousedown", function (e) {
      if (ignore(e.target) || e.button !== 0) return;
      down = true; startX = e.clientX; startLeft = el.scrollLeft;

      function onMove(ev) { if (down) el.scrollLeft = startLeft - (ev.clientX - startX); }
      function onUp()    { down = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  // ================================================================
  // 7. SCROLL-TO DELEGATE — [data-scroll-to="section-id"]
  // ================================================================
  function setupScrollToDelegate() {
    if (document.documentElement.getAttribute("data-scroll-delegated") === "1") return;
    document.documentElement.setAttribute("data-scroll-delegated", "1");

    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("[data-scroll-to]") : null;
      if (!el) return;
      var id = el.getAttribute("data-scroll-to");
      if (!id) return;
      e.preventDefault();
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ================================================================
  // 8. HERO CAROUSEL (index.html — pouch revolver)
  // ================================================================
  function setupHeroCarousel() {
    var stack = document.getElementById("heroStack");
    var prev  = document.getElementById("heroPrev");
    var next  = document.getElementById("heroNext");
    var name  = document.getElementById("heroName");
    var cta   = document.getElementById("heroCta");
    if (!stack) return;

    var products = window.PIXY.getProducts();
    if (!products || !products.length) return;

    function norm(s) { return String(s || "").trim().toLowerCase(); }

    var pouches = [];
    for (var i = 0; i < products.length; i++) {
      if (products[i] && norm(products[i].category) === "pouches") pouches.push(products[i]);
    }
    if (!pouches.length) return;

    stack.innerHTML = "";
    var imgs = [];
    var idx  = 0;

    function safeIdx(n, len) { return ((n % len) + len) % len; }

    // Lazy-load a single image by promoting data-src → src
    function loadImgAt(k) {
      var img = imgs[k];
      if (!img || img.src || !img.dataset.src) return;
      img.src = img.dataset.src;
    }

    function apply() {
      if (!imgs.length) return;
      var len = imgs.length;
      for (var k = 0; k < len; k++) imgs[k].className = "pos-hidden";

      imgs[safeIdx(idx,     len)].className = "pos-active";
      if (len > 1) imgs[safeIdx(idx - 1, len)].className = "pos-prev";
      if (len > 2) imgs[safeIdx(idx + 1, len)].className = "pos-next";
      if (len > 3) imgs[safeIdx(idx - 2, len)].className = "pos-prev2";
      if (len > 4) imgs[safeIdx(idx + 2, len)].className = "pos-next2";

      // Eagerly load: active + immediate neighbors only
      loadImgAt(safeIdx(idx, len));
      if (len > 1) loadImgAt(safeIdx(idx - 1, len));
      if (len > 2) loadImgAt(safeIdx(idx + 1, len));

      var p = pouches[safeIdx(idx, len)];
      if (name) name.textContent = p && p.title ? p.title : "";
      if (cta && p && p.key) cta.setAttribute("href", "product.html?key=" + encodeURIComponent(p.key));

      var priceEl = document.getElementById("heroPrice");
      if (priceEl) priceEl.textContent = (p && p.price != null) ? "$" + Number(p.price).toFixed(2) : "";

      var addCartBtn = document.getElementById("heroAddCart");
      if (addCartBtn) {
        if (p && p.ecwidProductId) {
          addCartBtn.style.display = "";
          (function (pid) {
            addCartBtn.onclick = function () { addToCart(pid, 1); };
          })(p.ecwidProductId);
        } else {
          addCartBtn.style.display = "none";
        }
      }
    }

    for (var j = 0; j < pouches.length; j++) {
      (function (p) {
        var img = document.createElement("img");
        // Store src in data-src — do NOT set .src yet (prevents mass parallel downloads)
        img.dataset.src = (p.image && String(p.image).trim()) ? String(p.image).trim() : "assets/images/logo-pixy-gold.png";
        img.alt = p.title || "";
        img.decoding = "async";
        img.className = "pos-hidden";
        img.dataset.key = p.key || "";

        img.onerror = function () {
          if (img.dataset.fb === "1") return;
          img.dataset.fb = "1";
          img.src = "assets/images/logo-pixy-gold.png";
        };

        img.addEventListener("click", function (e) {
          if (!this.classList || !this.classList.contains("pos-active")) return;
          e.preventDefault(); e.stopPropagation();
          var key = this.dataset.key; if (!key) return;
          window.PIXY.rememberListingPage();
          window.location.href = "product.html?key=" + encodeURIComponent(key);
        });

        stack.appendChild(img);
        imgs.push(img);
      })(pouches[j]);
    }

    if (prev) prev.addEventListener("click", function () { idx = (idx - 1 + imgs.length) % imgs.length; apply(); });
    if (next) next.addEventListener("click", function () { idx = (idx + 1) % imgs.length; apply(); });

    // Show active image immediately; defer the rest until browser is idle
    apply();

    var idleLoadAll = function () {
      for (var ii = 0; ii < imgs.length; ii++) loadImgAt(ii);
    };
    if (window.requestIdleCallback) {
      requestIdleCallback(idleLoadAll, { timeout: 2000 });
    } else {
      setTimeout(idleLoadAll, 1500);
    }
  }

  // ================================================================
  // 9. HERO DUST CANVAS (gold particle system)
  // ================================================================
  function setupHeroDust() {
    var canvas = document.getElementById("heroDust");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mobile: fewer particles + throttled frame rate
    var isMobile = window.innerWidth < 768;
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var W = 0, H = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      canvas.width  = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 100);
    });

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function spawn(init) {
      var sparkle = Math.random() < 0.08; // 8% chance of bright sparkle
      return {
        x: rnd(0, W), y: init ? rnd(0, H) : -rnd(10, 140),
        r:  sparkle ? rnd(1.8, 3.2) : rnd(0.8, 2.4),
        vy: rnd(.28, 1.10), vx: rnd(-.42, .42),
        a:  sparkle ? rnd(.55, .88) : rnd(.10, .42),
        tw: rnd(.6, 2.0), t: rnd(0, Math.PI * 2),
        sparkle: sparkle
      };
    }

    // Mobile: cap at 40 particles; desktop: adaptive up to 220
    var maxN = isMobile ? 40 : 220;
    var minN = isMobile ? 20 : 90;
    var N = Math.min(maxN, Math.max(minN, Math.floor((W * H) / 8500)));
    var parts = [];
    for (var pi = 0; pi < N; pi++) parts.push(spawn(true));

    // Mobile: throttle to ~20fps to save battery/CPU; desktop: full 60fps
    var frameInterval = isMobile ? (1000 / 20) : 0;
    var lastFrameTime = 0;
    var rafId;

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      // Skip frame if we haven't reached the target interval (mobile throttle)
      if (frameInterval > 0 && now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;

      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.t += .018 * p.tw;
        p.x += p.vx + Math.sin(p.t) * .22;
        p.y += p.vy;
        if (p.y > H + 24 || p.x < -50 || p.x > W + 50) { parts[i] = spawn(false); continue; }
        ctx.beginPath();
        ctx.globalAlpha = p.a;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        // Sparkle particles are lighter/whiter; regular particles are gold
        ctx.fillStyle = p.sparkle ? "#f5e8c0" : "#d8b35a";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(rafId); } else { rafId = requestAnimationFrame(tick); }
    });

    rafId = requestAnimationFrame(tick);
  }

  // ================================================================
  // 10. HERO SWIPE (touch on #heroStage)
  // ================================================================
  function setupHeroSwipe() {
    var stage = document.getElementById("heroStage");
    var prev  = document.getElementById("heroPrev");
    var next  = document.getElementById("heroNext");
    if (!stage || !prev || !next) return;
    if (stage.getAttribute("data-swipe-wired") === "1") return;
    stage.setAttribute("data-swipe-wired", "1");

    var startX = 0, startY = 0, tracking = false, moved = false;

    function ignore(t) { return !!(t && t.closest && t.closest("button,a,input,textarea,select")); }

    stage.addEventListener("touchstart", function (e) {
      if (ignore(e.target) || !e.touches || e.touches.length !== 1) return;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      tracking = true; moved = false;
    }, { passive: true });

    stage.addEventListener("touchmove", function (e) {
      if (!tracking) return;
      var dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) moved = true;
    }, { passive: true });

    stage.addEventListener("touchend", function (e) {
      if (!tracking) return; tracking = false; if (!moved) return;
      var end = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : null;
      if (!end) return;
      var dx = end.clientX - startX;
      var threshold = Math.max(60, Math.floor(stage.clientWidth * .12));
      if (dx > threshold) prev.click();
      else if (dx < -threshold) next.click();
    }, { passive: true });
  }

  // ================================================================
  // 11. YEAR
  // ================================================================
  function setupYear() {
    var y = String(new Date().getFullYear());
    ["pd-year", "year"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = y;
    });
  }

  // ================================================================
  // 12. NAV — mobile hamburger (site-header pages)
  // ================================================================
  function setupMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav    = document.querySelector(".main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");

      // Animate hamburger bars
      var spans = toggle.querySelectorAll("span");
      if (open) {
        if (spans[0]) spans[0].style.transform = "translateY(7px) rotate(45deg)";
        if (spans[1]) { spans[1].style.opacity = "0"; spans[1].style.transform = "scaleX(0)"; }
        if (spans[2]) spans[2].style.transform = "translateY(-7px) rotate(-45deg)";
      } else {
        if (spans[0]) spans[0].style.transform = "";
        if (spans[1]) { spans[1].style.opacity = ""; spans[1].style.transform = ""; }
        if (spans[2]) spans[2].style.transform = "";
      }
    });

    // Close on link click
    var links = nav.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        nav.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    }

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("nav-open")) {
        nav.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // Close when clicking outside
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("nav-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      nav.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  // ================================================================
  // 13. SUBSCRIBE FORM
  // ================================================================
  function setupSubscribeForm() {
    var form = document.querySelector("[data-subscribe-form]");
    var note = document.getElementById("subscribe-note");
    var btn  = form ? form.querySelector('button[type="submit"]') : null;
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"],[name="email"]');
      var email = input ? input.value.trim() : "";
      if (!email) return;

      if (btn) { btn.disabled = true; btn.textContent = "Subscribing\u2026"; }

      var data = new URLSearchParams();
      data.set("form-name", form.getAttribute("name") || "subscribe");
      data.set("email", email);

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString()
      })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            if (note) {
              note.textContent = "You\u2019re on the list. Check your inbox for your 10% off code.";
              note.style.color = "var(--gold)";
              note.style.display = "";
            }
            if (btn) { btn.disabled = false; btn.textContent = "Subscribe"; }
          } else {
            if (note) {
              note.textContent = "Something went wrong. Please try again.";
              note.style.color = "#e07070";
              note.style.display = "";
            }
            if (btn) { btn.disabled = false; btn.textContent = "Subscribe"; }
          }
        })
        .catch(function () {
          if (note) {
            note.textContent = "Something went wrong. Please try again.";
            note.style.color = "#e07070";
            note.style.display = "";
          }
          if (btn) { btn.disabled = false; btn.textContent = "Subscribe"; }
        });
    });
  }

  // ================================================================
  // 14. BOOT
  // ================================================================
  document.addEventListener("DOMContentLoaded", function () {
    setupYear();
    setupOpenCartButtons();
    setupChatShell();
    setupMobileNav();
    setupSubscribeForm();
    setupScrollToDelegate();

    // Preload Ecwid so cart opens instantly
    ensureEcwidLoaded("cart").catch(function () {});

    ensureProductsLoaded().then(function () {
      wireProductAddToCart();
      enableSwipeOnHorizontalScroll();

      // Hero (index.html only — safe to call on every page, guards via element check)
      setupHeroCarousel();
      setupHeroDust();
      setupHeroSwipe();
    });
    // shop.js runs its own DOMContentLoaded + ensureProductsLoaded()
  });

})();
