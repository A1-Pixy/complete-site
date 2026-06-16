# INSTALL_ORDER.md — Cart System Package v1

Exact numbered install order. No step is skippable.
Follow this order precisely. Do not skip ahead.

---

1. **Clone repo**
   Clone or fork the repo to your own GitHub account.

2. **Create safe branch**
   `git checkout -b setup/new-client-name`
   Never work directly on main.

3. **Review package docs**
   Read `README.md`, `DISCOVERY_NOTES.md`, `DO_NOT_TOUCH.md`, and `SECURITY_RULES.md` before touching anything.

4. **Create Square sandbox app**
   Go to developer.squareup.com → Create Application → Sandbox tab.
   Collect: Sandbox App ID, Sandbox Access Token, Sandbox Location ID.
   See `SQUARE_SETUP_GUIDE.md` for full steps.

5. **Create Supabase project**
   Go to supabase.com → New Project.
   Collect: Project URL, anon key, service role key.

6. **Create Supabase tables**
   In Supabase SQL Editor, run in order:
   - `db/products-setup.sql`
   - `db/orders-setup.sql`
   - `db/leads-migrate.sql`
   Confirm tables appear in Table Editor.

7. **Add product data**
   Use `PRODUCT_IMPORT_TEMPLATE.csv` or `PRODUCT_DATA_TEMPLATE.json` as a guide.
   Run `db/products-migrate.sql` or use the `products-admin` function to insert products.
   Confirm at least one product with `active=true` exists.

8. **Create Netlify site**
   Go to netlify.com → Add new site → Import from GitHub.
   Connect repo.

9. **Confirm netlify.toml**
   Verify the functions directory in `netlify.toml` matches the actual `functions/` folder.
   See the CRITICAL note in `NETLIFY_SETUP_GUIDE.md` and `DISCOVERY_NOTES.md`.
   Fix if needed before deploying.

10. **Set Netlify env vars**
    In Netlify dashboard → Site settings → Environment variables, add all vars from `ENV_TEMPLATE.md`.
    Do not skip any required var.

11. **Deploy preview**
    Push branch to GitHub → Netlify creates preview URL automatically.
    Open preview URL in browser.

12. **Test square-config**
    GET `[preview-url]/.netlify/functions/square-config`
    Expect: `{ ok: true, appId: "sandbox-...", environment: "sandbox" }`
    Do not proceed if this fails.

13. **Test products-get**
    GET `[preview-url]/.netlify/functions/products-get`
    Expect: `{ ok: true, products: [...] }` with your products.
    Do not proceed if this fails.

14. **Test cart add/update/remove**
    Open shop.html on preview URL.
    Add item, update qty, remove item.
    Confirm badge and drawer work correctly.

15. **Test Square card field**
    Navigate to checkout.html → complete Step 1 → reach Step 2.
    Confirm Square card input appears.
    Confirm browser console shows `environment: sandbox`.

16. **Test sandbox checkout**
    Enter Square sandbox test card `4111 1111 1111 1111`, exp `01/30`, CVV `111`.
    Click Place Order.
    Confirm redirect to thankyou.html with order code.

17. **Confirm Square sandbox payment**
    Open Square Developer Dashboard → Sandbox → Payments.
    Confirm payment record exists with correct amount.

18. **Confirm Supabase order**
    Open Supabase → Table Editor → orders.
    Confirm order record with `payment_status = "paid"`.

19. **Confirm email notification**
    Open Netlify dashboard → Forms → `order-notification`.
    Confirm submission with correct order data.
    If form missing, see `EMAIL_NOTIFICATION_SETUP.md`.

20. **Confirm logs safe**
    Open Netlify function logs for `orders-create`.
    Confirm no secrets appear.
    See `SECURITY_RULES.md` for what is and is not safe to log.

21. **Complete rollback readiness check**
    Confirm you know the last passing commit hash.
    Confirm you can create a rollback branch.
    Document the passing state in `CHECKOUT_BASELINE.md`.

22. **Prepare production approval checklist**
    Only begin this after steps 1–21 are complete and passing.
    See `SQUARE_SETUP_GUIDE.md` → Production Switch Checklist.

23. **Only then consider production switch**
    Production switch requires written owner approval.
    All sandbox tests must pass.
    Rollback plan must be documented and confirmed.
    Do not switch to production Square without completing every step above.
