/*!
 * netlify/functions/recipes-get.mjs — Pixy Dust Seasoning
 * GET recipe posts from Supabase.
 *
 * Query params:
 *   recipeId  — filters posts to a recipe. Defaults to "community".
 *   limit     — max rows returned. Clamped to 1–200. Default 50.
 *
 * Requires env vars:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 */

import { json, corsHeaders, handleCors } from "./lib/response.mjs";
import { supabaseGet }                   from "./lib/supabase.mjs";

export default async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[recipes-get] Missing Supabase env vars");
    return json(500, { ok: false, error: "Server configuration error" });
  }

  try {
    const u        = new URL(req.url);
    const recipeId = (u.searchParams.get("recipeId") || "community").trim();
    const limit    = clampInt(u.searchParams.get("limit") || "50", 1, 200);

    const rows = await supabaseGet(SUPABASE_URL, SUPABASE_ANON_KEY, "recipe_posts", {
      select:    "id,created_at,user_id,display_name,kind,recipe_id,title,body",
      recipe_id: "eq." + recipeId,
      order:     "created_at.desc",
      limit:     String(limit)
    });

    return json(200, { ok: true, rows: Array.isArray(rows) ? rows : [] }, corsHeaders());
  } catch (e) {
    console.error("[recipes-get] Error:", e);
    return json(500, { ok: false, error: "Failed to load posts" });
  }
};

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}
