/*!
 * functions/lib/response.mjs — Pixy Dust Seasoning
 * HTTP response and CORS helpers for Netlify Functions.
 */

/**
 * Returns a JSON Response with the given status and body.
 * Optionally merges extra headers (e.g. CORS headers).
 */
export function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type":  "application/json",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

/**
 * Standard CORS headers for public API endpoints.
 */
export function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin":  origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 * Call at the top of every function handler:
 *   const preflight = handleCors(req);
 *   if (preflight) return preflight;
 */
export function handleCors(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }
  return null;
}
