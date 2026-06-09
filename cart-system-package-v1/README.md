# Cart System Package v1 — PD Seasoning

## What This Package Is

A complete documentation and template package for the PD Seasoning cart and checkout system.
It captures the current working state so the system can be reproduced, adapted, or handed off without guessing.

---

## What Business Problem It Solves

Any small-to-medium product business needs:
- A product catalog that loads from a database
- A cart that persists without a login
- A checkout that charges a payment card
- A record of each order
- A confirmation experience for the customer

This package documents exactly how PD Seasoning built that system using:
- Netlify (hosting + serverless functions)
- Supabase (database)
- Square (payments)
- Vanilla HTML/CSS/JS (zero frontend framework required)

---

## Systems Used

| System | Role |
| ------ | ---- |
| Netlify | Hosting, serverless functions, form submissions |
| Supabase | PostgreSQL database for products and orders |
| Square Web Payments SDK | Card input field and payment tokenization |
| Square Payments API | Backend payment charge |
| localStorage | Cart persistence (no login required) |
| sessionStorage | Order summary display on thank-you page |

---

## Files That Control the Cart

| File | Role |
| ---- | ---- |
| `assets/js/pixy-cart.js` | Cart engine: add, remove, qty, persistence |
| `assets/js/cart.js` | Slide-out drawer UI and cart badge |
| `assets/js/products.js` | Product data (static fallback + live from Supabase) |
| `checkout.html` | 2-step checkout form + Square payment form |
| `thankyou.html` | Order confirmation display |
| `functions/square-config.mjs` | Returns Square public config to frontend |
| `functions/products-get.mjs` | Returns active products from Supabase |
| `functions/orders-create.mjs` | Processes payment and saves order |
| `functions/lib/supabase.mjs` | Supabase REST API helpers |
| `functions/lib/response.mjs` | HTTP response + CORS helpers |

---

## How to Reproduce the System

Follow `INSTALL_ORDER.md` exactly. No step is optional.

Short version:
1. Create Square sandbox app
2. Create Supabase project, run SQL from `db/`
3. Create Netlify site, point to repo
4. Set all env vars in Netlify dashboard
5. Deploy preview branch
6. Test each endpoint and complete a sandbox checkout
7. Only then consider production

---

## How to Adapt for a New Business

Use `CLIENT_REPLACEMENT_MAP.md` to swap every PD Seasoning value.
Use `BRANDING_CONFIG_TEMPLATE.md` for visual and copy changes.
Use `ENV_TEMPLATE.md` to set up environment variables with new credentials.

---

## How to Test Safely

Use `TEST_PLAN.md`. Every test uses sandbox credentials only.
Do not test with production Square credentials until all sandbox tests pass.

---

## How to Avoid Breaking It

Read `DO_NOT_TOUCH.md` before any code change.
Read `SECURITY_RULES.md` before any deploy.
Read `ROLLBACK_PLAN.md` so you know the recovery path before you need it.

---

> This package does not start agents, automate fulfillment, switch production payments, or replace the need for sandbox checkout testing.
