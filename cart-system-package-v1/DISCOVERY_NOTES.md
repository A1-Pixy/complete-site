# DISCOVERY_NOTES.md — Cart System Package v1

All evidence was gathered by direct code inspection of the repo.
Nothing here is assumed. Items not found in code are marked UNKNOWN.

---

## Repo Structure Reviewed

| Area | Path | Notes |
| ---- | ---- | ----- |
| Netlify functions | `functions/` | Contains all .mjs and .js function files |
| Function lib helpers | `functions/lib/` | response.mjs, supabase.mjs |
| Frontend cart | `assets/js/pixy-cart.js` | localStorage cart engine |
| Cart drawer UI | `assets/js/cart.js` | Slide-out drawer + badge |
| Product data | `assets/js/products.js` | Static fallback + live Supabase fetch |
| Shop rendering | `assets/js/shop.js` | Product cards, carousels |
| Checkout page | `checkout.html` | Inline checkout script + Square init |
| Thank-you page | `thankyou.html` | Order confirm + sessionStorage display |
| Netlify config | `netlify.toml` | Build, functions, headers config |
| Supabase schema | `db/products-setup.sql` | Full products table schema |
| Supabase schema | `db/orders-setup.sql` | Orders table schema |
| Supabase schema | `db/leads-migrate.sql` | Leads table schema |
| Admin function | `functions/products-admin.mjs` | Protected CRUD for products |
| Node version | `netlify.toml` line 9 | NODE_VERSION = "18" |

### CRITICAL FINDING — Functions Directory Mismatch

`netlify.toml` line 5 states: `directory = "netlify/functions"`

The actual functions are located in: `functions/` (root level).

There is no `netlify/` subdirectory in the repo.

**This must be verified before any deploy.** If `netlify.toml` is not corrected to `directory = "functions"`, deployed functions will not be found by Netlify.

---

## Cart Files Found

| File | Evidence | Confidence |
| ---- | -------- | ---------- |
| `assets/js/pixy-cart.js` | Defines `window.PIXY_CART` API; uses `localStorage` key `pixy_cart_v2` | Confirmed |
| `assets/js/cart.js` | Slide-out cart drawer; listens to `pixy:cart:change`; wires `PIXY_CART.open/close` | Confirmed |
| `checkout.html` | Inline checkout script; reads `window.PIXY_CART`; falls back to `localStorage.getItem("pixy_cart_v2")` | Confirmed |

---

## Checkout Frontend Files Found

| File | Evidence | Confidence |
| ---- | -------- | ---------- |
| `checkout.html` | 2-step checkout form (shipping + payment); calls `square-config`, mounts Square card, calls `orders-create`, redirects to `thankyou.html` | Confirmed |
| `thankyou.html` | Reads `?order=` URL param; reads `sessionStorage.getItem("pixy_last_order")`; includes VIP subscribe form | Confirmed |
| `assets/js/products.js` | Fetches `/.netlify/functions/products-get?limit=500` on page load; populates `window.PIXY_PRODUCTS` | Confirmed |

---

## Netlify Functions Found

| Function | File | Evidence | Confidence |
| -------- | ---- | -------- | ---------- |
| `square-config` | `functions/square-config.mjs` | Returns `appId`, `locationId`, `sdkUrl`, `environment` from env vars; no secrets exposed | Confirmed |
| `products-get` | `functions/products-get.mjs` | GET active products from Supabase `products` table; anon key | Confirmed |
| `orders-create` | `functions/orders-create.mjs` | POST order: validates, charges Square, saves to Supabase `orders`, sends email via Netlify Forms | Confirmed |
| `products-admin` | `functions/products-admin.mjs` | Protected CRUD for products; requires `x-admin-secret` header | Confirmed |
| `chat` | `functions/chat.mjs` | AI chatbot function (Gemini fallback) — not part of cart flow | Confirmed |
| `gemini` | `functions/gemini.js` | AI assistant (Gemini API) — not part of cart flow | Confirmed |
| `mailchimp-sync` | `functions/mailchimp-sync.js` | Mailchimp/lead sync — not part of cart flow | Confirmed |
| `recipes-get` | `functions/recipes-get.mjs` | Recipe data fetch — not part of cart flow | Confirmed |
| `recipes-post` | `functions/recipes-post.mjs` | Recipe submission — not part of cart flow | Confirmed |

---

## Env Vars Found

All env vars were extracted from actual code files only.

| Env Var | File | Purpose | Frontend Safe? | Confidence |
| ------- | ---- | ------- | -------------- | ---------- |
| `SQUARE_APP_ID` | `functions/square-config.mjs`, `netlify.toml` | Square Web Payments App ID; returned to frontend | Yes (public app ID) | Confirmed |
| `SQUARE_LOCATION_ID` | `functions/square-config.mjs`, `functions/orders-create.mjs`, `netlify.toml` | Square Location ID | Yes via square-config response | Confirmed |
| `SQUARE_ACCESS_TOKEN` | `functions/orders-create.mjs`, `netlify.toml` | Square API payment token | No — backend only | Confirmed |
| `SQUARE_ENVIRONMENT` | `functions/square-config.mjs`, `functions/orders-create.mjs`, `netlify.toml` | `"sandbox"` or `"production"` | Via square-config response only | Confirmed |
| `SUPABASE_URL` | `functions/products-get.mjs`, `functions/orders-create.mjs`, `functions/products-admin.mjs`, `netlify.toml` | Supabase project URL | No — backend only | Confirmed |
| `SUPABASE_ANON_KEY` | `functions/products-get.mjs`, `functions/products-admin.mjs`, `netlify.toml` | Supabase public (anon) key | No — kept backend | Confirmed |
| `SUPABASE_SERVICE_ROLE_KEY` | `functions/orders-create.mjs`, `functions/products-admin.mjs`, `netlify.toml` | Supabase service role — bypasses RLS | No — backend only, never frontend | Confirmed |
| `ADMIN_SECRET` | `functions/products-admin.mjs`, `netlify.toml` | Admin endpoint password | No — backend only | Confirmed |
| `GEMINI_API_KEY` | `netlify.toml` | Google Gemini AI key | No | Confirmed (comment in toml) |
| `MAILCHIMP_API_KEY` | `netlify.toml` | Mailchimp key | No | Confirmed (comment in toml) |
| `MAILCHIMP_SERVER_PREFIX` | `netlify.toml` | Mailchimp data center prefix | No | Confirmed (comment in toml) |
| `MAILCHIMP_AUDIENCE_ID` | `netlify.toml` | Mailchimp list ID | No | Confirmed (comment in toml) |
| `URL` | `functions/orders-create.mjs` line 177 | Netlify's own site URL (auto-set by Netlify) | No | Confirmed (used for email notification POST) |

---

## Supabase Tables and Fields Found

### Table: `products`

Source: `db/products-setup.sql` (full schema) and `functions/products-get.mjs` (SELECT fields)

| Table | Field | Found In | Read/Write | Confidence |
| ----- | ----- | -------- | ---------- | ---------- |
| products | id | db/products-setup.sql | Read | Confirmed |
| products | slug | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | sku | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | name | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | blurb | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | story | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | ingredients | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | full_description | db/products-setup.sql | Read (admin only) | Confirmed |
| products | price | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | compare_at_price | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | category | db/products-setup.sql, products-get.mjs SELECT | Read/Filter | Confirmed |
| products | tags | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | image | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | gallery_images | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | inventory_count | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | in_stock | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | featured | db/products-setup.sql, products-get.mjs SELECT | Read/Filter | Confirmed |
| products | active | db/products-setup.sql, products-get.mjs SELECT | Read/Filter | Confirmed |
| products | sort_order | db/products-setup.sql, products-get.mjs SELECT | Read/Order | Confirmed |
| products | square_payment_link | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | ecwid_product_id | db/products-setup.sql, products-get.mjs SELECT | Read | Confirmed |
| products | created_at | db/products-setup.sql | Read | Confirmed |
| products | updated_at | db/products-setup.sql | Read | Confirmed |

### Table: `orders`

Source: `db/orders-setup.sql` (schema) and `functions/orders-create.mjs` (INSERT payload)

| Table | Field | Found In | Read/Write | Confidence |
| ----- | ----- | -------- | ---------- | ---------- |
| orders | id | db/orders-setup.sql | Auto (bigserial) | Confirmed |
| orders | order_code | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | customer_email | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | first_name | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | last_name | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | phone | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | shipping_address | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | city | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | state | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | zip | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | items | orders-create.mjs, db/orders-setup.sql | Write (JSONB array) | Confirmed |
| orders | subtotal_cents | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | shipping_cents | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | total_cents | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | square_payment_id | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | square_order_id | orders-create.mjs, db/orders-setup.sql | Write | Confirmed |
| orders | payment_status | orders-create.mjs, db/orders-setup.sql | Write (`"paid"` / `"pending"` / `"unpaid"`) | Confirmed |
| orders | created_at | db/orders-setup.sql | Auto | Confirmed |

### Table: `leads`

Source: `db/leads-migrate.sql`

| Table | Field | Found In | Read/Write | Confidence |
| ----- | ----- | -------- | ---------- | ---------- |
| leads | id | db/leads-migrate.sql | Auto (UUID) | Confirmed |
| leads | email | db/leads-migrate.sql | Write | Confirmed |
| leads | name | db/leads-migrate.sql | Write | Confirmed |
| leads | tag | db/leads-migrate.sql | Write | Confirmed |
| leads | source | db/leads-migrate.sql | Write | Confirmed |
| leads | created_at | db/leads-migrate.sql | Auto | Confirmed |

---

## Square Config Found

| Config Name | Found In | Frontend/Backend | Purpose | Confidence |
| ----------- | -------- | ---------------- | ------- | ---------- |
| `SQUARE_APP_ID` | `square-config.mjs` | Backend → returned to frontend via API | Square Web Payments SDK app ID | Confirmed |
| `SQUARE_LOCATION_ID` | `square-config.mjs`, `orders-create.mjs` | Backend → returned to frontend via API; used backend for payment | Location ID | Confirmed |
| `SQUARE_ENVIRONMENT` | `square-config.mjs`, `orders-create.mjs` | Backend only | Controls sandbox vs production | Confirmed |
| `SQUARE_ACCESS_TOKEN` | `orders-create.mjs` | Backend only — never returned to frontend | API auth for payment creation | Confirmed |
| Square API base URL (sandbox) | `orders-create.mjs` line 83 | Backend | `https://connect.squareupsandbox.com` | Confirmed |
| Square API base URL (production) | `orders-create.mjs` line 82 | Backend | `https://connect.squareup.com` | Confirmed |
| Square API version | `orders-create.mjs` line 89 | Backend | `"2024-01-18"` | Confirmed |
| Square SDK URL (sandbox) | `square-config.mjs` line 59 | Returned to frontend | `https://sandbox.web.squarecdn.com/v1/square.js` | Confirmed |
| Square SDK URL (production) | `square-config.mjs` line 58 | Returned to frontend | `https://web.squarecdn.com/v1/square.js` | Confirmed |

---

## Unknowns

| Unknown Item | Why Unknown | How To Verify |
| ------------ | ----------- | ------------- |
| Functions directory deploy path | `netlify.toml` says `netlify/functions` but code is in `functions/` — no `netlify/` dir exists | Confirm in Netlify dashboard or run `netlify dev` and observe function loading |
| Whether `crypto.randomUUID()` is working | `orders-create.mjs` line 94 uses global `crypto.randomUUID()` — may fail if Node runtime doesn't expose it as global | Run `netlify dev`, place a sandbox order, observe Netlify function logs |
| Last successful deploy hash | Not determinable from local git log | Check Netlify dashboard deploy history |
| Current Netlify deploy status | No deploy tool available | Check Netlify dashboard |
| Current Square sandbox test result | No live test available | Run sandbox checkout test |
| Whether `leads` table is wired to cart/checkout flow | Not found in cart or checkout code — appears to be a separate VIP capture flow | Inspect `mailchimp-sync.js` and VIP capture forms |
| Whether `orders-setup.sql` and `products-setup.sql` were already run against production Supabase | SQL files exist locally but Supabase state is not verifiable from repo | Check Supabase dashboard table list |
| Shipping threshold logic confirmation | `orders-create.mjs` line 72: free shipping at `>= $37` (3700 cents). `checkout.html` line 251: free at `>= 37`. Both match but need live test confirmation | Run sandbox order above and below $37 |
