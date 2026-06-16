# FRONTEND_CART_MAP.md — Cart System Package v1

---

## Cart File Location

The cart engine is in `assets/js/pixy-cart.js`.
The cart drawer UI is in `assets/js/cart.js`.
Both are vanilla JS, no framework, no npm dependency.

---

## Global Cart Object

`window.PIXY_CART` — exposed by `pixy-cart.js`

### Public API

| Method | Signature | Purpose |
| ------ | --------- | ------- |
| add | `add(product, qty)` | Add a full product object to cart |
| addByKey | `addByKey(key, qty)` | Add by product key (looks up in PIXY_PRODUCTS) |
| addByEcwidId | `addByEcwidId(ecwidId, qty)` | Add by legacy Ecwid product ID |
| remove | `remove(key)` | Remove all qty of a product |
| setQty | `setQty(key, qty)` | Set exact qty (0 = remove) |
| getCart | `getCart()` | Returns `{ items, subtotal, count }` |
| clear | `clear()` | Empty the cart |
| open | `open()` | Open cart drawer (set by cart.js at DOMContentLoaded) |
| close | `close()` | Close cart drawer (set by cart.js at DOMContentLoaded) |

---

## Cart Storage Method

`localStorage` — persists across page loads, no login required.

### LocalStorage Keys

| Key | Type | Contents |
| --- | ---- | -------- |
| `pixy_cart_v2` | JSON string | Array of cart items: `[{ key, title, price, image, category, ecwidProductId, qty }]` |

### SessionStorage Keys

| Key | Type | Contents | Set Where |
| --- | ---- | -------- | --------- |
| `pixy_last_order` | JSON string | `{ items: [...], subtotal: number }` | `checkout.html` after successful order |

---

## Cart Item Object Structure

Each item stored in `pixy_cart_v2`:

```json
{
  "key": "deep-blue-seafood",
  "title": "Deep Blue Seafood",
  "price": 13.00,
  "image": "assets/images/pouches/seafood.webp",
  "category": "Pouches",
  "ecwidProductId": 808797918,
  "qty": 2
}
```

---

## Cart Events

| Event Name | Fired By | Detail Shape |
| ---------- | -------- | ------------ |
| `pixy:cart:change` | `pixy-cart.js` after any mutation or on DOMContentLoaded | `{ items, subtotal, count }` |
| `pixy:cart:added` | `pixy-cart.js` add() function | `{ product, qty, cart }` |
| `pixy:products:ready` | `assets/js/products.js` after live fetch | `{ products: [...] }` |

---

## Product Data

`window.PIXY_PRODUCTS` — array of product objects, exposed by `products.js`.

Set immediately with static data. Replaced with live Supabase data when `products-get` responds.

### Static Product Object Shape (from products.js)

```js
{
  key: "deep-blue-seafood",
  title: "Deep Blue Seafood",
  story: "...",
  ingredients: "...",
  category: "Pouches",
  price: 13.00,
  image: "assets/images/pouches/seafood.webp",
  blurb: "...",
  ecwidProductId: 808797918
}
```

### Live Product Object Shape (from products-get response)

After `fetchLive()` runs, PIXY_PRODUCTS is replaced with Supabase-mapped objects:

```js
{
  key: (p.slug || p.sku),
  title: p.name,
  blurb: p.blurb,
  story: p.story,
  ingredients: p.ingredients,
  price: p.price,
  compareAtPrice: p.compare_at_price,
  image: p.image,
  galleryImages: [...],
  category: p.category,
  sku: p.sku,
  tags: [...],
  featured: boolean,
  inStock: boolean,
  active: boolean,
  sort_order: number,
  freeShipping: (category === "Gift Sets"),
  squarePaymentLink: p.square_payment_link,
  ecwidProductId: p.ecwid_product_id
}
```

---

## Product Card Data Attributes

Products are identified in HTML cards by the card's `id` attribute matching the product `key`.

Example: `<article class="card product" id="deep-blue-seafood">...</article>`

Add-to-cart calls use `data-key` attributes on buttons. Example:

```html
<button data-action="inc" data-key="deep-blue-seafood">+</button>
```

---

## Checkout Button Handler

`cart.js` renders a checkout button:

```html
<a href="checkout.html" class="btn btn-gold cart-drawer-checkout">Proceed to Checkout</a>
```

On click, closes the drawer and navigates to `checkout.html`.

---

## Square Initialization (checkout.html)

```
1. fetchSquareConfig() → GET /.netlify/functions/square-config
2. loadScript(squareCfg.sdkUrl, callback)
3. initSquarePayments():
   - window.Square.payments(appId, locationId) → _payments
   - _payments.card() → _card
   - _card.attach("#card-container")
4. Place Order:
   - _card.tokenize() → result.token
   - POST /.netlify/functions/orders-create with token
```

Fallback: if Square fails to initialize, checkout continues in placeholder mode (no card charge, order saved as payment_status = "pending").

Local dev bypass: if port is 5500 or 5501 (VS Code Live Server), Netlify functions are unreachable — a simulated success redirects to thankyou.html with a fake order ID.

---

## Pages That Call products-get

`assets/js/products.js` calls `products-get` on every page that includes the script.
Pages that include `products.js`:

- `checkout.html` (via `<script src="assets/js/products.js" defer>`)
- `thankyou.html` (via `<script src="assets/js/pixy-cart.js" defer>` — pixy-cart reads PIXY_PRODUCTS)
- All pages that include the standard header script block

---

## Pages That Call square-config

- `checkout.html` only — `fetchSquareConfig()` is called when the customer reaches Step 2

---

## Pages That Call orders-create

- `checkout.html` only — Place Order button handler

---

## Pages That Include Cart UI

Any page that loads both `pixy-cart.js` and `cart.js` will have the cart drawer and badge.
This includes: `index.html`, `shop.html`, `product.html`, `gifting.html`, `juniors.html`, and others that load the standard script block.

---

## Pages That Display Products

| Page | How Products Render |
| ---- | ------------------- |
| `shop.html` | Static HTML cards enhanced by `shop.js` using PIXY_PRODUCTS |
| `product.html` | Single product detail loaded from PIXY_PRODUCTS via URL key param |
| `index.html` | Category carousels built by `shop.js` |
| `gifting.html` | Gift set cards built by `shop.js` |
| `juniors.html` | Juniors product cards built by `shop.js` |

---

## Rebuild Notes

To rebuild the cart in another site, a future developer must:

1. Copy `assets/js/pixy-cart.js` — no changes needed for a new business (update `STORAGE_KEY` to avoid conflicts with old data if deploying alongside another site).
2. Copy `assets/js/cart.js` — update checkout URL (`checkout.html`), badge selectors if nav changes.
3. Copy `assets/js/products.js` — replace static PRODUCTS array with the new business's products; update the fetch URL if the Netlify function name changes.
4. Copy `checkout.html` — update branding, support email, and redirect URL for thankyou page.
5. Copy `thankyou.html` — update branding and VIP form name.
6. Deploy `functions/square-config.mjs`, `functions/products-get.mjs`, `functions/orders-create.mjs`, and `functions/lib/` intact.
7. Set all required env vars in Netlify dashboard.
8. Confirm `netlify.toml` functions directory matches actual functions location.
