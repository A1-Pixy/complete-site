/**
 * Convert key site images to WebP using sharp.
 * Originals are kept. WebP files are placed alongside at same path with .webp extension.
 * Run: node scripts/convert-to-webp.js
 */
// Try local install first, then fall back to Netlify CLI's bundled sharp
let sharp;
try { sharp = require("sharp"); } catch (_) {
  const netlifySharp = "C:/Users/pixy/AppData/Roaming/npm/node_modules/netlify-cli/node_modules/sharp";
  sharp = require(netlifySharp);
}
const path  = require("path");
const fs    = require("fs");

const ROOT = path.join(__dirname, "..");

// All images actively referenced in HTML, CSS, or products.js static data
const FILES = [
  // Hero background (CSS)
  "assets/images/hero-bg-clean.jpg",

  // Logo + chatbot logo (all pages)
  "assets/images/PD blk.png",
  "assets/images/PD.png",

  // Gifting page hero (HTML img)
  "assets/images/gifts/3.png",
  "assets/images/gifts/6.png",
  "assets/images/gifts/9.png",

  // Gift set images used in products.js
  "assets/images/gifts/giftset-3.png",
  "assets/images/gifts/giftset-6.png",
  "assets/images/gifts/giftset-9.png",

  // Pouches (products.js + shop.html Built for Flavor section)
  "assets/images/pouches/seafood.png",
  "assets/images/pouches/jerk.png",
  "assets/images/pouches/Garlicpepper.png",
  "assets/images/pouches/fajita.png",
  "assets/images/pouches/chophouse.png",
  "assets/images/pouches/asian.png",
  "assets/images/pouches/AP-.png",
  "assets/images/pouches/sugarfree.png",
  "assets/images/pouches/smoke.png",

  // Bottles (products.js)
  "assets/images/bottles/universal-all-purpose.png",
  "assets/images/bottles/jerk.png",
  "assets/images/bottles/sugar-free-universal-all-purpose.png",
  "assets/images/bottles/deep-blue-seafood.png",
  "assets/images/bottles/garlic-pepper.png",
  "assets/images/bottles/asian.png",
  "assets/images/bottles/chophouse-steak.png",
  "assets/images/bottles/smoke-bbq.png",
  "assets/images/bottles/fajita.png",

  // Individual spices (products.js)
  "assets/images/individual-spices/worcestershire-powder.png",
  "assets/images/individual-spices/white-pepper.png",
  "assets/images/individual-spices/turmeric.png",
  "assets/images/individual-spices/smoked-salt.png",
  "assets/images/individual-spices/smoked-paprika.png",
  "assets/images/individual-spices/sea-salt.png",
  "assets/images/individual-spices/soy-sauce-powder.png",
  "assets/images/individual-spices/vinegar-powder.png",
  "assets/images/individual-spices/monk-fruit.png",
  "assets/images/individual-spices/black-pepper-chef-ground.png",
  "assets/images/individual-spices/ground-ginger.png",
  "assets/images/individual-spices/allspice-ground.png",
  "assets/images/individual-spices/red-chili-powder.png",
  "assets/images/individual-spices/paprika.png",
  "assets/images/individual-spices/onion-ground.png",
  "assets/images/individual-spices/garlic-granulate.png",
  "assets/images/individual-spices/cayenne-pepper.png",
  "assets/images/individual-spices/celery-seed.png",
  "assets/images/individual-spices/curry-powder.png",

  // Grills hero + product images (shop.html, products.js)
  "assets/images/lion-grills/outdoorkitchen.png",
  "assets/images/lion-grills/lion-l6000.png",
  "assets/images/lion-grills/lion-l75000.png",
  "assets/images/lion-grills/lion-l75000-cart.png",
  "assets/images/lion-grills/lion-l90000.png",
  "assets/images/lion-grills/Lion-cart.png",

  // Gallery images (gallery.html)
  "assets/images/Gallery/chophouse.png",
  "assets/images/Gallery/asian pork roll.png",
  "assets/images/Gallery/crab cakes.jpg",
  "assets/images/Gallery/lion.png",
  "assets/images/Gallery/pizza recipe.png",
  "assets/images/Gallery/Zen.png",
  "assets/images/Gallery/Ap scallop steak.png",

  // Juniors hero (juniors.html)
  "assets/images/Books/juniors-scene.png",

  // Books (products.js)
  "assets/images/Books/zen-pearl-market-cover.png",
  "assets/images/Books/book-classic-cover.png",
  "assets/images/Books/book-coming-soon-cover.png",

  // Bundle image (products.js)
  "assets/images/pouches/file_000000004b3471f59f1ba7668ac538ff.png",
];

async function convert(rel) {
  const src  = path.join(ROOT, rel);
  const dest = src.replace(/\.(jpe?g|png)$/i, ".webp");

  if (!fs.existsSync(src)) {
    console.warn("MISSING:", rel);
    return;
  }
  if (fs.existsSync(dest)) {
    const origSize = fs.statSync(src).size;
    const webpSize = fs.statSync(dest).size;
    console.log(`SKIP (exists) ${rel} — ${(origSize/1024).toFixed(0)}KB → ${(webpSize/1024).toFixed(0)}KB`);
    return;
  }

  const origSize = fs.statSync(src).size;
  await sharp(src).webp({ quality: 82, effort: 4 }).toFile(dest);
  const webpSize = fs.statSync(dest).size;
  const pct = Math.round((1 - webpSize / origSize) * 100);
  console.log(`OK  ${rel.padEnd(72)} ${(origSize/1024).toFixed(0)}KB → ${(webpSize/1024).toFixed(0)}KB (-${pct}%)`);
}

(async () => {
  console.log("Converting images to WebP...\n");
  let totalOrig = 0, totalWebp = 0;
  for (const f of FILES) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) totalOrig += fs.statSync(src).size;
    await convert(f);
    const dest = path.join(ROOT, f.replace(/\.(jpe?g|png)$/i, ".webp"));
    if (fs.existsSync(dest)) totalWebp += fs.statSync(dest).size;
  }
  console.log(`\nTotal: ${(totalOrig/1024/1024).toFixed(1)}MB → ${(totalWebp/1024/1024).toFixed(1)}MB`);
})();
