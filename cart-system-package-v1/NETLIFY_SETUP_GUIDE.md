# NETLIFY_SETUP_GUIDE.md — Cart System Package v1

---

## Netlify Site Setup

### Step 1 — Create Netlify Account and Site

1. Go to netlify.com
2. Sign in or create account
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub and select the repo

### Step 2 — Build Configuration

From `netlify.toml` (confirmed values):

| Setting | Value | Source |
| ------- | ----- | ------ |
| Build command | (none — no build step) | `netlify.toml` `[build]` section |
| Publish directory | `.` | `netlify.toml`: `publish = "."` |
| Node version | 18 | `netlify.toml`: `NODE_VERSION = "18"` |
| Functions directory config | `netlify/functions` | `netlify.toml` line 5 |

### CRITICAL: Functions Directory Mismatch

`netlify.toml` line 5: `directory = "netlify/functions"`

Actual function files are in: `functions/` (repo root level)

There is no `netlify/` subdirectory.

**Before deploying, either:**
- Correct `netlify.toml` to `directory = "functions"`, OR
- Confirm in Netlify dashboard that the functions directory override is set to `functions`

If this is not resolved, all Netlify functions will return 404.

### Step 3 — Environment Variables

Set in Netlify dashboard → Site settings → Environment variables.

Do not put env vars in `netlify.toml` or commit them to the repo.

See `ENV_TEMPLATE.md` for the complete list.

### Step 4 — Deploy Preview Flow

1. Push changes to a feature branch
2. Netlify automatically creates a deploy preview URL
3. Test all endpoints and checkout on the deploy preview URL
4. Only merge to main after deploy preview tests pass
5. Merging to main triggers a production deploy

### Step 5 — Production Deploy Rules

- Do not manually deploy to production without owner approval
- Use branch and PR workflow — merge triggers the deploy
- Do not push directly to main without a passing deploy preview
- Do not force push to main

### Step 6 — Netlify Function Log Checks

After any checkout test:

1. Netlify dashboard → Site → Functions tab
2. Click the function name (e.g., `orders-create`)
3. Review recent invocation logs
4. Confirm: no access tokens, service role keys, or card data in logs
5. Confirm: order_code, payment_status, and Square payment ID are logged (these are safe)
6. If any secret appears in logs, treat as a security incident — rotate the exposed key immediately

### Step 7 — Endpoint Verification

Test these endpoints after any deploy:

```
GET /.netlify/functions/square-config
Expected: { ok: true, appId, locationId, sdkUrl, environment }

GET /.netlify/functions/products-get
Expected: { ok: true, products: [...] }

POST /.netlify/functions/orders-create
Expected: { ok: true, orderCode } (sandbox test only)
```

If any function returns a non-JSON response or 404, check the functions directory setting first.

---

## Netlify Forms (Order Email Notification)

The `orders-create` function sends order notifications via Netlify Forms.

To set this up:

1. A hidden form with `name="order-notification"` and `data-netlify="true"` must exist in a deployed HTML page
2. Netlify detects it on first deploy and registers the form
3. The function POSTs to the site root (`/`) with `form-name=order-notification`
4. Netlify forwards the form submission to your notification email

To configure the notification email:
1. Netlify dashboard → Site → Forms
2. Click `order-notification`
3. Click "Form notifications" → add email notification

Do not expose notification email addresses in code or docs.
