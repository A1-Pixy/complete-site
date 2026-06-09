# EMAIL_NOTIFICATION_SETUP.md — Cart System Package v1

---

## Email Notification — Confirmed in Code

Email notification logic is confirmed in `functions/orders-create.mjs`.

Function: `sendOrderNotification()` — lines 175–212

---

## Which Function Sends Email

`orders-create.mjs` — called after successful Supabase order insert.

The email is sent via Netlify Forms (not an external email API).

---

## Which Env Vars Control Email

| Env Var | Purpose | Notes |
| ------- | ------- | ----- |
| `URL` | Site URL for Netlify Forms POST | Auto-set by Netlify. Not manually configured. Format: `https://yoursite.netlify.app` or custom domain. |

No external email API key is required. Netlify Forms handles delivery.

---

## How It Works

1. `orders-create.mjs` builds a URL-encoded form body with order details
2. POSTs to `{URL}/` with `Content-Type: application/x-www-form-urlencoded`
3. Form name: `order-notification`
4. Netlify receives the form submission and routes it to the configured notification email

---

## Order Details Included in Notification

Confirmed from `sendOrderNotification()`:

- `order_code`
- `customer_name` (first + last)
- `customer_email`
- `phone`
- `shipping_address` (full address, city, state, zip)
- `items` (title × qty @ price, one per line)
- `subtotal`
- `shipping` (dollar amount or "FREE")
- `total`
- `square_payment_id`
- `timestamp` (ISO 8601)

---

## Customer Data Included

Yes — customer name, email, phone, and shipping address are included in the form submission.
These are sent to Netlify Forms and forwarded to the owner's notification email.

No card data is included. The Square payment token is single-use and expires immediately.
Only the `square_payment_id` (a reference ID, not a card number) is included.

---

## Security Rules

- Never log the full notification payload to console
- The `customer_email` field in the notification is the customer's email address — handle it as PII
- Netlify Forms submissions may be stored by Netlify — do not include card data or full card numbers

---

## How to Test

1. Complete a full sandbox checkout test
2. Open Netlify dashboard → Site → Forms
3. Confirm `order-notification` appears in the forms list
4. Click the form name → confirm submission with correct order data
5. Check the configured notification email

---

## Required Setup Step

A hidden HTML form with `data-netlify="true"` and `name="order-notification"` must be present in a deployed HTML page for Netlify to detect and register the form.

If this form is missing, `sendOrderNotification()` will receive a non-OK response and log a warning. The order will still succeed, but no email will be sent.

To add the form (example — add inside any page's `<body>`):

```html
<form name="order-notification" data-netlify="true" hidden>
  <input type="hidden" name="form-name" value="order-notification" />
  <input name="order_code" />
  <input name="customer_name" />
  <input name="customer_email" />
  <input name="phone" />
  <input name="shipping_address" />
  <input name="items" />
  <input name="subtotal" />
  <input name="shipping" />
  <input name="total" />
  <input name="square_payment_id" />
  <input name="timestamp" />
</form>
```

Verify in Netlify Forms dashboard after next deploy.
