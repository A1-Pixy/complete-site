# FUNCTION_MAP.md — Cart System Package v1

Only functions confirmed in the repo are documented here.

---

## Function: square-config

| Field | Detail |
| ----- | ------ |
| Function name | square-config |
| File path | `functions/square-config.mjs` |
| Purpose | Returns the Square Web Payments SDK public configuration to the frontend. No secret keys returned. |
| HTTP method | GET (also handles OPTIONS preflight) |
| Inputs | None — reads from env vars only |
| Outputs | `{ ok: true, appId, locationId, sdkUrl, environment }` on success; `{ ok: false, error }` on failure |
| Env vars used | `SQUARE_APP_ID`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT` |
| Called by | `checkout.html` inline script — `fetchSquareConfig()` function |
| Supabase access | None |
| Square access | None (read-only env var check) |
| Email behavior | None |
| Security notes | Validates that environment matches App ID prefix (sandbox- vs sq0idp-). Returns 500 if mismatch detected. App ID and Location ID are public-safe Square values. Access token is never returned. |
| Failure points | Missing `SQUARE_APP_ID` or `SQUARE_LOCATION_ID` → 500. Env mismatch (sandbox ID + production env) → 500. Checkout falls back to placeholder mode. |
| Confidence | Confirmed |

---

## Function: products-get

| Field | Detail |
| ----- | ------ |
| Function name | products-get |
| File path | `functions/products-get.mjs` |
| Purpose | Returns active products from the Supabase `products` table. Supports filtering by category, slug, sku, and featured flag. |
| HTTP method | GET (also handles OPTIONS preflight) |
| Inputs | Query params: `category` (exact), `slug` (exact), `sku` (exact), `featured=true`, `limit` (1–500, default 500) |
| Outputs | `{ ok: true, products: [...] }` on success; `{ ok: false, error }` on failure |
| Env vars used | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Called by | `assets/js/products.js` — `fetchLive()` function on page load |
| Supabase access | GET from `products` table; RLS enforces `active=true` for anon key; function also adds `active=eq.true` explicitly |
| Square access | None |
| Email behavior | None |
| Security notes | Uses anon key — only active products are readable via RLS policy. Service role key is not used here. No customer data involved. |
| Failure points | Missing or placeholder Supabase env vars → 500. Supabase error → 500 with detail. Static fallback data in products.js remains if this fails. |
| Confidence | Confirmed |

Selected fields returned (from `SELECT_FIELDS` constant):
`id, slug, sku, name, blurb, story, ingredients, price, compare_at_price, category, tags, image, gallery_images, inventory_count, in_stock, featured, active, sort_order, square_payment_link, ecwid_product_id`

---

## Function: orders-create

| Field | Detail |
| ----- | ------ |
| Function name | orders-create |
| File path | `functions/orders-create.mjs` |
| Purpose | Validates the order, charges the Square payment token, saves the order to Supabase, sends an email notification via Netlify Forms. |
| HTTP method | POST (also handles OPTIONS preflight) |
| Inputs | JSON body: `{ items: [{ key, title, price, qty, image }], shipping: { email, firstName, lastName, address, city, state, zip, phone }, subtotal: number, payment: { status: "square"\|"placeholder", token: string\|null } }` |
| Outputs | `{ ok: true, orderCode }` on success (201); `{ ok: false, error }` on failure; `{ ok: true, orderCode, warning }` on partial success (207 — payment captured but DB write failed) |
| Env vars used | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT`, `URL` (auto, for Netlify Forms POST) |
| Called by | `checkout.html` inline script — Place Order button handler |
| Supabase access | INSERT into `orders` table using service role key (bypasses RLS) |
| Square access | POST to Square Payments API `/v2/payments`; API version `2024-01-18` |
| Email behavior | After successful order save, POSTs to Netlify Forms (`order-notification`). Failure is logged but does not block the order response. |
| Security notes | Totals are recalculated server-side. Client subtotal is ignored for charging purposes. Free shipping threshold: $37.00 (3700 cents). Shipping: $5.99 (599 cents) if below threshold. Service role key must never appear in frontend code. Square access token must never appear in frontend code. |
| Failure points | Payment captured but DB write failed → 207 partial success (order code returned, customer not stranded). Square payment fails → 402. Invalid JSON body → 400. Missing items or shipping → 400. Supabase env missing → 500. |
| Confidence | Confirmed |

### Known Issue: crypto.randomUUID()

Line 94 uses `crypto.randomUUID()` (global). In Node 18 this may work.
If it fails with `ReferenceError: crypto is not defined`, fix:

```js
import { randomUUID } from "node:crypto";
// use randomUUID() instead of crypto.randomUUID()
```

This fix has not been applied in the current codebase.

### Order Code Format

`"PD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2,6).toUpperCase()`

Example: `PD-M1X2Y3Z4-AB12`

### Payment Status Values (saved to Supabase)

- `"paid"` — Square payment ID present
- `"pending"` — placeholder mode (payment.status === "placeholder")
- `"unpaid"` — no payment token and not placeholder

---

## Function: products-admin

| Field | Detail |
| ----- | ------ |
| Function name | products-admin |
| File path | `functions/products-admin.mjs` |
| Purpose | Protected CRUD endpoint for the products table. Not part of customer cart flow. |
| HTTP method | GET (list all), POST (create/update), DELETE (delete by slug) |
| Inputs | Header: `x-admin-secret`. POST body: `{ op: "create"\|"update", product: {...} }`. DELETE param: `?slug=abc` |
| Outputs | Product data or `{ ok: false, error }` |
| Env vars used | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ADMIN_SECRET` |
| Called by | Admin dashboard (not part of customer checkout flow) |
| Supabase access | GET, INSERT, PATCH, DELETE on `products` table using service role key |
| Square access | None |
| Email behavior | None |
| Security notes | Requires `x-admin-secret` header matching `ADMIN_SECRET` env var. All writes use service role key. Never expose ADMIN_SECRET in frontend code. |
| Failure points | Wrong or missing admin secret → 401. Missing Supabase env → 500. |
| Confidence | Confirmed |

---

## Other Functions (not cart-related)

| Function | File | Cart Role |
| -------- | ---- | --------- |
| chat | `functions/chat.mjs` | None — AI chatbot |
| gemini | `functions/gemini.js` | None — AI assistant |
| mailchimp-sync | `functions/mailchimp-sync.js` | None — VIP/lead sync |
| recipes-get | `functions/recipes-get.mjs` | None — recipe data |
| recipes-post | `functions/recipes-post.mjs` | None — recipe submissions |
