# CHECKOUT_BASELINE.md

Current checkout state snapshot.
Full detail: `cart-system-package-v1/CHECKOUT_BASELINE.md`

---

| Item | Status |
| ---- | ------ |
| Checkout mode | Sandbox |
| Last passing commit | 4583337 |
| Working functions | square-config, products-get, orders-create |
| Known issue | `crypto.randomUUID()` — may need `import { randomUUID } from "node:crypto"` if Node global not available |
| Known issue | `netlify.toml` says `directory = "netlify/functions"` but files are in `functions/` — verify before deploy |
| Email notification | Netlify Forms `order-notification` — confirm form registration |
| Current test status | UNKNOWN — run sandbox checkout test to confirm |
| Next approved phase | Admin/order operations |
| Agents | Unapproved |

**Do not switch to production Square without passing sandbox tests and written owner approval.**
