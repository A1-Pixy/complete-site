# DO_NOT_TOUCH.md — Cart System Package v1

Files that must not be changed without a complete passing test plan.
Any change to these files requires: a deploy preview, a full sandbox checkout test, and Netlify log review.

---

## Protected Files

| File / Area | Why Protected | Required Test Before Merge |
| ----------- | ------------- | -------------------------- |
| `functions/orders-create.mjs` | Processes real payments and saves orders to Supabase. A bug here can result in charges without saved orders, or no charges at all. | Full sandbox checkout test: confirm Square payment, Supabase insert, and email notification all pass |
| `functions/square-config.mjs` | Returns Square credentials to the frontend. A bug here breaks the card input form for all customers. | square-config endpoint test + Square card field test on checkout.html |
| `functions/products-get.mjs` | Powers all product displays. A bug here blanks out the shop. | products-get endpoint test + confirm products render on shop.html and product.html |
| `functions/products-admin.mjs` | Protected CRUD for products. A bug here could corrupt or delete product data. | Admin endpoint test with valid and invalid credentials |
| `functions/lib/supabase.mjs` | Shared by all functions. A bug here breaks all Supabase access. | Full endpoint tests for all three cart functions after any change |
| `functions/lib/response.mjs` | Shared by all functions. A bug here breaks all HTTP responses. | Full endpoint tests for all three cart functions after any change |
| `netlify.toml` | Build config, functions directory, Node version, headers. Wrong functions directory = 404 for all functions. | Full endpoint tests after any change. Confirm functions directory resolves correctly. |
| `assets/js/pixy-cart.js` | Cart engine. Any change to storage key, event names, or API shape breaks cart and checkout. | Full cart test: add, update, remove, persist across reload |
| `assets/js/cart.js` | Cart drawer UI. Breaks the visible cart experience. | Cart open/close, badge update, checkout navigation |
| `assets/js/products.js` | Populates PIXY_PRODUCTS. Breaks all product rendering if changed incorrectly. | Products render correctly on shop.html, product.html, and index.html |
| `checkout.html` | The checkout page. Any change to Square init, form handling, or orders-create call can break checkout. | Full sandbox checkout test end-to-end |
| `thankyou.html` | Order confirmation. Must correctly read order from URL and sessionStorage. | Complete an order and confirm thankyou.html displays correctly |
| `db/products-setup.sql` | Products table schema. Running this on an existing table requires care. | Run only on a test Supabase project first. Confirm no data loss. |
| `db/orders-setup.sql` | Orders table schema. Running this on an existing table with real orders could cause issues if column types change. | Run only after confirming no real orders would be affected |

---

## Special Warning: netlify.toml Functions Directory

Current `netlify.toml` line 5: `directory = "netlify/functions"`
Actual functions location: `functions/` (root)

Do not change `netlify.toml` without:
1. Verifying the correct functions directory
2. Deploying a preview
3. Confirming all three cart functions respond correctly

---

## What You May Change Without Full Checkout Test

- CSS files (visual only, no checkout logic)
- HTML pages that do not include cart or checkout scripts
- Recipe pages (`recipes.html`, `recipes-get.mjs`)
- Static content (about, contact, FAQ, gallery)
- Documentation files in `cart-system-package-v1/`
