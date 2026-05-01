/*!
 * chatbot.js -- Pixy Assistant
 * Product-aware AI assistant for Pixy Dust Seasoning.
 */
(function () {
  "use strict";

  var CHAT_ENDPOINT   = "/.netlify/functions/chat";
  var CATALOG_SRC     = "assets/data/product-catalog.js";
  var LS_KEY          = "pixy_chat_v3";
  var SS_KEY          = "pixy_chat_session_v3";
  var MAX_HISTORY     = 20;
  var API_HISTORY     = 10;

  // State for the email capture flow -- null when inactive.
  var pendingCapture = null;

  // -----------------------------------------------------------------
  // SESSION RESET -- clear transcript once per browser tab.
  // -----------------------------------------------------------------
  (function () {
    try {
      if (!sessionStorage.getItem(SS_KEY)) {
        sessionStorage.setItem(SS_KEY, "1");
        localStorage.removeItem(LS_KEY);
        sessionStorage.removeItem(LS_KEY);
        localStorage.removeItem("pixy_chat_v2");
        sessionStorage.removeItem("pixy_chat_v2");
      }
    } catch (e) {}
  })();

  // -----------------------------------------------------------------
  // CATALOG LOADER
  // -----------------------------------------------------------------
  function ensureCatalog() {
    if (window.PIXY_PRODUCT_CATALOG) return Promise.resolve();
    return new Promise(function (resolve) {
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
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }

  // -----------------------------------------------------------------
  // PRODUCT MATCHING
  // -----------------------------------------------------------------
  function findMatchingProducts(message) {
    var catalog = window.PIXY_PRODUCT_CATALOG;
    if (!Array.isArray(catalog) || !catalog.length) return [];

    var q = (message || "").toLowerCase();
    var scored = [];

    for (var i = 0; i < catalog.length; i++) {
      var p = catalog[i];
      var score = 0;

      var nameLower = (p.name || "").toLowerCase();
      if (q.indexOf(nameLower) !== -1) score += 10;

      var tags = Array.isArray(p.tags) ? p.tags : [];
      for (var t = 0; t < tags.length; t++) {
        if (q.indexOf(tags[t].toLowerCase()) !== -1) score += 3;
      }

      var bestFor = Array.isArray(p.bestFor) ? p.bestFor : [];
      for (var b = 0; b < bestFor.length; b++) {
        if (q.indexOf(bestFor[b].toLowerCase()) !== -1) score += 4;
      }

      var cat = (p.category || "").toLowerCase();
      if (q.indexOf(cat) !== -1) score += 1;

      if (score > 0) scored.push({ product: p, score: score });
    }

    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 3).map(function (s) {
      return {
        id:       s.product.id,
        name:     s.product.name,
        category: s.product.category,
        flavor:   s.product.flavor || "",
        usage:    s.product.usage  || "",
        bestFor:  s.product.bestFor || [],
        url:      s.product.url    || "",
        cta:      s.product.cta    || ("Shop " + s.product.name),
        image:    s.product.image  || ""
      };
    });
  }

  // -----------------------------------------------------------------
  // LEAD CAPTURE
  // -----------------------------------------------------------------
  function detectLeadIntent(message) {
    var t = (message || "").toLowerCase();
    if (/\bvip\b|exclusive|early.?access|private.?access|join.*vip|vip.*list/.test(t))
      return { tag: "VIP" };
    if (/apply.*wholesale|wholesale.*apply|wholesale.*interest|interest.*wholesale|wholesale.*inquiry|wholesale.*email/.test(t))
      return { tag: "Wholesale" };
    if (/\bnewsletter\b|mailing.?list|sign.*me.*up|keep.*updated|stay.*updated/.test(t))
      return { tag: "Newsletter" };
    return null;
  }

  function isValidEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((str || "").trim());
  }

  function handleLeadEmail(email, capture) {
    var vip = window.PIXY_VIP;
    if (vip && typeof vip.submitLead === "function") {
      vip.submitLead(email.trim(), "", capture.tag, "chatbot");
    }
    var confirm;
    if (capture.tag === "VIP") {
      confirm = "You're on the VIP list! Expect exclusive access and early drops at " + email.trim() + ". Welcome.";
    } else if (capture.tag === "Wholesale") {
      confirm = "Got it -- we'll reach out to " + email.trim() + " about wholesale options within 1 business day.";
    } else {
      confirm = "You're subscribed! We'll keep you updated at " + email.trim() + ".";
    }
    pendingCapture = null;
    return confirm;
  }

  // -----------------------------------------------------------------
  // INIT
  // -----------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    var chat = document.querySelector("[data-chat]");
    if (!chat) return;

    var bodyEl = chat.querySelector("[data-chat-body]");
    var form   = chat.querySelector("[data-chat-form]");
    if (!bodyEl || !form) return;

    var input = form.querySelector('input[type="text"], input[name="message"], textarea');
    if (!input) return;

    var sendBtn = form.querySelector('button[type="submit"], button');

    injectStyles();

    var transcript = loadTranscript();
    if (!transcript.length) {
      transcript.push({
        role: "bot",
        text: "Pixy Assistant ready. Ask about a blend, what you're cooking, or gift ideas.",
        quickReplies: ["Shop Blends", "Best for Chicken", "Best for Seafood", "Gift Ideas", "Wholesale", "Shipping & Returns", "Contact Us"]
      });
      saveTranscript(transcript);
    }
    renderAll(bodyEl, transcript);

    // -----------------------------------------------------------------
    // HANDLE SEND -- called by form submit, Enter key, and Send click.
    // -----------------------------------------------------------------
    function handleSend(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      var msg = (input.value || "").trim();
      if (!msg || input.disabled) return;

      input.value = "";
      setInputDisabled(input, form, true);

      transcript = loadTranscript();
      transcript.push({ role: "user", text: msg });
      saveTranscript(transcript);
      renderAll(bodyEl, transcript);

      var loadingId = showLoading(bodyEl);

      // -- Lead capture state machine ------------------------------------
      if (pendingCapture) {
        removeLoading(bodyEl, loadingId);
        var replyText;
        if (isValidEmail(msg)) {
          replyText = handleLeadEmail(msg, pendingCapture);
        } else {
          replyText = "That doesn't look like a valid email address. Please enter your email to continue, or type 'cancel' to go back.";
          if (/^cancel$/i.test(msg.trim())) {
            pendingCapture = null;
            replyText = "No problem -- feel free to ask me anything else!";
          }
        }
        transcript = loadTranscript();
        transcript.push({ role: "bot", text: replyText });
        saveTranscript(transcript);
        renderAll(bodyEl, transcript);
        setInputDisabled(input, form, false);
        input.focus();
        return;
      }

      var captureIntent = detectLeadIntent(msg);
      if (captureIntent) {
        pendingCapture = captureIntent;
        removeLoading(bodyEl, loadingId);
        var askText = captureIntent.tag === "VIP"
          ? "I'd love to add you to the VIP list -- you'll get exclusive blends and early releases. What's your email address?"
          : captureIntent.tag === "Wholesale"
            ? "Wholesale inquiries are welcome! Share your email and our team will follow up within 1 business day."
            : "Happy to add you to our list. What's your email address?";
        transcript = loadTranscript();
        transcript.push({ role: "bot", text: askText });
        saveTranscript(transcript);
        renderAll(bodyEl, transcript);
        setInputDisabled(input, form, false);
        input.focus();
        return;
      }
      // -- End lead capture ----------------------------------------------

      ensureCatalog()
        .then(function () {
          var matched = findMatchingProducts(msg);
          return sendToAI(msg, transcript, matched);
        })
        .then(function (result) {
          removeLoading(bodyEl, loadingId);
          var botReply =
            result.reply ||
            result.message ||
            result.text ||
            result.answer ||
            "Chat temporarily unavailable. Please contact support@pixydustseasoning.com.";
          transcript = loadTranscript();
          transcript.push({ role: "bot", text: botReply, products: result.products || [] });
          saveTranscript(transcript);
          renderAll(bodyEl, transcript);
        })
        .catch(function () {
          removeLoading(bodyEl, loadingId);
          var errText;
          try { errText = ruleBasedResponse(msg); } catch (e2) {}
          if (!errText) errText = "Chat temporarily unavailable. Please contact support@pixydustseasoning.com.";
          transcript = loadTranscript();
          transcript.push({ role: "bot", text: errText, products: [] });
          saveTranscript(transcript);
          renderAll(bodyEl, transcript);
        })
        .then(function () {
          setInputDisabled(input, form, false);
          input.focus();
        });
    }

    // Attach listeners --------------------------------------------------

    // Form submit (Enter key in most browsers, or programmatic dispatch)
    form.addEventListener("submit", handleSend);

    // Enter key inside the text input
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        handleSend(e);
      }
    });

    // Send button -- force type="button" so clicking never triggers submit,
    // then wire its click directly to handleSend.
    if (sendBtn) {
      sendBtn.setAttribute("type", "button");
      sendBtn.addEventListener("click", handleSend);
    }
  });

  // -----------------------------------------------------------------
  // AI BACKEND CALL
  // -----------------------------------------------------------------
  function sendToAI(message, transcript, matchedProducts) {
    var history = [];
    var prev = transcript.slice(0, -1).slice(-API_HISTORY);
    for (var i = 0; i < prev.length; i++) {
      var m = prev[i];
      if (m && (m.role === "user" || m.role === "bot") && typeof m.text === "string") {
        history.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
      }
    }

    return fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, history: history })
    })
    .then(function (r) {
      if (!r.ok) return Promise.reject(new Error("HTTP " + r.status));
      return r.json();
    })
    .then(function (data) {
      if (!data) return Promise.reject(new Error("empty response"));
      var reply = data.reply || data.message || data.text || data.answer || "";
      if (!reply && data.ok === false) return Promise.reject(new Error(data.error));
      return {
        reply:    String(reply),
        products: Array.isArray(data.products) ? data.products : []
      };
    });
  }

  // -----------------------------------------------------------------
  // RULE-BASED FALLBACK
  // -----------------------------------------------------------------
  function ruleBasedResponse(message) {
    var t = (message || "").toLowerCase();

    var blend = detectBlend(t);
    if (blend && /ingredient|what.?s in|contains|allerg/i.test(message)) {
      return blend.name + " ingredients: " + blend.ingredients + ". Full label on the product page.";
    }
    if (blend) {
      return blend.name + ": " + blend.best + " Visit the Shop page to order.";
    }

    if (/^shop blends?$/i.test(message) || /^browse|^shop$/i.test(message.trim()))
      return "We have 9 signature seasoning blends in pouches ($13 each) and bottles ($7.95), plus gift sets, subscriptions, individual spices, grills, and kids bundles. Visit the Shop page to see the full collection.";

    if (/^best for chicken$/i.test(message))
      return "Top picks for chicken: Universal All Purpose (everyday versatility), Jerk (island depth, great on wings and thighs), Asian Stir Fry (umami wok flavor), and Fajita (Mexican-inspired grill). Season generously and cook to 165°F.";

    if (/^best for seafood$/i.test(message))
      return "Deep Blue Seafood is our dedicated ocean blend — built for fish, shrimp, scallops, crab, and butter sauces. Season just before cooking. Asian Stir Fry also works beautifully on shrimp and wok-seared fish.";

    if (/^gift ideas?$/i.test(message))
      return "Our gift sets are perfect for food lovers: the 3-Blend Set ($37), 6-Blend Set ($55), and full 9-Blend Signature Collection ($75). All gift sets ship free. We also have Junior Chef kits for kids and subscription boxes. Visit the Gifting page for everything.";

    if (/^wholesale$/i.test(message))
      return "We work with restaurants, retailers, and hospitality programs. Shelf-ready luxury packaging, bulk options (1 lb and 5 lb), and private label are available. Visit the Wholesale page to submit an application.";

    if (/^shipping\s*(&|and)\s*returns$/i.test(message))
      return "Shipping: standard 5–7 business days, expedited 2–3 days. All gift sets ship free; orders over $75 also ship free. Returns: we accept unopened items within 30 days. Damaged orders are replaced at no charge. Email support@pixydustseasoning.com to start a return.";

    if (/^contact us?$/i.test(message))
      return "Reach us at support@pixydustseasoning.com — we respond within 1 business day. You can also use the Contact page to send a message directly.";

    if (/steak|ribeye|sirloin|strip|filet|burger|beef|brisket/.test(t))
      return "Try Chop House Steak for premium cuts — bold steakhouse flavor. Garlic Pepper is great for everyday beef and finishing. Smoke BBQ works on brisket and burgers. Pat dry, season generously, sear hot.";
    if (/chicken|wing|wings|drum|thigh|breast|poultry/.test(t))
      return "Top chicken blends: Universal All Purpose (everyday), Jerk (island marinade or dry rub), Asian Stir Fry (wok), Fajita (grilled or skillet). Season well and cook to 165°F.";
    if (/pork|rib|ribs|bacon|belly|tenderloin|chop|pulled pork/.test(t))
      return "Smoke BBQ is the go-to for ribs, pulled pork, and smoked cuts. Jerk works beautifully on chops and tenderloin. Apply 30 min before cooking for best bark on ribs.";
    if (/fish|salmon|tilapia|shrimp|scallop|crab|seafood|lobster|catfish|halibut|cod/.test(t))
      return "Deep Blue Seafood is built for it — lemon peel, white pepper, and herbs keep it bright. Season just before cooking. For wok-seared shrimp, Asian Stir Fry is equally excellent.";
    if (/vegetable|veggies|broccoli|asparagus|potato|mushroom|zucchini|cauliflower|roasted/.test(t))
      return "Universal All Purpose or Garlic Pepper on roasted vegetables. Oil lightly, season well, roast at 400–425°F until the edges caramelize. Sugar Free All Purpose is ideal for plant-based eating.";
    if (/egg|eggs|breakfast|scramble|omelette|frittata/.test(t))
      return "Universal All Purpose works great on eggs and breakfast dishes. A pinch of Garlic Pepper is excellent in scrambles. Both add depth without overpowering.";
    if (/pasta|noodle|noodles|rice|fried rice|lo mein/.test(t))
      return "Asian Stir Fry brings restaurant-style umami to noodles and fried rice. Add to cooking water or toss at the end over high heat. Garlic Pepper also works in garlic pasta and butter-based dishes.";
    if (/taco|tacos|mexican|fajita|burrito|quesadilla|nachos/.test(t))
      return "The Fajita blend was inspired by Mexico — smoked paprika, cumin, lime, and chili. Use on skirt steak, chicken, or shrimp. Great as a dry rub or mixed with oil and lime as a marinade.";

    if (/keto|sugar.?free|no sugar|vegan|plant.?based|low.?carb|monk fruit/.test(t))
      return "Sugar Free All Purpose is made without added sugar and naturally sweetened with monk fruit — same great All Purpose flavor, no sugar. Great for keto and low-carb cooking.";
    if (/gluten|celiac/.test(t))
      return "Most Pixy Dust blends are naturally gluten-free. Check the ingredient list on each product page for the most current information.";
    if (/sodium|salt|low.?sodium/.test(t))
      return "Our blends are designed to enhance flavor without over-salting. Start with half the suggested amount and adjust to taste if you're watching sodium.";

    if (/gift|present|birthday|holiday|mother|father|christmas|hanukkah|thanksgiving/.test(t))
      return "Our gift sets are beautifully packaged and all ship free: 3-Blend ($37), 6-Blend ($55), full 9-Blend Collection ($75). We also have Junior Chef kits for kids. Visit the Gifting page.";
    if (/beginner|new|start|first|recommend|which one|what to get|where to start/.test(t))
      return "Start with Universal All Purpose — it works on every protein, vegetables, eggs, and sides. Most versatile blend in the collection. Available in pouches ($13) and bottles ($7.95).";
    if (/ship|shipping|deliver|delivery|how long|tracking|free ship/.test(t))
      return "Standard shipping is 5–7 business days. Expedited is 2–3 days. All gift sets ship free. Orders over $75 also ship free. You'll receive a tracking email once your order ships.";
    if (/return|refund|exchange|money back|damaged|broken/.test(t))
      return "We accept returns within 30 days on unopened items. Damaged orders are replaced at no charge. Email support@pixydustseasoning.com with your order number to start.";
    if (/wholesale|bulk|restaurant|retailer|b2b|hospitality|private label/.test(t))
      return "Wholesale and restaurant partnerships are available. We offer shelf-ready luxury packaging, 1 lb and 5 lb bulk options, and private label. Visit the Wholesale page to apply.";
    if (/subscription|subscribe|monthly|recurring/.test(t))
      return "Subscriptions are available in monthly, 3-month, and 6-month options on the Gifting page. Perfect as a recurring gift or a way to keep exploring new blends.";
    if (/kids|children|juniors|family|book|storybook|young chef/.test(t))
      return "Pixy Dust Juniors features kid-friendly seasoning kits, the \"Zen in the Pearl Market\" storybook, and Junior Chef bundles that pair books with blends. Perfect for families who cook together. Visit the Juniors page.";
    if (/cart|checkout|bag|order|buy/.test(t))
      return "Use the Cart button in the top-right corner to review your items and check out. Shipping and any applicable tax are calculated at checkout.";
    if (/contact|email|support|help|reach|phone/.test(t))
      return "Reach us at support@pixydustseasoning.com — we respond within 1 business day. Or visit the Contact page and send a message directly.";
    if (/shop|browse|products|collection|lineup|what do you have|what do you sell/.test(t))
      return "We carry 9 signature blends (pouches and bottles), gift sets, subscriptions, individual spices, Lion Premium grills, and Junior Chef kits. Visit the Shop page to see the full collection.";
    if (/who|about|brand|story|founder|pixy dust|origin|history/.test(t))
      return "Pixy Dust Seasoning creates luxury gourmet blends inspired by global travels and Caribbean roots. The collection spans 9 signature blends engineered for specific flavor profiles. Visit the About page to learn more.";
    if (/price|cost|how much/.test(t))
      return "Pouches are $13 each. Bottles start at $7.95. Gift sets are $37, $55, and $75 — all with free shipping. Individual spices vary. Visit the Shop page for the full price list.";

    return "I don't have enough information to answer that. Please contact us at support@pixydustseasoning.com and we'll be happy to help.";
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

  // -----------------------------------------------------------------
  // TRANSCRIPT PERSISTENCE
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // RENDERING
  // -----------------------------------------------------------------
  function renderAll(bodyEl, transcript) {
    bodyEl.innerHTML = "";
    for (var i = 0; i < transcript.length; i++) {
      var m = transcript[i];
      if (m && m.role && typeof m.text === "string") {
        addBubble(bodyEl, m.role, m.text, m.products, m.quickReplies);
      }
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function addBubble(bodyEl, role, text, products, quickReplies) {
    var row = document.createElement("div");
    row.className = "chat-row " + (role === "user" ? "is-user" : "is-bot");

    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    row.appendChild(bubble);

    if (role === "bot" && Array.isArray(quickReplies) && quickReplies.length) {
      var qrEl = renderQuickReplies(quickReplies);
      if (qrEl) row.appendChild(qrEl);
    }

    if (role === "bot" && Array.isArray(products) && products.length) {
      var ctaEl = renderProductButtons(products);
      if (ctaEl) row.appendChild(ctaEl);
    }

    bodyEl.appendChild(row);
    return row;
  }

  function renderQuickReplies(buttons) {
    if (!buttons || !buttons.length) return null;
    var div = document.createElement("div");
    div.className = "chat-quick-replies";
    for (var i = 0; i < buttons.length; i++) {
      (function (label) {
        var btn = document.createElement("button");
        btn.className = "chat-quick-btn";
        btn.type = "button";
        btn.textContent = label;
        btn.addEventListener("click", function () {
          var chatEl  = document.querySelector("[data-chat]");
          if (!chatEl) return;
          var formEl  = chatEl.querySelector("[data-chat-form]");
          var inputEl = chatEl.querySelector('input[type="text"], input[name="message"]');
          if (!inputEl || !formEl || inputEl.disabled) return;
          inputEl.value = label;
          var evt = document.createEvent ? document.createEvent("Event") : new Event("submit");
          if (evt.initEvent) evt.initEvent("submit", true, true);
          formEl.dispatchEvent(evt);
        });
        div.appendChild(btn);
      }(buttons[i]));
    }
    return div;
  }

  function renderProductButtons(products) {
    if (!Array.isArray(products) || !products.length) return null;

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
      a.textContent = entry.cta || entry.name || id;
      a.setAttribute("target", "_self");

      if (p && typeof p.reason === "string" && p.reason) {
        a.title = p.reason;
      }

      row.appendChild(a);
      rendered++;
    }

    return rendered ? row : null;
  }

  // -----------------------------------------------------------------
  // LOADING INDICATOR
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------------
  function setInputDisabled(input, form, disabled) {
    input.disabled = disabled;
    var btn = form.querySelector('button[type="button"], button[type="submit"]');
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
