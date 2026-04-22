// ================================================================
// PIXY DUST — assets/js/video.js
//
// Video system: registry, card builder, YouTube/Vimeo modal,
// and zone renderer.
//
// Usage:
//   1. Add window.PIXY_VIDEOS entries to a data file or inline.
//   2. Place <div data-video-zone="home"></div> in any page.
//   3. This script populates the zone with video cards on load.
//
// Modal:
//   Clicking a card opens a YouTube/Vimeo embed in a modal overlay.
//   Pressing Escape or clicking the backdrop closes it.
//
// No dependencies beyond the DOM.
// ================================================================

(function () {
  "use strict";

  // ── Default video registry ──────────────────────────────────────
  // Override by setting window.PIXY_VIDEOS before this script loads.
  // Each entry: { id, zone, title, blurb, type, videoId, thumb }
  //   zone:    "home" | "product" | "recipe" | "grill" | string
  //   type:    "youtube" | "vimeo"
  //   videoId: YouTube/Vimeo video ID
  //   thumb:   optional thumbnail URL (auto-generated for YouTube)

  var DEFAULT_VIDEOS = [
    {
      id: "pixy-intro",
      zone: "home",
      title: "What Is Pixy Dust Seasoning?",
      blurb: "Discover the story behind our luxury gourmet blends.",
      type: "youtube",
      videoId: ""   // Set real ID when available
    },
    {
      id: "pixy-cookoff",
      zone: "home",
      title: "Pixy Dust Cook-Off",
      blurb: "Watch our seasonal cook-off challenge. Community at its best.",
      type: "youtube",
      videoId: ""
    },
    {
      id: "recipe-grilled-chicken",
      zone: "recipe",
      title: "Grilled Chicken with Pixy Gold",
      blurb: "Simple technique. Complex flavor. 30 minutes.",
      type: "youtube",
      videoId: ""
    },
    {
      id: "recipe-salmon",
      zone: "recipe",
      title: "Pan-Seared Salmon with Tropic Fire",
      blurb: "Bright citrus heat meets rich salmon. Date-night worthy.",
      type: "youtube",
      videoId: ""
    },
    {
      id: "grill-setup",
      zone: "grill",
      title: "Setting Up Your Lion Premium Grill",
      blurb: "Full setup walkthrough — zero guesswork.",
      type: "youtube",
      videoId: ""
    }
  ];

  // ── Helpers ─────────────────────────────────────────────────────
  function getVideos() {
    var v = window.PIXY_VIDEOS;
    return Array.isArray(v) ? v : DEFAULT_VIDEOS;
  }

  function ytThumb(videoId) {
    if (!videoId) return "assets/images/logo-circle.png";
    return "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
  }

  function embedUrl(entry) {
    if (!entry || !entry.videoId) return "";
    if (entry.type === "vimeo") {
      return "https://player.vimeo.com/video/" + entry.videoId + "?autoplay=1";
    }
    return "https://www.youtube.com/embed/" + entry.videoId + "?autoplay=1&rel=0";
  }

  function safeText(s) { return s == null ? "" : String(s); }

  // ── Modal ───────────────────────────────────────────────────────
  var _modal = null;

  function ensureModal() {
    if (_modal) return _modal;

    var overlay = document.createElement("div");
    overlay.id = "pixy-video-modal";
    overlay.className = "video-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Video player");
    overlay.hidden = true;
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:rgba(0,0,0,.82)",
      "z-index:9000",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:16px"
    ].join(";");

    var inner = document.createElement("div");
    inner.className = "video-modal-inner";
    inner.style.cssText = [
      "position:relative",
      "width:min(900px,100%)",
      "aspect-ratio:16/9",
      "background:#000",
      "border-radius:14px",
      "overflow:hidden",
      "box-shadow:0 40px 120px rgba(0,0,0,.75)"
    ].join(";");

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "video-modal-close";
    closeBtn.setAttribute("aria-label", "Close video");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = [
      "position:absolute",
      "top:10px",
      "right:10px",
      "z-index:2",
      "width:38px",
      "height:38px",
      "border-radius:999px",
      "border:1px solid rgba(255,255,255,.25)",
      "background:rgba(0,0,0,.55)",
      "color:#fff",
      "font-size:22px",
      "cursor:pointer",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "line-height:1"
    ].join(";");

    var frame = document.createElement("iframe");
    frame.className = "video-modal-frame";
    frame.setAttribute("frameborder", "0");
    frame.setAttribute("allowfullscreen", "true");
    frame.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
    frame.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;";
    frame.src = "";

    inner.appendChild(closeBtn);
    inner.appendChild(frame);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener("click", function (e) {
      if (!inner.contains(e.target)) closeModal();
    });

    // Close button
    closeBtn.addEventListener("click", function () { closeModal(); });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hidden) closeModal();
    });

    _modal = { overlay: overlay, frame: frame };
    return _modal;
  }

  function openModal(url, title) {
    var m = ensureModal();
    m.frame.src = url;
    m.overlay.setAttribute("aria-label", "Video: " + safeText(title));
    m.overlay.hidden = false;
    m.overlay.style.display = "flex";
  }

  function closeModal() {
    if (!_modal) return;
    _modal.overlay.hidden = true;
    _modal.overlay.style.display = "none";
    _modal.frame.src = "";
  }

  // ── Card builder ────────────────────────────────────────────────
  function buildVideoCard(entry) {
    var hasVideo = !!(entry.videoId);
    var thumb = entry.thumb || (entry.type === "youtube" && entry.videoId ? ytThumb(entry.videoId) : "assets/images/logo-circle.png");

    var article = document.createElement("article");
    article.className = "card video-card";
    article.setAttribute("data-video-id", entry.id || "");

    var thumbDiv = document.createElement("div");
    thumbDiv.className = "video-thumb";
    thumbDiv.style.backgroundImage = "url('" + thumb + "')";

    if (hasVideo) {
      var playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "video-play-btn";
      playBtn.setAttribute("aria-label", "Play " + safeText(entry.title));
      playBtn.innerHTML = '<span class="video-play-icon" aria-hidden="true">&#9654;</span>';
      playBtn.addEventListener("click", function () {
        openModal(embedUrl(entry), entry.title);
      });
      thumbDiv.appendChild(playBtn);
    } else {
      var soon = document.createElement("div");
      soon.className = "video-coming-soon";
      soon.textContent = "Coming Soon";
      thumbDiv.appendChild(soon);
    }

    var info = document.createElement("div");
    info.className = "video-info";

    var h3 = document.createElement("h3");
    h3.className = "card-title";
    h3.textContent = safeText(entry.title);

    var p = document.createElement("p");
    p.className = "muted";
    p.textContent = safeText(entry.blurb);

    info.appendChild(h3);
    info.appendChild(p);

    article.appendChild(thumbDiv);
    article.appendChild(info);

    return article;
  }

  // ── Zone renderer ───────────────────────────────────────────────
  function renderZones() {
    var zones = document.querySelectorAll("[data-video-zone]");
    if (!zones || !zones.length) return;

    var all = getVideos();

    for (var z = 0; z < zones.length; z++) {
      var zone = zones[z];
      var zoneName = zone.getAttribute("data-video-zone") || "";
      var list = all.filter(function (v) { return v && v.zone === zoneName; });

      // Only render entries that have a real videoId — leave zone empty otherwise
      // (CSS [data-video-zone]:empty { display:none } hides unpopulated zones)
      var active = list.filter(function (v) { return v.videoId && String(v.videoId).trim(); });
      if (!active.length) continue;

      zone.innerHTML = "";
      var grid = document.createElement("div");
      grid.className = "video-grid";

      for (var i = 0; i < active.length; i++) {
        grid.appendChild(buildVideoCard(active[i]));
      }
      zone.appendChild(grid);
    }
  }

  // ── Public API ──────────────────────────────────────────────────
  window.PIXY_VIDEO = {
    getVideos:    getVideos,
    buildCard:    buildVideoCard,
    openModal:    openModal,
    closeModal:   closeModal,
    renderZones:  renderZones
  };

  // ── Boot ────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    renderZones();
  });

})();
