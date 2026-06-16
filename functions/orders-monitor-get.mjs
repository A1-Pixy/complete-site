/*!
 * functions/orders-monitor-get.mjs — Pixy Dust Seasoning
 *
 * GET /.netlify/functions/orders-monitor-get
 * Returns: { ok: true,  source: "supabase",  orders: [...sanitized...] }
 *      or: { ok: false, source: "fallback",   error: "...", orders: [] }
 *
 * SECURITY: Service role key stays server-side only.
 * Only sanitized fields are returned — no email, phone, address, or payment tokens.
 *
 * Env vars required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { json, handleCors } from "./lib/response.mjs";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Explicit field whitelist — PII columns are never selected
const SAFE_SELECT = "id,order_code,first_name,last_name,items,total_cents,payment_status,created_at";

export default async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return json(405, { ok: false, error: "Method not allowed" }, CORS);

  const SUPABASE_URL     = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseMissing =
    !SUPABASE_URL     || SUPABASE_URL.startsWith("YOUR_")     ||
    !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith("YOUR_");

  if (supabaseMissing) {
    console.error("[orders-monitor-get] Supabase env vars missing or placeholder.");
    return json(200, { ok: false, source: "fallback", error: "Server configuration not ready", orders: [] }, CORS);
  }

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/orders`);
    url.searchParams.set("select", SAFE_SELECT);
    url.searchParams.set("order",  "created_at.desc");
    url.searchParams.set("limit",  "25");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey":        SERVICE_ROLE_KEY,
        "Content-Type":  "application/json"
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[orders-monitor-get] Supabase HTTP", res.status, errText.slice(0, 200));
      return json(200, { ok: false, source: "fallback", error: "Order data temporarily unavailable", orders: [] }, CORS);
    }

    const rows = await res.json();
    const orders = rows.map(sanitize);
    console.log(`[orders-monitor-get] Returned ${orders.length} orders.`);
    return json(200, { ok: true, source: "supabase", orders }, CORS);

  } catch (err) {
    console.error("[orders-monitor-get] Fetch error:", err.message);
    return json(200, { ok: false, source: "fallback", error: "Order data temporarily unavailable", orders: [] }, CORS);
  }
};

function sanitize(row) {
  const firstName   = row.first_name || "";
  const lastInitial = row.last_name ? row.last_name.slice(0, 1).toUpperCase() + "." : "";
  const customerName = (firstName + (lastInitial ? " " + lastInitial : "")).trim() || "Customer";

  const items = Array.isArray(row.items) ? row.items : [];
  const productSummary = items.length
    ? items.map((i) => `${i.title || i.key || "Item"} ×${i.qty || 1}`).join(", ")
    : "No items";

  const orderTotal = row.total_cents
    ? "$" + (row.total_cents / 100).toFixed(2)
    : "$0.00";

  return {
    id:                row.id,
    order_code:        row.order_code,
    customer_name:     customerName,
    order_status:      mapStatus(row.payment_status),
    product_summary:   productSummary,
    order_total:       orderTotal,
    tracking_number:   null,
    expected_delivery: null,
    late_flag:         false,
    refund_risk:       row.payment_status === "unpaid" ? "High" : "Low",
    support_notes:     null,
    created_at:        row.created_at
  };
}

function mapStatus(paymentStatus) {
  switch (paymentStatus) {
    case "paid":     return "Paid";
    case "pending":  return "Paid";
    case "unpaid":   return "Issue";
    case "refunded": return "Refunded";
    default:         return "Issue";
  }
}
