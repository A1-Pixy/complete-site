# CLIENT_REPLACEMENT_MAP.md — Cart System Package v1

Replace every PD Seasoning value with the new client's value before deploying.

---

## Replacement Table

| PD Seasoning Value | Replace With | Location | Frontend Safe? | Backend Only? | Notes |
| ------------------ | ------------ | -------- | -------------- | ------------- | ----- |
| PD Seasoning / Pixy Dust Seasoning | Client business name | All HTML files, footer copyright, checkout.html header | Yes | No | Search all .html files |
| pdseasoning.com | Client domain | checkout.html error messages, support email references | Yes | No | Grep for `pdseasoning.com` |
| Pixy Dust logo (`PD blk.png`, `PD blk.webp`) | Client logo files | `checkout.html` lines 18-20, `thankyou.html` lines 12-14, all HTML headers | Yes | No | Replace image files and update paths |
| Brand color (champagne gold) | Client primary color | `assets/css/pixy.css` `:root` block | Yes | No | Read CSS before changing |
| Brand color (matte black) | Client secondary color | `assets/css/pixy.css` `:root` block | Yes | No | Read CSS before changing |
| Fonts | Client fonts | `assets/css/pixy.css` @font-face and Google Fonts | Yes | No | Read CSS before changing |
| `assets/images/pouches/`, `assets/images/bottles/` | Client product image folders | `assets/js/products.js` image paths | Yes | No | Upload client images, update paths |
| Product names (Universal All Purpose, etc.) | Client product names | `assets/js/products.js` PRODUCTS array | Yes | No | Update static array; also update Supabase rows |
| Product categories (Pouches, Bottles, etc.) | Client categories | `assets/js/products.js`, Supabase products table | Yes | No | Update both static data and database |
| support@pdseasoning.com | Client support email | `checkout.html` inline script (error message fallback) | Yes | No | Grep for the email address |
| `sandbox-sq0idb-...` (Square App ID) | Client sandbox App ID | Netlify env var `SQUARE_APP_ID` | Via API only | Yes | Set in Netlify dashboard only |
| Square Sandbox Location ID | Client sandbox Location ID | Netlify env var `SQUARE_LOCATION_ID` | Via API only | Yes | Set in Netlify dashboard only |
| Square Sandbox Access Token | Client sandbox Access Token | Netlify env var `SQUARE_ACCESS_TOKEN` | No — never | Yes | Set in Netlify dashboard only. Never in code. |
| `SQUARE_ENVIRONMENT=sandbox` | `sandbox` for testing; `production` for live | Netlify env var `SQUARE_ENVIRONMENT` | Via API only | Yes | Keep sandbox until all tests pass |
| Supabase project URL | Client Supabase URL | Netlify env var `SUPABASE_URL` | No | Yes | Set in Netlify dashboard only |
| Supabase anon key | Client anon key | Netlify env var `SUPABASE_ANON_KEY` | No | Yes | Set in Netlify dashboard only |
| Supabase service role key | Client service role key | Netlify env var `SUPABASE_SERVICE_ROLE_KEY` | No — never | Yes | Set in Netlify dashboard only. Never in code. |
| Admin secret | Client strong password | Netlify env var `ADMIN_SECRET` | No — never | Yes | Choose a strong password. Set in Netlify dashboard only. |
| Order code prefix `PD-` | Client prefix (optional) | `functions/orders-create.mjs` `generateOrderCode()` | No | Yes | Cosmetic only — does not affect payment or DB |
| `pixy_cart_v2` (localStorage key) | Client cart key (optional) | `assets/js/pixy-cart.js` line 24 | Yes | No | Optional — change only if running alongside another site using the same key |
| Free shipping threshold ($37.00) | Client threshold | `functions/orders-create.mjs` line 72 (3700 cents); `checkout.html` line 251 | Partial | Partial | Must match in BOTH files or display and charge will differ |
| Shipping cost ($5.99) | Client rate | `functions/orders-create.mjs` line 72 (599 cents); `checkout.html` line 251 | Partial | Partial | Must match in BOTH files |
| Order notification email | Client notification email | Netlify Forms → form notifications for `order-notification` | No | Yes | Set in Netlify Forms dashboard, not in code |
| Privacy page URL | Client privacy URL | Footer includes in HTML files | Yes | No | UNKNOWN exact location — grep `privacy.html` in all HTML |
| Terms page URL | Client terms URL | Footer includes in HTML files | Yes | No | UNKNOWN exact location — inspect HTML footers |
| Shipping page URL | Client shipping URL | Footer includes in HTML files | Yes | No | UNKNOWN exact location — grep `shipping.html` |
| Refund page URL | Client refund URL | Footer includes in HTML files | Yes | No | UNKNOWN exact location — grep `returns.html` |
| Thank-you page copy | Client copy | `thankyou.html` lines 30-33 | Yes | No | Replace brand name and copy as needed |
| VIP subscribe form (`ty-subscribe`) | Client form name or disable | `thankyou.html` line 49 | Yes | No | Optional — remove or rename for client |
| Footer copyright ("© Pixy Dust Seasoning") | Client copyright | `checkout.html` footer, `thankyou.html` footer, all HTML footers | Yes | No | |
