# ENV_TEMPLATE.md — Cart System Package v1

All env var names extracted from actual code files only.
No values. No secrets. No production credentials.

---

## .env Template

```env
# ── Square ──────────────────────────────────────────────────────────
# Square Web Payments Application ID (public — used in frontend via square-config)
# Sandbox prefix: sandbox-sq0idb-...
# Production prefix: sq0idp-...
SQUARE_APP_ID=replace_with_square_app_id

# Square Location ID (same value for sandbox and production)
SQUARE_LOCATION_ID=replace_with_square_location_id

# Square API Access Token (SECRET — backend only, never frontend)
SQUARE_ACCESS_TOKEN=replace_with_square_access_token

# Square environment: "sandbox" or "production"
SQUARE_ENVIRONMENT=sandbox

# ── Supabase ─────────────────────────────────────────────────────────
# Supabase project URL
SUPABASE_URL=replace_with_supabase_url

# Supabase anon (public) key — used for products-get
SUPABASE_ANON_KEY=replace_with_supabase_anon_key

# Supabase service role key (SECRET — bypasses RLS, backend only)
SUPABASE_SERVICE_ROLE_KEY=replace_with_supabase_service_role_key

# ── Admin ────────────────────────────────────────────────────────────
# Strong password for products-admin endpoint
ADMIN_SECRET=replace_with_strong_password

# ── AI (not cart-related) ─────────────────────────────────────────────
# Google Gemini API key
GEMINI_API_KEY=replace_with_gemini_api_key

# ── Mailchimp / VIP (not cart-related) ───────────────────────────────
MAILCHIMP_API_KEY=replace_with_mailchimp_api_key
MAILCHIMP_SERVER_PREFIX=replace_with_server_prefix
MAILCHIMP_AUDIENCE_ID=replace_with_audience_id
```

---

## Env Var Reference

| Env Var | Purpose | Frontend Safe? | Backend Only? | Required for Cart? | Found In File |
| ------- | ------- | -------------- | ------------- | ------------------ | ------------- |
| `SQUARE_APP_ID` | Square Web Payments App ID | Yes (returned via square-config) | No | Yes | `functions/square-config.mjs` |
| `SQUARE_LOCATION_ID` | Square Location ID | Yes (returned via square-config) | No | Yes | `functions/square-config.mjs`, `functions/orders-create.mjs` |
| `SQUARE_ACCESS_TOKEN` | Square API token for charging | No | Yes | Yes | `functions/orders-create.mjs` |
| `SQUARE_ENVIRONMENT` | sandbox or production | No | Yes | Yes | `functions/square-config.mjs`, `functions/orders-create.mjs` |
| `SUPABASE_URL` | Supabase project URL | No | Yes | Yes | `functions/products-get.mjs`, `functions/orders-create.mjs` |
| `SUPABASE_ANON_KEY` | Supabase public key | No | Yes | Yes (products-get) | `functions/products-get.mjs` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (RLS bypass) | No — never | Yes | Yes (orders-create) | `functions/orders-create.mjs` |
| `ADMIN_SECRET` | Products admin password | No | Yes | No (admin only) | `functions/products-admin.mjs` |
| `GEMINI_API_KEY` | AI chatbot | No | Yes | No | `netlify.toml` |
| `MAILCHIMP_API_KEY` | Mailchimp sync | No | Yes | No | `netlify.toml` |
| `MAILCHIMP_SERVER_PREFIX` | Mailchimp data center | No | Yes | No | `netlify.toml` |
| `MAILCHIMP_AUDIENCE_ID` | Mailchimp list ID | No | Yes | No | `netlify.toml` |
| `URL` | Auto-set by Netlify (site URL) | No | Yes | Yes (email notify) | `functions/orders-create.mjs` line 177 |

---

## Notes

- Set env vars in Netlify dashboard → Site settings → Environment variables.
- Do not put real values in `.env` files committed to the repo.
- Add `.env` to `.gitignore` before creating it.
- `URL` is automatically provided by Netlify in deployed environments. It is not set manually.
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in any frontend file or browser console output.
