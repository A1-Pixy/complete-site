# CART_PACKAGE_MANIFEST.md — Cart System Package v1

Master index of every file in this package and every repo file involved in the cart system.

---

## Package Files

| Package File | Purpose | Depends On Repo Evidence? |
| ------------ | ------- | ------------------------- |
| README.md | Package overview and quick-start | Yes |
| DISCOVERY_NOTES.md | Raw evidence log from repo inspection | Yes — direct evidence |
| CART_PACKAGE_MANIFEST.md | This file — master index | Yes |
| CHECKOUT_BASELINE.md | Current state snapshot | Yes |
| SYSTEM_ARCHITECTURE.md | Full system flow and component map | Yes |
| FUNCTION_MAP.md | Netlify function documentation | Yes |
| FRONTEND_CART_MAP.md | Frontend cart API and page map | Yes |
| ENV_TEMPLATE.md | Environment variable template | Yes — vars extracted from code only |
| SUPABASE_SCHEMA_TEMPLATE.sql | Reusable SQL for Supabase setup | Yes — from db/ SQL files |
| SUPABASE_TABLE_MAP.md | Table-by-table Supabase reference | Yes |
| PRODUCT_IMPORT_TEMPLATE.csv | CSV template for product import | Yes — columns from products-get.mjs |
| PRODUCT_DATA_TEMPLATE.json | JSON product template | Yes — from products.js structure |
| CLIENT_SETUP_CHECKLIST.md | Zero-to-checkout setup checklist | Yes |
| BRANDING_CONFIG_TEMPLATE.md | Branding replacement template | Yes |
| SQUARE_SETUP_GUIDE.md | Square setup documentation | Yes |
| NETLIFY_SETUP_GUIDE.md | Netlify setup documentation | Yes — from netlify.toml |
| EMAIL_NOTIFICATION_SETUP.md | Email notification documentation | Yes — from orders-create.mjs |
| SECURITY_RULES.md | Security rules reference | Yes |
| TEST_PLAN.md | Full checkout test plan | Yes |
| ROLLBACK_PLAN.md | Rollback procedure | Yes |
| DO_NOT_TOUCH.md | Protected files list | Yes |
| CLIENT_REPLACEMENT_MAP.md | PD Seasoning value replacement map | Yes |
| INSTALL_ORDER.md | Numbered install order | Yes |
| TROUBLESHOOTING.md | Failure mode reference | Yes |
| PACKAGE_QUALITY_GATE.md | Final quality checklist | Yes |
| HANDOFF_SUMMARY.md | Package handoff summary | Yes |

---

## Actual Repo Files Involved in Cart System

| Actual Repo File | Role In Cart System | Confidence |
| ---------------- | ------------------- | ---------- |
| `functions/square-config.mjs` | Returns Square SDK config (appId, locationId, sdkUrl) to frontend | Confirmed |
| `functions/products-get.mjs` | Returns active product list from Supabase products table | Confirmed |
| `functions/orders-create.mjs` | Processes Square payment; saves order to Supabase; sends email notification | Confirmed |
| `functions/products-admin.mjs` | Protected CRUD for products table — admin only | Confirmed |
| `functions/lib/supabase.mjs` | Supabase REST API helpers used by all functions | Confirmed |
| `functions/lib/response.mjs` | HTTP response helpers (json, CORS) used by all functions | Confirmed |
| `assets/js/pixy-cart.js` | Cart engine: localStorage persistence, add/remove/qty, public API | Confirmed |
| `assets/js/cart.js` | Cart drawer UI, badge updates, checkout button | Confirmed |
| `assets/js/products.js` | Product data: static PIXY_PRODUCTS + live fetch from products-get | Confirmed |
| `assets/js/shop.js` | Product card rendering for shop.html and category pages | Confirmed |
| `checkout.html` | 2-step checkout; Square card form; calls orders-create | Confirmed |
| `thankyou.html` | Order confirmation page; reads order from URL + sessionStorage | Confirmed |
| `netlify.toml` | Build config, functions directory, Node version, headers | Confirmed |
| `db/products-setup.sql` | Products table schema and RLS policy | Confirmed |
| `db/orders-setup.sql` | Orders table schema and indexes | Confirmed |
| `db/leads-migrate.sql` | Leads table schema (VIP capture — not cart flow) | Confirmed |
| `db/products-migrate.sql` | Initial product data migration | Confirmed |

---

## Actual Env Vars Found (names only)

Extracted from code files only. No values listed.

- `SQUARE_APP_ID`
- `SQUARE_LOCATION_ID`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_ENVIRONMENT`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SECRET`
- `GEMINI_API_KEY`
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_SERVER_PREFIX`
- `MAILCHIMP_AUDIENCE_ID`
- `URL` (auto-set by Netlify)

---

## Actual Functions Found (cart-relevant)

- `square-config` — `functions/square-config.mjs`
- `products-get` — `functions/products-get.mjs`
- `orders-create` — `functions/orders-create.mjs`

---

## Pages That Use Cart System

| Page | Products Load | Cart Visible | Checkout |
| ---- | ------------- | ------------ | -------- |
| `shop.html` | Yes (via products.js) | Yes (cart.js) | Via drawer → checkout.html |
| `product.html` | Yes (via products.js) | Yes (cart.js) | Via drawer → checkout.html |
| `index.html` | Yes (via products.js) | Yes (cart.js) | Via drawer → checkout.html |
| `gifting.html` | Yes (via products.js) | Yes (cart.js) | Via drawer → checkout.html |
| `juniors.html` | Yes (via products.js) | Yes (cart.js) | Via drawer → checkout.html |
| `checkout.html` | Yes (products.js for cart) | Inline | Is the checkout page |
| `thankyou.html` | No | No | Is the success page |
