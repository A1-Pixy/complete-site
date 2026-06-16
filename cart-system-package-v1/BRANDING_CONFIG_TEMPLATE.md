# BRANDING_CONFIG_TEMPLATE.md — Cart System Package v1

Replace each PD Seasoning value with the new client's value.
If exact file location is uncertain, the column notes which files to inspect first.

---

## Branding Replacement Table

| Value | PD Seasoning Current | Client Replacement | Repo Location | Status |
| ----- | ------------------- | ------------------ | ------------- | ------ |
| Business name (brand) | Pixy Dust Seasoning / PD Seasoning | Replace with client name | `checkout.html`, `thankyou.html`, `index.html`, all HTML files | Required |
| Domain | pdseasoning.com | Replace with client domain | `checkout.html` error messages (support@pdseasoning.com), all HTML files | Required |
| Support email | support@pdseasoning.com | Replace with client support email | `checkout.html` line ~418 and ~459 | Required |
| Order notification email routing | Netlify Forms `order-notification` | Set up same form name in Netlify dashboard | Netlify Forms dashboard | Required |
| Logo image path | `assets/images/PD blk.png` / `PD blk.webp` | Replace with client logo | `checkout.html` lines 18-20, `thankyou.html` lines 12-14, all HTML headers | Required |
| Primary color (var --gold) | Champagne gold | UNKNOWN — inspect `assets/css/pixy.css` | `assets/css/pixy.css` CSS custom properties | Required |
| Secondary color (var --black) | Matte black | UNKNOWN — inspect `assets/css/pixy.css` | `assets/css/pixy.css` CSS custom properties | Required |
| Accent color | UNKNOWN — inspect CSS | Replace with client accent | `assets/css/pixy.css` | Review |
| Font choices | UNKNOWN — inspect CSS | Replace with client fonts | `assets/css/pixy.css` @font-face or Google Fonts link | Review |
| Product image folder | `assets/images/pouches/`, `assets/images/bottles/` | Replace with client product images | `assets/js/products.js` image paths | Required |
| Product names | Universal All Purpose, Sugar-Free All Purpose, etc. | Replace with client products | `assets/js/products.js` PRODUCTS array | Required |
| Product categories | Pouches, Bottles, Individual Spices, Subscriptions, Gift Sets, Bundles, Grills, Books | Replace with client categories | `assets/js/products.js`, `functions/products-get.mjs` (no hardcoded category filter) | Required |
| Thank-you page copy | "Your Order is Confirmed" / "Thank you for your Pixy Dust order" | Replace with client copy | `thankyou.html` lines 30-33 | Required |
| Error message support link | support@pdseasoning.com | Replace with client support email | `checkout.html` inline script | Required |
| Cart storage key | `pixy_cart_v2` | Optionally replace with client key to avoid conflict | `assets/js/pixy-cart.js` line 24 | Optional |
| Order code prefix | `PD-` | Replace with client prefix | `functions/orders-create.mjs` `generateOrderCode()` function | Optional |
| Free shipping threshold | $37.00 (3700 cents) | Replace with client threshold | `functions/orders-create.mjs` line 72; `checkout.html` line 251 | Required if different |
| Shipping cost | $5.99 (599 cents) | Replace with client shipping rate | `functions/orders-create.mjs` line 72; `checkout.html` line 251 | Required if different |
| VIP subscribe form name | `ty-subscribe` | Replace with client form name | `thankyou.html` line 49 | Optional |
| Privacy page URL | `privacy.html` | Replace with client privacy URL | UNKNOWN — inspect footer includes | Review |
| Terms page URL | UNKNOWN | Replace with client terms URL | UNKNOWN — inspect footer includes | Review |
| Shipping page URL | `shipping.html` | Replace with client shipping URL | UNKNOWN — inspect footer includes | Review |
| Refund page URL | `returns.html` | Replace with client returns URL | UNKNOWN — inspect footer includes | Review |
| Copyright name | © Pixy Dust Seasoning | Replace with client name | `checkout.html` footer, `thankyou.html` footer, all HTML footers | Required |
| Checkout SSL text | "Secure checkout · SSL encrypted · We never store card data" | Optionally customize | `checkout.html` line ~171 | Optional |

---

## Notes

- CSS custom properties control brand colors. Read `assets/css/pixy.css` to find the `:root` block.
- All font choices are in `assets/css/pixy.css`. Do not guess font file paths — read the file first.
- The `order code prefix` (`PD-`) is cosmetic only and does not affect payment or database behavior.
- The free shipping threshold is enforced in BOTH `orders-create.mjs` (server-side) and `checkout.html` (display only). Both must match or the displayed total will differ from the charged total.
