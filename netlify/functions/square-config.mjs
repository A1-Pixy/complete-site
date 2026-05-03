/*!
 * netlify/functions/square-config.mjs — Pixy Dust Seasoning
 *
 * GET /.netlify/functions/square-config
 * Returns the Square Web Payments SDK public config (App ID, Location ID,
 * SDK URL) derived from env vars.  No secret keys are returned.
 *
 * Env vars required:
 *   SQUARE_APP_ID         — Square application ID
 *                           sandbox: "sandbox-sq0idb-..."
 *                           production: "sq0idp-..."
 *   SQUARE_LOCATION_ID    — Square location ID
 *   SQUARE_ENVIRONMENT    — "sandbox" | "production"  (default "production")
 */

import { json, handleCors, corsHeaders } from "./lib/response.mjs";

export default async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const appId       = process.env.SQUARE_APP_ID;
  const locationId  = process.env.SQUARE_LOCATION_ID;
  const environment = (process.env.SQUARE_ENVIRONMENT || "production").trim().toLowerCase();

  console.log("[square-config] SQUARE_APP_ID set:", !!appId,
    "| starts with sandbox-:", !!(appId && appId.startsWith("sandbox-")));
  console.log("[square-config] SQUARE_LOCATION_ID set:", !!locationId);
  console.log("[square-config] SQUARE_ENVIRONMENT:", environment);

  if (!appId || !locationId) {
    const missing = [!appId && "SQUARE_APP_ID", !locationId && "SQUARE_LOCATION_ID"].filter(Boolean).join(", ");
    console.error("[square-config] ❌ Missing env var(s):", missing);
    return json(500, {
      ok:     false,
      error:  "Square not configured — set SQUARE_APP_ID and SQUARE_LOCATION_ID in Netlify env",
      detail: "Missing: " + missing
    }, corsHeaders());
  }

  const isSandboxId  = appId.startsWith("sandbox-");
  const isProduction = environment === "production";

  if (isProduction && isSandboxId) {
    console.error(
      "[square-config] ❌ Environment mismatch: SQUARE_ENVIRONMENT=production but",
      "SQUARE_APP_ID starts with 'sandbox-'.",
      "Set SQUARE_APP_ID to your production App ID (sq0idp-...) in Netlify Site settings."
    );
    return json(500, {
      ok:     false,
      error:  "Square environment mismatch: sandbox App ID used in production. Set SQUARE_APP_ID=sq0idp-... in Netlify env.",
      detail: "SQUARE_APP_ID starts with 'sandbox-' but SQUARE_ENVIRONMENT=production"
    }, corsHeaders());
  }

  if (!isProduction && !isSandboxId) {
    console.warn("[square-config] ⚠️  SQUARE_ENVIRONMENT is not 'production' but App ID does not start with 'sandbox-'.");
  }

  const sdkUrl = isProduction
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

  console.log("[square-config] ✅ Returning config. environment:", environment, "| sdkUrl:", sdkUrl);

  return json(200, {
    ok:          true,
    appId,
    locationId,
    sdkUrl,
    environment
  }, corsHeaders());
};
