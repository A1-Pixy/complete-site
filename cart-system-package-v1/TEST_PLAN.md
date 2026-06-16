# TEST_PLAN.md — Cart System Package v1

All tests use sandbox credentials only. Do not run these tests with production Square credentials.

---

## Pre-Test Safety

- [ ] Confirm `SQUARE_ENVIRONMENT=sandbox` in Netlify env
- [ ] Confirm `SQUARE_APP_ID` starts with `sandbox-`
- [ ] Confirm test will use Square sandbox test cards only
- [ ] Confirm Netlify function logs are accessible
- [ ] Confirm Supabase dashboard is open for order verification

---

## Endpoint Tests

**square-config**
1. GET `/.netlify/functions/square-config`
2. Expected: `{ ok: true, appId: "sandbox-...", locationId: "...", sdkUrl: "https://sandbox.web.squarecdn.com/...", environment: "sandbox" }`
3. Fail condition: `ok: false`, missing appId, production sdkUrl returned

**products-get**
1. GET `/.netlify/functions/products-get`
2. Expected: `{ ok: true, products: [...] }` with at least one product
3. GET `/.netlify/functions/products-get?category=Pouches`
4. Expected: filtered product list
5. Fail condition: `ok: false`, empty products array when products exist in Supabase

---

## Cart Tests

**Add to Cart**
1. Open a product page
2. Click Add to Cart
3. Expected: cart badge count increments, toast notification appears
4. Expected: `localStorage.getItem("pixy_cart_v2")` contains the product

**Update Quantity**
1. Open cart drawer
2. Click `+` button on an item
3. Expected: quantity increments, subtotal updates

**Remove Item**
1. Open cart drawer
2. Click `×` button on an item
3. Expected: item removed, cart reflects empty or remaining items

**Cart Persistence**
1. Add item to cart
2. Reload page
3. Expected: cart badge still shows correct count

---

## Square Card Field Tests

1. Navigate to checkout.html
2. Complete Step 1 (shipping)
3. Expected: Step 2 shows Square card input (not placeholder text)
4. Expected: browser console shows `[checkout] Square config loaded. environment: sandbox`
5. Expected: no Square SDK errors in console
6. Fail condition: placeholder text shows instead of card field, console errors

---

## orders-create Tests

**Placeholder Mode (no Square token)**
1. Set `SQUARE_ENABLED = false` temporarily in checkout.html (local test only)
2. OR: test by letting Square SDK fail to load
3. Complete checkout
4. Expected: order saved to Supabase with `payment_status = "pending"`
5. Expected: orderCode returned

**Square Mode (full flow)**
1. Complete Step 1
2. Enter sandbox test card: `4111 1111 1111 1111`, exp `01/30`, CVV `111`
3. Click Place Order
4. Expected: processing overlay shows briefly
5. Expected: redirect to `thankyou.html?order=PD-...`

---

## Square Payment Tests

1. After successful checkout, open Square Developer Dashboard → Sandbox → Payments
2. Expected: payment record exists with correct amount
3. Expected: amount = subtotal + shipping (or subtotal if free shipping applies)
4. Verify free shipping: order above $37 → shipping = $0; below $37 → shipping = $5.99
5. Fail condition: payment not found, wrong amount

---

## Supabase Order Save Tests

1. Open Supabase dashboard → Table Editor → orders
2. Find the order by `order_code` from thankyou.html
3. Expected: all fields populated correctly
4. Expected: `payment_status = "paid"`, `square_payment_id` is a non-null string
5. Expected: `items` JSONB field contains the correct product array
6. Expected: `total_cents` matches expected amount
7. Fail condition: record not found, `payment_status = "unpaid"`, null square_payment_id

---

## Email Notification Tests

1. Open Netlify dashboard → Forms
2. Expected: `order-notification` form appears
3. Expected: submission contains `order_code`, customer info, items, and totals
4. Fail condition: form not found, submission empty, submission missing order fields

---

## Success State Tests

1. After successful order, confirm `thankyou.html` displays:
   - Order code (format: `PD-XXXXX-XXXX`)
   - Order items list with quantities and prices
   - Total amount
2. After page refresh, order summary is gone (sessionStorage cleared)
3. Cart is empty after redirect

---

## Error State Tests

**Square declined card**
1. Use test card `4000 0000 0000 0002`
2. Expected: error message appears in checkout, no redirect
3. Expected: order NOT saved to Supabase
4. Expected: no payment in Square sandbox

**Missing shipping fields**
1. Submit Step 1 with empty required fields
2. Expected: validation error displayed, no API call made

**Network error simulation**
1. UNKNOWN — requires Netlify function offline simulation

---

## Netlify Log Safety Tests

1. Open Netlify function logs for `orders-create`
2. Review log output from the test order
3. Expected logged: `[orders-create] Square success, payment ID: sq...`
4. Expected logged: `[orders-create] Inserting to Supabase: order_code= ... payment_status= paid`
5. Expected logged: `[orders-create] Supabase insert success`
6. Not expected in logs: access token values, service role key values, card numbers
7. Fail condition: any secret value appears in logs

---

## Failure Tests

- Test `products-get` with wrong Supabase credentials → expect 500
- Test `orders-create` with no payment token → expect order saved as `payment_status = "unpaid"` or "pending"
- Test `square-config` with missing env var → expect 500

---

## Rollback Test

1. Confirm last passing commit hash is known
2. Confirm rollback branch can be created from that commit
3. Confirm deploy preview from rollback branch passes endpoint tests

---

## Test Result Output Format

```text
CART SYSTEM TEST RESULT: Pass / Fail
SQUARE-CONFIG:           Pass / Fail
PRODUCTS-GET:            Pass / Fail
CART ADD/UPDATE/REMOVE:  Pass / Fail
SQUARE CARD FIELD:       Pass / Fail
ORDERS-CREATE:           Pass / Fail
SQUARE PAYMENT:          Pass / Fail
SUPABASE ORDER SAVE:     Pass / Fail
ORDER EMAIL:             Pass / Fail / Not configured
SUCCESS STATE:           Pass / Fail
LOG SAFETY:              Pass / Fail
SECRETS EXPOSED:         Yes / No
NEXT ACTION:             [one action only]
```
