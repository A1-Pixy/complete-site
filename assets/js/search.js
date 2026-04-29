/*!
 * assets/js/search.js — Pixy Dust Site Search  v1.0
 *
 * Sources (merged at search time, not at page load):
 *   window.PIXY_PRODUCT_CATALOG  — chatbot catalog (tags, bestFor, rich metadata)
 *   window.PIXY_PRODUCTS         — full product list (prices)
 *   STATIC_INDEX                 — pages, recipes, FAQ, help, policies (defined below)
 *
 * Opens on #openSearchBtn click or Ctrl/Cmd+K.
 * Injects overlay into <body> on first open (lazy).
 * No external dependencies.
 */

(function () {
  "use strict";

  // ================================================================
  // STATIC INDEX — pages, recipes, FAQ, help, policies
  // ================================================================
  var STATIC_INDEX = [

    // ── Pages ──────────────────────────────────────────────────────
    { type: "Page", title: "Shop",               url: "shop.html",          description: "Browse all signature blends, bottles, gift sets, spices, grills, and subscriptions.",             keywords: ["shop","buy","products","blends","pouches","bottles","gift sets","spices","grills","store","purchase","order","browse","collection"] },
    { type: "Page", title: "Gifting",             url: "gifting.html",       description: "Gift sets, subscriptions, and bundle ideas for food lovers and home cooks.",                      keywords: ["gift","gifting","present","birthday","holiday","gift set","subscription","bundle","christmas","hanukkah","mother","father","thanksgiving","surprise"] },
    { type: "Page", title: "Kitchen Table",       url: "kitchen-table.html", description: "The Pixy Dust community kitchen hub — cooking tips, pairings, and inspiration.",                 keywords: ["kitchen","table","cooking","tips","community","inspiration","pairings","home cook","hub","club"] },
    { type: "Page", title: "Contact Us",          url: "contact.html",       description: "Reach Pixy Dust Seasoning at support@pixydustseasoning.com — we respond within 1 business day.", keywords: ["contact","email","support","help","reach us","customer service","support@pixydustseasoning.com","message","phone","get in touch"] },
    { type: "Page", title: "About",               url: "about.html",         description: "The story behind Pixy Dust Seasoning — brand mission, values, and origin.",                     keywords: ["about","story","brand","mission","who","pixy dust","history","founder","our story","vision"] },
    { type: "Page", title: "Juniors",             url: "juniors.html",       description: "Pixy Dust Juniors — kids cooking program, storybooks, and family-friendly blends.",               keywords: ["juniors","kids","children","family","book","story","cooking with kids","young chefs","youth","junior chef","ages","program"] },
    { type: "Page", title: "Wholesale",           url: "wholesale.html",     description: "Restaurant, retailer, and hospitality wholesale program. Apply for bulk and private label pricing.", keywords: ["wholesale","bulk","restaurant","retailer","retail","hospitality","private label","b2b","partnership","volume","apply","business","distributor"] },
    { type: "Page", title: "Recipes",             url: "recipes.html",       description: "Cooking recipes built around Pixy Dust signature blends — weeknight dinners to premium hosting.",  keywords: ["recipes","cooking","cook","how to","directions","ideas","meal","dinner","grill","instruction","technique"] },
    { type: "Page", title: "Gallery",             url: "gallery.html",       description: "Photo gallery of Pixy Dust products and cooking inspiration.",                                    keywords: ["gallery","photos","pictures","images","inspiration","looks","visual","see"] },
    { type: "Page", title: "FAQ",                 url: "faq.html",           description: "Frequently asked questions about products, shipping, returns, and wholesale.",                     keywords: ["faq","questions","help","answers","frequently asked","how","what","why","common","information"] },
    { type: "Page", title: "Shipping",            url: "shipping.html",      description: "Shipping times and free shipping details. Standard 5–7 days, expedited 2–3 days. Free on gift sets and orders over $75.", keywords: ["shipping","delivery","ship","tracking","how long","days","free shipping","expedited","overnight","order","processing","usps","ups","fedex"] },
    { type: "Page", title: "Returns & Exchanges", url: "returns.html",       description: "30-day returns on unopened items. Damaged orders replaced at no charge.",                         keywords: ["returns","exchanges","refund","policy","return","damaged","broken","unopened","30 days","money back","exchange"] },
    { type: "Page", title: "Privacy Policy",      url: "privacy.html",       description: "How Pixy Dust collects, uses, and protects your personal information.",                           keywords: ["privacy","policy","data","personal information","gdpr","rights","protect","information"] },
    { type: "Page", title: "Cookie Policy",       url: "cookies.html",       description: "How Pixy Dust uses cookies and similar technologies on our site.",                                keywords: ["cookies","cookie policy","tracking","browser","consent","localstorage","data"] },
    { type: "Page", title: "Cart",                url: "cart.html",          description: "Your shopping cart — review items and proceed to checkout.",                                       keywords: ["cart","checkout","order","buy","purchase","bag","shopping cart","items","proceed"] },
    { type: "Page", title: "Home",                url: "index.html",         description: "Pixy Dust Seasoning — luxury gourmet blends. Let's sprinkle a little magic.",                     keywords: ["home","pixy dust","seasoning","luxury","gourmet","blends","main page","homepage"] },

    // ── Recipes ────────────────────────────────────────────────────
    { type: "Recipe", title: "Seared Ribeye with Herb Butter",  url: "recipes.html", description: "Coat generously with Chop House Steak before a cast-iron sear. Rest, slice, finish with compound butter.", keywords: ["ribeye","steak","sear","cast iron","herb butter","beef","grill","chop house","rib eye","t bone","steakhouse"] },
    { type: "Recipe", title: "Wok-Seared Shrimp & Noodles",    url: "recipes.html", description: "High heat, quick toss. Season shrimp with Asian Stir Fry, deglaze with soy, finish with sesame oil.",      keywords: ["shrimp","noodles","wok","asian","stir fry","seafood","lo mein","sesame","umami","quick"] },
    { type: "Recipe", title: "Jerk Chicken Thighs",             url: "recipes.html", description: "Marinate overnight with Jerk blend, citrus, and oil. Grill over medium-high heat until caramelized.",       keywords: ["jerk","chicken","thighs","grill","jamaican","marinade","caribbean","wings","drumsticks","island"] },
    { type: "Recipe", title: "Cast-Iron Steak Fajitas",         url: "recipes.html", description: "Season skirt steak with Fajita blend. Sear fast, slice thin. Char peppers and onions in the same pan.",    keywords: ["fajita","steak","skirt steak","peppers","onions","cast iron","mexican","taco","tex-mex","skillet"] },
    { type: "Recipe", title: "Low & Slow Pork Ribs",            url: "recipes.html", description: "Dry rub generously with Smoke BBQ the night before. Cook at 225°F for 5–6 hours. Finish with a glaze.",     keywords: ["ribs","pork","bbq","smoke","low and slow","brisket","pulled pork","competition","smoker","225","bark"] },
    { type: "Recipe", title: "Roasted Garlic Vegetables",       url: "recipes.html", description: "Toss seasonal vegetables in olive oil and Garlic Pepper. Roast at 400°F until edges caramelize.",           keywords: ["vegetables","garlic","roasted","veggies","vegan","broccoli","asparagus","potato","oven","sides"] },

    // ── Help — FAQ, policies, support ─────────────────────────────
    { type: "Help", title: "Shipping Times",           url: "shipping.html",  description: "Standard shipping: 5–7 business days. Expedited: 2–3 days. Overnight available. Orders ship Mon–Fri, excluding holidays.", keywords: ["shipping","delivery","how long","days","standard","expedited","overnight","time","when","arrival","estimated"] },
    { type: "Help", title: "Free Shipping",            url: "shipping.html",  description: "All gift sets ship free with no minimum required. Orders over $75 qualify for free standard shipping, applied automatically at checkout.", keywords: ["free shipping","gift set","over $75","no minimum","free","complimentary","free delivery"] },
    { type: "Help", title: "Order Tracking",           url: "shipping.html",  description: "A tracking number is emailed as soon as your order ships. Check spam if you didn't receive it.", keywords: ["track","tracking","track order","tracking number","where is my order","shipping status","email","spam"] },
    { type: "Help", title: "Return Policy",            url: "returns.html",   description: "Returns accepted within 30 days of delivery on unopened items. Damaged items fully refunded regardless of condition.", keywords: ["return","30 days","unopened","policy","refund","exchange","damaged","broken","return policy"] },
    { type: "Help", title: "How to Start a Return",   url: "returns.html",   description: "Email support@pixydustseasoning.com with your order number. We respond within 1–2 business days with next steps and a return label.", keywords: ["return","how to return","start return","refund request","exchange","order number","return label"] },
    { type: "Help", title: "Refund Timeline",          url: "returns.html",   description: "Approved refunds are processed to the original payment method within 5–7 business days of receiving the return.", keywords: ["refund","money back","how long refund","payment","5-7 days","credit card","processed","refund timeline"] },
    { type: "Help", title: "Wholesale & Bulk Orders",  url: "wholesale.html", description: "Pixy Dust works with restaurants, retailers, and hospitality programs. Apply on the Wholesale page. 1 lb, 5 lb, and private label available.", keywords: ["wholesale","bulk","restaurant","retailer","b2b","hospitality","private label","volume","apply","partnership","distributor","menu"] },
    { type: "Help", title: "Contact & Support",        url: "contact.html",   description: "Email support@pixydustseasoning.com — we respond within 1 business day. Or use the contact form.", keywords: ["contact","email","support","help","customer service","reach us","support@pixydustseasoning.com","respond","1 business day"] },
    { type: "Help", title: "Gluten-Free Blends",       url: "faq.html",       description: "Most Pixy Dust blends are naturally gluten-free. Check the individual product page for full ingredient info.", keywords: ["gluten free","gluten","celiac","allergy","gluten-free","ingredients","allergen","wheat"] },
    { type: "Help", title: "Sugar-Free Option",        url: "faq.html",       description: "Sugar Free All Purpose is made without added sugar, sweetened with monk fruit — great for keto and low-carb cooking.", keywords: ["sugar free","sugar-free","keto","vegan","low carb","monk fruit","no sugar","plant based","no carbs"] },
    { type: "Help", title: "Shelf Life & Storage",     url: "faq.html",       description: "Pouches and bottles are shelf-stable for 18–24 months. Store in a cool, dry place. Best before date is printed on each package.", keywords: ["shelf life","expire","expiration","how long does it last","fresh","best before","storage","store","pantry"] },
    { type: "Help", title: "Subscription Options",     url: "gifting.html",   description: "Monthly, 3-month, and 6-month subscriptions available. Perfect as a gift or for yourself.", keywords: ["subscription","subscribe","monthly","recurring","3 month","6 month","gift subscription","auto ship"] },
    { type: "Help", title: "Kids & Juniors Program",   url: "juniors.html",   description: "Pixy Dust Juniors features kid-friendly blends, storybooks, and cooking kits for young chefs.", keywords: ["kids","children","juniors","family","young cooks","storybook","book","gift for kids","ages","junior chef","child"] },
    { type: "Help", title: "Damaged Order Replacement", url: "returns.html",  description: "If your order arrived damaged, photograph the packaging and contact us. We send a replacement at no charge.", keywords: ["damaged","broken","arrived damaged","replacement","no charge","package","smashed","cracked"] },
    { type: "Help", title: "Brand Story",              url: "about.html",     description: "Pixy Dust Seasoning creates luxury gourmet blends inspired by global travels and Caribbean roots.", keywords: ["brand","story","who is pixy dust","about","origin","founder","mission","jamaican","luxury","gourmet"] }
  ];

  // ================================================================
  // PRODUCT INDEX — built from PIXY_PRODUCT_CATALOG + PIXY_PRODUCTS
  // ================================================================
  function buildProductIndex() {
    var entries = [];

    // Price lookup from PIXY_PRODUCTS (most accurate source for prices)
    var priceLookup = {};
    var raw = window.PIXY_PRODUCTS;
    if (Array.isArray(raw)) {
      for (var i = 0; i < raw.length; i++) {
        var p = raw[i];
        if (p && p.key && p.price != null) {
          priceLookup[p.key] = "$" + parseFloat(p.price).toFixed(2);
        }
      }
    }

    // Rich entries from PIXY_PRODUCT_CATALOG (has tags, bestFor, flavor)
    var catalog = window.PIXY_PRODUCT_CATALOG;
    if (Array.isArray(catalog) && catalog.length) {
      for (var j = 0; j < catalog.length; j++) {
        var c = catalog[j];
        if (!c || !c.id) continue;

        var kws = [].concat(c.tags || [], c.bestFor || []);
        if (c.flavor) kws.push(c.flavor);
        if (c.name)   kws.push(c.name.toLowerCase());
        if (c.id)     kws.push(c.id.replace(/-/g, " "));

        entries.push({
          type:        "Product",
          title:       c.name  || c.id,
          url:         c.url   || ("product.html?key=" + c.id),
          description: c.description || c.flavor || "",
          keywords:    kws,
          category:    c.category,
          price:       priceLookup[c.id] || null
        });
      }
      return entries;
    }

    // Fallback — PIXY_PRODUCTS only (less rich, but functional)
    if (Array.isArray(raw)) {
      for (var k = 0; k < raw.length; k++) {
        var prod = raw[k];
        if (!prod || !prod.key) continue;
        entries.push({
          type:        "Product",
          title:       prod.title,
          url:         "product.html?key=" + prod.key,
          description: prod.blurb || "",
          keywords:    [prod.key.replace(/-/g, " "), (prod.category || "").toLowerCase()],
          category:    prod.category,
          price:       priceLookup[prod.key] || null
        });
      }
    }

    return entries;
  }

  var _index = null;

  function getIndex() {
    if (_index) return _index;
    _index = STATIC_INDEX.concat(buildProductIndex());
    return _index;
  }

  // ================================================================
  // SCORING
  // ================================================================
  function scoreEntry(entry, words, fullQ) {
    var s     = 0;
    var titleL = (entry.title || "").toLowerCase();
    var descL  = (entry.description || "").toLowerCase();
    var catL   = (entry.category || "").toLowerCase();
    var kws    = entry.keywords || [];

    // Full-query tier
    if (titleL === fullQ)                     s += 120;
    else if (titleL.indexOf(fullQ) === 0)     s += 70;
    else if (titleL.indexOf(fullQ) !== -1)    s += 45;
    else if (descL.indexOf(fullQ) !== -1)     s += 12;
    else if (catL.indexOf(fullQ) !== -1)      s += 10;

    // Per-word tier (handles partial words, multi-word queries, misspelling-adjacent)
    for (var w = 0; w < words.length; w++) {
      var word = words[w];
      if (word.length < 2) continue;

      if (titleL.indexOf(word) !== -1)         s += 25;
      if (catL.indexOf(word) !== -1)            s += 10;
      if (descL.indexOf(word) !== -1)           s += 6;

      for (var k = 0; k < kws.length; k++) {
        if ((kws[k] || "").toLowerCase().indexOf(word) !== -1) s += 15;
      }
    }

    return s;
  }

  function search(query) {
    var q = (query || "").trim().toLowerCase();
    if (q.length < 1) return [];

    var words  = q.split(/\s+/);
    var index  = getIndex();
    var scored = [];

    for (var i = 0; i < index.length; i++) {
      var sc = scoreEntry(index[i], words, q);
      if (sc > 0) scored.push({ entry: index[i], score: sc });
    }

    scored.sort(function (a, b) { return b.score - a.score; });

    // Cap per category so one type doesn't swamp the list
    var counts = {};
    var MAX    = { Page: 6, Product: 14, Recipe: 6, Help: 8 };
    var out    = [];
    for (var j = 0; j < scored.length; j++) {
      var t = scored[j].entry.type;
      counts[t] = (counts[t] || 0) + 1;
      if (counts[t] <= (MAX[t] || 6)) out.push(scored[j].entry);
    }

    return out.slice(0, 28);
  }

  // ================================================================
  // RENDER
  // ================================================================
  function renderResults(container, query) {
    container.innerHTML = "";
    var q = (query || "").trim();
    if (!q) return;

    var results = search(q);

    if (!results.length) {
      var empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "No results found. Try searching for a product, recipe, or help topic.";
      container.appendChild(empty);
      return;
    }

    // Group by type
    var groups = {};
    for (var i = 0; i < results.length; i++) {
      var t = results[i].type;
      if (!groups[t]) groups[t] = [];
      groups[t].push(results[i]);
    }

    var ORDER  = ["Product", "Page", "Recipe", "Help"];
    var LABELS = { Product: "Products", Page: "Pages", Recipe: "Recipes", Help: "Help & Policies" };

    for (var g = 0; g < ORDER.length; g++) {
      var type  = ORDER[g];
      var items = groups[type];
      if (!items || !items.length) continue;

      var section = document.createElement("div");
      section.className = "search-group";

      var label = document.createElement("div");
      label.className = "search-group-label";
      label.textContent = LABELS[type];
      section.appendChild(label);

      for (var j = 0; j < items.length; j++) {
        var item = items[j];

        var a = document.createElement("a");
        a.className = "search-result";
        a.href = item.url;

        var top = document.createElement("div");
        top.className = "search-result-top";

        var titleEl = document.createElement("span");
        titleEl.className = "search-result-title";
        titleEl.textContent = item.title;
        top.appendChild(titleEl);

        if (item.category || item.type) {
          var badge = document.createElement("span");
          badge.className = "search-result-badge";
          badge.textContent = item.category || item.type;
          top.appendChild(badge);
        }

        a.appendChild(top);

        if (item.description) {
          var desc = document.createElement("p");
          desc.className = "search-result-desc";
          desc.textContent = item.description;
          a.appendChild(desc);
        }

        if (item.price) {
          var price = document.createElement("span");
          price.className = "search-result-price";
          price.textContent = item.price;
          a.appendChild(price);
        }

        section.appendChild(a);
      }

      container.appendChild(section);
    }
  }

  // ================================================================
  // OVERLAY (lazy — created on first open)
  // ================================================================
  var _overlay = null;
  var _input   = null;
  var _results = null;

  function createOverlay() {
    var overlay = document.createElement("div");
    overlay.id        = "pixySearchOverlay";
    overlay.className = "search-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Search Pixy Dust");
    overlay.hidden = true;

    // Backdrop
    var backdrop = document.createElement("div");
    backdrop.className = "search-backdrop";

    // Modal
    var modal = document.createElement("div");
    modal.className = "search-modal";

    // Head row
    var head = document.createElement("div");
    head.className = "search-modal-head";

    // Input wrapper
    var wrap = document.createElement("div");
    wrap.className = "search-input-wrap";

    // Search icon
    var iconWrap = document.createElement("span");
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.innerHTML = '<svg class="search-icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    wrap.appendChild(iconWrap);

    var inp = document.createElement("input");
    inp.id            = "pixySearchInput";
    inp.type          = "search";
    inp.placeholder   = "Search blends, recipes, help…";
    inp.autocomplete  = "off";
    inp.setAttribute("aria-label", "Search Pixy Dust");
    inp.setAttribute("spellcheck", "false");
    wrap.appendChild(inp);

    // Hint
    var hint = document.createElement("span");
    hint.className = "search-kbd-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = "ESC";
    wrap.appendChild(hint);

    var closeBtn = document.createElement("button");
    closeBtn.className = "search-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close search");
    closeBtn.innerHTML = "&times;";

    head.appendChild(wrap);
    head.appendChild(closeBtn);

    // Results
    var resultsEl = document.createElement("div");
    resultsEl.className = "search-results";
    resultsEl.id = "pixySearchResults";

    modal.appendChild(head);
    modal.appendChild(resultsEl);
    overlay.appendChild(backdrop);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Wire events
    inp.addEventListener("input", function () {
      renderResults(resultsEl, inp.value);
    });

    // Close on result click (navigate to link, also close overlay)
    resultsEl.addEventListener("click", function (e) {
      var link = e.target.closest(".search-result");
      if (link) closeSearch();
    });

    closeBtn.addEventListener("click",  closeSearch);
    backdrop.addEventListener("click",  closeSearch);

    // Keyboard navigation inside results
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var first = resultsEl.querySelector(".search-result");
        if (first) first.focus();
      }
    });

    resultsEl.addEventListener("keydown", function (e) {
      var links = Array.prototype.slice.call(resultsEl.querySelectorAll(".search-result"));
      var idx   = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var next = links[idx + 1] || links[0];
        if (next) next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (idx === 0) { inp.focus(); return; }
        var prev = links[idx - 1];
        if (prev) prev.focus();
      }
    });

    _input   = inp;
    _results = resultsEl;

    return overlay;
  }

  // ================================================================
  // OPEN / CLOSE
  // ================================================================
  function openSearch() {
    if (!_overlay) _overlay = createOverlay();
    _index = null; // rebuild index to pick up any late-loaded products
    _overlay.hidden = false;
    document.body.classList.add("search-is-open");
    if (_input) {
      _input.value = "";
      if (_results) _results.innerHTML = "";
      setTimeout(function () { _input.focus(); }, 40);
    }
  }

  function closeSearch() {
    if (_overlay) _overlay.hidden = true;
    document.body.classList.remove("search-is-open");
  }

  // ================================================================
  // KEYBOARD SHORTCUTS
  // ================================================================
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && _overlay && !_overlay.hidden) {
      e.preventDefault();
      closeSearch();
      return;
    }
    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (_overlay && !_overlay.hidden) { closeSearch(); } else { openSearch(); }
    }
  });

  // ================================================================
  // INIT
  // ================================================================
  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("#openSearchBtn");
      if (btn) { e.preventDefault(); openSearch(); }
    });
  });

  // Public API
  window.PIXY_SEARCH = { open: openSearch, close: closeSearch, query: search };

}());
