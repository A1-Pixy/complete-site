# SUPABASE_TABLE_MAP.md — Cart System Package v1

---

## Table: products

| Table | Function Reads | Function Writes | Fields Found | Required Fields | Key Level Needed | Notes |
| ----- | -------------- | --------------- | ------------ | --------------- | ---------------- | ----- |
| products | products-get.mjs | products-admin.mjs | id, slug, sku, name, blurb, story, ingredients, full_description, price, compare_at_price, category, tags, image, gallery_images, inventory_count, in_stock, featured, active, sort_order, square_payment_link, ecwid_product_id, created_at, updated_at | sku (NOT NULL), name (NOT NULL), active (NOT NULL), in_stock (NOT NULL), featured (NOT NULL), sort_order (NOT NULL) | anon key for read; service role for write | RLS enforces `active=true` for anon key reads |

---

## Table: orders

| Table | Function Reads | Function Writes | Fields Found | Required Fields | Key Level Needed | Notes |
| ----- | -------------- | --------------- | ------------ | --------------- | ---------------- | ----- |
| orders | None (admin read not yet implemented) | orders-create.mjs | id, order_code, customer_email, first_name, last_name, phone, shipping_address, city, state, zip, items, subtotal_cents, shipping_cents, total_cents, square_payment_id, square_order_id, payment_status, created_at | order_code (UNIQUE NOT NULL), customer_email (NOT NULL), items (NOT NULL), subtotal_cents, shipping_cents, total_cents, payment_status | service role only (RLS blocks public access) | No public read policy. All access via service role key. |

---

## Table: leads

| Table | Function Reads | Function Writes | Fields Found | Required Fields | Key Level Needed | Notes |
| ----- | -------------- | --------------- | ------------ | --------------- | ---------------- | ----- |
| leads | None in cart flow | mailchimp-sync.js | id, email, name, tag, source, created_at | email (NOT NULL) | service role only | Not part of customer checkout flow |

---

## Access Level Reference

| Access Type | Who Uses It | Tables | Notes |
| ----------- | ----------- | ------ | ----- |
| Anon key (`SUPABASE_ANON_KEY`) | `products-get.mjs` | products (read, active only) | Public reads safe. RLS enforces active=true. |
| Service role key (`SUPABASE_SERVICE_ROLE_KEY`) | `orders-create.mjs`, `products-admin.mjs`, `mailchimp-sync.js` | orders (insert), products (all), leads (insert) | Bypasses RLS. Must never appear in frontend code or browser. |

---

## Security Notes

- The anon key is used only for reading active products. It is kept on the backend (Netlify function), not exposed to the browser directly.
- The service role key bypasses Row Level Security on all tables. It must be set only in Netlify environment variables and never returned in any API response.
- The `orders` table has no public read policy. Only the service role key can read orders. A future admin dashboard must use the service role key through a protected backend function, not directly from the browser.
- The `products` table has a policy allowing anon reads of `active=true` products only. Inactive products (drafts, discontinued) are not visible via the anon key.
- Frontend JavaScript must never contain `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`. These values belong only in Netlify environment variables consumed by serverless functions.
