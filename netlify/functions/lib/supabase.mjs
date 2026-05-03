/*!
 * functions/lib/supabase.mjs — Pixy Dust Seasoning
 * Typed Supabase REST API helpers for Netlify Functions.
 * Uses fetch only — no npm package required.
 */

function stripSlash(s) {
  return typeof s === "string" && s.endsWith("/") ? s.slice(0, -1) : s;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

/**
 * Build the Authorization headers for a Supabase request.
 * @param {string} key   - anon key for public reads, or user JWT for user-scoped writes
 * @param {string} anon  - always the anon key (required as apikey header)
 */
export function supabaseHeaders(key, anon = key) {
  return {
    apikey:         anon,
    Authorization:  "Bearer " + key,
    "Content-Type": "application/json",
    Prefer:         "return=representation"
  };
}

/**
 * Build a Supabase REST URL for a given table and query params.
 */
export function supabaseUrl(baseUrl, table, params = {}) {
  const root = stripSlash(baseUrl);
  const qs   = new URLSearchParams(params).toString();
  return root + "/rest/v1/" + table + (qs ? "?" + qs : "");
}

/**
 * GET rows from a Supabase table.
 * @param {string} baseUrl - SUPABASE_URL
 * @param {string} anonKey - SUPABASE_ANON_KEY
 * @param {string} table   - table name
 * @param {object} params  - query params (select, filters, order, limit, etc.)
 * @returns {Promise<any[]>}
 */
export async function supabaseGet(baseUrl, anonKey, table, params = {}) {
  const url = supabaseUrl(baseUrl, table, params);
  const res = await fetch(url, {
    method:  "GET",
    headers: supabaseHeaders(anonKey)
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Supabase GET failed (" + res.status + "): " + text);
  return safeJson(text);
}

/**
 * POST a new row to a Supabase table.
 * Uses the caller's JWT (not the anon key) so RLS applies correctly.
 * @param {string} baseUrl   - SUPABASE_URL
 * @param {string} anonKey   - SUPABASE_ANON_KEY (used as apikey header)
 * @param {string} userJwt   - user's access token (used as Bearer)
 * @param {string} table     - table name
 * @param {object} payload   - data to insert
 * @returns {Promise<any>}
 */
export async function supabaseInsert(baseUrl, anonKey, userJwt, table, payload) {
  const url = supabaseUrl(baseUrl, table);
  const res = await fetch(url, {
    method:  "POST",
    headers: supabaseHeaders(userJwt, anonKey),
    body:    JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Supabase INSERT failed (" + res.status + "): " + text);
  return safeJson(text);
}

/**
 * INSERT using a service role key (bypasses RLS).
 * @param {string} baseUrl     - SUPABASE_URL
 * @param {string} serviceKey  - service_role key
 * @param {string} anonKey     - anon key (used as apikey header)
 * @param {string} table       - table name
 * @param {object} payload     - row data
 */
export async function supabaseServiceInsert(baseUrl, serviceKey, anonKey, table, payload) {
  const url = supabaseUrl(baseUrl, table);
  const res = await fetch(url, {
    method:  "POST",
    headers: supabaseHeaders(serviceKey, anonKey),
    body:    JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Supabase INSERT failed (" + res.status + "): " + text);
  return safeJson(text);
}

/**
 * PATCH (partial update) rows matching the given filter params.
 * @param {string} baseUrl     - SUPABASE_URL
 * @param {string} serviceKey  - service_role key
 * @param {string} anonKey     - anon key (used as apikey header)
 * @param {string} table       - table name
 * @param {object} match       - filter params, e.g. { sku: "eq.my-sku" }
 * @param {object} payload     - fields to update
 */
export async function supabasePatch(baseUrl, serviceKey, anonKey, table, match, payload) {
  const url = supabaseUrl(baseUrl, table, match);
  const res = await fetch(url, {
    method:  "PATCH",
    headers: supabaseHeaders(serviceKey, anonKey),
    body:    JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Supabase PATCH failed (" + res.status + "): " + text);
  return safeJson(text);
}

/**
 * DELETE rows matching the given filter params.
 * @param {string} baseUrl     - SUPABASE_URL
 * @param {string} serviceKey  - service_role key
 * @param {string} anonKey     - anon key (used as apikey header)
 * @param {string} table       - table name
 * @param {object} match       - filter params, e.g. { sku: "eq.my-sku" }
 */
export async function supabaseDeleteRow(baseUrl, serviceKey, anonKey, table, match) {
  const url = supabaseUrl(baseUrl, table, match);
  const res = await fetch(url, {
    method:  "DELETE",
    headers: supabaseHeaders(serviceKey, anonKey)
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Supabase DELETE failed (" + res.status + "): " + text);
  return safeJson(text);
}
