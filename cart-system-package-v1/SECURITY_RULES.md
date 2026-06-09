# SECURITY_RULES.md — Cart System Package v1

One authoritative security reference. Apply before every commit and every deploy.

---

## Absolute Rules

- Never commit `.env` files to git
- Never expose the Square access token in any frontend file, API response, or console log
- Never expose the Supabase service role key in any frontend file, API response, or console log
- Never expose the admin secret in any frontend file, API response, or console log
- Never log payment tokens (Square single-use tokens)
- Never log card data (card numbers, CVV, expiry)
- Never log full customer PII (complete card data, SSN, passwords)
- Never put backend secrets in frontend JavaScript files
- Never make admin endpoints publicly accessible without authentication
- Never use production Square credentials until all sandbox tests pass and owner approves in writing
- Never switch `SQUARE_ENVIRONMENT` from `sandbox` to `production` without written approval
- Never deploy checkout changes without a passing test plan
- Never let agents touch checkout code until safety gates are complete

---

## What Is Safe to Log

These values are safe to log in Netlify function console output:

- `order_code` — your own generated ID, not a secret
- `payment_status` — safe status string
- `square_payment_id` — a Square reference ID (not a token or card number)
- Whether env vars are set: `!!process.env.SQUARE_APP_ID` (boolean only, not the value)

These values must never appear in logs:

- `SQUARE_ACCESS_TOKEN` value
- `SUPABASE_SERVICE_ROLE_KEY` value
- `SUPABASE_ANON_KEY` value
- `ADMIN_SECRET` value
- Any value starting with `sq0`, `EAAA`, `eyJ`, or `sk_`
- Customer card numbers
- Customer full PII beyond what's needed for order fulfillment

---

## Frontend Safety Rules

- `SUPABASE_ANON_KEY` must not appear in HTML, inline JS, or static JS files
- `SUPABASE_SERVICE_ROLE_KEY` must never appear anywhere in frontend code
- `SQUARE_ACCESS_TOKEN` must never appear anywhere in frontend code
- `ADMIN_SECRET` must never appear anywhere in frontend code
- Only the Square App ID and Location ID may reach the browser — only via the `square-config` function response

---

## Redaction Checklist

Run this check before every commit to docs, configs, and code.
Search the entire working directory for these patterns:

| Pattern | Why Dangerous |
| ------- | ------------- |
| `access_token` | May contain a real Square token value |
| `service_role` | May contain a Supabase service role key value |
| `eyJ` | JWT token prefix (base64-encoded JSON) |
| `sk_` | Stripe or other service secret key pattern |
| `sq0` | Square credential prefix |
| `EAAA` | Square access token prefix |
| `@gmail.com` | Customer email data |
| Phone number patterns | Customer PII |
| Card number patterns | 13-16 digit sequences |
| Real order IDs with customer names | PII in test data |

Do not commit if any secret or customer data appears.

---

## Git Pre-Commit Checklist

Before every `git commit`:

1. Run `git diff --stat` — confirm only expected files are staged
2. Run `git diff` — read every line of the diff
3. Search staged files for: `access_token`, `service_role`, `eyJ`, `sq0`, `EAAA`
4. Confirm no `.env` file is staged
5. Confirm no `node_modules` is staged
6. Confirm no `*.log` files are staged

---

## Key Rotation Protocol

If a secret is accidentally committed or logged:

1. Immediately rotate the exposed key (Square dashboard, Supabase dashboard, or Netlify env)
2. Update the new value in Netlify environment variables
3. Do not commit the new value — only set it in the dashboard
4. If the old key was committed to git, the commit history must be treated as compromised — contact the relevant service to confirm the old key is deactivated

---

## Production Payment Safety

- All production payment switches require written owner approval
- Owner must be present for the first real payment test
- A rollback plan must be confirmed before switching to production
- Sandbox testing is required to pass completely before any production switch
