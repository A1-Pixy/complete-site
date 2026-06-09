# CHECKOUT_BASELINE.md — Cart System Package v1

Full checkout baseline. For the root-level pointer, see `../CHECKOUT_BASELINE.md`.

---

## Current State Snapshot

| Item | Status |
| ---- | ------ |
| Live site | https://pdseasoning.com |
| Checkout mode | Sandbox |
| Last passing commit | 4583337 (Fix var scoping, add debug log, bump to v3) |
| Current branch | docs/cart-system-package-v1 |
| PR | UNKNOWN — check GitHub |
| Netlify deploy status | UNKNOWN — check Netlify dashboard |
| square-config | UNKNOWN — not tested this session |
| products-get | UNKNOWN — not tested this session |
| orders-create | UNKNOWN — not tested this session |
| Square sandbox payment | UNKNOWN — not tested this session |
| Supabase order save | UNKNOWN — not tested this session |
| Order email | NOT CONFIRMED — see known issue below |
| Netlify log safety | UNKNOWN — not tested this session |

---

## Known Issue: Functions Directory Mismatch

`netlify.toml` line 5: `directory = "netlify/functions"`

Actual location of functions: `functions/` (root level)

No `netlify/` subdirectory exists in the repo.

**If this has not been corrected in Netlify site settings or via the toml, functions will not deploy.**

Verify in Netlify dashboard → Site settings → Functions → directory.

---

## Known Issue: crypto.randomUUID() in orders-create.mjs

`functions/orders-create.mjs` line 94 uses `crypto.randomUUID()` (global).

In Node 18 (the configured runtime), `crypto` is available as a global, so this may work.

However, if the function fails with `ReferenceError: crypto is not defined`, the fix is:

```js
import { randomUUID } from "node:crypto";
// then use:
randomUUID()
// instead of:
crypto.randomUUID()
```

This fix has NOT been applied in the current codebase. If the error occurs, apply this change before proceeding.

---

## Known Working Functions (last confirmed state)

- `square-config` — Confirmed functional at commit 485d7c4
- `products-get` — Confirmed functional at commit 485d7c4
- `orders-create` — Confirmed functional at commit 485d7c4 (Supabase env vars must be real, not placeholder)

---

## Email Notification

Email is sent via Netlify Forms using form name `order-notification`.
The `sendOrderNotification()` function in `orders-create.mjs` POSTs to the site root (`/`).
This requires Netlify Forms to be enabled and a corresponding hidden form on a page.

**If `order-notification` form is not set up in Netlify Forms, the email will silently fail but the order will still succeed.**

---

## Do Not Touch Warning

Do not modify these files without a complete passing test plan:

- `functions/orders-create.mjs`
- `functions/square-config.mjs`
- `functions/products-get.mjs`
- `netlify.toml`
- `assets/js/pixy-cart.js`
- `assets/js/cart.js`
- `checkout.html`

---

## Next Approved Phase

Next approved phase: admin/order operations.

Agents remain unapproved.

Do not switch to production Square until all sandbox tests pass and owner approves in writing.
