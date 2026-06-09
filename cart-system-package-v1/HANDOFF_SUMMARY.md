# HANDOFF_SUMMARY.md — Cart System Package v1

---

## What Was Packaged

A complete documentation and template package covering the PD Seasoning cart and checkout system.
26 files covering: discovery evidence, system architecture, function mapping, frontend cart mapping, environment variables, Supabase schema, product templates, setup checklists, branding replacement, Square setup, Netlify setup, email notification, security rules, test plan, rollback plan, protected files, client replacement map, install order, troubleshooting, quality gate, and this handoff summary.

Also created: root-level `CHECKOUT_BASELINE.md` pointer.

---

## What Is Confirmed

- Cart engine file: `assets/js/pixy-cart.js` — localStorage key `pixy_cart_v2`
- Cart drawer file: `assets/js/cart.js`
- Product data file: `assets/js/products.js` — static + live from Supabase
- Checkout page: `checkout.html` — 2-step inline checkout script
- Thank-you page: `thankyou.html`
- Three cart-related Netlify functions: `square-config.mjs`, `products-get.mjs`, `orders-create.mjs`
- Admin function: `products-admin.mjs`
- Shared function helpers: `functions/lib/supabase.mjs`, `functions/lib/response.mjs`
- All required env vars (names only): 14 vars confirmed across function files and netlify.toml
- Supabase tables: `products`, `orders`, `leads` — all confirmed with full schemas from db/ SQL files
- Square API version: `2024-01-18`
- Free shipping threshold: $37.00 (3700 cents) — confirmed in two separate files
- Shipping cost: $5.99 (599 cents)
- Email notification: Netlify Forms `order-notification`
- Order code format: `PD-{base36timestamp}-{4char random}`
- Node runtime: version 18 (from netlify.toml)

---

## What Is Partial

- Netlify deploy status: UNKNOWN — not verifiable from local repo
- Live Square sandbox test result: UNKNOWN — no test run this session
- Supabase live state: UNKNOWN — SQL files confirmed locally, live DB not inspected
- Email notification: Confirmed in code, but whether the Netlify Forms hidden form is present on a deployed page is UNKNOWN

---

## What Is Unknown

- Whether the functions directory mismatch in `netlify.toml` has been resolved in production
- Whether `crypto.randomUUID()` on line 94 of `orders-create.mjs` is currently working in the deployed environment
- Last verified deploy status in Netlify dashboard
- Whether `order-notification` Netlify Form is registered and routing to the owner's email

---

## What Must Be Verified Next

1. Confirm functions directory: `netlify.toml` says `netlify/functions`, actual files are in `functions/` — verify this is resolved in Netlify site settings or fix the toml
2. Test `square-config` endpoint on the live preview URL
3. Test `products-get` endpoint
4. Run a full sandbox checkout to confirm `orders-create`, Supabase save, and email all pass
5. Check Netlify function logs for crypto error or other issues
6. Check Netlify Forms dashboard for `order-notification` registration

---

## What Must Not Happen Next

- Do not switch `SQUARE_ENVIRONMENT` to production without all sandbox tests passing
- Do not merge checkout changes without a passing deploy preview test
- Do not deploy admin changes until the current checkout baseline is confirmed stable
- Do not expose any env var values in code, docs, or logs
- Do not let agents touch checkout code
- Do not run agents without owner approval

---

## Next Approved Phase

Next approved phase: admin/order operations.

Agents remain unapproved.

Do not switch to production Square until all sandbox tests pass and owner approves in writing.
