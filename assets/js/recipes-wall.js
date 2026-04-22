(() => {
  const SUPABASE_URL = window.SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";

  const feed = document.getElementById("community-feed");
  const showFail = (msg) => {
    console.error(msg);
    if (feed) feed.textContent = msg;
  };

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    showFail("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    return;
  }

  if (!window.supabase?.createClient) {
    showFail("Supabase client not loaded");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // keep the rest of your file unchanged


  const el = {
    feed: document.getElementById("community-feed"),
    open: document.getElementById("community-open"),
    refresh: document.getElementById("community-refresh"),
    signout: document.getElementById("community-signout"),

    modal: document.getElementById("community-modal"),
    close: document.getElementById("community-close"),

    status: document.getElementById("community-auth-status"),
    email: document.getElementById("community-email"),
    sendCode: document.getElementById("community-send-code"),
    code: document.getElementById("community-code"),
    verifyCode: document.getElementById("community-verify-code"),

    displayName: document.getElementById("community-display-name"),
    kind: document.getElementById("community-kind"),
    recipeId: document.getElementById("community-recipe-id"),
    title: document.getElementById("community-title"),
    body: document.getElementById("community-body"),
    submit: document.getElementById("community-submit")
  };

  window.addEventListener("DOMContentLoaded", async () => {
    await refreshAuthUI();
    await loadFeed(getRecipeId());
  });

  el.open?.addEventListener("click", async () => {
    openModal();
    await refreshAuthUI();
  });

  el.refresh?.addEventListener("click", async () => {
    await loadFeed(getRecipeId());
  });

  el.signout?.addEventListener("click", async () => {
    await sb.auth.signOut();
    setStatus("Signed out.");
    await refreshAuthUI();
  });

  el.close?.addEventListener("click", closeModal);
  el.modal?.addEventListener("click", (e) => {
    if (e.target === el.modal) closeModal();
  });

  el.sendCode?.addEventListener("click", async () => {
    const email = (el.email?.value || "").trim();
    if (!email) return setStatus("Enter email.");
    setStatus("Sending code...");
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    if (error) return setStatus(error.message);
    setStatus("Code sent.");
  });

  el.verifyCode?.addEventListener("click", async () => {
    const email = (el.email?.value || "").trim();
    const token = (el.code?.value || "").trim();
    if (!email || !token) return setStatus("Enter email and code.");
    setStatus("Verifying...");
    const { data, error } = await sb.auth.verifyOtp({ email, token, type: "email" });
    if (error) return setStatus(error.message);
    if (!data?.session) return setStatus("Sign-in failed.");
    setStatus("Signed in.");
    await refreshAuthUI();
  });

  el.submit?.addEventListener("click", async () => {
    const { data } = await sb.auth.getSession();
    const session = data?.session;
    if (!session?.access_token) return setStatus("Sign in required.");

    const displayName = (el.displayName?.value || "").trim();
    const kind = String(el.kind?.value || "comment");
    const recipeId = getRecipeId();
    const title = (el.title?.value || "").trim();
    const body = (el.body?.value || "").trim();

    if (!displayName) return setStatus("Enter your name.");
    if (!body) return setStatus("Enter text.");
    if (kind === "recipe" && !title) return setStatus("Enter a title.");

    el.submit.disabled = true;
    setStatus("Posting...");

    try {
      const r = await fetch("/.netlify/functions/recipes-post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accessToken: session.access_token,
          displayName,
          kind,
          recipeId,
          title: kind === "recipe" ? title : null,
          body
        })
      });

      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setStatus(j?.error || "Post failed.");
        return;
      }

      setStatus("Posted.");
      if (el.title) el.title.value = "";
      if (el.body) el.body.value = "";
      await loadFeed(recipeId);
    } catch {
      setStatus("Post failed.");
    } finally {
      el.submit.disabled = false;
    }
  });

  async function loadFeed(recipeId) {
    if (!el.feed) return;
    el.feed.textContent = "Loading...";
    try {
      const r = await fetch(`/.netlify/functions/recipes-get?recipeId=${encodeURIComponent(recipeId)}&limit=50`);
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        el.feed.textContent = "Could not load feed.";
        return;
      }
      renderFeed(j.rows || []);
    } catch {
      el.feed.textContent = "Could not load feed.";
    }
  }

  function renderFeed(rows) {
    if (!el.feed) return;
    if (!rows.length) {
      el.feed.textContent = "No posts yet.";
      return;
    }

    el.feed.innerHTML = rows.map((row) => {
      const when = row.created_at ? new Date(row.created_at).toLocaleString() : "";
      const who = esc(row.display_name || "");
      const kindLabel = row.kind === "recipe" ? "Recipe" : "Comment";
      const title = row.title ? esc(row.title) : "";
      const body = esc(row.body || "").replace(/\n/g, "<br>");
      return `
        <div style="padding:12px 0;border-bottom:1px solid rgba(216,179,90,.18);">
          <div style="opacity:.9;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">
            ${kindLabel}${title ? " . " + title : ""}
          </div>
          <div style="opacity:.75;font-size:12px;margin-top:4px;">
            ${who}${when ? " . " + esc(when) : ""}
          </div>
          <div style="margin-top:10px;line-height:1.35;">
            ${body}
          </div>
        </div>
      `;
    }).join("");
  }

  async function refreshAuthUI() {
    const { data } = await sb.auth.getSession();
    const session = data?.session;
    if (!session) return setStatus("Not signed in.");
    const email = session.user?.email || "";
    setStatus(email ? `Signed in as ${email}` : "Signed in.");
  }

  function getRecipeId() {
    return (el.recipeId?.value || "community").trim() || "community";
  }

  function openModal() {
    if (!el.modal) return;
    el.modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!el.modal) return;
    el.modal.style.display = "none";
    document.body.style.overflow = "";
  }

  function setStatus(msg) {
    if (el.status) el.status.textContent = msg;
  }

  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
