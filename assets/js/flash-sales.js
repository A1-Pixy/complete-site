/*!
 * flash-sales.js — Pixy Dust Seasoning
 * Controls the #flash-sale-bar element present on every page.
 *
 * USAGE: Edit the FLASH_SALE config block below to manage sales.
 * No other files need to change.
 */
(function () {
  "use strict";

  // ─────────────────────────────────────────────────────────────────
  // CONFIG — edit this block to manage flash sales
  // ─────────────────────────────────────────────────────────────────
  var FLASH_SALE = {
    // Set to true to show the bar. Set to false to hide it.
    active: false,

    // The message shown in the bar.
    message: "Limited time — use code PIXY15 for 15% off all signature blends.",

    // Optional: promo code displayed separately (null to hide).
    code: "PIXY15",

    // Optional: ISO date string. Bar auto-hides after this time.
    // Set to null to never auto-expire.
    expires: null, // e.g. "2026-07-04T23:59:59Z"

    // Optional: call-to-action link in the bar. null to hide.
    linkText: "Shop Now",
    linkHref: "shop.html",

    // Accent color for text and icon. Uses gold token by default.
    accent: "#d8b35a"
  };
  // ─────────────────────────────────────────────────────────────────

  var DISMISS_KEY = "pixy_flash_dismissed_v1";

  function shouldShow() {
    if (!FLASH_SALE.active) return false;

    if (FLASH_SALE.expires) {
      try {
        var exp = new Date(FLASH_SALE.expires).getTime();
        if (Number.isFinite(exp) && Date.now() > exp) return false;
      } catch (e) {}
    }

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return false;
    } catch (e) {}

    return true;
  }

  function buildBar(bar) {
    bar.innerHTML = "";

    var inner = document.createElement("div");
    inner.className = "flash-inner";
    inner.style.cssText = "display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:10px 48px 10px 16px;position:relative;";

    // Message
    var msg = document.createElement("span");
    msg.className = "flash-msg";
    msg.style.cssText = "font-size:13px;letter-spacing:.04em;color:" + FLASH_SALE.accent + ";";
    msg.textContent = FLASH_SALE.message;
    inner.appendChild(msg);

    // Code pill
    if (FLASH_SALE.code) {
      var pill = document.createElement("span");
      pill.className = "flash-code";
      pill.style.cssText = [
        "display:inline-flex;align-items:center;",
        "border:1px solid " + FLASH_SALE.accent + ";",
        "border-radius:999px;padding:3px 10px;",
        "font-size:12px;letter-spacing:.12em;font-weight:600;",
        "color:" + FLASH_SALE.accent + ";cursor:pointer;user-select:all;"
      ].join("");
      pill.title = "Click to copy";
      pill.textContent = FLASH_SALE.code;
      pill.addEventListener("click", function () {
        try {
          navigator.clipboard.writeText(FLASH_SALE.code).then(function () {
            pill.textContent = "Copied!";
            setTimeout(function () { pill.textContent = FLASH_SALE.code; }, 1600);
          });
        } catch (e) {}
      });
      inner.appendChild(pill);
    }

    // Link
    if (FLASH_SALE.linkHref && FLASH_SALE.linkText) {
      var link = document.createElement("a");
      link.className = "flash-link";
      link.href = FLASH_SALE.linkHref;
      link.style.cssText = [
        "font-size:12px;letter-spacing:.10em;text-decoration:underline;",
        "text-underline-offset:2px;color:" + FLASH_SALE.accent + ";",
        "text-transform:uppercase;"
      ].join("");
      link.textContent = FLASH_SALE.linkText;
      inner.appendChild(link);
    }

    // Dismiss button
    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "flash-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss");
    dismiss.style.cssText = [
      "position:absolute;right:14px;top:50%;transform:translateY(-50%);",
      "background:none;border:none;cursor:pointer;",
      "font-size:18px;line-height:1;opacity:.65;",
      "color:" + FLASH_SALE.accent + ";padding:4px;"
    ].join("");
    dismiss.innerHTML = "&times;";
    dismiss.addEventListener("click", function () {
      bar.hidden = true;
      try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
    });
    inner.appendChild(dismiss);

    bar.appendChild(inner);
  }

  function init() {
    var bar = document.getElementById("flash-sale-bar");
    if (!bar) return;

    if (!shouldShow()) {
      bar.hidden = true;
      return;
    }

    buildBar(bar);
    bar.hidden = false;
    bar.style.background = "rgba(0,0,0,.82)";
    bar.style.borderBottom = "1px solid rgba(216,179,90,.18)";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
