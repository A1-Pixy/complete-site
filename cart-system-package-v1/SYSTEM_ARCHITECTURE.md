# SYSTEM_ARCHITECTURE.md — Cart System Package v1

---

## Full System Flow (Prose)

A customer lands on the site. Product data is loaded from two sources simultaneously:
static data in `assets/js/products.js` (renders immediately) and live data fetched
from `/.netlify/functions/products-get` (updates the display when it arrives).

When the customer clicks "Add to Cart," `window.PIXY_CART.add()` in `pixy-cart.js`
stores the item to `localStorage` under key `pixy_cart_v2` and fires a `pixy:cart:change`
event. `cart.js` listens for this event and updates the cart badge count visible in the
navigation.

When the customer opens the cart drawer, `cart.js` renders the current items, subtotal,
and a checkout button that links to `checkout.html`.

On `checkout.html`, the customer completes Step 1 (contact and shipping) then proceeds
to Step 2 (payment). On entering Step 2, the checkout script calls
`/.netlify/functions/square-config` to get the Square App ID, Location ID, and
SDK URL. It loads the Square Web Payments SDK from that URL, then calls
`window.Square.payments(appId, locationId)` and attaches a card form to `#card-container`.

When the customer clicks Place Order, the script calls `_card.tokenize()` to get a
one-time payment token from Square. It then POSTs to `/.netlify/functions/orders-create`
with the cart items, shipping info, and payment token.

`orders-create` validates the body, recalculates totals server-side (never trusting
the client), calls the Square Payments API to charge the card, then inserts the order
into the Supabase `orders` table using the service role key. It then attempts to send
an order notification via Netlify Forms and returns `{ ok: true, orderCode }`.

The checkout page stores the order summary to `sessionStorage` under key `pixy_last_order`,
clears the cart, and redirects to `thankyou.html?order=<orderCode>`.

`thankyou.html` displays the order code from the URL parameter and the order summary
from sessionStorage.

---

## ASCII System Diagram

```
Customer Browser
│
├─ assets/js/products.js
│    ├─ Sets window.PIXY_PRODUCTS (static data immediately)
│    └─ Fetches /.netlify/functions/products-get
│         └─ Supabase: SELECT from products WHERE active=true
│
├─ assets/js/pixy-cart.js
│    ├─ Stores cart in localStorage["pixy_cart_v2"]
│    ├─ Exposes window.PIXY_CART API
│    └─ Fires document events: pixy:cart:change, pixy:cart:added
│
├─ assets/js/cart.js
│    ├─ Listens to pixy:cart:change
│    ├─ Updates nav badge
│    └─ Renders slide-out cart drawer
│         └─ Checkout button → checkout.html
│
└─ checkout.html (inline script)
     │
     Step 1: Contact + Shipping form
     │
     Step 2: Payment
     │
     ├─ Calls /.netlify/functions/square-config
     │    └─ Returns: { appId, locationId, sdkUrl, environment }
     │
     ├─ Loads Square Web Payments SDK from sdkUrl
     │
     ├─ Square.payments(appId, locationId)
     │    └─ payments.card() → attached to #card-container
     │
     ├─ Place Order click
     │    ├─ _card.tokenize() → one-time payment token
     │    └─ POST /.netlify/functions/orders-create
     │         │  Body: { items, shipping, subtotal, payment: { status, token } }
     │         │
     │         ├─ Server-side total recalculation
     │         │    Free shipping threshold: $37.00 (3700 cents)
     │         │    Shipping cost: $5.99 (599 cents) if below threshold
     │         │
     │         ├─ POST https://connect.squareupsandbox.com/v2/payments
     │         │    (or connect.squareup.com for production)
     │         │    Headers: Authorization: Bearer SQUARE_ACCESS_TOKEN
     │         │    Returns: squarePaymentId, squareOrderId
     │         │
     │         ├─ Supabase INSERT into orders
     │         │    Key: SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
     │         │
     │         ├─ Netlify Forms POST (order-notification)
     │         │    order_code, customer info, items, totals
     │         │
     │         └─ Returns: { ok: true, orderCode: "PD-XXXXX-XXXX" }
     │
     ├─ sessionStorage.setItem("pixy_last_order", JSON.stringify(...))
     ├─ window.PIXY_CART.clear()
     └─ Redirect → thankyou.html?order=<orderCode>
          └─ Displays order ID + summary from sessionStorage
```

---

## System Components

| Component | Role | Source File / Location | Notes |
| --------- | ---- | ---------------------- | ----- |
| Cart Engine | localStorage CRUD for cart items | `assets/js/pixy-cart.js` | Exposes `window.PIXY_CART` |
| Cart Drawer | Slide-out UI, badge, upsell | `assets/js/cart.js` | Requires pixy-cart.js |
| Product Data | Static + live product list | `assets/js/products.js` | Exposes `window.PIXY_PRODUCTS` |
| Shop Cards | Product card rendering | `assets/js/shop.js` | Uses PIXY_PRODUCTS |
| Checkout Form | 2-step shipping + payment form | `checkout.html` (inline script) | Calls square-config and orders-create |
| Square Config Function | Returns public Square config | `functions/square-config.mjs` | No secret returned |
| Products Get Function | Returns active products | `functions/products-get.mjs` | Uses SUPABASE_ANON_KEY |
| Orders Create Function | Charges card, saves order | `functions/orders-create.mjs` | Uses SQUARE_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY |
| Supabase Helpers | REST API wrappers | `functions/lib/supabase.mjs` | No npm package — fetch only |
| Response Helpers | JSON + CORS | `functions/lib/response.mjs` | Used by all functions |
| Products Admin Function | Protected product CRUD | `functions/products-admin.mjs` | Requires x-admin-secret header |
| Netlify Config | Build, functions dir, headers | `netlify.toml` | CRITICAL: verify functions directory path |
| Products Table | Product catalog | Supabase `public.products` | Schema in db/products-setup.sql |
| Orders Table | Order records | Supabase `public.orders` | Schema in db/orders-setup.sql |
| Leads Table | VIP email captures | Supabase `public.leads` | Schema in db/leads-migrate.sql — not cart flow |
| Thank-You Page | Order confirmation display | `thankyou.html` | Reads sessionStorage + URL param |
| Order Notification | Email via Netlify Forms | `sendOrderNotification()` in orders-create.mjs | Posts to Netlify form `order-notification` |
