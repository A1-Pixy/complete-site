/*!
 * netlify/functions/orders-create.mjs — Pixy Dust Seasoning
 *
 * POST /.netlify/functions/orders-create
 * Body: {
 *   items:    [{ key, title, price, qty, image }],
 *   shipping: { email, firstName, lastName, address, city, state, zip, phone },
 *   subtotal: number,
 *   payment:  { status: "square"|"placeholder", token: string|null }
 * }
 * Returns: { ok: true, orderCode: string }
 *
 * Env vars required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SQUARE_ACCESS_TOKEN
 *   SQUARE_LOCATION_ID
 *   SQUARE_ENVIRONMENT  (default "production")
 */

import { randomUUID }            from "node:crypto";
import { json, handleCors }      from "./lib/response.mjs";
import { supabaseServiceInsert } from "./lib/supabase.mjs";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" }, CORS);

  const SUPABASE_URL     = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SQUARE_TOKEN     = process.env.SQUARE_ACCESS_TOKEN;
  const SQUARE_LOCATION  = process.env.SQUARE_LOCATION_ID;
  // Default "production" — never silently route real payments to sandbox
  const SQUARE_ENV       = (process.env.SQUARE_ENVIRONMENT || "production").trim().toLowerCase();

  console.log("[orders-create] SUPABASE_URL set:", !!SUPABASE_URL);
  console.log("[orders-create] SERVICE_ROLE_KEY set:", !!SERVICE_ROLE_KEY);
  console.log("[orders-create] SQUARE_TOKEN set:", !!SQUARE_TOKEN);
  console.log("[orders-create] SQUARE_LOCATION:", SQUARE_LOCATION);
  console.log("[orders-create] SQUARE_ENV:", SQUARE_ENV);

  if (SQUARE_ENV !== "production") {
    console.error(
      "[orders-create] ❌ SQUARE_ENVIRONMENT is '" + SQUARE_ENV + "' — payments route to Square SANDBOX." +
      " Set SQUARE_ENVIRONMENT=production in Netlify Site settings → Environment variables."
    );
  }

  const missingSupabase = [];
  if (!SUPABASE_URL     || SUPABASE_URL.startsWith("YOUR_"))     missingSupabase.push("SUPABASE_URL");
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith("YOUR_")) missingSupabase.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missingSupabase.length) {
    console.error("[orders-create] ❌ Missing or placeholder Supabase env vars:", missingSupabase.join(", "));
    return json(500, {
      ok:     false,
      error:  "Server configuration error",
      detail: "Missing env vars: " + missingSupabase.join(", ")
    }, CORS);
  }

  let body;
  try { body = await req.json(); } catch {
    return json(400, { ok: false, error: "Invalid JSON body" }, CORS);
  }

  const { items, shipping, payment } = body || {};

  if (!Array.isArray(items) || !items.length) {
    return json(400, { ok: false, error: "items array is required" }, CORS);
  }
  if (!shipping || !shipping.email || !shipping.address) {
    return json(400, { ok: false, error: "shipping info is required" }, CORS);
  }

  // Recalculate totals server-side in cents — never trust the client
  const subtotalCents = items.reduce((sum, i) => {
    return sum + Math.round((parseFloat(i.price) || 0) * (parseInt(i.qty, 10) || 1) * 100);
  }, 0);
  const shippingCents = subtotalCents >= 3700 ? 0 : 599;
  const totalCents    = subtotalCents + shippingCents;

  // ── Square payment ────────────────────────────────────────────────
  let squarePaymentId = null;
  let squareOrderId   = null;

  if (payment && payment.token && SQUARE_TOKEN && SQUARE_LOCATION) {
    try {
      const squareBaseUrl = SQUARE_ENV === "production"
        ? "https://connect.squareup.com"
        : "https://connect.squareupsandbox.com";

      const squareRes = await fetch(squareBaseUrl + "/v2/payments", {
        method:  "POST",
        headers: {
          "Content-Type":   "application/json",
          "Square-Version": "2024-01-18",
          Authorization:    "Bearer " + SQUARE_TOKEN
        },
        body: JSON.stringify({
          source_id:           payment.token,
          idempotency_key:     randomUUID(),
          location_id:         SQUARE_LOCATION,
          amount_money:        { amount: totalCents, currency: "USD" },
          buyer_email_address: shipping.email,
          billing_address: {
            address_line_1:                  shipping.address,
            locality:                        shipping.city,
            administrative_district_level_1: shipping.state,
            postal_code:                     shipping.zip,
            country:                         "US"
          }
        })
      });

      const squareData = await squareRes.json();
      console.log("[orders-create] Square HTTP status:", squareRes.status);

      if (!squareRes.ok || !squareData.payment) {
        const errMsg = squareData.errors
          ? squareData.errors.map(e => e.detail).join("; ")
          : "Payment failed";
        console.error("[orders-create] Square error:", errMsg);
        console.error("[orders-create] Square response:", JSON.stringify(squareData));
        return json(402, { ok: false, error: errMsg }, CORS);
      }

      squarePaymentId = squareData.payment.id;
      squareOrderId   = squareData.payment.order_id || null;
      console.log("[orders-create] Square success, payment ID:", squarePaymentId);
    } catch (err) {
      console.error("[orders-create] Square request error:", err.message);
      return json(500, { ok: false, error: "Payment service unavailable", detail: err.message }, CORS);
    }
  }

  // ── Save order to Supabase ────────────────────────────────────────
  const orderCode     = generateOrderCode();
  const paymentStatus = squarePaymentId
    ? "paid"
    : (payment && payment.status === "placeholder" ? "pending" : "unpaid");

  const orderPayload = {
    order_code:        orderCode,
    customer_email:    shipping.email,
    first_name:        shipping.firstName || "",
    last_name:         shipping.lastName  || "",
    phone:             shipping.phone     || null,
    shipping_address:  shipping.address,
    city:              shipping.city,
    state:             shipping.state,
    zip:               shipping.zip,
    items:             items,
    subtotal_cents:    subtotalCents,
    shipping_cents:    shippingCents,
    total_cents:       totalCents,
    square_payment_id: squarePaymentId,
    square_order_id:   squareOrderId,
    payment_status:    paymentStatus
  };

  console.log("[orders-create] Inserting order:", orderCode, "| payment_status:", paymentStatus, "| total_cents:", totalCents);

  try {
    // Service role key used as both Bearer and apikey — bypasses RLS
    const result = await supabaseServiceInsert(SUPABASE_URL, SERVICE_ROLE_KEY, SERVICE_ROLE_KEY, "orders", orderPayload);
    console.log("[orders-create] ✅ Supabase insert success:", JSON.stringify(result));
  } catch (err) {
    console.error("[orders-create] ❌ Supabase insert FAILED:", err.message);
    // Payment already captured — return partial success so the customer isn't stranded
    if (squarePaymentId) {
      return json(207, { ok: true, orderCode, warning: "Payment captured but DB write failed", detail: err.message }, CORS);
    }
    return json(500, { ok: false, error: "Failed to save order", detail: err.message }, CORS);
  }

  await sendOrderNotification({ orderCode, shipping, items, subtotalCents, shippingCents, totalCents, squarePaymentId });

  return json(201, { ok: true, orderCode }, CORS);
};

async function sendOrderNotification({ orderCode, shipping, items, subtotalCents, shippingCents, totalCents, squarePaymentId }) {
  try {
    const siteUrl = process.env.URL || "http://localhost:8888";

    const itemLines = items.map(i =>
      `${i.title || i.key} x${i.qty || 1} @ $${parseFloat(i.price || 0).toFixed(2)}`
    ).join("\n");

    const body = new URLSearchParams({
      "form-name":        "order-notification",
      "order_code":       orderCode,
      "customer_name":    `${shipping.firstName || ""} ${shipping.lastName || ""}`.trim(),
      "customer_email":   shipping.email,
      "phone":            shipping.phone || "—",
      "shipping_address": `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}`,
      "items":            itemLines,
      "subtotal":         `$${(subtotalCents / 100).toFixed(2)}`,
      "shipping":         shippingCents === 0 ? "FREE" : `$${(shippingCents / 100).toFixed(2)}`,
      "total":            `$${(totalCents / 100).toFixed(2)}`,
      "square_payment_id": squarePaymentId || "—",
      "timestamp":        new Date().toISOString()
    }).toString();

    const res = await fetch(siteUrl + "/", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (res.ok) {
      console.log("[orders-create] ✅ Order notification sent for", orderCode);
    } else {
      console.warn("[orders-create] ⚠️ Order notification form returned", res.status, "for", orderCode);
    }
  } catch (err) {
    console.error("[orders-create] ⚠️ Order notification FAILED (order still succeeded):", err.message);
  }
}

function generateOrderCode() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return "PD-" + ts + "-" + rand;
}
