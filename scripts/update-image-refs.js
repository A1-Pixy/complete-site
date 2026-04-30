/**
 * Batch-update remaining HTML pages:
 * 1. Wrap logo <img> in <picture> with WebP source + fetchpriority="high"
 * 2. Add loading="lazy" + width/height to chatbot logo
 * Run: node scripts/update-image-refs.js
 */
const fs   = require("fs");
const path = require("path");

const ROOT  = path.join(__dirname, "..");
const PAGES = [
  "cart.html","checkout.html","contact.html","cookies.html",
  "faq.html","kitchen-table.html","privacy.html","recipes.html",
  "returns.html","shipping.html","spices.html","thankyou.html",
  "vip-access.html","wholesale.html"
];

// Old logo img → <picture> with WebP
const LOGO_OLD = `<img src="assets/images/PD blk.png" alt="Pixy Dust Seasoning" width="120" height="40" decoding="async" />`;
const LOGO_NEW = `<picture>\n          <source srcset="assets/images/PD blk.webp" type="image/webp" />\n          <img src="assets/images/PD blk.png" alt="Pixy Dust Seasoning" width="120" height="40" decoding="async" fetchpriority="high" />\n        </picture>`;

// Chatbot logo: add loading="lazy" + dimensions
const CHAT_OLD = `<img class="chat-logo" src="assets/images/PD.png" alt="" aria-hidden="true">`;
const CHAT_NEW = `<img class="chat-logo" src="assets/images/PD.png" alt="" aria-hidden="true" loading="lazy" width="40" height="40">`;

let changed = 0;
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) { console.log("SKIP (missing):", page); continue; }
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = html.split(LOGO_OLD).join(LOGO_NEW);
  html = html.split(CHAT_OLD).join(CHAT_NEW);
  if (html !== before) { fs.writeFileSync(file, html, "utf8"); console.log("OK:", page); changed++; }
  else { console.log("NO CHANGE:", page); }
}
console.log(`\n${changed} files updated.`);
