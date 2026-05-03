/*!
 * netlify/functions/gemini.js — Pixy Dust Seasoning
 * Product-aware Gemini AI proxy. Returns structured JSON with reply + product recommendations.
 *
 * Required env var: GEMINI_API_KEY
 * Set in Netlify dashboard → Site settings → Environment variables.
 *
 * Expects POST body: { message: string, matchedProducts: Array }
 * Returns:           { ok: true, reply: string, products: [{id, reason}] }
 *               OR   { ok: false, error: string }
 */

"use strict";

var GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

var CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type":                 "application/json"
};

function buildPrompt(message, matchedProducts) {
  var catalogSection = (matchedProducts && matchedProducts.length)
    ? JSON.stringify(matchedProducts, null, 2)
    : "[]";

  return [
    "You are the Pixy Dust Seasoning assistant.",
    "Your job:",
    "- Help users cook better food",
    "- Provide recipes when asked",
    "- Recommend Pixy Dust products when relevant",
    "",
    "Rules:",
    "- Do NOT respond like a product catalog",
    "- Do NOT start with the product name or a sales pitch",
    "- For recipes, include: ingredients, seasoning amount, steps, cook time",
    "- Recommend only products from the provided catalog below",
    "- Always include 1–3 relevant products if applicable",
    "- Keep the reply concise and practical",
    "- Do not give medical advice",
    "",
    "User question:",
    message,
    "",
    "Available products:",
    catalogSection,
    "",
    "Return ONLY valid JSON — no markdown, no code fences, no extra text:",
    "{",
    '  "reply": "your text answer here",',
    '  "products": [',
    '    { "id": "product-id", "reason": "one sentence why it fits" }',
    "  ]",
    "}"
  ].join("\n");
}

function stripFences(text) {
  return text
    .split("```json").join("")
    .split("```").join("")
    .trim();
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Method not allowed" })
    };
  }

  var body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Invalid JSON body" })
    };
  }

  var message = (typeof body.message === "string") ? body.message.trim() : "";
  var matchedProducts = Array.isArray(body.matchedProducts) ? body.matchedProducts : [];

  if (!message) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "No message provided" })
    };
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "AI service not configured" })
    };
  }

  var requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: buildPrompt(message, matchedProducts) }
        ]
      }
    ],
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.7
    }
  };

  var response;
  try {
    response = await fetch(GEMINI_URL + "?key=" + apiKey, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(requestBody)
    });
  } catch (networkErr) {
    console.error("Gemini network error:", networkErr);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "AI service unreachable" })
    };
  }

  if (!response.ok) {
    var errText = await response.text().catch(function () { return ""; });
    console.error("Gemini HTTP " + response.status + ":", errText);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "AI service error" })
    };
  }

  var data;
  try {
    data = await response.json();
  } catch (e) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Invalid AI response" })
    };
  }

  var rawText = "";
  try {
    rawText = data.candidates[0].content.parts[0].text || "";
  } catch (e) {
    rawText = "";
  }

  if (!rawText) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Empty AI response" })
    };
  }

  var parsed;
  try {
    parsed = JSON.parse(stripFences(rawText));
  } catch (e) {
    console.warn("Gemini returned non-JSON text, using as plain reply:", rawText.slice(0, 200));
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, reply: rawText.trim(), products: [] })
    };
  }

  var reply = (typeof parsed.reply === "string") ? parsed.reply.trim() : "";
  var products = Array.isArray(parsed.products) ? parsed.products : [];

  if (!reply) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Empty reply in AI response" })
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ ok: true, reply: reply, products: products })
  };
};
