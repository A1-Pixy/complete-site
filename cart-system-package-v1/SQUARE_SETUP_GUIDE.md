# SQUARE_SETUP_GUIDE.md — Cart System Package v1

---

## Sandbox Setup

### Step 1 — Create Square Developer Account

1. Go to developer.squareup.com
2. Sign in with your Square account or create one
3. Navigate to Applications

### Step 2 — Create Sandbox Application

1. Click "Create an Application"
2. Name it (e.g., "PD Seasoning Sandbox")
3. Agree to developer terms
4. Select the application

### Step 3 — Get Sandbox Credentials

In your application settings, select the Sandbox tab:

1. **Sandbox Application ID** — starts with `sandbox-sq0idb-...`
   - Used for: `SQUARE_APP_ID` env var
   - Safe to put in: frontend via `square-config` API response only
   - Never hardcode in HTML or JS files

2. **Sandbox Access Token** — starts with `EAAAl...` or similar
   - Used for: `SQUARE_ACCESS_TOKEN` env var
   - Backend only — never return to frontend, never log, never commit

3. **Sandbox Location ID**
   - Navigate to Sandbox → Locations
   - Copy the Location ID
   - Used for: `SQUARE_LOCATION_ID` env var

### Step 4 — Set Environment Variables

In Netlify dashboard → Site settings → Environment variables:

```
SQUARE_APP_ID        = sandbox-sq0idb-...
SQUARE_LOCATION_ID   = your-sandbox-location-id
SQUARE_ACCESS_TOKEN  = your-sandbox-access-token
SQUARE_ENVIRONMENT   = sandbox
```

### Step 5 — Confirm square-config Returns Sandbox

After deploy, call:
```
GET /.netlify/functions/square-config
```

Expected response:
```json
{
  "ok": true,
  "appId": "sandbox-sq0idb-...",
  "locationId": "your-location-id",
  "sdkUrl": "https://sandbox.web.squarecdn.com/v1/square.js",
  "environment": "sandbox"
}
```

If `sdkUrl` does not contain `sandbox.web.squarecdn.com`, the environment var is wrong.

### Step 6 — Confirm Square SDK URL Is Sandbox

The SDK URL returned must be:
```
https://sandbox.web.squarecdn.com/v1/square.js
```
Not:
```
https://web.squarecdn.com/v1/square.js
```

### Step 7 — Use Sandbox Test Cards Only

Square-provided sandbox test cards (use these for all testing):

| Card Number | Use |
| ----------- | --- |
| 4111 1111 1111 1111 | Successful payment |
| 4000 0000 0000 0002 | Declined payment |

Expiry: any future date (e.g., `01/30`)
CVV: any 3 digits (e.g., `111`)
ZIP: any 5 digits

Do not use real card numbers during sandbox testing.

### Step 8 — Confirm Payment in Square Sandbox Dashboard

After a successful test order:
1. Go to Square Developer Dashboard
2. Navigate to Sandbox → Payments
3. Confirm the test payment appears with correct amount

---

## Production Switch Checklist

**Documentation only. Do not perform any step here without written owner approval.**

| Step | Status | Notes |
| ---- | ------ | ----- |
| Written owner approval received | Required | Document date and approver |
| All sandbox tests passing | Required | See TEST_PLAN.md |
| Production Square Application created | Required | Separate app from sandbox |
| Production Application ID obtained | Required | Starts with `sq0idp-...` |
| Production Access Token obtained | Required | New token — not sandbox token |
| Production Location ID confirmed | Required | Check Square dashboard → Locations |
| `SQUARE_ENVIRONMENT=production` set in Netlify | Required | Change env var |
| `SQUARE_APP_ID` updated to production value | Required | Must start with `sq0idp-...` |
| `SQUARE_ACCESS_TOKEN` updated to production value | Required | |
| Production SDK URL verified in square-config response | Required | `https://web.squarecdn.com/v1/square.js` |
| First real payment test approved | Required | Small amount, real card, owner present |
| First real refund test approved | Required | Confirm refund path works |
| Rollback plan documented and ready | Required | See ROLLBACK_PLAN.md |
| CHECKOUT_BASELINE.md updated | Required | Document new passing state |

Do not switch to production Square without completing every item above and receiving written owner approval.
