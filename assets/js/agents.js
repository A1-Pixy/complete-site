// ================================================================
// PIXY DUST — assets/js/agents.js
//
// Agent foundation layer.
// Provides intent detection, page context, and message routing
// across specialized agent roles (sales, support, marketing, admin).
//
// Used by chatbot.js for context-aware AI responses.
// Exposes window.PIXY_AGENTS for direct access.
//
// No external dependencies. Must load after main.js.
// ================================================================

(function () {
  "use strict";

  // ── Agent definitions ───────────────────────────────────────────
  var AGENTS = {

    // Sales agent — product discovery, recommendations, cart help
    sales: {
      name: "Sales",
      role: "sales",
      systemPrompt: [
        "You are a Pixy Dust Seasoning sales specialist.",
        "Your job: help customers discover the right blends, understand pricing, and place orders.",
        "Always highlight the luxury, gourmet nature of the products.",
        "If asked about a specific product, share flavor notes, use cases, and suggest pairings.",
        "Keep responses warm, confident, and under 3 sentences unless a list is clearly better.",
        "Never invent pricing; direct customers to the shop page for current prices.",
        "Signature Pouches are the hero product — lead with those unless context says otherwise."
      ].join(" "),
      triggers: ["buy", "order", "price", "cost", "shop", "cart", "checkout", "gift", "discount", "sale", "deal", "how much", "purchase", "available", "stock", "recommend", "which one", "best seller", "popular"]
    },

    // Support agent — order issues, shipping, substitutions, FAQs
    support: {
      name: "Support",
      role: "support",
      systemPrompt: [
        "You are a Pixy Dust Seasoning customer support specialist.",
        "Your job: resolve questions about orders, shipping, returns, and product availability.",
        "Be calm, helpful, and solution-oriented.",
        "For order-specific issues you cannot resolve, direct customers to contact@pixydustseasoning.com.",
        "Never promise refunds or replacements — explain the policy is handled by the team.",
        "If a customer seems frustrated, acknowledge it first before providing info.",
        "Keep responses concise and action-oriented."
      ].join(" "),
      triggers: ["order", "shipping", "track", "return", "refund", "replace", "wrong", "broken", "damaged", "late", "missing", "cancel", "status", "never arrived", "help", "issue", "problem", "complaint"]
    },

    // Recipe / culinary agent — cooking help, pairings, techniques
    culinary: {
      name: "Culinary",
      role: "culinary",
      systemPrompt: [
        "You are Pixy, a culinary assistant for Pixy Dust Seasoning.",
        "Your expertise: flavor pairings, cooking techniques, recipe ideas, and how to use each blend.",
        "Ground every answer in the actual Pixy Dust product line when relevant.",
        "Suggest specific blends by name — Pixy Gold, Tropic Fire, Global Black, etc.",
        "Keep answers practical, confident, and inspiring. You love food.",
        "Never give medical or dietary advice — redirect those questions to a healthcare provider.",
        "Aim for 1–3 sentences or a short bulleted list. Quality over quantity."
      ].join(" "),
      triggers: ["recipe", "cook", "grill", "season", "flavor", "pairing", "pair", "use", "chicken", "beef", "fish", "salmon", "steak", "veggies", "vegetable", "shrimp", "pork", "marinade", "rub", "blend", "spice", "ingredient", "taste", "how to", "what goes", "what works"]
    },

    // Marketing / brand agent — story, values, wholesale, press
    marketing: {
      name: "Marketing",
      role: "marketing",
      systemPrompt: [
        "You are the Pixy Dust Seasoning brand voice.",
        "Your job: tell the brand story, explain our values, handle wholesale inquiries, and answer press questions.",
        "Pixy Dust was founded to bring luxury gourmet flavor to everyday cooking — flavor with a purpose.",
        "Highlight: woman-owned, community-driven, globally inspired, luxury positioned.",
        "For wholesale: direct to the wholesale page and mention minimum order inquiries via contact form.",
        "Keep tone elevated, warm, and inspiring. Think Oprah meets Julia Child.",
        "Responses should be 1–4 sentences."
      ].join(" "),
      triggers: ["story", "founder", "brand", "wholesale", "press", "media", "partner", "retail", "about", "mission", "values", "why pixy", "who are", "history", "woman", "owned", "community", "purpose"]
    },

    // Admin agent — CMS help, settings, data management
    admin: {
      name: "Admin",
      role: "admin",
      systemPrompt: [
        "You are the Pixy Dust admin assistant.",
        "Help the site owner manage content via the CMS, update products, and understand site settings.",
        "The CMS uses localStorage with a pixy_cms_v2_ prefix. Admin mode is enabled via ?admin=true.",
        "Products are managed in assets/js/products.js — each product has key, title, category, blurb, image, ecwidProductId.",
        "Be precise and technical. Give exact field names and instructions.",
        "Never expose admin functionality to end users — only respond in admin context.",
        "Keep responses concise and actionable."
      ].join(" "),
      triggers: ["admin", "cms", "edit", "update", "change content", "manage", "settings", "add product", "remove product", "image", "upload", "dashboard"]
    }

  };

  // ── Default agent ───────────────────────────────────────────────
  var DEFAULT_AGENT = "culinary";

  // ── Page context ────────────────────────────────────────────────
  function getPageContext() {
    var path = window.location.pathname.replace(/^.*\//, "").replace(/\?.*$/, "");
    var search = window.location.search;
    var ctx = { page: path, params: {} };

    try { ctx.params = Object.fromEntries(new URLSearchParams(search)); } catch (e) {}

    // Detect product context
    if (ctx.params.key) {
      ctx.productKey = ctx.params.key;
      var PIXY = window.PIXY;
      if (PIXY && typeof PIXY.getProductByKey === "function") {
        ctx.product = PIXY.getProductByKey(ctx.params.key);
      }
    }

    // Page-level agent hint
    var hints = {
      "shop.html":       "sales",
      "product.html":    "sales",
      "gifting.html":    "sales",
      "wholesale.html":  "marketing",
      "about.html":      "marketing",
      "recipes.html":    "culinary",
      "juniors.html":    "sales",
      "spices.html":     "sales",
      "contact.html":    "support",
      "index.html":      "culinary",
      "":                "culinary"
    };
    ctx.agentHint = hints[path] || DEFAULT_AGENT;

    return ctx;
  }

  // ── Intent detection ────────────────────────────────────────────
  function detectIntent(message) {
    if (!message) return DEFAULT_AGENT;
    var lower = message.toLowerCase();

    // Admin mode check
    if (window.location.search.indexOf("admin=true") !== -1) {
      var admin = AGENTS.admin;
      for (var at = 0; at < admin.triggers.length; at++) {
        if (lower.indexOf(admin.triggers[at]) !== -1) return "admin";
      }
    }

    // Score each agent by trigger matches
    var scores = {};
    var roles = Object.keys(AGENTS);
    for (var r = 0; r < roles.length; r++) {
      var role = roles[r];
      var agent = AGENTS[role];
      var score = 0;
      for (var t = 0; t < agent.triggers.length; t++) {
        if (lower.indexOf(agent.triggers[t]) !== -1) score++;
      }
      scores[role] = score;
    }

    // Pick highest scorer
    var best = DEFAULT_AGENT;
    var bestScore = 0;
    for (var key in scores) {
      if (scores[key] > bestScore) { bestScore = scores[key]; best = key; }
    }

    return bestScore > 0 ? best : DEFAULT_AGENT;
  }

  // ── Build system prompt for a request ──────────────────────────
  function buildSystemPrompt(message, overrideRole) {
    var role = overrideRole || detectIntent(message);
    var ctx = getPageContext();

    // Fall through to page hint if no strong intent
    if (!overrideRole && role === DEFAULT_AGENT && ctx.agentHint !== DEFAULT_AGENT) {
      role = ctx.agentHint;
    }

    var agent = AGENTS[role] || AGENTS[DEFAULT_AGENT];
    var lines = [agent.systemPrompt];

    // Inject product context if available
    if (ctx.product) {
      lines.push(
        "The customer is currently viewing: " + ctx.product.title +
        " (category: " + (ctx.product.category || "unknown") + ")." +
        (ctx.product.blurb ? " Description: " + ctx.product.blurb : "")
      );
    }

    // Inject page context
    lines.push("Current page: " + (ctx.page || "home") + ".");

    return lines.join(" ");
  }

  // ── Route a message ─────────────────────────────────────────────
  // Returns: { role, agent, systemPrompt }
  function routeMessage(message) {
    var role = detectIntent(message);
    var ctx = getPageContext();
    if (role === DEFAULT_AGENT && ctx.agentHint !== DEFAULT_AGENT) {
      role = ctx.agentHint;
    }
    var agent = AGENTS[role] || AGENTS[DEFAULT_AGENT];
    return {
      role:         role,
      agent:        agent,
      systemPrompt: buildSystemPrompt(message, role)
    };
  }

  // ── Public API ──────────────────────────────────────────────────
  window.PIXY_AGENTS = {
    agents:           AGENTS,
    getPageContext:   getPageContext,
    detectIntent:     detectIntent,
    buildSystemPrompt: buildSystemPrompt,
    routeMessage:     routeMessage
  };

})();
