# ROLLBACK_PLAN.md — Cart System Package v1

---

## When to Rollback

Roll back when:
- A deploy causes checkout to stop working
- `orders-create` starts returning errors for valid orders
- `square-config` returns wrong environment or missing config
- `products-get` returns empty or incorrect products
- Supabase order inserts start failing
- A secret is accidentally exposed in a log or response

Do not roll back for: UI changes, non-checkout pages, recipe pages, or admin features unrelated to checkout.

---

## Rollback Steps

### Step 1 — Identify Last Passing Commit

```bash
git log --oneline -10
```

Find the commit before the broken change. The last confirmed passing commit is documented in `CHECKOUT_BASELINE.md`.

Current last known passing commit: `4583337`

### Step 2 — Create Rollback Branch

```bash
git checkout -b rollback/checkout-restore <last-passing-commit-hash>
```

### Step 3 — Revert Only Checkout-Breaking Commit

If you know the specific commit that broke checkout:

```bash
git revert <breaking-commit-hash> --no-commit
git commit -m "rollback: revert breaking checkout change"
```

Do not use `git reset --hard` on main. Do not touch unrelated files.

### Step 4 — Do Not Touch Unrelated Files

Only revert files involved in the failure:
- `functions/orders-create.mjs`
- `functions/square-config.mjs`
- `functions/products-get.mjs`
- `netlify.toml`
- `assets/js/pixy-cart.js`
- `checkout.html`

Do not revert: CSS, product images, recipe pages, other HTML pages, admin files unrelated to checkout.

### Step 5 — Confirm Deploy Preview

Push the rollback branch to GitHub.
Netlify creates a deploy preview automatically.
Open the deploy preview URL.

### Step 6 — Verify Endpoints

```
GET /.netlify/functions/square-config
Expected: { ok: true, appId, locationId, sdkUrl, environment }

GET /.netlify/functions/products-get
Expected: { ok: true, products: [...] }
```

### Step 7 — Run Sandbox Checkout

Use Square sandbox test card `4111 1111 1111 1111`.
Complete a full test order.
Confirm redirect to thankyou.html.

### Step 8 — Confirm Supabase Order Save

Open Supabase → orders table.
Confirm the rollback test order was saved with `payment_status = "paid"`.

### Step 9 — Confirm Email Notification

Check Netlify Forms for `order-notification` submission.

### Step 10 — Check Logs

Open Netlify function logs.
Confirm no secrets appear.
Confirm order_code and payment ID are logged correctly.

### Step 11 — Document Rollback Result

Update `CHECKOUT_BASELINE.md` with the rollback commit hash and result.

---

## If Rollback Fails

If the rollback deploy preview also fails:

1. Do not merge to main
2. Identify which file caused the failure (check Netlify function logs)
3. Try reverting to an earlier known-good commit
4. If Netlify environment variables changed, restore them in the Netlify dashboard
5. If Supabase credentials changed, restore them in the Netlify dashboard

---

## What Not to Touch During Rollback

- Do not change Supabase table schemas during a rollback
- Do not rotate Square credentials during a rollback (unless a security incident)
- Do not change Netlify env vars during a rollback unless they are the confirmed cause
- Do not merge unrelated branches during a rollback
- Do not deploy admin changes during a rollback
