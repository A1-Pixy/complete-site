/*!
 * vip-capture.js — Pixy Dust Seasoning
 * VIP lead capture: timed popup, exit intent, and lead submission.
 *
 * Exposes window.PIXY_VIP.submitLead(email, name, tag, source) for use
 * by chatbot.js and any other module that needs to capture a lead.
 *
 * Does NOT replace the chatbot or any existing functionality.
 * Does NOT depend on external popup libraries.
 * Skips display on vip-access.html (already VIP).
 */
(function () {
  "use strict";

  var SYNC_ENDPOINT    = "/.netlify/functions/mailchimp-sync";
  var SS_SHOWN_KEY     = "pixy_vip_popup_shown";
  var DELAY_MIN        = 5000;
  var DELAY_MAX        = 8000;

  var popupShown = false;
  var overlayEl  = null;
  var exitWired  = false;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function alreadyShown() {
    try { return !!sessionStorage.getItem(SS_SHOWN_KEY); } catch (e) { return false; }
  }

  function markShown() {
    try { sessionStorage.setItem(SS_SHOWN_KEY, "1"); } catch (e) {}
  }

  function isVipPage() {
    return window.location.pathname.indexOf("vip-access") !== -1;
  }

  // ── Lead submission (called by popup, exit intent, and chatbot) ───────────
  function submitLead(email, name, tag, source) {
    return fetch(SYNC_ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:  email  || "",
        name:   name   || "",
        tag:    tag    || "VIP",
        source: source || "popup"
      })
    })
    .then(function (r) { return r.json(); })
    .catch(function () { return { ok: false }; });
  }

  // ── Styles (injected once) ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("pixy-vip-styles")) return;
    var s = document.createElement("style");
    s.id = "pixy-vip-styles";
    s.textContent = [
      "#pixy-vip-overlay{",
        "position:fixed;inset:0;z-index:9998;",
        "background:rgba(5,6,8,.88);",
        "display:flex;align-items:center;justify-content:center;",
        "padding:20px;box-sizing:border-box;",
        "opacity:0;transition:opacity .28s ease;",
        "pointer-events:none;",
      "}",
      "#pixy-vip-overlay.vip-open{opacity:1;pointer-events:auto;}",
      "#pixy-vip-modal{",
        "background:var(--bg1,#0b0b10);",
        "border:1px solid var(--stroke,rgba(217,185,108,.22));",
        "border-radius:var(--r,18px);",
        "padding:44px 38px 36px;",
        "max-width:420px;width:100%;",
        "position:relative;",
        "box-shadow:0 0 60px rgba(217,181,116,.35),0 24px 64px rgba(0,0,0,.65);",
        "text-align:center;",
      "}",
      "#pixy-vip-modal .vip-x{",
        "position:absolute;top:14px;right:16px;",
        "background:none;border:none;padding:6px;cursor:pointer;",
        "color:var(--muted2,#8f8a7d);font-size:20px;line-height:1;",
        "transition:color .15s;",
      "}",
      "#pixy-vip-modal .vip-x:hover{color:var(--text,#f3f1ea);}",
      "#pixy-vip-modal .vip-eyebrow{",
        "font-family:var(--serif,'Playfair Display'),serif;",
        "font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;",
        "color:var(--gold,#d9b96c);margin:0 0 14px;",
      "}",
      "#pixy-vip-modal h2{",
        "font-family:var(--serif,'Playfair Display'),serif;",
        "font-size:1.75rem;line-height:1.2;",
        "color:var(--text,#f3f1ea);margin:0 0 10px;",
      "}",
      "#pixy-vip-modal .vip-sub{",
        "color:var(--muted,#b8b4a9);font-size:.9rem;line-height:1.55;",
        "margin:0 0 26px;",
      "}",
      "#pixy-vip-form{display:flex;flex-direction:column;gap:11px;}",
      "#pixy-vip-email{",
        "background:var(--bg2,#12121a);",
        "border:1px solid var(--stroke,rgba(217,185,108,.22));",
        "border-radius:999px;",
        "color:var(--text,#f3f1ea);",
        "padding:13px 20px;font-size:.9rem;",
        "outline:none;width:100%;box-sizing:border-box;",
        "transition:border-color .15s;",
      "}",
      "#pixy-vip-email::placeholder{color:var(--muted2,#8f8a7d);}",
      "#pixy-vip-email:focus{border-color:var(--gold,#d9b96c);}",
      "#pixy-vip-submit{",
        "background:var(--gold,#d9b96c);color:#07070a;",
        "border:none;border-radius:999px;",
        "padding:13px 24px;font-size:.9rem;font-weight:700;",
        "letter-spacing:.04em;cursor:pointer;",
        "transition:background .2s,transform .1s;",
      "}",
      "#pixy-vip-submit:hover:not(:disabled){background:var(--gold0,#f2e6bf);}",
      "#pixy-vip-submit:active:not(:disabled){transform:scale(.98);}",
      "#pixy-vip-submit:disabled{opacity:.55;cursor:default;}",
      "#pixy-vip-msg{",
        "font-size:.82rem;min-height:18px;",
        "color:var(--gold,#d9b96c);",
        "transition:opacity .2s;",
      "}",
      "#pixy-vip-modal .vip-skip{",
        "background:none;border:none;",
        "color:var(--muted2,#8f8a7d);font-size:.78rem;",
        "cursor:pointer;text-decoration:underline;",
        "padding:0;",
      "}",
      "#pixy-vip-modal .vip-skip:hover{color:var(--muted,#b8b4a9);}"
    ].join("");
    document.head.appendChild(s);
  }

  // ── Build overlay DOM (once) ─────────────────────────────────────────────
  function buildOverlay() {
    if (overlayEl) return overlayEl;

    var overlay = document.createElement("div");
    overlay.id = "pixy-vip-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "VIP Access");

    var modal = document.createElement("div");
    modal.id = "pixy-vip-modal";

    var closeBtn = document.createElement("button");
    closeBtn.className = "vip-x";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", hideOverlay);

    var eyebrow = document.createElement("p");
    eyebrow.className = "vip-eyebrow";
    eyebrow.textContent = "Invitation Only";

    var h2 = document.createElement("h2");
    h2.textContent = "Private Access Only";

    var sub = document.createElement("p");
    sub.className = "vip-sub";
    sub.textContent = "Enter to unlock exclusive blends and early releases.";

    var form = document.createElement("form");
    form.id = "pixy-vip-form";
    form.setAttribute("novalidate", "true");

    var emailInput = document.createElement("input");
    emailInput.id = "pixy-vip-email";
    emailInput.type = "email";
    emailInput.name = "email";
    emailInput.placeholder = "Enter your email";
    emailInput.autocomplete = "email";
    emailInput.setAttribute("required", "required");

    var submitBtn = document.createElement("button");
    submitBtn.id = "pixy-vip-submit";
    submitBtn.type = "submit";
    submitBtn.textContent = "Get VIP Access";

    var msgEl = document.createElement("p");
    msgEl.id = "pixy-vip-msg";
    msgEl.setAttribute("aria-live", "polite");

    var skipBtn = document.createElement("button");
    skipBtn.className = "vip-skip";
    skipBtn.type = "button";
    skipBtn.textContent = "No thanks";
    skipBtn.addEventListener("click", hideOverlay);

    form.appendChild(emailInput);
    form.appendChild(submitBtn);
    form.appendChild(msgEl);
    form.appendChild(skipBtn);

    modal.appendChild(closeBtn);
    modal.appendChild(eyebrow);
    modal.appendChild(h2);
    modal.appendChild(sub);
    modal.appendChild(form);
    overlay.appendChild(modal);

    // Close on backdrop click
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) hideOverlay();
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.keyCode === 27) && overlay.classList.contains("vip-open")) {
        hideOverlay();
      }
    });

    // Form submission
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = emailInput.value.trim();
      if (!email) { msgEl.textContent = "Please enter your email."; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msgEl.textContent = "Please enter a valid email address.";
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
      msgEl.textContent = "";

      submitLead(email, "", "VIP", overlay._source || "popup").then(function () {
        submitBtn.textContent = "Get VIP Access";
        msgEl.textContent = "You’re in! Welcome to the VIP list.";
        emailInput.value = "";
        setTimeout(hideOverlay, 2400);
      });
    });

    document.body.appendChild(overlay);
    overlayEl = overlay;
    return overlay;
  }

  // ── Show / hide ──────────────────────────────────────────────────────────
  function showOverlay(source) {
    if (popupShown || alreadyShown() || isVipPage()) return;
    popupShown = true;
    markShown();

    injectStyles();
    var overlay = buildOverlay();
    overlay._source = source || "popup";

    // Reset form state
    var msgEl    = document.getElementById("pixy-vip-msg");
    var submitEl = document.getElementById("pixy-vip-submit");
    var emailEl  = document.getElementById("pixy-vip-email");
    if (msgEl)    { msgEl.textContent = ""; }
    if (submitEl) { submitEl.disabled = false; submitEl.textContent = "Get VIP Access"; }
    if (emailEl)  { emailEl.value = ""; }

    overlay.style.display = "flex";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("vip-open");
        var emailInput = document.getElementById("pixy-vip-email");
        if (emailInput) emailInput.focus();
      });
    });
  }

  function hideOverlay() {
    if (!overlayEl) return;
    overlayEl.classList.remove("vip-open");
    setTimeout(function () {
      if (overlayEl) overlayEl.style.display = "none";
    }, 300);
  }

  // ── Timed popup trigger (5–8 s after page load) ──────────────────────────
  function setupTimedPopup() {
    if (alreadyShown() || isVipPage()) return;
    var delay = DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN);
    setTimeout(function () {
      if (!popupShown) showOverlay("popup");
    }, delay);
  }

  // ── Exit intent trigger (mouse leaves toward top of page) ────────────────
  function setupExitIntent() {
    if (exitWired || alreadyShown() || isVipPage()) return;
    exitWired = true;
    document.addEventListener("mouseleave", function (e) {
      if (e.clientY <= 0 && !popupShown) showOverlay("exit");
    });
  }

  // ── Public API (used by chatbot.js) ──────────────────────────────────────
  window.PIXY_VIP = {
    submitLead: submitLead,
    showPopup:  showOverlay
  };

  // ── Boot ─────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    injectStyles();
    buildOverlay();
    setupTimedPopup();
    setupExitIntent();
  });

})();
