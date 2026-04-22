/*!
 * chatbot.js — Pixy Assistant
 * Product-aware AI assistant for Pixy Dust Seasoning.
 *
 * Changes from v2:
 *   - findMatchingProducts() matches user message against PIXY_PRODUCT_CATALOG
 *   - sendToAI() calls /.netlify/functions/gemini with matchedProducts
 *   - addBubble() accepts optional products array, renders CTA buttons
 *   - renderProductButtons() builds product links via DOM (no innerHTML)
 *   - Dynamic catalog loader injects assets/data/product-catalog.js if needed
 *
 * OWNERSHIP:
 *   This file owns: message rendering, API calls, transcript persistence.
 *   main.js owns:   chat panel open/close, drag, position persistence.
 *   Do not add open/close logic here.
 */
(function () {
  "use strict";

  var GEMINI_ENDPOINT = "/.netlify/functions/gemini";
  var CATALOG_SRC     = "assets/data/product-catalog.js";
  var LS_KEY          = "pixy_chat_v3";
  var SS_KEY          = "pixy_chat_session_v3";
  var MAX_HISTORY     = 20;
  var API_HISTORY     = 10;

  // ─────────────────────────────────────────────────────────────────
  // SESSION RESET — clear transcript once per browser tab.
  // ─────────────────────────────────────────────────────────────────
  (function () {
    try {
      if (!sessionStorage.getItem(SS_KEY)) {
        sessionStorage.setItem(SS_KEY, "1");
        localStorage.removeItem(LS_KEY);
        sessionStorage.removeItem(LS_KEY);
        // Also clear old v2 keys
        localStorage.removeItem("pixy_chat_v2");
        sessionStorage.removeItem("pixy_chat_v2");
      }
    } catch (e) {}
  })();

  // ─────────────────────────────────────────────────────────────────
  // CATALOG LOADER
  // ─────────────────────────────────────────────────────────────────
  function ensureCatalog() {
    if (window.PIXY_PRODUCT_CATALOG) return Promise.resolve();
    return new Promise(function (resolve) {
      // Already being loaded by another instance
      if (document.querySelector('script[src*="product-catalog"]')) {
        var attempts = 0;
        var poll = setInterval(function () {
          if (window.PIXY_PRODUCT_CATALOG || ++attempts > 30) {
            clearInterval(poll);
            resolve();
          }
        }, 100);
        return;
      }
      var s = document.createElement("script");
      s.src = CATALOG_SRC;
      s.onload = function () { resolve(); };
      s.onerror = function () { resolve(); }; // degrade gracefully
      document.head.appendChild(s);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PRODUCT MATCHING
  // ─────────────────────────────────────────────────────────────────
  function findMatchingProducts(message) {
    var catalog = window.PIXY_PRODUCT_CATALOG;
    if (!Array.isArray(catalog) || !catalog.length) return [];

    var q = (message || "").toLowerCase();
    var scored = [];

    for (var i = 0; i < catalog.length; i++) {
      var p = catalog[i];
      var score = 0;

      // Match against name
      var nameLower = (p.name || "").toLowerCase();
      if (q.indexOf(nameLower) !== -1) score += 10;

      // Match against tags
      var tags = Array.isArray(p.tags) ? p.tags : [];
      for (var t = 0; t < tags.length; t++) {
        if (q.indexOf(tags[t].toLowerCase()) !== -1) score += 3;
      }

      // Match against bestFor
      var bestFor = Array.isArray(p.bestFor) ? p.bestFor : [];
      for (var b = 0; b < bestFor.length; b++) {
        if (q.indexOf(bestFor[b].toLowerCase()) !== -1) score += 4;
      }

      // Match against category
      var cat = (p.category || "").toLowerCase();
      if (q.indexOf(cat) !== -1) score += 1;

      if (score > 0) scored.push({ product: p, score: score });
    }

    // Sort descending by score, take top 3
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 3).map(function (s) {
      return {
        id:          s.product.id,
        name:        s.product.name,
        category:    s.product.category,
        flavor:      s.product.flavor || "",
        usage:       s.product.usage  || "",
        bestFor:     s.product.bestFor || [],
        url:         s.product.url    || "",
        cta:         s.product.cta    || ("Shop " + s.product.name),
        image:       s.product.image  || ""
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    var chat = document.querySelector("[data-chat]");
    if (!chat) return;

    var bodyEl = chat.querySelector("[data-chat-body]");
    var form   = chat.querySelector("[data-chat-form]");
    if (!bodyEl || !form) return;

    var input = form.querySelector('input[type="text"], input[name="message"], textarea');
    if (!input) return;

    injectStyles();

    var transcript = loadTranscript();
    if (!transcript.length) {
      transcript.push({
        role: "bot",
        text: "Pixy Assistant ready. Ask about a blend, what you\u2019re cooking, or gift ideas."
      });
      saveTranscript(transcript);
    }
    renderAll(bodyEl, transcript);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = (input.value || "").trim();
      if (!msg) return;

      input.value = "";
      setInputDisabled(input, form, true);

      transcript = loadTranscript();
      transcript.push({ role: "user", text: msg });
      saveTranscript(transcript);
      renderAll(bodyEl, transcript);

      var loadingId = showLoading(bodyEl);

      ensureCatalog()
        .then(function () {
          var matched = findMatchingProducts(msg);
          return sendToAI(msg, transcript, matched);
        })
        .then(function (result) {
          removeLoading(bodyEl, loadingId);
          transcript = loadTranscript();
          transcript.push({ role: "bot", text: result.reply, products: result.products || [] });
          saveTranscript(transcript);
          renderAll(bodyEl, transcript);
        })
        .catch(function () {
          removeLoading(bodyEl, loadingId);
          var fallback = ruleBasedResponse(msg);
          transcript = loadTranscript();
          transcript.push({ role: "bot", text: fallback, products: [] });
          saveTranscript(transcript);
          renderAll(bodyEl, transcript);
        })
        .then(function () {
          setInputDisabled(input, form, false);
          input.focus();
        });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // AI BACKEND CALL
  // ─────────────────────────────────────────────────────────────────
  function sendToAI(message, transcript, matchedProducts) {
    var payload = {
      message: message,
      matchedProducts: matchedProducts || []
    };

    return fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(function (r) {
      if (!r.ok) return Promise.reject(new Error("HTTP " + r.status));
      return r.json();
    })
    .then(function (data) {
      if (!data || !data.ok) return Promise.reject(new Error(data && data.error));
      return {
        reply:    String(data.reply || ""),
        products: Array.isArray(data.products) ? data.products : []
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE-BASED FALLBACK
  // ─────────────────────────────────────────────────────────────────
  function ruleBasedResponse(message) {
    var t = (message || "").toLowerCase();

    var blend = detectBlend(t);
    if (blend && /ingredient|what.?s in|contains|allerg/i.test(message)) {
      return blend.name + " ingredients: " + blend.ingredients +
        ". Full label on the product page.";
    }
    if (blend) {
      return blend.name + ": " + blend.best + " Tap View & Order on the Shop page.";
    }

    if (/steak|ribeye|sirloin|strip|filet|burger/.test(t))
      return "Try Chop House Steak or Garlic Pepper for beef. Pat dry, season generously, sear hot, rest 5 min before slicing.";
    if (/chicken|wing|wings|drum|thigh/.test(t))
      return "Try Universal All Purpose, Jerk, or Asian Stir Fry on chicken. Season well and cook to 165\u00b0F.";
    if (/pork|rib|ribs|bacon|belly|tenderloin|chop/.test(t))
      return "Try Smoke BBQ for ribs and pulled pork. Try Jerk for chops and tenderloin.";
    if (/fish|salmon|tilapia|shrimp|scallop|crab|seafood/.test(t))
      return "Try Deep Blue Seafood. Season lightly and cook fast over high heat for shrimp and scallops.";
    if (/vegetable|veggies|broccoli|asparagus|potato|mushroom|zucchini|cauliflower/.test(t))
      return "Try Universal All Purpose or Garlic Pepper. Oil lightly, season, roast at 425\u00b0F until browned.";
    if (/egg|eggs|breakfast|scramble|omelette/.test(t))
      return "Universal All Purpose works great on eggs. A little Garlic Pepper is excellent on scrambles.";
    if (/pasta|noodle|rice/.test(t))
      return "Try Asian Stir Fry in noodle dishes or garlic-forward pasta. Add to cooking water or toss at the end.";
    if (/keto|sugar.?free|no sugar|vegan|plant.?based|low.?carb/.test(t))
      return "Sugar Free All Purpose is our keto and vegan blend \u2014 same great flavor, no sugar, naturally sweetened with monk fruit.";
    if (/gluten|celiac/.test(t))
      return "Most of our blends are gluten-free, but always check the label on the product page for the most current info.";
    if (/sodium|salt|low.?sodium/.test(t))
      return "Our blends are seasoned to enhance flavor without over-salting. For a lighter hand, start with half the amount and adjust to taste.";
    if (/gift|present|birthday|holiday|mother|father|christmas|hanukkah/.test(t))
      return "Check our Gifting page for 3-blend, 6-blend, and full collection gift boxes. Perfect for food lovers and home cooks.";
    if (/beginner|new|start|first|recommend|which one|what to get|where to start/.test(t))
      return "Start with Universal All Purpose \u2014 it works on proteins, vegetables, eggs, and sides. Most versatile blend in the collection.";
    if (/cart|checkout|shipping|tax/.test(t))
      return "Use the Cart button to review and checkout. Shipping and tax are calculated at checkout.";
    if (/order|refund|return|support|help/.test(t))
      return "For order questions, visit the Contact page and we\u2019ll get back to you promptly.";
    if (/wholesale|bulk|restaurant|retailer/.test(t))
      return "Wholesale and restaurant partnerships are available. Visit the Wholesale page to submit an application.";
    if (/subscription|subscribe|monthly/.test(t))
      return "Subscriptions are available in 1-, 3-, and 6-month options on the Gifting page.";

    return "Ask me about a specific blend, what you\u2019re cooking tonight, or gift ideas for a food lover.";
  }

  var BLENDS = [
    {
      keys: ["all-purpose", "universal", "allpurpose", "all purpose"],
      name: "Universal All Purpose",
      ingredients: "Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Celery Seed, Brown Sugar, Chili Powder, Cumin and Herbs",
      best: "Best on proteins, vegetables, eggs, and sides. The most versatile blend."
    },
    {
      keys: ["sugar-free-all-purpose", "sugar free", "sugarfree", "keto", "sugar-free"],
      name: "Sugar Free All Purpose",
      ingredients: "Sea Salt, Black Pepper, Garlic, Turmeric, Onion, Paprika, Mustard, Celery Seed, Monk fruit, Chili Powder, Cumin and Herbs",
      best: "Keto and vegan friendly. Same flavor profile, no sugar."
    },
    {
      keys: ["jerk"],
      name: "Jerk",
      ingredients: "Sea Salt, Black Pepper, Garlic, Onion, All Spice, Mustard, Celery Seed, Brown Sugar, Ginger, Dehydrated Soy Sauce, Chili, and Herbs",
      best: "Best for chicken, pork, and grilled vegetables. Island-inspired."
    },
    {
      keys: ["asian-stir-fry", "asian", "stir fry", "stir-fry", "kitchen samurai"],
      name: "Asian Stir Fry",
      ingredients: "Sea Salt, Black Pepper, Garlic, Onion, White Pepper, Brown Sugar, Ginger, Vinegar, Soy Sauce",
      best: "Best for stir-fry, noodles, seafood, and sauces. Umami-forward."
    },
    {
      keys: ["fajita-mexican", "fajita", "taco", "mexican"],
      name: "Fajita",
      ingredients: "Sea Salt, Black Pepper, Garlic, Ginger, Smoked Paprika, Cumin, Soy sauce, Worcestershire, Lime, Chili Powder, Cumin and Herbs",
      best: "Best for fajitas, tacos, and grilled meats. Vibrant Mexican-inspired spice."
    },
    {
      keys: ["chophouse-steak-rub", "chop house", "chophouse", "steak"],
      name: "Chop House Steak",
      ingredients: "Sea Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Red Pepper Flakes, Thyme",
      best: "Best for ribeye, strip, burgers, and roast beef. Steakhouse profile."
    },
    {
      keys: ["smoke-bbq", "smoke bbq", "bbq", "smoked", "smoky"],
      name: "Smoke BBQ",
      ingredients: "Smoked Sea Salt, Black Pepper, Smoked Garlic, Brown Sugar, Onion, Smoked Paprika, Mustard, Spices, and Herbs",
      best: "Best for brisket, ribs, and chicken. Competition BBQ style."
    },
    {
      keys: ["garlic-pepper", "garlic pepper", "divine trinity", "garlic"],
      name: "Garlic Pepper",
      ingredients: "Minced Garlic, Garlic Powder, Black Garlic Powder, Black Pepper, Course Sea Salt",
      best: "Classic garlic and pepper base. Versatile everyday blend for almost anything."
    },
    {
      keys: ["deep-blue-seafood", "deep blue", "seafood"],
      name: "Deep Blue Seafood",
      ingredients: "Sea Salt, White Pepper, Paprika, Garlic, Onion, Celery Seed, Mustard, Ginger, Dried Lemon Peel, Soy Sauce Powder and Herbs",
      best: "Best for fish, shrimp, scallops, and butter sauces. Ocean-forward and clean."
    }
  ];

  function detectBlend(query) {
    for (var i = 0; i < BLENDS.length; i++) {
      var b = BLENDS[i];
      for (var j = 0; j < b.keys.length; j++) {
        if (query.indexOf(b.keys[j]) !== -1) return b;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // TRANSCRIPT PERSISTENCE
  // ─────────────────────────────────────────────────────────────────
  function loadTranscript() {
    try {
      var raw = sessionStorage.getItem(LS_KEY) || localStorage.getItem(LS_KEY) || "";
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function saveTranscript(list) {
    try {
      var trimmed = list.slice(-MAX_HISTORY);
      var str = JSON.stringify(trimmed);
      sessionStorage.setItem(LS_KEY, str);
      localStorage.setItem(LS_KEY, str);
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDERING
  // ─────────────────────────────────────────────────────────────────
  function renderAll(bodyEl, transcript) {
    bodyEl.innerHTML = "";
    for (var i = 0; i < transcript.length; i++) {
      var m = transcript[i];
      if (m && m.role && typeof m.text === "string") {
        addBubble(bodyEl, m.role, m.text, m.products);
      }
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function addBubble(bodyEl, role, text, products) {
    var row = document.createElement("div");
    row.className = "chat-row " + (role === "user" ? "is-user" : "is-bot");

    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    row.appendChild(bubble);

    // Render product CTA buttons for bot messages only
    if (role === "bot" && Array.isArray(products) && products.length) {
      var ctaEl = renderProductButtons(products);
      if (ctaEl) row.appendChild(ctaEl);
    }

    bodyEl.appendChild(row);
    return row;
  }

  function renderProductButtons(products) {
    if (!Array.isArray(products) || !products.length) return null;

    // Build a lookup from the catalog so we have url/cta/image available
    var catalog = window.PIXY_PRODUCT_CATALOG || [];
    var catalogById = {};
    for (var c = 0; c < catalog.length; c++) {
      if (catalog[c].id) catalogById[catalog[c].id] = catalog[c];
    }

    var row = document.createElement("div");
    row.className = "chat-cta-row";

    var rendered = 0;
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var id = (typeof p === "string") ? p : (p && p.id);
      if (!id) continue;

      var entry = catalogById[id];
      if (!entry || !entry.url) continue;

      var a = document.createElement("a");
      a.className = "chat-product-cta";
      a.href = entry.url;
      // Use the cta label from catalog if available; fall back to name
      a.textContent = entry.cta || entry.name || id;
      a.setAttribute("target", "_self");

      // Attach reason as title tooltip if present
      if (p && typeof p.reason === "string" && p.reason) {
        a.title = p.reason;
      }

      row.appendChild(a);
      rendered++;
    }

    return rendered ? row : null;
  }

  // ─────────────────────────────────────────────────────────────────
  // LOADING INDICATOR
  // ─────────────────────────────────────────────────────────────────
  var _loadingSeq = 0;

  function showLoading(bodyEl) {
    var id = "pixy-loading-" + (++_loadingSeq);
    var row = document.createElement("div");
    row.className = "chat-row is-bot";
    row.id = id;

    var bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-loading";
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement("span");
      dot.className = "dot";
      bubble.appendChild(dot);
    }

    row.appendChild(bubble);
    bodyEl.appendChild(row);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return id;
  }

  function removeLoading(bodyEl, id) {
    var el = bodyEl.querySelector("#" + id);
    if (el) el.remove();
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────
  function setInputDisabled(input, form, disabled) {
    input.disabled = disabled;
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = disabled;
  }

  function injectStyles() {
    if (document.getElementById("pixy-chatbot-styles")) return;
    var style = document.createElement("style");
    style.id = "pixy-chatbot-styles";
    style.textContent = [
      ".chat-loading{",
        "display:flex;align-items:center;gap:5px;padding:4px 6px;",
      "}",
      ".chat-loading .dot{",
        "width:7px;height:7px;border-radius:50%;",
        "background:currentColor;opacity:.45;",
        "animation:pixy-dot 1.1s ease-in-out infinite;",
      "}",
      ".chat-loading .dot:nth-child(2){animation-delay:.18s;}",
      ".chat-loading .dot:nth-child(3){animation-delay:.36s;}",
      "@keyframes pixy-dot{",
        "0%,80%,100%{opacity:.2;transform:scale(.8);}",
        "40%{opacity:1;transform:scale(1);}",
      "}"
    ].join("");
    document.head.appendChild(style);
  }

})();
