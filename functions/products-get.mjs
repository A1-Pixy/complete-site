/*!
 * functions/products-get.mjs — Pixy Dust Seasoning
 * Public GET: read active products from Supabase.
 *
 * Query params:
 *   category  — filter by category (exact match)
 *   slug      — fetch a single product by slug (returns first match)
 *   sku       — filter by SKU
 *   featured  — "true" → only featured products
 *   limit     — max rows (default 500, max 500)
 *
 * Requires env vars:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 */

import { json, corsHeaders, handleCors } from "./lib/response.mjs";
import { supabaseGet }                   from "./lib/supabase.mjs";

const SELECT_FIELDS = [
  "id","slug","sku","name","blurb","story","ingredients",
  "price","compare_at_price","category","tags",
  "image","gallery_images",
  "inventory_count","in_stock","featured","active",
  "sort_order","square_payment_link","ecwid_product_id"
].join(",");

export default async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY ||
      SUPABASE_URL.startsWith("YOUR_") || SUPABASE_ANON_KEY.startsWith("YOUR_")) {
    console.error("[products-get] Missing or placeholder Supabase env vars");
    return json(500, { ok: false, error: "Server configuration error" });
  }

  try {
    const u        = new URL(req.url);
    const category = u.searchParams.get("category") || null;
    const slug     = u.searchParams.get("slug")     || null;
    const sku      = u.searchParams.get("sku")      || null;
    const featured = u.searchParams.get("featured") || null;
    const limit    = clampInt(u.searchParams.get("limit") || "500", 1, 500);

    const params = {
      select: SELECT_FIELDS,
      order:  "sort_order.asc,name.asc",
      limit:  String(limit)
    };

    // RLS already filters active=true for anon key, but be explicit for clarity
    params.active = "eq.true";

    if (category) params.category = "eq." + category;
    if (slug)     params.slug     = "eq." + slug;
    if (sku)      params.sku      = "eq." + sku;
    if (featured === "true") params.featured = "eq.true";

    const rows = await supabaseGet(SUPABASE_URL, SUPABASE_ANON_KEY, "products", params);
    const products = Array.isArray(rows) ? rows : [];

    return json(200, { ok: true, products }, corsHeaders());
  } catch (e) {
    console.error("[products-get] Error:", e.message);
    return json(500, { ok: false, error: "Failed to load products" });
  }
};

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}
