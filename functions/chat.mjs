/*!
 * functions/chat.mjs -- Pixy Dust Seasoning
 * AI chatbot endpoint. Powered by Google Gemini (free tier).
 *
 * Requires environment variable:
 *   GEMINI_API_KEY -- get a free key at https://aistudio.google.com/apikey
 *   Set it in Netlify dashboard -> Site Settings -> Environment Variables
 *
 * Free tier limits (gemini-2.0-flash):
 *   15 requests / minute
 *   1 million tokens / day
 *   No billing required
 */

const GEMINI_MODEL  = "gemini-2.0-flash";
const GEMINI_API    = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_TOKENS    = 400;
const MAX_MSG_CHARS = 1000;
const MAX_HISTORY   = 10;

const FALLBACK_REPLY =
  "Chat temporarily unavailable. Please contact support@pixydustseasoning.com.";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type":                 "application/json"
};

function reply200(replyText) {
  return {
    statusCode: 200,
    headers:    CORS_HEADERS,
    body:       JSON.stringify({ ok: true, reply: replyText })
  };
}

function error200(message) {
  return {
    statusCode: 200,
    headers:    CORS_HEADERS,
    body:       JSON.stringify({ ok: false, reply: FALLBACK_REPLY, error: message })
  };
}

// ── Handler (Netlify Functions v1 / ESM) ────────────────────────────────────
export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers:    CORS_HEADERS,
      body:       ""
    };
  }

  if (event.httpMethod !== "POST") {
    return error200("Method not allowed");
  }

  // Parse body safely
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    console.error("[chat] JSON parse error:", e.message);
    return error200("Invalid JSON body");
  }

  console.log("[chat] request body:", JSON.stringify({
    message: (body.message || "").slice(0, 100),
    historyLength: Array.isArray(body.history) ? body.history.length : 0
  }));

  const message = String(body.message || "").trim().slice(0, MAX_MSG_CHARS);
  if (!message) {
    return error200("message is required");
  }

  // Missing API key -- return a graceful fallback instead of crashing
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("[chat] GEMINI_API_KEY not set -- returning fallback reply");
    return reply200(
      "I'm having trouble connecting right now. Try asking about a specific blend or visit our Shop page to browse the full collection."
    );
  }

  // Agent role whitelist
  const AGENT_ROLE_WHITELIST = ["culinary", "sales", "support", "marketing"];
  const agentRole = AGENT_ROLE_WHITELIST.includes(body.agentRole)
    ? body.agentRole
    : "culinary";

  // Sanitize and cap history.
  // Gemini uses "user" / "model" roles (not "assistant").
  // Contents array must strictly alternate: user -> model -> user -> model ...
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const historyContents = rawHistory
    .slice(-MAX_HISTORY)
    .filter(h => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
    .map(h => ({
      role:  h.role === "user" ? "user" : "model",
      parts: [{ text: String(h.content).slice(0, MAX_MSG_CHARS) }]
    }));

  // Ensure strict alternation (Gemini rejects consecutive same-role entries)
  const contents = [];
  for (const entry of historyContents) {
    const last = contents[contents.length - 1];
    if (last && last.role === entry.role) continue;
    contents.push(entry);
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  // Call Gemini -- wrap everything so we can always return a friendly reply
  try {
    const geminiRes = await fetch(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
      method:  "POST",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemPrompt(agentRole) }]
        },
        contents,
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          temperature:     0.7
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("[chat] Gemini error", geminiRes.status, errText);
      return reply200(FALLBACK_REPLY);
    }

    let data;
    try {
      data = await geminiRes.json();
    } catch (e) {
      console.error("[chat] Gemini JSON parse error:", e.message);
      return reply200(FALLBACK_REPLY);
    }

    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Ask me about a specific blend, what you're cooking, or gift ideas.";

    console.log("[chat] reply length:", replyText.length);
    return reply200(replyText);

  } catch (err) {
    console.error("[chat] error:", err.message || err);
    return reply200(FALLBACK_REPLY);
  }
};

// ── System Prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(role = "culinary") {
  const AGENT_PREFIXES = {
    sales:
      "You are a Pixy Dust Seasoning sales specialist. Help customers find and purchase the right products. Highlight value, gift options, and the premium nature of the brand. Recommend specific products with enthusiasm.\n\n",
    support:
      "You are a Pixy Dust Seasoning customer support specialist. Be calm and solution-oriented. For order-specific issues, direct customers to support@pixydustseasoning.com. Do not promise refunds -- explain the team handles those.\n\n",
    marketing:
      "You are the Pixy Dust Seasoning brand voice. Pixy Dust is a luxury, community-driven, globally inspired seasoning brand -- flavor with a purpose. For wholesale inquiries, direct to the Wholesale page. Keep tone elevated and warm.\n\n"
  };
  const prefix = AGENT_PREFIXES[role] || "";

  return prefix + `You are Pixy Assistant, the AI culinary guide for Pixy Dust Seasoning -- a luxury gourmet seasoning brand.

## Your Role
Help customers:
- Find the right blend for what they are cooking
- Understand ingredients and flavor profiles
- Get recipe ideas and pairing suggestions
- Choose gift sets
- Navigate the shop

## Brand Voice
Premium, warm, knowledgeable. Concise (2-4 sentences max per reply). Never clinical. Always food-focused.

## Product Catalog

### Signature Blends (Pouches)
- **Universal All Purpose** -- herbs and spices for everything. Ingredients: Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Celery Seed, Brown Sugar, Chili Powder, Cumin and Herbs. Best on proteins, vegetables, eggs, sides.
- **Sugar Free All Purpose** -- keto and vegan friendly, monk fruit sweetened. Ingredients: Sea Salt, Black Pepper, Garlic, Turmeric, Onion, Paprika, Mustard, Celery Seed, Monk fruit, Chili Powder, Cumin and Herbs.
- **Jerk** -- island-inspired, pimento smokiness. Ingredients: Sea Salt, Black Pepper, Garlic, Onion, All Spice, Mustard, Celery Seed, Brown Sugar, Ginger, Dehydrated Soy Sauce, Chili, and Herbs. Best for chicken, pork, grilled vegetables.
- **Asian Stir Fry (Kitchen Samurai)** -- umami-forward, restaurant-style. Ingredients: Sea Salt, Black Pepper, Garlic, Onion, White Pepper, Brown Sugar, Ginger, Vinegar, Soy Sauce. Best for stir-fry, noodles, seafood.
- **Fajita** -- Mexican-inspired vibrant spice. Ingredients: Sea Salt, Black Pepper, Garlic, Ginger, Smoked Paprika, Cumin, Soy sauce, Worcestershire, Lime, Chili Powder, Herbs. Best for fajitas, tacos, grilled meats.
- **Chop House Steak** -- steakhouse profile. Ingredients: Sea Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Red Pepper Flakes, Thyme. Best for ribeye, strip, burgers, roast beef.
- **Smoke BBQ** -- competition-style hickory smoke. Ingredients: Smoked Sea Salt, Black Pepper, Smoked Garlic, Brown Sugar, Onion, Smoked Paprika, Mustard, Spices, Herbs. Best for brisket, ribs, chicken.
- **Garlic Pepper (Divine Trinity)** -- bold garlic and pepper base. Ingredients: Minced Garlic, Garlic Powder, Black Garlic Powder, Black Pepper, Coarse Sea Salt. Versatile everyday blend.
- **Deep Blue Seafood** -- ocean-forward, clean finish. Ingredients: Sea Salt, White Pepper, Paprika, Garlic, Onion, Celery Seed, Mustard, Ginger, Dried Lemon Peel, Soy Sauce Powder, Herbs. Best for fish, shrimp, scallops, butter sauces.

### Heritage Bottles
Same blends as above in classic bottle format.

### Gift Sets
- 3-Blend Signature Gift Box
- 6-Blend Signature Collection
- Full Signature Collection (all blends)

### Subscriptions
Monthly, 3-month, 6-month options. Available on the Gifting page.

### Individual Spices
Premium singles: Worcestershire Powder, White Pepper, Turmeric, Smoked Salt, Smoked Paprika, Sea Salt, Soy Sauce Powder, Vinegar Powder, Monk Fruit, Black Pepper, Mustard Powder, Ground Ginger, Allspice, Red Chili Powder, Paprika, Ground Onion, Garlic Granulate, Cayenne Pepper, Celery Seed, Curry Powder.

## Rules
1. Only recommend products that exist in the catalog above. Do NOT invent products or flavors.
2. For ingredient questions, share the exact ingredient list from above. Do NOT add or change ingredients.
3. Never make medical, health, or dietary treatment claims. (You may note that a blend is keto-friendly or sugar-free, but do not say it treats or prevents any condition.)
4. For order, shipping, refund, or account questions, direct to the Contact page.
5. Keep responses to 2-4 sentences. Be specific and helpful.
6. End with a product page reference where relevant (e.g., "Shop this blend at shop.html").
7. If asked something unrelated to food, cooking, or Pixy Dust Seasoning, politely redirect.`;
}
