/*!
 * functions/products-admin.mjs — Pixy Dust Seasoning
 * Protected CRUD for the products table.
 *
 * All requests require header:  x-admin-secret: <ADMIN_SECRET>
 *
 * GET    /products-admin               — list ALL products (incl. inactive)
 * POST   /products-admin               — create or update a product
 *   body: { op: "create"|"update", product: { slug, sku, name, ... } }
 * DELETE /products-admin?slug=abc      — delete product by slug
 *
 * Requires env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   — service_role key (bypasses RLS)
 *   SUPABASE_ANON_KEY
 *   ADMIN_SECRET                — strong password for this endpoint
 */

import { json, handleCors }                                               from "./lib/response.mjs";
import { supabaseGet, supabaseServiceInsert, supabasePatch,
         supabaseDeleteRow }                                               from "./lib/supabase.mjs";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret"
};

export default async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SERVICE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY;   // fixed: was SUPABASE_SERVICE_KEY
  const ANON_KEY          = process.env.SUPABASE_ANON_KEY;
  const ADMIN_SECRET      = process.env.ADMIN_SECRET;

  if (!SUPABASE_URL || !SERVICE_KEY ||
      SUPABASE_URL.startsWith("YOUR_") || SERVICE_KEY.startsWith("YOUR_")) {
    console.error("[products-admin] Missing or placeholder Supabase env vars");
    return json(500, { ok: false, error: "Server configuration error" }, CORS);
  }

  // ── Auth ─────────────────────────────────────────────────────
  const secret = req.headers.get("x-admin-secret") || "";
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return json(401, { ok: false, error: "Unauthorized" }, CORS);
  }

  try {
    // ── GET: list ALL products (service role sees inactive too) ──
    if (req.method === "GET") {
      const rows = await supabaseGet(SUPABASE_URL, SERVICE_KEY, "products", {
        select: "*",
        order:  "sort_order.asc,name.asc",
        limit:  "500"
      });
      return json(200, { ok: true, products: Array.isArray(rows) ? rows : [] }, CORS);
    }

    // ── POST: create or update ────────────────────────────────────
    if (req.method === "POST") {
      let body;
      try { body = await req.json(); } catch {
        return json(400, { ok: false, error: "Invalid JSON" }, CORS);
      }

      const { op, product } = body || {};
      if (!op || !product || !product.slug) {
        return json(400, { ok: false, error: "op and product.slug are required" }, CORS);
      }

      const payload = sanitize(product);

      if (op === "create") {
        // Auto-set SKU from slug if not provided
        if (!payload.sku) payload.sku = payload.slug;
        const row = await supabaseServiceInsert(SUPABASE_URL, SERVICE_KEY, SERVICE_KEY, "products", payload);
        console.log("[products-admin] Created:", payload.slug);
        return json(201, { ok: true, product: Array.isArray(row) ? row[0] : row }, CORS);
      }

      if (op === "update") {
        const { slug, ...fields } = payload;
        const row = await supabasePatch(
          SUPABASE_URL, SERVICE_KEY, SERVICE_KEY,
          "products", { slug: "eq." + slug }, fields
        );
        console.log("[products-admin] Updated:", slug);
        return json(200, { ok: true, product: Array.isArray(row) ? row[0] : row }, CORS);
      }

      return json(400, { ok: false, error: "op must be 'create' or 'update'" }, CORS);
    }

    // ── DELETE: remove by slug ────────────────────────────────────
    if (req.method === "DELETE") {
      const slug = new URL(req.url).searchParams.get("slug");
      if (!slug) return json(400, { ok: false, error: "slug query param required" }, CORS);

      await supabaseDeleteRow(SUPABASE_URL, SERVICE_KEY, SERVICE_KEY, "products", { slug: "eq." + slug });
      console.log("[products-admin] Deleted:", slug);
      return json(200, { ok: true }, CORS);
    }

    return json(405, { ok: false, error: "Method not allowed" }, CORS);
  } catch (e) {
    console.error("[products-admin] Error:", e.message);
    return json(500, { ok: false, error: e.message }, CORS);
  }
};

function sanitize(p) {
  // Tags: accept comma-separated string or array
  let tags = p.tags;
  if (typeof tags === "string") {
    tags = tags.split(",").map(t => t.trim()).filter(Boolean);
  } else if (!Array.isArray(tags)) {
    tags = [];
  }

  // Gallery images: accept newline-separated string or array
  let gallery = p.gallery_images;
  if (typeof gallery === "string") {
    gallery = gallery.split("\n").map(u => u.trim()).filter(Boolean);
  } else if (!Array.isArray(gallery)) {
    gallery = [];
  }

  return {
    slug:               String(p.slug  || "").trim().toLowerCase().replace(/\s+/g, "-"),
    sku:                p.sku ? String(p.sku).trim() : null,
    name:               String(p.name  || "").trim(),
    blurb:              p.blurb             ? String(p.blurb).trim()             : null,
    story:              p.story             ? String(p.story).trim()             : null,
    ingredients:        p.ingredients       ? String(p.ingredients).trim()       : null,
    full_description:   p.full_description  ? String(p.full_description).trim()  : null,
    price:              toDecimal(p.price),
    compare_at_price:   toDecimal(p.compare_at_price),
    category:           p.category          ? String(p.category).trim()          : null,
    tags,
    image:              p.image             ? String(p.image).trim()             : null,
    gallery_images:     gallery,
    inventory_count:    p.inventory_count != null ? parseInt(p.inventory_count, 10) || 0 : 0,
    in_stock:           p.in_stock   !== undefined ? Boolean(p.in_stock)   : true,
    featured:           p.featured   !== undefined ? Boolean(p.featured)   : false,
    active:             p.active     !== undefined ? Boolean(p.active)     : true,
    sort_order:         p.sort_order != null ? parseInt(p.sort_order, 10) || 0   : 0,
    square_payment_link:p.square_payment_link ? String(p.square_payment_link).trim() : null,
    ecwid_product_id:   p.ecwid_product_id ? parseInt(p.ecwid_product_id, 10) || null : null
  };
}

function toDecimal(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(v);
  return isFinite(n) ? n : null;
}
