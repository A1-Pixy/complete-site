/*!
 * cms.js — Pixy Dust Seasoning
 * Lightweight admin CMS. Activate with ?admin=true in any page URL.
 *
 * FIXES vs previous version:
 *   1. Attribute selector corrected: [data-cms-text] (was [data-cms-edit])
 *   2. Restore applies text values only — never replaces innerHTML.
 *      Dynamic wiring (carousels, Ecwid, chatbot) now survives a restore.
 *   3. Each [data-cms-text] element must have a unique stable ID value,
 *      e.g. <h2 data-cms-text="home-hero-title">. The ID is the storage key.
 *
 * MARKUP CONTRACTS:
 *   [data-cms-text="unique-id"]      → editable text node
 *   [data-cms-image="unique-id"]     → swappable image src
 *   [data-cms-image-control="id"]    → input that controls a [data-cms-image]
 *   [data-cms-section]               → draggable block (reorderable within parent)
 */
(function () {
  "use strict";

  var PREFIX = "pixy_cms_v2_";

  function storageKey(pageId, fieldId) {
    return PREFIX + pageId + "__" + fieldId;
  }

  function pageId() {
    return window.location.pathname.replace(/\/$/, "") || "/";
  }

  // ─────────────────────────────────────────────────────────────────
  // RESTORE — runs on every page load, admin mode or not.
  // Applies saved text/image values WITHOUT touching innerHTML.
  // ─────────────────────────────────────────────────────────────────
  function restoreContent() {
    try {
      var pid = pageId();

      // Text fields
      var textNodes = document.querySelectorAll("[data-cms-text]");
      for (var i = 0; i < textNodes.length; i++) {
        var el = textNodes[i];
        var id = el.getAttribute("data-cms-text");
        if (!id) continue;
        var saved = localStorage.getItem(storageKey(pid, "txt__" + id));
        if (saved != null) el.textContent = saved;
      }

      // Images
      var imgNodes = document.querySelectorAll("[data-cms-image]");
      for (var j = 0; j < imgNodes.length; j++) {
        var img = imgNodes[j];
        var imgId = img.getAttribute("data-cms-image");
        if (!imgId) continue;
        var savedSrc = localStorage.getItem(storageKey(pid, "img__" + imgId));
        if (savedSrc) img.setAttribute("src", savedSrc);
      }
    } catch (e) {
      // Fail silently — never block the page.
    }
  }

  // Run as early as possible so restored text appears before paint.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", restoreContent, { once: true });
  } else {
    restoreContent();
  }

  // ─────────────────────────────────────────────────────────────────
  // ADMIN MODE — only when ?admin=true
  // ─────────────────────────────────────────────────────────────────
  function isAdmin() {
    try {
      return new URLSearchParams(window.location.search).get("admin") === "true";
    } catch (e) { return false; }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!isAdmin()) return;

    document.body.classList.add("pd-admin");

    showAdminBadge();
    enableEditableText();
    enableImageSwap();
    enableDragAndDrop();
    injectAdminStyles();
  });

  // ─────────────────────────────────────────────────────────────────
  // ADMIN BADGE
  // ─────────────────────────────────────────────────────────────────
  function showAdminBadge() {
    // Use existing badge element if present in HTML.
    var badge = document.getElementById("admin-badge");
    if (badge) {
      badge.hidden = false;
      return;
    }
    // Otherwise create one.
    var b = document.createElement("div");
    b.className = "pd-admin-badge";
    b.textContent = "Admin Mode";
    document.body.appendChild(b);
  }

  // ─────────────────────────────────────────────────────────────────
  // EDITABLE TEXT — [data-cms-text="unique-id"]
  // ─────────────────────────────────────────────────────────────────
  var saveTimer = null;

  function saveText(fieldId, value) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(storageKey(pageId(), "txt__" + fieldId), value);
      } catch (e) {}
    }, 400);
  }

  function enableEditableText() {
    var nodes = document.querySelectorAll("[data-cms-text]");
    for (var i = 0; i < nodes.length; i++) {
      (function (el) {
        var id = el.getAttribute("data-cms-text");
        if (!id) return;

        el.contentEditable = "true";
        el.spellcheck = true;
        el.style.outline = "1px dashed rgba(216,179,90,.45)";
        el.title = "Click to edit";

        el.addEventListener("input", function () {
          saveText(id, el.textContent);
        });

        el.addEventListener("blur", function () {
          saveText(id, el.textContent);
        });
      })(nodes[i]);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // IMAGE SWAP — [data-cms-image-control="unique-id"]
  //   pairs with  [data-cms-image="unique-id"]
  // ─────────────────────────────────────────────────────────────────
  function enableImageSwap() {
    var controls = document.querySelectorAll("[data-cms-image-control]");
    for (var i = 0; i < controls.length; i++) {
      (function (input) {
        var id = input.getAttribute("data-cms-image-control");
        if (!id) return;

        input.addEventListener("change", function () {
          var src = (input.value || "").trim();
          if (!src) return;

          var targets = document.querySelectorAll('[data-cms-image="' + CSS.escape(id) + '"]');
          for (var j = 0; j < targets.length; j++) {
            targets[j].setAttribute("src", src);
          }

          try {
            localStorage.setItem(storageKey(pageId(), "img__" + id), src);
          } catch (e) {}
        });
      })(controls[i]);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // DRAG-AND-DROP REORDERING — [data-cms-section]
  // Elements sharing the same direct parent are reorderable together.
  // ─────────────────────────────────────────────────────────────────
  var dragging = null;

  function enableDragAndDrop() {
    var sections = Array.from(document.querySelectorAll("[data-cms-section]"));
    if (sections.length < 2) return;

    // Group by parent.
    var byParent = new Map();
    sections.forEach(function (el) {
      var p = el.parentElement;
      if (!p) return;
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(el);
    });

    byParent.forEach(function (els, parent) {
      if (els.length < 2) return;

      els.forEach(function (el) {
        el.draggable = true;
        el.style.cursor = "grab";

        el.addEventListener("dragstart", function (e) {
          dragging = el;
          el.classList.add("pd-cms-dragging");
          try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", "");
          } catch (ex) {}
        });

        el.addEventListener("dragend", function () {
          if (dragging) dragging.classList.remove("pd-cms-dragging");
          dragging = null;
        });

        el.addEventListener("dragover", function (e) {
          if (!dragging || dragging === el) return;
          e.preventDefault();
          var rect = el.getBoundingClientRect();
          var after = (e.clientY - rect.top) > rect.height / 2;
          parent.insertBefore(dragging, after ? el.nextSibling : el);
        });

        el.addEventListener("drop", function (e) {
          e.preventDefault();
        });
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // ADMIN STYLES (injected once)
  // ─────────────────────────────────────────────────────────────────
  function injectAdminStyles() {
    if (document.getElementById("pd-cms-styles")) return;
    var style = document.createElement("style");
    style.id = "pd-cms-styles";
    style.textContent = [
      ".pd-admin-badge{",
        "position:fixed;bottom:14px;right:14px;z-index:9999;",
        "background:rgba(216,179,90,.90);color:#000;",
        "font-size:11px;letter-spacing:.12em;text-transform:uppercase;",
        "padding:6px 12px;border-radius:999px;pointer-events:none;",
      "}",
      ".pd-cms-dragging{opacity:.55;outline:2px dashed rgba(216,179,90,.65);}",
      "[contenteditable='true']:focus{",
        "outline:2px solid rgba(216,179,90,.65)!important;",
        "border-radius:4px;",
      "}"
    ].join("");
    document.head.appendChild(style);
  }

})();
