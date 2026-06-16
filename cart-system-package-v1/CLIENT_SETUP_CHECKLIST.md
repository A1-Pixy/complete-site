# CLIENT_SETUP_CHECKLIST.md — Cart System Package v1

Step-by-step checklist from zero to working sandbox checkout.
No step is optional.

---

## Phase 1 — Business and Domain Setup

- [ ] 1. Confirm business name and domain
- [ ] 2. Register domain or confirm existing domain is available
- [ ] 3. Identify support email address (used in checkout error messages)
- [ ] 4. Identify order notification email (used for Netlify Forms routing)
- [ ] 5. Gather product list with names, prices, descriptions, images, and categories

---

## Phase 2 — Source Control Setup

- [ ] 6. Clone or fork the repo to your own GitHub account
- [ ] 7. Create a working branch (never work directly on main)
- [ ] 8. Review `DO_NOT_TOUCH.md` before making any file changes

---

## Phase 3 — Square Sandbox Setup

- [ ] 9. Create account at developer.squareup.com
- [ ] 10. Create a new sandbox application
- [ ] 11. Copy sandbox Application ID (format: `sandbox-sq0idb-...`)
- [ ] 12. Copy sandbox Access Token
- [ ] 13. Copy sandbox Location ID
- [ ] 14. Set `SQUARE_ENVIRONMENT=sandbox` for all initial testing

---

## Phase 4 — Supabase Project Setup

- [ ] 15. Create account at supabase.com
- [ ] 16. Create a new project
- [ ] 17. Copy project URL (format: `https://xxxx.supabase.co`)
- [ ] 18. Copy anon (public) key from Project Settings → API
- [ ] 19. Copy service role key from Project Settings → API → service_role (keep secret)

---

## Phase 5 — Supabase Table Setup

- [ ] 20. Open SQL Editor in Supabase dashboard
- [ ] 21. Run `db/products-setup.sql` — creates products table with RLS
- [ ] 22. Run `db/orders-setup.sql` — creates orders table with RLS
- [ ] 23. Run `db/leads-migrate.sql` — creates leads table (VIP capture)
- [ ] 24. Confirm tables appear in Supabase Table Editor

---

## Phase 6 — Product Data

- [ ] 25. Prepare product data using `PRODUCT_IMPORT_TEMPLATE.csv` or `PRODUCT_DATA_TEMPLATE.json`
- [ ] 26. Run `db/products-migrate.sql` or use products-admin function to insert products
- [ ] 27. Confirm at least one product appears in Supabase products table with `active=true`

---

## Phase 7 — Netlify Site Setup

- [ ] 28. Create account at netlify.com
- [ ] 29. Connect Netlify to your GitHub repo
- [ ] 30. Set build command: (leave blank — this project uses no build step)
- [ ] 31. Set publish directory: `.` (current directory)
- [ ] 32. Verify `netlify.toml` functions directory matches actual functions location (see DISCOVERY_NOTES.md — CRITICAL mismatch noted)
- [ ] 33. Confirm Node version: `netlify.toml` sets `NODE_VERSION=18`

---

## Phase 8 — Environment Variables

- [ ] 34. In Netlify dashboard → Site settings → Environment variables, add:
  - `SQUARE_APP_ID` (sandbox value)
  - `SQUARE_LOCATION_ID` (sandbox value)
  - `SQUARE_ACCESS_TOKEN` (sandbox value)
  - `SQUARE_ENVIRONMENT` = `sandbox`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_SECRET` (strong password of your choice)
- [ ] 35. Do not set production Square values until all sandbox tests pass

---

## Phase 9 — Deploy Preview

- [ ] 36. Push branch to GitHub
- [ ] 37. Netlify creates a deploy preview URL
- [ ] 38. Open deploy preview in browser

---

## Phase 10 — Endpoint Checks

- [ ] 39. Visit `[preview-url]/.netlify/functions/square-config`
  - Expect: `{ ok: true, appId: "sandbox-...", locationId: "...", environment: "sandbox" }`
- [ ] 40. Visit `[preview-url]/.netlify/functions/products-get`
  - Expect: `{ ok: true, products: [...] }` with your products
- [ ] 41. Check Netlify function logs for any errors

---

## Phase 11 — Cart Checks

- [ ] 42. Open a product page, click Add to Cart
- [ ] 43. Confirm cart badge updates
- [ ] 44. Open cart drawer, confirm item appears with correct name and price
- [ ] 45. Update quantity — confirm subtotal updates
- [ ] 46. Remove item — confirm cart empties correctly

---

## Phase 12 — Checkout Form Checks

- [ ] 47. Click Proceed to Checkout from cart drawer
- [ ] 48. Confirm checkout.html loads
- [ ] 49. Confirm order summary shows correct items
- [ ] 50. Fill in Step 1 (contact and shipping), click Continue to Payment

---

## Phase 13 — Square Card Field Check

- [ ] 51. Confirm Square card input appears in Step 2
- [ ] 52. Confirm no JavaScript errors in browser console related to Square
- [ ] 53. Confirm `[checkout] Square config loaded. environment: sandbox` appears in browser console

---

## Phase 14 — Sandbox Checkout

- [ ] 54. Enter Square sandbox test card number: `4111 1111 1111 1111`, expiry `01/30`, CVV `111`
- [ ] 55. Click Place Order
- [ ] 56. Confirm redirect to `thankyou.html?order=PD-...`
- [ ] 57. Confirm order code displays on thank-you page
- [ ] 58. Confirm order items display on thank-you page

---

## Phase 15 — Supabase Order Save Check

- [ ] 59. Open Supabase dashboard → Table Editor → orders
- [ ] 60. Confirm the test order record exists with correct fields
- [ ] 61. Confirm `payment_status` = `"paid"`
- [ ] 62. Confirm `square_payment_id` is populated

---

## Phase 16 — Square Sandbox Dashboard Check

- [ ] 63. Open Square Developer Dashboard → Sandbox → Payments
- [ ] 64. Confirm the test payment appears

---

## Phase 17 — Email Notification Check

- [ ] 65. Check Netlify Forms dashboard for `order-notification` submissions
- [ ] 66. If form does not appear, inspect `sendOrderNotification()` in `orders-create.mjs` and add a hidden `order-notification` form to index.html or another page
- [ ] 67. Confirm form submission contains order code, customer name, items, and totals

---

## Phase 18 — Netlify Log Safety Check

- [ ] 68. Open Netlify function logs for `orders-create`
- [ ] 69. Confirm no access tokens, service role keys, or card data appear in logs
- [ ] 70. Confirm only: order_code, payment_status, and Square success ID are logged

---

## Phase 19 — Rollback Readiness

- [ ] 71. Confirm you know the last passing commit hash
- [ ] 72. Confirm you can run a rollback (see ROLLBACK_PLAN.md)

---

## Phase 20 — Production Approval Checklist

- [ ] 73. All sandbox tests have passed
- [ ] 74. Owner has approved in writing
- [ ] 75. Production Square Application ID obtained
- [ ] 76. Production Square Access Token obtained
- [ ] 77. Rollback plan documented
- [ ] 78. CHECKOUT_BASELINE.md updated with new passing state

**Do not switch to production Square until all sandbox tests pass and owner approves in writing.**
