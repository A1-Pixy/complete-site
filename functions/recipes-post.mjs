/*!
 * functions/recipes-post.mjs — Pixy Dust Seasoning
 * POST a new recipe post or comment to Supabase.
 * RLS is enforced via the caller's Supabase access token.
 *
 * Body (JSON):
 *   accessToken  {string}  required — Supabase user JWT
 *   displayName  {string}  required
 *   body         {string}  required
 *   kind         {string}  optional — "comment" | "recipe". Default "comment".
 *   recipeId     {string}  optional — recipe this post belongs to. Default "community".
 *   title        {string}  optional — used for kind === "recipe"
 *
 * Requires env vars:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 */

import { json, handleCors } from "./lib/response.mjs";
import { supabaseInsert }   from "./lib/supabase.mjs";

export default async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[recipes-post] Missing Supabase env vars");
    return json(500, { ok: false, error: "Server configuration error" });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body" });
  }

  const { accessToken, displayName, body: postBody, kind, recipeId, title } = body;

  if (!accessToken)              return json(401, { ok: false, error: "Missing access token" });
  if (!displayName || !postBody) return json(400, { ok: false, error: "displayName and body are required" });

  const payload = {
    display_name: String(displayName).slice(0, 80),
    kind:         kind === "recipe" ? "recipe" : "comment",
    recipe_id:    (recipeId || "community").trim(),
    body:         String(postBody).slice(0, 5000),
    title:        title ? String(title).slice(0, 160) : null
  };

  try {
    await supabaseInsert(SUPABASE_URL, SUPABASE_ANON_KEY, accessToken, "recipe_posts", payload);
    return json(200, { ok: true });
  } catch (e) {
    console.error("[recipes-post] Insert error:", e);
    return json(500, { ok: false, error: "Failed to save post" });
  }
};
